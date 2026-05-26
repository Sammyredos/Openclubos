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

  // ────────────────────────────────────────────────────────────────
  // Shared layout helpers
  // ────────────────────────────────────────────────────────────────

  private wrap(title: string, body: string, gradient = '#10b981, #059669'): string {
    return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, ${gradient}); padding: 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">${title}</h1>
        </div>
        <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          ${body}
        </div>
        <div style="padding: 16px 32px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">OpenClubOS — Golf Tournament Management</p>
        </div>
      </div>
    `;
  }

  private p(text: string): string {
    return `<p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">${text}</p>`;
  }

  private infoBox(content: string, bg = '#f0fdf4', border = '#bbf7d0', color = '#166534'): string {
    return `
      <div style="background: ${bg}; border: 1px solid ${border}; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="color: ${color}; font-size: 14px; margin: 0;">${content}</p>
      </div>
    `;
  }

  private button(text: string, url: string): string {
    return `
      <div style="text-align: center; margin: 24px 0;">
        <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">${text}</a>
      </div>
    `;
  }

  private statusBadge(label: string, color: string): string {
    return `
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; margin: 16px 0;">
        <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Status</p>
        <p style="color: ${color}; font-size: 20px; font-weight: 700; margin: 0;">${label}</p>
      </div>
    `;
  }

  private formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private formatCurrency(amount: number, currency = 'NGN'): string {
    const map: Record<string, string> = { NGN: 'en-NG', USD: 'en-US', GBP: 'en-GB', EUR: 'de-DE' };
    return new Intl.NumberFormat(map[currency] || 'en-NG', { style: 'currency', currency }).format(amount);
  }

  private async send(to: string, subject: string, html: string, logMsg: string): Promise<EmailResult> {
    const result = await this.mailer.sendMail({ to, subject, html });
    this.logger.log(`${logMsg} | messageId=${result.messageId}`);
    return { messageId: result.messageId, previewUrl: this.getPreviewUrl(result) };
  }

  private getPreviewUrl(result: { messageId: string; [key: string]: any }): string | null {
    if (typeof result === 'object' && 'getTestMessageUrl' in result) {
      return (result as any).getTestMessageUrl?.() ?? null;
    }
    return `http://localhost:${process.env.MAILPIT_WEB_PORT || '8025'}`;
  }

  // ────────────────────────────────────────────────────────────────
  // 1. Welcome
  // ────────────────────────────────────────────────────────────────

  async sendWelcome(to: string, firstName: string): Promise<EmailResult> {
    const html = this.wrap('Welcome to OpenClubOS', `
      ${this.p(`Hello <strong>${firstName}</strong>,`)}
      ${this.p('Welcome to OpenClubOS! Your account has been created successfully.')}
      ${this.p('You can now browse tournaments, register for events, and track your scores — all in one place.')}
      ${this.infoBox('🎉 <strong>Your account is ready.</strong> Log in to get started!')}
    `);
    return this.send(to, 'Welcome to OpenClubOS', html, `Welcome email sent to ${to}`);
  }

  // ────────────────────────────────────────────────────────────────
  // 2. Password Reset
  // ────────────────────────────────────────────────────────────────

  async sendPasswordReset(to: string, resetToken: string, resetUrl: string): Promise<EmailResult> {
    const html = this.wrap('Password Reset', `
      ${this.p('Hello,')}
      ${this.p('We received a request to reset your password. Click the button below to set a new password.')}
      ${this.button('Reset Password', `${resetUrl}?token=${resetToken}`)}
      ${this.p('<small style="color: #6b7280;">If you did not request this, you can safely ignore this email. The link expires in 1 hour.</small>')}
    `);
    return this.send(to, 'Password Reset — OpenClubOS', html, `Password reset email sent to ${to}`);
  }

  // ────────────────────────────────────────────────────────────────
  // 3. Registration Confirmation (generic)
  // ────────────────────────────────────────────────────────────────

  async sendRegistrationConfirmation(
    to: string,
    tournamentName: string,
    status: string,
    startDate?: string,
  ): Promise<EmailResult> {
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    const colorMap: Record<string, string> = {
      approved: '#10b981', pending: '#f59e0b', rejected: '#ef4444', waitlisted: '#8b5cf6',
    };
    const statusColor = colorMap[status.toLowerCase()] || '#6b7280';
    const dateInfo = startDate ? `<br/>📅 <strong>Date:</strong> ${this.formatDate(startDate)}` : '';

    const html = this.wrap('Registration Update', `
      ${this.p('Hello,')}
      ${this.p(`Your registration for <strong>${tournamentName}</strong> has been updated.`)}
      ${this.statusBadge(statusLabel, statusColor)}
      ${dateInfo ? this.infoBox(`🏆 <strong>Tournament:</strong> ${tournamentName}${dateInfo}`) : ''}
      ${this.p('<span style="color: #6b7280;">If you have any questions, please contact the tournament organizer.</span>')}
    `);
    return this.send(to, `Registration ${statusLabel}: ${tournamentName}`, html,
      `Registration confirmation sent to ${to} for "${tournamentName}" (${status})`);
  }

  // ────────────────────────────────────────────────────────────────
  // 4. Registration Approved
  // ────────────────────────────────────────────────────────────────

  async sendRegistrationApproved(to: string, tournamentName: string): Promise<EmailResult> {
    const html = this.wrap('Registration Approved', `
      ${this.p('Hello,')}
      ${this.p(`Great news! Your registration for <strong>${tournamentName}</strong> has been <strong style="color: #10b981;">approved</strong>.`)}
      ${this.infoBox('✅ <strong>You\'re in!</strong> Check the tournament page for schedule and tee-time details.')}
    `);
    return this.send(to, `You're In: ${tournamentName}`, html, `Registration approved email sent to ${to}`);
  }

  // ────────────────────────────────────────────────────────────────
  // 5. Registration Rejected
  // ────────────────────────────────────────────────────────────────

  async sendRegistrationRejected(to: string, tournamentName: string): Promise<EmailResult> {
    const html = this.wrap('Registration Update', `
      ${this.p('Hello,')}
      ${this.p(`Unfortunately, your registration for <strong>${tournamentName}</strong> could not be approved at this time.`)}
      ${this.infoBox('If you believe this is an error, please contact the tournament organizer.', '#fef2f2', '#fecaca', '#991b1b')}
    `, '#ef4444, #dc2626');
    return this.send(to, `Registration Update: ${tournamentName}`, html, `Registration rejected email sent to ${to}`);
  }

  // ────────────────────────────────────────────────────────────────
  // 6. Waitlist Notification
  // ────────────────────────────────────────────────────────────────

  async sendWaitlistNotification(to: string, tournamentName: string): Promise<EmailResult> {
    const html = this.wrap('You\'re on the Waitlist', `
      ${this.p('Hello,')}
      ${this.p(`The tournament <strong>${tournamentName}</strong> is currently full, but you have been added to the <strong>waitlist</strong>.`)}
      ${this.infoBox('⏳ <strong>Waitlisted.</strong> You will be notified automatically if a spot opens up.', '#fffbeb', '#fde68a', '#92400e')}
    `, '#8b5cf6, #7c3aed');
    return this.send(to, `Waitlisted: ${tournamentName}`, html, `Waitlist notification sent to ${to}`);
  }

  // ────────────────────────────────────────────────────────────────
  // 7. Payment Receipt
  // ────────────────────────────────────────────────────────────────

  async sendPaymentReceipt(
    to: string,
    tournamentName: string,
    amount: number,
    currency: string,
    reference: string,
  ): Promise<EmailResult> {
    const formatted = this.formatCurrency(amount, currency);
    const html = this.wrap('Payment Receipt', `
      ${this.p('Hello, your payment has been confirmed.')}
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">Tournament</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${tournamentName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">Amount</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #10b981; font-size: 14px; font-weight: 600; text-align: right;">${formatted}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Reference</td>
          <td style="padding: 12px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right; font-family: monospace;">${reference}</td>
        </tr>
      </table>
      ${this.infoBox('✅ <strong>Payment Confirmed</strong>')}
    `);
    return this.send(to, `Payment Receipt — ${tournamentName}`, html,
      `Payment receipt sent to ${to} | amount=${formatted} ref=${reference}`);
  }

  // ────────────────────────────────────────────────────────────────
  // 8. Tournament Reminder
  // ────────────────────────────────────────────────────────────────

  async sendTournamentReminder(
    to: string,
    tournamentName: string,
    startDate: string,
    venue?: string,
  ): Promise<EmailResult> {
    const formattedDate = this.formatDate(startDate);
    const venueInfo = venue ? `<br/>📍 <strong>Venue:</strong> ${venue}` : '';
    const html = this.wrap('Tournament Reminder', `
      ${this.p('Hello,')}
      ${this.p(`This is a friendly reminder that <strong>${tournamentName}</strong> is scheduled for <strong>${formattedDate}</strong>.`)}
      ${this.infoBox(`📅 <strong>Date:</strong> ${formattedDate}<br/>🏆 <strong>Tournament:</strong> ${tournamentName}${venueInfo}`)}
      ${this.p('<span style="color: #6b7280;">Make sure you\'re prepared and arrive on time. Good luck!</span>')}
    `);
    return this.send(to, `Reminder: ${tournamentName} is coming up`, html,
      `Tournament reminder sent to ${to} for "${tournamentName}"`);
  }

  // ────────────────────────────────────────────────────────────────
  // 9. Tournament Started
  // ────────────────────────────────────────────────────────────────

  async sendTournamentStarted(to: string, tournamentName: string): Promise<EmailResult> {
    const html = this.wrap('Tournament Has Started', `
      ${this.p('Hello,')}
      ${this.p(`<strong>${tournamentName}</strong> is now <strong style="color: #10b981;">underway</strong>!`)}
      ${this.infoBox('⛳ <strong>The tournament has officially started.</strong> Head to the course and check your tee time.')}
    `);
    return this.send(to, `${tournamentName} Has Started`, html, `Tournament started email sent to ${to}`);
  }

  // ────────────────────────────────────────────────────────────────
  // 10. Tournament Completed
  // ────────────────────────────────────────────────────────────────

  async sendTournamentCompleted(to: string, tournamentName: string): Promise<EmailResult> {
    const html = this.wrap('Tournament Completed', `
      ${this.p('Hello,')}
      ${this.p(`<strong>${tournamentName}</strong> has been <strong>completed</strong>. Thank you for participating!`)}
      ${this.infoBox('🏆 <strong>Results are now available.</strong> Log in to view the final leaderboard and your scorecard.')}
    `);
    return this.send(to, `${tournamentName} — Results Available`, html, `Tournament completed email sent to ${to}`);
  }

  // ────────────────────────────────────────────────────────────────
  // 11. Admin Credentials
  // ────────────────────────────────────────────────────────────────

  async sendAdminCredentials(
    to: string,
    clubName: string,
    email: string,
    password: string,
  ): Promise<EmailResult> {
    const html = this.wrap('Your Admin Account', `
      ${this.p(`Hello,`)}
      ${this.p(`An administrator account has been created for you at <strong>${clubName}</strong>.`)}
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">Email</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 14px; font-weight: 600; text-align: right; font-family: monospace;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Temporary Password</td>
          <td style="padding: 10px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right; font-family: monospace;">${password}</td>
        </tr>
      </table>
      ${this.infoBox('🔒 <strong>Please change your password after your first login.</strong>', '#fffbeb', '#fde68a', '#92400e')}
    `, '#3b82f6, #2563eb');
    return this.send(to, `Your ${clubName} Admin Account`, html, `Admin credentials sent to ${to} for ${clubName}`);
  }

  // ────────────────────────────────────────────────────────────────
  // 12. Account Suspended
  // ────────────────────────────────────────────────────────────────

  async sendAccountSuspended(to: string, clubName: string): Promise<EmailResult> {
    const html = this.wrap('Account Suspended', `
      ${this.p('Hello,')}
      ${this.p(`Your account at <strong>${clubName}</strong> has been <strong style="color: #ef4444;">suspended</strong>.`)}
      ${this.p('<span style="color: #6b7280;">If you believe this is an error, please contact the club administrator.</span>')}
    `, '#ef4444, #dc2626');
    return this.send(to, `Account Suspended — ${clubName}`, html, `Account suspended email sent to ${to}`);
  }

  // ────────────────────────────────────────────────────────────────
  // 13. Account Reactivated
  // ────────────────────────────────────────────────────────────────

  async sendAccountReactivated(to: string, clubName: string): Promise<EmailResult> {
    const html = this.wrap('Account Reactivated', `
      ${this.p('Hello,')}
      ${this.p(`Your account at <strong>${clubName}</strong> has been <strong style="color: #10b981;">reactivated</strong>.`)}
      ${this.infoBox('✅ <strong>You can now log in again</strong> and access all features.')}
    `);
    return this.send(to, `Account Reactivated — ${clubName}`, html, `Account reactivated email sent to ${to}`);
  }

  // ────────────────────────────────────────────────────────────────
  // 14. Member Created
  // ────────────────────────────────────────────────────────────────

  async sendMemberCreated(to: string, firstName: string, tempPassword: string): Promise<EmailResult> {
    const html = this.wrap('Your Account Has Been Created', `
      ${this.p(`Hello <strong>${firstName}</strong>,`)}
      ${this.p('An account has been created for you on OpenClubOS. Use the credentials below to log in.')}
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">Email</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 14px; font-weight: 600; text-align: right; font-family: monospace;">${to}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Temporary Password</td>
          <td style="padding: 10px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right; font-family: monospace;">${tempPassword}</td>
        </tr>
      </table>
      ${this.infoBox('🔒 <strong>Please change your password after your first login.</strong>', '#fffbeb', '#fde68a', '#92400e')}
    `);
    return this.send(to, 'Your OpenClubOS Account', html, `Member created email sent to ${to}`);
  }

  // ────────────────────────────────────────────────────────────────
  // 15. Security Alert
  // ────────────────────────────────────────────────────────────────

  async sendSecurityAlert(to: string, action: string): Promise<EmailResult> {
    const html = this.wrap('Security Alert', `
      ${this.p('Hello,')}
      ${this.p(`We detected the following activity on your account:`)}
      ${this.infoBox(`🛡️ <strong>${action}</strong>`, '#fef2f2', '#fecaca', '#991b1b')}
      ${this.p('<span style="color: #6b7280;">If this was not you, please change your password immediately and contact support.</span>')}
    `, '#ef4444, #dc2626');
    return this.send(to, 'Security Alert — OpenClubOS', html, `Security alert sent to ${to} | action=${action}`);
  }
}
