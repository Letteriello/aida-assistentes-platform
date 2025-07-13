/**
 * Hybrid Query Engine for AIDA Platform
 *
 * Combines vector similarity search with keyword-based search for optimal retrieval.
 * Implements fusion ranking algorithms to merge results from different search strategies.
 *
 * ARCHITECTURE:
 * - Vector Search: Semantic similarity using embeddings
 * - Keyword Search: Traditional full-text search with PostgreSQL
 * - Fusion Ranking: RRF (Reciprocal Rank Fusion) and weighted scoring
 * - Query Analysis: Automatic query type detection and routing
 *
 * PATTERNS:
 * - Strategy Pattern: Different search strategies
 * - Template Method: Query processing pipeline
 * - Observer Pattern: Search result monitoring
 * - Factory Pattern: Query strategy creation
 */
/**
 * Main hybrid query engine class
 */
export class HybridQueryEngine {
    config;
    vectorSearch;
    embeddingService;
    supabase;
    env;
    CACHE_TTL_MS = 300000; // 5 minutes
    resultCache = new Map();
    stats;
    constructor(config, vectorSearch, embeddingService, supabase, env) {
        this.config = config;
        this.vectorSearch = vectorSearch;
        this.embeddingService = embeddingService;
        this.supabase = supabase;
        this.env = env;
        this.stats = {
            totalSearches: 0,
            averageProcessingTimeMs: 0,
            vectorOnlySearches: 0,
            keywordOnlySearches: 0,
            hybridSearches: 0,
            averageVectorTimeMs: 0,
            averageKeywordTimeMs: 0,
            averageFusionTimeMs: 0,
            averageResultCount: 0,
            averageFusionScore: 0,
            cacheHitRate: 0,
            cacheSize: 0
        };
    }
    /**
     * Execute vector search with timing
     * PATTERN: Timed execution wrapper
     */
    async executeVectorSearch(request) {
        const startTime = Date.now();
        const vectorRequest = {
            query: request.query,
            businessId: request.businessId,
            filters: request.filters,
            limit: this.config.maxVectorResults
        };
        const response = await this.vectorSearch.search(vectorRequest);
        const time = Date.now() - startTime;
        return {
            results: response.results,
            time
        };
    }
    /**
     * Execute keyword search with timing
     * PATTERN: Timed execution wrapper
     */
    async executeKeywordSearch(request) {
        const startTime = Date.now();
        const results = await this.performKeywordSearch(request.query, request.businessId, request.filters, this.config.maxKeywordResults);
        const time = Date.now() - startTime;
        return { results, time };
    }
    /**
     * Perform PostgreSQL full-text search
     * PATTERN: Database text search integration
     */
    async performKeywordSearch(query, businessId, filters, limit = 20) {
        try {
            // Prepare search query for PostgreSQL full-text search
            const searchQuery = this.prepareSearchQuery(query);
            const { data, error } = await this.supabase.getServiceClient()
                .rpc('keyword_search', {
                search_query: searchQuery,
                business_id: businessId,
                max_results: limit,
                filters: filters || {}
            });
            if (error) {
                throw new Error(`Keyword search failed: ${error.message}`);
            }
            return (data || []).map((row, index) => ({
                id: row.id,
                content: row.content,
                score: row.rank || 0,
                rank: index + 1,
                metadata: {
                    nodeType: row.metadata?.nodeType || 'unknown',
                    tags: row.metadata?.tags || [],
                    createdAt: new Date(row.created_at),
                    updatedAt: new Date(row.updated_at),
                    businessId: row.business_id
                }
            }));
        }
        catch (error) {
            console.error('Keyword search failed:', error);
            // Return empty results instead of throwing to allow hybrid search to continue
            return [];
        }
    }
    /**
     * Prepare search query for PostgreSQL full-text search
     * PATTERN: Query preprocessing for text search
     */
    prepareSearchQuery(query) {
        // Remove special characters and normalize
        const searchQuery = query
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        // Split into words and create tsquery format
        const words = searchQuery.split(' ').filter(word => word.length > 2);
        if (words.length === 0) {
            return query; // Fallback to original query
        }
        // Create OR query for better recall
        return words.map(word => `${word}:*`).join(' | ');
    }
    /**
     * Fuse results from vector and keyword searches
     * PATTERN: Multi-source result fusion
     */
    async fuseResults(vectorResults, keywordResults, limit) {
        // Create maps for efficient lookup
        const vectorMap = new Map(vectorResults.map((r, i) => [r.id, { result: r, rank: i + 1 }]));
        const keywordMap = new Map(keywordResults.map((r, i) => [r.id, { result: r, rank: i + 1 }]));
        // Get all unique result IDs
        const allIds = new Set([...vectorMap.keys(), ...keywordMap.keys()]);
        // Create fused results
        const fusedResults = [];
        for (const id of allIds) {
            const vectorData = vectorMap.get(id);
            const keywordData = keywordMap.get(id);
            // Determine which sources contributed to this result
            const sources = [];
            if (vectorData) {
                sources.push('vector');
            }
            if (keywordData) {
                sources.push('keyword');
            }
            // Calculate fusion score based on algorithm
            const fusionScore = this.calculateFusionScore(vectorData?.result.similarity || 0, keywordData?.result.score || 0, vectorData?.rank || Infinity, keywordData?.rank || Infinity);
            // Use vector result as base if available, otherwise keyword result
            const baseResult = vectorData?.result || {
                id,
                content: keywordData.result.content,
                similarity: keywordData.result.score,
                metadata: keywordData.result.metadata,
                embedding: []
            };
            const fusedResult = {
                ...baseResult,
                vectorScore: vectorData?.result.similarity,
                keywordScore: keywordData?.result.score,
                fusionScore,
                sources,
                vectorRank: vectorData?.rank,
                keywordRank: keywordData?.rank,
                queryRelevance: fusionScore
            };
            fusedResults.push(fusedResult);
        }
        // Sort by fusion score and limit results
        return fusedResults
            .sort((a, b) => b.fusionScore - a.fusionScore)
            .slice(0, limit);
    }
    /**
     * Calculate fusion score using selected algorithm
     * PATTERN: Configurable scoring algorithms
     */
    calculateFusionScore(vectorScore, keywordScore, vectorRank, keywordRank) {
        switch (this.config.fusionAlgorithm) {
            case 'rrf':
                return this.calculateRRFScore(vectorRank, keywordRank);
            case 'weighted':
                return this.calculateWeightedScore(vectorScore, keywordScore);
            case 'adaptive':
                return this.calculateAdaptiveScore(vectorScore, keywordScore, vectorRank, keywordRank);
            default:
                return this.calculateWeightedScore(vectorScore, keywordScore);
        }
    }
    /**
     * Calculate Reciprocal Rank Fusion (RRF) score
     * PATTERN: RRF algorithm implementation
     */
    calculateRRFScore(vectorRank, keywordRank) {
        const k = this.config.rrfConstant;
        let score = 0;
        if (vectorRank !== Infinity) {
            score += 1 / (k + vectorRank);
        }
        if (keywordRank !== Infinity) {
            score += 1 / (k + keywordRank);
        }
        return score;
    }
    /**
     * Calculate weighted score
     * PATTERN: Weighted combination of scores
     */
    calculateWeightedScore(vectorScore, keywordScore) {
        const normalizedVectorScore = Math.min(vectorScore, 1);
        const normalizedKeywordScore = Math.min(keywordScore, 1);
        return (normalizedVectorScore * this.config.vectorWeight +
            normalizedKeywordScore * this.config.keywordWeight);
    }
    /**
     * Calculate adaptive score based on query characteristics
     * PATTERN: Context-aware scoring
     */
    calculateAdaptiveScore(vectorScore, keywordScore, vectorRank, keywordRank) {
        // Start with weighted score
        const weightedScore = this.calculateWeightedScore(vectorScore, keywordScore);
        // Add RRF component for rank consideration
        const rrfScore = this.calculateRRFScore(vectorRank, keywordRank);
        // Combine with adaptive weighting (70% weighted, 30% RRF)
        return weightedScore * 0.7 + rrfScore * 0.3;
    }
    /**
     * Generate cache key for hybrid search request
     * PATTERN: Content-based caching
     */
    async generateCacheKey(request) {
        const cacheData = {
            query: request.query,
            businessId: request.businessId,
            filters: request.filters,
            searchStrategy: request.searchStrategy,
            limit: request.limit,
            config: {
                vectorWeight: this.config.vectorWeight,
                keywordWeight: this.config.keywordWeight,
                fusionAlgorithm: this.config.fusionAlgorithm
            }
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
            if (this.env.HYBRID_CACHE) {
                const cached = await this.env.HYBRID_CACHE.get(key);
                if (cached) {
                    return JSON.parse(cached);
                }
            }
            return this.resultCache.get(key) || null;
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
            if (this.env.HYBRID_CACHE) {
                await this.env.HYBRID_CACHE.put(key, JSON.stringify(result), {
                    expirationTtl: this.config.cacheTtl
                });
            }
            // Also cache in memory
            this.resultCache.set(key, result);
            // Limit memory cache size
            if (this.resultCache.size > 100) {
                const firstKey = this.resultCache.keys().next().value;
                this.resultCache.delete(firstKey);
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
        if (request.searchStrategy && !['auto', 'vector', 'keyword', 'hybrid'].includes(request.searchStrategy)) {
            throw new Error('Invalid search strategy');
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
        const totalSearches = this.stats.totalSearches;
        this.stats.averageProcessingTimeMs = ((this.stats.averageProcessingTimeMs * totalSearches + processingTime) /
            (totalSearches + 1));
        this.stats.averageResultCount = ((this.stats.averageResultCount * totalSearches + resultCount) /
            (totalSearches + 1));
    }
    /**
     * Get search statistics
     * PATTERN: Monitoring and analytics
     */
    getStats() {
        return {
            ...this.stats,
            cacheSize: this.resultCache.size
        };
    }
    /**
     * Health check for hybrid query engine
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
            console.error('Hybrid query engine health check failed:', error);
            return false;
        }
    }
    /**
     * Clear all caches
     * PATTERN: Cache management
     */
    async clearCache() {
        try {
            this.resultCache.clear();
            if (this.env.HYBRID_CACHE) {
                console.log('KV hybrid cache clearing not implemented - keys would need to be tracked');
            }
        }
        catch (error) {
            console.error('Hybrid cache clearing failed:', error);
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
 * Factory function to create hybrid query engine
 */
export function createHybridQueryEngine(config, vectorSearch, embeddingService, supabase, env) {
    return new HybridQueryEngine(config, vectorSearch, embeddingService, supabase, env);
}
/**
 * Default hybrid query configuration
 */
export function getDefaultHybridQueryConfig() {
    return {
        vectorWeight: 0.7,
        keywordWeight: 0.3,
        maxVectorResults: 50,
        maxKeywordResults: 50,
        finalResultLimit: 20,
        fusionAlgorithm: 'adaptive',
        rrfConstant: 60,
        enableQueryAnalysis: true,
        keywordThreshold: 0.5,
        searchTimeout: 10000,
        enableParallelSearch: true,
        cacheResults: true,
        cacheTtl: 300
    };
}
/**
 * Utility function to analyze query complexity
 */
export function analyzeQueryComplexity(query) {
    const words = query.split(/\s+/);
    const wordCount = words.length;
    let complexity = 0;
    complexity += Math.min(wordCount / 10, 0.4); // Word count factor
    complexity += query.includes('?') ? 0.2 : 0; // Question factor
    complexity += /["\+\-\*]/.test(query) ? 0.3 : 0; // Operator factor
    complexity += words.filter(w => w.length > 6).length / wordCount * 0.1; // Long word factor
    return Math.min(complexity, 1);
}
/**
 * Utility function to detect query intent
 */
export function detectQueryIntent(query) {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('?') || /^(what|how|why|when|where|who|which)\b/.test(lowerQuery)) {
        return 'question';
    }
    if (/^(find|search|show|list|get)\b/.test(lowerQuery)) {
        return 'search';
    }
    if (/["\+\-\*]/.test(query) || lowerQuery.includes('filter')) {
        return 'filter';
    }
    return 'command';
}
