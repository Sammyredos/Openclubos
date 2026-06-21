const fs = require('fs');
const file = 'apps/backend/src/modules/super-admin-dashboard/super-admin-dashboard.service.ts';
let code = fs.readFileSync(file, 'utf8');

const startMarker = '  async topClubs(range?: string) {';
const endMarker = '  async alerts() {';

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.log('Markers not found!');
  process.exit(1);
}

const before = code.substring(0, startIndex);
const after = code.substring(endIndex);

const newMiddle = `  async topClubs(range?: string) {
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
              where: { status: 'APPROVED' }
            }
          }
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
        logo: r.logo || \`https://api.dicebear.com/7.x/initials/svg?seed=\${encodeURIComponent(r.name)}\`,
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
        \`\${r.user.firstName || ''} \${r.user.lastName || ''}\`.trim() ||
        r.user.email;
      const subtitle = \`\${r.tournament.club?.name || '—'} • \${r.tournament.name}\`;
      return {
        type: 'registration',
        title: \`\${name} registered\`,
        subtitle,
        time: r.registeredAt.toISOString(),
      };
    });
  }

`;

fs.writeFileSync(file, before + newMiddle + after);
console.log('Fixed successfully');
