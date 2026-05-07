import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { ClubPlan, ClubStatus } from '@prisma/client';

export class UpdateClubDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(ClubStatus)
  status?: ClubStatus;

  @IsOptional()
  @IsEnum(ClubPlan)
  plan?: ClubPlan;

  @IsOptional()
  @IsString()
  adminName?: string;

  @IsOptional()
  @IsEmail()
  adminEmail?: string;
}
