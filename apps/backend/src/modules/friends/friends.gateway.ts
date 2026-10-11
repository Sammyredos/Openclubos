import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

export interface FriendRequestReceivedPayload {
  id: string;
  requestId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderClub?: string | null;
  senderHcp?: string | number | null;
  senderAvatar?: string | null;
  profilePhoto?: string | null;
  createdAt: string;
}

export interface FriendAcceptedPayload {
  friendshipId?: string;
  friendId: string;
  name: string;
  email: string;
  club?: string | null;
  handicap?: string | number | null;
  profilePhoto?: string | null;
  connectedAt: string;
}

export interface FriendPlayingPayload {
  friendId: string;
  name: string;
  tournamentId?: string;
  tournamentName?: string;
  holeNumber?: number;
  thru?: number;
  score?: string;
  gross?: number | string;
  isPlaying: boolean;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class FriendsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(FriendsGateway.name);

  @WebSocketServer()
  server: Server;

  private readonly userSockets: Map<string, Set<string>> = new Map();
  private readonly socketUsers: Map<string, Set<string>> = new Map();

  private registerUserSocket(client: Socket, rawUserId: string) {
    if (!rawUserId || typeof rawUserId !== 'string' || !rawUserId.trim()) return;
    const cleanId = rawUserId.trim().toLowerCase();

    if (!this.socketUsers.has(client.id)) {
      this.socketUsers.set(client.id, new Set());
    }
    this.socketUsers.get(client.id)!.add(cleanId);

    const existingSockets = this.userSockets.get(cleanId);
    const wasOnline = existingSockets && existingSockets.size > 0;
    if (!existingSockets) {
      this.userSockets.set(cleanId, new Set([client.id]));
    } else {
      existingSockets.add(client.id);
    }

    if (!wasOnline) {
      this.logger.log(`User online: ${cleanId}`);
      if (this.server) {
        this.server.emit('user:online', { userId: cleanId, rawUserId: rawUserId.trim() });
      }
    }

    client.emit('presence:sync', {
      onlineUserIds: Array.from(this.userSockets.keys()),
    });
  }

  private unregisterUserSocket(client: Socket, rawUserId: string) {
    if (!rawUserId || typeof rawUserId !== 'string' || !rawUserId.trim()) return;
    const cleanId = rawUserId.trim().toLowerCase();

    const sockets = this.userSockets.get(cleanId);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.userSockets.delete(cleanId);
        this.logger.log(`User offline: ${cleanId}`);
        if (this.server) {
          this.server.emit('user:offline', { userId: cleanId, rawUserId: rawUserId.trim() });
        }
      }
    }

    const userSet = this.socketUsers.get(client.id);
    if (userSet) {
      userSet.delete(cleanId);
    }
  }

  private cleanupClientSockets(client: Socket) {
    const userSet = this.socketUsers.get(client.id);
    if (userSet) {
      for (const cleanId of userSet) {
        const sockets = this.userSockets.get(cleanId);
        if (sockets) {
          sockets.delete(client.id);
          if (sockets.size === 0) {
            this.userSockets.delete(cleanId);
            this.logger.log(`User offline: ${cleanId}`);
            if (this.server) {
              this.server.emit('user:offline', { userId: cleanId });
            }
          }
        }
      }
      this.socketUsers.delete(client.id);
    }
  }

  handleConnection(client: Socket) {
    // Client connected; wait for subscribe:user message or query param
    const userId = client.handshake.query?.userId as string | undefined;
    if (userId && typeof userId === 'string' && userId.trim()) {
      const room = `user:${userId.trim().toLowerCase()}`;
      client.join(room);
      client.join(`user:${userId.trim()}`);
      this.registerUserSocket(client, userId);
      this.logger.debug(`Socket ${client.id} auto-joined room ${room}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.cleanupClientSockets(client);
    this.logger.debug(`Socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:user')
  handleSubscribeUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string } | string,
  ) {
    const rawId = typeof data === 'string' ? data : data?.userId;
    if (!rawId || typeof rawId !== 'string') return;
    const cleanId = rawId.trim();
    const room = `user:${cleanId.toLowerCase()}`;
    client.join(room);
    client.join(`user:${cleanId}`);
    this.registerUserSocket(client, cleanId);
    this.logger.debug(`Socket ${client.id} subscribed to room ${room}`);
    return { status: 'subscribed', room };
  }

  @SubscribeMessage('unsubscribe:user')
  handleUnsubscribeUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string } | string,
  ) {
    const rawId = typeof data === 'string' ? data : data?.userId;
    if (!rawId || typeof rawId !== 'string') return;
    const cleanId = rawId.trim();
    const room = `user:${cleanId.toLowerCase()}`;
    client.leave(room);
    client.leave(`user:${cleanId}`);
    this.unregisterUserSocket(client, cleanId);
    this.logger.debug(`Socket ${client.id} unsubscribed from room ${room}`);
    return { status: 'unsubscribed', room };
  }

  @SubscribeMessage('presence:get_online')
  handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    return { onlineUserIds: Array.from(this.userSockets.keys()) };
  }

  getOnlineUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }

  /**
   * Helper: dispatch event to both raw ID and lowercased ID user rooms
   */
  private emitToUser(userId: string, event: string, payload: any) {
    if (!this.server || !userId) return;
    const clean = String(userId).trim();
    try {
      this.server.to(`user:${clean}`).to(`user:${clean.toLowerCase()}`).emit(event, payload);
    } catch (e: any) {
      this.logger.warn(`Failed to emit ${event} to user ${clean}: ${e.message}`);
    }
  }

  /**
   * Real-time: New friend request received by target user
   */
  emitFriendRequestReceived(targetUserId: string, payload: FriendRequestReceivedPayload) {
    this.emitToUser(targetUserId, 'friend:request_received', payload);
  }

  /**
   * Real-time: Friend request cancelled by sender
   */
  emitFriendRequestCancelled(
    targetUserId: string,
    payload: { senderId: string; targetId: string; requestId?: string },
  ) {
    this.emitToUser(targetUserId, 'friend:request_cancelled', payload);
    // Also sync other tabs of the sender
    this.emitToUser(payload.senderId, 'friend:request_cancelled', payload);
  }

  /**
   * Real-time: Friend request accepted (mutual connection established)
   */
  emitFriendRequestAccepted(
    targetUserId: string,
    payload: {
      friendshipId?: string;
      friend: FriendAcceptedPayload;
      byUserId: string;
      byUserName: string;
    },
  ) {
    this.emitToUser(targetUserId, 'friend:request_accepted', payload);
  }

  /**
   * Real-time: Friend request declined
   */
  emitFriendRequestDeclined(
    targetUserId: string,
    payload: { senderId: string; targetId: string; requestId?: string },
  ) {
    this.emitToUser(targetUserId, 'friend:request_declined', payload);
    this.emitToUser(payload.targetId, 'friend:request_declined', payload);
  }

  /**
   * Real-time: Friend removed / Unfriended
   */
  emitFriendRemoved(
    targetUserId: string,
    payload: { friendId: string; friendName?: string; removedByUserId: string; targetUserId?: string; targetName?: string },
  ) {
    this.emitToUser(targetUserId, 'friend:removed', payload);
    this.emitToUser(payload.removedByUserId, 'friend:removed', payload);
    if (this.server) {
      this.server.emit('friend:removed', payload);
    }
  }

  /**
   * Real-time: User blocked
   */
  emitFriendBlocked(
    targetUserId: string,
    payload: { blockerId: string; blockedId: string; blockerName?: string },
  ) {
    this.emitToUser(targetUserId, 'friend:blocked', payload);
    this.emitToUser(payload.blockerId, 'friend:blocked', payload);
  }

  /**
   * Real-time: User unblocked
   */
  emitFriendUnblocked(
    targetUserId: string,
    payload: { unblockerId: string; unblockedId: string },
  ) {
    this.emitToUser(targetUserId, 'friend:unblocked', payload);
    this.emitToUser(payload.unblockerId, 'friend:unblocked', payload);
  }

  /**
   * Real-time: Friend course playing status update (tee-off, score, hole advance)
   */
  emitFriendPlayingStatus(
    recipientUserIds: string[],
    payload: FriendPlayingPayload,
  ) {
    if (!this.server || !recipientUserIds || recipientUserIds.length === 0) return;
    for (const id of recipientUserIds) {
      this.emitToUser(id, 'friend:playing_update', payload);
    }
  }

  /**
   * Real-time: Direct message sent between friends
   */
  emitDirectMessage(
    targetUserId: string | string[],
    payload: any,
  ) {
    const list = Array.isArray(targetUserId) ? targetUserId : [targetUserId];
    const unique = new Set<string>();
    for (const item of list) {
      if (item && typeof item === 'string' && item.trim()) {
        const clean = item.trim();
        unique.add(clean);
        unique.add(clean.toLowerCase());
      }
    }
    for (const id of unique) {
      this.emitToUser(id, 'chat:message_received', payload);
      this.emitToUser(id, 'chat:message', payload);
    }
  }
}
