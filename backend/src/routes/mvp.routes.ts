import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { jwt } from 'hono/jwt';
import { createAidaMVPService, AidaMVPConfig } from '../services/aida-mvp.service';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

// Validation schemas
const SendAuthCodeSchema = z.object({
  phone: z.string().min(10).max(15),
});

const VerifyAuthCodeSchema = z.object({
  phone: z.string().min(10).max(15),
  code: z.string().length(6),
  name: z.string().optional(),
});

const OnboardingSchema = z.object({
  phone: z.string().min(10).max(15),
  name: z.string().optional(),
  companyName: z.string().min(1).max(100),
  businessType: z.string().min(1).max(50),
  conversationStyle: z.enum(['formal', 'casual', 'friendly']),
});

const ProcessMessageSchema = z.object({
  instanceId: z.string().uuid(),
  customerPhone: z.string().min(10).max(15),
  messageContent: z.string().min(1),
  messageType: z.enum(['text', 'image', 'audio', 'video', 'document']).optional(),
  customerName: z.string().optional(),
});

const CreateProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().min(0),
  category: z.string().optional(),
  sku: z.string().optional(),
  is_active: z.boolean().optional(),
});

const UpdateAssistantConfigSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  company_name: z.string().min(1).max(100).optional(),
  business_type: z.string().min(1).max(50).optional(),
  conversation_style: z.enum(['formal', 'casual', 'friendly']).optional(),
  is_active: z.boolean().optional(),
});

/**
 * Create MVP routes for AIDA platform
 */
export function createMVPRoutes(config: AidaMVPConfig) {
  const app = new Hono();
  const aidaService = createAidaMVPService(config);

  // Middleware
  app.use('*', cors());
  app.use('*', logger());

  // JWT middleware for protected routes
  const jwtMiddleware = jwt({
    secret: config.jwtSecret,
  });

  // Health check
  app.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Authentication routes
  app.post('/auth/send-code', zValidator('json', SendAuthCodeSchema), async (c) => {
    try {
      const { phone } = c.req.valid('json');
      const result = await aidaService.getServices().auth.sendAuthCode(phone);
      
      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }

      return c.json({ success: true, message: 'Authentication code sent' });
    } catch (error) {
      console.error('Error sending auth code:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  app.post('/auth/verify-code', zValidator('json', VerifyAuthCodeSchema), async (c) => {
    try {
      const { phone, code, name } = c.req.valid('json');
      const result = await aidaService.getServices().auth.verifyAuthCode(phone, code, name);
      
      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }

      return c.json({
        success: true,
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      console.error('Error verifying auth code:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Onboarding route
  app.post('/onboarding', zValidator('json', OnboardingSchema), async (c) => {
    try {
      const data = c.req.valid('json');
      const result = await aidaService.completeOnboarding(data);
      
      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }

      return c.json({
        success: true,
        user: result.user,
        instance: result.instance,
        assistantConfig: result.assistantConfig,
        billingCycle: result.billingCycle,
        qrCode: result.qrCode,
      });
    } catch (error) {
      console.error('Error during onboarding:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Protected routes (require JWT)
  app.use('/dashboard/*', jwtMiddleware);
  app.use('/instances/*', jwtMiddleware);
  app.use('/billing/*', jwtMiddleware);
  app.use('/assistant/*', jwtMiddleware);
  app.use('/products/*', jwtMiddleware);
  app.use('/conversations/*', jwtMiddleware);

  // Dashboard
  app.get('/dashboard', async (c) => {
    try {
      const payload = c.get('jwtPayload');
      const userId = payload.sub;
      
      const result = await aidaService.getUserDashboard(userId);
      
      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }

      return c.json(result.data);
    } catch (error) {
      console.error('Error getting dashboard:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // WhatsApp Instances
  app.get('/instances', async (c) => {
    try {
      const payload = c.get('jwtPayload');
      const userId = payload.sub;
      
      const result = await aidaService.getServices().instance.listUserInstances(userId);
      
      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }

      return c.json({ instances: result.instances });
    } catch (error) {
      console.error('Error listing instances:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  app.get('/instances/:instanceId/qr', async (c) => {
    try {
      const instanceId = c.req.param('instanceId');
      const result = await aidaService.getServices().instance.refreshQRCode(instanceId);
      
      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }

      return c.json({ qrCode: result.qrCode });
    } catch (error) {
      console.error('Error getting QR code:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  app.get('/instances/:instanceId/status', async (c) => {
    try {
      const instanceId = c.req.param('instanceId');
      const result = await aidaService.getServices().instance.getInstanceStatus(instanceId);
      
      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }

      return c.json({ status: result.status });
    } catch (error) {
      console.error('Error getting instance status:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  app.delete('/instances/:instanceId', async (c) => {
    try {
      const instanceId = c.req.param('instanceId');
      const result = await aidaService.getServices().instance.deleteInstance(instanceId);
      
      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }

      return c.json({ success: true });
    } catch (error) {
      console.error('Error deleting instance:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Billing
  app.get('/billing/cycles', async (c) => {
    try {
      const payload = c.get('jwtPayload');
      const userId = payload.sub;
      
      const result = await aidaService.getServices().billing.getUserBillingCycles(userId);
      
      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }

      return c.json({ cycles: result.cycles });
    } catch (error) {
      console.error('Error getting billing cycles:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  app.get('/billing/usage/:instanceId', async (c) => {
    try {
      const instanceId = c.req.param('instanceId');
      const result = await aidaService.getServices().billing.getUsageReport(instanceId);
      
      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }

      return c.json(result.report);
    } catch (error) {
      console.error('Error getting usage report:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Assistant Configuration
  app.get('/assistant/:instanceId', async (c) => {
    try {
      const instanceId = c.req.param('instanceId');
      const result = await aidaService.getServices().assistant.getAssistantConfig(instanceId);
      
      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }

      return c.json({ config: result.config });
    } catch (error) {
      console.error('Error getting assistant config:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  app.put('/assistant/:instanceId', zValidator('json', UpdateAssistantConfigSchema), async (c) => {
    try {
      const instanceId = c.req.param('instanceId');
      const updates = c.req.valid('json');
      
      const result = await aidaService.getServices().assistant.updateAssistantConfig(instanceId, updates);
      
      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }

      return c.json({ config: result.config });
    } catch (error) {
      console.error('Error updating assistant config:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  app.post('/assistant/:instanceId/toggle', async (c) => {
    try {
      const instanceId = c.req.param('instanceId');
      const result = await aidaService.getServices().assistant.toggleAssistantStatus(instanceId);
      
      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }

      return c.json({ config: result.config });
    } catch (error) {
      console.error('Error toggling assistant status:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Product Catalog
  app.get('/products/:instanceId', async (c) => {
    try {
      const instanceId = c.req.param('instanceId');
      const category = c.req.query('category');
      const isActive = c.req.query('active') === 'true';
      const limit = parseInt(c.req.query('limit') || '50');
      const offset = parseInt(c.req.query('offset') || '0');
      
      const result = await aidaService.getServices().catalog.listProducts(instanceId, {
        category,
        isActive,
        limit,
        offset,
      });
      
      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }

      return c.json({ products: result.products, total: result.total });
    } catch (error) {
      console.error('Error listing products:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  app.post('/products/:instanceId', zValidator('json', CreateProductSchema), async (c) => {
    try {
      const instanceId = c.req.param('instanceId');
      const productData = c.req.valid('json');
      
      const result = await aidaService.getServices().catalog.createProduct(instanceId, productData);
      
      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }

      return c.json({ product: result.product });
    } catch (error) {
      console.error('Error creating product:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  app.get('/products/:instanceId/search', async (c) => {
    try {
      const instanceId = c.req.param('instanceId');
      const query = c.req.query('q');
      const category = c.req.query('category');
      const limit = parseInt(c.req.query('limit') || '10');
      
      if (!query) {
        return c.json({ error: 'Query parameter is required' }, 400);
      }
      
      const result = await aidaService.getServices().catalog.searchProducts(instanceId, {
        query,
        category,
        limit,
      });
      
      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }

      return c.json({ results: result.results });
    } catch (error) {
      console.error('Error searching products:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Conversations
  app.get('/conversations/:instanceId', async (c) => {
    try {
      const instanceId = c.req.param('instanceId');
      const status = c.req.query('status') as 'active' | 'archived' | 'closed';
      const limit = parseInt(c.req.query('limit') || '50');
      const offset = parseInt(c.req.query('offset') || '0');
      
      const result = await aidaService.getServices().conversation.listConversations(instanceId, {
        status,
        limit,
        offset,
      });
      
      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }

      return c.json({ conversations: result.conversations, total: result.total });
    } catch (error) {
      console.error('Error listing conversations:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  app.get('/conversations/:instanceId/:conversationId/messages', async (c) => {
    try {
      const conversationId = c.req.param('conversationId');
      const limit = parseInt(c.req.query('limit') || '100');
      const offset = parseInt(c.req.query('offset') || '0');
      
      const result = await aidaService.getServices().conversation.getMessages(conversationId, {
        limit,
        offset,
      });
      
      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }

      return c.json({ messages: result.messages, total: result.total });
    } catch (error) {
      console.error('Error getting messages:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Message processing (webhook endpoint)
  app.post('/webhook/message', zValidator('json', ProcessMessageSchema), async (c) => {
    try {
      const { instanceId, customerPhone, messageContent, messageType, customerName } = c.req.valid('json');
      
      const result = await aidaService.processIncomingMessage(
        instanceId,
        customerPhone,
        messageContent,
        messageType,
        customerName
      );
      
      if (!result.success) {
        return c.json({ error: result.error }, 400);
      }

      return c.json({ success: true, response: result.response });
    } catch (error) {
      console.error('Error processing message:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  return app;
}