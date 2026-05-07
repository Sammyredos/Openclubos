import { IsEmail, IsString, IsOptional, IsEnum, IsNumber, MinLength } from 'class-validator';
import { MemberStatus } from '@prisma/client';

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
  @IsEnum(MemberStatus)
  status?: MemberStatus;

  @IsOptional()
  @IsNumber()
  handicap?: number;

  @IsOptional()
  @IsString()
  clubId?: string;
}
