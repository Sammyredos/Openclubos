import { PartialType } from '@nestjs/swagger';
import { UserRole, Gender } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { CreateMemberDto } from './create-member.dto';

export class UpdateMemberDto extends PartialType(CreateMemberDto) {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsNumber()
  @Min(0)
  handicap?: number;

  @IsOptional()
  @IsString()
  managerScope?: string;
}
