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
    return this.registrationsService.register(req.user.userId, dto);
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
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    const role = req.user?.role as UserRole | undefined;
    const userClubId = req.user?.clubId as string | undefined;
    const effectiveClubId = role === UserRole.CLUB_ADMIN ? userClubId : clubId;
    return this.registrationsService.findAll({
      clubId: effectiveClubId,
      paymentStatus,
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

  @Patch(':id/payment')
  confirmPayment(
    @Param('id') id: string,
    @Body('paymentReference') paymentReference: string,
  ) {
    return this.registrationsService.confirmPayment(id, paymentReference);
  }
}
