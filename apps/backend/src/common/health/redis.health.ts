import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { createClient } from 'redis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const redisUrl =
      process.env.CACHE_REDIS_URL ||
      process.env.REDIS_URL ||
      'redis://127.0.0.1:6379';
    try {
      const client = createClient({ url: redisUrl });
      await client.connect();
      await client.ping();
      await client.disconnect();
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        'Redis cache health check failed',
        this.getStatus(key, false, { message: (error as Error).message }),
      );
    }
  }
}
