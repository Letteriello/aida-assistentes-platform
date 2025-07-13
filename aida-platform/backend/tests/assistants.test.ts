import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { assistantRoutes } from '../src/api/assistants';
import { tenantIsolationMiddleware } from '../src/auth/tenant-isolation';
import { testData, testSupabase } from './setup';

describe('Assistant Management Integration Tests', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.use('*', tenantIsolationMiddleware);
    app.route('/api/assistants', assistantRoutes);
  });

  describe('Create Assistant', () => {
    it('should create a new assistant successfully', async () => {
      const newAssistant = {
        name: 'New Test Assistant',
        description: 'A new assistant for testing',
        personality: 'Friendly and helpful',
        system_prompt: 'You are a friendly assistant.',
        model_config: {
          model: 'gpt-4',
          temperature: 0.8,
          max_tokens: 1500
        }
      };

      const response = await app.request('/api/assistants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
        body: JSON.stringify(newAssistant),
      });

      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.assistant).toMatchObject({
        name: newAssistant.name,
        description: newAssistant.description,
        personality: newAssistant.personality,
        system_prompt: newAssistant.system_prompt,
        business_id: testData.testBusiness.id,
        is_active: false // Should start inactive until WhatsApp is connected
      });
      expect(data.assistant.model_config).toEqual(newAssistant.model_config);
      expect(data.evolutionInstance).toHaveProperty('instanceId');

      // Cleanup
      if (data.assistant?.id) {
        await testSupabase.from('assistants').delete().eq('id', data.assistant.id);
      }
    });

    it('should validate required fields', async () => {
      const incompleteAssistant = {
        name: '', // Empty name should fail validation
        description: 'Test description'
      };

      const response = await app.request('/api/assistants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
        body: JSON.stringify(incompleteAssistant),
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('required');
    });

    it('should enforce subscription limits', async () => {
      // Mock reaching subscription limit by creating multiple assistants
      const assistants = [];
      
      // Create assistants up to the limit (assuming starter plan allows 3)
      for (let i = 0; i < 3; i++) {
        const assistant = {
          id: `limit-test-${i}`,
          business_id: testData.testBusiness.id,
          name: `Limit Test Assistant ${i}`,
          description: 'Test assistant for limit testing',
          personality: 'Test',
          system_prompt: 'Test prompt',
          model_config: { model: 'gpt-3.5-turbo', temperature: 0.7, max_tokens: 1000 },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        await testSupabase.from('assistants').insert(assistant);
        assistants.push(assistant);
      }

      // Try to create one more (should fail)
      const newAssistant = {
        name: 'Over Limit Assistant',
        description: 'This should fail',
        personality: 'Test',
        system_prompt: 'Test prompt'
      };

      const response = await app.request('/api/assistants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
        body: JSON.stringify(newAssistant),
      });

      expect(response.status).toBe(402);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('limit');

      // Cleanup
      for (const assistant of assistants) {
        await testSupabase.from('assistants').delete().eq('id', assistant.id);
      }
    });
  });

  describe('List Assistants', () => {
    it('should list assistants for authenticated business', async () => {
      const response = await app.request('/api/assistants', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.assistants)).toBe(true);
      
      // Should include the test assistant
      const testAssistant = data.assistants.find((a: any) => a.id === testData.testAssistant.id);
      expect(testAssistant).toBeDefined();
      expect(testAssistant.name).toBe(testData.testAssistant.name);
      expect(testAssistant.business_id).toBe(testData.testBusiness.id);
    });

    it('should include analytics data in assistant list', async () => {
      const response = await app.request('/api/assistants', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      
      // Each assistant should have analytics
      data.assistants.forEach((assistant: any) => {
        expect(assistant).toHaveProperty('analytics');
        expect(assistant.analytics).toHaveProperty('conversations_count');
        expect(assistant.analytics).toHaveProperty('messages_count');
        expect(assistant.analytics).toHaveProperty('avg_response_time');
      });
    });

    it('should support filtering by status', async () => {
      const response = await app.request('/api/assistants?status=active', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      
      // All returned assistants should be active
      data.assistants.forEach((assistant: any) => {
        expect(assistant.is_active).toBe(true);
      });
    });
  });

  describe('Get Single Assistant', () => {
    it('should get assistant details by ID', async () => {
      const response = await app.request(`/api/assistants/${testData.testAssistant.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.assistant).toMatchObject({
        id: testData.testAssistant.id,
        name: testData.testAssistant.name,
        description: testData.testAssistant.description,
        business_id: testData.testBusiness.id
      });
      expect(data.assistant).toHaveProperty('analytics');
      expect(data.assistant).toHaveProperty('evolution_config');
    });

    it('should return 404 for non-existent assistant', async () => {
      const response = await app.request('/api/assistants/non-existent-id', {
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
      // Create assistant for another business
      const otherAssistant = {
        id: 'other-business-assistant',
        business_id: 'other-business-id',
        name: 'Other Business Assistant',
        description: 'Should not be accessible',
        personality: 'Test',
        system_prompt: 'Test',
        model_config: { model: 'gpt-3.5-turbo', temperature: 0.7, max_tokens: 1000 },
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await testSupabase.from('assistants').insert(otherAssistant);

      const response = await app.request(`/api/assistants/${otherAssistant.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
      });

      expect(response.status).toBe(404);

      // Cleanup
      await testSupabase.from('assistants').delete().eq('id', otherAssistant.id);
    });
  });

  describe('Update Assistant', () => {
    it('should update assistant successfully', async () => {
      const updates = {
        name: 'Updated Test Assistant',
        description: 'Updated description',
        personality: 'Updated personality',
        model_config: {
          model: 'gpt-4',
          temperature: 0.9,
          max_tokens: 2000
        }
      };

      const response = await app.request(`/api/assistants/${testData.testAssistant.id}`, {
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
      expect(data.assistant).toMatchObject({
        id: testData.testAssistant.id,
        name: updates.name,
        description: updates.description,
        personality: updates.personality
      });
      expect(data.assistant.model_config).toEqual(updates.model_config);

      // Verify the update in database
      const { data: updatedAssistant } = await testSupabase
        .from('assistants')
        .select('*')
        .eq('id', testData.testAssistant.id)
        .single();

      expect(updatedAssistant?.name).toBe(updates.name);
      expect(updatedAssistant?.description).toBe(updates.description);
    });

    it('should validate update data', async () => {
      const invalidUpdates = {
        name: '', // Empty name should fail
        model_config: {
          temperature: 2.0 // Invalid temperature
        }
      };

      const response = await app.request(`/api/assistants/${testData.testAssistant.id}`, {
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

  describe('Delete Assistant', () => {
    it('should delete assistant successfully', async () => {
      // Create a temporary assistant to delete
      const tempAssistant = {
        id: 'temp-assistant-to-delete',
        business_id: testData.testBusiness.id,
        name: 'Temporary Assistant',
        description: 'Will be deleted',
        personality: 'Test',
        system_prompt: 'Test prompt',
        model_config: { model: 'gpt-3.5-turbo', temperature: 0.7, max_tokens: 1000 },
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await testSupabase.from('assistants').insert(tempAssistant);

      const response = await app.request(`/api/assistants/${tempAssistant.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify the assistant is deleted
      const { data: deletedAssistant } = await testSupabase
        .from('assistants')
        .select('*')
        .eq('id', tempAssistant.id)
        .single();

      expect(deletedAssistant).toBeNull();
    });

    it('should prevent deletion of active assistant with conversations', async () => {
      // Try to delete the main test assistant (which has conversations)
      const response = await app.request(`/api/assistants/${testData.testAssistant.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('conversations');
    });
  });

  describe('Test Assistant', () => {
    it('should send test message successfully', async () => {
      const testMessage = {
        phone: '+5511999999999',
        message: 'Hello, this is a test message!'
      };

      const response = await app.request(`/api/assistants/${testData.testAssistant.id}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
        body: JSON.stringify(testMessage),
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain('sent');
      expect(data).toHaveProperty('messageId');
    });

    it('should validate test message data', async () => {
      const invalidTest = {
        phone: 'invalid-phone',
        message: ''
      };

      const response = await app.request(`/api/assistants/${testData.testAssistant.id}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
        body: JSON.stringify(invalidTest),
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('validation');
    });

    it('should require WhatsApp connection for testing', async () => {
      // Create assistant without WhatsApp connection
      const unconnectedAssistant = {
        id: 'unconnected-assistant',
        business_id: testData.testBusiness.id,
        name: 'Unconnected Assistant',
        description: 'No WhatsApp connection',
        personality: 'Test',
        system_prompt: 'Test prompt',
        model_config: { model: 'gpt-3.5-turbo', temperature: 0.7, max_tokens: 1000 },
        evolution_config: null, // No WhatsApp connection
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await testSupabase.from('assistants').insert(unconnectedAssistant);

      const response = await app.request(`/api/assistants/${unconnectedAssistant.id}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
        body: JSON.stringify({
          phone: '+5511999999999',
          message: 'Test message'
        }),
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('WhatsApp');

      // Cleanup
      await testSupabase.from('assistants').delete().eq('id', unconnectedAssistant.id);
    });
  });
});