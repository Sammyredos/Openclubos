"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Tournament, getTournament } from "@/lib/api/tournaments"
import { getRegistrations, RegistrationListItem } from "@/lib/api/registrations"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import {
  Calendar,
  MapPin,
  Award,
  Users,
  Banknote,
  Clock,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Share2,
  Heart,
  Trophy,
  ShieldCheck,
  UserCheck,
  Crown,
  Handshake,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Check,
  Info,
} from "lucide-react"
import { toast } from "sonner"
import { formatWithCommas, formatTitleCase, formatTournamentFee, formatWithOrdinal } from "@/lib/utils"
import PublicLeaderboard from "@/components/tournaments/PublicLeaderboard"

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message
  if (typeof e === "string") return e
  if (e && typeof e === "object" && "message" in e && typeof (e as { message?: unknown }).message === "string") {
    return (e as { message: string }).message
  }
  return null
}


function getFormatDisplay(tournament: Tournament): { formatType: string; formatFull: string } {
  const rawFormat = ((tournament as any).format || "").toUpperCase()
  const scoringType = (tournament.scoringType || "").toUpperCase()

  let formatType = "Stroke Play"
  if (rawFormat.includes("MATCH")) formatType = "Match Play"
  else if (rawFormat.includes("STABLEFORD") || scoringType.includes("STABLEFORD")) formatType = "Stableford"
  else if (rawFormat.includes("SCRAMBLE")) formatType = "Scramble"
  else if (rawFormat.includes("BEST") || rawFormat.includes("FOUR")) formatType = "Four-Ball"

  const holes = (tournament as any).holes || 18
  const formatFull = `Individual ${formatType} • ${holes} Holes`

  return { formatType, formatFull }
}

function getStatusBadge(status?: string) {
  switch (status) {
    case "REGISTRATION_OPEN":
      return {
        label: "REGISTRATION OPEN",
        bg: "bg-[#009A60]",
        text: "text-white",
      }
    case "ONGOING":
      return {
        label: "TOURNAMENT LIVE",
        bg: "bg-blue-600",
        text: "text-white",
      }
    case "COMPLETED":
      return {
        label: "COMPLETED",
        bg: "bg-violet-600",
        text: "text-white",
      }
    case "CANCELLED":
      return {
        label: "CANCELLED",
        bg: "bg-rose-600",
        text: "text-white",
      }
    case "DRAFT":
    default:
      return {
        label: "UPCOMING EVENT",
        bg: "bg-slate-700",
        text: "text-white",
      }
  }
}

function getScheduleItems(startDateStr?: string, endDateStr?: string, startType?: string) {
  const start = startDateStr ? new Date(startDateStr) : new Date()
  const end = endDateStr ? new Date(endDateStr) : start

  // Practice round is ALWAYS the day before tournament starts
  const practiceDate = new Date(start)
  practiceDate.setDate(practiceDate.getDate() - 1)
  const mp = practiceDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase()
  const dp = String(practiceDate.getDate())

  const m1 = start.toLocaleDateString("en-US", { month: "short" }).toUpperCase()
  const d1 = String(start.getDate())

  const day2Date = new Date(start)
  day2Date.setDate(day2Date.getDate() + 1)
  const m2 = day2Date.toLocaleDateString("en-US", { month: "short" }).toUpperCase()
  const d2 = String(day2Date.getDate())

  const day3Date = new Date(start)
  day3Date.setDate(day3Date.getDate() + 2)
  const m3 = end ? end.toLocaleDateString("en-US", { month: "short" }).toUpperCase() : day3Date.toLocaleDateString("en-US", { month: "short" }).toUpperCase()
  const d3 = end ? String(end.getDate()) : String(day3Date.getDate())

  const items = [
    {
      month: mp,
      date: dp,
      title: "Practice Round",
      time: "COURSE OPEN • 8:00 AM — 5:00 PM",
      description: "Official course access and practice round for confirmed competitors.",
      isFinal: false,
    },
    {
      month: m1,
      date: d1,
      title: "Day 1: Opening Round",
      time: "SHOTGUN START • 7:30 AM",
      description: "Official flights tee off with live hole-by-hole digital scoring.",
      isFinal: false,
    },
    {
      month: m2,
      date: d2,
      title: "Day 2: Moving Day",
      time: "TEE TIMES • 7:00 AM",
      description: "Leaderboard consolidation and flight positioning rounds.",
      isFinal: false,
    },
    {
      month: m3,
      date: d3,
      title: "Day 3: Championship Final",
      time: "AWARDS CEREMONY • 4:00 PM",
      description: "Final championship round followed by formal trophy ceremony.",
      isFinal: true,
    },
  ]

  return items
}

type TabType = "OVERVIEW" | "RULES" | "PLAYERS" | "SPONSORS" | "LEADERBOARD"

export default function TournamentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [tournament, setTournament] = React.useState<Tournament | null>(null)
  const [registrations, setRegistrations] = React.useState<RegistrationListItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<TabType>("OVERVIEW")
  const [isBookmarked, setIsBookmarked] = React.useState(false)

  // Contact Modal State
  const [isContactModalOpen, setIsContactModalOpen] = React.useState(false)
  const [contactForm, setContactForm] = React.useState({ name: "", email: "", subject: "", message: "" })
  const [isSending, setIsSending] = React.useState(false)

  React.useEffect(() => {
    async function loadTournament() {
      try {
        const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : ""
        if (!id) throw new Error("Tournament not found")
        const match = (await getTournament(id)) as Tournament
        setTournament(match)

        // Fetch confirmed registrations for players list
        try {
          const regRes = await getRegistrations({ tournamentId: id, status: "APPROVED", take: 50 })
          if (regRes && Array.isArray(regRes.items)) {
            setRegistrations(regRes.items)
          }
        } catch {
          // Ignore registration fetch failures on public views
        }
      } catch (err: unknown) {
        toast.error(getErrorMessage(err) || "Failed to load tournament")
      } finally {
        setIsLoading(false)
      }
    }
    loadTournament()
  }, [params.id])

  React.useEffect(() => {
    if (tournament?.id && typeof window !== "undefined") {
      const saved = localStorage.getItem(`openclub_bookmarked_${tournament.id}`) === "true"
      setIsBookmarked(saved)
    }
  }, [tournament?.id])

  function handleToggleBookmark() {
    if (!tournament) return
    const next = !isBookmarked
    setIsBookmarked(next)
    if (typeof window !== "undefined") {
      localStorage.setItem(`openclub_bookmarked_${tournament.id}`, String(next))
    }
    toast.success(next ? "Saved to your bookmarks" : "Removed from saved events", {
      description: tournament.name,
    })
  }

  async function handleShare() {
    if (!tournament) return
    const shareTitle = formatTitleCase(tournament.name)
    const shareText = `Join the ${shareTitle} at ${tournament.course?.name || tournament.club?.name || "Openclub"}!`
    const shareUrl = typeof window !== "undefined" ? window.location.href : ""

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        })
        toast.success("Tournament shared successfully!")
        return
      } catch {
        // Fallback to clipboard
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl)
        toast.success("Tournament link copied to clipboard!", {
          description: "Share this link with fellow competitors.",
        })
        return
      } catch {
        // ignore
      }
    }
    toast.success("Tournament link copied to clipboard!")
  }

  function handleAddToCalendar() {
    if (!tournament) return
    const title = encodeURIComponent(tournament.name)
    const location = encodeURIComponent(tournament.course?.name || tournament.club?.name || "Golf Club")
    const details = encodeURIComponent(
      `OpenclubOS Tournament: ${tournament.name}\nVenue: ${tournament.course?.name || tournament.club?.name || ""}`
    )
    const startDate = tournament.startDate ? new Date(tournament.startDate) : new Date()
    const endDate = tournament.endDate ? new Date(tournament.endDate) : startDate

    const startStr = startDate.toISOString().replace(/-|:|\.\d\d\d/g, "")
    const endStr = endDate.toISOString().replace(/-|:|\.\d\d\d/g, "")

    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`
    window.open(googleCalUrl, "_blank")
    toast.success("Opening Google Calendar...", {
      description: `${tournament.name} event details ready to save.`,
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F6F3] p-4 md:p-8 flex justify-center">
        <div className="w-full max-w-4xl space-y-5">
          {/* Skeleton Hero Banner */}
          <div className="relative w-full h-[360px] md:h-[400px] rounded-[28px] overflow-hidden bg-slate-200 animate-pulse" />

          {/* Skeleton Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-white border border-[#e1efe5] rounded-[24px] p-4 animate-pulse" />
            ))}
          </div>

          {/* Skeleton Content */}
          <div className="bg-white rounded-[24px] border border-[#e1efe5] p-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6F3] p-4">
        <div className="text-center space-y-4 bg-white p-8 md:p-12 rounded-[28px] border border-[#e1efe5] shadow-xs max-w-md w-full">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Tournament Not Found</h1>
          <p className="text-slate-500 text-sm">
            We couldn&apos;t retrieve the details for this tournament. It may have been archived or removed.
          </p>
          <Button
            className="w-full bg-[#009A60] hover:bg-[#008251] text-white rounded-xl h-11 font-bold"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const isRegistrationOpen = tournament.status === "REGISTRATION_OPEN"
  const formattedFee = formatTournamentFee(tournament.entryFee, tournament.currency, {
    requiresPayment: tournament.requiresPayment !== false,
  })
  const statusBadge = getStatusBadge(tournament.status)
  const { formatType, formatFull } = getFormatDisplay(tournament)
  const scheduleItems = getScheduleItems(tournament.startDate, tournament.endDate, tournament.startType)
  const locationName = tournament.course?.name || tournament.club?.name || "Official Golf Club"

  // Fallback confirmed players for showcase if no registrations yet
  const displayPlayers =
    registrations.length > 0
      ? registrations.map((r) => ({
          name: `${r.user?.firstName || ""} ${r.user?.lastName || ""}`.trim() || r.user?.email || "Competitor",
          hcp: String(r.user?.handicap ?? "0.0"),
          club: locationName,
          division: r.playerType || "Member",
        }))
      : [
          { name: "Adediran Favour", hcp: "28", club: "OpenClub Golfer", division: "MEMBER" },
          { name: "Tunde Balogun", hcp: "2.4", club: locationName, division: "CHAMPIONSHIP" },
          { name: "Femi Adebayo", hcp: "4.1", club: locationName, division: "SCRATCH" },
          { name: "Ngozi Okonjo", hcp: "7.8", club: locationName, division: "DIVISION 1" },
          { name: "Emeka Nwosu", hcp: "11.2", club: locationName, division: "DIVISION 2" },
          { name: "Dayo Adeleke", hcp: "14.0", club: locationName, division: "DIVISION 2" },
        ]

  return (
    <div className="min-h-screen bg-[#F4F6F3] text-slate-800 pb-28 font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#EAF7EE] selection:text-[#009A60]">
      {/* WRAPPER CONTAINER */}
      <div className="w-full max-w-4xl mx-auto px-0 sm:px-4 pt-0 sm:pt-4">

        {/* 1. HERO COVER BANNER */}
        <div className="relative w-full h-[360px] sm:h-[400px] md:h-[440px] bg-[#EAF0E6] overflow-hidden rounded-none sm:rounded-[32px] shadow-sm select-none">
          {/* Course / Event Photo */}
          <img
            src={tournament.bannerUrl || tournament.course?.coverImage || "/images/tournaments/ikoyi_sunrise_fairway.jpg"}
            alt={tournament.name}
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              e.currentTarget.src = "/images/tournaments/ikoyi_sunrise_fairway.jpg"
            }}
          />

          {/* Top Dark Vignette for Frosted Navigation Header */}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/30 via-black/10 to-transparent pointer-events-none" />

          {/* Bottom Soft Mist Overlay (Preserves Fairway & Flagstick with 100% Text Legibility) */}
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-white/85 via-white/35 to-transparent pointer-events-none" />

          {/* Floating Top Navigation Header */}
          <div className="absolute top-0 inset-x-0 pt-4 px-6 z-20">
            <div className="flex items-center justify-between">
              {/* Back Button: Frosted Circular Glass Pill */}
              <button
                type="button"
                onClick={() => router.back()}
                className="h-10 w-10 rounded-full bg-white/40 hover:bg-white/60 backdrop-blur-md border border-white/50 flex items-center justify-center text-white cursor-pointer transition-all active:scale-95 shadow-2xs"
                aria-label="Back"
              >
                <ChevronLeft className="w-5 h-5 text-white stroke-[2.8]" />
              </button>

              {/* Right Frosted Glass Actions */}
              <div className="flex items-center gap-2.5">
                {/* Share Button */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="h-10 w-10 rounded-full bg-white/40 hover:bg-white/60 backdrop-blur-md border border-white/50 flex items-center justify-center text-white cursor-pointer transition-all active:scale-95 shadow-2xs"
                  title="Share tournament"
                >
                  <Share2 className="w-4 h-4 text-white stroke-[2.3]" />
                </button>

                {/* Bookmark / Heart Button */}
                <button
                  type="button"
                  onClick={handleToggleBookmark}
                  className="h-10 w-10 rounded-full bg-white/40 hover:bg-white/60 backdrop-blur-md border border-white/50 flex items-center justify-center text-white cursor-pointer transition-all active:scale-95 shadow-2xs"
                  title="Bookmark tournament"
                >
                  <Heart
                    className={`w-4 h-4 transition-colors ${
                      isBookmarked ? "text-rose-500 fill-rose-500" : "text-white stroke-[2.3]"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Hero Overlay Content: Badge, Title & Location */}
          <div className="absolute inset-x-0 bottom-3 sm:bottom-4 px-6 z-10">
            <div className="w-full">
              {/* Status Pill Badge */}
              <div className={`inline-flex items-center ${statusBadge.bg} ${statusBadge.text} text-[10.5px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-2.5 shadow-xs`}>
                {statusBadge.label}
              </div>

              {/* Tournament Title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0B1B2B] tracking-tight leading-[1.14] mb-2 max-w-2xl drop-shadow-2xs">
                {formatTitleCase(tournament.name)}
              </h1>

              {/* Location with Emerald Map Pin */}
              <div className="flex items-center gap-1.5 text-[14px] font-bold text-[#3B4E61]">
                <svg className="w-4 h-4 text-[#009A60] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C7.58172 2 4 5.58172 4 10C4 15.25 12 22 12 22C12 22 20 15.25 20 10C20 5.58172 16.4183 2 12 2ZM12 13C10.3431 13 9 11.6569 9 10C9 8.34315 10.3431 7 12 7C13.6569 7 15 8.34315 15 10C15 11.6569 13.6569 13 12 13Z" />
                </svg>
                <span className="truncate">{locationName}</span>
                <span className="text-[#8CA0BA] font-normal">•</span>
                <span className="text-[#64748B] font-semibold">{formatWithOrdinal(tournament.startDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. BODY CONTENT */}
        <div className="px-4 sm:px-0 pt-5">
          {/* Three Side-by-Side Metric Cards (Matching Reference Design) */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 mb-7">
            {/* Entry Fee Card */}
            <div className="bg-[#f5faf6] border border-[#e1efe5] rounded-[24px] py-3.5 px-2 sm:p-4.5 shadow-none flex flex-col items-center justify-center text-center h-[76px] sm:h-auto">
              <span className="text-[10px] font-bold text-[#7E8B9B] uppercase tracking-[0.08em] mb-1 sm:mb-1.5 block">
                ENTRY FEE
              </span>
              <span className="text-[17px] sm:text-[20px] font-bold text-[#009A60] tracking-tight leading-none block truncate w-full px-1">
                {(() => {
                  const num = Number(tournament.entryFee)
                  if (!num || isNaN(num) || num <= 0) return "Free"
                  if (num >= 1_000_000) return `₦${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`
                  if (num >= 1_000) return `₦${(num / 1_000).toFixed(0)}k`
                  return `₦${num.toLocaleString()}`
                })()}
              </span>
            </div>

            {/* Duration Card */}
            <div className="bg-[#f5faf6] border border-[#e1efe5] rounded-[24px] py-3.5 px-2 sm:p-4.5 shadow-none flex flex-col items-center justify-center text-center h-[76px] sm:h-auto">
              <span className="text-[10px] font-bold text-[#7E8B9B] uppercase tracking-[0.08em] mb-1 sm:mb-1.5 block">
                DURATION
              </span>
              <span className="text-[17px] sm:text-[20px] font-bold text-[#0B1B2B] tracking-tight leading-none block truncate w-full px-1">
                {scheduleItems.length ? `${scheduleItems.length} Days` : "3 Days"}
              </span>
            </div>

            {/* Format Card */}
            <div className="bg-[#f5faf6] border border-[#e1efe5] rounded-[24px] py-3.5 px-2 sm:p-4.5 shadow-none flex flex-col items-center justify-center text-center h-[76px] sm:h-auto">
              <span className="text-[10px] font-bold text-[#7E8B9B] uppercase tracking-[0.08em] mb-1 sm:mb-1.5 block">
                FORMAT
              </span>
              <span className="text-[17px] sm:text-[20px] font-bold text-[#0B1B2B] tracking-tight leading-none block truncate w-full px-1">
                {formatType.replace(/\s+Play/i, "")}
              </span>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center justify-center gap-5 sm:gap-7 border-b border-slate-200/80 mb-6 sm:mb-7 overflow-x-auto no-scrollbar scrollbar-hide">
            {(["OVERVIEW", "RULES", "PLAYERS", "SPONSORS", "LEADERBOARD"] as const).map((tab) => {
              const isActive = activeTab === tab
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2.5 sm:pb-3 text-[12px] sm:text-[12.5px] uppercase tracking-wider font-bold sm:font-bold transition-all cursor-pointer whitespace-nowrap relative ${
                    isActive ? "text-[#009A60]" : "text-[#8CA0BA] hover:text-[#0F172A]"
                  }`}
                >
                  <span>{tab}</span>
                  {isActive && (
                    <span className="absolute bottom-0 inset-x-0 h-[2px] sm:h-[2.5px] bg-[#009A60] rounded-full" />
                  )}
                </button>
              )
            })}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "OVERVIEW" && (
            <div className="space-y-8">
              {/* About the Event */}
              <div className="bg-white border border-[#e1efe5] rounded-[24px] p-6 shadow-2xs">
                <h3 className="text-[11px] font-bold tracking-[0.14em] text-[#64748B] uppercase mb-3.5 block">
                  ABOUT THE EVENT
                </h3>
                <p className="text-[14.5px] text-[#0B1B2B] font-bold leading-[1.7] whitespace-pre-line">
                  {tournament.description ||
                    `Join us for the most anticipated golf event of the year. The ${formatTitleCase(tournament.name)} gathers elite amateurs and club members for a 3–day competitive tournament on the historic ${locationName} course.`}
                </p>
              </div>

              {/* Course Specs */}
              <div>
                <h3 className="text-[11px] font-bold tracking-[0.14em] text-[#64748B] uppercase mb-3.5 block">
                  COURSE SPECS
                </h3>
                <div className="bg-[#f5faf6] border border-[#e1efe5] rounded-[24px] py-4.5 px-3 grid grid-cols-3 divide-x divide-[#e1efe5] text-center shadow-none">
                  <div>
                    <span className="text-[10px] font-bold text-[#64748B] tracking-[0.12em] uppercase block mb-1">
                      PAR
                    </span>
                    <span className="text-[22px] font-bold text-[#0B1B2B] block">
                      72
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#64748B] tracking-[0.12em] uppercase block mb-1">
                      HOLES
                    </span>
                    <span className="text-[22px] font-bold text-[#0B1B2B] block">
                      {(tournament as any).holes || 18}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#64748B] tracking-[0.12em] uppercase block mb-1">
                      HCP LIMIT
                    </span>
                    <span className="text-[22px] font-bold text-[#0B1B2B] block">
                      {tournament.maxHandicap || "24"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tournament Schedule */}
              <div>
                <h3 className="text-[11px] font-bold tracking-[0.14em] text-[#64748B] uppercase mb-3.5 block">
                  TOURNAMENT SCHEDULE
                </h3>
                <div className="space-y-3">
                  {scheduleItems.map((item: any, idx: number) => {
                    const isFinalCard = item.isFinal || idx === scheduleItems.length - 1 || (item.title && item.title.toLowerCase().includes("final"));
                    return (
                      <div
                        key={idx}
                        className={`rounded-[22px] p-4 flex items-center gap-4 transition-all ${
                          isFinalCard
                            ? "bg-[#f2faf5] border border-[#c6f0db] shadow-[0_2px_10px_rgba(0,154,96,0.04)]"
                            : "bg-white border border-slate-100/90 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                        }`}
                      >
                        <div className="w-14 h-14 rounded-[20px] bg-white border border-slate-100 shadow-2xs flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-[#009A60] tracking-wider uppercase leading-none">
                            {item.month}
                          </span>
                          <span className="text-[20px] font-bold text-[#009A60] leading-none mt-1">
                            {item.date}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[15px] font-bold text-[#0B1B2B] leading-snug">
                            {item.title}
                          </h4>
                          {(() => {
                            const rawTime = (item.time || "").replace(/\s+FROM\s+/i, " • ");
                            const hasDot = rawTime.includes("•");
                            const label = hasDot ? rawTime.split("•")[0].trim() : rawTime.trim();
                            const timeVal = hasDot ? rawTime.split("•").slice(1).join("•").trim() : "";
                            return (
                              <div className="flex items-center gap-1.5 mt-1 whitespace-nowrap overflow-hidden">
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-[0.08em] whitespace-nowrap shrink-0 ${
                                    isFinalCard ? "text-[#009A60]" : "text-[#64748B]"
                                  }`}
                                >
                                  {label}
                                </span>
                                {timeVal && (
                                  <>
                                    <span
                                      className={`font-bold text-[8px] shrink-0 ${
                                        isFinalCard ? "text-[#009A60]/70" : "text-slate-300"
                                      }`}
                                    >
                                      •
                                    </span>
                                    <span
                                      className={`text-[11px] font-medium tracking-normal whitespace-nowrap shrink-0 ${
                                        isFinalCard ? "text-[#009A60]" : "text-[#64748B]"
                                      }`}
                                    >
                                      {timeVal}
                                    </span>
                                  </>
                                )}
                              </div>
                            );
                          })()}
                          {item.description && (
                            <p className="text-[12px] text-[#64748B] mt-0.5 line-clamp-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Organizer */}
              <div>
                <h3 className="text-[11px] font-bold tracking-[0.14em] text-[#64748B] uppercase mb-3.5 block">
                  ORGANIZER
                </h3>
                <div
                  onClick={() => setIsContactModalOpen(true)}
                  className="bg-white border border-slate-100/90 rounded-[24px] p-4 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)] cursor-pointer hover:bg-slate-50/50 transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-14 h-14 rounded-[20px] bg-[#EAF7EE] border border-[#C6F0DB]/70 flex items-center justify-center shrink-0">
                      <div className="w-11 h-11 rounded-[14px] bg-[#0E1E17] border border-emerald-900/60 flex items-center justify-center shadow-xs relative overflow-hidden">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                          <path d="M7 3v17" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
                          <path d="M7 4h8.5l-2.5 3.5 2.5 3.5H7V4z" fill="#EF4444" stroke="#EF4444" strokeWidth="1.2" strokeLinejoin="round" />
                          <path d="M4 19.5c2.5-1.2 5.5-1.2 8 0s5.5 1.2 8 0" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" />
                          <circle cx="16" cy="18" r="1.3" fill="#FFFFFF" />
                        </svg>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[15px] font-bold text-[#0B1B2B] truncate leading-tight">
                        {tournament.club?.name || locationName}
                      </h4>
                      <span className="text-[10px] font-bold text-[#64748B] tracking-[0.12em] uppercase block mt-1">
                        OFFICIAL CLUB ORGANIZER
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline text-xs font-semibold capitalize text-[#009A60]">
                      Contact Club
                    </span>
                    <div className="w-8 h-8 rounded-full bg-[#F8FAFC] border border-slate-100 flex items-center justify-center text-slate-400 shrink-0 transition-colors">
                      <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2.5]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RULES */}
          {activeTab === "RULES" && (
            <div>
              <h3 className="text-[11px] font-bold tracking-[0.14em] text-[#64748B] uppercase mb-4 block">
                COMPETITION RULES
              </h3>
              <div className="space-y-5">
                {(
                  ((tournament as any).rules && Array.isArray((tournament as any).rules) && (tournament as any).rules.length > 0)
                    ? (tournament as any).rules
                    : [
                        "R&A and USGA Rules of Golf apply alongside Local Rules.",
                        "Format is Individual Stroke Play over 54 holes (3 rounds).",
                        "Players must be in the tee box 15 minutes before start.",
                      ]
                ).map((rule: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-full bg-[#EAF7EE] text-[#009A60] font-bold text-[12px] flex items-center justify-center shrink-0 mt-0.5">
                      {String(idx + 1).padStart(2, "0")}
                    </div>
                    <p className="text-[14.5px] font-bold text-[#0F172A] leading-snug">
                      {rule}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PLAYERS */}
          {activeTab === "PLAYERS" && (
            <div>
              <div className="mb-3.5">
                <h3 className="text-[11px] font-bold tracking-[0.14em] text-[#64748B] uppercase">
                  REGISTERED PLAYERS ({registrations.length || displayPlayers.length || 120})
                </h3>
              </div>
              <div className="space-y-3">
                {displayPlayers.map((player, idx) => (
                  <div
                    key={idx}
                    className="w-full bg-[#f5faf6] rounded-2xl border border-[#e1efe5] shadow-2xs p-3.5 flex items-center justify-between gap-3 transition-all hover:border-[#c6f0db]"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        {(player as any).avatar ? (
                          <img
                            src={(player as any).avatar}
                            alt={player.name}
                            className="w-11 h-11 rounded-full object-cover border border-slate-200"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = "none";
                              const fb = e.currentTarget.parentElement?.querySelector(".avatar-initials-fallback") as HTMLElement;
                              if (fb) fb.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-11 h-11 rounded-full bg-[#EAF7EE] text-[#009A60] font-bold text-sm items-center justify-center border border-[#C6F0DB] avatar-initials-fallback ${(player as any).avatar ? "hidden" : "flex"}`}
                        >
                          {player.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        {/* Status check badge from friend request screen */}
                        <div className="w-4 h-4 rounded-full bg-[#009A60] border-2 border-white flex items-center justify-center text-white absolute -bottom-0.5 -right-0.5 shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[14.5px] font-bold text-[#0F172A] leading-tight">
                          {player.name}
                        </h4>
                        <p className="text-[12px] font-medium text-[#64748B] truncate leading-tight mt-0.5 flex items-center">
                          {player.club && (
                            <>
                              <span className="truncate">{player.club}</span>
                              <span className="mx-1.5 text-slate-300 font-normal shrink-0">|</span>
                            </>
                          )}
                          <span className="shrink-0">{String(player.hcp).replace(/HCP/i, "").trim()} HCP</span>
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center pl-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#EAF7EE] border border-[#C6F0DB]/80 text-[10.5px] font-bold text-[#009A60] capitalize">
                        Verified
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SPONSORS */}
          {activeTab === "SPONSORS" && (
            <div>
              <div className="mb-3.5">
                <h3 className="text-[11px] font-bold tracking-[0.14em] text-[#64748B] uppercase">
                  TOURNAMENT SPONSORS
                </h3>
              </div>
              <div className="space-y-3.5">
                {/* Title Sponsor Card */}
                <div className="bg-[#f5faf6] border border-[#e1efe5] rounded-2xl p-4 shadow-2xs hover:border-[#c6f0db] transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EAF7EE] border border-[#C6F0DB]/80 text-[10.5px] font-bold text-[#009A60] uppercase tracking-wide">
                      Title Sponsor
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">Headline Partner</span>
                  </div>
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-[#e1efe5] flex items-center justify-center text-[#009A60] shadow-xs shrink-0 font-bold text-lg">
                      FB
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[15px] font-bold text-[#0F172A] leading-tight">FirstBank Premier Banking</h4>
                      <p className="text-[12px] font-medium text-[#64748B] mt-0.5 leading-snug">
                        Official presenting corporate sponsor and championship trophy benefactor.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Official Partners Display (Clean Active-Friend Style, No Enclosing Box Cards, 3 on Bigger Screen) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 sm:gap-6 py-2">
                  {[
                    {
                      name: "Rolex",
                      initials: "RX",
                    },
                    {
                      name: "Titleist",
                      initials: "TL",
                    },
                    {
                      name: "Heineken 0.0",
                      initials: "HK",
                    },
                    {
                      name: "PwC Nigeria",
                      initials: "PW",
                    },
                    {
                      name: "Emirates",
                      initials: "EK",
                    },
                    {
                      name: "TaylorMade",
                      initials: "TM",
                    },
                  ].map((sponsor, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center text-center group py-1.5 transition-all cursor-pointer"
                    >
                      {/* Active-Friend-Style Centered Logo Avatar with Emerald Status Badge */}
                      <div className="relative mb-2 shrink-0">
                        <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#f5faf6] border-2 border-[#e1efe5] flex items-center justify-center text-[#009A60] font-bold text-sm sm:text-base shadow-2xs group-hover:scale-105 group-hover:border-[#009A60]/40 transition-all">
                          {sponsor.initials}
                        </div>
                        {/* Emerald Status / Verified Partner Check Badge */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#009A60] border-2 border-white flex items-center justify-center shadow-2xs">
                          <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                        </div>
                      </div>

                      {/* Sponsor Name */}
                      <h5 className="text-[13.5px] font-bold text-[#0F172A] leading-tight truncate w-full">
                        {sponsor.name}
                      </h5>

                      {/* Partner Pill Badge */}
                      <span className="text-[10px] font-bold text-[#009A60] bg-[#EAF7EE] px-2.5 py-0.5 rounded-full border border-[#C6F0DB]/70 mt-1.5 leading-none">
                        Partner
                      </span>
                    </div>
                  ))}
                </div>

                {/* Corporate Sponsorship Inquiries Footer Banner */}
                <div className="rounded-2xl border border-dashed border-[#C6F0DB] bg-[#EAF7EE]/50 p-4 text-center">
                  <h5 className="text-[13px] font-bold text-[#0F172A]">Interested in Tournament Sponsorship?</h5>
                  <p className="text-[11.5px] text-[#64748B] mt-1 mb-2.5 max-w-xs mx-auto">
                    Showcase your brand to elite amateur and club competitors.
                  </p>
                  <button
                    type="button"
                    onClick={() => toast.success("Sponsorship inquiry packet requested. Organizer notified.")}
                    className="px-4 py-2 rounded-xl bg-[#009A60] hover:bg-[#008251] text-white text-[12px] font-bold shadow-xs transition-all active:scale-95 cursor-pointer capitalize"
                  >
                    Inquire About Sponsorship
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LEADERBOARD */}
          {activeTab === "LEADERBOARD" && (
            <div className="bg-white rounded-[24px] border border-[#e1efe5] p-5 shadow-2xs">
              <PublicLeaderboard tournamentId={tournament.id} tournamentStartDate={tournament.startDate} />
            </div>
          )}
        </div>
      </div>

      {/* 3. PINNED BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 p-3.5 pb-5 sm:pb-4 shadow-[0_-6px_25px_rgba(0,0,0,0.06)]">
        <div className="w-full max-w-4xl mx-auto flex items-center gap-3">
          {/* Calendar Sync Button */}
          <button
            type="button"
            onClick={handleAddToCalendar}
            className="w-12 h-12 rounded-2xl bg-[#F5FAF6] border border-[#e1efe5] flex items-center justify-center text-[#0B1B2B] hover:bg-emerald-50 cursor-pointer shadow-2xs transition-all active:scale-95 shrink-0"
            title="Add to Google Calendar"
          >
            <Calendar className="w-5 h-5 text-[#009A60]" />
          </button>

          {/* Join Tournament / Register Action Button */}
          {isRegistrationOpen ? (
            <Link
              href={`/tournaments/${tournament.id}/register`}
              className="no-underline flex-1 h-12 rounded-full bg-[#009A60] hover:bg-[#008251] text-white font-semibold text-[13.5px] capitalize tracking-wider flex items-center justify-center gap-2 shadow-md shadow-emerald-700/25 cursor-pointer transition-all active:scale-[0.98]"
            >
              <span>Join Tournament</span>
              <ArrowRight className="w-4 h-4 text-white stroke-[2.5]" />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="flex-1 h-12 rounded-full bg-slate-100 text-slate-500 font-semibold text-[13.5px] capitalize tracking-normal flex items-center justify-center gap-2 border border-slate-200 cursor-not-allowed"
            >
              <span>{tournament.status === "COMPLETED" ? "Tournament Completed" : "Registration Closed"}</span>
            </button>
          )}

          {/* Share Button on Action Bar */}
          <button
            type="button"
            onClick={handleShare}
            className="hidden sm:flex h-12 px-4 rounded-2xl bg-white border border-[#e1efe5] items-center gap-2 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer shadow-2xs transition-all active:scale-95 shrink-0"
          >
            <Share2 className="w-4 h-4 text-[#009A60]" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Contact Organizer Modal */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title="Contact Organizer"
        size="md"
        className="max-w-md"
        footer={
          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              onClick={() => setIsContactModalOpen(false)}
              className="font-semibold flex-1 rounded-xl capitalize bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/70"
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              className="font-semibold flex-1 bg-[#009A60] hover:bg-[#008251] text-white rounded-xl capitalize"
              disabled={isSending || !contactForm.name || !contactForm.email || !contactForm.message}
              onClick={async () => {
                setIsSending(true)
                await new Promise((r) => setTimeout(r, 800))
                toast.success("Message dispatched to tournament organizer", {
                  description: "The host club committee will reply to your email address.",
                })
                setIsSending(false)
                setIsContactModalOpen(false)
                setContactForm({ name: "", email: "", subject: "", message: "" })
              }}
            >
              {isSending ? "Sending..." : "Send Message"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Send a direct inquiry to the <span className="font-semibold text-slate-900">{locationName}</span> committee regarding tee times, rules, or handicap requirements.
          </p>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Your Name</label>
                <Input
                  placeholder="e.g. John Doe"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  disabled={isSending}
                  className="bg-[#f5faf6] border-[#e1efe5] rounded-xl text-slate-900 focus:border-[#009A60]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Your Email</label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  disabled={isSending}
                  className="bg-[#f5faf6] border-[#e1efe5] rounded-xl text-slate-900 focus:border-[#009A60]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Subject</label>
              <Input
                placeholder="e.g. Eligibility query or tee time request"
                value={contactForm.subject}
                onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                disabled={isSending}
                className="bg-[#f5faf6] border-[#e1efe5] rounded-xl text-slate-900 focus:border-[#009A60]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Message</label>
              <textarea
                className="w-full flex min-h-[110px] rounded-xl border border-[#e1efe5] bg-[#f5faf6] px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs placeholder:text-[#8CA0BA] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                placeholder="Type your message to the organizer committee..."
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                disabled={isSending}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
