import { Module } from '@nestjs/common';
import { SuperAdminDashboardController } from './super-admin-dashboard.controller';
import { SuperAdminDashboardService } from './super-admin-dashboard.service';

@Module({
  controllers: [SuperAdminDashboardController],
  providers: [SuperAdminDashboardService],
  exports: [SuperAdminDashboardService],
})
export class SuperAdminDashboardModule {}

