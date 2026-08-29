import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bullmq';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../common/prisma.service';
import { TraceContextService } from '../../common/services/trace-context.service';
import { EmailService } from '../email/email.service';
import { ScoresService } from '../scores/scores.service';
import { TournamentsService } from '../tournaments/tournaments.service';
import { PushNotificationService } from '../notifications/push-notification.service';

interface SendEmailJobPayload {
  template: string;
  to: string;
  data: Record<string, any>;
}

interface SendPushJobPayload {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Processor('background-jobs')
export class JobsProcessor extends WorkerHost {
  private readonly logger = new Logger(JobsProcessor.name);

  constructor(
    @Inject(forwardRef(() => TournamentsService))
    private readonly tournamentsService: TournamentsService,
    @Inject(forwardRef(() => ScoresService))
    private readonly scoresService: ScoresService,
    @Inject(forwardRef(() => PushNotificationService))
    private readonly pushNotificationService: PushNotificationService,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    const correlationId =
      job.data?._correlationId ||
      job.data?.eventId ||
      job.id ||
      randomUUID();
    const sentryTrace = job.data?._sentryTrace;

    return TraceContextService.run(
      { correlationId, sentryTrace },
      async () => {
        this.logger.log(
          `Starting job ${job.name} (ID: ${job.id}, correlationId: ${correlationId})`,
        );
        try {
          switch (job.name) {
            case 'AUTO_UPDATE_TOURNAMENTS':
              await this.tournamentsService.autoUpdateStatuses();
              this.logger.log(
                `Completed job AUTO_UPDATE_TOURNAMENTS (ID: ${job.id}) successfully`,
              );
              break;

        case 'SEND_TOURNAMENT_REMINDERS':
          await this.tournamentsService.sendTournamentReminders();
          this.logger.log(
            `Completed job SEND_TOURNAMENT_REMINDERS (ID: ${job.id}) successfully`,
          );
          break;

        case 'RECONCILE_LEADERBOARDS': {
          const ongoingTournaments = await this.prisma.tournament.findMany({
            where: { status: 'ONGOING' },
            select: { id: true, name: true },
          });
          for (const tourney of ongoingTournaments) {
            await this.scoresService.reconcileLeaderboard(tourney.id);
          }
          this.logger.log(
            `Reconciled ${ongoingTournaments.length} active tournament leaderboards from PostgreSQL (ID: ${job.id})`,
          );
          break;
        }

        case 'DATA_RETENTION_CLEANUP':
          await this.runDataRetentionCleanup();
          this.logger.log(
            `Completed job DATA_RETENTION_CLEANUP (ID: ${job.id}) successfully`,
          );
          break;

        case 'CLEANUP_EXPIRED_INVITATIONS':
          await this.purgeExpiredInvitations();
          this.logger.log(
            `Completed job CLEANUP_EXPIRED_INVITATIONS (ID: ${job.id}) successfully`,
          );
          break;

        case 'SEND_EMAIL': {
          const { template, to, data } = job.data as SendEmailJobPayload;
          this.logger.log(
            `Processing email job "${template}" to ${to} (ID: ${job.id})`,
          );
          const result = await this.dispatchEmail(template, to, data);
          this.logger.log(
            `Completed email job "${template}" to ${to} (ID: ${job.id}) | messageId=${result.messageId}`,
          );
          return result;
        }

        case 'SEND_PUSH_NOTIFICATION': {
          const { tokens, title, body, data } = job.data as SendPushJobPayload;
          this.logger.log(
            `Processing push notification job "${title}" to ${tokens.length} token(s) (ID: ${job.id})`,
          );
          const result = await this.pushNotificationService.sendPushNotification({
            tokens,
            title,
            body,
            data,
          });
          this.logger.log(
            `Completed push notification job "${title}" (ID: ${job.id}) | success=${result.successCount}, failure=${result.failureCount}`,
          );
          return result;
        }

        default:
          throw new Error(`Unknown job name: ${job.name}`);
      }
    } catch (error: any) {
      this.logger.error(
        `Failed executing job ${job.name} (ID: ${job.id}, correlationId: ${correlationId}): ${error.message}`,
        error.stack,
      );
      throw error;
    }
  },
);
  }

  private async dispatchEmail(
    template: string,
    to: string,
    data: Record<string, any>,
  ) {
    switch (template) {
      case 'emailVerification':
        return this.emailService.sendEmailVerification(
          to,
          data.firstName || 'User',
          data.verifyUrl,
        );

      case 'WELCOME':
        return this.emailService.sendWelcome(
          to,
          data.firstName || 'User',
          data.verifyUrl,
        );

      case 'PASSWORD_RESET':
        return this.emailService.sendPasswordReset(
          to,
          data.resetToken || '',
          data.resetUrl || '',
        );

      case 'REGISTRATION':
        return this.emailService.sendRegistrationConfirmation(
          to,
          data.tournamentName || 'Tournament',
          data.status || 'APPROVED',
          data.startDate,
          data.organizerName,
        );

      case 'REGISTRATION_APPROVED':
        return this.emailService.sendRegistrationApproved(
          to,
          data.tournamentName || 'Tournament',
          data.organizerName,
        );

      case 'REGISTRATION_REJECTED':
        return this.emailService.sendRegistrationRejected(
          to,
          data.tournamentName || 'Tournament',
          data.organizerName,
        );

      case 'WAITLIST':
        return this.emailService.sendWaitlistNotification(
          to,
          data.tournamentName || 'Tournament',
          data.organizerName,
        );

      case 'PAYMENT':
        return this.emailService.sendPaymentReceipt(
          to,
          data.tournamentName || 'Tournament',
          data.amount || 0,
          data.currency || 'NGN',
          data.reference || `REF-${Date.now()}`,
        );

      case 'REMINDER':
        return this.emailService.sendTournamentReminder(
          to,
          data.tournamentName || 'Tournament',
          data.startDate || new Date().toISOString(),
          data.venue,
          data.organizerName,
        );

      case 'TOURNAMENT_STARTED':
        return this.emailService.sendTournamentStarted(
          to,
          data.tournamentName || 'Tournament',
          data.organizerName,
        );

      case 'TOURNAMENT_COMPLETED':
        return this.emailService.sendTournamentCompleted(
          to,
          data.tournamentName || 'Tournament',
          data.organizerName,
        );

      case 'PLAYER_DISQUALIFIED':
        return this.emailService.sendPlayerDisqualified(
          to,
          data.tournamentName || 'Tournament',
          data.organizerName,
        );

      case 'PLAYER_STROKE_PENALTY':
        return this.emailService.sendPlayerStrokePenalty(
          to,
          data.tournamentName || 'Tournament',
          data.strokes || 1,
          data.organizerName,
        );

      case 'ADMIN_CREDENTIALS':
        return this.emailService.sendAdminCredentials(
          to,
          data.clubName || 'Club',
          data.email || to,
          data.password || '',
        );

      case 'ACCOUNT_SUSPENDED':
        return this.emailService.sendAccountSuspended(
          to,
          data.clubName || 'Club',
        );

      case 'ACCOUNT_REACTIVATED':
        return this.emailService.sendAccountReactivated(
          to,
          data.clubName || 'Club',
        );

      case 'MEMBER_CREATED':
        return this.emailService.sendMemberCreated(
          to,
          data.firstName || 'User',
          data.tempPassword || '',
        );

      case 'SECURITY_ALERT':
        return this.emailService.sendSecurityAlert(
          to,
          data.action || 'Unknown action',
        );

      case 'TOURNAMENT_UPDATED':
        return this.emailService.sendTournamentUpdate(
          to,
          data.tournamentName || 'Tournament',
          data.updateDetails,
          data.organizerName,
        );

      case 'TEE_TIME_PUBLISHED':
        return this.emailService.sendTeeTimePublished(
          to,
          data.tournamentName || 'Tournament',
          data.roundName || 'Round 1',
          data.teeTime || 'TBA',
          data.groupName || 'Flight 1',
          data.groupMembers || [],
          data.organizerName,
          data.startType,
        );

      case 'TOURNAMENT_CUT_PASSED':
        return this.emailService.sendTournamentCutPassed(
          to,
          data.tournamentName || 'Tournament',
          data.playerName || 'Player',
          data.organizerName,
        );

      case 'TOURNAMENT_CUT_MISSED':
        return this.emailService.sendTournamentCutMissed(
          to,
          data.tournamentName || 'Tournament',
          data.playerName || 'Player',
          data.organizerName,
        );

      case 'MANAGER_INVITE':
        return this.emailService.sendManagerInvite(
          to,
          data.firstName || 'Manager',
          data.inviteUrl || '',
          data.clubName || 'Your Club',
          data.expiresIn || '10 minutes',
        );

      case 'TOURNAMENT_PLAYER_INVITE':
        return this.emailService.sendTournamentPlayerInvite(
          to,
          data.tournamentName || 'Tournament',
          data.clubName || 'Your Club',
          data.inviteUrl || '',
          data.isNewUser || false,
          data.expiresIn || '10 minutes',
        );

      case 'WITHDRAWAL_REQUESTED':
        return this.emailService.sendWithdrawalRequested(
          to,
          data.clubName || 'Your Club',
          data.amount || 0,
          data.bankName || '',
          data.accountNumber || '',
          data.accountName || '',
          data.currency || 'NGN',
        );

      case 'WITHDRAWAL_APPROVED':
        return this.emailService.sendWithdrawalApproved(
          to,
          data.clubName || 'Your Club',
          data.amount || 0,
          data.bankName || '',
          data.accountNumber || '',
          data.accountName || '',
          data.reference || '',
          data.currency || 'NGN',
          data.notes,
        );

      case 'WITHDRAWAL_REJECTED':
        return this.emailService.sendWithdrawalRejected(
          to,
          data.clubName || 'Your Club',
          data.amount || 0,
          data.bankName || '',
          data.accountNumber || '',
          data.accountName || '',
          data.reason || 'Details could not be verified.',
          data.currency || 'NGN',
        );

      default:
        throw new Error(`Unsupported email template: ${template}`);
    }
  }

  private async runDataRetentionCleanup() {
    this.logger.log('Starting DATA_RETENTION_CLEANUP...');

    // 1. Audit logs: archive after 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const deletedLogs = await this.prisma.auditLog.deleteMany({
      where: { createdAt: { lt: ninetyDaysAgo } },
    });
    this.logger.log(
      `Deleted ${deletedLogs.count} audit logs older than 90 days.`,
    );

    // 2. Soft-deleted users: hard delete after 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const deletedUsers = await this.prisma.user.deleteMany({
      where: { deletedAt: { lt: thirtyDaysAgo } },
    });
    this.logger.log(
      `Hard deleted ${deletedUsers.count} users who were soft-deleted more than 30 days ago.`,
    );

    // 3. Completed tournaments: archive scores after 1 year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Prisma does not currently support `deleteMany` across relation boundaries directly.
    // We must query the affected score IDs first, then delete them.
    const oldScores = await this.prisma.score.findMany({
      where: {
        group: {
          tournament: {
            status: 'COMPLETED',
            endDate: { lt: oneYearAgo },
          },
        },
      },
      select: { id: true },
    });

    if (oldScores.length > 0) {
      const scoreIds = oldScores.map((s) => s.id);

      // Delete in batches to avoid query size limits if there are millions of scores
      const batchSize = 5000;
      let totalDeleted = 0;
      for (let i = 0; i < scoreIds.length; i += batchSize) {
        const batch = scoreIds.slice(i, i + batchSize);
        const res = await this.prisma.score.deleteMany({
          where: { id: { in: batch } },
        });
        totalDeleted += res.count;
      }
      this.logger.log(
        `Deleted ${totalDeleted} scores for completed tournaments older than 1 year.`,
      );
    } else {
      this.logger.log('No old scores found to delete.');
    }
  }

  async purgeExpiredInvitations() {
    const now = new Date();
    const expiredPendingUsers = await this.prisma.user.findMany({
      where: {
        status: 'PENDING',
        inviteTokenExpires: { lt: now },
      },
      select: { id: true, email: true },
    });

    if (expiredPendingUsers.length > 0) {
      const expiredIds = expiredPendingUsers.map((u) => u.id);
      await this.prisma.$transaction(async (tx) => {
        await tx.score.deleteMany({ where: { userId: { in: expiredIds } } });
        await tx.registration.deleteMany({ where: { userId: { in: expiredIds } } });
        await tx.user.deleteMany({ where: { id: { in: expiredIds } } });
      });
      this.logger.log(
        `Automatically cleaned up ${expiredIds.length} expired unaccepted pending user invitations.`,
      );
    }
  }
}
