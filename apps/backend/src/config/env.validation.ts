import { plainToInstance } from 'class-transformer';
import { IsEnum, IsString, IsOptional, validateSync } from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  REDIS_URL: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  FRONTEND_URL: string;

  @IsOptional()
  @IsString()
  BACKEND_PORT?: string;

  @IsOptional()
  @IsString()
  PORT?: string;

  @IsOptional()
  @IsString()
  FCM_SERVER_KEY?: string;

  @IsOptional()
  @IsString()
  PAYSTACK_SECRET_KEY?: string;

  @IsOptional()
  @IsString()
  FLUTTERWAVE_SECRET_KEY?: string;

  @IsOptional()
  @IsString()
  AWS_S3_BUCKET?: string;

  @IsOptional()
  @IsString()
  AWS_ACCESS_KEY?: string;

  @IsOptional()
  @IsString()
  AWS_SECRET_KEY?: string;

  @IsOptional()
  @IsString()
  R2_ACCESS_KEY?: string;

  @IsOptional()
  @IsString()
  R2_SECRET_KEY?: string;

  @IsOptional()
  @IsString()
  R2_BUCKET?: string;

  @IsOptional()
  @IsString()
  R2_ENDPOINT?: string;

  @IsOptional()
  @IsString()
  CDN_BASE_URL?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
