/**
 * AIDA Platform - Database Types
 * Unified types for Supabase database schema with multi-tenant architecture
 * CRITICAL: Must be consistent with shared/types/database.ts
 */
// Re-export from shared types for consistency
// Legacy compatibility - keep this file for now but delegate to shared types
// Helper type for JSON columns (backward compatibility)
export type * from '@shared/types/database';
import type { Database as SharedDatabase } from '@shared/types/database';
export interface Database extends SharedDatabase {}
export type Json = | string;
  | number
  | boolean
  | null
  | {
      [key: string]: Json | undefined;
  | Json[];
