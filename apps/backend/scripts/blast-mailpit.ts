import { EmailService } from '../src/modules/email/email.service';
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

async function sendToMailpit() {
  // Read SMTP settings from .env (which defaults to Mailpit locally)
  const host = process.env.SMTP_HOST || 'localhost';
  const port = Number(process.env.SMTP_PORT) || 1025;
  const fromAddress = process.env.SMTP_FROM_ADDRESS || 'noreply@localhost';
  const fromName = process.env.SMTP_FROM_NAME || 'OpenClubOS';

  console.log(`Connecting to SMTP at ${host}:${port}...`);

  const transporter = nodemailer.createTransport({
    host,
    port,
    ignoreTLS: true,
    secure: false,
  });

  // Mock MailerService by wrapping nodemailer
  const mockMailerService = {
    sendMail: async (options: any) => {
      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      return { messageId: info.messageId };
    }
  };

  const emailService = new EmailService(mockMailerService as any);
  
  const to = 'test@openclubos.com';
  const name = 'Samuel';
  const tournament = 'Lagos Masters 2026';
  const club = 'Ikoyi Golf Club';

  console.log('Sending all 15 templates to Mailpit...');

  await emailService.sendWelcome(to, name);
  console.log('1/15 Welcome sent');
  await emailService.sendPasswordReset(to, 'token123', 'http://localhost:3000/reset');
  console.log('2/15 Password Reset sent');
  await emailService.sendRegistrationConfirmation(to, tournament, 'PENDING', new Date().toISOString());
  console.log('3/15 Registration Confirmation sent');
  await emailService.sendRegistrationApproved(to, tournament);
  console.log('4/15 Registration Approved sent');
  await emailService.sendRegistrationRejected(to, tournament);
  console.log('5/15 Registration Rejected sent');
  await emailService.sendWaitlistNotification(to, tournament);
  console.log('6/15 Waitlist Notification sent');
  await emailService.sendPaymentReceipt(to, tournament, 150000, 'NGN', 'TXN-987654321');
  console.log('7/15 Payment Receipt sent');
  await emailService.sendTournamentReminder(to, tournament, new Date().toISOString(), 'Main Course');
  console.log('8/15 Tournament Reminder sent');
  await emailService.sendTournamentStarted(to, tournament);
  console.log('9/15 Tournament Started sent');
  await emailService.sendTournamentCompleted(to, tournament);
  console.log('10/15 Tournament Completed sent');
  await emailService.sendAdminCredentials(to, club, to, 'TempPass123!');
  console.log('11/15 Admin Credentials sent');
  await emailService.sendAccountSuspended(to, club);
  console.log('12/15 Account Suspended sent');
  await emailService.sendAccountReactivated(to, club);
  console.log('13/15 Account Reactivated sent');
  await emailService.sendMemberCreated(to, name, 'WelcomePass123!');
  console.log('14/15 Member Created sent');
  await emailService.sendSecurityAlert(to, 'New login from Mac OS Chrome');
  console.log('15/15 Security Alert sent');

  console.log('\\nAll done! Open Mailpit at http://localhost:8025 to view them.');
}

sendToMailpit().catch(console.error);
