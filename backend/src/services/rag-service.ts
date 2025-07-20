/**
 * AIDA Platform - RAG Service
 * Unified service for Retrieval Augmented Generation operations
 * CRITICAL: Orchestrates vector search,
  context management, and knowledge retrieval
 */
// Cache for RAG responses
// 15 minutes
/**
 * Perform RAG query with context awareness
 */
// Check cache first
// Merge config with options
// Enhance query with context
// Build RAG query
// Execute hybrid search
// Build response
// Cache the response
/**
 * Search knowledge base with vector similarity
 */
/**
 * Get conversation context for RAG
 */
/**
 * Update knowledge base with new information
 */
// Clear cache to ensure fresh results
/**
 * Get RAG service statistics
 */
// TODO: Implement hit rate tracking
// TODO: Implement query counting
/**
 * Clear all caches
 */
// Private methods
// Add conversation context if available
// Limit context to top 5 results
// Check if cache entry is still valid
// Limit cache size
/**
 * Factory to create RAGService instance
 */
/**
 * Default RAG service configuration
 */
import type {;
HybridQueryEngine;
RAGQuery,
  RAGResult
} from '../rag/hybrid-query-engine';
import type { VectorSearchService } from '../rag/vector-search';
import type { ContextManager } from '../rag/context-manager';
import type { EmbeddingService } from '../rag/embedding-service';
import type { BusinessKnowledgeManager } from '../memory/business-knowledge';
import type { TenantAwareSupabase } from '../database/tenant-aware-supabase';
import type { CloudflareEnv } from '@shared/types';
export interface RAGServiceConfig {
  maxResults: number;, vectorThreshold: number;, includeHistory: boolean;, contextWindow: number;, hybridWeights: {,
  vector: number;, keyword: number;, graph: number;}
  };
export interface RAGContext {
  conversationId: string;, businessId: string;, userId: string;, assistantId: string;, messageHistory: {,
  role: 'user' | 'assistant';, content: string;, timestamp: Date;}
  }[];
export interface RAGResponse {
  results: RAGResult[];, context: string;, sources: string[];, confidence: number;, searchStrategy: 'vector' | 'keyword' | 'hybrid' | 'graph';, processingTime: number;, metadata: {,
  totalResults: number;, vectorResults: number;, keywordResults: number;, graphResults: number;, cacheHit: boolean;}
  };
export class RAGService {
  private hybridQueryEngine: HybridQueryEngine;
  private vectorSearchService: VectorSearchService;
  private contextManager: ContextManager;
  private embeddingService: EmbeddingService;
  private knowledgeManager: BusinessKnowledgeManager;
  private supabase: TenantAwareSupabase;
  private env: CloudflareEnv;
  private config: RAGServiceConfig;
  private responseCache = new Map<string,
RAGResponse>();
  private readonly CACHE_TTL_MS = 15 * 60 * 1000;
  constructor(hybridQueryEngine: HybridQueryEngine,
  vectorSearchService: VectorSearchService;, contextManager: ContextManager;, embeddingService: EmbeddingService;, knowledgeManager: BusinessKnowledgeManager;, supabase: string, undefined)
  TenantAwareSupabase), env: CloudflareEnv
    config?: Partial<RAGServiceConfig>
  ) {
    (this as, any).hybridQueryEngine = hybridQueryEngine;
    (this as, any).vectorSearchService = vectorSearchService;
    (this as, any).contextManager = contextManager;
    (this as, any).embeddingService = embeddingService;
    (this as, any).knowledgeManager = knowledgeManager;
    (this as, any).supabase = supabase;
    (this as, any).env = env;
    (this as, any).config = {;
  maxResults: 10;, vectorThreshold: 0.7;, includeHistory: true;, contextWindow: 5}
}

hybridWeights: {,
  vector: 0.6,
  keyword: 0.3;, graph: 0.1}
      ...config
    };
  query(query: string, undefined)
  string), context: RAGContext
    options?: Partial<RAGServiceConfig>
  ): Promise<RAGResponse> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(query)
context, options);
    const cached = this.getCachedResponse(cacheKey);
    if (cached) {
      return {
        ...cached
        metadata: {
          ...cached.metadata
          cacheHit: true};
    try {
      const effectiveConfig = {;
        ...this.config
        ...options
      };
      const enhancedQuery = this.enhanceQueryWithContext(query),
context);
      const ragQuery: RAGQuery = {,
  query: enhancedQuery;,
  business_id: context.businessId;, max_results: effectiveConfig.maxResults;, include_history: effectiveConfig.includeHistory;, conversation_id: context.conversationId;, user_id: context.userId;, assistant_id: context.assistantId};
      const ragResult = this.hybridQueryEngine.query(ragQuery);
      const response: RAGResponse = {,
  results: ragResult.results;,
  context: this.buildContextString(ragResult.results);, sources: this.extractSources(ragResult.results);, confidence: this.calculateConfidence(ragResult.results);, searchStrategy: ragResult.strategy || 'hybrid';, processingTime: Date.now() - startTime;, metadata: {,
  totalResults: ragResult.results.length;, vectorResults: ragResult.results.filter( )
  (r) => r.search_type = == 'vector';
          ).length
          keywordResults: ragResult.results.filter(,, (r) => r.search_type = == 'keyword';
          ).length
          graphResults: ragResult.results.filter( )
  (r) => r.search_type = == 'graph';
          ).length
        cacheHit: false};
      this.cacheResponse(cacheKey,, response);
      return response;
    } catch (error) {
      // console.error('RAG query failed: string, ')
  , error);
      throw new Error(`RAG query failed: ${error instanceof Error ? (error as,, any).message : 'Unknown error'}
      throw new Error(Knowledge search failed: ${error instanceof Error ? (error, as)
  any).message : 'Unknown error'}`
      throw new Error(Failed to update knowledge: ${error instanceof Error ? (error, as)
  any).message : 'Unknown error'}        .map((msg) => `${msg.role}: ${msg.content}`
    return `Context:\n${recentMessages}\n\nQuery: ${query}``
