"use client";

import { useMemo, useState, useEffect } from "react";
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
  DollarSign,
  Settings
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { getRegistrations, type RegistrationListItem } from "@/lib/api/registrations";
import { useAuth } from "@/lib/auth/AuthContext";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<RegistrationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedTxn, setSelectedTxn] = useState<RegistrationListItem | null>(null);
  const perPage = 10;

  useEffect(() => {
    async function loadData() {
      if (!user?.clubId) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await getRegistrations({ clubId: user.clubId, take: 50 });
        setRegistrations(data.items);
      } catch (err: any) {
        toast.error("Failed to load payments");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user?.clubId]);

  const filteredData = useMemo(() => {
    return registrations.filter(txn => {
      if (statusFilter !== "ALL" && txn.paymentStatus !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const playerName = `${txn.user?.firstName} ${txn.user?.lastName}`.toLowerCase();
        const tourneyName = txn.tournament?.name?.toLowerCase() || "";
        if (!playerName.includes(q) && !txn.id.toLowerCase().includes(q) && !tourneyName.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [search, statusFilter, registrations]);

  const totalRevenue = registrations.filter(t => t.paymentStatus === "PAID").reduce((sum, t) => sum + (t.tournament?.entryFee || 0), 0);
  const pendingAmount = registrations.filter(t => t.paymentStatus === "UNPAID").reduce((sum, t) => sum + (t.tournament?.entryFee || 0), 0);
  const refundsAmount = registrations.filter(t => t.paymentStatus === "REFUNDED").reduce((sum, t) => sum + (t.tournament?.entryFee || 0), 0);
  const totalTransactions = registrations.length;

  return (
    <div className="space-y-8 w-full max-w-full px-2 pb-10 font-sans">
      <div className="w-full bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-x-auto">
        <div className="flex items-center justify-between p-8 min-w-max gap-12 font-sans">
          
          <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
            <div className="flex justify-start items-center gap-3.5">
              <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Total Transactions</div>
              <div className="px-2 py-1 bg-green-50 rounded-lg flex justify-center items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#15803D]">
                  <path d="M0 6.94583L1.17875 8.125L5.00167 4.23375L8.82125 8.125L10 6.94583L5.00167 1.875L0 6.94583Z" fill="currentColor" />
                </svg>
                <div className="text-[#15803D] text-xs font-medium">0.0%</div>
              </div>
            </div>
            <div className="text-[#15803D] text-3xl font-semibold">{formatNumber(totalTransactions)}</div>
            <div className="text-zinc-500 text-sm font-normal">All Time</div>
          </div>

          <div className="w-px h-16 bg-slate-200" />
          
          <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
            <div className="flex justify-start items-center gap-3.5">
              <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Total Revenue</div>
              <div className="px-2 py-1 bg-green-50 rounded-lg flex justify-center items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#15803D]">
                  <path d="M0 6.94583L1.17875 8.125L5.00167 4.23375L8.82125 8.125L10 6.94583L5.00167 1.875L0 6.94583Z" fill="currentColor" />
                </svg>
                <div className="text-[#15803D] text-xs font-medium">0.0%</div>
              </div>
            </div>
            <div className="text-[#15803D] text-3xl font-semibold">{formatCurrency(totalRevenue)}</div>
            <div className="text-zinc-500 text-sm font-normal">All Time</div>
          </div>

          <div className="w-px h-16 bg-slate-200" />

          <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
            <div className="flex justify-start items-center gap-3.5">
              <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Pending Payments</div>
            </div>
            <div className="text-[#15803D] text-3xl font-semibold">{formatCurrency(pendingAmount)}</div>
            <div className="text-zinc-500 text-sm font-normal">Action Required</div>
          </div>

          <div className="w-px h-16 bg-slate-200" />

          <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
            <div className="flex justify-start items-center gap-3.5">
              <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Refunds</div>
            </div>
            <div className="text-[#15803D] text-3xl font-bold">{formatCurrency(refundsAmount)}</div>
            <div className="text-zinc-500 text-sm font-normal">All Time</div>
          </div>

        </div>
      </div>

      <div className="w-full space-y-6">
        <Card className="border-none shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
            <CardTitle className="text-zinc-700 text-xl font-medium whitespace-nowrap">Transaction History</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" className="h-10 text-gray-600 gap-2 rounded-lg px-4 text-[14px] font-medium">
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="px-6 pb-6 flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#15803D]" />
                <Input
                  placeholder="Search player, tournament, or TXN ID..."
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
                    { value: "UNPAID", label: "Unpaid" },
                    { value: "REFUNDED", label: "Refunded" },
                  ]}
                  className="min-w-[160px]"
                  triggerClassName="h-11 bg-[#f5faf6] border-[#e1efe5] text-[#15803D] font-medium"
                />
              </div>
            </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f5faf6] border-y border-[#e1efe5]">
                <tr>
                  <th className="px-6 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Transaction</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Player</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Tournament</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e1efe5] bg-white">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`sk-${i}`} className="border-b border-[#e1efe5]">
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16 mt-2" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                      <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-24 ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredData.slice((page - 1) * perPage, page * perPage).map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-medium text-gray-900 group-hover:text-[#15803D] transition-colors">{txn.id.substring(0, 8).toUpperCase()}</span>
                        <span className="text-[12px] text-gray-500">Credit Card</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-gray-900">{txn.user?.firstName} {txn.user?.lastName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] text-gray-600 font-medium">{txn.tournament?.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] text-gray-900 font-medium">{formatCurrency(txn.tournament?.entryFee || 0)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-[13px] text-gray-600">
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        {formatDate(txn.registeredAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill status={txn.paymentStatus} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setSelectedTxn(txn)} className="h-8 pl-3 pr-3 inline-flex items-center justify-center gap-1.5 rounded-md bg-[#15803D] text-white hover:bg-openclub-800 transition-colors border border-[#15803D] shadow-sm ml-auto">
                        <FileText className="w-3.5 h-3.5" />
                        <span className="text-[12px] font-medium leading-none whitespace-nowrap">View Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
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
      
      <Modal isOpen={!!selectedTxn} onClose={() => setSelectedTxn(null)} title="Transaction Receipt" size="md">
        {selectedTxn && (
          <div className="p-4 space-y-5 text-sm text-gray-800 font-sans">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-[#15803D]/10 text-[#15803D] rounded-full flex items-center justify-center mb-3">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900">{formatCurrency(selectedTxn.tournament?.entryFee || 0)}</h3>
              <p className="text-gray-500 font-normal uppercase tracking-wider text-[11px] mt-1">
                {selectedTxn.paymentStatus === 'PAID' ? 'Payment Successful' : selectedTxn.paymentStatus}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-md p-4 space-y-3 border border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-[13px]">Transaction ID</span>
                <span className="font-medium text-gray-900 text-[13px]">{selectedTxn.id.substring(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-[13px]">Date</span>
                <span className="font-medium text-gray-900 text-[13px]">{formatDate(selectedTxn.registeredAt)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-[13px]">Player</span>
                <span className="font-medium text-gray-900 text-[13px]">{selectedTxn.user?.firstName} {selectedTxn.user?.lastName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-[13px]">Tournament</span>
                <span className="font-medium text-gray-900 text-[13px]">{selectedTxn.tournament?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-[13px]">Method</span>
                <span className="font-medium text-gray-900 text-[13px]">Credit Card</span>
              </div>
            </div>
            
            <div className="pt-2">
               <Button onClick={() => setSelectedTxn(null)} className="w-full bg-[#15803D] hover:bg-[#166534] text-white rounded-md font-medium h-10">
                 Done
               </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
