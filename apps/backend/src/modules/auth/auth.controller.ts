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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { RegisterOrganizationDto } from './dto/register-organization.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/guards/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Request() req: any) {
    return req.user;
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('register-organization')
  async registerOrganization(@Body() dto: import('./dto/register-organization.dto').RegisterOrganizationDto) {
    return this.authService.registerOrganization(dto);
  }

  @Post('validate-organization')
  @HttpCode(HttpStatus.OK)
  async validateOrganization(@Body() body: { organizationName: string }) {
    return this.authService.validateOrganizationUniqueness(body.organizationName);
  }

  @Post('validate-admin')
  @HttpCode(HttpStatus.OK)
  async validateAdmin(@Body() body: { adminEmail?: string; adminPhone?: string }) {
    return this.authService.validateAdminUniqueness(body.adminEmail, body.adminPhone);
  }

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
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req: any,
    @Headers('authorization') auth: string,
    @Body() body: { refreshToken?: string },
  ) {
    const accessToken = auth?.replace('Bearer ', '');
    await this.authService.logout(req.user.userId, accessToken, body.refreshToken);
    return { success: true, message: 'Logged out successfully' };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() body: { token: string }) {
    await this.authService.verifyEmail(body.token);
    return { success: true, message: 'Email verified successfully' };
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
  async resetPassword(
    @Body() body: { token: string; newPassword: string },
  ) {
    await this.authService.resetPassword(body.token, body.newPassword);
    return { success: true, message: 'Password has been reset successfully.' };
  }
}
