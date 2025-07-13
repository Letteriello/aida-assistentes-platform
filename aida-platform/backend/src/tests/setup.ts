/**
 * AIDA Platform - Test Setup
 * Global test configuration and mocks for Vitest
 */

import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock global fetch if not available
if (!global.fetch) {
  global.fetch = vi.fn();
}

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeAll(() => {
  // Mock console methods but allow test output
  console.error = vi.fn();
  console.warn = vi.fn();
  console.log = vi.fn();
});

afterAll(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});

// Mock Server Worker setup for API mocking
const server = setupServer(
  // Evolution API mocks
  rest.post('http://localhost:8080/message/sendText/:instanceName', (req: any, res: any, ctx: any) => {
    return res(
      ctx.json({
        key: {
          remoteJid: '5511999999999@s.whatsapp.net',
          fromMe: true,
          id: 'mock-message-id'
        },
        message: { conversation: 'Mock response' },
        messageTimestamp: Date.now(),
        status: 'sent'
      })
    );
  }),

  rest.post('http://localhost:8080/instance/create', (req: any, res: any, ctx: any) => {
    return res(
      ctx.json({
        instanceName: 'mock-instance',
        status: 'created',
        qrcode: 'data:image/png;base64,mock-qr-code'
      })
    );
  }),

  rest.get('http://localhost:8080/instance/connect/:instanceName', (req, res, ctx) => {
    return res(
      ctx.json({
        instance: {
          state: 'open',
          qrcode: { code: 'mock-qr' },
          profileName: 'Mock Profile'
        }
      })
    );
  }),

  // OpenAI API mocks
  rest.post('https://api.openai.com/v1/embeddings', (req, res, ctx) => {
    return res(
      ctx.json({
        data: [
          {
            embedding: new Array(1536).fill(0).map(() => Math.random() - 0.5)
          }
        ],
        usage: {
          prompt_tokens: 10,
          total_tokens: 10
        }
      })
    );
  }),

  rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
    return res(
      ctx.json({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'This is a mock AI response for testing.'
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 20,
          completion_tokens: 10,
          total_tokens: 30
        }
      })
    );
  }),

  // Anthropic API mocks
  rest.post('https://api.anthropic.com/v1/messages', (req, res, ctx) => {
    return res(
      ctx.json({
        content: [
          {
            type: 'text',
            text: 'This is a mock Anthropic response for testing.'
          }
        ],
        usage: {
          input_tokens: 20,
          output_tokens: 10
        }
      })
    );
  }),

  // Supabase API mocks
  rest.post('https://test.supabase.co/rest/v1/rpc/:function', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: 'mock-result-1',
          content: 'Mock search result 1',
          similarity: 0.9
        },
        {
          id: 'mock-result-2',
          content: 'Mock search result 2',
          similarity: 0.8
        }
      ])
    );
  }),

  rest.get('https://test.supabase.co/rest/v1/:table', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: 'mock-id-1',
          content: 'Mock content 1',
          created_at: new Date().toISOString()
        }
      ])
    );
  }),

  rest.post('https://test.supabase.co/rest/v1/:table', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: 'mock-new-id',
        ...req.body,
        created_at: new Date().toISOString()
      })
    );
  }),

  // Fallback for unhandled requests
  rest.all('*', (req, res, ctx) => {
    console.warn(`Unhandled request: ${req.method} ${req.url}`);
    return res(
      ctx.status(200),
      ctx.json({ message: 'Mock response for unhandled request' })
    );
  })
);

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  server.close();
});

// Global test utilities
export const testHelpers = {
  // Create a mock Supabase client
  createMockSupabase: () => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: 'test' }, error: null }),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null })
  }),

  // Create a mock Evolution API client
  createMockEvolutionClient: () => ({
    sendTextMessage: vi.fn().mockResolvedValue({
      key: { remoteJid: 'test@s.whatsapp.net', id: 'test-id' },
      status: 'sent'
    }),
    createInstance: vi.fn().mockResolvedValue({
      instanceName: 'test-instance',
      status: 'created'
    }),
    getInstanceStatus: vi.fn().mockResolvedValue({
      instanceName: 'test-instance',
      status: 'open'
    }),
    setWebhook: vi.fn().mockResolvedValue({ success: true }),
    healthCheck: vi.fn().mockResolvedValue(true)
  }),

  // Create a mock embedding service
  createMockEmbeddingService: () => ({
    generateEmbedding: vi.fn().mockResolvedValue({
      embedding: new Array(384).fill(0.1),
      tokenCount: 10,
      processingTimeMs: 100,
      model: 'test-model'
    }),
    generateBatchEmbeddings: vi.fn().mockResolvedValue([]),
    queueEmbeddingRequest: vi.fn().mockResolvedValue(undefined),
    getStats: vi.fn().mockReturnValue({
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageProcessingTime: 0,
      rateLimitHits: 0,
      cacheSize: 0,
      queueSize: 0
    }),
    healthCheck: vi.fn().mockResolvedValue(true)
  }),

  // Create mock conversation context
  createMockConversationContext: () => ({
    assistant: {
      id: 'test-assistant-id',
      business_id: 'test-business-id',
      name: 'Test Assistant',
      personality_prompt: 'You are a helpful test assistant',
      system_prompt: 'Be helpful and accurate',
      settings: {
        max_response_length: 500,
        confidence_threshold: 0.7,
        escalation_keywords: ['manager', 'supervisor']
      },
      metrics: {
        total_conversations: 0,
        total_messages: 0,
        avg_response_time_ms: 0,
        satisfaction_rating: 0
      }
    },
    conversation: {
      id: 'test-conversation-id',
      assistant_id: 'test-assistant-id',
      remote_jid: '5511999999999@s.whatsapp.net',
      status: 'active',
      priority: 'medium',
      context_summary: 'Test conversation',
      created_at: new Date().toISOString(),
      last_message_at: new Date()
    },
    businessId: 'test-business-id',
    customerProfile: {
      name: 'Test Customer',
      previousInteractions: 5,
      sentiment: 'neutral' as const,
      preferredLanguage: 'pt'
    }
  }),

  // Wait for async operations
  waitFor: async (fn: () => boolean | Promise<boolean>, timeout = 1000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await fn()) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    throw new Error(`waitFor timeout after ${timeout}ms`);
  },

  // Create a mock message formatter
  createMockMessageFormatter: () => ({
    formatResponse: vi.fn().mockResolvedValue({
      text: 'Formatted response text',
      formattedForWhatsApp: true,
      hasEmojis: false,
      estimatedTokens: 20
    }),
    formatEscalationMessage: vi.fn().mockResolvedValue({
      text: 'Escalation message',
      formattedForWhatsApp: true,
      escalationType: 'general'
    }),
    formatFallbackMessage: vi.fn().mockResolvedValue({
      text: 'Fallback response',
      formattedForWhatsApp: true,
      isFallback: true
    }),
    formatBusinessStyle: vi.fn().mockImplementation((text, style) => ({
      text: `${style}: ${text}`,
      formattedForWhatsApp: true
    })),
    getStats: vi.fn().mockReturnValue({
      totalFormatted: 0,
      avgProcessingTime: 0,
      emojiUsage: 0
    })
  }),

  // Generate test data
  generateTestEmbedding: (dimension = 384) => {
    return new Array(dimension).fill(0).map(() => Math.random() - 0.5);
  },

  generateTestMessage: (overrides: any = {}) => ({
    id: 'test-message-id',
    conversation_id: 'test-conversation-id',
    content: 'Test message content',
    sender_type: 'customer' as const,
    message_type: 'text' as const,
    timestamp: new Date(),
    is_processed: false,
    ...overrides
  })
};

// Export for use in tests
export { server };