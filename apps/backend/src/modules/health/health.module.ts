import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { QueueHealthIndicator } from '../../common/health/queue.health';
import { JobsModule } from '../jobs/jobs.module';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, JobsModule],
  controllers: [HealthController],
  providers: [QueueHealthIndicator],
})
export class HealthModule {}
