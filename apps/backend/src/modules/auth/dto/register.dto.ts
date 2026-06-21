import { Gender } from '@prisma/client';
import {
  IsEmail,
  IsString,
  MinLength,
  IsNumber,
  Min,
  IsOptional,
  IsUUID,
  IsEnum,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsUUID()
  clubId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  handicap?: number;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
}
