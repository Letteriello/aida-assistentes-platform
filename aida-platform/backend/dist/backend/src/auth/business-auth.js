/**
 * AIDA Platform - Business Authentication System
 * PATTERN: Adapted from MCP server GitHub OAuth for business account management
 * CRITICAL: Implements secure business registration and API key management
 */
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { nanoid } from 'nanoid';
import { TenantAwareSupabase } from '../database/supabase-client';
import { logSecurityEvent, sanitizeInput, validateInput } from '../database/security';
import { ApiKeyGenerationSchema, BusinessRegistrationSchema } from '@shared/schemas';
const app = new Hono();
/**
 * Business registration endpoint
 * PATTERN: Similar to MCP OAuth but for business account creation
 * PUBLIC: No authentication required for registration
 */
app.post('/register', async (c) => {
    try {
        const body = await c.req.json();
        // Validate input with Zod schema
        const validatedData = BusinessRegistrationSchema.parse(body);
        // Sanitize input data
        const sanitizedData = {
            name: sanitizeInput(validatedData.name),
            email: sanitizeInput(validatedData.email),
            industry: sanitizeInput(validatedData.industry),
            website: validatedData.website ? sanitizeInput(validatedData.website) : null,
            phone: validatedData.phone ? sanitizeInput(validatedData.phone) : null
        };
        // Additional validation
        validateInput(sanitizedData.name, 'business_name');
        validateInput(sanitizedData.email, 'email');
        validateInput(sanitizedData.industry, 'industry');
        // Create global Supabase client for registration
        const supabase = new TenantAwareSupabase({
            url: c.env.SUPABASE_URL,
            anonKey: c.env.SUPABASE_ANON_KEY,
            serviceRoleKey: c.env.SUPABASE_SERVICE_ROLE_KEY
        }, 'system'); // Use system context for registration
        // Check if business email already exists
        const { data: existingBusiness } = await supabase
            .from('businesses')
            .select('id')
            .eq('email', sanitizedData.email)
            .single();
        if (existingBusiness) {
            throw new HTTPException(409, {
                message: 'Business with this email already exists'
            });
        }
        // Create business record
        const businessId = `business_${nanoid(24)}`;
        const business = {
            id: businessId,
            name: sanitizedData.name,
            email: sanitizedData.email,
            industry: sanitizedData.industry,
            website: sanitizedData.website,
            phone: sanitizedData.phone,
            subscription_plan: 'free',
            status: 'active',
            created_at: new Date(),
            settings: {
                timezone: 'UTC',
                language: 'en',
                notifications: {
                    email: true,
                    webhook: false
                }
            },
            billing: {
                plan: 'free',
                billing_cycle: 'monthly',
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            },
            limits: {
                max_assistants: 1,
                max_conversations_per_month: 1000,
                max_knowledge_nodes: 100
            }
        };
        const { data: createdBusiness, error: businessError } = await supabase
            .from('businesses')
            .insert(business)
            .select()
            .single();
        if (businessError || !createdBusiness) {
            console.error('Business creation failed:', businessError);
            throw new HTTPException(500, {
                message: 'Failed to create business account'
            });
        }
        // Generate initial API keys
        const { liveApiKey, testApiKey } = await generateApiKeys(businessId, c.env);
        // Log successful registration
        logSecurityEvent('business_registered', 'New business account created', businessId, {
            businessName: sanitizedData.name,
            industry: sanitizedData.industry
        });
        console.log(`Business registered: ${businessId} (${sanitizedData.name})`);
        return c.json({
            success: true,
            business: {
                id: createdBusiness.id,
                name: createdBusiness.name,
                email: createdBusiness.email,
                industry: createdBusiness.industry,
                subscription_plan: createdBusiness.subscription_plan,
                status: createdBusiness.status
            },
            apiKeys: {
                live: liveApiKey,
                test: testApiKey
            },
            message: 'Business account created successfully'
        });
    }
    catch (error) {
        if (error instanceof HTTPException) {
            throw error;
        }
        console.error('Business registration error:', error);
        logSecurityEvent('registration_error', 'Business registration failed', undefined, {
            error: error instanceof Error ? error.message : String(error)
        });
        throw new HTTPException(500, {
            message: 'Registration failed. Please try again.'
        });
    }
});
/**
 * Business login endpoint
 * PATTERN: API key-based authentication instead of OAuth flow
 * USAGE: Validates API key and returns business context
 */
app.post('/login', async (c) => {
    try {
        const body = await c.req.json();
        const { apiKey } = body;
        if (!apiKey || typeof apiKey !== 'string') {
            throw new HTTPException(400, {
                message: 'API key is required'
            });
        }
        // Validate API key format
        if (!isValidApiKeyFormat(apiKey)) {
            logSecurityEvent('invalid_api_key_format', 'Invalid API key format in login attempt');
            throw new HTTPException(401, {
                message: 'Invalid API key format'
            });
        }
        // Extract business ID from API key
        const businessId = extractBusinessIdFromApiKey(apiKey);
        if (!businessId) {
            throw new HTTPException(401, {
                message: 'Invalid API key'
            });
        }
        // Create tenant-aware Supabase client
        const supabase = new TenantAwareSupabase({
            url: c.env.SUPABASE_URL,
            anonKey: c.env.SUPABASE_ANON_KEY,
            serviceRoleKey: c.env.SUPABASE_SERVICE_ROLE_KEY
        }, businessId);
        // Validate API key against database
        const { data: apiKeyRecord, error } = await supabase
            .from('business_api_keys')
            .select('*, business:businesses(*)')
            .eq('key_hash', hashApiKey(apiKey))
            .eq('is_active', true)
            .single();
        if (error || !apiKeyRecord) {
            logSecurityEvent('invalid_api_key', 'Invalid API key used in login attempt', businessId);
            throw new HTTPException(401, {
                message: 'Invalid or inactive API key'
            });
        }
        const business = apiKeyRecord.business;
        // Check business status
        if (business.status !== 'active') {
            logSecurityEvent('inactive_business_login', 'Login attempt for inactive business', businessId, {
                businessStatus: business.status
            });
            throw new HTTPException(403, {
                message: `Business account is ${business.status}`
            });
        }
        // Update last used timestamp
        await supabase
            .from('business_api_keys')
            .update({ last_used_at: new Date() })
            .eq('id', apiKeyRecord.id);
        // Log successful login
        console.log(`Business login: ${businessId} (${business.name})`);
        return c.json({
            success: true,
            business: {
                id: business.id,
                name: business.name,
                email: business.email,
                industry: business.industry,
                subscription_plan: business.subscription_plan,
                status: business.status,
                settings: business.settings,
                limits: business.limits
            },
            apiKey: {
                environment: apiKey.startsWith('aida_live_') ? 'production' : 'test',
                permissions: apiKeyRecord.permissions,
                created_at: apiKeyRecord.created_at,
                last_used_at: apiKeyRecord.last_used_at
            }
        });
    }
    catch (error) {
        if (error instanceof HTTPException) {
            throw error;
        }
        console.error('Business login error:', error);
        throw new HTTPException(500, {
            message: 'Login failed. Please try again.'
        });
    }
});
/**
 * Generate new API key pair for business
 * AUTHENTICATED: Requires valid existing API key
 */
app.post('/api-keys/generate', async (c) => {
    try {
        const body = await c.req.json();
        const validatedData = ApiKeyGenerationSchema.parse(body);
        // This endpoint would use tenant isolation middleware
        // Business context would be available via c.get('business')
        const authHeader = c.req.header('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new HTTPException(401, {
                message: 'Authentication required'
            });
        }
        const currentApiKey = authHeader.substring(7);
        const businessId = extractBusinessIdFromApiKey(currentApiKey);
        if (!businessId) {
            throw new HTTPException(401, {
                message: 'Invalid API key'
            });
        }
        // Generate new API keys
        const { liveApiKey, testApiKey } = await generateApiKeys(businessId, c.env);
        // Optionally revoke old keys if requested
        if (validatedData.revokeExisting) {
            await revokeApiKeys(businessId, c.env, [currentApiKey]);
        }
        logSecurityEvent('api_keys_generated', 'New API keys generated', businessId, {
            revokedExisting: validatedData.revokeExisting
        });
        return c.json({
            success: true,
            apiKeys: {
                live: liveApiKey,
                test: testApiKey
            },
            message: 'API keys generated successfully'
        });
    }
    catch (error) {
        if (error instanceof HTTPException) {
            throw error;
        }
        console.error('API key generation error:', error);
        throw new HTTPException(500, {
            message: 'Failed to generate API keys'
        });
    }
});
/**
 * Revoke API keys
 * AUTHENTICATED: Requires valid existing API key
 */
app.post('/api-keys/revoke', async (c) => {
    try {
        const body = await c.req.json();
        const { apiKeys } = body;
        if (!Array.isArray(apiKeys) || apiKeys.length === 0) {
            throw new HTTPException(400, {
                message: 'API keys array is required'
            });
        }
        const authHeader = c.req.header('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new HTTPException(401, {
                message: 'Authentication required'
            });
        }
        const currentApiKey = authHeader.substring(7);
        const businessId = extractBusinessIdFromApiKey(currentApiKey);
        if (!businessId) {
            throw new HTTPException(401, {
                message: 'Invalid API key'
            });
        }
        const revokedCount = await revokeApiKeys(businessId, c.env, apiKeys);
        logSecurityEvent('api_keys_revoked', 'API keys revoked', businessId, {
            revokedCount,
            totalRequested: apiKeys.length
        });
        return c.json({
            success: true,
            revokedCount,
            message: `${revokedCount} API key(s) revoked successfully`
        });
    }
    catch (error) {
        if (error instanceof HTTPException) {
            throw error;
        }
        console.error('API key revocation error:', error);
        throw new HTTPException(500, {
            message: 'Failed to revoke API keys'
        });
    }
});
/**
 * List business API keys
 * AUTHENTICATED: Requires valid existing API key
 */
app.get('/api-keys', async (c) => {
    try {
        const authHeader = c.req.header('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new HTTPException(401, {
                message: 'Authentication required'
            });
        }
        const currentApiKey = authHeader.substring(7);
        const businessId = extractBusinessIdFromApiKey(currentApiKey);
        if (!businessId) {
            throw new HTTPException(401, {
                message: 'Invalid API key'
            });
        }
        const supabase = new TenantAwareSupabase({
            url: c.env.SUPABASE_URL,
            anonKey: c.env.SUPABASE_ANON_KEY,
            serviceRoleKey: c.env.SUPABASE_SERVICE_ROLE_KEY
        }, businessId);
        const { data: apiKeys, error } = await supabase
            .from('business_api_keys')
            .select('id, environment, permissions, created_at, last_used_at, is_active')
            .eq('business_id', businessId)
            .order('created_at', { ascending: false });
        if (error) {
            throw new HTTPException(500, {
                message: 'Failed to fetch API keys'
            });
        }
        return c.json({
            success: true,
            apiKeys: apiKeys || []
        });
    }
    catch (error) {
        if (error instanceof HTTPException) {
            throw error;
        }
        console.error('API keys list error:', error);
        throw new HTTPException(500, {
            message: 'Failed to list API keys'
        });
    }
});
/**
 * Generate API key pair for business
 * UTILITY: Creates live and test API keys
 */
async function generateApiKeys(businessId, env) {
    const liveApiKey = `aida_live_${businessId.replace('business_', '')}_${nanoid(24)}`;
    const testApiKey = `aida_test_${businessId.replace('business_', '')}_${nanoid(24)}`;
    const supabase = new TenantAwareSupabase({
        url: env.SUPABASE_URL,
        anonKey: env.SUPABASE_ANON_KEY,
        serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY
    }, businessId);
    // Store API keys in database
    const apiKeyRecords = [
        {
            business_id: businessId,
            environment: 'production',
            key_hash: hashApiKey(liveApiKey),
            permissions: {
                read: true,
                write: true,
                admin: false
            },
            is_active: true,
            created_at: new Date()
        },
        {
            business_id: businessId,
            environment: 'test',
            key_hash: hashApiKey(testApiKey),
            permissions: {
                read: true,
                write: true,
                admin: false
            },
            is_active: true,
            created_at: new Date()
        }
    ];
    const { error } = await supabase
        .from('business_api_keys')
        .insert(apiKeyRecords);
    if (error) {
        console.error('Failed to store API keys:', error);
        throw new Error('Failed to store API keys');
    }
    return { liveApiKey, testApiKey };
}
/**
 * Revoke API keys for business
 * UTILITY: Deactivates specified API keys
 */
async function revokeApiKeys(businessId, env, apiKeys) {
    const supabase = new TenantAwareSupabase({
        url: env.SUPABASE_URL,
        anonKey: env.SUPABASE_ANON_KEY,
        serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY
    }, businessId);
    const keyHashes = apiKeys.map(hashApiKey);
    const { count, error } = await supabase
        .from('business_api_keys')
        .update({ is_active: false, revoked_at: new Date() })
        .eq('business_id', businessId)
        .in('key_hash', keyHashes);
    if (error) {
        console.error('Failed to revoke API keys:', error);
        throw new Error('Failed to revoke API keys');
    }
    return count || 0;
}
/**
 * Validate AIDA API key format
 * PATTERN: Similar to GitHub token validation
 */
function isValidApiKeyFormat(apiKey) {
    const apiKeyRegex = /^aida_(live|test)_[a-zA-Z0-9]{16,32}_[a-zA-Z0-9]{16,32}$/;
    return apiKeyRegex.test(apiKey);
}
/**
 * Extract business ID from API key
 * UTILITY: Parses business ID from API key structure
 */
function extractBusinessIdFromApiKey(apiKey) {
    const match = apiKey.match(/^aida_(live|test)_([a-zA-Z0-9]{16,32})_[a-zA-Z0-9]{16,32}$/);
    return match ? `business_${match[2]}` : null;
}
/**
 * Hash API key for secure storage
 * SECURITY: Store hashes instead of plain text keys
 */
function hashApiKey(apiKey) {
    // In production, use a proper crypto hash
    // For now, using a simple hash for demonstration
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    // This would use crypto.subtle.digest in real implementation
    return Buffer.from(data).toString('base64');
}
export { app as BusinessAuthHandler };
