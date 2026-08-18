import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { QueueHealthIndicator } from '../../common/health/queue.health';
import { RedisHealthIndicator } from '../../common/health/redis.health';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly queueHealth: QueueHealthIndicator,
    private readonly redisHealth: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.queueHealth.isHealthy('redis_queue'),
      () => this.redisHealth.isHealthy('redis_cache'),
    ]);
  }

  @Get('ping')
  ping() {
    return 'ok';
  }
}
