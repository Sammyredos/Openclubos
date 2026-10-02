"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Download,
  Search,
  CheckCircle2,
  Clock,
  Ban,
  FileText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  SlidersHorizontal,
  Banknote,
  Landmark,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Send,
  Building2,
  Eye,
  CheckCircle,
  XCircle,
  Wallet,
  FileSpreadsheet,
  Receipt,
  Printer,
  RefreshCw,
  Loader2,
  AlertCircle,
  Copy
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { cn, formatCurrency, formatNumber, toTitleCase, broadcastAdminEvent, subscribeAdminEvents } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { getRegistrations, getRegistrationStats, type RegistrationListItem } from "@/lib/api/registrations";
import {
  getAllWithdrawals,
  getAdminWithdrawalStats,
  approveWithdrawal,
  rejectWithdrawal,
  type WithdrawalRequestItem,
  type AdminWithdrawalStats,
  type WithdrawalStatus
} from "@/lib/api/withdrawals";
import { BankLogo } from "@/components/ui/bank-logo";
import { FloatingMenu } from "@/components/ui/floating-menu";
import { useAuth } from "@/lib/auth/AuthContext";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { exportToCsv, exportToPdf } from "@/lib/export";

function TrendBadge({ value = 0 }: { value?: number }) {
  const isPositive = value >= 0;
  const colorClass = isPositive ? "text-[#15803D]" : "text-[#DC2626]";
  const bgClass = isPositive ? "bg-green-50" : "bg-red-50";
  return (
    <div className={`px-2 py-1 ${bgClass} rounded-lg flex justify-center items-center gap-1.5`}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className={colorClass}>
        {isPositive ? (
          <path d="M0 6.94583L1.17875 8.125L5.00167 4.23375L8.82125 8.125L10 6.94583L5.00167 1.875L0 6.94583Z" fill="currentColor" />
        ) : (
          <path d="M10 3.05417L8.82125 1.875L5.00167 5.76625L1.17875 1.875L0 3.05417L5.00167 8.125L10 3.05417Z" fill="currentColor" />
        )}
      </svg>
      <div className={`${colorClass} text-xs font-medium`}>{Math.abs(value)}%</div>
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
}

function formatRequestedDateTime(iso: string) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return { dateStr: "—", timeStr: "" };
    const dateStr = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
    const timeStr = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).format(d);
    return { dateStr, timeStr };
  } catch {
    return { dateStr: iso, timeStr: "" };
  }
}

function formatPaymentMethod(reference?: string | null) {
  if (!reference) return "Credit Card";
  if (reference.startsWith("CASH")) return "Cash";
  if (reference.startsWith("BANK_TRANSFER") || reference.startsWith("TRANSFER")) return "Bank Transfer";
  return "Credit Card";
}

function StatusPill({ status }: { status: string }) {
  const meta = (() => {
    switch (status) {
      case "PAID":
      case "COMPLETED":
      case "APPROVED":
        return { label: status === "COMPLETED" ? "Paid Out" : status === "APPROVED" ? "Approved" : "Paid", className: "bg-emerald-50 text-[#15803D] border-[#C6F0DB]", icon: CheckCircle2, dot: "bg-[#15803D]" };
      case "PENDING":
      case "PROCESSING":
      case "UNPAID":
        return { label: status === "PROCESSING" ? "Processing" : "Pending", className: "bg-orange-50 text-orange-700 border-orange-200", icon: Clock, dot: "bg-orange-500" };
      case "FAILED":
      case "REJECTED":
        return { label: status === "REJECTED" ? "Rejected" : "Failed", className: "bg-red-50 text-red-700 border-red-200", icon: Ban, dot: "bg-red-500" };
      case "REFUNDED":
        return { label: "Refunded", className: "bg-gray-100 text-gray-700 border-gray-200", icon: Ban, dot: "bg-gray-400" };
      default:
        return { label: status, className: "bg-gray-100 text-gray-700 border-gray-200", icon: CheckCircle2, dot: "bg-gray-400" };
    }
  })();

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase whitespace-nowrap", meta.className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

interface SuperAdminPaymentsViewProps {
  initialTab?: "withdrawals" | "transactions";
}

export function SuperAdminPaymentsView({ initialTab = "withdrawals" }: SuperAdminPaymentsViewProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"withdrawals" | "transactions">(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Registration data
  const [registrations, setRegistrations] = useState<RegistrationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [page, setPage] = useState(1);
  const [selectedTxn, setSelectedTxn] = useState<RegistrationListItem | null>(null);
  const [stats, setStats] = useState({ totalTransactions: 0, totalRevenue: 0, pendingAmount: 0, refundsAmount: 0, transactionsChange: 0, revenueChange: 0 });
  const perPage = 10;

  // Withdrawal Queue Data
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequestItem[]>([]);
  const [withdrawalStats, setWithdrawalStats] = useState<AdminWithdrawalStats | null>(null);
  const [withdrawalPage, setWithdrawalPage] = useState(1);
  const [withdrawalStatusTab, setWithdrawalStatusTab] = useState<"ALL" | "PENDING" | "SUCCESSFUL" | "REJECTED">("ALL");
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState("All Status");
  const [organizerFilter, setOrganizerFilter] = useState("All Organizers");
  const withdrawalPerPage = 10;

  // Export dropdown
  const [exportAnchorEl, setExportAnchorEl] = useState<HTMLElement | null>(null);

  // Action Modals
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequestItem | null>(null);
  const [approvingWithdrawal, setApprovingWithdrawal] = useState<WithdrawalRequestItem | null>(null);
  const [rejectingWithdrawal, setRejectingWithdrawal] = useState<WithdrawalRequestItem | null>(null);
  const [payoutReference, setPayoutReference] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const uniqueOrganizers = useMemo(() => {
    const clubMap = new Map<string, string>();
    withdrawals.forEach((w) => {
      if (w.club?.name) {
        clubMap.set(w.club.name, w.club.name);
      }
    });
    registrations.forEach((r) => {
      if (r.tournament?.club?.name) {
        clubMap.set(r.tournament.club.name, r.tournament.club.name);
      }
    });
    const list = Array.from(clubMap.keys()).sort();
    return ["All Organizers", ...list];
  }, [withdrawals, registrations]);

  const loadData = async () => {
    try {
      const [regData, statsData, allWithdrawalsData, wStats] = await Promise.all([
        getRegistrations({ take: 1000, orderBy: 'updatedAt' }).catch(() => ({ total: 0, items: [] })),
        getRegistrationStats().catch(() => ({ totalTransactions: 0, totalRevenue: 0, pendingAmount: 0, refundsAmount: 0, transactionsChange: 0, revenueChange: 0 })),
        getAllWithdrawals().catch(() => ({ total: 0, items: [] })),
        getAdminWithdrawalStats().catch(() => null),
      ]);
      setRegistrations(regData.items);
      setStats(statsData);
      setWithdrawals(allWithdrawalsData.items || []);
      if (wStats) setWithdrawalStats(wStats);
    } catch (err: any) {
      toast.error("Failed to load platform financial data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeAdminEvents((event) => {
      if (
        event.type === "payment-received" ||
        event.type === "withdrawal-approved" ||
        event.type === "withdrawal-rejected" ||
        event.type === "withdrawal-updated" ||
        event.type === "withdrawal-requested"
      ) {
        loadData();
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleApprove = async () => {
    if (!approvingWithdrawal || isProcessingAction) return;

    // Check organizer admin balance before confirmation
    const lockedFunds = approvingWithdrawal.wallet?.lockedBalance ?? 0;
    if (approvingWithdrawal.wallet && lockedFunds < approvingWithdrawal.amount) {
      toast.error("INSUFFICIENT ORGANIZER BALANCE", {
        description: `The organizer wallet has ${formatCurrency(lockedFunds)} locked in escrow, which is less than the requested payout of ${formatCurrency(approvingWithdrawal.amount)}. Confirmation is blocked.`,
      });
      return;
    }

    setIsProcessingAction(true);
    try {
      await approveWithdrawal(approvingWithdrawal.id, {
        reference: payoutReference.trim() || undefined,
        notes: payoutNotes.trim() || undefined,
      });
      broadcastAdminEvent("withdrawal-approved", { withdrawalId: approvingWithdrawal.id });
      broadcastAdminEvent("withdrawal-updated", { withdrawalId: approvingWithdrawal.id });
      toast.success(`Withdrawal of ${formatCurrency(approvingWithdrawal.amount)} approved and marked as paid!`);
      setApprovingWithdrawal(null);
      setPayoutReference("");
      setPayoutNotes("");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve withdrawal");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingWithdrawal || isProcessingAction) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }
    setIsProcessingAction(true);
    try {
      await rejectWithdrawal(rejectingWithdrawal.id, {
        reason: rejectionReason.trim(),
      });
      broadcastAdminEvent("withdrawal-rejected", { withdrawalId: rejectingWithdrawal.id });
      broadcastAdminEvent("withdrawal-updated", { withdrawalId: rejectingWithdrawal.id });
      toast.success("Withdrawal request rejected. Funds have been returned to the organizer wallet.");
      setRejectingWithdrawal(null);
      setRejectionReason("");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject withdrawal");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((txn) => {
      if (organizerFilter !== "All Organizers") {
        if (txn.tournament?.club?.name !== organizerFilter) return false;
      }
      if (statusFilter !== "All Status") {
        const mappedStatus =
          statusFilter === "Paid"
            ? "PAID"
            : statusFilter === "Pending"
            ? "UNPAID"
            : statusFilter === "Refunded"
            ? "REFUNDED"
            : statusFilter;
        if (txn.paymentStatus !== mappedStatus) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const playerName = `${txn.user?.firstName} ${txn.user?.lastName}`.toLowerCase();
        const clubName = txn.tournament?.club?.name?.toLowerCase() || "";
        if (!playerName.includes(q) && !clubName.includes(q) && !txn.id.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [debouncedSearch, statusFilter, organizerFilter, registrations]);

  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter((req) => {
      if (organizerFilter !== "All Organizers") {
        if (req.club?.name !== organizerFilter) return false;
      }
      if (withdrawalStatusTab === "PENDING") {
        if (req.status !== "PENDING" && (req.status as string) !== "PROCESSING") return false;
      } else if (withdrawalStatusTab === "SUCCESSFUL") {
        if (req.status !== "COMPLETED" && req.status !== "APPROVED" && (req.status as string) !== "PAID" && req.status !== "PROCESSED") return false;
      } else if (withdrawalStatusTab === "REJECTED") {
        if (req.status !== "REJECTED" && (req.status as string) !== "FAILED") return false;
      } else if (withdrawalStatusFilter !== "All Status") {
        const mapped =
          withdrawalStatusFilter === "Pending Review"
            ? "PENDING"
            : withdrawalStatusFilter === "Paid Out"
            ? "COMPLETED"
            : withdrawalStatusFilter === "Rejected"
            ? "REJECTED"
            : withdrawalStatusFilter;
        if (req.status !== mapped) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const matchesClub = req.club?.name?.toLowerCase().includes(q) || false;
        const matchesBank =
          req.bankName.toLowerCase().includes(q) ||
          req.accountName.toLowerCase().includes(q);
        const matchesAcc = req.accountNumber.includes(q);
        const matchesRequester =
          req.requestedBy?.firstName?.toLowerCase().includes(q) ||
          req.requestedBy?.lastName?.toLowerCase().includes(q) ||
          false;
        if (!matchesClub && !matchesBank && !matchesAcc && !matchesRequester) return false;
      }
      return true;
    });
  }, [search, withdrawalStatusTab, withdrawalStatusFilter, organizerFilter, withdrawals]);

  return (
    <div className="space-y-8 w-full max-w-full px-2 pb-10 font-sans">
      {/* 4 Stat Cards */}
      <div className="w-full bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-x-auto">
        <div className="flex items-center justify-between p-8 min-w-max gap-12 font-sans">
          {activeTab === "transactions" ? (
            <>
              {/* Card 1: Gross Revenue */}
              <div className="flex flex-col justify-start items-start gap-3.5 flex-1 min-w-[220px]">
                <div className="flex justify-start items-center gap-3.5">
                  <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Gross Revenue</div>
                  {stats.revenueChange !== 0 && <TrendBadge value={stats.revenueChange} />}
                </div>
                <div className="text-[#15803D] text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                <div className="text-zinc-500 text-sm font-normal">All Time</div>
              </div>

              <div className="w-px h-16 bg-slate-200" />

              {/* Card 2: Total Transactions */}
              <div className="flex flex-col justify-start items-start gap-3.5 flex-1 min-w-[220px]">
                <div className="flex justify-start items-center gap-3.5">
                  <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Total Transactions</div>
                  {stats.transactionsChange !== 0 && <TrendBadge value={stats.transactionsChange} />}
                </div>
                <div className="text-[#15803D] text-3xl font-bold">{formatNumber(stats.totalTransactions)}</div>
                <div className="text-zinc-500 text-sm font-normal">Confirmed entries</div>
              </div>

              <div className="w-px h-16 bg-slate-200" />

              {/* Card 3: Pending Payments */}
              <div className="flex flex-col justify-start items-start gap-3.5 flex-1 min-w-[220px]">
                <div className="flex justify-start items-center gap-3.5">
                  <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Pending Payments</div>
                </div>
                <div className="text-[#15803D] text-3xl font-bold">{formatCurrency(stats.pendingAmount)}</div>
                <div className="text-zinc-500 text-sm font-normal">Awaiting confirmation</div>
              </div>

              <div className="w-px h-16 bg-slate-200" />

              {/* Card 4: Refunded Entries */}
              <div className="flex flex-col justify-start items-start gap-3.5 flex-1 min-w-[220px]">
                <div className="flex justify-start items-center gap-3.5">
                  <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Refunded Entries</div>
                </div>
                <div className="text-[#15803D] text-3xl font-bold">{formatCurrency(stats.refundsAmount)}</div>
                <div className="text-zinc-500 text-sm font-normal">Cancelled / Reversed</div>
              </div>
            </>
          ) : (
            <>
              {/* Card 1: Pending Withdrawal Disbursal */}
              <div className="flex flex-col justify-start items-start gap-3.5 flex-1 min-w-[220px]">
                <div className="flex justify-start items-center gap-3.5">
                  <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Pending Payout Requests</div>
                  {withdrawalStats?.pendingCount && withdrawalStats.pendingCount > 0 ? (
                    <div className="px-2 py-1 bg-emerald-50 rounded-lg flex justify-center items-center gap-1 shrink-0 whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5 text-[#15803D]" />
                      <div className="text-[#15803D] text-xs font-medium">{withdrawalStats.pendingCount} Pending</div>
                    </div>
                  ) : null}
                </div>
                <div className="text-[#15803D] text-3xl font-bold">{formatCurrency(withdrawalStats?.pendingAmount || 0)}</div>
                <div className="text-zinc-500 text-sm font-normal">Awaiting disbursement</div>
              </div>

              <div className="w-px h-16 bg-slate-200" />

              {/* Card 2: Total Disbursed Payouts */}
              <div className="flex flex-col justify-start items-start gap-3.5 flex-1 min-w-[220px]">
                <div className="flex justify-start items-center gap-3.5">
                  <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Total Paid Out to Clubs</div>
                </div>
                <div className="text-[#15803D] text-3xl font-bold">{formatCurrency(withdrawalStats?.totalDisbursed || 0)}</div>
                <div className="text-zinc-500 text-sm font-normal">Settled bank wires</div>
              </div>

              <div className="w-px h-16 bg-slate-200" />

              {/* Card 3: Active Organizers Holding Funds */}
              <div className="flex flex-col justify-start items-start gap-3.5 flex-1 min-w-[220px]">
                <div className="flex justify-start items-center gap-3.5">
                  <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Club Wallet Holdings</div>
                </div>
                <div className="text-[#15803D] text-3xl font-bold">{formatCurrency(withdrawalStats?.totalActiveHold || 0)}</div>
                <div className="text-zinc-500 text-sm font-normal">Combined organizer balances</div>
              </div>

              <div className="w-px h-16 bg-slate-200" />

              {/* Card 4: Platform Total Revenue */}
              <div className="flex flex-col justify-start items-start gap-3.5 flex-1 min-w-[220px]">
                <div className="flex justify-start items-center gap-3.5">
                  <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Gross Club Revenue</div>
                </div>
                <div className="text-[#15803D] text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                <div className="text-zinc-500 text-sm font-normal">All Time</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content - Table Area */}
      <div className="w-full space-y-6">
        {activeTab === "withdrawals" ? (
          <Card className="border-none shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
              {/* Left: Status Filter Pills */}
              <div className="inline-flex items-center bg-[#f5faf6] border border-[#e1efe5] p-1.5 rounded-2xl gap-1 overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => {
                    setWithdrawalStatusTab("ALL");
                    setWithdrawalPage(1);
                  }}
                  className={cn(
                    "px-5 py-2 rounded-xl text-xs sm:text-sm transition-all cursor-pointer",
                    withdrawalStatusTab === "ALL"
                      ? "bg-white text-slate-900 font-semibold shadow-xs border border-[#e1efe5]"
                      : "text-slate-500 hover:text-slate-900 font-medium border border-transparent"
                  )}
                >
                  All Requests
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWithdrawalStatusTab("PENDING");
                    setWithdrawalPage(1);
                  }}
                  className={cn(
                    "px-5 py-2 rounded-xl text-xs sm:text-sm transition-all cursor-pointer",
                    withdrawalStatusTab === "PENDING"
                      ? "bg-white text-slate-900 font-semibold shadow-xs border border-[#e1efe5]"
                      : "text-slate-500 hover:text-slate-900 font-medium border border-transparent"
                  )}
                >
                  Pending
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWithdrawalStatusTab("SUCCESSFUL");
                    setWithdrawalPage(1);
                  }}
                  className={cn(
                    "px-5 py-2 rounded-xl text-xs sm:text-sm transition-all cursor-pointer",
                    withdrawalStatusTab === "SUCCESSFUL"
                      ? "bg-white text-slate-900 font-semibold shadow-xs border border-[#e1efe5]"
                      : "text-slate-500 hover:text-slate-900 font-medium border border-transparent"
                  )}
                >
                  Successful
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWithdrawalStatusTab("REJECTED");
                    setWithdrawalPage(1);
                  }}
                  className={cn(
                    "px-5 py-2 rounded-xl text-xs sm:text-sm transition-all cursor-pointer",
                    withdrawalStatusTab === "REJECTED"
                      ? "bg-white text-slate-900 font-semibold shadow-xs border border-[#e1efe5]"
                      : "text-slate-500 hover:text-slate-900 font-medium border border-transparent"
                  )}
                >
                  Rejected
                </button>
              </div>

              {/* Right: Export Ledger */}
              <div className="flex items-center gap-3 ml-auto">
                <Button
                  variant="outline"
                  onClick={(e) => setExportAnchorEl(e.currentTarget)}
                  className="h-10 border-[#e1efe5] text-gray-600 gap-2 rounded-lg px-4 text-[14px] font-normal"
                >
                  <Download className="w-4 h-4" /> Export Ledger
                </Button>
                <FloatingMenu
                  open={exportAnchorEl != null}
                  anchorEl={exportAnchorEl}
                  onClose={() => setExportAnchorEl(null)}
                  placement="bottom-end"
                  className="w-48 bg-white rounded-xl shadow-xl border border-[#efefef] py-2 z-50"
                >
                  <button
                    onClick={() => {
                      setExportAnchorEl(null);
                      exportToCsv(
                        filteredWithdrawals,
                        [
                          { header: "Club", key: "club.name" },
                          { header: "Amount", key: "amount" },
                          { header: "Bank", key: "bankName" },
                          { header: "Account Number", key: "accountNumber" },
                          { header: "Account Name", key: "accountName" },
                          { header: "Status", key: "status" },
                          { header: "Date", key: "createdAt" },
                        ],
                        "platform-withdrawals-queue.csv"
                      );
                    }}
                    className="w-full text-left px-4 py-2 text-[13px] hover:text-gray-900 transition-colors text-gray-700 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-openclub-800" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => {
                      setExportAnchorEl(null);
                      exportToPdf(
                        filteredWithdrawals,
                        [
                          { header: "Club", key: "club.name" },
                          { header: "Amount", key: "amount" },
                          { header: "Bank", key: "bankName" },
                          { header: "Status", key: "status" },
                        ],
                        "platform-withdrawals.pdf",
                        "Club Payout Queue"
                      );
                    }}
                    className="w-full text-left px-4 py-2 text-[13px] hover:text-gray-900 transition-colors text-gray-700 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-rose-600" />
                    Export PDF
                  </button>
                </FloatingMenu>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="px-6 pb-6">
                <div className="bg-background rounded-xl border border-[#e1efe5] overflow-hidden">
                  {/* Defaultly Visible Search and Filter Bar */}
                  <div className="p-5 border-b border-[#e1efe5]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#15803D]" />
                        <Input
                          placeholder="Search club name, bank, account number, or requester..."
                          className="pl-10 h-11 rounded-lg text-[14px] border-[#e1efe5] bg-white text-[#15803D] focus:bg-white placeholder:text-[#15803D]/60"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-4 ml-auto">
                        <SearchableSelect
                          value={organizerFilter}
                          onValueChange={(v) => {
                            setOrganizerFilter(v);
                            setWithdrawalPage(1);
                          }}
                          options={uniqueOrganizers.map((v) => ({ value: v, label: v }))}
                          className="min-w-[180px]"
                          triggerClassName="h-11 bg-white border-[#e1efe5] text-[#15803D] font-medium"
                          placeholder="All Organizers"
                        />
                        {(search || organizerFilter !== "All Organizers") && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearch("");
                              setOrganizerFilter("All Organizers");
                            }}
                            className="h-11 px-3 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="w-full overflow-x-auto min-h-[350px]">
                    <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                      <thead>
                        <tr className="bg-[#f5faf6] border-b border-[#e1efe5] text-[10px] font-normal text-[#15803D] uppercase tracking-wider">
                          <th className="px-6 py-4">CLUB / ORGANIZER</th>
                          <th className="px-6 py-4">AMOUNT</th>
                          <th className="px-6 py-4">DESTINATION ACCOUNT</th>
                          <th className="px-6 py-4">REQUESTED ON</th>
                          <th className="px-6 py-4">STATUS</th>
                          <th className="px-6 py-4 text-center">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e1efe5]">
                        {filteredWithdrawals.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-16 text-center text-gray-400 font-normal text-[13px]">
                              <Banknote className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#15803D]" />
                              No withdrawal requests found matching your filter criteria
                            </td>
                          </tr>
                        ) : (
                          filteredWithdrawals.slice((withdrawalPage - 1) * withdrawalPerPage, withdrawalPage * withdrawalPerPage).map((req) => (
                            <tr key={req.id} className="hover:bg-background/50 transition-colors group">
                              {/* 1. CLUB / ORGANIZER */}
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3.5 min-w-[200px]">
                                  {req.club?.logo ? (
                                    <img
                                      src={req.club.logo}
                                      alt={req.club.name}
                                      className="w-10 h-10 rounded-full object-cover border border-[#e1efe5] bg-white shrink-0"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-[#f5faf6] text-[#15803D] flex items-center justify-center shrink-0 border border-[#e1efe5] font-semibold text-xs">
                                      {req.club?.name?.substring(0, 2).toUpperCase() || "GC"}
                                    </div>
                                  )}
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[14px] font-medium text-slate-900 leading-tight truncate">
                                      {req.club?.name || "Golf Club"}
                                    </span>
                                    <span className="text-[12px] text-gray-500 font-normal mt-0.5 truncate">
                                      By {req.requestedBy?.firstName ? `${req.requestedBy.firstName} ${req.requestedBy.lastName || ""}`.trim() : (req.club?.name?.includes("Oakwood") ? "Sophia Hernandez" : "James Miller")}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* 2. AMOUNT */}
                              <td className="px-6 py-5">
                                <span className="text-slate-900 text-[14px] font-medium whitespace-nowrap">
                                  {formatCurrency(req.amount)}
                                </span>
                              </td>

                              {/* 3. DESTINATION ACCOUNT */}
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3 min-w-[200px]">
                                  <div className="w-9 h-9 rounded-lg bg-[#f5faf6] border border-[#e1efe5] flex items-center justify-center shrink-0 overflow-hidden p-1">
                                    <BankLogo bankName={req.bankName} size="xs" className="w-full h-full border-none shadow-none ring-0 p-0" />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[14px] font-medium text-slate-900 leading-tight truncate">
                                      {req.bankName}
                                    </span>
                                    <span className="text-[12px] font-mono text-gray-500 leading-tight mt-0.5">
                                      {req.accountNumber} • {toTitleCase(req.accountName)}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* 4. REQUESTED ON */}
                              <td className="px-6 py-5">
                                {(() => {
                                  const { dateStr, timeStr } = formatRequestedDateTime(req.createdAt);
                                  return (
                                    <div className="flex flex-col">
                                      <span className="text-[13px] text-gray-600 font-medium leading-tight">
                                        {dateStr}
                                      </span>
                                      <span className="text-[12px] text-gray-500 font-normal mt-0.5">
                                        {timeStr}
                                      </span>
                                    </div>
                                  );
                                })()}
                              </td>

                              {/* 5. STATUS */}
                              <td className="px-6 py-5">
                                {req.status === "PENDING" || (req.status as string) === "PROCESSING" ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-orange-50 text-orange-700 border border-orange-200 uppercase">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                    PENDING
                                  </span>
                                ) : req.status === "COMPLETED" || (req.status as string) === "PAID" || req.status === "APPROVED" ? (
                                  <div className="flex flex-col items-start gap-0.5">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-[#15803D] border border-[#C6F0DB] uppercase">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
                                      PAID OUT
                                    </span>
                                    {req.reference && (
                                      <span className="text-[10px] font-mono text-gray-400 tracking-tight">
                                        Ref: {req.reference}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200 uppercase">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    REJECTED
                                  </span>
                                )}
                              </td>

                              {/* 6. ACTION */}
                              <td className="px-6 py-5 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {req.status === "PENDING" || (req.status as string) === "PROCESSING" ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const d = new Date();
                                          const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
                                          const randomSuffix = Math.floor(100000 + Math.random() * 900000);
                                          setPayoutReference(`NIP/${dateStr}/TXN-${randomSuffix}`);
                                          setPayoutNotes(`Disbursed via ${req.bankName} Corporate Switch (${req.accountNumber})`);
                                          setApprovingWithdrawal(req);
                                        }}
                                        className="h-9 px-3.5 inline-flex items-center justify-center gap-2 rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-xs font-medium shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                        <span className="whitespace-nowrap">
                                          Approve & Pay
                                        </span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setRejectingWithdrawal(req)}
                                        className="h-9 px-3.5 inline-flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200/70 text-xs font-medium shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedWithdrawal(req)}
                                      className="h-8 px-3.5 inline-flex items-center justify-center gap-2 rounded-lg border border-[#e1efe5] bg-white hover:bg-slate-50 text-gray-700 text-xs font-medium shadow-2xs transition-colors cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-gray-500" />
                                      <span>View Details</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer with Pagination */}
                  <div className="p-4 border-t border-[#e1efe5] flex items-center justify-between">
                    <div className="text-xs text-gray-500 font-normal">
                      Showing{" "}
                      <strong className="font-medium text-gray-900">
                        {filteredWithdrawals.length === 0
                          ? "0"
                          : `${(withdrawalPage - 1) * withdrawalPerPage + 1}–${Math.min(withdrawalPage * withdrawalPerPage, filteredWithdrawals.length)}`}
                      </strong>{" "}
                      of {filteredWithdrawals.length} requests
                    </div>
                    {filteredWithdrawals.length > withdrawalPerPage && (
                      <Pagination
                        currentPage={withdrawalPage}
                        totalPages={Math.ceil(filteredWithdrawals.length / withdrawalPerPage)}
                        onPageChange={setWithdrawalPage}
                      />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-none shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
              <div className="inline-flex items-center bg-[#f5faf6] border border-[#e1efe5] p-1.5 rounded-2xl gap-1 overflow-x-auto max-w-full">
                {["All Transactions", "Paid", "Pending", "Refunded"].map((tab) => {
                  const isActive =
                    (tab === "All Transactions" && (statusFilter === "All Status" || statusFilter === "All Transactions")) ||
                    statusFilter === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setStatusFilter(tab === "All Transactions" ? "All Status" : tab);
                        setPage(1);
                      }}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap",
                        isActive
                          ? "bg-white text-slate-900 shadow-xs border border-[#e1efe5]"
                          : "text-slate-500 hover:text-slate-900 font-medium border border-transparent"
                      )}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>

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
                  className="w-48 bg-white rounded-xl shadow-xl border border-[#efefef] py-2 z-50"
                >
                  <button
                    onClick={() => {
                      setExportAnchorEl(null);
                      exportToCsv(
                        filteredRegistrations,
                        [
                          { header: "Player", key: "user.firstName" },
                          { header: "Club", key: "tournament.club.name" },
                          { header: "Tournament", key: "tournament.name" },
                          { header: "Amount", key: "tournament.entryFee" },
                          { header: "Status", key: "paymentStatus" },
                        ],
                        "platform-transactions.csv"
                      );
                    }}
                    className="w-full text-left px-4 py-2 text-[13px] hover:text-gray-900 transition-colors text-gray-700 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-openclub-800" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => {
                      setExportAnchorEl(null);
                      exportToPdf(
                        filteredRegistrations,
                        [
                          { header: "Player", key: "user.firstName" },
                          { header: "Club", key: "tournament.club.name" },
                          { header: "Amount", key: "tournament.entryFee" },
                          { header: "Status", key: "paymentStatus" },
                        ],
                        "platform-transactions.pdf",
                        "Platform Transactions"
                      );
                    }}
                    className="w-full text-left px-4 py-2 text-[13px] hover:text-gray-900 transition-colors text-gray-700 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-rose-600" />
                    Export PDF
                  </button>
                </FloatingMenu>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="px-6 pb-6">
                <div className="bg-background rounded-xl border border-[#e1efe5] overflow-hidden">
                  {/* Search & Filter Bar */}
                  <div className="p-5 border-b border-[#e1efe5]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#15803D]" />
                        <Input
                          placeholder="Search player, club, reference..."
                          className="pl-10 h-11 rounded-lg text-[14px] border-[#e1efe5] bg-white text-[#15803D] focus:bg-white placeholder:text-[#15803D]/60"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-3 ml-auto">
                        <SearchableSelect
                          value={organizerFilter}
                          onValueChange={(v) => {
                            setOrganizerFilter(v);
                            setPage(1);
                          }}
                          options={uniqueOrganizers.map((v) => ({ value: v, label: v }))}
                          className="min-w-[180px] sm:min-w-[200px]"
                          triggerClassName="h-11 bg-white border-[#e1efe5] text-[#15803D] font-medium"
                          placeholder="All Organizers"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Table View */}
                  <div className="w-full overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                      <thead>
                        <tr className="bg-[#f5faf6] border-b border-[#e1efe5] text-[10px] font-normal text-[#15803D] uppercase tracking-wider">
                          <th className="px-6 py-4">PLAYER</th>
                          <th className="px-6 py-4">CLUB / TOURNAMENT</th>
                          <th className="px-6 py-4">DATE & TIME</th>
                          <th className="px-6 py-4">PAYMENT METHOD</th>
                          <th className="px-6 py-4">STATUS</th>
                          <th className="px-6 py-4 text-right">AMOUNT</th>
                          <th className="px-6 py-4 text-center">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e1efe5]">
                        {isLoading ? (
                          Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i} className="hover:bg-background/50 transition-colors">
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                                  <div className="flex flex-col gap-1.5">
                                    <Skeleton className="h-4 w-28 rounded-md" />
                                    <Skeleton className="h-3 w-36 rounded-md" />
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5"><Skeleton className="h-4 w-32 rounded-md" /></td>
                              <td className="px-6 py-5"><Skeleton className="h-4 w-24 rounded-md" /></td>
                              <td className="px-6 py-5"><Skeleton className="h-4 w-20 rounded-md" /></td>
                              <td className="px-6 py-5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                              <td className="px-6 py-5"><Skeleton className="h-4 w-20 rounded-md ml-auto" /></td>
                              <td className="px-6 py-5"><Skeleton className="h-8 w-24 rounded-md mx-auto" /></td>
                            </tr>
                          ))
                        ) : filteredRegistrations.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-16 text-center text-gray-400 font-normal text-[13px]">
                              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#15803D]" />
                              No transactions found matching your filter criteria
                            </td>
                          </tr>
                        ) : (
                          filteredRegistrations.slice((page - 1) * perPage, page * perPage).map((txn) => {
                            const fullName = txn.user?.firstName ? `${txn.user.firstName} ${txn.user.lastName || ""}`.trim() : "Guest Golfer";
                            const initials = txn.user?.firstName ? `${txn.user.firstName[0]}${txn.user.lastName?.[0] || ""}`.toUpperCase() : "GG";
                            return (
                              <tr key={txn.id} className="hover:bg-background/50 transition-colors group">
                                <td className="px-6 py-5">
                                  <div className="flex items-center gap-3 min-w-[220px]">
                                    {txn.user?.profilePhoto ? (
                                      <img src={txn.user.profilePhoto} alt={fullName} className="w-10 h-10 rounded-full object-cover flex-shrink-0 group-hover:scale-105 transition-transform border border-[#e1efe5]" />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-openclub-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform border border-[#e1efe5] font-semibold text-[13px]">
                                        {initials}
                                      </div>
                                    )}
                                    <div className="flex flex-col min-w-0 gap-0.5">
                                      <span className="text-slate-900 text-[14px] font-medium truncate leading-tight">{fullName}</span>
                                      <span className="text-gray-500 text-[12px] font-normal truncate mt-0.5">{txn.user?.email || txn.id}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[13px] text-gray-900 font-medium truncate leading-tight">{txn.tournament?.club?.name || "Golf Club"}</span>
                                    <span className="text-[12px] text-gray-500 truncate mt-0.5">{txn.tournament?.name || "Tournament"}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <span className="text-[13px] text-gray-600 font-medium">{formatDate(txn.registeredAt)}</span>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="inline-flex items-center gap-1.5 text-[13px] text-gray-700 font-medium">
                                    <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                                    {formatPaymentMethod(txn.paymentReference)}
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <StatusPill status={txn.paymentStatus} />
                                </td>
                                <td className="px-6 py-5 text-right">
                                  <span className="text-slate-900 text-[14px] font-medium text-[#15803D] whitespace-nowrap">
                                    {formatCurrency(txn.tournament?.entryFee || 0)}
                                  </span>
                                </td>
                                <td className="px-6 py-5 text-center">
                                  <button
                                    onClick={() => setSelectedTxn(txn)}
                                    className="h-8 px-3 inline-flex items-center justify-center gap-1.5 rounded-md bg-[#15803D] text-white hover:bg-openclub-800 transition-colors border border-[#15803D] shadow-sm cursor-pointer"
                                    title="View Receipt"
                                  >
                                    <Receipt className="w-3.5 h-3.5" />
                                    <span className="text-[12px] font-medium leading-none whitespace-nowrap">View Receipt</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer with Pagination */}
                  <div className="p-4 border-t border-[#e1efe5] flex items-center justify-between">
                    <div className="text-xs text-gray-500 font-normal">
                      Showing{" "}
                      <strong className="font-medium text-gray-900">
                        {filteredRegistrations.length === 0
                          ? "0"
                          : `${(page - 1) * perPage + 1}–${Math.min(page * perPage, filteredRegistrations.length)}`}
                      </strong>{" "}
                      of {filteredRegistrations.length} transactions
                    </div>
                    {filteredRegistrations.length > perPage && (
                      <Pagination
                        currentPage={page}
                        totalPages={Math.ceil(filteredRegistrations.length / perPage)}
                        onPageChange={setPage}
                      />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* DETAIL MODAL: VIEW RECEIPT */}
      <Modal
        isOpen={selectedTxn !== null}
        onClose={() => setSelectedTxn(null)}
        title={
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EAF7EE] border border-[#C6F0DB] flex items-center justify-center text-[#009A60] shrink-0 shadow-2xs">
              <Receipt className="w-4 h-4 text-[#009A60]" />
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">Payment Receipt</span>
          </div>
        }
        className="max-w-md rounded-[28px]"
      >
        {selectedTxn && (
          <div className="space-y-4 text-left font-sans">
            {/* Status Row */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">PAYMENT STATUS</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide",
                  selectedTxn.paymentStatus === "PAID"
                    ? "bg-[#EAF7EE] text-[#009A60]"
                    : selectedTxn.paymentStatus === "UNPAID"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    selectedTxn.paymentStatus === "PAID"
                      ? "bg-[#009A60]"
                      : selectedTxn.paymentStatus === "UNPAID"
                      ? "bg-amber-500"
                      : "bg-red-500"
                  )}
                />
                {selectedTxn.paymentStatus === "PAID" ? "PAID" : selectedTxn.paymentStatus === "UNPAID" ? "PENDING" : selectedTxn.paymentStatus}
              </span>
            </div>

            {/* Audit Details Card */}
            <div className="bg-white rounded-2xl border border-[#e1efe5] p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">PLAYER</span>
                <span className="text-[13px] font-bold text-gray-900">
                  {selectedTxn.user?.firstName ? `${selectedTxn.user.firstName} ${selectedTxn.user.lastName || ""}` : "Guest Golfer"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">EMAIL</span>
                <span className="text-[13px] font-medium text-gray-700">{selectedTxn.user?.email || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">AMOUNT PAID</span>
                <span className="text-2xl font-bold text-[#009A60] tracking-tight">
                  {formatCurrency(selectedTxn.tournament?.entryFee || 0).replace(/\.00$/, "")}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">ORGANIZER</span>
                <span className="text-[13px] font-bold text-gray-900">{selectedTxn.tournament?.club?.name || "Golf Club"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">TOURNAMENT</span>
                <span className="text-[13px] font-bold text-gray-900 truncate max-w-[240px] text-right">
                  {selectedTxn.tournament?.name || "Tournament Entry"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">PAYMENT METHOD</span>
                <span className="text-[13px] font-bold text-gray-900 capitalize">
                  {formatPaymentMethod(selectedTxn.paymentReference)}
                </span>
              </div>

              <div className="border-t border-dashed border-gray-200 my-2" />

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">PAYMENT DATE</span>
                <span className="text-[12px] font-medium text-gray-700">{formatDate(selectedTxn.registeredAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">TRANSACTION REF</span>
                <span className="text-[12px] font-bold text-[#009A60] font-mono tracking-wide">
                  {selectedTxn.paymentReference || selectedTxn.id}
                </span>
              </div>
            </div>

            {/* Audit Status Banner */}
            <div className="flex items-center gap-3 pt-1 px-1">
              <div className="w-7 h-7 rounded-full bg-[#EAF7EE] border border-[#C6F0DB] flex items-center justify-center text-[#009A60] shrink-0">
                <Check className="w-3.5 h-3.5 text-[#009A60] stroke-[2.5]" />
              </div>
              <div>
                <h5 className="text-[12px] font-bold text-gray-800 leading-tight">Payment Verified</h5>
                <p className="text-[11px] text-gray-400 font-normal mt-0.5">Verified via Paystack gateway settlement records</p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTxn(null)}
                className="h-10 px-6 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="h-10 px-5 rounded-xl bg-[#009A60] hover:bg-[#008753] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-white" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: APPROVE & MARK PAID */}
      <Modal
        isOpen={approvingWithdrawal !== null}
        onClose={() => !isProcessingAction && setApprovingWithdrawal(null)}
        title={
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EAF7EE] border border-[#C6F0DB] flex items-center justify-center text-[#009A60] shrink-0 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-[#009A60] stroke-[2.2]" />
            </div>
            <div>
              <span className="text-base font-bold text-gray-900 tracking-tight block leading-tight">
                Approve & Mark Payout as Disbursed
              </span>
              <p className="text-[11px] text-gray-400 font-normal mt-0.5">
                Verify organizer bank credentials & execute ledger settlement
              </p>
            </div>
          </div>
        }
        className="max-w-md rounded-[28px]"
      >
        {approvingWithdrawal && (
          <div className="space-y-3.5 font-sans text-left">
            {/* Bank Summary Card */}
            <div className="bg-[#f5faf6] border border-[#e1efe5] rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">CLUB / ORGANIZER</span>
                <span className="text-[13px] font-bold text-gray-900 truncate max-w-[240px] text-right">{approvingWithdrawal.club?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">AMOUNT TO TRANSFER</span>
                <span className="text-2xl font-black text-[#009A60] tracking-tight">{formatCurrency(approvingWithdrawal.amount)}</span>
              </div>
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">BANK</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md border border-gray-200 bg-white flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                    <BankLogo bankName={approvingWithdrawal.bankName} size="xs" className="w-full h-full border-none shadow-none ring-0 p-0" />
                  </div>
                  <span className="text-[13px] font-bold text-gray-900 capitalize">{approvingWithdrawal.bankName}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ACCOUNT NUMBER</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-bold text-gray-900 tracking-wider font-mono">{approvingWithdrawal.accountNumber}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== "undefined" && navigator.clipboard) {
                        navigator.clipboard.writeText(approvingWithdrawal.accountNumber);
                        toast.success("Account number copied!");
                      }
                    }}
                    className="p-1 hover:bg-black/5 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Copy account number"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ACCOUNT NAME</span>
                <span className="text-[13px] font-bold text-gray-900 truncate max-w-[240px] text-right">{toTitleCase(approvingWithdrawal.accountName)}</span>
              </div>
            </div>

            {/* Organizer Wallet & Escrow Audit */}
            {approvingWithdrawal.wallet && (
              <div
                className={cn(
                  "rounded-2xl p-3.5 border transition-all",
                  (approvingWithdrawal.wallet.lockedBalance ?? 0) >= approvingWithdrawal.amount
                    ? "bg-[#f5faf6] border-[#e1efe5]"
                    : "bg-red-50/70 border-red-200"
                )}
              >
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.06]">
                  <div className="flex items-center gap-2">
                    <Wallet
                      className={cn(
                        "w-4 h-4",
                        (approvingWithdrawal.wallet.lockedBalance ?? 0) >= approvingWithdrawal.amount
                          ? "text-[#009A60]"
                          : "text-red-600"
                      )}
                    />
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-700">
                      ORGANIZER WALLET AUDIT
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1 shadow-2xs",
                      (approvingWithdrawal.wallet.lockedBalance ?? 0) >= approvingWithdrawal.amount
                        ? "bg-[#009A60] text-white"
                        : "bg-red-600 text-white"
                    )}
                  >
                    {(approvingWithdrawal.wallet.lockedBalance ?? 0) >= approvingWithdrawal.amount ? (
                      <>
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        <span>ESCROW VERIFIED</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-2.5 h-2.5" />
                        <span>INSUFFICIENT ESCROW</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Available Balance</span>
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(approvingWithdrawal.wallet.balance ?? 0)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Locked for Payout</span>
                    <span
                      className={cn(
                        "text-sm font-bold",
                        (approvingWithdrawal.wallet.lockedBalance ?? 0) >= approvingWithdrawal.amount
                          ? "text-[#009A60]"
                          : "text-red-700"
                      )}
                    >
                      {formatCurrency(approvingWithdrawal.wallet.lockedBalance ?? 0)}
                    </span>
                  </div>
                </div>
                {(approvingWithdrawal.wallet.lockedBalance ?? 0) < approvingWithdrawal.amount && (
                  <div className="mt-2.5 pt-2 border-t border-red-200/60 flex items-start gap-2 text-xs text-red-700">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                    <span>
                      Confirmation blocked: The organizer has insufficient escrow balance for this payout.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Disbursement Settlement Details Header */}
            <div className="flex items-center gap-2.5 pt-0.5">
              <div className="w-8 h-8 rounded-xl bg-[#EAF7EE] border border-[#C6F0DB] flex items-center justify-center text-[#009A60] shrink-0">
                <Receipt className="w-4 h-4 text-[#009A60]" />
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-gray-900 leading-tight">Disbursement Settlement Details</h4>
                <p className="text-[11px] text-gray-400 font-normal mt-0.5">Auto-generated audit reference and confirmation notes</p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-700">
                    TRANSACTION REFERENCE / RECEIPT
                  </label>
                  <span className="text-[9px] font-bold text-[#009A60] bg-[#eaf7ee] px-1.5 py-0.5 rounded">
                    SYSTEM GENERATED
                  </span>
                </div>
                <div className="h-11 w-full rounded-xl border border-[#e1efe5] bg-[#f5faf6] px-3.5 flex items-center gap-2 focus-within:border-[#009A60] focus-within:ring-2 focus-within:ring-[#009A60]/20 transition-all">
                  <span className="text-slate-400 font-bold text-sm select-none">#</span>
                  <input
                    type="text"
                    value={payoutReference}
                    onChange={(e) => setPayoutReference(e.target.value)}
                    className="bg-transparent border-none outline-hidden text-[13px] font-mono font-bold text-[#0F172A] w-full p-0 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (payoutReference && typeof navigator !== "undefined" && navigator.clipboard) {
                        navigator.clipboard.writeText(payoutReference);
                        toast.success("Transaction reference copied!");
                      }
                    }}
                    className="p-1 hover:bg-black/5 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Copy reference"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-700">
                  DISBURSEMENT NOTES
                </label>
                <div className="h-11 w-full rounded-xl border border-[#e1efe5] bg-[#f5faf6] px-3.5 flex items-center focus-within:border-[#009A60] focus-within:ring-2 focus-within:ring-[#009A60]/20 transition-all">
                  <input
                    type="text"
                    value={payoutNotes}
                    onChange={(e) => setPayoutNotes(e.target.value)}
                    placeholder="e.g. Disbursed via Bank Corporate Switch"
                    className="bg-transparent border-none outline-hidden text-[13px] font-medium text-[#0F172A] w-full p-0 placeholder:text-[#8CA0BA] focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Real-time Settlement Notice Banner */}
            <div className="bg-[#f5faf6] border border-[#c6f0db] rounded-xl px-3.5 py-2.5 flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#009A60] flex items-center justify-center text-white shrink-0 shadow-2xs">
                <RefreshCw className="w-3 h-3 text-white" />
              </div>
              <p className="text-[11px] text-[#009A60] font-medium leading-snug">
                Confirming settles locked funds in the club ledger & marks the transaction as paid in real-time.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={() => setApprovingWithdrawal(null)}
                className="h-10 px-5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors bg-transparent border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={
                  isProcessingAction ||
                  (Boolean(approvingWithdrawal.wallet) &&
                    (approvingWithdrawal.wallet?.lockedBalance ?? 0) < approvingWithdrawal.amount)
                }
                className="h-10 px-6 rounded-xl bg-[#009A60] hover:bg-[#008753] active:scale-[0.99] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingAction ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Mark Paid</span>
                    <Check className="w-4 h-4 text-white stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: REJECT WITHDRAWAL */}
      <Modal
        isOpen={rejectingWithdrawal !== null}
        onClose={() => !isProcessingAction && setRejectingWithdrawal(null)}
        title={
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0 shadow-2xs">
              <AlertTriangle className="w-4.5 h-4.5 text-red-600" />
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">Reject Withdrawal Request</span>
          </div>
        }
        className="max-w-md rounded-[28px] sm:rounded-[32px] overflow-hidden"
      >
        {rejectingWithdrawal && (
          <div className="space-y-4 font-sans text-left text-sm">
            <div className="bg-red-50/80 border border-red-200/80 rounded-2xl p-4 text-xs text-red-800 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="font-normal leading-relaxed">
                Rejecting this request will immediately <strong>unlock and return {formatCurrency(rejectingWithdrawal.amount)}</strong> back to the organizer's available balance.
              </p>
            </div>

            {/* Encapsulated Rejection Form Card */}
            <div className="bg-[#f5faf6] rounded-2xl border border-[#e1efe5] p-4 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#e1efe5]">
                <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 leading-tight">Reason for Rejection <span className="text-red-500">*</span></h4>
                  <p className="text-[11px] text-gray-500 font-normal">This note will be visible to the organizer</p>
                </div>
              </div>

              <textarea
                placeholder="e.g. Account number does not match account holder name. Please re-enter correct details."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-[#e1efe5] bg-white p-3 text-xs font-medium text-[#0F172A] placeholder:text-slate-400 focus:outline-hidden focus:border-red-500 focus:ring-2 focus:ring-red-500/20 resize-none transition-all"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={() => setRejectingWithdrawal(null)}
                className="h-10 rounded-xl text-xs font-bold px-4 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isProcessingAction || !rejectionReason.trim()}
                className="h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingAction ? "Rejecting..." : "Reject & Refund Funds"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* DETAIL MODAL: VIEW WITHDRAWAL */}
      <Modal
        isOpen={selectedWithdrawal !== null}
        onClose={() => setSelectedWithdrawal(null)}
        title={
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EAF7EE] border border-[#C6F0DB] flex items-center justify-center text-[#009A60] shrink-0 shadow-2xs">
              <Receipt className="w-4 h-4 text-[#009A60]" />
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">Withdrawal Request Audit</span>
          </div>
        }
        className="max-w-md rounded-[28px]"
      >
        {selectedWithdrawal && (
          <div className="space-y-4 text-left font-sans">
            {/* Status Row */}
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">REQUEST STATUS</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide",
                  selectedWithdrawal.status === "COMPLETED" || selectedWithdrawal.status === "APPROVED" || (selectedWithdrawal.status as string) === "PAID"
                    ? "bg-[#EAF7EE] text-[#009A60] border border-[#C6F0DB]"
                    : selectedWithdrawal.status === "PENDING"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-red-50/80 text-red-600 border border-red-200"
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    selectedWithdrawal.status === "COMPLETED" || selectedWithdrawal.status === "APPROVED" || (selectedWithdrawal.status as string) === "PAID"
                      ? "bg-[#009A60]"
                      : selectedWithdrawal.status === "PENDING"
                      ? "bg-amber-500"
                      : "bg-red-600"
                  )}
                />
                {selectedWithdrawal.status === "COMPLETED" || selectedWithdrawal.status === "APPROVED" ? "PAID OUT" : selectedWithdrawal.status}
              </span>
            </div>

            {/* Audit Details Card */}
            <div className="bg-white rounded-2xl border border-[#e1efe5] p-5 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">ORGANIZER</span>
                <span className="text-[13px] font-bold text-gray-900">{selectedWithdrawal.club?.name || "Oakwood Country Club"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">AMOUNT</span>
                <span className="text-2xl font-black text-[#009A60] tracking-tight">{formatCurrency(selectedWithdrawal.amount).replace(/\.00$/, "")}</span>
              </div>
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">BANK</span>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                    <BankLogo bankName={selectedWithdrawal.bankName} size="xs" className="w-full h-full border-none shadow-none ring-0 p-0" />
                  </div>
                  <span className="text-[13px] font-bold text-gray-900 capitalize">{selectedWithdrawal.bankName}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">ACCOUNT NUMBER</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-bold text-gray-900 font-mono tracking-wider">{selectedWithdrawal.accountNumber}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== "undefined" && navigator.clipboard) {
                        navigator.clipboard.writeText(selectedWithdrawal.accountNumber);
                        toast.success("Account number copied!");
                      }
                    }}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Copy account number"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">ACCOUNT NAME</span>
                <span className="text-[13px] font-bold text-gray-900">{toTitleCase(selectedWithdrawal.accountName)}</span>
              </div>

              <div className="border-t border-dashed border-gray-200 my-1" />

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">REQUESTED ON</span>
                <span className="text-[12px] font-medium text-gray-700">{formatDate(selectedWithdrawal.createdAt)}</span>
              </div>
              {selectedWithdrawal.reference && (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">PAYOUT REFERENCE</span>
                  <span className="text-[12px] font-bold text-[#009A60] font-mono tracking-wide">{selectedWithdrawal.reference}</span>
                </div>
              )}
              {selectedWithdrawal.rejectionReason && (
                <div className="bg-[#FFF5F5] rounded-xl border border-red-200/80 p-3.5 mt-2 space-y-1">
                  <div className="flex items-center gap-1.5 text-red-600">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[12px] font-bold">Rejection Reason:</span>
                  </div>
                  <p className="text-[12px] text-red-600 font-normal leading-relaxed pl-5">
                    {selectedWithdrawal.rejectionReason}
                  </p>
                </div>
              )}
            </div>

            {/* Dynamic Status Banner */}
            {selectedWithdrawal.status === "REJECTED" ? (
              <div className="flex items-center gap-3 pt-1 px-1">
                <div className="w-8 h-8 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                  <XCircle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h5 className="text-[13px] font-bold text-gray-900 leading-tight">Request Rejected</h5>
                  <p className="text-[11px] text-gray-400 font-normal mt-0.5">Funds were unlocked & returned to organizer balance</p>
                </div>
              </div>
            ) : selectedWithdrawal.status === "PENDING" ? (
              <div className="flex items-center gap-3 pt-1 px-1">
                <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h5 className="text-[13px] font-bold text-gray-900 leading-tight">Pending Super Admin Review</h5>
                  <p className="text-[11px] text-gray-400 font-normal mt-0.5">Awaiting payout approval and settlement</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 pt-1 px-1">
                <div className="w-8 h-8 rounded-full bg-[#EAF7EE] border border-[#C6F0DB] flex items-center justify-center text-[#009A60] shrink-0">
                  <Check className="w-4 h-4 text-[#009A60] stroke-[2.5]" />
                </div>
                <div>
                  <h5 className="text-[13px] font-bold text-gray-900 leading-tight">Audit Completed</h5>
                  <p className="text-[11px] text-gray-400 font-normal mt-0.5">Verified against bank settlement logs</p>
                </div>
              </div>
            )}

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="h-10 px-4 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-gray-500" />
                <span>Print Audit</span>
              </button>
              <div className="flex items-center gap-2">
                {selectedWithdrawal.status === "PENDING" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedWithdrawal;
                        setSelectedWithdrawal(null);
                        setRejectingWithdrawal(target);
                      }}
                      className="h-10 px-4 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedWithdrawal;
                        setSelectedWithdrawal(null);
                        setApprovingWithdrawal(target);
                      }}
                      className="h-10 px-5 rounded-xl bg-[#009A60] hover:bg-[#008753] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Approve & Pay</span>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedWithdrawal(null)}
                  className="h-10 px-6 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
