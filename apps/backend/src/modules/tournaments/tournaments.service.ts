import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { JobsService } from '../jobs/jobs.service';

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
      throw new ConflictException('A tournament with this name already exists in this club');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      // Basic
      name: dto.name,
      description: dto.description ?? null,
      bannerUrl: dto.bannerUrl ?? null,
      venue: dto.venue ?? null,
      location: dto.location ?? null,
      // Club / Course
      clubId: dto.clubId,
      courseId: dto.courseId,
      // Dates
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      registrationOpenAt: dto.registrationOpenAt ? new Date(dto.registrationOpenAt) : null,
      registrationCloseAt: dto.registrationCloseAt ? new Date(dto.registrationCloseAt) : null,
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
      // Limits
      maxPlayers: dto.maxPlayers ?? null,
      maxPlayersPerGroup: dto.maxPlayersPerGroup ?? 4,
      enableWaitlist: dto.enableWaitlist ?? false,
      // Payments
      requiresPayment: dto.requiresPayment ?? false,
      entryFee: dto.entryFee ?? null,
      currency: dto.currency ?? 'NGN',
      paymentDeadline: dto.paymentDeadline ? new Date(dto.paymentDeadline) : null,
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
      status: dto.status ?? (dto.publishImmediately ? 'REGISTRATION_OPEN' : 'DRAFT'),
    } as any;
    const result = await this.prisma.tournament.create({
      data,
      include: { club: true, course: true },
    });
    await this.cacheService.reset();

    // Queue tournament announcement emails to all club members
    if (result.status === 'REGISTRATION_OPEN' || result.publishImmediately) {
      const clubMembers = await this.prisma.user.findMany({
        where: { clubId: result.clubId },
        select: { email: true },
      });

      for (const member of clubMembers) {
        if (member.email) {
          this.jobsService.queueEmail('TOURNAMENT_ANNOUNCEMENT', member.email, {
            tournamentName: result.name,
            startDate: result.startDate,
            venue: result.venue,
          }).catch(err => console.error('Failed to queue tournamentAnnouncement email:', err));
        }
      }
    }

    return result;
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
        where.AND = tokens.map(token => ({
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
        club: { select: { id: true, name: true } },
        course: { select: { id: true, name: true } },
        visibility: true,
        createdAt: true,
        _count: {
          select: {
            registrations: {
              where: { status: 'APPROVED' }
            }
          }
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

    const cached = await this.cacheService.get<{ items: any[]; total: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    const where: any = {};
    if (query.clubId) where.clubId = query.clubId;
    if (query.status) where.status = query.status;
    if (query.search?.trim()) {
      const q = query.search.trim();
      const tokens = q.split(/[\s-]+/).filter(Boolean);

      if (tokens.length > 0) {
        where.AND = tokens.map(token => ({
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
          createdAt: true,
          _count: {
            select: {
              registrations: {
                where: { status: 'APPROVED' }
              }
            }
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tournament.count({ where }),
    ]);

    const result = { items, total };
    await this.cacheService.set(cacheKey, result, 300);
    return result;
  }

  @Cron('*/5 * * * *')
  async autoUpdateStatuses() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // 1. Identify tournaments that will transition to COMPLETED
    const completedCandidates = await this.prisma.tournament.findMany({
      where: {
        status: 'ONGOING',
        endDate: { lt: now },
      },
      select: { id: true, name: true, emailsSent: true, club: { select: { name: true } } },
    });
    const completedIds = completedCandidates.map(t => t.id);

    // Mark as COMPLETED if endDate is in the past
    if (completedIds.length > 0) {
      await this.prisma.tournament.updateMany({
        where: { id: { in: completedIds } },
        data: { status: 'COMPLETED' },
      });

      for (const t of completedCandidates) {
        const emailsSent = (t.emailsSent as any) || {};
        if (emailsSent.completed) continue;

        await this.sendTournamentCompletedEmails(t.id, t.name, t.club?.name);

        // Mark as completed in JSON tracking
        await this.prisma.tournament.update({
          where: { id: t.id },
          data: { emailsSent: { ...emailsSent, completed: true } },
        });
      }
    }

    // 2. Identify tournaments that will transition to ONGOING
    const ongoingCandidates = await this.prisma.tournament.findMany({
      where: {
        status: { in: ['REGISTRATION_OPEN', 'PENDING'] as any[] },
        startDate: { lte: now },
        OR: [{ endDate: { gte: now } }, { endDate: null }],
      },
      select: { id: true, name: true, emailsSent: true, club: { select: { name: true } } },
    });
    const ongoingIds = ongoingCandidates.map(t => t.id);

    // Mark as ONGOING
    if (ongoingIds.length > 0) {
      await this.prisma.tournament.updateMany({
        where: { id: { in: ongoingIds } },
        data: { status: 'ONGOING' },
      });

      for (const t of ongoingCandidates) {
        const emailsSent = (t.emailsSent as any) || {};
        if (emailsSent.started) continue;

        await this.sendTournamentStartedEmails(t.id, t.name, t.club?.name);

        // Mark as started in JSON tracking
        await this.prisma.tournament.update({
          where: { id: t.id },
          data: { emailsSent: { ...emailsSent, started: true } },
        });
      }
    }

    // 3. Mark as REGISTRATION_OPEN if startDate is in the future
    await this.prisma.tournament.updateMany({
      where: {
        status: 'DRAFT',
        startDate: { gt: now },
      },
      data: { status: 'REGISTRATION_OPEN' },
    });
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
                where: { status: 'APPROVED' }
              }
            }
          }
        },
      });

      if (!tournament) {
        throw new NotFoundException('Tournament not found');
      }

      return tournament;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error(`[TournamentsService.findOne] Error fetching tournament ${id}:`, error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateTournamentDto) {
    // Manually map fields to ensure we don't pass unexpected fields to Prisma
    // and to handle date conversions safely.
    const data: any = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.bannerUrl !== undefined) data.bannerUrl = dto.bannerUrl;
    if (dto.venue !== undefined) data.venue = dto.venue;
    if (dto.location !== undefined) data.location = dto.location;
    if (dto.clubId !== undefined) data.clubId = dto.clubId;
    if (dto.courseId !== undefined) data.courseId = dto.courseId;
    
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.registrationOpenAt !== undefined) data.registrationOpenAt = dto.registrationOpenAt ? new Date(dto.registrationOpenAt) : null;
    if (dto.registrationCloseAt !== undefined) data.registrationCloseAt = dto.registrationCloseAt ? new Date(dto.registrationCloseAt) : null;
    
    if (dto.format !== undefined) data.format = dto.format;
    if (dto.scoringType !== undefined) data.scoringType = dto.scoringType;
    if (dto.holes !== undefined) data.holes = dto.holes;
    
    if (dto.allowRegisteredPlayers !== undefined) data.allowRegisteredPlayers = dto.allowRegisteredPlayers;
    if (dto.allowGuests !== undefined) data.allowGuests = dto.allowGuests;
    if (dto.allowExternalPlayers !== undefined) data.allowExternalPlayers = dto.allowExternalPlayers;
    if (dto.hasHandicapRestriction !== undefined) data.hasHandicapRestriction = dto.hasHandicapRestriction;
    if (dto.minHandicap !== undefined) data.minHandicap = dto.minHandicap;
    if (dto.maxHandicap !== undefined) data.maxHandicap = dto.maxHandicap;
    if (dto.playerTypes !== undefined) data.playerTypes = dto.playerTypes;
    
    if (dto.maxPlayers !== undefined) data.maxPlayers = dto.maxPlayers;
    if (dto.maxPlayersPerGroup !== undefined) data.maxPlayersPerGroup = dto.maxPlayersPerGroup;
    if (dto.enableWaitlist !== undefined) data.enableWaitlist = dto.enableWaitlist;
    
    if (dto.requiresPayment !== undefined) data.requiresPayment = dto.requiresPayment;
    if (dto.entryFee !== undefined) data.entryFee = dto.entryFee;
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.paymentDeadline !== undefined) data.paymentDeadline = dto.paymentDeadline ? new Date(dto.paymentDeadline) : null;
    if (dto.isRefundable !== undefined) data.isRefundable = dto.isRefundable;
    
    if (dto.divisions !== undefined) data.divisions = dto.divisions;
    
    if (dto.autoGrouping !== undefined) data.autoGrouping = dto.autoGrouping;
    if (dto.teeStartTime !== undefined) data.teeStartTime = dto.teeStartTime;
    if (dto.teeIntervalMinutes !== undefined) data.teeIntervalMinutes = dto.teeIntervalMinutes;
    
    if (dto.enableLiveScoring !== undefined) data.enableLiveScoring = dto.enableLiveScoring;
    if (dto.requireMarkerVerification !== undefined) data.requireMarkerVerification = dto.requireMarkerVerification;
    if (dto.enableHoleScoring !== undefined) data.enableHoleScoring = dto.enableHoleScoring;
    
    if (dto.publishImmediately !== undefined) data.publishImmediately = dto.publishImmediately;
    if (dto.visibility !== undefined) data.visibility = dto.visibility;
    if (dto.status !== undefined) data.status = dto.status;

    const existing = await this.prisma.tournament.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Tournament not found');
    }

    // Dynamic Status Recalculation based on dates
    const intendedStatus = dto.status !== undefined ? dto.status : existing.status;
    if (!['DRAFT', 'CANCELLED'].includes(intendedStatus)) {
      const targetStartDate = data.startDate || existing.startDate;
      const targetEndDate = data.endDate !== undefined ? data.endDate : existing.endDate;
      
      // Use strictly UTC dates for comparison to avoid timezone drift
      const today = new Date();
      const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      const startUTC = new Date(Date.UTC(targetStartDate.getUTCFullYear(), targetStartDate.getUTCMonth(), targetStartDate.getUTCDate()));
      const endUTC = targetEndDate ? new Date(Date.UTC(targetEndDate.getUTCFullYear(), targetEndDate.getUTCMonth(), targetEndDate.getUTCDate())) : null;

      if (endUTC && endUTC.getTime() < todayUTC.getTime()) {
        data.status = 'COMPLETED';
      } else if (startUTC.getTime() <= todayUTC.getTime() && (!endUTC || endUTC.getTime() >= todayUTC.getTime())) {
        data.status = 'ONGOING';
      } else if (startUTC.getTime() > todayUTC.getTime()) {
        data.status = 'REGISTRATION_OPEN';
      }
    }

    const changedFields: string[] = [];
    if (data.name !== undefined && data.name !== existing.name) changedFields.push(`<strong>Tournament Name:</strong> ${data.name}`);
    if (data.startDate !== undefined && existing.startDate && data.startDate.getTime() !== existing.startDate.getTime()) changedFields.push(`<strong>Start Date:</strong> ${data.startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`);
    if (data.endDate !== undefined && ((data.endDate?.getTime() || 0) !== (existing.endDate?.getTime() || 0))) changedFields.push(`<strong>End Date:</strong> ${data.endDate ? data.endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'None'}`);
    if (data.venue !== undefined && data.venue !== existing.venue) changedFields.push(`<strong>Location:</strong> ${data.venue}`);
    if (data.courseId !== undefined && data.courseId !== existing.courseId) changedFields.push(`<strong>Golf Course:</strong> Updated`);
    if (data.maxPlayers !== undefined && data.maxPlayers !== existing.maxPlayers) changedFields.push(`<strong>Player Capacity:</strong> ${data.maxPlayers === null ? 'Unlimited' : data.maxPlayers}`);
    if (data.entryFee !== undefined && data.entryFee !== existing.entryFee) changedFields.push(`<strong>Entry Fee:</strong> ${data.entryFee === null ? 'Free' : data.entryFee}`);
    if (data.format !== undefined && data.format !== existing.format) changedFields.push(`<strong>Format:</strong> ${data.format}`);
    if (data.scoringType !== undefined && data.scoringType !== existing.scoringType) changedFields.push(`<strong>Scoring Type:</strong> ${data.scoringType}`);
    if (data.holes !== undefined && data.holes !== existing.holes) changedFields.push(`<strong>Holes Per Round:</strong> ${data.holes}`);
    if (data.teeStartTime !== undefined && data.teeStartTime !== existing.teeStartTime) changedFields.push(`<strong>Tee Start Time:</strong> ${data.teeStartTime || 'None'}`);
    if (data.description !== undefined && data.description !== existing.description) changedFields.push(`<strong>Description:</strong> Updated`);

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
                where: { status: 'APPROVED' }
              }
            }
          },
        },
      });
      await this.cacheService.reset();

      // Queue tournament update emails to all approved players
      if (changedFields.length > 0 && result.status !== 'DRAFT') {
        const approvedRegistrations = await this.prisma.registration.findMany({
          where: { tournamentId: id, status: 'APPROVED' },
          select: { user: { select: { email: true } } },
        });

        for (const reg of approvedRegistrations) {
          if (reg.user?.email) {
            this.jobsService.queueEmail('TOURNAMENT_UPDATED', reg.user.email, {
              tournamentName: result.name,
              updateDetails,
              organizerName: result.club?.name,
            }).catch(err => console.error('Failed to queue TOURNAMENT_UPDATED email:', err));
          }
        }
      }

      return result;
    } catch (error) {
      console.error(`[TournamentsService.update] Error updating tournament ${id}:`, error);
      // Prisma error for record not found is P2025
      if ((error as any).code === 'P2025') {
        throw new NotFoundException('Tournament not found');
      }
      throw error; // Let NestJS handle other errors (will return 500 but now it's logged)
    }
  }

  async remove(id: string) {
    // Check tournament exists first
    const tournament = await this.prisma.tournament.findUnique({ where: { id } });
    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    // Permanently delete all related records to avoid foreign key constraint violations,
    // then delete the tournament itself (hard/permanent delete).
    await this.prisma.$transaction(async (tx) => {
      // Delete scores linked to groups of this tournament
      const groups = await tx.group.findMany({ where: { tournamentId: id }, select: { id: true } });
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

    return { id, deleted: true };
  }

  /**
   * Daily at 9 AM: find tournaments starting in the next 24 hours and queue
   * a TOURNAMENT_REMINDER email for each approved registration.
   */
  @Cron('0 9 * * *')
  async sendTournamentReminders() {
    const now = new Date();
    const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const todayString = now.toISOString().split('T')[0];
    if (this.lastRemindedDate !== todayString) {
      this.dailyRemindedTournaments.clear();
      this.lastRemindedDate = todayString;
    }

    const upcomingTournaments = await this.prisma.tournament.findMany({
      where: {
        startDate: {
          gte: now,
          lte: twentyFourHoursLater,
        },
        status: {
          in: ['REGISTRATION_OPEN', 'ONGOING'],
        },
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        venue: true,
        emailsSent: true,
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
      const emailsSent = (tournament.emailsSent as any) || {};
      if (emailsSent.reminded || this.dailyRemindedTournaments.has(tournament.id)) {
        continue;
      }

      for (const registration of tournament.registrations) {
        if (registration.user?.email) {
          this.jobsService.queueEmail('TOURNAMENT_REMINDER', registration.user.email, {
            tournamentName: tournament.name,
            startDate: tournament.startDate,
            venue: tournament.venue,
            organizerName: tournament.club?.name,
          }).catch(err =>
            console.error('Failed to queue tournamentReminder email:', err),
          );
        }
      }

      // Update the DB to mark as reminded
      await this.prisma.tournament.update({
        where: { id: tournament.id },
        data: { emailsSent: { ...emailsSent, reminded: true } },
      });
      this.dailyRemindedTournaments.add(tournament.id);
    }
  }

  private async sendTournamentStartedEmails(tournamentId: string, tournamentName: string, organizerName?: string) {
    const regs = await this.prisma.registration.findMany({
      where: { tournamentId, status: 'APPROVED' },
      select: { user: { select: { email: true } } },
    });

    for (const reg of regs) {
      if (reg.user?.email) {
        this.jobsService.queueEmail('TOURNAMENT_STARTED', reg.user.email, {
          tournamentName,
          organizerName,
        }).catch(err => console.error('Failed to queue tournamentStarted email:', err));
      }
    }
  }

  private async sendTournamentCompletedEmails(tournamentId: string, tournamentName: string, organizerName?: string) {
    const regs = await this.prisma.registration.findMany({
      where: { tournamentId, status: 'APPROVED' },
      select: { user: { select: { email: true } } },
    });

    for (const reg of regs) {
      if (reg.user?.email) {
        this.jobsService.queueEmail('TOURNAMENT_COMPLETED', reg.user.email, {
          tournamentName,
          organizerName,
        }).catch(err => console.error('Failed to queue tournamentCompleted email:', err));
      }
    }
  }

  async publishGroupingsEmail(tournamentId: string, dto: any) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { club: true }
    });

    if (!tournament) throw new NotFoundException('Tournament not found');

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
          .map((m: any) => `${m.user?.firstName || ''} ${m.user?.lastName || ''}`.trim())
          .filter(Boolean);

        this.jobsService.queueEmail('TEE_TIME_PUBLISHED', player.user.email, {
          tournamentName: tournament.name,
          roundName,
          teeTime,
          groupName,
          groupMembers,
          organizerName: tournament.club?.name,
        }).catch(err => console.error('Failed to queue tee time email:', err));
      }
    }

    return { success: true, message: 'Groupings publication emails queued' };
  }
}
