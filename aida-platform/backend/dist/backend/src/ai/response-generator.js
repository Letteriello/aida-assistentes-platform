/**
 * AIDA Platform - AI Response Generator
 * Orchestrates the complete AI pipeline: RAG + LangChain + Memory + Formatting
 * CRITICAL: Main AI engine that generates intelligent WhatsApp responses
 */
import { logSecurityEvent } from '../database/security';
/**
 * AI Response Generator - Complete AI Pipeline Orchestration
 * PATTERN: Coordinated AI pipeline with quality controls and monitoring
 */
export class AIResponseGenerator {
    config;
    stats;
    activeRequests = new Map();
    // Response quality tracking
    responseQuality = {
        contentFiltered: 0,
        factCheckFailed: 0,
        lowConfidence: 0,
        escalations: 0
    };
    constructor(config) {
        this.config = config;
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageProcessingTime: 0,
            averageConfidence: 0,
            escalationRate: 0,
            fallbackRate: 0
        };
    }
    /**
     * Generate AI response for incoming message
     * CRITICAL: Main response generation entry point
     */
    async generateResponse(request) {
        const requestId = this.generateRequestId();
        const startTime = performance.now();
        console.log(`Generating response for request ${requestId}: "${request.message}"`);
        try {
            this.stats.totalRequests++;
            // Validate request
            this.validateRequest(request);
            // Check for duplicate processing
            const duplicateKey = `${request.conversationId}-${this.hashMessage(request.message)}`;
            if (this.activeRequests.has(duplicateKey)) {
                console.log(`Duplicate request detected: ${duplicateKey}`);
                return await this.activeRequests.get(duplicateKey);
            }
            // Process request with timeout
            const processingPromise = this.processWithTimeout(request, requestId, startTime);
            this.activeRequests.set(duplicateKey, processingPromise);
            try {
                const result = await processingPromise;
                this.updateSuccessStats(result);
                return result;
            }
            finally {
                this.activeRequests.delete(duplicateKey);
            }
        }
        catch (error) {
            this.stats.failedRequests++;
            console.error(`Response generation failed for request ${requestId}:`, error);
            // Log security event for suspicious activity
            logSecurityEvent('ai_failure', {
                requestId,
                assistantId: request.assistantId,
                error: error instanceof Error ? error.message : String(error)
            }, request.businessId);
            return this.createErrorResponse(requestId, request, 'unknown', error instanceof Error ? error.message : 'Unknown error occurred', startTime);
        }
    }
    /**
     * Process request with timeout protection
     * PATTERN: Timeout-protected AI processing
     */
    async processWithTimeout(request, requestId, startTime) {
        return Promise.race([
            this.processRequest(request, requestId, startTime),
            this.createTimeoutPromise(requestId, request, startTime)
        ]);
    }
    /**
     * Core request processing logic
     * PATTERN: Complete AI pipeline execution
     */
    async processRequest(request, requestId, startTime) {
        // 1. Load conversation context
        const context = await this.loadConversationContext(request);
        // 2. Pre-process message and update embeddings if needed
        await this.preprocessMessage(request, context);
        // 3. Generate AI response using LangChain + RAG
        const aiResponse = await this.generateAIResponse(request, context);
        // 4. Post-process response (quality controls)
        const processedResponse = await this.postProcessResponse(aiResponse, request, context);
        // 5. Format response for WhatsApp
        const formattedMessages = this.formatResponse(processedResponse, context);
        // 6. Store response in database
        await this.storeResponse(request, processedResponse, context);
        const processingTime = performance.now() - startTime;
        return {
            success: true,
            response: {
                content: processedResponse,
                formattedMessages,
                processingTimeMs: processingTime,
                confidence: processedResponse.confidence,
                shouldEscalate: processedResponse.should_escalate
            },
            metadata: {
                requestId,
                timestamp: new Date(),
                assistantId: request.assistantId,
                conversationId: request.conversationId,
                fallbackUsed: false
            }
        };
    }
    /**
     * Load complete conversation context for AI processing
     * PATTERN: Context aggregation from multiple sources
     */
    async loadConversationContext(request) {
        try {
            // Load assistant
            const assistants = await this.config.supabase.query('assistants', '*', { id: request.assistantId, is_active: true });
            if (assistants.length === 0) {
                throw new Error(`Assistant not found: ${request.assistantId}`);
            }
            // Load conversation
            const conversations = await this.config.supabase.query('conversations', '*', { id: request.conversationId });
            if (conversations.length === 0) {
                throw new Error(`Conversation not found: ${request.conversationId}`);
            }
            // Build customer profile
            const customerProfile = await this.buildCustomerProfile(request.conversationId, request.customerMetadata);
            return {
                assistant: assistants[0],
                conversation: conversations[0],
                businessId: request.businessId,
                customerProfile
            };
        }
        catch (error) {
            console.error('Failed to load conversation context:', error);
            throw new Error(`Context loading failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Build customer profile from conversation history and metadata
     * PATTERN: Customer intelligence aggregation
     */
    async buildCustomerProfile(conversationId, customerMetadata) {
        try {
            // Get conversation statistics
            const messages = await this.config.supabase.query('messages', 'sender_type, content, timestamp', { conversation_id: conversationId });
            const customerMessages = messages.filter(m => m.sender_type === 'customer');
            const previousInteractions = customerMessages.length;
            // Analyze sentiment from recent messages
            const recentMessages = customerMessages
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 5);
            const sentiment = this.analyzeSentiment(recentMessages.map(m => m.content));
            return {
                name: customerMetadata?.name,
                phone: customerMetadata?.phone,
                previousInteractions,
                sentiment: customerMetadata?.sentiment || sentiment,
                preferredLanguage: customerMetadata?.language || 'pt'
            };
        }
        catch (error) {
            console.error('Failed to build customer profile:', error);
            return {
                previousInteractions: 0,
                sentiment: 'neutral',
                preferredLanguage: 'pt'
            };
        }
    }
    /**
     * Pre-process incoming message and update embeddings
     * PATTERN: Message preprocessing with embedding generation
     */
    async preprocessMessage(request, context) {
        try {
            // Generate embedding for the incoming message
            await this.config.embeddingService.queueEmbeddingRequest({
                text: request.message,
                metadata: {
                    source: 'message',
                    sourceId: request.conversationId,
                    businessId: request.businessId
                }
            });
            // Update conversation context if this is a significant message
            if (request.message.length > 50) {
                const currentSummary = context.conversation.context_summary || '';
                const updatedSummary = this.updateConversationSummary(currentSummary, request.message);
                await this.config.supabase.update('conversations', context.conversation.id, { context_summary: updatedSummary });
            }
        }
        catch (error) {
            console.error('Message preprocessing failed:', error);
            // Continue processing even if preprocessing fails
        }
    }
    /**
     * Generate AI response using LangChain processor
     * PATTERN: AI response generation with context
     */
    async generateAIResponse(request, context) {
        const processingOptions = {
            includeRAG: true,
            useMemory: true,
            maxContextLength: context.assistant.settings.max_response_length || 500,
            confidenceThreshold: context.assistant.settings.confidence_threshold || 0.7,
            escalationKeywords: context.assistant.settings.escalation_keywords || [],
            responseStyle: this.determineResponseStyle(context),
            ...request.processingOptions
        };
        return await this.config.langChainProcessor.processMessage(request.message, context, processingOptions);
    }
    /**
     * Post-process AI response with quality controls
     * PATTERN: Response quality assurance
     */
    async postProcessResponse(response, request, context) {
        let processedResponse = { ...response };
        // Content filtering
        if (this.config.enableContentFilter) {
            const filterResult = this.filterContent(processedResponse.content);
            if (!filterResult.isAppropriate) {
                this.responseQuality.contentFiltered++;
                processedResponse = await this.generateFallbackResponse(request, context);
            }
        }
        // Fact checking (simplified implementation)
        if (this.config.enableFactChecking && processedResponse.confidence < 0.6) {
            processedResponse.content += '\n\nPlease verify this information with our team if needed.';
            processedResponse.confidence = Math.max(processedResponse.confidence, 0.4);
        }
        // Personalization
        if (this.config.enablePersonalization && context.customerProfile?.name) {
            processedResponse.content = this.personalizeResponse(processedResponse.content, context.customerProfile.name);
        }
        // Low confidence handling
        if (processedResponse.confidence < this.config.confidenceThreshold) {
            this.responseQuality.lowConfidence++;
            processedResponse.should_escalate = true;
        }
        return processedResponse;
    }
    /**
     * Format AI response for WhatsApp delivery
     * PATTERN: Response formatting for messaging platform
     */
    formatResponse(response, context) {
        // Configure formatter based on assistant settings
        this.config.messageFormatter.updateConfig({
            maxMessageLength: context.assistant.settings.max_response_length || 500,
            businessStyle: this.determineResponseStyle(context),
            enableEmojis: true,
            enableFormatting: true
        });
        return this.config.messageFormatter.formatResponse(response);
    }
    /**
     * Store AI response in database for tracking
     * PATTERN: Response persistence and analytics
     */
    async storeResponse(request, response, context) {
        try {
            // Store the assistant's response message
            await this.config.supabase.insert('messages', {
                conversation_id: request.conversationId,
                content: response.content,
                sender_type: 'assistant',
                message_type: 'text',
                timestamp: new Date(),
                metadata: {
                    confidence_score: response.confidence,
                    intent: response.intent,
                    entities: response.entities,
                    processing_time_ms: response.processing_time_ms,
                    sources: response.sources
                },
                is_processed: true,
                processing_time_ms: response.processing_time_ms
            });
            // Update assistant metrics
            const currentMetrics = context.assistant.metrics || {
                total_conversations: 0,
                total_messages: 0,
                avg_response_time_ms: 0,
                satisfaction_rating: 0
            };
            const updatedMetrics = {
                ...currentMetrics,
                total_messages: currentMetrics.total_messages + 1,
                avg_response_time_ms: Math.round(((currentMetrics.avg_response_time_ms * (currentMetrics.total_messages - 1)) +
                    response.processing_time_ms) / currentMetrics.total_messages),
                last_active_at: new Date()
            };
            await this.config.supabase.update('assistants', context.assistant.id, { metrics: updatedMetrics });
        }
        catch (error) {
            console.error('Failed to store response:', error);
            // Don't throw error - response generation was successful
        }
    }
    /**
     * Utility methods
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    hashMessage(message) {
        // Simple hash for duplicate detection
        let hash = 0;
        for (let i = 0; i < message.length; i++) {
            const char = message.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
    validateRequest(request) {
        if (!request.message || request.message.trim().length === 0) {
            throw new Error('Message is required');
        }
        if (!request.conversationId || !request.assistantId || !request.businessId) {
            throw new Error('Conversation ID, Assistant ID, and Business ID are required');
        }
        if (request.message.length > 4000) {
            throw new Error('Message too long');
        }
    }
    determineResponseStyle(context) {
        // Simple style determination based on business type or assistant settings
        // In practice, this could be more sophisticated
        return 'friendly';
    }
    analyzeSentiment(messages) {
        // Simplified sentiment analysis
        const positiveWords = ['good', 'great', 'excellent', 'happy', 'satisfied', 'love'];
        const negativeWords = ['bad', 'terrible', 'awful', 'angry', 'frustrated', 'hate'];
        let positiveCount = 0;
        let negativeCount = 0;
        messages.forEach(message => {
            const lowerMessage = message.toLowerCase();
            positiveWords.forEach(word => {
                if (lowerMessage.includes(word)) {
                    positiveCount++;
                }
            });
            negativeWords.forEach(word => {
                if (lowerMessage.includes(word)) {
                    negativeCount++;
                }
            });
        });
        if (positiveCount > negativeCount) {
            return 'positive';
        }
        if (negativeCount > positiveCount) {
            return 'negative';
        }
        return 'neutral';
    }
    updateConversationSummary(currentSummary, newMessage) {
        // Simple summary update - in practice, this could use LLM for better summarization
        const maxSummaryLength = 500;
        const addition = `. Latest: ${newMessage.substring(0, 100)}`;
        if (currentSummary.length + addition.length > maxSummaryLength) {
            return currentSummary.substring(0, maxSummaryLength - addition.length) + addition;
        }
        return currentSummary + addition;
    }
    filterContent(content) {
        // Basic content filtering
        const inappropriatePatterns = [
            /\b(password|token|api[_-]?key)\b/i,
            /\b(credit[_-]?card|ssn)\b/i
        ];
        for (const pattern of inappropriatePatterns) {
            if (pattern.test(content)) {
                return { isAppropriate: false, reason: 'Contains sensitive information' };
            }
        }
        return { isAppropriate: true };
    }
    personalizeResponse(content, customerName) {
        // Simple personalization - add customer name if not already present
        if (!content.toLowerCase().includes(customerName.toLowerCase())) {
            return `${customerName}, ${content}`;
        }
        return content;
    }
    async generateFallbackResponse(request, context) {
        return {
            content: 'I apologize, but I need to connect you with one of our team members to better assist you with this request.',
            confidence: 0.5,
            sources: [],
            processing_time_ms: 0,
            should_escalate: true,
            intent: 'fallback',
            entities: {}
        };
    }
    createTimeoutPromise(requestId, request, startTime) {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Request timeout after ${this.config.maxResponseTime}ms`));
            }, this.config.maxResponseTime);
        });
    }
    createErrorResponse(requestId, request, errorType, message, startTime) {
        return {
            success: false,
            error: {
                type: errorType,
                message
            },
            metadata: {
                requestId,
                timestamp: new Date(),
                assistantId: request.assistantId,
                conversationId: request.conversationId,
                fallbackUsed: true
            }
        };
    }
    updateSuccessStats(result) {
        if (result.success && result.response) {
            this.stats.successfulRequests++;
            // Update averages
            const total = this.stats.successfulRequests;
            this.stats.averageProcessingTime =
                ((this.stats.averageProcessingTime * (total - 1)) + result.response.processingTimeMs) / total;
            this.stats.averageConfidence =
                ((this.stats.averageConfidence * (total - 1)) + result.response.confidence) / total;
            if (result.response.shouldEscalate) {
                this.responseQuality.escalations++;
            }
        }
        // Update rates
        this.stats.escalationRate = this.responseQuality.escalations / this.stats.totalRequests;
        this.stats.fallbackRate = this.stats.failedRequests / this.stats.totalRequests;
    }
    /**
     * Get response generator statistics
     */
    getStats() {
        return {
            ...this.stats,
            qualityMetrics: { ...this.responseQuality }
        };
    }
    /**
     * Update configuration
     */
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
    }
    /**
     * Health check
     */
    async healthCheck() {
        try {
            // Check all components
            const checks = await Promise.all([
                this.config.langChainProcessor.healthCheck(),
                this.config.hybridQueryEngine.healthCheck(),
                this.config.embeddingService.healthCheck(),
                this.config.vectorSearchEngine.healthCheck()
            ]);
            return checks.every(check => check === true);
        }
        catch (error) {
            console.error('Response generator health check failed:', error);
            return false;
        }
    }
}
/**
 * Factory function to create response generator
 */
export function createResponseGenerator(config) {
    return new AIResponseGenerator(config);
}
/**
 * Default response generator configuration
 */
export function getDefaultResponseGeneratorConfig(langChainProcessor, hybridQueryEngine, embeddingService, vectorSearchEngine, messageFormatter, supabase) {
    return {
        langChainProcessor,
        hybridQueryEngine,
        embeddingService,
        vectorSearchEngine,
        messageFormatter,
        supabase,
        maxResponseTime: 30000, // 30 seconds
        enableAsync: true,
        fallbackEnabled: true,
        confidenceThreshold: 0.7,
        enableContentFilter: true,
        enableFactChecking: true,
        enablePersonalization: true
    };
}
