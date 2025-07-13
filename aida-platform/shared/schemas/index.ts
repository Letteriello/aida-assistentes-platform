/**
 * AIDA Platform - Zod Schema Definitions
 * CRITICAL: Runtime validation schemas for type safety
 * PATTERN: Zod schemas matching database types
 */

import { z } from 'zod'

// Base schemas
export const jsonSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.record(z.any()),
  z.array(z.any())
])

// Business schemas
export const businessSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  industry: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  subscription_plan: z.enum(['free', 'pro', 'enterprise']),
  subscription_status: z.enum(['active', 'inactive', 'suspended']),
  max_assistants: z.number().int().positive(),
  max_conversations_per_month: z.number().int().positive(),
  settings: jsonSchema.nullable()
})

export const businessInsertSchema = businessSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
}).partial({
  industry: true,
  subscription_plan: true,
  subscription_status: true,
  max_assistants: true,
  max_conversations_per_month: true,
  settings: true
})

export const businessUpdateSchema = businessSchema.partial()

// Assistant schemas
export const assistantSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().nullable(),
  whatsapp_instance_id: z.string().nullable(),
  knowledge_graph_id: z.string().nullable(),
  personality_prompt: z.string().min(1),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  settings: jsonSchema.nullable(),
  performance_metrics: jsonSchema.nullable()
})

export const assistantInsertSchema = assistantSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
}).partial({
  description: true,
  whatsapp_instance_id: true,
  knowledge_graph_id: true,
  is_active: true,
  settings: true,
  performance_metrics: true
})

export const assistantUpdateSchema = assistantSchema.partial()

// Conversation schemas
export const conversationSchema = z.object({
  id: z.string().uuid(),
  assistant_id: z.string().uuid(),
  remote_jid: z.string().min(1),
  customer_name: z.string().nullable(),
  customer_phone: z.string().nullable(),
  last_message_at: z.string().datetime(),
  context_summary: z.string().nullable(),
  embeddings: z.array(z.number()).nullable(),
  status: z.enum(['active', 'resolved', 'escalated', 'archived']),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  metadata: jsonSchema.nullable()
})

export const conversationInsertSchema = conversationSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
}).partial({
  customer_name: true,
  customer_phone: true,
  last_message_at: true,
  context_summary: true,
  embeddings: true,
  status: true,
  metadata: true
})

export const conversationUpdateSchema = conversationSchema.partial()

// Message schemas
export const messageSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  content: z.string().min(1),
  sender_type: z.enum(['customer', 'assistant']),
  message_type: z.enum(['text', 'media', 'location', 'document', 'audio']),
  timestamp: z.string().datetime(),
  embeddings: z.array(z.number()).nullable(),
  metadata: jsonSchema.nullable(),
  processing_status: z.enum(['pending', 'processed', 'failed']),
  confidence_score: z.number().min(0).max(1).nullable(),
  created_at: z.string().datetime()
})

export const messageInsertSchema = messageSchema.omit({
  id: true,
  created_at: true
}).partial({
  message_type: true,
  timestamp: true,
  embeddings: true,
  metadata: true,
  processing_status: true,
  confidence_score: true
})

export const messageUpdateSchema = messageSchema.partial()

// Knowledge Node schemas
export const knowledgeNodeSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  entity_type: z.string().min(1),
  entity_name: z.string().min(1),
  properties: jsonSchema.nullable(),
  embeddings: z.array(z.number()).nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  source: z.string().nullable(),
  confidence_score: z.number().min(0).max(1).nullable(),
  version: z.number().int().positive()
})

export const knowledgeNodeInsertSchema = knowledgeNodeSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
}).partial({
  properties: true,
  embeddings: true,
  source: true,
  confidence_score: true,
  version: true
})

export const knowledgeNodeUpdateSchema = knowledgeNodeSchema.partial()

// Knowledge Relation schemas
export const knowledgeRelationSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  from_node_id: z.string().uuid(),
  to_node_id: z.string().uuid(),
  relation_type: z.string().min(1),
  properties: jsonSchema.nullable(),
  confidence_score: z.number().min(0).max(1).nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

export const knowledgeRelationInsertSchema = knowledgeRelationSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
}).partial({
  properties: true,
  confidence_score: true
})

export const knowledgeRelationUpdateSchema = knowledgeRelationSchema.partial()

// Evolution Instance schemas
export const evolutionInstanceSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  assistant_id: z.string().uuid(),
  instance_id: z.string().min(1),
  instance_name: z.string().min(1),
  status: z.enum(['creating', 'connecting', 'connected', 'disconnected', 'error']),
  qr_code: z.string().nullable(),
  webhook_url: z.string().url().nullable(),
  phone_number: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  last_seen_at: z.string().datetime().nullable(),
  settings: jsonSchema.nullable()
})

export const evolutionInstanceInsertSchema = evolutionInstanceSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
}).partial({
  status: true,
  qr_code: true,
  webhook_url: true,
  phone_number: true,
  last_seen_at: true,
  settings: true
})

export const evolutionInstanceUpdateSchema = evolutionInstanceSchema.partial()

// API Request/Response schemas
export const generateResponseRequestSchema = z.object({
  conversation_id: z.string().uuid(),
  message_content: z.string().min(1),
  sender_type: z.enum(['customer', 'assistant']),
  message_type: z.enum(['text', 'media', 'location', 'document', 'audio']).optional(),
  metadata: jsonSchema.optional()
})

export const generateResponseResponseSchema = z.object({
  response: z.string(),
  confidence_score: z.number().min(0).max(1),
  processing_time_ms: z.number().positive(),
  sources: z.array(z.object({
    type: z.string(),
    content: z.string(),
    similarity: z.number().min(0).max(1)
  })).optional()
})

export const webhookMessageSchema = z.object({
  instance: z.string(),
  data: z.object({
    key: z.object({
      remoteJid: z.string(),
      fromMe: z.boolean(),
      id: z.string()
    }),
    message: z.object({
      conversation: z.string().optional(),
      extendedTextMessage: z.object({
        text: z.string()
      }).optional()
    }),
    messageTimestamp: z.number(),
    pushName: z.string().optional()
  })
})

export const healthCheckResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.string().datetime(),
  services: z.record(z.object({
    status: z.enum(['healthy', 'degraded', 'unhealthy']),
    response_time_ms: z.number().optional(),
    error: z.string().optional()
  }))
})

export const statsResponseSchema = z.object({
  embedding_service: z.object({
    total_embeddings_generated: z.number().int().nonnegative(),
    average_processing_time_ms: z.number().nonnegative(),
    cache_hit_rate: z.number().min(0).max(1)
  }),
  vector_search: z.object({
    total_searches: z.number().int().nonnegative(),
    average_response_time_ms: z.number().nonnegative(),
    average_similarity_score: z.number().min(0).max(1)
  }),
  hybrid_query: z.object({
    total_queries: z.number().int().nonnegative(),
    average_processing_time_ms: z.number().nonnegative(),
    knowledge_graph_hits: z.number().int().nonnegative(),
    vector_search_hits: z.number().int().nonnegative()
  }),
  langchain_processor: z.object({
    total_processed: z.number().int().nonnegative(),
    average_processing_time_ms: z.number().nonnegative(),
    success_rate: z.number().min(0).max(1)
  }),
  ai_response_generator: z.object({
    total_responses: z.number().int().nonnegative(),
    average_generation_time_ms: z.number().nonnegative(),
    average_confidence_score: z.number().min(0).max(1)
  }),
  webhook_handler: z.object({
    total_webhooks_processed: z.number().int().nonnegative(),
    success_rate: z.number().min(0).max(1),
    average_processing_time_ms: z.number().nonnegative()
  })
})

// Vector search schemas
export const vectorSearchRequestSchema = z.object({
  query_embedding: z.array(z.number()),
  business_id: z.string().uuid(),
  table_name: z.string(),
  threshold: z.number().min(0).max(1).optional(),
  limit: z.number().int().positive().optional()
})

export const vectorSearchResultSchema = z.object({
  id: z.string(),
  content: z.string(),
  similarity: z.number().min(0).max(1),
  metadata: jsonSchema
})

// Export type inference helpers
export type Business = z.infer<typeof businessSchema>
export type BusinessInsert = z.infer<typeof businessInsertSchema>
export type BusinessUpdate = z.infer<typeof businessUpdateSchema>

export type Assistant = z.infer<typeof assistantSchema>
export type AssistantInsert = z.infer<typeof assistantInsertSchema>
export type AssistantUpdate = z.infer<typeof assistantUpdateSchema>

export type Conversation = z.infer<typeof conversationSchema>
export type ConversationInsert = z.infer<typeof conversationInsertSchema>
export type ConversationUpdate = z.infer<typeof conversationUpdateSchema>

export type Message = z.infer<typeof messageSchema>
export type MessageInsert = z.infer<typeof messageInsertSchema>
export type MessageUpdate = z.infer<typeof messageUpdateSchema>

export type KnowledgeNode = z.infer<typeof knowledgeNodeSchema>
export type KnowledgeNodeInsert = z.infer<typeof knowledgeNodeInsertSchema>
export type KnowledgeNodeUpdate = z.infer<typeof knowledgeNodeUpdateSchema>

export type KnowledgeRelation = z.infer<typeof knowledgeRelationSchema>
export type KnowledgeRelationInsert = z.infer<typeof knowledgeRelationInsertSchema>
export type KnowledgeRelationUpdate = z.infer<typeof knowledgeRelationUpdateSchema>

export type EvolutionInstance = z.infer<typeof evolutionInstanceSchema>
export type EvolutionInstanceInsert = z.infer<typeof evolutionInstanceInsertSchema>
export type EvolutionInstanceUpdate = z.infer<typeof evolutionInstanceUpdateSchema>

export type GenerateResponseRequest = z.infer<typeof generateResponseRequestSchema>
export type GenerateResponseResponse = z.infer<typeof generateResponseResponseSchema>
export type WebhookMessage = z.infer<typeof webhookMessageSchema>
export type HealthCheckResponse = z.infer<typeof healthCheckResponseSchema>
export type StatsResponse = z.infer<typeof statsResponseSchema>
export type VectorSearchRequest = z.infer<typeof vectorSearchRequestSchema>
export type VectorSearchResult = z.infer<typeof vectorSearchResultSchema>

// Missing schemas causing TS2305 errors
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc')
})

export const ExportRequestSchema = z.object({
  format: z.enum(['csv', 'json', 'xlsx']).default('csv'),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  filters: z.record(z.any()).optional(),
  include_metadata: z.boolean().default(false)
})

export type PaginationRequest = z.infer<typeof PaginationSchema>
export type ExportRequest = z.infer<typeof ExportRequestSchema>

// Missing schema aliases for backward compatibility (fixing TS2724 errors)
export const AssistantCreateSchema = assistantInsertSchema
export const AssistantTestSchema = assistantSchema
export const AssistantUpdateSchema = assistantUpdateSchema
export const ConversationFilterSchema = z.object({
  status: z.array(z.enum(['active', 'resolved', 'escalated', 'archived'])).optional(),
  date_range: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }).optional(),
  customer_name: z.string().optional(),
  assistant_id: z.string().uuid().optional()
})
