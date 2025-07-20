import { Router } from 'express';
import { AuthController } from '../api/auth';

export function createAuthRoutes(): Router {
  const router = Router();
  const authController = new AuthController();

  // POST /api/auth/send-code - Enviar código de verificação via WhatsApp
  router.post('/send-code', (req, res) => authController.sendVerificationCode(req, res));

  // POST /api/auth/verify-code - Verificar código de verificação
  router.post('/verify-code', (req, res) => authController.verifyCode(req, res));

  // GET /api/auth/me - Obter informações do usuário autenticado
  router.get('/me', (req, res) => authController.getCurrentUser(req, res));

  // POST /api/auth/logout - Logout do usuário
  router.post('/logout', (req, res) => authController.logout(req, res));

  // GET /api/auth/admin-qr - Obter QR Code da instância admin (desenvolvimento)
  router.get('/admin-qr', (req, res) => authController.getAdminQRCode(req, res));

  // GET /api/auth/health - Health check do serviço de autenticação
  router.get('/health', (req, res) => authController.healthCheck(req, res));

  return router;
}