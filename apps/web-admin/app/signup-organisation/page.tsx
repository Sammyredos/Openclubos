"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/ui/icons"
import {
  Mail, Lock, User, Building2, Eye, EyeOff, Sun, ChevronDown,
  Trophy, LineChart, PieChart, ShieldCheck, ArrowRight, ArrowLeft, Upload, X
} from "lucide-react"
import { registerOrganizationRequest } from "@/lib/api/auth"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

async function compressImage(file: File, targetKB = 50): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      const MAX_DIM = 400;
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      let lo = 0.1, hi = 0.9, best = "";
      const target = targetKB * 1024;
      for (let i = 0; i < 8; i++) {
        const mid = (lo + hi) / 2;
        const data = canvas.toDataURL("image/jpeg", mid);
        const bytes = Math.round((data.length * 3) / 4);
        if (bytes <= target) { best = data; lo = mid; }
        else hi = mid;
      }
      if (!best) best = canvas.toDataURL("image/jpeg", 0.1);
      resolve(best);
    };
    img.onerror = reject;
    img.src = url;
  });
}

const schema = z.object({
  organizationLogo: z.string().min(1, "Organization logo is required"),
  organizationName: z.string().min(2, "Organization name is required"),
  organizationType: z.string().min(1, "Organization type is required"),
  customOrganizationType: z.string().optional(),
  adminFirstName: z.string().min(2, "First name is required"),
  adminMiddleName: z.string().min(1, "Middle name is required"),
  adminLastName: z.string().min(2, "Last name is required"),
  adminEmail: z.string().email("Please enter a valid email address"),
  adminPassword: z.string().min(8, "Password must be at least 8 chars"),
  confirmPassword: z.string(),
}).refine((data) => {
  if (data.organizationType === "Other" && (!data.customOrganizationType || data.customOrganizationType.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Custom organization type is required",
  path: ["customOrganizationType"]
}).refine((data) => data.adminPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type FormValues = z.infer<typeof schema>

export default function SignupOrganisationPage() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [step, setStep] = React.useState(1)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      organizationLogo: "",
      organizationName: "",
      organizationType: "",
      customOrganizationType: "",
      adminFirstName: "",
      adminMiddleName: "",
      adminLastName: "",
      adminEmail: "",
      adminPassword: "",
      confirmPassword: "",
    },
    mode: "onChange",
  })

  const { watch, setValue, formState: { errors } } = form;
  const logo = watch("organizationLogo");
  const orgType = watch("organizationType");

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 50);
      setValue("organizationLogo", compressed, { shouldValidate: true });
    } catch (err: unknown) {
      toast.error("Failed to process image");
    }
  };

  const handleNext = async () => {
    let fieldsToValidate: any[] = []
    if (step === 1) {
      fieldsToValidate = ["organizationName", "organizationType"];
      if (orgType === "Other") fieldsToValidate.push("customOrganizationType");
    }
    if (step === 2) {
      fieldsToValidate = ["organizationLogo"];
    }
    if (step === 3) {
      fieldsToValidate = ["adminFirstName", "adminMiddleName", "adminLastName", "adminEmail"];
    }

    const isValid = await form.trigger(fieldsToValidate)
    if (isValid) setStep(s => s + 1)
  }

  const handleBack = () => {
    setStep(s => s - 1)
  }

  async function onSubmit(data: FormValues) {
    if (step !== 4) return;

    setIsLoading(true)
    try {
      await registerOrganizationRequest({
        organizationLogo: data.organizationLogo,
        organizationName: data.organizationName,
        organizationType: data.organizationType,
        customOrganizationType: data.organizationType === "Other" ? data.customOrganizationType : undefined,
        adminFirstName: data.adminFirstName,
        adminMiddleName: data.adminMiddleName,
        adminLastName: data.adminLastName,
        adminEmail: data.adminEmail,
        adminPassword: data.adminPassword,
      })
      toast.success("Organization created successfully! Please log in.")
      router.push("/login")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  const isStep1Valid = !!watch("organizationName") && !!watch("organizationType") && (watch("organizationType") !== "Other" || !!watch("customOrganizationType"));
  const isStep2Valid = !!watch("organizationLogo");
  const isStep3Valid = !!watch("adminFirstName") && !!watch("adminMiddleName") && !!watch("adminLastName") && !!watch("adminEmail") && !errors.adminEmail;
  const isStep4Valid = !!watch("adminPassword") && watch("adminPassword").length >= 8 && watch("adminPassword") === watch("confirmPassword");

  return (
    <div className="min-h-screen w-full flex bg-white font-sans overflow-x-hidden">

      {/* LEFT COLUMN - Marketing & Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 text-white">
        {/* Background Image & Gradient */}
        <div className="absolute inset-0 z-0 fixed w-1/2">
          <img
            src="https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=2070&auto=format&fit=crop"
            alt="Golf Course"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
        </div>

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#10b981] rounded-full flex items-center justify-center text-white shadow-lg">
            <Icons.logo className="w-6 h-6" />
          </div>
          <span className="text-[22px] font-bold tracking-tight">OpenClubOS</span>
        </div>

        {/* Center Content */}
        <div className="relative z-10 max-w-lg mt-12 mb-auto pb-10">
          <h1 className="text-[44px] leading-[1.1] font-bold mb-6">
            The all-in-one<br />platform for golf<br />tournaments
          </h1>
          <p className="text-[17px] text-gray-200 mb-12 font-medium leading-relaxed">
            Join thousands of organizers managing players, courses and scores seamlessly.
          </p>

          <div className="space-y-8">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <Trophy className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-[15px] mb-1">Organize Tournaments</h3>
                <p className="text-gray-300 text-[14px] leading-snug">Create and manage professional golf tournaments effortlessly.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <LineChart className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-[15px] mb-1">Live Scoring</h3>
                <p className="text-gray-300 text-[14px] leading-snug">Real-time scores and leaderboards that keep everyone updated.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <PieChart className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-[15px] mb-1">Powerful Analytics</h3>
                <p className="text-gray-300 text-[14px] leading-snug">Insights and reports to grow your golf community.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trusted Widget */}
        <div className="relative z-10">
          <div className="inline-flex flex-col gap-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 pr-10">
            <div className="flex -space-x-3">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" className="w-10 h-10 rounded-full border-2 border-gray-900 object-cover" alt="User" />
              <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" className="w-10 h-10 rounded-full border-2 border-gray-900 object-cover" alt="User" />
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" className="w-10 h-10 rounded-full border-2 border-gray-900 object-cover" alt="User" />
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" className="w-10 h-10 rounded-full border-2 border-gray-900 object-cover" alt="User" />
              <div className="w-10 h-10 rounded-full border-2 border-gray-900 bg-emerald-500 flex items-center justify-center text-xs font-bold text-white z-10">
                +2K
              </div>
            </div>
            <p className="text-[13px] font-medium text-gray-200 leading-snug">
              Trusted by 2,000+ organizers<br />worldwide
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - Form */}
      <div className="w-full lg:w-1/2 flex flex-col relative bg-white h-screen overflow-y-auto">

        {/* Top Navigation (Mockup) */}
        <div className="absolute top-6 right-8 flex items-center gap-3 z-10">
          <button className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors bg-white">
            <Sun className="w-5 h-5" />
          </button>
          <button className="h-10 px-4 rounded-xl border border-gray-200 flex items-center justify-center gap-2 text-gray-600 hover:bg-gray-50 transition-colors font-medium text-[14px] bg-white">
            English <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 w-full pt-28 pb-10">
          <div className="w-full max-w-[460px]">
            {/* Title */}
            <div className="mb-8 relative">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="absolute -left-12 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h2 className="text-[32px] font-extrabold text-[#0f172a] mb-2 tracking-tight">Create your Organizer Account</h2>
              <p className="text-[15px] font-medium text-gray-500">Manage your Tournaments in one Place</p>

              {/* Progress Bar */}
              <div className="flex items-center gap-2 mt-6">
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-[#10b981]' : 'bg-gray-100'}`} />
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-[#10b981]' : 'bg-gray-100'}`} />
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 3 ? 'bg-[#10b981]' : 'bg-gray-100'}`} />
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 4 ? 'bg-[#10b981]' : 'bg-gray-100'}`} />
              </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">

              {/* STEP 1: Organization */}
              <div className={`space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 ${step !== 1 ? 'hidden' : 'block'}`}>

                <div className="space-y-2">
                  <label htmlFor="organizationName" className="text-[14px] font-semibold text-gray-700 block">Organization Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <Input
                      id="organizationName"
                      placeholder="E.g. Egunma Tournament Association"
                      className="pl-12 h-12 border-gray-200 focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all rounded-xl text-[15px] text-gray-900"
                      disabled={isLoading}
                      {...form.register("organizationName")}
                    />
                  </div>
                  {errors.organizationName && (
                    <p className="text-[12px] text-red-500 font-medium">{errors.organizationName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="organizationType" className="text-[14px] font-semibold text-gray-700 block">Organization Type</label>
                  <div className="relative group">
                    <select
                      id="organizationType"
                      className="w-full h-12 border border-gray-200 focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all rounded-xl text-[15px] text-gray-900 bg-white px-4 appearance-none outline-none"
                      disabled={isLoading}
                      {...form.register("organizationType")}
                    >
                      <option value="" disabled>Select organization type</option>
                      <option value="Golf Club">Golf Club</option>
                      <option value="Tournament Organizer">Tournament Organizer</option>
                      <option value="Golf Association">Golf Association</option>
                      <option value="Other">Other</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                  {errors.organizationType && (
                    <p className="text-[12px] text-red-500 font-medium">{errors.organizationType.message}</p>
                  )}
                </div>

                {orgType === "Other" && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label htmlFor="customOrganizationType" className="text-[14px] font-semibold text-gray-700 block">Specify Organization Type</label>
                    <Input
                      id="customOrganizationType"
                      placeholder="Enter organization type"
                      className="px-4 h-12 border-gray-200 focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all rounded-xl text-[15px] text-gray-900"
                      disabled={isLoading}
                      {...form.register("customOrganizationType")}
                    />
                    {errors.customOrganizationType && (
                      <p className="text-[12px] text-red-500 font-medium">{errors.customOrganizationType.message}</p>
                    )}
                  </div>
                )}

                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!isStep1Valid}
                  className="w-full h-12 bg-[#006A42] hover:bg-[#005233] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[10px] font-bold text-[15px] transition-colors flex items-center justify-center gap-2 mt-4"
                >
                  Continue <ArrowRight className="w-[18px] h-[18px]" />
                </Button>
              </div>

              {/* STEP 2: Organization Logo */}
              <div className={`space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 ${step !== 2 ? 'hidden' : 'block'}`}>
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Upload your logo</h3>
                  <p className="text-sm text-gray-500 mt-1">This helps players recognize your organization.</p>
                </div>

                <div className="space-y-2 flex justify-center">
                  <div className="relative">
                    {logo ? (
                      <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 h-40 w-40 mx-auto shadow-sm">
                        <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setValue("organizationLogo", "", { shouldValidate: true })}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="h-40 w-40 mx-auto border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer border-gray-200 hover:border-[#10b981] hover:bg-emerald-50/30 transition-all group"
                      >
                        <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                          <Upload className="w-6 h-6 text-gray-400 group-hover:text-[#10b981]" />
                        </div>
                        <div className="text-center">
                          <p className="text-[13px] font-bold text-gray-600 group-hover:text-[#10b981]">Upload Logo</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">JPG, PNG, WebP</p>
                        </div>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>
                </div>

                {errors.organizationLogo && (
                  <p className="text-[12px] text-red-500 font-medium text-center">{errors.organizationLogo.message}</p>
                )}

                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!isStep2Valid}
                  className="w-full h-12 bg-[#006A42] hover:bg-[#005233] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[10px] font-bold text-[15px] transition-colors flex items-center justify-center gap-2 mt-8"
                >
                  Continue <ArrowRight className="w-[18px] h-[18px]" />
                </Button>
              </div>

              {/* STEP 3: Admin Profile */}
              <div className={`space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 ${step !== 3 ? 'hidden' : 'block'}`}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="adminFirstName" className="text-[14px] font-semibold text-gray-700 block">First Name</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                        <User className="w-[18px] h-[18px]" />
                      </div>
                      <Input
                        id="adminFirstName"
                        placeholder="John"
                        className="pl-9 h-12 border-gray-200 focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all rounded-xl text-[15px] text-gray-900"
                        disabled={isLoading}
                        {...form.register("adminFirstName")}
                      />
                    </div>
                    {errors.adminFirstName && (
                      <p className="text-[12px] text-red-500 font-medium">{errors.adminFirstName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="adminMiddleName" className="text-[14px] font-semibold text-gray-700 block">Middle Name</label>
                    <div className="relative group">
                      <Input
                        id="adminMiddleName"
                        placeholder="Edward"
                        className="px-4 h-12 border-gray-200 focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all rounded-xl text-[15px] text-gray-900"
                        disabled={isLoading}
                        {...form.register("adminMiddleName")}
                      />
                    </div>
                    {errors.adminMiddleName && (
                      <p className="text-[12px] text-red-500 font-medium">{errors.adminMiddleName.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="adminLastName" className="text-[14px] font-semibold text-gray-700 block">Last Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <User className="w-[18px] h-[18px]" />
                    </div>
                    <Input
                      id="adminLastName"
                      placeholder="Doe"
                      className="pl-9 h-12 border-gray-200 focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all rounded-xl text-[15px] text-gray-900"
                      disabled={isLoading}
                      {...form.register("adminLastName")}
                    />
                  </div>
                  {errors.adminLastName && (
                    <p className="text-[12px] text-red-500 font-medium">{errors.adminLastName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="adminEmail" className="text-[14px] font-semibold text-gray-700 block">Admin Email</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="admin@example.com"
                      className="pl-12 h-12 border-gray-200 focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all rounded-xl text-[15px] text-gray-900"
                      disabled={isLoading}
                      {...form.register("adminEmail")}
                    />
                  </div>
                  {errors.adminEmail && (
                    <p className="text-[12px] text-red-500 font-medium">{errors.adminEmail.message}</p>
                  )}
                </div>

                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!isStep3Valid}
                  className="w-full h-12 bg-[#006A42] hover:bg-[#005233] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[10px] font-bold text-[15px] transition-colors flex items-center justify-center gap-2 mt-4"
                >
                  Continue <ArrowRight className="w-[18px] h-[18px]" />
                </Button>
              </div>

              {/* STEP 4: Security */}
              <div className={`space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 ${step !== 4 ? 'hidden' : 'block'}`}>
                <div className="space-y-2">
                  <label htmlFor="adminPassword" className="text-[14px] font-semibold text-gray-700 block">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <Lock className="w-[18px] h-[18px]" />
                    </div>
                    <Input
                      id="adminPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-9 pr-9 h-12 border-gray-200 focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all rounded-xl text-[15px] text-gray-900"
                      disabled={isLoading}
                      {...form.register("adminPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.adminPassword && (
                    <p className="text-[11px] text-red-500 font-medium leading-tight">{errors.adminPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-[14px] font-semibold text-gray-700 block">Confirm Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <Lock className="w-[18px] h-[18px]" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-9 pr-9 h-12 border-gray-200 focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all rounded-xl text-[15px] text-gray-900"
                      disabled={isLoading}
                      {...form.register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-[11px] text-red-500 font-medium leading-tight">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || form.formState.isSubmitting || !isStep4Valid}
                  className="w-full h-12 bg-[#006A42] hover:bg-[#005233] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[10px] font-bold text-[15px] transition-colors flex items-center justify-center gap-2 mt-4 shadow-sm"
                >
                  {isLoading ? (
                    <Icons.spinner className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ArrowRight className="w-[18px] h-[18px] text-white" /> Create Organization
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Separator */}
            <div className={`relative flex items-center justify-center py-2 mt-6 ${step !== 1 ? 'hidden' : 'block'}`}>
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <span className="relative bg-white px-4 text-[13px] font-medium text-gray-400">or continue with</span>
            </div>

            {/* Social Buttons */}
            <div className={`grid grid-cols-2 gap-4 mt-4 ${step !== 1 ? 'hidden' : 'grid'}`}>
              <button
                type="button"
                className="h-12 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-[10px] font-bold text-[14px] transition-colors flex items-center justify-center gap-2.5"
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.18 1-.72 1.85-1.55 2.43v2.03h2.51c1.47-1.35 2.32-3.35 2.32-5.46z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-2.51-2.03c-.69.46-1.57.73-2.51.73-2.85 0-5.27-1.92-6.13-4.51H3.54v2.06A11.991 11.991 0 0012 23z" />
                  <path fill="#FBBC05" d="M5.87 14.53c-.22-.66-.35-1.36-.35-2.03s.13-1.37.35-2.03V8.41H3.54A11.98 11.99 0 001.99 12c0 1.3.21 2.54.55 3.71l3.33-2.18z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
              <button
                type="button"
                className="h-12 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-[10px] font-bold text-[14px] transition-colors flex items-center justify-center gap-2.5"
              >
                <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.365 21.43c-1.327.962-2.75 1.57-4.329 1.57-1.547 0-3.003-.604-4.301-1.558C5.068 19.508 3 15.655 3 11.168c0-3.791 1.884-7.234 5.09-9.155.105-.06.216-.109.332-.143a4.708 4.708 0 0 1 1.25-.17 4.717 4.717 0 0 1 1.156.143c1.517.404 3.036 1.05 4.546 1.83.19.1.378.204.56.315 2.924 1.82 4.664 4.887 4.664 8.237 0 4.382-2.023 8.163-4.233 10.205z" fill="none" stroke="none" />
                  <path d="M12.002 23c-1.464 0-2.884-.576-4.148-1.492C5.352 19.697 3.5 15.753 3.5 11.168c0-3.486 1.637-6.721 4.526-8.62a4.417 4.417 0 0 1 1.144-.57A4.475 4.475 0 0 1 10.3 1.84c1.498.4 3.013 1.047 4.516 1.82.164.086.326.176.486.275C18.067 5.75 19.7 8.528 19.7 11.668c0 4.144-1.928 7.828-4.045 9.771C14.542 22.424 13.277 23 12.002 23zM10.428 2.296c-.34.02-.676.074-1.002.162a3.921 3.921 0 0 0-1.01.503C5.744 4.72 4 7.765 4 11.168c0 4.364 1.761 8.147 4.095 9.851 1.189.865 2.52 1.481 4.164 1.481 1.642 0 3.014-.627 4.223-1.491 2.005-1.841 3.718-5.352 3.718-9.341 0-2.991-1.562-5.63-4.183-7.29a28.09 28.09 0 0 0-.44-.248c-1.458-.75-2.925-1.376-4.368-1.761a3.96 3.96 0 0 0-.78-.173zM15.228 5.674a.5.5 0 0 1 .184.983c-1.611.638-2.613 2.115-3.033 3.633a.5.5 0 1 1-.963-.268c.48-1.737 1.643-3.411 3.483-4.141a.496.496 0 0 1 .33-.207z" />
                </svg>
                Apple
              </button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-[14px] text-gray-600 font-medium">
                Already have an account? <a href="/login" className="text-[#006A42] font-bold hover:underline">Sign in <span className="ml-0.5">→</span></a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Security Footer */}
        <div className="w-full px-6 py-6 bg-[#f8fafc] flex items-center justify-center lg:justify-start lg:pl-12 gap-3 mt-auto border-t border-gray-100">
          <ShieldCheck className="w-6 h-6 text-[#10b981]" />
          <div>
            <p className="text-[13px] font-bold text-gray-900">Secure and trusted platform</p>
            <p className="text-[12px] font-medium text-gray-500 mt-0.5">Your data is protected with enterprise-grade security.</p>
          </div>
        </div>
      </div>

    </div>
  )
}
