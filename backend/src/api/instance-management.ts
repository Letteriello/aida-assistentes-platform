/**
 * AIDA Platform - Instance Management API
 * Handles WhatsApp instance creation with billing integration
 * Enforces instance limits based on subscription plans
 */
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import {
  getBusinessContext,
  tenantIsolationMiddleware
} from '../auth/tenant-isolation';
import { createBillingService } from '../billing/billing-service';
import { createWhatsAppInstanceService } from '../services/whatsapp-instance';
import type { Env } from '@shared/types';

const app = new Hono<{ Bindings: Env }>();

// Apply tenant isolation middleware
app.use('*', tenantIsolationMiddleware());

// Validation schemas
const createInstanceSchema = z.object({
  assistantId: z.string().uuid(),
  assistantName: z.string().min(1).max(100)
});

const purchaseInstanceSchema = z.object({
  quantity: z.number().min(1).max(10).default(1)
});

// Get instance limits and usage
app.get('/limits', async (c) => {
  try {
    const { businessId, supabase } = getBusinessContext(c);
    const billingService = createBillingService(supabase);

    const usage = await billingService.getUsage(businessId);
    if (!usage) {
      return c.json(
        { error: 'No usage data found' },
        404
      );
    }

    const available = usage.instanceLimit - usage.instancesUsed;
    const percentage = Math.round(
      usage.instancesUsed / usage.instanceLimit * 100
    );
    const canCreateMore = usage.instancesUsed < usage.instanceLimit;

    const responseData = {
      instances: {
        used: usage.instancesUsed,
        limit: usage.instanceLimit,
        available: available,
        percentage: percentage,
        canCreateMore: canCreateMore
      },
      billing_info: {
        base_instances: 1,
        additional_instances_purchased: usage.instanceLimit - 1,
        cost_per_additional_instance: 'R$ 99,00/mês'
      }
    };

    return c.json(responseData);
  } catch (error) {
    console.error('Error in /limits endpoint:', error);
    return c.json(
      { error: 'Failed to fetch instance limits' },
      500
    );
  }
});

// Create new WhatsApp instance
app.post('/create', zValidator('json', createInstanceSchema), async (c) => {
  try {
    const { businessId, supabase } = getBusinessContext(c);
    const { assistantId, assistantName } = c.req.valid('json');

    const billingService = createBillingService(supabase);
    const usage = await billingService.getUsage(businessId);

    if (!usage) {
      return c.json(
        { error: 'No billing data found. Please contact support.' },
        404
      );
    }

    if (usage.instancesUsed >= usage.instanceLimit) {
      return c.json(
        {
          error: 'Instance limit reached',
          message: `You have reached your instance limit of ${usage.instanceLimit}. Please upgrade your plan to create more instances.`
        },
        403
      );
    }

    const whatsappService = createWhatsAppInstanceService(supabase);
    const instance = await whatsappService.createInstance({
      businessId,
      assistantId,
      assistantName
    });

    // Update usage count
    await billingService.updateUsage(businessId, {
      instancesUsed: usage.instancesUsed + 1
    });

    return c.json({
      success: true,
      instance: {
        id: instance.id,
        name: instance.name,
        status: instance.status,
        assistantId: instance.assistantId,
        createdAt: instance.createdAt
      },
      usage: {
        used: usage.instancesUsed + 1,
        limit: usage.instanceLimit,
        remaining: usage.instanceLimit - (usage.instancesUsed + 1)
      }
    });
  } catch (error) {
    console.error('Error creating instance:', error);
    return c.json(
      { error: 'Failed to create instance' },
      500
    );
  }
});

// Purchase additional instances
app.post('/purchase-additional', zValidator('json', purchaseInstanceSchema), async (c) => {
  try {
    const { businessId, supabase } = getBusinessContext(c);
    const { quantity } = c.req.valid('json');

    const billingService = createBillingService(supabase);
    const usage = await billingService.getUsage(businessId);

    if (!usage) {
      return c.json(
        { error: 'No billing data found. Please contact support.' },
        404
      );
    }

    // Calculate new limit
    const newLimit = usage.instanceLimit + quantity;
    const additionalCost = quantity * 99; // R$ 99 per additional instance

    // Update instance limit
    await billingService.updateUsage(businessId, {
      instanceLimit: newLimit
    });

    // Create billing record for additional instances
    await billingService.recordAdditionalInstancePurchase(businessId, {
      quantity,
      unitPrice: 99,
      totalCost: additionalCost
    });

    return c.json({
      success: true,
      message: `Successfully purchased ${quantity} additional instance(s)`,
      additional_monthly_cost: `R$ ${additionalCost.toFixed(2).replace('.', ',')},00`,
      new_limits: {
        previous_limit: usage.instanceLimit,
        new_limit: newLimit,
        instances_purchased: quantity
      }
    });
  } catch (error) {
    console.error('Error purchasing additional instances:', error);
    return c.json(
      { error: 'Failed to purchase additional instances' },
      500
    );
  }
});

// Delete instance
app.delete('/:instanceName', async (c) => {
  try {
    const { businessId, supabase } = getBusinessContext(c);
    const instanceName = c.req.param('instanceName');

    const whatsappService = createWhatsAppInstanceService(supabase);
    await whatsappService.deleteInstance(businessId, instanceName);

    // Update usage count
    const billingService = createBillingService(supabase);
    const usage = await billingService.getUsage(businessId);

    if (usage && usage.instancesUsed > 0) {
      await billingService.updateUsage(businessId, {
        instancesUsed: usage.instancesUsed - 1
      });
    }

    return c.json({
      success: true,
      message: 'Instance deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting instance:', error);
    return c.json(
      { error: 'Failed to delete instance' },
      500
    );
  }
});

// Get pricing information
app.get('/pricing', async (c) => {
  return c.json({
    base_plan: {
      instances_included: 1,
      monthly_cost: 'R$ 0,00'
    },
    additional_instances: {
      cost_per_instance: 'R$ 99,00/mês',
      minimum_purchase: 1,
      maximum_purchase: 10
    },
    features: {
      unlimited_messages: true,
      ai_responses: true,
      knowledge_base: true,
      analytics: true,
      webhook_support: true
    }
  });
});

export default app;
