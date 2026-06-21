import * as crypto from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { MemberStatus, UserRole } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private cacheService: CacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: (
        request: any,
        rawJwtToken: any,
        done: (err: any, secret: string | undefined) => void,
      ) => {
        try {
          const decoded = jwt.decode(rawJwtToken, { complete: true });
          if (
            !decoded ||
            typeof decoded === 'string' ||
            !decoded.header ||
            !decoded.header.kid
          ) {
            done(new Error('No kid in token header'), undefined);
            return;
          }
          const kid = decoded.header.kid;
          const keysJson = configService.get<string>('JWT_KEYS');
          const keys = keysJson
            ? JSON.parse(keysJson)
            : { v1: configService.get<string>('JWT_SECRET') };
          const secret = keys[kid];
          if (!secret) {
            done(new Error('Invalid kid'), undefined);
            return;
          }
          done(null, secret);
        } catch (e) {
          done(e, undefined);
        }
      },
      passReqToCallback: true as const,
    });
  }

  async validate(req: any, payload: any) {
    // Check if token is blacklisted in Redis
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (token) {
      const accessHash = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
      const isBlacklisted = await this.cacheService.get(
        `auth:blacklist:${accessHash}`,
      );
      if (isBlacklisted) {
        throw new UnauthorizedException('TOKEN_REVOKED');
      }
    }

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
      name:
        user.firstName || user.lastName
          ? `${user.firstName} ${user.lastName}`.trim()
          : undefined,
    };
  }
}
