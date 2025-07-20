import { AIModelRouter, ModelComplexity } from './ai-model-router.service';
import { RAGEngineV2, RetrievalResult } from './rag-engine-v2.service';
import { CacheManager } from './cache-manager.service';
import { AutomationEngine } from './automation-engine.service';
import { SupabaseClient } from '@supabase/supabase-js';

export interface IncomingMessage {
  instanceId: string;
  businessId: string;
  from: string;
  content: string;
  timestamp: Date;
  conversationId: string;
  messageType: 'text' | 'image' | 'document' | 'audio';
  messageId: string;
  customerName?: string;
}

export interface MessageContext {
  conversationHistory: string[];
  knowledgeBase: string;
  businessInfo: {
    name: string;
    type: string;
    hours: string;
    policies: string;
    description?: string;
  };
  ragContext?: RetrievalResult;
  customerProfile?: {
    name: string;
    segment: string;
    lastInteraction: Date;
    messageCount: number;
  };
}

export interface ProcessedResponse {
  content: string;
  model: string;
  responseTime: number;
  confidence: number;
  sources: string[];
  cost: number;
}

export class WhatsAppMessageService {
  private aiRouter: AIModelRouter;
  private ragEngine: RAGEngineV2;
  private cacheManager: CacheManager;
  private automationEngine: AutomationEngine;
  private supabase: SupabaseClient;
  
  constructor(supabase: SupabaseClient, neo4jDriver?: any) {
    this.supabase = supabase;
    this.aiRouter = new AIModelRouter();
    this.cacheManager = new CacheManager();
    this.ragEngine = new RAGEngineV2(supabase, neo4jDriver);
    this.automationEngine = new AutomationEngine(this.aiRouter, this.cacheManager);
  }

  async processMessage(message: IncomingMessage): Promise<ProcessedResponse> {
    const startTime = Date.now();
    
    try {
      // 1. Check cache for recent similar messages
      const cacheKey = `message:${message.businessId}:${this.hashMessage(message.content)}`;
      const cachedResponse = await this.cacheManager.get<ProcessedResponse>(cacheKey);
      
      if (cachedResponse) {
        console.log('Using cached response for message');
        await this.sendWhatsAppMessage(message.instanceId, message.from, cachedResponse.content);
        return cachedResponse;
      }

      // 2. Run automation engine first (for immediate responses)
      await this.automationEngine.processMessage({
        instanceId: message.instanceId,
        businessId: message.businessId,
        from: message.from,
        content: message.content,
        timestamp: message.timestamp
      });

      // 3. Analyze message complexity
      const complexity = this.analyzeMessageComplexity(message.content);
      
      // 4. Retrieve context using RAG Engine v2
      const ragContext = await this.ragEngine.hybridRetrieval(
        message.content,
        message.businessId,
        {
          maxResults: complexity === 'complex' ? 15 : 8,
          threshold: 0.7,
          useCache: true,
          enableGraphExpansion: complexity === 'complex'
        }
      );

      // 5. Build comprehensive context
      const context = await this.buildComprehensiveContext(message, ragContext);
      const contextSize = this.calculateContextSize(context);
      
      // 6. Build optimized prompt
      const prompt = this.buildOptimizedPrompt(message.content, context);
      
      // 7. Route to optimal AI model
      const aiResponse = await this.aiRouter.routeToOptimalModel({
        prompt,
        complexity,
        contextSize,
        requiresThinking: complexity === 'complex' || ragContext.confidence < 0.6,
        businessId: message.businessId,
        conversationId: message.conversationId
      });
      
      // 8. Prepare processed response
      const processedResponse: ProcessedResponse = {
        content: aiResponse.content,
        model: aiResponse.model,
        responseTime: Date.now() - startTime,
        confidence: ragContext.confidence,
        sources: ragContext.sources,
        cost: aiResponse.usage.cost
      };

      // 9. Cache successful response
      await this.cacheManager.set(cacheKey, processedResponse, { ttl: 3600 });
      
      // 10. Send response via WhatsApp
      await this.sendWhatsAppMessage(message.instanceId, message.from, processedResponse.content);
      
      // 11. Save conversation and analytics
      await this.saveConversationWithAnalytics(message, processedResponse, context);
      
      return processedResponse;
      
    } catch (error) {
      console.error('Error processing message:', error);
      await this.sendErrorMessage(message.instanceId, message.from);
      
      // Return error response
      return {
        content: 'Desculpe, ocorreu um erro temporário. Tente novamente em alguns minutos.',
        model: 'error',
        responseTime: Date.now() - startTime,
        confidence: 0,
        sources: [],
        cost: 0
      };
    }
  }

  private analyzeMessageComplexity(content: string): ModelComplexity {
    // Análise heurística da complexidade
    const indicators = {
      simple: ['oi', 'olá', 'preço', 'horário', 'sim', 'não', 'obrigado', 'tchau'],
      complex: ['problema', 'reclamação', 'cancelar', 'resolver', 'detalhes', 'explicar', 'dúvida', 'ajuda']
    };
    
    const words = content.toLowerCase().split(' ');
    const wordCount = words.length;
    
    // Verificar indicadores complexos
    if (words.some(word => indicators.complex.includes(word))) {
      return 'complex';
    }
    
    // Mensagens longas ou com perguntas são médias
    if (wordCount > 50 || content.includes('?') || content.includes('como') || content.includes('quando')) {
      return 'medium';
    }
    
    // Verificar indicadores simples
    if (words.some(word => indicators.simple.includes(word)) && wordCount <= 10) {
      return 'simple';
    }
    
    // Default para médio se não conseguir classificar
    return 'medium';
  }

  private async getContextSize(businessId: string, conversationId: string): Promise<number> {
    // Calcular tamanho do contexto (mensagens recentes + knowledge base)
    try {
      // Buscar últimas 10 mensagens da conversa
      const recentMessages = await this.getRecentMessages(conversationId, 10);
      const messagesSize = recentMessages.reduce((total, msg) => total + msg.length, 0);
      
      // Buscar tamanho da base de conhecimento do negócio
      const knowledgeBaseSize = await this.getKnowledgeBaseSize(businessId);
      
      return messagesSize + knowledgeBaseSize;
    } catch (error) {
      console.error('Error calculating context size:', error);
      return 10000; // Default size
    }
  }

  private async retrieveContext(query: string, businessId: string): Promise<MessageContext> {
    // Implementar busca de contexto (RAG)
    // Por enquanto, retornar contexto básico
    return {
      conversationHistory: await this.getRecentMessages(query, 5),
      knowledgeBase: await this.getBusinessKnowledge(businessId),
      businessInfo: await this.getBusinessInfo(businessId)
    };
  }

  private buildPrompt(userMessage: string, context: MessageContext): string {
    return `
Você é um assistente de IA para ${context.businessInfo.name}, uma empresa do tipo ${context.businessInfo.type}.

INFORMAÇÕES DA EMPRESA:
- Nome: ${context.businessInfo.name}
- Horário de funcionamento: ${context.businessInfo.hours}
- Políticas: ${context.businessInfo.policies}

BASE DE CONHECIMENTO:
${context.knowledgeBase}

HISTÓRICO DA CONVERSA:
${context.conversationHistory.join('\n')}

MENSAGEM DO CLIENTE:
${userMessage}

INSTRUÇÕES:
1. Responda de forma profissional e amigável
2. Use as informações da base de conhecimento quando relevante
3. Se não souber algo, seja honesto e ofereça alternativas
4. Mantenha respostas concisas (máximo 200 palavras)
5. Use o contexto da conversa para personalizar a resposta

RESPOSTA:`;
  }

  private async sendWhatsAppMessage(instanceId: string, phoneNumber: string, message: string): Promise<void> {
    // Implementar envio de mensagem via Evolution API
    // Por enquanto, apenas log
    console.log(`Sending to ${phoneNumber} via ${instanceId}: ${message}`);
  }

  private async sendErrorMessage(instanceId: string, phoneNumber: string): Promise<void> {
    const errorMessage = "Desculpe, ocorreu um erro temporário. Tente novamente em alguns minutos.";
    await this.sendWhatsAppMessage(instanceId, phoneNumber, errorMessage);
  }

  private async saveConversation(message: IncomingMessage, aiResponse: any): Promise<void> {
    // Implementar salvamento da conversa no banco
    console.log(`Saving conversation for ${message.businessId}`);
  }

  // Novos métodos auxiliares integrados
  private hashMessage(content: string): string {
    // Simple hash for caching similar messages
    return require('crypto').createHash('md5').update(content.toLowerCase().trim()).digest('hex');
  }

  private async buildComprehensiveContext(message: IncomingMessage, ragContext: RetrievalResult): Promise<MessageContext> {
    const [conversationHistory, businessInfo, customerProfile] = await Promise.all([
      this.getRecentMessages(message.conversationId, 10),
      this.getBusinessInfo(message.businessId),
      this.getCustomerProfile(message.from, message.businessId)
    ]);

    return {
      conversationHistory,
      knowledgeBase: ragContext.documents.map(doc => doc.content).join('\n\n'),
      businessInfo,
      ragContext,
      customerProfile
    };
  }

  private calculateContextSize(context: MessageContext): number {
    const conversationSize = context.conversationHistory.join(' ').length;
    const knowledgeSize = context.knowledgeBase.length;
    const businessInfoSize = JSON.stringify(context.businessInfo).length;
    
    return conversationSize + knowledgeSize + businessInfoSize;
  }

  private buildOptimizedPrompt(userMessage: string, context: MessageContext): string {
    const ragSources = context.ragContext?.sources.join(', ') || 'base de conhecimento';
    const confidence = context.ragContext?.confidence || 0;
    
    return `
Você é ${context.businessInfo.name}, um assistente de IA especializado em ${context.businessInfo.type}.

INFORMAÇÕES DA EMPRESA:
- Nome: ${context.businessInfo.name}
- Tipo: ${context.businessInfo.type}
- Horário: ${context.businessInfo.hours}
- Políticas: ${context.businessInfo.policies}
${context.businessInfo.description ? `- Descrição: ${context.businessInfo.description}` : ''}

PERFIL DO CLIENTE:
${context.customerProfile ? `
- Nome: ${context.customerProfile.name}
- Segmento: ${context.customerProfile.segment}
- Mensagens anteriores: ${context.customerProfile.messageCount}
- Última interação: ${context.customerProfile.lastInteraction.toLocaleDateString('pt-BR')}
` : '- Cliente novo ou perfil não disponível'}

CONTEXTO RELEVANTE (Confiança: ${Math.round(confidence * 100)}%):
${context.knowledgeBase || 'Nenhum contexto específico encontrado.'}

HISTÓRICO DA CONVERSA (últimas mensagens):
${context.conversationHistory.slice(-5).join('\n') || 'Primeira mensagem da conversa.'}

MENSAGEM DO CLIENTE:
"${userMessage}"

INSTRUÇÕES:
1. Responda como ${context.businessInfo.name}, mantendo o tom profissional mas amigável
2. Use as informações do contexto quando relevantes (confiança: ${Math.round(confidence * 100)}%)
3. Se a confiança for baixa (<60%), seja honesto sobre limitações e ofereça ajuda geral
4. Personalize com base no perfil do cliente quando disponível
5. Mantenha respostas concisas (máximo 150 palavras)
6. Se apropriado, mencione que as informações vêm de: ${ragSources}

RESPOSTA:`;
  }

  private async saveConversationWithAnalytics(
    message: IncomingMessage, 
    response: ProcessedResponse, 
    context: MessageContext
  ): Promise<void> {
    try {
      // Save conversation
      await this.supabase.from('conversations').insert({
        id: message.conversationId,
        business_id: message.businessId,
        customer_phone: message.from,
        customer_name: message.customerName || context.customerProfile?.name,
        last_message_at: new Date(),
        message_count: (context.customerProfile?.messageCount || 0) + 1,
        updated_at: new Date()
      });

      // Save message
      await this.supabase.from('messages').insert({
        id: message.messageId,
        conversation_id: message.conversationId,
        from_customer: true,
        content: message.content,
        message_type: message.messageType,
        timestamp: message.timestamp
      });

      // Save AI response
      await this.supabase.from('messages').insert({
        conversation_id: message.conversationId,
        from_customer: false,
        content: response.content,
        message_type: 'text',
        timestamp: new Date(),
        ai_model: response.model,
        response_time_ms: response.responseTime,
        confidence_score: response.confidence,
        cost: response.cost
      });

      // Save analytics
      await this.supabase.from('message_analytics').insert({
        business_id: message.businessId,
        message_id: message.messageId,
        model_used: response.model,
        complexity: this.analyzeMessageComplexity(message.content),
        response_time_ms: response.responseTime,
        confidence_score: response.confidence,
        cost: response.cost,
        sources_used: response.sources,
        cache_hit: false, // Would be true if response was cached
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error saving conversation analytics:', error);
    }
  }

  private async getCustomerProfile(phone: string, businessId: string): Promise<MessageContext['customerProfile'] | undefined> {
    try {
      const { data } = await this.supabase
        .from('customers')
        .select('name, segment, last_interaction_at, message_count')
        .eq('phone', phone)
        .eq('business_id', businessId)
        .single();

      if (data) {
        return {
          name: data.name || 'Cliente',
          segment: data.segment || 'default',
          lastInteraction: new Date(data.last_interaction_at),
          messageCount: data.message_count || 0
        };
      }
    } catch (error) {
      console.log('Customer profile not found, treating as new customer');
    }
    
    return undefined;
  }

  // Métodos auxiliares atualizados
  private async getRecentMessages(conversationId: string, limit: number): Promise<string[]> {
    try {
      const { data } = await this.supabase
        .from('messages')
        .select('content, from_customer, timestamp')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (data) {
        return data
          .reverse() // Show chronological order
          .map(msg => `${msg.from_customer ? 'Cliente' : 'Assistente'}: ${msg.content}`);
      }
    } catch (error) {
      console.error('Error fetching recent messages:', error);
    }
    
    return [];
  }

  private async getBusinessInfo(businessId: string): Promise<MessageContext['businessInfo']> {
    try {
      const { data } = await this.supabase
        .from('businesses')
        .select('name, business_type, operating_hours, policies, description')
        .eq('id', businessId)
        .single();

      if (data) {
        return {
          name: data.name || 'Empresa',
          type: data.business_type || 'Comércio',
          hours: data.operating_hours || '9h às 18h',
          policies: data.policies || 'Consulte nossas políticas no site',
          description: data.description
        };
      }
    } catch (error) {
      console.error('Error fetching business info:', error);
    }

    // Default fallback
    return {
      name: "Empresa",
      type: "Comércio", 
      hours: "9h às 18h",
      policies: "Consulte nossas políticas"
    };
  }
}