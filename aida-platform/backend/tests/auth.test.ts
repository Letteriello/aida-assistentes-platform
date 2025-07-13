import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { businessAuthRoutes } from '../src/auth/business-auth';
import { tenantIsolationMiddleware } from '../src/auth/tenant-isolation';
import { testData, testSupabase } from './setup';

describe('Authentication Integration Tests', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.use('*', tenantIsolationMiddleware);
    app.route('/auth', businessAuthRoutes);
  });

  describe('Business Registration', () => {
    it('should register a new business successfully', async () => {
      const newBusiness = {
        name: 'New Test Business',
        email: 'newtest@business.com',
        contact_name: 'New Test User',
        phone: '+5511777777777',
        plan: 'starter'
      };

      const response = await app.request('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBusiness),
      });

      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.business).toMatchObject({
        name: newBusiness.name,
        email: newBusiness.email,
        contact_name: newBusiness.contact_name,
        phone: newBusiness.phone,
        plan: newBusiness.plan
      });
      expect(data.apiKey).toHaveProperty('key');
      expect(data.apiKey.key).toMatch(/^aida_live_/);

      // Cleanup
      if (data.business?.id) {
        await testSupabase.from('businesses').delete().eq('id', data.business.id);
      }
    });

    it('should reject registration with duplicate email', async () => {
      const duplicateBusiness = {
        name: 'Duplicate Business',
        email: testData.testBusiness.email, // Use existing email
        contact_name: 'Duplicate User',
        phone: '+5511666666666',
        plan: 'starter'
      };

      const response = await app.request('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(duplicateBusiness),
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('already exists');
    });

    it('should validate required fields during registration', async () => {
      const incompleteBusiness = {
        name: 'Incomplete Business',
        // Missing required fields
      };

      const response = await app.request('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incompleteBusiness),
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('required');
    });
  });

  describe('Business Login', () => {
    it('should login successfully with valid API key', async () => {
      const response = await app.request('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: testData.testApiKey.key
        }),
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.business).toMatchObject({
        id: testData.testBusiness.id,
        name: testData.testBusiness.name,
        email: testData.testBusiness.email
      });
      expect(data.apiKey).toMatchObject({
        id: testData.testApiKey.id,
        name: testData.testApiKey.name
      });
    });

    it('should reject login with invalid API key', async () => {
      const response = await app.request('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: 'aida_test_invalid_key'
        }),
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('Invalid');
    });

    it('should reject login with inactive API key', async () => {
      // Create inactive API key
      const inactiveKey = {
        id: 'inactive-key-1',
        business_id: testData.testBusiness.id,
        key: 'aida_test_inactive_key',
        name: 'Inactive Key',
        permissions: ['assistants:read'],
        is_active: false,
        created_at: new Date().toISOString()
      };

      await testSupabase.from('api_keys').insert(inactiveKey);

      const response = await app.request('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: inactiveKey.key
        }),
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('inactive');

      // Cleanup
      await testSupabase.from('api_keys').delete().eq('id', inactiveKey.id);
    });
  });

  describe('API Key Management', () => {
    it('should generate new API key for authenticated business', async () => {
      const response = await app.request('/auth/api-keys/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
        body: JSON.stringify({
          name: 'New Test Key',
          permissions: ['assistants:read', 'conversations:read']
        }),
      });

      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.apiKey).toHaveProperty('key');
      expect(data.apiKey.key).toMatch(/^aida_live_/);
      expect(data.apiKey.name).toBe('New Test Key');
      expect(data.apiKey.permissions).toEqual(['assistants:read', 'conversations:read']);

      // Cleanup
      if (data.apiKey?.id) {
        await testSupabase.from('api_keys').delete().eq('id', data.apiKey.id);
      }
    });

    it('should list API keys for authenticated business', async () => {
      const response = await app.request('/auth/api-keys', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.apiKeys)).toBe(true);
      expect(data.apiKeys.length).toBeGreaterThan(0);
      
      // Should include the test API key
      const testKey = data.apiKeys.find((key: any) => key.id === testData.testApiKey.id);
      expect(testKey).toBeDefined();
      expect(testKey.name).toBe(testData.testApiKey.name);
      
      // Should not expose the actual key value
      expect(testKey.key).toBeUndefined();
    });

    it('should revoke API key', async () => {
      // First create a key to revoke
      const newKeyResponse = await app.request('/auth/api-keys/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
        body: JSON.stringify({
          name: 'Key to Revoke',
          permissions: ['assistants:read']
        }),
      });

      const newKeyData = await newKeyResponse.json();
      const keyId = newKeyData.apiKey.id;

      // Now revoke it
      const revokeResponse = await app.request(`/auth/api-keys/${keyId}/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
      });

      expect(revokeResponse.status).toBe(200);
      
      const revokeData = await revokeResponse.json();
      expect(revokeData.success).toBe(true);

      // Verify the key is now inactive
      const { data: revokedKey } = await testSupabase
        .from('api_keys')
        .select('is_active')
        .eq('id', keyId)
        .single();

      expect(revokedKey?.is_active).toBe(false);

      // Cleanup
      await testSupabase.from('api_keys').delete().eq('id', keyId);
    });
  });

  describe('Tenant Isolation', () => {
    it('should enforce tenant isolation in API requests', async () => {
      // Try to access another business's data
      const otherBusinessKey = 'aida_test_other_business_key';
      
      const response = await app.request('/auth/api-keys', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${otherBusinessKey}`
        },
      });

      expect(response.status).toBe(401);
    });

    it('should allow access to own business data', async () => {
      const response = await app.request('/auth/api-keys', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testData.testApiKey.key}`
        },
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      
      // Should only return API keys for the authenticated business
      data.apiKeys.forEach((key: any) => {
        expect(key.business_id).toBe(testData.testBusiness.id);
      });
    });
  });
});