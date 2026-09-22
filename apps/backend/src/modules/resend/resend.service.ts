import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);

  async sendEmail(to: string, subject: string, html: string) {
    this.logger.log(`[Resend] Email to ${to}: ${subject}`);
    return { id: 'resend_mock' };
  }
}
