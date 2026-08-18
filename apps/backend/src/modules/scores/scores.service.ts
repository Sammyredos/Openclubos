import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScoreStatus, UserRole } from '@prisma/client';
import * as crypto from 'crypto';
import { createClient, RedisClientType } from 'redis';
import { PrismaService } from '../../common/prisma.service';
import { JobsService } from '../jobs/jobs.service';
import { CreateScoreDto } from './dto/create-score.dto';
import { LeaderboardGateway } from './leaderboard.gateway';

const MAX_PAGE_SIZE = 10000;

@Injectable()
export class ScoresService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScoresService.name);
  private redisClient: RedisClientType;

  constructor(
    private prisma: PrismaService,
    private jobsService: JobsService,
    private leaderboardGateway: LeaderboardGateway,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    const cacheUrl =
      this.configService.get<string>('CACHE_REDIS_URL') ||
      this.configService.get<string>('REDIS_URL') ||
      'redis://localhost:6379';

    try {
      this.redisClient = createClient({
        url: cacheUrl,
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
        },
      });
      this.redisClient.on('error', (err) =>
        this.logger.warn(`Redis Cache client warning in ScoresService: ${err.message}`),
      );
      await this.redisClient.connect();
      this.logger.log('ScoresService connected to Redis Cache for Leaderboard derived state.');
    } catch (err: any) {
      this.logger.error(`ScoresService failed to connect to Redis: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    if (this.redisClient && this.redisClient.isOpen) {
      await this.redisClient.quit();
    }
  }

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

    // Fetch hole details for sequence number and tournament reference
    const hole = await this.prisma.hole.findUnique({
      where: { id: holeId },
      include: { course: true },
    });
    if (!hole) throw new NotFoundException('Hole not found');

    const holeNumber = hole.number;
    let tournamentId = 'unassigned';
    if (groupId) {
      const group = await this.prisma.group.findUnique({ where: { id: groupId }, select: { tournamentId: true } });
      if (group) tournamentId = group.tournamentId;
    }

    // Determine previous hole's integrity hash
    let previousHash = 'GENESIS';
    if (holeNumber > 1) {
      const prevHole = await this.prisma.hole.findFirst({
        where: { courseId: hole.courseId, number: holeNumber - 1 },
      });
      if (prevHole) {
        const prevScore = await this.prisma.score.findFirst({
          where: {
            userId: targetUserId,
            holeId: prevHole.id,
            groupId: groupId || null,
          },
        });
        if (prevScore?.integrityHash) {
          previousHash = prevScore.integrityHash;
        }
      }
    }

    const recordedAt = new Date();
    const integrityHash = this.calculateScoreHash({
      tournamentId,
      userId: targetUserId,
      holeNumber,
      strokes,
      putts,
      points,
      markerId: null,
      recordedAt,
      previousHash,
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
        data: {
          strokes,
          putts,
          points,
          recordedAt,
          integrityHash,
          previousHash,
          sequenceNumber: holeNumber,
        },
      });

      if (groupId) {
        await this.reconcileLeaderboard(tournamentId);
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
        recordedAt,
        integrityHash,
        previousHash,
        sequenceNumber: holeNumber,
      },
    });

    if (groupId) {
      await this.reconcileLeaderboard(tournamentId);
    }

    return newScore;
  }

  calculateScoreHash(data: {
    tournamentId: string;
    userId: string;
    holeNumber: number;
    strokes: number;
    putts?: number | null;
    points?: number | null;
    markerId?: string | null;
    recordedAt: Date | string;
    previousHash: string;
  }): string {
    const recordedAtIso = new Date(data.recordedAt).toISOString();
    const payload = `${data.tournamentId}:${data.userId}:${data.holeNumber}:${data.strokes}:${data.putts ?? 0}:${data.points ?? 0}:${data.markerId || 'self'}:${recordedAtIso}:${data.previousHash}`;
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  async verifyScorecard(tournamentId: string, userId: string, groupId?: string) {
    const scores = await this.prisma.score.findMany({
      where: {
        userId,
        groupId: groupId || undefined,
      },
      include: {
        hole: true,
      },
      orderBy: {
        hole: { number: 'asc' },
      },
    });

    if (scores.length === 0) {
      return {
        valid: true,
        tamperedAtHole: null,
        totalHolesVerified: 0,
        message: 'No scores recorded yet',
      };
    }

    let expectedPrevHash = 'GENESIS';
    let verifiedCount = 0;

    for (const score of scores) {
      const holeNumber = score.hole.number;
      const computedHash = this.calculateScoreHash({
        tournamentId,
        userId,
        holeNumber,
        strokes: score.strokes,
        putts: score.putts,
        points: score.points,
        markerId: score.markerId,
        recordedAt: score.recordedAt,
        previousHash: expectedPrevHash,
      });

      if (score.previousHash && score.previousHash !== expectedPrevHash) {
        this.logger.warn(`Cryptographic chain broken at hole ${holeNumber} for user ${userId}. Expected ${expectedPrevHash}, found ${score.previousHash}`);
        return {
          valid: false,
          tamperedAtHole: holeNumber,
          reason: `Broken cryptographic chain link at hole ${holeNumber}`,
          totalHolesVerified: verifiedCount,
        };
      }

      if (score.integrityHash && score.integrityHash !== computedHash) {
        this.logger.warn(`Score payload hash mismatch at hole ${holeNumber} for user ${userId}. Expected ${computedHash}, stored ${score.integrityHash}`);
        return {
          valid: false,
          tamperedAtHole: holeNumber,
          reason: `Data tampering detected at hole ${holeNumber}`,
          totalHolesVerified: verifiedCount,
        };
      }

      expectedPrevHash = score.integrityHash || computedHash;
      verifiedCount++;
    }

    return {
      valid: true,
      tamperedAtHole: null,
      totalHolesVerified: verifiedCount,
      finalIntegrityHash: expectedPrevHash,
    };
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
      await this.reconcileLeaderboard(score.group.tournamentId);
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

  /**
   * Reconciles tournament leaderboard from PostgreSQL into Redis derived model.
   * PostgreSQL is the immutable source of truth.
   * Atomically swaps version pointer in Redis: lb:{tournamentId}:active_ver
   */
  async reconcileLeaderboard(tournamentId: string) {
    try {
      const data = await this.getPublicLeaderboardData(tournamentId);
      const standings = this.computeLeaderboardStandings(tournamentId, data);

      if (this.redisClient && this.redisClient.isOpen) {
        const version = Date.now();
        const versionKey = `lb:${tournamentId}:v${version}`;
        const activeVerKey = `lb:${tournamentId}:active_ver`;

        // Write snapshot to versioned key
        await this.redisClient.set(versionKey, JSON.stringify(standings), {
          EX: 3600, // 1 hour TTL
        });

        // Get old version for cleanup
        const oldVersion = await this.redisClient.get(activeVerKey);

        // Atomically swap active version pointer
        await this.redisClient.set(activeVerKey, version.toString());

        // Remove old version key
        if (oldVersion && oldVersion !== version.toString()) {
          await this.redisClient.del(`lb:${tournamentId}:v${oldVersion}`);
        }

        this.logger.log(
          `Reconciled leaderboard for tournament ${tournamentId} to Redis version ${version}`,
        );
      }

      // Broadcast update to live room
      this.leaderboardGateway.broadcastScoreUpdate(tournamentId, standings);
      return standings;
    } catch (err: any) {
      this.logger.error(
        `Failed to reconcile leaderboard for tournament ${tournamentId}: ${err.message}`,
      );
      throw err;
    }
  }

  /**
   * Computes official standings from raw PostgreSQL registration and score entities
   */
  computeLeaderboardStandings(tournamentId: string, data: { registrations: any[]; scores: any[] }) {
    const playerScores = data.registrations.map((reg) => {
      const playerScoresList = data.scores.filter((s) => s.userId === reg.user.id);
      const grossScore = playerScoresList.reduce((acc, curr) => acc + curr.strokes, 0);
      const totalPoints = playerScoresList.reduce((acc, curr) => acc + (curr.points || 0), 0);
      const netScore = grossScore - (reg.user.handicap || 0);

      return {
        playerId: reg.user.id,
        playerName: `${reg.user.firstName || ''} ${reg.user.lastName || ''}`.trim() || 'Player',
        grossScore,
        netScore,
        totalPoints,
        thru: playerScoresList.length,
        status: reg.status,
        madeCut: reg.madeCut,
        profilePhoto: reg.user.profilePhoto,
        position: 0,
      };
    });

    // Sort by Net Score asc
    playerScores.sort((a, b) => a.netScore - b.netScore);
    playerScores.forEach((ps, index) => {
      ps.position = index + 1;
    });

    return {
      tournamentId,
      scores: playerScores,
      updatedAt: new Date().toISOString(),
      reconciledFrom: 'PostgreSQL_Source_Of_Truth',
    };
  }

  /**
   * Retrieves current leaderboard from active Redis version with seamless fallback to PostgreSQL
   */
  async getCachedLeaderboard(tournamentId: string) {
    if (this.redisClient && this.redisClient.isOpen) {
      try {
        const activeVerKey = `lb:${tournamentId}:active_ver`;
        const activeVer = await this.redisClient.get(activeVerKey);
        if (activeVer) {
          const raw = await this.redisClient.get(`lb:${tournamentId}:v${activeVer}`);
          if (raw) {
            return JSON.parse(raw);
          }
        }
      } catch (err: any) {
        this.logger.warn(`Redis leaderboard cache read failed, falling back to PostgreSQL: ${err.message}`);
      }
    }

    // Reconcile and return
    return this.reconcileLeaderboard(tournamentId);
  }
}
