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
    <div className="min-h-screen w-full flex bg-[#fafafa] font-sans text-zinc-900">
      <div className="w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row relative">
        
        {/* LEFT COLUMN - Image */}
        <div className="hidden lg:flex w-1/2 relative bg-cover bg-center border-r border-zinc-200 p-16 items-end"
             style={{ backgroundImage: "url('https://images.unsplash.com/photo-1591491640784-3232eb748d4b?q=80&w=2070&auto=format&fit=crop')" }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/10" />
          
          <div className="relative z-10 text-white">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 leading-tight">
              Lost Your<br/>Scorecard?
            </h1>
            <p className="text-lg max-w-[400px] text-zinc-200 font-medium">
              Don't let a forgotten password disrupt your tournament. Enter your email to regain access to the organizer dashboard.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 relative">
          {/* Subtle background glow */}
          <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-50 rounded-full blur-[100px] opacity-50 pointer-events-none" />
          
          <div className="w-full max-w-[480px] bg-white rounded-3xl p-10 shadow-xl shadow-zinc-200/50 border border-zinc-100 relative z-10">
            
            {pageState !== "sent" ? (
              <>
                <h2 className="text-3xl font-bold tracking-tight mb-2 text-zinc-900">Reset Password</h2>
                <p className="text-zinc-500 mb-10">Enter your email to receive a recovery link.</p>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Email */}
                  <div>
                    <label htmlFor="reset-email" className="block font-semibold text-sm text-zinc-700 mb-2">Email Address</label>
                    <input
                      id="reset-email"
                      type="email"
                      placeholder="golfer@example.com"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-sm text-zinc-900 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
                    className="w-full bg-emerald-600 text-white rounded-xl py-3 px-6 flex items-center justify-center font-semibold text-sm shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50 mt-4"
                  >
                    {pageState === "loading" ? (
                      <Icons.spinner className="w-5 h-5 animate-spin text-white" />
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </form>

                <div className="mt-8 text-center font-medium text-sm">
                  <p className="text-zinc-500">
                    Remembered your password? <a href="/login" className="text-emerald-600 hover:text-emerald-700 transition-colors">Sign in</a>
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mb-8 border border-emerald-100 shadow-sm">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  </div>
                  
                  <h2 className="text-3xl font-bold tracking-tight mb-4 text-zinc-900">Check Your Email</h2>
                  <p className="text-zinc-500 mb-8 font-medium">
                    We've sent a password reset link to <span className="text-zinc-900 font-semibold">{sentEmail}</span>. The link will expire in 30 minutes.
                  </p>

                  <button
                    onClick={() => { setPageState("idle"); form.setValue("email", sentEmail) }}
                    className="w-full bg-white border border-zinc-200 py-3 px-6 rounded-xl flex items-center justify-center font-semibold text-sm text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 hover:border-zinc-300 mb-6"
                  >
                    Resend Email
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
