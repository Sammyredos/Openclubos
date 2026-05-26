import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { TournamentsService } from '../tournaments/tournaments.service';
import { EmailService } from '../email/email.service';

export interface SendEmailJobPayload {
  type: 'REMINDER' | 'REGISTRATION' | 'PAYMENT';
  to: string;
  data: {
    tournamentName?: string;
    startDate?: string;
    status?: string;
    amount?: number;
    reference?: string;
    [key: string]: any;
  };
}

@Processor('background-jobs')
export class JobsProcessor extends WorkerHost {
  private readonly logger = new Logger(JobsProcessor.name);

  constructor(
    @Inject(forwardRef(() => TournamentsService))
    private readonly tournamentsService: TournamentsService,
    private readonly emailService: EmailService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Starting job ${job.name} (ID: ${job.id})`);
    try {
      switch (job.name) {
        case 'AUTO_UPDATE_TOURNAMENTS':
          await this.tournamentsService.autoUpdateStatuses();
          this.logger.log(`Completed job AUTO_UPDATE_TOURNAMENTS (ID: ${job.id}) successfully`);
          break;

        case 'SEND_EMAIL': {
          const payload = job.data as SendEmailJobPayload;
          const { type, to, data } = payload;
          this.logger.log(`Processing email job ${type} to ${to} (ID: ${job.id})`);

          let result;
          if (type === 'REMINDER') {
            result = await this.emailService.sendTournamentReminder(
              to,
              data.tournamentName || 'Tournament',
              data.startDate || new Date().toISOString(),
            );
          } else if (type === 'REGISTRATION') {
            result = await this.emailService.sendRegistrationConfirmation(
              to,
              data.tournamentName || 'Tournament',
              data.status || 'APPROVED',
            );
          } else if (type === 'PAYMENT') {
            result = await this.emailService.sendPaymentReceipt(
              to,
              data.amount || 0,
              data.tournamentName || 'Tournament',
              data.reference || `REF-${Date.now()}`,
            );
          } else {
            throw new Error(`Unsupported email type: ${type}`);
          }

          this.logger.log(
            `Completed email job ${type} to ${to} successfully (ID: ${job.id}) | Message ID: ${result.messageId}`,
          );
          return result;
        }

        default:
          throw new Error(`Unknown job name: ${job.name}`);
      }
    } catch (error: any) {
      this.logger.error(
        `Failed executing job ${job.name} (ID: ${job.id}): ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
