/**
 * AIDA Platform - Evolution API Client Tests
 * Unit tests for WhatsApp integration functionality
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createEvolutionClient, EvolutionApiClient, getDefaultEvolutionConfig } from '../../../evolution-api/client';

// Mock fetch globally
global.fetch = vi.fn();

describe('EvolutionApiClient', () => {
  let client: EvolutionApiClient;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockClear();
    
    client = createEvolutionClient({
      baseUrl: 'http://localhost:8080',
      apiKey: 'test-api-key',
      timeout: 5000,
      retryAttempts: 1
    });
  });

  describe('sendTextMessage', () => {
    it('should send text message successfully', async () => {
      const mockResponse = {
        key: {
          remoteJid: '5511999999999@s.whatsapp.net',
          fromMe: true,
          id: 'test-message-id'
        },
        message: { conversation: 'Hello World' },
        messageTimestamp: Date.now(),
        status: 'sent'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Map([['content-type', 'application/json']])
      });

      const result = await client.sendTextMessage(
        'test-instance',
        '5511999999999@s.whatsapp.net',
        'Hello World'
      );

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/message/sendText/test-instance',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'apikey': 'test-api-key'
          }),
          body: JSON.stringify({
            number: '5511999999999@s.whatsapp.net',
            text: 'Hello World'
          })
        })
      );
    });

    it('should validate WhatsApp JID format', async () => {
      await expect(
        client.sendTextMessage('test-instance', 'invalid-jid', 'Hello')
      ).rejects.toThrow('Invalid WhatsApp JID format');
    });

    it('should validate message text', async () => {
      await expect(
        client.sendTextMessage('test-instance', '5511999999999@s.whatsapp.net', '')
      ).rejects.toThrow('Message text cannot be empty');

      await expect(
        client.sendTextMessage('test-instance', '5511999999999@s.whatsapp.net', 'a'.repeat(4001))
      ).rejects.toThrow('Message text exceeds maximum length');
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized')
      });

      await expect(
        client.sendTextMessage('test-instance', '5511999999999@s.whatsapp.net', 'Hello')
      ).rejects.toThrow('Invalid Evolution API key');
    });

    it('should handle rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limit exceeded')
      });

      await expect(
        client.sendTextMessage('test-instance', '5511999999999@s.whatsapp.net', 'Hello')
      ).rejects.toThrow('Rate limit exceeded by Evolution API');
    });
  });

  describe('createInstance', () => {
    it('should create WhatsApp instance successfully', async () => {
      const mockResponse = {
        instanceName: 'test-instance',
        status: 'created',
        qrcode: 'data:image/png;base64,test-qr-code'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Map([['content-type', 'application/json']])
      });

      const result = await client.createInstance({
        instanceName: 'test-instance',
        qrcode: true,
        webhook: 'https://example.com/webhook',
        webhookEvents: ['MESSAGES_UPSERT']
      });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/instance/create',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('test-instance')
        })
      );
    });
  });

  describe('getInstanceStatus', () => {
    it('should get instance status successfully', async () => {
      const mockResponse = {
        instance: {
          state: 'open',
          qrcode: { code: 'test-qr' },
          profileName: 'Test Profile'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Map([['content-type', 'application/json']])
      });

      const result = await client.getInstanceStatus('test-instance');

      expect(result).toEqual({
        instanceName: 'test-instance',
        status: 'open',
        qrcode: 'test-qr',
        number: 'Test Profile'
      });
    });
  });

  describe('setWebhook', () => {
    it('should set webhook configuration successfully', async () => {
      const mockResponse = { success: true };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Map([['content-type', 'application/json']])
      });

      const result = await client.setWebhook('test-instance', {
        webhook: 'https://example.com/webhook',
        webhookEvents: ['MESSAGES_UPSERT'],
        webhookBase64: false
      });

      expect(result).toEqual(mockResponse);
    });

    it('should validate webhook URL', async () => {
      await expect(
        client.setWebhook('test-instance', {
          webhook: 'invalid-url',
          webhookEvents: [],
          webhookBase64: false
        })
      ).rejects.toThrow('Valid webhook URL is required');
    });
  });

  describe('healthCheck', () => {
    it('should return true for healthy API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
        headers: new Map([['content-type', 'application/json']])
      });

      const result = await client.healthCheck();
      expect(result).toBe(true);
    });

    it('should return false for unhealthy API', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await client.healthCheck();
      expect(result).toBe(false);
    });
  });

  describe('rate limiting', () => {
    it('should track rate limit status', () => {
      const status = client.getRateLimitStatus();
      
      expect(status).toHaveProperty('remaining');
      expect(status).toHaveProperty('limit');
      expect(status).toHaveProperty('resetsAt');
      expect(status.remaining).toBeLessThanOrEqual(status.limit);
    });
  });
});

describe('Factory functions', () => {
  it('should create client with factory function', () => {
    const client = createEvolutionClient({
      baseUrl: 'http://localhost:8080',
      apiKey: 'test-key'
    });

    expect(client).toBeInstanceOf(EvolutionApiClient);
  });

  it('should provide default configuration', () => {
    const config = getDefaultEvolutionConfig();
    
    expect(config).toHaveProperty('baseUrl');
    expect(config).toHaveProperty('apiKey');
    expect(config).toHaveProperty('timeout');
    expect(config).toHaveProperty('retryAttempts');
  });
});