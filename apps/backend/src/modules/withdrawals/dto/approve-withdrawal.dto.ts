import { IsOptional, IsString } from 'class-validator';

export class ApproveWithdrawalDto {
  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
