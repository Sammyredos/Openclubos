"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useParams, useSearchParams, usePathname } from "next/navigation";
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
  ArrowLeft,
  Loader2,
  Flag,
  Route,
  Activity,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatWithCommas } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import {
  cancelTournament,
  deleteTournament,
  getTournament,
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
import { getCourse, type Course } from "@/lib/api/courses";
import { getClub, type Club } from "@/lib/api/clubs";
import {
  addRegistrationStrokes,
  clearRegistrationStrokes,
  getRegistrations,
  updateRegistrationStatus,
  deleteRegistration,
  confirmRegistrationPayment,
  type RegistrationListItem,
} from "@/lib/api/registrations";
import { toast } from "sonner";
import { FloatingMenu } from "@/components/ui/floating-menu";

type TournamentStatus = "DRAFT" | "REGISTRATION_OPEN" | "ONGOING" | "COMPLETED" | "CANCELLED";

type TournamentRow = {
  id: string;
  name: string;
  clubName: string;
  clubId: string;
  courseId: string;
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
  DRAFT: { label: "Draft", color: "#94a3b8", badge: "bg-slate-50 text-slate-655" },
  REGISTRATION_OPEN: { label: "Upcoming", color: "#10b981", badge: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
  ONGOING: { label: "Ongoing", color: "#3b82f6", badge: "bg-blue-50 text-blue-600 border border-blue-100" },
  COMPLETED: { label: "Completed", color: "#8b5cf6", badge: "bg-violet-50 text-violet-600 border border-violet-100" },
  CANCELLED: { label: "Cancelled", color: "#f43f5e", badge: "bg-rose-50 text-rose-600 border border-rose-100" },
};

const VISIBILITY_META: Record<"PUBLIC" | "PRIVATE" | "INVITE_ONLY", { label: string; badge: string; icon: any }> = {
  PUBLIC: { label: "Public", badge: "bg-emerald-50 text-emerald-600", icon: Globe },
  PRIVATE: { label: "Private", badge: "bg-gray-100 text-gray-600", icon: Eye },
  INVITE_ONLY: { label: "Invite Only", badge: "bg-amber-50 text-amber-600", icon: Shield },
};

const TABS = [
  { id: "players", label: "Registered Players" },
  { id: "register", label: "Register Player" },
  { id: "waitlist", label: "Waitlist Settings" },
  { id: "groupings", label: "Groupings (Tee Times)" },
  { id: "overview", label: "Overview" },
] as const;

type TabId = typeof TABS[number]["id"];

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

function fullName(firstName: string | null, lastName: string | null) {
  const name = `${firstName || ""} ${lastName || ""}`.trim();
  return name || "—";
}

const CLIENT_REGISTRATIONS_MAX = 250;

function ViewTournamentPageInner() {
  const params = useParams();
  const tournamentId = params.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Tab Sync with search parameters
  const activeTab = (searchParams.get("tab") || "players") as TabId;

  const setActiveTab = (tabId: TabId) => {
    router.push(`${pathname}?tab=${tabId}`);
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<TournamentRow | null>(null);
  const [courseDetails, setCourseDetails] = useState<Course | null>(null);
  const [clubDetails, setClubDetails] = useState<Club | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownAnchorEl, setDropdownAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [mutating, setMutating] = useState(false);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Registrations logic
  const [registrationsLoading, setRegistrationsLoading] = useState(false);
  const [registrations, setRegistrations] = useState<RegistrationListItem[]>([]);
  const [registrationsMode, setRegistrationsMode] = useState<"client" | "server">("server");
  const [registrationsInitialized, setRegistrationsInitialized] = useState(false);
  const [registrationsAll, setRegistrationsAll] = useState<RegistrationListItem[]>([]);
  const [registrationsTotal, setRegistrationsTotal] = useState(0);
  const [registrationsTournamentTotal, setRegistrationsTournamentTotal] = useState(0);
  const [registrationsPage, setRegistrationsPage] = useState(1);
  const registrationsPerPage = 10;
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

  // Manual register options
  const [registerPlayerSearch, setRegisterPlayerSearch] = useState("");
  const [registerPlayerResults, setRegisterPlayerResults] = useState<any[]>([]);
  const [isSearchingPlayers, setIsSearchingPlayers] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [manualPaymentType, setManualPaymentType] = useState<"UNPAID" | "CASH">("UNPAID");

  const [isDisqualifyModalOpen, setIsDisqualifyModalOpen] = useState(false);
  const [isRemovePlayerModalOpen, setIsRemovePlayerModalOpen] = useState(false);
  const [isEnablePlayerModalOpen, setIsEnablePlayerModalOpen] = useState(false);
  const [actionRegistration, setActionRegistration] = useState<RegistrationListItem | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Waitlist Logic
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlist, setWaitlist] = useState<RegistrationListItem[]>([]);
  const [waitlistSearch, setWaitlistSearch] = useState("");
  const [waitlistActionId, setWaitlistActionId] = useState<string | null>(null);

  // Groupings (Tee Times) Management States
  const [groupingsData, setGroupingsData] = useState<GroupingData | null>(null);
  const [groupingsLoading, setGroupingsLoading] = useState(false);
  const [groupingsGenerating, setGroupingsGenerating] = useState(false);
  const [editingGroupTimeId, setEditingGroupTimeId] = useState<string | null>(null);
  const [editingGroupTimeValue, setEditingGroupTimeValue] = useState("");
  const [editingGroupNameId, setEditingGroupNameId] = useState<string | null>(null);
  const [editingGroupNameValue, setEditingGroupNameValue] = useState("");

  const closeDropdown = () => {
    setActiveDropdown(null);
    setDropdownAnchorEl(null);
  };

  const fetchWaitlistData = async () => {
    if (!tournamentId) return;
    setWaitlistLoading(true);
    try {
      const { items } = await getRegistrations({
        tournamentId,
        status: "WAITLISTED",
      });
      setWaitlist(items || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch waitlist queue");
    } finally {
      setWaitlistLoading(false);
    }
  };

  const loadGroupingsData = async () => {
    if (!tournamentId) return;
    setGroupingsLoading(true);
    try {
      const data = await getGroupings(tournamentId);
      setGroupingsData(data);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to load groupings");
    } finally {
      setGroupingsLoading(false);
    }
  };

  const handleGenerateGroupings = async () => {
    if (!tournamentId) return;
    setGroupingsGenerating(true);
    try {
      const data = await generateGroupings(tournamentId);
      setGroupingsData(data);
      toast.success("Groupings generated successfully");
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to generate groupings");
    } finally {
      setGroupingsGenerating(false);
    }
  };

  const handleMovePlayer = async (registrationId: string, targetGroupId: string | null) => {
    if (!tournamentId) return;
    try {
      const data = await movePlayerInGroupings(tournamentId, registrationId, targetGroupId);
      setGroupingsData(data);
      toast.success("Player reassigned successfully");
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to reassign player");
    }
  };

  const handleUpdateGroupDetails = async (groupId: string, payload: { name?: string; startTime?: string }) => {
    if (!tournamentId) return;
    try {
      const data = await updateGroupingTime(tournamentId, groupId, payload);
      setGroupingsData(data);
      setEditingGroupTimeId(null);
      setEditingGroupNameId(null);
      toast.success("Group updated successfully");
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to update group");
    }
  };

  const handleClearGroupings = async () => {
    if (!tournamentId) return;
    if (!window.confirm("Are you sure you want to reset all groupings? This will delete all groups and mark all players as unassigned.")) return;
    try {
      const data = await clearGroupings(tournamentId);
      setGroupingsData(data);
      toast.success("Groupings reset successfully");
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to reset groupings");
    }
  };

  useEffect(() => {
    if (activeTab === "waitlist") {
      fetchWaitlistData();
    } else if (activeTab === "groupings") {
      loadGroupingsData();
    }
  }, [activeTab, tournamentId]);

  async function reloadSingleTournament() {
    if (!tournamentId) return;
    try {
      const t = await getTournament(tournamentId);
      const clubName = t.club?.name || "—";
      const registrations = t._count?.registrations ?? 0;
      const types = Array.isArray(t.playerTypes) ? t.playerTypes : [];
      const mapped: TournamentRow = {
        id: t.id,
        name: t.name,
        clubName,
        clubId: t.clubId,
        courseId: t.courseId,
        types,
        dates: formatDateRange(t.startDate, t.endDate),
        players: formatPlayers(registrations, t.maxPlayers),
        status: STATUS_META[t.status as TournamentStatus]?.label ?? t.status,
        badge: STATUS_META[t.status as TournamentStatus]?.badge ?? "bg-gray-100 text-gray-505",
        entryFee: t.entryFee ?? null,
        startDate: t.startDate,
        endDate: t.endDate ?? null,
        maxPlayers: t.maxPlayers ?? null,
        statusKey: t.status as TournamentStatus,
        visibility: VISIBILITY_META[t.visibility as "PUBLIC" | "PRIVATE" | "INVITE_ONLY"]?.label ?? t.visibility,
        visibilityKey: t.visibility as "PUBLIC" | "PRIVATE" | "INVITE_ONLY",
        enableWaitlist: t.enableWaitlist,
        createdAt: t.createdAt,
        registrations,
      };
      setSelectedTournament(mapped);
      setRegistrationsTournamentTotal(registrations);
    } catch (e: unknown) {
      console.error("Failed to reload tournament details:", e);
    }
  }

  // Load tournament info & concurrent details on mount
  useEffect(() => {
    if (!tournamentId) return;
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const t = await getTournament(tournamentId);
        if (cancelled) return;

        let courseData: Course | null = null;
        let clubData: Club | null = null;
        try {
          if (t.courseId) courseData = await getCourse(t.courseId);
        } catch (err) {
          console.error("Failed to load course details:", err);
        }
        try {
          if (t.clubId) clubData = await getClub(t.clubId);
        } catch (err) {
          console.error("Failed to load club details:", err);
        }

        if (cancelled) return;
        setCourseDetails(courseData);
        setClubDetails(clubData);

        const clubName = t.club?.name || clubData?.name || "—";
        const registrations = t._count?.registrations ?? 0;
        const types = Array.isArray(t.playerTypes) ? t.playerTypes : [];
        const mapped: TournamentRow = {
          id: t.id,
          name: t.name,
          clubName,
          clubId: t.clubId,
          courseId: t.courseId,
          types,
          dates: formatDateRange(t.startDate, t.endDate),
          players: formatPlayers(registrations, t.maxPlayers),
          status: STATUS_META[t.status as TournamentStatus]?.label ?? t.status,
          badge: STATUS_META[t.status as TournamentStatus]?.badge ?? "bg-gray-100 text-gray-550",
          entryFee: t.entryFee ?? null,
          startDate: t.startDate,
          endDate: t.endDate ?? null,
          maxPlayers: t.maxPlayers ?? null,
          statusKey: t.status as TournamentStatus,
          visibility: VISIBILITY_META[t.visibility as "PUBLIC" | "PRIVATE" | "INVITE_ONLY"]?.label ?? t.visibility,
          visibilityKey: t.visibility as "PUBLIC" | "PRIVATE" | "INVITE_ONLY",
          enableWaitlist: t.enableWaitlist,
          createdAt: t.createdAt,
          registrations,
        };
        setSelectedTournament(mapped);
        setRegistrationsTournamentTotal(registrations);
      } catch (e: unknown) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to fetch tournament details");
        setSelectedTournament(null);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [tournamentId]);

  useEffect(() => {
    const handle = window.setTimeout(() => setRegistrationsDebouncedSearch(registrationsSearch.trim()), 250);
    return () => window.clearTimeout(handle);
  }, [registrationsSearch]);

  useEffect(() => {
    if (!selectedTournament?.id) return;
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
        toast.error(e instanceof Error ? e.message : "Failed to fetch registrations");
      })
      .finally(() => {
        if (cancelled) return;
        setRegistrationsLoading(false);
        setRegistrationsInitialized(true);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedTournament?.id]);

  useEffect(() => {
    if (!selectedTournament?.id) return;
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
        toast.error(e instanceof Error ? e.message : "Failed to fetch registrations");
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
    registrationsDebouncedSearch,
    registrationsStatusFilter,
    registrationsDisqualifiedFilter,
    registrationsPaymentFilter,
  ]);

  const registrationsQuery = registrationsSearch.trim().toLowerCase();
  const filteredRegistrationsAll =
    registrationsMode === "client"
      ? registrationsAll.filter((r) => {
        const fullNameStr = `${r.user?.firstName ?? ""} ${r.user?.lastName ?? ""}`.trim().toLowerCase();
        const email = (r.user?.email ?? "").toLowerCase();
        const matchesSearch =
          registrationsQuery.length === 0 || fullNameStr.includes(registrationsQuery) || email.includes(registrationsQuery);
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

  // Search & Register Logic inside tab
  useEffect(() => {
    if (activeTab !== "register") {
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
    getAdminUsers({ search: q, take: 10, role: "PLAYER" })
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
  }, [activeTab, registerPlayerSearch]);

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
      setRegisterPlayerSearch("");

      await reloadSingleTournament();

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
        getRegistrations({
          tournamentId: selectedTournament.id,
          skip: 0,
          take: CLIENT_REGISTRATIONS_MAX,
        }).then(({ items, total }) => {
          setRegistrationsAll(Array.isArray(items) ? items : []);
          setRegistrationsTotal(typeof total === "number" ? total : 0);
          setRegistrationsInitialized(true);
        });
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to register player");
    } finally {
      setIsRegistering(false);
    }
  };

  // Waitlist Action methods
  const handleApproveWaitlist = async (regId: string) => {
    setWaitlistActionId(regId);
    try {
      await updateRegistrationStatus(regId, "APPROVED");
      toast.success("Player approved from waitlist successfully");
      setWaitlist(prev => prev.filter(item => item.id !== regId));
      await reloadSingleTournament();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve player");
    } finally {
      setWaitlistActionId(null);
    }
  };

  const handleRemoveWaitlist = async (regId: string) => {
    if (!confirm("Are you sure you want to remove this player from the waitlist?")) return;
    setWaitlistActionId(regId);
    try {
      await deleteRegistration(regId);
      toast.success("Player removed from waitlist");
      setWaitlist(prev => prev.filter(item => item.id !== regId));
      await reloadSingleTournament();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove player");
    } finally {
      setWaitlistActionId(null);
    }
  };

  const filteredWaitlist = waitlist.filter(item => {
    const q = waitlistSearch.toLowerCase();
    const fullNameStr = `${item.user?.firstName || ""} ${item.user?.lastName || ""}`.toLowerCase();
    const email = (item.user?.email || "").toLowerCase();
    return fullNameStr.includes(q) || email.includes(q);
  });

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
      toast.error(e instanceof Error ? e.message : "Failed to update registration");
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
      toast.error(e instanceof Error ? e.message : "Failed to add strokes");
    } finally {
      setRegistrationActionId(null);
    }
  };

  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);

  const handleMarkPaid = async (registrationId: string) => {
    if (markingPaidId) return;
    setMarkingPaidId(registrationId);
    try {
      await confirmRegistrationPayment(registrationId, "MANUAL_ADMIN_" + Date.now());
      toast.success("Player payment confirmed successfully!");
      await reloadSingleTournament();
      if (registrationsMode === "client") {
        await initializeClientRegistrations();
      } else {
        await reloadServerRegistrations();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to mark player as paid");
    } finally {
      setMarkingPaidId(null);
    }
  };

  const openDisqualify = (reg: RegistrationListItem) => {
    setActionRegistration(reg);
    setIsDisqualifyModalOpen(true);
  };

  const openRemovePlayer = (reg: RegistrationListItem) => {
    setActionRegistration(reg);
    setIsRemovePlayerModalOpen(true);
  };

  const openEnablePlayer = (reg: RegistrationListItem) => {
    setActionRegistration(reg);
    setIsEnablePlayerModalOpen(true);
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
    setIsCancelModalOpen(true);
  };

  const openDelete = (tournament: TournamentRow) => {
    closeDropdown();
    if (tournament.registrations > 0) {
      toast.error("This tournament has registered players. You cannot delete it. Please cancel it instead.");
      return;
    }
    setDeleteConfirmText("");
    setIsDeleteModalOpen(true);
  };

  const handleMenuAction = (tournament: TournamentRow, action: string) => {
    closeDropdown();
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
        return reloadSingleTournament();
      })
      .catch((e: unknown) => {
        toast.error(e instanceof Error ? e.message : "Failed to cancel tournament", { id: toastId });
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
        router.push("/organizer-admin/tournaments");
      })
      .catch((e: unknown) => {
        toast.error(e instanceof Error ? e.message : "Failed to delete tournament", { id: toastId });
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
      await deleteRegistration(actionRegistration.id);
      toast.success("Player removed from tournament");

      await reloadSingleTournament();

      if (registrationsMode === "client") {
        setRegistrationsAll(prev => prev.filter(x => x.id !== actionRegistration.id));
        setRegistrations(prev => prev.filter(x => x.id !== actionRegistration.id));
        setRegistrationsTotal(prev => Math.max(0, prev - 1));
      } else {
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
    } catch (e: any) {
      toast.error(e.message || "Failed to remove player");
    } finally {
      setRegistrationActionId(null);
      setActionRegistration(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 w-full max-w-full px-4 py-8 font-sans animate-pulse">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-5 w-36 rounded-md" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Skeleton className="h-20 w-20 rounded-3xl" />
              <div className="space-y-3">
                <Skeleton className="h-8 w-72 rounded-lg" />
                <Skeleton className="h-4 w-80 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !selectedTournament) {
    return (
      <div className="p-8 text-center text-red-500 font-sans">
        <p className="font-bold text-lg">Error loading tournament</p>
        <p className="text-sm mt-1">{error || "Tournament not found"}</p>
        <Button onClick={() => router.push("/organizer-admin/tournaments")} className="mt-4 bg-[#10b981] hover:bg-[#0da673] text-white">
          Back to Tournaments
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full px-4 py-8 font-sans space-y-6">
      {/* Back Header */}
      <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/organizer-admin/tournaments")}
            className="w-10 h-10 border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/20 text-gray-500 hover:text-emerald-600 rounded-xl flex items-center justify-center transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{selectedTournament.name}</h1>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border",
                STATUS_META[selectedTournament.statusKey]?.badge || "bg-gray-100 text-gray-600 border-gray-200"
              )}>
                {selectedTournament.status}
              </span>
            </div>
            <p className="text-[13px] text-gray-505 mt-0.5">
              Hosted at {selectedTournament.clubName} • {selectedTournament.dates}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => openEdit(selectedTournament)}
            disabled={selectedTournament.statusKey === "CANCELLED" || selectedTournament.statusKey === "COMPLETED" || selectedTournament.statusKey === "ONGOING"}
            variant="outline"
            className="h-10 border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm flex items-center gap-2 rounded-xl"
          >
            <Edit2 className="w-4 h-4 text-gray-400" />
            Edit Tournament
          </Button>

          <div className="relative">
            <Button
              variant="outline"
              onClick={(e) => {
                setActiveDropdown(activeDropdown ? null : selectedTournament.id);
                setDropdownAnchorEl(e.currentTarget);
              }}
              className="h-10 w-10 p-0 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
            {activeDropdown === selectedTournament.id && (
              <FloatingMenu
                open={activeDropdown === selectedTournament.id}
                anchorEl={dropdownAnchorEl}
                onClose={closeDropdown}
                placement="bottom-end"
                className="w-52"
              >
                <button
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-3",
                    selectedTournament.statusKey === "CANCELLED" || selectedTournament.statusKey === "COMPLETED"
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                  onClick={() => {
                    if (selectedTournament.statusKey !== "CANCELLED" && selectedTournament.statusKey !== "COMPLETED") {
                      handleMenuAction(selectedTournament, "cancel");
                    }
                  }}
                >
                  <Ban className="w-4 h-4 text-gray-450" /> Cancel Tournament
                </button>
                <div className="h-px bg-gray-50 my-1 mx-2" />
                <button
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-650 hover:bg-red-50 flex items-center gap-3 rounded-lg"
                  onClick={() => handleMenuAction(selectedTournament, "delete")}
                >
                  <Trash2 className="w-4 h-4 text-red-500" /> Delete Tournament
                </button>
              </FloatingMenu>
            )}
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-1.5 sticky top-6">
            {TABS.map((tab, i) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full text-left flex items-center gap-3.5 px-4 py-3 rounded-xl border transition-all duration-200",
                    isActive
                      ? "bg-emerald-50/60 border-emerald-100 text-emerald-700 font-bold shadow-sm shadow-emerald-50"
                      : "bg-white border-transparent text-gray-500 hover:bg-gray-50/50 hover:text-gray-900"
                  )}
                >
                  <div
                    className={cn(
                      "w-6.5 h-6.5 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300",
                      isActive
                        ? "bg-[#10b981] text-white shadow-sm shadow-emerald-100"
                        : "bg-gray-100 text-gray-400 border border-gray-200"
                    )}
                  >
                    {i + 1}
                  </div>
                  <span className="text-[13px] font-semibold uppercase tracking-wider leading-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column - Active Panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* Status Alert Banners */}
          {selectedTournament.statusKey === "CANCELLED" && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-4 text-red-700">
              <Ban className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="text-[14px] font-bold">Tournament Cancelled</p>
                <p className="text-[12px] text-red-650/80 font-medium">This tournament has been cancelled and modifications are locked.</p>
              </div>
            </div>
          )}
          {selectedTournament.statusKey === "COMPLETED" && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4 text-emerald-700">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="text-[14px] font-bold">Tournament Completed</p>
                <p className="text-[12px] text-emerald-650/80 font-medium">This tournament has concluded and is read-only.</p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden min-h-[600px] p-6 sm:p-8">
            {/* TABS 1: Registered Players */}
            {activeTab === "players" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Registered Players</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage participation, handicap indices, and add extra strokes.</p>
                  </div>
                  <Button
                    disabled={selectedTournament.statusKey === "CANCELLED" || selectedTournament.statusKey === "COMPLETED"}
                    onClick={() => setActiveTab("register")}
                    className="h-10 bg-[#10b981] hover:bg-[#0da673] border border-emerald-600/30 text-white gap-2 rounded-xl px-4 text-[13px] font-bold"
                  >
                    <UserPlus className="w-4 h-4" /> Register Player
                  </Button>
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
                      className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white rounded-xl text-[14px]"
                    />
                  </div>
                  <SearchableSelect
                    value={registrationsStatusFilter}
                    onValueChange={(v: any) => {
                      setRegistrationsPage(1);
                      if (registrationsMode === "server") setRegistrationsLoading(true);
                      setRegistrationsStatusFilter(v);
                    }}
                    options={[
                      { value: "All Status", label: "All Status" },
                      { value: "PENDING", label: "Pending" },
                      { value: "APPROVED", label: "Approved" },
                      { value: "REJECTED", label: "Rejected" },
                      { value: "WAITLISTED", label: "Waitlisted" },
                      { value: "DISQUALIFIED", label: "Disqualified" },
                    ]}
                    className="min-w-[150px]"
                    triggerClassName="h-11 bg-white"
                  />
                  <SearchableSelect
                    value={registrationsPaymentFilter}
                    onValueChange={(v: any) => {
                      setRegistrationsPage(1);
                      if (registrationsMode === "server") setRegistrationsLoading(true);
                      setRegistrationsPaymentFilter(v);
                    }}
                    options={[
                      { value: "All Payments", label: "All Payments" },
                      { value: "PAID", label: "Paid" },
                      { value: "UNPAID", label: "Unpaid" },
                      { value: "REFUNDED", label: "Refunded" },
                    ]}
                    className="min-w-[150px]"
                    triggerClassName="h-11 bg-white"
                  />
                </div>

                <div className="space-y-4">
                  {registrationsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-xl" />
                      ))}
                    </div>
                  ) : registrationsPageItems.length > 0 ? (
                    <div className="space-y-3">
                      {registrationsPageItems.map((r) => {
                        const isDisqualified = r.status === "DISQUALIFIED";
                        const isPaid = r.paymentStatus === "PAID";
                        return (
                          <div
                            key={r.id}
                            className={cn(
                              "p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4",
                              isDisqualified
                                ? "bg-red-50/10 border-red-100/50 opacity-75"
                                : "bg-gray-50/20 border-gray-100 hover:border-gray-200"
                            )}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-gray-100">
                                {r.user?.profilePhoto ? (
                                  <img src={r.user.profilePhoto} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className={cn(
                                    "w-full h-full flex items-center justify-center font-bold text-sm",
                                    isDisqualified ? "bg-red-50 text-red-700" : "bg-emerald-50 text-[#10b981]"
                                  )}>
                                    {r.user?.firstName?.[0] || r.user?.email?.[0]?.toUpperCase() || "?"}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[14px] font-bold text-gray-900 truncate">
                                  {fullName(r.user?.firstName ?? null, r.user?.lastName ?? null)}
                                </p>
                                <p className="text-[12px] text-gray-555 truncate mt-0.5">{r.user?.email}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                                    r.status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                      r.status === "PENDING" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                                        r.status === "WAITLISTED" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                          r.status === "DISQUALIFIED" ? "bg-red-50 text-red-700 border border-red-100" :
                                            "bg-gray-50 text-gray-600 border border-gray-200"
                                  )}>
                                    {r.status}
                                  </span>
                                  <span className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                                    isPaid ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                      "bg-gray-50 text-gray-600 border border-gray-250"
                                  )}>
                                    {r.paymentStatus}
                                  </span>
                                  {typeof r.extraStrokes === "number" && r.extraStrokes !== 0 && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100 uppercase tracking-wider">
                                      {r.extraStrokes > 0 ? `+${r.extraStrokes}` : r.extraStrokes} Strokes
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                              {selectedTournament.statusKey !== "CANCELLED" && selectedTournament.statusKey !== "COMPLETED" && (
                                <div className="flex items-center gap-2">
                                  {selectedTournament.entryFee !== null && !isPaid && (
                                    <Button
                                      variant="outline"
                                      onClick={() => handleMarkPaid(r.id)}
                                      disabled={markingPaidId === r.id}
                                      title="Mark as Paid"
                                      className="h-9 w-9 p-0 rounded-lg border-emerald-200 text-emerald-600 hover:bg-emerald-50 flex items-center justify-center"
                                    >
                                      {markingPaidId === r.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                                      ) : (
                                        <Wallet className="w-4 h-4" />
                                      )}
                                    </Button>
                                  )}

                                  <Button
                                    variant="outline"
                                    onClick={(e) => {
                                      setStrokesMenuRegistration(r);
                                      setStrokesMenuAnchorEl(e.currentTarget);
                                    }}
                                    title="Add/Remove Strokes"
                                    className="h-9 w-9 p-0 rounded-lg border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>

                                  {isDisqualified ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openEnablePlayer(r)}
                                      disabled={registrationActionId === r.id}
                                      title="Enable Player"
                                      className="h-9 w-9 p-0 rounded-lg border-emerald-200 text-emerald-600 hover:bg-emerald-50 flex items-center justify-center"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                    </Button>
                                  ) : (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openDisqualify(r)}
                                        disabled={registrationActionId === r.id}
                                        title="Disqualify Player"
                                        className="h-9 w-9 p-0 rounded-lg border-amber-250 text-amber-600 hover:bg-amber-50/50 flex items-center justify-center"
                                      >
                                        <Ban className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openRemovePlayer(r)}
                                        disabled={registrationActionId === r.id}
                                        title="Remove Player"
                                        className="h-9 w-9 p-0 rounded-lg border-red-100 text-red-650 hover:bg-red-50 flex items-center justify-center"
                                      >
                                        <UserMinus className="w-4 h-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/40 p-8 text-center text-[13px] text-gray-500 font-medium">
                      No registrations found matching these filters.
                    </div>
                  )}

                  {!registrationsLoading && registrationsFilteredTotal > 0 && (
                    <div className="pt-4 flex items-center justify-between gap-4">
                      <p className="text-[13px] text-gray-505 font-medium">
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
            )}

            {/* TABS 2: Register Player Inline */}
            {activeTab === "register" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 font-sans">Manual Player Registration</h2>
                  <p className="text-sm text-gray-500 mt-1">Directly search and enrol members into this tournament.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-emerald-50/30 border border-emerald-100/50">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-gray-900 leading-tight">Quick Registration</h3>
                    <p className="text-[12px] text-gray-550 mt-1 leading-relaxed">
                      Register members directly into <span className="text-emerald-600 font-bold">{selectedTournament.name}</span>. Groupings and pairing calculations will be recalculated dynamically.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Initial Payment Status</Label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setManualPaymentType('UNPAID')}
                      className={cn(
                        "flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1 text-center",
                        manualPaymentType === 'UNPAID'
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-gray-150 bg-white text-gray-550 hover:border-gray-255"
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
                      <p className="text-[10px] opacity-70 leading-tight mt-1">Player will not be confirmed for grouping until payment is recorded.</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualPaymentType('CASH')}
                      className={cn(
                        "flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1 text-center",
                        manualPaymentType === 'CASH'
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-gray-150 bg-white text-gray-550 hover:border-gray-255"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                          manualPaymentType === 'CASH' ? "border-emerald-500" : "border-gray-300"
                        )}>
                          {manualPaymentType === 'CASH' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                        </div>
                        <span className="text-[13px] font-bold">Paid (Cash / Direct)</span>
                      </div>
                      <p className="text-[10px] opacity-70 leading-tight mt-1">Player will be marked as PAID and automatically APPROVED.</p>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Type player name or email to search..."
                      value={registerPlayerSearch}
                      onChange={(e) => setRegisterPlayerSearch(e.target.value)}
                      className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:bg-white rounded-xl text-[14px]"
                    />
                  </div>

                  <div className="border border-gray-150 rounded-2xl overflow-hidden min-h-[300px] bg-gray-50/20">
                    {isSearchingPlayers ? (
                      <div className="p-12 text-center text-gray-400 space-y-3">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-650" />
                        <p className="text-sm">Searching the openclub registry...</p>
                      </div>
                    ) : registerPlayerResults.length > 0 ? (
                      <div className="divide-y divide-gray-100 bg-white">
                        {registerPlayerResults.map((player) => {
                          const isAlreadyRegistered = registrationsAll.some(x => x.user?.id === player.id);
                          return (
                            <div key={player.id} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                              <div className="min-w-0">
                                <p className="text-[14px] font-bold text-gray-900 truncate">
                                  {fullName(player.firstName ?? null, player.lastName ?? null)}
                                </p>
                                <p className="text-[12px] text-gray-550 truncate mt-0.5">{player.email}</p>
                              </div>
                              <Button
                                disabled={isAlreadyRegistered || isRegistering}
                                size="sm"
                                onClick={() => handleRegisterPlayer(player.id)}
                                className={cn(
                                  "rounded-xl font-bold text-[12px] px-4 h-9",
                                  isAlreadyRegistered
                                    ? "bg-gray-100 text-gray-400 border border-gray-200"
                                    : "bg-[#10b981] hover:bg-[#0da673] text-white"
                                )}
                              >
                                {isRegistering ? "Registering..." : isAlreadyRegistered ? "Registered" : "Enrol Player"}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    ) : registerPlayerSearch.trim().length >= 2 ? (
                      <div className="h-[300px] flex flex-col items-center justify-center text-center p-8">
                        <Search className="w-10 h-10 text-gray-300 mb-3" />
                        <p className="text-[14px] font-bold text-gray-900">No players found</p>
                        <p className="text-[12px] text-gray-400 mt-1 max-w-xs">
                          We couldn't find anyone in OpenClub matching "{registerPlayerSearch}"
                        </p>
                      </div>
                    ) : (
                      <div className="h-[300px] flex flex-col items-center justify-center text-center p-8">
                        <Users className="w-10 h-10 text-emerald-200 mb-3 animate-pulse" />
                        <p className="text-[14px] font-bold text-gray-950">Start Enrolling</p>
                        <p className="text-[12px] text-gray-500 mt-1 max-w-xs leading-relaxed">
                          Type 2 or more characters of a member's name or email to retrieve matches.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TABS 3: Waitlist Management */}
            {activeTab === "waitlist" && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-emerald-600 font-bold uppercase tracking-wider">Queue Management</p>
                    <h4 className="text-[15px] font-bold text-gray-900 truncate">Waitlist Queue</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-emerald-600 leading-none">{formatWithCommas(waitlist.length)}</p>
                    <p className="text-[11px] text-emerald-650 font-bold uppercase tracking-widest mt-1">Waiting</p>
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search waitlist by name or email..."
                    className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:bg-white rounded-xl text-[14px]"
                    value={waitlistSearch}
                    onChange={(e) => setWaitlistSearch(e.target.value)}
                  />
                </div>

                <div className="border border-gray-155 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                        <th className="px-6 py-4">Player Details</th>
                        <th className="px-6 py-4">Joined Date</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {waitlistLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <tr key={i}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <Skeleton className="w-10 h-10 rounded-full" />
                                <div className="space-y-2">
                                  <Skeleton className="h-4 w-32 rounded" />
                                  <Skeleton className="h-3 w-40 rounded" />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Skeleton className="h-4 w-24 rounded" />
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Skeleton className="h-8 w-20 rounded-lg ml-auto" />
                            </td>
                          </tr>
                        ))
                      ) : filteredWaitlist.length > 0 ? (
                        filteredWaitlist.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50/30 transition-colors group">
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[14px] border border-emerald-100">
                                  {item.user?.firstName?.[0] || item.user?.email?.[0]?.toUpperCase() || "?"}
                                </div>
                                <div>
                                  <p className="text-[14px] font-bold text-gray-900 leading-tight">
                                    {fullName(item.user?.firstName ?? null, item.user?.lastName ?? null)}
                                  </p>
                                  <p className="text-[12px] text-gray-550 mt-0.5">{item.user?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex flex-col">
                                <span className="text-[13px] font-medium text-gray-700">
                                  {new Date(item.registeredAt).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                                <span className="text-[11px] text-gray-400 font-medium">
                                  {new Date(item.registeredAt).toLocaleTimeString("en-GB", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  onClick={() => handleApproveWaitlist(item.id)}
                                  disabled={waitlistActionId === item.id}
                                  className="h-8 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200/50 shadow-none rounded-lg text-[11px] font-bold gap-1.5 px-3.5"
                                >
                                  {waitlistActionId === item.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                  Approve
                                </Button>
                                <Button
                                  onClick={() => handleRemoveWaitlist(item.id)}
                                  disabled={waitlistActionId === item.id}
                                  variant="ghost"
                                  className="h-8 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-lg text-[11px] font-bold gap-1 px-2.5"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                  Remove
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-6 py-20 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center border border-dashed border-gray-200">
                                <Clock className="w-8 h-8 text-gray-200" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-[15px] font-bold text-gray-900">Waitlist is empty</p>
                                <p className="text-[13px] text-gray-400">No players currently in the queue for this tournament.</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-4">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <p className="text-[12px] text-amber-700 leading-relaxed font-medium">
                    <strong>Capacity Note:</strong> Approving a player from the waitlist will automatically increment the tournament's maximum player limit if the tournament is already full.
                  </p>
                </div>
              </div>
            )}

            {/* TABS 4: Groupings (Tee Times) */}
            {activeTab === "groupings" && (
              <div className="space-y-6">
                {groupingsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="border border-gray-150 rounded-2xl p-5 space-y-3 bg-white">
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
                        <h2 className="text-xl font-bold text-gray-900 font-sans">Groupings & Tee Times</h2>
                        <p className="text-[13px] text-gray-500 font-normal mt-0.5">Manage pairings, custom tee-off schedules, and course division rosters.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleGenerateGroupings}
                          disabled={groupingsGenerating}
                          variant="outline"
                          className="border-emerald-100 hover:bg-emerald-50 text-[#10b981] rounded-xl h-10 px-4 text-[12px] font-bold"
                        >
                          Regenerate
                        </Button>
                        <Button
                          onClick={handleClearGroupings}
                          variant="outline"
                          className="border-red-100 hover:bg-red-50 text-red-650 rounded-xl h-10 px-4 text-[12px] font-bold"
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
                                      className="text-[12px] text-[#10b981] hover:text-emerald-700 font-bold focus:outline-none shrink-0"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingGroupNameId(null)}
                                      className="text-[12px] text-gray-400 hover:text-gray-600 font-bold focus:outline-none shrink-0"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[14px] text-gray-900 font-bold">{group.name}</span>
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
                                      className="text-[12px] text-[#10b981] hover:text-emerald-700 font-bold focus:outline-none shrink-0"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingGroupTimeId(null)}
                                      className="text-[12px] text-gray-400 hover:text-gray-600 font-bold focus:outline-none shrink-0"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-gray-500">
                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="text-[12px] font-bold">{group.startTime || "TBD"}</span>
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
                                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gray-100 bg-gray-50">
                                          {player.user?.profilePhoto ? (
                                            <img src={player.user.profilePhoto} alt="" className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center font-bold text-[12px] text-[#10b981]">
                                              {player.user?.firstName?.[0] || player.user?.email?.[0]?.toUpperCase() || "?"}
                                            </div>
                                          )}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="text-[13px] text-gray-800 font-bold truncate">
                                            {player.user?.firstName || ""} {player.user?.lastName || ""}
                                          </div>
                                          <div className="text-[10px] text-gray-450 font-bold">
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
                                          className="bg-transparent border-none text-[11px] text-gray-400 hover:bg-gray-100 rounded px-2 py-1 focus:outline-none font-bold cursor-pointer transition-colors"
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

                      <div className="w-full lg:w-[300px] shrink-0 bg-gray-50/50 border border-gray-150 rounded-2xl p-4 shadow-sm self-start">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                          <span className="text-[13px] text-gray-600 font-bold flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-gray-400" /> Unassigned Pool
                          </span>
                          <span className="text-[11px] font-bold text-gray-450 bg-gray-100 border px-2 py-0.5 rounded-lg">
                            {groupingsData.unassigned.length}
                          </span>
                        </div>
                        {groupingsData.unassigned && groupingsData.unassigned.length > 0 ? (
                          <div className="divide-y divide-gray-100 max-h-[480px] overflow-y-auto pr-1 -mr-1 custom-scrollbar bg-white rounded-xl border border-gray-150/40 p-2 mt-3">
                            {groupingsData.unassigned.map((player: GroupingPlayer) => (
                              <div key={player.id} className="flex items-center justify-between py-2.5 hover:bg-gray-50/30 px-2 rounded-lg transition-colors">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-gray-100 bg-emerald-50">
                                    {player.user?.profilePhoto ? (
                                      <img src={player.user.profilePhoto} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-[#10b981]">
                                        {player.user?.firstName?.[0] || player.user?.email?.[0]?.toUpperCase() || "?"}
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-[12px] text-gray-800 font-bold truncate">
                                      {player.user?.firstName || ""} {player.user?.lastName || ""}
                                    </div>
                                    <div className="text-[9px] text-gray-400 font-bold">
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
                                  className="bg-transparent border-none text-[11px] text-[#10b981] hover:bg-emerald-55/10 rounded px-1.5 py-1 focus:outline-none font-bold cursor-pointer transition-colors"
                                >
                                  <option value="unassigned">Assign...</option>
                                  {groupingsData.groups.map((g: GroupingItem) => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-gray-450 italic text-center py-10 font-normal">All players have been grouped.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-gray-200 rounded-2xl">
                    <Route className="w-12 h-12 text-gray-200 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 font-sans">No Groupings Calculated</h3>
                    <p className="text-sm text-gray-400 mt-1 max-w-sm">Tee times groupings have not been compiled for this tournament yet.</p>
                    <Button
                      onClick={handleGenerateGroupings}
                      disabled={groupingsGenerating}
                      className="mt-6 bg-[#10b981] hover:bg-[#0da673] text-white rounded-xl h-10 px-6 text-[13px] font-bold"
                    >
                      {groupingsGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Generate Initial Pairings
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* TABS 5: Overview (Course & Organiser Details) */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Statistics Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 flex flex-col justify-between">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Registrations</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{formatWithCommas(registrationsTournamentTotal)}</p>
                        <p className="text-[11px] text-gray-505 font-medium mt-0.5">Total Players</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 flex flex-col justify-between">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Entry Fee</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{formatNaira(selectedTournament.entryFee)}</p>
                        <p className="text-[11px] text-gray-550 font-medium mt-0.5">Per Registration</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Wallet className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 flex flex-col justify-between">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Capacity</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedTournament.maxPlayers ? formatWithCommas(selectedTournament.maxPlayers) : "∞"}
                        </p>
                        <p className="text-[11px] text-gray-550 font-medium mt-0.5">Player Limit</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                        <Lock className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Course & Organiser Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Golf Course Box */}
                  <div className="p-6 rounded-2xl border border-gray-150 bg-white space-y-6">
                    <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200 flex-shrink-0 shadow-sm">
                        {courseDetails?.coverImage ? (
                          <img src={courseDetails.coverImage} className="w-full h-full object-cover" />
                        ) : (
                          <Flag className="w-7 h-7 text-emerald-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-[16px] font-bold text-gray-900 leading-tight">
                          {courseDetails?.name || "Golf Course details"}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {courseDetails?.address || "No address listed"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50/60 rounded-xl border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Holes</span>
                        <span className="text-[15px] font-extrabold text-gray-800">{courseDetails?.holesCount || "—"} Holes</span>
                      </div>
                      <div className="p-3 bg-gray-50/60 rounded-xl border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Par</span>
                        <span className="text-[15px] font-extrabold text-gray-800">Par {courseDetails?.par || "—"}</span>
                      </div>
                      <div className="p-3 bg-gray-50/60 rounded-xl border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Slope Rating</span>
                        <span className="text-[15px] font-extrabold text-gray-800">{courseDetails?.slopeRating || "—"}</span>
                      </div>
                      <div className="p-3 bg-gray-50/60 rounded-xl border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Architect</span>
                        <span className="text-[15px] font-extrabold text-gray-800 truncate block">{courseDetails?.architect || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Organiser Box */}
                  <div className="p-6 rounded-2xl border border-gray-150 bg-white space-y-6">
                    <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200 flex-shrink-0 shadow-sm">
                        {clubDetails?.logo ? (
                          <img src={clubDetails.logo} className="w-full h-full object-cover" />
                        ) : (
                          <Trophy className="w-7 h-7 text-emerald-650" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-[16px] font-bold text-gray-900 leading-tight">
                          {clubDetails?.name || selectedTournament.clubName}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {clubDetails?.address || "No address listed"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50/60 rounded-xl border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Status</span>
                        <span className="text-[13px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full mt-1.5 inline-block">
                          {clubDetails?.status || "ACTIVE"}
                        </span>
                      </div>
                      <div className="p-3 bg-gray-50/60 rounded-xl border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Plan tier</span>
                        <span className="text-[13px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full mt-1.5 inline-block">
                          {clubDetails?.plan || "PRO"}
                        </span>
                      </div>
                      <div className="p-3 bg-gray-50/60 rounded-xl border border-gray-100 col-span-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Admin Email</span>
                        <span className="text-[14px] font-bold text-gray-800 truncate block mt-0.5">{clubDetails?.adminEmail || "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Helper Modals */}
      <FloatingMenu
        open={strokesMenuRegistration !== null}
        anchorEl={strokesMenuAnchorEl}
        onClose={() => {
          setStrokesMenuRegistration(null);
          setStrokesMenuAnchorEl(null);
        }}
        placement={"bottom-start" as any}
        className="w-40 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden py-1"
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
                <Plus className="w-4 h-4 text-gray-455" /> +{delta} {delta === 1 ? "stroke" : "strokes"}
              </button>
            ))}
          </>
        ) : null}
      </FloatingMenu>

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
              className="rounded-lg font-bold px-8 text-white border bg-red-500 hover:bg-red-650 border-red-650/30"
              onClick={confirmCancel}
              disabled={mutating}
            >
              Yes, Cancel
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-amber-50 text-amber-500 border border-amber-100">
            <AlertTriangle className="h-10 w-10 animate-bounce" />
          </div>
          <h4 className="text-xl font-bold text-gray-900 mb-2">Cancel Tournament?</h4>
          <p className="text-gray-550 max-w-sm">
            This will set the tournament status to Cancelled. Are you sure you want to cancel {selectedTournament.name}?
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
              Delete
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center py-2">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-red-50 text-red-500 border border-red-100">
              <Trash2 className="h-10 w-10 animate-pulse" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Delete Tournament Permanently?</h4>
            <p className="text-gray-550 max-w-sm">
              This action cannot be undone. All database records associated with the tournament will be deleted.
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
              className="rounded-xl border-gray-200 focus:border-red-500 text-[14px]"
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
              Confirm
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-amber-50 text-amber-500 border border-amber-100">
            <Ban className="h-10 w-10" />
          </div>
          <h4 className="text-xl font-bold text-gray-900 mb-2">Disqualify Player?</h4>
          <p className="text-gray-550 max-w-sm">
            Are you sure you want to disqualify <strong>{actionRegistration ? `${actionRegistration.user?.firstName} ${actionRegistration.user?.lastName}` : "this player"}</strong>?
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
              className="rounded-lg font-bold px-8 text-white border bg-red-500 hover:bg-red-650 border-red-650/30"
              onClick={confirmRemovePlayer}
            >
              Remove
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-red-50 text-red-500 border border-red-100">
            <UserMinus className="h-10 w-10" />
          </div>
          <h4 className="text-xl font-bold text-gray-900 mb-2">Remove Player?</h4>
          <p className="text-gray-550 max-w-sm">
            Are you sure you want to permanently remove <strong>{actionRegistration ? `${actionRegistration.user?.firstName} ${actionRegistration.user?.lastName}` : "this player"}</strong> from the tournament?
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
              className="rounded-lg font-bold px-8 text-white border bg-emerald-500 hover:bg-emerald-650 border-emerald-655/30"
              onClick={confirmEnablePlayer}
            >
              Enable
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-emerald-50 text-emerald-500 border border-emerald-100">
            <CheckCircle2 className="h-10 w-10 animate-bounce" />
          </div>
          <h4 className="text-xl font-bold text-gray-900 mb-2">Re-enable Player?</h4>
          <p className="text-gray-550 max-w-sm">
            Are you sure you want to re-enable <strong>{actionRegistration ? `${actionRegistration.user?.firstName} ${actionRegistration.user?.lastName}` : "this player"}</strong>?
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default function ViewTournamentPage() {
  return (
    <Suspense fallback={
      <div className="space-y-8 w-full max-w-full px-4 py-8 font-sans animate-pulse">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-5 w-36 rounded-md" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Skeleton className="h-20 w-20 rounded-3xl" />
              <div className="space-y-3">
                <Skeleton className="h-8 w-72 rounded-lg" />
                <Skeleton className="h-4 w-80 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <ViewTournamentPageInner />
    </Suspense>
  );
}
