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
}
