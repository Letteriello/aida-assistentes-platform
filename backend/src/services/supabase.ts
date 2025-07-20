// =============================================================================
// SUPABASE SERVICE - DATABASE & AUTH OPERATIONS
// =============================================================================
// Complete service for Supabase operations
// Handles authentication, user management, instances, and vector operations
// =============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  serviceKey: string;
  anonKey?: string;
}

export interface User {
  id: string;
  phone_number: string;
  name?: string;
  email?: string;
  verification_code?: string;
  verification_code_expires_at?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface WhatsAppInstanceDB {
  id: string;
  user_id: string;
  instance_name: string;
  status: 'creating' | 'connecting' | 'connected' | 'disconnected' | 'error';
  qr_code?: string;
  qr_code_base64?: string;
  phone_number?: string;
  assistant_name: string;
  assistant_description?: string;
  subscription_status: 'active' | 'cancelled' | 'suspended';
  current_period_start: string;
  current_period_end: string;
  next_billing_date: string;
  message_limit: number;
  document_limit: number;
  messages_used: number;
  documents_used: number;
  created_at: string;
  updated_at: string;
  last_connection_at?: string;
  error_message?: string;
}

export interface BusinessContext {
  id: string;
  instance_id: string;
  business_name?: string;
  business_type?: string;
  business_description?: string;
  target_audience?: string;
  business_hours?: any;
  contact_info?: any;
  products_services?: string;
  pricing_info?: string;
  policies?: string;
  tone_of_voice: string;
  communication_style?: string;
  custom_instructions?: string;
  created_at: string;
  updated_at: string;
}

export class SupabaseService {
  private client: SupabaseClient;
  private config: SupabaseConfig;

  constructor(config: SupabaseConfig) {
    this.config = config;
    this.client = createClient(config.url, config.serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  // =============================================================================
  // USER AUTHENTICATION & MANAGEMENT
  // =============================================================================

  /**
   * Create or update user with phone number
   */
  async createOrUpdateUser(phoneNumber: string, verificationCode: string): Promise<User> {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes expiry

    try {
      const { data, error } = await this.client
        .from('users')
        .upsert({
          phone_number: phoneNumber,
          verification_code: verificationCode,
          verification_code_expires_at: expiresAt.toISOString(),
          is_verified: false,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'phone_number'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error creating/updating user:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log(`✅ User created/updated for phone: ${phoneNumber}`);
      return data;
    } catch (error: any) {
      console.error('❌ Failed to create/update user:', error);
      throw error;
    }
  }

  /**
   * Verify user with code
   */
  async verifyUser(phoneNumber: string, code: string): Promise<User | null> {
    try {
      const { data, error } = await this.client
        .from('users')
        .select()
        .eq('phone_number', phoneNumber)
        .eq('verification_code', code)
        .gt('verification_code_expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        console.log(`❌ Invalid or expired verification code for ${phoneNumber}`);
        return null;
      }

      // Update user as verified
      const { data: updatedUser, error: updateError } = await this.client
        .from('users')
        .update({
          is_verified: true,
          verification_code: null,
          verification_code_expires_at: null,
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Failed to update user verification status:', updateError);
        throw new Error(`Failed to verify user: ${updateError.message}`);
      }

      console.log(`✅ User verified successfully: ${phoneNumber}`);
      return updatedUser;
    } catch (error: any) {
      console.error('❌ Failed to verify user:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await this.client
        .from('users')
        .select()
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Failed to get user by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Failed to get user by ID:', error);
      return null;
    }
  }

  /**
   * Get user by phone number
   */
  async getUserByPhone(phoneNumber: string): Promise<User | null> {
    try {
      const { data, error } = await this.client
        .from('users')
        .select()
        .eq('phone_number', phoneNumber)
        .single();

      if (error) {
        console.error('❌ Failed to get user by phone:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Failed to get user by phone:', error);
      return null;
    }
  }

  // =============================================================================
  // WHATSAPP INSTANCES MANAGEMENT
  // =============================================================================

  /**
   * Create WhatsApp instance
   */
  async createWhatsAppInstance(
    userId: string,
    instanceName: string,
    assistantName: string = 'Assistente AI'
  ): Promise<WhatsAppInstanceDB> {
    try {
      const { data, error } = await this.client
        .from('whatsapp_instances')
        .insert({
          user_id: userId,
          instance_name: instanceName,
          assistant_name: assistantName,
          status: 'creating',
          subscription_status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          message_limit: 1000,
          document_limit: 10,
          messages_used: 0,
          documents_used: 0
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create WhatsApp instance:', error);
        throw new Error(`Failed to create instance: ${error.message}`);
      }

      // Create business context for the instance
      await this.createBusinessContext(data.id);

      console.log(`✅ WhatsApp instance created: ${instanceName}`);
      return data;
    } catch (error: any) {
      console.error('❌ Failed to create WhatsApp instance:', error);
      throw error;
    }
  }

  /**
   * Update WhatsApp instance
   */
  async updateWhatsAppInstance(
    instanceId: string,
    updates: Partial<WhatsAppInstanceDB>
  ): Promise<WhatsAppInstanceDB | null> {
    try {
      const { data, error } = await this.client
        .from('whatsapp_instances')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to update WhatsApp instance:', error);
        return null;
      }

      console.log(`✅ WhatsApp instance updated: ${instanceId}`);
      return data;
    } catch (error) {
      console.error('❌ Failed to update WhatsApp instance:', error);
      return null;
    }
  }

  /**
   * Get user's WhatsApp instances
   */
  async getUserInstances(userId: string): Promise<WhatsAppInstanceDB[]> {
    try {
      const { data, error } = await this.client
        .from('whatsapp_instances')
        .select()
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to get user instances:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get user instances:', error);
      return [];
    }
  }

  /**
   * Get instance by name
   */
  async getInstanceByName(instanceName: string): Promise<WhatsAppInstanceDB | null> {
    try {
      const { data, error } = await this.client
        .from('whatsapp_instances')
        .select()
        .eq('instance_name', instanceName)
        .single();

      if (error) {
        console.error('❌ Failed to get instance by name:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Failed to get instance by name:', error);
      return null;
    }
  }

  /**
   * Delete WhatsApp instance
   */
  async deleteWhatsAppInstance(instanceId: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('whatsapp_instances')
        .delete()
        .eq('id', instanceId);

      if (error) {
        console.error('❌ Failed to delete WhatsApp instance:', error);
        return false;
      }

      console.log(`✅ WhatsApp instance deleted: ${instanceId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete WhatsApp instance:', error);
      return false;
    }
  }

  // =============================================================================
  // BUSINESS CONTEXT MANAGEMENT
  // =============================================================================

  /**
   * Create business context for instance
   */
  async createBusinessContext(instanceId: string): Promise<BusinessContext> {
    try {
      const { data, error } = await this.client
        .from('business_context')
        .insert({
          instance_id: instanceId,
          tone_of_voice: 'professional'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create business context:', error);
        throw new Error(`Failed to create business context: ${error.message}`);
      }

      console.log(`✅ Business context created for instance: ${instanceId}`);
      return data;
    } catch (error: any) {
      console.error('❌ Failed to create business context:', error);
      throw error;
    }
  }

  /**
   * Update business context
   */
  async updateBusinessContext(
    instanceId: string,
    updates: Partial<BusinessContext>
  ): Promise<BusinessContext | null> {
    try {
      const { data, error } = await this.client
        .from('business_context')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('instance_id', instanceId)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to update business context:', error);
        return null;
      }

      console.log(`✅ Business context updated for instance: ${instanceId}`);
      return data;
    } catch (error) {
      console.error('❌ Failed to update business context:', error);
      return null;
    }
  }

  /**
   * Get business context by instance ID
   */
  async getBusinessContext(instanceId: string): Promise<BusinessContext | null> {
    try {
      const { data, error } = await this.client
        .from('business_context')
        .select()
        .eq('instance_id', instanceId)
        .single();

      if (error) {
        console.error('❌ Failed to get business context:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Failed to get business context:', error);
      return null;
    }
  }

  // =============================================================================
  // USAGE TRACKING
  // =============================================================================

  /**
   * Increment message usage
   */
  async incrementMessageUsage(instanceId: string, count: number = 1): Promise<boolean> {
    try {
      const { error } = await this.client.rpc('increment_usage', {
        p_instance_id: instanceId,
        p_usage_type: 'message',
        p_amount: count
      });

      if (error) {
        console.error('❌ Failed to increment message usage:', error);
        return false;
      }

      console.log(`✅ Message usage incremented by ${count} for instance: ${instanceId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to increment message usage:', error);
      return false;
    }
  }

  /**
   * Increment document usage
   */
  async incrementDocumentUsage(instanceId: string, count: number = 1): Promise<boolean> {
    try {
      const { error } = await this.client.rpc('increment_usage', {
        p_instance_id: instanceId,
        p_usage_type: 'document',
        p_amount: count
      });

      if (error) {
        console.error('❌ Failed to increment document usage:', error);
        return false;
      }

      console.log(`✅ Document usage incremented by ${count} for instance: ${instanceId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to increment document usage:', error);
      return false;
    }
  }

  /**
   * Check usage limits
   */
  async checkUsageLimit(instanceId: string, type: 'message' | 'document'): Promise<boolean> {
    try {
      const { data, error } = await this.client.rpc('check_usage_limits', {
        p_instance_id: instanceId,
        p_usage_type: type
      });

      if (error) {
        console.error('❌ Failed to check usage limits:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('❌ Failed to check usage limits:', error);
      return false;
    }
  }

  // =============================================================================
  // ADMIN FUNCTIONS
  // =============================================================================

  /**
   * Get admin auth instance configuration
   */
  async getAdminAuthInstance(): Promise<any> {
    try {
      const { data, error } = await this.client
        .from('admin_auth_instance')
        .select()
        .eq('instance_name', 'admin-auth-instance')
        .single();

      if (error) {
        console.error('❌ Failed to get admin auth instance:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Failed to get admin auth instance:', error);
      return null;
    }
  }

  /**
   * Create or update admin auth instance
   */
  async upsertAdminAuthInstance(config: {
    evolutionApiUrl: string;
    evolutionApiKey: string;
    phoneNumber: string;
  }): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('admin_auth_instance')
        .upsert({
          instance_name: 'admin-auth-instance',
          evolution_api_url: config.evolutionApiUrl,
          evolution_api_key: config.evolutionApiKey,
          phone_number: config.phoneNumber,
          status: 'active',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'instance_name'
        });

      if (error) {
        console.error('❌ Failed to upsert admin auth instance:', error);
        return false;
      }

      console.log('✅ Admin auth instance configuration saved');
      return true;
    } catch (error) {
      console.error('❌ Failed to upsert admin auth instance:', error);
      return false;
    }
  }
}

// Export types
export type {
  SupabaseConfig,
  User,
  WhatsAppInstanceDB,
  BusinessContext
};