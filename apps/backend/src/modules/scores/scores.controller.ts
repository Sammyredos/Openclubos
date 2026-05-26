import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ScoresService } from './scores.service';
import { CreateScoreDto } from './dto/create-score.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/guards/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('scores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Post()
  upsert(@Request() req: any, @Body() createScoreDto: CreateScoreDto) {
    return this.scoresService.upsertScore(createScoreDto, req.user);
  }

  @Post(':id/confirm')
  confirm(@Request() req: any, @Param('id') id: string) {
    return this.scoresService.confirmScore(id, req.user);
  }

  @Patch(':id/override')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLUB_ADMIN)
  override(@Param('id') id: string, @Body() updateData: any) {
    return this.scoresService.adminOverride(id, updateData);
  }

  @Get('group/:groupId')
  findByGroup(
    @Param('groupId') groupId: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.scoresService.findByGroup(groupId, skip, take);
  }

  @Get('tournament/:tournamentId')
  findByTournament(
    @Param('tournamentId') tournamentId: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.scoresService.findByTournament(tournamentId, skip, take);
  }
}
