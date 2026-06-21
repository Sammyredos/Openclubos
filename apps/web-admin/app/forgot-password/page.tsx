"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/ui/icons"
import { Mail, ArrowLeft, CheckCircle2, Send, ShieldCheck } from "lucide-react"
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
    <div className="min-h-screen w-full relative flex items-center justify-center font-sans overflow-hidden bg-gray-900">
      {/* Full Screen Background Image - Missed Putt */}
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

          {pageState !== "sent" ? (
            <>
              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-[28px] font-normal text-[#1a2332] mb-1 tracking-tight">Forgot Password?</h1>
                <p className="text-[14px] font-normal text-gray-500">Don&apos;t worry, it happens to the best of us. We&apos;ll send you a link to reset it.</p>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-5">
                {/* Email field */}
                <div className="space-y-2.5">
                  <label htmlFor="reset-email" className="text-[14px] font-normal text-[#1a2332] block px-1">Email address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                      <Mail className="h-5 w-5 transition-colors group-focus-within:text-[#15803D]" />
                    </div>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-12 h-14 bg-background/50 border-gray-200 focus:bg-white focus:border-[#15803D] transition-all rounded-xl text-[15px]"
                      disabled={pageState === "loading"}
                      {...form.register("email")}
                    />
                  </div>
                  {form.formState.errors.email && (
                    <p className="text-[12px] text-red-500 px-1">{form.formState.errors.email.message}</p>
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
                    <>
                      Send Reset Link
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </Button>

                {/* Back to login */}
                <div className="pt-4 text-center">
                  <a
                    href="/login"
                    className="inline-flex items-center gap-2 text-[14px] font-normal text-[#15803D] hover:no-underline transition-all duration-200 group"
                  >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Back to Sign In
                  </a>
                </div>
              </form>
            </>
          ) : (
            <>
              {/* Success State Header */}
              <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-[#15803D] mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h1 className="text-[28px] font-normal text-[#1a2332] mb-1 tracking-tight">Check Your Email</h1>
                <p className="text-[14px] font-normal text-gray-500">We&apos;ve sent a password reset link to <span className="font-normal text-gray-700">{sentEmail}</span></p>
              </div>

              <div className="w-full space-y-6">
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5">
                  <p className="text-[13px] text-emerald-800 leading-relaxed text-center font-normal">
                    Click the link in the email to reset your password. The link will expire in 30 minutes.
                  </p>
                </div>

                <Button
                  onClick={() => { setPageState("idle"); form.setValue("email", sentEmail) }}
                  variant="outline"
                  className="w-full h-12 border-gray-100 text-[#15803D] font-normal hover:bg-emerald-50 rounded-xl"
                >
                  Resend Email
                </Button>

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
