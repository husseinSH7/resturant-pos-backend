import { Redis } from '@upstash/redis';

let client: Redis | null = null;
let isRedisAvailable = true;

function getRedisClient(): Redis | null {
  if (!isRedisAvailable) return null;

  if (!client) {
    try {
      const url = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (!url || !token) {
        console.warn('⚠️ Upstash Redis credentials missing – caching disabled.');
        isRedisAvailable = false;
        return null;
      }

      client = new Redis({
        url,
        token,
        retry: {
          retries: 3,
          backoff: (retryCount) => Math.min(retryCount * 100, 2000),
        },
      });
    } catch (_) {
      isRedisAvailable = false;
      console.warn('⚠️ Upstash Redis setup failed – caching disabled.');
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
      return data ? (data as T) : null;
    } catch {
      return null;
    }
  },

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;
    try {
      await redis.set(key, value, { ex: ttlSeconds });
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