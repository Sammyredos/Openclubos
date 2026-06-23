"use client";

import React, { useState, useMemo } from "react";
import {
  CreditCard,
  Users,
  Search,
  Download,
  Plus,
  MoreVertical,
  Wallet,
  Banknote,
  AlertTriangle,
  CheckCircle2,
  FileText,
  FileSpreadsheet,
  TrendingUp,
} from "lucide-react";

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
    avatarColor: "bg-emerald-50 text-openclub-800",
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
    avatarColor: "bg-emerald-50 text-openclub-800",
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



export default function SubscriptionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [planFilter, setPlanFilter] = useState("All");
  const [billingFilter, setBillingFilter] = useState("All");
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

      const matchesStatus = statusFilter === "All" || sub.status === statusFilter;
      const matchesPlan = planFilter === "All" || sub.plan === planFilter;
      const matchesBilling = billingFilter === "All" || sub.billingCycle === billingFilter;

      return matchesSearch && matchesStatus && matchesPlan && matchesBilling;
    });
  }, [searchQuery, statusFilter, planFilter, billingFilter]);

  // Paginated display
  const paginatedSubscriptions = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredSubscriptions.slice(start, start + itemsPerPage);
  }, [filteredSubscriptions, page]);

  return (
    <div className="space-y-8 w-full max-w-full px-2 pb-10 font-sans">


      {/* Stats Section */}
      <div className="w-full bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-x-auto">
        <div className="flex items-center justify-between p-8 min-w-max gap-12 font-sans">

          {/* Stat 1: Total Active Subscriptions */}
          <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
            <div className="flex justify-start items-center gap-3.5">
              <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Active Subscriptions</div>
            </div>
            <div className="text-[#15803D] text-3xl font-bold">156</div>
            <div className="text-zinc-500 text-sm font-normal">All Time</div>
          </div>

          <div className="w-px h-16 bg-slate-200" />

          {/* Stat 2: Total Monthly Revenue */}
          <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
            <div className="flex justify-start items-center gap-3.5">
              <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Monthly Revenue</div>
              <div className="px-2 py-1 bg-blue-50 rounded-lg flex justify-center items-center gap-1 shrink-0 whitespace-nowrap">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                <div className="text-blue-600 text-xs font-medium">+8.3%</div>
              </div>
            </div>
            <div className="text-[#15803D] text-3xl font-bold">₦18,450</div>
            <div className="text-zinc-500 text-sm font-normal">This Month</div>
          </div>

          <div className="w-px h-16 bg-slate-200" />

          {/* Stat 3: Total Annual Revenue */}
          <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
            <div className="flex justify-start items-center gap-3.5">
              <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Annual Revenue</div>
              <div className="px-2 py-1 bg-purple-50 rounded-lg flex justify-center items-center gap-1 shrink-0 whitespace-nowrap">
                <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                <div className="text-purple-600 text-xs font-medium">+15.7%</div>
              </div>
            </div>
            <div className="text-[#15803D] text-3xl font-bold">₦184k</div>
            <div className="text-zinc-500 text-sm font-normal">This Year</div>
          </div>

          <div className="w-px h-16 bg-slate-200" />

          {/* Stat 4: Past Due */}
          <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
            <div className="flex justify-start items-center gap-3.5">
              <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Past Due</div>
              <div className="px-2 py-1 bg-red-50 rounded-lg flex justify-center items-center gap-1 shrink-0 whitespace-nowrap">
                <div className="text-red-500 text-[11px] font-medium">Action Required</div>
              </div>
            </div>
            <div className="text-red-500 text-3xl font-bold">7</div>
            <div className="text-zinc-500 text-sm font-normal">Overdue Accounts</div>
          </div>

        </div>
      </div>

      <Card className="border-none shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
          <CardTitle className="text-zinc-700 text-xl font-medium whitespace-nowrap">All Subscriptions</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={(e) => setExportAnchorEl(e.currentTarget)}
              className="h-10 border-[#e1efe5] text-gray-600 gap-2 rounded-lg px-4 text-[14px] font-normal"
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
                className="w-full text-left px-4 py-2 text-[12px] font-normal text-gray-700 hover:bg-background flex items-center gap-3"
              >
                <FileSpreadsheet className="w-4 h-4 text-openclub-800" />
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
                className="w-full text-left px-4 py-2 text-[12px] font-normal text-gray-700 hover:bg-background flex items-center gap-3"
              >
                <FileText className="w-4 h-4 text-rose-600" />
                Export PDF
              </button>
            </FloatingMenu>
            <Button className="h-10 bg-[#15803D] hover:bg-[#166534] border border-openclub-800/30 text-white gap-2 rounded-lg px-4 text-[14px] font-normal">
              <Plus className="w-4 h-4" /> Add Subscription
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">

          {/* Filters */}
          <div className="px-6 pb-6 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by organizer, email or plan..."
                className="pl-10 h-11 rounded-lg text-[14px] border-[#e1efe5]"
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
              triggerClassName="h-11 bg-[#f5faf6] border-[#e1efe5] text-[#15803D] font-medium"
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
              triggerClassName="h-11 bg-[#f5faf6] border-[#e1efe5] text-[#15803D] font-medium"
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
              triggerClassName="h-11 bg-[#f5faf6] border-[#e1efe5] text-[#15803D] font-medium"
              placeholder="All Cycles"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto relative">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f5faf6] border-b border-[#e1efe5] text-[11px] font-semibold text-[#15803D] uppercase tracking-wider">
                  <th className="px-6 py-4">Organizer Details</th>
                  <th className="px-6 py-4">Plan Information</th>
                  <th className="px-6 py-4">Billing Cycle</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Next Billing Date</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e1efe5]">
                {paginatedSubscriptions.length > 0 ? (
                  paginatedSubscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors group">

                      {/* Organizer Details */}
                      <td className="px-6 py-5">
                        <div className="inline-flex justify-start items-center gap-3.5 min-w-[250px]">
                          <div className={cn("size-10 rounded-full flex items-center justify-center text-[13px] font-medium shrink-0 group-hover:scale-105 transition-transform", sub.avatarColor)}>
                            {sub.initials}
                          </div>
                          <div className="inline-flex flex-col justify-start items-start min-w-0">
                            <div className="text-slate-900 text-[14px] font-medium whitespace-nowrap" title={sub.organizer}>
                              {sub.organizer}
                            </div>
                            <div className="text-gray-500 text-[12px] font-normal truncate max-w-[200px] mt-0.5" title={sub.email}>
                              {sub.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Plan Information */}
                      <td className="px-6 py-5">
                        <div className="flex flex-col min-w-0 gap-1.5">
                          <span
                            className={cn(
                              "text-[11px] font-medium px-2 py-0.5 rounded-md whitespace-nowrap inline-flex items-center gap-1.5 self-start",
                              sub.plan === "Professional" ? "bg-[#f5faf6] text-[#15803D] border border-[#e1efe5]" : sub.plan === "Standard" ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-gray-50 text-gray-600 border border-gray-200"
                            )}
                          >
                            <span className={cn("w-1.5 h-1.5 rounded-full", sub.plan === "Professional" ? "bg-[#15803D]" : sub.plan === "Standard" ? "bg-blue-500" : "bg-gray-500")} />
                            {sub.plan}
                          </span>
                          <span className="text-[12px] text-gray-500 font-normal mt-0.5 whitespace-nowrap">
                            {sub.planLimit}
                          </span>
                        </div>
                      </td>

                      {/* Billing Cycle */}
                      <td className="px-6 py-5">
                        <span className="text-[13px] text-gray-600 font-medium">{sub.billingCycle}</span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-5">
                        <span
                          className={cn(
                            "text-[11px] font-medium px-2.5 py-0.5 rounded-md whitespace-nowrap inline-flex items-center gap-1.5",
                            sub.status === "Active"
                              ? "bg-[#f5faf6] text-[#15803D] border border-[#e1efe5]"
                              : sub.status === "Past Due"
                                ? "bg-red-50 text-red-600 border border-red-200"
                                : sub.status === "Trialing"
                                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                                  : "bg-gray-100 text-gray-500 border border-gray-200"
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              sub.status === "Active" ? "bg-[#15803D]"
                                : sub.status === "Past Due" ? "bg-red-500"
                                  : sub.status === "Trialing" ? "bg-blue-500"
                                    : "bg-gray-400"
                            )}
                          />
                          {sub.status}
                        </span>
                      </td>

                      {/* Next Billing Date */}
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="text-[13px] text-gray-600 font-medium whitespace-nowrap">
                            {sub.nextBillingDate}
                          </span>
                          <span
                            className={cn(
                              "text-[11px] font-medium px-2 py-0.5 rounded border mt-0.5 whitespace-nowrap",
                              sub.status === "Past Due" ? "bg-red-50 text-red-600 border-red-100" : "bg-gray-50 text-gray-500 border-gray-100"
                            )}
                          >
                            {sub.nextBillingSub}
                          </span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-5 text-right">
                        <span className="text-[14px] font-medium text-slate-900 whitespace-nowrap">{sub.amount}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center">
                          <button className="h-7 px-2 inline-flex items-center justify-center rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center text-gray-500 font-normal text-[13px]">
                      No subscriptions found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-6 border-t border-gray-50 flex items-center justify-between">
            <p className="text-[13px] text-gray-500 font-normal">
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
  );
}
