/**
 * AIDA Platform - Evolution API Cached Service
 * Integrates Evolution API client with KV Storage caching
 *
 * FEATURES:
 * - Cached instance status and QR codes
 * - Automatic cache invalidation
 * - Retry logic with fallback
 * - Webhook-based cache updates
 * - Performance monitoring
 * - Optimized parallel processing
 */

import type { KVNamespace } from '@cloudflare/workers-types';
import { type EvolutionAPIClient, getEvolutionAPIClient } from './client';
import type { EvolutionStatusCache } from './status-cache';
import {
  type CachedInstanceStatus,
  createStatusCache,
  type StatusCacheConfig,
  updateCacheFromWebhook
} from './status-cache';
import { globalRetryManager, RetryResult, withRetry } from './retry-logic';
import type {
  InstanceConnectionResponse,
  InstanceCreateResponse,
  InstanceDeleteResponse,
  MediaMessageData,
  MessageSendResponse,
  WebhookSetResponse
} from './types';

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  expiredEntries: number;
  lastCleanup: number;
}

export interface RetryMetrics {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  averageRetryTime: number;
  circuitBreakerTrips: number;
}

export interface CachedEvolutionService {
  createInstance(instanceName: string, token?: string): Promise<InstanceCreateResponse>;
  getInstanceStatus(instanceName: string, forceRefresh?: boolean): Promise<CachedInstanceStatus>;
  getInstanceQRCode(instanceName: string, forceRefresh?: boolean): Promise<string | null>;
  connectInstance(instanceName: string): Promise<InstanceConnectionResponse>;
  disconnectInstance(instanceName: string): Promise<InstanceConnectionResponse>;
  deleteInstance(instanceName: string): Promise<InstanceDeleteResponse>;
  sendTextMessage(instanceId: string, jid: string, text: string): Promise<MessageSendResponse>;
  sendMediaMessage(instanceId: string, jid: string, media: MediaMessageData): Promise<MessageSendResponse>;
  setWebhook(instanceName: string, webhookUrl: string): Promise<WebhookSetResponse>;
  handleWebhookUpdate(webhookData: Record<string, unknown>): Promise<void>;
  invalidateCache(instanceName: string): Promise<void>;
  getCacheStats(): Promise<CacheStats>;
  cleanupExpiredCache(): Promise<number>;
  getAllCachedInstances(): Promise<CachedInstanceStatus[]>;
  refreshAllInstanceStatus(): Promise<CachedInstanceStatus[]>;
}

export class CachedEvolutionServiceImpl implements CachedEvolutionService {
  private evolutionClient: EvolutionAPIClient;
  private statusCache: EvolutionStatusCache;

  constructor(
    private kvStore: KVNamespace,
    cacheConfig?: Partial<StatusCacheConfig>,
    apiKey?: string,
    apiHost?: string
  ) {
    this.evolutionClient = getEvolutionAPIClient(apiKey, apiHost);
    this.statusCache = createStatusCache(kvStore, cacheConfig);
  }

  /**
   * Instance Management with Caching
   */
  async createInstance(instanceName: string, token?: string): Promise<InstanceCreateResponse> {
    try {
      const result = await withRetry(
        () => this.evolutionClient.createInstance(instanceName, token),
        'instance',
        instanceName
      );

      // Initialize cache entry for new instance
      await this.statusCache.updateInstanceStatus(instanceName, 'close', {
        connectionInfo: {
          lastSeen: Date.now()
        }
      });

      return result;
    } catch (error) {
      console.error('Failed to create instance after retries:', error);
      throw error;
    }
  }

  async getInstanceStatus(instanceName: string, forceRefresh = false): Promise<CachedInstanceStatus> {
    try {
      const result = await withRetry(
        () => this.statusCache.getInstanceStatus(instanceName, forceRefresh),
        'instance',
        instanceName
      );
      return result;
    } catch (error) {
      console.error('Failed to get instance status after retries:', error);
      throw error;
    }
  }

  async getInstanceQRCode(instanceName: string, forceRefresh = false): Promise<string | null> {
    try {
      const result = await withRetry(
        () => this.statusCache.getInstanceQRCode(instanceName, forceRefresh),
        'qrcode',
        instanceName
      );
      return result;
    } catch (error) {
      console.error('Failed to get QR code after retries:', error);
      throw error;
    }
  }

  async connectInstance(instanceName: string): Promise<InstanceConnectionResponse> {
    try {
      const result = await withRetry(
        () => this.evolutionClient.connectInstance(instanceName),
        'connection',
        instanceName
      );

      // Update cache to connecting status
      await this.statusCache.updateInstanceStatus(instanceName, 'connecting');
      return result;
    } catch (error) {
      console.error('Failed to connect instance after retries:', error);
      // Update cache to reflect connection failure
      await this.statusCache.updateInstanceStatus(instanceName, 'close');
      throw error;
    }
  }

  async disconnectInstance(instanceName: string): Promise<InstanceConnectionResponse> {
    try {
      const result = await withRetry(
        () => this.evolutionClient.disconnectInstance(instanceName),
        'connection',
        instanceName
      );

      // Update cache to disconnected status
      await this.statusCache.updateInstanceStatus(instanceName, 'close');
      return result;
    } catch (error) {
      console.error('Failed to disconnect instance after retries:', error);
      throw error;
    }
  }

  async deleteInstance(instanceName: string): Promise<InstanceDeleteResponse> {
    try {
      const result = await this.evolutionClient.deleteInstance(instanceName);
      
      // Remove from cache completely
      await this.statusCache.invalidateInstanceCache(instanceName);
      return result;
    } catch (error) {
      console.error('Failed to delete instance:', error);
      throw error;
    }
  }

  /**
   * Messaging (direct pass-through)
   */
  async sendTextMessage(instanceId: string, jid: string, text: string): Promise<MessageSendResponse> {
    try {
      const result = await withRetry(
        () => this.evolutionClient.sendTextMessage(instanceId, jid, text),
        'messaging',
        instanceId
      );
      return result;
    } catch (error) {
      console.error('Failed to send text message after retries:', error);
      throw error;
    }
  }

  async sendMediaMessage(instanceId: string, jid: string, media: MediaMessageData): Promise<MessageSendResponse> {
    try {
      const result = await withRetry(
        () => this.evolutionClient.sendMediaMessage(instanceId, jid, media),
        'messaging',
        instanceId
      );
      return result;
    } catch (error) {
      console.error('Failed to send media message after retries:', error);
      throw error;
    }
  }

  /**
   * Webhook Management
   */
  async setWebhook(instanceName: string, webhookUrl: string): Promise<WebhookSetResponse> {
    return this.evolutionClient.setWebhook(instanceName, webhookUrl);
  }

  async handleWebhookUpdate(webhookData: Record<string, unknown>): Promise<void> {
    await updateCacheFromWebhook(this.statusCache, webhookData);
  }

  /**
   * Cache Management
   */
  async invalidateCache(instanceName: string): Promise<void> {
    await this.statusCache.invalidateInstanceCache(instanceName);
  }

  async getCacheStats(): Promise<CacheStats> {
    return this.statusCache.getCacheStats();
  }

  /**
   * Get retry system metrics and health status
   */
  getRetryMetrics(): {
    metrics: Record<string, RetryMetrics>;
    circuitBreakers: Record<string, string>;
    healthStatus: 'healthy' | 'degraded' | 'unhealthy';
  } {
    const metrics = globalRetryManager.getMetrics();
    const circuitBreakers = globalRetryManager.getCircuitBreakerStates();

    // Determine health status
    let healthStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    const openCircuitBreakers = Object.values(circuitBreakers).filter(
      (state) => state === 'OPEN'
    ).length;
    
    const totalOperations = Object.values(metrics).reduce(
      (sum: number, m: RetryMetrics) => sum + m.totalAttempts,
      0
    );
    
    const failedOperations = Object.values(metrics).reduce(
      (sum: number, m: RetryMetrics) => sum + m.failedAttempts,
      0
    );

    if (openCircuitBreakers > 0) {
      healthStatus = 'unhealthy';
    } else if (totalOperations > 0 && failedOperations / totalOperations > 0.1) {
      healthStatus = 'degraded';
    }

    return {
      metrics,
      circuitBreakers,
      healthStatus
    };
  }

  /**
   * Reset retry system (for testing or manual intervention)
   */
  resetRetrySystem(): void {
    globalRetryManager.resetCircuitBreakers();
    globalRetryManager.resetMetrics();
  }

  async cleanupExpiredCache(): Promise<number> {
    return this.statusCache.cleanupExpiredCache();
  }

  async getAllCachedInstances(): Promise<CachedInstanceStatus[]> {
    return this.statusCache.getAllCachedInstances();
  }

  /**
   * Bulk Operations - OTIMIZADO para processamento paralelo
   * Complexidade: O(1) em termos de tempo de espera (era O(n) sequencial)
   */
  async refreshAllInstanceStatus(): Promise<CachedInstanceStatus[]> {
    const cachedInstances = await this.getAllCachedInstances();
    
    if (cachedInstances.length === 0) {
      return [];
    }

    // OTIMIZAÇÃO: Processamento paralelo com Promise.allSettled()
    const refreshPromises = cachedInstances.map(instance => 
      withRetry(
        () => this.getInstanceStatus(instance.instanceName, true),
        'instance',
        instance.instanceName
      ).catch(error => {
        console.error(
          `Failed to refresh status for ${instance.instanceName} after retries:`,
          error
        );
        // Keep the cached version if refresh fails
        return instance;
      })
    );

    const results = await Promise.allSettled(refreshPromises);
    
    // Filtra apenas os resultados bem-sucedidos
    const refreshedInstances: CachedInstanceStatus[] = results
      .filter((result): result is PromiseFulfilledResult<CachedInstanceStatus> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);

    return refreshedInstances;
  }
}

/**
 * Factory to create cached Evolution API service
 */
export function createCachedEvolutionService(
  kvStore: KVNamespace,
  cacheConfig?: Partial<StatusCacheConfig>,
  apiKey?: string,
  apiHost?: string
): CachedEvolutionService {
  return new CachedEvolutionServiceImpl(kvStore, cacheConfig, apiKey, apiHost);
}

/**
 * Middleware for automatic cache updates from webhooks
 */
export async function handleEvolutionWebhook(
  service: CachedEvolutionService,
  webhookData: Record<string, unknown>
): Promise<void> {
  // Update cache based on webhook data
  await service.handleWebhookUpdate(webhookData);
}

/**
 * Scheduled task for cache cleanup
 */
export async function scheduledCacheCleanup(
  service: CachedEvolutionService
): Promise<{ cleaned: number; total: number }> {
  const [cleaned, stats] = await Promise.all([
    service.cleanupExpiredCache(),
    service.getCacheStats()
  ]);
  
  return {
    cleaned,
    total: stats.totalEntries
  };
}

/**
 * Health check for Evolution API service
 */
export async function healthCheckEvolutionService(
  service: CachedEvolutionService
): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  cache: CacheStats;
  retryMetrics: RetryMetrics;
  circuitBreakers: Record<string, string>;
}> {
  const [cacheStats, retryData] = await Promise.all([
    service.getCacheStats(),
    Promise.resolve(service.getRetryMetrics())
  ]);

  // Determine overall health status
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (retryData.healthStatus === 'unhealthy') {
    overallStatus = 'unhealthy';
  } else if (retryData.healthStatus === 'degraded' || cacheStats.hitRate < 0.5) {
    overallStatus = 'degraded';
  }

  return {
    status: overallStatus,
    cache: cacheStats,
    retryMetrics: Object.values(retryData.metrics)[0] || {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      averageRetryTime: 0,
      circuitBreakerTrips: 0
    },
    circuitBreakers: retryData.circuitBreakers
  };
}