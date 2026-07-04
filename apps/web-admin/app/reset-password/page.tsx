"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Icons } from "@/components/ui/icons"
import { Eye, EyeOff, CheckCircle2 } from "lucide-react"
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
    <div className="min-h-screen w-full flex bg-[#f4f6f3] font-[family-name:var(--font-space-grotesk)] text-[#111111]">
      <div className="w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row relative">
        
        {/* LEFT COLUMN - Image */}
        <div className="hidden lg:flex w-1/2 relative bg-cover bg-center border-r-[4px] border-[#111111] p-16 items-end"
             style={{ backgroundImage: "url('https://images.unsplash.com/photo-1591491640784-3232eb748d4b?q=80&w=2070&auto=format&fit=crop')" }}>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1319]/90 to-transparent" />
          
          <div className="relative z-10 text-white">
            <h1 className="text-6xl font-bold uppercase tracking-tight text-[#cfff3d] mb-4 leading-none">
              BACK IN<br/>THE GAME.
            </h1>
            <p className="text-xl max-w-[400px]">
              Set a strong new password to secure your tournament data and get back to managing your events.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
          <div className="w-full max-w-[480px] bg-white border-[4px] border-[#111111] p-10 shadow-[16px_16px_0_#cfff3d] relative">
            
            {pageState === "success" ? (
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-[#cfff3d] border-[3px] border-[#111111] shadow-[4px_4px_0_#111111] flex items-center justify-center mb-8">
                  <CheckCircle2 className="h-10 w-10 text-[#111111]" />
                </div>
                
                <h2 className="text-[2.5rem] font-bold uppercase leading-[0.95] mb-4 tracking-tighter">Password Reset!</h2>
                <p className="text-[#6b7280] text-[1.125rem] mb-8 font-bold">
                  Your password has been changed successfully.
                </p>

                <a href="/login" className="w-full">
                  <button className="w-full bg-[#cfff3d] border-[3px] border-[#111111] py-4 px-6 flex items-center justify-center font-bold capitalize text-[1.125rem] shadow-[4px_4px_0_#111111] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0_#111111]">
                    Continue to Sign In
                  </button>
                </a>
              </div>
            ) : pageState === "error" ? (
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-red-100 border-[3px] border-[#111111] shadow-[4px_4px_0_#111111] flex items-center justify-center mb-8">
                  <Icons.logo className="h-10 w-10 text-[#111111]" />
                </div>
                
                <h2 className="text-[2.5rem] font-bold uppercase leading-[0.95] mb-4 tracking-tighter">Invalid Link</h2>
                <p className="text-[#6b7280] text-[1.125rem] mb-8 font-bold">
                  The password reset link is invalid or has expired.
                </p>

                <a href="/forgot-password" className="w-full mb-6">
                  <button className="w-full bg-[#cfff3d] border-[3px] border-[#111111] py-4 px-6 flex items-center justify-center font-bold capitalize text-[1.125rem] shadow-[4px_4px_0_#111111] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0_#111111]">
                    Request a New Link
                  </button>
                </a>
                
                <div className="text-center font-bold">
                  <a href="/login" className="underline decoration-2 hover:bg-[#111111] hover:text-[#cfff3d] transition-colors">Back to Sign In</a>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-[2.5rem] font-bold uppercase leading-[0.95] mb-2 tracking-tighter">New Password</h2>
                <p className="text-[#6b7280] text-[1.125rem] mb-10">Enter your new password below.</p>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* New Password field */}
                  <div>
                    <label htmlFor="newPassword" className="block font-bold uppercase tracking-tight mb-2">New Password</label>
                    <div className="relative">
                      <input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="w-full bg-[#f4f6f3] border-[3px] border-[#111111] p-4 pr-12 text-[1rem] font-[family-name:var(--font-space-grotesk)] transition-all focus:outline-none focus:bg-white focus:shadow-[4px_4px_0_#cfff3d]"
                        disabled={pageState === "loading"}
                        {...form.register("newPassword")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-4 flex items-center text-[#111111] hover:text-[#cfff3d]"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {form.formState.errors.newPassword && (
                      <p className="text-[14px] text-red-600 font-bold mt-2">{form.formState.errors.newPassword.message}</p>
                    )}
                  </div>

                  {/* Confirm Password field */}
                  <div>
                    <label htmlFor="confirmPassword" className="block font-bold uppercase tracking-tight mb-2">Confirm Password</label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="w-full bg-[#f4f6f3] border-[3px] border-[#111111] p-4 pr-12 text-[1rem] font-[family-name:var(--font-space-grotesk)] transition-all focus:outline-none focus:bg-white focus:shadow-[4px_4px_0_#cfff3d]"
                        disabled={pageState === "loading"}
                        {...form.register("confirmPassword")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-4 flex items-center text-[#111111] hover:text-[#cfff3d]"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {form.formState.errors.confirmPassword && (
                      <p className="text-[14px] text-red-600 font-bold mt-2">{form.formState.errors.confirmPassword.message}</p>
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
                      "Reset Password"
                    )}
                  </button>
                </form>

                <div className="mt-8 text-center font-bold">
                  <a href="/login" className="underline decoration-2 hover:bg-[#111111] hover:text-[#cfff3d] transition-colors">Back to Sign In</a>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
