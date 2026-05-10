"use client";

import { useState, useEffect, useSyncExternalStore, useCallback, type ElementType } from "react";
import {
  Building2,
  Users,
  Trophy,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  RotateCw,
  User,
  Users2,
  ArrowUpRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatNumber, formatWithCommas, subscribeAdminEvents } from "@/lib/utils";
import { getAuthToken } from "@/lib/api/auth";
import { SearchableSelect } from "@/components/ui/input";

import { Skeleton } from "@/components/ui/skeleton";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

function timeAgo(iso: string) {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "—";
  const diffMinutes = Math.floor((Date.now() - ts) / 60000);
  if (diffMinutes < 0) {
    const m = Math.abs(diffMinutes);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }

  const absMinutes = diffMinutes;
  if (absMinutes < 1) return "just now";
  if (absMinutes < 60) return `${absMinutes}m ago`;

  const absHours = Math.floor(absMinutes / 60);
  if (absHours < 24) return `${absHours}h ago`;

  const absDays = Math.floor(absHours / 24);
  return `${absDays}d ago`;
}

type DashboardStats = {
  totalClubs?: number;
  activeClubs?: number;
  totalMembers?: number;
  activeTournaments?: number;
  totalRevenue?: number;
  pendingPayments?: number;
  pendingAmount?: number;
  clubsGrowth?: string;
  activeClubsPercent?: string;
  membersGrowth?: string;
  tournamentsGrowth?: string;
  revenueGrowth?: string;
};

type ActivityRecord = { title: string; subtitle: string; time: string };

type SubscriptionClub = {
  id: string;
  name: string;
  logo: string;
  plan: string;
  status: "Active" | "Inactive";
  yearlyFee: number;
};

type PerformingClub = {
  id: string;
  name: string;
  logo: string;
  status: string;
  statusType: "success" | "warning" | "danger";
  progress: number;
  revenue?: number;
  registrations?: number;
  tournaments?: number;
};

type RevenuePoint = { month: string; amount: number };
type GrowthPoint = { month: string; count: number };
type ClubListItem = {
  id: string;
  name: string;
  plan?: string | null;
  status?: string | null;
  createdAt?: string | null;
};

export default function SuperAdminDashboard() {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityRecord[]>([]);
  const [alerts, setAlerts] = useState<Array<{ type: "danger" | "warning" | "success"; title: string; subtitle: string; time: string }>>([]);
  const [performingClubs, setPerformingClubs] = useState<PerformingClub[]>([]);
  const [subscriptionClubs, setSubscriptionClubs] = useState<SubscriptionClub[]>([]);
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
  const [growthData, setGrowthData] = useState<GrowthPoint[]>([]);
  const [clubsList, setClubsList] = useState<ClubListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [topClubsLoading, setTopClubsLoading] = useState(false);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [growthLoading, setGrowthLoading] = useState(false);
  const [subsLoading, setSubsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [revenueRange, setRevenueRange] = useState("This Year");
  const [growthRange, setGrowthRange] = useState("This Year");
  const [topClubsRange, setTopClubsRange] = useState("This Month");
  const [topSubsRange, setTopSubsRange] = useState("All Time");

  const getHeaders = useCallback(() => {
    const token = getAuthToken();
    if (!token) {
      setAuthError("Not authenticated. Please login again.");
      return null;
    }
    setAuthError(null);
    return { Authorization: `Bearer ${token}` };
  }, []);

  const computeTopSubs = useCallback((items: ClubListItem[], range: string) => {
    const now = new Date();
    const rangeBounds = (() => {
      const normalized = range.trim().toLowerCase();
      if (normalized === "all time" || normalized === "all-time" || normalized === "all_time") return null;
      const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const startNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
      const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
      const start3Months = new Date(now.getFullYear(), now.getMonth() - 2, 1).getTime();
      const start6Months = new Date(now.getFullYear(), now.getMonth() - 5, 1).getTime();
      if (normalized === "this month") return { start: startThisMonth, end: startNextMonth };
      if (normalized === "last month") return { start: startLastMonth, end: startThisMonth };
      if (normalized === "3 months" || normalized === "last 3 months") return { start: start3Months, end: startNextMonth };
      if (normalized === "6 months" || normalized === "last 6 months") return { start: start6Months, end: startNextMonth };
      return null;
    })();

    const filtered = rangeBounds
      ? items.filter((c) => {
          if (!c.createdAt) return true;
          const ts = new Date(c.createdAt).getTime();
          if (Number.isNaN(ts)) return true;
          return ts >= rangeBounds.start && ts < rangeBounds.end;
        })
      : items;

    return filtered
      .slice()
      .sort((a, b) => {
        if (a.plan === "PRO" && b.plan !== "PRO") return -1;
        if (a.plan !== "PRO" && b.plan === "PRO") return 1;
        return 0;
      })
      .slice(0, 5)
      .map((c) => {
        const status: SubscriptionClub["status"] = c.status === "ACTIVE" ? "Active" : "Inactive";
        return {
          id: String(c.id),
          name: String(c.name),
          logo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(String(c.name))}`,
          plan: c.plan === "PRO" ? "Pro Plan" : "Basic Plan",
          status,
          yearlyFee: c.plan === "PRO" ? 150000 : 50000,
        };
      });
  }, []);

  const fetchStatsAndActivityAndClubsList = useCallback(async () => {
    const headers = getHeaders();
    if (!headers) return;
    setStatsLoading(true);
    setActivityLoading(true);
    setSubsLoading(true);
    try {
      const [statsRes, activityRes, clubsListRes] = await Promise.all([
        fetch(`${API_BASE}/super-admin/dashboard/stats`, { headers }),
        fetch(`${API_BASE}/super-admin/dashboard/activity`, { headers }),
        fetch(`${API_BASE}/organizers`, { headers }),
      ]);

      if (statsRes.status === 401 || statsRes.status === 403) {
        setAuthError("Session expired. Please login again.");
        setStats(null);
        return;
      }
      if (!statsRes.ok) {
        const error = await statsRes.json().catch(() => ({}));
        setAuthError(error.message || "Failed to load dashboard stats");
        setStats(null);
        return;
      }
      setStats((await statsRes.json()) as DashboardStats);

      if (activityRes.ok) setRecentActivity((await activityRes.json()) as ActivityRecord[]);

      if (clubsListRes.ok) {
        const clubsData: unknown = await clubsListRes.json();
        const items: ClubListItem[] = Array.isArray(clubsData)
          ? (clubsData as ClubListItem[])
          : clubsData &&
              typeof clubsData === "object" &&
              "items" in clubsData &&
              Array.isArray((clubsData as { items?: unknown }).items)
            ? ((clubsData as { items: unknown }).items as ClubListItem[])
            : [];
        setClubsList(items);
        setSubscriptionClubs(computeTopSubs(items, topSubsRange));
      }
    } catch {
      setAuthError("Failed to load dashboard data");
    } finally {
      setStatsLoading(false);
      setActivityLoading(false);
      setSubsLoading(false);
    }
  }, [computeTopSubs, getHeaders, topSubsRange]);

  const fetchRevenueTrend = useCallback(async (range: string) => {
    const headers = getHeaders();
    if (!headers) return;
    setRevenueLoading(true);
    try {
      const now = new Date();
      const revenueYear = range === "Last Year" ? now.getFullYear() - 1 : now.getFullYear();
      const res = await fetch(`${API_BASE}/super-admin/dashboard/revenue-trend?year=${revenueYear}`, { headers });
      if (res.ok) setRevenueData((await res.json()) as RevenuePoint[]);
    } finally {
      setRevenueLoading(false);
    }
  }, [getHeaders]);

  const fetchClubGrowth = useCallback(async (range: string) => {
    const headers = getHeaders();
    if (!headers) return;
    setGrowthLoading(true);
    try {
      const now = new Date();
      const growthYear = range === "Last Year" ? now.getFullYear() - 1 : now.getFullYear();
      const res = await fetch(`${API_BASE}/super-admin/dashboard/organizer-growth?year=${growthYear}`, { headers });
      if (res.ok) setGrowthData((await res.json()) as GrowthPoint[]);
    } finally {
      setGrowthLoading(false);
    }
  }, [getHeaders]);

  const fetchTopClubs = useCallback(async (range: string) => {
    const headers = getHeaders();
    if (!headers) return;
    setTopClubsLoading(true);
    try {
      const url = `${API_BASE}/super-admin/dashboard/top-organizers?range=${encodeURIComponent(range)}`;
      const res = await fetch(url, { headers });
      if (res.ok) setPerformingClubs((await res.json()) as PerformingClub[]);
    } finally {
      setTopClubsLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(() => {
      if (cancelled) return;
      (async () => {
        setLoading(true);
        try {
          await Promise.all([
            fetchStatsAndActivityAndClubsList(),
            fetchRevenueTrend(revenueRange),
            fetchClubGrowth(growthRange),
            fetchTopClubs(topClubsRange),
          ]);
        } finally {
          setLoading(false);
        }
      })();
    }, 0);
    const unsubscribe = subscribeAdminEvents((evt) => {
      if (evt.type !== "organizers-changed") return;
      if (cancelled) return;
      fetchStatsAndActivityAndClubsList();
      fetchTopClubs(topClubsRange);
    });
    function onFocus() {
      if (cancelled) return;
      fetchStatsAndActivityAndClubsList();
    }
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
      unsubscribe();
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchClubGrowth, fetchRevenueTrend, fetchStatsAndActivityAndClubsList, fetchTopClubs, growthRange, revenueRange, topClubsRange]);

  useEffect(() => {
    if (!isMounted) return;
    if (loading) return;
    const id = window.setTimeout(() => {
      fetchRevenueTrend(revenueRange);
    }, 0);
    return () => window.clearTimeout(id);
  }, [fetchRevenueTrend, isMounted, loading, revenueRange]);

  useEffect(() => {
    if (!isMounted) return;
    if (loading) return;
    const id = window.setTimeout(() => {
      fetchClubGrowth(growthRange);
    }, 0);
    return () => window.clearTimeout(id);
  }, [fetchClubGrowth, growthRange, isMounted, loading]);

  useEffect(() => {
    if (!isMounted) return;
    if (loading) return;
    const id = window.setTimeout(() => {
      fetchTopClubs(topClubsRange);
    }, 0);
    return () => window.clearTimeout(id);
  }, [fetchTopClubs, isMounted, loading, topClubsRange]);

  useEffect(() => {
    if (!isMounted) return;
    if (loading) return;
    const id = window.setTimeout(() => {
      setSubscriptionClubs(computeTopSubs(clubsList, topSubsRange));
    }, 0);
    return () => window.clearTimeout(id);
  }, [clubsList, computeTopSubs, isMounted, loading, topSubsRange]);

  if (!isMounted) return null;

  return (
    <div className="space-y-8 w-full max-w-full px-2 pb-10">
      {authError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
          {authError}
        </div>
      )}
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard
          title="Total Organizers"
          value={stats?.totalClubs?.toString() || "0"}
          change={stats?.clubsGrowth}
          icon={Building2}
          iconBg="bg-green-50"
          iconColor="text-green-600"
          loading={loading || statsLoading}
        />
        <StatCard
          title="Active Organizers"
          value={stats?.activeClubs?.toString() || "0"}
          subValue={stats?.activeClubsPercent || undefined}
          subIcon={Users2}
          icon={CheckCircle2}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          loading={loading || statsLoading}
        />
        <StatCard
          title="Total Members"
          value={stats?.totalMembers?.toString() || "0"}
          change={stats?.membersGrowth}
          icon={Users}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          loading={loading || statsLoading}
        />
        <StatCard
          title="Active Tournaments"
          value={stats?.activeTournaments?.toString() || "0"}
          change={stats?.tournamentsGrowth}
          icon={Trophy}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
          loading={loading || statsLoading}
        />
        <StatCard
          title="Total Revenue"
          value={stats?.totalRevenue != null ? `₦${formatWithCommas(Math.round(stats.totalRevenue))}` : "₦0"}
          change={stats?.revenueGrowth}
          icon={TrendingUp}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          loading={loading || statsLoading}
        />
        <StatCard
          title="Pending Payments"
          value={stats?.pendingPayments?.toString() || "0"}
          change={stats?.pendingAmount != null ? `₦${formatWithCommas(Math.round(stats.pendingAmount))}` : undefined}
          changeType="decrease"
          icon={Wallet}
          iconBg="bg-red-50"
          iconColor="text-red-600"
          loading={loading || statsLoading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-6">
            <CardTitle className="text-xl font-bold">Revenue Trend</CardTitle>
            <SearchableSelect
              value={revenueRange}
              onValueChange={setRevenueRange}
              options={["This Year", "Last Year"].map((v) => ({ value: v, label: v }))}
              triggerClassName="h-10 bg-white text-[14px]"
            />
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <div className="h-[320px] w-full">
              {!isMounted || loading || revenueLoading ? (
                <TrendChartSkeleton variant="line" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: "#9ca3af" }} dy={10} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 13, fill: "#9ca3af" }}
                      tickFormatter={(value) => `₦${value/1000000}M`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #f0f0f0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
                      formatter={(value: number | string | readonly (string | number)[] | undefined) => {
                        const raw = Array.isArray(value) ? value[0] : value;
                        return [`₦${Number(raw ?? 0).toLocaleString()}`, "Revenue"];
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }} 
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-6">
            <CardTitle className="text-xl font-bold">Organizer Growth</CardTitle>
            <SearchableSelect
              value={growthRange}
              onValueChange={setGrowthRange}
              options={["This Year", "Last Year"].map((v) => ({ value: v, label: v }))}
              triggerClassName="h-10 bg-white text-[14px]"
            />
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <div className="h-[320px] w-full">
              {!isMounted || loading || growthLoading ? (
                <TrendChartSkeleton variant="bar" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: "#9ca3af" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: "#9ca3af" }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #f0f0f0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity, Alerts, Top Organizers Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-2">
            <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
            <Button variant="link" className="text-[#10b981] p-0 h-auto font-bold text-[14px] flex items-center gap-2 no-underline hover:no-underline">
              View All Upcoming <ArrowUpRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-7 p-6 pt-4">
            {loading || activityLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
              </div>
            ) : recentActivity.length > 0 ? (
              recentActivity.slice(0, 5).map((activity, i) => (
                <ActivityItem 
                  key={i}
                  icon={Building2} // Dynamic icon mapping can be added
                  title={activity.title} 
                  subtitle={activity.subtitle} 
                  time={timeAgo(activity.time)} 
                  iconBg="bg-green-50" 
                  iconColor="text-green-600" 
                />
              ))
            ) : (
              <p className="text-[13px] text-gray-400 font-medium">No recent activity</p>
            )}
          </CardContent>
        </Card>

        {/* Top Organizers by Subscription */}
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-2">
            <CardTitle className="text-xl font-bold">Top Organizers by Subscription</CardTitle>
            <SearchableSelect
              value={topSubsRange}
              onValueChange={setTopSubsRange}
              options={["All Time", "This Month", "Last Month", "3 Months", "6 Months"].map((v) => ({ value: v, label: v }))}
              triggerClassName="h-10 bg-white text-[13px]"
            />
          </CardHeader>
          <CardContent className="space-y-7 p-3 pt-4">
            {loading || subsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
              </div>
            ) : subscriptionClubs.length > 0 ? (
              subscriptionClubs.map((club, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-100 shadow-sm">
                    <img src={club.logo} alt={club.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <p className="text-[15px] font-bold text-gray-800 truncate">{club.name}</p>
                        <p className="text-[11px] text-gray-400 font-medium">{club.plan}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-[16px] font-bold text-gray-900">{`₦${formatWithCommas(club.yearlyFee)}/yr`}</p>
                        <span className={cn(
                          "text-[11px] font-bold px-1.5 py-0.5 rounded-full border",
                          club.status === 'Active' ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
                        )}>
                          {club.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[13px] text-gray-400 font-medium">No subscription data</p>
            )}
          </CardContent>
        </Card>

        {/* Top Organizers by Tournament */}
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-2">
            <CardTitle className="text-xl font-bold">Top Organizers by Tournament</CardTitle>
            <SearchableSelect
              value={topClubsRange}
              onValueChange={setTopClubsRange}
              options={["This Month", "Last Month", "3 Months", "6 Months", "All Time"].map((v) => ({ value: v, label: v }))}
              triggerClassName="h-10 bg-white text-[13px]"
            />
          </CardHeader>
          <CardContent className="space-y-7 p-3 pt-4">
            {loading || topClubsLoading ? (
              <div className="space-y-6">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
              </div>
            ) : performingClubs.length > 0 ? (
              performingClubs.slice(0, 5).map((club, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-100 shadow-sm">
                    <img src={club.logo} alt={club.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex flex-col">
                        <p className="text-[15px] font-bold text-gray-800 truncate leading-tight">{club.name}</p>
                        <StatusBadge type={club.statusType} label={club.status} />
                      </div>
                      <div className="flex flex-col items-end"
                        title={`Revenue is total entry fees ${topClubsRange === "All Time" ? "all time" : topClubsRange.toLowerCase()} (entry fee × registrations): ${formatWithCommas(club.registrations ?? 0)} registrations across ${formatWithCommas(club.tournaments ?? 0)} tournaments`}
                      >
                        <p className="text-[16px] font-bold text-gray-900">{`₦${formatWithCommas(club.revenue ?? 0)}`}</p>
                        <p className="text-[11px] text-gray-400 font-medium whitespace-nowrap">
                          {formatWithCommas(club.registrations ?? 0)} regs • {formatWithCommas(club.tournaments ?? 0)} tourns
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          club.statusType === 'success' ? "bg-emerald-500" :
                          club.statusType === 'warning' ? "bg-orange-500" : "bg-red-500"
                        )} 
                        style={{ width: `${club.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[13px] text-gray-400 font-medium">No organizer performance data</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TrendChartSkeleton({ variant }: { variant: "line" | "bar" }) {
  const barHeights = [72, 128, 92, 156, 110, 176, 98, 142];
  return (
    <div className="h-full w-full rounded-2xl border border-gray-100 bg-gray-50/40 p-5">
      <div className="grid h-full w-full grid-cols-[44px_1fr] gap-4">
        <div className="flex flex-col justify-between py-2">
          <Skeleton className="h-3 w-10 rounded-md" />
          <Skeleton className="h-3 w-8 rounded-md" />
          <Skeleton className="h-3 w-9 rounded-md" />
          <Skeleton className="h-3 w-7 rounded-md" />
          <Skeleton className="h-3 w-10 rounded-md" />
        </div>
        <div className="flex h-full flex-col justify-between">
          <div className="relative flex-1 rounded-xl bg-white/60 border border-gray-100 overflow-hidden">
            <div className="absolute inset-0 grid grid-cols-6 gap-4 px-6 py-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-full w-px bg-gray-100/80 mx-auto" />
              ))}
            </div>
            {variant === "bar" ? (
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-6 pb-6">
                {barHeights.map((h, i) => (
                  <Skeleton key={i} className="w-7 rounded-lg" style={{ height: `${h}px` }} />
                ))}
              </div>
            ) : (
              <div className="absolute inset-x-0 top-0 px-6 pt-10">
                <Skeleton className="h-2 w-5/6 rounded-full" />
                <Skeleton className="h-2 w-4/6 rounded-full mt-8 ml-6" />
                <Skeleton className="h-2 w-5/6 rounded-full mt-10" />
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between px-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-10 rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ type, label }: { type: 'success' | 'warning' | 'danger', label: string }) {
  const styles = {
    success: "bg-green-50 text-green-600 border-green-100",
    warning: "bg-orange-50 text-orange-600 border-orange-100",
    danger: "bg-red-50 text-red-600 border-red-100",
  };

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 w-fit", styles[type])}>
      {label}
    </span>
  );
}

interface ActivityItemProps {
  icon: ElementType;
  title: string;
  subtitle: string;
  time: string;
  iconBg: string;
  iconColor: string;
}

function ActivityItem({ icon: Icon, title, subtitle, time, iconBg, iconColor }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-4">
      <div className={`p-2.5 rounded-xl ${iconBg} flex-shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.05)]`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold text-gray-800 leading-tight">{title}</p>
        <p className="text-[13px] text-gray-500 mt-1">{subtitle}</p>
      </div>
      <span className="text-[12px] text-gray-400 font-medium whitespace-nowrap">{time}</span>
    </div>
  );
}

interface AlertItemProps {
  type: 'danger' | 'warning' | 'success';
  title: string;
  subtitle: string;
  time: string;
}

function AlertItem({ type, title, subtitle, time }: AlertItemProps) {
  const stylesMap = {
    danger: { bg: "bg-red-50", color: "text-red-500", icon: AlertTriangle },
    warning: { bg: "bg-orange-50", color: "text-orange-500", icon: AlertTriangle },
    success: { bg: "bg-green-50", color: "text-green-500", icon: CheckCircle2 },
  };

  const currentStyle = stylesMap[type];
  const Icon = currentStyle.icon;

  return (
    <div className="flex items-start gap-4">
      <div className={`p-2.5 rounded-xl ${currentStyle.bg} flex-shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.05)]`}>
        <Icon className={`h-5 w-5 ${currentStyle.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold text-gray-800 leading-tight">{title}</p>
        <p className="text-[13px] text-gray-500 mt-1">{subtitle}</p>
      </div>
      <span className="text-[12px] text-gray-400 font-medium whitespace-nowrap">{time}</span>
    </div>
  );
}
