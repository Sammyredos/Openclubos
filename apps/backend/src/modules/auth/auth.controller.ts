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
} from '@nestjs/common';
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
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.authService.login(user);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req: any,
    @Headers('authorization') auth: string,
    @Body() body: { refreshToken?: string },
  ) {
    const accessToken = auth?.replace('Bearer ', '');
    await this.authService.logout(
      req.user.userId,
      accessToken,
      body.refreshToken,
    );
    return { success: true, message: 'Logged out successfully' };
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
