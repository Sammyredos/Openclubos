import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { PaymentStatus, RegistrationStatus, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SkipClubGuard } from '../../common/guards/club.guard';
import { Roles } from '../../common/guards/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RegisterTournamentDto } from './dto/register-tournament.dto';
import { InvitePlayerDto } from './dto/invite-player.dto';
import { RegistrationsService } from './registrations.service';

@Controller('registrations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post()
  register(@Request() req: any, @Body() dto: RegisterTournamentDto) {
    const role = req.user?.role as UserRole;
    const isAdmin =
      role === UserRole.SUPER_ADMIN ||
      role === UserRole.CLUB_ADMIN ||
      role === UserRole.MANAGER ||
      role === UserRole.STAFF;
    const userId = isAdmin && dto.userId ? dto.userId : req.user.id;
    return this.registrationsService.register(userId, dto, isAdmin);
  }

  @Post('invite')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLUB_ADMIN, UserRole.STAFF, UserRole.MANAGER)
  @SkipClubGuard()
  invitePlayer(@Request() req: any, @Body() dto: InvitePlayerDto) {
    return this.registrationsService.invitePlayer(dto, req.user);
  }

  @Get('my')
  getMyRegistrations(
    @Request() req: any,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.registrationsService.getMyRegistrations(
      req.user.id,
      skip,
      take,
    );
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLUB_ADMIN)
  getStats(
    @Request() req: any,
    @Query('clubId') clubId?: string,
  ) {
    const role = req.user?.role as UserRole | undefined;
    const userClubId = req.user?.clubId as string | undefined;
    const effectiveClubId = role === UserRole.CLUB_ADMIN ? userClubId : clubId;
    return this.registrationsService.getStats(effectiveClubId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLUB_ADMIN)
  findAll(
    @Request() req: any,
    @Query('clubId') clubId?: string,
    @Query('organizerId') organizerId?: string,
    @Query('tournamentId') tournamentId?: string,
    @Query('q') q?: string,
    @Query('status') status?: RegistrationStatus,
    @Query('disqualified') disqualified?: string,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
    @Query('userId') userId?: string,
    @Query('excludeWaitlist') excludeWaitlist?: string,
    @Query('waitlistOnly') waitlistOnly?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('orderBy') orderBy?: 'registeredAt' | 'updatedAt',
  ) {
    const role = req.user?.role as UserRole | undefined;
    const userClubId = req.user?.clubId as string | undefined;
    const effectiveClubId =
      role === UserRole.CLUB_ADMIN ? userClubId : (clubId ?? organizerId);
    return this.registrationsService.findAll({
      clubId: effectiveClubId,
      tournamentId,
      q,
      status,
      disqualified:
        disqualified === 'true'
          ? true
          : disqualified === 'false'
            ? false
            : undefined,
      paymentStatus,
      userId,
      excludeWaitlist: excludeWaitlist === 'true',
      waitlistOnly: waitlistOnly === 'true',
      skip,
      take,
      orderBy,
    });
  }

  @Patch(':id/status')
  async updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body('status') status: RegistrationStatus,
  ) {
    const registration = await this.registrationsService.findOne(id);
    const role = req.user?.role as UserRole;
    const userClubId = req.user?.clubId;

    if (
      role === UserRole.CLUB_ADMIN &&
      registration.tournament.clubId !== userClubId
    ) {
      throw new ForbiddenException(
        'You do not have access to this registration',
      );
    }
    return this.registrationsService.updateStatus(id, status);
  }

  @Patch(':id/strokes')
  async addStrokes(
    @Request() req: any,
    @Param('id') id: string,
    @Body('delta') delta: number,
  ) {
    const registration = await this.registrationsService.findOne(id);
    const role = req.user?.role as UserRole;
    const userClubId = req.user?.clubId;

    if (
      role === UserRole.CLUB_ADMIN &&
      registration.tournament.clubId !== userClubId
    ) {
      throw new ForbiddenException(
        'You do not have access to this registration',
      );
    }
    return this.registrationsService.addStrokes(id, Number(delta));
  }

  @Patch(':id/strokes/clear')
  async clearStrokes(@Request() req: any, @Param('id') id: string) {
    const registration = await this.registrationsService.findOne(id);
    const role = req.user?.role as UserRole;
    const userClubId = req.user?.clubId;

    if (
      role === UserRole.CLUB_ADMIN &&
      registration.tournament.clubId !== userClubId
    ) {
      throw new ForbiddenException(
        'You do not have access to this registration',
      );
    }
    return this.registrationsService.clearStrokes(id);
  }

  @Patch(':id/payment')
  async confirmPayment(
    @Request() req: any,
    @Param('id') id: string,
    @Body('paymentReference') paymentReference: string,
  ) {
    const registration = await this.registrationsService.findOne(id);
    const role = req.user?.role as UserRole;
    const userClubId = req.user?.clubId;

    if (
      role === UserRole.CLUB_ADMIN &&
      registration.tournament.clubId !== userClubId
    ) {
      throw new ForbiddenException(
        'You do not have access to this registration',
      );
    }
    return this.registrationsService.confirmPayment(id, paymentReference);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLUB_ADMIN)
  async remove(@Request() req: any, @Param('id') id: string) {
    const registration = await this.registrationsService.findOne(id);
    const role = req.user?.role as UserRole;
    const userClubId = req.user?.clubId;

    if (
      role === UserRole.CLUB_ADMIN &&
      registration.tournament.clubId !== userClubId
    ) {
      throw new ForbiddenException(
        'You do not have access to this registration',
      );
    }
    return this.registrationsService.remove(id);
  }
}
