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
import { CreateAdminDto } from './dto/create-admin.dto';
import { MemberStatus, UserRole } from '@prisma/client';
import { JobsService } from '../jobs/jobs.service';
import { CacheService } from '../../common/cache/cache.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly jobsService: JobsService,
    private readonly cacheService: CacheService,
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

    const verificationToken = this.jwtService.sign(
      { type: 'email_verification' },
      { expiresIn: '24h', subject: 'NEW_USER' }
    );
    const hashedToken = await bcrypt.hash(verificationToken, 10);

    const user = await this.prisma.user.create({
      data: {
        ...rest,
        firstName,
        lastName,
        password: hashedPassword,
        handicap: registerDto.handicap ?? 0,
        gender: registerDto.gender ?? undefined,
        role: UserRole.PLAYER,
        // @ts-ignore: Prisma schema is updated, IDE might need TS server restart
        emailVerificationToken: hashedToken,
        // @ts-ignore
        emailVerified: false,
      },
    });

    // Update token subject to actual user ID
    const userVerificationToken = this.jwtService.sign(
      { type: 'email_verification', sub: user.id },
      { expiresIn: '24h' }
    );
    const userHashedToken = await bcrypt.hash(userVerificationToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      // @ts-ignore
      data: { emailVerificationToken: userHashedToken }
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyUrl = `${frontendUrl}/verify-email?token=${userVerificationToken}`;

    // Queue welcome/verification email
    if (user.email) {
      this.jobsService.queueEmail('WELCOME', user.email, {
        firstName: user.firstName || 'there',
        verifyUrl,
      }).catch(err => console.error('Failed to queue welcome email:', err));
    }

    const { password, ...result } = user;
    return result;
  }

  async verifyEmail(token: string): Promise<void> {
    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    if (payload.type !== 'email_verification' || !payload.sub) {
      throw new UnauthorizedException('Invalid token format');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    // @ts-ignore
    if (!user || !user.emailVerificationToken) {
      throw new UnauthorizedException('Token has already been used or user not found');
    }

    // @ts-ignore
    const tokenValid = await bcrypt.compare(token, user.emailVerificationToken);
    if (!tokenValid) {
      throw new UnauthorizedException('Invalid verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        // @ts-ignore
        emailVerified: true,
        // @ts-ignore
        emailVerificationToken: null,
      },
    });
  }

  async createAdmin(dto: CreateAdminDto) {
    const normalizedEmail = dto.email?.trim().toLowerCase();
    const existingUser = await this.prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' }, deletedAt: null },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role, // Admin assigns role directly
        clubId: dto.clubId,
        // @ts-ignore
        emailVerified: true, // Auto-verify admin-created accounts
      },
    });

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

    const existingClub = await this.prisma.club.findFirst({
      where: {
        name: { equals: dto.organizationName.trim(), mode: 'insensitive' },
        deletedAt: null,
      },
    });

    if (existingClub) {
      throw new ConflictException('An organization with this name already exists');
    }

    if (dto.adminPhone) {
      const existingPhoneUser = await this.prisma.user.findFirst({
        where: {
          phone: dto.adminPhone.trim(),
          deletedAt: null,
        },
      });

      if (existingPhoneUser) {
        throw new ConflictException('A user with this phone number already exists');
      }
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
          country: dto.country || null,
          state: dto.state || null,
          city: dto.city || null,
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
          phone: dto.adminPhone,
          role: UserRole.CLUB_ADMIN,
          clubId: club.id,
          status: MemberStatus.ACTIVE,
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

  async validateOrganizationUniqueness(organizationName: string): Promise<{ available: boolean; message?: string }> {
    const existingClub = await this.prisma.club.findFirst({
      where: {
        name: { equals: organizationName.trim(), mode: 'insensitive' },
        deletedAt: null,
      },
    });

    if (existingClub) {
      return { available: false, message: 'An organization with this name already exists' };
    }
    return { available: true };
  }

  async validateAdminUniqueness(email?: string, phone?: string): Promise<{ available: boolean; message?: string; field?: string }> {
    if (email) {
      const existingEmail = await this.prisma.user.findFirst({
        where: { email: { equals: email.trim(), mode: 'insensitive' }, deletedAt: null },
      });
      if (existingEmail) {
        return { available: false, message: 'A user with this email already exists', field: 'adminEmail' };
      }
    }
    
    if (phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: { phone: phone.trim(), deletedAt: null },
      });
      if (existingPhone) {
        return { available: false, message: 'A user with this phone number already exists', field: 'adminPhone' };
      }
    }

    return { available: true };
  }

  async validateUser(email: string, pass: string): Promise<any> {
    let user: any;
    const normalizedEmail = email?.trim().toLowerCase();
    
    // 1. Check if Account is Locked Out
    const lockoutKey = `auth:lockout:${normalizedEmail}`;
    const failedKey = `auth:failed:${normalizedEmail}`;

    const isLocked = await this.cacheService.get<string>(lockoutKey);
    if (isLocked) {
      throw new UnauthorizedException('ACCOUNT_LOCKED_15_MIN');
    }

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
    
    if (user && !user.emailVerified) {
      throw new UnauthorizedException('EMAIL_NOT_VERIFIED');
    }

    if (user && (await bcrypt.compare(pass, user.password))) {
      // Success! Clear failed attempts.
      await this.cacheService.del(failedKey);
      
      const { password, ...result } = user;
      return result;
    }

    // Invalid Credentials Flow: Increment Failure Counter
    const failedAttempts = parseInt(await this.cacheService.get<string>(failedKey) || '0', 10) + 1;
    if (failedAttempts >= 5) {
      await this.cacheService.set(lockoutKey, '1', 900); // Lock for 15 mins
      await this.cacheService.del(failedKey);
      throw new UnauthorizedException('ACCOUNT_LOCKED_15_MIN');
    } else {
      await this.cacheService.set(failedKey, failedAttempts.toString(), 3600); // Rolling 1 hr
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }
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
    
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    // Store in Redis with 7 days TTL (7 * 24 * 60 * 60 = 604800 seconds)
    await this.cacheService.set(`auth:refresh:${refreshHash}`, user.id, 604800);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        role: effectiveRole,
        clubId: user.clubId,
        email: user.email,
        name: user.firstName || user.lastName ? `${user.firstName} ${user.lastName}`.trim() : undefined,
      },
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const userId = await this.cacheService.get<string>(`auth:refresh:${refreshHash}`);

    if (!userId) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Token Rotation: Delete old refresh token immediately
    await this.cacheService.del(`auth:refresh:${refreshHash}`);

    // Verify user is still active
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt != null || user.status !== MemberStatus.ACTIVE) {
      throw new UnauthorizedException('Account is no longer active');
    }

    // Re-issue tokens
    return this.login(user);
  }

  async logout(userId: string, accessToken: string, refreshToken?: string) {
    // Blacklist access token for its remaining lifetime (or a safe max like 24h)
    const accessHash = crypto.createHash('sha256').update(accessToken).digest('hex');
    await this.cacheService.set(`auth:blacklist:${accessHash}`, '1', 86400); // 24 hours

    // Remove refresh token if provided
    if (refreshToken) {
      const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await this.cacheService.del(`auth:refresh:${refreshHash}`);
    }
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
