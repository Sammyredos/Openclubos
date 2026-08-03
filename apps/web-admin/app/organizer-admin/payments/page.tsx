"use client";

import { useMemo, useState } from "react";
import {
  CreditCard,
  Download,
  Search,
  CheckCircle2,
  Clock,
  Ban,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  DollarSign
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";

// Mock Data
const MOCK_PAYMENTS = [
  { id: "TXN-1029", date: "2026-08-01T10:30:00Z", player: "James Wilson", tournament: "Summer Classic 2026", amount: 150.00, method: "Credit Card", status: "PAID" },
  { id: "TXN-1028", date: "2026-08-01T09:15:00Z", player: "Sarah Connor", tournament: "Summer Classic 2026", amount: 150.00, method: "Bank Transfer", status: "PENDING" },
  { id: "TXN-1027", date: "2026-07-30T14:20:00Z", player: "Michael Scott", tournament: "Members Invitational", amount: 200.00, method: "Credit Card", status: "PAID" },
  { id: "TXN-1026", date: "2026-07-29T11:45:00Z", player: "Dwight Schrute", tournament: "Members Invitational", amount: 200.00, method: "Credit Card", status: "REFUNDED" },
  { id: "TXN-1025", date: "2026-07-28T16:10:00Z", player: "Jim Halpert", tournament: "Summer Classic 2026", amount: 150.00, method: "Credit Card", status: "PAID" },
  { id: "TXN-1024", date: "2026-07-27T08:30:00Z", player: "Pam Beesly", tournament: "Summer Classic 2026", amount: 150.00, method: "Credit Card", status: "PAID" },
  { id: "TXN-1023", date: "2026-07-26T13:20:00Z", player: "Ryan Howard", tournament: "Members Invitational", amount: 200.00, method: "Bank Transfer", status: "PENDING" },
  { id: "TXN-1022", date: "2026-07-25T15:40:00Z", player: "Kelly Kapoor", tournament: "Members Invitational", amount: 200.00, method: "Credit Card", status: "PAID" },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
}

function StatusPill({ status }: { status: string }) {
  const meta = (() => {
    switch (status) {
      case "PAID":
        return { label: "Paid", className: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: CheckCircle2, dot: "bg-openclub-700" };
      case "PENDING":
        return { label: "Pending", className: "bg-orange-50 text-orange-700 border-orange-100", icon: Clock, dot: "bg-orange-500" };
      case "REFUNDED":
        return { label: "Refunded", className: "bg-gray-100 text-gray-700 border-gray-200", icon: Ban, dot: "bg-gray-500" };
      default:
        return { label: status, className: "bg-gray-100 text-gray-700 border-gray-200", icon: CheckCircle2, dot: "bg-gray-500" };
    }
  })();
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase whitespace-nowrap", meta.className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filteredData = useMemo(() => {
    return MOCK_PAYMENTS.filter(txn => {
      if (statusFilter !== "ALL" && txn.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!txn.player.toLowerCase().includes(q) && !txn.id.toLowerCase().includes(q) && !txn.tournament.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [search, statusFilter]);

  const totalRevenue = MOCK_PAYMENTS.filter(t => t.status === "PAID").reduce((sum, t) => sum + t.amount, 0);
  const pendingAmount = MOCK_PAYMENTS.filter(t => t.status === "PENDING").reduce((sum, t) => sum + t.amount, 0);
  const refundsAmount = MOCK_PAYMENTS.filter(t => t.status === "REFUNDED").reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-8 w-full max-w-full px-2 pb-10 font-sans">
      <div className="w-full bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-x-auto">
        <div className="flex items-center justify-between p-8 min-w-max gap-12 font-sans">
          
          <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
            <div className="flex justify-start items-center gap-3.5">
              <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Total Revenue</div>
            </div>
            <div className="text-[#15803D] text-3xl font-bold">{formatCurrency(totalRevenue)}</div>
            <div className="text-zinc-500 text-sm font-normal">All Time</div>
          </div>

          <div className="w-px h-16 bg-slate-200" />

          <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
            <div className="flex justify-start items-center gap-3.5">
              <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Pending Payments</div>
            </div>
            <div className="text-[#15803D] text-3xl font-bold">{formatCurrency(pendingAmount)}</div>
            <div className="text-zinc-500 text-sm font-normal">Awaiting Transfer</div>
          </div>

          <div className="w-px h-16 bg-slate-200" />

          <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
            <div className="flex justify-start items-center gap-3.5">
              <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Refunds Issued</div>
            </div>
            <div className="text-[#15803D] text-3xl font-bold">{formatCurrency(refundsAmount)}</div>
            <div className="text-zinc-500 text-sm font-normal">All Time</div>
          </div>

        </div>
      </div>

      <div className="w-full space-y-6">
        <Card className="border-none shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
            <CardTitle className="text-zinc-700 text-xl font-medium whitespace-nowrap">All Payments</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" className="h-10 border-[#e1efe5] text-gray-600 gap-2 rounded-lg px-4 text-[14px] font-normal">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="px-6 pb-6 flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#15803D]" />
                <Input
                  placeholder="Search player, tournament, or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-11 rounded-lg text-[14px] border-[#e1efe5] bg-[#f5faf6] text-[#15803D] focus:bg-[#e1efe5] placeholder:text-[#15803D]/60"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <SearchableSelect
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  options={[
                    { value: "ALL", label: "All Statuses" },
                    { value: "PAID", label: "Paid" },
                    { value: "PENDING", label: "Pending" },
                    { value: "REFUNDED", label: "Refunded" },
                  ]}
                  className="min-w-[140px]"
                  triggerClassName="h-11 bg-[#f5faf6] border-[#e1efe5] text-[#15803D] font-medium"
                />
              </div>
            </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f5faf6] border-b border-[#e1efe5]">
                <tr>
                  <th className="px-6 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Transaction ID</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Player</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Tournament</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e1efe5] bg-white">
                {filteredData.slice((page - 1) * perPage, page * perPage).map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-[13px] font-medium text-gray-900">{txn.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[14px] text-gray-600">{formatDate(txn.date)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[14px] font-medium text-gray-900">{txn.player}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[14px] text-gray-600">{txn.tournament}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[14px] text-gray-600">{txn.method}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[14px] font-medium text-gray-900">{formatCurrency(txn.amount)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill status={txn.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="h-8 text-[#15803D] hover:text-[#15803D] hover:bg-[#e1efe5] text-[13px]">
                        <FileText className="w-4 h-4 mr-2" />
                        Receipt
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <CreditCard className="w-12 h-12 mb-4 text-gray-300" />
                        <p className="text-base font-medium text-gray-900">No transactions found</p>
                        <p className="text-sm mt-1">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {filteredData.length > 0 && (
            <div className="px-6 py-4 border-t border-[#e1efe5] bg-gray-50 flex items-center justify-between">
              <span className="text-[13px] text-gray-500 font-medium">
                Showing {Math.min((page - 1) * perPage + 1, filteredData.length)} to {Math.min(page * perPage, filteredData.length)} of {filteredData.length} entries
              </span>
              <Pagination
                currentPage={page}
                totalPages={Math.ceil(filteredData.length / perPage)}
                onPageChange={setPage}
              />
            </div>
          )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
