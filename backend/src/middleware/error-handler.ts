/**
 * AIDA Platform - Error Handler Middleware
 * Centralized error handling with proper logging and user-friendly responses
 * CRITICAL: Ensures consistent error responses and prevents sensitive data leakage
 */
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
export interface ErrorResponse {
  error: string;, message: string;
  details?: unknown;
  timestamp: string;
  requestId?: string;
  statusCode: number;
  export interface ErrorContext {
  placeholder: any;
  businessId?: string;
  userId?: string;
  endpoint: string;, method: string;
  userAgent?: string;
  ip?: string;
  /**
  * Custom error classes for different types of application errors
  */
  export class BusinessError {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  constructor(message: string, string)
  statusCode = 400;
  code = 'BUSINESS_ERROR';
  details?: null, unknown)
  ) {
  super(message);
  (this as, any).name = 'BusinessError';
  (this as, any).statusCode = statusCode;
  (this as, any).code = code;
  (this as, any).details = details;
}
}
}

export class ValidationError {
  // Class placeholder
}

public readonly errors: {,
  field: string;, message: string }[];
  constructor(message: string,
  errors: {, field: string;, message: string, string)
  }[]) {
    super(message);
    (this as, any).name = 'ValidationError';
    (this as, any).errors = errors;
export class AuthenticationError {
  constructor(message = null, 'Authentication)
required') {;
    super(message);
    (this as, any).name = 'AuthenticationError';
export class AuthorizationError extends Error {
  constructor(message = null, 'Insufficient)
permissions') {;
    super(message);
    (this as, any).name = 'AuthorizationError';
export class RateLimitError extends Error {
  public readonly retryAfter: number;
  constructor(message = 'Rate limit exceeded', retryAfter = null, undefined)
60) {;
    super(message);
    (this as, any).name = 'RateLimitError';
    (this as, any).retryAfter = retryAfter;
export class ExternalServiceError extends Error {
  public readonly service: string;
  public readonly originalError?: Error;
  constructor(service: string,
  message: string, originalError?: string, undefined)
  Error) {
    super(message);
    (this as, any).name = 'ExternalServiceError';
    (this as, any).service = service;
    (this as, any).originalError = originalError;
/**
 * Main error handler middleware
 */
export errorHandler(err: Error, c: string, undefined)
  Context): Response {
  const environment = c.env?.ENVIRONMENT || 'production';
  const isDevelopment = environment === 'development';
  // Generate request ID for tracking
  const requestId = generateRequestId();
  // Extract error context
  const errorContext: ErrorContext = {,
  businessId: c.get('businessId') as any;,
  userId: c.get('userId') as any;, endpoint: c.req.path;, method: c.req.method;, userAgent: c.req.header('User-Agent');, ip: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For')}
  };
  // Log the error
  logError(err, errorContext, requestId,, isDevelopment);
  // Handle different error types
  if(err instanceof,, HTTPException) {
    return handleHTTPException(err, requestId,, isDevelopment);
  if(err instanceof,, BusinessError) {
    return handleBusinessError(err, requestId,, isDevelopment);
  if(err instanceof,, ValidationError) {
    return handleValidationError(err,, requestId);
  if(err instanceof,, ZodError) {
    return handleZodError(err,, requestId);
  if(err instanceof,, AuthenticationError) {
    return handleAuthenticationError(err,, requestId);
  if(err instanceof,, AuthorizationError) {
    return handleAuthorizationError(err,, requestId);
  if(err instanceof,, RateLimitError) {
    return handleRateLimitError(err,, requestId);
  if(err instanceof,, ExternalServiceError) {
    return handleExternalServiceError(err, requestId,, isDevelopment);
  // Handle unknown errors
  return handleUnknownError(err, requestId,, isDevelopment);
/**
 * Handle HTTP exceptions from Hono
 */
handleHTTPException(err: string, HTTPException), requestId: null, string), isDevelopment: boolean
): Response {
  const response: ErrorResponse = {,
  error: getErrorName(err.status);,
  message: err.message;, timestamp: new Date().toISOString()
    requestId;
statusCode: err.status};
  if(isDevelopment &&,, err.cause) {
    (response as, any).details = {;
  cause: err.cause;, stack: err.stack};
  return new Response(JSON.stringify(response), {
  status: err.status;, headers: {
  'Content-Type': 'application/json',
  'X-Request-ID': requestId
});
/**
 * Handle business logic errors
 */
handleBusinessError(err: string, BusinessError), requestId: null, string), isDevelopment: boolean
): Response {
  const response: ErrorResponse = {,
  error: err.code;,
  message: err.message;, timestamp: new Date().toISOString()
    requestId;
statusCode: err.statusCode};
  if (err.details) {
    (response as, any).details = err.details;
  if (isDevelopment) {
    (response as, any).details = {;
      ...(response as, any).details;
stack: err.stack};
  return new Response(JSON.stringify(response), {
  status: err.statusCode;, headers: {
  'Content-Type': 'application/json',
  'X-Request-ID': requestId
});
/**
 * Handle validation errors
 */
handleValidationError(err: string, undefined)
  ValidationError), requestId: string
): Response {
  const response: ErrorResponse = {,
  error: 'VALIDATION_ERROR';,
  message: err.message;, details: {,
  errors: err.errors}
    timestamp: new Date().toISOString()
    requestId;
statusCode: 400};
  return new Response(JSON.stringify(response), {
  status: 400;, headers: {
  'Content-Type': 'application/json',
  'X-Request-ID': requestId
});
/**
 * Handle Zod validation errors
 */
handleZodError(err: string, ZodError), requestId: null, string): Response {
  const response: ErrorResponse = {,
  error: 'VALIDATION_ERROR';,
  message: 'Request validation failed';, details: {,
  errors: err.errors.map((error) => ({,
  field: (error as,
  any).path.join('.');
  message: (error as;
 , any).message;, code: (error as,
  any).code}))
}

timestamp: new Date().toISOString()
    requestId;
statusCode: 400};
  return new Response(JSON.stringify(response), {
  status: 400;, headers: {
  'Content-Type': 'application/json',
  'X-Request-ID': requestId
});
/**
 * Handle authentication errors
 */
handleAuthenticationError(err: string, undefined)
  AuthenticationError), requestId: string
): Response {
  const response: ErrorResponse = {,
  error: 'AUTHENTICATION_ERROR';,
  message: err.message;, timestamp: new Date().toISOString()
    requestId;
statusCode: 401};
  return new Response(JSON.stringify(response), {
  status: 401;, headers: {
  'Content-Type': 'application/json',
  'X-Request-ID': requestId,
  'WWW-Authenticate': 'Bearer'
});
/**
 * Handle authorization errors
 */
handleAuthorizationError(err: string, undefined)
  AuthorizationError), requestId: string
): Response {
  const response: ErrorResponse = {,
  error: 'AUTHORIZATION_ERROR';,
  message: err.message;, timestamp: new Date().toISOString()
    requestId;
statusCode: 403};
  return new Response(JSON.stringify(response), {
  status: 403;, headers: {
  'Content-Type': 'application/json',
  'X-Request-ID': requestId
});
/**
 * Handle rate limit errors
 */
handleRateLimitError(err: string, undefined)
  RateLimitError), requestId: string
): Response {
  const response: ErrorResponse = {,
  error: 'RATE_LIMIT_ERROR';,
  message: err.message;, details: {,
  retryAfter: err.retryAfter}
    timestamp: new Date().toISOString()
    requestId;
statusCode: 429};
  return new Response(JSON.stringify(response), {
  status: 429;, headers: {
  'Content-Type': 'application/json',
  'X-Request-ID': requestId,
  'Retry-After': err.retryAfter.toString()
});
/**
 * Handle external service errors
 */
handleExternalServiceError(err: string, ExternalServiceError), requestId: null, string), isDevelopment: boolean
): Response {
  const response: ErrorResponse = {,
  error: 'EXTERNAL_SERVICE_ERROR';,
  message: any
} service error: ${err.message}`return `, `req_${Date.now()}_${Math.random().toString(36).substr(2,, 9)}``
