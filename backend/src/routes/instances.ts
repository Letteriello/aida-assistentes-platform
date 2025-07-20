// =============================================================================
// WHATSAPP INSTANCES ROUTES
// =============================================================================
// Routes for managing WhatsApp instances
// Core product functionality - R$250/month per instance
// =============================================================================

import { Router, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { AuthenticatedRequest, getUserId } from '../middleware/auth-simple.js';
import { SupabaseService } from '../services/supabase.js';
import { EvolutionAPIService } from '../services/evolution-api.js';

const router = Router();

// Initialize services
const supabaseService = new SupabaseService({
  url: process.env.SUPABASE_URL!,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
});

const evolutionAPIService = new EvolutionAPIService({
  baseURL: process.env.EVOLUTION_API_URL!,
  globalApiKey: process.env.EVOLUTION_API_KEY!,
  adminInstanceName: process.env.ADMIN_INSTANCE_NAME || 'admin-auth-instance'
});

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const createInstanceValidation = [
  body('instance_name')
    .notEmpty()
    .withMessage('Instance name is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Instance name must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Instance name can only contain letters, numbers, hyphens and underscores'),
  body('assistant_name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Assistant name must be between 1 and 100 characters')
];

const instanceIdValidation = [
  param('instanceId')
    .isUUID()
    .withMessage('Invalid instance ID format')
];

// =============================================================================
// ROUTE HANDLERS
// =============================================================================

/**
 * GET /api/instances
 * Get all WhatsApp instances for the authenticated user
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required'
      });
    }

    const instances = await supabaseService.getUserInstances(userId);

    // Get status from Evolution API for each instance
    const instancesWithStatus = await Promise.all(
      instances.map(async (instance) => {
        try {
          const evolutionStatus = await evolutionAPIService.getInstanceStatus(instance.instance_name);
          return {
            ...instance,
            evolution_status: evolutionStatus.status,
            evolution_phone: evolutionStatus.phoneNumber
          };
        } catch (error) {
          console.error(`❌ Failed to get Evolution API status for ${instance.instance_name}:`, error);
          return {
            ...instance,
            evolution_status: 'error',
            evolution_phone: null
          };
        }
      })
    );

    res.json({
      success: true,
      instances: instancesWithStatus,
      total: instancesWithStatus.length
    });

  } catch (error: any) {
    console.error('❌ Get instances error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch instances'
    });
  }
});

/**
 * POST /api/instances
 * Create a new WhatsApp instance
 */
router.post('/', createInstanceValidation, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required'
      });
    }

    const { instance_name, assistant_name = 'Assistente AI' } = req.body;

    // Check if instance name already exists
    const existingInstance = await supabaseService.getInstanceByName(instance_name);
    if (existingInstance) {
      return res.status(409).json({
        error: 'Instance Already Exists',
        message: 'An instance with this name already exists'
      });
    }

    // Check user's instance limit (for future paid plans)
    const userInstances = await supabaseService.getUserInstances(userId);
    const activeInstances = userInstances.filter(inst => inst.subscription_status === 'active');
    
    // For MVP, limit to 5 instances per user
    if (activeInstances.length >= 5) {
      return res.status(403).json({
        error: 'Instance Limit Reached',
        message: 'You have reached the maximum number of instances (5). Please upgrade your plan or delete an existing instance.'
      });
    }

    // Create instance in database
    const dbInstance = await supabaseService.createWhatsAppInstance(
      userId,
      instance_name,
      assistant_name
    );

    // Create instance in Evolution API
    try {
      const webhookUrl = `${process.env.BACKEND_URL}/api/webhooks/evolution/${instance_name}`;
      const evolutionInstance = await evolutionAPIService.createInstance(instance_name, webhookUrl);

      // Update database with QR code
      if (evolutionInstance.qrCode) {
        await supabaseService.updateWhatsAppInstance(dbInstance.id, {
          qr_code: evolutionInstance.qrCode,
          status: 'connecting'
        });
      }

      res.status(201).json({
        success: true,
        message: 'WhatsApp instance created successfully',
        instance: {
          ...dbInstance,
          qr_code: evolutionInstance.qrCode,
          status: 'connecting'
        }
      });

    } catch (evolutionError: any) {
      console.error('❌ Evolution API error:', evolutionError);
      
      // Delete from database if Evolution API creation failed
      await supabaseService.deleteWhatsAppInstance(dbInstance.id);
      
      return res.status(500).json({
        error: 'Evolution API Error',
        message: 'Failed to create WhatsApp instance in Evolution API'
      });
    }

  } catch (error: any) {
    console.error('❌ Create instance error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create WhatsApp instance'
    });
  }
});

/**
 * GET /api/instances/:instanceId
 * Get specific WhatsApp instance details
 */
router.get('/:instanceId', instanceIdValidation, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required'
      });
    }

    const { instanceId } = req.params;

    // Get instance from database
    const userInstances = await supabaseService.getUserInstances(userId);
    const instance = userInstances.find(inst => inst.id === instanceId);

    if (!instance) {
      return res.status(404).json({
        error: 'Instance Not Found',
        message: 'WhatsApp instance not found or access denied'
      });
    }

    // Get current status from Evolution API
    try {
      const evolutionStatus = await evolutionAPIService.getInstanceStatus(instance.instance_name);
      const qrCode = evolutionStatus.status === 'connecting' 
        ? await evolutionAPIService.getQRCode(instance.instance_name)
        : null;

      // Update database if status changed
      if (evolutionStatus.status !== instance.status) {
        await supabaseService.updateWhatsAppInstance(instanceId, {
          status: evolutionStatus.status,
          phone_number: evolutionStatus.phoneNumber,
          last_connection_at: evolutionStatus.status === 'connected' 
            ? new Date().toISOString() 
            : instance.last_connection_at
        });
      }

      res.json({
        success: true,
        instance: {
          ...instance,
          evolution_status: evolutionStatus.status,
          evolution_phone: evolutionStatus.phoneNumber,
          current_qr_code: qrCode
        }
      });

    } catch (evolutionError) {
      console.error('❌ Evolution API error:', evolutionError);
      res.json({
        success: true,
        instance: {
          ...instance,
          evolution_status: 'error',
          evolution_phone: null,
          current_qr_code: null
        }
      });
    }

  } catch (error: any) {
    console.error('❌ Get instance error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch instance details'
    });
  }
});

/**
 * GET /api/instances/:instanceId/qr
 * Get QR code for WhatsApp connection
 */
router.get('/:instanceId/qr', instanceIdValidation, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required'
      });
    }

    const { instanceId } = req.params;

    // Get instance from database
    const userInstances = await supabaseService.getUserInstances(userId);
    const instance = userInstances.find(inst => inst.id === instanceId);

    if (!instance) {
      return res.status(404).json({
        error: 'Instance Not Found',
        message: 'WhatsApp instance not found or access denied'
      });
    }

    // Get fresh QR code from Evolution API
    const qrCode = await evolutionAPIService.getQRCode(instance.instance_name);

    if (!qrCode) {
      return res.status(404).json({
        error: 'QR Code Not Available',
        message: 'QR code is not available. Instance might be connected or in error state.'
      });
    }

    res.json({
      success: true,
      qr_code: qrCode,
      instance_name: instance.instance_name,
      expires_in: 120 // QR codes typically expire in 2 minutes
    });

  } catch (error: any) {
    console.error('❌ Get QR code error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get QR code'
    });
  }
});

/**
 * POST /api/instances/:instanceId/restart
 * Restart WhatsApp instance
 */
router.post('/:instanceId/restart', instanceIdValidation, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required'
      });
    }

    const { instanceId } = req.params;

    // Get instance from database
    const userInstances = await supabaseService.getUserInstances(userId);
    const instance = userInstances.find(inst => inst.id === instanceId);

    if (!instance) {
      return res.status(404).json({
        error: 'Instance Not Found',
        message: 'WhatsApp instance not found or access denied'
      });
    }

    // Restart instance in Evolution API
    const success = await evolutionAPIService.restartInstance(instance.instance_name);

    if (!success) {
      return res.status(500).json({
        error: 'Restart Failed',
        message: 'Failed to restart WhatsApp instance'
      });
    }

    // Update status in database
    await supabaseService.updateWhatsAppInstance(instanceId, {
      status: 'connecting'
    });

    res.json({
      success: true,
      message: 'WhatsApp instance restarted successfully'
    });

  } catch (error: any) {
    console.error('❌ Restart instance error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to restart instance'
    });
  }
});

/**
 * DELETE /api/instances/:instanceId
 * Delete WhatsApp instance
 */
router.delete('/:instanceId', instanceIdValidation, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required'
      });
    }

    const { instanceId } = req.params;

    // Get instance from database
    const userInstances = await supabaseService.getUserInstances(userId);
    const instance = userInstances.find(inst => inst.id === instanceId);

    if (!instance) {
      return res.status(404).json({
        error: 'Instance Not Found',
        message: 'WhatsApp instance not found or access denied'
      });
    }

    // Delete from Evolution API first
    try {
      await evolutionAPIService.deleteInstance(instance.instance_name);
    } catch (evolutionError) {
      console.error('❌ Evolution API deletion warning:', evolutionError);
      // Continue with database deletion even if Evolution API fails
    }

    // Delete from database
    const deleted = await supabaseService.deleteWhatsAppInstance(instanceId);

    if (!deleted) {
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to delete instance from database'
      });
    }

    res.json({
      success: true,
      message: 'WhatsApp instance deleted successfully'
    });

  } catch (error: any) {
    console.error('❌ Delete instance error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete instance'
    });
  }
});

/**
 * GET /api/instances/:instanceId/usage
 * Get usage statistics for instance
 */
router.get('/:instanceId/usage', instanceIdValidation, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required'
      });
    }

    const { instanceId } = req.params;

    // Get instance from database
    const userInstances = await supabaseService.getUserInstances(userId);
    const instance = userInstances.find(inst => inst.id === instanceId);

    if (!instance) {
      return res.status(404).json({
        error: 'Instance Not Found',
        message: 'WhatsApp instance not found or access denied'
      });
    }

    // Calculate usage percentages
    const messageUsagePercent = Math.round((instance.messages_used / instance.message_limit) * 100);
    const documentUsagePercent = Math.round((instance.documents_used / instance.document_limit) * 100);

    // Calculate days until billing
    const now = new Date();
    const billingDate = new Date(instance.next_billing_date);
    const daysUntilBilling = Math.ceil((billingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      usage: {
        messages: {
          used: instance.messages_used,
          limit: instance.message_limit,
          remaining: instance.message_limit - instance.messages_used,
          percentage: messageUsagePercent
        },
        documents: {
          used: instance.documents_used,
          limit: instance.document_limit,
          remaining: instance.document_limit - instance.documents_used,
          percentage: documentUsagePercent
        },
        billing: {
          status: instance.subscription_status,
          current_period_start: instance.current_period_start,
          current_period_end: instance.current_period_end,
          next_billing_date: instance.next_billing_date,
          days_until_billing: daysUntilBilling,
          monthly_cost: 25000 // R$ 250.00 in cents
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Get usage error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch usage statistics'
    });
  }
});

export { router as instanceRoutes };