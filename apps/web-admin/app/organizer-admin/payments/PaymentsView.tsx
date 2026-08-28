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
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Settings,
  ChevronDown,
  Check,
  SlidersHorizontal,
  Banknote,
  Landmark,
  Layers,
  Wallet,
  AlertTriangle,
  Send,
  Building2,
  Info,
  ShieldCheck,
  FileSpreadsheet,
  Plus,
  Eye,
  User,
  Printer,
  Receipt,
  Trash2,
  Star,
  CheckCircle,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { getRegistrations, getRegistrationStats, type RegistrationListItem } from "@/lib/api/registrations";
import {
  getClubWallet,
  getMyWithdrawals,
  requestWithdrawal,
  getClubBankAccounts,
  addClubBankAccount,
  updateClubBankAccount,
  deleteClubBankAccount,
  getNigerianBanks,
  resolveNigerianBankAccount,
  type ClubWalletSummary,
  type WithdrawalRequestItem,
  type WithdrawalStatus,
  type ClubBankAccount,
  type NigerianBank
} from "@/lib/api/withdrawals";
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

interface OrganizerPaymentsViewProps {
  initialTab?: "transactions" | "withdrawals";
}

export function OrganizerPaymentsView({ initialTab = "transactions" }: OrganizerPaymentsViewProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"transactions" | "withdrawals">(initialTab);

  // Registration data
  const [registrations, setRegistrations] = useState<RegistrationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [methodFilter, setMethodFilter] = useState("All Methods");
  const [tournamentFilter, setTournamentFilter] = useState("All Tournaments");
  const [page, setPage] = useState(1);
  const [selectedTxn, setSelectedTxn] = useState<RegistrationListItem | null>(null);
  const [stats, setStats] = useState({ totalTransactions: 0, totalRevenue: 0, pendingAmount: 0, refundsAmount: 0, transactionsChange: 0, revenueChange: 0 });
  const perPage = 10;

  // Wallet and Withdrawal Data
  const [wallet, setWallet] = useState<ClubWalletSummary | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequestItem[]>([]);
  const [withdrawalPage, setWithdrawalPage] = useState(1);
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState("All Status");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequestItem | null>(null);

  // Saved Bank Accounts (Max 2)
  const [bankAccounts, setBankAccounts] = useState<ClubBankAccount[]>([]);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [banksList, setBanksList] = useState<NigerianBank[]>([]);
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [accBankName, setAccBankName] = useState("");
  const [accNumber, setAccNumber] = useState("");
  const [accName, setAccName] = useState("");
  const [accIsDefault, setAccIsDefault] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isResolvingAccount, setIsResolvingAccount] = useState(false);
  const [resolvedAccountName, setResolvedAccountName] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string | null>(null);
  const [isPendingWithdrawalAfterBankAdd, setIsPendingWithdrawalAfterBankAdd] = useState(false);

  // Request Withdrawal Modal State
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [withdrawNotes, setWithdrawNotes] = useState("");
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);

  // Export dropdown
  const [exportAnchorEl, setExportAnchorEl] = useState<HTMLElement | null>(null);

  const loadBankAccounts = async () => {
    if (!user?.clubId) return;
    try {
      const [accounts, banks] = await Promise.all([
        getClubBankAccounts().catch(() => []),
        getNigerianBanks().catch(() => []),
      ]);
      setBankAccounts(accounts);
      if (banks.length > 0) setBanksList(banks);
      if (accounts.length > 0) {
        const def = accounts.find((a) => a.isDefault) || accounts[0];
        if (def) {
          setSelectedBankAccountId(def.id);
          setBankName(def.bankName);
          setAccountNumber(def.accountNumber);
          setAccountName(def.accountName);
        }
      }
    } catch {
      setBankAccounts([]);
    }
  };

  const loadData = async () => {
    if (!user?.clubId) {
      setIsLoading(false);
      return;
    }
    try {
      const [regData, statsData, walletData, withdrawalsData, accountsData, banksData] = await Promise.all([
        getRegistrations({ clubId: user.clubId, take: 100, orderBy: 'updatedAt' }),
        getRegistrationStats({ clubId: user.clubId }),
        getClubWallet().catch(() => null),
        getMyWithdrawals().catch(() => ({ total: 0, items: [] })),
        getClubBankAccounts().catch(() => []),
        getNigerianBanks().catch(() => []),
      ]);
      setRegistrations(regData.items);
      setStats(statsData);
      if (walletData) {
        setWallet(walletData);
      } else if (statsData) {
        setWallet({
          id: 'fallback-wallet',
          clubId: user.clubId,
          currency: 'NGN',
          availableBalance: statsData.totalRevenue || 0,
          lockedBalance: 0,
          totalWithdrawn: 0,
          totalRevenue: statsData.totalRevenue || 0,
          updatedAt: new Date().toISOString(),
        });
      }
      setWithdrawals(withdrawalsData.items);
      setBankAccounts(accountsData);
      if (banksData.length > 0) setBanksList(banksData);
      if (accountsData.length > 0) {
        const def = accountsData.find((a: ClubBankAccount) => a.isDefault) || accountsData[0];
        if (def) {
          setSelectedBankAccountId(def.id);
          setBankName(def.bankName);
          setAccountNumber(def.accountNumber);
          setAccountName(def.accountName);
        }
      }
    } catch (err: any) {
      toast.error("Failed to load financial records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.clubId]);

  const resolveAccount = async (num: string, bankCode: string) => {
    if (num.length !== 10 || !bankCode) {
      setResolvedAccountName(null);
      setResolveError(null);
      return;
    }
    setIsResolvingAccount(true);
    setResolveError(null);
    try {
      const res = await resolveNigerianBankAccount(num, bankCode);
      if (res.verified && res.accountName) {
        setResolvedAccountName(res.accountName);
        setAccName(res.accountName);
        setResolveError(null);
      } else {
        setResolvedAccountName(null);
        setResolveError("Account name does not tally with the selected bank.");
      }
    } catch (err: any) {
      setResolvedAccountName(null);
      setResolveError(err.message || "Could not resolve bank account details.");
    } finally {
      setIsResolvingAccount(false);
    }
  };

  const handleBankChange = (bankCode: string) => {
    setSelectedBankCode(bankCode);
    const bankObj = banksList.find((b) => b.code === bankCode);
    if (bankObj) {
      setAccBankName(bankObj.name);
    }
    setResolvedAccountName(null);
    setResolveError(null);
    if (accNumber.trim().length === 10 && bankCode) {
      resolveAccount(accNumber.trim(), bankCode);
    }
  };

  const handleAccountNumberChange = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 10);
    setAccNumber(clean);
    setResolvedAccountName(null);
    setResolveError(null);
    if (clean.length === 10 && selectedBankCode) {
      resolveAccount(clean, selectedBankCode);
    }
  };

  const handleSelectAccount = (acc: ClubBankAccount) => {
    setSelectedBankAccountId(acc.id);
    setBankName(acc.bankName);
    setAccountNumber(acc.accountNumber);
    setAccountName(acc.accountName);
  };

  const handleSaveBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accBankName.trim() || !accNumber.trim() || !accName.trim()) {
      toast.error("Please fill in all bank account fields.");
      return;
    }
    if (accNumber.trim().length < 8) {
      toast.error("Please enter a valid account number.");
      return;
    }

    setIsSavingAccount(true);
    try {
      const created = await addClubBankAccount({
        bankName: accBankName.trim(),
        accountNumber: accNumber.trim(),
        accountName: accName.trim(),
        isDefault: accIsDefault,
      });
      toast.success("Bank account saved successfully!");
      setIsAddingAccount(false);
      setAccBankName("");
      setAccNumber("");
      setAccName("");
      setAccIsDefault(false);
      const updatedAccounts = await getClubBankAccounts();
      setBankAccounts(updatedAccounts);
      if (created) {
        setSelectedBankAccountId(created.id);
        setBankName(created.bankName);
        setAccountNumber(created.accountNumber);
        setAccountName(created.accountName);
      }
      if (isPendingWithdrawalAfterBankAdd) {
        setIsPendingWithdrawalAfterBankAdd(false);
        setIsBankModalOpen(false);
        setIsWithdrawModalOpen(true);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save bank account.");
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleSetDefaultAccount = async (acc: ClubBankAccount) => {
    try {
      await updateClubBankAccount(acc.id, { isDefault: true });
      toast.success(`${acc.bankName} set as default payout account.`);
      await loadBankAccounts();
    } catch (err: any) {
      toast.error(err.message || "Failed to update default account.");
    }
  };

  const handleDeleteAccount = async (accId: string) => {
    try {
      await deleteClubBankAccount(accId);
      toast.success("Bank account removed.");
      await loadBankAccounts();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove bank account.");
    }
  };

  const handleAmountChange = (val: string) => {
    const clean = val.replace(/,/g, "").replace(/[^\d.]/g, "");
    if (!clean) {
      setWithdrawAmount("");
      return;
    }
    const parts = clean.split(".");
    const intPart = parts[0] ? Number(parts[0]).toLocaleString("en-US") : "";
    const decPart = parts.length > 1 ? `.${parts[1]}` : "";
    setWithdrawAmount(`${intPart}${decPart}`);
  };

  const parsedWithdrawAmount = parseFloat(withdrawAmount.replace(/,/g, "")) || 0;
  const availableBalance = wallet?.availableBalance ?? (stats.totalRevenue || 0);
  const isAmountOverBalance = parsedWithdrawAmount > availableBalance;
  const isAmountBelowMin = parsedWithdrawAmount > 0 && parsedWithdrawAmount < 20000;
  const isWithdrawFormValid =
    parsedWithdrawAmount >= 20000 &&
    !isAmountOverBalance &&
    bankAccounts.length > 0 &&
    Boolean(selectedBankAccountId) &&
    bankName.trim().length > 0 &&
    accountNumber.trim().length >= 8 &&
    accountName.trim().length > 0;

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWithdrawFormValid || isSubmittingWithdrawal) return;

    setIsSubmittingWithdrawal(true);
    try {
      await requestWithdrawal({
        amount: parsedWithdrawAmount,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
        notes: withdrawNotes.trim() || undefined,
      });

      toast.success("Withdrawal request submitted successfully!");
      setIsWithdrawModalOpen(false);
      setWithdrawAmount("");
      setWithdrawNotes("");
      await loadData();
      setActiveTab("withdrawals");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit withdrawal request");
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  const uniqueTournaments = useMemo(() => {
    const names = new Set<string>();
    registrations.forEach(r => {
      if (r.tournament?.name) names.add(r.tournament.name);
    });
    return Array.from(names);
  }, [registrations]);

  const filteredRegistrations = useMemo(() => {
    return registrations.filter(txn => {
      if (statusFilter !== "All Status") {
        const mappedStatus = statusFilter === "Paid" ? "PAID" : statusFilter === "Pending" ? "UNPAID" : statusFilter === "Refunded" ? "REFUNDED" : statusFilter;
        if (txn.paymentStatus !== mappedStatus) return false;
      }

      if (methodFilter !== "All Methods") {
        const ref = txn.paymentReference;
        let txnMethod = "Credit Card";
        if (ref) {
          if (ref.startsWith("CASH")) txnMethod = "Cash";
          else if (ref.startsWith("BANK_TRANSFER") || ref.startsWith("TRANSFER")) txnMethod = "Bank Transfer";
        }
        if (txnMethod !== methodFilter) return false;
      }

      if (tournamentFilter !== "All Tournaments" && txn.tournament?.name !== tournamentFilter) return false;

      if (search) {
        const q = search.toLowerCase();
        const playerName = `${txn.user?.firstName} ${txn.user?.lastName}`.toLowerCase();
        const tName = txn.tournament?.name?.toLowerCase() || "";
        if (!playerName.includes(q) && !tName.includes(q) && !txn.id.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [debouncedSearch, statusFilter, methodFilter, tournamentFilter, registrations]);

  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter(req => {
      if (withdrawalStatusFilter !== "All Status") {
        const mapped = withdrawalStatusFilter === "Pending Review" ? "PENDING" : withdrawalStatusFilter === "Paid Out" ? "COMPLETED" : withdrawalStatusFilter === "Rejected" ? "REJECTED" : withdrawalStatusFilter;
        if (req.status !== mapped) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const matchesBank = req.bankName.toLowerCase().includes(q) || req.accountName.toLowerCase().includes(q);
        const matchesAcc = req.accountNumber.includes(q);
        if (!matchesBank && !matchesAcc) return false;
      }
      return true;
    });
  }, [search, withdrawalStatusFilter, withdrawals]);

  return (
    <div className="space-y-8 w-full max-w-full px-2 pb-10 font-sans">
      {/* 4 Stat Cards */}
      <div className="w-full bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-x-auto">
        <div className="flex items-center justify-between p-8 min-w-max gap-12 font-sans">

          {/* Card 1: Available Balance */}
          <div className="flex flex-col justify-start items-start gap-3.5 flex-1 min-w-[220px]">
            <div className="flex justify-start items-center gap-3.5">
              <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Available for Withdrawal</div>
            </div>
            <div className="text-[#15803D] text-3xl font-bold">{formatCurrency(wallet?.availableBalance || 0)}</div>
            <div className="text-zinc-500 text-sm font-normal">Ready for instant payout</div>
          </div>

          <div className="w-px h-16 bg-slate-200" />

          {/* Card 2: Locked Balance */}
          <div className="flex flex-col justify-start items-start gap-3.5 flex-1 min-w-[220px]">
            <div className="flex justify-start items-center gap-3.5">
              <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">In-Flight / Locked</div>
              {wallet?.lockedBalance && wallet.lockedBalance > 0 ? (
                <div className="px-2 py-1 bg-emerald-50 rounded-lg flex justify-center items-center gap-1 shrink-0 whitespace-nowrap">
                  <Clock className="w-3.5 h-3.5 text-[#15803D]" />
                  <div className="text-[#15803D] text-xs font-medium">In Review</div>
                </div>
              ) : null}
            </div>
            <div className="text-[#15803D] text-3xl font-bold">{formatCurrency(wallet?.lockedBalance || 0)}</div>
            <div className="text-zinc-500 text-sm font-normal">Pending Super Admin review</div>
          </div>

          <div className="w-px h-16 bg-slate-200" />

          {/* Card 3: Total Withdrawn */}
          <div className="flex flex-col justify-start items-start gap-3.5 flex-1 min-w-[220px]">
            <div className="flex justify-start items-center gap-3.5">
              <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Total Paid Out</div>
            </div>
            <div className="text-[#15803D] text-3xl font-bold">{formatCurrency(wallet?.totalWithdrawn || 0)}</div>
            <div className="text-zinc-500 text-sm font-normal">Settled to bank</div>
          </div>

          <div className="w-px h-16 bg-slate-200" />

          {/* Card 4: Gross Revenue */}
          <div className="flex flex-col justify-start items-start gap-3.5 flex-1 min-w-[220px]">
            <div className="flex justify-start items-center gap-3.5">
              <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Gross Revenue</div>
            </div>
            <div className="text-[#15803D] text-3xl font-bold">{formatCurrency(stats.totalRevenue || (wallet?.totalRevenue || 0))}</div>
            <div className="text-zinc-500 text-sm font-normal">All Time</div>
          </div>

        </div>
      </div>

      {/* Main Content - Table Area */}
      <div className="w-full space-y-6">
        <Card className="border-none shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
            <CardTitle className="text-zinc-700 text-xl font-medium whitespace-nowrap">
              {activeTab === "transactions" ? "All Transactions" : "Withdrawal Requests"}
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
                    if (activeTab === "transactions") {
                      exportToCsv(
                        filteredRegistrations,
                        [
                          { header: "Player", key: "user.firstName" },
                          { header: "Tournament", key: "tournament.name" },
                          { header: "Amount", key: "tournament.entryFee" },
                          { header: "Status", key: "paymentStatus" },
                          { header: "Date", key: "registeredAt" },
                          { header: "Reference", key: "paymentReference" },
                        ],
                        "tournament-payments.csv"
                      );
                    } else {
                      exportToCsv(
                        filteredWithdrawals,
                        [
                          { header: "Amount", key: "amount" },
                          { header: "Bank", key: "bankName" },
                          { header: "Account Number", key: "accountNumber" },
                          { header: "Account Name", key: "accountName" },
                          { header: "Status", key: "status" },
                          { header: "Date", key: "createdAt" },
                          { header: "Reference", key: "reference" },
                        ],
                        "withdrawals-history.csv"
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
                    if (activeTab === "transactions") {
                      exportToPdf(
                        filteredRegistrations,
                        [
                          { header: "Player", key: "user.firstName" },
                          { header: "Tournament", key: "tournament.name" },
                          { header: "Amount", key: "tournament.entryFee" },
                          { header: "Status", key: "paymentStatus" },
                        ],
                        "tournament-payments.pdf",
                        "Tournament Payments"
                      );
                    } else {
                      exportToPdf(
                        filteredWithdrawals,
                        [
                          { header: "Amount", key: "amount" },
                          { header: "Bank", key: "bankName" },
                          { header: "Account No", key: "accountNumber" },
                          { header: "Status", key: "status" },
                        ],
                        "withdrawals-history.pdf",
                        "Withdrawal History"
                      );
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] hover:text-gray-900 transition-colors text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <FileText className="w-4 h-4 text-rose-600" />
                  Export PDF
                </button>
              </FloatingMenu>

              {activeTab === "withdrawals" && (
                <>
                  <Button
                    onClick={() => {
                      setIsBankModalOpen(true);
                      setIsAddingAccount(false);
                    }}
                    variant="outline"
                    className="group h-10 border-slate-800 text-slate-800 hover:bg-slate-800 hover:text-white bg-transparent gap-2 rounded-lg px-3.5 text-[14px] font-normal transition-all cursor-pointer"
                  >
                    <Building2 className="w-4 h-4 text-slate-800 group-hover:text-white transition-colors" />
                    <span>Add Bank Account</span>
                    {bankAccounts.length > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700 group-hover:bg-slate-700 group-hover:text-white rounded-full transition-colors">
                        {bankAccounts.length}/2
                      </span>
                    )}
                  </Button>

                  <Button
                    onClick={() => {
                      if (bankAccounts.length === 0) {
                        toast.info("Please add a payout bank account to proceed with withdrawals.");
                        setIsPendingWithdrawalAfterBankAdd(true);
                        setIsAddingAccount(true);
                        setIsBankModalOpen(true);
                        return;
                      }
                      const def = bankAccounts.find((a) => a.isDefault) || bankAccounts[0];
                      if (def) {
                        setSelectedBankAccountId(def.id);
                        setBankName(def.bankName);
                        setAccountNumber(def.accountNumber);
                        setAccountName(def.accountName);
                      }
                      setIsWithdrawModalOpen(true);
                    }}
                    className="h-10 bg-[#15803D] hover:bg-[#166534] border border-openclub-800/30 text-white gap-2 rounded-lg px-4 text-[14px] font-normal"
                  >
                    <Banknote className="w-4 h-4" /> Request Withdrawal
                  </Button>
                </>
              )}
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
                        placeholder={activeTab === "transactions" ? "Search player name, tournament, reference..." : "Search bank, account number, name..."}
                        className="pl-10 h-11 rounded-lg text-[14px] border-[#e1efe5] bg-white text-[#15803D] focus:bg-white placeholder:text-[#15803D]/60"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-4 ml-auto">
                      {activeTab === "transactions" ? (
                        <>
                          <SearchableSelect
                            value={statusFilter}
                            onValueChange={(v) => setStatusFilter(v)}
                            options={["All Status", "Paid", "Pending", "Refunded"].map((v) => ({ value: v, label: v }))}
                            className="min-w-[160px]"
                            triggerClassName="h-11 bg-white border-[#e1efe5] text-[#15803D] font-medium"
                            placeholder="All Status"
                          />
                          <SearchableSelect
                            value={methodFilter}
                            onValueChange={(v) => setMethodFilter(v)}
                            options={["All Methods", "Credit Card", "Bank Transfer", "Cash"].map((v) => ({ value: v, label: v }))}
                            className="min-w-[160px]"
                            triggerClassName="h-11 bg-white border-[#e1efe5] text-[#15803D] font-medium"
                            placeholder="All Methods"
                          />
                          {uniqueTournaments.length > 0 && (
                            <SearchableSelect
                              value={tournamentFilter}
                              onValueChange={(v) => setTournamentFilter(v)}
                              options={["All Tournaments", ...uniqueTournaments].map((v) => ({ value: v, label: v }))}
                              className="min-w-[180px]"
                              triggerClassName="h-11 bg-white border-[#e1efe5] text-[#15803D] font-medium"
                              placeholder="All Tournaments"
                            />
                          )}
                        </>
                      ) : (
                        <SearchableSelect
                          value={withdrawalStatusFilter}
                          onValueChange={(v) => setWithdrawalStatusFilter(v)}
                          options={["All Status", "Pending Review", "Paid Out", "Rejected"].map((v) => ({ value: v, label: v }))}
                          className="min-w-[180px]"
                          triggerClassName="h-11 bg-white border-[#e1efe5] text-[#15803D] font-medium"
                          placeholder="All Status"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Table View */}
                <div className="w-full overflow-x-auto min-h-[400px]">
                  {activeTab === "transactions" ? (
                    <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                      <thead>
                        <tr className="bg-[#f5faf6] border-b border-[#e1efe5] text-[10px] font-normal text-[#15803D] uppercase tracking-wider">
                          <th className="px-6 py-4">PLAYER</th>
                          <th className="px-6 py-4">TOURNAMENT</th>
                          <th className="px-6 py-4">DATE & TIME</th>
                          <th className="px-6 py-4">PAYMENT METHOD</th>
                          <th className="px-6 py-4">STATUS</th>
                          <th className="px-6 py-4 text-right">AMOUNT PAID</th>
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
                                    <span className="text-[13px] text-gray-800 font-medium truncate leading-tight">{txn.tournament?.name || "Tournament"}</span>
                                    <span className="text-[11px] text-gray-400 font-mono mt-0.5">{txn.id.substring(0, 16)}</span>
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
                                  <span className="text-slate-900 text-[14px] font-bold text-[#15803D] whitespace-nowrap">
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
                  ) : (
                    <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                      <thead>
                        <tr className="bg-[#f5faf6] border-b border-[#e1efe5] text-[10px] font-normal text-[#15803D] uppercase tracking-wider">
                          <th className="px-6 py-4">BANK & ACCOUNT</th>
                          <th className="px-6 py-4">AMOUNT</th>
                          <th className="px-6 py-4">REQUESTED DATE</th>
                          <th className="px-6 py-4">PAYOUT STATUS</th>
                          <th className="px-6 py-4">TRANSFER REFERENCE</th>
                          <th className="px-6 py-4 text-center">ACTION</th>
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
                                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-openclub-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform border border-[#e1efe5] font-semibold">
                                    <Building2 className="w-5 h-5 text-[#15803D]" />
                                  </div>
                                  <div className="flex flex-col min-w-0 gap-0.5">
                                    <span className="text-slate-900 text-[14px] font-medium truncate leading-tight">{req.bankName}</span>
                                    <span className="text-gray-500 text-[12px] font-mono truncate mt-0.5">{req.accountNumber} • {req.accountName}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <span className="text-slate-900 text-[14px] font-medium text-[#15803D]">{formatCurrency(req.amount)}</span>
                              </td>
                              <td className="px-6 py-5">
                                <span className="text-[13px] text-gray-600 font-medium">{formatDate(req.createdAt)}</span>
                              </td>
                              <td className="px-6 py-5">
                                <StatusPill status={req.status} />
                              </td>
                              <td className="px-6 py-5">
                                <span className="text-[12px] font-mono text-gray-600">{req.reference || "—"}</span>
                              </td>
                              <td className="px-6 py-5 text-center">
                                <button
                                  onClick={() => setSelectedWithdrawal(req)}
                                  className="h-8 px-3 inline-flex items-center justify-center gap-1.5 rounded-md bg-[#15803D] text-white hover:bg-openclub-800 transition-colors border border-[#15803D] shadow-sm"
                                  title="View Details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span className="text-[12px] font-medium leading-none whitespace-nowrap">View Details</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Table Footer with Pagination */}
                <div className="p-4 border-t border-[#e1efe5] flex items-center justify-between">
                  <div className="text-xs text-gray-500 font-normal">
                    Showing {activeTab === "transactions"
                      ? `${Math.min(filteredRegistrations.length, (page - 1) * perPage + 1)} to ${Math.min(filteredRegistrations.length, page * perPage)} of ${filteredRegistrations.length} transactions`
                      : `${Math.min(filteredWithdrawals.length, (withdrawalPage - 1) * perPage + 1)} to ${Math.min(filteredWithdrawals.length, withdrawalPage * perPage)} of ${filteredWithdrawals.length} withdrawals`
                    }
                  </div>
                  {activeTab === "transactions" ? (
                    filteredRegistrations.length > perPage && (
                      <Pagination
                        currentPage={page}
                        totalPages={Math.ceil(filteredRegistrations.length / perPage)}
                        onPageChange={setPage}
                      />
                    )
                  ) : (
                    filteredWithdrawals.length > perPage && (
                      <Pagination
                        currentPage={withdrawalPage}
                        totalPages={Math.ceil(filteredWithdrawals.length / perPage)}
                        onPageChange={setWithdrawalPage}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* COMPACT MODAL: REQUEST WITHDRAWAL */}
      <Modal
        isOpen={isWithdrawModalOpen}
        onClose={() => !isSubmittingWithdrawal && setIsWithdrawModalOpen(false)}
        title="Request Payout Withdrawal"
        className="max-w-md"
      >
        <form onSubmit={handleWithdrawSubmit} className="space-y-5 font-sans text-left">
          {/* Balance Banner */}
          <div className="bg-[#f5faf6] border border-[#e1efe5] rounded-2xl p-4 sm:p-4.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#e1efe5] text-[#15803D] flex items-center justify-center shrink-0 shadow-xs">
                <Wallet className="w-5 h-5 text-[#15803D]" />
              </div>
              <div>
                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Available Balance</p>
                <p className="text-lg font-bold text-[#15803D] leading-tight">{formatCurrency(availableBalance)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWithdrawAmount(availableBalance > 0 ? availableBalance.toLocaleString("en-US") : "0")}
              className="h-8 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#15803D] text-white hover:bg-[#116731] transition-all text-xs font-semibold shadow-xs active:scale-95 cursor-pointer"
            >
              Withdraw Max
            </button>
          </div>

          {/* Amount Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-800">
              Withdrawal Amount (₦) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="e.g. 50,000"
                value={withdrawAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className={cn(
                  "h-11 rounded-xl text-sm font-medium px-4 pr-16 bg-white border-[#e1efe5]",
                  (isAmountOverBalance || isAmountBelowMin) && "border-red-500 focus:border-red-500"
                )}
                required
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                NGN
              </span>
            </div>

            {isAmountOverBalance && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 mt-2 font-normal">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Amount exceeds your available balance of {formatCurrency(availableBalance)}
              </div>
            )}
            {isAmountBelowMin && (
              <p className="text-xs text-red-600 mt-2 font-normal">
                Minimum withdrawal amount is ₦20,000
              </p>
            )}
          </div>

          {/* Destination Bank Account Selection */}
          {bankAccounts.length > 0 ? (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-800">
                  Select Destination Bank Account *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsWithdrawModalOpen(false);
                    setIsBankModalOpen(true);
                  }}
                  className="text-[11px] text-[#15803D] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Building2 className="w-3 h-3" /> Manage Accounts ({bankAccounts.length}/2)
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {bankAccounts.map((acc) => {
                  const isSelected = selectedBankAccountId === acc.id;
                  return (
                    <div
                      key={acc.id}
                      onClick={() => handleSelectAccount(acc)}
                      className={cn(
                        "cursor-pointer rounded-xl p-3.5 sm:p-4 border transition-all flex items-center justify-between",
                        isSelected
                          ? "bg-emerald-50/70 border-[#15803D] ring-1 ring-[#15803D] shadow-xs"
                          : "bg-white border-[#e1efe5] hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-xs",
                            isSelected
                              ? "bg-[#15803D] text-white"
                              : "bg-emerald-50 text-[#15803D]"
                          )}
                        >
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-900 truncate">{acc.bankName}</span>
                            {acc.isDefault && (
                              <span className="text-[10px] uppercase font-bold bg-emerald-100 text-[#15803D] px-1.5 py-0.5 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-mono font-medium text-gray-700 mt-0.5">
                            {acc.accountNumber} <span className="text-gray-400 font-sans font-normal">•</span> <span className="font-sans font-normal text-gray-600 truncate">{acc.accountName}</span>
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 ml-3">
                        <div
                          className={cn(
                            "w-4 h-4 rounded-full border flex items-center justify-center",
                            isSelected
                              ? "border-[#15803D] bg-[#15803D]"
                              : "border-gray-300 bg-white"
                          )}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-[#f5faf6] rounded-2xl border border-[#e1efe5] p-5 text-center space-y-3.5 my-1">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#e1efe5] text-[#15803D] flex items-center justify-center mx-auto shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-gray-900">No Payout Account Found</h4>
                <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                  You need to link a verified corporate bank account before requesting a payout.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => {
                  setIsWithdrawModalOpen(false);
                  setIsPendingWithdrawalAfterBankAdd(true);
                  setIsAddingAccount(true);
                  setIsBankModalOpen(true);
                }}
                className="h-9.5 bg-[#15803D] hover:bg-[#116731] text-white text-xs font-semibold px-4.5 rounded-xl gap-1.5 mx-auto shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Payout Account
              </Button>
            </div>
          )}

          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-medium text-gray-700">Notes (Optional)</label>
            <Input
              placeholder="e.g. Tournament payout batch #1"
              value={withdrawNotes}
              onChange={(e) => setWithdrawNotes(e.target.value)}
              className="h-10.5 rounded-xl text-xs font-normal bg-white border-[#e1efe5] px-3.5"
            />
          </div>

          {/* Security Notice */}
          <div className="bg-amber-50/80 border border-amber-200/70 rounded-xl p-3.5 text-[11px] text-amber-800 flex items-start gap-2.5 my-1 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="font-normal">
              Requested funds are locked atomically and reviewed by Super Admin. Payouts are typically disbursed within 24 business hours.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmittingWithdrawal}
              onClick={() => setIsWithdrawModalOpen(false)}
              className="h-10 rounded-xl text-xs font-medium px-4.5 border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isWithdrawFormValid || isSubmittingWithdrawal}
              className="h-10 rounded-xl bg-[#15803D] hover:bg-[#116731] text-white text-xs font-semibold px-5.5 gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingWithdrawal ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: MANAGE PAYOUT BANK ACCOUNTS (MAX 2) */}
      <Modal
        isOpen={isBankModalOpen}
        onClose={() => {
          setIsBankModalOpen(false);
          setIsAddingAccount(false);
        }}
        title="Payout Bank Accounts"
        className="max-w-md"
      >
        <div className="space-y-5 text-left font-sans text-sm">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-500 font-normal">
                Save up to 2 verified accounts for 1-click payout withdrawals.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-[#15803D] rounded-lg border border-emerald-200/50">
              {bankAccounts.length} / 2 Added
            </span>
          </div>

          {/* List of saved accounts */}
          <div className="space-y-3">
            {bankAccounts.map((acc) => (
              <div
                key={acc.id}
                className="bg-[#f5faf6] rounded-2xl border border-[#e1efe5] p-4 flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#e1efe5] text-[#15803D] flex items-center justify-center shrink-0 shadow-xs">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-900 truncate">{acc.bankName}</span>
                      {acc.isDefault && (
                        <span className="text-[10px] font-bold bg-[#15803D] text-white px-1.5 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono font-medium text-gray-700 mt-0.5">
                      {acc.accountNumber}
                    </p>
                    <p className="text-[11px] text-gray-500 font-normal truncate max-w-[200px]">
                      {acc.accountName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {!acc.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefaultAccount(acc)}
                      className="px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 hover:text-[#15803D] hover:bg-white rounded-lg border border-transparent hover:border-[#e1efe5] transition-colors cursor-pointer"
                      title="Set as Default Account"
                    >
                      Make Default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteAccount(acc.id)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Account Form / Button */}
          {isAddingAccount ? (
            <form onSubmit={handleSaveBankAccount} className="bg-[#f5faf6] rounded-2xl border border-[#e1efe5] p-4.5 sm:p-5 space-y-4 shadow-xs">
              <div className="pb-2.5 border-b border-[#e1efe5]">
                <h4 className="text-xs font-bold text-gray-900">Add New Payout Account</h4>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-800">Select Bank *</label>
                {banksList.length > 0 ? (
                  <SearchableSelect
                    value={selectedBankCode}
                    onValueChange={(code) => handleBankChange(code)}
                    options={banksList.map((b) => ({ value: b.code, label: b.name }))}
                    placeholder="Choose your bank..."
                    triggerClassName="h-10 rounded-xl text-xs bg-white border-[#e1efe5] text-gray-900 px-3.5"
                  />
                ) : (
                  <Input
                    placeholder="e.g. GTBank, Zenith Bank, Access Bank"
                    value={accBankName}
                    onChange={(e) => {
                      setAccBankName(e.target.value);
                      setSelectedBankCode(e.target.value);
                    }}
                    className="h-10 rounded-xl text-xs bg-white border-[#e1efe5] px-3.5"
                    required
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-gray-800">10-Digit Account Number *</label>
                  {isResolvingAccount && (
                    <span className="text-[11px] font-medium text-[#15803D] flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" /> Verifying...
                    </span>
                  )}
                </div>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 0123456789"
                  value={accNumber}
                  onChange={(e) => handleAccountNumberChange(e.target.value)}
                  maxLength={10}
                  className="h-10 rounded-xl text-xs font-mono bg-white border-[#e1efe5] px-3.5"
                  required
                />
              </div>

              {/* Real-time Verification Feedback Banner */}
              {resolvedAccountName && (
                <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-xl p-3.5 flex items-center gap-2.5 shadow-xs">
                  <CheckCircle className="w-4 h-4 text-[#15803D] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-[#15803D] tracking-wider">Verified Account Name</p>
                    <p className="text-xs font-bold text-gray-900 truncate mt-0.5">{resolvedAccountName}</p>
                  </div>
                </div>
              )}

              {resolveError && (
                <div className={cn(
                  "border rounded-xl p-3.5 flex items-start gap-2.5 shadow-xs",
                  user?.role === "SUPER_ADMIN" ? "bg-amber-50/80 border-amber-200" : "bg-rose-50/80 border-rose-200"
                )}>
                  <AlertTriangle className={cn("w-4 h-4 shrink-0 mt-0.5", user?.role === "SUPER_ADMIN" ? "text-amber-600" : "text-rose-600")} />
                  <div className="space-y-1 min-w-0">
                    <p className={cn("text-xs font-semibold", user?.role === "SUPER_ADMIN" ? "text-amber-900" : "text-rose-900")}>
                      {user?.role === "SUPER_ADMIN" ? "Corporate Account Verification Notice" : "Corporate Account Verification Required"}
                    </p>
                    <p className={cn("text-[11px] leading-relaxed", user?.role === "SUPER_ADMIN" ? "text-amber-800" : "text-rose-700")}>
                      {user?.role === "SUPER_ADMIN"
                        ? `The provided account details do not match the registered organization name on record. As a Super Admin, you have administrative override privileges to proceed and update this account directly.`
                        : `The account number does not tally with the organization name you registered with. For compliance and accounting integrity, payout disbursements must be paid into a verified corporate or Organizer bank account.`}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-800">Account Holder Name *</label>
                <Input
                  placeholder={isResolvingAccount ? "Resolving verified name..." : "Auto-filled upon 10-digit NUBAN verification"}
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  readOnly={user?.role !== "SUPER_ADMIN"}
                  className={cn(
                    "h-10 rounded-xl text-xs border-[#e1efe5] transition-all px-3.5",
                    user?.role !== "SUPER_ADMIN"
                      ? "bg-slate-50 text-gray-800 font-semibold cursor-not-allowed select-none"
                      : "bg-white text-gray-900 font-medium"
                  )}
                  required
                />
                <p className="text-[11px] text-gray-500 font-normal mt-1 leading-normal">
                  Account holder name is securely verified and auto-populated from official banking switch records.
                </p>
              </div>

              {bankAccounts.length > 0 && (
                <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={accIsDefault}
                    onChange={(e) => setAccIsDefault(e.target.checked)}
                    className="w-4 h-4 text-[#15803D] rounded border-gray-300 focus:ring-[#15803D]"
                  />
                  <span className="text-xs text-gray-700 font-medium">Set as default payout account</span>
                </label>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#e1efe5]/80 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddingAccount(false);
                    setResolvedAccountName(null);
                    setResolveError(null);
                  }}
                  className="h-9 rounded-xl text-xs font-medium px-4 border-gray-200 text-gray-700 hover:bg-white cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    isSavingAccount ||
                    (isResolvingAccount && user?.role !== "SUPER_ADMIN") ||
                    !accBankName.trim() ||
                    accNumber.trim().length !== 10 ||
                    !accName.trim() ||
                    (Boolean(resolveError) && user?.role !== "SUPER_ADMIN")
                  }
                  className="h-9 rounded-xl bg-[#15803D] hover:bg-[#116731] text-white text-xs font-semibold px-5 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingAccount ? "Saving..." : (user?.role === "SUPER_ADMIN" && resolveError) ? "Save Account (Admin Override)" : "Save Account"}
                </Button>
              </div>
            </form>
          ) : (
            bankAccounts.length < 2 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedBankCode("");
                  setAccBankName("");
                  setAccNumber("");
                  setAccName("");
                  setResolvedAccountName(null);
                  setResolveError(null);
                  setAccIsDefault(bankAccounts.length === 0);
                  setIsAddingAccount(true);
                }}
                className="w-full h-11 border-dashed border-[#15803D]/50 text-[#15803D] hover:bg-emerald-50/60 rounded-xl text-xs font-semibold gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" /> Add Payout Account ({bankAccounts.length}/2)
              </Button>
            )
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end pt-4 border-t border-gray-100 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsBankModalOpen(false);
                setIsAddingAccount(false);
              }}
              className="h-10 rounded-xl text-xs font-medium px-5 border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

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
              <h3 className="text-2xl font-bold text-[#15803D]">
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

      {/* DETAIL MODAL: VIEW WITHDRAWAL */}
      <Modal
        isOpen={selectedWithdrawal !== null}
        onClose={() => setSelectedWithdrawal(null)}
        title="Withdrawal Details"
        className="max-w-md"
      >
        {selectedWithdrawal && (
          <div className="space-y-4 text-left font-sans text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-xs text-gray-500 font-medium">Request Status</span>
              <StatusPill status={selectedWithdrawal.status} />
            </div>

            {/* Encapsulated Withdrawal Details Card */}
            <div className="bg-[#f5faf6] rounded-xl border border-[#e1efe5] p-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-[#e1efe5]/60">
                <span className="text-gray-500 font-medium">Amount Requested:</span>
                <span className="text-base font-medium text-gray-900">{formatCurrency(selectedWithdrawal.amount)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#e1efe5]/60">
                <span className="text-gray-500 font-medium">Bank:</span>
                <span className="font-medium text-gray-800">{selectedWithdrawal.bankName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#e1efe5]/60">
                <span className="text-gray-500 font-medium">Account Number:</span>
                <span className="font-mono font-medium text-gray-800">{selectedWithdrawal.accountNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#e1efe5]/60">
                <span className="text-gray-500 font-medium">Account Name:</span>
                <span className="font-medium text-gray-800">{selectedWithdrawal.accountName}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500 font-medium">Requested On:</span>
                <span className="text-gray-700 font-normal">{formatDate(selectedWithdrawal.createdAt)}</span>
              </div>
              {selectedWithdrawal.reference && (
                <div className="flex justify-between pt-1 border-t border-[#e1efe5]/60">
                  <span className="text-gray-500 font-medium">Payout Reference:</span>
                  <span className="font-mono font-bold text-[#15803D]">{selectedWithdrawal.reference}</span>
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
