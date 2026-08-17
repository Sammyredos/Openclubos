import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ScoreStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { JobsService } from '../jobs/jobs.service';
import { CreateScoreDto } from './dto/create-score.dto';
import { LeaderboardGateway } from './leaderboard.gateway';

const MAX_PAGE_SIZE = 10000;

@Injectable()
export class ScoresService {
  constructor(
    private prisma: PrismaService,
    private jobsService: JobsService,
    private leaderboardGateway: LeaderboardGateway,
  ) {}

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

      if (registration && String(registration.status) === 'DISQUALIFIED') {
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

      const updatedScore = await this.prisma.score.update({
        where: { id: existingScore.id },
        data: { strokes, putts, points, recordedAt: new Date() },
      });

      if (groupId) {
        const group = await this.prisma.group.findUnique({ where: { id: groupId }, select: { tournamentId: true } });
        if (group) this.leaderboardGateway.broadcastScoreUpdate(group.tournamentId, updatedScore);
      }
      return updatedScore;
    }

    const newScore = await this.prisma.score.create({
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

    if (groupId) {
      const group = await this.prisma.group.findUnique({ where: { id: groupId }, select: { tournamentId: true } });
      if (group) this.leaderboardGateway.broadcastScoreUpdate(group.tournamentId, newScore);
    }

    return newScore;
  }

  async confirmScore(id: string, markerUser: any) {
    const score = await this.prisma.score.findUnique({
      where: { id },
      include: { group: true, hole: { select: { number: true } } },
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

    const updated = await this.prisma.score.update({
      where: { id },
      data: {
        status: ScoreStatus.CONFIRMED,
        markerId: markerUser.userId,
        confirmedAt: new Date(),
      },
    });

    // Queue score confirmed email to the player
    const player = await this.prisma.user.findUnique({
      where: { id: score.userId },
      select: { email: true, firstName: true },
    });
    if (player?.email) {
      this.jobsService
        .queueEmail('SCORE_CONFIRMED', player.email, {
          firstName: player.firstName,
          holeNumber: score.hole?.number || 'N/A',
        })
        .catch((err) => {
          console.error('Failed to queue scoreConfirmed email:', err);
        });
    }

    if (score.groupId && score.group?.tournamentId) {
      this.leaderboardGateway.broadcastScoreUpdate(score.group.tournamentId, updated);
    }

    return updated;
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

  async findByGroup(groupId: string, skip = 0, take = 100) {
    const safeTake = Math.min(take, MAX_PAGE_SIZE);
    return this.prisma.score.findMany({
      where: { groupId },
      skip,
      take: safeTake,
      select: {
        id: true,
        strokes: true,
        putts: true,
        points: true,
        status: true,
        recordedAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            handicap: true,
          },
        },
        hole: {
          select: {
            id: true,
            number: true,
            par: true,
          },
        },
      },
    });
  }

  async findByTournament(tournamentId: string, skip = 0, take = 100) {
    const safeTake = Math.min(take, MAX_PAGE_SIZE);
    return this.prisma.score.findMany({
      where: {
        group: {
          tournamentId,
        },
      },
      orderBy: { id: 'asc' },
      skip,
      take: safeTake,
      select: {
        id: true,
        strokes: true,
        putts: true,
        points: true,
        status: true,
        recordedAt: true,
        userId: true,
        holeId: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            handicap: true,
            email: true,
            profilePhoto: true,
            registrations: {
              where: { tournamentId },
              select: { madeCut: true },
            },
          },
        },
        hole: {
          select: {
            id: true,
            number: true,
            par: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            startTime: true,
          },
        },
      },
    });
  }

  async getPublicLeaderboardData(tournamentId: string) {
    const registrations = await this.prisma.registration.findMany({
      where: {
        tournamentId,
        status: { in: ['APPROVED', 'DISQUALIFIED'] },
        paymentStatus: 'PAID',
      },
      select: {
        id: true,
        status: true,
        madeCut: true,
        extraStrokes: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            handicap: true,
            profilePhoto: true,
          }
        }
      }
    });

    const scores = await this.prisma.score.findMany({
      where: {
        group: { tournamentId }
      },
      select: {
        strokes: true,
        points: true,
        userId: true,
        holeId: true,
        hole: { select: { par: true } }
      }
    });

    return { registrations, scores };
  }
}
