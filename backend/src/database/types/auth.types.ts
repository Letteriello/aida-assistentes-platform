// Authentication System Types
// TASK-AUTH-001: Database Schema Setup - TypeScript Types
// Version: 1.0.0
// Created: 2025-01-19

// ============================================================================
// DATABASE TABLE TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  password_hash: string;
  email_verified: boolean;
  email_verification_token?: string;
  email_verification_expires_at?: Date;
  password_reset_token?: string;
  password_reset_expires_at?: Date;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  failed_login_attempts: number;
  locked_until?: Date;
  is_active: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, any>;
  subscription_plan: string;
  subscription_status: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface UserTenant {
  id: string;
  user_id: string;
  tenant_id: string;
  role: TenantRole;
  permissions: string[];
  invited_by?: string;
  invited_at?: Date;
  joined_at: Date;
  created_at: Date;
  is_active: boolean;
}

export interface UserSession {
  id: string;
  user_id: string;
  tenant_id?: string;
  refresh_token_hash: string;
  access_token_jti?: string;
  expires_at: Date;
  created_at: Date;
  last_used: Date;
  user_agent?: string;
  ip_address?: string;
  is_active: boolean;
}

export interface AuthAuditLog {
  id: string;
  user_id?: string;
  tenant_id?: string;
  action: AuthAction;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
  created_at: Date;
}

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export type TenantRole = 'owner' | 'admin' | 'member' | 'viewer';

export type AuthAction = 
  | 'register'
  | 'login'
  | 'logout'
  | 'refresh_token'
  | 'password_reset_request'
  | 'password_reset_confirm'
  | 'email_verification'
  | 'account_lock'
  | 'account_unlock'
  | 'tenant_switch'
  | 'session_revoke';

export type SubscriptionPlan = 'free' | 'starter' | 'professional' | 'enterprise';

export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due';

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface RegisterRequest {
  email: string;
  password: string;
  tenant_slug?: string;
  invitation_token?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user_id?: string;
  requires_verification?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  tenant_slug?: string;
}

export interface LoginResponse {
  success: boolean;
  access_token: string;
  refresh_token: string;
  user: UserProfile;
  tenant: TenantInfo;
  expires_in: number;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface RefreshResponse {
  success: boolean;
  access_token: string;
  refresh_token?: string; // Optional for token rotation
  expires_in: number;
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  new_password: string;
}

export interface EmailVerificationRequest {
  token: string;
}

export interface SwitchTenantRequest {
  tenant_id: string;
}

// ============================================================================
// JWT TOKEN TYPES
// ============================================================================

export interface AccessTokenPayload {
  sub: string;           // user_id
  email: string;
  tenant_id: string;
  role: TenantRole;
  permissions: string[];
  iat: number;
  exp: number;
  jti: string;           // JWT ID for blacklisting
  iss: string;           // 'aida-platform'
  aud: string;           // 'aida-api'
}

export interface RefreshTokenPayload {
  sub: string;           // user_id
  session_id: string;
  iat: number;
  exp: number;
  iss: string;           // 'aida-platform'
  aud: string;           // 'aida-refresh'
}

// ============================================================================
// USER PROFILE TYPES
// ============================================================================

export interface UserProfile {
  id: string;
  email: string;
  email_verified: boolean;
  created_at: Date;
  last_login?: Date;
  current_tenant: TenantInfo;
  available_tenants: TenantInfo[];
}

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  role: TenantRole;
  permissions: string[];
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface AuthServiceInterface {
  register(data: RegisterRequest): Promise<RegisterResponse>;
  login(credentials: LoginRequest): Promise<LoginResponse>;
  refresh(token: RefreshRequest): Promise<RefreshResponse>;
  logout(token: LogoutRequest): Promise<LogoutResponse>;
  validateToken(token: string): Promise<AccessTokenPayload>;
  requestPasswordReset(data: PasswordResetRequest): Promise<{ success: boolean; message: string }>;
  confirmPasswordReset(data: PasswordResetConfirmRequest): Promise<{ success: boolean; message: string }>;
  verifyEmail(data: EmailVerificationRequest): Promise<{ success: boolean; message: string }>;
  switchTenant(userId: string, data: SwitchTenantRequest): Promise<LoginResponse>;
}

export interface JWTServiceInterface {
  generateAccessToken(payload: Omit<AccessTokenPayload, 'iat' | 'exp' | 'jti' | 'iss' | 'aud'>): Promise<string>;
  generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp' | 'iss' | 'aud'>): Promise<string>;
  verifyAccessToken(token: string): Promise<AccessTokenPayload>;
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
  blacklistToken(jti: string): Promise<void>;
  isTokenBlacklisted(jti: string): Promise<boolean>;
}

export interface PasswordServiceInterface {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
  validateStrength(password: string): { valid: boolean; errors: string[] };
  generateResetToken(): string;
  generateVerificationToken(): string;
}

// ============================================================================
// DATABASE REPOSITORY INTERFACES
// ============================================================================

export interface UserRepositoryInterface {
  create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByVerificationToken(token: string): Promise<User | null>;
  findByPasswordResetToken(token: string): Promise<User | null>;
  update(id: string, data: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
  incrementFailedAttempts(id: string): Promise<void>;
  resetFailedAttempts(id: string): Promise<void>;
  lockAccount(id: string, until: Date): Promise<void>;
  unlockAccount(id: string): Promise<void>;
}

export interface TenantRepositoryInterface {
  create(tenant: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>): Promise<Tenant>;
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  findByUserId(userId: string): Promise<Tenant[]>;
  update(id: string, data: Partial<Tenant>): Promise<Tenant>;
  delete(id: string): Promise<void>;
}

export interface UserTenantRepositoryInterface {
  create(userTenant: Omit<UserTenant, 'id' | 'created_at'>): Promise<UserTenant>;
  findByUserAndTenant(userId: string, tenantId: string): Promise<UserTenant | null>;
  findByUserId(userId: string): Promise<UserTenant[]>;
  findByTenantId(tenantId: string): Promise<UserTenant[]>;
  update(id: string, data: Partial<UserTenant>): Promise<UserTenant>;
  delete(id: string): Promise<void>;
  updateRole(userId: string, tenantId: string, role: TenantRole): Promise<UserTenant>;
  updatePermissions(userId: string, tenantId: string, permissions: string[]): Promise<UserTenant>;
}

export interface SessionRepositoryInterface {
  create(session: Omit<UserSession, 'id' | 'created_at'>): Promise<UserSession>;
  findById(id: string): Promise<UserSession | null>;
  findByRefreshTokenHash(hash: string): Promise<UserSession | null>;
  findByUserId(userId: string): Promise<UserSession[]>;
  findByAccessTokenJti(jti: string): Promise<UserSession | null>;
  update(id: string, data: Partial<UserSession>): Promise<UserSession>;
  delete(id: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;
  updateLastUsed(id: string): Promise<void>;
}

export interface AuditLogRepositoryInterface {
  create(log: Omit<AuthAuditLog, 'id' | 'created_at'>): Promise<AuthAuditLog>;
  findByUserId(userId: string, limit?: number): Promise<AuthAuditLog[]>;
  findByTenantId(tenantId: string, limit?: number): Promise<AuthAuditLog[]>;
  findByAction(action: AuthAction, limit?: number): Promise<AuthAuditLog[]>;
  deleteOlderThan(date: Date): Promise<number>;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ValidationError extends AuthError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AuthError {
  constructor(message: string = 'Forbidden') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AuthError {
  constructor(message: string = 'Not Found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AuthError {
  constructor(message: string = 'Conflict') {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AuthError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
    this.name = 'RateLimitError';
  }
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface AuthConfig {
  jwt: {
    accessTokenExpiry: string;     // '24h'
    refreshTokenExpiry: string;    // '30d'
    issuer: string;                // 'aida-platform'
    audience: {
      api: string;                 // 'aida-api'
      refresh: string;             // 'aida-refresh'
    };
    algorithm: 'RS256';
  };
  password: {
    bcryptRounds: number;          // 12
    minLength: number;             // 8
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
  };
  rateLimit: {
    login: {
      maxAttempts: number;         // 5
      windowMs: number;            // 60000 (1 minute)
    };
    register: {
      maxAttempts: number;         // 10
      windowMs: number;            // 3600000 (1 hour)
    };
    passwordReset: {
      maxAttempts: number;         // 3
      windowMs: number;            // 3600000 (1 hour)
    };
  };
  session: {
    maxConcurrentSessions: number; // 5
    cleanupIntervalMs: number;     // 3600000 (1 hour)
  };
  email: {
    verificationTokenExpiry: number; // 86400000 (24 hours)
    passwordResetTokenExpiry: number; // 3600000 (1 hour)
  };
  security: {
    accountLockDuration: number;   // 900000 (15 minutes)
    maxFailedAttempts: number;     // 5
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type CreateUserData = Omit<User, 'id' | 'created_at' | 'updated_at' | 'failed_login_attempts' | 'is_active'>;
export type UpdateUserData = Partial<Pick<User, 'email' | 'password_hash' | 'email_verified' | 'last_login'>>;
export type CreateTenantData = Omit<Tenant, 'id' | 'created_at' | 'updated_at' | 'is_active'>;
export type UpdateTenantData = Partial<Pick<Tenant, 'name' | 'settings' | 'subscription_plan' | 'subscription_status'>>;