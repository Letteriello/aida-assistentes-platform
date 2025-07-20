import { serve } from '@hono/node-server';
import { createMVPRoutes } from './routes/mvp.routes';
import { createSupabaseClient } from '@supabase/supabase-js';
import { Database } from './types/database';
import { EvolutionAPIClient } from './lib/evolution-api';
import { AidaMVPConfig } from './services/aida-mvp.service';
import dotenv from 'dotenv';

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
 * Create and configure the MVP server
 */
async function createServer() {
  try {
    // Validate environment
    validateEnvironment();

    // Create Supabase client
    const supabase = createSupabaseClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create Evolution API client
    const evolutionAPI = new EvolutionAPIClient({
      baseURL: process.env.EVOLUTION_API_URL!,
      apiKey: process.env.EVOLUTION_API_KEY!,
    });

    // Create MVP configuration
    const config: AidaMVPConfig = {
      supabase,
      evolutionAPI,
      jwtSecret: process.env.JWT_SECRET!,
      openaiApiKey: process.env.OPENAI_API_KEY!,
      webhookUrl: process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhook',
      adminInstanceName: process.env.ADMIN_INSTANCE_NAME || 'aida-admin',
      adminInstanceToken: process.env.ADMIN_INSTANCE_TOKEN || 'admin-token-123',
    };

    // Create routes
    const app = createMVPRoutes(config);

    // Add global error handler
    app.onError((err, c) => {
      console.error('Global error handler:', err);
      return c.json(
        { 
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' ? err.message : undefined
        }, 
        500
      );
    });

    // Add 404 handler
    app.notFound((c) => {
      return c.json({ error: 'Not found' }, 404);
    });

    return app;
  } catch (error) {
    console.error('Failed to create server:', error);
    throw error;
  }
}

/**
 * Start the server
 */
async function startServer() {
  try {
    const app = await createServer();
    const port = parseInt(process.env.PORT || '3000');
    
    console.log('🚀 Starting AIDA MVP Server...');
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Supabase URL: ${process.env.SUPABASE_URL}`);
    console.log(`🤖 Evolution API URL: ${process.env.EVOLUTION_API_URL}`);
    
    serve({
      fetch: app.fetch,
      port,
    });
    
    console.log(`✅ Server running on http://localhost:${port}`);
    console.log('📋 Available endpoints:');
    console.log('  GET  /health - Health check');
    console.log('  POST /auth/send-code - Send authentication code');
    console.log('  POST /auth/verify-code - Verify authentication code');
    console.log('  POST /onboarding - Complete user onboarding');
    console.log('  GET  /dashboard - User dashboard');
    console.log('  GET  /instances - List WhatsApp instances');
    console.log('  GET  /billing/cycles - Billing cycles');
    console.log('  GET  /assistant/:instanceId - Assistant configuration');
    console.log('  GET  /products/:instanceId - Product catalog');
    console.log('  GET  /conversations/:instanceId - Conversations');
    console.log('  POST /webhook/message - Process incoming messages');
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export { createServer, startServer };