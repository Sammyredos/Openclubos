import { Injectable, Logger } from '@nestjs/common';

export interface EmailDispatchResult {
  messageId: string;
  previewUrl: string | null;
  provider: string;
}

@Injectable()
export class EmailCircuitBreakerService {
  private readonly logger = new Logger(EmailCircuitBreakerService.name);

  async sendWithFallback(
    to: string,
    subject: string,
    html: string,
    logMsg: string,
  ): Promise<EmailDispatchResult> {
    this.logger.log(`[EmailCircuitBreaker] Sending email to ${to}: ${subject} (${logMsg})`);
    return {
      messageId: `msg_${Date.now()}`,
      previewUrl: null,
      provider: 'smtp',
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return fn();
  }
}
