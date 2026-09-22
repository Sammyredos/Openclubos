import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { PrismaService } from '../../common/prisma.service';
import { ResendService } from '../resend/resend.service';
import { SendchampService } from '../sendchamp/sendchamp.service';

export interface EmailDispatchResult {
  messageId: string;
  previewUrl: string | null;
  provider: string;
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

@Injectable()
export class EmailCircuitBreakerService {
  private readonly logger = new Logger(EmailCircuitBreakerService.name);

  private state: CircuitState = 'CLOSED';
  private consecutiveFailures = 0;
  private readonly failureThreshold = 5;
  private lastFailureTime = 0;
  private readonly resetTimeoutMs = 60_000; // 60s cooldown

  constructor(
    private readonly mailer: MailerService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly resendService: ResendService,
    private readonly sendchampService: SendchampService,
  ) {}

  getState(): CircuitState {
    return this.state;
  }

  private getPreviewUrl(): string | null {
    if (process.env.NODE_ENV === 'production') {
      return null;
    }
    const webPort = this.configService.get<string>('MAILPIT_WEB_PORT', '8025');
    return `http://localhost:${webPort}`;
  }

  private onPrimarySuccess() {
    this.consecutiveFailures = 0;
    if (this.state === 'HALF_OPEN') {
      this.logger.log('[EmailCircuitBreaker] Primary SMTP recovered. Circuit CLOSED.');
      this.state = 'CLOSED';
    }
  }

  private onPrimaryFailure(error: any) {
    this.consecutiveFailures += 1;
    this.lastFailureTime = Date.now();

    if (this.consecutiveFailures >= this.failureThreshold || this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.logger.warn(
        `[EmailCircuitBreaker] Circuit OPEN: ${this.consecutiveFailures} consecutive Primary SMTP failures (${error?.message}). Cooldown: ${this.resetTimeoutMs / 1000}s.`,
      );
    }
  }

  async sendWithFallback(
    to: string,
    subject: string,
    html: string,
    logMsg: string,
  ): Promise<EmailDispatchResult> {
    const now = Date.now();

    // Check if circuit breaker can transition from OPEN to HALF_OPEN probe state
    if (this.state === 'OPEN') {
      if (now - this.lastFailureTime >= this.resetTimeoutMs) {
        this.logger.log('[EmailCircuitBreaker] Cooldown elapsed. Circuit entering HALF_OPEN probe state.');
        this.state = 'HALF_OPEN';
      }
    }

    let primaryError: Error | null = null;

    // ─── TIER 1: Primary SMTP Relay (Mailpit on 127.0.0.1:1025 in dev / cPanel in prod) ───
    if (this.state !== 'OPEN') {
      try {
        const info = await this.mailer.sendMail({
          to,
          subject,
          html,
        });

        this.onPrimarySuccess();
        const messageId = info?.messageId || `smtp_${Date.now()}`;
        this.logger.log(
          `[EmailCircuitBreaker] Primary SMTP dispatched to ${to}: "${subject}" (${logMsg}) | messageId=${messageId}`,
        );

        return {
          messageId,
          previewUrl: this.getPreviewUrl(),
          provider: 'smtp',
        };
      } catch (err: any) {
        primaryError = err;
        this.onPrimaryFailure(err);
        this.logger.warn(
          `[EmailCircuitBreaker] Primary SMTP delivery failed to ${to}: ${err?.message}. Initiating fallback...`,
        );
      }
    } else {
      this.logger.warn(
        `[EmailCircuitBreaker] Circuit is OPEN. Bypassing Primary SMTP for ${to} and routing to secondary fallbacks.`,
      );
    }

    // ─── TIER 2: Secondary Transactional Provider (Resend / Sendchamp) ───
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    if (resendApiKey && !resendApiKey.startsWith('re_...')) {
      try {
        const resendResult = await this.resendService.sendEmail(to, subject, html);
        this.logger.log(`[EmailCircuitBreaker] Secondary (Resend) delivered to ${to}: "${subject}"`);
        return {
          messageId: resendResult?.id || `resend_${Date.now()}`,
          previewUrl: null,
          provider: 'resend',
        };
      } catch (resendError: any) {
        this.logger.warn(`[EmailCircuitBreaker] Secondary (Resend) failed: ${resendError?.message}`);
      }
    }

    const sendchampKey = this.configService.get<string>('SENDCHAMP_PUBLIC_KEY');
    if (sendchampKey && !sendchampKey.startsWith('sendchamp_live_...')) {
      try {
        await this.sendchampService.sendEmail(to, subject, html);
        this.logger.log(`[EmailCircuitBreaker] Secondary (Sendchamp) delivered to ${to}: "${subject}"`);
        return {
          messageId: `sendchamp_${Date.now()}`,
          previewUrl: null,
          provider: 'sendchamp',
        };
      } catch (sendchampError: any) {
        this.logger.warn(`[EmailCircuitBreaker] Secondary (Sendchamp) failed: ${sendchampError?.message}`);
      }
    }

    // ─── TIER 3: Zero-Drop PostgreSQL EmailOutbox ───
    try {
      const outboxEntry = await this.prisma.emailOutbox.create({
        data: {
          to,
          subject,
          html,
          status: 'PENDING',
          provider: 'OUTBOX',
          attempts: 1,
          lastError: primaryError?.message || 'Primary SMTP unavailable (Circuit OPEN)',
        },
      });

      this.logger.warn(
        `[EmailCircuitBreaker] Primary & secondary exhausted. Email to ${to} safely queued in PostgreSQL EmailOutbox (${outboxEntry.id}) for zero-drop retry.`,
      );

      return {
        messageId: outboxEntry.id,
        previewUrl: null,
        provider: 'outbox',
      };
    } catch (outboxError: any) {
      this.logger.error(
        `[EmailCircuitBreaker] Critical: Failed to persist email to EmailOutbox: ${outboxError?.message}`,
      );

      return {
        messageId: `failed_${Date.now()}`,
        previewUrl: null,
        provider: 'failed',
      };
    }
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return fn();
  }
}
