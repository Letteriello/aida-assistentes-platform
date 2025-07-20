import { z } from 'zod';

/**
 * Onboarding status interface
 */
export interface OnboardingStatus {
  businessId: string;
  step: number;
  stepName: 'assistant_creation' | 'whatsapp_connection' | 'knowledge_upload' | 'completed';
  assistantId?: string;
  instanceName?: string;
  qrCode?: string;
  connectionStatus?: 'waiting' | 'connecting' | 'connected' | 'error';
  documentsCount?: number;
  isCompleted: boolean;
  progress: number;
  message?: string;
  updatedAt: string;
}

/**
 * Onboarding status update interface
 */
export interface OnboardingStatusUpdate {
  step?: number;
  stepName?: 'assistant_creation' | 'whatsapp_connection' | 'knowledge_upload' | 'completed';
  assistantId?: string;
  instanceName?: string;
  qrCode?: string;
  connectionStatus?: 'waiting' | 'connecting' | 'connected' | 'error';
  documentsCount?: number;
  isCompleted?: boolean;
  progress?: number;
  message?: string;
}

/**
 * WebSocket client for onboarding status updates
 */
export class OnboardingWebSocketClient {
  private ws: WebSocket | null = null;
  private businessId: string;
  private baseUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners = new Map<string, Array<(data: unknown) => void>>();
  private isReconnecting = false;

  constructor(businessId: string, baseUrl = 'ws://localhost:8787') {
    this.businessId = businessId;
    this.baseUrl = baseUrl;
  }

  /**
   * Connect to WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${this.baseUrl}/api/onboarding/websocket/${this.businessId}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.isReconnecting = false;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          this.handleDisconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Add event listener
   */
  on(event: string, callback: (data: unknown) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: (data: unknown) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  /**
   * Send message through WebSocket
   */
  send(message: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  /**
   * Update onboarding status
   */
  async updateStatus(update: OnboardingStatusUpdate): Promise<OnboardingStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/api/onboarding/websocket/${this.businessId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(update)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Status update failed: ${error.error || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to update onboarding status:', error);
      throw error;
    }
  }

  /**
   * Get current onboarding status
   */
  async getStatus(): Promise<OnboardingStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/api/onboarding/websocket/${this.businessId}/status`);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Get status failed: ${error.error || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get onboarding status:', error);
      throw error;
    }
  }

  /**
   * Test service connectivity
   */
  async testService(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/onboarding/test`);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Service test failed: ${error.error || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Service test failed:', error);
      throw error;
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: unknown): void {
    if (typeof data === 'object' && data !== null && 'type' in data) {
      const message = data as { type: string; payload?: unknown };
      const listeners = this.listeners.get(message.type);
      if (listeners) {
        listeners.forEach(callback => {
          try {
            callback(message.payload);
          } catch (error) {
            console.error('Error in WebSocket message handler:', error);
          }
        });
      }
    }
  }

  /**
   * Handle WebSocket disconnection
   */
  private handleDisconnect(): void {
    if (!this.isReconnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.isReconnecting = true;
      this.reconnectAttempts++;

      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
          this.isReconnecting = false;
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.ws) {
      return 'closed';
    }

    switch (this.ws.readyState) {
    case WebSocket.CONNECTING:
      return 'connecting';
    case WebSocket.OPEN:
      return 'open';
    case WebSocket.CLOSING:
      return 'closing';
    case WebSocket.CLOSED:
    default:
      return 'closed';
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

/**
 * Validation schemas
 */
export const OnboardingStatusSchema = z.object({
  businessId: z.string(),
  step: z.number().min(1).max(4),
  stepName: z.enum(['assistant_creation', 'whatsapp_connection', 'knowledge_upload', 'completed']),
  assistantId: z.string().optional(),
  instanceName: z.string().optional(),
  qrCode: z.string().optional(),
  connectionStatus: z.enum(['waiting', 'connecting', 'connected', 'error']).optional(),
  documentsCount: z.number().min(0).optional(),
  isCompleted: z.boolean(),
  progress: z.number().min(0).max(100),
  message: z.string().optional(),
  updatedAt: z.string()
});

export const OnboardingStatusUpdateSchema = z.object({
  step: z.number().min(1).max(4).optional(),
  stepName: z.enum(['assistant_creation', 'whatsapp_connection', 'knowledge_upload', 'completed']).optional(),
  assistantId: z.string().optional(),
  instanceName: z.string().optional(),
  qrCode: z.string().optional(),
  connectionStatus: z.enum(['waiting', 'connecting', 'connected', 'error']).optional(),
  documentsCount: z.number().min(0).optional(),
  isCompleted: z.boolean().optional(),
  progress: z.number().min(0).max(100).optional(),
  message: z.string().optional()
});

/**
 * Factory function to create OnboardingWebSocketClient
 */
export function createOnboardingWebSocketClient(
  businessId: string,
  baseUrl?: string
): OnboardingWebSocketClient {
  return new OnboardingWebSocketClient(businessId, baseUrl);
}

/**
 * Utility function to validate onboarding status
 */
export function validateOnboardingStatus(data: unknown): OnboardingStatus {
  return OnboardingStatusSchema.parse(data);
}

/**
 * Utility function to validate onboarding status update
 */
export function validateOnboardingStatusUpdate(data: unknown): OnboardingStatusUpdate {
  return OnboardingStatusUpdateSchema.parse(data);
}
