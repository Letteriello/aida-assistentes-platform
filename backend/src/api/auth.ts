import { Request, Response } from 'express';
import { WhatsAppAuthService, PhoneVerificationRequest, VerifyCodeRequest } from '../services/whatsapp-auth.service';
import { getSupabaseClient } from '../database/supabase-client';

export class AuthController {
  private authService: WhatsAppAuthService;

  constructor() {
    const supabase = getSupabaseClient();
    this.authService = new WhatsAppAuthService(supabase);
  }

  /**
   * POST /api/auth/send-code
   * Enviar código de verificação via WhatsApp
   */
  async sendVerificationCode(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber, countryCode } = req.body as PhoneVerificationRequest;

      // Validação básica
      if (!phoneNumber) {
        res.status(400).json({
          success: false,
          message: 'Número de telefone é obrigatório'
        });
        return;
      }

      // Log da tentativa
      console.log(`Verification code request for phone: ${phoneNumber}`);

      const result = await this.authService.sendVerificationCode({
        phoneNumber,
        countryCode
      });

      // Retornar status baseado no resultado
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);

    } catch (error) {
      console.error('Error in sendVerificationCode:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * POST /api/auth/verify-code
   * Verificar código de verificação
   */
  async verifyCode(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber, code } = req.body as VerifyCodeRequest;

      // Validação básica
      if (!phoneNumber || !code) {
        res.status(400).json({
          success: false,
          message: 'Número de telefone e código são obrigatórios'
        });
        return;
      }

      // Log da tentativa
      console.log(`Code verification attempt for phone: ${phoneNumber}`);

      const result = await this.authService.verifyCode({
        phoneNumber,
        code
      });

      // Retornar status baseado no resultado
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);

    } catch (error) {
      console.error('Error in verifyCode:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /api/auth/me
   * Obter informações do usuário autenticado
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      // O middleware de autenticação já validou o token e anexou o usuário
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
        return;
      }

      res.json({
        success: true,
        user: {
          id: user.userId,
          phone: user.phone,
          businessId: user.businessId
        }
      });

    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * POST /api/auth/logout
   * Logout do usuário (invalidar token do lado do cliente)
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      // No JWT, o logout é feito no cliente removendo o token
      // Aqui podemos registrar o logout para auditoria
      const user = (req as any).user;
      
      console.log(`User logout: ${user?.phone || 'unknown'}`);

      res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });

    } catch (error) {
      console.error('Error in logout:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /api/auth/admin-qr
   * Obter QR code da instância admin (para desenvolvimento/setup)
   */
  async getAdminQRCode(req: Request, res: Response): Promise<void> {
    try {
      // Esta rota deve ser protegida em produção
      if (process.env.NODE_ENV === 'production') {
        res.status(403).json({
          success: false,
          message: 'Acesso negado em produção'
        });
        return;
      }

      const result = await this.authService.getAdminQRCode();

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('Error in getAdminQRCode:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /api/auth/health
   * Health check para o serviço de autenticação
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        success: true,
        message: 'Auth service is healthy',
        timestamp: new Date().toISOString(),
        service: 'whatsapp-auth'
      });
    } catch (error) {
      console.error('Error in healthCheck:', error);
      res.status(500).json({
        success: false,
        message: 'Auth service is unhealthy'
      });
    }
  }
}

// Middleware de autenticação para uso em outras rotas
export const authMiddleware = WhatsAppAuthService.authMiddleware();