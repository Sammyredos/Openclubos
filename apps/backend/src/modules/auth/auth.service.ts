import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { MemberStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
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
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null, status: MemberStatus.ACTIVE },
    });
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      clubId: user.clubId,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        role: user.role,
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
