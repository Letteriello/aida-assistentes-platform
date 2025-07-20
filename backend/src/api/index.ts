/**
 * AIDA Platform - API Routes Index
 * Aggregates all API endpoints
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';

// Import route modules
import businessAuthRoutes from '../auth/business-auth';
import userAuthRoutes from '../auth/user-auth';
import assistantsRoutes from './assistants';
import conversationsRoutes from './conversations';
import dashboardRoutes from './dashboard';
import billingRoutes from './billing';
import onboardingRoutes from './onboarding';
import whatsappInstancesRoutes from './whatsapp-instances';
import instanceManagementRoutes from './instance-management';
import documentsRoutes from './documents';
import webhookRoutes from './webhooks';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', secureHeaders());
app.use('*', cors({
  origin: [
    'http://localhost:3000',
    'https://*.aida-platform.com'
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
    environment: process.env.ENVIRONMENT || 'development'
  });
});

// API documentation endpoint
app.get('/', (c) => {
  return c.json({
    name: 'AIDA Platform API',
    version: '1.0.0',
    description: 'Multi-tenant WhatsApp AI Assistant Platform',
    endpoints: {
      auth: {
        register: 'POST /auth/register',
        login: 'POST /auth/login',
        api_keys: {
          list: 'GET /auth/api-keys',
          generate: 'POST /auth/api-keys/generate',
          revoke: 'POST /auth/api-keys/revoke'
        }
      },
      assistants: {
        list: 'GET /api/assistants',
        create: 'POST /api/assistants',
        get: 'GET /api/assistants/:id',
        update: 'PUT /api/assistants/:id',
        delete: 'DELETE /api/assistants/:id',
        knowledge: {
          upload: 'POST /api/assistants/:id/knowledge',
          list: 'GET /api/assistants/:id/knowledge',
          delete: 'DELETE /api/assistants/:id/knowledge/:nodeId'
        }
      },
      documents: {
        upload: 'POST /api/documents/upload',
        list: 'GET /api/documents',
        get: 'GET /api/documents/:id',
        delete: 'DELETE /api/documents/:id',
        search: 'POST /api/documents/search',
        stats: 'GET /api/documents/stats'
      },
      conversations: {
        list: 'GET /api/conversations',
        get: 'GET /api/conversations/:id',
        update: 'PUT /api/conversations/:id',
        messages: {
          list: 'GET /api/conversations/:id/messages',
          send: 'POST /api/conversations/:id/messages'
        },
        export: 'GET /api/conversations/:id/export'
      },
      dashboard: {
        stats: 'GET /api/dashboard/stats',
        platform_stats: 'GET /api/dashboard/platform-stats',
        recent_activity: 'GET /api/dashboard/recent-activity',
        health: 'GET /api/dashboard/health'
      },
      billing: {
        subscription: 'GET /api/billing/subscription',
        create_subscription: 'POST /api/billing/subscription',
        usage: 'GET /api/billing/usage',
        update_usage: 'POST /api/billing/usage/update',
        recommendations: 'GET /api/billing/recommendations',
        purchase_addons: 'POST /api/billing/add-ons/purchase',
        calculation: 'GET /api/billing/calculation',
        generate_invoice: 'POST /api/billing/invoice/generate',
        dashboard: 'GET /api/billing/dashboard'
      },
      whatsapp_instances: {
        create: 'POST /api/whatsapp-instances',
        connect: 'POST /api/whatsapp-instances/:instanceName/connect',
        status: 'GET /api/whatsapp-instances/:instanceName/status',
        refresh_qr: 'POST /api/whatsapp-instances/:instanceName/qr-code/refresh',
        disconnect: 'DELETE /api/whatsapp-instances/:instanceName/disconnect',
        delete: 'DELETE /api/whatsapp-instances/:instanceName',
        by_assistant: 'GET /api/whatsapp-instances/assistant/:assistantId'
      },
      instance_management: {
        limits: 'GET /api/instance-management/limits',
        create: 'POST /api/instance-management/create',
        purchase_additional: 'POST /api/instance-management/purchase-additional',
        delete: 'DELETE /api/instance-management/:instanceName',
        pricing: 'GET /api/instance-management/pricing'
      },
      webhooks: {
        evolution: 'POST /webhooks/evolution/:businessId',
        stripe: 'POST /webhooks/stripe',
        health: 'GET /webhooks/health',
        test: 'POST /webhooks/test'
      }
    },
    authentication: {
      type: 'API Key',
      header: 'Authorization: Bearer {api_key}',
      format: 'aida_{env}_{business_id}_{random}'
    }
  });
});

// Mount route modules
app.route('/auth/business', businessAuthRoutes);
app.route('/auth/user', userAuthRoutes);
app.route('/api/assistants', assistantsRoutes);
app.route('/api/conversations', conversationsRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.route('/api/billing', billingRoutes);
app.route('/api/onboarding', onboardingRoutes);
app.route('/api/whatsapp-instances', whatsappInstancesRoutes);
app.route('/api/instance-management', instanceManagementRoutes);
app.route('/api/documents', documentsRoutes);
app.route('/webhooks', webhookRoutes);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: 'Not Found',
      message: 'The requested endpoint does not exist',
      timestamp: new Date().toISOString()
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json(
    {
      error: 'Internal Server Error',
      message: err.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    },
    500
  );
});

export default app;