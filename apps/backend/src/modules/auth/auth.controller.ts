import {
  Controller,
  Get,
  Post,
  Body,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
  Headers,
  Param,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/guards/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthService } from './auth.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterOrganizationDto } from './dto/register-organization.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  me(@Request() req: any) {
    return req.user;
  }

  @Post('me/ai-usage/tournament-desc/increment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async incrementAITournamentDescUsage(@Request() req: any) {
    return this.authService.incrementAITournamentDescUsage(req.user.id);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('register-organization')
  async registerOrganization(
    @Body()
    dto: import('./dto/register-organization.dto').RegisterOrganizationDto,
  ) {
    return this.authService.registerOrganization(dto);
  }

  @Post('validate-organization')
  @HttpCode(HttpStatus.OK)
  async validateOrganization(@Body() body: { organizationName: string }) {
    return this.authService.validateOrganizationUniqueness(
      body.organizationName,
    );
  }

  @Post('validate-admin')
  @HttpCode(HttpStatus.OK)
  async validateAdmin(
    @Body()
    body: {
      adminEmail?: string;
      adminPhone?: string;
      adminFirstName?: string;
      adminMiddleName?: string;
      adminLastName?: string;
    },
  ) {
    return this.authService.validateAdminUniqueness(
      body.adminEmail,
      body.adminPhone,
      body.adminFirstName,
      body.adminMiddleName,
      body.adminLastName,
    );
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    
    const result = await this.authService.login(user);
    
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days or session default
    });
    
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() body: { refreshToken: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.refresh(body.refreshToken);
    
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    
    return result;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req: any,
    @Headers('authorization') auth: string,
    @Body() body: { refreshToken?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const accessToken = auth?.replace('Bearer ', '');
    await this.authService.logout(
      req.user.userId,
      accessToken,
      body.refreshToken,
    );
    
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });
    
    return { success: true, message: 'Logged out successfully' };
  }

  @Get('force-clear-cookie')
  async forceClearCookie(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });
    // Also try to clear the lax/strict ones just in case the browser distinguishes them by sameSite (some older browsers do)
    res.clearCookie('accessToken', { httpOnly: true, secure: true, sameSite: 'strict', path: '/' });
    res.clearCookie('accessToken', { httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
    
    return res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000/login');
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    await this.authService.verifyEmail(verifyEmailDto.token);
    return { success: true, message: 'Email verified successfully' };
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
  ) {
    await this.authService.resendVerification(resendVerificationDto.email);
    return { success: true, message: 'Verification email sent' };
  }

  @Post('create-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.authService.createAdmin(createAdminDto);
  }

  /**
   * POST /api/auth/forgot-password
   * Body: { email: string }
   * Always returns success to prevent email enumeration.
   * Sends a reset link to the user's email if the account exists.
   * FRONTEND_URL env var controls the base URL in the reset link.
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: { email: string }) {
    await this.authService.initiatePasswordReset(body.email).catch(() => null);
    return {
      message: 'If this email is registered, a reset link has been sent.',
    };
  }

  /**
   * POST /api/auth/reset-password
   * Body: { token: string, newPassword: string }
   * Verifies the JWT reset token and updates the user's password.
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    await this.authService.resetPassword(body.token, body.newPassword);
    return { success: true, message: 'Password has been reset successfully.' };
  }

  /**
   * GET /api/auth/invite/:token
   * Public endpoint to fetch invite details.
   */
  @Get('invite/:token')
  async getInviteDetails(@Param('token') token: string) {
    return this.authService.getInviteDetails(token);
  }

  /**
   * POST /api/auth/accept-invite
   * Body: { token: string, password: string, firstName?: string, lastName?: string, middleName?: string }
   * Public endpoint — no auth guard required.
   * Validates the invite token, sets the user's password, activates the account,
   * and returns JWT tokens for immediate login.
   */
  @Post('accept-invite')
  @HttpCode(HttpStatus.OK)
  async acceptInvite(
    @Body()
    body: {
      token: string;
      password: string;
      firstName?: string;
      lastName?: string;
      middleName?: string;
    },
  ) {
    return this.authService.acceptInvite(
      body.token,
      body.password,
      body.firstName,
      body.lastName,
      body.middleName,
    );
  }
}
