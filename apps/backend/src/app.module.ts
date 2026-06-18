import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { CacheModule } from './common/cache/cache.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClubsModule } from './modules/clubs/clubs.module';
import { OrganizersModule } from './modules/organizers/organizers.module';
import { MembersModule } from './modules/members/members.module';
import { SuperAdminDashboardModule } from './modules/super-admin-dashboard/super-admin-dashboard.module';
import { TournamentsModule } from './modules/tournaments/tournaments.module';
import { RegistrationsModule } from './modules/registrations/registrations.module';
import { ScoresModule } from './modules/scores/scores.module';
import { PrismaModule } from './common/prisma.module';
import { CoursesModule } from './modules/courses/courses.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { HealthModule } from './modules/health/health.module';
import { EmailModule } from './modules/email/email.module';
import { JwtModule } from '@nestjs/jwt';
import { ClubGuard } from './common/guards/club.guard';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';

import * as Sentry from '@sentry/nestjs';
import { SentryModule } from '@sentry/nestjs/setup';
import { LoggerModule } from 'nestjs-pino';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { validate } from './config/env.validation';
import { randomUUID } from 'crypto';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
  });
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
      validate,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 100 }],
    }),
    NestCacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
        return {
          store: await redisStore({
            url: redisUrl,
          }),
        };
      },
    }),
    CacheModule,
    PrismaModule,
    AuthModule,
    ClubsModule,
    OrganizersModule,
    MembersModule,
    SuperAdminDashboardModule,
    TournamentsModule,
    RegistrationsModule,
    ScoresModule,
    CoursesModule,
    UploadsModule,
    JobsModule,
    HealthModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const currentKeyId = configService.get<string>('JWT_CURRENT_KEY_ID') || 'v1';
        const keysJson = configService.get<string>('JWT_KEYS');
        const keys = keysJson ? JSON.parse(keysJson) : { v1: configService.get<string>('JWT_SECRET') };
        return {
          secret: keys[currentKeyId] || configService.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: '15m',
            header: { kid: currentKeyId, alg: 'HS256' },
          },
        };
      },
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req, res) => {
          const id = req.headers['x-request-id'] || randomUUID();
          res.setHeader('X-Request-Id', id);
          return id;
        },
        redact: [
          'req.headers.authorization',
          'req.body.password',
          'req.body.token',
        ],
      },
    }),
    ...(process.env.SENTRY_DSN ? [SentryModule.forRoot()] : []),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ClubGuard,
    },
    {
      provide: require('@nestjs/core').APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule {}
