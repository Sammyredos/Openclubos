import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { NotificationType, DevicePlatform } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getUserNotifications(userId?: string, query?: { skip?: number; take?: number; unreadOnly?: boolean | string }) {
    if (!userId) {
      return { items: [], notifications: [], total: 0, unreadCount: 0 };
    }

    // Exclude FRIEND_REQUEST and FRIEND_REQUEST_SENT notifications from the general feed.
    // These are managed exclusively by the friends system (GET /friends/requests) and
    // rendered via the dedicated friend request cards in the notifications screen.
    // Including them here causes them to re-appear after logout/login.
    const friendRequestFilter = {
      NOT: [
        { data: { path: ['type'], equals: 'FRIEND_REQUEST' } },
        { data: { path: ['type'], equals: 'FRIEND_REQUEST_SENT' } },
      ],
    };

    const where: any = { userId, ...friendRequestFilter };
    if (query?.unreadOnly === true || query?.unreadOnly === 'true') {
      where.isRead = false;
    }

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query?.skip ? Number(query.skip) : 0,
        take: query?.take ? Number(query.take) : 20,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false, ...friendRequestFilter } }),
    ]);

    return {
      items,
      notifications: items,
      total,
      unreadCount,
    };
  }

  async createNotification(dto: {
    recipientId?: string;
    userId?: string;
    title: string;
    body: string;
    type?: string;
    data?: any;
  }) {
    const targetUserId = dto.recipientId || dto.userId;
    if (!targetUserId) {
      return { success: false, message: 'Missing recipient user ID' };
    }

    let resolvedUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    }).catch(() => null);

    if (!resolvedUser && targetUserId.includes('@')) {
      resolvedUser = await this.prisma.user.findUnique({
        where: { email: targetUserId.toLowerCase() },
      }).catch(() => null);
    }

    if (!resolvedUser) {
      return { success: false, message: 'Recipient user not found' };
    }

    let notifType: NotificationType = NotificationType.SYSTEM;
    if (dto.type && Object.values(NotificationType).includes(dto.type as NotificationType)) {
      notifType = dto.type as NotificationType;
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId: resolvedUser.id,
        title: dto.title || 'Notice',
        body: dto.body || '',
        type: notifType,
        data: dto.data || null,
        isRead: false,
      },
    });

    return { success: true, notification };
  }

  async markAsRead(id: string, userId?: string) {
    await this.prisma.notification.updateMany({
      where: { id, ...(userId ? { userId } : {}) },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }

  async markAllAsRead(userId?: string) {
    if (!userId) return { success: false };
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }

  async saveDeviceToken(dto: { token: string; platform?: string; deviceInfo?: string }, userId?: string) {
    if (!userId || !dto.token) {
      return { success: false };
    }

    let plat: DevicePlatform = DevicePlatform.ANDROID;
    if (dto.platform?.toUpperCase() === 'IOS') plat = DevicePlatform.IOS;
    if (dto.platform?.toUpperCase() === 'WEB') plat = DevicePlatform.WEB;

    await this.prisma.deviceToken.upsert({
      where: {
        userId_token: {
          userId,
          token: dto.token,
        },
      },
      create: {
        userId,
        token: dto.token,
        platform: plat,
        deviceInfo: dto.deviceInfo,
        isActive: true,
      },
      update: {
        platform: plat,
        deviceInfo: dto.deviceInfo,
        isActive: true,
      },
    });

    return { success: true };
  }
}
