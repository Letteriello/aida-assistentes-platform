/**
 * AIDA Platform - Embedding Service
 * CRITICAL: Vector embedding generation for RAG system
 * PATTERN: Multi-provider embedding service with caching and batch processing
 */

import { OpenAIEmbeddings } from '@langchain/openai';
import { TenantAwareSupabase } from '../database/supabase-client';
import type { CloudflareEnv } from '@shared/types';

// Security validation function (placeholder)
function validateEmbedding(embedding: number[], expectedDimension: number): boolean {
  return Array.isArray(embedding) && embedding.length === expectedDimension && embedding.every(n => typeof n === 'number');
}

// Security logging function (placeholder)
function logSecurityEvent(event: string, details: any, businessId: string): void {
  console.warn(`Security event [${event}] for business ${businessId}:`, details);
}

export interface EmbeddingConfig {
  provider: 'openai' | 'cloudflare-ai';
  model: string;
  apiKey?: string;
  dimensions: number;
  batchSize: number;
  cacheEnabled: boolean;
  maxRetries: number;
}

export interface EmbeddingRequest {
  id: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface EmbeddingResult {
  id: string;
  embeddings: number[];
  dimensions: number;
  model: string;
  processingTimeMs: number;
  cached: boolean;
}

export interface EmbeddingStats {
  totalEmbeddingsGenerated: number;
  averageProcessingTimeMs: number;
  cacheHitRate: number;
  batchProcessingRate: number;
  errorRate: number;
}

/**
 * Embedding Service - Vector Generation and Management
 * PATTERN: Multi-provider embedding service with intelligent caching
 */
export class EmbeddingService {
  private config: EmbeddingConfig;
  private openaiEmbeddings?: OpenAIEmbeddings;
  private supabase: TenantAwareSupabase;
  private env: CloudflareEnv;
  private stats: EmbeddingStats;
  
  // Cache for embeddings (using KV store)
  private embeddingCache: Map<string, number[]> = new Map();
  
  constructor(
    config: EmbeddingConfig,
    supabase: TenantAwareSupabase,
    env: CloudflareEnv
  ) {
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
  private initializeProvider(): void {
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
  async generateEmbedding(content: string, useCache: boolean = true): Promise<EmbeddingResult> {
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
      
    } catch (error) {
      this.stats.errorRate++;
      console.error('Embedding generation failed:', error);
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate embeddings for multiple texts (batch processing)
   * PATTERN: Efficient batch processing with rate limiting
   */
  async generateBatchEmbeddings(requests: EmbeddingRequest[]): Promise<EmbeddingResult[]> {
    if (requests.length === 0) {
      return [];
    }

    if (requests.length > this.config.batchSize) {
      // Split into chunks
      const chunks: EmbeddingRequest[][] = [];
      for (let i = 0; i < requests.length; i += this.config.batchSize) {
        chunks.push(requests.slice(i, i + this.config.batchSize));
      }

      const results: EmbeddingResult[] = [];
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
    } catch (error) {
      console.error('Batch embedding generation failed:', error);
      
      // Fall back to sequential processing
      console.log('Falling back to sequential processing...');
      const results: EmbeddingResult[] = [];
      for (const request of requests) {
        try {
          const result = await this.generateEmbedding(request.content);
          results.push(result);
        } catch (requestError) {
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
  private async generateNewEmbedding(content: string): Promise<number[]> {
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
  private async hashContent(content: string): Promise<string> {
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
  private async getCachedEmbedding(key: string): Promise<number[] | null> {
    try {
      if (this.env.EMBEDDING_CACHE) {
        const cached = await this.env.EMBEDDING_CACHE.get(key);
        if (cached) {
          return JSON.parse(cached);
        }
      }
      return this.embeddingCache.get(key) || null;
    } catch (error) {
      console.error('Cache lookup failed:', error);
      return null;
    }
  }

  /**
   * Cache embedding result
   * PATTERN: Multi-tier caching strategy
   */
  private async cacheEmbedding(key: string, embedding: number[]): Promise<void> {
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
    } catch (error) {
      console.error('Caching failed:', error);
    }
  }

  /**
   * OpenAI embedding generation
   * PATTERN: External API integration with error handling
   */
  private async generateOpenAIEmbedding(text: string): Promise<number[]> {
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
  private async generateCloudflareEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.env.AI.run('@cf/baai/bge-base-en-v1.5', {
        text: [text]
      });
      
      if (!response.data || !response.data[0]) {
        throw new Error('Invalid response from Cloudflare AI');
      }
      
      return response.data[0];
    } catch (error) {
      console.error('Cloudflare AI embedding failed:', error);
      throw new Error(`Cloudflare AI embedding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update cache statistics
   * PATTERN: Performance monitoring
   */
  private updateCacheStats(wasHit: boolean): void {
    if (wasHit) {
      this.stats.cacheHitRate = (this.stats.cacheHitRate * this.stats.totalEmbeddingsGenerated + 1) / (this.stats.totalEmbeddingsGenerated + 1);
    } else {
      this.stats.cacheHitRate = (this.stats.cacheHitRate * this.stats.totalEmbeddingsGenerated) / (this.stats.totalEmbeddingsGenerated + 1);
    }
  }

  /**
   * Update generation statistics
   * PATTERN: Performance tracking
   */
  private updateGenerationStats(processingTime: number): void {
    this.stats.totalEmbeddingsGenerated++;
    this.stats.averageProcessingTimeMs = (
      (this.stats.averageProcessingTimeMs * (this.stats.totalEmbeddingsGenerated - 1) + processingTime) /
      this.stats.totalEmbeddingsGenerated
    );
  }

  /**
   * Update batch processing statistics
   * PATTERN: Batch performance monitoring
   */
  private updateBatchStats(requested: number, successful: number, processingTime: number): void {
    this.stats.batchProcessingRate = successful / requested;
    if (successful < requested) {
      this.stats.errorRate = (requested - successful) / requested;
    }
  }

  /**
   * Chunk array into smaller arrays
   * PATTERN: Utility for batch processing
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Validate embedding content
   * CRITICAL: Input validation and security
   */
  private validateContent(content: string): void {
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
  private validateEmbeddingResult(embedding: number[], businessId: string): void {
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
  private estimateTokenCount(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters for most languages
    return Math.ceil(text.length / 4);
  }

  private simpleHash(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private containsSuspiciousContent(text: string): boolean {
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

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get embedding service statistics
   * PATTERN: Monitoring and analytics
   */
  getStats(): EmbeddingStats & { cacheSize: number } {
    return {
      ...this.stats,
      cacheSize: this.embeddingCache.size
    };
  }

  /**
   * Clear all caches
   * PATTERN: Cache management
   */
  async clearCache(): Promise<void> {
    try {
      this.embeddingCache.clear();
      
      if (this.env.EMBEDDING_CACHE) {
        // Note: KV store doesn't have a clear all method
        // This would need to be implemented with a list of keys
        console.log('KV cache clearing not implemented - keys would need to be tracked');
      }
    } catch (error) {
      console.error('Cache clearing failed:', error);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<EmbeddingConfig>): void {
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
  getConfig(): EmbeddingConfig {
    return { ...this.config };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const testResult = await this.generateEmbedding('Health check test', false);
      
      return testResult.embeddings.length === this.config.dimensions;
    } catch (error) {
      console.error('Embedding service health check failed:', error);
      return false;
    }
  }
}

/**
 * Factory function to create embedding service
 */
export function createEmbeddingService(
  config: EmbeddingConfig,
  supabase: TenantAwareSupabase,
  env: CloudflareEnv
): EmbeddingService {
  return new EmbeddingService(config, supabase, env);
}

/**
 * Default embedding configuration
 */
export function getDefaultEmbeddingConfig(provider: 'openai' | 'cloudflare-ai' = 'openai'): EmbeddingConfig {
  const configs = {
    openai: {
      provider: 'openai' as const,
      model: 'text-embedding-3-small',
      dimensions: 1536,
      batchSize: 100,
      cacheEnabled: true,
      maxRetries: 3,
      apiKey: undefined // Will be provided at runtime
    },
    'cloudflare-ai': {
      provider: 'cloudflare-ai' as const,
      model: '@cf/baai/bge-base-en-v1.5',
      dimensions: 768,
      batchSize: 50,
      cacheEnabled: true,
      maxRetries: 3
    }
  };

  return configs[provider];
}