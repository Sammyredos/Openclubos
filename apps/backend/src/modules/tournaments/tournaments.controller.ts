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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';

@Controller('tournaments')
@UseGuards(JwtAuthGuard)
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Post()
  create(@Body() createTournamentDto: CreateTournamentDto) {
    return this.tournamentsService.create(createTournamentDto);
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
    const tournament = await this.tournamentsService.findOne(id);
    const role = req.user?.role as UserRole;
    const userClubId = req.user?.clubId;

    if (role === UserRole.CLUB_ADMIN && tournament.clubId !== userClubId) {
      throw new ForbiddenException('You do not have access to this tournament');
    }
    return tournament;
  }

  @Patch(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateTournamentDto: UpdateTournamentDto,
  ) {
    const tournament = await this.tournamentsService.findOne(id);
    const role = req.user?.role as UserRole;
    const userClubId = req.user?.clubId;

    if (role === UserRole.CLUB_ADMIN && tournament.clubId !== userClubId) {
      throw new ForbiddenException('You do not have access to this tournament');
    }
    return this.tournamentsService.update(id, updateTournamentDto);
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    const tournament = await this.tournamentsService.findOne(id);
    const role = req.user?.role as UserRole;
    const userClubId = req.user?.clubId;

    if (role === UserRole.CLUB_ADMIN && tournament.clubId !== userClubId) {
      throw new ForbiddenException('You do not have access to this tournament');
    }
    return this.tournamentsService.remove(id);
  }
}
