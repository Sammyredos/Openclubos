import { Module } from '@nestjs/common';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { FriendsGateway } from './friends.gateway';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [FriendsController],
  providers: [FriendsService, FriendsGateway, PrismaService],
  exports: [FriendsService, FriendsGateway],
})
export class FriendsModule {}
