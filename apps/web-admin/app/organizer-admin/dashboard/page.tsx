"use client";

import { useState, useSyncExternalStore, useEffect, type ElementType } from "react";
import {
  Users,
  Trophy,
  CheckSquare,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  CreditCard,
  User,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";
import { StatCard } from "@/components/dashboard/stat-card";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/AuthContext";
import { getClubStats, getClubChartData } from "@/lib/api/clubs";
import { getTournaments } from "@/lib/api/tournaments";
import { getClubWallet, type ClubWalletSummary } from "@/lib/api/withdrawals";
import { toast } from "sonner";

// Mock data removed in favor of live data
interface ActivityItemProps {
  title: string;
  subtitle: string;
  time: string;
  icon: ElementType;
  iconBg: string;
  iconColor: string;
  amount?: string;
}

export default function OrganizerAdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [wallet, setWallet] = useState<ClubWalletSummary | null>(null);
  const [upcomingTournaments, setUpcomingTournaments] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isMounted = useSyncExternalStore(
    () => () => { },
    () => true,
    () => false,
  );

  useEffect(() => {
    if (user?.clubId) {
      setLoading(true);
      Promise.all([
        getClubStats(user.clubId),
        getTournaments({ clubId: user.clubId, take: 3, status: "REGISTRATION_OPEN" }),
        getClubWallet().catch(() => null),
      ])
        .then(([statsData, tournamentsData, walletData]: [any, any, any]) => {
          setStats(statsData);
          setUpcomingTournaments(Array.isArray(tournamentsData) ? tournamentsData : []);
          if (walletData) setWallet(walletData);
        })
        .catch((err) => {
          console.error("Failed to fetch dashboard data:", err);
          toast.error("Failed to load dashboard data");
        })
        .finally(() => setLoading(false));
    }
  }, [user?.clubId]);

  const [registrationsRange, setRegistrationsRange] = useState("This Year");
  const [revenueRange, setRevenueRange] = useState("This Year");
  const [registrationData, setRegistrationData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);

  useEffect(() => {
    if (user?.clubId) {
      getClubChartData(user.clubId, registrationsRange)
        .then((res: any) => setRegistrationData(res.registrationData || []))
        .catch(console.error);
    }
  }, [user?.clubId, registrationsRange]);

  useEffect(() => {
    if (user?.clubId) {
      getClubChartData(user.clubId, revenueRange)
        .then((res: any) => setRevenueData(res.revenueData || []))
        .catch(console.error);
    }
  }, [user?.clubId, revenueRange]);

  if (loading) {
    return (
      <div className="space-y-8 w-full max-w-full px-2 pb-10">
        {/* Horizontal Stats Ribbon Skeleton */}
        <div className="w-full bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-x-auto">
          <div className="flex items-center justify-between px-12 py-8 min-w-[1000px]">
            {[1, 2, 3, 4, 5].map((i, idx) => (
              <div key={i} className="flex items-center gap-8">
                <div className="flex flex-col gap-3.5 w-40">
                  <div className="flex items-center gap-3.5">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-12 rounded-lg" />
                  </div>
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                {idx < 4 && <div className="w-px h-28 bg-[oklch(0.94_0.02_154.09)] ml-8" />}
              </div>
            ))}
          </div>
        </div>

        {/* Charts & Tables Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
          <Skeleton className="h-[400px] w-full rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)]" />
          <Skeleton className="h-[400px] w-full rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)]" />
        </div>
      </div>
    );
  }

  const paymentStatusData = [
    { name: "Paid", value: stats?.paidRegistrations || 0, color: "#15803D" },
    { name: "Pending", value: stats?.unpaidRegistrations || 0, color: "#f59e0b" },
  ];

  return (
    <div className="space-y-8 w-full max-w-full px-2 pb-10 font-sans">
      <div className="w-full bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-x-auto">
        <div className="flex items-center justify-between px-12 py-8 min-w-[1000px]">
          {/* Stat 1: Total Users */}
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

          <div className="w-px h-28 bg-[oklch(0.94_0.02_154.09)]" />

          {/* Stat 2: Active Tournaments */}
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-3.5">
              <div className="text-zinc-700 text-base font-medium">Active Tournaments</div>
            </div>
            <div className="text-openclub-700 text-3xl font-semibold">
              {formatNumber(stats?.activeTournaments || 0)}
            </div>
            <div className="text-zinc-500 text-sm font-normal">{stats?.ongoingTournaments || 0} ongoing</div>
          </div>

          <div className="w-px h-28 bg-[oklch(0.94_0.02_154.09)]" />

          {/* Stat 3: Total Registrations */}
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-3.5">
              <div className="text-zinc-700 text-base font-medium">Total Registrations</div>
            </div>
            <div className="text-openclub-700 text-3xl font-semibold">
              {formatNumber(stats?.paidRegistrations || 0)}
            </div>
            <div className="text-zinc-500 text-sm font-normal">{stats?.unpaidRegistrations || 0} pending</div>
          </div>

          <div className="w-px h-28 bg-[oklch(0.94_0.02_154.09)]" />

          {/* Stat 4: Wallet Balance & All Time Balance */}
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-3.5">
              <div className="text-zinc-700 text-base font-medium">Wallet Balance</div>
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
              ₦{formatNumber(wallet?.availableBalance ?? stats?.availableBalance ?? stats?.totalRevenue ?? 0)}
            </div>
            <div className="text-zinc-500 text-sm font-normal">
              All Time: ₦{formatNumber(wallet?.totalRevenue ?? stats?.totalRevenue ?? 0)}
            </div>
          </div>

          <div className="w-px h-28 bg-[oklch(0.94_0.02_154.09)]" />

          {/* Stat 5: Pending Payments */}
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-3.5">
              <div className="text-zinc-700 text-base font-medium">Pending Payments</div>
            </div>
            <div className="text-openclub-700 text-3xl font-semibold">
              {formatNumber(stats?.unpaidRegistrations || 0)}
            </div>
            <div className="text-zinc-500 text-sm font-normal">{stats?.unpaidAmount != null ? `₦${formatNumber(stats.unpaidAmount)}` : "₦0"}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
        {/* Registration Overview Card */}
        <div className="p-7 bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex flex-col gap-2.5 w-full">
          <div className="w-full flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="text-zinc-700 text-xl font-medium">Registration Overview</div>
              <div className="relative group flex items-center justify-center">
                <div className="w-4 h-4 bg-zinc-400 rounded-full text-white text-[10px] font-bold flex items-center justify-center cursor-help">?</div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[220px] p-2.5 bg-[#0a2316] text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg text-center leading-relaxed">
                  Monthly user registrations over time.
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#0a2316]"></div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-[#f5faf6] border border-[#e1efe5] rounded-lg p-1">
              {["This Year", "Last Year"].map(range => (
                <button
                  key={range}
                  onClick={() => setRegistrationsRange(range)}
                  className={cn(
                    "px-3 py-1 text-sm transition-all rounded-md",
                    registrationsRange === range ? "bg-white text-openclub-700 font-medium shadow-sm border border-[#e1efe5]" : "text-zinc-500 font-normal hover:text-zinc-700 hover:bg-slate-100/50"
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full min-h-[300px]">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={registrationData} margin={{ top: 20, right: 0, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1efe5" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#a1a1aa" }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} width={80} tick={{ fontSize: 12, fill: "#a1a1aa" }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(21, 128, 61, 0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#15803D] text-white text-xs font-medium px-2.5 py-1.5 rounded shadow-[0px_4px_8px_0px_rgba(0,0,0,0.10)] relative -mt-6">
                            {Number(payload[0].value)} Registrations
                            <div className="absolute w-2 h-2 bg-[#15803D] rotate-45 -bottom-1 left-1/2 -translate-x-1/2" />
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#15803D"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-full w-full rounded-xl" />
            )}
          </div>
        </div>

        {/* Revenue Overview Card */}
        <div className="p-7 bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex flex-col gap-2.5 w-full">
          <div className="w-full flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="text-zinc-700 text-xl font-medium">Revenue Overview</div>
              <div className="relative group flex items-center justify-center">
                <div className="w-4 h-4 bg-zinc-400 rounded-full text-white text-[10px] font-bold flex items-center justify-center cursor-help">?</div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[220px] p-2.5 bg-[#0a2316] text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg text-center leading-relaxed">
                  Monthly revenue generated from entry fees.
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#0a2316]"></div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-[#f5faf6] border border-[#e1efe5] rounded-lg p-1">
              {["This Year", "Last Year"].map(range => (
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

          <div className="flex-1 w-full min-h-[300px]">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 20, right: 0, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFunnelRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#15803D" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#15803D" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1efe5" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#a1a1aa" }} dy={10} />
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
                        const val = typeof payload[0].value === "number" ? payload[0].value : Number(payload[0].value);
                        return (
                          <div className="bg-[#15803D] text-white text-xs font-medium px-2.5 py-1.5 rounded shadow-[0px_4px_8px_0px_rgba(0,0,0,0.10)] relative -mt-6">
                            {formatCurrency(Number.isFinite(val) ? val : 0)}
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
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorFunnelRev)"
                    activeDot={{ r: 6, fill: "#15803D", strokeWidth: 2, stroke: "#fff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-full w-full rounded-xl" />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex flex-col w-full h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-6">
            <CardTitle className="text-zinc-700 text-xl font-medium">Upcoming Tournaments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 px-6 pb-6">
            {upcomingTournaments.length > 0 ? (
              upcomingTournaments.map((t) => (
                <div key={t.id} className="flex items-center justify-between">
                  <div className="flex flex-col min-w-0">
                    <p className="text-[14px] font-medium text-gray-800 truncate">{t.name}</p>
                    <p className="text-[12px] text-gray-500 font-normal mt-1">
                      {new Date(t.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-medium text-gray-900">
                      {t.entryFee === 0 || !t.entryFee ? "FREE" : formatCurrency(t.entryFee)}
                    </span>
                    <span className="text-[10px] font-normal px-2 py-0.5 rounded-lg bg-emerald-50 text-openclub-800 border border-emerald-100 capitalize">
                      Upcoming
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-[13px] text-gray-400 font-normal">No upcoming tournaments</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex flex-col w-full h-full">
          <CardHeader className="pb-2 px-6 pt-6">
            <CardTitle className="text-zinc-700 text-xl font-medium">Payment Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center flex-1 px-6 pb-6">
            <div className="h-[220px] w-full max-w-[240px]">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={paymentStatusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={4}>
                      {paymentStatusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              ) : (
                <Skeleton className="h-full w-full rounded-xl" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex flex-col w-full h-full">
          <CardHeader className="pb-2 px-6 pt-6">
            <CardTitle className="text-zinc-700 text-xl font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 px-6 pb-6">
            {recentActivity.length > 0 ? (
              recentActivity.map((a) => (
                <ActivityItem key={`${a.title}-${a.time}`} {...(a as ActivityItemProps)} />
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-[13px] text-gray-400 font-normal">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ActivityItem({ title, subtitle, time, icon: Icon, iconBg, iconColor, amount }: ActivityItemProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-normal text-gray-900 truncate">{title}</p>
          <p className="text-[12px] text-gray-400 font-normal truncate">{subtitle}</p>
        </div>
      </div>
      <div className="text-right flex flex-col items-end gap-1">
        {amount ? <p className="text-[12px] font-normal text-openclub-800">{amount}</p> : null}
        <p className="text-[12px] text-gray-400 font-normal whitespace-nowrap">{time}</p>
      </div>
    </div>
  );
}

