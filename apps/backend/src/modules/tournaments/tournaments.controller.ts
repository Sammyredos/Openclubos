import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/guards/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SkipClubGuard } from '../../common/guards/club.guard';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { TournamentsService } from './tournaments.service';

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLUB_ADMIN, UserRole.SUPER_ADMIN)
  create(@Body() createTournamentDto: CreateTournamentDto) {
    return this.tournamentsService.create(createTournamentDto);
  }

  @Get('check-name')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async checkName(
    @Request() req: any,
    @Query('name') name: string,
    @Query('clubId') clubId?: string,
    @Query('excludeId') excludeId?: string,
  ) {
    if (!name) return { isUnique: false };
    const role = req.user?.role as UserRole | undefined;
    const effectiveClubId = role === UserRole.CLUB_ADMIN ? req.user?.clubId : clubId;
    if (!effectiveClubId) {
      return { isUnique: true };
    }
    const isUnique = await this.tournamentsService.checkName(name, effectiveClubId, excludeId);
    return { isUnique };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll(
    @Request() req: any,
    @Query('clubId') clubId?: string,
    @Query('organizerId') organizerId?: string,
    @Query('status') status?: string,
  ) {
    const role = req.user?.role as UserRole | undefined;
    const userClubId = req.user?.clubId as string | undefined;

    const isOrgRole = role && ([
      UserRole.CLUB_ADMIN,
      UserRole.MARKER,
      UserRole.MANAGER,
      UserRole.STAFF,
    ] as UserRole[]).includes(role);

    const effectiveClubId = isOrgRole ? userClubId : (clubId ?? organizerId);

    return this.tournamentsService.findAll({ clubId: effectiveClubId, status });
  }

  @Get('paged')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAllPaged(
    @Request() req: any,
    @Query('clubId') clubId?: string,
    @Query('organizerId') organizerId?: string,
    @Query('status') status?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    const role = req.user?.role as UserRole | undefined;
    const userClubId = req.user?.clubId as string | undefined;

    const isOrgRole = role && ([
      UserRole.CLUB_ADMIN,
      UserRole.MARKER,
      UserRole.MANAGER,
      UserRole.STAFF,
    ] as UserRole[]).includes(role);

    const effectiveClubId = isOrgRole ? userClubId : (clubId ?? organizerId);

    return this.tournamentsService.findAllPaged({
      clubId: effectiveClubId,
      status,
      skip,
      take,
    });
  }

  @Get(':id')
  @SkipClubGuard()
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.tournamentsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AuditLog('Tournament', 'UPDATE')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateTournamentDto: UpdateTournamentDto,
  ) {
    return this.tournamentsService.update(id, updateTournamentDto);
  }

  @Post(':id/groupings/email')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLUB_ADMIN, UserRole.SUPER_ADMIN)
  async publishGroupingsEmail(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.tournamentsService.publishGroupingsEmail(id, dto);
  }

  @Get(':id/groupings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getGroupings(
    @Param('id') id: string,
    @Query('day') day?: string,
  ) {
    return this.tournamentsService.getGroupings(id, day ? parseInt(day, 10) : 1);
  }

  @Post(':id/groupings/move')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLUB_ADMIN, UserRole.SUPER_ADMIN)
  async movePlayerInGroupings(
    @Param('id') id: string,
    @Body() dto: { registrationId: string; targetGroupId: string | null; day: number },
  ) {
    return this.tournamentsService.movePlayerInGroupings(id, dto.registrationId, dto.targetGroupId, dto.day);
  }

  @Post(':id/groupings/generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLUB_ADMIN, UserRole.SUPER_ADMIN)
  async generateGroupings(
    @Param('id') id: string,
    @Query('day') day?: string,
    @Body('rule') rule?: string,
  ) {
    return this.tournamentsService.generateGroupings(id, day ? parseInt(day, 10) : 1, rule || 'RANDOM');
  }

  @Patch(':id/groupings/:groupId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLUB_ADMIN, UserRole.SUPER_ADMIN)
  async updateGroupingTime(
    @Param('id') id: string,
    @Param('groupId') groupId: string,
    @Body() dto: { name?: string; startTime?: string; day: number },
  ) {
    return this.tournamentsService.updateGroupingTime(id, groupId, dto);
  }

  @Delete(':id/groupings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLUB_ADMIN, UserRole.SUPER_ADMIN)
  async clearGroupings(
    @Param('id') id: string,
    @Query('day') day?: string,
  ) {
    return this.tournamentsService.clearGroupings(id, day ? parseInt(day, 10) : 1);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AuditLog('Tournament', 'DELETE')
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.tournamentsService.remove(id);
  }

  @Post(':id/apply-cut')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLUB_ADMIN, UserRole.SUPER_ADMIN)
  @AuditLog('Tournament', 'APPLY_CUT')
  async applyCut(@Request() req: any, @Param('id') id: string) {
    return this.tournamentsService.applyCut(id);
  }
}
