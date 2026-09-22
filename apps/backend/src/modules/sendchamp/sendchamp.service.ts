import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SendchampService {
  private readonly logger = new Logger(SendchampService.name);

  async sendWhatsApp(to: string, message: string) {
    this.logger.log(`[Sendchamp] WhatsApp message to ${to}: ${message}`);
    return { status: 'success' };
  }

  async sendEmail(to: string, subject: string, body: string) {
    this.logger.log(`[Sendchamp] Email to ${to}: ${subject}`);
    return { status: 'success' };
  }
}
