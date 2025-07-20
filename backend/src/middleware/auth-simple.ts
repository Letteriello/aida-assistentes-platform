// =============================================================================
// AUTHENTICATION MIDDLEWARE - SIMPLIFIED
// =============================================================================
// JWT-based authentication middleware for Express
// Handles user sessions and request authorization
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { SupabaseService } from '../services/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    phone_number: string;
    name?: string;
    email?: string;
  };
}

export interface JWTPayload {
  userId: string;
  phoneNumber: string;
  iat?: number;
  exp?: number;
}

// =============================================================================
// TOKEN MANAGEMENT
// =============================================================================

export function generateToken(userId: string, phoneNumber: string): string {
  const payload: JWTPayload = {
    userId,
    phoneNumber
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('❌ JWT verification failed:', error);
    return null;
  }
}

// =============================================================================
// AUTHENTICATION MIDDLEWARE
// =============================================================================

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
      return;
    }

    const supabaseService = new SupabaseService({
      url: process.env.SUPABASE_URL!,
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    const user = await supabaseService.getUserById(decoded.userId);
    
    if (!user || !user.is_verified) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found or not verified'
      });
      return;
    }

    req.user = {
      id: user.id,
      phone_number: user.phone_number,
      name: user.name,
      email: user.email
    };

    next();
  } catch (error) {
    console.error('❌ Authentication middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication check failed'
    });
  }
}

export function getUserId(req: AuthenticatedRequest): string | null {
  return req.user?.id || null;
}

export type { AuthenticatedRequest, JWTPayload };