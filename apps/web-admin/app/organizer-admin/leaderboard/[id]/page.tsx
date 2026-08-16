"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { PenalizeActionDropdown } from "@/components/penalize-action-dropdown";
import NextLink from "next/link";
import { useRouter, useParams, useSearchParams, usePathname } from "next/navigation";
import {
  Trophy, Medal,
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
  RotateCcw,
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
  ArrowRight,
  MapPin,
  ChevronRight,
  Shuffle,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  Settings2,
  MonitorPlay,
  Banknote,
  Landmark,
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
import { PlayerActionDropdown } from "@/components/player-action-dropdown";
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
  scoringType: "NET" | "GROSS" | "BOTH";
  enableCut?: boolean;
  cutAfterRound?: number;
  lockedGroupingsDays: number[];
  type?: string;
  minHandicap?: number;
  maxHandicap?: number;
  startType?: string;
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
  const activeTab = "leaderboard" as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<TournamentRow | null>(null);
  const [courseDetails, setCourseDetails] = useState<Course | null>(null);
  const [clubDetails, setClubDetails] = useState<Club | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownAnchorEl, setDropdownAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [groupingsMoreAnchorEl, setGroupingsMoreAnchorEl] = useState<HTMLButtonElement | null>(null);
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
  const debouncedRegistrationsSearch = useDebounce(registrationsSearch, 300);
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
    const currentStrokes = strokeModalRegistration.extraStrokes ?? 0;
    if (strokeModalAction === "ADD_1") {
      if (currentStrokes === 1) {
        toast.info("Player already has +1 Stroke penalty");
        setStrokeModalRegistration(null);
        setStrokeModalAction(null);
        return;
      }
      const delta = 1 - currentStrokes;
      addTournamentRegistrationStrokes(strokeModalRegistration, delta);
    } else if (strokeModalAction === "ADD_2") {
      if (currentStrokes === 2) {
        toast.info("Player already has +2 Strokes penalty");
        setStrokeModalRegistration(null);
        setStrokeModalAction(null);
        return;
      }
      const delta = 2 - currentStrokes;
      addTournamentRegistrationStrokes(strokeModalRegistration, delta);
    } else if (strokeModalAction === "CLEAR") {
      clearTournamentRegistrationStrokes(strokeModalRegistration);
    }
    setStrokeModalRegistration(null);
    setStrokeModalAction(null);
  };

  // Invite Player options
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      addEmails(emailInput);
    }
  };

  const handleEmailPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    addEmails(pasted);
  };

  const addEmails = (raw: string) => {
    const emails = raw.split(/[\s,]+/).map(e => e.trim()).filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    const newEmails = emails.filter(e => !inviteEmails.includes(e));
    if (newEmails.length > 0) {
      setInviteEmails(prev => [...prev, ...newEmails]);
    }
    setEmailInput("");
  };

  const removeEmail = (emailToRemove: string) => {
    setInviteEmails(prev => prev.filter(e => e !== emailToRemove));
  };

  const handleSendInvite = async () => {
    if (!selectedTournament?.id) {
      toast.error("Tournament information not loaded.");
      return;
    }
    const isConcluded = selectedTournament.statusKey === "CANCELLED" || selectedTournament.statusKey === "COMPLETED" || (selectedTournament as any).status === "COMPLETED" || (selectedTournament as any).status === "CANCELLED";
    if (isConcluded) {
      toast.error("Invitations are disabled because this tournament has concluded or been cancelled.");
      return;
    }

    let finalEmails = [...inviteEmails];
    if (emailInput.trim()) {
      const pendingEmails = emailInput.split(/[\s,]+/).map(e => e.trim()).filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
      const newPending = pendingEmails.filter(e => !finalEmails.includes(e));
      if (newPending.length > 0) {
        finalEmails = [...finalEmails, ...newPending];
      }
      setEmailInput("");
    }

    if (finalEmails.length === 0) {
      toast.error("Please add at least one valid player email address.");
      return;
    }

    const toastId = toast.loading(`Sending ${finalEmails.length} invitation(s)...`);
    try {
      setIsSubmittingInvite(true);
      const { invitePlayerToTournament } = await import("@/lib/api/registrations");
      
      const results = await Promise.allSettled(
        finalEmails.map(email => invitePlayerToTournament({
          tournamentId: selectedTournament.id!,
          email,
        }))
      );

      const successes = results.filter(r => r.status === "fulfilled").length;
      const failures = results.length - successes;

      if (failures === 0) {
        toast.success(`Successfully sent ${successes} invitation(s)`, { id: toastId });
        setInviteEmails([]);
      } else if (successes === 0) {
        toast.error(`Failed to send ${failures} invitation(s).`, { id: toastId });
        setInviteEmails(finalEmails);
      } else {
        toast.error(`Sent ${successes} invite(s). Failed to send ${failures}.`, { id: toastId });
        setInviteEmails(finalEmails);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to send invitations";
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  // Manual register options
  const [registerPlayerSearch, setRegisterPlayerSearch] = useState("");
  const debouncedRegisterPlayerSearch = useDebounce(registerPlayerSearch, 300);
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
  const [isAppendGroupingsModalOpen, setIsAppendGroupingsModalOpen] = useState(false);
  const [isCheckingPreviousDay, setIsCheckingPreviousDay] = useState(false);
  const [actionRegistration, setActionRegistration] = useState<RegistrationListItem | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Waitlist Logic
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlist, setWaitlist] = useState<RegistrationListItem[]>([]);
  const [waitlistSearch, setWaitlistSearch] = useState("");
  const debouncedWaitlistSearch = useDebounce(waitlistSearch, 300);
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
  const [isManualGenerating, setIsManualGenerating] = useState(false);
  const [isPublishEmailModalOpen, setIsPublishEmailModalOpen] = useState(false);
  const [editingGroupTimeId, setEditingGroupTimeId] = useState<string | null>(null);
  const [editingGroupTimeValue, setEditingGroupTimeValue] = useState("");
  const [editingGroupNameId, setEditingGroupNameId] = useState<string | null>(null);
  const [editingGroupNameValue, setEditingGroupNameValue] = useState("");
  const [isGroupingRulesModalOpen, setIsGroupingRulesModalOpen] = useState(false);
  const [selectedAutoTeeRule, setSelectedAutoTeeRule] = useState<string | null>(null);
  // Groupings Search/Filter
  const [publishClickCount, setPublishClickCount] = useState(0);
  const [justGrouped, setJustGrouped] = useState(false);
  const [groupingsSearch, setGroupingsSearch] = useState("");
  const debouncedGroupingsSearch = useDebounce(groupingsSearch, 300);
  const [groupsSearch, setGroupsSearch] = useState("");
  const debouncedGroupsSearch = useDebounce(groupsSearch, 300);
  const [groupingsFilter, setGroupingsFilter] = useState<"ALL" | "PAID" | "UNPAID">("ALL");
  const [unassignedPage, setUnassignedPage] = useState(1);
  const [groupsPage, setGroupsPage] = useState(1);
  const unassignedPerPage = 5;
  const groupsPerPage = 3;

  // Leaderboard States
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardSortBy, setLeaderboardSortBy] = useState<"NET" | "GROSS">("NET");
  const [leaderboardCategoryFilter, setLeaderboardCategoryFilter] = useState<string>("ALL");
  const [leaderboardGenderFilter, setLeaderboardGenderFilter] = useState<string>("ALL");
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const [leaderboardSearch, setLeaderboardSearch] = useState("");
  const debouncedLeaderboardSearch = useDebounce(leaderboardSearch, 300);
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

  const handleGenerateGroupings = async (rule: "RANDOM" | "LEADERBOARD_REVERSE_GROSS" | "LEADERBOARD_REVERSE_NET" | "LEADERBOARD_DIRECT_GROSS" | "LEADERBOARD_DIRECT_NET" | "MANUAL_EMPTY" = "RANDOM") => {
    if (!tournamentId) return;
    setGroupingsGenerating(true);
    if (rule === "MANUAL_EMPTY") setIsManualGenerating(true);
    try {
      const data = await generateGroupings(tournamentId, selectedDay, rule);
      setGroupingsData(data);
      setGroupingsSubTab("grouped");
      setJustGrouped(true);
      toast.success(rule === "MANUAL_EMPTY" ? "Manual grouping initialized." : "Groupings generated. Click 'Publish via Email' to notify players.");
    } catch (err) {
      toast.error((err instanceof Error ? err.message : null) || "Failed to generate groupings");
    } finally {
      setGroupingsGenerating(false);
      setIsManualGenerating(false);
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
      if (targetGroupId === null) {
        toast.success("Player has been removed from flight");
      } else {
        toast.success("Player has been moved successfully");
      }
    } catch (err) {
      if (targetGroupId === null) {
        toast.error((err instanceof Error ? err.message : null) || "Failed to remove player");
      } else {
        toast.error((err instanceof Error ? err.message : null) || "Failed to move player");
      }
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
  }, [activeTab, tournamentId, selectedDay, waitlistPage, waitlistDebouncedSearch, waitlistFilter, registrationsRefreshTrigger, selectedTournament?.id, selectedTournament?.enableCut, leaderboardSortBy]);

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
        scoringType: t.scoringType as "NET" | "GROSS" | "BOTH",
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
          scoringType: t.scoringType as "NET" | "GROSS" | "BOTH",
          lockedGroupingsDays: t.lockedGroupingsDays || [],
        };
        setSelectedTournament(mapped);
        setRegistrationsTournamentTotal(registrations);
        setLeaderboardSortBy(t.scoringType === "NET" ? "NET" : "GROSS");
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
  }, [debouncedRegistrationsSearch]);

  useEffect(() => {
    const handler = setTimeout(() => setWaitlistDebouncedSearch(waitlistSearch.trim()), 300);
    return () => clearTimeout(handler);
  }, [debouncedWaitlistSearch]);

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
  const [activeMarkPaidDropdown, setActiveMarkPaidDropdown] = useState<string | null>(null);
  const [markPaidDropdownAnchorEl, setMarkPaidDropdownAnchorEl] = useState<HTMLElement | null>(null);

  const closeMarkPaidDropdown = () => {
    setActiveMarkPaidDropdown(null);
    setMarkPaidDropdownAnchorEl(null);
  };

  const handleMarkPaid = async (registrationId: string, paymentMethod: "CASH" | "BANK_TRANSFER") => {
    if (markingPaidId) return;
    setMarkingPaidId(registrationId);
    try {
      await confirmRegistrationPayment(registrationId, paymentMethod + "_" + Date.now());
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
      <div className="w-full max-w-full font-sans space-y-6">
        {/* Premium Header Skeleton */}
        <div className="relative overflow-hidden rounded-[20px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-2 border border-gray-100 bg-white">
          <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="flex items-start md:items-center gap-5">
              <Skeleton className="w-11 h-11 rounded-full flex-shrink-0" />
              <div className="flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center gap-3">
                  <Skeleton className="h-8 w-64 rounded-md" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Skeleton className="h-8 w-36 rounded-lg" />
                  <Skeleton className="h-8 w-36 rounded-lg" />
                  <Skeleton className="h-8 w-36 rounded-lg" />
                  <Skeleton className="h-8 w-36 rounded-lg" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 xl:pl-6 xl:border-l border-gray-100">
              <Skeleton className="h-11 w-36 rounded-xl" />
              <Skeleton className="h-11 w-36 rounded-xl" />
              <Skeleton className="h-11 w-11 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Main Layout Grid Skeleton */}
        <div className="flex-1 min-w-0 space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden min-h-[600px] p-6 sm:p-8 space-y-6">
              {/* Tab Header & Action Bar Skeleton */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e1efe5] pb-4">
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-48 rounded-md" />
                  <Skeleton className="h-4 w-72 rounded-md" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-32 rounded-md" />
                  <Skeleton className="h-9 w-36 rounded-md" />
                </div>
              </div>

              {/* Tab Filters Bar Skeleton */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Skeleton className="h-11 w-full rounded-lg bg-[#f5faf6] border border-[#e1efe5]" />
                </div>
                <Skeleton className="h-11 w-[150px] rounded-lg bg-[#f5faf6] border border-[#e1efe5]" />
                <Skeleton className="h-11 w-[150px] rounded-lg bg-[#f5faf6] border border-[#e1efe5]" />
              </div>

              {/* Tab Table Content Skeleton */}
              <div className="border border-[#e1efe5] rounded-xl overflow-hidden bg-white">
                <div className="bg-[#f5faf6] border-b border-[#e1efe5] p-4 flex items-center justify-between">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
                <div className="divide-y divide-[#e1efe5]">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-36 rounded" />
                          <Skeleton className="h-3 w-48 rounded" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 hidden sm:flex">
                        <Skeleton className="h-5 w-16 rounded-lg" />
                        <Skeleton className="h-5 w-16 rounded-lg" />
                      </div>
                      <div className="hidden md:flex items-center gap-2">
                        <Skeleton className="h-5 w-14 rounded-lg" />
                        <Skeleton className="h-5 w-16 rounded-lg" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-24 rounded-lg" />
                        <Skeleton className="h-8 w-8 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tab Footer Pagination Skeleton */}
              <div className="pt-2 flex items-center justify-between gap-4">
                <Skeleton className="h-4 w-48 rounded" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
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
        <Button onClick={() => router.push("/organizer-admin/tournaments")} className="mt-4 bg-[#15803D] hover:bg-[#166534] text-white">
          Back to Tournaments
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full font-sans space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-white border-none rounded-2xl p-5 shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/organizer-admin/tournaments")}
            className="w-10 h-10 shrink-0 border border-[#e1efe5] hover:border-openclub-700 hover:bg-emerald-50/20 text-gray-500 hover:text-openclub-800 rounded-xl flex items-center justify-center transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-[16px] font-medium text-gray-900">{selectedTournament.name}</h1>
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-normal uppercase tracking-widest border shadow-sm",
                STATUS_META[selectedTournament.statusKey]?.badge || "bg-gray-100 text-gray-600 border-gray-200"
              )}>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 animate-pulse" />
                  {selectedTournament.status}
                </span>
              </span>
            </div>
            <p className="text-[13px] text-gray-500 font-normal">Manage tournament details, registrations, tee times and scores</p>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-14 lg:ml-0">
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
              className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-normal text-[13px] flex items-center gap-2 rounded-[12px] px-6 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]"
            >
              <Send className="w-4 h-4" />
              Publish Now
            </Button>
          )}

          <NextLink
            href={`/tv/leaderboard/${selectedTournament.id}`}
            target="_blank"
            className="bg-[#15803D] hover:bg-[#166534] h-11 border border-[#166534] text-white font-medium text-[13px] flex items-center gap-2 rounded-lg px-5 shadow-sm transition-all no-underline"
            title="Launch TV Mode"
          >
            <MonitorPlay className="w-4 h-4 text-white" />
            Launch TV Mode
          </NextLink>


        </div>
      </div>

      {/* Main Layout Grid */}        {/* Right Column - Active Panel */}
        <div className="flex-1 min-w-0 space-y-6">
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

          <div className="rounded-xl border-none bg-white shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-hidden min-h-[600px] p-6 sm:p-8">
            {/* TABS 5: Leaderboard */}
            {activeTab === "leaderboard" && (
              <div className="space-y-6 animate-in fade-in duration-500">
                

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

                <div className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <h3 className="text-[17px] font-normal text-gray-900 flex items-center gap-2">
                      Live Standings
                      <span className="text-[11px] font-medium bg-emerald-50 text-openclub-800 px-2.5 py-0.5 rounded-lg border border-emerald-100 uppercase">
                        Live
                      </span>
                    </h3>
                    <p className="text-[13px] text-gray-500 font-normal">Real-time ranking based on all played holes.</p>
                  </div>

                </div>

                <div className="bg-white rounded-xl border border-[#e1efe5] overflow-hidden">
                  <div className="p-5 border-b border-[#e1efe5] bg-background/50">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#15803D]" />
                      <Input
                        placeholder="Type player name or email to search..."
                        value={leaderboardSearch}
                        onChange={(e) => setLeaderboardSearch(e.target.value)}
                        className="pl-10 h-11 rounded-lg text-[14px] border-[#e1efe5] bg-white text-[#15803D] focus:bg-gray-50 placeholder:text-[#15803D]/60"
                      />
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
                        triggerClassName="h-11 bg-white border-[#e1efe5] text-[#15803D] font-medium"
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
                          { value: "Professional", label: "Professional" },
                          { value: "Open", label: "Open" },
                        ]}
                        className="min-w-[140px]"
                        triggerClassName="h-11 bg-white border-[#e1efe5] text-[#15803D] font-medium"
                      />

                      {/* Sort Filter */}
                      {selectedTournament?.scoringType === "BOTH" ? (
                        <SearchableSelect
                          value={leaderboardSortBy}
                          onValueChange={(v) => setLeaderboardSortBy(v as "NET" | "GROSS")}
                          options={[
                            { value: "NET", label: "Net Score" },
                            { value: "GROSS", label: "Gross Score" },
                          ]}
                          className="min-w-[140px]"
                          triggerClassName="h-11 bg-white border-[#e1efe5] text-[#15803D] font-medium"
                        />
                      ) : (
                        <div className="h-11 px-4 flex items-center justify-center rounded-xl bg-white border border-[#e1efe5] text-sm text-[#15803D] font-medium">
                          {selectedTournament?.scoringType === "GROSS" ? "Gross Score" : "Net Score"}
                        </div>
                      )}
                    </div>
                    </div>
                  </div>

                {leaderboardLoading ? (
                  <div className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#f5faf6] border-b border-[#e1efe5] text-[12px] font-normal text-[#15803D] uppercase tracking-wider">
                            <th className="px-6 py-4 text-[12px] font-normal text-gray-500 uppercase tracking-wider w-16 text-center">POS</th>
                            <th className="px-6 py-4 text-[12px] font-normal text-gray-500 uppercase tracking-wider">PLAYER</th>
                            <th className="px-6 py-4 text-[12px] font-normal text-gray-500 uppercase tracking-wider text-center">DIVISION</th>
                            {getTournamentDays() > 1 && Array.from({ length: getTournamentDays() }).map((_, i) => (
                              <th key={`h-r${i}`} className="px-6 py-4 text-[12px] font-normal text-gray-500 uppercase tracking-wider text-center">R{i + 1}</th>
                            ))}
                            <th className="px-6 py-4 text-[12px] font-normal text-gray-500 uppercase tracking-wider text-center">HOLES</th>
                            <th className="px-6 py-4 text-[12px] font-normal text-gray-500 uppercase tracking-wider text-center">TOTAL GROSS</th>
                            <th className="px-6 py-4 text-[12px] font-normal text-gray-500 uppercase tracking-wider text-center">HCP</th>
                            <th className="px-6 py-4 text-[12px] font-normal text-gray-500 uppercase tracking-wider text-center">NET</th>
                            <th className="px-6 py-4 text-[12px] font-normal text-gray-500 uppercase tracking-wider text-center">TO PAR</th>
                            <th className="px-6 py-4 text-[12px] font-normal text-gray-500 uppercase tracking-wider text-center">STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
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
                              {getTournamentDays() > 1 && Array.from({ length: getTournamentDays() }).map((_, j) => (
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
                    if (leaderboardGenderFilter !== "ALL" && entry.user?.gender?.toUpperCase() !== leaderboardGenderFilter.toUpperCase()) return false;
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
                      <div className="bg-white p-16 text-center">
                        <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-[14px] font-normal text-gray-900">No players found</h3>
                        <p className="text-gray-500 mt-1">We couldn't find anyone matching "{leaderboardSearch}"</p>
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-[#f5faf6] border-b border-[#e1efe5] text-[12px] font-normal text-[#15803D] uppercase tracking-wider">
                              <th className="px-6 py-4 text-[12px] font-normal text-gray-500 uppercase tracking-wider w-16 text-center">POS</th>
                              <th className="px-6 py-4 text-[12px] font-normal text-gray-500 uppercase tracking-wider">PLAYER</th>
                              <th className="px-6 py-4 text-[12px] font-normal text-gray-500 uppercase tracking-wider text-center">DIVISION</th>
                              {getTournamentDays() > 1 && Array.from({ length: getTournamentDays() }).map((_, i) => (
                                <th key={`h-r${i}`} className="px-6 py-4 text-[12px] font-normal text-gray-500 uppercase tracking-wider text-center">R{i + 1}</th>
                              ))}
                              <th className="px-6 py-4 text-[12px] font-normal text-gray-500 uppercase tracking-wider text-center">HOLES</th>
                              <th className="px-6 py-4 text-[12px] font-normal text-gray-500 uppercase tracking-wider text-center">TOTAL GROSS</th>
                              <th className="px-6 py-4 text-[12px] font-normal text-gray-500 uppercase tracking-wider text-center">HCP</th>
                              <th className="px-6 py-4 text-[12px] font-normal text-gray-500 uppercase tracking-wider text-center">NET</th>
                              <th className="px-6 py-4 text-[12px] font-normal text-gray-500 uppercase tracking-wider text-center">TO PAR</th>
                              <th className="px-6 py-4 text-[12px] font-normal text-gray-500 uppercase tracking-wider text-center">STATUS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {filteredData.slice((leaderboardPage - 1) * leaderboardPerPage, leaderboardPage * leaderboardPerPage).map((entry, index, array) => {
                              const rank = (leaderboardPage - 1) * leaderboardPerPage + index + 1;
                              const isFirstMissedCut = entry.madeCut === false && (index === 0 || array[index - 1].madeCut !== false);
                              return (
                                <React.Fragment key={entry.user.id}>
                                  {isFirstMissedCut && (
                                    <tr>
                                      <td colSpan={20} className="px-0 py-0 bg-background">
                                        <div className="flex items-center justify-center py-3 border-y-2 border-dashed border-red-300">
                                          <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full shadow-sm border border-red-200">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" /></svg>
                                            <span className="text-[11px] font-normal text-red-600 uppercase tracking-widest">Cut Line</span>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                  <tr className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4 text-center">
                                      <div className="flex items-center justify-center">
                                        {entry.status === "DISQUALIFIED" ? (
                                          <span className="text-[11px] font-normal text-red-500 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100 uppercase tracking-tight">DQ</span>
                                        ) : rank === 1 ? (
                                          <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center border border-yellow-200/60 shadow-sm mx-auto">
                                            <Trophy className="w-4 h-4 text-yellow-600" />
                                          </div>
                                        ) : rank === 2 ? (
                                          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200/60 shadow-sm mx-auto">
                                            <Medal className="w-4 h-4 text-slate-500" />
                                          </div>
                                        ) : rank === 3 ? (
                                          <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center border border-orange-200/60 shadow-sm mx-auto">
                                            <Medal className="w-4 h-4 text-orange-600" />
                                          </div>
                                        ) : (
                                          <span className="text-[14px] font-normal text-gray-500">{rank}</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-3.5">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-[#e1efe5] bg-white shadow-sm shrink-0">
                                          <img
                                            src={entry.user.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(entry.user.email)}`}
                                            className="w-full h-full object-cover"
                                            alt=""
                                          />
                                        </div>
                                        <div className="min-w-0">
                                          <div className="text-[14px] font-medium text-gray-900 truncate">
                                            {entry.user.firstName} {entry.user.lastName}
                                          </div>
                                          <div className="text-[12px] text-gray-500 font-normal truncate mt-0.5">
                                            {entry.user.email}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <span className={cn(
                                        "text-[11px] font-medium px-2 py-0.5 rounded-lg border uppercase tracking-tight whitespace-nowrap",
                                        getCategoryColor(getGolfCategory(entry.user.handicap))
                                      )}>
                                        {getGolfCategory(entry.user.handicap)}
                                      </span>
                                    </td>
                                    {getTournamentDays() > 1 && Array.from({ length: getTournamentDays() }).map((_, i) => {
                                      const day = i + 1;
                                      const isAfterCut = selectedTournament?.enableCut && day > (selectedTournament?.cutAfterRound || 0);
                                      const missedCut = entry.madeCut === false;

                                      if (isAfterCut && missedCut) {
                                        return (
                                          <td key={`r-${i}`} className="px-6 py-4 text-center">
                                            <span className="text-[11px] font-normal text-red-500 bg-red-50 px-2 py-0.5 rounded-lg uppercase tracking-tight" title="Missed Cut">MC</span>
                                          </td>
                                        );
                                      }

                                      return (
                                        <td key={`r-${i}`} className="px-6 py-4 text-center">
                                          <span className="text-[14px] font-normal text-gray-800">{entry.rounds[day] || "-"}</span>
                                        </td>
                                      );
                                    })}
                                    <td className="px-6 py-4 text-center">
                                      <div className="space-y-1.5">
                                        <span className="text-[14px] font-medium text-gray-700">
                                          {entry.grossStrokes > 0 ? `${entry.holesCount}/${18 * getTournamentDays()}` : "-"}
                                        </span>
                                        {entry.grossStrokes > 0 && (
                                          <div className="w-20 mx-auto h-1.5 bg-gray-100 rounded-lg overflow-hidden">
                                            <div
                                              className="h-full bg-openclub-700 rounded-lg transition-all duration-500"
                                              style={{ width: `${(entry.holesCount / (18 * getTournamentDays())) * 100}%` }}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <div className="flex flex-col items-center justify-center gap-1">
                                        <span className="text-[14px] font-medium text-gray-900">{entry.grossStrokes > 0 ? entry.grossStrokes : "-"}</span>
                                        {entry.extraStrokes > 0 && (
                                          <span className="text-[10px] font-normal text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md uppercase border border-red-100 tracking-tight whitespace-nowrap" title={`${entry.extraStrokes} Penalty Strokes`}>
                                            +{entry.extraStrokes} Pen
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                                        {entry.user.handicap || 0}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <span className="text-[13px] font-medium text-gray-900">
                                        {entry.grossStrokes > 0 ? entry.netStrokes : "-"}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <span className={cn(
                                        "text-[14px] font-semibold",
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
                                        entry.holesCount === (18 * getTournamentDays()) ? (
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
                      <div className="p-5 border-t border-[#e1efe5] flex justify-between items-center bg-white">
                        <span className="text-[13px] font-normal text-gray-500">
                          Showing {Math.min((leaderboardPage - 1) * leaderboardPerPage + 1, filteredData.length)} to {Math.min(leaderboardPage * leaderboardPerPage, filteredData.length)} of {filteredData.length} players
                        </span>
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
              </div>
            )}
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
            {strokeModalAction === "CLEAR" ? <RotateCcw className="h-10 w-10" strokeWidth={2.5} /> : <AlertTriangle className="h-10 w-10 animate-bounce" />}
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
        title={selectedTournament?.startType === 'SHOTGUN' ? "Reset All Holes & Start Times?" : "Reset All Flights & Tee Times?"}
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
          <h4 className="text-[14px] font-normal text-gray-900 mb-2">{selectedTournament?.startType === 'SHOTGUN' ? 'Reset Holes & Start Times?' : 'Reset Flights & Tee Times?'}</h4>
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

      {/* Auto Tee Rule Selection Modal */}
      <Modal
        isOpen={isGroupingRulesModalOpen}
        onClose={() => setIsGroupingRulesModalOpen(false)}
        title="Select Auto Tee Rule"
        className="max-w-xl"
      >
        <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {[
            { value: "RANDOM", label: "Random Grouping", desc: "Mixes all players randomly. Great for fun and social games.", icon: Shuffle },
            { value: "CATEGORY_RANDOM", label: "Category Balanced", desc: "Mixes different skill levels together so every group is balanced and fair.", icon: SlidersHorizontal },
            { value: "LEADERBOARD_REVERSE_GROSS", label: "Leaderboard Reverse (Gross)", desc: "The top players tee off last. (Only works after Day 1).", disabled: selectedDay === 1, icon: ArrowUp },
            { value: "LEADERBOARD_REVERSE_NET", label: "Leaderboard Reverse (Net)", desc: "The top players tee off last. (Only works after Day 1).", disabled: selectedDay === 1, icon: ArrowUp },
            { value: "LEADERBOARD_DIRECT_GROSS", label: "Leaderboard Direct (Gross)", desc: "The top players tee off first. (Only works after Day 1).", disabled: selectedDay === 1, icon: ArrowDown },
            { value: "LEADERBOARD_DIRECT_NET", label: "Leaderboard Direct (Net)", desc: "The top players tee off first. (Only works after Day 1).", disabled: selectedDay === 1, icon: ArrowDown },
          ].map((rule) => {
            const Icon = rule.icon;
            return (
              <button
                key={rule.value}
                disabled={rule.disabled}
                onClick={() => setSelectedAutoTeeRule(rule.value)}
                className={`w-full text-left p-4 bg-background rounded-xl border transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between ${selectedAutoTeeRule === rule.value
                  ? "border-openclub-600 bg-openclub-50/50 ring-1 ring-openclub-600"
                  : "border-gray-200 hover:border-gray-300"
                  }`}
              >
                <div className="flex items-start gap-4 flex-1 pr-4">
                  <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${selectedAutoTeeRule === rule.value
                    ? 'bg-openclub-100 border-openclub-200 text-openclub-700'
                    : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <h4 className="text-[14px] font-medium text-gray-900 mb-0.5">{rule.label}</h4>
                    <p className="text-[13px] text-gray-500">{rule.desc}</p>
                  </div>
                </div>
                <div className={`flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full border ${selectedAutoTeeRule === rule.value ? 'border-openclub-600 bg-white' : 'border-gray-300 bg-white'}`}>
                  {selectedAutoTeeRule === rule.value && (
                    <div className="w-2.5 h-2.5 rounded-full bg-openclub-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex justify-end">
          <Button
            disabled={!selectedAutoTeeRule}
            onClick={async () => {
              const val = selectedAutoTeeRule as any;
              if (!val) return;
              setIsGroupingRulesModalOpen(false);
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
                setPendingGroupingRule(val);
                setIsDayLockModalOpen(true);
              } else {
                if (groupingsData?.groups && groupingsData.groups.length > 0 && groupingsData.rule && groupingsData.rule !== 'MANUAL_EMPTY' && groupingsData.rule !== val) {
                  setPendingGroupingRule(val);
                  setIsAppendGroupingsModalOpen(true);
                } else {
                  handleGenerateGroupings(val);
                }
              }
            }}
            className="bg-openclub-700 hover:bg-openclub-800 text-white rounded-xl h-11 px-8 text-[13px] font-normal shadow-sm border border-openclub-800/20 disabled:bg-slate-100 disabled:text-gray-400 disabled:border-slate-200 disabled:cursor-not-allowed"
          >
            Confirm Selection
          </Button>
        </div>
      </Modal>

      {/* Publish Email Prototype Modal */}
      <Modal
        isOpen={isPublishEmailModalOpen}
        onClose={() => !groupingsGenerating && setIsPublishEmailModalOpen(false)}
        title={selectedTournament?.startType === 'SHOTGUN' ? `Send Day ${selectedDay} Hole Assignments` : `Send Day ${selectedDay} Flights & Tee Times`}
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

              <div className="bg-[#f4fdf8] border border-[#e1efe5] rounded-lg p-4 my-4">
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
        title={selectedTournament?.startType === 'SHOTGUN' ? "Holes & Start Times Not Locked" : "Flights & Tee Times Not Locked"}
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

      {/* Append Groupings Modal */}
      <Modal
        isOpen={isAppendGroupingsModalOpen}
        onClose={() => setIsAppendGroupingsModalOpen(false)}
        title="Group Remaining Players"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setIsAppendGroupingsModalOpen(false);
                setPendingGroupingRule(null);
              }}
              className="rounded-lg font-normal"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (pendingGroupingRule) {
                  handleGenerateGroupings(pendingGroupingRule);
                }
                setIsAppendGroupingsModalOpen(false);
                setPendingGroupingRule(null);
              }}
              className="rounded-lg font-normal px-8 text-white bg-openclub-800 hover:bg-emerald-700 shadow-sm"
            >
              Proceed
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-blue-50 text-blue-500 border border-blue-100">
            <Users className="h-10 w-10" />
          </div>
          <h4 className="text-[14px] font-medium text-gray-900 mb-2">Append to Existing Flights</h4>
          <p className="text-gray-500 max-w-sm">
            You already have existing flights. This action will only apply the selected rule to the <span className="font-semibold text-gray-900">{groupingsData?.unassigned?.length || 0}</span> unassigned players and append them as new flights, preserving your existing groupings.
          </p>
        </div>
      </Modal>

      {/* Ungrouped Players Modal */}
      <Modal
        isOpen={isUngroupedPlayersModalOpen}
        onClose={() => setIsUngroupedPlayersModalOpen(false)}
        title={selectedTournament?.startType === 'SHOTGUN' ? "Incomplete Holes & Start Times" : "Incomplete Flights & Tee Times"}
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


const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Men': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Women': return 'bg-pink-100 text-pink-800 border-pink-200';
    case 'Seniors': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Juniors': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function ViewTournamentPage() {
  return (
    <Suspense fallback={
      <div className="space-y-8 w-full max-w-full font-sans">
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