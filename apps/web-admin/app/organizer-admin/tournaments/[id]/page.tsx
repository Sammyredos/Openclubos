"use client";

import { useState, useEffect, Suspense } from "react";
import NextLink from "next/link";
import { useRouter, useParams, useSearchParams, usePathname } from "next/navigation";
import {
  Trophy,
  Users,
  UserPlus,
  Calendar,
  Wallet,
  Search,
  Plus,
  Eye,
  Edit2,
  MoreHorizontal,
  Ban,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Globe,
  Lock,
  Shield,
  UserMinus,
  Clock,
  ArrowLeft,
  Loader2,
  Flag,
  Activity,
  Award,
  Sparkles,
  RefreshCcw,
  Send,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatWithCommas, subscribeAdminEvents, getGolfCategory } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
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
  type GroupingPlayer,
} from "@/lib/api/tournaments";
import { getTournamentScores } from "@/lib/api/scores";
import { getCourse, type Course } from "@/lib/api/courses";
import { getClub, type Club } from "@/lib/api/clubs";
import {
  addRegistrationStrokes,
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
  maxPlayersPerGroup: number | null;
  statusKey: TournamentStatus;
  visibility: string;
  visibilityKey: "PUBLIC" | "PRIVATE" | "INVITE_ONLY";
  enableWaitlist?: boolean;
  createdAt: string;
  registrations: number;
};

const STATUS_META: Record<TournamentStatus, { label: string; color: string; badge: string }> = {
  DRAFT: { label: "Draft", color: "#94a3b8", badge: "bg-slate-50 text-slate-600" },
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
  { id: "players", label: "Registered Players", icon: Users },
  { id: "waitlist", label: "Waitlist Settings", icon: Clock },
  { id: "groupings", label: "Groupings (Tee Times)", icon: Calendar },
  { id: "leaderboard", label: "Live Leaderboard", icon: Trophy },
  { id: "overview", label: "Overview", icon: Eye },
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
  if (value == null || value === 0) return "FREE";
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
  const [registrationsDisqualifiedFilter] = useState<
    "All Players" | "Enabled Players" | "Disqualified Players"
  >("All Players");
  const [registrationsRefreshTrigger, setRegistrationsRefreshTrigger] = useState(0);

  const [registrationActionId, setRegistrationActionId] = useState<string | null>(null);
  const [strokesMenuRegistration, setStrokesMenuRegistration] = useState<RegistrationListItem | null>(null);
  const [strokesMenuAnchorEl, setStrokesMenuAnchorEl] = useState<HTMLButtonElement | null>(null);

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
  const [waitlistFilter, setWaitlistFilter] = useState<"PENDING" | "REJECTED">("PENDING");

  // Groupings (Tee Times) Management States
  const [groupingsData, setGroupingsData] = useState<GroupingData | null>(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [groupingsSubTab, setGroupingsSubTab] = useState<"unassigned" | "grouped">("unassigned");
  const [groupingsLoading, setGroupingsLoading] = useState(false);
  const [groupingsGenerating, setGroupingsGenerating] = useState(false);
  const [editingGroupNameId, setEditingGroupNameId] = useState<string | null>(null);
  const [editingGroupNameValue, setEditingGroupNameValue] = useState("");

  // Groupings Search/Filter
  const [groupingsSearch, setGroupingsSearch] = useState("");
  const [groupsSearch, setGroupsSearch] = useState("");
  const [unassignedPage, setUnassignedPage] = useState(1);
  const [groupsPage, setGroupsPage] = useState(1);
  const unassignedPerPage = 12;
  const groupsPerPage = 6;

  // Leaderboard States
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [selectedLeaderboardDay, setSelectedLeaderboardDay] = useState<number | "all">("all");

  const getTournamentDays = () => {
    if (!selectedTournament?.startDate) return 1;
    const start = new Date(selectedTournament.startDate);
    const end = selectedTournament.endDate ? new Date(selectedTournament.endDate) : start;
    const d1 = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const d2 = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    return Math.floor(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
  };

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
        waitlistOnly: true,
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
      const data = await getGroupings(tournamentId, selectedDay);
      setGroupingsData(data);
    } catch (err) {
      toast.error((err instanceof Error ? err.message : null) || "Failed to load groupings");
    } finally {
      setGroupingsLoading(false);
    }
  };

  const handleGenerateGroupings = async (rule: "RANDOM" | "LEADERBOARD_REVERSE" | "LEADERBOARD_DIRECT" = "RANDOM") => {
    if (!tournamentId) return;
    setGroupingsGenerating(true);
    try {
      const data = await generateGroupings(tournamentId, selectedDay, rule);
      setGroupingsData(data);
      setGroupingsSubTab("grouped");
      toast.success("Groupings generated successfully");
    } catch (err) {
      toast.error((err instanceof Error ? err.message : null) || "Failed to generate groupings");
    } finally {
      setGroupingsGenerating(false);
    }
  };

  const handleMovePlayer = async (registrationId: string, targetGroupId: string | null) => {
    if (!tournamentId) return;
    
    // Capacity check
    if (targetGroupId && groupingsData) {
      const targetGroup = groupingsData.groups.find(g => g.id === targetGroupId);
      const capacity = selectedTournament?.maxPlayersPerGroup || 4;
      if (targetGroup && targetGroup.registrations.length >= capacity) {
        toast.error(`Group "${targetGroup.name}" is full!`, {
          description: `This group has reached its maximum capacity of ${capacity} players.`,
        });
        return;
      }
    }

    try {
      const data = await movePlayerInGroupings(tournamentId, registrationId, targetGroupId, selectedDay);
      setGroupingsData(data);
      toast.success("Player reassigned successfully");
    } catch (err) {
      toast.error((err instanceof Error ? err.message : null) || "Failed to reassign player");
    }
  };

  const handleUpdateGroupDetails = async (groupId: string, payload: { name?: string; startTime?: string }) => {
    if (!tournamentId) return;
    try {
      const data = await updateGroupingTime(tournamentId, groupId, payload, selectedDay);
      setGroupingsData(data);
      setEditingGroupNameId(null);
      toast.success("Group updated successfully");
    } catch (err) {
      toast.error((err instanceof Error ? err.message : null) || "Failed to update group");
    }
  };

  const [isResetGroupingsModalOpen, setIsResetGroupingsModalOpen] = useState(false);

  const handleClearGroupings = async () => {
    if (!tournamentId) return;
    setIsResetGroupingsModalOpen(true);
  };

  const confirmResetGroupings = async () => {
    try {
      setGroupingsLoading(true);
      const data = await clearGroupings(tournamentId, selectedDay);
      setGroupingsData(data);
      setGroupingsSubTab("unassigned"); // Automatically switch to unassigned tab
      setIsResetGroupingsModalOpen(false);
      toast.success("Groupings reset successfully");
    } catch (err) {
      toast.error((err instanceof Error ? err.message : null) || "Failed to reset groupings");
    } finally {
      setGroupingsLoading(false);
    }
  };

  const loadLeaderboardData = async () => {
    if (!tournamentId || !selectedTournament) return;
    setLeaderboardLoading(true);
    try {
      const scores = await getTournamentScores(tournamentId);
      
      // Get all approved & paid registrations to include in leaderboard even if no scores
      const { items: allRegs } = await getRegistrations({
        tournamentId,
        status: "APPROVED",
        paymentStatus: "PAID",
        take: 500,
      });

      const playersMap: Record<string, any> = {};
      
      // Initialize map with all registered players
      allRegs.forEach((reg: any) => {
        if (reg.user) {
          playersMap[reg.user.id] = {
            user: reg.user,
            grossStrokes: 0,
            holesCompleted: new Set(),
            points: 0,
            extraStrokes: reg.extraStrokes || 0,
          };
        }
      });

      const startDate = new Date(selectedTournament.startDate);
      const d2 = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

      scores.forEach((s: any) => {
        // Use group's scheduled startTime if available to ensure late score submissions 
        // are still mapped to the correct round. Fallback to recordedAt.
        const scoreDate = s.group?.startTime ? new Date(s.group.startTime) : new Date(s.recordedAt);
        const d1 = Date.UTC(scoreDate.getFullYear(), scoreDate.getMonth(), scoreDate.getDate());
        const dayDiff = Math.floor((d1 - d2) / (1000 * 60 * 60 * 24)) + 1;
        
        // Filter by selected day if not "all"
        if (selectedLeaderboardDay !== "all" && dayDiff !== selectedLeaderboardDay) {
          return;
        }

        const uid = s.userId;
        if (!playersMap[uid]) {
          // If for some reason a player has scores but not in allRegs (unlikely if paid)
          playersMap[uid] = {
            user: s.user,
            grossStrokes: 0,
            holesCompleted: new Set(),
            points: 0,
            extraStrokes: 0,
          };
        }
        
        playersMap[uid].grossStrokes += s.strokes || 0;
        playersMap[uid].points += s.points || 0;
        // Track holes per day to avoid duplication in "all" view
        playersMap[uid].holesCompleted.add(`${dayDiff}-${s.holeId}`);
      });

      const leaderboard = Object.values(playersMap)
        .map((p: any) => {
          const gross = p.grossStrokes;
          const handicapIndex = p.user?.handicap || 0;
          const extra = p.extraStrokes || 0;
          const holesPlayed = p.holesCompleted.size;
          
          // In golf, Playing Handicap is rounded to the nearest integer.
          // For multi-round tournaments, the handicap is scaled based on holes played (e.g., 2x for 36 holes).
          const playingHandicap = Math.round(handicapIndex);
          const totalHandicap = Math.round(playingHandicap * (holesPlayed / 18));
          
          // Net = Gross - Total Handicap + Extra Strokes
          const net = gross > 0 ? (gross - totalHandicap + extra) : 0;

          return {
            ...p,
            holesCount: p.holesCompleted.size,
            netStrokes: net,
          };
        })
        .sort((a, b) => {
          // Sort: 0 strokes (haven't started) should be at the bottom
          if (a.grossStrokes === 0 && b.grossStrokes > 0) return 1;
          if (b.grossStrokes === 0 && a.grossStrokes > 0) return -1;
          if (a.grossStrokes === 0 && b.grossStrokes === 0) return 0;
          
          return a.netStrokes - b.netStrokes || a.grossStrokes - b.grossStrokes;
        });

      setLeaderboardData(leaderboard);
    } catch (err) {
      console.error("Failed to load leaderboard", err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "waitlist") {
      fetchWaitlistData();
    } else if (activeTab === "groupings") {
      loadGroupingsData();
    } else if (activeTab === "leaderboard") {
      loadLeaderboardData();
    }
  }, [activeTab, tournamentId, selectedDay, selectedLeaderboardDay, selectedTournament?.id]);

  useEffect(() => {
    const unsubscribe = subscribeAdminEvents((event) => {
      if (event.type === "users-changed") {
        reloadSingleTournament();
        if (activeTab === "players") {
          setRegistrationsInitialized(false);
        } else if (activeTab === "groupings") {
          loadGroupingsData();
        } else if (activeTab === "waitlist") {
          fetchWaitlistData();
        }
      }
    });
    return () => unsubscribe();
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
        badge: STATUS_META[t.status as TournamentStatus]?.badge ?? "bg-gray-100 text-gray-500",
        entryFee: t.entryFee ?? null,
        startDate: t.startDate,
        endDate: t.endDate ?? null,
        maxPlayers: t.maxPlayers ?? null,
        maxPlayersPerGroup: t.maxPlayersPerGroup ?? 4,
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
          badge: STATUS_META[t.status as TournamentStatus]?.badge ?? "bg-gray-100 text-gray-500",
          entryFee: t.entryFee ?? null,
          startDate: t.startDate,
          endDate: t.endDate ?? null,
          maxPlayers: t.maxPlayers ?? null,
          maxPlayersPerGroup: t.maxPlayersPerGroup ?? 4,
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
    setRegistrationsDebouncedSearch(registrationsSearch.trim());
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
  }, [selectedTournament?.id, registrationsRefreshTrigger]);

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
      excludeWaitlist: registrationsStatusFilter === "All Status" ? true : undefined,
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
    registrationsRefreshTrigger,
  ]);

  const registrationsQuery = registrationsSearch.trim().toLowerCase();
  const filteredRegistrationsAll =
    registrationsMode === "client"
      ? registrationsAll.filter((r) => {
        const query = registrationsQuery.trim().toLowerCase();
        const tokens = query.split(/[\s-]+/).filter(Boolean);
        const searchableFields = [
          r.user?.firstName,
          r.user?.lastName,
          r.user?.email,
          `${r.user?.firstName} ${r.user?.lastName}`,
          `${r.user?.lastName} ${r.user?.firstName}`
        ];
        
        const matchesSearch = tokens.length === 0 || tokens.every(token => 
          searchableFields.some(field => field?.toLowerCase().includes(token))
        );

        const matchesStatus = registrationsStatusFilter === "All Status" 
          ? (r.status !== "WAITLISTED" && r.status !== "REJECTED")
          : r.status === registrationsStatusFilter;
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

  // Waitlist Action methods
  const handleApproveWaitlist = async (regId: string) => {
    setWaitlistActionId(regId);
    try {
      await updateRegistrationStatus(regId, "APPROVED");
      toast.success("Player approved from waitlist successfully");
      setWaitlist(prev => prev.filter(item => item.id !== regId));
      await reloadSingleTournament();
      setRegistrationsRefreshTrigger(prev => prev + 1);
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
      await updateRegistrationStatus(regId, "REJECTED");
      toast.success("Player removed from waitlist");
      await fetchWaitlistData();
      await reloadSingleTournament();
      setRegistrationsRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to remove player");
    } finally {
      setWaitlistActionId(null);
    }
  };

  const filteredWaitlist = waitlist.filter(item => {
    const query = waitlistSearch.trim().toLowerCase();
    const tokens = query.split(/[\s-]+/).filter(Boolean);
    const searchableFields = [
      item.user?.firstName,
      item.user?.lastName,
      item.user?.email,
      `${item.user?.firstName} ${item.user?.lastName}`,
      `${item.user?.lastName} ${item.user?.firstName}`
    ];
    
    return tokens.length === 0 || tokens.every(token => 
      searchableFields.some(field => field?.toLowerCase().includes(token))
    );
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
      // Refresh groupings data so the newly paid player appears in the unassigned pool
      await loadGroupingsData();
      setRegistrationsRefreshTrigger(prev => prev + 1);
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
    router.push(`/organizer-admin/tournaments/${tournament.id}/edit`);
  };

  const openCancel = () => {
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
      openCancel();
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
            <p className="text-[13px] text-gray-500 mt-0.5">
              Hosted at {selectedTournament.clubName} • {selectedTournament.dates}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedTournament.statusKey === "DRAFT" && (
            <Button
              onClick={async () => {
                try {
                  setMutating(true);
                  await updateTournament(selectedTournament.id, { publishImmediately: true });
                  toast.success("Tournament published successfully!");
                  await reloadSingleTournament();
                } catch (e: any) {
                  toast.error(e.message || "Failed to publish tournament");
                } finally {
                  setMutating(false);
                }
              }}
              disabled={mutating}
              className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center gap-2 rounded-xl px-6 shadow-lg shadow-blue-100"
            >
              <Send className="w-4 h-4" />
              Publish Now
            </Button>
          )}

          <Button
            onClick={() => openEdit(selectedTournament)}
            disabled={selectedTournament.statusKey === "CANCELLED" || selectedTournament.statusKey === "COMPLETED"}
            variant="outline"
            className="h-10 border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-sm flex items-center gap-2 rounded-xl"
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
                      "w-6.5 h-6.5 rounded-full flex items-center justify-center transition-all duration-300",
                      isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm"
                        : "bg-gray-100 text-gray-400 border border-gray-200"
                    )}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
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
                                <img
                                  src={r.user?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(r.user?.email || r.id)}`}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[14px] font-bold text-gray-900 truncate">
                                    {fullName(r.user?.firstName ?? null, r.user?.lastName ?? null)}
                                  </p>
                                  <p className="text-[12px] text-gray-500 truncate mt-0.5">{r.user?.email}</p>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                  <span className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                                    (r.status === "APPROVED" && r.paymentStatus !== "PAID") ? "bg-blue-50 text-blue-700 border-blue-100" :
                                      r.status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                      r.status === "PENDING" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                                        r.status === "WAITLISTED" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                          r.status === "DISQUALIFIED" ? "bg-red-50 text-red-700 border border-red-100" :
                                            "bg-gray-50 text-gray-600 border border-gray-200"
                                  )}>
                                    {(r.status === "APPROVED" && r.paymentStatus !== "PAID") ? "PENDING" : r.status}
                                  </span>
                                  <span className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                                    isPaid ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                      "bg-gray-50 text-gray-600 border border-gray-250"
                                  )}>
                                    {r.paymentStatus}
                                  </span>

                                  {/* Gender Badge */}
                                  {r.user?.gender && (
                                    <span className={cn(
                                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border",
                                      r.user.gender.toUpperCase() === 'MALE' ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-pink-50 text-pink-700 border-pink-100"
                                    )}>
                                      {r.user.gender}
                                    </span>
                                  )}

                                  {/* Age Badge */}
                                  {r.user?.dob && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-100">
                                      {(() => {
                                        const birthDate = new Date(r.user.dob);
                                        const today = new Date();
                                        let age = today.getFullYear() - birthDate.getFullYear();
                                        const m = today.getMonth() - birthDate.getMonth();
                                        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
                                        return `${age} YRS`;
                                      })()}
                                    </span>
                                  )}

                                  {/* PH Badge */}
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    PH {r.user?.handicap ?? 0}
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
                    <EmptyState
                      title="No registrations found"
                      description="Try adjusting your filters or search query to find what you're looking for."
                    />
                  )}

                  {!registrationsLoading && registrationsFilteredTotal > 0 && (
                    <div className="pt-4 flex items-center justify-between gap-4">
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
                    <p className="text-2xl font-black text-emerald-600 leading-none">{formatWithCommas(waitlist.filter(w => w.status === "WAITLISTED").length)}</p>
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

                <div className="flex gap-2 bg-gray-50/50 p-1.5 rounded-xl w-fit border border-gray-100">
                  <button
                    onClick={() => setWaitlistFilter("PENDING")}
                    className={cn(
                      "px-4 py-2 text-[13px] font-bold rounded-lg transition-all",
                      waitlistFilter === "PENDING" ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100/50"
                    )}
                  >
                    Pending Queue
                  </button>
                  <button
                    onClick={() => setWaitlistFilter("REJECTED")}
                    className={cn(
                      "px-4 py-2 text-[13px] font-bold rounded-lg transition-all",
                      waitlistFilter === "REJECTED" ? "bg-red-50 text-red-700 shadow-sm border border-red-200" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100/50"
                    )}
                  >
                    Rejected Players
                  </button>
                </div>

                <div className="border border-gray-150 rounded-2xl overflow-hidden bg-white shadow-sm">
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
                        filteredWaitlist
                          .filter(w => waitlistFilter === "PENDING" ? w.status === "WAITLISTED" : w.status === "REJECTED")
                          .map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/30 transition-colors group">
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-emerald-50 border border-emerald-100 flex-shrink-0 relative">
                                  <img 
                                    src={item.user?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(item.user?.email || item.id)}`} 
                                    alt="Avatar" 
                                    className="w-full h-full object-cover" 
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-[14px] font-bold text-gray-900 leading-tight">
                                      {fullName(item.user?.firstName ?? null, item.user?.lastName ?? null)}
                                    </p>
                                    {item.status === "REJECTED" && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-600 uppercase tracking-wider">Rejected</span>
                                    )}
                                  </div>
                                  <p className="text-[12px] text-gray-500 mt-0.5">{item.user?.email}</p>
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
                                {item.status !== "REJECTED" && (
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
                                )}
                                <Button
                                  onClick={() => handleRemoveWaitlist(item.id)}
                                  disabled={waitlistActionId === item.id || item.status === "REJECTED"}
                                  variant="ghost"
                                  className="h-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg text-[11px] font-bold gap-1 px-2.5 disabled:opacity-50"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                  {item.status === "REJECTED" ? "Rejected" : "Reject"}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-6 py-20 text-center">
                            <EmptyState
                              icon={Clock}
                              title="Waitlist is empty"
                              description="No players currently in the queue for this tournament."
                            />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-4">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <p className="text-[12px] text-amber-700 leading-relaxed font-medium">
                    <strong>Important Note:</strong> Any rejected player cannot be approved again for this tournament. Please be absolutely certain before you reject a player from the waitlist queue.
                  </p>
                </div>
              </div>
            )}

            {/* TABS 1: Groupings & Tee Times */}
            {activeTab === "groupings" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                {groupingsLoading ? (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <div className="flex gap-2">
                        {[1, 2, 3].map(i => <div key={i} className="w-24 h-10 bg-gray-100 animate-pulse rounded-xl" />)}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-gray-50 animate-pulse rounded-2xl border border-gray-100" />)}
                    </div>
                  </div>
                ) : (
                  <>
                {/* Day Selection Tabs (Styled like AccoReg GenderTabs) */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-1 bg-gray-100/50 p-1.5 rounded-2xl border border-gray-200">
                    {Array.from({ length: getTournamentDays() }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedDay(i + 1)}
                        className={cn(
                          "px-8 py-2.5 text-[12px] font-bold rounded-xl transition-all duration-300",
                          selectedDay === i + 1
                            ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200"
                            : "text-gray-500 hover:text-gray-900 hover:bg-white"
                        )}
                      >
                        DAY {i + 1}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 flex items-center gap-2 shadow-sm">
                      <Calendar className="w-3.5 h-3.5" />
                      {selectedDay} of {getTournamentDays()} Days Active
                    </span>
                  </div>
                </div>

                {/* Groupings Dashboard Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pt-2">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-gray-900">Manage Groupings</h3>
                    <p className="text-[13px] text-gray-500">Pair players into groups and assign tee times for Day {selectedDay}.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative inline-block">
                      <Button
                        disabled={groupingsGenerating || groupingsLoading || !groupingsData?.unassigned.length}
                        className="bg-[#10b981] hover:bg-emerald-600 text-white rounded-xl h-10 px-4 text-[12px] font-bold gap-2 shadow-sm border border-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {groupingsGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        Grouping Rules
                        <ChevronDown className="w-3.5 h-3.5 ml-1" />
                      </Button>
                      <select
                        disabled={groupingsGenerating || groupingsLoading || !groupingsData?.unassigned.length}
                        onChange={(e) => handleGenerateGroupings(e.target.value as any)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        title="Select Grouping Rule"
                      >
                        <option value="">Select Rule...</option>
                        <option value="RANDOM">Random Grouping</option>
                        <option value="CATEGORY_RANDOM">Category Balanced</option>
                        <option value="LEADERBOARD_REVERSE" disabled={selectedDay === 1}>Leaderboard (Reverse / FILO)</option>
                        <option value="LEADERBOARD_DIRECT" disabled={selectedDay === 1}>Leaderboard (Direct)</option>
                      </select>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleClearGroupings}
                      disabled={groupingsLoading || !groupingsData?.groups.length}
                      className="h-10 px-4 text-[12px] font-bold rounded-xl border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all gap-2"
                    >
                      <RefreshCcw className="w-3.5 h-3.5" />
                      Reset All
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search groups or players..."
                      value={groupingsSearch}
                      onChange={(e) => {
                        setGroupingsSearch(e.target.value);
                        setGroupsPage(1);
                        setUnassignedPage(1);
                      }}
                      className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:bg-white rounded-xl text-[14px]"
                    />
                  </div>
                </div>

                {/* Sub-tabs for Unassigned/Grouped */}
                <div className="flex gap-2 mb-4 bg-gray-50/50 p-1.5 rounded-xl w-fit border border-gray-100">
                  <button
                    onClick={() => {
                      setGroupingsSubTab("unassigned");
                      setUnassignedPage(1);
                    }}
                    className={cn(
                      "px-4 py-2 text-[13px] font-bold rounded-lg transition-all flex items-center",
                      groupingsSubTab === "unassigned"
                        ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200"
                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-100/50"
                    )}
                  >
                    Unassigned Pool
                    <Badge variant="outline" className={cn(
                      "ml-2 font-black px-1.5 py-0 transition-all",
                      groupingsSubTab === "unassigned" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-400 border-gray-200"
                    )}>
                      {groupingsData?.unassigned.length || 0}
                    </Badge>
                  </button>
                  <button
                    onClick={() => {
                      setGroupingsSubTab("grouped");
                      setGroupsPage(1);
                    }}
                    className={cn(
                      "px-4 py-2 text-[13px] font-bold rounded-lg transition-all flex items-center",
                      groupingsSubTab === "grouped"
                        ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200"
                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-100/50"
                    )}
                  >
                    Grouped Players
                    <Badge variant="outline" className={cn(
                      "ml-2 font-black px-1.5 py-0 transition-all",
                      groupingsSubTab === "grouped" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-400 border-gray-200"
                    )}>
                      {groupingsData?.groups.reduce((acc, g) => acc + g.registrations.length, 0) || 0}
                    </Badge>
                  </button>
                </div>

                {groupingsData && (groupingsData.groups.length > 0 || groupingsData.unassigned.length > 0) ? (
                  <div className="space-y-6">
                    {/* Groups Section */}
                        {groupingsSubTab === "grouped" && (
                          <div className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                              {groupingsData.groups
                                .filter(group => {
                                  const query = groupingsSearch.trim().toLowerCase();
                                  if (!query) return true;
                                  const tokens = query.split(/[\s-]+/).filter(Boolean);
                                  
                                  const matchesGroupName = tokens.every(token => 
                                    group.name.toLowerCase().includes(token)
                                  );

                                  const matchesPlayer = group.registrations.some(p => {
                                    const searchableFields = [
                                      p.user?.firstName,
                                      p.user?.lastName,
                                      p.user?.email,
                                      `${p.user?.firstName} ${p.user?.lastName}`,
                                      `${p.user?.lastName} ${p.user?.firstName}`
                                    ];
                                    return tokens.every(token => 
                                      searchableFields.some(field => field?.toLowerCase().includes(token))
                                    );
                                  });

                                  return matchesGroupName || matchesPlayer;
                                })
                                .slice((groupsPage - 1) * groupsPerPage, groupsPage * groupsPerPage)
                                .map((group: GroupingItem) => {
                              const occupancy = group.registrations.length;
                                  const capacity = selectedTournament?.maxPlayersPerGroup || 4;
                                  const isFull = occupancy >= capacity;
                              
                              return (
                                <div
                                  key={group.id}
                                  className={cn(
                                    "group bg-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col shadow-sm",
                                    isFull ? "border-emerald-100 bg-emerald-50/5" : "border-gray-150 hover:border-emerald-200 hover:shadow-md"
                                  )}
                                >
                                  {/* Group Header */}
                                  <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0 border",
                                        isFull ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-white border-gray-150 text-gray-400"
                                      )}>
                                        <Flag className="w-5 h-5" />
                                      </div>
                                      <div className="min-w-0">
                                        {editingGroupNameId === group.id ? (
                                          <Input
                                            autoFocus
                                            value={editingGroupNameValue}
                                            onChange={(e) => setEditingGroupNameValue(e.target.value)}
                                            onBlur={() => handleUpdateGroupDetails(group.id, { name: editingGroupNameValue })}
                                            className="h-7 py-0 px-2 text-[13px] font-bold rounded-lg border-emerald-500"
                                          />
                                        ) : (
                                          <h4
                                            onClick={() => { setEditingGroupNameId(group.id); setEditingGroupNameValue(group.name); }}
                                            className="text-[14px] font-bold text-gray-900 truncate cursor-pointer hover:text-emerald-600"
                                          >
                                            {group.name}
                                          </h4>
                                        )}
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          <Clock className="w-3 h-3 text-gray-400" />
                                          <span className="text-[11px] font-bold text-gray-400 uppercase">{group.startTime || "TBD"}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-[12px] font-black text-gray-900">{occupancy}/{capacity}</div>
                                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Group Size</div>
                                    </div>
                                  </div>

                                  {/* Progress Bar */}
                                  <div className="h-1 w-full bg-gray-100">
                                    <div 
                                      className={cn("h-full transition-all duration-500", isFull ? "bg-emerald-500" : "bg-blue-500")}
                                      style={{ width: `${(occupancy / capacity) * 100}%` }}
                                    />
                                  </div>

                                  {/* Group Players */}
                                  <div className="p-3 flex-1 space-y-2">
                                    {group.registrations.map((player: GroupingPlayer) => (
                                      <div
                                        key={player.id}
                                        className="flex items-center justify-between p-3 rounded-2xl bg-[#fafafa] border border-[#efefef] hover:border-emerald-200 transition-all shadow-sm hover:shadow-md group/player"
                                      >
                                        <div className="flex items-center gap-3 min-w-0">
                                          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-100 bg-white shadow-sm">
                                            <img
                                              src={player.user?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.user?.email || player.id)}`}
                                              alt=""
                                              className="w-full h-full object-cover"
                                            />
                                          </div>
                                          <div className="min-w-0">
                                            <NextLink href="#" className="block">
                                              <div className="text-[13px] text-gray-800 font-bold truncate hover:text-emerald-600 transition-colors">
                                                {player.user?.firstName} {player.user?.lastName}
                                              </div>
                                            </NextLink>
                                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                              {/* Gender Badge */}
                                              {player.user?.gender && (
                                                <span className={cn(
                                                  "text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tight border",
                                                  player.user.gender.toUpperCase() === 'MALE' ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-pink-50 text-pink-700 border-pink-100"
                                                )}>
                                                  {player.user.gender}
                                                </span>
                                              )}

                                              {/* Age Badge */}
                                              {player.user?.dob && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tight bg-orange-50 text-orange-700 border border-orange-100">
                                                  {(() => {
                                                    const birthDate = new Date(player.user.dob);
                                                    const today = new Date();
                                                    let age = today.getFullYear() - birthDate.getFullYear();
                                                    const m = today.getMonth() - birthDate.getMonth();
                                                    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
                                                    return `${age} YRS`;
                                                  })()}
                                                </span>
                                              )}

                                              {/* PH Badge */}
                                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tight bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                PH {player.user?.handicap ?? 0}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        <select
                                          value={group.id}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            handleMovePlayer(player.id, val === "unassigned" ? null : val);
                                          }}
                                          className="bg-emerald-50 text-emerald-600 border-none text-[10px] font-black rounded-lg px-2 py-1 cursor-pointer focus:ring-0 opacity-0 group-hover/player:opacity-100 transition-opacity"
                                        >
                                          <option value={group.id}>Move To...</option>
                                          <option value="unassigned">Unassign</option>
                                          {groupingsData.groups.map((g: GroupingItem) => g.id !== group.id && <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </select>
                                      </div>
                                    ))}
                                    {Array.from({ length: Math.max(0, capacity - occupancy) }).map((_, i) => (
                                          <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-dashed border-gray-150/50 opacity-30">
                                            <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-100" />
                                            <div className="text-[11px] font-bold text-gray-300">Available Space</div>
                                          </div>
                                        ))}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                        {groupingsData.groups.length > groupsPerPage && (
                          <div className="pt-4 flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100">
                            <p className="text-[13px] text-gray-500 font-medium">
                              Showing {(groupsPage - 1) * groupsPerPage + 1} to {Math.min(groupsPage * groupsPerPage, groupingsData.groups.length)} of {groupingsData.groups.length} groups
                            </p>
                            <Pagination
                              currentPage={groupsPage}
                              totalPages={Math.ceil(groupingsData.groups.length / groupsPerPage)}
                              onPageChange={setGroupsPage}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Unassigned Pool Section */}
                    {groupingsSubTab === "unassigned" && (
                      <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                          <h4 className="text-[13px] font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-500" />
                            Unassigned Participants
                          </h4>
                          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 font-black px-2 py-0.5">
                            {groupingsData.unassigned.length}
                          </Badge>
                        </div>
                        <div className="p-6">
                          
                          {(() => {
                            const filtered = groupingsData.unassigned.filter(p => {
                              const query = groupingsSearch.trim().toLowerCase();
                              if (!query) return true;
                              const tokens = query.split(/[\s-]+/).filter(Boolean);
                              const searchableFields = [
                                p.user?.firstName,
                                p.user?.lastName,
                                p.user?.email,
                                `${p.user?.firstName} ${p.user?.lastName}`,
                                `${p.user?.lastName} ${p.user?.firstName}`
                              ];
                              
                              return tokens.every(token => 
                                searchableFields.some(field => field?.toLowerCase().includes(token))
                              );
                            });

                            const paginated = filtered.slice((unassignedPage - 1) * unassignedPerPage, unassignedPage * unassignedPerPage);

                            return (
                              <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {paginated.length > 0 ? (
                                    paginated.map((player: GroupingPlayer) => (
                                      <div
                                        key={player.id}
                                        className="flex items-center justify-between p-3 rounded-2xl bg-[#fafafa] border border-[#efefef] hover:border-emerald-200 transition-all shadow-sm hover:shadow-md"
                                      >
                                        <div className="flex items-center gap-3 min-w-0">
                                          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-100">
                                            <img
                                              src={player.user?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.user?.email || player.id)}`}
                                              alt=""
                                              className="w-full h-full object-cover"
                                            />
                                          </div>
                                          <div className="min-w-0">
                                            <NextLink href="#" className="block">
                                              <div className="text-[13px] text-gray-800 font-bold truncate hover:text-emerald-600 transition-colors">
                                                {player.user?.firstName} {player.user?.lastName}
                                              </div>
                                            </NextLink>
                                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                              {/* Gender Badge */}
                                              {player.user?.gender && (
                                                <span className={cn(
                                                  "text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tight border",
                                                  player.user.gender.toUpperCase() === 'MALE' ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-pink-50 text-pink-700 border-pink-100"
                                                )}>
                                                  {player.user.gender}
                                                </span>
                                              )}
                                              {/* Category Badge */}
                                              {player.user?.handicap !== undefined && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tight bg-purple-50 text-purple-700 border border-purple-100">
                                                  {getGolfCategory(player.user.handicap)}
                                                </span>
                                              )}

                                              {/* Age Badge */}
                                              {player.user?.dob && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tight bg-orange-50 text-orange-700 border border-orange-100">
                                                  {(() => {
                                                    const birthDate = new Date(player.user.dob);
                                                    const today = new Date();
                                                    let age = today.getFullYear() - birthDate.getFullYear();
                                                    const m = today.getMonth() - birthDate.getMonth();
                                                    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
                                                    return `${age} YRS`;
                                                  })()}
                                                </span>
                                              )}

                                              {/* PH Badge */}
                                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tight bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                PH {player.user?.handicap ?? 0}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        </div>
                                    ))
                                  ) : (
                                        <div className="col-span-full py-12">
                                          <EmptyState
                                            variant="minimal"
                                            title="No players found"
                                            description="No unassigned players matching your search query."
                                          />
                                        </div>
                                      )}
                                </div>
                                {filtered.length > unassignedPerPage && (
                                  <div className="pt-4 flex items-center justify-between border-t border-gray-100">
                                    <p className="text-[13px] text-gray-500 font-medium">
                                      Showing {(unassignedPage - 1) * unassignedPerPage + 1} to {Math.min(unassignedPage * unassignedPerPage, filtered.length)} of {filtered.length} players
                                    </p>
                                    <Pagination
                                      currentPage={unassignedPage}
                                      totalPages={Math.ceil(filtered.length / unassignedPerPage)}
                                      onPageChange={setUnassignedPage}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                    ) : (
                  <EmptyState
                    icon={Users}
                    title="No Allocation Data"
                    description={`Use start random grouping to distribute players into groups for Day ${selectedDay}.`}
                    action={
                      <div className="relative inline-block">
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-12 px-8 text-[14px] font-bold shadow-lg flex items-center gap-2"
                        >
                          Grouping Rules
                          <ChevronDown className="w-4 h-4 ml-1" />
                        </Button>
                        <select
                          onChange={(e) => handleGenerateGroupings(e.target.value as any)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          title="Select Grouping Rule"
                        >
                          <option value="">Select Rule...</option>
                          <option value="RANDOM">Random Grouping</option>
                          <option value="CATEGORY_RANDOM">Category Balanced</option>
                          <option value="LEADERBOARD_REVERSE" disabled={selectedDay === 1}>Leaderboard (Reverse / FILO)</option>
                          <option value="LEADERBOARD_DIRECT" disabled={selectedDay === 1}>Leaderboard (Direct)</option>
                        </select>
                      </div>
                    }
                  />
                )}
                
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-4 mt-6">
                  <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <p className="text-[12px] text-emerald-700 leading-relaxed font-medium">
                    <strong>Grouping Rules Guide:</strong> <strong>Random:</strong> Shuffles purely by chance. <strong>Category Balanced:</strong> Mixes handicaps evenly. <strong>Reverse:</strong> FILO - Highest scores first, leaders last. <strong>Direct:</strong> Tournament leaders tee off first.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

            {/* TABS 5: Leaderboard */}
            {activeTab === "leaderboard" && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {/* Day Filtering for Leaderboard */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-1 bg-gray-100/50 p-1.5 rounded-2xl border border-gray-200">
                    <button
                      onClick={() => setSelectedLeaderboardDay("all")}
                      className={cn(
                        "px-8 py-2.5 text-[12px] font-bold rounded-xl transition-all duration-300",
                        selectedLeaderboardDay === "all"
                          ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200"
                          : "text-gray-500 hover:text-gray-900 hover:bg-white"
                      )}
                    >
                      ALL DAYS
                    </button>
                    {Array.from({ length: getTournamentDays() }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedLeaderboardDay(i + 1)}
                        className={cn(
                          "px-8 py-2.5 text-[12px] font-bold rounded-xl transition-all duration-300",
                          selectedLeaderboardDay === i + 1
                            ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200"
                            : "text-gray-500 hover:text-gray-900 hover:bg-white"
                        )}
                      >
                        DAY {i + 1}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 flex items-center gap-2 shadow-sm">
                      <Activity className="w-3.5 h-3.5" />
                      Viewing: {selectedLeaderboardDay === "all" ? "Tournament Total" : `Day ${selectedLeaderboardDay} Results`}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      Live Standings
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100 uppercase">
                        Live
                      </span>
                    </h3>
                    <p className="text-[13px] text-gray-500">Real-time ranking based on {selectedLeaderboardDay === "all" ? "all played holes" : `holes played on Day ${selectedLeaderboardDay}`}.</p>
                  </div>
                </div>

                {leaderboardLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    <p className="text-sm text-gray-500 font-medium">Updating rankings...</p>
                  </div>
                ) : leaderboardData.length > 0 ? (
                  <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider w-16 text-center">Pos</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Player</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Division</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Holes</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Gross</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">HCP</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-emerald-600 uppercase tracking-wider text-center">Net</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {leaderboardData.map((entry, index) => {
                            const rank = index + 1;
                            return (
                              <tr key={entry.user.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4 text-center">
                                  <div className="flex items-center justify-center">
                                    {rank === 1 ? (
                                      <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center border border-yellow-200 shadow-sm">
                                        <Trophy className="w-4 h-4 text-yellow-600" />
                                      </div>
                                    ) : rank === 2 ? (
                                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200 shadow-sm">
                                        <Award className="w-4 h-4 text-slate-400" />
                                      </div>
                                    ) : rank === 3 ? (
                                      <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center border border-orange-200 shadow-sm">
                                        <Award className="w-4 h-4 text-orange-600" />
                                      </div>
                                    ) : (
                                      <span className="text-[13px] font-bold text-gray-400">{rank}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-100 bg-white shadow-sm shrink-0">
                                      <img
                                        src={entry.user.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(entry.user.email)}`}
                                        className="w-full h-full object-cover"
                                        alt=""
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-[13px] font-bold text-gray-900 truncate">
                                        {entry.user.firstName} {entry.user.lastName}
                                      </div>
                                      <div className="text-[10px] text-gray-400 font-medium truncate">
                                        {entry.user.email}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="text-[11px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100 uppercase">
                                    {entry.user?.division || "Open"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="space-y-1.5">
                                    <span className="text-[12px] font-bold text-gray-600">
                                      {entry.grossStrokes > 0 ? `${entry.holesCount}/${selectedLeaderboardDay === "all" ? 18 * getTournamentDays() : 18}` : "-"}
                                    </span>
                                    {entry.grossStrokes > 0 && (
                                      <div className="w-20 mx-auto h-1 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                                          style={{ width: `${(entry.holesCount / (selectedLeaderboardDay === "all" ? 18 * getTournamentDays() : 18)) * 100}%` }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="text-[13px] font-bold text-gray-700">{entry.grossStrokes > 0 ? entry.grossStrokes : "-"}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="text-[11px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                    {entry.user.handicap || 0}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="text-[15px] font-black text-emerald-600">
                                    {entry.grossStrokes > 0 ? (entry.netStrokes > 0 ? `+${entry.netStrokes}` : entry.netStrokes === 0 ? "E" : entry.netStrokes) : "-"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {entry.grossStrokes > 0 ? (
                                    entry.holesCount === (selectedLeaderboardDay === "all" ? 18 * getTournamentDays() : 18) ? (
                                      <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-wider">Finished</span>
                                    ) : (
                                      <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">Live</span>
                                    )
                                  ) : (
                                    <span className="text-[10px] font-bold bg-gray-50 text-gray-400 px-2 py-0.5 rounded-full uppercase tracking-wider">Not Started</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                      <div className="flex flex-col items-center justify-center gap-6 py-20 text-center bg-white border border-dashed border-gray-200 rounded-3xl">
                    <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm">
                      <Trophy className="w-10 h-10 text-gray-200" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-gray-900">Leaderboard Empty</h3>
                      <p className="text-[14px] text-gray-500 font-normal max-w-sm">No scores have been recorded for {selectedLeaderboardDay === "all" ? "any day of this tournament" : `Day ${selectedLeaderboardDay}`} yet.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TABS 6: Overview */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Statistics Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 flex flex-col justify-between">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Registrations</p>
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

                  <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 flex flex-col justify-between">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Entry Fee</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{formatNaira(selectedTournament.entryFee)}</p>
                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">Per Registration</p>
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
                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">Player Limit</p>
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
                        <span className="text-[15px] font-extrabold text-gray-800">{courseDetails?.holes || "—"} Holes</span>
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

                  {/* Scoring Rules Box */}
                  <div className="p-6 rounded-2xl border border-gray-150 bg-white space-y-6">
                    <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-blue-50 flex items-center justify-center border border-blue-100 flex-shrink-0 shadow-sm text-blue-600">
                        <Activity className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-[16px] font-bold text-gray-900 leading-tight">
                          Scoring Rules
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Configuration for format and scoring verification
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50/60 rounded-xl border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Format</span>
                        <span className="text-[14px] font-bold text-gray-800">{(selectedTournament as any).format?.replace('_', ' ') || "STROKE PLAY"}</span>
                      </div>
                      <div className="p-3 bg-gray-50/60 rounded-xl border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Scoring Type</span>
                        <span className="text-[14px] font-bold text-gray-800">{(selectedTournament as any).scoringType || "GROSS"}</span>
                      </div>
                      <div className="p-3 bg-gray-50/60 rounded-xl border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Live Scoring</span>
                        <span className={cn(
                          "text-[12px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block",
                          (selectedTournament as any).enableLiveScoring ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-gray-100 text-gray-500 border border-gray-200"
                        )}>
                          {(selectedTournament as any).enableLiveScoring ? "ENABLED" : "DISABLED"}
                        </span>
                      </div>
                      <div className="p-3 bg-gray-50/60 rounded-xl border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Marker Verification</span>
                        <span className={cn(
                          "text-[12px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block",
                          (selectedTournament as any).requireMarkerVerification ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-gray-100 text-gray-500 border border-gray-200"
                        )}>
                          {(selectedTournament as any).requireMarkerVerification ? "REQUIRED" : "NOT REQUIRED"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Organiser Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 rounded-2xl border border-gray-150 bg-white space-y-6">
                    <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200 flex-shrink-0 shadow-sm">
                        {clubDetails?.logo ? (
                          <img src={clubDetails.logo} className="w-full h-full object-cover" />
                        ) : (
                          <Trophy className="w-7 h-7 text-emerald-600" />
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
                <Plus className="w-4 h-4 text-gray-450" /> +{delta} {delta === 1 ? "stroke" : "strokes"}
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
          <p className="text-gray-500 max-w-sm">
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
            <p className="text-gray-500 max-w-sm">
              Deleting this tournament will permanently erase all associated rounds, leaderboards, player registrations, and payment records. This action cannot be undone.
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
          <p className="text-gray-500 max-w-sm">
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
              className="rounded-lg font-bold px-8 text-white border bg-red-500 hover:bg-red-600 border-red-650/30"
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
          <p className="text-gray-500 max-w-sm">
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
              className="rounded-lg font-bold px-8 text-white border bg-emerald-500 hover:bg-emerald-600 border-emerald-600/30"
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
          <p className="text-gray-500 max-w-sm">
            Are you sure you want to re-enable <strong>{actionRegistration ? `${actionRegistration.user?.firstName} ${actionRegistration.user?.lastName}` : "this player"}</strong>?
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={isResetGroupingsModalOpen}
        onClose={() => setIsResetGroupingsModalOpen(false)}
        title="Reset All Groupings?"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsResetGroupingsModalOpen(false)} className="rounded-lg font-bold">
              Cancel
            </Button>
            <Button
              className="rounded-lg font-bold px-8 text-white border bg-red-500 hover:bg-red-600 border-red-600/30"
              onClick={confirmResetGroupings}
            >
              Yes, Reset All
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-red-50 text-red-500 border border-red-100">
            <RefreshCcw className="h-10 w-10 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <h4 className="text-xl font-bold text-gray-900 mb-2">Reset Groupings?</h4>
          <p className="text-gray-500 max-w-sm">
            Are you sure you want to reset all groupings for Day {selectedDay}? This will delete all groups and mark all players as unassigned.
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default function ViewTournamentPage() {
  return (
    <Suspense fallback={
      <div className="space-y-8 w-full max-w-full px-4 py-8 font-sans">
        <div className="flex flex-col gap-6 animate-pulse">
          <div className="h-5 w-36 bg-gray-100 rounded-md" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-20 w-20 bg-gray-100 rounded-3xl" />
              <div className="space-y-3">
                <div className="h-8 w-72 bg-gray-100 rounded-lg" />
                <div className="h-4 w-80 bg-gray-100 rounded-md" />
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
