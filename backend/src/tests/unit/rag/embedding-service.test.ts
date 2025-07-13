/**
 * AIDA Platform - Embedding Service Tests
 * Unit tests for embedding generation and management
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmbeddingService, EmbeddingService, getDefaultEmbeddingConfig } from '../../../rag/embedding-service';

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('EmbeddingService', () => {
  let embeddingService: EmbeddingService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    embeddingService = createEmbeddingService({
      provider: 'openai',
      apiKey: 'test-api-key',
      model: 'text-embedding-3-small',
      dimension: 1536,
      maxTokens: 8191,
      batchSize: 100,
      rateLimitPerMinute: 1000
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('generateEmbedding', () => {
    it('should generate embedding for text successfully', async () => {
      const mockResponse = {
        data: [
          {
            embedding: new Array(1536).fill(0).map(() => Math.random() - 0.5),
            index: 0
          }
        ],
        usage: {
          prompt_tokens: 10,
          total_tokens: 10
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await embeddingService.generateEmbedding('Hello world!');

      expect(result).toHaveProperty('embedding');
      expect(result).toHaveProperty('tokenCount', 10);
      expect(result).toHaveProperty('processingTimeMs');
      expect(result).toHaveProperty('model', 'text-embedding-3-small');
      expect(result.embedding).toHaveLength(1536);
      expect(typeof result.processingTimeMs).toBe('number');
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Rate limit exceeded',
        json: () => Promise.resolve({ error: { message: 'Rate limit exceeded' } })
      });

      await expect(
        embeddingService.generateEmbedding('Hello world!')
      ).rejects.toThrow('Failed to generate embedding: Rate limit exceeded');
    });

    it('should validate text input', async () => {
      await expect(
        embeddingService.generateEmbedding('')
      ).rejects.toThrow('Text cannot be empty');

      await expect(
        embeddingService.generateEmbedding('  \n  \t  ')
      ).rejects.toThrow('Text cannot be empty');
    });

    it('should handle text that exceeds token limit', async () => {
      const longText = 'word '.repeat(10000); // Simulate very long text

      await expect(
        embeddingService.generateEmbedding(longText)
      ).rejects.toThrow('Text exceeds maximum token limit');
    });

    it('should use cache for identical inputs', async () => {
      const mockResponse = {
        data: [{ embedding: new Array(1536).fill(0.1), index: 0 }],
        usage: { prompt_tokens: 10, total_tokens: 10 }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const text = 'Hello world!';
      
      // First call
      const result1 = await embeddingService.generateEmbedding(text);
      
      // Second call should use cache
      const result2 = await embeddingService.generateEmbedding(text);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result1.embedding).toEqual(result2.embedding);
    });
  });

  describe('generateBatchEmbeddings', () => {
    it('should generate embeddings for multiple texts', async () => {
      const mockResponse = {
        data: [
          { embedding: new Array(1536).fill(0.1), index: 0 },
          { embedding: new Array(1536).fill(0.2), index: 1 }
        ],
        usage: {
          prompt_tokens: 20,
          total_tokens: 20
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const texts = ['Hello world!', 'Goodbye world!'];
      const results = await embeddingService.generateBatchEmbeddings(texts);

      expect(results).toHaveLength(2);
      expect(results[0].embedding).toHaveLength(1536);
      expect(results[1].embedding).toHaveLength(1536);
      expect(results[0].embedding).not.toEqual(results[1].embedding);
    });

    it('should handle batch size limits', async () => {
      const texts = new Array(150).fill('test text'); // Exceeds batch size of 100

      const spy = vi.spyOn(embeddingService, 'generateEmbedding')
        .mockResolvedValue({
          embedding: new Array(1536).fill(0.1),
          tokenCount: 10,
          processingTimeMs: 100,
          model: 'text-embedding-3-small'
        });

      await embeddingService.generateBatchEmbeddings(texts);

      // Should make 2 batch requests (100 + 50)
      expect(spy).toHaveBeenCalledTimes(150);
    });

    it('should handle partial failures in batch', async () => {
      const texts = ['valid text', '', 'another valid text'];

      const spy = vi.spyOn(embeddingService, 'generateEmbedding')
        .mockImplementation((text) => {
          if (text === '') {
            return Promise.reject(new Error('Text cannot be empty'));
          }
          return Promise.resolve({
            embedding: new Array(1536).fill(0.1),
            tokenCount: 10,
            processingTimeMs: 100,
            model: 'text-embedding-3-small'
          });
        });

      const results = await embeddingService.generateBatchEmbeddings(texts);

      expect(results).toHaveLength(2); // Only valid texts
      expect(spy).toHaveBeenCalledTimes(3);
    });
  });

  describe('queueEmbeddingRequest', () => {
    it('should queue embedding request for async processing', async () => {
      const request = {
        id: 'test-request-123',
        text: 'Hello world!',
        metadata: { type: 'message' }
      };

      // Should not throw error
      await expect(
        embeddingService.queueEmbeddingRequest(request)
      ).resolves.not.toThrow();
    });

    it('should validate queue request format', async () => {
      const invalidRequest = {
        text: '', // Empty text
        metadata: {}
      };

      await expect(
        embeddingService.queueEmbeddingRequest(invalidRequest as any)
      ).rejects.toThrow('Invalid queue request');
    });
  });

  describe('getStats', () => {
    it('should return service statistics', () => {
      const stats = embeddingService.getStats();

      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('successfulRequests');
      expect(stats).toHaveProperty('failedRequests');
      expect(stats).toHaveProperty('averageProcessingTime');
      expect(stats).toHaveProperty('rateLimitHits');
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('queueSize');

      expect(typeof stats.totalRequests).toBe('number');
      expect(typeof stats.successfulRequests).toBe('number');
      expect(typeof stats.failedRequests).toBe('number');
      expect(typeof stats.averageProcessingTime).toBe('number');
      expect(typeof stats.rateLimitHits).toBe('number');
      expect(typeof stats.cacheSize).toBe('number');
      expect(typeof stats.queueSize).toBe('number');
    });
  });

  describe('healthCheck', () => {
    it('should return true for healthy service', async () => {
      const mockResponse = {
        data: [{ embedding: new Array(1536).fill(0.1), index: 0 }],
        usage: { prompt_tokens: 5, total_tokens: 5 }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const isHealthy = await embeddingService.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should return false when API is unreachable', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const isHealthy = await embeddingService.healthCheck();
      expect(isHealthy).toBe(false);
    });

    it('should return false when API returns error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const isHealthy = await embeddingService.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });

  describe('rate limiting', () => {
    it('should respect rate limits', async () => {
      // Create service with very low rate limit
      const limitedService = createEmbeddingService({
        provider: 'openai',
        apiKey: 'test-api-key',
        model: 'text-embedding-3-small',
        dimension: 1536,
        maxTokens: 8191,
        batchSize: 100,
        rateLimitPerMinute: 1 // Very low limit
      });

      const mockResponse = {
        data: [{ embedding: new Array(1536).fill(0.1), index: 0 }],
        usage: { prompt_tokens: 10, total_tokens: 10 }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      // First request should succeed
      await limitedService.generateEmbedding('Hello world!');

      // Second request should be rate limited
      await expect(
        limitedService.generateEmbedding('Hello again!')
      ).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('different providers', () => {
    it('should work with anthropic provider', async () => {
      const anthropicService = createEmbeddingService({
        provider: 'anthropic',
        apiKey: 'test-anthropic-key',
        model: 'claude-3-haiku',
        dimension: 384,
        maxTokens: 4096,
        batchSize: 50,
        rateLimitPerMinute: 500
      });

      expect(anthropicService).toBeDefined();
      expect(anthropicService.healthCheck).toBeDefined();
    });

    it('should work with local provider', async () => {
      const localService = createEmbeddingService({
        provider: 'local',
        apiKey: '',
        model: 'all-MiniLM-L6-v2',
        dimension: 384,
        maxTokens: 512,
        batchSize: 32,
        rateLimitPerMinute: 10000
      });

      expect(localService).toBeDefined();
      expect(localService.healthCheck).toBeDefined();
    });
  });

  describe('caching', () => {
    it('should clear cache when requested', async () => {
      const mockResponse = {
        data: [{ embedding: new Array(1536).fill(0.1), index: 0 }],
        usage: { prompt_tokens: 10, total_tokens: 10 }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const text = 'Hello world!';
      
      // Generate embedding (should be cached)
      await embeddingService.generateEmbedding(text);
      
      // Clear cache
      embeddingService.clearCache();
      
      // Generate again (should make new API call)
      await embeddingService.generateEmbedding(text);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should report correct cache size', async () => {
      const mockResponse = {
        data: [{ embedding: new Array(1536).fill(0.1), index: 0 }],
        usage: { prompt_tokens: 10, total_tokens: 10 }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const initialStats = embeddingService.getStats();
      expect(initialStats.cacheSize).toBe(0);

      await embeddingService.generateEmbedding('Hello world!');

      const statsAfterCache = embeddingService.getStats();
      expect(statsAfterCache.cacheSize).toBe(1);
    });
  });
});

describe('Factory functions', () => {
  it('should create embedding service with factory function', () => {
    const service = createEmbeddingService({
      provider: 'openai',
      apiKey: 'test-key',
      model: 'text-embedding-3-small',
      dimension: 1536,
      maxTokens: 8191,
      batchSize: 100,
      rateLimitPerMinute: 1000
    });

    expect(service).toBeInstanceOf(EmbeddingService);
  });

  it('should provide default configuration', () => {
    const config = getDefaultEmbeddingConfig();
    
    expect(config).toHaveProperty('provider', 'openai');
    expect(config).toHaveProperty('model', 'text-embedding-3-small');
    expect(config).toHaveProperty('dimension', 1536);
    expect(config).toHaveProperty('maxTokens', 8191);
    expect(config).toHaveProperty('batchSize', 100);
    expect(config).toHaveProperty('rateLimitPerMinute', 1000);
  });

  it('should validate configuration', () => {
    expect(() => {
      createEmbeddingService({
        provider: 'openai',
        apiKey: '', // Empty API key
        model: 'text-embedding-3-small',
        dimension: 1536,
        maxTokens: 8191,
        batchSize: 100,
        rateLimitPerMinute: 1000
      });
    }).toThrow('API key is required');

    expect(() => {
      createEmbeddingService({
        provider: 'openai',
        apiKey: 'test-key',
        model: 'text-embedding-3-small',
        dimension: 0, // Invalid dimension
        maxTokens: 8191,
        batchSize: 100,
        rateLimitPerMinute: 1000
      });
    }).toThrow('Dimension must be greater than 0');
  });
});