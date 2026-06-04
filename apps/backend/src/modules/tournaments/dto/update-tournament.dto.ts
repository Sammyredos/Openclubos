import { PartialType } from '@nestjs/swagger';
import { CreateTournamentDto } from './create-tournament.dto';

import { IsOptional, IsArray, IsInt } from 'class-validator';

export class UpdateTournamentDto extends PartialType(CreateTournamentDto) {
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  lockedGroupingsDays?: number[];
}
