import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { businessAuthRoutes } from '../src/auth/business-auth';
import { assistantRoutes } from '../src/api/assistants';
import { conversationRoutes } from '../src/api/conversations';
import { tenantIsolationMiddleware } from '../src/auth/tenant-isolation';
import { ConversationMemoryManager } from '../src/memory/conversation-history';
import { BusinessKnowledgeManager } from '../src/memory/business-knowledge';
import { MemoryIntegrator } from '../src/memory/memory-integrator';
import { testSupabase, cleanupTestData } from './setup';

describe('End-to-End Workflow Integration Tests', () => {
  let app: Hono;
  let businessData: any;
  let apiKey: string;
  let assistantData: any;
  let memoryIntegrator: MemoryIntegrator;

  beforeEach(async () => {
    // Clean slate for each test
    await cleanupTestData();

    // Setup fresh app
    app = new Hono();
    app.use('*', tenantIsolationMiddleware);
    app.route('/auth', businessAuthRoutes);
    app.route('/api/assistants', assistantRoutes);
    app.route('/api/conversations', conversationRoutes);

    // Setup memory components
    const conversationMemory = new ConversationMemoryManager(testSupabase);
    const businessKnowledge = new BusinessKnowledgeManager(testSupabase);
    memoryIntegrator = new MemoryIntegrator(conversationMemory, businessKnowledge);
  });

  describe('Complete Business Onboarding Flow', () => {
    it('should complete full business registration to first conversation workflow', async () => {
      // Step 1: Business Registration
      const registrationData = {
        name: 'E2E Test Business',
        email: 'e2e@testbusiness.com',
        contact_name: 'E2E Test User',
        phone: '+5511999999999',
        plan: 'professional'
      };

      const registrationResponse = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      expect(registrationResponse.status).toBe(201);
      
      const registrationResult = await registrationResponse.json();
      expect(registrationResult.success).toBe(true);
      
      businessData = registrationResult.business;
      apiKey = registrationResult.apiKey.key;

      // Step 2: Login Verification
      const loginResponse = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });

      expect(loginResponse.status).toBe(200);
      
      const loginResult = await loginResponse.json();
      expect(loginResult.success).toBe(true);
      expect(loginResult.business.id).toBe(businessData.id);

      // Step 3: Create Business Knowledge Base
      const businessKnowledge = new BusinessKnowledgeManager(testSupabase);
      
      const knowledgeItems = [
        {
          title: 'Company Overview',
          content: 'E2E Test Business provides innovative software solutions for small and medium businesses.',
          type: 'company_info' as const,
          tags: ['company', 'overview'],
          metadata: {}
        },
        {
          title: 'Product Catalog',
          content: 'We offer three main products: Basic CRM (R$ 99/month), Advanced CRM (R$ 299/month), Enterprise Suite (R$ 999/month)',
          type: 'products' as const,
          tags: ['products', 'pricing'],
          metadata: {}
        },
        {
          title: 'Support Policy',
          content: 'We provide 24/7 support for all customers. Basic plan includes email support, Advanced includes chat, Enterprise includes phone support.',
          type: 'support' as const,
          tags: ['support', 'policy'],
          metadata: {}
        }
      ];

      for (const item of knowledgeItems) {
        const node = await businessKnowledge.createKnowledgeNode(businessData.id, item);
        expect(node).toBeDefined();
        expect(node.business_id).toBe(businessData.id);
      }

      // Step 4: Create AI Assistant
      const assistantData = {
        name: 'E2E Sales Assistant',
        description: 'AI assistant for handling sales inquiries and product information',
        personality: 'Professional and helpful sales representative',
        system_prompt: 'You are a sales assistant for E2E Test Business. Help customers with product information, pricing, and support questions. Be professional and knowledgeable.',
        model_config: {
          model: 'gpt-4',
          temperature: 0.7,
          max_tokens: 1000
        }
      };

      const assistantResponse = await app.request('/api/assistants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(assistantData),
      });

      expect(assistantResponse.status).toBe(201);
      
      const assistantResult = await assistantResponse.json();
      expect(assistantResult.success).toBe(true);
      
      const assistant = assistantResult.assistant;
      expect(assistant.name).toBe(assistantData.name);
      expect(assistant.business_id).toBe(businessData.id);

      // Step 5: Simulate Customer Interaction Flow
      const customerPhone = '+5511888888888';
      const remoteJid = `${customerPhone.substring(1)}@s.whatsapp.net`;

      // Customer sends initial message
      const initialMessage = 'Hello! I\'m interested in your CRM solutions. Can you tell me about your products?';
      
      // Get memory context for AI response
      const memoryContext = await memoryIntegrator.getMemoryContext(
        remoteJid,
        assistant.id,
        businessData.id,
        initialMessage
      );

      expect(memoryContext).toBeDefined();
      expect(memoryContext.conversation_context).toBeDefined();
      expect(memoryContext.relevant_knowledge.length).toBeGreaterThan(0);

      // Should find relevant product information
      const productKnowledge = memoryContext.relevant_knowledge.find(
        k => k.title === 'Product Catalog'
      );
      expect(productKnowledge).toBeDefined();
      expect(productKnowledge?.similarity_score).toBeGreaterThan(0.7);

      // Store customer message
      await memoryIntegrator.storeConversationMessage(
        memoryContext.conversation_context.id,
        {
          sender_type: 'customer',
          sender_name: 'Test Customer',
          content: initialMessage,
          message_type: 'text',
          metadata: {}
        }
      );

      // Simulate AI assistant response
      const assistantResponse2 = `Hello! I'd be happy to help you with our CRM solutions. We offer three main products:

1. Basic CRM (R$ 99/month) - Perfect for small teams
2. Advanced CRM (R$ 299/month) - Great for growing businesses  
3. Enterprise Suite (R$ 999/month) - Full-featured solution for large organizations

Each plan includes different support levels. Which type of business are you running, and what features are most important to you?`;

      await memoryIntegrator.storeConversationMessage(
        memoryContext.conversation_context.id,
        {
          sender_type: 'assistant',
          sender_name: assistant.name,
          content: assistantResponse2,
          message_type: 'text',
          metadata: {
            ai_confidence: 0.95,
            response_time: 1.5,
            knowledge_sources: ['Product Catalog']
          }
        }
      );

      // Step 6: Continue conversation - customer asks about support
      const supportQuery = 'What kind of support do you provide? I need to make sure we have good support for our team.';
      
      const supportMemoryContext = await memoryIntegrator.getMemoryContext(
        remoteJid,
        assistant.id,
        businessData.id,
        supportQuery
      );

      expect(supportMemoryContext.conversation_context.messages.length).toBe(2);
      expect(supportMemoryContext.relevant_knowledge.length).toBeGreaterThan(0);

      // Should find support policy information
      const supportKnowledge = supportMemoryContext.relevant_knowledge.find(
        k => k.title === 'Support Policy'
      );
      expect(supportKnowledge).toBeDefined();

      // Step 7: Verify conversation management through API
      const conversationsResponse = await app.request('/api/conversations', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      expect(conversationsResponse.status).toBe(200);
      
      const conversationsResult = await conversationsResponse.json();
      expect(conversationsResult.success).toBe(true);
      expect(conversationsResult.conversations.length).toBeGreaterThan(0);

      // Find our test conversation
      const testConversation = conversationsResult.conversations.find(
        (c: any) => c.customer_phone === customerPhone
      );
      expect(testConversation).toBeDefined();
      expect(testConversation.assistant_id).toBe(assistant.id);
      expect(testConversation.status).toBe('active');

      // Step 8: Get detailed conversation view
      const conversationDetailResponse = await app.request(`/api/conversations/${testConversation.id}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      expect(conversationDetailResponse.status).toBe(200);
      
      const conversationDetail = await conversationDetailResponse.json();
      expect(conversationDetail.success).toBe(true);
      expect(conversationDetail.conversation.id).toBe(testConversation.id);
      expect(conversationDetail.messages.length).toBeGreaterThanOrEqual(2);

      // Step 9: Update conversation status
      const statusUpdate = {
        status: 'resolved',
        tags: ['sales-inquiry', 'crm-products']
      };

      const updateResponse = await app.request(`/api/conversations/${testConversation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(statusUpdate),
      });

      expect(updateResponse.status).toBe(200);
      
      const updateResult = await updateResponse.json();
      expect(updateResult.success).toBe(true);
      expect(updateResult.conversation.status).toBe('resolved');
      expect(updateResult.conversation.tags).toEqual(['sales-inquiry', 'crm-products']);

      // Step 10: Verify analytics data
      const analyticsResponse = await app.request('/api/conversations/analytics', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      expect(analyticsResponse.status).toBe(200);
      
      const analyticsResult = await analyticsResponse.json();
      expect(analyticsResult.success).toBe(true);
      expect(analyticsResult.analytics.total_conversations).toBeGreaterThan(0);
      expect(analyticsResult.analytics.resolved_conversations).toBeGreaterThan(0);
    });
  });

  describe('Multi-Assistant Business Workflow', () => {
    it('should handle multiple assistants with different roles', async () => {
      // Setup business
      const business = {
        name: 'Multi Assistant Business',
        email: 'multi@testbusiness.com',
        contact_name: 'Multi Test User',
        phone: '+5511777777777',
        plan: 'enterprise'
      };

      const regResponse = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(business),
      });

      const regResult = await regResponse.json();
      const businessId = regResult.business.id;
      const businessApiKey = regResult.apiKey.key;

      // Create specialized knowledge for different departments
      const businessKnowledge = new BusinessKnowledgeManager(testSupabase);
      
      const salesKnowledge = [
        {
          title: 'Sales Process',
          content: 'Our sales process: 1) Qualification, 2) Demo, 3) Proposal, 4) Negotiation, 5) Closing',
          type: 'process' as const,
          tags: ['sales', 'process'],
          metadata: { department: 'sales' }
        },
        {
          title: 'Product Pricing',
          content: 'Standard pricing with volume discounts available for 10+ licenses',
          type: 'pricing' as const,
          tags: ['sales', 'pricing'],
          metadata: { department: 'sales' }
        }
      ];

      const supportKnowledge = [
        {
          title: 'Troubleshooting Guide',
          content: 'Common issues: Login problems, sync errors, performance issues. Check logs first.',
          type: 'troubleshooting' as const,
          tags: ['support', 'technical'],
          metadata: { department: 'support' }
        },
        {
          title: 'Escalation Process',
          content: 'Escalate to L2 for technical issues, to manager for complaints, to sales for upgrades',
          type: 'process' as const,
          tags: ['support', 'escalation'],
          metadata: { department: 'support' }
        }
      ];

      for (const item of [...salesKnowledge, ...supportKnowledge]) {
        await businessKnowledge.createKnowledgeNode(businessId, item);
      }

      // Create Sales Assistant
      const salesAssistantData = {
        name: 'Sales Assistant',
        description: 'Specialized in sales inquiries and product demonstrations',
        personality: 'Persuasive and knowledgeable sales professional',
        system_prompt: 'You are a sales assistant. Focus on understanding customer needs, qualifying leads, and providing product information.',
        model_config: { model: 'gpt-4', temperature: 0.7, max_tokens: 1000 }
      };

      const salesResponse = await app.request('/api/assistants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${businessApiKey}`
        },
        body: JSON.stringify(salesAssistantData),
      });

      const salesAssistant = (await salesResponse.json()).assistant;

      // Create Support Assistant
      const supportAssistantData = {
        name: 'Support Assistant',
        description: 'Specialized in technical support and troubleshooting',
        personality: 'Technical and patient support specialist',
        system_prompt: 'You are a technical support assistant. Help customers troubleshoot issues and provide technical guidance.',
        model_config: { model: 'gpt-3.5-turbo', temperature: 0.5, max_tokens: 1200 }
      };

      const supportResponse = await app.request('/api/assistants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${businessApiKey}`
        },
        body: JSON.stringify(supportAssistantData),
      });

      const supportAssistant = (await supportResponse.json()).assistant;

      // Test Sales Conversation
      const salesCustomerJid = 'sales-customer@s.whatsapp.net';
      const salesQuery = 'I\'m interested in your product for my team of 15 people. What pricing options do you have?';

      const salesMemoryContext = await memoryIntegrator.getMemoryContext(
        salesCustomerJid,
        salesAssistant.id,
        businessId,
        salesQuery
      );

      expect(salesMemoryContext.relevant_knowledge.length).toBeGreaterThan(0);
      
      // Should find sales-specific knowledge
      const salesKnowledgeFound = salesMemoryContext.relevant_knowledge.some(
        k => k.tags.includes('sales') && (k.title.includes('Pricing') || k.title.includes('Process'))
      );
      expect(salesKnowledgeFound).toBe(true);

      // Test Support Conversation
      const supportCustomerJid = 'support-customer@s.whatsapp.net';
      const supportQuery = 'I\'m having trouble logging into the system. It keeps saying invalid credentials but I\'m sure my password is correct.';

      const supportMemoryContext = await memoryIntegrator.getMemoryContext(
        supportCustomerJid,
        supportAssistant.id,
        businessId,
        supportQuery
      );

      expect(supportMemoryContext.relevant_knowledge.length).toBeGreaterThan(0);
      
      // Should find support-specific knowledge
      const supportKnowledgeFound = supportMemoryContext.relevant_knowledge.some(
        k => k.tags.includes('support') && k.title.includes('Troubleshooting')
      );
      expect(supportKnowledgeFound).toBe(true);

      // Verify assistants list shows both
      const assistantsResponse = await app.request('/api/assistants', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${businessApiKey}` },
      });

      const assistantsResult = await assistantsResponse.json();
      expect(assistantsResult.assistants.length).toBe(2);
      
      const assistantNames = assistantsResult.assistants.map((a: any) => a.name);
      expect(assistantNames).toContain('Sales Assistant');
      expect(assistantNames).toContain('Support Assistant');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle conversation with no relevant knowledge gracefully', async () => {
      // Setup minimal business without knowledge base
      const business = {
        name: 'Minimal Business',
        email: 'minimal@testbusiness.com',
        contact_name: 'Minimal User',
        phone: '+5511666666666',
        plan: 'starter'
      };

      const regResponse = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(business),
      });

      const regResult = await regResponse.json();
      const businessApiKey = regResult.apiKey.key;
      const businessId = regResult.business.id;

      // Create assistant
      const assistantData = {
        name: 'Basic Assistant',
        description: 'Basic assistant with no knowledge base',
        personality: 'Helpful and honest',
        system_prompt: 'You are a helpful assistant. If you don\'t have specific information, say so honestly.',
        model_config: { model: 'gpt-3.5-turbo', temperature: 0.7, max_tokens: 500 }
      };

      const assistantResponse = await app.request('/api/assistants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${businessApiKey}`
        },
        body: JSON.stringify(assistantData),
      });

      const assistant = (await assistantResponse.json()).assistant;

      // Try to get memory context for query with no relevant knowledge
      const customerJid = 'unknown-query@s.whatsapp.net';
      const unknownQuery = 'What is your policy on quantum computing integration?';

      const memoryContext = await memoryIntegrator.getMemoryContext(
        customerJid,
        assistant.id,
        businessId,
        unknownQuery
      );

      // Should still work, just with no relevant knowledge
      expect(memoryContext).toBeDefined();
      expect(memoryContext.conversation_context).toBeDefined();
      expect(memoryContext.relevant_knowledge).toEqual([]);
    });

    it('should handle concurrent conversations correctly', async () => {
      // Setup business and assistant
      const business = {
        name: 'Concurrent Business',
        email: 'concurrent@testbusiness.com',
        contact_name: 'Concurrent User',
        phone: '+5511555555555',
        plan: 'professional'
      };

      const regResponse = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(business),
      });

      const regResult = await regResponse.json();
      const businessApiKey = regResult.apiKey.key;
      const businessId = regResult.business.id;

      const assistantResponse = await app.request('/api/assistants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${businessApiKey}`
        },
        body: JSON.stringify({
          name: 'Concurrent Assistant',
          description: 'Handles multiple conversations',
          personality: 'Efficient multitasker',
          system_prompt: 'Handle each conversation independently.',
          model_config: { model: 'gpt-3.5-turbo', temperature: 0.7, max_tokens: 500 }
        }),
      });

      const assistant = (await assistantResponse.json()).assistant;

      // Create multiple concurrent conversations
      const customers = [
        { jid: 'customer1@s.whatsapp.net', query: 'Hello, I need help with billing' },
        { jid: 'customer2@s.whatsapp.net', query: 'Can you help me with technical support?' },
        { jid: 'customer3@s.whatsapp.net', query: 'I want to upgrade my plan' }
      ];

      // Process all conversations concurrently
      const conversationPromises = customers.map(async (customer) => {
        const memoryContext = await memoryIntegrator.getMemoryContext(
          customer.jid,
          assistant.id,
          businessId,
          customer.query
        );

        await memoryIntegrator.storeConversationMessage(
          memoryContext.conversation_context.id,
          {
            sender_type: 'customer',
            sender_name: 'Customer',
            content: customer.query,
            message_type: 'text',
            metadata: {}
          }
        );

        return memoryContext.conversation_context.id;
      });

      const conversationIds = await Promise.all(conversationPromises);

      // Verify all conversations were created independently
      expect(conversationIds.length).toBe(3);
      expect(new Set(conversationIds).size).toBe(3); // All unique

      // Check conversations through API
      const conversationsResponse = await app.request('/api/conversations', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${businessApiKey}` },
      });

      const conversationsResult = await conversationsResponse.json();
      expect(conversationsResult.conversations.length).toBe(3);
      
      // Each conversation should have its own context
      for (const convId of conversationIds) {
        const convResponse = await app.request(`/api/conversations/${convId}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${businessApiKey}` },
        });

        const convDetail = await convResponse.json();
        expect(convDetail.success).toBe(true);
        expect(convDetail.messages.length).toBe(1);
      }
    });
  });
});