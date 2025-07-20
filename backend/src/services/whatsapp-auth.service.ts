import { createClient } from '@supabase/supabase-js';
import { EvolutionAPIClient } from '../evolution-api/client';
import { Database } from '../../../shared/types/database';

type SupabaseClient = ReturnType<typeof createClient<Database>>;

interface AuthCodeData {
  id: string;
  phone: string;
  code: string;
  expires_at: string;
  attempts: number;
  max_attempts: number;
}

interface SendCodeResult {
  success: boolean;
  message: string;
  expiresAt?: Date;
  error?: string;
}

interface VerifyCodeResult {
  success: boolean;
  userId?: string;
  token?: string;
  message: string;
  error?: string;
}

export class WhatsAppAuthService {
  private supabase: SupabaseClient;
  private evolutionClient: EvolutionAPIClient;
  private adminInstanceId: string;
  private codeExpirationMinutes: number = 10;
  private maxAttempts: number = 3;
  private rateLimitMinutes: number = 1; // Minimum time between code requests

  constructor(
    supabase: SupabaseClient,
    evolutionClient: EvolutionAPIClient,
    adminInstanceId: string
  ) {
    this.supabase = supabase;
    this.evolutionClient = evolutionClient;
    this.adminInstanceId = adminInstanceId;
  }

  /**
   * Send authentication code via WhatsApp
   */
  async sendAuthCode(
    phone: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SendCodeResult> {
    try {
      // Validate phone format (Brazilian numbers)
      if (!this.isValidBrazilianPhone(phone)) {
        return {
          success: false,
          message: 'Número de telefone inválido. Use o formato +5511999999999'
        };
      }

      // Check rate limiting
      const rateLimitCheck = await this.checkRateLimit(phone);
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          message: `Aguarde ${rateLimitCheck.waitMinutes} minuto(s) antes de solicitar um novo código`
        };
      }

      // Generate 6-digit code
      const code = this.generateAuthCode();
      const expiresAt = new Date(Date.now() + this.codeExpirationMinutes * 60 * 1000);

      // Store code in database
      const { error: dbError } = await this.supabase
        .from('auth_codes')
        .insert({
          phone,
          code,
          expires_at: expiresAt.toISOString(),
          attempts: 0,
          max_attempts: this.maxAttempts,
          ip_address: ipAddress,
          user_agent: userAgent
        });

      if (dbError) {
        console.error('Error storing auth code:', dbError);
        return {
          success: false,
          message: 'Erro interno. Tente novamente.'
        };
      }

      // Send code via WhatsApp
      const message = this.formatAuthMessage(code);
      const sendResult = await this.sendWhatsAppMessage(phone, message);

      if (!sendResult.success) {
        // Clean up stored code if sending failed
        await this.supabase
          .from('auth_codes')
          .delete()
          .eq('phone', phone)
          .eq('code', code);

        return {
          success: false,
          message: 'Erro ao enviar código. Verifique se o número está correto.'
        };
      }

      return {
        success: true,
        message: 'Código enviado com sucesso!',
        expiresAt
      };

    } catch (error) {
      console.error('Error in sendAuthCode:', error);
      return {
        success: false,
        message: 'Erro interno. Tente novamente.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify authentication code and create/login user
   */
  async verifyAuthCode(
    phone: string,
    code: string,
    ipAddress?: string
  ): Promise<VerifyCodeResult> {
    try {
      // Find valid code
      const { data: authCodes, error: findError } = await this.supabase
        .from('auth_codes')
        .select('*')
        .eq('phone', phone)
        .eq('code', code)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (findError) {
        console.error('Error finding auth code:', findError);
        return {
          success: false,
          message: 'Erro interno. Tente novamente.'
        };
      }

      if (!authCodes || authCodes.length === 0) {
        // Check if code exists but is expired/used
        const { data: expiredCodes } = await this.supabase
          .from('auth_codes')
          .select('*')
          .eq('phone', phone)
          .eq('code', code)
          .order('created_at', { ascending: false })
          .limit(1);

        if (expiredCodes && expiredCodes.length > 0) {
          return {
            success: false,
            message: 'Código expirado ou já utilizado. Solicite um novo código.'
          };
        }

        // Increment attempts for any active codes for this phone
        await this.incrementFailedAttempts(phone);

        return {
          success: false,
          message: 'Código inválido. Verifique e tente novamente.'
        };
      }

      const authCode = authCodes[0] as AuthCodeData;

      // Check max attempts
      if (authCode.attempts >= authCode.max_attempts) {
        return {
          success: false,
          message: 'Muitas tentativas. Solicite um novo código.'
        };
      }

      // Mark code as used
      const { error: updateError } = await this.supabase
        .from('auth_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('id', authCode.id);

      if (updateError) {
        console.error('Error updating auth code:', updateError);
        return {
          success: false,
          message: 'Erro interno. Tente novamente.'
        };
      }

      // Create or get user
      const userResult = await this.createOrGetUser(phone);
      if (!userResult.success) {
        return {
          success: false,
          message: userResult.message
        };
      }

      // Generate JWT token (simplified - in production use proper JWT library)
      const token = await this.generateUserToken(userResult.userId!, phone);

      // Update user last login
      await this.supabase
        .from('users_simplified')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userResult.userId);

      return {
        success: true,
        userId: userResult.userId,
        token,
        message: 'Login realizado com sucesso!'
      };

    } catch (error) {
      console.error('Error in verifyAuthCode:', error);
      return {
        success: false,
        message: 'Erro interno. Tente novamente.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clean up expired auth codes
   */
  async cleanupExpiredCodes(): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .rpc('cleanup_expired_auth_codes');

      if (error) {
        console.error('Error cleaning up expired codes:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error in cleanupExpiredCodes:', error);
      return 0;
    }
  }

  /**
   * Check if admin instance is connected and ready
   */
  async checkAdminInstanceStatus(): Promise<{ connected: boolean; message: string }> {
    try {
      const status = await this.evolutionClient.getInstanceStatus(this.adminInstanceId);
      
      if (status.success && status.data?.instance?.state === 'open') {
        return {
          connected: true,
          message: 'Admin instance is connected and ready'
        };
      }

      return {
        connected: false,
        message: 'Admin instance is not connected. Please scan QR code.'
      };
    } catch (error) {
      console.error('Error checking admin instance status:', error);
      return {
        connected: false,
        message: 'Error checking admin instance status'
      };
    }
  }

  // Private helper methods

  private isValidBrazilianPhone(phone: string): boolean {
    // Brazilian phone format: +55 + area code (2 digits) + number (8 or 9 digits)
    const brazilianPhoneRegex = /^\+55[1-9][0-9]{8,9}$/;
    return brazilianPhoneRegex.test(phone);
  }

  private generateAuthCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private formatAuthMessage(code: string): string {
    return `🔐 *AIDA Platform*\n\nSeu código de autenticação é: *${code}*\n\nEste código expira em ${this.codeExpirationMinutes} minutos.\n\n⚠️ Não compartilhe este código com ninguém.`;
  }

  private async sendWhatsAppMessage(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Format phone for WhatsApp (remove + and add @s.whatsapp.net)
      const whatsappNumber = phone.replace('+', '') + '@s.whatsapp.net';

      const result = await this.evolutionClient.sendMessage(this.adminInstanceId, {
        number: whatsappNumber,
        text: message
      });

      return {
        success: result.success
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkRateLimit(phone: string): Promise<{ allowed: boolean; waitMinutes?: number }> {
    try {
      const { data: recentCodes, error } = await this.supabase
        .from('auth_codes')
        .select('created_at')
        .eq('phone', phone)
        .gte('created_at', new Date(Date.now() - this.rateLimitMinutes * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error checking rate limit:', error);
        return { allowed: true }; // Allow on error to not block users
      }

      if (recentCodes && recentCodes.length > 0) {
        const lastCodeTime = new Date(recentCodes[0].created_at);
        const timeDiff = Date.now() - lastCodeTime.getTime();
        const minutesDiff = Math.ceil(timeDiff / (1000 * 60));
        
        if (minutesDiff < this.rateLimitMinutes) {
          return {
            allowed: false,
            waitMinutes: this.rateLimitMinutes - minutesDiff
          };
        }
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error in checkRateLimit:', error);
      return { allowed: true }; // Allow on error
    }
  }

  private async incrementFailedAttempts(phone: string): Promise<void> {
    try {
      // Get active codes for this phone
      const { data: activeCodes } = await this.supabase
        .from('auth_codes')
        .select('id, attempts')
        .eq('phone', phone)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString());

      if (activeCodes && activeCodes.length > 0) {
        // Increment attempts for all active codes
        for (const code of activeCodes) {
          await this.supabase
            .from('auth_codes')
            .update({ attempts: code.attempts + 1 })
            .eq('id', code.id);
        }
      }
    } catch (error) {
      console.error('Error incrementing failed attempts:', error);
    }
  }

  private async createOrGetUser(phone: string): Promise<{ success: boolean; userId?: string; message: string }> {
    try {
      // Try to find existing user
      const { data: existingUser, error: findError } = await this.supabase
        .from('users_simplified')
        .select('id')
        .eq('phone', phone)
        .single();

      if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error finding user:', findError);
        return {
          success: false,
          message: 'Erro interno. Tente novamente.'
        };
      }

      if (existingUser) {
        return {
          success: true,
          userId: existingUser.id,
          message: 'User found'
        };
      }

      // Create new user
      const { data: newUser, error: createError } = await this.supabase
        .from('users_simplified')
        .insert({ phone })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return {
          success: false,
          message: 'Erro ao criar usuário. Tente novamente.'
        };
      }

      return {
        success: true,
        userId: newUser.id,
        message: 'User created'
      };
    } catch (error) {
      console.error('Error in createOrGetUser:', error);
      return {
        success: false,
        message: 'Erro interno. Tente novamente.'
      };
    }
  }

  private async generateUserToken(userId: string, phone: string): Promise<string> {
    // In production, use a proper JWT library like jsonwebtoken
    // For now, create a simple token structure
    const payload = {
      sub: userId,
      phone,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
    };

    // This is a simplified token - in production use proper JWT signing
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Validate and decode user token
   */
  static validateToken(token: string): { valid: boolean; userId?: string; phone?: string } {
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return { valid: false }; // Token expired
      }

      return {
        valid: true,
        userId: payload.sub,
        phone: payload.phone
      };
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Setup admin instance for authentication
   */
  static async setupAdminInstance(
    evolutionClient: EvolutionAPIClient,
    instanceName: string = 'aida-auth-admin'
  ): Promise<{ success: boolean; instanceId?: string; qrCode?: string; message: string }> {
    try {
      // Create admin instance
      const createResult = await evolutionClient.createInstance({
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      });

      if (!createResult.success) {
        return {
          success: false,
          message: 'Failed to create admin instance'
        };
      }

      // Get QR code for connection
      const qrResult = await evolutionClient.getInstanceQRCode(instanceName);
      
      return {
        success: true,
        instanceId: instanceName,
        qrCode: qrResult.data?.qrcode?.base64,
        message: 'Admin instance created. Please scan QR code to connect.'
      };
    } catch (error) {
      console.error('Error setting up admin instance:', error);
      return {
        success: false,
        message: 'Error setting up admin instance'
      };
    }
  }
}

// Factory function
export function createWhatsAppAuthService(
  supabase: SupabaseClient,
  evolutionClient: EvolutionAPIClient,
  adminInstanceId: string
): WhatsAppAuthService {
  return new WhatsAppAuthService(supabase, evolutionClient, adminInstanceId);
}

// Export types
export type { SendCodeResult, VerifyCodeResult, AuthCodeData };