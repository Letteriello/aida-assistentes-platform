import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { Database } from '../../../shared/types/database';

type SupabaseClient = ReturnType<typeof createClient<Database>>;

interface AssistantConfigData {
  company_name?: string;
  company_industry?: string;
  company_description?: string;
  business_hours?: Record<string, string>;
  contact_info?: Record<string, any>;
  tone?: string;
  personality_traits?: string[];
  greeting_message?: string;
  fallback_message?: string;
  business_rules?: Record<string, any>;
  faqs?: FAQ[];
}

interface FAQ {
  question: string;
  answer: string;
  keywords?: string[];
  category?: string;
}

interface KnowledgeGraphNode {
  id: string;
  type: 'company' | 'product' | 'faq' | 'rule' | 'contact';
  label: string;
  properties: Record<string, any>;
}

interface KnowledgeGraphRelation {
  from: string;
  to: string;
  type: string;
  properties?: Record<string, any>;
}

interface KnowledgeGraph {
  nodes: KnowledgeGraphNode[];
  relations: KnowledgeGraphRelation[];
}

interface SearchResult {
  type: 'context' | 'product' | 'faq';
  content: string;
  similarity: number;
  metadata: Record<string, any>;
}

interface HybridSearchResult {
  structuralResults: SearchResult[];
  semanticResults: SearchResult[];
  combinedResults: SearchResult[];
  confidence: number;
}

interface ContextGenerationResult {
  success: boolean;
  context: string;
  sources: string[];
  confidence: number;
  error?: string;
}

export class HybridRAGService {
  private supabase: SupabaseClient;
  private openai: OpenAI;
  private embeddingModel: string = 'text-embedding-ada-002';
  private maxContextLength: number = 4000;
  private similarityThreshold: number = 0.7;

  constructor(supabase: SupabaseClient, openaiApiKey: string) {
    this.supabase = supabase;
    this.openai = new OpenAI({ apiKey: openaiApiKey });
  }

  /**
   * Process and store assistant configuration with embeddings and knowledge graph
   */
  async processAssistantConfig(
    instanceId: string,
    configData: AssistantConfigData
  ): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      // Generate embeddings for the configuration
      const contextText = this.buildContextText(configData);
      const embeddings = await this.generateEmbeddings(contextText);

      // Build knowledge graph
      const knowledgeGraph = this.buildKnowledgeGraph(configData);

      // Store in database
      const { error: upsertError } = await this.supabase
        .from('assistant_configs')
        .upsert({
          instance_id: instanceId,
          company_name: configData.company_name,
          company_industry: configData.company_industry,
          company_description: configData.company_description,
          business_hours: configData.business_hours || {},
          contact_info: configData.contact_info || {},
          tone: configData.tone || 'friendly',
          personality_traits: configData.personality_traits || [],
          greeting_message: configData.greeting_message,
          fallback_message: configData.fallback_message || 'Desculpe, não entendi. Pode reformular sua pergunta?',
          business_rules: configData.business_rules || {},
          faqs: configData.faqs || [],
          context_embeddings: embeddings,
          knowledge_graph_data: knowledgeGraph,
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'instance_id'
        });

      if (upsertError) {
        console.error('Error storing assistant config:', upsertError);
        return {
          success: false,
          message: 'Erro ao salvar configuração do assistente',
          error: upsertError.message
        };
      }

      return {
        success: true,
        message: 'Configuração do assistente processada com sucesso'
      };
    } catch (error) {
      console.error('Error in processAssistantConfig:', error);
      return {
        success: false,
        message: 'Erro interno ao processar configuração',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process and store product catalog with embeddings
   */
  async processProductCatalog(
    instanceId: string,
    products: Array<{
      name: string;
      description?: string;
      price?: number;
      category?: string;
      keywords?: string[];
      [key: string]: any;
    }>
  ): Promise<{ success: boolean; processed: number; errors: string[] }> {
    const errors: string[] = [];
    let processed = 0;

    for (const product of products) {
      try {
        // Generate product text for embedding
        const productText = this.buildProductText(product);
        const embeddings = await this.generateEmbeddings(productText);

        // Store product with embeddings
        const { error } = await this.supabase
          .from('product_catalogs')
          .upsert({
            instance_id: instanceId,
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            keywords: product.keywords || [],
            product_embedding: embeddings,
            is_active: true,
            updated_at: new Date().toISOString()
          });

        if (error) {
          errors.push(`Erro ao processar produto "${product.name}": ${error.message}`);
        } else {
          processed++;
        }
      } catch (error) {
        errors.push(`Erro ao processar produto "${product.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: errors.length === 0,
      processed,
      errors
    };
  }

  /**
   * Perform hybrid search combining structural and semantic approaches
   */
  async hybridSearch(
    instanceId: string,
    query: string,
    options: {
      includeProducts?: boolean;
      includeContext?: boolean;
      maxResults?: number;
    } = {}
  ): Promise<HybridSearchResult> {
    try {
      const {
        includeProducts = true,
        includeContext = true,
        maxResults = 10
      } = options;

      // Generate query embedding
      const queryEmbedding = await this.generateEmbeddings(query);

      // Perform structural search (knowledge graph)
      const structuralResults = await this.performStructuralSearch(instanceId, query);

      // Perform semantic search (vector similarity)
      const semanticResults = await this.performSemanticSearch(
        instanceId,
        queryEmbedding,
        { includeProducts, includeContext, maxResults }
      );

      // Combine and rank results
      const combinedResults = this.combineSearchResults(structuralResults, semanticResults, maxResults);

      // Calculate overall confidence
      const confidence = this.calculateSearchConfidence(combinedResults);

      return {
        structuralResults,
        semanticResults,
        combinedResults,
        confidence
      };
    } catch (error) {
      console.error('Error in hybridSearch:', error);
      return {
        structuralResults: [],
        semanticResults: [],
        combinedResults: [],
        confidence: 0
      };
    }
  }

  /**
   * Generate contextual response using hybrid search results
   */
  async generateContextualResponse(
    instanceId: string,
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<ContextGenerationResult> {
    try {
      // Perform hybrid search
      const searchResults = await this.hybridSearch(instanceId, userMessage);

      if (searchResults.combinedResults.length === 0) {
        // No relevant context found, return fallback
        const { data: config } = await this.supabase
          .from('assistant_configs')
          .select('fallback_message')
          .eq('instance_id', instanceId)
          .single();

        return {
          success: true,
          context: config?.fallback_message || 'Desculpe, não encontrei informações relevantes para sua pergunta.',
          sources: [],
          confidence: 0
        };
      }

      // Build context from search results
      const context = this.buildContextFromResults(searchResults.combinedResults);
      const sources = this.extractSources(searchResults.combinedResults);

      // Get assistant configuration for personality
      const { data: assistantConfig } = await this.supabase
        .from('assistant_configs')
        .select('*')
        .eq('instance_id', instanceId)
        .single();

      // Generate response using OpenAI with context
      const systemPrompt = this.buildSystemPrompt(assistantConfig, context);
      const response = await this.generateAIResponse(
        systemPrompt,
        userMessage,
        conversationHistory
      );

      return {
        success: true,
        context: response,
        sources,
        confidence: searchResults.confidence
      };
    } catch (error) {
      console.error('Error in generateContextualResponse:', error);
      return {
        success: false,
        context: 'Desculpe, ocorreu um erro ao processar sua mensagem.',
        sources: [],
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Private helper methods

  private async generateEmbeddings(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: text.substring(0, 8000) // Limit input length
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw new Error('Failed to generate embeddings');
    }
  }

  private buildContextText(config: AssistantConfigData): string {
    const parts: string[] = [];

    if (config.company_name) {
      parts.push(`Empresa: ${config.company_name}`);
    }

    if (config.company_industry) {
      parts.push(`Setor: ${config.company_industry}`);
    }

    if (config.company_description) {
      parts.push(`Descrição: ${config.company_description}`);
    }

    if (config.business_hours) {
      const hours = Object.entries(config.business_hours)
        .map(([day, time]) => `${day}: ${time}`)
        .join(', ');
      parts.push(`Horário de funcionamento: ${hours}`);
    }

    if (config.business_rules) {
      const rules = Object.entries(config.business_rules)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      parts.push(`Regras de negócio: ${rules}`);
    }

    if (config.faqs && config.faqs.length > 0) {
      const faqText = config.faqs
        .map(faq => `P: ${faq.question} R: ${faq.answer}`)
        .join(' ');
      parts.push(`FAQs: ${faqText}`);
    }

    return parts.join(' ');
  }

  private buildProductText(product: any): string {
    const parts: string[] = [];

    parts.push(product.name);

    if (product.description) {
      parts.push(product.description);
    }

    if (product.category) {
      parts.push(`Categoria: ${product.category}`);
    }

    if (product.keywords && product.keywords.length > 0) {
      parts.push(`Palavras-chave: ${product.keywords.join(', ')}`);
    }

    return parts.join(' ');
  }

  private buildKnowledgeGraph(config: AssistantConfigData): KnowledgeGraph {
    const nodes: KnowledgeGraphNode[] = [];
    const relations: KnowledgeGraphRelation[] = [];

    // Company node
    if (config.company_name) {
      const companyId = 'company_main';
      nodes.push({
        id: companyId,
        type: 'company',
        label: config.company_name,
        properties: {
          industry: config.company_industry,
          description: config.company_description,
          business_hours: config.business_hours,
          contact_info: config.contact_info
        }
      });

      // FAQ nodes and relations
      if (config.faqs) {
        config.faqs.forEach((faq, index) => {
          const faqId = `faq_${index}`;
          nodes.push({
            id: faqId,
            type: 'faq',
            label: faq.question,
            properties: {
              question: faq.question,
              answer: faq.answer,
              keywords: faq.keywords,
              category: faq.category
            }
          });

          relations.push({
            from: companyId,
            to: faqId,
            type: 'HAS_FAQ'
          });
        });
      }

      // Business rules nodes
      if (config.business_rules) {
        Object.entries(config.business_rules).forEach(([key, value], index) => {
          const ruleId = `rule_${index}`;
          nodes.push({
            id: ruleId,
            type: 'rule',
            label: key,
            properties: {
              rule: key,
              value: value
            }
          });

          relations.push({
            from: companyId,
            to: ruleId,
            type: 'HAS_RULE'
          });
        });
      }
    }

    return { nodes, relations };
  }

  private async performStructuralSearch(
    instanceId: string,
    query: string
  ): Promise<SearchResult[]> {
    try {
      // Get assistant config with knowledge graph
      const { data: config } = await this.supabase
        .from('assistant_configs')
        .select('knowledge_graph_data, faqs')
        .eq('instance_id', instanceId)
        .single();

      if (!config) return [];

      const results: SearchResult[] = [];
      const queryLower = query.toLowerCase();

      // Search in FAQs
      if (config.faqs) {
        for (const faq of config.faqs) {
          const questionMatch = faq.question.toLowerCase().includes(queryLower);
          const keywordMatch = faq.keywords?.some(keyword => 
            queryLower.includes(keyword.toLowerCase())
          );

          if (questionMatch || keywordMatch) {
            results.push({
              type: 'faq',
              content: `P: ${faq.question}\nR: ${faq.answer}`,
              similarity: questionMatch ? 0.9 : 0.7,
              metadata: {
                category: faq.category,
                keywords: faq.keywords
              }
            });
          }
        }
      }

      // Search in knowledge graph nodes
      if (config.knowledge_graph_data?.nodes) {
        for (const node of config.knowledge_graph_data.nodes) {
          const labelMatch = node.label.toLowerCase().includes(queryLower);
          if (labelMatch) {
            results.push({
              type: 'context',
              content: `${node.label}: ${JSON.stringify(node.properties)}`,
              similarity: 0.8,
              metadata: {
                nodeType: node.type,
                nodeId: node.id
              }
            });
          }
        }
      }

      return results.sort((a, b) => b.similarity - a.similarity);
    } catch (error) {
      console.error('Error in performStructuralSearch:', error);
      return [];
    }
  }

  private async performSemanticSearch(
    instanceId: string,
    queryEmbedding: number[],
    options: {
      includeProducts: boolean;
      includeContext: boolean;
      maxResults: number;
    }
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    try {
      // Search assistant contexts
      if (options.includeContext) {
        const { data: contextResults } = await this.supabase
          .rpc('search_assistant_contexts', {
            p_query_embedding: queryEmbedding,
            p_instance_id: instanceId,
            p_limit: Math.ceil(options.maxResults / 2),
            p_threshold: this.similarityThreshold
          });

        if (contextResults) {
          for (const result of contextResults) {
            results.push({
              type: 'context',
              content: this.formatContextResult(result),
              similarity: result.similarity,
              metadata: {
                company_name: result.company_name,
                instance_id: result.instance_id
              }
            });
          }
        }
      }

      // Search products
      if (options.includeProducts) {
        const { data: productResults } = await this.supabase
          .rpc('search_products', {
            p_query_embedding: queryEmbedding,
            p_instance_id: instanceId,
            p_limit: Math.ceil(options.maxResults / 2),
            p_threshold: this.similarityThreshold
          });

        if (productResults) {
          for (const result of productResults) {
            results.push({
              type: 'product',
              content: this.formatProductResult(result),
              similarity: result.similarity,
              metadata: {
                product_id: result.id,
                price: result.price
              }
            });
          }
        }
      }

      return results.sort((a, b) => b.similarity - a.similarity);
    } catch (error) {
      console.error('Error in performSemanticSearch:', error);
      return [];
    }
  }

  private combineSearchResults(
    structuralResults: SearchResult[],
    semanticResults: SearchResult[],
    maxResults: number
  ): SearchResult[] {
    // Combine results with weighted scoring
    const combined = [...structuralResults, ...semanticResults];
    
    // Remove duplicates and boost structural results
    const uniqueResults = combined.reduce((acc, result) => {
      const existing = acc.find(r => r.content === result.content);
      if (!existing) {
        // Boost structural results slightly
        const boostedSimilarity = structuralResults.includes(result) 
          ? Math.min(1.0, result.similarity + 0.1)
          : result.similarity;
        
        acc.push({
          ...result,
          similarity: boostedSimilarity
        });
      }
      return acc;
    }, [] as SearchResult[]);

    return uniqueResults
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults);
  }

  private calculateSearchConfidence(results: SearchResult[]): number {
    if (results.length === 0) return 0;
    
    const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
    const resultCount = Math.min(results.length / 5, 1); // Normalize by expected result count
    
    return Math.min(1.0, avgSimilarity * resultCount);
  }

  private buildContextFromResults(results: SearchResult[]): string {
    const contextParts = results
      .slice(0, 5) // Limit context length
      .map(result => result.content)
      .join('\n\n');

    return contextParts.substring(0, this.maxContextLength);
  }

  private extractSources(results: SearchResult[]): string[] {
    return results
      .map(result => {
        if (result.type === 'faq') return 'FAQ';
        if (result.type === 'product') return 'Catálogo de Produtos';
        if (result.type === 'context') return 'Informações da Empresa';
        return 'Conhecimento';
      })
      .filter((source, index, arr) => arr.indexOf(source) === index); // Remove duplicates
  }

  private buildSystemPrompt(assistantConfig: any, context: string): string {
    const personality = assistantConfig?.personality_traits?.join(', ') || 'prestativo';
    const tone = assistantConfig?.tone || 'amigável';
    const companyName = assistantConfig?.company_name || 'nossa empresa';

    return `Você é um assistente virtual da ${companyName}. Sua personalidade é ${personality} e seu tom deve ser ${tone}.

Informações relevantes para responder:
${context}

Instruções:
1. Use apenas as informações fornecidas no contexto
2. Se não souber a resposta, seja honesto e sugira entrar em contato
3. Mantenha um tom ${tone} e seja ${personality}
4. Responda em português brasileiro
5. Se perguntarem sobre produtos, use as informações do catálogo
6. Para dúvidas sobre horários ou contato, use as informações da empresa`;
  }

  private async generateAIResponse(
    systemPrompt: string,
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<string> {
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-5), // Keep last 5 messages for context
        { role: 'user', content: userMessage }
      ];

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages as any,
        max_tokens: 500,
        temperature: 0.7
      });

      return response.choices[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.';
    } catch (error) {
      console.error('Error generating AI response:', error);
      return 'Desculpe, ocorreu um erro ao gerar a resposta.';
    }
  }

  private formatContextResult(result: any): string {
    const parts: string[] = [];
    
    if (result.context_data?.company_description) {
      parts.push(`Descrição: ${result.context_data.company_description}`);
    }
    
    if (result.context_data?.business_hours) {
      const hours = Object.entries(result.context_data.business_hours)
        .map(([day, time]) => `${day}: ${time}`)
        .join(', ');
      parts.push(`Horários: ${hours}`);
    }
    
    if (result.context_data?.business_rules) {
      const rules = Object.entries(result.context_data.business_rules)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      parts.push(`Regras: ${rules}`);
    }
    
    return parts.join('\n');
  }

  private formatProductResult(result: any): string {
    const parts: string[] = [result.name];
    
    if (result.description) {
      parts.push(result.description);
    }
    
    if (result.price) {
      parts.push(`Preço: R$ ${result.price.toFixed(2)}`);
    }
    
    return parts.join(' - ');
  }
}

// Factory function
export function createHybridRAGService(
  supabase: SupabaseClient,
  openaiApiKey: string
): HybridRAGService {
  return new HybridRAGService(supabase, openaiApiKey);
}

// Export types
export type {
  AssistantConfigData,
  FAQ,
  KnowledgeGraph,
  SearchResult,
  HybridSearchResult,
  ContextGenerationResult
};