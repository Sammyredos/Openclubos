"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/ui/icons"
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react"
import { resetPasswordRequest } from "@/lib/api/auth"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"

const schema = z.object({
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters long." }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
})

type FormValues = z.infer<typeof schema>

type PageState = "idle" | "loading" | "success" | "error"

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={null}>
      <ResetPasswordPageInner />
    </React.Suspense>
  )
}

function ResetPasswordPageInner() {
  const [pageState, setPageState] = React.useState<PageState>("idle")
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  })

  // If there's no token in the URL, we shouldn't allow submission
  React.useEffect(() => {
    if (!token) {
      setPageState("error")
      toast.error("Invalid or missing reset token. Please request a new password reset link.")
    }
  }, [token])

  async function onSubmit(data: FormValues) {
    if (!token) return
    setPageState("loading")
    try {
      await resetPasswordRequest(token, data.newPassword)
      setPageState("success")
      toast.success("Password has been reset successfully.")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setPageState("idle")
    }
  }

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center font-sans overflow-hidden bg-gray-900">
      {/* Full Screen Background Image - Missed Putt or Golf Course */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1591491640784-3232eb748d4b?q=80&w=2070&auto=format&fit=crop" 
          alt="Missed Putt on Green" 
          className="w-full h-full object-cover opacity-90"
        />
        {/* Dark Overlay for better contrast */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>

      <div className="w-full max-w-[460px] px-4 z-10 relative transform scale-90 sm:scale-100 py-12">
        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] px-10 py-10 border border-white/20 flex flex-col items-center">
          
          {/* Logo */}
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-[#15803D] rounded-full flex items-center justify-center text-white shadow-lg shadow-openclub-700/20">
              <Icons.logo className="w-7 h-7" />
            </div>
            <span className="text-[14px] font-normal text-[#1a2332] tracking-tight">OpenClub</span>
          </div>

          {pageState === "success" ? (
            <>
              {/* Success State Header */}
              <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-[#15803D] mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h1 className="text-[28px] font-normal text-[#1a2332] mb-1 tracking-tight">Password Reset!</h1>
                <p className="text-[14px] font-normal text-gray-500">Your password has been changed successfully.</p>
              </div>

              <div className="w-full space-y-6">
                <a href="/login" className="block w-full">
                  <Button
                    className="w-full h-12 bg-[#15803D] hover:bg-[#166534] border border-openclub-800/30 text-white rounded-lg font-normal text-[15px] transition-colors flex items-center justify-center gap-3"
                  >
                    Continue to Sign In
                  </Button>
                </a>
              </div>
            </>
          ) : pageState === "error" ? (
            <>
              {/* Error State Header */}
              <div className="text-center mb-8">
                <h1 className="text-[28px] font-normal text-[#1a2332] mb-1 tracking-tight">Invalid Link</h1>
                <p className="text-[14px] font-normal text-gray-500">The password reset link is invalid or has expired.</p>
              </div>

              <div className="w-full space-y-6">
                <a href="/forgot-password" className="block w-full">
                  <Button
                    className="w-full h-12 bg-[#15803D] hover:bg-[#166534] border border-openclub-800/30 text-white rounded-lg font-normal text-[15px] transition-colors flex items-center justify-center gap-3"
                  >
                    Request a New Link
                  </Button>
                </a>
                <div className="text-center">
                  <a
                    href="/login"
                    className="inline-flex items-center gap-2 text-[14px] font-normal text-gray-400 hover:text-[#15803D] transition-all duration-200 group"
                  >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Back to Sign In
                  </a>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-[28px] font-normal text-[#1a2332] mb-1 tracking-tight">Create New Password</h1>
                <p className="text-[14px] font-normal text-gray-500">Enter your new password below.</p>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-5">
                {/* New Password field */}
                <div className="space-y-2.5">
                  <label htmlFor="newPassword" className="text-[14px] font-normal text-[#1a2332] block px-1">New Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                      <Lock className="h-5 w-5 transition-colors group-focus-within:text-[#15803D]" />
                    </div>
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      className="pl-12 pr-12 h-14 bg-background/50 border-gray-200 focus:bg-white focus:border-[#15803D] transition-all rounded-xl text-[15px]"
                      disabled={pageState === "loading"}
                      {...form.register("newPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {form.formState.errors.newPassword && (
                    <p className="text-[12px] text-red-500 px-1">{form.formState.errors.newPassword.message}</p>
                  )}
                </div>

                {/* Confirm Password field */}
                <div className="space-y-2.5">
                  <label htmlFor="confirmPassword" className="text-[14px] font-normal text-[#1a2332] block px-1">Confirm Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                      <ShieldCheck className="h-5 w-5 transition-colors group-focus-within:text-[#15803D]" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      className="pl-12 pr-12 h-14 bg-background/50 border-gray-200 focus:bg-white focus:border-[#15803D] transition-all rounded-xl text-[15px]"
                      disabled={pageState === "loading"}
                      {...form.register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {form.formState.errors.confirmPassword && (
                    <p className="text-[12px] text-red-500 px-1">{form.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Submit */}
                <Button
                  disabled={pageState === "loading"}
                  className="w-full h-12 bg-[#15803D] hover:bg-[#166534] border border-openclub-800/30 text-white rounded-lg font-normal text-[15px] transition-colors flex items-center justify-center gap-3 mt-4"
                >
                  {pageState === "loading" ? (
                    <Icons.spinner className="h-5 w-5 animate-spin" />
                  ) : (
                    "Reset Password"
                  )}
                </Button>

                {/* Back to login */}
                <div className="pt-4 text-center">
                  <a
                    href="/login"
                    className="inline-flex items-center gap-2 text-[14px] font-normal text-gray-400 hover:text-[#15803D] transition-all duration-200 group"
                  >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Back to Sign In
                  </a>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Footer Text */}
        <div className="mt-8 text-center">
          <p className="text-[12px] font-normal text-white/70 tracking-wide drop-shadow-sm">
            © 2026 OpenClub. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
