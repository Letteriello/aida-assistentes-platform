/**
 * AIDA Platform - Conversation Manager Durable Object
 * CRITICAL: Stateful conversation management with real-time processing
 * Handles conversation state, message queuing, and context persistence
 */
import { ConversationHistoryManager } from '../memory/conversation-history';
import { createTenantAwareSupabase } from '../database/client';
import { WhatsAppMessageFormatter } from '../evolution-api/message-formatter';
export class ConversationManager extends DurableObject {
    state;
    env;
    conversationState = null;
    messageQueue = [];
    historyManager = null;
    messageFormatter = null;
    cleanupTimer = null;
    constructor(state, env) {
        super(state, env);
        this.state = state;
        this.env = env;
        // Set up automatic cleanup after 1 hour of inactivity
        this.scheduleCleanup();
    }
    /**
     * Initialize conversation state
     * CRITICAL: Sets up conversation context and dependencies
     */
    async initializeConversation(conversationId, businessId, assistantId, remoteJid) {
        try {
            // Load existing state or create new
            this.conversationState = await this.state.storage.get('conversation') || {
                conversationId,
                businessId,
                assistantId,
                remoteJid,
                lastActivity: Date.now(),
                messageCount: 0,
                context: {
                    lastMessages: [],
                    pendingResponses: [],
                    isTyping: false,
                    escalationRequested: false
                },
                metadata: {}
            };
            // Initialize dependencies
            const supabase = createTenantAwareSupabase(this.env, businessId);
            this.historyManager = new ConversationHistoryManager(supabase, businessId, {
                openaiApiKey: this.env.OPENAI_API_KEY,
                model: this.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'
            });
            this.messageFormatter = new WhatsAppMessageFormatter();
            // Load message queue
            this.messageQueue = await this.state.storage.get('messageQueue') || [];
            console.log(`ConversationManager initialized for ${remoteJid}`);
        }
        catch (error) {
            console.error('Error initializing conversation:', error);
            throw error;
        }
    }
    /**
     * Process incoming message
     * CRITICAL: Main message processing pipeline
     */
    async processMessage(messageId, content, messageType = 'text', metadata = {}) {
        try {
            if (!this.conversationState) {
                throw new Error('Conversation not initialized');
            }
            // Create message object
            const message = {
                messageId,
                content,
                sender: 'customer',
                messageType,
                timestamp: Date.now(),
                metadata,
                processed: false,
                responseGenerated: false
            };
            // Add to queue
            this.messageQueue.push(message);
            // Update conversation state
            this.conversationState.lastActivity = Date.now();
            this.conversationState.messageCount++;
            this.conversationState.context.lastMessages.push({
                content,
                sender: 'customer',
                timestamp: message.timestamp,
                messageId
            });
            // Keep only last 10 messages in memory
            if (this.conversationState.context.lastMessages.length > 10) {
                this.conversationState.context.lastMessages =
                    this.conversationState.context.lastMessages.slice(-10);
            }
            // Store in database if history manager is available
            let messageStored = false;
            if (this.historyManager) {
                try {
                    await this.historyManager.addMessage(this.conversationState.conversationId, content, 'customer', messageType, metadata);
                    messageStored = true;
                    message.processed = true;
                }
                catch (error) {
                    console.error('Error storing message in database:', error);
                }
            }
            // Persist state
            await this.persistState();
            // Determine if response is needed
            const responseNeeded = this.shouldGenerateResponse(message);
            console.log(`Message processed: ${messageId}, response needed: ${responseNeeded}`);
            return {
                success: true,
                responseNeeded,
                messageStored
            };
        }
        catch (error) {
            console.error('Error processing message:', error);
            return {
                success: false,
                responseNeeded: false,
                messageStored: false
            };
        }
    }
    /**
     * Add assistant response to conversation
     */
    async addAssistantResponse(responseId, content, metadata = {}) {
        try {
            if (!this.conversationState) {
                throw new Error('Conversation not initialized');
            }
            // Create response message
            const response = {
                messageId: responseId,
                content,
                sender: 'assistant',
                messageType: 'text',
                timestamp: Date.now(),
                metadata,
                processed: true,
                responseGenerated: true
            };
            // Add to queue and context
            this.messageQueue.push(response);
            this.conversationState.context.lastMessages.push({
                content,
                sender: 'assistant',
                timestamp: response.timestamp,
                messageId: responseId
            });
            // Update state
            this.conversationState.lastActivity = Date.now();
            this.conversationState.context.isTyping = false;
            // Remove from pending responses
            this.conversationState.context.pendingResponses =
                this.conversationState.context.pendingResponses.filter(id => id !== responseId);
            // Store in database
            if (this.historyManager) {
                await this.historyManager.addMessage(this.conversationState.conversationId, content, 'assistant', 'text', metadata);
            }
            await this.persistState();
            return true;
        }
        catch (error) {
            console.error('Error adding assistant response:', error);
            return false;
        }
    }
    /**
     * Get conversation context for AI processing
     */
    async getConversationContext() {
        if (!this.conversationState) {
            return null;
        }
        return {
            conversationId: this.conversationState.conversationId,
            businessId: this.conversationState.businessId,
            assistantId: this.conversationState.assistantId,
            remoteJid: this.conversationState.remoteJid,
            recentMessages: this.conversationState.context.lastMessages,
            customerProfile: {
                name: this.conversationState.context.customerName,
                phone: this.conversationState.context.customerPhone,
                messageCount: this.conversationState.messageCount
            },
            metadata: this.conversationState.metadata
        };
    }
    /**
     * Set typing indicator
     */
    async setTyping(isTyping) {
        if (this.conversationState) {
            this.conversationState.context.isTyping = isTyping;
            this.conversationState.lastActivity = Date.now();
            await this.persistState();
        }
    }
    /**
     * Request escalation to human agent
     */
    async requestEscalation(reason) {
        if (this.conversationState) {
            this.conversationState.context.escalationRequested = true;
            this.conversationState.metadata.escalationReason = reason;
            this.conversationState.metadata.escalationTime = Date.now();
            await this.persistState();
        }
    }
    /**
     * Get conversation statistics
     */
    async getStats() {
        const now = Date.now();
        const isActive = this.conversationState ?
            (now - this.conversationState.lastActivity) < 300000 : false; // 5 minutes
        return {
            messageCount: this.conversationState?.messageCount || 0,
            lastActivity: this.conversationState?.lastActivity || 0,
            queueLength: this.messageQueue.length,
            pendingResponses: this.conversationState?.context.pendingResponses.length || 0,
            isActive
        };
    }
    /**
     * Determine if response should be generated
     */
    shouldGenerateResponse(message) {
        // Skip if message is empty or too short
        if (!message.content || message.content.trim().length < 2) {
            return false;
        }
        // Skip if escalation is requested
        if (this.conversationState?.context.escalationRequested) {
            return false;
        }
        // Skip if already typing
        if (this.conversationState?.context.isTyping) {
            return false;
        }
        // Generate response for text messages
        return message.messageType === 'text';
    }
    /**
     * Persist conversation state to durable storage
     */
    async persistState() {
        try {
            if (this.conversationState) {
                await this.state.storage.put('conversation', this.conversationState);
            }
            await this.state.storage.put('messageQueue', this.messageQueue);
        }
        catch (error) {
            console.error('Error persisting conversation state:', error);
        }
    }
    /**
     * Schedule automatic cleanup
     */
    scheduleCleanup() {
        // Clean up after 1 hour of inactivity
        if (this.cleanupTimer) {
            clearTimeout(this.cleanupTimer);
        }
        this.cleanupTimer = setTimeout(() => {
            this.cleanup();
        }, 3600000); // 1 hour
    }
    /**
     * Cleanup resources and persist final state
     */
    async cleanup() {
        try {
            console.log('ConversationManager cleanup initiated');
            // Persist final state
            await this.persistState();
            // Clear timers
            if (this.cleanupTimer) {
                clearTimeout(this.cleanupTimer);
                this.cleanupTimer = null;
            }
            // Reset state
            this.conversationState = null;
            this.messageQueue = [];
            this.historyManager = null;
            this.messageFormatter = null;
            console.log('ConversationManager cleanup completed');
        }
        catch (error) {
            console.error('Error during ConversationManager cleanup:', error);
        }
    }
    /**
     * Alarm handler for automatic cleanup
     */
    async alarm() {
        await this.cleanup();
    }
    /**
     * HTTP request handler for external API calls
     */
    async fetch(request) {
        try {
            const url = new URL(request.url);
            const method = request.method;
            // Parse request body if present
            let body = {};
            if (request.headers.get('content-type')?.includes('application/json')) {
                body = await request.json();
            }
            switch (url.pathname) {
                case '/initialize':
                    if (method === 'POST') {
                        await this.initializeConversation(body.conversationId, body.businessId, body.assistantId, body.remoteJid);
                        return new Response(JSON.stringify({ success: true }), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                    break;
                case '/message':
                    if (method === 'POST') {
                        const result = await this.processMessage(body.messageId, body.content, body.messageType, body.metadata);
                        return new Response(JSON.stringify(result), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                    break;
                case '/response':
                    if (method === 'POST') {
                        const success = await this.addAssistantResponse(body.responseId, body.content, body.metadata);
                        return new Response(JSON.stringify({ success }), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                    break;
                case '/context':
                    if (method === 'GET') {
                        const context = await this.getConversationContext();
                        return new Response(JSON.stringify(context), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                    break;
                case '/stats':
                    if (method === 'GET') {
                        const stats = await this.getStats();
                        return new Response(JSON.stringify(stats), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                    break;
                case '/typing':
                    if (method === 'POST') {
                        await this.setTyping(body.isTyping);
                        return new Response(JSON.stringify({ success: true }), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                    break;
                case '/escalate':
                    if (method === 'POST') {
                        await this.requestEscalation(body.reason);
                        return new Response(JSON.stringify({ success: true }), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                    break;
                default:
                    return new Response('Not Found', { status: 404 });
            }
            return new Response('Method Not Allowed', { status: 405 });
        }
        catch (error) {
            console.error('ConversationManager request error:', error);
            return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
}
