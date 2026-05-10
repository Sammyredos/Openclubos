"use client";

import { useState, useSyncExternalStore, type ElementType } from "react";
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

const registrationData = [
  { month: "Jan", count: 40 },
  { month: "Feb", count: 60 },
  { month: "Mar", count: 50 },
  { month: "Apr", count: 80 },
  { month: "May", count: 100 },
  { month: "Jun", count: 90 },
  { month: "Jul", count: 110 },
  { month: "Aug", count: 85 },
  { month: "Sep", count: 120 },
  { month: "Oct", count: 140 },
  { month: "Nov", count: 160 },
  { month: "Dec", count: 175 },
];

const revenueData = [
  { month: "Jan", amount: 1000000 },
  { month: "Feb", amount: 1200000 },
  { month: "Mar", amount: 1500000 },
  { month: "Apr", amount: 1800000 },
  { month: "May", amount: 2000000 },
  { month: "Jun", amount: 2200000 },
  { month: "Jul", amount: 2500000 },
  { month: "Aug", amount: 2800000 },
  { month: "Sep", amount: 3200000 },
  { month: "Oct", amount: 3500000 },
  { month: "Nov", amount: 4000000 },
  { month: "Dec", amount: 4500000 },
];

const paymentStatusData = [
  { name: "Paid", value: 120, color: "#10b981" },
  { name: "Pending", value: 24, color: "#f59e0b" },
  { name: "Overdue", value: 8, color: "#ef4444" },
  { name: "Refunded", value: 4, color: "#94a3b8" },
];

const upcomingTournaments = [
  { name: "Easter Championship", date: "Apr 20 - Apr 22, 2026", status: "Registration Open", statusColor: "text-emerald-600 bg-emerald-50" },
  { name: "Captain's Cup", date: "May 10 - May 12, 2026", status: "Registration Open", statusColor: "text-emerald-600 bg-emerald-50" },
  { name: "Monthly Medal", date: "May 25, 2026", status: "Upcoming", statusColor: "text-blue-600 bg-blue-50" },
  { name: "Independence Tournament", date: "Oct 1 - Oct 3, 2026", status: "Upcoming", statusColor: "text-blue-600 bg-blue-50" },
];

const recentActivity = [
  { title: "New member registered", subtitle: "Mike Anderson", time: "2 hours ago", icon: User, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
  { title: "Payment received", subtitle: "Easter Championship - Registration", time: "5 hours ago", amount: "₦50,000", icon: CreditCard, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
  { title: "Score submitted", subtitle: "John Doe - Hole 18", time: "1 day ago", icon: CheckSquare, iconBg: "bg-orange-50", iconColor: "text-orange-600" },
  { title: "New registration", subtitle: "Sarah Johnson - Captain's Cup", time: "1 day ago", icon: User, iconBg: "bg-purple-50", iconColor: "text-purple-600" },
  { title: "Tournament created", subtitle: "Independence Tournament", time: "2 days ago", icon: Trophy, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
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
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [registrationsRange, setRegistrationsRange] = useState("This Year");
  const [revenueRange, setRevenueRange] = useState("This Year");

  return (
    <div className="space-y-8 w-full max-w-full px-2 pb-10 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard
          title="Total Members"
          value="320"
          change="+12"
          icon={Users}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Active Tournaments"
          value="8"
          subValue="2 ongoing"
          icon={Trophy}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Total Registrations"
          value="156"
          change="+18"
          icon={CheckSquare}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
        />
        <StatCard
          title="Total Revenue"
          value="₦4,250,000"
          change="+15.6%"
          icon={TrendingUp}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Pending Payments"
          value="24"
          change="₦620,000"
          changeType="neutral"
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
            {upcomingTournaments.map((t) => (
              <div key={t.name} className="flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-[14px] font-bold text-gray-800">{t.name}</p>
                  <p className="text-[12px] text-gray-500 font-medium mt-1">{t.date}</p>
                </div>
                <span className={`text-[11px] font-bold px-3 py-1 rounded-xl ${t.statusColor}`}>{t.status}</span>
              </div>
            ))}
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
            {recentActivity.map((a) => (
              <ActivityItem key={`${a.title}-${a.time}`} {...(a as ActivityItemProps)} />
            ))}
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

