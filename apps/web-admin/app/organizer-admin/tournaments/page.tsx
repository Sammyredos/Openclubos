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
  X,
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
import {
  cancelTournament,
  deleteTournament,
  getTournaments,
  updateTournament,
  getGroupings,
  generateGroupings,
  movePlayerInGroupings,
  updateGroupingTime,
  clearGroupings,
  type GroupingData,
  type GroupingItem,
  type GroupingPlayer
} from "@/lib/api/tournaments";
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
  maxPlayers: number | null;
  registrationDeadline?: string | null;
  playerTypes: string[];
  club: { id: string; name: string } | null;
  visibility: "PUBLIC" | "PRIVATE" | "INVITE_ONLY";
  enableWaitlist?: boolean;
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
  enableWaitlist?: boolean;
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
  const [mutating, setMutating] = useState(false);

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardTournamentId, setWizardTournamentId] = useState<string | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
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
  const [registerPlayerResults, setRegisterPlayerResults] = useState<any[]>([]);
  const [isSearchingPlayers, setIsSearchingPlayers] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [manualPaymentType, setManualPaymentType] = useState<"UNPAID" | "CASH">("UNPAID");
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

  // Groupings (Tee Times) Management States
  const [detailsTab, setDetailsTab] = useState<"players" | "groupings">("players");
  const [groupingsData, setGroupingsData] = useState<GroupingData | null>(null);
  const [groupingsLoading, setGroupingsLoading] = useState(false);
  const [groupingsGenerating, setGroupingsGenerating] = useState(false);
  const [editingGroupTimeId, setEditingGroupTimeId] = useState<string | null>(null);
  const [editingGroupTimeValue, setEditingGroupTimeValue] = useState("");
  const [editingGroupNameId, setEditingGroupNameId] = useState<string | null>(null);
  const [editingGroupNameValue, setEditingGroupNameValue] = useState("");

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

  // Load groupings
  const loadGroupingsData = async () => {
    if (!selectedTournament) return;
    setGroupingsLoading(true);
    try {
      const data = await getGroupings(selectedTournament.id);
      setGroupingsData(data);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to load groupings");
    } finally {
      setGroupingsLoading(false);
    }
  };

  // Generate groupings
  const handleGenerateGroupings = async () => {
    if (!selectedTournament) return;
    setGroupingsGenerating(true);
    try {
      const data = await generateGroupings(selectedTournament.id);
      setGroupingsData(data);
      toast.success("Groupings generated successfully");
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to generate groupings");
    } finally {
      setGroupingsGenerating(false);
    }
  };

  // Move player to a group or unassigned
  const handleMovePlayer = async (registrationId: string, targetGroupId: string | null) => {
    if (!selectedTournament) return;
    try {
      const data = await movePlayerInGroupings(selectedTournament.id, registrationId, targetGroupId);
      setGroupingsData(data);
      toast.success("Player reassigned successfully");
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to reassign player");
    }
  };

  // Update group details
  const handleUpdateGroupDetails = async (groupId: string, payload: { name?: string; startTime?: string }) => {
    if (!selectedTournament) return;
    try {
      const data = await updateGroupingTime(selectedTournament.id, groupId, payload);
      setGroupingsData(data);
      setEditingGroupTimeId(null);
      setEditingGroupNameId(null);
      toast.success("Group updated successfully");
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to update group");
    }
  };

  // Clear groupings
  const handleClearGroupings = async () => {
    if (!selectedTournament) return;
    if (!window.confirm("Are you sure you want to reset all groupings? This will delete all groups and mark all players as unassigned.")) return;
    try {
      const data = await clearGroupings(selectedTournament.id);
      setGroupingsData(data);
      toast.success("Groupings reset successfully");
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to reset groupings");
    }
  };

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
      enableWaitlist: t.enableWaitlist,
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
    setDetailsTab("players");
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
    if ((!isViewModalOpen && !isRegisterPlayerModalOpen) || !selectedTournament?.id) return;
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

    setIsSearchingPlayers(true);
    getAdminUsers({ search: q, take: 10 })
      .then(({ items }) => {
        if (!cancelled) {
          setRegisterPlayerResults(Array.isArray(items) ? items : []);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          console.error("Player search failed", e);
        }
      })
      .finally(() => {
        if (!cancelled) setIsSearchingPlayers(false);
      });

    return () => {
      cancelled = true;
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
        paymentStatus: manualPaymentType === "CASH" ? "PAID" : "UNPAID",
        status: manualPaymentType === "CASH" ? "APPROVED" : "PENDING",
      });
      toast.success("Player registered successfully");
      setIsRegisterPlayerModalOpen(false);
      setRegisterPlayerSearch("");

      // Update local state for realtime feel
      setRegistrationsTournamentTotal(prev => prev + 1);
      setSelectedTournament(prev => prev ? { ...prev, registrations: prev.registrations + 1 } : null);

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
    router.push(`/organizer-admin/tournaments/${tournament.id}/edit`);
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
                  onClick={() => router.push("/organizer-admin/tournaments/create")}
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
                  value={monthFilter}
                  onValueChange={setMonthFilter}
                  options={["All Months", ...uniqueMonths].map((v) => ({ value: v, label: v }))}
                  className="min-w-[140px]"
                  triggerClassName="h-11 bg-white"
                  placeholder="All Months"
                />
                <SearchableSelect
                  value={yearFilter}
                  onValueChange={setYearFilter}
                  options={["All Years", ...uniqueYears].map((v) => ({ value: v, label: v }))}
                  className="min-w-[120px]"
                  triggerClassName="h-11 bg-white"
                  placeholder="All Years"
                />

              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-4 py-4">Tournament Info</th>
                      <th className="px-4 py-4">Schedule & Visibility</th>
                      <th className="px-4 py-4">Players</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4 text-right">Entry Fee</th>
                      <th className="px-4 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {error ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-red-500 font-bold text-[13px]">
                          {error}
                        </td>
                      </tr>
                    ) : loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <Skeleton className="w-8 h-8 rounded-lg" />
                              <div className="flex flex-col gap-1.5">
                                <Skeleton className="h-4 w-32 rounded-md" />
                                <Skeleton className="h-3 w-24 rounded-md" />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1.5">
                              <Skeleton className="h-4 w-28 rounded-md" />
                              <Skeleton className="h-3 w-16 rounded-md" />
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Skeleton className="h-4 w-12 rounded-md" />
                          </td>
                          <td className="px-4 py-4">
                            <Skeleton className="h-5.5 w-16 rounded-full" />
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Skeleton className="h-4 w-20 rounded-md ml-auto" />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Skeleton className="h-9 w-9 rounded-lg" />
                              <Skeleton className="h-9 w-9 rounded-lg" />
                              <Skeleton className="h-9 w-9 rounded-lg" />
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : paginatedTournaments.length > 0 ? (
                      paginatedTournaments.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3 min-w-[220px]">
                              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                                <Trophy className="w-4.5 h-4.5" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[14px] font-bold text-gray-900 truncate leading-tight" title={t.name}>{t.name.toLowerCase()}</span>
                                <span className="text-[12px] text-gray-400 font-medium truncate mt-0.5" title={t.clubName}>{t.clubName.toLowerCase()}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col min-w-0">
                              <span className="text-[13px] text-gray-700 font-medium truncate leading-tight">{t.dates}</span>
                              <div className={cn("inline-flex items-center gap-1 mt-1 text-[9px] font-bold uppercase", VISIBILITY_META[t.visibilityKey]?.badge || "text-gray-400")}>
                                {React.createElement(VISIBILITY_META[t.visibilityKey]?.icon || Globe, { className: "w-2.5 h-2.5 flex-shrink-0" })}
                                <span>{t.visibility}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col items-start">
                              <span className="text-[14px] text-gray-900 font-bold leading-tight">{t.players}</span>
                              <span className="text-[10px] text-gray-400 font-medium mt-0.5">Registered</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap uppercase ${t.badge}`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="text-[14px] font-bold text-gray-900 whitespace-nowrap">{formatNaira(t.entryFee)}</span>
                          </td>
                          <td className="px-4 py-4">
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
                                    ? "text-gray-300 cursor-not-allowed bg-gray-50/50 border-gray-100"
                                    : "text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                                )}
                                title="Edit Tournament"
                                disabled={t.statusKey === "CANCELLED" || t.statusKey === "COMPLETED" || t.statusKey === "ONGOING"}
                              >
                                <Edit2 className="w-4.5 h-4.5" />
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
                                  title="More Actions"
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
                        <td colSpan={6} className="px-6 py-20 text-center">
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
              onClick={() => handleMoreAction("register", dropdownTournament)}
              className={cn(
                "w-full text-left px-4 py-2 text-sm font-medium hover:bg-emerald-50 flex items-center gap-3",
                dropdownTournament.statusKey === "DRAFT" || dropdownTournament.statusKey === "CANCELLED" || dropdownTournament.statusKey === "COMPLETED"
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700"
              )}
              disabled={dropdownTournament.statusKey === "DRAFT" || dropdownTournament.statusKey === "CANCELLED" || dropdownTournament.statusKey === "COMPLETED"}
            >
              <UserPlus className="w-4 h-4 text-emerald-600" />
              Register a Player
            </button>
            <button
              onClick={() => handleMoreAction("waitlist", dropdownTournament)}
              className={cn(
                "w-full text-left px-4 py-2 text-sm font-medium hover:bg-emerald-50 flex items-center gap-3",
                !dropdownTournament.enableWaitlist ? "text-gray-300 cursor-not-allowed" : "text-gray-700"
              )}
              disabled={!dropdownTournament.enableWaitlist}
            >
              <Clock className={cn("w-4 h-4", !dropdownTournament.enableWaitlist ? "text-gray-300" : "text-gray-400")} />
              View Waitlist
            </button>
            <div className="h-px bg-gray-50 my-1" />
            <button
              onClick={() => handleMoreAction("cancel", dropdownTournament)}
              className={cn(
                "w-full text-left px-4 py-2 text-sm font-medium hover:bg-red-50 flex items-center gap-3",
                dropdownTournament.statusKey === "COMPLETED" || dropdownTournament.statusKey === "CANCELLED"
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700",
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
              className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 flex items-center gap-3"
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
        title=""
        size="xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400 font-medium italic">
                Tournament ID: {selectedTournament?.id.slice(0, 8)}...
              </span>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setStrokesMenuRegistration(null);
                setStrokesMenuAnchorEl(null);
                setIsViewModalOpen(false);
              }}
              className="rounded-lg font-bold border-gray-200"
            >
              Close Details
            </Button>
          </div>
        }
      >
        <div className="space-y-8">
          {/* Status Alert Banners */}
          {selectedTournament?.statusKey === "CANCELLED" && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-4 text-red-700">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[15px] font-bold">Tournament Cancelled</p>
                <p className="text-[12px] text-red-600/80 font-medium">This tournament has been cancelled and player actions are disabled.</p>
              </div>
            </div>
          )}
          {selectedTournament?.statusKey === "COMPLETED" && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4 text-emerald-700">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[15px] font-bold">Tournament Completed</p>
                <p className="text-[12px] text-emerald-600/80 font-medium">This tournament has concluded and is now read-only.</p>
              </div>
            </div>
          )}

          {/* Header Section */}
          <div className="flex items-center gap-5 border-b border-gray-50 pb-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#10b981] border border-emerald-100 flex-shrink-0 shadow-sm">
              <Trophy className="w-8 h-8" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h4 className="text-2xl font-bold text-gray-900 truncate">
                  {selectedTournament?.name || "Tournament Details"}
                </h4>
                {selectedTournament && (
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border",
                    selectedTournament.statusKey === "ONGOING" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      selectedTournament.statusKey === "REGISTRATION_OPEN" ? "bg-blue-50 text-blue-700 border-blue-100" :
                        selectedTournament.statusKey === "COMPLETED" ? "bg-gray-50 text-gray-600 border-gray-200" :
                          "bg-amber-50 text-amber-700 border-amber-100"
                  )}>
                    {selectedTournament.status}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                <div className="flex items-center gap-2 text-[13px] text-gray-500 font-medium">
                  <Globe className="w-4 h-4 text-gray-400" />
                  {selectedTournament?.clubName || "Independent"}
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                <div className="flex items-center gap-2 text-[13px] text-gray-500 font-medium">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {selectedTournament?.dates || "Dates TBD"}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Registrations</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{formatWithCommas(registrationsTournamentTotal)}</p>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5">Total Players</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Entry Fee</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{formatNaira(selectedTournament?.entryFee ?? null)}</p>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5">Per Registration</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Capacity</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedTournament?.maxPlayers ? formatWithCommas(selectedTournament.maxPlayers) : "∞"}
                  </p>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5">Player Limit</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <Lock className="w-5 h-5" />
                </div>
              </div>
            </div>
              {/* Tab Navigation inside Details Modal */}
          <div className="flex border-b border-gray-150 pt-2">
            <button
              onClick={() => setDetailsTab("players")}
              className={cn(
                "pb-3 px-6 text-sm transition-all duration-200 focus:outline-none border-b-2 font-normal",
                detailsTab === "players"
                  ? "border-[#10b981] text-[#10b981]"
                  : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
              )}
            >
              Registered Players
            </button>
            <button
              onClick={() => {
                setDetailsTab("groupings");
                loadGroupingsData();
              }}
              className={cn(
                "pb-3 px-6 text-sm transition-all duration-200 focus:outline-none border-b-2 font-normal flex items-center gap-2",
                detailsTab === "groupings"
                  ? "border-[#10b981] text-[#10b981]"
                  : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
              )}
            >
              Groupings (Tee Times)
            </button>
          </div>

          {detailsTab === "players" ? (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h5 className="text-[16px] text-gray-900 font-normal">Registered Players</h5>
                  <p className="text-[12px] text-gray-500 font-normal">Manage and monitor tournament participation</p>
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
                    className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white rounded-lg font-normal"
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
                  className="min-w-[160px] font-normal"
                  triggerClassName="h-11 bg-white font-normal"
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
                  className="min-w-[160px] font-normal"
                  triggerClassName="h-11 bg-white font-normal"
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
                  className="min-w-[200px] font-normal"
                  triggerClassName="h-11 bg-white font-normal"
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
                    const fullName = `${r.user?.firstName ?? ""} ${r.user?.lastName ?? ""}`.trim() || "Unknown Player";
                    const isTournamentLocked = selectedTournament?.statusKey === "CANCELLED" || selectedTournament?.statusKey === "COMPLETED";

                    const statusConfig = {
                      DISQUALIFIED: { badge: "bg-gray-100 text-gray-600 border-gray-200", icon: Ban },
                      APPROVED: { badge: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: CheckCircle2 },
                      REJECTED: { badge: "bg-red-50 text-red-700 border-red-100", icon: X },
                      WAITLISTED: { badge: "bg-blue-50 text-blue-700 border-blue-100", icon: Clock },
                      PENDING: { badge: "bg-amber-50 text-amber-700 border-amber-100", icon: Clock },
                    }[r.status as string] || { badge: "bg-gray-50 text-gray-600 border-gray-100", icon: Clock };

                    const paymentConfig = {
                      PAID: { badge: "bg-emerald-50 text-emerald-700 border-emerald-100", label: "Paid" },
                      REFUNDED: { badge: "bg-violet-50 text-violet-700 border-violet-100", label: "Refunded" },
                      UNPAID: { badge: "bg-gray-100 text-gray-500 border-gray-200", label: "Unpaid" },
                    }[r.paymentStatus as string] || { badge: "bg-gray-50 text-gray-500 border-gray-100", label: r.paymentStatus };

                    return (
                      <div key={r.id} className="px-5 py-4 hover:bg-gray-50/60 transition-colors group">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <img
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(r.user?.email || r.id)}`}
                              alt={fullName}
                              className="w-10 h-10 rounded-full border border-gray-100 bg-white flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-[14px] text-gray-900 font-normal truncate">{fullName}</p>
                                <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] whitespace-nowrap uppercase tracking-wider font-normal", statusConfig.badge)}>
                                  {React.createElement(statusConfig.icon, { className: "w-3 h-3" })}
                                  {r.status}
                                </span>
                                <span className={cn("px-2 py-0.5 rounded-lg border text-[10px] whitespace-nowrap uppercase tracking-wider font-normal", paymentConfig.badge)}>
                                  {paymentConfig.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <p className="text-[12px] text-gray-400 font-normal truncate">{r.user?.email || "No email"}</p>
                                {typeof r.extraStrokes === "number" && r.extraStrokes > 0 && (
                                  <span className="flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg font-normal">
                                    <Plus className="w-3 h-3" />
                                    {r.extraStrokes} Strokes
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className={cn(
                            "flex items-center gap-1.5 flex-shrink-0 transition-all duration-200",
                            isTournamentLocked ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          )}>
                            {isTournamentLocked ? (
                              <span className="text-[11px] text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 font-normal">
                                Tournament {selectedTournament?.statusKey === "CANCELLED" ? "Cancelled" : "Completed"}
                              </span>
                            ) : (
                              <>
                                {r.status === "DISQUALIFIED" ? (
                                  <button
                                    className={cn(
                                      "h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white text-[12px] transition-all font-normal",
                                      registrationActionId === r.id
                                        ? "text-gray-300 cursor-not-allowed"
                                        : "text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100"
                                    )}
                                    title="Enable Player"
                                    disabled={registrationActionId === r.id}
                                    onClick={() => {
                                      setActionRegistration(r);
                                      setIsEnablePlayerModalOpen(true);
                                    }}
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Enable</span>
                                  </button>
                                ) : (
                                  <button
                                    className={cn(
                                      "h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white text-[12px] transition-all font-normal",
                                      registrationActionId === r.id
                                        ? "text-gray-300 cursor-not-allowed"
                                        : "text-red-600 hover:bg-red-50 hover:border-red-100"
                                    )}
                                    title="Disqualify Player"
                                    disabled={registrationActionId === r.id}
                                    onClick={() => {
                                      setActionRegistration(r);
                                      setIsDisqualifyModalOpen(true);
                                    }}
                                  >
                                    <Ban className="w-4 h-4" />
                                    <span>Disqualify</span>
                                  </button>
                                )}

                                <button
                                  className={cn(
                                    "h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white text-[12px] text-gray-600 transition-all font-normal",
                                    registrationActionId === r.id
                                      ? "text-gray-300 cursor-not-allowed"
                                      : "hover:bg-gray-50 hover:border-gray-300"
                                  )}
                                  title="Add Strokes"
                                  disabled={registrationActionId === r.id}
                                  onClick={(e) => {
                                    if (registrationActionId === r.id) return;
                                    setStrokesMenuRegistration(r);
                                    setStrokesMenuAnchorEl(e.currentTarget);
                                  }}
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>Strokes</span>
                                </button>

                                {typeof r.extraStrokes === "number" && r.extraStrokes > 0 && (
                                  <button
                                    className={cn(
                                      "h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white text-[12px] text-gray-400 transition-all font-normal",
                                      registrationActionId === r.id
                                        ? "text-gray-300 cursor-not-allowed"
                                        : "hover:bg-gray-50 hover:text-gray-600 hover:border-gray-300"
                                    )}
                                    title="Clear Strokes"
                                    disabled={registrationActionId === r.id}
                                    onClick={() => clearTournamentRegistrationStrokes(r)}
                                  >
                                    <Eraser className="w-4 h-4" />
                                    <span>Clear</span>
                                  </button>
                                )}

                                <button
                                  className={cn(
                                    "h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white text-[12px] text-red-600 transition-all font-normal",
                                    registrationActionId === r.id
                                      ? "text-gray-300 cursor-not-allowed"
                                      : "hover:bg-red-50 hover:border-red-100"
                                  )}
                                  title="Remove Player"
                                  disabled={registrationActionId === r.id}
                                  onClick={() => {
                                    setActionRegistration(r);
                                    setIsRemovePlayerModalOpen(true);
                                  }}
                                >
                                  <UserMinus className="w-4 h-4" />
                                  <span>Remove</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-gray-100 bg-gray-50/40 px-4 py-4 text-[13px] text-gray-500 font-normal">
                  No registrations yet for this tournament.
                </div>
              )}

              {!registrationsLoading && registrationsFilteredTotal > 0 && (
                <div className="pt-2 flex items-center justify-between gap-4">
                  <p className="text-[13px] text-gray-500 font-normal">
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
          ) : (
            <div className="space-y-6">
              {groupingsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3">
                      <Skeleton className="h-5 w-24 rounded-md" />
                      <Skeleton className="h-4 w-16 rounded-md" />
                      <div className="space-y-2 pt-2 border-t border-gray-50">
                        <Skeleton className="h-10 w-full rounded-md" />
                        <Skeleton className="h-10 w-full rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : groupingsData?.groups && groupingsData.groups.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100">
                    <div>
                      <p className="text-[13px] text-gray-500 font-normal">Manage groupings, custom tee off times, and labels.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleGenerateGroupings}
                        disabled={groupingsGenerating}
                        variant="outline"
                        className="border-emerald-100 hover:bg-emerald-50 text-[#10b981] rounded-lg h-10 px-4 text-[12px] font-normal"
                      >
                        Regenerate
                      </Button>
                      <Button
                        onClick={handleClearGroupings}
                        variant="outline"
                        className="border-red-100 hover:bg-red-50 text-red-600 rounded-lg h-10 px-4 text-[12px] font-normal"
                      >
                        Reset Groupings
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {groupingsData.groups.map((group: GroupingItem) => (
                          <div key={group.id} className="border border-gray-150 rounded-2xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between gap-4 pb-2 border-b border-gray-50">
                              {editingGroupNameId === group.id ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <Input
                                    value={editingGroupNameValue}
                                    onChange={(e) => setEditingGroupNameValue(e.target.value)}
                                    className="h-8 py-1 px-2 text-sm font-normal rounded border-gray-200 focus:border-[#10b981] w-full"
                                  />
                                  <button
                                    onClick={() => handleUpdateGroupDetails(group.id, { name: editingGroupNameValue })}
                                    className="text-[12px] text-[#10b981] hover:text-emerald-700 font-normal focus:outline-none shrink-0"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingGroupNameId(null)}
                                    className="text-[12px] text-gray-400 hover:text-gray-600 font-normal focus:outline-none shrink-0"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[14px] text-gray-900 font-normal">{group.name}</span>
                                  <button
                                    onClick={() => {
                                      setEditingGroupNameId(group.id);
                                      setEditingGroupNameValue(group.name);
                                    }}
                                    className="text-gray-400 hover:text-[#10b981] transition-colors focus:outline-none"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}

                              {editingGroupTimeId === group.id ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="text"
                                    placeholder="e.g. 08:30 AM"
                                    value={editingGroupTimeValue}
                                    onChange={(e) => setEditingGroupTimeValue(e.target.value)}
                                    className="h-8 py-1 px-2 text-sm font-normal rounded border-gray-200 focus:border-[#10b981] w-24"
                                  />
                                  <button
                                    onClick={() => handleUpdateGroupDetails(group.id, { startTime: editingGroupTimeValue })}
                                    className="text-[12px] text-[#10b981] hover:text-emerald-700 font-normal focus:outline-none shrink-0"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingGroupTimeId(null)}
                                    className="text-[12px] text-gray-400 hover:text-gray-600 font-normal focus:outline-none shrink-0"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-gray-500">
                                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="text-[12px] font-normal">{group.startTime || "TBD"}</span>
                                  <button
                                    onClick={() => {
                                      setEditingGroupTimeId(group.id);
                                      setEditingGroupTimeValue(group.startTime || "");
                                    }}
                                    className="text-gray-400 hover:text-[#10b981] transition-colors focus:outline-none"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {group.registrations && group.registrations.length > 0 ? (
                              <div className="divide-y divide-gray-50 mt-3">
                                {group.registrations.map((player: GroupingPlayer) => (
                                  <div key={player.id} className="flex items-center justify-between py-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <img
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.user?.email || player.id)}`}
                                        alt={`${player.user?.firstName || ""} ${player.user?.lastName || ""}`}
                                        className="w-8 h-8 rounded-full border border-gray-100 bg-gray-50 shrink-0"
                                      />
                                      <div className="min-w-0">
                                        <div className="text-[13px] text-gray-800 font-normal truncate">
                                          {player.user?.firstName || ""} {player.user?.lastName || ""}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-normal">
                                          HCP: {player.user?.handicap !== null && player.user?.handicap !== undefined ? player.user.handicap : "—"}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <select
                                        value={group.id}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          handleMovePlayer(player.id, val === "unassigned" ? null : val);
                                        }}
                                        className="bg-transparent border-none text-[11px] text-gray-400 hover:bg-gray-150 rounded px-2 py-1 focus:outline-none font-normal cursor-pointer transition-colors"
                                      >
                                        <option value={group.id}>Move To...</option>
                                        <option value="unassigned">Unassigned Pool</option>
                                        {groupingsData.groups.map((g: GroupingItem) => (
                                          g.id !== group.id && (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                          )
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-gray-400 italic mt-3 font-normal">No players in this group.</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="w-full lg:w-[320px] shrink-0 bg-gray-50/50 border border-gray-150 rounded-2xl p-4 shadow-sm self-start">
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <span className="text-[13px] text-gray-600 font-normal flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-gray-400" /> Unassigned Players
                        </span>
                        <span className="text-[11px] font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">
                          {groupingsData.unassigned.length}
                        </span>
                      </div>
                      {groupingsData.unassigned && groupingsData.unassigned.length > 0 ? (
                        <div className="divide-y divide-gray-100 max-h-[480px] overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                          {groupingsData.unassigned.map((player: GroupingPlayer) => (
                            <div key={player.id} className="flex items-center justify-between py-2.5">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.user?.email || player.id)}`}
                                  alt={`${player.user?.firstName || ""} ${player.user?.lastName || ""}`}
                                  className="w-7 h-7 rounded-full border border-gray-100 bg-white shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="text-[12px] text-gray-800 font-normal truncate">
                                    {player.user?.firstName || ""} {player.user?.lastName || ""}
                                  </div>
                                  <div className="text-[9px] text-gray-400 font-normal">
                                    HCP: {player.user?.handicap !== null && player.user?.handicap !== undefined ? player.user.handicap : "—"}
                                  </div>
                                </div>
                              </div>
                              <select
                                value="unassigned"
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val !== "unassigned") {
                                    handleMovePlayer(player.id, val);
                                  }
                                }}
                                className="bg-transparent border-none text-[11px] text-[#10b981] hover:bg-emerald-50 rounded px-1.5 py-0.5 focus:outline-none font-normal cursor-pointer transition-colors shrink-0"
                              >
                                <option value="unassigned">Place in...</option>
                                {groupingsData.groups.map((g: GroupingItem) => (
                                  <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[12px] text-gray-400 italic font-normal text-center py-6">All approved players are assigned.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center border border-gray-150 rounded-2xl p-12 text-center bg-gray-50/20">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-6 text-emerald-600">
                    <Trophy className="w-8 h-8 font-light" />
                  </div>
                  <h5 className="text-[18px] text-gray-900 font-normal mb-2">No Groupings Generated Yet</h5>
                  <p className="text-[13px] text-gray-500 max-w-md font-normal mb-6 leading-relaxed">
                    Generate dynamic player groupings and sequential tee-off times for this tournament automatically. This segments approved and paid players into slots.
                  </p>
                  <Button
                    onClick={handleGenerateGroupings}
                    disabled={groupingsGenerating}
                    className="bg-[#10b981] hover:bg-[#0da673] text-white rounded-lg px-6 h-11 text-[13px] font-normal shadow-sm"
                  >
                    {groupingsGenerating ? "Generating Groupings..." : "Generate Groupings"}
                  </Button>
                </div>
              )}
            </div>
          )}          </div>
        </div>
      </Modal>

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
          setRegisterPlayerResults([]);
          setManualPaymentType('UNPAID');
        }}
        title="Register Player"
        size="lg"
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

          {/* Payment Status Selection */}
          <div className="space-y-3 px-1">
            <Label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider ml-1">Initial Payment Status</Label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setManualPaymentType('UNPAID')}
                className={cn(
                  "flex-1 p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 text-center",
                  manualPaymentType === 'UNPAID'
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                    manualPaymentType === 'UNPAID' ? "border-emerald-500" : "border-gray-300"
                  )}>
                    {manualPaymentType === 'UNPAID' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                  </div>
                  <span className="text-[13px] font-bold">Unpaid</span>
                </div>
                <p className="text-[10px] opacity-70 leading-tight">Player will not be confirmed for grouping until payment is recorded.</p>
              </button>
              <button
                type="button"
                onClick={() => setManualPaymentType('CASH')}
                className={cn(
                  "flex-1 p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 text-center",
                  manualPaymentType === 'CASH'
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                    manualPaymentType === 'CASH' ? "border-emerald-500" : "border-gray-300"
                  )}>
                    {manualPaymentType === 'CASH' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                  </div>
                  <span className="text-[13px] font-bold">Paid with Cash</span>
                </div>
                <p className="text-[10px] opacity-70 leading-tight">Registration will be approved and confirmed for grouping immediately.</p>
              </button>
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
                className="pl-12 pr-10 h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#10b981] focus:ring-4 focus:ring-[#10b981]/5 rounded-xl text-[14px] shadow-sm transition-all"
              />
              {registerPlayerSearch && (
                <button
                  onClick={() => setRegisterPlayerSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
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
                  {registerPlayerResults.map((u) => {
                    const isRegistered = registrationsAll.some(r => r.user?.id === u.id);
                    return (
                      <div
                        key={u.id}
                        className="group p-4 rounded-2xl border border-gray-100 bg-white hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
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
                              {isRegistered && (
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0">
                                  <Check className="w-3 h-3" /> Registered
                                </span>
                              )}
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
                            disabled={isRegistering || isRegistered}
                            onClick={() => handleRegisterPlayer(u.id)}
                            className={cn(
                              "h-10 px-5 rounded-xl text-[13px] font-bold transition-all active:scale-95 shadow-sm",
                              isRegistered
                                ? "bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed"
                                : "bg-[#10b981] hover:bg-[#0da673] text-white shadow-emerald-500/20"
                            )}
                          >
                            {isRegistering ? "Registering..." : isRegistered ? "Registered" : "Register Now"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
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

      <Modal
        isOpen={isDisqualifyModalOpen}
        onClose={() => {
          setIsDisqualifyModalOpen(false);
          setActionRegistration(null);
        }}
        title="Disqualify Player?"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDisqualifyModalOpen(false)} className="rounded-lg font-bold">
              Cancel
            </Button>
            <Button
              className="rounded-lg font-bold px-8 text-white border bg-amber-500 hover:bg-amber-600 border-amber-600/30"
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
          <h4 className="text-xl font-bold text-gray-900 mb-2">Disqualify Player?</h4>
          <p className="text-gray-500 max-w-sm">
            Are you sure you want to disqualify <strong>{actionRegistration ? `${actionRegistration.user?.firstName} ${actionRegistration.user?.lastName}` : "this player"}</strong>?
          </p>
          <p className="text-[13px] text-amber-600 font-medium mt-4">
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
          <>
            <Button variant="outline" onClick={() => setIsRemovePlayerModalOpen(false)} className="rounded-lg font-bold">
              Cancel
            </Button>
            <Button
              className="rounded-lg font-bold px-8 text-white border bg-red-500 hover:bg-red-600 border-red-600/30"
              onClick={confirmRemovePlayer}
            >
              Remove Player
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-red-50 text-red-500">
            <UserMinus className="h-10 w-10" />
          </div>
          <h4 className="text-xl font-bold text-gray-900 mb-2">Remove Player?</h4>
          <p className="text-gray-500 max-w-sm">
            Are you sure you want to permanently remove <strong>{actionRegistration ? `${actionRegistration.user?.firstName} ${actionRegistration.user?.lastName}` : "this player"}</strong> from the tournament?
          </p>
          <p className="text-[13px] text-red-600 font-medium mt-4 bg-red-50 p-3 rounded-lg border border-red-100">
            Warning: This action is permanent and will delete their registration records for this tournament.
          </p>
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
            <Button variant="outline" onClick={() => setIsEnablePlayerModalOpen(false)} className="rounded-lg font-bold">
              Cancel
            </Button>
            <Button
              className="rounded-lg font-bold px-8 text-white border bg-emerald-500 hover:bg-emerald-600 border-emerald-600/30"
              onClick={confirmEnablePlayer}
            >
              Confirm Enable
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-emerald-50 text-emerald-500">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h4 className="text-xl font-bold text-gray-900 mb-2">Re-enable Player?</h4>
          <p className="text-gray-500 max-w-sm">
            Are you sure you want to re-enable <strong>{actionRegistration ? `${actionRegistration.user?.firstName} ${actionRegistration.user?.lastName}` : "this player"}</strong>?
          </p>
          <p className="text-[13px] text-emerald-600 font-medium mt-4">
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
