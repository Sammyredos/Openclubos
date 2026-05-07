import { IsEmail, IsString, IsOptional, IsEnum, IsNumber, MinLength } from 'class-validator';
import { UserRole, MemberStatus } from '@openclubos/types';

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
