import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/guards/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { EmailService } from './email.service';

/**
 * Email testing controller — restricted to SUPER_ADMIN only.
 * Use these endpoints to verify Mailpit integration during local development.
 */
@Controller('email')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  /**
   * POST /api/email/test-reminder
   * Body: { to: string, tournamentName: string, startDate: string }
   */
  @Post('test-reminder')
  @HttpCode(200)
  async testReminder(
    @Body() body: { to: string; tournamentName: string; startDate: string },
  ) {
    const { to, tournamentName, startDate } = body;
    const result = await this.emailService.sendTournamentReminder(
      to,
      tournamentName || 'Test Tournament',
      startDate || new Date().toISOString(),
    );
    return { success: true, ...result };
  }

  /**
   * POST /api/email/test-registration
   * Body: { to: string, tournamentName: string, status: string }
   */
  @Post('test-registration')
  @HttpCode(200)
  async testRegistration(
    @Body() body: { to: string; tournamentName: string; status: string },
  ) {
    const { to, tournamentName, status } = body;
    const result = await this.emailService.sendRegistrationConfirmation(
      to,
      tournamentName || 'Test Tournament',
      status || 'APPROVED',
    );
    return { success: true, ...result };
  }

  /**
   * POST /api/email/test-payment
   * Body: { to: string, amount: number, tournamentName: string, reference: string }
   */
  @Post('test-payment')
  @HttpCode(200)
  async testPayment(
    @Body()
    body: {
      to: string;
      amount: number;
      tournamentName: string;
      reference: string;
    },
  ) {
    const { to, amount, tournamentName, reference } = body;
    const result = await this.emailService.sendPaymentReceipt(
      to,
      amount || 5000,
      tournamentName || 'Test Tournament',
      reference || `TEST-${Date.now()}`,
    );
    return { success: true, ...result };
  }
}
