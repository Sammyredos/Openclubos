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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

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
