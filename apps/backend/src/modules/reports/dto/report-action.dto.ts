import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class ReportActionDto {
  @IsNotEmpty()
  @IsIn(['SUSPEND', 'WARN', 'DISMISS'])
  action: 'SUSPEND' | 'WARN' | 'DISMISS';

  @IsOptional()
  @IsString()
  notes?: string;
}
