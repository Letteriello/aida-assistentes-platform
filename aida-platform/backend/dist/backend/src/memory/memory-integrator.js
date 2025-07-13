/**
 * AIDA Platform - Memory Integrator
 * CRITICAL: Orchestrates dual-memory architecture (conversation + business knowledge)
 * PATTERN: Combines both memory systems for comprehensive AI context
 */
import { ConversationHistoryManager } from './conversation-history';
import { BusinessKnowledgeManager } from './business-knowledge';
import { createHybridQueryEngine } from '../rag/hybrid-query';
import { logSecurityEvent } from '../database/security';
/**
 * Memory integrator class
 * CRITICAL: Coordinates conversation history and business knowledge for AI responses
 */
export class MemoryIntegrator {
    conversationManager;
    knowledgeManager;
    hybridQueryEngine;
    supabase;
    businessId;
    config;
    constructor(supabase, businessId, config) {
        this.supabase = supabase;
        this.businessId = businessId;
        this.config = config;
        // Initialize memory managers
        this.conversationManager = new ConversationHistoryManager(supabase, businessId, config.embeddingConfig);
        this.knowledgeManager = new BusinessKnowledgeManager(supabase, businessId, config.embeddingConfig);
        // Initialize hybrid query engine if enabled
        if (config.hybridSearchEnabled) {
            this.hybridQueryEngine = createHybridQueryEngine({
                vectorSearchEngine: null, // Will be injected
                embeddingService: null, // Will be injected
                supabase,
                vectorWeight: 0.4,
                textWeight: 0.3,
                graphWeight: 0.3
            });
        }
    }
    /**
     * Get comprehensive memory context for AI response generation
     * CRITICAL: Primary method for retrieving integrated context
     */
    async getMemoryContext(conversationId, currentMessage, assistantId) {
        try {
            const startTime = Date.now();
            // Get conversation context
            const conversationContext = await this.conversationManager.getConversationContext(conversationId, {
                maxMessages: this.config.maxConversationContext,
                includeSummary: true,
                includeCustomerProfile: true
            });
            // Search relevant business knowledge
            const knowledgeResults = await this.knowledgeManager.searchKnowledge(currentMessage, undefined, // All entity types
            this.config.maxKnowledgeContext, 0.7 // Similarity threshold
            );
            // Search conversation history for similar past interactions
            const similarConversations = await this.conversationManager.searchConversationHistory(currentMessage, assistantId, 5);
            // Perform hybrid search if enabled
            let hybridResults = null;
            if (this.config.hybridSearchEnabled && this.hybridQueryEngine) {
                try {
                    hybridResults = await this.hybridQueryEngine.search({
                        text: currentMessage,
                        businessId: this.businessId,
                        conversationId,
                        assistantId
                    });
                }
                catch (error) {
                    console.warn('Hybrid search failed:', error);
                }
            }
            // Build integrated context
            const integratedContext = {
                conversationContext,
                businessKnowledge: knowledgeResults.map(result => ({
                    node: result.node,
                    relevanceScore: result.similarity,
                    contextType: 'business_knowledge'
                })),
                similarConversations: similarConversations.map(result => ({
                    conversation: result.conversation,
                    message: result.message,
                    relevanceScore: result.similarity,
                    contextType: 'conversation_history'
                })),
                hybridResults: hybridResults || [],
                metadata: {
                    processingTime: Date.now() - startTime,
                    conversationWeight: this.config.conversationWeight,
                    knowledgeWeight: this.config.knowledgeWeight,
                    totalKnowledgeNodes: knowledgeResults.length,
                    totalConversationHistory: similarConversations.length,
                    hybridResultsCount: hybridResults?.length || 0
                },
                contextSummary: this.buildContextSummary(conversationContext, knowledgeResults, similarConversations)
            };
            return integratedContext;
        }
        catch (error) {
            console.error('Error getting memory context:', error);
            logSecurityEvent('memory_context_error', 'Failed to get memory context', this.businessId, {
                conversationId,
                assistantId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    /**
     * Query memory with specific focus areas
     * CRITICAL: Targeted memory retrieval for specific questions
     */
    async queryMemory(query) {
        try {
            const { text, conversationId, assistantId, focusAreas = ['conversation', 'knowledge'], maxResults = 10, timeWindow } = query;
            const results = {
                query: text,
                conversationResults: [],
                knowledgeResults: [],
                integratedResults: [],
                metadata: {
                    queryTime: Date.now(),
                    focusAreas,
                    totalResults: 0
                }
            };
            // Search conversation history if requested
            if (focusAreas.includes('conversation')) {
                const conversationResults = await this.conversationManager.searchConversationHistory(text, assistantId, Math.floor(maxResults / 2));
                results.conversationResults = conversationResults.map(result => ({
                    type: 'conversation',
                    content: result.message.content,
                    score: result.similarity,
                    metadata: {
                        conversationId: result.conversation.id,
                        messageId: result.message.id,
                        timestamp: result.message.timestamp,
                        customerName: result.conversation.customer_name
                    }
                }));
            }
            // Search business knowledge if requested
            if (focusAreas.includes('knowledge')) {
                const knowledgeResults = await this.knowledgeManager.searchKnowledge(text, undefined, Math.floor(maxResults / 2), 0.7);
                results.knowledgeResults = knowledgeResults.map(result => ({
                    type: 'knowledge',
                    content: result.node.content,
                    score: result.similarity,
                    metadata: {
                        nodeId: result.node.id,
                        entityType: result.node.entity_type,
                        entityName: result.node.entity_name,
                        properties: result.node.properties
                    }
                }));
            }
            // Combine and rank results
            results.integratedResults = this.combineAndRankResults(results.conversationResults, results.knowledgeResults);
            results.metadata.totalResults = results.integratedResults.length;
            return results;
        }
        catch (error) {
            console.error('Error querying memory:', error);
            throw error;
        }
    }
    /**
     * Store conversation message and update memory
     * CRITICAL: Maintains both conversation and knowledge context
     */
    async storeConversationMessage(conversationId, content, senderType, messageType = 'text', metadata = {}) {
        try {
            // Store in conversation history
            await this.conversationManager.addMessage(conversationId, content, senderType, messageType, metadata);
            // Extract and update business knowledge if this is new information
            if (senderType === 'customer') {
                await this.extractAndStoreKnowledge(content, conversationId);
            }
        }
        catch (error) {
            console.error('Error storing conversation message:', error);
            throw error;
        }
    }
    /**
     * Update business knowledge from external source
     * CRITICAL: Keeps knowledge base current
     */
    async updateBusinessKnowledge(entityType, entityName, content, properties = {}, source) {
        try {
            return await this.knowledgeManager.createKnowledgeNode(entityType, entityName, properties, content, source);
        }
        catch (error) {
            console.error('Error updating business knowledge:', error);
            throw error;
        }
    }
    /**
     * Get memory statistics and health metrics
     * CRITICAL: Monitoring and optimization insights
     */
    async getMemoryStats() {
        try {
            // Get knowledge graph stats
            const knowledgeStats = await this.knowledgeManager.getKnowledgeGraphStats();
            // Get conversation stats
            const { count: totalConversations } = await this.supabase
                .from('conversations')
                .select('id', { count: 'exact' });
            const { count: totalMessages } = await this.supabase
                .from('messages')
                .select('id', { count: 'exact' });
            return {
                conversation: {
                    totalConversations: totalConversations || 0,
                    totalMessages: totalMessages || 0,
                    avgMessagesPerConversation: totalConversations > 0
                        ? (totalMessages || 0) / totalConversations
                        : 0
                },
                knowledge: knowledgeStats,
                integration: {
                    conversationWeight: this.config.conversationWeight,
                    knowledgeWeight: this.config.knowledgeWeight,
                    hybridSearchEnabled: this.config.hybridSearchEnabled,
                    contextWindowSize: this.config.contextWindowSize
                }
            };
        }
        catch (error) {
            console.error('Error getting memory stats:', error);
            throw error;
        }
    }
    /**
     * Clear memory cache and optimize storage
     * CRITICAL: Memory maintenance and optimization
     */
    async optimizeMemory() {
        try {
            const results = {
                conversationsOptimized: 0,
                knowledgeNodesOptimized: 0,
                summariesCreated: 0
            };
            // Find long conversations that need summarization
            const { data: longConversations } = await this.supabase
                .from('conversations')
                .select('id, (select count(*) from messages where conversation_id = conversations.id) as message_count')
                .gt('message_count', 50)
                .is('summary_id', null);
            // Create summaries for long conversations
            if (longConversations) {
                for (const conv of longConversations) {
                    try {
                        await this.conversationManager.updateConversationSummary(conv.id);
                        results.summariesCreated++;
                    }
                    catch (error) {
                        console.warn(`Failed to summarize conversation ${conv.id}:`, error);
                    }
                }
            }
            // Archive old conversations (>6 months inactive)
            const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
            const { count: archivedCount } = await this.supabase
                .from('conversations')
                .update({ status: 'archived' })
                .eq('status', 'resolved')
                .lt('last_message_at', sixMonthsAgo.toISOString());
            results.conversationsOptimized = archivedCount || 0;
            return results;
        }
        catch (error) {
            console.error('Error optimizing memory:', error);
            throw error;
        }
    }
    /**
     * Build context summary for integrated results
     */
    buildContextSummary(conversationContext, knowledgeResults, similarConversations) {
        const parts = [];
        // Conversation summary
        if (conversationContext.summary) {
            parts.push(`Current conversation: ${conversationContext.summary.content}`);
        }
        // Customer profile
        if (conversationContext.customerProfile) {
            const profile = conversationContext.customerProfile;
            parts.push(`Customer: ${profile.name || 'Unknown'} (${profile.totalConversations} conversations, ${profile.sentiment} sentiment)`);
        }
        // Relevant knowledge
        if (knowledgeResults.length > 0) {
            const topKnowledge = knowledgeResults
                .slice(0, 3)
                .map(r => `${r.node.entity_name}: ${r.node.content.substring(0, 100)}...`)
                .join('; ');
            parts.push(`Relevant knowledge: ${topKnowledge}`);
        }
        // Similar conversations
        if (similarConversations.length > 0) {
            parts.push(`${similarConversations.length} similar past conversations found`);
        }
        return parts.join(' | ');
    }
    /**
     * Combine and rank results from different memory sources
     */
    combineAndRankResults(conversationResults, knowledgeResults) {
        const combined = [
            ...conversationResults.map(r => ({
                ...r,
                weightedScore: r.score * this.config.conversationWeight
            })),
            ...knowledgeResults.map(r => ({
                ...r,
                weightedScore: r.score * this.config.knowledgeWeight
            }))
        ];
        return combined
            .sort((a, b) => b.weightedScore - a.weightedScore)
            .slice(0, this.config.contextWindowSize);
    }
    /**
     * Extract potential knowledge from customer messages
     */
    async extractAndStoreKnowledge(content, conversationId) {
        try {
            // Simple knowledge extraction - would use NLP in production
            const keywords = this.extractKeywords(content);
            // Look for potential new entities or updates
            const entities = this.extractEntities(content);
            if (entities.length > 0) {
                // Store as potential knowledge for review
                await this.supabase
                    .from('potential_knowledge')
                    .insert({
                    conversation_id: conversationId,
                    business_id: this.businessId,
                    extracted_content: content,
                    keywords,
                    entities,
                    created_at: new Date()
                });
            }
        }
        catch (error) {
            console.warn('Failed to extract knowledge from message:', error);
            // Don't throw error as this is optional functionality
        }
    }
    /**
     * Extract keywords from text
     */
    extractKeywords(text) {
        // Simple keyword extraction
        return text
            .toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 3)
            .filter(word => !['that', 'this', 'with', 'from', 'they', 'have', 'were'].includes(word))
            .slice(0, 10);
    }
    /**
     * Extract potential entities from text
     */
    extractEntities(text) {
        // Simple entity extraction - would use NLP in production
        const entities = [];
        // Look for phone numbers
        const phonePattern = /\b\d{2}\s?\d{4,5}-?\d{4}\b/g;
        const phones = text.match(phonePattern);
        if (phones) {
            phones.forEach(phone => {
                entities.push({ type: 'phone', name: phone, confidence: 0.9 });
            });
        }
        // Look for emails
        const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const emails = text.match(emailPattern);
        if (emails) {
            emails.forEach(email => {
                entities.push({ type: 'email', name: email, confidence: 0.9 });
            });
        }
        return entities;
    }
}
/**
 * Factory function to create memory integrator
 */
export function createMemoryIntegrator(supabase, businessId, config = {}) {
    const defaultConfig = {
        conversationWeight: 0.6,
        knowledgeWeight: 0.4,
        maxConversationContext: 10,
        maxKnowledgeContext: 5,
        hybridSearchEnabled: true,
        contextWindowSize: 15,
        embeddingConfig: {
            provider: 'openai',
            model: 'text-embedding-3-small',
            dimension: 1536
        }
    };
    return new MemoryIntegrator(supabase, businessId, { ...defaultConfig, ...config });
}
/**
 * Get default memory integrator configuration
 */
export function getDefaultMemoryConfig() {
    return {
        conversationWeight: 0.6,
        knowledgeWeight: 0.4,
        maxConversationContext: 10,
        maxKnowledgeContext: 5,
        hybridSearchEnabled: true,
        contextWindowSize: 15,
        embeddingConfig: {
            provider: 'openai',
            model: 'text-embedding-3-small',
            dimension: 1536
        }
    };
}
