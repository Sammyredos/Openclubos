"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
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
  Sparkles,
  RefreshCcw,
  Home,
  Send,
  ChevronDown,
  Mail,
  ArrowUpDown,
  Layers,
  Info,
  Dices,
  Scale,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { FilterSelect } from "@/components/ui/filter-select";
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
  publishGroupingsEmail,
  applyCut,
  type GroupingData,
  type GroupingItem,
  type GroupingPlayer,
} from "@/lib/api/tournaments";
import { getTournamentScores } from "@/lib/api/scores";
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
  requiresPayment: boolean;
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
  scoringType: "NET" | "GROSS";
  enableCut?: boolean;
  cutAfterRound?: number;
  lockedGroupingsDays: number[];
  type?: string;
  minHandicap?: number;
  maxHandicap?: number;
};

const STATUS_META: Record<TournamentStatus, { label: string; color: string; badge: string }> = {
  DRAFT: { label: "Draft", color: "#94a3b8", badge: "bg-slate-50 text-gray-600" },
  REGISTRATION_OPEN: { label: "Upcoming", color: "#15803D", badge: "bg-emerald-50 text-openclub-800 border border-emerald-100" },
  ONGOING: { label: "Ongoing", color: "#3b82f6", badge: "bg-blue-50 text-blue-600 border border-blue-100" },
  COMPLETED: { label: "Completed", color: "#8b5cf6", badge: "bg-violet-50 text-violet-600 border border-violet-100" },
  CANCELLED: { label: "Cancelled", color: "#f43f5e", badge: "bg-rose-50 text-rose-600 border border-rose-100" },
};

const VISIBILITY_META: Record<"PUBLIC" | "PRIVATE" | "INVITE_ONLY", { label: string; badge: string; icon: any }> = {
  PUBLIC: { label: "Public", badge: "bg-emerald-50 text-openclub-800", icon: Globe },
  PRIVATE: { label: "Private", badge: "bg-gray-100 text-gray-600", icon: Eye },
  INVITE_ONLY: { label: "Invite Only/Closed Tournament", badge: "bg-amber-50 text-amber-600", icon: Shield },
};

const TABS = [
  { id: "players", label: "Registered Players", icon: Users },
  { id: "register", label: "Register a Player", icon: UserPlus },
  { id: "waitlist", label: "Waitlisted Players", icon: Clock },
  { id: "groupings", label: "Flights & Tee Times", icon: Calendar },
  { id: "penalize", label: "Penalize a Player", icon: AlertTriangle },
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
  const registrationsPerPage = 6;
  const [registrationsSearch, setRegistrationsSearch] = useState("");
  const [registrationsDebouncedSearch, setRegistrationsDebouncedSearch] = useState("");
  const [registrationsStatusFilter, setRegistrationsStatusFilter] = useState<
    "All Status" | "PENDING" | "APPROVED" | "REJECTED" | "WAITLISTED" | "DISQUALIFIED"
  >("All Status");
  const [registrationsPaymentFilter, setRegistrationsPaymentFilter] = useState<"All Payments" | "PAID" | "UNPAID" | "REFUNDED">("All Payments");
  const [registrationsDisqualifiedFilter, setRegistrationsDisqualifiedFilter] = useState<
    "All Players" | "Enabled Players" | "Disqualified Players"
  >("All Players");
  const [penalizeFilter, setPenalizeFilter] = useState<"APPROVED" | "DISQUALIFIED">("APPROVED");
  const [penalizeStrokesFilter, setPenalizeStrokesFilter] = useState<"ALL" | "WITH_STROKES">("ALL");
  const [registrationsRefreshTrigger, setRegistrationsRefreshTrigger] = useState(0);

  const [registrationActionId, setRegistrationActionId] = useState<string | null>(null);
  const [strokeModalRegistration, setStrokeModalRegistration] = useState<RegistrationListItem | null>(null);
  const [strokeModalAction, setStrokeModalAction] = useState<"ADD_1" | "ADD_2" | "CLEAR" | null>(null);

  const openStrokeModal = (r: RegistrationListItem, action: "ADD_1" | "ADD_2" | "CLEAR") => {
    setStrokeModalRegistration(r);
    setStrokeModalAction(action);
  };

  const confirmStrokeAction = () => {
    if (!strokeModalRegistration || !strokeModalAction) return;
    if (strokeModalAction === "ADD_1") addTournamentRegistrationStrokes(strokeModalRegistration, 1);
    if (strokeModalAction === "ADD_2") addTournamentRegistrationStrokes(strokeModalRegistration, 2);
    if (strokeModalAction === "CLEAR") clearTournamentRegistrationStrokes(strokeModalRegistration);
    setStrokeModalRegistration(null);
    setStrokeModalAction(null);
  };

  // Manual register options
  const [registerPlayerSearch, setRegisterPlayerSearch] = useState("");
  const [registerPlayerResults, setRegisterPlayerResults] = useState<any[]>([]);
  const [isSearchingPlayers, setIsSearchingPlayers] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [manualPaymentType, setManualPaymentType] = useState<"UNPAID" | "CASH">("UNPAID");
  const [registeredUserIdsForSearch, setRegisteredUserIdsForSearch] = useState<string[]>([]);
  const [newlyRegisteredUserIds, setNewlyRegisteredUserIds] = useState<string[]>([]);

  const [isDisqualifyModalOpen, setIsDisqualifyModalOpen] = useState(false);
  const [isRemovePlayerModalOpen, setIsRemovePlayerModalOpen] = useState(false);
  const [isEnablePlayerModalOpen, setIsEnablePlayerModalOpen] = useState(false);
  const [isDayLockModalOpen, setIsDayLockModalOpen] = useState(false);
  const [attemptedDayIndex, setAttemptedDayIndex] = useState<number | null>(null);
  const [pendingGroupingRule, setPendingGroupingRule] = useState<any>(null);
  const [isUngroupedPlayersModalOpen, setIsUngroupedPlayersModalOpen] = useState(false);
  const [isCheckingPreviousDay, setIsCheckingPreviousDay] = useState(false);
  const [actionRegistration, setActionRegistration] = useState<RegistrationListItem | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Waitlist Logic
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlist, setWaitlist] = useState<RegistrationListItem[]>([]);
  const [waitlistSearch, setWaitlistSearch] = useState("");
  const [waitlistDebouncedSearch, setWaitlistDebouncedSearch] = useState("");
  const [waitlistPage, setWaitlistPage] = useState(1);
  const [waitlistTotal, setWaitlistTotal] = useState(0);
  const waitlistPerPage = 6;
  const [waitlistActionId, setWaitlistActionId] = useState<string | null>(null);
  const [waitlistFilter, setWaitlistFilter] = useState<"PENDING" | "REJECTED">("PENDING");

  // Waitlist Multi-Select and Modals
  const [selectedWaitlistIds, setSelectedWaitlistIds] = useState<string[]>([]);
  const [isApproveWaitlistModalOpen, setIsApproveWaitlistModalOpen] = useState(false);
  const [isRemoveWaitlistModalOpen, setIsRemoveWaitlistModalOpen] = useState(false);

  // Groupings (Tee Times) Management States
  const [groupingsData, setGroupingsData] = useState<GroupingData | null>(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [groupingsSubTab, setGroupingsSubTab] = useState<"unassigned" | "grouped">("unassigned");
  const [groupingsLoading, setGroupingsLoading] = useState(false);
  const [groupingsGenerating, setGroupingsGenerating] = useState(false);
  const [isPublishEmailModalOpen, setIsPublishEmailModalOpen] = useState(false);
  const [editingGroupTimeId, setEditingGroupTimeId] = useState<string | null>(null);
  const [editingGroupTimeValue, setEditingGroupTimeValue] = useState("");
  const [editingGroupNameId, setEditingGroupNameId] = useState<string | null>(null);
  const [editingGroupNameValue, setEditingGroupNameValue] = useState("");
  const [isGroupingRulesModalOpen, setIsGroupingRulesModalOpen] = useState(false);
  // Groupings Search/Filter
  const [publishClickCount, setPublishClickCount] = useState(0);
  const [justGrouped, setJustGrouped] = useState(false);
  const [groupingsSearch, setGroupingsSearch] = useState("");
  const [groupsSearch, setGroupsSearch] = useState("");
  const [groupingsFilter, setGroupingsFilter] = useState<"ALL" | "PAID" | "UNPAID">("ALL");
  const [unassignedPage, setUnassignedPage] = useState(1);
  const [groupsPage, setGroupsPage] = useState(1);
  const unassignedPerPage = 9;
  const groupsPerPage = 3;

  // Leaderboard States
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [selectedLeaderboardDay, setSelectedLeaderboardDay] = useState<number | "all">("all");
  const [leaderboardSortBy, setLeaderboardSortBy] = useState<"NET" | "GROSS">("NET");
  const [leaderboardCategoryFilter, setLeaderboardCategoryFilter] = useState<string>("ALL");
  const [leaderboardGenderFilter, setLeaderboardGenderFilter] = useState<string>("ALL");
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const [leaderboardSearch, setLeaderboardSearch] = useState("");
  const leaderboardPerPage = 10;
  const [pendingWaitlistTotal, setPendingWaitlistTotal] = useState(0);

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
      const skip = (waitlistPage - 1) * waitlistPerPage;
      const { items, total } = await getRegistrations({
        tournamentId,
        status: waitlistFilter === "PENDING" ? "WAITLISTED" : "REJECTED",
        q: waitlistDebouncedSearch || undefined,
        skip,
        take: waitlistPerPage,
      });
      setWaitlist(items || []);
      setWaitlistTotal(typeof total === "number" ? total : 0);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch waitlist queue");
    } finally {
      setWaitlistLoading(false);
    }
  };

  const fetchPendingWaitlistCount = async () => {
    if (!tournamentId) return;
    try {
      const { total } = await getRegistrations({
        tournamentId,
        status: "WAITLISTED",
        take: 1,
      });
      setPendingWaitlistTotal(typeof total === "number" ? total : 0);
    } catch (err) {
      console.error(err);
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

  const handlePublishGroupingsEmail = () => {
    if (!tournamentId || !groupingsData) return;

    if (groupingsData.groups.length === 0) {
      toast.error("There are no generated groupings to publish.");
      return;
    }

    setIsPublishEmailModalOpen(true);
  };

  const confirmPublishGroupingsEmail = async () => {
    if (!tournamentId || !groupingsData) return;
    setGroupingsGenerating(true);
    try {
      const res = await publishGroupingsEmail(tournamentId, selectedDay, groupingsData);
      setPublishClickCount(c => c + 1);
      toast.success(res.message || "Groupings publication emails queued successfully");
      setIsPublishEmailModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to publish groupings via email");
    } finally {
      setGroupingsGenerating(false);
    }
  };

  const handleGenerateGroupings = async (rule: "RANDOM" | "LEADERBOARD_REVERSE_GROSS" | "LEADERBOARD_REVERSE_NET" | "LEADERBOARD_DIRECT_GROSS" | "LEADERBOARD_DIRECT_NET" = "RANDOM") => {
    if (!tournamentId) return;
    setGroupingsGenerating(true);
    try {
      const data = await generateGroupings(tournamentId, selectedDay, rule);
      setGroupingsData(data);
      setGroupingsSubTab("grouped");
      setJustGrouped(true);
      toast.success("Groupings generated. Click 'Publish via Email' to notify players.");
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
        toast.error(`Flight "${targetGroup.name}" is full!`, {
          description: `This flight has reached its maximum capacity of ${capacity} players.`,
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
      setEditingGroupTimeId(null);
      setEditingGroupNameId(null);
      toast.success("Flight updated successfully");
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
      setPublishClickCount(0);
      setJustGrouped(false);
      setIsResetGroupingsModalOpen(false);
      toast.success("Groupings reset successfully");
    } catch (err) {
      toast.error((err instanceof Error ? err.message : null) || "Failed to reset groupings");
    } finally {
      setGroupingsLoading(false);
    }
  };

  const [applyingCut, setApplyingCut] = useState(false);
  const [showCutModal, setShowCutModal] = useState(false);
  const handleApplyCut = async () => {
    if (!tournamentId) return;
    try {
      setApplyingCut(true);
      await applyCut(tournamentId);
      toast.success("Cut applied successfully");
      await loadLeaderboardData(); // Reload data to show MC status
    } catch (err: any) {
      toast.error(err.message || "Failed to apply cut");
    } finally {
      setApplyingCut(false);
    }
  };

  const loadLeaderboardData = async () => {
    if (!tournamentId || !selectedTournament) return;
    setLeaderboardLoading(true);
    try {
      const scores = await getTournamentScores(tournamentId);

      // Get all approved & paid registrations, plus any disqualified players
      const [approvedRes, dqRes] = await Promise.all([
        getRegistrations({
          tournamentId,
          status: "APPROVED",
          paymentStatus: "PAID",
          take: 100,
        }),
        getRegistrations({
          tournamentId,
          status: "DISQUALIFIED",
          take: 100,
        })
      ]);

      const allRegs = [...(approvedRes.items || []), ...(dqRes.items || [])];

      const playersMap: Record<string, any> = {};

      // Initialize map with all registered players
      allRegs.forEach((reg: any) => {
        if (reg.user) {
          playersMap[reg.user.id] = {
            user: reg.user,
            status: reg.status,
            grossStrokes: 0,
            toPar: 0,
            holesCompleted: new Set(),
            points: 0,
            extraStrokes: reg.extraStrokes || 0,
            madeCut: reg.madeCut,
            registrationId: reg.id,
            rounds: {}, // Track gross score per round
            holeCounts: {}, // Track how many times each hole was played
          };
        }
      });

      scores.forEach((s: any) => {
        const uid = s.userId;
        if (!playersMap[uid]) {
          // Strictly reject scores from players who are not officially APPROVED and PAID or DISQUALIFIED
          return;
        }

        const p = playersMap[uid];
        const holeKey = s.holeId;

        // Count how many times this hole has been played by this user
        p.holeCounts[holeKey] = (p.holeCounts[holeKey] || 0) + 1;
        const roundNum = p.holeCounts[holeKey];

        // Filter by selected day if not "all"
        if (selectedLeaderboardDay !== "all" && roundNum !== selectedLeaderboardDay) {
          return;
        }

        p.grossStrokes += s.strokes || 0;
        p.toPar += (s.strokes - (s.hole?.par || 4));
        p.points += s.points || 0;

        // Track holes completed uniquely by round and hole
        p.holesCompleted.add(`${roundNum}-${s.holeId}`);

        // Track per round score
        p.rounds[roundNum] = (p.rounds[roundNum] || 0) + (s.strokes || 0);
      });

      const leaderboard = Object.values(playersMap)
        .map((p: any) => {
          const rawGross = p.grossStrokes;
          const handicapIndex = p.user?.handicap || 0;
          const extra = p.extraStrokes || 0;
          const holesPlayed = p.holesCompleted.size;

          // In golf, Playing Handicap is rounded to the nearest integer.
          // For multi-round tournaments, the handicap is scaled based on holes played (e.g., 2x for 36 holes).
          const playingHandicap = Math.round(handicapIndex);
          const totalHandicap = Math.round(playingHandicap * (holesPlayed / 18));

          // Stroke Play: Penalties add to Gross Score
          const gross = rawGross > 0 ? (rawGross + extra) : 0;
          const grossToPar = rawGross > 0 ? (p.toPar + extra) : 0;

          // Net = Gross - Total Handicap
          const net = gross > 0 ? (gross - totalHandicap) : 0;
          const netToPar = gross > 0 ? (grossToPar - totalHandicap) : 0;

          return {
            ...p,
            grossStrokes: gross, // Update with penalty included
            toPar: leaderboardSortBy === "NET" ? netToPar : grossToPar, // Update dynamically
            holesCount: p.holesCompleted.size,
            netStrokes: net,
          };
        })
        .sort((a, b) => {
          // Sort: Disqualified at the very bottom
          if (a.status === "DISQUALIFIED" && b.status !== "DISQUALIFIED") return 1;
          if (b.status === "DISQUALIFIED" && a.status !== "DISQUALIFIED") return -1;

          // Sort: Missed Cut right above Disqualified
          if (a.madeCut === false && b.madeCut !== false) return 1;
          if (b.madeCut === false && a.madeCut !== false) return -1;

          // Sort: 0 strokes (haven't started) should be at the bottom
          if (a.grossStrokes === 0 && b.grossStrokes > 0) return 1;
          if (b.grossStrokes === 0 && a.grossStrokes > 0) return -1;
          if (a.grossStrokes === 0 && b.grossStrokes === 0) return 0;

          if (leaderboardSortBy === "NET") {
            return a.netStrokes - b.netStrokes || a.grossStrokes - b.grossStrokes;
          } else {
            return a.toPar - b.toPar || a.grossStrokes - b.grossStrokes || a.netStrokes - b.netStrokes;
          }
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
      if (selectedTournament?.enableCut) {
        loadLeaderboardData();
      }
    } else if (activeTab === "leaderboard") {
      loadLeaderboardData();
    }
    fetchPendingWaitlistCount();
  }, [activeTab, tournamentId, selectedDay, selectedLeaderboardDay, waitlistPage, waitlistDebouncedSearch, waitlistFilter, registrationsRefreshTrigger, selectedTournament?.id, selectedTournament?.enableCut, leaderboardSortBy]);

  const isCutPending = useMemo(() => {
    if (!selectedTournament?.enableCut || selectedTournament.cutAfterRound == null) return false;
    if (!selectedTournament.lockedGroupingsDays?.includes(selectedTournament.cutAfterRound)) return false;
    if (!leaderboardData || leaderboardData.length === 0) return false;
    const hasAnyCutProcessed = leaderboardData.some((entry: any) => entry.madeCut === true || entry.madeCut === false);
    return !hasAnyCutProcessed;
  }, [selectedTournament, leaderboardData]);

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

  useEffect(() => {
    if (selectedTournament && selectedLeaderboardDay === "all") {
      const latestGroupedDay = (selectedTournament.lockedGroupingsDays && selectedTournament.lockedGroupingsDays.length > 0)
        ? Math.max(...selectedTournament.lockedGroupingsDays) + 1
        : 1;
      const totalDays = selectedTournament.endDate
        ? Math.round((new Date(selectedTournament.endDate).getTime() - new Date(selectedTournament.startDate).getTime()) / 86400000) + 1
        : 1;
      const smartDay = Math.min(totalDays, latestGroupedDay);
      if (smartDay > 1) {
        setSelectedLeaderboardDay(smartDay);
      } else {
        setSelectedLeaderboardDay(1);
      }
    }
  }, [selectedTournament?.id]);

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
        requiresPayment: t.requiresPayment ?? false,
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
        scoringType: t.scoringType === "GROSS" ? "GROSS" : "NET",
        enableCut: t.enableCut,
        cutAfterRound: t.cutAfterRound,
        lockedGroupingsDays: t.lockedGroupingsDays || [],
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
          requiresPayment: t.requiresPayment ?? false,
          startDate: t.startDate,
          endDate: t.endDate ?? null,
          maxPlayers: t.maxPlayers ?? null,
          maxPlayersPerGroup: t.maxPlayersPerGroup ?? 4,
          statusKey: t.status as TournamentStatus,
          visibility: VISIBILITY_META[t.visibility as "PUBLIC" | "PRIVATE" | "INVITE_ONLY"]?.label ?? t.visibility,
          visibilityKey: t.visibility as "PUBLIC" | "PRIVATE" | "INVITE_ONLY",
          enableWaitlist: t.enableWaitlist,
          enableCut: t.enableCut,
          cutAfterRound: t.cutAfterRound,
          createdAt: t.createdAt,
          registrations,
          scoringType: t.scoringType === "GROSS" ? "GROSS" : "NET",
          lockedGroupingsDays: t.lockedGroupingsDays || [],
        };
        setSelectedTournament(mapped);
        setRegistrationsTournamentTotal(registrations);
        setLeaderboardSortBy(t.scoringType === "GROSS" ? "GROSS" : "NET");
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
    const handler = setTimeout(() => setWaitlistDebouncedSearch(waitlistSearch.trim()), 300);
    return () => clearTimeout(handler);
  }, [waitlistSearch]);

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

        const matchesStatus = registrationsStatusFilter === "All Status" ? (r.status !== "WAITLISTED" && r.status !== "REJECTED") : r.status === registrationsStatusFilter;
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
    if (activeTab !== "register" || !selectedTournament?.id) {
      setRegisterPlayerResults([]);
      return;
    }
    const tId = selectedTournament.id;
    const q = registerPlayerSearch.trim();
    if (q.length < 2) {
      setRegisterPlayerResults([]);
      return;
    }

    let cancelled = false;
    setIsSearchingPlayers(true);
    getAdminUsers({ search: q, take: 10, role: "PLAYER" })
      .then(async ({ items }) => {
        if (cancelled) return;

        try {
          const { items: regItems } = await getRegistrations({
            tournamentId: tId,
            q,
            take: 50,
          });
          if (cancelled) return;
          const registeredIds = regItems.map(r => r.user?.id).filter((id): id is string => !!id);
          setRegisteredUserIdsForSearch(registeredIds);
        } catch (err) {
          console.error("Failed to fetch registrations for search", err);
        }

        setRegisterPlayerResults(Array.isArray(items) ? items : []);
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
        paymentStatus: (!selectedTournament.requiresPayment || manualPaymentType === "CASH") ? "PAID" : "UNPAID",
        status: (!selectedTournament.requiresPayment || manualPaymentType === "CASH") ? "APPROVED" : "PENDING",
      });
      toast.success("Player registered successfully");
      setNewlyRegisteredUserIds(prev => [...prev, userId]);

      await reloadSingleTournament();
      setRegistrationsRefreshTrigger(prev => prev + 1);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to register player");
    } finally {
      setIsRegistering(false);
    }
  };

  // Waitlist Action methods
  const handleApproveWaitlist = async (regIds: string[]) => {
    if (!selectedTournament?.id) return;
    setWaitlistActionId("processing");
    try {
      for (const regId of regIds) {
        await updateRegistrationStatus(regId, "APPROVED");
      }
      toast.success(regIds.length > 1 ? `${regIds.length} players approved from waitlist successfully` : "Player approved from waitlist successfully");
      setSelectedWaitlistIds([]);
      setIsApproveWaitlistModalOpen(false);
      fetchWaitlistData();
      await reloadSingleTournament();
      setRegistrationsRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to approve player(s)");
    } finally {
      setWaitlistActionId(null);
    }
  };

  const handleRemoveWaitlist = async (regIds: string[]) => {
    if (!selectedTournament?.id) return;
    setWaitlistActionId("processing");
    try {
      for (const regId of regIds) {
        await updateRegistrationStatus(regId, "REJECTED");
      }
      toast.success(regIds.length > 1 ? `${regIds.length} players removed from waitlist` : "Player removed from waitlist");
      setSelectedWaitlistIds([]);
      setIsRemoveWaitlistModalOpen(false);
      fetchWaitlistData();
      await reloadSingleTournament();
      setRegistrationsRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to remove player(s)");
    } finally {
      setWaitlistActionId(null);
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

  const clearTournamentRegistrationStrokes = async (registration: RegistrationListItem) => {
    setRegistrationActionId(registration.id);
    try {
      await clearRegistrationStrokes(registration.id);
      toast.success("Cleared penalties");
      setRegistrationsAll((prev) =>
        prev.map((r) => (r.id === registration.id ? { ...r, extraStrokes: 0 } : r)),
      );
      setRegistrations((prev) =>
        prev.map((r) => (r.id === registration.id ? { ...r, extraStrokes: 0 } : r)),
      );
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to clear strokes");
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
      // Refresh groupings data so the newly paid player appears in the Ungrouped Players
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
    router.push(`/super-admin/tournaments/${tournament.id}/edit`);
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
        router.push("/super-admin/tournaments");
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
              <Skeleton className="h-20 w-20 rounded-xl" />
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
        <p className="font-normal text-[14px]">Error loading tournament</p>
        <p className="text-[12px] mt-1">{error || "Tournament not found"}</p>
        <Button onClick={() => router.push("/super-admin/tournaments")} className="mt-4 bg-[#15803D] hover:bg-[#166534] text-white">
          Back to Tournaments
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full px-4 py-8 font-sans space-y-6">
      {/* Back Header */}
      <div className="flex items-center justify-between bg-white border border-[#e1efe5] rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/super-admin/tournaments")}
            className="w-10 h-10 border border-gray-200 hover:border-openclub-700 hover:bg-emerald-50/20 text-gray-500 hover:text-openclub-800 rounded-xl flex items-center justify-center transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[14px] font-normal text-gray-900">{selectedTournament.name}</h1>
              <span className={cn(
                "px-2.5 py-0.5 rounded-lg text-[11px] font-normal uppercase tracking-wide border",
                STATUS_META[selectedTournament.statusKey]?.badge || "bg-gray-100 text-gray-600 border-gray-200"
              )}>
                {selectedTournament.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1.5 text-[13px] text-gray-500 font-normal">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 opacity-70" />
                {selectedTournament.clubName}
              </span>
              <span className="w-px h-3.5 bg-gray-300"></span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 opacity-70" />
                {selectedTournament.dates}
              </span>
              <span className="w-px h-3.5 bg-gray-300"></span>
              <span className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 opacity-70" />
                {selectedTournament.type || "Stroke Play"}
              </span>
              <span className="w-px h-3.5 bg-gray-300"></span>
              <span className="flex items-center gap-1.5">
                <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-md border border-gray-200 uppercase tracking-wider text-gray-500">HCP</span>
                {selectedTournament.minHandicap ?? 0} - {selectedTournament.maxHandicap ?? 36}
              </span>
            </div>
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
              className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-normal text-[12px] flex items-center gap-2 rounded-xl px-6 shadow-lg shadow-blue-100"
            >
              <Send className="w-4 h-4" />
              Publish Now
            </Button>
          )}

          <Button
            onClick={() => openEdit(selectedTournament)}
            disabled={selectedTournament.statusKey === "CANCELLED" || selectedTournament.statusKey === "COMPLETED"}
            variant="outline"
            className="bg-white h-10 border-gray-200 text-gray-700 hover:bg-background font-normal text-[12px] flex items-center gap-2 rounded-xl shadow-sm"
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
              className="bg-white h-10 w-10 p-0 rounded-xl border border-gray-200 text-gray-700 hover:bg-background flex items-center justify-center shadow-sm"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
            {activeDropdown === selectedTournament.id && (
              <FloatingMenu
                open={activeDropdown === selectedTournament.id}
                anchorEl={dropdownAnchorEl}
                onClose={closeDropdown}
                placement="bottom-end"
                className="w-52 bg-white rounded-xl shadow-lg border border-[#efefef] py-2"
              >
                <button
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-[12px] font-normal flex items-center gap-3",
                    selectedTournament.statusKey === "CANCELLED" || selectedTournament.statusKey === "COMPLETED" || selectedTournament.registrations > 0
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-700 hover:bg-background"
                  )}
                  onClick={() => {
                    if (selectedTournament.statusKey !== "CANCELLED" && selectedTournament.statusKey !== "COMPLETED" && selectedTournament.registrations === 0) {
                      handleMenuAction(selectedTournament, "cancel");
                    }
                  }}
                >
                  <Ban className="w-4 h-4 text-gray-450" /> Cancel Tournament
                </button>
                <div className="h-px bg-background my-1 mx-2" />
                <button
                  className="w-full text-left px-4 py-2.5 text-[12px] font-normal text-red-650 hover:bg-red-50 flex items-center gap-3 rounded-lg"
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
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column - Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-[#fafafa] border border-[#e1efe5] rounded-xl p-3 shadow-sm space-y-2 sticky top-6">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3.5 border rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-[#f4fdf8] border-[#15803D] text-[#15803D]"
                      : "bg-white border-[#e1efe5] text-[#64748b] hover:border-gray-300 hover:bg-background"
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    <tab.icon className="w-[18px] h-[18px]" />
                    <span className="text-[13px] font-medium leading-tight">{tab.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-[#15803D]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column - Active Panel */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status Alert Banners */}
          {selectedTournament.statusKey === "CANCELLED" && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-4 text-red-700">
              <Ban className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="text-[16px] font-normal">Tournament Cancelled</p>
                <p className="text-[12px] text-red-650/80 font-normal">This tournament has been cancelled and modifications are locked.</p>
              </div>
            </div>
          )}
          {selectedTournament.statusKey === "COMPLETED" && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-4 text-emerald-700">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="text-[16px] font-normal">Tournament Completed</p>
                <p className="text-[12px] text-emerald-650/80 font-normal">This tournament has concluded and is read-only.</p>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden min-h-[600px] p-6 sm:p-8">
            {/* TABS 1: Registered Players */}
            {activeTab === "players" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e1efe5] pb-4">
                  <div>
                    <h2 className="text-[15px] font-medium text-gray-900">Registered Players</h2>
                    <p className="text-[13px] text-gray-500 mt-0.5">Manage participation, handicap indices, and add extra strokes.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => setActiveTab("waitlist")}
                      variant="outline"
                      className="h-9 bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 gap-1.5 rounded-md px-4 text-[11px] font-medium capitalize tracking-wider transition-all shadow-sm"
                    >
                      <Clock className="w-3.5 h-3.5 text-openclub-800" /> WAITLIST QUEUE
                      {pendingWaitlistTotal > 0 && (
                        <span className="flex items-center justify-center bg-emerald-100 text-emerald-700 text-[10px] font-medium px-1.5 h-4 min-w-[16px] rounded-full ml-1">
                          {pendingWaitlistTotal}
                        </span>
                      )}
                    </Button>
                    <Button
                      disabled={selectedTournament.statusKey === "CANCELLED" || selectedTournament.statusKey === "COMPLETED"}
                      onClick={() => setActiveTab("register")}
                      className="h-9 bg-[#15803D] hover:bg-[#166534] border border-[#166534] text-white gap-1.5 rounded-md px-4 text-[11px] font-medium uppercase tracking-wider transition-all shadow-sm"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> REGISTER A PLAYER
                    </Button>
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
                      className="pl-10 h-11 bg-background/50 border-gray-200 focus:bg-white rounded-xl text-[14px]"
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
                    triggerClassName="h-11 bg-[#f8f9fa]"
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
                    triggerClassName="h-11 bg-[#f8f9fa]"
                  />
                </div>

                <div className="space-y-4">
                  {registrationsLoading ? (
                    <div className="border border-[#e1efe5] rounded-xl overflow-hidden bg-white">
                      <div className="flex flex-col">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="flex items-center justify-between p-4 border-b border-[#e1efe5] last:border-0">
                            <div className="flex items-center gap-4 w-1/3">
                              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                              <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                              </div>
                            </div>
                            <div className="flex items-center gap-2 w-1/4 hidden sm:flex">
                              <Skeleton className="h-5 w-16 rounded-full" />
                              <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                            <div className="flex items-center justify-end gap-2 w-1/4 text-right">
                              <Skeleton className="h-9 w-9 rounded-lg" />
                              <Skeleton className="h-9 w-9 rounded-lg" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : registrationsPageItems.length > 0 ? (
                    <div className="overflow-x-auto relative rounded-xl border border-[#e1efe5]">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="bg-background/50 text-[11px] font-normal text-gray-400 uppercase tracking-wider border-b border-[#e1efe5]">
                            <th className="px-4 py-4">Player</th>
                            <th className="px-4 py-4">Status & Payment</th>
                            <th className="px-4 py-4">Details</th>
                            <th className="px-4 py-4 text-center">Handicap / Penalty</th>
                            <th className="px-4 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#efefef] bg-white">
                          {registrationsPageItems.map((r) => {
                            const isDisqualified = r.status === "DISQUALIFIED";
                            const isPaid = r.paymentStatus === "PAID";
                            return (
                              <tr
                                key={r.id}
                                className={cn(
                                  "transition-all hover:bg-background/50",
                                  isDisqualified ? "bg-red-50/10 opacity-75" : ""
                                )}
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-[#e1efe5]">
                                      <img
                                        src={r.user?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(r.user?.email || r.id)}`}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[14px] font-medium text-gray-900 truncate">
                                        {fullName(r.user?.firstName ?? null, r.user?.lastName ?? null)}
                                      </p>
                                      <p className="text-[12px] text-gray-500 truncate mt-0.5">{r.user?.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className={cn(
                                      "text-[10px] font-normal px-2 py-0.5 rounded-lg uppercase tracking-wider",
                                      (r.status === "APPROVED" && r.paymentStatus !== "PAID") ? "bg-blue-50 text-blue-700 border border-blue-100" :
                                        r.status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                          r.status === "PENDING" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                                            r.status === "WAITLISTED" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                              r.status === "DISQUALIFIED" ? "bg-red-50 text-red-700 border border-red-100" :
                                                "bg-background text-gray-600 border border-gray-200"
                                    )}>
                                      {(r.status === "APPROVED" && r.paymentStatus !== "PAID") ? "PENDING" : r.status}
                                    </span>
                                    <span className={cn(
                                      "text-[10px] font-normal px-2 py-0.5 rounded-lg uppercase tracking-wider",
                                      isPaid ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                        "bg-background text-gray-600 border border-gray-250"
                                    )}>
                                      {r.paymentStatus}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5">
                                    {r.user?.gender && (
                                      <span className={cn(
                                        "text-[10px] font-normal px-2 py-0.5 rounded-lg uppercase tracking-wider border",
                                        r.user.gender.toUpperCase() === 'MALE' ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-pink-50 text-pink-700 border-pink-100"
                                      )}>
                                        {r.user.gender}
                                      </span>
                                    )}
                                    {r.user?.dob && (
                                      <span className="text-[10px] font-normal px-2 py-0.5 rounded-lg uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-100">
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
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span className="text-[10px] font-normal px-2 py-0.5 rounded-lg uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                                      HCP {r.user?.handicap ?? 0}
                                    </span>
                                    {typeof r.extraStrokes === "number" && r.extraStrokes > 0 && (
                                      <span className="text-[10px] font-normal px-2 py-0.5 rounded-lg bg-red-50 text-red-700 border border-red-100 uppercase tracking-wider">
                                        +{r.extraStrokes} Penalty
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {selectedTournament.statusKey !== "CANCELLED" && selectedTournament.statusKey !== "COMPLETED" && (
                                    <div className="flex items-center justify-end gap-2">
                                      {selectedTournament.entryFee !== null && !isPaid && new Date(selectedTournament.startDate).setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0) && (
                                        <Button
                                          variant="outline"
                                          onClick={() => handleMarkPaid(r.id)}
                                          disabled={markingPaidId === r.id}
                                          title="Mark as Paid"
                                          className="h-9 w-9 p-0 bg-white rounded-lg border-emerald-200 text-openclub-800 hover:bg-emerald-50 flex items-center justify-center"
                                        >
                                          {markingPaidId === r.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-openclub-800" />
                                          ) : (
                                            <Wallet className="w-4 h-4" />
                                          )}
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openRemovePlayer(r)}
                                        disabled={registrationActionId === r.id}
                                        title="Remove Player"
                                        className="h-9 w-9 p-0 bg-white rounded-lg border-red-100 text-red-650 hover:bg-red-50 flex items-center justify-center"
                                      >
                                        <UserMinus className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState
                      title="No registrations found"
                      description="Try adjusting your filters or search query to find what you're looking for."
                    />
                  )}

                  {!registrationsLoading && registrationsFilteredTotal > 0 && (
                    <div className="pt-4 flex items-center justify-between gap-4">
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
              </div>
            )}

            {/* TABS 2: Register Player Inline */}
            {activeTab === "register" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-[15px] font-medium text-gray-900 font-sans">Manual Player Registration</h2>
                  <p className="text-[12px] text-gray-500 mt-1">Directly search and enrol members into this tournament.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-emerald-50/30 border border-emerald-100/50">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-openclub-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-gray-900 leading-tight">Quick Registration</h3>
                    <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">
                      Register members directly into <span className="text-openclub-800 font-normal">{selectedTournament.name}</span>. Flights & Tee Times and pairing calculations will be recalculated dynamically.
                    </p>
                  </div>
                </div>

                {selectedTournament?.requiresPayment && (
                  <div className="space-y-3">
                    <Label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Initial Payment Status</Label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setManualPaymentType('UNPAID')}
                        className={cn(
                          "flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1 text-center",
                          manualPaymentType === 'UNPAID'
                            ? "border-openclub-700 bg-emerald-50 text-emerald-700"
                            : "border-[#e1efe5] bg-white text-gray-550 hover:border-gray-250"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-4 h-4 rounded-lg border-2 flex items-center justify-center",
                            manualPaymentType === 'UNPAID' ? "border-openclub-700" : "border-gray-300"
                          )}>
                            {manualPaymentType === 'UNPAID' && <div className="w-2 h-2 rounded-lg bg-openclub-700" />}
                          </div>
                          <span className="text-[13px] font-normal">Unpaid</span>
                        </div>
                        <p className="text-[10px] opacity-70 leading-tight mt-1">Player will not be confirmed for grouping until payment is recorded.</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualPaymentType('CASH')}
                        className={cn(
                          "flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1 text-center",
                          manualPaymentType === 'CASH'
                            ? "border-openclub-700 bg-emerald-50 text-emerald-700"
                            : "border-[#e1efe5] bg-white text-gray-550 hover:border-gray-250"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-4 h-4 rounded-lg border-2 flex items-center justify-center",
                            manualPaymentType === 'CASH' ? "border-openclub-700" : "border-gray-300"
                          )}>
                            {manualPaymentType === 'CASH' && <div className="w-2 h-2 rounded-lg bg-openclub-700" />}
                          </div>
                          <span className="text-[13px] font-normal">Paid (Cash / Direct)</span>
                        </div>
                        <p className="text-[10px] opacity-70 leading-tight mt-1">Player will be marked as PAID and automatically APPROVED.</p>
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Type player name or email to search..."
                      value={registerPlayerSearch}
                      onChange={(e) => setRegisterPlayerSearch(e.target.value)}
                      className="pl-10 h-12 bg-background/50 border-gray-200 focus:bg-white rounded-xl text-[14px]"
                    />
                  </div>

                  <div className="min-h-[300px]">
                    {isSearchingPlayers ? (
                      <div className="p-12 text-center text-gray-400 space-y-3">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-650" />
                        <p className="text-[12px]">Searching the openclub registry...</p>
                      </div>
                    ) : registerPlayerResults.length > 0 ? (
                      <div className="overflow-x-auto relative rounded-xl border border-[#e1efe5]">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                          <thead>
                            <tr className="bg-background/50 text-[11px] font-normal text-gray-400 uppercase tracking-wider border-b border-[#e1efe5]">
                              <th className="px-4 py-4">Player</th>
                              <th className="px-4 py-4">Details</th>
                              <th className="px-4 py-4 text-center">Handicap</th>
                              <th className="px-4 py-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#efefef] bg-white">
                            {registerPlayerResults.map((player) => {
                              const isAlreadyRegistered =
                                registrationsAll.some(x => x.user?.id === player.id) ||
                                registrations.some(x => x.user?.id === player.id) ||
                                registeredUserIdsForSearch.includes(player.id) ||
                                newlyRegisteredUserIds.includes(player.id);
                              return (
                                <tr key={player.id} className="transition-all hover:bg-background/50">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-[#e1efe5]">
                                        <img
                                          src={player.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.email || player.id)}`}
                                          alt=""
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-[14px] font-medium text-gray-900 truncate">
                                          {fullName(player.firstName ?? null, player.lastName ?? null)}
                                        </p>
                                        <p className="text-[12px] text-gray-550 truncate mt-0.5">{player.email}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-1.5">
                                      {player.gender && (
                                        <span className={cn(
                                          "text-[10px] font-normal px-2 py-0.5 rounded-lg uppercase tracking-wider border",
                                          player.gender.toUpperCase() === 'MALE' ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-pink-50 text-pink-700 border-pink-100"
                                        )}>
                                          {player.gender}
                                        </span>
                                      )}
                                      {player.dob && (
                                        <span className="text-[10px] font-normal px-2 py-0.5 rounded-lg uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-100">
                                          {(() => {
                                            const birthDate = new Date(player.dob);
                                            const today = new Date();
                                            let age = today.getFullYear() - birthDate.getFullYear();
                                            const m = today.getMonth() - birthDate.getMonth();
                                            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
                                            return `${age} YRS`;
                                          })()}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="text-[10px] font-normal px-2 py-0.5 rounded-lg uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                                      HCP {player.handicap ?? 0}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <Button
                                      disabled={isAlreadyRegistered || isRegistering}
                                      size="sm"
                                      onClick={() => handleRegisterPlayer(player.id)}
                                      className={cn(
                                        "rounded-xl font-normal text-[12px] px-4 h-9",
                                        isAlreadyRegistered
                                          ? "bg-gray-100 text-gray-400 border border-gray-200"
                                          : "bg-[#15803D] hover:bg-[#166534] text-white"
                                      )}
                                    >
                                      {isRegistering ? "Registering..." : isAlreadyRegistered ? "Registered" : "Enrol Player"}
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : registerPlayerSearch.trim().length >= 2 ? (
                      <EmptyState
                        variant="minimal"
                        icon={Search}
                        title="No players found"
                        description={`We couldn't find anyone in OpenClub matching "${registerPlayerSearch}"`}
                      />
                    ) : (
                      <EmptyState
                        variant="minimal"
                        icon={Users}
                        title="Start Enrolling"
                        description="Type 2 or more characters of a member's name or email to retrieve matches."
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TABS 3: Waitlist Management */}
            {activeTab === "waitlist" && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 bg-emerald-50/50 border border-emerald-100/50 rounded-xl p-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-openclub-800 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-openclub-800 font-normal uppercase tracking-wider">Queue Management</p>
                    <h4 className="text-[15px] font-medium text-gray-900 truncate">Waitlist Queue</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-[16px] font-normal text-openclub-800 leading-none">{formatWithCommas(pendingWaitlistTotal)}</p>
                    <p className="text-[11px] text-emerald-650 font-normal uppercase tracking-widest mt-1">Waiting</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search waitlist by name or email..."
                      className="pl-10 h-12 bg-background/50 border-gray-200 focus:bg-white rounded-xl text-[14px]"
                      value={waitlistSearch}
                      onChange={(e) => {
                        setWaitlistSearch(e.target.value);
                        setWaitlistPage(1);
                      }}
                    />
                  </div>
                  {selectedWaitlistIds.length > 0 && (
                    <div className="flex items-center gap-2 bg-emerald-50/50 px-4 py-2 rounded-xl border border-emerald-100">
                      <span className="text-[12px] font-normal text-emerald-700 mr-2">
                        {selectedWaitlistIds.length} selected
                      </span>
                      <Button
                        onClick={() => setIsApproveWaitlistModalOpen(true)}
                        className="h-9 bg-openclub-800 hover:bg-emerald-700 text-white text-[12px] font-normal px-4 rounded-lg shadow-sm gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve All
                      </Button>
                      <Button
                        onClick={() => setIsRemoveWaitlistModalOpen(true)}
                        variant="ghost"
                        className="h-9 text-red-600 hover:bg-red-50 hover:text-red-700 text-[12px] font-normal px-4 rounded-lg gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove All
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="flex gap-2 bg-background/50 p-1.5 rounded-xl w-fit border border-[#e1efe5]">
                    <button
                      onClick={() => setWaitlistFilter("PENDING")}
                      className={cn(
                        "px-4 py-2 text-[13px] font-normal rounded-lg transition-all",
                        waitlistFilter === "PENDING" ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100/50"
                      )}
                    >
                      Pending Queue
                    </button>
                    <button
                      onClick={() => setWaitlistFilter("REJECTED")}
                      className={cn(
                        "px-4 py-2 text-[13px] font-normal rounded-lg transition-all",
                        waitlistFilter === "REJECTED" ? "bg-red-50 text-red-700 shadow-sm border border-red-200" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100/50"
                      )}
                    >
                      Rejected Players
                    </button>
                  </div>
                  {waitlistFilter === "PENDING" && waitlist.length > 0 && (
                    <div className="flex items-center gap-2 px-2">
                      <input
                        type="checkbox"
                        id="selectAllWaitlist"
                        className="w-4 h-4 rounded border-gray-300 text-openclub-800 focus:ring-openclub-700 cursor-pointer"
                        checked={selectedWaitlistIds.length === waitlist.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWaitlistIds(waitlist.map(i => i.id));
                          } else {
                            setSelectedWaitlistIds([]);
                          }
                        }}
                      />
                      <label htmlFor="selectAllWaitlist" className="text-[13px] font-normal text-gray-700 cursor-pointer">Select All</label>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {waitlistLoading ? (
                    <div className="border border-[#e1efe5] rounded-xl overflow-hidden bg-white">
                      <div className="flex flex-col">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="flex items-center justify-between p-4 border-b border-[#e1efe5] last:border-0">
                            <div className="flex items-center gap-4 w-1/3">
                              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                              <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                              </div>
                            </div>
                            <div className="flex items-center gap-2 w-1/4 hidden sm:flex">
                              <Skeleton className="h-5 w-16 rounded-full" />
                              <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                            <div className="flex items-center justify-end gap-2 w-1/4 text-right">
                              <Skeleton className="h-9 w-9 rounded-lg" />
                              <Skeleton className="h-9 w-9 rounded-lg" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : waitlist.length > 0 ? (
                    <div className="overflow-x-auto relative rounded-xl border border-[#e1efe5]">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="bg-background/50 text-[11px] font-normal text-gray-400 uppercase tracking-wider border-b border-[#e1efe5]">
                            {waitlistFilter === "PENDING" && (
                              <th className="w-12 px-4 py-4 text-center">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 rounded border-gray-300 text-openclub-800 focus:ring-openclub-700 cursor-pointer"
                                  checked={selectedWaitlistIds.length > 0 && waitlist.length > 0 && selectedWaitlistIds.length === waitlist.length}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedWaitlistIds(waitlist.map(i => i.id));
                                    } else {
                                      setSelectedWaitlistIds([]);
                                    }
                                  }}
                                />
                              </th>
                            )}
                            <th className={cn("px-4 py-4", waitlistFilter !== "PENDING" && "pl-6")}>Player</th>
                            <th className="px-4 py-4">Details</th>
                            <th className="px-4 py-4 text-center">Handicap</th>
                            <th className="px-4 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#efefef] bg-white">
                          {waitlist
                            .filter(w => waitlistFilter === "PENDING" ? w.status === "WAITLISTED" : w.status === "REJECTED")
                            .map((item) => (
                              <tr key={item.id} className={cn("transition-all hover:bg-background/50", selectedWaitlistIds.includes(item.id) ? "bg-emerald-50/30" : "")}>
                                {waitlistFilter === "PENDING" && (
                                  <td className="px-4 py-3 text-center">
                                    <input
                                      type="checkbox"
                                      className="w-4 h-4 rounded border-gray-300 text-openclub-800 focus:ring-openclub-700 cursor-pointer"
                                      checked={selectedWaitlistIds.includes(item.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedWaitlistIds(prev => [...prev, item.id]);
                                        } else {
                                          setSelectedWaitlistIds(prev => prev.filter(id => id !== item.id));
                                        }
                                      }}
                                    />
                                  </td>
                                )}
                                <td className={cn("px-4 py-3", waitlistFilter !== "PENDING" && "pl-6")}>
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-[#e1efe5]">
                                      <img
                                        src={item.user?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(item.user?.email || item.id)}`}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="text-[14px] font-medium text-gray-900 truncate">
                                          {fullName(item.user?.firstName ?? null, item.user?.lastName ?? null)}
                                        </p>
                                        {item.status === "REJECTED" && (
                                          <span className="px-1.5 py-0.5 rounded text-[9px] font-normal bg-red-100 text-red-600 uppercase tracking-wider">Rejected</span>
                                        )}
                                      </div>
                                      <p className="text-[12px] text-gray-500 truncate mt-0.5">{item.user?.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5">
                                    {item.user?.gender && (
                                      <span className={cn(
                                        "text-[10px] font-normal px-2 py-0.5 rounded-lg uppercase tracking-wider border",
                                        item.user.gender.toUpperCase() === 'MALE' ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-pink-50 text-pink-700 border-pink-100"
                                      )}>
                                        {item.user.gender}
                                      </span>
                                    )}
                                    {item.user?.dob && (
                                      <span className="text-[10px] font-normal px-2 py-0.5 rounded-lg uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-100">
                                        {(() => {
                                          const birthDate = new Date(item.user.dob);
                                          const today = new Date();
                                          let age = today.getFullYear() - birthDate.getFullYear();
                                          const m = today.getMonth() - birthDate.getMonth();
                                          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
                                          return `${age} YRS`;
                                        })()}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="text-[10px] font-normal px-2 py-0.5 rounded-lg uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    HCP {item.user?.handicap ?? 0}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {item.status !== "REJECTED" && (
                                      <Button
                                        onClick={() => {
                                          if (!selectedWaitlistIds.includes(item.id)) setSelectedWaitlistIds([item.id]);
                                          setIsApproveWaitlistModalOpen(true);
                                        }}
                                        disabled={waitlistActionId === item.id}
                                        title="Approve"
                                        className="h-9 w-9 p-0 bg-white rounded-lg border-emerald-200 text-openclub-800 hover:bg-emerald-50 flex items-center justify-center"
                                      >
                                        {waitlistActionId === item.id ? (
                                          <Loader2 className="w-4 h-4 animate-spin text-openclub-800" />
                                        ) : (
                                          <CheckCircle2 className="w-4 h-4" />
                                        )}
                                      </Button>
                                    )}
                                    <Button
                                      onClick={() => {
                                        if (!selectedWaitlistIds.includes(item.id)) setSelectedWaitlistIds([item.id]);
                                        setIsRemoveWaitlistModalOpen(true);
                                      }}
                                      disabled={waitlistActionId === item.id || item.status === "REJECTED"}
                                      title={item.status === "REJECTED" ? "Rejected" : "Reject"}
                                      className="h-9 w-9 p-0 bg-white rounded-lg border-red-100 text-red-650 hover:bg-red-50 flex items-center justify-center"
                                    >
                                      <UserMinus className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-white border border-[#e1efe5] rounded-xl p-12 text-center">
                      <EmptyState
                        icon={Clock}
                        title={waitlistSearch ? "No waitlisted players found" : "Waitlist is empty"}
                        description={waitlistSearch ? "Try adjusting your search terms." : "No players currently in the queue for this tournament."}
                      />
                    </div>
                  )}
                </div>

                {waitlistTotal > waitlistPerPage && (
                  <div className="mt-4 flex justify-end">
                    <Pagination
                      currentPage={waitlistPage}
                      totalPages={Math.ceil(waitlistTotal / waitlistPerPage)}
                      onPageChange={setWaitlistPage}
                    />
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-4">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <p className="text-[12px] text-amber-700 leading-relaxed font-normal">
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
                    {/* Day Selection Skeleton */}
                    <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#e1efe5] gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-40 h-[56px] bg-gray-100 animate-pulse rounded-2xl" />
                        <div className="w-8 h-8 bg-gray-100 animate-pulse rounded-xl" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div className="w-[180px] h-10 bg-gray-100 animate-pulse rounded-xl hidden md:block" />
                        <div className="w-32 h-10 bg-gray-100 animate-pulse rounded-xl hidden md:block" />
                        <div className="w-[140px] h-10 bg-gray-100 animate-pulse rounded-xl" />
                      </div>
                    </div>

                    {/* Groupings Dashboard Header Skeleton */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8 pt-2">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-64 h-7 bg-gray-100 animate-pulse rounded-lg" />
                          <div className="w-28 h-6 bg-gray-100 animate-pulse rounded-md" />
                        </div>
                        <div className="w-96 h-4 bg-gray-100 animate-pulse rounded-md max-w-full" />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-36 h-11 bg-gray-100 animate-pulse rounded-xl" />
                        <div className="w-44 h-11 bg-gray-100 animate-pulse rounded-xl" />
                      </div>
                    </div>

                    {/* Search & Sub-tabs Skeleton */}
                    <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                      <div className="w-full md:w-80 h-12 bg-gray-100 animate-pulse rounded-xl" />
                      <div className="flex gap-2 bg-background/50 p-1.5 rounded-xl border border-[#e1efe5]">
                        <div className="w-36 h-9 bg-gray-100 animate-pulse rounded-lg" />
                        <div className="w-32 h-9 bg-gray-100 animate-pulse rounded-lg" />
                      </div>
                    </div>

                    {/* Flights Grid Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white rounded-xl border border-[#e1efe5] flex flex-col shadow-sm">
                          <div className="p-4 border-b border-gray-50 bg-background/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse shrink-0" />
                              <div className="space-y-2">
                                <div className="w-24 h-4 bg-gray-100 animate-pulse rounded" />
                                <div className="w-16 h-3 bg-gray-100 animate-pulse rounded" />
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <div className="w-8 h-4 bg-gray-100 animate-pulse rounded" />
                              <div className="w-14 h-3 bg-gray-100 animate-pulse rounded" />
                            </div>
                          </div>
                          <div className="h-1 w-full bg-background" />
                          <div className="p-2 space-y-1">
                            {[1, 2, 3, 4].map(j => (
                              <div key={j} className="flex items-center gap-3 p-2">
                                <div className="w-7 h-7 rounded-full bg-gray-100 animate-pulse shrink-0" />
                                <div className="w-32 h-3 bg-gray-100 animate-pulse rounded" />
                                <div className="w-8 h-3 bg-gray-100 animate-pulse rounded ml-auto" />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Day Selection Linear Flow */}
                    <div className="flex items-center justify-between pb-4 border-b border-[#e1efe5]">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-50 text-emerald-800 shadow-sm border border-emerald-200 px-6 py-2.5 text-[13px] font-normal rounded-xl flex items-center gap-2 uppercase tracking-widest">
                          <Calendar className="w-4 h-4 text-openclub-800" />
                          DAY {selectedDay}
                        </div>
                        {selectedDay > 1 && (
                          <button
                            onClick={() => setSelectedDay(selectedDay - 1)}
                            className="px-6 py-2.5 text-[13px] font-normal rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all duration-300 flex items-center gap-2"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Day {selectedDay - 1}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {selectedDay < getTournamentDays() && (
                          <button
                            onClick={() => setSelectedDay(selectedDay + 1)}
                            className="px-6 py-2.5 text-[13px] font-normal rounded-xl bg-[#15803D] hover:bg-openclub-800 text-white shadow-sm transition-all duration-300 flex items-center gap-2"
                          >
                            Proceed to Day {selectedDay + 1}
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {groupingsData?.groups && groupingsData.groups.length > 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-4 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                        <div className="flex gap-3">
                          <Mail className="w-5 h-5 text-openclub-800 flex-shrink-0" />
                          <div>
                            <h4 className="text-[14px] font-normal text-emerald-900">Send Tee Times via Email</h4>
                            <p className="text-[12px] text-emerald-700 mt-0.5">Flights & Tee Times have been generated. Publish them via email to notify players.</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            setJustGrouped(false);
                            handlePublishGroupingsEmail();
                          }}
                          disabled={groupingsGenerating || groupingsLoading}
                          className={cn(
                            "bg-openclub-800 hover:bg-emerald-700 text-white h-10 px-6 text-[13px] font-normal rounded-xl shadow-sm transition-all whitespace-nowrap gap-2 relative",
                            justGrouped && "animate-pulse ring-4 ring-openclub-700/30"
                          )}
                        >
                          <Mail className="w-4 h-4" />
                          Publish via Email
                          {publishClickCount > 0 && (
                            <span className="ml-1 bg-white/20 text-white px-2 py-0.5 rounded-lg text-[10px]">
                              {publishClickCount}
                            </span>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Groupings Dashboard Header */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8 pt-2">
                      <div className="space-y-1">
                        <h3 className="text-[15px] font-medium text-gray-900 flex items-center gap-3">
                          Manage Flights & Tee Times
                          <span className="text-[11px] font-normal text-gray-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 shadow-sm flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            {getTournamentDays()} Day Tournament
                          </span>
                        </h3>
                        <p className="text-[13px] text-gray-500">Pair players into Tee Flights and assign tee times for Day {selectedDay}.</p>
                        {groupingsData?.rule && (
                          <div className="mt-2">
                            <span className="text-[11px] font-normal bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-200 uppercase tracking-wider shadow-sm">
                              Rule: {groupingsData.rule.replace(/_/g, ' ')}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">

                        <button
                          onClick={() => setIsGroupingRulesModalOpen(true)}
                          disabled={!!groupingsData?.groups?.length}
                          className="flex items-center gap-2 px-4 h-11 rounded-xl bg-white border border-[#e1efe5] text-gray-600 hover:bg-slate-50 hover:text-gray-900 disabled:bg-background disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-all text-[13px] font-normal shadow-sm"
                          title="Grouping Rules"
                        >
                          <Info className="w-4 h-4 text-openclub-800" />
                          Grouping Rules
                        </button>
                        <div className="relative inline-block">
                          <Button
                            disabled={selectedTournament?.lockedGroupingsDays?.includes(selectedDay) || groupingsGenerating || groupingsLoading || !groupingsData?.unassigned.length}
                            className="bg-openclub-700 hover:bg-openclub-800 text-white rounded-xl h-11 px-5 text-[13px] font-normal gap-2 shadow-sm border border-openclub-800/20 disabled:bg-slate-100 disabled:text-gray-400 disabled:border-slate-200 disabled:shadow-none disabled:cursor-not-allowed disabled:opacity-100"
                          >
                            {groupingsGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            Auto Group Players
                            <ChevronDown className="w-3.5 h-3.5 ml-1" />
                          </Button>
                          <select
                            disabled={selectedTournament?.lockedGroupingsDays?.includes(selectedDay) || groupingsGenerating || groupingsLoading || isCheckingPreviousDay || !groupingsData?.unassigned.length}
                            onChange={async (e) => {
                              const rule = e.target.value as any;
                              if (!rule) return;
                              e.target.value = "";
                              if (selectedDay > 1 && !selectedTournament?.lockedGroupingsDays?.includes(selectedDay - 1)) {
                                if (tournamentId) {
                                  setIsCheckingPreviousDay(true);
                                  try {
                                    const prevData = await getGroupings(tournamentId, selectedDay - 1);
                                    if (prevData && prevData.unassigned.length > 0) {
                                      setIsUngroupedPlayersModalOpen(true);
                                      return;
                                    }
                                  } catch (err) {
                                    toast.error("Failed to verify previous day's groupings");
                                    return;
                                  } finally {
                                    setIsCheckingPreviousDay(false);
                                  }
                                }
                                setPendingGroupingRule(rule);
                                setIsDayLockModalOpen(true);
                              } else {
                                handleGenerateGroupings(rule);
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            title="Select Grouping Rule"
                          >
                            <option value="">Select Rule...</option>
                            <option value="RANDOM">🎲 Random Grouping</option>
                            <option value="CATEGORY_RANDOM">⚖️ Category Balanced</option>
                            <option value="LEADERBOARD_REVERSE_GROSS" disabled={selectedDay === 1}>📈 Leaderboard Reverse (Gross)</option>
                            <option value="LEADERBOARD_REVERSE_NET" disabled={selectedDay === 1}>📈 Leaderboard Reverse (Net)</option>
                            <option value="LEADERBOARD_DIRECT_GROSS" disabled={selectedDay === 1}>📉 Leaderboard Direct (Gross)</option>
                            <option value="LEADERBOARD_DIRECT_NET" disabled={selectedDay === 1}>📉 Leaderboard Direct (Net)</option>
                          </select>
                        </div>
                        <Button
                          onClick={handleClearGroupings}
                          disabled={selectedTournament?.lockedGroupingsDays?.includes(selectedDay) || groupingsLoading || !groupingsData?.groups.length}
                          className="bg-slate-900 hover:bg-slate-800 text-white h-11 px-5 text-[13px] font-normal rounded-xl shadow-sm border border-slate-900/20 disabled:bg-slate-100 disabled:text-gray-400 disabled:border-slate-200 disabled:shadow-none disabled:cursor-not-allowed disabled:opacity-100 transition-all gap-2"
                        >
                          <RefreshCcw className="w-3.5 h-3.5" />
                          Reset All
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
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
                          className="pl-10 h-12 bg-background/50 border-gray-200 focus:bg-white rounded-xl text-[14px]"
                        />
                      </div>
                    </div>

                    {/* Sub-tabs for Unassigned/Grouped */}
                    <div className="flex gap-2 mb-6 bg-background/50 p-1.5 rounded-xl w-fit border border-[#e1efe5]">
                      <button
                        onClick={() => {
                          setGroupingsSubTab("unassigned");
                          setUnassignedPage(1);
                        }}
                        className={cn(
                          "px-4 py-2 text-[13px] font-normal rounded-lg transition-all flex items-center",
                          groupingsSubTab === "unassigned"
                            ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200"
                            : "text-gray-500 hover:text-gray-800 hover:bg-gray-100/50"
                        )}
                      >
                        Ungrouped Players
                        <Badge variant="outline" className={cn(
                          "ml-2 font-normal px-1.5 py-0 transition-all",
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
                          "px-4 py-2 text-[13px] font-normal rounded-lg transition-all flex items-center",
                          groupingsSubTab === "grouped"
                            ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200"
                            : "text-gray-500 hover:text-gray-800 hover:bg-gray-100/50"
                        )}
                      >
                        Tee Flights
                        <Badge variant="outline" className={cn(
                          "ml-2 font-normal px-1.5 py-0 transition-all",
                          groupingsSubTab === "grouped" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-400 border-gray-200"
                        )}>
                          {groupingsData?.groups.length || 0}
                        </Badge>
                      </button>
                    </div>

                    {groupingsData && (groupingsData.groups.length > 0 || groupingsData.unassigned.length > 0) ? (
                      <div className="space-y-6">
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
                                        "group bg-white rounded-xl border transition-all duration-300 overflow-hidden flex flex-col shadow-sm",
                                        isFull ? "border-emerald-100 bg-emerald-50/5" : "border-[#e1efe5] hover:border-emerald-200 hover:shadow-md"
                                      )}
                                    >
                                      <div className="p-4 border-b border-gray-50 bg-background/30 flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                          <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0 border",
                                            isFull ? "bg-emerald-50 border-emerald-100 text-openclub-800" : "bg-white border-[#e1efe5] text-gray-400"
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
                                                className="h-7 py-0 px-2 text-[13px] font-normal rounded-lg border-openclub-700"
                                              />
                                            ) : (
                                              <h4
                                                onClick={() => { setEditingGroupNameId(group.id); setEditingGroupNameValue(group.name); }}
                                                className="text-[14px] font-medium text-gray-900 truncate cursor-pointer hover:text-openclub-800"
                                              >
                                                {group.name}
                                              </h4>
                                            )}
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                              <Clock className="w-3 h-3 text-gray-400" />
                                              <span className="text-[11px] font-normal text-gray-400 capitalize">{group.startTime || "TBD"}</span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-[12px] font-normal text-gray-900">{occupancy}/{capacity}</div>
                                          <div className="text-[9px] font-normal text-gray-400 uppercase tracking-wider">Flight Size</div>
                                        </div>
                                      </div>
                                      <div className="h-1 w-full bg-gray-100">
                                        <div
                                          className={cn("h-full transition-all duration-500", isFull ? "bg-openclub-700" : "bg-blue-500")}
                                          style={{ width: `${(occupancy / capacity) * 100}%` }}
                                        />
                                      </div>
                                      {/* Group Players (Tabular) */}
                                      <div className="flex-1 overflow-x-auto">
                                        <table className="w-full text-left">
                                          <tbody className="divide-y divide-[#efefef]">
                                            {group.registrations.map((player: GroupingPlayer) => (
                                              <tr key={player.id} className="hover:bg-emerald-50/30 transition-colors group/player">
                                                <td className="pl-3 py-2 w-[36px] align-middle">
                                                  <div className="w-7 h-7 rounded-full overflow-hidden border border-[#e1efe5] bg-white shadow-sm shrink-0">
                                                    <img
                                                      src={player.user?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.user?.email || player.id)}`}
                                                      alt=""
                                                      className="w-full h-full object-cover"
                                                    />
                                                  </div>
                                                </td>
                                                <td className="py-2 px-2 align-middle max-w-[120px]">
                                                  <NextLink href="#" className="block truncate">
                                                    <div className="text-[12px] text-gray-900 font-normal hover:text-openclub-800 transition-colors truncate">
                                                      {player.user?.firstName} {player.user?.lastName}
                                                    </div>
                                                  </NextLink>
                                                </td>
                                                <td className="py-2 px-2 align-middle">
                                                  <div className="flex flex-wrap items-center gap-1">
                                                    {/* Gender Badge */}
                                                    {player.user?.gender && (
                                                      <span className={cn(
                                                        "text-[9px] font-normal px-1.5 py-0.5 rounded-md uppercase tracking-tight border whitespace-nowrap",
                                                        player.user.gender.toUpperCase() === 'MALE' ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-pink-50 text-pink-700 border-pink-100"
                                                      )}>
                                                        {player.user.gender.substring(0, 1)}
                                                      </span>
                                                    )}
                                                    {/* Category Badge */}
                                                    {player.user?.handicap !== undefined && (
                                                      <span className="text-[9px] font-normal px-1.5 py-0.5 rounded-md uppercase tracking-tight bg-purple-50 text-purple-700 border border-purple-100 whitespace-nowrap">
                                                        {getGolfCategory(player.user.handicap).substring(0, 4)}
                                                      </span>
                                                    )}
                                                    {/* Age Badge */}
                                                    {player.user?.dob && (
                                                      <span className="text-[9px] font-normal px-1.5 py-0.5 rounded-md uppercase tracking-tight bg-orange-50 text-orange-700 border border-orange-100 whitespace-nowrap">
                                                        {(() => {
                                                          const birthDate = new Date(player.user.dob);
                                                          const today = new Date();
                                                          let age = today.getFullYear() - birthDate.getFullYear();
                                                          const m = today.getMonth() - birthDate.getMonth();
                                                          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
                                                          return `${age}Y`;
                                                        })()}
                                                      </span>
                                                    )}
                                                    {/* HCP Badge */}
                                                    <span className="text-[9px] font-normal px-1.5 py-0.5 rounded-md uppercase tracking-tight bg-emerald-50 text-emerald-700 border border-emerald-100 whitespace-nowrap">
                                                      HCP {player.user?.handicap ?? 0}
                                                    </span>
                                                  </div>
                                                </td>
                                                <td className="pr-3 py-2 align-middle text-right w-[40px]">
                                                  <select
                                                    disabled={selectedTournament?.lockedGroupingsDays?.includes(selectedDay)}
                                                    value={group.id}
                                                    onChange={(e) => {
                                                      const val = e.target.value;
                                                      handleMovePlayer(player.id, val === "unassigned" ? null : val);
                                                    }}
                                                    className="bg-emerald-50 text-openclub-800 border border-emerald-100 text-[10px] font-normal rounded-md px-1 py-1 cursor-pointer focus:ring-0 opacity-0 group-hover/player:opacity-100 transition-opacity disabled:opacity-0 disabled:cursor-not-allowed max-w-[20px] overflow-hidden hover:max-w-none"
                                                  >
                                                    <option value={group.id}>☰</option>
                                                    <option value="unassigned">Unassign</option>
                                                    {groupingsData.groups.map((g: GroupingItem) => g.id !== group.id && <option key={g.id} value={g.id}>{g.name}</option>)}
                                                  </select>
                                                </td>
                                              </tr>
                                            ))}
                                            {Array.from({ length: Math.max(0, capacity - occupancy) }).map((_, i) => (
                                              <tr key={`empty-${i}`} className="opacity-40">
                                                <td className="pl-3 py-2 w-[36px] align-middle">
                                                  <div className="w-7 h-7 rounded-full bg-background border border-dashed border-gray-300" />
                                                </td>
                                                <td className="py-2 px-2 align-middle" colSpan={3}>
                                                  <div className="text-[11px] font-normal text-gray-400 italic">Available Space</div>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                            {groupingsData.groups.length > groupsPerPage && (
                              <div className="pt-4 flex items-center justify-between bg-white p-4 rounded-xl border border-[#e1efe5]">
                                <p className="text-[13px] text-gray-500 font-normal">
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

                        {groupingsSubTab === "unassigned" && (
                          <div className="bg-white border border-[#e1efe5] rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="p-4 border-b border-[#e1efe5] bg-background/30 flex items-center justify-between">
                              <h4 className="text-[13px] font-normal text-gray-900 flex items-center gap-2">
                                <Users className="w-4 h-4 text-openclub-700" />
                                Unassigned Participants
                              </h4>
                              <Badge variant="outline" className="bg-emerald-50 text-openclub-800 border-emerald-100 font-normal px-2 py-0.5">
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
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left">
                                        <thead>
                                          <tr className="border-b border-[#e1efe5] bg-background/50">
                                            <th className="px-4 py-3 text-[11px] font-normal text-gray-500 uppercase tracking-wider">Player</th>
                                            <th className="px-4 py-3 text-[11px] font-normal text-gray-500 uppercase tracking-wider">Attributes</th>
                                            <th className="px-4 py-3 text-[11px] font-normal text-gray-500 uppercase tracking-wider text-right">Action</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#efefef]">
                                          {paginated.length > 0 ? (
                                            paginated.map((player: GroupingPlayer) => (
                                              <tr key={player.id} className="hover:bg-[#fafafa] transition-colors group/row">
                                                <td className="pl-4 py-3 align-middle">
                                                  <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-[#e1efe5] bg-white shadow-sm">
                                                      <img
                                                        src={player.user?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.user?.email || player.id)}`}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                      />
                                                    </div>
                                                    <div className="min-w-0">
                                                      <NextLink href="#" className="block truncate">
                                                        <div className="text-[13px] text-gray-900 font-normal hover:text-openclub-800 transition-colors truncate">
                                                          {player.user?.firstName} {player.user?.lastName}
                                                        </div>
                                                      </NextLink>
                                                    </div>
                                                  </div>
                                                </td>
                                                <td className="py-3 px-4 align-middle">
                                                  <div className="flex flex-wrap items-center gap-1.5">
                                                    {/* Gender Badge */}
                                                    {player.user?.gender && (
                                                      <span className={cn(
                                                        "text-[10px] font-normal px-2 py-0.5 rounded-md uppercase tracking-tight border whitespace-nowrap",
                                                        player.user.gender.toUpperCase() === 'MALE' ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-pink-50 text-pink-700 border-pink-100"
                                                      )}>
                                                        {player.user.gender}
                                                      </span>
                                                    )}
                                                    {/* Category Badge */}
                                                    {player.user?.handicap !== undefined && (
                                                      <span className="text-[10px] font-normal px-2 py-0.5 rounded-md uppercase tracking-tight bg-purple-50 text-purple-700 border border-purple-100 whitespace-nowrap">
                                                        {getGolfCategory(player.user.handicap)}
                                                      </span>
                                                    )}
                                                    {/* Age Badge */}
                                                    {player.user?.dob && (
                                                      <span className="text-[10px] font-normal px-2 py-0.5 rounded-md uppercase tracking-tight bg-orange-50 text-orange-700 border border-orange-100 whitespace-nowrap">
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
                                                    {/* HCP Badge */}
                                                    <span className="text-[10px] font-normal px-2 py-0.5 rounded-md uppercase tracking-tight bg-emerald-50 text-emerald-700 border border-emerald-100 whitespace-nowrap">
                                                      HCP {player.user?.handicap ?? 0}
                                                    </span>
                                                  </div>
                                                </td>
                                                <td className="pr-4 py-3 align-middle text-right">
                                                  <select
                                                    disabled={selectedTournament?.lockedGroupingsDays?.includes(selectedDay)}
                                                    value="unassigned"
                                                    onChange={(e) => {
                                                      const val = e.target.value;
                                                      if (val !== "unassigned") {
                                                        handleMovePlayer(player.id, val);
                                                      }
                                                    }}
                                                    className="bg-white text-gray-600 border border-[#e1efe5] text-[11px] font-normal rounded-md px-2 py-1.5 cursor-pointer focus:ring-0 hover:border-openclub-700 transition-colors disabled:opacity-0 disabled:cursor-not-allowed shadow-sm"
                                                  >
                                                    <option value="unassigned">Assign To...</option>
                                                    {groupingsData.groups.map((g: GroupingItem) => (
                                                      <option key={g.id} value={g.id}>{g.name}</option>
                                                    ))}
                                                  </select>
                                                </td>
                                              </tr>
                                            ))
                                          ) : (
                                            <tr>
                                              <td colSpan={3} className="px-4 py-12">
                                                <EmptyState
                                                  variant="minimal"
                                                  title="No players found"
                                                  description="No unassigned players matching your search query."
                                                />
                                              </td>
                                            </tr>
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                    {filtered.length > unassignedPerPage && (
                                      <div className="pt-4 flex items-center justify-between border-t border-[#e1efe5]">
                                        <p className="text-[13px] text-gray-500 font-normal">
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
                        description={`Use the Auto Group Players to distribute players into groups for Day ${selectedDay}.`}
                      />
                    )}

                  </>
                )}
              </div>
            )}

            {/* TABS 5: Leaderboard */}
            {activeTab === "leaderboard" && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {/* Day Selection Tabs (Styled like AccoReg GenderTabs) */}
                <div className="flex items-center justify-between pb-2 border-b border-[#e1efe5]">
                  <div className="flex items-center gap-1 bg-gray-100/50 p-1.5 rounded-xl border border-gray-200">
                    <button
                      onClick={() => setSelectedLeaderboardDay("all")}
                      className={cn(
                        "px-10 py-3 text-[14px] font-normal rounded-xl transition-all duration-300",
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
                          "px-10 py-3 text-[14px] font-normal rounded-xl transition-all duration-300",
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
                    <span className="text-[11px] font-normal text-openclub-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-2 shadow-sm">
                      <Activity className="w-3.5 h-3.5" />
                      Viewing: {selectedLeaderboardDay === "all" ? "Tournament Total" : `Day ${selectedLeaderboardDay} Results`}
                    </span>
                  </div>
                </div>

                {isCutPending && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-4 shadow-sm animate-in slide-in-from-top-2">
                    <div className="flex gap-4">
                      <div className="bg-white p-2 rounded-full shadow-sm border border-red-100 h-fit">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                      </div>
                      <div>
                        <h4 className="text-red-900 font-normal text-[14px]">Tournament Cut-Off Required</h4>
                        <p className="text-red-700 text-[13px] mt-1 font-normal max-w-2xl">
                          A cut is configured after Round {selectedTournament?.cutAfterRound}. Once all scores for this round are finalized and verified, please apply the cut to generate the advancing players' list.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setShowCutModal(true)}
                      disabled={applyingCut}
                      className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-11 px-6 text-[14px] font-normal shadow-sm transition-colors border border-red-700/20 whitespace-nowrap"
                    >
                      {applyingCut ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><line x1="9" y1="17" x2="15" y2="17" /><line x1="9" y1="13" x2="15" y2="13" /></svg>}
                      Apply Cut-Off
                    </Button>
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
                  <div className="space-y-1">
                    <h3 className="text-[15px] font-medium text-gray-900 flex items-center gap-2">
                      Live Standings
                      <span className="text-[10px] font-normal bg-emerald-50 text-openclub-800 px-2 py-0.5 rounded-lg border border-emerald-100 uppercase">
                        Live
                      </span>
                    </h3>
                    <p className="text-[13px] text-gray-500">Real-time ranking based on {selectedLeaderboardDay === "all" ? "all played holes" : `holes played on Day ${selectedLeaderboardDay}`}.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">

                    <SearchableSelect
                      value={leaderboardGenderFilter}
                      onValueChange={setLeaderboardGenderFilter}
                      options={[
                        { value: "ALL", label: "Gender" },
                        { value: "MALE", label: "Male" },
                        { value: "FEMALE", label: "Female" },
                      ]}
                      className="min-w-[120px]"
                      triggerClassName="h-10 bg-[#f8f9fa] font-normal"
                    />

                    {/* Category Filter */}
                    <SearchableSelect
                      value={leaderboardCategoryFilter}
                      onValueChange={setLeaderboardCategoryFilter}
                      options={[
                        { value: "ALL", label: "Division" },
                        { value: "Category 1", label: "Category 1" },
                        { value: "Category 2", label: "Category 2" },
                        { value: "Category 3", label: "Category 3" },
                        { value: "Category 4", label: "Category 4" },
                        { value: "Category 5/6", label: "Category 5/6" },
                        { value: "Open", label: "Open" },
                      ]}
                      className="min-w-[140px]"
                      triggerClassName="h-10 bg-[#f8f9fa] font-normal"
                    />

                    {/* Sort Filter */}
                    <SearchableSelect
                      value={leaderboardSortBy}
                      onValueChange={(v) => setLeaderboardSortBy(v as "NET" | "GROSS")}
                      options={[
                        { value: "NET", label: "Net Score" },
                        { value: "GROSS", label: "Gross Score" },
                      ]}
                      className="min-w-[140px]"
                      triggerClassName="h-10 bg-[#f8f9fa] font-normal"
                    />
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Type player name or email to search..."
                    value={leaderboardSearch}
                    onChange={(e) => setLeaderboardSearch(e.target.value)}
                    className="pl-10 h-12 bg-background/50 border-gray-200 focus:bg-white rounded-xl text-[14px]"
                  />
                </div>

                {leaderboardLoading ? (
                  <div className="bg-white border border-[#e1efe5] rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-background/50 border-b border-[#e1efe5]">
                            <th className="px-6 py-4 text-[11px] font-normal text-gray-400 uppercase tracking-wider w-16 text-center">Pos</th>
                            <th className="px-6 py-4 text-[11px] font-normal text-gray-400 uppercase tracking-wider">Player</th>
                            <th className="px-6 py-4 text-[11px] font-normal text-gray-400 uppercase tracking-wider text-center">Division</th>
                            {selectedLeaderboardDay === "all" && getTournamentDays() > 1 && Array.from({ length: getTournamentDays() }).map((_, i) => (
                              <th key={`h-r${i}`} className="px-6 py-4 text-[11px] font-normal text-gray-400 uppercase tracking-wider text-center">R{i + 1}</th>
                            ))}
                            <th className="px-6 py-4 text-[11px] font-normal text-gray-400 uppercase tracking-wider text-center">Holes</th>
                            <th className="px-6 py-4 text-[11px] font-normal text-gray-400 uppercase tracking-wider text-center">Total Gross</th>
                            <th className="px-6 py-4 text-[11px] font-normal text-gray-400 uppercase tracking-wider text-center">HCP</th>
                            <th className="px-6 py-4 text-[11px] font-normal text-openclub-800 uppercase tracking-wider text-center">Net</th>
                            <th className="px-6 py-4 text-[11px] font-normal text-gray-400 uppercase tracking-wider text-center">To Par</th>
                            <th className="px-6 py-4 text-[11px] font-normal text-gray-400 uppercase tracking-wider text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {Array.from({ length: leaderboardPerPage }).map((_, i) => (
                            <tr key={`sk-${i}`} className="hover:bg-background/50 transition-colors">
                              <td className="px-6 py-4"><Skeleton className="w-8 h-8 rounded-lg mx-auto" /></td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <Skeleton className="w-9 h-9 rounded-lg" />
                                  <div className="space-y-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4"><Skeleton className="h-5 w-12 rounded-lg mx-auto" /></td>
                              {selectedLeaderboardDay === "all" && getTournamentDays() > 1 && Array.from({ length: getTournamentDays() }).map((_, j) => (
                                <td key={`sk-r${j}`} className="px-6 py-4"><Skeleton className="h-4 w-6 mx-auto" /></td>
                              ))}
                              <td className="px-6 py-4"><Skeleton className="h-4 w-10 mx-auto" /></td>
                              <td className="px-6 py-4"><Skeleton className="h-4 w-8 mx-auto" /></td>
                              <td className="px-6 py-4"><Skeleton className="h-5 w-8 rounded-lg mx-auto" /></td>
                              <td className="px-6 py-4"><Skeleton className="h-4 w-8 mx-auto" /></td>
                              <td className="px-6 py-4"><Skeleton className="h-5 w-10 mx-auto" /></td>
                              <td className="px-6 py-4"><Skeleton className="h-5 w-16 rounded-lg mx-auto" /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (() => {
                  const q = leaderboardSearch.trim().toLowerCase();
                  const filteredData = leaderboardData.filter(entry => {
                    if (q) {
                      const matchesSearch = entry.user.firstName?.toLowerCase().includes(q) ||
                        entry.user.lastName?.toLowerCase().includes(q) ||
                        entry.user.email?.toLowerCase().includes(q) ||
                        `${entry.user.firstName} ${entry.user.lastName}`.toLowerCase().includes(q);
                      if (!matchesSearch) return false;
                    }
                    if (leaderboardGenderFilter !== "ALL" && entry.user.gender !== leaderboardGenderFilter) return false;
                    if (leaderboardCategoryFilter !== "ALL" && getGolfCategory(entry.user.handicap) !== leaderboardCategoryFilter) return false;
                    return true;
                  });

                  if (filteredData.length === 0 && !q) {
                    return (
                      <EmptyState
                        icon={Trophy}
                        title="No Leaderboard Data"
                        description="No scores have been recorded for this tournament yet."
                      />
                    );
                  }

                  if (filteredData.length === 0 && q) {
                    return (
                      <div className="bg-white border border-[#e1efe5] rounded-xl shadow-sm p-16 text-center">
                        <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-[14px] font-normal text-gray-900">No players found</h3>
                        <p className="text-gray-500 mt-1">We couldn't find anyone matching "{leaderboardSearch}"</p>
                      </div>
                    );
                  }

                  return (
                    <div className="bg-white border border-[#e1efe5] rounded-xl shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-background/50 border-b border-[#e1efe5]">
                              <th className="px-6 py-4 text-[11px] font-normal text-gray-400 uppercase tracking-wider w-16 text-center">Pos</th>
                              <th className="px-6 py-4 text-[11px] font-normal text-gray-400 uppercase tracking-wider">Player</th>
                              <th className="px-6 py-4 text-[11px] font-normal text-gray-400 uppercase tracking-wider text-center">Division</th>
                              {selectedLeaderboardDay === "all" && getTournamentDays() > 1 && Array.from({ length: getTournamentDays() }).map((_, i) => (
                                <th key={`h-r${i}`} className="px-6 py-4 text-[11px] font-normal text-gray-400 uppercase tracking-wider text-center">R{i + 1}</th>
                              ))}
                              <th className="px-6 py-4 text-[11px] font-normal text-gray-400 uppercase tracking-wider text-center">Holes</th>
                              <th className="px-6 py-4 text-[11px] font-normal text-gray-400 uppercase tracking-wider text-center">Total Gross</th>
                              <th className="px-6 py-4 text-[11px] font-normal text-gray-400 uppercase tracking-wider text-center">HCP</th>
                              <th className="px-6 py-4 text-[11px] font-normal text-openclub-800 uppercase tracking-wider text-center">Net</th>
                              <th className="px-6 py-4 text-[11px] font-normal text-gray-400 uppercase tracking-wider text-center">To Par</th>
                              <th className="px-6 py-4 text-[11px] font-normal text-gray-400 uppercase tracking-wider text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {filteredData.slice((leaderboardPage - 1) * leaderboardPerPage, leaderboardPage * leaderboardPerPage).map((entry, index, array) => {
                              const rank = (leaderboardPage - 1) * leaderboardPerPage + index + 1;
                              const isFirstMissedCut = selectedLeaderboardDay === "all" && entry.madeCut === false && (index === 0 || array[index - 1].madeCut !== false);
                              return (
                                <React.Fragment key={entry.user.id}>
                                  {isFirstMissedCut && (
                                    <tr>
                                      <td colSpan={20} className="px-0 py-0 bg-background">
                                        <div className="flex items-center justify-center py-3 border-y-2 border-dashed border-red-300">
                                          <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full shadow-sm border border-red-200">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
                                            <span className="text-[11px] font-normal text-red-600 uppercase tracking-widest">Cut Line</span>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                  <tr className="hover:bg-background/50 transition-colors group">
                                    <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center">
                                      {entry.status === "DISQUALIFIED" ? (
                                        <span className="text-[10px] font-normal text-red-500 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100 uppercase tracking-tight">DQ</span>
                                      ) : rank === 1 ? (
                                        <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center border border-yellow-200 shadow-sm">
                                          <Trophy className="w-4 h-4 text-yellow-600" />
                                        </div>
                                      ) : rank === 2 ? (
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200 shadow-sm">
                                          <Award className="w-4 h-4 text-gray-400" />
                                        </div>
                                      ) : rank === 3 ? (
                                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-200 shadow-sm">
                                          <Award className="w-4 h-4 text-orange-600" />
                                        </div>
                                      ) : (
                                        <span className="text-[13px] font-normal text-gray-400">{rank}</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 rounded-full overflow-hidden border border-[#e1efe5] bg-white shadow-sm shrink-0">
                                        <img
                                          src={entry.user.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(entry.user.email)}`}
                                          className="w-full h-full object-cover"
                                          alt=""
                                        />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-[13px] font-medium text-gray-900 truncate">
                                          {entry.user.firstName} {entry.user.lastName}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-normal truncate">
                                          {entry.user.email}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="text-[11px] font-normal text-gray-500 bg-background px-2 py-0.5 rounded-lg border border-[#e1efe5] uppercase tracking-tight whitespace-nowrap">
                                      {getGolfCategory(entry.user.handicap)}
                                    </span>
                                  </td>
                                  {selectedLeaderboardDay === "all" && getTournamentDays() > 1 && Array.from({ length: getTournamentDays() }).map((_, i) => {
                                    const day = i + 1;
                                    const isAfterCut = selectedTournament?.enableCut && day > (selectedTournament?.cutAfterRound || 0);
                                    const missedCut = entry.madeCut === false;

                                    if (isAfterCut && missedCut) {
                                      return (
                                        <td key={`r-${i}`} className="px-6 py-4 text-center">
                                          <span className="text-[10px] font-normal text-red-500 bg-red-50 px-2 py-0.5 rounded-lg uppercase tracking-tight" title="Missed Cut">MC</span>
                                        </td>
                                      );
                                    }

                                    return (
                                      <td key={`r-${i}`} className="px-6 py-4 text-center">
                                        <span className="text-[13px] font-normal text-gray-700">{entry.rounds[day] || "-"}</span>
                                      </td>
                                    );
                                  })}
                                  <td className="px-6 py-4 text-center">
                                    <div className="space-y-1.5">
                                      <span className="text-[12px] font-normal text-gray-600">
                                        {entry.grossStrokes > 0 ? `${entry.holesCount}/${selectedLeaderboardDay === "all" ? 18 * getTournamentDays() : 18}` : "-"}
                                      </span>
                                      {entry.grossStrokes > 0 && (
                                        <div className="w-20 mx-auto h-1 bg-gray-100 rounded-lg overflow-hidden">
                                          <div
                                            className="h-full bg-openclub-700 rounded-lg transition-all duration-500"
                                            style={{ width: `${(entry.holesCount / (selectedLeaderboardDay === "all" ? 18 * getTournamentDays() : 18)) * 100}%` }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center justify-center gap-1">
                                      <span className="text-[13px] font-normal text-gray-700">{entry.grossStrokes > 0 ? entry.grossStrokes : "-"}</span>
                                      {entry.extraStrokes > 0 && (
                                        <span className="text-[9px] font-normal text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md uppercase border border-red-100 tracking-tight whitespace-nowrap" title={`${entry.extraStrokes} Penalty Strokes`}>
                                          +{entry.extraStrokes} Pen
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="text-[11px] font-normal text-gray-400 bg-background px-2 py-0.5 rounded-lg border border-[#e1efe5]">
                                      {entry.user.handicap || 0}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="text-[15px] font-normal text-gray-700">
                                      {entry.grossStrokes > 0 ? entry.netStrokes : "-"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className={cn(
                                      "text-[15px] font-normal",
                                      entry.toPar < 0 ? "text-red-600" : entry.toPar > 0 ? "text-gray-900" : "text-openclub-800"
                                    )}>
                                      {entry.grossStrokes > 0 ? (entry.toPar > 0 ? `+${entry.toPar}` : entry.toPar === 0 ? "E" : entry.toPar) : "-"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    {entry.status === "DISQUALIFIED" ? (
                                      <span className="text-[10px] font-normal bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full uppercase tracking-wider">DQ</span>
                                    ) : entry.madeCut === false ? (
                                      <span className="text-[10px] font-normal bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">Missed Cut</span>
                                    ) : entry.grossStrokes > 0 ? (
                                      entry.holesCount === (selectedLeaderboardDay === "all" ? 18 * getTournamentDays() : 18) ? (
                                        <span className="text-[10px] font-normal bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-wider">Finished</span>
                                      ) : (
                                        <span className="text-[10px] font-normal bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">Live</span>
                                      )
                                    ) : (
                                      <span className="text-[10px] font-normal bg-background text-gray-400 px-2 py-0.5 rounded-full uppercase tracking-wider">Not Started</span>
                                    )}
                                  </td>
                                  </tr>
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })()}

                {(() => {
                  const q = leaderboardSearch.trim().toLowerCase();
                  const filteredData = q
                    ? leaderboardData.filter(entry =>
                      entry.user.firstName?.toLowerCase().includes(q) ||
                      entry.user.lastName?.toLowerCase().includes(q) ||
                      entry.user.email?.toLowerCase().includes(q) ||
                      `${entry.user.firstName} ${entry.user.lastName}`.toLowerCase().includes(q)
                    )
                    : leaderboardData;

                  if (filteredData.length > 0) {
                    return (
                      <div className="p-4 border-t border-[#e1efe5] flex justify-end bg-background/30">
                        <Pagination
                          currentPage={leaderboardPage}
                          totalPages={Math.max(1, Math.ceil(filteredData.length / leaderboardPerPage))}
                          onPageChange={setLeaderboardPage}
                        />
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}

            {/* TABS 6: Overview */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Statistics Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl p-4 border border-[#e1efe5] flex flex-col justify-between shadow-sm">
                    <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest mb-3">Registrations</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[16px] font-normal text-gray-900">{formatWithCommas(registrationsTournamentTotal)}</p>
                        <p className="text-[11px] text-gray-505 font-normal mt-0.5">Total Players</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-[#e1efe5] flex flex-col justify-between shadow-sm">
                    <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest mb-3">Entry Fee</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[16px] font-normal text-gray-900">{formatNaira(selectedTournament.entryFee)}</p>
                        <p className="text-[11px] text-gray-550 font-normal mt-0.5">Per Registration</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-openclub-800">
                        <Wallet className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-[#e1efe5] flex flex-col justify-between shadow-sm">
                    <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest mb-3">Capacity</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[16px] font-normal text-gray-900">
                          {selectedTournament.maxPlayers ? formatWithCommas(selectedTournament.maxPlayers) : "∞"}
                        </p>
                        <p className="text-[11px] text-gray-550 font-normal mt-0.5">Player Limit</p>
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
                  <div className="p-6 rounded-xl border border-[#e1efe5] bg-white space-y-6">
                    <div className="flex items-center gap-4 border-b border-[#e1efe5] pb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200 flex-shrink-0 shadow-sm">
                        {courseDetails?.coverImage ? (
                          <img src={courseDetails.coverImage} className="w-full h-full object-cover" />
                        ) : (
                          <Flag className="w-7 h-7 text-openclub-800" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-[16px] font-normal text-gray-900 leading-tight">
                          {courseDetails?.name || "Golf Course details"}
                        </h3>
                        <p className="text-[11px] text-gray-500 mt-1">
                          {courseDetails?.address || "No address listed"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-background/60 rounded-xl border border-[#e1efe5]">
                        <span className="text-[10px] font-normal text-gray-400 uppercase block">Holes</span>
                        <span className="text-[15px] font-normal text-gray-800">{courseDetails?.holes || "—"} Holes</span>
                      </div>
                      <div className="p-3 bg-background/60 rounded-xl border border-[#e1efe5]">
                        <span className="text-[10px] font-normal text-gray-400 uppercase block">Par</span>
                        <span className="text-[15px] font-normal text-gray-800">Par {courseDetails?.par || "—"}</span>
                      </div>
                      <div className="p-3 bg-background/60 rounded-xl border border-[#e1efe5]">
                        <span className="text-[10px] font-normal text-gray-400 uppercase block">Slope Rating</span>
                        <span className="text-[15px] font-normal text-gray-800">{courseDetails?.slopeRating || "—"}</span>
                      </div>
                      <div className="p-3 bg-background/60 rounded-xl border border-[#e1efe5]">
                        <span className="text-[10px] font-normal text-gray-400 uppercase block">Architect</span>
                        <span className="text-[15px] font-normal text-gray-800 truncate block">{courseDetails?.architect || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Scoring Rules Box */}
                  <div className="p-6 rounded-xl border border-[#e1efe5] bg-white space-y-6">
                    <div className="flex items-center gap-4 border-b border-[#e1efe5] pb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-50 flex items-center justify-center border border-blue-100 flex-shrink-0 shadow-sm text-blue-600">
                        <Activity className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-[16px] font-normal text-gray-900 leading-tight">
                          Scoring Rules
                        </h3>
                        <p className="text-[11px] text-gray-500 mt-1">
                          Configuration for format and scoring verification
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-background/60 rounded-xl border border-[#e1efe5]">
                        <span className="text-[10px] font-normal text-gray-400 uppercase block">Format</span>
                        <span className="text-[14px] font-normal text-gray-800">{(selectedTournament as any).format?.replace('_', ' ') || "STROKE PLAY"}</span>
                      </div>
                      <div className="p-3 bg-background/60 rounded-xl border border-[#e1efe5]">
                        <span className="text-[10px] font-normal text-gray-400 uppercase block">Scoring Type</span>
                        <span className="text-[14px] font-normal text-gray-800">{(selectedTournament as any).scoringType || "GROSS"}</span>
                      </div>
                      <div className="p-3 bg-background/60 rounded-xl border border-[#e1efe5]">
                        <span className="text-[10px] font-normal text-gray-400 uppercase block">Live Scoring</span>
                        <span className={cn(
                          "text-[12px] font-normal px-2 py-0.5 rounded-full mt-1 inline-block",
                          (selectedTournament as any).enableLiveScoring ? "bg-emerald-50 text-openclub-800 border border-emerald-100" : "bg-gray-100 text-gray-500 border border-gray-200"
                        )}>
                          {(selectedTournament as any).enableLiveScoring ? "ENABLED" : "DISABLED"}
                        </span>
                      </div>
                      <div className="p-3 bg-background/60 rounded-xl border border-[#e1efe5]">
                        <span className="text-[10px] font-normal text-gray-400 uppercase block">Marker Verification</span>
                        <span className={cn(
                          "text-[12px] font-normal px-2 py-0.5 rounded-full mt-1 inline-block",
                          (selectedTournament as any).requireMarkerVerification ? "bg-emerald-50 text-openclub-800 border border-emerald-100" : "bg-gray-100 text-gray-500 border border-gray-200"
                        )}>
                          {(selectedTournament as any).requireMarkerVerification ? "REQUIRED" : "NOT REQUIRED"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Organiser Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 rounded-xl border border-[#e1efe5] bg-white space-y-6">
                    <div className="flex items-center gap-4 border-b border-[#e1efe5] pb-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200 flex-shrink-0 shadow-sm">
                        {clubDetails?.logo ? (
                          <img src={clubDetails.logo} className="w-full h-full object-cover" />
                        ) : (
                          <Trophy className="w-7 h-7 text-emerald-650" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-[16px] font-normal text-gray-900 leading-tight">
                          {clubDetails?.name || selectedTournament.clubName}
                        </h3>
                        <p className="text-[11px] text-gray-500 mt-1">
                          {clubDetails?.address || "No address listed"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-background/60 rounded-xl border border-[#e1efe5]">
                        <span className="text-[10px] font-normal text-gray-400 uppercase block">Status</span>
                        <span className="text-[13px] font-normal text-openclub-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full mt-1.5 inline-block">
                          {clubDetails?.status || "ACTIVE"}
                        </span>
                      </div>
                      <div className="p-3 bg-background/60 rounded-xl border border-[#e1efe5]">
                        <span className="text-[10px] font-normal text-gray-400 uppercase block">Plan tier</span>
                        <span className="text-[13px] font-normal text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full mt-1.5 inline-block">
                          {clubDetails?.plan || "PRO"}
                        </span>
                      </div>
                      <div className="p-3 bg-background/60 rounded-xl border border-[#e1efe5] col-span-2">
                        <span className="text-[10px] font-normal text-gray-400 uppercase block">Admin Email</span>
                        <span className="text-[14px] font-normal text-gray-800 truncate block mt-0.5">{clubDetails?.adminEmail || "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "penalize" && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e1efe5] pb-4">
                  <div>
                    <h2 className="text-[15px] font-medium text-gray-900">Penalize Player</h2>
                    <p className="text-[12px] text-gray-500 mt-1">Apply stroke play penalties or disqualify players for rule infractions.</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 mb-4">
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
                      className="pl-10 h-11 bg-background/50 border-gray-200 focus:bg-white rounded-xl text-[14px]"
                    />
                  </div>
                  <SearchableSelect
                    value={penalizeStrokesFilter}
                    onValueChange={(v: any) => {
                      setRegistrationsPage(1);
                      setPenalizeStrokesFilter(v);
                    }}
                    options={[
                      { value: "ALL", label: "All Players" },
                      { value: "WITH_STROKES", label: "With Strokes" },
                    ]}
                    className="min-w-[180px]"
                    triggerClassName="h-11 bg-[#f8f9fa]"
                  />
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="flex gap-2 bg-background/50 p-1.5 rounded-xl w-fit border border-[#e1efe5]">
                    <button
                      onClick={() => setPenalizeFilter("APPROVED")}
                      className={cn(
                        "px-4 py-2 text-[13px] font-normal rounded-lg transition-all",
                        penalizeFilter === "APPROVED" ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100/50"
                      )}
                    >
                      Active Players
                    </button>
                    <button
                      onClick={() => setPenalizeFilter("DISQUALIFIED")}
                      className={cn(
                        "px-4 py-2 text-[13px] font-normal rounded-lg transition-all",
                        penalizeFilter === "DISQUALIFIED" ? "bg-red-50 text-red-700 shadow-sm border border-red-200" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100/50"
                      )}
                    >
                      Disqualified Players
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {(() => {
                    const penalizeSearchQuery = registrationsSearch.trim().toLowerCase();
                    const penalizeListAll = registrationsMode === "client" ? registrationsAll.filter(r => {
                      const matchesStatus = r.status === penalizeFilter;
                      const matchesStrokes = penalizeStrokesFilter === "WITH_STROKES" ? (r.extraStrokes ?? 0) > 0 : true;
                      const tokens = penalizeSearchQuery.split(/[\s-]+/).filter(Boolean);
                      const searchableFields = [r.user?.firstName, r.user?.lastName, r.user?.email, `${r.user?.firstName} ${r.user?.lastName}`, `${r.user?.lastName} ${r.user?.firstName}`];
                      const matchesSearch = tokens.length === 0 || tokens.every(token => searchableFields.some(field => field?.toLowerCase().includes(token)));
                      return matchesStatus && matchesSearch && matchesStrokes;
                    }) : registrationsPageItems.filter(r => {
                      const matchesStatus = r.status === penalizeFilter;
                      const matchesStrokes = penalizeStrokesFilter === "WITH_STROKES" ? (r.extraStrokes ?? 0) > 0 : true;
                      return matchesStatus && matchesStrokes;
                    });

                    const penalizePageItems = registrationsMode === "client"
                      ? penalizeListAll.slice((registrationsPage - 1) * registrationsPerPage, registrationsPage * registrationsPerPage)
                      : penalizeListAll;

                    const penalizeTotalPages = registrationsMode === "client"
                      ? Math.max(1, Math.ceil(penalizeListAll.length / registrationsPerPage))
                      : Math.max(1, Math.ceil(registrationsFilteredTotal / registrationsPerPage));

                    return (
                      <>
                        {registrationsLoading ? (
                          <div className="border border-[#e1efe5] rounded-xl overflow-hidden bg-white">
                            <div className="flex flex-col">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center justify-between p-4 border-b border-[#e1efe5] last:border-0">
                                  <div className="flex items-center gap-4 w-1/3">
                                    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                                    <div className="space-y-2 flex-1">
                                      <Skeleton className="h-4 w-3/4" />
                                      <Skeleton className="h-3 w-1/2" />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 w-1/4 hidden sm:flex">
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                  </div>
                                  <div className="flex items-center justify-end gap-2 w-1/4 text-right">
                                    <Skeleton className="h-9 w-9 rounded-lg" />
                                    <Skeleton className="h-9 w-9 rounded-lg" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : penalizePageItems.length > 0 ? (
                          <div className="bg-white border border-[#e1efe5] rounded-xl shadow-sm overflow-hidden overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                              <thead>
                                <tr className="bg-[#fafafa] border-b border-[#e1efe5] text-[12px] font-normal text-gray-500 uppercase tracking-wider">
                                  <th className="px-4 py-4">Player</th>
                                  <th className="px-4 py-4">Status</th>
                                  <th className="px-4 py-4 text-center">Handicap / Penalty</th>
                                  <th className="px-4 py-4 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#efefef] bg-white">
                                {penalizePageItems.map((r) => {
                                  const isDisqualified = r.status === "DISQUALIFIED";
                                  return (
                                    <tr
                                      key={r.id}
                                      className={cn(
                                        "transition-all hover:bg-background/50",
                                        isDisqualified ? "bg-red-50/10 opacity-75" : ""
                                      )}
                                    >
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-[#e1efe5]">
                                            <img
                                              src={r.user?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(r.user?.email || "avatar")}`}
                                              alt=""
                                              className="w-full h-full object-cover"
                                            />
                                          </div>
                                          <div className="min-w-0">
                                            <NextLink href={`/super-admin/users/${r.user?.id}`} className="block">
                                              <p className="text-[14px] font-medium text-gray-900 truncate hover:text-openclub-800 transition-colors">
                                                {r.user?.firstName} {r.user?.lastName}
                                              </p>
                                            </NextLink>
                                            <p className="text-[12px] text-gray-500 truncate mt-0.5">{r.user?.email}</p>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                          {isDisqualified && (
                                            <span className="text-[10px] font-normal px-2 py-0.5 rounded-lg bg-red-600 text-white border border-red-700 uppercase tracking-wider">
                                              Disqualified
                                            </span>
                                          )}
                                          {!isDisqualified && r.status === "APPROVED" && (
                                            <span className="text-[10px] font-normal px-2 py-0.5 rounded-lg uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                                              Active
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                          <span className="text-[10px] font-normal px-2 py-0.5 rounded-lg uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                                            HCP {r.user?.handicap ?? 0}
                                          </span>
                                          {typeof r.extraStrokes === "number" && r.extraStrokes > 0 && (
                                            <span className="text-[10px] font-normal px-2 py-0.5 rounded-lg bg-red-50 text-red-700 border border-red-100 uppercase tracking-wider">
                                              +{r.extraStrokes} Penalty
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        {selectedTournament.statusKey !== "CANCELLED" && selectedTournament.statusKey !== "COMPLETED" && !isDisqualified && (
                                          <div className="flex flex-wrap items-center justify-end gap-2">
                                            <Button
                                              variant="outline"
                                              onClick={() => openStrokeModal(r, "ADD_1")}
                                              title="Add 1-Stroke Penalty"
                                              className="h-8 p-0 px-2 bg-white rounded-lg border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-200 flex items-center justify-center text-[11px] font-normal"
                                            >
                                              +1 Stroke
                                            </Button>
                                            <Button
                                              variant="outline"
                                              onClick={() => openStrokeModal(r, "ADD_2")}
                                              title="Add 2-Stroke Penalty"
                                              className="h-8 p-0 px-2 bg-white rounded-lg border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-200 flex items-center justify-center text-[11px] font-normal"
                                            >
                                              +2 Strokes
                                            </Button>
                                            {(r.extraStrokes ?? 0) > 0 && (
                                              <Button
                                                variant="outline"
                                                onClick={() => openStrokeModal(r, "CLEAR")}
                                                title="Clear Penalties"
                                                className="h-8 p-0 px-2 bg-white rounded-lg border-gray-200 text-gray-600 hover:bg-background flex items-center justify-center text-[11px] font-normal"
                                              >
                                                Clear
                                              </Button>
                                            )}
                                            <Button
                                              variant="outline"
                                              onClick={() => openDisqualify(r)}
                                              title="Disqualify Player"
                                              className="h-8 w-8 p-0 bg-white rounded-lg border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center"
                                            >
                                              <Ban className="w-3.5 h-3.5" />
                                            </Button>
                                          </div>
                                        )}
                                        {selectedTournament.statusKey !== "CANCELLED" && selectedTournament.statusKey !== "COMPLETED" && isDisqualified && (
                                          <div className="flex flex-wrap items-center justify-end gap-2">
                                            <Button
                                              variant="outline"
                                              onClick={() => openEnablePlayer(r)}
                                              title="Restore Player"
                                              className="h-8 p-0 px-3 bg-white rounded-lg border-emerald-200 text-openclub-800 hover:bg-openclub-800 hover:text-white transition-colors flex items-center justify-center text-[11px] font-normal gap-1.5"
                                            >
                                              <CheckCircle2 className="w-3.5 h-3.5" />
                                              Restore
                                            </Button>
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <EmptyState
                            icon={AlertTriangle}
                            title={penalizeFilter === "APPROVED" ? "No Active Players" : "No Disqualified Players"}
                            description={penalizeFilter === "APPROVED" ? "There are currently no active players matching your search." : "There are currently no disqualified players matching your search."}
                          />
                        )}

                        {/* Pagination */}
                        {!registrationsLoading && (registrationsMode === "client" ? penalizeListAll.length > 0 : registrationsTotal > 0) && (
                          <div className="mt-8">
                            <Pagination
                              currentPage={registrationsPage}
                              totalPages={penalizeTotalPages}
                              onPageChange={setRegistrationsPage}
                            />
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Helper Modals */}
      <Modal
        isOpen={strokeModalRegistration !== null && strokeModalAction !== null}
        onClose={() => { setStrokeModalRegistration(null); setStrokeModalAction(null); }}
        title={strokeModalAction === "CLEAR" ? "Clear Penalties?" : "Apply Penalty?"}
        footer={
          <>
            <Button variant="outline" onClick={() => { setStrokeModalRegistration(null); setStrokeModalAction(null); }} className="rounded-lg font-normal">
              Cancel
            </Button>
            <Button
              className={cn(
                "rounded-lg font-normal px-8 text-white border",
                strokeModalAction === "CLEAR"
                  ? "bg-gray-800 hover:bg-gray-900 border-gray-900/30"
                  : "bg-red-500 hover:bg-red-650 border-red-650/30"
              )}
              onClick={confirmStrokeAction}
            >
              Confirm
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mb-6 border",
            strokeModalAction === "CLEAR" ? "bg-amber-50 text-amber-500 border-amber-100" : "bg-red-50 text-red-500 border-red-100"
          )}>
            <AlertTriangle className="h-10 w-10 animate-bounce" />
          </div>
          <h4 className="text-[14px] font-normal text-gray-900 mb-2">
            {strokeModalAction === "ADD_1" ? "Add 1-Stroke Penalty?" :
              strokeModalAction === "ADD_2" ? "Add 2-Stroke Penalty?" : "Clear All Penalties?"}
          </h4>
          <p className="text-gray-500 max-w-sm">
            {strokeModalAction === "ADD_1" && `Are you sure you want to add a 1-stroke penalty to ${fullName(strokeModalRegistration?.user?.firstName ?? null, strokeModalRegistration?.user?.lastName ?? null)}?`}
            {strokeModalAction === "ADD_2" && `Are you sure you want to add a 2-stroke penalty to ${fullName(strokeModalRegistration?.user?.firstName ?? null, strokeModalRegistration?.user?.lastName ?? null)}?`}
            {strokeModalAction === "CLEAR" && `Are you sure you want to clear all stroke penalties for ${fullName(strokeModalRegistration?.user?.firstName ?? null, strokeModalRegistration?.user?.lastName ?? null)}?`}
          </p>
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
              className="rounded-lg font-normal px-8 text-white border bg-red-500 hover:bg-red-650 border-red-650/30"
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
          <h4 className="text-[14px] font-normal text-gray-900 mb-2">Cancel Tournament?</h4>
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
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="rounded-lg font-normal">
              Cancel
            </Button>
            <Button
              disabled={deleteConfirmText.trim().toUpperCase() !== "DELETE" || mutating}
              className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 border border-red-600/30 text-white rounded-lg font-normal px-8"
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
            <Button variant="outline" onClick={() => setIsDisqualifyModalOpen(false)} className="rounded-lg font-normal">
              Cancel
            </Button>
            <Button
              className="rounded-lg font-normal px-8 text-white border bg-amber-500 hover:bg-amber-600 border-amber-600/30"
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
          <h4 className="text-[14px] font-normal text-gray-900 mb-2">Disqualify Player?</h4>
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
          (selectedTournament?.status === "ONGOING" || selectedTournament?.status === "COMPLETED" || (selectedTournament?.lockedGroupingsDays && selectedTournament.lockedGroupingsDays.length > 0)) ? (
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
                className="rounded-lg font-normal px-8 text-white border bg-red-500 hover:bg-red-600 border-red-650/30"
                onClick={confirmRemovePlayer}
              >
                Remove
              </Button>
            </>
          )
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-red-50 text-red-500 border border-red-100">
            {(selectedTournament?.status === "ONGOING" || selectedTournament?.status === "COMPLETED" || (selectedTournament?.lockedGroupingsDays && selectedTournament.lockedGroupingsDays.length > 0)) ? (
              <Ban className="h-10 w-10 text-amber-500" />
            ) : (
              <UserMinus className="h-10 w-10" />
            )}
          </div>
          <h4 className="text-[14px] font-normal text-gray-900 mb-2">
            {(selectedTournament?.status === "ONGOING" || selectedTournament?.status === "COMPLETED" || (selectedTournament?.lockedGroupingsDays && selectedTournament.lockedGroupingsDays.length > 0)) ? "Cannot Remove Player" : "Remove Player?"}
          </h4>
          <p className="text-gray-500 max-w-sm">
            {(selectedTournament?.status === "ONGOING" || selectedTournament?.status === "COMPLETED" || (selectedTournament?.lockedGroupingsDays && selectedTournament.lockedGroupingsDays.length > 0)) ? (
              <>
                The tournament has already started. You cannot completely remove players from an ongoing tournament. Please use the <strong>Disqualify</strong> button instead.
              </>
            ) : (
              <>
                Are you sure you want to permanently remove <strong>{actionRegistration ? `${actionRegistration.user?.firstName} ${actionRegistration.user?.lastName}` : "this player"}</strong> from the tournament?
              </>
            )}
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
            <Button variant="outline" onClick={() => setIsEnablePlayerModalOpen(false)} className="rounded-lg font-normal">
              Cancel
            </Button>
            <Button
              className="rounded-lg font-normal px-8 text-white border bg-openclub-700 hover:bg-openclub-800 border-openclub-800/30"
              onClick={confirmEnablePlayer}
            >
              Enable
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-emerald-50 text-openclub-700 border border-emerald-100">
            <CheckCircle2 className="h-10 w-10 animate-bounce" />
          </div>
          <h4 className="text-[14px] font-normal text-gray-900 mb-2">Re-enable Player?</h4>
          <p className="text-gray-500 max-w-sm">
            Are you sure you want to re-enable <strong>{actionRegistration ? `${actionRegistration.user?.firstName} ${actionRegistration.user?.lastName}` : "this player"}</strong>?
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={isResetGroupingsModalOpen}
        onClose={() => setIsResetGroupingsModalOpen(false)}
        title="Reset All Flights & Tee Times?"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsResetGroupingsModalOpen(false)} className="rounded-lg font-normal">
              Cancel
            </Button>
            <Button
              className="rounded-lg font-normal px-8 text-white border bg-red-500 hover:bg-red-600 border-red-600/30"
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
          <h4 className="text-[14px] font-normal text-gray-900 mb-2">Reset Flights & Tee Times?</h4>
          <p className="text-gray-500 max-w-sm">
            Are you sure you want to reset all groupings for Day {selectedDay}? This will delete all groups and mark all players as unassigned.
          </p>
        </div>
      </Modal>

      {/* Waitlist Approve Modal */}
      <Modal
        isOpen={isApproveWaitlistModalOpen}
        onClose={() => setIsApproveWaitlistModalOpen(false)}
        title={(selectedTournament?.status === "ONGOING" || selectedTournament?.status === "COMPLETED" || (selectedTournament?.lockedGroupingsDays && selectedTournament.lockedGroupingsDays.length > 0)) ? "Action Restricted" : (selectedWaitlistIds.length > 1 ? "Approve Players?" : "Approve Player?")}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsApproveWaitlistModalOpen(false)} className="rounded-lg font-normal">
              {(selectedTournament?.status === "ONGOING" || selectedTournament?.status === "COMPLETED" || (selectedTournament?.lockedGroupingsDays && selectedTournament.lockedGroupingsDays.length > 0)) ? "Close" : "Cancel"}
            </Button>
            {!(selectedTournament?.status === "ONGOING" || selectedTournament?.status === "COMPLETED" || (selectedTournament?.lockedGroupingsDays && selectedTournament.lockedGroupingsDays.length > 0)) && (
              <Button
                className="rounded-lg font-normal px-8 text-white border bg-openclub-700 hover:bg-openclub-800 border-openclub-800/30"
                onClick={() => handleApproveWaitlist(selectedWaitlistIds)}
                disabled={waitlistActionId === "processing"}
              >
                {waitlistActionId === "processing" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Approve
              </Button>
            )}
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          {(selectedTournament?.status === "ONGOING" || selectedTournament?.status === "COMPLETED" || (selectedTournament?.lockedGroupingsDays && selectedTournament.lockedGroupingsDays.length > 0)) ? (
            <>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-red-50 text-red-500 border border-red-100">
                <Ban className="h-10 w-10" />
              </div>
              <h4 className="text-[14px] font-normal text-gray-900 mb-2">Tournament In Progress</h4>
              <p className="text-gray-500 max-w-sm">
                Cannot approve waitlist. The tournament has already started.
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-emerald-50 text-openclub-700 border border-emerald-100">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h4 className="text-[14px] font-normal text-gray-900 mb-2">
                Approve {selectedWaitlistIds.length > 1 ? `${selectedWaitlistIds.length} Players` : "Player"}?
              </h4>
              <p className="text-gray-500 max-w-sm">
                Are you sure you want to approve {selectedWaitlistIds.length > 1 ? "these players" : "this player"} from the waitlist? This will move them to the registered players list.
              </p>
            </>
          )}
        </div>
      </Modal>

      {/* Waitlist Remove Modal */}
      <Modal
        isOpen={isRemoveWaitlistModalOpen}
        onClose={() => setIsRemoveWaitlistModalOpen(false)}
        title={selectedWaitlistIds.length > 1 ? "Remove Players?" : "Remove Player?"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsRemoveWaitlistModalOpen(false)} className="rounded-lg font-normal">
              Cancel
            </Button>
            <Button
              className="rounded-lg font-normal px-8 text-white border bg-red-500 hover:bg-red-600 border-red-600/30"
              onClick={() => handleRemoveWaitlist(selectedWaitlistIds)}
              disabled={waitlistActionId === "processing"}
            >
              {waitlistActionId === "processing" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Remove
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-red-50 text-red-500 border border-red-100">
            <Trash2 className="h-10 w-10" />
          </div>
          <h4 className="text-[14px] font-normal text-gray-900 mb-2">
            Remove {selectedWaitlistIds.length > 1 ? `${selectedWaitlistIds.length} Players` : "Player"}?
          </h4>
          <p className="text-gray-500 max-w-sm">
            Are you sure you want to remove {selectedWaitlistIds.length > 1 ? "these players" : "this player"} from the waitlist? This action cannot be undone.
          </p>
        </div>
      </Modal>

      {/* Grouping Rules Info Modal */}
      <Modal
        isOpen={isGroupingRulesModalOpen}
        onClose={() => setIsGroupingRulesModalOpen(false)}
        title="Grouping Rules Explained"
        className="max-w-xl"
      >
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="p-4 bg-background rounded-xl border border-gray-100">
            <h4 className="font-normal text-gray-900 mb-1 flex items-center gap-2">
              <Dices className="w-4 h-4 text-openclub-800" /> Random Grouping
            </h4>
            <p className="text-[13px] text-gray-600">Assigns players into groups completely at random. Good for social play.</p>
          </div>
          <div className="p-4 bg-background rounded-xl border border-gray-100">
            <h4 className="font-normal text-gray-900 mb-1 flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600" /> Category Balanced
            </h4>
            <p className="text-[13px] text-gray-600">Attempts to balance groups by mixing all handicap categories (1, 2, 3 and all) so each group has a mix of skill levels.</p>
          </div>
          <div className="p-4 bg-background rounded-xl border border-gray-100">
            <h4 className="font-normal text-gray-900 mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-600" /> Leaderboard Reverse (Gross / Net)
            </h4>
            <p className="text-[13px] text-gray-600">Only available after Day 1. Groups players based on their standings, putting the leading players last (latest tee times).</p>
          </div>
          <div className="p-4 bg-background rounded-xl border border-gray-100">
            <h4 className="font-normal text-gray-900 mb-1 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-purple-600" /> Leaderboard Direct (Gross / Net)
            </h4>
            <p className="text-[13px] text-gray-600">Only available after Day 1. Groups players based on their standings, putting the leading players first (earliest tee times).</p>
          </div>
          <div className="p-4 bg-background rounded-xl border border-gray-100">
            <h4 className="font-normal text-red-600 mb-1">Reset All</h4>
            <p className="text-[13px] text-gray-600">Clears all current groupings for the selected day, moving all players back to the unassigned list so you can start over.</p>
          </div>
        </div>
      </Modal>

      {/* Publish Email Prototype Modal */}
      <Modal
        isOpen={isPublishEmailModalOpen}
        onClose={() => !groupingsGenerating && setIsPublishEmailModalOpen(false)}
        title={`Send Day ${selectedDay} Flights & Tee Times`}
        className="max-w-xl"
      >
        <div className="space-y-6 pt-4">
          <p className="text-[14px] text-gray-600">
            This will send an email to all assigned players with their specific grouping and tee time information. Review the email prototype below before publishing.
          </p>

          <div className="bg-[#fafafa] border border-[#e1efe5] rounded-xl p-5 shadow-sm space-y-4">
            <div className="border-b border-[#e1efe5] pb-3 mb-3">
              <p className="text-[12px] text-gray-500 font-normal">From: <span className="text-gray-900">OpenClubOS &lt;no-reply@openclubos.com&gt;</span></p>
              <p className="text-[12px] text-gray-500 font-normal mt-1">Subject: <span className="text-gray-900 font-normal">Your Tee Time for Day {selectedDay} - {selectedTournament?.name}</span></p>
            </div>

            <div className="space-y-3">
              <h2 className="text-[18px] font-normal text-gray-900">{selectedTournament?.name}</h2>
              <p className="text-[14px] text-gray-700">Hi [Player First Name],</p>
              <p className="text-[14px] text-gray-700">
                Your tee time and grouping for Day {selectedDay} has been assigned. Please see the details below:
              </p>

              <div className="bg-white border border-[#e1efe5] rounded-lg p-4 my-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] text-gray-500 capitalize tracking-wider font-normal">Tee Time</p>
                    <p className="text-[16px] font-normal text-openclub-800">[Player Tee Time]</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider font-normal">Flight</p>
                    <p className="text-[16px] font-normal text-gray-900">[Player Flight Name]</p>
                  </div>
                </div>
              </div>

              <p className="text-[14px] text-gray-700">
                Please ensure you arrive at least 30 minutes before your tee time.
              </p>

              <div className="pt-4 mt-4 border-t border-[#e1efe5]">
                <p className="text-[12px] text-gray-500">
                  Powered by OpenClubOS
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#e1efe5]">
            <Button
              variant="outline"
              onClick={() => setIsPublishEmailModalOpen(false)}
              disabled={groupingsGenerating}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmPublishGroupingsEmail}
              disabled={groupingsGenerating}
              className="bg-openclub-800 hover:bg-emerald-700 text-white rounded-xl gap-2 font-normal shadow-sm"
            >
              {groupingsGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
              Send Emails to {groupingsData?.groups.reduce((acc, g) => acc + g.registrations.length, 0)} Players
            </Button>
          </div>
        </div>
      </Modal>

      {/* Day Lock Modal */}
      <Modal
        isOpen={isDayLockModalOpen}
        onClose={() => setIsDayLockModalOpen(false)}
        title="Flights & Tee Times Not Locked"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsDayLockModalOpen(false)}
              className="rounded-lg font-normal"
              disabled={mutating}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!selectedTournament) return;
                setMutating(true);
                const prevDay = selectedDay > 1 ? selectedDay - 1 : 1;
                const currentLocks = selectedTournament.lockedGroupingsDays || [];
                const newLocks = Array.from(new Set([...currentLocks, prevDay]));
                try {
                  const data = await updateTournament(selectedTournament.id, { lockedGroupingsDays: newLocks });
                  setSelectedTournament(data);
                  toast.success(`Day ${prevDay} groupings irreversibly locked`);
                  setIsDayLockModalOpen(false);
                  if (pendingGroupingRule) {
                    handleGenerateGroupings(pendingGroupingRule);
                    setPendingGroupingRule(null);
                  }
                } catch (err) {
                  toast.error("Failed to lock groupings");
                } finally {
                  setMutating(false);
                }
              }}
              className="rounded-lg font-normal px-8 text-white border bg-amber-500 hover:bg-amber-600 border-amber-650/30"
              disabled={mutating}
            >
              {mutating ? "Locking..." : `Lock Day ${selectedDay > 1 ? selectedDay - 1 : 1}`}
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-amber-50 text-amber-500 border border-amber-100">
            <Lock className="h-10 w-10" />
          </div>
          <h4 className="text-[14px] font-normal text-gray-900 mb-2">Day {selectedDay > 1 ? selectedDay - 1 : 1} is not locked</h4>
          <p className="text-gray-500 max-w-sm">
            You must <span className="font-normal text-gray-700 capitalize">finalize</span> and <span className="font-normal text-gray-700 uppercase">irreversibly lock</span> groupings for Day {selectedDay > 1 ? selectedDay - 1 : 1} before generating Day {selectedDay} groupings.
          </p>
        </div>
      </Modal>

      {/* Ungrouped Players Modal */}
      <Modal
        isOpen={isUngroupedPlayersModalOpen}
        onClose={() => setIsUngroupedPlayersModalOpen(false)}
        title="Incomplete Flights & Tee Times"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsUngroupedPlayersModalOpen(false)}
              className="rounded-lg font-normal"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsUngroupedPlayersModalOpen(false);
                setSelectedDay(selectedDay > 1 ? selectedDay - 1 : 1);
              }}
              className="rounded-lg font-normal px-8 text-white border bg-red-500 hover:bg-red-600 border-red-650/30"
            >
              Go to Day {selectedDay > 1 ? selectedDay - 1 : 1}
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-red-50 text-red-500 border border-red-100">
            <AlertTriangle className="h-10 w-10" />
          </div>
          <h4 className="text-[14px] font-normal text-gray-900 mb-2">Incomplete Day {selectedDay > 1 ? selectedDay - 1 : 1}</h4>
          <p className="text-gray-500 max-w-sm">
            All players for Day {selectedDay > 1 ? selectedDay - 1 : 1} have not been grouped yet. You <span className="font-normal text-gray-700 uppercase">cannot lock</span> Day {selectedDay > 1 ? selectedDay - 1 : 1} or <span className="font-normal text-gray-700 uppercase">generate</span> Day {selectedDay} groupings until all players are assigned a tee time.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={showCutModal}
        onClose={() => setShowCutModal(false)}
        title="Apply Tournament Cut?"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCutModal(false)} className="rounded-lg font-normal">
              Cancel
            </Button>
            <Button
              className="rounded-lg font-normal px-8 text-white border bg-red-500 hover:bg-red-600 border-red-650/30"
              onClick={() => {
                setShowCutModal(false);
                handleApplyCut();
              }}
              disabled={applyingCut}
            >
              {applyingCut ? "Applying..." : "Apply Cut"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-red-50 text-red-500 border border-red-100">
            <AlertTriangle className="h-10 w-10" />
          </div>
          <h4 className="text-[14px] font-normal text-gray-900 mb-2">Apply Tournament Cut?</h4>
          <p className="text-gray-500 max-w-sm">
            Are you sure you want to apply the cut? This will <span className="font-normal text-gray-700 capitalize">permanently eliminate</span> players below the cut line from future groupings and <span className="font-normal text-gray-700 uppercase">cannot be easily undone</span>.
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
              <div className="h-20 w-20 bg-gray-100 rounded-xl" />
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
