// Authentication Repository
// TASK-AUTH-001: Database Schema Setup - Repository Layer
// Version: 1.0.0
// Created: 2025-01-19

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  User,
  Tenant,
  UserTenant,
  UserSession,
  AuthAuditLog,
  TenantRole,
  AuthAction,
  SubscriptionPlan,
  SubscriptionStatus,
  AuthRepositoryInterface,
  CreateUserRequest,
  CreateTenantRequest,
  UpdateUserRequest,
  UpdateTenantRequest
} from '../../database/types/auth.types';
import { getAuthEnvVars } from '../config/auth.config';

// ============================================================================
// AUTHENTICATION REPOSITORY
// ============================================================================

export class AuthRepository implements AuthRepositoryInterface {
  private supabase: SupabaseClient;

  constructor() {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getAuthEnvVars();
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  }

  // ============================================================================
  // USER OPERATIONS
  // ============================================================================

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .insert({
        email: userData.email,
        password_hash: userData.passwordHash,
        first_name: userData.firstName,
        last_name: userData.lastName,
        email_verified: userData.emailVerified || false,
        email_verification_token: userData.emailVerificationToken,
        email_verification_expires_at: userData.emailVerificationExpiresAt,
        is_active: userData.isActive !== undefined ? userData.isActive : true,
        metadata: userData.metadata || {}
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data;
  }

  /**
   * Find user by ID
   */
  async findUserById(userId: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find user: ${error.message}`);
    }

    return data || null;
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }

    return data || null;
  }

  /**
   * Find user by email verification token
   */
  async findUserByEmailVerificationToken(token: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email_verification_token', token)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find user by verification token: ${error.message}`);
    }

    return data || null;
  }

  /**
   * Find user by password reset token
   */
  async findUserByPasswordResetToken(token: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('password_reset_token', token)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find user by reset token: ${error.message}`);
    }

    return data || null;
  }

  /**
   * Update user
   */
  async updateUser(userId: string, updates: UpdateUserRequest): Promise<User> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.passwordHash !== undefined) updateData.password_hash = updates.passwordHash;
    if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
    if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
    if (updates.emailVerified !== undefined) updateData.email_verified = updates.emailVerified;
    if (updates.emailVerificationToken !== undefined) updateData.email_verification_token = updates.emailVerificationToken;
    if (updates.emailVerificationExpiresAt !== undefined) updateData.email_verification_expires_at = updates.emailVerificationExpiresAt;
    if (updates.passwordResetToken !== undefined) updateData.password_reset_token = updates.passwordResetToken;
    if (updates.passwordResetExpiresAt !== undefined) updateData.password_reset_expires_at = updates.passwordResetExpiresAt;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.isLocked !== undefined) updateData.is_locked = updates.isLocked;
    if (updates.lockedUntil !== undefined) updateData.locked_until = updates.lockedUntil;
    if (updates.failedLoginAttempts !== undefined) updateData.failed_login_attempts = updates.failedLoginAttempts;
    if (updates.lastLoginAt !== undefined) updateData.last_login_at = updates.lastLoginAt;
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

    const { data, error } = await this.supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  // ============================================================================
  // TENANT OPERATIONS
  // ============================================================================

  /**
   * Create a new tenant
   */
  async createTenant(tenantData: CreateTenantRequest): Promise<Tenant> {
    const { data, error } = await this.supabase
      .from('tenants')
      .insert({
        name: tenantData.name,
        slug: tenantData.slug,
        description: tenantData.description,
        subscription_plan: tenantData.subscriptionPlan || 'free',
        subscription_status: tenantData.subscriptionStatus || 'active',
        is_active: tenantData.isActive !== undefined ? tenantData.isActive : true,
        settings: tenantData.settings || {},
        metadata: tenantData.metadata || {}
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create tenant: ${error.message}`);
    }

    return data;
  }

  /**
   * Find tenant by ID
   */
  async findTenantById(tenantId: string): Promise<Tenant | null> {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find tenant: ${error.message}`);
    }

    return data || null;
  }

  /**
   * Find tenant by slug
   */
  async findTenantBySlug(slug: string): Promise<Tenant | null> {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find tenant by slug: ${error.message}`);
    }

    return data || null;
  }

  /**
   * Find tenants by user ID
   */
  async findTenantsByUserId(userId: string): Promise<(Tenant & { role: TenantRole })[]> {
    const { data, error } = await this.supabase
      .from('user_tenants')
      .select(`
        role,
        tenants (
          id,
          name,
          slug,
          description,
          subscription_plan,
          subscription_status,
          subscription_expires_at,
          is_active,
          settings,
          metadata,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to find tenants for user: ${error.message}`);
    }

    return data.map(item => ({
      ...item.tenants,
      role: item.role
    })) as (Tenant & { role: TenantRole })[];
  }

  /**
   * Update tenant
   */
  async updateTenant(tenantId: string, updates: UpdateTenantRequest): Promise<Tenant> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.slug !== undefined) updateData.slug = updates.slug;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.subscriptionPlan !== undefined) updateData.subscription_plan = updates.subscriptionPlan;
    if (updates.subscriptionStatus !== undefined) updateData.subscription_status = updates.subscriptionStatus;
    if (updates.subscriptionExpiresAt !== undefined) updateData.subscription_expires_at = updates.subscriptionExpiresAt;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.settings !== undefined) updateData.settings = updates.settings;
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

    const { data, error } = await this.supabase
      .from('tenants')
      .update(updateData)
      .eq('id', tenantId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update tenant: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete tenant
   */
  async deleteTenant(tenantId: string): Promise<void> {
    const { error } = await this.supabase
      .from('tenants')
      .delete()
      .eq('id', tenantId);

    if (error) {
      throw new Error(`Failed to delete tenant: ${error.message}`);
    }
  }

  // ============================================================================
  // USER-TENANT RELATIONSHIP OPERATIONS
  // ============================================================================

  /**
   * Add user to tenant
   */
  async addUserToTenant(userId: string, tenantId: string, role: TenantRole): Promise<UserTenant> {
    const { data, error } = await this.supabase
      .from('user_tenants')
      .insert({
        user_id: userId,
        tenant_id: tenantId,
        role: role,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add user to tenant: ${error.message}`);
    }

    return data;
  }

  /**
   * Remove user from tenant
   */
  async removeUserFromTenant(userId: string, tenantId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_tenants')
      .delete()
      .eq('user_id', userId)
      .eq('tenant_id', tenantId);

    if (error) {
      throw new Error(`Failed to remove user from tenant: ${error.message}`);
    }
  }

  /**
   * Update user role in tenant
   */
  async updateUserTenantRole(userId: string, tenantId: string, role: TenantRole): Promise<UserTenant> {
    const { data, error } = await this.supabase
      .from('user_tenants')
      .update({
        role: role,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user tenant role: ${error.message}`);
    }

    return data;
  }

  /**
   * Find user-tenant relationship
   */
  async findUserTenant(userId: string, tenantId: string): Promise<UserTenant | null> {
    const { data, error } = await this.supabase
      .from('user_tenants')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find user tenant relationship: ${error.message}`);
    }

    return data || null;
  }

  // ============================================================================
  // SESSION OPERATIONS
  // ============================================================================

  /**
   * Create user session
   */
  async createSession(sessionData: {
    userId: string;
    tenantId: string;
    refreshToken: string;
    refreshTokenExpiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<UserSession> {
    const { data, error } = await this.supabase
      .from('user_sessions')
      .insert({
        user_id: sessionData.userId,
        tenant_id: sessionData.tenantId,
        refresh_token: sessionData.refreshToken,
        refresh_token_expires_at: sessionData.refreshTokenExpiresAt.toISOString(),
        ip_address: sessionData.ipAddress,
        user_agent: sessionData.userAgent,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return data;
  }

  /**
   * Find session by refresh token
   */
  async findSessionByRefreshToken(refreshToken: string): Promise<UserSession | null> {
    const { data, error } = await this.supabase
      .from('user_sessions')
      .select('*')
      .eq('refresh_token', refreshToken)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find session: ${error.message}`);
    }

    return data || null;
  }

  /**
   * Find active sessions by user ID
   */
  async findActiveSessionsByUserId(userId: string): Promise<UserSession[]> {
    const { data, error } = await this.supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find active sessions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update session last activity
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_sessions')
      .update({
        last_activity_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to update session activity: ${error.message}`);
    }
  }

  /**
   * Revoke session
   */
  async revokeSession(sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_sessions')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to revoke session: ${error.message}`);
    }
  }

  /**
   * Revoke all user sessions
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_sessions')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to revoke all user sessions: ${error.message}`);
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const { data, error } = await this.supabase
      .from('user_sessions')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString()
      })
      .lt('refresh_token_expires_at', new Date().toISOString())
      .eq('is_active', true)
      .select('id');

    if (error) {
      throw new Error(`Failed to cleanup expired sessions: ${error.message}`);
    }

    return data?.length || 0;
  }

  // ============================================================================
  // AUDIT LOG OPERATIONS
  // ============================================================================

  /**
   * Create audit log entry
   */
  async createAuditLog(logData: {
    userId?: string;
    tenantId?: string;
    action: AuthAction;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuthAuditLog> {
    const { data, error } = await this.supabase
      .from('auth_audit_logs')
      .insert({
        user_id: logData.userId,
        tenant_id: logData.tenantId,
        action: logData.action,
        details: logData.details || {},
        ip_address: logData.ipAddress,
        user_agent: logData.userAgent
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create audit log: ${error.message}`);
    }

    return data;
  }

  /**
   * Find audit logs by user ID
   */
  async findAuditLogsByUserId(userId: string, limit: number = 100): Promise<AuthAuditLog[]> {
    const { data, error } = await this.supabase
      .from('auth_audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to find audit logs: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find audit logs by tenant ID
   */
  async findAuditLogsByTenantId(tenantId: string, limit: number = 100): Promise<AuthAuditLog[]> {
    const { data, error } = await this.supabase
      .from('auth_audit_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to find audit logs by tenant: ${error.message}`);
    }

    return data || [];
  }

  // ============================================================================
  // UTILITY OPERATIONS
  // ============================================================================

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check email existence: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Check if tenant slug exists
   */
  async tenantSlugExists(slug: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check tenant slug existence: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Get user count for tenant
   */
  async getUserCountForTenant(tenantId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('user_tenants')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to get user count for tenant: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Get tenant count for user
   */
  async getTenantCountForUser(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('user_tenants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to get tenant count for user: ${error.message}`);
    }

    return count || 0;
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default AuthRepository;