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
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
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
        return { label: status === "COMPLETED" ? "Paid Out" : status === "APPROVED" ? "Approved" : "Paid", className: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: CheckCircle2, dot: "bg-[#15803D]" };
      case "PENDING":
      case "PROCESSING":
      case "UNPAID":
        return { label: status === "PROCESSING" ? "Processing" : "Pending", className: "bg-orange-50 text-orange-700 border-orange-100", icon: Clock, dot: "bg-orange-500" };
      case "FAILED":
      case "REJECTED":
        return { label: status === "REJECTED" ? "Rejected" : "Failed", className: "bg-red-50 text-red-700 border-red-100", icon: Ban, dot: "bg-red-500" };
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
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState("All Status");
  const [organizerFilter, setOrganizerFilter] = useState("All Organizers");

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
        getRegistrations({ take: 100, orderBy: 'updatedAt' }),
        getRegistrationStats(),
        getAllWithdrawals().catch(() => ({ total: 0, items: [] })),
        getAdminWithdrawalStats().catch(() => null),
      ]);
      setRegistrations(regData.items);
      setStats(statsData);
      setWithdrawals(allWithdrawalsData.items);
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

  const handleApprove = async () => {
    if (!approvingWithdrawal || isProcessingAction) return;
    setIsProcessingAction(true);
    try {
      await approveWithdrawal(approvingWithdrawal.id, {
        reference: payoutReference.trim() || undefined,
        notes: payoutNotes.trim() || undefined,
      });
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
      if (withdrawalStatusFilter !== "All Status") {
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
        if (!matchesClub && !matchesBank && !matchesAcc) return false;
      }
      return true;
    });
  }, [search, withdrawalStatusFilter, organizerFilter, withdrawals]);

  return (
    <div className="space-y-8 w-full max-w-full px-2 pb-10 font-sans">
      {/* 4 Stat Cards */}
      <div className="w-full bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-x-auto">
        <div className="flex items-center justify-between p-8 min-w-max gap-12 font-sans">

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
              <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Gross Platform Revenue</div>
            </div>
            <div className="text-[#15803D] text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <div className="text-zinc-500 text-sm font-normal">All Time</div>
          </div>

        </div>
      </div>

      {/* Main Content - Table Area */}
      <div className="w-full space-y-6">
        <Card className="border-none shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
            <CardTitle className="text-zinc-700 text-xl font-medium whitespace-nowrap">
              {activeTab === "withdrawals" ? "Withdrawal Requests" : "All Transactions"}
            </CardTitle>

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
                    if (activeTab === "withdrawals") {
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
                    } else {
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
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] hover:text-gray-900 transition-colors text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <FileSpreadsheet className="w-4 h-4 text-openclub-800" />
                  Export CSV
                </button>
                <button
                  onClick={() => {
                    setExportAnchorEl(null);
                    if (activeTab === "withdrawals") {
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
                    } else {
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
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] hover:text-gray-900 transition-colors text-gray-700 hover:bg-gray-50 flex items-center gap-3"
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
                        placeholder={activeTab === "withdrawals" ? "Search club name, bank, account number..." : "Search player, club, reference..."}
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
                          setWithdrawalPage(1);
                          setPage(1);
                        }}
                        options={uniqueOrganizers.map((v) => ({ value: v, label: v }))}
                        className="min-w-[180px] sm:min-w-[200px]"
                        triggerClassName="h-11 bg-white border-[#e1efe5] text-[#15803D] font-medium"
                        placeholder="All Organizers"
                      />

                      {activeTab === "withdrawals" ? (
                        <SearchableSelect
                          value={withdrawalStatusFilter}
                          onValueChange={(v) => {
                            setWithdrawalStatusFilter(v);
                            setWithdrawalPage(1);
                          }}
                          options={["All Status", "Pending Review", "Paid Out", "Rejected"].map((v) => ({ value: v, label: v }))}
                          className="min-w-[170px]"
                          triggerClassName="h-11 bg-white border-[#e1efe5] text-[#15803D] font-medium"
                          placeholder="All Status"
                        />
                      ) : (
                        <SearchableSelect
                          value={statusFilter}
                          onValueChange={(v) => {
                            setStatusFilter(v);
                            setPage(1);
                          }}
                          options={["All Status", "Paid", "Pending", "Refunded"].map((v) => ({ value: v, label: v }))}
                          className="min-w-[150px]"
                          triggerClassName="h-11 bg-white border-[#e1efe5] text-[#15803D] font-medium"
                          placeholder="All Status"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Table View */}
                <div className="w-full overflow-x-auto min-h-[400px]">
                  {activeTab === "withdrawals" ? (
                    <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                      <thead>
                        <tr className="bg-[#f5faf6] border-b border-[#e1efe5] text-[10px] font-normal text-[#15803D] uppercase tracking-wider">
                          <th className="px-6 py-4">CLUB / ORGANIZER</th>
                          <th className="px-6 py-4">AMOUNT</th>
                          <th className="px-6 py-4">BANK & ACCOUNT</th>
                          <th className="px-6 py-4">REQUESTED DATE</th>
                          <th className="px-6 py-4">STATUS</th>
                          <th className="px-6 py-4 text-center">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e1efe5]">
                        {filteredWithdrawals.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-16 text-center text-gray-400 font-normal text-[13px]">
                              <Banknote className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#15803D]" />
                              No withdrawal requests found matching your filter
                            </td>
                          </tr>
                        ) : (
                          filteredWithdrawals.slice((withdrawalPage - 1) * perPage, withdrawalPage * perPage).map((req) => (
                            <tr key={req.id} className="hover:bg-background/50 transition-colors group">
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3 min-w-[220px]">
                                  {req.club?.logo ? (
                                    <img src={req.club.logo} alt={req.club.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0 group-hover:scale-105 transition-transform border border-[#e1efe5]" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-openclub-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform border border-[#e1efe5] font-semibold text-[13px]">
                                      {req.club?.name?.substring(0, 2).toUpperCase() || "GC"}
                                    </div>
                                  )}
                                  <div className="flex flex-col min-w-0 gap-0.5">
                                    <span className="text-slate-900 text-[14px] font-medium truncate leading-tight">{req.club?.name || "Golf Club"}</span>
                                    <span className="text-gray-500 text-[12px] font-normal truncate mt-0.5">By: {req.requestedBy?.firstName} {req.requestedBy?.lastName}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <span className="text-slate-900 text-[14px] font-medium text-[#15803D]">{formatCurrency(req.amount)}</span>
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3 min-w-[200px]">
                                  <BankLogo bankName={req.bankName} size="md" />
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[13px] text-gray-900 font-semibold leading-tight">{req.bankName}</span>
                                    <span className="text-[12px] text-gray-500 font-mono mt-0.5">{req.accountNumber} • {req.accountName}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <span className="text-[13px] text-gray-600 font-medium">{formatDate(req.createdAt)}</span>
                              </td>
                              <td className="px-6 py-5">
                                <StatusPill status={req.status} />
                                {req.status === "COMPLETED" && req.reference && (
                                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">Ref: {req.reference}</p>
                                )}
                              </td>
                              <td className="px-6 py-5 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {req.status === "PENDING" ? (
                                    <>
                                      <button
                                        onClick={() => {
                                          const d = new Date();
                                          const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
                                          const randomSuffix = Math.floor(100000 + Math.random() * 900000);
                                          setPayoutReference(`NIP/${dateStr}/TXN-${randomSuffix}`);
                                          setPayoutNotes(`Disbursed via ${req.bankName} Corporate Switch (${req.accountNumber})`);
                                          setApprovingWithdrawal(req);
                                        }}
                                        className="h-8 px-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#15803D] text-white hover:bg-openclub-800 transition-colors border border-[#15803D] text-[12px] font-medium cursor-pointer"
                                      >
                                        <CheckCircle className="w-3.5 h-3.5" /> Approve & Pay
                                      </button>
                                      <button
                                        onClick={() => setRejectingWithdrawal(req)}
                                        className="h-8 px-2.5 inline-flex items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-[12px] font-medium cursor-pointer"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => setSelectedWithdrawal(req)}
                                      className="h-8 px-3 inline-flex items-center justify-center gap-1.5 rounded-md bg-[#15803D] text-white hover:bg-openclub-800 transition-colors border border-[#15803D] shadow-sm"
                                      title="View Details"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span className="text-[12px] font-medium leading-none whitespace-nowrap">View Details</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  ) : (
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
                                    className="h-8 px-3 inline-flex items-center justify-center gap-1.5 rounded-md bg-[#15803D] text-white hover:bg-openclub-800 transition-colors border border-[#15803D] shadow-sm"
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
                  )}
                </div>

                {/* Table Footer with Pagination */}
                <div className="p-4 border-t border-[#e1efe5] flex items-center justify-between">
                  <div className="text-xs text-gray-500 font-normal">
                    Showing {activeTab === "withdrawals" 
                      ? `${Math.min(filteredWithdrawals.length, (withdrawalPage - 1) * perPage + 1)} to ${Math.min(filteredWithdrawals.length, withdrawalPage * perPage)} of ${filteredWithdrawals.length} withdrawal requests`
                      : `${Math.min(filteredRegistrations.length, (page - 1) * perPage + 1)} to ${Math.min(filteredRegistrations.length, page * perPage)} of ${filteredRegistrations.length} transactions`
                    }
                  </div>
                  {activeTab === "withdrawals" ? (
                    filteredWithdrawals.length > perPage && (
                      <Pagination
                        currentPage={withdrawalPage}
                        totalPages={Math.ceil(filteredWithdrawals.length / perPage)}
                        onPageChange={setWithdrawalPage}
                      />
                    )
                  ) : (
                    filteredRegistrations.length > perPage && (
                      <Pagination
                        currentPage={page}
                        totalPages={Math.ceil(filteredRegistrations.length / perPage)}
                        onPageChange={setPage}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DETAIL MODAL: VIEW RECEIPT */}
      <Modal
        isOpen={selectedTxn !== null}
        onClose={() => setSelectedTxn(null)}
        title="Payment Receipt"
        className="max-w-md"
      >
        {selectedTxn && (
          <div className="space-y-4 text-left font-sans text-sm">
            <div className="text-center space-y-1.5 py-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#15803D] flex items-center justify-center mx-auto mb-1">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tournament Entry Receipt</p>
              <h3 className="text-2xl font-semibold text-[#15803D]">
                {formatCurrency(selectedTxn.tournament?.entryFee || 0)}
              </h3>
              <div className="inline-block">
                <StatusPill status={selectedTxn.paymentStatus} />
              </div>
            </div>

            {/* Encapsulated Breakdown Card */}
            <div className="bg-[#f5faf6] rounded-xl border border-[#e1efe5] p-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-[#e1efe5]/60">
                <span className="text-gray-500 font-medium">Player Name:</span>
                <span className="font-semibold text-gray-900">
                  {selectedTxn.user?.firstName ? `${selectedTxn.user.firstName} ${selectedTxn.user.lastName || ""}` : "Guest Golfer"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#e1efe5]/60">
                <span className="text-gray-500 font-medium">Player Email:</span>
                <span className="font-medium text-gray-800">{selectedTxn.user?.email || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#e1efe5]/60">
                <span className="text-gray-500 font-medium">Club:</span>
                <span className="font-semibold text-gray-900">{selectedTxn.tournament?.club?.name || "Golf Club"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#e1efe5]/60">
                <span className="text-gray-500 font-medium">Tournament:</span>
                <span className="font-semibold text-gray-900">{selectedTxn.tournament?.name || "Tournament Entry"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#e1efe5]/60">
                <span className="text-gray-500 font-medium">Payment Method:</span>
                <span className="font-medium text-gray-800">{formatPaymentMethod(selectedTxn.paymentReference)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#e1efe5]/60">
                <span className="text-gray-500 font-medium">Transaction Ref:</span>
                <span className="font-mono font-medium text-gray-800">{selectedTxn.paymentReference || selectedTxn.id}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500 font-medium">Payment Date:</span>
                <span className="text-gray-800">{formatDate(selectedTxn.registeredAt)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTxn(null)}
                className="h-9 px-4 rounded-xl text-xs font-medium"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  window.print();
                }}
                className="h-9 px-4 rounded-xl bg-[#15803D] hover:bg-[#116731] text-white text-xs font-medium gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: APPROVE & MARK PAID */}
      <Modal
        isOpen={approvingWithdrawal !== null}
        onClose={() => !isProcessingAction && setApprovingWithdrawal(null)}
        title="Approve & Mark Payout as Disbursed"
        className="max-w-lg"
      >
        {approvingWithdrawal && (
          <div className="space-y-4 font-sans text-left text-sm">
            {/* Bank Summary Card */}
            <div className="bg-[#f5faf6] border border-[#e1efe5] rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500 font-medium">Club / Organizer:</span>
                <span className="text-xs font-medium text-gray-900">{approvingWithdrawal.club?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500 font-medium">Amount to Transfer:</span>
                <span className="text-base font-medium text-[#15803D]">{formatCurrency(approvingWithdrawal.amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">Bank:</span>
                <div className="flex items-center gap-2">
                  <BankLogo bankName={approvingWithdrawal.bankName} size="sm" />
                  <span className="text-xs font-semibold text-gray-800">{approvingWithdrawal.bankName}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500 font-medium">Account Number:</span>
                <span className="text-xs font-mono font-medium text-gray-900">{approvingWithdrawal.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500 font-medium">Account Name:</span>
                <span className="text-xs font-medium text-gray-800">{approvingWithdrawal.accountName}</span>
              </div>
            </div>

            {/* Encapsulated Settlement Input Card */}
            <div className="bg-[#f5faf6] rounded-2xl border border-[#e1efe5] p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#e1efe5]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white border border-[#e1efe5] text-[#15803D] flex items-center justify-center shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 leading-tight">Disbursement Settlement Details</h4>
                    <p className="text-[11px] text-gray-500 font-normal">Auto-generated audit reference and transfer confirmation notes</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-medium text-[#15803D] bg-emerald-100/80 px-2 py-0.5 rounded-md">
                  Auto-Generated
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-800">
                  Transaction Reference / Transfer Receipt
                </label>
                <Input
                  placeholder="e.g. NIP/2026/08/987123"
                  value={payoutReference}
                  onChange={(e) => setPayoutReference(e.target.value)}
                  className="h-10 rounded-xl text-xs font-mono bg-white border-[#e1efe5] px-3.5 text-gray-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-800">
                  Disbursement Notes
                </label>
                <Input
                  placeholder="e.g. Disbursed via Zenith Bank Corporate Portal"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="h-10 rounded-xl text-xs font-normal bg-white border-[#e1efe5] px-3.5 text-gray-900"
                />
              </div>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200/70 rounded-xl p-3.5 text-[11px] text-emerald-900 flex items-start gap-2.5 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
              <p className="font-normal">
                Confirming this payout settles the locked funds in the club's ledger and marks the transaction as fully paid out in real time.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isProcessingAction}
                onClick={() => setApprovingWithdrawal(null)}
                className="h-10 rounded-xl text-xs font-medium px-4.5 border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleApprove}
                disabled={isProcessingAction}
                className="h-10 rounded-xl bg-[#15803D] hover:bg-[#116731] text-white text-xs font-semibold px-5.5 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed gap-1.5"
              >
                {isProcessingAction ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...
                  </>
                ) : (
                  "Confirm & Mark Paid"
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: REJECT WITHDRAWAL */}
      <Modal
        isOpen={rejectingWithdrawal !== null}
        onClose={() => !isProcessingAction && setRejectingWithdrawal(null)}
        title="Reject Withdrawal Request"
        className="max-w-lg"
      >
        {rejectingWithdrawal && (
          <div className="space-y-4 font-sans text-left text-sm">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="font-normal">
                Rejecting this request will immediately <strong>unlock and return {formatCurrency(rejectingWithdrawal.amount)}</strong> back to the organizer's available balance.
              </p>
            </div>

            {/* Encapsulated Rejection Form Card */}
            <div className="bg-[#f5faf6] rounded-xl border border-[#e1efe5] p-4 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#e1efe5]">
                <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-900 leading-tight">Reason for Rejection <span className="text-red-500">*</span></h4>
                  <p className="text-[11px] text-gray-500 font-normal">This note will be visible to the organizer</p>
                </div>
              </div>

              <textarea
                placeholder="e.g. Account number does not match account holder name. Please re-enter correct details."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[#e1efe5] bg-white p-3 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                disabled={isProcessingAction}
                onClick={() => setRejectingWithdrawal(null)}
                className="h-10 rounded-xl text-xs font-medium px-4"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleReject}
                disabled={isProcessingAction || !rejectionReason.trim()}
                className="h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-5"
              >
                {isProcessingAction ? "Rejecting..." : "Reject & Refund Funds"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* DETAIL MODAL: VIEW WITHDRAWAL */}
      <Modal
        isOpen={selectedWithdrawal !== null}
        onClose={() => setSelectedWithdrawal(null)}
        title="Withdrawal Request Audit"
        className="max-w-lg"
      >
        {selectedWithdrawal && (
          <div className="space-y-4 text-left font-sans text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-xs text-gray-500 font-medium">Request Status</span>
              <StatusPill status={selectedWithdrawal.status} />
            </div>

            {/* Encapsulated Audit Card */}
            <div className="bg-[#f5faf6] rounded-xl border border-[#e1efe5] p-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-[#e1efe5]/60">
                <span className="text-gray-500 font-medium">Club:</span>
                <span className="font-semibold text-gray-900">{selectedWithdrawal.club?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#e1efe5]/60">
                <span className="text-gray-500 font-medium">Amount:</span>
                <span className="text-base font-medium text-gray-900">{formatCurrency(selectedWithdrawal.amount)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#e1efe5]/60">
                <span className="text-gray-500 font-medium">Bank:</span>
                <div className="flex items-center gap-2">
                  <BankLogo bankName={selectedWithdrawal.bankName} size="sm" />
                  <span className="font-semibold text-gray-800">{selectedWithdrawal.bankName}</span>
                </div>
              </div>
              <div className="flex justify-between py-1 border-b border-[#e1efe5]/60">
                <span className="text-gray-500 font-medium">Account Number:</span>
                <span className="font-mono font-medium text-gray-800">{selectedWithdrawal.accountNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#e1efe5]/60">
                <span className="text-gray-500 font-medium">Account Name:</span>
                <span className="text-xs font-medium text-gray-800">{selectedWithdrawal.accountName}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500 font-medium">Requested On:</span>
                <span className="text-gray-700 font-normal">{formatDate(selectedWithdrawal.createdAt)}</span>
              </div>
              {selectedWithdrawal.reference && (
                <div className="flex justify-between pt-1 border-t border-[#e1efe5]/60">
                  <span className="text-gray-500 font-medium">Payout Reference:</span>
                  <span className="font-mono font-medium text-[#15803D]">{selectedWithdrawal.reference}</span>
                </div>
              )}
              {selectedWithdrawal.rejectionReason && (
                <div className="bg-red-50 p-3 rounded-xl border border-red-100 mt-2">
                  <p className="font-medium text-red-700">Rejection Reason:</p>
                  <p className="text-red-600 mt-0.5 font-normal">{selectedWithdrawal.rejectionReason}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedWithdrawal(null)}
                className="h-9 px-4 rounded-xl text-xs font-medium"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
