import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { RegisterTournamentDto } from './dto/register-tournament.dto';
import {
  RegistrationStatus,
  PaymentStatus,
  TournamentStatus,
} from '@prisma/client';

@Injectable()
export class RegistrationsService {
  constructor(private prisma: PrismaService) {}

  async register(
    userId: string,
    dto: RegisterTournamentDto,
    isAdmin = false,
  ) {
    const { tournamentId, playerType, paymentReference } = dto;

    // 1. Fetch tournament and user details
    const [tournament, user] = await Promise.all([
      this.prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: { registrations: true },
      }),
      this.prisma.user.findUnique({ where: { id: userId } }),
    ]);

    if (!tournament) throw new NotFoundException('Tournament not found');
    if (!user) throw new NotFoundException('User not found');

    // 2. Validate Tournament Status
    if (tournament.status !== TournamentStatus.REGISTRATION_OPEN) {
      throw new BadRequestException(
        'Registration is currently closed for this tournament',
      );
    }

    // 3. Validate Deadline
    if (
      tournament.registrationCloseAt &&
      new Date() > new Date(tournament.registrationCloseAt)
    ) {
      throw new BadRequestException('Registration deadline has passed');
    }

    // 4. Check for existing registration
    const existing = await this.prisma.registration.findUnique({
      where: { userId_tournamentId: { userId, tournamentId } },
    });
    if (existing)
      throw new ConflictException(
        'You are already registered for this tournament',
      );

    // 5. Validate Eligibility (Player Type)
    const effectivePlayerType = playerType || user.role;
    if (
      !isAdmin &&
      tournament.playerTypes &&
      tournament.playerTypes.length > 0
    ) {
      if (!tournament.playerTypes.includes(effectivePlayerType)) {
        throw new BadRequestException(
          `This tournament is not open to ${effectivePlayerType}s`,
        );
      }
    }

    // 6. Validate Eligibility (Handicap)
    if (!isAdmin && user.handicap !== null) {
      if (
        tournament.minHandicap !== null &&
        user.handicap < tournament.minHandicap
      ) {
        throw new BadRequestException(
          `Your handicap (${user.handicap}) is below the minimum required (${tournament.minHandicap})`,
        );
      }
      if (
        tournament.maxHandicap !== null &&
        user.handicap > tournament.maxHandicap
      ) {
        throw new BadRequestException(
          `Your handicap (${user.handicap}) exceeds the maximum allowed (${tournament.maxHandicap})`,
        );
      }
    }

    // 7. Check Capacity & Waitlist
    const approvedCount = tournament.registrations.filter(
      (r) => r.status === RegistrationStatus.APPROVED,
    ).length;
    let status: RegistrationStatus = RegistrationStatus.PENDING;

    if (tournament.maxPlayers && approvedCount >= tournament.maxPlayers) {
      status = RegistrationStatus.WAITLISTED;
    }

    // 8. Create Registration
    return this.prisma.registration.create({
      data: {
        userId,
        tournamentId,
        playerType: effectivePlayerType,
        status,
        paymentStatus: paymentReference
          ? PaymentStatus.PAID
          : PaymentStatus.UNPAID,
        paymentReference,
      },
    });
  }

  async getMyRegistrations(userId: string) {
    return this.prisma.registration.findMany({
      where: { userId },
      include: { tournament: true },
    });
  }

  async findAll(query: {
    clubId?: string;
    tournamentId?: string;
    q?: string;
    status?: RegistrationStatus;
    disqualified?: boolean;
    paymentStatus?: PaymentStatus;
    userId?: string;
    skip?: number;
    take?: number;
  }) {
    const where: any = {};
    if (query.status) {
      where.status = query.status;
    } else if (typeof query.disqualified === 'boolean') {
      where.status = query.disqualified
        ? RegistrationStatus.DISQUALIFIED
        : { not: RegistrationStatus.DISQUALIFIED };
    }
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.clubId) where.tournament = { clubId: query.clubId };
    if (query.tournamentId) where.tournamentId = query.tournamentId;
    if (query.userId) where.userId = query.userId;
    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { user: { firstName: { contains: q, mode: 'insensitive' } } },
        { user: { lastName: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.registration.findMany({
        where,
        skip: query.skip ? +query.skip : 0,
        take: query.take ? +query.take : 10,
        orderBy: { registeredAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          tournament: {
            select: {
              id: true,
              name: true,
              entryFee: true,
              startDate: true,
              club: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.registration.count({ where }),
    ]);

    return { items, total };
  }

  async updateStatus(registrationId: string, status: RegistrationStatus) {
    try {
      return await this.prisma.registration.update({
        where: { id: registrationId },
        data: { status },
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '';
      if (
        status === RegistrationStatus.DISQUALIFIED &&
        message.toLowerCase().includes('invalid input value for enum') &&
        message.includes('RegistrationStatus')
      ) {
        throw new BadRequestException(
          'Database is missing DISQUALIFIED status. Apply the latest Prisma migrations and try again.',
        );
      }
      throw e;
    }
  }

  async addStrokes(registrationId: string, delta: number) {
    if (!Number.isFinite(delta) || !Number.isInteger(delta)) {
      throw new BadRequestException('Delta must be an integer');
    }
    if (delta < 1 || delta > 4) {
      throw new BadRequestException('Delta must be between 1 and 4');
    }

    return this.prisma.registration.update({
      where: { id: registrationId },
      data: { extraStrokes: { increment: delta } },
    });
  }

  async clearStrokes(registrationId: string) {
    return this.prisma.registration.update({
      where: { id: registrationId },
      data: { extraStrokes: 0 },
    });
  }

  async confirmPayment(registrationId: string, paymentReference: string) {
    return this.prisma.registration.update({
      where: { id: registrationId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        paymentReference,
      },
    });
  }
}
