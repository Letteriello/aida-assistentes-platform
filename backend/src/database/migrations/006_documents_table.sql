-- AIDA Platform - Documents Table
-- Stores uploaded documents for RAG processing
-- Migration: 006_documents_table.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Documents table for storing uploaded files
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    assistant_id UUID REFERENCES assistants(id) ON DELETE CASCADE,
    
    -- File metadata
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('pdf', 'txt', 'docx', 'md')),
    file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes > 0),
    mime_type VARCHAR(100) NOT NULL,
    
    -- Storage information
    r2_key VARCHAR(500) NOT NULL UNIQUE, -- R2 Storage key
    r2_bucket VARCHAR(100) NOT NULL DEFAULT 'aida-platform-media',
    
    -- Processing status
    processing_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (
        processing_status IN ('pending', 'processing', 'completed', 'failed', 'deleted')
    ),
    processing_error TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Content metadata
    content_preview TEXT, -- First 500 chars for preview
    total_chunks INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    
    -- Embeddings and search
    content_embeddings vector(1536), -- Document-level embedding
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID, -- User who uploaded
    
    -- Constraints
    CONSTRAINT valid_file_size CHECK (file_size_bytes <= 50 * 1024 * 1024), -- 50MB max
    CONSTRAINT valid_filename CHECK (LENGTH(filename) > 0),
    CONSTRAINT valid_original_filename CHECK (LENGTH(original_filename) > 0)
);

-- Document chunks table for storing processed text chunks
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Chunk metadata
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_tokens INTEGER NOT NULL,
    
    -- Context information
    page_number INTEGER,
    section_title TEXT,
    
    -- Embeddings
    embeddings vector(1536) NOT NULL,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_chunk_index CHECK (chunk_index >= 0),
    CONSTRAINT valid_chunk_text CHECK (LENGTH(chunk_text) > 0),
    CONSTRAINT valid_chunk_tokens CHECK (chunk_tokens > 0),
    CONSTRAINT unique_document_chunk UNIQUE (document_id, chunk_index)
);

-- Indexes for performance
CREATE INDEX idx_documents_business_id ON documents(business_id);
CREATE INDEX idx_documents_assistant_id ON documents(assistant_id);
CREATE INDEX idx_documents_processing_status ON documents(processing_status);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_file_type ON documents(file_type);

CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_business_id ON document_chunks(business_id);
CREATE INDEX idx_document_chunks_chunk_index ON document_chunks(document_id, chunk_index);

-- Vector similarity search indexes
CREATE INDEX idx_documents_embeddings ON documents USING ivfflat (content_embeddings vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_document_chunks_embeddings ON document_chunks USING ivfflat (embeddings vector_cosine_ops) WITH (lists = 100);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents
CREATE POLICY "Users can view own business documents" ON documents
    FOR SELECT USING (business_id IN (
        SELECT business_id FROM user_businesses 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert documents to own business" ON documents
    FOR INSERT WITH CHECK (business_id IN (
        SELECT business_id FROM user_businesses 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update own business documents" ON documents
    FOR UPDATE USING (business_id IN (
        SELECT business_id FROM user_businesses 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete own business documents" ON documents
    FOR DELETE USING (business_id IN (
        SELECT business_id FROM user_businesses 
        WHERE user_id = auth.uid()
    ));

-- RLS Policies for document_chunks
CREATE POLICY "Users can view own business document chunks" ON document_chunks
    FOR SELECT USING (business_id IN (
        SELECT business_id FROM user_businesses 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert document chunks to own business" ON document_chunks
    FOR INSERT WITH CHECK (business_id IN (
        SELECT business_id FROM user_businesses 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update own business document chunks" ON document_chunks
    FOR UPDATE USING (business_id IN (
        SELECT business_id FROM user_businesses 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete own business document chunks" ON document_chunks
    FOR DELETE USING (business_id IN (
        SELECT business_id FROM user_businesses 
        WHERE user_id = auth.uid()
    ));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_documents_updated_at_trigger
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_updated_at();

-- Function to enforce document limit per business (10 documents)
CREATE OR REPLACE FUNCTION check_document_limit()
RETURNS TRIGGER AS $$
DECLARE
    doc_count INTEGER;
    max_docs INTEGER := 10; -- Base plan limit
BEGIN
    -- Count existing documents for this business (excluding deleted)
    SELECT COUNT(*) INTO doc_count
    FROM documents
    WHERE business_id = NEW.business_id
    AND processing_status != 'deleted';
    
    -- Check if limit would be exceeded
    IF doc_count >= max_docs THEN
        RAISE EXCEPTION 'Document limit exceeded. Maximum % documents allowed per business.', max_docs;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce document limit on insert
CREATE TRIGGER enforce_document_limit_trigger
    BEFORE INSERT ON documents
    FOR EACH ROW
    EXECUTE FUNCTION check_document_limit();

-- Function for document vector search with business isolation
CREATE OR REPLACE FUNCTION documents_vector_search(
    p_business_id UUID,
    p_query_embedding vector(1536),
    p_similarity_threshold FLOAT DEFAULT 0.7,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    document_id UUID,
    filename VARCHAR(255),
    content_preview TEXT,
    similarity FLOAT,
    processing_status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.filename,
        d.content_preview,
        (d.content_embeddings <=> p_query_embedding)::FLOAT as similarity,
        d.processing_status,
        d.created_at
    FROM documents d
    WHERE d.business_id = p_business_id
    AND d.processing_status = 'completed'
    AND d.content_embeddings IS NOT NULL
    AND (d.content_embeddings <=> p_query_embedding) < (1 - p_similarity_threshold)
    ORDER BY d.content_embeddings <=> p_query_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for document chunks vector search with business isolation
CREATE OR REPLACE FUNCTION document_chunks_vector_search(
    p_business_id UUID,
    p_query_embedding vector(1536),
    p_similarity_threshold FLOAT DEFAULT 0.7,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    chunk_id UUID,
    document_id UUID,
    filename VARCHAR(255),
    chunk_text TEXT,
    chunk_index INTEGER,
    page_number INTEGER,
    section_title TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id,
        dc.document_id,
        d.filename,
        dc.chunk_text,
        dc.chunk_index,
        dc.page_number,
        dc.section_title,
        (dc.embeddings <=> p_query_embedding)::FLOAT as similarity
    FROM document_chunks dc
    JOIN documents d ON dc.document_id = d.id
    WHERE dc.business_id = p_business_id
    AND d.processing_status = 'completed'
    AND (dc.embeddings <=> p_query_embedding) < (1 - p_similarity_threshold)
    ORDER BY dc.embeddings <=> p_query_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON documents TO authenticated;
GRANT ALL ON document_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION documents_vector_search TO authenticated;
GRANT EXECUTE ON FUNCTION document_chunks_vector_search TO authenticated;