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

const MAX_PAGE_SIZE = 100;

@Injectable()
export class RegistrationsService {
  constructor(private prisma: PrismaService) {}

  async register(
    userId: string,
    dto: RegisterTournamentDto,
    isAdmin = false,
  ) {
    const { tournamentId, playerType, paymentReference, status: requestedStatus, paymentStatus: requestedPaymentStatus } = dto;

    // 1. Fetch tournament, user details, and approved registration count in parallel
    const [tournament, user, approvedCount] = await Promise.all([
      this.prisma.tournament.findUnique({
        where: { id: tournamentId },
      }),
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.registration.count({
        where: { tournamentId, status: RegistrationStatus.APPROVED },
      }),
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
    if (!isAdmin && tournament.hasHandicapRestriction) {
      if (user.handicap === null) {
        throw new BadRequestException(
          'A handicap index is required to register for this tournament',
        );
      }
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

    let status: RegistrationStatus = isAdmin && requestedStatus ? (requestedStatus as RegistrationStatus) : RegistrationStatus.PENDING;

    if (tournament.maxPlayers && approvedCount >= tournament.maxPlayers) {
      if (isAdmin) {
        // Admin manual registration: Auto-increment maxPlayers if at capacity and approving
        if (status === RegistrationStatus.APPROVED) {
          await this.prisma.tournament.update({
            where: { id: tournamentId },
            data: { maxPlayers: { increment: 1 } },
          });
        }
      } else {
        // Player registration
        if (tournament.enableWaitlist) {
          status = RegistrationStatus.WAITLISTED;
        } else {
          throw new BadRequestException('Tournament has reached maximum capacity');
        }
      }
    }

    // 8. Create Registration
    return this.prisma.registration.create({
      data: {
        userId,
        tournamentId,
        playerType: effectivePlayerType,
        status,
        paymentStatus: isAdmin && requestedPaymentStatus ? (requestedPaymentStatus as PaymentStatus) : (paymentReference ? PaymentStatus.PAID : PaymentStatus.UNPAID),
        paymentReference,
      },
    });
  }

  async getMyRegistrations(userId: string, skip = 0, take = 100) {
    const safeTake = Math.min(take, 100);
    return this.prisma.registration.findMany({
      where: { userId },
      skip,
      take: safeTake,
      select: {
        id: true,
        registeredAt: true,
        status: true,
        playerType: true,
        paymentStatus: true,
        paymentReference: true,
        extraStrokes: true,
        userId: true,
        tournamentId: true,
        tournament: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            status: true,
            club: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
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
      const tokens = q.split(/[\s-]+/).filter(Boolean);

      if (tokens.length > 0) {
        where.AND = tokens.map(token => ({
          OR: [
            { user: { email: { contains: token, mode: 'insensitive' } } },
            { user: { firstName: { contains: token, mode: 'insensitive' } } },
            { user: { lastName: { contains: token, mode: 'insensitive' } } },
            { tournament: { name: { contains: token, mode: 'insensitive' } } },
            { tournament: { club: { name: { contains: token, mode: 'insensitive' } } } },
          ],
        }));
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.registration.findMany({
        where,
        skip: query.skip ? +query.skip : 0,
        take: query.take ? Math.min(+query.take, MAX_PAGE_SIZE) : 10,
        orderBy: { registeredAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, profilePhoto: true, gender: true, dob: true, handicap: true },
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
      const registration = await this.prisma.registration.findUnique({
        where: { id: registrationId },
      });

      if (!registration) throw new NotFoundException('Registration not found');

      // If moving to APPROVED status, check capacity
      if (status === RegistrationStatus.APPROVED && registration.status !== RegistrationStatus.APPROVED) {
        const [tournament, approvedCount] = await Promise.all([
          this.prisma.tournament.findUnique({
            where: { id: registration.tournamentId },
          }),
          this.prisma.registration.count({
            where: { tournamentId: registration.tournamentId, status: RegistrationStatus.APPROVED },
          }),
        ]);

        if (tournament && tournament.maxPlayers && approvedCount >= tournament.maxPlayers) {
          // Auto-increment maxPlayers if at capacity
          await this.prisma.tournament.update({
            where: { id: tournament.id },
            data: { maxPlayers: { increment: 1 } },
          });
        }
      }

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

  async findOne(id: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
      include: {
        tournament: {
          select: { id: true, clubId: true },
        },
      },
    });
    if (!registration) throw new NotFoundException('Registration not found');
    return registration;
  }

  async addStrokes(registrationId: string, delta: number): Promise<any> {
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

  async remove(id: string) {
    return this.prisma.registration.delete({
      where: { id },
    });
  }
}
