import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';
import { CreateMemberDto } from './create-member.dto';

export class UpdateMemberDto extends PartialType(CreateMemberDto) {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
