import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  async send(tokens: string[], title: string, body: string, data?: Record<string, string>) {
    this.logger.log(`[PushNotification] ${title}: ${body} (${tokens.length} tokens)`);
    return { success: true };
  }

  async sendPushNotification(payload: {
    tokens: string[];
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<{ successCount: number; failureCount: number }> {
    this.logger.log(
      `[PushNotification] ${payload.title}: ${payload.body} (${payload.tokens.length} tokens)`,
    );
    return { successCount: payload.tokens.length, failureCount: 0 };
  }
}
