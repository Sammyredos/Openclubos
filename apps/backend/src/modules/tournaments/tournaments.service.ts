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
import { SendchampService } from '../sendchamp/sendchamp.service';
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
    private sendchampService: SendchampService,
  ) {}

  private dailyRemindedTournaments = new Set<string>();
  private lastRemindedDate: string | null = null;

  async create(dto: CreateTournamentDto) {
    const existing = await this.prisma.tournament.findFirst({
      where: {
        name: { equals: dto.name.trim(), mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new ConflictException(
        'A tournament with this name already exists. Please choose a unique name.',
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
      startType: dto.startType ?? 'TEE_TIMES',
      teeStartTime: dto.teeStartTime ?? null,
      teeIntervalMinutes: dto.teeIntervalMinutes ?? 10,
      // Scoring
      
      
      
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

  async checkName(name: string, excludeId?: string): Promise<boolean> {
    if (!name || !name.trim()) return false;
    const existing = await this.prisma.tournament.findFirst({
      where: {
        name: { equals: name.trim(), mode: 'insensitive' },
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
        course: { select: { id: true, name: true, coverImage: true } },
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
          club: { select: { id: true, name: true, logo: true } },
          course: { select: { id: true, name: true, coverImage: true } },
          visibility: true,
          lockedGroupingsDays: true,
          startType: true,
          teeStartTime: true,
          teeIntervalMinutes: true,
          maxPlayersPerGroup: true,
          autoGrouping: true,
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
    if (dto.startType !== undefined) data.startType = dto.startType;
    if (dto.teeStartTime !== undefined) data.teeStartTime = dto.teeStartTime;
    if (dto.teeIntervalMinutes !== undefined)
      data.teeIntervalMinutes = dto.teeIntervalMinutes;

    
    
    

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

    if (dto.name && dto.name.trim() !== existing.name) {
      const duplicate = await this.prisma.tournament.findFirst({
        where: {
          name: { equals: dto.name.trim(), mode: 'insensitive' },
          id: { not: id },
        },
      });
      if (duplicate) {
        throw new ConflictException(
          'A tournament with this name already exists. Please choose a unique name.',
        );
      }
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

  private formatTeeTime(timeStr?: string | null): string {
    if (!timeStr) return 'TBA';
    const trimmed = timeStr.trim();

    // If it's an ISO timestamp string like 2026-08-18T08:20:00.000Z
    if (trimmed.includes('T')) {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        const hours = d.getUTCHours();
        const minutes = d.getUTCMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const h12 = hours % 12 || 12;
        const strHours = h12 < 10 ? `0${h12}` : `${h12}`;
        const strMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
        return `${strHours}:${strMinutes} ${ampm}`;
      }
    }

    // If already formatted like "08:30 AM" or "8:30 PM"
    if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(trimmed)) {
      return trimmed;
    }

    // If 24-hour time string like "08:30" or "14:20:00"
    const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const strHours = hours < 10 ? `0${hours}` : `${hours}`;
      return `${strHours}:${minutes} ${ampm}`;
    }

    return trimmed;
  }

  async publishGroupingsEmail(tournamentId: string, dto: any) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { club: true },
    });

    if (!tournament) throw new NotFoundException('Tournament not found');

    const dayNumber = dto.day || 1;
    const startDate = tournament.startDate ? new Date(tournament.startDate) : null;
    let scheduledDateStr = '';
    if (startDate && !isNaN(startDate.getTime())) {
      const targetDate = new Date(startDate);
      targetDate.setDate(targetDate.getDate() + (dayNumber - 1));
      scheduledDateStr = targetDate.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }

    const jobs: any[] = [];
    for (const group of dto.groups || []) {
      const groupName = group.name || 'TBA';
      const teeTime = this.formatTeeTime(group.startTime);
      const roundName = `Day ${dayNumber}${scheduledDateStr ? ` (${scheduledDateStr})` : ''}`;

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
              date: scheduledDateStr,
              teeTime,
              groupName,
              groupMembers,
              organizerName: tournament.club?.name,
              startType: tournament.startType,
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

  async publishGroupingsWhatsApp(tournamentId: string, dto: any) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { club: true },
    });

    if (!tournament) throw new NotFoundException('Tournament not found');

    const dayNumber = dto.day || 1;
    const startDate = tournament.startDate ? new Date(tournament.startDate) : null;
    let scheduledDateStr = '';
    if (startDate && !isNaN(startDate.getTime())) {
      const targetDate = new Date(startDate);
      targetDate.setDate(targetDate.getDate() + (dayNumber - 1));
      scheduledDateStr = targetDate.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }

    const groups = dto.groups || [];
    let sentCount = 0;
    const errors: string[] = [];

    for (const group of groups) {
      const groupName = group.name || 'TBA';
      const teeTime = this.formatTeeTime(group.startTime);
      const roundName = `Day ${dayNumber}`;
      const members = group.registrations || [];

      for (let i = 0; i < members.length; i++) {
        const player = members[i];
        const phone = player.user?.phone;
        const firstName = player.user?.firstName || 'Player';

        if (!phone) continue;

        const groupMembers = members
          .filter((_: any, index: number) => index !== i)
          .map((m: any) =>
            `${m.user?.firstName || ''} ${m.user?.lastName || ''}`.trim(),
          )
          .filter(Boolean);

        const partnersText =
          groupMembers.length > 0
            ? groupMembers.join(', ')
            : 'No other players assigned yet';

        const isShotgun = tournament.startType === 'SHOTGUN';
        const flightLabel = isShotgun ? 'Starting Hole' : 'Flight / Group';

        const dateLine = scheduledDateStr ? `\n• Date: *${scheduledDateStr}*` : '';

        const message = `⛳ *OpenClubOS Tee-Off Assignment*

Tournament: *${tournament.name}*
Schedule: *${roundName}${scheduledDateStr ? ` (${scheduledDateStr})` : ''}*

Hi *${firstName}*, your tournament grouping has been confirmed:${dateLine}
• ${flightLabel}: *${groupName}*
• Tee Time: *${teeTime}*
• Playing Partners: ${partnersText}

Please arrive at least 30 minutes before your tee time. Best of luck on the course!`;

        try {
          await this.sendchampService.sendWhatsApp({
            recipient: phone,
            message,
          });
          sentCount++;
        } catch (err: any) {
          errors.push(`${firstName} (${phone}): ${err.message}`);
        }
      }
    }

    return {
      success: true,
      sentCount,
      errors: errors.length > 0 ? errors : undefined,
      message:
        sentCount > 0
          ? `WhatsApp flight notifications dispatched to ${sentCount} players via Sendchamp.`
          : 'No players with valid phone numbers found to message.',
    };
  }

  /**
   * Server-side cutline calculation engine with official golf tie resolution.
   * Calculates standings, applies Top N and ties threshold, updates Registration.madeCut in Postgres,
   * dispatches player notification jobs, and records an immutable AuditLog entry.
   */
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
      throw new ConflictException('Tournament does not have a cut rule enabled or configured.');
    }

    const cutTarget = tournament.cutLine; // e.g. Top 50 or percentage
    if (tournament.registrations.length === 0) {
      return { success: true, message: 'No registered players found to evaluate for cut.', madeCutCount: 0, missedCutCount: 0 };
    }

    const scores = await this.prisma.score.findMany({
      where: { group: { tournamentId } },
    });

    // Compute player scores
    const playerScores = tournament.registrations.map((reg) => {
      const pScores = scores.filter((s) => s.userId === reg.userId);
      const gross = pScores.reduce((sum, s) => sum + s.strokes, 0);
      const points = pScores.reduce((sum, s) => sum + (s.points || 0), 0);
      const net = gross - (reg.user.handicap || 0);

      const scoreValue = tournament.format === 'STABLEFORD' ? points : tournament.scoringType === 'NET' ? net : gross;
      return {
        registrationId: reg.id,
        userId: reg.userId,
        email: reg.user.email,
        name: `${reg.user.firstName || ''} ${reg.user.lastName || ''}`.trim(),
        scoreValue,
        thru: pScores.length,
      };
    });

    // Sort players: Stableford is descending (highest points wins), Stroke Play is ascending (lowest score wins)
    if (tournament.format === 'STABLEFORD') {
      playerScores.sort((a, b) => b.scoreValue - a.scoreValue);
    } else {
      playerScores.sort((a, b) => a.scoreValue - b.scoreValue);
    }

    let targetCount = cutTarget;
    if (targetCount < 0) {
      const percentage = Math.abs(targetCount);
      targetCount = Math.max(1, Math.floor((playerScores.length * percentage) / 100));
    }

    const cutLineIndex = Math.min(targetCount - 1, playerScores.length - 1);
    const thresholdValue = playerScores[cutLineIndex]?.scoreValue ?? 0;

    const passedPlayers: { email: string; name: string }[] = [];
    const missedPlayers: { email: string; name: string }[] = [];
    const qualifiedIds: string[] = [];
    const missedIds: string[] = [];

    for (const player of playerScores) {
      const madeCut =
        tournament.format === 'STABLEFORD'
          ? player.scoreValue >= thresholdValue
          : player.scoreValue <= thresholdValue;

      if (madeCut) {
        qualifiedIds.push(player.registrationId);
        if (player.email) passedPlayers.push({ email: player.email, name: player.name });
      } else {
        missedIds.push(player.registrationId);
        if (player.email) missedPlayers.push({ email: player.email, name: player.name });
      }
    }

    // Atomic Database Updates
    await this.prisma.$transaction(async (tx) => {
      if (qualifiedIds.length > 0) {
        await tx.registration.updateMany({
          where: { id: { in: qualifiedIds } },
          data: { madeCut: true },
        });
      }

      if (missedIds.length > 0) {
        await tx.registration.updateMany({
          where: { id: { in: missedIds } },
          data: { madeCut: false },
        });
      }

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          action: 'APPLY_CUT',
          resource: 'Tournament',
          before: { tournamentId, status: 'PRE_CUT' },
          after: {
            tournamentId,
            cutTarget,
            thresholdValue,
            madeCutCount: qualifiedIds.length,
            missedCutCount: missedIds.length,
            appliedAt: new Date().toISOString(),
          },
        },
      });
    });

    // Queue cut result emails
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

    return {
      success: true,
      tournamentId,
      cutTarget,
      thresholdValue,
      madeCutCount: qualifiedIds.length,
      missedCutCount: missedIds.length,
      message: 'Cut applied successfully with official tie resolution.',
    };
  }

  async getGroupings(tournamentId: string, day: number) {
    const groups = await this.prisma.group.findMany({
      where: { tournamentId, day },
      include: {
        players: {
          include: {
            registration: {
              include: { user: true }
            }
          }
        }
      },
      orderBy: { startTime: 'asc' }
    });

    const assignedRegistrationIds = groups.flatMap(g => g.players.map(p => p.registrationId));

    const unassignedRegistrations = await this.prisma.registration.findMany({
      where: {
        tournamentId,
        status: 'APPROVED',
        paymentStatus: 'PAID',
        id: { notIn: assignedRegistrationIds.length > 0 ? assignedRegistrationIds : ['none'] }
      },
      include: { user: true }
    });

    return {
      groups: groups.map(g => ({
        id: g.id,
        name: g.name,
        startTime: g.startTime ? g.startTime.toISOString() : null,
        registrations: g.players.map(p => ({
          id: p.registration.id,
          paymentStatus: p.registration.paymentStatus,
          user: {
            id: p.registration.user.id,
            email: p.registration.user.email,
            firstName: p.registration.user.firstName,
            lastName: p.registration.user.lastName,
            handicap: p.registration.user.handicap,
            profilePhoto: p.registration.user.profilePhoto,
            gender: p.registration.user.gender,
            dob: p.registration.user.dob,
          }
        }))
      })),
      unassigned: unassignedRegistrations.map(r => ({
        id: r.id,
        paymentStatus: r.paymentStatus,
        user: {
          id: r.user.id,
          email: r.user.email,
          firstName: r.user.firstName,
          lastName: r.user.lastName,
          handicap: r.user.handicap,
          profilePhoto: r.user.profilePhoto,
          gender: r.user.gender,
          dob: r.user.dob,
        }
      })),
      rule: 'DATABASE'
    };
  }

  async clearGroupings(tournamentId: string, day: number) {
    await this.prisma.group.deleteMany({
      where: { tournamentId, day }
    });
    return this.getGroupings(tournamentId, day);
  }

  async updateGroupingTime(tournamentId: string, groupId: string, dto: { name?: string; startTime?: string; day: number }) {
    await this.prisma.group.update({
      where: { id: groupId },
      data: {
        name: dto.name,
        startTime: dto.startTime ? new Date(dto.startTime) : null
      }
    });
    return this.getGroupings(tournamentId, dto.day);
  }

  async movePlayerInGroupings(tournamentId: string, registrationId: string, targetGroupId: string | null, day: number) {
    // Delete from current groups on this day
    await this.prisma.groupPlayer.deleteMany({
      where: {
        registrationId,
        group: {
          tournamentId,
          day
        }
      }
    });

    // Insert into target group if provided
    if (targetGroupId) {
      await this.prisma.groupPlayer.create({
        data: {
          groupId: targetGroupId,
          registrationId
        }
      });
    }
    return this.getGroupings(tournamentId, day);
  }

  async generateGroupings(tournamentId: string, day: number, rule: string) {
    if (rule === 'MANUAL_EMPTY') {
      await this.clearGroupings(tournamentId, day);
    }
    
    const unassigned = await this.prisma.registration.findMany({
      where: { 
        tournamentId, 
        status: 'APPROVED', 
        paymentStatus: 'PAID',
        groupings: {
          none: {
            group: { day }
          }
        }
      },
      include: { user: true }
    });
    
    // Sort logic placeholder (Random by default)
    if (rule.includes('RANDOM')) {
      unassigned.sort(() => Math.random() - 0.5);
    } else if (rule.includes('GROSS')) {
      // Very basic mock sorting for demo
      unassigned.sort((a, b) => (a.user.handicap || 0) - (b.user.handicap || 0));
    }
    
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId }
    });
    const maxPlayersPerGroup = tournament?.maxPlayersPerGroup || 4;
    const interval = tournament?.teeIntervalMinutes || 10;
    const startTimeStr = tournament?.teeStartTime || "08:00";
    const startType = tournament?.startType || "TEE_TIMES";
    
    let existingGroups: any[] = [];
    if (rule !== 'MANUAL_EMPTY') {
      existingGroups = await this.prisma.group.findMany({
        where: { tournamentId, day },
        include: { players: true },
        orderBy: { startTime: 'asc' }
      });
      
      // Fill open slots in existing groups
      for (const group of existingGroups) {
        const currentCount = group.players.length;
        const availableSlots = maxPlayersPerGroup - currentCount;
        
        if (availableSlots > 0 && unassigned.length > 0) {
          const playersToFill = unassigned.splice(0, availableSlots);
          await this.prisma.groupPlayer.createMany({
            data: playersToFill.map(p => ({
              groupId: group.id,
              registrationId: p.id
            }))
          });
        }
      }
    }
    
    const rawTime = (tournament?.teeStartTime || "08:00").trim();
    let startHour = 8;
    let startMin = 0;
    const isPM = /pm/i.test(rawTime);
    const isAM = /am/i.test(rawTime);
    const cleanNumbers = rawTime.replace(/[^0-9:]/g, '');
    const [rawH, rawM] = cleanNumbers.split(':').map(Number);
    if (!isNaN(rawH)) {
      startHour = rawH;
      if (isPM && startHour < 12) startHour += 12;
      if (isAM && startHour === 12) startHour = 0;
    }
    if (!isNaN(rawM)) {
      startMin = rawM;
    }
    
    let currentHour = startHour;
    let currentMin = startMin;
    
    let currentGroupIndex = 0;
    if (existingGroups.length > 0) {
      currentGroupIndex = existingGroups.length;
      if (startType !== "SHOTGUN") {
        currentMin += interval * currentGroupIndex;
        if (currentMin >= 60) {
          currentHour += Math.floor(currentMin / 60);
          currentMin = currentMin % 60;
        }
      }
    }
    
    while (unassigned.length > 0) {
      const playersChunk = unassigned.splice(0, maxPlayersPerGroup);
      
      let groupName = "";
      if (startType === "SHOTGUN") {
        groupName = `Hole ${currentGroupIndex + 1}`;
      } else {
        groupName = `Flight ${currentGroupIndex + 1}`;
      }
      
      const startTime = new Date();
      if (tournament?.startDate) {
        const tourneyStart = new Date(tournament.startDate);
        if (!isNaN(tourneyStart.getTime())) {
          startTime.setUTCFullYear(
            tourneyStart.getUTCFullYear(),
            tourneyStart.getUTCMonth(),
            tourneyStart.getUTCDate() + (day - 1)
          );
        }
      }
      
      if (startType === "SHOTGUN") {
        startTime.setUTCHours(startHour, startMin, 0, 0);
      } else {
        startTime.setUTCHours(currentHour, currentMin, 0, 0);
      }

      const group = await this.prisma.group.create({
        data: {
          tournamentId,
          day,
          name: groupName,
          startTime
        }
      });
      
      if (rule !== "MANUAL_EMPTY") {
        await this.prisma.groupPlayer.createMany({
          data: playersChunk.map(p => ({
            groupId: group.id,
            registrationId: p.id
          }))
        });
      }
      
      if (startType !== "SHOTGUN") {
        currentMin += interval;
        if (currentMin >= 60) {
          currentHour += Math.floor(currentMin / 60);
          currentMin = currentMin % 60;
        }
      }
      
      currentGroupIndex++;
    }
    
    return this.getGroupings(tournamentId, day);
  }
}
