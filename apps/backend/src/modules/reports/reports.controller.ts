import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportActionDto } from './dto/report-action.dto';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { SkipClubGuard } from '../../common/guards/club.guard';

@Controller('reports')
@SkipClubGuard()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('user')
  @UseGuards(OptionalJwtAuthGuard)
  async createReport(
    @Body(new ValidationPipe({ whitelist: false, forbidNonWhitelisted: false, transform: false })) dto: any,
    @Request() req: any,
  ) {
    const xUserId = req.headers ? (req.headers['x-user-id'] as string) : undefined;
    return this.reportsService.createReport(dto, req.user, xUserId);
  }

  @Get('user')
  @UseGuards(OptionalJwtAuthGuard)
  async findAllReports(
    @Query('status') status?: string,
  ) {
    return this.reportsService.findAllReports(status);
  }

  @Patch('user/:id/action')
  @UseGuards(OptionalJwtAuthGuard)
  async executeAction(
    @Param('id') id: string,
    @Body() dto: ReportActionDto,
    @Request() req: any,
  ) {
    return this.reportsService.executeAction(id, dto, req.user);
  }

  @Delete('user/:id')
  @UseGuards(OptionalJwtAuthGuard)
  async deleteReport(
    @Param('id') id: string,
  ) {
    return this.reportsService.deleteReport(id);
  }
}
