import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { TournamentsService } from '../tournaments/tournaments.service';
import { EmailService } from '../email/email.service';

export interface SendEmailJobPayload {
  template: string;
  to: string;
  data: Record<string, any>;
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
          const { template, to, data } = job.data as SendEmailJobPayload;
          this.logger.log(`Processing email job "${template}" to ${to} (ID: ${job.id})`);
          const result = await this.dispatchEmail(template, to, data);
          this.logger.log(
            `Completed email job "${template}" to ${to} (ID: ${job.id}) | messageId=${result.messageId}`,
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

  private async dispatchEmail(template: string, to: string, data: Record<string, any>) {
    switch (template) {
      case 'emailVerification':
        return this.emailService.sendEmailVerification(to, data.firstName || 'User', data.verifyUrl);

      case 'WELCOME':
        return this.emailService.sendWelcome(to, data.firstName || 'User', data.verifyUrl);

      case 'PASSWORD_RESET':
        return this.emailService.sendPasswordReset(to, data.resetToken || '', data.resetUrl || '');

      case 'REGISTRATION':
        return this.emailService.sendRegistrationConfirmation(
          to, data.tournamentName || 'Tournament', data.status || 'APPROVED', data.startDate, data.organizerName
        );

      case 'REGISTRATION_APPROVED':
        return this.emailService.sendRegistrationApproved(to, data.tournamentName || 'Tournament', data.organizerName);

      case 'REGISTRATION_REJECTED':
        return this.emailService.sendRegistrationRejected(to, data.tournamentName || 'Tournament', data.organizerName);

      case 'WAITLIST':
        return this.emailService.sendWaitlistNotification(to, data.tournamentName || 'Tournament', data.organizerName);

      case 'PAYMENT':
        return this.emailService.sendPaymentReceipt(
          to, data.tournamentName || 'Tournament', data.amount || 0, data.currency || 'NGN', data.reference || `REF-${Date.now()}`,
        );

      case 'REMINDER':
        return this.emailService.sendTournamentReminder(
          to, data.tournamentName || 'Tournament', data.startDate || new Date().toISOString(), data.venue, data.organizerName
        );

      case 'TOURNAMENT_STARTED':
        return this.emailService.sendTournamentStarted(to, data.tournamentName || 'Tournament', data.organizerName);

      case 'TOURNAMENT_COMPLETED':
        return this.emailService.sendTournamentCompleted(to, data.tournamentName || 'Tournament', data.organizerName);

      case 'PLAYER_DISQUALIFIED':
        return this.emailService.sendPlayerDisqualified(to, data.tournamentName || 'Tournament', data.organizerName);

      case 'PLAYER_STROKE_PENALTY':
        return this.emailService.sendPlayerStrokePenalty(to, data.tournamentName || 'Tournament', data.strokes || 1, data.organizerName);

      case 'ADMIN_CREDENTIALS':
        return this.emailService.sendAdminCredentials(
          to, data.clubName || 'Club', data.email || to, data.password || '',
        );

      case 'ACCOUNT_SUSPENDED':
        return this.emailService.sendAccountSuspended(to, data.clubName || 'Club');

      case 'ACCOUNT_REACTIVATED':
        return this.emailService.sendAccountReactivated(to, data.clubName || 'Club');

      case 'MEMBER_CREATED':
        return this.emailService.sendMemberCreated(to, data.firstName || 'User', data.tempPassword || '');

      case 'SECURITY_ALERT':
        return this.emailService.sendSecurityAlert(to, data.action || 'Unknown action');

      case 'TOURNAMENT_UPDATED':
        return this.emailService.sendTournamentUpdate(to, data.tournamentName || 'Tournament', data.updateDetails, data.organizerName);

      case 'TEE_TIME_PUBLISHED':
        return this.emailService.sendTeeTimePublished(
          to, 
          data.tournamentName || 'Tournament', 
          data.roundName || 'Round 1', 
          data.teeTime || 'TBA', 
          data.groupName || 'Flight A',
          data.groupMembers || [],
          data.organizerName
        );

      case 'TOURNAMENT_CUT_PASSED':
        return this.emailService.sendTournamentCutPassed(to, data.tournamentName || 'Tournament', data.playerName || 'Player', data.organizerName);

      case 'TOURNAMENT_CUT_MISSED':
        return this.emailService.sendTournamentCutMissed(to, data.tournamentName || 'Tournament', data.playerName || 'Player', data.organizerName);

      default:
        throw new Error(`Unsupported email template: ${template}`);
    }
  }
}
