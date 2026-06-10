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
  Wallet,
  Banknote,
  AlertTriangle,
  CheckCircle2,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
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
import { FloatingMenu } from "@/components/ui/floating-menu";
import { exportToCsv, exportToPdf } from "@/lib/export";
import { addDays, format } from "date-fns";

const today = new Date();
const generateMockDate = (days: number) => format(addDays(today, days), "dd MMM yyyy");
const getBillingSubText = (diff: number, status: string, cancelDate?: string) => {
  if (status === "Cancelled") return `Cancelled on ${cancelDate}`;
  if (diff < 0) return `${Math.abs(diff)} days overdue`;
  if (diff === 0) return "Today";
  if (diff === 1) return "In 1 day";
  return `In ${diff} days`;
};

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
    nextBillingDate: generateMockDate(20),
    nextBillingSub: getBillingSubText(20, "Active"),
    amount: "₦2,400.00 / year",
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
    nextBillingDate: generateMockDate(1),
    nextBillingSub: getBillingSubText(1, "Active"),
    amount: "₦99.00 / month",
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
    nextBillingDate: generateMockDate(-16),
    nextBillingSub: getBillingSubText(-16, "Past Due"),
    amount: "₦199.00 / month",
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
    nextBillingDate: generateMockDate(218),
    nextBillingSub: getBillingSubText(218, "Active"),
    amount: "₦600.00 / year",
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
    nextBillingDate: generateMockDate(10),
    nextBillingSub: getBillingSubText(10, "Trialing"),
    amount: "₦0.00 / month",
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
    nextBillingSub: getBillingSubText(0, "Cancelled", "12 Apr 2025"),
    amount: "₦0.00",
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
    nextBillingDate: generateMockDate(25),
    nextBillingSub: getBillingSubText(25, "Active"),
    amount: "₦49.00 / month",
  },
];

// Recharts Donut data
const OVERVIEW_DATA = [
  { name: "Active", value: 138, percentage: "88.5%", color: "#10b981" },
  { name: "Past Due", value: 7, percentage: "4.5%", color: "#f43f5e" },
  { name: "Trialing", value: 8, percentage: "5.1%", color: "#3b82f6" },
  { name: "Cancelled", value: 3, percentage: "1.9%", color: "#94a3b8" },
];

const REVENUE_DATA_OPTIONS = {
  "this-year": [
    { name: "Jan", revenue: 58000 },
    { name: "Feb", revenue: 95000 },
    { name: "Mar", revenue: 80000 },
    { name: "Apr", revenue: 110000 },
    { name: "May", revenue: 150000 },
    { name: "Jun", revenue: 184500 },
  ],
  "last-6-months": [
    { name: "Jan", revenue: 95000 },
    { name: "Feb", revenue: 80000 },
    { name: "Mar", revenue: 110000 },
    { name: "Apr", revenue: 150000 },
    { name: "May", revenue: 180000 },
    { name: "Jun", revenue: 184500 },
  ],
  "this-month": [
    { name: "Week 1", revenue: 40000 },
    { name: "Week 2", revenue: 48000 },
    { name: "Week 3", revenue: 65000 },
    { name: "Week 4", revenue: 79500 },
  ]
};

const REVENUE_TOTALS = {
  "this-year": "₦184,500.00",
  "last-6-months": "₦184,500.00",
  "this-month": "₦79,500.00",
};

const REVENUE_CHANGES = {
  "this-year": "15.7%",
  "last-6-months": "12.4%",
  "this-month": "8.3%",
};

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<"All" | "Active" | "Past Due" | "Cancelled" | "Trialing">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [planFilter, setPlanFilter] = useState("All");
  const [billingFilter, setBillingFilter] = useState("All");
  const [revenueFilter, setRevenueFilter] = useState<"this-year" | "last-6-months" | "this-month">("this-year");
  const [page, setPage] = useState(1);
  const [exportAnchorEl, setExportAnchorEl] = useState<HTMLElement | null>(null);
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
          value="₦18,450.00"
          change="+8.3%"
          changeType="increase"
          icon={Wallet}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Total Annual Revenue"
          value="₦184,500.00"
          change="+15.7%"
          changeType="increase"
          icon={Banknote}
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
              <CardTitle className="text-[16px] font-bold">All Subscriptions</CardTitle>
              <div className="flex flex-wrap items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={(e) => setExportAnchorEl(e.currentTarget)}
                  className="h-10 border-[#e7e7e7] text-gray-600 gap-2 rounded-lg px-4 text-[14px] font-bold"
                >
                  <Download className="w-4 h-4" /> Export
                </Button>
                <FloatingMenu
                  open={exportAnchorEl != null}
                  anchorEl={exportAnchorEl}
                  onClose={() => setExportAnchorEl(null)}
                  placement="bottom-end"
                  className="w-48 bg-white rounded-xl shadow-xl border border-[#efefef] py-2"
                >
                  <button
                    onClick={() => {
                      setExportAnchorEl(null);
                      exportToCsv(
                        filteredSubscriptions,
                        [
                          { header: "Organizer", key: "organizer" },
                          { header: "Email", key: "email" },
                          { header: "Plan", key: "plan" },
                          { header: "Limit", key: "planLimit" },
                          { header: "Billing Cycle", key: "billingCycle" },
                          { header: "Status", key: "status" },
                          { header: "Next Billing", key: "nextBillingDate" },
                          { header: "Amount", key: "amount" },
                        ],
                        "subscriptions-export.csv"
                      );
                    }}
                    className="w-full text-left px-4 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => {
                      setExportAnchorEl(null);
                      exportToPdf(
                        filteredSubscriptions,
                        [
                          { header: "Organizer", key: "organizer" },
                          { header: "Plan", key: "plan" },
                          { header: "Status", key: "status" },
                          { header: "Amount", key: "amount" },
                        ],
                        "subscriptions-export.pdf",
                        "Subscriptions Export"
                      );
                    }}
                    className="w-full text-left px-4 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <FileText className="w-4 h-4 text-rose-600" />
                    Export PDF
                  </button>
                </FloatingMenu>
                <Button className="h-10 bg-[#10b981] hover:bg-[#0da673] border border-emerald-600/30 text-white gap-2 rounded-lg px-4 text-[14px] font-bold">
                  <Plus className="w-4 h-4" /> Add Subscription
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">



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
                              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 group-hover:scale-105 transition-transform", sub.avatarColor)}>
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
              <CardTitle className="text-[16px] font-bold">Subscription Overview</CardTitle>
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
                  <p className="text-[16px] font-bold text-gray-800">156</p>
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
              <CardTitle className="text-[16px] font-bold">Revenue Overview</CardTitle>
              <select 
                value={revenueFilter}
                onChange={(e) => setRevenueFilter(e.target.value as "this-year" | "last-6-months" | "this-month")}
                className="text-[12px] font-bold text-gray-700 bg-white border border-[#e7e7e7] rounded-md px-2.5 py-1.5 pr-8 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_8px_center] outline-none cursor-pointer hover:bg-gray-50 focus:ring-1 focus:ring-emerald-500 transition-colors"
              >
                <option value="this-year">This Year</option>
                <option value="last-6-months">Last 6 Months</option>
                <option value="this-month">This Month</option>
              </select>
            </CardHeader>
            <CardContent className="p-3 space-y-4">
              <div className="flex items-baseline gap-2 px-1">
                <span className="text-[16px] font-bold text-gray-800">{REVENUE_TOTALS[revenueFilter]}</span>
                <div className="flex items-center text-emerald-500 text-[12px] font-medium">
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                  <span>{REVENUE_CHANGES[revenueFilter]}</span>
                  <span className="text-gray-400 text-[11px] ml-1 font-medium">from last year</span>
                </div>
              </div>

              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={REVENUE_DATA_OPTIONS[revenueFilter]} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `₦${v / 1000}k`}
                    />
                    <Tooltip
                      formatter={(v) => [`₦${v ? Number(v).toLocaleString() : "0"}`, "Revenue"]}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      dot={{ r: 3, fill: "#10b981" }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border border-[#e7e7e7] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-[16px] font-bold">Recent Activity</CardTitle>
              <Button
                variant="link"
                className="text-[#10b981] p-0 h-auto font-bold text-[12px] hover:no-underline"
              >
                View All
              </Button>
            </CardHeader>
            <CardContent className="space-y-6 p-3">

              {/* Activity 1 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
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
                <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
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
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
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
