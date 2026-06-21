import {
  TournamentStatus,
  TournamentFormat,
  ScoringType,
  TournamentVisibility,
} from '@openclubos/types';
import {
  IsString,
  IsDateString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  Min,
  Max,
  IsUUID,
  IsBoolean,
} from 'class-validator';

export class CreateTournamentDto {
  // Step 1: Basic Details
  @IsString()
  name: string;

  @IsUUID()
  clubId: string;

  @IsUUID()
  courseId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  @IsString()
  location?: string;

  // Step 2: Schedule
  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsDateString()
  registrationOpenAt?: string;

  @IsOptional()
  @IsDateString()
  registrationCloseAt?: string;

  // Step 3: Format
  @IsOptional()
  @IsEnum(TournamentFormat)
  format?: TournamentFormat;

  @IsOptional()
  @IsEnum(ScoringType)
  scoringType?: ScoringType;

  @IsOptional()
  @IsNumber()
  holes?: number;

  // Step 4: Eligibility
  @IsOptional()
  @IsBoolean()
  allowRegisteredPlayers?: boolean;

  @IsOptional()
  @IsBoolean()
  allowGuests?: boolean;

  @IsOptional()
  @IsBoolean()
  allowExternalPlayers?: boolean;

  @IsOptional()
  @IsBoolean()
  hasHandicapRestriction?: boolean;

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

  // Cut Rules
  @IsOptional()
  @IsBoolean()
  enableCut?: boolean;

  @IsOptional()
  @IsNumber()
  cutAfterRound?: number;

  @IsOptional()
  @IsNumber()
  cutLine?: number;

  // Step 5: Player Limits
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxPlayers?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxPlayersPerGroup?: number;

  @IsOptional()
  @IsBoolean()
  enableWaitlist?: boolean;

  // Step 6: Payments
  @IsOptional()
  @IsBoolean()
  requiresPayment?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  entryFee?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDateString()
  paymentDeadline?: string;

  @IsOptional()
  @IsBoolean()
  isRefundable?: boolean;

  // Step 7: Divisions
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  divisions?: string[];

  // Step 8: Grouping Settings
  @IsOptional()
  @IsBoolean()
  autoGrouping?: boolean;

  @IsOptional()
  @IsString()
  teeStartTime?: string;

  @IsOptional()
  @IsNumber()
  teeIntervalMinutes?: number;

  // Step 9: Scoring Settings
  @IsOptional()
  @IsBoolean()
  enableLiveScoring?: boolean;

  @IsOptional()
  @IsBoolean()
  requireMarkerVerification?: boolean;

  @IsOptional()
  @IsBoolean()
  enableHoleScoring?: boolean;

  // Step 10: Publication Settings
  @IsOptional()
  @IsBoolean()
  publishImmediately?: boolean;

  @IsOptional()
  @IsEnum(TournamentVisibility)
  visibility?: TournamentVisibility;

  @IsOptional()
  @IsEnum(TournamentStatus)
  status?: TournamentStatus;
}
