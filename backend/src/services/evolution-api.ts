// =============================================================================
// EVOLUTION API SERVICE - WHATSAPP INTEGRATION
// =============================================================================
// Complete service for Evolution API integration
// Handles WhatsApp instances, QR codes, messages, and admin auth instance
// =============================================================================

import axios, { AxiosInstance } from 'axios';

export interface EvolutionAPIConfig {
  baseURL: string;
  globalApiKey: string;
  adminInstanceName?: string;
  adminPhoneNumber?: string;
}

export interface WhatsAppInstance {
  instanceName: string;
  status: 'creating' | 'connecting' | 'connected' | 'disconnected' | 'error';
  qrCode?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
}

export interface SendMessagePayload {
  number: string;
  text: string;
  delay?: number;
}

export interface WebhookEvent {
  instanceName: string;
  event: string;
  data: any;
}

export class EvolutionAPIService {
  private api: AxiosInstance;
  private config: EvolutionAPIConfig;

  constructor(config: EvolutionAPIConfig) {
    this.config = config;
    this.api = axios.create({
      baseURL: config.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.globalApiKey
      },
      timeout: 30000
    });

    // Request interceptor for debugging
    this.api.interceptors.request.use(
      (config) => {
        console.log(`📡 Evolution API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Evolution API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => {
        console.log(`✅ Evolution API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('❌ Evolution API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // =============================================================================
  // INSTANCE MANAGEMENT
  // =============================================================================

  /**
   * Create a new WhatsApp instance
   */
  async createInstance(instanceName: string, webhook?: string): Promise<WhatsAppInstance> {
    try {
      const payload: any = {
        instanceName,
        token: instanceName, // Use instance name as token for simplicity
        qrcode: true,
        integration: "WHATSAPP-BAILEYS"
      };

      if (webhook) {
        payload.webhook = webhook;
        payload.webhook_by_events = true;
        payload.events = [
          "APPLICATION_STARTUP",
          "QRCODE_UPDATED", 
          "CONNECTION_UPDATE",
          "MESSAGES_UPSERT",
          "SEND_MESSAGE"
        ];
      }

      const response = await this.api.post('/instance/create', payload);
      
      return {
        instanceName,
        status: 'creating',
        qrCode: response.data.qrcode?.code,
      };
    } catch (error: any) {
      console.error(`❌ Failed to create instance ${instanceName}:`, error.response?.data || error.message);
      throw new Error(`Failed to create WhatsApp instance: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get instance connection status
   */
  async getInstanceStatus(instanceName: string): Promise<WhatsAppInstance> {
    try {
      const response = await this.api.get(`/instance/connectionState/${instanceName}`);
      const connectionState = response.data.instance;

      let status: WhatsAppInstance['status'] = 'disconnected';
      
      switch (connectionState?.state) {
        case 'open':
          status = 'connected';
          break;
        case 'connecting':
          status = 'connecting';
          break;
        case 'close':
          status = 'disconnected';
          break;
        default:
          status = 'error';
      }

      return {
        instanceName,
        status,
        phoneNumber: connectionState?.instance?.wuid?.user
      };
    } catch (error: any) {
      console.error(`❌ Failed to get instance status ${instanceName}:`, error.response?.data || error.message);
      return {
        instanceName,
        status: 'error'
      };
    }
  }

  /**
   * Get QR Code for instance connection
   */
  async getQRCode(instanceName: string): Promise<string | null> {
    try {
      const response = await this.api.get(`/instance/connect/${instanceName}`);
      return response.data.qrcode?.code || null;
    } catch (error: any) {
      console.error(`❌ Failed to get QR code for ${instanceName}:`, error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Delete WhatsApp instance
   */
  async deleteInstance(instanceName: string): Promise<boolean> {
    try {
      await this.api.delete(`/instance/delete/${instanceName}`);
      console.log(`✅ Instance ${instanceName} deleted successfully`);
      return true;
    } catch (error: any) {
      console.error(`❌ Failed to delete instance ${instanceName}:`, error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Restart WhatsApp instance
   */
  async restartInstance(instanceName: string): Promise<boolean> {
    try {
      await this.api.put(`/instance/restart/${instanceName}`);
      console.log(`✅ Instance ${instanceName} restarted successfully`);
      return true;
    } catch (error: any) {
      console.error(`❌ Failed to restart instance ${instanceName}:`, error.response?.data || error.message);
      return false;
    }
  }

  // =============================================================================
  // MESSAGE HANDLING
  // =============================================================================

  /**
   * Send text message
   */
  async sendMessage(instanceName: string, payload: SendMessagePayload): Promise<boolean> {
    try {
      const messagePayload = {
        number: payload.number,
        text: payload.text,
        delay: payload.delay || 0
      };

      const response = await this.api.post(`/message/sendText/${instanceName}`, messagePayload);
      console.log(`✅ Message sent to ${payload.number} via ${instanceName}`);
      return response.data.key ? true : false;
    } catch (error: any) {
      console.error(`❌ Failed to send message via ${instanceName}:`, error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Send authentication code via WhatsApp
   */
  async sendAuthCode(phoneNumber: string, code: string): Promise<boolean> {
    const adminInstance = this.config.adminInstanceName || 'admin-auth-instance';
    
    const message = `🔐 *AIDA Platform*\n\nSeu código de verificação é: *${code}*\n\n⚠️ Não compartilhe este código com ninguém.\n⏰ Válido por 5 minutos.`;

    try {
      return await this.sendMessage(adminInstance, {
        number: phoneNumber,
        text: message
      });
    } catch (error) {
      console.error(`❌ Failed to send auth code to ${phoneNumber}:`, error);
      return false;
    }
  }

  // =============================================================================
  // ADMIN INSTANCE MANAGEMENT
  // =============================================================================

  /**
   * Setup admin instance for authentication codes
   */
  async setupAdminInstance(): Promise<boolean> {
    const adminInstanceName = this.config.adminInstanceName || 'admin-auth-instance';
    
    try {
      // Check if admin instance already exists and is connected
      const status = await this.getInstanceStatus(adminInstanceName);
      
      if (status.status === 'connected') {
        console.log(`✅ Admin instance ${adminInstanceName} is already connected`);
        return true;
      }

      // Create admin instance if it doesn't exist
      console.log(`🔧 Setting up admin instance: ${adminInstanceName}`);
      
      const instance = await this.createInstance(adminInstanceName);
      
      if (instance.qrCode) {
        console.log(`📱 Admin instance QR Code generated. Please scan to connect the admin WhatsApp number.`);
        console.log(`QR Code: ${instance.qrCode}`);
        
        // In a real scenario, you'd display this QR code for the admin to scan
        // For now, we'll just log it
        return false; // Requires manual scanning
      }

      return false;
    } catch (error) {
      console.error(`❌ Failed to setup admin instance:`, error);
      return false;
    }
  }

  /**
   * Check if admin instance is ready for sending auth codes
   */
  async isAdminInstanceReady(): Promise<boolean> {
    const adminInstanceName = this.config.adminInstanceName || 'admin-auth-instance';
    
    try {
      const status = await this.getInstanceStatus(adminInstanceName);
      return status.status === 'connected';
    } catch (error) {
      console.error(`❌ Failed to check admin instance status:`, error);
      return false;
    }
  }

  // =============================================================================
  // WEBHOOK HANDLING
  // =============================================================================

  /**
   * Process webhook events from Evolution API
   */
  static processWebhookEvent(event: WebhookEvent): {
    type: string;
    instanceName: string;
    data: any;
  } {
    const { instanceName, event: eventType, data } = event;

    switch (eventType) {
      case 'qrcode.updated':
        return {
          type: 'QR_CODE_UPDATED',
          instanceName,
          data: {
            qrCode: data.qrcode
          }
        };

      case 'connection.update':
        return {
          type: 'CONNECTION_UPDATE',
          instanceName,
          data: {
            status: data.state,
            phoneNumber: data.instance?.wuid?.user
          }
        };

      case 'messages.upsert':
        return {
          type: 'MESSAGE_RECEIVED',
          instanceName,
          data: {
            messages: data.messages || []
          }
        };

      default:
        return {
          type: 'UNKNOWN_EVENT',
          instanceName,
          data
        };
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Validate phone number format
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid Brazilian phone number (11 digits starting with 55)
    // or international format (10-15 digits)
    if (cleaned.startsWith('55') && cleaned.length === 13) {
      return true; // Brazilian format: +55 11 99999-9999
    }
    
    if (cleaned.length >= 10 && cleaned.length <= 15) {
      return true; // International format
    }
    
    return false;
  }

  /**
   * Format phone number for Evolution API
   */
  static formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if missing (assuming Brazil +55)
    if (!cleaned.startsWith('55') && cleaned.length === 11) {
      cleaned = '55' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Generate random verification code
   */
  static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

// Export types
export type { EvolutionAPIConfig, WhatsAppInstance, SendMessagePayload, WebhookEvent };