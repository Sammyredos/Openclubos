import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/guards/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { EmailService } from './email.service';

/**
 * Email testing controller — restricted to SUPER_ADMIN only.
 * Use these endpoints to verify email templates during local development.
 */
@Controller('email')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  /**
   * POST /api/email/test-welcome
   * Body: { to: string, firstName?: string }
   */
  @Post('test-welcome')
  @HttpCode(200)
  async testWelcome(@Body() body: { to: string; firstName?: string }) {
    const result = await this.emailService.sendWelcome(
      body.to,
      body.firstName || 'Test User',
    );
    return { success: true, ...result };
  }

  /**
   * POST /api/email/test-reset
   * Body: { to: string }
   */
  @Post('test-reset')
  @HttpCode(200)
  async testReset(@Body() body: { to: string }) {
    const result = await this.emailService.sendPasswordReset(
      body.to,
      'test-token-abc123',
      'http://localhost:3000/reset-password',
    );
    return { success: true, ...result };
  }

  /**
   * POST /api/email/test-registration
   * Body: { to: string, tournamentName?: string, status?: string }
   */
  @Post('test-registration')
  @HttpCode(200)
  async testRegistration(
    @Body() body: { to: string; tournamentName?: string; status?: string },
  ) {
    const result = await this.emailService.sendRegistrationConfirmation(
      body.to,
      body.tournamentName || 'Test Tournament',
      body.status || 'APPROVED',
      new Date().toISOString(),
    );
    return { success: true, ...result };
  }

  /**
   * POST /api/email/test-reminder
   * Body: { to: string, tournamentName?: string }
   */
  @Post('test-reminder')
  @HttpCode(200)
  async testReminder(@Body() body: { to: string; tournamentName?: string }) {
    const result = await this.emailService.sendTournamentReminder(
      body.to,
      body.tournamentName || 'Test Tournament',
      new Date().toISOString(),
      'Test Golf Course',
    );
    return { success: true, ...result };
  }

  /**
   * POST /api/email/test-payment
   * Body: { to: string, amount?: number, tournamentName?: string }
   */
  @Post('test-payment')
  @HttpCode(200)
  async testPayment(
    @Body() body: { to: string; amount?: number; tournamentName?: string },
  ) {
    const result = await this.emailService.sendPaymentReceipt(
      body.to,
      body.tournamentName || 'Test Tournament',
      body.amount || 25000,
      'NGN',
      `TEST-${Date.now()}`,
    );
    return { success: true, ...result };
  }

  /**
   * POST /api/email/test-admin-credentials
   * Body: { to: string, clubName?: string }
   */
  @Post('test-admin-credentials')
  @HttpCode(200)
  async testAdminCredentials(@Body() body: { to: string; clubName?: string }) {
    const result = await this.emailService.sendAdminCredentials(
      body.to,
      body.clubName || 'Test Golf Club',
      body.to,
      'TempPass123!',
    );
    return { success: true, ...result };
  }

  /**
   * POST /api/email/test-security-alert
   * Body: { to: string, action?: string }
   */
  @Post('test-security-alert')
  @HttpCode(200)
  async testSecurityAlert(@Body() body: { to: string; action?: string }) {
    const result = await this.emailService.sendSecurityAlert(
      body.to,
      body.action || 'Login from new device — Chrome on Windows',
    );
    return { success: true, ...result };
  }
}
