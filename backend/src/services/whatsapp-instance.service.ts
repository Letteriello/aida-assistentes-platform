import { createClient } from '@supabase/supabase-js';
import { EvolutionAPIClient } from '../evolution-api/client';
import { Database } from '../../../shared/types/database';

type SupabaseClient = ReturnType<typeof createClient<Database>>;

interface WhatsAppInstanceData {
  id: string;
  user_id: string;
  evolution_instance_id: string;
  instance_name: string;
  status: 'active' | 'inactive' | 'deleted' | 'pending' | 'error';
  connection_state: 'open' | 'close' | 'connecting' | 'qr';
  qr_code?: string;
  qr_code_updated_at?: string;
  webhook_url?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  expires_at?: string;
  metadata: Record<string, any>;
}

interface CreateInstanceRequest {
  instanceName: string;
  userId: string;
  webhookUrl?: string;
}

interface CreateInstanceResult {
  success: boolean;
  instance?: WhatsAppInstanceData;
  qrCode?: string;
  message: string;
  error?: string;
}

interface InstanceStatusResult {
  success: boolean;
  instance?: WhatsAppInstanceData;
  connectionState?: string;
  message: string;
  error?: string;
}

interface DeleteInstanceResult {
  success: boolean;
  message: string;
  expiresAt?: Date;
  error?: string;
}

interface InstanceListResult {
  success: boolean;
  instances: WhatsAppInstanceData[];
  total: number;
  error?: string;
}

export class WhatsAppInstanceService {
  private supabase: SupabaseClient;
  private evolutionClient: EvolutionAPIClient;
  private webhookBaseUrl: string;
  private gracePeriodDays: number = 30;

  constructor(
    supabase: SupabaseClient,
    evolutionClient: EvolutionAPIClient,
    webhookBaseUrl: string
  ) {
    this.supabase = supabase;
    this.evolutionClient = evolutionClient;
    this.webhookBaseUrl = webhookBaseUrl;
  }

  /**
   * Create a new WhatsApp instance
   */
  async createInstance(request: CreateInstanceRequest): Promise<CreateInstanceResult> {
    try {
      // Validate instance name uniqueness for user
      const existingInstance = await this.checkInstanceNameExists(request.userId, request.instanceName);
      if (existingInstance) {
        return {
          success: false,
          message: 'Já existe uma instância com este nome. Escolha outro nome.'
        };
      }

      // Generate unique Evolution API instance ID
      const evolutionInstanceId = this.generateEvolutionInstanceId(request.userId, request.instanceName);

      // Create instance in Evolution API
      const evolutionResult = await this.evolutionClient.createInstance({
        instanceName: evolutionInstanceId,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      });

      if (!evolutionResult.success) {
        return {
          success: false,
          message: 'Erro ao criar instância no Evolution API',
          error: evolutionResult.error
        };
      }

      // Setup webhook
      const webhookUrl = request.webhookUrl || `${this.webhookBaseUrl}/webhook/${evolutionInstanceId}`;
      await this.setupInstanceWebhook(evolutionInstanceId, webhookUrl);

      // Get initial QR code
      const qrResult = await this.evolutionClient.getInstanceQRCode(evolutionInstanceId);
      const qrCode = qrResult.data?.qrcode?.base64;

      // Store instance in database
      const { data: instance, error: dbError } = await this.supabase
        .from('whatsapp_instances')
        .insert({
          user_id: request.userId,
          evolution_instance_id: evolutionInstanceId,
          instance_name: request.instanceName,
          status: 'pending',
          connection_state: 'qr',
          qr_code: qrCode,
          qr_code_updated_at: qrCode ? new Date().toISOString() : undefined,
          webhook_url: webhookUrl,
          metadata: {
            created_via: 'api',
            evolution_response: evolutionResult.data
          }
        })
        .select()
        .single();

      if (dbError) {
        // Cleanup Evolution API instance if database insert fails
        await this.evolutionClient.deleteInstance(evolutionInstanceId);
        
        console.error('Error storing instance in database:', dbError);
        return {
          success: false,
          message: 'Erro ao salvar instância no banco de dados',
          error: dbError.message
        };
      }

      return {
        success: true,
        instance: instance as WhatsAppInstanceData,
        qrCode,
        message: 'Instância criada com sucesso! Escaneie o QR Code para conectar.'
      };
    } catch (error) {
      console.error('Error in createInstance:', error);
      return {
        success: false,
        message: 'Erro interno ao criar instância',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get instance status and update database
   */
  async getInstanceStatus(instanceId: string, userId: string): Promise<InstanceStatusResult> {
    try {
      // Get instance from database
      const { data: instance, error: dbError } = await this.supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('id', instanceId)
        .eq('user_id', userId)
        .single();

      if (dbError || !instance) {
        return {
          success: false,
          message: 'Instância não encontrada'
        };
      }

      // Check access (including grace period)
      const hasAccess = await this.checkInstanceAccess(instanceId);
      if (!hasAccess) {
        return {
          success: false,
          message: 'Acesso à instância expirado'
        };
      }

      // Get status from Evolution API
      const evolutionStatus = await this.evolutionClient.getInstanceStatus(instance.evolution_instance_id);
      
      if (!evolutionStatus.success) {
        return {
          success: false,
          message: 'Erro ao verificar status da instância',
          error: evolutionStatus.error
        };
      }

      // Update database with current status
      const connectionState = evolutionStatus.data?.instance?.state || 'close';
      const status = this.mapConnectionStateToStatus(connectionState);

      const { data: updatedInstance, error: updateError } = await this.supabase
        .from('whatsapp_instances')
        .update({
          connection_state: connectionState,
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating instance status:', updateError);
      }

      return {
        success: true,
        instance: (updatedInstance || instance) as WhatsAppInstanceData,
        connectionState,
        message: 'Status atualizado com sucesso'
      };
    } catch (error) {
      console.error('Error in getInstanceStatus:', error);
      return {
        success: false,
        message: 'Erro interno ao verificar status',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get fresh QR code for instance
   */
  async refreshQRCode(instanceId: string, userId: string): Promise<{ success: boolean; qrCode?: string; message: string }> {
    try {
      // Get instance from database
      const { data: instance, error: dbError } = await this.supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('id', instanceId)
        .eq('user_id', userId)
        .single();

      if (dbError || !instance) {
        return {
          success: false,
          message: 'Instância não encontrada'
        };
      }

      // Get QR code from Evolution API
      const qrResult = await this.evolutionClient.getInstanceQRCode(instance.evolution_instance_id);
      
      if (!qrResult.success || !qrResult.data?.qrcode?.base64) {
        return {
          success: false,
          message: 'Erro ao obter QR Code. Verifique se a instância está no estado correto.'
        };
      }

      const qrCode = qrResult.data.qrcode.base64;

      // Update QR code in database
      await this.supabase
        .from('whatsapp_instances')
        .update({
          qr_code: qrCode,
          qr_code_updated_at: new Date().toISOString(),
          connection_state: 'qr',
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId);

      return {
        success: true,
        qrCode,
        message: 'QR Code atualizado com sucesso'
      };
    } catch (error) {
      console.error('Error in refreshQRCode:', error);
      return {
        success: false,
        message: 'Erro interno ao atualizar QR Code'
      };
    }
  }

  /**
   * Delete instance (soft delete with grace period)
   */
  async deleteInstance(instanceId: string, userId: string): Promise<DeleteInstanceResult> {
    try {
      // Get instance from database
      const { data: instance, error: dbError } = await this.supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('id', instanceId)
        .eq('user_id', userId)
        .single();

      if (dbError || !instance) {
        return {
          success: false,
          message: 'Instância não encontrada'
        };
      }

      if (instance.status === 'deleted') {
        return {
          success: false,
          message: 'Instância já foi deletada'
        };
      }

      // Calculate expiration date (30 days from now)
      const expiresAt = new Date(Date.now() + this.gracePeriodDays * 24 * 60 * 60 * 1000);

      // Soft delete instance (mark as deleted but keep for grace period)
      const { error: updateError } = await this.supabase
        .from('whatsapp_instances')
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId);

      if (updateError) {
        console.error('Error soft deleting instance:', updateError);
        return {
          success: false,
          message: 'Erro ao deletar instância',
          error: updateError.message
        };
      }

      // Disconnect instance in Evolution API (but don't delete yet)
      try {
        await this.evolutionClient.disconnectInstance(instance.evolution_instance_id);
      } catch (error) {
        console.warn('Warning: Could not disconnect Evolution API instance:', error);
      }

      return {
        success: true,
        message: `Instância deletada. Você terá acesso por mais ${this.gracePeriodDays} dias.`,
        expiresAt
      };
    } catch (error) {
      console.error('Error in deleteInstance:', error);
      return {
        success: false,
        message: 'Erro interno ao deletar instância',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Permanently delete expired instances
   */
  async cleanupExpiredInstances(): Promise<{ deleted: number; errors: string[] }> {
    const errors: string[] = [];
    let deleted = 0;

    try {
      // Find expired instances
      const { data: expiredInstances, error: findError } = await this.supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('status', 'deleted')
        .lt('expires_at', new Date().toISOString());

      if (findError) {
        errors.push(`Error finding expired instances: ${findError.message}`);
        return { deleted, errors };
      }

      if (!expiredInstances || expiredInstances.length === 0) {
        return { deleted, errors };
      }

      // Delete each expired instance
      for (const instance of expiredInstances) {
        try {
          // Delete from Evolution API
          await this.evolutionClient.deleteInstance(instance.evolution_instance_id);

          // Delete from database
          const { error: deleteError } = await this.supabase
            .from('whatsapp_instances')
            .delete()
            .eq('id', instance.id);

          if (deleteError) {
            errors.push(`Error deleting instance ${instance.id}: ${deleteError.message}`);
          } else {
            deleted++;
          }
        } catch (error) {
          errors.push(`Error processing instance ${instance.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return { deleted, errors };
    } catch (error) {
      errors.push(`Error in cleanupExpiredInstances: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { deleted, errors };
    }
  }

  /**
   * List user instances
   */
  async listUserInstances(
    userId: string,
    options: {
      includeDeleted?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<InstanceListResult> {
    try {
      const { includeDeleted = false, limit = 50, offset = 0 } = options;

      let query = this.supabase
        .from('whatsapp_instances')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (!includeDeleted) {
        query = query.neq('status', 'deleted');
      }

      const { data: instances, error, count } = await query;

      if (error) {
        console.error('Error listing user instances:', error);
        return {
          success: false,
          instances: [],
          total: 0,
          error: error.message
        };
      }

      return {
        success: true,
        instances: (instances || []) as WhatsAppInstanceData[],
        total: count || 0
      };
    } catch (error) {
      console.error('Error in listUserInstances:', error);
      return {
        success: false,
        instances: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle webhook events from Evolution API
   */
  async handleWebhookEvent(
    instanceId: string,
    eventType: string,
    eventData: any
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Find instance by evolution_instance_id
      const { data: instance, error: findError } = await this.supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('evolution_instance_id', instanceId)
        .single();

      if (findError || !instance) {
        return {
          success: false,
          message: 'Instance not found'
        };
      }

      // Handle different event types
      switch (eventType) {
        case 'qrcode.updated':
          await this.handleQRCodeUpdate(instance.id, eventData);
          break;
        
        case 'connection.update':
          await this.handleConnectionUpdate(instance.id, eventData);
          break;
        
        case 'messages.upsert':
          // This will be handled by the message processing service
          break;
        
        default:
          console.log(`Unhandled webhook event: ${eventType}`);
      }

      return {
        success: true,
        message: 'Webhook event processed'
      };
    } catch (error) {
      console.error('Error handling webhook event:', error);
      return {
        success: false,
        message: 'Error processing webhook event'
      };
    }
  }

  // Private helper methods

  private async checkInstanceNameExists(userId: string, instanceName: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('user_id', userId)
      .eq('instance_name', instanceName)
      .neq('status', 'deleted')
      .single();

    return !error && !!data;
  }

  private generateEvolutionInstanceId(userId: string, instanceName: string): string {
    // Create a unique instance ID for Evolution API
    const timestamp = Date.now();
    const userPrefix = userId.substring(0, 8);
    const nameSlug = instanceName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    return `aida-${userPrefix}-${nameSlug}-${timestamp}`;
  }

  private async setupInstanceWebhook(instanceId: string, webhookUrl: string): Promise<void> {
    try {
      await this.evolutionClient.setWebhook(instanceId, {
        webhook: {
          url: webhookUrl,
          events: [
            'MESSAGES_UPSERT',
            'CONNECTION_UPDATE',
            'QRCODE_UPDATED'
          ]
        }
      });
    } catch (error) {
      console.warn('Warning: Could not setup webhook:', error);
    }
  }

  private async checkInstanceAccess(instanceId: string): Promise<boolean> {
    try {
      const { data } = await this.supabase
        .rpc('check_instance_access', { p_instance_id: instanceId });
      
      return data === true;
    } catch (error) {
      console.error('Error checking instance access:', error);
      return false;
    }
  }

  private mapConnectionStateToStatus(connectionState: string): 'active' | 'inactive' | 'pending' | 'error' {
    switch (connectionState) {
      case 'open':
        return 'active';
      case 'close':
        return 'inactive';
      case 'connecting':
      case 'qr':
        return 'pending';
      default:
        return 'error';
    }
  }

  private async handleQRCodeUpdate(instanceId: string, eventData: any): Promise<void> {
    try {
      const qrCode = eventData.qrcode?.base64;
      if (qrCode) {
        await this.supabase
          .from('whatsapp_instances')
          .update({
            qr_code: qrCode,
            qr_code_updated_at: new Date().toISOString(),
            connection_state: 'qr',
            updated_at: new Date().toISOString()
          })
          .eq('id', instanceId);
      }
    } catch (error) {
      console.error('Error handling QR code update:', error);
    }
  }

  private async handleConnectionUpdate(instanceId: string, eventData: any): Promise<void> {
    try {
      const connectionState = eventData.state || 'close';
      const status = this.mapConnectionStateToStatus(connectionState);

      const updateData: any = {
        connection_state: connectionState,
        status: status,
        updated_at: new Date().toISOString()
      };

      // Clear QR code when connected
      if (connectionState === 'open') {
        updateData.qr_code = null;
        updateData.qr_code_updated_at = null;
      }

      await this.supabase
        .from('whatsapp_instances')
        .update(updateData)
        .eq('id', instanceId);
    } catch (error) {
      console.error('Error handling connection update:', error);
    }
  }
}

// Factory function
export function createWhatsAppInstanceService(
  supabase: SupabaseClient,
  evolutionClient: EvolutionAPIClient,
  webhookBaseUrl: string
): WhatsAppInstanceService {
  return new WhatsAppInstanceService(supabase, evolutionClient, webhookBaseUrl);
}

// Export types
export type {
  WhatsAppInstanceData,
  CreateInstanceRequest,
  CreateInstanceResult,
  InstanceStatusResult,
  DeleteInstanceResult,
  InstanceListResult
};