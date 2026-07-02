import { Injectable } from '@nestjs/common';
import {
  ClubStatus,
  PaymentStatus,
  TournamentStatus,
  Gender,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class SuperAdminDashboardService {
  constructor(private prisma: PrismaService) {}

  private startOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private startOfNextMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 1);
  }

  private formatChange(current: number, previous: number) {
    const diff = current - previous;
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${diff}`;
  }

  private formatPercentChange(current: number, previous: number) {
    if (previous === 0) {
      if (current === 0) return '0%';
      return '+100%';
    }
    const pct = ((current - previous) / previous) * 100;
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(1).replace(/\\.0$/, '')}%`;
  }

  private async revenueForRange(
    start: Date,
    end: Date,
    paymentStatus: PaymentStatus,
  ) {
    const regs = await this.prisma.registration.findMany({
      where: {
        registeredAt: { gte: start, lt: end },
        paymentStatus,
        tournament: { deletedAt: null, club: { deletedAt: null } },
      },
      select: { tournament: { select: { entryFee: true } } },
    });
    return regs.reduce((sum, r) => sum + (r.tournament.entryFee || 0), 0);
  }

  async stats() {
    const now = new Date();
    const startThisMonth = this.startOfMonth(now);
    const startNextMonth = this.startOfNextMonth(now);
    const startLastMonth = this.startOfMonth(
      new Date(now.getFullYear(), now.getMonth() - 1, 1),
    );

    const [
      totalClubs,
      activeClubs,
      proClubs,
      totalMembers,
      activeTournaments,
      totalCourses,
      menCount,
      womenCount,
    ] = await Promise.all([
      this.prisma.club.count({ where: { deletedAt: null } }),
      this.prisma.club.count({
        where: { deletedAt: null, status: ClubStatus.ACTIVE },
      }),
      this.prisma.club.count({
        where: { deletedAt: null, plan: 'PRO', status: ClubStatus.ACTIVE },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          role: { in: ['CLUB_ADMIN', 'PLAYER', 'MARKER'] },
        },
      }),
      this.prisma.tournament.count({
        where: {
          deletedAt: null,
          status: TournamentStatus.ONGOING,
        },
      }),
      this.prisma.course.count(),
      this.prisma.user.count({
        where: { deletedAt: null, gender: Gender.MALE },
      }),
      this.prisma.user.count({
        where: { deletedAt: null, gender: Gender.FEMALE },
      }),
    ]);

    const [clubsThisMonth, clubsLastMonth] = await Promise.all([
      this.prisma.club.count({
        where: {
          deletedAt: null,
          createdAt: { gte: startThisMonth, lt: startNextMonth },
        },
      }),
      this.prisma.club.count({
        where: {
          deletedAt: null,
          createdAt: { gte: startLastMonth, lt: startThisMonth },
        },
      }),
    ]);

    const [membersThisMonth, membersLastMonth] = await Promise.all([
      this.prisma.user.count({
        where: {
          deletedAt: null,
          role: { in: ['CLUB_ADMIN', 'PLAYER', 'MARKER'] },
          createdAt: { gte: startThisMonth, lt: startNextMonth },
        },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          role: { in: ['CLUB_ADMIN', 'PLAYER', 'MARKER'] },
          createdAt: { gte: startLastMonth, lt: startThisMonth },
        },
      }),
    ]);

    const [tournamentsThisMonth, tournamentsLastMonth] = await Promise.all([
      this.prisma.tournament.count({
        where: {
          deletedAt: null,
          createdAt: { gte: startThisMonth, lt: startNextMonth },
        },
      }),
      this.prisma.tournament.count({
        where: {
          deletedAt: null,
          createdAt: { gte: startLastMonth, lt: startThisMonth },
        },
      }),
    ]);

    const [revenueThisMonth, revenueLastMonth, allTimeRevenue] =
      await Promise.all([
        this.revenueForRange(
          startThisMonth,
          startNextMonth,
          PaymentStatus.PAID,
        ),
        this.revenueForRange(
          startLastMonth,
          startThisMonth,
          PaymentStatus.PAID,
        ),
        this.revenueForRange(
          new Date(0),
          new Date('9999-12-31T00:00:00.000Z'),
          PaymentStatus.PAID,
        ),
      ]);

    const [pendingPayments, pendingAmount] = await Promise.all([
      this.prisma.registration.count({
        where: {
          paymentStatus: PaymentStatus.UNPAID,
          tournament: { deletedAt: null, club: { deletedAt: null } },
        },
      }),
      this.revenueForRange(
        new Date(0),
        new Date('9999-12-31T00:00:00.000Z'),
        PaymentStatus.UNPAID,
      ),
    ]);

    const activeClubsPercent =
      totalClubs === 0
        ? '0% of total'
        : `${Math.round((activeClubs / totalClubs) * 100)}% of total`;

    const activeTournamentsList = await this.prisma.tournament.findMany({
      where: {
        deletedAt: null,
        status: TournamentStatus.ONGOING,
      },
      select: { name: true },
      take: 2,
    });
    const activeTournamentNames = activeTournamentsList.map((t) => t.name);

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const scoresLastHour = await this.prisma.score.count({
      where: {
        recordedAt: { gte: oneHourAgo },
      },
    });

    // Create a functional proxy for spectators based on active users and recent activity
    const activeUsersLastHour = await this.prisma.user.count({
      where: {
        updatedAt: { gte: oneHourAgo },
      },
    });
    // Base spectators + factor of live scores and active users
    const spectatorsWatching =
      activeTournaments * 145 + scoresLastHour * 3 + activeUsersLastHour * 2;

    // Calculate subscription revenue (Placeholder: 50,000 NGN per PRO club)
    const PRO_PLAN_PRICE = 50000;
    const subscriptionRevenue = proClubs * PRO_PLAN_PRICE;

    return {
      totalClubs,
      activeClubs,
      proClubs,
      activeClubsPercent,
      clubsGrowth: this.formatPercentChange(clubsThisMonth, clubsLastMonth),
      totalMembers,
      membersGrowth: this.formatPercentChange(
        membersThisMonth,
        membersLastMonth,
      ),
      menCount,
      womenCount,
      activeTournaments,
      activeTournamentNames,
      scoresLastHour,
      spectatorsWatching,
      subscriptionRevenue,
      tournamentsGrowth: this.formatPercentChange(
        tournamentsThisMonth,
        tournamentsLastMonth,
      ),
      totalRevenue: Math.round(allTimeRevenue),
      revenueGrowth: this.formatPercentChange(
        revenueThisMonth,
        revenueLastMonth,
      ),
      totalCourses,
      pendingPayments,
      pendingAmount: Math.round(pendingAmount),
    };
  }

  async revenueTrend(year: number) {
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    const regs = await this.prisma.registration.findMany({
      where: {
        registeredAt: { gte: start, lt: end },
        paymentStatus: PaymentStatus.PAID,
        tournament: { deletedAt: null, club: { deletedAt: null } },
      },
      select: {
        registeredAt: true,
        tournament: { select: { entryFee: true } },
      },
    });

    const buckets = new Array(12).fill(0) as number[];
    for (const r of regs) {
      const month = r.registeredAt.getMonth();
      buckets[month] += r.tournament.entryFee || 0;
    }

    const labels = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return labels.map((month, idx) => ({
      month,
      amount: Math.round(buckets[idx]),
    }));
  }

  async clubGrowth(year: number) {
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    const clubs = await this.prisma.club.findMany({
      where: { deletedAt: null, createdAt: { gte: start, lt: end } },
      select: { createdAt: true },
    });

    const buckets = new Array(12).fill(0) as number[];
    for (const c of clubs) {
      buckets[c.createdAt.getMonth()] += 1;
    }

    const labels = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return labels.map((month, idx) => ({ month, count: buckets[idx] }));
  }

  async ageDemographics() {
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        dob: { not: null },
        role: { in: ['CLUB_ADMIN', 'PLAYER', 'MARKER'] },
      },
      select: { dob: true, gender: true },
    });

    const buckets = {
      '13-17': { men: 0, women: 0 },
      '18-24': { men: 0, women: 0 },
      '25-34': { men: 0, women: 0 },
      '35-44': { men: 0, women: 0 },
      '45-54': { men: 0, women: 0 },
      '55-64': { men: 0, women: 0 },
      '65-74+': { men: 0, women: 0 },
    };

    const currentYear = new Date().getFullYear();

    for (const u of users) {
      if (!u.dob) continue;
      const dobDate = new Date(u.dob);
      if (Number.isNaN(dobDate.getTime())) continue;
      const age = currentYear - dobDate.getFullYear();
      let bucket: keyof typeof buckets | null = null;
      if (age >= 13 && age <= 17) bucket = '13-17';
      else if (age >= 18 && age <= 24) bucket = '18-24';
      else if (age >= 25 && age <= 34) bucket = '25-34';
      else if (age >= 35 && age <= 44) bucket = '35-44';
      else if (age >= 45 && age <= 54) bucket = '45-54';
      else if (age >= 55 && age <= 64) bucket = '55-64';
      else if (age >= 65) bucket = '65-74+';

      if (bucket) {
        if (u.gender === 'MALE') buckets[bucket].men++;
        else if (u.gender === 'FEMALE') buckets[bucket].women++;
      }
    }

    return Object.entries(buckets).map(([age, counts]) => ({
      age,
      men: counts.men,
      women: counts.women,
    }));
  }

  async topClubs(range?: string) {
    const now = new Date();
    const startThisMonth = this.startOfMonth(now);
    const startNextMonth = this.startOfNextMonth(now);
    const startLastMonth = this.startOfMonth(
      new Date(now.getFullYear(), now.getMonth() - 1, 1),
    );
    const start3Months = this.startOfMonth(
      new Date(now.getFullYear(), now.getMonth() - 2, 1),
    );
    const start6Months = this.startOfMonth(
      new Date(now.getFullYear(), now.getMonth() - 5, 1),
    );

    const normalized = (range || 'This Month').trim().toLowerCase();
    const isAllTime =
      normalized === 'all time' ||
      normalized === 'all-time' ||
      normalized === 'all_time';

    const bounds = (() => {
      if (isAllTime) return null;
      if (normalized === 'this month')
        return { start: startThisMonth, end: startNextMonth };
      if (normalized === 'last month')
        return { start: startLastMonth, end: startThisMonth };
      if (normalized === '3 months' || normalized === 'last 3 months')
        return { start: start3Months, end: startNextMonth };
      if (normalized === '6 months' || normalized === 'last 6 months')
        return { start: start6Months, end: startNextMonth };
      return { start: startThisMonth, end: startNextMonth };
    })();

    const where: any = {
      deletedAt: null,
      status: { not: 'CANCELLED' },
      club: { deletedAt: null },
    };
    if (bounds) {
      where.startDate = { gte: bounds.start, lt: bounds.end };
    }

    const tournamentsThisMonth = await this.prisma.tournament.findMany({
      where,
      select: {
        id: true,
        entryFee: true,
        clubId: true,
        club: { select: { name: true, status: true, logo: true } },
        _count: {
          select: {
            registrations: {
              where: { status: 'APPROVED' },
            },
          },
        },
      },
    });

    const clubAgg = new Map<
      string,
      {
        name: string;
        clubStatus: string;
        logo: string | null;
        revenue: number;
        registrations: number;
        tournamentIdsThisMonth: Set<string>;
      }
    >();

    for (const t of tournamentsThisMonth) {
      const name = t.club?.name || '—';
      const clubStatus = t.club?.status ?? 'ACTIVE';
      const registrations = t._count?.registrations ?? 0;
      const entryFee = t.entryFee || 0;
      const prev = clubAgg.get(t.clubId);
      if (!prev) {
        clubAgg.set(t.clubId, {
          name,
          clubStatus,
          logo: t.club?.logo || null,
          revenue: entryFee * registrations,
          registrations,
          tournamentIdsThisMonth: new Set([t.id]),
        });
      } else {
        prev.revenue += entryFee * registrations;
        prev.registrations += registrations;
        prev.tournamentIdsThisMonth.add(t.id);
      }
    }

    const rows = Array.from(clubAgg.entries())
      .map(([clubId, v]) => ({
        clubId,
        name: v.name,
        clubStatus: v.clubStatus,
        logo: v.logo,
        revenue: v.revenue,
        registrations: v.registrations,
        tournaments: v.tournamentIdsThisMonth.size,
      }))
      .sort(
        (a, b) =>
          b.revenue - a.revenue ||
          b.registrations - a.registrations ||
          b.tournaments - a.tournaments,
      )
      .slice(0, 5);

    const topRevenue = rows[0]?.revenue || 0;
    return rows.map((r) => {
      const progress =
        topRevenue === 0 ? 0 : Math.round((r.revenue / topRevenue) * 100);
      const status =
        r.clubStatus === 'SUSPENDED'
          ? 'Suspended'
          : r.clubStatus === 'EXPIRED'
            ? 'Expired'
            : 'Active';
      const statusType =
        r.clubStatus === 'SUSPENDED'
          ? 'warning'
          : r.clubStatus === 'EXPIRED'
            ? 'danger'
            : 'success';
      return {
        clubId: r.clubId,
        name: r.name,
        revenue: Math.round(r.revenue),
        registrations: r.registrations,
        tournaments: r.tournaments,
        progress,
        status,
        statusType,
        logo:
          r.logo ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(r.name)}`,
      };
    });
  }



  async activity() {
    const regs = await this.prisma.registration.findMany({
      where: { tournament: { deletedAt: null, club: { deletedAt: null } } },
      orderBy: { registeredAt: 'desc' },
      take: 5,
      select: {
        registeredAt: true,
        user: { select: { email: true, firstName: true, lastName: true } },
        tournament: {
          select: { name: true, club: { select: { name: true } } },
        },
      },
    });

    return regs.map((r) => {
      const name =
        `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim() ||
        r.user.email;
      const subtitle = `${r.tournament.club?.name || '—'} • ${r.tournament.name}`;
      return {
        type: 'registration',
        title: `${name} registered`,
        subtitle,
        time: r.registeredAt.toISOString(),
      };
    });
  }

  async alerts() {
    const now = new Date();
    const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [unpaidRegs, suspendedClubs, lowRegTournaments, overdueOngoing] =
      await Promise.all([
        this.prisma.registration.findMany({
          where: {
            paymentStatus: PaymentStatus.UNPAID,
            tournament: { deletedAt: null, club: { deletedAt: null } },
          },
          select: { tournament: { select: { entryFee: true } } },
        }),
        this.prisma.club.count({
          where: { deletedAt: null, status: ClubStatus.SUSPENDED },
        }),
        this.prisma.tournament.findMany({
          where: {
            deletedAt: null,
            status: TournamentStatus.REGISTRATION_OPEN,
            startDate: { gte: now, lt: inSevenDays },
          },
          include: {
            _count: {
              select: {
                registrations: {
                  where: { status: 'APPROVED' },
                },
              },
            },
          },
          orderBy: { startDate: 'asc' },
          take: 20,
        }),
        this.prisma.tournament.count({
          where: {
            deletedAt: null,
            status: TournamentStatus.ONGOING,
            endDate: { not: null, lt: now },
          },
        }),
      ]);

    const unpaidCount = unpaidRegs.length;
    const unpaidAmount = unpaidRegs.reduce(
      (sum, r) => sum + (r.tournament.entryFee || 0),
      0,
    );
    const lowRegCount = lowRegTournaments.filter(
      (t) => (t._count?.registrations ?? 0) < 5,
    ).length;

    const items: Array<{
      type: 'danger' | 'warning' | 'success';
      title: string;
      subtitle: string;
      time: string;
    }> = [];
    const time = now.toISOString();

    if (unpaidCount > 0) {
      const nf = new Intl.NumberFormat('en-US');
      items.push({
        type: 'warning',
        title: `${unpaidCount} unpaid registrations`,
        subtitle: `Pending amount: ₦${nf.format(Math.round(unpaidAmount))}`,
        time,
      });
    }
    if (suspendedClubs > 0) {
      items.push({
        type: 'warning',
        title: `${suspendedClubs} suspended clubs`,
        subtitle: 'Review club status and restore access if needed',
        time,
      });
    }
    if (lowRegCount > 0) {
      items.push({
        type: 'danger',
        title: `${lowRegCount} tournaments start soon`,
        subtitle: 'Low registrations in the next 7 days',
        time,
      });
    }
    if (overdueOngoing > 0) {
      items.push({
        type: 'danger',
        title: `${overdueOngoing} tournaments overdue`,
        subtitle: 'Ongoing tournaments have end dates in the past',
        time,
      });
    }

    if (items.length === 0) {
      items.push({
        type: 'success',
        title: 'All systems normal',
        subtitle: 'No action required right now',
        time,
      });
    }

    return items.slice(0, 5);
  }

  async topLocations() {
    const clubs = await this.prisma.club.groupBy({
      by: ['state'],
      where: {
        deletedAt: null,
        state: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    });

    return clubs.map((c) => ({
      state: c.state,
      count: c._count.id,
    }));
  }
}
