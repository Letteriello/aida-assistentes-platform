/**
 * Vector Search Service - Semantic Search with pgvector
 * PATTERN: Vector similarity search with multi-tenant support
 */
import { logSecurityEvent } from '../utils/security';
/**
 * Vector Search Service
 * PATTERN: Semantic search with intelligent ranking and caching
 */
export class VectorSearchService {
    config;
    supabase;
    embeddingService;
    env;
    stats;
    // Cache for search results
    searchCache = new Map();
    CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
    constructor(config, supabase, embeddingService, env) {
        this.config = config;
        this.supabase = supabase;
        this.embeddingService = embeddingService;
        this.env = env;
        this.stats = {
            totalSearches: 0,
            averageProcessingTimeMs: 0,
            averageResultCount: 0,
            cacheHitRate: 0,
            errorRate: 0
        };
    }
    /**
     * Perform semantic vector search
     * CRITICAL: Main search entry point
     */
    async search(request) {
        const startTime = performance.now();
        this.stats.totalSearches++;
        try {
            // Validate request
            this.validateSearchRequest(request);
            // Check cache first
            const cacheKey = await this.generateCacheKey(request);
            if (this.config.cacheResults) {
                const cached = await this.getCachedResult(cacheKey);
                if (cached) {
                    this.updateCacheStats(true);
                    return cached;
                }
            }
            // Generate query embedding
            const embeddingResult = await this.embeddingService.generateEmbedding(request.query);
            const queryEmbedding = embeddingResult.embeddings;
            // Perform vector search
            const searchResults = await this.performVectorSearch(queryEmbedding, request);
            // Apply reranking if enabled
            let finalResults = searchResults;
            if (this.config.enableReranking && searchResults.length > 1) {
                finalResults = await this.rerankResults(request.query, searchResults);
            }
            const processingTime = performance.now() - startTime;
            const response = {
                results: finalResults,
                totalResults: finalResults.length,
                processingTimeMs: processingTime,
                queryEmbedding: this.config.cacheResults ? queryEmbedding : undefined,
                searchMetadata: {
                    threshold: request.threshold || this.config.similarityThreshold,
                    maxResults: request.limit || this.config.maxResults,
                    filtersApplied: !!request.filters,
                    rerankingUsed: this.config.enableReranking && searchResults.length > 1
                }
            };
            // Cache the result
            if (this.config.cacheResults) {
                await this.cacheResult(cacheKey, response);
                this.updateCacheStats(false);
            }
            this.updateSearchStats(processingTime, finalResults.length);
            return response;
        }
        catch (error) {
            this.stats.errorRate++;
            console.error('Vector search failed:', error);
            // Log security event for suspicious searches
            logSecurityEvent('search_failure', {
                query: request.query.substring(0, 100),
                error: error instanceof Error ? error.message : 'Unknown error'
            }, request.businessId);
            throw new Error(`Vector search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Perform the actual vector search using pgvector
     * PATTERN: Database vector similarity search
     */
    async performVectorSearch(queryEmbedding, request) {
        const threshold = request.threshold || this.config.similarityThreshold;
        const limit = request.limit || this.config.maxResults;
        try {
            const { data, error } = await this.supabase.getServiceClient()
                .rpc('vector_search', {
                query_embedding: queryEmbedding,
                business_id: request.businessId,
                similarity_threshold: threshold,
                max_results: limit,
                filters: request.filters || {}
            });
            if (error) {
                throw new Error(`Database search failed: ${error.message}`);
            }
            return (data || []).map((row) => ({
                id: row.id,
                content: row.content,
                similarity: row.similarity,
                metadata: {
                    nodeType: row.metadata?.nodeType || 'unknown',
                    tags: row.metadata?.tags || [],
                    createdAt: new Date(row.created_at),
                    updatedAt: new Date(row.updated_at),
                    businessId: row.business_id
                },
                embedding: row.embedding
            }));
        }
        catch (error) {
            console.error('Vector search query failed:', error);
            throw new Error(`Vector search query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Rerank search results using cross-encoder model
     * PATTERN: Result reranking for improved relevance
     */
    async rerankResults(query, results) {
        try {
            // For now, implement a simple reranking based on content length and keyword matching
            // In production, this would use a cross-encoder model
            const queryTokens = query.toLowerCase().split(/\s+/);
            return results
                .map(result => {
                // Calculate keyword overlap score
                const contentTokens = result.content.toLowerCase().split(/\s+/);
                const overlap = queryTokens.filter(token => contentTokens.some(contentToken => contentToken.includes(token))).length;
                const keywordScore = overlap / queryTokens.length;
                // Combine similarity and keyword scores
                const rerankScore = (result.similarity * 0.7) + (keywordScore * 0.3);
                return {
                    ...result,
                    similarity: rerankScore
                };
            })
                .sort((a, b) => b.similarity - a.similarity);
        }
        catch (error) {
            console.error('Reranking failed, returning original results:', error);
            return results;
        }
    }
    /**
     * Generate cache key for search request
     * PATTERN: Content-based caching
     */
    async generateCacheKey(request) {
        const cacheData = {
            query: request.query,
            businessId: request.businessId,
            filters: request.filters,
            limit: request.limit,
            threshold: request.threshold
        };
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify(cacheData));
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    /**
     * Get cached search result
     * PATTERN: Cache lookup with expiration
     */
    async getCachedResult(key) {
        try {
            if (this.env.SEARCH_CACHE) {
                const cached = await this.env.SEARCH_CACHE.get(key);
                if (cached) {
                    return JSON.parse(cached);
                }
            }
            return this.searchCache.get(key) || null;
        }
        catch (error) {
            console.error('Cache lookup failed:', error);
            return null;
        }
    }
    /**
     * Cache search result
     * PATTERN: Multi-tier caching
     */
    async cacheResult(key, result) {
        try {
            // Cache in KV store if available
            if (this.env.SEARCH_CACHE) {
                await this.env.SEARCH_CACHE.put(key, JSON.stringify(result), {
                    expirationTtl: this.CACHE_TTL_MS / 1000 // KV expects seconds
                });
            }
            // Also cache in memory
            this.searchCache.set(key, result);
            // Limit memory cache size
            if (this.searchCache.size > 100) {
                const firstKey = this.searchCache.keys().next().value;
                this.searchCache.delete(firstKey);
            }
        }
        catch (error) {
            console.error('Caching failed:', error);
        }
    }
    /**
     * Validate search request
     * CRITICAL: Input validation and security
     */
    validateSearchRequest(request) {
        if (!request.query || typeof request.query !== 'string') {
            throw new Error('Query is required and must be a string');
        }
        if (request.query.length === 0) {
            throw new Error('Query cannot be empty');
        }
        if (request.query.length > 1000) {
            throw new Error('Query too long: maximum 1000 characters allowed');
        }
        if (!request.businessId || typeof request.businessId !== 'string') {
            throw new Error('Business ID is required');
        }
        if (request.limit && (request.limit < 1 || request.limit > 100)) {
            throw new Error('Limit must be between 1 and 100');
        }
        if (request.threshold && (request.threshold < 0 || request.threshold > 1)) {
            throw new Error('Threshold must be between 0 and 1');
        }
    }
    /**
     * Update cache statistics
     * PATTERN: Performance monitoring
     */
    updateCacheStats(wasHit) {
        if (wasHit) {
            this.stats.cacheHitRate = (this.stats.cacheHitRate * this.stats.totalSearches + 1) / (this.stats.totalSearches + 1);
        }
        else {
            this.stats.cacheHitRate = (this.stats.cacheHitRate * this.stats.totalSearches) / (this.stats.totalSearches + 1);
        }
    }
    /**
     * Update search statistics
     * PATTERN: Performance tracking
     */
    updateSearchStats(processingTime, resultCount) {
        this.stats.averageProcessingTimeMs = ((this.stats.averageProcessingTimeMs * (this.stats.totalSearches - 1) + processingTime) /
            this.stats.totalSearches);
        this.stats.averageResultCount = ((this.stats.averageResultCount * (this.stats.totalSearches - 1) + resultCount) /
            this.stats.totalSearches);
    }
    /**
     * Get search statistics
     * PATTERN: Monitoring and analytics
     */
    getStats() {
        return {
            ...this.stats,
            cacheSize: this.searchCache.size
        };
    }
    /**
     * Health check for vector search service
     * CRITICAL: Service monitoring
     */
    async healthCheck() {
        try {
            // Test with a simple search
            const testRequest = {
                query: 'health check test',
                businessId: 'test',
                limit: 1
            };
            await this.search(testRequest);
            return true;
        }
        catch (error) {
            console.error('Vector search health check failed:', error);
            return false;
        }
    }
    /**
     * Clear search cache
     * PATTERN: Cache management
     */
    async clearCache() {
        try {
            this.searchCache.clear();
            if (this.env.SEARCH_CACHE) {
                console.log('KV search cache clearing not implemented - keys would need to be tracked');
            }
        }
        catch (error) {
            console.error('Search cache clearing failed:', error);
        }
    }
    /**
     * Update configuration
     * PATTERN: Runtime configuration updates
     */
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
    }
    /**
     * Get current configuration
     * PATTERN: Configuration access
     */
    getConfig() {
        return { ...this.config };
    }
}
/**
 * Factory function to create vector search service
 */
export function createVectorSearchService(config, supabase, embeddingService, env) {
    return new VectorSearchService(config, supabase, embeddingService, env);
}
/**
 * Default vector search configuration
 */
export function getDefaultVectorSearchConfig() {
    return {
        similarityThreshold: 0.7,
        maxResults: 20,
        enableReranking: true,
        rerankingModel: 'cross-encoder',
        searchTimeout: 5000,
        cacheResults: true
    };
}
/**
 * Utility function to validate embedding dimensions
 */
export function validateEmbedding(embedding, expectedDimensions) {
    return Array.isArray(embedding) &&
        embedding.length === expectedDimensions &&
        embedding.every(val => typeof val === 'number' && !isNaN(val));
}
/**
 * Legacy function for backward compatibility
 */
export const vectorSearch = async (queryEmbedding, businessId, limit) => {
    // This is kept for backward compatibility
    // New code should use VectorSearchService
    console.warn('vectorSearch function is deprecated. Use VectorSearchService instead.');
    const request = {
        query: 'legacy search',
        businessId,
        limit
    };
    // For now, return a simple structure
    return {
        results: [],
        message: 'Please migrate to VectorSearchService'
    };
};
