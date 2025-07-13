/**
 * Context Manager for RAG System
 * 
 * Manages conversation context, query optimization, and intelligent context retrieval
 * for enhanced RAG performance and user experience.
 * 
 * PATTERN: Context-aware conversation management
 * SECURITY: Context isolation per business/user
 * PERFORMANCE: Intelligent context pruning and caching
 */

import { TenantAwareSupabase } from '../supabase/tenant-aware-supabase';
import { CloudflareEnv } from '../types/cloudflare';
import { EmbeddingService } from './embedding-service';
import { VectorSearchService } from './vector-search';

/**
 * Configuration for context management
 */
export interface ContextConfig {
  maxContextLength: number;
  maxTurns: number;
  contextWindow: number;
  similarityThreshold: number;
  enableContextCompression: boolean;
  enableSemanticClustering: boolean;
  compressionRatio: number;
  cacheTtl: number;
  enableContextPersistence: boolean;
  contextRetentionDays: number;
}

/**
 * Conversation turn structure
 */
export interface ConversationTurn {
  id: string;
  timestamp: Date;
  userQuery: string;
  systemResponse: string;
  context: string[];
  metadata: {
    queryType: 'question' | 'command' | 'clarification' | 'followup';
    confidence: number;
    relevantDocuments: string[];
    processingTime: number;
  };
}

/**
 * Context window for current conversation
 */
export interface ContextWindow {
  conversationId: string;
  businessId: string;
  userId?: string;
  turns: ConversationTurn[];
  summary: string;
  topics: string[];
  entities: Record<string, any>;
  lastUpdated: Date;
  totalTokens: number;
}

/**
 * Context retrieval request
 */
export interface ContextRequest {
  query: string;
  conversationId: string;
  businessId: string;
  userId?: string;
  maxResults?: number;
  includeHistory?: boolean;
  contextTypes?: ('conversation' | 'documents' | 'entities')[];
}

/**
 * Context retrieval result
 */
export interface ContextResult {
  relevantContext: string[];
  conversationHistory: ConversationTurn[];
  relatedDocuments: any[];
  entities: Record<string, any>;
  confidence: number;
  processingTime: number;
}

/**
 * Context statistics
 */
export interface ContextStats {
  totalConversations: number;
  averageContextLength: number;
  averageRetrievalTime: number;
  cacheHitRate: number;
  compressionRatio: number;
  contextPruningEvents: number;
}

/**
 * Enhanced context result with query optimization
 */
export interface EnhancedContextResult extends ContextResult {
  optimizedQuery: string;
  queryExpansions: string[];
  contextualFilters: Record<string, any>;
  searchStrategy: 'vector' | 'keyword' | 'hybrid';
}

/**
 * Context Manager Class
 * PATTERN: Stateful context management with intelligent optimization
 */
export class ContextManager {
  private config: ContextConfig;
  private supabase: TenantAwareSupabase;
  private env: CloudflareEnv;
  private embeddingService: EmbeddingService;
  private vectorSearch: VectorSearchService;
  private contextCache: Map<string, ContextWindow>;
  private stats: ContextStats;

  constructor(
    config: ContextConfig,
    supabase: TenantAwareSupabase,
    env: CloudflareEnv,
    embeddingService: EmbeddingService,
    vectorSearch: VectorSearchService
  ) {
    this.config = config;
    this.supabase = supabase;
    this.env = env;
    this.embeddingService = embeddingService;
    this.vectorSearch = vectorSearch;
    this.contextCache = new Map();
    this.stats = {
      totalConversations: 0,
      averageContextLength: 0,
      averageRetrievalTime: 0,
      cacheHitRate: 0,
      compressionRatio: 0,
      contextPruningEvents: 0
    };
  }

  /**
   * Get enhanced context for a query with optimization
   * PATTERN: Main context retrieval with query enhancement
   */
  async getEnhancedContext(request: ContextRequest): Promise<EnhancedContextResult> {
    const startTime = Date.now();
    
    try {
      // Validate request
      this.validateContextRequest(request);
      
      // Get or create conversation context
      const contextWindow = await this.getContextWindow(
        request.conversationId,
        request.businessId,
        request.userId
      );
      
      // Analyze query and optimize
      const queryAnalysis = await this.analyzeQuery(request.query, contextWindow);
      
      // Retrieve relevant context
      const contextResult = await this.retrieveContext(request, contextWindow);
      
      // Enhance with query optimization
      const enhancedResult: EnhancedContextResult = {
        ...contextResult,
        optimizedQuery: queryAnalysis.optimizedQuery,
        queryExpansions: queryAnalysis.expansions,
        contextualFilters: queryAnalysis.filters,
        searchStrategy: queryAnalysis.recommendedStrategy
      };
      
      // Update statistics
      const processingTime = Date.now() - startTime;
      this.updateContextStats(processingTime, enhancedResult.relevantContext.length);
      
      return enhancedResult;
      
    } catch (error) {
      console.error('Enhanced context retrieval failed:', error);
      throw new Error(`Context retrieval failed: ${error.message}`);
    }
  }

  /**
   * Add conversation turn to context
   * PATTERN: Context state management
   */
  async addConversationTurn(
    conversationId: string,
    businessId: string,
    userQuery: string,
    systemResponse: string,
    metadata: Partial<ConversationTurn['metadata']> = {},
    userId?: string
  ): Promise<void> {
    try {
      const contextWindow = await this.getContextWindow(conversationId, businessId, userId);
      
      const turn: ConversationTurn = {
        id: `turn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        userQuery,
        systemResponse,
        context: await this.extractContextFromTurn(userQuery, systemResponse),
        metadata: {
          queryType: 'question',
          confidence: 0.8,
          relevantDocuments: [],
          processingTime: 0,
          ...metadata
        }
      };
      
      // Add turn to context window
      contextWindow.turns.push(turn);
      
      // Update context window metadata
      await this.updateContextWindow(contextWindow);
      
      // Prune context if needed
      await this.pruneContextIfNeeded(contextWindow);
      
      // Persist if enabled
      if (this.config.enableContextPersistence) {
        await this.persistContextWindow(contextWindow);
      }
      
    } catch (error) {
      console.error('Failed to add conversation turn:', error);
      throw error;
    }
  }

  /**
   * Get or create context window for conversation
   * PATTERN: Lazy loading with caching
   */
  private async getContextWindow(
    conversationId: string,
    businessId: string,
    userId?: string
  ): Promise<ContextWindow> {
    // Check cache first
    const cacheKey = `${businessId}:${conversationId}`;
    let contextWindow = this.contextCache.get(cacheKey);
    
    if (contextWindow) {
      this.updateCacheStats(true);
      return contextWindow;
    }
    
    this.updateCacheStats(false);
    
    // Try to load from persistence
    if (this.config.enableContextPersistence) {
      contextWindow = await this.loadContextWindow(conversationId, businessId);
    }
    
    // Create new if not found
    if (!contextWindow) {
      contextWindow = {
        conversationId,
        businessId,
        userId,
        turns: [],
        summary: '',
        topics: [],
        entities: {},
        lastUpdated: new Date(),
        totalTokens: 0
      };
      
      this.stats.totalConversations++;
    }
    
    // Cache the context window
    this.contextCache.set(cacheKey, contextWindow);
    
    return contextWindow;
  }

  /**
   * Analyze query in context and optimize
   * PATTERN: Context-aware query analysis
   */
  private async analyzeQuery(
    query: string,
    contextWindow: ContextWindow
  ): Promise<{
    optimizedQuery: string;
    expansions: string[];
    filters: Record<string, any>;
    recommendedStrategy: 'vector' | 'keyword' | 'hybrid';
  }> {
    try {
      // Extract entities and topics from current context
      const contextEntities = Object.keys(contextWindow.entities);
      const contextTopics = contextWindow.topics;
      
      // Analyze query for references to context
      const queryAnalysis = this.analyzeQueryReferences(query, contextEntities, contextTopics);
      
      // Generate query expansions based on context
      const expansions = await this.generateQueryExpansions(query, contextWindow);
      
      // Create contextual filters
      const filters = this.createContextualFilters(queryAnalysis, contextWindow);
      
      // Recommend search strategy
      const recommendedStrategy = this.recommendSearchStrategy(query, contextWindow);
      
      // Optimize query with context
      const optimizedQuery = this.optimizeQueryWithContext(query, contextWindow, expansions);
      
      return {
        optimizedQuery,
        expansions,
        filters,
        recommendedStrategy
      };
      
    } catch (error) {
      console.error('Query analysis failed:', error);
      // Return fallback analysis
      return {
        optimizedQuery: query,
        expansions: [],
        filters: {},
        recommendedStrategy: 'hybrid'
      };
    }
  }

  /**
   * Retrieve relevant context for query
   * PATTERN: Multi-source context retrieval
   */
  private async retrieveContext(
    request: ContextRequest,
    contextWindow: ContextWindow
  ): Promise<ContextResult> {
    const startTime = Date.now();
    const contextTypes = request.contextTypes || ['conversation', 'documents', 'entities'];
    
    const result: ContextResult = {
      relevantContext: [],
      conversationHistory: [],
      relatedDocuments: [],
      entities: {},
      confidence: 0,
      processingTime: 0
    };
    
    // Retrieve conversation context
    if (contextTypes.includes('conversation')) {
      result.conversationHistory = await this.getRelevantConversationHistory(
        request.query,
        contextWindow,
        request.maxResults || 5
      );
      
      result.relevantContext.push(
        ...result.conversationHistory.map(turn => 
          `User: ${turn.userQuery}\nAssistant: ${turn.systemResponse}`
        )
      );
    }
    
    // Retrieve document context
    if (contextTypes.includes('documents')) {
      result.relatedDocuments = await this.getRelevantDocuments(
        request.query,
        request.businessId,
        contextWindow,
        request.maxResults || 10
      );
      
      result.relevantContext.push(
        ...result.relatedDocuments.map(doc => doc.content)
      );
    }
    
    // Retrieve entity context
    if (contextTypes.includes('entities')) {
      result.entities = await this.getRelevantEntities(
        request.query,
        contextWindow
      );
      
      result.relevantContext.push(
        ...Object.entries(result.entities).map(([key, value]) => 
          `${key}: ${JSON.stringify(value)}`
        )
      );
    }
    
    // Calculate confidence based on context relevance
    result.confidence = this.calculateContextConfidence(result, request.query);
    result.processingTime = Date.now() - startTime;
    
    return result;
  }

  /**
   * Get relevant conversation history using semantic similarity
   * PATTERN: Semantic conversation history retrieval
   */
  private async getRelevantConversationHistory(
    query: string,
    contextWindow: ContextWindow,
    maxResults: number
  ): Promise<ConversationTurn[]> {
    if (contextWindow.turns.length === 0) {
      return [];
    }
    
    try {
      // Get query embedding
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);
      
      // Calculate similarity with each turn
      const turnSimilarities: Array<{ turn: ConversationTurn; similarity: number }> = [];
      
      for (const turn of contextWindow.turns) {
        const turnText = `${turn.userQuery} ${turn.systemResponse}`;
        const turnEmbedding = await this.embeddingService.generateEmbedding(turnText);
        
        const similarity = this.calculateCosineSimilarity(queryEmbedding.embedding, turnEmbedding.embedding);
        
        if (similarity > this.config.similarityThreshold) {
          turnSimilarities.push({ turn, similarity });
        }
      }
      
      // Sort by similarity and return top results
      return turnSimilarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, maxResults)
        .map(item => item.turn);
        
    } catch (error) {
      console.error('Failed to get relevant conversation history:', error);
      // Fallback to recent turns
      return contextWindow.turns.slice(-maxResults);
    }
  }

  /**
   * Get relevant documents using enhanced vector search
   * PATTERN: Context-enhanced document retrieval
   */
  private async getRelevantDocuments(
    query: string,
    businessId: string,
    contextWindow: ContextWindow,
    maxResults: number
  ): Promise<any[]> {
    try {
      // Enhance query with context
      const enhancedQuery = this.enhanceQueryWithContext(query, contextWindow);
      
      // Perform vector search
      const searchResult = await this.vectorSearch.search({
        query: enhancedQuery,
        businessId,
        limit: maxResults,
        filters: {
          // Add contextual filters based on conversation topics
          topics: contextWindow.topics.length > 0 ? contextWindow.topics : undefined
        }
      });
      
      return searchResult.results;
      
    } catch (error) {
      console.error('Failed to get relevant documents:', error);
      return [];
    }
  }

  /**
   * Get relevant entities from context
   * PATTERN: Entity-based context retrieval
   */
  private async getRelevantEntities(
    query: string,
    contextWindow: ContextWindow
  ): Promise<Record<string, any>> {
    const relevantEntities: Record<string, any> = {};
    const queryLower = query.toLowerCase();
    
    // Find entities mentioned in query
    for (const [entityName, entityData] of Object.entries(contextWindow.entities)) {
      if (queryLower.includes(entityName.toLowerCase())) {
        relevantEntities[entityName] = entityData;
      }
    }
    
    return relevantEntities;
  }

  /**
   * Validate context request
   * PATTERN: Input validation
   */
  private validateContextRequest(request: ContextRequest): void {
    if (!request.query || typeof request.query !== 'string') {
      throw new Error('Query is required and must be a string');
    }
    
    if (!request.conversationId || typeof request.conversationId !== 'string') {
      throw new Error('Conversation ID is required and must be a string');
    }
    
    if (!request.businessId || typeof request.businessId !== 'string') {
      throw new Error('Business ID is required and must be a string');
    }
    
    if (request.maxResults && (typeof request.maxResults !== 'number' || request.maxResults <= 0)) {
      throw new Error('Max results must be a positive number');
    }
  }

  /**
   * Update context window metadata
   * PATTERN: Context state management
   */
  private async updateContextWindow(contextWindow: ContextWindow): Promise<void> {
    try {
      // Update summary if needed
      if (contextWindow.turns.length > 0) {
        contextWindow.summary = await this.generateContextSummary(contextWindow);
      }
      
      // Extract topics from recent turns
      contextWindow.topics = await this.extractTopics(contextWindow);
      
      // Update entities
      contextWindow.entities = await this.extractEntities(contextWindow);
      
      // Update metadata
      contextWindow.lastUpdated = new Date();
      contextWindow.totalTokens = this.calculateTotalTokens(contextWindow);
      
      // Update cache
      const cacheKey = `${contextWindow.businessId}:${contextWindow.conversationId}`;
      this.contextCache.set(cacheKey, contextWindow);
      
    } catch (error) {
      console.error('Failed to update context window:', error);
      throw error;
    }
  }

  /**
   * Prune context if it exceeds limits
   * PATTERN: Context size management
   */
  private async pruneContextIfNeeded(contextWindow: ContextWindow): Promise<void> {
    try {
      // Check if pruning is needed
      if (contextWindow.turns.length <= this.config.maxTurns && 
          contextWindow.totalTokens <= this.config.maxContextLength) {
        return;
      }
      
      // Prune old turns while preserving important ones
      const importantTurns = contextWindow.turns.filter(turn => 
        turn.metadata.confidence > 0.8 || 
        turn.metadata.queryType === 'command'
      );
      
      const recentTurns = contextWindow.turns.slice(-Math.floor(this.config.maxTurns * 0.7));
      
      // Combine important and recent turns
      const prunedTurns = [...importantTurns, ...recentTurns]
        .filter((turn, index, arr) => arr.findIndex(t => t.id === turn.id) === index)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .slice(-this.config.maxTurns);
      
      contextWindow.turns = prunedTurns;
      
      // Update statistics
      this.stats.contextPruningEvents++;
      
      // Regenerate summary and metadata
      await this.updateContextWindow(contextWindow);
      
    } catch (error) {
      console.error('Context pruning failed:', error);
      throw error;
    }
  }

  /**
   * Persist context window to storage
   * PATTERN: Context persistence
   */
  private async persistContextWindow(contextWindow: ContextWindow): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('conversation_contexts')
        .upsert({
          conversation_id: contextWindow.conversationId,
          business_id: contextWindow.businessId,
          user_id: contextWindow.userId,
          turns: JSON.stringify(contextWindow.turns),
          summary: contextWindow.summary,
          topics: contextWindow.topics,
          entities: contextWindow.entities,
          last_updated: contextWindow.lastUpdated.toISOString(),
          total_tokens: contextWindow.totalTokens
        });
      
      if (error) {
        throw error;
      }
      
    } catch (error) {
      console.error('Failed to persist context window:', error);
      throw error;
    }
  }

  /**
   * Load context window from storage
   * PATTERN: Context loading
   */
  private async loadContextWindow(
    conversationId: string,
    businessId: string
  ): Promise<ContextWindow | null> {
    try {
      const { data, error } = await this.supabase
        .from('conversation_contexts')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('business_id', businessId)
        .single();
      
      if (error || !data) {
        return null;
      }
      
      return {
        conversationId: data.conversation_id,
        businessId: data.business_id,
        userId: data.user_id,
        turns: JSON.parse(data.turns || '[]'),
        summary: data.summary || '',
        topics: data.topics || [],
        entities: data.entities || {},
        lastUpdated: new Date(data.last_updated),
        totalTokens: data.total_tokens || 0
      };
      
    } catch (error) {
      console.error('Failed to load context window:', error);
      return null;
    }
  }

  /**
   * Analyze query references to context
   * PATTERN: Context-aware query analysis
   */
  private analyzeQueryReferences(
    query: string,
    contextEntities: string[],
    contextTopics: string[]
  ): {
    entityReferences: string[];
    topicReferences: string[];
    hasContextReferences: boolean;
  } {
    const queryLower = query.toLowerCase();
    
    const entityReferences = contextEntities.filter(entity => 
      queryLower.includes(entity.toLowerCase())
    );
    
    const topicReferences = contextTopics.filter(topic => 
      queryLower.includes(topic.toLowerCase())
    );
    
    return {
      entityReferences,
      topicReferences,
      hasContextReferences: entityReferences.length > 0 || topicReferences.length > 0
    };
  }

  /**
   * Generate query expansions based on context
   * PATTERN: Context-based query expansion
   */
  private async generateQueryExpansions(
    query: string,
    contextWindow: ContextWindow
  ): Promise<string[]> {
    const expansions: string[] = [];
    
    try {
      // Add related topics as expansions
      expansions.push(...contextWindow.topics.slice(0, 3));
      
      // Add entity names as expansions
      expansions.push(...Object.keys(contextWindow.entities).slice(0, 3));
      
      // Add synonyms from recent conversation
      const recentTerms = this.extractTermsFromRecentTurns(contextWindow, 5);
      expansions.push(...recentTerms.slice(0, 2));
      
      // Remove duplicates and filter relevant ones
      return [...new Set(expansions)]
        .filter(expansion => expansion.length > 2)
        .slice(0, 5);
        
    } catch (error) {
      console.error('Failed to generate query expansions:', error);
      return [];
    }
  }

  /**
   * Create contextual filters
   * PATTERN: Context-based filtering
   */
  private createContextualFilters(
    queryAnalysis: any,
    contextWindow: ContextWindow
  ): Record<string, any> {
    const filters: Record<string, any> = {};
    
    // Add topic filters if context references exist
    if (queryAnalysis.hasContextReferences && contextWindow.topics.length > 0) {
      filters.topics = contextWindow.topics;
    }
    
    // Add entity filters
    if (queryAnalysis.entityReferences.length > 0) {
      filters.entities = queryAnalysis.entityReferences;
    }
    
    // Add temporal filters based on conversation recency
    if (contextWindow.turns.length > 0) {
      const lastTurn = contextWindow.turns[contextWindow.turns.length - 1];
      const hoursSinceLastTurn = (Date.now() - lastTurn.timestamp.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastTurn < 24) {
        filters.recency = 'recent';
      }
    }
    
    return filters;
  }

  /**
   * Recommend search strategy based on context
   * PATTERN: Strategy recommendation
   */
  private recommendSearchStrategy(
    query: string,
    contextWindow: ContextWindow
  ): 'vector' | 'keyword' | 'hybrid' {
    // Analyze query characteristics
    const hasQuestionWords = /\b(what|how|why|when|where|who)\b/i.test(query);
    const hasSpecificTerms = /\b(price|cost|feature|specification)\b/i.test(query);
    const isShortQuery = query.split(' ').length <= 3;
    const hasContextReferences = contextWindow.topics.some(topic => 
      query.toLowerCase().includes(topic.toLowerCase())
    );
    
    // Recommend strategy based on characteristics
    if (isShortQuery && hasSpecificTerms) {
      return 'keyword';
    }
    
    if (hasQuestionWords && !hasSpecificTerms) {
      return 'vector';
    }
    
    if (hasContextReferences) {
      return 'hybrid';
    }
    
    // Default to hybrid for balanced results
    return 'hybrid';
  }

  /**
   * Optimize query with context
   * PATTERN: Context-enhanced query optimization
   */
  private optimizeQueryWithContext(
    query: string,
    contextWindow: ContextWindow,
    expansions: string[]
  ): string {
    let optimizedQuery = query;
    
    // Add relevant context terms
    if (expansions.length > 0) {
      const relevantExpansions = expansions.slice(0, 2);
      optimizedQuery += ' ' + relevantExpansions.join(' ');
    }
    
    // Add business context if available
    if (contextWindow.topics.length > 0) {
      const primaryTopic = contextWindow.topics[0];
      if (!query.toLowerCase().includes(primaryTopic.toLowerCase())) {
        optimizedQuery += ` ${primaryTopic}`;
      }
    }
    
    return optimizedQuery.trim();
  }

  /**
   * Calculate context confidence
   * PATTERN: Confidence scoring
   */
  private calculateContextConfidence(result: ContextResult, query: string): number {
    let confidence = 0;
    
    // Base confidence from context availability
    if (result.relevantContext.length > 0) {
      confidence += 0.3;
    }
    
    if (result.conversationHistory.length > 0) {
      confidence += 0.2;
    }
    
    if (result.relatedDocuments.length > 0) {
      confidence += 0.3;
    }
    
    if (Object.keys(result.entities).length > 0) {
      confidence += 0.2;
    }
    
    // Adjust based on query-context relevance
    const queryWords = query.toLowerCase().split(' ');
    const contextText = result.relevantContext.join(' ').toLowerCase();
    const matchingWords = queryWords.filter(word => contextText.includes(word));
    const relevanceBonus = (matchingWords.length / queryWords.length) * 0.3;
    
    confidence = Math.min(confidence + relevanceBonus, 1.0);
    
    return Math.round(confidence * 100) / 100;
  }

  /**
   * Calculate cosine similarity between embeddings
   * PATTERN: Vector similarity calculation
   */
  private calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same length');
    }
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }
    
    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    
    if (magnitude === 0) {
      return 0;
    }
    
    return dotProduct / magnitude;
  }

  /**
   * Enhance query with context
   * PATTERN: Query enhancement
   */
  private enhanceQueryWithContext(query: string, contextWindow: ContextWindow): string {
    let enhancedQuery = query;
    
    // Add relevant entities mentioned in recent conversation
    const recentEntities = Object.keys(contextWindow.entities).slice(0, 2);
    for (const entity of recentEntities) {
      if (!query.toLowerCase().includes(entity.toLowerCase())) {
        enhancedQuery += ` ${entity}`;
      }
    }
    
    return enhancedQuery.trim();
  }

  /**
   * Update cache statistics
   * PATTERN: Statistics tracking
   */
  private updateCacheStats(isHit: boolean): void {
    const totalRequests = this.stats.cacheHitRate * 100 + (isHit ? 1 : 0);
    const hits = this.stats.cacheHitRate * (totalRequests - 1) + (isHit ? 1 : 0);
    this.stats.cacheHitRate = totalRequests > 0 ? hits / totalRequests : 0;
  }

  /**
   * Update context statistics
   * PATTERN: Performance tracking
   */
  private updateContextStats(processingTime: number, contextLength: number): void {
    // Update average retrieval time
    const totalTime = this.stats.averageRetrievalTime * this.stats.totalConversations + processingTime;
    this.stats.averageRetrievalTime = totalTime / (this.stats.totalConversations + 1);
    
    // Update average context length
    const totalLength = this.stats.averageContextLength * this.stats.totalConversations + contextLength;
    this.stats.averageContextLength = totalLength / (this.stats.totalConversations + 1);
  }

  /**
   * Extract context from conversation turn
   * PATTERN: Context extraction
   */
  private async extractContextFromTurn(userQuery: string, systemResponse: string): Promise<string[]> {
    const context: string[] = [];
    
    // Extract key phrases from user query
    const queryPhrases = this.extractKeyPhrases(userQuery);
    context.push(...queryPhrases);
    
    // Extract key phrases from system response
    const responsePhrases = this.extractKeyPhrases(systemResponse);
    context.push(...responsePhrases);
    
    return [...new Set(context)]; // Remove duplicates
  }

  /**
   * Generate context summary
   * PATTERN: Context summarization
   */
  private async generateContextSummary(contextWindow: ContextWindow): Promise<string> {
    if (contextWindow.turns.length === 0) {
      return '';
    }
    
    // Get recent turns for summary
    const recentTurns = contextWindow.turns.slice(-5);
    const conversationText = recentTurns
      .map(turn => `User: ${turn.userQuery}\nAssistant: ${turn.systemResponse}`)
      .join('\n\n');
    
    // Simple extractive summary (in production, use LLM)
    const sentences = conversationText.split(/[.!?]+/);
    const importantSentences = sentences
      .filter(s => s.length > 20)
      .slice(0, 3);
    
    return importantSentences.join('. ').trim();
  }

  /**
   * Extract topics from context window
   * PATTERN: Topic extraction
   */
  private async extractTopics(contextWindow: ContextWindow): Promise<string[]> {
    const topics: string[] = [];
    
    // Extract topics from recent turns
    const recentTurns = contextWindow.turns.slice(-10);
    for (const turn of recentTurns) {
      const turnTopics = this.extractKeyPhrases(turn.userQuery + ' ' + turn.systemResponse);
      topics.push(...turnTopics);
    }
    
    // Return unique topics, sorted by frequency
    const topicCounts = topics.reduce((acc, topic) => {
      acc[topic] = (acc[topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  /**
   * Extract entities from context window
   * PATTERN: Entity extraction
   */
  private async extractEntities(contextWindow: ContextWindow): Promise<Record<string, any>> {
    const entities: Record<string, any> = {};
    
    // Simple entity extraction (in production, use NER)
    const recentTurns = contextWindow.turns.slice(-5);
    for (const turn of recentTurns) {
      const text = turn.userQuery + ' ' + turn.systemResponse;
      
      // Extract capitalized words as potential entities
      const capitalizedWords = text.match(/\b[A-Z][a-z]+\b/g) || [];
      for (const word of capitalizedWords) {
        if (word.length > 2) {
          entities[word] = {
            type: 'unknown',
            mentions: (entities[word]?.mentions || 0) + 1,
            lastMentioned: turn.timestamp
          };
        }
      }
    }
    
    return entities;
  }

  /**
   * Calculate total tokens in context window
   * PATTERN: Token counting
   */
  private calculateTotalTokens(contextWindow: ContextWindow): number {
    let totalTokens = 0;
    
    for (const turn of contextWindow.turns) {
      // Rough token estimation (4 characters per token)
      const turnText = turn.userQuery + turn.systemResponse;
      totalTokens += Math.ceil(turnText.length / 4);
    }
    
    return totalTokens;
  }

  /**
   * Extract terms from recent turns
   * PATTERN: Term extraction
   */
  private extractTermsFromRecentTurns(contextWindow: ContextWindow, maxTurns: number): string[] {
    const recentTurns = contextWindow.turns.slice(-maxTurns);
    const terms: string[] = [];
    
    for (const turn of recentTurns) {
      const turnTerms = this.extractKeyPhrases(turn.userQuery + ' ' + turn.systemResponse);
      terms.push(...turnTerms);
    }
    
    return [...new Set(terms)];
  }

  /**
   * Extract key phrases from text
   * PATTERN: Key phrase extraction
   */
  private extractKeyPhrases(text: string): string[] {
    // Simple key phrase extraction
    const words = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // Remove common stop words
    const stopWords = new Set(['this', 'that', 'with', 'have', 'will', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were']);
    
    return words.filter(word => !stopWords.has(word)).slice(0, 10);
  }

  /**
   * Get context statistics
   * PATTERN: Statistics retrieval
   */
  getStats(): ContextStats {
    return { ...this.stats };
  }

  /**
   * Health check for context manager
   * PATTERN: Health monitoring
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      // Check cache size
      const cacheSize = this.contextCache.size;
      
      // Check database connectivity
      const { error } = await this.supabase
        .from('conversation_contexts')
        .select('count')
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      return {
        status: 'healthy',
        details: {
          cacheSize,
          totalConversations: this.stats.totalConversations,
          averageRetrievalTime: this.stats.averageRetrievalTime,
          cacheHitRate: this.stats.cacheHitRate
        }
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Clear context cache
   * PATTERN: Cache management
   */
  clearCache(): void {
    this.contextCache.clear();
  }

  /**
   * Update configuration
   * PATTERN: Runtime configuration
   */
  updateConfig(updates: Partial<ContextConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get current configuration
   * PATTERN: Configuration access
   */
  getConfig(): ContextConfig {
    return { ...this.config };
  }
}

/**
 * Factory function to create ContextManager
 * PATTERN: Factory pattern
 */
export function createContextManager(
  config: ContextConfig,
  supabase: TenantAwareSupabase,
  env: CloudflareEnv,
  embeddingService: EmbeddingService,
  vectorSearch: VectorSearchService
): ContextManager {
  return new ContextManager(config, supabase, env, embeddingService, vectorSearch);
}

/**
 * Default context configuration
 * PATTERN: Default configuration
 */
export function getDefaultContextConfig(): ContextConfig {
  return {
    maxContextLength: 8000,
    maxTurns: 20,
    contextWindow: 4000,
    similarityThreshold: 0.7,
    enableContextCompression: true,
    enableSemanticClustering: false,
    compressionRatio: 0.7,
    cacheTtl: 3600000, // 1 hour
    enableContextPersistence: true,
    contextRetentionDays: 30
  };
}