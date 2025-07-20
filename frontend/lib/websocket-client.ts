/**
 * AIDA Platform - WebSocket Client
 * Cliente para comunicação WebSocket em tempo real
 */

import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './stores/auth-store';
import { useInstancesStore } from './stores/instances-store';
import { toast } from 'sonner';

export interface InstanceUpdate {
  instanceId: string;
  status: string;
  connectionState?: string;
  qrCode?: string;
  message?: string;
  timestamp: string;
}

export interface QRCodeUpdate {
  instanceId: string;
  qrCode: string;
  timestamp: string;
}

export interface NewMessage {
  instanceId: string;
  conversationId: string;
  messageId: string;
  content: string;
  sender: string;
  timestamp: string;
}

export interface SystemNotification {
  message: string;
  type: 'info' | 'warning' | 'error';
  timestamp: string;
}

class WebSocketClient {
  private socket: Socket | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  /**
   * Conectar ao WebSocket
   */
  connect(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.socket?.connected) {
        resolve(true);
        return;
      }

      if (this.isConnecting) {
        resolve(false);
        return;
      }

      this.isConnecting = true;

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8787';
      
      this.socket = io(backendUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        autoConnect: true
      });

      this.setupEventHandlers();

      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Authenticate with stored token
        const authStore = useAuthStore.getState();
        if (authStore.token) {
          this.authenticate(authStore.token);
        }
        
        resolve(true);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        this.isConnecting = false;
        this.handleReconnect();
        resolve(false);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 WebSocket disconnected:', reason);
        this.isConnecting = false;
        
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, try to reconnect
          this.handleReconnect();
        }
      });
    });
  }

  /**
   * Configurar event handlers
   */
  private setupEventHandlers() {
    if (!this.socket) return;

    // Authentication response
    this.socket.on('authenticated', (data) => {
      if (data.success) {
        console.log('✅ WebSocket authenticated for user:', data.userId);
      } else {
        console.error('❌ WebSocket authentication failed:', data.error);
        toast.error('Erro na autenticação WebSocket');
      }
    });

    // Instance updates
    this.socket.on('instance-update', (update: InstanceUpdate) => {
      console.log('📱 Instance update received:', update);
      
      const instancesStore = useInstancesStore.getState();
      
      // Update instance in store
      const updatedInstances = instancesStore.instances.map(instance => {
        if (instance.id === update.instanceId) {
          return {
            ...instance,
            status: update.status as any,
            updated_at: update.timestamp
          };
        }
        return instance;
      });
      
      instancesStore.instances = updatedInstances;
      
      // Update selected instance if it matches
      if (instancesStore.selectedInstance?.id === update.instanceId) {
        instancesStore.selectedInstance = {
          ...instancesStore.selectedInstance,
          status: update.status as any,
          updated_at: update.timestamp
        };
      }

      // Show toast notification
      if (update.message) {
        toast.success(update.message);
      }
    });

    // QR Code updates
    this.socket.on('qr-code-update', (update: QRCodeUpdate) => {
      console.log('🔄 QR Code update received:', update.instanceId);
      
      const instancesStore = useInstancesStore.getState();
      instancesStore.currentQRCode = update.qrCode;
      
      toast.info('QR Code atualizado!');
    });

    // New messages
    this.socket.on('new-message', (message: NewMessage) => {
      console.log('💬 New message received:', message);
      
      // You can handle new message notifications here
      toast.info(`Nova mensagem de ${message.sender}`);
    });

    // System notifications
    this.socket.on('system-notification', (notification: SystemNotification) => {
      console.log('📢 System notification:', notification);
      
      switch (notification.type) {
        case 'info':
          toast.info(notification.message);
          break;
        case 'warning':
          toast.warning(notification.message);
          break;
        case 'error':
          toast.error(notification.message);
          break;
      }
    });

    // Ping/Pong for connection health
    this.socket.on('pong', () => {
      // Connection is healthy
    });
  }

  /**
   * Autenticar com token
   */
  authenticate(token: string) {
    if (this.socket?.connected) {
      this.socket.emit('authenticate', token);
    }
  }

  /**
   * Entrar em sala de instância
   */
  joinInstance(instanceId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join-instance', instanceId);
    }
  }

  /**
   * Sair de sala de instância
   */
  leaveInstance(instanceId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave-instance', instanceId);
    }
  }

  /**
   * Verificar saúde da conexão
   */
  ping() {
    if (this.socket?.connected) {
      this.socket.emit('ping');
    }
  }

  /**
   * Desconectar
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Verificar se está conectado
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Tratar reconexão
   */
  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      toast.error('Conexão WebSocket perdida. Recarregue a página.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Obter status da conexão
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected(),
      connecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id
    };
  }
}

// Singleton instance
let webSocketClient: WebSocketClient | null = null;

export function getWebSocketClient(): WebSocketClient {
  if (!webSocketClient) {
    webSocketClient = new WebSocketClient();
  }
  return webSocketClient;
}

// Hook para usar WebSocket em componentes React
export function useWebSocket() {
  const client = getWebSocketClient();
  
  return {
    connect: () => client.connect(),
    disconnect: () => client.disconnect(),
    authenticate: (token: string) => client.authenticate(token),
    joinInstance: (instanceId: string) => client.joinInstance(instanceId),
    leaveInstance: (instanceId: string) => client.leaveInstance(instanceId),
    ping: () => client.ping(),
    isConnected: () => client.isConnected(),
    getStatus: () => client.getConnectionStatus()
  };
}

export default webSocketClient;