import { randomBytes } from 'crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ClubStatus,
  MemberStatus,
  TournamentStatus,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma.service';
import { UpdateClubDto } from './dto/update-club.dto';

@Injectable()
export class ClubsService {
  constructor(private prisma: PrismaService) {}

  async stats(id: string) {
    const club = await this.prisma.club.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!club) throw new NotFoundException('Club not found');

    const now = new Date();
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalTournaments,
      activeTournaments,
      ongoingTournaments,
      paidRegistrations,
      unpaidRegistrations,
      totalMembers,
      membersThisMonth,
    ] = await Promise.all([
      this.prisma.tournament.count({ where: { deletedAt: null, clubId: id } }),
      this.prisma.tournament.count({
        where: {
          deletedAt: null,
          clubId: id,
          status: {
            in: [TournamentStatus.ONGOING, TournamentStatus.REGISTRATION_OPEN],
          },
        },
      }),
      this.prisma.tournament.count({
        where: {
          deletedAt: null,
          clubId: id,
          status: TournamentStatus.ONGOING,
        },
      }),
      this.prisma.registration.count({
        where: {
          paymentStatus: 'PAID',
          tournament: { deletedAt: null, clubId: id },
        },
      }),
      this.prisma.registration.count({
        where: {
          paymentStatus: 'UNPAID',
          tournament: { deletedAt: null, clubId: id },
        },
      }),
      this.prisma.user.count({
        where: { deletedAt: null, clubId: id },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          clubId: id,
          createdAt: { gte: startThisMonth, lt: startNextMonth },
        },
      }),
    ]);

    const totalRevenueRow = await this.prisma.$queryRaw<
      Array<{ amount: number | null }>
    >`
      SELECT COALESCE(SUM(t."entryFee"), 0) AS amount
      FROM "Registration" r
      JOIN "Tournament" t ON t."id" = r."tournamentId"
      WHERE r."paymentStatus" = 'PAID'::"PaymentStatus"
        AND t."deletedAt" IS NULL
        AND t."clubId" = ${id}
    `;
    const revenueThisMonthRow = await this.prisma.$queryRaw<
      Array<{ amount: number | null }>
    >`
      SELECT COALESCE(SUM(t."entryFee"), 0) AS amount
      FROM "Registration" r
      JOIN "Tournament" t ON t."id" = r."tournamentId"
      WHERE r."paymentStatus" = 'PAID'::"PaymentStatus"
        AND t."deletedAt" IS NULL
        AND t."clubId" = ${id}
        AND r."registeredAt" >= ${startThisMonth}
        AND r."registeredAt" < ${startNextMonth}
    `;
    const revenueLastMonthRow = await this.prisma.$queryRaw<
      Array<{ amount: number | null }>
    >`
      SELECT COALESCE(SUM(t."entryFee"), 0) AS amount
      FROM "Registration" r
      JOIN "Tournament" t ON t."id" = r."tournamentId"
      WHERE r."paymentStatus" = 'PAID'::"PaymentStatus"
        AND t."deletedAt" IS NULL
        AND t."clubId" = ${id}
        AND r."registeredAt" >= ${startLastMonth}
        AND r."registeredAt" < ${startThisMonth}
    `;
    const unpaidAmountRow = await this.prisma.$queryRaw<
      Array<{ amount: number | null }>
    >`
      SELECT COALESCE(SUM(t."entryFee"), 0) AS amount
      FROM "Registration" r
      JOIN "Tournament" t ON t."id" = r."tournamentId"
      WHERE r."paymentStatus" = 'UNPAID'::"PaymentStatus"
        AND t."deletedAt" IS NULL
        AND t."clubId" = ${id}
    `;

    const totalRevenue = Number(totalRevenueRow?.[0]?.amount ?? 0);
    const revenueThisMonth = Number(revenueThisMonthRow?.[0]?.amount ?? 0);
    const revenueLastMonth = Number(revenueLastMonthRow?.[0]?.amount ?? 0);
    const unpaidAmount = Number(unpaidAmountRow?.[0]?.amount ?? 0);

    return {
      totalMembers,
      membersThisMonth,
      totalTournaments,
      activeTournaments,
      ongoingTournaments,
      paidRegistrations,
      unpaidRegistrations,
      totalRevenue: Math.round(totalRevenue),
      revenueThisMonth: Math.round(revenueThisMonth),
      revenueLastMonth: Math.round(revenueLastMonth),
      unpaidAmount: Math.round(unpaidAmount),
    };
  }

  async chartData(id: string, range: string) {
    const club = await this.prisma.club.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!club) throw new NotFoundException('Club not found');

    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let grouping: 'DAY' | 'MONTH';

    if (range === 'This Month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      grouping = 'DAY';
    } else if (range === 'Last Year') {
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      endDate = new Date(now.getFullYear(), 0, 1);
      grouping = 'MONTH';
    } else { // This Year
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear() + 1, 0, 1);
      grouping = 'MONTH';
    }

    const registrationsRows = grouping === 'DAY' ? await this.prisma.$queryRaw<
      Array<{ period: number; count: number | bigint }>
    >`
      SELECT EXTRACT(DAY FROM r."registeredAt") AS period, COUNT(r.id) AS count
      FROM "Registration" r
      JOIN "Tournament" t ON t."id" = r."tournamentId"
      WHERE t."deletedAt" IS NULL AND t."clubId" = ${id} AND r."registeredAt" >= ${startDate} AND r."registeredAt" < ${endDate}
      GROUP BY EXTRACT(DAY FROM r."registeredAt") ORDER BY period ASC
    ` : await this.prisma.$queryRaw<
      Array<{ period: number; count: number | bigint }>
    >`
      SELECT EXTRACT(MONTH FROM r."registeredAt") AS period, COUNT(r.id) AS count
      FROM "Registration" r
      JOIN "Tournament" t ON t."id" = r."tournamentId"
      WHERE t."deletedAt" IS NULL AND t."clubId" = ${id} AND r."registeredAt" >= ${startDate} AND r."registeredAt" < ${endDate}
      GROUP BY EXTRACT(MONTH FROM r."registeredAt") ORDER BY period ASC
    `;

    const revenueRows = grouping === 'DAY' ? await this.prisma.$queryRaw<
      Array<{ period: number; amount: number | null }>
    >`
      SELECT EXTRACT(DAY FROM r."registeredAt") AS period, SUM(t."entryFee") AS amount
      FROM "Registration" r
      JOIN "Tournament" t ON t."id" = r."tournamentId"
      WHERE r."paymentStatus" = 'PAID'::"PaymentStatus" AND t."deletedAt" IS NULL AND t."clubId" = ${id} AND r."registeredAt" >= ${startDate} AND r."registeredAt" < ${endDate}
      GROUP BY EXTRACT(DAY FROM r."registeredAt") ORDER BY period ASC
    ` : await this.prisma.$queryRaw<
      Array<{ period: number; amount: number | null }>
    >`
      SELECT EXTRACT(MONTH FROM r."registeredAt") AS period, SUM(t."entryFee") AS amount
      FROM "Registration" r
      JOIN "Tournament" t ON t."id" = r."tournamentId"
      WHERE r."paymentStatus" = 'PAID'::"PaymentStatus" AND t."deletedAt" IS NULL AND t."clubId" = ${id} AND r."registeredAt" >= ${startDate} AND r."registeredAt" < ${endDate}
      GROUP BY EXTRACT(MONTH FROM r."registeredAt") ORDER BY period ASC
    `;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let allPeriods: string[] = [];
    if (grouping === 'MONTH') {
      allPeriods = monthNames;
    } else {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      allPeriods = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
    }

    const formatData = (rows: any[], isRevenue = false) => {
      const map = new Map();
      rows.forEach(r => map.set(Number(r.period), Number(r.amount || r.count || 0)));
      
      return allPeriods.map((name, index) => {
        const periodKey = index + 1;
        const val = map.get(periodKey) || 0;
        return {
          month: name,
          [isRevenue ? 'amount' : 'count']: Math.round(val),
        };
      });
    };

    return {
      registrationData: formatData(registrationsRows, false),
      revenueData: formatData(revenueRows, true),
    };
  }

  async findAll(query: { search?: string; skip?: number; take?: number }) {
    const search = query.search?.trim();
    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];

      if (search.includes(' ')) {
        const parts = search.split(' ');
        const first = parts[0];
        const last = parts.slice(1).join(' ');
        where.OR.push(
          {
            AND: [
              { name: { contains: first, mode: 'insensitive' } },
              { name: { contains: last, mode: 'insensitive' } },
            ],
          },
          {
            AND: [
              { name: { contains: last, mode: 'insensitive' } },
              { name: { contains: first, mode: 'insensitive' } },
            ],
          },
        );
      }
    }

    const MAX_PAGE_SIZE = 100;
    const take = Math.min(query.take ?? 20, MAX_PAGE_SIZE);
    const skip = query.skip ?? 0;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.club.findMany({
        where,
        take,
        skip,
        include: {
          _count: { select: { tournaments: true } },
          users: {
            where: { role: UserRole.CLUB_ADMIN, deletedAt: null },
            select: { id: true, email: true, firstName: true, lastName: true },
            orderBy: { createdAt: 'asc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.club.count({ where }),
    ]);

    return { items, total };
  }

  async findOne(id: string) {
    const club = await this.prisma.club.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: { select: { tournaments: true } },
        users: {
          where: { role: UserRole.CLUB_ADMIN, deletedAt: null },
          select: { id: true, email: true, firstName: true, lastName: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });
    if (!club) throw new NotFoundException('Club not found');
    return club;
  }

  async update(id: string, dto: UpdateClubDto) {
    const existing = await this.prisma.club.findFirst({
      where: { id, deletedAt: null },
      include: {
        users: {
          where: { role: UserRole.CLUB_ADMIN, deletedAt: null },
          select: { id: true, email: true, firstName: true, lastName: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });
    if (!existing) throw new NotFoundException('Club not found');

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.plan !== undefined) data.plan = dto.plan;

    const [firstName, ...rest] = (dto.adminName || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const lastName = rest.join(' ');

    await this.prisma.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.club.update({ where: { id }, data });
      }

      const admin = existing.users?.[0];
      if (dto.adminEmail !== undefined || dto.adminName !== undefined) {
        const userData: any = {};
        if (dto.adminEmail !== undefined) {
          const normalizedEmail = dto.adminEmail?.trim().toLowerCase();
          if (normalizedEmail) userData.email = normalizedEmail;
        }
        if (dto.adminName !== undefined) {
          userData.firstName = firstName || null;
          userData.lastName = lastName || null;
        }
        if (admin) {
          if (Object.keys(userData).length > 0) {
            await tx.user.update({ where: { id: admin.id }, data: userData });
          }
        } else if (userData.email) {
          const email = String(userData.email);
          const existingUser = await tx.user.findFirst({
            where: {
              email: { equals: email, mode: 'insensitive' },
              deletedAt: null,
            },
            select: { id: true },
          });

          if (existingUser) {
            await tx.user.update({
              where: { id: existingUser.id },
              data: {
                ...userData,
                role: UserRole.CLUB_ADMIN,
                clubId: id,
              },
            });
          } else {
            const passwordPlain = randomBytes(18).toString('hex');
            const hashedPassword = await bcrypt.hash(passwordPlain, 10);
            await tx.user.create({
              data: {
                email,
                password: hashedPassword,
                firstName: userData.firstName ?? null,
                lastName: userData.lastName ?? null,
                role: UserRole.CLUB_ADMIN,
                status: MemberStatus.ACTIVE,
                clubId: id,
              },
            });
          }
        }
      }
    });

    return this.findOne(id);
  }

  async suspend(id: string) {
    const club = await this.prisma.club.findFirst({
      where: { id, deletedAt: null },
    });
    if (!club) throw new NotFoundException('Club not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.club.update({
        where: { id },
        data: { status: ClubStatus.SUSPENDED },
      });
      await tx.user.updateMany({
        where: {
          clubId: id,
          deletedAt: null,
          status: { not: MemberStatus.EXPIRED },
          role: UserRole.CLUB_ADMIN,
        },
        data: { status: MemberStatus.SUSPENDED },
      });
      await tx.tournament.updateMany({
        where: {
          clubId: id,
          deletedAt: null,
          status: {
            in: [TournamentStatus.ONGOING, TournamentStatus.REGISTRATION_OPEN],
          },
        },
        data: { status: TournamentStatus.CANCELLED },
      });
    });

    return this.findOne(id);
  }

  async activate(id: string) {
    const club = await this.prisma.club.findFirst({
      where: { id, deletedAt: null },
    });
    if (!club) throw new NotFoundException('Club not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.club.update({
        where: { id },
        data: { status: ClubStatus.ACTIVE },
      });
      await tx.user.updateMany({
        where: {
          clubId: id,
          deletedAt: null,
          status: MemberStatus.SUSPENDED,
          role: UserRole.CLUB_ADMIN,
        },
        data: { status: MemberStatus.ACTIVE },
      });
    });

    return this.findOne(id);
  }

  async forceLogout(id: string) {
    const club = await this.prisma.club.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!club) throw new NotFoundException('Club not found');

    const nextUat = new Date(Date.now() + 1);
    const r = await this.prisma.user.updateMany({
      where: { clubId: id, deletedAt: null },
      data: { updatedAt: nextUat },
    });

    return { success: true, affected: r.count };
  }

  async remove(id: string) {
    const club = await this.prisma.club.findUnique({ where: { id } });
    if (!club) throw new NotFoundException('Club not found');

    await this.prisma.$transaction(async (tx) => {
      const tournaments = await tx.tournament.findMany({
        where: { clubId: id },
        select: { id: true },
      });
      const tournamentIds = tournaments.map((t) => t.id);

      const groups = tournamentIds.length
        ? await tx.group.findMany({
            where: { tournamentId: { in: tournamentIds } },
            select: { id: true },
          })
        : [];
      const groupIds = groups.map((g) => g.id);

      if (groupIds.length) {
        await tx.score.deleteMany({
          where: { groupId: { in: groupIds } },
        });
      }

      if (tournamentIds.length) {
        await tx.registration.deleteMany({
          where: { tournamentId: { in: tournamentIds } },
        });
        await tx.group.deleteMany({
          where: { tournamentId: { in: tournamentIds } },
        });
        await tx.tournament.deleteMany({
          where: { id: { in: tournamentIds } },
        });
      }

      await tx.user.updateMany({
        where: { clubId: id, role: { not: UserRole.CLUB_ADMIN } },
        data: { clubId: null },
      });
      await tx.user.deleteMany({
        where: { clubId: id, role: UserRole.CLUB_ADMIN },
      });

      await tx.club.delete({ where: { id } });
    });

    return { id, deleted: true };
  }
}
