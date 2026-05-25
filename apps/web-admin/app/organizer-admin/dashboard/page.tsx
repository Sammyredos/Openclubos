"use client";

import { useState, useSyncExternalStore, useEffect, type ElementType } from "react";
import {
  Users,
  Trophy,
  CheckSquare,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  User,
  CreditCard,
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
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/AuthContext";
import { getClubStats } from "@/lib/api/clubs";
import { getTournaments } from "@/lib/api/tournaments";
import { toast } from "sonner";

// Mock data for trends (since backend doesn't provide them yet)
const registrationData = [
  { month: "Jan", count: 0 },
  { month: "Feb", count: 0 },
  { month: "Mar", count: 0 },
  { month: "Apr", count: 0 },
  { month: "May", count: 0 },
  { month: "Jun", count: 0 },
  { month: "Jul", count: 0 },
  { month: "Aug", count: 0 },
  { month: "Sep", count: 0 },
  { month: "Oct", count: 0 },
  { month: "Nov", count: 0 },
  { month: "Dec", count: 0 },
];

const revenueData = [
  { month: "Jan", amount: 0 },
  { month: "Feb", amount: 0 },
  { month: "Mar", amount: 0 },
  { month: "Apr", amount: 0 },
  { month: "May", amount: 0 },
  { month: "Jun", amount: 0 },
  { month: "Jul", amount: 0 },
  { month: "Aug", amount: 0 },
  { month: "Sep", amount: 0 },
  { month: "Oct", amount: 0 },
  { month: "Nov", amount: 0 },
  { month: "Dec", amount: 0 },
];

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
  const [upcomingTournaments, setUpcomingTournaments] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (user?.clubId) {
      setLoading(true);
      Promise.all([
        getClubStats(user.clubId),
        getTournaments({ clubId: user.clubId, take: 5, status: "REGISTRATION_OPEN" })
      ])
        .then(([statsData, tournamentsData]: [any, any]) => {
          setStats(statsData);
          setUpcomingTournaments(Array.isArray(tournamentsData) ? tournamentsData : []);
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

  if (loading) {
    return (
      <div className="space-y-8 w-full max-w-full px-2 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl shadow-sm" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] w-full rounded-2xl shadow-sm" />
          <Skeleton className="h-[400px] w-full rounded-2xl shadow-sm" />
        </div>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(val);
  };

  const paymentStatusData = [
    { name: "Paid", value: stats?.paidRegistrations || 0, color: "#10b981" },
    { name: "Pending", value: stats?.unpaidRegistrations || 0, color: "#f59e0b" },
  ];

  return (
    <div className="space-y-8 w-full max-w-full px-2 pb-10 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard
          title="Total Users"
          value={stats?.totalMembers?.toString() || "0"}
          change={stats?.membersGrowth || "0"}
          icon={Users}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Active Tournaments"
          value={stats?.activeTournaments?.toString() || "0"}
          subValue={`${stats?.ongoingTournaments || 0} ongoing`}
          icon={Trophy}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Total Registrations"
          value={stats?.paidRegistrations?.toString() || "0"}
          subValue={stats?.unpaidRegistrations ? `${stats.unpaidRegistrations} pending` : "0 pending"}
          icon={CheckSquare}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
        />
        <StatCard
          title="Total Entry Fees"
          value={formatCurrency(stats?.totalRevenue || 0)}
          change={stats?.revenueGrowth || "0"}
          icon={TrendingUp}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Pending Payments"
          value={stats?.unpaidRegistrations?.toString() || "0"}
          subValue={formatCurrency(stats?.unpaidAmount || 0)}
          icon={Wallet}
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl font-bold">Registrations Overview</CardTitle>
            <SearchableSelect
              value={registrationsRange}
              onValueChange={setRegistrationsRange}
              options={["This Year", "Last Year"].map((v) => ({ value: v, label: v }))}
              triggerClassName="h-10 bg-white text-[14px]"
            />
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={registrationData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Skeleton className="h-full w-full rounded-xl" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold">Revenue Overview</CardTitle>
            <SearchableSelect
              value={revenueRange}
              onValueChange={setRevenueRange}
              options={["This Year", "Last Year"].map((v) => ({ value: v, label: v }))}
              triggerClassName="h-10 bg-white text-sm"
            />
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} dy={10} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#9ca3af" }}
                      tickFormatter={(value) => `₦${value / 1000000}M`}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(value) => {
                        const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : 0;
                        const safe = Number.isFinite(n) ? n : 0;
                        return [`₦${safe.toLocaleString()}`, "Revenue"];
                      }}
                    />
                    <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Skeleton className="h-full w-full rounded-xl" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Upcoming Tournaments</CardTitle>
            <Button variant="link" className="text-[#10b981] p-0 h-auto font-medium no-underline hover:no-underline transition-all duration-200 hover:font-bold">
              View All Upcoming <ArrowUpRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {upcomingTournaments.length > 0 ? (
              upcomingTournaments.map((t) => (
                <div key={t.id} className="flex items-center justify-between">
                  <div className="flex flex-col min-w-0">
                    <p className="text-[14px] font-bold text-gray-800 truncate">{t.name}</p>
                    <p className="text-[12px] text-gray-500 font-medium mt-1">
                      {new Date(t.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-bold text-gray-900">
                      {t.entryFee === 0 || !t.entryFee ? "FREE" : `₦${t.entryFee.toLocaleString()}`}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">
                      Upcoming
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-[13px] text-gray-400 font-medium">No upcoming tournaments</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Payment Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
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

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {recentActivity.length > 0 ? (
              recentActivity.map((a) => (
                <ActivityItem key={`${a.title}-${a.time}`} {...(a as ActivityItemProps)} />
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-[13px] text-gray-400 font-medium">No recent activity</p>
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
          <p className="text-[13px] font-bold text-gray-900 truncate">{title}</p>
          <p className="text-[12px] text-gray-400 font-medium truncate">{subtitle}</p>
        </div>
      </div>
      <div className="text-right flex flex-col items-end gap-1">
        {amount ? <p className="text-[12px] font-bold text-emerald-600">{amount}</p> : null}
        <p className="text-[12px] text-gray-400 font-medium whitespace-nowrap">{time}</p>
      </div>
    </div>
  );
}
