import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  MinLength,
  Min,
} from 'class-validator';
import { MemberStatus, UserRole, Gender } from '@prisma/client';

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
  @Min(0)
  handicap: number = 0;

  @IsOptional()
  @IsString()
  dob?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  clubId?: string;

  @IsOptional()
  @IsString()
  clubName?: string;

  @IsOptional()
  @IsString()
  clubAddress?: string;

  @IsOptional()
  @IsString()
  orgState?: string;

  @IsOptional()
  @IsString()
  orgCity?: string;

  @IsOptional()
  @IsString()
  clubLogo?: string;

  @IsOptional()
  @IsString()
  profilePhoto?: string;

  @IsOptional()
  @IsEnum(['PRO', 'BASIC'])
  clubPlan?: 'PRO' | 'BASIC';

  @IsOptional()
  @IsString()
  clubType?: string;

  @IsOptional()
  @IsString()
  clubWebsite?: string;

  @IsOptional()
  @IsString()
  clubAbout?: string;

  @IsOptional()
  @IsString()
  clubFacebook?: string;

  @IsOptional()
  @IsString()
  clubInstagram?: string;

  @IsOptional()
  @IsString()
  clubCountry?: string;
}
