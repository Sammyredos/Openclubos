"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Icons } from "@/components/ui/icons"
import { Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react"
import { resetPasswordRequest } from "@/lib/api/auth"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"

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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#fafafa] font-sans text-zinc-900 p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px] relative z-10"
      >
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-zinc-200/50 border border-zinc-100">
          {pageState === "success" ? (
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-6 shadow-sm">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-3">Password Reset!</h2>
              <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
                Your password has been changed successfully. You can now log in with your new password.
              </p>

              <Link href="/login" className="w-full">
                <button className="w-full bg-emerald-600 text-white font-semibold text-sm rounded-xl py-3 shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center">
                  Continue to Sign In
                </button>
              </Link>
            </div>
          ) : pageState === "error" ? (
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-6 shadow-sm">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-3">Invalid Link</h2>
              <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
                The password reset link is invalid or has expired.
              </p>

              <Link href="/forgot-password" className="w-full mb-4 block">
                <button className="w-full bg-white border border-zinc-200 text-zinc-700 font-semibold text-sm rounded-xl py-3 shadow-sm hover:bg-zinc-50 active:scale-[0.98] transition-all flex items-center justify-center">
                  Request a New Link
                </button>
              </Link>
              
              <Link href="/login" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 mb-6 shadow-sm">
                  <Icons.logo className="w-6 h-6 text-emerald-600" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">New Password</h1>
                <p className="text-zinc-500 text-sm font-medium">Enter your new password below.</p>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* New Password field */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-semibold text-zinc-700 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 pr-12 text-zinc-900 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      disabled={pageState === "loading"}
                      {...form.register("newPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.formState.errors.newPassword && (
                    <p className="text-xs font-medium text-red-600 mt-2">{form.formState.errors.newPassword.message}</p>
                  )}
                </div>

                {/* Confirm Password field */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-zinc-700 mb-2">Confirm Password</label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 pr-12 text-zinc-900 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      disabled={pageState === "loading"}
                      {...form.register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                  className="w-full bg-emerald-600 text-white font-semibold text-sm rounded-xl py-3 shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center mt-2"
                >
                  {pageState === "loading" ? (
                    <Icons.spinner className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
