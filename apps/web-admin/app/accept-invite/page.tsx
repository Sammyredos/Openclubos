"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Icons } from "@/components/ui/icons"
import { Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

interface InviteDetails {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
}

const schema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  middleName: z.string().min(1, { message: "Middle name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
})

type FormValues = z.infer<typeof schema>

type PageState = "idle" | "loading" | "success" | "error"

export default function AcceptInvitePage() {
  return (
    <React.Suspense fallback={null}>
      <AcceptInvitePageInner />
    </React.Suspense>
  )
}

function AcceptInvitePageInner() {
  const [pageState, setPageState] = React.useState<PageState>("idle")
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [inviteDetails, setInviteDetails] = React.useState<InviteDetails | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: "", middleName: "", lastName: "", password: "", confirmPassword: "" },
  })

  React.useEffect(() => {
    if (!token) {
      setPageState("error")
      toast.error("Invalid or missing invitation token.")
      return
    }

    async function fetchInvite() {
      try {
        const res = await fetch(`${API_BASE}/auth/invite/${token}`)
        if (!res.ok) {
          throw new Error("Invalid or expired invitation token.")
        }
        const data = (await res.json()) as InviteDetails
        setInviteDetails(data)

        let first = data.firstName || ""
        let middle = ""
        if (first.includes(" ")) {
          const parts = first.split(" ")
          first = parts[0]
          middle = parts.slice(1).join(" ")
        }

        form.reset({
          firstName: first,
          middleName: middle,
          lastName: data.lastName || "",
          password: "",
          confirmPassword: "",
        })
      } catch (err) {
        setPageState("error")
        toast.error("Invalid or expired invitation token.")
      }
    }

    void fetchInvite()
  }, [token, form])

  async function onSubmit(data: FormValues) {
    if (!token) return
    setPageState("loading")
    try {
      const res = await fetch(`${API_BASE}/auth/accept-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName,
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => null)
        throw new Error(error?.message || "Failed to accept invitation.")
      }

      const result = await res.json()

      // Store auth tokens for immediate login
      if (result.accessToken) {
        localStorage.setItem("accessToken", result.accessToken)
      }
      if (result.refreshToken) {
        localStorage.setItem("refreshToken", result.refreshToken)
      }
      if (result.user) {
        localStorage.setItem("user", JSON.stringify(result.user))
      }

      setPageState("success")
      toast.success("Account activated! Redirecting...")

      // Redirect based on role and query parameters
      const fromParam = searchParams.get("from")
      const nextPath = fromParam || (result.user?.role === "PLAYER" ? "/app/home" : "/organizer-admin/dashboard")

      setTimeout(() => {
        router.push(nextPath)
      }, 2000)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setPageState("idle")
    }
  }

  const defaultRedirect = inviteDetails?.role === "PLAYER" ? "/app/home" : "/organizer-admin/dashboard"

  return (
    <div className="min-h-screen w-full flex bg-background font-sans text-zinc-900">
      <div className="w-full max-w-[1440px] mx-auto flex justify-center relative">

        {/* RIGHT COLUMN - Form */}
        <div className="w-full flex flex-col items-center justify-center p-8 lg:p-16 relative">
          
          <div className="flex items-center gap-2 mb-8 relative z-10">
            <Icons.logo className="w-8 h-8 text-zinc-900" />
            <span className="font-bold text-2xl tracking-tight text-zinc-900">OpenClub</span>
          </div>

          {/* Subtle background glow */}
          <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-50 rounded-full blur-[100px] opacity-50 pointer-events-none" />

          <div className="w-full max-w-[480px] bg-white rounded-3xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-zinc-100 relative z-10">
            {pageState === "success" ? (
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-6 shadow-sm">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-3">Account Activated!</h2>
                <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
                  Your account is now active. You are being redirected.
                </p>

                <Link href={searchParams.get("from") || defaultRedirect} className="w-full">
                  <button className="w-full bg-emerald-600 text-white font-semibold text-sm rounded-xl py-3 shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center">
                    {inviteDetails?.role === "PLAYER" ? "Proceed to Tournaments" : "Go to Dashboard"}
                  </button>
                </Link>
              </div>
            ) : pageState === "error" ? (
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-6 shadow-sm">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-3">Invalid Invitation</h2>
                <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
                  This invitation link is invalid or has expired. Please ask your organizer to send a new invitation.
                </p>

                <Link href="/login" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
                  Back to Sign In
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-8 text-left">
                  <h2 className="text-3xl font-bold tracking-tight mb-2 text-zinc-900">
                    {inviteDetails?.role === "PLAYER" ? "Complete Registration" : "Set Your Password"}
                  </h2>
                  <p className="text-zinc-500 mb-2">
                    {inviteDetails?.role === "PLAYER" ? (
                      <>
                        Hi <span className="font-medium text-zinc-900">{inviteDetails.email}</span>, let's set up your profile and password.
                      </>
                    ) : (
                      "Create a secure password for your new manager account."
                    )}
                  </p>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* First Name */}
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-semibold text-zinc-700 mb-2">First Name</label>
                    <input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      className="w-full bg-[#f5faf6] border border-[#e1efe5] rounded-xl px-4 py-3 text-zinc-900 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      disabled={pageState === "loading"}
                      {...form.register("firstName")}
                    />
                    {form.formState.errors.firstName && (
                      <p className="text-xs font-medium text-red-600 mt-2">{form.formState.errors.firstName.message}</p>
                    )}
                  </div>

                  {/* Middle Name */}
                  <div>
                    <label htmlFor="middleName" className="block text-sm font-semibold text-zinc-700 mb-2">Middle Name</label>
                    <input
                      id="middleName"
                      type="text"
                      placeholder="Robert"
                      className="w-full bg-[#f5faf6] border border-[#e1efe5] rounded-xl px-4 py-3 text-zinc-900 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      disabled={pageState === "loading"}
                      {...form.register("middleName")}
                    />
                    {form.formState.errors.middleName && (
                      <p className="text-xs font-medium text-red-600 mt-2">{form.formState.errors.middleName.message}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-semibold text-zinc-700 mb-2">Last Name</label>
                    <input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      className="w-full bg-[#f5faf6] border border-[#e1efe5] rounded-xl px-4 py-3 text-zinc-900 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      disabled={pageState === "loading"}
                      {...form.register("lastName")}
                    />
                    {form.formState.errors.lastName && (
                      <p className="text-xs font-medium text-red-600 mt-2">{form.formState.errors.lastName.message}</p>
                    )}
                  </div>

                  {/* Password field */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-zinc-700 mb-2">Password</label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="w-full bg-[#f5faf6] border border-[#e1efe5] rounded-xl px-4 py-3 pr-12 text-zinc-900 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        disabled={pageState === "loading"}
                        {...form.register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-4 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {form.formState.errors.password && (
                      <p className="text-xs font-medium text-red-600 mt-2">{form.formState.errors.password.message}</p>
                    )}
                  </div>

                  {/* Confirm Password field */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700 mb-2">Confirm Password</label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="w-full bg-[#f5faf6] border border-[#e1efe5] rounded-xl px-4 py-3 pr-12 text-zinc-900 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        disabled={pageState === "loading"}
                        {...form.register("confirmPassword")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-4 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {form.formState.errors.confirmPassword && (
                      <p className="text-xs font-medium text-red-600 mt-2">{form.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={pageState === "loading"}
                    className="w-full bg-emerald-600 text-white font-semibold text-sm rounded-xl py-3 shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center mt-4"
                  >
                    {pageState === "loading" ? (
                      <Icons.spinner className="w-5 h-5 animate-spin text-white" />
                    ) : (
                      "Activate Account"
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
