import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JobsService } from './jobs.service';
import { JobsProcessor } from './jobs.processor';
import { TournamentsModule } from '../tournaments/tournaments.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
        try {
          const parsed = new URL(redisUrl);
          return {
            connection: {
              host: parsed.hostname,
              port: parsed.port ? parseInt(parsed.port, 10) : 6379,
              username: parsed.username || undefined,
              password: parsed.password || undefined,
              db: parsed.pathname ? parseInt(parsed.pathname.substring(1), 10) : undefined,
            },
          };
        } catch {
          return {
            connection: {
              host: 'localhost',
              port: 6379,
            },
          };
        }
      },
    }),
    BullModule.registerQueue({
      name: 'background-jobs',
    }),
    TournamentsModule,
  ],
  providers: [JobsService, JobsProcessor],
  exports: [BullModule, JobsService],
})
export class JobsModule {}
// Force IDE cache refresh
