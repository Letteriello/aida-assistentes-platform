/**
 * AIDA Platform - RAG Service
 * Unified service for Retrieval Augmented Generation operations
 * CRITICAL: Orchestrates vector search, context management, and knowledge retrieval
 */

import { HybridQueryEngine, RAGQuery, RAGResult } from '../rag/hybrid-query-engine';
import { VectorSearchService } from '../rag/vector-search';
import { ContextManager } from '../rag/context-manager';
import { EmbeddingService } from '../rag/embedding-service';
import { BusinessKnowledgeManager } from '../memory/business-knowledge';
import { TenantAwareSupabase } from '../database/supabase-client';
import type { CloudflareEnv } from '@shared/types';

export interface RAGServiceConfig {
  maxResults: number;
  vectorThreshold: number;
  includeHistory: boolean;
  contextWindow: number;
  hybridWeights: {
    vector: number;
    keyword: number;
    graph: number;
  };
}

export interface RAGContext {
  conversationId: string;
  businessId: string;
  userId: string;
  assistantId: string;
  messageHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
}

export interface RAGResponse {
  results: RAGResult[];
  context: string;
  sources: string[];
  confidence: number;
  searchStrategy: 'vector' | 'keyword' | 'hybrid' | 'graph';
  processingTime: number;
  metadata: {
    totalResults: number;
    vectorResults: number;
    keywordResults: number;
    graphResults: number;
    cacheHit: boolean;
  };
}

export class RAGService {
  private hybridQueryEngine: HybridQueryEngine;
  private vectorSearchService: VectorSearchService;
  private contextManager: ContextManager;
  private embeddingService: EmbeddingService;
  private knowledgeManager: BusinessKnowledgeManager;
  private supabase: TenantAwareSupabase;
  private env: CloudflareEnv;
  private config: RAGServiceConfig;

  // Cache for RAG responses
  private responseCache: Map<string, RAGResponse> = new Map();
  private readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

  constructor(
    hybridQueryEngine: HybridQueryEngine,
    vectorSearchService: VectorSearchService,
    contextManager: ContextManager,
    embeddingService: EmbeddingService,
    knowledgeManager: BusinessKnowledgeManager,
    supabase: TenantAwareSupabase,
    env: CloudflareEnv,
    config?: Partial<RAGServiceConfig>
  ) {
    this.hybridQueryEngine = hybridQueryEngine;
    this.vectorSearchService = vectorSearchService;
    this.contextManager = contextManager;
    this.embeddingService = embeddingService;
    this.knowledgeManager = knowledgeManager;
    this.supabase = supabase;
    this.env = env;
    this.config = {
      maxResults: 10,
      vectorThreshold: 0.7,
      includeHistory: true,
      contextWindow: 5,
      hybridWeights: {
        vector: 0.6,
        keyword: 0.3,
        graph: 0.1
      },
      ...config
    };
  }

  /**
   * Perform RAG query with context awareness
   */
  async query(
    query: string,
    context: RAGContext,
    options?: Partial<RAGServiceConfig>
  ): Promise<RAGResponse> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(query, context, options);

    // Check cache first
    const cached = this.getCachedResponse(cacheKey);
    if (cached) {
      return {
        ...cached,
        metadata: {
          ...cached.metadata,
          cacheHit: true
        }
      };
    }

    try {
      // Merge config with options
      const effectiveConfig = { ...this.config, ...options };

      // Enhance query with context
      const enhancedQuery = await this.enhanceQueryWithContext(query, context);

      // Build RAG query
      const ragQuery: RAGQuery = {
        query: enhancedQuery,
        business_id: context.businessId,
        max_results: effectiveConfig.maxResults,
        include_history: effectiveConfig.includeHistory,
        conversation_id: context.conversationId,
        user_id: context.userId,
        assistant_id: context.assistantId
      };

      // Execute hybrid search
      const ragResult = await this.hybridQueryEngine.query(ragQuery);

      // Build response
      const response: RAGResponse = {
        results: ragResult.results,
        context: this.buildContextString(ragResult.results),
        sources: this.extractSources(ragResult.results),
        confidence: this.calculateConfidence(ragResult.results),
        searchStrategy: ragResult.strategy || 'hybrid',
        processingTime: Date.now() - startTime,
        metadata: {
          totalResults: ragResult.results.length,
          vectorResults: ragResult.results.filter(r => r.search_type === 'vector').length,
          keywordResults: ragResult.results.filter(r => r.search_type === 'keyword').length,
          graphResults: ragResult.results.filter(r => r.search_type === 'graph').length,
          cacheHit: false
        }
      };

      // Cache the response
      this.cacheResponse(cacheKey, response);

      return response;
    } catch (error) {
      console.error('RAG query failed:', error);
      throw new Error(`RAG query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search knowledge base with vector similarity
   */
  async searchKnowledge(
    query: string,
    businessId: string,
    options?: {
      entityTypes?: string[];
      limit?: number;
      threshold?: number;
    }
  ): Promise<Array<{ content: string; similarity: number; metadata: any }>> {
    try {
      const results = await this.knowledgeManager.searchKnowledge(
        query,
        options?.entityTypes,
        options?.limit || 10,
        options?.threshold || this.config.vectorThreshold
      );

      return results.map(result => ({
        content: result.node.content,
        similarity: result.similarity,
        metadata: {
          id: result.node.id,
          type: result.node.type,
          ...result.node.metadata
        }
      }));
    } catch (error) {
      console.error('Knowledge search failed:', error);
      throw new Error(`Knowledge search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get conversation context for RAG
   */
  async getConversationContext(
    conversationId: string,
    businessId: string,
    limit: number = 10
  ): Promise<string> {
    try {
      const context = await this.contextManager.getConversationContext(
        conversationId,
        businessId,
        { maxMessages: limit }
      );

      return context.formattedContext;
    } catch (error) {
      console.error('Failed to get conversation context:', error);
      return '';
    }
  }

  /**
   * Update knowledge base with new information
   */
  async updateKnowledge(
    content: string,
    metadata: Record<string, any>,
    businessId: string
  ): Promise<void> {
    try {
      await this.knowledgeManager.addKnowledge({
        type: metadata.type || 'general',
        content,
        metadata,
        business_id: businessId
      });

      // Clear cache to ensure fresh results
      this.clearCache();
    } catch (error) {
      console.error('Failed to update knowledge:', error);
      throw new Error(`Failed to update knowledge: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get RAG service statistics
   */
  getStats(): {
    cacheSize: number;
    cacheHitRate: number;
    totalQueries: number;
  } {
    return {
      cacheSize: this.responseCache.size,
      cacheHitRate: 0, // TODO: Implement hit rate tracking
      totalQueries: 0 // TODO: Implement query counting
    };
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.responseCache.clear();
  }

  // Private methods

  private async enhanceQueryWithContext(
    query: string,
    context: RAGContext
  ): Promise<string> {
    // Add conversation context if available
    if (context.messageHistory.length > 0) {
      const recentMessages = context.messageHistory
        .slice(-this.config.contextWindow)
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');
      
      return `Context:\n${recentMessages}\n\nQuery: ${query}`;
    }

    return query;
  }

  private buildContextString(results: RAGResult[]): string {
    return results
      .slice(0, 5) // Limit context to top 5 results
      .map(result => result.content)
      .join('\n\n');
  }

  private extractSources(results: RAGResult[]): string[] {
    return [...new Set(results.map(result => result.source).filter(Boolean))];
  }

  private calculateConfidence(results: RAGResult[]): number {
    if (results.length === 0) return 0;
    
    const avgScore = results.reduce((sum, result) => sum + result.score, 0) / results.length;
    return Math.min(avgScore, 1.0);
  }

  private generateCacheKey(
    query: string,
    context: RAGContext,
    options?: Partial<RAGServiceConfig>
  ): string {
    const keyData = {
      query,
      businessId: context.businessId,
      conversationId: context.conversationId,
      options: options || {}
    };
    
    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  private getCachedResponse(cacheKey: string): RAGResponse | null {
    const cached = this.responseCache.get(cacheKey);
    if (!cached) return null;

    // Check if cache entry is still valid
    const now = Date.now();
    if (now - cached.metadata.cacheHit > this.CACHE_TTL_MS) {
      this.responseCache.delete(cacheKey);
      return null;
    }

    return cached;
  }

  private cacheResponse(cacheKey: string, response: RAGResponse): void {
    // Limit cache size
    if (this.responseCache.size >= 100) {
      const firstKey = this.responseCache.keys().next().value;
      this.responseCache.delete(firstKey);
    }

    this.responseCache.set(cacheKey, {
      ...response,
      metadata: {
        ...response.metadata,
        cacheHit: Date.now()
      }
    });
  }
}

/**
 * Factory function to create RAGService instance
 */
export function createRAGService(
  hybridQueryEngine: HybridQueryEngine,
  vectorSearchService: VectorSearchService,
  contextManager: ContextManager,
  embeddingService: EmbeddingService,
  knowledgeManager: BusinessKnowledgeManager,
  supabase: TenantAwareSupabase,
  env: CloudflareEnv,
  config?: Partial<RAGServiceConfig>
): RAGService {
  return new RAGService(
    hybridQueryEngine,
    vectorSearchService,
    contextManager,
    embeddingService,
    knowledgeManager,
    supabase,
    env,
    config
  );
}

/**
 * Default RAG service configuration
 */
export function getDefaultRAGConfig(): RAGServiceConfig {
  return {
    maxResults: 10,
    vectorThreshold: 0.7,
    includeHistory: true,
    contextWindow: 5,
    hybridWeights: {
      vector: 0.6,
      keyword: 0.3,
      graph: 0.1
    }
  };
}