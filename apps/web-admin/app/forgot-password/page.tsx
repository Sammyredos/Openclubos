"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Icons } from "@/components/ui/icons"
import { CheckCircle2 } from "lucide-react"
import { forgotPasswordRequest } from "@/lib/api/auth"
import { toast } from "sonner"

const schema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
})

type FormValues = z.infer<typeof schema>

type PageState = "idle" | "loading" | "sent"

export default function ForgotPasswordPage() {
  const [pageState, setPageState] = React.useState<PageState>("idle")
  const [sentEmail, setSentEmail] = React.useState("")
  const [countdown, setCountdown] = React.useState(0)

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleResend = async () => {
    if (countdown > 0) return
    try {
      await forgotPasswordRequest(sentEmail)
      setCountdown(60)
      toast.success("Password reset email sent again.")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.")
    }
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  })

  async function onSubmit(data: FormValues) {
    setPageState("loading")
    try {
      await forgotPasswordRequest(data.email)
      setSentEmail(data.email)
      setPageState("sent")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setPageState("idle")
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 font-sans text-zinc-900">
      <div className="w-full max-w-[1440px] mx-auto flex justify-center relative">
        
        {/* RIGHT COLUMN - Form */}
        <div className="w-full flex flex-col items-center justify-center p-2 md:p-8 lg:p-16 relative">
          


          {/* Subtle background glow */}
          <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-50 rounded-full blur-[100px] opacity-50 pointer-events-none" />
          
          <div className="w-full max-w-[480px] md:max-w-[420px] lg:max-w-[730px] lg:h-[515px] flex flex-col justify-center bg-white rounded-3xl p-6 md:p-10 lg:p-16 border border-zinc-100 relative z-10">
            
            {pageState !== "sent" ? (
              <div className="flex flex-col items-center w-full">
                <div className="text-center w-full mb-8">
                  <h2 className="text-[28px] font-bold tracking-tight mb-2 text-zinc-900">Forgot password?</h2>
                  <p className="text-zinc-500 text-[15px]">No worries, we'll send you reset instructions.</p>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full">
                  {/* Email */}
                  <div>
                    <label htmlFor="reset-email" className="block font-medium text-sm text-zinc-700 mb-2">Email</label>
                    <input
                      id="reset-email"
                      type="email"
                      placeholder="Enter your email"
                      className="w-full bg-[#f5faf6] border border-[#e1efe5] rounded-xl p-3 text-sm text-zinc-900 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      disabled={pageState === "loading"}
                      {...form.register("email")}
                    />
                    {form.formState.errors.email && (
                      <p className="text-xs text-red-600 font-medium mt-2">{form.formState.errors.email.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={pageState === "loading"}
                    className="w-full bg-emerald-600 text-white rounded-xl py-3 px-6 flex items-center justify-center font-semibold text-sm transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 mt-2"
                  >
                    {pageState === "loading" ? (
                      <Icons.spinner className="w-5 h-5 animate-spin text-white" />
                    ) : (
                      "Reset Password"
                    )}
                  </button>
                </form>

                <div className="mt-8 text-center font-medium text-sm">
                  <a href="/login" className="text-emerald-600 hover:text-emerald-700 transition-colors flex items-center justify-center gap-2">
                    Back to login
                  </a>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mb-8 border border-emerald-100">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  </div>
                  
                  <h2 className="text-3xl font-bold tracking-tight mb-4 text-zinc-900">Check Your Email</h2>
                  <p className="text-zinc-500 mb-8 font-medium">
                    We've sent a password reset link to <span className="text-zinc-900 font-semibold">{sentEmail}</span>. The link will expire in 5 minutes.
                  </p>

                  <button
                    onClick={handleResend}
                    disabled={countdown > 0}
                    className="w-full bg-white border border-zinc-200 py-3 px-6 rounded-xl flex items-center justify-center font-semibold text-sm text-zinc-700 transition-all hover:bg-zinc-50 hover:border-zinc-300 mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {countdown > 0 ? `Resend Email in ${countdown}s` : "Resend Email"}
                  </button>

                  <div className="text-center font-medium text-sm">
                    <a href="/login" className="text-emerald-600 hover:text-emerald-700 transition-colors">Back to Sign In</a>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
