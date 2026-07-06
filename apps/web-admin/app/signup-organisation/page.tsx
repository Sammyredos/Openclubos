"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Icons } from "@/components/ui/icons"
import {
  Eye, EyeOff, Upload, X, ArrowRight, ArrowLeft
} from "lucide-react"
import { registerOrganizationRequest, validateOrganizationRequest, validateAdminRequest } from "@/lib/api/auth"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Country, State } from "country-state-city"
import { getNigerianStates, getNigerianLGAs } from "@/lib/nigerian-states-lgas"
import { SearchableSelect } from "@/components/ui/input"

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
  organizationCountry: z.string().min(1, "Country is required"),
  organizationState: z.string().min(1, "State is required"),
  organizationCity: z.string().min(1, "City/LGA is required"),
  organizationAddress: z.string().min(5, "Full address is required"),
  adminFirstName: z.string().min(2, "First name is required"),
  adminMiddleName: z.string().optional(),
  adminLastName: z.string().min(2, "Last name is required"),
  adminGender: z.string().min(1, "Gender is required"),
  adminPhone: z.string().min(10, "Please enter a valid phone number"),
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
  const [isSuccess, setIsSuccess] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      organizationLogo: "",
      organizationName: "",
      organizationType: "",
      customOrganizationType: "",
      organizationCountry: "NG",
      organizationState: "",
      organizationCity: "",
      organizationAddress: "",
      adminFirstName: "",
      adminMiddleName: "",
      adminLastName: "",
      adminGender: "",
      adminPhone: "",
      adminEmail: "",
      adminPassword: "",
      confirmPassword: "",
    },
    mode: "onChange",
  })

  const { watch, setValue, formState: { errors } } = form;
  const logo = watch("organizationLogo");
  const orgType = watch("organizationType");
  const orgCountry = watch("organizationCountry");
  const orgState = watch("organizationState");

  const countryOptions = React.useMemo(() => Country.getAllCountries().map(c => ({ value: c.isoCode, label: c.name })), []);
  const stateOptions = React.useMemo(() => {
    if (!orgCountry) return [];
    if (orgCountry === "NG") return getNigerianStates();
    return State.getStatesOfCountry(orgCountry).map(s => ({ value: s.isoCode, label: s.name }));
  }, [orgCountry]);

  const lgaOptions = React.useMemo(() => {
    if (!orgCountry || !orgState) return [];
    if (orgCountry === "NG") return getNigerianLGAs(orgState);
    return [];
  }, [orgCountry, orgState]);

  const countryCode = React.useMemo(() => {
    const c = Country.getCountryByCode(orgCountry || "NG");
    return (c?.phonecode || "234").replace(/^\+/, "");
  }, [orgCountry]);

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
      fieldsToValidate = ["organizationCountry", "organizationState", "organizationCity", "organizationAddress"];
    }
    if (step === 4) {
      fieldsToValidate = [
        "adminFirstName", "adminMiddleName", "adminLastName", "adminGender", "adminPhone", "adminEmail"
      ];
    }

    const isValid = await form.trigger(fieldsToValidate)
    if (isValid) {
      setIsLoading(true);
      try {
        if (step === 1) {
          const res = await validateOrganizationRequest(form.getValues("organizationName"));
          if (!res.available) {
            form.setError("organizationName", { type: "manual", message: res.message });
            setIsLoading(false);
            return;
          }
        }
        if (step === 4) {
          const phoneWithCode = `+${countryCode}${form.getValues("adminPhone").replace(/\D/g, "")}`;
          const res = await validateAdminRequest(
            form.getValues("adminEmail"),
            phoneWithCode,
            form.getValues("adminFirstName"),
            form.getValues("adminMiddleName"),
            form.getValues("adminLastName")
          );
          if (!res.available) {
            form.setError(res.field as any || "adminEmail", { type: "manual", message: res.message });
            setIsLoading(false);
            return;
          }
        }
        setStep(s => s + 1);
      } catch (err: any) {
        toast.error(err.message || "Failed to validate. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  }

  const handleBack = () => setStep(s => s - 1)

  async function onSubmit(data: FormValues) {
    if (step !== 5) return;
    setIsLoading(true)
    try {
      await registerOrganizationRequest({
        organizationLogo: data.organizationLogo,
        organizationName: data.organizationName,
        organizationType: data.organizationType,
        customOrganizationType: data.organizationType === "Other" ? data.customOrganizationType : undefined,
        adminFirstName: data.adminFirstName,
        adminMiddleName: data.adminMiddleName || "",
        adminLastName: data.adminLastName,
        adminGender: data.adminGender,
        adminPhone: data.adminPhone ? `+${countryCode}${data.adminPhone.replace(/\D/g, "")}` : "",
        adminEmail: data.adminEmail,
        adminPassword: data.adminPassword,
        country: data.organizationCountry,
        state: data.organizationState,
        city: data.organizationCity,
        address: data.organizationAddress,
      })
      setIsSuccess(true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  const isStep1Valid = !!watch("organizationName") && !!watch("organizationType") && (watch("organizationType") !== "Other" || !!watch("customOrganizationType"));
  const isStep2Valid = !!watch("organizationLogo");
  const isStep3Valid = !!watch("organizationCountry") && !!watch("organizationState") && !!watch("organizationCity") && !!watch("organizationAddress") && !errors.organizationCity && !errors.organizationState && !errors.organizationCountry && !errors.organizationAddress;
  const isStep4Valid = !!watch("adminFirstName") && !!watch("adminMiddleName") && !!watch("adminLastName") && !!watch("adminGender") && !!watch("adminPhone") && !errors.adminPhone && !!watch("adminEmail") && !errors.adminEmail && !errors.adminGender;
  const isStep5Valid = !!watch("adminPassword") && watch("adminPassword").length >= 8 && watch("adminPassword") === watch("confirmPassword");

  const inputClasses = "w-full bg-[#f4f6f3] border-[3px] border-[#111111] p-3 text-[1rem] font-[family-name:var(--font-space-grotesk)] transition-all focus:outline-none focus:bg-white focus:shadow-[4px_4px_0_#ffffff]"
  const labelClasses = "block font-bold uppercase tracking-tight mb-2 text-[#111111]"
  const btnClasses = "w-full bg-[#ffffff] border-[3px] border-[#111111] py-4 px-6 flex items-center justify-center font-medium capitalize text-[1.125rem] shadow-[4px_4px_0_#15803D] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0_#15803D] disabled:opacity-50 mt-4"
  const errorClasses = "text-[14px] text-red-600 font-bold mt-2"

  return (
    <div className="min-h-screen w-full flex bg-[#f4f6f3] font-[family-name:var(--font-space-grotesk)] text-[#111111] overflow-x-hidden">
      <div className="w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row relative">
        
        {/* LEFT COLUMN - Image */}
        <div className="hidden lg:flex w-1/2 relative bg-cover bg-center border-r-[4px] border-[#111111] p-16 items-end sticky top-0 h-screen"
             style={{ backgroundImage: "url('https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=2070&auto=format&fit=crop')" }}>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1319]/90 to-transparent" />
          
          <div className="relative z-10 text-white">
            <h1 className="text-6xl font-bold uppercase tracking-tight text-[#ffffff] mb-4 leading-none">
              HOST TOURNAMENTS<br/>LIKE A PRO.
            </h1>
            <p className="text-xl max-w-[400px]">
              Create your OpenClub organization to streamline tournament registrations, manage leaderboards, and elevate the player experience.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 relative min-h-screen lg:min-h-0">
          
          <div className="w-full max-w-[560px] bg-white border-[4px] border-[#111111] p-10 shadow-[16px_16px_0_#ffffff] relative">
            
            {isSuccess ? (
              <div className="text-center">
                <div className="w-20 h-20 bg-[#ffffff] border-[3px] border-[#111111] shadow-[4px_4px_0_#15803D] flex items-center justify-center mb-8 mx-auto">
                  <Icons.logo className="h-10 w-10 text-[#111111]" />
                </div>
                <h2 className="text-[2.5rem] font-bold uppercase leading-[0.95] mb-4 tracking-tighter">Check Your Email</h2>
                <p className="text-[#6b7280] text-[1.125rem] mb-8 font-bold">
                  We've sent a verification link to <span className="text-[#111111]">{form.getValues("adminEmail")}</span>.<br/>Please verify your account.
                </p>
                <button
                  onClick={() => router.push("/login")}
                  className={btnClasses}
                >
                  Go to Login
                </button>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  {step > 1 && (
                    <button
                      onClick={handleBack}
                      className="mb-4 w-10 h-10 bg-[#ffffff] border-[3px] border-[#111111] shadow-[2px_2px_0_#15803D] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_#15803D] flex items-center justify-center transition-all"
                    >
                      <ArrowLeft className="w-5 h-5 text-[#111111]" />
                    </button>
                  )}
                  <h2 className="text-[2.5rem] font-bold capitalize leading-[0.95] mb-2 tracking-tighter">Create Account</h2>
                  <p className="text-[#6b7280] text-[1.125rem] font-bold uppercase tracking-tight">Step {step} of 5</p>

                  <div className="flex items-center gap-2 mt-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`h-2 flex-1 border-[2px] border-[#111111] transition-colors ${step >= i ? 'bg-[#111111]' : 'bg-[#ffffff]'}`} />
                    ))}
                  </div>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
                  {/* STEP 1 */}
                  <div className={`space-y-5 ${step !== 1 ? 'hidden' : 'block'}`}>
                    <div>
                      <label className={labelClasses}>Organization Name</label>
                      <input
                        placeholder="E.g. Egunma Tournament Association"
                        className={inputClasses}
                        disabled={isLoading}
                        {...form.register("organizationName")}
                      />
                      {errors.organizationName && <p className={errorClasses}>{errors.organizationName.message}</p>}
                    </div>

                    <div>
                      <label className={labelClasses}>Organization Type</label>
                      <select
                        className={`${inputClasses} appearance-none rounded-none`}
                        disabled={isLoading}
                        {...form.register("organizationType")}
                      >
                        <option value="" disabled>Select organization type</option>
                        <option value="Golf Club">Golf Club</option>
                        <option value="Tournament Organizer">Tournament Organizer</option>
                        <option value="Golf Association">Golf Association</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.organizationType && <p className={errorClasses}>{errors.organizationType.message}</p>}
                    </div>

                    {orgType === "Other" && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <label className={labelClasses}>Specify Organization Type</label>
                        <input
                          placeholder="Enter organization type"
                          className={inputClasses}
                          disabled={isLoading}
                          {...form.register("customOrganizationType")}
                        />
                        {errors.customOrganizationType && <p className={errorClasses}>{errors.customOrganizationType.message}</p>}
                      </div>
                    )}

                    <button type="button" onClick={handleNext} disabled={!isStep1Valid || isLoading} className={btnClasses}>
                      {isLoading ? <Icons.spinner className="w-5 h-5 animate-spin" /> : "Continue"}
                    </button>
                  </div>

                  {/* STEP 2 */}
                  <div className={`space-y-5 ${step !== 2 ? 'hidden' : 'block'}`}>
                    <div>
                      <h3 className="font-bold capitalize tracking-tight text-xl mb-1">Upload your logo</h3>
                      <p className="text-[#6b7280] font-bold">This helps players recognize your organization.</p>
                    </div>

                    <div className="flex justify-center my-6">
                      <div className="relative">
                        {logo ? (
                          <div className="w-48 h-48 border-[4px] border-[#111111] shadow-[8px_8px_0_#ffffff] bg-white relative">
                            <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setValue("organizationLogo", "", { shouldValidate: true })}
                              className="absolute -top-4 -right-4 w-10 h-10 bg-[#ffffff] border-[3px] border-[#111111] flex items-center justify-center hover:translate-y-[1px] shadow-[2px_2px_0_#15803D] transition-all"
                            >
                              <X className="w-5 h-5 text-[#111111]" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-48 h-48 border-[4px] border-[#111111] bg-[#f4f6f3] shadow-[8px_8px_0_#ffffff] hover:translate-y-[2px] hover:shadow-[4px_4px_0_#ffffff] transition-all flex flex-col items-center justify-center cursor-pointer group"
                          >
                            <div className="w-12 h-12 bg-white border-[3px] border-[#111111] flex items-center justify-center mb-2 group-hover:bg-[#ffffff] transition-colors">
                              <Upload className="w-6 h-6 text-[#111111]" />
                            </div>
                            <p className="font-bold uppercase text-[14px]">Upload Logo</p>
                            <p className="text-[12px] font-bold text-[#6b7280]">JPG, PNG, WebP</p>
                          </div>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                      </div>
                    </div>
                    {errors.organizationLogo && <p className={`${errorClasses} text-center`}>{errors.organizationLogo.message}</p>}

                    <button type="button" onClick={handleNext} disabled={!isStep2Valid || isLoading} className={btnClasses}>
                      {isLoading ? <Icons.spinner className="w-5 h-5 animate-spin" /> : "Continue"}
                    </button>
                  </div>

                  {/* STEP 3 */}
                  <div className={`space-y-5 ${step !== 3 ? 'hidden' : 'block'}`}>
                    <div>
                      <h3 className="font-bold capitalize tracking-tight text-xl mb-1">Location Details</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClasses}>Country</label>
                        <div className="border-[3px] border-[#111111] bg-[#f4f6f3]">
                          <SearchableSelect
                            value={orgCountry}
                            onValueChange={(v) => {
                              setValue("organizationCountry", v, { shouldValidate: true });
                              setValue("organizationState", "", { shouldValidate: true });
                              setValue("organizationCity", "", { shouldValidate: true });
                            }}
                            options={countryOptions}
                          />
                        </div>
                        {errors.organizationCountry && <p className={errorClasses}>{errors.organizationCountry.message}</p>}
                      </div>
                      <div>
                        <label className={labelClasses}>State</label>
                        <div className="border-[3px] border-[#111111] bg-[#f4f6f3]">
                          <SearchableSelect
                            value={orgState}
                            onValueChange={(v) => {
                              setValue("organizationState", v, { shouldValidate: true });
                              setValue("organizationCity", "", { shouldValidate: true });
                            }}
                            options={stateOptions}
                            disabled={!orgCountry}
                          />
                        </div>
                        {errors.organizationState && <p className={errorClasses}>{errors.organizationState.message}</p>}
                      </div>
                    </div>

                    <div>
                      <label className={labelClasses}>{orgCountry === "NG" ? "LGA" : "City"}</label>
                      {orgCountry === "NG" ? (
                        <div className="border-[3px] border-[#111111] bg-[#f4f6f3]">
                          <SearchableSelect
                            value={form.watch("organizationCity")}
                            onValueChange={(v) => setValue("organizationCity", v, { shouldValidate: true })}
                            options={lgaOptions}
                            disabled={!orgState}
                            placeholder="Select LGA"
                          />
                        </div>
                      ) : (
                        <input
                          placeholder="Enter city"
                          className={inputClasses}
                          disabled={isLoading}
                          {...form.register("organizationCity")}
                        />
                      )}
                      {errors.organizationCity && <p className={errorClasses}>{errors.organizationCity.message}</p>}
                    </div>

                    <div>
                      <label className={labelClasses}>Full Address</label>
                      <textarea
                        {...form.register("organizationAddress", { onChange: (e) => { if (e.target.value.length > 200) e.target.value = e.target.value.slice(0, 200); }})}
                        maxLength={200}
                        placeholder="Enter full address"
                        className={`${inputClasses} h-24 resize-none`}
                        disabled={isLoading}
                      />
                      <div className="text-right font-bold text-[#6b7280] text-xs">{(watch("organizationAddress") || "").length}/200</div>
                      {errors.organizationAddress && <p className={errorClasses}>{errors.organizationAddress.message}</p>}
                    </div>

                    <button type="button" onClick={handleNext} disabled={!isStep3Valid || isLoading} className={btnClasses}>
                      {isLoading ? <Icons.spinner className="w-5 h-5 animate-spin" /> : "Continue"}
                    </button>
                  </div>

                  {/* STEP 4 */}
                  <div className={`space-y-5 ${step !== 4 ? 'hidden' : 'block'}`}>
                    <div>
                      <h3 className="font-bold capitalize tracking-tight text-xl mb-1">Admin Profile</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClasses}>First Name</label>
                        <input placeholder="John" className={inputClasses} disabled={isLoading} {...form.register("adminFirstName")} />
                        {errors.adminFirstName && <p className={errorClasses}>{errors.adminFirstName.message}</p>}
                      </div>
                      <div>
                        <label className={labelClasses}>Middle Name</label>
                        <input placeholder="Edward" className={inputClasses} disabled={isLoading} {...form.register("adminMiddleName")} />
                        {errors.adminMiddleName && <p className={errorClasses}>{errors.adminMiddleName.message}</p>}
                      </div>
                    </div>

                    <div>
                      <label className={labelClasses}>Last Name</label>
                      <input placeholder="Doe" className={inputClasses} disabled={isLoading} {...form.register("adminLastName")} />
                      {errors.adminLastName && <p className={errorClasses}>{errors.adminLastName.message}</p>}
                    </div>

                    <div>
                      <label className={labelClasses}>Gender</label>
                      <div className="border-[3px] border-[#111111] bg-[#f4f6f3]">
                        <SearchableSelect
                          value={form.watch("adminGender")}
                          onValueChange={v => setValue("adminGender", v, { shouldValidate: true })}
                          options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Other", label: "Other" }]}
                          placeholder="Select gender"
                        />
                      </div>
                      {errors.adminGender && <p className={errorClasses}>{errors.adminGender.message}</p>}
                    </div>

                    <div>
                      <label className={labelClasses}>Phone Number</label>
                      <div className="flex gap-2">
                        <div className="w-20 bg-white border-[3px] border-[#111111] flex items-center justify-center font-bold">
                          +{countryCode}
                        </div>
                        <input
                          type="tel"
                          placeholder="Phone number"
                          className={`${inputClasses} flex-1`}
                          disabled={isLoading}
                          {...form.register("adminPhone", { onChange: (e) => e.target.value = e.target.value.replace(/\D/g, "") })}
                        />
                      </div>
                      {errors.adminPhone && <p className={errorClasses}>{errors.adminPhone.message}</p>}
                    </div>

                    <div>
                      <label className={labelClasses}>Admin Email</label>
                      <input type="email" placeholder="admin@example.com" className={inputClasses} disabled={isLoading} {...form.register("adminEmail")} />
                      {errors.adminEmail && <p className={errorClasses}>{errors.adminEmail.message}</p>}
                    </div>

                    <button type="button" onClick={handleNext} disabled={!isStep4Valid || isLoading} className={btnClasses}>
                      {isLoading ? <Icons.spinner className="w-5 h-5 animate-spin" /> : "Continue"}
                    </button>
                  </div>

                  {/* STEP 5 */}
                  <div className={`space-y-5 ${step !== 5 ? 'hidden' : 'block'}`}>
                    <div>
                      <h3 className="font-bold capitalize tracking-tight text-xl mb-1">Security</h3>
                    </div>

                    <div>
                      <label className={labelClasses}>Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className={`${inputClasses} pr-12`}
                          disabled={isLoading}
                          {...form.register("adminPassword")}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-4 flex items-center">
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.adminPassword && <p className={errorClasses}>{errors.adminPassword.message}</p>}
                    </div>

                    <div>
                      <label className={labelClasses}>Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className={`${inputClasses} pr-12`}
                          disabled={isLoading}
                          {...form.register("confirmPassword")}
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-4 flex items-center">
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className={errorClasses}>{errors.confirmPassword.message}</p>}
                    </div>

                    <button type="submit" disabled={isLoading || form.formState.isSubmitting || !isStep5Valid} className={btnClasses}>
                      {isLoading ? <Icons.spinner className="w-5 h-5 animate-spin text-[#111111]" /> : "Create Organization"}
                    </button>
                  </div>
                </form>
                
                {step === 1 && (
                  <>
                    <div className="flex items-center font-bold text-sm capitalize tracking-widest my-8">
                      <div className="flex-1 border-b-[3px] border-[#111111]"></div>
                      <span className="px-4">Or continue with email</span>
                      <div className="flex-1 border-b-[3px] border-[#111111]"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button type="button" className="bg-white border-[3px] border-[#111111] py-3 flex items-center justify-center font-bold capitalize shadow-[4px_4px_0_#15803D] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#15803D] transition-all gap-2">
                        <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                      </button>
                      <button type="button" className="bg-white border-[3px] border-[#111111] py-3 flex items-center justify-center font-bold capitalize shadow-[4px_4px_0_#15803D] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#15803D] transition-all gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M16.365 21.43c-1.327.962-2.75 1.57-4.329 1.57-1.547 0-3.003-.604-4.301-1.558C5.068 19.508 3 15.655 3 11.168c0-3.791 1.884-7.234 5.09-9.155.105-.06.216-.109.332-.143a4.708 4.708 0 0 1 1.25-.17 4.717 4.717 0 0 1 1.156.143c1.517.404 3.036 1.05 4.546 1.83.19.1.378.204.56.315 2.924 1.82 4.664 4.887 4.664 8.237 0 4.382-2.023 8.163-4.233 10.205z" fill="none" stroke="none" />
                          <path d="M12.002 23c-1.464 0-2.884-.576-4.148-1.492C5.352 19.697 3.5 15.753 3.5 11.168c0-3.486 1.637-6.721 4.526-8.62a4.417 4.417 0 0 1 1.144-.57A4.475 4.475 0 0 1 10.3 1.84c1.498.4 3.013 1.047 4.516 1.82.164.086.326.176.486.275C18.067 5.75 19.7 8.528 19.7 11.668c0 4.144-1.928 7.828-4.045 9.771C14.542 22.424 13.277 23 12.002 23zM10.428 2.296c-.34.02-.676.074-1.002.162a3.921 3.921 0 0 0-1.01.503C5.744 4.72 4 7.765 4 11.168c0 4.364 1.761 8.147 4.095 9.851 1.189.865 2.52 1.481 4.164 1.481 1.642 0 3.014-.627 4.223-1.491 2.005-1.841 3.718-5.352 3.718-9.341 0-2.991-1.562-5.63-4.183-7.29a28.09 28.09 0 0 0-.44-.248c-1.458-.75-2.925-1.376-4.368-1.761a3.96 3.96 0 0 0-.78-.173zM15.228 5.674a.5.5 0 0 1 .184.983c-1.611.638-2.613 2.115-3.033 3.633a.5.5 0 1 1-.963-.268c.48-1.737 1.643-3.411 3.483-4.141a.496.496 0 0 1 .33-.207z" />
                        </svg>
                        Apple
                      </button>
                    </div>

                    <div className="mt-8 text-center font-bold">
                      <p className="text-[#111111]">
                        Already have an account? <a href="/login" className="underline decoration-2 hover:bg-[#111111] hover:text-[#ffffff] transition-colors">Sign in</a>
                      </p>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
