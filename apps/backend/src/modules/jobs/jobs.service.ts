import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class JobsService implements OnModuleInit {
  constructor(@InjectQueue('background-jobs') private readonly queue: Queue) {}

  async onModuleInit() {
    try {
      // Register/Update repeatable job for tournament updates every 5 minutes
      await this.queue.add(
        'AUTO_UPDATE_TOURNAMENTS',
        {},
        {
          repeat: {
            pattern: '*/5 * * * *',
          },
          jobId: 'auto-update-tournaments',
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
    } catch (err) {
      console.error('[JobsService] Failed to schedule repeatable job:', err);
    }
  }
}
