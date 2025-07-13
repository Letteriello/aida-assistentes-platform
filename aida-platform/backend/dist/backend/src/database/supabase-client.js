/**
 * AIDA Platform - Supabase Client with Multi-Tenant Support
 * CRITICAL: Implements tenant-aware database operations with pgvector support
 * PATTERN: Mirrors use-cases/mcp-server/src/database/connection.ts patterns
 */
import { createClient } from '@supabase/supabase-js';
/**
 * Tenant-aware Supabase client that enforces Row Level Security
 * CRITICAL: All database operations are automatically filtered by business_id
 */
export class TenantAwareSupabase {
    client;
    serviceClient;
    businessId;
    constructor(config, businessId) {
        if (!businessId) {
            throw new Error('Business ID is required for tenant isolation');
        }
        this.businessId = businessId;
        // Regular client for user operations (respects RLS)
        this.client = createClient(config.url, config.anonKey, {
            auth: {
                persistSession: false, // Stateless for Cloudflare Workers
                autoRefreshToken: false
            },
            db: {
                schema: 'public'
            },
            global: {
                headers: {
                    'x-business-id': businessId
                }
            }
        });
        // Service role client for admin operations (bypasses RLS when needed)
        this.serviceClient = createClient(config.url, config.serviceRoleKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            },
            db: {
                schema: 'public'
            },
            global: {
                headers: {
                    'x-business-id': businessId
                }
            }
        });
    }
    /**
     * Get the regular client (respects RLS)
     */
    get supabase() {
        return this.client;
    }
    /**
     * Get the service role client (bypasses RLS)
     * CRITICAL: Use with extreme caution - only for admin operations
     */
    get adminClient() {
        return this.serviceClient;
    }
    /**
     * Execute a vector similarity search using pgvector
     * PATTERN: Optimized for conversation and knowledge search
     */
    async vectorSearch({ table, column = 'embeddings', queryEmbedding, threshold = 0.7, limit = 10, filters = {} }) {
        try {
            let query = this.client
                .from(table)
                .select('*')
                .gte(`${column}_similarity`, threshold)
                .order(`${column}_similarity`, { ascending: false })
                .limit(limit);
            // Apply business_id filter for tenant isolation
            query = query.eq('business_id', this.businessId);
            // Apply additional filters
            Object.entries(filters).forEach(([key, value]) => {
                query = query.eq(key, value);
            });
            const { data, error } = await query;
            if (error) {
                throw new Error(`Vector search failed: ${error.message}`);
            }
            return data || [];
        }
        catch (error) {
            console.error('Vector search error:', error);
            throw error;
        }
    }
    /**
     * Generate embeddings using Supabase AI functions
     * PATTERN: Batch processing for efficiency
     */
    async generateEmbeddings(texts) {
        try {
            const { data, error } = await this.serviceClient.functions.invoke('generate-embeddings', {
                body: { texts }
            });
            if (error) {
                throw new Error(`Embedding generation failed: ${error.message}`);
            }
            return data.embeddings;
        }
        catch (error) {
            console.error('Embedding generation error:', error);
            throw error;
        }
    }
    /**
     * Health check for database connectivity
     */
    async healthCheck() {
        try {
            const { data, error } = await this.client
                .from('businesses')
                .select('id')
                .eq('id', this.businessId)
                .limit(1);
            return !error && data !== null;
        }
        catch {
            return false;
        }
    }
    /**
     * Get database statistics for monitoring
     */
    async getStats() {
        try {
            // Check table accessibility
            const tables = ['businesses', 'assistants', 'conversations', 'messages', 'knowledge_nodes'];
            const accessibleTables = [];
            for (const table of tables) {
                try {
                    const { error } = await this.client.from(table).select('id').limit(1);
                    if (!error) {
                        accessibleTables.push(table);
                    }
                }
                catch {
                    // Table not accessible
                }
            }
            // Check vector indexes (simplified)
            const vectorIndexes = ['conversations_embeddings_idx', 'messages_embeddings_idx', 'knowledge_embeddings_idx'];
            return {
                connectionStatus: accessibleTables.length > 0 ? 'healthy' : 'error',
                businessId: this.businessId,
                tablesAccessible: accessibleTables,
                vectorIndexes
            };
        }
        catch (error) {
            return {
                connectionStatus: 'error',
                businessId: this.businessId,
                tablesAccessible: [],
                vectorIndexes: []
            };
        }
    }
}
/**
 * Factory function to create tenant-aware Supabase client
 * PATTERN: Follows singleton pattern from existing codebase
 */
export function getSupabase(config, businessId) {
    return new TenantAwareSupabase(config, businessId);
}
/**
 * Legacy function for backward compatibility
 * @deprecated Use TenantAwareSupabase instead
 */
export const getSupabaseClient = (supabaseUrl, supabaseKey) => {
    return createClient(supabaseUrl, supabaseKey);
};
/**
 * Get current business ID from request context
 * CRITICAL: Must be implemented based on authentication system
 */
export const getCurrentBusinessId = (headers) => {
    // Extract from headers (set by authentication middleware)
    const businessId = headers?.['x-business-id'];
    if (!businessId) {
        throw new Error('Business ID not found in request context');
    }
    return businessId;
};
