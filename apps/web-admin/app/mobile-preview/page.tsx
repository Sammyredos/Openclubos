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
  Sliders,
  Maximize2,
  Minimize2,
  Building2,
  AlertTriangle,
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
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

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
  registeredPlayers: {
    id: string;
    name: string;
    initials: string;
    handicap: number;
    seed: number;
    gross: string;
    status: "ATTESTED" | "PENDING";
    f9: string;
    b9: string;
    putts: number;
  }[];
}

// Seeded Real Organizer Tournaments (Oakwood Country Club, Augusta, Pinehurst, St Andrews)
const REAL_ORGANIZER_TOURNAMENTS: RealTournament[] = [
  {
    id: "tourn_oakwood_1",
    name: "Oakwood Country Club Championship 2026",
    status: "LIVE",
    organizerClub: "Oakwood Country Club",
    organizerCity: "Augusta, GA",
    courseName: "Oakwood Championship Course",
    coursePar: 72,
    courseHoles: 18,
    format: "Stroke Play",
    dates: "Sep 2 - Sep 5",
    purse: "$1,250,000",
    entryFee: "$250",
    fieldCount: 48,
    cutLine: "Top 30 + Ties",
    weather: "74°F Sunny • 6mph NW",
    stimp: "12.5 Stimp",
    registeredPlayers: [
      {
        id: "p1",
        name: "Alex Wright",
        initials: "AW",
        handicap: 2.4,
        seed: 4,
        gross: "71 (-1)",
        status: "ATTESTED",
        f9: "35 (-1)",
        b9: "36 (E)",
        putts: 28,
      },
      {
        id: "p2",
        name: "Marcus Thorne",
        initials: "MT",
        handicap: 4.8,
        seed: 12,
        gross: "74 (+2)",
        status: "PENDING",
        f9: "37 (+1)",
        b9: "37 (+1)",
        putts: 31,
      },
      {
        id: "p3",
        name: "Julian Sterling",
        initials: "JS",
        handicap: 0.2,
        seed: 1,
        gross: "69 (-3)",
        status: "ATTESTED",
        f9: "34 (-2)",
        b9: "35 (-1)",
        putts: 26,
      },
      {
        id: "p4",
        name: "David Silva",
        initials: "DS",
        handicap: 5.1,
        seed: 16,
        gross: "75 (+3)",
        status: "PENDING",
        f9: "38 (+2)",
        b9: "37 (+1)",
        putts: 32,
      },
    ],
  },
  {
    id: "tourn_openclub_invitational",
    name: "OpenClub Masters Invitational",
    status: "LIVE",
    organizerClub: "Augusta Golf Association",
    organizerCity: "Augusta, GA",
    courseName: "Augusta National Golf Club",
    coursePar: 72,
    courseHoles: 18,
    format: "Stroke Play",
    dates: "Sep 2 - Sep 5",
    purse: "$2,500,000",
    entryFee: "$500",
    fieldCount: 54,
    cutLine: "Top 35 + Ties",
    weather: "72°F Fair • 8mph NE",
    stimp: "13.0 Stimp",
    registeredPlayers: [
      {
        id: "p1",
        name: "Julian Sterling",
        initials: "JS",
        handicap: 0.2,
        seed: 1,
        gross: "69 (-3)",
        status: "ATTESTED",
        f9: "34 (-2)",
        b9: "35 (-1)",
        putts: 26,
      },
      {
        id: "p2",
        name: "Alex Wright",
        initials: "AW",
        handicap: 2.4,
        seed: 4,
        gross: "71 (-1)",
        status: "ATTESTED",
        f9: "35 (-1)",
        b9: "36 (E)",
        putts: 28,
      },
    ],
  },
  {
    id: "tourn_pinehurst_open",
    name: "Pinehurst Autumn Club Open",
    status: "REGISTRATION_OPEN",
    organizerClub: "Pinehurst Country Club",
    organizerCity: "Pinehurst, NC",
    courseName: "Pinehurst Resort No. 2",
    coursePar: 70,
    courseHoles: 18,
    format: "Stableford",
    dates: "Sep 18 - Sep 20",
    purse: "$500,000",
    entryFee: "$150",
    fieldCount: 72,
    cutLine: "Top 40",
    weather: "68°F Clear • 5mph S",
    stimp: "11.8 Stimp",
    registeredPlayers: [
      {
        id: "p1",
        name: "Liam O'Connor",
        initials: "LO",
        handicap: 3.1,
        seed: 7,
        gross: "72 (E)",
        status: "ATTESTED",
        f9: "36 (E)",
        b9: "36 (E)",
        putts: 29,
      },
    ],
  },
  {
    id: "tourn_standrews_links",
    name: "St Andrews Links Heritage Trophy",
    status: "UPCOMING",
    organizerClub: "Old Course Trust",
    organizerCity: "St Andrews, Scotland",
    courseName: "St Andrews Old Course",
    coursePar: 72,
    courseHoles: 18,
    format: "Stroke Play",
    dates: "Oct 5 - Oct 8",
    purse: "$1,800,000",
    entryFee: "$350",
    fieldCount: 84,
    cutLine: "Top 45",
    weather: "58°F Breezy • 14mph E",
    stimp: "10.5 Stimp",
    registeredPlayers: [
      {
        id: "p1",
        name: "Alexander Wright",
        initials: "AW",
        handicap: 2.4,
        seed: 4,
        gross: "71 (-1)",
        status: "ATTESTED",
        f9: "35 (-1)",
        b9: "36 (E)",
        putts: 28,
      },
    ],
  },
];

// Registered Players in the System (Only these players can access Mobile App)
const REAL_PLAYERS = [
  {
    name: "Alex Wright",
    email: "alex.wright@player.openclub.os",
    handicap: 2.4,
    club: "Oakwood Country Club",
    avatar: "AW",
    status: "Tour Card • Active",
  },
  {
    name: "Julian Sterling",
    email: "julian.sterling@player.openclub.os",
    handicap: "+1.2",
    club: "Augusta Golf Association",
    avatar: "JS",
    status: "Scratch Golfer • Active",
  },
  {
    name: "David Silva",
    email: "david.silva@player.openclub.os",
    handicap: 8.0,
    club: "Pinehurst Country Club",
    avatar: "DS",
    status: "Member Golfer • Active",
  },
  {
    name: "Marcus Thorne",
    email: "marcus.thorne@player.openclub.os",
    handicap: 4.8,
    club: "Oakwood Country Club",
    avatar: "MT",
    status: "Amateur Seed #12",
  },
];

// Organizer / Admin Accounts (Attempting to sign in with these MUST be blocked on Mobile)
const ORGANIZER_ADMIN_TEST_ACCOUNTS = [
  {
    name: "Oakwood Admin (Club Organizer)",
    email: "admin@oakwood.com",
    role: "CLUB_ADMIN",
    club: "Oakwood Country Club",
  },
  {
    name: "Samuel Obadina (Super Admin)",
    email: "superadmin@openclub.os",
    role: "SUPER_ADMIN",
    club: "Platform HQ",
  },
];

// Mock 18-hole golf course specifications
const HOLE_DATA = [
  { number: 1, par: 4, yards: 395, hcp: 5 },
  { number: 2, par: 4, yards: 412, hcp: 7 },
  { number: 3, par: 3, yards: 178, hcp: 15 },
  { number: 4, par: 5, yards: 535, hcp: 1 },
  { number: 5, par: 4, yards: 420, hcp: 9 },
  { number: 6, par: 4, yards: 388, hcp: 11 },
  { number: 7, par: 3, yards: 192, hcp: 17 },
  { number: 8, par: 5, yards: 545, hcp: 3 },
  { number: 9, par: 4, yards: 405, hcp: 13 },
  { number: 10, par: 4, yards: 418, hcp: 6 },
  { number: 11, par: 4, yards: 390, hcp: 8 },
  { number: 12, par: 3, yards: 165, hcp: 16 },
  { number: 13, par: 5, yards: 510, hcp: 2 },
  { number: 14, par: 4, yards: 432, hcp: 4 },
  { number: 15, par: 4, yards: 380, hcp: 12 },
  { number: 16, par: 3, yards: 205, hcp: 18 },
  { number: 17, par: 4, yards: 440, hcp: 10 },
  { number: 18, par: 5, yards: 520, hcp: 14 },
];

type ScreenId = "scoring" | "attestation" | "hub" | "leaderboard" | "login" | "verify" | "register";

export default function MobilePreviewPage() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>("verify");
  const [showInspector, setShowInspector] = useState(false);
  const [deviceScale, setDeviceScale] = useState<number>(100);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Default Scroll Reset Refs
  const phoneContentScrollRef = useRef<HTMLDivElement>(null);
  const regScrollRef = useRef<HTMLDivElement>(null);

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
      if (s && ["scoring", "attestation", "hub", "leaderboard", "login", "verify", "register"].includes(s)) {
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

  // --- Real Organizer Tournaments State ---
  const [liveTournaments, setLiveTournaments] = useState<RealTournament[]>(REAL_ORGANIZER_TOURNAMENTS);
  const [selectedTournamentIndex, setSelectedTournamentIndex] = useState(0);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(false);
  const activeTournament = liveTournaments[selectedTournamentIndex] || REAL_ORGANIZER_TOURNAMENTS[0];

  // --- Real Player Authentication State ---
  const [loginEmail, setLoginEmail] = useState("superadmin@openclub.os");
  const [loginPassword, setLoginPassword] = useState("Password123!");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authenticatedPlayer, setAuthenticatedPlayer] = useState(REAL_PLAYERS[0]);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // --- Verify Email (6-Digit OTP) State ---
  const [verifyEmailTarget, setVerifyEmailTarget] = useState("alex.wright@example.com");
  const [otpDigits, setOtpDigits] = useState<string[]>(["8", "4", "9", "2", "0", "1"]);
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

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newDigits = [...otpDigits];
      digits.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setOtpDigits(newDigits);
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-box-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-box-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifySubmit = async () => {
    const code = otpDigits.join("");
    if (code.length < 6) {
      setVerifyError("Please enter all 6 digits of your security code.");
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);
    try {
      const res = await fetch("http://localhost:3001/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: code }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVerifySuccess(true);
        showToast("Email verified successfully! Competitor profile activated.");
        setTimeout(() => setActiveScreen("hub"), 1200);
      } else {
        setVerifyError(data.message || "Invalid or expired verification code.");
      }
    } catch {
      setVerifySuccess(true);
      showToast("Email verified! Competitor profile activated.");
      setTimeout(() => setActiveScreen("hub"), 1200);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    try {
      setResendCooldown(59);
      setVerifyError(null);
      await fetch("http://localhost:3001/api/auth/preview-otp-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: verifyEmailTarget,
          name: "Alex Wright",
          otpCode: "849201",
        }),
      });
      showToast("Fresh 6-digit code dispatched to Mailpit!");
    } catch {
      showToast("New 6-digit security code sent.");
    }
  };

  // --- Registration Wizard State (Steps 1 - 4) ---
  const [regStep, setRegStep] = useState<1 | 2 | 3 | 4>(1);

  // Always reset scroll to top on registration step change
  useEffect(() => {
    scrollToTopAll();
  }, [regStep]);

  const [regFirstName, setRegFirstName] = useState("Alex");
  const [regLastName, setRegLastName] = useState("Wright");
  const [regEmail, setRegEmail] = useState("player@domain.com");
  const [regPassword, setRegPassword] = useState("Password123!");
  const [regConfirmPassword, setRegConfirmPassword] = useState("Password123!");
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regShowConfirm, setRegShowConfirm] = useState(false);

  // Step 2
  const [regHandicap, setRegHandicap] = useState("2.4");
  const [regNoHandicap, setRegNoHandicap] = useState(false);
  const [regHomeClub, setRegHomeClub] = useState("");
  const [regGender, setRegGender] = useState<"MALE" | "FEMALE">("MALE");
  const [regDob, setRegDob] = useState("05 / 14 / 1994");
  const [showClubSuggestions, setShowClubSuggestions] = useState(false);
  const clubDropdownRef = useRef<HTMLDivElement>(null);
  const [showDobCalendar, setShowDobCalendar] = useState(false);
  const dobCalendarRef = useRef<HTMLDivElement>(null);
  const [dobCalendarMonth, setDobCalendarMonth] = useState<Date>(() => new Date(1994, 4, 14));
  const [showClubModal, setShowClubModal] = useState(false);
  const [clubSearchQuery, setClubSearchQuery] = useState("");
  const [coursesList, setCoursesList] = useState<{
    id: string;
    name: string;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    type?: string | null;
    holes?: number | null;
  }[]>([
    { id: "seed_1", name: "Oakwood Country Club Course", city: "Augusta", state: "GA", country: "US", type: "Parkland", holes: 18 },
    { id: "seed_2", name: "Augusta National Golf Club", city: "Augusta", state: "GA", country: "US", type: "Parkland", holes: 18 },
    { id: "seed_3", name: "Pinehurst Resort No. 2", city: "Pinehurst", state: "NC", country: "US", type: "Sandhills", holes: 18 },
    { id: "seed_4", name: "St Andrews Old Course", city: "St Andrews", state: "Fife", country: "GB", type: "Links", holes: 18 },
    { id: "seed_5", name: "Pebble Beach Golf Links", city: "Pebble Beach", state: "CA", country: "US", type: "Links", holes: 18 },
    ...Array.from({ length: 19 }, (_, i) => ({
      id: `openclub_seed_${i + 2}`,
      name: `OpenClub Golf Club ${i + 2} Course`,
      city: `City ${i + 2}`,
      state: "State",
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
      .catch(() => {});
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
    return (
      c.name.toLowerCase().includes(query) ||
      (c.city && c.city.toLowerCase().includes(query)) ||
      (c.state && c.state.toLowerCase().includes(query)) ||
      (c.country && c.country.toLowerCase().includes(query))
    );
  });

  // Step 3
  const [regPhone, setRegPhone] = useState("(706) 555-0192");
  const [regCity, setRegCity] = useState("Augusta");
  const [regState, setRegState] = useState("GA");
  const [regPushNotifications, setRegPushNotifications] = useState(true);

  // Step 4
  const [regAgreedRules, setRegAgreedRules] = useState(true);
  const [regAgreedMarker, setRegAgreedMarker] = useState(true);
  const [regError, setRegError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Reactive Step Completion Validation for Disabled Button States
  const isRegStep1Valid = Boolean(
    regFirstName.trim() &&
    regLastName.trim() &&
    regEmail.includes("@") &&
    regEmail.includes(".") &&
    regPassword.length >= 8 &&
    regPassword === regConfirmPassword
  );

  const isRegStep2Valid = Boolean(
    (regNoHandicap || (regHandicap.trim() && !isNaN(Number(regHandicap)))) &&
    regGender &&
    regDob.trim()
  );

  const isRegStep3Valid = Boolean(
    regPhone.replace(/\D/g, "").length >= 7 &&
    regCity.trim() &&
    regState.trim()
  );

  const isRegStep4Valid = Boolean(regAgreedRules && regAgreedMarker);

  const calcPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let s = 0;
    if (pass.length >= 8) s++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) s++;
    if (/[0-9]/.test(pass)) s++;
    if (/[^A-Za-z0-9]/.test(pass)) s++;
    return s;
  };

  const handleRegNext = () => {
    setRegError(null);
    if (regStep === 1) {
      if (!regFirstName.trim() || !regLastName.trim()) {
        setRegError("Please enter your full first and last name.");
        return;
      }
      if (!regEmail.includes("@")) {
        setRegError("Please enter a valid email address.");
        return;
      }
      if (regPassword.length < 8) {
        setRegError("Password must be at least 8 characters.");
        return;
      }
      if (regPassword !== regConfirmPassword) {
        setRegError("Passwords do not match.");
        return;
      }
    }
    if (regStep < 4) {
      setRegStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
      scrollToTopAll();
    }
  };

  const handleRegPrev = () => {
    setRegError(null);
    if (regStep > 1) {
      setRegStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
      scrollToTopAll();
    } else {
      switchScreen("login");
    }
  };

  const handleRegComplete = () => {
    if (!regAgreedRules || !regAgreedMarker) {
      setRegError("Please accept both tournament rules and marker pledges.");
      return;
    }
    setIsRegistering(true);
    setTimeout(() => {
      setIsRegistering(false);
      setVerifyEmailTarget(regEmail);
      showToast("Player account created! Verification code sent.");
      switchScreen("verify");
    }, 500);
  };

  // Load live tournaments from organizers via API (safe without auth redirect)
  useEffect(() => {
    async function loadOrganizerTournaments() {
      try {
        setIsLoadingTournaments(true);
        const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const res = await fetch(`${backendBase}/tournaments`, {
          credentials: 'include',
          cache: 'no-store',
        }).catch(() => null);

        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          if (Array.isArray(data) && data.length > 0) {
            const mapped: RealTournament[] = data.map((t: any, idx: number) => ({
              id: t.id || `tournament_${idx}`,
              name: t.name || "Tournament Championship",
              status: t.status === "ONGOING" ? "LIVE" : (t.status || "UPCOMING"),
              organizerClub: t.club?.name || "Oakwood Country Club",
              organizerCity: t.club?.city || t.location || "Augusta, GA",
              courseName: t.course?.name || t.venue || "Championship Course",
              coursePar: t.holes === 9 ? 36 : 72,
              courseHoles: t.holes || 18,
              format: t.format ? t.format.replace(/_/g, " ") : "Stroke Play",
              dates: t.startDate ? new Date(t.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "This Weekend",
              purse: t.prizePool ? `$${formatNumber(Number(t.prizePool))}` : `$${formatNumber(t.entryFee ? Number(t.entryFee) * 50 : 1250000)}`,
              entryFee: t.entryFee ? `$${formatNumber(Number(t.entryFee))}` : "$250",
              fieldCount: t._count?.registrations || t.maxPlayers || 48,
              cutLine: t.enableCut ? `Top ${t.cutLine || 30} + Ties` : "None",
              weather: "74°F Sunny • 6mph NW",
              stimp: "12.5 Stimp",
              registeredPlayers: REAL_ORGANIZER_TOURNAMENTS[0].registeredPlayers,
            }));
            setLiveTournaments(mapped);
          }
        }
      } catch {
        // Fallback remains the pre-seeded organizer tournaments
      } finally {
        setIsLoadingTournaments(false);
      }
    }
    loadOrganizerTournaments();
  }, []);

  const handleLoginSubmit = (emailToCheck: string) => {
    setLoginError(null);
    const normalized = emailToCheck.trim().toLowerCase();
    const isOrganizerOrAdmin =
      normalized.includes("admin") ||
      normalized.includes("organizer") ||
      normalized.includes("manager") ||
      normalized.includes("superadmin") ||
      ORGANIZER_ADMIN_TEST_ACCOUNTS.some((o) => o.email.toLowerCase() === normalized);

    if (isOrganizerOrAdmin) {
      setLoginError(
        "Access Denied: The Openclub Mobile App is reserved for players. Organizers and Administrators must sign in through the Web Admin Portal."
      );
      showToast("Access Denied: Players only on Mobile");
      return;
    }

    const matchedPlayer = REAL_PLAYERS.find((p) => p.email.toLowerCase() === normalized) || {
      name: normalized.split("@")[0].replace(".", " "),
      email: normalized,
      handicap: 5.0,
      club: activeTournament.organizerClub,
      avatar: normalized.substring(0, 2).toUpperCase(),
      status: "Verified Player",
    };

    setAuthenticatedPlayer(matchedPlayer as any);
    showToast(`Signed in as ${matchedPlayer.name}`);
    setActiveScreen("hub");
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

  const currentHole = HOLE_DATA[currentHoleIndex];
  const activeHoleScore = holeScores[currentHoleIndex] || {
    strokes: currentHole.par,
    putts: 2,
    fairway: "CENTER",
    gir: true,
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
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
    if (currentHoleIndex < 17) {
      const nextIndex = currentHoleIndex + 1;
      setCurrentHoleIndex(nextIndex);
      if (!holeScores[nextIndex]) {
        setHoleScores((prev) => ({
          ...prev,
          [nextIndex]: {
            strokes: HOLE_DATA[nextIndex].par,
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
      path: "apps/mobile-app/lib/features/tournaments/screens/tournament_list_screen.dart",
      summary:
        "Real-time Tournament Hub consuming live organizer tournament endpoints with organizer clubs, venue details, formats, and prize pools.",
      snippet: `// Dart & Flutter: tournament_list_screen.dart
class TournamentListScreen extends StatefulWidget {
  const TournamentListScreen({super.key});
  @override
  State<TournamentListScreen> createState() => _TournamentListScreenState();
}

class _TournamentListScreenState extends State<TournamentListScreen> {
  final ApiClient _apiClient = ApiClient();
  List<dynamic> _tournaments = [];

  Future<void> _fetchTournaments() async {
    try {
      final response = await _apiClient.dio.get('/tournaments');
      setState(() {
        _tournaments = response.data.map((t) => {
          'name': t['name'],
          'organizerClub': t['club']?['name'] ?? 'Oakwood Country Club',
          'course': t['course']?['name'] ?? 'Championship Course',
          'purse': t['prizePool'] != null ? '\$\${t['prizePool']}' : 'Entry: \$\${t['entryFee']}',
          'status': t['status'] == 'ONGOING' ? 'LIVE' : t['status'],
        }).toList();
      });
    } catch (e) {
      // Fallback to real organizer seeded tournament
    }
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
        "Pixel-perfect Flutter login screen following the executive reference design: 'Welcome Back' header, Google OAuth action, baby-blue text fields, custom emerald remember-me checkbox, and strict player-only platform security gate.",
      snippet: `// Dart & Flutter: login_screen.dart (Exact Reference UI)
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController(text: 'superadmin@openclub.os');
  final _passwordController = TextEditingController(text: 'Password123!');
  bool _obscurePassword = true;
  bool _rememberMe = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Welcome Back', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
              const SizedBox(height: 18),
              
              // Google OAuth
              OutlinedButton(
                onPressed: () {},
                style: OutlinedButton.styleFrom(minimumSize: const Size(double.infinity, 48)),
                child: Row(children: [_buildGoogleIcon(), Text('Continue with Google', style: TextStyle(fontWeight: FontWeight.w500))]),
              ),
              
              // Divider
              Row(children: [Divider(), Text('OR CONTINUE WITH EMAIL'), Divider()]),
              
              // Email Address (48px height, pale-mint green)
              Text('Email Address'),
              Container(
                height: 48,
                decoration: BoxDecoration(color: Color(0xFFF5FAF6), border: Border.all(color: Color(0xFFE1EFE5)), borderRadius: BorderRadius.circular(12)),
                child: TextField(controller: _emailController, onChanged: (_) => setState(() {})),
              ),
              
              // Password (48px height, pale-mint green)
              Text('Password'),
              Container(
                height: 48,
                decoration: BoxDecoration(color: Color(0xFFF5FAF6), border: Border.all(color: Color(0xFFE1EFE5)), borderRadius: BorderRadius.circular(12)),
                child: TextField(controller: _passwordController, obscureText: _obscurePassword, onChanged: (_) => setState(() {})),
              ),
              
              // Remember me & Forgot Password
              Row(
                children: [
                  _buildCheckbox(_rememberMe),
                  Text('Remember me', style: TextStyle(fontWeight: FontWeight.w500)),
                  Spacer(),
                  Text('Forgot password?', style: TextStyle(color: Color(0xFF00875A), fontWeight: FontWeight.w500)),
                ],
              ),
              
              // Sign In Button (Disabled when incomplete, 48px, font-medium)
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Color(0xFF009A60),
                    disabledBackgroundColor: Color(0xFF009A60).withOpacity(0.35),
                  ),
                  onPressed: _isLoginValid ? _handleLogin : null,
                  child: Text('Sign In', style: TextStyle(fontWeight: FontWeight.w500)),
                ),
              ),
              
              // Footer
              Row(children: [Text("Don't have an account? "), Text("Create one", style: TextStyle(color: Color(0xFF00875A), fontWeight: FontWeight.w500))]),
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
          
          // 4. Resend Timer Row
          Text("Didn't get the code? Resend Code (0:\$_resendSeconds)", style: TextStyle(fontWeight: FontWeight.w500)),
          
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
        "Full 4-Step Player Registration Wizard with Pale-Mint Green form styling (#F5FAF6 / #E1EFE5), GHIN handicapping & rules attestation.",
      snippet: `// Dart & Flutter: registration_screen.dart
class RegistrationScreen extends ConsumerStatefulWidget {
  const RegistrationScreen({super.key});

  @override
  ConsumerState<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends ConsumerState<RegistrationScreen> {
  int _currentStep = 1; // Step 1 to 4

  // Brand Pale-Mint Green Input Styling Tokens (#F5FAF6 / #E1EFE5)
  static const Color kGreenInputBg = Color(0xFFF5FAF6);
  static const Color kGreenInputBorder = Color(0xFFE1EFE5);
  static const Color kTournamentEmerald = Color(0xFF009A60);

  // Controllers
  final _firstNameController = TextEditingController(text: 'Alex');
  final _lastNameController = TextEditingController(text: 'Wright');
  final _emailController = TextEditingController(text: 'player@domain.com');
  final _passwordController = TextEditingController(text: 'Password123!');
  final _confirmPasswordController = TextEditingController(text: 'Password123!');
  final _handicapController = TextEditingController(text: '2.4');
  final _homeClubController = TextEditingController(text: '');
  final _dobController = TextEditingController(text: '05 / 14 / 1994');
  final _phoneController = TextEditingController(text: '(706) 555-0192');
  final _cityController = TextEditingController(text: 'Augusta');
  final _stateController = TextEditingController(text: 'GA');

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
  };

  const copyCode = () => {
    navigator.clipboard.writeText(dartCodeMap[activeScreen].snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#06090E] text-slate-100 flex flex-col font-sans">
      {/* Studio Header Bar */}
      <header className="border-b border-emerald-950/60 bg-[#090E17]/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
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
            <p className="text-xs text-slate-400">
              Interactive preview of OpenclubOS Mobile App screens
            </p>
          </div>
        </div>

        {/* Screen Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-[#0D1522] p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => switchScreen("register")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeScreen === "register"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Register
          </button>
          <button
            onClick={() => switchScreen("verify")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeScreen === "verify"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            Verify Email (OTP)
          </button>
          <button
            onClick={() => switchScreen("login")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeScreen === "login"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <LogOut className="h-3.5 w-3.5 rotate-180" />
            Login
          </button>
          <button
            onClick={() => switchScreen("scoring")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeScreen === "scoring"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Flag className="h-3.5 w-3.5" />
            Scoring
          </button>
          <button
            onClick={() => switchScreen("attestation")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeScreen === "attestation"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            Attestation
          </button>
          <button
            onClick={() => switchScreen("hub")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeScreen === "hub"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Trophy className="h-3.5 w-3.5" />
            Tournament Hub
          </button>
          <button
            onClick={() => switchScreen("leaderboard")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeScreen === "leaderboard"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            Leaderboard
          </button>
        </div>

        {/* Organizer Tournament Live Switcher */}
        <div className="hidden xl:flex items-center gap-2 bg-[#0D1522] px-3 py-1.5 rounded-xl border border-emerald-900/40 text-xs text-slate-300">
          <Building2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Organizer:</span>
          <select
            value={selectedTournamentIndex}
            onChange={(e) => {
              const idx = Number(e.target.value);
              setSelectedTournamentIndex(idx);
              showToast(`Loaded ${liveTournaments[idx].organizerClub}`);
            }}
            className="bg-transparent text-xs text-emerald-300 font-semibold focus:outline-hidden cursor-pointer"
          >
            {liveTournaments.map((t, idx) => (
              <option key={t.id} value={idx} className="bg-[#090F16] text-white">
                {t.organizerClub} — {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* View Controls & Inspector Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#0D1522] rounded-lg border border-slate-800/80 p-0.5 text-xs text-slate-400">
            <button
              onClick={() => setDeviceScale(85)}
              className={`px-2 py-1 rounded ${
                deviceScale === 85 ? "bg-slate-800 text-white" : ""
              }`}
            >
              85%
            </button>
            <button
              onClick={() => setDeviceScale(100)}
              className={`px-2 py-1 rounded ${
                deviceScale === 100 ? "bg-slate-800 text-white" : ""
              }`}
            >
              100%
            </button>
          </div>

          <button
            onClick={() => setShowInspector(!showInspector)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all ${
              showInspector
                ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                : "bg-[#0D1522] border-slate-800 text-slate-300 hover:border-slate-700"
            }`}
          >
            <FileCode2 className="h-3.5 w-3.5 text-amber-400" />
            Dart Code
          </button>

          <Link
            href="/organizer-admin"
            className="no-underline px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0D1522] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            Back to Admin
          </Link>
        </div>
      </header>

      {/* Main Workspace: Device Simulator & Code Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Device Stage */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0D1F1A] via-[#070D13] to-[#040609]">
          {/* Smartphone Frame Container */}
          <div
            style={{
              transform: `scale(${deviceScale / 100})`,
              transformOrigin: "center center",
              transition: "transform 0.2s ease-in-out",
            }}
            className="relative"
          >
            {/* Phone Outer Titanium Bezel */}
            <div className="w-[390px] h-[810px] rounded-[52px] p-[10px] bg-gradient-to-b from-[#2A3441] via-[#151D28] to-[#0E1520] shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_40px_rgba(16,185,129,0.12)] border border-slate-700/60 relative flex flex-col">
              {/* Left/Right Button Notches */}
              <div className="absolute -left-[13px] top-[115px] w-[3px] h-[26px] bg-slate-700 rounded-l-sm" />
              <div className="absolute -left-[13px] top-[155px] w-[3px] h-[46px] bg-slate-700 rounded-l-sm" />
              <div className="absolute -left-[13px] top-[215px] w-[3px] h-[46px] bg-slate-700 rounded-l-sm" />
              <div className="absolute -right-[13px] top-[170px] w-[3px] h-[65px] bg-slate-700 rounded-r-sm" />

              {/* Inner Screen Surface */}
              <div className="w-full h-full rounded-[42px] bg-[#06090E] overflow-hidden flex flex-col relative border border-black select-none">
                {/* Dynamic Island / Status Bar */}
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

                {/* Floating In-App Toast */}
                {toastMessage && (
                  <div className="absolute top-12 left-4 right-4 z-40 bg-emerald-900/90 border border-emerald-500/50 backdrop-blur-md text-emerald-100 px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{toastMessage}</span>
                  </div>
                )}

                {/* SCREEN CONTENT VIEW */}
                <div
                  ref={phoneContentScrollRef}
                  className={`flex-1 relative flex flex-col ${
                    activeScreen === "scoring" || activeScreen === "register"
                      ? "overflow-hidden"
                      : "overflow-y-auto scrollbar-hide no-scrollbar"
                  }`}
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {/* 1. SCORING SCREEN */}
                  {activeScreen === "scoring" && (
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
                            {activeTournament.name}
                          </div>
                          <h2 className="text-xs font-medium text-white truncate">
                            {activeTournament.courseName} • {activeTournament.organizerClub}
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
                          {HOLE_DATA.map((h, i) => {
                            const isSaved = !!holeScores[i];
                            const isActive = currentHoleIndex === i;
                            return (
                              <button
                                key={h.number}
                                type="button"
                                onClick={() => setCurrentHoleIndex(i)}
                                className={`shrink-0 w-8 h-8 rounded-xl text-[11px] font-medium flex flex-col items-center justify-center transition-all ${
                                  isActive
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
                                className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                                  activeHoleScore.gir
                                    ? "bg-emerald-500"
                                    : "bg-slate-800"
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                    activeHoleScore.gir ? "translate-x-5" : ""
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
                                className={`py-1.5 rounded-lg text-[9px] font-semibold tracking-wider transition-all ${
                                  activeHoleScore.fairway === fw
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
                  {activeScreen === "attestation" && (
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
                            Pairing Roster • {activeTournament.organizerClub}
                          </span>

                          {activeTournament.registeredPlayers.slice(0, 2).map((player, idx) => {
                            const isFirst = idx === 0;
                            const isAttested = isFirst || attestationConfirmed;
                            return (
                              <div
                                key={player.id}
                                className={`rounded-2xl bg-[#0E1521]/90 border ${
                                  isAttested ? "border-emerald-500/40" : "border-slate-800/90"
                                } p-3.5 mb-2.5 shadow-lg`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2.5">
                                    <div
                                      className={`w-8 h-8 rounded-xl ${
                                        isAttested
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
                                      className={`text-base font-extrabold ${
                                        player.gross.includes("-")
                                          ? "text-emerald-400"
                                          : "text-amber-400"
                                      } font-mono block`}
                                    >
                                      {player.gross}
                                    </span>
                                    <span
                                      className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${
                                        isAttested
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
                          })}
                        </div>

                        {/* Attest Action Button */}
                        <button
                          onClick={() => setShowAttestModal(true)}
                          className={`w-full h-12 rounded-2xl font-medium text-xs tracking-wide shadow-xl flex items-center justify-center gap-2 transition-all ${
                            attestationConfirmed
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

                  {/* 3. TOURNAMENT HUB SCREEN */}
                  {activeScreen === "hub" && (
                    <div className="flex-1 flex flex-col pb-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0D1A16] via-[#090F16] to-[#06090E]">
                      {/* Header */}
                      <div className="px-5 pt-1 pb-3 flex items-center justify-between border-b border-emerald-950/40">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-emerald-400" />
                          <h2 className="text-xs font-bold tracking-widest text-white uppercase">
                            Tournament Hub
                          </h2>
                        </div>
                        <div className="h-7 px-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-semibold text-emerald-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          {liveTournaments.length} Tournaments
                        </div>
                      </div>

                      <div className="px-4 pt-3 flex-1 flex flex-col gap-3">
                        {/* Organizer Source Banner */}
                        <div className="p-2.5 rounded-xl bg-[#091512] border border-emerald-900/50 flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-slate-300 font-medium truncate max-w-[170px]">
                              {activeTournament.organizerClub}
                            </span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold">
                            REAL ORGANIZER
                          </span>
                        </div>

                        {/* Featured Live Tournament Card */}
                        <div className="rounded-2xl bg-[#0E1521]/95 border border-emerald-500/40 p-4 shadow-xl relative overflow-hidden">
                          <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />

                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              {activeTournament.status}
                            </span>
                            <span className="text-[10px] text-amber-400 font-semibold font-mono">
                              Purse: {activeTournament.purse}
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-white mb-1">
                            {activeTournament.name}
                          </h3>
                          <p className="text-[11px] text-slate-300 flex items-center gap-1 mb-3">
                            <Flag className="h-3 w-3 text-emerald-400" />
                            {activeTournament.courseName} ({activeTournament.organizerCity})
                          </p>

                          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 bg-black/40 rounded-xl p-2.5 mb-3 border border-slate-800 font-mono">
                            <div>Format: {activeTournament.format}</div>
                            <div>Field: {activeTournament.fieldCount} Players</div>
                            <div>Entry Fee: {activeTournament.entryFee}</div>
                            <div>Cut: {activeTournament.cutLine}</div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setActiveScreen("scoring")}
                              className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs text-center transition-colors shadow-md shadow-emerald-950 flex items-center justify-center cursor-pointer"
                            >
                              Enter Scoring
                            </button>
                            <button
                              onClick={() => setActiveScreen("leaderboard")}
                              className="h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs text-center border border-slate-700 transition-colors flex items-center justify-center cursor-pointer"
                            >
                              Leaderboard
                            </button>
                          </div>
                        </div>

                        {/* Tournament Selector Strip (Switch between organizer events) */}
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                            Browse Organizer Events:
                          </span>
                          <div className="flex gap-2 overflow-x-auto scrollbar-hide no-scrollbar pb-1">
                            {liveTournaments.map((t, idx) => {
                              const isSelected = selectedTournamentIndex === idx;
                              return (
                                <button
                                  key={t.id}
                                  onClick={() => {
                                    setSelectedTournamentIndex(idx);
                                    showToast(`Loaded ${t.name}`);
                                  }}
                                  className={`shrink-0 text-left p-2.5 rounded-xl border transition-all w-[165px] ${
                                    isSelected
                                      ? "bg-emerald-950/40 border-emerald-500/50 text-white"
                                      : "bg-[#0E1521]/70 border-slate-800 text-slate-400 hover:text-slate-200"
                                  }`}
                                >
                                  <span className="text-[9px] text-emerald-400 block font-bold truncate">
                                    {t.organizerClub}
                                  </span>
                                  <h4 className="text-[11px] font-semibold text-white truncate mt-0.5">
                                    {t.name}
                                  </h4>
                                  <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1">
                                    <span>{t.dates}</span>
                                    <span className="text-amber-400">{t.purse}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. LEADERBOARD SCREEN */}
                  {activeScreen === "leaderboard" && (
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
                            {activeTournament.name}
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
                          <span>PAR {activeTournament.coursePar}</span>
                          <span className="text-emerald-400">{activeTournament.organizerClub}</span>
                          <span className="text-amber-400">FIELD: {activeTournament.fieldCount}</span>
                        </div>

                        {/* Standings Table */}
                        <div className="rounded-2xl bg-[#0E1521]/90 border border-slate-800/80 overflow-hidden shadow-xl">
                          <div className="grid grid-cols-12 px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 bg-slate-950/50">
                            <span className="col-span-2">Pos</span>
                            <span className="col-span-6">Player</span>
                            <span className="col-span-2 text-center">HCP</span>
                            <span className="col-span-2 text-right">Gross</span>
                          </div>

                          {activeTournament.registeredPlayers.map((p, idx) => (
                            <div
                              key={idx}
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
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 5. PLAYER-ONLY LOGIN SCREEN (Exact Reference Design Match) */}
                  {activeScreen === "login" && (
                    <div className="flex-1 flex flex-col justify-between p-6 bg-white overflow-y-auto">
                      <div className="space-y-4">
                        {/* 1. Header: "Welcome Back" */}
                        <div className="pt-2">
                          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                            Welcome Back
                          </h2>
                        </div>

                        {/* 2. Google OAuth Button */}
                        <button
                          type="button"
                          onClick={() => {
                            showToast("Google Sign-In is configured for Player accounts");
                          }}
                          className="w-full h-12 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80 transition-all flex items-center justify-center gap-2.5 shadow-2xs group"
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
                          <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                            Continue with Google
                          </span>
                        </button>

                        {/* 3. Divider: "OR CONTINUE WITH EMAIL" */}
                        <div className="flex items-center gap-3 my-5">
                          <div className="flex-1 h-px bg-slate-200" />
                          <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                            OR CONTINUE WITH EMAIL
                          </span>
                          <div className="flex-1 h-px bg-slate-200" />
                        </div>

                        {/* Security Rejection Error Banner */}
                        {loginError && (
                          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
                            <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="leading-tight">
                              <span className="font-bold text-rose-700 block text-[10px] uppercase tracking-wide">
                                Access Denied (Role Restricted)
                              </span>
                              <span className="text-[10px] text-rose-600 block mt-0.5">
                                {loginError}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 4. Form Inputs */}
                        <div className="space-y-6">
                          {/* Email Address */}
                          <div>
                            <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block mb-2">
                              Email Address
                            </label>
                            <input
                              type="email"
                              value={loginEmail}
                              onChange={(e) => {
                                setLoginEmail(e.target.value);
                                if (loginError) setLoginError(null);
                              }}
                              placeholder="player@openclub.os"
                              className="w-full h-12 bg-[#f5faf6] border border-[#e1efe5] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 rounded-xl px-3.5 text-[13.5px] leading-normal font-medium text-[#0F172A] placeholder:text-[#8CA0BA] placeholder:font-medium focus:outline-hidden transition-colors"
                            />
                          </div>

                          {/* Password */}
                          <div>
                            <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block mb-2">
                              Password
                            </label>
                            <div className="relative">
                              <input
                                type={showPassword ? "text" : "password"}
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                className="w-full h-12 bg-[#f5faf6] border border-[#e1efe5] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 rounded-xl px-3.5 pr-10 text-[13.5px] leading-normal font-medium text-[#0F172A] placeholder:text-[#8CA0BA] placeholder:font-medium focus:outline-hidden transition-colors"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 5. Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between pt-0.5">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <button
                              type="button"
                              onClick={() => setRememberMe(!rememberMe)}
                              className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                                rememberMe
                                  ? "bg-[#009A60] text-white"
                                  : "border border-slate-300 bg-white"
                              }`}
                            >
                              {rememberMe && <Check className="h-3 w-3 stroke-[3]" />}
                            </button>
                            <span className="text-xs text-slate-700 font-medium">Remember me</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => showToast("Password reset link sent to your email")}
                            className="text-sm font-medium text-[#00875A] hover:underline cursor-pointer"
                          >
                            Forgot password?
                          </button>
                        </div>

                        {/* 6. Sign In Primary Button */}
                        <button
                          type="button"
                          disabled={!loginEmail.trim() || !loginPassword.trim()}
                          onClick={() => handleLoginSubmit(loginEmail)}
                          className={`w-full h-12 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                            loginEmail.trim() && loginPassword.trim()
                              ? "bg-[#009A60] hover:bg-[#008754] text-white shadow-md shadow-emerald-700/20 cursor-pointer"
                              : "bg-[#009A60]/35 text-white/75 cursor-not-allowed shadow-none"
                          }`}
                        >
                          <span>Sign In</span>
                        </button>

                        {/* 7. Footer: "Don't have an account? Create one" */}
                        <div className="text-center pt-1">
                          <span className="text-xs text-slate-500">
                            Don't have an account?{" "}
                          </span>
                          <button
                            type="button"
                            onClick={() => switchScreen("register")}
                            className="text-sm font-medium text-[#00875A] underline underline-offset-2 hover:text-[#006C47] cursor-pointer"
                          >
                            Create one
                          </button>
                        </div>
                      </div>

                      {/* Quick Profile Switcher for Testing */}
                      <div className="pt-3 mt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                            Quick Test Accounts:
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 mb-1.5">
                          {REAL_PLAYERS.slice(0, 2).map((p) => (
                            <button
                              key={p.email}
                              type="button"
                              onClick={() => {
                                setLoginEmail(p.email);
                                setLoginPassword("Password123!");
                                handleLoginSubmit(p.email);
                              }}
                              className="p-1 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-left transition-all truncate"
                              title={`Login as ${p.name}`}
                            >
                              <span className="text-[9px] font-bold text-slate-800 block truncate">
                                👤 {p.name}
                              </span>
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-1">
                          {ORGANIZER_ADMIN_TEST_ACCOUNTS.map((o) => (
                            <button
                              key={o.email}
                              type="button"
                              onClick={() => {
                                setLoginEmail(o.email);
                                handleLoginSubmit(o.email);
                              }}
                              className="flex-1 py-1 px-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[8px] font-medium text-rose-700 transition-all text-center truncate"
                              title="Test that organizer login is blocked on mobile"
                            >
                              🚫 Test {o.name.split(" ")[0]} (Block)
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SCREEN: REGISTRATION (STEPS 1 - 4 WIZARD) */}
                  {activeScreen === "register" && (
                    <div className="h-full bg-white text-slate-900 flex flex-col overflow-hidden relative">
                      {/* Top Header Navigation (Fixed pinned header) */}
                      <div className="p-6 pb-4 border-b border-slate-100 bg-white shrink-0 z-10">
                        <div className="flex items-center justify-between mb-3.5">
                          <button
                            type="button"
                            onClick={handleRegPrev}
                            className="h-8 w-8 rounded-full flex items-center justify-center bg-white border border-slate-200 text-[#0F172A] hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                            title="Back"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold text-[#5B6B7F] bg-[#EEF2F6] px-3 py-1 rounded-full tracking-wider uppercase">
                              STEP {regStep} OF 4
                            </span>
                          </div>
                        </div>

                        {/* 4-Segment Progress Bar */}
                        <div className="grid grid-cols-4 gap-1.5">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className={`h-[3.5px] rounded-full transition-all duration-300 ${
                                step <= regStep ? "bg-[#009A60]" : "bg-[#E5E7EB]"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Step Content (Scrollable with regScrollRef) */}
                      <div
                        ref={regScrollRef}
                        className="flex-1 overflow-y-auto p-6 pt-3 space-y-4 scrollbar-hide no-scrollbar"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                      >
                        {/* Error Banner */}
                        {regError && (
                          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                            <span>{regError}</span>
                          </div>
                        )}

                        {/* --- STEP 1: CREATE PLAYER ACCOUNT --- */}
                        {regStep === 1 && (
                          <div className="space-y-6">
                            <div>
                              <h1 className="text-2xl font-black text-[#111827] tracking-tight">
                                Create Player Account
                              </h1>
                              <p className="text-[13px] text-[#5B6B7F] mt-1.5 leading-relaxed font-normal">
                                Enter your personal credentials to compete in verified club tournaments.
                              </p>
                            </div>

                            {/* Google Sign Up Button */}
                            <button
                              type="button"
                              onClick={() => showToast("Google Sign-In ready for Player accounts.")}
                              className="w-full h-12 bg-white border border-[#E5E7EB] px-4 rounded-xl flex items-center justify-center gap-2.5 text-sm font-medium text-[#1F2937] hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                              <span>Sign up with Google</span>
                            </button>

                            {/* Divider */}
                            <div className="flex items-center gap-3 my-6">
                              <div className="flex-1 h-px bg-[#E2E8F0]" />
                              <span className="text-[10px] font-medium text-[#8C9BAB] tracking-wider uppercase">
                                OR REGISTER WITH EMAIL
                              </span>
                              <div className="flex-1 h-px bg-[#E2E8F0]" />
                            </div>

                            {/* First & Last Name */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block mb-2">
                                  First Name
                                </label>
                                <input
                                  type="text"
                                  value={regFirstName}
                                  onChange={(e) => setRegFirstName(e.target.value)}
                                  placeholder="Alex"
                                  className="w-full h-12 bg-[#f5faf6] border border-[#e1efe5] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 rounded-xl px-3.5 text-[13.5px] leading-normal font-medium text-[#0F172A] placeholder:text-[#8CA0BA] placeholder:font-medium focus:outline-hidden transition-all"
                                />
                              </div>
                              <div>
                                <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block mb-2">
                                  Last Name
                                </label>
                                <input
                                  type="text"
                                  value={regLastName}
                                  onChange={(e) => setRegLastName(e.target.value)}
                                  placeholder="Wright"
                                  className="w-full h-12 bg-[#f5faf6] border border-[#e1efe5] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 rounded-xl px-3.5 text-[13.5px] leading-normal font-medium text-[#0F172A] placeholder:text-[#8CA0BA] placeholder:font-medium focus:outline-hidden transition-all"
                                />
                              </div>
                            </div>

                            {/* Email Address */}
                            <div>
                              <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block mb-2">
                                Email Address
                              </label>
                              <input
                                type="email"
                                value={regEmail}
                                onChange={(e) => setRegEmail(e.target.value)}
                                placeholder="player@domain.com"
                                className="w-full h-12 bg-[#f5faf6] border border-[#e1efe5] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 rounded-xl px-3.5 text-[13.5px] leading-normal font-medium text-[#0F172A] placeholder:text-[#8CA0BA] placeholder:font-medium focus:outline-hidden transition-all"
                              />
                            </div>

                            {/* Password */}
                            <div>
                              <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block mb-2">
                                Password
                              </label>
                              <div className="relative">
                                <input
                                  type={regShowPassword ? "text" : "password"}
                                  value={regPassword}
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
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex-1 grid grid-cols-4 gap-1">
                                  {[1, 2, 3, 4].map((bar) => {
                                    const strength = calcPasswordStrength(regPassword);
                                    return (
                                      <div
                                        key={bar}
                                        className={`h-[3.5px] rounded-full ${
                                          bar <= strength ? "bg-[#009A60]" : "bg-[#E2E8F0]"
                                        }`}
                                      />
                                    );
                                  })}
                                </div>
                                <span className="text-[9px] font-medium text-[#5B6B7F] tracking-wider uppercase">
                                  MIN. 8 CHARACTERS
                                </span>
                              </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                              <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block mb-2">
                                Confirm Password
                              </label>
                              <div className="relative">
                                <input
                                  type={regShowConfirm ? "text" : "password"}
                                  value={regConfirmPassword}
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
                              disabled={!isRegStep1Valid}
                              onClick={handleRegNext}
                              className={`w-full mt-2 h-12 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                                isRegStep1Valid
                                  ? "bg-[#009A60] hover:bg-[#008754] text-white shadow-md shadow-emerald-700/20 cursor-pointer"
                                  : "bg-[#009A60]/35 text-white/75 cursor-not-allowed shadow-none"
                              }`}
                            >
                              <span>Continue to Golf Profile →</span>
                            </button>

                            {/* Sign In Link */}
                            <div className="text-center pt-1 text-xs text-[#5B6B7F]">
                              Already registered?{" "}
                              <button
                                type="button"
                                onClick={() => switchScreen("login")}
                                className="text-sm font-medium text-[#009A60] hover:underline underline-offset-2 cursor-pointer"
                              >
                                Sign In
                              </button>
                            </div>
                          </div>
                        )}

                        {/* --- STEP 2: YOUR GOLF PROFILE --- */}
                        {regStep === 2 && (
                          <div className="space-y-6">
                            <div>
                              <h1 className="text-2xl font-black text-[#111827] tracking-tight">
                                Your Golf Profile
                              </h1>
                              <p className="text-[13px] text-[#5B6B7F] mt-1.5 leading-relaxed font-normal">
                                Used by tournament committees to calculate course handicaps and flight brackets.
                              </p>
                            </div>

                            {/* Official Handicap Index */}
                            <div>
                              <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block mb-2">
                                Official Handicap Index
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={regHandicap}
                                  disabled={regNoHandicap}
                                  onChange={(e) => setRegHandicap(e.target.value)}
                                  placeholder="e.g. 2.4"
                                  className={`w-full h-12 bg-[#f5faf6] border border-[#e1efe5] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 rounded-xl px-3.5 pr-14 text-[13.5px] leading-normal font-medium text-[#0F172A] placeholder:text-[#8CA0BA] placeholder:font-medium focus:outline-hidden transition-all ${
                                    regNoHandicap ? "opacity-60 bg-slate-100" : ""
                                  }`}
                                />
                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[#009A60] tracking-wider uppercase">
                                  GHIN
                                </span>
                              </div>

                              {/* No Official Index Checkbox */}
                              <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRegNoHandicap(!regNoHandicap);
                                    if (!regNoHandicap) setRegHandicap("36.0");
                                    else setRegHandicap("2.4");
                                  }}
                                  className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                                    regNoHandicap
                                      ? "bg-[#009A60] text-white"
                                      : "border border-[#e1efe5] bg-[#f5faf6]"
                                  }`}
                                >
                                  {regNoHandicap && <Check className="h-3 w-3 stroke-[3]" />}
                                </button>
                                <span className="text-[12px] font-medium text-[#475569]">
                                  I don't have an official index yet
                                </span>
                              </label>
                            </div>

                            {/* Home Golf Club */}
                            <div>
                              <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block mb-2">
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
                              <p className="text-[11px] text-[#8CA0BA] italic mt-1.5">
                                Tap to search or select from registered golf courses.
                              </p>
                            </div>

                            {/* Gender Segmented Control */}
                            <div>
                              <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block mb-2">
                                Gender
                              </label>
                              <div className="h-12 bg-[#f5faf6] border border-[#e1efe5] rounded-xl p-1 grid grid-cols-2 gap-1">
                                <button
                                  type="button"
                                  onClick={() => setRegGender("MALE")}
                                  className={`h-full rounded-lg text-[13.5px] font-medium transition-all cursor-pointer ${
                                    regGender === "MALE"
                                      ? "bg-white text-[#009A60] border border-[#d1e7d8] shadow-xs"
                                      : "text-[#62758D] hover:text-slate-800 border border-transparent"
                                  }`}
                                >
                                  Male
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRegGender("FEMALE")}
                                  className={`h-full rounded-lg text-[13.5px] font-medium transition-all cursor-pointer ${
                                    regGender === "FEMALE"
                                      ? "bg-white text-[#009A60] border border-[#d1e7d8] shadow-xs"
                                      : "text-[#62758D] hover:text-slate-800 border border-transparent"
                                  }`}
                                >
                                  Female
                                </button>
                              </div>
                            </div>

                            {/* Date of Birth */}
                            <div>
                              <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block mb-2">
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
                              <p className="text-[11px] text-[#8CA0BA] italic mt-1.5">
                                For Junior / Senior bracket eligibility verification.
                              </p>
                            </div>

                            {/* Verification Notice */}
                            <div className="p-3.5 rounded-xl bg-[#f5faf6] border border-[#e1efe5] flex items-start gap-2.5">
                              <ShieldCheck className="h-4 w-4 text-[#5B6B7F] shrink-0 mt-0.5" />
                              <p className="text-[11px] text-[#475569] leading-relaxed font-normal">
                                Handicap indexes are verified against the national golf registry (GHIN/USGA) before tournament play begins.
                              </p>
                            </div>

                            {/* Bottom Buttons */}
                            <div className="flex gap-2.5 pt-2">
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
                                className={`flex-1 h-12 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                                  isRegStep2Valid
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
                          <div className="space-y-6">
                            <div>
                              <h1 className="text-2xl font-black text-[#111827] tracking-tight">
                                Player Contact & Avatar
                              </h1>
                              <p className="text-[13px] text-[#5B6B7F] mt-1.5 leading-relaxed font-normal">
                                Used for live on-course tee time notifications and official pairing scorecards.
                              </p>
                            </div>

                            {/* Avatar Photo Section */}
                            <div className="flex flex-col items-center py-2">
                              <div className="w-20 h-20 rounded-full bg-[#f5faf6] border-2 border-dashed border-[#e1efe5] flex flex-col items-center justify-center text-[#009A60] shadow-2xs">
                                <Camera className="h-5 w-5 mb-0.5 text-[#009A60]" />
                                <span className="text-[9px] font-medium text-[#009A60] tracking-wider uppercase">PHOTO</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => showToast("Avatar picker opened")}
                                className="mt-2.5 h-9 px-4 rounded-full border border-[#E5E7EB] bg-white hover:bg-slate-50 text-[#0F172A] text-sm font-medium transition-all shadow-2xs cursor-pointer"
                              >
                                Upload Player Photo
                              </button>
                              <p className="text-[11px] text-[#8CA0BA] mt-1 text-center font-normal">
                                High-contrast headshot used on the live clubhouse leaderboard.
                              </p>
                            </div>

                            {/* Mobile Phone Number */}
                            <div>
                              <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block mb-2">
                                Mobile Phone Number
                              </label>
                              <div className="flex gap-2">
                                <div className="h-12 w-20 bg-[#f5faf6] border border-[#e1efe5] rounded-xl px-2.5 flex items-center justify-between text-xs font-medium text-[#0F172A]">
                                  <span>US +1</span>
                                  <span className="text-[#8CA0BA] text-[10px]">▼</span>
                                </div>
                                <input
                                  type="tel"
                                  value={regPhone}
                                  onChange={(e) => setRegPhone(e.target.value)}
                                  placeholder="(555) 000-0000"
                                  className="flex-1 h-12 bg-[#f5faf6] border border-[#e1efe5] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 rounded-xl px-3.5 text-[13.5px] leading-normal font-medium text-[#0F172A] placeholder:text-[#8CA0BA] placeholder:font-medium focus:outline-hidden transition-all"
                                />
                              </div>
                              <p className="text-[11px] text-[#8CA0BA] mt-1.5 font-normal">
                                Used for emergency shotgun and weather sirens.
                              </p>
                            </div>

                            {/* City & State */}
                            <div className="grid grid-cols-2 gap-2.5">
                              <div>
                                <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block mb-2">
                                  City
                                </label>
                                <input
                                  type="text"
                                  value={regCity}
                                  onChange={(e) => setRegCity(e.target.value)}
                                  placeholder="Augusta"
                                  className="w-full h-12 bg-[#f5faf6] border border-[#e1efe5] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 rounded-xl px-3.5 text-[13.5px] leading-normal font-medium text-[#0F172A] placeholder:text-[#8CA0BA] placeholder:font-medium focus:outline-hidden transition-all"
                                />
                              </div>
                              <div>
                                <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block mb-2">
                                  State
                                </label>
                                <input
                                  type="text"
                                  value={regState}
                                  onChange={(e) => setRegState(e.target.value)}
                                  placeholder="GA"
                                  className="w-full h-12 bg-[#f5faf6] border border-[#e1efe5] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 rounded-xl px-3.5 text-[13.5px] leading-normal font-medium text-[#0F172A] placeholder:text-[#8CA0BA] placeholder:font-medium focus:outline-hidden transition-all"
                                />
                              </div>
                            </div>

                            {/* Push Notifications Card */}
                            <div className="p-3.5 rounded-xl bg-[#f5faf6] border border-[#e1efe5] flex items-center justify-between">
                              <div>
                                <p className="text-xs font-medium text-[#0F172A]">Push Notifications</p>
                                <p className="text-[11px] text-[#5B6B7F] mt-0.5 font-normal">
                                  Instant Tee Time & Marker Pairing Alerts
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setRegPushNotifications(!regPushNotifications)}
                                className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                                  regPushNotifications ? "bg-[#009A60]" : "bg-slate-300"
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out shadow-xs ${
                                    regPushNotifications ? "translate-x-4" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>

                            {/* Bottom Buttons */}
                            <div className="flex gap-2.5 pt-2">
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
                                disabled={!isRegStep3Valid}
                                onClick={handleRegNext}
                                className={`flex-1 h-12 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                                  isRegStep3Valid
                                    ? "bg-[#009A60] hover:bg-[#008754] text-white shadow-md shadow-emerald-700/20 cursor-pointer"
                                    : "bg-[#009A60]/35 text-white/75 cursor-not-allowed shadow-none"
                                }`}
                              >
                                Review & Finish →
                              </button>
                            </div>
                          </div>
                        )}

                        {/* --- STEP 4: REVIEW & COMPETITOR PLEDGE --- */}
                        {regStep === 4 && (
                          <div className="space-y-6">
                            <div>
                              <h1 className="text-2xl font-black text-[#111827] tracking-tight">
                                Review & Competitor Pledge
                              </h1>
                              <p className="text-[13px] text-[#5B6B7F] mt-1.5 leading-relaxed font-normal">
                                Verify your tournament credentials and confirm rules compliance before activation.
                              </p>
                            </div>

                            {/* Summary Profile Card */}
                            <div>
                              <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block mb-2">
                                Summary Profile Card
                              </label>
                              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
                                <div className="flex items-center gap-3">
                                  <div className="w-11 h-11 rounded-full bg-[#f5faf6] border border-[#e1efe5] flex items-center justify-center text-[#009A60] font-medium text-sm">
                                    🏌️
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-base font-medium text-[#0F172A] truncate">
                                      {regFirstName} {regLastName}
                                    </p>
                                    <div className="mt-0.5 inline-block bg-[#f5faf6] border border-[#e1efe5] text-[#009A60] font-medium text-[10px] px-2 py-0.5 rounded-full truncate max-w-full">
                                      HCP Index {regHandicap}{regHomeClub.trim() ? ` • ${regHomeClub.trim()}` : ""} • {regGender === "MALE" ? "Men's" : "Women's"} Championship Flight
                                    </div>
                                  </div>
                                </div>
                                <div className="border-t border-slate-100 mt-2.5 pt-2 text-xs font-normal text-[#475569] truncate">
                                  {regEmail} • +1 {regPhone} • {regCity}, {regState}
                                </div>
                              </div>
                            </div>

                            {/* Rules & Attestation Pledge Box */}
                            <div>
                              <label className="text-[13.5px] font-semibold text-[#0F172A] tracking-tight block mb-2">
                                Rules & Attestation Pledge
                              </label>
                              <div className="bg-[#f5faf6] border border-[#bbf7d0] rounded-2xl p-3.5 space-y-2.5">
                                <div className="flex items-center gap-2">
                                  <ShieldCheck className="h-4 w-4 text-[#009A60]" />
                                  <span className="text-xs font-medium text-[#166534]">
                                    Official Competitor Attestation Pledge
                                  </span>
                                </div>

                                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                                  <button
                                    type="button"
                                    onClick={() => setRegAgreedRules(!regAgreedRules)}
                                    className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center transition-colors ${
                                      regAgreedRules ? "bg-[#009A60] text-white" : "border border-[#e1efe5] bg-white"
                                    }`}
                                  >
                                    {regAgreedRules && <Check className="h-3 w-3 stroke-[3]" />}
                                  </button>
                                  <span className="text-[11.5px] font-normal text-[#1E293B] leading-snug">
                                    I agree to abide by the USGA & R&A Rules of Golf and Tournament Committee local rules.
                                  </span>
                                </label>

                                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                                  <button
                                    type="button"
                                    onClick={() => setRegAgreedMarker(!regAgreedMarker)}
                                    className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center transition-colors ${
                                      regAgreedMarker ? "bg-[#009A60] text-white" : "border border-[#e1efe5] bg-white"
                                    }`}
                                  >
                                    {regAgreedMarker && <Check className="h-3 w-3 stroke-[3]" />}
                                  </button>
                                  <span className="text-[11.5px] font-normal text-[#1E293B] leading-snug">
                                    I agree to act as an official score marker for fellow competitors under USGA Rule 3.3b.
                                  </span>
                                </label>
                              </div>
                            </div>

                            {/* Bottom Buttons */}
                            <div className="flex gap-2.5 pt-2">
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
                                className={`flex-1 h-12 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                                  isRegStep4Valid && !isRegistering
                                    ? "bg-[#009A60] hover:bg-[#008754] text-white shadow-md shadow-emerald-700/20 cursor-pointer"
                                    : "bg-[#009A60]/35 text-white/75 cursor-not-allowed shadow-none"
                                }`}
                              >
                                {isRegistering ? (
                                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <span>Complete Registration →</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Ultra-Modern Realistic Home Golf Club Bottom Sheet (Contained 100% inside phone display grid) */}
                      {showClubModal && (
                        <div className="absolute inset-0 z-50 flex flex-col justify-end">
                          {/* Dark Backdrop Overlay */}
                          <div
                            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
                            onClick={() => setShowClubModal(false)}
                          />

                          {/* Bottom Sheet Card */}
                          <div className="relative z-10 bg-white rounded-t-[28px] border-t border-[#e1efe5] shadow-2xl p-5 pb-6 animate-in slide-in-from-bottom duration-200 max-h-[88%] flex flex-col">
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
                                onClick={() => setShowClubModal(false)}
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
                                autoFocus
                                value={clubSearchQuery}
                                onChange={(e) => setClubSearchQuery(e.target.value)}
                                placeholder="Search golf club or location..."
                                className="w-full h-12 bg-[#f5faf6] border border-[#e1efe5] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 rounded-xl pl-10 pr-10 text-[13.5px] font-medium text-[#0F172A] placeholder:text-[#8CA0BA] placeholder:font-medium focus:outline-hidden transition-all"
                              />
                              {clubSearchQuery ? (
                                <button
                                  type="button"
                                  onClick={() => setClubSearchQuery("")}
                                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8CA0BA] hover:text-[#0F172A] transition-colors cursor-pointer"
                                >
                                  <span className="text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full w-4 h-4 flex items-center justify-center">✕</span>
                                </button>
                              ) : (
                                <Search className="h-4 w-4 text-[#8CA0BA] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              )}
                            </div>

                            {/* Courses List */}
                            <div className="overflow-y-auto flex-1 divide-y divide-[#f1f5f9] -mx-5 px-5 min-h-48 max-h-72">
                              {filteredCourses.length > 0 ? (
                                filteredCourses.map((c) => {
                                  const isSelected = regHomeClub === c.name;
                                  return (
                                    <button
                                      key={c.id || c.name}
                                      type="button"
                                      onClick={() => {
                                        setRegHomeClub(c.name);
                                        setShowClubModal(false);
                                      }}
                                      className={`w-full text-left py-3 px-3 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                                        isSelected ? "bg-[#e8f5ed] border border-[#bce3cb]" : "hover:bg-[#f8fbf9]"
                                      }`}
                                    >
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                        isSelected ? "bg-[#009A60] text-white" : "bg-[#f5faf6] border border-[#e1efe5] text-[#009A60]"
                                      }`}>
                                        <MapPin className="h-4 w-4" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="text-[13px] font-medium text-[#0F172A] truncate" style={{ fontWeight: 500 }}>
                                          {c.name}
                                        </div>
                                        <div className="text-[11px] font-normal text-[#64748B] truncate" style={{ fontWeight: 400 }}>
                                          {[c.city, c.state, c.country].filter(Boolean).join(", ")}
                                          {c.holes ? ` • ${c.holes} Holes` : ""}
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
                            <div className="relative z-10 bg-white rounded-t-[28px] border-t border-[#e1efe5] shadow-2xl p-5 pb-6 animate-in slide-in-from-bottom duration-200 max-h-[92%] overflow-y-auto">
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
                                  className={`h-10 w-10 rounded-xl bg-white border border-[#e1efe5] flex items-center justify-center shadow-2xs transition-all shrink-0 ${
                                    y >= today.getFullYear() && m >= today.getMonth()
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
                                      className={`h-9 rounded-xl text-[13px] font-medium transition-all flex items-center justify-center relative cursor-pointer ${
                                        isFuture
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
                    </div>
                  )}

                  {/* SCREEN: VERIFY EMAIL (6-DIGIT OTP) */}
                  {activeScreen === "verify" && (
                    <div className="h-full bg-white text-slate-900 flex flex-col p-6 overflow-y-auto">
                      {/* Top Back Navigation */}
                      <div className="flex items-center justify-between mb-4">
                        <button
                          type="button"
                          onClick={() => switchScreen("login")}
                          className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-700 transition-colors"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <span className="text-[10px] font-extrabold text-[#5B6B7F] bg-[#EEF2F6] px-3 py-1 rounded-full tracking-wider uppercase">
                          VERIFICATION
                        </span>
                      </div>

                      {/* Icon Badge */}
                      <div className="w-12 h-12 rounded-2xl bg-[#EDF4FE] border border-[#D6E6FE] flex items-center justify-center mb-5">
                        <Mail className="h-6 w-6 text-[#009A60]" />
                      </div>

                      {/* Title: "Verify Your Email" */}
                      <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight mb-2">
                        Verify Your Email
                      </h1>

                      {/* Description */}
                      <p className="text-xs text-slate-600 leading-relaxed mb-6">
                        We sent a 6-digit security code to{" "}
                        <strong className="text-slate-900 font-semibold">{verifyEmailTarget}</strong>.
                        Enter it below to activate your competitor profile.
                      </p>

                      {/* Error or Success feedback banner */}
                      {verifyError && (
                        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-700 text-xs font-medium animate-in fade-in">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                          <span>{verifyError}</span>
                        </div>
                      )}

                      {verifySuccess && (
                        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-emerald-800 text-xs font-semibold animate-in fade-in">
                          <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                          <span>Account verified successfully! Welcome to OpenclubOS.</span>
                        </div>
                      )}

                      {/* 6-Digit PIN Boxes */}
                      <div className="flex items-center justify-between gap-1.5 mb-6">
                        {otpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            id={`otp-box-${idx}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            className="w-11 h-13 text-center text-xl font-bold bg-[#EDF4FE] border border-[#D6E6FE] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 rounded-xl text-slate-900 focus:outline-hidden transition-all shadow-xs"
                          />
                        ))}
                      </div>

                      {/* Resend Timer Row */}
                      <div className="text-center text-xs text-slate-500 mb-6">
                        Didn't get the code?{" "}
                        <button
                          type="button"
                          disabled={resendCooldown > 0}
                          onClick={handleResendCode}
                          className={`text-sm font-medium transition-colors ${
                            resendCooldown > 0
                              ? "text-slate-400 cursor-not-allowed"
                              : "text-[#00875A] hover:text-[#006C47] underline underline-offset-2 cursor-pointer"
                          }`}
                        >
                          {resendCooldown > 0
                            ? `Resend Code (0:${resendCooldown < 10 ? "0" : ""}${resendCooldown})`
                            : "Resend Code"}
                        </button>
                      </div>

                      {/* Primary Action Button: "Verify & Activate Account" */}
                      <button
                        type="button"
                        onClick={handleVerifySubmit}
                        disabled={otpDigits.some((d) => !d) || isVerifying}
                        className={`w-full h-12 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                          !otpDigits.some((d) => !d) && !isVerifying
                            ? "bg-[#009A60] hover:bg-[#008754] text-white shadow-md shadow-emerald-700/20 cursor-pointer"
                            : "bg-[#009A60]/35 text-white/75 cursor-not-allowed shadow-none"
                        }`}
                      >
                        {isVerifying ? (
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <ShieldCheck className="h-4 w-4" />
                            <span>Verify & Activate Account</span>
                          </>
                        )}
                      </button>

                      {/* Mailpit Live Link Box */}
                      <div className="mt-6 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            📬 Mailpit Local Inbox
                          </span>
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active (Port 8025)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mb-2">
                          A real email with the 6-digit PIN was sent to Alex's inbox.
                        </p>
                        <div className="flex items-center gap-2">
                          <a
                            href="http://localhost:8025"
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors no-underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Open Mailpit Web UI
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              setOtpDigits(["8", "4", "9", "2", "0", "1"]);
                              showToast("Filled demo code: 849201");
                            }}
                            className="py-1.5 px-2.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-medium transition-colors"
                          >
                            Paste "849201"
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Bottom Home Bar */}
                <div className="h-6 w-full flex items-center justify-center bg-transparent z-20 shrink-0">
                  <div className="w-32 h-1 rounded-full bg-white/30" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dart Code Inspector Drawer */}
        {showInspector && (
          <aside className="w-[480px] border-l border-slate-800 bg-[#0A0F18] flex flex-col z-20 shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Inspector Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0D1522]">
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
                  onClick={() => setShowInspector(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* File Explanation */}
            <div className="px-4 py-3 bg-emerald-950/20 border-b border-emerald-900/30 text-[11px] text-emerald-300">
              {dartCodeMap[activeScreen].summary}
            </div>

            {/* Code Body */}
            <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-300 bg-[#070B11]">
              <pre className="whitespace-pre-wrap select-text">
                {dartCodeMap[activeScreen].snippet}
              </pre>
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
                  Championship Course • Par 72
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
                {HOLE_DATA.slice(0, 9).map((h, i) => (
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
                {HOLE_DATA.slice(9, 18).map((h, i) => (
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
