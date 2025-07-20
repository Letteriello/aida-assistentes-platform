import Redis from 'ioredis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  layer?: 'memory' | 'redis' | 'database';
  compress?: boolean;
}

export class CacheManager {
  private redis: Redis;
  private memoryCache = new Map<string, { data: any; expires: number }>();
  private maxMemoryItems = 1000;

  constructor() {
    // Configure Redis connection
    const redisOptions: any = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: parseInt(process.env.REDIS_DB || '0'),
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true, // Connect only when needed
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000
    };

    // Add password if provided
    if (process.env.REDIS_PASSWORD) {
      redisOptions.password = process.env.REDIS_PASSWORD;
    }

    // Use Redis URL if provided (overrides individual settings)
    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000
      });
    } else {
      this.redis = new Redis(redisOptions);
    }

    // Setup Redis event handlers
    this.setupRedisEventHandlers();
    
    // Cleanup memory cache periodically
    setInterval(() => this.cleanupMemoryCache(), 60000); // Every minute
  }

  private setupRedisEventHandlers() {
    this.redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    this.redis.on('ready', () => {
      console.log('🚀 Redis ready to receive commands');
    });

    this.redis.on('error', (error) => {
      console.error('❌ Redis connection error:', error.message);
    });

    this.redis.on('close', () => {
      console.warn('⚠️ Redis connection closed');
    });

    this.redis.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    this.redis.on('end', () => {
      console.log('🔌 Redis connection ended');
    });
  }

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const { layer = 'redis' } = options;
    
    // Try memory cache first (fastest)
    if (layer === 'memory' || layer === 'redis') {
      const memoryResult = this.memoryCache.get(key);
      if (memoryResult && memoryResult.expires > Date.now()) {
        return memoryResult.data as T;
      }
    }
    
    // Try Redis (fast)
    if (layer === 'redis') {
      try {
        const redisResult = await this.redis.get(key);
        if (redisResult) {
          const data = JSON.parse(redisResult) as T;
          
          // Store in memory cache for next time
          this.setMemoryCache(key, data, options.ttl || 3600);
          
          return data;
        }
      } catch (error) {
        console.error('Redis cache error:', error);
      }
    }
    
    return null;
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const { ttl = 3600, layer = 'redis', compress = false } = options;
    
    // Store in memory cache
    if (layer === 'memory' || layer === 'redis') {
      this.setMemoryCache(key, value, ttl);
    }
    
    // Store in Redis
    if (layer === 'redis') {
      try {
        let serialized = JSON.stringify(value);
        
        if (compress && serialized.length > 1024) {
          // Implement compression if needed
          // serialized = await this.compress(serialized);
        }
        
        await this.redis.setex(key, ttl, serialized);
      } catch (error) {
        console.error('Redis cache set error:', error);
      }
    }
  }

  async invalidate(pattern: string): Promise<void> {
    // Clear memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }
    
    // Clear Redis cache
    try {
      const keys = await this.redis.keys(`*${pattern}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis cache invalidation error:', error);
    }
  }

  private setMemoryCache<T>(key: string, value: T, ttl: number): void {
    // Remove oldest items if cache is full
    if (this.memoryCache.size >= this.maxMemoryItems) {
      const oldestKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(oldestKey);
    }
    
    this.memoryCache.set(key, {
      data: value,
      expires: Date.now() + (ttl * 1000)
    });
  }

  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, value] of this.memoryCache.entries()) {
      if (value.expires <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  // Specific cache methods for common use cases
  async cacheEmbedding(text: string, embedding: number[], ttl = 86400): Promise<void> {
    const key = `embedding:${this.hashText(text)}`;
    await this.set(key, embedding, { ttl, layer: 'redis' });
  }

  async getCachedEmbedding(text: string): Promise<number[] | null> {
    const key = `embedding:${this.hashText(text)}`;
    return this.get<number[]>(key);
  }

  async cacheRAGResult(query: string, businessId: string, result: any, ttl = 3600): Promise<void> {
    const key = `rag:${businessId}:${this.hashText(query)}`;
    await this.set(key, result, { ttl, layer: 'redis' });
  }

  async getCachedRAGResult(query: string, businessId: string): Promise<any | null> {
    const key = `rag:${businessId}:${this.hashText(query)}`;
    return this.get(key);
  }

  private hashText(text: string): string {
    // Simple hash function for cache keys
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}