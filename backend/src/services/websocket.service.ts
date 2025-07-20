import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { WhatsAppAuthService } from './whatsapp-auth.service';

export interface SocketUser {
  userId: string;
  phone: string;
  socketId: string;
}

export interface InstanceUpdate {
  instanceId: string;
  userId: string;
  status: string;
  connectionState?: string;
  qrCode?: string;
  message?: string;
}

export interface MessageUpdate {
  instanceId: string;
  conversationId: string;
  messageId: string;
  content: string;
  sender: string;
  timestamp: Date;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, SocketUser> = new Map();
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Handle authentication
      socket.on('authenticate', async (token: string) => {
        try {
          const decoded = WhatsAppAuthService.verifyJWT(token);
          
          if (decoded) {
            const user: SocketUser = {
              userId: decoded.userId,
              phone: decoded.phone,
              socketId: socket.id
            };

            // Store user connection
            this.connectedUsers.set(socket.id, user);
            
            // Add socket to user's socket set
            if (!this.userSockets.has(user.userId)) {
              this.userSockets.set(user.userId, new Set());
            }
            this.userSockets.get(user.userId)!.add(socket.id);

            // Join user-specific room
            socket.join(`user:${user.userId}`);
            
            socket.emit('authenticated', { 
              success: true, 
              userId: user.userId 
            });

            console.log(`User ${user.userId} authenticated on socket ${socket.id}`);
          } else {
            socket.emit('authenticated', { 
              success: false, 
              error: 'Invalid token' 
            });
          }
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('authenticated', { 
            success: false, 
            error: 'Authentication failed' 
          });
        }
      });

      // Handle joining instance room
      socket.on('join-instance', (instanceId: string) => {
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          socket.join(`instance:${instanceId}`);
          socket.emit('joined-instance', { instanceId });
          console.log(`User ${user.userId} joined instance room: ${instanceId}`);
        }
      });

      // Handle leaving instance room
      socket.on('leave-instance', (instanceId: string) => {
        socket.leave(`instance:${instanceId}`);
        socket.emit('left-instance', { instanceId });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          // Remove socket from user's socket set
          const userSocketSet = this.userSockets.get(user.userId);
          if (userSocketSet) {
            userSocketSet.delete(socket.id);
            if (userSocketSet.size === 0) {
              this.userSockets.delete(user.userId);
            }
          }

          this.connectedUsers.delete(socket.id);
          console.log(`User ${user.userId} disconnected from socket ${socket.id}`);
        }
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });
  }

  /**
   * Notify user about instance updates
   */
  notifyInstanceUpdate(update: InstanceUpdate) {
    try {
      // Send to specific user
      this.io.to(`user:${update.userId}`).emit('instance-update', {
        instanceId: update.instanceId,
        status: update.status,
        connectionState: update.connectionState,
        qrCode: update.qrCode,
        message: update.message,
        timestamp: new Date().toISOString()
      });

      // Also send to instance room if anyone is watching
      this.io.to(`instance:${update.instanceId}`).emit('instance-status-change', {
        instanceId: update.instanceId,
        status: update.status,
        connectionState: update.connectionState,
        timestamp: new Date().toISOString()
      });

      console.log(`Instance update sent for ${update.instanceId}: ${update.status}`);
    } catch (error) {
      console.error('Error sending instance update:', error);
    }
  }

  /**
   * Notify about new messages
   */
  notifyNewMessage(update: MessageUpdate) {
    try {
      this.io.to(`instance:${update.instanceId}`).emit('new-message', {
        instanceId: update.instanceId,
        conversationId: update.conversationId,
        messageId: update.messageId,
        content: update.content,
        sender: update.sender,
        timestamp: update.timestamp.toISOString()
      });

      console.log(`New message notification sent for instance ${update.instanceId}`);
    } catch (error) {
      console.error('Error sending message update:', error);
    }
  }

  /**
   * Notify about QR code updates
   */
  notifyQRCodeUpdate(instanceId: string, userId: string, qrCode: string) {
    try {
      this.io.to(`user:${userId}`).emit('qr-code-update', {
        instanceId,
        qrCode,
        timestamp: new Date().toISOString()
      });

      console.log(`QR Code update sent for instance ${instanceId}`);
    } catch (error) {
      console.error('Error sending QR code update:', error);
    }
  }

  /**
   * Broadcast system notification
   */
  broadcastSystemNotification(message: string, type: 'info' | 'warning' | 'error' = 'info') {
    try {
      this.io.emit('system-notification', {
        message,
        type,
        timestamp: new Date().toISOString()
      });

      console.log(`System notification broadcasted: ${message}`);
    } catch (error) {
      console.error('Error broadcasting system notification:', error);
    }
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get user connection info
   */
  getUserConnections(userId: string): string[] {
    const socketSet = this.userSockets.get(userId);
    return socketSet ? Array.from(socketSet) : [];
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  /**
   * Send private message to specific user
   */
  sendToUser(userId: string, event: string, data: any) {
    try {
      this.io.to(`user:${userId}`).emit(event, data);
      console.log(`Private message sent to user ${userId}: ${event}`);
    } catch (error) {
      console.error('Error sending private message:', error);
    }
  }

  /**
   * Get server stats
   */
  getStats() {
    return {
      totalConnections: this.connectedUsers.size,
      totalUsers: this.userSockets.size,
      rooms: this.io.sockets.adapter.rooms.size,
      uptime: process.uptime()
    };
  }
}

// Singleton instance
let webSocketService: WebSocketService | null = null;

export function initializeWebSocketService(server: HttpServer): WebSocketService {
  if (!webSocketService) {
    webSocketService = new WebSocketService(server);
    console.log('✅ WebSocket service initialized');
  }
  return webSocketService;
}

export function getWebSocketService(): WebSocketService | null {
  return webSocketService;
}