"use client";

import React, { useState, useMemo } from "react";
import {
  CreditCard,
  Users,
  Search,
  Download,
  Plus,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, SearchableSelect } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

// Static Subscriptions Mock Data
const MOCK_SUBSCRIPTIONS = [
  {
    id: "sub-1",
    organizer: "Royal Greens Golf Club",
    email: "admin@royalgreens.com",
    avatarColor: "bg-emerald-50 text-emerald-600",
    initials: "RG",
    plan: "Professional",
    planLimit: "Up to 50 tournaments / year",
    billingCycle: "Annual",
    status: "Active",
    nextBillingDate: "15 Jun 2025",
    nextBillingSub: "In 20 days",
    amount: "$2,400.00 / year",
  },
  {
    id: "sub-2",
    organizer: "Pine Valley Golf Club",
    email: "info@pinevalley.com",
    avatarColor: "bg-blue-50 text-blue-600",
    initials: "PV",
    plan: "Standard",
    planLimit: "Up to 20 tournaments / year",
    billingCycle: "Monthly",
    status: "Active",
    nextBillingDate: "26 May 2025",
    nextBillingSub: "In 1 day",
    amount: "$99.00 / month",
  },
  {
    id: "sub-3",
    organizer: "Meadowbrook Golf Club",
    email: "contact@meadowbrook.com",
    avatarColor: "bg-purple-50 text-purple-600",
    initials: "MG",
    plan: "Professional",
    planLimit: "Up to 50 tournaments / year",
    billingCycle: "Monthly",
    status: "Past Due",
    nextBillingDate: "10 May 2025",
    nextBillingSub: "16 days overdue",
    amount: "$199.00 / month",
  },
  {
    id: "sub-4",
    organizer: "Lakeside Golf Resort",
    email: "hello@lakeside.com",
    avatarColor: "bg-emerald-50 text-emerald-600",
    initials: "LG",
    plan: "Basic",
    planLimit: "Up to 5 tournaments / year",
    billingCycle: "Annual",
    status: "Active",
    nextBillingDate: "30 Nov 2025",
    nextBillingSub: "In 218 days",
    amount: "$600.00 / year",
  },
  {
    id: "sub-5",
    organizer: "Birdie Hunters Club",
    email: "admin@birdiehunters.com",
    avatarColor: "bg-amber-50 text-amber-600",
    initials: "BH",
    plan: "Standard",
    planLimit: "Up to 20 tournaments / year",
    billingCycle: "Monthly",
    status: "Trialing",
    nextBillingDate: "05 Jun 2025",
    nextBillingSub: "In 10 days",
    amount: "$0.00 / month",
  },
  {
    id: "sub-6",
    organizer: "The Swingers Club",
    email: "info@theswingers.com",
    avatarColor: "bg-cyan-50 text-cyan-600",
    initials: "SG",
    plan: "Standard",
    planLimit: "Up to 20 tournaments / year",
    billingCycle: "Annual",
    status: "Cancelled",
    nextBillingDate: "—",
    nextBillingSub: "Cancelled on 12 Apr 2025",
    amount: "$0.00",
  },
  {
    id: "sub-7",
    organizer: "City Golf Club",
    email: "admin@citygolf.com",
    avatarColor: "bg-pink-50 text-pink-600",
    initials: "CG",
    plan: "Basic",
    planLimit: "Up to 5 tournaments / year",
    billingCycle: "Monthly",
    status: "Active",
    nextBillingDate: "20 Jun 2025",
    nextBillingSub: "In 25 days",
    amount: "$49.00 / month",
  },
];

// Recharts Donut data
const OVERVIEW_DATA = [
  { name: "Active", value: 138, percentage: "88.5%", color: "#10b981" },
  { name: "Past Due", value: 7, percentage: "4.5%", color: "#f43f5e" },
  { name: "Trialing", value: 8, percentage: "5.1%", color: "#3b82f6" },
  { name: "Cancelled", value: 3, percentage: "1.9%", color: "#94a3b8" },
];

// Recharts Line data
const REVENUE_DATA = [
  { name: "Jan", revenue: 58000 },
  { name: "Feb", revenue: 95000 },
  { name: "Mar", revenue: 80000 },
  { name: "Apr", revenue: 110000 },
  { name: "May", revenue: 150000 },
  { name: "Jun", revenue: 184500 },
];

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<"All" | "Active" | "Past Due" | "Cancelled" | "Trialing">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [planFilter, setPlanFilter] = useState("All");
  const [billingFilter, setBillingFilter] = useState("All");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Filter & Search Logic
  const filteredSubscriptions = useMemo(() => {
    return MOCK_SUBSCRIPTIONS.filter((sub) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        sub.organizer.toLowerCase().includes(q) ||
        sub.email.toLowerCase().includes(q) ||
        sub.plan.toLowerCase().includes(q);

      const matchesTab = activeTab === "All" || sub.status === activeTab;
      const matchesStatus = statusFilter === "All" || sub.status === statusFilter;
      const matchesPlan = planFilter === "All" || sub.plan === planFilter;
      const matchesBilling = billingFilter === "All" || sub.billingCycle === billingFilter;

      return matchesSearch && matchesTab && matchesStatus && matchesPlan && matchesBilling;
    });
  }, [searchQuery, activeTab, statusFilter, planFilter, billingFilter]);

  // Paginated display
  const paginatedSubscriptions = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredSubscriptions.slice(start, start + itemsPerPage);
  }, [filteredSubscriptions, page]);

  return (
    <div className="space-y-8 w-full max-w-full px-2 pb-10 font-sans">

      {/* Stat Cards — matches tournament page StatCard pattern */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Active Subscriptions"
          value="156"
          change="+12.5%"
          changeType="increase"
          icon={Users}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Total Monthly Revenue"
          value="$18,450.00"
          change="+8.3%"
          changeType="increase"
          icon={DollarSign}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Total Annual Revenue"
          value="$184,500.00"
          change="+15.7%"
          changeType="increase"
          icon={DollarSign}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Past Due Subscriptions"
          value="7"
          change="-2"
          changeType="decrease"
          icon={AlertTriangle}
          iconBg="bg-red-50"
          iconColor="text-red-500"
        />
      </div>

      {/* Main Grid Layout — matches tournament page xl:grid-cols-4 */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">

        {/* Main Content — Left 3 columns */}
        <div className="xl:col-span-3 space-y-6">
          <Card className="border border-[#e7e7e7] shadow-sm overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
              <CardTitle className="text-xl font-bold">All Subscriptions</CardTitle>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" className="h-10 border-[#e7e7e7] text-gray-600 gap-2 rounded-lg px-4 text-[14px] font-bold">
                  <Download className="w-4 h-4" /> Export
                </Button>
                <Button className="h-10 bg-[#10b981] hover:bg-[#0da673] border border-emerald-600/30 text-white gap-2 rounded-lg px-4 text-[14px] font-bold">
                  <Plus className="w-4 h-4" /> Add Subscription
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">

              {/* Filter Tabs */}
              <div className="px-6 pb-4 flex gap-6 border-b border-gray-50">
                {(["All", "Active", "Past Due", "Cancelled", "Trialing"] as const).map((tab) => {
                  const isActive = activeTab === tab;
                  const tabLabel = tab === "All" ? "All Subscriptions" : tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setPage(1);
                      }}
                      className={cn(
                        "pb-3 text-[13px] font-medium transition-all relative",
                        isActive
                          ? "text-emerald-600 border-b-2 border-emerald-500"
                          : "text-gray-400 hover:text-gray-900"
                      )}
                    >
                      {tabLabel}
                    </button>
                  );
                })}
              </div>

              {/* Filters — matches tournament page filter pattern */}
              <div className="px-6 py-6 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by organizer, email or plan..."
                    className="pl-10 h-11 bg-gray-50/50 border-[#e7e7e7] focus:bg-white rounded-lg"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <SearchableSelect
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v);
                    setPage(1);
                  }}
                  options={[
                    { value: "All", label: "Status: All" },
                    { value: "Active", label: "Active" },
                    { value: "Past Due", label: "Past Due" },
                    { value: "Trialing", label: "Trialing" },
                    { value: "Cancelled", label: "Cancelled" },
                  ]}
                  className="min-w-[160px]"
                  triggerClassName="h-11 bg-white font-medium"
                  placeholder="All Status"
                />
                <SearchableSelect
                  value={planFilter}
                  onValueChange={(v) => {
                    setPlanFilter(v);
                    setPage(1);
                  }}
                  options={[
                    { value: "All", label: "Plan: All" },
                    { value: "Basic", label: "Basic" },
                    { value: "Standard", label: "Standard" },
                    { value: "Professional", label: "Professional" },
                  ]}
                  className="min-w-[160px]"
                  triggerClassName="h-11 bg-white font-medium"
                  placeholder="All Plans"
                />
                <SearchableSelect
                  value={billingFilter}
                  onValueChange={(v) => {
                    setBillingFilter(v);
                    setPage(1);
                  }}
                  options={[
                    { value: "All", label: "Billing Cycle: All" },
                    { value: "Monthly", label: "Monthly" },
                    { value: "Annual", label: "Annual" },
                  ]}
                  className="min-w-[160px]"
                  triggerClassName="h-11 bg-white font-medium"
                  placeholder="All Cycles"
                />
              </div>

              {/* Table — matches tournament page table pattern */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-4 py-4">Organizer</th>
                      <th className="px-4 py-4">Plan</th>
                      <th className="px-4 py-4">Billing Cycle</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Next Billing Date</th>
                      <th className="px-4 py-4 text-right">Amount</th>
                      <th className="px-4 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedSubscriptions.length > 0 ? (
                      paginatedSubscriptions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors group">

                          {/* Organizer/User */}
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3 min-w-[220px]">
                              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-bold shrink-0 group-hover:scale-105 transition-transform", sub.avatarColor)}>
                                {sub.initials}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[14px] font-bold text-gray-900 truncate leading-tight" title={sub.organizer}>
                                  {sub.organizer}
                                </span>
                                <span className="text-[12px] text-gray-400 font-medium truncate mt-0.5" title={sub.email}>
                                  {sub.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Plan */}
                          <td className="px-4 py-4">
                            <div className="flex flex-col min-w-0">
                              <span className="text-[13px] text-gray-700 font-medium truncate leading-tight">{sub.plan}</span>
                              <span className="text-[10px] text-gray-400 font-medium mt-0.5">{sub.planLimit}</span>
                            </div>
                          </td>

                          {/* Billing Cycle */}
                          <td className="px-4 py-4">
                            <span className="text-[13px] text-gray-700 font-medium">{sub.billingCycle}</span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4">
                            <span
                              className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap uppercase inline-flex items-center gap-1.5",
                                sub.status === "Active" && "bg-emerald-50 text-emerald-600",
                                sub.status === "Past Due" && "bg-red-50 text-red-500",
                                sub.status === "Trialing" && "bg-blue-50 text-blue-600",
                                sub.status === "Cancelled" && "bg-gray-100 text-gray-500"
                              )}
                            >
                              <span
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  sub.status === "Active" && "bg-emerald-500",
                                  sub.status === "Past Due" && "bg-red-500",
                                  sub.status === "Trialing" && "bg-blue-500",
                                  sub.status === "Cancelled" && "bg-gray-400"
                                )}
                              />
                              {sub.status}
                            </span>
                          </td>

                          {/* Next Billing Date */}
                          <td className="px-4 py-4">
                            <div className="flex flex-col min-w-0">
                              <span className="text-[13px] text-gray-700 font-medium leading-tight">{sub.nextBillingDate}</span>
                              <span
                                className={cn(
                                  "text-[10px] font-medium mt-0.5",
                                  sub.status === "Past Due" ? "text-red-500" : "text-gray-400"
                                )}
                              >
                                {sub.nextBillingSub}
                              </span>
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="px-4 py-4 text-right">
                            <span className="text-[14px] font-bold text-gray-900 whitespace-nowrap">{sub.amount}</span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center">
                              <button className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-[#e7e7e7] bg-white text-gray-500 hover:bg-gray-50 transition-colors">
                                <MoreVertical className="w-4.5 h-4.5" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-20 text-center text-gray-400 font-bold text-[13px]">
                          No subscriptions matching your selection.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination — matches tournament page pagination pattern */}
              <div className="px-6 py-6 border-t border-gray-50 flex items-center justify-between">
                <p className="text-[13px] text-gray-500">
                  Showing {(page - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(page * itemsPerPage, filteredSubscriptions.length)} of{" "}
                  {filteredSubscriptions.length} subscriptions
                </p>
                <Pagination
                  currentPage={page}
                  totalPages={Math.max(1, Math.ceil(filteredSubscriptions.length / itemsPerPage))}
                  onPageChange={(p) => setPage(p)}
                />
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar — matches tournament page sidebar pattern */}
        <div className="space-y-8">

          {/* Subscription Overview — Donut Chart */}
          <Card className="border border-[#e7e7e7] shadow-sm">
            <CardHeader className="pb-0">
              <CardTitle className="text-xl font-bold">Subscription Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="h-[240px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={OVERVIEW_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {OVERVIEW_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[13px] text-gray-400 font-medium">Total</p>
                  <p className="text-2xl font-bold text-gray-800">156</p>
                </div>
              </div>

              <div className="w-full space-y-3 mt-4">
                {OVERVIEW_DATA.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-[13px]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-500 font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-gray-800">
                      {item.value} ({item.percentage})
                    </span>
                  </div>
                ))}
              </div>

              <Button variant="link" className="w-full mt-6 text-[#10b981] font-bold no-underline hover:no-underline hover:font-extrabold transition-all duration-200 flex items-center justify-center gap-2">
                View Full Analytics <ArrowUpRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Revenue Overview — Line Chart */}
          <Card className="border border-[#e7e7e7] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-xl font-bold">Revenue Overview</CardTitle>
              <span className="text-[11px] font-bold text-gray-400 uppercase">This Year</span>
            </CardHeader>
            <CardContent className="p-3 space-y-4">
              <div className="flex items-baseline gap-2 px-1">
                <span className="text-2xl font-bold text-gray-800">$184,500.00</span>
                <div className="flex items-center text-emerald-500 text-[12px] font-medium">
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                  <span>15.7%</span>
                  <span className="text-gray-400 text-[11px] ml-1 font-medium">from last year</span>
                </div>
              </div>

              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={REVENUE_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${v / 1000}k`}
                    />
                    <Tooltip
                      formatter={(v) => [`$${v ? Number(v).toLocaleString() : "0"}`, "Revenue"]}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#10b981" }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border border-[#e7e7e7] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
              <Button
                variant="link"
                className="text-[#10b981] p-0 h-auto font-bold text-sm hover:no-underline"
              >
                View All
              </Button>
            </CardHeader>
            <CardContent className="space-y-6 p-3">

              {/* Activity 1 */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-bold text-gray-900 truncate">Royal Greens Golf Club</span>
                    <span className="text-[11px] text-gray-400 font-medium shrink-0">2 hours ago</span>
                  </div>
                  <p className="text-[12px] text-gray-400 font-medium mt-0.5">
                    Subscription renewed (Professional Annual)
                  </p>
                </div>
              </div>

              {/* Activity 2 */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-bold text-gray-900 truncate">Meadowbrook Golf Club</span>
                    <span className="text-[11px] text-gray-400 font-medium shrink-0">1 day ago</span>
                  </div>
                  <p className="text-[12px] text-red-500 font-medium mt-0.5">
                    Payment failed
                  </p>
                </div>
              </div>

              {/* Activity 3 */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <ArrowUpRight className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-bold text-gray-900 truncate">Pine Valley Golf Club</span>
                    <span className="text-[11px] text-gray-400 font-medium shrink-0">3 days ago</span>
                  </div>
                  <p className="text-[12px] text-gray-400 font-medium mt-0.5">
                    Upgraded to Professional plan
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
