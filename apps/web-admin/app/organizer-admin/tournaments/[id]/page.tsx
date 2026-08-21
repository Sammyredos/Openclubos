"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { PenalizeActionDropdown } from "@/components/penalize-action-dropdown";
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
  MessageCircle,
  Copy,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { FilterSelect } from "@/components/ui/filter-select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatWithCommas, subscribeAdminEvents, getGolfCategory, formatTeeTime } from "@/lib/utils";
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
  publishGroupingsWhatsApp,
  applyCut,
  type GroupingData,
  type GroupingItem,
  type GroupingPlayer,
} from "@/lib/api/tournaments";
import { getTournamentScores } from "@/lib/api/scores";
import { getAdminUsers, getMembers } from "@/lib/api/members";
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
import { motion, AnimatePresence } from "framer-motion";

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
  teeStartTime?: string | null;
  teeIntervalMinutes?: number;
  autoGrouping?: boolean;
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
  { id: "invite", label: "Invite a Player", icon: UserPlus },
  { id: "waitlist", label: "Waitlisted Players", icon: Clock },
  { id: "groupings", label: "Flights & Tee Times", icon: Calendar },
  { id: "penalize", label: "Penalize a Player", icon: AlertTriangle },
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
      const failures = results.filter(r => r.status === "rejected") as PromiseRejectedResult[];
      const failedEmails = finalEmails.filter((_, idx) => results[idx].status === "rejected");

      if (failures.length === 0) {
        toast.success(`Successfully sent ${successes} invitation(s)`, { id: toastId });
        setInviteEmails([]);
      } else {
        const errorReasons = failures.map((f, i) => {
          const email = failedEmails[i] || "";
          const reason = f.reason instanceof Error ? f.reason.message : "Failed to send invitation";
          return finalEmails.length > 1 ? `${email}: ${reason}` : reason;
        });

        const distinctReasons = Array.from(new Set(errorReasons));
        const combinedMessage = distinctReasons.join(" • ");

        if (successes === 0) {
          toast.error(combinedMessage || `Failed to send ${failures.length} invitation(s).`, { id: toastId });
        } else {
          toast.error(`Sent ${successes} invite(s). Failed ${failures.length}: ${combinedMessage}`, { id: toastId });
        }
        setInviteEmails(failedEmails);
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
  const [isPublishWhatsAppModalOpen, setIsPublishWhatsAppModalOpen] = useState(false);
  const [editingGroupTimeId, setEditingGroupTimeId] = useState<string | null>(null);
  const [editingGroupTimeValue, setEditingGroupTimeValue] = useState("");
  const [editingGroupNameId, setEditingGroupNameId] = useState<string | null>(null);
  const [editingGroupNameValue, setEditingGroupNameValue] = useState("");
  const [isGroupingRulesModalOpen, setIsGroupingRulesModalOpen] = useState(false);
  const [selectedAutoTeeRule, setSelectedAutoTeeRule] = useState<string | null>(null);
  // Groupings Search/Filter
  const [publishClickCount, setPublishClickCount] = useState(0);
  const [publishWhatsAppClickCount, setPublishWhatsAppClickCount] = useState(0);
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
  const [selectedLeaderboardDay, setSelectedLeaderboardDay] = useState<number | "all">("all");
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

  const getSelectedDayDateFormatted = (dayNum: number) => {
    if (!selectedTournament?.startDate) return null;
    const startStr = typeof selectedTournament.startDate === "string" ? selectedTournament.startDate : (selectedTournament.startDate as any).toISOString();
    const dateOnly = startStr.split("T")[0];
    const [y, m, d] = dateOnly.split("-").map(Number);
    if (!y || !m || !d) {
      const fallback = new Date(selectedTournament.startDate);
      fallback.setDate(fallback.getDate() + (dayNum - 1));
      return isNaN(fallback.getTime()) ? null : fallback.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    const targetDate = new Date(y, m - 1, d + (dayNum - 1));
    return targetDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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

  const handlePublishGroupingsWhatsApp = () => {
    if (!tournamentId || !groupingsData) return;

    if (groupingsData.groups.length === 0) {
      toast.error("There are no generated groupings to publish.");
      return;
    }

    setIsPublishWhatsAppModalOpen(true);
  };

  const confirmPublishGroupingsWhatsApp = async () => {
    if (!tournamentId || !groupingsData) return;
    setGroupingsGenerating(true);
    try {
      const res = await publishGroupingsWhatsApp(tournamentId, selectedDay, groupingsData);
      setPublishWhatsAppClickCount(c => c + 1);
      toast.success(res.message || "Groupings WhatsApp messages dispatched successfully via Sendchamp");
      setIsPublishWhatsAppModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to publish groupings via WhatsApp");
    } finally {
      setGroupingsGenerating(false);
    }
  };

  const handleCopyFlightRoster = () => {
    if (!selectedTournament || !groupingsData) return;
    const isShotgun = selectedTournament.startType === 'SHOTGUN';

    let dateStr = '';
    if (selectedTournament.startDate) {
      const d = new Date(selectedTournament.startDate);
      if (!isNaN(d.getTime())) {
        d.setDate(d.getDate() + (selectedDay - 1));
        dateStr = d.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
    }

    let text = `⛳ *${selectedTournament.name}*\n`;
    text += `📅 *Day ${selectedDay}${dateStr ? ` • ${dateStr}` : ''} Pairings*\n\n`;

    groupingsData.groups.forEach((group, idx) => {
      const label = isShotgun ? `Hole ${group.name || idx + 1}` : (group.name || `Flight ${idx + 1}`);
      const formattedTime = formatTeeTime(group.startTime);
      const time = formattedTime !== 'TBA' ? ` (${formattedTime})` : '';
      text += `🔹 *${label}${time}*\n`;
      if (group.registrations.length === 0) {
        text += `   - No players assigned\n`;
      } else {
        group.registrations.forEach(r => {
          const name = `${r.user?.firstName || ''} ${r.user?.lastName || ''}`.trim() || 'Player';
          const hcp = r.user?.handicap !== null && r.user?.handicap !== undefined ? ` (HCP ${r.user.handicap})` : '';
          text += `   • ${name}${hcp}\n`;
        });
      }
      text += `\n`;
    });

    text += `📱 Powered by OpenClubOS`;

    navigator.clipboard.writeText(text);
    toast.success("Tournament flight roster copied to clipboard!");
  };

  const handleGenerateGroupings = async (rule: "RANDOM" | "CATEGORY_RANDOM" | "LEADERBOARD_REVERSE_GROSS" | "MANUAL_EMPTY" = "RANDOM") => {
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
      if (
        event.type === "users-changed" ||
        event.type === "members-changed" ||
        event.type === "registrations-changed" ||
        event.type === "tournaments-changed"
      ) {
        reloadSingleTournament();
        if (activeTab === "groupings") {
          loadGroupingsData();
        } else if (activeTab === "waitlist") {
          fetchWaitlistData();
        }
      }
    });
    return () => unsubscribe();
  }, [activeTab, tournamentId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        reloadSingleTournament();
        if (activeTab === "waitlist") {
          fetchWaitlistData();
        }
      }
    }, 6000);
    return () => clearInterval(interval);
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
        scoringType: t.scoringType as "NET" | "GROSS" | "BOTH",
        enableCut: t.enableCut,
        cutAfterRound: t.cutAfterRound,
        lockedGroupingsDays: t.lockedGroupingsDays || [],
        startType: t.startType || "TEE_TIMES",
        teeStartTime: t.teeStartTime || null,
        teeIntervalMinutes: t.teeIntervalMinutes || 10,
        autoGrouping: t.autoGrouping ?? true,
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
          startType: t.startType || "TEE_TIMES",
          teeStartTime: t.teeStartTime || null,
          teeIntervalMinutes: t.teeIntervalMinutes || 10,
          autoGrouping: t.autoGrouping ?? true,
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

  // Auto-switch to assigned players if all tee groups are fully allocated
  useEffect(() => {
    if (groupingsData && !groupingsData.unassigned?.length && groupingsData.groups?.length > 0) {
      setGroupingsSubTab("grouped");
    }
  }, [groupingsData]);

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
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Navigation Tabs Skeleton */}
          <div className="w-full lg:w-[280px] shrink-0">
            <div className="bg-[#fafafa] border border-[#e1efe5] rounded-xl p-3 shadow-sm space-y-2">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3.5 bg-white border border-[#e1efe5] rounded-xl">
                  <div className="flex items-center gap-3.5">
                    <Skeleton className="w-[18px] h-[18px] rounded" />
                    <Skeleton className="h-4 w-32 rounded" />
                  </div>
                  <Skeleton className="w-4 h-4 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Active Panel Skeleton */}
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

          <Button
            onClick={() => {
              const baseUrl = window.location.origin.replace("admin.", "app.");
              const link = `${baseUrl}/tournaments/${selectedTournament.id}`;
              navigator.clipboard.writeText(link);
              toast.success("Tournament link copied to clipboard");
            }}
            className="bg-openclub-600 hover:bg-openclub-700 text-white h-11 font-normal text-[13px] flex items-center gap-2 rounded-[12px] px-5 shadow-sm transition-all"
          >
            <Link className="w-4 h-4" />
            Copy Tournament Link
          </Button>


        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Navigation */}
        <div className="w-full lg:w-[280px] shrink-0">
          <div className="bg-[#fafafa] border-none rounded-xl p-3 shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] space-y-2 sticky top-6">
            {TABS.map((tab, index) => {
              const isActive = activeTab === tab.id;
              const isShotgun = selectedTournament?.startType === "SHOTGUN";
              const label = tab.id === "groupings"
                ? (isShotgun ? "Holes & Start Times" : "Flights & Tee Times")
                : tab.label;
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
                  <div className="flex items-center gap-3.5 whitespace-nowrap overflow-hidden">
                    <div className={cn(
                      "w-[22px] h-[22px] shrink-0 rounded-full flex items-center justify-center text-[11px] font-medium transition-all duration-300",
                      isActive
                        ? "bg-[#15803D] text-white"
                        : "bg-gray-100 text-gray-400 border border-[#e1efe5]"
                    )}>
                      {index + 1}
                    </div>
                    <span className="text-[13px] font-normal leading-tight">
                      {label}
                    </span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 shrink-0 text-[#15803D]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column - Active Panel */}
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
                      className="h-9 bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 gap-1.5 rounded-md px-4 text-[12px] font-normal.
                       capitalize tracking-wider transition-all shadow-sm"
                    >
                      <Clock className="w-3.5 h-3.5 text-openclub-800" /> Waitlist Queue
                      {pendingWaitlistTotal > 0 && (
                        <span className="flex items-center justify-center bg-emerald-100 text-emerald-700 text-[10px] font-medium px-1.5 h-4 min-w-[16px] rounded-full ml-1">
                          {pendingWaitlistTotal}
                        </span>
                      )}
                    </Button>
                    <Button
                      disabled={selectedTournament.statusKey === "CANCELLED" || selectedTournament.statusKey === "COMPLETED"}
                      onClick={() => setActiveTab("invite")}
                      className="h-9 bg-[#15803D] hover:bg-[#166534] border border-[#166534] text-white gap-1.5 rounded-md px-4 text-[12px] font-normal capitalize tracking-wider transition-all shadow-sm"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Invite a Player
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-[#e1efe5] bg-[#f5faf6] overflow-hidden">
                  {/* Search/Filters Top Bar */}
                  <div className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#15803D]" />
                        <Input
                          value={registrationsSearch}
                          onChange={(e) => {
                            setRegistrationsPage(1);
                            if (registrationsMode === "server") setRegistrationsLoading(true);
                            setRegistrationsSearch(e.target.value);
                          }}
                          placeholder="Search name or email..."
                          className="pl-10 h-11 rounded-lg text-[14px] border-[#e1efe5] bg-white text-[#15803D] focus:bg-white placeholder:text-[#15803D]/60"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-4 ml-auto">
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
                          triggerClassName="h-11 bg-white border-[#e1efe5] text-[#15803D] font-medium"
                          placeholder="All Status"
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
                          triggerClassName="h-11 bg-white border-[#e1efe5] text-[#15803D] font-medium"
                          placeholder="All Payments"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Table Area */}
                  <div className="bg-white">
                    {registrationsLoading ? (
                      <div className="border-y border-[#e1efe5] bg-white">
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
                      <div className="overflow-x-auto relative border-y border-[#e1efe5] bg-white">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                          <thead>
                            <tr className="bg-[#f5faf6] border-b border-[#e1efe5] text-[10px] font-normal text-[#15803D] uppercase tracking-wider">
                              <th className="px-4 py-4">PLAYER</th>
                              <th className="px-4 py-4">STATUS & PAYMENT</th>
                              <th className="px-4 py-4">DETAILS</th>
                              <th className="px-4 py-4 text-center">HANDICAP / PENALTY</th>
                              <th className="px-4 py-4 text-right">ACTIONS</th>
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
                                        {selectedTournament.entryFee !== null && !isPaid && new Date(selectedTournament.startDate).setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0) && (() => {
                                          const isUnaccepted = (!r.user?.firstName?.trim() && !r.user?.lastName?.trim()) || fullName(r.user?.firstName ?? null, r.user?.lastName ?? null) === "—";
                                          return (
                                            <div className="inline-flex rounded-md shadow-sm h-8">
                                              <button
                                                onClick={(e) => {
                                                  if (isUnaccepted) return;
                                                  if (activeMarkPaidDropdown === r.id) {
                                                    closeMarkPaidDropdown();
                                                  } else {
                                                    setActiveMarkPaidDropdown(r.id);
                                                    setMarkPaidDropdownAnchorEl(e.currentTarget);
                                                  }
                                                }}
                                                disabled={markingPaidId === r.id || isUnaccepted}
                                                className={cn(
                                                  "h-8 pl-3 pr-2.5 inline-flex items-center justify-center gap-1.5 rounded-l-md bg-[#15803D] text-white transition-colors border border-[#15803D] border-r-[rgba(255,255,255,0.2)]",
                                                  isUnaccepted ? "opacity-40 cursor-not-allowed" : "hover:bg-openclub-800",
                                                  markingPaidId === r.id && "opacity-50"
                                                )}
                                                title={isUnaccepted ? "Cannot mark as paid until player accepts invitation" : "Mark as Paid"}
                                              >
                                                {markingPaidId === r.id ? (
                                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                                ) : (
                                                  <Wallet className="w-3.5 h-3.5" />
                                                )}
                                                <span className="text-[12px] font-normal leading-none whitespace-nowrap">Mark Paid</span>
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  if (isUnaccepted) return;
                                                  if (activeMarkPaidDropdown === r.id) {
                                                    closeMarkPaidDropdown();
                                                  } else {
                                                    setActiveMarkPaidDropdown(r.id);
                                                    setMarkPaidDropdownAnchorEl(e.currentTarget);
                                                  }
                                                }}
                                                disabled={markingPaidId === r.id || isUnaccepted}
                                                className={cn(
                                                  "h-8 px-1.5 inline-flex items-center justify-center rounded-r-md bg-[#15803D] text-white transition-colors border border-[#15803D] border-l-0",
                                                  isUnaccepted ? "opacity-40 cursor-not-allowed" : "hover:bg-openclub-800",
                                                  markingPaidId === r.id && "opacity-50"
                                                )}
                                                title={isUnaccepted ? "Cannot mark as paid until player accepts invitation" : "Payment Options"}
                                              >
                                                <ChevronDown className="w-3.5 h-3.5" />
                                              </button>
                                              <FloatingMenu
                                                open={activeMarkPaidDropdown === r.id}
                                                anchorEl={markPaidDropdownAnchorEl}
                                                onClose={closeMarkPaidDropdown}
                                                placement="bottom-end"
                                              >
                                                <div className="w-40 py-1 bg-white rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.1)] border border-gray-200 flex flex-col">
                                                  <button
                                                    className="w-full px-3 py-2 flex items-center gap-2 text-left text-[13px] text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                                    onClick={() => {
                                                      handleMarkPaid(r.id, "CASH");
                                                      closeMarkPaidDropdown();
                                                    }}
                                                  >
                                                    <Banknote className="w-4 h-4 text-emerald-600" />
                                                    Cash Payment
                                                  </button>
                                                  <button
                                                    className="w-full px-3 py-2 flex items-center gap-2 text-left text-[13px] text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                                    onClick={() => {
                                                      handleMarkPaid(r.id, "BANK_TRANSFER");
                                                      closeMarkPaidDropdown();
                                                    }}
                                                  >
                                                    <Landmark className="w-4 h-4 text-blue-500" />
                                                    Bank Transfer
                                                  </button>
                                                </div>
                                              </FloatingMenu>
                                            </div>
                                          );
                                        })()}
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
                      <div className="border-y border-[#e1efe5] bg-white">
                        <EmptyState
                          title="No registrations found"
                          description="Try adjusting your filters or search query to find what you're looking for."
                        />
                      </div>
                    )}
                  </div>

                  {!registrationsLoading && registrationsFilteredTotal > 0 && (
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

            {/* TABS: Invite Player */}
            {activeTab === "invite" && selectedTournament && (() => {
              const isConcluded = selectedTournament.statusKey === "CANCELLED" || selectedTournament.statusKey === "COMPLETED" || (selectedTournament as any).status === "COMPLETED" || (selectedTournament as any).status === "CANCELLED";
              return (
                <div className="space-y-6 w-full">
                  <div className="border-b border-[#e1efe5] pb-4">
                    <h2 className="text-[15px] font-medium text-gray-900 font-sans">Invite Player</h2>
                    <p className="text-[12px] text-gray-500 mt-1">Send an invitation email directly to a player to join this tournament.</p>
                  </div>

                  <div className="bg-background rounded-xl border border-[#e1efe5] p-5 space-y-6">
                    {/* Form */}
                    <div className="space-y-2">
                      <div className="space-y-0.5">
                        <label className="text-[13px] font-medium text-gray-700 block">
                          Email Address(es) <span className="text-red-500">*</span>
                        </label>
                        <p className="text-[11px] text-gray-400">Separate multiple emails with commas or space.</p>
                      </div>
                      <div className={`flex flex-wrap items-center gap-2 p-2 border border-[#e1efe5] bg-white rounded-lg min-h-[44px] focus-within:ring-2 focus-within:ring-[#15803D]/20 ${isConcluded ? "opacity-60 bg-gray-50 cursor-not-allowed" : ""}`}>
                        {inviteEmails.map((email) => (
                          <span key={email} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#f5faf6] text-[#15803D] text-[13px] border border-[#e1efe5]">
                            {email}
                            <button type="button" onClick={() => removeEmail(email)} disabled={isSubmittingInvite || isConcluded} className="text-[#15803D]/60 hover:text-[#15803D] disabled:opacity-50"><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                        <input
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          onKeyDown={handleEmailKeyDown}
                          onPaste={handleEmailPaste}
                          placeholder={isConcluded ? "Invitations closed for concluded tournament" : inviteEmails.length === 0 ? "Enter player emails..." : ""}
                          disabled={isSubmittingInvite || isConcluded}
                          className="flex-1 bg-transparent border-none outline-none text-[#15803D] placeholder:text-[#15803D]/60 text-[13px] min-w-[150px] p-1 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Button */}
                    <Button
                      onClick={handleSendInvite}
                      disabled={isSubmittingInvite || isConcluded || (inviteEmails.length === 0 && !emailInput.trim())}
                      className="w-full h-11 bg-[#15803D] hover:bg-[#166534] border border-[#166534] text-white font-medium text-[13px] rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:border-transparent disabled:cursor-not-allowed"
                    >
                      {isSubmittingInvite ? "Sending Invitations..." : isConcluded ? "Tournament Concluded" : "Send Invitations"}
                    </Button>
                  </div>
                </div>
              );
            })()}


            {/* TABS 3: Waitlist Management */}
            {activeTab === "waitlist" && (
              <div className="space-y-6">
                <div className="border-b border-[#e1efe5] pb-4">
                  <h2 className="text-[15px] font-medium text-gray-900 font-sans">Waitlist Queue</h2>
                  <p className="text-[12px] text-gray-500 mt-1">Manage and approve players currently on the waitlist.</p>
                </div>

                <div className="rounded-xl border border-[#e1efe5] bg-[#f5faf6] overflow-hidden">
                  <div className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#15803D]" />
                        <Input
                          placeholder="Search waitlist by name or email..."
                          className="pl-10 h-11 rounded-lg text-[14px] border-[#e1efe5] bg-white text-[#15803D] focus:bg-white placeholder:text-[#15803D]/60"
                          value={waitlistSearch}
                          onChange={(e) => {
                            setWaitlistSearch(e.target.value);
                            setWaitlistPage(1);
                          }}
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-4 ml-auto">
                        <SearchableSelect
                          value={waitlistFilter}
                          onValueChange={(v: any) => {
                            setWaitlistFilter(v);
                            setWaitlistPage(1);
                            setSelectedWaitlistIds([]);
                          }}
                          options={[
                            { value: "PENDING", label: "Pending Queue" },
                            { value: "REJECTED", label: "Rejected Players" },
                          ]}
                          className="min-w-[170px]"
                          triggerClassName="h-11 bg-white border-[#e1efe5] text-[#15803D] font-medium rounded-lg text-[13px]"
                        />

                        {waitlistFilter === "PENDING" && waitlist.length > 0 && (
                          <div className="flex items-center gap-2 px-2 h-11 border-l border-[#e1efe5] pl-4">
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
                    </div>
                  </div>

                  {selectedWaitlistIds.length > 0 && (
                    <div className="mx-5 mb-5 mt-4 w-fit">
                      <div className="flex flex-row rounded-xl border border-[#e1efe5] divide-x divide-[#e1efe5] overflow-hidden shadow-sm">
                        <button
                          onClick={() => setIsApproveWaitlistModalOpen(true)}
                          className="flex items-center justify-center px-6 h-12 text-[13px] font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-openclub-500 bg-openclub-700 text-white hover:bg-openclub-800"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Approve All
                        </button>
                        <button
                          onClick={() => setIsRemoveWaitlistModalOpen(true)}
                          className="flex items-center justify-center px-6 h-12 text-[13px] font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-openclub-500 bg-white text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove All
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="bg-white">
                    {waitlistLoading ? (
                      <div className="border-y border-[#e1efe5] bg-white">
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
                      <div className="overflow-x-auto relative border-y border-[#e1efe5] bg-white">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                          <thead>
                            <tr className="bg-[#f5faf6] border-b border-[#e1efe5] text-[10px] font-normal text-[#15803D] uppercase tracking-wider">
                              {waitlistFilter === "PENDING" && (
                                <th className="w-12 px-4 py-4 text-center"></th>
                              )}
                              <th className={cn("px-4 py-4", waitlistFilter !== "PENDING" && "pl-6")}>PLAYER</th>
                              <th className="px-4 py-4">DETAILS</th>
                              <th className="px-4 py-4 text-center">HANDICAP / PENALTY</th>
                              <th className="px-4 py-4 text-right">ACTIONS</th>
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
                      <div className="border-y border-[#e1efe5] bg-white py-12 text-center">
                        <EmptyState
                          icon={Clock}
                          title={waitlistSearch ? "No waitlisted players found" : "Waitlist is empty"}
                          description={waitlistSearch ? "Try adjusting your search terms." : "No players currently in the queue for this tournament."}
                        />
                      </div>
                    )}
                  </div>

                  {waitlistTotal > waitlistPerPage && (
                    <div className="p-5 flex justify-end">
                      <Pagination
                        currentPage={waitlistPage}
                        totalPages={Math.ceil(waitlistTotal / waitlistPerPage)}
                        onPageChange={setWaitlistPage}
                      />
                    </div>
                  )}
                </div>

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
                <div className="border-b border-[#e1efe5] pb-4">
                  <h2 className="text-[15px] font-medium text-gray-900 font-sans">
                    {selectedTournament?.startType === 'SHOTGUN' ? 'Holes & Start Times' : 'Flights & Tee Times'}
                  </h2>
                  <p className="text-[12px] text-gray-500 mt-1">
                    Manage and organize {selectedTournament?.startType === 'SHOTGUN' ? 'hole assignments and start times' : 'flights and tee times'} for the tournament.
                  </p>
                </div>
                {groupingsLoading ? (
                  <div className="space-y-8">
                    {/* Day Selection Linear Flow Skeleton */}
                    <div className="flex items-center justify-between pb-4 border-b border-[#e1efe5] relative">
                      <div className="w-1/3 flex items-center">
                        <Skeleton className="h-10 w-36 rounded-xl bg-gray-100" />
                      </div>
                      <div className="absolute left-0 right-0 flex justify-center items-center pointer-events-none">
                        <Skeleton className="h-10 w-64 rounded-xl bg-emerald-50/70 border border-emerald-100" />
                      </div>
                      <div className="w-1/3 flex justify-end">
                        <Skeleton className="h-10 w-40 rounded-xl bg-emerald-100/70" />
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
                        <div key={i} className="bg-white rounded-xl border border-[#e1efe5] flex flex-col shadow-lg">
                          <div className="p-5 flex items-start justify-between bg-[#278a4c]/10 rounded-t-xl border-b border-[#1c6437]/10">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full bg-[#278a4c]/20 animate-pulse shrink-0" />
                              <div className="space-y-2 mt-0.5">
                                <div className="w-24 h-5 bg-[#278a4c]/20 animate-pulse rounded" />
                                <div className="w-20 h-3 bg-[#278a4c]/20 animate-pulse rounded" />
                              </div>
                            </div>
                            <div className="flex flex-col items-end mt-0.5 space-y-2">
                              <div className="w-8 h-4 bg-[#278a4c]/20 animate-pulse rounded" />
                              <div className="w-12 h-3 bg-[#278a4c]/20 animate-pulse rounded" />
                            </div>
                          </div>
                          <div className="h-[2px] w-full bg-gray-100" />
                          <div className="flex-1 p-0">
                            <div className="divide-y divide-[#efefef]">
                              {[1, 2, 3, 4].map(j => (
                                <div key={j} className="flex items-center gap-3 px-4 py-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse shrink-0 border border-[#e1efe5]" />
                                  <div className="w-32 h-4 bg-gray-100 animate-pulse rounded" />
                                  <div className="w-16 h-4 bg-gray-100 animate-pulse rounded ml-auto" />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border border-[#e1efe5] bg-[#f5faf6] overflow-hidden">
                      <div className="p-5 space-y-8">
                        {/* Day Selection Linear Flow */}
                        <div className="flex items-center justify-between pb-4 mb-12 border-b border-[#e1efe5] relative">
                          <div className="flex items-center gap-3 z-10 w-1/3">
                            {selectedDay > 1 && (
                              <button
                                onClick={() => setSelectedDay(selectedDay - 1)}
                                className="px-6 py-2.5 text-[14px] font-medium rounded-xl bg-openclub-800 text-white hover:bg-openclub-900 shadow-sm transition-all duration-300 flex items-center gap-2"
                              >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Day {selectedDay - 1}
                              </button>
                            )}
                          </div>

                          <div className="absolute left-0 right-0 flex justify-center items-center pointer-events-none z-0">
                            <div className="flex items-center gap-2.5 bg-emerald-50 backdrop-blur-md border border-emerald-200 rounded-2xl px-6 py-2.5 shadow-sm">
                              <div className="bg-emerald-200/60 p-1.5 rounded-lg">
                                <Calendar className="w-4 h-4 text-emerald-800" />
                              </div>
                              <span className="text-emerald-800 text-[15px] font-normal tracking-wide capitalize">{selectedTournament?.startType === 'SHOTGUN' ? 'Holes & Start Times' : 'Flights & Tee Times'} For</span>
                              <span className="text-emerald-950 text-[15px] font-medium tracking-wide bg-emerald-200/60 px-3.5 py-1 rounded-lg ml-1 flex items-center gap-1.5">
                                <span>Day {selectedDay}</span>
                                {(() => {
                                  const dateStr = getSelectedDayDateFormatted(selectedDay);
                                  return dateStr ? <span className="text-emerald-800 font-normal text-[13px]">({dateStr})</span> : null;
                                })()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-3 z-10 w-1/3">
                            {selectedDay < getTournamentDays() && (
                              <button
                                onClick={() => setSelectedDay(selectedDay + 1)}
                                className="px-6 py-2.5 text-[14px] font-medium rounded-xl border border-openclub-800 text-openclub-800 hover:bg-openclub-800 hover:text-white shadow-sm transition-all duration-300 flex items-center gap-2"
                              >
                                Proceed to Day {selectedDay + 1}
                                <ArrowRight className="w-4.5 h-4.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        {selectedTournament?.lockedGroupingsDays?.includes(selectedDay) && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3 text-amber-800">
                            <Lock className="w-4 h-4 shrink-0" />
                            <p className="text-[13px]">
                              Day {selectedDay} is locked. Groupings can no longer be modified.
                            </p>
                          </div>
                        )}
                        {/* Groupings Dashboard Header */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-12">
                          <div className="space-y-2">
                            <h3 className="text-[15px] font-medium text-gray-900 flex items-center gap-3">
                              Day {selectedDay} Flights
                              <span className="text-[11px] font-normal text-gray-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 shadow-sm flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" />
                                {getTournamentDays()} Day Tournament
                              </span>
                            </h3>
                            <p className="text-[13px] text-gray-500">Organize player pairings and start times for this round.</p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2.5 bg-[#fafafa] p-3 rounded-xl border-none shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)]">
                            <Button
                              onClick={() => handleGenerateGroupings('MANUAL_EMPTY')}
                              disabled={
                                selectedTournament?.lockedGroupingsDays?.includes(selectedDay) ||
                                groupingsGenerating ||
                                groupingsLoading ||
                                !groupingsData?.unassigned.length ||
                                groupingsData.unassigned.length <= groupingsData.groups.reduce((acc, g) => acc + Math.max(0, (selectedTournament?.maxPlayersPerGroup || 4) - g.registrations.length), 0)
                              }
                              className="bg-slate-800 border border-transparent text-white hover:bg-slate-900 rounded-md h-9 px-4 text-[12px] font-normal gap-1.5 shadow-sm disabled:bg-slate-50 disabled:text-gray-400 disabled:border-slate-200 disabled:shadow-none disabled:cursor-not-allowed capitalize tracking-wider transition-all"
                            >
                              {isManualGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
                              Manually Tee Players
                            </Button>

                            <Button
                              disabled={
                                selectedTournament?.lockedGroupingsDays?.includes(selectedDay) ||
                                groupingsGenerating ||
                                groupingsLoading ||
                                !groupingsData?.unassigned.length
                              }
                              onClick={() => setIsGroupingRulesModalOpen(true)}
                              className="bg-openclub-700 hover:bg-openclub-800 text-white rounded-md h-9 px-4 text-[12px] font-normal gap-1.5 shadow-sm border border-openclub-800/20 disabled:bg-slate-100 disabled:text-gray-400 disabled:border-slate-200 disabled:shadow-none disabled:cursor-not-allowed disabled:opacity-100 w-full md:w-auto capitalize tracking-wider transition-all"
                            >
                              {(groupingsGenerating && !isManualGenerating) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                              Auto Tee Players
                            </Button>
                            <Button
                              onClick={handleClearGroupings}
                              disabled={selectedTournament?.lockedGroupingsDays?.includes(selectedDay) || groupingsLoading || !groupingsData?.groups.length}
                              className="bg-red-50 hover:bg-red-100 text-red-600 rounded-md h-9 px-5 text-[12px] font-medium gap-1.5 shadow-sm border border-dashed border-red-300 hover:border-red-400 disabled:bg-slate-100 disabled:text-gray-400 disabled:border-slate-200 disabled:shadow-none disabled:cursor-not-allowed disabled:opacity-100 capitalize tracking-wider transition-all"
                            >
                              <RefreshCcw className="w-3.5 h-3.5" />
                              Reset All
                            </Button>
                            <Button
                              onClick={(e) => {
                                if (activeDropdown === "more_actions") {
                                  setActiveDropdown(null);
                                  setDropdownAnchorEl(null);
                                } else {
                                  setActiveDropdown("more_actions");
                                  setDropdownAnchorEl(e.currentTarget);
                                }
                              }}
                              variant="outline"
                              disabled={selectedTournament?.lockedGroupingsDays?.includes(selectedDay) || groupingsLoading || !groupingsData?.groups.length}
                              className="h-9 px-3 gap-1.5 inline-flex items-center justify-center rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200 shadow-sm shrink-0 relative disabled:bg-slate-50 disabled:text-gray-400 disabled:border-slate-200 disabled:shadow-none disabled:cursor-not-allowed font-normal text-[12px]"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                              More
                              {groupingsData && groupingsData.unassigned.length === 0 && groupingsData.groups.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
                                </span>
                              )}
                            </Button>

                            <FloatingMenu
                              open={activeDropdown === "more_actions"}
                              anchorEl={dropdownAnchorEl}
                              onClose={() => {
                                setActiveDropdown(null);
                                setDropdownAnchorEl(null);
                              }}
                              placement="bottom-end"
                              className="w-48 bg-white rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden"
                            >
                              <div className="p-1.5 flex flex-col gap-0.5">
                                <button
                                  onClick={async () => {
                                    setActiveDropdown(null);
                                    setDropdownAnchorEl(null);
                                    if (!selectedTournament || !groupingsData?.groups) return;
                                    try {
                                      const { generateCartSigns } = await import('@/lib/pdf-generator');
                                      await generateCartSigns(selectedTournament, groupingsData.groups);
                                      toast.success("Cart signs downloaded!");
                                    } catch (err) {
                                      toast.error("Failed to generate cart signs");
                                    }
                                  }}
                                  disabled={groupingsLoading || !groupingsData?.groups?.length}
                                  className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-left transition-colors font-normal"
                                >
                                  <Download className="w-4 h-4 text-slate-500" />
                                  Print Cart Signs
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveDropdown(null);
                                    setDropdownAnchorEl(null);
                                    setJustGrouped(false);
                                    handlePublishGroupingsEmail();
                                  }}
                                  disabled={groupingsGenerating || groupingsLoading || !groupingsData?.groups?.length}
                                  className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-left transition-colors font-normal"
                                >
                                  <Mail className="w-4 h-4 text-[#15803D]" />
                                  Send via Mail
                                  {publishClickCount > 0 && (
                                    <span className="ml-auto bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-md text-[10px] font-normal">
                                      {publishClickCount}
                                    </span>
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveDropdown(null);
                                    setDropdownAnchorEl(null);
                                    setJustGrouped(false);
                                    handlePublishGroupingsWhatsApp();
                                  }}
                                  disabled={groupingsGenerating || groupingsLoading || !groupingsData?.groups?.length}
                                  className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-left transition-colors font-normal"
                                >
                                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                                  Send via WhatsApp
                                  {publishWhatsAppClickCount > 0 && (
                                    <span className="ml-auto bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-md text-[10px] font-normal">
                                      {publishWhatsAppClickCount}
                                    </span>
                                  )}
                                </button>
                                <a
                                  href={`/tv/tournaments/${selectedTournament?.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => {
                                    setActiveDropdown(null);
                                    setDropdownAnchorEl(null);
                                  }}
                                  className={cn(
                                    "flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 rounded-lg text-left transition-colors font-normal no-underline hover:no-underline",
                                    (groupingsGenerating || groupingsLoading || !groupingsData?.groups?.length) ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                                  )}
                                >
                                  <MonitorPlay className="w-4 h-4 text-violet-600" />
                                  Display on TV
                                </a>
                              </div>
                            </FloatingMenu>
                          </div>
                        </div>
                        {/* Sticky Header for Tabs and Search */}
                        <div className="sticky top-0 z-30 bg-[#f9fafb]/95 backdrop-blur-md pb-4 pt-4 -mt-4 mb-6 shadow-sm border-b border-[#e1efe5]">
                          {/* Sub-tabs for Unassigned/Grouped */}
                          <div className="flex rounded-xl border border-[#e1efe5] divide-x divide-[#e1efe5] overflow-hidden mb-5" role="tablist" aria-label="Player Assignments">
                            <button
                              type="button"
                              role="tab"
                              aria-selected={groupingsSubTab === "unassigned"}
                              id="tab-unassigned"
                              onKeyDown={(e) => { if (e.key === "ArrowRight") document.getElementById("tab-grouped")?.focus(); }}
                              onClick={() => {
                                setGroupingsSubTab("unassigned");
                                setUnassignedPage(1);
                              }}
                              className={cn(
                                "flex-1 flex flex-row items-center justify-center h-12 text-[13px] font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-openclub-500",
                                groupingsSubTab === "unassigned" ? "bg-openclub-700 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                              )}
                            >
                              Unassigned Tee Players
                              <Badge variant="outline" className={cn(
                                "ml-2 font-normal px-1.5 py-0 transition-all border-0 flex items-center justify-center min-w-[20px] h-[20px]",
                                groupingsSubTab === "unassigned" ? "bg-white/20 text-white" : (groupingsData?.unassigned.length === 0 ? "bg-gray-100 text-gray-500" : "bg-amber-100 text-amber-700")
                              )}>
                                {groupingsData?.unassigned.length === 0 ? <Check className={cn("w-3 h-3", groupingsSubTab === "unassigned" ? "text-white" : "text-green-600")} /> : groupingsData?.unassigned.length || 0}
                              </Badge>
                            </button>
                            <button
                              type="button"
                              role="tab"
                              aria-selected={groupingsSubTab === "grouped"}
                              id="tab-grouped"
                              onKeyDown={(e) => { if (e.key === "ArrowLeft") document.getElementById("tab-unassigned")?.focus(); }}
                              onClick={() => {
                                setGroupingsSubTab("grouped");
                                setGroupsPage(1);
                              }}
                              className={cn(
                                "flex-1 flex flex-row items-center justify-center h-12 text-[13px] font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-openclub-500",
                                groupingsSubTab === "grouped" ? "bg-openclub-700 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                              )}
                            >
                              Assigned Tee Flights
                              <Badge variant="outline" className={cn(
                                "ml-2 font-normal px-1.5 py-0 transition-all border-0",
                                groupingsSubTab === "grouped" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                              )}>
                                {groupingsData?.groups.length || 0}
                              </Badge>
                            </button>
                          </div>

                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative flex-1">
                              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#15803D]" />
                              <Input
                                placeholder="Search groups or players..."
                                value={groupingsSearch}
                                onChange={(e) => {
                                  setGroupingsSearch(e.target.value);
                                  setGroupsPage(1);
                                  setUnassignedPage(1);
                                }}
                                className="pl-10 h-11 rounded-lg text-[14px] border-[#e1efe5] bg-white text-[#15803D] focus:bg-white placeholder:text-[#15803D]/60"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {groupingsData && (groupingsData.groups.length > 0 || groupingsData.unassigned.length > 0) ? (
                        <div className="space-y-6 relative">
                          <AnimatePresence mode="wait">
                            {groupingsSubTab === "grouped" && (
                              <motion.div
                                key="grouped"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6 px-5 pb-5"
                              >

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {[...groupingsData.groups].reverse()
                                    .filter(group => {
                                      const query = debouncedGroupingsSearch.trim().toLowerCase();
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
                                            "group bg-white rounded-xl border transition-all duration-300 overflow-visible flex flex-col shadow-lg",
                                            isFull ? "border-emerald-100 bg-white" : "border-[#e1efe5] hover:border-emerald-200 hover:shadow-xl"
                                          )}
                                        >
                                          <div className="p-5 flex items-start justify-between bg-[#278a4c] rounded-t-xl border-b border-[#1c6437]/50">
                                            <div className="flex items-start gap-4 min-w-0">
                                              <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
                                                isFull ? "bg-[#116630] text-emerald-200" : "bg-[#116630]/70 text-emerald-100"
                                              )}>
                                                <Flag className="w-5 h-5" />
                                              </div>
                                              <div className="min-w-0 mt-0.5">
                                                {editingGroupNameId === group.id ? (
                                                  <Input
                                                    autoFocus
                                                    value={editingGroupNameValue}
                                                    onChange={(e) => setEditingGroupNameValue(e.target.value)}
                                                    onBlur={() => handleUpdateGroupDetails(group.id, { name: editingGroupNameValue })}
                                                    className="h-8 py-0 px-2 text-base font-medium rounded-md border-gray-300 w-full bg-white text-gray-900"
                                                  />
                                                ) : (
                                                  <h3
                                                    onClick={() => { setEditingGroupNameId(group.id); setEditingGroupNameValue(group.name); }}
                                                    className="text-base font-medium text-white truncate cursor-pointer hover:text-emerald-100 transition-colors"
                                                  >
                                                    {group.name}
                                                  </h3>
                                                )}
                                                <p className="text-xs text-emerald-100 mt-0.5 flex items-center gap-1.5">
                                                  <Clock className="w-3.5 h-3.5 text-emerald-200" />
                                                  {group.startTime ? group.startTime.substring(11, 16) : "TBD"}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end mt-0.5">
                                              <div className="text-sm font-medium text-white">{occupancy}/{capacity}</div>
                                              <div className="text-xs text-emerald-200 mt-0.5">Players</div>
                                            </div>
                                          </div>
                                          <div className="h-[2px] w-full bg-gray-100">
                                            <div
                                              className={cn("h-full transition-all duration-500", isFull ? "bg-emerald-500" : "bg-gray-300")}
                                              style={{ width: `${(occupancy / capacity) * 100}%` }}
                                            />
                                          </div>
                                          {/* Group Players (Tabular) */}
                                          <div className="flex-1 overflow-visible">
                                            <table className="w-full text-left">
                                              <tbody className="divide-y divide-[#efefef]">
                                                {group.registrations.map((player: GroupingPlayer) => (
                                                  <tr key={player.id} className="hover:bg-emerald-50/30 transition-colors group/player h-[52px]">
                                                    <td className="pl-4 py-2 w-[44px] align-middle">
                                                      <div className="w-8 h-8 rounded-full overflow-hidden border border-[#e1efe5] bg-white shadow-sm shrink-0">
                                                        <img
                                                          src={player.user?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.user?.email || player.id)}`}
                                                          alt=""
                                                          className="w-full h-full object-cover"
                                                        />
                                                      </div>
                                                    </td>
                                                    <td className="py-2 px-2 align-middle max-w-[130px]">
                                                      <NextLink href="#" className="block truncate">
                                                        <div className="text-[12px] text-gray-900 font-medium hover:text-openclub-800 transition-colors truncate">
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
                                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-purple-50 text-purple-700 border border-purple-100 uppercase tracking-wider whitespace-nowrap">
                                                            {getGolfCategory(player.user.handicap).replace('Category ', 'Cat ')}
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
                                                      {!selectedTournament?.lockedGroupingsDays?.includes(selectedDay) && (
                                                        <PlayerActionDropdown
                                                          player={player}
                                                          group={group}
                                                          groupingsData={groupingsData}
                                                          disabled={selectedTournament?.lockedGroupingsDays?.includes(selectedDay)}
                                                          onMovePlayer={handleMovePlayer}
                                                          capacity={selectedTournament?.maxPlayersPerGroup || 4}
                                                        />
                                                      )}
                                                    </td>
                                                  </tr>
                                                ))}
                                                {Array.from({ length: Math.max(0, capacity - occupancy) }).map((_, i) => (
                                                  <tr key={`empty-${i}`} className="opacity-70 hover:opacity-100 transition-opacity h-[52px]">
                                                    <td className="pl-4 py-2 w-[44px] align-middle">
                                                      <div className="w-8 h-8 rounded-full bg-background border border-dashed border-gray-300 flex items-center justify-center">
                                                        <Plus className="w-4 h-4 text-gray-400" />
                                                      </div>
                                                    </td>
                                                    <td className="py-2 px-2 pr-4 align-middle" colSpan={3}>
                                                      {selectedTournament?.lockedGroupingsDays?.includes(selectedDay) ? (
                                                        <div className="text-[12px] text-gray-400 italic flex items-center h-9">
                                                          Empty Slot
                                                        </div>
                                                      ) : (
                                                        <SearchableSelect
                                                          value=""
                                                          onValueChange={(playerId) => {
                                                            if (playerId) {
                                                              handleMovePlayer(playerId, group.id);
                                                            }
                                                          }}
                                                          disabled={selectedTournament?.lockedGroupingsDays?.includes(selectedDay)}
                                                          placeholder="Available Space (click to assign)"
                                                          options={groupingsData.unassigned.map((p: any) => ({
                                                            value: p.id,
                                                            label: `${p.user?.firstName} ${p.user?.lastName} (HCP ${p.user?.handicap ?? 0} | ${getGolfCategory(p.user?.handicap) || 'Unknown'} | ${p.user?.gender ? p.user.gender.toUpperCase() : 'N/A'})`
                                                          }))}
                                                          triggerClassName="h-9 text-[12px] bg-white border-[#e1efe5] text-[#15803D] font-medium placeholder:text-[#15803D]/60"
                                                          className="w-full"
                                                        />
                                                      )}
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
                              </motion.div>
                            )}

                            {groupingsSubTab === "unassigned" && (
                              <motion.div
                                key="unassigned"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white border border-[#e1efe5] rounded-xl shadow-sm overflow-hidden"
                              >

                                <div className="p-6">
                                  {(() => {
                                    const filtered = groupingsData.unassigned.filter(p => {
                                      const query = debouncedGroupingsSearch.trim().toLowerCase();
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
                                      <>
                                        <div className="bg-white border border-[#e1efe5] rounded-xl overflow-hidden shadow-sm">
                                          <div className="overflow-x-auto border-y border-[#e1efe5]">
                                            <table className="w-full text-left">
                                              <thead>
                                                <tr className="bg-[#f5faf6] border-b border-[#e1efe5] text-[10px] font-normal text-[#15803D] uppercase tracking-wider">
                                                  <th className="px-4 py-3">PLAYER</th>
                                                  <th className="px-4 py-3">ATTRIBUTES</th>
                                                  {!selectedTournament?.lockedGroupingsDays?.includes(selectedDay) && (
                                                    <th className="px-4 py-3 text-right">ACTIONS</th>
                                                  )}
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
                                                              <div className="text-[13px] text-gray-900 font-medium hover:text-openclub-800 transition-colors truncate">
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
                                                      {!selectedTournament?.lockedGroupingsDays?.includes(selectedDay) && (
                                                        <td className="px-4 py-3 align-middle text-right">
                                                          <div className="flex justify-end">
                                                            <PlayerActionDropdown
                                                              player={player}
                                                              groupingsData={groupingsData}
                                                              disabled={selectedTournament?.lockedGroupingsDays?.includes(selectedDay) || !groupingsData?.groups?.length}
                                                              onMovePlayer={handleMovePlayer}
                                                              variant="assign"
                                                              capacity={selectedTournament?.maxPlayersPerGroup || 4}
                                                            />
                                                          </div>
                                                        </td>
                                                      )}
                                                    </tr>
                                                  ))
                                                ) : (
                                                  <tr>
                                                    <td colSpan={selectedTournament?.lockedGroupingsDays?.includes(selectedDay) ? 2 : 3} className="px-4 py-12">
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
                                        </div>
                                        {filtered.length > unassignedPerPage && (
                                          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                                      </>
                                    );
                                  })()}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <EmptyState
                          icon={Users}
                          title="No Flights Assigned"
                          description={`Use Auto Tee Players to distribute players into flights for Day ${selectedDay}.`}
                        />
                      )}
                    </div>
                  </>
                )}
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

                <div className="rounded-xl border border-[#e1efe5] bg-[#f5faf6] overflow-hidden">
                  <div className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#15803D]" />
                        <Input
                          value={registrationsSearch}
                          onChange={(e) => {
                            setRegistrationsPage(1);
                            if (registrationsMode === "server") setRegistrationsLoading(true);
                            setRegistrationsSearch(e.target.value);
                          }}
                          placeholder="Search name or email..."
                          className="pl-10 h-11 rounded-lg text-[14px] border-[#e1efe5] bg-white text-[#15803D] focus:bg-white placeholder:text-[#15803D]/60"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-4 ml-auto">
                        <SearchableSelect
                          value={penalizeFilter}
                          onValueChange={(v: any) => {
                            setPenalizeFilter(v);
                            setRegistrationsPage(1);
                          }}
                          options={[
                            { value: "APPROVED", label: "Active Players" },
                            { value: "DISQUALIFIED", label: "Disqualified Players" },
                          ]}
                          className="min-w-[170px]"
                          triggerClassName="h-11 bg-white border-[#e1efe5] text-[#15803D] font-medium rounded-lg text-[13px]"
                        />
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
                          className="min-w-[160px]"
                          triggerClassName="h-11 bg-white border-[#e1efe5] text-[#15803D] font-medium rounded-lg text-[13px]"
                        />
                      </div>
                    </div>
                  </div>

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
                        <div className="bg-white">
                          {registrationsLoading ? (
                            <div className="border-t border-[#e1efe5] bg-white">
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
                            <div className="overflow-x-auto relative border-t border-[#e1efe5] bg-white">
                              <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                  <tr className="bg-[#f5faf6] border-b border-[#e1efe5] text-[10px] font-normal text-[#15803D] uppercase tracking-wider">
                                    <th className="px-4 py-4">PLAYER</th>
                                    <th className="px-4 py-4">STATUS & PAYMENT</th>
                                    <th className="px-4 py-4">DETAILS</th>
                                    <th className="px-4 py-4 text-center">HANDICAP / PENALTY</th>
                                    <th className="px-4 py-4 text-right">ACTIONS</th>
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
                                                src={r.user?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(r.user?.email || r.id)}`}
                                                alt=""
                                                className="w-full h-full object-cover"
                                              />
                                            </div>
                                            <div className="min-w-0">
                                              <NextLink href={`/organizer-admin/users/${r.user?.id}`} className="block no-underline hover:no-underline">
                                                <p className="text-[14px] font-medium text-gray-900 truncate hover:text-openclub-800 transition-colors no-underline">
                                                  {r.user?.firstName} {r.user?.lastName}
                                                </p>
                                              </NextLink>
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
                                              r.paymentStatus === "PAID" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                                "bg-background text-gray-600 border border-gray-250"
                                            )}>
                                              {r.paymentStatus || "UNPAID"}
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
                                          <div className="flex items-center justify-end">
                                            <PenalizeActionDropdown
                                              player={r}
                                              selectedTournament={selectedTournament}
                                              openStrokeModal={openStrokeModal}
                                              openDisqualify={openDisqualify}
                                              openEnablePlayer={openEnablePlayer}
                                            />
                                          </div>
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

                        </div>
                        {/* Pagination */}
                        {!registrationsLoading && (registrationsMode === "client" ? penalizeListAll.length > 0 : registrationsTotal > 0) && (
                          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#e1efe5]">
                            <p className="text-[13px] text-gray-500 font-normal">
                              Showing {(registrationsPage - 1) * registrationsPerPage + 1} to{" "}
                              {registrationsMode === "client" ? Math.min(registrationsPage * registrationsPerPage, penalizeListAll.length) : Math.min(registrationsPage * registrationsPerPage, registrationsTotal)} of{" "}
                              {registrationsMode === "client" ? penalizeListAll.length : registrationsTotal} registrations
                            </p>
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
        className="max-w-2xl"
      >
        <div className="space-y-6 pt-4">
          <p className="text-[14px] text-gray-600">
            Select a rule below to automatically group your players into flights. This will instantly generate groupings based on your selection.
          </p>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
            {[
              { value: "RANDOM", label: "Random Grouping", desc: "Mixes all players randomly. Great for fun and social games.", icon: Shuffle },
              { value: "CATEGORY_RANDOM", label: "Category Balanced", desc: "Evenly spreads top players and amateurs across flights so every group has a fair, balanced mix of skill levels.", icon: SlidersHorizontal },
              { value: "LEADERBOARD_REVERSE_GROSS", label: "Leaderboard Reversed", desc: "Leaders tee off last: Best performers from previous rounds play in the final flights so the champions finish last. (Day 2+ only).", disabled: selectedDay === 1, icon: ArrowUp },
            ].map((rule) => {
              const Icon = rule.icon;
              return (
                <button
                  key={rule.value}
                  disabled={rule.disabled}
                  onClick={() => setSelectedAutoTeeRule(rule.value)}
                  className={`relative w-full text-left p-4 rounded-xl border-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${selectedAutoTeeRule === rule.value
                    ? "border-[#15803D] bg-[#f5faf6]"
                    : "border-[#e1efe5] bg-white hover:bg-[#f5faf6]"
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-2 flex-shrink-0 rounded-lg ${selectedAutoTeeRule === rule.value ? "bg-[#15803D] text-white" : "bg-[#f5faf6] text-zinc-500 border border-[#e1efe5]"}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-medium ${selectedAutoTeeRule === rule.value ? "text-zinc-900" : "text-zinc-700"}`}>{rule.label}</h4>
                      <p className="text-[12px] text-zinc-500 mt-1 leading-relaxed pr-6">
                        {rule.desc}
                      </p>
                    </div>
                  </div>
                  {selectedAutoTeeRule === rule.value && (
                    <div className="absolute top-4 right-4">
                      <CheckCircle2 className="w-5 h-5 text-[#15803D]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#e1efe5]">
            <Button
              variant="outline"
              onClick={() => setIsGroupingRulesModalOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
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
              className="bg-openclub-800 hover:bg-emerald-700 text-white rounded-xl px-8 font-normal shadow-sm disabled:bg-slate-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Confirm Selection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Publish Email Prototype Modal */}
      <Modal
        isOpen={isPublishEmailModalOpen}
        onClose={() => !groupingsGenerating && setIsPublishEmailModalOpen(false)}
        title={selectedTournament?.startType === 'SHOTGUN' ? `Send Day ${selectedDay} Hole Assignments` : `Send Day ${selectedDay} Flights & Tee Times`}
        className="max-w-2xl"
      >
        {(() => {
          const scheduledDate = (() => {
            if (!selectedTournament?.startDate) return '';
            const d = new Date(selectedTournament.startDate);
            if (isNaN(d.getTime())) return '';
            d.setDate(d.getDate() + (selectedDay - 1));
            return d.toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
          })();

          return (
            <div className="space-y-6 pt-4">
              <p className="text-[14px] text-gray-600">
                This will send an official email notification to all assigned players with their specific grouping, tee time, and date information. Review the email prototype below before publishing.
              </p>

              <div className="bg-[#fafafa] border border-[#e1efe5] rounded-xl p-5 shadow-sm space-y-4">
                <div className="border-b border-[#e1efe5] pb-3 mb-3">
                  <p className="text-[12px] text-gray-500 font-normal">From: <span className="text-gray-900 font-medium">OpenClubOS &lt;no-reply@openclubos.com&gt;</span></p>
                  <p className="text-[12px] text-gray-500 font-normal mt-1">Subject: <span className="text-gray-900 font-medium">Your Tee Time for Day {selectedDay}{scheduledDate ? ` (${scheduledDate})` : ''} - {selectedTournament?.name}</span></p>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-gray-100 pb-2">
                    <h2 className="text-[17px] font-medium text-gray-900">{selectedTournament?.name}</h2>
                    {scheduledDate && (
                      <span className="text-[12px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md w-fit">
                        📅 Day {selectedDay} • {scheduledDate}
                      </span>
                    )}
                  </div>
                  <p className="text-[14px] text-gray-700">Hi <span className="text-gray-900 font-medium">[Player First Name]</span>,</p>
                  <p className="text-[14px] text-gray-700">
                    Your tee time and flight grouping for Day {selectedDay} have been assigned. Please review your schedule below:
                  </p>

                  <div className="bg-[#f4fdf8] border border-[#e1efe5] rounded-lg p-4 my-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Scheduled Date</p>
                        <p className="text-[15px] font-medium text-gray-900 mt-0.5">{scheduledDate || `Day ${selectedDay}`}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Tee Time</p>
                        <p className="text-[15px] font-medium text-openclub-800 mt-0.5">[Player Tee Time]</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">{selectedTournament?.startType === 'SHOTGUN' ? 'Starting Hole' : 'Flight'}</p>
                        <p className="text-[15px] font-medium text-gray-900 mt-0.5">[Player Flight Name]</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-[14px] text-gray-700">
                    Please ensure you arrive at the clubhouse at least 30 minutes before your scheduled tee time.
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
                  className="rounded-xl font-medium"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmPublishGroupingsEmail}
                  disabled={groupingsGenerating || (groupingsData?.groups.reduce((acc, g) => acc + g.registrations.length, 0) || 0) === 0}
                  className="bg-openclub-800 hover:bg-emerald-700 text-white rounded-xl gap-2 font-medium shadow-sm disabled:bg-slate-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {groupingsGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send Emails to {groupingsData?.groups.reduce((acc, g) => acc + g.registrations.length, 0)} Players
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* WhatsApp Flight Dispatch Modal */}
      <Modal
        isOpen={isPublishWhatsAppModalOpen}
        onClose={() => !groupingsGenerating && setIsPublishWhatsAppModalOpen(false)}
        title={selectedTournament?.startType === 'SHOTGUN' ? `Send Day ${selectedDay} Hole Assignments via WhatsApp` : `Send Day ${selectedDay} Flights via WhatsApp`}
        className="max-w-2xl"
      >
        {(() => {
          const scheduledDate = (() => {
            if (!selectedTournament?.startDate) return '';
            const d = new Date(selectedTournament.startDate);
            if (isNaN(d.getTime())) return '';
            d.setDate(d.getDate() + (selectedDay - 1));
            return d.toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
          })();

          return (
            <div className="space-y-6 pt-4">
              <p className="text-[14px] text-gray-600">
                Dispatch official tee times and flight assignments directly to registered players via WhatsApp. You can also copy the formatted flight roster with scheduled dates to share into a WhatsApp group chat.
              </p>

              {/* WhatsApp Message Preview Bubble */}
              <div className="bg-[#e5ddd5] dark:bg-slate-900 border border-[#d1c7bc] dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center text-white">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[12px] font-medium text-gray-900 dark:text-gray-100">Sendchamp WhatsApp Gateway</p>
                      <p className="text-[10px] text-gray-500">Official OpenClubOS Verified Sender</p>
                    </div>
                  </div>
                  <span className="text-[11px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-medium px-2.5 py-0.5 rounded-full">
                    Live Preview
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl rounded-tl-none p-4 shadow-sm max-w-lg space-y-2 border border-black/5">
                  <p className="text-[13px] text-gray-900 dark:text-gray-100 font-medium">
                    ⛳ {selectedTournament?.name || 'Tournament'}
                  </p>
                  <p className="text-[12px] text-emerald-800 dark:text-emerald-300 font-medium">
                    📅 Schedule: Day {selectedDay}{scheduledDate ? ` (${scheduledDate})` : ''}
                  </p>
                  <p className="text-[12px] text-gray-700 dark:text-gray-300">
                    Hi <span className="font-medium text-gray-900 dark:text-white">[Player Name]</span>, your tournament grouping has been confirmed:
                  </p>
                  <div className="bg-[#f0fdf4] dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-lg p-3 text-[12px] space-y-1.5 text-gray-800 dark:text-gray-200">
                    {scheduledDate && (
                      <p>• Date: <span className="font-medium text-gray-900 dark:text-white">{scheduledDate}</span></p>
                    )}
                    <p>• {selectedTournament?.startType === 'SHOTGUN' ? 'Starting Hole' : 'Flight / Group'}: <span className="font-medium text-emerald-800 dark:text-emerald-300">[Assigned Flight]</span></p>
                    <p>• Tee Time: <span className="font-medium text-emerald-800 dark:text-emerald-300">[Start Time]</span></p>
                    <p>• Playing Partners: <span className="font-normal text-gray-700 dark:text-gray-300">[Group Members]</span></p>
                  </div>
                  <p className="text-[11px] text-gray-500 pt-1">
                    Please arrive at least 30 minutes before your tee time. Best of luck on the course!
                  </p>
                  <div className="flex justify-end pt-1">
                    <span className="text-[10px] text-gray-400">Just now ✓✓</span>
                  </div>
                </div>
              </div>

              {/* Recipient summary & Group Copy action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div>
                  <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100">
                    Total Assigned Players: <span className="text-emerald-600 font-medium">{groupingsData?.groups.reduce((acc, g) => acc + g.registrations.length, 0) || 0}</span>
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Messages will include tournament dates and individual flight schedules.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyFlightRoster}
                  className="rounded-lg gap-1.5 text-[12px] font-medium border-slate-300 hover:bg-slate-100"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  Copy Roster for Group Chat
                </Button>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#e1efe5]">
                <Button
                  variant="outline"
                  onClick={() => setIsPublishWhatsAppModalOpen(false)}
                  disabled={groupingsGenerating}
                  className="rounded-xl font-medium"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmPublishGroupingsWhatsApp}
                  disabled={groupingsGenerating || (groupingsData?.groups.reduce((acc, g) => acc + g.registrations.length, 0) || 0) === 0}
                  className="bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl gap-2 font-medium shadow-sm disabled:bg-slate-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {groupingsGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send WhatsApp via Sendchamp ({groupingsData?.groups.reduce((acc, g) => acc + g.registrations.length, 0)} Players)
                </Button>
              </div>
            </div>
          );
        })()}
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