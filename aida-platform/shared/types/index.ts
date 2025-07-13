/**
 * AIDA Platform - Shared Type Definitions
 * CRITICAL: Core types used across frontend and backend
 * PATTERN: Centralized type definitions for consistency
 */

// Re-export database types
export * from './database'
export * from './ai'

// Core platform types
export interface PlatformConfig {
  environment: 'development' | 'staging' | 'production'
  version: string
  features: {
    multiTenant: boolean
    vectorSearch: boolean
    knowledgeGraph: boolean
    realTimeChat: boolean
    analytics: boolean
  }
}

// Authentication and authorization
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  business_id: string
  permissions: UserPermissions
  created_at: string
  updated_at: string
  last_login_at?: string
}

export type UserRole = 'owner' | 'admin' | 'manager' | 'agent'

export interface UserPermissions {
  can_create_assistants: boolean
  can_manage_knowledge: boolean
  can_view_analytics: boolean
  can_manage_users: boolean
  can_modify_settings: boolean
  can_export_data: boolean
}

// Business and subscription
export type SubscriptionPlan = 'free' | 'pro' | 'enterprise'
export type SubscriptionStatus = 'active' | 'inactive' | 'suspended'

export interface SubscriptionLimits {
  max_assistants: number
  max_conversations_per_month: number
  max_knowledge_nodes: number
  max_users: number
  api_rate_limit: number
  storage_limit_gb: number
}

// Assistant and conversation types
export type ConversationStatus = 'active' | 'resolved' | 'escalated' | 'archived'
export type MessageSenderType = 'customer' | 'assistant'
export type MessageType = 'text' | 'media' | 'location' | 'document' | 'audio'
export type ProcessingStatus = 'pending' | 'processed' | 'failed'

// Evolution API types
export type InstanceStatus = 'creating' | 'connecting' | 'connected' | 'disconnected' | 'error'

export interface WhatsAppMessage {
  id: string
  remoteJid: string
  fromMe: boolean
  content: string
  messageType: MessageType
  timestamp: number
  pushName?: string
  metadata?: Record<string, any>
}

export interface EvolutionWebhookPayload {
  instance: string
  data: {
    key: {
      remoteJid: string
      fromMe: boolean
      id: string
    }
    message: {
      conversation?: string
      extendedTextMessage?: {
        text: string
      }
    }
    messageTimestamp: number
    pushName?: string
  }
}

// AI and RAG types
export interface EmbeddingVector {
  id: string
  content: string
  embeddings: number[]
  metadata: Record<string, any>
  created_at: string
}

export interface VectorSearchResult {
  id: string
  content: string
  similarity: number
  metadata: Record<string, any>
}

export interface KnowledgeGraphNode {
  id: string
  entity_type: string
  entity_name: string
  properties: Record<string, any>
  embeddings?: number[]
  confidence_score?: number
  version: number
}

export interface KnowledgeGraphRelation {
  id: string
  from_node_id: string
  to_node_id: string
  relation_type: string
  properties?: Record<string, any>
  confidence_score?: number
}

export interface AIResponse {
  response: string
  confidence_score: number
  processing_time_ms: number
  sources?: {
    type: string
    content: string
    similarity: number
  }[]
  metadata?: Record<string, any>
  
  // Additional properties used in the codebase (fixing TS2353 errors)
  content?: string          // Alias for response
  confidence?: number       // Alias for confidence_score  
  should_escalate?: boolean
  intent?: string
  entities?: Record<string, any>
}

// Analytics and monitoring
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  services: Record<string, ServiceHealth>
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  response_time_ms?: number
  error?: string
}

export interface PlatformStats {
  embedding_service: {
    total_embeddings_generated: number
    average_processing_time_ms: number
    cache_hit_rate: number
  }
  vector_search: {
    total_searches: number
    average_response_time_ms: number
    average_similarity_score: number
  }
  hybrid_query: {
    total_queries: number
    average_processing_time_ms: number
    knowledge_graph_hits: number
    vector_search_hits: number
  }
  langchain_processor: {
    total_processed: number
    average_processing_time_ms: number
    success_rate: number
  }
  ai_response_generator: {
    total_responses: number
    average_generation_time_ms: number
    average_confidence_score: number
  }
  webhook_handler: {
    total_webhooks_processed: number
    success_rate: number
    average_processing_time_ms: number
  }
}

// API request/response types
export interface GenerateResponseRequest {
  conversation_id: string
  message_content: string
  sender_type: MessageSenderType
  message_type?: MessageType
  metadata?: Record<string, any>
}

export interface GenerateResponseResponse {
  response: string
  confidence_score: number
  processing_time_ms: number
  sources?: {
    type: string
    content: string
    similarity: number
  }[]
}

// Error handling
export interface APIError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: string
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

// Pagination and filtering
export interface PaginationParams {
  page: number
  limit: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
}

// Cloudflare Workers specific types
export interface CloudflareEnv {
  // Environment variables
  ENVIRONMENT: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  EVOLUTION_API_HOST: string
  EVOLUTION_API_KEY: string
  OPENAI_API_KEY: string
  ANTHROPIC_API_KEY: string
  LANGCHAIN_API_KEY: string
  
  // Cloudflare bindings
  CACHE_KV: KVNamespace
  SESSIONS_KV: KVNamespace
  EMBEDDINGS_KV: KVNamespace
  
  // Durable Objects
  CONVERSATION_MANAGER: DurableObjectNamespace
  KNOWLEDGE_GRAPH_MANAGER: DurableObjectNamespace
  
  // AI binding
  AI: Ai
  
  // Analytics Engine
  ANALYTICS: AnalyticsEngineDataset
  
  // Queues
  AI_RESPONSE_QUEUE: Queue
  EMBEDDING_QUEUE: Queue
  
  // R2 Buckets
  MEDIA_BUCKET: R2Bucket
  BACKUP_BUCKET: R2Bucket

  // Missing environment variables (fixing TS2339 errors)
  EVOLUTION_API_BASE_URL: string
  WEBHOOK_BASE_URL: string
}

// Context for dependency injection
export interface PlatformContext {
  supabase: any // TenantAwareSupabase
  evolutionClient: any // EvolutionAPIClient
  messageFormatter: any // WhatsAppMessageFormatter
  embeddingService: any // EmbeddingService
  vectorSearchEngine: any // VectorSearchEngine
  hybridQueryEngine: any // HybridQueryEngine
  langchainProcessor: any // LangChainProcessor
  aiResponseGenerator: any // AIResponseGenerator
}

// Queue message types
export interface AIResponseQueueMessage {
  conversation_id: string
  message_content: string
  sender_type: MessageSenderType
  message_type: MessageType
  business_id: string
  assistant_id: string
  remote_jid: string
  timestamp: number
  metadata?: Record<string, any>
}

export interface EmbeddingQueueMessage {
  id: string
  content: string
  table_name: string
  business_id: string
  metadata?: Record<string, any>
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// Constants
export const SUBSCRIPTION_LIMITS: Record<SubscriptionPlan, SubscriptionLimits> = {
  free: {
    max_assistants: 1,
    max_conversations_per_month: 100,
    max_knowledge_nodes: 50,
    max_users: 1,
    api_rate_limit: 100,
    storage_limit_gb: 1
  },
  pro: {
    max_assistants: 5,
    max_conversations_per_month: 1000,
    max_knowledge_nodes: 500,
    max_users: 5,
    api_rate_limit: 1000,
    storage_limit_gb: 10
  },
  enterprise: {
    max_assistants: 50,
    max_conversations_per_month: 10000,
    max_knowledge_nodes: 5000,
    max_users: 50,
    api_rate_limit: 10000,
    storage_limit_gb: 100
  }
}

export const MESSAGE_TYPES: MessageType[] = ['text', 'media', 'location', 'document', 'audio']
export const CONVERSATION_STATUSES: ConversationStatus[] = ['active', 'resolved', 'escalated', 'archived']
export const INSTANCE_STATUSES: InstanceStatus[] = ['creating', 'connecting', 'connected', 'disconnected', 'error']
export const USER_ROLES: UserRole[] = ['owner', 'admin', 'manager', 'agent']
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = ['free', 'pro', 'enterprise']

// Type alias for backward compatibility (fixing TS2305 errors)
export type Env = CloudflareEnv

// Missing type aliases for backward compatibility (fixing TS2724 errors)
export type AssistantCreate = AssistantInsert
export type ConversationExport = Conversation & { export_format?: 'csv' | 'json' | 'xlsx' }
export type ConversationFilter = {
  status?: ConversationStatus[]
  date_range?: { start: string; end: string }
  customer_name?: string
  assistant_id?: string
}

// RAG Query interface (missing interface causing TS2304 errors)
export interface RAGQuery {
  query: string
  business_id: string
  max_results?: number
  include_history?: boolean
  filters?: Record<string, any>
  conversation_id?: string
  assistant_id?: string
}

// Domain model types derived from database types for better API interfaces
export interface Assistant {
  id: string
  business_id: string
  name: string
  description?: string
  whatsapp_instance_id?: string
  knowledge_graph_id?: string
  personality_prompt: string
  is_active: boolean
  created_at: string
  updated_at: string
  settings?: Record<string, any>
  performance_metrics?: Record<string, any>
  
  // Additional properties used in the codebase (fixing TS2339 errors)
  system_prompt?: string    // Alias for personality_prompt
  metrics?: Record<string, any>  // Alias for performance_metrics
}

// Insert type for Assistant (for database inserts)
export type AssistantInsert = Omit<Assistant, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export interface Conversation {
  id: string
  assistant_id: string
  remote_jid: string
  customer_name?: string
  customer_phone?: string
  last_message_at: string
  context_summary?: string
  embeddings?: number[]
  status: ConversationStatus
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
}

export interface Message {
  id: string
  conversation_id: string
  content: string
  sender_type: MessageSenderType
  message_type: MessageType
  timestamp: string
  embeddings?: number[]
  metadata?: Record<string, any>
  processing_status: ProcessingStatus
  confidence_score?: number
  created_at: string
}

export interface Business {
  id: string
  name: string
  industry?: string
  created_at: string
  updated_at: string
  subscription_plan: SubscriptionPlan
  subscription_status: SubscriptionStatus
  max_assistants: number
  max_conversations_per_month: number
  settings?: Record<string, any>
}

export interface KnowledgeNode {
  id: string
  business_id: string
  entity_type: string
  entity_name: string
  properties?: Record<string, any>
  embeddings?: number[]
  created_at: string
  updated_at: string
  source?: string
  confidence_score?: number
  version: number
}

export interface KnowledgeRelation {
  id: string
  business_id: string
  from_node_id: string
  to_node_id: string
  relation_type: string
  properties?: Record<string, any>
  confidence_score?: number
  created_at: string
  updated_at: string
}

export interface EvolutionInstance {
  id: string
  business_id: string
  assistant_id: string
  instance_id: string
  instance_name: string
  status: InstanceStatus
  qr_code?: string
  webhook_url?: string
  phone_number?: string
  created_at: string
  updated_at: string
  last_seen_at?: string
  settings?: Record<string, any>
}