/**
 * AIDA Platform - Main Entry Point
 * Cloudflare Workers entry point for the complete AIDA platform
 * CRITICAL: Orchestrates all platform components and APIs
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';

// Core platform components
import { getSupabase, TenantAwareSupabase } from './database/supabase-client';
import { createEvolutionClient, EvolutionApiClient } from './evolution-api/client';
import { createWebhookHandler, EvolutionWebhookHandler } from './evolution-api/webhook-handler';
import { createMessageFormatter, WhatsAppMessageFormatter } from './evolution-api/message-formatter';
import { createVectorSearchEngine, VectorSearchEngine } from './rag/vector-search';
import { createEmbeddingService, EmbeddingService } from './rag/embedding-service';
import { createHybridQueryEngine, HybridQueryEngine } from './rag/hybrid-query';
import { createLangChainProcessor, LangChainProcessor } from './ai/langchain-setup';
import { AIResponseGenerator, createResponseGenerator } from './ai/response-generator';
import { createMemoryIntegrator, MemoryIntegrator } from './memory/memory-integrator';

// API routes
import { BusinessAuthHandler } from './auth/business-auth';
import { AssistantAPI } from './api/assistants';
import { ConversationAPI } from './api/conversations';

// Utilities and types
import { getSecurityHeaders, logSecurityEvent } from './database/security';
import type { EvolutionWebhook, ResponseRequest } from '@shared/types';

// Environment interface for Cloudflare Workers
export interface Env {
  // Secrets
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  EVOLUTION_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  
  // Configuration
  ENVIRONMENT: 'development' | 'staging' | 'production';
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  EVOLUTION_API_BASE_URL: string;
  WEBHOOK_BASE_URL: string;
  
  // Cloudflare bindings
  CACHE_STORE: KVNamespace;
  SESSION_STORE: KVNamespace;
  RATE_LIMIT_STORE: KVNamespace;
  CONVERSATION_MANAGER: DurableObjectNamespace;
  ASSISTANT_PROCESSOR: DurableObjectNamespace;
  AI: any; // Cloudflare AI binding
  ANALYTICS: AnalyticsEngineDataPoint;
  EMBEDDING_QUEUE: Queue;
  MESSAGE_QUEUE: Queue;
  WEBHOOK_QUEUE: Queue;
  MEDIA_STORAGE: R2Bucket;
  BACKUP_STORAGE: R2Bucket;
}

/**
 * Global platform context for dependency injection
 */
interface PlatformContext {
  evolutionClient: EvolutionApiClient;
  webhookHandler: EvolutionWebhookHandler;
  messageFormatter: WhatsAppMessageFormatter;
  vectorSearchEngine: VectorSearchEngine;
  embeddingService: EmbeddingService;
  hybridQueryEngine: HybridQueryEngine;
  langChainProcessor: LangChainProcessor;
  responseGenerator: AIResponseGenerator;
}

/**
 * Main AIDA Platform Application
 * PATTERN: Hono-based API with complete platform integration
 */
const app = new Hono<{ Bindings: Env; Variables: { platform: PlatformContext } }>();

// Global middleware
app.use('*', cors({
  origin: ['https://aida-platform.com', 'https://*.aida-platform.com'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Business-ID'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use('*', secureHeaders());
app.use('*', logger());
app.use('*', prettyJSON());

// Initialize platform components middleware
app.use('*', async (c, next) => {
  try {
    const supabaseConfig = {
      url: c.env.SUPABASE_URL,
      anonKey: c.env.SUPABASE_ANON_KEY,
      serviceRoleKey: c.env.SUPABASE_SERVICE_ROLE_KEY
    };

    // Initialize core components
    const evolutionClient = createEvolutionClient({
      baseUrl: 'https://api.evolution-api.com',
      apiKey: c.env.EVOLUTION_API_KEY
    });

    const messageFormatter = createMessageFormatter({
      businessStyle: 'friendly',
      enableEmojis: true
    });

    const embeddingService = createEmbeddingService({
      provider: 'openai',
      apiKey: c.env.OPENAI_API_KEY,
      model: 'text-embedding-3-small',
      dimension: 1536,
      maxTokens: 8191,
      batchSize: 100,
      rateLimitPerMinute: 1000
    });

    // Create business-aware Supabase client (will be tenant-specific in real implementation)
    const businessId = c.req.header('X-Business-ID') || 'default-business';
    const supabase = new TenantAwareSupabase(supabaseConfig, businessId);

    const vectorSearchEngine = createVectorSearchEngine({
      supabase,
      defaultThreshold: 0.7,
      defaultLimit: 10,
      embeddingDimension: 1536
    });

    const hybridQueryEngine = createHybridQueryEngine({
      vectorSearchEngine,
      embeddingService,
      supabase,
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

    const langChainProcessor = createLangChainProcessor({
      provider: 'openai',
      model: 'gpt-4o-mini',
      apiKey: c.env.OPENAI_API_KEY,
      temperature: 0.7,
      maxTokens: 1000,
      memoryType: 'buffer',
      memoryK: 5,
      ragEnabled: true,
      hybridQueryEngine,
      supabase
    });

    const responseGenerator = createResponseGenerator({
      langChainProcessor,
      hybridQueryEngine,
      embeddingService,
      vectorSearchEngine,
      messageFormatter,
      supabase,
      maxResponseTime: 30000,
      enableAsync: true,
      fallbackEnabled: true,
      confidenceThreshold: 0.7,
      enableContentFilter: true,
      enableFactChecking: true,
      enablePersonalization: true
    });

    const webhookHandler = createWebhookHandler({
      supabase,
      onMessageProcessed: async (result) => {
        if (result.success && result.shouldRespond) {
          // Queue AI response generation
          await c.env.MESSAGE_QUEUE.send({
            conversationId: result.conversationId,
            messageId: result.messageId,
            businessId
          });
        }
      },
      onError: (error) => {
        console.error('Webhook processing error:', error);
        logSecurityEvent('webhook_error', error, businessId);
      }
    });

    // Store in context for route handlers
    c.set('platform', {
      evolutionClient,
      webhookHandler,
      messageFormatter,
      vectorSearchEngine,
      embeddingService,
      hybridQueryEngine,
      langChainProcessor,
      responseGenerator
    });

    await next();
  } catch (error) {
    console.error('Platform initialization failed:', error);
    return c.json(
      { error: 'Platform initialization failed', details: error instanceof Error ? error.message : String(error) },
      500
    );
  }
});

// Mount API routes
app.route('/auth', BusinessAuthHandler);
app.route('/api/assistants', AssistantAPI);
app.route('/api/conversations', ConversationAPI);

// Health check endpoint
app.get('/health', async (c) => {
  const platform = c.get('platform');
  
  try {
    const healthChecks = await Promise.allSettled([
      platform.evolutionClient.healthCheck(),
      platform.embeddingService.healthCheck(),
      platform.vectorSearchEngine.healthCheck(),
      platform.hybridQueryEngine.healthCheck(),
      platform.langChainProcessor.healthCheck(),
      platform.responseGenerator.healthCheck()
    ]);

    const results = healthChecks.map((check, index) => ({
      component: ['evolution', 'embedding', 'vector', 'hybrid', 'langchain', 'response'][index],
      status: check.status === 'fulfilled' ? (check.value ? 'healthy' : 'unhealthy') : 'error',
      error: check.status === 'rejected' ? check.reason?.message : undefined
    }));

    const allHealthy = results.every(result => result.status === 'healthy');

    return c.json({
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      environment: c.env.ENVIRONMENT,
      components: results
    }, allHealthy ? 200 : 503);

  } catch (error) {
    return c.json({
      status: 'error',
      error: 'Health check failed',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Evolution API webhook endpoint
app.post('/webhook/whatsapp', async (c) => {
  const platform = c.get('platform');
  
  try {
    const payload: EvolutionWebhook = await c.req.json();
    const signature = c.req.header('x-signature');

    const result = await platform.webhookHandler.processWebhook(payload, signature);

    // Track analytics
    c.env.ANALYTICS.writeDataPoint({
      blobs: ['webhook_processed'],
      doubles: [result.processingTimeMs],
      indexes: [payload.instanceId]
    });

    return c.json({
      success: result.success,
      processingTime: result.processingTimeMs,
      shouldRespond: result.shouldRespond
    });

  } catch (error) {
    console.error('Webhook processing failed:', error);
    
    return c.json({
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// AI response generation endpoint
app.post('/api/messages/generate-response', async (c) => {
  const platform = c.get('platform');
  
  try {
    const request: ResponseRequest = await c.req.json();
    
    // Validate required fields
    if (!request.message || !request.conversationId || !request.assistantId || !request.businessId) {
      return c.json({
        error: 'Missing required fields: message, conversationId, assistantId, businessId'
      }, 400);
    }

    const result = await platform.responseGenerator.generateResponse(request);

    // Track analytics
    c.env.ANALYTICS.writeDataPoint({
      blobs: ['response_generated'],
      doubles: [result.response?.processingTimeMs || 0, result.response?.confidence || 0],
      indexes: [request.assistantId, request.businessId]
    });

    return c.json(result);

  } catch (error) {
    console.error('Response generation failed:', error);
    
    return c.json({
      error: 'Response generation failed',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Platform statistics endpoint
app.get('/api/stats', async (c) => {
  const platform = c.get('platform');
  
  try {
    const stats = {
      embedding: platform.embeddingService.getStats(),
      vectorSearch: await platform.vectorSearchEngine.getSearchStats(),
      hybridQuery: platform.hybridQueryEngine.getStats(),
      langChain: platform.langChainProcessor.getStats(),
      responseGenerator: platform.responseGenerator.getStats(),
      webhook: platform.webhookHandler.getProcessingStats()
    };

    return c.json({
      platform: 'AIDA',
      version: '1.0.0',
      environment: c.env.ENVIRONMENT,
      timestamp: new Date().toISOString(),
      statistics: stats
    });

  } catch (error) {
    return c.json({
      error: 'Failed to get statistics',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Queue consumer for message processing
export async function queue(batch: MessageBatch<any>, env: Env): Promise<void> {
  for (const message of batch.messages) {
    try {
      if (message.body.type === 'generate_response') {
        // Process AI response generation
        const { conversationId, messageId, businessId } = message.body;
        
        // Initialize platform components for queue processing
        // (In practice, you'd want to optimize this initialization)
        console.log(`Processing queued response generation for conversation ${conversationId}`);
        
        message.ack();
      } else if (message.body.type === 'generate_embedding') {
        // Process embedding generation
        const { text, metadata } = message.body;
        
        console.log(`Processing queued embedding generation for: ${text.substring(0, 50)}...`);
        
        message.ack();
      } else {
        console.warn(`Unknown message type: ${message.body.type}`);
        message.ack();
      }
    } catch (error) {
      console.error('Queue message processing failed:', error);
      message.retry();
    }
  }
}

// Cron trigger for scheduled tasks
export async function scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
  switch (event.cron) {
  case '0 */6 * * *': // Every 6 hours
    console.log('Running conversation cleanup task...');
    // Clean up old conversations
    break;
      
  case '0 0 * * *': // Daily
    console.log('Generating daily analytics...');
    // Generate daily analytics
    break;
      
  case '*/5 * * * *': // Every 5 minutes
    console.log('Running Evolution API health check...');
    // Health check Evolution API
    break;
      
  case '0 */12 * * *': // Every 12 hours
    console.log('Optimizing vector indexes...');
    // Optimize vector indexes
    break;
  }
}

// Error handler
app.onError((err, c) => {
  console.error('Application error:', err);
  
  return c.json({
    error: 'Internal server error',
    message: c.env.ENVIRONMENT === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not found',
    message: 'The requested endpoint does not exist',
    timestamp: new Date().toISOString()
  }, 404);
});

// Export the main application
export default app;