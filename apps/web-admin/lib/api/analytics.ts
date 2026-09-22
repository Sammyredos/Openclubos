export interface AnalyticsKPIs {
  totalTournaments: number;
  tournamentsGrowth: string;
  totalPlayers: number;
  playersGrowth: string;
  totalRegistrations: number;
  registrationsGrowth: string;
  totalRevenue: number;
  revenueGrowth: string;
}

export interface AnalyticsEngagement {
  avgRegistrationsPerTournament: number;
  playerRetentionRate: number;
  repeatPlayers: number;
  avgRating?: number;
  supportTickets?: number;
  emailOpenRate?: number;
  [key: string]: any;
}

export interface AnalyticsOverviewResponse {
  kpis: AnalyticsKPIs;
  engagement: AnalyticsEngagement;
  filterOptions: {
    tournaments: { id: string; name: string }[];
    clubs: { id: string; name: string }[];
  };
  registrationsOverTime: any[];
  registrationsBySource: {
    sources: any[];
    total?: number;
    [key: string]: any;
  };
  demographics: {
    gender: any[];
    ageGroups: any[];
  };
  topTournaments: any[];
  revenueTrends?: any[];
  revenueOverview?: any;
  [key: string]: any;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export async function getSuperAdminAnalytics(params?: {
  dateRange?: string;
  clubId?: string;
  format?: string;
  frequency?: string;
}): Promise<AnalyticsOverviewResponse> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.dateRange) searchParams.set('dateRange', params.dateRange);
    if (params?.clubId) searchParams.set('clubId', params.clubId);
    if (params?.format) searchParams.set('format', params.format);
    if (params?.frequency) searchParams.set('frequency', params.frequency);

    const res = await fetch(`${API_BASE}/super-admin/analytics?${searchParams.toString()}`, {
      credentials: 'include',
    });
    if (res.ok) return res.json();
  } catch {}

  return {
    kpis: {
      totalTournaments: 0,
      tournamentsGrowth: '+0%',
      totalPlayers: 0,
      playersGrowth: '+0%',
      totalRegistrations: 0,
      registrationsGrowth: '+0%',
      totalRevenue: 0,
      revenueGrowth: '+0%',
    },
    engagement: {
      avgRegistrationsPerTournament: 0,
      playerRetentionRate: 0,
      repeatPlayers: 0,
      avgRating: 4.8,
      supportTickets: 0,
      emailOpenRate: 75,
    },
    filterOptions: {
      tournaments: [],
      clubs: [],
    },
    registrationsOverTime: [],
    registrationsBySource: { sources: [], total: 0 },
    demographics: { gender: [], ageGroups: [] },
    topTournaments: [],
    revenueTrends: [],
    revenueOverview: { totalRevenue: 0, growth: '+0%' },
  };
}
