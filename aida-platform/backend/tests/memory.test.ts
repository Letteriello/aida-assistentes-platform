import { describe, it, expect, beforeEach } from 'vitest';
import { ConversationMemoryManager } from '../src/memory/conversation-history';
import { BusinessKnowledgeManager } from '../src/memory/business-knowledge';
import { MemoryIntegrator } from '../src/memory/memory-integrator';
import { testData, testSupabase } from './setup';

describe('Memory Integration System Tests', () => {
  let conversationMemory: ConversationMemoryManager;
  let businessKnowledge: BusinessKnowledgeManager;
  let memoryIntegrator: MemoryIntegrator;

  beforeEach(() => {
    conversationMemory = new ConversationMemoryManager(testSupabase);
    businessKnowledge = new BusinessKnowledgeManager(testSupabase);
    memoryIntegrator = new MemoryIntegrator(conversationMemory, businessKnowledge);
  });

  describe('Conversation Memory Manager', () => {
    it('should create or get existing conversation context', async () => {
      const remoteJid = 'test-customer@whatsapp.net';
      const assistantId = testData.testAssistant.id;
      const businessId = testData.testBusiness.id;

      const context = await conversationMemory.getOrCreateConversation(
        remoteJid,
        assistantId,
        businessId
      );

      expect(context).toBeDefined();
      expect(context.remote_jid).toBe(remoteJid);
      expect(context.assistant_id).toBe(assistantId);
      expect(context.business_id).toBe(businessId);
      expect(context.messages).toEqual([]);
      expect(context.customer_profile).toEqual({});

      // Should return the same context on subsequent calls
      const context2 = await conversationMemory.getOrCreateConversation(
        remoteJid,
        assistantId,
        businessId
      );

      expect(context2.id).toBe(context.id);
    });

    it('should add messages to conversation memory', async () => {
      const remoteJid = 'test-memory-customer@whatsapp.net';
      const assistantId = testData.testAssistant.id;
      const businessId = testData.testBusiness.id;

      // Create conversation context
      const context = await conversationMemory.getOrCreateConversation(
        remoteJid,
        assistantId,
        businessId
      );

      // Add customer message
      const customerMessage = {
        sender_type: 'customer' as const,
        sender_name: 'Test Customer',
        content: 'Hello, I need help with product X',
        message_type: 'text' as const,
        metadata: {}
      };

      await conversationMemory.addMessage(context.id, customerMessage);

      // Add assistant response
      const assistantMessage = {
        sender_type: 'assistant' as const,
        sender_name: 'Test Assistant',
        content: 'Hello! I\'d be happy to help you with product X. What specific information do you need?',
        message_type: 'text' as const,
        metadata: {
          ai_confidence: 0.95,
          response_time: 1.2
        }
      };

      await conversationMemory.addMessage(context.id, assistantMessage);

      // Retrieve updated context
      const updatedContext = await conversationMemory.getConversationContext(context.id);

      expect(updatedContext).toBeDefined();
      expect(updatedContext.messages).toHaveLength(2);
      expect(updatedContext.messages[0].content).toBe(customerMessage.content);
      expect(updatedContext.messages[1].content).toBe(assistantMessage.content);
      expect(updatedContext.messages[1].metadata.ai_confidence).toBe(0.95);
    });

    it('should build customer profile from conversation', async () => {
      const remoteJid = 'profiling-customer@whatsapp.net';
      const assistantId = testData.testAssistant.id;
      const businessId = testData.testBusiness.id;

      const context = await conversationMemory.getOrCreateConversation(
        remoteJid,
        assistantId,
        businessId
      );

      // Add messages that reveal customer information
      const messages = [
        {
          sender_type: 'customer' as const,
          sender_name: 'João Silva',
          content: 'Hi, my name is João Silva and I\'m interested in your premium plan',
          message_type: 'text' as const,
          metadata: {}
        },
        {
          sender_type: 'customer' as const,
          sender_name: 'João Silva',
          content: 'I work at TechCorp and we need a solution for 50 employees',
          message_type: 'text' as const,
          metadata: {}
        },
        {
          sender_type: 'customer' as const,
          sender_name: 'João Silva',
          content: 'Our budget is around R$ 10,000 per month',
          message_type: 'text' as const,
          metadata: {}
        }
      ];

      for (const message of messages) {
        await conversationMemory.addMessage(context.id, message);
      }

      // Get updated context with customer profile
      const updatedContext = await conversationMemory.getConversationContext(context.id);

      expect(updatedContext.customer_profile).toBeDefined();
      // The AI should extract information about the customer
      expect(updatedContext.customer_profile).toHaveProperty('interests');
      expect(updatedContext.customer_profile).toHaveProperty('company');
      expect(updatedContext.customer_profile).toHaveProperty('budget_range');
    });

    it('should summarize long conversations', async () => {
      const remoteJid = 'long-conversation@whatsapp.net';
      const assistantId = testData.testAssistant.id;
      const businessId = testData.testBusiness.id;

      const context = await conversationMemory.getOrCreateConversation(
        remoteJid,
        assistantId,
        businessId
      );

      // Add many messages to trigger summarization
      for (let i = 0; i < 25; i++) {
        await conversationMemory.addMessage(context.id, {
          sender_type: i % 2 === 0 ? 'customer' : 'assistant',
          sender_name: i % 2 === 0 ? 'Customer' : 'Assistant',
          content: `Message ${i + 1}: This is test message content.`,
          message_type: 'text',
          metadata: {}
        });
      }

      const updatedContext = await conversationMemory.getConversationContext(context.id);

      // Should have summary for older messages
      expect(updatedContext.summary).toBeDefined();
      expect(updatedContext.summary.length).toBeGreaterThan(0);
      
      // Should keep recent messages in full
      expect(updatedContext.messages.length).toBeLessThan(25);
      expect(updatedContext.messages.length).toBeGreaterThan(10); // Keep last 15 messages
    });
  });

  describe('Business Knowledge Manager', () => {
    it('should create knowledge nodes', async () => {
      const knowledgeData = {
        title: 'Product X Specifications',
        content: 'Product X is our premium solution with features A, B, and C. It costs R$ 299 and comes with 24/7 support.',
        type: 'product_info' as const,
        tags: ['product-x', 'pricing', 'support'],
        metadata: {
          category: 'products',
          last_updated: new Date().toISOString()
        }
      };

      const node = await businessKnowledge.createKnowledgeNode(
        testData.testBusiness.id,
        knowledgeData
      );

      expect(node).toBeDefined();
      expect(node.business_id).toBe(testData.testBusiness.id);
      expect(node.title).toBe(knowledgeData.title);
      expect(node.content).toBe(knowledgeData.content);
      expect(node.type).toBe(knowledgeData.type);
      expect(node.tags).toEqual(knowledgeData.tags);
      expect(node).toHaveProperty('embedding');
      expect(node.embedding).toHaveLength(1536); // OpenAI embedding dimension
    });

    it('should search knowledge by similarity', async () => {
      // Create test knowledge nodes
      const knowledgeNodes = [
        {
          title: 'Pricing Information',
          content: 'Our starter plan costs R$ 99/month, professional plan costs R$ 299/month, and enterprise plan costs R$ 899/month.',
          type: 'pricing' as const,
          tags: ['pricing', 'plans'],
          metadata: {}
        },
        {
          title: 'Technical Support',
          content: 'We provide 24/7 technical support via email, chat, and phone. Response time is within 2 hours for critical issues.',
          type: 'support' as const,
          tags: ['support', 'technical'],
          metadata: {}
        },
        {
          title: 'Product Features',
          content: 'Our platform includes AI assistants, conversation management, analytics dashboard, and WhatsApp integration.',
          type: 'product_info' as const,
          tags: ['features', 'product'],
          metadata: {}
        }
      ];

      for (const nodeData of knowledgeNodes) {
        await businessKnowledge.createKnowledgeNode(testData.testBusiness.id, nodeData);
      }

      // Search for pricing information
      const pricingResults = await businessKnowledge.searchKnowledge(
        testData.testBusiness.id,
        'How much does the professional plan cost?',
        { limit: 2, threshold: 0.7 }
      );

      expect(pricingResults).toHaveLength(1);
      expect(pricingResults[0].title).toBe('Pricing Information');
      expect(pricingResults[0].similarity_score).toBeGreaterThan(0.7);

      // Search for support information
      const supportResults = await businessKnowledge.searchKnowledge(
        testData.testBusiness.id,
        'What support options are available?',
        { limit: 3, threshold: 0.6 }
      );

      expect(supportResults.length).toBeGreaterThan(0);
      const supportNode = supportResults.find(r => r.title === 'Technical Support');
      expect(supportNode).toBeDefined();
    });

    it('should query knowledge graph relationships', async () => {
      // Create related knowledge nodes
      const parentNode = await businessKnowledge.createKnowledgeNode(
        testData.testBusiness.id,
        {
          title: 'AIDA Platform Overview',
          content: 'AIDA is a comprehensive WhatsApp AI assistant platform for businesses.',
          type: 'product_overview' as const,
          tags: ['platform', 'overview'],
          metadata: {}
        }
      );

      const childNode1 = await businessKnowledge.createKnowledgeNode(
        testData.testBusiness.id,
        {
          title: 'AI Assistant Features',
          content: 'AI assistants can handle customer queries, provide product information, and escalate complex issues.',
          type: 'features' as const,
          tags: ['ai', 'features'],
          metadata: { parent_id: parentNode.id }
        }
      );

      const childNode2 = await businessKnowledge.createKnowledgeNode(
        testData.testBusiness.id,
        {
          title: 'WhatsApp Integration',
          content: 'Seamless integration with WhatsApp Business API for real-time communication.',
          type: 'integration' as const,
          tags: ['whatsapp', 'integration'],
          metadata: { parent_id: parentNode.id }
        }
      );

      // Query the knowledge graph
      const graphResults = await businessKnowledge.queryKnowledgeGraph(
        testData.testBusiness.id,
        'Tell me about AIDA platform features',
        { max_depth: 2, include_relationships: true }
      );

      expect(graphResults).toBeDefined();
      expect(graphResults.primary_nodes.length).toBeGreaterThan(0);
      expect(graphResults.related_nodes.length).toBeGreaterThan(0);
      
      // Should find the overview node as primary
      const overviewNode = graphResults.primary_nodes.find(n => n.title === 'AIDA Platform Overview');
      expect(overviewNode).toBeDefined();
      
      // Should find related feature nodes
      const featureNodes = graphResults.related_nodes.filter(n => 
        n.title.includes('Features') || n.title.includes('Integration')
      );
      expect(featureNodes.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle knowledge versioning', async () => {
      const originalNode = await businessKnowledge.createKnowledgeNode(
        testData.testBusiness.id,
        {
          title: 'Product Pricing',
          content: 'Starter plan: R$ 99/month',
          type: 'pricing' as const,
          tags: ['pricing'],
          metadata: { version: 1 }
        }
      );

      // Update the knowledge
      const updatedNode = await businessKnowledge.updateKnowledgeNode(
        originalNode.id,
        {
          content: 'Starter plan: R$ 129/month (updated pricing)',
          metadata: { version: 2, previous_version_id: originalNode.id }
        }
      );

      expect(updatedNode.content).toContain('R$ 129/month');
      expect(updatedNode.metadata.version).toBe(2);
      expect(updatedNode.metadata.previous_version_id).toBe(originalNode.id);

      // Original node should be marked as outdated
      const { data: originalNodeData } = await testSupabase
        .from('business_knowledge')
        .select('is_active')
        .eq('id', originalNode.id)
        .single();

      expect(originalNodeData?.is_active).toBe(false);
    });
  });

  describe('Memory Integrator', () => {
    it('should integrate conversation and business knowledge', async () => {
      const remoteJid = 'integration-test@whatsapp.net';
      const assistantId = testData.testAssistant.id;
      const businessId = testData.testBusiness.id;

      // Create business knowledge
      await businessKnowledge.createKnowledgeNode(businessId, {
        title: 'Return Policy',
        content: 'We offer 30-day money-back guarantee for all products. No questions asked.',
        type: 'policy' as const,
        tags: ['returns', 'policy'],
        metadata: {}
      });

      // Create conversation with relevant message
      const context = await conversationMemory.getOrCreateConversation(
        remoteJid,
        assistantId,
        businessId
      );

      await conversationMemory.addMessage(context.id, {
        sender_type: 'customer',
        sender_name: 'Customer',
        content: 'What is your return policy?',
        message_type: 'text',
        metadata: {}
      });

      // Get integrated memory context
      const memoryContext = await memoryIntegrator.getMemoryContext(
        remoteJid,
        assistantId,
        businessId,
        'What is your return policy?'
      );

      expect(memoryContext).toBeDefined();
      expect(memoryContext.conversation_context).toBeDefined();
      expect(memoryContext.relevant_knowledge).toBeDefined();
      expect(memoryContext.relevant_knowledge.length).toBeGreaterThan(0);

      // Should find the return policy knowledge
      const returnPolicyKnowledge = memoryContext.relevant_knowledge.find(
        k => k.title === 'Return Policy'
      );
      expect(returnPolicyKnowledge).toBeDefined();
      expect(returnPolicyKnowledge?.similarity_score).toBeGreaterThan(0.7);
    });

    it('should provide query-specific memory retrieval', async () => {
      const businessId = testData.testBusiness.id;

      // Create diverse knowledge base
      const knowledgeItems = [
        {
          title: 'Pricing Plans',
          content: 'We have three plans: Starter (R$ 99), Professional (R$ 299), Enterprise (R$ 899)',
          type: 'pricing' as const,
          tags: ['pricing', 'plans'],
          metadata: {}
        },
        {
          title: 'API Documentation',
          content: 'Our REST API supports CRUD operations for assistants, conversations, and analytics',
          type: 'documentation' as const,
          tags: ['api', 'docs'],
          metadata: {}
        },
        {
          title: 'Onboarding Process',
          content: 'New customers: 1) Sign up, 2) Create assistant, 3) Connect WhatsApp, 4) Test functionality',
          type: 'process' as const,
          tags: ['onboarding', 'process'],
          metadata: {}
        }
      ];

      for (const item of knowledgeItems) {
        await businessKnowledge.createKnowledgeNode(businessId, item);
      }

      // Query for pricing information
      const pricingMemory = await memoryIntegrator.queryMemory(
        businessId,
        'How much does the professional plan cost?',
        { focus: 'pricing', max_results: 3 }
      );

      expect(pricingMemory.knowledge_results.length).toBeGreaterThan(0);
      const pricingResult = pricingMemory.knowledge_results.find(r => r.title === 'Pricing Plans');
      expect(pricingResult).toBeDefined();
      expect(pricingResult?.similarity_score).toBeGreaterThan(0.8);

      // Query for technical information
      const technicalMemory = await memoryIntegrator.queryMemory(
        businessId,
        'How do I use the API?',
        { focus: 'technical', max_results: 3 }
      );

      expect(technicalMemory.knowledge_results.length).toBeGreaterThan(0);
      const apiResult = technicalMemory.knowledge_results.find(r => r.title === 'API Documentation');
      expect(apiResult).toBeDefined();
    });

    it('should store conversation messages with memory context', async () => {
      const remoteJid = 'storage-test@whatsapp.net';
      const assistantId = testData.testAssistant.id;
      const businessId = testData.testBusiness.id;

      // Create conversation
      const context = await conversationMemory.getOrCreateConversation(
        remoteJid,
        assistantId,
        businessId
      );

      // Store message with memory integration
      const message = {
        sender_type: 'customer' as const,
        sender_name: 'Test Customer',
        content: 'I want to upgrade to professional plan',
        message_type: 'text' as const,
        metadata: {}
      };

      const storedMessage = await memoryIntegrator.storeConversationMessage(
        context.id,
        message,
        { include_knowledge_context: true }
      );

      expect(storedMessage).toBeDefined();
      expect(storedMessage.conversation_id).toBe(context.id);
      expect(storedMessage.content).toBe(message.content);
      expect(storedMessage.metadata).toHaveProperty('knowledge_context');
      
      // Should have found relevant knowledge about plans/pricing
      if (storedMessage.metadata.knowledge_context) {
        expect(storedMessage.metadata.knowledge_context.length).toBeGreaterThan(0);
      }
    });

    it('should handle memory context for multi-turn conversations', async () => {
      const remoteJid = 'multi-turn-test@whatsapp.net';
      const assistantId = testData.testAssistant.id;
      const businessId = testData.testBusiness.id;

      // Create knowledge base
      await businessKnowledge.createKnowledgeNode(businessId, {
        title: 'Enterprise Features',
        content: 'Enterprise plan includes: unlimited assistants, priority support, custom integrations, analytics API',
        type: 'features' as const,
        tags: ['enterprise', 'features'],
        metadata: {}
      });

      // Simulate multi-turn conversation
      const turns = [
        'Tell me about your enterprise plan',
        'What kind of support is included?',
        'How many assistants can I create?',
        'Do you have API access for analytics?'
      ];

      let conversationContext;
      for (const [index, query] of turns.entries()) {
        conversationContext = await memoryIntegrator.getMemoryContext(
          remoteJid,
          assistantId,
          businessId,
          query
        );

        // Add the customer message
        await conversationMemory.addMessage(conversationContext.conversation_context.id, {
          sender_type: 'customer',
          sender_name: 'Customer',
          content: query,
          message_type: 'text',
          metadata: {}
        });

        // Each turn should have access to previous conversation context
        expect(conversationContext.conversation_context.messages.length).toBe(index);
        
        // Should find relevant knowledge about enterprise features
        if (index === 0) {
          const enterpriseKnowledge = conversationContext.relevant_knowledge.find(
            k => k.title === 'Enterprise Features'
          );
          expect(enterpriseKnowledge).toBeDefined();
        }
      }

      // Final context should have all conversation history
      expect(conversationContext?.conversation_context.messages.length).toBe(turns.length);
    });
  });
});