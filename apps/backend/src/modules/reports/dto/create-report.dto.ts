import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateReportDto {
  @IsOptional()
  reporterId?: any;

  @IsOptional()
  reporterName?: any;

  @IsOptional()
  reporterEmail?: any;

  @IsOptional()
  reportedId?: any;

  @IsOptional()
  reportedName?: any;

  @IsOptional()
  reportedClub?: any;

  @IsOptional()
  reportedHcp?: any;

  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsOptional()
  details?: any;

  @IsOptional()
  id?: any;

  @IsOptional()
  status?: any;

  @IsOptional()
  createdAt?: any;

  [key: string]: any;
}
