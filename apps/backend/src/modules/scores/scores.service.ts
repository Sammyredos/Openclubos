import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateScoreDto } from './dto/create-score.dto';
import { RegistrationStatus, ScoreStatus, UserRole } from '@prisma/client';

@Injectable()
export class ScoresService {
  constructor(private prisma: PrismaService) {}

  async upsertScore(createScoreDto: CreateScoreDto, currentUser: any) {
    const { userId, holeId, groupId, strokes, putts, points } = createScoreDto;
    const targetUserId = userId || currentUser.userId;

    // Validation: Only admin can enter score for another player
    if (
      targetUserId !== currentUser.userId &&
      currentUser.role !== UserRole.SUPER_ADMIN &&
      currentUser.role !== UserRole.CLUB_ADMIN
    ) {
      throw new ForbiddenException('You can only enter your own scores');
    }

    if (groupId) {
      const group = await this.prisma.group.findUnique({
        where: { id: groupId },
        select: { tournamentId: true },
      });
      if (!group) throw new NotFoundException('Group not found');

      const registration = await this.prisma.registration.findUnique({
        where: {
          userId_tournamentId: {
            userId: targetUserId,
            tournamentId: group.tournamentId,
          },
        },
        select: { status: true },
      });

      if (registration?.status === RegistrationStatus.DISQUALIFIED) {
        throw new ForbiddenException(
          'Player is disqualified for this tournament',
        );
      }
    }

    // Check if score already exists and its status
    const existingScore = await this.prisma.score.findFirst({
      where: {
        userId: targetUserId,
        holeId,
        groupId: groupId || null,
      },
    });

    if (existingScore) {
      // If confirmed or locked, only admin can edit
      if (
        existingScore.status !== ScoreStatus.ENTERED &&
        currentUser.role !== UserRole.SUPER_ADMIN &&
        currentUser.role !== UserRole.CLUB_ADMIN
      ) {
        throw new ForbiddenException(
          'This score is locked and cannot be modified',
        );
      }

      return this.prisma.score.update({
        where: { id: existingScore.id },
        data: { strokes, putts, points, recordedAt: new Date() },
      });
    }

    return this.prisma.score.create({
      data: {
        strokes,
        putts,
        points,
        userId: targetUserId,
        holeId,
        groupId,
        status: ScoreStatus.ENTERED,
      },
    });
  }

  async confirmScore(id: string, markerUser: any) {
    const score = await this.prisma.score.findUnique({
      where: { id },
      include: { group: true },
    });

    if (!score) {
      throw new NotFoundException('Score not found');
    }

    // Validation: Marker must not be the player themselves
    if (
      score.userId === markerUser.userId &&
      markerUser.role !== UserRole.SUPER_ADMIN
    ) {
      throw new BadRequestException('You cannot confirm your own score');
    }

    // Additional validation: Marker should be in the same group (simplified for now)
    // if (score.groupId) { ... }

    return this.prisma.score.update({
      where: { id },
      data: {
        status: ScoreStatus.CONFIRMED,
        markerId: markerUser.userId,
        confirmedAt: new Date(),
      },
    });
  }

  async adminOverride(id: string, updateData: any) {
    return this.prisma.score.update({
      where: { id },
      data: {
        ...updateData,
        status: ScoreStatus.LOCKED, // Optionally lock after admin override
      },
    });
  }

  async findByGroup(groupId: string) {
    return this.prisma.score.findMany({
      where: { groupId },
      include: { user: true, hole: true },
    });
  }

  async findByTournament(tournamentId: string) {
    return this.prisma.score.findMany({
      where: {
        group: {
          tournamentId,
        },
      },
      include: { user: true, hole: true, group: true },
    });
  }
}
