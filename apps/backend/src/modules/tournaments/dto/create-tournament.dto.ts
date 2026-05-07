import { 
  IsString, 
  IsDateString, 
  IsOptional, 
  IsEnum, 
  IsNumber, 
  IsArray, 
  Min, 
  Max, 
  IsUUID 
} from 'class-validator';
import { TournamentStatus } from '@openclubos/types';

export class CreateTournamentDto {
  @IsString()
  name: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(TournamentStatus)
  status?: TournamentStatus;

  @IsUUID()
  clubId: string;

  @IsUUID()
  courseId: string;

  // Configuration
  @IsOptional()
  @IsNumber()
  @Min(0)
  entryFee?: number;

  @IsOptional()
  @IsNumber()
  minHandicap?: number;

  @IsOptional()
  @IsNumber()
  maxHandicap?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  playerTypes?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxPlayers?: number;

  @IsOptional()
  @IsDateString()
  registrationDeadline?: string;
}
