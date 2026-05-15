"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
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
} from "lucide-react";
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatThousandsInput, formatWithCommas } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { cancelTournament, deleteTournament, getTournaments, updateTournament } from "@/lib/api/tournaments";
import { getAdminUsers } from "@/lib/api/members";
import {
  addRegistrationStrokes,
  clearRegistrationStrokes,
  getRegistrations,
  updateRegistrationStatus,
  type RegistrationListItem,
} from "@/lib/api/registrations";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { FloatingMenu } from "@/components/ui/floating-menu";
import { CreateTournamentWizard } from "@/components/tournaments/CreateTournamentWizard";

type TournamentStatus = "DRAFT" | "REGISTRATION_OPEN" | "ONGOING" | "COMPLETED" | "CANCELLED";

type ApiTournament = {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  status: TournamentStatus;
  entryFee: number | null;
  maxPlayers: number | null;
  registrationDeadline?: string | null;
  playerTypes: string[];
  club: { id: string; name: string } | null;
  visibility: "PUBLIC" | "PRIVATE" | "INVITE_ONLY";
  createdAt: string;
  _count?: { registrations: number };
};

type TournamentRow = {
  id: string;
  name: string;
  clubName: string;
  types: string[];
  dates: string;
  players: string;
  status: string;
  badge: string;
  entryFee: number | null;
  startDate: string;
  endDate: string | null;
  maxPlayers: number | null;
  statusKey: TournamentStatus;
  visibility: string;
  visibilityKey: "PUBLIC" | "PRIVATE" | "INVITE_ONLY";
  createdAt: string;
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
  DRAFT: { label: "Draft", color: "#94a3b8", badge: "bg-slate-50 text-slate-600" },
  REGISTRATION_OPEN: { label: "Upcoming", color: "#10b981", badge: "bg-emerald-50 text-emerald-600" },
  ONGOING: { label: "Ongoing", color: "#3b82f6", badge: "bg-blue-50 text-blue-600" },
  COMPLETED: { label: "Completed", color: "#8b5cf6", badge: "bg-violet-50 text-violet-600" },
  CANCELLED: { label: "Cancelled", color: "#f43f5e", badge: "bg-rose-50 text-rose-600" },
};
const VISIBILITY_META: Record<"PUBLIC" | "PRIVATE" | "INVITE_ONLY", { label: string; badge: string; icon: any }> = {
  PUBLIC: { label: "Public", badge: "bg-emerald-50 text-emerald-600", icon: Globe },
  PRIVATE: { label: "Private", badge: "bg-gray-100 text-gray-600", icon: Eye },
  INVITE_ONLY: { label: "Invite Only", badge: "bg-amber-50 text-amber-600", icon: Shield },
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
  if (value == null) return "—";
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
  const tomorrowYMD = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toLocalYMD(d);
  })();

  const isMounted = useSyncExternalStore(
    () => () => {},
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
  const [mutating, setMutating] = useState(false);

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardTournamentId, setWizardTournamentId] = useState<string | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
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
  const [registrationActionId, setRegistrationActionId] = useState<string | null>(null);
  const [strokesMenuRegistration, setStrokesMenuRegistration] = useState<RegistrationListItem | null>(null);
  const [strokesMenuAnchorEl, setStrokesMenuAnchorEl] = useState<HTMLButtonElement | null>(null);

  const [isRegisterPlayerModalOpen, setIsRegisterPlayerModalOpen] = useState(false);
  const [registerPlayerSearch, setRegisterPlayerSearch] = useState("");
  const [registerPlayerResults, setRegisterPlayerResults] = useState<any[]>([]);
  const [isSearchingPlayers, setIsSearchingPlayers] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

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
    const registrations = t._count?.registrations ?? 0;
    const types = Array.isArray(t.playerTypes) ? t.playerTypes : [];
    return {
      id: t.id,
      name: t.name,
      clubName,
      types,
      dates: formatDateRange(t.startDate, t.endDate),
      players: formatPlayers(registrations, t.maxPlayers),
      status: STATUS_META[t.status]?.label ?? t.status,
      badge: STATUS_META[t.status]?.badge ?? "bg-gray-100 text-gray-500",
      entryFee: t.entryFee,
      startDate: t.startDate,
      endDate: t.endDate,
      maxPlayers: t.maxPlayers,
      statusKey: t.status,
      visibility: VISIBILITY_META[t.visibility]?.label ?? t.visibility,
      visibilityKey: t.visibility,
      createdAt: t.createdAt,
      registrations,
    };
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredTournaments = rows.filter((t) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      q.length === 0 ||
      t.name.toLowerCase().includes(q) ||
      t.clubName.toLowerCase().includes(q);

    const matchesClub = clubFilter === "All Organizers" || t.clubName === clubFilter;
    const matchesStatus = statusFilter === "All Status" || t.status === statusFilter;
    return matchesSearch && matchesClub && matchesStatus;
  });

  // Paginated data
  const totalPages = Math.ceil(filteredTournaments.length / itemsPerPage);
  const paginatedTournaments = filteredTournaments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const uniqueClubs = Array.from(new Set(rows.map((t) => t.clubName))).filter((c) => c !== "—");
  const uniqueStatuses = Array.from(new Set(rows.map((t) => t.status)));

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
    { color: "text-emerald-600", bg: "bg-emerald-50" },
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
    setSelectedTournament(tournament);
    setStrokesMenuRegistration(null);
    setStrokesMenuAnchorEl(null);
    setRegistrationsLoading(true);
    setRegistrationsPage(1);
    setRegistrationsSearch("");
    setRegistrationsDebouncedSearch("");
    setRegistrationsStatusFilter("All Status");
    setRegistrationsPaymentFilter("All Payments");
    setRegistrationsDisqualifiedFilter("All Players");
    setRegistrationsMode("server");
    setRegistrationsInitialized(false);
    setRegistrations([]);
    setRegistrationsAll([]);
    setRegistrationsTotal(0);
    setRegistrationsTournamentTotal(0);
    setIsViewModalOpen(true);
  };

  useEffect(() => {
    const handle = window.setTimeout(() => setRegistrationsDebouncedSearch(registrationsSearch.trim()), 250);
    return () => window.clearTimeout(handle);
  }, [registrationsSearch]);

  useEffect(() => {
    if (!isViewModalOpen || !selectedTournament?.id) return;
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
  }, [isViewModalOpen, selectedTournament?.id, registrationsPerPage]);

  useEffect(() => {
    if (!isViewModalOpen || !selectedTournament?.id) return;
    if (!registrationsInitialized) return;
    if (registrationsMode !== "server") return;
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
    isViewModalOpen,
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
      setRegisterPlayerResults([]);
      return;
    }
    const q = registerPlayerSearch.trim();
    if (q.length < 2) {
      setRegisterPlayerResults([]);
      return;
    }

    let cancelled = false;
    const handle = window.setTimeout(async () => {
      setIsSearchingPlayers(true);
      try {
        const { items } = await getAdminUsers({ search: q, take: 10 });
        if (!cancelled) {
          setRegisterPlayerResults(Array.isArray(items) ? items : []);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          console.error("Player search failed", e);
        }
      } finally {
        if (!cancelled) setIsSearchingPlayers(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [isRegisterPlayerModalOpen, registerPlayerSearch]);

  const handleRegisterPlayer = async (userId: string) => {
    if (!selectedTournament?.id) return;
    setIsRegistering(true);
    try {
      const { registerForTournament } = await import("@/lib/api/registrations");
      await registerForTournament({
        tournamentId: selectedTournament.id,
        userId,
      });
      toast.success("Player registered successfully");
      setIsRegisterPlayerModalOpen(false);
      setRegisterPlayerSearch("");
      
      // Refresh everything
      reloadTournaments();
      
      if (registrationsMode === "server") {
        setRegistrationsPage(1); // Go to first page to see the new player
        setRegistrationsLoading(true);
        const { items, total } = await getRegistrations({
          tournamentId: selectedTournament.id,
          skip: 0,
          take: registrationsPerPage,
        });
        setRegistrations(Array.isArray(items) ? items : []);
        setRegistrationsTotal(typeof total === "number" ? total : 0);
        setRegistrationsTournamentTotal(typeof total === "number" ? total : (prev => prev + 1));
        setRegistrationsLoading(false);
      } else {
         // Full reload for client mode
         setRegistrationsInitialized(false);
         setIsViewModalOpen(false);
         setTimeout(() => setIsViewModalOpen(true), 10);
      }
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || "Failed to register player");
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
    if (tournament.statusKey === "ONGOING") {
      toast.error("Ongoing tournaments cannot be edited");
      return;
    }
    setWizardTournamentId(tournament.id);
    setIsWizardOpen(true);
  };

  const openCancel = (tournament: TournamentRow) => {
    closeDropdown();
    setSelectedTournament(tournament);
    setIsCancelModalOpen(true);
  };

  const openDelete = (tournament: TournamentRow) => {
    closeDropdown();
    setSelectedTournament(tournament);
    setDeleteConfirmText("");
    setIsDeleteModalOpen(true);
  };

  const handleMoreAction = (action: string, tournament: TournamentRow) => {
    closeDropdown();
    if (action === "export") {
      const blob = new Blob([JSON.stringify(tournament, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(tournament?.name || "tournament").toString().replaceAll(" ", "-").toLowerCase()}-export.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
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
    cancelTournament(selectedTournament.id)
      .then(() => {
        toast.success(`${selectedTournament?.name} has been cancelled`);
        setIsCancelModalOpen(false);
        return reloadTournaments();
      })
      .catch((e: unknown) => toast.error(getErrorMessage(e) || "Failed to cancel tournament"))
      .finally(() => setMutating(false));
  };

  const confirmDelete = () => {
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE" || !selectedTournament?.id) return;
    setMutating(true);
    deleteTournament(selectedTournament.id)
      .then(() => {
        toast.success(`${selectedTournament?.name} has been deleted`);
        setIsDeleteModalOpen(false);
        return reloadTournaments();
      })
      .catch((e: unknown) => toast.error(getErrorMessage(e) || "Failed to delete tournament"))
      .finally(() => setMutating(false));
  };

  return (
    <div className="space-y-8 w-full max-w-full px-2 pb-10 font-sans">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard
          title="Total Tournaments"
          value={formatWithCommas(totalTournaments)}
          icon={Trophy}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          loading={loading}
        />
        <StatCard
          title="Active Tournaments"
          value={formatWithCommas(activeTournaments.length)}
          subValue={loading ? undefined : `Across ${formatWithCommas(activeClubs)} organizers`}
          icon={Calendar}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          loading={loading}
        />
        <StatCard
          title="Completed This Month"
          value={String(completedThisMonth.length)}
          icon={Trophy}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
          loading={loading}
        />
        <StatCard
          title="Total Participants"
          value={formatWithCommas(totalParticipants)}
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          loading={loading}
        />
        <StatCard
          title="Total Entry Fees"
          value={formatNaira(totalEntryFeesThisMonth)}
          subValue="This month"
          icon={Wallet}
          iconBg="bg-red-50"
          iconColor="text-red-600"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Content - Table Area */}
        <div className="xl:col-span-3 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
              <CardTitle className="text-xl font-bold">All Tournaments</CardTitle>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" className="h-10 border-gray-200 text-gray-600 gap-2 rounded-lg px-4 text-[14px] font-bold">
                  <Download className="w-4 h-4" /> Export
                </Button>
                <Button 
                  onClick={() => setIsWizardOpen(true)}
                  className="h-10 bg-[#10b981] hover:bg-[#0da673] border border-emerald-600/30 text-white gap-2 rounded-lg px-4 text-[14px] font-bold"
                >
                  <Plus className="w-4 h-4" /> Add Tournament
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Filters */}
              <div className="px-6 pb-6 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search tournament name, organizer..." 
                    className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white rounded-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <SearchableSelect
                  value={clubFilter}
                  onValueChange={setClubFilter}
                  options={["All Organizers", ...uniqueClubs].map((v) => ({ value: v, label: v }))}
                  className="min-w-[160px]"
                  triggerClassName="h-11 bg-white"
                  placeholder="All Organizers"
                />
                <SearchableSelect
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  options={["All Status", ...uniqueStatuses].map((v) => ({ value: v, label: v }))}
                  className="min-w-[160px]"
                  triggerClassName="h-11 bg-white"
                  placeholder="All Status"
                />
                <SearchableSelect
                  value={"All Dates"}
                  onValueChange={() => {}}
                  options={[{ value: "All Dates", label: "All Dates" }]}
                  className="min-w-[160px]"
                  triggerClassName="h-11 bg-white"
                  placeholder="All Dates"
                  disabled
                />

              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Tournament Name</th>
                      <th className="px-6 py-4">Organizer</th>
                      <th className="px-6 py-4">Dates</th>
                      <th className="px-6 py-4">Players</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Visibility</th>
                      <th className="px-6 py-4 text-right">Entry Fee</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {error ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-red-500 font-bold text-[13px]">
                          {error}
                        </td>
                      </tr>
                    ) : loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Skeleton className="w-8 h-8 rounded-lg" />
                              <Skeleton className="h-4 w-32 rounded-md" />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Skeleton className="h-4 w-24 rounded-md" />
                          </td>
                          <td className="px-6 py-4">
                            <Skeleton className="h-4 w-28 rounded-md" />
                          </td>
                          <td className="px-6 py-4">
                            <Skeleton className="h-4 w-16 rounded-md" />
                          </td>
                          <td className="px-6 py-4">
                            <Skeleton className="h-4 w-16 rounded-md" />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Skeleton className="h-4 w-20 rounded-md ml-auto" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Skeleton className="h-9 w-9 rounded-lg" />
                              <Skeleton className="h-9 w-9 rounded-lg" />
                              <Skeleton className="h-9 w-9 rounded-lg" />
                              <Skeleton className="h-9 w-9 rounded-lg" />
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : paginatedTournaments.length > 0 ? (
                      paginatedTournaments.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Trophy className="w-4 h-4" />
                              </div>
                              <span className="text-[14px] font-bold text-gray-900">{t.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[13px] text-gray-500 font-medium">{t.clubName}</td>
                          <td className="px-6 py-4 text-[13px] text-gray-500 font-medium whitespace-nowrap">{t.dates}</td>
                          <td className="px-6 py-4 text-[13px] text-gray-900 font-bold">{t.players}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${t.badge}`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold", VISIBILITY_META[t.visibilityKey]?.badge)}>
                              {React.createElement(VISIBILITY_META[t.visibilityKey]?.icon || Globe, { className: "w-3 h-3" })}
                              {t.visibility}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[14px] font-bold text-gray-900 text-right">{formatNaira(t.entryFee)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openView(t)}
                                className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-[#10b981]/10 hover:text-[#10b981] transition-colors"
                                title="View Tournament"
                              >
                                <Eye className="w-4.5 h-4.5" />
                              </button>
                              <button
                                onClick={() => openEdit(t)}
                                className={cn(
                                  "h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white transition-colors",
                                  t.statusKey === "CANCELLED" || t.statusKey === "COMPLETED" || t.statusKey === "ONGOING"
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "text-blue-600 hover:bg-blue-50"
                                )}
                                title={
                                  t.statusKey === "CANCELLED" ? "Cancelled tournaments cannot be edited" 
                                  : t.statusKey === "COMPLETED" ? "Completed tournaments cannot be edited"
                                  : t.statusKey === "ONGOING" ? "Ongoing tournaments cannot be edited"
                                  : "Edit Tournament"
                                }
                                disabled={t.statusKey === "CANCELLED" || t.statusKey === "COMPLETED" || t.statusKey === "ONGOING"}
                              >
                                <Edit2 className="w-4.5 h-4.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedTournament(t);
                                  setIsRegisterPlayerModalOpen(true);
                                }}
                                className={cn(
                                  "h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white transition-colors",
                                  t.statusKey === "DRAFT" || t.statusKey === "CANCELLED" || t.statusKey === "COMPLETED"
                                    ? "text-gray-300 cursor-not-allowed"
                                    : t.maxPlayers !== null && t.registrations >= t.maxPlayers
                                      ? "text-amber-500 hover:bg-amber-50"
                                      : "text-[#10b981] hover:bg-[#10b981]/10"
                                )}
                                title={
                                  t.statusKey === "DRAFT" ? "Draft tournaments cannot have players registered"
                                  : t.statusKey === "CANCELLED" ? "Cancelled tournaments cannot have players registered"
                                  : t.statusKey === "COMPLETED" ? "Completed tournaments cannot have players registered"
                                  : t.maxPlayers !== null && t.registrations >= t.maxPlayers
                                    ? "Tournament Full (Player will be Waitlisted)"
                                    : "Register Player"
                                }
                                disabled={t.statusKey === "DRAFT" || t.statusKey === "CANCELLED" || t.statusKey === "COMPLETED"}
                              >
                                <Plus className="w-4.5 h-4.5" />
                              </button>
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
                                  className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors"
                                >
                                  <MoreHorizontal className="w-4.5 h-4.5" />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                              <Trophy className="w-8 h-8 text-gray-200" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-[15px] font-bold text-gray-900">No tournaments found</p>
                              <p className="text-[13px] text-gray-400">Try adjusting your filters or search query.</p>
                            </div>
                          </div>
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

        {/* Right Sidebar */}
        <div className="space-y-8">
          {/* Status Donut Chart */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-0">
              <CardTitle className="text-xl font-bold">Tournaments by Status</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="h-[240px] w-full relative">
                {isMounted && !loading ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                ) : (
                  <Skeleton className="h-full w-full rounded-full" />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[13px] text-gray-400 font-medium">Total</p>
                  <p className="text-2xl font-bold text-gray-800">{loading ? "—" : formatWithCommas(totalTournaments)}</p>
                </div>
              </div>
              
              <div className="w-full space-y-3 mt-4">
                {statusData.map((item) => (
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

          {/* Upcoming List */}
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-xl font-bold">Upcoming Tournaments</CardTitle>
              {upcomingList.length > 0 && (
                <Button 
                  variant="link" 
                  className="text-[#10b981] p-0 h-auto font-bold text-sm hover:no-underline"
                  onClick={() => setStatusFilter("Upcoming")}
                >
                  View All
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6 p-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4 rounded-md" />
                      <Skeleton className="h-3 w-1/2 rounded-md" />
                      <Skeleton className="h-3 w-1/3 rounded-md" />
                    </div>
                  </div>
                ))
              ) : upcomingList.length > 0 ? (
                upcomingList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => openView(item)}
                    className="flex items-start gap-4 p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
                  >
                    <div className={`p-2.5 rounded-xl ${item.bg} ${item.color} flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-gray-800 leading-tight group-hover:text-[#10b981] transition-colors line-clamp-1">{item.name}</p>
                      <p className="text-[13px] text-gray-500 mt-1 line-clamp-1">{item.clubName}</p>
                      <p className="text-[12px] text-gray-400 mt-0.5">{item.dates}</p>
                    </div>
                    <span className="text-[11px] font-bold bg-gray-50 text-emerald-600 px-2 py-1 rounded-lg whitespace-nowrap">
                      {item.days}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">No upcoming tournaments</p>
                  <p className="text-[12px] text-gray-400 mt-1">Check back later or add a new one</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <FloatingMenu open={activeDropdown != null} anchorEl={dropdownAnchorEl} onClose={closeDropdown} placement="top-end" className="w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-2">
        {dropdownTournament ? (
          <>
            <button
              onClick={() => handleMoreAction("export", dropdownTournament)}
              className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <Download className="w-4 h-4 text-gray-400" />
              Export Tournament Data
            </button>
            <button
              onClick={() => handleMoreAction("copy-link", dropdownTournament)}
              className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <Link className="w-4 h-4 text-emerald-500" />
              Copy Tournament Link
            </button>
            <div className="h-px bg-gray-50 my-1" />
            <button
              onClick={() => handleMoreAction("cancel", dropdownTournament)}
              className={cn(
                "w-full text-left px-4 py-2 text-sm font-medium hover:bg-red-50 flex items-center gap-3",
                dropdownTournament.statusKey === "COMPLETED" || dropdownTournament.statusKey === "CANCELLED"
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-red-600",
              )}
              disabled={dropdownTournament.statusKey === "COMPLETED" || dropdownTournament.statusKey === "CANCELLED"}
            >
              <Ban
                className={cn(
                  "w-4 h-4",
                  dropdownTournament.statusKey === "COMPLETED" || dropdownTournament.statusKey === "CANCELLED"
                    ? "text-gray-300"
                    : "text-red-500",
                )}
              />
              {dropdownTournament.statusKey === "CANCELLED" ? "Cancelled" : "Cancel Tournament"}
            </button>
            <button
              onClick={() => handleMoreAction("delete", dropdownTournament)}
              className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3"
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
        className="w-44 bg-white rounded-2xl shadow-xl border border-gray-100 py-2"
      >
        {strokesMenuRegistration ? (
          <>
            {[1, 2, 3, 4].map((delta) => (
              <button
                key={delta}
                className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3"
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

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setStrokesMenuRegistration(null);
          setStrokesMenuAnchorEl(null);
          setIsViewModalOpen(false);
        }}
        title="Tournament Details"
        size="xl"
        footer={
          <Button
            variant="outline"
            onClick={() => {
              setStrokesMenuRegistration(null);
              setStrokesMenuAnchorEl(null);
              setIsViewModalOpen(false);
            }}
            className="rounded-lg font-bold"
          >
            Close
          </Button>
        }
      >
        <div className="space-y-5">
          <div className="space-y-1">
            <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">Tournament</p>
            <p className="text-[16px] font-bold text-gray-900">{selectedTournament?.name || "—"}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1">
              <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">Organizer</p>
              <p className="text-[14px] font-bold text-gray-900">{selectedTournament?.clubName || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">Status</p>
              <p className="text-[14px] font-bold text-gray-900">{selectedTournament?.status || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">Dates</p>
              <p className="text-[14px] font-bold text-gray-900">{selectedTournament?.dates || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">Entry Fee</p>
              <p className="text-[14px] font-bold text-gray-900">{formatNaira(selectedTournament?.entryFee ?? null)}</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">Registrations</p>
              <div className="flex items-center gap-3">
                <p className="text-[12px] text-gray-400 font-medium">{formatWithCommas(registrationsTournamentTotal)} total</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={registrationsSearch}
                  onChange={(e) => {
                    setRegistrationsPage(1);
                    if (registrationsMode === "server") setRegistrationsLoading(true);
                    setRegistrationsSearch(e.target.value);
                  }}
                  placeholder="Search name or email..."
                  className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white rounded-lg"
                />
              </div>
              <SearchableSelect
                value={registrationsStatusFilter === "All Status" ? "All Status" : registrationsStatusFilter}
                onValueChange={(v) => {
                  const next =
                    v === "All Status" ||
                    v === "PENDING" ||
                    v === "APPROVED" ||
                    v === "REJECTED" ||
                    v === "WAITLISTED" ||
                    v === "DISQUALIFIED"
                      ? v
                      : "All Status";
                  setRegistrationsPage(1);
                  if (registrationsMode === "server") setRegistrationsLoading(true);
                  setRegistrationsStatusFilter(next);
                }}
                options={[
                  { value: "All Status", label: "All Status" },
                  { value: "PENDING", label: "Pending" },
                  { value: "APPROVED", label: "Approved" },
                  { value: "REJECTED", label: "Rejected" },
                  { value: "WAITLISTED", label: "Waitlisted" },
                  { value: "DISQUALIFIED", label: "Disqualified" },
                ]}
                className="min-w-[160px]"
                triggerClassName="h-11 bg-white"
                placeholder="All Status"
              />
              <SearchableSelect
                value={registrationsPaymentFilter === "All Payments" ? "All Payments" : registrationsPaymentFilter}
                onValueChange={(v) => {
                  const next = v === "All Payments" || v === "PAID" || v === "UNPAID" || v === "REFUNDED" ? v : "All Payments";
                  setRegistrationsPage(1);
                  if (registrationsMode === "server") setRegistrationsLoading(true);
                  setRegistrationsPaymentFilter(next);
                }}
                options={[
                  { value: "All Payments", label: "All Payments" },
                  { value: "PAID", label: "Paid" },
                  { value: "UNPAID", label: "Unpaid" },
                  { value: "REFUNDED", label: "Refunded" },
                ]}
                className="min-w-[160px]"
                triggerClassName="h-11 bg-white"
                placeholder="All Payments"
              />
              <SearchableSelect
                value={registrationsDisqualifiedFilter}
                onValueChange={(v) => {
                  const next =
                    v === "All Players" || v === "Enabled Players" || v === "Disqualified Players"
                      ? v
                      : "All Players";
                  setRegistrationsPage(1);
                  if (registrationsMode === "server") setRegistrationsLoading(true);
                  setRegistrationsDisqualifiedFilter(next);
                }}
                options={[
                  { value: "All Players", label: "All Players" },
                  { value: "Enabled Players", label: "Enabled Players" },
                  { value: "Disqualified Players", label: "Disqualified Players" },
                ]}
                className="min-w-[200px]"
                triggerClassName="h-11 bg-white"
                placeholder="All Players"
              />
            </div>

            {registrationsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-40 rounded-md" />
                      <Skeleton className="h-3 w-56 rounded-md" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : registrationsPageItems.length > 0 ? (
              <div className="rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                {registrationsPageItems.map((r) => {
                  const fullName = `${r.user?.firstName ?? ""} ${r.user?.lastName ?? ""}`.trim();
                  const statusBadge =
                    r.status === "DISQUALIFIED"
                      ? "bg-gray-100 text-gray-800"
                      : r.status === "APPROVED"
                      ? "bg-emerald-50 text-emerald-700"
                      : r.status === "REJECTED"
                        ? "bg-red-50 text-red-700"
                        : r.status === "WAITLISTED"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700";
                  const paymentBadge =
                    r.paymentStatus === "PAID"
                      ? "bg-emerald-50 text-emerald-700"
                      : r.paymentStatus === "REFUNDED"
                        ? "bg-violet-50 text-violet-700"
                        : "bg-gray-50 text-gray-700";
                  return (
                    <div key={r.id} className="px-4 py-3 hover:bg-gray-50/40 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="text-[13px] text-gray-900 font-bold truncate">{fullName || "—"}</p>
                            <span className={cn("text-[11px] font-bold px-2 py-1 rounded-lg", statusBadge)}>
                              {r.status}
                            </span>
                            <span className={cn("text-[11px] font-bold px-2 py-1 rounded-lg", paymentBadge)}>
                              {r.paymentStatus}
                            </span>
                            {typeof r.extraStrokes === "number" && r.extraStrokes > 0 ? (
                              <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-amber-50 text-amber-700">
                                +{r.extraStrokes} strokes
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[12px] text-gray-500 font-medium break-all">{r.user?.email ?? "—"}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {r.status === "DISQUALIFIED" ? (
                            <button
                              className={cn(
                                "h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white transition-colors",
                                registrationActionId === r.id
                                  ? "text-gray-300 cursor-not-allowed"
                                  : "text-emerald-600 hover:bg-emerald-50",
                              )}
                              title="Enable Player"
                              disabled={registrationActionId === r.id}
                              onClick={() => updateTournamentRegistrationStatus(r.id, "APPROVED")}
                            >
                              <CheckCircle2 className="w-4.5 h-4.5" />
                            </button>
                          ) : (
                            <button
                              className={cn(
                                "h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white transition-colors",
                                registrationActionId === r.id
                                  ? "text-gray-300 cursor-not-allowed"
                                  : "text-red-600 hover:bg-red-50",
                              )}
                              title="Disqualify Player"
                              disabled={registrationActionId === r.id}
                              onClick={() => updateTournamentRegistrationStatus(r.id, "DISQUALIFIED")}
                            >
                              <Ban className="w-4.5 h-4.5" />
                            </button>
                          )}
                          <button
                            className={cn(
                              "h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white transition-colors",
                              registrationActionId === r.id
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-gray-600 hover:bg-gray-50",
                            )}
                            title="Add Strokes"
                            disabled={registrationActionId === r.id}
                            onClick={(e) => {
                              if (registrationActionId === r.id) return;
                              if (strokesMenuRegistration?.id === r.id) {
                                setStrokesMenuRegistration(null);
                                setStrokesMenuAnchorEl(null);
                                return;
                              }
                              setStrokesMenuRegistration(r);
                              setStrokesMenuAnchorEl(e.currentTarget);
                            }}
                          >
                            <Plus className="w-4.5 h-4.5" />
                          </button>
                          <button
                            className={cn(
                              "h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white transition-colors",
                              registrationActionId === r.id || (typeof r.extraStrokes === "number" && r.extraStrokes <= 0)
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-gray-600 hover:bg-gray-50",
                            )}
                            title="Clear Strokes"
                            disabled={
                              registrationActionId === r.id || (typeof r.extraStrokes === "number" ? r.extraStrokes <= 0 : true)
                            }
                            onClick={() => clearTournamentRegistrationStrokes(r)}
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-gray-100 bg-gray-50/40 px-4 py-4 text-[13px] text-gray-500 font-medium">
                No registrations yet for this tournament.
              </div>
            )}

            {!registrationsLoading && registrationsFilteredTotal > 0 && (
              <div className="pt-2 flex items-center justify-between gap-4">
                <p className="text-[13px] text-gray-500 font-medium">
                  Showing {(registrationsPage - 1) * registrationsPerPage + 1} to{" "}
                  {Math.min(registrationsPage * registrationsPerPage, registrationsFilteredTotal)} of{" "}
                  {formatWithCommas(registrationsFilteredTotal)} registrations
                </p>
                <Pagination
                  currentPage={registrationsPage}
                  totalPages={Math.max(1, Math.ceil(registrationsFilteredTotal / registrationsPerPage))}
                  onPageChange={(p) => {
                    if (registrationsMode === "server") setRegistrationsLoading(true);
                    setRegistrationsPage(p);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isRegisterPlayerModalOpen}
        onClose={() => {
          setIsRegisterPlayerModalOpen(false);
          setRegisterPlayerSearch("");
          setRegisterPlayerResults([]);
        }}
        title="Register Player"
        size="md"
      >
        <div className="space-y-6 py-2">
          {/* Header */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/50">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-gray-900 leading-tight">Manual Registration</h3>
              <p className="text-[13px] text-gray-500 mt-1">
                Search and add players directly to <span className="text-emerald-600 font-bold">{selectedTournament?.name}</span>
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="space-y-2 px-1">
            <Label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider ml-1">Find Player</Label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#10b981] transition-colors" />
              <Input
                value={registerPlayerSearch}
                onChange={(e) => setRegisterPlayerSearch(e.target.value)}
                placeholder="Search by name, email or handicap..."
                className="pl-12 h-12 bg-white border-gray-200 focus:border-[#10b981] focus:ring-4 focus:ring-[#10b981]/5 rounded-xl text-[14px] shadow-sm transition-all"
              />
            </div>
          </div>

          {/* Results Area */}
          <div className="space-y-3 px-1">
            <div className="flex items-center justify-between ml-1">
              <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">Search Results</p>
              {registerPlayerResults.length > 0 && (
                <span className="text-[11px] font-bold text-[#10b981] bg-emerald-50 px-2 py-0.5 rounded-lg">
                  {registerPlayerResults.length} found
                </span>
              )}
            </div>

            <div className="min-h-[280px] max-h-[380px] overflow-y-auto pr-1 -mr-1 custom-scrollbar">
              {isSearchingPlayers ? (
                <div className="h-[280px] flex flex-col items-center justify-center text-center p-8">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 border-4 border-emerald-100 rounded-full" />
                    <div className="absolute inset-0 border-4 border-t-emerald-500 rounded-full animate-spin" />
                  </div>
                  <p className="text-[14px] font-bold text-gray-900 mt-4">Searching database...</p>
                  <p className="text-[12px] text-gray-400 mt-1">Looking for matching players</p>
                </div>
              ) : registerPlayerResults.length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5">
                  {registerPlayerResults.map((u) => (
                    <div 
                      key={u.id} 
                      className="group p-3 rounded-xl border border-gray-100 bg-white hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-500/5 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.email || u.id)}`}
                            alt={u.email}
                            className="w-10 h-10 rounded-full border border-gray-100 bg-gray-50 flex-shrink-0"
                          />
                          <div className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
                            u.status === "ACTIVE" ? "bg-emerald-500" : "bg-gray-300"
                          )} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[14px] font-bold text-gray-900 truncate">{fullName(u.firstName, u.lastName)}</p>
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight",
                              u.role === "PLAYER" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                            )}>
                              {u.role}
                            </span>
                          </div>
                          <p className="text-[12px] text-gray-500 truncate">{u.email}</p>
                        </div>

                        <Button
                          disabled={isRegistering}
                          onClick={() => handleRegisterPlayer(u.id)}
                          className="h-9 px-4 bg-[#10b981] hover:bg-[#0da673] text-white rounded-lg text-[12px] font-bold flex items-center gap-2 transition-all group-hover:scale-105 active:scale-95 shadow-sm shadow-emerald-500/10"
                        >
                          {isRegistering ? (
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                          Register
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : registerPlayerSearch.trim().length >= 2 ? (
                <div className="h-[280px] flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-gray-200" />
                  </div>
                  <p className="text-[14px] font-bold text-gray-900">No players found</p>
                  <p className="text-[12px] text-gray-400 mt-1 max-w-[200px]">
                    We couldn't find anyone matching "{registerPlayerSearch}"
                  </p>
                </div>
              ) : (
                <div className="h-[280px] flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-emerald-200" />
                  </div>
                  <p className="text-[14px] font-bold text-gray-900">Start Searching</p>
                  <p className="text-[12px] text-gray-400 mt-1 max-w-[200px]">
                    Enter a name or email address to find and register players
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setIsRegisterPlayerModalOpen(false);
              setRegisterPlayerSearch("");
              setRegisterPlayerResults([]);
            }}
            className="rounded-xl font-bold h-11 px-6 border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Tournament?"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCancelModalOpen(false)} className="rounded-lg font-bold">
              Close
            </Button>
            <Button
              className="rounded-lg font-bold px-8 text-white border bg-red-500 hover:bg-red-600 border-red-600/30"
              onClick={confirmCancel}
              disabled={mutating}
            >
              Yes, Cancel
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-amber-50 text-amber-500">
            <AlertTriangle className="h-10 w-10" />
          </div>
          <h4 className="text-xl font-bold text-gray-900 mb-2">Cancel Tournament?</h4>
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
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="rounded-lg font-bold">
              Cancel
            </Button>
            <Button
              disabled={deleteConfirmText.trim().toUpperCase() !== "DELETE" || mutating}
              className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 border border-red-600/30 text-white rounded-lg font-bold px-8"
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
            <h4 className="text-xl font-bold text-gray-900 mb-2">Delete Tournament Permanently?</h4>
            <p className="text-gray-500 max-w-sm">
              This action cannot be undone.
            </p>
          </div>

          <div className="space-y-3">
            <Label className="font-bold text-gray-700">
              Type <span className="text-red-600">&quot;DELETE&quot;</span> to confirm:
            </Label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="rounded-xl border-gray-200 focus:border-red-500"
            />
          </div>
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
