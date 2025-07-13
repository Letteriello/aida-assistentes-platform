import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { conversationRoutes } from '../src/api/conversations';
import { tenantIsolationMiddleware } from '../src/auth/tenant-isolation';
import { testData, testSupabase } from './setup';

describe('Conversation Management Integration Tests', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.use('*', tenantIsolationMiddleware);
    app.route('/api/conversations', conversationRoutes);
  });

  describe('List Conversations', () => {
    it('should list conversations for authenticated business', async () => {
      const response = await app.request('/api/conversations', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.conversations)).toBe(true);
      
      // Should include the test conversation
      const testConversation = data.conversations.find((c: any) => c.id === testData.testConversation.id);
      expect(testConversation).toBeDefined();
      expect(testConversation.business_id).toBe(testData.testBusiness.id);
    });

    it('should support filtering by status', async () => {
      const response = await app.request('/api/conversations?status=active', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      
      // All returned conversations should be active
      data.conversations.forEach((conversation: any) => {
        expect(conversation.status).toBe('active');
      });
    });

    it('should support filtering by assistant', async () => {
      const response = await app.request(`/api/conversations?assistant_id=${testData.testAssistant.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      
      // All returned conversations should be for the specified assistant
      data.conversations.forEach((conversation: any) => {
        expect(conversation.assistant_id).toBe(testData.testAssistant.id);
      });
    });

    it('should support search functionality', async () => {
      const response = await app.request('/api/conversations?search=test', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      
      // Should return conversations matching the search term
      data.conversations.forEach((conversation: any) => {
        const matchesSearch = 
          conversation.customer_name.toLowerCase().includes('test') ||
          conversation.customer_phone.includes('test') ||
          (conversation.tags && conversation.tags.some((tag: string) => tag.includes('test')));
        expect(matchesSearch).toBe(true);
      });
    });

    it('should support pagination', async () => {
      const response = await app.request('/api/conversations?page=1&limit=10', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('pagination');
      expect(data.pagination).toHaveProperty('page');
      expect(data.pagination).toHaveProperty('limit');
      expect(data.pagination).toHaveProperty('total');
      expect(data.conversations.length).toBeLessThanOrEqual(10);
    });

    it('should include analytics data', async () => {
      const response = await app.request('/api/conversations', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      
      // Should include analytics
      expect(data).toHaveProperty('analytics');
      expect(data.analytics).toHaveProperty('total_conversations');
      expect(data.analytics).toHaveProperty('active_conversations');
      expect(data.analytics).toHaveProperty('avg_response_time');
      expect(data.analytics).toHaveProperty('satisfaction_score');
    });
  });

  describe('Get Single Conversation', () => {
    it('should get conversation details with messages', async () => {
      // First add some test messages
      const testMessages = [
        {
          id: 'test-message-1',
          conversation_id: testData.testConversation.id,
          sender_type: 'customer',
          sender_name: 'Test Customer',
          content: 'Hello, I need help!',
          timestamp: new Date().toISOString(),
          message_type: 'text',
          metadata: {}
        },
        {
          id: 'test-message-2',
          conversation_id: testData.testConversation.id,
          sender_type: 'assistant',
          sender_name: 'Test Assistant',
          content: 'Hello! How can I help you today?',
          timestamp: new Date().toISOString(),
          message_type: 'text',
          metadata: {
            ai_confidence: 0.95,
            response_time: 1.2
          }
        }
      ];

      await testSupabase.from('conversation_messages').insert(testMessages);

      const response = await app.request(`/api/conversations/${testData.testConversation.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.conversation).toMatchObject({
        id: testData.testConversation.id,
        business_id: testData.testBusiness.id,
        assistant_id: testData.testAssistant.id
      });
      expect(Array.isArray(data.messages)).toBe(true);
      expect(data.messages.length).toBe(2);
      
      // Messages should be ordered by timestamp
      expect(new Date(data.messages[0].timestamp).getTime())
        .toBeLessThanOrEqual(new Date(data.messages[1].timestamp).getTime());

      // Should include assistant information
      expect(data.conversation).toHaveProperty('assistant');
      expect(data.conversation.assistant.name).toBe(testData.testAssistant.name);

      // Cleanup
      await testSupabase.from('conversation_messages').delete().in('id', testMessages.map(m => m.id));
    });

    it('should return 404 for non-existent conversation', async () => {
      const response = await app.request('/api/conversations/non-existent-id', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
      });

      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('not found');
    });

    it('should enforce tenant isolation', async () => {
      // Create conversation for another business
      const otherConversation = {
        id: 'other-business-conversation',
        business_id: 'other-business-id',
        assistant_id: 'other-assistant-id',
        customer_phone: '+5511777777777',
        customer_name: 'Other Customer',
        remote_jid: 'other@whatsapp.net',
        status: 'active',
        priority: 'medium',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await testSupabase.from('conversations').insert(otherConversation);

      const response = await app.request(`/api/conversations/${otherConversation.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
      });

      expect(response.status).toBe(404);

      // Cleanup
      await testSupabase.from('conversations').delete().eq('id', otherConversation.id);
    });
  });

  describe('Update Conversation', () => {
    it('should update conversation status', async () => {
      const updates = {
        status: 'resolved',
        priority: 'low',
        tags: ['resolved', 'support']
      };

      const response = await app.request(`/api/conversations/${testData.testConversation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
        body: JSON.stringify(updates),
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.conversation).toMatchObject({
        id: testData.testConversation.id,
        status: updates.status,
        priority: updates.priority,
        tags: updates.tags
      });

      // Verify the update in database
      const { data: updatedConversation } = await testSupabase
        .from('conversations')
        .select('*')
        .eq('id', testData.testConversation.id)
        .single();

      expect(updatedConversation?.status).toBe(updates.status);
      expect(updatedConversation?.priority).toBe(updates.priority);
      expect(updatedConversation?.tags).toEqual(updates.tags);
    });

    it('should validate update data', async () => {
      const invalidUpdates = {
        status: 'invalid-status',
        priority: 'invalid-priority'
      };

      const response = await app.request(`/api/conversations/${testData.testConversation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
        body: JSON.stringify(invalidUpdates),
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('validation');
    });
  });

  describe('Add Message to Conversation', () => {
    it('should add new message successfully', async () => {
      const newMessage = {
        sender_type: 'human',
        sender_name: 'Support Agent',
        content: 'Hello! I\'m here to help with your request.',
        message_type: 'text'
      };

      const response = await app.request(`/api/conversations/${testData.testConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
        body: JSON.stringify(newMessage),
      });

      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toMatchObject({
        conversation_id: testData.testConversation.id,
        sender_type: newMessage.sender_type,
        sender_name: newMessage.sender_name,
        content: newMessage.content,
        message_type: newMessage.message_type
      });
      expect(data.message).toHaveProperty('id');
      expect(data.message).toHaveProperty('timestamp');

      // Verify the message was saved
      const { data: savedMessage } = await testSupabase
        .from('conversation_messages')
        .select('*')
        .eq('id', data.message.id)
        .single();

      expect(savedMessage).toBeDefined();
      expect(savedMessage?.content).toBe(newMessage.content);

      // Cleanup
      if (data.message?.id) {
        await testSupabase.from('conversation_messages').delete().eq('id', data.message.id);
      }
    });

    it('should validate message data', async () => {
      const invalidMessage = {
        sender_type: 'invalid-type',
        content: '', // Empty content
        message_type: 'text'
      };

      const response = await app.request(`/api/conversations/${testData.testConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
        body: JSON.stringify(invalidMessage),
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('validation');
    });

    it('should update conversation timestamp when adding message', async () => {
      const originalUpdatedAt = testData.testConversation.updated_at;
      
      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      const newMessage = {
        sender_type: 'customer',
        sender_name: 'Test Customer',
        content: 'Another test message',
        message_type: 'text'
      };

      const response = await app.request(`/api/conversations/${testData.testConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
        body: JSON.stringify(newMessage),
      });

      expect(response.status).toBe(201);

      // Verify conversation timestamp was updated
      const { data: updatedConversation } = await testSupabase
        .from('conversations')
        .select('updated_at')
        .eq('id', testData.testConversation.id)
        .single();

      expect(new Date(updatedConversation?.updated_at || '').getTime())
        .toBeGreaterThan(new Date(originalUpdatedAt).getTime());

      // Cleanup
      const data = await response.json();
      if (data.message?.id) {
        await testSupabase.from('conversation_messages').delete().eq('id', data.message.id);
      }
    });
  });

  describe('Export Conversations', () => {
    it('should export conversations as CSV', async () => {
      const response = await app.request('/api/conversations/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
        body: JSON.stringify({
          format: 'csv',
          filters: {
            status: 'all',
            date_range: {
              start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              end: new Date().toISOString()
            }
          }
        }),
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('exportId');
      expect(data.message).toContain('export');
    });

    it('should export conversations as JSON', async () => {
      const response = await app.request('/api/conversations/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
        body: JSON.stringify({
          format: 'json',
          include_messages: true,
          filters: {
            assistant_id: testData.testAssistant.id
          }
        }),
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('exportId');
      expect(data.message).toContain('export');
    });

    it('should validate export parameters', async () => {
      const response = await app.request('/api/conversations/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
        body: JSON.stringify({
          format: 'invalid-format'
        }),
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('validation');
    });
  });

  describe('Conversation Analytics', () => {
    it('should provide conversation analytics', async () => {
      const response = await app.request('/api/conversations/analytics', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.analytics).toHaveProperty('total_conversations');
      expect(data.analytics).toHaveProperty('active_conversations');
      expect(data.analytics).toHaveProperty('resolved_conversations');
      expect(data.analytics).toHaveProperty('avg_response_time');
      expect(data.analytics).toHaveProperty('satisfaction_score');
      expect(data.analytics).toHaveProperty('messages_per_conversation');
      expect(data.analytics).toHaveProperty('conversation_duration');
    });

    it('should support date range filtering for analytics', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await app.request(`/api/conversations/analytics?start_date=${startDate}&end_date=${endDate}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.analytics).toHaveProperty('date_range');
      expect(data.analytics.date_range.start).toBe(startDate);
      expect(data.analytics.date_range.end).toBe(endDate);
    });

    it('should provide assistant-specific analytics', async () => {
      const response = await app.request(`/api/conversations/analytics?assistant_id=${testData.testAssistant.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.analytics).toHaveProperty('assistant_id');
      expect(data.analytics.assistant_id).toBe(testData.testAssistant.id);
    });
  });
});