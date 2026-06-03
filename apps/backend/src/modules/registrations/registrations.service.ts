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

import { JobsService } from '../jobs/jobs.service';

const MAX_PAGE_SIZE = 100;

@Injectable()
export class RegistrationsService {
  constructor(
    private prisma: PrismaService,
    private jobsService: JobsService,
  ) {}

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
        include: { club: { select: { name: true } } }
      }),
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.registration.count({
        where: { tournamentId, status: RegistrationStatus.APPROVED },
      }),
    ]);

    if (!tournament) throw new NotFoundException('Tournament not found');
    if (!user) throw new NotFoundException('User not found');

    // 2. Validate Tournament Status
    if (tournament.status === TournamentStatus.DRAFT) {
      throw new BadRequestException(
        'Cannot register players for a draft tournament. Please publish the tournament first.',
      );
    }
    if (!isAdmin && tournament.status !== TournamentStatus.REGISTRATION_OPEN) {
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
    if (tournament.hasHandicapRestriction) {
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
    // 6.5 Validate Platform Maximum Handicap
    const userHandicap = user.handicap ?? 0;
    let platformMax: number;
    switch (user.gender) {
      case 'MALE': platformMax = 28; break;
      case 'FEMALE': platformMax = 36; break;
      default: platformMax = 54;
    }

    if (userHandicap > platformMax) {
      throw new BadRequestException(
        `Your handicap (${userHandicap}) exceeds the platform maximum for ${user.gender?.toLowerCase() || 'unspecified'} golfers (${platformMax}). Please update your handicap in your profile.`
      );
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
    const registration = await this.prisma.registration.create({
      data: {
        userId,
        tournamentId,
        playerType: effectivePlayerType,
        status,
        paymentStatus: isAdmin && requestedPaymentStatus ? (requestedPaymentStatus as PaymentStatus) : (paymentReference ? PaymentStatus.PAID : PaymentStatus.UNPAID),
        paymentReference,
      },
    });

    if (user?.email) {
      if (status === RegistrationStatus.APPROVED) {
        this.jobsService.queueEmail('REGISTRATION_APPROVED', user.email, {
          tournamentName: tournament.name,
          organizerName: tournament.club?.name,
        }).catch(err => console.error('Failed to queue registrationApproved email:', err));
      } else if (status === RegistrationStatus.WAITLISTED) {
        this.jobsService.queueEmail('WAITLIST_NOTIFICATION', user.email, {
          tournamentName: tournament.name,
          organizerName: tournament.club?.name,
        }).catch(err => console.error('Failed to queue waitlistNotification email:', err));
      } else if (status === RegistrationStatus.PENDING) {
        this.jobsService.queueEmail('REGISTRATION_CONFIRMATION', user.email, {
          tournamentName: tournament.name,
          status: 'PENDING',
          startDate: tournament.startDate,
          organizerName: tournament.club?.name,
        }).catch(err => console.error('Failed to queue registrationConfirmation email:', err));
      }
    }

    return registration;
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
    excludeWaitlist?: boolean;
    waitlistOnly?: boolean;
    skip?: number;
    take?: number;
  }) {
    const where: any = {};
    if (query.status) {
      where.status = query.status;
    } else if (typeof query.disqualified === 'boolean') {
      if (query.disqualified) {
        where.status = RegistrationStatus.DISQUALIFIED;
      } else {
        where.status = query.excludeWaitlist
          ? { notIn: [RegistrationStatus.DISQUALIFIED, RegistrationStatus.WAITLISTED, RegistrationStatus.REJECTED] }
          : { not: RegistrationStatus.DISQUALIFIED };
      }
    } else if (query.waitlistOnly) {
      where.status = { in: [RegistrationStatus.WAITLISTED, RegistrationStatus.REJECTED] };
    } else if (query.excludeWaitlist) {
      where.status = { notIn: [RegistrationStatus.WAITLISTED, RegistrationStatus.REJECTED] };
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

      const updated = await this.prisma.registration.update({
        where: { id: registrationId },
        data: { status },
      });

      // Queue status-change emails
      if (status === RegistrationStatus.APPROVED || status === RegistrationStatus.REJECTED || status === RegistrationStatus.DISQUALIFIED) {
        const [statusUser, statusTournament] = await Promise.all([
          this.prisma.user.findUnique({ where: { id: registration.userId }, select: { email: true, firstName: true } }),
          this.prisma.tournament.findUnique({ where: { id: registration.tournamentId }, select: { name: true, club: { select: { name: true } } } }),
        ]);

        if (statusUser?.email && statusTournament) {
          let template = 'REGISTRATION_REJECTED';
          if (status === RegistrationStatus.APPROVED) template = 'REGISTRATION_APPROVED';
          else if (status === RegistrationStatus.DISQUALIFIED) template = 'PLAYER_DISQUALIFIED';

          this.jobsService.queueEmail(template, statusUser.email, {
            tournamentName: statusTournament.name,
            organizerName: statusTournament.club?.name,
          }).catch(err => console.error(`Failed to queue ${template} email:`, err));
        }
      }

      return updated;
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

    const updated = await this.prisma.registration.update({
      where: { id: registrationId },
      data: { extraStrokes: { increment: delta } },
      include: {
        user: { select: { email: true } },
        tournament: { select: { name: true, club: { select: { name: true } } } },
      }
    });

    if (updated.user?.email && updated.tournament) {
      this.jobsService.queueEmail('PLAYER_STROKE_PENALTY', updated.user.email, {
        tournamentName: updated.tournament.name,
        strokes: delta,
        organizerName: updated.tournament.club?.name,
      }).catch(err => console.error(`Failed to queue PLAYER_STROKE_PENALTY email:`, err));
    }

    return updated;
  }

  async clearStrokes(registrationId: string) {
    return this.prisma.registration.update({
      where: { id: registrationId },
      data: { extraStrokes: 0 },
    });
  }

  async confirmPayment(registrationId: string, paymentReference: string) {
    const registration = await this.prisma.registration.update({
      where: { id: registrationId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        paymentReference,
      },
      include: {
        user: { select: { email: true } },
        tournament: { select: { name: true, entryFee: true, currency: true } },
      },
    });

    if (registration.user?.email && registration.tournament) {
      this.jobsService.queueEmail('PAYMENT_RECEIPT', registration.user.email, {
        tournamentName: registration.tournament.name,
        amount: registration.tournament.entryFee || 0,
        currency: registration.tournament.currency || 'USD',
        reference: paymentReference,
      }).catch(err => console.error('Failed to queue paymentReceipt email:', err));
    }

    return registration;
  }

  async remove(id: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
      include: {
        user: { select: { email: true } },
        tournament: { select: { name: true, club: { select: { name: true } } } },
      },
    });

    const deleted = await this.prisma.registration.delete({
      where: { id },
    });

    if (registration?.user?.email && registration?.tournament?.name) {
      if (registration.status === RegistrationStatus.WAITLISTED || registration.status === RegistrationStatus.PENDING || registration.status === RegistrationStatus.APPROVED) {
        this.jobsService.queueEmail('REGISTRATION_REJECTED', registration.user.email, {
          tournamentName: registration.tournament.name,
          organizerName: registration.tournament.club?.name,
        }).catch(err => console.error('Failed to queue REGISTRATION_REJECTED email on removal:', err));
      }
    }

    return deleted;
  }
}
