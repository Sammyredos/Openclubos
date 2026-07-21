import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CacheService } from '../../common/cache/cache.service';
import { PrismaService } from '../../common/prisma.service';
import { JobsService } from '../jobs/jobs.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';

const MAX_PAGE_SIZE = 100;

@Injectable()
export class TournamentsService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    @Inject(forwardRef(() => JobsService))
    private jobsService: JobsService,
  ) {}

  private dailyRemindedTournaments = new Set<string>();
  private lastRemindedDate: string | null = null;

  async create(dto: CreateTournamentDto) {
    const existing = await this.prisma.tournament.findFirst({
      where: {
        clubId: dto.clubId,
        name: { equals: dto.name, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new ConflictException(
        'A tournament with this name already exists in this club',
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      // Basic
      name: dto.name,
      description: dto.description ?? null,
      bannerUrl: dto.bannerUrl || '/yellow-9-flag-realistic.png',
      venue: dto.venue ?? null,
      location: dto.location ?? null,
      // Club / Course
      clubId: dto.clubId,
      courseId: dto.courseId,
      // Dates
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      registrationOpenAt: dto.registrationOpenAt
        ? new Date(dto.registrationOpenAt)
        : null,
      registrationCloseAt: dto.registrationCloseAt
        ? new Date(dto.registrationCloseAt)
        : null,
      // Format
      format: dto.format ?? 'STROKE_PLAY',
      scoringType: dto.scoringType ?? 'GROSS',
      holes: dto.holes ?? 18,
      // Eligibility
      allowRegisteredPlayers: dto.allowRegisteredPlayers ?? true,
      allowGuests: dto.allowGuests ?? false,
      allowExternalPlayers: dto.allowExternalPlayers ?? false,
      hasHandicapRestriction: dto.hasHandicapRestriction ?? false,
      minHandicap: dto.minHandicap ?? null,
      maxHandicap: dto.maxHandicap ?? null,
      playerTypes: dto.playerTypes ?? ['MEMBER'],
      genderRestriction: dto.genderRestriction ?? 'MIXED',
      // Cut Rules
      enableCut: dto.enableCut ?? false,
      cutAfterRound: dto.cutAfterRound ?? null,
      cutLine: dto.cutLine ?? null,
      // Limits
      maxPlayers: dto.maxPlayers ?? null,
      maxPlayersPerGroup: dto.maxPlayersPerGroup ?? 4,
      enableWaitlist: dto.enableWaitlist ?? false,
      // Payments
      requiresPayment: dto.requiresPayment ?? false,
      entryFee: dto.entryFee ?? null,
      currency: dto.currency ?? 'NGN',
      paymentDeadline: dto.paymentDeadline
        ? new Date(dto.paymentDeadline)
        : null,
      isRefundable: dto.isRefundable ?? false,
      // Divisions
      divisions: dto.divisions ?? [],
      // Grouping
      autoGrouping: dto.autoGrouping ?? false,
      teeStartTime: dto.teeStartTime ?? null,
      teeIntervalMinutes: dto.teeIntervalMinutes ?? 10,
      // Scoring
      enableLiveScoring: dto.enableLiveScoring ?? false,
      requireMarkerVerification: dto.requireMarkerVerification ?? false,
      enableHoleScoring: dto.enableHoleScoring ?? true,
      // Publish
      publishImmediately: dto.publishImmediately ?? false,
      visibility: dto.visibility ?? 'PUBLIC',
      status:
        dto.status ?? (dto.publishImmediately ? 'REGISTRATION_OPEN' : 'DRAFT'),
    } as any;
    const result = await this.prisma.tournament.create({
      data,
      include: { club: true, course: true },
    });
    await this.cacheService.invalidatePattern('tournaments:*');

    // Queue tournament announcement emails to all club members
    if (result.status === 'REGISTRATION_OPEN' || result.publishImmediately) {
      const clubMembers = await this.prisma.user.findMany({
        where: { clubId: result.clubId },
        select: { email: true },
      });

      const jobs = clubMembers
        .filter((m) => m.email)
        .map((m) => ({
          name: 'SEND_EMAIL',
          data: {
            template: 'TOURNAMENT_ANNOUNCEMENT',
            to: m.email,
            data: {
              tournamentName: result.name,
              startDate: result.startDate,
              venue: result.venue,
            },
          },
        }));
      if (jobs.length > 0) {
        this.jobsService.queueEmailBulk(jobs).catch((err) => {
          console.error('Failed to queue tournamentAnnouncement emails:', err);
        });
      }
    }

    return result;
  }

  async checkName(name: string, clubId: string, excludeId?: string): Promise<boolean> {
    const existing = await this.prisma.tournament.findFirst({
      where: {
        clubId,
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return !existing;
  }

  // Get all tournaments with optimized select to avoid over-fetching
  async findAll(query: { clubId?: string; status?: string; search?: string }) {
    const where: any = {};
    if (query.clubId) where.clubId = query.clubId;
    if (query.status) where.status = query.status;
    if (query.search?.trim()) {
      const q = query.search.trim();
      const tokens = q.split(/[\s-]+/).filter(Boolean);

      if (tokens.length > 0) {
        where.AND = tokens.map((token) => ({
          OR: [
            { name: { contains: token, mode: 'insensitive' } },
            { club: { name: { contains: token, mode: 'insensitive' } } },
            { venue: { contains: token, mode: 'insensitive' } },
          ],
        }));
      }
    }

    return this.prisma.tournament.findMany({
      where,
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        status: true,
        entryFee: true,
        currency: true,
        maxPlayers: true,
        playerTypes: true,
        club: { select: { id: true, name: true, logo: true } },
        course: { select: { id: true, name: true } },
        visibility: true,
        lockedGroupingsDays: true,
        createdAt: true,
        _count: {
          select: {
            registrations: {
              where: { status: { in: ['APPROVED', 'PENDING'] } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllPaged(query: {
    clubId?: string;
    status?: string;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const clubId = query.clubId ?? '';
    const status = query.status ?? '';
    const search = query.search ?? '';
    const skip = query.skip ?? '';
    const takeParam = query.take ?? '';
    const cacheKey = `tournaments:list:${clubId}:${status}:${search}:${skip}:${takeParam}`;



    const where: any = {};
    if (query.clubId) where.clubId = query.clubId;
    if (query.status) where.status = query.status;
    if (query.search?.trim()) {
      const q = query.search.trim();
      const tokens = q.split(/[\s-]+/).filter(Boolean);

      if (tokens.length > 0) {
        where.AND = tokens.map((token) => ({
          OR: [
            { name: { contains: token, mode: 'insensitive' } },
            { club: { name: { contains: token, mode: 'insensitive' } } },
            { venue: { contains: token, mode: 'insensitive' } },
          ],
        }));
      }
    }

    const limit = query.take ? +query.take : 10;
    const take = Math.min(limit, MAX_PAGE_SIZE);

    const [items, total] = await Promise.all([
      this.prisma.tournament.findMany({
        where,
        skip: query.skip ? +query.skip : 0,
        take,
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          status: true,
          entryFee: true,
          currency: true,
          maxPlayers: true,
          playerTypes: true,
          club: { select: { id: true, name: true } },
          course: { select: { id: true, name: true } },
          visibility: true,
          lockedGroupingsDays: true,
          createdAt: true,
          _count: {
            select: {
              registrations: {
                where: { status: { in: ['APPROVED', 'PENDING'] } },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tournament.count({ where }),
    ]);

    const result = { items, total };

    return result;
  }

  async autoUpdateStatuses() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // 1. Transition to COMPLETED
    await this.prisma.tournament.updateMany({
      where: {
        status: 'ONGOING',
        endDate: { lt: now },
      },
      data: { status: 'COMPLETED' },
    });

    // 2. Transition to ONGOING
    await this.prisma.tournament.updateMany({
      where: {
        status: 'REGISTRATION_OPEN',
        startDate: { lte: now },
        OR: [{ endDate: { gte: now } }, { endDate: null }],
      },
      data: { status: 'ONGOING' },
    });

    // 3. Transition to REGISTRATION_OPEN
    await this.prisma.tournament.updateMany({
      where: {
        status: 'DRAFT',
        startDate: { gt: now },
      },
      data: { status: 'REGISTRATION_OPEN' },
    });

    // 4. Send Emails for COMPLETED tournaments
    const completedToEmail = await this.prisma.tournament.findMany({
      where: {
        status: 'COMPLETED',
        emailLogs: { none: { emailType: 'COMPLETED' } },
      },
      select: { id: true, name: true, club: { select: { name: true } } },
    });
    for (const t of completedToEmail) {
      await this.sendTournamentCompletedEmails(t.id, t.name, t.club?.name);
    }

    // 5. Send Emails for ONGOING (STARTED) tournaments
    const startedToEmail = await this.prisma.tournament.findMany({
      where: {
        status: 'ONGOING',
        emailLogs: { none: { emailType: 'STARTED' } },
      },
      select: { id: true, name: true, club: { select: { name: true } } },
    });
    for (const t of startedToEmail) {
      await this.sendTournamentStartedEmails(t.id, t.name, t.club?.name);
    }
  }

  async findOne(id: string) {
    try {
      const tournament = await this.prisma.tournament.findUnique({
        where: { id },
        include: {
          club: true,
          course: true,
          _count: {
            select: {
              registrations: {
                where: { status: { in: ['APPROVED', 'PENDING'] } },
              },
            },
          },
        },
      });

      if (!tournament) {
        throw new NotFoundException('Tournament not found');
      }

      return tournament;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error(
        `[TournamentsService.findOne] Error fetching tournament ${id}:`,
        error,
      );
      throw error;
    }
  }

  async update(id: string, dto: UpdateTournamentDto) {
    // Manually map fields to ensure we don't pass unexpected fields to Prisma
    // and to handle date conversions safely.
    const data: any = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.bannerUrl !== undefined) data.bannerUrl = dto.bannerUrl || '/yellow-9-flag-realistic.png';
    if (dto.venue !== undefined) data.venue = dto.venue;
    if (dto.location !== undefined) data.location = dto.location;
    if (dto.clubId !== undefined) data.clubId = dto.clubId;
    if (dto.courseId !== undefined) data.courseId = dto.courseId;

    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined)
      data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.registrationOpenAt !== undefined)
      data.registrationOpenAt = dto.registrationOpenAt
        ? new Date(dto.registrationOpenAt)
        : null;
    if (dto.registrationCloseAt !== undefined)
      data.registrationCloseAt = dto.registrationCloseAt
        ? new Date(dto.registrationCloseAt)
        : null;

    if (dto.format !== undefined) data.format = dto.format;
    if (dto.scoringType !== undefined) data.scoringType = dto.scoringType;
    if (dto.holes !== undefined) data.holes = dto.holes;

    if (dto.allowRegisteredPlayers !== undefined)
      data.allowRegisteredPlayers = dto.allowRegisteredPlayers;
    if (dto.allowGuests !== undefined) data.allowGuests = dto.allowGuests;
    if (dto.allowExternalPlayers !== undefined)
      data.allowExternalPlayers = dto.allowExternalPlayers;
    if (dto.hasHandicapRestriction !== undefined)
      data.hasHandicapRestriction = dto.hasHandicapRestriction;
    if (dto.minHandicap !== undefined) data.minHandicap = dto.minHandicap;
    if (dto.maxHandicap !== undefined) data.maxHandicap = dto.maxHandicap;
    if (dto.playerTypes !== undefined) data.playerTypes = dto.playerTypes;
    if (dto.genderRestriction !== undefined)
      data.genderRestriction = dto.genderRestriction;

    if (dto.maxPlayers !== undefined) data.maxPlayers = dto.maxPlayers;
    if (dto.maxPlayersPerGroup !== undefined)
      data.maxPlayersPerGroup = dto.maxPlayersPerGroup;
    if (dto.enableWaitlist !== undefined)
      data.enableWaitlist = dto.enableWaitlist;

    if (dto.enableCut !== undefined) data.enableCut = dto.enableCut;
    if (dto.cutAfterRound !== undefined) data.cutAfterRound = dto.cutAfterRound;
    if (dto.cutLine !== undefined) data.cutLine = dto.cutLine;

    if (dto.requiresPayment !== undefined)
      data.requiresPayment = dto.requiresPayment;
    if (dto.entryFee !== undefined) data.entryFee = dto.entryFee;
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.paymentDeadline !== undefined)
      data.paymentDeadline = dto.paymentDeadline
        ? new Date(dto.paymentDeadline)
        : null;
    if (dto.isRefundable !== undefined) data.isRefundable = dto.isRefundable;

    if (dto.divisions !== undefined) data.divisions = dto.divisions;

    if (dto.autoGrouping !== undefined) data.autoGrouping = dto.autoGrouping;
    if (dto.teeStartTime !== undefined) data.teeStartTime = dto.teeStartTime;
    if (dto.teeIntervalMinutes !== undefined)
      data.teeIntervalMinutes = dto.teeIntervalMinutes;

    if (dto.enableLiveScoring !== undefined)
      data.enableLiveScoring = dto.enableLiveScoring;
    if (dto.requireMarkerVerification !== undefined)
      data.requireMarkerVerification = dto.requireMarkerVerification;
    if (dto.enableHoleScoring !== undefined)
      data.enableHoleScoring = dto.enableHoleScoring;

    if (dto.publishImmediately !== undefined)
      data.publishImmediately = dto.publishImmediately;
    if (dto.visibility !== undefined) data.visibility = dto.visibility;
    if (dto.status !== undefined) {
      if (['ONGOING', 'COMPLETED'].includes(dto.status)) {
        throw new ConflictException(
          `Tournament status cannot be manually set to ${dto.status}. Status is auto-calculated based on dates.`,
        );
      }
      data.status = dto.status;
    }
    if (dto.lockedGroupingsDays !== undefined)
      data.lockedGroupingsDays = dto.lockedGroupingsDays;

    const existing = await this.prisma.tournament.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Tournament not found');
    }

    // Dynamic Status Recalculation based on dates
    let intendedStatus =
      dto.status !== undefined ? dto.status : existing.status;

    if (dto.publishImmediately && intendedStatus === 'DRAFT') {
      intendedStatus = 'REGISTRATION_OPEN';
    }

    if (!['DRAFT', 'CANCELLED'].includes(intendedStatus)) {
      const targetStartDate = data.startDate || existing.startDate;
      const targetEndDate =
        data.endDate !== undefined ? data.endDate : existing.endDate;

      // Use strictly UTC dates for comparison to avoid timezone drift
      const today = new Date();
      const todayUTC = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate(),
        ),
      );
      const startUTC = new Date(
        Date.UTC(
          targetStartDate.getUTCFullYear(),
          targetStartDate.getUTCMonth(),
          targetStartDate.getUTCDate(),
        ),
      );
      const endUTC = targetEndDate
        ? new Date(
            Date.UTC(
              targetEndDate.getUTCFullYear(),
              targetEndDate.getUTCMonth(),
              targetEndDate.getUTCDate(),
            ),
          )
        : null;

      if (endUTC && endUTC.getTime() < todayUTC.getTime()) {
        data.status = 'COMPLETED';
      } else if (
        startUTC.getTime() <= todayUTC.getTime() &&
        (!endUTC || endUTC.getTime() >= todayUTC.getTime())
      ) {
        data.status = 'ONGOING';
      } else if (startUTC.getTime() > todayUTC.getTime()) {
        data.status = 'REGISTRATION_OPEN';
      }
    }

    const changedFields: string[] = [];
    if (data.name !== undefined && data.name !== existing.name)
      changedFields.push(`<strong>Tournament Name:</strong> ${data.name}`);
    if (
      data.startDate !== undefined &&
      existing.startDate &&
      data.startDate.getTime() !== existing.startDate.getTime()
    )
      changedFields.push(
        `<strong>Start Date:</strong> ${data.startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      );
    if (
      data.endDate !== undefined &&
      (data.endDate?.getTime() || 0) !== (existing.endDate?.getTime() || 0)
    )
      changedFields.push(
        `<strong>End Date:</strong> ${data.endDate ? data.endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'None'}`,
      );
    if (data.venue !== undefined && data.venue !== existing.venue)
      changedFields.push(`<strong>Location:</strong> ${data.venue}`);
    if (data.courseId !== undefined && data.courseId !== existing.courseId)
      changedFields.push(`<strong>Golf Course:</strong> Updated`);
    if (
      data.maxPlayers !== undefined &&
      data.maxPlayers !== existing.maxPlayers
    )
      changedFields.push(
        `<strong>Player Capacity:</strong> ${data.maxPlayers === null ? 'Unlimited' : data.maxPlayers}`,
      );
    if (data.entryFee !== undefined && data.entryFee !== existing.entryFee)
      changedFields.push(
        `<strong>Entry Fee:</strong> ${data.entryFee === null ? 'Free' : data.entryFee}`,
      );
    if (data.format !== undefined && data.format !== existing.format)
      changedFields.push(`<strong>Format:</strong> ${data.format}`);
    if (
      data.scoringType !== undefined &&
      data.scoringType !== existing.scoringType
    )
      changedFields.push(`<strong>Scoring Type:</strong> ${data.scoringType}`);
    if (data.holes !== undefined && data.holes !== existing.holes)
      changedFields.push(`<strong>Holes Per Round:</strong> ${data.holes}`);
    if (
      data.teeStartTime !== undefined &&
      data.teeStartTime !== existing.teeStartTime
    )
      changedFields.push(
        `<strong>Tee Start Time:</strong> ${data.teeStartTime || 'None'}`,
      );
    if (
      data.description !== undefined &&
      data.description !== existing.description
    )
      changedFields.push(`<strong>Description:</strong> Updated`);

    let updateDetails = '';
    if (changedFields.length > 0) {
      updateDetails = `The tournament organizers have made updates to the following details:<br/><ul style="margin-top: 8px; margin-bottom: 0; padding-left: 20px;"><li>${changedFields.join('</li><li>')}</li></ul><br/>Please review these changes to ensure you are up to date.`;
    }

    try {
      const result = await this.prisma.tournament.update({
        where: { id },
        data,
        include: {
          club: true,
          course: true,
          _count: {
            select: {
              registrations: {
                where: { status: { in: ['APPROVED', 'PENDING'] } },
              },
            },
          },
        },
      });
      await this.cacheService.invalidatePattern('tournaments:*');
      await this.cacheService.invalidatePattern(`tournament:${id}:*`);

      // Queue tournament update emails to all approved players
      if (changedFields.length > 0 && result.status !== 'DRAFT') {
        const approvedRegistrations = await this.prisma.registration.findMany({
          where: { tournamentId: id, status: 'APPROVED' },
          select: { user: { select: { email: true } } },
        });

        const jobs = approvedRegistrations
          .filter((reg) => reg.user?.email)
          .map((reg) => ({
            name: 'SEND_EMAIL',
            data: {
              template: 'TOURNAMENT_UPDATED',
              to: reg.user.email,
              data: {
                tournamentName: result.name,
                updateDetails,
                organizerName: result.club?.name,
              },
            },
          }));
        if (jobs.length > 0) {
          this.jobsService.queueEmailBulk(jobs).catch((err) => {
            console.error('Failed to queue TOURNAMENT_UPDATED emails:', err);
          });
        }
      }

      return result;
    } catch (error) {
      console.error(
        `[TournamentsService.update] Error updating tournament ${id}:`,
        error,
      );
      // Prisma error for record not found is P2025
      if (error.code === 'P2025') {
        throw new NotFoundException('Tournament not found');
      }
      throw error; // Let NestJS handle other errors (will return 500 but now it's logged)
    }
  }

  async remove(id: string) {
    // Check tournament exists first
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
    });
    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    // Permanently delete all related records to avoid foreign key constraint violations,
    // then delete the tournament itself (hard/permanent delete).
    await this.prisma.$transaction(async (tx) => {
      // Delete scores linked to groups of this tournament
      const groups = await tx.group.findMany({
        where: { tournamentId: id },
        select: { id: true },
      });
      const groupIds = groups.map((g) => g.id);
      if (groupIds.length > 0) {
        await tx.score.deleteMany({ where: { groupId: { in: groupIds } } });
      }

      // Delete registrations
      await tx.registration.deleteMany({ where: { tournamentId: id } });

      // Delete groups
      await tx.group.deleteMany({ where: { tournamentId: id } });

      // Finally delete the tournament
      await tx.tournament.delete({ where: { id } });
    });

    await this.cacheService.invalidatePattern('tournaments:*');
    await this.cacheService.invalidatePattern(`tournament:${id}:*`);

    return { id, deleted: true };
  }

  /**
   * Daily at 9 AM: find tournaments starting in the next 24 hours and queue
   * a TOURNAMENT_REMINDER email for each approved registration.
   */
  async sendTournamentReminders() {
    const now = new Date();
    const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingTournaments = await this.prisma.tournament.findMany({
      where: {
        startDate: {
          gte: now,
          lte: twentyFourHoursLater,
        },
        status: {
          in: ['REGISTRATION_OPEN', 'ONGOING'],
        },
        emailLogs: { none: { emailType: 'REMINDER' } },
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        venue: true,
        club: { select: { name: true } },
        registrations: {
          where: { status: 'APPROVED' },
          select: {
            user: { select: { email: true } },
          },
        },
      },
    });

    for (const tournament of upcomingTournaments) {
      await this.prisma.tournamentEmailLog.create({
        data: {
          tournamentId: tournament.id,
          emailType: 'REMINDER',
          recipientCount: tournament.registrations.length,
        },
      });

      const jobs = tournament.registrations
        .filter((reg) => reg.user?.email)
        .map((reg) => ({
          name: 'SEND_EMAIL',
          data: {
            template: 'TOURNAMENT_REMINDER',
            to: reg.user.email,
            data: {
              tournamentName: tournament.name,
              startDate: tournament.startDate,
              venue: tournament.venue || 'TBA',
              organizerName: tournament.club?.name,
            },
          },
        }));

      if (jobs.length > 0) {
        this.jobsService.queueEmailBulk(jobs).catch((err) => {
          console.error('Failed to queue REMINDER emails:', err);
        });
      }
    }
  }

  private async sendTournamentStartedEmails(
    tournamentId: string,
    tournamentName: string,
    organizerName?: string,
  ) {
    const regs = await this.prisma.registration.findMany({
      where: { tournamentId, status: 'APPROVED' },
      select: { user: { select: { email: true } } },
    });

    const jobs = regs
      .filter((reg) => reg.user?.email)
      .map((reg) => ({
        name: 'SEND_EMAIL',
        data: {
          template: 'TOURNAMENT_STARTED',
          to: reg.user.email,
          data: {
            tournamentName,
            organizerName,
          },
        },
      }));
    if (jobs.length > 0) {
      this.jobsService.queueEmailBulk(jobs).catch((err) => {
        console.error('Failed to queue tournamentStarted emails:', err);
      });
      await this.prisma.tournamentEmailLog.create({
        data: {
          tournamentId,
          emailType: 'STARTED',
          recipientCount: jobs.length,
        },
      });
    }
  }

  private async sendTournamentCompletedEmails(
    tournamentId: string,
    tournamentName: string,
    organizerName?: string,
  ) {
    const regs = await this.prisma.registration.findMany({
      where: { tournamentId, status: 'APPROVED' },
      select: { user: { select: { email: true } } },
    });

    const jobs = regs
      .filter((reg) => reg.user?.email)
      .map((reg) => ({
        name: 'SEND_EMAIL',
        data: {
          template: 'TOURNAMENT_COMPLETED',
          to: reg.user.email,
          data: {
            tournamentName,
            organizerName,
          },
        },
      }));
    if (jobs.length > 0) {
      this.jobsService.queueEmailBulk(jobs).catch((err) => {
        console.error('Failed to queue tournamentCompleted emails:', err);
      });
      await this.prisma.tournamentEmailLog.create({
        data: {
          tournamentId,
          emailType: 'COMPLETED',
          recipientCount: jobs.length,
        },
      });
    }
  }

  async publishGroupingsEmail(tournamentId: string, dto: any) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { club: true },
    });

    if (!tournament) throw new NotFoundException('Tournament not found');

    const jobs: any[] = [];
    for (const group of dto.groups || []) {
      const groupName = group.name || 'TBA';
      const teeTime = group.startTime || 'TBA';
      const roundName = `Day ${dto.day || 1}`;

      const members = group.registrations || [];

      for (let i = 0; i < members.length; i++) {
        const player = members[i];
        if (!player.user?.email) continue;

        // Extract the names of all OTHER players in the group
        const groupMembers = members
          .filter((_: any, index: number) => index !== i)
          .map((m: any) =>
            `${m.user?.firstName || ''} ${m.user?.lastName || ''}`.trim(),
          )
          .filter(Boolean);

        jobs.push({
          name: 'SEND_EMAIL',
          data: {
            template: 'TEE_TIME_PUBLISHED',
            to: player.user.email,
            data: {
              tournamentName: tournament.name,
              roundName,
              teeTime,
              groupName,
              groupMembers,
              organizerName: tournament.club?.name,
            },
          },
        });
      }
    }
    if (jobs.length > 0) {
      this.jobsService.queueEmailBulk(jobs).catch((err) => {
        console.error('Failed to queue tee time emails:', err);
      });
    }

    return { success: true, message: 'Groupings publication emails queued' };
  }

  async applyCut(tournamentId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        registrations: {
          where: { status: 'APPROVED' },
          include: {
            user: true,
          },
        },
      },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    if (!tournament.enableCut || !tournament.cutLine) {
      throw new Error('Tournament does not have a cut rule enabled.');
    }

    // Fetch aggregated scores for this tournament to avoid memory overload
    const aggregatedScores = await this.prisma.score.groupBy({
      by: ['userId'],
      where: { group: { tournamentId } },
      _sum: { strokes: true },
    });

    // Map the aggregated scores to a user lookup dictionary
    const userScores: Record<string, number> = {};
    aggregatedScores.forEach((agg) => {
      userScores[agg.userId] = agg._sum.strokes || 0;
    });

    // Calculate total scores for each player
    const playerScores = tournament.registrations.map((reg) => {
      const totalStrokes = userScores[reg.userId] || 0;
      return {
        registrationId: reg.id,
        totalStrokes,
      };
    });

    // Sort players by strokes ascending (lower is better in golf)
    playerScores.sort((a, b) => a.totalStrokes - b.totalStrokes);

    let targetCount = tournament.cutLine;
    if (targetCount < 0) {
      // It's a percentage
      const percentage = Math.abs(targetCount);
      // Calculate how many players should advance
      targetCount = Math.max(
        1,
        Math.floor((playerScores.length * percentage) / 100),
      );
    }

    // Find the score at the cut line position (e.g. 50th player).
    // Note: arrays are 0-indexed, so 50th player is at index 49
    const cutLineIndex = Math.min(targetCount - 1, playerScores.length - 1);
    const cutScoreThreshold = playerScores[cutLineIndex]?.totalStrokes;

    if (cutScoreThreshold === undefined) {
      return { success: true, message: 'Not enough players to apply cut' };
    }

    const passedPlayers: { email: string; name: string }[] = [];
    const missedPlayers: { email: string; name: string }[] = [];

    const updates = playerScores.map((player) => {
      const madeCut = player.totalStrokes <= cutScoreThreshold;

      const reg = tournament.registrations.find(
        (r) => r.id === player.registrationId,
      );
      if (reg && reg.user && reg.user.email) {
        const playerName = `${reg.user.firstName} ${reg.user.lastName}`.trim();
        if (madeCut) {
          passedPlayers.push({ email: reg.user.email, name: playerName });
        } else {
          missedPlayers.push({ email: reg.user.email, name: playerName });
        }
      }

      return this.prisma.registration.update({
        where: { id: player.registrationId },
        data: { madeCut },
      });
    });

    await this.prisma.$transaction(updates);

    // Queue emails in the background
    const jobs: any[] = [];
    for (const player of passedPlayers) {
      jobs.push({
        name: 'SEND_EMAIL',
        data: {
          template: 'TOURNAMENT_CUT_PASSED',
          to: player.email,
          data: {
            tournamentName: tournament.name,
            playerName: player.name,
          },
        },
      });
    }

    for (const player of missedPlayers) {
      jobs.push({
        name: 'SEND_EMAIL',
        data: {
          template: 'TOURNAMENT_CUT_MISSED',
          to: player.email,
          data: {
            tournamentName: tournament.name,
            playerName: player.name,
          },
        },
      });
    }

    if (jobs.length > 0) {
      this.jobsService.queueEmailBulk(jobs).catch((err) => {
        console.error('Failed to queue cut emails:', err);
      });
    }

    return { success: true, message: 'Cut applied successfully' };
  }
}
