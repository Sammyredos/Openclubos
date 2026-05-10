import { Injectable } from '@nestjs/common';
import { ClubStatus, PaymentStatus, TournamentStatus } from '@prisma/client';
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

    const [totalClubs, activeClubs, totalMembers, activeTournaments] =
      await Promise.all([
        this.prisma.club.count({ where: { deletedAt: null } }),
        this.prisma.club.count({
          where: { deletedAt: null, status: ClubStatus.ACTIVE },
        }),
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.tournament.count({
          where: {
            deletedAt: null,
            status: {
              in: [
                TournamentStatus.ONGOING,
                TournamentStatus.REGISTRATION_OPEN,
              ],
            },
          },
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
          createdAt: { gte: startThisMonth, lt: startNextMonth },
        },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: { gte: startLastMonth, lt: startThisMonth },
        },
      }),
    ]);

    const [revenueThisMonth, revenueLastMonth] = await Promise.all([
      this.revenueForRange(startThisMonth, startNextMonth, PaymentStatus.PAID),
      this.revenueForRange(startLastMonth, startThisMonth, PaymentStatus.PAID),
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

    return {
      totalClubs,
      activeClubs,
      activeClubsPercent,
      clubsGrowth: this.formatChange(clubsThisMonth, clubsLastMonth),
      totalMembers,
      membersGrowth: this.formatChange(membersThisMonth, membersLastMonth),
      activeTournaments,
      tournamentsGrowth: '0',
      totalRevenue: Math.round(revenueThisMonth),
      revenueGrowth: this.formatPercentChange(
        revenueThisMonth,
        revenueLastMonth,
      ),
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
      status: { not: TournamentStatus.CANCELLED },
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
        club: { select: { name: true, status: true } },
        _count: { select: { registrations: true } },
      },
    });

    const clubAgg = new Map<
      string,
      {
        name: string;
        clubStatus: ClubStatus;
        revenue: number;
        registrations: number;
        tournamentIdsThisMonth: Set<string>;
      }
    >();

    for (const t of tournamentsThisMonth) {
      const name = t.club?.name || '—';
      const clubStatus = t.club?.status ?? ClubStatus.ACTIVE;
      const registrations = t._count?.registrations ?? 0;
      const entryFee = t.entryFee || 0;
      const prev = clubAgg.get(t.clubId);
      if (!prev) {
        clubAgg.set(t.clubId, {
          name,
          clubStatus,
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
        r.clubStatus === ClubStatus.SUSPENDED
          ? 'Suspended'
          : r.clubStatus === ClubStatus.EXPIRED
            ? 'Expired'
            : 'Active';
      const statusType =
        r.clubStatus === ClubStatus.SUSPENDED
          ? 'warning'
          : r.clubStatus === ClubStatus.EXPIRED
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
        logo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(r.name)}`,
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
          include: { _count: { select: { registrations: true } } },
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
}
