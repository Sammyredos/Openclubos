import {
  ClubPlan as OrganizerPlan,
  ClubStatus as OrganizerStatus,
} from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateOrganizerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(OrganizerStatus)
  status?: OrganizerStatus;

  @IsOptional()
  @IsEnum(OrganizerPlan)
  plan?: OrganizerPlan;

  @IsOptional()
  @IsString()
  adminName?: string;

  @IsOptional()
  @IsEmail()
  adminEmail?: string;
}
