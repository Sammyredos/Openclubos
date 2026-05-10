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

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
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

    const user = await this.prisma.user.create({
      data: {
        ...registerDto,
        password: hashedPassword,
      },
    });

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
      },
    };
  }
  async initiatePasswordReset(email: string): Promise<void> {
    // Silently look up user — do NOT throw if not found (prevents email enumeration)
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return;

    // TODO: generate a reset token, save to DB, and send reset email via email service
    // e.g.: await this.emailService.sendPasswordReset(user.email, resetToken);
  }
}
