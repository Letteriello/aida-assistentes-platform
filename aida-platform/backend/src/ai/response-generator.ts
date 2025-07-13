/**
 * AIDA Platform - AI Response Generator
 * Orchestrates the complete AI pipeline: RAG + LangChain + Memory + Formatting
 * CRITICAL: Main AI engine that generates intelligent WhatsApp responses
 */

import { ConversationContext, LangChainProcessor, ProcessingOptions } from './langchain-setup';
import { HybridQueryEngine } from '../rag/hybrid-query-engine';
import { EmbeddingService } from '../rag/embedding-service';
import { VectorSearchService } from '../rag/vector-search';
import { FormattedMessage, WhatsAppMessageFormatter } from '../evolution-api/message-formatter';
import { TenantAwareSupabase } from '../database/supabase-client';
import { logSecurityEvent } from '../database/security';
import type { AIResponse, Assistant, Conversation, Message } from '@shared/types';

export interface ResponseGeneratorConfig {
  langChainProcessor: LangChainProcessor;
  hybridQueryEngine: HybridQueryEngine;
  embeddingService: EmbeddingService;
  vectorSearchEngine: VectorSearchService;
  messageFormatter: WhatsAppMessageFormatter;
  supabase: TenantAwareSupabase;
  
  // Response configuration
  maxResponseTime: number;
  enableAsync: boolean;
  fallbackEnabled: boolean;
  confidenceThreshold: number;
  
  // Quality controls
  enableContentFilter: boolean;
  enableFactChecking: boolean;
  enablePersonalization: boolean;
}

export interface ResponseRequest {
  message: string;
  conversationId: string;
  assistantId: string;
  businessId: string;
  customerMetadata?: {
    name?: string;
    phone?: string;
    language?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
  };
  processingOptions?: Partial<ProcessingOptions>;
}

export interface ResponseResult {
  success: boolean;
  response?: {
    content: AIResponse;
    formattedMessages: FormattedMessage[];
    processingTimeMs: number;
    confidence: number;
    shouldEscalate: boolean;
  };
  error?: {
    type: 'processing' | 'timeout' | 'content_filter' | 'rate_limit' | 'unknown';
    message: string;
    details?: any;
  };
  metadata: {
    requestId: string;
    timestamp: Date;
    assistantId: string;
    conversationId: string;
    fallbackUsed: boolean;
  };
}

export interface ResponseStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageProcessingTime: number;
  averageConfidence: number;
  escalationRate: number;
  fallbackRate: number;
}

/**
 * AI Response Generator - Complete AI Pipeline Orchestration
 * PATTERN: Coordinated AI pipeline with quality controls and monitoring
 */
export class AIResponseGenerator {
  private config: ResponseGeneratorConfig;
  private stats: ResponseStats;
  private activeRequests: Map<string, Promise<ResponseResult>> = new Map();

  // Response quality tracking
  private responseQuality = {
    contentFiltered: 0,
    factCheckFailed: 0,
    lowConfidence: 0,
    escalations: 0
  };

  constructor(config: ResponseGeneratorConfig) {
    this.config = config;
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageProcessingTime: 0,
      averageConfidence: 0,
      escalationRate: 0,
      fallbackRate: 0
    };
  }

  /**
   * Generate AI response for incoming message
   * CRITICAL: Main response generation entry point
   */
  async generateResponse(request: ResponseRequest): Promise<ResponseResult> {
    const requestId = this.generateRequestId();
    const startTime = performance.now();

    console.log(`Generating response for request ${requestId}: "${request.message}"`);

    try {
      this.stats.totalRequests++;

      // Validate request
      this.validateRequest(request);

      // Check for duplicate processing
      const duplicateKey = `${request.conversationId}-${this.hashMessage(request.message)}`;
      if (this.activeRequests.has(duplicateKey)) {
        console.log(`Duplicate request detected: ${duplicateKey}`);
        return await this.activeRequests.get(duplicateKey)!;
      }

      // Process request with timeout
      const processingPromise = this.processWithTimeout(request, requestId, startTime);
      this.activeRequests.set(duplicateKey, processingPromise);

      try {
        const result = await processingPromise;
        this.updateSuccessStats(result);
        return result;
      } finally {
        this.activeRequests.delete(duplicateKey);
      }

    } catch (error) {
      this.stats.failedRequests++;
      console.error(`Response generation failed for request ${requestId}:`, error);

      // Log security event for suspicious activity
      logSecurityEvent('ai_failure', {
        requestId,
        assistantId: request.assistantId,
        error: error instanceof Error ? error.message : String(error)
      }, request.businessId);

      return this.createErrorResponse(
        requestId,
        request,
        'unknown',
        error instanceof Error ? error.message : 'Unknown error occurred',
        startTime
      );
    }
  }

  /**
   * Process request with timeout protection
   * PATTERN: Timeout-protected AI processing
   */
  private async processWithTimeout(
    request: ResponseRequest,
    requestId: string,
    startTime: number
  ): Promise<ResponseResult> {
    return Promise.race([
      this.processRequest(request, requestId, startTime),
      this.createTimeoutPromise(requestId, request, startTime)
    ]);
  }

  /**
   * Core request processing logic
   * PATTERN: Complete AI pipeline execution
   */
  private async processRequest(
    request: ResponseRequest,
    requestId: string,
    startTime: number
  ): Promise<ResponseResult> {
    // 1. Load conversation context
    const context = await this.loadConversationContext(request);

    // 2. Pre-process message and update embeddings if needed
    await this.preprocessMessage(request, context);

    // 3. Generate AI response using LangChain + RAG
    const aiResponse = await this.generateAIResponse(request, context);

    // 4. Post-process response (quality controls)
    const processedResponse = await this.postProcessResponse(aiResponse, request, context);

    // 5. Format response for WhatsApp
    const formattedMessages = this.formatResponse(processedResponse, context);

    // 6. Store response in database
    await this.storeResponse(request, processedResponse, context);

    const processingTime = performance.now() - startTime;

    return {
      success: true,
      response: {
        content: processedResponse,
        formattedMessages,
        processingTimeMs: processingTime,
        confidence: processedResponse.confidence,
        shouldEscalate: processedResponse.should_escalate
      },
      metadata: {
        requestId,
        timestamp: new Date(),
        assistantId: request.assistantId,
        conversationId: request.conversationId,
        fallbackUsed: false
      }
    };
  }

  /**
   * Load complete conversation context for AI processing
   * PATTERN: Context aggregation from multiple sources
   */
  private async loadConversationContext(request: ResponseRequest): Promise<ConversationContext> {
    try {
      // Load assistant
      const assistants = await this.config.supabase.query<Assistant>(
        'assistants',
        '*',
        { id: request.assistantId, is_active: true }
      );

      if (assistants.length === 0) {
        throw new Error(`Assistant not found: ${request.assistantId}`);
      }

      // Load conversation
      const conversations = await this.config.supabase.query<Conversation>(
        'conversations',
        '*',
        { id: request.conversationId }
      );

      if (conversations.length === 0) {
        throw new Error(`Conversation not found: ${request.conversationId}`);
      }

      // Build customer profile
      const customerProfile = await this.buildCustomerProfile(
        request.conversationId,
        request.customerMetadata
      );

      return {
        assistant: assistants[0],
        conversation: conversations[0],
        businessId: request.businessId,
        customerProfile
      };

    } catch (error) {
      console.error('Failed to load conversation context:', error);
      throw new Error(`Context loading failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Build customer profile from conversation history and metadata
   * PATTERN: Customer intelligence aggregation
   */
  private async buildCustomerProfile(
    conversationId: string,
    customerMetadata?: ResponseRequest['customerMetadata']
  ): Promise<ConversationContext['customerProfile']> {
    try {
      // Get conversation statistics
      const messages = await this.config.supabase.query<Message>(
        'messages',
        'sender_type, content, timestamp',
        { conversation_id: conversationId }
      );

      const customerMessages = messages.filter(m => m.sender_type === 'customer');
      const previousInteractions = customerMessages.length;

      // Analyze sentiment from recent messages
      const recentMessages = customerMessages
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);

      const sentiment = this.analyzeSentiment(recentMessages.map(m => m.content));

      return {
        name: customerMetadata?.name,
        phone: customerMetadata?.phone,
        previousInteractions,
        sentiment: customerMetadata?.sentiment || sentiment,
        preferredLanguage: customerMetadata?.language || 'pt'
      };

    } catch (error) {
      console.error('Failed to build customer profile:', error);
      return {
        previousInteractions: 0,
        sentiment: 'neutral',
        preferredLanguage: 'pt'
      };
    }
  }

  /**
   * Pre-process incoming message and update embeddings
   * PATTERN: Message preprocessing with embedding generation
   */
  private async preprocessMessage(
    request: ResponseRequest,
    context: ConversationContext
  ): Promise<void> {
    try {
      // Generate embedding for the incoming message
      await this.config.embeddingService.queueEmbeddingRequest({
        text: request.message,
        metadata: {
          source: 'message',
          sourceId: request.conversationId,
          businessId: request.businessId
        }
      });

      // Update conversation context if this is a significant message
      if (request.message.length > 50) {
        const currentSummary = context.conversation.context_summary || '';
        const updatedSummary = this.updateConversationSummary(
          currentSummary,
          request.message
        );

        await this.config.supabase.update<Conversation>(
          'conversations',
          context.conversation.id,
          { context_summary: updatedSummary }
        );
      }

    } catch (error) {
      console.error('Message preprocessing failed:', error);
      // Continue processing even if preprocessing fails
    }
  }

  /**
   * Generate AI response using LangChain processor
   * PATTERN: AI response generation with context
   */
  private async generateAIResponse(
    request: ResponseRequest,
    context: ConversationContext
  ): Promise<AIResponse> {
    const processingOptions: ProcessingOptions = {
      includeRAG: true,
      useMemory: true,
      maxContextLength: context.assistant.settings.max_response_length || 500,
      confidenceThreshold: context.assistant.settings.confidence_threshold || 0.7,
      escalationKeywords: context.assistant.settings.escalation_keywords || [],
      responseStyle: this.determineResponseStyle(context),
      ...request.processingOptions
    };

    return await this.config.langChainProcessor.processMessage(
      request.message,
      context,
      processingOptions
    );
  }

  /**
   * Post-process AI response with quality controls
   * PATTERN: Response quality assurance
   */
  private async postProcessResponse(
    response: AIResponse,
    request: ResponseRequest,
    context: ConversationContext
  ): Promise<AIResponse> {
    let processedResponse = { ...response };

    // Content filtering
    if (this.config.enableContentFilter) {
      const filterResult = this.filterContent(processedResponse.content);
      if (!filterResult.isAppropriate) {
        this.responseQuality.contentFiltered++;
        processedResponse = await this.generateFallbackResponse(request, context);
      }
    }

    // Fact checking (simplified implementation)
    if (this.config.enableFactChecking && processedResponse.confidence < 0.6) {
      processedResponse.content += '\n\nPlease verify this information with our team if needed.';
      processedResponse.confidence = Math.max(processedResponse.confidence, 0.4);
    }

    // Personalization
    if (this.config.enablePersonalization && context.customerProfile?.name) {
      processedResponse.content = this.personalizeResponse(
        processedResponse.content,
        context.customerProfile.name
      );
    }

    // Low confidence handling
    if (processedResponse.confidence < this.config.confidenceThreshold) {
      this.responseQuality.lowConfidence++;
      processedResponse.should_escalate = true;
    }

    return processedResponse;
  }

  /**
   * Format AI response for WhatsApp delivery
   * PATTERN: Response formatting for messaging platform
   */
  private formatResponse(
    response: AIResponse,
    context: ConversationContext
  ): FormattedMessage[] {
    // Configure formatter based on assistant settings
    this.config.messageFormatter.updateConfig({
      maxMessageLength: context.assistant.settings.max_response_length || 500,
      businessStyle: this.determineResponseStyle(context),
      enableEmojis: true,
      enableFormatting: true
    });

    return this.config.messageFormatter.formatResponse(response);
  }

  /**
   * Store AI response in database for tracking
   * PATTERN: Response persistence and analytics
   */
  private async storeResponse(
    request: ResponseRequest,
    response: AIResponse,
    context: ConversationContext
  ): Promise<void> {
    try {
      // Store the assistant's response message
      await this.config.supabase.insert<Message>('messages', {
        conversation_id: request.conversationId,
        content: response.content,
        sender_type: 'assistant',
        message_type: 'text',
        timestamp: new Date(),
        metadata: {
          confidence_score: response.confidence,
          intent: response.intent,
          entities: response.entities,
          processing_time_ms: response.processing_time_ms,
          sources: response.sources
        },
        is_processed: true,
        processing_time_ms: response.processing_time_ms
      });

      // Update assistant metrics
      const currentMetrics = context.assistant.metrics || {
        total_conversations: 0,
        total_messages: 0,
        avg_response_time_ms: 0,
        satisfaction_rating: 0
      };

      const updatedMetrics = {
        ...currentMetrics,
        total_messages: currentMetrics.total_messages + 1,
        avg_response_time_ms: Math.round(
          ((currentMetrics.avg_response_time_ms * (currentMetrics.total_messages - 1)) +
           response.processing_time_ms) / currentMetrics.total_messages
        ),
        last_active_at: new Date()
      };

      await this.config.supabase.update<Assistant>(
        'assistants',
        context.assistant.id,
        { metrics: updatedMetrics }
      );

    } catch (error) {
      console.error('Failed to store response:', error);
      // Don't throw error - response generation was successful
    }
  }

  /**
   * Utility methods
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private hashMessage(message: string): string {
    // Simple hash for duplicate detection
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private validateRequest(request: ResponseRequest): void {
    if (!request.message || request.message.trim().length === 0) {
      throw new Error('Message is required');
    }

    if (!request.conversationId || !request.assistantId || !request.businessId) {
      throw new Error('Conversation ID, Assistant ID, and Business ID are required');
    }

    if (request.message.length > 4000) {
      throw new Error('Message too long');
    }
  }

  private determineResponseStyle(context: ConversationContext): 'professional' | 'friendly' | 'casual' {
    // Simple style determination based on business type or assistant settings
    // In practice, this could be more sophisticated
    return 'friendly';
  }

  private analyzeSentiment(messages: string[]): 'positive' | 'neutral' | 'negative' {
    // Simplified sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'satisfied', 'love'];
    const negativeWords = ['bad', 'terrible', 'awful', 'angry', 'frustrated', 'hate'];

    let positiveCount = 0;
    let negativeCount = 0;

    messages.forEach(message => {
      const lowerMessage = message.toLowerCase();
      positiveWords.forEach(word => {
        if (lowerMessage.includes(word)) {positiveCount++;}
      });
      negativeWords.forEach(word => {
        if (lowerMessage.includes(word)) {negativeCount++;}
      });
    });

    if (positiveCount > negativeCount) {return 'positive';}
    if (negativeCount > positiveCount) {return 'negative';}
    return 'neutral';
  }

  private updateConversationSummary(currentSummary: string, newMessage: string): string {
    // Simple summary update - in practice, this could use LLM for better summarization
    const maxSummaryLength = 500;
    const addition = `. Latest: ${newMessage.substring(0, 100)}`;
    
    if (currentSummary.length + addition.length > maxSummaryLength) {
      return currentSummary.substring(0, maxSummaryLength - addition.length) + addition;
    }
    
    return currentSummary + addition;
  }

  private filterContent(content: string): { isAppropriate: boolean; reason?: string } {
    // Basic content filtering
    const inappropriatePatterns = [
      /\b(password|token|api[_-]?key)\b/i,
      /\b(credit[_-]?card|ssn)\b/i
    ];

    for (const pattern of inappropriatePatterns) {
      if (pattern.test(content)) {
        return { isAppropriate: false, reason: 'Contains sensitive information' };
      }
    }

    return { isAppropriate: true };
  }

  private personalizeResponse(content: string, customerName: string): string {
    // Simple personalization - add customer name if not already present
    if (!content.toLowerCase().includes(customerName.toLowerCase())) {
      return `${customerName}, ${content}`;
    }
    return content;
  }

  private async generateFallbackResponse(
    request: ResponseRequest,
    context: ConversationContext
  ): Promise<AIResponse> {
    return {
      content: 'I apologize, but I need to connect you with one of our team members to better assist you with this request.',
      confidence: 0.5,
      sources: [],
      processing_time_ms: 0,
      should_escalate: true,
      intent: 'fallback',
      entities: {}
    };
  }

  private createTimeoutPromise(
    requestId: string,
    request: ResponseRequest,
    startTime: number
  ): Promise<ResponseResult> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${this.config.maxResponseTime}ms`));
      }, this.config.maxResponseTime);
    });
  }

  private createErrorResponse(
    requestId: string,
    request: ResponseRequest,
    errorType: ResponseResult['error']['type'],
    message: string,
    startTime: number
  ): ResponseResult {
    return {
      success: false,
      error: {
        type: errorType,
        message
      },
      metadata: {
        requestId,
        timestamp: new Date(),
        assistantId: request.assistantId,
        conversationId: request.conversationId,
        fallbackUsed: true
      }
    };
  }

  private updateSuccessStats(result: ResponseResult): void {
    if (result.success && result.response) {
      this.stats.successfulRequests++;
      
      // Update averages
      const total = this.stats.successfulRequests;
      this.stats.averageProcessingTime = 
        ((this.stats.averageProcessingTime * (total - 1)) + result.response.processingTimeMs) / total;
      
      this.stats.averageConfidence = 
        ((this.stats.averageConfidence * (total - 1)) + result.response.confidence) / total;

      if (result.response.shouldEscalate) {
        this.responseQuality.escalations++;
      }
    }

    // Update rates
    this.stats.escalationRate = this.responseQuality.escalations / this.stats.totalRequests;
    this.stats.fallbackRate = this.stats.failedRequests / this.stats.totalRequests;
  }

  /**
   * Get response generator statistics
   */
  getStats(): ResponseStats & { qualityMetrics: typeof this.responseQuality } {
    return {
      ...this.stats,
      qualityMetrics: { ...this.responseQuality }
    };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ResponseGeneratorConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Check all components
      const checks = await Promise.all([
        this.config.langChainProcessor.healthCheck(),
        this.config.hybridQueryEngine.healthCheck(),
        this.config.embeddingService.healthCheck(),
        this.config.vectorSearchEngine.healthCheck()
      ]);

      return checks.every(check => check === true);
    } catch (error) {
      console.error('Response generator health check failed:', error);
      return false;
    }
  }
}

/**
 * Factory function to create response generator
 */
export function createResponseGenerator(config: ResponseGeneratorConfig): AIResponseGenerator {
  return new AIResponseGenerator(config);
}

/**
 * Default response generator configuration
 */
export function getDefaultResponseGeneratorConfig(
  langChainProcessor: LangChainProcessor,
  hybridQueryEngine: HybridQueryEngine,
  embeddingService: EmbeddingService,
  vectorSearchEngine: VectorSearchEngine,
  messageFormatter: WhatsAppMessageFormatter,
  supabase: TenantAwareSupabase
): ResponseGeneratorConfig {
  return {
    langChainProcessor,
    hybridQueryEngine,
    embeddingService,
    vectorSearchEngine,
    messageFormatter,
    supabase,
    
    maxResponseTime: 30000, // 30 seconds
    enableAsync: true,
    fallbackEnabled: true,
    confidenceThreshold: 0.7,
    
    enableContentFilter: true,
    enableFactChecking: true,
    enablePersonalization: true
  };
}