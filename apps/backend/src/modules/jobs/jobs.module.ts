import { BullModule } from '@nestjs/bullmq';
import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { EmailModule } from '../email/email.module';
import { ScoresModule } from '../scores/scores.module';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { JobsProcessor } from './jobs.processor.js';
import { JobsService } from './jobs.service.js';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const sentinelsEnv = configService.get<string>('QUEUE_REDIS_SENTINELS');
        const sentinelMaster = configService.get<string>('QUEUE_REDIS_SENTINEL_MASTER') || 'mymaster';

        if (sentinelsEnv) {
          const sentinels = sentinelsEnv.split(',').map((s) => {
            const [host, port] = s.trim().split(':');
            return { host, port: parseInt(port || '26379', 10) };
          });
          return {
            connection: {
              name: sentinelMaster,
              sentinels,
              password: configService.get<string>('QUEUE_REDIS_PASSWORD') || undefined,
              maxRetriesPerRequest: null,
              enableReadyCheck: false,
              retryStrategy: (times: number) => Math.min(times * 100, 3000),
              reconnectOnError: () => true,
            },
          };
        }

        const redisUrl =
          configService.get<string>('QUEUE_REDIS_URL') ||
          configService.get<string>('REDIS_URL') ||
          'redis://localhost:6380';
        try {
          const parsed = new URL(redisUrl);
          return {
            connection: {
              host: parsed.hostname,
              port: parsed.port ? parseInt(parsed.port, 10) : 6379,
              username: parsed.username || undefined,
              password: parsed.password || undefined,
              db: parsed.pathname
                ? parseInt(parsed.pathname.substring(1), 10)
                : undefined,
              maxRetriesPerRequest: null,
              enableReadyCheck: false,
              retryStrategy: (times: number) => Math.min(times * 100, 3000),
              reconnectOnError: () => true,
            },
          };
        } catch {
          return {
            connection: {
              host: 'localhost',
              port: 6380,
              maxRetriesPerRequest: null,
              enableReadyCheck: false,
              retryStrategy: (times: number) => Math.min(times * 100, 3000),
              reconnectOnError: () => true,
            },
          };
        }
      },
    }),
    BullModule.registerQueue({
      name: 'background-jobs',
    }),
    BullBoardModule.forFeature(
      {
        name: 'background-jobs',
        adapter: BullMQAdapter,
      },
      {
        name: 'webhooks',
        adapter: BullMQAdapter,
      },
    ),
    forwardRef(() => TournamentsModule),
    forwardRef(() => ScoresModule),
    EmailModule,
  ],
  providers: [JobsService, JobsProcessor],
  exports: [BullModule, JobsService],
})
export class JobsModule {}
