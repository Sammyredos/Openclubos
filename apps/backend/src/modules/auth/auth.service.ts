import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { MemberStatus, UserRole } from '@prisma/client';
import { JobsService } from '../jobs/jobs.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly jobsService: JobsService,
  ) {}

  async register(registerDto: RegisterDto) {
    registerDto.email = registerDto.email?.trim().toLowerCase();
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: { equals: registerDto.email, mode: 'insensitive' },
        deletedAt: null,
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const { name, ...rest } = registerDto;
    const nameParts = (name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

    const user = await this.prisma.user.create({
      data: {
        ...rest,
        firstName,
        lastName,
        password: hashedPassword,
        handicap: registerDto.handicap ?? 0,
        gender: registerDto.gender ?? undefined,
      },
    });

    // Queue welcome email (fire-and-forget)
    if (user.email) {
      this.jobsService.queueEmail('WELCOME', user.email, {
        firstName: user.firstName || 'there',
      }).catch(err => console.error('Failed to queue welcome email:', err));
    }

    const { password, ...result } = user;
    return result;
  }

  async registerOrganization(dto: import('./dto/register-organization.dto').RegisterOrganizationDto) {
    const normalizedEmail = dto.adminEmail?.trim().toLowerCase();
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' },
        deletedAt: null,
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.adminPassword, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      // Create the organization
      const club = await tx.club.create({
        data: {
          name: dto.organizationName,
          type: dto.organizationType === "Other" && dto.customOrganizationType 
            ? dto.customOrganizationType 
            : dto.organizationType,
          logo: dto.organizationLogo || null,
          status: 'ACTIVE',
          plan: 'BASIC',
        },
      });

      // Create the club admin
      const lastName = dto.adminMiddleName 
        ? `${dto.adminMiddleName.trim()} ${dto.adminLastName.trim()}`.replace(/\s+/g, ' ').trim()
        : dto.adminLastName.trim();

      const admin = await tx.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          firstName: dto.adminFirstName,
          lastName: lastName,
          role: UserRole.CLUB_ADMIN,
          status: MemberStatus.ACTIVE,
          clubId: club.id,
        },
      });

      return admin;
    });

    if (user.email) {
      this.jobsService.queueEmail('WELCOME', user.email, {
        firstName: user.firstName || 'there',
      }).catch(err => console.error('Failed to queue welcome email:', err));
    }

    const { password, ...result } = user;
    return result;
  }

  async validateUser(email: string, pass: string): Promise<any> {
    let user: any;
    const normalizedEmail = email?.trim().toLowerCase();
    try {
      user = await this.prisma.user.findFirst({
        where: {
          email: { equals: normalizedEmail, mode: 'insensitive' },
          deletedAt: null,
        },
      });
    } catch {
      throw new ServiceUnavailableException('DATABASE_UNAVAILABLE');
    }
    if (user && user.status === MemberStatus.SUSPENDED) {
      throw new UnauthorizedException('ACCOUNT_SUSPENDED');
    }
    if (user && user.status === MemberStatus.EXPIRED) {
      throw new UnauthorizedException('ACCOUNT_EXPIRED');
    }
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const effectiveRole =
      user.role === UserRole.STAFF ? UserRole.PLAYER : user.role;
    const payload = {
      email: user.email,
      sub: user.id,
      role: effectiveRole,
      clubId: user.clubId,
      uat: user.updatedAt ? new Date(user.updatedAt).getTime() : undefined,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        role: effectiveRole,
        clubId: user.clubId,
        email: user.email,
        name: user.firstName || user.lastName ? `${user.firstName} ${user.lastName}`.trim() : undefined,
      },
    };
  }

  async initiatePasswordReset(email: string): Promise<void> {
    // Silently look up user — do NOT throw if not found (prevents email enumeration)
    const normalizedEmail = email?.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' },
        deletedAt: null,
      },
    });
    if (!user) return;

    // Generate a short-lived JWT reset token (1 hour)
    const resetToken = this.jwtService.sign(
      { sub: user.id, type: 'password_reset' },
      { expiresIn: '1h' },
    );

    // Store hashed token so it can't be reused if DB is compromised
    const hashedToken = await bcrypt.hash(resetToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: hashedToken },
    });

    // Build reset URL — FRONTEND_URL should be set in .env (e.g. http://localhost:3000)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Queue password reset email (fire-and-forget)
    this.jobsService.queueEmail('PASSWORD_RESET', user.email, {
      resetToken,
      resetUrl,
    }).catch(err => console.error('Failed to queue password reset email:', err));
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Verify the JWT reset token
    let payload: any;
    try {
      try { payload = this.jwtService.verify(token); } catch(e) { console.error('JWT Verify Error:', e); throw e; }
    } catch {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (payload.type !== 'password_reset' || !payload.sub) {
      throw new UnauthorizedException('Invalid reset token');
    }

    // Look up user and verify the stored token hash matches
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.passwordResetToken) {
      throw new UnauthorizedException('Reset token has already been used');
    }

    const tokenValid = await bcrypt.compare(token, user.passwordResetToken);
    if (!tokenValid) {
      throw new UnauthorizedException('Invalid reset token');
    }

    // Hash new password and clear the reset token
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
      },
    });
  }
}
