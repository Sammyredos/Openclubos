import * as crypto from 'crypto';
import { randomBytes } from 'crypto';
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ServiceUnavailableException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MemberStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CacheService } from '../../common/cache/cache.service';
import { PrismaService } from '../../common/prisma.service';
import { JobsService } from '../jobs/jobs.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { RegisterDto } from './dto/register.dto';

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

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    const { name, ...rest } = registerDto;
    const nameParts = (name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

    const token = randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        ...rest,
        firstName,
        lastName,
        password: hashedPassword,
        handicap: registerDto.handicap ?? 0,
        gender: registerDto.gender ?? undefined,
        role: UserRole.PLAYER,
        emailVerificationToken: token,
        emailVerificationExpires,
        emailVerified: false,
      },
    });

    if (user.email) {
      await this.jobsService.queueEmail('emailVerification', user.email, {
        firstName: user.firstName,
        verifyUrl: `${process.env.FRONTEND_URL}/verify-email?token=${token}`,
      });
    }

    const { password, ...result } = user;
    return result;
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }
    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires < new Date()
    ) {
      throw new BadRequestException('Verification token has expired');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });
  }

  async resendVerification(email: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        email: { equals: email.trim(), mode: 'insensitive' },
        emailVerified: false,
        deletedAt: null,
      },
    });

    if (!user) {
      return;
    }

    const token = randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: token,
        emailVerificationExpires,
      },
    });

    if (user.email) {
      await this.jobsService.queueEmail('emailVerification', user.email, {
        firstName: user.firstName,
        verifyUrl: `${process.env.FRONTEND_URL}/verify-email?token=${token}`,
      });
    }
  }

  async createAdmin(dto: CreateAdminDto) {
    const normalizedEmail = dto.email?.trim().toLowerCase();
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' },
        deletedAt: null,
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role, // Admin assigns role directly
        clubId: dto.clubId,
        emailVerified: true, // Auto-verify admin-created accounts
      },
    });

    const { password, ...result } = user;
    return result;
  }

  async registerOrganization(
    dto: import('./dto/register-organization.dto').RegisterOrganizationDto,
  ) {
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
      throw new ConflictException(
        'An organization with this name already exists',
      );
    }

    if (dto.adminPhone) {
      const existingPhoneUser = await this.prisma.user.findFirst({
        where: {
          phone: dto.adminPhone.trim(),
          deletedAt: null,
        },
      });

      if (existingPhoneUser) {
        throw new ConflictException(
          'A user with this phone number already exists',
        );
      }
    }

    const hashedPassword = await bcrypt.hash(dto.adminPassword, 12);
    const token = randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await this.prisma.$transaction(async (tx) => {
      // Create the organization
      const club = await tx.club.create({
        data: {
          name: dto.organizationName,
          type:
            dto.organizationType === 'Other' && dto.customOrganizationType
              ? dto.customOrganizationType
              : dto.organizationType,
          logo: dto.organizationLogo || null,
          status: 'ACTIVE',
          plan: 'BASIC',
          country: dto.country || null,
          state: dto.state || null,
          city: dto.city || null,
          address: dto.address || null,
        },
      });

      // Create the club admin
      const lastName = dto.adminMiddleName
        ? `${dto.adminMiddleName.trim()} ${dto.adminLastName.trim()}`
            .replace(/\s+/g, ' ')
            .trim()
        : dto.adminLastName.trim();

      const admin = await tx.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          firstName: dto.adminFirstName,
          lastName: lastName,
          phone: dto.adminPhone,
          gender: dto.adminGender
            ? (dto.adminGender.toUpperCase() as any)
            : null,
          role: UserRole.CLUB_ADMIN,
          clubId: club.id,
          status: MemberStatus.ACTIVE,
          emailVerificationToken: token,
          emailVerificationExpires,
          emailVerified: false,
        },
      });

      return admin;
    });

    if (user.email) {
      await this.jobsService.queueEmail('emailVerification', user.email, {
        firstName: user.firstName,
        verifyUrl: `${process.env.FRONTEND_URL}/verify-email?token=${token}`,
      });
    }

    const { password, ...result } = user;
    return result;
  }

  async validateOrganizationUniqueness(
    organizationName: string,
  ): Promise<{ available: boolean; message?: string }> {
    const existingClub = await this.prisma.club.findFirst({
      where: {
        name: { equals: organizationName.trim(), mode: 'insensitive' },
        deletedAt: null,
      },
    });

    if (existingClub) {
      return {
        available: false,
        message: 'An organization with this name already exists',
      };
    }
    return { available: true };
  }

  async validateAdminUniqueness(
    email?: string,
    phone?: string,
    firstName?: string,
    middleName?: string,
    lastName?: string,
  ): Promise<{ available: boolean; message?: string; field?: string }> {
    if (email) {
      const existingEmail = await this.prisma.user.findFirst({
        where: {
          email: { equals: email.trim(), mode: 'insensitive' },
          deletedAt: null,
        },
      });
      if (existingEmail) {
        return {
          available: false,
          message: 'A user with this email already exists',
          field: 'adminEmail',
        };
      }
    }

    if (phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: { phone: phone.trim(), deletedAt: null },
      });
      if (existingPhone) {
        return {
          available: false,
          message: 'A user with this phone number already exists',
          field: 'adminPhone',
        };
      }
    }

    if (firstName && lastName) {
      const dbLastName = middleName
        ? `${middleName.trim()} ${lastName.trim()}`.replace(/\s+/g, ' ').trim()
        : lastName.trim();

      const existingName = await this.prisma.user.findFirst({
        where: {
          firstName: { equals: firstName.trim(), mode: 'insensitive' },
          lastName: { equals: dbLastName, mode: 'insensitive' },
          deletedAt: null,
        },
      });

      if (existingName) {
        return {
          available: false,
          message: 'User with Same Name Exist',
          field: 'adminFirstName',
        };
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

    if (user && !user.emailVerified && user.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException('Email not verified');
    }

    if (user && (await bcrypt.compare(pass, user.password))) {
      // Success! Clear failed attempts.
      await this.cacheService.del(failedKey);

      const { password, ...result } = user;
      return result;
    }

    // Invalid Credentials Flow: Increment Failure Counter
    const failedAttempts =
      parseInt((await this.cacheService.get<string>(failedKey)) || '0', 10) + 1;
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
    const refreshHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

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
        name:
          user.firstName || user.lastName
            ? `${user.firstName} ${user.lastName}`.trim()
            : undefined,
        profilePhoto: user.profilePhoto || undefined,
        gender: user.gender || undefined,
        managerScope: user.managerScope || undefined,
      },
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const refreshHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    const userId = await this.cacheService.get<string>(
      `auth:refresh:${refreshHash}`,
    );

    if (!userId) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Token Rotation: Delete old refresh token immediately
    await this.cacheService.del(`auth:refresh:${refreshHash}`);

    // Verify user is still active
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (
      !user ||
      user.deletedAt != null ||
      user.status !== MemberStatus.ACTIVE
    ) {
      throw new UnauthorizedException('Account is no longer active');
    }

    // Re-issue tokens
    return this.login(user);
  }

  async logout(userId: string, accessToken: string, refreshToken?: string) {
    // Blacklist access token for its remaining lifetime
    const accessHash = crypto
      .createHash('sha256')
      .update(accessToken)
      .digest('hex');
    const decoded: any = this.jwtService.decode(accessToken);
    const ttl =
      decoded && decoded.exp
        ? Math.max(0, decoded.exp - Math.floor(Date.now() / 1000))
        : 86400;
    await this.cacheService.set(`auth:blacklist:${accessHash}`, '1', ttl);

    // Remove refresh token if provided
    if (refreshToken) {
      const refreshHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');
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

    // Generate a cryptographically random single-use token (1 hour expiry)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);

    // Store tokenHash + expiry in DB
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: tokenHash,
        passwordResetExpires,
      },
    });

    // Build reset URL — FRONTEND_URL should be set in .env (e.g. http://localhost:3000)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Queue password reset email (fire-and-forget)
    this.jobsService
      .queueEmail('PASSWORD_RESET', user.email, {
        resetToken,
        resetUrl,
      })
      .catch((err) => {
        console.error('Failed to queue password reset email:', err);
      });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Invalid reset token');
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Look up user by the hashed token
    const user = await this.prisma.user.findFirst({
      where: { passwordResetToken: tokenHash },
    });

    if (!user || !user.passwordResetToken) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Check if token has expired
    if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
      throw new UnauthorizedException('Reset token has expired');
    }

    // Hash new password and clear the reset token
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        emailVerified: true, // Proves email ownership
      },
    });
  }

  async getInviteDetails(token: string) {
    if (!token) {
      throw new BadRequestException('Invitation token is required');
    }

    const user = await this.prisma.user.findFirst({
      where: { inviteToken: token, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Invalid or expired invitation token');
    }

    if (user.inviteTokenExpires && user.inviteTokenExpires < new Date()) {
      throw new NotFoundException('This invitation has expired');
    }

    return {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }

  async acceptInvite(
    token: string,
    newPassword: string,
    firstName?: string,
    lastName?: string,
    middleName?: string,
  ) {
    if (!token || !newPassword) {
      throw new BadRequestException('Token and password are required');
    }

    const user = await this.prisma.user.findFirst({
      where: { inviteToken: token, deletedAt: null },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired invitation token');
    }

    if (user.inviteTokenExpires && user.inviteTokenExpires < new Date()) {
      throw new UnauthorizedException(
        'This invitation has expired. Please ask your organizer to send a new invitation.',
      );
    }

    // Hash the new password and activate the account
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const updateData: any = {
      password: hashedPassword,
      status: MemberStatus.ACTIVE,
      inviteToken: null,
      inviteTokenExpires: null,
    };

    if (firstName) {
      const first = firstName.trim();
      const middle = middleName?.trim() || '';
      updateData.firstName = middle ? `${first} ${middle}` : first;
    }

    if (lastName) {
      updateData.lastName = lastName.trim();
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // Auto-login: return JWT tokens
    return this.login(updatedUser);
  }

  async incrementAITournamentDescUsage(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { aiTournamentDescCount: true, aiTournamentDescResetAt: true },
    });

    if (!user) throw new UnauthorizedException();

    const now = new Date();
    let currentCount = user.aiTournamentDescCount;
    let resetAt = user.aiTournamentDescResetAt;

    // Reset if penalty time has passed
    if (resetAt && now >= resetAt) {
      currentCount = 0;
      resetAt = null;
    }

    if (currentCount >= 2) {
      throw new BadRequestException('AI usage limit reached. Try again later.');
    }

    currentCount++;

    if (currentCount >= 2) {
      resetAt = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours from now
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        aiTournamentDescCount: currentCount,
        aiTournamentDescResetAt: resetAt,
      },
      select: { aiTournamentDescCount: true, aiTournamentDescResetAt: true },
    });

    return updatedUser;
  }
}
