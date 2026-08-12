import Redis from 'ioredis';

let client: Redis | null = null;
let isRedisAvailable = true;

function getRedisClient(): Redis | null {
  if (!isRedisAvailable) return null;
  
  if (!client) {
    try {
      client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0'),
        lazyConnect: true,
        retryStrategy: (times) => {
          if (times > 3) {
            isRedisAvailable = false;
            console.warn('⚠️ Redis unavailable – caching disabled. API continues normally.');
            return null;
          }
          return Math.min(times * 100, 2000);
        },
      });

      client.on('error', (err) => {
        if (err.code === 'ECONNREFUSED') {
          isRedisAvailable = false;
          console.warn('⚠️ Redis connection refused – caching disabled.');
        }
      });

      // Try to connect once
      client.connect().catch(() => {
        isRedisAvailable = false;
        console.warn('⚠️ Redis connection failed – caching disabled.');
      });
    } catch (_) {
      isRedisAvailable = false;
      console.warn('⚠️ Redis unavailable – caching disabled.');
      return null;
    }
  }
  return client;
}

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const redis = getRedisClient();
    if (!redis) return null;
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch {}
  },

  async del(key: string): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;
    try {
      await redis.del(key);
    } catch {}
  },

  async invalidatePattern(pattern: string): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) await redis.del(...keys);
    } catch {}
  },
};