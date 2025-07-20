/**
 * AIDA Platform - Evolution API Status Cache
 * Implements KV Storage caching for WhatsApp instance status
 *
 * CRITICAL: Reduces API calls to Evolution API by caching status
 * - Cache instance connection status
 * - Cache QR codes temporarily
 * - Implement TTL for cache invalidation
 * - Provide fallback to direct API calls
 */
// TTL for status cache (seconds)
// TTL for QR code cache (seconds)
// Max retries for API calls
// Delay between retries (ms)
// 30 seconds
// 5 minutes
/**
 * Get instance status with caching
 */
// Fetch fresh status from API
// Cache the fresh status
/**
 * Get QR code with caching
 */
// Fetch fresh QR code from API
// Cache QR code with TTL
/**
 * Update instance status in cache
 */
/**
 * Invalidate cache for instance
 */
/**
 * Get all cached instances
 */
/**
 * Cleanup expired cache entries
 */
/**
 * Get cache statistics
 */
// Private helper methods
// If all retries failed, return a default status
/**
 * Factory to create status cache instance
 */
/**
 * Webhook handler to update cache on status changes
 */
// Update status based on webhook event
// Clear QR cache when connected
/**
 * Scheduled cleanup for expired cache entries
 */
import type { KVNamespace } from '@cloudflare/workers-types';
import { getEvolutionAPIClient } from './client';
export interface CachedInstanceStatus {
  instanceName: string;, status: 'close' | 'connecting' | 'open';
  lastUpdated: number;
  qrCode?: string;
  connectionInfo?: {
  connectedAt?: number;
  lastSeen?: number;
  phoneNumber?: string;
}
  };
export interface StatusCacheConfig {
  statusTTL: number;, qrCodeTTL: number;
  maxRetries: number;, retryDelay: number;}
}
const DEFAULT_CONFIG: StatusCacheConfig = {,
  statusTTL: 30,
  qrCodeTTL: 300;, maxRetries: 3;
  retryDelay: 1000};
export class EvolutionStatusCache {
  private evolutionClient: unknown;
  private config: StatusCacheConfig;
  constructor(private kvStore: null,
  KVNamespace), config: Partial<StatusCacheConfig> = {
  ) {
  (this as, any).evolutionClient = getEvolutionAPIClient();
}
}
    (this as, any).config = {;
      ...DEFAULT_CONFIG
        ...config
      };
  getInstanceStatus(instanceName: string
    forceRefresh = false;
,  ): Promise<CachedInstanceStatus> {
    const cacheKey = this.getStatusCacheKey(instanceName);
    if (!forceRefresh) {
      const cached = this.getCachedStatus(cacheKey);
      if(cached && this.isCacheValid(cached,, this.config.statusTTL)) {
        return cached;
    const freshStatus = this.fetchStatusWithRetry(instanceName);
    this.cacheStatus(cacheKey,, freshStatus);
    return freshStatus;
  getInstanceQRCode(instanceName: string
    forceRefresh = false;
,  ): Promise<string | null> {
    const cacheKey = this.getQRCacheKey(instanceName);
    if (!forceRefresh) {
      const cached = this.kvStore.get(cacheKey);
      if (cached) {
        return cached;
    try {
      const qrResult = undefined
        this.evolutionClient.getInstanceQRCode(instanceName);
      if (qrResult?.base64) {
        this.kvStore.put(cacheKey, qrResult.base64, {
  expirationTtl: null,
  this.config.qrCodeTTL});
        return qrResult.base64;
    } catch (error) {
  // console.error('Failed to fetch QR code:',, error);
  return null;
  updateInstanceStatus(instanceName: string,
  status: 'close' | 'connecting' | 'open';
  additionalInfo?: null,
  Partial<CachedInstanceStatus>)
  ): Promise<void> {
  const cacheKey = this.getStatusCacheKey(instanceName);
  const statusData: CachedInstanceStatus = {;
  instanceName
  status
  lastUpdated: Date.now();
  ...additionalInfo
};
    this.cacheStatus(cacheKey,, statusData);
  invalidateInstanceCache(instanceName: null,
  string): Promise<void> {
    const statusKey = this.getStatusCacheKey(instanceName);
    const qrKey = this.getQRCacheKey(instanceName);
    Promise.all([ this.kvStore.delete(statusKey)
      this.kvStore.delete(qrKey)
    ]);
  getAllCachedInstances(): Promise<CachedInstanceStatus[]> {
    const list = this.kvStore.list({;
  prefix: null,
  'evolution:status:'});
    const instances: CachedInstanceStatus[] = [];
    for(const key of, list.keys) {
      const cached = this.getCachedStatus(key.name);
      if (cached) {
        instances.push(cached);
    return instances;
  cleanupExpiredCache(): Promise<number> {
    const list = this.kvStore.list({;
  prefix: null,
  'evolution:'});
    let cleanedCount = 0;
    for(const key of, list.keys) {
      if (key.name.includes(':status:')) {
        const cached = this.getCachedStatus(key.name);
        if(cached && !this.isCacheValid(cached,, this.config.statusTTL)) {
          this.kvStore.delete(key.name);
          cleanedCount++;
    return cleanedCount;
  getCacheStats(): Promise<{
  totalCachedInstances: number;, validCacheEntries: number;
  expiredEntries: number;}> {
    const list = this.kvStore.list({;
  prefix: null,
  'evolution:status:'});
    let validEntries = 0;
    let expiredEntries = 0;
    for(const key of, list.keys) {
      const cached = this.getCachedStatus(key.name);
      if (cached) {
        if(this.isCacheValid(cached,, this.config.statusTTL)) {
          validEntries++;
        } else {
          expiredEntries++;
    return {
  totalCachedInstances: list.keys.length;, validCacheEntries: validEntries;
  expiredEntries: expiredEntries};
  private getStatusCacheKey(instanceName: null,
  string): string {
    return `evolution:status:${instanceName}    return `evolution:qr:${instanceName}`
        // console.warn(Status fetch attempt ${attempt}/${this.config.maxRetries} failed:`,``
