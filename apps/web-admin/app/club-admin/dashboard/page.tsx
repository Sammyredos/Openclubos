"use client";

import { useState, useEffect, useSyncExternalStore, type ElementType } from "react";
import {
  Users,
  Trophy,
  CheckSquare,
  TrendingUp,
  Wallet,
  Calendar,
  Clock,
  ArrowUpRight,
  ChevronRight,
  User,
  CreditCard,
  AlertCircle,
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

export default function ClubAdminDashboard() {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [registrationsRange, setRegistrationsRange] = useState("This Year");
  const [revenueRange, setRevenueRange] = useState("This Year");

  return (
    <div className="space-y-8 w-full max-w-full px-2 pb-10 font-sans">
      {/* Stat Cards */}
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

      {/* Charts Section */}
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
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
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
                      tickFormatter={(value) => `₦${value/1000000}M`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(value) => {
                        const n =
                          typeof value === "number"
                            ? value
                            : typeof value === "string"
                              ? Number(value)
                              : 0;
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

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Tournaments */}
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Upcoming Tournaments</CardTitle>
            <Button 
              variant="link" 
              className="text-[#10b981] p-0 h-auto font-medium no-underline hover:no-underline transition-all duration-200 hover:font-bold"
            >
              View All Upcoming <ArrowUpRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {upcomingTournaments.map((t) => (
              <div key={t.name} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-gray-800">{t.name}</p>
                    <p className="text-[12px] text-gray-500">{t.date}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${t.statusColor}`}>
                  {t.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
            <Button 
              variant="link" 
              className="text-[#10b981] p-0 h-auto font-medium no-underline hover:no-underline transition-all duration-200 hover:font-bold"
            >
              View All Upcoming <ArrowUpRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {recentActivity.map((activity: ActivityItemProps, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={`p-2 rounded-xl ${activity.iconBg} ${activity.iconColor}`}>
                  <activity.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-gray-800 leading-tight">{activity.title}</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">{activity.subtitle}</p>
                  {activity.amount && <p className="text-[12px] font-bold text-gray-700 mt-1">{activity.amount}</p>}
                </div>
                <span className="text-[11px] text-gray-400 whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg font-bold">Payment Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[240px] w-full relative">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={paymentStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[12px] text-gray-400 font-medium">Total</p>
                <p className="text-2xl font-bold text-gray-800">24</p>
              </div>
            </div>
            
            <div className="w-full space-y-3 mt-4">
              {paymentStatusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-500 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-gray-800">
                    {item.value} ({Math.round((item.value / 152) * 100)}%)
                  </span>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full mt-6 border-gray-200 text-emerald-600 font-bold hover:bg-emerald-50 hover:border-emerald-200 rounded-lg flex items-center justify-center gap-2">
              View All Upcoming <ArrowUpRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Banner */}
      <div className="bg-emerald-50/50 border border-emerald-100 rounded-[24px] p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-gray-800">Your next payment of ₦150,000 is due on May 15, 2026</p>
            <p className="text-[13px] text-gray-500 font-medium">Subscription: Pro Plan (Monthly)</p>
          </div>
        </div>
        <Button className="bg-white hover:bg-gray-50 text-emerald-600 border border-emerald-100 font-bold rounded-lg px-6 h-11">
          Manage Subscription
        </Button>
      </div>
    </div>
  );
}
