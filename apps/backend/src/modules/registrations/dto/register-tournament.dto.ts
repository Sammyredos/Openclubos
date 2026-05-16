import { IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';

export class RegisterTournamentDto {
  @IsUUID()
  tournamentId: string;

  @IsString()
  @IsOptional()
  playerType?: string; // MEMBER, EXTERNAL, GUEST

  @IsString()
  @IsOptional()
  paymentReference?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  paymentStatus?: string;
}
