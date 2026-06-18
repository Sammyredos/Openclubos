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

      await this.queue.add(
        'SEND_TOURNAMENT_REMINDERS',
        {},
        {
          repeat: {
            pattern: '0 9 * * *',
          },
          jobId: 'send-tournament-reminders',
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
      this.logger.log('Repeatable job SEND_TOURNAMENT_REMINDERS registered successfully.');

      await this.queue.add(
        'DATA_RETENTION_CLEANUP',
        {},
        {
          repeat: {
            pattern: '0 2 * * *', // Run every day at 2:00 AM
          },
          jobId: 'data-retention-cleanup',
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
      this.logger.log('Repeatable job DATA_RETENTION_CLEANUP registered successfully.');
    } catch (err) {
      this.logger.error(`Failed to schedule repeatable job: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Enqueues an email sending job into the background-jobs queue.
   *
   * @param template Template name matching a case in JobsProcessor.dispatchEmail()
   * @param to Recipient email address
   * @param data Payload data for the selected email template
   */
  async queueEmail(template: string, to: string, data: Record<string, any> = {}) {
    this.logger.log(`Enqueuing SEND_EMAIL job (template=${template}, to=${to})`);
    try {
      const job = await this.queue.add(
        'SEND_EMAIL',
        { template, to, data },
        {
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
      this.logger.log(`SEND_EMAIL job enqueued successfully with ID: ${job.id}`);
      return job;
    } catch (err: any) {
      this.logger.error(`Failed to enqueue SEND_EMAIL job: ${err.message}`);
      throw err;
    }
  }

  /**
   * Enqueues multiple email sending jobs in bulk into the background-jobs queue.
   */
  async queueEmailBulk(jobs: { name: string, data: { template: string, to: string, data?: Record<string, any> } }[]) {
    this.logger.log(`Enqueuing ${jobs.length} SEND_EMAIL jobs in bulk`);
    try {
      const bullJobs = jobs.map(j => ({
        name: j.name,
        data: j.data,
        opts: {
          removeOnComplete: true,
          removeOnFail: false,
        }
      }));
      await this.queue.addBulk(bullJobs);
      this.logger.log(`Successfully enqueued ${jobs.length} SEND_EMAIL jobs in bulk`);
    } catch (err: any) {
      this.logger.error(`Failed to enqueue bulk SEND_EMAIL jobs: ${err.message}`);
      throw err;
    }
  }
}
