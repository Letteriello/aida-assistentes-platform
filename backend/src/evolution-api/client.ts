/**
 * Evolution API Client for AIDA Platform
 *
 * Provides a comprehensive interface to interact with Evolution API
 * Used to manage WhatsApp instances, send messages, and handle webhooks
 *
 * ARCHITECTURE:
 * - Factory pattern for client creation
 * - Retry logic for resilience
 * - Type-safe interfaces
 * - Comprehensive error handling
 */

import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import type {
  InstanceConnectionResponse,
  InstanceCreateResponse,
  InstanceDeleteResponse,
  InstanceSettingsResponse,
  InstancesFetchResponse,
  InstanceStatusResponse,
  InstanceUpdateData,
  MediaMessageData,
  MessageSendResponse,
  QRCodeResponse,
  WebhookSetResponse
} from './types';

// Client interface
export interface EvolutionAPIClient {
  // Message methods
  sendTextMessage(
    instanceId: string,
    jid: string,
    text: string
  ): Promise<MessageSendResponse>;

  sendMediaMessage(
    instanceId: string,
    jid: string,
    media: MediaMessageData
  ): Promise<MessageSendResponse>;

  // Instance management methods
  createInstance(
    instanceName: string,
    token?: string
  ): Promise<InstanceCreateResponse>;

  connectInstance(instanceName: string): Promise<InstanceConnectionResponse>;
  disconnectInstance(instanceName: string): Promise<InstanceConnectionResponse>;
  deleteInstance(instanceName: string): Promise<InstanceDeleteResponse>;
  getInstanceStatus(instanceName: string): Promise<InstanceStatusResponse>;

  // QR Code methods
  getInstanceQRCode(instanceName: string): Promise<QRCodeResponse>;

  // Webhook methods
  setWebhook(
    instanceName: string,
    webhookUrl: string
  ): Promise<WebhookSetResponse>;

  // Instance settings
  getInstanceSettings(instanceName: string): Promise<InstancesFetchResponse>;
  updateInstanceSettings(
    instanceName: string,
    settings: InstanceUpdateData
  ): Promise<InstanceSettingsResponse>;

  healthCheck(): Promise<boolean>;
}

export interface EvolutionClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
  retryAttempts?: number;
}

export type EvolutionApiClient = EvolutionAPIClient;

export interface InstanceStatus {
  instance: {
    instanceName: string;
    state: 'open' | 'close' | 'connecting';
  };
  qrcode?: {
    code: string;
    base64: string;
  };
}

export interface InstanceConfig {
  instanceName: string;
  token?: string;
  qrcode?: boolean;
  number?: string;
  webhook?: string;
  webhookByEvents?: boolean;
  webhookBase64?: boolean;
  chatwootAccountId?: number;
  chatwootToken?: string;
  chatwootUrl?: string;
  chatwootSignMsg?: boolean;
  chatwootReopenConversation?: boolean;
  chatwootConversationPending?: boolean;
}

// Default configuration for AIDA Platform
const DEFAULT_CONFIG = {
  timeout: 30000,
  retryAttempts: 3,
  baseUrl: 'https://one-million-evolution-api.xwty7p.easypanel.host'
};

class EvolutionAPIClientImpl implements EvolutionAPIClient {
  private readonly axiosInstance: AxiosInstance;

  constructor(
    private readonly config: EvolutionClientConfig
  ) {
    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout || DEFAULT_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.config.apiKey
      }
    });

    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log(`[Evolution API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[Evolution API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[Evolution API] Response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  async sendTextMessage(
    instanceId: string,
    jid: string,
    text: string
  ): Promise<MessageSendResponse> {
    try {
      const response = await this.axiosInstance.post<MessageSendResponse>(
        `/message/sendText/${instanceId}`,
        {
          number: jid,
          text: text
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send text message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendMediaMessage(
    instanceId: string,
    jid: string,
    media: MediaMessageData
  ): Promise<MessageSendResponse> {
    try {
      const response = await this.axiosInstance.post<MessageSendResponse>(
        `/message/sendMedia/${instanceId}`,
        {
          number: jid,
          ...media
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send media message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createInstance(
    instanceName: string,
    token?: string
  ): Promise<InstanceCreateResponse> {
    try {
      const response = await this.axiosInstance.post<InstanceCreateResponse>(
        '/instance/create',
        {
          instanceName,
          token,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS'
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create instance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async connectInstance(instanceName: string): Promise<InstanceConnectionResponse> {
    try {
      const response = await this.axiosInstance.get<InstanceConnectionResponse>(
        `/instance/connect/${instanceName}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to connect instance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnectInstance(instanceName: string): Promise<InstanceConnectionResponse> {
    try {
      const response = await this.axiosInstance.delete<InstanceConnectionResponse>(
        `/instance/logout/${instanceName}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to disconnect instance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteInstance(instanceName: string): Promise<InstanceDeleteResponse> {
    try {
      const response = await this.axiosInstance.delete<InstanceDeleteResponse>(
        `/instance/delete/${instanceName}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete instance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getInstanceStatus(instanceName: string): Promise<InstanceStatusResponse> {
    try {
      const response = await this.axiosInstance.get<InstanceStatusResponse>(
        `/instance/connectionState/${instanceName}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get instance status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getInstanceQRCode(instanceName: string): Promise<QRCodeResponse> {
    try {
      const response = await this.axiosInstance.get<QRCodeResponse>(
        `/instance/qrcode/${instanceName}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async setWebhook(
    instanceName: string,
    webhookUrl: string
  ): Promise<WebhookSetResponse> {
    try {
      const response = await this.axiosInstance.post<WebhookSetResponse>(
        `/webhook/set/${instanceName}`,
        {
          url: webhookUrl,
          webhookByEvents: true,
          webhookBase64: true,
          events: [
            'APPLICATION_STARTUP',
            'QRCODE_UPDATED',
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'MESSAGES_DELETE',
            'SEND_MESSAGE',
            'CONTACTS_SET',
            'CONTACTS_UPSERT',
            'CONTACTS_UPDATE',
            'PRESENCE_UPDATE',
            'CHATS_SET',
            'CHATS_UPSERT',
            'CHATS_UPDATE',
            'CHATS_DELETE',
            'GROUPS_UPSERT',
            'GROUP_UPDATE',
            'GROUP_PARTICIPANTS_UPDATE',
            'CONNECTION_UPDATE',
            'LABELS_EDIT',
            'LABELS_ASSOCIATION',
            'CALL_UPSERT',
            'CALL_UPDATE',
            'TYPEBOT_START',
            'TYPEBOT_CHANGE_STATUS'
          ]
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to set webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getInstanceSettings(instanceName: string): Promise<InstancesFetchResponse> {
    try {
      const response = await this.axiosInstance.get<InstancesFetchResponse>(
        `/instance/fetchInstances?instanceName=${instanceName}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get instance settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateInstanceSettings(
    instanceName: string,
    settings: InstanceUpdateData
  ): Promise<InstanceSettingsResponse> {
    try {
      const response = await this.axiosInstance.put<InstanceSettingsResponse>(
        `/instance/update/${instanceName}`,
        settings
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update instance settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('/health');
      return response.status === 200;
    } catch (error) {
      console.warn('[Evolution API] Health check failed:', error);
      return false;
    }
  }
}

// Factory function to create Evolution API client
export function createEvolutionClient(config: EvolutionClientConfig): EvolutionAPIClient {
  const fullConfig = {
    ...DEFAULT_CONFIG,
    ...config
  };

  return new EvolutionAPIClientImpl(fullConfig);
}

// Default configuration getter
export function getDefaultEvolutionConfig(): Partial<EvolutionClientConfig> {
  return {
    baseUrl: DEFAULT_CONFIG.baseUrl,
    timeout: DEFAULT_CONFIG.timeout,
    retryAttempts: DEFAULT_CONFIG.retryAttempts
  };
}

// Instance management utilities
export class InstanceManager {
  constructor(private client: EvolutionAPIClient) {}

  async createAndSetupInstance(
    instanceName: string,
    webhookUrl: string,
    options: Partial<InstanceConfig> = {}
  ): Promise<{
    instance: InstanceCreateResponse;
    webhook: WebhookSetResponse;
    qrCode?: QRCodeResponse;
  }> {
    try {
      // Create instance
      const instance = await this.client.createInstance(instanceName, options.token);

      // Set up webhook
      const webhook = await this.client.setWebhook(instanceName, webhookUrl);

      // Get QR code if needed
      let qrCode: QRCodeResponse | undefined;
      if (options.qrcode !== false) {
        try {
          qrCode = await this.client.getInstanceQRCode(instanceName);
        } catch (error) {
          console.warn('Failed to get QR code:', error);
        }
      }

      return {
        instance,
        webhook,
        qrCode
      };
    } catch (error) {
      throw new Error(`Failed to create and setup instance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getInstanceInfo(instanceName: string): Promise<{
    status: InstanceStatusResponse;
    settings: InstancesFetchResponse;
    qrCode?: QRCodeResponse;
  }> {
    try {
      const [status, settings] = await Promise.all([
        this.client.getInstanceStatus(instanceName),
        this.client.getInstanceSettings(instanceName)
      ]);

      let qrCode: QRCodeResponse | undefined;
      if (status.instance?.state === 'close') {
        try {
          qrCode = await this.client.getInstanceQRCode(instanceName);
        } catch (error) {
          console.warn('Failed to get QR code:', error);
        }
      }

      return {
        status,
        settings,
        qrCode
      };
    } catch (error) {
      throw new Error(`Failed to get instance info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Create instance manager
export function createInstanceManager(client: EvolutionAPIClient): InstanceManager {
  return new InstanceManager(client);
}
