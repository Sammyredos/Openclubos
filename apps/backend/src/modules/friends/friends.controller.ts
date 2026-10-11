import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { SkipClubGuard } from '../../common/guards/club.guard';

function extractUserId(req: any): string | undefined {
  if (!req?.headers) return undefined;
  return (req.headers['x-user-id'] || req.headers['x-player-id']) as string | undefined;
}

@Controller('friends')
@SkipClubGuard()
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get('resolve')
  @UseGuards(OptionalJwtAuthGuard)
  async resolveGolfer(@Query('query') query: string) {
    return this.friendsService.resolveUserPublic(query);
  }

  @Post('request')
  @UseGuards(OptionalJwtAuthGuard)
  async sendRequest(
    @Body(new ValidationPipe({ whitelist: false, forbidNonWhitelisted: false, transform: false })) dto: any,
    @Request() req: any,
  ) {
    const xUserId = extractUserId(req);
    return this.friendsService.sendRequest(dto, req.user, xUserId);
  }

  @Post('qr-connect')
  @UseGuards(OptionalJwtAuthGuard)
  async qrConnect(
    @Body(new ValidationPipe({ whitelist: false, forbidNonWhitelisted: false, transform: false })) dto: any,
    @Request() req: any,
  ) {
    const xUserId = extractUserId(req);
    return this.friendsService.qrConnect(dto, req.user, xUserId);
  }

  @Get('requests')
  @UseGuards(OptionalJwtAuthGuard)
  async getRequests(@Request() req: any) {
    const xUserId = extractUserId(req);
    return this.friendsService.getRequests(req.user, xUserId);
  }

  @Post('respond')
  @UseGuards(OptionalJwtAuthGuard)
  async respondToRequest(
    @Body(new ValidationPipe({ whitelist: false, forbidNonWhitelisted: false, transform: false })) dto: any,
    @Request() req: any,
  ) {
    const xUserId = extractUserId(req);
    return this.friendsService.respondToRequest(dto, req.user, xUserId);
  }

  @Post('cancel')
  @UseGuards(OptionalJwtAuthGuard)
  async cancelRequest(
    @Body(new ValidationPipe({ whitelist: false, forbidNonWhitelisted: false, transform: false })) dto: any,
    @Request() req: any,
  ) {
    const xUserId = extractUserId(req);
    const targetId = dto.targetUserId || dto.receiverId || dto.targetId;
    return this.friendsService.cancelRequest(targetId, req.user, xUserId);
  }

  @Delete('request/:targetId')
  @UseGuards(OptionalJwtAuthGuard)
  async cancelRequestByParam(
    @Param('targetId') targetId: string,
    @Request() req: any,
  ) {
    const xUserId = extractUserId(req);
    return this.friendsService.cancelRequest(targetId, req.user, xUserId);
  }

  @Get('blocked')
  @UseGuards(OptionalJwtAuthGuard)
  async getBlockedUsers(@Request() req: any) {
    const xUserId = extractUserId(req);
    return this.friendsService.getBlockedUsers(req.user, xUserId);
  }

  @Post('block/:targetId')
  @UseGuards(OptionalJwtAuthGuard)
  async blockUser(
    @Param('targetId') targetId: string,
    @Request() req: any,
  ) {
    const xUserId = extractUserId(req);
    return this.friendsService.blockUser(targetId, req.user, xUserId);
  }

  @Delete('block/:targetId')
  @UseGuards(OptionalJwtAuthGuard)
  async unblockUser(
    @Param('targetId') targetId: string,
    @Request() req: any,
  ) {
    const xUserId = extractUserId(req);
    return this.friendsService.unblockUser(targetId, req.user, xUserId);
  }

  @Post('messages')
  @UseGuards(OptionalJwtAuthGuard)
  async sendMessage(
    @Body(new ValidationPipe({ whitelist: false, forbidNonWhitelisted: false, transform: false })) dto: any,
    @Request() req: any,
  ) {
    const xUserId = extractUserId(req);
    return this.friendsService.sendMessage(dto, req.user, xUserId);
  }

  @Get('messages/unread')
  @UseGuards(OptionalJwtAuthGuard)
  async getUnreadMessages(@Request() req: any) {
    const xUserId = extractUserId(req);
    return this.friendsService.getUnreadMessages(req.user, xUserId);
  }

  @Post('messages/mark-read')
  @UseGuards(OptionalJwtAuthGuard)
  async markMessagesRead(
    @Body(new ValidationPipe({ whitelist: false, forbidNonWhitelisted: false, transform: false })) dto: any,
    @Request() req: any,
  ) {
    const xUserId = extractUserId(req);
    const friendId = dto.friendId || dto.senderId || dto.targetUserId;
    return this.friendsService.markMessagesRead(friendId, req.user, xUserId);
  }

  @Get('messages/:friendId')
  @UseGuards(OptionalJwtAuthGuard)
  async getMessages(
    @Param('friendId') friendId: string,
    @Request() req: any,
  ) {
    const xUserId = extractUserId(req);
    return this.friendsService.getMessages(friendId, req.user, xUserId);
  }

  @Delete(':targetId')
  @UseGuards(OptionalJwtAuthGuard)
  async removeFriend(
    @Param('targetId') targetId: string,
    @Request() req: any,
  ) {
    const xUserId = extractUserId(req);
    return this.friendsService.removeFriend(targetId, req.user, xUserId);
  }

  @Get('online')
  @UseGuards(OptionalJwtAuthGuard)
  async getOnlineUsers() {
    return this.friendsService.getOnlineUsers();
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getFriends(@Request() req: any) {
    const xUserId = extractUserId(req);
    return this.friendsService.getFriends(req.user, xUserId);
  }
}
