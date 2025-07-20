/**
 * AIDA Platform - Main Server Entry Point
 * Unified server that combines MVP functionality with auth services
 */
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import dotenv from 'dotenv';

// Import route modules
import { createMVPRoutes } from './routes/mvp.routes';
import { createAuthRoutes } from './routes/auth.routes';
import { createInstanceRoutes, createWebhookRoutes } from './routes/instances.routes';

// Load environment variables
dotenv.config();

/**
 * Environment variables validation
 */
function validateEnvironment() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'EVOLUTION_API_URL',
    'EVOLUTION_API_KEY',
    'JWT_SECRET',
    'OPENAI_API_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Create and configure the unified server
 */
async function createServer() {
  try {
    // Validate environment
    validateEnvironment();

    // Create Hono app
    const app = new Hono();

    // Global middleware
    app.use('*', logger());
    app.use('*', cors({
      origin: [
        'http://localhost:3000',
        process.env.FRONTEND_URL || 'http://localhost:3000'
      ],
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }));

    // Health check endpoint
    app.get('/health', (c) => {
      return c.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        service: 'aida-platform-unified',
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // Mount MVP routes
    app.route('/api/mvp', await createMVPRoutes());

    // Mount auth routes (for backward compatibility)
    app.route('/api/auth', createAuthRoutes());

    // Mount instance routes
    app.route('/api/instances', createInstanceRoutes());

    // Mount webhook routes
    app.route('/api/webhook', createWebhookRoutes());

    // Root endpoint with API documentation
    app.get('/', (c) => {
      return c.json({
        name: 'AIDA Platform - Unified API',
        version: '1.0.0',
        description: 'Multi-tenant WhatsApp AI Assistant Platform',
        status: 'operational',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: 'GET /health',
          mvp: 'All MVP endpoints under /api/mvp/*',
          auth: 'Authentication endpoints under /api/auth/*',
          instances: 'Instance management under /api/instances/*',
          webhooks: 'Webhook handlers under /api/webhook/*'
        }
      });
    });

    // 404 handler
    app.notFound((c) => {
      return c.json({
        error: 'Not Found',
        message: 'The requested endpoint does not exist',
        timestamp: new Date().toISOString()
      }, 404);
    });

    // Error handler
    app.onError((err, c) => {
      console.error('Server Error:', err);
      return c.json({
        error: 'Internal Server Error',
        message: err.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      }, 500);
    });

    return app;

  } catch (error) {
    console.error('Failed to create server:', error);
    process.exit(1);
  }
}

/**
 * Start the server
 */
async function startServer() {
  const app = await createServer();
  const port = parseInt(process.env.PORT || '8787');
  
  console.log(`🚀 AIDA Platform starting on port ${port}`);
  console.log(`📝 Health check: http://localhost:${port}/health`);
  console.log(`📚 API docs: http://localhost:${port}/`);
  
  serve({
    fetch: app.fetch,
    port
  });
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch(console.error);
}

export default createServer;