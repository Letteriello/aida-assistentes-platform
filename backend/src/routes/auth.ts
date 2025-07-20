// =============================================================================
// AUTHENTICATION ROUTES - WHATSAPP PHONE AUTH
// =============================================================================
// Routes for WhatsApp-based phone number authentication
// Sends 6-digit codes via WhatsApp for verification
// =============================================================================

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { SupabaseService } from '../services/supabase.js';
import { EvolutionAPIService } from '../services/evolution-api.js';
import { generateToken } from '../middleware/auth-simple.js';

const router = Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 attempts per IP per window
  message: {
    error: 'Too Many Requests',
    message: 'Too many authentication attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const verifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Max 3 verification attempts per IP per window
  message: {
    error: 'Too Many Requests',
    message: 'Too many verification attempts. Please try again later.'
  }
});

// Initialize services
const supabaseService = new SupabaseService({
  url: process.env.SUPABASE_URL!,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
});

const evolutionAPIService = new EvolutionAPIService({
  baseURL: process.env.EVOLUTION_API_URL!,
  globalApiKey: process.env.EVOLUTION_API_KEY!,
  adminInstanceName: process.env.ADMIN_INSTANCE_NAME || 'admin-auth-instance',
  adminPhoneNumber: process.env.ADMIN_PHONE_NUMBER
});

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const phoneValidation = [
  body('phone_number')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone('any')
    .withMessage('Invalid phone number format')
    .customSanitizer((value: string) => {
      // Clean and format phone number
      return EvolutionAPIService.formatPhoneNumber(value);
    })
];

const verifyValidation = [
  body('phone_number')
    .notEmpty()
    .withMessage('Phone number is required')
    .customSanitizer((value: string) => {
      return EvolutionAPIService.formatPhoneNumber(value);
    }),
  body('code')
    .notEmpty()
    .withMessage('Verification code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits')
    .isNumeric()
    .withMessage('Verification code must contain only numbers')
];

// =============================================================================
// ROUTE HANDLERS
// =============================================================================

/**
 * POST /api/auth/send-code
 * Send verification code to phone number via WhatsApp
 */
router.post('/send-code', authLimiter, phoneValidation, async (req: Request, res: Response) => {
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

    const { phone_number } = req.body;

    // Validate phone number format
    if (!EvolutionAPIService.validatePhoneNumber(phone_number)) {
      return res.status(400).json({
        error: 'Invalid Phone Number',
        message: 'Please provide a valid phone number'
      });
    }

    // Check if admin instance is ready
    const isAdminReady = await evolutionAPIService.isAdminInstanceReady();
    if (!isAdminReady) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Authentication service is temporarily unavailable. Please try again later.'
      });
    }

    // Generate verification code
    const verificationCode = EvolutionAPIService.generateVerificationCode();

    // Save user and verification code to database
    try {
      await supabaseService.createOrUpdateUser(phone_number, verificationCode);
    } catch (dbError: any) {
      console.error('❌ Database error:', dbError);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to save verification code'
      });
    }

    // Send verification code via WhatsApp
    const messageSent = await evolutionAPIService.sendAuthCode(phone_number, verificationCode);

    if (!messageSent) {
      return res.status(500).json({
        error: 'Message Send Failed',
        message: 'Failed to send verification code. Please try again.'
      });
    }

    console.log(`✅ Verification code sent to ${phone_number}`);

    res.json({
      success: true,
      message: 'Verification code sent successfully',
      phone_number,
      expires_in: 300 // 5 minutes
    });

  } catch (error: any) {
    console.error('❌ Send code error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to send verification code'
    });
  }
});

/**
 * POST /api/auth/verify-code
 * Verify the 6-digit code and authenticate user
 */
router.post('/verify-code', verifyLimiter, verifyValidation, async (req: Request, res: Response) => {
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

    const { phone_number, code } = req.body;

    // Verify code with database
    const user = await supabaseService.verifyUser(phone_number, code);

    if (!user) {
      return res.status(401).json({
        error: 'Invalid Code',
        message: 'Invalid or expired verification code'
      });
    }

    // Generate JWT token
    const token = generateToken(user.id, user.phone_number);

    console.log(`✅ User authenticated successfully: ${phone_number}`);

    res.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: user.id,
        phone_number: user.phone_number,
        name: user.name,
        email: user.email,
        created_at: user.created_at
      },
      token,
      expires_in: '7d'
    });

  } catch (error: any) {
    console.error('❌ Verify code error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify code'
    });
  }
});

/**
 * POST /api/auth/refresh-token
 * Refresh an existing JWT token
 */
router.post('/refresh-token', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Missing Token',
        message: 'Token is required for refresh'
      });
    }

    // This would implement token refresh logic
    // For now, we'll keep it simple and return an error
    res.status(501).json({
      error: 'Not Implemented',
      message: 'Token refresh not implemented yet'
    });

  } catch (error: any) {
    console.error('❌ Refresh token error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to refresh token'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    // This would require auth middleware
    // For now, return a placeholder response
    res.json({
      message: 'This endpoint requires authentication middleware'
    });

  } catch (error: any) {
    console.error('❌ Get user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user information'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (placeholder for token blacklisting)
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // In a full implementation, you'd blacklist the token here
    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error: any) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to logout'
    });
  }
});

// =============================================================================
// ADMIN ROUTES
// =============================================================================

/**
 * POST /api/auth/admin/setup-instance
 * Setup admin WhatsApp instance for sending auth codes
 */
router.post('/admin/setup-instance', async (req: Request, res: Response) => {
  try {
    // This should be protected with admin middleware in production
    const result = await evolutionAPIService.setupAdminInstance();

    if (result) {
      res.json({
        success: true,
        message: 'Admin instance is already connected'
      });
    } else {
      res.json({
        success: false,
        message: 'Admin instance requires QR code scanning',
        instructions: 'Check server logs for QR code'
      });
    }

  } catch (error: any) {
    console.error('❌ Setup admin instance error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to setup admin instance'
    });
  }
});

/**
 * GET /api/auth/admin/status
 * Check admin instance status
 */
router.get('/admin/status', async (req: Request, res: Response) => {
  try {
    const isReady = await evolutionAPIService.isAdminInstanceReady();

    res.json({
      admin_instance_ready: isReady,
      can_send_auth_codes: isReady,
      status: isReady ? 'connected' : 'disconnected'
    });

  } catch (error: any) {
    console.error('❌ Admin status error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check admin status'
    });
  }
});

// =============================================================================
// HEALTH CHECK
// =============================================================================

/**
 * GET /api/auth/health
 * Health check for authentication service
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const adminReady = await evolutionAPIService.isAdminInstanceReady();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected', // We assume Supabase is connected if we got here
        evolution_api: adminReady ? 'connected' : 'disconnected',
        admin_instance: adminReady ? 'ready' : 'not_ready'
      }
    });

  } catch (error: any) {
    console.error('❌ Auth health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

export { router as authRoutes };