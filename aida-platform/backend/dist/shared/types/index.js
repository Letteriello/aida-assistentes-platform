/**
 * AIDA Platform - Shared Type Definitions
 * CRITICAL: Core types used across frontend and backend
 * PATTERN: Centralized type definitions for consistency
 */
// Re-export database types
export * from './database';
// Constants
export const SUBSCRIPTION_LIMITS = {
    free: {
        max_assistants: 1,
        max_conversations_per_month: 100,
        max_knowledge_nodes: 50,
        max_users: 1,
        api_rate_limit: 100,
        storage_limit_gb: 1
    },
    pro: {
        max_assistants: 5,
        max_conversations_per_month: 1000,
        max_knowledge_nodes: 500,
        max_users: 5,
        api_rate_limit: 1000,
        storage_limit_gb: 10
    },
    enterprise: {
        max_assistants: 50,
        max_conversations_per_month: 10000,
        max_knowledge_nodes: 5000,
        max_users: 50,
        api_rate_limit: 10000,
        storage_limit_gb: 100
    }
};
export const MESSAGE_TYPES = ['text', 'media', 'location', 'document', 'audio'];
export const CONVERSATION_STATUSES = ['active', 'resolved', 'escalated', 'archived'];
export const INSTANCE_STATUSES = ['creating', 'connecting', 'connected', 'disconnected', 'error'];
export const USER_ROLES = ['owner', 'admin', 'manager', 'agent'];
export const SUBSCRIPTION_PLANS = ['free', 'pro', 'enterprise'];
