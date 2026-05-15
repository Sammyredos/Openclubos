import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { RegisterTournamentDto } from './dto/register-tournament.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PaymentStatus, RegistrationStatus, UserRole } from '@prisma/client';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/guards/roles.decorator';

@Controller('registrations')
@UseGuards(JwtAuthGuard)
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post()
  register(@Request() req: any, @Body() dto: RegisterTournamentDto) {
    const role = req.user?.role as UserRole;
    const isAdmin = role === UserRole.SUPER_ADMIN || role === UserRole.CLUB_ADMIN;
    const userId = isAdmin && dto.userId ? dto.userId : req.user.userId;
    return this.registrationsService.register(userId, dto, isAdmin);
  }

  @Get('my')
  getMyRegistrations(@Request() req: any) {
    return this.registrationsService.getMyRegistrations(req.user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
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
    @Query('skip') skip?: number,
    @Query('take') take?: number,
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
      skip,
      take,
    });
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: RegistrationStatus,
  ) {
    return this.registrationsService.updateStatus(id, status);
  }

  @Patch(':id/strokes')
  addStrokes(@Param('id') id: string, @Body('delta') delta: number) {
    return this.registrationsService.addStrokes(id, Number(delta));
  }

  @Patch(':id/strokes/clear')
  clearStrokes(@Param('id') id: string) {
    return this.registrationsService.clearStrokes(id);
  }

  @Patch(':id/payment')
  confirmPayment(
    @Param('id') id: string,
    @Body('paymentReference') paymentReference: string,
  ) {
    return this.registrationsService.confirmPayment(id, paymentReference);
  }
}
