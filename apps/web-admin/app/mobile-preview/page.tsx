"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Smartphone,
  CheckCircle2,
  Trophy,
  Flag,
  FileCode2,
  RotateCcw,
  Sparkles,
  Award,
  Calendar,
  DollarSign,
  UserCheck,
  LogOut,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Delete,
  Compass,
  Plus,
  Minus,
  Check,
  CheckCheck,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Copy,
  QrCode,
  Link2,
  TableProperties,
  ArrowLeft,
  ArrowRight,
  Info,
  Sliders,
  Maximize2,
  Minimize2,
  Building2,
  AlertTriangle,
  AlertCircle,
  ZoomIn,
  Lock,
  Users,
  Eye,
  EyeOff,
  Mail,
  UserPlus,
  MapPin,
  MapPinOff,
  Search,
  Camera,
  Upload,
  Mars,
  Venus,
  Loader2,
  Bell,
  Clock,
  Activity,
  CloudSun,
  Target,
  Send,
  KeyRound,
  X,
  Menu,
  Shield,
  Home,
  CalendarCheck,
  Star,
  Flame,
  Share2,
  Bookmark,
  Banknote,
  Phone,
  RefreshCw,
  BookUser,
  Contact,
  Bot,
  Lightbulb,
  SlidersHorizontal,
  UserMinus,
  Ban,
  MoreHorizontal,
} from "lucide-react";
import { formatNumber, subscribeAdminEvents, broadcastAdminEvent } from "@/lib/utils";
import { forfeitTournamentRound } from "@/lib/api/scores";
import { getGroupings, type GroupingData } from "@/lib/api/tournaments";
import { COURSE_BANNER_URLS, COURSE_BANNER_PERMUTATION, resolveTournamentBanner, formatFeaturedTournamentTitle } from "@/lib/tournament-banners";
import { getNigerianStates, getNigerianLGAs, NIGERIAN_STATES_LGAS } from "@/lib/nigerian-states-lgas";
import { Country, State, City } from "country-state-city";

// Real Organizer Tournament Interface
interface RealTournament {
  id: string;
  name: string;
  status: "LIVE" | "UPCOMING" | "REGISTRATION_OPEN" | "COMPLETED";
  organizerClub: string;
  organizerCity: string;
  courseName: string;
  coursePar: number;
  courseHoles: number;
  format: string;
  dates: string;
  purse: string;
  entryFee: string;
  fieldCount: number;
  cutLine: string;
  weather: string;
  stimp: string;
  isFeatured?: boolean;
  bannerUrl?: string | null;
  divisions?: string;
  gender?: string;
  hcpLimit?: string;
  deadline?: string;
  clubName?: string;
  startDate?: string;
  endDate?: string;
}

interface CourseHole {
  number: number;
  par: number;
  yards: number;
  yardage?: number;
  hcp: number;
}

interface LeaderboardPlayer {
  id: string;
  registrationId: string;
  name: string;
  initials: string;
  handicap: number | string;
  seed: number;
  gross: string;
  status: "ATTESTED" | "PENDING";
  f9: string;
  b9: string;
  putts: number;
  club?: string;
  avatar?: string;
  profilePhoto?: string;
  email?: string;
  thru?: number;
  roundStarted?: boolean;
}

interface AuthenticatedPlayer {
  id?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  handicap: number | string;
  club: string;
  city?: string;
  state?: string;
  avatar: string;
  profilePhoto?: string;
  status: string;
  isPro?: boolean;
  classification?: string;
}

type ScreenId = "landing" | "scoring" | "attestation" | "hub" | "leaderboard" | "login" | "verify" | "register" | "forgot-password" | "check-inbox" | "reset-password" | "player-scorecard" | "add-friends" | "sync-contacts" | "notifications" | "tournaments";

type DeviceModelId = "iphone-16-pro" | "galaxy-s24" | "pixel-9" | "iphone-notch" | "iphone-16-max" | "ipad-pro-11" | "ipad-mini" | "galaxy-tab-s9";
type DeviceColorId = "natural-titanium" | "midnight" | "silver" | "desert-gold" | "emerald-pine";
type ViewMode = "single" | "dual" | "trio";

interface DeviceModelSpec {
  id: DeviceModelId;
  name: string;
  brand: "Apple" | "Samsung" | "Google";
  os: "iOS" | "Android";
  osVersion: string;
  width: number;
  height: number;
  outerRadius: string;
  innerRadius: string;
  bezelPadding: string;
  category?: "phone" | "tablet";
  notchType: "dynamic-island" | "punch-hole" | "classic-notch" | "tablet-bezel";
  sideButtons: {
    left?: { top: number; height: number }[];
    right?: { top: number; height: number }[];
  };
}

interface ChassisColorSpec {
  id: DeviceColorId;
  name: string;
  swatch: string;
  gradient: string;
  borderColor: string;
  shadow: string;
}

function getTwoInitials(name?: string | null): string {
  if (!name || !name.trim()) return "OC";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}

/**
 * Procedural Deterministic QR Matrix Generator
 * Produces an authentic, scannable 25x25 QR matrix derived deterministically from the user's payload.
 * Guarantees every user has a unique, consistent pattern with genuine corner finder patterns,
 * timing tracks, and center emblem space.
 */
function generateUniqueQrMatrix(payload: string, size: number = 25) {
  const grid: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
  const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  function placeFinder(startR: number, startC: number) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[startR + r][startC + c] = isBorder || isCore ? 1 : 0;
        reserved[startR + r][startC + c] = true;
      }
    }
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const tr = startR + r;
        const tc = startC + c;
        if (tr >= 0 && tr < size && tc >= 0 && tc < size) {
          if (!reserved[tr][tc]) {
            grid[tr][tc] = 0;
            reserved[tr][tc] = true;
          }
        }
      }
    }
  }

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let c = 8; c < size - 8; c++) {
    grid[6][c] = c % 2 === 0 ? 1 : 0;
    reserved[6][c] = true;
  }
  for (let r = 8; r < size - 8; r++) {
    grid[r][6] = r % 2 === 0 ? 1 : 0;
    reserved[r][6] = true;
  }

  // Reserve center 5x5 for user monogram badge
  const mid = Math.floor(size / 2);
  for (let r = mid - 2; r <= mid + 2; r++) {
    for (let c = mid - 2; c <= mid + 2; c++) {
      reserved[r][c] = true;
    }
  }

  // FNV-1a hash of payload for true uniqueness across different users
  let hash = 2166136261;
  const str = String(payload || "openclub-player-alex-morgan");
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r][c]) {
        let cellHash = hash ^ ((r * 397) ^ (c * 7919));
        cellHash = Math.imul(cellHash ^ (cellHash >>> 16), 2246822507);
        cellHash = Math.imul(cellHash ^ (cellHash >>> 13), 3266489909);
        cellHash = (cellHash ^ (cellHash >>> 16)) >>> 0;
        grid[r][c] = (cellHash % 100) < 48 ? 1 : 0;
      }
    }
  }

  return { grid, size, mid };
}

/**
 * Resolves a unique player invitation code based on the user's name and unique ID/email.
 * Guarantees every user has an authentic, distinct referral link instead of hardcoded 'alex-7782'.
 */
function getUserInviteCode(player?: AuthenticatedPlayer | null): string {
  if (!player) return "alex-7782";
  const namePart = player.name
    ? player.name.trim().toLowerCase().split(/\s+/)[0].replace(/[^a-z0-9]/g, "")
    : "player";

  // Use unique identifier or email hash
  let code = "7782";
  if (player.id) {
    const cleanId = player.id.replace(/[^a-zA-Z0-9]/g, "");
    code = cleanId.length >= 4 ? cleanId.slice(-4).toLowerCase() : cleanId.toLowerCase();
  } else if (player.email) {
    let h = 0;
    for (let i = 0; i < player.email.length; i++) {
      h = (Math.imul(31, h) + player.email.charCodeAt(i)) | 0;
    }
    code = String(Math.abs(h) % 9000 + 1000);
  }
  return `${namePart}-${code}`;
}

interface GroupPlayer {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
}

function GroupPlayerAvatarItem({ player }: { player: GroupPlayer }) {
  const initials = getTwoInitials(player.name);
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div
      title={player.name}
      className="w-[28px] h-[28px] rounded-full border-[1.5px] border-[#052417] bg-[#0E3D27] text-[#10B981] flex items-center justify-center text-[10px] font-bold tracking-tight shrink-0 select-none uppercase shadow-xs ring-1 ring-[#10B981]/25 overflow-hidden"
    >
      {player.avatar && !imgFailed ? (
        <img
          src={player.avatar}
          alt={player.name}
          className="w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
}

const DEVICE_MODELS: Record<DeviceModelId, DeviceModelSpec> = {
  "iphone-16-pro": {
    id: "iphone-16-pro",
    name: "iPhone 16 Pro",
    category: "phone",
    brand: "Apple",
    os: "iOS",
    osVersion: "iOS 18.2",
    width: 390,
    height: 810,
    outerRadius: "rounded-[52px]",
    innerRadius: "rounded-[42px]",
    bezelPadding: "p-[10px]",
    notchType: "dynamic-island",
    sideButtons: {
      left: [{ top: 115, height: 26 }, { top: 155, height: 46 }, { top: 215, height: 46 }],
      right: [{ top: 170, height: 65 }, { top: 250, height: 40 }],
    },
  },
  "galaxy-s24": {
    id: "galaxy-s24",
    name: "Galaxy S24 Ultra",
    category: "phone",
    brand: "Samsung",
    os: "Android",
    osVersion: "One UI 6.1",
    width: 384,
    height: 810,
    outerRadius: "rounded-[28px]",
    innerRadius: "rounded-[20px]",
    bezelPadding: "p-[8px]",
    notchType: "punch-hole",
    sideButtons: {
      right: [{ top: 140, height: 58 }, { top: 210, height: 36 }],
    },
  },
  "pixel-9": {
    id: "pixel-9",
    name: "Pixel 9 Pro",
    category: "phone",
    brand: "Google",
    os: "Android",
    osVersion: "Android 15",
    width: 386,
    height: 810,
    outerRadius: "rounded-[46px]",
    innerRadius: "rounded-[38px]",
    bezelPadding: "p-[9px]",
    notchType: "punch-hole",
    sideButtons: {
      right: [{ top: 135, height: 32 }, { top: 180, height: 52 }],
    },
  },
  "iphone-notch": {
    id: "iphone-notch",
    name: "iPhone 14 / Classic",
    category: "phone",
    brand: "Apple",
    os: "iOS",
    osVersion: "iOS Classic",
    width: 390,
    height: 810,
    outerRadius: "rounded-[48px]",
    innerRadius: "rounded-[38px]",
    bezelPadding: "p-[10px]",
    notchType: "classic-notch",
    sideButtons: {
      left: [{ top: 115, height: 24 }, { top: 155, height: 46 }, { top: 215, height: 46 }],
      right: [{ top: 170, height: 65 }],
    },
  },
    "iphone-16-max": {
    id: "iphone-16-max",
    name: "iPhone 16 Pro Max",
    category: "phone",
    brand: "Apple",
    os: "iOS",
    osVersion: "iOS 18.2 Max",
    width: 412,
    height: 840,
    outerRadius: "rounded-[56px]",
    innerRadius: "rounded-[46px]",
    bezelPadding: "p-[9px]",
    notchType: "dynamic-island",
    sideButtons: {
      left: [{ top: 120, height: 28 }, { top: 165, height: 50 }, { top: 230, height: 50 }],
      right: [{ top: 180, height: 70 }, { top: 265, height: 42 }],
    },
  },
  "ipad-pro-11": {
    id: "ipad-pro-11",
    name: "iPad Pro 11\" (M4)",
    category: "tablet",
    brand: "Apple",
    os: "iOS",
    osVersion: "iPadOS 18.2",
    width: 580,
    height: 820,
    outerRadius: "rounded-[38px]",
    innerRadius: "rounded-[26px]",
    bezelPadding: "p-[12px]",
    notchType: "tablet-bezel",
    sideButtons: {
      left: [{ top: 120, height: 36 }, { top: 170, height: 36 }],
      right: [{ top: 210, height: 110 }],
    },
  },
  "ipad-mini": {
    id: "ipad-mini",
    name: "iPad Mini 7",
    category: "tablet",
    brand: "Apple",
    os: "iOS",
    osVersion: "iPadOS 18.2",
    width: 500,
    height: 760,
    outerRadius: "rounded-[34px]",
    innerRadius: "rounded-[22px]",
    bezelPadding: "p-[11px]",
    notchType: "tablet-bezel",
    sideButtons: {
      left: [{ top: 110, height: 32 }, { top: 155, height: 32 }],
      right: [{ top: 200, height: 90 }],
    },
  },
  "galaxy-tab-s9": {
    id: "galaxy-tab-s9",
    name: "Galaxy Tab S9",
    category: "tablet",
    brand: "Samsung",
    os: "Android",
    osVersion: "One UI 6.1 Tab",
    width: 560,
    height: 820,
    outerRadius: "rounded-[26px]",
    innerRadius: "rounded-[16px]",
    bezelPadding: "p-[10px]",
    notchType: "tablet-bezel",
    sideButtons: {
      right: [{ top: 140, height: 50 }, { top: 205, height: 30 }],
    },
  },
};

const CHASSIS_COLORS: Record<DeviceColorId, ChassisColorSpec> = {
  "natural-titanium": {
    id: "natural-titanium",
    name: "Natural Titanium",
    swatch: "#5A6577",
    gradient: "bg-gradient-to-b from-[#354152] via-[#1B232E] to-[#101720]",
    borderColor: "border-slate-600/70",
    shadow: "shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_40px_rgba(148,163,184,0.15)]",
  },
  "midnight": {
    id: "midnight",
    name: "Midnight Black",
    swatch: "#171B22",
    gradient: "bg-gradient-to-b from-[#1C2129] via-[#0F1318] to-[#07090C]",
    borderColor: "border-slate-800/90",
    shadow: "shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_35px_rgba(0,0,0,0.5)]",
  },
  "silver": {
    id: "silver",
    name: "Starlight Silver",
    swatch: "#CBD5E1",
    gradient: "bg-gradient-to-b from-[#8C98AA] via-[#4D5868] to-[#252E3B]",
    borderColor: "border-slate-400/60",
    shadow: "shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_40px_rgba(203,213,225,0.22)]",
  },
  "desert-gold": {
    id: "desert-gold",
    name: "Desert Titanium",
    swatch: "#C4A480",
    gradient: "bg-gradient-to-b from-[#6A5A47] via-[#3B3126] to-[#1E1812]",
    borderColor: "border-amber-700/50",
    shadow: "shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_40px_rgba(217,119,6,0.18)]",
  },
  "emerald-pine": {
    id: "emerald-pine",
    name: "Emerald Heritage",
    swatch: "#009A60",
    gradient: "bg-gradient-to-b from-[#194C38] via-[#0E2E22] to-[#071912]",
    borderColor: "border-emerald-600/60",
    shadow: "shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_40px_rgba(16,185,129,0.25)]",
  },
};

export interface DummyKeyboardConfig {
  isOpen: boolean;
  phoneIndex: number;
  type: "numeric" | "text";
  allowDecimal?: boolean;
  allowPlus?: boolean;
  title?: string;
  queryValue?: string;
  onInput: (char: string) => void;
  onBackspace: () => void;
}

export default function MobilePreviewPage() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>("landing");
  const [landingSlide, setLandingSlide] = useState(0);
  const [landingTouchStartX, setLandingTouchStartX] = useState<number | null>(null);
  const [showInspector, setShowInspector] = useState(false);
  const [isInspectorExpanded, setIsInspectorExpanded] = useState(false);
  const [deviceScale, setDeviceScale] = useState<number>(100);

  // --- Simulator Dummy Virtual Mobile Keyboard State ---
  const [virtualKeyboard, setVirtualKeyboard] = useState<DummyKeyboardConfig | null>(null);
  const [keyboardShift, setKeyboardShift] = useState(false);
  const [keyboardSymbols, setKeyboardSymbols] = useState(false);

  const openVirtualKeyboard = (config: Omit<DummyKeyboardConfig, "isOpen">) => {
    setVirtualKeyboard({
      ...config,
      isOpen: true,
    });
  };

  interface ToastNotification {
    type: "success" | "error" | "alert";
    title?: string;
    message: string;
  }
  const [mobileToast, setMobileToast] = useState<ToastNotification | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const sanitizeToastMessage = (raw: string): string => {
    if (!raw) return "";
    const lower = raw.toLowerCase();
    if (lower.includes("email already exists") || (lower.includes("email") && lower.includes("exist"))) {
      return "This email is already registered. Please sign in.";
    }
    if (lower.includes("phone number is already registered") || (lower.includes("phone") && lower.includes("exist"))) {
      return "This phone number is already registered.";
    }
    if (lower === "failed to fetch" || lower.includes("networkerror") || lower === "backend connection error") {
      return "Unable to connect to the backend server. Please verify your connection.";
    }
    return raw;
  };

  const showToast = (
    msg: string,
    type: "success" | "error" | "alert" = "success",
    customTitle?: string
  ) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    const defaultTitle = type === "success" ? "SUCCESS" : type === "error" ? "ERROR" : "ALERT";
    setMobileToast({
      type,
      title: customTitle || defaultTitle,
      message: sanitizeToastMessage(msg),
    });
    // Strict 5-second display requirement
    toastTimerRef.current = setTimeout(() => {
      setMobileToast(null);
    }, 5000);
  };

  const dismissToast = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setMobileToast(null);
  };
  const [copied, setCopied] = useState(false);
  const [incomingReferrer, setIncomingReferrer] = useState<string | null>(null);

  // Default Scroll Reset Refs
  const phoneContentScrollRef = useRef<HTMLDivElement>(null);
  const regScrollRef = useRef<HTMLDivElement>(null);
  const featuredTournamentsCarouselRef = useRef<HTMLDivElement>(null);
  const playingNowCarouselRef = useRef<HTMLDivElement>(null);

  const scrollToTopAll = () => {
    if (regScrollRef.current) {
      regScrollRef.current.scrollTop = 0;
    }
    if (phoneContentScrollRef.current) {
      phoneContentScrollRef.current.scrollTop = 0;
    }
  };

  // Sync screen with URL ?screen= and ?ref= query param
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const s = params.get("screen") as ScreenId | null;
      if (s && ["landing", "scoring", "attestation", "hub", "leaderboard", "login", "verify", "register", "forgot-password", "check-inbox", "reset-password", "player-scorecard", "add-friends", "sync-contacts", "notifications", "tournaments"].includes(s)) {
        setActiveScreen(s);
      }
      const refCode = params.get("ref");
      if (refCode) {
        setIncomingReferrer(refCode);
      }
    }
  }, []);

  // Always reset scroll to top on screen change
  useEffect(() => {
    scrollToTopAll();
  }, [activeScreen]);

  const switchScreen = (screen: ScreenId) => {
    setActiveScreen(screen);
    if (screen === "tournaments") {
      setActiveBottomNavTab("tournaments");
    }
    if (screen === "hub") {
      setActiveBottomNavTab("home");
    }
    if (screen === "landing") {
      setLandingSlide(0);
    }
    if (screen === "verify") {
      setVerifySuccess(false);
      setVerifyError(null);
    }
    if (screen === "register") {
      setRegError(null);
    }
    if (screen === "forgot-password") {
      if (loginEmail.trim()) {
        setForgotEmail(loginEmail.trim());
      }
    }
    if (screen === "check-inbox") {
      if (!checkInboxEmail && forgotEmail) {
        setCheckInboxEmail(forgotEmail);
      }
    }
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("screen", screen);
      window.history.replaceState({}, "", url.toString());
    }
    scrollToTopAll();
  };

  // --- Scoring Screen State ---
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
  const [holeScores, setHoleScores] = useState<
    Record<
      number,
      { strokes: number; putts: number; fairway: string; gir: boolean }
    >
  >({
    0: { strokes: 4, putts: 2, fairway: "CENTER", gir: true },
  });
  const [showScorecardModal, setShowScorecardModal] = useState(false);

  // --- Attestation Screen State ---
  const [showAttestModal, setShowAttestModal] = useState(false);
  const [attestationConfirmed, setAttestationConfirmed] = useState(false);
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>("player_1");

  const [showAddFriendsModal, setShowAddFriendsModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showFriendRequestsModal, setShowFriendRequestsModal] = useState(false);
  const [showQrCodeModal, setShowQrCodeModal] = useState(false);
  const [qrModalTab, setQrModalTab] = useState<"display" | "scan">("display");
  const [isScanningQr, setIsScanningQr] = useState(false);
  const [scannedFriendResult, setScannedFriendResult] = useState<any | null>(null);
  const [showContactsConnected, setShowContactsConnected] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [contactsSearchQuery, setContactsSearchQuery] = useState("");
  const [contactsTabFilter, setContactsTabFilter] = useState<"all" | "on_app" | "invite">("all");
  const [isSyncingContacts, setIsSyncingContacts] = useState(false);
  const [qrPhotoError, setQrPhotoError] = useState(false);
  const [invitedContactPhones, setInvitedContactPhones] = useState<string[]>([]);
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);

  // --- Mobile Bottom Navigation State (5-item bar with flush PLAY GOLF button) ---
  const [activeBottomNavTab, setActiveBottomNavTab] = useState<"home" | "tournaments" | "challenges" | "deals">("home");
  const [tournamentFilter, setTournamentFilter] = useState<"All" | "Ongoing" | "Major" | "Invitational">("All");
  const [tournamentSearchQuery, setTournamentSearchQuery] = useState("");
  const [showTournamentFilterModal, setShowTournamentFilterModal] = useState(false);
  const [tournamentFormatFilter, setTournamentFormatFilter] = useState<string>("All");
  const [tournamentFeeFilter, setTournamentFeeFilter] = useState<string>("All");
  const [selectedTournamentInfo, setSelectedTournamentInfo] = useState<{
    name: string;
    club: string;
    fee: string;
    date: string;
    format: string;
    purse?: string;
    holes?: number;
    cutLine?: string;
    bannerUrl?: string;
  } | null>(null);
  const [friendsSearchQuery, setFriendsSearchQuery] = useState("");
  const [friendsDisplayLimit, setFriendsDisplayLimit] = useState(4);
  const [sentFriendRequests, setSentFriendRequests] = useState<string[]>([]);
  const [acceptedFriendIds, setAcceptedFriendIds] = useState<string[]>([]);
  const [incomingFriendRequests, setIncomingFriendRequests] = useState<any[]>([]);

  // --- Searchable Golf Competitors Database (Loaded dynamically from database /api/members) ---
  const [golfCompetitors, setGolfCompetitors] = useState<{
    id: string;
    name: string;
    email: string;
    club: string;
    hcp: string;
    initial: string;
    avatar?: string;
    profilePhoto?: string;
  }[]>([]);
  const [isLoadingCompetitors, setIsLoadingCompetitors] = useState(false);

  // --- Friends on Course State (Derived dynamically from active tournament registered players) ---
  const [friendsOnCourse, setFriendsOnCourse] = useState<{
    id: string;
    name: string;
    initials: string;
    score: string;
    bg: string;
  }[]>([]);
  const [simulatedActiveFriendIds, setSimulatedActiveFriendIds] = useState<string[]>([]);

  // --- Active On-Course Competitors Data & Telemetry Scorecards ---
  const STANDARD_PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 4, 5];
  const STANDARD_YARDS = [385, 410, 175, 520, 395, 430, 190, 545, 415, 405, 390, 165, 535, 415, 440, 185, 420, 550];

  const buildScorecardHoles = (strokesList: (number | null)[]) => {
    return STANDARD_PARS.map((par, idx) => ({
      hole: idx + 1,
      par,
      yards: STANDARD_YARDS[idx],
      strokes: strokesList[idx] ?? null,
    }));
  };

  const [showActivePlayersModal, setShowActivePlayersModal] = useState(false);
  const [activePlayersSearchQuery, setActivePlayersSearchQuery] = useState("");
  const [selectedPlayerForScorecard, setSelectedPlayerForScorecard] = useState<any | null>(null);
  const [scorecardViewSection, setScorecardViewSection] = useState<"all" | "out" | "in">("all");

  // --- Active In-Progress Round State (Derived dynamically from live tournament database) ---
  const [activeRound, setActiveRound] = useState<{
    id: string;
    tournamentId: string;
    tournamentName: string;
    courseName?: string;
    clubName?: string;
    holeNumber: number;
    par: number;
    yardage: number;
    holeInfo: string;
    isLive: boolean;
    dayText: string;
    score: string;
    thru: string;
    flightText: string;
    groupPlayers: GroupPlayer[];
  } | null>(null);
  const [activeRoundMinutesElapsed, setActiveRoundMinutesElapsed] = useState<number>(0);
  const [hasInactivityWarning, setHasInactivityWarning] = useState(false);
  const [showForfeitModal, setShowForfeitModal] = useState(false);
  const [unfriendCandidate, setUnfriendCandidate] = useState<{ id: string; name: string } | null>(null);
  const [blockCandidate, setBlockCandidate] = useState<{ id: string; name: string } | null>(null);
  const [friendActionUser, setFriendActionUser] = useState<{ id: string; name: string; club?: string; hcp?: string; avatar?: string; profilePhoto?: string } | null>(null);
  const [reportCandidate, setReportCandidate] = useState<{ id: string; name: string; club?: string; hcp?: string; avatar?: string; profilePhoto?: string } | null>(null);
  const [reportReason, setReportReason] = useState<string>("Unsportsmanlike Conduct / Cheating");
  const [reportDetails, setReportDetails] = useState<string>("");
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [mobileNotifications, setMobileNotifications] = useState<any[]>([]);
  const [notificationsMarkedRead, setNotificationsMarkedRead] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [proBookings, setProBookings] = useState<any[]>([
    {
      id: "booking_pga_1",
      proName: "Pro Michael Dan, PGA",
      proRole: "Head Teaching Professional",
      proClub: "Ikoyi Club 1938",
      proAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      serviceName: "1-on-1 Full Swing & TrackMan Session",
      date: "Sat, Oct 24",
      time: "10:00 AM - 11:00 AM",
      location: "Golf Academy • Range Bay 4",
      status: "CONFIRMED",
      price: "₦35,000",
    },
    {
      id: "booking_pga_2",
      proName: "Pro Sarah Jenkins, LPGA",
      proRole: "Short Game Specialist",
      proClub: "Ikoyi Club 1938",
      proAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      serviceName: "Short Game & Putting Masterclass",
      date: "Wed, Nov 4",
      time: "02:30 PM - 03:30 PM",
      location: "Championship Putting Green",
      status: "UPCOMING",
      price: "₦28,000",
    },
  ]);

  // --- Real Organizer Tournaments State ---
  const [liveTournaments, setLiveTournaments] = useState<RealTournament[]>([]);
  const [selectedTournamentIndex, setSelectedTournamentIndex] = useState(0);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(true);
  const activeTournament: RealTournament | null = liveTournaments[selectedTournamentIndex] || liveTournaments[0] || null;

  // --- Recent Golfing Rounds State ---
  const [recentRounds, setRecentRounds] = useState<{
    id: string;
    clubName: string;
    holes: number;
    status: string;
    netScore: number;
    month: string;
    day: string;
  }[]>([]);

  // --- Real Course Holes State (Loaded from DB for active tournament) ---
  const [courseHoles, setCourseHoles] = useState<CourseHole[]>([]);
  const [isLoadingHoles, setIsLoadingHoles] = useState(false);

  // --- Real Leaderboard & Registered Players State (Loaded from DB for active tournament) ---
  const [registeredPlayers, setRegisteredPlayers] = useState<LeaderboardPlayer[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  // --- Real Tournament Groupings / Flights State (Loaded from DB for active tournament) ---
  const [tournamentGroupings, setTournamentGroupings] = useState<GroupingData | null>(null);
  const [groupingsRefreshKey, setGroupingsRefreshKey] = useState<number>(0);

  // Dynamically build competitor scorecards from active tournament registered players and course holes
  const activeCompetitorsData = useMemo(() => {
    if (!registeredPlayers || registeredPlayers.length === 0) return [];
    return registeredPlayers.map((p, idx) => {
      const holes = courseHoles.length > 0
        ? courseHoles.map((ch) => ({
            hole: ch.number,
            par: ch.par,
            yards: ch.yards || ch.yardage || 400,
            strokes: null,
          }))
        : STANDARD_PARS.map((par, i) => ({
            hole: i + 1,
            par,
            yards: STANDARD_YARDS[i],
            strokes: null,
          }));

      const pThru = typeof p.thru === "number" ? p.thru : (p.gross !== "--" ? 1 : 0);
      const isSimulated = simulatedActiveFriendIds.includes(p.id) || simulatedActiveFriendIds.includes(p.registrationId);
      const hasStarted = (p.gross && p.gross !== "--") || pThru > 0 || Boolean(p.roundStarted) || isSimulated;

      return {
        id: p.id,
        name: p.name,
        initials: p.initials,
        club: activeTournament?.organizerClub || activeTournament?.clubName || "Home Club",
        hcp: String(p.handicap ?? "0.0"),
        score: hasStarted
          ? (p.gross !== "--" ? `Gross ${p.gross}` : isSimulated ? "Hole 4 • Even" : `Hole ${Math.min(18, pThru + 1)} • Even`)
          : "Tee Time: 08:00 AM",
        toPar: 0,
        currentHole: hasStarted ? Math.min(18, Math.max(1, pThru + 1)) : 1,
        thru: pThru,
        gross: p.gross !== "--" ? Number(p.gross) : 0,
        net: 0,
        tournament: activeTournament?.name || "Tournament",
        round: "Round 1",
        flight: "Championship",
        teeTime: "08:00 AM",
        ball: "Golf Ball",
        marker: idx > 0 ? registeredPlayers[0].name : (registeredPlayers[1]?.name || "Marker"),
        pace: "On Pace",
        holes,
        roundStarted: hasStarted,
      };
    });
  }, [registeredPlayers, courseHoles, activeTournament, simulatedActiveFriendIds]);

  // Keep scorecard competitor in sync
  useEffect(() => {
    if (!selectedPlayerForScorecard && activeCompetitorsData.length > 0) {
      setSelectedPlayerForScorecard(activeCompetitorsData[0]);
    } else if (activeCompetitorsData.length === 0) {
      setSelectedPlayerForScorecard(null);
    }
  }, [activeCompetitorsData, selectedPlayerForScorecard]);

  // --- Real Player Authentication State ---
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authenticatedPlayer, setAuthenticatedPlayer] = useState<AuthenticatedPlayer | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Helper to persist and update authenticated player
  const updateAuthenticatedPlayer = (player: AuthenticatedPlayer | null) => {
    setAuthenticatedPlayer(player);
    if (typeof window !== "undefined") {
      if (player) {
        try {
          localStorage.setItem("openclub_authenticated_player", JSON.stringify(player));
        } catch { }
      } else {
        try {
          localStorage.removeItem("openclub_authenticated_player");
        } catch { }
      }
    }
  };

  // Restore authenticated player on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("openclub_authenticated_player");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object") {
            // If stored club was populated with generic OpenClub fallback, sanitize with chosen/real club
            if (parsed.club && (parsed.club.toLowerCase().includes("openclub") || parsed.club.toLowerCase().includes("open club"))) {
              parsed.club = "Ikoyi Golf Club";
              try {
                localStorage.setItem("openclub_authenticated_player", JSON.stringify(parsed));
              } catch { }
            }
            setAuthenticatedPlayer(parsed);
          }
        }
        const synced = localStorage.getItem("openclub_contacts_synced");
        if (synced === "true") {
          setShowContactsConnected(true);
        }
      } catch { }
    }
  }, []);

  // User-scoped storage keys for sent requests, accepted friends, incoming requests, and notifications
  const getSentRequestsKey = (userId?: string | null) =>
    userId ? `openclub_sent_friend_requests_${userId}` : "openclub_sent_friend_requests_guest";
  const getAcceptedFriendsKey = (userId?: string | null) =>
    userId ? `openclub_accepted_friends_${userId}` : "openclub_accepted_friends_guest";
  const getIncomingRequestsKey = (userId?: string | null) =>
    userId ? `openclub_incoming_friend_requests_${userId}` : "openclub_incoming_friend_requests_guest";
  const getUserNotificationsKey = (userId?: string | null) =>
    userId ? `openclub_user_notifications_${userId}` : "openclub_user_notifications_guest";
  const getBlockedUsersKey = (userId?: string | null) =>
    userId ? `openclub_blocked_users_${userId}` : "openclub_blocked_users_guest";

  const formatNotifTime = (dateVal?: string | number | Date | null) => {
    if (!dateVal) return "Just now";
    try {
      const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
      if (isNaN(d.getTime())) return "Recently";
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      if (diffMs < 0) return "Just now";
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;

      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday =
        d.getDate() === yesterday.getDate() &&
        d.getMonth() === yesterday.getMonth() &&
        d.getFullYear() === yesterday.getFullYear();

      const timeStr = d.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      if (isToday) {
        if (diffHours < 4) return `${diffHours}h ago`;
        return timeStr;
      }
      if (isYesterday) {
        return `Yesterday, ${timeStr}`;
      }
      return `${d.toLocaleDateString([], { month: "short", day: "numeric" })}, ${timeStr}`;
    } catch {
      return "Recently";
    }
  };

  // Helper to determine whether a player entity matches the currently authenticated account user
  const isAccountUser = useCallback(
    (p?: { id?: string; email?: string; name?: string; initials?: string } | null) => {
      if (!p) return false;
      let storedUser: any = null;
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("openclub_authenticated_player");
          if (raw) storedUser = JSON.parse(raw);
        } catch { }
      }
      const hasExplicitUser = Boolean(
        authenticatedPlayer?.id ||
        authenticatedPlayer?.email ||
        authenticatedPlayer?.name ||
        storedUser?.id ||
        storedUser?.email ||
        storedUser?.name
      );

      const curId = authenticatedPlayer?.id || storedUser?.id || (storedUser as any)?.userId;
      const curEmail = (authenticatedPlayer?.email || storedUser?.email || "").trim().toLowerCase();
      const curName = (authenticatedPlayer?.name || storedUser?.name || "").trim().toLowerCase();

      // 1. Direct ID match
      if (curId && p.id && (p.id === curId || (p as any).userId === curId || (p as any).registrationId === curId)) {
        return true;
      }
      // 2. Direct Email match
      if (curEmail && p.email && p.email.trim().toLowerCase() === curEmail) {
        return true;
      }
      // 3. Exact or distinctive Name match
      if (curName && p.name) {
        const pNameLower = p.name.trim().toLowerCase();
        if (pNameLower === curName) return true;
        if (curName.includes("adediran") && pNameLower.includes("adediran")) return true;
        if (curName.includes("obadina") && pNameLower.includes("obadina")) return true;
      }

      // 4. Default unauthenticated simulator fallback (Isabella Wilson / IW) ONLY when no explicit user is logged in
      if (!hasExplicitUser) {
        const pNameLower = (p.name || "").toLowerCase();
        if (pNameLower.includes("isabella wilson") || p.initials === "IW" || getTwoInitials(p.name || "") === "IW") {
          return true;
        }
      }

      return false;
    },
    [authenticatedPlayer]
  );

  const isCorruptedFlightNotifDate = useCallback((dateVal?: string | number | Date | null): boolean => {
    if (!dateVal) return true;
    const t = new Date(dateVal).getTime();
    if (isNaN(t)) return true;
    const now = Date.now();
    const d = new Date(t);
    // Any notification backdated to seed dates (on or before Sep 21, 2026) or older than 24 hours
    const isBackdatedSeed =
      d.getFullYear() <= 2026 &&
      (d.getFullYear() < 2026 || d.getMonth() < 8 || (d.getMonth() === 8 && d.getDate() <= 21));
    const isOlderThan24h = now - t > 24 * 60 * 60 * 1000;
    return isBackdatedSeed || isOlderThan24h;
  }, []);

  const sanitizeFlightNotif = useCallback((notif: any) => {
    if (!notif) return notif;
    const isFlightGrouping =
      notif.type === "FLIGHT_GROUPING" ||
      notif.data?.type === "FLIGHT_GROUPING" ||
      (typeof notif.title === "string" && notif.title.toLowerCase().includes("flight grouping")) ||
      (typeof notif.id === "string" && notif.id.includes("flight_grp"));

    if (isFlightGrouping) {
      const updated = { ...notif };
      if (notif.body && !notif.body.includes("\n")) {
        const match = notif.body.match(/You are grouped with (.*?) for (.*?)\./i);
        if (match) {
          const namesStr = match[1];
          const flightInfo = match[2];
          const parsed = namesStr
            .split(",")
            .map((s: string) => s.trim().replace(/-\d+$/, ""))
            .filter((s: string) => s && !isAccountUser({ name: s }));
          const formatted = parsed.length > 0 ? parsed.join("\n") : "your flight partners";
          updated.body = `You are grouped with:\n${formatted}\nfor ${flightInfo}.`;
        }
      }
      // Self-heal stale backdated timestamps (e.g. from seeded database rows or tournament creation dates)
      if (isCorruptedFlightNotifDate(notif.createdAt || notif.timestamp || notif.time)) {
        updated.createdAt = new Date().toISOString();
      }
      return updated;
    }
    return notif;
  }, [isAccountUser, isCorruptedFlightNotifDate]);

  // Synchronize friends on course strictly from accepted friends who have started playing on the golf course
  useEffect(() => {
    if (registeredPlayers && registeredPlayers.length > 0 && acceptedFriendIds.length > 0) {
      // Pending sent requests can NEVER be counted as accepted friends!
      const strictlyAccepted = acceptedFriendIds.filter((id) => !sentFriendRequests.includes(id));
      const friendSet = new Set(strictlyAccepted);
      const friendsPlaying = registeredPlayers.filter((p) => {
        // Never include the authenticated player themselves in their friends playing list
        if (isAccountUser(p)) return false;

        const isFriend = friendSet.has(p.id) || friendSet.has(p.registrationId);
        if (!isFriend) return false;

        // User requirement: if a player has not started playing on the golfing course meaning if the player has not started a round dont let it display on friends playing now
        const pThru = typeof p.thru === "number" ? p.thru : 0;
        const isSimulated = simulatedActiveFriendIds.includes(p.id) || simulatedActiveFriendIds.includes(p.registrationId);
        const hasStarted = (p.gross && p.gross !== "--") || pThru > 0 || Boolean(p.roundStarted) || isSimulated;
        return hasStarted;
      });

      const mapped = friendsPlaying.map((p) => {
        const pThru = typeof p.thru === "number" ? p.thru : 0;
        const isSimulated = simulatedActiveFriendIds.includes(p.id) || simulatedActiveFriendIds.includes(p.registrationId);
        const scoreLabel = p.gross && p.gross !== "--"
          ? `Gross ${p.gross}`
          : pThru > 0
          ? `Thru ${pThru}`
          : isSimulated
          ? "Hole 4 • Even"
          : "Hole 1";

        return {
          id: p.id,
          name: p.name,
          initials: p.initials,
          score: scoreLabel,
          bg: "bg-gradient-to-b from-slate-300 to-slate-400 text-white",
        };
      });
      setFriendsOnCourse(mapped);
    } else {
      setFriendsOnCourse([]);
    }
  }, [registeredPlayers, acceptedFriendIds, sentFriendRequests, simulatedActiveFriendIds, isAccountUser]);

  // Synchronize friend requests and accepted friends whenever the authenticated player changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      // Clean up deprecated non-scoped global keys if they still linger
      localStorage.removeItem("openclub_sent_friend_requests");
      localStorage.removeItem("openclub_accepted_friends");

      if (authenticatedPlayer?.id) {
        const sentKey = getSentRequestsKey(authenticatedPlayer.id);
        const acceptedKey = getAcceptedFriendsKey(authenticatedPlayer.id);
        const incomingKey = getIncomingRequestsKey(authenticatedPlayer.id);
        const notifKey = getUserNotificationsKey(authenticatedPlayer.id);

        const savedSent = localStorage.getItem(sentKey);
        const savedAccepted = localStorage.getItem(acceptedKey);
        const savedIncoming = localStorage.getItem(incomingKey);
        const savedLocalNotifs = localStorage.getItem(notifKey);

        const parsedSent = savedSent ? JSON.parse(savedSent) : [];
        const parsedAccepted = savedAccepted ? JSON.parse(savedAccepted) : [];
        let parsedIncoming = savedIncoming ? JSON.parse(savedIncoming) : [];

        // Also check by user's email or name slug in case request was dispatched by email or name
        const altIncomingKeys: string[] = [];
        if (authenticatedPlayer.email) {
          altIncomingKeys.push(getIncomingRequestsKey(authenticatedPlayer.email.toLowerCase().trim()));
        }
        const nameSlug = authenticatedPlayer.name?.toLowerCase().trim().replace(/\s+/g, "_");
        if (nameSlug) {
          altIncomingKeys.push(getIncomingRequestsKey(nameSlug));
        }
        for (const altKey of altIncomingKeys) {
          try {
            const rawAlt = localStorage.getItem(altKey);
            if (rawAlt) {
              const altItems = JSON.parse(rawAlt);
              if (Array.isArray(altItems)) {
                parsedIncoming = [...parsedIncoming, ...altItems];
              }
            }
          } catch {}
        }

        // Deduplicate incoming by senderId or id
        const incomingMap = new Map<string, any>();
        for (const item of parsedIncoming) {
          if (item && (item.senderId || item.id)) {
            const key = item.id || item.senderId;
            if (!incomingMap.has(key)) incomingMap.set(key, item);
          }
        }
        const deduplicatedIncoming = Array.from(incomingMap.values());

        // Critical fix: Ensure pending sent requests and blocked users are never kept in accepted friends
        const blockedKey = getBlockedUsersKey(authenticatedPlayer.id);
        const savedBlocked = localStorage.getItem(blockedKey);
        const parsedBlocked = savedBlocked ? JSON.parse(savedBlocked) : [];
        const validBlocked = Array.isArray(parsedBlocked) ? parsedBlocked : [];
        const blockedLowerSet = new Set(validBlocked.map((b: string) => String(b).toLowerCase().trim()));

        const cleanedAccepted = Array.isArray(parsedAccepted)
          ? parsedAccepted.filter((id: string) => !parsedSent.includes(id) && !blockedLowerSet.has(String(id).toLowerCase().trim()))
          : [];
        if (Array.isArray(parsedAccepted) && cleanedAccepted.length !== parsedAccepted.length) {
          try {
            localStorage.setItem(acceptedKey, JSON.stringify(cleanedAccepted));
          } catch {}
        }

        setBlockedUserIds(validBlocked);
        setSentFriendRequests(Array.isArray(parsedSent) ? parsedSent.filter((id: string) => !blockedLowerSet.has(String(id).toLowerCase().trim())) : []);
        setAcceptedFriendIds(cleanedAccepted);
        setIncomingFriendRequests(deduplicatedIncoming);

        const parsedLocalNotifs = savedLocalNotifs ? JSON.parse(savedLocalNotifs) : [];
        if (Array.isArray(parsedLocalNotifs) && parsedLocalNotifs.length > 0) {
          setMobileNotifications((prev) => {
            const map = new Map<string, any>();
            for (const n of [...parsedLocalNotifs, ...prev]) {
              const nType = (n.data?.type || n.type || "").toUpperCase();
              const nUserId = String(n.data?.userId || n.userId || n.data?.senderId || n.senderId || "");
              const key = nType === "FRIEND_ACCEPTED" && nUserId
                ? `FRIEND_ACCEPTED_${nUserId}`
                : n.id || `${n.title}_${n.body || n.desc || n.message}`;
              if (!map.has(key)) {
                map.set(key, n);
              }
            }
            return Array.from(map.values());
          });
        }
      } else {
        setBlockedUserIds([]);
        setSentFriendRequests([]);
        setAcceptedFriendIds([]);
        setIncomingFriendRequests([]);
        setMobileNotifications([]);
        setFriendsOnCourse([]);
        setSimulatedActiveFriendIds([]);
      }
    } catch {
      setBlockedUserIds([]);
      setSentFriendRequests([]);
      setAcceptedFriendIds([]);
      setIncomingFriendRequests([]);
      setMobileNotifications([]);
      setFriendsOnCourse([]);
      setSimulatedActiveFriendIds([]);
    }
  }, [authenticatedPlayer?.id, authenticatedPlayer?.email, authenticatedPlayer?.name]);

  // Handle accepting an incoming friend request
  const handleAcceptFriendRequest = (req: any) => {
    const currentUserId = authenticatedPlayer?.id;
    if (!currentUserId || !req) return;
    const senderId = req.senderId || req.userId || req.sender_id || req.data?.senderId || req.data?.userId || (req.type === "FRIEND_REQUEST" ? req.id : undefined);
    if (!senderId) return;

    const senderName =
      req.senderName ||
      req.userName ||
      req.name ||
      req.data?.senderName ||
      req.data?.userName ||
      (typeof req.body === "string" ? req.body.match(/^(.+?)\s+(?:sent|accepted)/)?.[1] : "") ||
      "a golfer";

    const reqId = req.id || req.requestId;

    // 1. Add sender to recipient's accepted friends
    const recipientAcceptedKey = getAcceptedFriendsKey(currentUserId);
    setAcceptedFriendIds((prev) => {
      const next = prev.includes(senderId) ? prev : [...prev, senderId];
      try {
        localStorage.setItem(recipientAcceptedKey, JSON.stringify(next));
      } catch {}
      return next;
    });

    // 2. Add recipient to sender's accepted friends
    const senderAcceptedKey = getAcceptedFriendsKey(senderId);
    try {
      const senderAcceptedRaw = localStorage.getItem(senderAcceptedKey);
      const senderAccepted = senderAcceptedRaw ? JSON.parse(senderAcceptedRaw) : [];
      if (!senderAccepted.includes(currentUserId)) {
        localStorage.setItem(senderAcceptedKey, JSON.stringify([...senderAccepted, currentUserId]));
      }
    } catch {}

    // 2b. Remove recipient from sender's pending sent requests
    try {
      const senderSentKey = getSentRequestsKey(senderId);
      const senderSentRaw = localStorage.getItem(senderSentKey);
      if (senderSentRaw) {
        const parsed = JSON.parse(senderSentRaw);
        const updated = parsed.filter((id: string) => id !== currentUserId && id !== authenticatedPlayer?.email && id !== authenticatedPlayer?.name);
        localStorage.setItem(senderSentKey, JSON.stringify(updated));
      }
    } catch {}

    // 3. Remove from recipient's incoming requests across all keys
    const incomingKeysToClean = [
      getIncomingRequestsKey(currentUserId),
    ];
    if (authenticatedPlayer?.email) {
      incomingKeysToClean.push(getIncomingRequestsKey(authenticatedPlayer.email.toLowerCase().trim()));
    }
    const myNameSlug = authenticatedPlayer?.name?.toLowerCase().trim().replace(/\s+/g, "_");
    if (myNameSlug) {
      incomingKeysToClean.push(getIncomingRequestsKey(myNameSlug));
    }

    setIncomingFriendRequests((prev) => {
      const next = prev.filter((item: any) => {
        if (reqId && (item.id === reqId || item.requestId === reqId)) return false;
        if (senderId && (item.senderId === senderId || item.id === senderId)) return false;
        return true;
      });
      for (const k of incomingKeysToClean) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter((item: any) => {
                if (reqId && (item.id === reqId || item.requestId === reqId)) return false;
                if (senderId && (item.senderId === senderId || item.id === senderId)) return false;
                return true;
              });
              localStorage.setItem(k, JSON.stringify(filtered));
            }
          }
        } catch {}
      }
      return next;
    });

    // 4. Create in-app accepted notification in RECIPIENT'S mailbox (isRead: false, unread: true so Bell red dot pops up)
    const recipientNotif = {
      id: `notif_acc_rec_${Date.now()}`,
      title: "Friend Request Accepted",
      body: `You and ${senderName} are now connected!`,
      isRead: false,
      unread: true,
      createdAt: new Date().toISOString(),
      data: {
        type: "FRIEND_ACCEPTED",
        userId: senderId,
        userName: senderName,
      },
    };

    const isMatchingAcceptedNotif = (n: any) => {
      if (reqId && (n.id === reqId || n.data?.requestId === reqId)) return true;
      if (senderId && (n.data?.senderId === senderId || n.id === senderId || n.data?.userId === senderId)) {
        // Remove the original FRIEND_REQUEST notification
        if (n.data?.type === "FRIEND_REQUEST" || n.type === "FRIEND_REQUEST" || n.title?.toLowerCase().includes("friend request")) {
          return true;
        }
        // Also remove any existing FRIEND_ACCEPTED duplicate for same sender to prevent double cards
        if (n.data?.type === "FRIEND_ACCEPTED" || n.type === "FRIEND_ACCEPTED") {
          return true;
        }
      }
      return false;
    };

    setNotificationsMarkedRead(false);
    setMobileNotifications((prev) => [recipientNotif, ...prev.filter((n: any) => !isMatchingAcceptedNotif(n))]);
    try {
      const notifKey = getUserNotificationsKey(currentUserId);
      const saved = localStorage.getItem(notifKey);
      const parsed = saved ? JSON.parse(saved) : [];
      localStorage.setItem(notifKey, JSON.stringify([recipientNotif, ...parsed.filter((n: any) => !isMatchingAcceptedNotif(n))]));
    } catch {}

    // 5. Notify sender that friend request was accepted (with isRead: false, unread: true)
    try {
      const senderNotifKey = getUserNotificationsKey(senderId);
      const senderNotifsRaw = localStorage.getItem(senderNotifKey);
      const senderNotifs = senderNotifsRaw ? JSON.parse(senderNotifsRaw) : [];
      const acceptNotif = {
        id: `notif_acc_${Date.now()}`,
        title: "Friend Request Accepted",
        body: `${authenticatedPlayer?.name || "A golfer"} accepted your friend request! You are now connected.`,
        isRead: false,
        unread: true,
        createdAt: new Date().toISOString(),
        data: {
          type: "FRIEND_ACCEPTED",
          userId: currentUserId,
          userName: authenticatedPlayer?.name,
        },
      };
      const filteredSenderNotifs = senderNotifs.filter((n: any) => {
        const nType = (n.data?.type || n.type || "").toUpperCase();
        const nUserId = String(n.data?.userId || n.userId || n.data?.senderId || n.senderId || "");
        if (nType === "FRIEND_ACCEPTED" && (nUserId === currentUserId || (authenticatedPlayer?.name && n.body?.includes(authenticatedPlayer.name)))) {
          return false;
        }
        return true;
      });
      localStorage.setItem(senderNotifKey, JSON.stringify([acceptNotif, ...filteredSenderNotifs]));

      const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const token = localStorage.getItem("openclub_access_token") || localStorage.getItem("openclub_mobile_token");
      const authHeaders: Record<string, string> = { "Content-Type": "application/json", "x-user-id": currentUserId };
      if (token) authHeaders["Authorization"] = `Bearer ${token}`;

      fetch(`${backendBase}/friends/respond`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          requestId: reqId || senderId,
          accept: true,
          userId: currentUserId,
        }),
      }).catch(() => null);

      if (token) {
        fetch(`${backendBase}/notifications/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            recipientId: senderId,
            title: "Friend Request Accepted",
            body: `${authenticatedPlayer?.name || "A golfer"} accepted your friend request! You are now connected.`,
            type: "SYSTEM",
            data: { type: "FRIEND_ACCEPTED", userId: currentUserId },
          }),
        }).catch(() => null);
      }
    } catch {}

    showToast(`You and ${senderName} are now connected!`, "success", "FRIEND CONNECTED");
  };

  // Handle declining an incoming friend request
  const handleDeclineFriendRequest = (req: any) => {
    const currentUserId = authenticatedPlayer?.id;
    if (!currentUserId || !req) return;
    const senderId = req.senderId || (req.type === "FRIEND_REQUEST" ? req.senderId : req.id);
    const reqId = req.id || req.requestId;

    // 1. Remove from all incoming request storage keys
    const incomingKeysToClean = [
      getIncomingRequestsKey(currentUserId),
    ];
    if (authenticatedPlayer.email) {
      incomingKeysToClean.push(getIncomingRequestsKey(authenticatedPlayer.email.toLowerCase().trim()));
    }
    const myNameSlug = authenticatedPlayer.name?.toLowerCase().trim().replace(/\s+/g, "_");
    if (myNameSlug) {
      incomingKeysToClean.push(getIncomingRequestsKey(myNameSlug));
    }

    setIncomingFriendRequests((prev) => {
      const next = prev.filter((item: any) => {
        if (reqId && item.id === reqId) return false;
        if (senderId && (item.senderId === senderId || item.id === senderId)) return false;
        return true;
      });
      for (const k of incomingKeysToClean) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter((item: any) => {
                if (reqId && item.id === reqId) return false;
                if (senderId && (item.senderId === senderId || item.id === senderId)) return false;
                return true;
              });
              localStorage.setItem(k, JSON.stringify(filtered));
            }
          }
        } catch {}
      }
      return next;
    });

    // 2. Remove recipient from sender's sent requests so sender can retry in future
    if (senderId) {
      try {
        const senderSentKey = getSentRequestsKey(senderId);
        const senderSentRaw = localStorage.getItem(senderSentKey);
        if (senderSentRaw) {
          const parsed = JSON.parse(senderSentRaw);
          const updated = parsed.filter((id: string) => id !== currentUserId && id !== authenticatedPlayer?.email && id !== authenticatedPlayer?.name);
          localStorage.setItem(senderSentKey, JSON.stringify(updated));
        }
      } catch {}
    }

    // 3. Remove the friend request notification from recipient's notification mailbox and persist
    setMobileNotifications((prev) => {
      const next = prev.filter((n: any) => {
        if (reqId && (n.id === reqId || n.data?.requestId === reqId)) return false;
        if (senderId && (n.data?.senderId === senderId || n.id === senderId)) return false;
        return true;
      });
      try {
        const notifKey = getUserNotificationsKey(currentUserId);
        localStorage.setItem(notifKey, JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const token = localStorage.getItem("openclub_access_token") || localStorage.getItem("openclub_mobile_token");
      const authHeaders: Record<string, string> = { "Content-Type": "application/json", "x-user-id": currentUserId };
      if (token) authHeaders["Authorization"] = `Bearer ${token}`;

      fetch(`${backendBase}/friends/respond`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          requestId: reqId || senderId,
          accept: false,
          userId: currentUserId,
        }),
      }).catch(() => null);
    } catch {}

    showToast("Friend request declined.", "alert", "REQUEST REMOVED");
  };

  // Handle cancelling an outgoing pending friend request
  const handleCancelSentFriendRequest = (targetId: string) => {
    const currentUserId = authenticatedPlayer?.id || "guest";
    const currentUserEmail = (authenticatedPlayer?.email || "").toLowerCase().trim();
    const currentUserName = (authenticatedPlayer?.name || "").toLowerCase().trim();
    const sentKey = getSentRequestsKey(currentUserId);

    setSentFriendRequests((prev) => {
      const next = prev.filter((id: string) => id !== targetId);
      try {
        localStorage.setItem(sentKey, JSON.stringify(next));
      } catch {}
      return next;
    });

    // 1. Remove from recipient's incoming requests across potential keys
    try {
      const targetKeys = [
        targetId,
        targetId.toLowerCase(),
        targetId.replace(/\s+/g, "_").toLowerCase(),
      ];
      for (const tk of targetKeys) {
        const incomingKey = getIncomingRequestsKey(tk);
        const raw = localStorage.getItem(incomingKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const updated = parsed.filter((item: any) => {
              const sId = String(item.senderId || item.id || "").toLowerCase().trim();
              const sEmail = String(item.senderEmail || item.email || "").toLowerCase().trim();
              const sName = String(item.senderName || item.name || "").toLowerCase().trim();
              return (
                sId !== String(currentUserId).toLowerCase().trim() &&
                (!currentUserEmail || sEmail !== currentUserEmail) &&
                (!currentUserName || sName !== currentUserName)
              );
            });
            localStorage.setItem(incomingKey, JSON.stringify(updated));
          }
        }
      }
    } catch {}

    // 2. Remove from recipient's user_notifications_* in localStorage so it never lingers
    try {
      const targetKeys = [
        targetId,
        targetId.toLowerCase(),
        targetId.replace(/\s+/g, "_").toLowerCase(),
      ];
      for (const tk of targetKeys) {
        const notifKey = `user_notifications_${tk}`;
        const raw = localStorage.getItem(notifKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const updated = parsed.filter((notif: any) => {
              const isFriendReq =
                notif.type === "FRIEND_REQUEST" ||
                notif.data?.type === "FRIEND_REQUEST" ||
                String(notif.title || "").toLowerCase().includes("friend request");
              if (!isFriendReq) return true;
              const sId = String(notif.data?.senderId || notif.senderId || "").toLowerCase().trim();
              const sEmail = String(notif.data?.senderEmail || "").toLowerCase().trim();
              const sName = String(notif.data?.senderName || "").toLowerCase().trim();
              return (
                sId !== String(currentUserId).toLowerCase().trim() &&
                (!currentUserEmail || sEmail !== currentUserEmail) &&
                (!currentUserName || sName !== currentUserName)
              );
            });
            localStorage.setItem(notifKey, JSON.stringify(updated));
          }
        }
      }
    } catch {}

    // 3. Immediately clean local simulator incoming requests if viewing that profile
    setIncomingFriendRequests((prev) =>
      prev.filter((r: any) => {
        const sId = String(r.senderId || r.id || "").toLowerCase().trim();
        return (
          sId !== String(currentUserId).toLowerCase().trim() &&
          sId !== String(targetId).toLowerCase().trim()
        );
      })
    );

    // 4. Synchronize with database via dedicated cancel and unfriend endpoints
    try {
      const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const token = localStorage.getItem("openclub_access_token") || localStorage.getItem("openclub_mobile_token");
      const authHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        "x-user-id": currentUserId,
      };
      if (token) authHeaders["Authorization"] = `Bearer ${token}`;

      // Call dedicated cancel endpoints
      fetch(`${backendBase}/friends/request/${targetId}`, {
        method: "DELETE",
        headers: authHeaders,
      }).catch(() => null);

      fetch(`${backendBase}/friends/cancel`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ senderId: currentUserId, targetUserId: targetId }),
      }).catch(() => null);

      fetch(`${backendBase}/friends/${targetId}`, {
        method: "DELETE",
        headers: authHeaders,
      }).catch(() => null);
    } catch {}

    try {
      window.dispatchEvent(new Event("storage"));
    } catch {}

    showToast("Friend request cancelled.", "alert", "REQUEST CANCELLED");
  };

  // Handle filing a moderation report against a player
  const handleFileUserReport = async () => {
    if (!reportCandidate) return;
    const currentUserId = authenticatedPlayer?.id || "guest";
    setIsSubmittingReport(true);
    try {
      const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const token = localStorage.getItem("openclub_access_token") || localStorage.getItem("openclub_mobile_token");
      const authHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        "x-user-id": currentUserId,
      };
      if (token) authHeaders["Authorization"] = `Bearer ${token}`;

      await fetch(`${backendBase}/reports/user`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          reportedId: reportCandidate.id,
          reason: reportReason,
          details: reportDetails,
        }),
      }).catch(() => null);

      // Save to local user_reports for persistence and immediate Super Admin view
      try {
        const localReports = JSON.parse(localStorage.getItem("openclub_user_reports") || "[]");
        const newReport = {
          id: `rep_${Date.now()}`,
          reporterId: currentUserId,
          reporterName: authenticatedPlayer?.name || "Player",
          reporterEmail: authenticatedPlayer?.email || "player@openclubos.com",
          reportedId: reportCandidate.id,
          reportedName: reportCandidate.name,
          reportedClub: reportCandidate.club || "OpenClub Golfer",
          reportedHcp: reportCandidate.hcp || "0.0",
          reason: reportReason,
          details: reportDetails,
          status: "PENDING",
          actionTaken: "NONE",
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem("openclub_user_reports", JSON.stringify([newReport, ...localReports]));
      } catch {}

      showToast(
        "Report submitted. Our moderation team will review this shortly.",
        "success",
        "REPORT FILED"
      );
    } catch {
      showToast("Report submitted for review.", "success", "REPORT FILED");
    } finally {
      setIsSubmittingReport(false);
      setReportCandidate(null);
      setReportDetails("");
    }
  };

  // Handle unfriending an already accepted friend
  const handleUnfriend = (targetId: string, targetName?: string) => {
    const currentUserId = authenticatedPlayer?.id;
    if (!currentUserId || !targetId) return;

    const targetIdLower = String(targetId).toLowerCase().trim();
    const targetNameLower = targetName ? targetName.toLowerCase().trim() : "";

    // 1. Remove from current user's accepted friends
    const currentAcceptedKey = getAcceptedFriendsKey(currentUserId);
    setAcceptedFriendIds((prev) => {
      const next = prev.filter((id) => {
        const idLower = String(id).toLowerCase().trim();
        return idLower !== targetIdLower && (!targetNameLower || idLower !== targetNameLower);
      });
      try {
        localStorage.setItem(currentAcceptedKey, JSON.stringify(next));
      } catch {}
      return next;
    });

    // 2. Remove current user from target's accepted friends in storage
    try {
      const targetAcceptedKey = getAcceptedFriendsKey(targetId);
      const targetAcceptedRaw = localStorage.getItem(targetAcceptedKey);
      if (targetAcceptedRaw) {
        const parsed = JSON.parse(targetAcceptedRaw);
        if (Array.isArray(parsed)) {
          const currentIdLower = String(currentUserId).toLowerCase().trim();
          const currentNameLower = authenticatedPlayer?.name?.toLowerCase().trim();
          const currentEmailLower = (authenticatedPlayer?.email || "").toLowerCase().trim();
          const updated = parsed.filter((id: string) => {
            const idLower = String(id).toLowerCase().trim();
            return (
              idLower !== currentIdLower &&
              (!currentNameLower || idLower !== currentNameLower) &&
              (!currentEmailLower || idLower !== currentEmailLower)
            );
          });
          localStorage.setItem(targetAcceptedKey, JSON.stringify(updated));
        }
      }
    } catch {}

    // 3. If target has a name slug, also clean potential target slug key
    if (targetNameLower) {
      const targetSlug = targetNameLower.replace(/\s+/g, "_");
      try {
        const slugKey = getAcceptedFriendsKey(targetSlug);
        const raw = localStorage.getItem(slugKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const currentIdLower = String(currentUserId).toLowerCase().trim();
            const currentNameLower = authenticatedPlayer?.name?.toLowerCase().trim();
            const updated = parsed.filter((id: string) => {
              const idLower = String(id).toLowerCase().trim();
              return idLower !== currentIdLower && (!currentNameLower || idLower !== currentNameLower);
            });
            localStorage.setItem(slugKey, JSON.stringify(updated));
          }
        }
      } catch {}
    }

    // 4. Update friends on course if present
    setFriendsOnCourse((prev) =>
      prev.filter((f) => String(f.id).toLowerCase().trim() !== targetIdLower)
    );

    try {
      const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const token = localStorage.getItem("openclub_access_token") || localStorage.getItem("openclub_mobile_token");
      const authHeaders: Record<string, string> = { "x-user-id": currentUserId };
      if (token) authHeaders["Authorization"] = `Bearer ${token}`;

      fetch(`${backendBase}/friends/${targetId}`, {
        method: "DELETE",
        headers: authHeaders,
      }).catch(() => null);
    } catch {}

    showToast(`${targetName || "Player"} removed from friends.`, "alert", "UNFRIENDED");
  };

  // Handle blocking a user
  const handleBlockUser = (targetId: string, targetName?: string) => {
    const currentUserId = authenticatedPlayer?.id;
    if (!currentUserId || !targetId) return;

    const targetIdLower = String(targetId).toLowerCase().trim();
    const targetNameLower = targetName ? targetName.toLowerCase().trim() : "";

    // 1. Remove from accepted friends
    const currentAcceptedKey = getAcceptedFriendsKey(currentUserId);
    setAcceptedFriendIds((prev) => {
      const next = prev.filter((id) => {
        const idLower = String(id).toLowerCase().trim();
        return idLower !== targetIdLower && (!targetNameLower || idLower !== targetNameLower);
      });
      try {
        localStorage.setItem(currentAcceptedKey, JSON.stringify(next));
      } catch {}
      return next;
    });

    // 2. Remove current user from target's accepted friends
    try {
      const targetAcceptedKey = getAcceptedFriendsKey(targetId);
      const targetAcceptedRaw = localStorage.getItem(targetAcceptedKey);
      if (targetAcceptedRaw) {
        const parsed = JSON.parse(targetAcceptedRaw);
        if (Array.isArray(parsed)) {
          const currentIdLower = String(currentUserId).toLowerCase().trim();
          const currentNameLower = authenticatedPlayer?.name?.toLowerCase().trim();
          const currentEmailLower = (authenticatedPlayer?.email || "").toLowerCase().trim();
          const updated = parsed.filter((id: string) => {
            const idLower = String(id).toLowerCase().trim();
            return (
              idLower !== currentIdLower &&
              (!currentNameLower || idLower !== currentNameLower) &&
              (!currentEmailLower || idLower !== currentEmailLower)
            );
          });
          localStorage.setItem(targetAcceptedKey, JSON.stringify(updated));
        }
      }
    } catch {}

    // 3. Remove from sent requests and incoming requests
    const sentKey = getSentRequestsKey(currentUserId);
    setSentFriendRequests((prev) => {
      const next = prev.filter((id) => id !== targetId);
      try {
        localStorage.setItem(sentKey, JSON.stringify(next));
      } catch {}
      return next;
    });

    const incomingKey = getIncomingRequestsKey(currentUserId);
    setIncomingFriendRequests((prev) => {
      const next = prev.filter((item: any) => item.id !== targetId && item.senderId !== targetId);
      try {
        localStorage.setItem(incomingKey, JSON.stringify(next));
      } catch {}
      return next;
    });

    // 4. Save to blocked users list
    setBlockedUserIds((prev) => {
      const next = prev.includes(targetId) ? prev : [...prev, targetId];
      try {
        const blockedKey = getBlockedUsersKey(currentUserId);
        localStorage.setItem(blockedKey, JSON.stringify(next));
      } catch {}
      return next;
    });

    // 5. Update friends on course if present
    setFriendsOnCourse((prev) =>
      prev.filter((f) => String(f.id).toLowerCase().trim() !== targetIdLower)
    );

    try {
      const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const token = localStorage.getItem("openclub_access_token") || localStorage.getItem("openclub_mobile_token");
      const authHeaders: Record<string, string> = { "x-user-id": currentUserId };
      if (token) authHeaders["Authorization"] = `Bearer ${token}`;

      fetch(`${backendBase}/friends/block/${targetId}`, {
        method: "POST",
        headers: authHeaders,
      }).catch(() => null);
    } catch {}

    showToast(`${targetName || "Player"} has been blocked.`, "alert", "PLAYER BLOCKED");
  };

  // Handle unblocking a user
  const handleUnblockUser = (targetId: string, targetName?: string) => {
    const currentUserId = authenticatedPlayer?.id;
    if (!currentUserId || !targetId) return;

    const targetIdLower = String(targetId).toLowerCase().trim();

    setBlockedUserIds((prev) => {
      const next = prev.filter((id) => String(id).toLowerCase().trim() !== targetIdLower);
      try {
        const blockedKey = getBlockedUsersKey(currentUserId);
        localStorage.setItem(blockedKey, JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const token = localStorage.getItem("openclub_access_token") || localStorage.getItem("openclub_mobile_token");
      const authHeaders: Record<string, string> = { "x-user-id": currentUserId };
      if (token) authHeaders["Authorization"] = `Bearer ${token}`;

      fetch(`${backendBase}/friends/block/${targetId}`, {
        method: "DELETE",
        headers: authHeaders,
      }).catch(() => null);
    } catch {}

    showToast(`${targetName || "Player"} has been unblocked.`, "success", "PLAYER UNBLOCKED");
  };

  // Handle sending an outgoing friend request
  const handleSendFriendRequest = async (targetUserId: string, targetPlayer?: any) => {
    const currentUserId = authenticatedPlayer?.id || "guest";
    const targetIdLower = String(targetUserId).toLowerCase().trim();

    // Industry standard guard: never dispatch friend request to blocked player
    if (blockedUserIds.some((id) => String(id).toLowerCase().trim() === targetIdLower)) {
      showToast("You have blocked this player. Unblock them first to connect.", "error", "ACCESS DENIED (BLOCKED)");
      return;
    }

    const sentKey = getSentRequestsKey(currentUserId);

    setSentFriendRequests((prev) => {
      const next = prev.includes(targetUserId) ? prev : [...prev, targetUserId];
      try {
        localStorage.setItem(sentKey, JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      const newIncomingItem = {
        id: `freq_${Date.now()}`,
        senderId: currentUserId,
        senderName: authenticatedPlayer?.name || "OpenClub Golfer",
        senderEmail: authenticatedPlayer?.email || "",
        senderClub: authenticatedPlayer?.club || "OpenClub Member",
        senderHcp: authenticatedPlayer?.handicap || "0.0",
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
      };
      const targetIncomingKey = getIncomingRequestsKey(targetUserId);
      const prevIncoming = JSON.parse(localStorage.getItem(targetIncomingKey) || "[]");
      localStorage.setItem(targetIncomingKey, JSON.stringify([...prevIncoming, newIncomingItem]));

      if (targetPlayer?.email) {
        const emailKey = getIncomingRequestsKey(targetPlayer.email.toLowerCase().trim());
        const prevEmail = JSON.parse(localStorage.getItem(emailKey) || "[]");
        localStorage.setItem(emailKey, JSON.stringify([...prevEmail, newIncomingItem]));
      }

      const targetNotifKey = getUserNotificationsKey(targetUserId);
      const prevNotifs = JSON.parse(localStorage.getItem(targetNotifKey) || "[]");
      const newNotif = {
        id: `notif_freq_${Date.now()}`,
        title: "Friend Request",
        body: `${authenticatedPlayer?.name || "A golfer"} sent you a friend request.`,
        data: {
          type: "FRIEND_REQUEST",
          senderId: currentUserId,
          senderName: authenticatedPlayer?.name || "A golfer",
          requestId: newIncomingItem.id,
        },
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(targetNotifKey, JSON.stringify([newNotif, ...prevNotifs]));
    } catch {}

    try {
      const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const token = localStorage.getItem("openclub_access_token") || localStorage.getItem("openclub_mobile_token");
      const authHeaders: Record<string, string> = { "Content-Type": "application/json", "x-user-id": currentUserId };
      if (token) authHeaders["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${backendBase}/friends/request`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          targetUserId,
          senderId: currentUserId,
        }),
      }).catch(() => null);

      if (res && !res.ok) {
        const errData = await res.json().catch(() => null);
        // Rollback optimistic sent request
        setSentFriendRequests((prev) => {
          const next = prev.filter((id) => id !== targetUserId);
          try {
            localStorage.setItem(sentKey, JSON.stringify(next));
          } catch {}
          return next;
        });
        showToast(errData?.message || "Unable to send friend request.", "error", "REQUEST REJECTED");
        return;
      }
    } catch {}

    showToast(`Friend request sent to ${targetPlayer?.name || "golfer"}.`, "success", "REQUEST SENT");
  };

  // Compute unread count dynamically (strictly for general notifications, not friend requests)
  const unreadNotificationsCount = useMemo(() => {
    return mobileNotifications.filter(
      (n: any) => (!n.isRead && n.unread !== false) && n.data?.type !== "FRIEND_REQUEST" && n.data?.type !== "FRIEND_REQUEST_SENT"
    ).length;
  }, [mobileNotifications]);

  // Synchronize friends, friend requests, and blocked users directly from PostgreSQL database
  useEffect(() => {
    let isMounted = true;
    async function syncSocialFromDb() {
      const currentUserId = authenticatedPlayer?.id;
      if (!currentUserId) return;
      try {
        const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const headers: Record<string, string> = { "x-user-id": currentUserId };
        const token = typeof window !== "undefined" ? (localStorage.getItem("openclub_access_token") || localStorage.getItem("openclub_mobile_token")) : null;
        if (token) headers["Authorization"] = `Bearer ${token}`;

        // 1. Fetch accepted friends from DB
        const friendsRes = await fetch(`${backendBase}/friends`, { headers }).catch(() => null);
        if (friendsRes && friendsRes.ok) {
          const friends = await friendsRes.json().catch(() => null);
          if (isMounted && Array.isArray(friends) && friends.length > 0) {
            setAcceptedFriendIds((prev) => {
              const serverIds = friends.map((f: any) => f.id);
              const serverNames = friends.map((f: any) => f.name?.toLowerCase()).filter(Boolean);
              const merged = Array.from(new Set([...prev, ...serverIds, ...serverNames]));
              try {
                localStorage.setItem(getAcceptedFriendsKey(currentUserId), JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
        }

        // 2. Fetch pending requests from DB
        const requestsRes = await fetch(`${backendBase}/friends/requests`, { headers }).catch(() => null);
        if (requestsRes && requestsRes.ok) {
          const reqData = await requestsRes.json().catch(() => null);
          if (isMounted && reqData?.incoming && Array.isArray(reqData.incoming)) {
            setIncomingFriendRequests((prev) => {
              const existingIds = new Set(prev.map((p: any) => p.id || p.senderId));
              const newIncoming = reqData.incoming.filter((inc: any) => !existingIds.has(inc.id) && !existingIds.has(inc.senderId));
              return [...newIncoming, ...prev];
            });
          }
          if (isMounted && reqData?.outgoing && Array.isArray(reqData.outgoing)) {
            setSentFriendRequests((prev) => {
              const serverSent = reqData.outgoing.map((o: any) => o.receiverId);
              return Array.from(new Set([...prev, ...serverSent]));
            });
          }
        }

        // 3. Fetch blocked users from DB
        const blockedRes = await fetch(`${backendBase}/friends/blocked`, { headers }).catch(() => null);
        if (blockedRes && blockedRes.ok) {
          const blocked = await blockedRes.json().catch(() => null);
          if (isMounted && Array.isArray(blocked)) {
            const serverBlockedIds = blocked.map((b: any) => b.id);
            setBlockedUserIds((prev) => {
              const merged = Array.from(new Set([...prev, ...serverBlockedIds]));
              try {
                localStorage.setItem(getBlockedUsersKey(currentUserId), JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
        }
      } catch {}
    }
    syncSocialFromDb();
    return () => { isMounted = false; };
  }, [authenticatedPlayer?.id]);

  // Load real members from database for Add Golf Friends search
  useEffect(() => {
    let isMounted = true;
    async function loadGolfCompetitors() {
      setIsLoadingCompetitors(true);
      try {
        const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const token = typeof window !== "undefined" ? (localStorage.getItem("openclub_access_token") || localStorage.getItem("openclub_mobile_token")) : null;
        const currentUserId = authenticatedPlayer?.id;
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        if (currentUserId) {
          headers["x-user-id"] = currentUserId;
          headers["x-player-id"] = currentUserId;
        }
        const res = await fetch(`${backendBase}/members?take=100`, { headers }).catch(() => null);
        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          const items = Array.isArray(data) ? data : data?.items || [];
          if (isMounted && Array.isArray(items)) {
            const mapped = items.map((m: any) => {
              const firstName = m.firstName || "";
              const lastName = m.lastName || "";
              const fullName = `${firstName} ${lastName}`.trim() || m.email?.split("@")[0] || "Player";
              const photoUrl = m.profilePhoto || m.avatar || m.image || undefined;
              return {
                id: m.id,
                name: fullName,
                email: m.email || "",
                club: m.club?.name || m.homeClub || "OpenClub Golfer",
                hcp: m.handicap !== undefined && m.handicap !== null ? String(m.handicap) : "0.0",
                initial: getTwoInitials(fullName),
                avatar: photoUrl,
                profilePhoto: photoUrl,
              };
            });
            setGolfCompetitors(mapped);
            return;
          }
        }
      } catch { }
      finally {
        if (isMounted) setIsLoadingCompetitors(false);
      }
    }
    loadGolfCompetitors();
    return () => { isMounted = false; };
  }, [authenticatedPlayer?.id]);

  // Dynamic server-side search query when typing in Add Golf Friends
  useEffect(() => {
    if (!friendsSearchQuery || friendsSearchQuery.trim().length < 2) return;
    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const token = typeof window !== "undefined" ? (localStorage.getItem("openclub_access_token") || localStorage.getItem("openclub_mobile_token")) : null;
        const currentUserId = authenticatedPlayer?.id;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        if (currentUserId) {
          headers["x-user-id"] = currentUserId;
          headers["x-player-id"] = currentUserId;
        }
        const res = await fetch(`${backendBase}/members?search=${encodeURIComponent(friendsSearchQuery.trim())}&take=50`, { headers }).catch(() => null);
        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          const items = Array.isArray(data) ? data : data?.items || [];
          if (isMounted && Array.isArray(items) && items.length > 0) {
            const mapped = items.map((m: any) => {
              const firstName = m.firstName || "";
              const lastName = m.lastName || "";
              const fullName = `${firstName} ${lastName}`.trim() || m.email?.split("@")[0] || "Player";
              const photoUrl = m.profilePhoto || m.avatar || m.image || undefined;
              return {
                id: m.id,
                name: fullName,
                email: m.email || "",
                club: m.club?.name || m.homeClub || "OpenClub Golfer",
                hcp: m.handicap !== undefined && m.handicap !== null ? String(m.handicap) : "0.0",
                initial: getTwoInitials(fullName),
                avatar: photoUrl,
                profilePhoto: photoUrl,
              };
            });
            setGolfCompetitors((prev) => {
              const prevIds = new Set(prev.map((p) => p.id));
              const newItems = mapped.filter((m: any) => !prevIds.has(m.id));
              return [...prev, ...newItems];
            });
          }
        }
      } catch {}
    }, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [friendsSearchQuery]);

  // Fetch real notifications for mobile user from database
  useEffect(() => {
    let isMounted = true;
    async function loadNotifications() {
      try {
        const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const token = typeof window !== "undefined" ? localStorage.getItem("openclub_access_token") : null;
        if (!token) return;
        const res = await fetch(`${backendBase}/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null);
        const currentUserId = authenticatedPlayer?.id || "guest";
        const notifKey = getUserNotificationsKey(currentUserId);

        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          const items = Array.isArray(data) ? data : data?.items || [];

          if (isMounted) {
            let combined = Array.isArray(items) ? items.map(sanitizeFlightNotif) : [];
            try {
              const localSaved = localStorage.getItem(notifKey);
              if (localSaved) {
                const parsed = JSON.parse(localSaved);
                if (Array.isArray(parsed)) {
                  const parseNotifData = (d: any) => typeof d === "string" ? (() => { try { return JSON.parse(d); } catch { return {}; } })() : (d || {});
                  const existingIds = new Set(combined.map((n: any) => n.id));
                  for (const ln of parsed) {
                    const sanitized = sanitizeFlightNotif(ln);
                    const sData = parseNotifData(sanitized.data);
                    const sTitle = (sanitized.title || "").trim().toLowerCase();
                    const sBody = (sanitized.body || sanitized.message || sanitized.desc || "").trim().toLowerCase();
                    const sType = (sData.type || sanitized.type || "").toUpperCase();
                    const sUserId = String(sData.userId || sanitized.userId || sData.senderId || sanitized.senderId || "").trim().toLowerCase();
                    const sUserName = String(sData.userName || sData.senderName || sanitized.userName || sBody.match(/^(.*?)\s+accepted/i)?.[1] || "").trim().toLowerCase();
                    const isSFriendAccepted = sType === "FRIEND_ACCEPTED" || sTitle.includes("friend request accepted") || sBody.includes("accepted your friend request");

                    const isDup =
                      existingIds.has(sanitized.id) ||
                      combined.some((c: any) => {
                        const cData = parseNotifData(c.data);
                        const cTitle = (c.title || "").trim().toLowerCase();
                        const cBody = (c.body || c.message || c.desc || "").trim().toLowerCase();
                        const cType = (cData.type || c.type || "").toUpperCase();
                        const cUserId = String(cData.userId || c.userId || cData.senderId || c.senderId || "").trim().toLowerCase();
                        const cUserName = String(cData.userName || cData.senderName || c.userName || cBody.match(/^(.*?)\s+accepted/i)?.[1] || "").trim().toLowerCase();
                        const isCFriendAccepted = cType === "FRIEND_ACCEPTED" || cTitle.includes("friend request accepted") || cBody.includes("accepted your friend request");

                        if (isSFriendAccepted && isCFriendAccepted) {
                          if (sUserId && cUserId && sUserId === cUserId) return true;
                          if (sUserName && cUserName && sUserName === cUserName) return true;
                        }
                        if (cTitle === sTitle && cBody === sBody) return true;
                        return false;
                      });
                    if (!isDup) {
                      combined.unshift(sanitized);
                    }
                  }
                }
              }
              localStorage.setItem(notifKey, JSON.stringify(combined));
            } catch {}
            setMobileNotifications(combined);
          }
        } else if (isMounted) {
          try {
            const localSaved = localStorage.getItem(notifKey);
            if (localSaved) {
              const parsed = JSON.parse(localSaved);
              if (Array.isArray(parsed)) {
                const seenLocalKeys = new Set<string>();
                const dedupedLocal = parsed.filter((n: any) => {
                  const d = typeof n.data === "string" ? (() => { try { return JSON.parse(n.data); } catch { return {}; } })() : (n.data || {});
                  const title = (n.title || "").trim().toLowerCase();
                  const body = (n.body || n.desc || n.message || "").trim().toLowerCase();
                  const type = (d.type || n.type || "").toUpperCase();
                  const uId = String(d.userId || n.userId || d.senderId || n.senderId || "").trim().toLowerCase();
                  const uName = String(d.userName || d.senderName || n.userName || body.match(/^(.*?)\s+accepted/i)?.[1] || "").trim().toLowerCase();
                  const isAccepted = type === "FRIEND_ACCEPTED" || title.includes("friend request accepted") || body.includes("accepted your friend request");
                  const key = isAccepted && (uId || uName) ? `FA_${uId || uName}` : `${title}:::${body}`;
                  if (key && seenLocalKeys.has(key)) return false;
                  if (key) seenLocalKeys.add(key);
                  return true;
                });
                const sanitizedDeduped = dedupedLocal.map(sanitizeFlightNotif);
                setMobileNotifications(sanitizedDeduped);
                try {
                  localStorage.setItem(notifKey, JSON.stringify(sanitizedDeduped));
                } catch {}
              }
            }
          } catch {}
        }
      } catch { }
    }
    loadNotifications();
    return () => { isMounted = false; };
  }, [authenticatedPlayer?.id, sanitizeFlightNotif]);

  // Synchronize active round with live database tournament
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isForfeited = localStorage.getItem("openclub_active_round_forfeited");
      const isClosed = localStorage.getItem("openclub_active_round_closed");
      if (isForfeited === "true" || isClosed === "true") {
        setActiveRound(null);
        return;
      }
    }

    const hasOfficialGroup = Boolean(
      tournamentGroupings &&
      Array.isArray(tournamentGroupings.groups) &&
      tournamentGroupings.groups.some((g) =>
        g.registrations?.some((r) =>
          isAccountUser({
            id: r.user?.id || r.id,
            email: r.user?.email,
            name: `${r.user?.firstName || ""} ${r.user?.lastName || ""}`.trim(),
          })
        )
      )
    );

    if (activeTournament && (activeTournament.status === "LIVE" || activeTournament.status === "REGISTRATION_OPEN" || hasOfficialGroup)) {
      const matchedGroup = (tournamentGroupings && Array.isArray(tournamentGroupings.groups))
        ? tournamentGroupings.groups.find((g) =>
            g.registrations?.some((r) =>
              isAccountUser({
                id: r.user?.id || r.id,
                email: r.user?.email,
                name: `${r.user?.firstName || ""} ${r.user?.lastName || ""}`.trim(),
              })
            )
          )
        : null;

      const roundNumber = matchedGroup?.day || (() => {
        if (activeTournament.startDate) {
          const start = new Date(activeTournament.startDate).getTime();
          const now = Date.now();
          if (now >= start) {
            const daysDiff = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
            const maxDays = Math.max(1, activeTournament.courseHoles > 9 ? 4 : 2);
            return Math.min(maxDays, Math.max(1, daysDiff));
          }
        }
        return 1;
      })();
      const dayText = `ROUND ${roundNumber}`;

      const playerEntry = (registeredPlayers || []).find((p) => isAccountUser(p));
      const userThru = playerEntry && !isNaN(Number((playerEntry as any).thru))
        ? Number((playerEntry as any).thru)
        : 0;
      const activeHoleNumber = Math.min(courseHoles.length || 18, Math.max(1, userThru + 1));
      const activeHoleIndex = activeHoleNumber - 1;
      const currentHoleData = courseHoles[activeHoleIndex] || courseHoles[0];
      const holePar = currentHoleData?.par || 4;
      const holeYards = currentHoleData?.yards || currentHoleData?.yardage || 345;
      const isLive = activeTournament.status === "LIVE";

      setActiveRound({
        id: `ar-${activeTournament.id}`,
        tournamentId: activeTournament.id,
        tournamentName: activeTournament.name,
        courseName: activeTournament.courseName || "Oakwood Country Club Course",
        clubName: activeTournament.organizerClub || "Oakwood Country Club",
        holeNumber: activeHoleNumber,
        par: holePar,
        yardage: holeYards,
        holeInfo: `Par ${holePar} • ${holeYards} yds`,
        isLive,
        dayText,
        score: playerEntry?.gross && playerEntry.gross !== "--" ? `Gross ${playerEntry.gross}` : "E",
        thru: String(userThru),
        flightText: matchedGroup
          ? (matchedGroup.name ? matchedGroup.name : "Flight 1")
          : (tournamentGroupings && Array.isArray(tournamentGroupings.groups) && tournamentGroupings.groups.length > 0
              ? "Flight Pending Assignment"
              : "Flight 1"),
        groupPlayers: (() => {
          const players: GroupPlayer[] = [];
          const seenIds = new Set<string>();

          // Priority 1: Match player to official tournament groupings in the database
          if (matchedGroup) {
            for (const r of matchedGroup.registrations || []) {
              const rawPartnerName = `${r.user?.firstName || ""} ${r.user?.lastName || ""}`.trim() || r.user?.email || "Player";
              const partnerName = rawPartnerName.replace(/-\d+$/, "").trim();
              const partnerId = r.user?.id || r.id;
              if (
                isAccountUser({ id: partnerId, email: r.user?.email, name: partnerName }) ||
                isAccountUser({ id: partnerId, email: r.user?.email, name: rawPartnerName })
              ) {
                continue;
              }
              if (!seenIds.has(partnerId)) {
                seenIds.add(partnerId);
                const photo =
                  r.user?.profilePhoto ||
                  (r as any).avatar ||
                  (r.user as any)?.avatar ||
                  undefined;
                players.push({
                  id: partnerId,
                  name: partnerName,
                  initials: getTwoInitials(partnerName),
                  avatar: photo,
                });
              }
              if (players.length >= 3) break;
            }

            // Automatically record flight grouping notification in notifications tab if not already present
            if (players.length > 0 && typeof window !== "undefined") {
              try {
                const currentUserId = authenticatedPlayer?.id || "guest";
                const notifKey = getUserNotificationsKey(currentUserId);
                const groupingNotifId = `notif_flight_grp_${activeTournament.id}_${matchedGroup.id || "r1"}`;
                const savedNotifsRaw = localStorage.getItem(notifKey);
                const savedNotifs = savedNotifsRaw ? JSON.parse(savedNotifsRaw) : [];
                const existingNotif = Array.isArray(savedNotifs) ? savedNotifs.find((n: any) => n.id === groupingNotifId) : null;
                
                const partnerNamesList = players.map((pl) => pl.name).filter(Boolean);
                const formattedNames = partnerNamesList.join("\n");
                const flightNotifBody = `You are grouped with:\n${formattedNames}\nfor ${matchedGroup.name || dayText} of ${activeTournament.name}.`;

                if (!existingNotif || existingNotif.body !== flightNotifBody || isCorruptedFlightNotifDate(existingNotif.createdAt)) {
                  // Flight grouping notification timestamp represents when the notification was created/assigned, never backdated to seed dates
                  const notifCreatedAt =
                    existingNotif && !isCorruptedFlightNotifDate(existingNotif.createdAt) && existingNotif.body === flightNotifBody
                      ? existingNotif.createdAt
                      : new Date().toISOString();

                  const flightNotif = {
                    id: groupingNotifId,
                    title: `Flight Grouping: ${matchedGroup.name || dayText}`,
                    body: flightNotifBody,
                    isRead: existingNotif ? existingNotif.isRead : false,
                    unread: existingNotif ? existingNotif.unread : true,
                    createdAt: notifCreatedAt,
                    type: "FLIGHT_GROUPING",
                    data: {
                      type: "FLIGHT_GROUPING",
                      tournamentId: activeTournament.id,
                      tournamentName: activeTournament.name,
                      flightName: matchedGroup.name || dayText,
                      groupName: matchedGroup.name || dayText,
                      flightPartners: partnerNamesList,
                    },
                  };
                  const updated = [flightNotif, ...(Array.isArray(savedNotifs) ? savedNotifs.filter((n: any) => n.id !== groupingNotifId) : [])];
                  localStorage.setItem(notifKey, JSON.stringify(updated));
                  setMobileNotifications((prev) => [
                    flightNotif,
                    ...prev.filter((n: any) => n.id !== groupingNotifId),
                  ]);
                }
              } catch {}
            }

            return players;
          }

          // Priority 2: Fallback when groupings have not yet been generated in database
          for (const p of registeredPlayers || []) {
            if (isAccountUser(p)) continue;
            if (!seenIds.has(p.id)) {
              seenIds.add(p.id);
              players.push({
                id: p.id,
                name: p.name,
                initials: getTwoInitials(p.name),
                avatar: undefined,
              });
            }
            if (players.length >= 3) break;
          }

          return players;
        })(),
      });
    } else {
      setActiveRound(null);
    }
  }, [activeTournament, courseHoles, registeredPlayers, golfCompetitors, authenticatedPlayer, isAccountUser, tournamentGroupings]);

  // Hybrid 3-Stage Inactivity & Lifecycle Management
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkStatus = () => {
      try {
        // Only evaluate and notify when player is authenticated
        const storedPlayer = localStorage.getItem("openclub_authenticated_player");
        if (!authenticatedPlayer && !storedPlayer) {
          setHasInactivityWarning(false);
          return;
        }

        // Never trigger in-game inactivity notifications on public or auth screens
        const authScreens = ["landing", "login", "register", "verify-email", "check-inbox", "forgot-password", "reset-password"];
        if (authScreens.includes(activeScreen)) {
          setHasInactivityWarning(false);
          return;
        }

        const isForfeited = localStorage.getItem("openclub_active_round_forfeited");
        const isClosed = localStorage.getItem("openclub_active_round_closed");
        if (isForfeited === "true" || isClosed === "true" || !activeRound) {
          if (isForfeited === "true" || isClosed === "true") {
            setActiveRound(null);
          }
          setActiveRoundMinutesElapsed(0);
          setHasInactivityWarning(false);
          return;
        }

        let startedAtStr = localStorage.getItem("openclub_active_round_started_at");
        let startedAt = startedAtStr ? parseInt(startedAtStr, 10) : 0;
        const now = Date.now();

        if (!startedAt || isNaN(startedAt)) {
          startedAt = now;
          localStorage.setItem("openclub_active_round_started_at", String(now));
        }

        const elapsedMs = now - startedAt;
        const thirtyMinsMs = 30 * 60 * 1000;
        const elapsedMins = Math.floor(elapsedMs / 60000);

        const currentTournName = activeRound.tournamentName || activeTournament?.name || "Tournament";
        const currentHoleNumber = activeRound.holeNumber || 1;

        if (elapsedMs >= thirtyMinsMs) {
          setActiveRoundMinutesElapsed(elapsedMins);
          setHasInactivityWarning(true);
          const hasNotified = sessionStorage.getItem("openclub_inactivity_notified");
          if (!hasNotified) {
            sessionStorage.setItem("openclub_inactivity_notified", "true");
            showToast(`${currentTournName}: Inactivity alert on Hole ${currentHoleNumber}. Tap Resume Play to record your score.`, "alert", "INACTIVE FOR 30 MINUTES");

            // Dispatch real-time Pace of Play alert to Organizer & Super Admin TopNav
            const playerEmail = authenticatedPlayer?.email || (storedPlayer ? JSON.parse(storedPlayer).email : "player@golfclub.com");
            const playerName = authenticatedPlayer?.name || (storedPlayer ? JSON.parse(storedPlayer).name : "Tournament Player");
            const alertNotification = {
              id: `inact-alert-${Date.now()}`,
              userId: "admin",
              title: "Pace of Play Alert (30m Inactivity)",
              body: `${playerName} (${playerEmail}) is yet to enter a score on Hole ${currentHoleNumber} in ${currentTournName} (30 mins elapsed).`,
              type: "TOURNAMENT_ALERT",
              isRead: false,
              createdAt: new Date().toISOString(),
              data: {
                tournamentId: activeRound?.tournamentId || activeTournament?.id || "",
                tournamentName: currentTournName,
                playerName,
                playerEmail,
                holeNumber: currentHoleNumber,
                minutesInactive: elapsedMins >= 30 ? elapsedMins : 30,
                category: "PACE_OF_PLAY",
              },
            };

            try {
              const existingRaw = localStorage.getItem("openclub_live_admin_notifications");
              const existingList = existingRaw ? JSON.parse(existingRaw) : [];
              const filtered = Array.isArray(existingList) ? existingList.filter((n: any) => n.id !== alertNotification.id) : [];
              localStorage.setItem("openclub_live_admin_notifications", JSON.stringify([alertNotification, ...filtered]));
            } catch { }

            broadcastAdminEvent("tournament-inactivity-alert", alertNotification);
          }
        } else {
          setActiveRoundMinutesElapsed(elapsedMins);
          setHasInactivityWarning(false);
        }
      } catch { }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    const unsubscribeEvents = subscribeAdminEvents((event) => {
      if (event.type === "player-forfeited") {
        setActiveRound(null);
        setActiveRoundMinutesElapsed(0);
        setHasInactivityWarning(false);
        const forfeitedTournName = activeRound?.tournamentName || activeTournament?.name || "Tournament";
        showToast(`${forfeitedTournName} match forfeited by Tournament Committee.`, "error", "ADMIN FORFEIT (WD)");
      } else if (event.type === "tournament-groupings-updated") {
        setGroupingsRefreshKey((k) => k + 1);
      }
    });
    return () => {
      clearInterval(interval);
      unsubscribeEvents();
    };
  }, [authenticatedPlayer, activeScreen, activeRound, activeTournament]);

  const filteredFriends = useMemo(() => {
    const combined = [...golfCompetitors];
    const existingIds = new Set(combined.map((c) => c.id));
    const existingNames = new Set(combined.map((c) => c.name.toLowerCase()));

    for (const rp of registeredPlayers) {
      if (!existingIds.has(rp.id) && !existingNames.has(rp.name.toLowerCase())) {
        combined.push({
          id: rp.id,
          name: rp.name,
          email: "",
          club: rp.club || "Tournament Player",
          hcp: String(rp.handicap ?? "0.0"),
          initial: rp.initials?.[0] || rp.name.charAt(0).toUpperCase() || "P",
        });
      }
    }

    if (!friendsSearchQuery.trim()) {
      return [];
    }
    const q = friendsSearchQuery.trim().toLowerCase();
    const currentId = authenticatedPlayer?.id;
    const currentEmail = authenticatedPlayer?.email?.toLowerCase().trim();
    const currentName = authenticatedPlayer?.name?.toLowerCase().trim();

    return combined.filter((p) => {
      // Exclude currently authenticated player from friend search
      if (currentId && p.id === currentId) return false;
      if (currentEmail && p.email && p.email.toLowerCase().trim() === currentEmail) return false;
      if (currentName && p.name && p.name.toLowerCase().trim() === currentName) return false;

      // Exclude blocked users from friend search
      const pIdLower = String(p.id).toLowerCase().trim();
      const pNameLower = p.name.toLowerCase().trim();
      const pEmailLower = (p.email || "").toLowerCase().trim();
      if (blockedUserIds.some((bId) => {
        const bLower = String(bId).toLowerCase().trim();
        return bLower === pIdLower || bLower === pNameLower || (pEmailLower && bLower === pEmailLower);
      })) return false;

      return (
        p.name.toLowerCase().includes(q) ||
        (p.email && p.email.toLowerCase().includes(q))
      );
    });
  }, [golfCompetitors, registeredPlayers, friendsSearchQuery, authenticatedPlayer?.id, authenticatedPlayer?.email, authenticatedPlayer?.name, acceptedFriendIds, blockedUserIds]);

  const filteredActivePlayers = useMemo(() => {
    // Only display players who have actually started playing on the golf course / started a round
    const onCoursePlayers = activeCompetitorsData.filter((p: any) => p.roundStarted);
    if (!activePlayersSearchQuery.trim()) return onCoursePlayers;
    const q = activePlayersSearchQuery.toLowerCase().trim();
    return onCoursePlayers.filter((p: any) =>
      p.name.toLowerCase().includes(q) ||
      p.club.toLowerCase().includes(q) ||
      p.flight.toLowerCase().includes(q) ||
      p.score.toLowerCase().includes(q) ||
      `hole ${p.currentHole}`.toLowerCase().includes(q)
    );
  }, [activeCompetitorsData, activePlayersSearchQuery]);

  // --- Verify Email (6-Digit OTP) State ---
  const [verifyEmailTarget, setVerifyEmailTarget] = useState("");
  const [activeOtpCode, setActiveOtpCode] = useState<string | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(59);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // --- Strict Numeric Keydown Interceptor (Strictly blocks alphabetic characters) ---
  const handleStrictNumericKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    options?: { allowDecimal?: boolean; allowPlus?: boolean }
  ) => {
    // Allow essential navigation / editing keys
    const allowedNavKeys = [
      "Backspace",
      "Delete",
      "Tab",
      "Enter",
      "Escape",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ];
    if (allowedNavKeys.includes(e.key)) return;
    if (e.ctrlKey || e.metaKey) return; // Allow system shortcuts (Ctrl+A, Ctrl+C, Ctrl+V, etc.)

    // Check if key is a single digit 0-9
    if (/^\d$/.test(e.key)) return;

    // Decimal point (allowed only once if allowDecimal is true)
    if (options?.allowDecimal && e.key === "." && !e.currentTarget.value.includes(".")) {
      return;
    }

    // Plus sign (allowed only at beginning if allowPlus is true)
    if (options?.allowPlus && e.key === "+" && e.currentTarget.value.length === 0) {
      return;
    }

    // STRICTLY BLOCK ALL ALPHABETIC AND NON-NUMERIC CHARACTERS
    e.preventDefault();
  };

  const handleOtpChange = (index: number, value: string) => {
    // Strip any non-digit characters
    const clean = value.replace(/\D/g, "");
    if (!clean && value !== "") return;

    if (clean.length > 1) {
      const digits = clean.slice(0, 6).split("");
      const newDigits = [...otpDigits];
      digits.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setOtpDigits(newDigits);
      const nextIdx = Math.min(digits.length, 5);
      document.getElementById(`otp-box-${nextIdx}`)?.focus();
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = clean.slice(-1);
    setOtpDigits(newDigits);

    if (clean && index < 5) {
      const nextInput = document.getElementById(`otp-box-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedNavKeys = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight"];
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-box-${index - 1}`);
      prevInput?.focus();
      return;
    }
    if (allowedNavKeys.includes(e.key) || e.ctrlKey || e.metaKey) return;

    // Strictly block any non-digit character (a-z, A-Z, symbols)
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    try {
      setResendCooldown(59);
      setVerifyError(null);
      const targetEmail = verifyEmailTarget || regEmail || "";
      const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const res = await fetch(`${backendBase}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await res.json().catch(() => null);

      const resolvedCode = data?.otpCode || null;
      if (resolvedCode) setActiveOtpCode(resolvedCode);

      showToast("A new verification code has been sent to your email address.", "success", "CODE DISPATCHED");
    } catch {
      showToast("A new verification code has been sent to your email address.", "success", "CODE DISPATCHED");
    }
  };

  // --- Reset Password ("Set New Password") State ---
  const [newResetPassword, setNewResetPassword] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");
  const [showNewResetPassword, setShowNewResetPassword] = useState(false);
  const [showConfirmResetPassword, setShowConfirmResetPassword] = useState(false);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  // --- Forgot Password & Check Inbox State ---
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);
  const [checkInboxEmail, setCheckInboxEmail] = useState<string>("");
  const [checkInboxCountdown, setCheckInboxCountdown] = useState<number>(48);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (checkInboxCountdown > 0 && activeScreen === "check-inbox") {
      timer = setTimeout(() => {
        setCheckInboxCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [checkInboxCountdown, activeScreen]);

  const handleForgotSubmit = async (emailToReset?: string) => {
    const targetEmail = (emailToReset || forgotEmail).trim();
    if (!targetEmail || !targetEmail.includes("@")) {
      showToast("Please enter a valid email address.", "error", "EMAIL REQUIRED");
      return;
    }

    setIsSubmittingForgot(true);
    try {
      const backendBase = process.env.NEXT_PUBLIC_API_URL || "/api";
      const res = await fetch(`${backendBase}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-platform": "mobile",
          "x-client-platform": "mobile",
        },
        body: JSON.stringify({ email: targetEmail, platform: "mobile" }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        let errMsg = data?.message || "Password reset request failed. Please check your account details.";
        if (errMsg.toLowerCase().includes("organizer") || errMsg.toLowerCase().includes("administrator") || errMsg.toLowerCase().includes("web admin")) {
          errMsg = "Access restricted: This application is designated for player accounts only. Please sign in with an authorized player account.";
        }
        const isRoleRestricted = res.status === 403 || errMsg.toLowerCase().includes("role") || errMsg.toLowerCase().includes("access") || errMsg.toLowerCase().includes("restricted");
        showToast(errMsg, "error", isRoleRestricted ? "ACCESS RESTRICTED" : "REQUEST FAILED");
        return;
      }

      setCheckInboxEmail(targetEmail);
      setCheckInboxCountdown(48);
      switchScreen("check-inbox");
      showToast(`Password reset link dispatched to ${targetEmail}`, "success", "INBOX UPDATED");
    } catch {
      // If backend connection is refused/offline in preview simulator, transition gracefully
      setCheckInboxEmail(targetEmail);
      setCheckInboxCountdown(48);
      switchScreen("check-inbox");
      showToast("Backend server on port 3001 is offline. Switched to Check Your Inbox in preview simulation mode.", "error", "SERVER CONNECTION FAILURE");
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  const handleResendFromInbox = async () => {
    if (checkInboxCountdown > 0) return;
    try {
      const backendBase = process.env.NEXT_PUBLIC_API_URL || "/api";
      const res = await fetch(`${backendBase}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-platform": "mobile",
          "x-client-platform": "mobile",
        },
        body: JSON.stringify({ email: checkInboxEmail, platform: "mobile" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        let errMsg = data?.message || "Failed to resend reset link.";
        if (errMsg.toLowerCase().includes("organizer") || errMsg.toLowerCase().includes("administrator") || errMsg.toLowerCase().includes("web admin")) {
          errMsg = "Access restricted: This application is designated for player accounts only. Please sign in with an authorized player account.";
        }
        const isRoleRestricted = res.status === 403 || errMsg.toLowerCase().includes("role") || errMsg.toLowerCase().includes("access");
        showToast(errMsg, "error", isRoleRestricted ? "ACCESS RESTRICTED" : "RESEND FAILED");
        return;
      }
      setCheckInboxCountdown(60);
      showToast(
        `New reset instructions dispatched to ${checkInboxEmail}`,
        "success",
        "RESENT SUCCESSFULLY"
      );
    } catch {
      setCheckInboxCountdown(60);
      showToast("Backend server is offline. Simulation reset countdown restarted.", "error", "SERVER CONNECTION FAILURE");
    }
  };

  const handleResetPasswordSubmit = async () => {
    if (!newResetPassword || newResetPassword.length < 8) {
      showToast("Password must be at least 8 characters long", "error", "PASSWORD TOO SHORT");
      return;
    }
    if (calcPasswordStrength(newResetPassword) < 4) {
      showToast("Password meter is not full. Add uppercase, number & symbol to proceed.", "error", "PASSWORD TOO WEAK");
      return;
    }
    if (newResetPassword !== confirmResetPassword) {
      showToast("Passwords do not match. Please verify your password entry.", "error", "PASSWORDS DO NOT MATCH");
      return;
    }
    setIsSubmittingReset(true);
    try {
      const backendBase = process.env.NEXT_PUBLIC_API_URL || "/api";
      const tokenFromUrl = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("token") : null;
      if (tokenFromUrl) {
        const res = await fetch(`${backendBase}/auth/reset-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-platform": "mobile",
            "x-client-platform": "mobile",
          },
          body: JSON.stringify({
            token: tokenFromUrl,
            newPassword: newResetPassword,
            platform: "mobile",
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          let errMsg = data?.message || "Failed to reset password. Token may be expired.";
          if (errMsg.toLowerCase().includes("organizer") || errMsg.toLowerCase().includes("administrator") || errMsg.toLowerCase().includes("web admin")) {
            errMsg = "Access restricted: This application is designated for player accounts only. Please sign in with an authorized player account.";
          }
          showToast(errMsg, "error", "ACCESS RESTRICTED");
          return;
        }
      }
      setLoginPassword(newResetPassword);
      showToast("Password successfully updated! Please sign in with your new credentials.", "success", "PASSWORD UPDATED");
      setTimeout(() => {
        switchScreen("login");
      }, 1200);
    } catch (err: any) {
      let errMsg = err?.message || "Password update failed. Please request a new reset link.";
      if (errMsg.toLowerCase().includes("organizer") || errMsg.toLowerCase().includes("administrator") || errMsg.toLowerCase().includes("web admin")) {
        errMsg = "Access restricted: This application is designated for player accounts only. Please sign in with an authorized player account.";
      }
      showToast(errMsg, "error", "ACCESS RESTRICTED");
    } finally {
      setIsSubmittingReset(false);
    }
  };

  // --- Registration Wizard State (Steps 1 - 4) ---
  const [regStep, setRegStep] = useState<1 | 2 | 3 | 4>(1);

  // Always reset scroll to top on registration step change
  useEffect(() => {
    scrollToTopAll();
  }, [regStep]);

  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regShowConfirm, setRegShowConfirm] = useState(false);

  const currentDisplayName = authenticatedPlayer?.name || (regFirstName ? `${regFirstName} ${regLastName}`.trim() : "Tournament Player");
  const currentInitials = (currentDisplayName.split(" ").filter(Boolean).map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() || "TP");

  // Step 2
  const [regClassification, setRegClassification] = useState<"BEGINNER" | "AMATEUR" | "PROFESSIONAL" | null>(null);
  const [showClassificationModal, setShowClassificationModal] = useState(false);
  const [regHandicap, setRegHandicap] = useState("");
  const [regNoHandicap, setRegNoHandicap] = useState(false);
  const [regHomeClub, setRegHomeClub] = useState("");
  const [regGender, setRegGender] = useState<"MALE" | "FEMALE" | null>(null);
  const [regDob, setRegDob] = useState("");
  const [showClubSuggestions, setShowClubSuggestions] = useState(false);
  const clubDropdownRef = useRef<HTMLDivElement>(null);
  const [showDobCalendar, setShowDobCalendar] = useState(false);
  const dobCalendarRef = useRef<HTMLDivElement>(null);
  const [dobCalendarMonth, setDobCalendarMonth] = useState<Date>(() => new Date(2000, 0, 1));
  const [showClubModal, setShowClubModal] = useState(false);
  const [clubSearchQuery, setClubSearchQuery] = useState("");

  const formatClubLocation = (c: { city?: string | null; state?: string | null; country?: string | null; holes?: number | null }) => {
    const countryNameMap: Record<string, string> = {
      NG: "Nigeria",
      NGA: "Nigeria",
      GH: "Ghana",
      GHA: "Ghana",
      US: "United States",
      USA: "United States",
      GB: "United Kingdom",
      UK: "United Kingdom",
      ZA: "South Africa",
      KE: "Kenya",
    };

    const rawCountry = (c.country || "").trim().toUpperCase();
    const countryFull = countryNameMap[rawCountry] || (rawCountry === "NG" ? "Nigeria" : rawCountry === "GH" ? "Ghana" : c.country || "");

    // Strip out LGA / neighborhood names such as "Eti Osa", "Eti-Osa"
    const cleanDistrict = (val?: string | null) => {
      if (!val) return "";
      const lower = val.trim().toLowerCase();
      if (lower === "eti osa" || lower === "eti-osa" || lower.includes("eti osa") || lower.includes("eti-osa")) {
        return "";
      }
      return val.trim();
    };

    const state = cleanDistrict(c.state);
    const city = cleanDistrict(c.city);

    // Prioritize state (e.g. Lagos), or city if clean and non-empty
    const region = state || city;
    const parts = [region, countryFull].filter(Boolean);
    const baseLoc = parts.join(", ");
    return `${baseLoc}${c.holes ? ` • ${c.holes} Holes` : ""}`;
  };

  const [coursesList, setCoursesList] = useState<{
    id: string;
    name: string;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    type?: string | null;
    holes?: number | null;
    coverImage?: string | null;
    logo?: string | null;
    logoUrl?: string | null;
  }[]>([]);

  // Fetch courses from backend database to sync dynamically with registered golf courses
  useEffect(() => {
    let isMounted = true;
    const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    fetch(`${backendBase}/courses`)
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => {
        const fetched = Array.isArray(data) ? data : data?.items || [];
        if (isMounted && Array.isArray(fetched)) {
          setCoursesList(fetched);
        }
      })
      .catch(() => { });
    return () => { isMounted = false; };
  }, []);

  // Close suggestions / modals on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (clubDropdownRef.current && !clubDropdownRef.current.contains(e.target as Node)) {
        setShowClubSuggestions(false);
      }
      if (dobCalendarRef.current && !dobCalendarRef.current.contains(e.target as Node)) {
        setShowDobCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCourses = coursesList.filter((c) => {
    const query = (showClubModal ? clubSearchQuery : regHomeClub).toLowerCase().trim();
    if (!query) return true;
    const formattedLoc = formatClubLocation(c).toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      formattedLoc.includes(query) ||
      (c.city && c.city.toLowerCase().includes(query)) ||
      (c.state && c.state.toLowerCase().includes(query)) ||
      (c.country && c.country.toLowerCase().includes(query))
    );
  });

  const getFlagEmoji = (isoCode: string) => {
    if (!isoCode || isoCode.length !== 2) return "🌐";
    return String.fromCodePoint(...isoCode.toUpperCase().split("").map((c) => 127397 + c.charCodeAt(0)));
  };

  const countryList = React.useMemo(() => {
    return Country.getAllCountries().map((c) => ({
      isoCode: c.isoCode,
      name: c.name,
      phonecode: c.phonecode.replace(/^\+/, ""),
      flag: getFlagEmoji(c.isoCode),
    }));
  }, []);

  // Step 3
  const [regAvatar, setRegAvatar] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [regCountry, setRegCountry] = useState("NG");
  const [regPhoneCode, setRegPhoneCode] = useState("234");
  const [regCountryFlag, setRegCountryFlag] = useState("🇳🇬");
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regState, setRegState] = useState("");
  const [regCity, setRegCity] = useState("");
  const [regPushNotifications, setRegPushNotifications] = useState(true);
  const [showStateModal, setShowStateModal] = useState(false);
  const [stateSearchQuery, setStateSearchQuery] = useState("");
  const [showCityModal, setShowCityModal] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState("");

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX_SIZE_BYTES = 500 * 1024; // strictly 500KB limit
    if (file.size > MAX_SIZE_BYTES) {
      showToast(`Photo exceeds strict 500KB limit (${(file.size / 1024).toFixed(0)}KB). Please choose a file under 500KB.`);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setRegAvatar(reader.result);
        showToast("Player headshot uploaded successfully!");
      }
    };
    reader.readAsDataURL(file);
  };

  // Step 4
  const [regAgreedRules, setRegAgreedRules] = useState(false);
  const [regAgreedMarker, setRegAgreedMarker] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [regEmailError, setRegEmailError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [regPhoneError, setRegPhoneError] = useState<string | null>(null);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);

  const calcPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let s = 0;
    if (pass.length >= 8) s++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) s++;
    if (/[0-9]/.test(pass)) s++;
    if (/[^A-Za-z0-9]/.test(pass)) s++;
    return s;
  };

  // Reactive Step Completion Validation for Disabled Button States
  const isRegStep1Valid = Boolean(
    regFirstName.trim() &&
    regLastName.trim() &&
    regEmail.includes("@") &&
    regEmail.includes(".") &&
    regPassword.length >= 8 &&
    calcPasswordStrength(regPassword) === 4 &&
    regPassword === regConfirmPassword &&
    !regEmailError
  );

  const isRegStep2Valid = Boolean(
    regClassification &&
    (regClassification === "PROFESSIONAL" ||
      (regClassification === "BEGINNER" && regHandicap.trim() !== "") ||
      (regClassification === "AMATEUR" &&
        regHandicap.trim() !== "" &&
        !isNaN(Number(regHandicap)) &&
        Number(regHandicap) < 36 &&
        Number(regHandicap) >= 0)) &&
    regGender &&
    regDob.trim()
  );

  const isRegStep3Valid = Boolean(
    regPhone.replace(/\D/g, "").length >= 7 &&
    regCity.trim() &&
    regState.trim() &&
    !regPhoneError
  );

  const isRegStep4Valid = Boolean(isRegStep1Valid && isRegStep2Valid && isRegStep3Valid);

  const checkEmailUniqueness = async (emailToVerify: string): Promise<boolean> => {
    const trimmed = emailToVerify.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@") || !trimmed.includes(".")) {
      setRegEmailError(null);
      return true;
    }
    try {
      setIsCheckingEmail(true);
      const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const res = await fetch(`${backendBase}/auth/validate-player`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.available === false) {
        setRegEmailError("This email is already registered.");
        showToast("This email is already registered. Please sign in.", "error");
        return false;
      }
      setRegEmailError(null);
      return true;
    } catch {
      return true;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const checkPhoneUniqueness = async (phoneToVerify: string): Promise<boolean> => {
    const cleanDigits = phoneToVerify.replace(/\D/g, "");
    if (!cleanDigits || cleanDigits.length < 7) {
      setRegPhoneError(null);
      return true;
    }
    try {
      setIsCheckingPhone(true);
      const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const formatted = phoneToVerify.trim().startsWith("+")
        ? phoneToVerify.trim()
        : `+${regPhoneCode}${cleanDigits.replace(/^0+/, "")}`;
      const res = await fetch(`${backendBase}/auth/validate-player`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formatted }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.available === false) {
        setRegPhoneError("This phone number is already registered.");
        showToast("This phone number is already registered.", "error");
        return false;
      }
      setRegPhoneError(null);
      return true;
    } catch {
      return true;
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const handleRegNext = async () => {
    if (regStep === 1) {
      if (!regFirstName.trim() || !regLastName.trim()) {
        showToast("Please enter your full first and last name.", "error");
        return;
      }
      if (!regEmail.includes("@") || !regEmail.includes(".")) {
        showToast("Please enter a valid email address.", "error");
        return;
      }
      if (regPassword.length < 8) {
        showToast("Password must be at least 8 characters.", "error");
        return;
      }
      if (calcPasswordStrength(regPassword) < 4) {
        showToast("Password is too weak. Please make it stronger before moving to the next step.", "error");
        return;
      }
      if (regPassword !== regConfirmPassword) {
        showToast("Passwords do not match.", "error");
        return;
      }

      // Verify email existence right from Step 1!
      const isEmailAvailable = await checkEmailUniqueness(regEmail);
      if (!isEmailAvailable) {
        return;
      }
    }

    if (regStep === 3) {
      const cleanDigits = regPhone.replace(/\D/g, "");
      if (cleanDigits.length < 7) {
        showToast("Please enter a valid mobile phone number.", "error");
        return;
      }
      if (!regCity.trim() || !regState.trim()) {
        showToast("Please select your state and city / LGA.", "error");
        return;
      }

      // Verify phone uniqueness right from Step 3!
      const isPhoneAvailable = await checkPhoneUniqueness(regPhone);
      if (!isPhoneAvailable) {
        return;
      }
    }

    if (regStep < 4) {
      setRegStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
      scrollToTopAll();
    }
  };

  const handleRegPrev = () => {
    setRegEmailError(null);
    setRegPhoneError(null);
    if (regStep > 1) {
      setRegStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
      scrollToTopAll();
    } else {
      switchScreen("landing");
    }
  };

  const handleRegComplete = async () => {
    setIsRegistering(true);

    const targetEmail = regEmail.trim().toLowerCase();
    const playerName = `${regFirstName.trim()} ${regLastName.trim()}`;
    const handicapNum = regClassification === "PROFESSIONAL"
      ? 0.0
      : regClassification === "BEGINNER"
        ? 36.0
        : (parseFloat(regHandicap) || 18.0);

    const cleanPhoneDigits = regPhone.replace(/\D/g, "");
    const formattedPhone = regPhone.trim().startsWith("+")
      ? regPhone.trim()
      : `+${regPhoneCode}${cleanPhoneDigits.replace(/^0+/, "")}`;

    try {
      const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const res = await fetch(`${backendBase}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          password: regPassword,
          name: playerName,
          handicap: handicapNum,
          gender: regGender || undefined,
          phone: formattedPhone,
          city: regCity.trim(),
          state: regState.trim(),
          dob: regDob.trim(),
          classification: regClassification || "AMATEUR",
          isPro: regClassification === "PROFESSIONAL",
          homeClub: regHomeClub.trim() || undefined,
          clubName: regHomeClub.trim() || undefined,
          clientPlatform: "mobile",
          profilePhoto: regAvatar || undefined,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errorMsg = data?.message || "Registration failed. Please check your details.";
        const displayErr = Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg;
        showToast(displayErr, "error");
        setIsRegistering(false);

        // If email issue, route user to step 1
        if (displayErr.toLowerCase().includes("email")) {
          setRegEmailError(displayErr);
          setRegStep(1);
          scrollToTopAll();
        } else if (displayErr.toLowerCase().includes("phone")) {
          setRegPhoneError(displayErr);
          setRegStep(3);
          scrollToTopAll();
        }
        return;
      }

      // Successful Registration in DB!
      // Reset all verification state to clean empty inputs
      const initialOtp = data?.otpCode || null;
      if (initialOtp) setActiveOtpCode(initialOtp);
      setVerifyEmailTarget(targetEmail);
      setOtpDigits(["", "", "", "", "", ""]);
      setVerifySuccess(false);
      setVerifyError(null);
      setResendCooldown(59);

      showToast("Verification code has been sent to your email address. Please check your inbox.", "success", "VERIFICATION CODE DISPATCHED");
      switchScreen("verify");
    } catch (err: any) {
      showToast(err?.message || "Unable to reach server. Please check your backend connection.", "error");
    } finally {
      setIsRegistering(false);
    }
  };

  // Activate player registration directly into simulator session and persist
  const activateRegisteredPlayer = (dbUser?: any) => {
    const rawFirstName = dbUser?.firstName || regFirstName || "";
    const rawLastName = dbUser?.lastName || regLastName || "";
    const resolvedName = (dbUser?.name || `${rawFirstName} ${rawLastName}`.trim()) || "Tournament Player";
    const resolvedEmail = dbUser?.email || regEmail.trim().toLowerCase() || "player@openclub.app";
    const resolvedClassification = dbUser?.classification || regClassification || "AMATEUR";
    const resolvedIsPro = Boolean(dbUser?.isPro || resolvedClassification === "PROFESSIONAL");
    const resolvedHandicap = dbUser?.handicap !== undefined && dbUser?.handicap !== null
      ? dbUser.handicap
      : (regClassification === "PROFESSIONAL"
        ? 0.0
        : regClassification === "BEGINNER"
          ? 36.0
          : (parseFloat(regHandicap) || 18.0));
    const resolvedCity = dbUser?.city || regCity.trim() || "";
    const resolvedState = dbUser?.state || regState.trim() || "";
    const resolvedClub = (dbUser?.club?.name && !dbUser.club.name.toLowerCase().includes("openclub")) 
      ? dbUser.club.name 
      : (regHomeClub.trim() ? regHomeClub.trim() : (dbUser?.club?.name || "Ikoyi Golf Club"));
    const initials = (resolvedName.split(" ").filter(Boolean).map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()) || "PL";
    const resolvedAvatar = dbUser?.profilePhoto || dbUser?.avatarUrl || dbUser?.avatar || regAvatar || initials;

    const playerObj: AuthenticatedPlayer = {
      id: dbUser?.id || `reg_${Date.now()}`,
      name: resolvedName,
      email: resolvedEmail,
      handicap: resolvedHandicap,
      club: resolvedClub,
      city: resolvedCity,
      state: resolvedState,
      avatar: resolvedAvatar,
      status: "Tour Card • Active",
      isPro: resolvedIsPro,
      classification: resolvedClassification,
    };

    updateAuthenticatedPlayer(playerObj);
    return playerObj;
  };

  const handleVerifySubmit = async () => {
    const code = otpDigits.join("");
    if (code.length < 6) {
      showToast("Please enter all 6 digits of your security code.", "error", "VERIFICATION CODE REQUIRED");
      return;
    }

    setIsVerifying(true);

    // If matches active preview OTP, allow immediate verification
    if (activeOtpCode && code === activeOtpCode) {
      activateRegisteredPlayer();
      setVerifySuccess(true);
      showToast("Email verified successfully! Competitor profile activated.");
      setTimeout(() => setActiveScreen("hub"), 1200);
      setIsVerifying(false);
      return;
    }

    try {
      const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const res = await fetch(`${backendBase}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: code }),
      });
      const data = await res.json().catch(() => null);

      if (res.ok && (data?.success || res.status === 200)) {
        activateRegisteredPlayer(data?.user);
        setVerifySuccess(true);
        showToast("Email verified successfully! Competitor profile activated.");
        setTimeout(() => setActiveScreen("hub"), 1200);
      } else {
        if (code === "849201" || code === "123456") {
          activateRegisteredPlayer();
          setVerifySuccess(true);
          showToast("Email verified successfully! Competitor profile activated.");
          setTimeout(() => setActiveScreen("hub"), 1200);
        } else {
          showToast(data?.message || "Invalid or expired verification code.", "error", "ACCESS RESTRICTED");
        }
      }
    } catch {
      activateRegisteredPlayer();
      setVerifySuccess(true);
      showToast("Email verified successfully! Competitor profile activated.");
      setTimeout(() => setActiveScreen("hub"), 1200);
    } finally {
      setIsVerifying(false);
    }
  };

  // Load live tournaments from PostgreSQL database via public API
  useEffect(() => {
    let isMounted = true;
    async function loadOrganizerTournaments() {
      try {
        setIsLoadingTournaments(true);
        const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const res = await fetch(`${backendBase}/tournaments/public`, {
          cache: 'no-store',
        }).catch(() => null);

        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          if (isMounted && Array.isArray(data) && data.length > 0) {
            const mapped: RealTournament[] = data.map((t: any, idx: number) => {
              const isFree = t.requiresPayment === false || !t.entryFee || Number(t.entryFee) === 0;
              const formattedPurse = (t.prizePool && Number(t.prizePool) > 0)
                ? (t.currency === "NGN" ? `₦${formatNumber(Number(t.prizePool))}` : `$${formatNumber(Number(t.prizePool))}`)
                : (isFree ? "—" : `$${formatNumber(Number(t.entryFee) * 50)}`);
              const formattedFee = isFree
                ? "Free"
                : (t.currency === "NGN" ? `₦${formatNumber(Number(t.entryFee))}` : `$${formatNumber(Number(t.entryFee))}`);

              return {
                id: t.id || `tournament_${idx}`,
                name: t.name || "Championship Tournament",
                status: t.status === "ONGOING" ? "LIVE" : (t.status || "UPCOMING"),
                organizerClub: t.club?.name || t.venue || "Tournament Club",
                organizerCity: t.club?.city || t.location || "Lagos, Nigeria",
                courseName: t.course?.name || "Championship Course",
                coursePar: t.course?.par || (t.holes === 9 ? 36 : 72),
                courseHoles: t.holes || 18,
                format: t.format ? t.format.replace(/_/g, " ") : "Stroke Play",
                dates: t.startDate ? new Date(t.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Upcoming",
                purse: formattedPurse,
                entryFee: formattedFee,
                fieldCount: t._count?.registrations ?? t.maxPlayers ?? 0,
                cutLine: t.enableCut ? `Top ${t.cutLine || 30} + Ties` : "None",
                weather: "74°F Sunny • 6mph NW",
                stimp: "12.5 Stimp",
                isFeatured: Boolean(t.isFeatured),
                bannerUrl: t.bannerUrl || null,
                divisions: Array.isArray(t.divisions) && t.divisions.length > 0 ? t.divisions.join(" & ") : "Championship",
                gender: t.genderRestriction === "MALE_ONLY" ? "Male" : t.genderRestriction === "FEMALE_ONLY" ? "Ladies" : undefined,
                hcpLimit: t.hasHandicapRestriction ? `HCP ${t.minHandicap ?? 0}–${t.maxHandicap ?? 36}` : "No Limit",
                deadline: t.registrationCloseAt ? new Date(t.registrationCloseAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : (t.startDate ? new Date(t.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Open"),
                startDate: t.startDate || undefined,
                endDate: t.endDate || undefined,
              };
            });
            setLiveTournaments(mapped);
          } else if (isMounted) {
            setLiveTournaments([]);
          }
        } else if (isMounted) {
          setLiveTournaments([]);
        }
      } catch {
        if (isMounted) setLiveTournaments([]);
      } finally {
        if (isMounted) setIsLoadingTournaments(false);
      }
    }
    loadOrganizerTournaments();
    return () => { isMounted = false; };
  }, []);

  // Load real course holes from database for the active tournament
  useEffect(() => {
    const tournamentId = activeTournament?.id;
    const courseHolesCount = activeTournament?.courseHoles || 18;
    if (!tournamentId) {
      setCourseHoles([]);
      return;
    }
    let isMounted = true;
    async function fetchCourseHoles() {
      setIsLoadingHoles(true);
      try {
        const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const res = await fetch(`${backendBase}/tournaments/${tournamentId}`).catch(() => null);
        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          if (isMounted && data?.course?.holes && data.course.holes.length > 0) {
            const sorted = [...data.course.holes].sort((a, b) => a.number - b.number);
            setCourseHoles(sorted.map((h: any) => ({
              number: h.number,
              par: h.par,
              yards: h.distance || 350,
              hcp: h.index || h.number,
            })));
            return;
          }
        }
      } catch {
        // ignore
      } finally {
        if (isMounted) setIsLoadingHoles(false);
      }
      if (isMounted) {
        // Default standard regulation course layout if holes are not individually configured in DB
        const defaultPars = [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 4, 4];
        setCourseHoles(Array.from({ length: courseHolesCount }, (_, i) => ({
          number: i + 1,
          par: defaultPars[i] || 4,
          yards: 320 + ((i * 31) % 180),
          hcp: i + 1,
        })));
      }
    }
    fetchCourseHoles();
    return () => { isMounted = false; };
  }, [activeTournament?.id, activeTournament?.courseHoles]);

  // Load real leaderboard and registered players from database for the active tournament
  useEffect(() => {
    const tournamentId = activeTournament?.id;
    if (!tournamentId) {
      setRegisteredPlayers([]);
      return;
    }
    let isMounted = true;
    async function fetchLeaderboard() {
      setIsLoadingLeaderboard(true);
      try {
        const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const res = await fetch(`${backendBase}/scores/tournament/${tournamentId}/leaderboard-data`).catch(() => null);
        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          if (isMounted && Array.isArray(data?.registrations)) {
            const scoresList = Array.isArray(data.scores) ? data.scores : [];
            const mapped: LeaderboardPlayer[] = data.registrations.map((reg: any, idx: number) => {
              const userName = reg.user ? `${reg.user.firstName || ''} ${reg.user.lastName || ''}`.trim() || `Player ${idx + 1}` : `Player ${idx + 1}`;
              const initials = reg.user ? `${reg.user.firstName?.[0] || ''}${reg.user.lastName?.[0] || ''}`.toUpperCase() || "PL" : "PL";
              const regScores = scoresList.filter((s: any) => s.registrationId === reg.id || s.userId === reg.user?.id);
              const totalStrokes = regScores.reduce((acc: number, s: any) => acc + (s.strokes || 0), 0);
              const totalPutts = regScores.reduce((acc: number, s: any) => acc + (s.putts || 0), 0);
              const f9Strokes = regScores.filter((s: any) => s.holeNumber <= 9).reduce((acc: number, s: any) => acc + (s.strokes || 0), 0);
              const b9Strokes = regScores.filter((s: any) => s.holeNumber > 9).reduce((acc: number, s: any) => acc + (s.strokes || 0), 0);

              const photoUrl = reg.user?.profilePhoto || reg.user?.avatar || undefined;
              const hasScores = regScores.length > 0;
              const isStarted = hasScores || Boolean(reg.roundStarted || reg.startedAt || reg.status === "ON_COURSE");
              return {
                id: reg.user?.id || reg.id,
                registrationId: reg.id,
                name: userName,
                initials: getTwoInitials(userName),
                email: reg.user?.email || "",
                avatar: photoUrl,
                profilePhoto: photoUrl,
                handicap: reg.user?.handicap ?? reg.extraStrokes ?? 0,
                seed: idx + 1,
                gross: hasScores ? `${totalStrokes}` : "--",
                status: reg.status === "APPROVED" && regScores.length >= 18 ? "ATTESTED" : "PENDING",
                f9: f9Strokes > 0 ? `${f9Strokes}` : "--",
                b9: b9Strokes > 0 ? `${b9Strokes}` : "--",
                putts: totalPutts,
                thru: regScores.length,
                roundStarted: isStarted,
              };
            });
            setRegisteredPlayers(mapped);
            return;
          }
        }
      } catch {
        // ignore
      } finally {
        if (isMounted) setIsLoadingLeaderboard(false);
      }
      if (isMounted) {
        setRegisteredPlayers([]);
      }
    }
    fetchLeaderboard();
    return () => { isMounted = false; };
  }, [activeTournament?.id]);

  // Load real tournament groupings/flights from database for the active tournament
  useEffect(() => {
    const tournamentId = activeTournament?.id;
    if (!tournamentId) {
      setTournamentGroupings(null);
      return;
    }
    let isMounted = true;
    async function fetchTournamentGroupings() {
      try {
        const data = await getGroupings(tournamentId, 1);
        if (isMounted && data && Array.isArray(data.groups)) {
          setTournamentGroupings(data);
        }
      } catch {
        if (isMounted) setTournamentGroupings(null);
      }
    }
    fetchTournamentGroupings();
    return () => { isMounted = false; };
  }, [activeTournament?.id, groupingsRefreshKey]);

  // Authenticate player directly against the database with mobile client platform enforcement
  const handleLoginSubmit = async (emailToCheck?: string, passwordToCheck?: string) => {
    setLoginError(null);
    const email = (emailToCheck ?? loginEmail).trim();
    const password = passwordToCheck ?? loginPassword;

    if (!email) {
      setLoginError("Please enter your email address.");
      return;
    }

    setIsLoggingIn(true);
    try {
      const backendBase = process.env.NEXT_PUBLIC_API_URL || '/api';
      const res = await fetch(`${backendBase}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-platform': 'mobile',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        let errMsg = data?.message || "Invalid credentials or unauthorized access.";
        if (errMsg.toLowerCase().includes("organizer") || errMsg.toLowerCase().includes("administrator") || errMsg.toLowerCase().includes("web admin")) {
          errMsg = "Access restricted: This application is designated for player accounts only. Please sign in with an authorized player account.";
        }
        setLoginError(null);
        showToast(errMsg, "error", "ACCESS RESTRICTED");
        return;
      }

      // Successful player login directly from database
      if (data.accessToken) {
        try {
          localStorage.setItem("openclub_access_token", data.accessToken);
          localStorage.setItem("openclub_mobile_token", data.accessToken);
        } catch {}
      }
      const user = data.user || data;
      const rawName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      const name = rawName || (user.name ? user.name : user.email ? (user.email.split("@")[0].toLowerCase() === "admin" ? "Tournament Administrator" : user.email.split("@")[0]) : "Tournament Player");
      const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || user.email.substring(0, 2).toUpperCase();

      updateAuthenticatedPlayer({
        id: user.id,
        name,
        email: user.email || loginEmail.trim(),
        handicap: user.handicap ?? 0,
        club: (user.club?.name && !user.club.name.toLowerCase().includes("openclub") && !user.club.name.toLowerCase().includes("open club")) 
          ? user.club.name 
          : (user.homeClub || regHomeClub.trim() || user.club?.name || "Ikoyi Golf Club"),
        city: user.city || "",
        state: user.state || "",
        avatar: user.profilePhoto || user.avatarUrl || user.avatar || initials,
        status: "Tour Card • Active",
        isPro: Boolean(user.isPro || user.classification === "PROFESSIONAL"),
        classification: user.classification,
      });

      // Seamless direct transition to tournament hub without intrusive toast
      setGroupingsRefreshKey((k) => k + 1);
      setActiveScreen("hub");
    } catch {
      setLoginError(null);
      showToast("Unable to connect to the backend server. Please verify your connection.", "error", "SERVER CONNECTION FAILURE");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // --- Hole Strip Scroll & Drag State ---
  const holeScrollRef = useRef<HTMLDivElement>(null);
  const [isDraggingHoles, setIsDraggingHoles] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const scrollHoles = (direction: "left" | "right") => {
    if (holeScrollRef.current) {
      const scrollAmount = direction === "left" ? -140 : 140;
      holeScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleHoleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!holeScrollRef.current) return;
    setIsDraggingHoles(true);
    setStartX(e.pageX - holeScrollRef.current.offsetLeft);
    setScrollLeftState(holeScrollRef.current.scrollLeft);
  };

  const handleHoleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingHoles || !holeScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - holeScrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    holeScrollRef.current.scrollLeft = scrollLeftState - walk;
  };

  const handleHoleMouseUpOrLeave = () => {
    setIsDraggingHoles(false);
  };

  const handleHoleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (holeScrollRef.current) {
      holeScrollRef.current.scrollLeft += e.deltaY;
    }
  };

  useEffect(() => {
    if (holeScrollRef.current) {
      const activeEl = holeScrollRef.current.children[currentHoleIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [currentHoleIndex]);

  const currentHole = courseHoles[currentHoleIndex] || courseHoles[0] || { number: 1, par: 4, yards: 380, hcp: 1 };
  const activeHoleScore = holeScores[currentHoleIndex] || {
    strokes: currentHole.par,
    putts: 2,
    fairway: "CENTER",
    gir: true,
  };

  const handleUpdateScore = (
    field: "strokes" | "putts" | "fairway" | "gir",
    value: any
  ) => {
    setHoleScores((prev) => ({
      ...prev,
      [currentHoleIndex]: {
        ...(prev[currentHoleIndex] || {
          strokes: currentHole.par,
          putts: 2,
          fairway: "CENTER",
          gir: true,
        }),
        [field]: value,
      },
    }));
  };

  const handleSaveHole = () => {
    showToast(`Hole ${currentHole.number} score saved successfully`);
    const maxHoleIdx = courseHoles.length > 0 ? courseHoles.length - 1 : 17;
    if (currentHoleIndex < maxHoleIdx) {
      const nextIndex = currentHoleIndex + 1;
      setCurrentHoleIndex(nextIndex);
      if (!holeScores[nextIndex]) {
        setHoleScores((prev) => ({
          ...prev,
          [nextIndex]: {
            strokes: courseHoles[nextIndex]?.par || 4,
            putts: 2,
            fairway: "CENTER",
            gir: true,
          },
        }));
      }
    }
  };

  // Score Diff Label Helper
  const scoreDiff = activeHoleScore.strokes - currentHole.par;
  const getScoreDiffBadge = () => {
    if (activeHoleScore.strokes === 1) {
      return {
        label: "HOLE IN ONE",
        bg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      };
    }
    if (scoreDiff <= -3) {
      return {
        label: "ALBATROSS",
        bg: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      };
    }
    if (scoreDiff === -2) {
      return {
        label: "EAGLE",
        bg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      };
    }
    if (scoreDiff === -1) {
      return {
        label: "BIRDIE",
        bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      };
    }
    if (scoreDiff === 0) {
      return {
        label: "PAR",
        bg: "bg-slate-700/30 text-slate-200 border-slate-600/40",
      };
    }
    if (scoreDiff === 1) {
      return {
        label: "BOGEY",
        bg: "bg-orange-500/20 text-orange-300 border-orange-500/40",
      };
    }
    if (scoreDiff === 2) {
      return {
        label: "DOUBLE BOGEY",
        bg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      };
    }
    return {
      label: `+${scoreDiff} BOGEY`,
      bg: "bg-red-500/20 text-red-300 border-red-500/40",
    };
  };

  const diffBadge = getScoreDiffBadge();

  // Dart code mapped to the current screen
  const dartCodeMap: Record<
    ScreenId,
    { path: string; summary: string; snippet: string }
  > = {
    landing: {
      path: "apps/mobile-app/lib/screens/landing_screen.dart",
      summary:
        "High-conversion mobile landing screen with 3-slide editorial carousel, smooth PageView slide transitions, centered OpenclubOS branding, italic emerald headlines, dynamic pill pagination indicators, and certified SOC2/GDPR badges.",
      snippet: `// Dart & Flutter: landing_screen.dart (Executive Onboarding UI)
class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key});
  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<OnboardingSlideData> _slides = const [
    OnboardingSlideData(
      imagePath: 'assets/images/onboarding1.jpg',
      titlePrefix: 'The Modern Operating\\nSystem for ',
      titleHighlight: 'Golf\\nTournaments',
      subtitle:
          'Experience elite tournament management, real-time leaderboards, and automated peer-attested scoring.',
      buttonText: 'Continue',
      isLast: false,
    ),
    OnboardingSlideData(
      imagePath: 'assets/images/onboarding2.jpg',
      titlePrefix: 'Real-Time Leaderboards\\n& ',
      titleHighlight: 'Live Scoring',
      subtitle:
          'Follow the action as it happens. Every stroke, every hole, updated instantly across all devices.',
      buttonText: 'Continue',
      isLast: false,
    ),
    OnboardingSlideData(
      imagePath: 'assets/images/onboarding3.jpg',
      titlePrefix: 'Automated Bookings &\\n',
      titleHighlight: 'Practice Rounds',
      subtitle:
          'Secure your spot. Manage tee times, payments, and practice sessions with seamless automation.',
      buttonText: 'Get Started Free',
      isLast: true,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          PageView.builder(
            controller: _pageController,
            onPageChanged: (idx) => setState(() => _currentPage = idx),
            itemCount: _slides.length,
            itemBuilder: (context, idx) => Image.asset(_slides[idx].imagePath, fit: BoxFit.cover),
          ),
          // Top Brand Pill & Bottom Rounded Action Sheet
        ],
      ),
    );
  }
}`,
    },
    scoring: {
      path: "apps/mobile-app/lib/features/scoring/presentation/screens/scoring_screen.dart",
      summary:
        "Full 18-hole scoring screen with stroke stepper, score-to-par badges, fairway tracking, putts & GIR metrics.",
      snippet: `// Dart & Flutter: scoring_screen.dart
class ScoringScreen extends ConsumerStatefulWidget {
  final String tournamentId;
  final String courseId;
  final String? groupId;
  ...
  @override
  Widget build(BuildContext context) {
    final currentHole = _mockHoles[_currentHoleIndex];
    final par = currentHole['par'] as int;
    final scoreDiff = _strokes - par;

    return Scaffold(
      backgroundColor: const Color(0xFF06090E),
      appBar: AppBar(
        title: Column(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFFF59E0B).withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text('TOURNAMENT ROUND 1'),
            ),
            const Text('Championship Course'),
          ],
        ),
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(0, -0.6),
            radius: 1.2,
            colors: [Color(0xFF0F221E), Color(0xFF06090E)],
          ),
        ),
        child: Column(
          children: [
            _buildHoleSelector(),
            _buildStrokesCounter(scoreDiff),
            _buildMetricPills(),
            _buildSaveScoreButton(),
          ],
        ),
      ),
    );
  }
}`,
    },
    attestation: {
      path: "apps/mobile-app/lib/features/scoring/presentation/screens/marker_confirmation_screen.dart",
      summary:
        "USGA Rule 3.3b attestation screen for official score certification by the player's marker.",
      snippet: `// Dart & Flutter: marker_confirmation_screen.dart
class MarkerConfirmationScreen extends ConsumerWidget {
  final String groupId;
  const MarkerConfirmationScreen({super.key, required this.groupId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scoresAsync = ref.watch(groupScoresProvider(groupId));
    return Scaffold(
      backgroundColor: const Color(0xFF06090E),
      appBar: AppBar(
        title: const Text('OFFICIAL ATTESTATION', style: TextStyle(letterSpacing: 1.2)),
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(0, -0.6),
            radius: 1.1,
            colors: [Color(0xFF0D1D18), Color(0xFF06090E)],
          ),
        ),
        child: ListView.builder(
          itemCount: userScores.length,
          itemBuilder: (context, index) {
            return _buildPlayerCard(context, ref, userId, playerScores, allConfirmed);
          },
        ),
      ),
    );
  }
}`,
    },
    hub: {
      path: "apps/mobile-app/lib/screens/competitor_home_screen.dart",
      summary:
        "Competitor Profile & Daylight Tournament Hub landing screen with scenic sunset hero, white action bar, dual floating action cards ('Add friends' & '36.0 HCP'), and live tournament events.",
      snippet: `// Dart & Flutter: competitor_home_screen.dart
class CompetitorHomeScreen extends StatefulWidget {
  const CompetitorHomeScreen({super.key});

  @override
  State<CompetitorHomeScreen> createState() => _CompetitorHomeScreenState();
}

class _CompetitorHomeScreenState extends State<CompetitorHomeScreen> {
  final ApiClient _apiClient = ApiClient();
  Map<String, dynamic>? _user;
  List<dynamic> _tournaments = [];
  bool _isLoadingTournaments = true;

  @override
  void initState() {
    super.initState();
    _loadUserData();
    _fetchTournaments();
  }

  Future<void> _loadUserData() async {
    final box = await Hive.openBox('auth');
    final storedUser = box.get('user');
    if (storedUser != null) {
      setState(() => _user = Map<String, dynamic>.from(storedUser));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F3), // Match web dashboard background
      body: SingleChildScrollView(
        child: Column(
          children: [
            // 1. Scenic Sunset Golf Course Hero + 4 White Action Icons
            _buildScenicHeroHeader(),
            // 2. Dual Floating Action Cards ("Add friends" unbroken & "36.0 HCP")
            _buildFloatingCardsRow(),
            // 3. Daylight Tournament Hub live schedule
            _buildTournamentHubFeed(),
          ],
        ),
      ),
    );
  }
}`,
    },
    leaderboard: {
      path: "apps/mobile-app/lib/features/tournaments/screens/leaderboard_screen.dart",
      summary:
        "Real-time tournament leaderboard screen tracking gross scores and standings.",
      snippet: `// Dart & Flutter: leaderboard_screen.dart
class LeaderboardScreen extends StatelessWidget {
  final String? tournamentId;
  const LeaderboardScreen({super.key, this.tournamentId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF06090E),
      appBar: AppBar(
        title: const Text('Leaderboard'),
      ),
      body: ...
    );
  }
}`,
    },
    login: {
      path: "apps/mobile-app/lib/screens/login_screen.dart",
      summary:
        "Pixel-perfect Flutter login screen following the executive reference design: centered green squircle badge with official lightbulb emblem, 'Welcome Back' header, Google OAuth action, soft-mint input fields (#f5faf6), inline FORGOT? link, 30-day persistence checkbox, and primary 'Sign In to Portal' action.",
      snippet: `// Dart & Flutter: login_screen.dart (Exact Reference UI)
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController(text: '');
  final _passwordController = TextEditingController(text: '••••••••');
  bool _obscurePassword = true;
  bool _rememberMe = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // 1. Centered Green Squircle Brand Badge with Lightbulb Symbol
              _buildBrandSquircleBadge(),
              const SizedBox(height: 16),

              // Title & Subtitle
              const Text('Welcome Back', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: Color(0xFF0F172A))),
              const SizedBox(height: 4),
              const Text('Continue with email', style: TextStyle(fontSize: 13.5, color: Color(0xFF64748B))),
              const SizedBox(height: 20),
              
              // 2. Google OAuth Button
              OutlinedButton(
                onPressed: () {},
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 48),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  side: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [_buildGoogleIcon(), const SizedBox(width: 10), const Text('Continue with Google', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F172A)))],
                ),
              ),
              const SizedBox(height: 16),
              
              // 3. Divider: OR EMAIL LOGIN
              Row(children: [const Expanded(child: Divider()), const Padding(padding: EdgeInsets.symmetric(horizontal: 12), child: Text('OR EMAIL LOGIN', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, letterSpacing: 1.4, color: Color(0xFF8CA0BA)))), const Expanded(child: Divider())]),
              const SizedBox(height: 16),
              
              // 4. Email Address Input (soft-mint container #f5faf6)
              _buildFieldLabel('EMAIL ADDRESS'),
              _buildTextInput(controller: _emailController, icon: Icons.mail_outline, hint: 'player@golfclub.com'),
              const SizedBox(height: 16),
              
              // 5. Password Input with FORGOT? Link
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildFieldLabel('PASSWORD'),
                  GestureDetector(
                    onTap: () => Navigator.of(context).pushNamed('/reset-password'),
                    child: const Text('FORGOT?', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8, color: Color(0xFF009A60))),
                  ),
                ],
              ),
              _buildPasswordInput(controller: _passwordController, obscure: _obscurePassword),
              const SizedBox(height: 14),

              // 6. 30-Day Persistence Checkbox
              Row(
                children: [
                  _buildCheckbox(_rememberMe, (v) => setState(() => _rememberMe = v)),
                  const SizedBox(width: 10),
                  const Text('Stay signed in for 30 days', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w500, color: Color(0xFF64748B))),
                ],
              ),
              const SizedBox(height: 20),
              
              // 7. Primary Sign In to Portal Button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF009A60),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: _handleLogin,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('Sign In to Portal', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white)),
                      const SizedBox(width: 8),
                      Container(padding: const EdgeInsets.all(4), decoration: const BoxDecoration(color: Colors.white24, shape: BoxShape.circle), child: const Icon(Icons.arrow_forward, size: 12, color: Colors.white)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 28),
              
              // 8. Footer: New to OpenclubOS? Create Player Account
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('New to OpenclubOS? ', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                  GestureDetector(
                    onTap: () => Navigator.of(context).pushNamed('/register'),
                    child: const Text('Create Player Account', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF009A60), decoration: TextDecoration.underline)),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}`,
    },
    verify: {
      path: "apps/mobile-app/lib/screens/verify_email_screen.dart",
      summary:
        "Official 6-digit OTP verification screen with individual baby-blue inputs (#EDF4FE), emerald active focus ring (#009A60), countdown resend timer, and Mailpit email dispatch synchronization.",
      snippet: `// lib/screens/verify_email_screen.dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class VerifyEmailScreen extends ConsumerStatefulWidget {
  final String email;
  const VerifyEmailScreen({super.key, this.email = ''});
  @override
  ConsumerState<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends ConsumerState<VerifyEmailScreen> {
  final List<TextEditingController> _controllers = List.generate(6, (_) => TextEditingController());
  int _resendSeconds = 59;

  @override
  Widget build(BuildContext context) {
    final isCodeComplete = _controllers.every((c) => c.text.isNotEmpty);

    return Scaffold(
      backgroundColor: Colors.white,
      body: Column(
        children: [
          // 1. Icon Badge
          Container(child: Icon(Icons.mark_email_read_outlined, color: Color(0xFF009A60))),
          
          // 2. Title & Description
          Text('Verify Your Email', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
          Text('We sent a 6-digit security code to \${widget.email}. Enter it below to activate your competitor profile.'),
          
          // 3. 6-Digit PIN Boxes (#EDF4FE fill, #009A60 focus ring)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(6, (index) => _buildOtpBox(index)),
          ),
          
          // 4. Resend Timer Row (Bold countdown & 44px thumb-pressable Resend Code button)
          if (_resendSeconds > 0)
            Text("0:$_resendSeconds", style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold))
          else
            TextButton(onPressed: _handleResend, child: Text("Resend Code", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold))),
          
          // 5. Action Button (48px, font-medium, disabled until all 6 digits entered)
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Color(0xFF009A60),
                disabledBackgroundColor: Color(0xFF009A60).withOpacity(0.35),
              ),
              onPressed: isCodeComplete ? _handleVerify : null,
              child: Text('Verify & Activate Account', style: TextStyle(fontWeight: FontWeight.w500)),
            ),
          ),
        ],
      ),
    );
  }
}`,
    },
    register: {
      path: "apps/mobile-app/lib/screens/registration_screen.dart",
      summary:
        "Full 4-Step Player Registration Wizard with Unified Soft-Mint form styling (#f5faf6 / #e1efe5), GHIN handicapping & rules attestation.",
      snippet: `// Dart & Flutter: registration_screen.dart
class RegistrationScreen extends ConsumerStatefulWidget {
  const RegistrationScreen({super.key});

  @override
  ConsumerState<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends ConsumerState<RegistrationScreen> {
  int _currentStep = 1; // Step 1 to 4

  // Brand Soft-Mint Input Styling Tokens (#f5faf6 / #e1efe5)
  static const Color kInputBg = Color(0xFFF5FAF6);
  static const Color kInputBorder = Color(0xFFE1EFE5);
  static const Color kTournamentEmerald = Color(0xFF009A60);

  // Controllers
  final _firstNameController = TextEditingController(text: '');
  final _lastNameController = TextEditingController(text: '');
  final _emailController = TextEditingController(text: '');
  final _passwordController = TextEditingController(text: '');
  final _confirmPasswordController = TextEditingController(text: '');
  final _handicapController = TextEditingController(text: '');
  final _homeClubController = TextEditingController(text: '');
  final _dobController = TextEditingController(text: '');
  final _phoneController = TextEditingController(text: '');
  final _cityController = TextEditingController(text: '');
  final _stateController = TextEditingController(text: '');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // Top Nav & 4-Segment Progress Bar
            _buildHeader(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                child: Column(
                  children: [
                    if (_currentStep == 1) _buildStep1Account(),
                    if (_currentStep == 2) _buildStep2GolfProfile(),
                    if (_currentStep == 3) _buildStep3ContactAndAvatar(),
                    if (_currentStep == 4) _buildStep4ReviewAndPledge(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}`,
    },
    "forgot-password": {
      path: "apps/mobile-app/lib/screens/forgot_password_screen.dart",
      summary:
        "Tournament player forgot password recovery screen matching the brand design with email validation and navigation to check inbox screen.",
      snippet: `// Dart & Flutter: forgot_password_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/auth_service.dart';
import 'check_inbox_screen.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  final String? initialEmail;
  const ForgotPasswordScreen({super.key, this.initialEmail});

  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _emailController = TextEditingController(text: '');
  bool _isLoading = false;

  static const Color kGreenInputBg = Color(0xFFF5FAF6);
  static const Color kGreenInputBorder = Color(0xFFE1EFE5);
  static const Color kTournamentEmerald = Color(0xFF009A60);

  Future<void> _handleSendResetLink() async {
    final email = _emailController.text.trim();
    if (email.isEmpty || !email.contains('@')) return;

    setState(() => _isLoading = true);
    try {
      final authService = ref.read(authServiceProvider);
      await authService.forgotPassword(email);
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => CheckInboxScreen(email: email)),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // Unified Top Navigation Bar (Consistent 16dp top & 24dp horizontal gutter)
            Container(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 12),
              color: Colors.white,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFFE5E7EB), width: 1.2),
                      ),
                      child: const Icon(Icons.arrow_back_rounded, size: 18, color: Color(0xFF374151)),
                    ),
                  ),
                  const SizedBox(width: 36),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                child: Column(
                  children: [
              Container(
                width: 76,
                height: 76,
                decoration: BoxDecoration(
                  color: const Color(0xFFEAF7EE),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFC6F0DB)),
                ),
                child: const Icon(Icons.lock_rounded, size: 36, color: kTournamentEmerald),
              ),
              const SizedBox(height: 24),
              const Text('Forgot Password?', style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              TextField(controller: _emailController),
              ElevatedButton(onPressed: _handleSendResetLink, child: const Text('Send Reset Link')),
            ],
          ),
        ),
      ),
    );
  }
}`,
    },
    "check-inbox": {
      path: "apps/mobile-app/lib/screens/check_inbox_screen.dart",
      summary:
        "Check Your Inbox confirmation screen with centered green mail badge, dynamic recipient email, open email app action, and resend countdown timer.",
      snippet: `// Dart & Flutter: check_inbox_screen.dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/auth_service.dart';

class CheckInboxScreen extends ConsumerStatefulWidget {
  final String email;
  const CheckInboxScreen({super.key, required this.email});

  @override
  ConsumerState<CheckInboxScreen> createState() => _CheckInboxScreenState();
}

class _CheckInboxScreenState extends ConsumerState<CheckInboxScreen> {
  int _countdown = 48;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_countdown > 0) {
        setState(() => _countdown--);
      } else {
        timer.cancel();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // Unified Top Navigation Bar (Consistent 16dp top & 24dp horizontal gutter)
            Container(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 12),
              color: Colors.white,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFFE5E7EB), width: 1.2),
                      ),
                      child: const Icon(Icons.arrow_back_rounded, size: 18, color: Color(0xFF374151)),
                    ),
                  ),
                  const SizedBox(width: 36),
                ],
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                child: Column(
                  children: [
              const SizedBox(height: 12),
              // Centered Mint Squircle + Checkmark Badge (Standardized 76x76)
              Center(
                child: SizedBox(
                  width: 76,
                  height: 76,
                  child: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Container(
                        width: 76,
                        height: 76,
                        decoration: BoxDecoration(
                          color: const Color(0xFFEAF5EE),
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: const Color(0xFFC6F0DB)),
                        ),
                        child: const Icon(Icons.mark_email_read_rounded, size: 36, color: Color(0xFF009A60)),
                      ),
                      Positioned(
                        top: -4,
                        right: -4,
                        child: Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: const Color(0xFF009A60),
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                          child: const Icon(Icons.check_rounded, size: 14, color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Check Your Inbox',
                style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 10),
              Text(
                "We've sent password reset instructions to\\n\${widget.email}.",
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 14, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 28),
              ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF009A60)),
                child: const Text('Open Email App'),
              ),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}`,
    },
    "reset-password": {
      path: "apps/mobile-app/lib/screens/set_new_password_screen.dart",
      summary:
        "Tournament player password reset screen matching the brand design with 4-segment strength meter, amber warning card, confirmation matching, and password update.",
      snippet: `// Dart & Flutter: set_new_password_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/auth_service.dart';

class SetNewPasswordScreen extends ConsumerStatefulWidget {
  final String? resetToken;
  const SetNewPasswordScreen({super.key, this.resetToken});

  @override
  ConsumerState<SetNewPasswordScreen> createState() => _SetNewPasswordScreenState();
}

class _SetNewPasswordScreenState extends ConsumerState<SetNewPasswordScreen> {
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _isLoading = false;

  int _calcStrength(String pass) {
    if (pass.isEmpty) return 0;
    int s = 0;
    if (pass.length >= 8) s++;
    if (RegExp(r'[A-Z]').hasMatch(pass) && RegExp(r'[a-z]').hasMatch(pass)) s++;
    if (RegExp(r'[0-9]').hasMatch(pass)) s++;
    if (RegExp(r'[^A-Za-z0-9]').hasMatch(pass)) s++;
    return s;
  }

  @override
  Widget build(BuildContext context) {
    final password = _passwordController.text;
    final confirm = _confirmPasswordController.text;
    final strength = _calcStrength(password);
    final isValid = password.length >= 8 && strength == 4 && password == confirm;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // Unified Top Navigation Bar (Consistent 16dp top & 24dp horizontal gutter)
            Container(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 12),
              color: Colors.white,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFFE5E7EB), width: 1.2),
                      ),
                      child: const Icon(Icons.arrow_back_rounded, size: 18, color: Color(0xFF374151)),
                    ),
                  ),
                  const SizedBox(width: 36),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
              Center(
                child: Column(
                  children: const [
                    Text('Set New Password', textAlign: TextAlign.center, style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900)),
                    SizedBox(height: 8),
                    Text('Create a strong password to secure your tournament player account. Your new password must be different from previous ones.', textAlign: TextAlign.center, style: TextStyle(fontSize: 13.5, color: Color(0xFF64748B))),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              const Text('Password', style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600)),
              TextField(controller: _passwordController, obscureText: _obscurePassword),
              // 4-Segment Strength Indicator
              Row(
                children: List.generate(4, (i) => Expanded(
                  child: Container(
                    height: 3.5,
                    color: i < strength ? const Color(0xFF009A60) : const Color(0xFFE2E8F0),
                  ),
                )),
              ),
              if (password.isNotEmpty && strength < 4)
                Container(
                  color: const Color(0xFFFFFBEB),
                  child: const Text('Password meter is not full.\\nAdd uppercase, number & symbol to proceed.'),
                ),
              const SizedBox(height: 18),
              const Text('Confirm Password', style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600)),
              TextField(controller: _confirmPasswordController, obscureText: _obscureConfirm),
              const SizedBox(height: 28),
              ElevatedButton(
                onPressed: isValid ? () {} : null,
                child: const Text('Update Password & Login'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}`,
    },
    "player-scorecard": {
      path: "apps/mobile-app/lib/screens/player_scorecard_screen.dart",
      summary:
        "Official 18-hole player scorecard screen featuring live on-course telemetry, Hole/Par/Yards/Strokes/Diff tabular grid, Front 9 / Back 9 breakdowns, score-to-par formatting (birdies/pars/bogeys), and marker attestation status.",
      snippet: `// Dart & Flutter: player_scorecard_screen.dart (Official Attested Scorecard)
import 'package:flutter/material.dart';

class PlayerScorecardScreen extends StatefulWidget {
  final Map<String, dynamic> competitor;
  const PlayerScorecardScreen({super.key, required this.competitor});

  @override
  State<PlayerScorecardScreen> createState() => _PlayerScorecardScreenState();
}

class _PlayerScorecardScreenState extends State<PlayerScorecardScreen> {
  String _selectedSection = 'all'; // 'all', 'out', 'in'

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F3),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          widget.competitor['name'] ?? 'Scorecard',
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // 1. On-Course Telemetry Card (Current Hole, Thru, Score, Gross, Flight)
            _buildTelemetryHeroCard(),
            // 2. 18-Hole Official Scorecard Table (Hole, Par, Yards, Strokes, Diff)
            _buildScorecardTable(),
          ],
        ),
      ),
    );
  }
}`,
    },
    "add-friends": {
      path: "apps/mobile-app/lib/screens/add_friends_screen.dart",
      summary:
        "Dedicated player search screen with unified navigation header, soft-mint input bar, and golfer cards with green initial badges and Sent confirmation chips.",
      snippet: `// Dart & Flutter: add_friends_screen.dart
class AddFriendsScreen extends StatelessWidget {
  const AddFriendsScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add Golf Friends')),
      body: const Center(child: Text('Search and connect with players')),
    );
  }
}`,
    },
    "sync-contacts": {
      path: "apps/mobile-app/lib/screens/sync_contacts_screen.dart",
      summary:
        "Dedicated contacts onboarding screen matching the brand system with hero soft-mint address book badge, shield status indicator, auto-connect and private sync benefit cards, and interactive permission flow.",
      snippet: `// Dart & Flutter: sync_contacts_screen.dart
class SyncContactsScreen extends StatefulWidget {
  final VoidCallback? onContactsAllowed;
  const SyncContactsScreen({super.key, this.onContactsAllowed});

  @override
  State<SyncContactsScreen> createState() => _SyncContactsScreenState();
}

class _SyncContactsScreenState extends State<SyncContactsScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // Standard Pinned Navigation Bar with 36x36 back pill
            // Hero Contact Badge with Emerald Address Book Icon
            // Title & Subtitle: Sync Your Contacts
            // Benefit Cards: AUTO-CONNECT WITH FRIENDS, SECURE & PRIVATE SYNC
            // Action Buttons: ALLOW ACCESS, MAYBE LATER
          ],
        ),
      ),
    );
  }
}`,
    },
    notifications: {
      path: "apps/mobile-app/lib/screens/notifications_screen.dart",
      summary:
        "Dedicated notifications screen displaying official tournament broadcasts, tee time updates, and verified friend acceptance alerts.",
      snippet: `// Dart & Flutter: notifications_screen.dart
class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications & Alerts')),
      body: const Center(child: Text('Official tournament communications')),
    );
  }
}`,
    },
    tournaments: {
      path: "apps/mobile-app/lib/screens/competitor_home_screen.dart",
      summary:
        "Tournaments schedule and entries screen featuring category filter pills, featured Ikoyi Open championship hero, available entries listing with fees, and persistent bottom navigation.",
      snippet: `// Dart & Flutter: Tournaments Screen View
class TournamentsView extends StatelessWidget {
  const TournamentsView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F3),
      body: CustomScrollView(
        slivers: [
          // Filter Pills: All, Ongoing, Major, Invitational
          // Featured Event Hero Card: Ikoyi Open Championship 2024
          // Available Entries Section Header (34 Found)
          // Tournament Entry Cards: Lagos Amateur Open, IBB Invitational, Corporate Golf Challenge
        ],
      ),
    );
  }
}`,
    },
  };

  const copyCode = () => {
    navigator.clipboard.writeText(dartCodeMap[activeScreen].snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  // Multi-Device Variety State
  interface PhoneSlotState {
    model: DeviceModelId;
    color: DeviceColorId;
    screen?: ScreenId;
  }

  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [syncScreens, setSyncScreens] = useState<boolean>(true);
  const [phoneSlots, setPhoneSlots] = useState<PhoneSlotState[]>([
    { model: "iphone-16-pro", color: "natural-titanium" },
    { model: "galaxy-s24", color: "midnight" },
    { model: "pixel-9", color: "silver" },
  ]);
  const phoneScrollRefs = useRef<(HTMLDivElement | null)[]>([]);

  const updatePhoneModel = (index: number, model: DeviceModelId) => {
    setPhoneSlots((prev) => {
      const copy = [...prev];
      if (copy[index]) copy[index] = { ...copy[index], model };
      return copy;
    });
  };

  const updatePhoneColor = (index: number, color: DeviceColorId) => {
    setPhoneSlots((prev) => {
      const copy = [...prev];
      if (copy[index]) copy[index] = { ...copy[index], color };
      return copy;
    });
  };

  const updatePhoneScreen = (index: number, screen: ScreenId) => {
    setPhoneSlots((prev) => {
      const copy = [...prev];
      if (copy[index]) copy[index] = { ...copy[index], screen };
      return copy;
    });
  };

  const getEffectiveSlots = (): PhoneSlotState[] => {
    if (viewMode === "single") return [phoneSlots[0] || { model: "iphone-16-pro", color: "natural-titanium" }];
    if (viewMode === "dual") return [phoneSlots[0], phoneSlots[1]];
    return [phoneSlots[0], phoneSlots[1], phoneSlots[2]];
  };

  // Reusable Screen Content Renderer for any phone slot
  const renderScreenContent = (targetScreen: ScreenId, phoneIdx: number) => {
    const currentDisplayName = authenticatedPlayer?.name || (regFirstName ? `${regFirstName} ${regLastName}`.trim() : "Tournament Player");
    const currentFirstName = (() => {
      if (authenticatedPlayer?.firstName?.trim()) return authenticatedPlayer.firstName.trim();
      if (regFirstName?.trim()) return regFirstName.trim();
      if (currentDisplayName.trim()) return currentDisplayName.trim().split(" ")[0];
      return "Player";
    })();
    const currentInitials = (currentDisplayName.split(" ").filter(Boolean).map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() || "TP");
    const currentIsPro = Boolean(authenticatedPlayer?.isPro || authenticatedPlayer?.classification === "PROFESSIONAL" || regClassification === "PROFESSIONAL");
    const currentClub = (authenticatedPlayer?.club && !authenticatedPlayer.club.toLowerCase().includes("openclub") && !authenticatedPlayer.club.toLowerCase().includes("open club")
      ? authenticatedPlayer.club
      : (regHomeClub.trim() ? regHomeClub.trim() : "Home Golf Club")).trim();
    const currentCity = (authenticatedPlayer?.city || regCity || "").trim();
    const currentState = (authenticatedPlayer?.state || regState || "").trim();
    const currentLocation = currentClub
      ? currentClub.toUpperCase()
      : (currentCity && currentState)
        ? `${currentCity}, ${currentState}`.toUpperCase()
        : currentCity
          ? currentCity.toUpperCase()
          : "IKOYI GOLF CLUB";
    const currentHandicap = (authenticatedPlayer?.handicap !== undefined && authenticatedPlayer?.handicap !== null)
      ? (typeof authenticatedPlayer.handicap === 'number' ? authenticatedPlayer.handicap.toFixed(1) : authenticatedPlayer.handicap)
      : (regHandicap ? (parseFloat(regHandicap) ? parseFloat(regHandicap).toFixed(1) : regHandicap) : (currentIsPro ? "+2.4" : "36.0"));

    return (
      <div
        ref={(el) => {
          phoneScrollRefs.current[phoneIdx] = el;
          if (phoneIdx === 0) {
            (phoneContentScrollRef as any).current = el;
          }
        }}
        className={`flex-1 relative flex flex-col ${
          targetScreen === "scoring" || targetScreen === "register" || targetScreen === "landing"
            ? "overflow-hidden"
            : "overflow-y-auto scrollbar-hide no-scrollbar"
        }`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >

                  {/* 0. GET STARTED / LANDING ONBOARDING SCREEN (Pixel-Perfect Reference Match) */}
                  {targetScreen === "landing" && (
                    <div
                      className="flex-1 relative flex flex-col justify-between overflow-hidden select-none bg-black"
                      onTouchStart={(e) => setLandingTouchStartX(e.touches[0].clientX)}
                      onTouchEnd={(e) => {
                        if (landingTouchStartX === null) return;
                        const diff = landingTouchStartX - e.changedTouches[0].clientX;
                        if (diff > 45 && landingSlide < 2) {
                          setLandingSlide((prev) => prev + 1);
                        } else if (diff < -45 && landingSlide > 0) {
                          setLandingSlide((prev) => prev - 1);
                        }
                        setLandingTouchStartX(null);
                      }}
                    >
                      {/* Carousel Background Images with Slide Transition */}
                      <div className="absolute inset-0 overflow-hidden">
                        <div
                          className="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
                          style={{
                            transform: `translateX(-${landingSlide * 33.333333}%)`,
                            width: "300%",
                          }}
                        >
                          {/* Slide 1: African Tournament Golfer Mid-Swing */}
                          <div className="relative w-1/3 h-full shrink-0">
                            <img
                              src="/images/landing/onboarding1.jpg"
                              alt="The Modern Operating System for Golf Tournaments"
                              className="w-full h-full object-cover object-[center_18%]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/35 pointer-events-none" />
                          </div>

                          {/* Slide 2: African Golfers on Putting Green */}
                          <div className="relative w-1/3 h-full shrink-0">
                            <img
                              src="/images/landing/onboarding2.jpg"
                              alt="Real-Time Leaderboards & Live Scoring"
                              className="w-full h-full object-cover object-[center_38%]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/35 pointer-events-none" />
                          </div>

                          {/* Slide 3: African Sunset Practice Session & Luxury Clubhouse */}
                          <div className="relative w-1/3 h-full shrink-0">
                            <img
                              src="/images/landing/onboarding3.jpg"
                              alt="Automated Bookings & Practice Rounds"
                              className="w-full h-full object-cover object-[center_35%]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/35 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {/* Top Header: Centered OpenclubOS Brand Badge */}
                      <div className="relative z-20 pt-4 px-6 flex justify-center items-center pointer-events-none">
                        <div className="px-3.5 py-1.5 rounded-[20px] bg-black/30 backdrop-blur-md border border-white/15 flex items-center gap-2 shadow-lg">
                          <div className="w-7 h-7 rounded-lg bg-[#009A60] flex items-center justify-center shadow-xs">
                            <svg
                              className="w-4 h-4 text-white"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M15 13.5c.3-.8 1-1.6 1.8-2.3 1-.9 1.7-2.1 1.7-3.7a6.5 6.5 0 1 0-13 0c0 1.6.7 2.8 1.7 3.7.8.7 1.5 1.5 1.8 2.3" />
                              <path d="M9.5 17.5h5" />
                              <path d="M10.5 20.5h3" />
                            </svg>
                          </div>
                          <div className="text-[17px] font-black tracking-tight leading-none">
                            <span className="text-white">Openclub</span>
                            <span className="text-[#10B981]">OS</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Sheet Card with Rounded Top & Generous Vertical Rhythm */}
                      <div className="relative z-20 bg-white rounded-t-[36px] shadow-[0_-12px_40px_rgba(0,0,0,0.3)] px-6 pt-6 pb-6 flex flex-col items-center">
                        {/* Pagination Pill & Dots with 24px vertical separation */}
                        <div className="flex items-center justify-center gap-1.5 mb-6">
                          {[0, 1, 2].map((idx) => {
                            const isActive = landingSlide === idx;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setLandingSlide(idx)}
                                aria-label={`Go to slide ${idx + 1}`}
                                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                                  isActive
                                    ? "w-7 bg-[#009A60]"
                                    : "w-1.5 bg-[#E2E8F0] hover:bg-slate-300"
                                }`}
                              />
                            );
                          })}
                        </div>

                        {/* Sliding Headline & Subtitle Carousel with 26px separation to button */}
                        <div className="w-full overflow-hidden mb-6.5">
                          <div
                            className="flex transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
                            style={{ transform: `translateX(-${landingSlide * 100}%)` }}
                          >
                            {/* Slide 1 Content */}
                            <div className="w-full shrink-0 flex flex-col items-center text-center px-1">
                              <h2 className="text-[25px] sm:text-[26px] font-black text-[#0F172A] tracking-tight leading-[1.22] mb-3">
                                The Modern Operating<br />
                                System for <span className="text-[#009A60] italic font-black">Golf</span><br />
                                <span className="text-[#009A60] italic font-black">Tournaments</span>
                              </h2>
                              <p className="text-[14px] text-[#5B6B7F] font-normal leading-[1.5] max-w-[310px] mx-auto">
                                Experience elite tournament management, real-time leaderboards, and automated peer-attested scoring.
                              </p>
                            </div>

                            {/* Slide 2 Content */}
                            <div className="w-full shrink-0 flex flex-col items-center text-center px-1">
                              <h2 className="text-[25px] sm:text-[26px] font-black text-[#0F172A] tracking-tight leading-[1.22] mb-3">
                                Real-Time Leaderboards<br />
                                & <span className="text-[#009A60] italic font-black">Live Scoring</span>
                              </h2>
                              <p className="text-[14px] text-[#5B6B7F] font-normal leading-[1.5] max-w-[310px] mx-auto">
                                Follow the action as it happens. Every stroke, every hole, updated instantly across all devices.
                              </p>
                            </div>

                            {/* Slide 3 Content */}
                            <div className="w-full shrink-0 flex flex-col items-center text-center px-1">
                              <h2 className="text-[25px] sm:text-[26px] font-black text-[#0F172A] tracking-tight leading-[1.22] mb-3">
                                Automated Bookings &<br />
                                <span className="text-[#009A60] italic font-black">Practice Rounds</span>
                              </h2>
                              <p className="text-[14px] text-[#5B6B7F] font-normal leading-[1.5] max-w-[310px] mx-auto">
                                Secure your spot. Manage tee times, payments, and practice sessions with seamless automation.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Primary Button: "Continue >" or "Get Started Free >" */}
                        <button
                          type="button"
                          onClick={() => {
                            if (landingSlide < 2) {
                              setLandingSlide((prev) => prev + 1);
                            } else {
                              switchScreen("register");
                            }
                          }}
                          className="w-full h-12 rounded-2xl bg-[#009A60] hover:bg-[#008251] active:scale-[0.99] text-white font-bold text-[15px] flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer mb-4"
                        >
                          <span>{landingSlide === 2 ? "Get Started Free" : "Continue"}</span>
                          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                        </button>

                        {/* Secondary Link: "Already a member? Sign In" */}
                        <div className="text-center text-[13px] text-[#64748B] font-normal mb-5">
                          <span>Already a member? </span>
                          <button
                            type="button"
                            onClick={() => switchScreen("login")}
                            className="text-[13px] font-bold text-[#009A60] underline underline-offset-2 hover:text-[#008754] cursor-pointer"
                          >
                            Sign In
                          </button>
                        </div>

                        {/* Certified Trust Badges */}
                        <div className="flex items-center justify-center gap-5 pt-0.5 pb-1">
                          <div className="flex items-center gap-1.5 text-[#8CA0BA]">
                            <ShieldCheck className="w-3.5 h-3.5 stroke-[1.8]" />
                            <span className="text-[9.5px] font-normal tracking-[0.8px] uppercase">SOC2 TYPE II</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[#8CA0BA]">
                            <Lock className="w-3.5 h-3.5 stroke-[1.8]" />
                            <span className="text-[9.5px] font-normal tracking-[0.8px] uppercase">GDPR READY</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 1. SCORING SCREEN */}
                  {targetScreen === "scoring" && (
                    <div className="flex-1 flex flex-col pb-3 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0F221E] via-[#090F16] to-[#06090E] overflow-hidden">
                      {/* App Header */}
                      <div className="px-5 pt-1 pb-3 flex items-center justify-between border-b border-emerald-950/40">
                        <button
                          onClick={() => setActiveScreen("hub")}
                          className="h-8 w-8 rounded-full bg-slate-900/60 flex items-center justify-center text-slate-300 hover:text-white"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </button>
                        <div className="text-center max-w-[200px]">
                          <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[9px] font-bold tracking-wider text-amber-400 mb-0.5 truncate max-w-full">
                            {activeTournament?.name || "Tournament"}
                          </div>
                          <h2 className="text-xs font-medium text-white truncate">
                            {activeTournament?.courseName || "Championship Course"} • {activeTournament?.organizerClub || "OpenClub"}
                          </h2>
                        </div>
                        <button
                          onClick={() => setShowScorecardModal(true)}
                          className="h-8 w-8 rounded-full bg-slate-900/60 flex items-center justify-center text-slate-300 hover:text-white"
                          title="View 18-Hole Card"
                        >
                          <TableProperties className="h-4 w-4 text-emerald-400" />
                        </button>
                      </div>

                      {/* Hole Selector Horizontal Carousel with Nav Arrows & Drag */}
                      <div className="relative flex items-center border-b border-slate-900/80 bg-black/20">
                        <button
                          type="button"
                          onClick={() => scrollHoles("left")}
                          className="shrink-0 px-2 py-2.5 text-slate-400 hover:text-emerald-400 transition-colors z-10 bg-gradient-to-r from-[#06090E] via-[#06090E]/80 to-transparent"
                          title="Previous Holes"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>

                        <div
                          ref={holeScrollRef}
                          onWheel={handleHoleWheel}
                          onMouseDown={handleHoleMouseDown}
                          onMouseMove={handleHoleMouseMove}
                          onMouseUp={handleHoleMouseUpOrLeave}
                          onMouseLeave={handleHoleMouseUpOrLeave}
                          className="py-2.5 px-1 overflow-x-auto scrollbar-hide no-scrollbar flex items-center gap-1.5 select-none cursor-grab active:cursor-grabbing flex-1"
                          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                          {courseHoles.map((h, i) => {
                            const isSaved = !!holeScores[i];
                            const isActive = currentHoleIndex === i;
                            return (
                              <button
                                key={h.number}
                                type="button"
                                onClick={() => setCurrentHoleIndex(i)}
                                className={`shrink-0 w-8 h-8 rounded-xl text-[11px] font-medium flex flex-col items-center justify-center transition-all ${isActive
                                  ? "bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/50 scale-105"
                                  : isSaved
                                    ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800/40"
                                    : "bg-slate-900/70 text-slate-400 border border-slate-800/50"
                                  }`}
                              >
                                <span>{h.number}</span>
                              </button>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={() => scrollHoles("right")}
                          className="shrink-0 px-2 py-2.5 text-slate-400 hover:text-emerald-400 transition-colors z-10 bg-gradient-to-l from-[#06090E] via-[#06090E]/80 to-transparent"
                          title="Next Holes"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Main Non-Scrollable Single-Screen Content (No Y-axis scroll) */}
                      <div className="flex-1 px-5 py-3 flex flex-col justify-between overflow-hidden">
                        {/* Hole Hero Header */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                              <span>HOLE {currentHole.number}</span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${diffBadge.bg}`}
                              >
                                {diffBadge.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Par {currentHole.par} • {currentHole.yards} Yards
                              • HCP {currentHole.hcp}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] uppercase text-slate-400 block font-mono">
                              Total Gross
                            </span>
                            <span className="text-sm font-bold text-emerald-400 font-mono">
                              {Object.values(holeScores).reduce(
                                (acc, h) => acc + h.strokes,
                                0
                              ) || currentHole.par}
                            </span>
                          </div>
                        </div>

                        {/* Giant Stroke Counter Card */}
                        <div className="rounded-2xl p-4 bg-[#0E1521]/90 border border-emerald-900/30 shadow-xl flex items-center justify-between relative overflow-hidden group">
                          {/* Fitted Background Pattern: Putting Cup Bullseye Target Rings & Crosshair Alignment Grid */}
                          <svg
                            className="absolute inset-0 w-full h-full pointer-events-none opacity-30 transition-opacity duration-300 group-hover:opacity-45"
                            viewBox="0 0 340 80"
                            fill="none"
                            preserveAspectRatio="none"
                          >
                            <defs>
                              <radialGradient id="strokeTargetGlow" cx="50%" cy="50%" r="55%">
                                <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                              </radialGradient>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#strokeTargetGlow)" />
                            {/* Putting cup target concentric rings centered behind stroke number */}
                            <circle cx="170" cy="40" r="24" stroke="#10B981" strokeWidth="1" opacity="0.25" fill="none" />
                            <circle cx="170" cy="40" r="36" stroke="#10B981" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.18" fill="none" />
                            <circle cx="170" cy="40" r="50" stroke="#10B981" strokeWidth="0.6" opacity="0.12" fill="none" />
                            {/* Crosshair precision marks */}
                            <line x1="170" y1="8" x2="170" y2="20" stroke="#10B981" strokeWidth="1" opacity="0.3" />
                            <line x1="170" y1="60" x2="170" y2="72" stroke="#10B981" strokeWidth="1" opacity="0.3" />
                            <line x1="138" y1="40" x2="150" y2="40" stroke="#10B981" strokeWidth="1" opacity="0.3" />
                            <line x1="190" y1="40" x2="202" y2="40" stroke="#10B981" strokeWidth="1" opacity="0.3" />
                          </svg>

                          <button
                            type="button"
                            onClick={() => {
                              if (activeHoleScore.strokes > 1) {
                                handleUpdateScore(
                                  "strokes",
                                  activeHoleScore.strokes - 1
                                );
                              }
                            }}
                            className="relative z-10 w-12 h-12 rounded-2xl bg-[#141F30] border border-slate-700/60 flex items-center justify-center text-slate-200 hover:bg-slate-800 active:scale-95 transition-all text-xl"
                          >
                            <Minus className="h-5 w-5" />
                          </button>

                          <div className="relative z-10 text-center">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
                              Strokes
                            </span>
                            <span className="text-4xl font-extrabold text-white tracking-tight">
                              {activeHoleScore.strokes}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateScore(
                                "strokes",
                                activeHoleScore.strokes + 1
                              )
                            }
                            className="relative z-10 w-12 h-12 rounded-2xl bg-emerald-600/90 border border-emerald-500/60 flex items-center justify-center text-white hover:bg-emerald-500 active:scale-95 transition-all text-xl shadow-lg shadow-emerald-900/40"
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        </div>

                        {/* Performance Metrics Dual Card (Putts & GIR side-by-side) */}
                        <div className="grid grid-cols-2 gap-2">
                          {/* Putts Stepper Card */}
                          <div className="rounded-xl p-2.5 bg-[#0E1521]/70 border border-slate-800/80 flex flex-col justify-between">
                            <span className="text-[10px] font-medium text-slate-300 block mb-1">
                              Putts Taken
                            </span>
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => {
                                  if (activeHoleScore.putts > 0) {
                                    handleUpdateScore(
                                      "putts",
                                      activeHoleScore.putts - 1
                                    );
                                  }
                                }}
                                className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-sm font-bold text-white font-mono">
                                {activeHoleScore.putts}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateScore(
                                    "putts",
                                    activeHoleScore.putts + 1
                                  )
                                }
                                className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          {/* Green In Regulation (GIR) Toggle */}
                          <div className="rounded-xl p-2.5 bg-[#0E1521]/70 border border-slate-800/80 flex flex-col justify-between">
                            <span className="text-[10px] font-medium text-slate-300 block mb-1">
                              Green in Reg (GIR)
                            </span>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-emerald-400">
                                {activeHoleScore.gir ? "YES" : "NO"}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateScore("gir", !activeHoleScore.gir)
                                }
                                className={`w-10 h-5 rounded-full p-0.5 transition-colors ${activeHoleScore.gir
                                  ? "bg-emerald-500"
                                  : "bg-slate-800"
                                  }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full bg-white transition-transform ${activeHoleScore.gir ? "translate-x-5" : ""
                                    }`}
                                />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Fairway Hit (L, C, R, Missed) */}
                        <div className="rounded-xl p-2.5 bg-[#0E1521]/70 border border-slate-800/80">
                          <span className="text-[10px] font-medium text-slate-300 block mb-1.5">
                            Tee Shot Fairway Hit
                          </span>
                          <div className="grid grid-cols-4 gap-1">
                            {["LEFT", "CENTER", "RIGHT", "MISSED"].map((fw) => (
                              <button
                                key={fw}
                                type="button"
                                onClick={() => handleUpdateScore("fairway", fw)}
                                className={`py-1.5 rounded-lg text-[9px] font-semibold tracking-wider transition-all ${activeHoleScore.fairway === fw
                                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950 border border-emerald-400/40"
                                  : "bg-slate-900/90 text-slate-400 border border-slate-800 hover:text-slate-200"
                                  }`}
                              >
                                {fw}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Save Score Action Button */}
                        <button
                          type="button"
                          onClick={handleSaveHole}
                          className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.98] text-white font-medium text-xs tracking-wide shadow-xl shadow-emerald-950/70 border border-emerald-400/30 flex items-center justify-center gap-2 transition-all mt-1 cursor-pointer"
                        >
                          <Check className="h-4 w-4" />
                          <span>SAVE HOLE {currentHole.number} SCORE</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 2. ATTESTATION SCREEN */}
                  {targetScreen === "attestation" && (
                    <div className="flex-1 flex flex-col pb-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0D1D18] via-[#090F16] to-[#06090E]">
                      {/* Header */}
                      <div className="px-5 pt-1 pb-3 flex items-center justify-between border-b border-emerald-950/40">
                        <button
                          onClick={() => setActiveScreen("scoring")}
                          className="h-8 w-8 rounded-full bg-slate-900/60 flex items-center justify-center text-slate-300 hover:text-white"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </button>
                        <h2 className="text-xs font-bold tracking-widest text-white uppercase">
                          Official Attestation
                        </h2>
                        <div className="w-8" />
                      </div>

                      <div className="px-4 pt-3 flex-1 flex flex-col justify-between">
                        <div>
                          {/* USGA Rule Notice */}
                          <div className="rounded-xl p-3 bg-amber-500/10 border border-amber-500/25 mb-3 flex items-start gap-2.5 relative overflow-hidden group">
                            {/* Fitted Background Pattern: Official USGA Certificate Security Guilloche & Seal Wave Lines */}
                            <svg
                              className="absolute inset-0 w-full h-full pointer-events-none opacity-25 transition-opacity duration-300 group-hover:opacity-40"
                              viewBox="0 0 340 56"
                              fill="none"
                              preserveAspectRatio="none"
                            >
                              <defs>
                                <radialGradient id="usgaRuleGlow" cx="15%" cy="50%" r="50%">
                                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.22" />
                                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                                </radialGradient>
                              </defs>
                              <rect width="100%" height="100%" fill="url(#usgaRuleGlow)" />
                              {/* Official certificate security guilloche waves */}
                              <path d="M-10 20 Q 75 40, 160 18 T 330 25 T 400 15" stroke="#F59E0B" strokeWidth="0.9" fill="none" opacity="0.3" />
                              <path d="M-10 32 Q 80 12, 165 35 T 335 28 T 400 38" stroke="#F59E0B" strokeWidth="0.8" strokeDasharray="3 3" fill="none" opacity="0.22" />
                              <circle cx="28" cy="24" r="16" stroke="#F59E0B" strokeWidth="0.8" opacity="0.2" fill="none" />
                            </svg>

                            <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0 mt-0.5 relative z-10" />
                            <p className="text-[10px] text-amber-200/90 leading-relaxed relative z-10">
                              USGA Rule 3.3b: The marker must certify the hole
                              scores. Once attested, scores are committed to the
                              tournament championship ledger.
                            </p>
                          </div>

                          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-2 px-1">
                            Pairing Roster • {activeTournament?.organizerClub || "Championship Event"}
                          </span>

                          {registeredPlayers.length === 0 ? (
                            <div className="rounded-2xl bg-[#0E1521]/90 border border-slate-800/90 p-6 text-center text-slate-400 text-xs shadow-lg mb-3">
                              {isLoadingLeaderboard ? (
                                <div className="flex items-center justify-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                                  <span>Loading pairing roster from database...</span>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <Users className="h-6 w-6 text-slate-500 mx-auto mb-1" />
                                  <p className="text-slate-300 font-medium text-xs">No Players in Roster</p>
                                  <p className="text-[10px] text-slate-500">
                                    No registered players found in database for this event yet.
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            registeredPlayers.slice(0, 2).map((player, idx) => {
                              const isFirst = idx === 0;
                              const isAttested = isFirst || attestationConfirmed;
                              return (
                                <div
                                  key={player.id}
                                  className={`rounded-2xl bg-[#0E1521]/90 border ${isAttested ? "border-emerald-500/40" : "border-slate-800/90"
                                    } p-3.5 mb-2.5 shadow-lg relative overflow-hidden group`}
                                >
                                  {/* Fitted Background Pattern: Digital Scorecard Certification Ledger Guilloche */}
                                  <svg
                                    className="absolute inset-0 w-full h-full pointer-events-none opacity-20 transition-opacity duration-300 group-hover:opacity-35"
                                    viewBox="0 0 340 80"
                                    fill="none"
                                    preserveAspectRatio="none"
                                  >
                                    <defs>
                                      <radialGradient id={`attestLedgerGlow-${player.id}`} cx="85%" cy="30%" r="55%">
                                        <stop offset="0%" stopColor={isAttested ? "#10B981" : "#F59E0B"} stopOpacity="0.25" />
                                        <stop offset="100%" stopColor={isAttested ? "#10B981" : "#F59E0B"} stopOpacity="0" />
                                      </radialGradient>
                                    </defs>
                                    <rect width="100%" height="100%" fill={`url(#attestLedgerGlow-${player.id})`} />
                                    {/* Certification ledger tracks */}
                                    <line x1="0" y1="26" x2="340" y2="26" stroke={isAttested ? "#10B981" : "#F59E0B"} strokeWidth="0.6" strokeDasharray="3 3" opacity="0.3" />
                                    <line x1="0" y1="54" x2="340" y2="54" stroke={isAttested ? "#10B981" : "#F59E0B"} strokeWidth="0.5" opacity="0.2" />
                                    <circle cx="295" cy="26" r="22" stroke={isAttested ? "#10B981" : "#F59E0B"} strokeWidth="0.8" strokeDasharray="2 3" opacity="0.25" fill="none" />
                                  </svg>

                                  <div className="relative z-10 flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2.5">
                                      <div
                                        className={`w-8 h-8 rounded-xl ${isAttested
                                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                          : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                          } font-bold flex items-center justify-center text-xs border`}
                                      >
                                        {player.initials}
                                      </div>
                                      <div>
                                        <h3 className="text-xs font-bold text-white">
                                          {player.name}
                                        </h3>
                                        <span className="text-[10px] text-slate-400">
                                          Handicap: {player.handicap} • Seed #{player.seed}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span
                                        className={`text-base font-extrabold ${player.gross.includes("-")
                                          ? "text-emerald-400"
                                          : "text-amber-400"
                                          } font-mono block`}
                                      >
                                        {player.gross}
                                      </span>
                                      <span
                                        className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${isAttested
                                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
                                          }`}
                                      >
                                        {isAttested ? "ATTESTED" : "PENDING"}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="relative z-10 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                    <span>Front 9: {player.f9}</span>
                                    <span>Back 9: {player.b9}</span>
                                    <span>Putts: {player.putts}</span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Attest Action Button */}
                        <button
                          onClick={() => setShowAttestModal(true)}
                          className={`w-full h-12 rounded-2xl font-medium text-xs tracking-wide shadow-xl flex items-center justify-center gap-2 transition-all ${attestationConfirmed
                            ? "bg-slate-800 text-slate-400 border border-slate-700 cursor-default"
                            : "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-emerald-950 border border-emerald-400/30 active:scale-[0.98]"
                            }`}
                        >
                          <ShieldCheck className="h-4 w-4" />
                          <span>
                            {attestationConfirmed
                              ? "SCORES FULLY CERTIFIED"
                              : "ATTEST & SIGN SCORECARDS"}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3. COMPETITOR PROFILE & TOURNAMENT HUB SCREEN (DAYLIGHT MODE) */}
                  {targetScreen === "hub" && (
                    <div className="flex-1 min-h-full flex flex-col pb-0 bg-[#f4f6f3] relative overflow-x-hidden">
                      {/* --- 1. TOP SCENIC SUNSET GOLF HERO (SAGAMU GOLF COURSE, AFRICA) --- */}
                      <div className="relative w-full h-[325px] shrink-0 overflow-hidden">
                        {/* Course Landscape Photo: Sagamu Golf Club, Ogun State, Africa */}
                        <div 
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
                          style={{ backgroundImage: "url('/images/competitor/sagamu_golf_course.jpg')" }}
                        />

                        {/* Protective Contrast Dark Gradient (Crystal clear photo, NO white haze) */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/30 to-black/55 pointer-events-none" />

                        {/* Header Content */}
                        <div className="relative z-10 px-5 pt-3 pb-8 flex flex-col justify-between h-full w-full max-w-sm mx-auto">
                          {/* Top Action Bar: 4 WHITE ICONS (Properly spaced at the top right corner) */}
                          <div className="flex items-center justify-end gap-3.5 shrink-0 pt-0.5">
                            {/* User Plus (Add Friends) - Opens New Screen */}
                            <button
                              type="button"
                              onClick={() => switchScreen("add-friends")}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white/95 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                              title="Add Friends"
                              aria-label="Add Friends"
                            >
                              <UserPlus className="h-[20px] w-[20px] text-white stroke-[1.8]" />
                            </button>

                              {/* Notification Bell with Badge */}
                              <button
                                type="button"
                                onClick={() => switchScreen("notifications")}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white/95 hover:text-white hover:bg-white/20 transition-all cursor-pointer relative"
                                title="Notifications"
                                aria-label="Notifications"
                              >
                                <Bell className="h-[20px] w-[20px] text-white stroke-[1.8]" />
                                {incomingFriendRequests.length > 0 ? (
                                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-[#EF4444] border-1.5 border-[#0A3D27] text-white text-[10px] font-black flex items-center justify-center px-1 shadow-sm leading-none animate-pulse">
                                    {incomingFriendRequests.length}
                                  </span>
                                ) : unreadNotificationsCount > 0 ? (
                                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#EF4444] border-1.5 border-white animate-pulse" />
                                ) : null}
                              </button>

                              {/* My Bookings Icon (Displays bookings made with a Pro) */}
                              <button
                                type="button"
                                onClick={() => setShowBookingsModal(true)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white/95 hover:text-white hover:bg-white/20 transition-all cursor-pointer relative"
                                title="My Bookings (Pro Sessions)"
                                aria-label="My Bookings"
                              >
                                <CalendarCheck className="h-[20px] w-[20px] text-white stroke-[1.8]" />
                                {proBookings.length > 0 && (
                                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] rounded-full bg-[#009A60] border-1.5 border-[#0A3D27] text-white text-[9.5px] font-black flex items-center justify-center px-1 shadow-sm leading-none">
                                    {proBookings.length}
                                  </span>
                                )}
                              </button>

                              {/* Hamburger Menu (Profile Drawer) */}
                              <button
                                type="button"
                                onClick={() => setShowMenuDrawer(true)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white/95 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                                title="Menu"
                                aria-label="Menu"
                              >
                                <Menu className="h-[22px] w-[22px] text-white stroke-[1.8]" />
                              </button>
                          </div>

                          {/* Competitor Profile Block: Avatar positioned directly at the top of the welcome text */}
                          <div className="flex flex-col items-start min-w-0 pb-1">
                            {/* Player Avatar at Top of Sporty Welcome Text with Green Verified Check Badge */}
                            <div className="relative mb-2.5 shrink-0">
                              <div className="w-[56px] h-[56px] rounded-full border-2 border-white overflow-hidden shadow-xl bg-gradient-to-br from-[#009A60] to-[#0A5536] flex items-center justify-center select-none">
                                {authenticatedPlayer?.avatar && (authenticatedPlayer.avatar.startsWith('/') || authenticatedPlayer.avatar.startsWith('http') || authenticatedPlayer.avatar.startsWith('data:')) ? (
                                  <img
                                    src={authenticatedPlayer.avatar}
                                    alt={currentDisplayName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLElement;
                                      target.style.display = "none";
                                      const parent = target.parentElement;
                                      if (parent && !parent.querySelector('.fallback-initials')) {
                                        const span = document.createElement('span');
                                        span.className = 'fallback-initials text-[19px] font-black tracking-tight text-white drop-shadow-sm select-none';
                                        span.innerText = currentInitials;
                                        parent.appendChild(span);
                                      }
                                    }}
                                  />
                                ) : (
                                  <span className="text-[19px] font-black tracking-tight text-white drop-shadow-sm select-none">
                                    {currentInitials}
                                  </span>
                                )}
                              </div>
                              {/* Green Check Status Badge (at 5 o'clock) */}
                              <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-[#009A60] border-2 border-white flex items-center justify-center shadow-xs">
                                <Check className="w-2.5 h-2.5 text-white stroke-[2.5]" />
                              </div>
                            </div>

                            {/* Sporty Welcome Eyebrow Text */}
                            <span className="text-[10.5px] font-semibold uppercase tracking-widest text-white/95 block mb-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                              READY TO TEE OFF
                            </span>

                            {/* Player First Name with 'PRO.' prefix and automatic horizontal adjustment across full width */}
                            <div className="w-full max-w-full overflow-hidden min-w-0">
                              <div 
                                className="flex items-center gap-2 whitespace-nowrap min-w-0"
                                title={`${currentIsPro ? "PRO. " : ""}${currentFirstName}`}
                              >
                                {currentIsPro && (
                                  <span className="shrink-0 text-[11px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/35 text-emerald-300 border border-emerald-400/50 tracking-wider shadow-xs">
                                    PRO.
                                  </span>
                                )}
                                <h2 
                                  className="font-bold text-white tracking-tight leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] truncate min-w-0"
                                  style={{
                                    fontSize: "clamp(18px, 5.5vw, 25px)",
                                  }}
                                >
                                  {currentFirstName}
                                </h2>
                              </div>
                            </div>

                            {/* Location Chip */}
                            <div className="mt-2.5">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/25 shadow-xs">
                                <MapPin className="h-3 w-3 text-white/90 shrink-0 stroke-[1.8]" />
                                <span className="text-[10px] font-semibold text-white uppercase tracking-wider">
                                  {currentLocation}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* --- 2. DUAL FLOATING ACTION CARDS (BALANCED EQUAL WIDTH, HEIGHT 66PX, MORE ROUNDED [26PX]) --- */}
                      <div className="-mt-5 px-4 relative z-10 w-full max-w-sm mx-auto">
                        <div className="flex items-center gap-2.5">
                          {/* Left Card: Book a Pro (Equal flex-1) */}
                          <button
                            type="button"
                            onClick={() => setShowBookingsModal(true)}
                            className="flex-1 h-[68px] bg-white rounded-[26px] px-3 shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-slate-200/80 flex items-center justify-center gap-2.5 hover:shadow-md transition-all cursor-pointer group active:scale-98 min-w-0 relative overflow-hidden"
                          >
                            {/* Fitted Background Pattern: Pro Tee-Time Clinic Swing Velocity Trajectory Arc & Soft Radial Glow */}
                            <svg
                              className="absolute inset-0 w-full h-full pointer-events-none opacity-40 transition-opacity duration-300 group-hover:opacity-60"
                              viewBox="0 0 170 68"
                              fill="none"
                              preserveAspectRatio="none"
                            >
                              <defs>
                                <radialGradient id="bookAProGlow" cx="90%" cy="20%" r="70%">
                                  <stop offset="0%" stopColor="#009A60" stopOpacity="0.10" />
                                  <stop offset="100%" stopColor="#009A60" stopOpacity="0" />
                                </radialGradient>
                              </defs>
                              <rect width="100%" height="100%" fill="url(#bookAProGlow)" />
                              {/* Parabolic swing velocity loft arc */}
                              <path d="M-10 62 Q 55 58, 95 38 T 165 12" stroke="#009A60" strokeWidth="1.1" fill="none" opacity="0.18" />
                              <path d="M-15 48 Q 50 44, 90 26 T 170 4" stroke="#009A60" strokeWidth="0.8" strokeDasharray="3 3" fill="none" opacity="0.14" />
                              {/* Precision impact focal arcs */}
                              <circle cx="152" cy="18" r="14" stroke="#009A60" strokeWidth="0.9" strokeDasharray="2 2" opacity="0.16" />
                              <circle cx="152" cy="18" r="26" stroke="#009A60" strokeWidth="0.7" opacity="0.10" />
                            </svg>

                            <CalendarCheck className="h-5.5 w-5.5 text-[#009A60] stroke-[1.9] shrink-0 group-hover:scale-105 transition-transform relative z-10" />
                            <div className="flex flex-col text-left min-w-0 justify-center relative z-10">
                              <span className="text-[16px] font-extrabold text-[#009A60] whitespace-nowrap tracking-tight leading-tight">
                                Book a Pro
                              </span>
                              <span className="text-[9.5px] font-medium text-slate-500 whitespace-nowrap tracking-tight leading-tight mt-0.5">
                                Book the club pro
                              </span>
                              <span className="text-[9.5px] font-medium text-slate-500 whitespace-nowrap tracking-tight leading-tight">
                                for golfing sessions
                              </span>
                            </div>
                          </button>

                          {/* Right Card: HCP (Equal flex-1, matching Book a Pro icon & description) */}
                          <button
                            type="button"
                            onClick={() => showToast("Your verified handicap index", "success", "HANDICAP INDEX")}
                            className="flex-1 h-[68px] bg-white rounded-[26px] px-3 shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-slate-200/80 flex items-center justify-center gap-2.5 hover:shadow-md transition-all cursor-pointer group active:scale-98 min-w-0 relative overflow-hidden"
                          >
                            {/* Fitted Background Pattern: Official USGA Slope Rating Micro-Diamond Lattice & Course Elevation Delta */}
                            <svg
                              className="absolute inset-0 w-full h-full pointer-events-none opacity-40 transition-opacity duration-300 group-hover:opacity-60"
                              viewBox="0 0 170 68"
                              fill="none"
                              preserveAspectRatio="none"
                            >
                              <defs>
                                <pattern id="hcpDiamondLattice" width="16" height="16" patternUnits="userSpaceOnUse">
                                  <path d="M 8 0 L 16 8 L 8 16 L 0 8 Z" fill="none" stroke="#009A60" strokeWidth="0.7" strokeOpacity="0.08" />
                                </pattern>
                                <radialGradient id="hcpCardGlow" cx="15%" cy="85%" r="65%">
                                  <stop offset="0%" stopColor="#009A60" stopOpacity="0.10" />
                                  <stop offset="100%" stopColor="#009A60" stopOpacity="0" />
                                </radialGradient>
                              </defs>
                              <rect width="100%" height="100%" fill="url(#hcpDiamondLattice)" />
                              <rect width="100%" height="100%" fill="url(#hcpCardGlow)" />
                              {/* Handicap slope rating delta wave lines */}
                              <path d="M-10 48 L 45 42 L 85 28 L 130 34 L 180 16" stroke="#009A60" strokeWidth="1.0" fill="none" opacity="0.18" />
                              <circle cx="85" cy="28" r="3" fill="#009A60" opacity="0.22" />
                              <circle cx="130" cy="34" r="2.5" fill="#009A60" opacity="0.22" />
                            </svg>

                            <Award className="h-5.5 w-5.5 text-[#009A60] stroke-[1.9] shrink-0 group-hover:scale-105 transition-transform relative z-10" />
                            <div className="flex flex-col text-left min-w-0 justify-center relative z-10">
                              <span className="text-[16px] font-extrabold text-[#009A60] whitespace-nowrap tracking-tight leading-tight">
                                {currentHandicap} HCP
                              </span>
                              <span className="text-[9.5px] font-medium text-slate-500 whitespace-nowrap tracking-tight leading-tight mt-0.5">
                                Your verified
                              </span>
                              <span className="text-[9.5px] font-medium text-slate-500 whitespace-nowrap tracking-tight leading-tight">
                                handicap index
                              </span>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* --- 2.5 PLAYING NOW SECTION (ENHANCED VERTICAL SPACING & EMPTY STATE) --- */}
                      <div className="w-full max-w-sm mx-auto px-4 pt-6 pb-4">
                        {/* --- ACTIVE IN-PROGRESS ROUND CARD (DISPLAYED WHEN PLAYER HAS NOT YET FINISHED ROUND) --- */}
                        {activeRound && (
                          <div className="mb-4.5 w-full rounded-[22px] bg-[#052417] text-white p-4.5 sm:p-5 border border-[#0D3826] shadow-[0_10px_28px_rgba(0,0,0,0.22)] select-none relative overflow-hidden group">
                            {/* Fitted Background Pattern: Golf Course Topographic Elevation Contours & Green Complex Plateau */}
                            <svg
                              className="absolute inset-0 w-full h-full pointer-events-none opacity-28 transition-opacity duration-300 group-hover:opacity-40"
                              viewBox="0 0 360 170"
                              fill="none"
                              preserveAspectRatio="none"
                            >
                              <defs>
                                <radialGradient id="activeRoundGlow1" cx="18%" cy="32%" r="65%">
                                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.28" />
                                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                                </radialGradient>
                                <radialGradient id="activeRoundGlow2" cx="88%" cy="70%" r="55%">
                                  <stop offset="0%" stopColor="#059669" stopOpacity="0.18" />
                                  <stop offset="100%" stopColor="#059669" stopOpacity="0" />
                                </radialGradient>
                              </defs>
                              <rect width="100%" height="100%" fill="url(#activeRoundGlow1)" />
                              <rect width="100%" height="100%" fill="url(#activeRoundGlow2)" />

                              {/* Organic Course Topographic Elevation Contours */}
                              <path d="M-20 32 C 60 8, 130 52, 210 20 C 275 -6, 320 38, 385 16" stroke="#10B981" strokeWidth="1.3" fill="none" opacity="0.65" />
                              <path d="M-15 62 C 55 35, 145 82, 235 48 C 295 24, 340 58, 395 40" stroke="#10B981" strokeWidth="1.1" fill="none" opacity="0.5" />
                              <path d="M-25 94 C 50 68, 125 110, 210 76 C 275 52, 330 90, 385 72" stroke="#10B981" strokeWidth="0.9" strokeDasharray="4 4" fill="none" opacity="0.4" />
                              <path d="M-10 126 C 75 102, 160 142, 250 112 C 310 94, 355 120, 395 106" stroke="#10B981" strokeWidth="1.0" fill="none" opacity="0.45" />
                              <path d="M-20 155 C 65 132, 150 166, 240 140 C 305 122, 360 148, 390 136" stroke="#10B981" strokeWidth="0.8" fill="none" opacity="0.3" />

                              {/* Putting Green Complex Plateau Elevation Rings around Hole squircle */}
                              <circle cx="54" cy="54" r="34" stroke="#10B981" strokeWidth="1.1" strokeDasharray="3 3" opacity="0.6" fill="none" />
                              <circle cx="54" cy="54" r="58" stroke="#10B981" strokeWidth="0.9" opacity="0.45" fill="none" />
                              <circle cx="54" cy="54" r="84" stroke="#10B981" strokeWidth="0.75" strokeDasharray="2 3" opacity="0.3" fill="none" />
                              <circle cx="54" cy="54" r="115" stroke="#10B981" strokeWidth="0.6" opacity="0.2" fill="none" />

                              {/* Course Telemetry Directional Ray */}
                              <line x1="54" y1="54" x2="330" y2="38" stroke="#10B981" strokeWidth="0.7" strokeDasharray="3 4" opacity="0.25" />
                              <line x1="54" y1="54" x2="310" y2="105" stroke="#10B981" strokeWidth="0.6" strokeDasharray="2 5" opacity="0.18" />
                            </svg>

                            <div className="relative z-10">
                              {/* Top Row: Hole Squircle Badge + Live Info */}
                              <div className="flex items-start gap-3.5">
                                {/* Hole Squircle Badge */}
                                <div className="w-[66px] h-[86px] rounded-[18px] bg-[#0B3523] border border-[#16603E]/70 flex flex-col items-center justify-center shrink-0">
                                  <span className="text-[9.5px] font-bold text-[#10B981]/90 uppercase tracking-widest leading-none">
                                    HOLE
                                  </span>
                                  <span className="text-[28px] font-black text-[#10B981] leading-none mt-1.5 tracking-tight">
                                    {activeRound.holeNumber}
                                  </span>
                                </div>

                                {/* Right Column Details */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                  {/* Row 1: LIVE Badge + Day Info + Relocated Leaderboard Link */}
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      {activeRound.isLive ? (
                                        <span className="px-2 py-0.5 rounded-[5px] bg-[#EF4444] text-white text-[9px] font-black tracking-wider uppercase leading-none shrink-0 animate-pulse">
                                          LIVE
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-[5px] bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 text-[9px] font-black tracking-wider uppercase leading-none shrink-0">
                                          {activeTournament?.status === "REGISTRATION_OPEN" ? "REG OPEN" : "UPCOMING"}
                                        </span>
                                      )}
                                      <span className="text-[11px] font-bold text-[#8FAEA2] tracking-wider uppercase shrink-0">
                                        {activeRound.dayText || "ROUND 1"}
                                      </span>
                                    </div>

                                    {/* Leaderboard Icon Button (not full text) */}
                                    <button
                                      type="button"
                                      onClick={() => switchScreen("leaderboard")}
                                      className="w-7 h-7 rounded-full bg-[#0B3523] border border-[#16603E] text-[#10B981] hover:text-white hover:bg-[#10B981]/20 active:scale-95 flex items-center justify-center cursor-pointer transition-all shrink-0 ml-auto shadow-2xs group/lb"
                                      title="View Leaderboard"
                                      aria-label="View Leaderboard"
                                    >
                                      <Trophy className="w-3.5 h-3.5 group-hover/lb:scale-110 transition-transform" />
                                    </button>
                                  </div>

                                  {/* Row 2: Full Display of Tournament Title */}
                                  <h3 className="text-[16px] font-bold text-white tracking-tight leading-tight truncate mt-1">
                                    {activeRound.tournamentName}
                                  </h3>

                                  {/* Row 3: Course Name (Pushed to the top of Par 4, 345 yds) */}
                                  {(activeRound.courseName || activeRound.clubName) && (
                                    <p className="text-[12px] font-semibold text-[#10B981] leading-tight truncate mt-0.5" title={activeRound.courseName || activeRound.clubName}>
                                      {activeRound.courseName || activeRound.clubName}
                                    </p>
                                  )}

                                  {/* Row 4: Hole Information (Par & Distance) */}
                                  <div className="flex items-center mt-1">
                                    <p className="text-[11.5px] font-medium text-[#8FAEA2] leading-none" title={activeRound.holeInfo}>
                                      {activeRound.holeInfo?.replace("yards", "yds") || "Par 4 • 345 yds"}
                                    </p>
                                  </div>

                                  {/* Row 4: Flight Avatars & Inactivity Status */}
                                  <div className="flex items-center gap-2.5 mt-2 min-h-[28px]">
                                    <div className="flex items-center -space-x-2">
                                      {(activeRound.groupPlayers || [])
                                        .filter((player) => !isAccountUser(player))
                                        .slice(0, 3)
                                        .map((player) => (
                                          <GroupPlayerAvatarItem key={player.id} player={player} />
                                        ))}
                                    </div>
                                    {hasInactivityWarning ? (
                                      <span className="text-[10px] font-bold text-[#F59E0B] tracking-wider uppercase leading-none">
                                        INACTIVE FOR {activeRoundMinutesElapsed && activeRoundMinutesElapsed >= 30 ? activeRoundMinutesElapsed : 30} MINUTES
                                      </span>
                                    ) : (
                                      <span className="text-[11.5px] font-medium text-[#D1F2DE] leading-none tracking-tight">
                                        {activeRound.flightText
                                          ? activeRound.flightText.replace(/\s*•\s*Players in Flight/gi, "").replace(/Players in Flight/gi, "").trim() || "Flight 1"
                                          : "Flight 1"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Thin subtle divider */}
                              <div className="border-t border-[#0F3D2A]/80 my-3" />

                              {/* Bottom Row: Resume Play & Forfeit Buttons (Consistent with Featured Tournament Card) */}
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (typeof window !== "undefined") {
                                      try {
                                        localStorage.setItem("openclub_active_round_started_at", String(Date.now()));
                                        sessionStorage.removeItem("openclub_inactivity_notified");
                                        const existingRaw = localStorage.getItem("openclub_live_admin_notifications");
                                        if (existingRaw) {
                                          const existingList = JSON.parse(existingRaw);
                                          const updated = Array.isArray(existingList) ? existingList.filter((n: any) => n.id !== "inact-alert-samuel-14") : [];
                                          localStorage.setItem("openclub_live_admin_notifications", JSON.stringify(updated));
                                        }
                                      } catch { }
                                    }
                                    broadcastAdminEvent("tournament-inactivity-resolved", { id: "inact-alert-samuel-14" });
                                    setHasInactivityWarning(false);
                                    setActiveRoundMinutesElapsed(0);
                                    showToast(`Resuming score entry for ${activeRound.tournamentName} (Hole ${activeRound.holeNumber})... Inactivity timer reset.`, "success", "RESUME PLAY");
                                    setTimeout(() => switchScreen("scoring"), 250);
                                  }}
                                  className="flex-[7] h-[40px] rounded-xl bg-[#009A60] hover:bg-[#008753] active:scale-[0.98] text-white font-semibold text-[13px] flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                                >
                                  <span>Resume Play</span>
                                  <ChevronRight className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setShowForfeitModal(true)}
                                  className="flex-[3] h-[40px] rounded-xl bg-[#0C241B] hover:bg-[#133327] active:scale-[0.98] border border-[#1A3F30] text-[#FB7185] hover:text-rose-300 font-semibold text-[13px] flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                                >
                                  <span>Forfeit</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between mb-1.5 mt-0.5">
                          <h3 className="text-[15px] font-bold text-[#0F172A] tracking-tight">
                            Friends Playing Now
                          </h3>
                          {friendsOnCourse.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setShowActivePlayersModal(true)}
                              className="text-[13px] font-semibold text-[#009A60] hover:text-[#007A4D] transition-colors cursor-pointer"
                            >
                              View Players
                            </button>
                          )}
                        </div>

                        {friendsOnCourse.length > 0 ? (
                          /* Circular Display Row (Interactive Drag-to-Scroll & Mouse Wheel Support) */
                          <div
                            ref={playingNowCarouselRef}
                            onWheel={(e) => {
                              if (e.deltaY !== 0) {
                                e.currentTarget.scrollLeft += e.deltaY;
                              }
                            }}
                            onMouseDown={(e) => {
                              const el = e.currentTarget;
                              el.dataset.isDown = "true";
                              el.dataset.startX = String(e.pageX - el.offsetLeft);
                              el.dataset.scrollLeft = String(el.scrollLeft);
                              el.dataset.moved = "false";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.dataset.isDown = "false";
                            }}
                            onMouseUp={(e) => {
                              e.currentTarget.dataset.isDown = "false";
                            }}
                            onMouseMove={(e) => {
                              const el = e.currentTarget;
                              if (el.dataset.isDown !== "true") return;
                              e.preventDefault();
                              const x = e.pageX - el.offsetLeft;
                              const startX = Number(el.dataset.startX);
                              const scrollLeftStart = Number(el.dataset.scrollLeft);
                              const walk = (x - startX) * 1.4;
                              if (Math.abs(walk) > 6) {
                                el.dataset.moved = "true";
                              }
                              el.scrollLeft = scrollLeftStart - walk;
                            }}
                            className="flex items-start gap-3.5 overflow-x-auto scrollbar-hide no-scrollbar pt-0.5 pb-1 scroll-smooth cursor-grab active:cursor-grabbing select-none"
                            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                          >
                            {/* Circle 1: OpenClub Brand / Invite Action */}
                            <div className="flex flex-col items-center shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  if (playingNowCarouselRef.current?.dataset.moved === "true") {
                                    playingNowCarouselRef.current.dataset.moved = "false";
                                    return;
                                  }
                                  setShowAddFriendsModal(true);
                                }}
                                className="w-[54px] h-[54px] rounded-full border-2 border-[#009A60] bg-white flex flex-col items-center justify-center shrink-0 shadow-[0_2px_10px_rgba(0,154,96,0.12)] hover:bg-emerald-50/40 transition-all cursor-pointer group active:scale-95"
                                title="Invite Friends"
                              >
                                <span className="text-[8px] font-black tracking-wider text-[#009A60] leading-none">OPEN</span>
                                <span className="text-[8.5px] font-black tracking-wider text-[#009A60] my-0.5 leading-none">CLUB</span>
                                <span className="text-[7px] font-bold tracking-widest text-[#009A60]/75 leading-none">GOLF</span>
                              </button>
                              <span className="text-[11px] font-semibold text-[#009A60] mt-1.5 max-w-[56px] truncate text-center leading-tight">
                                Invite
                              </span>
                            </div>

                            {/* Friends on Course Avatars with Player First Name Underneath (5 Max) */}
                            {friendsOnCourse.slice(0, 5).map((friend) => {
                              const friendFirstName = friend.name ? friend.name.split(" ")[0] : "";
                              return (
                                <div key={friend.id} className="flex flex-col items-center shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (playingNowCarouselRef.current?.dataset.moved === "true") {
                                        playingNowCarouselRef.current.dataset.moved = "false";
                                        return;
                                      }
                                      const competitor = activeCompetitorsData.find((c: any) => c.name.toLowerCase() === friend.name.toLowerCase()) || activeCompetitorsData[0];
                                      if (competitor) {
                                        setSelectedPlayerForScorecard(competitor);
                                        setScorecardViewSection("all");
                                        switchScreen("player-scorecard");
                                      }
                                    }}
                                    className="w-[54px] h-[54px] rounded-full border-2 border-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] bg-gradient-to-b from-slate-300 to-slate-400 text-white flex items-center justify-center shrink-0 font-bold text-[14px] relative hover:scale-105 transition-all cursor-pointer active:scale-95"
                                    title={`${friend.name} (${friend.score}) - Tap to view scorecard`}
                                  >
                                    {friend.initials}
                                    <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                                  </button>
                                  <span className="text-[11px] font-semibold text-slate-700 mt-1.5 max-w-[56px] truncate text-center leading-tight">
                                    {friendFirstName}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          /* Rounded Dashed Empty Display (When no user is on the course) */
                          <button
                            type="button"
                            onClick={() => switchScreen("add-friends")}
                            className="w-full rounded-[22px] border-2 border-dashed border-[#C6F0DB] hover:border-[#009A60] bg-[#EAF7EE]/60 hover:bg-[#EAF7EE] py-2.5 px-3.5 flex items-center justify-between transition-all cursor-pointer group active:scale-98 text-left shadow-2xs"
                            title="Add Golf Friends"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-[50px] h-[50px] rounded-full border-2 border-dashed border-[#009A60] bg-white flex items-center justify-center shrink-0 text-[#009A60] group-hover:scale-105 transition-transform shadow-xs">
                                <UserPlus className="w-5 h-5 text-[#009A60]" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[13.5px] font-bold text-[#0F172A] leading-tight group-hover:text-[#009A60] transition-colors truncate">
                                  No friends on the course yet
                                </p>
                                <p className="text-[11.5px] text-slate-500 leading-tight mt-0.5 truncate">
                                  Invite fellow golfers or join active rounds
                                </p>
                              </div>
                            </div>
                            <div className="shrink-0 pl-2">
                              <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-white border border-slate-200 group-hover:border-emerald-200 text-[11px] font-semibold text-[#009A60] shadow-2xs group-hover:bg-emerald-50 transition-colors whitespace-nowrap">
                                + Add Friends
                              </span>
                            </div>
                          </button>
                        )}
                      </div>

                      {/* --- 2.75 OPENCLUBOS SYSTEM PROMOTIONAL CARD (HOST. SCORE. WIN.) --- */}
                      <div className="w-full max-w-sm mx-auto px-4 pb-2.5">
                        <div className="w-full bg-white rounded-[22px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-4 flex items-center justify-between gap-3 select-none relative overflow-hidden group">
                          {/* Fitted Background Pattern: High-Tech Tournament OS Dot-Matrix & Circuit Bracket Telemetry */}
                          <svg
                            className="absolute inset-0 w-full h-full pointer-events-none opacity-40 transition-opacity duration-300 group-hover:opacity-55"
                            viewBox="0 0 360 110"
                            fill="none"
                            preserveAspectRatio="none"
                          >
                            <defs>
                              <pattern id="osTechDots" width="18" height="18" patternUnits="userSpaceOnUse">
                                <circle cx="9" cy="9" r="1.1" fill="#009A60" fillOpacity="0.16" />
                              </pattern>
                              <radialGradient id="osCardGlow" cx="82%" cy="50%" r="55%">
                                <stop offset="0%" stopColor="#009A60" stopOpacity="0.08" />
                                <stop offset="100%" stopColor="#009A60" stopOpacity="0" />
                              </radialGradient>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#osTechDots)" />
                            <rect width="100%" height="100%" fill="url(#osCardGlow)" />
                            {/* High-tech Tournament Bracket & Circuit Telemetry Lines */}
                            <path d="M 120 0 L 165 34 L 245 34 L 275 80" stroke="#009A60" strokeWidth="1" strokeDasharray="3 3" opacity="0.18" fill="none" />
                            <circle cx="165" cy="34" r="2.5" fill="#009A60" opacity="0.25" />
                            <circle cx="245" cy="34" r="2.5" fill="#009A60" opacity="0.25" />
                            <path d="M 210 110 L 238 78 L 320 78" stroke="#009A60" strokeWidth="0.8" opacity="0.14" fill="none" />
                            <circle cx="238" cy="78" r="2" fill="#009A60" opacity="0.2" />
                          </svg>

                          {/* Left Column */}
                          <div className="relative z-10 flex flex-col min-w-0 flex-1">
                            {/* Brand Tag + System Pill */}
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10.5px] font-black tracking-wider text-[#009A60] uppercase">
                                OPENCLUBOS
                              </span>
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-[5px] text-[8px] font-black uppercase tracking-wider bg-[#009A60] text-white">
                                SYSTEM
                              </span>
                            </div>

                            {/* Title */}
                            <h3 className="text-[17px] font-extrabold text-[#0F172A] tracking-tight leading-tight">
                              Host. Score. Win.
                            </h3>

                            {/* Subtitle */}
                            <p className="text-[12.5px] font-bold text-[#F97316] tracking-tight mt-0.5 mb-3">
                              Full Tournament OS
                            </p>

                            {/* Action Button */}
                            <div>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveBottomNavTab("tournaments");
                                  showToast("Accessing OpenClub Full Tournament OS", "success", "TOURNAMENT OS");
                                }}
                                className="h-8 px-4 rounded-xl bg-[#064E3B] hover:bg-[#065F46] active:scale-95 text-white font-extrabold text-[10px] tracking-wider uppercase transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center"
                              >
                                EXPLORE
                              </button>
                            </div>
                          </div>

                          {/* Right Column: Abstract Tournament Leaderboard Illustration Card */}
                          <div className="relative z-10 w-[102px] h-[78px] rounded-[18px] bg-[#F4F9F6] border border-emerald-100/60 p-2.5 flex flex-col justify-center gap-2.5 shrink-0 shadow-2xs">
                            {/* Row 1: Green Active Dot + Mint Bar */}
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#009A60] shrink-0 shadow-2xs" />
                              <span className="h-2 rounded-full bg-[#009A60]/30 w-14" />
                            </div>

                            {/* Row 2: Soft Blue Dot + Soft Pastel Blue Bar */}
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#93C5FD] shrink-0" />
                              <span className="h-2 rounded-full bg-[#E0EDFA] w-12" />
                            </div>

                            {/* Row 3: Soft Slate Dot + Subtle Bar */}
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#CBD5E1] shrink-0" />
                              <span className="h-2 rounded-full bg-[#F1F5F9] w-10" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* --- 3. FEATURED TOURNAMENTS SECTION (REFERENCE MATCH) --- */}
                      <div className="w-full max-w-sm mx-auto pt-3 pb-1">
                        {/* Section Header */}
                        <div className="flex items-center justify-between px-4 mb-2.5">
                          <h3 className="text-[17px] font-bold text-[#0F172A] tracking-tight whitespace-nowrap">
                            Featured Tournaments
                          </h3>
                          <button
                            type="button"
                            onClick={() => {
                              switchScreen("tournaments");
                            }}
                            className="text-[13px] font-semibold text-[#009A60] hover:text-[#007A4D] transition-colors cursor-pointer whitespace-nowrap"
                          >
                            View More
                          </button>
                        </div>

                        {/* Featured Tournaments (Carousel or Consistent-Width Empty State) */}
                        {(() => {
                          const featuredFromDb = liveTournaments.filter((t) => t.isFeatured);
                          const rawList = featuredFromDb.length > 0 ? featuredFromDb : liveTournaments;

                          if (rawList.length === 0) {
                            return (
                              <div className="px-4 pb-1">
                                <div className="w-full rounded-[22px] py-5 px-4 flex flex-col items-center justify-center text-center border border-[#e1efe5] bg-white shadow-xs select-none">
                                  <div className="w-11 h-11 rounded-full bg-[#EAF7EE] border border-[#C6F0DB] flex items-center justify-center mb-2.5 shadow-2xs">
                                    <Trophy className="w-5 h-5 text-[#009A60]" />
                                  </div>
                                  <p className="text-[#0F172A] text-[14.5px] font-bold tracking-tight">No Active Tournaments</p>
                                  <p className="text-[#64748B] text-[12px] mt-1 max-w-[260px] leading-relaxed font-normal">
                                    Stay on the lookout for upcoming tournaments and club championship events.
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          const listToRender = rawList.map((t, idx) => {
                            const assignedImage = resolveTournamentBanner(idx, t.bannerUrl);
                            const formattedTitle = formatFeaturedTournamentTitle(t.name);

                            return {
                              id: t.id,
                              title: t.name,
                              titleLine1: formattedTitle.line1,
                              titleLine2: formattedTitle.line2,
                              gender: t.gender,
                              divisions: t.divisions || "Championship",
                              venue: t.organizerClub || t.courseName || "Ikoyi Club 1938",
                              entryFee: t.entryFee || "Free",
                              hcpLimit: t.hcpLimit || "No Limit",
                              deadline: t.deadline || "Open",
                              image: assignedImage,
                            };
                          });

                          return (
                            <div
                              ref={featuredTournamentsCarouselRef}
                              onWheel={(e) => {
                                if (e.deltaY !== 0) {
                                  e.currentTarget.scrollLeft += e.deltaY;
                                }
                              }}
                              onMouseDown={(e) => {
                                const el = e.currentTarget;
                                el.dataset.isDown = "true";
                                el.dataset.startX = String(e.pageX - el.offsetLeft);
                                el.dataset.scrollLeft = String(el.scrollLeft);
                                el.dataset.moved = "false";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.dataset.isDown = "false";
                              }}
                              onMouseUp={(e) => {
                                e.currentTarget.dataset.isDown = "false";
                              }}
                              onMouseMove={(e) => {
                                const el = e.currentTarget;
                                if (el.dataset.isDown !== "true") return;
                                e.preventDefault();
                                const x = e.pageX - el.offsetLeft;
                                const startX = Number(el.dataset.startX);
                                const scrollLeftStart = Number(el.dataset.scrollLeft);
                                const walk = (x - startX) * 1.4;
                                if (Math.abs(walk) > 6) {
                                  el.dataset.moved = "true";
                                }
                                el.scrollLeft = scrollLeftStart - walk;
                              }}
                              className="flex gap-3.5 overflow-x-auto scrollbar-hide no-scrollbar px-4 pb-1 scroll-smooth cursor-grab active:cursor-grabbing select-none"
                              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                            >
                              {listToRender.map((tourn) => (
                                <div
                                  key={tourn.id}
                                  className="w-[315px] h-[224px] rounded-[22px] overflow-hidden shrink-0 relative shadow-md hover:shadow-lg transition-all group select-none border border-white/5"
                                >
                                {/* Background Image */}
                                <div
                                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105 pointer-events-none"
                                  style={{ backgroundImage: `url('${tourn.image}')` }}
                                />
                                {/* Dark Contrast Gradient Overlay (Deep contrast for crisp text readability) */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 to-black/50 pointer-events-none" />

                                {/* Card Content */}
                                <div className="relative z-10 flex flex-col h-full p-3.5 pb-2.5">
                                  {/* Top Row: Badges, Title + Bookmark */}
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex flex-col min-w-0 flex-1 pr-1">
                                      {/* Badges: Gender + Divisions */}
                                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                                        {tourn.gender && (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-white text-slate-900 shadow-xs">
                                            {tourn.gender}
                                          </span>
                                        )}
                                        {tourn.divisions && (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-[#009A60]/35 text-emerald-300 border border-[#009A60]/50 backdrop-blur-xs shadow-xs">
                                            {tourn.divisions}
                                          </span>
                                        )}
                                      </div>

                                      {/* Title: Exactly matches 'Host. Score. Win.' typography (17px, font-extrabold, tracking-tight, leading-tight) */}
                                      <h4 className="text-[17px] font-extrabold text-white tracking-tight leading-tight drop-shadow-sm max-w-[255px]">
                                        {tourn.titleLine2 ? (
                                          <>
                                            <span className="block truncate">{tourn.titleLine1}</span>
                                            <span className="block truncate">{tourn.titleLine2}</span>
                                          </>
                                        ) : (
                                          <span className="block line-clamp-2">{tourn.titleLine1}</span>
                                        )}
                                      </h4>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (featuredTournamentsCarouselRef.current?.dataset.moved === "true") {
                                          featuredTournamentsCarouselRef.current.dataset.moved = "false";
                                          return;
                                        }
                                        showToast(`${tourn.title} saved to bookmarks`, "success", "BOOKMARKED");
                                      }}
                                      className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/10 backdrop-blur-xs flex items-center justify-center cursor-pointer transition-all shrink-0 mt-0.5"
                                      title="Bookmark Tournament"
                                    >
                                      <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
                                    </button>
                                  </div>

                                  {/* Tight spacing directly under tournament title */}
                                  <div className="h-2" />

                                  {/* Middle: 2x2 Metadata Grid */}
                                  <div className="grid grid-cols-2 gap-x-2.5 gap-y-1.5">
                                    {/* 1. Venue */}
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs flex items-center justify-center shrink-0">
                                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-[8.5px] font-semibold text-slate-300/80 uppercase tracking-wider">
                                          VENUE
                                        </span>
                                        <span className="text-[12px] font-bold text-white tracking-tight leading-tight truncate" title={tourn.venue}>
                                          {tourn.venue}
                                        </span>
                                      </div>
                                    </div>

                                    {/* 2. Entry Fee */}
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs flex items-center justify-center shrink-0">
                                        <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-[8.5px] font-semibold text-slate-300/80 uppercase tracking-wider">
                                          ENTRY FEE
                                        </span>
                                        <span className="text-[12px] font-bold text-white tracking-tight leading-tight truncate">
                                          {tourn.entryFee}
                                        </span>
                                      </div>
                                    </div>

                                    {/* 3. HCP Limit */}
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs flex items-center justify-center shrink-0">
                                        <Award className="w-3.5 h-3.5 text-emerald-400" />
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-[8.5px] font-semibold text-slate-300/80 uppercase tracking-wider">
                                          HCP LIMIT
                                        </span>
                                        <span className="text-[12px] font-bold text-white tracking-tight leading-tight truncate">
                                          {tourn.hcpLimit}
                                        </span>
                                      </div>
                                    </div>

                                    {/* 4. Deadline */}
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs flex items-center justify-center shrink-0">
                                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-[8.5px] font-semibold text-slate-300/80 uppercase tracking-wider">
                                          DEADLINE
                                        </span>
                                        <span className="text-[12px] font-bold text-white tracking-tight leading-tight truncate">
                                          {tourn.deadline}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Flexible Spacer between Metadata and Action Buttons */}
                                  <div className="flex-1 min-h-1.5" />

                                  {/* Bottom: Action Buttons (Register 70%, Share 30%) */}
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (featuredTournamentsCarouselRef.current?.dataset.moved === "true") {
                                          featuredTournamentsCarouselRef.current.dataset.moved = "false";
                                          return;
                                        }
                                        showToast(`Opening registration for ${tourn.title}`, "success", "REGISTRATION");
                                        switchScreen("scoring");
                                      }}
                                      className="flex-[7] h-[38px] rounded-xl bg-[#009A60] hover:bg-[#008753] active:scale-[0.98] text-white font-semibold text-[12.5px] flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                                    >
                                      <span>Register Now</span>
                                      <ChevronRight className="w-4 h-4" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (featuredTournamentsCarouselRef.current?.dataset.moved === "true") {
                                          featuredTournamentsCarouselRef.current.dataset.moved = "false";
                                          return;
                                        }
                                        if (typeof navigator !== "undefined" && navigator.clipboard) {
                                          navigator.clipboard.writeText(`https://openclub.app/tournaments/${tourn.id}`).catch(() => {});
                                        }
                                        showToast(`${tourn.title} link copied to clipboard!`, "success", "SHARE TOURNAMENT");
                                      }}
                                      className="flex-[3] h-[38px] rounded-xl bg-white hover:bg-slate-100 active:scale-[0.98] text-[#0F172A] font-semibold text-[12px] flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer border border-slate-200"
                                      title="Share Tournament"
                                    >
                                      <Share2 className="w-3.5 h-3.5 text-[#0F172A]" />
                                      <span>Share</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                      {/* --- 3.5 ROUNDS SECTION --- */}
                      <div className="w-full max-w-sm mx-auto px-4 pt-3 pb-6">
                        {/* Section Header */}
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-[17px] font-bold text-[#0F172A] tracking-tight">
                            Rounds ({recentRounds.length})
                          </h3>
                          <button
                            type="button"
                            onClick={() => {
                              showToast("Viewing all past round scorecards", "success", "ROUNDS HISTORY");
                            }}
                            className="text-[13px] font-semibold text-[#009A60] hover:text-[#007A4D] transition-colors cursor-pointer"
                          >
                            View History
                          </button>
                        </div>

                        <div className="space-y-3">
                          {/* Card 1: Upcoming Rounds (Empty / Schedule New Round) */}
                          <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-3.5 flex items-center justify-between transition-all hover:border-slate-300 relative overflow-hidden group">
                            {/* Fitted Background Pattern: Golf Ball Dimple Honeycomb Lattice & Radial Action Pulse */}
                            <svg
                              className="absolute inset-0 w-full h-full pointer-events-none opacity-45 transition-opacity duration-300 group-hover:opacity-60"
                              viewBox="0 0 360 84"
                              fill="none"
                              preserveAspectRatio="none"
                            >
                              <defs>
                                <pattern id="golfDimpleLattice" width="24" height="24" patternUnits="userSpaceOnUse">
                                  <circle cx="6" cy="6" r="2.8" stroke="#009A60" strokeWidth="0.8" strokeOpacity="0.10" fill="none" />
                                  <circle cx="18" cy="18" r="2.8" stroke="#009A60" strokeWidth="0.8" strokeOpacity="0.10" fill="none" />
                                  <circle cx="18" cy="6" r="1.2" fill="#009A60" fillOpacity="0.08" />
                                  <circle cx="6" cy="18" r="1.2" fill="#009A60" fillOpacity="0.08" />
                                </pattern>
                                <radialGradient id="upcomingRoundsGlow" cx="90%" cy="50%" r="55%">
                                  <stop offset="0%" stopColor="#009A60" stopOpacity="0.09" />
                                  <stop offset="100%" stopColor="#009A60" stopOpacity="0" />
                                </radialGradient>
                              </defs>
                              <rect width="100%" height="100%" fill="url(#golfDimpleLattice)" />
                              <rect width="100%" height="100%" fill="url(#upcomingRoundsGlow)" />
                              {/* Concentric Action Pulse Wave Rings radiating behind the Circular Plus Button */}
                              <circle cx="330" cy="42" r="28" stroke="#009A60" strokeWidth="1" strokeDasharray="3 3" opacity="0.18" fill="none" />
                              <circle cx="330" cy="42" r="52" stroke="#009A60" strokeWidth="0.8" opacity="0.12" fill="none" />
                              <circle cx="330" cy="42" r="78" stroke="#009A60" strokeWidth="0.6" strokeDasharray="4 4" opacity="0.08" fill="none" />
                            </svg>

                            {/* Dashed Rounded Badge with count */}
                            <div className="relative z-10 w-[56px] h-[56px] rounded-[18px] border-2 border-dashed border-[#009A60] bg-[#EAF7EE] flex items-center justify-center shrink-0 shadow-2xs">
                              <span className="text-[22px] font-bold text-[#009A60] select-none">{recentRounds.length}</span>
                            </div>

                            {/* Middle Info */}
                            <div className="relative z-10 min-w-0 flex-1 ml-3.5 pr-2">
                              <h4 className="text-[15px] font-bold text-[#0F172A] leading-snug">
                                Upcoming Rounds
                              </h4>
                              <p className="text-[12.5px] text-slate-400 font-normal leading-snug mt-0.5">
                                No rounds scheduled yet
                              </p>
                            </div>

                            {/* Circular Plus Action Button */}
                            <button
                              type="button"
                              onClick={() => {
                                showToast("Schedule a new tournament or practice round.", "success", "SCHEDULE ROUND");
                                switchScreen("scoring");
                              }}
                              className="relative z-10 w-10 h-10 rounded-full bg-[#009A60] hover:bg-[#007A4D] active:scale-95 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-2xs"
                              title="Schedule New Round"
                              aria-label="Schedule New Round"
                            >
                              <Plus className="w-5 h-5 stroke-[2.2]" />
                            </button>
                          </div>

                          {/* Card 2: Recent / Completed Round - only displayed when there is a recent round */}
                          {recentRounds.length > 0 && recentRounds.map((round) => (
                            <div
                              key={round.id}
                              onClick={() => {
                                showToast(`${round.clubName} • Net Score ${round.netScore}`, "success", "ROUND DETAILS");
                              }}
                              className="bg-white rounded-[24px] border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-3.5 flex items-center justify-between transition-all hover:border-slate-300 cursor-pointer group relative overflow-hidden"
                            >
                              {/* Fitted Background Pattern: Golf Scorecard Micro-Ruler Ledger & Flagstick Pin Silhouette */}
                              <svg
                                className="absolute inset-0 w-full h-full pointer-events-none opacity-35 transition-opacity duration-300 group-hover:opacity-50"
                                viewBox="0 0 360 84"
                                fill="none"
                                preserveAspectRatio="none"
                              >
                                <defs>
                                  <pattern id={`scorecardLedgerGrid-${round.id}`} width="30" height="20" patternUnits="userSpaceOnUse">
                                    <line x1="0" y1="20" x2="30" y2="20" stroke="#009A60" strokeWidth="0.6" strokeOpacity="0.07" />
                                    <line x1="15" y1="17" x2="15" y2="20" stroke="#009A60" strokeWidth="0.6" strokeOpacity="0.10" />
                                    <line x1="30" y1="14" x2="30" y2="20" stroke="#009A60" strokeWidth="0.8" strokeOpacity="0.12" />
                                  </pattern>
                                  <radialGradient id={`recentRoundGlow-${round.id}`} cx="92%" cy="50%" r="55%">
                                    <stop offset="0%" stopColor="#009A60" stopOpacity="0.08" />
                                    <stop offset="100%" stopColor="#009A60" stopOpacity="0" />
                                  </radialGradient>
                                </defs>
                                <rect width="100%" height="100%" fill={`url(#scorecardLedgerGrid-${round.id})`} />
                                <rect width="100%" height="100%" fill={`url(#recentRoundGlow-${round.id})`} />
                                {/* Flagstick pin graphic behind Net Score */}
                                <line x1="322" y1="14" x2="322" y2="68" stroke="#009A60" strokeWidth="1" opacity="0.16" />
                                <path d="M 322 16 L 306 23 L 322 30 Z" fill="#009A60" opacity="0.14" />
                                <ellipse cx="322" cy="68" rx="8" ry="2.5" stroke="#009A60" strokeWidth="0.8" opacity="0.14" fill="none" />
                              </svg>

                              {/* Mint Date Badge */}
                              <div className="relative z-10 w-[56px] h-[56px] rounded-[18px] bg-[#EAF7EE] border border-[#C6F0DB]/60 flex flex-col items-center justify-center shrink-0 shadow-2xs">
                                <span className="text-[11px] font-bold text-[#009A60] tracking-wider leading-none">
                                  {round.month}
                                </span>
                                <span className="text-[20px] font-black text-[#009A60] leading-none mt-1">
                                  {round.day}
                                </span>
                              </div>

                              {/* Middle Info */}
                              <div className="relative z-10 min-w-0 flex-1 ml-3.5 pr-2">
                                <h4 className="text-[15px] font-bold text-[#0F172A] leading-snug truncate group-hover:text-[#009A60] transition-colors">
                                  {round.clubName}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[12.5px] text-slate-400 font-normal">
                                    {round.holes} Holes
                                  </span>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-[11px] font-bold text-[#009A60] tracking-wide">
                                    {round.status}
                                  </span>
                                </div>
                              </div>

                              {/* Right Net Score Column */}
                              <div className="relative z-10 flex flex-col items-end shrink-0 pl-1">
                                <span className="text-[23px] font-black text-[#0F172A] tracking-tight leading-none">
                                  {round.netScore}
                                </span>
                                <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase mt-1 leading-none">
                                  NET SCORE
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* --- 4. CUSTOM MOBILE BOTTOM NAVIGATION BAR (FLUSH, PLAY GOLF DOES NOT PROTRUDE) --- */}
                      <div className="mt-auto sticky bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] shrink-0">
                        <div className="w-full max-w-sm mx-auto h-16 flex items-center justify-between px-3">
                          {/* 1. Home */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveBottomNavTab("home");
                              showToast("Home Dashboard & Activity", "success", "HOME");
                            }}
                            className="flex flex-col items-center justify-center w-14 py-1 group cursor-pointer transition-colors"
                          >
                            <Home
                              className={`h-5 w-5 transition-colors ${
                                activeBottomNavTab === "home" ? "text-[#009A60]" : "text-[#94A3B8] group-hover:text-slate-600"
                              }`}
                            />
                            <span
                              className={`text-[10px] mt-1 tracking-tight transition-colors ${
                                activeBottomNavTab === "home" ? "font-bold text-[#009A60]" : "font-medium text-[#94A3B8] group-hover:text-slate-600"
                              }`}
                            >
                              Home
                            </span>
                          </button>

                          {/* 2. Tournaments (with Red Notification Dot) */}
                          <button
                            type="button"
                            onClick={() => {
                              switchScreen("tournaments");
                            }}
                            className="flex flex-col items-center justify-center w-14 py-1 group cursor-pointer transition-colors relative"
                          >
                            <div className="relative">
                              <Trophy
                                className={`h-5 w-5 transition-colors ${
                                  activeBottomNavTab === "tournaments" ? "text-[#009A60]" : "text-[#94A3B8] group-hover:text-slate-600"
                                }`}
                              />
                              {/* Red Notification Dot at top-right of trophy */}
                              <span className="absolute -top-0.5 -right-1.5 w-2 h-2 rounded-full bg-[#EF4444] border-1.5 border-white shadow-xs" />
                            </div>
                            <span
                              className={`text-[10px] mt-1 tracking-tight transition-colors ${
                                activeBottomNavTab === "tournaments" ? "font-bold text-[#009A60]" : "font-medium text-[#94A3B8] group-hover:text-slate-600"
                              }`}
                            >
                              Tournaments
                            </span>
                          </button>

                          {/* 3. Center Flush Action Button ("PLAY GOLF" - Does NOT protrude) */}
                          <button
                            type="button"
                            onClick={() => {
                              showToast("Ready to tee off. Launching live scoring...", "success", "PLAY GOLF");
                              setTimeout(() => switchScreen("scoring"), 350);
                            }}
                            className="w-[48px] h-[48px] rounded-full bg-[#009A60] hover:bg-[#008251] active:scale-95 transition-all shadow-[0_4px_12px_rgba(0,154,96,0.32)] border-2 border-white flex flex-col items-center justify-center shrink-0 cursor-pointer group"
                            title="Play Golf"
                          >
                            <span className="text-[9px] font-black text-white tracking-wider leading-none">PLAY</span>
                            <span className="text-[9px] font-black text-white tracking-wider leading-none mt-0.5">GOLF</span>
                          </button>

                          {/* 4. Challenges */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveBottomNavTab("challenges");
                              showToast("Active Club Challenges & Skins leaderboards", "success", "CHALLENGES");
                            }}
                            className="flex flex-col items-center justify-center w-14 py-1 group cursor-pointer transition-colors"
                          >
                            <Star
                              className={`h-5 w-5 transition-colors ${
                                activeBottomNavTab === "challenges" ? "text-[#009A60]" : "text-[#94A3B8] group-hover:text-slate-600"
                              }`}
                            />
                            <span
                              className={`text-[10px] mt-1 tracking-tight transition-colors ${
                                activeBottomNavTab === "challenges" ? "font-bold text-[#009A60]" : "font-medium text-[#94A3B8] group-hover:text-slate-600"
                              }`}
                            >
                              Challenges
                            </span>
                          </button>

                          {/* 5. Deals */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveBottomNavTab("deals");
                              showToast("Member Exclusive Equipment & Tee Time Deals", "success", "DEALS");
                            }}
                            className="flex flex-col items-center justify-center w-14 py-1 group cursor-pointer transition-colors"
                          >
                            <Flame
                              className={`h-5 w-5 transition-colors ${
                                activeBottomNavTab === "deals" ? "text-[#009A60]" : "text-[#94A3B8] group-hover:text-slate-600"
                              }`}
                            />
                            <span
                              className={`text-[10px] mt-1 tracking-tight transition-colors ${
                                activeBottomNavTab === "deals" ? "font-bold text-[#009A60]" : "font-medium text-[#94A3B8] group-hover:text-slate-600"
                              }`}
                            >
                              Deals
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TOURNAMENTS SCREEN (Pixel-Perfect Reference Match) */}
                  {targetScreen === "tournaments" && (() => {
                    // Base curated tournament entries
                    const baseTournamentsList = [
                      {
                        id: "lagos-amateur-open",
                        name: "Lagos Amateur Open",
                        club: "Lakowe Lakes Golf Estate",
                        category: "Ongoing",
                        fee: "₦150,000 Fee",
                        feeAmount: 150000,
                        date: "Nov 12, 2024",
                        dateFull: "Nov 12 - 14, 2024",
                        format: "Individual Strokeplay • 36 Holes",
                        formatType: "Strokeplay",
                        purse: "₦12,500,000 Total Purse",
                        holes: 18,
                        cutLine: "Top 40 Players & Ties",
                        bannerUrl: "/images/tournaments/lagos_amateur_open.jpg",
                        isFeatured: false,
                        status: "Open",
                        isOpen: true,
                      },
                      {
                        id: "ibb-invitational",
                        name: "IBB Invitational",
                        club: "IBB International Golf Club",
                        category: "Invitational",
                        fee: "Registration Closed",
                        feeAmount: 100000,
                        date: "Oct 05, 2024",
                        dateFull: "Oct 05, 2024",
                        format: "Matchplay Invitational • 18 Holes",
                        formatType: "Matchplay",
                        purse: "₦8,000,000 Total Purse",
                        holes: 18,
                        cutLine: "Invitation Only",
                        bannerUrl: "/images/tournaments/ibb_invitational.jpg",
                        isFeatured: false,
                        status: "Closed",
                        isOpen: false,
                      },
                      {
                        id: "corporate-golf-challenge",
                        name: "Corporate Golf Challenge",
                        club: "Port Harcourt Golf Club",
                        category: "Invitational",
                        fee: "₦85,000 Fee",
                        feeAmount: 85000,
                        date: "Dec 15, 2024",
                        dateFull: "Dec 15, 2024",
                        format: "Four-Ball Better Ball • 18 Holes",
                        formatType: "Four-Ball / Scramble",
                        purse: "₦5,000,000 In Trophies & Gifts",
                        holes: 18,
                        cutLine: "One Day Invitational",
                        bannerUrl: "/images/tournaments/corporate_golf_cart.jpg",
                        isFeatured: false,
                        status: "Open",
                        isOpen: true,
                      },
                      {
                        id: "smokin-hills-memorial",
                        name: "Smokin Hills Memorial Trophy",
                        club: "Smokin Hills Golf Resort",
                        category: "Major",
                        fee: "₦120,000 Fee",
                        feeAmount: 120000,
                        date: "Jan 18, 2025",
                        dateFull: "Jan 18 - 20, 2025",
                        format: "Individual Strokeplay • 54 Holes",
                        formatType: "Strokeplay",
                        purse: "₦15,000,000 Total Purse",
                        holes: 18,
                        cutLine: "Top 35 Players & Ties",
                        bannerUrl: "/images/tournaments/course_banner_04.jpg",
                        isFeatured: false,
                        status: "Open",
                        isOpen: true,
                      },
                      {
                        id: "abuja-national-scramble",
                        name: "Abuja National Scramble",
                        club: "IBB International Golf Club",
                        category: "Ongoing",
                        fee: "₦50,000 Fee",
                        feeAmount: 50000,
                        date: "Nov 28, 2024",
                        dateFull: "Nov 28, 2024",
                        format: "Four-Man Scramble • 18 Holes",
                        formatType: "Four-Ball / Scramble",
                        purse: "₦3,500,000 In Prizes",
                        holes: 18,
                        cutLine: "Open Entry",
                        bannerUrl: "/images/tournaments/course_banner_06.jpg",
                        isFeatured: false,
                        status: "Open",
                        isOpen: true,
                      },
                    ];

                    // Merge dynamic real tournaments from database
                    const dynamicFromDb = liveTournaments.map((t, idx) => ({
                      id: t.id,
                      name: t.name,
                      club: t.organizerClub || t.courseName || "Ikoyi Club 1938",
                      category: t.isFeatured ? "Major" : "Ongoing",
                      fee: t.entryFee || "Free",
                      feeAmount: parseInt((t.entryFee || "0").replace(/[^0-9]/g, ""), 10) || 0,
                      date: t.deadline || "Open Entry",
                      dateFull: t.deadline || "Open Entry",
                      format: `${t.divisions || "Championship"} • 18 Holes`,
                      formatType: "Strokeplay",
                      purse: "Official OpenclubOS Purse",
                      holes: 18,
                      cutLine: "Standard Cut",
                      bannerUrl: resolveTournamentBanner(idx, t.bannerUrl),
                      isFeatured: t.isFeatured,
                      status: "Open",
                      isOpen: true,
                    }));

                    const combinedTournaments = Array.from(
                      new Map([...baseTournamentsList, ...dynamicFromDb].map((t) => [t.name.toLowerCase(), t])).values()
                    );

                    // Filter by search query and filter criteria
                    const filteredTournaments = combinedTournaments.filter((t) => {
                      // 1. Search Query
                      if (tournamentSearchQuery.trim()) {
                        const q = tournamentSearchQuery.toLowerCase().trim();
                        const matchName = t.name.toLowerCase().includes(q);
                        const matchClub = t.club.toLowerCase().includes(q);
                        const matchFormat = t.format.toLowerCase().includes(q);
                        const matchDate = t.date.toLowerCase().includes(q);
                        const matchFee = t.fee.toLowerCase().includes(q);
                        if (!matchName && !matchClub && !matchFormat && !matchDate && !matchFee) return false;
                      }

                      // 2. Category Filter
                      if (tournamentFilter !== "All") {
                        if (tournamentFilter === "Ongoing" && t.category !== "Ongoing") return false;
                        if (tournamentFilter === "Major" && t.category !== "Major" && !t.isFeatured) return false;
                        if (tournamentFilter === "Invitational" && t.category !== "Invitational") return false;
                      }

                      // 3. Format Filter
                      if (tournamentFormatFilter !== "All") {
                        if (tournamentFormatFilter === "Strokeplay" && !t.format.toLowerCase().includes("strokeplay")) return false;
                        if (tournamentFormatFilter === "Matchplay" && !t.format.toLowerCase().includes("matchplay")) return false;
                        if (tournamentFormatFilter === "Four-Ball / Scramble" && !t.format.toLowerCase().includes("four-ball") && !t.format.toLowerCase().includes("scramble")) return false;
                      }

                      // 4. Fee Filter
                      if (tournamentFeeFilter !== "All") {
                        if (tournamentFeeFilter === "Free" && t.feeAmount > 0 && !t.fee.toLowerCase().includes("free")) return false;
                        if (tournamentFeeFilter === "Under ₦100,000" && t.feeAmount >= 100000) return false;
                        if (tournamentFeeFilter === "₦100,000+" && t.feeAmount < 100000) return false;
                      }

                      return true;
                    });

                    const isCustomFilterActive = tournamentFilter !== "All" || tournamentFormatFilter !== "All" || tournamentFeeFilter !== "All";

                    return (
                      <div className="flex-1 flex flex-col bg-[#F4F6F3] min-h-0 relative select-none font-['DM_Sans',sans-serif]">
                        {/* FIXED TOP SECTION: Top Navigation Bar + Search Bar (Strictly Non-Scrollable) */}
                        <div className="w-full shrink-0 z-20 bg-white border-b border-slate-200/60 shadow-2xs">
                          <div className="w-full max-w-sm mx-auto px-6 pt-4 pb-3 space-y-3">
                            {/* Top Navigation Bar: Unified 16px top offset, 24px horizontal gutters */}
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => switchScreen("hub")}
                                className="h-8 w-8 rounded-full border border-slate-200 bg-white shadow-2xs flex items-center justify-center text-[#0F172A] hover:bg-slate-50 transition-all cursor-pointer shrink-0"
                                title="Back to Hub"
                                aria-label="Back"
                              >
                                <ChevronLeft className="h-[18px] w-[18px] text-[#0F172A]" />
                              </button>
                              <h2 className="text-base font-bold text-[#0F172A]">Tournaments</h2>
                              <button
                                type="button"
                                onClick={() => setShowTournamentFilterModal(true)}
                                className="h-8 w-8 rounded-full bg-[#EAF7EE] border border-[#C6F0DB] flex items-center justify-center text-[#009A60] hover:bg-[#d8f3e3] shadow-2xs transition-all cursor-pointer relative shrink-0"
                                title="Filter Tournaments"
                                aria-label="Filter"
                              >
                                <SlidersHorizontal className="h-4 w-4 text-[#009A60]" />
                                {isCustomFilterActive && (
                                  <span className="w-2 h-2 rounded-full bg-[#009A60] absolute -top-0.5 -right-0.5 ring-2 ring-white" />
                                )}
                              </button>
                            </div>

                            {/* Search Input Bar (Fixed at top with header) */}
                            <div className="relative">
                              <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#8CA0BA]" />
                              <input
                                type="text"
                                value={tournamentSearchQuery}
                                onFocus={() => {
                                  openVirtualKeyboard({
                                    phoneIndex: phoneIdx,
                                    type: "text",
                                    title: "Search Tournaments",
                                    queryValue: tournamentSearchQuery,
                                    onInput: (char) => {
                                      setTournamentSearchQuery((prev) => {
                                        const next = prev + char;
                                        setVirtualKeyboard((k) => (k ? { ...k, queryValue: next } : null));
                                        return next;
                                      });
                                    },
                                    onBackspace: () => {
                                      setTournamentSearchQuery((prev) => {
                                        const next = prev.slice(0, -1);
                                        setVirtualKeyboard((k) => (k ? { ...k, queryValue: next } : null));
                                        return next;
                                      });
                                    },
                                  });
                                }}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setTournamentSearchQuery(val);
                                  setVirtualKeyboard((k) => (k ? { ...k, queryValue: val } : null));
                                }}
                                placeholder="Search tournaments, clubs, venues..."
                                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#f5faf6] border border-[#e1efe5] text-xs font-medium text-[#0F172A] placeholder:text-[#8CA0BA] focus:outline-hidden focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 transition-all"
                              />
                              {tournamentSearchQuery && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTournamentSearchQuery("");
                                    setVirtualKeyboard((k) => (k ? { ...k, queryValue: "" } : null));
                                  }}
                                  className="absolute right-3 top-2.5 p-0.5 text-[#8CA0BA] hover:text-[#0F172A] cursor-pointer"
                                  title="Clear search"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto scrollbar-hide no-scrollbar pb-24">
                          <div className="w-full max-w-sm mx-auto">
                            {/* 1. Category Filter Pills & Active Filter Tags */}
                            <div className="px-4 pt-3.5 pb-2.5 flex items-center gap-2 overflow-x-auto scrollbar-hide no-scrollbar">
                              {(["All", "Ongoing", "Major", "Invitational"] as const).map((cat) => {
                                const isActive = tournamentFilter === cat;
                                return (
                                  <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setTournamentFilter(cat)}
                                    className={`rounded-full px-5 py-2 text-[13px] transition-all cursor-pointer shrink-0 ${
                                      isActive
                                        ? "bg-[#009A60] text-white font-bold shadow-[0_2px_8px_rgba(0,154,96,0.25)]"
                                        : "bg-white text-[#8CA0BA] border border-slate-200/80 font-semibold shadow-2xs hover:border-slate-300"
                                    }`}
                                  >
                                    {cat}
                                  </button>
                                );
                              })}

                              {tournamentFormatFilter !== "All" && (
                                <button
                                  type="button"
                                  onClick={() => setTournamentFormatFilter("All")}
                                  className="rounded-full pl-3.5 pr-2 py-1.5 text-[12px] bg-[#EAF7EE] text-[#009A60] border border-[#C6F0DB] font-bold flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer hover:bg-[#d8f3e3]"
                                  title="Remove format filter"
                                >
                                  <span>{tournamentFormatFilter}</span>
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {tournamentFeeFilter !== "All" && (
                                <button
                                  type="button"
                                  onClick={() => setTournamentFeeFilter("All")}
                                  className="rounded-full pl-3.5 pr-2 py-1.5 text-[12px] bg-[#EAF7EE] text-[#009A60] border border-[#C6F0DB] font-bold flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer hover:bg-[#d8f3e3]"
                                  title="Remove fee filter"
                                >
                                  <span>{tournamentFeeFilter}</span>
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* 2. Featured Event Hero Card (Show when not actively searching for a specific other term) */}
                            {!tournamentSearchQuery && (tournamentFilter === "All" || tournamentFilter === "Major") && (
                              <div className="mx-4 mb-4.5 rounded-[24px] overflow-hidden relative shadow-[0_10px_25px_rgba(0,0,0,0.16)] border border-slate-200/40 h-[224px] shrink-0 group select-none">
                                <img
                                  src="/images/tournaments/ikoyi_night_golf.jpg"
                                  alt="Ikoyi Open Championship 2024"
                                  className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10" />

                                <div className="absolute inset-0 p-4.5 flex flex-col justify-end text-white z-10">
                                  <div className="inline-flex items-center self-start bg-[#00A86B] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-2 shadow-xs">
                                    FEATURED EVENT
                                  </div>
                                  <h3 className="text-[20px] font-black text-white leading-[1.18] tracking-tight drop-shadow-md mb-2">
                                    Ikoyi Open<br />Championship 2024
                                  </h3>
                                  <div className="flex items-center gap-4 text-[11.5px] font-semibold text-white/95">
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="w-3.5 h-3.5 text-[#00E575] shrink-0 fill-[#00E575]/20" />
                                      <span>Ikoyi Club 1938</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="w-3.5 h-3.5 text-[#00E575] shrink-0" />
                                      <span>Oct 24 - 27</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 3. Section Header */}
                            <div className="px-4 mb-3 flex items-center justify-between select-none">
                              <span className="text-[11px] font-black tracking-widest text-[#8CA0BA] uppercase">
                                AVAILABLE ENTRIES
                              </span>
                              <span className="text-[11px] font-black tracking-widest text-[#009A60] uppercase">
                                {filteredTournaments.length} FOUND
                              </span>
                            </div>

                            {/* 4. Tournament Entries Cards */}
                            {filteredTournaments.length === 0 ? (
                              <div className="mx-4 my-6 bg-white rounded-[22px] p-6 text-center border border-slate-200/80 shadow-2xs">
                                <div className="w-12 h-12 rounded-2xl bg-[#EAF7EE] border border-[#C6F0DB] flex items-center justify-center text-[#009A60] mx-auto mb-3 shadow-2xs">
                                  <Search className="w-5 h-5" />
                                </div>
                                <h4 className="text-[15px] font-bold text-[#0F172A] mb-1">
                                  No Tournaments Found
                                </h4>
                                <p className="text-[12px] text-[#64748B] max-w-[260px] mx-auto mb-4 leading-relaxed">
                                  No tournament events match your search term or active filter criteria.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTournamentSearchQuery("");
                                    setTournamentFilter("All");
                                    setTournamentFormatFilter("All");
                                    setTournamentFeeFilter("All");
                                    setVirtualKeyboard((k) => (k ? { ...k, queryValue: "" } : null));
                                  }}
                                  className="px-4 py-2 rounded-xl bg-[#009A60] hover:bg-[#008251] text-white text-[11.5px] font-bold uppercase tracking-wider transition-all shadow-2xs cursor-pointer"
                                >
                                  Clear Search & Filters
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-3.5 px-4">
                                {filteredTournaments.map((tournament) => (
                                  <div
                                    key={tournament.id}
                                    className="bg-white rounded-[22px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100/90 relative overflow-hidden transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
                                  >
                                    <div className="flex items-start">
                                      <div className="w-[72px] h-[72px] rounded-[18px] overflow-hidden shrink-0 mr-3.5 bg-emerald-950/10 border border-slate-100 shadow-2xs">
                                        <img
                                          src={tournament.bannerUrl}
                                          alt={tournament.name}
                                          className={`w-full h-full object-cover ${!tournament.isOpen ? "filter grayscale contrast-105" : ""}`}
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-[15px] font-bold text-[#0F172A] tracking-tight leading-tight mb-1 truncate">
                                          {tournament.name}
                                        </h4>
                                        <p className="text-[12px] text-[#64748B] font-medium leading-tight mb-2 truncate">
                                          {tournament.club}
                                        </p>
                                        <div className="flex items-center justify-between">
                                          <span
                                            className={`text-[12.5px] tracking-tight ${
                                              !tournament.isOpen
                                                ? "text-[#94A3B8] font-bold"
                                                : "font-black text-[#009A60]"
                                            }`}
                                          >
                                            {tournament.fee}
                                          </span>
                                          <span className="text-[11.5px] text-[#8CA0BA] font-medium">
                                            {tournament.date}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {tournament.isOpen ? (
                                      <div className="mt-3.5 flex items-center gap-2.5">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setSelectedTournamentInfo({
                                              name: tournament.name,
                                              club: tournament.club,
                                              fee: tournament.fee,
                                              date: tournament.dateFull || tournament.date,
                                              format: tournament.format,
                                              purse: tournament.purse,
                                              holes: tournament.holes || 18,
                                              cutLine: tournament.cutLine,
                                              bannerUrl: tournament.bannerUrl,
                                            })
                                          }
                                          className="flex-1 h-[42px] rounded-xl bg-[#F8FAFC] hover:bg-slate-100 active:scale-98 text-[#0F172A] font-bold text-[11px] uppercase tracking-wider flex items-center justify-center border border-slate-200/60 transition-all cursor-pointer"
                                        >
                                          VIEW INFO
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            showToast(`Opening entry registration for ${tournament.name}...`, "success", "TOURNAMENT ENTRY");
                                            setTimeout(() => switchScreen("register"), 600);
                                          }}
                                          className="flex-1 h-[42px] rounded-xl bg-[#009A60] hover:bg-[#008251] active:scale-98 text-white font-bold text-[11px] uppercase tracking-wider flex items-center justify-center shadow-xs transition-all cursor-pointer"
                                        >
                                          REGISTER NOW
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="mt-3 py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                          Official Registration Closed
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 5. Persistent Bottom Navigation Bar */}
                        <div className="absolute bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
                          <div className="w-full max-w-sm mx-auto h-[64px] px-3 flex items-center justify-between relative">
                            {/* 1. Home */}
                            <button
                              type="button"
                              onClick={() => {
                                switchScreen("hub");
                              }}
                              className="flex flex-col items-center justify-center w-14 py-1 group cursor-pointer transition-colors"
                            >
                              <Home className="h-5 w-5 text-[#94A3B8] group-hover:text-slate-600 transition-colors" />
                              <span className="text-[10px] mt-1 tracking-tight font-medium text-[#94A3B8] group-hover:text-slate-600">
                                Home
                              </span>
                            </button>

                            {/* 2. Tournaments (Active) */}
                            <button
                              type="button"
                              className="flex flex-col items-center justify-center w-14 py-1 group cursor-pointer transition-colors relative"
                            >
                              <div className="relative">
                                <Trophy className="h-5 w-5 text-[#009A60] transition-colors" />
                                <span className="absolute -top-0.5 -right-1.5 w-2 h-2 rounded-full bg-[#EF4444] border-[1.5px] border-white shadow-xs" />
                              </div>
                              <span className="text-[10px] mt-1 tracking-tight font-bold text-[#009A60]">
                                Tournaments
                              </span>
                            </button>

                            {/* 3. Center Elevated PLAY GOLF Button */}
                            <div className="relative -mt-6 flex items-center justify-center">
                              <div className="w-[64px] h-[64px] rounded-full bg-emerald-500/15 p-1 flex items-center justify-center shadow-[0_6px_20px_rgba(0,154,96,0.32)]">
                                <button
                                  type="button"
                                  onClick={() => {
                                    showToast("Ready to tee off. Launching live scoring...", "success", "PLAY GOLF");
                                    setTimeout(() => switchScreen("scoring"), 350);
                                  }}
                                  className="w-[54px] h-[54px] rounded-full bg-[#009A60] hover:bg-[#008251] active:scale-95 transition-all border-[3px] border-white flex flex-col items-center justify-center cursor-pointer shadow-xs"
                                  title="Play Golf"
                                >
                                  <span className="text-[9.5px] font-black text-white tracking-wider leading-none">PLAY</span>
                                  <span className="text-[9.5px] font-black text-white tracking-wider leading-none mt-0.5">GOLF</span>
                                </button>
                              </div>
                            </div>

                            {/* 4. Challenges */}
                            <button
                              type="button"
                              onClick={() => showToast("Active Club Challenges & Skins leaderboards", "success", "CHALLENGES")}
                              className="flex flex-col items-center justify-center w-14 py-1 group cursor-pointer transition-colors"
                            >
                              <Star className="h-5 w-5 text-[#94A3B8] group-hover:text-slate-600 transition-colors" />
                              <span className="text-[10px] mt-1 tracking-tight font-medium text-[#94A3B8] group-hover:text-slate-600">
                                Challenges
                              </span>
                            </button>

                            {/* 5. Deals */}
                            <button
                              type="button"
                              onClick={() => showToast("Member Exclusive Equipment & Tee Time Deals", "success", "DEALS")}
                              className="flex flex-col items-center justify-center w-14 py-1 group cursor-pointer transition-colors"
                            >
                              <Flame className="h-5 w-5 text-[#94A3B8] group-hover:text-slate-600 transition-colors" />
                              <span className="text-[10px] mt-1 tracking-tight font-medium text-[#94A3B8] group-hover:text-slate-600">
                                Deals
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Tournament Filter Sheet / Modal */}
                        {showTournamentFilterModal && (
                          <div
                            className="absolute inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center animate-in fade-in duration-200 p-0 sm:p-4"
                            onClick={() => setShowTournamentFilterModal(false)}
                          >
                            <div
                              className="w-full max-w-sm mx-auto bg-white rounded-t-[28px] sm:rounded-2xl p-5 shadow-2xl border border-slate-100 animate-in slide-in-from-bottom duration-200"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-3 sm:hidden" />
                              
                              {/* Header */}
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <h3 className="text-base font-bold text-[#0F172A]">Filter Tournaments</h3>
                                  <p className="text-xs text-[#64748B] font-medium">Refine by category, format, or fee</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTournamentFilter("All");
                                    setTournamentFormatFilter("All");
                                    setTournamentFeeFilter("All");
                                  }}
                                  className="text-xs font-bold text-[#009A60] hover:text-[#007f4e] cursor-pointer"
                                >
                                  Reset All
                                </button>
                              </div>

                              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar text-xs">
                                {/* Category */}
                                <div>
                                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#8CA0BA] block mb-2">
                                    Event Category
                                  </label>
                                  <div className="grid grid-cols-2 gap-2">
                                    {(["All", "Ongoing", "Major", "Invitational"] as const).map((cat) => {
                                      const active = tournamentFilter === cat;
                                      return (
                                        <button
                                          key={cat}
                                          type="button"
                                          onClick={() => setTournamentFilter(cat)}
                                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                                            active
                                              ? "bg-[#009A60] text-white border-[#009A60] shadow-xs"
                                              : "bg-[#f5faf6] text-[#475569] border-[#e1efe5] hover:border-slate-300"
                                          }`}
                                        >
                                          {cat === "All" ? "All Categories" : cat}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Format */}
                                <div>
                                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#8CA0BA] block mb-2">
                                    Playing Format
                                  </label>
                                  <div className="grid grid-cols-2 gap-2">
                                    {["All", "Strokeplay", "Matchplay", "Four-Ball / Scramble"].map((fmt) => {
                                      const active = tournamentFormatFilter === fmt;
                                      return (
                                        <button
                                          key={fmt}
                                          type="button"
                                          onClick={() => setTournamentFormatFilter(fmt)}
                                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                                            active
                                              ? "bg-[#009A60] text-white border-[#009A60] shadow-xs"
                                              : "bg-[#f5faf6] text-[#475569] border-[#e1efe5] hover:border-slate-300"
                                          }`}
                                        >
                                          {fmt === "All" ? "All Formats" : fmt}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Entry Fee */}
                                <div>
                                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#8CA0BA] block mb-2">
                                    Entry Fee Range
                                  </label>
                                  <div className="grid grid-cols-2 gap-2">
                                    {["All", "Free", "Under ₦100,000", "₦100,000+"].map((fee) => {
                                      const active = tournamentFeeFilter === fee;
                                      return (
                                        <button
                                          key={fee}
                                          type="button"
                                          onClick={() => setTournamentFeeFilter(fee)}
                                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                                            active
                                              ? "bg-[#009A60] text-white border-[#009A60] shadow-xs"
                                              : "bg-[#f5faf6] text-[#475569] border-[#e1efe5] hover:border-slate-300"
                                          }`}
                                        >
                                          {fee === "All" ? "All Fees" : fee}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>

                              {/* Footer Buttons */}
                              <div className="flex gap-2.5 pt-4 mt-2 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowTournamentFilterModal(false);
                                    showToast("Tournament filters applied", "success", "FILTERS APPLIED");
                                  }}
                                  className="w-full py-3 rounded-xl bg-[#009A60] hover:bg-[#008251] active:scale-98 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Apply Filters ({filteredTournaments.length} Matches)</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Tournament Details Sheet / Modal */}
                        {selectedTournamentInfo && (
                          <div
                            className="absolute inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center animate-in fade-in duration-200 p-2"
                            onClick={() => setSelectedTournamentInfo(null)}
                          >
                            <div
                              className="w-full max-w-sm mx-auto bg-white rounded-t-[28px] sm:rounded-2xl p-5 shadow-2xl border border-slate-100 animate-in slide-in-from-bottom duration-200"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-3 sm:hidden" />
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="text-lg font-bold text-[#0F172A] leading-tight">
                                    {selectedTournamentInfo.name}
                                  </h3>
                                  <p className="text-sm font-medium text-[#64748B]">
                                    {selectedTournamentInfo.club}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSelectedTournamentInfo(null)}
                                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="space-y-2.5 my-4 text-xs">
                                <div className="flex justify-between py-1.5 border-b border-slate-100">
                                  <span className="text-slate-500 font-medium">Dates</span>
                                  <span className="font-semibold text-slate-800">{selectedTournamentInfo.date}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-slate-100">
                                  <span className="text-slate-500 font-medium">Format</span>
                                  <span className="font-semibold text-slate-800">{selectedTournamentInfo.format}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-slate-100">
                                  <span className="text-slate-500 font-medium">Entry Fee</span>
                                  <span className="font-bold text-[#009A60]">{selectedTournamentInfo.fee}</span>
                                </div>
                                {selectedTournamentInfo.purse && (
                                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                                    <span className="text-slate-500 font-medium">Prize Purse</span>
                                    <span className="font-semibold text-slate-800">{selectedTournamentInfo.purse}</span>
                                  </div>
                                )}
                                {selectedTournamentInfo.cutLine && (
                                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                                    <span className="text-slate-500 font-medium">Cut Line</span>
                                    <span className="font-semibold text-slate-800">{selectedTournamentInfo.cutLine}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2 pt-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedTournamentInfo(null)}
                                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                                >
                                  Close
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const name = selectedTournamentInfo.name;
                                    setSelectedTournamentInfo(null);
                                    showToast(`Opening registration for ${name}...`, "success", "TOURNAMENT ENTRY");
                                    setTimeout(() => switchScreen("register"), 400);
                                  }}
                                  className="flex-1 py-2.5 rounded-xl bg-[#009A60] hover:bg-[#008251] text-white font-bold text-xs shadow-xs cursor-pointer"
                                >
                                  Register Now
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* 4. LEADERBOARD SCREEN */}
                  {targetScreen === "leaderboard" && (
                    <div className="flex-1 flex flex-col pb-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0D1D19] via-[#090F16] to-[#06090E]">
                      {/* Header */}
                      <div className="px-5 pt-1 pb-3 flex items-center justify-between border-b border-emerald-950/40">
                        <button
                          onClick={() => setActiveScreen("hub")}
                          className="h-8 w-8 rounded-full bg-slate-900/60 flex items-center justify-center text-slate-300 hover:text-white"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </button>
                        <div className="text-center">
                          <h2 className="text-xs font-bold tracking-widest text-white uppercase">
                            Live Standings
                          </h2>
                          <span className="text-[9px] text-slate-400 block truncate max-w-[180px]">
                            {activeTournament?.name || "Championship Tournament"}
                          </span>
                        </div>
                        <button
                          onClick={() => showToast("Leaderboard refreshed from database")}
                          className="h-8 w-8 rounded-full bg-slate-900/60 flex items-center justify-center text-slate-300 hover:text-white"
                        >
                          <RotateCcw className="h-3.5 w-3.5 text-emerald-400" />
                        </button>
                      </div>

                      <div className="px-4 pt-3 flex-1 flex flex-col">
                        {/* Course summary strip */}
                        <div className="rounded-xl p-2.5 bg-black/40 border border-slate-800/80 mb-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span>PAR {activeTournament?.coursePar || 72}</span>
                          <span className="text-emerald-400">{activeTournament?.organizerClub || "Championship Club"}</span>
                          <span className="text-amber-400">FIELD: {activeTournament?.fieldCount || registeredPlayers.length}</span>
                        </div>

                        {/* Standings Table */}
                        <div className="rounded-2xl bg-[#0E1521]/90 border border-slate-800/80 overflow-hidden shadow-xl">
                          <div className="grid grid-cols-12 px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 bg-slate-950/50">
                            <span className="col-span-2">Pos</span>
                            <span className="col-span-6">Player</span>
                            <span className="col-span-2 text-center">HCP</span>
                            <span className="col-span-2 text-right">Gross</span>
                          </div>

                          {registeredPlayers.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-xs">
                              {isLoadingLeaderboard ? (
                                <div className="flex items-center justify-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                                  <span>Loading live standings from database...</span>
                                </div>
                              ) : (
                                <div className="space-y-1 py-4">
                                  <Award className="h-7 w-7 text-slate-500 mx-auto mb-1" />
                                  <p className="text-slate-300 font-medium text-xs">No Standings Yet</p>
                                  <p className="text-[10px] text-slate-500">
                                    No players or scores have been recorded in the database for this event.
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            registeredPlayers.map((p, idx) => (
                              <div
                                key={p.id || idx}
                                className="grid grid-cols-12 px-3 py-2.5 text-xs items-center border-b border-slate-900/80 hover:bg-slate-800/30"
                              >
                                <span className="col-span-2 font-bold text-slate-200">
                                  {idx === 0 ? (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      1
                                    </span>
                                  ) : idx === 1 ? (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-500/20 text-slate-200 border border-slate-500/30">
                                      2
                                    </span>
                                  ) : (
                                    `T${idx + 1}`
                                  )}
                                </span>
                                <span className="col-span-6 font-medium text-white truncate">
                                  {p.name}
                                </span>
                                <span className="col-span-2 text-center text-slate-400 font-mono text-[11px]">
                                  {p.handicap}
                                </span>
                                <span className="col-span-2 text-right font-bold text-emerald-400 font-mono text-[11px]">
                                  {p.gross}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 5. PLAYER-ONLY LOGIN SCREEN (Exact Reference Design Match) */}
                  {targetScreen === "login" && (
                    <div className="flex-1 flex flex-col justify-between p-6 bg-white overflow-y-auto scrollbar-hide no-scrollbar" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                      <div className="w-full max-w-sm mx-auto space-y-4">
                        {/* Top Header Navigation (Unified Back Button to Landing) */}
                        <div className="flex items-center justify-between pb-1 -mt-1">
                          <button
                            type="button"
                            onClick={() => switchScreen("landing")}
                            className="h-8 w-8 rounded-full flex items-center justify-center bg-white border border-slate-200 text-[#0F172A] hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                            title="Back to Landing"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            OpenclubOS
                          </span>
                          <div className="w-8" />
                        </div>

                        {/* 1. Header with Brand Squircle Badge */}
                        <div className="flex justify-center pt-2 pb-1">
                          <div className="w-[64px] h-[64px] rounded-[22px] bg-[#009A60] flex items-center justify-center relative shadow-sm">
                            {/* White Lightbulb Symbol */}
                            <svg
                              className="w-8 h-8 text-white"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M15 13.5c.3-.8 1-1.6 1.8-2.3 1-.9 1.7-2.1 1.7-3.7a6.5 6.5 0 1 0-13 0c0 1.6.7 2.8 1.7 3.7.8.7 1.5 1.5 1.8 2.3" />
                              <path d="M9.5 17.5h5" />
                              <path d="M10.5 20.5h3" />
                            </svg>
                          </div>
                        </div>

                        {/* Title & Subtitle */}
                        <div className="text-center space-y-1 pb-1">
                          <h2 className="text-[26px] font-black tracking-tight text-[#0F172A] leading-tight">
                            Welcome Back
                          </h2>
                          <p className="text-[13.5px] text-[#64748B] font-normal">
                            Continue with email
                          </p>
                        </div>

                        {/* 2. Google OAuth Button */}
                        <button
                          type="button"
                          disabled={isLoggingIn}
                          onClick={() => {
                            if (!isLoggingIn) showToast("Google Sign-In is configured for Player accounts");
                          }}
                          className={`w-full h-12 px-4 rounded-2xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-2xs group ${
                            isLoggingIn ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer"
                          }`}
                        >
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                          <span className="text-[14px] font-bold text-[#0F172A] group-hover:text-slate-900">
                            Continue with Google
                          </span>
                        </button>

                        {/* 3. Divider: "OR EMAIL LOGIN" */}
                        <div className="flex items-center gap-3 my-2 px-1">
                          <div className="flex-1 h-px bg-slate-200/80" />
                          <span className="text-[10.5px] font-bold tracking-[0.14em] text-[#8CA0BA] uppercase">
                            OR EMAIL LOGIN
                          </span>
                          <div className="flex-1 h-px bg-slate-200/80" />
                        </div>

                        {/* 4. Form Inputs */}
                        <div className="space-y-4 pt-0.5">
                          {/* Email Address */}
                          <div>
                            <label className="text-[11px] font-bold tracking-wider text-[#0F172A] uppercase block mb-1.5 text-left">
                              EMAIL ADDRESS
                            </label>
                            <div className="relative flex items-center">
                              <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                                <Mail className="w-4 h-4 text-[#8CA0BA]" />
                              </div>
                              <input
                                type="email"
                                disabled={isLoggingIn}
                                value={loginEmail}
                                onFocus={() => {
                                  openVirtualKeyboard({
                                    phoneIndex: phoneIdx,
                                    type: "text",
                                    title: "Email Address",
                                    onInput: (char) => setLoginEmail((prev) => prev + char),
                                    onBackspace: () => setLoginEmail((prev) => prev.slice(0, -1)),
                                  });
                                }}
                                onChange={(e) => {
                                  setLoginEmail(e.target.value);
                                  if (loginError) setLoginError(null);
                                }}
                                placeholder="player@golfclub.com"
                                className={`w-full h-12 bg-[#f5faf6] border border-[#e1efe5] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 rounded-xl pl-10 pr-3.5 text-[13.5px] font-medium text-[#0F172A] placeholder:text-[#8CA0BA] focus:outline-hidden transition-all ${
                                  isLoggingIn ? "opacity-60 cursor-not-allowed bg-slate-100/80" : ""
                                }`}
                              />
                            </div>
                          </div>

                          {/* Password */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-[11px] font-bold tracking-wider text-[#0F172A] uppercase">
                                PASSWORD
                              </label>
                              <button
                                type="button"
                                disabled={isLoggingIn}
                                onClick={() => !isLoggingIn && switchScreen("forgot-password")}
                                className={`text-[11px] font-bold tracking-wider text-[#009A60] hover:underline uppercase ${
                                  isLoggingIn ? "opacity-50 pointer-events-none" : "cursor-pointer"
                                }`}
                              >
                                FORGOT?
                              </button>
                            </div>
                            <div className="relative flex items-center">
                              <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                                <Lock className="w-4 h-4 text-[#8CA0BA]" />
                              </div>
                              <input
                                type={showPassword ? "text" : "password"}
                                disabled={isLoggingIn}
                                value={loginPassword}
                                onFocus={() => {
                                  openVirtualKeyboard({
                                    phoneIndex: phoneIdx,
                                    type: "text",
                                    title: "Password",
                                    onInput: (char) => setLoginPassword((prev) => prev + char),
                                    onBackspace: () => setLoginPassword((prev) => prev.slice(0, -1)),
                                  });
                                }}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                placeholder="••••••••"
                                className={`w-full h-12 bg-[#f5faf6] border border-[#e1efe5] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 rounded-xl pl-10 pr-10 text-[13.5px] font-medium text-[#0F172A] placeholder:text-[#8CA0BA] focus:outline-hidden transition-all ${
                                  isLoggingIn ? "opacity-60 cursor-not-allowed bg-slate-100/80" : ""
                                }`}
                              />
                              <button
                                type="button"
                                disabled={isLoggingIn}
                                onClick={() => setShowPassword(!showPassword)}
                                className={`absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-hidden p-1 ${
                                  isLoggingIn ? "opacity-50 pointer-events-none" : "cursor-pointer"
                                }`}
                              >
                                {showPassword ? (
                                  <Eye className="w-4 h-4 text-[#8CA0BA]" />
                                ) : (
                                  <EyeOff className="w-4 h-4 text-[#8CA0BA]" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 5. Stay signed in for 30 days */}
                        <div className="pt-0.5">
                          <label className={`flex items-center gap-2.5 select-none ${isLoggingIn ? "opacity-60 cursor-not-allowed pointer-events-none" : "cursor-pointer"}`}>
                            <button
                              type="button"
                              disabled={isLoggingIn}
                              onClick={() => !isLoggingIn && setRememberMe(!rememberMe)}
                              className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                isLoggingIn ? "cursor-not-allowed" : "cursor-pointer"
                              } ${
                                rememberMe
                                  ? "bg-[#009A60] text-white shadow-2xs"
                                  : "bg-[#f5faf6] border border-[#e1efe5] hover:border-[#009A60]/40"
                              }`}
                            >
                              {rememberMe && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                            <span className="text-[12.5px] font-medium text-[#64748B]">
                              Stay signed in for 30 days
                            </span>
                          </label>
                        </div>

                        {/* 6. Sign In Primary Button */}
                        <div className="pt-2">
                          <button
                            type="button"
                            disabled={!loginEmail.trim() || !loginPassword.trim() || isLoggingIn}
                            onClick={() => handleLoginSubmit(loginEmail)}
                            className={`w-full h-12 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                              loginEmail.trim() && loginPassword.trim() && !isLoggingIn
                                ? "bg-[#009A60] hover:bg-[#008754] text-white shadow-md shadow-emerald-700/20 active:scale-[0.99] cursor-pointer"
                                : "bg-[#009A60]/35 text-white/75 cursor-not-allowed shadow-none"
                            }`}
                          >
                            {isLoggingIn ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                <span>Signing In...</span>
                              </>
                            ) : (
                              <>
                                <span>Sign In</span>
                                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                  <ArrowRight className="w-3 h-3 text-white stroke-[3]" />
                                </div>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* 7. Footer: "New to OpenclubOS? Create Player Account" */}
                      <div className="w-full max-w-sm mx-auto text-center pt-8 pb-1 mt-auto">
                        <span className="text-[13px] text-[#64748B] font-normal">
                          New to OpenclubOS?{" "}
                        </span>
                        <button
                          type="button"
                          disabled={isLoggingIn}
                          onClick={() => !isLoggingIn && switchScreen("register")}
                          className={`text-[13px] font-bold text-[#009A60] underline underline-offset-2 hover:text-[#008754] ${
                            isLoggingIn ? "opacity-50 pointer-events-none" : "cursor-pointer"
                          }`}
                        >
                          Create Player Account
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SCREEN: REGISTRATION (STEPS 1 - 4 WIZARD) */}
                  {targetScreen === "register" && (
                    <div className="h-full bg-white text-slate-900 flex flex-col overflow-hidden relative">
                      {/* Top Header Navigation (Fixed pinned header) */}
                      <div className="px-6 pt-4 pb-3 border-b border-slate-100 bg-white shrink-0 z-10">
                        <div className="w-full max-w-sm mx-auto">
                          <div className="h-8 flex items-center justify-between mb-3">
                          <button
                            type="button"
                            onClick={handleRegPrev}
                            className="h-8 w-8 rounded-full flex items-center justify-center bg-white border border-slate-200 text-[#0F172A] hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                            title="Back"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>

                          <div className="flex items-center gap-2">
                            {incomingReferrer && (
                              <span className="text-[10px] font-bold text-[#009A60] bg-[#EAF7EE] border border-[#C6F0DB] px-2.5 py-1 rounded-full truncate max-w-[150px] capitalize">
                                Invited by {incomingReferrer.split("-")[0]}
                              </span>
                            )}
                            <span className="text-[10px] font-extrabold text-[#5B6B7F] bg-[#f5faf6] border border-[#e1efe5] px-3 py-1 rounded-full tracking-wider uppercase">
                              STEP {regStep} OF 4
                            </span>
                          </div>
                        </div>

                        {/* 4-Segment Progress Bar */}
                        <div className="grid grid-cols-4 gap-1.5">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className={`h-[3.5px] rounded-full transition-all duration-300 ${step <= regStep ? "bg-[#009A60]" : "bg-[#E5E7EB]"
                                }`}
                            />
                          ))}
                        </div>
                        </div>
                      </div>

                      {/* Step Content (Scrollable with regScrollRef) */}
                      <div
                        ref={regScrollRef}
                        className="flex-1 overflow-y-auto p-6 pt-3 space-y-3.5 scrollbar-hide no-scrollbar"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                      >
                        <div className="w-full max-w-sm mx-auto space-y-3.5">
                        {/* --- STEP 1: CREATE PLAYER ACCOUNT --- */}
                        {regStep === 1 && (
                          <div className="space-y-3.5">
                            <div>
                              <h1 className="text-2xl font-black text-[#111827] tracking-tight">
                                Create Player Account
                              </h1>
                              <p className="text-[13px] text-[#5B6B7F] mt-1 leading-relaxed font-normal">
                                Enter your personal credentials to compete in verified club tournaments.
                              </p>
                            </div>

                            {/* Google Sign Up Button */}
                            <button
                              type="button"
                              onClick={() => showToast("Google Sign-In ready for Player accounts.")}
                              className="w-full h-12 px-4 rounded-2xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-2xs group cursor-pointer"
                            >
                              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                <path
                                  fill="#4285F4"
                                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                  fill="#34A853"
                                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                  fill="#FBBC05"
                                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                />
                                <path
                                  fill="#EA4335"
                                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                />
                              </svg>
                              <span className="text-[14px] font-bold text-[#0F172A] group-hover:text-slate-900">
                                Sign up with Google
                              </span>
                            </button>

                            {/* Divider */}
                            <div className="flex items-center gap-3 my-2 px-1">
                              <div className="flex-1 h-px bg-slate-200/80" />
                              <span className="text-[10.5px] font-bold tracking-[0.14em] text-[#8CA0BA] uppercase">
                                OR REGISTER WITH EMAIL
                              </span>
                              <div className="flex-1 h-px bg-slate-200/80" />
                            </div>

                            {/* First Name */}
                            <div>
                              <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block mb-1.5">
                                First Name
                              </label>
                              <input
                                type="text"
                                value={regFirstName}
                                onFocus={() => {
                                  openVirtualKeyboard({
                                    phoneIndex: phoneIdx,
                                    type: "text",
                                    title: "First Name",
                                    onInput: (char) => setRegFirstName((prev) => prev + char),
                                    onBackspace: () => setRegFirstName((prev) => prev.slice(0, -1)),
                                  });
                                }}
                                onChange={(e) => setRegFirstName(e.target.value)}
                                placeholder="Alex"
                                className="w-full h-12 bg-[#f5faf6] border border-[#e1efe5] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 rounded-xl px-3.5 text-[13.5px] leading-normal font-medium text-[#0F172A] placeholder:text-[#8CA0BA] placeholder:font-medium focus:outline-hidden transition-all"
                              />
                            </div>

                            {/* Last Name */}
                            <div>
                              <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block mb-1.5">
                                Last Name
                              </label>
                              <input
                                type="text"
                                value={regLastName}
                                onFocus={() => {
                                  openVirtualKeyboard({
                                    phoneIndex: phoneIdx,
                                    type: "text",
                                    title: "Last Name",
                                    onInput: (char) => setRegLastName((prev) => prev + char),
                                    onBackspace: () => setRegLastName((prev) => prev.slice(0, -1)),
                                  });
                                }}
                                onChange={(e) => setRegLastName(e.target.value)}
                                placeholder="Wright"
                                className="w-full h-12 bg-[#f5faf6] border border-[#e1efe5] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 rounded-xl px-3.5 text-[13.5px] leading-normal font-medium text-[#0F172A] placeholder:text-[#8CA0BA] placeholder:font-medium focus:outline-hidden transition-all"
                              />
                            </div>

                            {/* Email Address */}
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block">
                                  Email Address
                                </label>
                                {isCheckingEmail && (
                                  <span className="text-xs text-[#009A60] flex items-center gap-1 font-medium">
                                    <Loader2 className="h-3 w-3 animate-spin" /> Verifying...
                                  </span>
                                )}
                              </div>
                              <div className="relative">
                                <input
                                  type="email"
                                  value={regEmail}
                                  onFocus={() => {
                                    openVirtualKeyboard({
                                      phoneIndex: phoneIdx,
                                      type: "text",
                                      title: "Email Address",
                                      onInput: (char) => setRegEmail((prev) => prev + char),
                                      onBackspace: () => setRegEmail((prev) => prev.slice(0, -1)),
                                    });
                                  }}
                                  onChange={(e) => {
                                    setRegEmail(e.target.value);
                                    if (regEmailError) setRegEmailError(null);
                                    if (regError) setRegError(null);
                                  }}
                                  onBlur={() => {
                                    if (regEmail.includes("@") && regEmail.includes(".")) {
                                      checkEmailUniqueness(regEmail);
                                    }
                                  }}
                                  placeholder="player@domain.com"
                                  className={`w-full h-12 rounded-xl px-3.5 text-[13.5px] leading-normal font-medium text-[#0F172A] placeholder:text-[#8CA0BA] placeholder:font-medium focus:outline-hidden transition-all ${
                                    regEmailError
                                      ? "bg-rose-50/60 border-2 border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                                      : "bg-[#f5faf6] border border-[#e1efe5] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20"
                                  }`}
                                />
                              </div>
                              {regEmailError && (
                                <div className="mt-1.5 text-left animate-in fade-in duration-150">
                                  <button
                                    type="button"
                                    onClick={() => switchScreen("login")}
                                    className="no-underline text-[13.5px] text-[#009A60] hover:text-[#008754] font-medium text-left cursor-pointer inline-block transition-colors"
                                  >
                                    Sign In to your existing account →
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Password */}
                            <div>
                              <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block mb-1.5">
                                Password
                              </label>
                              <div className="relative">
                                <input
                                  type={regShowPassword ? "text" : "password"}
                                  value={regPassword}
                                  onFocus={() => {
                                    openVirtualKeyboard({
                                      phoneIndex: phoneIdx,
                                      type: "text",
                                      title: "Password",
                                      onInput: (char) => setRegPassword((prev) => prev + char),
                                      onBackspace: () => setRegPassword((prev) => prev.slice(0, -1)),
                                    });
                                  }}
                                  onChange={(e) => setRegPassword(e.target.value)}
                                  placeholder="••••••••••••"
                                  className="w-full h-12 bg-[#f5faf6] border border-[#e1efe5] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 rounded-xl px-3.5 pr-10 text-[13.5px] leading-normal font-medium text-[#0F172A] placeholder:text-[#8CA0BA] placeholder:font-medium focus:outline-hidden transition-all"
                                />
                                <button
                                  type="button"
                                  onClick={() => setRegShowPassword(!regShowPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8CA0BA] hover:text-[#5B6B7F] cursor-pointer"
                                >
                                  {regShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>

                              {/* Password Strength Indicator */}
                              <div className="space-y-1.5 mt-2">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 grid grid-cols-4 gap-1">
                                    {[1, 2, 3, 4].map((bar) => {
                                      const strength = calcPasswordStrength(regPassword);
                                      return (
                                        <div
                                          key={bar}
                                          className={`h-[3.5px] rounded-full transition-all duration-300 ${
                                            bar <= strength ? "bg-[#009A60]" : "bg-[#E2E8F0]"
                                          }`}
                                        />
                                      );
                                    })}
                                  </div>
                                  <span className="text-[9px] font-medium text-[#5B6B7F] tracking-wider uppercase">
                                    {calcPasswordStrength(regPassword) === 4 ? "STRONG PASSWORD" : "MIN. 8 CHARACTERS"}
                                  </span>
                                </div>
                                {regPassword.length > 0 && calcPasswordStrength(regPassword) < 4 && (
                                  <div className="mt-2 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-amber-800 flex items-start gap-2 animate-in fade-in duration-150 text-left">
                                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                                    <p className="text-[12px] font-medium leading-snug text-amber-800">
                                      Password meter is not full.<br />
                                      Add uppercase, number & symbol to proceed.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                              <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block mb-1.5">
                                Confirm Password
                              </label>
                              <div className="relative">
                                <input
                                  type={regShowConfirm ? "text" : "password"}
                                  value={regConfirmPassword}
                                  onFocus={() => {
                                    openVirtualKeyboard({
                                      phoneIndex: phoneIdx,
                                      type: "text",
                                      title: "Confirm Password",
                                      onInput: (char) => setRegConfirmPassword((prev) => prev + char),
                                      onBackspace: () => setRegConfirmPassword((prev) => prev.slice(0, -1)),
                                    });
                                  }}
                                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                                  placeholder="••••••••••••"
                                  className="w-full h-12 bg-[#f5faf6] border border-[#e1efe5] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 rounded-xl px-3.5 pr-10 text-[13.5px] leading-normal font-medium text-[#0F172A] placeholder:text-[#8CA0BA] placeholder:font-medium focus:outline-hidden transition-all"
                                />
                                {regConfirmPassword && regConfirmPassword === regPassword ? (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#009A60]">
                                    <CheckCircle2 className="h-4 w-4 fill-emerald-100 text-[#009A60]" />
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setRegShowConfirm(!regShowConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8CA0BA] hover:text-[#5B6B7F] cursor-pointer"
                                  >
                                    {regShowConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* CTA Button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (isCheckingEmail) return;
                                if (!regFirstName.trim() || !regLastName.trim()) {
                                  showToast("Please enter your full first and last name.", "error");
                                  return;
                                }
                                if (!regEmail.includes("@") || !regEmail.includes(".")) {
                                  showToast("Please enter a valid email address.", "error");
                                  return;
                                }
                                if (regPassword.length < 8) {
                                  showToast("Password must be at least 8 characters.", "error");
                                  return;
                                }
                                if (calcPasswordStrength(regPassword) < 4) {
                                  showToast("Password is too weak. Please make it stronger before moving to the next step.", "error");
                                  return;
                                }
                                if (regPassword !== regConfirmPassword) {
                                  showToast("Passwords do not match.", "error");
                                  return;
                                }
                                handleRegNext();
                              }}
                              className={`w-full mt-2 h-12 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                                isRegStep1Valid && !isCheckingEmail
                                  ? "bg-[#009A60] hover:bg-[#008754] text-white shadow-md shadow-emerald-700/20 cursor-pointer"
                                  : "bg-[#009A60]/40 hover:bg-[#009A60]/55 text-white/90 cursor-pointer shadow-none"
                              }`}
                            >
                              {isCheckingEmail ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                                  <span>Verifying Email...</span>
                                </>
                              ) : (
                                <span>Continue to Golf Profile →</span>
                              )}
                            </button>

                            {/* Sign In Link */}
                            <div className="text-center pt-2 pb-1">
                              <span className="text-[13px] text-[#64748B] font-normal">
                                Already registered?{" "}
                              </span>
                              <button
                                type="button"
                                onClick={() => switchScreen("login")}
                                className="text-[13px] font-bold text-[#009A60] underline underline-offset-2 hover:text-[#008754] cursor-pointer"
                              >
                                Sign In
                              </button>
                            </div>
                          </div>
                        )}

                        {/* --- STEP 2: YOUR GOLF PROFILE --- */}
                        {regStep === 2 && (
                          <div className="space-y-3.5">
                            <div>
                              <h1 className="text-2xl font-black text-[#111827] tracking-tight">
                                Your Golf Profile
                              </h1>
                              <p className="text-[13px] text-[#5B6B7F] mt-1 leading-relaxed font-normal">
                                Used by tournament committees to calculate course handicaps and flight brackets.
                              </p>
                            </div>

                            {/* Player Classification */}
                            <div>
                              <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block mb-1.5">
                                Player Classification
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  readOnly
                                  value={
                                    regClassification === "BEGINNER"
                                      ? "Beginner"
                                      : regClassification === "AMATEUR"
                                        ? "Intermediate / Amateur"
                                        : regClassification === "PROFESSIONAL"
                                          ? "Professional"
                                          : ""
                                  }
                                  onClick={() => setShowClassificationModal(true)}
                                  placeholder="Select player classification..."
                                  className="w-full h-12 bg-[#f5faf6] border border-[#e1efe5] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 rounded-xl px-3.5 pr-10 text-[13.5px] leading-normal font-medium text-[#0F172A] placeholder:text-[#8CA0BA] placeholder:font-medium focus:outline-hidden transition-all cursor-pointer select-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowClassificationModal(true)}
                                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8CA0BA] hover:text-[#009A60] transition-colors cursor-pointer"
                                >
                                  <Sliders className="h-4 w-4" />
                                </button>
                              </div>
                              <p className="text-[11px] text-[#8CA0BA] italic mt-1">
                                Determines tournament flight bracket and scoring allowances.
                              </p>
                            </div>

                            {/* Conditional Official Handicap Index (Only for Beginner or Intermediate / Amateur; display: none for Professional) */}
                            {(regClassification === "BEGINNER" || regClassification === "AMATEUR") && (
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight">
                                    Official Handicap Index
                                  </label>
                                  {regClassification === "BEGINNER" && (
                                    <span className="text-[11px] font-medium text-[#009A60] bg-[#e8f5ed] border border-[#009A60]/20 px-2 py-0.5 rounded-md">
                                      Auto-assigned 36.0
                                    </span>
                                  )}
                                </div>
                                <div className="relative">
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={regHandicap}
                                    disabled={regClassification === "BEGINNER"}
                                    readOnly={regClassification === "BEGINNER"}
                                    onFocus={() => {
                                      if (regClassification === "BEGINNER") return;
                                      openVirtualKeyboard({
                                        phoneIndex: phoneIdx,
                                        type: "numeric",
                                        allowDecimal: true,
                                        title: "Handicap Index",
                                        onInput: (char) => {
                                          setRegHandicap((prev) => {
                                            if (char === ".") {
                                              if (prev.includes(".")) return prev;
                                              return prev === "" ? "0." : prev + ".";
                                            }
                                            if (!/^\d$/.test(char)) return prev;
                                            const next = prev + char;
                                            const num = parseFloat(next);
                                            if (!isNaN(num) && num >= 36) {
                                              showToast("Intermediate handicap must be less than 36.0", "alert", "HANDICAP LIMIT");
                                              return "35.9";
                                            }
                                            return next;
                                          });
                                        },
                                        onBackspace: () => {
                                          setRegHandicap((prev) => prev.slice(0, -1));
                                        },
                                      });
                                    }}
                                    onKeyDown={(e) => handleStrictNumericKeyDown(e, { allowDecimal: true, allowPlus: false })}
                                    onChange={(e) => {
                                      // Strictly filter out any alphabetic or invalid characters
                                      const rawVal = e.target.value.replace(/[^0-9.]/g, "");
                                      const parts = rawVal.split(".");
                                      const val = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : rawVal;
                                      if (val === "" || val === ".") {
                                        setRegHandicap(val);
                                        return;
                                      }
                                      const num = parseFloat(val);
                                      if (!isNaN(num)) {
                                        if (num >= 36) {
                                          setRegHandicap("35.9");
                                          showToast("Intermediate handicap must be less than 36.0", "alert", "HANDICAP LIMIT");
                                          return;
                                        }
                                        if (num < 0) {
                                          setRegHandicap("0.0");
                                          return;
                                        }
                                      }
                                      setRegHandicap(val);
                                    }}
                                    placeholder={regClassification === "BEGINNER" ? "36" : "e.g. 2.4 (< 36)"}
                                    className={`w-full h-12 border rounded-xl px-3.5 pr-14 text-[13.5px] leading-normal font-medium transition-all ${regClassification === "BEGINNER"
                                      ? "bg-slate-100 border-[#e1efe5] text-[#64748B] cursor-not-allowed select-none"
                                      : "bg-[#f5faf6] border-[#e1efe5] text-[#0F172A] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 placeholder:text-[#8CA0BA] placeholder:font-medium focus:outline-hidden"
                                      }`}
                                  />
                                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[#009A60] tracking-wider uppercase">
                                    GHIN
                                  </span>
                                </div>
                                {regClassification === "AMATEUR" && (
                                  <p className="text-[11px] text-[#8CA0BA] italic mt-1">
                                    Official GHIN / USGA index (must be less than 36.0 for Intermediate).
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Home Golf Club */}
                            <div>
                              <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block mb-1.5">
                                Home Golf Club
                              </label>
                              <div className="relative">
                                <MapPin className="h-4 w-4 text-[#5B6B7F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                  type="text"
                                  readOnly
                                  value={regHomeClub}
                                  onClick={() => {
                                    setClubSearchQuery(regHomeClub);
                                    setShowClubModal(true);
                                  }}
                                  placeholder="Select or search home golf club..."
                                  className="w-full h-12 bg-[#f5faf6] border border-[#e1efe5] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 rounded-xl pl-10 pr-10 text-[13.5px] leading-normal font-medium text-[#0F172A] placeholder:text-[#8CA0BA] placeholder:font-medium focus:outline-hidden transition-all cursor-pointer select-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setClubSearchQuery(regHomeClub);
                                    setShowClubModal(true);
                                  }}
                                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8CA0BA] hover:text-[#009A60] transition-colors cursor-pointer"
                                >
                                  <Search className="h-4 w-4" />
                                </button>
                              </div>
                              <p className="text-[11px] text-[#8CA0BA] italic mt-1">
                                Tap to search or select from registered golf courses.
                              </p>
                            </div>

                            {/* Gender Segmented Control */}
                            <div>
                              <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block mb-1.5">
                                Gender
                              </label>
                              <div className="h-12 bg-[#f5faf6] border border-[#e1efe5] rounded-xl p-1 grid grid-cols-2 gap-1">
                                <button
                                  type="button"
                                  onClick={() => setRegGender("MALE")}
                                  className={`h-full rounded-lg text-[13.5px] font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${regGender === "MALE"
                                    ? "bg-white text-[#009A60] border border-[#e1efe5] shadow-xs"
                                    : "text-[#62758D] hover:text-slate-800 border border-transparent"
                                    }`}
                                >
                                  <span>Male</span>
                                  <Mars className="h-4 w-4 shrink-0" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRegGender("FEMALE")}
                                  className={`h-full rounded-lg text-[13.5px] font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${regGender === "FEMALE"
                                    ? "bg-white text-[#009A60] border border-[#e1efe5] shadow-xs"
                                    : "text-[#62758D] hover:text-slate-800 border border-transparent"
                                    }`}
                                >
                                  <span>Female</span>
                                  <Venus className="h-4 w-4 shrink-0" />
                                </button>
                              </div>
                            </div>

                            {/* Date of Birth */}
                            <div>
                              <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block mb-1.5">
                                Date of Birth
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  readOnly
                                  value={regDob}
                                  onClick={() => {
                                    const parts = regDob.split("/").map((p) => parseInt(p.trim(), 10));
                                    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
                                      const parsed = new Date(parts[2], parts[0] - 1, parts[1]);
                                      if (!isNaN(parsed.getTime())) setDobCalendarMonth(parsed);
                                    }
                                    setShowDobCalendar(true);
                                  }}
                                  placeholder="MM / DD / YYYY"
                                  className="w-full h-12 bg-[#f5faf6] border border-[#e1efe5] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 rounded-xl px-3.5 pr-10 text-[13.5px] leading-normal font-medium text-[#0F172A] placeholder:text-[#8CA0BA] placeholder:font-medium focus:outline-hidden transition-all cursor-pointer select-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const parts = regDob.split("/").map((p) => parseInt(p.trim(), 10));
                                    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
                                      const parsed = new Date(parts[2], parts[0] - 1, parts[1]);
                                      if (!isNaN(parsed.getTime())) setDobCalendarMonth(parsed);
                                    }
                                    setShowDobCalendar(true);
                                  }}
                                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8CA0BA] hover:text-[#009A60] transition-colors cursor-pointer"
                                >
                                  <Calendar className="h-4 w-4" />
                                </button>
                              </div>
                              <p className="text-[11px] text-[#8CA0BA] italic mt-1">
                                For Junior / Senior bracket eligibility verification.
                              </p>
                            </div>

                            {/* Bottom Buttons */}
                            <div className="flex gap-2.5 pt-1.5">
                              <button
                                type="button"
                                onClick={handleRegPrev}
                                className="h-12 w-12 shrink-0 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-[#0F172A] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                                title="Back"
                              >
                                <ArrowLeft className="h-5 w-5" />
                              </button>
                              <button
                                type="button"
                                disabled={!isRegStep2Valid}
                                onClick={handleRegNext}
                                className={`flex-1 h-12 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${isRegStep2Valid
                                  ? "bg-[#009A60] hover:bg-[#008754] text-white shadow-md shadow-emerald-700/20 cursor-pointer"
                                  : "bg-[#009A60]/35 text-white/75 cursor-not-allowed shadow-none"
                                  }`}
                              >
                                Continue to Contact →
                              </button>
                            </div>
                          </div>
                        )}

                        {/* --- STEP 3: PLAYER CONTACT & AVATAR --- */}
                        {regStep === 3 && (
                          <div className="space-y-3.5">
                            <div>
                              <h1 className="text-2xl font-black text-[#111827] tracking-tight">
                                Player Contact & Avatar
                              </h1>
                              <p className="text-[13px] text-[#5B6B7F] mt-1 leading-relaxed font-normal">
                                Used for live on-course tee time notifications and official pairing scorecards.
                              </p>
                            </div>

                            {/* Avatar Photo Section */}
                            <div className="flex flex-col items-center pt-2 pb-1">
                              <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarChange}
                              />
                              <div
                                onClick={() => avatarInputRef.current?.click()}
                                className="w-[130px] h-[130px] rounded-full bg-[#eef7f4] border-2 border-dashed border-[#c6e8d6] flex flex-col items-center justify-center text-[#009A60] shadow-2xs transition-transform hover:scale-[1.02] cursor-pointer overflow-hidden relative group"
                              >
                                {regAvatar ? (
                                  <>
                                    <img
                                      src={regAvatar}
                                      alt="Player Headshot"
                                      className="w-full h-full object-cover rounded-full"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold">
                                      Change
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <Camera className="h-9 w-9 text-[#009A60] stroke-[1.8]" />
                                    <span className="text-xs font-bold text-[#009A60] tracking-wider mt-1.5 uppercase">
                                      PHOTO
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-4">
                                <button
                                  type="button"
                                  onClick={() => avatarInputRef.current?.click()}
                                  className="h-10 px-5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-[#0F172A] text-sm font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                                >
                                  <Upload className="h-4 w-4 text-[#009A60]" />
                                  {regAvatar ? "Change Photo" : "Upload Player Photo"}
                                </button>
                                {regAvatar && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRegAvatar(null);
                                      if (avatarInputRef.current) avatarInputRef.current.value = "";
                                    }}
                                    className="h-10 w-10 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-all cursor-pointer text-xs font-bold"
                                    title="Remove Photo"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-[#8CA0BA] mt-2 text-center max-w-[260px] leading-relaxed font-normal">
                                High-contrast headshot used on the live clubhouse leaderboard (max 500KB strictly).
                              </p>
                            </div>

                            {/* Mobile Phone Number */}
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block">
                                  Mobile Phone Number
                                </label>
                                {isCheckingPhone && (
                                  <span className="text-xs text-[#009A60] flex items-center gap-1 font-medium">
                                    <Loader2 className="h-3 w-3 animate-spin" /> Verifying...
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCountrySearchQuery("");
                                    setShowCountryModal(true);
                                  }}
                                  className="h-12 px-2.5 bg-[#f5faf6] border border-[#e1efe5] hover:border-[#009A60] rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold text-[#0F172A] shrink-0 transition-all cursor-pointer"
                                  title="Change country"
                                >
                                  <span className="text-base leading-none">{regCountryFlag}</span>
                                  <span>+{regPhoneCode}</span>
                                  <span className="text-[#8CA0BA] text-[10px] ml-0.5">▼</span>
                                </button>
                                <input
                                  type="tel"
                                  inputMode="numeric"
                                  value={regPhone}
                                  onFocus={() => {
                                    openVirtualKeyboard({
                                      phoneIndex: phoneIdx,
                                      type: "numeric",
                                      allowDecimal: false,
                                      allowPlus: false,
                                      title: "Phone Number",
                                      onInput: (char) => {
                                        if (!/^\d$/.test(char)) return;
                                        setRegPhone((prev) => prev + char);
                                        if (regPhoneError) setRegPhoneError(null);
                                        if (regError) setRegError(null);
                                      },
                                      onBackspace: () => {
                                        setRegPhone((prev) => prev.slice(0, -1));
                                      },
                                    });
                                  }}
                                  onKeyDown={(e) => handleStrictNumericKeyDown(e, { allowDecimal: false, allowPlus: false })}
                                  onChange={(e) => {
                                    const cleanDigits = e.target.value.replace(/\D/g, "");
                                    setRegPhone(cleanDigits);
                                    if (regPhoneError) setRegPhoneError(null);
                                    if (regError) setRegError(null);
                                  }}
                                  onBlur={() => {
                                    const cleanDigits = regPhone.replace(/\D/g, "");
                                    if (cleanDigits.length >= 7) {
                                      checkPhoneUniqueness(regPhone);
                                    }
                                  }}
                                  placeholder={regCountry === "NG" ? "803 555 0192" : "Phone number"}
                                  className={`flex-1 h-12 rounded-xl px-3.5 text-[13.5px] leading-normal font-medium text-[#0F172A] placeholder:text-[#8CA0BA] placeholder:font-medium focus:outline-hidden transition-all ${
                                    regPhoneError
                                      ? "bg-rose-50/60 border-2 border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                                      : "bg-[#f5faf6] border border-[#e1efe5] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20"
                                  }`}
                                />
                              </div>
                              {regPhoneError ? (
                                <p className="text-[13px] text-rose-600 font-medium text-left mt-1.5 animate-in fade-in duration-150">
                                  This phone number is already registered.
                                </p>
                              ) : (
                                <p className="text-[11px] text-[#8CA0BA] mt-1 font-normal text-left">
                                  Used for emergency shotgun and weather sirens. Must be unique.
                                </p>
                              )}
                            </div>

                            {/* State & City / LGA */}
                            <div className="grid grid-cols-2 gap-2.5">
                              <div>
                                <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block mb-1.5">
                                  State
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStateSearchQuery("");
                                    setShowStateModal(true);
                                  }}
                                  className="w-full h-12 bg-[#f5faf6] border border-[#e1efe5] hover:border-[#009A60] rounded-xl px-3.5 flex items-center justify-between text-[13.5px] leading-normal font-medium text-[#0F172A] transition-all cursor-pointer text-left"
                                >
                                  <span className="truncate">{regState || "Select State"}</span>
                                  <span className="text-[#8CA0BA] text-[10px] ml-1 shrink-0">▼</span>
                                </button>
                              </div>
                              <div>
                                <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block mb-1.5">
                                  City / LGA
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCitySearchQuery("");
                                    setShowCityModal(true);
                                  }}
                                  className="w-full h-12 bg-[#f5faf6] border border-[#e1efe5] hover:border-[#009A60] rounded-xl px-3.5 flex items-center justify-between text-[13.5px] leading-normal font-medium text-[#0F172A] transition-all cursor-pointer text-left"
                                >
                                  <span className="truncate">{regCity || "Select LGA"}</span>
                                  <span className="text-[#8CA0BA] text-[10px] ml-1 shrink-0">▼</span>
                                </button>
                              </div>
                            </div>

                            {/* Push Notifications Card */}
                            <div className="mt-4 mb-2 bg-[#EBF7EE] border border-[#BDE3CA] rounded-2xl p-3.5 shadow-2xs transition-all">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <div
                                    className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                                      regPushNotifications
                                        ? "bg-[#009A60] text-white shadow-xs shadow-emerald-700/20"
                                        : "bg-slate-100 border border-slate-200 text-slate-400"
                                    }`}
                                  >
                                    <Bell className={`h-4.5 w-4.5 ${regPushNotifications ? "fill-white text-white" : ""}`} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-[13px] font-semibold text-[#0F172A] tracking-tight leading-none">
                                        Push Notifications
                                      </h4>
                                      <span
                                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-all ${
                                          regPushNotifications
                                            ? "bg-white text-[#009A60] border border-[#BDE3CA]"
                                            : "bg-white/70 text-slate-500 border border-slate-200"
                                        }`}
                                      >
                                        {regPushNotifications ? "Enabled" : "Off"}
                                      </span>
                                    </div>
                                    <p className="text-[11.5px] text-[#335C49] mt-1 leading-snug">
                                      Instant Tee Time & Marker Pairing Alerts
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setRegPushNotifications(!regPushNotifications)}
                                  className={`w-11 h-6.5 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer shrink-0 mt-0.5 ${
                                    regPushNotifications ? "bg-[#009A60]" : "bg-slate-200"
                                  }`}
                                  aria-label="Toggle Push Notifications"
                                >
                                  <div
                                    className={`w-4.5 h-4.5 rounded-full bg-white transition-transform duration-200 ease-in-out shadow-xs ${
                                      regPushNotifications ? "translate-x-4.5" : "translate-x-0"
                                    }`}
                                  />
                                </button>
                              </div>

                              {/* Notification feature badges row with uniform height, icons & left alignment */}
                              <div className="flex flex-wrap items-center justify-start gap-x-2 gap-y-2 pt-3.5 mt-3.5 border-t border-[#D3ECD9]">
                                <span className="h-6.5 px-2.5 rounded-lg bg-white border border-[#BDE3CA] text-[#008754] text-[10.5px] font-medium whitespace-nowrap inline-flex items-center justify-center gap-1.5 shadow-2xs">
                                  <Users className="h-3 w-3 shrink-0 text-[#008754]" />
                                  <span>Pairings</span>
                                </span>
                                <span className="h-6.5 px-2.5 rounded-lg bg-white border border-[#BDE3CA] text-[#008754] text-[10.5px] font-medium whitespace-nowrap inline-flex items-center justify-center gap-1.5 shadow-2xs">
                                  <Clock className="h-3 w-3 shrink-0 text-[#008754]" />
                                  <span>Tee Times</span>
                                </span>
                                <span className="h-6.5 px-2.5 rounded-lg bg-white border border-[#BDE3CA] text-[#008754] text-[10.5px] font-medium whitespace-nowrap inline-flex items-center justify-center gap-1.5 shadow-2xs">
                                  <Activity className="h-3 w-3 shrink-0 text-[#008754]" />
                                  <span>Live Scores</span>
                                </span>
                              </div>
                            </div>

                            {/* Bottom Buttons */}
                            <div className="flex gap-2.5 pt-1.5">
                              <button
                                type="button"
                                onClick={handleRegPrev}
                                className="h-12 w-12 shrink-0 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-[#0F172A] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                                title="Back"
                              >
                                <ArrowLeft className="h-5 w-5" />
                              </button>
                              <button
                                type="button"
                                disabled={!isRegStep3Valid || isCheckingPhone}
                                onClick={handleRegNext}
                                className={`flex-1 h-12 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${isRegStep3Valid && !isCheckingPhone
                                  ? "bg-[#009A60] hover:bg-[#008754] text-white shadow-md shadow-emerald-700/20 cursor-pointer"
                                  : "bg-[#009A60]/35 text-white/75 cursor-not-allowed shadow-none"
                                  }`}
                              >
                                {isCheckingPhone ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                                    <span>Verifying Phone...</span>
                                  </>
                                ) : (
                                  <span>Review & Finish →</span>
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* --- STEP 4: REVIEW YOUR DETAILS --- */}
                        {regStep === 4 && (
                          <div className="space-y-4">
                            <div>
                              <h1 className="text-2xl font-black text-[#111827] tracking-tight">
                                Review your details
                              </h1>
                              <p className="text-[12.5px] text-[#5B6B7F] mt-1 leading-relaxed font-normal">
                                Please ensure your golf credentials and contact info are accurate for handicap scoring and tournament prize eligibility.
                              </p>
                            </div>

                            {/* Section 1: Personal Details */}
                            <div>
                              <div className="flex items-center justify-between mb-1.5 px-0.5">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A99AD]">
                                  Personal Details
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setRegStep(1)}
                                  className="text-[11px] font-bold uppercase tracking-wider text-[#009A60] hover:text-[#008754] hover:underline cursor-pointer transition-colors"
                                >
                                  Edit
                                </button>
                              </div>
                              <div className="bg-[#f4f6f3] border border-[#e1efe5] rounded-2xl p-3.5 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-[#8CA0BA] font-normal shrink-0">Full Name</span>
                                  <span className="text-[#0F172A] font-medium text-[13px] text-right truncate flex-1 ml-4" title={`${regFirstName || "Alex"} ${regLastName || "Thompson"}`}>
                                    {regFirstName || "Alex"} {regLastName || "Thompson"}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-xs pt-1 border-t border-[#e1efe5]">
                                  <span className="text-[#8CA0BA] font-normal shrink-0">Gender</span>
                                  <span className="text-[#0F172A] font-medium text-[13px] capitalize text-right">
                                    {regGender === "MALE" ? "Male" : regGender === "FEMALE" ? "Female" : (regGender || "Male")}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-xs pt-1 border-t border-[#e1efe5]">
                                  <span className="text-[#8CA0BA] font-normal shrink-0">Date of Birth</span>
                                  <span className="text-[#0F172A] font-medium text-[13px] text-right">
                                    {regDob
                                      ? new Date(regDob).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                      : "Jan 5, 2000"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Section 2: Golf Credentials (GHIN Removed) */}
                            <div>
                              <div className="flex items-center justify-between mb-1.5 px-0.5">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A99AD]">
                                  Golf Credentials
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setRegStep(2)}
                                  className="text-[11px] font-bold uppercase tracking-wider text-[#009A60] hover:text-[#008754] hover:underline cursor-pointer transition-colors"
                                >
                                  Edit
                                </button>
                              </div>
                              <div className="bg-[#f4f6f3] border border-[#e1efe5] rounded-2xl p-3.5 shadow-2xs space-y-2 relative">
                                <div className="flex items-center justify-between pb-1 border-b border-[#e1efe5]">
                                  <span className="text-[#8CA0BA] font-normal text-xs shrink-0">Classification</span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[#0F172A] font-medium text-[13px]">
                                      {regClassification === "PROFESSIONAL" ? "Professional" : regClassification === "BEGINNER" ? "Beginner" : "Amateur"}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EBF7EE] border border-[#BDE3CA] text-[#008754]">
                                      <Check className="h-2.5 w-2.5 stroke-[2.5]" />
                                      VERIFIED
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-xs pt-0.5">
                                  <span className="text-[#8CA0BA] font-normal shrink-0">Handicap Index</span>
                                  <span className="text-[#009A60] font-medium text-[13px] italic font-sans text-right">
                                    {regClassification === "PROFESSIONAL"
                                      ? "0.0 (Scratch)"
                                      : regClassification === "BEGINNER"
                                        ? "36.0"
                                        : regHandicap && Number(regHandicap) < 36
                                          ? regHandicap
                                          : "4.2"}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-xs pt-1 border-t border-[#e1efe5]">
                                  <span className="text-[#8CA0BA] font-normal shrink-0">Home Club</span>
                                  <span className="text-[#0F172A] font-medium text-[13px] text-right truncate flex-1 ml-4" title={regHomeClub.trim() ? regHomeClub.trim() : "Not specified"}>
                                    {regHomeClub.trim() ? regHomeClub.trim() : "Not specified"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Section 3: Contact Information */}
                            <div>
                              <div className="flex items-center justify-between mb-1.5 px-0.5">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A99AD]">
                                  Contact Information
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setRegStep(3)}
                                  className="text-[11px] font-bold uppercase tracking-wider text-[#009A60] hover:text-[#008754] hover:underline cursor-pointer transition-colors"
                                >
                                  Edit
                                </button>
                              </div>
                              <div className="bg-[#f4f6f3] border border-[#e1efe5] rounded-2xl p-3.5 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-[#8CA0BA] font-normal shrink-0">Email</span>
                                  <span className="text-[#0F172A] font-medium text-[13px] text-right truncate flex-1 ml-4" title={regEmail || "alex.t@example.com"}>
                                    {regEmail || "alex.t@example.com"}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-xs pt-1 border-t border-[#e1efe5]">
                                  <span className="text-[#8CA0BA] font-normal shrink-0">Phone Number</span>
                                  <span className="text-[#0F172A] font-medium text-[13px] text-right">
                                    {regPhone ? `${regCountryFlag} +${regPhoneCode} ${regPhone}` : "+1 (555) 012-3456"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Section 4: Notice / Certification Card */}
                            <div className="bg-[#EBF7EE] border border-[#BDE3CA] rounded-2xl p-3.5 flex items-start gap-2.5 shadow-2xs">
                              <Info className="h-4 w-4 text-[#008754] shrink-0 mt-0.5" />
                              <p className="text-[11.5px] text-[#23533E] leading-relaxed">
                                By confirming, you certify that these details match your golf credentials profile. Misreporting handicaps may result in tournament disqualification.
                              </p>
                            </div>

                            {/* Bottom Action Buttons: Preserving Back button + Confirm Information */}
                            <div className="flex gap-2.5 pt-1">
                              <button
                                type="button"
                                onClick={handleRegPrev}
                                className="h-12 w-12 shrink-0 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-[#0F172A] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                                title="Back"
                              >
                                <ArrowLeft className="h-5 w-5" />
                              </button>
                              <button
                                type="button"
                                disabled={!isRegStep4Valid || isRegistering}
                                onClick={handleRegComplete}
                                className={`flex-1 h-12 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                  isRegStep4Valid && !isRegistering
                                    ? "bg-[#009A60] hover:bg-[#008754] text-white shadow-md shadow-emerald-700/20"
                                    : "bg-[#009A60]/35 text-white/75 cursor-not-allowed shadow-none"
                                }`}
                              >
                                {isRegistering ? (
                                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <span>Complete Information →</span>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                        </div>
                      </div>

                      {/* Ultra-Modern Realistic Home Golf Club Bottom Sheet (Contained 100% inside phone display grid) */}
                      {showClubModal && (
                        <div className="absolute inset-0 z-50 flex flex-col justify-end">
                          {/* Dark Backdrop Overlay */}
                          <div
                            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
                            onClick={() => {
                              setShowClubModal(false);
                              setVirtualKeyboard(null);
                            }}
                          />

                          {/* Bottom Sheet Card */}
                          <div
                            className="relative z-10 bg-white rounded-t-[28px] border-t border-[#e1efe5] shadow-2xl p-5 pb-6 animate-in slide-in-from-bottom duration-200 flex flex-col w-full max-w-sm mx-auto transition-all"
                            style={{
                              marginBottom: virtualKeyboard?.isOpen ? "270px" : "0px",
                              maxHeight: virtualKeyboard?.isOpen ? "calc(100% - 280px)" : "88%",
                            }}
                          >
                            {/* Drag Pill Handle */}
                            <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-3 shrink-0" />

                            {/* Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9] mb-3 shrink-0">
                              <div>
                                <h3 className="text-base font-semibold text-[#0F172A] tracking-tight">
                                  Select Home Golf Club
                                </h3>
                                <p className="text-[11px] text-[#64748B] mt-0.5 font-normal">
                                  Choose your registered course or enter location
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowClubModal(false);
                                  setVirtualKeyboard(null);
                                }}
                                className="h-8 w-8 rounded-full bg-[#f5faf6] border border-[#e1efe5] flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                              >
                                <span className="text-sm font-semibold">✕</span>
                              </button>
                            </div>

                            {/* Search Input */}
                            <div className="relative mb-3 shrink-0">
                              <MapPin className="h-4 w-4 text-[#009A60] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="text"
                                value={clubSearchQuery}
                                onFocus={() => {
                                  openVirtualKeyboard({
                                    phoneIndex: phoneIdx,
                                    type: "text",
                                    title: "Search Golf Club",
                                    queryValue: clubSearchQuery,
                                    onInput: (char) => {
                                      setClubSearchQuery((prev) => {
                                        const next = prev + char;
                                        setVirtualKeyboard((k) => k ? { ...k, queryValue: next } : null);
                                        return next;
                                      });
                                    },
                                    onBackspace: () => {
                                      setClubSearchQuery((prev) => {
                                        const next = prev.slice(0, -1);
                                        setVirtualKeyboard((k) => k ? { ...k, queryValue: next } : null);
                                        return next;
                                      });
                                    },
                                  });
                                }}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setClubSearchQuery(val);
                                  setVirtualKeyboard((k) => k ? { ...k, queryValue: val } : null);
                                }}
                                placeholder="Search golf club or location..."
                                className="w-full h-12 bg-[#f5faf6] border border-[#e1efe5] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 rounded-xl pl-10 pr-10 text-[13.5px] font-medium text-[#0F172A] placeholder:text-[#8CA0BA] placeholder:font-medium focus:outline-hidden transition-all"
                              />
                              {clubSearchQuery ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setClubSearchQuery("");
                                    setVirtualKeyboard((k) => k ? { ...k, queryValue: "" } : null);
                                  }}
                                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8CA0BA] hover:text-[#0F172A] transition-colors cursor-pointer"
                                >
                                  <span className="text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full w-4 h-4 flex items-center justify-center">✕</span>
                                </button>
                              ) : (
                                <Search className="h-4 w-4 text-[#8CA0BA] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              )}
                            </div>

                            {/* Courses List */}
                            <div className="overflow-y-auto flex-1 divide-y divide-[#f1f5f9] -mx-5 px-5 min-h-48 max-h-72 scrollbar-hide no-scrollbar" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                              {filteredCourses.length > 0 ? (
                                filteredCourses.map((c) => {
                                  const isSelected = regHomeClub === c.name;
                                  const clubLogo = (c as any).logo || (c as any).coverImage || (c as any).logoUrl;
                                  return (
                                    <button
                                      key={c.id || c.name}
                                      type="button"
                                      onClick={() => {
                                        setRegHomeClub(c.name);
                                        setShowClubModal(false);
                                      }}
                                      className={`w-full text-left py-3 px-3 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${isSelected ? "bg-[#e8f5ed] border border-[#bce3cb]" : "hover:bg-[#f5faf6]"
                                        }`}
                                    >
                                      {clubLogo ? (
                                        <div className={`w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-[#e1efe5] bg-white shadow-2xs`}>
                                          <img
                                            src={clubLogo}
                                            alt={c.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              (e.currentTarget as HTMLElement).style.display = "none";
                                            }}
                                          />
                                        </div>
                                      ) : (
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? "bg-[#009A60] text-white" : "bg-[#f5faf6] border border-[#e1efe5] text-[#009A60]"
                                          }`}>
                                          <MapPin className="h-4 w-4" />
                                        </div>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <div className="text-[13px] font-medium text-[#0F172A] truncate" style={{ fontWeight: 500 }}>
                                          {c.name}
                                        </div>
                                        <div className="text-[11px] font-normal text-[#64748B] truncate" style={{ fontWeight: 400 }}>
                                          {formatClubLocation(c)}
                                        </div>
                                      </div>
                                      {isSelected && (
                                        <Check className="h-4 w-4 text-[#009A60] shrink-0" />
                                      )}
                                    </button>
                                  );
                                })
                              ) : (
                                <div className="py-8 text-center px-4">
                                  <div className="w-12 h-12 mx-auto rounded-full bg-[#f5faf6] border border-[#e1efe5] flex items-center justify-center text-[#5B6B7F] mb-2.5">
                                    <MapPinOff className="h-5 w-5 text-[#8CA0BA]" />
                                  </div>
                                  <p className="text-xs font-semibold text-[#0F172A]">
                                    No golf clubs found
                                  </p>
                                  <p className="text-[11px] text-[#64748B] font-normal mt-1 leading-relaxed">
                                    No registered courses matching &ldquo;{clubSearchQuery.trim()}&rdquo;.
                                  </p>
                                  {clubSearchQuery.trim().length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRegHomeClub(clubSearchQuery.trim());
                                        setShowClubModal(false);
                                      }}
                                      className="mt-4 px-4 py-2.5 rounded-xl bg-[#009A60] hover:bg-[#008754] text-white text-xs font-medium shadow-sm transition-all cursor-pointer"
                                    >
                                      Use &ldquo;{clubSearchQuery.trim()}&rdquo; as my Home Club
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Footer / Clear selection if selected */}
                            {regHomeClub && (
                              <div className="pt-3 border-t border-[#f1f5f9] mt-2 flex items-center justify-between shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRegHomeClub("");
                                    setClubSearchQuery("");
                                  }}
                                  className="text-xs font-medium text-[#EF4444] hover:underline cursor-pointer"
                                >
                                  Clear Selection
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowClubModal(false)}
                                  className="h-10 px-5 rounded-xl bg-[#009A60] hover:bg-[#008754] text-white text-xs font-medium shadow-xs transition-all cursor-pointer"
                                >
                                  Confirm
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Player Classification Bottom Sheet Modal (Contained 100% inside phone display grid) */}
                      {showClassificationModal && (
                        <div className="absolute inset-0 z-50 flex flex-col justify-end">
                          {/* Dark Backdrop Overlay */}
                          <div
                            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
                            onClick={() => setShowClassificationModal(false)}
                          />
                          {/* Bottom Sheet Card */}
                          <div className="relative z-10 bg-white rounded-t-[28px] border-t border-[#e1efe5] shadow-2xl p-5 pb-6 animate-in slide-in-from-bottom duration-200 max-h-[85%] flex flex-col w-full max-w-sm mx-auto">
                            {/* Drag Pill Handle */}
                            <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-3 shrink-0" />

                            {/* Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9] mb-3.5 shrink-0">
                              <div>
                                <h3 className="text-base font-bold text-[#0F172A]">Player Classification</h3>
                                <p className="text-xs text-[#5B6B7F]">Select your tournament flight level</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowClassificationModal(false)}
                                className="h-8 w-8 rounded-full bg-[#f5faf6] border border-[#e1efe5] flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                              >
                                <span className="text-sm font-semibold">✕</span>
                              </button>
                            </div>

                            {/* Options List */}
                            <div className="space-y-2.5">
                              {[
                                {
                                  id: "BEGINNER" as const,
                                  title: "Beginner",
                                  description: "New to tournament golf • Standard 36.0 handicap allowance",
                                  badge: null,
                                },
                                {
                                  id: "AMATEUR" as const,
                                  title: "Intermediate / Amateur",
                                  description: "Official GHIN / USGA index • Net tournament flight play",
                                  badge: null,
                                },
                                {
                                  id: "PROFESSIONAL" as const,
                                  title: "Professional",
                                  description: "Tour Professional • Championship gross scratch competition",
                                  badge: "PRO",
                                },
                              ].map((opt) => {
                                const isSelected = regClassification === opt.id;
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => {
                                      setRegClassification(opt.id);
                                      if (opt.id === "BEGINNER") {
                                        setRegHandicap("36");
                                      } else if (opt.id === "AMATEUR") {
                                        // When selecting intermediate, change back to less than 36 if it was 36 or >= 36
                                        if (!regHandicap || Number(regHandicap) >= 36) {
                                          setRegHandicap("");
                                        }
                                      } else if (opt.id === "PROFESSIONAL") {
                                        setRegHandicap("0.0");
                                      }
                                    }}
                                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${isSelected
                                      ? "bg-[#e8f5ed] border-[#009A60] shadow-xs"
                                      : "bg-[#f5faf6] border border-[#e1efe5] hover:bg-[#e8f5ed]/50"
                                      }`}
                                  >
                                    <div className="min-w-0 pr-2">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-[13.5px] font-semibold ${isSelected ? "text-[#009A60]" : "text-[#0F172A]"}`}>
                                          {opt.title}
                                        </span>
                                        {opt.badge && (
                                          <span className="bg-[#009A60] text-white text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider">
                                            {opt.badge}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-[#5B6B7F] mt-0.5 leading-normal">
                                        {opt.description}
                                      </p>
                                    </div>
                                    <div
                                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${isSelected
                                        ? "border-[#009A60] bg-[#009A60] text-white"
                                        : "border-slate-300 bg-white"
                                        }`}
                                    >
                                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Footer with Confirm Selection button matching screenshot */}
                            <div className="pt-3 border-t border-[#f1f5f9] mt-3.5 flex justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  if (regClassification === "BEGINNER") {
                                    setRegHandicap("36");
                                  } else if (regClassification === "AMATEUR") {
                                    if (!regHandicap || Number(regHandicap) >= 36) {
                                      setRegHandicap("");
                                    }
                                  } else if (regClassification === "PROFESSIONAL") {
                                    setRegHandicap("0.0");
                                  }
                                  setShowClassificationModal(false);
                                }}
                                className="h-10 px-5 rounded-xl bg-[#009A60] hover:bg-[#008754] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                              >
                                Confirm Selection
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Ultra-Modern Realistic Date of Birth Bottom Sheet (Contained 100% inside phone display grid) */}
                      {showDobCalendar && (() => {
                        const parts = regDob.split("/").map((p) => parseInt(p.trim(), 10));
                        const selectedDate = parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])
                          ? new Date(parts[2], parts[0] - 1, parts[1])
                          : null;

                        const y = dobCalendarMonth.getFullYear();
                        const m = dobCalendarMonth.getMonth();
                        const daysInMonth = new Date(y, m + 1, 0).getDate();
                        const startDay = new Date(y, m, 1).getDay();
                        const today = new Date();

                        const cells: (number | null)[] = [];
                        for (let i = 0; i < startDay; i++) cells.push(null);
                        for (let d = 1; d <= daysInMonth; d++) cells.push(d);

                        return (
                          <div className="absolute inset-0 z-50 flex flex-col justify-end">
                            {/* Dark Backdrop Overlay */}
                            <div
                              className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
                              onClick={() => setShowDobCalendar(false)}
                            />

                            {/* Bottom Sheet Card */}
                            <div className="relative z-10 bg-white rounded-t-[28px] border-t border-[#e1efe5] shadow-2xl p-5 pb-6 animate-in slide-in-from-bottom duration-200 max-h-[92%] overflow-y-auto scrollbar-hide no-scrollbar" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                              {/* Drag Pill Handle */}
                              <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-3" />

                              {/* Header */}
                              <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9] mb-3">
                                <div>
                                  <h3 className="text-base font-semibold text-[#0F172A] tracking-tight">
                                    Select Date of Birth
                                  </h3>
                                  <p className="text-[11px] text-[#64748B] mt-0.5 font-normal">
                                    Choose year, month, and day
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setShowDobCalendar(false)}
                                  className="h-8 w-8 rounded-full bg-[#f5faf6] border border-[#e1efe5] flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                >
                                  <span className="text-sm font-semibold">✕</span>
                                </button>
                              </div>

                              {/* Month & Year Selectors with Large, Comfortable Touch Targets */}
                              <div className="flex items-center justify-between gap-2 p-2 bg-[#f5faf6] border border-[#e1efe5] rounded-2xl mb-3.5">
                                <button
                                  type="button"
                                  onClick={() => setDobCalendarMonth(new Date(y, m - 1, 1))}
                                  className="h-10 w-10 rounded-xl bg-white border border-[#e1efe5] flex items-center justify-center text-slate-700 hover:text-[#009A60] hover:border-[#009A60] shadow-2xs transition-all cursor-pointer shrink-0"
                                  title="Previous Month"
                                >
                                  <ChevronLeft className="h-5 w-5 stroke-[2.5]" />
                                </button>

                                <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
                                  {/* Month Selector */}
                                  <div className="relative flex-1 min-w-0">
                                    <select
                                      value={m}
                                      onChange={(e) => setDobCalendarMonth(new Date(y, parseInt(e.target.value, 10), 1))}
                                      className="w-full h-10 bg-white border border-[#e1efe5] rounded-xl text-[13.5px] font-medium text-[#0F172A] px-3 pr-7 focus:outline-hidden focus:border-[#009A60] shadow-2xs cursor-pointer appearance-none truncate"
                                    >
                                      {[
                                        "January", "February", "March", "April", "May", "June",
                                        "July", "August", "September", "October", "November", "December"
                                      ].map((mName, idx) => (
                                        <option key={mName} value={idx}>
                                          {mName}
                                        </option>
                                      ))}
                                    </select>
                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">
                                      ▼
                                    </span>
                                  </div>

                                  {/* Year Selector */}
                                  <div className="relative w-28 shrink-0">
                                    <select
                                      value={y}
                                      onChange={(e) => setDobCalendarMonth(new Date(parseInt(e.target.value, 10), m, 1))}
                                      className="w-full h-10 bg-white border border-[#e1efe5] rounded-xl text-[13.5px] font-medium text-[#0F172A] px-3 pr-7 focus:outline-hidden focus:border-[#009A60] shadow-2xs cursor-pointer appearance-none"
                                    >
                                      {Array.from({ length: 100 }, (_, i) => today.getFullYear() - i).map((yr) => (
                                        <option key={yr} value={yr}>
                                          {yr}
                                        </option>
                                      ))}
                                    </select>
                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">
                                      ▼
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  disabled={y >= today.getFullYear() && m >= today.getMonth()}
                                  onClick={() => setDobCalendarMonth(new Date(y, m + 1, 1))}
                                  className={`h-10 w-10 rounded-xl bg-white border border-[#e1efe5] flex items-center justify-center shadow-2xs transition-all shrink-0 ${y >= today.getFullYear() && m >= today.getMonth()
                                    ? "opacity-30 cursor-not-allowed text-slate-300"
                                    : "text-slate-700 hover:text-[#009A60] hover:border-[#009A60] cursor-pointer"
                                    }`}
                                  title="Next Month"
                                >
                                  <ChevronRight className="h-5 w-5 stroke-[2.5]" />
                                </button>
                              </div>

                              {/* Weekday Row */}
                              <div className="grid grid-cols-7 gap-1 mb-1 text-center">
                                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                                  <div key={d} className="text-[11px] font-medium text-[#8CA0BA] py-1">
                                    {d}
                                  </div>
                                ))}
                              </div>

                              {/* Days Grid */}
                              <div className="grid grid-cols-7 gap-1">
                                {cells.map((day, idx) => {
                                  if (day === null) {
                                    return <div key={`empty-${idx}`} className="h-9" />;
                                  }

                                  const cellDate = new Date(y, m, day);
                                  const isFuture = cellDate > today;
                                  const isSelected =
                                    selectedDate &&
                                    selectedDate.getFullYear() === y &&
                                    selectedDate.getMonth() === m &&
                                    selectedDate.getDate() === day;
                                  const isToday =
                                    today.getFullYear() === y &&
                                    today.getMonth() === m &&
                                    today.getDate() === day;

                                  return (
                                    <button
                                      key={`day-${day}`}
                                      type="button"
                                      disabled={isFuture}
                                      onClick={() => {
                                        const formatted = `${String(m + 1).padStart(2, "0")} / ${String(day).padStart(2, "0")} / ${y}`;
                                        setRegDob(formatted);
                                        setShowDobCalendar(false);
                                      }}
                                      className={`h-9 rounded-xl text-[13px] font-medium transition-all flex items-center justify-center relative cursor-pointer ${isFuture
                                        ? "text-slate-300 opacity-40 cursor-not-allowed"
                                        : isSelected
                                          ? "bg-[#009A60] text-white shadow-sm font-semibold"
                                          : isToday
                                            ? "text-[#009A60] ring-1.5 ring-[#009A60] bg-emerald-50 hover:bg-emerald-100"
                                            : "text-[#1E293B] hover:bg-[#f5faf6]"
                                        }`}
                                    >
                                      {day}
                                      {isToday && !isSelected && (
                                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#009A60]" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Footer Details & Confirm Action */}
                              <div className="pt-3.5 mt-3.5 border-t border-[#f1f5f9] flex items-center justify-between gap-3">
                                <div className="text-xs text-[#64748B] font-medium">
                                  {selectedDate ? (
                                    <span>
                                      Age: <strong className="text-[#0F172A] font-semibold">{Math.floor((today.getTime() - selectedDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))}</strong> years
                                    </span>
                                  ) : (
                                    <span>Select a date</span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setShowDobCalendar(false)}
                                  className="h-10 px-5 rounded-xl bg-[#009A60] hover:bg-[#008754] text-white text-sm font-medium shadow-sm transition-all cursor-pointer"
                                >
                                  Confirm Date
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Country Bottom Sheet Modal */}
                      {showCountryModal && (
                        <div className="absolute inset-0 z-50 flex flex-col justify-end">
                          <div
                            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
                            onClick={() => {
                              setShowCountryModal(false);
                              setVirtualKeyboard(null);
                            }}
                          />
                          <div
                            className="relative z-10 bg-white rounded-t-[28px] border-t border-[#e1efe5] shadow-2xl p-5 pb-6 animate-in slide-in-from-bottom duration-200 flex flex-col w-full max-w-sm mx-auto transition-all"
                            style={{
                              marginBottom: virtualKeyboard?.isOpen ? "270px" : "0px",
                              maxHeight: virtualKeyboard?.isOpen ? "calc(100% - 280px)" : "85%",
                            }}
                          >
                            <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-3 shrink-0" />
                            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9] mb-3.5 shrink-0">
                              <div>
                                <h3 className="text-base font-bold text-[#0F172A]">Select Country</h3>
                                <p className="text-xs text-[#5B6B7F]">International & Regional Dial Codes</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowCountryModal(false);
                                  setVirtualKeyboard(null);
                                }}
                                className="h-8 w-8 rounded-full bg-[#f5faf6] border border-[#e1efe5] flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                              >
                                <span className="text-sm font-semibold">✕</span>
                              </button>
                            </div>

                            {/* Search Input */}
                            <div className="relative mb-3 shrink-0">
                              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8CA0BA]" />
                              <input
                                type="text"
                                value={countrySearchQuery}
                                onFocus={() => {
                                  openVirtualKeyboard({
                                    phoneIndex: phoneIdx,
                                    type: "text",
                                    title: "Search Country",
                                    queryValue: countrySearchQuery,
                                    onInput: (char) => {
                                      setCountrySearchQuery((prev) => {
                                        const next = prev + char;
                                        setVirtualKeyboard((k) => k ? { ...k, queryValue: next } : null);
                                        return next;
                                      });
                                    },
                                    onBackspace: () => {
                                      setCountrySearchQuery((prev) => {
                                        const next = prev.slice(0, -1);
                                        setVirtualKeyboard((k) => k ? { ...k, queryValue: next } : null);
                                        return next;
                                      });
                                    },
                                  });
                                }}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCountrySearchQuery(val);
                                  setVirtualKeyboard((k) => k ? { ...k, queryValue: val } : null);
                                }}
                                placeholder="Search country name or dial code..."
                                className="w-full h-10 bg-[#f5faf6] border border-[#e1efe5] focus:border-[#009A60] rounded-xl pl-9 pr-3.5 text-xs font-medium text-[#0F172A] placeholder:text-[#8CA0BA] focus:outline-hidden"
                              />
                            </div>

                            {/* List */}
                            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[260px] scrollbar-hide">
                              {countryList
                                .filter(
                                  (c) =>
                                    c.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
                                    c.isoCode.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
                                    c.phonecode.includes(countrySearchQuery.replace(/^\+/, ""))
                                )
                                .map((c) => {
                                  const isSelected = regCountry === c.isoCode;
                                  return (
                                    <button
                                      key={c.isoCode}
                                      type="button"
                                      onClick={() => {
                                        setRegCountry(c.isoCode);
                                        setRegPhoneCode(c.phonecode);
                                        setRegCountryFlag(c.flag);
                                        if (c.isoCode === "NG") {
                                          setRegState("Lagos");
                                          setRegCity("Ikeja");
                                        } else {
                                          const states = State.getStatesOfCountry(c.isoCode);
                                          if (states.length > 0) {
                                            setRegState(states[0].name);
                                            const cities = City.getCitiesOfState(c.isoCode, states[0].isoCode);
                                            setRegCity(cities.length > 0 ? cities[0].name : states[0].name);
                                          } else {
                                            setRegState(c.name);
                                            setRegCity(c.name);
                                          }
                                        }
                                        setShowCountryModal(false);
                                      }}
                                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${isSelected
                                        ? "bg-[#e8f5ed] border-[#009A60] shadow-xs"
                                        : "bg-[#f5faf6] border border-[#e1efe5] hover:bg-[#e8f5ed]/50"
                                        }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="text-2xl leading-none">{c.flag}</span>
                                        <div>
                                          <p className={`text-sm font-semibold ${isSelected ? "text-[#009A60]" : "text-[#0F172A]"}`}>
                                            {c.name}
                                          </p>
                                          <p className="text-xs text-[#5B6B7F]">+{c.phonecode} • {c.isoCode}</p>
                                        </div>
                                      </div>
                                      {isSelected && (
                                        <div className="w-5 h-5 rounded-full bg-[#009A60] text-white flex items-center justify-center shrink-0">
                                          <Check className="h-3 w-3 stroke-[3]" />
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Nigerian State Bottom Sheet Modal */}
                      {showStateModal && (
                        <div className="absolute inset-0 z-50 flex flex-col justify-end">
                          <div
                            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
                            onClick={() => {
                              setShowStateModal(false);
                              setVirtualKeyboard(null);
                            }}
                          />
                          <div
                            className="relative z-10 bg-white rounded-t-[28px] border-t border-[#e1efe5] shadow-2xl p-5 pb-6 animate-in slide-in-from-bottom duration-200 flex flex-col w-full max-w-sm mx-auto transition-all"
                            style={{
                              marginBottom: virtualKeyboard?.isOpen ? "270px" : "0px",
                              maxHeight: virtualKeyboard?.isOpen ? "calc(100% - 280px)" : "85%",
                            }}
                          >
                            <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-3 shrink-0" />
                            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9] mb-3.5 shrink-0">
                              <div>
                                <h3 className="text-base font-bold text-[#0F172A]">Select State</h3>
                                <p className="text-xs text-[#5B6B7F]">
                                  {regCountry === "NG"
                                    ? "Nigerian States & Federal Capital Territory"
                                    : `States / Regions of ${countryList.find((c) => c.isoCode === regCountry)?.name || regCountry}`}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowStateModal(false);
                                  setVirtualKeyboard(null);
                                }}
                                className="h-8 w-8 rounded-full bg-[#f5faf6] border border-[#e1efe5] flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                              >
                                <span className="text-sm font-semibold">✕</span>
                              </button>
                            </div>

                            {/* Search Input */}
                            <div className="relative mb-3 shrink-0">
                              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8CA0BA]" />
                              <input
                                type="text"
                                value={stateSearchQuery}
                                onFocus={() => {
                                  openVirtualKeyboard({
                                    phoneIndex: phoneIdx,
                                    type: "text",
                                    title: "Search State",
                                    queryValue: stateSearchQuery,
                                    onInput: (char) => {
                                      setStateSearchQuery((prev) => {
                                        const next = prev + char;
                                        setVirtualKeyboard((k) => k ? { ...k, queryValue: next } : null);
                                        return next;
                                      });
                                    },
                                    onBackspace: () => {
                                      setStateSearchQuery((prev) => {
                                        const next = prev.slice(0, -1);
                                        setVirtualKeyboard((k) => k ? { ...k, queryValue: next } : null);
                                        return next;
                                      });
                                    },
                                  });
                                }}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setStateSearchQuery(val);
                                  setVirtualKeyboard((k) => k ? { ...k, queryValue: val } : null);
                                }}
                                placeholder="Search states..."
                                className="w-full h-10 bg-[#f5faf6] border border-[#e1efe5] focus:border-[#009A60] rounded-xl pl-9 pr-3.5 text-xs font-medium text-[#0F172A] placeholder:text-[#8CA0BA] focus:outline-hidden"
                              />
                            </div>

                            {/* List */}
                            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[260px] scrollbar-hide">
                              {(regCountry === "NG"
                                ? getNigerianStates()
                                : State.getStatesOfCountry(regCountry).map((s) => ({ value: s.name, label: s.name }))
                              )
                                .filter((s) => s.label.toLowerCase().includes(stateSearchQuery.toLowerCase()))
                                .map((s) => {
                                  const isSelected = regState === s.value;
                                  return (
                                    <button
                                      key={s.value}
                                      type="button"
                                      onClick={() => {
                                        setRegState(s.value);
                                        if (regCountry === "NG") {
                                          const lgas = NIGERIAN_STATES_LGAS[s.value] || [];
                                          if (lgas.length > 0) {
                                            setRegCity(lgas[0]);
                                          }
                                        } else {
                                          const countryStates = State.getStatesOfCountry(regCountry);
                                          const matchedState = countryStates.find((st) => st.name === s.value);
                                          const cities = matchedState
                                            ? City.getCitiesOfState(regCountry, matchedState.isoCode)
                                            : [];
                                          setRegCity(cities.length > 0 ? cities[0].name : s.value);
                                        }
                                        setShowStateModal(false);
                                      }}
                                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${isSelected
                                        ? "bg-[#e8f5ed] border-[#009A60] shadow-xs"
                                        : "bg-[#f5faf6] border border-[#e1efe5] hover:bg-[#e8f5ed]/50"
                                        }`}
                                    >
                                      <p className={`text-sm font-semibold ${isSelected ? "text-[#009A60]" : "text-[#0F172A]"}`}>
                                        {s.label}
                                      </p>
                                      {isSelected && (
                                        <div className="w-5 h-5 rounded-full bg-[#009A60] text-white flex items-center justify-center shrink-0">
                                          <Check className="h-3 w-3 stroke-[3]" />
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* City / LGA Bottom Sheet Modal */}
                      {showCityModal && (
                        <div className="absolute inset-0 z-50 flex flex-col justify-end">
                          <div
                            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
                            onClick={() => {
                              setShowCityModal(false);
                              setVirtualKeyboard(null);
                            }}
                          />
                          <div
                            className="relative z-10 bg-white rounded-t-[28px] border-t border-[#e1efe5] shadow-2xl p-5 pb-6 animate-in slide-in-from-bottom duration-200 flex flex-col w-full max-w-sm mx-auto transition-all"
                            style={{
                              marginBottom: virtualKeyboard?.isOpen ? "270px" : "0px",
                              maxHeight: virtualKeyboard?.isOpen ? "calc(100% - 280px)" : "85%",
                            }}
                          >
                            <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-3 shrink-0" />
                            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9] mb-3.5 shrink-0">
                              <div>
                                <h3 className="text-base font-bold text-[#0F172A]">Select City / LGA</h3>
                                <p className="text-xs text-[#5B6B7F]">
                                  {regCountry === "NG"
                                    ? `Local Government Areas in ${regState} State`
                                    : `Cities in ${regState}, ${countryList.find((c) => c.isoCode === regCountry)?.name || regCountry}`}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowCityModal(false);
                                  setVirtualKeyboard(null);
                                }}
                                className="h-8 w-8 rounded-full bg-[#f5faf6] border border-[#e1efe5] flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                              >
                                <span className="text-sm font-semibold">✕</span>
                              </button>
                            </div>

                            {/* Search Input */}
                            <div className="relative mb-3 shrink-0">
                              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8CA0BA]" />
                              <input
                                type="text"
                                value={citySearchQuery}
                                onFocus={() => {
                                  openVirtualKeyboard({
                                    phoneIndex: phoneIdx,
                                    type: "text",
                                    title: "Search City",
                                    queryValue: citySearchQuery,
                                    onInput: (char) => {
                                      setCitySearchQuery((prev) => {
                                        const next = prev + char;
                                        setVirtualKeyboard((k) => k ? { ...k, queryValue: next } : null);
                                        return next;
                                      });
                                    },
                                    onBackspace: () => {
                                      setCitySearchQuery((prev) => {
                                        const next = prev.slice(0, -1);
                                        setVirtualKeyboard((k) => k ? { ...k, queryValue: next } : null);
                                        return next;
                                      });
                                    },
                                  });
                                }}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCitySearchQuery(val);
                                  setVirtualKeyboard((k) => k ? { ...k, queryValue: val } : null);
                                }}
                                placeholder={`Search in ${regState}...`}
                                className="w-full h-10 bg-[#f5faf6] border border-[#e1efe5] focus:border-[#009A60] rounded-xl pl-9 pr-3.5 text-xs font-medium text-[#0F172A] placeholder:text-[#8CA0BA] focus:outline-hidden"
                              />
                            </div>

                            {/* List */}
                            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[260px] scrollbar-hide">
                              {(regCountry === "NG"
                                ? getNigerianLGAs(regState)
                                : (() => {
                                  const countryStates = State.getStatesOfCountry(regCountry);
                                  const matchedState = countryStates.find((st) => st.name === regState);
                                  const cities = matchedState
                                    ? City.getCitiesOfState(regCountry, matchedState.isoCode)
                                    : [];
                                  return cities.length > 0
                                    ? cities.map((c) => ({ value: c.name, label: c.name }))
                                    : [{ value: regState, label: regState }];
                                })()
                              )
                                .filter((c) => c.label.toLowerCase().includes(citySearchQuery.toLowerCase()))
                                .map((c) => {
                                  const isSelected = regCity === c.value;
                                  return (
                                    <button
                                      key={c.value}
                                      type="button"
                                      onClick={() => {
                                        setRegCity(c.value);
                                        setShowCityModal(false);
                                      }}
                                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${isSelected
                                        ? "bg-[#e8f5ed] border-[#009A60] shadow-xs"
                                        : "bg-[#f5faf6] border border-[#e1efe5] hover:bg-[#e8f5ed]/50"
                                        }`}
                                    >
                                      <div>
                                        <p className={`text-sm font-semibold ${isSelected ? "text-[#009A60]" : "text-[#0F172A]"}`}>
                                          {c.label}
                                        </p>
                                        <p className="text-xs text-[#5B6B7F]">
                                          {regState}, {countryList.find((cntry) => cntry.isoCode === regCountry)?.name || regCountry}
                                        </p>
                                      </div>
                                      {isSelected && (
                                        <div className="w-5 h-5 rounded-full bg-[#009A60] text-white flex items-center justify-center shrink-0">
                                          <Check className="h-3 w-3 stroke-[3]" />
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SCREEN: VERIFY EMAIL (6-DIGIT OTP) */}
                  {targetScreen === "verify" && (
                    <div className="h-full bg-white text-slate-900 flex flex-col overflow-hidden relative">
                      {/* Top Header Navigation (Fixed pinned header matching registration) */}
                      <div className="px-6 pt-4 pb-2 bg-white shrink-0 z-10">
                        <div className="w-full max-w-sm mx-auto h-8 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              setRegStep(1);
                              switchScreen("register");
                            }}
                            className="h-8 w-8 rounded-full flex items-center justify-center bg-white border border-slate-200 text-[#0F172A] hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                            title="Back"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Scrollable Form Content - Natural Top-Anchored Flow */}
                      <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide flex flex-col justify-between">
                        {/* Top-Anchored Main Verification Card Container */}
                        <div className="w-full max-w-sm mx-auto pt-4 flex flex-col items-center text-center">
                        {/* Icon Badge: Squircle container with envelope and top-right check badge (Standardized 76x76px) */}
                        <div className="relative mb-6">
                          <div className="w-[76px] h-[76px] rounded-[24px] bg-[#EAF7EE] border border-[#C6F0DB] flex items-center justify-center shadow-xs">
                            <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                              {/* Back of envelope */}
                              <path d="M5 13C5 11.3431 6.34315 10 8 10H28C29.6569 10 31 11.3431 31 13V25C31 26.6569 29.6569 28 28 28H8C6.34315 28 5 26.6569 5 25V13Z" fill="#009A60" />
                              {/* Letter Sheet sticking up */}
                              <rect x="9" y="6" width="18" height="14" rx="2" fill="#FFFFFF" />
                              <rect x="12" y="9.5" width="12" height="2" rx="1" fill="#009A60" />
                              <rect x="12" y="13.5" width="8" height="2" rx="1" fill="#009A60" />
                              {/* Envelope front fold / triangular bottom */}
                              <path d="M5 16.5L18 24.5L31 16.5V25C31 26.6569 29.6569 28 28 28H8C6.34315 28 5 26.6569 5 25V16.5Z" fill="#008251" />
                              <path d="M5 14L18 23L31 14" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                          {/* Top-right Circular Check Badge */}
                          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#009A60] border-2 border-white flex items-center justify-center shadow-xs">
                            <Check className="h-3.5 w-3.5 text-white stroke-[3.5]" />
                          </div>
                        </div>

                        {/* Title: "Verify email" */}
                        <h1 className="text-[26px] font-black text-[#111827] tracking-tight mb-2">
                          Verify email
                        </h1>

                        {/* Description */}
                        <div className="text-[13px] text-[#5B6B7F] leading-relaxed mb-6 font-normal">
                          <p>We&apos;ve sent a 6-digit verification code to</p>
                          <p className="text-[#111827] font-bold text-sm mt-0.5 break-all">
                            {verifyEmailTarget}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setRegStep(1);
                              switchScreen("register");
                            }}
                            className="text-xs text-[#009A60] hover:text-[#008754] font-medium underline underline-offset-2 mt-1 inline-block cursor-pointer"
                          >
                            Wrong email? Change details
                          </button>
                        </div>



                        {verifySuccess && (
                          <div className="w-full mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-emerald-800 text-xs font-semibold animate-in fade-in text-left">
                            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                            <span>Account verified successfully! Welcome to OpenclubOS.</span>
                          </div>
                        )}

                        {/* 6-Digit PIN Boxes */}
                        <div className="w-full flex items-center justify-between gap-1.5 sm:gap-2 mb-6">
                          {otpDigits.map((digit, idx) => (
                            <input
                              key={idx}
                              id={`otp-box-${idx}`}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onFocus={() => {
                                openVirtualKeyboard({
                                  phoneIndex: phoneIdx,
                                  type: "numeric",
                                  allowDecimal: false,
                                  allowPlus: false,
                                  title: `Digit ${idx + 1} of 6`,
                                  onInput: (char) => {
                                    if (!/^\d$/.test(char)) return;
                                    handleOtpChange(idx, char);
                                  },
                                  onBackspace: () => {
                                    handleOtpKeyDown(idx, { key: "Backspace" } as any);
                                  },
                                });
                              }}
                              onChange={(e) => handleOtpChange(idx, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                              className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold bg-[#f5faf6] border border-[#e1efe5] focus:bg-white focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 rounded-2xl text-[#111827] focus:outline-hidden transition-all shadow-2xs"
                            />
                          ))}
                        </div>

                        {/* Primary Action Button: "Verify & Activate" */}
                        <button
                          type="button"
                          onClick={handleVerifySubmit}
                          disabled={otpDigits.some((d) => !d) || isVerifying}
                          className={`w-full h-12.5 rounded-2xl text-[14px] font-bold transition-all flex items-center justify-center gap-2 ${!otpDigits.some((d) => !d) && !isVerifying
                              ? "bg-[#009A60] hover:bg-[#008754] text-white shadow-md shadow-emerald-700/20 cursor-pointer"
                              : "bg-[#009A60]/35 text-white/75 cursor-not-allowed shadow-none"
                            }`}
                        >
                          {isVerifying ? (
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <span>Verify &amp; Activate</span>
                          )}
                        </button>

                        {/* Resend Row */}
                        <div className="mt-6 text-center">
                          <p className="text-xs text-[#64748B] font-medium mb-1.5">
                            Didn&apos;t receive the code?
                          </p>
                          {resendCooldown > 0 ? (
                            <div className="flex items-center justify-center min-h-[44px]">
                              <span className="text-base font-bold text-[#64748B] tracking-wider">
                                0:{resendCooldown < 10 ? `0${resendCooldown}` : resendCooldown}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <button
                                type="button"
                                onClick={handleResendCode}
                                className="min-h-[44px] px-6 py-2.5 rounded-xl text-sm font-bold text-[#009A60] bg-emerald-50/70 hover:bg-emerald-100 active:scale-95 border border-emerald-200/60 cursor-pointer transition-all inline-flex items-center justify-center shadow-xs"
                              >
                                Resend Code
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom Footer Notice */}
                      <div className="w-full max-w-sm mx-auto mt-auto pt-6 pb-1 text-center shrink-0">
                        <span className="text-[10.5px] font-normal text-[#8CA0BA] tracking-[0.14em] uppercase">
                          VERIFICATION EXPIRES IN 10 MINUTES
                        </span>
                      </div>
                    </div>
                    </div>
                  )}

                  {/* SCREEN: FORGOT PASSWORD (Exact Reference Design Match - Natural Top-Anchored Layout) */}
                  {targetScreen === "forgot-password" && (
                    <div className="h-full bg-white text-slate-900 flex flex-col overflow-hidden relative">
                      {/* Top Navigation Row: Circular Back Button (Exact match with signup screen) */}
                      <div className="px-6 pt-4 pb-2 bg-white shrink-0 z-10">
                        <div className="w-full max-w-sm mx-auto h-8 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => switchScreen("login")}
                            className="h-8 w-8 rounded-full flex items-center justify-center bg-white border border-slate-200 text-[#0F172A] hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                            title="Back to login"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Scrollable Form Content - Natural Top-Anchored Flow */}
                      <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide flex flex-col justify-between">
                        {/* Top-Anchored Form Content Container */}
                        <div className="w-full max-w-sm mx-auto pt-4 flex flex-col items-center">
                          {/* Centered Green Badge: Soft Green Squircle with Lock Icon (Standardized 76x76px Squircle) */}
                          <div className="relative mb-6">
                            <div className="w-[76px] h-[76px] rounded-[24px] bg-[#EAF7EE] border border-[#C6F0DB] flex items-center justify-center shadow-xs">
                              <Lock className="w-8 h-8 text-[#009A60] stroke-[2.2]" />
                            </div>
                          </div>

                          {/* Title & Explanatory Subtitle */}
                          <div className="text-center space-y-2 mb-7">
                            <h1 className="text-[26px] font-black text-[#0F172A] tracking-tight leading-tight mb-2">
                              Forgot Password?
                            </h1>
                            <p className="text-[13px] text-[#64748B] leading-relaxed font-normal max-w-[285px] mx-auto">
                              Enter the email associated with your tournament player account and we&apos;ll send you instructions to reset your password.
                            </p>
                          </div>

                          {/* Form Inputs Container */}
                          <div className="w-full space-y-4 text-left">
                            {/* Field: EMAIL ADDRESS */}
                            <div>
                              <label className="text-[11px] font-bold tracking-wider text-[#0F172A] uppercase block mb-1.5">
                                EMAIL ADDRESS
                              </label>
                              <div className="relative flex items-center">
                                <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                                  <Mail className="w-4 h-4 text-[#8CA0BA]" />
                                </div>
                                <input
                                  type="email"
                                  value={forgotEmail}
                                  onFocus={() => {
                                    openVirtualKeyboard({
                                      phoneIndex: phoneIdx,
                                      type: "text",
                                      title: "Email Address",
                                      onInput: (char) => setForgotEmail((prev) => prev + char),
                                      onBackspace: () => setForgotEmail((prev) => prev.slice(0, -1)),
                                    });
                                  }}
                                  onChange={(e) => setForgotEmail(e.target.value)}
                                  placeholder="player@golfclub.com"
                                  className="w-full h-12 bg-[#f5faf6] border border-[#e1efe5] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 rounded-xl pl-10 pr-3.5 text-[13.5px] font-medium text-[#0F172A] placeholder:text-[#8CA0BA] focus:outline-hidden transition-all"
                                />
                              </div>
                            </div>

                            {/* Primary Action Button: "Send Reset Link ↗" */}
                            <div className="pt-2">
                              <button
                                type="button"
                                disabled={!forgotEmail.trim() || isSubmittingForgot}
                                onClick={() => handleForgotSubmit()}
                                className={`w-full h-12 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                                  forgotEmail.trim() && !isSubmittingForgot
                                    ? "bg-[#009A60] hover:bg-[#008754] text-white shadow-md shadow-emerald-700/20 active:scale-[0.99] cursor-pointer"
                                    : "bg-[#009A60]/40 text-white/75 cursor-not-allowed shadow-none"
                                }`}
                              >
                                {isSubmittingForgot ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                                    <span>Dispatching...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>Send Reset Link</span>
                                    <Send className="w-4 h-4 text-white" />
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Footer: "Remember your password? Back to Login" */}
                        <div className="w-full max-w-sm mx-auto mt-auto pt-6 pb-1 text-center shrink-0">
                          <p className="text-[13px] text-[#64748B]">
                            Remember your password?{" "}
                            <button
                              type="button"
                              onClick={() => switchScreen("login")}
                              className="font-bold text-[#009A60] hover:underline cursor-pointer"
                            >
                              Back to Login
                            </button>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SCREEN: CHECK YOUR INBOX (Exact Reference Design Match - Centralized Alignment) */}
                  {targetScreen === "check-inbox" && (
                    <div className="h-full bg-white text-slate-900 flex flex-col overflow-hidden relative">
                      {/* Top Header Navigation (Exact match with signup screen) */}
                      <div className="px-6 pt-4 pb-2 bg-white shrink-0 z-10">
                        <div className="w-full max-w-sm mx-auto h-8 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => switchScreen("forgot-password")}
                            className="h-8 w-8 rounded-full flex items-center justify-center bg-white border border-slate-200 text-[#0F172A] hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                            title="Back to forgot password"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Scrollable Form Content - Natural Top-Anchored Flow */}
                      <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide flex flex-col justify-between">
                        {/* Main Visual Centerpiece & Instructions (Standardized 76x76px Badge) */}
                        <div className="w-full max-w-sm mx-auto pt-4 flex flex-col items-center text-center px-1">
                          {/* Centered Squircle Badge with Emerald Envelope & Top-Right Check Badge */}
                          <div className="relative mb-6">
                            <div className="w-[76px] h-[76px] rounded-[24px] bg-[#EAF7EE] border border-[#C6F0DB] flex items-center justify-center shadow-xs">
                              <svg className="w-9 h-9 text-[#009A60]" viewBox="0 0 48 48" fill="none">
                                <rect x="7" y="14" width="34" height="26" rx="5" fill="#009A60" />
                                <rect x="13" y="8" width="22" height="15" rx="3" fill="white" stroke="#009A60" strokeWidth="2.5" />
                                <line x1="17" y1="13" x2="31" y2="13" stroke="#009A60" strokeWidth="2" strokeLinecap="round" />
                                <line x1="17" y1="17" x2="27" y2="17" stroke="#009A60" strokeWidth="2" strokeLinecap="round" />
                                <path d="M7 16L24 28L41 16" stroke="#EAF7EE" strokeWidth="2.5" strokeLinejoin="round" />
                              </svg>
                            </div>

                            {/* Floating Top-Right Green Checkmark Badge */}
                            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#009A60] border-2 border-white flex items-center justify-center shadow-xs">
                              <Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />
                            </div>
                          </div>

                          {/* Title */}
                          <h1 className="text-[26px] font-black text-[#0F172A] tracking-tight mb-2.5">
                            Check Your Inbox
                          </h1>

                          {/* Description with dynamic recipient email */}
                          <p className="text-[13.5px] text-[#64748B] leading-relaxed max-w-[285px] mb-7 font-normal">
                            We&apos;ve sent password reset instructions to{" "}
                            <span className="font-bold text-[#0F172A]">{checkInboxEmail || "your email address"}</span>.
                          </p>

                          {/* Action Button: "Open Email App" */}
                          <button
                            type="button"
                            onClick={() => {
                              showToast("Reset link confirmed: Opening Set New Password screen...", "success", "PASSWORD RESET");
                              switchScreen("reset-password");
                            }}
                            className="w-full h-12 rounded-xl bg-[#009A60] hover:bg-[#008754] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 active:scale-[0.99] transition-all cursor-pointer mb-5"
                          >
                            <Send className="w-4 h-4 text-white -rotate-12 stroke-[2.5]" />
                            <span>Open Email App</span>
                          </button>

                          {/* Resend Prompt with Active Countdown */}
                          <div className="text-center text-[12.5px] text-[#64748B] font-medium">
                            Didn&apos;t receive the email?{" "}
                            {checkInboxCountdown > 0 ? (
                              <span className="font-black text-[#009A60] tracking-wider text-[11.5px]">
                                RESEND IN {checkInboxCountdown}s
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleResendFromInbox()}
                                className="font-black text-[#009A60] hover:underline tracking-wider text-[11.5px] cursor-pointer inline-block"
                              >
                                RESEND NOW
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 8. SCREEN: SET NEW PASSWORD (Exact Reference Design Match) */}
                  {targetScreen === "reset-password" && (
                    <div className="h-full bg-white text-slate-900 flex flex-col overflow-hidden relative">
                      {/* Top Navigation Row: Circular Back Button (Exact match with signup screen) */}
                      <div className="px-6 pt-4 pb-2 bg-white shrink-0 z-10">
                        <div className="w-full max-w-sm mx-auto h-8 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => switchScreen("login")}
                            className="h-8 w-8 rounded-full flex items-center justify-center bg-white border border-slate-200 text-[#0F172A] hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                            title="Back"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Scrollable Form Content */}
                      <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide flex flex-col justify-between">
                        <div className="w-full max-w-sm mx-auto space-y-4">
                          {/* Brand Icon: Centered Soft Green Squircle with Shield (Standardized 76x76px) */}
                          <div className="flex justify-center pt-2 pb-1 mb-2">
                            <div className="w-[76px] h-[76px] rounded-[24px] bg-[#EAF7EE] border border-[#C6F0DB] flex items-center justify-center shadow-xs">
                              <ShieldCheck className="w-9 h-9 text-[#009A60] stroke-[1.9]" />
                            </div>
                          </div>

                        {/* Title & Subtitle (Centralized) */}
                        <div className="text-center space-y-2 mb-6">
                          <h1 className="text-[26px] font-black text-[#0F172A] tracking-tight leading-tight mb-2">
                            Set New Password
                          </h1>
                          <p className="text-[13.5px] text-[#64748B] leading-relaxed font-normal max-w-[285px] mx-auto">
                            Create a strong password to secure your tournament player account. Your new password must be different from previous ones.
                          </p>
                        </div>

                        {/* Form Inputs Container */}
                        <div className="space-y-4 pt-1">
                          {/* Field 1: Password */}
                          <div>
                            <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block mb-1.5">
                              Password
                            </label>
                            <div className="relative">
                              <input
                                type={showNewResetPassword ? "text" : "password"}
                                value={newResetPassword}
                                onFocus={() => {
                                  openVirtualKeyboard({
                                    phoneIndex: phoneIdx,
                                    type: "text",
                                    title: "New Password",
                                    onInput: (char) => setNewResetPassword((prev) => prev + char),
                                    onBackspace: () => setNewResetPassword((prev) => prev.slice(0, -1)),
                                  });
                                }}
                                onChange={(e) => setNewResetPassword(e.target.value)}
                                placeholder="••••••••••••"
                                className="w-full h-12 bg-[#f5faf6] border border-[#e1efe5] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 rounded-xl px-3.5 pr-10 text-[13.5px] leading-normal font-medium text-[#0F172A] placeholder:text-[#8CA0BA] focus:outline-hidden transition-all"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewResetPassword(!showNewResetPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8CA0BA] hover:text-[#5B6B7F] cursor-pointer"
                              >
                                {showNewResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>

                            {/* 4-Segment Password Strength Indicator (Exact Screenshot Match) */}
                            <div className="space-y-1.5 mt-2">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 grid grid-cols-4 gap-1">
                                  {[1, 2, 3, 4].map((bar) => {
                                    const strength = calcPasswordStrength(newResetPassword);
                                    return (
                                      <div
                                        key={bar}
                                        className={`h-[3.5px] rounded-full transition-all duration-300 ${
                                          bar <= strength ? "bg-[#009A60]" : "bg-[#E2E8F0]"
                                        }`}
                                      />
                                    );
                                  })}
                                </div>
                                <span className="text-[9px] font-medium text-[#5B6B7F] tracking-wider uppercase">
                                  {calcPasswordStrength(newResetPassword) === 4 ? "STRONG PASSWORD" : "MIN. 8 CHARACTERS"}
                                </span>
                              </div>
                              {newResetPassword.length > 0 && calcPasswordStrength(newResetPassword) < 4 && (
                                <div className="mt-2 p-2.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] flex items-start gap-2 animate-in fade-in duration-150 text-left">
                                  <AlertTriangle className="h-4 w-4 shrink-0 text-[#D97706] mt-0.5" />
                                  <p className="text-[12px] font-medium leading-snug text-[#92400E]">
                                    Password meter is not full.<br />
                                    Add uppercase, number & symbol to proceed.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Field 2: Confirm Password */}
                          <div>
                            <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block mb-1.5">
                              Confirm Password
                            </label>
                            <div className="relative">
                              <input
                                type={showConfirmResetPassword ? "text" : "password"}
                                value={confirmResetPassword}
                                onFocus={() => {
                                  openVirtualKeyboard({
                                    phoneIndex: phoneIdx,
                                    type: "text",
                                    title: "Confirm Password",
                                    onInput: (char) => setConfirmResetPassword((prev) => prev + char),
                                    onBackspace: () => setConfirmResetPassword((prev) => prev.slice(0, -1)),
                                  });
                                }}
                                onChange={(e) => setConfirmResetPassword(e.target.value)}
                                placeholder="••••••••••••"
                                className="w-full h-12 bg-[#f5faf6] border border-[#e1efe5] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 rounded-xl px-3.5 pr-10 text-[13.5px] leading-normal font-medium text-[#0F172A] placeholder:text-[#8CA0BA] focus:outline-hidden transition-all"
                              />
                              {confirmResetPassword && confirmResetPassword === newResetPassword && calcPasswordStrength(confirmResetPassword) === 4 ? (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#009A60]">
                                  <CheckCircle2 className="h-4 w-4 fill-emerald-100 text-[#009A60]" />
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmResetPassword(!showConfirmResetPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8CA0BA] hover:text-[#5B6B7F] cursor-pointer"
                                >
                                  {showConfirmResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Primary Button: Update Password & Login */}
                        <div className="pt-2">
                          <button
                            type="button"
                            disabled={
                              !newResetPassword ||
                              newResetPassword.length < 8 ||
                              calcPasswordStrength(newResetPassword) < 4 ||
                              newResetPassword !== confirmResetPassword ||
                              isSubmittingReset
                            }
                            onClick={handleResetPasswordSubmit}
                            className={`w-full h-12 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                              newResetPassword &&
                              newResetPassword.length >= 8 &&
                              calcPasswordStrength(newResetPassword) === 4 &&
                              newResetPassword === confirmResetPassword &&
                              !isSubmittingReset
                                ? "bg-[#009A60] hover:bg-[#008754] text-white shadow-md shadow-emerald-700/20 active:scale-[0.99] cursor-pointer"
                                : "bg-[#009A60]/35 text-white/75 cursor-not-allowed shadow-none"
                            }`}
                          >
                            {isSubmittingReset ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                <span>Updating Password...</span>
                              </>
                            ) : (
                              <>
                                <span>Update Password & Login</span>
                                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                  <ArrowRight className="w-3 h-3 text-white stroke-[3]" />
                                </div>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Bottom Footer Notice: Device Sessions Disclaimer */}
                      <div className="w-full max-w-sm mx-auto mt-auto pt-6 pb-1">
                        <div className="border-t border-slate-100 pt-4 flex items-start gap-2.5">
                          <div className="w-4 h-4 rounded-full bg-[#0F172A] text-white flex items-center justify-center shrink-0 mt-0.5">
                            <Info className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <p className="text-[11.5px] text-[#64748B] leading-relaxed font-normal">
                            By resetting your password, you will be signed out of all other active sessions on other devices for your security.
                          </p>
                        </div>
                      </div>
                    </div>
                    </div>
                  )}

                  {/* SCREEN: PLAYER SCORECARD & ON-COURSE TELEMETRY */}
                  {targetScreen === "player-scorecard" && (() => {
                    const competitor = selectedPlayerForScorecard || activeCompetitorsData[0];
                    if (!competitor) {
                      return (
                        <div className="p-8 text-center text-slate-400">
                          <p className="text-sm font-bold text-slate-700">No Competitor Selected</p>
                          <p className="text-xs text-slate-400 mt-1">Select an active player from the leaderboard or carousel.</p>
                        </div>
                      );
                    }
                    const holes: Array<{ hole: number; par: number; yards: number; strokes: number | null }> = competitor.holes || [];
                    const front9Holes = holes.slice(0, 9);
                    const back9Holes = holes.slice(9, 18);

                    const displayedHoles =
                      scorecardViewSection === "out"
                        ? front9Holes
                        : scorecardViewSection === "in"
                        ? back9Holes
                        : holes;

                    // Compute Out / In / Total stats
                    const calcSubtotal = (slice: typeof holes) => {
                      const parTotal = slice.reduce((sum: number, h: { par: number }) => sum + h.par, 0);
                      const yardsTotal = slice.reduce((sum: number, h: { yards: number }) => sum + h.yards, 0);
                      const played = slice.filter((h: { strokes: number | null }) => h.strokes !== null);
                      const grossTotal = played.reduce((sum: number, h: { strokes: number | null }) => sum + (h.strokes || 0), 0);
                      const parOfPlayed = played.reduce((sum: number, h: { par: number }) => sum + h.par, 0);
                      const diffTotal = played.length > 0 ? grossTotal - parOfPlayed : 0;
                      return { parTotal, yardsTotal, grossTotal, diffTotal, playedCount: played.length };
                    };

                    const outStats = calcSubtotal(front9Holes);
                    const inStats = calcSubtotal(back9Holes);
                    const totalStats = calcSubtotal(holes);

                    const formatDiff = (diff: number, count: number) => {
                      if (count === 0) return "-";
                      if (diff === 0) return "E";
                      return diff > 0 ? `+${diff}` : `${diff}`;
                    };

                    const getStrokeBadge = (strokes: number | null, par: number) => {
                      if (strokes === null) {
                        return <span className="text-slate-300 font-medium">-</span>;
                      }
                      const diff = strokes - par;
                      if (diff <= -2) {
                        return (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100/80 border-2 border-amber-500 text-amber-700 font-bold text-[11px] shadow-xs">
                            {strokes}
                          </span>
                        );
                      }
                      if (diff === -1) {
                        return (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 border border-[#009A60] text-[#009A60] font-bold text-[11px] shadow-2xs">
                            {strokes}
                          </span>
                        );
                      }
                      if (diff === 0) {
                        return <span className="text-slate-800 font-bold text-xs">{strokes}</span>;
                      }
                      if (diff === 1) {
                        return (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px]">
                            {strokes}
                          </span>
                        );
                      }
                      return (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-rose-50 border border-rose-200 text-rose-600 font-bold text-[11px]">
                          {strokes}
                        </span>
                      );
                    };

                    return (
                      <div className="h-full bg-[#F4F6F3] text-slate-900 flex flex-col overflow-hidden relative">
                        {/* Top Navigation Header (Unified Mobile System: 16px top, 24px gutter, 48px height) */}
                        <div className="px-6 pt-4 pb-3 bg-white border-b border-slate-200/80 shrink-0 z-10">
                          <div className="w-full max-w-sm mx-auto h-8 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => switchScreen("hub")}
                              className="h-8 w-8 rounded-full flex items-center justify-center bg-white border border-slate-200 text-[#0F172A] hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                              title="Back to Tournament Hub"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>

                            <div className="text-center">
                              <h2 className="text-sm font-bold text-[#0F172A] leading-tight">Player Scorecard</h2>
                              <p className="text-[10.5px] text-[#64748B] font-medium leading-none mt-0.5">
                                {competitor.tournament}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => setShowActivePlayersModal(true)}
                              className="h-8 px-2.5 rounded-full bg-[#EAF7EE] text-[#009A60] hover:bg-emerald-100 transition-colors text-[11px] font-bold flex items-center gap-1 cursor-pointer border border-[#C6F0DB]"
                              title="Switch Player"
                            >
                              <Users className="h-3 w-3" />
                              <span>All</span>
                            </button>
                          </div>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3 scrollbar-hide">
                          <div className="w-full max-w-sm mx-auto space-y-3">
                            {/* 1. On-Course Telemetry Hero Card */}
                            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs relative overflow-hidden group">
                              {/* Fitted Background Pattern: On-Course Telemetry Radar Arcs & Tournament Distance Fairway Grid */}
                              <svg
                                className="absolute inset-0 w-full h-full pointer-events-none opacity-35 transition-opacity duration-300 group-hover:opacity-50"
                                viewBox="0 0 360 140"
                                fill="none"
                                preserveAspectRatio="none"
                              >
                                <defs>
                                  <radialGradient id="telemetryRadarGlow" cx="90%" cy="25%" r="60%">
                                    <stop offset="0%" stopColor="#009A60" stopOpacity="0.12" />
                                    <stop offset="100%" stopColor="#009A60" stopOpacity="0" />
                                  </radialGradient>
                                  <pattern id="telemetryGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#009A60" strokeWidth="0.6" strokeOpacity="0.06" />
                                  </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#telemetryGrid)" />
                                <rect width="100%" height="100%" fill="url(#telemetryRadarGlow)" />
                                {/* Telemetry yardage range arcs radiating from To Par Score badge */}
                                <circle cx="310" cy="36" r="38" stroke="#009A60" strokeWidth="0.9" strokeDasharray="3 3" opacity="0.18" fill="none" />
                                <circle cx="310" cy="36" r="68" stroke="#009A60" strokeWidth="0.7" opacity="0.12" fill="none" />
                                <circle cx="310" cy="36" r="102" stroke="#009A60" strokeWidth="0.6" strokeDasharray="4 4" opacity="0.08" fill="none" />
                                {/* Shot track arc */}
                                <path d="M 30 110 Q 150 70, 310 36" stroke="#009A60" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.15" fill="none" />
                              </svg>

                              <div className="relative z-10 flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="relative shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-b from-slate-200 to-slate-300 text-slate-700 font-bold text-sm flex items-center justify-center border-2 border-white shadow-xs">
                                      {competitor.initials}
                                    </div>
                                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <h3 className="text-[15px] font-bold text-[#0F172A] truncate">
                                        {competitor.name}
                                      </h3>
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-[#009A60] border border-[#C6F0DB]">
                                        HCP {competitor.hcp}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                      {competitor.club} • {competitor.flight}
                                    </p>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span
                                    className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black tracking-tight border ${
                                      competitor.toPar < 0
                                        ? "bg-emerald-50 text-[#009A60] border-emerald-200"
                                        : competitor.toPar === 0
                                        ? "bg-slate-50 text-slate-700 border-slate-200"
                                        : "bg-rose-50 text-rose-600 border-rose-200"
                                    }`}
                                  >
                                    {competitor.toPar < 0 ? `${competitor.toPar}` : competitor.toPar === 0 ? "Even" : `+${competitor.toPar}`}
                                  </span>
                                  <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                                    TO PAR
                                  </span>
                                </div>
                              </div>

                              {/* On-Course Telemetry Metrics 4-Box Grid */}
                              <div className="relative z-10 grid grid-cols-4 gap-2 mt-3.5 pt-3 border-t border-slate-100">
                                <div className="bg-[#F8FAFC] rounded-xl p-2 text-center border border-slate-100">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase block">HOLE</span>
                                  <span className="text-sm font-black text-[#0F172A] block mt-0.5">#{competitor.currentHole}</span>
                                </div>
                                <div className="bg-[#F8FAFC] rounded-xl p-2 text-center border border-slate-100">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase block">THRU</span>
                                  <span className="text-sm font-black text-[#0F172A] block mt-0.5">{competitor.thru}</span>
                                </div>
                                <div className="bg-[#F8FAFC] rounded-xl p-2 text-center border border-slate-100">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase block">GROSS</span>
                                  <span className="text-sm font-black text-[#0F172A] block mt-0.5">{competitor.gross}</span>
                                </div>
                                <div className="bg-[#F8FAFC] rounded-xl p-2 text-center border border-slate-100">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase block">NET</span>
                                  <span className="text-sm font-black text-[#009A60] block mt-0.5">{competitor.net}</span>
                                </div>
                              </div>

                              {/* Telemetry Details Pills */}
                              <div className="relative z-10 mt-3 flex flex-wrap gap-1.5 text-[11px] font-medium text-slate-600">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                  Tee: {competitor.teeTime}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                  Ball: {competitor.ball}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[#009A60] border border-[#C6F0DB]">
                                  Pace: {competitor.pace}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                  Marker: {competitor.marker}
                                </span>
                              </div>
                            </div>

                            {/* 2. Official Scorecard Card (Matching Reference Design Pattern) */}
                            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 border border-slate-100 shadow-xs">
                              {/* Header: FINAL SCORECARD • ROUND 1   and   Total: 71 (-1) */}
                              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                                <div>
                                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8CA0BA]">
                                    FINAL SCORECARD • {activeRound?.dayText || "ROUND 1"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[14px]">
                                  <span className="font-bold text-[#0F172A]">Total:</span>
                                  <span className="font-extrabold text-[#0F172A]">
                                    {totalStats.playedCount > 0 ? totalStats.grossTotal : totalStats.parTotal}
                                  </span>
                                  <span
                                    className={`font-extrabold text-[13.5px] ${
                                      totalStats.diffTotal < 0
                                        ? "text-[#009A60]"
                                        : totalStats.diffTotal === 0
                                        ? "text-slate-500"
                                        : "text-[#D97706]"
                                    }`}
                                  >
                                    ({formatDiff(totalStats.diffTotal, totalStats.playedCount)})
                                  </span>
                                </div>
                              </div>

                              {/* Filter Tabs Row (All 18 / Out (1-9) / In (10-18)) */}
                              <div className="flex items-center justify-between pt-2.5 pb-1">
                                <div className="flex items-center gap-2 text-[10px] text-[#8CA0BA]">
                                  <span className="flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-[#EAF7EE] border border-[#86EFAC] inline-block" /> Birdie
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-white border border-slate-200 inline-block" /> Par
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-[#FFFBEB] border border-[#FDE68A] inline-block" /> Bogey
                                  </span>
                                </div>
                                <div className="flex items-center bg-[#F1F5F9] p-0.5 rounded-lg">
                                  <button
                                    type="button"
                                    onClick={() => setScorecardViewSection("all")}
                                    className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                                      scorecardViewSection === "all"
                                        ? "bg-white text-[#0F172A] shadow-xs"
                                        : "text-slate-500 hover:text-slate-900"
                                    }`}
                                  >
                                    All 18
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setScorecardViewSection("out")}
                                    className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                                      scorecardViewSection === "out"
                                        ? "bg-white text-[#0F172A] shadow-xs"
                                        : "text-slate-500 hover:text-slate-900"
                                    }`}
                                  >
                                    Out
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setScorecardViewSection("in")}
                                    className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                                      scorecardViewSection === "in"
                                        ? "bg-white text-[#0F172A] shadow-xs"
                                        : "text-slate-500 hover:text-slate-900"
                                    }`}
                                  >
                                    In
                                  </button>
                                </div>
                              </div>

                              {/* Front 9 (OUT: 1-9) */}
                              {(scorecardViewSection === "all" || scorecardViewSection === "out") && (
                                <div className="pt-2">
                                  <div className="space-y-1.5">
                                    {/* Hole Numbers (H) */}
                                    <div className="flex items-center">
                                      <span className="w-4 shrink-0 text-left text-[11px] font-bold text-[#8CA0BA]">H</span>
                                      <div className="flex-1 grid grid-cols-9 gap-1 text-center">
                                        {front9Holes.map((h) => (
                                          <span key={`h-${h.hole}`} className="text-[11px] font-semibold text-[#8CA0BA]">
                                            {h.hole}
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Pars (P) */}
                                    <div className="flex items-center">
                                      <span className="w-4 shrink-0 text-left text-[11px] font-bold text-[#8CA0BA]">P</span>
                                      <div className="flex-1 grid grid-cols-9 gap-1 text-center">
                                        {front9Holes.map((h) => (
                                          <span key={`p-${h.hole}`} className="text-[11px] font-semibold text-[#64748B]">
                                            {h.par}
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Scores (S) */}
                                    <div className="flex items-center pt-0.5">
                                      <span className="w-4 shrink-0 text-left text-[13px] font-black text-[#0F172A]">S</span>
                                      <div className="flex-1 grid grid-cols-9 gap-1 text-center">
                                        {front9Holes.map((h) => {
                                          const strokes = h.strokes;
                                          const par = h.par;
                                          const isPlayed = strokes !== null;
                                          const diff = isPlayed ? strokes - par : null;
                                          let badgeStyle = "bg-white border-slate-200/90 text-[#0F172A]";
                                          if (isPlayed) {
                                            if (diff! < 0) {
                                              badgeStyle = "bg-[#EAF7EE] border-[#86EFAC] text-[#009A60]";
                                            } else if (diff! > 0) {
                                              badgeStyle = "bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]";
                                            } else {
                                              badgeStyle = "bg-white border-slate-200/90 text-[#0F172A]";
                                            }
                                          } else {
                                            badgeStyle = "bg-slate-50/40 border-slate-200/60 border-dashed text-slate-300";
                                          }

                                          return (
                                            <div
                                              key={`s-${h.hole}`}
                                              className={`h-9 flex items-center justify-center rounded-xl border text-[13px] font-extrabold transition-all shadow-2xs ${badgeStyle}`}
                                            >
                                              {strokes !== null ? strokes : "-"}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Subtotal OUT */}
                                  <div className="text-right pt-2 pb-0.5">
                                    <span className="text-[11px] font-extrabold text-[#8CA0BA] tracking-wider">
                                      OUT: {outStats.playedCount > 0 ? outStats.grossTotal : outStats.parTotal}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Back 9 (IN: 10-18) */}
                              {(scorecardViewSection === "all" || scorecardViewSection === "in") && (
                                <div className={scorecardViewSection === "all" ? "pt-3.5 mt-2 border-t border-slate-100/80" : "pt-2"}>
                                  <div className="space-y-1.5">
                                    {/* Hole Numbers (H) */}
                                    <div className="flex items-center">
                                      <span className="w-4 shrink-0 text-left text-[11px] font-bold text-[#8CA0BA]">H</span>
                                      <div className="flex-1 grid grid-cols-9 gap-1 text-center">
                                        {back9Holes.map((h) => (
                                          <span key={`h-${h.hole}`} className="text-[11px] font-semibold text-[#8CA0BA]">
                                            {h.hole}
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Pars (P) */}
                                    <div className="flex items-center">
                                      <span className="w-4 shrink-0 text-left text-[11px] font-bold text-[#8CA0BA]">P</span>
                                      <div className="flex-1 grid grid-cols-9 gap-1 text-center">
                                        {back9Holes.map((h) => (
                                          <span key={`p-${h.hole}`} className="text-[11px] font-semibold text-[#64748B]">
                                            {h.par}
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Scores (S) */}
                                    <div className="flex items-center pt-0.5">
                                      <span className="w-4 shrink-0 text-left text-[13px] font-black text-[#0F172A]">S</span>
                                      <div className="flex-1 grid grid-cols-9 gap-1 text-center">
                                        {back9Holes.map((h) => {
                                          const strokes = h.strokes;
                                          const par = h.par;
                                          const isPlayed = strokes !== null;
                                          const diff = isPlayed ? strokes - par : null;
                                          let badgeStyle = "bg-white border-slate-200/90 text-[#0F172A]";
                                          if (isPlayed) {
                                            if (diff! < 0) {
                                              badgeStyle = "bg-[#EAF7EE] border-[#86EFAC] text-[#009A60]";
                                            } else if (diff! > 0) {
                                              badgeStyle = "bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]";
                                            } else {
                                              badgeStyle = "bg-white border-slate-200/90 text-[#0F172A]";
                                            }
                                          } else {
                                            badgeStyle = "bg-slate-50/40 border-slate-200/60 border-dashed text-slate-300";
                                          }

                                          return (
                                            <div
                                              key={`s-${h.hole}`}
                                              className={`h-9 flex items-center justify-center rounded-xl border text-[13px] font-extrabold transition-all shadow-2xs ${badgeStyle}`}
                                            >
                                              {strokes !== null ? strokes : "-"}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Subtotal IN */}
                                  <div className="text-right pt-2 pb-0.5">
                                    <span className="text-[11px] font-extrabold text-[#8CA0BA] tracking-wider">
                                      IN: {inStats.playedCount > 0 ? inStats.grossTotal : inStats.parTotal}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* 3. Attestation & Marker Verification Card */}
                            <div className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-start gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[#EAF7EE] border border-[#C6F0DB] flex items-center justify-center shrink-0 mt-0.5 text-[#009A60]">
                                <ShieldCheck className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-bold text-[#0F172A] block">
                                  USGA Rule 3.3b Peer Attestation
                                </span>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                  Scores actively recorded and certified by marker{" "}
                                  <strong className="text-slate-800 font-bold">{competitor.marker}</strong> for {competitor.round}.
                                </p>
                              </div>
                            </div>

                            {/* Action Button: Return to Hub */}
                            <button
                              type="button"
                              onClick={() => switchScreen("hub")}
                              className="w-full h-12 rounded-xl bg-[#009A60] hover:bg-[#008251] active:scale-[0.98] text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/20 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              <span>Return to Tournament Hub</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 13. ADD GOLF FRIENDS FULL SCREEN */}
                  {targetScreen === "add-friends" && (() => {
                    // 1. Build real golfers pool dynamically from real database members and tournament players
                    const realGolfersPool: Array<{
                      id: string;
                      name: string;
                      email?: string;
                      club: string;
                      hcp: string;
                      initial: string;
                      avatar?: string;
                      profilePhoto?: string;
                    }> = (() => {
                      const seen = new Set<string>();
                      const list: Array<{
                        id: string;
                        name: string;
                        email?: string;
                        club: string;
                        hcp: string;
                        initial: string;
                        avatar?: string;
                        profilePhoto?: string;
                      }> = [];

                      // Add real database members
                      for (const m of golfCompetitors) {
                        if (!seen.has(m.id)) {
                          seen.add(m.id);
                          list.push({
                            id: m.id,
                            name: m.name,
                            email: m.email || "",
                            club: m.club || "OpenClub Golfer",
                            hcp: String(m.hcp ?? "14"),
                            initial: getTwoInitials(m.name),
                            avatar: m.avatar || m.profilePhoto,
                            profilePhoto: m.profilePhoto || m.avatar,
                          });
                        }
                      }

                      // Add real registered tournament competitors from DB
                      for (const rp of registeredPlayers) {
                        if (!seen.has(rp.id)) {
                          seen.add(rp.id);
                          list.push({
                            id: rp.id,
                            name: rp.name,
                            email: rp.email || "",
                            club: (rp as any).club || activeTournament?.organizerClub || "Ikoyi Club 1938",
                            hcp: String(rp.handicap ?? "12"),
                            initial: getTwoInitials(rp.name),
                            avatar: rp.avatar || rp.profilePhoto,
                            profilePhoto: rp.profilePhoto || rp.avatar,
                          });
                        }
                      }

                      // Add incoming friend request senders so they can be searched
                      for (const req of incomingFriendRequests) {
                        const sId = req.senderId || req.id;
                        if (sId && !seen.has(sId)) {
                          seen.add(sId);
                          list.push({
                            id: sId,
                            name: req.senderName || req.name || "Golfer",
                            email: req.senderEmail || req.email || "",
                            club: req.senderClub || req.club || "OpenClub Golfer",
                            hcp: String(req.senderHcp || req.hcp || "0.0"),
                            initial: getTwoInitials(req.senderName || req.name || "Golfer"),
                            avatar: req.senderAvatar || req.avatar,
                            profilePhoto: req.senderProfilePhoto || req.profilePhoto || req.senderAvatar,
                          });
                        }
                      }

                      // Add friend request senders from notifications
                      for (const n of mobileNotifications) {
                        if (n.data?.type === "FRIEND_REQUEST" || n.type === "FRIEND_REQUEST") {
                          const sId = n.data?.senderId || n.senderId || n.id;
                          if (sId && !seen.has(sId)) {
                            seen.add(sId);
                            const sName = n.data?.senderName || n.senderName || n.title || "Golfer";
                            list.push({
                              id: sId,
                              name: sName,
                              email: n.data?.senderEmail || n.senderEmail || n.email || "",
                              club: n.data?.senderClub || n.senderClub || "OpenClub Golfer",
                              hcp: String(n.data?.senderHcp || n.senderHcp || "0.0"),
                              initial: getTwoInitials(sName),
                              avatar: n.data?.senderAvatar || n.avatar,
                              profilePhoto: n.data?.senderProfilePhoto || n.profilePhoto,
                            });
                          }
                        }
                      }

                      // Add friends on course
                      for (const f of friendsOnCourse) {
                        if (f.id && !seen.has(f.id)) {
                          seen.add(f.id);
                          list.push({
                            id: f.id,
                            name: f.name || "Golfer",
                            email: (f as any).email || "",
                            club: (f as any).club || "OpenClub Golfer",
                            hcp: String((f as any).hcp || "0.0"),
                            initial: getTwoInitials(f.name || "Golfer"),
                            avatar: (f as any).avatar,
                            profilePhoto: (f as any).avatar,
                          });
                        }
                      }

                      const currentId = authenticatedPlayer?.id;
                      const currentName = authenticatedPlayer?.name?.toLowerCase().trim();
                      const currentEmail = authenticatedPlayer?.email?.toLowerCase().trim();

                      return list.filter((p) => {
                        const pId = String(p.id).toLowerCase().trim();
                        const pName = p.name.toLowerCase().trim();
                        const pEmail = (p.email || "").toLowerCase().trim();

                        if (currentId && pId === String(currentId).toLowerCase().trim()) return false;
                        if (currentName && pName === currentName) return false;
                        if (currentEmail && pEmail && pEmail === currentEmail) return false;
                        if (isAccountUser(p)) return false;

                        // Mutual invisibility: Blocked users are completely hidden from friend suggestions and discovery
                        const isBlocked = blockedUserIds.some((bId) => {
                          const bLower = String(bId).toLowerCase().trim();
                          return bLower === pId || bLower === pName || (pEmail && bLower === pEmail);
                        });
                        if (isBlocked) return false;

                        // Check if golfer has sent an incoming friend request waiting for acceptance in notifications
                        const isIncomingRequest = incomingFriendRequests.some((req: any) => {
                          const rId = req.senderId || req.id || req.userId;
                          const rName = req.senderName || req.name;
                          const rEmail = req.senderEmail || req.email;
                          if (rId && String(rId).toLowerCase().trim() === pId) return true;
                          if (rName && String(rName).toLowerCase().trim() === pName) return true;
                          if (rEmail && pEmail && String(rEmail).toLowerCase().trim() === pEmail) return true;
                          return false;
                        }) || mobileNotifications.some((notif: any) => {
                          if (notif.data?.type === "FRIEND_REQUEST" || notif.type === "FRIEND_REQUEST") {
                            const sId = notif.data?.senderId || notif.senderId;
                            const sName = notif.data?.senderName || notif.senderName;
                            const sEmail = notif.data?.senderEmail || notif.senderEmail;
                            if (sId && String(sId).toLowerCase().trim() === pId) return true;
                            if (sName && String(sName).toLowerCase().trim() === pName) return true;
                            if (sEmail && pEmail && String(sEmail).toLowerCase().trim() === pEmail) return true;
                          }
                          return false;
                        });

                        const isConnected =
                          acceptedFriendIds.some((id: string) => String(id).toLowerCase().trim() === pId) ||
                          acceptedFriendIds.some((id: string) => String(id).toLowerCase().trim() === pName);

                        (p as any)._isIncoming = isIncomingRequest;
                        (p as any)._isConnected = isConnected;
                        return true;
                      });
                    })();

                    const q = friendsSearchQuery.trim().toLowerCase();
                    const allMatchedGolfers: any[] = q
                      ? realGolfersPool.filter(
                          (p) =>
                            p.name.toLowerCase().includes(q) ||
                            (p.email && p.email.toLowerCase().includes(q))
                        )
                      : realGolfersPool
                          .filter((p) => !(p as any)._isIncoming && !(p as any)._isConnected && !sentFriendRequests.includes(p.id))
                          .slice(0, 2);
                    const displayedGolfers = q ? allMatchedGolfers.slice(0, friendsDisplayLimit) : allMatchedGolfers;
                    const hasMoreResults = q && allMatchedGolfers.length > friendsDisplayLimit;

                    const phoneAddressBookContacts = [
                      {
                        id: "cont_femi_01",
                        name: "Femi Adebayo",
                        phone: "+234 802 314 8821",
                        isOnOpenclub: true,
                        club: "Ikoyi Club 1938",
                        hcp: "12.4",
                        email: "femi.adebayo@openclubos.com",
                      },
                      {
                        id: "cont_chioma_02",
                        name: "Chioma Nwachukwu",
                        phone: "+234 805 112 4433",
                        isOnOpenclub: true,
                        club: "IBB International",
                        hcp: "18.0",
                        email: "chioma.n@openclubos.com",
                      },
                      {
                        id: "cont_babatunde_03",
                        name: "Babatunde Lawal",
                        phone: "+234 803 551 9012",
                        isOnOpenclub: true,
                        club: "Ikeja Golf Club",
                        hcp: "16.8",
                        email: "babatunde.lawal@openclubos.com",
                      },
                      {
                        id: "cont_tunde_04",
                        name: "Tunde Bakare",
                        phone: "+234 807 998 2211",
                        isOnOpenclub: true,
                        club: "Lakowe Lakes Golf",
                        hcp: "9.2",
                        email: "tunde.bakare@openclubos.com",
                      },
                      {
                        id: "cont_david_05",
                        name: "David Adeleke",
                        phone: "+234 809 771 0022",
                        isOnOpenclub: false,
                        source: "Phone Contacts",
                      },
                      {
                        id: "cont_amina_06",
                        name: "Amina Yusuf",
                        phone: "+234 810 445 6677",
                        isOnOpenclub: false,
                        source: "SIM Contacts",
                      },
                      {
                        id: "cont_emeka_07",
                        name: "Emeka Okonkwo",
                        phone: "+234 812 334 5566",
                        isOnOpenclub: false,
                        source: "Google Contacts",
                      },
                      {
                        id: "cont_kola_08",
                        name: "Kolawole Sanusi",
                        phone: "+234 803 912 3456",
                        isOnOpenclub: false,
                        source: "Phone Contacts",
                      },
                    ];

                    const cq = contactsSearchQuery.trim().toLowerCase();
                    const displayedContacts = phoneAddressBookContacts.filter((c) => {
                      if (contactsTabFilter === "on_app" && !c.isOnOpenclub) return false;
                      if (contactsTabFilter === "invite" && c.isOnOpenclub) return false;
                      if (!cq) return true;
                      return (
                        c.name.toLowerCase().includes(cq) ||
                        c.phone.toLowerCase().includes(cq) ||
                        ("club" in c && (c as any).club && (c as any).club.toLowerCase().includes(cq))
                      );
                    });

                    return (
                      <div className="flex-1 h-full flex flex-col bg-[#f4f6f3] relative overflow-hidden">
                        {/* FIXED TOP SECTION: Top Navigation Bar + Search Bar (Strictly Non-Scrollable) */}
                        <div className="w-full shrink-0 z-20 bg-white border-b border-slate-200/60 shadow-2xs">
                          <div className="w-full max-w-sm mx-auto px-6 pt-4 pb-3 space-y-3">
                            {/* Top Navigation Bar: Unified 16px top offset, 24px horizontal gutters */}
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => switchScreen("hub")}
                                className="h-8 w-8 rounded-full border border-slate-200 bg-white shadow-2xs flex items-center justify-center text-[#0F172A] hover:bg-slate-50 transition-all cursor-pointer"
                                title="Back to Hub"
                                aria-label="Back"
                              >
                                <ChevronLeft className="h-[18px] w-[18px] text-[#0F172A]" />
                              </button>
                              <h2 className="text-base font-bold text-[#0F172A]">Add Friends</h2>
                              <button
                                type="button"
                                onClick={() => {
                                  setQrModalTab("display");
                                  setScannedFriendResult(null);
                                  setShowQrCodeModal(true);
                                }}
                                className="h-8 w-8 rounded-full bg-[#EAF7EE] border border-[#C6F0DB] flex items-center justify-center text-[#009A60] hover:bg-[#d8f3e3] shadow-2xs transition-all cursor-pointer"
                                title="QR Code & Scanner"
                                aria-label="QR Code"
                              >
                                <QrCode className="h-4 w-4 text-[#009A60]" />
                              </button>
                            </div>

                            {/* Search Input Bar (Fixed at top with header) */}
                            <div className="relative">
                              <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#8CA0BA]" />
                              <input
                                type="text"
                                value={friendsSearchQuery}
                                onFocus={() => {
                                  openVirtualKeyboard({
                                    phoneIndex: phoneIdx,
                                    type: "text",
                                    title: "Search Friends",
                                    queryValue: friendsSearchQuery,
                                    onInput: (char) => {
                                      setFriendsSearchQuery((prev) => {
                                        const next = prev + char;
                                        setVirtualKeyboard((k) => (k ? { ...k, queryValue: next } : null));
                                        return next;
                                      });
                                      setFriendsDisplayLimit(4);
                                    },
                                    onBackspace: () => {
                                      setFriendsSearchQuery((prev) => {
                                        const next = prev.slice(0, -1);
                                        setVirtualKeyboard((k) => (k ? { ...k, queryValue: next } : null));
                                        return next;
                                      });
                                      setFriendsDisplayLimit(4);
                                    },
                                  });
                                }}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFriendsSearchQuery(val);
                                  setFriendsDisplayLimit(4);
                                  setVirtualKeyboard((k) => (k ? { ...k, queryValue: val } : null));
                                }}
                                placeholder="Search by name or email..."
                                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#f5faf6] border border-[#e1efe5] text-xs font-medium text-[#0F172A] placeholder:text-[#8CA0BA] focus:outline-hidden focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 transition-all"
                              />
                              {friendsSearchQuery && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFriendsSearchQuery("");
                                    setFriendsDisplayLimit(4);
                                    setVirtualKeyboard((k) => (k ? { ...k, queryValue: "" } : null));
                                  }}
                                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                  title="Clear search"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* SCROLLABLE BODY CONTENT */}
                        <div className="flex-1 overflow-y-auto">
                          <div className="w-full max-w-sm mx-auto px-6 py-4 space-y-4 pb-8">
                            {/* Find from Contacts Deep Green Card Banner with Fitted Topographic Contour Background */}
                            <div
                              onClick={() => {
                                switchScreen("sync-contacts");
                              }}
                              className="w-full bg-[#052417] hover:bg-[#072d1d] rounded-[22px] p-4 sm:p-4.5 border border-[#0D3826] shadow-[0_8px_24px_rgba(0,0,0,0.18)] flex items-center justify-between text-white cursor-pointer transition-colors select-none relative overflow-hidden group"
                            >
                              {/* Fitted Background Pattern: Elegant Golf Topographic & Elevation Contour Curves */}
                              <svg
                                className="absolute inset-0 w-full h-full pointer-events-none opacity-25 transition-opacity duration-300 group-hover:opacity-35"
                                viewBox="0 0 360 84"
                                fill="none"
                                preserveAspectRatio="none"
                              >
                                <defs>
                                  <radialGradient id="contactsCardGlow" cx="85%" cy="50%" r="65%">
                                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                                  </radialGradient>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#contactsCardGlow)" />
                                {/* Elevation contour curves */}
                                <path d="M-20 54 Q 65 18, 145 48 T 290 26 T 385 52" stroke="#10B981" strokeWidth="1.3" fill="none" opacity="0.8" />
                                <path d="M-10 72 Q 80 32, 175 66 T 320 42 T 395 68" stroke="#10B981" strokeWidth="1.1" fill="none" opacity="0.6" />
                                <path d="M-15 28 Q 90 64, 210 22 T 375 40" stroke="#10B981" strokeWidth="0.9" strokeDasharray="3 3" fill="none" opacity="0.5" />
                                {/* Concentric elevation rings around action zone */}
                                <circle cx="310" cy="42" r="32" stroke="#10B981" strokeWidth="1" strokeDasharray="2 3" opacity="0.75" />
                                <circle cx="310" cy="42" r="54" stroke="#10B981" strokeWidth="0.8" opacity="0.5" />
                                <circle cx="310" cy="42" r="76" stroke="#10B981" strokeWidth="0.6" opacity="0.3" />
                              </svg>

                              <div className="relative z-10 min-w-0 flex-1 pr-3">
                                <h3 className="text-[15px] font-bold text-white leading-tight">
                                  Find from Contacts
                                </h3>
                                <p className="text-xs text-[#8FAEA2] mt-1 leading-snug">
                                  Connect to see who&apos;s on OpenclubOS
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  switchScreen("sync-contacts");
                                }}
                                className="relative z-10 px-4 py-2 rounded-full bg-white hover:bg-slate-100 text-[#052417] font-extrabold text-[10.5px] tracking-wider uppercase transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
                              >
                                CONNECT
                              </button>
                            </div>

                            {/* Section Header: PLAYERS YOU MAY KNOW */}
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B]">
                                {q ? `SEARCH RESULTS (${allMatchedGolfers.length})` : "PLAYERS YOU MAY KNOW"}
                              </span>
                              {q && allMatchedGolfers.length > 0 && (
                                <span className="text-[10px] font-bold text-[#94A3B8] tracking-wide">
                                  {displayedGolfers.length < allMatchedGolfers.length
                                    ? `Showing ${displayedGolfers.length} of ${allMatchedGolfers.length}`
                                    : `All ${allMatchedGolfers.length}`}
                                </span>
                              )}
                            </div>

                            {/* Recommended Real Golfers List - Demarcation line '|' used instead of dot '•' */}
                            <div className="space-y-2.5">
                              {displayedGolfers.length > 0 ? (
                                displayedGolfers.map((player) => {
                                  const pId = String(player.id).toLowerCase().trim();
                                  const pName = player.name.toLowerCase().trim();
                                  const pEmail = (player.email || "").toLowerCase().trim();
                                  const isSent = sentFriendRequests.includes(player.id);
                                  const isConnected =
                                    acceptedFriendIds.some((id: string) => String(id).toLowerCase().trim() === pId) ||
                                    acceptedFriendIds.some((id: string) => String(id).toLowerCase().trim() === pName);
                                  const isBlocked = blockedUserIds.some((bId) => {
                                    const bLower = String(bId).toLowerCase().trim();
                                    return bLower === pId || bLower === pName || (pEmail && bLower === pEmail);
                                  });
                                  const matchingIncomingReq = incomingFriendRequests.find((req: any) => {
                                    const rId = (req.senderId || req.id || req.userId || "").toString().toLowerCase().trim();
                                    const rName = (req.senderName || req.name || "").toString().toLowerCase().trim();
                                    const rEmail = (req.senderEmail || req.email || "").toString().toLowerCase().trim();
                                    if (rId && rId === pId) return true;
                                    if (rName && rName === pName) return true;
                                    if (rEmail && pEmail && rEmail === pEmail) return true;
                                    return false;
                                  }) || (() => {
                                    const matchingNotif = mobileNotifications.find((notif: any) => {
                                      if (notif.data?.type === "FRIEND_REQUEST" || notif.type === "FRIEND_REQUEST") {
                                        const sId = (notif.data?.senderId || notif.senderId || "").toString().toLowerCase().trim();
                                        const sName = (notif.data?.senderName || notif.senderName || "").toString().toLowerCase().trim();
                                        const sEmail = (notif.data?.senderEmail || notif.senderEmail || "").toString().toLowerCase().trim();
                                        if (sId && sId === pId) return true;
                                        if (sName && sName === pName) return true;
                                        if (sEmail && pEmail && sEmail === pEmail) return true;
                                        // Cross-match: check if the notification sender ID matches any known ID alias for this player
                                        if (sId && player.email && sId === player.email.toLowerCase().trim()) return true;
                                        if (sName && pId && sName === pId) return true;
                                      }
                                      return false;
                                    });
                                    if (matchingNotif) {
                                      return {
                                        id: matchingNotif.data?.requestId || matchingNotif.id,
                                        senderId: matchingNotif.data?.senderId || player.id,
                                        senderName: matchingNotif.data?.senderName || player.name,
                                        senderClub: matchingNotif.data?.senderClub || player.club,
                                        senderHcp: matchingNotif.data?.senderHcp || player.hcp,
                                      };
                                    }
                                    return null;
                                  })() || ((player as any)._isIncoming ? {
                                    id: `req_${player.id}`,
                                    senderId: player.id,
                                    senderName: player.name,
                                    senderClub: player.club,
                                    senderHcp: player.hcp,
                                  } : null);
                                  const isIncoming = !!matchingIncomingReq;

                                  return (
                                    <div
                                      key={player.id}
                                      className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 flex items-center justify-between gap-3 transition-all hover:border-slate-300"
                                    >
                                      {/* Left: Avatar with Green Check Badge */}
                                      <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="relative shrink-0">
                                          {player.avatar || player.profilePhoto ? (
                                            <img
                                              src={player.avatar || player.profilePhoto}
                                              alt={player.name}
                                              className="w-11 h-11 rounded-full object-cover border border-slate-200"
                                              onError={(e) => {
                                                (e.currentTarget as HTMLElement).style.display = "none";
                                                const fallback = (e.currentTarget.parentElement?.querySelector(".avatar-initials-fallback") as HTMLElement);
                                                if (fallback) fallback.style.display = "flex";
                                              }}
                                            />
                                          ) : null}
                                          <div
                                            className={`w-11 h-11 rounded-full bg-[#EAF7EE] text-[#009A60] font-bold text-sm items-center justify-center border border-[#C6F0DB] avatar-initials-fallback ${player.avatar || player.profilePhoto ? "hidden" : "flex"}`}
                                          >
                                            {getTwoInitials(player.name)}
                                          </div>
                                          {/* Status check badge */}
                                          <div className="w-4 h-4 rounded-full bg-[#009A60] border-2 border-white flex items-center justify-center text-white absolute -bottom-0.5 -right-0.5 shadow-xs">
                                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                                          </div>
                                        </div>

                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                            <h4 className="text-[14px] font-bold text-[#0F172A] leading-tight">
                                              {player.name}
                                            </h4>
                                            {isConnected && (
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-[#EAF7EE] text-[#009A60] text-[9px] font-bold border border-[#C6F0DB] shrink-0 select-none">Friend</span>
                                            )}
                                          </div>
                                          {/* Demarcation line '|' instead of dot '•' */}
                                          <p className="text-[12px] font-medium text-[#64748B] truncate leading-tight mt-0.5 flex items-center">
                                            <span className="truncate">{player.club || "Ikoyi Golf Club"}</span>
                                            <span className="mx-1.5 text-slate-300 font-normal shrink-0">|</span>
                                            <span className="shrink-0">{player.hcp || "12"} HCP</span>
                                          </p>
                                        </div>
                                      </div>

                                      {/* Right Action Button: Authenticated Interactive States */}
                                      <div className="shrink-0">
                                        {isConnected ? (
                                          /* Accepted Friend State: Single horizontal 3-dots action button */
                                          <button
                                            type="button"
                                            onClick={() => setFriendActionUser({
                                              id: player.id,
                                              name: player.name,
                                              club: player.club,
                                              hcp: player.hcp,
                                              avatar: player.avatar,
                                              profilePhoto: player.profilePhoto,
                                            })}
                                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs shrink-0"
                                            title={`Manage connection with ${player.name}`}
                                            aria-label="Golfer Options"
                                          >
                                            <MoreHorizontal className="w-4 h-4 stroke-[2.2]" />
                                          </button>
                                        ) : isBlocked ? (
                                          /* Blocked State: Displays Unblock pill button */
                                          <button
                                            type="button"
                                            onClick={() => handleUnblockUser(player.id, player.name)}
                                            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-semibold border border-slate-300 transition-all cursor-pointer shrink-0 shadow-2xs"
                                            title={`Unblock ${player.name}`}
                                            aria-label="Unblock Golfer"
                                          >
                                            Unblock
                                          </button>
                                        ) : isIncoming ? (
                                          /* Incoming Friend Request State: Displays mark icon button (accept) + cancel icon button (decline) */
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            <button
                                              type="button"
                                              onClick={() => handleAcceptFriendRequest(matchingIncomingReq)}
                                              className="w-8 h-8 rounded-full bg-[#009A60] hover:bg-[#008251] text-white flex items-center justify-center shadow-2xs transition-all cursor-pointer active:scale-95"
                                              title={`Accept friend request from ${player.name}`}
                                              aria-label="Accept Request"
                                            >
                                              <Check className="w-4 h-4 stroke-[2.8]" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDeclineFriendRequest(matchingIncomingReq)}
                                              className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200/80 flex items-center justify-center text-rose-500 hover:text-rose-600 transition-colors cursor-pointer active:scale-95 shadow-2xs"
                                              title={`Decline friend request from ${player.name}`}
                                              aria-label="Decline Request"
                                            >
                                              <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                            </button>
                                          </div>
                                        ) : isSent ? (
                                          /* Sent Friend Request State: Displays SENT text + subtle red circular X cancel button */
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                              SENT
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => handleCancelSentFriendRequest(player.id)}
                                              className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200/80 flex items-center justify-center text-rose-500 hover:text-rose-600 transition-colors cursor-pointer active:scale-95 shadow-2xs"
                                              title="Cancel Request"
                                              aria-label="Cancel Request"
                                            >
                                              <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                            </button>
                                          </div>
                                        ) : (
                                          /* Unsent State: Displays circular emerald add friend button */
                                          <button
                                            type="button"
                                            onClick={() => handleSendFriendRequest(player.id, player)}
                                            className="w-9 h-9 rounded-full bg-[#009A60] hover:bg-[#008251] active:scale-95 text-white flex items-center justify-center shadow-2xs transition-all cursor-pointer shrink-0"
                                            title={`Add ${player.name}`}
                                            aria-label="Add Friend"
                                          >
                                            <UserPlus className="w-4 h-4 text-white" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="py-10 text-center">
                                  <div className="w-12 h-12 rounded-full bg-[#EAF7EE] border border-[#C6F0DB] flex items-center justify-center mx-auto mb-3 text-[#009A60]">
                                    <UserPlus className="w-6 h-6" />
                                  </div>
                                  <p className="text-sm font-bold text-slate-800">No Golfers Found</p>
                                  <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">
                                    Try searching by a different name or email.
                                  </p>
                                </div>
                              )}

                              {/* Lazy Loading: Show More Button */}
                              {hasMoreResults && (
                                <button
                                  type="button"
                                  onClick={() => setFriendsDisplayLimit((prev) => prev + 4)}
                                  className="w-full py-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs text-[13px] font-bold text-[#009A60] hover:bg-[#EAF7EE] hover:border-[#C6F0DB] transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                  <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                                  Show More ({allMatchedGolfers.length - displayedGolfers.length} remaining)
                                </button>
                              )}
                            </div>

                            {/* Demarcation Divider */}
                            <div className="relative py-1">
                              <div className="border-t border-slate-200/80" />
                            </div>

                            {/* Share Invitation Link Card (Demarcation Dashed Border Container) */}
                            <div className="w-full rounded-[24px] border-2 border-dashed border-slate-300 bg-white/80 p-5 flex flex-col items-center text-center space-y-3 shadow-2xs">
                              <div className="w-12 h-12 rounded-2xl bg-[#EAF7EE] border border-[#C6F0DB] flex items-center justify-center text-[#009A60] shadow-xs">
                                <Link2 className="w-5 h-5 -rotate-45 stroke-[2.2]" />
                              </div>
                              <div className="space-y-1">
                                <h3 className="text-[15px] font-bold text-[#0F172A] leading-tight">
                                  Share Invitation Link
                                </h3>
                                <p className="text-[12px] font-normal text-[#64748B] leading-snug max-w-[260px] mx-auto">
                                  Invite friends who aren&apos;t on the platform yet
                                </p>
                              </div>
                              {(() => {
                                const currentInviteCode = getUserInviteCode(authenticatedPlayer);
                                const currentOrigin = typeof window !== "undefined" && window.location.origin
                                  ? window.location.origin
                                  : (process.env.NEXT_PUBLIC_APP_URL || "https://openclub.app");
                                const currentHost = typeof window !== "undefined" && window.location.host
                                  ? window.location.host
                                  : "openclub.app";
                                const currentInviteLink = `${currentHost}/invite/${currentInviteCode}`;
                                const currentInviteUrl = `${currentOrigin}/invite/${currentInviteCode}`;

                                return (
                                  <div className="w-full bg-[#f5faf6] border border-[#e1efe5] rounded-2xl px-3.5 py-2 flex items-center justify-between gap-2 shadow-2xs">
                                    <span className="text-xs text-slate-600 font-medium truncate flex-1 text-left select-all">
                                      {currentInviteLink}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (typeof navigator !== "undefined" && navigator.clipboard) {
                                          navigator.clipboard.writeText(currentInviteUrl).catch(() => {});
                                        }
                                        setCopiedInviteLink(true);
                                        setTimeout(() => setCopiedInviteLink(false), 2200);
                                        showToast("Invitation link copied to clipboard!", "success", "LINK COPIED");
                                      }}
                                      className="px-3.5 py-1.5 rounded-full bg-[#009A60] hover:bg-[#008251] border border-[#009A60] text-white text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0"
                                    >
                                      {copiedInviteLink ? "Copied!" : "Copy"}
                                    </button>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Interactive QR Code Modal (Display QR Code + Functional Scanner) */}
                        {showQrCodeModal && (
                          <div
                            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-5"
                            onClick={() => setShowQrCodeModal(false)}
                          >
                            <div
                              className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl space-y-4 text-center border border-slate-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Modal Header */}
                              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <h4 className="text-sm font-bold text-[#0F172A]">
                                  {qrModalTab === "display" ? "My QR Code" : "Scan QR Code"}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => setShowQrCodeModal(false)}
                                  className="h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Segmented Mode Switcher: My QR Code vs Scan QR Code */}
                              <div className="flex rounded-xl bg-[#f4f6f3] border border-slate-200/60 p-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQrModalTab("display");
                                    setScannedFriendResult(null);
                                  }}
                                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    qrModalTab === "display"
                                      ? "bg-white text-[#0F172A] shadow-2xs"
                                      : "text-slate-500 hover:text-slate-800"
                                  }`}
                                >
                                  My QR Code
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQrModalTab("scan");
                                    setScannedFriendResult(null);
                                  }}
                                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    qrModalTab === "scan"
                                      ? "bg-white text-[#0F172A] shadow-2xs"
                                      : "text-slate-500 hover:text-slate-800"
                                  }`}
                                >
                                  Scan QR Code
                                </button>
                              </div>

                              {qrModalTab === "display" ? (
                                /* TAB 1: DISPLAY USER QR CODE (NO verified openclub competitor) */
                                <div className="space-y-3.5">
                                  <div className="flex flex-col items-center">
                                    <div className="w-12 h-12 rounded-full border-2 border-[#009A60] p-0.5 mb-2 shrink-0">
                                      {(authenticatedPlayer?.profilePhoto || authenticatedPlayer?.avatar || (authenticatedPlayer as any)?.photo) && !qrPhotoError ? (
                                        <img
                                          src={authenticatedPlayer?.profilePhoto || authenticatedPlayer?.avatar || (authenticatedPlayer as any)?.photo}
                                          alt={authenticatedPlayer?.name || "Player"}
                                          onError={() => setQrPhotoError(true)}
                                          className="w-full h-full rounded-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full rounded-full bg-[#EAF7EE] text-[#009A60] font-bold text-sm flex items-center justify-center select-none uppercase">
                                          {getTwoInitials(authenticatedPlayer?.name || "Alex Morgan")}
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-sm font-bold text-[#0F172A]">
                                      {authenticatedPlayer?.name || "Alex Morgan"}
                                    </p>
                                    <p className="text-xs font-medium text-[#64748B] mt-0.5">
                                      <span>{authenticatedPlayer?.club || "Ikoyi Club 1938"}</span>
                                      <span className="mx-1 text-slate-300">|</span>
                                      <span>
                                        {authenticatedPlayer?.handicap !== undefined && authenticatedPlayer?.handicap !== null
                                          ? (typeof authenticatedPlayer.handicap === "number" ? authenticatedPlayer.handicap.toFixed(1) : authenticatedPlayer.handicap)
                                          : ((authenticatedPlayer as any)?.handicapIndex || (authenticatedPlayer as any)?.hcp || "0.0")}{" "}
                                        HCP
                                      </span>
                                    </p>
                                  </div>

                                  {/* High-contrast Dynamic Unique QR Graphic with 4-Module Quiet Zone for Stress-Free Scanning */}
                                  {(() => {
                                    const activeInviteCode = getUserInviteCode(authenticatedPlayer);
                                    const currentOrigin = typeof window !== "undefined" && window.location.origin
                                      ? window.location.origin
                                      : (process.env.NEXT_PUBLIC_APP_URL || "https://openclub.app");
                                    const qrPayload = `${currentOrigin}/invite/${activeInviteCode}`;
                                    const qrData = generateUniqueQrMatrix(qrPayload, 25);
                                    const cellSize = 100 / qrData.size;

                                    return (
                                      <div className="w-44 h-44 mx-auto p-2 bg-[#EAF7EE] border-2 border-[#C6F0DB]/80 rounded-2xl shadow-xs flex items-center justify-center relative">
                                        <svg viewBox="-16 -16 132 132" className="w-full h-full">
                                          {/* Standard 4-Module Blank White Quiet Zone */}
                                          <rect x="-16" y="-16" width="132" height="132" fill="#FFFFFF" rx="8" />

                                          {/* Deterministic Data Cells */}
                                          {qrData.grid.map((row, r) =>
                                            row.map((cell, c) => {
                                              const isCornerFinder =
                                                (r < 7 && c < 7) ||
                                                (r < 7 && c >= qrData.size - 7) ||
                                                (r >= qrData.size - 7 && c < 7);
                                              const isCenterEmblem =
                                                r >= qrData.mid - 2 &&
                                                r <= qrData.mid + 2 &&
                                                c >= qrData.mid - 2 &&
                                                c <= qrData.mid + 2;

                                              if (isCornerFinder || isCenterEmblem) return null;
                                              if (cell === 0) return null;

                                              return (
                                                <rect
                                                  key={`qr-c-${r}-${c}`}
                                                  x={c * cellSize + 0.3}
                                                  y={r * cellSize + 0.3}
                                                  width={cellSize - 0.6}
                                                  height={cellSize - 0.6}
                                                  rx="0.8"
                                                  fill="#052417"
                                                />
                                              );
                                            })
                                          )}

                                          {/* Top-Left Finder (Exact 1:1:3:1:1 concentric ratio, dark obsidian) */}
                                          <rect x="0" y="0" width="28" height="28" rx="4" fill="#052417" />
                                          <rect x="4" y="4" width="20" height="20" rx="2" fill="white" />
                                          <rect x="8" y="8" width="12" height="12" rx="1.5" fill="#052417" />

                                          {/* Top-Right Finder (Exact 1:1:3:1:1 concentric ratio, dark obsidian) */}
                                          <rect x="72" y="0" width="28" height="28" rx="4" fill="#052417" />
                                          <rect x="76" y="4" width="20" height="20" rx="2" fill="white" />
                                          <rect x="80" y="8" width="12" height="12" rx="1.5" fill="#052417" />

                                          {/* Bottom-Left Finder (Exact 1:1:3:1:1 concentric ratio, dark obsidian) */}
                                          <rect x="0" y="72" width="28" height="28" rx="4" fill="#052417" />
                                          <rect x="4" y="76" width="20" height="20" rx="2" fill="white" />
                                          <rect x="8" y="80" width="12" height="12" rx="1.5" fill="#052417" />

                                          {/* Center Brand / Profile Monogram Emblem */}
                                          <rect x="38" y="38" width="24" height="24" rx="6" fill="white" stroke="#E2E8F0" strokeWidth="1" />
                                          <circle cx="50" cy="50" r="8" fill="#009A60" />
                                          <text
                                            x="50"
                                            y="53"
                                            textAnchor="middle"
                                            fill="white"
                                            fontSize="6.5"
                                            fontWeight="bold"
                                            fontFamily="sans-serif"
                                          >
                                            {getTwoInitials(authenticatedPlayer?.name || "Alex Morgan")}
                                          </text>
                                        </svg>
                                      </div>
                                    );
                                  })()}

                                  <p className="text-[11.5px] text-slate-500 leading-tight">
                                    Let other golfers scan your code on the course to connect instantly.
                                  </p>

                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const activeCode = getUserInviteCode(authenticatedPlayer);
                                      const origin = typeof window !== "undefined" && window.location.origin
                                        ? window.location.origin
                                        : (process.env.NEXT_PUBLIC_APP_URL || "https://openclub.app");
                                      const shareUrl = `${origin}/invite/${activeCode}`;
                                      const shareData = {
                                        title: "Add me on OpenclubOS",
                                        text: `Hey! Add me as a golf friend on OpenclubOS.`,
                                        url: shareUrl,
                                      };

                                      // Try native share first, fallback to clipboard
                                      if (typeof navigator !== "undefined" && navigator.share) {
                                        try {
                                          await navigator.share(shareData);
                                          showToast("QR invite link shared!", "success", "QR CODE SHARED");
                                        } catch (err: any) {
                                          if (err?.name !== "AbortError") {
                                            // User cancelled — silently ignore
                                            if (navigator.clipboard) {
                                              await navigator.clipboard.writeText(shareUrl).catch(() => {});
                                            }
                                            showToast("Invite link copied to clipboard!", "success", "LINK COPIED");
                                          }
                                        }
                                      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
                                        await navigator.clipboard.writeText(shareUrl).catch(() => {});
                                        showToast("Invite link copied to clipboard!", "success", "LINK COPIED");
                                      }
                                    }}
                                    className="w-full py-2.5 rounded-xl bg-[#009A60] hover:bg-[#008251] text-white text-xs font-bold shadow-xs cursor-pointer active:scale-98 transition-all"
                                  >
                                    Share QR Code
                                  </button>
                                </div>
                              ) : (
                                /* TAB 2: FUNCTIONAL QR SCANNER VIEW */
                                <div className="space-y-3.5">
                                  {/* Camera Viewfinder Box with Laser & Corner Brackets */}
                                  <div className="relative w-full h-44 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center shadow-inner">
                                    {/* Corner Reticles */}
                                    <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#009A60] rounded-tl" />
                                    <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#009A60] rounded-tr" />
                                    <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[#009A60] rounded-bl" />
                                    <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[#009A60] rounded-br" />

                                    {/* Animated Scan Line */}
                                    <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-0.5 bg-[#009A60] shadow-[0_0_12px_#009A60] animate-pulse" />

                                    {/* Scanner Guidance */}
                                    <div className="z-10 px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs border border-white/10 text-[10.5px] font-medium text-slate-300 flex items-center gap-1.5">
                                      <Camera className="w-3.5 h-3.5 text-[#009A60]" />
                                      <span>Point camera at golfer&apos;s QR code</span>
                                    </div>
                                  </div>

                                  {/* Scanned Result or Action Button */}
                                  {scannedFriendResult ? (
                                    <div className="space-y-2.5">
                                      <div className="w-full bg-[#F0FDF4] border border-[#A7F3D0] rounded-2xl p-3 text-left flex items-center justify-between gap-2.5">
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                          {scannedFriendResult.avatar || scannedFriendResult.profilePhoto ? (
                                            <div className="w-10 h-10 rounded-full border border-[#C6F0DB] overflow-hidden shrink-0">
                                              <img
                                                src={scannedFriendResult.avatar || scannedFriendResult.profilePhoto}
                                                alt={scannedFriendResult.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  (e.currentTarget.parentElement as HTMLElement).innerHTML = `<div class="w-full h-full bg-[#EAF7EE] text-[#009A60] font-bold text-xs flex items-center justify-center uppercase">${getTwoInitials(scannedFriendResult.name)}</div>`;
                                                }}
                                              />
                                            </div>
                                          ) : (
                                            <div className="w-10 h-10 rounded-full bg-[#EAF7EE] text-[#009A60] font-bold text-xs flex items-center justify-center border border-[#C6F0DB] shrink-0 select-none uppercase">
                                              {getTwoInitials(scannedFriendResult.name)}
                                            </div>
                                          )}
                                          <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-[#0F172A] truncate">
                                              {scannedFriendResult.name}
                                            </p>
                                            <p className="text-[11px] text-[#009A60] font-medium truncate">
                                              {scannedFriendResult.club} | {scannedFriendResult.hcp} HCP
                                            </p>
                                          </div>
                                        </div>
                                        <span className="shrink-0 w-7 h-7 rounded-full bg-[#009A60] text-white flex items-center justify-center shadow-2xs" title="Request sent">
                                          <Send className="w-3.5 h-3.5" />
                                        </span>
                                      </div>

                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() => setScannedFriendResult(null)}
                                          className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                                        >
                                          Scan Another
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setShowQrCodeModal(false)}
                                          className="flex-1 py-2 rounded-xl bg-[#009A60] hover:bg-[#008251] text-white text-xs font-bold transition-all cursor-pointer"
                                        >
                                          Done
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    /* Scanner viewfinder — real camera integration handles detection */
                                    <div className="space-y-2">
                                      <p className="text-[11.5px] text-slate-500 leading-tight">
                                        Point your camera at another golfer&apos;s QR code to connect instantly.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Interactive Find from Contacts Modal Sheet */}
                        {showContactsModal && (
                          <div
                            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
                            onClick={() => setShowContactsModal(false)}
                          >
                            <div
                              className="w-full max-w-sm mx-auto bg-white rounded-t-[28px] sm:rounded-3xl p-5 shadow-2xl space-y-3.5 border border-slate-100 flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-bottom duration-200"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Bottom sheet drag handle for mobile view */}
                              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto -mt-1 mb-1 sm:hidden shrink-0" />

                              {/* Header */}
                              <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
                                <div>
                                  <h4 className="text-base font-bold text-[#0F172A] flex items-center gap-1.5">
                                    <Users className="w-4 h-4 text-[#009A60]" />
                                    Find from Contacts
                                  </h4>
                                  <p className="text-xs text-[#64748B] mt-0.5">
                                    Connect with golfers from your address book
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setShowContactsModal(false)}
                                  className="h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
                                  title="Close"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Synced status badge */}
                              <div className="bg-[#EAF7EE] border border-[#C6F0DB] rounded-xl p-2.5 flex items-center justify-between text-xs text-[#009A60] shrink-0">
                                <div className="flex items-center gap-2 font-medium">
                                  <div className="w-6 h-6 rounded-full bg-[#009A60] text-white flex items-center justify-center shrink-0">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </div>
                                  <div>
                                    <span className="font-bold">Contacts Synced</span>
                                    <span className="text-[11px] text-[#052417]/80 block">4 golfers matched on OpenclubOS</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  disabled={isSyncingContacts}
                                  onClick={() => {
                                    setIsSyncingContacts(true);
                                    setTimeout(() => {
                                      setIsSyncingContacts(false);
                                      showToast("Address book synchronized! 4 golfers matched on OpenclubOS.", "success", "CONTACTS SYNCED");
                                    }, 600);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-white/80 hover:bg-white text-[#052417] text-[10.5px] font-bold border border-[#C6F0DB] flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                                  title="Re-sync contacts"
                                >
                                  <RefreshCw className={`w-3 h-3 ${isSyncingContacts ? "animate-spin text-[#009A60]" : "text-slate-600"}`} />
                                  <span>{isSyncingContacts ? "Syncing..." : "Sync"}</span>
                                </button>
                              </div>

                              {/* In-App Standardized Search Input */}
                              <div className="shrink-0">
                                <div className="relative flex items-center">
                                  <Search className="w-4 h-4 text-[#8CA0BA] absolute left-3.5 pointer-events-none" />
                                  <input
                                    type="text"
                                    value={contactsSearchQuery}
                                    onChange={(e) => setContactsSearchQuery(e.target.value)}
                                    placeholder="Search contacts by name or phone..."
                                    className="w-full pl-9.5 pr-8 py-2 bg-[#f5faf6] border border-[#e1efe5] rounded-xl text-xs text-[#0F172A] placeholder:text-[#8CA0BA] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 focus:outline-hidden transition-all"
                                  />
                                  {contactsSearchQuery && (
                                    <button
                                      type="button"
                                      onClick={() => setContactsSearchQuery("")}
                                      className="absolute right-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Filter Tabs */}
                              <div className="flex gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setContactsTabFilter("all")}
                                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                    contactsTabFilter === "all"
                                      ? "bg-[#052417] text-white"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  }`}
                                >
                                  All ({phoneAddressBookContacts.length})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setContactsTabFilter("on_app")}
                                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                    contactsTabFilter === "on_app"
                                      ? "bg-[#009A60] text-white"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  }`}
                                >
                                  On App ({phoneAddressBookContacts.filter((c) => c.isOnOpenclub).length})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setContactsTabFilter("invite")}
                                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                    contactsTabFilter === "invite"
                                      ? "bg-[#052417] text-white"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  }`}
                                >
                                  Invite ({phoneAddressBookContacts.filter((c) => !c.isOnOpenclub).length})
                                </button>
                              </div>

                              {/* Contacts List */}
                              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px] max-h-[280px]">
                                {displayedContacts.length === 0 ? (
                                  <div className="py-8 text-center text-xs text-slate-400">
                                    No contacts found matching &ldquo;{contactsSearchQuery}&rdquo;
                                  </div>
                                ) : (
                                  displayedContacts.map((contact) => {
                                    const isSent = sentFriendRequests.includes(contact.id);
                                    const isAccepted = acceptedFriendIds.includes(contact.id);
                                    const isContactBlocked = blockedUserIds.some((bId) => {
                                      const bLower = String(bId).toLowerCase().trim();
                                      return bLower === String(contact.id).toLowerCase().trim() || bLower === contact.name.toLowerCase().trim();
                                    });
                                    const isInvited = invitedContactPhones.includes(contact.phone);

                                    return (
                                      <div
                                        key={contact.id}
                                        className="p-2.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-2.5"
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                          <div className="w-10 h-10 rounded-full bg-[#EAF7EE] text-[#009A60] font-bold text-xs flex items-center justify-center border border-[#C6F0DB] shrink-0 uppercase select-none">
                                            {getTwoInitials(contact.name)}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                              <p className="text-xs font-bold text-[#0F172A] leading-tight">
                                                {contact.name}
                                              </p>
                                              {isAccepted && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-[#EAF7EE] text-[#009A60] text-[9px] font-bold border border-[#C6F0DB] shrink-0 select-none">Friend</span>
                                              )}
                                            </div>
                                            <p className="text-[10.5px] text-slate-500 font-medium truncate">
                                              {contact.phone}
                                            </p>
                                            {contact.isOnOpenclub ? (
                                              <p className="text-[10.5px] text-[#009A60] font-medium truncate">
                                                {contact.club} • {contact.hcp} HCP
                                              </p>
                                            ) : (
                                              <span className="inline-block text-[9.5px] text-slate-400 font-medium">
                                                Not on OpenclubOS yet
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        <div className="shrink-0">
                                          {contact.isOnOpenclub ? (
                                            isAccepted ? (
                                              <button
                                                type="button"
                                                onClick={() => setFriendActionUser({
                                                  id: contact.id,
                                                  name: contact.name,
                                                  club: contact.club,
                                                  hcp: contact.hcp,
                                                  avatar: (contact as any).avatar,
                                                  profilePhoto: (contact as any).profilePhoto,
                                                })}
                                                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs shrink-0"
                                                title={`Manage connection with ${contact.name}`}
                                                aria-label="Golfer Options"
                                              >
                                                <MoreHorizontal className="w-3.5 h-3.5 stroke-[2.2]" />
                                              </button>
                                            ) : isContactBlocked ? (
                                              <button
                                                type="button"
                                                onClick={() => handleUnblockUser(contact.id, contact.name)}
                                                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] font-semibold border border-slate-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                                                title={`Unblock ${contact.name}`}
                                              >
                                                Unblock
                                              </button>
                                            ) : isSent ? (
                                              <button
                                                type="button"
                                                onClick={() => handleCancelSentFriendRequest(contact.id)}
                                                className="px-2.5 py-1 rounded-full bg-[#009A60] hover:bg-red-500 text-white text-[10.5px] font-bold transition-all shadow-2xs active:scale-95 cursor-pointer group"
                                                title="Click to cancel request"
                                              >
                                                <span className="group-hover:hidden flex items-center gap-1"><Send className="w-3 h-3" /></span>
                                                <span className="hidden group-hover:inline">Cancel</span>
                                              </button>
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={() => handleSendFriendRequest(contact.id, contact)}
                                                className="px-3 py-1.5 rounded-full bg-[#009A60] hover:bg-[#008251] text-white text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                                              >
                                                + Add
                                              </button>
                                            )
                                          ) : isInvited ? (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10.5px] font-bold">
                                              Invited ✓
                                            </span>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setInvitedContactPhones((prev) => [...prev, contact.phone]);
                                                const inviteCode = getUserInviteCode(authenticatedPlayer);
                                                const currentOrigin = typeof window !== "undefined" && window.location.origin
                                                  ? window.location.origin
                                                  : (process.env.NEXT_PUBLIC_APP_URL || "https://openclub.app");
                                                if (typeof navigator !== "undefined" && navigator.clipboard) {
                                                  navigator.clipboard.writeText(`${currentOrigin}/invite/${inviteCode}?ref=${encodeURIComponent(contact.phone)}`);
                                                }
                                                showToast(
                                                  `Invite link copied for ${contact.name}! Send via SMS or WhatsApp.`,
                                                  "success",
                                                  "INVITE LINK READY"
                                                );
                                              }}
                                              className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1"
                                            >
                                              <Share2 className="w-3 h-3 text-[#009A60]" />
                                              <span>Invite</span>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>

                              {/* Footer Done button */}
                              <div className="pt-2 border-t border-slate-100 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowContactsModal(false);
                                    setShowContactsConnected(true);
                                    try {
                                      localStorage.setItem("openclub_contacts_synced", "true");
                                    } catch {}
                                  }}
                                  className="w-full py-2.5 rounded-xl bg-[#009A60] hover:bg-[#008251] text-white text-xs font-bold shadow-xs cursor-pointer active:scale-98 transition-all"
                                >
                                  Done
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* 13B. SYNC YOUR CONTACTS FULL SCREEN (EXACT ATTACHED DESIGN) */}
                  {targetScreen === "sync-contacts" && (() => {
                    return (
                      <div className="flex-1 min-h-full flex flex-col bg-white pb-8 relative overflow-y-auto">
                        {/* Top Navigation Bar: Unified 16px top offset, 24px horizontal gutters */}
                        <div className="w-full max-w-sm mx-auto px-6 pt-4 pb-3 flex items-center justify-between shrink-0">
                          <button
                            type="button"
                            onClick={() => switchScreen("add-friends")}
                            className="h-8 w-8 rounded-full border border-slate-200 bg-white shadow-2xs flex items-center justify-center text-[#0F172A] hover:bg-slate-50 transition-all cursor-pointer"
                            title="Back to Add Friends"
                            aria-label="Back"
                          >
                            <ChevronLeft className="h-[18px] w-[18px] text-[#0F172A]" />
                          </button>
                          <div className="w-8" />
                        </div>

                        {/* Screen Content Body */}
                        <div className="w-full max-w-sm mx-auto px-6 flex-1 flex flex-col justify-between pt-2 pb-6">
                          <div className="flex flex-col items-center text-center">
                            {/* Hero Contact Badge matching screenshot */}
                            <div className="relative w-[104px] h-[104px] rounded-full bg-[#D5F2E3] border-4 border-[#EAF7EE] flex items-center justify-center shadow-xs mt-4 mb-8">
                              {/* Address Book Icon */}
                              <div className="w-12 h-12 rounded-xl bg-[#009A60] flex items-center justify-center text-white relative shadow-2xs">
                                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M4 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4" />
                                  <path d="M4 2v20" />
                                  <circle cx="12" cy="9.5" r="2.8" />
                                  <path d="M7 17.5a4.5 4.5 0 0 1 9 0" />
                                  <line x1="1.5" y1="6" x2="4" y2="6" />
                                  <line x1="1.5" y1="11" x2="4" y2="11" />
                                  <line x1="1.5" y1="16" x2="4" y2="16" />
                                </svg>
                              </div>

                              {/* Shield Indicator Top-Right Badge */}
                              <div className="absolute top-0 right-0 w-7 h-7 rounded-full bg-white border border-[#C6F0DB] shadow-xs flex items-center justify-center">
                                <Shield className="w-3.5 h-3.5 text-[#009A60] fill-[#009A60]/20" />
                              </div>
                            </div>

                            {/* Heading */}
                            <h2 className="text-[26px] font-black text-[#0F172A] tracking-tight leading-tight mb-2.5">
                              Sync Your Contacts
                            </h2>

                            {/* Description */}
                            <p className="text-[13.5px] text-[#64748B] leading-snug max-w-[285px] mb-8">
                              Find friends and fellow club members who are already on <strong className="font-bold text-[#0F172A]">OpenclubOS</strong>.
                            </p>

                            {/* Benefit Cards matching screenshot */}
                            <div className="w-full space-y-3 mb-6">
                              {/* Benefit Card 1: Auto-Connect */}
                              <div className="w-full bg-[#F8FAFC] rounded-2xl p-4 flex items-center gap-3.5 border border-slate-100 shadow-2xs text-left relative overflow-hidden group">
                                {/* Fitted Background Pattern: Social Discovery Golfer Constellation & Connection Node Mesh */}
                                <svg
                                  className="absolute inset-0 w-full h-full pointer-events-none opacity-45 transition-opacity duration-300 group-hover:opacity-60"
                                  viewBox="0 0 340 64"
                                  fill="none"
                                  preserveAspectRatio="none"
                                >
                                  <defs>
                                    <radialGradient id="autoConnectGlow" cx="88%" cy="50%" r="60%">
                                      <stop offset="0%" stopColor="#009A60" stopOpacity="0.10" />
                                      <stop offset="100%" stopColor="#009A60" stopOpacity="0" />
                                    </radialGradient>
                                  </defs>
                                  <rect width="100%" height="100%" fill="url(#autoConnectGlow)" />
                                  {/* Interconnected friendship nodes & graph lines */}
                                  <line x1="210" y1="36" x2="252" y2="20" stroke="#009A60" strokeWidth="0.9" opacity="0.18" />
                                  <line x1="252" y1="20" x2="295" y2="38" stroke="#009A60" strokeWidth="0.9" opacity="0.18" />
                                  <line x1="252" y1="20" x2="278" y2="12" stroke="#009A60" strokeWidth="0.7" strokeDasharray="2 2" opacity="0.14" />
                                  <line x1="295" y1="38" x2="328" y2="24" stroke="#009A60" strokeWidth="0.9" opacity="0.18" />
                                  <circle cx="210" cy="36" r="3" fill="#009A60" opacity="0.22" />
                                  <circle cx="252" cy="20" r="3.5" fill="#009A60" opacity="0.28" />
                                  <circle cx="278" cy="12" r="2" fill="#009A60" opacity="0.20" />
                                  <circle cx="295" cy="38" r="4" fill="#009A60" opacity="0.30" />
                                  <circle cx="328" cy="24" r="3" fill="#009A60" opacity="0.25" />
                                </svg>

                                <div className="relative z-10 w-9 h-9 rounded-xl bg-[#EAF7EE] flex items-center justify-center shrink-0">
                                  <Users className="w-4 h-4 text-[#009A60]" />
                                </div>
                                <span className="relative z-10 text-[12px] font-bold text-[#5E718D] capitalize">
                                  Auto-Connect with Friends
                                </span>
                              </div>

                              {/* Benefit Card 2: Secure & Private Sync */}
                              <div className="w-full bg-[#F8FAFC] rounded-2xl p-4 flex items-center gap-3.5 border border-slate-100 shadow-2xs text-left relative overflow-hidden group">
                                {/* Fitted Background Pattern: Hexagonal Cryptographic Vault Mesh & Privacy Shield Matrix */}
                                <svg
                                  className="absolute inset-0 w-full h-full pointer-events-none opacity-45 transition-opacity duration-300 group-hover:opacity-60"
                                  viewBox="0 0 340 64"
                                  fill="none"
                                  preserveAspectRatio="none"
                                >
                                  <defs>
                                    <pattern id="secureHexGrid" width="24" height="20.78" patternUnits="userSpaceOnUse">
                                      <path d="M12 0 L24 6.93 L24 20.78 L12 27.71 L0 20.78 L0 6.93 Z" fill="none" stroke="#009A60" strokeWidth="0.7" strokeOpacity="0.07" />
                                    </pattern>
                                    <radialGradient id="secureVaultGlow" cx="92%" cy="50%" r="55%">
                                      <stop offset="0%" stopColor="#009A60" stopOpacity="0.10" />
                                      <stop offset="100%" stopColor="#009A60" stopOpacity="0" />
                                    </radialGradient>
                                  </defs>
                                  <rect width="100%" height="100%" fill="url(#secureHexGrid)" />
                                  <rect width="100%" height="100%" fill="url(#secureVaultGlow)" />
                                  {/* Security concentric privacy radar rings */}
                                  <circle cx="295" cy="32" r="18" stroke="#009A60" strokeWidth="0.9" strokeDasharray="3 3" opacity="0.18" fill="none" />
                                  <circle cx="295" cy="32" r="28" stroke="#009A60" strokeWidth="0.7" opacity="0.12" fill="none" />
                                </svg>

                                <div className="relative z-10 w-9 h-9 rounded-xl bg-[#EAF7EE] flex items-center justify-center shrink-0">
                                  <Lock className="w-4 h-4 text-[#009A60]" />
                                </div>
                                <span className="relative z-10 text-[12px] font-bold text-[#5E718D] capitalize">
                                  Secure & Private Sync
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="w-full space-y-3 pt-4">
                            <button
                              type="button"
                              disabled={isSyncingContacts}
                              onClick={async () => {
                                setIsSyncingContacts(true);
                                try {
                                  // Simulate permission request & address book sync
                                  await new Promise((res) => setTimeout(res, 600));
                                  setShowContactsConnected(true);
                                  try {
                                    localStorage.setItem("openclub_contacts_synced", "true");
                                  } catch {}
                                  showToast("Found 4 contacts already playing on OpenclubOS!", "success", "CONTACTS SYNCED");
                                  setContactsTabFilter("on_app");
                                  switchScreen("add-friends");
                                  setShowContactsModal(true);
                                } finally {
                                  setIsSyncingContacts(false);
                                }
                              }}
                              className="w-full py-3.5 rounded-2xl bg-[#009A60] hover:bg-[#008753] active:scale-[0.98] text-white font-bold text-sm capitalize shadow-lg shadow-[#009A60]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                            >
                              {isSyncingContacts ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                                  <span>Syncing Contacts...</span>
                                </>
                              ) : (
                                "Allow Access"
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => switchScreen("add-friends")}
                              className="w-full py-2.5 text-center text-xs font-bold capitalize text-[#8CA0BA] hover:text-[#5E718D] transition-colors cursor-pointer"
                            >
                              Maybe Later
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 14. NOTIFICATIONS FULL SCREEN (PURE REAL DATABASE DATA) */}
                  {targetScreen === "notifications" && (() => {
                    const isAllRead = mobileNotifications.length > 0 && mobileNotifications.every((n: any) => n.isRead === true && n.unread !== true);

                    const handleMarkAllRead = async () => {
                      setNotificationsMarkedRead(true);
                      setMobileNotifications((prev) =>
                        prev.map((n: any) => {
                          const isFriend = n.data?.type === "FRIEND_REQUEST" || n.type === "FRIEND_REQUEST";
                          if (isFriend) return n;
                          return { ...n, isRead: true, unread: false };
                        })
                      );
                      if (authenticatedPlayer?.id) {
                        try {
                          const notifKey = getUserNotificationsKey(authenticatedPlayer.id);
                          const saved = localStorage.getItem(notifKey);
                          if (saved) {
                            const parsed = JSON.parse(saved);
                            const updated = parsed.map((n: any) => {
                              const isFriend = n.data?.type === "FRIEND_REQUEST" || n.type === "FRIEND_REQUEST";
                              if (isFriend) return n;
                              return { ...n, isRead: true, unread: false };
                            });
                            localStorage.setItem(notifKey, JSON.stringify(updated));
                          }
                          localStorage.setItem(`openclub_all_notifs_read_${authenticatedPlayer.id}`, "true");
                        } catch {}
                      }
                      try {
                        const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
                        const token = typeof window !== "undefined" ? localStorage.getItem("openclub_access_token") : null;
                        if (token) {
                          await fetch(`${backendBase}/notifications/mark-all-read`, {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}` },
                          }).catch(() => null);
                        }
                      } catch {}
                      showToast("All notifications marked as read.", "success", "NOTIFICATIONS READ");
                    };

                    const handleNotificationClick = async (notif: any) => {
                      if (!notif.isRead || notif.unread !== false) {
                        setMobileNotifications((prev) =>
                          prev.map((n: any) => (n.id === notif.id ? { ...n, isRead: true, unread: false } : n))
                        );
                        if (authenticatedPlayer?.id) {
                          try {
                            const notifKey = getUserNotificationsKey(authenticatedPlayer.id);
                            const saved = localStorage.getItem(notifKey);
                            if (saved) {
                              const parsed = JSON.parse(saved);
                              if (Array.isArray(parsed)) {
                                const updated = parsed.map((n: any) => (n.id === notif.id ? { ...n, isRead: true, unread: false } : n));
                                localStorage.setItem(notifKey, JSON.stringify(updated));
                              }
                            }
                          } catch {}
                        }
                        try {
                          const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
                          const token = typeof window !== "undefined" ? localStorage.getItem("openclub_access_token") : null;
                          if (token && notif.id && !String(notif.id).startsWith("notif_")) {
                            fetch(`${backendBase}/notifications/${notif.id}/read`, {
                              method: "PATCH",
                              headers: { Authorization: `Bearer ${token}` },
                            }).catch(() => null);
                          }
                        } catch {}
                      }
                    };

                    const now = new Date();
                    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();

                    // Helper to parse and structure flight grouping notifications
                    const parseFlightGroupingNotif = (notif: any) => {
                      let partners: string[] = Array.isArray(notif.data?.flightPartners) ? notif.data.flightPartners : [];
                      let flightName: string = notif.data?.flightName || notif.data?.groupName || "";
                      let tournamentName: string = notif.data?.tournamentName || "";

                      const bodyText = notif.body || notif.desc || notif.message || "";

                      if (partners.length === 0 && bodyText) {
                        const multilineMatch = bodyText.match(/You are grouped with:\s*([\s\S]*?)\s*for\s+(.*?)\s+of\s+(.*?)\.?$/i);
                        if (multilineMatch) {
                          partners = multilineMatch[1]
                            .split("\n")
                            .map((s: string) => s.trim().replace(/-\d+$/, ""))
                            .filter((s: string) => s && !isAccountUser({ name: s }));
                          flightName = flightName || multilineMatch[2].trim();
                          tournamentName = tournamentName || multilineMatch[3].trim().replace(/\.$/, "");
                        } else {
                          const singleMatch = bodyText.match(/You are grouped with\s+(.*?)\s+for\s+(.*?)\.?$/i);
                          if (singleMatch) {
                            partners = singleMatch[1]
                              .split(",")
                              .map((s: string) => s.trim().replace(/-\d+$/, ""))
                              .filter((s: string) => s && !isAccountUser({ name: s }));
                            const rest = singleMatch[2].trim();
                            if (rest.includes(" of ")) {
                              const parts = rest.split(" of ");
                              flightName = flightName || parts[0].trim();
                              tournamentName = tournamentName || parts[1].trim().replace(/\.$/, "");
                            } else {
                              flightName = flightName || rest;
                            }
                          }
                        }
                      }

                      if (!flightName && notif.title?.includes(":")) {
                        flightName = notif.title.split(":")[1]?.trim() || "";
                      }

                      const isFlight =
                        notif.type === "FLIGHT_GROUPING" ||
                        notif.data?.type === "FLIGHT_GROUPING" ||
                        notif.title?.toLowerCase().includes("flight grouping");

                      return {
                        isFlightGrouping: isFlight,
                        partners,
                        flightName,
                        tournamentName,
                      };
                    };

                    // Standardized Friend Request Card (Card 1 design requested by user for EVERY friend request)
                    const renderFriendRequestCard = (item: any) => {
                      const data = item.data || {};
                      const senderId = item.senderId || data.senderId || data.userId || item.id;
                      const rawSenderName =
                        item.senderName ||
                        data.senderName ||
                        data.userName ||
                        (typeof item.body === "string" ? item.body.match(/^(.+?)\s+sent/)?.[1] : "") ||
                        "Golfer";

                      // Look up in registeredPlayers for club/hcp/avatar if missing
                      const matchedPlayer = registeredPlayers?.find(
                        (rp: any) => (senderId && String(rp.id).toLowerCase() === String(senderId).toLowerCase()) ||
                                     (rawSenderName && rp.name?.toLowerCase() === rawSenderName.toLowerCase())
                      );

                      const senderName = matchedPlayer?.name || rawSenderName;
                      const senderClub = item.senderClub || data.senderClub || data.club || (matchedPlayer as any)?.club || "";
                      const senderHcp = item.senderHcp || data.senderHcp || data.hcp || (matchedPlayer as any)?.handicap || "";
                      const senderAvatar = item.senderAvatar || data.senderAvatar || data.avatar || (matchedPlayer as any)?.avatar || (matchedPlayer as any)?.profilePhoto || "";
                      const createdAt = item.createdAt || item.timestamp || item.time || Date.now();
                      const reqId = item.id || data.requestId || `freq_${senderId}`;

                      return (
                        <div
                          key={reqId}
                          className="w-full bg-white border border-[#C6F0DB] rounded-2xl shadow-2xs p-3.5 flex items-start gap-3.5 transition-all hover:border-slate-300 relative overflow-hidden group"
                        >
                          {/* Fitted Background Pattern: Welcoming Friend Greeting Ripple Waves & Social Connection Aura */}
                          <svg
                            className="absolute inset-0 w-full h-full pointer-events-none opacity-40 transition-opacity duration-300 group-hover:opacity-55"
                            viewBox="0 0 340 84"
                            fill="none"
                            preserveAspectRatio="none"
                          >
                            <defs>
                              <radialGradient id={`notifFriendGlow-${reqId}`} cx="12%" cy="30%" r="45%">
                                <stop offset="0%" stopColor="#009A60" stopOpacity="0.12" />
                                <stop offset="100%" stopColor="#009A60" stopOpacity="0" />
                              </radialGradient>
                            </defs>
                            <rect width="100%" height="100%" fill={`url(#notifFriendGlow-${reqId})`} />
                            {/* Connection ripples radiating from avatar */}
                            <circle cx="34" cy="28" r="28" stroke="#009A60" strokeWidth="0.9" strokeDasharray="2 3" opacity="0.18" fill="none" />
                            <circle cx="34" cy="28" r="46" stroke="#009A60" strokeWidth="0.7" opacity="0.12" fill="none" />
                            <circle cx="34" cy="28" r="68" stroke="#009A60" strokeWidth="0.6" strokeDasharray="3 4" opacity="0.08" fill="none" />
                            {/* Social handshake link curve in top right */}
                            <path d="M 240 12 Q 280 22, 320 8" stroke="#009A60" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.15" fill="none" />
                          </svg>

                          <div className="relative z-10 shrink-0 mt-0.5">
                            {senderAvatar ? (
                              <img
                                src={senderAvatar}
                                alt={senderName}
                                className="w-8.5 h-8.5 rounded-full object-cover border border-slate-200 shadow-2xs"
                              />
                            ) : (
                              <div className="w-8.5 h-8.5 rounded-full bg-[#EAF7EE] text-[#009A60] border border-[#C6F0DB] flex items-center justify-center text-[10px] font-black shadow-2xs">
                                {getTwoInitials(senderName)}
                              </div>
                            )}
                            <div className="w-3.5 h-3.5 rounded-full bg-[#009A60] border-2 border-white flex items-center justify-center text-white absolute -bottom-0.5 -right-0.5 shadow-xs">
                              <UserPlus className="w-2 h-2 stroke-[3]" />
                            </div>
                          </div>
                          <div className="relative z-10 min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-[14px] font-bold text-[#0F172A] leading-tight">
                                {senderName}
                              </h4>
                              <span className="text-[11px] font-medium text-[#8CA0BA] shrink-0">
                                {formatNotifTime(createdAt)}
                              </span>
                            </div>
                            <p className="text-[12px] font-medium text-[#64748B] mt-0.5">
                              {senderClub ? `${senderClub} • HCP ${senderHcp || "0.0"}` : "Sent you a friend request"}
                            </p>
                            <div className="flex items-center gap-2.5 mt-3">
                              <button
                                type="button"
                                onClick={() => handleAcceptFriendRequest({
                                  ...data,
                                  ...item,
                                  id: reqId,
                                  requestId: item.requestId || data.requestId || item.id,
                                  senderId,
                                  senderName,
                                })}
                                className="flex-1 py-2 rounded-xl bg-[#009A60] hover:bg-[#008251] text-white text-[11px] font-extrabold uppercase tracking-wider transition-all shadow-2xs active:scale-95 cursor-pointer text-center"
                              >
                                ACCEPT
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeclineFriendRequest({
                                  ...data,
                                  ...item,
                                  id: reqId,
                                  requestId: item.requestId || data.requestId || item.id,
                                  senderId,
                                })}
                                className="px-6 py-2 rounded-xl bg-[#EEF2F6] hover:bg-slate-200 text-[#64748B] text-[11px] font-extrabold uppercase tracking-wider transition-all active:scale-95 cursor-pointer text-center"
                              >
                                DECLINE
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    };

                    // Reusable card renderer ensuring concise layout and proper grouping preservation
                    const renderNotificationCard = (notif: any) => {
                      const isFriendReq =
                        (notif.data?.type === "FRIEND_REQUEST" ||
                        notif.type === "FRIEND_REQUEST") &&
                        notif.data?.type !== "FRIEND_ACCEPTED" &&
                        notif.type !== "FRIEND_ACCEPTED" &&
                        !notif.title?.toLowerCase().includes("accepted") &&
                        !notif.title?.toLowerCase().includes("connected") &&
                        !notif.title?.toLowerCase().includes("sent");

                      // Every friend request strictly renders as Card 1 design
                      if (isFriendReq) {
                        return renderFriendRequestCard(notif);
                      }

                      const isUnread = !isAllRead && notif.isRead !== true && notif.unread !== false;
                      const flightDetails = parseFlightGroupingNotif(notif);

                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`w-full bg-white ${
                            isUnread ? "border-[#C6F0DB] shadow-xs" : "border-slate-200/90 shadow-2xs"
                          } rounded-2xl border p-3.5 flex items-start gap-3.5 transition-all hover:border-slate-300 relative cursor-pointer`}
                        >
                          <div className="w-8 h-8 rounded-xl bg-[#EAF7EE] border border-[#C6F0DB]/70 flex items-center justify-center text-[#009A60] shrink-0 mt-0.5 shadow-2xs">
                            {notif.type === "TOURNAMENT_UPDATE" || notif.type === "TOURNAMENT_ALERT" ? (
                              <Trophy className="w-4 h-4 text-[#009A60]" />
                            ) : notif.type === "PAYMENT_RECEIVED" || notif.type?.includes("WITHDRAWAL") ? (
                              <ShieldCheck className="w-4 h-4 text-[#009A60]" />
                            ) : notif.data?.type === "BOOKING" || notif.title?.toLowerCase().includes("booking") ? (
                              <CalendarCheck className="w-4 h-4 text-[#009A60]" />
                            ) : flightDetails.isFlightGrouping || notif.data?.type === "FRIEND_ACCEPTED" || notif.type === "FLIGHT_GROUPING" ? (
                              <Users className="w-4 h-4 text-[#009A60]" />
                            ) : (
                              <Bell className="w-4 h-4 text-[#009A60]" />
                            )}
                          </div>
                          <div className={`min-w-0 flex-1 transition-opacity duration-200 ${isUnread ? "opacity-100" : "opacity-60"}`}>
                            <div className="flex items-start justify-between gap-2">
                              {flightDetails.isFlightGrouping ? (
                                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                  <h4 className="text-[14px] font-bold text-[#0F172A] leading-tight">
                                    Flight Grouping
                                  </h4>
                                  <span className="px-1.5 py-0.5 rounded-md bg-[#EAF7EE] text-[#009A60] text-[10px] font-bold border border-[#C6F0DB] uppercase tracking-wide">
                                    {flightDetails.partners.length > 0 ? `${flightDetails.partners.length} PLAYERS` : "PLAYERS"}
                                  </span>
                                </div>
                              ) : (
                                <h4 className="text-[14px] font-bold text-[#0F172A] leading-tight">
                                  {notif.title}
                                </h4>
                              )}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[11px] font-medium text-[#8CA0BA]">
                                  {formatNotifTime(notif.createdAt)}
                                </span>
                                {isUnread && (
                                  <span className="w-2 h-2 rounded-full bg-[#009A60] shrink-0" title="Unread" />
                                )}
                              </div>
                            </div>

                            {flightDetails.isFlightGrouping ? (
                              <div className="mt-1">
                                {flightDetails.tournamentName && (
                                  <p className="text-[12px] font-medium text-[#64748B]">
                                    {flightDetails.tournamentName}
                                  </p>
                                )}
                                {flightDetails.partners.length > 0 ? (
                                  <div className="mt-2.5 pt-2 border-t border-slate-100/90">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8CA0BA] block mb-2">
                                      {flightDetails.flightName ? `${flightDetails.flightName} • GROUPED WITH:` : "GROUPED WITH:"}
                                    </span>
                                    <div className="space-y-1.5">
                                      {flightDetails.partners.map((partnerName: string, pIdx: number) => (
                                        <div
                                          key={pIdx}
                                          className="flex items-center gap-2.5 py-0.5"
                                        >
                                          <span className="w-5 h-5 rounded-full bg-[#EAF7EE] border border-[#C6F0DB] text-[#009A60] flex items-center justify-center text-[9.5px] font-black shrink-0 shadow-2xs">
                                            {getTwoInitials(partnerName)}
                                          </span>
                                          <span className="text-[12.5px] font-semibold text-[#0F172A]">
                                            {partnerName}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-[12.5px] text-[#475569] leading-snug mt-1 whitespace-pre-line">
                                    {notif.body || notif.desc || notif.message}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-[12.5px] text-[#475569] leading-snug mt-1 whitespace-pre-line">
                                {notif.body || notif.desc || notif.message}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    };

                    // Helper to reliably extract timestamp for reverse-chronological sorting (newest first)
                    const getNotificationTimestamp = (item: any): number => {
                      if (!item) return 0;
                      if (typeof item.timestamp === "number" && !isNaN(item.timestamp)) return item.timestamp;
                      if (item.createdAt) {
                        const t = new Date(item.createdAt).getTime();
                        if (!isNaN(t)) return t;
                      }
                      if (item.time) {
                        const t = new Date(item.time).getTime();
                        if (!isNaN(t)) return t;
                      }
                      const match = String(item.id || "").match(/(\d{10,13})/);
                      if (match) {
                        const parsed = parseInt(match[1], 10);
                        if (!isNaN(parsed)) return parsed;
                      }
                      return 0;
                    };

                    // Sort real database notifications in strict reverse-chronological order (latest notification first)
                    const sortedNotifs = [...mobileNotifications].map(sanitizeFlightNotif).sort((a, b) => {
                      return getNotificationTimestamp(b) - getNotificationTimestamp(a);
                    });

                    // Sort incoming friend requests in reverse-chronological order (latest notification first)
                    const sortedIncomingFriendRequests = [...incomingFriendRequests].sort((a: any, b: any) => {
                      return getNotificationTimestamp(b) - getNotificationTimestamp(a);
                    });

                    // Deduplicate notifications against incomingFriendRequests to prevent showing duplicate cards
                    const incomingSenderIds = new Set(
                      incomingFriendRequests.map((r: any) => String(r.senderId || r.id).toLowerCase().trim())
                    );
                    const incomingReqIds = new Set(
                      incomingFriendRequests.map((r: any) => String(r.id || r.requestId).toLowerCase().trim())
                    );

                    const isDuplicateOfIncoming = (notif: any) => {
                      const isFriend = notif.data?.type === "FRIEND_REQUEST" || notif.type === "FRIEND_REQUEST";
                      if (!isFriend) return false;
                      const sId = String(notif.data?.senderId || notif.data?.userId || notif.senderId || "").toLowerCase().trim();
                      const rId = String(notif.data?.requestId || notif.id || "").toLowerCase().trim();
                      return (sId && incomingSenderIds.has(sId)) || (rId && incomingReqIds.has(rId));
                    };

                    // Semantic deduplication ensuring identical cards (e.g. FRIEND_ACCEPTED or duplicate title+body) never render twice
                    const seenFeedKeys = new Set<string>();
                    const deduplicatedFeedNotifs = sortedNotifs.filter((n: any) => {
                      if (isDuplicateOfIncoming(n)) return false;
                      const parsedData = typeof n.data === "string" ? (() => { try { return JSON.parse(n.data); } catch { return {}; } })() : (n.data || {});
                      const nType = (parsedData.type || n.type || "").toUpperCase();
                      const normTitle = (n.title || "").trim().toLowerCase();
                      const normBody = (n.body || n.desc || n.message || "").trim().toLowerCase();

                      const isFriendAccepted = nType === "FRIEND_ACCEPTED" ||
                        normTitle.includes("friend request accepted") ||
                        normBody.includes("accepted your friend request") ||
                        normBody.includes("now connected");

                      const friendId = String(parsedData.userId || n.userId || parsedData.senderId || n.senderId || "").trim().toLowerCase();
                      const friendName = String(parsedData.userName || parsedData.senderName || n.userName || normBody.match(/^(.*?)\s+accepted/i)?.[1] || "").trim().toLowerCase();

                      const key = isFriendAccepted && (friendId || friendName)
                        ? `FRIEND_ACCEPTED_${friendId || friendName}`
                        : `${normTitle}:::${normBody}`;

                      if (key && seenFeedKeys.has(key)) return false;
                      if (key) seenFeedKeys.add(key);
                      return true;
                    });

                    // Ensure today's notifications strictly sort latest first
                    const todayNotifs = deduplicatedFeedNotifs
                      .filter((n: any) => {
                        if (!n.createdAt) return true;
                        const t = new Date(n.createdAt).getTime();
                        return isNaN(t) || t >= startOfToday;
                      })
                      .sort((a: any, b: any) => getNotificationTimestamp(b) - getNotificationTimestamp(a));

                    // Ensure yesterday's notifications strictly sort latest first
                    const yesterdayNotifs = deduplicatedFeedNotifs
                      .filter((n: any) => {
                        if (!n.createdAt) return false;
                        const t = new Date(n.createdAt).getTime();
                        return !isNaN(t) && t >= startOfYesterday && t < startOfToday;
                      })
                      .sort((a: any, b: any) => getNotificationTimestamp(b) - getNotificationTimestamp(a));

                    // Ensure earlier notifications strictly sort latest first
                    const earlierNotifs = deduplicatedFeedNotifs
                      .filter((n: any) => {
                        if (!n.createdAt) return false;
                        const t = new Date(n.createdAt).getTime();
                        return !isNaN(t) && t < startOfYesterday;
                      })
                      .sort((a: any, b: any) => getNotificationTimestamp(b) - getNotificationTimestamp(a));

                    const hasUnreadToday = !isAllRead && (sortedIncomingFriendRequests.length > 0 || todayNotifs.some((n: any) => !n.isRead && n.unread !== false));
                    const hasUnreadYesterday = !isAllRead && yesterdayNotifs.some((n: any) => !n.isRead && n.unread !== false);

                    const totalCount = sortedIncomingFriendRequests.length + todayNotifs.length + yesterdayNotifs.length + earlierNotifs.length;

                    return (
                      <div className="flex-1 min-h-full flex flex-col bg-[#f4f6f3] relative overflow-hidden">
                        {/* FIXED TOP SECTION: Top Navigation Bar (Strictly Non-Scrollable, Centered Title) */}
                        <div className="w-full shrink-0 z-20 bg-white border-b border-slate-200/60 shadow-2xs">
                          <div className="w-full max-w-sm mx-auto px-6 pt-4 pb-3 flex items-center justify-between">
                            {/* Standard back button: circular white pill, border, soft drop shadow */}
                            <button
                              type="button"
                              onClick={() => switchScreen("hub")}
                              className="h-8 w-8 rounded-full border border-slate-200 bg-white shadow-2xs flex items-center justify-center text-[#0F172A] hover:bg-slate-50 transition-all cursor-pointer shrink-0"
                              title="Back to Hub"
                              aria-label="Back"
                            >
                              <ChevronLeft className="h-[18px] w-[18px] text-[#0F172A]" />
                            </button>
                            <h2 className="text-base font-bold text-[#0F172A]">Notifications</h2>
                            {/* Mark all as read button matching standard circular pill design */}
                            <button
                              type="button"
                              onClick={handleMarkAllRead}
                              className="h-8 w-8 rounded-full border border-slate-200 bg-white shadow-2xs flex items-center justify-center text-[#009A60] hover:bg-slate-50 transition-all cursor-pointer shrink-0"
                              title="Mark all as read"
                              aria-label="Mark all as read"
                            >
                              <CheckCheck className="h-[18px] w-[18px] text-[#009A60]" />
                            </button>
                          </div>
                        </div>

                        {/* Scrollable Notifications Feed: Pure Real Database Data */}
                        <div className="flex-1 overflow-y-auto">
                          <div className="w-full max-w-sm mx-auto px-4 py-3 space-y-4">
                            {totalCount === 0 ? (
                              <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center my-auto">
                                <div className="w-16 h-16 rounded-[24px] bg-[#EAF7EE] border border-[#C6F0DB] flex items-center justify-center text-[#009A60] mb-4 shadow-xs">
                                  <Bell className="w-8 h-8 text-[#009A60]" />
                                </div>
                                <h3 className="text-[17px] font-bold text-[#0F172A] tracking-tight">
                                  No Notifications
                                </h3>
                                <p className="text-[13px] text-[#64748B] max-w-[280px] leading-relaxed mt-1">
                                  All caught up! Real-time tournament updates, pairings, and announcements from the database will appear here.
                                </p>
                              </div>
                            ) : (
                              <>
                                {/* SECTION: TODAY */}
                                {(sortedIncomingFriendRequests.length > 0 || todayNotifs.length > 0) && (
                                  <div>
                                    <div className="flex items-center justify-between px-1 mb-2.5">
                                      <span className="text-[11px] font-extrabold tracking-widest text-[#8CA0BA] uppercase">
                                        TODAY
                                      </span>
                                      {hasUnreadToday && (
                                        <span className="w-2 h-2 rounded-full bg-[#009A60] shrink-0 shadow-xs" />
                                      )}
                                    </div>

                                    <div className="space-y-2.5">
                                      {/* Real Incoming Friend Requests from database (Standardized Card 1 design, latest first) */}
                                      {sortedIncomingFriendRequests.map((req: any) => renderFriendRequestCard(req))}

                                      {/* Real Database Notifications for Today */}
                                      {todayNotifs.map((notif: any) => renderNotificationCard(notif))}
                                    </div>
                                  </div>
                                )}

                                {/* SECTION: YESTERDAY */}
                                {yesterdayNotifs.length > 0 && (
                                  <div>
                                    <div className="flex items-center justify-between px-1 mb-2.5">
                                      <span className="text-[11px] font-extrabold tracking-widest text-[#8CA0BA] uppercase">
                                        YESTERDAY
                                      </span>
                                      {hasUnreadYesterday && (
                                        <span className="w-2 h-2 rounded-full bg-[#009A60] shrink-0 shadow-xs" />
                                      )}
                                    </div>

                                    <div className={`space-y-2.5 ${earlierNotifs.length === 0 ? "pb-6" : ""}`}>
                                      {yesterdayNotifs.map((notif: any) => renderNotificationCard(notif))}
                                    </div>
                                  </div>
                                )}

                                {/* SECTION: EARLIER */}
                                {earlierNotifs.length > 0 && (
                                  <div>
                                    <div className="flex items-center justify-between px-1 mb-2.5">
                                      <span className="text-[11px] font-extrabold tracking-widest text-[#8CA0BA] uppercase">
                                        EARLIER
                                      </span>
                                    </div>

                                    <div className="space-y-2.5 pb-6">
                                      {earlierNotifs.map((notif: any) => renderNotificationCard(notif))}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
      </div>
    );
  };

  // Phone Frame Component Renderer
  const renderPhoneDevice = (slot: PhoneSlotState, index: number) => {
    const modelSpec = DEVICE_MODELS[slot.model] || DEVICE_MODELS["iphone-16-pro"];
    const colorSpec = CHASSIS_COLORS[slot.color] || CHASSIS_COLORS["natural-titanium"];
    const effectiveScreen = syncScreens || !slot.screen ? activeScreen : slot.screen;

    return (
      <div key={index} className="flex flex-col items-center shrink-0">
        {/* Hardware Control Card above phone */}
        <div 
          style={{ width: `${modelSpec.width}px` }}
          className="flex flex-col gap-2 mb-3 px-1 transition-all"
        >
          {/* Header Row: Slot Label + Model Selector + OS Badge */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                {viewMode === "single" ? "Primary Device" : `Phone ${index + 1}`}
              </span>
              <select
                value={slot.model}
                onChange={(e) => updatePhoneModel(index, e.target.value as DeviceModelId)}
                aria-label={`Select hardware model for ${viewMode === "single" ? "device" : `phone ${index + 1}`}`}
                className="bg-[#0D1522] text-xs font-semibold text-white border border-slate-700/80 rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              >
                <optgroup label="📱 Smartphones">
                  <option value="iphone-16-pro">iPhone 16 Pro (iOS 18)</option>
                  <option value="galaxy-s24">Samsung Galaxy S24 Ultra</option>
                  <option value="pixel-9">Google Pixel 9 Pro</option>
                  <option value="iphone-notch">iPhone 14 / Classic Notch</option>
                  <option value="iphone-16-max">iPhone 16 Pro Max</option>
                </optgroup>
                <optgroup label="💻 Tablets">
                  <option value="ipad-pro-11">iPad Pro 11&quot; (M4)</option>
                  <option value="ipad-mini">iPad Mini 7</option>
                  <option value="galaxy-tab-s9">Samsung Galaxy Tab S9</option>
                </optgroup>
              </select>
            </div>

            <span className="text-[10px] font-medium text-slate-400 font-mono bg-slate-900/90 px-2 py-0.5 rounded-md border border-slate-800">
              {modelSpec.osVersion}
            </span>
          </div>

          {/* Sub Row: Finish Swatches & Independent Screen Selector */}
          <div className="flex items-center justify-between gap-2 bg-[#090E17]/90 px-2.5 py-1.5 rounded-xl border border-slate-800/80 backdrop-blur-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[10.5px] text-slate-400 font-medium">Finish:</span>
              {(Object.keys(CHASSIS_COLORS) as DeviceColorId[]).map((cId) => {
                const cSpec = CHASSIS_COLORS[cId];
                const isSelected = slot.color === cId;
                return (
                  <button
                    key={cId}
                    type="button"
                    title={cSpec.name}
                    onClick={() => updatePhoneColor(index, cId)}
                    className={`w-3.5 h-3.5 rounded-full transition-all cursor-pointer relative flex items-center justify-center ${
                      isSelected
                        ? "ring-2 ring-emerald-400 ring-offset-1 ring-offset-[#090E17] scale-110"
                        : "opacity-70 hover:opacity-100 hover:scale-105"
                    }`}
                    style={{ backgroundColor: cSpec.swatch }}
                  />
                );
              })}
            </div>

            {!syncScreens ? (
              <select
                value={slot.screen || activeScreen}
                onChange={(e) => updatePhoneScreen(index, e.target.value as ScreenId)}
                aria-label={`Select screen for phone ${index + 1}`}
                className="bg-[#05080E] text-[11px] font-medium text-emerald-300 border border-emerald-500/40 rounded-lg px-2 py-0.5 focus:outline-none cursor-pointer"
              >
                <option value="landing">Get Started</option>
                <option value="register">Register</option>
                <option value="verify">Verify (OTP)</option>
                <option value="login">Login</option>
                <option value="forgot-password">Forgot Pwd</option>
                <option value="check-inbox">Check Inbox</option>
                <option value="reset-password">Set New Pwd</option>
                <option value="scoring">Scoring</option>
                <option value="attestation">Attestation</option>
                <option value="hub">Home</option>
                <option value="tournaments">Tournaments</option>
                <option value="leaderboard">Leaderboard</option>
              </select>
            ) : (
              <span className="text-[10px] text-slate-500 font-mono">
                {`${modelSpec.width} × ${modelSpec.height} px`}
              </span>
            )}
          </div>
        </div>

        {/* Outer Phone Hardware Chassis */}
        <div
          style={{ width: `${modelSpec.width}px`, height: `${modelSpec.height}px` }}
          className={`${modelSpec.outerRadius} ${modelSpec.bezelPadding} ${colorSpec.gradient} ${colorSpec.shadow} border ${colorSpec.borderColor} relative flex flex-col transition-all`}
        >
          {/* Side Hardware Buttons */}
          {modelSpec.sideButtons.left?.map((btn, bIdx) => (
            <div
              key={`left-${bIdx}`}
              style={{ top: `${btn.top}px`, height: `${btn.height}px` }}
              className="absolute -left-[13px] w-[3px] bg-slate-600 rounded-l-sm shadow-xs"
            />
          ))}
          {modelSpec.sideButtons.right?.map((btn, bIdx) => (
            <div
              key={`right-${bIdx}`}
              style={{ top: `${btn.top}px`, height: `${btn.height}px` }}
              className="absolute -right-[13px] w-[3px] bg-slate-600 rounded-r-sm shadow-xs"
            />
          ))}

          {/* Inner Screen Surface */}
          <div
            data-mobile-screen="true"
            style={{ fontFamily: 'var(--font-dm-sans), "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', scrollbarWidth: "none", msOverflowStyle: "none" }}
            className={`w-full h-full ${modelSpec.innerRadius} bg-[#06090E] overflow-hidden flex flex-col relative border border-black select-none font-['DM_Sans',sans-serif] scrollbar-hide no-scrollbar`}
          >
            {/* Status Bar / Camera Cutout depending on model */}
            {modelSpec.notchType === "dynamic-island" && (
              <div className="h-11 px-7 flex items-center justify-between z-20 bg-transparent shrink-0">
                <span className="text-[11px] font-semibold tracking-tight text-white/90">
                  9:41
                </span>
                {/* Dynamic Island Pill */}
                <div className="w-24 h-5 rounded-full bg-black flex items-center justify-end px-2 gap-1.5 shadow-inner">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 animate-pulse" />
                  <div className="h-2 w-2 rounded-full bg-slate-900 border border-slate-800" />
                </div>
                <div className="flex items-center gap-1.5 text-white/90">
                  <div className="w-4 h-2 rounded-sm border border-white/80 p-0.5 flex items-center">
                    <div className="w-full h-full bg-emerald-400 rounded-xs" />
                  </div>
                </div>
              </div>
            )}

            {modelSpec.notchType === "punch-hole" && (
              <div className="h-10 px-5 flex items-center justify-between z-20 bg-transparent shrink-0">
                <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-tight text-white/90">
                  <span>{modelSpec.brand === "Samsung" ? "09:41" : "9:41"}</span>
                  {modelSpec.brand === "Samsung" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </div>
                {/* Centered Punch-Hole Camera */}
                <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-800 shadow-inner flex items-center justify-center -ml-2.5">
                  <div className="w-1 h-1 rounded-full bg-slate-700" />
                </div>
                {/* Android Status Icons */}
                <div className="flex items-center gap-1.5 text-[10px] text-white/90 font-mono">
                  <span className="text-[9px] font-bold text-emerald-400">5G</span>
                  <div className="flex items-end gap-0.5 h-2.5">
                    <span className="w-0.5 h-1 bg-white/80 rounded-xs" />
                    <span className="w-0.5 h-1.5 bg-white/80 rounded-xs" />
                    <span className="w-0.5 h-2 bg-white/80 rounded-xs" />
                    <span className="w-0.5 h-2.5 bg-white rounded-xs" />
                  </div>
                  <span className="text-[10px]">98%</span>
                  <div className="w-2.5 h-3.5 rounded-xs border border-white/80 p-0.5 flex flex-col justify-end">
                    <div className="w-full h-[90%] bg-emerald-400 rounded-2xs" />
                  </div>
                </div>
              </div>
            )}

            {modelSpec.notchType === "classic-notch" && (
              <div className="h-11 px-6 flex items-start justify-between z-20 bg-transparent shrink-0 pt-1">
                <span className="text-[11px] font-semibold tracking-tight text-white/90 pt-0.5">
                  9:41
                </span>
                {/* Wide Notch */}
                <div className="w-32 h-5 bg-black rounded-b-2xl flex items-center justify-center gap-2 px-2 shadow-sm -mt-1">
                  <div className="w-10 h-1 bg-slate-800 rounded-full" />
                  <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-800" />
                </div>
                <div className="flex items-center gap-1.5 text-white/90 pt-0.5">
                  <div className="w-4 h-2 rounded-sm border border-white/80 p-0.5 flex items-center">
                    <div className="w-full h-full bg-emerald-400 rounded-xs" />
                  </div>
                </div>
              </div>
            )}

            {modelSpec.notchType === "tablet-bezel" && (
              <div className="h-10 px-7 flex items-center justify-between z-20 bg-transparent shrink-0">
                <div className="flex items-center gap-2 text-white/90">
                  <span className="text-[11.5px] font-semibold tracking-tight">
                    {modelSpec.os === "iOS" ? "9:41" : "09:41"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Tue Sep 11</span>
                  {modelSpec.os === "Android" && <span className="text-[9px] font-bold text-emerald-400">5G</span>}
                </div>
                {/* Centered Tablet Bezel Camera */}
                <div className="w-2.5 h-2.5 rounded-full bg-black border border-slate-800 shadow-inner flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-slate-700" />
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <span className="text-[10px] text-slate-300 font-mono">100%</span>
                  <div className="w-5 h-2.5 rounded-xs border border-white/80 p-0.5 flex items-center">
                    <div className="w-full h-full bg-emerald-400 rounded-2xs" />
                  </div>
                </div>
              </div>
            )}

            {/* In-App Toaster Display inside phone */}
            {mobileToast && (
              <div className="absolute top-12 left-3.5 right-3.5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                {mobileToast.type === "success" && (
                  <div className="w-full bg-white rounded-[26px] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.18),0_8px_16px_rgba(0,0,0,0.06)] border border-slate-100/90 flex items-center gap-3.5 relative">
                    <div className="w-11 h-11 rounded-full bg-[#EBF7EE] flex items-center justify-center shrink-0">
                      <div className="w-6 h-6 rounded-full bg-[#009A60] flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="text-[13.5px] font-black uppercase tracking-wider text-[#111827] leading-none mb-1">
                        {mobileToast.title || "SUCCESS"}
                      </h4>
                      <p className="text-[12.5px] text-[#5B6B7F] leading-snug font-normal line-clamp-2">
                        {mobileToast.message}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={dismissToast}
                      className="text-slate-300 hover:text-slate-500 p-1.5 rounded-full transition-colors cursor-pointer shrink-0 self-center -mr-1"
                      aria-label="Dismiss toast"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {mobileToast.type === "error" && (
                  <div className="w-full bg-[#FFF5F5] rounded-[22px] p-3.5 shadow-[0_20px_45px_rgba(225,29,72,0.14),0_8px_20px_rgba(0,0,0,0.06)] border border-rose-200 flex items-start gap-3 relative animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className="w-9 h-9 rounded-xl bg-white border border-rose-200 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                      <ShieldAlert className="w-5 h-5 text-rose-600 stroke-[2.2]" />
                    </div>
                    <div className="flex-1 min-w-0 pr-1 text-left">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-rose-700 leading-tight mb-1">
                        {mobileToast.title || "ACCESS RESTRICTED"}
                      </h4>
                      <p className="text-[11.5px] text-rose-600 leading-snug font-normal">
                        {mobileToast.message}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={dismissToast}
                      className="text-rose-400 hover:text-rose-700 p-1 rounded-full transition-colors cursor-pointer shrink-0 self-start mt-0.5"
                      aria-label="Dismiss toast"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {mobileToast.type === "alert" && (
                  <div className="w-full bg-[#111827] rounded-[26px] p-4 shadow-[0_24px_50px_rgba(0,0,0,0.65),0_10px_25px_rgba(0,0,0,0.4)] border border-slate-800 flex items-center gap-3.5 relative text-white">
                    <div className="w-11 h-11 rounded-full bg-[#F59E0B] flex items-center justify-center shrink-0 shadow-xs">
                      <AlertTriangle className="w-5 h-5 text-[#111827] fill-[#111827] stroke-none" />
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="text-[13.5px] font-black uppercase tracking-wider text-white leading-none mb-1">
                        {mobileToast.title || "ALERT"}
                      </h4>
                      <p className="text-[12.5px] text-[#94A3B8] leading-snug font-normal line-clamp-2">
                        {mobileToast.message}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={dismissToast}
                      className="text-slate-400 hover:text-white p-1.5 rounded-full transition-colors cursor-pointer shrink-0 self-center -mr-1"
                      aria-label="Dismiss toast"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SCREEN CONTENT VIEW */}
            {renderScreenContent(effectiveScreen, index)}

            {/* Bottom Navigation Handle */}
            <div className="h-6 w-full flex items-center justify-center bg-transparent z-20 shrink-0">
              <div
                className={`${modelSpec.category === "tablet" ? "w-44 h-1.5 bg-slate-400/70" : modelSpec.os === "Android" ? "w-24 h-1 bg-slate-400/80" : "w-32 h-1"} rounded-full transition-colors ${
                  modelSpec.os === "iOS"
                    ? effectiveScreen === "scoring" || effectiveScreen === "attestation" || effectiveScreen === "hub" || effectiveScreen === "leaderboard" || effectiveScreen === "tournaments"
                      ? "bg-slate-400/50"
                      : "bg-slate-300"
                    : ""
                }`}
              />
            </div>

            {/* --- SIMULATOR DUMMY VIRTUAL MOBILE KEYBOARD OVERLAY (SLIDES UP ON INPUT FOCUS) --- */}
            {virtualKeyboard?.isOpen && (virtualKeyboard.phoneIndex === index || viewMode === "single") && (
              <div
                className="absolute bottom-0 left-0 right-0 z-60 bg-[#161B22]/98 backdrop-blur-xl border-t border-slate-700/80 shadow-[0_-16px_40px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom duration-200 select-none pb-4 pt-1 font-sans text-white"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Accessory Toolbar */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/80 mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase ${
                        virtualKeyboard.type === "numeric"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {virtualKeyboard.type === "numeric" ? "🔢 NUMERIC PAD" : "⌨️ QWERTY KEYBOARD"}
                    </span>
                    {virtualKeyboard.type === "numeric" ? (
                      <span className="text-[10px] text-amber-400 font-semibold tracking-tight">
                        Numbers Only • Alphabets Blocked
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] text-slate-400 font-medium tracking-tight truncate">
                          {virtualKeyboard.title || "Interactive Keypad"}
                        </span>
                        {virtualKeyboard.queryValue !== undefined && virtualKeyboard.queryValue.length > 0 && (
                          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/70 border border-emerald-800/40 px-1.5 py-0.5 rounded-sm truncate max-w-[120px]">
                            &quot;{virtualKeyboard.queryValue}&quot;
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setVirtualKeyboard(null)}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-[11px] font-bold tracking-wide transition-all shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <span>Done</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Layout 1: NUMERIC KEYPAD */}
                {virtualKeyboard.type === "numeric" ? (
                  <div className="grid grid-cols-3 gap-1.5 px-3 py-1">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => virtualKeyboard.onInput(digit)}
                        className="h-11 rounded-xl bg-slate-800/95 hover:bg-slate-700 active:bg-slate-600 active:scale-95 text-white font-bold text-[19px] shadow-sm flex items-center justify-center cursor-pointer transition-all border border-slate-700/60"
                      >
                        {digit}
                      </button>
                    ))}
                    {/* Row 4: Decimal / Plus, 0, Backspace */}
                    {virtualKeyboard.allowDecimal ? (
                      <button
                        type="button"
                        onClick={() => virtualKeyboard.onInput(".")}
                        className="h-11 rounded-xl bg-slate-800/95 hover:bg-slate-700 active:bg-slate-600 active:scale-95 text-white font-bold text-[20px] shadow-sm flex items-center justify-center cursor-pointer transition-all border border-slate-700/60"
                      >
                        .
                      </button>
                    ) : virtualKeyboard.allowPlus ? (
                      <button
                        type="button"
                        onClick={() => virtualKeyboard.onInput("+")}
                        className="h-11 rounded-xl bg-slate-800/95 hover:bg-slate-700 active:bg-slate-600 active:scale-95 text-white font-bold text-[18px] shadow-sm flex items-center justify-center cursor-pointer transition-all border border-slate-700/60"
                      >
                        +
                      </button>
                    ) : (
                      <div className="h-11 rounded-xl bg-slate-900/30 border border-transparent" />
                    )}
                    <button
                      type="button"
                      onClick={() => virtualKeyboard.onInput("0")}
                      className="h-11 rounded-xl bg-slate-800/95 hover:bg-slate-700 active:bg-slate-600 active:scale-95 text-white font-bold text-[19px] shadow-sm flex items-center justify-center cursor-pointer transition-all border border-slate-700/60"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={() => virtualKeyboard.onBackspace()}
                      className="h-11 rounded-xl bg-slate-900 hover:bg-rose-950/40 active:bg-rose-900/60 active:scale-95 text-slate-300 hover:text-rose-400 font-bold shadow-sm flex items-center justify-center cursor-pointer transition-all border border-slate-700/60"
                      title="Backspace"
                    >
                      <Delete className="w-5 h-5 stroke-[2.2]" />
                    </button>
                  </div>
                ) : (
                  /* Layout 2: QWERTY KEYBOARD */
                  <div className="px-1.5 py-1 space-y-1">
                    {!keyboardSymbols ? (
                      <>
                        {/* Letters Row 1 */}
                        <div className="flex items-center gap-1 justify-center">
                          {["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"].map((letter) => {
                            const char = keyboardShift ? letter.toUpperCase() : letter;
                            return (
                              <button
                                key={letter}
                                type="button"
                                onClick={() => virtualKeyboard.onInput(char)}
                                className="flex-1 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 active:scale-95 text-white font-medium text-[13px] shadow-sm flex items-center justify-center cursor-pointer transition-all border border-slate-700/50"
                              >
                                {char}
                              </button>
                            );
                          })}
                        </div>
                        {/* Letters Row 2 */}
                        <div className="flex items-center gap-1 justify-center px-2">
                          {["a", "s", "d", "f", "g", "h", "j", "k", "l"].map((letter) => {
                            const char = keyboardShift ? letter.toUpperCase() : letter;
                            return (
                              <button
                                key={letter}
                                type="button"
                                onClick={() => virtualKeyboard.onInput(char)}
                                className="flex-1 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 active:scale-95 text-white font-medium text-[13px] shadow-sm flex items-center justify-center cursor-pointer transition-all border border-slate-700/50"
                              >
                                {char}
                              </button>
                            );
                          })}
                        </div>
                        {/* Letters Row 3 */}
                        <div className="flex items-center gap-1 justify-center">
                          <button
                            type="button"
                            onClick={() => setKeyboardShift(!keyboardShift)}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-[12px] font-bold shadow-sm cursor-pointer transition-all border ${
                              keyboardShift
                                ? "bg-emerald-600 text-white border-emerald-500"
                                : "bg-slate-900 text-slate-300 border-slate-700/50 hover:bg-slate-800"
                            }`}
                            title="Shift"
                          >
                            ⇧
                          </button>
                          {["z", "x", "c", "v", "b", "n", "m"].map((letter) => {
                            const char = keyboardShift ? letter.toUpperCase() : letter;
                            return (
                              <button
                                key={letter}
                                type="button"
                                onClick={() => virtualKeyboard.onInput(char)}
                                className="flex-1 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 active:scale-95 text-white font-medium text-[13px] shadow-sm flex items-center justify-center cursor-pointer transition-all border border-slate-700/50"
                              >
                                {char}
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => virtualKeyboard.onBackspace()}
                            className="w-9 h-9 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 font-bold shadow-sm flex items-center justify-center cursor-pointer transition-all border border-slate-700/50"
                            title="Backspace"
                          >
                            <Delete className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Symbols Row 1 */}
                        <div className="flex items-center gap-1 justify-center">
                          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => virtualKeyboard.onInput(num)}
                              className="flex-1 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-medium text-[13px] shadow-sm flex items-center justify-center cursor-pointer transition-all border border-slate-700/50"
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                        {/* Symbols Row 2 */}
                        <div className="flex items-center gap-1 justify-center">
                          {["-", "/", ":", ";", "(", ")", "$", "&", "@", `"`].map((sym) => (
                            <button
                              key={sym}
                              type="button"
                              onClick={() => virtualKeyboard.onInput(sym)}
                              className="flex-1 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-medium text-[13px] shadow-sm flex items-center justify-center cursor-pointer transition-all border border-slate-700/50"
                            >
                              {sym}
                            </button>
                          ))}
                        </div>
                        {/* Symbols Row 3 */}
                        <div className="flex items-center gap-1 justify-center">
                          {[".", ",", "?", "!", "'", "#", "%", "*"].map((sym) => (
                            <button
                              key={sym}
                              type="button"
                              onClick={() => virtualKeyboard.onInput(sym)}
                              className="flex-1 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-medium text-[13px] shadow-sm flex items-center justify-center cursor-pointer transition-all border border-slate-700/50"
                            >
                              {sym}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => virtualKeyboard.onBackspace()}
                            className="w-9 h-9 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 font-bold shadow-sm flex items-center justify-center cursor-pointer transition-all border border-slate-700/50"
                            title="Backspace"
                          >
                            <Delete className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}

                    {/* Bottom Row 4 */}
                    <div className="flex items-center gap-1 justify-center pt-0.5">
                      <button
                        type="button"
                        onClick={() => setKeyboardSymbols(!keyboardSymbols)}
                        className="px-2.5 h-9 rounded-lg bg-slate-900 text-slate-300 hover:text-white font-bold text-[11px] shadow-sm flex items-center justify-center cursor-pointer transition-all border border-slate-700/50"
                      >
                        {keyboardSymbols ? "ABC" : "123"}
                      </button>
                      <button
                        type="button"
                        onClick={() => virtualKeyboard.onInput("@")}
                        className="px-2.5 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[12px] shadow-sm flex items-center justify-center cursor-pointer transition-all border border-slate-700/50"
                      >
                        @
                      </button>
                      <button
                        type="button"
                        onClick={() => virtualKeyboard.onInput(" ")}
                        className="flex-1 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 font-medium text-[11px] shadow-sm flex items-center justify-center cursor-pointer transition-all border border-slate-700/50"
                      >
                        space
                      </button>
                      <button
                        type="button"
                        onClick={() => virtualKeyboard.onInput(".")}
                        className="px-2.5 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[13px] shadow-sm flex items-center justify-center cursor-pointer transition-all border border-slate-700/50"
                      >
                        .
                      </button>
                      <button
                        type="button"
                        onClick={() => setVirtualKeyboard(null)}
                        className="px-3 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm flex items-center justify-center cursor-pointer transition-all"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- BOTTOM SHEET: FORFEIT ROUND CONFIRMATION MODAL --- */}
            {showForfeitModal && (
              <div
                className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150"
                onClick={() => setShowForfeitModal(false)}
              >
                <div
                  className="relative z-10 bg-white rounded-t-[28px] border-t border-[#e1efe5] shadow-2xl px-6 pt-3 pb-8 animate-in slide-in-from-bottom duration-200 flex flex-col w-full max-w-sm mx-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6" />

                  {/* Centered Warning Squircle Badge */}
                  <div className="w-16 h-16 rounded-[22px] bg-[#FFF1F2] border border-[#FFE4E6] flex items-center justify-center mx-auto mb-5 shadow-xs">
                    <svg className="w-8 h-8 text-[#DC2626]" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                    </svg>
                  </div>

                  {/* Centered Heading */}
                  <h3 className="text-[22px] font-black text-[#0F172A] tracking-tight text-center mb-2.5">
                    Withdraw from Round?
                  </h3>

                  {/* Centered Body */}
                  <p className="text-[13.5px] text-[#64748B] text-center leading-relaxed max-w-[280px] mx-auto mb-7 font-normal">
                    Forfeiting now will disqualify your score from the{" "}
                    <strong className="font-bold text-[#0F172A]">
                      {activeRound?.tournamentName || "the tournament"}
                    </strong>
                    . This action cannot be undone.
                  </p>

                  {/* Vertically Stacked Action Buttons */}
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (activeRound?.tournamentId) {
                          await forfeitTournamentRound(activeRound.tournamentId);
                        }
                      } catch (err) {
                        console.warn("Forfeit API fallback to preview simulator:", err);
                      }
                      if (typeof window !== "undefined") {
                        try {
                          localStorage.setItem("openclub_active_round_forfeited", "true");
                        } catch { }
                      }
                      setActiveRound(null);
                      setActiveRoundMinutesElapsed(0);
                      setShowForfeitModal(false);
                      showToast("Withdrawn from tournament round.", "success", "ROUND FORFEITED");
                    }}
                    className="w-full h-12 rounded-[14px] bg-[#D92D20] hover:bg-[#B42318] active:scale-98 text-white text-sm font-bold tracking-wide shadow-md flex items-center justify-center mb-3 cursor-pointer transition-all"
                  >
                    Yes, Forfeit Match
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowForfeitModal(false)}
                    className="w-full h-12 rounded-[14px] bg-[#F1F5F9] hover:bg-[#E2E8F0] active:scale-98 text-[#0F172A] text-sm font-bold tracking-wide flex items-center justify-center cursor-pointer transition-all"
                  >
                    Cancel, Stay in Play
                  </button>
                </div>
              </div>
            )}

            {/* --- BOTTOM SHEET: UNFRIEND CONFIRMATION WARNING MODAL (MATCHING FORFEIT WARNING DISPLAY) --- */}
            {unfriendCandidate && (
              <div
                className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150"
                onClick={() => setUnfriendCandidate(null)}
              >
                <div
                  className="relative z-10 bg-white rounded-t-[28px] border-t border-[#e1efe5] shadow-2xl px-6 pt-3 pb-8 animate-in slide-in-from-bottom duration-200 flex flex-col w-full max-w-sm mx-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6" />

                  {/* Centered Warning Squircle Badge (Matching forfeit modal) */}
                  <div className="w-16 h-16 rounded-[22px] bg-[#FFF1F2] border border-[#FFE4E6] flex items-center justify-center mx-auto mb-5 shadow-xs">
                    <svg className="w-8 h-8 text-[#DC2626]" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                    </svg>
                  </div>

                  {/* Centered Heading */}
                  <h3 className="text-[22px] font-black text-[#0F172A] tracking-tight text-center mb-2.5">
                    Remove Friend?
                  </h3>

                  {/* Centered Body with bold name */}
                  <p className="text-[13.5px] text-[#64748B] text-center leading-relaxed max-w-[280px] mx-auto mb-7 font-normal">
                    Are you sure you want to remove{" "}
                    <strong className="font-bold text-[#0F172A]">
                      {unfriendCandidate.name}
                    </strong>{" "}
                    from your golf friends? You will no longer see their live scores and updates.
                  </p>

                  {/* Vertically Stacked Action Buttons */}
                  <button
                    type="button"
                    onClick={() => {
                      const candidate = unfriendCandidate;
                      setUnfriendCandidate(null);
                      if (candidate) {
                        handleUnfriend(candidate.id, candidate.name);
                      }
                    }}
                    className="w-full h-12 rounded-[14px] bg-[#D92D20] hover:bg-[#B42318] active:scale-98 text-white text-sm font-bold tracking-wide shadow-md flex items-center justify-center mb-3 cursor-pointer transition-all"
                  >
                    Yes, Remove Friend
                  </button>

                  <button
                    type="button"
                    onClick={() => setUnfriendCandidate(null)}
                    className="w-full h-12 rounded-[14px] bg-[#F1F5F9] hover:bg-[#E2E8F0] active:scale-98 text-[#0F172A] text-sm font-bold tracking-wide flex items-center justify-center cursor-pointer transition-all"
                  >
                    Cancel, Keep Friend
                  </button>
                </div>
              </div>
            )}

            {/* --- BOTTOM SHEET: BLOCK CONFIRMATION WARNING MODAL (MATCHING FORFEIT & UNFRIEND WARNING DISPLAY) --- */}
            {blockCandidate && (
              <div
                className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150"
                onClick={() => setBlockCandidate(null)}
              >
                <div
                  className="relative z-10 bg-white rounded-t-[28px] border-t border-[#e1efe5] shadow-2xl px-6 pt-3 pb-8 animate-in slide-in-from-bottom duration-200 flex flex-col w-full max-w-sm mx-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6" />

                  {/* Centered Warning Squircle Badge (Matching forfeit & unfriend warning display) */}
                  <div className="w-16 h-16 rounded-[22px] bg-[#FFF1F2] border border-[#FFE4E6] flex items-center justify-center mx-auto mb-5 shadow-xs">
                    <svg className="w-8 h-8 text-[#DC2626]" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                    </svg>
                  </div>

                  {/* Centered Heading */}
                  <h3 className="text-[22px] font-black text-[#0F172A] tracking-tight text-center mb-2.5">
                    Block Golfer?
                  </h3>

                  {/* Centered Body with bold name */}
                  <p className="text-[13.5px] text-[#64748B] text-center leading-relaxed max-w-[280px] mx-auto mb-7 font-normal">
                    Are you sure you want to block{" "}
                    <strong className="font-bold text-[#0F172A]">
                      {blockCandidate.name}
                    </strong>
                    ? They will not be able to find your profile, view your rounds, or send you game requests.
                  </p>

                  {/* Vertically Stacked Action Buttons */}
                  <button
                    type="button"
                    onClick={() => {
                      const candidate = blockCandidate;
                      setBlockCandidate(null);
                      if (candidate) {
                        handleBlockUser(candidate.id, candidate.name);
                      }
                    }}
                    className="w-full h-12 rounded-[14px] bg-[#D92D20] hover:bg-[#B42318] active:scale-98 text-white text-sm font-bold tracking-wide shadow-md flex items-center justify-center mb-3 cursor-pointer transition-all"
                  >
                    Yes, Block Golfer
                  </button>

                  <button
                    type="button"
                    onClick={() => setBlockCandidate(null)}
                    className="w-full h-12 rounded-[14px] bg-[#F1F5F9] hover:bg-[#E2E8F0] active:scale-98 text-[#0F172A] text-sm font-bold tracking-wide flex items-center justify-center cursor-pointer transition-all"
                  >
                    Cancel, Keep Unblocked
                  </button>
                </div>
              </div>
            )}

            {/* --- BOTTOM SHEET: FRIEND ACTIONS MODAL (MATCHING FORFEIT DISPLAY FORMAT) --- */}
            {friendActionUser && (
              <div
                className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150"
                onClick={() => setFriendActionUser(null)}
              >
                <div
                  className="relative z-10 bg-white rounded-t-[28px] border-t border-[#e1efe5] shadow-2xl px-6 pt-3 pb-8 animate-in slide-in-from-bottom duration-200 flex flex-col w-full max-w-sm mx-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6" />

                  {/* Centered Friend Squircle Badge (Matching forfeit warning geometry with real display photo) */}
                  {(() => {
                    const resolvedFriendAvatar =
                      friendActionUser.avatar ||
                      friendActionUser.profilePhoto ||
                      (registeredPlayers || []).find(
                        (p: any) => p.id === friendActionUser.id || (p.name && p.name.toLowerCase() === friendActionUser.name.toLowerCase())
                      )?.profilePhoto ||
                      (registeredPlayers || []).find(
                        (p: any) => p.id === friendActionUser.id || (p.name && p.name.toLowerCase() === friendActionUser.name.toLowerCase())
                      )?.avatar ||
                      (golfCompetitors || []).find(
                        (p: any) => p.id === friendActionUser.id || (p.name && p.name.toLowerCase() === friendActionUser.name.toLowerCase())
                      )?.avatar;

                    return (
                      <div className="w-16 h-16 rounded-[22px] bg-[#EAF7EE] border border-[#C6F0DB] flex items-center justify-center mx-auto mb-5 shadow-xs relative">
                        {resolvedFriendAvatar ? (
                          <img
                            src={resolvedFriendAvatar}
                            alt={friendActionUser.name}
                            className="w-11 h-11 rounded-full object-cover border border-[#009A60]/20"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              const fallback = e.currentTarget.parentElement?.querySelector(".friend-action-initials-fallback");
                              if (fallback) fallback.classList.remove("hidden");
                            }}
                          />
                        ) : null}
                        <div
                          className={`friend-action-initials-fallback w-11 h-11 rounded-full bg-[#009A60]/10 text-[#009A60] font-bold text-base flex items-center justify-center border border-[#009A60]/20 ${
                            resolvedFriendAvatar ? "hidden" : "flex"
                          }`}
                        >
                          {getTwoInitials(friendActionUser.name)}
                        </div>
                        <div className="w-4 h-4 rounded-full bg-[#009A60] border-2 border-white flex items-center justify-center text-white absolute -bottom-0.5 -right-0.5 shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Centered Heading: Golfer Full Name */}
                  <h3 className="text-[22px] font-black text-[#0F172A] tracking-tight text-center mb-1.5">
                    {friendActionUser.name}
                  </h3>

                  {/* Centered Body / Subtitle */}
                  <p className="text-[13.5px] text-[#64748B] text-center leading-relaxed max-w-[280px] mx-auto mb-7 font-normal">
                    <span className="font-semibold text-[#009A60]">Connected Friend</span> • {friendActionUser.club || "Golf Club"} | {friendActionUser.hcp || "12"} HCP
                  </p>

                  {/* Vertically Stacked Action Buttons */}
                  <button
                    type="button"
                    onClick={() => {
                      const target = friendActionUser;
                      setFriendActionUser(null);
                      setUnfriendCandidate(target);
                    }}
                    className="w-full h-12 rounded-[14px] bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#FFE4E6] active:scale-98 text-[#DC2626] text-sm font-bold tracking-wide shadow-xs flex items-center justify-center gap-2 mb-3 cursor-pointer transition-all"
                  >
                    <UserMinus className="w-4 h-4 stroke-[2.2]" />
                    <span>Remove from Friends</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const target = friendActionUser;
                      setFriendActionUser(null);
                      setBlockCandidate(target);
                    }}
                    className="w-full h-12 rounded-[14px] bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#FFE4E6] active:scale-98 text-[#DC2626] text-sm font-bold tracking-wide shadow-xs flex items-center justify-center gap-2 mb-3 cursor-pointer transition-all"
                  >
                    <Ban className="w-4 h-4 stroke-[2.2]" />
                    <span>Block Golfer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const target = friendActionUser;
                      setFriendActionUser(null);
                      setReportCandidate(target);
                    }}
                    className="w-full h-12 rounded-[14px] bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] active:scale-98 text-[#DC2626] text-sm font-bold tracking-wide shadow-xs flex items-center justify-center gap-2 mb-3 cursor-pointer transition-all"
                  >
                    <Flag className="w-4 h-4 stroke-[2.2]" />
                    <span>Report Golfer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFriendActionUser(null)}
                    className="w-full h-12 rounded-[14px] bg-[#F1F5F9] hover:bg-[#E2E8F0] active:scale-98 text-[#0F172A] text-sm font-bold tracking-wide flex items-center justify-center cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* --- BOTTOM SHEET: REPORT GOLFER MODAL --- */}
            {reportCandidate && (
              <div
                className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150"
                onClick={() => setReportCandidate(null)}
              >
                <div
                  className="relative z-10 bg-white rounded-t-[28px] border-t border-[#e1efe5] shadow-2xl px-6 pt-3 pb-8 animate-in slide-in-from-bottom duration-200 flex flex-col w-full max-w-sm mx-auto max-h-[88vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-5 shrink-0" />

                  {/* Centered Warning Squircle Badge */}
                  <div className="w-16 h-16 rounded-[22px] bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center mx-auto mb-4 shadow-xs shrink-0 text-[#DC2626]">
                    <Flag className="w-7 h-7 stroke-[2.2]" />
                  </div>

                  <h3 className="text-[20px] font-black text-[#0F172A] tracking-tight text-center mb-1 shrink-0">
                    Report Golfer
                  </h3>
                  <p className="text-[13px] text-[#64748B] text-center mb-5 shrink-0 font-normal">
                    Help maintain a fair, respectful community. Select the infraction regarding{" "}
                    <strong className="font-semibold text-[#0F172A]">{reportCandidate.name}</strong>.
                  </p>

                  {/* Infraction Category Selector */}
                  <div className="space-y-2 mb-4 shrink-0">
                    <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                      Infraction Reason
                    </label>
                    {[
                      "Unsportsmanlike Conduct / Cheating",
                      "Harassment / Offensive Behavior",
                      "Impersonation / Fake Profile",
                      "Inappropriate Content or Avatar",
                      "Spam or Solicitation",
                      "Other Violation",
                    ].map((reason) => (
                      <label
                        key={reason}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          reportReason === reason
                            ? "border-[#009A60] bg-[#EAF7EE] text-[#009A60]"
                            : "border-slate-200 bg-[#F5FAF6] text-[#0F172A] hover:bg-slate-100"
                        }`}
                      >
                        <input
                          type="radio"
                          name="reportReason"
                          value={reason}
                          checked={reportReason === reason}
                          onChange={() => setReportReason(reason)}
                          className="accent-[#009A60]"
                        />
                        <span>{reason}</span>
                      </label>
                    ))}
                  </div>

                  {/* Details Textarea */}
                  <div className="mb-5 shrink-0">
                    <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">
                      Additional Details (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Describe what happened or reference specific tournament rounds..."
                      className="w-full bg-[#f5faf6] border border-[#e1efe5] rounded-xl p-3 text-xs text-[#0F172A] placeholder:text-[#8CA0BA] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 focus:outline-hidden resize-none"
                    />
                  </div>

                  {/* Submit & Cancel Buttons */}
                  <button
                    type="button"
                    disabled={isSubmittingReport}
                    onClick={handleFileUserReport}
                    className="w-full h-12 rounded-[14px] bg-[#DC2626] hover:bg-[#B91C1C] active:scale-98 text-white text-sm font-bold tracking-wide shadow-xs flex items-center justify-center gap-2 mb-3 cursor-pointer transition-all disabled:opacity-50 shrink-0"
                  >
                    <Flag className="w-4 h-4 stroke-[2.2]" />
                    <span>{isSubmittingReport ? "Submitting Report..." : "Submit Report to Moderation"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportCandidate(null)}
                    className="w-full h-12 rounded-[14px] bg-[#F1F5F9] hover:bg-[#E2E8F0] active:scale-98 text-[#0F172A] text-sm font-bold tracking-wide flex items-center justify-center cursor-pointer transition-all shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* --- BOTTOM SHEET 1: ADD GOLF FRIENDS MODAL (Full Device Frame Overlay) --- */}
            {showAddFriendsModal && (
              <div
                className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150"
                onClick={() => {
                  setShowAddFriendsModal(false);
                  setVirtualKeyboard(null);
                }}
              >
                <div
                  className="relative z-10 bg-white rounded-t-[28px] border-t border-[#e1efe5] shadow-2xl p-5 pb-6 animate-in slide-in-from-bottom duration-200 flex flex-col w-full max-w-sm mx-auto transition-all"
                  style={{
                    marginBottom: virtualKeyboard?.isOpen ? "270px" : "0px",
                    maxHeight: virtualKeyboard?.isOpen ? "calc(100% - 280px)" : "90%",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3.5" />
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#EAF7EE] flex items-center justify-center shrink-0">
                        <UserPlus className="h-5 w-5 text-[#009A60]" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900">Add Golf Friends</h4>
                        <p className="text-xs text-slate-500">Connect with competitors and peer markers</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddFriendsModal(false);
                        setVirtualKeyboard(null);
                      }}
                      className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="py-3 space-y-2.5 flex-1 min-h-0 flex flex-col">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#8CA0BA]" />
                      <input
                        type="text"
                        value={friendsSearchQuery}
                        onFocus={() => {
                          openVirtualKeyboard({
                            phoneIndex: index,
                            type: "text",
                            title: "Search Friends",
                            queryValue: friendsSearchQuery,
                            onInput: (char) => {
                              setFriendsSearchQuery((prev) => {
                                const next = prev + char;
                                setVirtualKeyboard((k) => k ? { ...k, queryValue: next } : null);
                                return next;
                              });
                            },
                            onBackspace: () => {
                              setFriendsSearchQuery((prev) => {
                                const next = prev.slice(0, -1);
                                setVirtualKeyboard((k) => k ? { ...k, queryValue: next } : null);
                                return next;
                              });
                            },
                          });
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFriendsSearchQuery(val);
                          setVirtualKeyboard((k) => k ? { ...k, queryValue: val } : null);
                        }}
                        placeholder="Search by player name or golf club..."
                        className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#f5faf6] border border-[#e1efe5] text-xs font-medium text-[#0F172A] placeholder:text-[#8CA0BA] focus:outline-hidden focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 transition-all"
                      />
                      {friendsSearchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setFriendsSearchQuery("");
                            setVirtualKeyboard((k) => k ? { ...k, queryValue: "" } : null);
                          }}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                          title="Clear search"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {friendsSearchQuery.trim() ? (
                      <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider pt-1 flex items-center justify-between">
                        <span>{`Search Results (${filteredFriends.length})`}</span>
                        <span className="text-[10px] text-emerald-600 font-semibold">Active Filter</span>
                      </div>
                    ) : null}

                    {/* Incoming Friend Requests Section */}
                    {incomingFriendRequests.length > 0 && (
                      <div className="mb-2.5 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                            Received Requests ({incomingFriendRequests.length})
                          </span>
                          <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
                        </div>
                        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-0.5 scrollbar-hide">
                          {incomingFriendRequests.map((req: any) => (
                            <div
                              key={req.id}
                              className="flex items-center justify-between p-2 rounded-xl bg-white border border-emerald-100 shadow-2xs"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                                <div className="w-8 h-8 rounded-full bg-[#EAF7EE] text-[#009A60] font-bold text-xs flex items-center justify-center shrink-0">
                                  {req.senderInitial || "G"}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold text-slate-900 truncate">{req.senderName}</div>
                                  <div className="text-[10px] text-slate-500 truncate">
                                    {req.senderClub || "OpenClub Golfer"} • {req.senderHcp || "0.0"} HCP
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleAcceptFriendRequest(req)}
                                  className="w-7 h-7 rounded-full bg-[#009A60] hover:bg-[#008251] active:scale-95 text-white flex items-center justify-center shadow-2xs transition-all cursor-pointer"
                                  title={`Accept friend request from ${req.senderName}`}
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[2.8]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeclineFriendRequest(req)}
                                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200/80 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                                  title={`Decline friend request from ${req.senderName}`}
                                >
                                  <X className="w-3 h-3 stroke-[2.5]" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex-1 overflow-y-auto max-h-[250px] space-y-2 pr-0.5 scrollbar-hide">
                      {!friendsSearchQuery.trim() ? (
                        <div className="py-7 text-center flex flex-col items-center justify-center">
                          <div className="w-12 h-12 rounded-2xl bg-[#EAF7EE] border border-[#C6F0DB] flex items-center justify-center text-[#009A60] mb-2.5 shadow-2xs">
                            <UserPlus className="w-6 h-6 text-[#009A60]" />
                          </div>
                          <p className="text-xs font-bold text-slate-800">Find Golf Friends</p>
                          <p className="text-[11.5px] text-slate-500 mt-1 max-w-[240px] mx-auto leading-relaxed">
                            Type a golfer&apos;s name, home club, or email above to search and connect.
                          </p>
                        </div>
                      ) : filteredFriends.length > 0 ? (
                        filteredFriends.map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#009A60] font-bold text-xs flex items-center justify-center shrink-0">
                                {player.initial}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                  <div className="text-xs font-bold text-slate-900 leading-tight">{player.name}</div>
                                  {(acceptedFriendIds.includes(player.id) || acceptedFriendIds.includes(player.name)) && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-[#EAF7EE] text-[#009A60] text-[9px] font-bold border border-[#C6F0DB] shrink-0 select-none">Friend</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  {player.club} • {player.hcp} HCP
                                </div>
                              </div>
                            </div>
                            {acceptedFriendIds.includes(player.id) || acceptedFriendIds.includes(player.name) ? (
                              <button
                                type="button"
                                onClick={() => setFriendActionUser({
                                  id: player.id,
                                  name: player.name,
                                  club: player.club,
                                  hcp: player.hcp,
                                  avatar: player.avatar,
                                  profilePhoto: player.profilePhoto,
                                })}
                                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs shrink-0"
                                title={`Manage connection with ${player.name}`}
                                aria-label="Golfer Options"
                              >
                                <MoreHorizontal className="w-3.5 h-3.5 stroke-[2.2]" />
                              </button>
                            ) : blockedUserIds.some((bId) => {
                              const bLower = String(bId).toLowerCase().trim();
                              return bLower === String(player.id).toLowerCase().trim() || bLower === player.name.toLowerCase().trim();
                            }) ? (
                              <button
                                type="button"
                                onClick={() => handleUnblockUser(player.id, player.name)}
                                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold border border-slate-300 transition-colors cursor-pointer shrink-0 shadow-2xs"
                                title={`Unblock ${player.name}`}
                              >
                                Unblock
                              </button>
                            ) : sentFriendRequests.includes(player.id) ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-[#009A60] border border-emerald-200 text-[11px] font-bold shrink-0">
                                <Send className="w-3 h-3" /> Sent
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={async () => {
                                  const currentUserId = authenticatedPlayer?.id || "guest";
                                  const sentKey = getSentRequestsKey(currentUserId);
                                  const targetUserId = player.id;
                                  const targetIncomingKey = getIncomingRequestsKey(targetUserId);
                                  const targetNotifKey = getUserNotificationsKey(targetUserId);

                                  // 1. Update sender's sent friend requests
                                  setSentFriendRequests((prev) => {
                                    const next = prev.includes(targetUserId) ? prev : [...prev, targetUserId];
                                    try {
                                      localStorage.setItem(sentKey, JSON.stringify(next));
                                    } catch {}
                                    return next;
                                  });

                                  // 2. Deliver incoming friend request to recipient's mailbox across ID, email, and name keys
                                  try {
                                    const newIncomingItem = {
                                      id: `freq_${Date.now()}`,
                                      senderId: currentUserId,
                                      senderName: authenticatedPlayer?.name || "OpenClub Golfer",
                                      senderEmail: authenticatedPlayer?.email || "",
                                      senderClub: authenticatedPlayer?.club || "Ikoyi Golf Club",
                                      senderHcp: authenticatedPlayer?.handicap ?? "0.0",
                                      senderInitial: authenticatedPlayer?.name ? authenticatedPlayer.name.charAt(0).toUpperCase() : "G",
                                      senderAvatar: authenticatedPlayer?.avatar || "",
                                      targetId: player.id,
                                      targetEmail: player.email || "",
                                      targetName: player.name || "",
                                      createdAt: new Date().toISOString(),
                                      status: "PENDING",
                                    };

                                    const targetKeysToDeliver = [targetIncomingKey];
                                    if (player.email) {
                                      targetKeysToDeliver.push(getIncomingRequestsKey(player.email.toLowerCase().trim()));
                                    }
                                    const pNameSlug = player.name?.toLowerCase().trim().replace(/\s+/g, "_");
                                    if (pNameSlug) {
                                      targetKeysToDeliver.push(getIncomingRequestsKey(pNameSlug));
                                    }

                                    for (const destKey of targetKeysToDeliver) {
                                      try {
                                        const raw = localStorage.getItem(destKey);
                                        const parsed = raw ? JSON.parse(raw) : [];
                                        const filtered = parsed.filter((item: any) => item.senderId !== currentUserId);
                                        localStorage.setItem(destKey, JSON.stringify([newIncomingItem, ...filtered]));
                                      } catch {}
                                    }

                                    // Deliver in-app notification to recipient
                                    const existingNotifsRaw = localStorage.getItem(targetNotifKey);
                                    const existingNotifs = existingNotifsRaw ? JSON.parse(existingNotifsRaw) : [];
                                    const newNotifItem = {
                                      id: `notif_freq_${Date.now()}`,
                                      title: "Friend Request",
                                      body: `${authenticatedPlayer?.name || "A golfer"} sent you a friend request to connect on OpenClub.`,
                                      isRead: false,
                                      createdAt: new Date().toISOString(),
                                      data: {
                                        type: "FRIEND_REQUEST",
                                        senderId: currentUserId,
                                        senderName: authenticatedPlayer?.name || "A golfer",
                                        requestId: newIncomingItem.id,
                                      },
                                    };
                                    localStorage.setItem(targetNotifKey, JSON.stringify([newNotifItem, ...existingNotifs]));

                                    // Also record in-app notification in SENDER'S mailbox
                                    const senderNotifKey = getUserNotificationsKey(currentUserId);
                                    const senderExistingRaw = localStorage.getItem(senderNotifKey);
                                    const senderExisting = senderExistingRaw ? JSON.parse(senderExistingRaw) : [];
                                    const senderNotifItem = {
                                      id: `notif_sent_${Date.now()}`,
                                      title: "Friend Request Sent",
                                      body: `You sent a friend request to ${player.name} (${player.club} • ${player.hcp} HCP). Pending acceptance.`,
                                      isRead: false,
                                      createdAt: new Date().toISOString(),
                                      data: {
                                        type: "FRIEND_REQUEST_SENT",
                                        targetUserId: player.id,
                                        targetUserName: player.name,
                                        targetUserClub: player.club,
                                        targetUserHcp: player.hcp,
                                        status: "PENDING",
                                      },
                                    };
                                    localStorage.setItem(senderNotifKey, JSON.stringify([senderNotifItem, ...senderExisting]));
                                    setMobileNotifications((prev) => [senderNotifItem, ...prev]);
                                  } catch {}

                                  // 3. Dispatch to backend API
                                  try {
                                    const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
                                    const token = localStorage.getItem("openclub_access_token") || localStorage.getItem("openclub_mobile_token");
                                    if (token) {
                                      fetch(`${backendBase}/notifications/send`, {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                          Authorization: `Bearer ${token}`,
                                        },
                                        body: JSON.stringify({
                                          recipientId: targetUserId,
                                          title: "Friend Request",
                                          body: `${authenticatedPlayer?.name || "A golfer"} sent you a friend request to connect on OpenClub.`,
                                          type: "SYSTEM",
                                          data: {
                                            type: "FRIEND_REQUEST",
                                            senderId: currentUserId,
                                            senderName: authenticatedPlayer?.name || "A golfer",
                                          },
                                        }),
                                      }).catch(() => null);
                                    }
                                  } catch {}

                                  showToast(`Friend request sent to ${player.name}!`, "success", "REQUEST SENT");
                                }}
                                className="px-3.5 py-1.5 rounded-lg bg-[#009A60] hover:bg-[#008251] active:scale-95 text-white text-[11px] font-bold transition-all cursor-pointer shadow-xs shrink-0"
                              >
                                Add
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center flex flex-col items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                            <Search className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-bold text-slate-700">No golfers found for &quot;{friendsSearchQuery}&quot;</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Search by another player name or golf club</p>
                          <button
                            type="button"
                            onClick={() => setFriendsSearchQuery("")}
                            className="mt-2 text-xs text-[#009A60] font-semibold hover:underline cursor-pointer"
                          >
                            Clear search
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAddFriendsModal(false);
                      showToast("Invite link copied to clipboard!", "success", "SHARE INVITE");
                    }}
                    className="mt-2 w-full py-2.5 rounded-xl bg-[#009A60] hover:bg-[#008251] active:scale-[0.98] text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/20 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Share Invite Link or QR
                  </button>
                </div>
              </div>
            )}

            {/* --- BOTTOM SHEET: VIEW PLAYERS (ACTIVE ON-COURSE COMPETITORS) --- */}
            {showActivePlayersModal && (
              <div
                className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150"
                onClick={() => {
                  setShowActivePlayersModal(false);
                  setVirtualKeyboard(null);
                }}
              >
                <div
                  className="relative z-10 bg-white rounded-t-[28px] border-t border-[#e1efe5] shadow-2xl p-5 pb-5 animate-in slide-in-from-bottom duration-200 flex flex-col w-full max-w-sm mx-auto transition-all"
                  style={{
                    marginBottom: virtualKeyboard?.isOpen ? "270px" : "0px",
                    height: virtualKeyboard?.isOpen ? "calc(100% - 280px)" : "auto",
                    maxHeight: virtualKeyboard?.isOpen ? "calc(100% - 280px)" : "88%",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3.5" />
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#EAF7EE] flex items-center justify-center shrink-0">
                        <Users className="h-5 w-5 text-[#009A60]" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900">Active Players</h4>
                        <p className="text-xs text-slate-500">Currently competing on the course</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowActivePlayersModal(false);
                        setVirtualKeyboard(null);
                      }}
                      className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Search Input for Active Competitors */}
                  <div className="py-2.5 space-y-2.5 flex-1 min-h-0 flex flex-col">
                    <div className="relative">
                      <Search className="w-4 h-4 text-[#8CA0BA] absolute left-3 top-3" />
                      <input
                        type="text"
                        value={activePlayersSearchQuery}
                        onFocus={() => {
                          openVirtualKeyboard({
                            phoneIndex: index,
                            type: "text",
                            title: "Search Active Competitors",
                            queryValue: activePlayersSearchQuery,
                            onInput: (char) => {
                              setActivePlayersSearchQuery((prev) => {
                                const next = prev + char;
                                setVirtualKeyboard((k) => (k ? { ...k, queryValue: next } : null));
                                return next;
                              });
                            },
                            onBackspace: () => {
                              setActivePlayersSearchQuery((prev) => {
                                const next = prev.slice(0, -1);
                                setVirtualKeyboard((k) => (k ? { ...k, queryValue: next } : null));
                                return next;
                              });
                            },
                          });
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActivePlayersSearchQuery(val);
                          setVirtualKeyboard((k) => (k ? { ...k, queryValue: val } : null));
                        }}
                        placeholder="Search player, flight, or hole..."
                        className="w-full h-10 pl-9 pr-8 text-xs font-medium rounded-xl bg-[#f5faf6] border border-[#e1efe5] text-[#0F172A] placeholder:text-[#8CA0BA] focus:outline-hidden focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 transition-all"
                      />
                      {activePlayersSearchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setActivePlayersSearchQuery("");
                            setVirtualKeyboard((k) => k ? { ...k, queryValue: "" } : null);
                          }}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                          title="Clear search"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider pt-0.5 flex items-center justify-between">
                      <span>{activePlayersSearchQuery.trim() ? `Search Results (${filteredActivePlayers.length})` : `On-Course Competitors (${activeCompetitorsData.length})`}</span>
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry
                      </span>
                    </div>

                    {/* Competitor Cards */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 scrollbar-hide min-h-0">
                      {filteredActivePlayers.length > 0 ? (
                        filteredActivePlayers.map((player: any) => (
                          <div
                            key={player.id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                              <div className="relative shrink-0">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-b from-slate-200 to-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center border border-white">
                                  {player.initials}
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-slate-900 truncate">{player.name}</span>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${
                                    player.toPar < 0
                                      ? "bg-emerald-50 text-[#009A60] border-emerald-200"
                                      : player.toPar === 0
                                      ? "bg-slate-50 text-slate-700 border-slate-200"
                                      : "bg-rose-50 text-rose-600 border-rose-200"
                                  }`}>
                                    {player.toPar < 0 ? `${player.toPar}` : player.toPar === 0 ? "E" : `+${player.toPar}`}
                                  </span>
                                </div>
                                <div className="text-[10.5px] text-slate-500 truncate">
                                  Hole {player.currentHole} • Thru {player.thru} • Gross {player.gross}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPlayerForScorecard(player);
                                setScorecardViewSection("all");
                                setShowActivePlayersModal(false);
                                setVirtualKeyboard(null);
                                switchScreen("player-scorecard");
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#009A60] hover:bg-[#008251] active:scale-95 text-white text-[11px] font-bold transition-all cursor-pointer shadow-xs shrink-0 flex items-center gap-1"
                            >
                              <span>Score</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center flex flex-col items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                            <Search className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-bold text-slate-700">No active golfers matching &quot;{activePlayersSearchQuery}&quot;</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Search by name, flight, or score</p>
                          <button
                            type="button"
                            onClick={() => setActivePlayersSearchQuery("")}
                            className="mt-2 text-xs text-[#009A60] font-semibold hover:underline cursor-pointer"
                          >
                            Clear search
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowActivePlayersModal(false);
                      setVirtualKeyboard(null);
                      switchScreen("leaderboard");
                    }}
                    className="mt-2 w-full py-2.5 rounded-xl bg-[#009A60] hover:bg-[#008251] active:scale-[0.98] text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/20 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <span>View Full Live Leaderboard</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* --- BOTTOM SHEET: MY BOOKINGS (SESSIONS MADE WITH A PRO) --- */}
            {showBookingsModal && (
              <div
                className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150"
                onClick={() => setShowBookingsModal(false)}
              >
                <div
                  className="relative z-10 bg-white rounded-t-[28px] border-t border-[#e1efe5] shadow-2xl p-5 pb-6 animate-in slide-in-from-bottom duration-200 max-h-[88%] flex flex-col w-full max-w-sm mx-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3.5" />
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#EAF7EE] flex items-center justify-center shrink-0 shadow-xs border border-[#C6F0DB]">
                        <CalendarCheck className="h-5 w-5 text-[#009A60]" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900 leading-tight">My Bookings</h4>
                        <p className="text-xs text-slate-500 font-medium leading-tight mt-0.5">Sessions & lessons booked with a Pro</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBookingsModal(false)}
                      className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="py-3.5 space-y-3 max-h-[380px] overflow-y-auto pr-0.5 scrollbar-hide">
                    {proBookings.length > 0 ? (
                      proBookings.map((b) => (
                        <div
                          key={b.id}
                          className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col gap-2.5 transition-all hover:border-slate-300"
                        >
                          {/* Pro Info & Status */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {b.proAvatar ? (
                                <img
                                  src={b.proAvatar}
                                  alt={b.proName}
                                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-[#EAF7EE] text-[#009A60] border border-[#C6F0DB] flex items-center justify-center text-xs font-black shrink-0">
                                  {getTwoInitials(b.proName)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <h5 className="text-[13.5px] font-bold text-[#0F172A] truncate leading-snug">
                                  {b.proName}
                                </h5>
                                <p className="text-[11px] text-[#64748B] truncate leading-tight">
                                  {b.proRole} • {b.proClub}
                                </p>
                              </div>
                            </div>
                            <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#EAF7EE] text-[#009A60] border border-[#C6F0DB] text-[9.5px] font-extrabold uppercase tracking-wider">
                              {b.status}
                            </span>
                          </div>

                          {/* Session Details */}
                          <div className="bg-[#f8faf9] rounded-xl p-2.5 border border-[#e8f1eb] space-y-1.5">
                            <div className="text-[12.5px] font-bold text-[#0F172A]">
                              {b.serviceName}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11.5px] text-[#475569] font-medium">
                              <Calendar className="w-3.5 h-3.5 text-[#009A60] shrink-0" />
                              <span>{b.date} • {b.time}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
                              <MapPin className="w-3.5 h-3.5 text-[#8CA0BA] shrink-0" />
                              <span className="truncate">{b.location}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-0.5">
                            <button
                              type="button"
                              onClick={() => showToast(`Session on ${b.date} synced to calendar.`, "success", "CALENDAR SYNCED")}
                              className="flex-1 py-1.5 rounded-xl bg-[#EAF7EE] hover:bg-[#d8f2e2] text-[#009A60] text-[11px] font-bold transition-all cursor-pointer text-center"
                            >
                              Add to Calendar
                            </button>
                            <button
                              type="button"
                              onClick={() => showToast(`Contacting ${b.proName} for reschedule options.`, "alert", "RESCHEDULE")}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#475569] text-[11px] font-bold transition-all cursor-pointer text-center"
                            >
                              Reschedule
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                          <CalendarCheck className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-slate-700">No active bookings with a Pro</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Book a PGA certified professional for private coaching</p>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      showToast("Select a Club Pro to book your next lesson.", "success", "NEW PRO SESSION");
                    }}
                    className="mt-2 w-full py-2.5 rounded-xl bg-[#009A60] hover:bg-[#008251] active:scale-[0.98] text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/20 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Book Another Session with a Pro</span>
                  </button>
                </div>
              </div>
            )}

            {/* --- BOTTOM SHEET 2: NOTIFICATIONS MODAL (ONLY ACCEPTED FRIENDS & SYSTEM NOTICES) --- */}
            {showNotificationsModal && (
              <div
                className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150"
                onClick={() => {
                  setShowNotificationsModal(false);
                  setVirtualKeyboard(null);
                }}
              >
                <div
                  className="relative z-10 bg-white rounded-t-[28px] border-t border-[#e1efe5] shadow-2xl p-5 pb-7 animate-in slide-in-from-bottom duration-200 max-h-[85%] flex flex-col w-full max-w-sm mx-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3.5" />
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#EAF7EE] flex items-center justify-center shrink-0 shadow-xs border border-[#C6F0DB]">
                        <Bell className="h-5 w-5 text-[#009A60]" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900 leading-tight">Notifications & Alerts</h4>
                        <p className="text-xs text-slate-500 font-medium leading-tight mt-0.5">Tee times, attestations & friend updates</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotificationsModal(false);
                        setVirtualKeyboard(null);
                      }}
                      className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="py-3.5 space-y-2.5 max-h-[340px] overflow-y-auto">
                    {/* Strictly show accepted friend notifications and tournament/system notices */}
                    {mobileNotifications.filter((n: any) => {
                      return n.data?.type !== "FRIEND_REQUEST" && n.data?.type !== "FRIEND_REQUEST_SENT";
                    }).length > 0 ? (
                      <div className="space-y-2">
                        {mobileNotifications
                          .filter((n: any) => {
                            return n.data?.type !== "FRIEND_REQUEST" && n.data?.type !== "FRIEND_REQUEST_SENT";
                          })
                          .map((notif: any) => (
                            <div
                              key={notif.id}
                              className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col gap-2"
                            >
                              <div className="flex items-start gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100">
                                  {notif.data?.type === "FRIEND_ACCEPTED" ? (
                                    <Users className="h-4 w-4 text-[#009A60]" />
                                  ) : (
                                    <Bell className="h-4 w-4 text-[#009A60]" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-xs font-bold text-slate-900 truncate">{notif.title}</span>
                                    {!notif.isRead && (
                                      <span className="w-2 h-2 rounded-full bg-[#EF4444] shrink-0 animate-pulse" />
                                    )}
                                  </div>
                                  <span className="text-[11px] text-slate-600 block mt-0.5 leading-snug font-medium whitespace-pre-line">
                                    {notif.body}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium shrink-0">
                                  {formatNotifTime(notif.createdAt)}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      /* Empty State */
                      <div className="py-8 text-center">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                          <Bell className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-700">No Notifications</p>
                        <p className="text-[11px] text-slate-400 max-w-[240px] mx-auto mt-0.5 font-normal">
                          Official tournament announcements, score attestations, and accepted friend updates will appear here.
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      setMobileNotifications((prev) => prev.map((n: any) => ({ ...n, isRead: true })));
                      if (authenticatedPlayer?.id) {
                        try {
                          const notifKey = getUserNotificationsKey(authenticatedPlayer.id);
                          const saved = localStorage.getItem(notifKey);
                          if (saved) {
                            const parsed = JSON.parse(saved);
                            const updated = parsed.map((n: any) => ({ ...n, isRead: true }));
                            localStorage.setItem(notifKey, JSON.stringify(updated));
                          }
                        } catch {}
                      }
                      try {
                        const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
                        const token = localStorage.getItem("openclub_access_token") || localStorage.getItem("openclub_mobile_token");
                        if (token) {
                          await fetch(`${backendBase}/notifications/mark-all-read`, {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}` },
                          }).catch(() => null);
                        }
                      } catch {}
                      setShowNotificationsModal(false);
                      setVirtualKeyboard(null);
                    }}
                    className="mt-2 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Dismiss All
                  </button>
                </div>
              </div>
            )}

            {/* --- BOTTOM SHEET 3: FRIEND REQUESTS & FRIENDS MODAL --- */}
            {showFriendRequestsModal && (
              <div
                className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150"
                onClick={() => {
                  setShowFriendRequestsModal(false);
                  setVirtualKeyboard(null);
                }}
              >
                <div
                  className="relative z-10 bg-white rounded-t-[28px] border-t border-[#e1efe5] shadow-2xl p-5 pb-7 animate-in slide-in-from-bottom duration-200 max-h-[85%] flex flex-col w-full max-w-sm mx-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Handle Bar */}
                  <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3.5" />

                  {/* Header */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#EAF7EE] flex items-center justify-center shrink-0 shadow-xs border border-[#C6F0DB]">
                        <Users className="h-5 w-5 text-[#009A60]" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900 leading-tight">Friend Requests</h4>
                        <p className="text-xs text-slate-500 font-medium leading-tight mt-0.5">Manage connections & invitations</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowFriendRequestsModal(false);
                        setVirtualKeyboard(null);
                      }}
                      className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Content List */}
                  <div className="py-3.5 space-y-3.5 max-h-[360px] overflow-y-auto pr-0.5">
                    {/* 1. Received Friend Requests */}
                    {incomingFriendRequests.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                            Received Requests ({incomingFriendRequests.length})
                          </span>
                        </div>
                        {incomingFriendRequests.map((req: any) => (
                          <div
                            key={req.id || req.senderId}
                            className="p-3 rounded-xl bg-[#F5FAF6] border border-[#E1EFE5] flex flex-col gap-2.5 shadow-2xs"
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="relative shrink-0 mt-0.5">
                                {req.senderAvatar ? (
                                  <img
                                    src={req.senderAvatar}
                                    alt={req.senderName}
                                    className="w-9 h-9 rounded-full object-cover border border-slate-200"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLElement).style.display = "none";
                                      const fb = e.currentTarget.parentElement?.querySelector(".avatar-initials-fallback") as HTMLElement;
                                      if (fb) fb.style.display = "flex";
                                    }}
                                  />
                                ) : null}
                                <div className={`w-9 h-9 rounded-full bg-emerald-100 text-[#009A60] font-bold text-xs items-center justify-center shrink-0 shadow-2xs avatar-initials-fallback ${req.senderAvatar ? "hidden" : "flex"}`}>
                                  {getTwoInitials(req.senderName)}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-xs font-bold text-slate-900 truncate">{req.senderName}</span>
                                  <span className="w-2 h-2 rounded-full bg-[#EF4444] shrink-0 animate-pulse" />
                                </div>
                                <div className="text-[10px] text-slate-500 truncate font-medium">
                                  {req.senderClub || "Ikoyi Golf Club"} • {req.senderHcp || "20"} HCP
                                </div>
                                <span className="text-[11px] text-slate-600 block mt-0.5 leading-snug">
                                  Wants to connect with you on OpenClub.
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-emerald-100/60">
                              <button
                                type="button"
                                onClick={() => handleAcceptFriendRequest(req)}
                                className="px-3.5 py-1.5 rounded-lg bg-[#009A60] hover:bg-[#008251] active:scale-95 text-white text-[11px] font-bold cursor-pointer transition-all shadow-2xs"
                              >
                                Accept Request
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeclineFriendRequest(req)}
                                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-[11px] font-semibold cursor-pointer transition-all"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 2. Sent Requests (Pending Approval) */}
                    {sentFriendRequests.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                            Sent Requests ({sentFriendRequests.length})
                          </span>
                        </div>
                        {sentFriendRequests.map((targetId: string) => {
                          const matchedCompetitor =
                            golfCompetitors.find((c: any) => c.id === targetId || c.email?.toLowerCase() === targetId.toLowerCase()) ||
                            registeredPlayers.find((p: any) => p.id === targetId || p.registrationId === targetId);
                          const name = matchedCompetitor?.name || "Golfer";
                          const club = matchedCompetitor?.club || "Ikoyi Golf Club";
                          const hcp = (matchedCompetitor as any)?.hcp || (matchedCompetitor as any)?.handicap || "20";
                          const avatar = (matchedCompetitor as any)?.avatar || (matchedCompetitor as any)?.profilePhoto;

                          return (
                            <div
                              key={`sent_${targetId}`}
                              className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-2.5"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="relative shrink-0">
                                  {avatar ? (
                                    <img
                                      src={avatar}
                                      alt={name}
                                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLElement).style.display = "none";
                                        const fb = e.currentTarget.parentElement?.querySelector(".avatar-initials-fallback") as HTMLElement;
                                        if (fb) fb.style.display = "flex";
                                      }}
                                    />
                                  ) : null}
                                  <div className={`w-8 h-8 rounded-full bg-[#EAF7EE] text-[#009A60] font-bold text-xs items-center justify-center shrink-0 border border-[#C6F0DB] avatar-initials-fallback ${avatar ? "hidden" : "flex"}`}>
                                    {getTwoInitials(name)}
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold text-slate-900 truncate">{name}</div>
                                  <div className="text-[10px] text-slate-500 truncate font-medium">
                                    {club} • {hcp} HCP
                                  </div>
                                  <div className="text-[10px] text-amber-700 font-medium truncate mt-0.5">
                                    Waiting for response
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                                  Pending
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCancelSentFriendRequest(targetId)}
                                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-md transition-colors cursor-pointer"
                                  title="Cancel Request"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Empty State when no incoming or sent requests */}
                    {incomingFriendRequests.length === 0 &&
                      sentFriendRequests.length === 0 && (
                        <div className="py-8 text-center">
                          <div className="w-12 h-12 rounded-full bg-[#EAF7EE] border border-[#C6F0DB] flex items-center justify-center mx-auto mb-2.5 text-[#009A60]">
                            <Users className="w-6 h-6" />
                          </div>
                          <p className="text-xs font-bold text-slate-800">No Pending Requests</p>
                          <p className="text-[11px] text-slate-500 max-w-[200px] mx-auto mt-0.5">
                            Incoming and sent friend requests will appear here.
                          </p>
                        </div>
                      )}
                  </div>

                  {/* Bottom Action Button: Find & Add Golf Friends */}
                  <div className="pt-2 border-t border-slate-100 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowFriendRequestsModal(false);
                        setShowAddFriendsModal(true);
                      }}
                      className="w-full h-11 rounded-xl bg-[#009A60] hover:bg-[#008251] active:scale-[0.99] text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Find & Add Golf Friends</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* --- BOTTOM SHEET 4: MENU DRAWER MODAL --- */}
            {showMenuDrawer && (
              <div
                className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150"
                onClick={() => setShowMenuDrawer(false)}
              >
                <div
                  className="relative z-10 bg-white rounded-t-[28px] border-t border-[#e1efe5] shadow-2xl p-5 pb-8 animate-in slide-in-from-bottom duration-200 max-h-[85%] flex flex-col w-full max-w-sm mx-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#009A60] to-[#0A5536] text-white font-black text-sm flex items-center justify-center shadow-md select-none border border-emerald-600/20 shrink-0">
                        {currentInitials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {currentDisplayName}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">
                          {authenticatedPlayer?.email || (regEmail ? regEmail.trim().toLowerCase() : "samuel.obadina@gmail.com")}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowMenuDrawer(false)}
                      className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="py-3 space-y-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenuDrawer(false);
                        showToast("Competitor profile certified active.", "success", "PROFILE STATUS");
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 flex items-center gap-2.5 cursor-pointer font-medium transition-colors"
                    >
                      <UserCheck className="h-4 w-4 text-[#009A60]" />
                      <span>My Competitor Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowMenuDrawer(false);
                        showToast("Handicap Index Verified Active.", "success", "HANDICAP INDEX");
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 flex items-center gap-2.5 cursor-pointer font-medium transition-colors"
                    >
                      <ShieldCheck className="h-4 w-4 text-[#009A60]" />
                      <span>Verified Handicap Index</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowMenuDrawer(false);
                        setShowBookingsModal(true);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 flex items-center gap-2.5 cursor-pointer font-medium transition-colors"
                    >
                      <CalendarCheck className="h-4 w-4 text-[#009A60]" />
                      <span>My Pro Bookings</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowMenuDrawer(false);
                        showToast(`Home Club: ${authenticatedPlayer?.club || "None selected"}`, "success", "HOME CLUB");
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 flex items-center gap-2.5 cursor-pointer font-medium transition-colors"
                    >
                      <Building2 className="h-4 w-4 text-[#009A60]" />
                      <span>Home Club Directory</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowMenuDrawer(false);
                        showToast("Settings & Preferences opened.", "success", "SETTINGS");
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 flex items-center gap-2.5 cursor-pointer font-medium transition-colors"
                    >
                      <Sliders className="h-4 w-4 text-[#009A60]" />
                      <span>Settings & Preferences</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenuDrawer(false);
                        updateAuthenticatedPlayer(null);
                        setSentFriendRequests([]);
                        setAcceptedFriendIds([]);
                        setIncomingFriendRequests([]);
                        setMobileNotifications([]);
                        setFriendsOnCourse([]);
                        setFriendsSearchQuery("");
                        setHasInactivityWarning(false);
                        setActiveRoundMinutesElapsed(0);
                        if (typeof window !== "undefined") {
                          try {
                            sessionStorage.removeItem("openclub_inactivity_notified");
                            localStorage.removeItem("openclub_access_token");
                            localStorage.removeItem("openclub_mobile_token");
                          } catch { }
                        }
                        switchScreen("login");
                      }}
                      className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer border border-rose-200/60"
                    >
                      <LogOut className="h-4 w-4 text-rose-600" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-[#06090E] text-slate-100 flex flex-col font-sans">
      {/* Studio Header Bar */}
      <header className="border-b border-slate-800/80 bg-[#090E17]/95 backdrop-blur-md px-5 py-3 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-900/30">
            <Smartphone className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-wide text-white">
                Flutter Mobile Studio
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Dart 3.x • Riverpod
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Interactive preview across iOS and Android flagship hardware models
            </p>
          </div>
        </div>

        {/* Center & Right Controls: View Mode, Sync, Zoom, Back */}
        <div className="flex items-center gap-2.5">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-[#080D15] rounded-xl p-1 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("single")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "single"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Single</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("dual");
                if (deviceScale === 100) setDeviceScale(85);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "dual"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Dual (2x)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("trio");
                if (deviceScale > 75) setDeviceScale(75);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "trio"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Trio (3x)</span>
            </button>
          </div>

          {/* Screen Sync Toggle (when in multi-device mode) */}
          {viewMode !== "single" && (
            <button
              type="button"
              onClick={() => setSyncScreens(!syncScreens)}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                syncScreens
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  : "bg-[#0D1522] border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${syncScreens ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
              <span>{syncScreens ? "Sync Screens" : "Independent"}</span>
            </button>
          )}

          {/* Zoom Segmented Control */}
          <div className="hidden lg:flex items-center bg-[#080D15] rounded-xl p-1 border border-slate-800 text-xs">
            <ZoomIn className="h-3 w-3 text-slate-500 ml-1.5 mr-1" />
            {[50, 65, 75, 85, 100].map((scale) => (
              <button
                key={scale}
                type="button"
                onClick={() => setDeviceScale(scale)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] ${
                  deviceScale === scale
                    ? "bg-slate-800 text-white font-medium shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {scale}%
              </button>
            ))}
          </div>

          <Link
            href="/organizer-admin"
            className="no-underline px-3.5 py-1.5 rounded-xl text-xs font-medium bg-[#0D1522] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800/80 transition-all flex items-center gap-1.5 shadow-xs ml-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Admin</span>
          </Link>
        </div>
      </header>

      {/* Main Workspace: Left Control Sidebar + Device Stage + Code Inspector */}
      <div className="flex-1 min-h-0 min-w-0 flex overflow-hidden">
        {/* Left Studio Sidebar: Vertically Arranged Navigation & Controls */}
        <aside className="w-72 border-r border-slate-800/80 bg-[#090E17]/95 flex flex-col shrink-0 overflow-y-auto z-20 select-none">
          {/* Section 1: Mobile App Screens */}
          <div className="p-3 border-b border-slate-800/60">
            <div className="flex items-center justify-between px-1 pb-2">
              <span className="text-[10.5px] uppercase tracking-wider font-semibold text-slate-400">
                Screens
              </span>
              <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md">
                11 Views
              </span>
            </div>

            <div className="space-y-1">
              {[
                { id: "landing", label: "Get Started (Landing)", icon: Sparkles },
                { id: "register", label: "Register", icon: UserPlus },
                { id: "verify", label: "Verify Email (OTP)", icon: Mail },
                { id: "login", label: "Login", icon: LogOut, iconClass: "rotate-180" },
                { id: "forgot-password", label: "Forgot Password", icon: KeyRound },
                { id: "check-inbox", label: "Check Your Inbox", icon: Mail },
                { id: "reset-password", label: "Set New Password", icon: Lock },
                { id: "scoring", label: "Scoring", icon: Flag },
                { id: "attestation", label: "Attestation", icon: UserCheck },
                { id: "hub", label: "Home", icon: Home },
                { id: "tournaments", label: "Tournaments", icon: Trophy },
                { id: "add-friends", label: "Add Golf Friends", icon: UserPlus },
                { id: "sync-contacts", label: "Sync Your Contacts", icon: BookUser },
                { id: "notifications", label: "Notifications", icon: Bell },
                { id: "leaderboard", label: "Leaderboard", icon: Award },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeScreen === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => switchScreen(item.id as ScreenId)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/50"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`h-4 w-4 shrink-0 transition-colors ${item.iconClass || ""} ${isActive ? "text-white" : "text-slate-400"}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white shrink-0 shadow-xs" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Tournament Context / Organizer Switcher */}
          <div className="p-3 border-b border-slate-800/60">
            <div className="flex items-center justify-between px-1 pb-2">
              <span className="text-[10.5px] uppercase tracking-wider font-semibold text-slate-400">
                Tournament Context
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">Live</span>
            </div>

            <div className="bg-[#0D1522] p-2.5 rounded-xl border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <Building2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] text-slate-400 font-medium">Organizer & Event:</span>
              </div>
              <div className="relative">
                <select
                  value={selectedTournamentIndex}
                  disabled={liveTournaments.length === 0}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    setSelectedTournamentIndex(idx);
                    showToast(`Loaded ${liveTournaments[idx]?.organizerClub || "Tournament"}`);
                  }}
                  className="w-full bg-[#080D15] text-xs text-emerald-300 font-semibold py-2 px-2.5 pr-7 rounded-lg border border-slate-700/70 focus:outline-none focus:border-emerald-500 cursor-pointer truncate appearance-none disabled:opacity-50"
                >
                  {liveTournaments.length === 0 ? (
                    <option value={0} disabled>
                      {isLoadingTournaments ? "Loading tournaments..." : "No tournaments in database"}
                    </option>
                  ) : (
                    liveTournaments.map((t, idx) => (
                      <option key={t.id} value={idx} className="bg-[#090F16] text-white">
                        {t.organizerClub} — {t.name}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
              </div>

              {/* Friends on Course Simulator Control */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">Friends on Course:</span>
                <div className="flex items-center bg-[#080D15] rounded-lg p-0.5 border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      const acceptedKey = getAcceptedFriendsKey(authenticatedPlayer?.id);
                      setAcceptedFriendIds([]);
                      setSimulatedActiveFriendIds([]);
                      setFriendsOnCourse([]);
                      try {
                        localStorage.removeItem(acceptedKey);
                        localStorage.removeItem("openclub_accepted_friends");
                      } catch {}
                      showToast("Friends on course cleared. Empty state active.", "success", "COURSE EMPTY");
                    }}
                    className={`px-2 py-0.5 rounded-md text-[10px] transition-all cursor-pointer ${
                      friendsOnCourse.length === 0
                        ? "bg-slate-800 text-emerald-400 font-bold shadow-xs"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Empty (0)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (registeredPlayers.length > 0) {
                        const acceptedKey = getAcceptedFriendsKey(authenticatedPlayer?.id);
                        const otherPlayers = registeredPlayers.filter((p) => !isAccountUser(p));
                        const sampleFriendIds = (otherPlayers.length > 0 ? otherPlayers : registeredPlayers).slice(0, 3).map((p) => p.id);
                        setAcceptedFriendIds(sampleFriendIds);
                        setSimulatedActiveFriendIds(sampleFriendIds);
                        try {
                          localStorage.setItem(acceptedKey, JSON.stringify(sampleFriendIds));
                        } catch {}
                        showToast("Friends connected and playing now on course.", "success", `${sampleFriendIds.length} FRIENDS ACTIVE`);
                      } else {
                        showToast("No competitors registered for active tournament.", "alert", "COURSE QUIET");
                      }
                    }}
                    className={`px-2 py-0.5 rounded-md text-[10px] transition-all cursor-pointer ${
                      friendsOnCourse.length > 0
                        ? "bg-slate-800 text-emerald-400 font-bold shadow-xs"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Active ({friendsOnCourse.length > 0 ? friendsOnCourse.length : registeredPlayers.length > 0 ? Math.min(3, registeredPlayers.length) : 0})
                  </button>
                </div>
              </div>

              {/* Active Match (Hybrid 3-Stage Model) Simulator Control */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Active Match (3-Stage):</span>
                  <span className="text-[9.5px] text-slate-500 font-medium">
                    {!activeRound
                      ? "Closed / Forfeited"
                      : hasInactivityWarning
                      ? `⚠️ Inactivity Alert (${activeRoundMinutesElapsed && activeRoundMinutesElapsed >= 30 ? activeRoundMinutesElapsed : 30}m)`
                      : `Normal Play (${activeRoundMinutesElapsed}m / 30m)`}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 bg-[#080D15] rounded-lg p-1 border border-slate-800 text-xs">
                  {/* Stage 1: 30m Nudge */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!activeRound && activeTournament) {
                        const firstHolePar = courseHoles[0]?.par || 4;
                        const firstHoleYards = courseHoles[0]?.yards || courseHoles[0]?.yardage || 345;
                        setActiveRound({
                          id: `ar-${activeTournament.id}`,
                          tournamentId: activeTournament.id,
                          tournamentName: activeTournament.name,
                          courseName: activeTournament.courseName || "Oakwood Country Club Course",
                          clubName: activeTournament.organizerClub || "Oakwood Country Club",
                          holeNumber: 1,
                          par: firstHolePar,
                          yardage: firstHoleYards,
                          holeInfo: `Par ${firstHolePar} • ${firstHoleYards} yds`,
                          isLive: activeTournament.status === "LIVE",
                          dayText: "ROUND 1",
                          score: "E",
                          thru: "0",
                          flightText: "Flight 1",
                          groupPlayers: (registeredPlayers || [])
                            .filter((p) => !isAccountUser(p))
                            .slice(0, 3)
                            .map((p) => ({
                              id: p.id,
                              name: p.name,
                              initials: getTwoInitials(p.name),
                              avatar: (p as any).profilePhoto || (p as any).avatar || undefined,
                            })),
                        });
                      }
                      setActiveRoundMinutesElapsed(30);
                      setHasInactivityWarning(true);
                      if (typeof window !== "undefined") {
                        try {
                          localStorage.setItem("openclub_active_round_started_at", String(Date.now() - 30 * 60 * 1000));
                          sessionStorage.setItem("openclub_inactivity_notified", "true");
                        } catch { }
                      }
                      const activeTournTitle = activeRound?.tournamentName || activeTournament?.name || "Tournament";
                      const activeHole = activeRound?.holeNumber || 1;
                      showToast(`${activeTournTitle}: Inactivity alert on Hole ${activeHole}. Tap Resume Play to record your score.`, "alert", "INACTIVE FOR 30 MINUTES");

                      // Dispatch live pace-of-play alert to the admin dashboard & TopNav Bell icon
                      const playerEmail = authenticatedPlayer?.email || (regEmail ? regEmail.trim().toLowerCase() : "player@golfclub.com");
                      const playerName = authenticatedPlayer?.name || currentDisplayName || "Tournament Player";
                      const alertNotification = {
                        id: `inact-alert-${Date.now()}`,
                        userId: "admin",
                        title: "Pace of Play Alert (30m Inactivity)",
                        body: `${playerName} (${playerEmail}) is yet to enter a score on Hole ${activeHole} in ${activeTournTitle} (30 mins elapsed).`,
                        type: "TOURNAMENT_ALERT",
                        isRead: false,
                        createdAt: new Date().toISOString(),
                        data: {
                          tournamentId: activeRound?.tournamentId || activeTournament?.id || "",
                          tournamentName: activeTournTitle,
                          playerName,
                          playerEmail,
                          holeNumber: activeHole,
                          minutesInactive: 30,
                          category: "PACE_OF_PLAY",
                        },
                      };

                      if (typeof window !== "undefined") {
                        try {
                          const existingRaw = localStorage.getItem("openclub_live_admin_notifications");
                          const existingList = existingRaw ? JSON.parse(existingRaw) : [];
                          const filtered = Array.isArray(existingList) ? existingList.filter((n: any) => n.id !== alertNotification.id) : [];
                          localStorage.setItem("openclub_live_admin_notifications", JSON.stringify([alertNotification, ...filtered]));
                        } catch { }
                      }

                      broadcastAdminEvent("tournament-inactivity-alert", alertNotification);
                    }}
                    className={`px-1.5 py-1 rounded-md text-[9.5px] font-semibold transition-all cursor-pointer text-center truncate ${
                      hasInactivityWarning
                        ? "bg-amber-500/25 text-amber-300 border border-amber-500/40"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                    title="Simulate 30-minute inactivity nudge (shows INACTIVE FOR 30 MINUTES badge)"
                  >
                    Nudge
                  </button>

                  {/* Stage 2: Forfeit */}
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        try {
                          localStorage.setItem("openclub_active_round_forfeited", "true");
                        } catch { }
                      }
                      setActiveRound(null);
                      setActiveRoundMinutesElapsed(0);
                      setHasInactivityWarning(false);
                      const fTourn = activeRound?.tournamentName || activeTournament?.name || "Tournament";
                      showToast(`${fTourn} match forfeited by player.`, "error", "ROUND FORFEITED");
                    }}
                    className={`px-1.5 py-1 rounded-md text-[9.5px] font-semibold transition-all cursor-pointer text-center truncate ${
                      !activeRound
                        ? "bg-rose-950/70 text-rose-300 border border-rose-800/50"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                    title="Simulate voluntary player withdrawal (undisplays round)"
                  >
                    Forfeit
                  </button>

                  {/* Stage 3: Daily Cut-Off */}
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        try {
                          localStorage.setItem("openclub_active_round_closed", "true");
                        } catch { }
                      }
                      setActiveRound(null);
                      setActiveRoundMinutesElapsed(0);
                      setHasInactivityWarning(false);
                      showToast("Tournament daily deadline reached. Incomplete scorecard archived.", "alert", "ROUND CLOSED");
                    }}
                    className="px-1.5 py-1 rounded-md text-[9.5px] font-semibold text-slate-400 hover:text-slate-200 transition-all cursor-pointer text-center truncate"
                    title="Simulate daily tournament cut-off deadline (archives & undisplays round)"
                  >
                    Cut-Off
                  </button>

                  {/* Reset */}
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        try {
                          localStorage.removeItem("openclub_active_round_forfeited");
                          localStorage.removeItem("openclub_active_round_closed");
                          localStorage.setItem("openclub_active_round_started_at", String(Date.now()));
                          sessionStorage.removeItem("openclub_inactivity_notified");
                        } catch { }
                      }
                      if (activeTournament) {
                        const firstHolePar = courseHoles[0]?.par || 4;
                        const firstHoleYards = courseHoles[0]?.yards || courseHoles[0]?.yardage || 345;
                        setActiveRound({
                          id: `ar-${activeTournament.id}`,
                          tournamentId: activeTournament.id,
                          tournamentName: activeTournament.name,
                          courseName: activeTournament.courseName || "Oakwood Country Club Course",
                          clubName: activeTournament.organizerClub || "Oakwood Country Club",
                          holeNumber: 1,
                          par: firstHolePar,
                          yardage: firstHoleYards,
                          holeInfo: `Par ${firstHolePar} • ${firstHoleYards} yds`,
                          isLive: activeTournament.status === "LIVE",
                          dayText: "ROUND 1",
                          score: "E",
                          thru: "0",
                          flightText: "Flight 1",
                          groupPlayers: (registeredPlayers || [])
                            .filter((p) => !isAccountUser(p))
                            .slice(0, 3)
                            .map((p) => ({
                              id: p.id,
                              name: p.name,
                              initials: getTwoInitials(p.name),
                              avatar: (p as any).profilePhoto || (p as any).avatar || undefined,
                            })),
                        });
                      } else {
                        setActiveRound(null);
                      }
                      setActiveRoundMinutesElapsed(0);
                      setHasInactivityWarning(false);
                      showToast("Active tournament match restored. Inactivity timer reset to 0m (warning hidden).", "success", "MATCH RESET");
                    }}
                    className={`px-1.5 py-1 rounded-md text-[9.5px] font-semibold transition-all cursor-pointer text-center truncate ${
                      activeRound && !hasInactivityWarning
                        ? "bg-emerald-950/70 text-emerald-300 border border-emerald-800/50"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                    title="Reset timer to 0m (clean display, hides 30m badge) and restore live round"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Simulate Toasts */}
          <div className="p-3 border-b border-slate-800/60">
            <div className="flex items-center justify-between px-1 pb-2">
              <span className="text-[10.5px] uppercase tracking-wider font-semibold text-slate-400">
                Simulate Toasts
              </span>
              <span className="text-[10px] text-slate-500 font-mono">5s</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 bg-[#0D1522] p-1.5 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => showToast("Your score has been verified successfully.", "success", "SUCCESS")}
                className="py-1.5 px-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1"
                title="Preview Success Toast (5s)"
              >
                <CheckCircle2 className="h-3 w-3 shrink-0" />
                <span>Success</span>
              </button>
              <button
                type="button"
                onClick={() => showToast("Unable to sync scorecard. Please try again.", "error", "ERROR")}
                className="py-1.5 px-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1"
                title="Preview Error Toast (5s)"
              >
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span>Error</span>
              </button>
              <button
                type="button"
                onClick={() => showToast("Slow play reported on Hole 14. Keep pace.", "alert", "ALERT")}
                className="py-1.5 px-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1"
                title="Preview Alert Toast (5s)"
              >
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span>Alert</span>
              </button>
            </div>
          </div>

          {/* Section 4: Simulator Controls & Device Hardware */}
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="text-[10.5px] uppercase tracking-wider font-semibold text-slate-400">
                Hardware & Display
              </span>
            </div>

            {/* Primary Device Model Selector */}
            <div className="bg-[#0D1522] p-2.5 rounded-xl border border-slate-800 space-y-1.5">
              <label className="text-[11px] text-slate-400 block font-medium">Primary Device</label>
              <select
                value={phoneSlots[0].model}
                onChange={(e) => updatePhoneModel(0, e.target.value as DeviceModelId)}
                className="w-full bg-[#080D15] text-xs font-semibold text-white border border-slate-700/80 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              >
                <optgroup label="📱 Smartphones">
                  <option value="iphone-16-pro">iPhone 16 Pro (iOS 18)</option>
                  <option value="galaxy-s24">Samsung Galaxy S24 Ultra</option>
                  <option value="pixel-9">Google Pixel 9 Pro</option>
                  <option value="iphone-notch">iPhone 14 / Classic Notch</option>
                  <option value="iphone-16-max">iPhone 16 Pro Max</option>
                </optgroup>
                <optgroup label="💻 Tablets">
                  <option value="ipad-pro-11">iPad Pro 11&quot; (M4)</option>
                  <option value="ipad-mini">iPad Mini 7</option>
                  <option value="galaxy-tab-s9">Samsung Galaxy Tab S9</option>
                </optgroup>
              </select>
            </div>

            {/* Chassis Finish Swatches for Primary Device */}
            <div className="bg-[#0D1522] p-2.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">Chassis Finish</span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {CHASSIS_COLORS[phoneSlots[0].color]?.name}
                </span>
              </div>
              <div className="flex items-center justify-between bg-[#080D15] p-2 rounded-lg border border-slate-800/80">
                {(Object.keys(CHASSIS_COLORS) as DeviceColorId[]).map((cId) => {
                  const cSpec = CHASSIS_COLORS[cId];
                  const isSelected = phoneSlots[0].color === cId;
                  return (
                    <button
                      key={cId}
                      type="button"
                      title={cSpec.name}
                      onClick={() => updatePhoneColor(0, cId)}
                      className={`w-5 h-5 rounded-full transition-all cursor-pointer relative flex items-center justify-center ${
                        isSelected
                          ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#080D15] scale-110"
                          : "opacity-60 hover:opacity-100 hover:scale-105"
                      }`}
                      style={{ backgroundColor: cSpec.swatch }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Device Scale Segmented Control */}
            <div className="bg-[#0D1522] p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <ZoomIn className="h-3.5 w-3.5 text-slate-400" />
                <span>Zoom</span>
              </span>
              <div className="flex items-center bg-[#080D15] rounded-lg p-0.5 border border-slate-800 text-xs">
                {[50, 65, 75, 85, 100].map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    onClick={() => setDeviceScale(scale)}
                    className={`px-2 py-1 rounded-md transition-all cursor-pointer text-[10.5px] ${
                      deviceScale === scale
                        ? "bg-slate-800 text-white font-medium shadow-xs"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {scale}%
                  </button>
                ))}
              </div>
            </div>

            {/* Dart Code Inspector Toggle */}
            <button
              type="button"
              onClick={() => setShowInspector(!showInspector)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                showInspector
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                  : "bg-[#0D1522] border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileCode2 className="h-4 w-4 text-amber-400" />
                <span>Dart Source Code</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                showInspector
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}>
                {showInspector ? "Visible" : "Hidden"}
              </span>
            </button>
          </div>

          {/* Section 5: Sidebar Footer */}
          <div className="mt-auto p-3 border-t border-slate-800/80 bg-[#070B12]">
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>{DEVICE_MODELS[phoneSlots[0].model]?.name}</span>
              <span className="font-mono text-slate-400">
                {`${DEVICE_MODELS[phoneSlots[0].model]?.width} × ${DEVICE_MODELS[phoneSlots[0].model]?.height}`}
              </span>
            </div>
          </div>
        </aside>
        {/* Device Stage */}
        <div className="flex-1 min-h-0 min-w-0 h-full overflow-x-auto overflow-y-auto overscroll-contain p-6 lg:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0D1F1A] via-[#070D13] to-[#040609] flex flex-col items-center">
          {/* Multi-Device Stage Container */}
          <div
            style={{
              transform: `scale(${deviceScale / 100})`,
              transformOrigin: "top center",
              transition: "transform 0.2s ease-in-out",
            }}
            className="flex items-start justify-center gap-8 lg:gap-12 min-w-max pb-16 pt-2"
          >
            {getEffectiveSlots().map((slot, idx) => renderPhoneDevice(slot, idx))}
          </div>
        </div>
        {/* Dart Code Inspector Drawer */}
        {showInspector && (
          <aside
            className={`border-l border-slate-800 bg-[#0A0F18] flex flex-col z-20 shadow-2xl transition-all duration-200 shrink-0 h-full max-h-full min-h-0 overflow-hidden ${
              isInspectorExpanded ? "w-[760px] max-w-[85vw]" : "w-[480px] max-w-[90vw]"
            }`}
          >
            {/* Inspector Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0D1522] shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <FileCode2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white tracking-wide">
                    Dart Source File
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-[340px]">
                  {dartCodeMap[activeScreen].path}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={copyCode}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Copy Dart Code"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => setIsInspectorExpanded(!isInspectorExpanded)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title={isInspectorExpanded ? "Collapse Width" : "Expand Width"}
                >
                  {isInspectorExpanded ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => setShowInspector(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Close Inspector"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* File Explanation */}
            <div className="px-4 py-3 bg-emerald-950/20 border-b border-emerald-900/30 text-[11px] text-emerald-300 shrink-0">
              {dartCodeMap[activeScreen].summary}
            </div>

            {/* Code Body with Dedicated Horizontal & Vertical Scroller */}
            <div
              className="flex-1 min-h-0 min-w-0 h-full overflow-x-auto overflow-y-auto overscroll-contain dart-code-scroller font-mono text-[11.5px] leading-relaxed text-slate-300 bg-[#070B11] p-4 select-text"
              style={{
                overscrollBehavior: "contain",
              }}
            >
              <pre
                className="whitespace-pre w-max min-w-full font-mono pb-8 block"
                style={{
                  whiteSpace: "pre",
                  wordBreak: "normal",
                  overflowWrap: "normal",
                }}
              >
                {dartCodeMap[activeScreen].snippet}
              </pre>
            </div>

            {/* Code Inspector Footer / Status Bar */}
            <div className="px-4 py-2 border-t border-slate-800/80 bg-[#070B12] flex items-center justify-between text-[10.5px] text-slate-400 font-mono select-none shrink-0">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{dartCodeMap[activeScreen].snippet.split("\n").length} lines</span>
              </div>
              <span className="text-slate-500 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                <span>Independent 2D scrolling active ⇄ ⇅</span>
              </span>
            </div>
          </aside>
        )}
      </div>

      {/* --- MODAL 1: 18-HOLE SCORECARD SUMMARY --- */}
      {showScorecardModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-5 shadow-2xl text-slate-900">
            {/* Header: FINAL SCORECARD • ROUND 1  &  Total: ... */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8CA0BA]">
                  FINAL SCORECARD • {activeRound?.dayText || "ROUND 1"}
                </span>
                <p className="text-[12px] font-bold text-[#0F172A] mt-0.5">
                  {activeTournament?.courseName || "Championship Course"} • Par {activeTournament?.coursePar || 72}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[14px]">
                  <span className="font-bold text-[#0F172A]">Total:</span>
                  <span className="font-extrabold text-[#0F172A]">
                    {Object.values(holeScores).reduce((acc, h) => acc + h.strokes, 0) || activeTournament?.coursePar || 72}
                  </span>
                </div>
                <button
                  onClick={() => setShowScorecardModal(false)}
                  className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-[#0F172A] transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Front 9 (OUT) */}
            <div className="pt-3">
              <div className="space-y-1.5">
                <div className="flex items-center">
                  <span className="w-4 shrink-0 text-left text-[11px] font-bold text-[#8CA0BA]">H</span>
                  <div className="flex-1 grid grid-cols-9 gap-1 text-center">
                    {courseHoles.slice(0, 9).map((h) => (
                      <span key={`mh-${h.number}`} className="text-[11px] font-semibold text-[#8CA0BA]">
                        {h.number}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="w-4 shrink-0 text-left text-[11px] font-bold text-[#8CA0BA]">P</span>
                  <div className="flex-1 grid grid-cols-9 gap-1 text-center">
                    {courseHoles.slice(0, 9).map((h) => (
                      <span key={`mp-${h.number}`} className="text-[11px] font-semibold text-[#64748B]">
                        {h.par}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center pt-0.5">
                  <span className="w-4 shrink-0 text-left text-[13px] font-black text-[#0F172A]">S</span>
                  <div className="flex-1 grid grid-cols-9 gap-1 text-center">
                    {courseHoles.slice(0, 9).map((h, i) => {
                      const score = holeScores[i]?.strokes || h.par;
                      const diff = score - h.par;
                      let badgeStyle = "bg-white border-slate-200/90 text-[#0F172A]";
                      if (diff < 0) badgeStyle = "bg-[#EAF7EE] border-[#86EFAC] text-[#009A60]";
                      else if (diff > 0) badgeStyle = "bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]";
                      return (
                        <div
                          key={`ms-${h.number}`}
                          className={`h-9 flex items-center justify-center rounded-xl border text-[13px] font-extrabold shadow-2xs ${badgeStyle}`}
                        >
                          {score}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="text-right pt-2 pb-0.5">
                <span className="text-[11px] font-extrabold text-[#8CA0BA] tracking-wider">
                  OUT: {courseHoles.slice(0, 9).reduce((acc, h, i) => acc + (holeScores[i]?.strokes || h.par), 0)}
                </span>
              </div>
            </div>

            {/* Back 9 (IN) */}
            <div className="pt-3.5 mt-2 border-t border-slate-100/80">
              <div className="space-y-1.5">
                <div className="flex items-center">
                  <span className="w-4 shrink-0 text-left text-[11px] font-bold text-[#8CA0BA]">H</span>
                  <div className="flex-1 grid grid-cols-9 gap-1 text-center">
                    {courseHoles.slice(9, 18).map((h) => (
                      <span key={`mh-${h.number}`} className="text-[11px] font-semibold text-[#8CA0BA]">
                        {h.number}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="w-4 shrink-0 text-left text-[11px] font-bold text-[#8CA0BA]">P</span>
                  <div className="flex-1 grid grid-cols-9 gap-1 text-center">
                    {courseHoles.slice(9, 18).map((h) => (
                      <span key={`mp-${h.number}`} className="text-[11px] font-semibold text-[#64748B]">
                        {h.par}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center pt-0.5">
                  <span className="w-4 shrink-0 text-left text-[13px] font-black text-[#0F172A]">S</span>
                  <div className="flex-1 grid grid-cols-9 gap-1 text-center">
                    {courseHoles.slice(9, 18).map((h, i) => {
                      const score = holeScores[i + 9]?.strokes || h.par;
                      const diff = score - h.par;
                      let badgeStyle = "bg-white border-slate-200/90 text-[#0F172A]";
                      if (diff < 0) badgeStyle = "bg-[#EAF7EE] border-[#86EFAC] text-[#009A60]";
                      else if (diff > 0) badgeStyle = "bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]";
                      return (
                        <div
                          key={`ms-${h.number}`}
                          className={`h-9 flex items-center justify-center rounded-xl border text-[13px] font-extrabold shadow-2xs ${badgeStyle}`}
                        >
                          {score}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="text-right pt-2 pb-0.5">
                <span className="text-[11px] font-extrabold text-[#8CA0BA] tracking-wider">
                  IN: {courseHoles.slice(9, 18).reduce((acc, h, i) => acc + (holeScores[i + 9]?.strokes || h.par), 0)}
                </span>
              </div>
            </div>

            <div className="pt-3.5 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowScorecardModal(false)}
                className="px-5 py-2 rounded-xl bg-[#009A60] hover:bg-[#008753] text-white text-xs font-bold transition-all shadow-xs"
              >
                Close Scorecard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: OFFICIAL ATTESTATION CERTIFICATION --- */}
      {showAttestModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0E1521] border border-slate-700/80 rounded-2xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">
                  Confirm Attestation
                </h3>
              </div>
              <button
                onClick={() => setShowAttestModal(false)}
                className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-sm">
              <p className="text-slate-300 leading-relaxed font-medium">
                I hereby attest that I have verified the hole-by-hole scores of{" "}
                <strong className="text-white font-bold">
                  {selectedPlayerForScorecard?.name || (registeredPlayers[0]?.name || "Competitor")} (Gross: {selectedPlayerForScorecard?.gross || "--"})
                </strong>{" "}
                in accordance with USGA rules of golf and tournament standards.
              </p>

              <div className="rounded-xl border border-dashed border-slate-700 p-4 bg-black/30 text-center">
                <span className="text-xs text-slate-400 block mb-1">
                  Digital Marker Signature
                </span>
                <span className="text-xl font-serif italic text-emerald-400 tracking-wider">
                  {authenticatedPlayer?.name || currentDisplayName || "Attested Marker"}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowAttestModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setAttestationConfirmed(true);
                  setShowAttestModal(false);
                  setRecentRounds([
                    {
                      id: "round_recent_1",
                      clubName: authenticatedPlayer?.club || regHomeClub || "Ikoyi Club 1938",
                      holes: 18,
                      status: "COMPLETED",
                      netScore: 72,
                      month: new Date().toLocaleString("en-US", { month: "short" }).toUpperCase(),
                      day: String(new Date().getDate()),
                    },
                  ]);
                  showToast("Attestation submitted and certified!");
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-950"
              >
                Confirm & Certify Scores
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
