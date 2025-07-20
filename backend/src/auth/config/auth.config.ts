// Authentication System Configuration
// TASK-AUTH-001: Database Schema Setup - Configuration
// Version: 1.0.0
// Created: 2025-01-19

import { AuthConfig } from '../../database/types/auth.types';

// ============================================================================
// AUTHENTICATION CONFIGURATION
// ============================================================================

export const AUTH_CONFIG: AuthConfig = {
  jwt: {
    accessTokenExpiry: '24h',
    refreshTokenExpiry: '30d',
    issuer: 'aida-platform',
    audience: {
      api: 'aida-api',
      refresh: 'aida-refresh'
    },
    algorithm: 'RS256'
  },
  password: {
    bcryptRounds: 12,
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true
  },
  rateLimit: {
    login: {
      maxAttempts: 5,
      windowMs: 60000 // 1 minute
    },
    register: {
      maxAttempts: 10,
      windowMs: 3600000 // 1 hour
    },
    passwordReset: {
      maxAttempts: 3,
      windowMs: 3600000 // 1 hour
    }
  },
  session: {
    maxConcurrentSessions: 5,
    cleanupIntervalMs: 3600000 // 1 hour
  },
  email: {
    verificationTokenExpiry: 86400000, // 24 hours
    passwordResetTokenExpiry: 3600000 // 1 hour
  },
  security: {
    accountLockDuration: 900000, // 15 minutes
    maxFailedAttempts: 5
  }
};

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

export const getAuthEnvVars = () => {
  const requiredVars = {
    JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY,
    JWT_PUBLIC_KEY: process.env.JWT_PUBLIC_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL
  };

  // Check for missing required environment variables
  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return requiredVars as Record<keyof typeof requiredVars, string>;
};

// ============================================================================
// CONSTANTS
// ============================================================================

export const AUTH_CONSTANTS = {
  // Token types
  TOKEN_TYPES: {
    ACCESS: 'access',
    REFRESH: 'refresh'
  },

  // User roles
  ROLES: {
    OWNER: 'owner',
    ADMIN: 'admin',
    MEMBER: 'member',
    VIEWER: 'viewer'
  } as const,

  // Permissions
  PERMISSIONS: {
    // User management
    USER_CREATE: 'user:create',
    USER_READ: 'user:read',
    USER_UPDATE: 'user:update',
    USER_DELETE: 'user:delete',
    
    // Tenant management
    TENANT_CREATE: 'tenant:create',
    TENANT_READ: 'tenant:read',
    TENANT_UPDATE: 'tenant:update',
    TENANT_DELETE: 'tenant:delete',
    
    // Assistant management
    ASSISTANT_CREATE: 'assistant:create',
    ASSISTANT_READ: 'assistant:read',
    ASSISTANT_UPDATE: 'assistant:update',
    ASSISTANT_DELETE: 'assistant:delete',
    
    // Conversation management
    CONVERSATION_READ: 'conversation:read',
    CONVERSATION_DELETE: 'conversation:delete',
    
    // Billing management
    BILLING_READ: 'billing:read',
    BILLING_UPDATE: 'billing:update',
    
    // Analytics
    ANALYTICS_READ: 'analytics:read'
  } as const,

  // Role permissions mapping
  ROLE_PERMISSIONS: {
    owner: [
      'user:create', 'user:read', 'user:update', 'user:delete',
      'tenant:create', 'tenant:read', 'tenant:update', 'tenant:delete',
      'assistant:create', 'assistant:read', 'assistant:update', 'assistant:delete',
      'conversation:read', 'conversation:delete',
      'billing:read', 'billing:update',
      'analytics:read'
    ],
    admin: [
      'user:create', 'user:read', 'user:update',
      'tenant:read', 'tenant:update',
      'assistant:create', 'assistant:read', 'assistant:update', 'assistant:delete',
      'conversation:read', 'conversation:delete',
      'analytics:read'
    ],
    member: [
      'user:read',
      'tenant:read',
      'assistant:create', 'assistant:read', 'assistant:update',
      'conversation:read'
    ],
    viewer: [
      'user:read',
      'tenant:read',
      'assistant:read',
      'conversation:read'
    ]
  } as const,

  // Subscription plans
  SUBSCRIPTION_PLANS: {
    FREE: 'free',
    STARTER: 'starter',
    PROFESSIONAL: 'professional',
    ENTERPRISE: 'enterprise'
  } as const,

  // Subscription statuses
  SUBSCRIPTION_STATUSES: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    CANCELLED: 'cancelled',
    PAST_DUE: 'past_due'
  } as const,

  // Auth actions for audit logs
  AUTH_ACTIONS: {
    REGISTER: 'register',
    LOGIN: 'login',
    LOGOUT: 'logout',
    REFRESH_TOKEN: 'refresh_token',
    PASSWORD_RESET_REQUEST: 'password_reset_request',
    PASSWORD_RESET_CONFIRM: 'password_reset_confirm',
    EMAIL_VERIFICATION: 'email_verification',
    ACCOUNT_LOCK: 'account_lock',
    ACCOUNT_UNLOCK: 'account_unlock',
    TENANT_SWITCH: 'tenant_switch',
    SESSION_REVOKE: 'session_revoke'
  } as const,

  // HTTP status codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500
  } as const,

  // Error codes
  ERROR_CODES: {
    // Validation errors
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_EMAIL: 'INVALID_EMAIL',
    WEAK_PASSWORD: 'WEAK_PASSWORD',
    
    // Authentication errors
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
    ACCOUNT_NOT_VERIFIED: 'ACCOUNT_NOT_VERIFIED',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    TOKEN_INVALID: 'TOKEN_INVALID',
    TOKEN_BLACKLISTED: 'TOKEN_BLACKLISTED',
    
    // Authorization errors
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
    TENANT_ACCESS_DENIED: 'TENANT_ACCESS_DENIED',
    
    // Resource errors
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
    SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
    EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
    TENANT_SLUG_EXISTS: 'TENANT_SLUG_EXISTS',
    
    // Rate limiting
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    
    // System errors
    DATABASE_ERROR: 'DATABASE_ERROR',
    EMAIL_SERVICE_ERROR: 'EMAIL_SERVICE_ERROR',
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR'
  } as const
};

// ============================================================================
// VALIDATION PATTERNS
// ============================================================================

export const VALIDATION_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PASSWORD: {
    MIN_LENGTH: 8,
    UPPERCASE: /[A-Z]/,
    LOWERCASE: /[a-z]/,
    NUMBER: /\d/,
    SYMBOL: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/
  },
  TENANT_SLUG: /^[a-z0-9-]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get permissions for a specific role
 */
export const getPermissionsForRole = (role: keyof typeof AUTH_CONSTANTS.ROLE_PERMISSIONS): string[] => {
  return AUTH_CONSTANTS.ROLE_PERMISSIONS[role] || [];
};

/**
 * Check if a role has a specific permission
 */
export const roleHasPermission = (role: keyof typeof AUTH_CONSTANTS.ROLE_PERMISSIONS, permission: string): boolean => {
  const permissions = getPermissionsForRole(role);
  return permissions.includes(permission);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  return VALIDATION_PATTERNS.EMAIL.test(email);
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < VALIDATION_PATTERNS.PASSWORD.MIN_LENGTH) {
    errors.push(`Password must be at least ${VALIDATION_PATTERNS.PASSWORD.MIN_LENGTH} characters long`);
  }
  
  if (!VALIDATION_PATTERNS.PASSWORD.UPPERCASE.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!VALIDATION_PATTERNS.PASSWORD.LOWERCASE.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!VALIDATION_PATTERNS.PASSWORD.NUMBER.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!VALIDATION_PATTERNS.PASSWORD.SYMBOL.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate tenant slug format
 */
export const isValidTenantSlug = (slug: string): boolean => {
  return VALIDATION_PATTERNS.TENANT_SLUG.test(slug) && slug.length >= 3 && slug.length <= 50;
};

/**
 * Validate UUID format
 */
export const isValidUUID = (uuid: string): boolean => {
  return VALIDATION_PATTERNS.UUID.test(uuid);
};

/**
 * Generate a secure random token
 */
export const generateSecureToken = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Calculate token expiration date
 */
export const calculateExpirationDate = (expiryMs: number): Date => {
  return new Date(Date.now() + expiryMs);
};

/**
 * Check if a date is expired
 */
export const isExpired = (date: Date): boolean => {
  return date.getTime() < Date.now();
};