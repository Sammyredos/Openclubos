import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { SkipClubGuard } from '../../common/guards/club.guard';

@Controller('notifications')
@SkipClubGuard()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getNotifications(@Request() req: any, @Query() query: any) {
    const userId = (req.headers ? (req.headers['x-user-id'] as string) : undefined) || req.user?.id;
    return this.notificationsService.getUserNotifications(userId, query);
  }

  @Post('send')
  @UseGuards(OptionalJwtAuthGuard)
  async sendNotification(@Body() dto: any) {
    return this.notificationsService.createNotification(dto);
  }

  @Patch(':id/read')
  @UseGuards(OptionalJwtAuthGuard)
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    const userId = (req.headers ? (req.headers['x-user-id'] as string) : undefined) || req.user?.id;
    return this.notificationsService.markAsRead(id, userId);
  }

  @Post('mark-all-read')
  @UseGuards(OptionalJwtAuthGuard)
  async markAllAsRead(@Request() req: any) {
    const userId = (req.headers ? (req.headers['x-user-id'] as string) : undefined) || req.user?.id;
    return this.notificationsService.markAllAsRead(userId);
  }

  @Post('device-token')
  @UseGuards(OptionalJwtAuthGuard)
  async saveDeviceToken(@Body() dto: any, @Request() req: any) {
    const userId = (req.headers ? (req.headers['x-user-id'] as string) : undefined) || req.user?.id;
    return this.notificationsService.saveDeviceToken(dto, userId);
  }
}
