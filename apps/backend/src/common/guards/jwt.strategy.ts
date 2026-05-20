import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MemberStatus, UserRole } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret-key',
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || user.deletedAt != null) throw new UnauthorizedException();
    if (user.status === MemberStatus.SUSPENDED)
      throw new UnauthorizedException('ACCOUNT_SUSPENDED');
    if (user.status === MemberStatus.EXPIRED)
      throw new UnauthorizedException('ACCOUNT_EXPIRED');
    if (user.status !== MemberStatus.ACTIVE) throw new UnauthorizedException();
    if (payload?.uat != null) {
      const tokenUat = Number(payload.uat);
      if (!Number.isFinite(tokenUat)) throw new UnauthorizedException();
      const currentUat = user.updatedAt.getTime();
      if (tokenUat !== currentUat)
        throw new UnauthorizedException('TOKEN_REVOKED');
    } else if (payload?.iat != null) {
      const tokenIatSeconds = Number(payload.iat);
      if (!Number.isFinite(tokenIatSeconds)) throw new UnauthorizedException();
      const tokenIatMs = tokenIatSeconds * 1000;
      const currentUat = user.updatedAt.getTime();
      if (tokenIatMs < currentUat)
        throw new UnauthorizedException('TOKEN_REVOKED');
    }
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role === UserRole.STAFF ? UserRole.PLAYER : payload.role,
      clubId: payload.clubId,
      name: user.firstName || user.lastName ? `${user.firstName} ${user.lastName}`.trim() : undefined,
    };
  }
}
