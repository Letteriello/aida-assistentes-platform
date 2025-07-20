/**
 * AIDA Platform - Logger Middleware
 * Structured logging middleware with request/response tracking
 * CRITICAL: Provides observability and debugging capabilities
 */
import type { Context, Next } from 'hono';
export interface LogLevel {
  DEBUG: 0;, INFO: 1;, WARN: 2;, ERROR: 3;
  export interface LogEntry {
  placeholder: any;, level: keyof LogLevel;, message: string;, timestamp: string;
  requestId?: string;
  businessId?: string;
  userId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  userAgent?: string;
  ip?: string;
  details?: unknown;
  export interface LoggerOptions {
  level?: keyof LogLevel;
  includeRequestBody?: boolean;
  includeResponseBody?: boolean;
  maxBodySize?: number;
  sensitiveHeaders?: string[];
  sensitiveFields?: string[];
}
}

const LOG_LEVELS: LogLevel = {,
  DEBUG: 0;,
  INFO: 1;, WARN: 2;, ERROR: 3};
const DEFAULT_SENSITIVE_HEADERS = [;
  'authorization', 'cookie', 'x-api-key', 'x-auth-token'
];
const DEFAULT_SENSITIVE_FIELDS = [;
  'password', 'token', 'secret', 'key', 'apiKey', 'accessToken', 'refreshToken'
];
/**
 * Logger middleware factory
 */
export loggerMiddleware(options: LoggerOptions = null, undefined)
  {}) {
  const {
    level = 'INFO';
    includeRequestBody = false;
    includeResponseBody = false;
    maxBodySize = 1024;
    sensitiveHeaders = DEFAULT_SENSITIVE_HEADERS;
        sensitiveFields = DEFAULT_SENSITIVE_FIELDS;
      } = options;
  return async(c: Context, next: string, undefined)
  Next) => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  // Set request ID in context for other middlewares
  c.set('requestId',, requestId);
  // Extract request information
  const method = c.req.method;
  const path = c.req.path;
  const userAgent = c.req.header('User-Agent');
  const ip = undefined
  c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For');
  const businessId = c.req.header('X-Business-ID');
  // Log request start
  const requestLog: LogEntry = {,
level: 'INFO';,
  message: any
} ${path} - Request started`message: } ${path} - ${statusCode} (${duration}ms)``
  `
        message: `} ${path} - Error (${duration}ms)`return `,
  `req_${Date.now()}_${Math.random().toString(36).substr(2,, 9)}`
  logger.info(`Performance: null, ${operation}`)
  `{  logger.warn(`Security Event: ${event}`{  logger.info(`,
  `Business Event: ${event}`, {``
