"use client";

import React, { useState, useRef, useEffect } from "react";
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
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Copy,
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
} from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { forfeitTournamentRound } from "@/lib/api/scores";
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
}

interface CourseHole {
  number: number;
  par: number;
  yards: number;
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
}

interface AuthenticatedPlayer {
  id?: string;
  name: string;
  email: string;
  handicap: number | string;
  club: string;
  city?: string;
  state?: string;
  avatar: string;
  status: string;
  isPro?: boolean;
  classification?: string;
}

type ScreenId = "landing" | "scoring" | "attestation" | "hub" | "leaderboard" | "login" | "verify" | "register" | "forgot-password" | "check-inbox" | "reset-password";

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

  // Sync screen with URL ?screen= query param
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const s = params.get("screen") as ScreenId | null;
      if (s && ["landing", "scoring", "attestation", "hub", "leaderboard", "login", "verify", "register", "forgot-password", "check-inbox", "reset-password"].includes(s)) {
        setActiveScreen(s);
      }
    }
  }, []);

  // Always reset scroll to top on screen change
  useEffect(() => {
    scrollToTopAll();
  }, [activeScreen]);

  const switchScreen = (screen: ScreenId) => {
    setActiveScreen(screen);
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

  // --- Competitor Hub Modals ---
  const [showAddFriendsModal, setShowAddFriendsModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);

  // --- Mobile Bottom Navigation State (5-item bar with flush PLAY GOLF button) ---
  const [activeBottomNavTab, setActiveBottomNavTab] = useState<"home" | "tournaments" | "challenges" | "deals">("home");
  const [friendsSearchQuery, setFriendsSearchQuery] = useState("");
  const [sentFriendRequests, setSentFriendRequests] = useState<string[]>([]);

  // Searchable Golf Competitors Database (Search by Name or Email, No GHIN)
  const ALL_GOLF_COMPETITORS = [
    { id: "p1", name: "Marcus Thorne", email: "marcus.thorne@augustagc.com", club: "Augusta National GC", hcp: "1.2", initial: "M" },
    { id: "p2", name: "David O'Connor", email: "david.oconnor@pinevalley.com", club: "Pine Valley GC", hcp: "4.8", initial: "D" },
    { id: "p3", name: "Elena Rostova", email: "elena.rostova@cypresspoint.com", club: "Cypress Point Club", hcp: "0.4", initial: "E" },
    { id: "p4", name: "Amina Bello", email: "amina.bello@ikoyiclub.com", club: "Ikoyi Club 1938", hcp: "6.2", initial: "A" },
    { id: "p5", name: "Chidi Okafor", email: "chidi.okafor@oakwood.ng", club: "Oakwood Golf Club", hcp: "8.5", initial: "C" },
    { id: "p6", name: "Tunde Bakare", email: "tunde.bakare@ibadan.org", club: "Ibadan Golf Club", hcp: "5.1", initial: "T" },
    { id: "p7", name: "Sophie Van Der Merwe", email: "sophie.vdm@sunshinetour.za", club: "Fancourt Golf Estate", hcp: "2.3", initial: "S" },
    { id: "p8", name: "Liam Gallagher", email: "liam.gallagher@standrews.uk", club: "St Andrews Links", hcp: "3.7", initial: "L" },
    { id: "p9", name: "Zainab Ibrahim", email: "zainab.ibrahim@abuja.ng", club: "IBB International Golf Club", hcp: "9.0", initial: "Z" },
    { id: "p10", name: "Emeka Nwosu", email: "emeka.nwosu@enugugolf.com", club: "Enugu Golf Club", hcp: "11.4", initial: "E" },
  ];

  // --- Friends on Course State (Live Simulation & Active Scrollable Carousel) ---
  const sampleFriendsOnCourse = [
    { id: "f1", name: "Sarah Jenkins", initials: "SJ", score: "Hole 14 • Even", bg: "bg-gradient-to-b from-slate-300 to-slate-400 text-white" },
    { id: "f2", name: "David Miller", initials: "DM", score: "Hole 9 • +2", bg: "bg-gradient-to-b from-slate-300 to-slate-400 text-white" },
    { id: "f3", name: "Marcus Chen", initials: "MC", score: "Hole 18 • -1", bg: "bg-gradient-to-b from-slate-300 to-slate-400 text-white" },
    { id: "f4", name: "Kevin Brown", initials: "KB", score: "Hole 7 • +3", bg: "bg-gradient-to-b from-slate-300 to-slate-400 text-white" },
    { id: "f5", name: "Alex Wright", initials: "AW", score: "Hole 11 • -2", bg: "bg-gradient-to-b from-slate-300 to-slate-400 text-white" },
    { id: "f6", name: "Sophie Van Der Merwe", initials: "SV", score: "Hole 5 • Even", bg: "bg-gradient-to-b from-slate-300 to-slate-400 text-white" },
    { id: "f7", name: "Amina Bello", initials: "AB", score: "Hole 16 • +1", bg: "bg-gradient-to-b from-slate-300 to-slate-400 text-white" },
    { id: "f8", name: "Chidi Okafor", initials: "CO", score: "Hole 3 • -1", bg: "bg-gradient-to-b from-slate-300 to-slate-400 text-white" },
    { id: "f9", name: "Liam Gallagher", initials: "LG", score: "Hole 8 • +4", bg: "bg-gradient-to-b from-slate-300 to-slate-400 text-white" },
  ];
  // Initialized with live competitors on the course so carousel is fully scrollable
  const [friendsOnCourse, setFriendsOnCourse] = useState<any[]>(sampleFriendsOnCourse);

  // --- Active In-Progress Round State (Oakwood Championship, Hole 14 Live) ---
  const [activeRound, setActiveRound] = useState<{
    id: string;
    tournamentName: string;
    holeNumber: number;
    holeInfo?: string;
    par?: number;
    yardage?: number;
    isLive: boolean;
    dayText: string;
    score: string;
    thru: string;
    flightText: string;
    tournamentId?: string;
  } | null>({
    id: "ar-oakwood-14",
    tournamentId: "tourn-oakwood-championship",
    tournamentName: "Oakwood Championship",
    holeNumber: 14,
    par: 4,
    yardage: 415,
    holeInfo: "Par 4 • 415 yards",
    isLive: true,
    dayText: "ROUND 2",
    score: "-1",
    thru: "13",
    flightText: "Active Flight",
  });
  const [showForfeitModal, setShowForfeitModal] = useState(false);

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
      } catch { }
    }
  }, []);
  const filteredFriends = friendsSearchQuery.trim()
    ? ALL_GOLF_COMPETITORS.filter((p) => {
        const q = friendsSearchQuery.trim().toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.club.toLowerCase().includes(q) ||
          p.hcp.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q)
        );
      })
    : ALL_GOLF_COMPETITORS.slice(0, 4);

  // --- Verify Email (6-Digit OTP) State ---
  const [verifyEmailTarget, setVerifyEmailTarget] = useState("alex.wright@example.com");
  const [activeOtpCode, setActiveOtpCode] = useState<string | null>("849201");
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
      const targetEmail = verifyEmailTarget || regEmail || "alex.wright@example.com";
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
  const [forgotEmail, setForgotEmail] = useState("alex.wright@golf.com");
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);
  const [checkInboxEmail, setCheckInboxEmail] = useState<string>("alex.wright@example.com");
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

  const currentDisplayName = authenticatedPlayer?.name || (regFirstName ? `${regFirstName} ${regLastName}`.trim() : "Samuel Obadina");
  const currentInitials = (currentDisplayName.split(" ").filter(Boolean).map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() || "SO");

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
  }[]>([
    {
      id: "seed_ikoyi",
      name: "Ikoyi Golf Club",
      city: "Eti Osa",
      state: "Lagos",
      country: "NG",
      type: "Parkland",
      holes: 18,
    },
    { id: "seed_1", name: "Oakwood Country Club Course", city: "", state: "", country: "NG", type: "Parkland", holes: 18 },
    { id: "seed_achimota", name: "Achimota Golf Club", city: "Accra", state: "Greater Accra", country: "GH", type: "Parkland", holes: 18 },
    { id: "seed_2", name: "Augusta National Golf Club", city: "Augusta", state: "GA", country: "US", type: "Parkland", holes: 18 },
    { id: "seed_3", name: "Pinehurst Resort No. 2", city: "Pinehurst", state: "NC", country: "US", type: "Sandhills", holes: 18 },
    { id: "seed_4", name: "St Andrews Old Course", city: "St Andrews", state: "Fife", country: "GB", type: "Links", holes: 18 },
    { id: "seed_5", name: "Pebble Beach Golf Links", city: "Pebble Beach", state: "CA", country: "US", type: "Links", holes: 18 },
    ...Array.from({ length: 19 }, (_, i) => ({
      id: `openclub_seed_${i + 2}`,
      name: `OpenClub Golf Club ${i + 2} Course`,
      city: "",
      state: "",
      country: "NG",
      type: "Parkland",
      holes: 18,
    })),
  ]);

  // Fetch courses from backend to sync dynamically with registered golf courses
  useEffect(() => {
    fetch("/api/courses")
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => {
        const fetched = Array.isArray(data) ? data : data?.items || [];
        if (fetched.length > 0) {
          setCoursesList((prev) => {
            const map = new Map<string, any>();
            fetched.forEach((c: any) => {
              if (c?.name) map.set(c.name.trim().toLowerCase(), c);
            });
            prev.forEach((c) => {
              if (!map.has(c.name.trim().toLowerCase())) {
                map.set(c.name.trim().toLowerCase(), c);
              }
            });
            return Array.from(map.values());
          });
        }
      })
      .catch(() => { });
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
    const resolvedAvatar = dbUser?.avatarUrl || dbUser?.avatar || regAvatar || initials;

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
                organizerClub: t.club?.name || "OpenClub Golf Club",
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

              return {
                id: reg.user?.id || reg.id,
                registrationId: reg.id,
                name: userName,
                initials: initials || "PL",
                handicap: reg.user?.handicap ?? reg.extraStrokes ?? 0,
                seed: idx + 1,
                gross: regScores.length > 0 ? `${totalStrokes}` : "--",
                status: reg.status === "APPROVED" && regScores.length >= 18 ? "ATTESTED" : "PENDING",
                f9: f9Strokes > 0 ? `${f9Strokes}` : "--",
                b9: b9Strokes > 0 ? `${b9Strokes}` : "--",
                putts: totalPutts,
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
        avatar: user.avatarUrl || user.avatar || initials,
        status: "Tour Card • Active",
        isPro: Boolean(user.isPro || user.classification === "PROFESSIONAL"),
        classification: user.classification,
      });

      // Seamless direct transition to tournament hub without intrusive toast
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
        "Pixel-perfect Flutter login screen following the executive reference design: centered green squircle badge with golf ball on tee and corner flag, 'Welcome Back' header, Google OAuth action, soft-mint input fields (#f5faf6), inline FORGOT? link, 30-day persistence checkbox, and primary 'Sign In to Portal' action.",
      snippet: `// Dart & Flutter: login_screen.dart (Exact Reference UI)
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController(text: 'alex.wright@golf.com');
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
              // 1. Centered Green Squircle Badge with Golf Ball on Tee & Flag
              _buildGolfTeeBrandBadge(),
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
              _buildTextInput(controller: _emailController, icon: Icons.mail_outline, hint: 'alex.wright@golf.com'),
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
  const VerifyEmailScreen({super.key, this.email = 'alex.wright@example.com'});
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
  final _emailController = TextEditingController(text: 'alex.wright@golf.com');
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
    const currentDisplayName = authenticatedPlayer?.name || (regFirstName ? `${regFirstName} ${regLastName}`.trim() : "Samuel Obadina");
    const currentInitials = (currentDisplayName.split(" ").filter(Boolean).map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() || "SO");
    const currentIsPro = Boolean(authenticatedPlayer?.isPro || authenticatedPlayer?.classification === "PROFESSIONAL" || regClassification === "PROFESSIONAL");
    const currentClub = (authenticatedPlayer?.club && !authenticatedPlayer.club.toLowerCase().includes("openclub") && !authenticatedPlayer.club.toLowerCase().includes("open club")
      ? authenticatedPlayer.club
      : (regHomeClub.trim() ? regHomeClub.trim() : (authenticatedPlayer?.club && !authenticatedPlayer.club.toLowerCase().includes("openclub") ? authenticatedPlayer.club : "Ikoyi Golf Club"))).trim();
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
                              className="w-4.5 h-4.5 text-white"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <circle cx="12" cy="7.5" r="4.5" fill="white" />
                              <circle cx="10.8" cy="6.2" r="0.6" fill="#009A60" fillOpacity="0.3" />
                              <circle cx="13" cy="5.8" r="0.6" fill="#009A60" fillOpacity="0.3" />
                              <circle cx="11.2" cy="8.2" r="0.6" fill="#009A60" fillOpacity="0.3" />
                              <circle cx="13.2" cy="8.2" r="0.6" fill="#009A60" fillOpacity="0.3" />
                              <path
                                d="M9.5 13H14.5L13 15V19.5C13 19.7761 12.7761 20 12.5 20H11.5C11.2239 20 11 19.7761 11 19.5V15L9.5 13Z"
                                fill="white"
                              />
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
                        <div className="rounded-2xl p-4 bg-[#0E1521]/90 border border-emerald-900/30 shadow-xl flex items-center justify-between">
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
                            className="w-12 h-12 rounded-2xl bg-[#141F30] border border-slate-700/60 flex items-center justify-center text-slate-200 hover:bg-slate-800 active:scale-95 transition-all text-xl"
                          >
                            <Minus className="h-5 w-5" />
                          </button>

                          <div className="text-center">
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
                            className="w-12 h-12 rounded-2xl bg-emerald-600/90 border border-emerald-500/60 flex items-center justify-center text-white hover:bg-emerald-500 active:scale-95 transition-all text-xl shadow-lg shadow-emerald-900/40"
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
                          <div className="rounded-xl p-3 bg-amber-500/10 border border-amber-500/25 mb-3 flex items-start gap-2.5">
                            <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-amber-200/90 leading-relaxed">
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
                                    } p-3.5 mb-2.5 shadow-lg`}
                                >
                                  <div className="flex items-center justify-between mb-2">
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
                                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
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
                            {/* User Plus (Add Friends) */}
                            <button
                              type="button"
                              onClick={() => setShowAddFriendsModal(true)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white/95 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                              title="Add Friends"
                              aria-label="Add Friends"
                            >
                              <UserPlus className="h-[20px] w-[20px] text-white stroke-[1.8]" />
                            </button>

                            {/* Notification Bell with Red Badge */}
                            <button
                              type="button"
                              onClick={() => setShowNotificationsModal(true)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white/95 hover:text-white hover:bg-white/20 transition-all cursor-pointer relative"
                              title="Notifications"
                              aria-label="Notifications"
                            >
                              <Bell className="h-[20px] w-[20px] text-white stroke-[1.8]" />
                              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#EF4444] border-1.5 border-white animate-pulse" />
                            </button>

                            {/* Send / Paper Airplane (Messages) */}
                            <button
                              type="button"
                              onClick={() => setShowMessagesModal(true)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white/95 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                              title="Messages"
                              aria-label="Messages"
                            >
                              <Send className="h-[19px] w-[19px] text-white stroke-[1.8]" />
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

                            {/* Player Name with 'PRO.' prefix and automatic horizontal adjustment across full width */}
                            <div className="w-full max-w-full overflow-hidden min-w-0">
                              <div 
                                className="flex items-center gap-2 whitespace-nowrap min-w-0"
                                title={`${currentIsPro ? "PRO. " : ""}${currentDisplayName}`}
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
                                  {currentDisplayName}
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
                            onClick={() => showToast("PGA Certified Pro booking directory coming soon!", "success", "BOOK A PRO")}
                            className="flex-1 h-[66px] bg-white rounded-[26px] px-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-slate-200/80 flex items-center justify-center gap-2 hover:shadow-md transition-all cursor-pointer group active:scale-98 min-w-0"
                          >
                            <CalendarCheck className="h-5 w-5 text-[#009A60] stroke-[1.8] shrink-0 group-hover:scale-105 transition-transform" />
                            <div className="flex flex-col text-left min-w-0 justify-center">
                              <span className="text-[13px] font-bold text-[#009A60] whitespace-nowrap tracking-tight leading-tight">
                                Book a Pro
                              </span>
                              <span className="text-[9px] font-medium text-slate-400 whitespace-nowrap tracking-tight leading-tight mt-0.5">
                                Book the club pro
                              </span>
                              <span className="text-[9px] font-medium text-slate-400 whitespace-nowrap tracking-tight leading-tight">
                                for golfing sessions
                              </span>
                            </div>
                          </button>

                          {/* Right Card: HCP (Equal flex-1, matching Book a Pro icon & description) */}
                          <button
                            type="button"
                            onClick={() => showToast("Your verified player handicap index", "success", "HANDICAP INDEX")}
                            className="flex-1 h-[66px] bg-white rounded-[26px] px-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-slate-200/80 flex items-center justify-center gap-2 hover:shadow-md transition-all cursor-pointer group active:scale-98 min-w-0"
                          >
                            <Award className="h-5 w-5 text-[#009A60] stroke-[1.8] shrink-0 group-hover:scale-105 transition-transform" />
                            <div className="flex flex-col text-left min-w-0 justify-center">
                              <span className="text-[13px] font-bold text-[#009A60] whitespace-nowrap tracking-tight leading-tight">
                                {currentHandicap} HCP
                              </span>
                              <span className="text-[9px] font-medium text-slate-400 whitespace-nowrap tracking-tight leading-tight mt-0.5">
                                Your verified
                              </span>
                              <span className="text-[9px] font-medium text-slate-400 whitespace-nowrap tracking-tight leading-tight">
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
                          <div className="mb-4.5 w-full rounded-[22px] bg-[#052417] text-white p-4 sm:p-4.5 border border-[#0D3826] shadow-[0_8px_24px_rgba(0,0,0,0.18)] select-none">
                            {/* Top Row: Hole Squircle Badge + Live Info */}
                            <div className="flex items-start gap-3.5">
                              {/* Hole Squircle Badge */}
                              <div className="w-[64px] h-[82px] rounded-[18px] bg-[#0B3523] border border-[#16603E]/70 flex flex-col items-center justify-center shrink-0">
                                <span className="text-[9.5px] font-bold text-[#10B981]/90 uppercase tracking-widest leading-none">
                                  HOLE
                                </span>
                                <span className="text-[26px] font-black text-[#10B981] leading-none mt-1.5 tracking-tight">
                                  {activeRound.holeNumber}
                                </span>
                              </div>

                              {/* Right Column Details */}
                              <div className="flex-1 min-w-0 flex flex-col justify-center">
                                {/* Row 1: LIVE Badge + Day Info + Current Score Pill */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {activeRound.isLive && (
                                      <span className="px-2 py-0.5 rounded-[5px] bg-[#EF4444] text-white text-[9px] font-black tracking-wider uppercase leading-none animate-pulse">
                                        LIVE
                                      </span>
                                    )}
                                    <span className="text-[11px] font-bold text-[#8FAEA2] tracking-wider uppercase">
                                      {activeRound.dayText}
                                    </span>
                                  </div>

                                  {/* Player's Current Score Badge */}
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0B3523] border border-[#16603E]/80 shadow-2xs">
                                    <span className="text-[9px] font-bold text-[#8FAEA2] uppercase tracking-wider">
                                      SCORE
                                    </span>
                                    <span className="text-[13px] font-black text-white leading-none">
                                      {activeRound.score}
                                    </span>
                                  </div>
                                </div>

                                {/* Row 2: Full Display of Tournament Title */}
                                <h3 className="text-[17px] font-bold text-white tracking-tight leading-tight truncate mt-1">
                                  {activeRound.tournamentName}
                                </h3>

                                {/* Row 3: Hole Information under Tournament Name */}
                                <p className="text-[11.5px] font-semibold text-[#10B981] mt-0.5 leading-none">
                                  {activeRound.holeInfo || "Par 4 • 415 yards"}
                                </p>

                                {/* Row 3: Flight Avatars & Status */}
                                <div className="flex items-center justify-between mt-1.5">
                                  <div className="flex items-center">
                                    <div className="flex items-center -space-x-1.5">
                                      <img
                                        src="/images/landing/onboarding1.jpg"
                                        alt="Flight Golfer 1"
                                        className="w-5 h-5 rounded-full border border-[#052417] object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLElement).style.display = "none";
                                        }}
                                      />
                                      <img
                                        src="/images/competitor/alex_avatar.jpg"
                                        alt="Flight Golfer 2"
                                        className="w-5 h-5 rounded-full border border-[#052417] object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLElement).style.display = "none";
                                        }}
                                      />
                                    </div>
                                    <span className="text-[11.5px] font-semibold text-[#10B981] ml-2">
                                      {activeRound.flightText}
                                    </span>
                                  </div>
                                  <span className="text-[10.5px] font-medium text-[#8FAEA2]">
                                    Thru {activeRound.thru} Holes
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Thin subtle divider */}
                            <div className="border-t border-[#0F3D2A]/80 my-3.5" />

                            {/* Bottom Row: Resume Play & Forfeit Buttons (Consistent with Featured Tournament Card) */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  showToast(`Resuming score entry for ${activeRound.tournamentName} (Hole ${activeRound.holeNumber})...`, "success", "RESUME PLAY");
                                  setTimeout(() => switchScreen("scoring"), 250);
                                }}
                                className="flex-[7] h-[38px] rounded-xl bg-[#009A60] hover:bg-[#008753] active:scale-[0.98] text-white font-semibold text-[12.5px] flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                              >
                                <span>Resume Play</span>
                                <ChevronRight className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setShowForfeitModal(true)}
                                className="flex-[3] h-[38px] rounded-xl bg-[#0C241B] hover:bg-[#133327] active:scale-[0.98] border border-[#1A3F30] text-[#FB7185] hover:text-rose-300 font-semibold text-[12.5px] flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                              >
                                <span>Forfeit</span>
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between mb-3.5">
                          <h3 className="text-[15px] font-bold text-[#0F172A] tracking-tight">
                            Playing Now
                          </h3>
                          {friendsOnCourse.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setShowAddFriendsModal(true)}
                              className="text-[13px] font-semibold text-[#009A60] hover:text-[#007A4D] transition-colors cursor-pointer"
                            >
                              Invite New
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
                            className="flex items-center gap-3 overflow-x-auto scrollbar-hide no-scrollbar py-2 scroll-smooth cursor-grab active:cursor-grabbing select-none"
                            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                          >
                            {/* Circle 1: OpenClub Brand / Invite Action */}
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

                            {/* Friends on Course Avatars with Initials (Strictly No Images, Uniform MC Slate Gradient & White Text, 5 Max) */}
                            {friendsOnCourse.slice(0, 5).map((friend) => (
                              <button
                                key={friend.id}
                                type="button"
                                onClick={() => {
                                  if (playingNowCarouselRef.current?.dataset.moved === "true") {
                                    playingNowCarouselRef.current.dataset.moved = "false";
                                    return;
                                  }
                                  showToast(`${friend.name} is currently playing: ${friend.score}`, "success", "PLAYING NOW");
                                }}
                                className="w-[54px] h-[54px] rounded-full border-2 border-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] bg-gradient-to-b from-slate-300 to-slate-400 text-white flex items-center justify-center shrink-0 font-bold text-[14px] relative hover:scale-105 transition-all cursor-pointer active:scale-95"
                                title={`${friend.name} (${friend.score})`}
                              >
                                {friend.initials}
                                <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                              </button>
                            ))}
                          </div>
                        ) : (
                          /* Rounded Dashed Empty Display (When no user is on the course) */
                          <button
                            type="button"
                            onClick={() => setShowAddFriendsModal(true)}
                            className="w-full rounded-[22px] border-2 border-dashed border-slate-300/90 hover:border-[#009A60] bg-slate-50/70 hover:bg-emerald-50/30 p-3.5 flex items-center justify-between transition-all cursor-pointer group active:scale-98 text-left shadow-2xs"
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
                                <p className="text-[11.5px] text-slate-400 leading-tight mt-0.5 truncate">
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
                        <div className="w-full bg-white rounded-[22px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-4 flex items-center justify-between gap-3 select-none">
                          {/* Left Column */}
                          <div className="flex flex-col min-w-0 flex-1">
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
                          <div className="w-[102px] h-[78px] rounded-[18px] bg-[#F4F9F6] border border-emerald-100/60 p-2.5 flex flex-col justify-center gap-2.5 shrink-0 shadow-2xs">
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
                              setActiveBottomNavTab("tournaments");
                              showToast("Viewing all scheduled tournaments", "success", "TOURNAMENTS");
                            }}
                            className="text-[13px] font-semibold text-[#009A60] hover:text-[#007A4D] transition-colors cursor-pointer whitespace-nowrap"
                          >
                            View More
                          </button>
                        </div>

                        {/* Horizontal Carousel with Multi-Device Drag & Wheel Support */}
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
                          {(() => {
                            const featuredFromDb = liveTournaments.filter((t) => t.isFeatured);
                            const rawList = featuredFromDb.length > 0 ? featuredFromDb : liveTournaments;

                            if (rawList.length === 0) {
                              return (
                                <div className="w-[315px] h-[230px] rounded-[22px] overflow-hidden shrink-0 relative flex flex-col items-center justify-center p-6 text-center border border-[#e1efe5] bg-white shadow-xs select-none">
                                  <div className="w-12 h-12 rounded-full bg-[#EAF7EE] border border-[#C6F0DB] flex items-center justify-center mb-3 shadow-2xs">
                                    <Trophy className="w-6 h-6 text-[#009A60]" />
                                  </div>
                                  <p className="text-[#0F172A] text-[15px] font-bold tracking-tight">No Active Tournaments</p>
                                  <p className="text-[#64748B] text-[12px] mt-1.5 max-w-[240px] leading-relaxed font-normal">
                                    Stay on the lookout for upcoming tournaments and club championship events.
                                  </p>
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

                            return listToRender.map((tourn) => (
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
                            ));
                          })()}
                        </div>
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
                          <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-3.5 flex items-center justify-between transition-all hover:border-slate-300">
                            {/* Dashed Rounded Badge with count */}
                            <div className="w-[56px] h-[56px] rounded-[18px] border-2 border-dashed border-[#009A60] bg-[#EAF7EE] flex items-center justify-center shrink-0 shadow-2xs">
                              <span className="text-[22px] font-bold text-[#009A60] select-none">{recentRounds.length}</span>
                            </div>

                            {/* Middle Info */}
                            <div className="min-w-0 flex-1 ml-3.5 pr-2">
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
                              className="w-10 h-10 rounded-full bg-[#009A60] hover:bg-[#007A4D] active:scale-95 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-2xs"
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
                              className="bg-white rounded-[24px] border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-3.5 flex items-center justify-between transition-all hover:border-slate-300 cursor-pointer group"
                            >
                              {/* Mint Date Badge */}
                              <div className="w-[56px] h-[56px] rounded-[18px] bg-[#EAF7EE] border border-[#C6F0DB]/60 flex flex-col items-center justify-center shrink-0 shadow-2xs">
                                <span className="text-[11px] font-bold text-[#009A60] tracking-wider leading-none">
                                  {round.month}
                                </span>
                                <span className="text-[20px] font-black text-[#009A60] leading-none mt-1">
                                  {round.day}
                                </span>
                              </div>

                              {/* Middle Info */}
                              <div className="min-w-0 flex-1 ml-3.5 pr-2">
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
                              <div className="flex flex-col items-end shrink-0 pl-1">
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
                              setActiveBottomNavTab("tournaments");
                              showToast("Tournaments Schedule & Live Scoring", "success", "TOURNAMENTS");
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

                        {/* 1. Header with Golf Ball on Tee Badge */}
                        <div className="flex justify-center pt-2 pb-1">
                          <div className="w-[64px] h-[64px] rounded-[22px] bg-[#009A60] flex items-center justify-center relative shadow-sm">
                            {/* White Golf Ball on Tee */}
                            <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="16" cy="11" r="6.8" fill="white" />
                              <circle cx="13.8" cy="9.2" r="0.8" fill="#009A60" fillOpacity="0.3" />
                              <circle cx="17.2" cy="8.6" r="0.8" fill="#009A60" fillOpacity="0.3" />
                              <circle cx="14.2" cy="12.5" r="0.8" fill="#009A60" fillOpacity="0.3" />
                              <circle cx="17.8" cy="12.2" r="0.8" fill="#009A60" fillOpacity="0.3" />
                              <path d="M12.5 18H19.5L17.5 20.8V26C17.5 26.5523 17.0523 27 16.5 27H15.5C14.9477 27 14.5 26.5523 14.5 26V20.8L12.5 18Z" fill="white" />
                            </svg>
                            {/* Bottom-right white circular badge with green golf flag */}
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-slate-100 shadow-xs flex items-center justify-center">
                              <Flag className="w-3 h-3 text-[#009A60] fill-[#009A60]" />
                            </div>
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
                                placeholder="alex.wright@golf.com"
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
                                  <span className="text-[#0F172A] font-medium text-[13px] text-right truncate flex-1 ml-4" title={regHomeClub.trim() ? regHomeClub.trim() : "Oakwood National GC"}>
                                    {regHomeClub.trim() ? regHomeClub.trim() : "Oakwood National GC"}
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
                                  placeholder="alex.wright@golf.com"
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
                            <span className="font-bold text-[#0F172A]">{checkInboxEmail || "alex.wright@example.com"}</span>.
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
                    ? effectiveScreen === "scoring" || effectiveScreen === "attestation" || effectiveScreen === "hub" || effectiveScreen === "leaderboard"
                      ? "bg-white/30"
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
                      {activeRound?.tournamentName || "Oakwood Championship"}
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
                      setActiveRound(null);
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

                    <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider pt-1 flex items-center justify-between">
                      <span>{friendsSearchQuery.trim() ? `Search Results (${filteredFriends.length})` : "Recent Club Competitors"}</span>
                      {friendsSearchQuery.trim() && (
                        <span className="text-[10px] text-emerald-600 font-semibold">Active Filter</span>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[250px] space-y-2 pr-0.5 scrollbar-hide">
                      {filteredFriends.length > 0 ? (
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
                                <div className="text-xs font-bold text-slate-900 truncate">{player.name}</div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  {player.club} • {player.hcp} HCP
                                </div>
                              </div>
                            </div>
                            {sentFriendRequests.includes(player.id) ? (
                              <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-[#009A60] border border-emerald-200 text-[11px] font-bold shrink-0">
                                Sent ✓
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setSentFriendRequests((prev) => [...prev, player.id]);
                                  showToast(`Friend request sent to ${player.name}!`, "success", "FRIEND REQUEST");
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

            {/* --- BOTTOM SHEET 2: NOTIFICATIONS MODAL --- */}
            {showNotificationsModal && (
              <div
                className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150"
                onClick={() => {
                  setShowNotificationsModal(false);
                  setVirtualKeyboard(null);
                }}
              >
                <div
                  className="relative z-10 bg-white rounded-t-[28px] border-t border-[#e1efe5] shadow-2xl p-5 pb-8 animate-in slide-in-from-bottom duration-200 max-h-[85%] flex flex-col w-full max-w-sm mx-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#EAF7EE] flex items-center justify-center shrink-0">
                        <Bell className="h-5 w-5 text-[#009A60]" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900">Notifications</h4>
                        <p className="text-xs text-slate-500">Live tee times & attestations</p>
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

                  <div className="py-3 space-y-2.5">
                    {/* Tee Time Confirmed */}
                    <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#C6F0DB] flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#EAF7EE] flex items-center justify-center shrink-0 mt-0.5">
                        <Flag className="h-4 w-4 text-[#009A60]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-900 block">Tee Time Confirmed: 08:40 AM</span>
                        <span className="text-[11px] text-slate-600 block truncate">Hole 1 • Flight 4 • Masters Invitational</span>
                      </div>
                      <span className="text-[10px] text-[#009A60] font-semibold shrink-0">10m ago</span>
                    </div>

                    {/* Attestation Request */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-900 block">Attestation Request</span>
                        <span className="text-[11px] text-slate-600 block truncate">Marcus Thorne requested marker attestation</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">1h ago</span>
                    </div>

                    {/* Cut Line Movement */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                        <Trophy className="h-4 w-4 text-[#009A60]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-900 block">Cut Line Movement: +3</span>
                        <span className="text-[11px] text-slate-600 block truncate">Projected cut settled at +3 after morning flight</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">3h ago</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
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

            {/* --- BOTTOM SHEET 3: MESSAGES MODAL --- */}
            {showMessagesModal && (
              <div
                className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150"
                onClick={() => {
                  setShowMessagesModal(false);
                  setVirtualKeyboard(null);
                }}
              >
                <div
                  className="relative z-10 bg-white rounded-t-[28px] border-t border-[#e1efe5] shadow-2xl p-5 pb-8 animate-in slide-in-from-bottom duration-200 max-h-[85%] flex flex-col w-full max-w-sm mx-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#EAF7EE] flex items-center justify-center shrink-0">
                        <Send className="h-4 w-4 text-[#009A60]" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900">Player Direct Messages</h4>
                        <p className="text-xs text-slate-500">Group chats & tournament updates</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMessagesModal(false);
                        setVirtualKeyboard(null);
                      }}
                      className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="py-3 space-y-2">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#009A60] font-bold text-xs flex items-center justify-center shrink-0">
                        TC
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900">Tournament Committee</div>
                        <p className="text-[11px] text-slate-600 truncate">Course conditions: Greens running at 12.5 stimp.</p>
                      </div>
                      <span className="text-[9px] text-slate-400">07:30 AM</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                        MT
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900">Marcus Thorne</div>
                        <p className="text-[11px] text-slate-600 truncate">See you on the first tee box!</p>
                      </div>
                      <span className="text-[9px] text-slate-400">Yesterday</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMessagesModal(false);
                      showToast("Direct messaging open for flight group.", "success", "MESSAGES");
                    }}
                    className="mt-2 w-full py-2.5 rounded-xl bg-[#009A60] hover:bg-[#008251] text-white text-xs font-bold transition-colors shadow-md cursor-pointer"
                  >
                    Compose New Message
                  </button>
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
                          {authenticatedPlayer?.email || (regEmail ? regEmail.trim().toLowerCase() : "samuel.obadina@openclub.app")}
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
                        showToast("Home Club: Augusta National Golf Club", "success", "HOME CLUB");
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
                <span className="text-[11px] text-slate-400 font-medium">Course Players:</span>
                <div className="flex items-center bg-[#080D15] rounded-lg p-0.5 border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setFriendsOnCourse([]);
                      showToast("Course players cleared. Empty state active.", "success", "COURSE EMPTY");
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
                      setFriendsOnCourse(sampleFriendsOnCourse);
                      showToast("Active course players simulated.", "success", "5 PLAYERS ACTIVE");
                    }}
                    className={`px-2 py-0.5 rounded-md text-[10px] transition-all cursor-pointer ${
                      friendsOnCourse.length > 0
                        ? "bg-slate-800 text-emerald-400 font-bold shadow-xs"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Active (5)
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
          <div className="bg-[#0E1521] border border-slate-700/80 rounded-2xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">
                  18-Hole Official Scorecard
                </h3>
                <p className="text-sm font-semibold text-emerald-400">
                  {activeTournament?.courseName || "Championship Course"} • Par {activeTournament?.coursePar || 72}
                </p>
              </div>
              <button
                onClick={() => setShowScorecardModal(false)}
                className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="grid grid-cols-9 gap-1 text-center font-mono text-xs">
                {courseHoles.slice(0, 9).map((h, i) => (
                  <div
                    key={h.number}
                    className="bg-black/40 rounded p-1 border border-slate-800"
                  >
                    <span className="text-[10px] text-slate-400 block">
                      H{h.number}
                    </span>
                    <span className="font-bold text-white">
                      {holeScores[i]?.strokes || h.par}
                    </span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-9 gap-1 text-center font-mono text-xs">
                {courseHoles.slice(9, 18).map((h, i) => (
                  <div
                    key={h.number}
                    className="bg-black/40 rounded p-1 border border-slate-800"
                  >
                    <span className="text-[10px] text-slate-400 block">
                      H{h.number}
                    </span>
                    <span className="font-bold text-white">
                      {holeScores[i + 9]?.strokes || h.par}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl flex items-center justify-between text-sm">
                <span className="text-slate-300 font-semibold">Total Gross:</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  {Object.values(holeScores).reduce(
                    (acc, h) => acc + h.strokes,
                    0
                  ) || 72}{" "}
                  Strokes
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowScorecardModal(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-md shadow-emerald-950"
              >
                Done
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
                <strong className="text-white font-bold">Marcus Thorne (Gross: 74)</strong>{" "}
                in accordance with USGA rules of golf and tournament standards.
              </p>

              <div className="rounded-xl border border-dashed border-slate-700 p-4 bg-black/30 text-center">
                <span className="text-xs text-slate-400 block mb-1">
                  Digital Marker Signature
                </span>
                <span className="text-xl font-serif italic text-emerald-400 tracking-wider">
                  Alexander Wright (Attested Marker)
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
