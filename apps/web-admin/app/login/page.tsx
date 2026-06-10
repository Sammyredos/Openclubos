"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/ui/icons"
import {
  Mail, Lock, Eye, EyeOff, Sun, ChevronDown, Trophy,
  LineChart, PieChart, ShieldCheck, ArrowRight, AlertCircle
} from "lucide-react"
import { useAuth } from "@/lib/auth/AuthContext"
import { loginRequest, resendVerificationRequest } from "@/lib/api/auth"
import { Modal } from "@/components/ui/modal"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"

const loginSchema = z.object({
  email: z.string().min(1, { message: "Please enter your email or membership ID." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long." }),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  return (
    <React.Suspense fallback={null}>
      <LoginPageInner />
    </React.Suspense>
  )
}

function LoginPageInner() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [rememberMe, setRememberMe] = React.useState(true)
  const [unverifiedEmail, setUnverifiedEmail] = React.useState<string | null>(null)
  const [isResending, setIsResending] = React.useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  React.useEffect(() => {
    const url = new URL(window.location.href)
    const leakedEmail = url.searchParams.get("email")
    const leakedPassword = url.searchParams.get("password")
    if (leakedEmail || leakedPassword) {
      toast.error("For security, credentials were removed from the URL. Please re-enter your password.")
      url.searchParams.delete("email")
      url.searchParams.delete("password")
    }

    const reason = searchParams.get("reason")
    if (reason) {
      if (reason === "suspended") {
        toast.error("Your account has been suspended. Please contact support.")
      } else if (reason === "expired") {
        toast.error("Your account has expired. Please contact support.")
      } else if (reason === "revoked") {
        toast.error("Your session has been ended. Please login again.")
      } else {
        toast.error("You have been logged out.")
      }
      url.searchParams.delete("reason")
    }

    const next = url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : "")
    if (next !== window.location.pathname + window.location.search) router.replace(next)
  }, [router, searchParams])

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(data: LoginFormValues) {
    if (isLoading) return
    setIsLoading(true)
    try {
      const response = await loginRequest(data);
      login(response.accessToken, response.user);
      toast.success("Successfully logged in");
      // Intentionally NOT resetting isLoading here so the button stays
      // disabled while the router.replace() in login() is navigating.
    } catch (err: unknown) {
      console.error("Login error details:", err);
      const msg = err instanceof Error ? err.message : "Invalid email or password. Please check your credentials and try again.";
      if (msg === "EMAIL_NOT_VERIFIED" || msg.toLowerCase() === "email not verified") {
        setUnverifiedEmail(data.email);
      } else {
        toast.error(msg);
      }
      setIsLoading(false)
    }
  }

  async function handleResendVerification() {
    if (!unverifiedEmail || isResending) return;
    setIsResending(true);
    try {
      await resendVerificationRequest(unverifiedEmail);
      toast.success("Verification email sent! Please check your inbox.");
      setUnverifiedEmail(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to resend email.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-white font-sans overflow-hidden">

      {/* LEFT COLUMN - Marketing & Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 text-white">
        {/* Background Image & Gradient */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=2070&auto=format&fit=crop"
            alt="Golf Course"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
        </div>

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#10b981] rounded-full flex items-center justify-center text-white shadow-lg">
            <Icons.logo className="w-6 h-6" />
          </div>
          <span className="text-[22px] font-bold tracking-tight">OpenClubOS</span>
        </div>

        {/* Center Content */}
        <div className="relative z-10 max-w-lg mt-12 mb-auto pb-10">
          <h1 className="text-[44px] leading-[1.1] font-bold mb-6">
            The All-in-One<br />Platform for Golf<br />Tournaments
          </h1>
          <p className="text-[17px] text-gray-200 mb-12 font-medium leading-relaxed">
            Manage tournaments, players, courses and scores — all in one seamless platform.
          </p>

          <div className="space-y-8">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <Trophy className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-[15px] mb-1">Organize Tournaments</h3>
                <p className="text-gray-300 text-[14px] leading-snug">Create and manage professional golf tournaments effortlessly.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <LineChart className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-[15px] mb-1">Live Scoring</h3>
                <p className="text-gray-300 text-[14px] leading-snug">Real-time scores and leaderboards that keep everyone updated.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <PieChart className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-[15px] mb-1">Powerful Analytics</h3>
                <p className="text-gray-300 text-[14px] leading-snug">Insights and reports to grow your golf community.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trusted Widget */}
        <div className="relative z-10">
          <div className="inline-flex flex-col gap-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 pr-10">
            <div className="flex -space-x-3">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" className="w-10 h-10 rounded-full border-2 border-gray-900 object-cover" alt="User" />
              <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" className="w-10 h-10 rounded-full border-2 border-gray-900 object-cover" alt="User" />
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" className="w-10 h-10 rounded-full border-2 border-gray-900 object-cover" alt="User" />
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" className="w-10 h-10 rounded-full border-2 border-gray-900 object-cover" alt="User" />
              <div className="w-10 h-10 rounded-full border-2 border-gray-900 bg-emerald-500 flex items-center justify-center text-[11px] font-bold text-white z-10">
                +2K
              </div>
            </div>
            <p className="text-[13px] font-medium text-gray-200 leading-snug">
              Trusted by 2,000+ organizers<br />worldwide
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between relative bg-white">

        {/* Top Navigation (Mockup) */}
        <div className="absolute top-6 right-8 flex items-center gap-3">
          <button className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
            <Sun className="w-5 h-5" />
          </button>
          <button className="h-10 px-4 rounded-xl border border-gray-200 flex items-center justify-center gap-2 text-gray-600 hover:bg-gray-50 transition-colors font-medium text-[14px]">
            English <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 w-full pt-20 lg:pt-0">
          <div className="w-full max-w-[420px]">
            {/* Title */}
            <div className="mb-8">
              <h2 className="text-[32px] font-extrabold text-[#0f172a] mb-2 tracking-tight">Welcome back</h2>
              <p className="text-[15px] font-medium text-gray-500">Sign in to your OpenClubOS account</p>
            </div>

            <form
              method="post"
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                void form.handleSubmit(onSubmit)(e)
              }}
              className="w-full space-y-5"
            >
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-[14px] font-semibold text-gray-700 block">Email address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <Input
                    id="email"
                    placeholder="Enter your email"
                    className="pl-12 h-12 border-gray-200 focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all rounded-xl text-[15px] text-gray-900"
                    {...form.register("email")}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-[12px] text-red-500 font-medium">{form.formState.errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-[14px] font-semibold text-gray-700 block">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-12 pr-12 h-12 border-gray-200 focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all rounded-xl text-[15px] text-gray-900"
                    {...form.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-[12px] text-red-500 font-medium">{form.formState.errors.password.message}</p>
                )}
              </div>

              {/* Options */}
              <div className="flex items-center justify-between pt-1 pb-2">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className="flex items-center gap-2.5 cursor-pointer group focus:outline-none"
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${rememberMe ? 'bg-[#10b981] border-[#10b981]' : 'border-2 border-gray-300 group-hover:border-gray-400'}`}>
                    {rememberMe && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className="text-[14px] font-semibold text-gray-700">Remember me</span>
                </button>
                <a href="/forgot-password" className="text-[14px] text-[#10b981] hover:text-[#0da673] hover:underline font-bold">Forgot password?</a>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                disabled={isLoading || form.formState.isSubmitting}
                className="w-full h-12 bg-[#006A42] hover:bg-[#005233] text-white rounded-[10px] font-bold text-[15px] transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Icons.spinner className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ArrowRight className="w-[18px] h-[18px] text-white" /> Sign In
                  </>
                )}
              </Button>

              {/* Separator */}
              <div className="relative flex items-center justify-center py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <span className="relative bg-white px-4 text-[13px] font-medium text-gray-400">or continue with</span>
              </div>

              {/* Social Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className="h-12 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-[10px] font-bold text-[14px] transition-colors flex items-center justify-center gap-2.5"
                >
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.18 1-.72 1.85-1.55 2.43v2.03h2.51c1.47-1.35 2.32-3.35 2.32-5.46z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-2.51-2.03c-.69.46-1.57.73-2.51.73-2.85 0-5.27-1.92-6.13-4.51H3.54v2.06A11.991 11.991 0 0012 23z" />
                    <path fill="#FBBC05" d="M5.87 14.53c-.22-.66-.35-1.36-.35-2.03s.13-1.37.35-2.03V8.41H3.54A11.98 11.99 0 001.99 12c0 1.3.21 2.54.55 3.71l3.33-2.18z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  className="h-12 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-[10px] font-bold text-[14px] transition-colors flex items-center justify-center gap-2.5"
                >
                  <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.365 21.43c-1.327.962-2.75 1.57-4.329 1.57-1.547 0-3.003-.604-4.301-1.558C5.068 19.508 3 15.655 3 11.168c0-3.791 1.884-7.234 5.09-9.155.105-.06.216-.109.332-.143a4.708 4.708 0 0 1 1.25-.17 4.717 4.717 0 0 1 1.156.143c1.517.404 3.036 1.05 4.546 1.83.19.1.378.204.56.315 2.924 1.82 4.664 4.887 4.664 8.237 0 4.382-2.023 8.163-4.233 10.205z" fill="none" stroke="none" />
                    <path d="M12.002 23c-1.464 0-2.884-.576-4.148-1.492C5.352 19.697 3.5 15.753 3.5 11.168c0-3.486 1.637-6.721 4.526-8.62a4.417 4.417 0 0 1 1.144-.57A4.475 4.475 0 0 1 10.3 1.84c1.498.4 3.013 1.047 4.516 1.82.164.086.326.176.486.275C18.067 5.75 19.7 8.528 19.7 11.668c0 4.144-1.928 7.828-4.045 9.771C14.542 22.424 13.277 23 12.002 23zM10.428 2.296c-.34.02-.676.074-1.002.162a3.921 3.921 0 0 0-1.01.503C5.744 4.72 4 7.765 4 11.168c0 4.364 1.761 8.147 4.095 9.851 1.189.865 2.52 1.481 4.164 1.481 1.642 0 3.014-.627 4.223-1.491 2.005-1.841 3.718-5.352 3.718-9.341 0-2.991-1.562-5.63-4.183-7.29a28.09 28.09 0 0 0-.44-.248c-1.458-.75-2.925-1.376-4.368-1.761a3.96 3.96 0 0 0-.78-.173zM15.228 5.674a.5.5 0 0 1 .184.983c-1.611.638-2.613 2.115-3.033 3.633a.5.5 0 1 1-.963-.268c.48-1.737 1.643-3.411 3.483-4.141a.496.496 0 0 1 .33-.207z" />
                  </svg>
                  Apple
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-[14px] text-gray-600 font-medium">
                Don&apos;t have an account? <a href="/signup-organisation" className="text-[#006A42] font-bold hover:underline">Sign up <span className="ml-0.5">→</span></a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Security Footer */}
        <div className="w-full px-6 py-6 bg-[#f8fafc] flex items-center justify-center lg:justify-start lg:pl-12 gap-3 mt-auto border-t border-gray-100">
          <ShieldCheck className="w-6 h-6 text-[#10b981]" />
          <div>
            <p className="text-[13px] font-bold text-gray-900">Secure and trusted platform</p>
            <p className="text-[12px] font-medium text-gray-500 mt-0.5">Your data is protected with enterprise-grade security.</p>
          </div>
        </div>
      </div>

      {/* Unverified Email Modal */}
      <Modal
        isOpen={unverifiedEmail !== null}
        onClose={() => setUnverifiedEmail(null)}
        title="Email Not Verified"
        footer={
          <>
            <Button variant="outline" onClick={() => setUnverifiedEmail(null)} className="rounded-lg font-bold border-gray-200">
              Cancel
            </Button>
            <Button
              onClick={handleResendVerification}
              disabled={isResending}
              className="bg-[#10b981] hover:bg-[#0da673] border border-emerald-600/30 text-white rounded-lg font-bold px-8"
            >
              {isResending ? <Icons.spinner className="w-5 h-5 animate-spin" /> : "Send New Link"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-amber-50 text-amber-500">
            <AlertCircle className="h-10 w-10" />
          </div>
          <h4 className="text-[14px] font-bold text-gray-900 mb-2">Check your email</h4>
          <p className="text-gray-500 max-w-sm mt-1">
            You need to verify your email address before you can log in. Would you like us to send a new verification link to <span className="font-bold text-gray-800">{unverifiedEmail}</span>?
          </p>
        </div>
      </Modal>

    </div>
  )
}
