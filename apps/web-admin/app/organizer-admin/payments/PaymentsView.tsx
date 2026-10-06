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
  Loader2,
  Copy,
  XCircle,
  Lock,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { cn, formatCurrency, formatNumber, toTitleCase, broadcastAdminEvent, subscribeAdminEvents } from "@/lib/utils";
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
import { BankLogo } from "@/components/ui/bank-logo";
import { getBankLogoUrl } from "@/lib/bank-logos";
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

interface OrganizerPaymentsViewProps {
  initialTab?: "transactions" | "withdrawals";
}

export function OrganizerPaymentsView({ initialTab = "transactions" }: OrganizerPaymentsViewProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"transactions" | "withdrawals">(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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

  const registeredClubName = user?.club?.name || user?.name || "";
  const isNameTally = useMemo(() => {
    if (!resolvedAccountName || !registeredClubName) return true;
    const clean = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9]/g, " ")
        .replace(/\b(limited|ltd|plc|club|country|golf|international|nigeria|ng|integrated|services|enterprises)\b/g, "")
        .trim();
    const rWords = clean(resolvedAccountName).split(/\s+/).filter((w) => w.length > 2);
    const regWords = clean(registeredClubName).split(/\s+/).filter((w) => w.length > 2);
    if (rWords.length === 0 || regWords.length === 0) return true;
    return rWords.some((w) => regWords.some((reg) => reg.includes(w) || w.includes(reg)));
  }, [resolvedAccountName, registeredClubName]);

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
  const [accountToDelete, setAccountToDelete] = useState<ClubBankAccount | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

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
      } else {
        setSelectedBankAccountId("");
        setBankName("");
        setAccountNumber("");
        setAccountName("");
      }
    } catch {
      setBankAccounts([]);
      setSelectedBankAccountId("");
      setBankName("");
      setAccountNumber("");
      setAccountName("");
    }
  };

  const loadData = async () => {
    if (!user?.clubId) {
      setIsLoading(false);
      return;
    }
    try {
      const [regData, statsData, walletData, withdrawalsData, accountsData, banksData] = await Promise.all([
        getRegistrations({ clubId: user.clubId, take: 1000, orderBy: 'updatedAt' }).catch(() => ({ total: 0, items: [] })),
        getRegistrationStats({ clubId: user.clubId }).catch(() => ({ totalTransactions: 0, totalRevenue: 0, pendingAmount: 0, refundsAmount: 0, transactionsChange: 0, revenueChange: 0 })),
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
  }, [user?.clubId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("action") === "withdraw") {
        setActiveTab("withdrawals");
        if (!isLoading) {
          if (bankAccounts.length === 0) {
            toast.info("Please add a payout bank account to proceed with withdrawals.");
            setIsPendingWithdrawalAfterBankAdd(true);
            setIsAddingAccount(true);
            setIsBankModalOpen(true);
          } else {
            const def = bankAccounts.find((a) => a.isDefault) || bankAccounts[0];
            if (def) {
              setSelectedBankAccountId(def.id);
              setBankName(def.bankName);
              setAccountNumber(def.accountNumber);
              setAccountName(def.accountName);
            }
            setIsWithdrawModalOpen(true);
          }
        }
      }
    }
  }, [isLoading, bankAccounts]);

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

  const handleDeleteAccount = (acc: ClubBankAccount) => {
    setAccountToDelete(acc);
  };

  const handleConfirmDelete = async () => {
    if (!accountToDelete) return;
    setIsDeletingAccount(true);
    try {
      await deleteClubBankAccount(accountToDelete.id);
      toast.success("Bank account removed.");
      await loadBankAccounts();
      setAccountToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to remove bank account.");
    } finally {
      setIsDeletingAccount(false);
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
      broadcastAdminEvent("withdrawal-requested", { amount: parsedWithdrawAmount });
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
          {activeTab === "transactions" ? (
            <>
              {/* Card 1: Gross Revenue */}
              <div className="flex flex-col justify-start items-start gap-3.5 flex-1 min-w-[220px]">
                <div className="flex justify-start items-center gap-3.5">
                  <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Gross Revenue</div>
                  {stats.revenueChange !== 0 && <TrendBadge value={stats.revenueChange} />}
                </div>
                <div className="text-[#15803D] text-3xl font-bold">{formatCurrency(stats.totalRevenue || (wallet?.totalRevenue || 0))}</div>
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
                <div className="text-zinc-500 text-sm font-normal">Pending review</div>
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
            </>
          )}
        </div>
      </div>

      {/* Main Content - Table Area */}
      <div className="w-full space-y-6">
        <Card className="border-none shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
            {activeTab === "transactions" ? (
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
            ) : (
              <div className="inline-flex items-center bg-[#f5faf6] border border-[#e1efe5] p-1.5 rounded-2xl gap-1 overflow-x-auto max-w-full">
                {["All Requests", "Pending Review", "Paid Out", "Rejected"].map((tab) => {
                  const isActive =
                    (tab === "All Requests" && (withdrawalStatusFilter === "All Status" || withdrawalStatusFilter === "All Requests")) ||
                    withdrawalStatusFilter === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setWithdrawalStatusFilter(tab === "All Requests" ? "All Status" : tab);
                        setWithdrawalPage(1);
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
            )}

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
                    className="h-10 bg-[#f5faf6] hover:bg-[#eaf7ee] border-[#e1efe5] hover:border-[#C6F0DB] text-slate-800 hover:text-slate-900 gap-2 rounded-lg px-4 text-[14px] font-semibold transition-all cursor-pointer shadow-xs"
                  >
                    <Building2 className="w-4 h-4 text-slate-700" />
                    <span>Add Bank Account</span>
                    {bankAccounts.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-[11px] font-bold bg-white border border-[#e1efe5] text-slate-700 rounded-full">
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
                    className="h-10 bg-[#15803D] hover:bg-[#166534] border border-openclub-800/30 text-white gap-2 rounded-lg px-4 text-[14px] font-medium cursor-pointer shadow-xs transition-colors"
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
                      ) : null}
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
                                    <span className="text-[12px] text-gray-500 font-normal truncate mt-0.5">{txn.id.substring(0, 16)}</span>
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
                  ) : (
                    <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                      <thead>
                        <tr className="bg-[#f5faf6] border-b border-[#e1efe5] text-[10px] font-normal text-[#15803D] uppercase tracking-wider">
                          <th className="px-6 py-4">DESTINATION ACCOUNT</th>
                          <th className="px-6 py-4">AMOUNT</th>
                          <th className="px-6 py-4">REQUESTED ON</th>
                          <th className="px-6 py-4">PAYOUT STATUS</th>
                          <th className="px-6 py-4 text-center">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e1efe5]">
                        {filteredWithdrawals.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-16 text-center text-gray-400 font-normal text-[13px]">
                              <Banknote className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#15803D]" />
                              No withdrawal requests found matching your filter
                            </td>
                          </tr>
                        ) : (
                          filteredWithdrawals.slice((withdrawalPage - 1) * perPage, withdrawalPage * perPage).map((req) => (
                            <tr key={req.id} className="hover:bg-background/50 transition-colors group">
                              {/* 1. DESTINATION ACCOUNT */}
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

                              {/* 2. AMOUNT */}
                              <td className="px-6 py-5">
                                <span className="text-slate-900 text-[14px] font-medium whitespace-nowrap">
                                  {formatCurrency(req.amount)}
                                </span>
                              </td>

                              {/* 3. REQUESTED ON */}
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

                              {/* 4. PAYOUT STATUS */}
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

                              {/* 5. ACTION */}
                              <td className="px-6 py-5 text-center">
                                <button
                                  type="button"
                                  onClick={() => setSelectedWithdrawal(req)}
                                  className="h-8 px-3.5 inline-flex items-center justify-center gap-2 rounded-lg border border-[#e1efe5] bg-white hover:bg-slate-50 text-gray-700 text-xs font-medium shadow-2xs transition-colors cursor-pointer"
                                  title="View Details"
                                >
                                  <Eye className="w-3.5 h-3.5 text-gray-500" />
                                  <span>View Details</span>
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
                    Showing{" "}
                    <strong className="font-medium text-gray-900">
                      {activeTab === "transactions"
                        ? filteredRegistrations.length === 0
                          ? "0"
                          : `${(page - 1) * perPage + 1}–${Math.min(page * perPage, filteredRegistrations.length)}`
                        : filteredWithdrawals.length === 0
                          ? "0"
                          : `${(withdrawalPage - 1) * perPage + 1}–${Math.min(withdrawalPage * perPage, filteredWithdrawals.length)}`}
                    </strong>{" "}
                    of {activeTab === "transactions" ? `${filteredRegistrations.length} transactions` : `${filteredWithdrawals.length} withdrawals`}
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

      {/* MODAL: REQUEST WITHDRAWAL */}
      <Modal
        isOpen={isWithdrawModalOpen}
        onClose={() => !isSubmittingWithdrawal && setIsWithdrawModalOpen(false)}
        title={
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EAF7EE] border border-[#C6F0DB] flex items-center justify-center text-[#009A60] shrink-0 shadow-2xs">
              <Banknote className="w-4.5 h-4.5 text-[#009A60]" />
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">Request Payout Withdrawal</span>
          </div>
        }
        className="max-w-md rounded-[28px] sm:rounded-[32px] overflow-hidden"
      >
        <form onSubmit={handleWithdrawSubmit} className="space-y-4 font-sans text-left">
          {/* Balance Banner */}
          <div className="bg-[#F5FAF6] border border-[#E1EFE5] rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white border border-[#E1EFE5] flex items-center justify-center text-[#009A60] shrink-0 shadow-2xs">
                <Wallet className="w-5 h-5 text-[#009A60] fill-[#009A60]" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AVAILABLE BALANCE</p>
                <p className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">
                  {formatCurrency(availableBalance).replace(/\.00$/, "")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWithdrawAmount(availableBalance > 0 ? availableBalance.toLocaleString("en-US") : "0")}
              className="h-8 px-3.5 inline-flex items-center justify-center rounded-xl bg-[#009A60] text-white hover:bg-[#008250] transition-all text-[11px] font-bold uppercase tracking-wider shadow-xs active:scale-95 cursor-pointer"
            >
              WITHDRAW MAX
            </button>
          </div>

          {/* Amount Field */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
              WITHDRAWAL AMOUNT <span className="text-[#009A60] font-bold">(N)</span> <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                placeholder="e.g. 50,000"
                value={withdrawAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className={cn(
                  "w-full h-12 rounded-xl text-sm font-semibold px-4 pr-16 bg-[#F5FAF6] border border-[#E1EFE5] text-[#0F172A] placeholder:text-slate-400 focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 focus:outline-hidden transition-all",
                  (isAmountOverBalance || isAmountBelowMin) && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                )}
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase tracking-wider pointer-events-none">
                NGN
              </span>
            </div>

            {isAmountOverBalance && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1.5 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Amount exceeds your available balance of {formatCurrency(availableBalance)}
              </div>
            )}
            {isAmountBelowMin && (
              <p className="text-xs text-red-600 mt-1.5 font-medium">
                Minimum withdrawal amount is ₦20,000
              </p>
            )}
          </div>

          {/* Destination Bank Account Selection */}
          {bankAccounts.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                  SELECT DESTINATION BANK ACCOUNT <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsWithdrawModalOpen(false);
                    setIsBankModalOpen(true);
                  }}
                  className="text-[11px] text-[#009A60] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5" /> Manage Accounts ({bankAccounts.length}/2)
                </button>
              </div>

              <div className="space-y-2.5">
                {bankAccounts.map((acc) => {
                  const isSelected = selectedBankAccountId === acc.id;
                  return (
                    <div
                      key={acc.id}
                      onClick={() => handleSelectAccount(acc)}
                      className={cn(
                        "cursor-pointer rounded-2xl p-3.5 border transition-all flex items-center justify-between shadow-xs",
                        isSelected
                          ? "bg-white border-2 border-[#009A60]"
                          : "bg-white border border-[#E1EFE5] hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                          <BankLogo bankName={acc.bankName} size="sm" className="w-full h-full border-none shadow-none ring-0 p-0" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900 capitalize truncate">{acc.bankName}</span>
                            {acc.isDefault && (
                              <span className="text-[9px] uppercase font-bold bg-[#EAF7EE] text-[#009A60] px-1.5 py-0.5 rounded tracking-wider">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-slate-500 mt-0.5 truncate">
                            {acc.accountNumber} <span className="text-slate-300 font-normal">•</span> {toTitleCase(acc.accountName)}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 ml-3">
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                            isSelected
                              ? "border-[#009A60] bg-white"
                              : "border-slate-300 bg-white"
                          )}
                        >
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#009A60]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-[#f5faf6] rounded-2xl border border-[#e1efe5] p-5 text-center space-y-3.5 my-1">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#e1efe5] text-[#009A60] flex items-center justify-center mx-auto shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-gray-900">No Payout Account Found</h4>
                <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                  You need to link a verified corporate bank account before requesting a payout.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsWithdrawModalOpen(false);
                  setIsPendingWithdrawalAfterBankAdd(true);
                  setIsAddingAccount(true);
                  setIsBankModalOpen(true);
                }}
                className="h-10 bg-[#009A60] hover:bg-[#008250] text-white text-xs font-bold px-5 rounded-xl inline-flex items-center gap-1.5 mx-auto shadow-xs cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Payout Account
              </button>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
              NOTES (OPTIONAL)
            </label>
            <input
              type="text"
              placeholder="e.g. Tournament payout batch #1"
              value={withdrawNotes}
              onChange={(e) => setWithdrawNotes(e.target.value)}
              className="w-full h-14 rounded-2xl text-xs font-medium bg-[#F5FAF6] border border-[#E1EFE5] text-[#0F172A] px-4 placeholder:text-slate-400 focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 focus:outline-hidden transition-all"
            />
          </div>

          {/* Security Notice */}
          <div className="bg-[#FFF9F2] border border-[#FFE7CC] rounded-2xl p-4 flex items-center gap-3.5 leading-relaxed">
            <div className="w-6 h-6 rounded-full border border-amber-300 bg-amber-50 flex items-center justify-center shrink-0 text-amber-600">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <p className="text-xs text-[#9A3412] font-medium leading-relaxed">
              Requested funds are locked atomically and reviewed securely. Payouts are typically disbursed within 24 business hours.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isSubmittingWithdrawal}
              onClick={() => setIsWithdrawModalOpen(false)}
              className="h-11 px-5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isWithdrawFormValid || isSubmittingWithdrawal}
              className="h-11 rounded-xl bg-[#009A60] hover:bg-[#008250] text-white text-xs font-bold px-6 shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmittingWithdrawal ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </button>
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
        title={
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EAF7EE] border border-[#C6F0DB] flex items-center justify-center text-[#009A60] shrink-0 shadow-2xs">
              <Landmark className="w-4.5 h-4.5 text-[#009A60]" />
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">Payout Bank Accounts</span>
          </div>
        }
        className="max-w-md rounded-[28px] sm:rounded-[32px] overflow-hidden"
      >
        <div className="space-y-4 text-left font-sans text-sm">
          <div className="flex items-start justify-between gap-4 pt-1 pb-1">
            <p className="text-xs text-slate-500 font-normal leading-relaxed max-w-[250px]">
              Save up to 2 verified accounts for <span className="font-bold text-gray-900">1-click payout withdrawals</span>.
            </p>
            <span className="text-[11px] font-bold px-3 py-1 bg-[#EAF7EE] text-[#009A60] rounded-full shrink-0 tracking-wider">
              {bankAccounts.length} / 2 ADDED
            </span>
          </div>

          {/* List of saved accounts */}
          <div className="space-y-3">
            {bankAccounts.map((acc) => (
              <div
                key={acc.id}
                className="bg-white rounded-2xl border border-[#E1EFE5] p-4.5 sm:p-5 space-y-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                      <BankLogo bankName={acc.bankName} size="md" className="w-full h-full border-none shadow-none ring-0 p-0" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900 capitalize truncate max-w-[150px] sm:max-w-[190px]">{acc.bankName}</span>
                        {acc.isDefault && (
                          <span className="text-[9px] uppercase font-bold bg-[#009A60] text-white px-2 py-0.5 rounded-full tracking-wider shrink-0">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-slate-400 mt-0.5">
                        Verified Account
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                    {!acc.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultAccount(acc)}
                        className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-[#009A60] hover:bg-[#EAF7EE] rounded-lg border border-slate-200 hover:border-[#C6F0DB] transition-all cursor-pointer"
                        title="Set as Default Account"
                      >
                        Make Default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteAccount(acc)}
                      className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      ACCOUNT NUMBER
                    </span>
                    <span className="text-sm font-bold text-gray-900 mt-1 block font-mono">
                      {acc.accountNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-right sm:text-left">
                      ACCOUNT NAME
                    </span>
                    <span className="text-sm font-bold text-gray-900 mt-1 block truncate text-right sm:text-left" title={toTitleCase(acc.accountName)}>
                      {toTitleCase(acc.accountName)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Account Form / Slot */}
          {isAddingAccount ? (
            <form onSubmit={handleSaveBankAccount} className="bg-[#f5faf6] rounded-2xl border border-[#e1efe5] p-4.5 sm:p-5 space-y-4 shadow-xs">
              <div className="pb-2.5 border-b border-[#e1efe5] flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Add New Payout Account</h4>
                <span className="text-[10px] font-bold text-[#009A60] bg-[#EAF7EE] px-2 py-0.5 rounded">
                  {bankAccounts.length === 0 ? "SLOT 1 OF 2" : "SLOT 2 OF 2"}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">Select Bank *</label>
                {banksList.length > 0 ? (
                  <SearchableSelect
                    value={selectedBankCode}
                    onValueChange={(code) => handleBankChange(code)}
                    options={banksList.map((b) => ({
                      value: b.code,
                      label: b.name,
                      image: getBankLogoUrl(b.code || b.slug || b.name),
                    }))}
                    placeholder="Choose your bank..."
                    triggerClassName="h-11 rounded-xl text-xs font-medium bg-white border-[#e1efe5] text-gray-900 px-3.5 focus:border-[#009A60]"
                  />
                ) : (
                  <input
                    placeholder="e.g. GTBank, Zenith Bank, Access Bank"
                    value={accBankName}
                    onChange={(e) => {
                      setAccBankName(e.target.value);
                      setSelectedBankCode(e.target.value);
                    }}
                    className="w-full h-11 rounded-xl text-xs font-medium bg-white border border-[#e1efe5] px-3.5 focus:border-[#009A60] focus:outline-hidden"
                    required
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">10-Digit Account Number *</label>
                  {isResolvingAccount && (
                    <span className="text-[11px] font-medium text-[#009A60] flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" /> Verifying...
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 0123456789"
                  value={accNumber}
                  onChange={(e) => handleAccountNumberChange(e.target.value)}
                  maxLength={10}
                  className="w-full h-11 rounded-xl text-xs font-semibold bg-white border border-[#e1efe5] px-3.5 focus:border-[#009A60] focus:outline-hidden font-mono tracking-wider"
                  required
                />
              </div>

              {/* Real-time Verification Feedback Banner */}
              {resolvedAccountName && (
                <div
                  className={cn(
                    "rounded-xl p-3.5 border transition-all shadow-xs",
                    isNameTally
                      ? "bg-emerald-50/70 border-emerald-200/80"
                      : "bg-amber-50/80 border-amber-200/90"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isNameTally ? (
                        <CheckCircle className="w-4 h-4 text-[#009A60] shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <span
                        className={cn(
                          "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md",
                          isNameTally
                            ? "bg-emerald-100 text-[#009A60]"
                            : "bg-amber-100 text-amber-800"
                        )}
                      >
                        {isNameTally ? "Verified Account Name" : "Account Name Mismatch"}
                      </span>
                    </div>
                    {isNameTally ? (
                      <span className="text-[11px] font-bold text-[#009A60]">✓ Tallies with Club</span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-700">Does not tally</span>
                    )}
                  </div>

                  <div className="mt-2 pl-6 space-y-1">
                    <p
                      className={cn(
                        "text-xs font-bold truncate",
                        isNameTally ? "text-gray-900" : "text-amber-950"
                      )}
                    >
                      {toTitleCase(resolvedAccountName)}
                    </p>

                    {!isNameTally && registeredClubName && (
                      <p className="text-[11px] text-amber-800 font-normal leading-relaxed">
                        Notice: The account holder returned by the bank does not match your registered organization (<span className="font-semibold text-amber-900">{registeredClubName}</span>). Please confirm this account is authorized for your disbursements.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {resolveError && (
                <div className="border border-rose-200 bg-rose-50/80 rounded-xl p-3.5 flex items-start gap-2.5 shadow-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs font-bold text-rose-900">
                      Account Verification Failed
                    </p>
                    <p className="text-[11px] leading-relaxed text-rose-700">
                      {resolveError}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">Account Holder Name *</label>
                <input
                  placeholder={isResolvingAccount ? "Resolving verified name..." : "Auto-filled upon 10-digit NUBAN verification"}
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  readOnly={user?.role !== "SUPER_ADMIN"}
                  className={cn(
                    "w-full h-11 rounded-xl text-xs border border-[#e1efe5] transition-all px-3.5 focus:outline-hidden",
                    user?.role !== "SUPER_ADMIN"
                      ? "bg-[#eaf7ee]/30 text-gray-800 font-semibold cursor-not-allowed select-none"
                      : "bg-white text-gray-900 font-semibold focus:border-[#009A60]"
                  )}
                  required
                />
                <p className="text-[11px] text-gray-400 font-normal mt-1 leading-normal">
                  Account holder name is securely verified and auto-populated from official banking switch records.
                </p>
              </div>

              {bankAccounts.length > 0 && (
                <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={accIsDefault}
                    onChange={(e) => setAccIsDefault(e.target.checked)}
                    className="w-4 h-4 text-[#009A60] rounded border-gray-300 focus:ring-[#009A60]"
                  />
                  <span className="text-xs text-gray-700 font-semibold">Set as default payout account</span>
                </label>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#e1efe5]/80 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingAccount(false);
                    setResolvedAccountName(null);
                    setResolveError(null);
                  }}
                  className="h-10 rounded-xl text-xs font-bold px-4 border border-gray-200 text-gray-700 hover:bg-white cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSavingAccount ||
                    (isResolvingAccount && user?.role !== "SUPER_ADMIN") ||
                    !accBankName.trim() ||
                    accNumber.trim().length !== 10 ||
                    !accName.trim() ||
                    (Boolean(resolveError) && user?.role !== "SUPER_ADMIN")
                  }
                  className="h-10 rounded-xl bg-[#009A60] hover:bg-[#008250] text-white text-xs font-bold px-5 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSavingAccount ? "Saving..." : (user?.role === "SUPER_ADMIN" && resolveError) ? "Save Account (Admin Override)" : "Save Account"}
                </button>
              </div>
            </form>
          ) : (
            bankAccounts.length < 2 && (
              <button
                type="button"
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
                className="w-full border border-dashed border-slate-200 hover:border-[#009A60] bg-white hover:bg-[#F5FAF6]/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full border border-slate-200 group-hover:border-[#009A60] group-hover:bg-[#EAF7EE] flex items-center justify-center text-slate-400 group-hover:text-[#009A60] transition-all">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-gray-900 mt-2.5">
                  Add Payout Account
                </span>
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mt-0.5">
                  {bankAccounts.length === 0 ? "2 SLOTS AVAILABLE" : "SLOT (2/2) AVAILABLE"}
                </span>
              </button>
            )
          )}

          {/* Security Notice */}
          <div className="bg-[#F0F7FF] border border-[#D0E5FF] rounded-2xl p-4 flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center text-white shrink-0 shadow-2xs">
              <Info className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <p className="text-xs text-[#1D4ED8] font-medium leading-relaxed">
              <span className="font-bold">Security Notice:</span> New accounts undergo a 24–hour verification period before they can be used for withdrawals.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end pt-3">
            <button
              type="button"
              onClick={() => {
                setIsBankModalOpen(false);
                setIsAddingAccount(false);
              }}
              className="h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 text-xs font-bold px-6 shadow-2xs transition-colors cursor-pointer"
            >
              Close Window
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: CONFIRM DELETE BANK ACCOUNT */}
      <Modal
        isOpen={accountToDelete !== null}
        onClose={() => !isDeletingAccount && setAccountToDelete(null)}
        title={
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0 shadow-2xs">
              <Trash2 className="w-4.5 h-4.5 text-red-600" />
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">Remove Bank Account</span>
          </div>
        }
        className="max-w-md rounded-[28px] sm:rounded-[32px] overflow-hidden"
      >
        {accountToDelete && (
          <div className="space-y-4 font-sans text-left text-sm">
            {/* Account Card Summary */}
            <div className="bg-[#f5faf6] rounded-2xl border border-[#e1efe5] p-4.5 space-y-3.5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-2xs">
                  <BankLogo bankName={accountToDelete.bankName} size="md" className="w-full h-full border-none shadow-none ring-0 p-0" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 capitalize truncate">{accountToDelete.bankName}</span>
                    {accountToDelete.isDefault && (
                      <span className="text-[9px] uppercase font-bold bg-[#009A60] text-white px-2 py-0.5 rounded-full tracking-wider">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-slate-500 mt-0.5 font-mono">
                    {accountToDelete.accountNumber}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#e1efe5] flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Account Name</span>
                <span className="text-xs font-bold text-gray-900 truncate max-w-[200px]">
                  {toTitleCase(accountToDelete.accountName)}
                </span>
              </div>
            </div>

            {/* Warning Callout */}
            <div className="bg-red-50/80 border border-red-200/80 rounded-2xl p-4 text-xs text-red-800 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="font-normal leading-relaxed">
                Are you sure you want to remove this payout bank account? Once removed, it will no longer be available for 1-click withdrawals until re-added.
              </p>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeletingAccount}
                onClick={() => setAccountToDelete(null)}
                className="h-10 rounded-xl text-xs font-bold px-4 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletingAccount}
                className="h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Removing...
                  </>
                ) : (
                  "Yes, Remove Account"
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* DETAIL MODAL: VIEW RECEIPT */}
      <Modal
        isOpen={selectedTxn !== null}
        onClose={() => setSelectedTxn(null)}
        title={
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#EAF7EE] border border-[#C6F0DB] flex items-center justify-center text-[#009A60] shrink-0">
              <Receipt className="w-4 h-4 text-[#009A60]" />
            </div>
            <span className="text-[17px] font-bold text-gray-900 tracking-tight">Payment Receipt</span>
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
                <span className="text-[13px] font-bold text-gray-900">{selectedWithdrawal.club?.name || user?.club?.name || "Oakwood Country Club"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">AMOUNT</span>
                <span className="text-2xl font-bold text-[#009A60] tracking-tight">{formatCurrency(selectedWithdrawal.amount).replace(/\.00$/, "")}</span>
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
                  <p className="text-[11px] text-gray-400 font-normal mt-0.5">Funds were unlocked & returned to your available balance</p>
                </div>
              </div>
            ) : selectedWithdrawal.status === "PENDING" ? (
              <div className="flex items-center gap-3 pt-1 px-1">
                <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h5 className="text-[13px] font-bold text-gray-900 leading-tight">Pending Super Admin Review</h5>
                  <p className="text-[11px] text-gray-400 font-normal mt-0.5">Your request is queued for disbursement processing</p>
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

            {/* Footer Close Button */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="h-10 px-4 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-gray-500" />
                <span>Print Audit</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedWithdrawal(null)}
                className="h-10 px-7 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
