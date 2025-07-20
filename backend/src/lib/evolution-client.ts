import axios, { AxiosInstance } from 'axios';

export interface EvolutionAPIConfig {
  baseURL: string;
  apiKey: string;
  instancePrefix?: string;
}

export interface CreateInstanceRequest {
  instanceName: string;
  qrcode?: boolean;
  number?: string;
  token?: string;
  webhook?: {
    url: string;
    events: string[];
  };
}

export interface CreateInstanceResponse {
  instance: {
    instanceName: string;
    status: string;
  };
  hash: {
    apikey: string;
  };
  qrcode?: {
    code: string;
    base64: string;
  };
}

export interface SendMessageRequest {
  number: string;
  text?: string;
  mediaMessage?: {
    mediatype: 'image' | 'document' | 'video' | 'audio';
    fileName?: string;
    caption?: string;
    media: string; // base64 ou URL
  };
}

export interface SendMessageResponse {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: any;
  messageTimestamp: number;
  status: string;
}

export interface InstanceInfo {
  instanceName: string;
  status: 'open' | 'close' | 'connecting';
  serverUrl: string;
  apikey: string;
  qrcode?: {
    code: string;
    base64: string;
  };
  profilePictureUrl?: string;
  profileName?: string;
  number?: string;
}

export interface WebhookMessage {
  instanceName: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName: string;
    message: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
      imageMessage?: {
        caption?: string;
        mimetype: string;
      };
      documentMessage?: {
        caption?: string;
        fileName: string;
        mimetype: string;
      };
    };
    messageType: string;
    messageTimestamp: number;
    instanceName: string;
    source: string;
  };
  destination: string;
  date_time: string;
  sender: string;
  server_url: string;
  apikey: string;
}

export class EvolutionAPIClient {
  private client: AxiosInstance;
  private config: EvolutionAPIConfig;

  constructor(config: EvolutionAPIConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.apiKey
      },
      timeout: 30000 // 30 seconds
    });

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`Evolution API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Evolution API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log(`Evolution API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('Evolution API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Criar uma nova instância do WhatsApp
   */
  async createInstance(request: CreateInstanceRequest): Promise<CreateInstanceResponse> {
    try {
      const response = await this.client.post('/instance/create', {
        instanceName: request.instanceName,
        qrcode: request.qrcode ?? true,
        number: request.number,
        token: request.token,
        webhook: request.webhook
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to create instance: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Obter informações de uma instância
   */
  async getInstanceInfo(instanceName: string): Promise<InstanceInfo> {
    try {
      const response = await this.client.get(`/instance/fetchInstances?instanceName=${instanceName}`);
      
      if (response.data && response.data.length > 0) {
        return response.data[0];
      }
      
      throw new Error('Instance not found');
    } catch (error: any) {
      throw new Error(`Failed to get instance info: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Conectar instância (gerar QR code)
   */
  async connectInstance(instanceName: string): Promise<{ qrcode: { code: string; base64: string } }> {
    try {
      const response = await this.client.get(`/instance/connect/${instanceName}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to connect instance: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Verificar status da instância
   */
  async getInstanceStatus(instanceName: string): Promise<{ status: string }> {
    try {
      const response = await this.client.get(`/instance/connectionState/${instanceName}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get instance status: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Desconectar instância
   */
  async disconnectInstance(instanceName: string): Promise<{ status: string }> {
    try {
      const response = await this.client.delete(`/instance/logout/${instanceName}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to disconnect instance: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Deletar instância
   */
  async deleteInstance(instanceName: string): Promise<{ status: string }> {
    try {
      const response = await this.client.delete(`/instance/delete/${instanceName}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to delete instance: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Enviar mensagem de texto
   */
  async sendTextMessage(instanceName: string, request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      const response = await this.client.post(`/message/sendText/${instanceName}`, {
        number: request.number,
        text: request.text
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to send message: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Enviar mídia (imagem, documento, etc.)
   */
  async sendMediaMessage(instanceName: string, request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      const response = await this.client.post(`/message/sendMedia/${instanceName}`, {
        number: request.number,
        mediaMessage: request.mediaMessage
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to send media: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Configurar webhook para receber mensagens
   */
  async setWebhook(instanceName: string, webhookUrl: string, events: string[] = ['MESSAGES_UPSERT']): Promise<any> {
    try {
      const response = await this.client.post(`/webhook/set/${instanceName}`, {
        url: webhookUrl,
        events
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to set webhook: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Obter webhook configurado
   */
  async getWebhook(instanceName: string): Promise<any> {
    try {
      const response = await this.client.get(`/webhook/find/${instanceName}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get webhook: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Processar mensagem recebida via webhook
   */
  static parseWebhookMessage(webhookData: WebhookMessage): {
    instanceName: string;
    messageId: string;
    from: string;
    content: string;
    messageType: string;
    timestamp: Date;
    customerName: string;
  } {
    const { data } = webhookData;
    
    // Extrair conteúdo da mensagem baseado no tipo
    let content = '';
    let messageType = 'text';
    
    if (data.message.conversation) {
      content = data.message.conversation;
      messageType = 'text';
    } else if (data.message.extendedTextMessage?.text) {
      content = data.message.extendedTextMessage.text;
      messageType = 'text';
    } else if (data.message.imageMessage) {
      content = data.message.imageMessage.caption || '[Imagem]';
      messageType = 'image';
    } else if (data.message.documentMessage) {
      content = data.message.documentMessage.caption || `[Documento: ${data.message.documentMessage.fileName}]`;
      messageType = 'document';
    }

    // Extrair número do telefone (remover sufixos do WhatsApp)
    const phoneNumber = data.key.remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '');

    return {
      instanceName: data.instanceName,
      messageId: data.key.id,
      from: phoneNumber,
      content,
      messageType,
      timestamp: new Date(data.messageTimestamp * 1000),
      customerName: data.pushName || 'Cliente'
    };
  }

  /**
   * Validar se a mensagem é de um cliente (não é nossa própria mensagem)
   */
  static isIncomingMessage(webhookData: WebhookMessage): boolean {
    return !webhookData.data.key.fromMe;
  }

  /**
   * Verificar se a instância está conectada
   */
  async isInstanceConnected(instanceName: string): Promise<boolean> {
    try {
      const status = await this.getInstanceStatus(instanceName);
      return status.status === 'open';
    } catch (error) {
      return false;
    }
  }

  /**
   * Aguardar conexão da instância (polling)
   */
  async waitForConnection(instanceName: string, timeoutMs = 120000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const isConnected = await this.isInstanceConnected(instanceName);
        if (isConnected) {
          return true;
        }
        
        // Aguardar 2 segundos antes de verificar novamente
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('Error checking connection status:', error);
      }
    }
    
    return false;
  }

  /**
   * Criar instância administrativa para envio de códigos de verificação
   */
  async createAdminInstance(): Promise<string> {
    const adminInstanceName = `aida_admin_${Date.now()}`;
    
    const webhookUrl = `${process.env.APP_URL}/api/webhook/admin`;
    
    await this.createInstance({
      instanceName: adminInstanceName,
      qrcode: true,
      webhook: {
        url: webhookUrl,
        events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE']
      }
    });

    return adminInstanceName;
  }
}

// Singleton instance para uso em toda aplicação
let evolutionClientInstance: EvolutionAPIClient | null = null;

export function getEvolutionClient(): EvolutionAPIClient {
  if (!evolutionClientInstance) {
    const config: EvolutionAPIConfig = {
      baseURL: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
      apiKey: process.env.EVOLUTION_API_KEY || '',
      instancePrefix: process.env.EVOLUTION_INSTANCE_PREFIX || 'aida'
    };

    evolutionClientInstance = new EvolutionAPIClient(config);
  }

  return evolutionClientInstance;
}