/**
 * AIDA Platform - Conversation History Memory
 * CRITICAL: Tracks conversation context by remoteJid with summarization
 * PATTERN: Follows LangChain memory patterns but optimized for WhatsApp conversations
 */
import { createEmbeddingService } from '../rag/embedding-service';
/**
 * Conversation memory manager
 * CRITICAL: Maintains conversation context and history for AI responses
 */
export class ConversationHistoryManager {
    supabase;
    embeddingService;
    businessId;
    constructor(supabase, businessId, embeddingConfig) {
        this.supabase = supabase;
        this.businessId = businessId;
        this.embeddingService = createEmbeddingService(embeddingConfig);
    }
    /**
     * Get or create conversation by remoteJid
     * CRITICAL: Primary method for WhatsApp conversation tracking
     */
    async getOrCreateConversation(assistantId, remoteJid, customerName) {
        try {
            // First, try to get existing conversation
            const { data: existingConversation, error: fetchError } = await this.supabase
                .from('conversations')
                .select('*')
                .eq('assistant_id', assistantId)
                .eq('remote_jid', remoteJid)
                .eq('status', 'active')
                .single();
            if (existingConversation && !fetchError) {
                return existingConversation;
            }
            // Create new conversation if not found
            const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const newConversation = {
                id: conversationId,
                assistant_id: assistantId,
                remote_jid: remoteJid,
                customer_name: customerName,
                status: 'active',
                priority: 'medium',
                context_summary: '',
                embeddings: [],
                tags: [],
                metadata: {
                    whatsapp_info: {
                        remoteJid,
                        lastSeen: new Date(),
                        messageCount: 0
                    }
                },
                created_at: new Date(),
                last_message_at: new Date(),
                updated_at: new Date()
            };
            const { data: createdConversation, error: createError } = await this.supabase
                .from('conversations')
                .insert(newConversation)
                .select()
                .single();
            if (createError || !createdConversation) {
                console.error('Failed to create conversation:', createError);
                throw new Error('Failed to create conversation');
            }
            console.log(`New conversation created: ${conversationId} for ${remoteJid}`);
            return createdConversation;
        }
        catch (error) {
            console.error('Error getting/creating conversation:', error);
            throw error;
        }
    }
    /**
     * Add message to conversation with embedding generation
     * CRITICAL: Stores message and updates conversation context
     */
    async addMessage(conversationId, content, senderType, messageType = 'text', metadata = {}) {
        try {
            // Generate embedding for the message content
            const { embedding } = await this.embeddingService.generateEmbedding(content);
            // Create message record
            const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const message = {
                id: messageId,
                conversation_id: conversationId,
                content,
                sender_type: senderType,
                message_type: messageType,
                timestamp: new Date(),
                embeddings: embedding,
                metadata,
                is_processed: true
            };
            const { data: createdMessage, error: msgError } = await this.supabase
                .from('messages')
                .insert(message)
                .select()
                .single();
            if (msgError || !createdMessage) {
                console.error('Failed to create message:', msgError);
                throw new Error('Failed to create message');
            }
            // Update conversation last_message_at and potentially summarize
            await this.updateConversationAfterMessage(conversationId, content);
            return createdMessage;
        }
        catch (error) {
            console.error('Error adding message:', error);
            throw error;
        }
    }
    /**
     * Get conversation context for AI response generation
     * CRITICAL: Provides context window for LangChain processing
     */
    async getConversationContext(conversationId, options = {}) {
        try {
            const { maxMessages = 10, includeSummary = true, includeCustomerProfile = true, timeWindow = 24 * 60 * 60 * 1000 // 24 hours
             } = options;
            // Get conversation details
            const { data: conversation, error: convError } = await this.supabase
                .from('conversations')
                .select(`
          *,
          assistant:assistants(id, name, personality_prompt, system_prompt, settings)
        `)
                .eq('id', conversationId)
                .single();
            if (convError || !conversation) {
                throw new Error('Conversation not found');
            }
            // Get recent messages
            const { data: messages, error: msgError } = await this.supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .gte('timestamp', new Date(Date.now() - timeWindow).toISOString())
                .order('timestamp', { ascending: false })
                .limit(maxMessages);
            if (msgError) {
                console.error('Failed to fetch messages:', msgError);
                throw new Error('Failed to fetch conversation messages');
            }
            // Get conversation summary if needed
            let summary = null;
            if (includeSummary) {
                summary = await this.getConversationSummary(conversationId);
            }
            // Build customer profile if needed
            let customerProfile = null;
            if (includeCustomerProfile) {
                customerProfile = await this.buildCustomerProfile(conversation.remote_jid);
            }
            // Calculate conversation metrics
            const totalMessages = messages?.length || 0;
            const customerMessages = messages?.filter(m => m.sender_type === 'customer').length || 0;
            const assistantMessages = messages?.filter(m => m.sender_type === 'assistant').length || 0;
            return {
                conversation,
                recentMessages: (messages || []).reverse(), // Reverse to chronological order
                summary,
                customerProfile,
                metrics: {
                    totalMessages,
                    customerMessages,
                    assistantMessages,
                    avgResponseTime: this.calculateAverageResponseTime(messages || []),
                    lastInteraction: messages?.[0]?.timestamp || conversation.created_at
                },
                context: {
                    businessId: this.businessId,
                    remoteJid: conversation.remote_jid,
                    conversationId,
                    assistantId: conversation.assistant_id,
                    currentStatus: conversation.status,
                    priority: conversation.priority
                }
            };
        }
        catch (error) {
            console.error('Error getting conversation context:', error);
            throw error;
        }
    }
    /**
     * Search conversation history using vector similarity
     * CRITICAL: Enables RAG retrieval from conversation history
     */
    async searchConversationHistory(query, assistantId, limit = 5) {
        try {
            // Generate embedding for search query
            const { embedding } = await this.embeddingService.generateEmbedding(query);
            // Search using pgvector similarity
            const { data: results, error } = await this.supabase.rpc('search_conversation_messages', {
                query_embedding: embedding,
                assistant_id: assistantId,
                business_id: this.businessId,
                similarity_threshold: 0.7,
                match_count: limit
            });
            if (error) {
                console.error('Conversation search failed:', error);
                throw new Error('Failed to search conversation history');
            }
            return results || [];
        }
        catch (error) {
            console.error('Error searching conversation history:', error);
            throw error;
        }
    }
    /**
     * Get conversation summary for long conversations
     * CRITICAL: Provides compressed context for token efficiency
     */
    async getConversationSummary(conversationId) {
        try {
            const { data: summary, error } = await this.supabase
                .from('conversation_summaries')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            if (error || !summary) {
                return null;
            }
            return summary;
        }
        catch (error) {
            console.error('Error getting conversation summary:', error);
            return null;
        }
    }
    /**
     * Update conversation summary (triggered when message count exceeds threshold)
     * CRITICAL: Maintains conversation context for long chats
     */
    async updateConversationSummary(conversationId) {
        try {
            // Get messages for summarization
            const { data: messages, error } = await this.supabase
                .from('messages')
                .select('content, sender_type, timestamp')
                .eq('conversation_id', conversationId)
                .order('timestamp', { ascending: true });
            if (error || !messages || messages.length < 10) {
                return; // Don't summarize if not enough messages
            }
            // Create conversation summary using AI
            const conversationText = messages
                .map(m => `${m.sender_type}: ${m.content}`)
                .join('\n');
            // This would use LangChain to generate a summary
            const summary = await this.generateConversationSummary(conversationText);
            // Store summary with embedding
            const { embedding } = await this.embeddingService.generateEmbedding(summary.content);
            const summaryRecord = {
                conversation_id: conversationId,
                content: summary.content,
                key_topics: summary.keyTopics,
                customer_intent: summary.customerIntent,
                resolution_status: summary.resolutionStatus,
                embeddings: embedding,
                message_count: messages.length,
                created_at: new Date()
            };
            await this.supabase
                .from('conversation_summaries')
                .insert(summaryRecord);
            console.log(`Summary updated for conversation ${conversationId}`);
        }
        catch (error) {
            console.error('Error updating conversation summary:', error);
        }
    }
    /**
     * Build customer profile from conversation history
     * CRITICAL: Enables personalized responses
     */
    async buildCustomerProfile(remoteJid) {
        try {
            // Get all conversations for this customer
            const { data: conversations, error } = await this.supabase
                .from('conversations')
                .select(`
          *,
          messages(content, sender_type, timestamp)
        `)
                .eq('remote_jid', remoteJid)
                .order('created_at', { ascending: false })
                .limit(5); // Last 5 conversations
            if (error) {
                console.error('Failed to fetch customer conversations:', error);
                throw new Error('Failed to build customer profile');
            }
            const totalConversations = conversations?.length || 0;
            const totalMessages = conversations?.reduce((sum, conv) => sum + (conv.messages?.length || 0), 0) || 0;
            // Analyze conversation patterns
            const customerMessages = conversations?.flatMap(conv => conv.messages?.filter((m) => m.sender_type === 'customer') || []) || [];
            // Extract customer insights
            const commonTopics = this.extractTopics(customerMessages);
            const sentiment = this.analyzeSentiment(customerMessages);
            const preferredLanguage = this.detectLanguage(customerMessages);
            return {
                remoteJid,
                name: conversations?.[0]?.customer_name || null,
                totalConversations,
                totalMessages,
                firstContact: conversations?.[totalConversations - 1]?.created_at || new Date(),
                lastContact: conversations?.[0]?.last_message_at || new Date(),
                commonTopics,
                sentiment,
                preferredLanguage,
                conversationStyle: this.analyzeConversationStyle(customerMessages),
                previousIssues: this.extractPreviousIssues(conversations || [])
            };
        }
        catch (error) {
            console.error('Error building customer profile:', error);
            // Return basic profile on error
            return {
                remoteJid,
                name: null,
                totalConversations: 0,
                totalMessages: 0,
                firstContact: new Date(),
                lastContact: new Date(),
                commonTopics: [],
                sentiment: 'neutral',
                preferredLanguage: 'pt',
                conversationStyle: 'standard',
                previousIssues: []
            };
        }
    }
    /**
     * Update conversation metadata after message addition
     */
    async updateConversationAfterMessage(conversationId, content) {
        try {
            // Update last_message_at
            await this.supabase
                .from('conversations')
                .update({
                last_message_at: new Date(),
                updated_at: new Date()
            })
                .eq('id', conversationId);
            // Check if summarization is needed
            const { count: messageCount } = await this.supabase
                .from('messages')
                .select('id', { count: 'exact' })
                .eq('conversation_id', conversationId);
            // Trigger summarization every 50 messages
            if (messageCount && messageCount % 50 === 0) {
                await this.updateConversationSummary(conversationId);
            }
        }
        catch (error) {
            console.error('Error updating conversation after message:', error);
        }
    }
    /**
     * Calculate average response time from messages
     */
    calculateAverageResponseTime(messages) {
        const responseTimes = [];
        for (let i = 1; i < messages.length; i++) {
            const prevMsg = messages[i - 1];
            const currMsg = messages[i];
            if (prevMsg.sender_type === 'customer' && currMsg.sender_type === 'assistant') {
                const responseTime = new Date(currMsg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime();
                responseTimes.push(responseTime);
            }
        }
        if (responseTimes.length === 0) {
            return 0;
        }
        return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    }
    /**
     * Generate conversation summary using AI
     */
    async generateConversationSummary(conversationText) {
        // This would integrate with LangChain to generate summaries
        // For now, return a basic summary
        const lines = conversationText.split('\n');
        const customerLines = lines.filter(line => line.startsWith('customer:'));
        return {
            content: `Conversation with ${customerLines.length} customer messages. Last message: ${lines[lines.length - 1]}`,
            keyTopics: ['general_inquiry'],
            customerIntent: 'information_seeking',
            resolutionStatus: 'pending'
        };
    }
    /**
     * Extract topics from customer messages
     */
    extractTopics(messages) {
        // Simple keyword extraction - would use NLP in production
        const commonWords = messages
            .flatMap(m => m.content.toLowerCase().split(/\s+/))
            .filter(word => word.length > 3)
            .reduce((acc, word) => {
            acc[word] = (acc[word] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(commonWords)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([word]) => word);
    }
    /**
     * Analyze sentiment from customer messages
     */
    analyzeSentiment(messages) {
        // Simple sentiment analysis - would use proper NLP in production
        const text = messages.map(m => m.content).join(' ').toLowerCase();
        const positiveWords = ['obrigado', 'thanks', 'ótimo', 'bom', 'excelente'];
        const negativeWords = ['problema', 'ruim', 'péssimo', 'erro', 'falha'];
        const positiveCount = positiveWords.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0);
        const negativeCount = negativeWords.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0);
        if (positiveCount > negativeCount) {
            return 'positive';
        }
        if (negativeCount > positiveCount) {
            return 'negative';
        }
        return 'neutral';
    }
    /**
     * Detect primary language from messages
     */
    detectLanguage(messages) {
        // Simple language detection - would use proper detection in production
        const text = messages.map(m => m.content).join(' ').toLowerCase();
        const portugueseWords = ['olá', 'obrigado', 'por favor', 'como', 'que'];
        const englishWords = ['hello', 'thank', 'please', 'how', 'what'];
        const ptCount = portugueseWords.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0);
        const enCount = englishWords.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0);
        return ptCount > enCount ? 'pt' : 'en';
    }
    /**
     * Analyze conversation style
     */
    analyzeConversationStyle(messages) {
        // Simple style analysis
        const text = messages.map(m => m.content).join(' ').toLowerCase();
        if (text.includes('senhor') || text.includes('vossa')) {
            return 'formal';
        }
        if (text.includes('😊') || text.includes('rs') || text.includes('kk')) {
            return 'casual';
        }
        return 'standard';
    }
    /**
     * Extract previous issues from conversations
     */
    extractPreviousIssues(conversations) {
        return conversations
            .filter(conv => conv.status === 'resolved')
            .map(conv => conv.context_summary)
            .filter(summary => summary && summary.length > 0)
            .slice(0, 3);
    }
}
/**
 * Factory function to create conversation history manager
 */
export function createConversationHistoryManager(supabase, businessId, embeddingConfig) {
    return new ConversationHistoryManager(supabase, businessId, embeddingConfig);
}
