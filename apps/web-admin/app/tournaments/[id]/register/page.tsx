"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { registerForTournament } from "@/lib/api/registrations"
import { Tournament, getTournament } from "@/lib/api/tournaments"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/ui/icons"
import {
  ShieldCheck,
  CreditCard,
  AlertCircle,
  ChevronRight,
  CheckCircle2,
  DollarSign,
  User,
  Info,
  Clock
} from "lucide-react"
import { toast } from "sonner"

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
  const [playerType, setPlayerType] = React.useState("MEMBER")
  const [paymentRef, setPaymentRef] = React.useState("")

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

  async function handleRegister() {
    setIsSubmitting(true)
    try {
      await registerForTournament({
        tournamentId: tournament!.id,
        playerType,
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
    <div className="min-h-screen flex items-center justify-center bg-background/50">
      <Icons.spinner className="w-10 h-10 text-primary animate-spin" />
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
            We're sorry, but registration is now closed. This tournament has already started and we do not accept new registrations after Day 1 has commenced.
          </p>
        </div>
        <Button className="w-full h-12 text-[15px] font-medium rounded-xl bg-gray-900 hover:bg-gray-800 text-white" onClick={() => router.back()}>
          Return
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background/50 p-4 md:p-8 font-nexa-regular">
      <div className="max-w-2xl mx-auto">

        {/* Progress Stepper */}
        <div className="mb-12 flex items-center justify-center gap-4">
          <div className={`flex items-center gap-2 ${step === 'details' ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium border-2 ${step === 'details' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>1</div>
            <span className="font-medium text-[12px]">Review</span>
          </div>
          <div className="w-12 h-px bg-gray-200" />
          <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium border-2 ${step === 'payment' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>2</div>
            <span className="font-medium text-[12px]">Payment</span>
          </div>
          <div className="w-12 h-px bg-gray-200" />
          <div className={`flex items-center gap-2 ${step === 'success' ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium border-2 ${step === 'success' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>3</div>
            <span className="font-medium text-[12px]">Done</span>
          </div>
        </div>

        {step === "details" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-[16px] font-medium text-gray-900">{tournament.name}</h1>
                    <p className="text-gray-500 font-normal">Registration Review</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background p-4 rounded-2xl space-y-1">
                    <p className="text-[11px] font-medium text-gray-400 capitalize tracking-wider">Entry Fee</p>
                    <p className="text-[14px] font-medium text-gray-900">
                      {tournament.entryFee && tournament.entryFee > 0 ? `₦${tournament.entryFee.toFixed(2)}` : 'FREE'}
                    </p>
                  </div>
                  <div className="bg-background p-4 rounded-2xl space-y-1">
                    <p className="text-[11px] font-medium text-gray-400 Capitalize tracking-wider">Player Type</p>
                    <div className="flex items-center gap-2 font-medium text-primary">
                      <User className="w-4 h-4" />
                      {playerType}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-50">
                  <div className="flex items-center font-normal gap-3 text-[12px] text-gray-600">
                    <Clock className="w-4 h-4 text-primary font-medium" />
                    <span>Starts: {new Date(tournament.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center font-normal gap-3 text-[12px] text-gray-600">
                    <Info className="w-4 h-4 text-primary font-medium" />
                    <span>Eligibility: {tournament.playerTypes.join(", ")}</span>
                  </div>
                </div>
              </div>
            </div>

            <Button
              className="w-full h-14 rounded-lg font-medium text-[14px] bg-primary hover:bg-primary/90 border border-primary/60 text-white flex items-center justify-center gap-2 group"
              onClick={() => tournament.entryFee && tournament.entryFee > 0 ? setStep("payment") : handleRegister()}
            >
              {tournament.entryFee && tournament.entryFee > 0 ? "Proceed to Payment" : "Confirm Registration"}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        )}

        {step === "payment" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden p-8 space-y-8">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-primary mx-auto mb-4">
                  <CreditCard className="w-8 h-8" />
                </div>
                <h2 className="text-[16px] font-medium text-gray-900">Secure Payment</h2>
                <p className="text-gray-500">Complete your entry fee payment</p>
              </div>

              <div className="bg-primary/5 rounded-2xl p-6 flex items-center justify-between">
                <span className="font-medium text-gray-600">Amount to Pay</span>
                <span className="text-[16px] font-medium text-primary">₦{tournament.entryFee?.toFixed(2)}</span>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[12px] font-medium text-gray-700 ml-1">Payment Reference (Simulation)</label>
                  <div className="relative group">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <Input
                      placeholder="e.g. TRN-12345678"
                      className="pl-12 h-14 bg-background border-transparent focus:bg-white focus:border-primary transition-all rounded-xl"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 ml-1">In a real scenario, this would be handled via Stripe/Paypal.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1 h-14 rounded-lg font-medium border-gray-200"
                onClick={() => setStep("details")}
              >
                Back
              </Button>
              <Button
                className="flex-[2] h-14 rounded-lg font-medium text-[14px] bg-primary hover:bg-primary/90 border border-primary/60 text-white disabled:opacity-50"
                disabled={!paymentRef || isSubmitting}
                onClick={handleRegister}
              >
                {isSubmitting ? <Icons.spinner className="w-6 h-6 animate-spin mx-auto" /> : "Complete & Register"}
              </Button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="text-center space-y-8 animate-in zoom-in duration-500">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center border-4 border-white shadow-xl relative z-10">
                <CheckCircle2 className="w-12 h-12 text-primary" strokeWidth={1.5} />
              </div>
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
            </div>

            <div className="space-y-3">
              <h1 className="text-[16px] font-medium text-gray-900 tracking-tight">You&apos;re All Set!</h1>
              <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                Your registration for <span className="font-medium text-gray-800">{tournament.name}</span> has been confirmed. We&apos;ve sent a summary to your email.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm max-w-sm mx-auto">
              <div className="space-y-4 text-left">
                <div className="flex justify-between text-[12px]">
                  <span className="text-gray-400 font-medium">STATUS</span>
                  <span className="text-primary font-medium bg-primary/5 px-2 py-0.5 rounded-lg">CONFIRMED</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-gray-400 font-medium">Player Type</span>
                  <span className="text-gray-700 font-medium">{playerType}</span>
                </div>
                {paymentRef && (
                  <div className="flex justify-between text-[12px]">
                    <span className="text-gray-400 font-medium">PAYMENT REF</span>
                    <span className="text-gray-700 font-medium">{paymentRef}</span>
                  </div>
                )}
              </div>
            </div>

            <Button
              className="h-14 px-12 rounded-lg font-medium text-[14px] bg-gray-900 hover:bg-gray-800 border border-gray-800/40 text-white transition-colors"
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
