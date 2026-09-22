import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushNotificationService } from './push-notification.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, PushNotificationService, PrismaService],
  exports: [NotificationsService, PushNotificationService],
})
export class NotificationsModule {}
