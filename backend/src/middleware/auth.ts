/**
 * AIDA Platform - Authentication Middleware
 * Provides authentication and authorization middleware functions
 * INTEGRATION: Works with tenant isolation and user authentication systems
 */
import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { TenantAwareSupabase } from '../database/tenant-aware-supabase';
import {
  extractBusinessIdFromContext,
  logSecurityEvent
} from '../database/security';
import { tenantIsolationMiddleware } from '../auth/tenant-isolation';
import { userAuthMiddleware } from '../auth/user-auth';
import type { Business } from '@shared/types';

/**
 * Business API authentication middleware
 * SECURITY: Validates business API keys and enforces tenant isolation
 * USAGE: Apply to all business API endpoints
 */
export const businessAuthMiddleware = tenantIsolationMiddleware;

/**
 * User authentication middleware
 * SECURITY: Validates user JWT tokens within business context
 * USAGE: Apply to user-facing endpoints
 */
export const userAuthentication = userAuthMiddleware;

/**
 * Combined business and user authentication
 * SECURITY: Validates both business API key and user JWT token
 * USAGE: Apply to endpoints that require both business and user context
 */
export async function businessAndUserAuth(
  c: Context,
  next: Next
): Promise<void | Response> {
  // First validate business API key and set tenant context
  await tenantIsolationMiddleware(c, async () => {
    // Then validate user JWT token within the business context
    await userAuthMiddleware(c, next);
  });
}

/**
 * Validates business access for protected endpoints
 * DEPRECATED: Use businessAuthMiddleware instead
 * Ensures the business exists and is active
 */
export async function validateBusinessAccess(
  c: Context,
  next: Next
): Promise<void | Response> {
  console.warn('validateBusinessAccess is deprecated. Use businessAuthMiddleware instead.');
  return businessAuthMiddleware(c, next);
}

/**
 * Validates business ID format
 */
function isValidBusinessId(businessId: string): boolean {
  // Basic UUID v4 validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(businessId);
}

/**
 * Validates and retrieves business from database
 */
async function validateAndGetBusiness(
  businessId: string,
  supabase: TenantAwareSupabase
): Promise<Business | null> {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    if (error) {
      console.error('Error fetching business:', error);
      return null;
    }

    return data as Business;
  } catch (error) {
    console.error('Error validating business:', error);
    return null;
  }
}
