import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

export interface EmailResult {
  messageId: string;
  previewUrl: string | null;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailer: MailerService) {}

  /**
   * Sends a tournament reminder email to a player.
   */
  async sendTournamentReminder(
    to: string,
    tournamentName: string,
    startDate: string,
  ): Promise<EmailResult> {
    const formattedDate = new Date(startDate).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const result = await this.mailer.sendMail({
      to,
      subject: `Reminder: ${tournamentName} is coming up`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Tournament Reminder</h1>
          </div>
          <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
              Hello,
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              This is a friendly reminder that <strong>${tournamentName}</strong> is scheduled for <strong>${formattedDate}</strong>.
            </p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #166534; font-size: 14px; margin: 0;">
                📅 <strong>Date:</strong> ${formattedDate}<br/>
                🏆 <strong>Tournament:</strong> ${tournamentName}
              </p>
            </div>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
              Make sure you're prepared and arrive on time. Good luck!
            </p>
          </div>
          <div style="padding: 16px 32px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">OpenClub — Golf Tournament Management</p>
          </div>
        </div>
      `,
    });

    this.logger.log(
      `Tournament reminder sent to ${to} for "${tournamentName}" | messageId=${result.messageId}`,
    );

    return {
      messageId: result.messageId,
      previewUrl: this.getPreviewUrl(result),
    };
  }

  /**
   * Sends a registration confirmation email.
   */
  async sendRegistrationConfirmation(
    to: string,
    tournamentName: string,
    status: string,
  ): Promise<EmailResult> {
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    const statusColor =
      status === 'APPROVED'
        ? '#10b981'
        : status === 'PENDING'
          ? '#f59e0b'
          : status === 'REJECTED'
            ? '#ef4444'
            : '#6b7280';

    const result = await this.mailer.sendMail({
      to,
      subject: `Registration ${statusLabel}: ${tournamentName}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Registration Update</h1>
          </div>
          <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
              Hello,
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              Your registration for <strong>${tournamentName}</strong> has been updated.
            </p>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Status</p>
              <p style="color: ${statusColor}; font-size: 20px; font-weight: 700; margin: 0;">${statusLabel}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
              If you have any questions, please contact the tournament organizer.
            </p>
          </div>
          <div style="padding: 16px 32px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">OpenClub — Golf Tournament Management</p>
          </div>
        </div>
      `,
    });

    this.logger.log(
      `Registration confirmation sent to ${to} for "${tournamentName}" (${status}) | messageId=${result.messageId}`,
    );

    return {
      messageId: result.messageId,
      previewUrl: this.getPreviewUrl(result),
    };
  }

  /**
   * Sends a payment receipt email.
   */
  async sendPaymentReceipt(
    to: string,
    amount: number,
    tournamentName: string,
    reference: string,
  ): Promise<EmailResult> {
    const formattedAmount = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);

    const result = await this.mailer.sendMail({
      to,
      subject: `Payment Receipt — ${tournamentName}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Payment Receipt</h1>
          </div>
          <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              Hello, your payment has been confirmed.
            </p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">Tournament</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${tournamentName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">Amount</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #10b981; font-size: 14px; font-weight: 600; text-align: right;">${formattedAmount}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Reference</td>
                <td style="padding: 12px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right; font-family: monospace;">${reference}</td>
              </tr>
            </table>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; text-align: center;">
              <p style="color: #166534; font-size: 14px; font-weight: 600; margin: 0;">✅ Payment Confirmed</p>
            </div>
          </div>
          <div style="padding: 16px 32px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">OpenClub — Golf Tournament Management</p>
          </div>
        </div>
      `,
    });

    this.logger.log(
      `Payment receipt sent to ${to} | amount=${formattedAmount} ref=${reference} | messageId=${result.messageId}`,
    );

    return {
      messageId: result.messageId,
      previewUrl: this.getPreviewUrl(result),
    };
  }

  /**
   * Extracts a preview URL from the send result (works with Ethereal; Mailpit uses web UI).
   */
  private getPreviewUrl(result: { messageId: string; [key: string]: any }): string | null {
    // nodemailer sets this when using Ethereal test accounts
    if (typeof result === 'object' && 'getTestMessageUrl' in result) {
      return (result as any).getTestMessageUrl?.() ?? null;
    }
    // For Mailpit, the web UI is at http://localhost:8025
    return `http://localhost:${process.env.MAILPIT_WEB_PORT || '8025'}`;
  }
}
