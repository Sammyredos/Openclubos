"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/ui/icons"
import { Mail, Lock, Eye, EyeOff, ArrowRight, UserPlus, CheckSquare, User, User2 } from "lucide-react"
import { useAuth } from "@/lib/auth/AuthContext"
import { loginRequest } from "@/lib/api/auth"
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
      toast.error(
        err instanceof Error ? err.message : "Invalid email or password. Please check your credentials and try again.",
      );
      // Only re-enable on failure so the user can retry
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center font-sans overflow-hidden bg-gray-900">
      {/* Full Screen Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=2070&auto=format&fit=crop" 
          alt="Golf Course" 
          className="w-full h-full object-cover"
        />
        {/* Dark Overlay for better contrast */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>

      {/* Login Card Container */}
      <div className="w-full max-w-[460px] px-4 z-10 relative transform scale-90 sm:scale-100 py-12">
        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] px-10 py-10 border border-white/20 flex flex-col items-center">
          
          {/* Logo */}
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-[#10b981] rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Icons.logo className="w-7 h-7" />
            </div>
            <span className="text-xl font-bold text-[#1a2332] tracking-tight">OpenClub</span>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-[28px] font-bold text-[#1a2332] mb-1 tracking-tight">Welcome Back!</h1>
            <p className="text-[14px] font-normal text-gray-500">Sign in to your account to continue</p>
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
            {/* Email/ID */}
            <div className="space-y-2.5">
              <label htmlFor="email" className="text-[14px] font-bold text-[#1a2332] block px-1">Email or Membership ID</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                  <User className="w-5 h-5" />
                </div>
                <Input
                  id="email"
                  placeholder="Enter your email or membership ID"
                  className="pl-12 h-14 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#10b981] transition-all rounded-xl text-[15px]"
                  {...form.register("email")}
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-[12px] text-red-500 px-1">{form.formState.errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2.5">
              <label htmlFor="password" className="text-[14px] font-bold text-[#1a2332] block px-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="pl-12 pr-12 h-14 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#10b981] transition-all rounded-xl text-[15px]"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between px-1 py-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center group-hover:border-[#10b981] transition-colors">
                  <CheckSquare className="w-4 h-4 text-transparent group-hover:text-gray-200" />
                </div>
                <span className="text-[13px] font-medium text-[#1a2332]">Remember me</span>
              </label>
              <a href="/forgot-password" className="text-[13px] text-[#10b981] hover:underline font-medium">Forgot Password?</a>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={isLoading || form.formState.isSubmitting}
              className="w-full h-12 bg-[#10b981] hover:bg-[#0da673] border border-emerald-600/30 text-white rounded-lg font-bold text-[15px] transition-colors flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <Icons.spinner className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <User2 className="w-5 h-5" /> Sign In
                </>
              )}
            </Button>

            {/* Separator */}
            <div className="relative flex items-center justify-center py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <span className="relative bg-white/0 px-4 text-[12px] font-bold text-gray-400 uppercase tracking-widest">OR</span>
            </div>

            {/* Google Button */}
            <button
              type="button"
              className="w-full h-12 bg-white border border-gray-200 hover:bg-gray-50 text-[#1a2332] rounded-lg font-bold text-[14px] transition-colors flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.18 1-.72 1.85-1.55 2.43v2.03h2.51c1.47-1.35 2.32-3.35 2.32-5.46z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-2.51-2.03c-.69.46-1.57.73-2.51.73-2.85 0-5.27-1.92-6.13-4.51H3.54v2.06A11.991 11.991 0 0012 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.87 14.53c-.22-.66-.35-1.36-.35-2.03s.13-1.37.35-2.03V8.41H3.54A11.98 11.99 0 001.99 12c0 1.3.21 2.54.55 3.71l3.33-2.18z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[13px] text-gray-500">
              Don&apos;t have an acccount? <a href="#" className="text-[#10b981] font-bold hover:underline">Contact Administrator</a>
            </p>
          </div>
        </div>

        {/* Footer Text */}
        <div className="mt-8 text-center">
          <p className="text-[12px] font-medium text-white/70 tracking-wide drop-shadow-sm">
            © 2026 OpenClub. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
