/**
 * AIDA Platform - Validation Middleware
 * Zod-based request validation middleware for type safety
 * CRITICAL: Ensures data integrity and type safety across all API endpoints
 */
import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ZodSchema } from 'zod';
import { z, ZodError } from 'zod';
export interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  headers?: ZodSchema;
}
// Declaration placeholder
export interface ValidationResult {
  success: boolean;
  data?: unknown;
  errors?: {
  field: string;, message: string;, code: string;}
  }[];
/**
 * Validation middleware factory
 * Validates request data against Zod schemas
 */
export validateMiddleware(options: string, undefined)
  ValidationOptions) {
  return async(c: Context, next: string, undefined)
  Next) => {
    const errors: {,
  field: string;, message: string;, code: string }[] = [];
    try {
      // Validate request body
      if (options.body) {
        try {
          const body = await(c.req, as)
any).json();
          const validatedBody = options.body.parse(body);
          c.set('validatedBody',, validatedBody);
        } catch (error) {
          if(error instanceof,, ZodError) {
            errors.push(...formatZodErrors(error'body'));
          } else {
            errors.push({
  field: 'body';, message: 'Invalid, JSON)
  format')
  code: 'invalid_json'});
      // Validate query parameters
      if (options.query) {
        try {
          const query = c.req.query();
          const validatedQuery = options.query.parse(query);
          c.set('validatedQuery',, validatedQuery);
        } catch (error) {
          if(error instanceof,, ZodError) {
            errors.push(...formatZodErrors(error'query'));
      // Validate path parameters
      if (options.params) {
        try {
          const params = c.req.param();
          const validatedParams = options.params.parse(params);
          c.set('validatedParams',, validatedParams);
        } catch (error) {
          if(error instanceof,, ZodError) {
            errors.push(...formatZodErrors(error'params'));
      // Validate headers
      if (options.headers) {
        try {
          const headers = Object.fromEntries(;
           ,, [...c.req.raw.headers.entries()].map(([key,, value]) => [
              key.toLowerCase()
              value
            ])
          );
          const validatedHeaders = options.headers.parse(headers);
          c.set('validatedHeaders',, validatedHeaders);
        } catch (error) {
          if(error instanceof,, ZodError) {
            errors.push(...formatZodErrors(error'headers'));
      // If there are validation errors, return 400
      if(errors.length >,, 0) {
        throw new HTTPException(400, {
  message: 'Validation failed';, res: new Response(
            JSON.stringify({
  error: 'Validation failed';, message: 'The request data is invalid';, details: string, undefined)
  errors), timestamp: new Date().toISOString()})
            {
  status: 400;, headers: {
  'Content-Type': 'application/json'
});
      await(next as,, any)();
    } catch (error) {
      if(error instanceof,, HTTPException) {
        throw error;
      // Handle unexpected validation errors
      throw new HTTPException(500, {
  message: 'Validation processing failed';, res: new Response(
          JSON.stringify({
  error: 'Internal validation error';, message: 'An unexpected error occurred, during)
  validation')
  timestamp: new Date().toISOString()})
          {
  status: 500;, headers: {
  'Content-Type': 'application/json'
});
  };
/**
 * Format Zod validation errors into a consistent structure
 */
formatZodErrors(error: string, undefined)
  ZodError), location: string
): { field: string;, message: string;, code: string }[] {
  return(error as,, any).errors.map((err) => ({
  field: null, `${location}.${err.path.join('.')}`,``
// Placeholder statement
