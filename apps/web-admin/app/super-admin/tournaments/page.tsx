"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Users,
  UserPlus,
  Calendar,
  Wallet,
  Search,
  Plus,
  Download,
  Filter,
  Eye,
  Settings,
  Edit2,
  MoreHorizontal,
  ArrowUpRight,
  Ban,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Link,
  Globe,
  Lock,
  Shield,
  Check,
  Eraser,
  UserMinus,
  Clock,
  ChevronDown,
  X,
  Activity,
  Award,
  CreditCard,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatThousandsInput, formatWithCommas } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { cancelTournament, deleteTournament, getTournaments, updateTournament } from "@/lib/api/tournaments";

import {
  addRegistrationStrokes,
  clearRegistrationStrokes,
  getRegistrations,
  updateRegistrationStatus,
  type RegistrationListItem,
} from "@/lib/api/registrations";
import { exportToCsv, exportToPdf } from "@/lib/export";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { FloatingMenu } from "@/components/ui/floating-menu";
import dynamic from "next/dynamic";
import { WizardSkeleton } from "@/components/ui/wizard-skeleton";

const CreateTournamentWizard = dynamic(
  () => import("@/components/tournaments/CreateTournamentWizard").then(mod => mod.CreateTournamentWizard),
  {
    ssr: false,
    loading: () => <WizardSkeleton steps={8} />
  }
);

const WaitlistModal = dynamic(
  () => import("@/components/tournaments/WaitlistModal").then(mod => mod.WaitlistModal),
  { ssr: false }
);

type TournamentStatus = "DRAFT" | "REGISTRATION_OPEN" | "ONGOING" | "COMPLETED" | "CANCELLED";

type ApiTournament = {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  status: TournamentStatus;
  entryFee: number | null;
  requiresPayment: boolean;
  maxPlayers: number | null;
  registrationDeadline?: string | null;
  playerTypes: string[];
  club: { id: string; name: string; logo?: string | null } | null;
  course?: { id: string; name: string } | null;
  visibility: "PUBLIC" | "PRIVATE" | "INVITE_ONLY";
  enableWaitlist?: boolean;
  createdAt: string;
  lockedGroupingsDays?: number[];
  _count?: { registrations: number };
};

type TournamentRow = {
  id: string;
  name: string;
  clubName: string;
  clubLogo: string | null;
  courseName: string | null;
  types: string[];
  dates: string;
  players: string;
  status: string;
  badge: string;
  entryFee: number | null;
  requiresPayment: boolean;
  startDate: string;
  endDate: string | null;
  maxPlayers: number | null;
  statusKey: TournamentStatus;
  visibility: string;
  visibilityKey: "PUBLIC" | "PRIVATE" | "INVITE_ONLY";
  enableWaitlist?: boolean;
  createdAt: string;
  lockedGroupingsDays?: number[];
  registrations: number;
};

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  if (e && typeof e === "object" && "message" in e && typeof (e as { message?: unknown }).message === "string") {
    return (e as { message: string }).message;
  }
  return null;
}

const STATUS_META: Record<TournamentStatus, { label: string; color: string; badge: string }> = {
  DRAFT: { label: "Draft", color: "#94a3b8", badge: "bg-slate-50 text-gray-600" },
  REGISTRATION_OPEN: { label: "Upcoming", color: "#15803D", badge: "bg-emerald-50 text-openclub-800" },
  ONGOING: { label: "Ongoing", color: "#3b82f6", badge: "bg-blue-50 text-blue-600" },
  COMPLETED: { label: "Completed", color: "#8b5cf6", badge: "bg-violet-50 text-violet-600" },
  CANCELLED: { label: "Cancelled", color: "#f43f5e", badge: "bg-rose-50 text-rose-600" },
};
const VISIBILITY_META: Record<"PUBLIC" | "PRIVATE" | "INVITE_ONLY", { label: string; badge: string; icon: any }> = {
  PUBLIC: { label: "Public", badge: "bg-emerald-50 text-openclub-800", icon: Globe },
  PRIVATE: { label: "Private", badge: "bg-gray-100 text-gray-600", icon: Eye },
  INVITE_ONLY: { label: "Invite Only/Closed Tournament", badge: "bg-amber-50 text-amber-600", icon: Shield },
};

function formatDateRange(startISO: string, endISO: string | null) {
  const start = new Date(startISO);
  const end = endISO ? new Date(endISO) : null;
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (!end) return fmt.format(start);
  return `${fmt.format(start)} - ${fmt.format(end)}`;
}

function formatPlayers(current: number, maxPlayers: number | null) {
  if (maxPlayers == null) return formatWithCommas(current);
  return `${formatWithCommas(current)} / ${formatWithCommas(maxPlayers)}`;
}

function formatNaira(value: number | null) {
  if (value == null || value === 0) return "₦0";
  return `₦${formatWithCommas(Math.round(value))}`;
}

function isWithinMonth(dateISO: string, year: number, monthIndex: number) {
  const d = new Date(dateISO);
  return d.getFullYear() === year && d.getMonth() === monthIndex;
}

function toDateInputValue(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

const CLIENT_REGISTRATIONS_MAX = 250;

function fullName(firstName: string | null, lastName: string | null) {
  const name = `${firstName || ""} ${lastName || ""}`.trim();
  return name || "—";
}

function getDaysUntil(dateISO: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateISO);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function toLocalYMD(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export default function TournamentsPage() {
  const router = useRouter();
  const tomorrowYMD = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toLocalYMD(d);
  })();

  const isMounted = useSyncExternalStore(
    () => () => { },
    () => true,
    () => false,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [clubFilter, setClubFilter] = useState("All Organizers");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tournaments, setTournaments] = useState<ApiTournament[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownAnchorEl, setDropdownAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [dropdownTournament, setDropdownTournament] = useState<TournamentRow | null>(null);

  const [activeManageDropdown, setActiveManageDropdown] = useState<string | null>(null);
  const [manageDropdownAnchorEl, setManageDropdownAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [manageDropdownTournament, setManageDropdownTournament] = useState<TournamentRow | null>(null);

  const closeManageDropdown = () => {
    setActiveManageDropdown(null);
    setManageDropdownAnchorEl(null);
    setManageDropdownTournament(null);
  };
  const [exportAnchorEl, setExportAnchorEl] = useState<HTMLElement | null>(null);
  
  const [activeMasterFilterDropdown, setActiveMasterFilterDropdown] = useState(false);
  const [masterFilterDropdownAnchorEl, setMasterFilterDropdownAnchorEl] = useState<HTMLElement | null>(null);
  const closeMasterFilterDropdown = () => {
    setActiveMasterFilterDropdown(false);
    setMasterFilterDropdownAnchorEl(null);
  };

  const [mutating, setMutating] = useState(false);

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardTournamentId, setWizardTournamentId] = useState<string | null>(null);
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<TournamentRow | null>(null);

  const [registrationsLoading, setRegistrationsLoading] = useState(false);
  const [registrations, setRegistrations] = useState<RegistrationListItem[]>([]);
  const [registrationsMode, setRegistrationsMode] = useState<"client" | "server">("server");
  const [registrationsInitialized, setRegistrationsInitialized] = useState(false);
  const [registrationsAll, setRegistrationsAll] = useState<RegistrationListItem[]>([]);
  const [registrationsTotal, setRegistrationsTotal] = useState(0);
  const [registrationsTournamentTotal, setRegistrationsTournamentTotal] = useState(0);
  const [registrationsPage, setRegistrationsPage] = useState(1);
  const registrationsPerPage = 5;
  const [registrationsSearch, setRegistrationsSearch] = useState("");
  const [registrationsDebouncedSearch, setRegistrationsDebouncedSearch] = useState("");
  const [registrationsStatusFilter, setRegistrationsStatusFilter] = useState<
    "All Status" | "PENDING" | "APPROVED" | "REJECTED" | "WAITLISTED" | "DISQUALIFIED"
  >("All Status");
  const [registrationsPaymentFilter, setRegistrationsPaymentFilter] = useState<"All Payments" | "PAID" | "UNPAID" | "REFUNDED">("All Payments");
  const [registrationsDisqualifiedFilter, setRegistrationsDisqualifiedFilter] = useState<
    "All Players" | "Enabled Players" | "Disqualified Players"
  >("All Players");
  const [monthFilter, setMonthFilter] = useState("All Months");
  const [yearFilter, setYearFilter] = useState("All Years");
  const [registrationActionId, setRegistrationActionId] = useState<string | null>(null);
  const [strokesMenuRegistration, setStrokesMenuRegistration] = useState<RegistrationListItem | null>(null);
  const [strokesMenuAnchorEl, setStrokesMenuAnchorEl] = useState<HTMLButtonElement | null>(null);

  const [isRegisterPlayerModalOpen, setIsRegisterPlayerModalOpen] = useState(false);
  const [registerPlayerSearch, setRegisterPlayerSearch] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDisqualifyModalOpen, setIsDisqualifyModalOpen] = useState(false);
  const [isRemovePlayerModalOpen, setIsRemovePlayerModalOpen] = useState(false);
  const [isEnablePlayerModalOpen, setIsEnablePlayerModalOpen] = useState(false);
  const [actionRegistration, setActionRegistration] = useState<RegistrationListItem | null>(null);

  const [isOneDayEvent, setIsOneDayEvent] = useState(false);
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState<Exclude<TournamentStatus, "DRAFT">>("REGISTRATION_OPEN");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editEntryFee, setEditEntryFee] = useState("");
  const [editMaxPlayers, setEditMaxPlayers] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const closeTimeoutRef = useRef<number | null>(null);
  const closeDropdown = () => {
    setActiveDropdown(null);
    if (closeTimeoutRef.current != null) window.clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = window.setTimeout(() => {
      setDropdownAnchorEl(null);
      setDropdownTournament(null);
      closeTimeoutRef.current = null;
    }, 160);
  };


  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  async function reloadTournaments() {
    setLoading(true);
    setError(null);
    try {
      const data = (await getTournaments()) as ApiTournament[];
      setTournaments(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Failed to fetch tournaments");
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = (await getTournaments()) as ApiTournament[];
        if (cancelled) return;
        setTournaments(Array.isArray(data) ? data : []);
      } catch (e: unknown) {
        if (cancelled) return;
        setError(getErrorMessage(e) || "Failed to fetch tournaments");
        setTournaments([]);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = tournaments.map((t) => {
    const clubName = t.club?.name || "—";
    const clubLogo = t.club?.logo || null;
    const registrations = t._count?.registrations ?? 0;
    const types = Array.isArray(t.playerTypes) ? t.playerTypes : [];
    return {
      id: t.id,
      name: t.name,
      clubName,
      clubLogo,
      courseName: t.course?.name || null,
      types,
      dates: formatDateRange(t.startDate, t.endDate),
      players: formatPlayers(registrations, t.maxPlayers),
      status: STATUS_META[t.status]?.label ?? t.status,
      badge: STATUS_META[t.status]?.badge ?? "bg-gray-100 text-gray-500",
      entryFee: t.entryFee,
      requiresPayment: t.requiresPayment,
      startDate: t.startDate,
      endDate: t.endDate,
      maxPlayers: t.maxPlayers,
      statusKey: t.status,
      visibility: VISIBILITY_META[t.visibility]?.label ?? t.visibility,
      visibilityKey: t.visibility,
      enableWaitlist: t.enableWaitlist,
      lockedGroupingsDays: t.lockedGroupingsDays || [],
      createdAt: t.createdAt,
      registrations,
    };
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredTournaments = rows.filter((t) => {
    const q = searchQuery.trim().toLowerCase();
    const tokens = q.split(/[\s-]+/).filter(Boolean);

    const searchableFields = [
      t.name,
      t.clubName,
    ];

    const matchesSearch = tokens.length === 0 || tokens.every(token =>
      searchableFields.some(field => field?.toLowerCase().includes(token))
    );

    const matchesClub = clubFilter === "All Organizers" || t.clubName === clubFilter;
    const matchesStatus = statusFilter === "All Status" || t.status === statusFilter;

    let matchesMonth = true;
    if (monthFilter !== "All Months") {
      const d = new Date(t.startDate);
      const monthName = d.toLocaleString("default", { month: "long" });
      matchesMonth = monthName === monthFilter;
    }

    let matchesYear = true;
    if (yearFilter !== "All Years") {
      const d = new Date(t.startDate);
      matchesYear = d.getFullYear().toString() === yearFilter;
    }

    return matchesSearch && matchesClub && matchesStatus && matchesMonth && matchesYear;
  });

  const uniqueClubs = Array.from(new Set(rows.map((t) => t.clubName))).filter((c) => c !== "—");
  const uniqueStatuses = Array.from(new Set(rows.map((t) => t.status)));

  const uniqueMonths = useMemo(() => {
    const months = new Set<string>();
    rows.forEach(t => {
      const d = new Date(t.startDate);
      months.add(d.toLocaleString("default", { month: "long" }));
    });
    return Array.from(months).sort((a, b) => {
      const monthsOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      return monthsOrder.indexOf(a) - monthsOrder.indexOf(b);
    });
  }, [rows]);

  const uniqueYears = useMemo(() => {
    const years = new Set<string>();
    rows.forEach(t => {
      const d = new Date(t.startDate);
      years.add(d.getFullYear().toString());
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [rows]);

  // Paginated data
  const totalPages = Math.ceil(filteredTournaments.length / itemsPerPage);
  const paginatedTournaments = filteredTournaments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalTournaments = rows.length;
  const activeTournaments = rows.filter(
    (t) => t.statusKey === "ONGOING" || t.statusKey === "REGISTRATION_OPEN",
  );
  const activeClubs = new Set(activeTournaments.map((t) => t.clubName).filter((c) => c !== "—")).size;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const completedThisMonth = rows.filter((t) => {
    if (t.statusKey !== "COMPLETED") return false;
    const monthBasis = t.endDate ?? t.startDate;
    return isWithinMonth(monthBasis, currentYear, currentMonth);
  });

  const participantTournaments = rows.filter(
    (t) => t.statusKey !== "CANCELLED",
  );
  const totalParticipants = participantTournaments.reduce((sum, t) => sum + t.registrations, 0);

  const billedTournamentsThisMonth = rows.filter((t) => {
    if (t.statusKey === "CANCELLED") return false;
    return isWithinMonth(t.startDate, currentYear, currentMonth);
  });
  const totalEntryFeesThisMonth = billedTournamentsThisMonth.reduce((sum, t) => {
    const fee = typeof t.entryFee === "number" ? t.entryFee : 0;
    return sum + fee * t.registrations;
  }, 0);

  const statusCounts: Record<TournamentStatus, number> = {
    DRAFT: 0,
    REGISTRATION_OPEN: 0,
    ONGOING: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };
  for (const t of rows) {
    const key = t.statusKey as TournamentStatus;
    if (key in statusCounts) statusCounts[key] += 1;
  }
  const statusData = (Object.keys(statusCounts) as Array<TournamentStatus>)
    .filter((k) => statusCounts[k] > 0)
    .map((k) => {
      const value = statusCounts[k];
      const pct = totalTournaments === 0 ? 0 : (value / totalTournaments) * 100;
      return {
        name: STATUS_META[k].label,
        value,
        color: STATUS_META[k].color,
        percentage: `${pct.toFixed(1).replace(/\.0$/, "")}%`,
      };
    });

  const upcomingPalette = [
    { color: "text-blue-600", bg: "bg-blue-50" },
    { color: "text-openclub-800", bg: "bg-emerald-50" },
    { color: "text-red-600", bg: "bg-red-50" },
    { color: "text-violet-600", bg: "bg-violet-50" },
  ];

  const upcomingList = rows
    .filter((t) => {
      // Show tournaments that are in Upcoming status AND starting in the future
      const isPending = t.statusKey === "REGISTRATION_OPEN";
      const days = getDaysUntil(t.startDate);
      return isPending && days >= 0;
    })
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 4) // Strictly 4 records
    .map((t, i) => {
      const daysUntil = getDaysUntil(t.startDate);
      const daysLabel = daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`;
      const palette = upcomingPalette[i % upcomingPalette.length];
      return {
        ...t,
        days: daysLabel,
        icon: Trophy,
        color: palette.color,
        bg: palette.bg,
      };
    });

  const openView = (tournament: TournamentRow) => {
    closeDropdown();
    router.push(`/super-admin/tournaments/${tournament.id}`);
  };

  useEffect(() => {
    const handle = window.setTimeout(() => setRegistrationsDebouncedSearch(registrationsSearch.trim()), 250);
    return () => window.clearTimeout(handle);
  }, [registrationsSearch]);

  useEffect(() => {
    if ((!isRegisterPlayerModalOpen) || !selectedTournament?.id) return;
    let cancelled = false;
    getRegistrations({
      tournamentId: selectedTournament.id,
      skip: 0,
      take: 1,
    })
      .then(async ({ total }) => {
        if (cancelled) return;
        const tournamentTotal = typeof total === "number" ? total : 0;
        setRegistrationsTournamentTotal(tournamentTotal);

        if (tournamentTotal > 0 && tournamentTotal <= CLIENT_REGISTRATIONS_MAX) {
          setRegistrationsMode("client");
          const { items: allItems } = await getRegistrations({
            tournamentId: selectedTournament.id,
            skip: 0,
            take: tournamentTotal,
          });
          if (cancelled) return;
          setRegistrationsAll(Array.isArray(allItems) ? allItems : []);
          setRegistrationsTotal(tournamentTotal);
          setRegistrations([]);
        } else {
          setRegistrationsMode("server");
          setRegistrations([]);
          setRegistrationsTotal(0);
          setRegistrationsAll([]);
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setRegistrations([]);
        setRegistrationsAll([]);
        setRegistrationsTotal(0);
        setRegistrationsTournamentTotal(0);
        toast.error(getErrorMessage(e) || "Failed to fetch registrations");
      })
      .finally(() => {
        if (cancelled) return;
        setRegistrationsLoading(false);
        setRegistrationsInitialized(true);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedTournament?.id, registrationsPerPage]);

  useEffect(() => {

    if (registrationsMode !== "server") return;
    if (!selectedTournament?.id) return;
    let cancelled = false;
    const skip = (registrationsPage - 1) * registrationsPerPage;
    getRegistrations({
      tournamentId: selectedTournament.id,
      q: registrationsDebouncedSearch || undefined,
      status: registrationsStatusFilter === "All Status" ? undefined : registrationsStatusFilter,
      disqualified:
        registrationsStatusFilter === "All Status"
          ? registrationsDisqualifiedFilter === "Disqualified Players"
            ? true
            : registrationsDisqualifiedFilter === "Enabled Players"
              ? false
              : undefined
          : undefined,
      paymentStatus: registrationsPaymentFilter === "All Payments" ? undefined : registrationsPaymentFilter,
      skip,
      take: registrationsPerPage,
    })
      .then(({ items, total }) => {
        if (cancelled) return;
        setRegistrations(Array.isArray(items) ? items : []);
        setRegistrationsTotal(typeof total === "number" ? total : 0);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setRegistrations([]);
        setRegistrationsTotal(0);
        toast.error(getErrorMessage(e) || "Failed to fetch registrations");
      })
      .finally(() => {
        if (cancelled) return;
        setRegistrationsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [

    selectedTournament?.id,
    registrationsInitialized,
    registrationsMode,
    registrationsPage,
    registrationsPerPage,
    registrationsDebouncedSearch,
    registrationsStatusFilter,
    registrationsDisqualifiedFilter,
    registrationsPaymentFilter,
  ]);

  const registrationsQuery = registrationsSearch.trim().toLowerCase();
  const filteredRegistrationsAll =
    registrationsMode === "client"
      ? registrationsAll.filter((r) => {
        const fullName = `${r.user?.firstName ?? ""} ${r.user?.lastName ?? ""}`.trim().toLowerCase();
        const email = (r.user?.email ?? "").toLowerCase();
        const matchesSearch =
          registrationsQuery.length === 0 || fullName.includes(registrationsQuery) || email.includes(registrationsQuery);
        const matchesStatus = registrationsStatusFilter === "All Status" || r.status === registrationsStatusFilter;
        const matchesPayment =
          registrationsPaymentFilter === "All Payments" || r.paymentStatus === registrationsPaymentFilter;
        const matchesDisqualified =
          registrationsDisqualifiedFilter === "All Players" ||
          (registrationsDisqualifiedFilter === "Disqualified Players"
            ? r.status === "DISQUALIFIED"
            : r.status !== "DISQUALIFIED");
        return matchesSearch && matchesStatus && matchesPayment && matchesDisqualified;
      })
      : [];

  const registrationsFilteredTotal = registrationsMode === "client" ? filteredRegistrationsAll.length : registrationsTotal;
  const registrationsPageItems =
    registrationsMode === "client"
      ? filteredRegistrationsAll.slice(
        (registrationsPage - 1) * registrationsPerPage,
        registrationsPage * registrationsPerPage,
      )
      : registrations;

  useEffect(() => {
    if (!isRegisterPlayerModalOpen) {
      setRegisterPlayerSearch("");
    }
  }, [isRegisterPlayerModalOpen]);

  const handleInvitePlayer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTournament?.id || !registerPlayerSearch.trim()) return;
    setIsRegistering(true);
    try {
      const { invitePlayerToTournament } = await import("@/lib/api/registrations");
      await invitePlayerToTournament({
        tournamentId: selectedTournament.id,
        email: registerPlayerSearch.trim(),
      });
      toast.success("Player invited successfully");
      setIsRegisterPlayerModalOpen(false);
      setRegisterPlayerSearch("");

      // Update local state for realtime feel
      setRegistrationsTournamentTotal(prev => prev + 1);
      setSelectedTournament(prev => prev ? { ...prev, registrations: prev.registrations + 1 } : null);

      // Refresh everything
      reloadTournaments();

      if (registrationsMode === "server") {
        setRegistrationsPage(1);
        setRegistrationsLoading(true);
        const { items, total } = await getRegistrations({
          tournamentId: selectedTournament.id,
          skip: 0,
          take: registrationsPerPage,
        });
        setRegistrations(Array.isArray(items) ? items : []);
        setRegistrationsTotal(typeof total === "number" ? total : 0);
        setRegistrationsLoading(false);
      } else {
        setRegistrationsInitialized(false);
      }
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || "Failed to invite player");
    } finally {
      setIsRegistering(false);
    }
  };

  const updateTournamentRegistrationStatus = async (
    registrationId: string,
    nextStatus: RegistrationListItem["status"],
  ) => {
    setRegistrationActionId(registrationId);
    try {
      const updated = await updateRegistrationStatus(registrationId, nextStatus);
      const message =
        nextStatus === "DISQUALIFIED" || updated.status === "DISQUALIFIED"
          ? "Player has been disqualified"
          : nextStatus === "APPROVED" || updated.status === "APPROVED"
            ? "Player has been enabled"
            : "Player updated";
      toast.success(message);
      setRegistrationsAll((prev) =>
        prev.map((r) => (r.id === registrationId ? { ...r, status: updated.status } : r)),
      );
      setRegistrations((prev) =>
        prev.map((r) => (r.id === registrationId ? { ...r, status: updated.status } : r)),
      );
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || "Failed to update registration");
    } finally {
      setRegistrationActionId(null);
    }
  };

  const addTournamentRegistrationStrokes = async (registration: RegistrationListItem, delta: number) => {
    setRegistrationActionId(registration.id);
    try {
      const updated = await addRegistrationStrokes(registration.id, delta);
      toast.success(`Added +${delta} strokes`);
      const nextExtraStrokes =
        typeof updated.extraStrokes === "number"
          ? updated.extraStrokes
          : (typeof registration.extraStrokes === "number" ? registration.extraStrokes : 0) + delta;
      setRegistrationsAll((prev) =>
        prev.map((r) => (r.id === registration.id ? { ...r, extraStrokes: nextExtraStrokes } : r)),
      );
      setRegistrations((prev) =>
        prev.map((r) => (r.id === registration.id ? { ...r, extraStrokes: nextExtraStrokes } : r)),
      );
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || "Failed to add strokes");
    } finally {
      setRegistrationActionId(null);
    }
  };

  const clearTournamentRegistrationStrokes = async (registration: RegistrationListItem) => {
    setRegistrationActionId(registration.id);
    try {
      await clearRegistrationStrokes(registration.id);
      toast.success("Strokes cleared");
      setRegistrationsAll((prev) =>
        prev.map((r) => (r.id === registration.id ? { ...r, extraStrokes: 0 } : r)),
      );
      setRegistrations((prev) =>
        prev.map((r) => (r.id === registration.id ? { ...r, extraStrokes: 0 } : r)),
      );
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || "Failed to clear strokes");
    } finally {
      setRegistrationActionId(null);
    }
  };

  const openEdit = (tournament: TournamentRow) => {
    closeDropdown();
    router.push(`/super-admin/tournaments/${tournament.id}/edit`);
  };

  const openCancel = (tournament: TournamentRow) => {
    closeDropdown();
    setSelectedTournament(tournament);
    setIsCancelModalOpen(true);
  };

  const openDelete = (tournament: TournamentRow) => {
    closeDropdown();
    if (tournament.registrations > 0) {
      toast.error("This tournament has registered players. You cannot delete it. Please cancel it instead.");
      return;
    }
    setSelectedTournament(tournament);
    setDeleteConfirmText("");
    setIsDeleteModalOpen(true);
  };

  const handleMoreAction = (action: string, tournament: TournamentRow) => {
    closeDropdown();
    if (action === "export") {
      exportToCsv([tournament], [
        { header: "Name", key: "name" },
        { header: "Organizer", key: "clubName" },
        { header: "Visibility", key: "visibility" },
        { header: "Dates", key: "dates" },
        { header: "Registered Players", key: "players" },
        { header: "Status", key: "status" },
        { header: "Entry Fee", key: "entryFee" },
      ], `${(tournament?.name || "tournament").toString().replaceAll(" ", "-").toLowerCase()}-export.csv`);
      toast.success("Tournament data exported");
      return;
    }
    if (action === "copy-link") {
      const baseUrl = window.location.origin.replace("admin.", "app."); // Assuming mobile/player app is on app. subdomain
      const link = `${baseUrl}/tournaments/${tournament.id}`;
      navigator.clipboard.writeText(link);
      toast.success("Tournament link copied to clipboard");
      return;
    }
    if (action === "edit") {
      openEdit(tournament);
      return;
    }
    if (action === "register") {
      setSelectedTournament(tournament);
      setIsRegisterPlayerModalOpen(true);
      return;
    }
    if (action === "waitlist") {
      setSelectedTournament(tournament);
      setIsWaitlistModalOpen(true);
      return;
    }
    if (action === "cancel") {
      openCancel(tournament);
      return;
    }
    if (action === "delete") {
      openDelete(tournament);
    }
  };


  const confirmCancel = () => {
    if (!selectedTournament?.id) return;
    setMutating(true);
    const toastId = toast.loading("Cancelling tournament...");
    cancelTournament(selectedTournament.id)
      .then(() => {
        toast.success("Tournament cancelled successfully", { id: toastId });
        setIsCancelModalOpen(false);
        return reloadTournaments();
      })
      .catch((e: unknown) => {
        toast.error(getErrorMessage(e) || "Failed to cancel tournament", { id: toastId });
      })
      .finally(() => setMutating(false));
  };

  const confirmDelete = () => {
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE" || !selectedTournament?.id) return;
    setMutating(true);
    const toastId = toast.loading("Deleting tournament...");
    deleteTournament(selectedTournament.id)
      .then(() => {
        toast.success("Tournament deleted successfully", { id: toastId });
        setIsDeleteModalOpen(false);
        return reloadTournaments();
      })
      .catch((e: unknown) => {
        toast.error(getErrorMessage(e) || "Failed to delete tournament", { id: toastId });
      })
      .finally(() => setMutating(false));
  };

  const confirmDisqualify = () => {
    if (!actionRegistration) return;
    setIsDisqualifyModalOpen(false);
    updateTournamentRegistrationStatus(actionRegistration.id, "DISQUALIFIED");
  };

  const confirmEnablePlayer = () => {
    if (!actionRegistration) return;
    setIsEnablePlayerModalOpen(false);
    updateTournamentRegistrationStatus(actionRegistration.id, "APPROVED");
  };

  const confirmRemovePlayer = async () => {
    if (!actionRegistration || !selectedTournament) return;
    setIsRemovePlayerModalOpen(false);
    setRegistrationActionId(actionRegistration.id);
    try {
      const { deleteRegistration } = await import("@/lib/api/registrations");
      await deleteRegistration(actionRegistration.id);
      toast.success("Player removed from tournament");

      // Update local state for realtime feel
      setRegistrationsTournamentTotal(prev => Math.max(0, prev - 1));
      setSelectedTournament(prev => prev ? { ...prev, registrations: Math.max(0, prev.registrations - 1) } : null);

      // Refresh registrations list
      if (registrationsMode === "client") {
        setRegistrationsAll(prev => prev.filter(x => x.id !== actionRegistration.id));
        setRegistrations(prev => prev.filter(x => x.id !== actionRegistration.id));
        setRegistrationsTotal(prev => Math.max(0, prev - 1));
      } else {
        // Trigger server refresh by re-fetching the current page
        setRegistrationsLoading(true);
        const { items, total } = await getRegistrations({
          tournamentId: selectedTournament.id,
          skip: (registrationsPage - 1) * registrationsPerPage,
          take: registrationsPerPage,
        });
        setRegistrations(Array.isArray(items) ? items : []);
        setRegistrationsTotal(typeof total === "number" ? total : 0);
        setRegistrationsLoading(false);
      }

      // Sync with main dashboard
      reloadTournaments();
    } catch (e: any) {
      toast.error(e.message || "Failed to remove player");
    } finally {
      setRegistrationActionId(null);
      setActionRegistration(null);
    }
  };

  return (
    <div className="space-y-8 w-full max-w-full px-2 pb-10 font-sans">
      {/* Stat Cards */}
      {loading ? (
        <div className="w-full bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-x-auto">
          <div className="flex items-center justify-between p-8 min-w-max gap-12 font-sans">
            {[1, 2, 3, 4, 5].map((i, idx) => (
              <div key={i} className="flex items-center gap-12 flex-1">
                <div className="flex flex-col justify-start items-start gap-3.5 w-full">
                  <div className="flex justify-start items-center gap-3.5">
                    <Skeleton className="h-[22px] w-32" />
                    {i === 2 && <Skeleton className="h-6 w-24 rounded-lg" />}
                  </div>
                  <Skeleton className="h-9 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
                {idx < 4 && <div className="w-px h-16 bg-slate-200 shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="w-full bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-x-auto">
          <div className="flex items-center justify-between p-8 min-w-max gap-12 font-sans">

            {/* Stat 1: Total Tournaments */}
            <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
              <div className="flex justify-start items-center gap-3.5">
                <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Total Tournaments</div>
              </div>
              <div className="text-[#15803D] text-3xl font-bold">{formatWithCommas(totalTournaments)}</div>
              <div className="text-zinc-500 text-sm font-normal">All Time</div>
            </div>

            <div className="w-px h-16 bg-slate-200" />

            {/* Stat 2: Active Tournaments */}
            <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
              <div className="flex justify-start items-center gap-3.5">
                <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Active Tournaments</div>
                <div className="px-2 py-1 bg-emerald-50 rounded-lg flex justify-center items-center gap-1 shrink-0 whitespace-nowrap">
                  <Activity className="w-3.5 h-3.5 text-[#15803D]" />
                  <div className="text-[#15803D] text-xs font-medium">Across {formatWithCommas(activeClubs)} organizers</div>
                </div>
              </div>
              <div className="text-[#15803D] text-3xl font-bold">{formatWithCommas(activeTournaments.length)}</div>
              <div className="text-zinc-500 text-sm font-normal">Active</div>
            </div>

            <div className="w-px h-16 bg-slate-200" />

            {/* Stat 3: Completed This Month */}
            <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
              <div className="flex justify-start items-center gap-3.5">
                <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Completed</div>
              </div>
              <div className="text-[#15803D] text-3xl font-bold">{completedThisMonth.length}</div>
              <div className="text-zinc-500 text-sm font-normal">This Month</div>
            </div>

            <div className="w-px h-16 bg-slate-200" />

            {/* Stat 4: Total Participants */}
            <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
              <div className="flex justify-start items-center gap-3.5">
                <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Total Participants</div>
              </div>
              <div className="text-[#15803D] text-3xl font-bold">{formatWithCommas(totalParticipants)}</div>
              <div className="text-zinc-500 text-sm font-normal">Across all</div>
            </div>

            <div className="w-px h-16 bg-slate-200" />

            {/* Stat 5: Total Entry Fees */}
            <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
              <div className="flex justify-start items-center gap-3.5">
                <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Entry Fees</div>
              </div>
              <div className="text-[#15803D] text-3xl font-bold">{formatNaira(totalEntryFeesThisMonth)}</div>
              <div className="text-zinc-500 text-sm font-normal">This Month</div>
            </div>

          </div>
        </div>
      )}

      <div className="w-full space-y-6">
        {/* Main Content - Table Area */}
        <Card className="border-none shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
            <CardTitle className="text-zinc-700 text-xl font-medium whitespace-nowrap">All Tournaments</CardTitle>
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
                      filteredTournaments,
                      [
                        { header: "Name", key: "name" },
                        { header: "Organizer", key: "clubName" },
                        { header: "Visibility", key: "visibility" },
                        { header: "Dates", key: "dates" },
                        { header: "Days", key: "days" },
                        { header: "Registered Players", key: "players" },
                        { header: "Status", key: "status" },
                        { header: "Entry Fee", key: "entryFee" },
                      ],
                      "tournaments-export.csv"
                    );
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] hover:text-gray-900 transition-colors text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <FileSpreadsheet className="w-4 h-4 text-openclub-800" />
                  Export CSV
                </button>
                <button
                  onClick={() => {
                    setExportAnchorEl(null);
                    exportToPdf(
                      filteredTournaments,
                      [
                        { header: "Name", key: "name" },
                        { header: "Organizer", key: "clubName" },
                        { header: "Dates", key: "dates" },
                        { header: "Players", key: "players" },
                        { header: "Status", key: "status" },
                      ],
                      "tournaments-export.pdf",
                      "Tournaments Export"
                    );
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] hover:text-gray-900 transition-colors text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <FileText className="w-4 h-4 text-rose-600" />
                  Export PDF
                </button>
              </FloatingMenu>
              <Button
                onClick={() => router.push("/super-admin/tournaments/create")}
                className="h-10 bg-[#15803D] hover:bg-[#166534] border border-openclub-800/30 text-white gap-2 rounded-lg px-4 text-[14px] font-medium"
              >
                <Plus className="w-4 h-4" /> Add Tournament
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Filters */}
            <div className="px-6 pb-6 flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[240px] max-w-[500px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#15803D]" />
                <Input
                  placeholder="Search tournament name, organizer..."
                  className="pl-10 h-11 rounded-lg text-[14px] border-[#e1efe5] bg-[#f5faf6] text-[#15803D] focus:bg-[#e1efe5] placeholder:text-[#15803D]/60"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <SearchableSelect
                value={clubFilter}
                onValueChange={(v) => setClubFilter(v)}
                options={["All Organizers", ...uniqueClubs].map((v) => ({ value: v, label: v }))}
                className="min-w-[160px]"
                triggerClassName="h-11 bg-[#f5faf6] border-[#e1efe5] text-[#15803D] font-medium"
                placeholder="All Organizers"
              />
              <SearchableSelect
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v)}
                options={["All Status", ...uniqueStatuses].map((v) => ({ value: v, label: v }))}
                className="min-w-[160px]"
                triggerClassName="h-11 bg-[#f5faf6] border-[#e1efe5] text-[#15803D] font-medium"
                placeholder="All Status"
              />
              <SearchableSelect
                value={monthFilter}
                onValueChange={(v) => setMonthFilter(v)}
                options={["All Months", ...uniqueMonths].map((v) => ({ value: v, label: v }))}
                className="min-w-[160px]"
                triggerClassName="h-11 bg-[#f5faf6] border-[#e1efe5] text-[#15803D] font-medium"
                placeholder="All Months"
              />
              <SearchableSelect
                value={yearFilter}
                onValueChange={(v) => setYearFilter(v)}
                options={["All Years", ...uniqueYears].map((v) => ({ value: v, label: v }))}
                className="min-w-[160px]"
                triggerClassName="h-11 bg-[#f5faf6] border-[#e1efe5] text-[#15803D] font-medium"
                placeholder="All Years"
              />

            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto min-h-[400px]">
              <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-[#f5faf6] border-b border-[#e1efe5] text-[12px] font-semibold text-[#15803D] uppercase tracking-wider">
                    <th className="px-6 py-4 text-[12px] font-semibold text-[#15803D] uppercase tracking-wider">TOURNAMENT</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-[#15803D] uppercase tracking-wider">ORGANIZER & VISIBILITY</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-[#15803D] uppercase tracking-wider">DATES</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-[#15803D] uppercase tracking-wider">PLAYERS</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-[#15803D] uppercase tracking-wider">STATUS</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-[#15803D] uppercase tracking-wider">ENTRY FEE</th>
                    <th className="px-6 py-4 text-center text-[12px] font-semibold text-[#15803D] uppercase tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e1efe5]">
                  {error ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-red-500 font-normal text-[13px]">
                        {error}
                      </td>
                    </tr>
                  ) : loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="hover:bg-background/50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                            <div className="flex flex-col gap-1.5">
                              <Skeleton className="h-4 w-32 rounded-md" />
                              <Skeleton className="h-3 w-24 rounded-md" />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                            <div className="flex flex-col gap-1.5">
                              <Skeleton className="h-4 w-28 rounded-md" />
                              <Skeleton className="h-3 w-16 rounded-md" />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <Skeleton className="h-4 w-12 rounded-md" />
                        </td>
                        <td className="px-6 py-5">
                          <Skeleton className="h-5.5 w-16 rounded-full" />
                        </td>
                        <td className="px-6 py-5">
                          <Skeleton className="h-4 w-20 rounded-md" />
                        </td>
                        <td className="px-6 py-5">
                          <Skeleton className="h-4 w-16 rounded-md ml-auto" />
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-2">
                            <Skeleton className="h-7 w-12 rounded-md" />
                            <Skeleton className="h-7 w-12 rounded-md" />
                            <Skeleton className="h-7 w-7 rounded-md" />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : paginatedTournaments.length > 0 ? (
                    paginatedTournaments.map((t) => (
                      <tr key={t.id} className="hover:bg-background/50 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3 min-w-[220px]">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-openclub-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform border border-[#e1efe5]">
                              <Trophy className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col min-w-0 gap-0.5">
                              <span className="text-slate-900 text-[14px] font-medium truncate leading-tight" title={t.name}>{t.name}</span>
                              <span className="text-gray-500 text-[12px] font-normal truncate mt-0.5" title={t.courseName || t.clubName}>{t.courseName || t.clubName}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            {t.clubLogo ? (
                              <img src={t.clubLogo} alt={t.clubName} className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#e1efe5]" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#f5faf6] text-[#15803D] flex items-center justify-center text-xs font-semibold border border-[#e1efe5] flex-shrink-0 uppercase">
                                {t.clubName.substring(0, 2)}
                              </div>
                            )}
                            <div className="flex flex-col min-w-0 gap-1.5">
                              <span className="text-[13px] text-gray-600 font-medium truncate leading-tight">{t.clubName}</span>
                              <div className={cn("inline-flex items-center w-fit px-2 py-0.5 rounded border gap-1.5 text-[11px] font-medium uppercase", VISIBILITY_META[t.visibilityKey]?.badge || "text-gray-400 border-gray-200")}>
                                {React.createElement(VISIBILITY_META[t.visibilityKey]?.icon || Globe, { className: "w-3 h-3 flex-shrink-0" })}
                                <span>{t.visibility}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col min-w-0">
                            <span className="text-[13px] text-gray-600 font-medium truncate leading-tight">{t.dates}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="text-slate-900 text-[13px] font-medium leading-tight">{t.players}</span>
                            <span className="text-gray-500 text-[12px] font-normal mt-0.5">Registered</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap uppercase border", t.badge)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full",
                              t.statusKey === "ONGOING" ? "bg-[#15803D]" :
                                t.statusKey === "REGISTRATION_OPEN" ? "bg-[#15803D]" :
                                  t.statusKey === "COMPLETED" ? "bg-blue-500" :
                                    t.statusKey === "CANCELLED" ? "bg-red-500" :
                                      "bg-gray-400")} />
                            {t.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className="text-slate-900 text-[13px] font-medium whitespace-nowrap">{t.entryFee && t.entryFee > 0 ? formatNaira(t.entryFee) : "Free"}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-2">
                            <div className="inline-flex rounded-md shadow-sm h-8">
                              <button
                                onClick={() => openView(t)}
                                className="h-8 pl-3 pr-2.5 inline-flex items-center justify-center gap-1.5 rounded-l-md bg-[#15803D] text-white hover:bg-openclub-800 transition-colors border border-[#15803D] border-r-[rgba(255,255,255,0.2)]"
                                title="Manage Tournament"
                              >
                                <Settings className="w-3.5 h-3.5" />
                                <span className="text-[12px] font-medium leading-none whitespace-nowrap">Manage Tournament</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  if (activeManageDropdown === t.id) {
                                    closeManageDropdown();
                                  } else {
                                    setActiveManageDropdown(t.id);
                                    setManageDropdownAnchorEl(e.currentTarget);
                                    setManageDropdownTournament(t);
                                  }
                                }}
                                className="h-8 px-1.5 inline-flex items-center justify-center rounded-r-md bg-[#15803D] text-white hover:bg-openclub-800 transition-colors border border-[#15803D] border-l-0"
                                title="Manage Options"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  if (activeDropdown === t.id) {
                                    closeDropdown();
                                  } else {
                                    if (closeTimeoutRef.current != null) {
                                      window.clearTimeout(closeTimeoutRef.current);
                                      closeTimeoutRef.current = null;
                                    }
                                    setActiveDropdown(t.id);
                                    setDropdownAnchorEl(e.currentTarget);
                                    setDropdownTournament(t);
                                  }
                                }}
                                className="h-8 px-2.5 inline-flex items-center justify-center rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
                                title="More Actions"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <EmptyState
                          icon={Trophy}
                          title="No tournaments found"
                          description="Try adjusting your filters or search query to find what you're looking for."
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-6 border-t border-gray-50 flex items-center justify-between">
              <p className="text-[13px] text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTournaments.length)} of {filteredTournaments.length} tournaments
              </p>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </CardContent>
        </Card>
      </div>


      <FloatingMenu open={activeManageDropdown != null} anchorEl={manageDropdownAnchorEl} onClose={closeManageDropdown} placement="bottom-end" className="w-56 bg-white rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.1)] border border-gray-100 py-2">
        {manageDropdownTournament && [
          { id: "players", label: "Players & Registrations", icon: Users, color: "text-blue-500" },
          { id: "invite", label: "Invite a Player", icon: UserPlus, color: "text-emerald-600" },
          { id: "register", label: "Register a Player", icon: UserPlus, color: "text-emerald-500" },
          { id: "waitlist", label: "Waitlisted Players", icon: Clock, color: "text-orange-500" },
          { id: "groupings", label: "Flights & Tee Times", icon: Calendar, color: "text-indigo-500" },
          { id: "penalize", label: "Penalize a Player", icon: AlertTriangle, color: "text-red-500" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              const prefix = window.location.pathname.includes("super-admin") ? "super-admin" : "organizer-admin";
              router.push(`/${prefix}/tournaments/${manageDropdownTournament.id}?tab=${tab.id}`);
              closeManageDropdown();
            }}
            className="w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-3 transition-colors"
          >
            <tab.icon className={cn("w-4 h-4", tab.color)} />
            {tab.label}
          </button>
        ))}
      </FloatingMenu>

      <FloatingMenu open={activeDropdown != null} anchorEl={dropdownAnchorEl} onClose={closeDropdown} placement="top-end" className="w-60 bg-white rounded-xl shadow-sm border border-[#efefef] py-2">
        {dropdownTournament ? (
          <>
            <button
              onClick={() => handleMoreAction("edit", dropdownTournament)}
              className={cn(
                "w-full text-left px-4 py-2 text-[13px] flex items-center gap-3 transition-colors",
                dropdownTournament.statusKey === "CANCELLED" || dropdownTournament.statusKey === "COMPLETED"
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700 hover:bg-background"
              )}
              disabled={dropdownTournament.statusKey === "CANCELLED" || dropdownTournament.statusKey === "COMPLETED"}
            >
              <Edit2 className={cn("w-4 h-4", dropdownTournament.statusKey === "CANCELLED" || dropdownTournament.statusKey === "COMPLETED" ? "text-gray-300" : "text-blue-500")} />
              Edit Tournament
            </button>
            <button
              onClick={() => handleMoreAction("export", dropdownTournament)}
              className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <Download className="w-4 h-4 text-gray-400" />
              Export Tournament Data
            </button>
            <button
              onClick={() => handleMoreAction("copy-link", dropdownTournament)}
              className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <Link className="w-4 h-4 text-openclub-700" />
              Copy Tournament Link
            </button>
            <div className="h-px bg-background my-1" />
            <button
              onClick={() => handleMoreAction("register", dropdownTournament)}
              className={cn(
                "w-full text-left px-4 py-2 text-[13px] flex items-center gap-3 transition-colors",
                dropdownTournament.statusKey === "DRAFT" || dropdownTournament.statusKey === "CANCELLED" || dropdownTournament.statusKey === "COMPLETED"
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700"
              )}
              disabled={dropdownTournament.statusKey === "DRAFT" || dropdownTournament.statusKey === "CANCELLED" || dropdownTournament.statusKey === "COMPLETED"}
            >
              <UserPlus className="w-4 h-4 text-openclub-800" />
              Invite a Player
            </button>
            <button
              onClick={() => handleMoreAction("waitlist", dropdownTournament)}
              className={cn(
                "w-full text-left px-4 py-2 text-[13px] flex items-center gap-3 transition-colors",
                !dropdownTournament.enableWaitlist ? "text-gray-300 cursor-not-allowed" : "text-gray-700"
              )}
              disabled={!dropdownTournament.enableWaitlist}
            >
              <Clock className={cn("w-4 h-4", !dropdownTournament.enableWaitlist ? "text-gray-300" : "text-gray-400")} />
              View Waitlist
            </button>
            <div className="h-px bg-background my-1" />
            <button
              onClick={() => handleMoreAction("cancel", dropdownTournament)}
              className={cn(
                "w-full text-left px-4 py-2 text-[13px] font-normal transition-colors hover:bg-red-50 flex items-center gap-3",
                dropdownTournament.statusKey === "COMPLETED" || dropdownTournament.statusKey === "CANCELLED" || dropdownTournament.registrations > 0
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700",
              )}
              disabled={dropdownTournament.statusKey === "COMPLETED" || dropdownTournament.statusKey === "CANCELLED" || dropdownTournament.registrations > 0}
            >
              <Ban
                className={cn(
                  "w-4 h-4",
                  dropdownTournament.statusKey === "COMPLETED" || dropdownTournament.statusKey === "CANCELLED" || dropdownTournament.registrations > 0
                    ? "text-gray-300"
                    : "text-red-500",
                )}
              />
              {dropdownTournament.statusKey === "CANCELLED" ? "Cancelled" : "Cancel Tournament"}
            </button>
            <button
              onClick={() => handleMoreAction("delete", dropdownTournament)}
              className="w-full text-left px-4 py-2 text-[13px] font-normal text-gray-700 hover:bg-red-50 flex items-center gap-3 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
              Delete Tournament
            </button>
          </>
        ) : null}
      </FloatingMenu>

      <FloatingMenu
        open={strokesMenuRegistration != null}
        anchorEl={strokesMenuAnchorEl}
        onClose={() => {
          setStrokesMenuRegistration(null);
          setStrokesMenuAnchorEl(null);
        }}
        placement="bottom-end"
        className="w-44 bg-white rounded-xl shadow-sm border border-[#efefef] py-2"
      >
        {strokesMenuRegistration ? (
          <>
            {[1, 2, 3, 4].map((delta) => (
              <button
                key={delta}
                className="w-full text-left px-4 py-2 text-[13px] hover:text-gray-900 transition-colors text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                onClick={() => {
                  const reg = strokesMenuRegistration;
                  setStrokesMenuRegistration(null);
                  setStrokesMenuAnchorEl(null);
                  addTournamentRegistrationStrokes(reg, delta);
                }}
              >
                <Plus className="w-4 h-4 text-gray-400" /> +{delta} {delta === 1 ? "stroke" : "strokes"}
              </button>
            ))}
          </>
        ) : null}
      </FloatingMenu>

      <WaitlistModal
        isOpen={isWaitlistModalOpen}
        onClose={() => setIsWaitlistModalOpen(false)}
        tournamentId={selectedTournament?.id || ""}
        tournamentName={selectedTournament?.name || ""}
        onUpdate={() => reloadTournaments()}
      />

      <Modal
        isOpen={isRegisterPlayerModalOpen}
        onClose={() => {
          setIsRegisterPlayerModalOpen(false);
          setRegisterPlayerSearch("");
        }}
        title="Invite Player"
        size="md"
      >
        <div className="space-y-6 py-2">
          {/* Header */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100/50">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-openclub-800 flex items-center justify-center flex-shrink-0 shadow-sm">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[16px] font-medium text-gray-900 leading-tight">Invite via Email</h3>
              <p className="text-[13px] text-gray-500 mt-1">
                Invite a player directly to <span className="text-openclub-800 font-medium">{selectedTournament?.name}</span>
              </p>
            </div>
          </div>
          {/* Email Input Form */}
          <form onSubmit={handleInvitePlayer} className="space-y-4 px-1">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Email Address <span className="text-red-500">*</span></Label>
              <Input
                type="email"
                required
                value={registerPlayerSearch}
                onChange={(e) => setRegisterPlayerSearch(e.target.value)}
                placeholder="Enter player's email..."
                className="mt-1 h-11 border-gray-200"
              />
            </div>

            <Button
              type="submit"
              disabled={isRegistering || !registerPlayerSearch.trim() || !registerPlayerSearch.includes('@')}
              className="w-full h-12 bg-openclub-700 hover:bg-openclub-800 text-white rounded-xl font-normal"
            >
              {isRegistering ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Inviting...
                </div>
              ) : (
                "Send Invitation"
              )}
            </Button>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Tournament?"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCancelModalOpen(false)} className="rounded-lg font-normal">
              Close
            </Button>
            <Button
              className="rounded-lg font-normal px-8 text-white border bg-red-500 hover:bg-red-600 border-red-600/30"
              onClick={confirmCancel}
              disabled={mutating}
            >
              Yes, Cancel
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4">

          <h4 className="text-[14px] font-normal text-gray-900 mb-2">Cancel Tournament?</h4>
          <p className="text-gray-500 max-w-sm">
            This will set the tournament status to Cancelled.
          </p>
          <p className="text-gray-500 max-w-sm mt-6">
            Are you sure you want to cancel {selectedTournament?.name}?
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Tournament Permanently?"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="rounded-lg font-normal">
              Cancel
            </Button>
            <Button
              disabled={deleteConfirmText.trim().toUpperCase() !== "DELETE" || mutating}
              className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 border border-red-600/30 text-white rounded-lg font-normal px-8"
              onClick={confirmDelete}
            >
              Delete Tournament
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center py-2">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-red-50 text-red-500">
              <Trash2 className="h-10 w-10" />
            </div>
            <h4 className="text-[14px] font-normal text-gray-900 mb-2">Delete Tournament Permanently?</h4>
            <p className="text-gray-500 max-w-sm">
              Deleting this tournament will permanently erase all associated rounds, leaderboards, player registrations, and payment records. This action cannot be undone.
            </p>
          </div>

          <div className="space-y-3">
            <Label className="font-medium text-gray-700">
              Type <span className="text-red-600">&quot;DELETE&quot;</span> to confirm:
            </Label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="rounded-xl border-[#e1efe5] focus:border-red-500"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDisqualifyModalOpen}
        onClose={() => {
          setIsDisqualifyModalOpen(false);
          setActionRegistration(null);
        }}
        title="Disqualify Player?"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDisqualifyModalOpen(false)} className="rounded-lg font-normal">
              Cancel
            </Button>
            <Button
              className="rounded-lg font-normal px-8 text-white border bg-amber-500 hover:bg-amber-600 border-amber-600/30"
              onClick={confirmDisqualify}
            >
              Confirm Disqualify
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-amber-50 text-amber-500">
            <Ban className="h-10 w-10" />
          </div>
          <h4 className="text-[14px] font-normal text-gray-900 mb-2">Disqualify Player?</h4>
          <p className="text-gray-500 max-w-sm">
            Are you sure you want to disqualify <strong>{actionRegistration ? `${actionRegistration.user?.firstName} ${actionRegistration.user?.lastName}` : "this player"}</strong>?
          </p>
          <p className="text-[13px] text-amber-600 font-normal mt-4">
            This will mark their status as DISQUALIFIED. They can be re-enabled later.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={isRemovePlayerModalOpen}
        onClose={() => {
          setIsRemovePlayerModalOpen(false);
          setActionRegistration(null);
        }}
        title="Remove Player from Tournament?"
        footer={
          (selectedTournament?.statusKey === "ONGOING" || selectedTournament?.statusKey === "COMPLETED" || (selectedTournament?.lockedGroupingsDays && selectedTournament.lockedGroupingsDays.length > 0)) ? (
            <>
              <Button variant="outline" onClick={() => setIsRemovePlayerModalOpen(false)} className="rounded-lg font-normal">
                Cancel
              </Button>
              <Button
                className="rounded-lg font-normal px-8 text-white border bg-amber-500 hover:bg-amber-600 border-amber-600/30"
                onClick={() => {
                  setIsRemovePlayerModalOpen(false);
                  confirmDisqualify();
                }}
              >
                Disqualify Player
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsRemovePlayerModalOpen(false)} className="rounded-lg font-normal">
                Cancel
              </Button>
              <Button
                className="rounded-lg font-normal px-8 text-white border bg-red-500 hover:bg-red-600 border-red-600/30"
                onClick={confirmRemovePlayer}
              >
                Remove Player
              </Button>
            </>
          )
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-red-50 text-red-500">
            {(selectedTournament?.statusKey === "ONGOING" || selectedTournament?.statusKey === "COMPLETED" || (selectedTournament?.lockedGroupingsDays && selectedTournament.lockedGroupingsDays.length > 0)) ? (
              <Ban className="h-10 w-10 text-amber-500" />
            ) : (
              <UserMinus className="h-10 w-10" />
            )}
          </div>
          <h4 className="text-[14px] font-normal text-gray-900 mb-2">
            {(selectedTournament?.statusKey === "ONGOING" || selectedTournament?.statusKey === "COMPLETED" || (selectedTournament?.lockedGroupingsDays && selectedTournament.lockedGroupingsDays.length > 0)) ? "Cannot Remove Player" : "Remove Player?"}
          </h4>
          <p className="text-gray-500 max-w-sm">
            {(selectedTournament?.statusKey === "ONGOING" || selectedTournament?.statusKey === "COMPLETED" || (selectedTournament?.lockedGroupingsDays && selectedTournament.lockedGroupingsDays.length > 0)) ? (
              <>
                The tournament has already started. You cannot completely remove players from an ongoing tournament. Please use the <strong>Disqualify</strong> button instead.
              </>
            ) : (
              <>
                Are you sure you want to permanently remove <strong>{actionRegistration ? `${actionRegistration.user?.firstName} ${actionRegistration.user?.lastName}` : "this player"}</strong> from the tournament?
              </>
            )}
          </p>
          {!(selectedTournament?.statusKey === "ONGOING" || selectedTournament?.statusKey === "COMPLETED" || (selectedTournament?.lockedGroupingsDays && selectedTournament.lockedGroupingsDays.length > 0)) && (
            <p className="text-[13px] text-red-600 font-normal mt-4 bg-red-50 p-3 rounded-lg border border-red-100">
              Warning: This action is permanent and will delete their registration records for this tournament.
            </p>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isEnablePlayerModalOpen}
        onClose={() => {
          setIsEnablePlayerModalOpen(false);
          setActionRegistration(null);
        }}
        title="Re-enable Player?"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEnablePlayerModalOpen(false)} className="rounded-lg font-normal">
              Cancel
            </Button>
            <Button
              className="rounded-lg font-normal px-8 text-white border bg-openclub-700 hover:bg-openclub-800 border-openclub-800/30"
              onClick={confirmEnablePlayer}
            >
              Confirm Enable
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-emerald-50 text-openclub-700">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h4 className="text-[14px] font-normal text-gray-900 mb-2">Re-enable Player?</h4>
          <p className="text-gray-500 max-w-sm">
            Are you sure you want to re-enable <strong>{actionRegistration ? `${actionRegistration.user?.firstName} ${actionRegistration.user?.lastName}` : "this player"}</strong>?
          </p>
          <p className="text-[13px] text-openclub-800 font-normal mt-4">
            This will set their status back to APPROVED and allow them to be grouped for tee times.
          </p>
        </div>
      </Modal>

      <CreateTournamentWizard
        isOpen={isWizardOpen}
        tournamentId={wizardTournamentId}
        onClose={() => {
          setIsWizardOpen(false);
          setWizardTournamentId(null);
        }}
        onSuccess={() => reloadTournaments()}
      />
    </div>
  );
}

