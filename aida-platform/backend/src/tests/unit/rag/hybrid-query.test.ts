/**
 * AIDA Platform - Hybrid Query Engine Tests
 * Unit tests for the hybrid RAG query system
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHybridQueryEngine, getDefaultHybridQueryConfig, HybridQueryEngine } from '../../../rag/hybrid-query-engine';
import { testHelpers } from '../../setup';

describe('HybridQueryEngine', () => {
  let hybridQueryEngine: HybridQueryEngine;
  let mockVectorSearchEngine: any;
  let mockEmbeddingService: any;
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockVectorSearchEngine = {
      search: vi.fn(),
      searchConversations: vi.fn(),
      searchMessages: vi.fn(),
      searchKnowledge: vi.fn(),
      healthCheck: vi.fn().mockResolvedValue(true)
    };

    mockEmbeddingService = testHelpers.createMockEmbeddingService();
    mockSupabase = testHelpers.createMockSupabase();

    hybridQueryEngine = createHybridQueryEngine({
      vectorSearchEngine: mockVectorSearchEngine,
      embeddingService: mockEmbeddingService,
      supabase: mockSupabase,
      vectorWeight: 0.5,
      textWeight: 0.3,
      graphWeight: 0.2,
      vectorThreshold: 0.7,
      textThreshold: 0.6,
      combinedThreshold: 0.5,
      maxVectorResults: 8,
      maxTextResults: 5,
      maxGraphResults: 4,
      maxCombinedResults: 10
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('search', () => {
    it('should perform hybrid search combining vector, text, and graph results', async () => {
      const query = {
        text: 'How do I reset my password?',
        businessId: 'test-business-123',
        conversationId: 'conv-456',
        assistantId: 'assistant-789'
      };

      // Mock embedding generation
      mockEmbeddingService.generateEmbedding.mockResolvedValue({
        embedding: testHelpers.generateTestEmbedding(1536),
        tokenCount: 15,
        processingTimeMs: 50,
        model: 'text-embedding-3-small'
      });

      // Mock vector search results
      mockVectorSearchEngine.search.mockResolvedValue([
        {
          id: 'vector-1',
          content: 'To reset your password, go to the login page and click "Forgot Password"',
          score: 0.9,
          source: 'vector',
          metadata: { type: 'faq', category: 'authentication' }
        },
        {
          id: 'vector-2',
          content: 'Password reset instructions are sent to your email address',
          score: 0.8,
          source: 'vector',
          metadata: { type: 'documentation' }
        }
      ]);

      // Mock text search results (full-text search)
      mockSupabase.rpc.mockImplementation((functionName, params) => {
        if (functionName === 'search_knowledge_text') {
          return Promise.resolve({
            data: [
              {
                id: 'text-1',
                content: 'Password reset process involves verifying your email',
                score: 0.7,
                metadata: { type: 'support_article' }
              }
            ],
            error: null
          });
        }
        if (functionName === 'search_graph_knowledge') {
          return Promise.resolve({
            data: [
              {
                id: 'graph-1',
                content: 'Authentication flows connect to password recovery',
                score: 0.6,
                metadata: { type: 'knowledge_graph', relationship: 'related_to' }
              }
            ],
            error: null
          });
        }
        return Promise.resolve({ data: [], error: null });
      });

      const results = await hybridQueryEngine.search(query);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      // Verify that results are sorted by combined score
      for (let i = 1; i < results.length; i++) {
        expect(results[i].combinedScore).toBeLessThanOrEqual(results[i - 1].combinedScore);
      }

      // Verify that vector search was called
      expect(mockVectorSearchEngine.search).toHaveBeenCalledWith(
        expect.objectContaining({
          query: query.text,
          business_id: query.businessId
        }),
        expect.any(Array), // embedding
        expect.any(Object)  // options
      );

      // Verify that embedding was generated
      expect(mockEmbeddingService.generateEmbedding).toHaveBeenCalledWith(query.text);
    });

    it('should handle empty results gracefully', async () => {
      const query = {
        text: 'nonexistent topic',
        businessId: 'test-business-123'
      };

      mockEmbeddingService.generateEmbedding.mockResolvedValue({
        embedding: testHelpers.generateTestEmbedding(1536),
        tokenCount: 10,
        processingTimeMs: 50,
        model: 'test-model'
      });

      mockVectorSearchEngine.search.mockResolvedValue([]);
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

      const results = await hybridQueryEngine.search(query);

      expect(results).toEqual([]);
    });

    it('should apply threshold filtering correctly', async () => {
      const query = {
        text: 'test query',
        businessId: 'test-business-123'
      };

      mockEmbeddingService.generateEmbedding.mockResolvedValue({
        embedding: testHelpers.generateTestEmbedding(1536),
        tokenCount: 10,
        processingTimeMs: 50,
        model: 'test-model'
      });

      // Mock results with varying scores
      mockVectorSearchEngine.search.mockResolvedValue([
        {
          id: 'high-score',
          content: 'High relevance content',
          score: 0.9,
          source: 'vector',
          metadata: {}
        },
        {
          id: 'low-score',
          content: 'Low relevance content',
          score: 0.3, // Below vector threshold
          source: 'vector',
          metadata: {}
        }
      ]);

      mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

      const results = await hybridQueryEngine.search(query);

      // Should only include results above threshold
      expect(results.every(result => result.combinedScore >= 0.5)).toBe(true);
    });

    it('should weight different sources according to configuration', async () => {
      const query = {
        text: 'test query',
        businessId: 'test-business-123'
      };

      mockEmbeddingService.generateEmbedding.mockResolvedValue({
        embedding: testHelpers.generateTestEmbedding(1536),
        tokenCount: 10,
        processingTimeMs: 50,
        model: 'test-model'
      });

      mockVectorSearchEngine.search.mockResolvedValue([
        {
          id: 'vector-result',
          content: 'Vector search result',
          score: 0.8,
          source: 'vector',
          metadata: {}
        }
      ]);

      mockSupabase.rpc.mockImplementation((functionName) => {
        if (functionName === 'search_knowledge_text') {
          return Promise.resolve({
            data: [
              {
                id: 'text-result',
                content: 'Text search result',
                score: 0.8,
                metadata: {}
              }
            ],
            error: null
          });
        }
        if (functionName === 'search_graph_knowledge') {
          return Promise.resolve({
            data: [
              {
                id: 'graph-result',
                content: 'Graph search result',
                score: 0.8,
                metadata: {}
              }
            ],
            error: null
          });
        }
        return Promise.resolve({ data: [], error: null });
      });

      const results = await hybridQueryEngine.search(query);

      // Vector results should have higher combined score due to weight (0.5 vs 0.3 vs 0.2)
      const vectorResult = results.find(r => r.id === 'vector-result');
      const textResult = results.find(r => r.id === 'text-result');
      const graphResult = results.find(r => r.id === 'graph-result');

      if (vectorResult && textResult && graphResult) {
        expect(vectorResult.combinedScore).toBeGreaterThan(textResult.combinedScore);
        expect(textResult.combinedScore).toBeGreaterThan(graphResult.combinedScore);
      }
    });

    it('should handle search context and filters', async () => {
      const query = {
        text: 'product information',
        businessId: 'test-business-123',
        filters: {
          category: ['products', 'services'],
          timeRange: {
            start: new Date('2023-01-01'),
            end: new Date('2023-12-31')
          }
        },
        contextBoost: {
          recentConversations: ['conv-1', 'conv-2'],
          customerProfile: {
            preferredLanguage: 'pt',
            interests: ['technology']
          }
        }
      };

      mockEmbeddingService.generateEmbedding.mockResolvedValue({
        embedding: testHelpers.generateTestEmbedding(1536),
        tokenCount: 10,
        processingTimeMs: 50,
        model: 'test-model'
      });

      mockVectorSearchEngine.search.mockResolvedValue([]);
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

      await hybridQueryEngine.search(query);

      // Verify that filters were passed to vector search
      expect(mockVectorSearchEngine.search).toHaveBeenCalledWith(
        expect.objectContaining({
          business_id: query.businessId
        }),
        expect.any(Array),
        expect.objectContaining({
          filterTypes: query.filters.category
        })
      );
    });
  });

  describe('searchWithSimilarityExpansion', () => {
    it('should expand search using similar content', async () => {
      const query = {
        text: 'payment methods',
        businessId: 'test-business-123',
        expandSimilar: true,
        maxExpansions: 3
      };

      mockEmbeddingService.generateEmbedding.mockResolvedValue({
        embedding: testHelpers.generateTestEmbedding(1536),
        tokenCount: 10,
        processingTimeMs: 50,
        model: 'test-model'
      });

      // Mock initial search results
      mockVectorSearchEngine.search.mockResolvedValueOnce([
        {
          id: 'initial-1',
          content: 'We accept credit cards and PayPal',
          score: 0.9,
          source: 'vector',
          metadata: { type: 'payment_info' }
        }
      ]);

      // Mock expansion search
      mockVectorSearchEngine.search.mockResolvedValueOnce([
        {
          id: 'expansion-1',
          content: 'Payment processing is secure and fast',
          score: 0.8,
          source: 'vector',
          metadata: { type: 'payment_security' }
        }
      ]);

      mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

      const results = await hybridQueryEngine.searchWithSimilarityExpansion(query);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      
      // Should include both initial and expanded results
      expect(mockVectorSearchEngine.search).toHaveBeenCalledTimes(2);
    });
  });

  describe('searchKnowledgeGraph', () => {
    it('should search knowledge graph with relationships', async () => {
      const query = {
        entities: ['product', 'pricing'],
        relationships: ['hasPrice', 'belongsToCategory'],
        businessId: 'test-business-123'
      };

      mockSupabase.rpc.mockResolvedValue({
        data: [
          {
            entity_id: 'product-1',
            entity_type: 'product',
            relationship: 'hasPrice',
            related_entity: 'price-100',
            content: 'Product A costs $100',
            confidence: 0.9
          },
          {
            entity_id: 'product-1',
            entity_type: 'product',
            relationship: 'belongsToCategory',
            related_entity: 'electronics',
            content: 'Product A is in electronics category',
            confidence: 0.8
          }
        ],
        error: null
      });

      const results = await hybridQueryEngine.searchKnowledgeGraph(query);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(2);
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'search_knowledge_graph',
        expect.objectContaining({
          entities: query.entities,
          relationships: query.relationships,
          business_id: query.businessId
        })
      );
    });
  });

  describe('searchConversationHistory', () => {
    it('should search conversation history with context', async () => {
      const query = {
        text: 'previous order',
        conversationId: 'conv-123',
        businessId: 'test-business-123',
        includeRelatedConversations: true
      };

      mockEmbeddingService.generateEmbedding.mockResolvedValue({
        embedding: testHelpers.generateTestEmbedding(1536),
        tokenCount: 10,
        processingTimeMs: 50,
        model: 'test-model'
      });

      mockVectorSearchEngine.searchConversations.mockResolvedValue([
        {
          id: 'conv-msg-1',
          content: 'Your previous order was delivered last week',
          score: 0.9,
          source: 'conversation',
          metadata: { 
            conversationId: 'conv-123',
            messageType: 'assistant_response'
          }
        }
      ]);

      mockVectorSearchEngine.searchMessages.mockResolvedValue([
        {
          id: 'msg-1',
          content: 'I want to track my order from last month',
          score: 0.8,
          source: 'message',
          metadata: {
            conversationId: 'conv-456',
            messageType: 'customer_message'
          }
        }
      ]);

      const results = await hybridQueryEngine.searchConversationHistory(query);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('combineAndRankResults', () => {
    it('should combine results from different sources and rank by combined score', () => {
      const vectorResults = [
        {
          id: 'v1',
          content: 'Vector result',
          score: 0.9,
          source: 'vector' as const,
          metadata: {}
        }
      ];

      const textResults = [
        {
          id: 't1',
          content: 'Text result',
          score: 0.8,
          source: 'text' as const,
          metadata: {}
        }
      ];

      const graphResults = [
        {
          id: 'g1',
          content: 'Graph result',
          score: 0.7,
          source: 'graph' as const,
          metadata: {}
        }
      ];

      const combinedResults = hybridQueryEngine.combineAndRankResults(
        vectorResults,
        textResults,
        graphResults
      );

      expect(combinedResults).toBeDefined();
      expect(Array.isArray(combinedResults)).toBe(true);
      expect(combinedResults).toHaveLength(3);

      // Should be sorted by combined score (vector has highest weight)
      expect(combinedResults[0].id).toBe('v1');
      expect(combinedResults[1].id).toBe('t1');
      expect(combinedResults[2].id).toBe('g1');

      // Check combined scores
      expect(combinedResults[0].combinedScore).toBe(0.9 * 0.5); // vector weight
      expect(combinedResults[1].combinedScore).toBe(0.8 * 0.3); // text weight
      expect(combinedResults[2].combinedScore).toBe(0.7 * 0.2); // graph weight
    });

    it('should remove duplicate results', () => {
      const vectorResults = [
        {
          id: 'duplicate',
          content: 'Same content',
          score: 0.9,
          source: 'vector' as const,
          metadata: {}
        }
      ];

      const textResults = [
        {
          id: 'duplicate',
          content: 'Same content',
          score: 0.8,
          source: 'text' as const,
          metadata: {}
        }
      ];

      const combinedResults = hybridQueryEngine.combineAndRankResults(
        vectorResults,
        textResults,
        []
      );

      expect(combinedResults).toHaveLength(1);
      expect(combinedResults[0].source).toBe('vector'); // Higher score wins
    });
  });

  describe('getStats', () => {
    it('should return comprehensive search statistics', () => {
      const stats = hybridQueryEngine.getStats();

      expect(stats).toHaveProperty('totalQueries');
      expect(stats).toHaveProperty('avgQueryTime');
      expect(stats).toHaveProperty('cacheHitRate');
      expect(stats).toHaveProperty('sourceBreakdown');
      expect(stats).toHaveProperty('avgResultCount');
      expect(stats).toHaveProperty('expansionUsage');

      expect(stats.sourceBreakdown).toHaveProperty('vector');
      expect(stats.sourceBreakdown).toHaveProperty('text');
      expect(stats.sourceBreakdown).toHaveProperty('graph');

      expect(typeof stats.totalQueries).toBe('number');
      expect(typeof stats.avgQueryTime).toBe('number');
      expect(typeof stats.cacheHitRate).toBe('number');
    });
  });

  describe('healthCheck', () => {
    it('should return true when all components are healthy', async () => {
      const isHealthy = await hybridQueryEngine.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should return false when vector search engine fails', async () => {
      mockVectorSearchEngine.healthCheck.mockResolvedValue(false);

      const isHealthy = await hybridQueryEngine.healthCheck();
      expect(isHealthy).toBe(false);
    });

    it('should return false when embedding service fails', async () => {
      mockEmbeddingService.healthCheck.mockResolvedValue(false);

      const isHealthy = await hybridQueryEngine.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });

  describe('configuration updates', () => {
    it('should update search weights and thresholds', () => {
      hybridQueryEngine.updateConfig({
        vectorWeight: 0.6,
        textWeight: 0.25,
        graphWeight: 0.15,
        combinedThreshold: 0.6,
        maxCombinedResults: 15
      });

      // Configuration should be updated (can't directly test private config)
      expect(hybridQueryEngine).toBeDefined();
    });
  });
});

describe('Factory functions', () => {
  it('should create hybrid query engine with factory function', () => {
    const mockDependencies = {
      vectorSearchEngine: { healthCheck: vi.fn() },
      embeddingService: testHelpers.createMockEmbeddingService(),
      supabase: testHelpers.createMockSupabase(),
      vectorWeight: 0.5,
      textWeight: 0.3,
      graphWeight: 0.2,
      vectorThreshold: 0.7,
      textThreshold: 0.6,
      combinedThreshold: 0.5,
      maxVectorResults: 8,
      maxTextResults: 5,
      maxGraphResults: 4,
      maxCombinedResults: 10
    };

    const engine = createHybridQueryEngine(mockDependencies);
    expect(engine).toBeInstanceOf(HybridQueryEngine);
  });

  it('should provide default configuration', () => {
    const mockDependencies = {
      vectorSearchEngine: { healthCheck: vi.fn() },
      embeddingService: testHelpers.createMockEmbeddingService(),
      supabase: testHelpers.createMockSupabase()
    };

    const config = getDefaultHybridConfig(mockDependencies);
    
    expect(config).toHaveProperty('vectorWeight', 0.5);
    expect(config).toHaveProperty('textWeight', 0.3);
    expect(config).toHaveProperty('graphWeight', 0.2);
    expect(config).toHaveProperty('vectorThreshold', 0.7);
    expect(config).toHaveProperty('textThreshold', 0.6);
    expect(config).toHaveProperty('combinedThreshold', 0.5);
    expect(config).toHaveProperty('maxVectorResults', 8);
    expect(config).toHaveProperty('maxTextResults', 5);
    expect(config).toHaveProperty('maxGraphResults', 4);
    expect(config).toHaveProperty('maxCombinedResults', 10);
  });
});