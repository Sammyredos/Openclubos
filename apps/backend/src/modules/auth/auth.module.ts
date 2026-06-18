import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from '../../common/guards/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JobsModule } from '../jobs/jobs.module';
import { CacheModule } from '../../common/cache/cache.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const currentKeyId = configService.get<string>('JWT_CURRENT_KEY_ID') || 'v1';
        const keysJson = configService.get<string>('JWT_KEYS');
        const keys = keysJson ? JSON.parse(keysJson) : { v1: configService.get<string>('JWT_SECRET') || 'super-secret-key' };
        return {
          secret: keys[currentKeyId] || configService.get<string>('JWT_SECRET') || 'super-secret-key',
          signOptions: {
            expiresIn: '15m',
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
