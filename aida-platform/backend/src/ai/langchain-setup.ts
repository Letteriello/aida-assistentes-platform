/**
 * AIDA Platform - LangChain Integration Setup
 * Conversation processing with memory integration and RAG capabilities
 * CRITICAL: AI orchestration layer for business assistant responses
 */

import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ConversationChain } from 'langchain/chains';
import { BufferWindowMemory, ConversationSummaryMemory } from 'langchain/memory';
import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { BaseRetriever } from '@langchain/core/retrievers';
import { Document } from '@langchain/core/documents';

import { HybridQueryEngine, HybridSearchResponse as HybridQueryResult } from '../rag/hybrid-query-engine';
import { TenantAwareSupabase } from '../database/supabase-client';
import type { AIResponse, Assistant, Conversation } from '@shared/types';

export interface LangChainConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  memoryType: 'buffer' | 'summary';
  memoryK: number;
  ragEnabled: boolean;
  hybridQueryEngine?: HybridQueryEngine;
  supabase: TenantAwareSupabase;
}

export interface ConversationContext {
  assistant: Assistant;
  conversation: Conversation;
  businessId: string;
  customerProfile?: {
    name?: string;
    phone?: string;
    previousInteractions: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    preferredLanguage: string;
  };
}

export interface ProcessingOptions {
  includeRAG: boolean;
  useMemory: boolean;
  maxContextLength: number;
  confidenceThreshold: number;
  escalationKeywords: string[];
  responseStyle: 'professional' | 'friendly' | 'casual';
}

/**
 * Custom RAG Retriever for LangChain integration
 * PATTERN: LangChain retriever interface for RAG system
 */
class AIDARetriever extends BaseRetriever {
  private hybridQueryEngine: HybridQueryEngine;
  private businessId: string;

  constructor(hybridQueryEngine: HybridQueryEngine, businessId: string) {
    super();
    this.hybridQueryEngine = hybridQueryEngine;
    this.businessId = businessId;
  }

  async _getRelevantDocuments(query: string): Promise<Document[]> {
    try {
      const ragQuery: RAGQuery = {
        query,
        business_id: this.businessId,
        max_results: 8,
        include_history: true
      };

      const result = await this.hybridQueryEngine.query(ragQuery);
      
      return result.results.map(ragResult => new Document({
        pageContent: ragResult.content,
        metadata: {
          source: ragResult.source,
          score: ragResult.score,
          source_id: ragResult.source_id,
          ...ragResult.metadata
        }
      }));
    } catch (error) {
      console.error('RAG retrieval failed:', error);
      return [];
    }
  }
}

/**
 * LangChain Conversation Processor
 * PATTERN: AI conversation orchestration with memory and RAG
 */
export class LangChainProcessor {
  private config: LangChainConfig;
  private llm: ChatOpenAI | ChatAnthropic;
  private memoryStore: Map<string, BufferWindowMemory | ConversationSummaryMemory> = new Map();

  constructor(config: LangChainConfig) {
    this.config = config;
    this.initializeLLM();
  }

  /**
   * Initialize Language Model based on provider
   * PATTERN: Provider abstraction for LLM selection
   */
  private initializeLLM(): void {
    switch (this.config.provider) {
    case 'openai':
      this.llm = new ChatOpenAI({
        modelName: this.config.model,
        openAIApiKey: this.config.apiKey,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens
      });
      break;

    case 'anthropic':
      this.llm = new ChatAnthropic({
        modelName: this.config.model,
        anthropicApiKey: this.config.apiKey,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens
      });
      break;

    default:
      throw new Error(`Unsupported LLM provider: ${this.config.provider}`);
    }
  }

  /**
   * Process incoming message and generate response
   * CRITICAL: Main conversation processing entry point
   */
  async processMessage(
    message: string,
    context: ConversationContext,
    options: ProcessingOptions = this.getDefaultOptions()
  ): Promise<AIResponse> {
    const startTime = performance.now();

    try {
      console.log(`Processing message for assistant ${context.assistant.id}: "${message}"`);

      // Check for escalation keywords
      const shouldEscalate = this.checkEscalationNeeded(message, options.escalationKeywords);
      if (shouldEscalate) {
        return this.createEscalationResponse(message, context, startTime);
      }

      // Get or create memory for this conversation
      const memory = this.getOrCreateMemory(context.conversation.id);

      // Build prompt with business context
      const prompt = this.buildPrompt(context, options);

      // Create processing chain
      const chain = await this.createProcessingChain(
        prompt,
        memory,
        context,
        options
      );

      // Execute the chain
      const response = await chain.invoke({ input: message });

      // Calculate confidence based on RAG results and response quality
      const confidence = this.calculateResponseConfidence(response, context);

      const processingTime = performance.now() - startTime;

      return {
        content: response.output || response,
        confidence,
        sources: response.sources || [],
        processing_time_ms: processingTime,
        should_escalate: false,
        intent: this.extractIntent(message),
        entities: this.extractEntities(message)
      };

    } catch (error) {
      console.error('Message processing failed:', error);
      
      // Return fallback response
      return this.createFallbackResponse(message, context, startTime);
    }
  }

  /**
   * Create LangChain processing chain with RAG and memory
   * PATTERN: Chain composition for complex AI workflows
   */
  private async createProcessingChain(
    prompt: ChatPromptTemplate,
    memory: BufferWindowMemory | ConversationSummaryMemory,
    context: ConversationContext,
    options: ProcessingOptions
  ): Promise<any> {
    if (options.includeRAG && this.config.ragEnabled && this.config.hybridQueryEngine) {
      // RAG-enabled chain
      const retriever = new AIDARetriever(
        this.config.hybridQueryEngine,
        context.businessId
      );

      return RunnableSequence.from([
        {
          input: (input: any) => input.input,
          context: retriever,
          chat_history: (input: any) => memory.chatHistory || []
        },
        prompt,
        this.llm,
        new StringOutputParser()
      ]);
    } else {
      // Simple conversation chain
      return new ConversationChain({
        llm: this.llm,
        memory,
        prompt,
        verbose: false
      });
    }
  }

  /**
   * Build dynamic prompt based on assistant and business context
   * PATTERN: Dynamic prompt construction for personalized responses
   */
  private buildPrompt(context: ConversationContext, options: ProcessingOptions): ChatPromptTemplate {
    const { assistant } = context;
    
    // Base system message with business context
    let systemMessage = `You are ${assistant.name}, an AI assistant for ${context.businessId}.

PERSONALITY: ${assistant.personality_prompt}

INSTRUCTIONS: ${assistant.system_prompt}

BUSINESS CONTEXT:
- You represent this business and should provide helpful, accurate information
- Always maintain a ${options.responseStyle} tone
- If you don't know something, say so honestly and offer to connect them with a human agent
- Keep responses concise but helpful (max ${options.maxContextLength} characters)`;

    // Add customer context if available
    if (context.customerProfile) {
      systemMessage += `

CUSTOMER CONTEXT:
- Customer name: ${context.customerProfile.name || 'Not provided'}
- Previous interactions: ${context.customerProfile.previousInteractions}
- Current sentiment: ${context.customerProfile.sentiment}
- Preferred language: ${context.customerProfile.preferredLanguage}`;
    }

    // Add RAG context if enabled
    if (options.includeRAG) {
      systemMessage += `

KNOWLEDGE BASE:
You have access to relevant business information provided as context. Use this information to answer questions accurately. If the context doesn't contain the answer, say so.

Context: {context}`;
    }

    systemMessage += `

CONVERSATION HISTORY:
{chat_history}

Current message: {input}

Respond as ${assistant.name} would, using the provided context and conversation history.`;

    return ChatPromptTemplate.fromTemplate(systemMessage);
  }

  /**
   * Get or create conversation memory
   * PATTERN: Memory management per conversation
   */
  private getOrCreateMemory(conversationId: string): BufferWindowMemory | ConversationSummaryMemory {
    let memory = this.memoryStore.get(conversationId);
    
    if (!memory) {
      if (this.config.memoryType === 'summary') {
        memory = new ConversationSummaryMemory({
          llm: this.llm,
          maxTokenLimit: this.config.maxTokens * 0.3 // Use 30% of tokens for memory
        });
      } else {
        memory = new BufferWindowMemory({
          k: this.config.memoryK,
          returnMessages: true
        });
      }
      
      this.memoryStore.set(conversationId, memory);
      
      // Load existing conversation history
      this.loadConversationHistory(conversationId, memory);
    }
    
    return memory;
  }

  /**
   * Load conversation history into memory
   * PATTERN: Historical context integration
   */
  private async loadConversationHistory(
    conversationId: string,
    memory: BufferWindowMemory | ConversationSummaryMemory
  ): Promise<void> {
    try {
      // Get recent messages from database
      const messages = await this.config.supabase.query<any>(
        'messages',
        'content, sender_type, timestamp',
        { 
          conversation_id: conversationId
          // Order by timestamp to get chronological order
        }
      );

      // Add messages to memory in chronological order
      for (const message of messages.slice(-this.config.memoryK * 2)) { // Load more than K to account for pairs
        if (message.sender_type === 'customer') {
          await memory.saveContext(
            { input: message.content },
            { output: '' } // Will be filled by next assistant message
          );
        } else if (message.sender_type === 'assistant') {
          // Update the last context with the assistant's response
          // This is a simplified approach; in practice, you'd need more sophisticated pairing
        }
      }

    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  }

  /**
   * Check if escalation is needed based on keywords or intent
   * PATTERN: Escalation detection and routing
   */
  private checkEscalationNeeded(message: string, escalationKeywords: string[]): boolean {
    const messageLower = message.toLowerCase();
    
    // Check for explicit escalation keywords
    const keywordMatch = escalationKeywords.some(keyword => 
      messageLower.includes(keyword.toLowerCase())
    );
    
    // Check for emotional indicators
    const emotionalIndicators = [
      'angry', 'frustrated', 'upset', 'disappointed', 'furious',
      'terrible', 'awful', 'horrible', 'worst', 'hate',
      'cancel', 'refund', 'complaint', 'legal', 'lawyer'
    ];
    
    const emotionalMatch = emotionalIndicators.some(indicator =>
      messageLower.includes(indicator)
    );
    
    // Check message length (very long messages might indicate complex issues)
    const isLongComplaint = message.length > 500 && messageLower.includes('problem');
    
    return keywordMatch || emotionalMatch || isLongComplaint;
  }

  /**
   * Calculate response confidence based on multiple factors
   * PATTERN: Multi-factor confidence scoring
   */
  private calculateResponseConfidence(response: any, context: ConversationContext): number {
    let confidence = 0.8; // Base confidence
    
    // Adjust based on RAG source quality
    if (response.sources && response.sources.length > 0) {
      const avgSourceScore = response.sources.reduce((sum: number, source: any) => 
        sum + (source.score || 0), 0) / response.sources.length;
      confidence = Math.min(confidence + (avgSourceScore * 0.2), 1.0);
    }
    
    // Adjust based on response length (very short might indicate uncertainty)
    if (typeof response === 'string' && response.length < 50) {
      confidence *= 0.9;
    }
    
    // Adjust based on uncertainty indicators in response
    const uncertaintyPhrases = ['i think', 'maybe', 'possibly', 'not sure', 'don\'t know'];
    if (typeof response === 'string') {
      const hasUncertainty = uncertaintyPhrases.some(phrase => 
        response.toLowerCase().includes(phrase)
      );
      if (hasUncertainty) {
        confidence *= 0.7;
      }
    }
    
    return Math.round(confidence * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Extract intent from message (simplified implementation)
   * PATTERN: Intent classification for conversation routing
   */
  private extractIntent(message: string): string {
    const messageLower = message.toLowerCase();
    
    // Simple rule-based intent detection
    if (messageLower.includes('price') || messageLower.includes('cost') || messageLower.includes('quanto')) {
      return 'pricing_inquiry';
    }
    
    if (messageLower.includes('hours') || messageLower.includes('open') || messageLower.includes('horário')) {
      return 'business_hours';
    }
    
    if (messageLower.includes('location') || messageLower.includes('address') || messageLower.includes('onde')) {
      return 'location_inquiry';
    }
    
    if (messageLower.includes('hello') || messageLower.includes('hi') || messageLower.includes('olá')) {
      return 'greeting';
    }
    
    if (messageLower.includes('help') || messageLower.includes('support') || messageLower.includes('ajuda')) {
      return 'help_request';
    }
    
    return 'general_inquiry';
  }

  /**
   * Extract entities from message (simplified implementation)
   * PATTERN: Named entity recognition for context
   */
  private extractEntities(message: string): Record<string, any> {
    const entities: Record<string, any> = {};
    
    // Extract phone numbers
    const phoneRegex = /(\+?[1-9]\d{1,14})/g;
    const phones = message.match(phoneRegex);
    if (phones) {
      entities.phone_numbers = phones;
    }
    
    // Extract email addresses
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = message.match(emailRegex);
    if (emails) {
      entities.emails = emails;
    }
    
    // Extract monetary values
    const moneyRegex = /\$\d+(?:\.\d{2})?|\d+(?:\.\d{2})?\s*(?:reais?|dollars?)/gi;
    const amounts = message.match(moneyRegex);
    if (amounts) {
      entities.monetary_amounts = amounts;
    }
    
    return entities;
  }

  /**
   * Create escalation response
   * PATTERN: Automated escalation handling
   */
  private createEscalationResponse(
    message: string,
    context: ConversationContext,
    startTime: number
  ): AIResponse {
    const escalationMessages = {
      professional: 'I understand your concern requires special attention. Let me connect you with one of our team members who can provide personalized assistance.',
      friendly: 'I can see this is important to you! Let me get one of our team members to help you right away. 😊',
      casual: 'Got it! This sounds like something our team should handle directly. Let me get someone for you right now.'
    };

    return {
      content: escalationMessages.professional, // Default to professional
      confidence: 0.9, // High confidence in escalation decision
      sources: [],
      processing_time_ms: performance.now() - startTime,
      should_escalate: true,
      intent: 'escalation_request',
      entities: this.extractEntities(message)
    };
  }

  /**
   * Create fallback response for errors
   * PATTERN: Graceful error handling
   */
  private createFallbackResponse(
    message: string,
    context: ConversationContext,
    startTime: number
  ): AIResponse {
    return {
      content: 'I apologize, but I\'m experiencing some technical difficulties right now. Let me connect you with a human agent who can assist you better.',
      confidence: 0.3,
      sources: [],
      processing_time_ms: performance.now() - startTime,
      should_escalate: true,
      intent: 'technical_error',
      entities: {}
    };
  }

  /**
   * Get default processing options
   */
  private getDefaultOptions(): ProcessingOptions {
    return {
      includeRAG: true,
      useMemory: true,
      maxContextLength: 500,
      confidenceThreshold: 0.7,
      escalationKeywords: ['manager', 'supervisor', 'complaint', 'legal'],
      responseStyle: 'friendly'
    };
  }

  /**
   * Clear memory for a conversation (useful for testing/reset)
   */
  clearConversationMemory(conversationId: string): void {
    this.memoryStore.delete(conversationId);
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<LangChainConfig>): void {
    this.config = { ...this.config, ...updates };
    if (updates.provider || updates.model || updates.apiKey) {
      this.initializeLLM();
    }
  }

  /**
   * Get processing statistics
   */
  getStats(): {
    activeConversations: number;
    totalMemorySize: number;
    provider: string;
    model: string;
    } {
    return {
      activeConversations: this.memoryStore.size,
      totalMemorySize: Array.from(this.memoryStore.values()).length,
      provider: this.config.provider,
      model: this.config.model
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.llm.invoke('Health check test');
      return !!response;
    } catch (error) {
      console.error('LangChain processor health check failed:', error);
      return false;
    }
  }
}

/**
 * Factory function to create LangChain processor
 */
export function createLangChainProcessor(config: LangChainConfig): LangChainProcessor {
  return new LangChainProcessor(config);
}

/**
 * Default LangChain configuration
 */
export function getDefaultLangChainConfig(
  supabase: TenantAwareSupabase,
  hybridQueryEngine?: HybridQueryEngine
): LangChainConfig {
  return {
    provider: 'openai',
    model: 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY || '',
    temperature: 0.7,
    maxTokens: 1000,
    memoryType: 'buffer',
    memoryK: 5,
    ragEnabled: !!hybridQueryEngine,
    hybridQueryEngine,
    supabase
  };
}