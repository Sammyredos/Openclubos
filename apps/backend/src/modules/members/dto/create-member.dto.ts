import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  MinLength,
} from 'class-validator';
import { MemberStatus, UserRole } from '@prisma/client';

export class CreateMemberDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;

  @IsOptional()
  @IsNumber()
  handicap?: number;

  @IsOptional()
  @IsString()
  clubId?: string;

  @IsOptional()
  @IsString()
  profilePhoto?: string;
}
