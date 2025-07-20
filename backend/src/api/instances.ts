import { Request, Response } from 'express';
import { WhatsAppInstanceService } from '../services/whatsapp-instance.service';
import { getSupabaseClient } from '../database/supabase-client';
import { getEvolutionClient } from '../lib/evolution-client';
import { getWebSocketService } from '../services/websocket.service';

export class InstanceController {
  private instanceService: WhatsAppInstanceService;

  constructor() {
    const supabase = getSupabaseClient();
    const evolutionClient = getEvolutionClient();
    const webhookBaseUrl = process.env.APP_URL || 'http://localhost:8787';
    
    this.instanceService = new WhatsAppInstanceService(
      supabase,
      evolutionClient,
      webhookBaseUrl
    );
  }

  /**
   * POST /api/instances/create
   * Criar nova instância WhatsApp
   */
  async createInstance(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { instanceName } = req.body;

      if (!instanceName) {
        res.status(400).json({
          success: false,
          message: 'Nome da instância é obrigatório'
        });
        return;
      }

      console.log(`Creating instance for user ${user.userId}: ${instanceName}`);

      const result = await this.instanceService.createInstance({
        instanceName,
        userId: user.userId,
        webhookUrl: `${process.env.APP_URL}/api/webhook/instances/${instanceName}`
      });

      if (result.success) {
        // Send WebSocket notification
        const wsService = getWebSocketService();
        if (wsService && result.instance) {
          wsService.notifyInstanceUpdate({
            instanceId: result.instance.id,
            userId: user.userId,
            status: result.instance.status,
            qrCode: result.qrCode,
            message: 'Instância criada com sucesso'
          });
        }
        
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Error in createInstance:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/instances
   * Listar instâncias do usuário
   */
  async listInstances(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const includeDeleted = req.query.includeDeleted === 'true';
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await this.instanceService.listUserInstances(user.userId, {
        includeDeleted,
        limit,
        offset
      });

      if (result.success) {
        res.json({
          success: true,
          instances: result.instances,
          total: result.total
        });
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Error in listInstances:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /api/instances/:instanceId/status
   * Obter status da instância
   */
  async getInstanceStatus(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { instanceId } = req.params;

      const result = await this.instanceService.getInstanceStatus(instanceId, user.userId);

      if (result.success) {
        res.json({
          success: true,
          instance: result.instance,
          connectionState: result.connectionState
        });
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Error in getInstanceStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /api/instances/:instanceId/qr-code
   * Obter QR Code para conectar instância
   */
  async getQRCode(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { instanceId } = req.params;

      const result = await this.instanceService.refreshQRCode(instanceId, user.userId);

      if (result.success) {
        // Send WebSocket notification for QR code
        const wsService = getWebSocketService();
        if (wsService && result.qrCode) {
          wsService.notifyQRCodeUpdate(instanceId, user.userId, result.qrCode);
        }
        
        res.json({
          success: true,
          qrCode: result.qrCode,
          message: result.message
        });
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Error in getQRCode:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * DELETE /api/instances/:instanceId
   * Deletar instância
   */
  async deleteInstance(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { instanceId } = req.params;

      const result = await this.instanceService.deleteInstance(instanceId, user.userId);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Error in deleteInstance:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * POST /api/webhook/instances/:instanceName
   * Webhook para receber eventos da Evolution API
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { instanceName } = req.params;
      const webhookData = req.body;

      console.log(`Webhook received for instance ${instanceName}:`, JSON.stringify(webhookData, null, 2));

      // Determinar tipo de evento
      let eventType = 'unknown';
      if (webhookData.event === 'qrcode.updated') {
        eventType = 'qrcode.updated';
      } else if (webhookData.event === 'connection.update') {
        eventType = 'connection.update';
      } else if (webhookData.event === 'messages.upsert') {
        eventType = 'messages.upsert';
      }

      const result = await this.instanceService.handleWebhookEvent(
        instanceName,
        eventType,
        webhookData
      );

      // Send WebSocket notifications for status changes
      const wsService = getWebSocketService();
      if (wsService && result.success) {
        // Get instance info to send notification
        try {
          const supabase = getSupabaseClient();
          const { data: instance } = await supabase
            .from('whatsapp_instances')
            .select('id, user_id, status')
            .eq('evolution_instance_id', instanceName)
            .single();

          if (instance) {
            let notificationMessage = '';
            let status = instance.status;

            switch (eventType) {
              case 'connection.update':
                if (webhookData.state === 'open') {
                  status = 'connected';
                  notificationMessage = 'WhatsApp conectado com sucesso!';
                } else if (webhookData.state === 'close') {
                  status = 'disconnected';
                  notificationMessage = 'WhatsApp desconectado';
                }
                break;
              case 'qrcode.updated':
                status = 'qrcode';
                notificationMessage = 'Novo QR Code disponível';
                break;
            }

            wsService.notifyInstanceUpdate({
              instanceId: instance.id,
              userId: instance.user_id,
              status: status,
              connectionState: webhookData.state,
              message: notificationMessage
            });
          }
        } catch (error) {
          console.error('Error sending webhook notification:', error);
        }
      }

      if (result.success) {
        res.json({ success: true });
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Error in handleWebhook:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * POST /api/instances/:instanceId/send-message
   * Enviar mensagem teste
   */
  async sendTestMessage(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { instanceId } = req.params;
      const { phoneNumber, message } = req.body;

      if (!phoneNumber || !message) {
        res.status(400).json({
          success: false,
          message: 'Número de telefone e mensagem são obrigatórios'
        });
        return;
      }

      // Obter instância do usuário
      const instances = await this.instanceService.listUserInstances(user.userId);
      const instance = instances.instances.find(i => i.id === instanceId);

      if (!instance) {
        res.status(404).json({
          success: false,
          message: 'Instância não encontrada'
        });
        return;
      }

      // Enviar mensagem via Evolution API
      const evolutionClient = getEvolutionClient();
      const result = await evolutionClient.sendTextMessage(instance.evolution_instance_id, {
        number: phoneNumber,
        text: message
      });

      res.json({
        success: true,
        message: 'Mensagem enviada com sucesso',
        messageId: result.key.id
      });

    } catch (error) {
      console.error('Error in sendTestMessage:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao enviar mensagem',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}