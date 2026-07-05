import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/guards/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SuperAdminDashboardService } from './super-admin-dashboard.service';

@Controller('super-admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SuperAdminDashboardController {
  constructor(private readonly dashboard: SuperAdminDashboardService) {}

  @Get('stats')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(5000) // 5 seconds cache
  stats() {
    return this.dashboard.stats();
  }

  @Get('revenue-trend')
  revenueTrend(@Query('year') year?: string) {
    const y = year ? Number(year) : new Date().getFullYear();
    return this.dashboard.revenueTrend(
      Number.isFinite(y) ? y : new Date().getFullYear(),
    );
  }

  @Get('club-growth')
  clubGrowth(@Query('year') year?: string) {
    const y = year ? Number(year) : new Date().getFullYear();
    return this.dashboard.clubGrowth(
      Number.isFinite(y) ? y : new Date().getFullYear(),
    );
  }

  @Get('organizer-growth')
  organizerGrowth(@Query('year') year?: string) {
    const y = year ? Number(year) : new Date().getFullYear();
    return this.dashboard.clubGrowth(
      Number.isFinite(y) ? y : new Date().getFullYear(),
    );
  }

  @Get('age-demographics')
  ageDemographics() {
    return this.dashboard.ageDemographics();
  }

  @Get('top-clubs')
  topClubs(@Query('range') range?: string) {
    return this.dashboard.topClubs(range);
  }

  @Get('top-organizers')
  topOrganizers(@Query('range') range?: string) {
    return this.dashboard.topClubs(range);
  }

  @Get('top-locations')
  topLocations() {
    return this.dashboard.topLocations();
  }

  @Get('activity')
  activity() {
    return this.dashboard.activity();
  }

  @Get('alerts')
  alerts() {
    return this.dashboard.alerts();
  }
}
