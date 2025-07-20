/**
 * Evolution API Webhook Handler for AIDA Platform
 * 
 * Handles incoming WhatsApp messages from Evolution API webhooks
 * Processes messages through AI and manages conversations
 * 
 * ARCHITECTURE:
 * 1. Find the assistant associated with the instance
 * 2. Get or create the conversation
 * 3. Process the message with the AI
 * 4. Send the response back to the user
 * 5. Update message usage for billing (metering in real-time)
 */

import type { EvolutionAPIClient } from './client';
import { createEvolutionClient } from './client';
import { TenantAwareSupabase } from '../database/tenant-aware-supabase';
import { processMessageWithAI } from '../ai/ai-processor';
import { createBillingService } from '../billing/billing-service';
import type { EvolutionWebhook } from '@shared/types';
export interface WebhookHandlerConfig {
  onMessageProcessed?: (
    instanceId: string,
    remoteJid: string,
    message: string,
    response: string
  ) => void;
  onError?: (error: Error, context: unknown) => void;
  enableBilling?: boolean;
  supabaseConfig?: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  evolutionConfig?: {
    baseUrl: string;
    apiKey: string;
  };
}

export interface EvolutionWebhookHandler {
  handleWhatsAppWebhook(webhook: EvolutionWebhook): Promise<void>;
  healthCheck(): Promise<boolean>;
}
/**
 * WebhookHandler implementation for Evolution API
 */
class WebhookHandlerImpl implements EvolutionWebhookHandler {
  private evolutionClient: EvolutionAPIClient;
  private supabase: TenantAwareSupabase;
  private billingService: any;

  constructor(private config: WebhookHandlerConfig) {
    if (!config.supabaseConfig) {
      throw new Error('Supabase configuration is required');
    }
    if (!config.evolutionConfig) {
      throw new Error('Evolution API configuration is required');
    }

    this.evolutionClient = createEvolutionClient(config.evolutionConfig);
    this.supabase = new TenantAwareSupabase(config.supabaseConfig, 'default');
    
    if (config.enableBilling) {
      this.billingService = createBillingService(this.supabase);
    }
  }

  async handleWhatsAppWebhook(webhook: EvolutionWebhook): Promise<void> {
    try {
      const { instance, data } = webhook;
      
      // Ignore messages from self
      if (data.key.fromMe) {
        console.log('[Webhook] Ignoring message from self');
        return;
      }

      // Extract message content
      const message = data.message?.conversation || 
                     data.message?.extendedTextMessage?.text || 
                     data.message?.imageMessage?.caption ||
                     '';
      
      const remoteJid = data.key.remoteJid;
      
      if (!message.trim()) {
        console.log('[Webhook] No message content found');
        return;
      }

      // Find assistant by instance ID
      const { data: assistant, error: assistantError } = await this.supabase
        .from('assistants')
        .select('*')
        .eq('whatsapp_instance_id', instance)
        .single();

      if (assistantError || !assistant) {
        console.error('[Webhook] Assistant not found for instance:', instance);
        if (this.config.onError) {
          this.config.onError(new Error('Assistant not found'), { instance, remoteJid });
        }
        return;
      }

      // Get or create conversation
      let { data: conversation } = await this.supabase
        .from('conversations')
        .select('*')
        .eq('assistant_id', assistant.id)
        .eq('remote_jid', remoteJid)
        .single();

      if (!conversation) {
        const { data: newConversation, error: conversationError } = await this.supabase
          .from('conversations')
          .insert({
            assistant_id: assistant.id,
            remote_jid: remoteJid,
            context_summary: {},
            status: 'active'
          })
          .select()
          .single();

        if (conversationError) {
          console.error('[Webhook] Failed to create conversation:', conversationError);
          if (this.config.onError) {
            this.config.onError(new Error('Failed to create conversation'), { instance, remoteJid });
          }
          return;
        }
        conversation = newConversation;
      }

      // Process message with AI
      const response = await processMessageWithAI(
        message,
        assistant.id,
        conversation.id,
        assistant.business_id,
        this.supabase
      );

      // Send response back to WhatsApp
      await this.evolutionClient.sendTextMessage(instance, remoteJid, response);

      // Update billing if enabled
      if (this.config.enableBilling && this.billingService) {
        try {
          await this.billingService.updateUsage(assistant.business_id, 'messages', 1);
        } catch (billingError) {
          console.error('[Webhook] Failed to update billing:', billingError);
          // Don't fail the webhook if billing update fails
        }
      }

      // Call success callback
      if (this.config.onMessageProcessed) {
        this.config.onMessageProcessed(instance, remoteJid, message, response);
      }

      console.log('[Webhook] Message processed successfully');
    } catch (error) {
      console.error('[Webhook] Error processing webhook:', error);
      if (this.config.onError) {
        this.config.onError(error as Error, webhook);
      }
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      return await this.evolutionClient.healthCheck();
    } catch (error) {
      console.error('[Webhook] Health check failed:', error);
      return false;
    }
  }
}
/**
 * Factory function to create a webhook handler
 */
export function createWebhookHandler(config: WebhookHandlerConfig): EvolutionWebhookHandler {
  return new WebhookHandlerImpl(config);
}

/**
 * Export the webhook handler type for external use
 */
export type { EvolutionWebhookHandler };
