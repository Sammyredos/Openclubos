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
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/guards/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateScoreDto } from './dto/create-score.dto';
import { ScoresService } from './scores.service';

@Controller('scores')
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  upsert(@Request() req: any, @Body() createScoreDto: CreateScoreDto) {
    return this.scoresService.upsertScore(createScoreDto, req.user);
  }

  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  confirm(@Request() req: any, @Param('id') id: string) {
    return this.scoresService.confirmScore(id, req.user);
  }

  @Patch(':id/override')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLUB_ADMIN)
  override(@Param('id') id: string, @Body() updateData: any) {
    return this.scoresService.adminOverride(id, updateData);
  }

  @Get('group/:groupId')
  findByGroup(
    @Param('groupId') groupId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.scoresService.findByGroup(
      groupId,
      skip ? Number(skip) : undefined,
      take ? Number(take) : undefined,
    );
  }

  @Get('tournament/:tournamentId/leaderboard-data')
  getPublicLeaderboardData(@Param('tournamentId') tournamentId: string) {
    return this.scoresService.getPublicLeaderboardData(tournamentId);
  }

  @Get('tournament/:tournamentId')
  findByTournament(
    @Param('tournamentId') tournamentId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.scoresService.findByTournament(
      tournamentId,
      skip ? Number(skip) : undefined,
      take ? Number(take) : undefined,
    );
  }

  @Get('verify/:tournamentId/:userId')
  verifyScorecard(
    @Param('tournamentId') tournamentId: string,
    @Param('userId') userId: string,
    @Query('groupId') groupId?: string,
  ) {
    return this.scoresService.verifyScorecard(tournamentId, userId, groupId);
  }
}
