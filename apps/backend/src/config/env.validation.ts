import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsString,
  IsOptional,
  MinLength,
  Matches,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsString()
  @Matches(/^(postgres|postgresql):\/\/.+/, {
    message: 'DATABASE_URL must be a valid PostgreSQL connection URI (postgresql://...).',
  })
  DATABASE_URL: string;

  @IsOptional()
  @IsString()
  DIRECT_DATABASE_URL?: string;

  @IsOptional()
  @IsString()
  DATABASE_URL_REPLICA?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(redis|rediss):\/\/.+/, {
    message: 'REDIS_URL must be a valid Redis connection URI (redis://...).',
  })
  REDIS_URL?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(redis|rediss):\/\/.+/, {
    message: 'QUEUE_REDIS_URL must be a valid Redis connection URI (redis://...).',
  })
  QUEUE_REDIS_URL?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(redis|rediss):\/\/.+/, {
    message: 'CACHE_REDIS_URL must be a valid Redis connection URI (redis://...).',
  })
  CACHE_REDIS_URL?: string;

  @IsString()
  @MinLength(16, {
    message: 'JWT_SECRET must be at least 16 characters for cryptographic safety.',
  })
  JWT_SECRET: string;

  @IsString()
  FRONTEND_URL: string;

  @IsOptional()
  @IsString()
  GRPC_URL?: string;

  @IsOptional()
  @IsString()
  GRPC_AUTH_TOKEN?: string;

  @IsOptional()
  @IsString()
  ENABLE_BULL_BOARD?: string;

  @IsOptional()
  @IsString()
  BULL_BOARD_USER?: string;

  @IsOptional()
  @IsString()
  BULL_BOARD_PASS?: string;

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
