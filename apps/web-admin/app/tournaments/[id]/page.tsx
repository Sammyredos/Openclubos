"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { Tournament, getTournament } from "@/lib/api/tournaments"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/ui/icons"
import {
  Calendar,
  MapPin,
  Award,
  Users,
  Banknote,
  Clock,
  ArrowLeft,
  AlertCircle,
  Shield,
  Trophy,
  Info,
  ChevronRight,
  BookOpen,
  Share2
} from "lucide-react"
import { toast } from "sonner"
import { formatWithCommas } from "@/lib/utils"
import Link from "next/link"
import PublicLeaderboard from "@/components/tournaments/PublicLeaderboard"

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message
  if (typeof e === "string") return e
  if (e && typeof e === "object" && "message" in e && typeof (e as { message?: unknown }).message === "string") {
    return (e as { message: string }).message
  }
  return null
}

const STATUS_META = {
  DRAFT: { label: "Draft", badge: "bg-slate-50 text-gray-600 font-medium border border-slate-200" },
  REGISTRATION_OPEN: { label: "Registration Open", badge: "bg-emerald-50 font-medium text-openclub-800 border border-emerald-100" },
  ONGOING: { label: "Tournament Ongoing", badge: "bg-blue-50 font-medium text-blue-600 border border-blue-100" },
  COMPLETED: { label: "Completed", badge: "bg-violet-50 font-medium text-violet-600 border border-violet-100" },
  CANCELLED: { label: "Cancelled", badge: "bg-rose-50 font-medium text-rose-600 border border-rose-100" },
}

export default function TournamentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [tournament, setTournament] = React.useState<Tournament | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<"registration" | "leaderboard">("registration")

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
      } catch (err: unknown) {
        toast.error(getErrorMessage(err) || "Failed to load tournament")
      } finally {
        setIsLoading(false)
      }
    }
    loadTournament()
  }, [params.id])

  if (isLoading) return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Hero Banner Section Skeleton */}
        <div className="bg-white rounded-lg border-none overflow-hidden relative shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)]">
          <Skeleton className="w-full h-[350px] rounded-none" />
          <div className="px-6 md:px-8 pb-6 relative">
            <div className="w-20 h-20 rounded-lg absolute -top-10 left-6 md:left-8 z-20">
              <Skeleton className="w-full h-full rounded-lg" />
            </div>
            <div className="pt-14 space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-6 w-64" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <div className="flex gap-5 pt-3 border-t border-gray-100">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="bg-white rounded-lg border-none p-6 md:p-8 space-y-4 shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)]">
              <Skeleton className="h-5 w-48 mb-6" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
            <div className="bg-white rounded-lg border-none p-6 md:p-8 space-y-4 shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex-1">
              <Skeleton className="h-5 w-56 mb-6" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 h-full">
            <div className="bg-white rounded-lg border-none p-6 space-y-5 shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)]">
              <Skeleton className="h-5 w-36 mb-4" />
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <Skeleton className="h-11 w-full rounded-lg" />
              </div>
            </div>
            <div className="bg-white rounded-lg border-none p-5 space-y-2 shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex-1">
              <Skeleton className="h-4 w-32 mb-2" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (!tournament) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
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
    <div className="min-h-screen bg-background p-4 md:p-8 text-gray-700">
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Hero Banner Section */}
        <div className="relative w-full rounded-[20px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] min-h-[380px] flex flex-col justify-end">
          {/* Banner background */}
          <img
            src={tournament.bannerUrl || "/images/tournaments/tournament-banner-new.jpg"}
            alt="Tournament Banner"
            className="absolute inset-0 w-full h-full object-cover z-0"
            onError={(e) => {
              e.currentTarget.src = "/images/tournaments/tournament-banner-new.jpg";
            }}
          />
          {/* Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/60 to-transparent z-10" />

          {/* Banner Content */}
          <div className="relative z-20 w-full p-8 md:p-12">
            <div className="max-w-3xl space-y-4">
              <span className="text-[#16a34a] text-[12px] font-bold tracking-[0.15em] uppercase">
                Tournament
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-[1.1]">
                {tournament.name}
              </h1>


            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex items-center gap-6 border-b border-gray-100 mb-2">
          <button
            onClick={() => setActiveTab("registration")}
            className={`pb-3 text-[14px] font-medium transition-colors border-b-2 ${activeTab === "registration" ? "border-openclub-600 text-openclub-800" : "border-transparent text-gray-500 hover:text-gray-900"}`}
          >
            Registration
          </button>
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`pb-3 text-[14px] font-medium transition-colors border-b-2 ${activeTab === "leaderboard" ? "border-openclub-600 text-openclub-800" : "border-transparent text-gray-500 hover:text-gray-900"}`}
          >
            Leaderboard
          </button>
        </div>

        {activeTab === "leaderboard" ? (
          <PublicLeaderboard tournamentId={tournament.id} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Main Info Blocks (Left 2 columns) */}
          <div className="md:col-span-2 flex flex-col gap-4">

            {/* Description Section */}
            <div className="bg-white rounded-lg border-none p-6 md:p-8 space-y-4 shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)]">
              <div className="flex items-center gap-2 text-gray-900 border-b border-gray-50 pb-3">
                <BookOpen className="w-4 h-4 text-openclub-600" />
                <h2 className="text-[15px] font-medium text-slate-900">About the Tournament</h2>
              </div>
              <p className="text-gray-500 text-[14px] leading-relaxed whitespace-pre-line">
                {"description" in tournament && tournament.description
                  ? (tournament as any).description
                  : `Join us for the prestigious ${tournament.name} organized by ${tournament.club?.name || "our Club"}. This event brings players together for an outstanding competitive golf experience on a meticulously maintained course. Players of eligible divisions can confirm their slot and proceed with entry fee payments via the platform to secure their spot on the official roster.`}
              </p>
            </div>


            {/* Rules & Requirements block */}
            <div className="bg-white rounded-lg border-none p-6 md:p-8 space-y-4 shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex-1">
              <div className="flex items-center gap-2 text-gray-900 border-b border-gray-50 pb-3">
                <Shield className="w-4 h-4 text-openclub-600" />
                <h2 className="text-[15px] font-medium text-slate-900">Entry Guidelines & Restrictions</h2>
              </div>
              <ul className="space-y-3 text-[14px] text-gray-500">
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
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-openclub-500 mt-2 flex-shrink-0" />
                  <span>All players must strictly adhere to the club's dress code policy both on and off the golf course.</span>
                </li>

                {/* Dynamic Refund Rule */}
                {("isRefundable" in tournament && (tournament as any).isRefundable !== false) && (
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-openclub-500 mt-2 flex-shrink-0" />
                    <span>Withdrawals must be requested at least 48 hours prior to the tournament start date to be eligible for a refund.</span>
                  </li>
                )}

                {/* Dynamic Gender Rule */}
                {("genderRestriction" in tournament && (tournament as any).genderRestriction === 'FEMALE_ONLY') && (
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-openclub-500 mt-2 flex-shrink-0" />
                    <span>This tournament is exclusively for female players. Registrations from other players will not be accepted.</span>
                  </li>
                )}
                {("genderRestriction" in tournament && (tournament as any).genderRestriction === 'MALE_ONLY') && (
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-openclub-500 mt-2 flex-shrink-0" />
                    <span>This tournament is exclusively for male players. Registrations from other players will not be accepted.</span>
                  </li>
                )}

                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-openclub-500 mt-2 flex-shrink-0" />
                  <span>The Tournament Committee reserves the right to adjust handicap divisions based on total registration numbers.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Quick Stats sidebar (Right 1 column) */}
          <div className="flex flex-col gap-4 h-full">

            {/* Key Information Card */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-5 shadow-xl text-white relative overflow-hidden">
              <h3 className="text-white text-[15px] font-medium border-b border-slate-700/60 pb-3 capitalize tracking-wide relative z-10">
                Tournament Info
              </h3>
              <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-openclub-600/20 blur-[40px] rounded-full pointer-events-none" />

              <div className="space-y-4 text-xs">
                {/* Venue */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border-slate-700 flex items-center justify-center flex-shrink-0 text-[#16a34a]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider">Venue</p>
                    <p className="text-white font-medium text-[13px] mt-0.5">{tournament.course?.name || tournament.club?.name || "TBD"}</p>
                  </div>
                </div>

                {/* Entry Fee */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border-slate-700 flex items-center justify-center flex-shrink-0 text-[#16a34a]">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider">Entry Fee</p>
                    <p className="text-white font-medium text-[13px] mt-0.5">{formattedFee}</p>
                  </div>
                </div>

                {/* Handicap constraints */}
                {("hasHandicapRestriction" in tournament && (tournament as any).hasHandicapRestriction) || tournament.minHandicap !== undefined || tournament.maxHandicap !== undefined ? (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border-slate-700 flex items-center justify-center flex-shrink-0 text-[#16a34a]">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Handicap Limits</p>
                      <p className="text-white font-medium text-[13px] mt-0.5">
                        {(() => {
                          const min = tournament.minHandicap ?? 0;
                          const max = tournament.maxHandicap;
                          if (min === 0 && (!max || max === 0)) return "No Handicap Limit";
                          return `${min} - ${max || "No Limit"}`;
                        })()}
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* Gender Restriction */}
                {("genderRestriction" in tournament && (tournament as any).genderRestriction && (tournament as any).genderRestriction !== 'MIXED') && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border-slate-700 flex items-center justify-center flex-shrink-0 text-[#16a34a]">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Gender</p>
                      <p className="text-white font-medium text-[13px] mt-0.5">
                        {(tournament as any).genderRestriction === 'FEMALE_ONLY' ? "Women Only" : "Men Only"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Capacity / Slots */}
                {tournament.maxPlayers && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border-slate-700 flex items-center justify-center flex-shrink-0 text-[#16a34a]">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 uppercase tracking-wider">Roster Size</p>
                      <p className="text-white font-medium text-[13px] mt-0.5">
                        {tournament._count?.registrations ?? 0} / {tournament.maxPlayers} Max Players
                      </p>
                    </div>
                  </div>
                )}

                {/* Registration Close Deadline */}
                {tournament.registrationCloseAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border-slate-700 flex items-center justify-center flex-shrink-0 text-[#16a34a]">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 uppercase tracking-wider">Registration Deadline</p>
                      <p className="text-white font-medium text-[13px] mt-0.5">
                        {new Date(tournament.registrationCloseAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Call-to-action buttons */}
              <div className="pt-4 border-t border-slate-700/60 space-y-3">
                {isRegistrationOpen ? (
                  <Link href={`/tournaments/${tournament.id}/register`} className="w-full block">
                    <Button className="w-full h-11 bg-openclub-700 hover:bg-openclub-800 text-[13px] rounded-lg flex items-center justify-center gap-2 group text-white">
                      <span>Register to Play</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    className="w-full h-11 bg-slate-800 border border-slate-700 text-slate-400 rounded-lg cursor-not-allowed flex items-center justify-center text-[13px]"
                    disabled
                  >
                    {tournament.status === "COMPLETED" ? "Tournament Completed" : "Registration Closed"}
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: tournament.name,
                        text: `Check out the ${tournament.name} tournament!`,
                        url: window.location.href,
                      }).catch(console.error);
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied to clipboard!");
                    }
                  }}
                  className="w-full h-11 text-[14px] rounded-lg flex items-center justify-center gap-2 group bg-white text-slate-900 hover:bg-gray-100 font-medium transition-colors"
                >
                  <Share2 className="w-4 h-4 group-hover:scale-105 transition-transform" />
                  <span>Share Tournament</span>
                </Button>
              </div>
            </div>

            {/* Help / Information Box */}
            <div className="bg-white rounded-lg border-none p-5 space-y-2 shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex-1">
              <div className="flex text-[14px] items-center gap-2 text-openclub-900">
                <Info className="w-4 h-4 text-openclub-700" />
                <h4 className="text-[14px] font-medium">Need Assistance?</h4>
              </div>
              <p className="text-[12px] text-gray-500 leading-relaxed">
                If you have questions about payment validation, guest eligibility, or handicap restrictions, please send a message directly to the golf organizer club.
                <span className="block mt-2">
                  <button onClick={() => setIsContactModalOpen(true)} className="text-openclub-600 hover:text-openclub-700 hover:underline">
                    Send message
                  </button>
                </span>
              </p>
            </div>
          </div>
          </div>
        )}
      </div>

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
              className="font-semibold flex-1"
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              className="font-bold flex-1"
              disabled={isSending || !contactForm.name || !contactForm.email || !contactForm.message}
              onClick={async () => {
                setIsSending(true)
                // Simulate API call for now
                await new Promise(r => setTimeout(r, 1000))
                toast.success("Message sent successfully")
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
          <p className="text-sm text-gray-600 leading-relaxed">
            Fill out the form below to <span className="font-semibold text-gray-900">send a direct message</span> to the tournament organizer. They will reply to your email address.
          </p>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-900">Your Name</label>
                <Input
                  placeholder="e.g. John Doe"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  disabled={isSending}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-900">Your Email</label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  disabled={isSending}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-900">Subject</label>
              <Input
                placeholder="e.g. Question about eligibility"
                value={contactForm.subject}
                onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                disabled={isSending}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-900">Message</label>
              <textarea
                className="w-full flex min-h-[120px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                placeholder="Type your message here..."
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
