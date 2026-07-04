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
    <div className="min-h-screen w-full flex bg-[#f4f6f3] font-[family-name:var(--font-space-grotesk)] text-[#111111]">
      <div className="w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row relative">
        
        {/* LEFT COLUMN - Image */}
        <div className="hidden lg:flex w-1/2 relative bg-cover bg-center border-r-[4px] border-[#111111] p-16 items-end"
             style={{ backgroundImage: "url('https://images.unsplash.com/photo-1591491640784-3232eb748d4b?q=80&w=2070&auto=format&fit=crop')" }}>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1319]/90 to-transparent" />
          
          <div className="relative z-10 text-white">
            <h1 className="text-6xl font-bold uppercase tracking-tight text-[#cfff3d] mb-4 leading-none">
              LOST YOUR<br/>SCORECARD?
            </h1>
            <p className="text-xl max-w-[400px]">
              Don't let a forgotten password disrupt your tournament. Enter your email to regain access to the organizer dashboard.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
          <div className="w-full max-w-[480px] bg-white border-[4px] border-[#111111] p-10 shadow-[16px_16px_0_#cfff3d] relative">
            
            {pageState !== "sent" ? (
              <>
                <h2 className="text-[2.5rem] font-bold uppercase leading-[0.95] mb-2 tracking-tighter">Reset Password</h2>
                <p className="text-[#6b7280] text-[1.125rem] mb-10">Enter your email to receive a recovery link.</p>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Email */}
                  <div>
                    <label htmlFor="reset-email" className="block font-bold uppercase tracking-tight mb-2">Email Address</label>
                    <input
                      id="reset-email"
                      type="email"
                      placeholder="golfer@example.com"
                      className="w-full bg-[#f4f6f3] border-[3px] border-[#111111] p-4 text-[1rem] font-[family-name:var(--font-space-grotesk)] transition-all focus:outline-none focus:bg-white focus:shadow-[4px_4px_0_#cfff3d]"
                      disabled={pageState === "loading"}
                      {...form.register("email")}
                    />
                    {form.formState.errors.email && (
                      <p className="text-[14px] text-red-600 font-bold mt-2">{form.formState.errors.email.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={pageState === "loading"}
                    className="w-full bg-[#cfff3d] border-[3px] border-[#111111] py-4 px-6 flex items-center justify-center font-bold capitalize text-[1.125rem] shadow-[4px_4px_0_#111111] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0_#111111] disabled:opacity-50 mt-4"
                  >
                    {pageState === "loading" ? (
                      <Icons.spinner className="w-5 h-5 animate-spin text-[#111111]" />
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </form>

                <div className="mt-8 text-center font-bold">
                  <p className="text-[#111111]">
                    Remembered your password? <a href="/login" className="underline decoration-2 hover:bg-[#111111] hover:text-[#cfff3d] transition-colors">Sign in</a>
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-[#cfff3d] border-[3px] border-[#111111] shadow-[4px_4px_0_#111111] flex items-center justify-center mb-8">
                    <CheckCircle2 className="h-10 w-10 text-[#111111]" />
                  </div>
                  
                  <h2 className="text-[2.5rem] font-bold uppercase leading-[0.95] mb-4 tracking-tighter">Check Your Email</h2>
                  <p className="text-[#6b7280] text-[1.125rem] mb-8">
                    We've sent a password reset link to <span className="font-bold text-[#111111]">{sentEmail}</span>. The link will expire in 30 minutes.
                  </p>

                  <button
                    onClick={() => { setPageState("idle"); form.setValue("email", sentEmail) }}
                    className="w-full bg-white border-[3px] border-[#111111] py-4 px-6 flex items-center justify-center font-bold uppercase text-[1.125rem] shadow-[4px_4px_0_#111111] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0_#111111] mb-6"
                  >
                    Resend Email
                  </button>

                  <div className="text-center font-bold">
                    <a href="/login" className="underline decoration-2 hover:bg-[#111111] hover:text-[#cfff3d] transition-colors">Back to Sign In</a>
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
