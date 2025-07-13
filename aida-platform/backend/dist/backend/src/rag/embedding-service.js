/**
 * AIDA Platform - Embedding Service
 * CRITICAL: Vector embedding generation for RAG system
 * PATTERN: Multi-provider embedding service with caching and batch processing
 */
import { OpenAIEmbeddings } from '@langchain/openai';
// Security validation function (placeholder)
function validateEmbedding(embedding, expectedDimension) {
    return Array.isArray(embedding) && embedding.length === expectedDimension && embedding.every(n => typeof n === 'number');
}
// Security logging function (placeholder)
function logSecurityEvent(event, details, businessId) {
    console.warn(`Security event [${event}] for business ${businessId}:`, details);
}
/**
 * Embedding Service - Vector Generation and Management
 * PATTERN: Multi-provider embedding service with intelligent caching
 */
export class EmbeddingService {
    config;
    openaiEmbeddings;
    supabase;
    env;
    stats;
    // Cache for embeddings (using KV store)
    embeddingCache = new Map();
    constructor(config, supabase, env) {
        this.config = config;
        this.supabase = supabase;
        this.env = env;
        this.stats = {
            totalEmbeddingsGenerated: 0,
            averageProcessingTimeMs: 0,
            cacheHitRate: 0,
            batchProcessingRate: 0,
            errorRate: 0
        };
        this.initializeProvider();
    }
    /**
     * Initialize embedding provider
     * PATTERN: Provider abstraction for embedding models
     */
    initializeProvider() {
        switch (this.config.provider) {
            case 'openai':
                if (!this.config.apiKey) {
                    throw new Error('OpenAI API key required for OpenAI embeddings');
                }
                this.openaiEmbeddings = new OpenAIEmbeddings({
                    openAIApiKey: this.config.apiKey,
                    modelName: this.config.model,
                    dimensions: this.config.dimensions,
                    batchSize: this.config.batchSize,
                    maxRetries: this.config.maxRetries
                });
                break;
            case 'cloudflare-ai':
                // Cloudflare AI binding will be used directly
                break;
            default:
                throw new Error(`Unsupported embedding provider: ${this.config.provider}`);
        }
    }
    /**
     * Generate embeddings for single text
     * CRITICAL: Main embedding generation entry point
     */
    async generateEmbedding(content, useCache = true) {
        const startTime = performance.now();
        const contentHash = await this.hashContent(content);
        try {
            // Check cache first
            if (useCache && this.config.cacheEnabled) {
                const cached = await this.getCachedEmbedding(contentHash);
                if (cached) {
                    const processingTime = performance.now() - startTime;
                    this.updateCacheStats(true);
                    return {
                        id: contentHash,
                        embeddings: cached,
                        dimensions: this.config.dimensions,
                        model: this.config.model,
                        processingTimeMs: processingTime,
                        cached: true
                    };
                }
            }
            // Generate new embedding
            const embeddings = await this.generateNewEmbedding(content);
            const processingTime = performance.now() - startTime;
            // Cache the result
            if (this.config.cacheEnabled) {
                await this.cacheEmbedding(contentHash, embeddings);
                this.updateCacheStats(false);
            }
            this.updateGenerationStats(processingTime);
            return {
                id: contentHash,
                embeddings,
                dimensions: this.config.dimensions,
                model: this.config.model,
                processingTimeMs: processingTime,
                cached: false
            };
        }
        catch (error) {
            this.stats.errorRate++;
            console.error('Embedding generation failed:', error);
            throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Generate embeddings for multiple texts (batch processing)
     * PATTERN: Efficient batch processing with rate limiting
     */
    async generateBatchEmbeddings(requests) {
        if (requests.length === 0) {
            return [];
        }
        if (requests.length > this.config.batchSize) {
            // Split into chunks
            const chunks = [];
            for (let i = 0; i < requests.length; i += this.config.batchSize) {
                chunks.push(requests.slice(i, i + this.config.batchSize));
            }
            const results = [];
            for (const chunk of chunks) {
                const chunkResults = await this.generateBatchEmbeddings(chunk);
                results.push(...chunkResults);
                // Add delay between chunks to respect rate limits
                if (chunks.indexOf(chunk) < chunks.length - 1) {
                    await this.delay(1000);
                }
            }
            return results;
        }
        // Process all requests in parallel
        const promises = requests.map(request => this.generateEmbedding(request.content));
        try {
            return await Promise.all(promises);
        }
        catch (error) {
            console.error('Batch embedding generation failed:', error);
            // Fall back to sequential processing
            console.log('Falling back to sequential processing...');
            const results = [];
            for (const request of requests) {
                try {
                    const result = await this.generateEmbedding(request.content);
                    results.push(result);
                }
                catch (requestError) {
                    console.error(`Failed to generate embedding for text: ${request.content.substring(0, 50)}...`, requestError);
                    // Continue with other requests
                }
            }
            return results;
        }
    }
    /**
     * Generate new embedding using configured provider
     * PATTERN: Provider abstraction for different embedding services
     */
    async generateNewEmbedding(content) {
        switch (this.config.provider) {
            case 'openai':
                return await this.generateOpenAIEmbedding(content);
            case 'cloudflare-ai':
                return await this.generateCloudflareEmbedding(content);
            default:
                throw new Error(`Unsupported embedding provider: ${this.config.provider}`);
        }
    }
    /**
     * Generate hash for content caching
     * PATTERN: Content-based caching key generation
     */
    async hashContent(content) {
        const encoder = new TextEncoder();
        const data = encoder.encode(content + this.config.model);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    /**
     * Get cached embedding if available
     * PATTERN: Cache lookup with expiration
     */
    async getCachedEmbedding(key) {
        try {
            if (this.env.EMBEDDING_CACHE) {
                const cached = await this.env.EMBEDDING_CACHE.get(key);
                if (cached) {
                    return JSON.parse(cached);
                }
            }
            return this.embeddingCache.get(key) || null;
        }
        catch (error) {
            console.error('Cache lookup failed:', error);
            return null;
        }
    }
    /**
     * Cache embedding result
     * PATTERN: Multi-tier caching strategy
     */
    async cacheEmbedding(key, embedding) {
        try {
            // Cache in KV store if available
            if (this.env.EMBEDDING_CACHE) {
                await this.env.EMBEDDING_CACHE.put(key, JSON.stringify(embedding), {
                    expirationTtl: 86400 // 24 hours
                });
            }
            // Also cache in memory for faster access
            this.embeddingCache.set(key, embedding);
            // Limit memory cache size
            if (this.embeddingCache.size > 1000) {
                const firstKey = this.embeddingCache.keys().next().value;
                this.embeddingCache.delete(firstKey);
            }
        }
        catch (error) {
            console.error('Caching failed:', error);
        }
    }
    /**
     * OpenAI embedding generation
     * PATTERN: External API integration with error handling
     */
    async generateOpenAIEmbedding(text) {
        if (!this.config.apiKey) {
            throw new Error('OpenAI API key not configured');
        }
        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                input: text,
                model: this.config.model,
                encoding_format: 'float'
            })
        });
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
        }
        const data = await response.json();
        if (!data.data || !data.data[0] || !data.data[0].embedding) {
            throw new Error('Invalid response from OpenAI API');
        }
        return data.data[0].embedding;
    }
    /**
     * Cloudflare AI embedding generation
     * PATTERN: Use Cloudflare Workers AI for embeddings
     */
    async generateCloudflareEmbedding(text) {
        try {
            const response = await this.env.AI.run('@cf/baai/bge-base-en-v1.5', {
                text: [text]
            });
            if (!response.data || !response.data[0]) {
                throw new Error('Invalid response from Cloudflare AI');
            }
            return response.data[0];
        }
        catch (error) {
            console.error('Cloudflare AI embedding failed:', error);
            throw new Error(`Cloudflare AI embedding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Update cache statistics
     * PATTERN: Performance monitoring
     */
    updateCacheStats(wasHit) {
        if (wasHit) {
            this.stats.cacheHitRate = (this.stats.cacheHitRate * this.stats.totalEmbeddingsGenerated + 1) / (this.stats.totalEmbeddingsGenerated + 1);
        }
        else {
            this.stats.cacheHitRate = (this.stats.cacheHitRate * this.stats.totalEmbeddingsGenerated) / (this.stats.totalEmbeddingsGenerated + 1);
        }
    }
    /**
     * Update generation statistics
     * PATTERN: Performance tracking
     */
    updateGenerationStats(processingTime) {
        this.stats.totalEmbeddingsGenerated++;
        this.stats.averageProcessingTimeMs = ((this.stats.averageProcessingTimeMs * (this.stats.totalEmbeddingsGenerated - 1) + processingTime) /
            this.stats.totalEmbeddingsGenerated);
    }
    /**
     * Update batch processing statistics
     * PATTERN: Batch performance monitoring
     */
    updateBatchStats(requested, successful, processingTime) {
        this.stats.batchProcessingRate = successful / requested;
        if (successful < requested) {
            this.stats.errorRate = (requested - successful) / requested;
        }
    }
    /**
     * Chunk array into smaller arrays
     * PATTERN: Utility for batch processing
     */
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
    /**
     * Validate embedding content
     * CRITICAL: Input validation and security
     */
    validateContent(content) {
        if (!content || typeof content !== 'string') {
            throw new Error('Content is required and must be a string');
        }
        if (content.length === 0) {
            throw new Error('Content cannot be empty');
        }
        if (content.length > 8000) { // Reasonable limit for most embedding models
            throw new Error('Content too long: maximum 8000 characters allowed');
        }
        // Check for suspicious content
        if (this.containsSuspiciousContent(content)) {
            throw new Error('Content contains potentially harmful content');
        }
    }
    /**
     * Validate embedding result
     * CRITICAL: Security validation of generated embeddings
     */
    validateEmbeddingResult(embedding, businessId) {
        if (!validateEmbedding(embedding, this.config.dimensions)) {
            logSecurityEvent('invalid_embedding', {
                expectedDimensions: this.config.dimensions,
                actualLength: embedding?.length,
                model: this.config.model
            }, businessId);
            throw new Error('Generated embedding failed validation');
        }
    }
    /**
     * Utility functions
     */
    estimateTokenCount(text) {
        // Rough estimate: 1 token ≈ 4 characters for most languages
        return Math.ceil(text.length / 4);
    }
    simpleHash(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    containsSuspiciousContent(text) {
        // Enhanced content filtering
        const suspiciousPatterns = [
            /\b(hack|exploit|vulnerability|injection|malware)\b/i,
            /\b(password|secret|token|key)\s*[:=]\s*\w+/i,
            /<script[^>]*>.*?<\/script>/i,
            /javascript:\s*[^\s]/i,
            /\b(credit[_-]?card|ssn|social[_-]?security)\b/i
        ];
        return suspiciousPatterns.some(pattern => pattern.test(text));
    }
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Get embedding service statistics
     * PATTERN: Monitoring and analytics
     */
    getStats() {
        return {
            ...this.stats,
            cacheSize: this.embeddingCache.size
        };
    }
    /**
     * Clear all caches
     * PATTERN: Cache management
     */
    async clearCache() {
        try {
            this.embeddingCache.clear();
            if (this.env.EMBEDDING_CACHE) {
                // Note: KV store doesn't have a clear all method
                // This would need to be implemented with a list of keys
                console.log('KV cache clearing not implemented - keys would need to be tracked');
            }
        }
        catch (error) {
            console.error('Cache clearing failed:', error);
        }
    }
    /**
     * Update configuration
     */
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
        // Re-initialize provider if provider changed
        if (updates.provider) {
            this.initializeProvider();
        }
    }
    /**
     * Get embedding service configuration
     * PATTERN: Configuration access
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Health check
     */
    async healthCheck() {
        try {
            const testResult = await this.generateEmbedding('Health check test', false);
            return testResult.embeddings.length === this.config.dimensions;
        }
        catch (error) {
            console.error('Embedding service health check failed:', error);
            return false;
        }
    }
}
/**
 * Factory function to create embedding service
 */
export function createEmbeddingService(config, supabase, env) {
    return new EmbeddingService(config, supabase, env);
}
/**
 * Default embedding configuration
 */
export function getDefaultEmbeddingConfig(provider = 'openai') {
    const configs = {
        openai: {
            provider: 'openai',
            model: 'text-embedding-3-small',
            dimensions: 1536,
            batchSize: 100,
            cacheEnabled: true,
            maxRetries: 3,
            apiKey: undefined // Will be provided at runtime
        },
        'cloudflare-ai': {
            provider: 'cloudflare-ai',
            model: '@cf/baai/bge-base-en-v1.5',
            dimensions: 768,
            batchSize: 50,
            cacheEnabled: true,
            maxRetries: 3
        }
    };
    return configs[provider];
}
