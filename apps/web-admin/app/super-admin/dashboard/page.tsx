"use client";

import { useState, useEffect } from "react";
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
import { cn, formatNumber, formatWithCommas } from "@/lib/utils";
import { getAuthToken } from "@/lib/api/auth";
import { SearchableSelect } from "@/components/ui/input";

import { Skeleton } from "@/components/ui/skeleton";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

function timeAgo(iso: string) {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "—";
  const diffMinutes = Math.floor((Date.now() - ts) / 60000);
  if (diffMinutes < 0) return "just now";

  const absMinutes = diffMinutes;
  if (absMinutes < 1) return "just now";
  if (absMinutes < 60) return `${absMinutes}m ago`;

  const absHours = Math.floor(absMinutes / 60);
  if (absHours < 24) return `${absHours}h ago`;

  const absDays = Math.floor(absHours / 24);
  return `${absDays}d ago`;
}

export default function SuperAdminDashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [performingClubs, setPerformingClubs] = useState<any[]>([]);
  const [subscriptionClubs, setSubscriptionClubs] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [revenueRange, setRevenueRange] = useState("This Year");
  const [growthRange, setGrowthRange] = useState("This Year");
  const [topClubsRange, setTopClubsRange] = useState("This Month");
  const [topSubsRange, setTopSubsRange] = useState("All Time");

  useEffect(() => {
    setIsMounted(true);
    async function fetchDashboardData() {
      try {
        const token = getAuthToken();
        if (!token) {
          setAuthError("Not authenticated. Please login again.");
          setStats(null);
          setRecentActivity([]);
          setSubscriptionClubs([]);
          setPerformingClubs([]);
          setRevenueData([]);
          setGrowthData([]);
          return;
        }

        setAuthError(null);
        const headers = { Authorization: `Bearer ${token}` };

        const [statsRes, activityRes, clubsRes, revenueRes, growthRes, clubsListRes] = await Promise.all([
          fetch(`${API_BASE}/super-admin/dashboard/stats`, { headers }),
          fetch(`${API_BASE}/super-admin/dashboard/activity`, { headers }),
          fetch(`${API_BASE}/super-admin/dashboard/top-clubs`, { headers }),
          fetch(`${API_BASE}/super-admin/dashboard/revenue-trend`, { headers }),
          fetch(`${API_BASE}/super-admin/dashboard/club-growth`, { headers }),
          fetch(`${API_BASE}/super-admin/clubs`, { headers }), // Fetching clubs to derive subscription info
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
        setStats(await statsRes.json());

        if (activityRes.ok) setRecentActivity(await activityRes.json());
        if (clubsRes.ok) setPerformingClubs(await clubsRes.json());
        if (revenueRes.ok) setRevenueData(await revenueRes.json());
        if (growthRes.ok) setGrowthData(await growthRes.json());
        
        if (clubsListRes.ok) {
          const clubsData = await clubsListRes.json();
          const items = Array.isArray(clubsData) ? clubsData : (clubsData?.items || []);
          // Sort by plan and status to simulate "top" subscription clubs
          const topSubs = items
            .sort((a: any, b: any) => {
              if (a.plan === "PRO" && b.plan !== "PRO") return -1;
              if (a.plan !== "PRO" && b.plan === "PRO") return 1;
              return 0;
            })
            .slice(0, 5)
            .map((c: any) => ({
              id: c.id,
              name: c.name,
              logo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.name)}`,
              plan: c.plan === "PRO" ? "Pro Plan" : "Basic Plan",
              status: c.status === "ACTIVE" ? "Active" : "Inactive",
              yearlyFee: c.plan === "PRO" ? 150000 : 50000,
            }));
          setSubscriptionClubs(topSubs);
        }
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
        setAuthError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

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
          title="Total Clubs"
          value={stats?.totalClubs?.toString() || "0"}
          change={stats?.clubsGrowth}
          icon={Building2}
          iconBg="bg-green-50"
          iconColor="text-green-600"
          loading={loading}
        />
        <StatCard
          title="Active Clubs"
          value={stats?.activeClubs?.toString() || "0"}
          subValue={stats?.activeClubsPercent || undefined}
          subIcon={Users2}
          icon={CheckCircle2}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          loading={loading}
        />
        <StatCard
          title="Total Members"
          value={stats?.totalMembers?.toString() || "0"}
          change={stats?.membersGrowth}
          icon={Users}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          loading={loading}
        />
        <StatCard
          title="Active Tournaments"
          value={stats?.activeTournaments?.toString() || "0"}
          change={stats?.tournamentsGrowth}
          icon={Trophy}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
          loading={loading}
        />
        <StatCard
          title="Total Revenue"
          value={stats?.totalRevenue != null ? `₦${formatWithCommas(Math.round(stats.totalRevenue))}` : "₦0"}
          change={stats?.revenueGrowth}
          icon={TrendingUp}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          loading={loading}
        />
        <StatCard
          title="Pending Payments"
          value={stats?.pendingPayments?.toString() || "0"}
          change={stats?.pendingAmount != null ? `₦${formatWithCommas(Math.round(stats.pendingAmount))}` : undefined}
          changeType="decrease"
          icon={Wallet}
          iconBg="bg-red-50"
          iconColor="text-red-600"
          loading={loading}
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
              {!isMounted || loading ? (
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
                      formatter={(value: any) => [`₦${value.toLocaleString()}`, "Revenue"]}
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
            <CardTitle className="text-xl font-bold">Club Growth</CardTitle>
            <SearchableSelect
              value={growthRange}
              onValueChange={setGrowthRange}
              options={["This Year", "Last Year"].map((v) => ({ value: v, label: v }))}
              triggerClassName="h-10 bg-white text-[14px]"
            />
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <div className="h-[320px] w-full">
              {!isMounted || loading ? (
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

      {/* Activity, Alerts, Top Clubs Section */}
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
            {loading ? (
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

        {/* Top Clubs by Subscription */}
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-2">
            <CardTitle className="text-xl font-bold">Top Clubs by Subscription</CardTitle>
            <SearchableSelect
              value={topSubsRange}
              onValueChange={setTopSubsRange}
              options={[{ value: "All Time", label: "All Time" }]}
              triggerClassName="h-10 bg-white text-[13px]"
              disabled
            />
          </CardHeader>
          <CardContent className="space-y-7 p-3 pt-4">
            {loading ? (
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

        {/* Top Clubs by Tournament */}
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-2">
            <CardTitle className="text-xl font-bold">Top Clubs by Tournament</CardTitle>
            <SearchableSelect
              value={topClubsRange}
              onValueChange={setTopClubsRange}
              options={[{ value: "This Month", label: "This Month" }]}
              triggerClassName="h-10 bg-white text-[13px]"
              disabled
            />
          </CardHeader>
          <CardContent className="space-y-7 p-3 pt-4">
            {loading ? (
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
                        <StatusBadge type={club.statusType as any} label={club.status} />
                      </div>
                      <div className="flex flex-col items-end"
                        title={`Revenue is the sum of paid registrations (entry fee per registration) this month: ${formatWithCommas(club.paidRegistrations ?? 0)} paid registrations across ${formatWithCommas(club.tournaments ?? 0)} tournaments`}
                      >
                        <p className="text-[16px] font-bold text-gray-900">{`₦${formatWithCommas(club.revenue ?? 0)}`}</p>
                        <p className="text-[11px] text-gray-400 font-medium whitespace-nowrap">
                          {formatWithCommas(club.paidRegistrations ?? 0)} regs • {formatWithCommas(club.tournaments ?? 0)} tourns
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
              <p className="text-[13px] text-gray-400 font-medium">No club performance data</p>
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
  icon: any;
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
