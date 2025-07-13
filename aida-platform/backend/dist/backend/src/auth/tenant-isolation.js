/**
 * AIDA Platform - Tenant Isolation Middleware
 * CRITICAL: Enforces strict multi-tenant data separation
 * PATTERN: Adapted from MCP server auth with business-specific context
 */
import { HTTPException } from 'hono/http-exception';
import { TenantAwareSupabase } from '../database/supabase-client';
import { extractBusinessIdFromContext, logSecurityEvent } from '../database/security';
/**
 * Tenant isolation middleware for multi-tenant security
 * CRITICAL: Must be applied to ALL authenticated endpoints
 * USAGE: app.use('/api/*', tenantIsolationMiddleware)
 */
export async function tenantIsolationMiddleware(c, next) {
    try {
        // Extract business ID from request context
        const businessId = extractBusinessIdFromContext(c.req.raw);
        if (!businessId) {
            logSecurityEvent('missing_business_id', 'Request missing business identification', undefined, {
                path: c.req.path,
                method: c.req.method,
                userAgent: c.req.header('user-agent'),
                ip: c.req.header('cf-connecting-ip')
            });
            throw new HTTPException(401, {
                message: 'Business identification required'
            });
        }
        // Validate business ID format
        if (!isValidBusinessId(businessId)) {
            logSecurityEvent('invalid_business_id', 'Invalid business ID format', businessId, {
                businessId,
                path: c.req.path
            });
            throw new HTTPException(400, {
                message: 'Invalid business identifier'
            });
        }
        // Create tenant-aware Supabase client
        const supabase = new TenantAwareSupabase({
            url: c.env.SUPABASE_URL,
            anonKey: c.env.SUPABASE_ANON_KEY,
            serviceRoleKey: c.env.SUPABASE_SERVICE_ROLE_KEY
        }, businessId);
        // Validate business access and get business data
        const business = await validateAndGetBusiness(businessId, supabase);
        if (!business) {
            logSecurityEvent('business_access_denied', 'Business not found or access denied', businessId);
            throw new HTTPException(403, {
                message: 'Business access denied'
            });
        }
        // Check business status
        if (business.status !== 'active') {
            logSecurityEvent('inactive_business_access', 'Attempted access to inactive business', businessId, {
                businessStatus: business.status
            });
            throw new HTTPException(403, {
                message: `Business account is ${business.status}`
            });
        }
        // Extract and validate API key
        const apiKey = await validateApiKey(c, businessId);
        // Get business permissions based on subscription
        const permissions = getBusinessPermissions(business);
        // Create business context
        const businessContext = {
            businessId,
            business,
            supabase,
            permissions,
            apiKey
        };
        // Inject business context into Hono variables
        c.set('business', businessContext);
        // Log successful tenant access
        console.log(`Tenant access granted: ${businessId} (${business.name}) - ${permissions.subscriptionPlan}`);
        await next();
    }
    catch (error) {
        if (error instanceof HTTPException) {
            throw error;
        }
        console.error('Tenant isolation middleware error:', error);
        logSecurityEvent('tenant_middleware_error', 'Unexpected error in tenant isolation', undefined, {
            error: error instanceof Error ? error.message : String(error)
        });
        throw new HTTPException(500, {
            message: 'Authentication system error'
        });
    }
}
/**
 * Validate business ID format
 * PATTERN: Similar to UUID validation but for business IDs
 */
function isValidBusinessId(businessId) {
    // Business IDs should be UUIDs or secure random strings
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const secureIdRegex = /^business_[a-zA-Z0-9]{24,32}$/;
    return uuidRegex.test(businessId) || secureIdRegex.test(businessId);
}
/**
 * Validate business access and retrieve business data
 * CRITICAL: Implements Row Level Security at application level
 */
async function validateAndGetBusiness(businessId, supabase) {
    try {
        // Query business with RLS policies enforcing tenant isolation
        const { data: business, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', businessId)
            .single();
        if (error || !business) {
            console.warn(`Business validation failed for ${businessId}:`, error?.message);
            return null;
        }
        return business;
    }
    catch (error) {
        console.error(`Business validation error for ${businessId}:`, error);
        return null;
    }
}
/**
 * Extract and validate API key from request
 * PATTERN: Similar to GitHub token validation in MCP server
 */
async function validateApiKey(c, businessId) {
    const authHeader = c.req.header('authorization');
    const apiKeyHeader = c.req.header('x-api-key');
    let apiKey;
    // Extract API key from Authorization header or X-API-Key header
    if (authHeader && authHeader.startsWith('Bearer ')) {
        apiKey = authHeader.substring(7);
    }
    else if (apiKeyHeader) {
        apiKey = apiKeyHeader;
    }
    if (!apiKey) {
        throw new HTTPException(401, {
            message: 'API key required'
        });
    }
    // Validate API key format (aida_live_xxx or aida_test_xxx)
    if (!isValidApiKeyFormat(apiKey)) {
        logSecurityEvent('invalid_api_key_format', 'Invalid API key format', businessId);
        throw new HTTPException(401, {
            message: 'Invalid API key format'
        });
    }
    // Extract environment from API key
    const environment = apiKey.startsWith('aida_live_') ? 'production' : 'test';
    return {
        key: apiKey,
        environment,
        businessId,
        permissions: {
            read: true,
            write: true,
            admin: apiKey.includes('_admin_')
        }
    };
}
/**
 * Validate AIDA API key format
 * Format: aida_{env}_{business_id}_{random}
 */
function isValidApiKeyFormat(apiKey) {
    const apiKeyRegex = /^aida_(live|test)_[a-zA-Z0-9]{16,32}_[a-zA-Z0-9]{16,32}$/;
    return apiKeyRegex.test(apiKey);
}
/**
 * Get business permissions based on subscription plan
 * CRITICAL: Enforces feature limits by subscription tier
 */
function getBusinessPermissions(business) {
    const basePermissions = {
        canCreateAssistants: true,
        canManageKnowledge: true,
        canAccessAnalytics: true,
        canManageWebhooks: true
    };
    switch (business.subscription_plan) {
        case 'free':
            return {
                ...basePermissions,
                maxAssistants: 1,
                maxConversationsPerMonth: 1000,
                subscriptionPlan: 'free',
                canAccessAnalytics: false
            };
        case 'pro':
            return {
                ...basePermissions,
                maxAssistants: 5,
                maxConversationsPerMonth: 10000,
                subscriptionPlan: 'pro'
            };
        case 'enterprise':
            return {
                ...basePermissions,
                maxAssistants: -1, // Unlimited
                maxConversationsPerMonth: -1, // Unlimited
                subscriptionPlan: 'enterprise'
            };
        default:
            // Default to free tier for unknown plans
            return {
                ...basePermissions,
                maxAssistants: 1,
                maxConversationsPerMonth: 1000,
                subscriptionPlan: 'free',
                canAccessAnalytics: false
            };
    }
}
/**
 * Middleware to enforce specific permissions
 * USAGE: app.use('/api/analytics/*', requirePermission('canAccessAnalytics'))
 */
export function requirePermission(permission) {
    return async (c, next) => {
        const business = c.get('business');
        if (!business) {
            throw new HTTPException(401, {
                message: 'Business context not found'
            });
        }
        const hasPermission = business.permissions[permission];
        if (!hasPermission) {
            logSecurityEvent('permission_denied', `Permission ${permission} denied`, business.businessId, {
                permission,
                subscriptionPlan: business.permissions.subscriptionPlan,
                path: c.req.path
            });
            throw new HTTPException(403, {
                message: `Feature requires ${business.permissions.subscriptionPlan === 'free' ? 'Pro or Enterprise' : 'Enterprise'} subscription`
            });
        }
        await next();
    };
}
/**
 * Get business context from Hono context
 * UTILITY: Helper for accessing business data in route handlers
 */
export function getBusinessContext(c) {
    const business = c.get('business');
    if (!business) {
        throw new HTTPException(401, {
            message: 'Business context not available'
        });
    }
    return business;
}
/**
 * Middleware to validate subscription limits
 * USAGE: app.use('/api/assistants', validateSubscriptionLimits('assistants'))
 */
export function validateSubscriptionLimits(resource) {
    return async (c, next) => {
        const business = c.get('business');
        if (!business) {
            throw new HTTPException(401, {
                message: 'Business context not found'
            });
        }
        // Check limits based on resource type
        if (resource === 'assistants') {
            const maxAssistants = business.permissions.maxAssistants;
            if (maxAssistants > 0) { // -1 means unlimited
                const { count: currentAssistants } = await business.supabase
                    .from('assistants')
                    .select('id', { count: 'exact' })
                    .eq('business_id', business.businessId);
                if (currentAssistants && currentAssistants >= maxAssistants) {
                    throw new HTTPException(403, {
                        message: `Assistant limit reached (${maxAssistants}). Upgrade subscription to create more assistants.`
                    });
                }
            }
        }
        await next();
    };
}
/**
 * Rate limiting middleware for API endpoints
 * PATTERN: Based on MCP server rate limiting but for business operations
 */
export function rateLimitByBusiness(requestsPerMinute = 60) {
    return async (c, next) => {
        const business = c.get('business');
        if (!business) {
            throw new HTTPException(401, {
                message: 'Business context not found'
            });
        }
        const key = `rate_limit:${business.businessId}:${Math.floor(Date.now() / 60000)}`;
        try {
            // Check rate limit using KV store
            const current = await c.env.RATE_LIMIT_STORE.get(key);
            const currentCount = current ? parseInt(current) : 0;
            if (currentCount >= requestsPerMinute) {
                logSecurityEvent('rate_limit_exceeded', 'API rate limit exceeded', business.businessId, {
                    requestsPerMinute,
                    currentCount,
                    path: c.req.path
                });
                throw new HTTPException(429, {
                    message: 'Rate limit exceeded. Please try again later.'
                });
            }
            // Increment counter
            await c.env.RATE_LIMIT_STORE.put(key, (currentCount + 1).toString(), { expirationTtl: 60 });
            await next();
        }
        catch (error) {
            if (error instanceof HTTPException) {
                throw error;
            }
            // If rate limiting fails, log but don't block request
            console.warn('Rate limiting error:', error);
            await next();
        }
    };
}
