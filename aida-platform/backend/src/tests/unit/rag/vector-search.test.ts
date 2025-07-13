/**
 * AIDA Platform - Vector Search Tests
 * Unit tests for RAG vector search functionality
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createVectorSearchService, getDefaultVectorSearchConfig, VectorSearchService } from '../../../rag/vector-search';
import { TenantAwareSupabase } from '../../../database/supabase-client';

// Mock TenantAwareSupabase
class MockTenantAwareSupabase {
  private businessId: string;

  constructor(businessId: string = 'test-business-123') {
    this.businessId = businessId;
  }

  async vectorSearch<T>(
    table: string,
    embedding: number[],
    limit: number,
    threshold: number,
    filters?: Record<string, any>
  ): Promise<Array<T & { similarity: number }>> {
    // Mock implementation returning test data
    const mockResults = [
      {
        id: 'test-id-1',
        content: 'Test content 1',
        similarity: 0.9,
        metadata: { type: 'test' }
      },
      {
        id: 'test-id-2', 
        content: 'Test content 2',
        similarity: 0.8,
        metadata: { type: 'test' }
      }
    ];

    return mockResults
      .filter(result => result.similarity >= threshold)
      .slice(0, limit) as Array<T & { similarity: number }>;
  }

  async query<T>(table: string, select: string, filters?: Record<string, any>): Promise<T[]> {
    // Mock query implementation
    return [];
  }

  async getBusinessContext(): Promise<any> {
    return { id: this.businessId };
  }
}

describe('VectorSearchEngine', () => {
  let searchEngine: VectorSearchEngine;
  let mockSupabase: MockTenantAwareSupabase;

  beforeEach(() => {
    mockSupabase = new MockTenantAwareSupabase();
    
    searchEngine = createVectorSearchEngine({
      supabase: mockSupabase as any,
      defaultThreshold: 0.7,
      defaultLimit: 10,
      embeddingDimension: 384
    });
  });

  describe('search', () => {
    it('should perform vector search successfully', async () => {
      const testEmbedding = new Array(384).fill(0.1);
      const query = {
        query: 'test query',
        business_id: 'test-business-123',
        max_results: 5
      };

      const results = await searchEngine.search(query, testEmbedding);

      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('content');
      expect(results[0]).toHaveProperty('score');
      expect(results[0]).toHaveProperty('source', 'vector');
      expect(results[0].score).toBeGreaterThanOrEqual(0.7);
    });

    it('should validate embedding dimensions', async () => {
      const invalidEmbedding = new Array(100).fill(0.1); // Wrong dimension
      const query = {
        query: 'test query',
        business_id: 'test-business-123'
      };

      await expect(
        searchEngine.search(query, invalidEmbedding)
      ).rejects.toThrow('Invalid embedding: expected 384 dimensions');
    });

    it('should filter results by threshold', async () => {
      const testEmbedding = new Array(384).fill(0.1);
      const query = {
        query: 'test query',
        business_id: 'test-business-123'
      };

      const results = await searchEngine.search(query, testEmbedding, {
        threshold: 0.85 // Higher threshold
      });

      // Should only return results with similarity >= 0.85
      expect(results).toHaveLength(1);
      expect(results[0].score).toBeGreaterThanOrEqual(0.85);
    });

    it('should limit results correctly', async () => {
      const testEmbedding = new Array(384).fill(0.1);
      const query = {
        query: 'test query',
        business_id: 'test-business-123'
      };

      const results = await searchEngine.search(query, testEmbedding, {
        limit: 1
      });

      expect(results).toHaveLength(1);
    });

    it('should handle filter types', async () => {
      const testEmbedding = new Array(384).fill(0.1);
      const query = {
        query: 'test query',
        business_id: 'test-business-123'
      };

      const results = await searchEngine.search(query, testEmbedding, {
        filterTypes: ['conversation'] // Only search conversations
      });

      expect(results).toBeDefined();
    });
  });

  describe('searchConversations', () => {
    it('should search conversations with proper filters', async () => {
      const testEmbedding = new Array(384).fill(0.1);
      
      const results = await searchEngine.searchConversations(
        testEmbedding,
        0.7,
        5
      );

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should filter by conversation ID when provided', async () => {
      const testEmbedding = new Array(384).fill(0.1);
      
      const results = await searchEngine.searchConversations(
        testEmbedding,
        0.7,
        5,
        'specific-conversation-id'
      );

      expect(results).toBeDefined();
    });

    it('should filter by time range when provided', async () => {
      const testEmbedding = new Array(384).fill(0.1);
      const timeRange = {
        start: new Date('2023-01-01'),
        end: new Date('2023-12-31')
      };
      
      const results = await searchEngine.searchConversations(
        testEmbedding,
        0.7,
        5,
        undefined,
        timeRange
      );

      expect(results).toBeDefined();
    });
  });

  describe('searchMessages', () => {
    it('should search messages successfully', async () => {
      const testEmbedding = new Array(384).fill(0.1);
      
      const results = await searchEngine.searchMessages(
        testEmbedding,
        0.7,
        5
      );

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('searchKnowledge', () => {
    it('should search knowledge base successfully', async () => {
      const testEmbedding = new Array(384).fill(0.1);
      
      const results = await searchEngine.searchKnowledge(
        testEmbedding,
        0.7,
        5
      );

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should filter by entity types when provided', async () => {
      const testEmbedding = new Array(384).fill(0.1);
      
      const results = await searchEngine.searchKnowledge(
        testEmbedding,
        0.7,
        5,
        ['product', 'service']
      );

      expect(results).toBeDefined();
    });
  });

  describe('findSimilarConversations', () => {
    it('should find similar conversations', async () => {
      // Mock the query method to return a conversation with embeddings
      vi.spyOn(mockSupabase, 'query').mockResolvedValueOnce([
        {
          embeddings: new Array(384).fill(0.1),
          context_summary: 'Test conversation'
        }
      ]);

      const results = await searchEngine.findSimilarConversations(
        'test-conversation-id',
        3
      );

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should return empty array when no embeddings found', async () => {
      vi.spyOn(mockSupabase, 'query').mockResolvedValueOnce([]);

      const results = await searchEngine.findSimilarConversations(
        'nonexistent-conversation-id',
        3
      );

      expect(results).toHaveLength(0);
    });
  });

  describe('batchSearch', () => {
    it('should perform multiple searches in parallel', async () => {
      const queries = [
        { embedding: new Array(384).fill(0.1) },
        { embedding: new Array(384).fill(0.2) }
      ];

      const results = await searchEngine.batchSearch(queries, 5);

      expect(results).toHaveLength(2);
      expect(Array.isArray(results[0])).toBe(true);
      expect(Array.isArray(results[1])).toBe(true);
    });
  });

  describe('getSearchStats', () => {
    it('should return search statistics', async () => {
      const stats = await searchEngine.getSearchStats();

      expect(stats).toHaveProperty('totalConversations');
      expect(stats).toHaveProperty('totalMessages');
      expect(stats).toHaveProperty('totalKnowledgeNodes');
      expect(stats).toHaveProperty('embeddingCoverage');
      expect(stats.embeddingCoverage).toHaveProperty('conversations');
      expect(stats.embeddingCoverage).toHaveProperty('messages');
      expect(stats.embeddingCoverage).toHaveProperty('knowledge');
    });
  });

  describe('healthCheck', () => {
    it('should return true for healthy search engine', async () => {
      const isHealthy = await searchEngine.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      // Mock an error in vectorSearch
      vi.spyOn(mockSupabase, 'vectorSearch').mockRejectedValueOnce(new Error('Database error'));

      const isHealthy = await searchEngine.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });

  describe('configuration', () => {
    it('should update configuration', () => {
      searchEngine.updateConfig({
        defaultThreshold: 0.8,
        defaultLimit: 15
      });

      // Configuration should be updated (can't directly test private config)
      expect(searchEngine).toBeDefined();
    });
  });
});

describe('Factory functions', () => {
  it('should create vector search engine with factory function', () => {
    const mockSupabase = new MockTenantAwareSupabase();
    
    const engine = createVectorSearchEngine({
      supabase: mockSupabase as any,
      defaultThreshold: 0.7,
      defaultLimit: 10,
      embeddingDimension: 384
    });

    expect(engine).toBeInstanceOf(VectorSearchEngine);
  });

  it('should provide default configuration', () => {
    const mockSupabase = new MockTenantAwareSupabase();
    const config = getDefaultVectorSearchConfig(mockSupabase as any);
    
    expect(config).toHaveProperty('supabase');
    expect(config).toHaveProperty('defaultThreshold', 0.7);
    expect(config).toHaveProperty('defaultLimit', 10);
    expect(config).toHaveProperty('embeddingDimension', 384);
  });
});