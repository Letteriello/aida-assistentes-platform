/**
 * AIDA Platform - AI Message Processor
 * CORE: Implements intelligent message processing using RAG and memory systems
 * PATTERN: Orchestrates all AI components for contextual responses
 */

import { TenantAwareSupabase } from '../database/supabase-client';
import { MemoryIntegrator } from '../memory/memory-integrator';
import { HybridQueryEngine } from '../rag/hybrid-query-engine';
import { EvolutionAPIClient } from '../evolution-api/client';
import { WhatsAppMessageFormatter } from '../evolution-api/message-formatter';
import { logSecurityEvent } from '../database/security';
import type { AIResponse, Assistant, Conversation, Message } from '@shared/types';

/**
 * Configuration for AI processing
 */
export interface AIProcessorConfig {
  maxContextLength: number;
  temperature: number;
  maxTokens: number;
  model: string;
  enableRAG: boolean;
  enableMemory: boolean;
  responseStyle: 'professional' | 'casual' | 'friendly';
}

/**
 * Context gathered for AI processing
 */
export interface ProcessingContext {
  assistant: Assistant;
  conversation: Conversation;
  messageHistory: Message[];
  ragResults?: any[];
  memoryContext?: any;
  businessContext: {
    businessId: string;
    industry: string;
    settings: any;
  };
}

/**
 * AI processing result
 */
export interface ProcessingResult {
  response: string;
  confidence: number;
  sources?: string[];
  processingTime: number;
  tokensUsed: number;
  ragUsed: boolean;
  memoryUsed: boolean;
}

/**
 * Main AI processor class
 * CRITICAL: Core intelligence of the AIDA platform
 */
export class AIProcessor {
  private supabase: TenantAwareSupabase;
  private memoryIntegrator: MemoryIntegrator;
  private hybridQueryEngine: HybridQueryEngine;
  private messageFormatter: WhatsAppMessageFormatter;
  private config: AIProcessorConfig;

  constructor(
    supabase: TenantAwareSupabase,
    config: Partial<AIProcessorConfig> = {}
  ) {
    this.supabase = supabase;
    this.memoryIntegrator = new MemoryIntegrator(supabase);
    this.hybridQueryEngine = new HybridQueryEngine(supabase);
    this.messageFormatter = new WhatsAppMessageFormatter();
    
    this.config = {
      maxContextLength: 4000,
      temperature: 0.7,
      maxTokens: 500,
      model: 'gpt-4-turbo-preview',
      enableRAG: true,
      enableMemory: true,
      responseStyle: 'professional',
      ...config
    };
  }

  /**
   * Process incoming message with AI
   * MAIN: Primary entry point for message processing
   */
  async processMessage(
    messageContent: string,
    assistantId: string,
    conversationId: string,
    businessId: string
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      // Gather processing context
      const context = await this.gatherContext(
        messageContent,
        assistantId,
        conversationId,
        businessId
      );

      // Generate AI response
      const aiResponse = await this.generateResponse(messageContent, context);

      // Format response for WhatsApp
      const formattedMessages = this.messageFormatter.formatResponse(aiResponse);
      const finalResponse = formattedMessages.map(msg => msg.content).join('\n');

      // Store message and response
      await this.storeInteraction(
        messageContent,
        finalResponse,
        conversationId,
        context,
        aiResponse
      );

      const processingTime = Date.now() - startTime;

      return {
        response: finalResponse,
        confidence: aiResponse.confidence || 0.8,
        sources: aiResponse.sources,
        processingTime,
        tokensUsed: aiResponse.tokensUsed || 0,
        ragUsed: this.config.enableRAG && (aiResponse.sources?.length || 0) > 0,
        memoryUsed: this.config.enableMemory
      };

    } catch (error) {
      console.error('AI processing error:', error);
      logSecurityEvent('ai_processing_error', 'Error in AI message processing', businessId, {
        assistantId,
        conversationId,
        error: error instanceof Error ? error.message : String(error)
      });

      // Return fallback response
      return {
        response: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente em alguns instantes.',
        confidence: 0,
        processingTime: Date.now() - startTime,
        tokensUsed: 0,
        ragUsed: false,
        memoryUsed: false
      };
    }
  }

  /**
   * Gather all context needed for AI processing
   */
  private async gatherContext(
    messageContent: string,
    assistantId: string,
    conversationId: string,
    businessId: string
  ): Promise<ProcessingContext> {
    // Get assistant configuration
    const { data: assistant } = await this.supabase
      .from('assistants')
      .select('*')
      .eq('id', assistantId)
      .single();

    if (!assistant) {
      throw new Error('Assistant not found');
    }

    // Get conversation
    const { data: conversation } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Get recent message history
    const { data: messageHistory } = await this.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get business context
    const { data: business } = await this.supabase
      .from('businesses')
      .select('industry, settings')
      .eq('id', businessId)
      .single();

    let ragResults;
    let memoryContext;

    // Gather RAG context if enabled
    if (this.config.enableRAG) {
      try {
        const ragResponse = await this.hybridQueryEngine.search({
          query: messageContent,
          businessId,
          assistantId,
          limit: 5,
          threshold: 0.7
        });
        ragResults = ragResponse.results;
      } catch (error) {
        console.warn('RAG search failed:', error);
      }
    }

    // Gather memory context if enabled
    if (this.config.enableMemory) {
      try {
        memoryContext = await this.memoryIntegrator.getMemoryContext(
          conversationId,
          messageContent,
          { limit: 3 }
        );
      } catch (error) {
        console.warn('Memory context gathering failed:', error);
      }
    }

    return {
      assistant,
      conversation,
      messageHistory: messageHistory || [],
      ragResults,
      memoryContext,
      businessContext: {
        businessId,
        industry: business?.industry || 'general',
        settings: business?.settings || {}
      }
    };
  }

  /**
   * Generate AI response using OpenAI or similar service
   */
  private async generateResponse(
    messageContent: string,
    context: ProcessingContext
  ): Promise<AIResponse> {
    // Build system prompt
    const systemPrompt = this.buildSystemPrompt(context);
    
    // Build context for the AI
    const contextText = this.buildContextText(context);
    
    // Build conversation history
    const conversationHistory = this.buildConversationHistory(context.messageHistory);

    // Prepare messages for AI
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Contexto: ${contextText}\n\nHistórico da conversa:\n${conversationHistory}\n\nMensagem atual: ${messageContent}` }
    ];

    try {
      // Call OpenAI API (or similar)
      const response = await this.callAIService(messages);
      
      return {
        response: response.content,
        confidence: response.confidence || 0.8,
        sources: context.ragResults?.map(r => r.source) || [],
        tokensUsed: response.tokensUsed || 0,
        model: this.config.model
      };
    } catch (error) {
      console.error('AI service call failed:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Build system prompt based on assistant configuration
   */
  private buildSystemPrompt(context: ProcessingContext): string {
    const { assistant, businessContext } = context;
    
    return `Você é ${assistant.name}, um assistente de IA especializado para WhatsApp.

Descrição: ${assistant.description}

Instruções específicas:
${assistant.instructions || 'Seja útil, educado e profissional.'}

Contexto do negócio:
- Setor: ${businessContext.industry}
- Estilo de resposta: ${this.config.responseStyle}

Diretrizes:
1. Responda sempre em português brasileiro
2. Seja conciso e direto
3. Use informações do contexto quando relevante
4. Mantenha o tom ${this.config.responseStyle}
5. Se não souber algo, seja honesto
6. Evite respostas muito longas para WhatsApp

Se houver informações relevantes no contexto fornecido, use-as para dar respostas mais precisas e úteis.`;
  }

  /**
   * Build context text from RAG and memory results
   */
  private buildContextText(context: ProcessingContext): string {
    const contextParts = [];

    // Add RAG results
    if (context.ragResults && context.ragResults.length > 0) {
      contextParts.push('Informações relevantes da base de conhecimento:');
      context.ragResults.forEach((result, index) => {
        contextParts.push(`${index + 1}. ${result.content}`);
      });
    }

    // Add memory context
    if (context.memoryContext) {
      if (context.memoryContext.businessKnowledge) {
        contextParts.push('\nConhecimento do negócio:');
        contextParts.push(context.memoryContext.businessKnowledge);
      }
      
      if (context.memoryContext.similarConversations) {
        contextParts.push('\nConversas similares anteriores:');
        context.memoryContext.similarConversations.forEach((conv: any, index: number) => {
          contextParts.push(`${index + 1}. ${conv.summary}`);
        });
      }
    }

    return contextParts.length > 0 ? contextParts.join('\n') : 'Nenhum contexto adicional disponível.';
  }

  /**
   * Build conversation history text
   */
  private buildConversationHistory(messages: Message[]): string {
    if (!messages || messages.length === 0) {
      return 'Esta é a primeira mensagem da conversa.';
    }

    const historyLines = messages
      .reverse() // Show chronological order
      .slice(-5) // Last 5 messages
      .map(msg => {
        const sender = msg.sender_type === 'user' ? 'Usuário' : 'Assistente';
        return `${sender}: ${msg.content}`;
      });

    return historyLines.join('\n');
  }

  /**
   * Call AI service (OpenAI, Anthropic, etc.)
   */
  private async callAIService(messages: any[]): Promise<{
    content: string;
    confidence?: number;
    tokensUsed?: number;
  }> {
    // This would integrate with actual AI service
    // For now, return a mock response
    
    // In production, this would call:
    // - OpenAI GPT-4
    // - Anthropic Claude
    // - Local LLM
    // - etc.
    
    const mockResponse = {
      content: 'Olá! Sou seu assistente de IA. Como posso ajudá-lo hoje?',
      confidence: 0.9,
      tokensUsed: 150
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return mockResponse;
  }

  /**
   * Store interaction in database
   */
  private async storeInteraction(
    userMessage: string,
    aiResponse: string,
    conversationId: string,
    context: ProcessingContext,
    aiResult: AIResponse
  ): Promise<void> {
    try {
      // Store user message
      await this.supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: userMessage,
          sender_type: 'user',
          metadata: {
            processingContext: {
              ragUsed: this.config.enableRAG,
              memoryUsed: this.config.enableMemory,
              sources: aiResult.sources
            }
          }
        });

      // Store AI response
      await this.supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: aiResponse,
          sender_type: 'assistant',
          metadata: {
            aiResult: {
              confidence: aiResult.confidence,
              tokensUsed: aiResult.tokensUsed,
              model: aiResult.model,
              sources: aiResult.sources
            }
          }
        });

      // Update conversation last activity
      await this.supabase
        .from('conversations')
        .update({ 
          updated_at: new Date().toISOString(),
          message_count: context.conversation.message_count + 2
        })
        .eq('id', conversationId);

    } catch (error) {
      console.error('Failed to store interaction:', error);
      // Don't throw - this shouldn't break the response
    }
  }
}

/**
 * Factory function to create AI processor
 */
export function createAIProcessor(
  supabase: TenantAwareSupabase,
  config?: Partial<AIProcessorConfig>
): AIProcessor {
  return new AIProcessor(supabase, config);
}

/**
 * Process message with AI - main entry point
 * USAGE: Called from webhook handler
 */
export async function processMessageWithAI(
  messageContent: string,
  assistantId: string,
  conversationId: string,
  businessId: string,
  supabase: TenantAwareSupabase
): Promise<string> {
  const processor = createAIProcessor(supabase);
  
  const result = await processor.processMessage(
    messageContent,
    assistantId,
    conversationId,
    businessId
  );
  
  return result.response;
}