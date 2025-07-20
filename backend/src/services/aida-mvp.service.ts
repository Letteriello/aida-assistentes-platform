import { WhatsAppAuthService } from './whatsapp-auth.service';
import { WhatsAppInstanceService } from './whatsapp-instance.service';
import { SimplifiedBillingService } from './simplified-billing.service';
import { AssistantConfigService } from './assistant-config.service';
import { ProductCatalogService } from './product-catalog.service';
import { ConversationService } from './conversation.service';
import { Database } from '../database/database';

export interface AidaMVPConfig {
  supabaseUrl: string;
  supabaseKey: string;
  evolutionApiUrl: string;
  evolutionApiKey: string;
  jwtSecret: string;
  adminInstanceName: string;
}

export interface UserOnboardingData {
  phone: string;
  name?: string;
  companyName: string;
  businessType: string;
  conversationStyle: 'formal' | 'casual' | 'friendly';
}

export interface OnboardingResult {
  success: boolean;
  user?: Database['public']['Tables']['users_simplified']['Row'];
  instance?: Database['public']['Tables']['whatsapp_instances']['Row'];
  assistantConfig?: Database['public']['Tables']['assistant_configs']['Row'];
  billingCycle?: Database['public']['Tables']['billing_cycles']['Row'];
  qrCode?: string;
  error?: string;
}

/**
 * Main service orchestrator for AIDA MVP
 * Coordinates all simplified services for streamlined user experience
 */
export class AidaMVPService {
  private authService: WhatsAppAuthService;
  private instanceService: WhatsAppInstanceService;
  private billingService: SimplifiedBillingService;
  private assistantService: AssistantConfigService;
  private catalogService: ProductCatalogService;
  private conversationService: ConversationService;

  constructor(private config: AidaMVPConfig) {
    this.authService = new WhatsAppAuthService(
      config.supabaseUrl,
      config.supabaseKey,
      config.evolutionApiUrl,
      config.evolutionApiKey,
      config.jwtSecret,
      config.adminInstanceName
    );

    this.instanceService = new WhatsAppInstanceService(
      config.supabaseUrl,
      config.supabaseKey,
      config.evolutionApiUrl,
      config.evolutionApiKey
    );

    this.billingService = new SimplifiedBillingService(
      config.supabaseUrl,
      config.supabaseKey
    );

    this.assistantService = new AssistantConfigService(
      config.supabaseUrl,
      config.supabaseKey
    );

    this.catalogService = new ProductCatalogService(
      config.supabaseUrl,
      config.supabaseKey
    );

    this.conversationService = new ConversationService(
      config.supabaseUrl,
      config.supabaseKey
    );
  }

  /**
   * Complete user onboarding in 5 minutes or less
   * 1. WhatsApp authentication
   * 2. Instance creation and QR code
   * 3. Assistant configuration
   * 4. Billing setup
   */
  async completeOnboarding(data: UserOnboardingData): Promise<OnboardingResult> {
    try {
      console.log('Starting AIDA MVP onboarding for:', data.phone);

      // Step 1: Authenticate user via WhatsApp
      const authResult = await this.authService.sendAuthCode(data.phone);
      if (!authResult.success) {
        return { success: false, error: `Authentication failed: ${authResult.error}` };
      }

      // Note: In real implementation, we'd wait for code verification
      // For MVP demo, we'll simulate successful verification
      const verifyResult = await this.authService.verifyAuthCode(
        data.phone,
        '123456', // Demo code
        data.name
      );

      if (!verifyResult.success || !verifyResult.user) {
        return { success: false, error: `Verification failed: ${verifyResult.error}` };
      }

      const user = verifyResult.user;

      // Step 2: Create WhatsApp instance
      const instanceResult = await this.instanceService.createInstance(
        user.id,
        `${data.companyName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
      );

      if (!instanceResult.success || !instanceResult.instance) {
        return { success: false, error: `Instance creation failed: ${instanceResult.error}` };
      }

      const instance = instanceResult.instance;

      // Step 3: Configure AI assistant
      const assistantResult = await this.assistantService.createAssistantConfig(
        instance.id,
        {
          name: `${data.companyName} Assistant`,
          company_name: data.companyName,
          business_type: data.businessType,
          conversation_style: data.conversationStyle,
          is_active: true,
        }
      );

      if (!assistantResult.success || !assistantResult.config) {
        return { success: false, error: `Assistant config failed: ${assistantResult.error}` };
      }

      const assistantConfig = assistantResult.config;

      // Step 4: Setup billing
      const billingResult = await this.billingService.createBillingCycle(
        instance.id,
        user.id
      );

      if (!billingResult.success || !billingResult.cycle) {
        return { success: false, error: `Billing setup failed: ${billingResult.error}` };
      }

      const billingCycle = billingResult.cycle;

      // Step 5: Get QR code for WhatsApp connection
      const qrResult = await this.instanceService.refreshQRCode(instance.id);
      const qrCode = qrResult.success ? qrResult.qrCode : undefined;

      console.log('AIDA MVP onboarding completed successfully for:', data.phone);

      return {
        success: true,
        user,
        instance,
        assistantConfig,
        billingCycle,
        qrCode,
      };
    } catch (error) {
      console.error('Error during onboarding:', error);
      return { success: false, error: 'Onboarding process failed' };
    }
  }

  /**
   * Get user dashboard data
   */
  async getUserDashboard(userId: string): Promise<{
    success: boolean;
    data?: {
      user: Database['public']['Tables']['users_simplified']['Row'];
      instances: Database['public']['Tables']['whatsapp_instances']['Row'][];
      billingCycles: Database['public']['Tables']['billing_cycles']['Row'][];
      assistantConfigs: Database['public']['Tables']['assistant_configs']['Row'][];
      stats: {
        totalMessages: number;
        activeConversations: number;
        monthlyUsage: number;
      };
    };
    error?: string;
  }> {
    try {
      // Get user instances
      const instancesResult = await this.instanceService.listUserInstances(userId);
      if (!instancesResult.success) {
        return { success: false, error: instancesResult.error };
      }

      const instances = instancesResult.instances || [];

      // Get billing cycles
      const billingResult = await this.billingService.getUserBillingCycles(userId);
      if (!billingResult.success) {
        return { success: false, error: billingResult.error };
      }

      const billingCycles = billingResult.cycles || [];

      // Get assistant configs for all instances
      const assistantConfigs = [];
      for (const instance of instances) {
        const configResult = await this.assistantService.getAssistantConfig(instance.id);
        if (configResult.success && configResult.config) {
          assistantConfigs.push(configResult.config);
        }
      }

      // Calculate stats
      let totalMessages = 0;
      let activeConversations = 0;
      for (const instance of instances) {
        const statsResult = await this.conversationService.getConversationStats(instance.id);
        if (statsResult.success && statsResult.stats) {
          totalMessages += statsResult.stats.totalMessages;
          activeConversations += statsResult.stats.activeConversations;
        }
      }

      const monthlyUsage = billingCycles
        .filter(cycle => cycle.status === 'active')
        .reduce((sum, cycle) => sum + (cycle.messages_used || 0), 0);

      return {
        success: true,
        data: {
          user: { id: userId } as any, // Simplified for MVP
          instances,
          billingCycles,
          assistantConfigs,
          stats: {
            totalMessages,
            activeConversations,
            monthlyUsage,
          },
        },
      };
    } catch (error) {
      console.error('Error getting user dashboard:', error);
      return { success: false, error: 'Failed to get dashboard data' };
    }
  }

  /**
   * Process incoming WhatsApp message
   */
  async processIncomingMessage(
    instanceId: string,
    customerPhone: string,
    messageContent: string,
    messageType: 'text' | 'image' | 'audio' | 'video' | 'document' = 'text',
    customerName?: string
  ): Promise<{ success: boolean; response?: string; error?: string }> {
    try {
      // Check if instance can process messages (billing)
      const canProcess = await this.billingService.canProcessMessage(instanceId);
      if (!canProcess.success || !canProcess.canProcess) {
        return {
          success: false,
          error: 'Message limit reached or billing issue',
        };
      }

      // Get or create conversation
      const conversationResult = await this.conversationService.getOrCreateConversation(
        instanceId,
        customerPhone,
        customerName
      );

      if (!conversationResult.success || !conversationResult.conversation) {
        return { success: false, error: 'Failed to get conversation' };
      }

      const conversation = conversationResult.conversation;

      // Add incoming message
      const messageResult = await this.conversationService.addMessage(
        conversation.id,
        {
          content: messageContent,
          message_type: messageType,
          direction: 'inbound',
          customer_phone: customerPhone,
        }
      );

      if (!messageResult.success) {
        return { success: false, error: 'Failed to save message' };
      }

      // Get assistant configuration
      const assistantResult = await this.assistantService.getAssistantConfig(instanceId);
      if (!assistantResult.success || !assistantResult.config) {
        return { success: false, error: 'Assistant not configured' };
      }

      const assistantConfig = assistantResult.config;

      // Generate AI response (simplified for MVP)
      const aiResponse = await this.generateAIResponse(
        messageContent,
        assistantConfig,
        conversation
      );

      // Add AI response message
      await this.conversationService.addMessage(conversation.id, {
        content: aiResponse,
        message_type: 'text',
        direction: 'outbound',
        customer_phone: customerPhone,
      });

      // Increment message count for billing
      await this.billingService.incrementMessageCount(instanceId);

      return { success: true, response: aiResponse };
    } catch (error) {
      console.error('Error processing message:', error);
      return { success: false, error: 'Failed to process message' };
    }
  }

  /**
   * Generate AI response (simplified for MVP)
   */
  private async generateAIResponse(
    userMessage: string,
    assistantConfig: Database['public']['Tables']['assistant_configs']['Row'],
    conversation: Database['public']['Tables']['conversations_simplified']['Row']
  ): Promise<string> {
    // Simplified AI response generation for MVP
    // In production, this would integrate with OpenAI/Claude/etc.
    
    const context = assistantConfig.system_prompt || '';
    const style = assistantConfig.conversation_style || 'friendly';
    
    // Basic response templates based on style
    const responses = {
      formal: [
        `Thank you for your message. I'm the ${assistantConfig.company_name} assistant. How may I assist you today?`,
        `I understand your inquiry. Let me help you with that.`,
        `Thank you for contacting ${assistantConfig.company_name}. I'm here to help.`,
      ],
      casual: [
        `Hey! Thanks for reaching out. What can I help you with?`,
        `Hi there! I'm here to help with anything you need.`,
        `What's up? How can I assist you today?`,
      ],
      friendly: [
        `Hello! 😊 I'm the ${assistantConfig.company_name} assistant. How can I help you today?`,
        `Hi! Thanks for your message. I'm here to help! 🤝`,
        `Hello there! What can I do for you today? 😊`,
      ],
    };

    const styleResponses = responses[style] || responses.friendly;
    const randomResponse = styleResponses[Math.floor(Math.random() * styleResponses.length)];

    return randomResponse;
  }

  /**
   * Get service instances for advanced usage
   */
  getServices() {
    return {
      auth: this.authService,
      instance: this.instanceService,
      billing: this.billingService,
      assistant: this.assistantService,
      catalog: this.catalogService,
      conversation: this.conversationService,
    };
  }
}

/**
 * Factory function to create AidaMVPService instance
 */
export function createAidaMVPService(config: AidaMVPConfig): AidaMVPService {
  return new AidaMVPService(config);
}