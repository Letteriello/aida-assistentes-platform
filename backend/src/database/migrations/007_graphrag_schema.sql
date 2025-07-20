-- GraphRAG Pipeline Database Schema
-- Implementation of graph storage tables for enhanced knowledge representation
-- Based on Microsoft GraphRAG architecture with PostgreSQL graph extensions

-- Graph nodes table (entities)
CREATE TABLE graph_nodes (
    id VARCHAR(255) PRIMARY KEY,
    labels TEXT[] NOT NULL,
    properties JSONB NOT NULL DEFAULT '{}',
    tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    embedding vector(1536) -- For hybrid search with existing vector database
);

-- Graph relationships table
CREATE TABLE graph_relationships (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    source_node_id VARCHAR(255) NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
    target_node_id VARCHAR(255) NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
    properties JSONB NOT NULL DEFAULT '{}',
    tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Communities table for hierarchical knowledge organization
CREATE TABLE knowledge_communities (
    id VARCHAR(255) PRIMARY KEY,
    level INTEGER NOT NULL,
    entities TEXT[] NOT NULL,
    summary TEXT NOT NULL,
    keywords TEXT[] NOT NULL,
    coherence_score FLOAT NOT NULL,
    parent_community VARCHAR(255) REFERENCES knowledge_communities(id),
    tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Entity extraction jobs tracking
CREATE TABLE extraction_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    entities_extracted INTEGER DEFAULT 0,
    relationships_extracted INTEGER DEFAULT 0,
    communities_detected INTEGER DEFAULT 0,
    error_message TEXT,
    tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Graph traversal cache for performance optimization
CREATE TABLE graph_traversal_cache (
    cache_key VARCHAR(512) PRIMARY KEY,
    entity_id VARCHAR(255) NOT NULL,
    max_hops INTEGER NOT NULL,
    min_confidence FLOAT NOT NULL,
    result_data JSONB NOT NULL,
    tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '5 minutes'
);

-- Performance indexes for graph operations
CREATE INDEX idx_graph_nodes_tenant ON graph_nodes(tenant_id);
CREATE INDEX idx_graph_nodes_labels ON graph_nodes USING GIN(labels);
CREATE INDEX idx_graph_nodes_properties ON graph_nodes USING GIN(properties);
CREATE INDEX idx_graph_nodes_embedding ON graph_nodes USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_graph_nodes_updated ON graph_nodes(updated_at);

CREATE INDEX idx_graph_relationships_tenant ON graph_relationships(tenant_id);
CREATE INDEX idx_graph_relationships_type ON graph_relationships(type);
CREATE INDEX idx_graph_relationships_source ON graph_relationships(source_node_id);
CREATE INDEX idx_graph_relationships_target ON graph_relationships(target_node_id);
CREATE INDEX idx_graph_relationships_properties ON graph_relationships USING GIN(properties);
CREATE INDEX idx_graph_relationships_updated ON graph_relationships(updated_at);

-- Composite index for efficient graph traversal
CREATE INDEX idx_graph_relationships_traversal ON graph_relationships(source_node_id, target_node_id, type);

CREATE INDEX idx_communities_tenant ON knowledge_communities(tenant_id);
CREATE INDEX idx_communities_level ON knowledge_communities(level);
CREATE INDEX idx_communities_entities ON knowledge_communities USING GIN(entities);
CREATE INDEX idx_communities_keywords ON knowledge_communities USING GIN(keywords);
CREATE INDEX idx_communities_coherence ON knowledge_communities(coherence_score);
CREATE INDEX idx_communities_parent ON knowledge_communities(parent_community);

CREATE INDEX idx_extraction_jobs_tenant ON extraction_jobs(tenant_id);
CREATE INDEX idx_extraction_jobs_status ON extraction_jobs(status);
CREATE INDEX idx_extraction_jobs_document ON extraction_jobs(document_id);
CREATE INDEX idx_extraction_jobs_created ON extraction_jobs(created_at);

CREATE INDEX idx_traversal_cache_tenant ON graph_traversal_cache(tenant_id);
CREATE INDEX idx_traversal_cache_entity ON graph_traversal_cache(entity_id);
CREATE INDEX idx_traversal_cache_expires ON graph_traversal_cache(expires_at);

-- RLS policies for tenant isolation
ALTER TABLE graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_traversal_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY graph_nodes_isolation ON graph_nodes
  FOR ALL
  USING (tenant_id = (current_setting('app.current_business_id', TRUE)::UUID));

CREATE POLICY graph_relationships_isolation ON graph_relationships
  FOR ALL
  USING (tenant_id = (current_setting('app.current_business_id', TRUE)::UUID));

CREATE POLICY knowledge_communities_isolation ON knowledge_communities
  FOR ALL
  USING (tenant_id = (current_setting('app.current_business_id', TRUE)::UUID));

CREATE POLICY extraction_jobs_isolation ON extraction_jobs
  FOR ALL
  USING (tenant_id = (current_setting('app.current_business_id', TRUE)::UUID));

CREATE POLICY graph_traversal_cache_isolation ON graph_traversal_cache
  FOR ALL
  USING (tenant_id = (current_setting('app.current_business_id', TRUE)::UUID));

-- Automatic cleanup of expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM graph_traversal_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup every 5 minutes (requires pg_cron extension in production)
-- SELECT cron.schedule('cleanup-graph-cache', '*/5 * * * *', 'SELECT cleanup_expired_cache();');

-- Function to update graph node timestamps
CREATE OR REPLACE FUNCTION update_graph_node_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update graph relationship timestamps
CREATE OR REPLACE FUNCTION update_graph_relationship_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_graph_nodes_timestamp
    BEFORE UPDATE ON graph_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_graph_node_timestamp();

CREATE TRIGGER update_graph_relationships_timestamp
    BEFORE UPDATE ON graph_relationships
    FOR EACH ROW
    EXECUTE FUNCTION update_graph_relationship_timestamp();

-- Graph traversal function for multi-hop queries
CREATE OR REPLACE FUNCTION find_connected_entities(
    start_entity_id VARCHAR(255),
    max_hops INTEGER DEFAULT 3,
    min_confidence FLOAT DEFAULT 0.7,
    tenant_uuid UUID DEFAULT NULL
)
RETURNS TABLE(
    entity_id VARCHAR(255),
    entity_labels TEXT[],
    entity_properties JSONB,
    relationship_id VARCHAR(255),
    relationship_type VARCHAR(100),
    relationship_properties JSONB,
    hop_distance INTEGER,
    path_ids TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE graph_traversal AS (
        -- Base case: start with the given entity
        SELECT 
            n.id as entity_id,
            n.labels as entity_labels,
            n.properties as entity_properties,
            NULL::VARCHAR(255) as relationship_id,
            NULL::VARCHAR(100) as relationship_type,
            NULL::JSONB as relationship_properties,
            0 as hop_distance,
            ARRAY[n.id] as path_ids
        FROM graph_nodes n
        WHERE n.id = start_entity_id
          AND (tenant_uuid IS NULL OR n.tenant_id = tenant_uuid)
        
        UNION ALL
        
        -- Recursive case: traverse connected nodes
        SELECT 
            n.id as entity_id,
            n.labels as entity_labels,
            n.properties as entity_properties,
            r.id as relationship_id,
            r.type as relationship_type,
            r.properties as relationship_properties,
            gt.hop_distance + 1,
            gt.path_ids || n.id
        FROM graph_traversal gt
        JOIN graph_relationships r ON (
            (gt.entity_id = r.source_node_id AND r.target_node_id != ALL(gt.path_ids)) OR
            (gt.entity_id = r.target_node_id AND r.source_node_id != ALL(gt.path_ids))
        )
        JOIN graph_nodes n ON (
            (r.source_node_id = n.id AND n.id != gt.entity_id) OR
            (r.target_node_id = n.id AND n.id != gt.entity_id)
        )
        WHERE 
            gt.hop_distance < max_hops 
            AND (r.properties->>'confidence')::FLOAT >= min_confidence
            AND n.id != ALL(gt.path_ids)  -- Prevent cycles
            AND (tenant_uuid IS NULL OR r.tenant_id = tenant_uuid)
            AND (tenant_uuid IS NULL OR n.tenant_id = tenant_uuid)
    )
    SELECT DISTINCT ON (gt.entity_id) 
        gt.entity_id,
        gt.entity_labels,
        gt.entity_properties,
        gt.relationship_id,
        gt.relationship_type,
        gt.relationship_properties,
        gt.hop_distance,
        gt.path_ids
    FROM graph_traversal gt
    ORDER BY gt.entity_id, gt.hop_distance;
END;
$$ LANGUAGE plpgsql;

-- Community detection helper function using Leiden algorithm approach
CREATE OR REPLACE FUNCTION detect_communities(
    tenant_uuid UUID,
    min_community_size INTEGER DEFAULT 3,
    resolution_parameter FLOAT DEFAULT 1.0
)
RETURNS TABLE(
    community_id VARCHAR(255),
    entity_ids TEXT[],
    community_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    WITH entity_similarities AS (
        SELECT 
            r1.source_node_id as entity1,
            r1.target_node_id as entity2,
            COUNT(*) as shared_connections,
            AVG((r1.properties->>'confidence')::FLOAT) as avg_confidence
        FROM graph_relationships r1
        JOIN graph_relationships r2 ON (
            r1.target_node_id = r2.source_node_id OR
            r1.source_node_id = r2.target_node_id
        )
        WHERE r1.tenant_id = tenant_uuid
          AND r2.tenant_id = tenant_uuid
          AND (r1.properties->>'confidence')::FLOAT > 0.7
        GROUP BY r1.source_node_id, r1.target_node_id
        HAVING COUNT(*) >= 2
    ),
    community_seeds AS (
        SELECT 
            entity1,
            entity2,
            shared_connections * avg_confidence * resolution_parameter as similarity_score
        FROM entity_similarities
        WHERE shared_connections * avg_confidence * resolution_parameter > 1.5
    ),
    community_clusters AS (
        SELECT 
            'community_' || DENSE_RANK() OVER (ORDER BY similarity_score DESC) as community_id,
            ARRAY[entity1, entity2] as entity_ids,
            similarity_score as community_score
        FROM community_seeds
        ORDER BY similarity_score DESC
    )
    SELECT 
        cc.community_id,
        cc.entity_ids,
        cc.community_score
    FROM community_clusters cc
    WHERE array_length(cc.entity_ids, 1) >= min_community_size;
END;
$$ LANGUAGE plpgsql;

-- Performance monitoring view
CREATE VIEW graph_performance_metrics AS
SELECT 
    'graph_nodes' as table_name,
    COUNT(*) as record_count,
    pg_size_pretty(pg_total_relation_size('graph_nodes')) as table_size,
    (SELECT COUNT(*) FROM graph_nodes WHERE created_at >= NOW() - INTERVAL '24 hours') as daily_inserts
FROM graph_nodes
UNION ALL
SELECT 
    'graph_relationships' as table_name,
    COUNT(*) as record_count,
    pg_size_pretty(pg_total_relation_size('graph_relationships')) as table_size,
    (SELECT COUNT(*) FROM graph_relationships WHERE created_at >= NOW() - INTERVAL '24 hours') as daily_inserts
FROM graph_relationships
UNION ALL
SELECT 
    'knowledge_communities' as table_name,
    COUNT(*) as record_count,
    pg_size_pretty(pg_total_relation_size('knowledge_communities')) as table_size,
    (SELECT COUNT(*) FROM knowledge_communities WHERE created_at >= NOW() - INTERVAL '24 hours') as daily_inserts
FROM knowledge_communities;

-- Example usage comments
/*
-- Find connected entities starting from a specific entity
SELECT * FROM find_connected_entities(
    'entity_12345', 
    3, -- max 3 hops
    0.8, -- minimum confidence 0.8
    'business-uuid-here'
);

-- Detect communities for a tenant
SELECT * FROM detect_communities(
    'business-uuid-here',
    3, -- minimum 3 entities per community
    1.0 -- resolution parameter
);

-- Monitor graph performance
SELECT * FROM graph_performance_metrics;
*/