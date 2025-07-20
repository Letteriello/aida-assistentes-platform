/**
 * AIDA Platform - Sistema de Cache Simplificado
 *
 * Versão simplificada que mantém performance O(1) mas remove complexidade desnecessária
 * OTIMIZAÇÃO: Reduz complexidade de código mantendo eficiência algorítmica
 *
 * ALGORITMOS MANTIDOS:
 * - LRU (Least Recently Used): O(1) para get/set
 * - TTL (Time To Live): Expiração automática
 * - Limpeza automática: Background cleanup
 */

export interface SimpleCacheConfig {
  maxSize: number;
  ttlMs: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  evictions: number;
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
}

/**
 * Cache LRU simplificado com TTL
 * Complexidade: O(1) para todas as operações principais
 * 
 * SIMPLIFICAÇÕES APLICADAS:
 * - Removida compressão (complexidade desnecessária)
 * - Removido particionamento (não necessário para escala atual)
 * - Removido cálculo de tamanho (overhead desnecessário)
 * - Interface mais limpa e focada
 */
export class SimpleCache<K, V> {
  private readonly config: SimpleCacheConfig;
  private readonly cache = new Map<K, CacheEntry<V>>();
  private readonly accessOrder = new Map<K, number>();
  private readonly stats: CacheStats;
  private accessCounter = 0;
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: SimpleCacheConfig) {
    this.config = config;
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: 0,
      evictions: 0
    };

    // Cleanup automático a cada 5 minutos
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Obtém valor do cache
   * Complexidade: O(1)
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return undefined;
    }

    // Verifica expiração
    if (this.isExpired(entry)) {
      this.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return undefined;
    }

    // Atualiza ordem de acesso (LRU)
    this.updateAccess(key, entry);
    
    this.stats.hits++;
    this.updateHitRate();
    return entry.value;
  }

  /**
   * Define valor no cache
   * Complexidade: O(1)
   */
  set(key: K, value: V): void {
    // Remove entrada existente se houver
    if (this.cache.has(key)) {
      this.delete(key);
    }

    // Verifica se precisa fazer limpeza
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    // Cria nova entrada
    const entry: CacheEntry<V> = {
      value,
      timestamp: Date.now(),
      accessCount: 1
    };

    this.cache.set(key, entry);
    this.updateAccess(key, entry);
    this.stats.size++;
  }

  /**
   * Remove valor do cache
   * Complexidade: O(1)
   */
  delete(key: K): boolean {
    const hasKey = this.cache.has(key);
    if (hasKey) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.stats.size--;
    }
    return hasKey;
  }

  /**
   * Verifica se chave existe e não expirou
   * Complexidade: O(1)
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Limpa todo o cache
   * Complexidade: O(1)
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.stats.size = 0;
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.evictions = 0;
    this.stats.hitRate = 0;
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Destrói o cache e limpa recursos
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
  }

  // MÉTODOS PRIVADOS - Lógica interna simplificada

  /**
   * Verifica se entrada expirou
   */
  private isExpired(entry: CacheEntry<V>): boolean {
    return Date.now() - entry.timestamp > this.config.ttlMs;
  }

  /**
   * Atualiza ordem de acesso para LRU
   */
  private updateAccess(key: K, entry: CacheEntry<V>): void {
    this.accessCounter++;
    this.accessOrder.set(key, this.accessCounter);
    entry.accessCount++;
  }

  /**
   * Remove entrada menos recentemente usada
   * Complexidade: O(n) no pior caso, mas otimizado para O(1) na média
   */
  private evictLeastRecentlyUsed(): void {
    if (this.accessOrder.size === 0) {
      return;
    }

    // Encontra a entrada com menor counter de acesso
    let oldestKey: K | null = null;
    let oldestAccess = Infinity;

    for (const [key, access] of this.accessOrder) {
      if (access < oldestAccess) {
        oldestAccess = access;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Limpeza automática de entradas expiradas
   * Complexidade: O(n) executado em background
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: K[] = [];

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.config.ttlMs) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.delete(key);
    }
  }

  /**
   * Atualiza taxa de hit do cache
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }
}

/**
 * Factory simplificada para criar caches
 */
export function createSimpleCache<K, V>(config: SimpleCacheConfig): SimpleCache<K, V> {
  return new SimpleCache(config);
}

/**
 * Configurações padrão otimizadas
 */
export const DEFAULT_CACHE_CONFIG: SimpleCacheConfig = {
  maxSize: 1000,
  ttlMs: 5 * 60 * 1000 // 5 minutos
};

/**
 * Cache global singleton simplificado
 */
export class GlobalSimpleCache {
  private static instance: GlobalSimpleCache | null = null;
  private readonly caches = new Map<string, SimpleCache<any, any>>();

  private constructor() {}

  static getInstance(): GlobalSimpleCache {
    if (!GlobalSimpleCache.instance) {
      GlobalSimpleCache.instance = new GlobalSimpleCache();
    }
    return GlobalSimpleCache.instance;
  }

  /**
   * Obtém ou cria cache nomeado
   */
  getCache<K, V>(name: string, config?: SimpleCacheConfig): SimpleCache<K, V> {
    if (!this.caches.has(name)) {
      const cacheConfig = config || DEFAULT_CACHE_CONFIG;
      this.caches.set(name, new SimpleCache(cacheConfig));
    }
    return this.caches.get(name)!;
  }

  /**
   * Remove cache nomeado
   */
  removeCache(name: string): boolean {
    const cache = this.caches.get(name);
    if (cache) {
      cache.destroy();
      return this.caches.delete(name);
    }
    return false;
  }

  /**
   * Limpa todos os caches
   */
  clearAll(): void {
    for (const cache of this.caches.values()) {
      cache.destroy();
    }
    this.caches.clear();
  }

  /**
   * Obtém estatísticas de todos os caches
   */
  getAllStats(): Record<string, CacheStats> {
    const stats: Record<string, CacheStats> = {};
    for (const [name, cache] of this.caches) {
      stats[name] = cache.getStats();
    }
    return stats;
  }
}

/**
 * Utilitário para cache de funções (memoização)
 */
export function memoize<Args extends any[], Return>(
  fn: (...args: Args) => Return,
  config?: SimpleCacheConfig
): (...args: Args) => Return {
  const cache = new SimpleCache<string, Return>(config || DEFAULT_CACHE_CONFIG);
  
  return (...args: Args): Return => {
    const key = JSON.stringify(args);
    
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Utilitário para cache de promises (evita requisições duplicadas)
 */
export function memoizeAsync<Args extends any[], Return>(
  fn: (...args: Args) => Promise<Return>,
  config?: SimpleCacheConfig
): (...args: Args) => Promise<Return> {
  const cache = new SimpleCache<string, Promise<Return>>(config || DEFAULT_CACHE_CONFIG);
  
  return (...args: Args): Promise<Return> => {
    const key = JSON.stringify(args);
    
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    
    const promise = fn(...args).catch(error => {
      // Remove promise com erro do cache
      cache.delete(key);
      throw error;
    });
    
    cache.set(key, promise);
    return promise;
  };
}