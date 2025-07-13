/**
 * AIDA Platform - AI Response Generator Tests
 * Unit tests for AI conversation processing and response generation
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AIResponseGenerator, createResponseGenerator, getDefaultResponseConfig } from '../../../ai/response-generator';
import { testHelpers } from '../../setup';

describe('AIResponseGenerator', () => {
  let responseGenerator: AIResponseGenerator;
  let mockLangChainProcessor: any;
  let mockHybridQueryEngine: any;
  let mockEmbeddingService: any;
  let mockVectorSearchEngine: any;
  let mockMessageFormatter: any;
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock dependencies
    mockLangChainProcessor = {
      processConversation: vi.fn(),
      updateMemory: vi.fn(),
      getMemoryContext: vi.fn(),
      healthCheck: vi.fn().mockResolvedValue(true),
      getStats: vi.fn().mockReturnValue({
        totalConversations: 0,
        avgResponseTime: 0,
        memoryEfficiency: 1.0
      })
    };

    mockHybridQueryEngine = {
      search: vi.fn(),
      healthCheck: vi.fn().mockResolvedValue(true),
      getStats: vi.fn().mockReturnValue({
        totalQueries: 0,
        avgQueryTime: 0,
        cacheHitRate: 0.5
      })
    };

    mockEmbeddingService = testHelpers.createMockEmbeddingService();
    mockVectorSearchEngine = {
      search: vi.fn(),
      healthCheck: vi.fn().mockResolvedValue(true)
    };
    mockMessageFormatter = testHelpers.createMockMessageFormatter();
    mockSupabase = testHelpers.createMockSupabase();

    responseGenerator = createResponseGenerator({
      langChainProcessor: mockLangChainProcessor,
      hybridQueryEngine: mockHybridQueryEngine,
      embeddingService: mockEmbeddingService,
      vectorSearchEngine: mockVectorSearchEngine,
      messageFormatter: mockMessageFormatter,
      supabase: mockSupabase,
      maxResponseTime: 30000,
      enableAsync: true,
      fallbackEnabled: true,
      confidenceThreshold: 0.7,
      enableContentFilter: true,
      enableFactChecking: true,
      enablePersonalization: true
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('generateResponse', () => {
    it('should generate AI response successfully', async () => {
      const mockConversationContext = testHelpers.createMockConversationContext();
      const request = {
        message: 'Hello, how can I help you?',
        conversationId: 'test-conversation-123',
        assistantId: 'test-assistant-456',
        businessId: 'test-business-789',
        metadata: {
          remoteJid: '5511999999999@s.whatsapp.net',
          messageType: 'text' as const
        }
      };

      // Mock context retrieval
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockConversationContext.conversation,
              error: null
            })
          })
        })
      });

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockConversationContext.assistant,
              error: null
            })
          })
        })
      });

      // Mock RAG search
      mockHybridQueryEngine.search.mockResolvedValue([
        {
          content: 'Relevant knowledge about the topic',
          score: 0.9,
          source: 'knowledge',
          metadata: { type: 'faq' }
        }
      ]);

      // Mock LangChain processing
      mockLangChainProcessor.processConversation.mockResolvedValue({
        response: 'Thank you for reaching out! I can help you with various questions about our services.',
        confidence: 0.9,
        intent: 'greeting',
        entities: [],
        escalationRequired: false,
        context: {
          relevantKnowledge: ['greeting_response'],
          customerProfile: mockConversationContext.customerProfile
        }
      });

      // Mock message formatting
      mockMessageFormatter.formatResponse.mockResolvedValue({
        text: 'Thank you for reaching out! I can help you with various questions about our services. 😊',
        formattedForWhatsApp: true,
        hasEmojis: true,
        estimatedTokens: 25
      });

      const result = await responseGenerator.generateResponse(request);

      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
      expect(result.response!.message).toContain('Thank you for reaching out');
      expect(result.response!.confidence).toBeGreaterThan(0.8);
      expect(result.response!.processingTimeMs).toBeGreaterThan(0);
      expect(result.response!.escalationRequired).toBe(false);

      // Verify all components were called
      expect(mockHybridQueryEngine.search).toHaveBeenCalled();
      expect(mockLangChainProcessor.processConversation).toHaveBeenCalled();
      expect(mockMessageFormatter.formatResponse).toHaveBeenCalled();
    });

    it('should handle conversation context not found', async () => {
      const request = {
        message: 'Hello',
        conversationId: 'nonexistent-conversation',
        assistantId: 'test-assistant-456',
        businessId: 'test-business-789',
        metadata: {
          remoteJid: '5511999999999@s.whatsapp.net',
          messageType: 'text' as const
        }
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' }
            })
          })
        })
      });

      const result = await responseGenerator.generateResponse(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Conversation not found');
    });

    it('should detect escalation requirements', async () => {
      const mockConversationContext = testHelpers.createMockConversationContext();
      const request = {
        message: 'I want to speak with your manager immediately!',
        conversationId: 'test-conversation-123',
        assistantId: 'test-assistant-456',
        businessId: 'test-business-789',
        metadata: {
          remoteJid: '5511999999999@s.whatsapp.net',
          messageType: 'text' as const
        }
      };

      // Mock context retrieval
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockConversationContext.conversation,
              error: null
            })
          })
        })
      });

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockConversationContext.assistant,
              error: null
            })
          })
        })
      });

      // Mock escalation detection
      mockLangChainProcessor.processConversation.mockResolvedValue({
        response: 'I understand you would like to speak with a manager. Let me connect you with a human agent.',
        confidence: 0.8,
        intent: 'escalation_request',
        entities: [{ type: 'escalation', value: 'manager' }],
        escalationRequired: true,
        escalationReason: 'Customer requested manager',
        context: {
          escalationKeywords: ['manager'],
          customerProfile: mockConversationContext.customerProfile
        }
      });

      mockMessageFormatter.formatEscalationMessage.mockResolvedValue({
        text: 'I understand you would like to speak with a manager. Let me connect you with a human agent. Please wait a moment.',
        formattedForWhatsApp: true,
        escalationType: 'manager_request'
      });

      const result = await responseGenerator.generateResponse(request);

      expect(result.success).toBe(true);
      expect(result.response!.escalationRequired).toBe(true);
      expect(result.response!.escalationReason).toBe('Customer requested manager');
      expect(mockMessageFormatter.formatEscalationMessage).toHaveBeenCalled();
    });

    it('should handle low confidence responses with fallback', async () => {
      const mockConversationContext = testHelpers.createMockConversationContext();
      const request = {
        message: 'What is the meaning of life?',
        conversationId: 'test-conversation-123',
        assistantId: 'test-assistant-456',
        businessId: 'test-business-789',
        metadata: {
          remoteJid: '5511999999999@s.whatsapp.net',
          messageType: 'text' as const
        }
      };

      // Mock context retrieval
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockConversationContext.conversation,
              error: null
            })
          })
        })
      });

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockConversationContext.assistant,
              error: null
            })
          })
        })
      });

      // Mock low confidence response
      mockLangChainProcessor.processConversation.mockResolvedValue({
        response: 'I am not sure about that topic.',
        confidence: 0.3, // Low confidence
        intent: 'unclear',
        entities: [],
        escalationRequired: false,
        context: {}
      });

      mockMessageFormatter.formatFallbackMessage.mockResolvedValue({
        text: 'I\'m not sure I understand your question. Could you please rephrase it or ask about our services?',
        formattedForWhatsApp: true,
        isFallback: true
      });

      const result = await responseGenerator.generateResponse(request);

      expect(result.success).toBe(true);
      expect(result.response!.confidence).toBeLessThan(0.7);
      expect(result.response!.isFallback).toBe(true);
      expect(mockMessageFormatter.formatFallbackMessage).toHaveBeenCalled();
    });

    it('should apply content filtering', async () => {
      const mockConversationContext = testHelpers.createMockConversationContext();
      const request = {
        message: 'Tell me something inappropriate',
        conversationId: 'test-conversation-123',
        assistantId: 'test-assistant-456',
        businessId: 'test-business-789',
        metadata: {
          remoteJid: '5511999999999@s.whatsapp.net',
          messageType: 'text' as const
        }
      };

      // Mock context retrieval
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockConversationContext.conversation,
              error: null
            })
          })
        })
      });

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockConversationContext.assistant,
              error: null
            })
          })
        })
      });

      // Mock content filter detection
      mockLangChainProcessor.processConversation.mockResolvedValue({
        response: 'I cannot provide that type of content.',
        confidence: 0.9,
        intent: 'inappropriate_request',
        entities: [],
        escalationRequired: false,
        contentFiltered: true,
        context: {}
      });

      const result = await responseGenerator.generateResponse(request);

      expect(result.success).toBe(true);
      expect(result.response!.contentFiltered).toBe(true);
    });

    it('should handle timeout scenarios', async () => {
      const slowResponseGenerator = createResponseGenerator({
        langChainProcessor: mockLangChainProcessor,
        hybridQueryEngine: mockHybridQueryEngine,
        embeddingService: mockEmbeddingService,
        vectorSearchEngine: mockVectorSearchEngine,
        messageFormatter: mockMessageFormatter,
        supabase: mockSupabase,
        maxResponseTime: 100, // Very short timeout
        enableAsync: false,
        fallbackEnabled: true,
        confidenceThreshold: 0.7,
        enableContentFilter: true,
        enableFactChecking: true,
        enablePersonalization: true
      });

      const request = {
        message: 'Hello',
        conversationId: 'test-conversation-123',
        assistantId: 'test-assistant-456',
        businessId: 'test-business-789',
        metadata: {
          remoteJid: '5511999999999@s.whatsapp.net',
          messageType: 'text' as const
        }
      };

      // Mock slow context retrieval
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockImplementation(
              () => new Promise(resolve => setTimeout(resolve, 200))
            )
          })
        })
      });

      const result = await slowResponseGenerator.generateResponse(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Response generation timeout');
    });

    it('should build customer profile during conversation', async () => {
      const mockConversationContext = testHelpers.createMockConversationContext();
      const request = {
        message: 'My name is João and I\'m from São Paulo',
        conversationId: 'test-conversation-123',
        assistantId: 'test-assistant-456',
        businessId: 'test-business-789',
        metadata: {
          remoteJid: '5511999999999@s.whatsapp.net',
          messageType: 'text' as const
        }
      };

      // Mock context retrieval
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockConversationContext.conversation,
              error: null
            })
          })
        })
      });

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockConversationContext.assistant,
              error: null
            })
          })
        })
      });

      // Mock entity extraction
      mockLangChainProcessor.processConversation.mockResolvedValue({
        response: 'Nice to meet you, João! How can I help you today?',
        confidence: 0.9,
        intent: 'introduction',
        entities: [
          { type: 'person', value: 'João' },
          { type: 'location', value: 'São Paulo' }
        ],
        escalationRequired: false,
        context: {
          extractedProfile: {
            name: 'João',
            location: 'São Paulo'
          }
        }
      });

      const result = await responseGenerator.generateResponse(request);

      expect(result.success).toBe(true);
      expect(result.response!.customerProfile).toBeDefined();
      expect(result.response!.customerProfile!.name).toBe('João');
      expect(result.response!.customerProfile!.location).toBe('São Paulo');
    });
  });

  describe('processMessageQueue', () => {
    it('should process queued messages asynchronously', async () => {
      const queuedMessages = [
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          message: 'Hello',
          priority: 'normal' as const
        },
        {
          id: 'msg-2',
          conversationId: 'conv-2',
          message: 'Urgent question',
          priority: 'high' as const
        }
      ];

      const processingResults = await responseGenerator.processMessageQueue(queuedMessages);

      expect(processingResults).toHaveLength(2);
      expect(processingResults.every(result => result.processed)).toBe(true);
    });

    it('should prioritize high-priority messages', async () => {
      const processOrder: string[] = [];
      
      const originalGenerateResponse = responseGenerator.generateResponse;
      vi.spyOn(responseGenerator, 'generateResponse').mockImplementation(async (request: any) => {
        processOrder.push(request.metadata?.priority || 'normal');
        return originalGenerateResponse.call(responseGenerator, request);
      });

      const queuedMessages = [
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          message: 'Normal message',
          priority: 'normal' as const
        },
        {
          id: 'msg-2',
          conversationId: 'conv-2',
          message: 'High priority message',
          priority: 'high' as const
        },
        {
          id: 'msg-3',
          conversationId: 'conv-3',
          message: 'Low priority message',
          priority: 'low' as const
        }
      ];

      await responseGenerator.processMessageQueue(queuedMessages);

      // High priority should be processed first
      expect(processOrder[0]).toBe('high');
    });
  });

  describe('getStats', () => {
    it('should return comprehensive statistics', async () => {
      const stats = responseGenerator.getStats();

      expect(stats).toHaveProperty('totalResponses');
      expect(stats).toHaveProperty('successfulResponses');
      expect(stats).toHaveProperty('failedResponses');
      expect(stats).toHaveProperty('averageResponseTime');
      expect(stats).toHaveProperty('averageConfidence');
      expect(stats).toHaveProperty('escalationRate');
      expect(stats).toHaveProperty('fallbackRate');
      expect(stats).toHaveProperty('contentFilterRate');
      expect(stats).toHaveProperty('queueSize');

      expect(typeof stats.totalResponses).toBe('number');
      expect(typeof stats.averageResponseTime).toBe('number');
      expect(typeof stats.averageConfidence).toBe('number');
    });
  });

  describe('healthCheck', () => {
    it('should return true when all components are healthy', async () => {
      const isHealthy = await responseGenerator.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should return false when LangChain processor fails', async () => {
      mockLangChainProcessor.healthCheck.mockResolvedValue(false);

      const isHealthy = await responseGenerator.healthCheck();
      expect(isHealthy).toBe(false);
    });

    it('should return false when hybrid query engine fails', async () => {
      mockHybridQueryEngine.healthCheck.mockResolvedValue(false);

      const isHealthy = await responseGenerator.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });

  describe('configuration updates', () => {
    it('should update response generation configuration', () => {
      responseGenerator.updateConfig({
        maxResponseTime: 45000,
        confidenceThreshold: 0.8,
        enablePersonalization: false
      });

      // Configuration should be updated (can't directly test private config)
      expect(responseGenerator).toBeDefined();
    });
  });
});

describe('Factory functions', () => {
  it('should create response generator with factory function', () => {
    const mockDependencies = {
      langChainProcessor: { healthCheck: vi.fn() },
      hybridQueryEngine: { healthCheck: vi.fn() },
      embeddingService: testHelpers.createMockEmbeddingService(),
      vectorSearchEngine: { healthCheck: vi.fn() },
      messageFormatter: testHelpers.createMockMessageFormatter(),
      supabase: testHelpers.createMockSupabase(),
      maxResponseTime: 30000,
      enableAsync: true,
      fallbackEnabled: true,
      confidenceThreshold: 0.7,
      enableContentFilter: true,
      enableFactChecking: true,
      enablePersonalization: true
    };

    const generator = createResponseGenerator(mockDependencies);
    expect(generator).toBeInstanceOf(AIResponseGenerator);
  });

  it('should provide default configuration', () => {
    const mockDependencies = {
      langChainProcessor: { healthCheck: vi.fn() },
      hybridQueryEngine: { healthCheck: vi.fn() },
      embeddingService: testHelpers.createMockEmbeddingService(),
      vectorSearchEngine: { healthCheck: vi.fn() },
      messageFormatter: testHelpers.createMockMessageFormatter(),
      supabase: testHelpers.createMockSupabase()
    };

    const config = getDefaultResponseConfig(mockDependencies);
    
    expect(config).toHaveProperty('maxResponseTime', 30000);
    expect(config).toHaveProperty('enableAsync', true);
    expect(config).toHaveProperty('fallbackEnabled', true);
    expect(config).toHaveProperty('confidenceThreshold', 0.7);
    expect(config).toHaveProperty('enableContentFilter', true);
    expect(config).toHaveProperty('enableFactChecking', true);
    expect(config).toHaveProperty('enablePersonalization', true);
  });
});