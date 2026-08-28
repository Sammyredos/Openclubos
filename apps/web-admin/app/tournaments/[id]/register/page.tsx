"use client"

import {
  AlertCircle,
  CheckCircle2,
  Receipt
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { registerForTournament } from "@/lib/api/registrations"
import { Tournament, getTournament } from "@/lib/api/tournaments"
import { useAuth } from "@/lib/auth/AuthContext"
import { getGolfCategory } from "@/lib/utils"

type Step = "details" | "payment" | "success"

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message
  if (typeof e === "string") return e
  if (e && typeof e === "object" && "message" in e && typeof (e as { message?: unknown }).message === "string") {
    return (e as { message: string }).message
  }
  return null
}

export default function TournamentRegistrationPage() {
  const params = useParams()
  const router = useRouter()
  const [step, setStep] = React.useState<Step>("details")
  const [tournament, setTournament] = React.useState<Tournament | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [paymentRef, setPaymentRef] = React.useState("")
  const { user } = useAuth()
  
  const playerCategory = getGolfCategory(user?.handicap)

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
    void loadTournament()
  }, [params.id])

  async function handleRegister() {
    setIsSubmitting(true)
    try {
      await registerForTournament({
        tournamentId: tournament!.id,
        playerType: playerCategory,
        paymentReference: tournament!.entryFee && tournament!.entryFee > 0 ? paymentRef : undefined
      })
      setStep("success")
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "Registration failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-nexa-regular flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-xl shadow-sm p-6 md:p-10">
        {/* Skeleton Stepper */}
        <div className="mb-10 flex items-center justify-center gap-4">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-12 h-px" />
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-12 h-px" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
        
        <Skeleton className="w-48 h-6 mb-2" />
        <Skeleton className="w-96 h-4 mb-5" />
        
        <hr className="border-gray-100 my-5" />
        
        <div className="bg-[#f4f9f5] border border-[#e5efe7] rounded-xl p-6 mb-6">
          <div className="space-y-4 mb-6">
            <div>
              <Skeleton className="w-32 h-4 mb-2" />
              <Skeleton className="w-full h-8 max-w-sm rounded-md" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="w-24 h-4 mb-2" />
                  <Skeleton className="w-full h-8 max-w-sm rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <Skeleton className="w-full h-[42px] rounded-lg" />
      </div>
    </div>
  )

  if (!tournament) return (
    <div className="min-h-screen flex items-center justify-center bg-background/50">
      <div className="text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h1 className="text-[16px] font-medium">Tournament Not Found</h1>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    </div>
  )

  const hasTournamentStarted = new Date() > new Date(tournament.startDate);
  if (hasTournamentStarted) return (
    <div className="min-h-screen flex items-center justify-center bg-background/50 p-4">
      <div className="text-center space-y-6 bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-10 h-10 text-amber-500" />
        </div>
        <div className="space-y-3">
          <h1 className="text-[16px] font-medium text-gray-900 tracking-tight">Registration Closed</h1>
          <p className="text-gray-500 leading-relaxed text-[15px]">
            We&apos;re sorry, but registration is now closed. This tournament has already started and we do not accept new registrations after Day 1 has commenced.
          </p>
        </div>
        <Button className="w-full h-12 text-[15px] font-medium rounded-xl bg-gray-900 hover:bg-gray-800 text-white" onClick={() => router.back()}>
          Return
        </Button>
      </div>
    </div>
  )

  const isStaff = user?.role === 'SUPER_ADMIN' || user?.role === 'CLUB_ADMIN' || user?.role === 'MANAGER';
  if (isStaff) return (
    <div className="min-h-screen flex items-center justify-center bg-background/50 p-4">
      <div className="text-center space-y-6 bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <div className="space-y-3">
          <h1 className="text-[16px] font-medium text-gray-900 tracking-tight">Access Denied</h1>
          <p className="text-gray-500 leading-relaxed text-[15px]">
            Organizers, managers, and super admins are not permitted to register for tournaments as players. Please use a player account to register.
          </p>
        </div>
        <Button className="w-full h-12 text-[15px] font-medium rounded-xl bg-gray-900 hover:bg-gray-800 text-white" onClick={() => router.back()}>
          Return
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-nexa-regular flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-xl shadow-sm p-6 md:p-10">

        {/* Progress Stepper */}
        <div className="mb-10 flex items-center justify-center gap-4">
          <div className={`flex items-center gap-2 ${step === 'details' ? 'text-primary' : step === 'payment' || step === 'success' ? 'text-gray-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium border-2 ${step === 'details' ? 'border-primary bg-primary/10' : step === 'payment' || step === 'success' ? 'border-gray-600 bg-gray-50' : 'border-gray-200'}`}>1</div>
            <span className="font-medium text-[12px]">Review</span>
          </div>
          <div className={`w-12 h-px ${step === 'payment' || step === 'success' ? 'bg-primary' : 'bg-gray-200'}`} />
          
          <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-primary' : step === 'success' ? 'text-gray-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium border-2 ${step === 'payment' ? 'border-primary bg-primary/10' : step === 'success' ? 'border-gray-600 bg-gray-50' : 'border-gray-200'}`}>2</div>
            <span className="font-medium text-[12px]">Payment</span>
          </div>
          <div className={`w-12 h-px ${step === 'success' ? 'bg-primary' : 'bg-gray-200'}`} />
          
          <div className={`flex items-center gap-2 ${step === 'success' ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium border-2 ${step === 'success' ? 'border-primary bg-primary/10' : 'border-gray-200'}`}>3</div>
            <span className="font-medium text-[12px]">Done</span>
          </div>
        </div>

        {step === "details" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

            <h1 className="text-[16px] text-[#1b2533] font-medium mb-1">Confirm Registration</h1>
            <p className="text-[13px] text-[#6b7280]">Review the tournament details and confirm your registration to play this tournament.</p>

            <hr className="border-gray-100 my-5" />

            <div className="bg-[#f4f9f5] border border-[#e5efe7] rounded-xl p-6">

              <div className="space-y-8 mb-6">
                <div>
                  <p className="text-[13px] text-[#1b2533] font-normal mb-0.5">Tournament Name <span className="text-red-500">*</span></p>
                  <p className="text-[12px] text-gray-400 mb-2">The tournament you are registering for.</p>
                  <div className="text-[15px] font-medium text-[#1b2533]">
                    {tournament.name}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                  <div>
                    <p className="text-[13px] text-[#1b2533] font-normal mb-0.5">Player Name <span className="text-red-500">*</span></p>
                    <p className="text-[12px] text-gray-400 mb-2">The name of the player registering.</p>
                    <div className="text-[15px] font-medium text-[#1b2533]">
                      {user?.name || user?.email || "Unknown"}
                    </div>
                  </div>
                  <div>
                    <p className="text-[13px] text-[#1b2533] font-normal mb-0.5">Player Category <span className="text-red-500">*</span></p>
                    <p className="text-[12px] text-gray-400 mb-2">Your category for this tournament.</p>
                    <div className="text-[15px] font-medium text-[#1b2533]">
                      {playerCategory}
                    </div>
                  </div>
                  <div>
                    <p className="text-[13px] text-[#1b2533] font-normal mb-0.5">Handicap <span className="text-red-500">*</span></p>
                    <p className="text-[12px] text-gray-400 mb-2">Player&apos;s registered handicap.</p>
                    <div className="text-[15px] font-medium text-[#1b2533]">
                      {user?.handicap ?? "N/A"}
                    </div>
                  </div>
                  <div>
                    <p className="text-[13px] text-[#1b2533] font-normal mb-0.5">Gender <span className="text-red-500">*</span></p>
                    <p className="text-[12px] text-gray-400 mb-2">Player&apos;s registered gender.</p>
                    <div className="text-[15px] font-medium text-[#1b2533] capitalize">
                      {user?.gender ? user.gender.toLowerCase() : "N/A"}
                    </div>
                  </div>
                  <div>
                    <p className="text-[13px] text-[#1b2533] font-normal mb-0.5">Entry Fee <span className="text-red-500">*</span></p>
                    <p className="text-[12px] text-gray-400 mb-2">Amount to be paid.</p>
                    <div className="text-[15px] font-semibold text-[#1b2533]">
                      {tournament.entryFee && tournament.entryFee > 0 ? `₦${tournament.entryFee.toFixed(2)}` : 'FREE'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Button
              className="w-full font-medium rounded-lg h-[46px] text-[15px] mt-6 shadow-sm hover:shadow-md transition-all"
              onClick={() => { void (tournament.entryFee && tournament.entryFee > 0 ? setStep("payment") : handleRegister()) }}
            >
              {tournament.entryFee && tournament.entryFee > 0 ? "Proceed to Payment" : "Confirm Registration"}
            </Button>
          </div>
        )}

        {step === "payment" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-[16px] text-[#1b2533] font-medium mb-1">Secure Payment</h1>
            <p className="text-[13px] text-[#6b7280]">Complete your entry fee payment to finalize registration.</p>

            <hr className="border-gray-100 my-5" />

            <div className="bg-[#f4f9f5] border border-[#e5efe7] rounded-xl p-6">

              <div className="space-y-8 mb-6">
                <div>
                  <p className="text-[13px] text-[#1b2533] font-normal mb-0.5">Amount to Pay <span className="text-red-500">*</span></p>
                  <div className="text-[15px] font-medium text-[#1b2533]">
                    ₦{tournament.entryFee?.toFixed(2)}
                  </div>
                </div>

                <div>
                  <p className="text-[13px] text-[#1b2533] font-normal mb-0.5">Payment Reference <span className="text-red-500">*</span></p>
                  <p className="text-[12px] text-gray-400 mb-2">Simulated payment reference for this transaction.</p>
                  <div className="relative group">
                    <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <Input
                      placeholder="e.g. TRN-12345678"
                      className="pl-9 h-[42px] bg-white border-[#e5efe7] focus:border-primary transition-all rounded-lg text-[14px]"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-[1] h-[46px] rounded-lg font-medium border-[#e5efe7] text-[#1b2533] bg-white hover:bg-gray-50 text-[15px] shadow-sm"
                onClick={() => setStep("details")}
              >
                Back
              </Button>
              <Button
                className="flex-[3] h-[46px] rounded-lg font-medium text-[15px] shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                disabled={!paymentRef || isSubmitting}
                onClick={() => { void handleRegister() }}
              >
                {isSubmitting ? <Icons.spinner className="w-5 h-5 animate-spin mx-auto" /> : "Complete & Register"}
              </Button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-[16px] text-[#1b2533] font-medium mb-1">Registration Complete</h1>
            <p className="text-[13px] text-[#6b7280]">Your tournament registration is fully confirmed.</p>

            <hr className="border-gray-100 my-5" />

            <div className="bg-[#f4f9f5] border border-[#e5efe7] rounded-xl p-6 text-center py-10">
              <div className="w-16 h-16 rounded-full bg-white border border-[#e5efe7] flex items-center justify-center mx-auto mb-6 shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-primary" strokeWidth={2} />
              </div>

              <h2 className="text-[18px] text-[#1b2533] font-medium mb-2">Registration Confirmed!</h2>
              <p className="text-[14px] text-[#6b7280] max-w-md mx-auto">
                Your registration for <span className="font-medium text-[#1b2533]">{tournament.name}</span> is complete.
              </p>
            </div>

            <Button
              className="w-full font-medium rounded-lg h-[46px] text-[15px] mt-6 shadow-sm hover:shadow-md transition-all"
              onClick={() => router.push("/tournaments")}
            >
              Back to Tournaments
            </Button>
          </div>
        )}

      </div>
    </div>
  )
}
