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
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { TournamentsService } from './tournaments.service';

@Controller('tournaments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Post()
  @Roles(UserRole.CLUB_ADMIN, UserRole.SUPER_ADMIN)
  create(@Body() createTournamentDto: CreateTournamentDto) {
    return this.tournamentsService.create(createTournamentDto);
  }

  @Get('check-name')
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
  findAll(
    @Request() req: any,
    @Query('clubId') clubId?: string,
    @Query('organizerId') organizerId?: string,
    @Query('status') status?: string,
  ) {
    const role = req.user?.role as UserRole | undefined;
    const userClubId = req.user?.clubId as string | undefined;

    const effectiveClubId =
      role === UserRole.CLUB_ADMIN ? userClubId : (clubId ?? organizerId);

    return this.tournamentsService.findAll({ clubId: effectiveClubId, status });
  }

  @Get('paged')
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

    const effectiveClubId =
      role === UserRole.CLUB_ADMIN ? userClubId : (clubId ?? organizerId);

    return this.tournamentsService.findAllPaged({
      clubId: effectiveClubId,
      status,
      skip,
      take,
    });
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.tournamentsService.findOne(id);
  }

  @Patch(':id')
  @AuditLog('Tournament', 'UPDATE')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateTournamentDto: UpdateTournamentDto,
  ) {
    return this.tournamentsService.update(id, updateTournamentDto);
  }

  @Post(':id/groupings/email')
  @Roles(UserRole.CLUB_ADMIN, UserRole.SUPER_ADMIN)
  async publishGroupingsEmail(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.tournamentsService.publishGroupingsEmail(id, dto);
  }

  @Delete(':id')
  @AuditLog('Tournament', 'DELETE')
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.tournamentsService.remove(id);
  }

  @Post(':id/apply-cut')
  @Roles(UserRole.CLUB_ADMIN, UserRole.SUPER_ADMIN)
  @AuditLog('Tournament', 'APPLY_CUT')
  async applyCut(@Request() req: any, @Param('id') id: string) {
    return this.tournamentsService.applyCut(id);
  }
}
