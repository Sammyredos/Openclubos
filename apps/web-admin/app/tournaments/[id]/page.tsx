"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { Tournament, getTournament } from "@/lib/api/tournaments"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Icons } from "@/components/ui/icons"
import {
  Calendar,
  MapPin,
  Award,
  Users,
  DollarSign,
  Clock,
  ArrowLeft,
  AlertCircle,
  Shield,
  Trophy,
  Info,
  ChevronRight,
  BookOpen
} from "lucide-react"
import { toast } from "sonner"
import { formatWithCommas } from "@/lib/utils"
import Link from "next/link"

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message
  if (typeof e === "string") return e
  if (e && typeof e === "object" && "message" in e && typeof (e as { message?: unknown }).message === "string") {
    return (e as { message: string }).message
  }
  return null
}

const STATUS_META = {
  DRAFT: { label: "Draft", badge: "bg-slate-50 text-gray-600 border border-slate-200" },
  REGISTRATION_OPEN: { label: "Registration Open", badge: "bg-emerald-50 text-openclub-800 border border-emerald-100" },
  ONGOING: { label: "Tournament Ongoing", badge: "bg-blue-50 text-blue-600 border border-blue-100" },
  COMPLETED: { label: "Completed", badge: "bg-violet-50 text-violet-600 border border-violet-100" },
  CANCELLED: { label: "Cancelled", badge: "bg-rose-50 text-rose-600 border border-rose-100" },
}

export default function TournamentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [tournament, setTournament] = React.useState<Tournament | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadTournament() {
      try {
        const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : ""
        if (!id) throw new Error("Tournament not found")
        const match = (await getTournament(id)) as Tournament
        setTournament(match)
      } catch (err: unknown) {
        toast.error(getErrorMessage(err) || "Failed to load tournament")
      } finally {
        setIsLoading(false)
      }
    }
    loadTournament()
  }, [params.id])

  if (isLoading) return (
    <div className="min-h-screen bg-background/50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )

  if (!tournament) return (
    <div className="min-h-screen flex items-center justify-center bg-background/50 p-4">
      <div className="text-center space-y-4 bg-white p-8 md:p-12 rounded-lg border-none shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] max-w-md w-full">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h1 className="text-base text-gray-900">Tournament Not Found</h1>
        <p className="text-gray-500 text-sm">We couldn&apos;t retrieve the details for this tournament. It may have been deleted.</p>
        <Button className="w-full" onClick={() => router.back()}>Go Back</Button>
      </div>
    </div>
  )

  const isRegistrationOpen = tournament.status === "REGISTRATION_OPEN"
  const formattedFee = tournament.entryFee && tournament.entryFee > 0
    ? `₦${formatWithCommas(tournament.entryFee)}`
    : "FREE"

  const statusMeta = STATUS_META[tournament.status] || { label: tournament.status, badge: "bg-gray-50 text-gray-600" }

  return (
    <div className="min-h-screen bg-background/50 p-4 md:p-8 text-gray-700">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Navigation / Header */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm mb-4 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Tournaments</span>
        </button>

        {/* Hero Banner Section */}
        <div className="bg-white rounded-lg border-none overflow-hidden relative shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)]">
          {/* Banner background */}
          <div className="bg-gradient-to-r from-openclub-800 via-openclub-600 to-openclub-400 relative overflow-hidden" style={{ height: "350px" }}>
            {tournament.bannerUrl ? (
              <img
                src={tournament.bannerUrl}
                alt="Tournament Banner"
                className="absolute inset-0 w-full h-full object-cover z-10"
              />
            ) : (
              <div className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.5) 1px, transparent 0)",
                  backgroundSize: "20px 20px"
                }}
              />
            )}
          </div>

          <div className="px-6 md:px-8 pb-6 relative">
            {/* Club logo overlap */}
            <div className="w-20 h-20 rounded-lg bg-white p-1 shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] absolute -top-10 left-6 md:left-8 z-20">
              <div className="w-full h-full rounded-lg overflow-hidden bg-openclub-50 flex items-center justify-center">
                {tournament.club?.logo ? (
                  <img src={tournament.club.logo} alt={tournament.club.name} className="w-full h-full object-cover" />
                ) : (
                  <Trophy className="w-8 h-8 text-openclub-700" />
                )}
              </div>
            </div>

            {/* Title area */}
            <div className="pt-14 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-openclub-700 tracking-wide uppercase">
                    {tournament.club?.name || "Tournament Organizer"}
                  </span>
                  <h1 className="text-xl md:text-2xl text-gray-900 tracking-tight leading-tight">
                    {tournament.name}
                  </h1>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs ${statusMeta.badge}`}>
                  {statusMeta.label}
                </span>
              </div>

              {/* Quick Info bar */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-5 pt-3 border-t border-gray-100 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-openclub-600" />
                  <span>
                    {new Date(tournament.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {tournament.endDate && ` – ${new Date(tournament.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                  </span>
                </div>
                {tournament.course && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-openclub-600" />
                    <span>{tournament.course.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-openclub-600" />
                  <span className="capitalize">{tournament.playerTypes?.join(", ") || "All Players"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Main Info Blocks (Left 2 columns) */}
          <div className="md:col-span-2 space-y-6">

            {/* Description Section */}
            <div className="bg-white rounded-lg border-none p-6 md:p-8 space-y-4 shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)]">
              <div className="flex items-center gap-2 text-gray-900 border-b border-gray-50 pb-3">
                <BookOpen className="w-4 h-4 text-openclub-600" />
                <h2 className="text-base">About the Tournament</h2>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {"description" in tournament && tournament.description
                  ? (tournament as any).description
                  : `Join us for the prestigious ${tournament.name} organized by ${tournament.club?.name || "our Club"}. This event brings players together for an outstanding competitive golf experience on a meticulously maintained course. Players of eligible divisions can confirm their slot and proceed with entry fee payments via the platform to secure their spot on the official roster.`}
              </p>
            </div>

            {/* Rules & Requirements block */}
            <div className="bg-white rounded-lg border-none p-6 md:p-8 space-y-4 shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)]">
              <div className="flex items-center gap-2 text-gray-900 border-b border-gray-50 pb-3">
                <Shield className="w-4 h-4 text-openclub-600" />
                <h2 className="text-base">Entry Guidelines & Restrictions</h2>
              </div>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-openclub-500 mt-2 flex-shrink-0" />
                  <span>Participants must maintain a verified handicap index matching the tournament constraints.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-openclub-500 mt-2 flex-shrink-0" />
                  <span>Entry fees are payable directly upon confirming registration, and deadlines are strictly enforced.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-openclub-500 mt-2 flex-shrink-0" />
                  <span>Day 1 tee times will be published upon closing of registrations. No late entries will be accepted once tournament groupings are finalised.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Quick Stats sidebar (Right 1 column) */}
          <div className="space-y-6">

            {/* Key Information Card */}
            <div className="bg-white rounded-lg border-none p-6 space-y-5 shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)]">
              <h3 className="text-xs text-gray-900 border-b border-gray-50 pb-2 uppercase tracking-wide">
                Tournament Info
              </h3>

              <div className="space-y-4 text-sm">
                {/* Entry Fee */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-openclub-50 border border-openclub-100 flex items-center justify-center flex-shrink-0 text-openclub-700">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider">Entry Fee</p>
                    <p className="text-gray-900 mt-0.5">{formattedFee}</p>
                  </div>
                </div>

                {/* Handicap constraints */}
                {("hasHandicapRestriction" in tournament && (tournament as any).hasHandicapRestriction) || tournament.minHandicap !== undefined || tournament.maxHandicap !== undefined ? (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-openclub-50 border border-openclub-100 flex items-center justify-center flex-shrink-0 text-openclub-700">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider">Handicap Limits</p>
                      <p className="text-gray-900 mt-0.5">
                        {tournament.minHandicap ?? 0} – {tournament.maxHandicap ?? "N/A"}
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* Capacity / Slots */}
                {tournament.maxPlayers && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-openclub-50 border border-openclub-100 flex items-center justify-center flex-shrink-0 text-openclub-700">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider">Roster Size</p>
                      <p className="text-gray-900 mt-0.5">
                        {tournament._count?.registrations ?? 0} / {tournament.maxPlayers} Max Players
                      </p>
                    </div>
                  </div>
                )}

                {/* Registration Close Deadline */}
                {tournament.registrationCloseAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-openclub-50 border border-openclub-100 flex items-center justify-center flex-shrink-0 text-openclub-700">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider">Registration Deadline</p>
                      <p className="text-gray-900 mt-0.5">
                        {new Date(tournament.registrationCloseAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Call-to-action button */}
              <div className="pt-3 border-t border-gray-100">
                {isRegistrationOpen ? (
                  <Link href={`/tournaments/${tournament.id}/register`} className="w-full">
                    <Button className="w-full h-11 bg-openclub-700 hover:bg-openclub-800 text-white rounded-lg flex items-center justify-center gap-2 group">
                      <span>Register to Play</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    className="w-full h-11 bg-gray-100 border border-gray-200 text-gray-400 rounded-lg cursor-not-allowed flex items-center justify-center"
                    disabled
                  >
                    {tournament.status === "COMPLETED" ? "Tournament Completed" : "Registration Closed"}
                  </Button>
                )}
              </div>
            </div>

            {/* Help / Information Box */}
            <div className="bg-openclub-50/60 border border-openclub-100/50 rounded-lg p-5 space-y-2">
              <div className="flex items-center gap-2 text-openclub-900">
                <Info className="w-4 h-4 text-openclub-700" />
                <h4 className="text-sm">Need Assistance?</h4>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                If you have questions about payment validation, guest eligibility, or handicap restrictions, please contact the golf organizer club directly{tournament.club?.email ? ` at ${tournament.club.email}` : ''}.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
