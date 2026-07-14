import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CacheModule } from '../../common/cache/cache.module';
import { JwtStrategy } from '../../common/guards/jwt.strategy';
import { JobsModule } from '../jobs/jobs.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    PassportModule,
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
          : {
              v1: jwtSecret,
            };
        
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
    JobsModule,
    CacheModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
