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
    <div className="min-h-screen w-full flex bg-[#f4f6f3] font-[family-name:var(--font-space-grotesk)] text-[#111111]">
      <div className="w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row relative">
        
        {/* LEFT COLUMN - Image */}
        <div className="hidden lg:flex w-1/2 relative bg-cover bg-center border-r-[4px] border-[#111111] p-16 items-end"
             style={{ backgroundImage: "url('https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=2070&auto=format&fit=crop')" }}>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1319]/90 to-transparent" />
          
          <div className="relative z-10 text-white">
            <h1 className="text-6xl font-bold uppercase tracking-tight text-[#cfff3d] mb-4 leading-none">
              THE LEADERBOARD,<br/>DIGITIZED.
            </h1>
            <p className="text-xl max-w-[400px]">
              Sign in to manage your tournaments, track live scoring, and oversee your entire event operations.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
          <div className="w-full max-w-[480px] bg-white border-[4px] border-[#111111] p-10 shadow-[16px_16px_0_#cfff3d] relative">
            
            <h2 className="text-[2.5rem] font-bold uppercase leading-[0.95] mb-2 tracking-tighter">Welcome Back</h2>
            <p className="text-[#6b7280] text-[1.125rem] mb-10">Log in to access your dashboard.</p>

            {/* OAuth Button */}
            <button
              type="button"
              className="w-full bg-white border-[3px] border-[#111111] py-3 px-6 flex items-center justify-center gap-3 font-bold capitalize text-[1rem] shadow-[4px_4px_0_#111111] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0_#111111] mb-8"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center text-[#6b7280] font-bold text-sm uppercase tracking-widest mb-8">
              <div className="flex-1 border-b-[2px] border-[#111111]/10"></div>
              <span className="px-4">Or continue with email</span>
              <div className="flex-1 border-b-[2px] border-[#111111]/10"></div>
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
                <label htmlFor="email" className="block font-bold uppercase tracking-tight mb-2">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="golfer@example.com"
                  className="w-full bg-[#f4f6f3] border-[3px] border-[#111111] p-4 text-[1rem] font-[family-name:var(--font-space-grotesk)] transition-all focus:outline-none focus:bg-white focus:shadow-[4px_4px_0_#cfff3d]"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-[14px] text-red-600 font-bold mt-2">{form.formState.errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block font-bold uppercase tracking-tight mb-2">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full bg-[#f4f6f3] border-[3px] border-[#111111] p-4 pr-12 text-[1rem] font-[family-name:var(--font-space-grotesk)] transition-all focus:outline-none focus:bg-white focus:shadow-[4px_4px_0_#cfff3d]"
                    {...form.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-4 flex items-center text-[#111111] hover:text-[#cfff3d]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-[14px] text-red-600 font-bold mt-2">{form.formState.errors.password.message}</p>
                )}
              </div>

              {/* Options */}
              <div className="flex items-center justify-between font-bold text-sm">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 border-[3px] border-[#111111] bg-[#f4f6f3] peer-checked:bg-[#cfff3d] flex items-center justify-center transition-colors">
                      {rememberMe && <svg className="w-3 h-3 text-[#111111]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </div>
                  <span className="ml-3 uppercase">Remember me</span>
                </label>
                <a href="/forgot-password" className="uppercase underline decoration-2 hover:bg-[#111111] hover:text-[#cfff3d] transition-colors">Forgot password?</a>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading || form.formState.isSubmitting}
                className="w-full bg-[#cfff3d] border-[3px] border-[#111111] py-4 px-6 flex items-center justify-center font-bold capitalize text-[1.125rem] shadow-[4px_4px_0_#111111] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0_#111111] disabled:opacity-50 mt-4"
              >
                {isLoading ? (
                  <Icons.spinner className="w-5 h-5 animate-spin text-[#111111]" />
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="mt-8 text-center font-bold">
              <p className="text-[#111111]">
                Don't have an account? <a href="/signup-organisation" className="underline decoration-2 hover:bg-[#111111] hover:text-[#cfff3d] transition-colors">Create one</a>
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
            <button onClick={() => setUnverifiedEmail(null)} className="px-6 py-2 border-[3px] border-[#111111] font-bold uppercase hover:bg-[#111111] hover:text-[#cfff3d]">
              Cancel
            </button>
            <button
              onClick={handleResendVerification}
              disabled={isResending}
              className="px-6 py-2 bg-[#cfff3d] border-[3px] border-[#111111] font-bold capitalize shadow-[4px_4px_0_#111111] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0_#111111]"
            >
              {isResending ? <Icons.spinner className="w-5 h-5 animate-spin" /> : "Send New Link"}
            </button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4 font-[family-name:var(--font-space-grotesk)]">
          <div className="w-20 h-20 bg-[#cfff3d] border-[3px] border-[#111111] shadow-[4px_4px_0_#111111] flex items-center justify-center mb-6">
            <AlertCircle className="h-10 w-10 text-[#111111]" />
          </div>
          <h4 className="text-xl font-bold uppercase mb-2">Check your email</h4>
          <p className="text-[#6b7280]">
            You need to verify your email address before you can log in. Would you like us to send a new verification link to <span className="font-bold text-[#111111]">{unverifiedEmail}</span>?
          </p>
        </div>
      </Modal>

    </div>
  )
}
