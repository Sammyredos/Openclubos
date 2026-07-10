"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Icons } from "@/components/ui/icons"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth/AuthContext"
import { loginRequest, resendVerificationRequest } from "@/lib/api/auth"
import { Modal } from "@/components/ui/modal"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"

const loginSchema = z.object({
  email: z.string().min(1, { message: "Please enter your email." }),
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
      if (reason === "suspended") toast.error("Your account has been suspended. Please contact support.")
      else if (reason === "expired") toast.error("Your account has expired. Please contact support.")
      else if (reason === "revoked") toast.error("Your session has been ended. Please login again.")
      else toast.error("You have been logged out.")
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid email or password.";
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
    <div className="min-h-screen w-full flex bg-background font-sans text-zinc-900">
      <div className="w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row relative">

        {/* LEFT COLUMN - Image */}
        <div className="hidden lg:flex w-1/2 relative bg-cover bg-center border-r border-zinc-200 p-16 items-end"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=2070&auto=format&fit=crop')" }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/10" />

          <div className="relative z-10 text-white">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 leading-tight">
              The Leaderboard,<br />Digitized.
            </h1>
            <p className="text-lg max-w-[400px] text-zinc-200 font-medium">
              Sign in to manage your tournaments, track live scoring, and oversee your entire event operations.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 relative">
          {/* Subtle background glow */}
          <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-50 rounded-full blur-[100px] opacity-50 pointer-events-none" />

          <div className="w-full max-w-[480px] bg-white rounded-3xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-zinc-100 relative z-10">

            <h2 className="text-3xl font-bold tracking-tight mb-2 text-zinc-900">Welcome Back</h2>
            <p className="text-zinc-500 mb-10">Log in to access your dashboard.</p>

            {/* OAuth Button */}
            <button
              type="button"
              className="w-full bg-white border border-zinc-200 py-3 px-6 rounded-xl flex items-center justify-center gap-3 font-semibold text-sm text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 hover:border-zinc-300 mb-8"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center text-zinc-400 font-semibold text-xs tracking-widest mb-8">
              <div className="flex-1 border-b border-zinc-200"></div>
              <span className="px-4 uppercase">Or continue with email</span>
              <div className="flex-1 border-b border-zinc-200"></div>
            </div>

            <form
              method="post"
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                void form.handleSubmit(onSubmit)(e)
              }}
              className="space-y-6"
            >
              {/* Email */}
              <div>
                <label htmlFor="email" className="block font-semibold text-sm text-zinc-700 mb-2">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="golfer@example.com"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-sm text-zinc-900 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-red-600 font-medium mt-2">{form.formState.errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block font-semibold text-sm text-zinc-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 pr-12 text-sm text-zinc-900 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
                  <p className="text-xs text-red-600 font-medium mt-2">{form.formState.errors.password.message}</p>
                )}
              </div>

              {/* Options */}
              <div className="flex items-center justify-between font-semibold text-sm">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 rounded border border-zinc-300 bg-zinc-50 peer-checked:bg-emerald-600 peer-checked:border-emerald-600 flex items-center justify-center transition-colors">
                      {rememberMe && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </div>
                  <span className="ml-3 text-zinc-600">Remember me</span>
                </label>
                <a href="/forgot-password" className="text-emerald-600 hover:text-emerald-700 transition-colors">Forgot password?</a>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading || form.formState.isSubmitting}
                className="w-full bg-emerald-600 text-white rounded-xl py-3 px-6 flex items-center justify-center font-semibold text-sm shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50 mt-4"
              >
                {isLoading ? (
                  <Icons.spinner className="w-5 h-5 animate-spin text-white" />
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="mt-8 text-center font-medium text-sm">
              <p className="text-zinc-500">
                Don't have an account? <a href="/signup-organisation" className="text-emerald-600 hover:text-emerald-700 transition-colors">Create one</a>
              </p>
            </div>
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
            <button onClick={() => setUnverifiedEmail(null)} className="px-6 py-2 rounded-xl border border-zinc-200 font-semibold text-sm text-zinc-700 hover:bg-zinc-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleResendVerification}
              disabled={isResending}
              className="px-6 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-sm shadow-sm hover:bg-emerald-700 transition-all flex items-center justify-center"
            >
              {isResending ? <Icons.spinner className="w-4 h-4 animate-spin" /> : "Send New Link"}
            </button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4 font-sans">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h4 className="text-xl font-bold mb-2 text-zinc-900">Check your email</h4>
          <p className="text-zinc-500">
            You need to verify your email address before you can log in. Would you like us to send a new verification link to <span className="font-semibold text-zinc-900">{unverifiedEmail}</span>?
          </p>
        </div>
      </Modal>

    </div>
  )
}
