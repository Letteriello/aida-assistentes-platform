/**
 * AIDA Platform - AI Types
 * Shared types for AI processing and responses
 */

/**
 * AI response from processing
 */
export interface AIResponse {
  response: string;
  confidence?: number;
  sources?: string[];
  tokensUsed?: number;
  model?: string;
  processingTime?: number;
  metadata?: {
    ragUsed?: boolean;
    memoryUsed?: boolean;
    contextLength?: number;
    [key: string]: any;
  };
}

/**
 * AI model configuration
 */
export interface AIModelConfig {
  provider: 'openai' | 'anthropic' | 'local' | 'azure';
  model: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/**
 * AI processing statistics
 */
export interface AIProcessingStats {
  totalMessages: number;
  totalTokensUsed: number;
  averageConfidence: number;
  averageResponseTime: number;
  ragUsageRate: number;
  memoryUsageRate: number;
  errorRate: number;
}

/**
 * AI prompt template
 */
export interface AIPromptTemplate {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[];
  category: 'customer_service' | 'sales' | 'support' | 'general';
  language: string;
}

/**
 * AI conversation context
 */
export interface AIConversationContext {
  conversationId: string;
  assistantId: string;
  businessId: string;
  messageHistory: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }[];
  ragContext?: {
    documents: any[];
    totalResults: number;
    searchQuery: string;
  };
  memoryContext?: {
    businessKnowledge: string;
    similarConversations: any[];
    userProfile?: any;
  };
}

/**
 * AI processing request
 */
export interface AIProcessingRequest {
  message: string;
  conversationId: string;
  assistantId: string;
  businessId: string;
  context?: Partial<AIConversationContext>;
  options?: {
    enableRAG?: boolean;
    enableMemory?: boolean;
    maxContextLength?: number;
    responseStyle?: 'professional' | 'casual' | 'friendly';
  };
}

/**
 * AI processing response
 */
export interface AIProcessingResponse {
  success: boolean;
  response?: string;
  error?: string;
  metadata: {
    processingTime: number;
    tokensUsed: number;
    confidence: number;
    ragUsed: boolean;
    memoryUsed: boolean;
    sources?: string[];
  };
}