import { randomBytes } from 'crypto';
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  ClubStatus as OrganizerStatus,
  MemberStatus,
  TournamentStatus,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma.service';
import { JobsService } from '../jobs/jobs.service';
import { UpdateOrganizerDto } from './dto/update-organizer.dto';

@Injectable()
export class OrganizersService {
  constructor(
    private prisma: PrismaService,
    private jobsService: JobsService,
  ) {}

  async stats(id: string) {
    const organizer = await this.prisma.club.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!organizer) throw new NotFoundException('Organizer not found');

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
    ]);

    const totalRevenueRow = await this.prisma.$queryRaw<
      Array<{ amount: number | null }>
    >`
      SELECT COALESCE(SUM(t."entryFee"), 0) AS amount
      FROM "Registration" r
      JOIN "Tournament" t ON t."id" = r."tournamentId"
      WHERE r."paymentStatus" = 'PAID'
        AND t."deletedAt" IS NULL
        AND t."clubId" = ${id}
    `;
    const revenueThisMonthRow = await this.prisma.$queryRaw<
      Array<{ amount: number | null }>
    >`
      SELECT COALESCE(SUM(t."entryFee"), 0) AS amount
      FROM "Registration" r
      JOIN "Tournament" t ON t."id" = r."tournamentId"
      WHERE r."paymentStatus" = 'PAID'
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
      WHERE r."paymentStatus" = 'PAID'
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
      WHERE r."paymentStatus" = 'UNPAID'
        AND t."deletedAt" IS NULL
        AND t."clubId" = ${id}
    `;

    const totalRevenue = Number(totalRevenueRow?.[0]?.amount ?? 0);
    const revenueThisMonth = Number(revenueThisMonthRow?.[0]?.amount ?? 0);
    const revenueLastMonth = Number(revenueLastMonthRow?.[0]?.amount ?? 0);
    const unpaidAmount = Number(unpaidAmountRow?.[0]?.amount ?? 0);

    return {
      totalMembers: 0,
      membersThisMonth: 0,
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

  async findAll(query: { search?: string }) {
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

    return this.prisma.club.findMany({
      where,
      include: {
        _count: { select: { tournaments: true, courses: true } },
        users: {
          where: { role: UserRole.CLUB_ADMIN, deletedAt: null },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
            phone: true,
          },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const organizer = await this.prisma.club.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: { select: { tournaments: true, courses: true } },
        users: {
          where: { role: UserRole.CLUB_ADMIN, deletedAt: null },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
            phone: true,
          },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });
    if (!organizer) throw new NotFoundException('Organizer not found');
    return organizer;
  }

  async update(id: string, dto: UpdateOrganizerDto) {
    const existing = await this.prisma.club.findFirst({
      where: { id, deletedAt: null },
      include: {
        users: {
          where: { role: UserRole.CLUB_ADMIN, deletedAt: null },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
            phone: true,
          },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });
    if (!existing) throw new NotFoundException('Organizer not found');

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

            // Queue admin credentials email with the generated password
            const targetName = dto.name?.trim();
            this.jobsService
              .queueEmail('ADMIN_CREDENTIALS', email, {
                clubName: targetName || existing.name,
                email,
                password: passwordPlain,
              })
              .catch((err) => {
                console.error('Failed to queue adminCredentials email:', err);
              });
          }
        }
      }
    });

    return this.findOne(id);
  }

  async suspend(id: string) {
    const organizer = await this.prisma.club.findFirst({
      where: { id, deletedAt: null },
    });
    if (!organizer) throw new NotFoundException('Organizer not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.club.update({
        where: { id },
        data: { status: OrganizerStatus.SUSPENDED },
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

    // Queue account suspended emails to all club admins
    const suspendedAdmins = await this.prisma.user.findMany({
      where: { clubId: id, role: UserRole.CLUB_ADMIN, deletedAt: null },
      select: { email: true },
    });
    for (const admin of suspendedAdmins) {
      if (admin.email) {
        this.jobsService
          .queueEmail('ACCOUNT_SUSPENDED', admin.email, {
            clubName: organizer.name,
          })
          .catch((err) => {
            console.error('Failed to queue accountSuspended email:', err);
          });
      }
    }

    return this.findOne(id);
  }

  async activate(id: string) {
    const organizer = await this.prisma.club.findFirst({
      where: { id, deletedAt: null },
    });
    if (!organizer) throw new NotFoundException('Organizer not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.club.update({
        where: { id },
        data: { status: OrganizerStatus.ACTIVE },
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

    // Queue account reactivated emails to all club admins
    const reactivatedAdmins = await this.prisma.user.findMany({
      where: { clubId: id, role: UserRole.CLUB_ADMIN, deletedAt: null },
      select: { email: true },
    });
    for (const admin of reactivatedAdmins) {
      if (admin.email) {
        this.jobsService
          .queueEmail('ACCOUNT_REACTIVATED', admin.email, {
            clubName: organizer.name,
          })
          .catch((err) => {
            console.error('Failed to queue accountReactivated email:', err);
          });
      }
    }

    return this.findOne(id);
  }

  async forceLogout(id: string) {
    const organizer = await this.prisma.club.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!organizer) throw new NotFoundException('Organizer not found');

    const nextUat = new Date(Date.now() + 1);
    const r = await this.prisma.user.updateMany({
      where: { clubId: id, deletedAt: null },
      data: { updatedAt: nextUat },
    });

    return { success: true, affected: r.count };
  }

  async remove(id: string) {
    const organizer = await this.prisma.club.findUnique({ where: { id } });
    if (!organizer) throw new NotFoundException('Organizer not found');

    // Check if the organizer has hosted any tournaments before
    const tournamentCount = await this.prisma.tournament.count({
      where: { clubId: id, deletedAt: null },
    });
    if (tournamentCount > 0) {
      throw new ConflictException(
        'This organizer has hosted tournaments before and cannot be deleted. Please suspend the organizer instead.',
      );
    }

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

      const courses = await tx.course.findMany({
        where: { clubId: id },
        select: { id: true },
      });
      const courseIds = courses.map((c) => c.id);

      const holes = courseIds.length
        ? await tx.hole.findMany({
            where: { courseId: { in: courseIds } },
            select: { id: true },
          })
        : [];
      const holeIds = holes.map((h) => h.id);

      if (groupIds.length || holeIds.length) {
        await tx.score.deleteMany({
          where: {
            OR: [
              ...(groupIds.length ? [{ groupId: { in: groupIds } }] : []),
              ...(holeIds.length ? [{ holeId: { in: holeIds } }] : []),
            ],
          },
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

      if (holeIds.length) {
        await tx.hole.deleteMany({ where: { id: { in: holeIds } } });
      }
      if (courseIds.length) {
        await tx.course.deleteMany({ where: { id: { in: courseIds } } });
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
