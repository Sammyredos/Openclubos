import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsArray, IsInt } from 'class-validator';
import { CreateTournamentDto } from './create-tournament.dto';

export class UpdateTournamentDto extends PartialType(CreateTournamentDto) {
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  lockedGroupingsDays?: number[];
}
