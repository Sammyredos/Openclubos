import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class JobsService implements OnModuleInit {
  private readonly logger = new Logger(JobsService.name);

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
      this.logger.log('Repeatable job AUTO_UPDATE_TOURNAMENTS registered successfully.');
    } catch (err) {
      this.logger.error('Failed to schedule repeatable job:', err);
    }
  }

  /**
   * Enqueues an email sending job into the background-jobs queue.
   * 
   * @param type 'REMINDER' | 'REGISTRATION' | 'PAYMENT'
   * @param to The recipient's email address
   * @param data The payload data for the selected email template
   */
  async queueEmail(
    type: 'REMINDER' | 'REGISTRATION' | 'PAYMENT',
    to: string,
    data: {
      tournamentName?: string;
      startDate?: string;
      status?: string;
      amount?: number;
      reference?: string;
      [key: string]: any;
    },
  ) {
    this.logger.log(`Enqueuing SEND_EMAIL job (Type: ${type}, Recipient: ${to})`);
    try {
      const job = await this.queue.add(
        'SEND_EMAIL',
        { type, to, data },
        {
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
      this.logger.log(`SEND_EMAIL job enqueued successfully with ID: ${job.id}`);
      return job;
    } catch (err: any) {
      this.logger.error(`Failed to enqueue SEND_EMAIL job: ${err.message}`, err.stack);
      throw err;
    }
  }
}
