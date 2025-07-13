-- AIDA Platform - pgvector Search Functions
-- Vector similarity search and hybrid search functions for RAG system
-- CRITICAL: All functions must respect business_id for tenant isolation

-- Function to enable pgvector extension (called during initialization)
CREATE OR REPLACE FUNCTION enable_pgvector()
RETURNS void AS $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
    
    -- Verify extension was created successfully
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        RAISE EXCEPTION 'Failed to enable pgvector extension';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conversations vector search function
-- Searches conversation context_summary with tenant isolation
CREATE OR REPLACE FUNCTION conversations_vector_search(
    query_embedding vector(384),
    business_id UUID,
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    remote_jid TEXT,
    status conversation_status,
    priority conversation_priority,
    last_message_at TIMESTAMP WITH TIME ZONE,
    similarity float
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.context_summary as content,
        c.remote_jid,
        c.status,
        c.priority,
        c.last_message_at,
        1 - (c.embeddings <=> query_embedding) as similarity
    FROM conversations c
    JOIN assistants a ON c.assistant_id = a.id
    WHERE a.business_id = conversations_vector_search.business_id
        AND c.embeddings IS NOT NULL
        AND 1 - (c.embeddings <=> query_embedding) > match_threshold
    ORDER BY c.embeddings <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Messages vector search function
-- Searches message content with tenant isolation
CREATE OR REPLACE FUNCTION messages_vector_search(
    query_embedding vector(384),
    business_id UUID,
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    conversation_id UUID,
    sender_type message_sender_type,
    timestamp TIMESTAMP WITH TIME ZONE,
    similarity float
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.content,
        m.conversation_id,
        m.sender_type,
        m.timestamp,
        1 - (m.embeddings <=> query_embedding) as similarity
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    JOIN assistants a ON c.assistant_id = a.id
    WHERE a.business_id = messages_vector_search.business_id
        AND m.embeddings IS NOT NULL
        AND 1 - (m.embeddings <=> query_embedding) > match_threshold
    ORDER BY m.embeddings <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Knowledge nodes vector search function
-- Searches business knowledge with tenant isolation
CREATE OR REPLACE FUNCTION knowledge_nodes_vector_search(
    query_embedding vector(384),
    business_id UUID,
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    entity_name TEXT,
    entity_type knowledge_entity_type,
    properties JSONB,
    similarity float
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        kn.id,
        kn.content,
        kn.entity_name,
        kn.entity_type,
        kn.properties,
        1 - (kn.embeddings <=> query_embedding) as similarity
    FROM knowledge_nodes kn
    WHERE kn.business_id = knowledge_nodes_vector_search.business_id
        AND kn.is_active = true
        AND kn.embeddings IS NOT NULL
        AND 1 - (kn.embeddings <=> query_embedding) > match_threshold
    ORDER BY kn.embeddings <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conversations hybrid search function
-- Combines vector similarity with full-text search
CREATE OR REPLACE FUNCTION conversations_hybrid_search(
    search_query TEXT,
    query_embedding vector(384),
    business_id UUID,
    vector_weight float DEFAULT 0.6,
    text_weight float DEFAULT 0.4,
    match_threshold float DEFAULT 0.5,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    remote_jid TEXT,
    status conversation_status,
    combined_score float
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.context_summary as content,
        c.remote_jid,
        c.status,
        -- Combine vector similarity and text search scores
        (
            vector_weight * (1 - (c.embeddings <=> query_embedding)) +
            text_weight * (
                CASE 
                    WHEN c.context_summary ILIKE '%' || search_query || '%' THEN 1.0
                    ELSE ts_rank(to_tsvector('english', c.context_summary), plainto_tsquery('english', search_query))
                END
            )
        ) as combined_score
    FROM conversations c
    JOIN assistants a ON c.assistant_id = a.id
    WHERE a.business_id = conversations_hybrid_search.business_id
        AND c.embeddings IS NOT NULL
        AND (
            1 - (c.embeddings <=> query_embedding) > match_threshold * 0.7 OR
            c.context_summary ILIKE '%' || search_query || '%' OR
            to_tsvector('english', c.context_summary) @@ plainto_tsquery('english', search_query)
        )
    ORDER BY combined_score DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Knowledge nodes hybrid search function  
-- Combines vector similarity with full-text search for business knowledge
CREATE OR REPLACE FUNCTION knowledge_nodes_hybrid_search(
    search_query TEXT,
    query_embedding vector(384),
    business_id UUID,
    vector_weight float DEFAULT 0.6,
    text_weight float DEFAULT 0.4,
    match_threshold float DEFAULT 0.5,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    entity_name TEXT,
    entity_type knowledge_entity_type,
    combined_score float
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        kn.id,
        kn.content,
        kn.entity_name,
        kn.entity_type,
        -- Combine vector similarity and text search scores
        (
            vector_weight * (1 - (kn.embeddings <=> query_embedding)) +
            text_weight * (
                CASE 
                    WHEN kn.content ILIKE '%' || search_query || '%' OR kn.entity_name ILIKE '%' || search_query || '%' THEN 1.0
                    ELSE GREATEST(
                        ts_rank(to_tsvector('english', kn.content), plainto_tsquery('english', search_query)),
                        ts_rank(to_tsvector('english', kn.entity_name), plainto_tsquery('english', search_query))
                    )
                END
            )
        ) as combined_score
    FROM knowledge_nodes kn
    WHERE kn.business_id = knowledge_nodes_hybrid_search.business_id
        AND kn.is_active = true
        AND kn.embeddings IS NOT NULL
        AND (
            1 - (kn.embeddings <=> query_embedding) > match_threshold * 0.7 OR
            kn.content ILIKE '%' || search_query || '%' OR
            kn.entity_name ILIKE '%' || search_query || '%' OR
            to_tsvector('english', kn.content) @@ plainto_tsquery('english', search_query) OR
            to_tsvector('english', kn.entity_name) @@ plainto_tsquery('english', search_query)
        )
    ORDER BY combined_score DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate embeddings using AI (placeholder for external service)
-- This would typically call an external embedding service like OpenAI or Supabase AI
CREATE OR REPLACE FUNCTION generate_embedding(
    input_text TEXT,
    model_name TEXT DEFAULT 'gte-small'
)
RETURNS vector(384) AS $$
BEGIN
    -- PLACEHOLDER: In production, this would call external embedding service
    -- For now, return a zero vector of correct dimensions
    -- This should be replaced with actual embedding generation
    RAISE NOTICE 'generate_embedding called with text: %, model: %', input_text, model_name;
    
    -- Return zero vector as placeholder (384 dimensions)
    RETURN (SELECT ARRAY(SELECT 0.0 FROM generate_series(1, 384)))::vector(384);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to execute raw SQL with security validation
-- Used by the application for privileged operations
CREATE OR REPLACE FUNCTION execute_sql(
    sql_query TEXT,
    sql_params TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    query_lower TEXT;
BEGIN
    -- Basic SQL injection protection
    query_lower := lower(trim(sql_query));
    
    -- Check for dangerous patterns
    IF query_lower ~ '(drop|truncate|delete.*where.*1.*=.*1|grant|revoke|alter)' THEN
        RAISE EXCEPTION 'Potentially dangerous SQL detected';
    END IF;
    
    -- Log the query execution
    RAISE NOTICE 'Executing SQL: %', sql_query;
    
    -- Execute the query (simplified implementation)
    -- In production, this would use dynamic SQL with parameters
    EXECUTE sql_query;
    
    -- Return success status
    RETURN jsonb_build_object('success', true, 'executed_at', now());
    
EXCEPTION WHEN OTHERS THEN
    -- Return error information
    RETURN jsonb_build_object(
        'success', false, 
        'error', SQLERRM,
        'code', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update conversation embeddings when context changes
CREATE OR REPLACE FUNCTION update_conversation_embedding()
RETURNS TRIGGER AS $$
DECLARE
    new_embedding vector(384);
BEGIN
    -- Generate new embedding for updated context_summary
    -- In production, this would call the actual embedding service
    IF NEW.context_summary IS NOT NULL AND NEW.context_summary != COALESCE(OLD.context_summary, '') THEN
        -- For now, set to NULL to indicate it needs regeneration
        NEW.embeddings := NULL;
        
        -- Log that embedding needs to be regenerated
        INSERT INTO pg_temp.embedding_queue (table_name, record_id, content)
        VALUES ('conversations', NEW.id, NEW.context_summary)
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update message embeddings when content changes
CREATE OR REPLACE FUNCTION update_message_embedding()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate new embedding for message content
    IF NEW.content IS NOT NULL AND NEW.content != COALESCE(OLD.content, '') THEN
        -- For now, set to NULL to indicate it needs regeneration
        NEW.embeddings := NULL;
        
        -- Log that embedding needs to be regenerated
        INSERT INTO pg_temp.embedding_queue (table_name, record_id, content)
        VALUES ('messages', NEW.id, NEW.content)
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update knowledge node embeddings when content changes
CREATE OR REPLACE FUNCTION update_knowledge_embedding()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate new embedding for knowledge content
    IF NEW.content IS NOT NULL AND NEW.content != COALESCE(OLD.content, '') THEN
        -- For now, set to NULL to indicate it needs regeneration
        NEW.embeddings := NULL;
        
        -- Log that embedding needs to be regenerated
        INSERT INTO pg_temp.embedding_queue (table_name, record_id, content)
        VALUES ('knowledge_nodes', NEW.id, NEW.content)
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create temporary table for tracking embedding updates
CREATE TEMP TABLE IF NOT EXISTS embedding_queue (
    table_name TEXT,
    record_id UUID,
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (table_name, record_id)
);

-- Add triggers to automatically update embeddings
CREATE TRIGGER update_conversation_embedding_trigger
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_conversation_embedding();

CREATE TRIGGER update_message_embedding_trigger
    BEFORE INSERT OR UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_message_embedding();

CREATE TRIGGER update_knowledge_embedding_trigger
    BEFORE INSERT OR UPDATE ON knowledge_nodes
    FOR EACH ROW EXECUTE FUNCTION update_knowledge_embedding();

-- Function to get embedding statistics for monitoring
CREATE OR REPLACE FUNCTION get_embedding_statistics(business_id UUID)
RETURNS TABLE (
    table_name TEXT,
    total_records BIGINT,
    records_with_embeddings BIGINT,
    embedding_coverage_percent NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'conversations'::TEXT,
        COUNT(*)::BIGINT,
        COUNT(c.embeddings)::BIGINT,
        ROUND((COUNT(c.embeddings)::NUMERIC / COUNT(*)) * 100, 2)
    FROM conversations c
    JOIN assistants a ON c.assistant_id = a.id
    WHERE a.business_id = get_embedding_statistics.business_id
    
    UNION ALL
    
    SELECT 
        'messages'::TEXT,
        COUNT(*)::BIGINT,
        COUNT(m.embeddings)::BIGINT,
        ROUND((COUNT(m.embeddings)::NUMERIC / COUNT(*)) * 100, 2)
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    JOIN assistants a ON c.assistant_id = a.id
    WHERE a.business_id = get_embedding_statistics.business_id
    
    UNION ALL
    
    SELECT 
        'knowledge_nodes'::TEXT,
        COUNT(*)::BIGINT,
        COUNT(kn.embeddings)::BIGINT,
        ROUND((COUNT(kn.embeddings)::NUMERIC / COUNT(*)) * 100, 2)
    FROM knowledge_nodes kn
    WHERE kn.business_id = get_embedding_statistics.business_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION conversations_vector_search TO authenticated;
GRANT EXECUTE ON FUNCTION messages_vector_search TO authenticated;
GRANT EXECUTE ON FUNCTION knowledge_nodes_vector_search TO authenticated;
GRANT EXECUTE ON FUNCTION conversations_hybrid_search TO authenticated;
GRANT EXECUTE ON FUNCTION knowledge_nodes_hybrid_search TO authenticated;
GRANT EXECUTE ON FUNCTION get_embedding_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION generate_embedding TO service_role;
GRANT EXECUTE ON FUNCTION execute_sql TO service_role;
GRANT EXECUTE ON FUNCTION enable_pgvector TO service_role;

-- Comments for documentation
COMMENT ON FUNCTION conversations_vector_search IS 'Vector similarity search for conversation context with tenant isolation';
COMMENT ON FUNCTION messages_vector_search IS 'Vector similarity search for message content with tenant isolation';
COMMENT ON FUNCTION knowledge_nodes_vector_search IS 'Vector similarity search for business knowledge with tenant isolation';
COMMENT ON FUNCTION conversations_hybrid_search IS 'Hybrid search combining vector similarity and full-text search for conversations';
COMMENT ON FUNCTION knowledge_nodes_hybrid_search IS 'Hybrid search combining vector similarity and full-text search for knowledge';
COMMENT ON FUNCTION generate_embedding IS 'Generate embeddings for text content (placeholder for external service)';
COMMENT ON FUNCTION get_embedding_statistics IS 'Get embedding coverage statistics for monitoring and optimization';