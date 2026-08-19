import { randomUUID } from 'crypto';
import * as path from 'path';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import * as Sentry from '@sentry/nestjs';
import { SentryModule } from '@sentry/nestjs/setup';
import { redisStore } from 'cache-manager-ioredis-yet';
import * as dotenv from 'dotenv';
import { LoggerModule } from 'nestjs-pino';
import { CacheModule } from './common/cache/cache.module';
import { ClubGuard } from './common/guards/club.guard';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { BullBoardAuthMiddleware } from './common/middleware/bull-board-auth.middleware';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { PrismaModule } from './common/prisma.module';
import { SecretsService } from './common/services/secrets.service';
import { AuthModule } from './modules/auth/auth.module';
import { ClubsModule } from './modules/clubs/clubs.module';
import { OrganizersModule } from './modules/organizers/organizers.module';
import { MembersModule } from './modules/members/members.module';
import { SuperAdminDashboardModule } from './modules/super-admin-dashboard/super-admin-dashboard.module';
import { TournamentsModule } from './modules/tournaments/tournaments.module';
import { RegistrationsModule } from './modules/registrations/registrations.module';
import { ScoresModule } from './modules/scores/scores.module';
import { CoursesModule } from './modules/courses/courses.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { HealthModule } from './modules/health/health.module';
import { EmailModule } from './modules/email/email.module';
import { SendchampModule } from './modules/sendchamp/sendchamp.module';
import { ResendModule } from './modules/resend/resend.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';


import { validate } from './config/env.validation';

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
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl =
          configService.get<string>('CACHE_REDIS_URL') ||
          configService.get<string>('REDIS_URL') ||
          'redis://localhost:6379';
        return {
          throttlers: [{ ttl: 60000, limit: 100 }],
          storage: new ThrottlerStorageRedisService(redisUrl),
        };
      },
    }),
    NestCacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl =
          configService.get<string>('CACHE_REDIS_URL') ||
          configService.get<string>('REDIS_URL') ||
          'redis://localhost:6379';
        if (!redisUrl) {
          throw new Error('FATAL ERROR: CACHE_REDIS_URL or REDIS_URL environment variable is not defined.');
        }
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
    BullBoardModule.forRoot({
      route: '/api/queues',
      adapter: ExpressAdapter,
    }),
    HealthModule,
    EmailModule,
    SendchampModule,
    ResendModule,
    SubscriptionsModule,
    PaymentsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const currentKeyId =
          configService.get<string>('JWT_CURRENT_KEY_ID') || 'v1';
        const keysJson = configService.get<string>('JWT_KEYS');
        const jwtSecret = configService.get<string>('JWT_SECRET');

        if (!keysJson && !jwtSecret) {
          throw new Error('FATAL ERROR: JWT_SECRET or JWT_KEYS environment variable is not defined.');
        }

        const keys = keysJson
          ? JSON.parse(keysJson)
          : { v1: jwtSecret };

        const secret = keys[currentKeyId];
        if (!secret) {
          throw new Error(`FATAL ERROR: JWT secret not found for key ID: ${currentKeyId}`);
        }

        return {
          secret,
          signOptions: {
            expiresIn: '1d',
            header: { kid: currentKeyId, alg: 'HS256' },
          },
        };
      },
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req, res) => {
          const id = req.headers['x-correlation-id'] || req.headers['x-request-id'] || randomUUID();
          res.setHeader('X-Correlation-Id', id);
          res.setHeader('X-Request-Id', id);
          return id;
        },
        customProps: (req) => ({
          correlationId: req.headers['x-correlation-id'] || req.headers['x-request-id'],
          sentryTrace: req.headers['sentry-trace'],
        }),
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
    SecretsService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
    consumer.apply(BullBoardAuthMiddleware).forRoutes('/queues', '/api/queues', 'api/queues');
  }
}
