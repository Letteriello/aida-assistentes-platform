/**
 * AIDA Platform - Documents API
 * RESTful API for document upload, management, and search
 * CRITICAL: Multi-tenant document management with R2 Storage integration
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';
import type { Context } from 'hono';
import {
  DocumentQuerySchema,
  DocumentSearchSchema,
  DocumentService,
  DocumentUploadSchema
} from '../services/document-service';
import { createTenantAwareSupabase } from '../database/tenant-aware-supabase';
import {
  EmbeddingService,
  createEmbeddingService,
  getDefaultEmbeddingConfig
} from '../rag/embedding-service';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rate-limit';
import { validateMiddleware } from '../middleware/validation';
import { errorHandler } from '../middleware/error-handler';
import { loggerMiddleware } from '../middleware/logger';

// CloudflareEnv interface
interface CloudflareEnv {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  OPENAI_API_KEY: string;
  MEDIA_BUCKET: unknown; // R2Bucket type
  EMBEDDING_QUEUE: unknown; // Queue type
}

// Extended Context type with businessId
type DocumentContext = {
  Bindings: CloudflareEnv;
  Variables: {
    businessId: string;
  };
};

// Request schemas
const DocumentUploadRequestSchema = z.object({
  filename: z.string().min(1).max(255),
  fileType: z.string(),
  assistantId: z.string().uuid().optional()
});

const DocumentSearchRequestSchema = z.object({
  query: z.string().min(1),
  similarityThreshold: z.number().min(0).max(1).default(0.7),
  searchType: z.enum(['documents', 'chunks']).default('chunks')
});

const DocumentListRequestSchema = z.object({
  assistantId: z.string().uuid().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0)
});

// Response interfaces
interface DocumentUploadResponse {
  success: boolean;
  document: {
    id: string;
    filename: string;
    fileType: string;
    fileSizeBytes: number;
    processingStatus: string;
    createdAt: string;
  };
  message: string;
}

interface DocumentListResponse {
  success: boolean;
  documents: Array<{
    id: string;
    filename: string;
    fileType: string;
    fileSizeBytes: number;
    processingStatus: string;
    processingError?: string;
    contentPreview?: string;
    totalChunks?: number;
    totalTokens?: number;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Documents API Router
 */
export function createDocumentsAPI(env: CloudflareEnv): Hono<{ Bindings: CloudflareEnv; Variables: { businessId: string } }> {
  const app = new Hono<DocumentContext>();

  // Middleware
  app.use('*', authMiddleware);
  app.use('*', rateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // 100 requests per window
  }));
  app.use('*', loggerMiddleware);
  app.use('*', errorHandler);

  /**
   * POST /documents/upload
   * Upload a new document
   */
  app.post('/upload',
    validateMiddleware({
      body: DocumentUploadRequestSchema
    }),
    async (c) => {
      try {
        const businessId = c.get('businessId') as string;
        const body = await c.req.json();
        const file = await c.req.blob();

        // Validate file size (50MB max)
        if (!file || file.size === 0) {
          return c.json({
            success: false,
            error: 'No file provided'
          }, 400);
        }

        if (file.size > 50 * 1024 * 1024) {
          return c.json({
            success: false,
            error: 'File size exceeds 50MB limit'
          }, 400);
        }

        // Validate file type
        const allowedTypes = [
          'application/pdf',
          'text/plain',
          'text/markdown',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!allowedTypes.includes(file.type)) {
          return c.json({
            success: false,
            error: 'Unsupported file type. Allowed: PDF, TXT, MD, DOCX'
          }, 400);
        }

        // Create services
        const supabase = createTenantAwareSupabase({
          url: env.SUPABASE_URL,
          anonKey: env.SUPABASE_ANON_KEY,
          serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY
        }, businessId);

        const embeddingConfig = getDefaultEmbeddingConfig('openai');
        (embeddingConfig as any).apiKey = env.OPENAI_API_KEY;
        const embeddingService = createEmbeddingService(embeddingConfig, supabase, env as unknown);

        const documentService = new DocumentService(
          supabase,
          embeddingService,
          env.MEDIA_BUCKET,
          env.EMBEDDING_QUEUE
        );

        // Upload document
        const document = await documentService.uploadDocument({
          filename: body.filename,
          fileType: body.fileType,
          fileSizeBytes: file.size,
          mimeType: file.type,
          content: await file.arrayBuffer(),
          assistantId: body.assistantId
        });

        const response: DocumentUploadResponse = {
          success: true,
          document: {
            id: document.id,
            filename: document.filename,
            fileType: document.fileType,
            fileSizeBytes: document.fileSizeBytes,
            processingStatus: document.processingStatus,
            createdAt: document.createdAt.toISOString()
          },
          message: 'Document uploaded successfully and queued for processing'
        };

        return c.json(response, 201);
      } catch (error) {
        console.error('Document upload error:', error);

        if (error instanceof Error && (error as any).message.includes('limit exceeded')) {
          return c.json({
            success: false,
            error: 'Document limit exceeded. Maximum 10 documents allowed.'
          }, 400);
        }

        return c.json({
          success: false,
          error: 'Failed to upload document'
        }, 500);
      }
    }
  );

  return app;
}

export default createDocumentsAPI;
