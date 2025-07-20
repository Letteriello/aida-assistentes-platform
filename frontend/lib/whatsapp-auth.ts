/**
 * AIDA Platform - WhatsApp Authentication Client
 * Cliente para autenticação via WhatsApp usando códigos de verificação
 */

import apiClient, { ApiResponse } from './api-client';

export interface PhoneVerificationRequest {
  phoneNumber: string;
  countryCode?: string;
}

export interface VerifyCodeRequest {
  phoneNumber: string;
  code: string;
}

export interface AuthUser {
  id: string;
  phone: string;
  name?: string;
  businessId?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: AuthUser;
}

export interface QRCodeResponse {
  success: boolean;
  qrCode?: string;
  isConnected: boolean;
  message?: string;
}

class WhatsAppAuthClient {
  /**
   * Enviar código de verificação via WhatsApp
   */
  async sendVerificationCode(request: PhoneVerificationRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/send-code', {
        phoneNumber: request.phoneNumber,
        countryCode: request.countryCode || '+55'
      });

      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao enviar código de verificação'
      };
    }
  }

  /**
   * Verificar código de verificação
   */
  async verifyCode(request: VerifyCodeRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/verify-code', {
        phoneNumber: request.phoneNumber,
        code: request.code
      });

      // Se a verificação foi bem-sucedida, salvar o token
      if (response.success && response.token) {
        apiClient.setAuthToken(response.token);
      }

      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao verificar código'
      };
    }
  }

  /**
   * Obter informações do usuário autenticado
   */
  async getCurrentUser(): Promise<{ success: boolean; user?: AuthUser; message?: string }> {
    try {
      const response = await apiClient.get<{ user: AuthUser }>('/api/auth/me');

      if (response.success && response.user) {
        return {
          success: true,
          user: response.user
        };
      }

      return {
        success: false,
        message: 'Usuário não encontrado'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao obter usuário'
      };
    }
  }

  /**
   * Fazer logout
   */
  async logout(): Promise<{ success: boolean; message?: string }> {
    try {
      await apiClient.post('/api/auth/logout');
      apiClient.clearAuthToken();

      return {
        success: true,
        message: 'Logout realizado com sucesso'
      };
    } catch (error: any) {
      // Mesmo se houver erro no servidor, limpar token local
      apiClient.clearAuthToken();
      
      return {
        success: true,
        message: 'Logout realizado com sucesso'
      };
    }
  }

  /**
   * Obter QR Code da instância admin (para desenvolvimento)
   */
  async getAdminQRCode(): Promise<QRCodeResponse> {
    try {
      const response = await apiClient.get<QRCodeResponse>('/api/auth/admin-qr');
      return response;
    } catch (error: any) {
      return {
        success: false,
        isConnected: false,
        message: error.response?.data?.message || 'Erro ao obter QR Code'
      };
    }
  }

  /**
   * Verificar se há token válido armazenado
   */
  isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  }

  /**
   * Obter token armazenado
   */
  getAuthToken(): string | null {
    return apiClient.getAuthToken();
  }

  /**
   * Limpar autenticação
   */
  clearAuth(): void {
    apiClient.clearAuthToken();
  }

  /**
   * Validar formato de telefone brasileiro
   */
  validateBrazilianPhone(phoneNumber: string): { 
    isValid: boolean; 
    formattedPhone: string; 
    error?: string 
  } {
    // Remover caracteres não numéricos
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Verificar se é um número brasileiro válido
    if (cleanPhone.length === 13 && cleanPhone.startsWith('55')) {
      // Com código do país (55)
      const ddd = cleanPhone.substring(2, 4);
      const number = cleanPhone.substring(4);
      
      // DDDs válidos do Brasil
      const validDDDs = [
        '11', '12', '13', '14', '15', '16', '17', '18', '19', // SP
        '21', '22', '24', // RJ
        '27', '28', // ES
        '31', '32', '33', '34', '35', '37', '38', // MG
        '41', '42', '43', '44', '45', '46', // PR
        '47', '48', '49', // SC
        '51', '53', '54', '55', // RS
        '61', // DF
        '62', '64', // GO
        '63', // TO
        '65', '66', // MT
        '67', // MS
        '68', // AC
        '69', // RO
        '71', '73', '74', '75', '77', // BA
        '79', // SE
        '81', '87', // PE
        '82', // AL
        '83', // PB
        '84', // RN
        '85', '88', // CE
        '86', '89', // PI
        '91', '93', '94', // PA
        '92', '97', // AM
        '95', // RR
        '96', // AP
        '98', '99' // MA
      ];
      
      if (!validDDDs.includes(ddd)) {
        return { 
          isValid: false, 
          formattedPhone: '', 
          error: 'DDD inválido' 
        };
      }
      
      // Verificar formato do número (celular deve ter 9 dígitos começando com 9)
      if (number.length === 9 && number.startsWith('9')) {
        return { 
          isValid: true, 
          formattedPhone: `+${cleanPhone}` 
        };
      } else if (number.length === 8) {
        return { 
          isValid: false, 
          formattedPhone: '', 
          error: 'Número deve ser um celular (9 dígitos)' 
        };
      }
      
      return { 
        isValid: false, 
        formattedPhone: '', 
        error: 'Formato de número inválido' 
      };
      
    } else if (cleanPhone.length === 11 || cleanPhone.length === 10) {
      // Sem código do país, assumir Brasil
      return { 
        isValid: false, 
        formattedPhone: '', 
        error: 'Inclua o código do país +55' 
      };
      
    } else {
      return { 
        isValid: false, 
        formattedPhone: '', 
        error: 'Número de telefone inválido' 
      };
    }
  }

  /**
   * Formatar número de telefone para exibição
   */
  formatPhoneDisplay(phoneNumber: string): string {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    if (cleanPhone.length === 13 && cleanPhone.startsWith('55')) {
      // +55 (11) 99999-9999
      const countryCode = cleanPhone.substring(0, 2);
      const ddd = cleanPhone.substring(2, 4);
      const firstPart = cleanPhone.substring(4, 9);
      const secondPart = cleanPhone.substring(9);
      
      return `+${countryCode} (${ddd}) ${firstPart}-${secondPart}`;
    }
    
    return phoneNumber;
  }

  /**
   * Health check do serviço de autenticação
   */
  async healthCheck(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.get('/api/auth/health');
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Serviço indisponível'
      };
    }
  }
}

// Singleton instance with token initialization
const whatsappAuthClient = new WhatsAppAuthClient();

// Initialize with stored token if available
if (typeof window !== 'undefined') {
  const storedToken = apiClient.getAuthToken();
  if (storedToken) {
    // Token is already loaded by apiClient constructor
    console.log('WhatsApp Auth Client initialized with stored token');
  }
}

export default whatsappAuthClient;
export { WhatsAppAuthClient };