/**
 * AIDA Platform - WhatsApp Instance Management Client
 * Cliente para gerenciamento de instâncias WhatsApp
 */

import apiClient, { ApiResponse } from './api-client';

export interface WhatsAppInstance {
  id: string;
  user_id: string;
  evolution_instance_id: string;
  name: string;
  status: 'creating' | 'qrcode' | 'connected' | 'disconnected' | 'deleted';
  qr_code_url?: string;
  webhook_url?: string;
  evolution_api_url: string;
  evolution_api_key: string;
  message_count: number;
  document_count: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateInstanceRequest {
  instanceName: string;
}

export interface CreateInstanceResponse {
  success: boolean;
  instance?: WhatsAppInstance;
  qrCode?: string;
  message: string;
  error?: string;
}

export interface InstanceListResponse {
  success: boolean;
  instances: WhatsAppInstance[];
  total: number;
}

export interface InstanceStatusResponse {
  success: boolean;
  instance?: WhatsAppInstance;
  connectionState?: string;
  message?: string;
}

export interface QRCodeResponse {
  success: boolean;
  qrCode?: string;
  message: string;
}

export interface SendMessageRequest {
  phoneNumber: string;
  message: string;
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

class WhatsAppInstanceClient {
  /**
   * Criar nova instancia WhatsApp
   */
  async createInstance(request: CreateInstanceRequest): Promise<CreateInstanceResponse> {
    try {
      const response = await apiClient.post<CreateInstanceResponse>('/api/instances/create', request);
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao criar instância',
        error: error.response?.data?.error
      };
    }
  }

  /**
   * Listar instancias do usuario
   */
  async listInstances(options: {
    includeDeleted?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<InstanceListResponse> {
    try {
      const params = new URLSearchParams();
      if (options.includeDeleted) params.append('includeDeleted', 'true');
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());

      const queryString = params.toString();
      const url = `/api/instances${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<InstanceListResponse>(url);
      return response;
    } catch (error: any) {
      return {
        success: false,
        instances: [],
        total: 0
      };
    }
  }

  /**
   * Obter status de uma instancia
   */
  async getInstanceStatus(instanceId: string): Promise<InstanceStatusResponse> {
    try {
      const response = await apiClient.get<InstanceStatusResponse>(`/api/instances/${instanceId}/status`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao obter status da instancia'
      };
    }
  }

  /**
   * Obter QR Code para conectar instancia
   */
  async getQRCode(instanceId: string): Promise<QRCodeResponse> {
    try {
      const response = await apiClient.get<QRCodeResponse>(`/api/instances/${instanceId}/qr-code`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao obter QR Code'
      };
    }
  }

  /**
   * Deletar instancia
   */
  async deleteInstance(instanceId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(`/api/instances/${instanceId}`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao deletar instancia'
      };
    }
  }

  /**
   * Enviar mensagem de teste
   */
  async sendTestMessage(instanceId: string, request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      const response = await apiClient.post<SendMessageResponse>(
        `/api/instances/${instanceId}/send-message`,
        request
      );
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao enviar mensagem'
      };
    }
  }

  /**
   * Verificar se instancia esta conectada
   */
  isInstanceConnected(instance: WhatsAppInstance): boolean {
    return instance.status === 'connected';
  }

  /**
   * Verificar se instancia precisa de QR Code
   */
  needsQRCode(instance: WhatsAppInstance): boolean {
    return instance.status === 'qrcode' || instance.status === 'creating';
  }

  /**
   * Verificar se instancia esta disponivel para uso
   */
  isInstanceReady(instance: WhatsAppInstance): boolean {
    return instance.status === 'connected';
  }

  /**
   * Obter texto de status amigavel
   */
  getStatusText(status: WhatsAppInstance['status']): string {
    const statusMap = {
      'creating': 'Criando...',
      'qrcode': 'Aguardando QR Code',
      'connected': 'Conectado',
      'disconnected': 'Desconectado',
      'deleted': 'Deletado'
    };
    
    return statusMap[status] || 'Status desconhecido';
  }

  /**
   * Obter cor do status para UI
   */
  getStatusColor(status: WhatsAppInstance['status']): string {
    const colorMap = {
      'creating': 'yellow',
      'qrcode': 'blue',
      'connected': 'green',
      'disconnected': 'red',
      'deleted': 'gray'
    };
    
    return colorMap[status] || 'gray';
  }

  /**
   * Formatar data de criação
   */
  formatCreatedAt(createdAt: string): string {
    return new Date(createdAt).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Gerar nome unico para instancia
   */
  generateInstanceName(baseName?: string): string {
    const base = baseName || 'MinhaInstancia';
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    
    return `${base}_${timestamp}_${random}`;
  }

  /**
   * Validar nome da instancia
   */
  validateInstanceName(name: string): { isValid: boolean; error?: string } {
    if (!name || name.trim().length === 0) {
      return { isValid: false, error: 'Nome e obrigatorio' };
    }

    if (name.length < 3) {
      return { isValid: false, error: 'Nome deve ter pelo menos 3 caracteres' };
    }

    if (name.length > 50) {
      return { isValid: false, error: 'Nome deve ter no maximo 50 caracteres' };
    }

    // Apenas letras, números, underscore e hífen
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(name)) {
      return { isValid: false, error: 'Nome deve conter apenas letras, numeros, _ e -' };
    }

    return { isValid: true };
  }
}

// Singleton instance
const whatsappInstanceClient = new WhatsAppInstanceClient();

export default whatsappInstanceClient;
export { WhatsAppInstanceClient };