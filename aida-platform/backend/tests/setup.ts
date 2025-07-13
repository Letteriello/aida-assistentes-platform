import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database';

// Test database configuration
const SUPABASE_TEST_URL = process.env.SUPABASE_TEST_URL || 'http://localhost:54321';
const SUPABASE_TEST_ANON_KEY = process.env.SUPABASE_TEST_ANON_KEY || 'test-key';
const SUPABASE_TEST_SERVICE_KEY = process.env.SUPABASE_TEST_SERVICE_KEY || 'test-service-key';

export const testSupabase = createClient<Database>(
  SUPABASE_TEST_URL,
  SUPABASE_TEST_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export const testData = {
  testBusiness: {
    id: 'test-business-1',
    name: 'Test Business Corp',
    email: 'test@business.com',
    contact_name: 'Test User',
    phone: '+5511999999999',
    plan: 'starter' as const,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  testApiKey: {
    id: 'test-api-key-1',
    business_id: 'test-business-1',
    key: 'aida_test_1234567890abcdef',
    name: 'Test API Key',
    permissions: ['assistants:read', 'assistants:write', 'conversations:read'],
    is_active: true,
    last_used_at: null,
    created_at: new Date().toISOString()
  },
  testAssistant: {
    id: 'test-assistant-1',
    business_id: 'test-business-1',
    name: 'Test Assistant',
    description: 'A test assistant for integration tests',
    personality: 'Professional and helpful',
    system_prompt: 'You are a helpful test assistant.',
    model_config: {
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 1000
    },
    evolution_config: {
      instance_id: 'test-instance-1',
      instance_name: 'Test Instance',
      status: 'connected' as const,
      phone_number: '+5511999999999'
    },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  testConversation: {
    id: 'test-conversation-1',
    business_id: 'test-business-1',
    assistant_id: 'test-assistant-1',
    customer_phone: '+5511888888888',
    customer_name: 'Test Customer',
    remote_jid: 'test-customer@whatsapp.net',
    status: 'active' as const,
    priority: 'medium' as const,
    tags: ['test'],
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
};

// Helper function to clean up test data
export async function cleanupTestData() {
  try {
    // Clean up in reverse dependency order
    await testSupabase.from('conversation_messages').delete().eq('conversation_id', testData.testConversation.id);
    await testSupabase.from('conversations').delete().eq('id', testData.testConversation.id);
    await testSupabase.from('assistants').delete().eq('id', testData.testAssistant.id);
    await testSupabase.from('api_keys').delete().eq('id', testData.testApiKey.id);
    await testSupabase.from('businesses').delete().eq('id', testData.testBusiness.id);
  } catch (error) {
    console.warn('Cleanup warning:', error);
  }
}

// Helper function to setup test data
export async function setupTestData() {
  await cleanupTestData();
  
  // Insert test data in dependency order
  await testSupabase.from('businesses').insert(testData.testBusiness);
  await testSupabase.from('api_keys').insert(testData.testApiKey);
  await testSupabase.from('assistants').insert(testData.testAssistant);
  await testSupabase.from('conversations').insert(testData.testConversation);
}

// Global test setup
beforeAll(async () => {
  await setupTestData();
});

afterAll(async () => {
  await cleanupTestData();
});

beforeEach(async () => {
  // Reset any state between tests if needed
});

afterEach(async () => {
  // Clean up any test-specific data if needed
});