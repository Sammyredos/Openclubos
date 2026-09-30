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

    // For club admins/organizers, ensure paid tournament entries and payout settlements in their club have notification records
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, clubId: true, role: true },
      });

      if (user?.clubId && ['CLUB_ADMIN', 'MANAGER', 'STAFF'].includes(user.role)) {
        // Collect existing notification reference IDs to avoid duplicate creation
        const existingNotifs = await this.prisma.notification.findMany({
          where: {
            userId,
            type: {
              in: [
                NotificationType.PAYMENT_RECEIVED,
                NotificationType.WITHDRAWAL_APPROVED,
                NotificationType.WITHDRAWAL_REJECTED,
                NotificationType.WITHDRAWAL_REQUESTED,
              ],
            },
          },
          select: { data: true },
        });

        const existingRegIds = new Set(
          existingNotifs.map((n) => (n.data as any)?.registrationId).filter(Boolean),
        );
        const existingWithIds = new Set(
          existingNotifs.map((n) => (n.data as any)?.withdrawalId).filter(Boolean),
        );

        // 1. Check paid registrations for tournaments organized by this club
        const paidRegistrations = await this.prisma.registration.findMany({
          where: {
            tournament: { clubId: user.clubId },
            paymentStatus: 'PAID',
          },
          include: {
            user: { select: { firstName: true, lastName: true } },
            tournament: { select: { id: true, name: true, entryFee: true } },
          },
          orderBy: { registeredAt: 'desc' },
          take: 20,
        });

        for (const reg of paidRegistrations) {
          if (!existingRegIds.has(reg.id)) {
            const fee = reg.tournament?.entryFee ? Number(reg.tournament.entryFee) : 0;
            const formattedFee = fee > 0 ? `₦${fee.toLocaleString()}` : 'Free';
            const playerName = `${reg.user?.firstName || ''} ${reg.user?.lastName || ''}`.trim() || 'Player';
            await this.prisma.notification.create({
              data: {
                userId,
                title: fee > 0 ? `Payment Received: ${formattedFee}` : `New Registration: ${reg.tournament?.name || 'Tournament'}`,
                body: `${playerName} completed entry payment of ${formattedFee} for ${reg.tournament?.name || 'Tournament'}. Ref: ${reg.paymentReference || 'Direct'}`,
                type: NotificationType.PAYMENT_RECEIVED,
                data: {
                  type: 'PAYMENT_RECEIVED',
                  tournamentId: reg.tournament?.id,
                  tournamentName: reg.tournament?.name,
                  registrationId: reg.id,
                  amount: fee,
                  paymentReference: reg.paymentReference,
                },
                isRead: false,
                createdAt: reg.registeredAt || new Date(),
              },
            });
            existingRegIds.add(reg.id);
          }
        }

        // 2. Check withdrawal / payout requests for this club
        const clubWithdrawals = await this.prisma.withdrawalRequest.findMany({
          where: { clubId: user.clubId },
          orderBy: { createdAt: 'desc' },
          take: 20,
        });

        for (const w of clubWithdrawals) {
          if (!existingWithIds.has(w.id)) {
            if (w.status === 'COMPLETED') {
              await this.prisma.notification.create({
                data: {
                  userId,
                  title: 'Payout Disbursed',
                  body: `Your payout of ₦${w.amount.toLocaleString()} has been disbursed to ${w.bankName} (${w.accountNumber}). Ref: ${w.reference || 'NIP/SETTLED'}`,
                  type: NotificationType.WITHDRAWAL_APPROVED,
                  data: {
                    type: 'WITHDRAWAL_APPROVED',
                    withdrawalId: w.id,
                    amount: w.amount,
                    bankName: w.bankName,
                    accountNumber: w.accountNumber,
                    reference: w.reference,
                  },
                  isRead: false,
                  createdAt: w.processedAt || w.updatedAt || new Date(),
                },
              });
              existingWithIds.add(w.id);
            } else if (w.status === 'REJECTED') {
              await this.prisma.notification.create({
                data: {
                  userId,
                  title: 'Payout Request Declined',
                  body: `Your payout request of ₦${w.amount.toLocaleString()} was declined: ${w.rejectionReason || 'Account details mismatch'}. Funds returned to available balance.`,
                  type: NotificationType.WITHDRAWAL_REJECTED,
                  data: {
                    type: 'WITHDRAWAL_REJECTED',
                    withdrawalId: w.id,
                    amount: w.amount,
                    reason: w.rejectionReason,
                  },
                  isRead: false,
                  createdAt: w.processedAt || w.updatedAt || new Date(),
                },
              });
              existingWithIds.add(w.id);
            } else if (w.status === 'PENDING') {
              await this.prisma.notification.create({
                data: {
                  userId,
                  title: 'Payout Request Submitted',
                  body: `Your payout request of ₦${w.amount.toLocaleString()} to ${w.bankName} (${w.accountNumber}) is pending review.`,
                  type: NotificationType.WITHDRAWAL_REQUESTED,
                  data: {
                    type: 'WITHDRAWAL_REQUESTED',
                    withdrawalId: w.id,
                    amount: w.amount,
                    bankName: w.bankName,
                    accountNumber: w.accountNumber,
                  },
                  isRead: false,
                  createdAt: w.createdAt || new Date(),
                },
              });
              existingWithIds.add(w.id);
            }
          }
        }
      }
    } catch (syncErr) {
      this.logger.warn(`Failed to auto-sync payment notifications for user ${userId}: ${syncErr instanceof Error ? syncErr.message : String(syncErr)}`);
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
