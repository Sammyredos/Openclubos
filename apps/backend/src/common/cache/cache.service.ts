import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Injectable, Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const val = await this.cacheManager.get<T>(key);
      return val !== undefined ? val : null;
    } catch (err) {
      console.error(`[CacheService.get] Error reading key "${key}":`, err);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      // Convert TTL from seconds to milliseconds for cache-manager v5 / ioredis-yet
      const ttlMs = ttl ? ttl * 1000 : undefined;
      await this.cacheManager.set(key, value, ttlMs);
    } catch (err) {
      console.error(`[CacheService.set] Error setting key "${key}":`, err);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (err) {
      console.error(`[CacheService.del] Error deleting key "${key}":`, err);
    }
  }

  async reset(): Promise<void> {
    try {
      await this.cacheManager.clear();
    } catch (err) {
      console.error('[CacheService.reset] Error resetting cache:', err);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keyv = this.cacheManager.stores?.[0];
      if (keyv) {
        const store = (keyv as any).store || (keyv as any).opts?.store || keyv;

        let keys: string[] = [];
        if (typeof store.keys === 'function') {
          keys = await store.keys(pattern);
        } else {
          const client =
            store.client ||
            store.redis ||
            (store.opts && (store.opts.client || store.opts.redis));
          if (client && typeof client.keys === 'function') {
            keys = await client.keys(pattern);
          }
        }

        if (keys && keys.length > 0) {
          await Promise.all(
            keys.map((key: string) => this.cacheManager.del(key)),
          );
        }
      }
    } catch (err) {
      console.error(
        `[CacheService.invalidatePattern] Error invalidating pattern "${pattern}":`,
        err,
      );
    }
  }
}
