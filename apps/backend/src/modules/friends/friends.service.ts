import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { FriendshipStatus, NotificationType } from '@prisma/client';
import { FriendsGateway } from './friends.gateway';

@Injectable()
export class FriendsService {
  private readonly logger = new Logger(FriendsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly friendsGateway: FriendsGateway,
  ) {}

  /**
   * Helper to resolve a user by ID or email
   */
  private async resolveUser(identifier?: string) {
    if (!identifier) return null;
    const clean = identifier.trim();
    let user = await this.prisma.user.findUnique({
      where: { id: clean },
      include: { club: true },
    }).catch(() => null);

    if (!user && clean.includes('@')) {
      user = await this.prisma.user.findUnique({
        where: { email: clean.toLowerCase() },
        include: { club: true },
      }).catch(() => null);
    }
    return user;
  }

  /**
   * Send or create a friend request
   */
  async sendRequest(dto: { targetUserId?: string; receiverId?: string; senderId?: string }, reqUser?: any, xUserId?: string) {
    const rawSenderId = reqUser?.id || xUserId || dto.senderId;
    const rawTargetId = dto.targetUserId || dto.receiverId;

    if (!rawTargetId) {
      throw new BadRequestException('Target user ID is required');
    }

    const sender = await this.resolveUser(rawSenderId);
    const target = await this.resolveUser(rawTargetId);

    if (!sender) {
      throw new NotFoundException(`Sender user not found (${rawSenderId})`);
    }
    if (!target) {
      throw new NotFoundException(`Target user not found (${rawTargetId})`);
    }

    if (sender.id === target.id) {
      throw new BadRequestException('Cannot send a friend request to yourself');
    }

    // Check if friendship already exists
    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: sender.id, receiverId: target.id },
          { senderId: target.id, receiverId: sender.id },
        ],
      },
    });

    const senderName = [sender.firstName, sender.lastName].filter(Boolean).join(' ') || sender.email || 'A golfer';
    const targetName = [target.firstName, target.lastName].filter(Boolean).join(' ') || target.email || 'A golfer';

    if (existing) {
      if (existing.status === FriendshipStatus.ACCEPTED) {
        return { success: true, message: 'Already connected as friends', friendship: existing };
      }
      if (existing.status === FriendshipStatus.PENDING) {
        if (existing.senderId === sender.id) {
          return { success: true, message: 'Friend request already sent', friendship: existing };
        } else {
          // Cross request: target already sent request to sender -> auto-accept
          const updated = await this.prisma.friendship.update({
            where: { id: existing.id },
            data: { status: FriendshipStatus.ACCEPTED },
          });

          // Real-time emit to both users
          this.friendsGateway.emitFriendRequestAccepted(target.id, {
            friendshipId: updated.id,
            friend: {
              friendshipId: updated.id,
              friendId: sender.id,
              name: senderName,
              email: sender.email,
              club: sender.club?.name || 'OpenClub Golfer',
              handicap: sender.handicap,
              profilePhoto: sender.profilePhoto,
              connectedAt: updated.updatedAt.toISOString(),
            },
            byUserId: sender.id,
            byUserName: senderName,
          });

          this.friendsGateway.emitFriendRequestAccepted(sender.id, {
            friendshipId: updated.id,
            friend: {
              friendshipId: updated.id,
              friendId: target.id,
              name: targetName,
              email: target.email,
              club: target.club?.name || 'OpenClub Golfer',
              handicap: target.handicap,
              profilePhoto: target.profilePhoto,
              connectedAt: updated.updatedAt.toISOString(),
            },
            byUserId: sender.id,
            byUserName: senderName,
          });

          return { success: true, message: 'Friend request accepted', friendship: updated };
        }
      }
      // If previously declined, reset to PENDING with new sender
      const reset = await this.prisma.friendship.update({
        where: { id: existing.id },
        data: {
          senderId: sender.id,
          receiverId: target.id,
          status: FriendshipStatus.PENDING,
        },
      });
      await this.createFriendRequestNotification(sender, target);

      this.friendsGateway.emitFriendRequestReceived(target.id, {
        id: reset.id,
        requestId: reset.id,
        senderId: sender.id,
        senderName,
        senderEmail: sender.email,
        senderClub: sender.club?.name || 'OpenClub Golfer',
        senderHcp: sender.handicap,
        senderAvatar: sender.profilePhoto,
        profilePhoto: sender.profilePhoto,
        createdAt: reset.createdAt.toISOString(),
      });

      return { success: true, message: 'Friend request sent', friendship: reset };
    }

    // Create new Friendship record
    const friendship = await this.prisma.friendship.create({
      data: {
        senderId: sender.id,
        receiverId: target.id,
        status: FriendshipStatus.PENDING,
      },
    });

    // Create notification for target recipient
    await this.createFriendRequestNotification(sender, target);

    // Real-time emit to recipient
    this.friendsGateway.emitFriendRequestReceived(target.id, {
      id: friendship.id,
      requestId: friendship.id,
      senderId: sender.id,
      senderName,
      senderEmail: sender.email,
      senderClub: sender.club?.name || 'OpenClub Golfer',
      senderHcp: sender.handicap,
      senderAvatar: sender.profilePhoto,
      profilePhoto: sender.profilePhoto,
      createdAt: friendship.createdAt.toISOString(),
    });

    this.logger.log(`Friend request sent: ${sender.email} (${sender.id}) -> ${target.email} (${target.id})`);
    return { success: true, message: 'Friend request sent successfully', friendship };
  }

  private async createFriendRequestNotification(sender: any, target: any) {
    try {
      const senderName = [sender.firstName, sender.lastName].filter(Boolean).join(' ') || sender.email || 'A golfer';
      await this.prisma.notification.create({
        data: {
          userId: target.id,
          title: 'Friend Request',
          body: `${senderName} sent you a friend request to connect on OpenClub.`,
          type: NotificationType.SYSTEM,
          data: {
            type: 'FRIEND_REQUEST',
            senderId: sender.id,
            senderName,
            senderEmail: sender.email,
            senderClub: sender.club?.name || 'OpenClub Golfer',
            senderHcp: sender.handicap,
          },
        },
      });
    } catch (e: any) {
      this.logger.warn(`Failed to create friend request notification: ${e.message}`);
    }
  }

  /**
   * Get pending incoming and outgoing friend requests
   */
  async getRequests(reqUser?: any, xUserId?: string) {
    const rawUserId = reqUser?.id || xUserId;
    const user = await this.resolveUser(rawUserId);
    if (!user) {
      return { incoming: [], outgoing: [] };
    }

    const [incoming, outgoing] = await Promise.all([
      this.prisma.friendship.findMany({
        where: { receiverId: user.id, status: FriendshipStatus.PENDING },
        include: { sender: { include: { club: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.friendship.findMany({
        where: { senderId: user.id, status: FriendshipStatus.PENDING },
        include: { receiver: { include: { club: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      incoming: incoming.map((f) => ({
        id: f.id,
        requestId: f.id,
        senderId: f.sender.id,
        name: [f.sender.firstName, f.sender.lastName].filter(Boolean).join(' ') || f.sender.email,
        firstName: f.sender.firstName,
        lastName: f.sender.lastName,
        email: f.sender.email,
        handicap: f.sender.handicap,
        club: f.sender.club?.name || 'OpenClub Golfer',
        profilePhoto: f.sender.profilePhoto,
        createdAt: f.createdAt,
      })),
      outgoing: outgoing.map((f) => ({
        id: f.id,
        requestId: f.id,
        receiverId: f.receiver.id,
        name: [f.receiver.firstName, f.receiver.lastName].filter(Boolean).join(' ') || f.receiver.email,
        firstName: f.receiver.firstName,
        lastName: f.receiver.lastName,
        email: f.receiver.email,
        handicap: f.receiver.handicap,
        club: f.receiver.club?.name || 'OpenClub Golfer',
        profilePhoto: f.receiver.profilePhoto,
        createdAt: f.createdAt,
      })),
    };
  }

  /**
   * Respond to friend request (accept or decline)
   */
  async respondToRequest(dto: { requestId?: string; accept?: boolean; userId?: string; senderId?: string }, reqUser?: any, xUserId?: string) {
    const rawUserId = reqUser?.id || xUserId || dto.userId;
    const user = await this.resolveUser(rawUserId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Resolve the actual sender if a senderId was provided alongside the requestId
    const resolvedSender = dto.senderId ? await this.resolveUser(dto.senderId) : null;

    // Search by friendship DB ID first, then by senderId alias, then by the sender/receiver pair
    let friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          // Direct friendship UUID match
          ...(dto.requestId ? [{ id: dto.requestId }] : []),
          // requestId is actually the senderId string (localStorage-generated IDs)
          ...(dto.requestId ? [
            { senderId: dto.requestId, receiverId: user.id },
            { senderId: user.id, receiverId: dto.requestId },
          ] : []),
          // Resolved real sender UUID
          ...(resolvedSender ? [
            { senderId: resolvedSender.id, receiverId: user.id },
            { senderId: user.id, receiverId: resolvedSender.id },
          ] : []),
        ],
      },
      include: { sender: true, receiver: true },
    });

    if (!friendship) {
      // Silently succeed — request may have already been handled or never reached DB
      this.logger.warn(`respondToRequest: no friendship found for requestId=${dto.requestId}, senderId=${dto.senderId}, userId=${user.id}`);
      return { success: true, status: dto.accept ? 'ACCEPTED' : 'DECLINED', message: 'Request already handled' };
    }

    if (dto.accept) {
      const updated = await this.prisma.friendship.update({
        where: { id: friendship.id },
        data: { status: FriendshipStatus.ACCEPTED },
      });

      // Send acceptance notification to the original sender
      const accepterName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'A golfer';
      const targetRecipientId = friendship.senderId === user.id ? friendship.receiverId : friendship.senderId;
      const otherUser = await this.resolveUser(targetRecipientId);
      const otherUserName = otherUser ? ([otherUser.firstName, otherUser.lastName].filter(Boolean).join(' ') || otherUser.email) : 'A golfer';

      await this.prisma.notification.create({
        data: {
          userId: targetRecipientId,
          title: 'Friend Request Accepted',
          body: `${accepterName} accepted your friend request! You are now connected.`,
          type: NotificationType.SYSTEM,
          data: {
            type: 'FRIEND_ACCEPTED',
            userId: user.id,
            userName: accepterName,
          },
        },
      }).catch(() => null);

      // Emit real-time friend:request_accepted to other user (targetRecipientId)
      this.friendsGateway.emitFriendRequestAccepted(targetRecipientId, {
        friendshipId: updated.id,
        friend: {
          friendshipId: updated.id,
          friendId: user.id,
          name: accepterName,
          email: user.email,
          club: user.club?.name || 'OpenClub Golfer',
          handicap: user.handicap,
          profilePhoto: user.profilePhoto,
          connectedAt: updated.updatedAt.toISOString(),
        },
        byUserId: user.id,
        byUserName: accepterName,
      });

      // Emit real-time friend:request_accepted to the accepting user (user.id)
      if (otherUser) {
        this.friendsGateway.emitFriendRequestAccepted(user.id, {
          friendshipId: updated.id,
          friend: {
            friendshipId: updated.id,
            friendId: otherUser.id,
            name: otherUserName,
            email: otherUser.email,
            club: otherUser.club?.name || 'OpenClub Golfer',
            handicap: otherUser.handicap,
            profilePhoto: otherUser.profilePhoto,
            connectedAt: updated.updatedAt.toISOString(),
          },
          byUserId: user.id,
          byUserName: accepterName,
        });
      }

      return { success: true, status: 'ACCEPTED', friendship: updated };
    } else {
      // Decline: delete the friendship record permanently
      await this.prisma.friendship.delete({
        where: { id: friendship.id },
      }).catch(() => null);

      // Also remove the FRIEND_REQUEST notification from the receiver's inbox in DB
      const senderId = friendship.senderId;
      const receiverId = friendship.receiverId;
      await this.prisma.notification.deleteMany({
        where: {
          userId: receiverId,
          data: { path: ['type'], equals: 'FRIEND_REQUEST' },
        },
      }).catch(() => null);
      // Also clean up from sender's inbox (e.g. any FRIEND_REQUEST_SENT confirmation)
      await this.prisma.notification.deleteMany({
        where: {
          userId: senderId,
          data: { path: ['type'], equals: 'FRIEND_REQUEST_SENT' },
        },
      }).catch(() => null);

      // Emit real-time friend:request_declined
      this.friendsGateway.emitFriendRequestDeclined(senderId, {
        senderId,
        targetId: receiverId,
        requestId: friendship.id,
      });

      this.logger.log(`Friend request declined: friendship ${friendship.id} deleted`);
      return { success: true, status: 'DECLINED' };
    }
  }

  /**
   * Cancel outgoing request
   */
  async cancelRequest(targetId: string, reqUser?: any, xUserId?: string) {
    const rawUserId = reqUser?.id || xUserId;
    const user = await this.resolveUser(rawUserId);
    const target = await this.resolveUser(targetId);

    if (!user || !target) {
      return { success: true, message: 'Request removed' };
    }

    await this.prisma.friendship.deleteMany({
      where: {
        OR: [
          { senderId: user.id, receiverId: target.id, status: FriendshipStatus.PENDING },
          { senderId: target.id, receiverId: user.id, status: FriendshipStatus.PENDING },
        ],
      },
    });

    this.friendsGateway.emitFriendRequestCancelled(target.id, {
      senderId: user.id,
      targetId: target.id,
    });

    return { success: true, message: 'Friend request cancelled' };
  }

  /**
   * Remove friend / Unfriend
   */
  async removeFriend(targetId: string, reqUser?: any, xUserId?: string) {
    const rawUserId = reqUser?.id || xUserId;
    const user = await this.resolveUser(rawUserId);
    const target = await this.resolveUser(targetId);

    if (!user || !target) {
      return { success: true, message: 'Friend removed' };
    }

    await this.prisma.friendship.deleteMany({
      where: {
        OR: [
          { senderId: user.id, receiverId: target.id },
          { senderId: target.id, receiverId: user.id },
        ],
      },
    });

    const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
    this.friendsGateway.emitFriendRemoved(target.id, {
      friendId: user.id,
      friendName: userName,
      removedByUserId: user.id,
    });

    return { success: true, message: 'Friend removed successfully' };
  }

  /**
   * Get all accepted friends for user
   */
  async getFriends(reqUser?: any, xUserId?: string) {
    const rawUserId = reqUser?.id || xUserId;
    const user = await this.resolveUser(rawUserId);
    if (!user) {
      return [];
    }

    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [{ senderId: user.id }, { receiverId: user.id }],
      },
      include: {
        sender: { include: { club: true } },
        receiver: { include: { club: true } },
      },
    });

    return friendships.map((f) => {
      const friend = f.senderId === user.id ? f.receiver : f.sender;
      return {
        id: friend.id,
        name: [friend.firstName, friend.lastName].filter(Boolean).join(' ') || friend.email,
        firstName: friend.firstName,
        lastName: friend.lastName,
        email: friend.email,
        handicap: friend.handicap,
        club: friend.club?.name || 'OpenClub Golfer',
        profilePhoto: friend.profilePhoto,
        connectedAt: f.updatedAt,
      };
    });
  }

  /**
   * Block a user
   */
  async blockUser(targetId: string, reqUser?: any, xUserId?: string) {
    const rawUserId = reqUser?.id || xUserId;
    const user = await this.resolveUser(rawUserId);
    const target = await this.resolveUser(targetId);

    if (!user || !target) {
      throw new NotFoundException('User not found');
    }

    // Remove any friendship
    await this.prisma.friendship.deleteMany({
      where: {
        OR: [
          { senderId: user.id, receiverId: target.id },
          { senderId: target.id, receiverId: user.id },
        ],
      },
    });

    // Upsert blocked user
    await this.prisma.blockedUser.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: user.id,
          blockedId: target.id,
        },
      },
      create: {
        blockerId: user.id,
        blockedId: target.id,
      },
      update: {},
    });

    const blockerName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
    this.friendsGateway.emitFriendBlocked(target.id, {
      blockerId: user.id,
      blockedId: target.id,
      blockerName,
    });

    return { success: true, message: 'User blocked successfully' };
  }

  /**
   * Unblock a user
   */
  async unblockUser(targetId: string, reqUser?: any, xUserId?: string) {
    const rawUserId = reqUser?.id || xUserId;
    const user = await this.resolveUser(rawUserId);
    const target = await this.resolveUser(targetId);

    if (!user || !target) {
      return { success: true, message: 'User unblocked' };
    }

    await this.prisma.blockedUser.deleteMany({
      where: {
        blockerId: user.id,
        blockedId: target.id,
      },
    });

    this.friendsGateway.emitFriendUnblocked(target.id, {
      unblockerId: user.id,
      unblockedId: target.id,
    });

    return { success: true, message: 'User unblocked successfully' };
  }

  /**
   * Get list of blocked users
   */
  async getBlockedUsers(reqUser?: any, xUserId?: string) {
    const rawUserId = reqUser?.id || xUserId;
    const user = await this.resolveUser(rawUserId);
    if (!user) {
      return [];
    }

    const blocked = await this.prisma.blockedUser.findMany({
      where: { blockerId: user.id },
      include: { blocked: { include: { club: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return blocked.map((b) => ({
      id: b.blocked.id,
      name: [b.blocked.firstName, b.blocked.lastName].filter(Boolean).join(' ') || b.blocked.email,
      email: b.blocked.email,
      club: b.blocked.club?.name || 'OpenClub Golfer',
      blockedAt: b.createdAt,
    }));
  }
}
