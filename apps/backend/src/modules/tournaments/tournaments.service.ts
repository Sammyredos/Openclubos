import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';

@Injectable()
export class TournamentsService {
  constructor(private prisma: PrismaService) {}

  async create(createTournamentDto: CreateTournamentDto) {
    return this.prisma.tournament.create({
      data: {
        ...createTournamentDto,
        startDate: new Date(createTournamentDto.startDate),
        endDate: createTournamentDto.endDate
          ? new Date(createTournamentDto.endDate)
          : null,
        registrationDeadline: createTournamentDto.registrationDeadline
          ? new Date(createTournamentDto.registrationDeadline)
          : null,
      },
      include: { club: true, course: true },
    });
  }

  async findAll(query: { clubId?: string; status?: string }) {
    await this.autoUpdateStatuses();
    const where: any = {};
    if (query.clubId) where.clubId = query.clubId;
    if (query.status) where.status = query.status;

    return this.prisma.tournament.findMany({
      where,
      include: {
        club: true,
        course: true,
        _count: { select: { registrations: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findAllPaged(query: {
    clubId?: string;
    status?: string;
    skip?: number;
    take?: number;
  }) {
    await this.autoUpdateStatuses();
    const where: any = {};
    if (query.clubId) where.clubId = query.clubId;
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      this.prisma.tournament.findMany({
        where,
        skip: query.skip ? +query.skip : 0,
        take: query.take ? +query.take : 10,
        include: {
          club: true,
          course: true,
          _count: { select: { registrations: true } },
        },
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.tournament.count({ where }),
    ]);

    return { items, total };
  }

  private async autoUpdateStatuses() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // 1. Mark as COMPLETED if endDate is in the past
    await this.prisma.tournament.updateMany({
      where: {
        status: { not: 'CANCELLED' },
        endDate: { lt: now },
      },
      data: { status: 'COMPLETED' },
    });

    // 2. Mark as ONGOING if startDate is today or in the past AND (endDate is in the future OR endDate is null)
    await this.prisma.tournament.updateMany({
      where: {
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
        startDate: { lte: now },
        OR: [{ endDate: { gte: now } }, { endDate: null }],
      },
      data: { status: 'ONGOING' },
    });

    // 3. Mark as REGISTRATION_OPEN if startDate is in the future
    await this.prisma.tournament.updateMany({
      where: {
        status: { notIn: ['CANCELLED', 'COMPLETED', 'ONGOING'] },
        startDate: { gt: now },
      },
      data: { status: 'REGISTRATION_OPEN' },
    });
  }

  async findOne(id: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: { club: true, course: true, registrations: true },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    return tournament;
  }

  async update(id: string, updateTournamentDto: UpdateTournamentDto) {
    const data: any = { ...updateTournamentDto };

    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);
    if (data.registrationDeadline)
      data.registrationDeadline = new Date(data.registrationDeadline);

    try {
      return await this.prisma.tournament.update({
        where: { id },
        data,
        include: {
          club: true,
          course: true,
          _count: { select: { registrations: true } },
        },
      });
    } catch (error) {
      throw new NotFoundException('Tournament not found');
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
}
