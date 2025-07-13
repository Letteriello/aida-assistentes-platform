/**
 * AIDA Platform - Business Knowledge Management
 * CRITICAL: Manages business-specific knowledge graphs and ingestion
 * PATTERN: Follows GraphRAG patterns with multi-tenant isolation
 */
import { createEmbeddingService } from '../rag/embedding-service';
import { logSecurityEvent, sanitizeInput, validateInput } from '../database/security';
/**
 * Business knowledge manager
 * CRITICAL: Handles knowledge graphs, ingestion, and versioning per business
 */
export class BusinessKnowledgeManager {
    supabase;
    embeddingService;
    businessId;
    constructor(supabase, businessId, embeddingConfig) {
        this.supabase = supabase;
        this.businessId = businessId;
        this.embeddingService = createEmbeddingService(embeddingConfig);
    }
    /**
     * Create knowledge node with embedding
     * CRITICAL: Primary method for adding business knowledge
     */
    async createKnowledgeNode(entityType, entityName, properties, content, source) {
        try {
            // Validate and sanitize inputs
            validateInput(entityType, 'entity_type');
            validateInput(entityName, 'entity_name');
            const sanitizedContent = sanitizeInput(content);
            // Generate embedding for the content
            const { embedding } = await this.embeddingService.generateEmbedding(sanitizedContent);
            // Create knowledge node
            const nodeId = `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const knowledgeNode = {
                id: nodeId,
                business_id: this.businessId,
                entity_type: entityType,
                entity_name: sanitizeInput(entityName),
                properties: this.sanitizeProperties(properties),
                content: sanitizedContent,
                embeddings: embedding,
                source: source || {
                    type: 'manual',
                    url: null,
                    lastUpdated: new Date()
                },
                version: 1,
                status: 'active',
                confidence: 1.0,
                tags: this.extractTags(sanitizedContent),
                created_at: new Date(),
                updated_at: new Date()
            };
            const { data: createdNode, error } = await this.supabase
                .from('knowledge_nodes')
                .insert(knowledgeNode)
                .select()
                .single();
            if (error || !createdNode) {
                console.error('Failed to create knowledge node:', error);
                throw new Error('Failed to create knowledge node');
            }
            logSecurityEvent('knowledge_node_created', 'Knowledge node created', this.businessId, {
                nodeId,
                entityType,
                entityName
            });
            return createdNode;
        }
        catch (error) {
            console.error('Error creating knowledge node:', error);
            throw error;
        }
    }
    /**
     * Create relationship between knowledge nodes
     * CRITICAL: Builds knowledge graph connections
     */
    async createKnowledgeRelationship(sourceNodeId, targetNodeId, relationshipType, properties = {}, confidence = 1.0) {
        try {
            // Validate nodes exist and belong to business
            const [sourceNode, targetNode] = await Promise.all([
                this.getKnowledgeNode(sourceNodeId),
                this.getKnowledgeNode(targetNodeId)
            ]);
            if (!sourceNode || !targetNode) {
                throw new Error('Source or target node not found');
            }
            // Create relationship
            const relationshipId = `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const relationship = {
                id: relationshipId,
                business_id: this.businessId,
                source_node_id: sourceNodeId,
                target_node_id: targetNodeId,
                relationship_type: relationshipType,
                properties: this.sanitizeProperties(properties),
                confidence,
                status: 'active',
                created_at: new Date(),
                updated_at: new Date()
            };
            const { data: createdRelationship, error } = await this.supabase
                .from('knowledge_relationships')
                .insert(relationship)
                .select()
                .single();
            if (error || !createdRelationship) {
                console.error('Failed to create knowledge relationship:', error);
                throw new Error('Failed to create knowledge relationship');
            }
            return createdRelationship;
        }
        catch (error) {
            console.error('Error creating knowledge relationship:', error);
            throw error;
        }
    }
    /**
     * Search knowledge graph using vector similarity
     * CRITICAL: Enables RAG retrieval from business knowledge
     */
    async searchKnowledge(query, entityTypes, limit = 10, threshold = 0.7) {
        try {
            // Generate embedding for search query
            const { embedding } = await this.embeddingService.generateEmbedding(query);
            // Build query parameters
            const searchParams = {
                query_embedding: embedding,
                business_id: this.businessId,
                entity_types: entityTypes,
                similarity_threshold: threshold,
                match_count: limit
            };
            // Search using pgvector similarity
            const { data: results, error } = await this.supabase.rpc('search_knowledge_nodes', searchParams);
            if (error) {
                console.error('Knowledge search failed:', error);
                throw new Error('Failed to search knowledge');
            }
            return results || [];
        }
        catch (error) {
            console.error('Error searching knowledge:', error);
            throw error;
        }
    }
    /**
     * Query knowledge graph with relationships
     * CRITICAL: Traverses graph structure for complex queries
     */
    async queryKnowledgeGraph(query) {
        try {
            const { startNodeId, relationshipTypes = [], maxDepth = 2, includeProperties = true, filters = {} } = query;
            // Validate start node
            const startNode = await this.getKnowledgeNode(startNodeId);
            if (!startNode) {
                throw new Error('Start node not found');
            }
            // Execute graph traversal query
            const { data: graphData, error } = await this.supabase.rpc('traverse_knowledge_graph', {
                start_node_id: startNodeId,
                business_id: this.businessId,
                relationship_types: relationshipTypes,
                max_depth: maxDepth,
                include_properties: includeProperties,
                filters
            });
            if (error) {
                console.error('Graph query failed:', error);
                throw new Error('Failed to query knowledge graph');
            }
            return {
                startNode,
                nodes: graphData?.nodes || [],
                relationships: graphData?.relationships || [],
                paths: graphData?.paths || [],
                metadata: {
                    queryTime: Date.now(),
                    nodeCount: graphData?.nodes?.length || 0,
                    relationshipCount: graphData?.relationships?.length || 0,
                    depth: maxDepth
                }
            };
        }
        catch (error) {
            console.error('Error querying knowledge graph:', error);
            throw error;
        }
    }
    /**
     * Ingest knowledge from external source
     * CRITICAL: Bulk knowledge import with conflict resolution
     */
    async ingestKnowledge(source, data) {
        try {
            const results = {
                sourceId: source.url || 'manual',
                processedCount: 0,
                createdNodes: 0,
                updatedNodes: 0,
                createdRelationships: 0,
                errors: [],
                warnings: [],
                metadata: {
                    startTime: new Date(),
                    endTime: new Date(),
                    processingTime: 0
                }
            };
            const createdNodes = new Map();
            // Process each data item
            for (const item of data) {
                try {
                    results.processedCount++;
                    // Check if node already exists
                    const existingNode = await this.findKnowledgeNodeByName(item.entityType, item.entityName);
                    let node;
                    if (existingNode) {
                        // Update existing node
                        node = await this.updateKnowledgeNode(existingNode.id, {
                            properties: { ...existingNode.properties, ...item.properties },
                            content: item.content,
                            source
                        });
                        results.updatedNodes++;
                    }
                    else {
                        // Create new node
                        node = await this.createKnowledgeNode(item.entityType, item.entityName, item.properties, item.content, source);
                        results.createdNodes++;
                    }
                    createdNodes.set(item.entityName, node);
                    // Process relationships
                    if (item.relationships) {
                        for (const rel of item.relationships) {
                            try {
                                const targetNode = createdNodes.get(rel.targetEntityName) ||
                                    await this.findKnowledgeNodeByName(item.entityType, rel.targetEntityName);
                                if (targetNode) {
                                    await this.createKnowledgeRelationship(node.id, targetNode.id, rel.relationshipType, rel.properties || {});
                                    results.createdRelationships++;
                                }
                                else {
                                    results.warnings.push(`Target node not found: ${rel.targetEntityName}`);
                                }
                            }
                            catch (relError) {
                                results.errors.push(`Relationship error: ${relError}`);
                            }
                        }
                    }
                }
                catch (itemError) {
                    results.errors.push(`Item processing error: ${itemError}`);
                }
            }
            results.metadata.endTime = new Date();
            results.metadata.processingTime =
                results.metadata.endTime.getTime() - results.metadata.startTime.getTime();
            logSecurityEvent('knowledge_ingested', 'Knowledge batch ingested', this.businessId, {
                sourceType: source.type,
                processedCount: results.processedCount,
                createdNodes: results.createdNodes,
                errorCount: results.errors.length
            });
            return results;
        }
        catch (error) {
            console.error('Error ingesting knowledge:', error);
            throw error;
        }
    }
    /**
     * Update knowledge node with versioning
     * CRITICAL: Maintains knowledge history and version control
     */
    async updateKnowledgeNode(nodeId, updates) {
        try {
            // Get current node
            const currentNode = await this.getKnowledgeNode(nodeId);
            if (!currentNode) {
                throw new Error('Knowledge node not found');
            }
            // Create update data
            const updateData = {
                updated_at: new Date(),
                version: currentNode.version + 1
            };
            // Update properties if provided
            if (updates.properties) {
                updateData.properties = {
                    ...currentNode.properties,
                    ...this.sanitizeProperties(updates.properties)
                };
            }
            // Update content and regenerate embedding if provided
            if (updates.content) {
                const sanitizedContent = sanitizeInput(updates.content);
                updateData.content = sanitizedContent;
                const { embedding } = await this.embeddingService.generateEmbedding(sanitizedContent);
                updateData.embeddings = embedding;
                updateData.tags = this.extractTags(sanitizedContent);
            }
            // Update source information
            if (updates.source) {
                updateData.source = updates.source;
            }
            // Store version history
            await this.storeNodeVersion(currentNode);
            // Update the node
            const { data: updatedNode, error } = await this.supabase
                .from('knowledge_nodes')
                .update(updateData)
                .eq('id', nodeId)
                .select()
                .single();
            if (error || !updatedNode) {
                console.error('Failed to update knowledge node:', error);
                throw new Error('Failed to update knowledge node');
            }
            return updatedNode;
        }
        catch (error) {
            console.error('Error updating knowledge node:', error);
            throw error;
        }
    }
    /**
     * Get knowledge node by ID
     */
    async getKnowledgeNode(nodeId) {
        try {
            const { data: node, error } = await this.supabase
                .from('knowledge_nodes')
                .select('*')
                .eq('id', nodeId)
                .eq('status', 'active')
                .single();
            if (error || !node) {
                return null;
            }
            return node;
        }
        catch (error) {
            console.error('Error getting knowledge node:', error);
            return null;
        }
    }
    /**
     * Find knowledge node by entity name
     */
    async findKnowledgeNodeByName(entityType, entityName) {
        try {
            const { data: node, error } = await this.supabase
                .from('knowledge_nodes')
                .select('*')
                .eq('entity_type', entityType)
                .eq('entity_name', entityName)
                .eq('status', 'active')
                .single();
            if (error || !node) {
                return null;
            }
            return node;
        }
        catch (error) {
            console.error('Error finding knowledge node by name:', error);
            return null;
        }
    }
    /**
     * Get knowledge graph statistics
     */
    async getKnowledgeGraphStats() {
        try {
            // Get node counts
            const { count: totalNodes } = await this.supabase
                .from('knowledge_nodes')
                .select('id', { count: 'exact' })
                .eq('status', 'active');
            // Get relationship counts
            const { count: totalRelationships } = await this.supabase
                .from('knowledge_relationships')
                .select('id', { count: 'exact' })
                .eq('status', 'active');
            // Get nodes by type
            const { data: nodeTypes } = await this.supabase
                .from('knowledge_nodes')
                .select('entity_type')
                .eq('status', 'active');
            const nodesByType = (nodeTypes || []).reduce((acc, node) => {
                acc[node.entity_type] = (acc[node.entity_type] || 0) + 1;
                return acc;
            }, {});
            // Get relationships by type
            const { data: relationshipTypes } = await this.supabase
                .from('knowledge_relationships')
                .select('relationship_type')
                .eq('status', 'active');
            const relationshipsByType = (relationshipTypes || []).reduce((acc, rel) => {
                acc[rel.relationship_type] = (acc[rel.relationship_type] || 0) + 1;
                return acc;
            }, {});
            return {
                totalNodes: totalNodes || 0,
                totalRelationships: totalRelationships || 0,
                nodesByType,
                relationshipsByType,
                lastUpdated: new Date()
            };
        }
        catch (error) {
            console.error('Error getting knowledge graph stats:', error);
            throw error;
        }
    }
    /**
     * Store node version for history tracking
     */
    async storeNodeVersion(node) {
        try {
            const versionRecord = {
                node_id: node.id,
                business_id: this.businessId,
                version: node.version,
                content: node.content,
                properties: node.properties,
                embeddings: node.embeddings,
                created_at: new Date()
            };
            await this.supabase
                .from('knowledge_node_versions')
                .insert(versionRecord);
        }
        catch (error) {
            console.error('Error storing node version:', error);
            // Don't throw error as this is auxiliary functionality
        }
    }
    /**
     * Sanitize properties object
     */
    sanitizeProperties(properties) {
        const sanitized = {};
        for (const [key, value] of Object.entries(properties)) {
            const sanitizedKey = sanitizeInput(key);
            if (typeof value === 'string') {
                sanitized[sanitizedKey] = sanitizeInput(value);
            }
            else if (typeof value === 'object' && value !== null) {
                sanitized[sanitizedKey] = this.sanitizeProperties(value);
            }
            else {
                sanitized[sanitizedKey] = value;
            }
        }
        return sanitized;
    }
    /**
     * Extract tags from content for categorization
     */
    extractTags(content) {
        // Simple tag extraction - would use NLP in production
        const words = content.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3);
        const wordCount = words.reduce((acc, word) => {
            acc[word] = (acc[word] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(wordCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([word]) => word);
    }
}
/**
 * Factory function to create business knowledge manager
 */
export function createBusinessKnowledgeManager(supabase, businessId, embeddingConfig) {
    return new BusinessKnowledgeManager(supabase, businessId, embeddingConfig);
}
