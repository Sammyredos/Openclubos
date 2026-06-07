import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

export interface EmailResult {
  messageId: string;
  previewUrl: string | null;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailer: MailerService) { }

  // ────────────────────────────────────────────────────────────────
  // Shared layout helpers
  // ────────────────────────────────────────────────────────────────

  private wrap(title: string, body: string, gradient = '#065f46, #047857'): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, ${gradient}); padding: 40px 32px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">${title}</h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 40px 32px; color: #374151;">
                    ${body}
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 32px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px 0; font-weight: 500;">OpenClubOS</p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 16px 0;">Premium Golf Tournament Management Platform</p>
                    <p style="color: #9ca3af; font-size: 11px; margin: 0;">This email was sent automatically. Please do not reply directly to this address.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private p(text: string): string {
    return `<p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; color: #4b5563;">${text}</p>`;
  }

  private h2(text: string): string {
    return `<h2 style="font-size: 20px; font-weight: 600; color: #111827; margin: 32px 0 16px 0;">${text}</h2>`;
  }

  private list(items: string[]): string {
    const listItems = items.map(item => `<li style="margin-bottom: 8px;">${item}</li>`).join('');
    return `<ul style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 0 0 24px 0; padding-left: 24px;">${listItems}</ul>`;
  }

  private infoBox(content: string, bg = '#f0fdf4', border = '#bbf7d0', color = '#166534'): string {
    return `
      <div style="background-color: ${bg}; border: 1px solid ${border}; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <p style="color: ${color}; font-size: 15px; line-height: 1.5; margin: 0;">${content}</p>
      </div>
    `;
  }

  private button(text: string, url: string, color = '#059669'): string {
    return `
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
        <tr>
          <td align="center">
            <a href="${url}" style="display: inline-block; background-color: ${color}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center;">
              ${text}
            </a>
          </td>
        </tr>
      </table>
    `;
  }

  private statusBadge(label: string, color: string): string {
    return `
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
        <tr>
          <td align="center">
            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; text-align: center; width: 100%; max-width: 300px;">
              <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 8px 0; font-weight: 600;">Current Status</p>
              <p style="color: ${color}; font-size: 24px; font-weight: 700; margin: 0;">${label}</p>
            </div>
          </td>
        </tr>
      </table>
    `;
  }

  private dataTable(rows: { label: string; value: string }[]): string {
    const tableRows = rows.map(row => `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 15px; width: 40%;">${row.label}</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 15px; font-weight: 600; text-align: right;">${row.value}</td>
      </tr>
    `).join('');

    return `
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border: 1px solid #e5e7eb; border-radius: 8px; margin: 24px 0; border-collapse: collapse;">
        ${tableRows}
      </table>
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

  private getPreviewUrl(result: { messageId: string;[key: string]: any }): string | null {
    if (typeof result === 'object' && 'getTestMessageUrl' in result) {
      return (result as any).getTestMessageUrl?.() ?? null;
    }
    return `http://localhost:${process.env.MAILPIT_WEB_PORT || '8025'}`;
  }

  // ────────────────────────────────────────────────────────────────
  // 1. Welcome
  // ────────────────────────────────────────────────────────────────

  async sendWelcome(to: string, firstName: string, verifyUrl?: string): Promise<EmailResult> {
    const html = this.wrap('Welcome to OpenClubOS', `
      ${this.p(`Dear <strong>${firstName}</strong>,`)}
      ${this.p('Welcome to OpenClubOS! We are thrilled to have you join our premier platform for golf tournament management and player engagement.')}
      ${this.p('Your account has been successfully created and is now active. OpenClubOS is designed to elevate your golfing experience by providing a central hub for all your tournament needs.')}
      ${this.h2('What you can do next:')}
      ${this.list([
      '<strong>Browse Tournaments:</strong> Discover and register for upcoming exclusive events.',
      '<strong>Track Your Progress:</strong> Maintain an official record of your handicap index and historical scorecards.',
      '<strong>Live Leaderboards:</strong> Follow the action in real-time during competitive play.'
    ])}
      ${verifyUrl ? this.p('To ensure the security of your account and to receive important updates, please verify your email address by clicking the button below.') : ''}
      ${verifyUrl ? this.button('Verify Email Address', verifyUrl) : ''}
      ${this.p('If you have any questions or require assistance navigating the platform, our support team is always ready to help.')}
      ${this.p('Best regards,<br/><strong>The OpenClubOS Team</strong>')}
    `);
    return this.send(to, 'Welcome to OpenClubOS', html, `Welcome email sent to ${to}`);
  }

  // ────────────────────────────────────────────────────────────────
  // 2. Email Verification
  // ────────────────────────────────────────────────────────────────

  async sendEmailVerification(to: string, firstName: string, verifyUrl: string): Promise<EmailResult> {
    const html = this.wrap('Verify Your Email', `
      ${this.p(`Dear <strong>${firstName}</strong>,`)}
      ${this.p('Thank you for registering with OpenClubOS. To complete your account setup and ensure the security of your profile, we require you to verify your email address.')}
      ${this.button('Verify Email Address', verifyUrl)}
      ${this.p('If the button above does not work, please copy and paste the following URL securely into your web browser:')}
      ${this.p(`<a href="${verifyUrl}" style="color: #059669; text-decoration: underline; word-break: break-all; font-size: 14px;">${verifyUrl}</a>`)}
      ${this.infoBox('<strong>Note:</strong> This verification link is valid for 24 hours. If you did not initiate the creation of this account, please disregard this email.', '#f3f4f6', '#e5e7eb', '#4b5563')}
    `);

    return this.send(to, 'Action Required: Verify your OpenClubOS email', html, `Email verification sent to ${to}`);
  }

  // ────────────────────────────────────────────────────────────────
  // 3. Password Reset
  // ────────────────────────────────────────────────────────────────

  async sendPasswordReset(to: string, resetToken: string, resetUrl: string): Promise<EmailResult> {
    const html = this.wrap('Password Reset Request', `
      ${this.p('Hello,')}
      ${this.p('We received a request to reset the password associated with your OpenClubOS account. If you made this request, please proceed by clicking the button below to establish a new password.')}
      ${this.button('Reset My Password', resetUrl, '#2563eb')}
      ${this.p('For security purposes, this link will expire in 1 hour.')}
      ${this.infoBox('<strong>Security Notice:</strong> If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged and your account is secure.', '#fef2f2', '#fecaca', '#991b1b')}
    `, '#1e40af, #2563eb');
    return this.send(to, 'Password Reset Request — OpenClubOS', html, `Password reset email sent to ${to}`);
  }

  // ────────────────────────────────────────────────────────────────
  // 4. Registration Confirmation (generic)
  // ────────────────────────────────────────────────────────────────

  async sendRegistrationConfirmation(
    to: string,
    tournamentName: string,
    status: string,
    startDate?: string,
    organizerName?: string,
  ): Promise<EmailResult> {
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    const colorMap: Record<string, string> = {
      approved: '#059669', pending: '#d97706', rejected: '#dc2626', waitlisted: '#7c3aed',
    };
    const statusColor = colorMap[status.toLowerCase()] || '#4b5563';

    const html = this.wrap('Registration Update', `
      ${this.p('Dear Player,')}
      ${this.p(`This email is to formally notify you that there has been an update to your registration status for <strong>${tournamentName}</strong>.`)}
      
      ${this.statusBadge(statusLabel, statusColor)}
      
      ${startDate ? this.dataTable([
      { label: 'Tournament', value: tournamentName },
      { label: 'Start Date', value: this.formatDate(startDate) },
      { label: 'Status', value: statusLabel }
    ]) : this.dataTable([
      { label: 'Tournament', value: tournamentName },
      { label: 'Status', value: statusLabel }
    ])}
      
      ${this.p('You will continue to receive updates regarding your participation status. If you have any inquiries regarding this change, please reach out to the tournament organizers directly.')}
      ${this.p(`Best regards,<br/><strong>${organizerName || 'The Tournament Team'}</strong>`)}
    `);
    return this.send(to, `Registration Update: ${tournamentName}`, html,
      `Registration confirmation sent to ${to} for "${tournamentName}" (${status})`);
  }

  // ────────────────────────────────────────────────────────────────
  // 5. Registration Approved
  // ────────────────────────────────────────────────────────────────

  async sendRegistrationApproved(to: string, tournamentName: string, organizerName?: string): Promise<EmailResult> {
    const html = this.wrap('Registration Approved', `
      ${this.p('Dear Player,')}
      ${this.p(`We are pleased to inform you that your registration for <strong>${tournamentName}</strong> has been officially <strong style="color: #059669;">approved</strong>.`)}
      
      ${this.infoBox('✅ <strong>Your spot is secured!</strong> We look forward to seeing you on the course. Please ensure you arrive with ample time for registration and warm-up procedures.', '#ecfdf5', '#a7f3d0', '#065f46')}
      
      ${this.h2('Important Next Steps')}
      ${this.list([
      'Log in to your OpenClubOS dashboard to view the official schedule and venue details.',
      'Review your handicap index to ensure it is accurate and up-to-date prior to the event.',
      'Keep an eye on your email for final tee time allocations and groupings, which will be published closer to the tournament date.'
    ])}
      
      ${this.p('Should you need to withdraw or have any questions regarding the itinerary, please contact the organizers as soon as possible.')}
      ${this.p(`Best of luck,<br/><strong>${organizerName || 'The Tournament Team'}</strong>`)}
    `);
    return this.send(to, `Approved: You're in for ${tournamentName}`, html, `Registration approved email sent to ${to}`);
  }

  // ────────────────────────────────────────────────────────────────
  // 6. Registration Rejected
  // ────────────────────────────────────────────────────────────────

  async sendRegistrationRejected(to: string, tournamentName: string, organizerName?: string): Promise<EmailResult> {
    const html = this.wrap('Registration Update', `
      ${this.p('Dear Player,')}
      ${this.p(`Thank you for your interest in participating in <strong>${tournamentName}</strong>. After careful review, we regret to inform you that we are unable to approve your registration at this time.`)}
      
      ${this.p('This decision may be due to tournament capacity constraints, eligibility requirements, or missing documentation.')}
      
      ${this.infoBox('If you believe this decision was made in error or if you require further clarification, please reach out to the tournament organizers directly. We apologize for any disappointment this may cause.', '#fef2f2', '#fecaca', '#991b1b')}
      
      ${this.p('We hope to welcome you to future events on the OpenClubOS platform.')}
      ${this.p(`Sincerely,<br/><strong>${organizerName || 'The Tournament Team'}</strong>`)}
    `, '#991b1b, #7f1d1d');
    return this.send(to, `Registration Update: ${tournamentName}`, html, `Registration rejected email sent to ${to}`);
  }

  // ────────────────────────────────────────────────────────────────
  // 7. Waitlist Notification
  // ────────────────────────────────────────────────────────────────

  async sendWaitlistNotification(to: string, tournamentName: string, organizerName?: string): Promise<EmailResult> {
    const html = this.wrap('Waitlist Notification', `
      ${this.p('Dear Player,')}
      ${this.p(`Thank you for registering for <strong>${tournamentName}</strong>. At this time, the tournament has reached its maximum capacity.`)}
      ${this.p('Consequently, you have been placed on the <strong>Official Waitlist</strong>.')}
      
      ${this.infoBox('⏳ <strong>What happens next?</strong><br/>If a registered player withdraws or additional spots become available, we will promote players from the waitlist in the order they registered.', '#f8fafc', '#e2e8f0', '#334155')}
      
      ${this.h2('Waitlist Policies')}
      ${this.list([
      'You will receive an immediate email notification if your status changes from Waitlisted to Approved.',
      'If you are promoted to the active roster, any pending tournament entry fees will become due.',
      'If you no longer wish to remain on the waitlist, please log in to your dashboard and withdraw your registration so others may have the opportunity.'
    ])}
      
      ${this.p('We appreciate your patience and enthusiasm for the event.')}
      ${this.p(`Best regards,<br/><strong>${organizerName || 'The Tournament Team'}</strong>`)}
    `, '#5b21b6, #4c1d95');
    return this.send(to, `Waitlisted: ${tournamentName}`, html, `Waitlist notification sent to ${to}`);
  }

  // ────────────────────────────────────────────────────────────────
  // 8. Payment Receipt
  // ────────────────────────────────────────────────────────────────

  async sendPaymentReceipt(
    to: string,
    tournamentName: string,
    amount: number,
    currency: string,
    reference: string,
  ): Promise<EmailResult> {
    const formatted = this.formatCurrency(amount, currency);
    const html = this.wrap('Official Payment Receipt', `
      ${this.p('Dear Player,')}
      ${this.p('This email serves as your official receipt. Your payment for tournament entry has been successfully processed and confirmed.')}
      
      ${this.infoBox('✅ <strong>Transaction Successful</strong><br/>Your financial obligation for this event is complete.', '#ecfdf5', '#a7f3d0', '#065f46')}
      
      ${this.h2('Transaction Details')}
      ${this.dataTable([
      { label: 'Event Name', value: tournamentName },
      { label: 'Amount Paid', value: formatted },
      { label: 'Payment Method', value: 'Online Gateway' },
      { label: 'Transaction Reference', value: reference },
      { label: 'Date Processed', value: new Date().toLocaleDateString('en-GB') }
    ])}
      
      ${this.p('Please retain this receipt for your records. If you require a formal invoice for accounting purposes, you can download it directly from your player dashboard.')}
      ${this.p('Thank you,<br/><strong>OpenClubOS Billing</strong>')}
    `, '#0f766e, #0f766e');
    return this.send(to, `Payment Receipt: ${tournamentName}`, html,
      `Payment receipt sent to ${to} | amount=${amount} ref=${reference}`);
  }

  // ────────────────────────────────────────────────────────────────
  // 9. Tournament Reminder
  // ────────────────────────────────────────────────────────────────

  async sendTournamentReminder(
    to: string,
    tournamentName: string,
    startDate: string,
    venue?: string,
    organizerName?: string,
  ): Promise<EmailResult> {
    const formattedDate = this.formatDate(startDate);

    const tableData = [
      { label: 'Tournament', value: tournamentName },
      { label: 'Scheduled Date', value: formattedDate }
    ];
    if (venue) tableData.push({ label: 'Venue/Location', value: venue });

    const html = this.wrap('Tournament Reminder', `
      ${this.p('Dear Player,')}
      ${this.p(`This is a formal reminder that your upcoming event, <strong>${tournamentName}</strong>, is fast approaching.`)}
      
      ${this.dataTable(tableData)}
      
      ${this.h2('Pre-Tournament Checklist')}
      ${this.list([
      '<strong>Arrival Time:</strong> Please aim to arrive at least 45 minutes prior to your designated tee time for check-in and warm-ups.',
      '<strong>Dress Code:</strong> Standard golf attire is required. Collared shirts and tailored trousers/shorts are strictly enforced by the club.',
      '<strong>Equipment:</strong> Ensure your clubs and equipment are tournament-ready.',
      '<strong>Check-in:</strong> Proceed directly to the registration desk upon arrival to collect your scorecard and local rules sheet.'
    ])}
      
      ${this.p('Punctuality is critical for maintaining the tournament pace of play. We wish you the best of luck on the course!')}
      ${this.p(`Best regards,<br/><strong>${organizerName || 'The Tournament Team'}</strong>`)}
    `);
    return this.send(to, `Action Required: Upcoming Tournament - ${tournamentName}`, html,
      `Tournament reminder sent to ${to} for "${tournamentName}"`);
  }

  // ────────────────────────────────────────────────────────────────
  // 10. Tournament Started
  // ────────────────────────────────────────────────────────────────

  async sendTournamentStarted(to: string, tournamentName: string, organizerName?: string): Promise<EmailResult> {
    const html = this.wrap('Tournament Underway', `
      ${this.p('Dear Player,')}
      ${this.p(`Please be advised that <strong>${tournamentName}</strong> has officially commenced.`)}
      
      ${this.infoBox('⛳ <strong>Play is now active.</strong> Please ensure you are aware of your tee time and grouping. Late arrivals may be subject to penalty or disqualification according to the rules of golf.', '#eff6ff', '#bfdbfe', '#1e40af')}
      
      ${this.p('Live scoring is now enabled on the platform. We encourage you to input your scores progressively via the OpenClubOS mobile interface to keep the live leaderboard updated for all participants and spectators.')}
      
      ${this.p('Play well and enjoy the competition.')}
      ${this.p(`Best regards,<br/><strong>${organizerName || 'The Tournament Team'}</strong>`)}
    `, '#1e40af, #1d4ed8');
    return this.send(to, `Now Active: ${tournamentName}`, html, `Tournament started email sent to ${to}`);
  }

  // ────────────────────────────────────────────────────────────────
  // 11. Tournament Completed
  // ────────────────────────────────────────────────────────────────

  async sendTournamentCompleted(to: string, tournamentName: string, organizerName?: string): Promise<EmailResult> {
    const html = this.wrap('Tournament Concluded', `
      ${this.p('Dear Player,')}
      ${this.p(`<strong>${tournamentName}</strong> has officially concluded. We would like to extend our gratitude to all participants for making this a successful and competitive event.`)}
      
      ${this.infoBox('🏆 <strong>Final Results Available</strong><br/>The scores have been verified and the official leaderboard is now finalized.', '#f5f3ff', '#ddd6fe', '#5b21b6')}
      
      ${this.h2('Post-Tournament Actions')}
      ${this.list([
      '<strong>View Leaderboard:</strong> Log in to the platform to review final standings across all flights and divisions.',
      '<strong>Scorecards:</strong> Your digital scorecard is securely archived in your player profile for future reference.',
      '<strong>Handicap Update:</strong> If applicable, your verified scores will be transmitted to update your official handicap index.'
    ])}
      
      ${this.p('Thank you once again for your participation. We look forward to hosting you at our future events.')}
      ${this.p(`Best regards,<br/><strong>${organizerName || 'The Tournament Team'}</strong>`)}
    `, '#3730a3, #312e81');
    return this.send(to, `Official Results: ${tournamentName} Concluded`, html, `Tournament completed email sent to ${to}`);
  }

  // ────────────────────────────────────────────────────────────────
  // 11b. Player Disqualified
  // ────────────────────────────────────────────────────────────────

  async sendPlayerDisqualified(to: string, tournamentName: string, organizerName?: string): Promise<EmailResult> {
    const html = this.wrap('Tournament Disqualification', `
      ${this.p('Dear Player,')}
      ${this.p(`This is a formal notification regarding your participation in <strong>${tournamentName}</strong>.`)}
      
      ${this.infoBox('🚫 <strong>Disqualification Notice</strong><br/>You have been officially disqualified from this tournament by the organizing committee.', '#fef2f2', '#fecaca', '#991b1b')}
      
      ${this.p('A disqualification may result from a breach of tournament rules, incorrect scorecard signing, or other serious infractions as determined by the Rules Committee.')}
      
      ${this.p('If you believe this decision was made in error or require further clarification, please contact the tournament organizers directly.')}
      ${this.p(`Sincerely,<br/><strong>${organizerName || 'The Tournament Team'}</strong>`)}
    `, '#991b1b, #7f1d1d');
    return this.send(to, `Official Notice: Disqualification from ${tournamentName}`, html, `Disqualification email sent to ${to}`);
  }

  // ────────────────────────────────────────────────────────────────
  // 11c. Player Stroke Penalty
  // ────────────────────────────────────────────────────────────────

  async sendPlayerStrokePenalty(to: string, tournamentName: string, strokes: number, organizerName?: string): Promise<EmailResult> {
    const html = this.wrap('Official Stroke Penalty', `
      ${this.p('Dear Player,')}
      ${this.p(`This is a formal notification regarding your score in <strong>${tournamentName}</strong>.`)}
      
      ${this.infoBox(`⚠️ <strong>Stroke Penalty Applied</strong><br/>A penalty of <strong>${strokes} stroke${strokes > 1 ? 's' : ''}</strong> has been added to your official score.`, '#fffbeb', '#fde68a', '#92400e')}
      
      ${this.p('This penalty was applied by the tournament officials in accordance with the rules of play.')}
      
      ${this.p('Your total score on the live leaderboard has been updated to reflect this penalty. If you have any questions regarding this ruling, please consult with the Rules Committee at the scoring tent or via the contact details provided by the organizer.')}
      ${this.p(`Sincerely,<br/><strong>${organizerName || 'The Tournament Team'}</strong>`)}
    `, '#b45309, #92400e');
    return this.send(to, `Official Notice: Stroke Penalty in ${tournamentName}`, html, `Stroke penalty email sent to ${to} (${strokes} strokes)`);
  }

  // ────────────────────────────────────────────────────────────────
  // 12. Admin Credentials
  // ────────────────────────────────────────────────────────────────

  async sendAdminCredentials(
    to: string,
    clubName: string,
    email: string,
    password: string,
  ): Promise<EmailResult> {
    const html = this.wrap('Administrative Access Granted', `
      ${this.p('Dear Administrator,')}
      ${this.p(`An administrative profile has been provisioned for you to manage the organization: <strong>${clubName}</strong> on the OpenClubOS platform.`)}
      
      ${this.p('You now have authorized access to manage tournaments, oversee player registrations, and configure organizational settings.')}
      
      ${this.h2('Your Credentials')}
      ${this.dataTable([
      { label: 'Authorized Email', value: email },
      { label: 'Temporary Password', value: password }
    ])}
      
      ${this.infoBox('🔒 <strong>Mandatory Security Action:</strong><br/>You are required to change this temporary password immediately upon your first login to secure the administrative environment.', '#fffbeb', '#fde68a', '#92400e')}
      
      ${this.p('Please handle these credentials with strict confidentiality.')}
    `, '#1f2937, #111827');
    return this.send(to, `Admin Access: ${clubName}`, html, `Admin credentials sent to ${to} for ${clubName}`);
  }

  // ────────────────────────────────────────────────────────────────
  // 13. Account Suspended
  // ────────────────────────────────────────────────────────────────

  async sendAccountSuspended(to: string, clubName: string): Promise<EmailResult> {
    const html = this.wrap('Account Access Suspended', `
      ${this.p('Dear Member,')}
      ${this.p(`This is a formal notification that your access to <strong>${clubName}</strong> via the OpenClubOS platform has been suspended.`)}
      
      ${this.infoBox('🚫 <strong>Account Suspended</strong><br/>You will no longer be able to log in, register for events, or view club-specific data.', '#fef2f2', '#fecaca', '#991b1b')}
      
      ${this.p('This action may be the result of an administrative decision, a violation of terms, or a billing discrepancy.')}
      ${this.p('If you believe this suspension has been applied in error, or if you wish to appeal the decision, please contact your club administrator directly for resolution.')}
    `, '#991b1b, #7f1d1d');
    return this.send(to, `Notice: Account Suspended at ${clubName}`, html, `Account suspended email sent to ${to}`);
  }

  // ────────────────────────────────────────────────────────────────
  // 14. Account Reactivated
  // ────────────────────────────────────────────────────────────────

  async sendAccountReactivated(to: string, clubName: string): Promise<EmailResult> {
    const html = this.wrap('Account Reactivated', `
      ${this.p('Dear Member,')}
      ${this.p(`We are pleased to inform you that your account access to <strong>${clubName}</strong> has been fully restored.`)}
      
      ${this.infoBox('✅ <strong>Access Granted</strong><br/>Your suspension has been lifted. You may now log in to the platform and resume normal activities.', '#ecfdf5', '#a7f3d0', '#065f46')}
      
      ${this.p('Welcome back! You can immediately begin registering for upcoming tournaments and interacting with the club dashboard.')}
    `, '#065f46, #047857');
    return this.send(to, `Restored: Account Reactivated at ${clubName}`, html, `Account reactivated email sent to ${to}`);
  }

  // ────────────────────────────────────────────────────────────────
  // 15. Member Created
  // ────────────────────────────────────────────────────────────────

  async sendMemberCreated(to: string, firstName: string, tempPassword: string): Promise<EmailResult> {
    const html = this.wrap('Your OpenClubOS Account', `
      ${this.p(`Dear <strong>${firstName}</strong>,`)}
      ${this.p('An official player account has been provisioned for you on the OpenClubOS platform by a tournament administrator.')}
      
      ${this.p('This account will serve as your central hub for managing event registrations, tracking your scores, and maintaining your official handicap.')}
      
      ${this.h2('Account Login Details')}
      ${this.dataTable([
      { label: 'Login Email', value: to },
      { label: 'Temporary Password', value: tempPassword }
    ])}
      
      ${this.infoBox('🔒 <strong>Security Requirement:</strong><br/>For your protection, you must update your password immediately after logging in for the first time.', '#fffbeb', '#fde68a', '#92400e')}
      
      ${this.p('We look forward to seeing you on the leaderboard.')}
      ${this.p('Best regards,<br/><strong>The OpenClubOS Team</strong>')}
    `);
    return this.send(to, 'Action Required: Your OpenClubOS Account Details', html, `Member created email sent to ${to}`);
  }

  // ────────────────────────────────────────────────────────────────
  // 16. Security Alert
  // ────────────────────────────────────────────────────────────────

  async sendSecurityAlert(to: string, action: string): Promise<EmailResult> {
    const html = this.wrap('Important Security Alert', `
      ${this.p('Dear User,')}
      ${this.p('Our automated security systems have detected a critical event regarding your OpenClubOS account.')}
      
      ${this.h2('Detected Activity')}
      ${this.infoBox(`⚠️ <strong>${action}</strong>`, '#fef2f2', '#fecaca', '#991b1b')}
      
      ${this.p('We take the security of your data very seriously. If you authorized this action, no further steps are required and you may ignore this notice.')}
      
      ${this.p('<strong>However, if you did not authorize this activity, your account may be compromised.</strong> Please log in immediately, reset your password, and review your account details. If you are unable to access your account, contact support without delay.')}
    `, '#991b1b, #7f1d1d');
    return this.send(to, 'Security Alert: Recent Account Activity', html, `Security alert sent to ${to} | action=${action}`);
  }

  // ────────────────────────────────────────────────────────────────
  // 17. Tournament Updated
  // ────────────────────────────────────────────────────────────────

  async sendTournamentUpdate(to: string, tournamentName: string, updateDetails?: string, organizerName?: string): Promise<EmailResult> {
    const html = this.wrap('Tournament Update', `
      ${this.p('Dear Player,')}
      ${this.p(`This is a formal notification that there has been an update to the details or schedule of <strong>${tournamentName}</strong>.`)}
      
      ${updateDetails ? this.infoBox('<strong>Update Details:</strong><br/>' + updateDetails, '#f3f4f6', '#e5e7eb', '#1f2937') : ''}
      
      ${this.p('Please log in to your OpenClubOS account to view the full updated tournament details, tee times, and guidelines.')}
      ${this.p('If you have any questions, please reach out to the tournament organizers directly.')}
      ${this.p(`Best regards,<br/><strong>${organizerName || 'The Tournament Team'}</strong>`)}
    `, '#059669, #10b981');
    return this.send(to, `Important Update: ${tournamentName}`, html, `Tournament update email sent to ${to} for ${tournamentName}`);
  }
  // ────────────────────────────────────────────────────────────────
  // 18. Tee Time Published
  // ────────────────────────────────────────────────────────────────

  async sendTeeTimePublished(to: string, tournamentName: string, roundName: string, teeTime: string, groupName: string, groupMembers?: string[], organizerName?: string): Promise<EmailResult> {
    const html = this.wrap('Tee Time Published', `
      ${this.p('Dear Player,')}
      ${this.p(`Your official tee time and grouping for <strong>${roundName}</strong> of the <strong>${tournamentName}</strong> have been published.`)}
      
      ${this.h2('Grouping Details')}
      ${this.dataTable([
      { label: 'Tournament', value: tournamentName },
      { label: 'Round', value: roundName },
      { label: 'Tee Time', value: teeTime },
      { label: 'Group', value: groupName }
    ])}

      ${groupMembers && groupMembers.length > 0 ? `
        ${this.h2('Your Playing Partners')}
        ${this.list(groupMembers)}
      ` : ''}
      
      ${this.infoBox('<strong>Arrival Note:</strong> Please ensure you arrive at the tee box at least 15 minutes prior to your scheduled tee time.', '#eff6ff', '#bfdbfe', '#1e3a8a')}
      
      ${this.p('We wish you the best of luck on the course!')}
      ${this.p(`Best regards,<br/><strong>${organizerName || 'The Tournament Team'}</strong>`)}
    `, '#2563eb, #3b82f6');
    return this.send(to, `Tee Time Published: ${tournamentName}`, html, `Tee time email sent to ${to} for ${tournamentName}`);
  }

  async sendTournamentCutPassed(to: string, tournamentName: string, playerName: string, organizerName?: string): Promise<EmailResult> {
    const html = this.wrap('Congratulations, You Made the Cut!', `
      ${this.p(`Dear <strong>${playerName}</strong>,`)}
      ${this.p(`Great playing! We are thrilled to inform you that you have made the cut in <strong>${tournamentName}</strong>.`)}
      
      ${this.infoBox('✅ <strong>Cut Passed!</strong> Your scores have qualified you to advance to the final rounds of the tournament.', '#ecfdf5', '#a7f3d0', '#065f46')}
      
      ${this.p('Please keep an eye out for your upcoming tee times and groupings.')}
      ${this.p('Keep up the great work and best of luck in the rest of the tournament!')}
      ${this.p(`Best regards,<br/><strong>${organizerName || 'The Tournament Team'}</strong>`)}
    `, '#10b981, #34d399');
    return this.send(to, `You Made the Cut! - ${tournamentName}`, html, `Cut passed email sent to ${to} for ${tournamentName}`);
  }

  async sendTournamentCutMissed(to: string, tournamentName: string, playerName: string, organizerName?: string): Promise<EmailResult> {
    const html = this.wrap('Tournament Update', `
      ${this.p(`Dear <strong>${playerName}</strong>,`)}
      ${this.p(`Thank you for participating in <strong>${tournamentName}</strong>.`)}
      
      ${this.infoBox('You did not make the cut, and unfortunately, your scores did not meet the threshold to advance to the final rounds.', '#f3f4f6', '#e5e7eb', '#374151')}
      
      ${this.p('We appreciate you coming out to play and hope you enjoyed the experience.')}
      ${this.p('We look forward to seeing you at our future events!')}
      ${this.p(`Best regards,<br/><strong>${organizerName || 'The Tournament Team'}</strong>`)}
    `, '#ef4444, #f87171');
    return this.send(to, `Tournament Update - ${tournamentName}`, html, `Cut missed email sent to ${to} for ${tournamentName}`);
  }
}
