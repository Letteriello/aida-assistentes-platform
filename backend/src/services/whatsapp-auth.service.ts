import { SupabaseClient } from '@supabase/supabase-js';
import { getEvolutionClient } from '../lib/evolution-client';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface PhoneVerificationRequest {
  phoneNumber: string;
  countryCode?: string;
}

export interface VerifyCodeRequest {
  phoneNumber: string;
  code: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    phone: string;
    name?: string;
    businessId?: string;
  };
}

export interface VerificationCode {
  phone_number: string;
  code: string;
  expires_at: Date;
  attempts: number;
  created_at: Date;
}

export class WhatsAppAuthService {
  private supabase: SupabaseClient;
  private evolutionClient;
  private adminInstanceName: string | null = null;
  
  // Configurações
  private readonly CODE_LENGTH = 6;
  private readonly CODE_EXPIRY_MINUTES = 15;
  private readonly MAX_ATTEMPTS = 3;
  private readonly RATE_LIMIT_WINDOW = 60; // 60 segundos
  private readonly MAX_CODES_PER_WINDOW = 3;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.evolutionClient = getEvolutionClient();
    this.initializeAdminInstance();
  }

  /**
   * Inicializar instância administrativa para envio de códigos
   */
  private async initializeAdminInstance(): Promise<void> {
    try {
      // Verificar se já existe uma instância admin ativa
      const { data: existingInstance } = await this.supabase
        .from('admin_instances')
        .select('instance_name, status')
        .eq('status', 'active')
        .single();

      if (existingInstance) {
        // Verificar se a instância ainda está conectada
        const isConnected = await this.evolutionClient.isInstanceConnected(existingInstance.instance_name);
        
        if (isConnected) {
          this.adminInstanceName = existingInstance.instance_name;
          console.log('Using existing admin instance:', this.adminInstanceName);
          return;
        } else {
          // Marcar instância como inativa
          await this.supabase
            .from('admin_instances')
            .update({ status: 'inactive' })
            .eq('instance_name', existingInstance.instance_name);
        }
      }

      // Criar nova instância admin
      await this.createNewAdminInstance();
      
    } catch (error) {
      console.error('Error initializing admin instance:', error);
    }
  }

  /**
   * Criar nova instância administrativa
   */
  private async createNewAdminInstance(): Promise<void> {
    try {
      const adminInstanceName = `aida_admin_${Date.now()}`;
      
      const webhookUrl = `${process.env.APP_URL}/api/webhook/admin`;
      
      const instance = await this.evolutionClient.createInstance({
        instanceName: adminInstanceName,
        qrcode: true,
        webhook: {
          url: webhookUrl,
          events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE']
        }
      });

      // Salvar no banco
      await this.supabase.from('admin_instances').insert({
        instance_name: adminInstanceName,
        status: 'pending',
        qr_code: instance.qrcode?.base64,
        created_at: new Date()
      });

      this.adminInstanceName = adminInstanceName;
      console.log('Created new admin instance:', adminInstanceName);
      
    } catch (error) {
      console.error('Error creating admin instance:', error);
      throw new Error('Failed to initialize WhatsApp admin instance');
    }
  }

  /**
   * Validar número de telefone brasileiro
   */
  private validateBrazilianPhone(phoneNumber: string): { isValid: boolean; formattedPhone: string; error?: string } {
    // Remover caracteres não numéricos
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Verificar se é um número brasileiro válido
    if (cleanPhone.length === 11 && cleanPhone.startsWith('55')) {
      // Com código do país
      const phone = cleanPhone;
      const ddd = phone.substring(2, 4);
      const number = phone.substring(4);
      
      // Validar DDD
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
        return { isValid: false, formattedPhone: '', error: 'DDD inválido' };
      }
      
      // Validar formato do número (celular deve ter 9 dígitos)
      if (number.length === 9 && number.startsWith('9')) {
        return { isValid: true, formattedPhone: phone };
      } else if (number.length === 8) {
        return { isValid: false, formattedPhone: '', error: 'Número deve ser um celular (9 dígitos)' };
      }
      
      return { isValid: false, formattedPhone: '', error: 'Formato de número inválido' };
      
    } else if (cleanPhone.length === 9 || cleanPhone.length === 10) {
      // Sem código do país, assumir Brasil
      return { isValid: false, formattedPhone: '', error: 'Inclua o código do país +55' };
      
    } else {
      return { isValid: false, formattedPhone: '', error: 'Número de telefone inválido' };
    }
  }

  /**
   * Verificar rate limiting
   */
  private async checkRateLimit(phoneNumber: string): Promise<{ allowed: boolean; error?: string }> {
    const windowStart = new Date(Date.now() - (this.RATE_LIMIT_WINDOW * 1000));
    
    const { data: recentCodes, error } = await this.supabase
      .from('auth_codes')
      .select('phone')
      .eq('phone', phoneNumber)
      .gte('created_at', windowStart.toISOString());

    if (error) {
      console.error('Error checking rate limit:', error);
      return { allowed: false, error: 'Erro interno do servidor' };
    }

    if (recentCodes && recentCodes.length >= this.MAX_CODES_PER_WINDOW) {
      return { 
        allowed: false, 
        error: `Muitas tentativas. Aguarde ${this.RATE_LIMIT_WINDOW} segundos antes de tentar novamente.` 
      };
    }

    return { allowed: true };
  }

  /**
   * Gerar código de verificação
   */
  private generateVerificationCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Enviar código de verificação via WhatsApp
   */
  async sendVerificationCode(request: PhoneVerificationRequest): Promise<AuthResponse> {
    try {
      // 1. Validar número de telefone
      const validation = this.validateBrazilianPhone(request.phoneNumber);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.error || 'Número de telefone inválido'
        };
      }

      const phoneNumber = validation.formattedPhone;

      // 2. Verificar rate limiting
      const rateLimitCheck = await this.checkRateLimit(phoneNumber);
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          message: rateLimitCheck.error || 'Muitas tentativas'
        };
      }

      // 3. Verificar se admin instance está disponível
      if (!this.adminInstanceName) {
        await this.initializeAdminInstance();
      }

      if (!this.adminInstanceName) {
        return {
          success: false,
          message: 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.'
        };
      }

      // 4. Verificar se admin instance está conectada
      const isConnected = await this.evolutionClient.isInstanceConnected(this.adminInstanceName);
      if (!isConnected) {
        return {
          success: false,
          message: 'Sistema WhatsApp temporariamente indisponível. Tente novamente em alguns minutos.'
        };
      }

      // 5. Gerar código
      const code = this.generateVerificationCode();
      const expiresAt = new Date(Date.now() + (this.CODE_EXPIRY_MINUTES * 60 * 1000));

      // 6. Salvar código no banco
      const { error: dbError } = await this.supabase
        .from('auth_codes')
        .upsert({
          phone: phoneNumber,
          code: code,
          expires_at: expiresAt.toISOString(),
          attempts: 0,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'phone'
        });

      if (dbError) {
        console.error('Error saving verification code:', dbError);
        return {
          success: false,
          message: 'Erro interno do servidor'
        };
      }

      // 7. Enviar código via WhatsApp
      const message = `🤖 *AIDA Assistentes*

Seu código de verificação é: *${code}*

⏰ Este código expira em ${this.CODE_EXPIRY_MINUTES} minutos.
🔒 Não compartilhe este código com ninguém.

Se você não solicitou este código, ignore esta mensagem.`;

      try {
        await this.evolutionClient.sendTextMessage(this.adminInstanceName, {
          number: phoneNumber,
          text: message
        });

        return {
          success: true,
          message: `Código enviado para WhatsApp +${phoneNumber}. Verifique suas mensagens.`
        };

      } catch (whatsappError) {
        console.error('Error sending WhatsApp message:', whatsappError);
        
        // Remover código do banco se falha no envio
        await this.supabase
          .from('auth_codes')
          .delete()
          .eq('phone', phoneNumber);

        return {
          success: false,
          message: 'Erro ao enviar código via WhatsApp. Verifique se o número está correto.'
        };
      }

    } catch (error) {
      console.error('Error in sendVerificationCode:', error);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Verificar código de verificação
   */
  async verifyCode(request: VerifyCodeRequest): Promise<AuthResponse> {
    try {
      // 1. Validar número de telefone
      const validation = this.validateBrazilianPhone(request.phoneNumber);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.error || 'Número de telefone inválido'
        };
      }

      const phoneNumber = validation.formattedPhone;

      // 2. Buscar código no banco
      const { data: codeData, error: fetchError } = await this.supabase
        .from('auth_codes')
        .select('*')
        .eq('phone', phoneNumber)
        .single();

      if (fetchError || !codeData) {
        return {
          success: false,
          message: 'Código não encontrado. Solicite um novo código.'
        };
      }

      // 3. Verificar se código expirou
      if (new Date() > new Date(codeData.expires_at)) {
        // Remover código expirado
        await this.supabase
          .from('auth_codes')
          .delete()
          .eq('phone', phoneNumber);

        return {
          success: false,
          message: 'Código expirado. Solicite um novo código.'
        };
      }

      // 4. Verificar tentativas
      if (codeData.attempts >= this.MAX_ATTEMPTS) {
        // Remover código após muitas tentativas
        await this.supabase
          .from('auth_codes')
          .delete()
          .eq('phone', phoneNumber);

        return {
          success: false,
          message: 'Muitas tentativas incorretas. Solicite um novo código.'
        };
      }

      // 5. Verificar código
      if (codeData.code !== request.code) {
        // Incrementar tentativas
        await this.supabase
          .from('auth_codes')
          .update({ attempts: codeData.attempts + 1 })
          .eq('phone', phoneNumber);

        const remainingAttempts = this.MAX_ATTEMPTS - (codeData.attempts + 1);
        return {
          success: false,
          message: `Código incorreto. ${remainingAttempts} tentativa(s) restante(s).`
        };
      }

      // 6. Código correto - remover do banco
      await this.supabase
        .from('auth_codes')
        .delete()
        .eq('phone', phoneNumber);

      // 7. Buscar ou criar usuário
      let user = await this.findOrCreateUser(phoneNumber);

      // 8. Gerar token JWT
      const token = this.generateJWT(user);

      return {
        success: true,
        message: 'Login realizado com sucesso!',
        token,
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          businessId: null // Will be set later during onboarding
        }
      };

    } catch (error) {
      console.error('Error in verifyCode:', error);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Encontrar ou criar usuário
   */
  private async findOrCreateUser(phoneNumber: string): Promise<any> {
    // Buscar usuário existente
    let { data: user, error } = await this.supabase
      .from('users_simplified')
      .select('*')
      .eq('phone', phoneNumber)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error;
    }

    if (!user) {
      // Criar novo usuário
      const { data: newUser, error: createError } = await this.supabase
        .from('users_simplified')
        .insert({
          phone: phoneNumber,
          name: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      user = newUser;
    } else {
      // Atualizar último acesso
      await this.supabase
        .from('users_simplified')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', user.id);
    }

    return user;
  }

  /**
   * Gerar JWT token
   */
  private generateJWT(user: any): string {
    const payload = {
      userId: user.id,
      phone: user.phone,
      businessId: null, // Will be set later during onboarding
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 dias
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'aida-secret-key');
  }

  /**
   * Verificar token JWT
   */
  static verifyJWT(token: string): any {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'aida-secret-key');
    } catch (error) {
      return null;
    }
  }

  /**
   * Middleware de autenticação
   */
  static authMiddleware() {
    return (req: any, res: any, next: any) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token de acesso requerido' });
      }

      const token = authHeader.substring(7);
      const decoded = WhatsAppAuthService.verifyJWT(token);

      if (!decoded) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
      }

      req.user = decoded;
      next();
    };
  }

  /**
   * Obter QR Code da instância admin (para primeiras configurações)
   */
  async getAdminQRCode(): Promise<{ qrCode?: string; isConnected: boolean }> {
    try {
      if (!this.adminInstanceName) {
        await this.initializeAdminInstance();
      }

      if (!this.adminInstanceName) {
        return { isConnected: false };
      }

      const isConnected = await this.evolutionClient.isInstanceConnected(this.adminInstanceName);
      
      if (isConnected) {
        return { isConnected: true };
      }

      // Tentar reconectar e obter QR code
      const connection = await this.evolutionClient.connectInstance(this.adminInstanceName);
      
      return {
        qrCode: connection.qrcode.base64,
        isConnected: false
      };

    } catch (error) {
      console.error('Error getting admin QR code:', error);
      return { isConnected: false };
    }
  }
}