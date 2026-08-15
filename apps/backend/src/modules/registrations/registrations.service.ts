import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import {
  RegistrationStatus,
  PaymentStatus,
  TournamentStatus,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { JobsService } from '../jobs/jobs.service';
import { RegisterTournamentDto } from './dto/register-tournament.dto';

const MAX_PAGE_SIZE = 100;

@Injectable()
export class RegistrationsService {
  constructor(
    private prisma: PrismaService,
    private jobsService: JobsService,
  ) {}

  async register(userId: string, dto: RegisterTournamentDto, isAdmin = false) {
    const {
      tournamentId,
      playerType,
      paymentReference,
      status: requestedStatus,
      paymentStatus: requestedPaymentStatus,
    } = dto;

    // 1. Fetch tournament, user details, and approved registration count in parallel
    const [tournament, user, approvedCount] = await Promise.all([
      this.prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: { club: { select: { name: true } } },
      }),
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.registration.count({
        where: { tournamentId, status: { in: [RegistrationStatus.APPROVED, RegistrationStatus.PENDING] } },
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

    // 3.5 Validate if Tournament has started
    if (new Date() > new Date(tournament.startDate)) {
      throw new BadRequestException(
        'Registration is closed. The tournament has already started and we do not accept new registrations after Day 1 has commenced.',
      );
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

    // 5.5 Validate Eligibility (Gender)
    if (tournament.genderRestriction === 'MALE_ONLY' && user.gender !== 'MALE') {
      throw new BadRequestException('This tournament is restricted to male players only');
    }
    if (tournament.genderRestriction === 'FEMALE_ONLY' && user.gender !== 'FEMALE') {
      throw new BadRequestException('This tournament is restricted to female players only');
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
      case 'MALE':
        platformMax = 28;
        break;
      case 'FEMALE':
        platformMax = 36;
        break;
      default:
        platformMax = 54;
    }

    if (userHandicap > platformMax) {
      throw new BadRequestException(
        `Your handicap ${userHandicap} exceeds the platform maximum for ${user.gender?.toLowerCase() || 'unspecified'} golfers (${platformMax}). Please update your handicap in your profile.`,
      );
    }

    // 7. Check Capacity & Waitlist

    const paymentStatusVal =
      isAdmin && requestedPaymentStatus
        ? (requestedPaymentStatus as PaymentStatus)
        : paymentReference
          ? PaymentStatus.PAID
          : PaymentStatus.UNPAID;

    let status: RegistrationStatus =
      isAdmin && requestedStatus
        ? (requestedStatus as RegistrationStatus)
        : RegistrationStatus.PENDING;

    // Auto-approve if paid
    if (paymentStatusVal === PaymentStatus.PAID && status === RegistrationStatus.PENDING) {
      status = RegistrationStatus.APPROVED;
    }

    if (tournament.maxPlayers && approvedCount >= tournament.maxPlayers) {
      if (isAdmin) {
        // Admin manual registration: Auto-increment maxPlayers if at capacity and approving
        if (status === RegistrationStatus.APPROVED || status === RegistrationStatus.PENDING) {
          await this.prisma.tournament.update({
            where: { id: tournamentId },
            data: { maxPlayers: Math.max(tournament.maxPlayers, approvedCount + 1) },
          });
        }
      } else {
        // Player registration
        if (tournament.enableWaitlist) {
          status = RegistrationStatus.WAITLISTED;
        } else {
          throw new BadRequestException(
            'Tournament has reached maximum capacity',
          );
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
        paymentStatus: paymentStatusVal,
        paymentReference,
      },
    });

    if (user?.email) {
      if (status === RegistrationStatus.APPROVED) {
        this.jobsService
          .queueEmail('REGISTRATION_APPROVED', user.email, {
            tournamentName: tournament.name,
            organizerName: tournament.club?.name,
          })
          .catch((err) => {
            console.error('Failed to queue registrationApproved email:', err);
          });
      } else if (status === RegistrationStatus.WAITLISTED) {
        this.jobsService
          .queueEmail('WAITLIST_NOTIFICATION', user.email, {
            tournamentName: tournament.name,
            organizerName: tournament.club?.name,
          })
          .catch((err) => {
            console.error('Failed to queue waitlistNotification email:', err);
          });
      }
    }

    return registration;
  }

  async invitePlayer(dto: import('./dto/invite-player.dto').InvitePlayerDto, inviter: any) {
    const { tournamentId, email } = dto;
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { club: { select: { name: true } } },
    });

    if (!tournament) throw new NotFoundException('Tournament not found');

    if (inviter.role !== 'SUPER_ADMIN') {
      if (tournament.clubId !== inviter.clubId) {
        throw new ForbiddenException('You do not have access to this tournament.');
      }
    }

    let user = await this.prisma.user.findUnique({ where: { email } });
    const isNewUser = !user;

    if (user) {
      if (['SUPER_ADMIN', 'CLUB_ADMIN', 'MANAGER', 'STAFF'].includes(user.role)) {
        throw new BadRequestException('Administrators and managers cannot be invited to tournaments as players.');
      }
    }

    const inviteToken = require('crypto').randomBytes(32).toString('hex');
    const inviteTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (!user) {
      // Create shadow account
      const randomPassword = require('crypto').randomBytes(16).toString('hex');
      const hashedPassword = await require('bcrypt').hash(randomPassword, 10);
      user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'PLAYER',
          status: 'PENDING',
          inviteToken,
          inviteTokenExpires,
        },
      });
    }

    const existing = await this.prisma.registration.findUnique({
      where: { userId_tournamentId: { userId: user.id, tournamentId } },
    });

    if (existing) {
      throw new ConflictException('Player is already registered for this tournament');
    }

    const registration = await this.prisma.registration.create({
      data: {
        userId: user.id,
        tournamentId,
        playerType: 'PLAYER',
        status: RegistrationStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
      },
    });

    const inviteUrl = isNewUser
      ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invite?token=${inviteToken}&from=/tournaments/${tournamentId}/register`
      : `${process.env.FRONTEND_URL || 'http://localhost:3000'}/tournaments/${tournamentId}/register`;

    await this.jobsService.queueEmail('TOURNAMENT_PLAYER_INVITE', email, {
      tournamentName: tournament.name,
      clubName: tournament.club?.name || 'Tournament Organizer',
      inviteUrl,
      isNewUser,
    });

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
    orderBy?: 'registeredAt' | 'updatedAt';
  }) {
    const where: any = {};
    if (query.status) {
      where.status = query.status;
    } else if (typeof query.disqualified === 'boolean') {
      if (query.disqualified) {
        where.status = RegistrationStatus.DISQUALIFIED;
      } else {
        where.status = query.excludeWaitlist
          ? {
              notIn: [
                RegistrationStatus.DISQUALIFIED,
                RegistrationStatus.WAITLISTED,
                RegistrationStatus.REJECTED,
              ],
            }
          : { not: RegistrationStatus.DISQUALIFIED };
      }
    } else if (query.waitlistOnly) {
      where.status = {
        in: [RegistrationStatus.WAITLISTED, RegistrationStatus.REJECTED],
      };
    } else if (query.excludeWaitlist) {
      where.status = {
        notIn: [RegistrationStatus.WAITLISTED, RegistrationStatus.REJECTED],
      };
    }
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.clubId) where.tournament = { clubId: query.clubId };
    if (query.tournamentId) where.tournamentId = query.tournamentId;
    if (query.userId) where.userId = query.userId;
    if (query.q?.trim()) {
      const q = query.q.trim();
      const tokens = q.split(/[\s-]+/).filter(Boolean);

      if (tokens.length > 0) {
        where.AND = tokens.map((token) => ({
          OR: [
            { user: { email: { contains: token, mode: 'insensitive' } } },
            { user: { firstName: { contains: token, mode: 'insensitive' } } },
            { user: { lastName: { contains: token, mode: 'insensitive' } } },
            { tournament: { name: { contains: token, mode: 'insensitive' } } },
            {
              tournament: {
                club: { name: { contains: token, mode: 'insensitive' } },
              },
            },
          ],
        }));
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.registration.findMany({
        where,
        skip: query.skip ? +query.skip : 0,
        take: query.take ? Math.min(+query.take, MAX_PAGE_SIZE) : 10,
        orderBy: (query.orderBy === 'updatedAt' ? { updatedAt: 'desc' } : { registeredAt: 'desc' }) as any,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              profilePhoto: true,
              gender: true,
              dob: true,
              handicap: true,
            },
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

  async getStats(clubId?: string) {
    const where = clubId ? { tournament: { clubId } } : {};
    
    // Total transactions
    const totalTransactions = await this.prisma.registration.count({ where });

    // Aggregate entry fees
    const registrations = await this.prisma.registration.findMany({
      where,
      select: {
        paymentStatus: true,
        registeredAt: true,
        tournament: {
          select: {
            entryFee: true,
          }
        }
      }
    });

    let totalRevenue = 0;
    let pendingAmount = 0;
    let refundsAmount = 0;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000);

    let currentPeriodTxns = 0;
    let previousPeriodTxns = 0;
    let currentPeriodRev = 0;
    let previousPeriodRev = 0;

    for (const reg of registrations) {
      const fee = reg.tournament?.entryFee || 0;
      if (reg.paymentStatus === 'PAID') totalRevenue += fee;
      if (reg.paymentStatus === 'UNPAID') pendingAmount += fee;
      if (reg.paymentStatus === 'REFUNDED') refundsAmount += fee;

      // Trend calculations
      const isCurrentPeriod = reg.registeredAt >= thirtyDaysAgo;
      const isPreviousPeriod = reg.registeredAt >= sixtyDaysAgo && reg.registeredAt < thirtyDaysAgo;

      if (isCurrentPeriod) {
        currentPeriodTxns++;
        if (reg.paymentStatus === 'PAID') currentPeriodRev += fee;
      } else if (isPreviousPeriod) {
        previousPeriodTxns++;
        if (reg.paymentStatus === 'PAID') previousPeriodRev += fee;
      }
    }

    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      totalTransactions,
      totalRevenue,
      pendingAmount,
      refundsAmount,
      transactionsChange: parseFloat(calcChange(currentPeriodTxns, previousPeriodTxns).toFixed(1)),
      revenueChange: parseFloat(calcChange(currentPeriodRev, previousPeriodRev).toFixed(1)),
    };
  }

  async updateStatus(registrationId: string, status: RegistrationStatus) {
    try {
      const registration = await this.prisma.registration.findUnique({
        where: { id: registrationId },
      });

      if (!registration) throw new NotFoundException('Registration not found');

      // If moving to a slot-consuming status from a non-consuming status
      const takesSlot = (s: RegistrationStatus) => s === RegistrationStatus.APPROVED || s === RegistrationStatus.PENDING;
      
      if (
        takesSlot(status) &&
        !takesSlot(registration.status)
      ) {
        const [tournament, approvedCount] = await Promise.all([
          this.prisma.tournament.findUnique({
            where: { id: registration.tournamentId },
          }),
          this.prisma.registration.count({
            where: {
              tournamentId: registration.tournamentId,
              status: { in: [RegistrationStatus.APPROVED, RegistrationStatus.PENDING] },
            },
          }),
        ]);

        if (tournament && new Date() > new Date(tournament.startDate)) {
          throw new BadRequestException(
            'Cannot approve waitlist. The tournament has already started.',
          );
        }

        if (
          tournament &&
          tournament.maxPlayers &&
          approvedCount >= tournament.maxPlayers
        ) {
          // Auto-increment maxPlayers if at capacity to fit the new total
          await this.prisma.tournament.update({
            where: { id: tournament.id },
            data: { maxPlayers: Math.max(tournament.maxPlayers, approvedCount + 1) },
          });
        }
      }

      const updated = await this.prisma.registration.update({
        where: { id: registrationId },
        data: { status },
      });

      // Queue status-change emails
      if (
        status === RegistrationStatus.APPROVED ||
        status === RegistrationStatus.REJECTED ||
        status === RegistrationStatus.DISQUALIFIED
      ) {
        const [statusUser, statusTournament] = await Promise.all([
          this.prisma.user.findUnique({
            where: { id: registration.userId },
            select: { email: true, firstName: true },
          }),
          this.prisma.tournament.findUnique({
            where: { id: registration.tournamentId },
            select: { name: true, club: { select: { name: true } } },
          }),
        ]);

        if (statusUser?.email && statusTournament) {
          let template = 'REGISTRATION_REJECTED';
          if (status === RegistrationStatus.APPROVED)
            template = 'REGISTRATION_APPROVED';
          else if (status === RegistrationStatus.DISQUALIFIED)
            template = 'PLAYER_DISQUALIFIED';

          this.jobsService
            .queueEmail(template, statusUser.email, {
              tournamentName: statusTournament.name,
              organizerName: statusTournament.club?.name,
            })
            .catch((err) => {
              console.error(`Failed to queue ${template} email:`, err);
            });
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
        tournament: {
          select: { name: true, club: { select: { name: true } } },
        },
      },
    });

    if (updated.user?.email && updated.tournament) {
      this.jobsService
        .queueEmail('PLAYER_STROKE_PENALTY', updated.user.email, {
          tournamentName: updated.tournament.name,
          strokes: delta,
          organizerName: updated.tournament.club?.name,
        })
        .catch((err) => {
          console.error(`Failed to queue PLAYER_STROKE_PENALTY email:`, err);
        });
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
    const existingRegistration = await this.prisma.registration.findUnique({
      where: { id: registrationId }
    });

    if (!existingRegistration) throw new NotFoundException('Registration not found');

    const newStatus = existingRegistration.status === RegistrationStatus.PENDING 
      ? RegistrationStatus.APPROVED 
      : existingRegistration.status;

    const registration = await this.prisma.registration.update({
      where: { id: registrationId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        paymentReference,
        status: newStatus,
      },
      include: {
        user: { select: { email: true } },
        tournament: { select: { name: true, entryFee: true, currency: true, club: { select: { name: true } } } },
      },
    });

    if (registration.user?.email && registration.tournament) {
      this.jobsService
        .queueEmail('PAYMENT_RECEIPT', registration.user.email, {
          tournamentName: registration.tournament.name,
          amount: registration.tournament.entryFee || 0,
          currency: registration.tournament.currency || 'USD',
          reference: paymentReference,
        })
        .catch((err) => {
          console.error('Failed to queue paymentReceipt email:', err);
        });

      if (existingRegistration.status === RegistrationStatus.PENDING && newStatus === RegistrationStatus.APPROVED) {
        this.jobsService
          .queueEmail('REGISTRATION_APPROVED', registration.user.email, {
            tournamentName: registration.tournament.name,
            organizerName: registration.tournament.club?.name,
          })
          .catch((err) => {
            console.error('Failed to queue REGISTRATION_APPROVED email:', err);
          });
      }
    }

    return registration;
  }

  async remove(id: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
      include: {
        user: { select: { email: true } },
        tournament: {
          select: { name: true, club: { select: { name: true } } },
        },
      },
    });

    if (!registration) throw new NotFoundException('Registration not found');

    // Remove the user from any tournament groupings (flights/tee times) by deleting their scores in this tournament
    await this.prisma.score.deleteMany({
      where: {
        userId: registration.userId,
        group: {
          tournamentId: registration.tournamentId,
        },
      },
    });

    const deleted = await this.prisma.registration.delete({
      where: { id },
    });

    if (registration?.user?.email && registration?.tournament?.name) {
      if (
        registration.status === RegistrationStatus.WAITLISTED ||
        registration.status === RegistrationStatus.PENDING ||
        registration.status === RegistrationStatus.APPROVED
      ) {
        this.jobsService
          .queueEmail('REGISTRATION_REJECTED', registration.user.email, {
            tournamentName: registration.tournament.name,
            organizerName: registration.tournament.club?.name,
          })
          .catch((err) => {
            console.error(
              'Failed to queue REGISTRATION_REJECTED email on removal:',
              err,
            );
          });
      }
    }

    return deleted;
  }
}
