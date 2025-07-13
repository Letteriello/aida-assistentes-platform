
import { PoolClient } from 'pg';

// This function sets the current business ID for the database session.
// This is a critical part of the multi-tenant security model.
export const setCurrentBusinessId = async (client: PoolClient, businessId: string) => {
  await client.query(`SET app.current_business_id = '${businessId}'`);
};

// Basic SQL injection protection. In a real application, you should use
// parameterized queries, but this provides a basic level of protection.
export const validateSqlQuery = (sql: string): { isValid: boolean; error?: string } => {
  const trimmedSql = sql.trim().toLowerCase();

  if (!trimmedSql) {
    return { isValid: false, error: 'SQL query cannot be empty' };
  }

  const dangerousPatterns = [
    /;\s*drop\s+/i,
    /^drop\s+/i,
    /;\s*delete\s+.*\s+where\s+1\s*=\s*1/i,
    /;\s*update\s+.*\s+set\s+.*\s+where\s+1\s*=\s*1/i,
    /;\s*truncate\s+/i,
    /^truncate\s+/i,
    /;\s*alter\s+/i,
    /^alter\s+/i,
    /;\s*create\s+/i,
    /;\s*grant\s+/i,
    /;\s*revoke\s+/i,
    /xp_cmdshell/i,
    /sp_executesql/i
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(sql)) {
      return { isValid: false, error: 'Query contains potentially dangerous SQL patterns' };
    }
  }

  return { isValid: true };
};

export const isWriteOperation = (sql: string): boolean => {
  const trimmedSql = sql.trim().toLowerCase();
  const writeKeywords = [
    'insert',
    'update',
    'delete',
    'create',
    'drop',
    'alter',
    'truncate',
    'grant',
    'revoke',
    'commit',
    'rollback'
  ];

  return writeKeywords.some((keyword) => trimmedSql.startsWith(keyword));
};

export const formatDatabaseError = (error: unknown): string => {
  if (error instanceof Error) {
    if (error.message.includes('password')) {
      return 'Database authentication failed. Please check your credentials.';
    }
    if (error.message.includes('timeout')) {
      return 'Database connection timed out. Please try again.';
    }
    if (error.message.includes('connection') || error.message.includes('connect')) {
      return 'Unable to connect to database. Please check your connection string.';
    }
    return `Database error: ${error.message}`;
  }
  return 'An unknown database error occurred.';
};

// Missing export that is imported in other files (fixing TS2305 errors)
export interface SecurityEvent {
  event_type: string
  details: Record<string, any>
  business_id: string
  timestamp?: Date
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

export function logSecurityEvent(
  eventType: string,
  details: Record<string, any>,
  businessId: string
): void {
  // Simple implementation for compatibility - logs to console
  // In production, this would send to security monitoring system
  console.warn(`[SECURITY] ${eventType}:`, { 
    details, 
    businessId, 
    timestamp: new Date().toISOString() 
  });
}

// Missing exports that are imported in other files (fixing TS2305 errors)
export function sanitizeInput(input: string): string {
  // Basic input sanitization - in production this would be more comprehensive
  return input
    .replace(/[<>"'&]/g, '') // Remove basic HTML/JS injection chars
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim();
}

export function validateInput(
  input: string, 
  options: {
    minLength?: number;
    maxLength?: number;
    allowEmpty?: boolean;
    pattern?: RegExp;
  } = {}
): { isValid: boolean; error?: string } {
  const { minLength = 0, maxLength = 1000, allowEmpty = false, pattern } = options;
  
  if (!allowEmpty && (!input || input.trim().length === 0)) {
    return { isValid: false, error: 'Input cannot be empty' };
  }
  
  if (input.length < minLength) {
    return { isValid: false, error: `Input must be at least ${minLength} characters` };
  }
  
  if (input.length > maxLength) {
    return { isValid: false, error: `Input must not exceed ${maxLength} characters` };
  }
  
  if (pattern && !pattern.test(input)) {
    return { isValid: false, error: 'Input format is invalid' };
  }
  
  return { isValid: true };
}
