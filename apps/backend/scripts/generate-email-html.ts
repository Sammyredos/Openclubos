import { EmailService } from '../src/modules/email/email.service';
import * as fs from 'fs';
import * as path from 'path';

async function generateSamples() {
  const htmlSnippets: string[] = [];
  
  // Mock MailerService
  const mockMailerService = {
    sendMail: async (options: any) => {
      htmlSnippets.push(`
        <div style="margin-bottom: 50px; border: 2px solid #ccc; padding: 20px; border-radius: 10px; background: white; max-width: 800px; margin-left: auto; margin-right: auto;">
          <h2 style="font-family: sans-serif; color: #333; margin-top: 0; padding-bottom: 10px; border-bottom: 1px solid #eee;">
            Subject: ${options.subject}
          </h2>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
            ${options.html}
          </div>
        </div>
      `);
      return { messageId: 'mock-id' };
    }
  };

  // Instantiate service directly, bypassing Nest DI
  const emailService = new EmailService(mockMailerService as any);
  
  const to = 'test@openclubos.com';
  const name = 'Samuel';
  const tournament = 'Lagos Masters 2026';
  const club = 'Ikoyi Golf Club';

  // Run all 15 template generators
  await emailService.sendWelcome(to, name);
  await emailService.sendPasswordReset(to, 'token123', 'http://localhost:3000/reset');
  await emailService.sendRegistrationConfirmation(to, tournament, 'PENDING', new Date().toISOString());
  await emailService.sendRegistrationApproved(to, tournament);
  await emailService.sendRegistrationRejected(to, tournament);
  await emailService.sendWaitlistNotification(to, tournament);
  await emailService.sendPaymentReceipt(to, tournament, 150000, 'NGN', 'TXN-987654321');
  await emailService.sendTournamentReminder(to, tournament, new Date().toISOString(), 'Main Course');
  await emailService.sendTournamentStarted(to, tournament);
  await emailService.sendTournamentCompleted(to, tournament);
  await emailService.sendAdminCredentials(to, club, to, 'TempPass123!');
  await emailService.sendAccountSuspended(to, club);
  await emailService.sendAccountReactivated(to, club);
  await emailService.sendMemberCreated(to, name, 'WelcomePass123!');
  await emailService.sendSecurityAlert(to, 'New login from Mac OS Chrome');

  const finalHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Email Template Samples</title>
      <meta charset="utf-8">
      <style>body { padding: 40px; background: #e5e5e5; }</style>
    </head>
    <body>
      <h1 style="font-family: sans-serif; text-align: center; margin-bottom: 40px;">All 15 OpenClubOS Email Templates</h1>
      ${htmlSnippets.join('\n')}
    </body>
    </html>
  `;

  // Write directly to an artifact
  const artifactPath = path.join(__dirname, '../../../../.gemini/antigravity/brain/61f6c569-a48d-421a-ad3d-f59f0ad71620/artifacts/email_templates_preview.html');
  
  // Ensure directory exists
  const dir = path.dirname(artifactPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(artifactPath, finalHtml);
  console.log('Done! Generated ' + artifactPath);
}

generateSamples().catch(console.error);
