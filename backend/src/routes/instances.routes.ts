import { Router } from 'express';
import { InstanceController } from '../api/instances';
import { authMiddleware } from '../api/auth';

export function createInstanceRoutes(): Router {
  const router = Router();
  const instanceController = new InstanceController();

  // POST /api/instances/create - Criar nova instância (protegido)
  router.post('/create', authMiddleware, (req, res) => 
    instanceController.createInstance(req, res)
  );

  // GET /api/instances - Listar instâncias do usuário (protegido)
  router.get('/', authMiddleware, (req, res) => 
    instanceController.listInstances(req, res)
  );

  // GET /api/instances/:instanceId/status - Status da instância (protegido)
  router.get('/:instanceId/status', authMiddleware, (req, res) => 
    instanceController.getInstanceStatus(req, res)
  );

  // GET /api/instances/:instanceId/qr-code - QR Code da instância (protegido)
  router.get('/:instanceId/qr-code', authMiddleware, (req, res) => 
    instanceController.getQRCode(req, res)
  );

  // DELETE /api/instances/:instanceId - Deletar instância (protegido)
  router.delete('/:instanceId', authMiddleware, (req, res) => 
    instanceController.deleteInstance(req, res)
  );

  // POST /api/instances/:instanceId/send-message - Enviar mensagem teste (protegido)
  router.post('/:instanceId/send-message', authMiddleware, (req, res) => 
    instanceController.sendTestMessage(req, res)
  );

  return router;
}

export function createWebhookRoutes(): Router {
  const router = Router();
  const instanceController = new InstanceController();

  // POST /api/webhook/instances/:instanceName - Webhook público para Evolution API
  router.post('/instances/:instanceName', (req, res) => 
    instanceController.handleWebhook(req, res)
  );

  return router;
}