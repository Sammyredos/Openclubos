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
  Mountain,
  MapPin,
} from "lucide-react";
import {
  LineChart,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency } from "@/lib/utils";
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
  totalCourses?: number;
  pendingPayments?: number;
  pendingAmount?: number;
  clubsGrowth?: string;
  activeClubsPercent?: string;
  membersGrowth?: string;
  tournamentsGrowth?: string;
  revenueGrowth?: string;
  menCount?: number;
  womenCount?: number;
  subscriptionRevenue?: number;
  systemHealth?: {
    api?: string;
    database?: string;
    redis?: string;
    workers?: string;
    latency?: string;
    uptime?: string;
  };
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
type TopLocation = { state: string; count: number };
type ClubListItem = {
  id: string;
  name: string;
  plan?: string | null;
  status?: string | null;
  createdAt?: string | null;
};

export default function SuperAdminDashboard() {
  const isMounted = useSyncExternalStore(
    () => () => { },
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
  const [ageDemographicsData, setAgeDemographicsData] = useState<Array<{ age: string, men: number, women: number }>>([]);
  const [clubsList, setClubsList] = useState<ClubListItem[]>([]);
  const [topLocations, setTopLocations] = useState<TopLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [topClubsLoading, setTopClubsLoading] = useState(false);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [growthLoading, setGrowthLoading] = useState(false);
  const [ageLoading, setAgeLoading] = useState(false);
  const [subsLoading, setSubsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [revenueRange, setRevenueRange] = useState("This Year");
  const [growthRange, setGrowthRange] = useState("This Year");
  const [topClubsRange, setTopClubsRange] = useState("This Month");
  const [topSubsRange, setTopSubsRange] = useState("All Time");
  const [ageDemographicsFilter, setAgeDemographicsFilter] = useState<"All" | "Men" | "Women">("All");
  const [realTimeLatency, setRealTimeLatency] = useState<string>('--');

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
    setLocationsLoading(true);
    try {
      const [statsRes, activityRes, clubsListRes, locationsRes] = await Promise.all([
        fetch(`${API_BASE}/super-admin/dashboard/stats`, { headers }),
        fetch(`${API_BASE}/super-admin/dashboard/activity`, { headers }),
        fetch(`${API_BASE}/organizers`, { headers }),
        fetch(`${API_BASE}/super-admin/dashboard/top-locations`, { headers }),
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

      if (locationsRes.ok) {
        setTopLocations(await locationsRes.json());
      }
    } catch {
      setAuthError("Failed to load dashboard data");
    } finally {
      setStatsLoading(false);
      setActivityLoading(false);
      setSubsLoading(false);
      setLocationsLoading(false);
      if (loading) setLoading(false);
    }
  }, [computeTopSubs, getHeaders, topSubsRange]);

  const fetchRevenueTrend = useCallback(async (range: string) => {
    const headers = getHeaders();
    if (!headers) return;
    setRevenueLoading(true);
    try {
      const res = await fetch(`${API_BASE}/super-admin/dashboard/chart-data?range=${encodeURIComponent(range)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setRevenueData(data.revenueData);
      }
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

  const fetchAgeDemographics = useCallback(async () => {
    const headers = getHeaders();
    if (!headers) return;
    setAgeLoading(true);
    try {
      const res = await fetch(`${API_BASE}/super-admin/dashboard/age-demographics`, { headers });
      if (res.ok) setAgeDemographicsData(await res.json());
    } finally {
      setAgeLoading(false);
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
            fetchAgeDemographics(),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchClubGrowth, fetchRevenueTrend, fetchStatsAndActivityAndClubsList, fetchTopClubs]);

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

  useEffect(() => {
    if (!isMounted) return;
    let interval: number;
    const ping = async () => {
      const start = performance.now();
      try {
        await fetch(`${API_BASE}/health/ping`, { method: "GET" });
        const end = performance.now();
        setRealTimeLatency(`${Math.round(end - start)}ms`);
      } catch (e) {
        setRealTimeLatency("error");
      }
    };
    ping();
    interval = window.setInterval(ping, 5000);
    return () => window.clearInterval(interval);
  }, [isMounted]);

  if (!isMounted) return null;

  if (loading || !stats) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 w-full max-w-full px-2 pb-10">
      {authError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-normal text-red-700">
          {authError}
        </div>
      )}
      {/* Stat Cards */}
      <div className="w-full bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-x-auto">
        <div className="flex items-center justify-between px-12 py-8 min-w-[1000px]">
          {/* Stat 1: Total Revenue */}
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-3.5">
              <div className="text-zinc-700 text-base font-medium">Total Revenue for Organizers</div>
              {stats?.revenueGrowth?.startsWith('-') ? (
                <div className="px-2 py-1 bg-rose-50 rounded-lg flex justify-center items-center gap-1.5">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-red-500 rotate-180">
                    <path d="M0 6.94583L1.17875 8.125L5.00167 4.23375L8.82125 8.125L10 6.94583L5.00167 1.875L0 6.94583Z" fill="currentColor" />
                  </svg>
                  <div className="text-red-500 text-xs font-medium">{stats.revenueGrowth.replace('-', '')}</div>
                </div>
              ) : (
                <div className="px-2 py-1 bg-green-50 rounded-lg flex justify-center items-center gap-1.5">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-openclub-700">
                    <path d="M0 6.94583L1.17875 8.125L5.00167 4.23375L8.82125 8.125L10 6.94583L5.00167 1.875L0 6.94583Z" fill="currentColor" />
                  </svg>
                  <div className="text-openclub-700 text-xs font-medium">{stats?.revenueGrowth || "0.0%"}</div>
                </div>
              )}
            </div>
            <div className="text-openclub-700 text-3xl font-semibold">
              {stats?.totalRevenue != null ? `₦${formatNumber(stats.totalRevenue)}` : "₦0"}
            </div>
            <div className="text-zinc-500 text-sm font-normal">All Time</div>
          </div>

          <div className="w-px h-28 bg-[oklch(0.94_0.02_154.09)]" />

          {/* Stat 2: Total Organizers */}
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-3.5">
              <div className="text-zinc-700 text-base font-medium">Total Organizers</div>
              {stats?.clubsGrowth?.startsWith('-') ? (
                <div className="px-2 py-1 bg-rose-50 rounded-lg flex justify-center items-center gap-1.5">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-red-500 rotate-180">
                    <path d="M0 6.94583L1.17875 8.125L5.00167 4.23375L8.82125 8.125L10 6.94583L5.00167 1.875L0 6.94583Z" fill="currentColor" />
                  </svg>
                  <div className="text-red-500 text-xs font-medium">{stats.clubsGrowth.replace('-', '')}</div>
                </div>
              ) : (
                <div className="px-2 py-1 bg-green-50 rounded-lg flex justify-center items-center gap-1.5">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-openclub-700">
                    <path d="M0 6.94583L1.17875 8.125L5.00167 4.23375L8.82125 8.125L10 6.94583L5.00167 1.875L0 6.94583Z" fill="currentColor" />
                  </svg>
                  <div className="text-openclub-700 text-xs font-medium">{stats?.clubsGrowth || "0.0%"}</div>
                </div>
              )}
            </div>
            <div className="text-openclub-700 text-3xl font-semibold">
              {formatNumber(stats?.totalClubs || 0)}
            </div>
            <div className="text-zinc-500 text-sm font-normal">Across Africa</div>
          </div>

          <div className="w-px h-28 bg-slate-200" />

          {/* Stat 3: Total Players */}
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-3.5">
              <div className="text-zinc-700 text-base font-medium">Total Users</div>
              {stats?.membersGrowth?.startsWith('-') ? (
                <div className="px-2 py-1 bg-rose-50 rounded-lg flex justify-center items-center gap-1.5">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-red-500 rotate-180">
                    <path d="M0 6.94583L1.17875 8.125L5.00167 4.23375L8.82125 8.125L10 6.94583L5.00167 1.875L0 6.94583Z" fill="currentColor" />
                  </svg>
                  <div className="text-red-500 text-xs font-medium">{stats.membersGrowth.replace('-', '')}</div>
                </div>
              ) : (
                <div className="px-2 py-1 bg-green-50 rounded-lg flex justify-center items-center gap-1.5">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-openclub-700">
                    <path d="M0 6.94583L1.17875 8.125L5.00167 4.23375L8.82125 8.125L10 6.94583L5.00167 1.875L0 6.94583Z" fill="currentColor" />
                  </svg>
                  <div className="text-openclub-700 text-xs font-medium">{stats?.membersGrowth || "0.0%"}</div>
                </div>
              )}
            </div>
            <div className="text-openclub-700 text-3xl font-semibold">
              {formatNumber(stats?.totalMembers || 0)}
            </div>
            <div className="text-zinc-500 text-sm font-normal">Active Members</div>
          </div>

          <div className="w-px h-28 bg-slate-200" />

          {/* Stat 4: Active Tournaments */}
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-3.5">
              <div className="text-zinc-700 text-base font-medium">Active Tournaments</div>
              {stats?.tournamentsGrowth?.startsWith('-') ? (
                <div className="px-2 py-1 bg-rose-50 rounded-lg flex justify-center items-center gap-1.5">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-red-500 rotate-180">
                    <path d="M0 6.94583L1.17875 8.125L5.00167 4.23375L8.82125 8.125L10 6.94583L5.00167 1.875L0 6.94583Z" fill="currentColor" />
                  </svg>
                  <div className="text-red-500 text-xs font-medium">{stats.tournamentsGrowth.replace('-', '')}</div>
                </div>
              ) : (
                <div className="px-2 py-1 bg-green-50 rounded-lg flex justify-center items-center gap-1.5">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-openclub-700">
                    <path d="M0 6.94583L1.17875 8.125L5.00167 4.23375L8.82125 8.125L10 6.94583L5.00167 1.875L0 6.94583Z" fill="currentColor" />
                  </svg>
                  <div className="text-openclub-700 text-xs font-medium">{stats?.tournamentsGrowth || "0.0%"}</div>
                </div>
              )}
            </div>
            <div className="text-openclub-700 text-3xl font-semibold">
              {formatNumber(stats?.activeTournaments || 0)}
            </div>
            <div className="text-zinc-500 text-sm font-normal">Ongoing Events</div>
          </div>

          <div className="w-px h-28 bg-[oklch(0.94_0.02_154.09)]" />

          {/* Stat 5: Platform Revenue */}
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-3.5">
              <div className="text-zinc-700 text-base font-medium">Platform Revenue</div>
            </div>
            <div className="text-openclub-700 text-3xl font-semibold">
              {stats?.subscriptionRevenue != null ? `₦${formatNumber(stats.subscriptionRevenue)}` : "₦0"}
            </div>
            <div className="text-zinc-500 text-sm font-normal">Subscription Revenue</div>
          </div>
        </div>
      </div>

      {/* Charts & Demographics vs Top Organizers */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
        {/* Left Column */}
        <div className="xl:col-span-9 flex flex-col gap-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 xl:grid-cols-9 gap-6 w-full">
            {/* Revenue Trends Card */}
            <div className="p-7 bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex flex-col gap-2.5 overflow-x-auto w-full xl:col-span-5">
              <div className="min-w-[500px] relative font-sans w-full flex flex-col h-full">
                <div className="w-full flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <div className="text-zinc-700 text-xl font-medium">Organizer Revenue Trends</div>
                    <div className="relative group flex items-center justify-center">
                      <div className="w-4 h-4 bg-zinc-400 rounded-full text-white text-[10px] font-bold flex items-center justify-center cursor-help">?</div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[220px] p-2.5 bg-[#0a2316] text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg text-center leading-relaxed">
                        Total revenue generated over time across all organizers.
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#0a2316]"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-[#f5faf6] border border-[#e1efe5] rounded-lg p-1">
                    {["This Month", "This Year", "Last Year"].map(range => (
                      <button
                        key={range}
                        onClick={() => setRevenueRange(range)}
                        className={cn(
                          "px-3 py-1 text-sm transition-all rounded-md",
                          revenueRange === range ? "bg-white text-openclub-700 font-medium shadow-sm border border-[#e1efe5]" : "text-zinc-500 font-normal hover:text-zinc-700 hover:bg-slate-100/50"
                        )}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 w-full min-h-[250px]">
                  {!isMounted || loading || revenueLoading ? (
                    <TrendChartSkeleton variant="line" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData} margin={{ top: 20, right: 0, left: 20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorFunnel" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#15803D" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#15803D" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1efe5" />
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: "#a1a1aa" }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          width={80}
                          tick={{ fontSize: 12, fill: "#a1a1aa" }}
                          tickFormatter={(value) => formatCurrency(value)}
                        />
                        <Tooltip
                          cursor={{ stroke: '#15803D', strokeWidth: 1, strokeDasharray: '3 3' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-[#15803D] text-white text-xs font-medium px-2.5 py-1.5 rounded shadow-[0px_4px_8px_0px_rgba(0,0,0,0.10)] relative -mt-6">
                                  {formatCurrency(Number(payload[0].value))}
                                  <div className="absolute w-2 h-2 bg-[#15803D] rotate-45 -bottom-1 left-1/2 -translate-x-1/2" />
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke="#15803D"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorFunnel)"
                          activeDot={{ r: 4, strokeWidth: 2, stroke: '#15803D', fill: '#fff' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Organizer Growth Card */}
            <Card className="border-0 rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex flex-col w-full h-full xl:col-span-4">
              <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-6">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-zinc-700 text-xl font-medium">Organizer Growth</CardTitle>
                  <div className="relative group flex items-center justify-center">
                    <div className="w-4 h-4 bg-zinc-400 rounded-full text-white text-[10px] font-bold flex items-center justify-center cursor-help">?</div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[220px] p-2.5 bg-[#0a2316] text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg text-center leading-relaxed">
                      The number of new organizers that signed up over time.
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#0a2316]"></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-[#f5faf6] border border-[#e1efe5] rounded-lg p-1">
                  {["This Year", "Last Year"].map(range => (
                    <button
                      key={range}
                      onClick={() => setGrowthRange(range)}
                      className={cn(
                        "px-3 py-1 text-sm transition-all rounded-md",
                        growthRange === range ? "bg-white text-openclub-700 font-medium shadow-sm border border-[#e1efe5]" : "text-zinc-500 font-normal hover:text-zinc-700 hover:bg-slate-100/50"
                      )}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-2 flex-1 w-full min-h-[250px]">
                {!isMounted || loading || growthLoading ? (
                  <TrendChartSkeleton variant="bar" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={growthData} margin={{ top: 20, right: 0, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1efe5" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: "#a1a1aa" }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} width={80} tick={{ fontSize: 13, fill: "#a1a1aa" }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e1efe5', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
                      />
                      <Bar dataKey="count" fill="#15803D" radius={[4, 4, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Demographics Row */}
          <div className="flex flex-col xl:flex-row gap-6 w-full">
            {/* Age Range Card */}
            <div className="p-7 bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex flex-col gap-6 w-full xl:w-auto xl:flex-[1.4] xl:h-[430px] font-sans">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <div className="text-zinc-700 text-xl font-medium">Age range</div>
                  <div className="relative group flex items-center justify-center">
                    <div className="w-4 h-4 bg-zinc-400 rounded-full text-white text-[10px] font-bold flex items-center justify-center cursor-help">?</div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[220px] p-2.5 bg-[#0a2316] text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-lg text-center leading-relaxed">
                      Distribution of total registered users across different age groups.
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#0a2316]"></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-[#f5faf6] border border-[#e1efe5] rounded-lg p-1">
                  {["All", "Men", "Women"].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setAgeDemographicsFilter(filter as any)}
                      className={cn(
                        "px-3 py-1 text-sm transition-all rounded-md",
                        ageDemographicsFilter === filter ? "bg-white text-openclub-700 font-medium shadow-sm border border-[#e1efe5]" : "text-zinc-500 font-normal hover:text-zinc-700 hover:bg-slate-100/50"
                      )}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full flex-1 min-h-[220px] mt-2">
                {!isMounted || loading || ageLoading ? (
                  <TrendChartSkeleton variant="bar" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    {(() => {
                      const hasData = ageDemographicsData && ageDemographicsData.some(d => d.men > 0 || d.women > 0);
                      const displayData = hasData ? ageDemographicsData : [
                        { age: "13-17", men: 10, women: 5 },
                        { age: "18-24", men: 30, women: 45 },
                        { age: "25-34", men: 50, women: 35 },
                        { age: "35-44", men: 40, women: 55 },
                        { age: "45-54", men: 80, women: 45 },
                        { age: "55-64", men: 15, women: 30 },
                        { age: "65-74+", men: 25, women: 20 },
                      ];

                      return (
                        <BarChart data={displayData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1efe5" />
                          <XAxis dataKey="age" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#71717A" }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#71717A" }} />
                          <Tooltip
                            cursor={{ fill: '#f1f5f9' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            itemStyle={{ fontSize: '13px', fontWeight: 500 }}
                            labelStyle={{ color: '#71717A', marginBottom: '4px' }}
                          />
                          {(ageDemographicsFilter === "All" || ageDemographicsFilter === "Men") && (
                            <Bar dataKey="men" name="Men" fill="#15803D" radius={[4, 4, 0, 0]} barSize={ageDemographicsFilter === "All" ? 12 : 24} />
                          )}
                          {(ageDemographicsFilter === "All" || ageDemographicsFilter === "Women") && (
                            <Bar dataKey="women" name="Women" fill="#86EFAC" radius={[4, 4, 0, 0]} barSize={ageDemographicsFilter === "All" ? 12 : 24} />
                          )}
                        </BarChart>
                      );
                    })()}
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Gender Card */}
            {(() => {
              const menCount = stats?.menCount || 0;
              const womenCount = stats?.womenCount || 0;

              const totalGender = menCount + womenCount;
              const menPercent = totalGender === 0 ? 0 : Math.round((menCount / totalGender) * 100);
              const womenPercent = totalGender === 0 ? 0 : Math.round((womenCount / totalGender) * 100);

              const pieData = totalGender === 0
                ? [{ name: "No Data", value: 100, color: "#e1efe5" }]
                : [
                  { name: "Men", value: menPercent, color: "#15803D" },
                  { name: "Women", value: womenPercent, color: "#86EFAC" },
                ];

              return (
                <div className="p-7 bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex flex-col w-full xl:w-auto xl:flex-1 xl:h-[430px] font-sans">
                  <div className="flex justify-between items-center w-full mb-8">
                    <div className="flex items-center gap-2">
                      <div className="text-zinc-700 text-xl font-medium">Gender</div>
                      <div className="relative group flex items-center justify-center">
                        <div className="w-4 h-4 bg-zinc-400 rounded-full text-white text-[10px] font-bold flex items-center justify-center cursor-help">?</div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[220px] p-2.5 bg-[#0a2316] text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-lg text-center leading-relaxed">
                          Breakdown of registered users by gender.
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#0a2316]"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative w-full flex-1 min-h-[160px] flex items-end justify-center mb-6">
                    <ResponsiveContainer width="100%" height="200%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="100%"
                          startAngle={180}
                          endAngle={0}
                          innerRadius={115}
                          outerRadius={145}
                          dataKey="value"
                          stroke="none"
                          cornerRadius={10}
                          paddingAngle={5}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          itemStyle={{ color: '#374151', fontSize: '14px', fontWeight: 500 }}
                          formatter={((value: any) => [`${value}%`, ""]) as any}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex justify-center items-center gap-12 w-full mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-[#15803D] rounded-full" />
                      <div className="flex flex-col leading-none">
                        <span className="text-zinc-700 text-sm font-medium">{menPercent}%</span>
                        <span className="text-zinc-500 text-[10px] font-medium mt-1">Men</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-[#86EFAC] rounded-full" />
                      <div className="flex flex-col leading-none">
                        <span className="text-zinc-700 text-sm font-medium">{womenPercent}%</span>
                        <span className="text-zinc-500 text-[10px] font-medium mt-1">Women</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Right Column: Top Organizers */}
        <div className="xl:col-span-3 flex flex-col">
          {/* Revenue by Organizer Card */}
          <div className="p-7 bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex flex-col w-full font-sans shrink-0">
            <div className="flex items-center gap-2 mb-6">
              <div className="text-zinc-700 text-xl font-medium">Revenue by organizer</div>
              <div className="relative group flex items-center justify-center">
                <div className="w-4 h-4 bg-zinc-400 rounded-full text-white text-[10px] font-bold flex items-center justify-center cursor-help">?</div>
                <div className="absolute top-full right-0 translate-x-1/4 mt-2 w-[220px] p-2.5 bg-[#0a2316] text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-lg text-center leading-relaxed">
                  The top performing organizers ranked by total revenue generated.
                  <div className="absolute bottom-full right-4 border-4 border-transparent border-b-[#0a2316]"></div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-6 flex-1 justify-center">
              {loading || topClubsLoading ? (
                <div className="space-y-6">
                  {[1, 2, 3, 4, 5, 6, 7].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
                </div>
              ) : performingClubs.length > 0 ? (
                performingClubs.slice(0, 7).map((club, i) => {
                  return (
                    <div key={i} className="flex justify-between items-center w-full">
                      <div className="inline-flex justify-start items-center gap-3">
                        <img className="size-10 rounded-full object-cover bg-gray-100 border border-[#efefef]" src={club.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(club.name)}&background=10b981&color=fff`} alt={club.name} />
                        <div className="inline-flex flex-col justify-start items-start">
                          <div className="text-slate-900 text-sm font-medium whitespace-normal max-w-[180px] leading-tight">{club.name}</div>
                          <div className="text-gray-500 text-xs font-normal mt-0.5">{formatWithCommas(club.tournaments ?? 0)} Tournaments</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-zinc-700 text-[14px] font-bold">₦{formatWithCommas(club.revenue ?? 0)}</div>
                        <div className="text-gray-500 text-xs font-normal mt-0.5">{formatWithCommas(club.registrations ?? 0)} regs</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center bg-[#f5faf6] rounded-xl border border-dashed border-[#e1efe5] mt-2">
                  <div className="w-10 h-10 bg-white border border-[#e1efe5] rounded-full flex items-center justify-center mb-3">
                    <Trophy className="w-5 h-5 text-[#15803D]" />
                  </div>
                  <p className="text-[13px] font-medium text-[#15803D]">No organizer data</p>
                  <p className="text-[12px] text-gray-500 mt-0.5 max-w-[180px]">Organizers with the most revenue will be ranked here.</p>
                </div>
              )}
            </div>
          </div>

          {/* App System Health Card */}
          <div className="p-7 bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex flex-col w-full font-sans mt-6 flex-1 min-h-[300px]">
            <div className="flex items-center gap-2 mb-6 shrink-0">
              <div className="text-zinc-700 text-xl font-medium">System Health</div>
              <div className="relative group flex items-center justify-center">
                <div className="w-4 h-4 bg-zinc-400 rounded-full text-white text-[10px] font-normal flex items-center justify-center cursor-help">?</div>
                <div className="absolute top-full right-0 translate-x-1/4 mt-2 w-[220px] p-2.5 bg-[#0a2316] text-white text-xs font-normal rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-lg text-center leading-relaxed">
                  Real-time status of the OpenClubOS infrastructure and services.
                  <div className="absolute bottom-full right-4 border-4 border-transparent border-b-[#0a2316]"></div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${stats?.systemHealth?.api === 'Operational' ? 'bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-red-500'}`} />
                  <div className="text-sm text-slate-800 font-medium">Core API Server</div>
                </div>
                <div className={`text-[13px] font-normal ${stats?.systemHealth?.api === 'Operational' ? 'text-[#15803D] bg-[#f5faf6] border-[#e1efe5]' : 'text-red-600 bg-red-50 border-red-200'} px-2.5 py-0.5 rounded-md border`}>{stats?.systemHealth?.api || 'Unknown'}</div>
              </div>
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${stats?.systemHealth?.database === 'Operational' ? 'bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-red-500'}`} />
                  <div className="text-sm text-slate-800 font-medium">PostgreSQL Database</div>
                </div>
                <div className={`text-[13px] font-normal ${stats?.systemHealth?.database === 'Operational' ? 'text-[#15803D] bg-[#f5faf6] border-[#e1efe5]' : 'text-red-600 bg-red-50 border-red-200'} px-2.5 py-0.5 rounded-md border`}>{stats?.systemHealth?.database || 'Unknown'}</div>
              </div>
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${stats?.systemHealth?.redis === 'Operational' ? 'bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-red-500'}`} />
                  <div className="text-sm text-slate-800 font-medium">Redis Cache</div>
                </div>
                <div className={`text-[13px] font-normal ${stats?.systemHealth?.redis === 'Operational' ? 'text-[#15803D] bg-[#f5faf6] border-[#e1efe5]' : 'text-red-600 bg-red-50 border-red-200'} px-2.5 py-0.5 rounded-md border`}>{stats?.systemHealth?.redis || 'Unknown'}</div>
              </div>
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${stats?.systemHealth?.workers === 'Operational' ? 'bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-red-500'}`} />
                  <div className="text-sm text-slate-800 font-medium">Background Workers</div>
                </div>
                <div className={`text-[13px] font-normal ${stats?.systemHealth?.workers === 'Operational' ? 'text-[#15803D] bg-[#f5faf6] border-[#e1efe5]' : 'text-red-600 bg-red-50 border-red-200'} px-2.5 py-0.5 rounded-md border`}>{stats?.systemHealth?.workers || 'Unknown'}</div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#e1efe5] flex justify-between items-center">
                <div className="text-xs text-gray-500 font-normal">Average Latency</div>
                <div className="text-xs font-normal text-slate-800">
                  {realTimeLatency !== '--' && realTimeLatency !== 'error' ? (
                    <span className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
                      </span>
                      {realTimeLatency}
                    </span>
                  ) : (
                    stats?.systemHealth?.latency || '--'
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500 font-normal">Uptime (30d)</div>
                <div className="text-xs font-normal text-slate-800">{stats?.systemHealth?.uptime || '--'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity, Alerts, Top Organizers Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="border border-[#e1efe5] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-2">
            <CardTitle className="text-[16px] font-normal">Recent Activity</CardTitle>

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
              <div className="flex flex-col items-center justify-center py-10 text-center bg-[#f5faf6] rounded-xl border border-dashed border-[#e1efe5] mt-2">
                <div className="w-10 h-10 bg-white border border-[#e1efe5] rounded-full flex items-center justify-center mb-3">
                  <Building2 className="w-5 h-5 text-[#15803D]" />
                </div>
                <p className="text-[13px] font-medium text-[#15803D]">No recent activity</p>
                <p className="text-[12px] text-gray-500 mt-0.5 max-w-[180px]">New platform events will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Organizers by Subscription */}
        <Card className="border border-[#e1efe5] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-2">
            <CardTitle className="text-[16px] font-normal">Top Organizers by Subscription</CardTitle>
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
                <div key={i} className="flex items-center gap-4 w-full">
                  <div className="inline-flex justify-start items-center gap-3 flex-1 min-w-0">
                    <img className="size-10 rounded-full object-cover bg-gray-100 border border-[#efefef] flex-shrink-0" src={club.logo} alt={club.name} />
                    <div className="inline-flex flex-col justify-start items-start min-w-0 pr-2">
                      <div className="text-slate-900 text-sm font-medium truncate w-full max-w-[140px] leading-tight">{club.name}</div>
                      <div className="text-gray-500 text-xs font-normal mt-0.5">{club.plan}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-[13px] font-normal text-gray-900">{`₦${formatWithCommas(club.yearlyFee)}/yr`}</p>
                    <span className={cn(
                      "text-[10px] font-normal px-2 py-0.5 rounded-lg border capitalize inline-flex items-center gap-1.5 whitespace-nowrap",
                      club.status === 'Active' ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", club.status === 'Active' ? "bg-green-500" : "bg-red-500")} />
                      {club.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center bg-[#f5faf6] rounded-xl border border-dashed border-[#e1efe5] mt-2">
                <div className="w-10 h-10 bg-white border border-[#e1efe5] rounded-full flex items-center justify-center mb-3">
                  <Building2 className="w-5 h-5 text-[#15803D]" />
                </div>
                <p className="text-[13px] font-medium text-[#15803D]">No subscription data</p>
                <p className="text-[12px] text-gray-500 mt-0.5 max-w-[180px]">Organizers on paid plans will be listed here.</p>
              </div>
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
    <div className="h-full w-full rounded-xl border border-[#efefef] bg-background/40 p-5">
      <div className="grid h-full w-full grid-cols-[44px_1fr] gap-4">
        <div className="flex flex-col justify-between py-2">
          <Skeleton className="h-3 w-10 rounded-md" />
          <Skeleton className="h-3 w-8 rounded-md" />
          <Skeleton className="h-3 w-9 rounded-md" />
          <Skeleton className="h-3 w-7 rounded-md" />
          <Skeleton className="h-3 w-10 rounded-md" />
        </div>
        <div className="flex h-full flex-col justify-between">
          <div className="relative flex-1 rounded-xl bg-white/60 border border-[#efefef] overflow-hidden">
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
    success: { badge: "bg-green-50 text-green-600 border-green-100", dot: "bg-green-500" },
    warning: { badge: "bg-orange-50 text-orange-600 border-orange-100", dot: "bg-orange-500" },
    danger: { badge: "bg-red-50 text-red-600 border-red-100", dot: "bg-red-500" },
  };

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-normal border mt-0.5 w-fit uppercase whitespace-nowrap", styles[type].badge)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", styles[type].dot)} />
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
        <p className="text-[13px] font-normal text-gray-800 leading-tight">{title}</p>
        <p className="text-[12px] text-gray-500 mt-1">{subtitle}</p>
      </div>
      <span className="text-[12px] text-gray-400 font-normal whitespace-nowrap">{time}</span>
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
        <p className="text-[13px] font-normal text-gray-800 leading-tight">{title}</p>
        <p className="text-[12px] text-gray-500 mt-1">{subtitle}</p>
      </div>
      <span className="text-[12px] text-gray-400 font-normal whitespace-nowrap">{time}</span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 w-full max-w-full px-2 pb-10">
      {/* Stat Cards */}
      <div className="w-full bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-x-auto">
        <div className="flex items-center justify-between px-12 py-8 min-w-[1000px]">
          {[1, 2, 3, 4, 5].map((i, index) => (
            <div key={i} className="flex items-center w-full">
              <div className="flex flex-col gap-3.5 flex-1">
                <div className="flex items-center gap-3.5">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-12 rounded-lg" />
                </div>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              {index < 4 && <div className="w-px h-28 bg-slate-200 mx-10 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Charts & Demographics vs Top Organizers Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
        <div className="xl:col-span-9 flex flex-col gap-6">
          <div className="grid grid-cols-1 xl:grid-cols-9 gap-6 w-full">
            <div className="p-7 bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex flex-col gap-2.5 overflow-x-auto w-full xl:col-span-5 h-[366px]">
              <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-9 w-[120px] rounded-lg" />
              </div>
              <TrendChartSkeleton variant="line" />
            </div>

            <div className="p-6 pt-6 bg-white border-0 rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex flex-col w-full h-full xl:col-span-4 h-[366px]">
              <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-9 w-[120px] rounded-lg" />
              </div>
              <TrendChartSkeleton variant="bar" />
            </div>
          </div>
          <div className="flex flex-col xl:flex-row gap-6 w-full">
            <div className="p-7 bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex flex-col w-full xl:w-auto xl:flex-[1.4] h-[366px]">
              <div className="flex justify-between items-center w-full mb-8">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-32" />
              </div>
              <TrendChartSkeleton variant="bar" />
            </div>

            <div className="p-7 bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex flex-col w-full xl:w-auto xl:flex-1 h-[366px]">
              <div className="flex justify-between items-center w-full mb-8">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <div className="relative w-full flex-1 flex items-end justify-center mb-6">
                <Skeleton className="h-32 w-32 rounded-full" />
              </div>
              <div className="flex justify-center items-center gap-12 w-full mt-auto">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-5 h-5 rounded-full" />
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-3 w-6" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="w-5 h-5 rounded-full" />
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-3 w-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 flex flex-col">
          <div className="p-7 bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex flex-col w-full shrink-0">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="flex flex-col gap-6 flex-1 justify-center">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="flex justify-between items-center w-full">
                  <div className="flex gap-3 items-center">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 items-end">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-7 bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex flex-col w-full mt-6 flex-1 min-h-[300px]">
            <Skeleton className="h-6 w-32 mb-6" />
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between items-center w-full">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-20 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-[#e1efe5] shadow-sm flex flex-col">
          <div className="flex justify-between items-center px-6 pt-6 pb-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-7 p-6 pt-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#e1efe5] shadow-sm flex flex-col">
          <div className="flex justify-between items-center px-6 pt-6 pb-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-[120px] rounded-lg" />
          </div>
          <div className="space-y-7 p-3 pt-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

