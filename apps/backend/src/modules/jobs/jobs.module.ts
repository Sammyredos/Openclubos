import { BullModule } from '@nestjs/bullmq';
import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailModule } from '../email/email.module';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { JobsProcessor } from './jobs.processor.js';
import { JobsService } from './jobs.service.js';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl =
          configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
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
    forwardRef(() => TournamentsModule),
    EmailModule,
  ],
  providers: [JobsService, JobsProcessor],
  exports: [BullModule, JobsService],
})
export class JobsModule {}
