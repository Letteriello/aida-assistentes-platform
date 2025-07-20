import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../database/database';

type ConversationSimplified = Database['public']['Tables']['conversations_simplified']['Row'];
type ConversationInsert = Database['public']['Tables']['conversations_simplified']['Insert'];
type ConversationUpdate = Database['public']['Tables']['conversations_simplified']['Update'];

type MessageSimplified = Database['public']['Tables']['messages_simplified']['Row'];
type MessageInsert = Database['public']['Tables']['messages_simplified']['Insert'];
type MessageUpdate = Database['public']['Tables']['messages_simplified']['Update'];

export interface ConversationWithMessages extends ConversationSimplified {
  messages?: MessageSimplified[];
}

export interface MessageSearchOptions {
  query: string;
  conversationId?: string;
  messageType?: 'text' | 'image' | 'audio' | 'video' | 'document';
  limit?: number;
  threshold?: number;
}

export interface ConversationStats {
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  averageMessagesPerConversation: number;
  messagesByType: Record<string, number>;
}

export class ConversationService {
  private supabase: SupabaseClient<Database>;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    instanceId: string,
    customerPhone: string,
    customerName?: string
  ): Promise<{ success: boolean; conversation?: ConversationSimplified; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('conversations_simplified')
        .insert({
          instance_id: instanceId,
          customer_phone: customerPhone,
          customer_name: customerName,
          status: 'active',
          message_count: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        return { success: false, error: error.message };
      }

      return { success: true, conversation: data };
    } catch (error) {
      console.error('Error creating conversation:', error);
      return { success: false, error: 'Failed to create conversation' };
    }
  }

  /**
   * Get or create a conversation for a customer
   */
  async getOrCreateConversation(
    instanceId: string,
    customerPhone: string,
    customerName?: string
  ): Promise<{ success: boolean; conversation?: ConversationSimplified; error?: string }> {
    try {
      // First try to find an existing active conversation
      const { data: existingConversation, error: findError } = await this.supabase
        .from('conversations_simplified')
        .select('*')
        .eq('instance_id', instanceId)
        .eq('customer_phone', customerPhone)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (findError) {
        console.error('Error finding conversation:', findError);
        return { success: false, error: findError.message };
      }

      if (existingConversation) {
        return { success: true, conversation: existingConversation };
      }

      // Create a new conversation if none exists
      return await this.createConversation(instanceId, customerPhone, customerName);
    } catch (error) {
      console.error('Error getting or creating conversation:', error);
      return { success: false, error: 'Failed to get or create conversation' };
    }
  }

  /**
   * Update conversation status or metadata
   */
  async updateConversation(
    conversationId: string,
    updates: ConversationUpdate
  ): Promise<{ success: boolean; conversation?: ConversationSimplified; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('conversations_simplified')
        .update(updates)
        .eq('id', conversationId)
        .select()
        .single();

      if (error) {
        console.error('Error updating conversation:', error);
        return { success: false, error: error.message };
      }

      return { success: true, conversation: data };
    } catch (error) {
      console.error('Error updating conversation:', error);
      return { success: false, error: 'Failed to update conversation' };
    }
  }

  /**
   * Get conversation by ID with optional messages
   */
  async getConversation(
    conversationId: string,
    includeMessages: boolean = false
  ): Promise<{ success: boolean; conversation?: ConversationWithMessages; error?: string }> {
    try {
      const { data: conversation, error: convError } = await this.supabase
        .from('conversations_simplified')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError) {
        console.error('Error getting conversation:', convError);
        return { success: false, error: convError.message };
      }

      let messages: MessageSimplified[] = [];
      if (includeMessages) {
        const { data: messagesData, error: msgError } = await this.supabase
          .from('messages_simplified')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (msgError) {
          console.error('Error getting messages:', msgError);
          return { success: false, error: msgError.message };
        }

        messages = messagesData || [];
      }

      return {
        success: true,
        conversation: {
          ...conversation,
          messages: includeMessages ? messages : undefined,
        },
      };
    } catch (error) {
      console.error('Error getting conversation:', error);
      return { success: false, error: 'Failed to get conversation' };
    }
  }

  /**
   * List conversations for an instance
   */
  async listConversations(
    instanceId: string,
    options?: {
      status?: 'active' | 'archived' | 'closed';
      limit?: number;
      offset?: number;
      customerPhone?: string;
    }
  ): Promise<{ success: boolean; conversations?: ConversationSimplified[]; total?: number; error?: string }> {
    try {
      let query = this.supabase
        .from('conversations_simplified')
        .select('*', { count: 'exact' })
        .eq('instance_id', instanceId);

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.customerPhone) {
        query = query.eq('customer_phone', options.customerPhone);
      }

      query = query.order('updated_at', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error listing conversations:', error);
        return { success: false, error: error.message };
      }

      return { success: true, conversations: data || [], total: count || 0 };
    } catch (error) {
      console.error('Error listing conversations:', error);
      return { success: false, error: 'Failed to list conversations' };
    }
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(
    conversationId: string,
    messageData: Omit<MessageInsert, 'conversation_id' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; message?: MessageSimplified; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('messages_simplified')
        .insert({
          ...messageData,
          conversation_id: conversationId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding message:', error);
        return { success: false, error: error.message };
      }

      // Update conversation message count and last activity
      await this.supabase.rpc('increment_conversation_message_count', {
        conversation_id: conversationId,
      });

      return { success: true, message: data };
    } catch (error) {
      console.error('Error adding message:', error);
      return { success: false, error: 'Failed to add message' };
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(
    conversationId: string,
    options?: {
      limit?: number;
      offset?: number;
      messageType?: 'text' | 'image' | 'audio' | 'video' | 'document';
      direction?: 'inbound' | 'outbound';
    }
  ): Promise<{ success: boolean; messages?: MessageSimplified[]; total?: number; error?: string }> {
    try {
      let query = this.supabase
        .from('messages_simplified')
        .select('*', { count: 'exact' })
        .eq('conversation_id', conversationId);

      if (options?.messageType) {
        query = query.eq('message_type', options.messageType);
      }

      if (options?.direction) {
        query = query.eq('direction', options.direction);
      }

      query = query.order('created_at', { ascending: true });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error getting messages:', error);
        return { success: false, error: error.message };
      }

      return { success: true, messages: data || [], total: count || 0 };
    } catch (error) {
      console.error('Error getting messages:', error);
      return { success: false, error: 'Failed to get messages' };
    }
  }

  /**
   * Search messages using vector similarity
   */
  async searchMessages(
    instanceId: string,
    options: MessageSearchOptions
  ): Promise<{ success: boolean; messages?: MessageSimplified[]; error?: string }> {
    try {
      const { data, error } = await this.supabase.rpc('search_messages', {
        instance_id: instanceId,
        search_query: options.query,
        conversation_id: options.conversationId,
        message_type: options.messageType,
        result_limit: options.limit || 20,
        similarity_threshold: options.threshold || 0.7,
      });

      if (error) {
        console.error('Error searching messages:', error);
        return { success: false, error: error.message };
      }

      return { success: true, messages: data || [] };
    } catch (error) {
      console.error('Error searching messages:', error);
      return { success: false, error: 'Failed to search messages' };
    }
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(
    conversationId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('conversations_simplified')
        .update({ status: 'archived' })
        .eq('id', conversationId);

      if (error) {
        console.error('Error archiving conversation:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error archiving conversation:', error);
      return { success: false, error: 'Failed to archive conversation' };
    }
  }

  /**
   * Close a conversation
   */
  async closeConversation(
    conversationId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('conversations_simplified')
        .update({ status: 'closed' })
        .eq('id', conversationId);

      if (error) {
        console.error('Error closing conversation:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error closing conversation:', error);
      return { success: false, error: 'Failed to close conversation' };
    }
  }

  /**
   * Get conversation statistics for an instance
   */
  async getConversationStats(
    instanceId: string,
    dateRange?: { startDate: string; endDate: string }
  ): Promise<{ success: boolean; stats?: ConversationStats; error?: string }> {
    try {
      const { data, error } = await this.supabase.rpc('get_conversation_stats', {
        instance_id: instanceId,
        start_date: dateRange?.startDate,
        end_date: dateRange?.endDate,
      });

      if (error) {
        console.error('Error getting conversation stats:', error);
        return { success: false, error: error.message };
      }

      return { success: true, stats: data };
    } catch (error) {
      console.error('Error getting conversation stats:', error);
      return { success: false, error: 'Failed to get conversation stats' };
    }
  }

  /**
   * Delete old conversations and messages (cleanup)
   */
  async cleanupOldConversations(
    instanceId: string,
    daysOld: number = 90
  ): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      const { data, error } = await this.supabase.rpc('cleanup_old_conversations', {
        instance_id: instanceId,
        days_old: daysOld,
      });

      if (error) {
        console.error('Error cleaning up conversations:', error);
        return { success: false, error: error.message };
      }

      return { success: true, deletedCount: data };
    } catch (error) {
      console.error('Error cleaning up conversations:', error);
      return { success: false, error: 'Failed to cleanup conversations' };
    }
  }
}

/**
 * Factory function to create ConversationService instance
 */
export function createConversationService(
  supabaseUrl: string,
  supabaseKey: string
): ConversationService {
  return new ConversationService(supabaseUrl, supabaseKey);
}