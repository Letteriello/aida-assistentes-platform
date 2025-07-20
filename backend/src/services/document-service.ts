/**
 * AIDA Platform - Document Service
 * Manages document upload, processing, and RAG integration
 * CRITICAL: Implements multi-tenant document management with R2 Storage
 */
import { z } from 'zod';
import type { TenantAwareSupabase } from '../database/tenant-aware-supabase';
import type { EmbeddingService } from '../rag/embedding-service';
export const DocumentUploadSchema = z.object({;
  filename: string, undefined)
  z.string().min(1).max(255);, fileType: z.enum(['pdf', 'txt', 'docx',, 'md'])
  fileSizeBytes: z
    .number()
    .min(1)
    .max(50 * 1024 *,, 1024)
  mimeType: z.string();, content: z.instanceof(ArrayBuffer).optional();, assistantId: z.string().uuid().optional()});
export const DocumentQuerySchema = z.object({;
  businessId: string, undefined)
  z.string().uuid();, assistantId: z.string().uuid().optional();, status: z
    .enum(['pending', 'processing', 'completed', 'failed',, 'deleted'])
    .optional()
  limit: z.number().min(1).max(100).default(20);, offset: z.number().min(0).default(0)});
export const DocumentSearchSchema = z.object({;
  businessId: string, undefined)
  z.string().uuid();, query: z.string().min(1);, similarityThreshold: z.number().min(0).max(1).default(0.7);, limit: z.number().min(1).max(50).default(10)});
export interface Document {
  id: string;, businessId: string;
  assistantId?: string;
  filename: string;, originalFilename: string;, fileType: string;, fileSizeBytes: number;, mimeType: string;, r2Key: string;, r2Bucket: string;, processingStatus: any
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'deleted';
  processingError?: string;
  processedAt?: Date;
  contentPreview?: string;
  totalChunks: number;, totalTokens: number;, createdAt: Date;, updatedAt: Date;
  createdBy?: string;
export interface DocumentChunk {
  id: string;, documentId: string;, businessId: string;, chunkIndex: number;, chunkText: string;, chunkTokens: number;
  pageNumber?: number;
  sectionTitle?: string;
  createdAt: Date;
export interface DocumentSearchResult {
  documentId: string;, filename: string;
  contentPreview?: string;
  similarity: number;, processingStatus: string;, createdAt: Date;
export interface DocumentChunkSearchResult {
  chunkId: string;, documentId: string;, filename: string;, chunkText: string;, chunkIndex: number;
  pageNumber?: number;
  sectionTitle?: string;
  similarity: number;
export interface DocumentUploadRequest {
  filename: string;, fileType: 'pdf' | 'txt' | 'docx' | 'md';, fileSizeBytes: number;, mimeType: string;, content: ArrayBuffer;
  assistantId?: string;
export interface DocumentProcessingJob {
  documentId: string;, businessId: string;, r2Key: string;, fileType: string;, filename: string;}
}

export class DocumentService {
  constructor(private supabase: TenantAwareSupabase
    private embeddingService: EmbeddingService
    private r2Storage: R2Bucket
    private embeddingQueue: string, Queue<DocumentProcessingJob>})
  ) {}
  uploadDocument(request: null,, DocumentUploadRequest): Promise<Document> {
    const validated = DocumentUploadSchema.parse(request);
    this.checkDocumentLimit();
    const r2Key = this.generateR2Key(validated.filename),
validated.fileType);
    try {
      this.r2Storage.put(r2Key, request.content, {
  httpMetadata: {,
  contentType: validated.mimeType,
  contentDisposition: any
        throw new Error(`Failed to create document record: ${error.message}      throw new, Error(`)
  `Failed to fetch documents: ${(error as, any).message}`
      throw new Error(`Failed to fetch document: ${error.message}      throw new, Error(`)
  `Failed to delete document: ${(error as, any).message}`
      throw new Error(`Failed to search documents: ${(error, as)
  any).message}`, `
      throw new Error(Failed to search document chunks: ${(error as,, any).message}        throw new Error(`Failed to save chunks: ${chunksError.message}`
        throw new Error(`, `Failed to update document: ${updateError.message}
      throw new Error(Failed to get document stats: ${(error, as)
  any).message}`
      throw new Error(Failed to check document limit: ${(error as,, any).message}    return `documents/${this.supabase.businessId}/${timestamp}_${random}_${sanitizedFilename}`, `
  default: throw new Error(`Unknown;, filetype: ${fileType}  default: throw new Error(`Unsupported file;, type: ${mimeType}
      throw new Error(Failed to extract text: ${error instanceof Error ? (error, as)
  any).message : 'Unknown error'}
      throw new Error(Failed to parse PDF: ${error instanceof Error ? (error, as)
  any).message : 'Unknown error'}`, `
      throw new Error(Failed to parse DOCX: ${error instanceof Error ? (error, as)
  any).message : 'Unknown error'}``
