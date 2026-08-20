"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Icons } from "@/components/ui/icons";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  User,
  Trophy,
  Lock,
  Check,
  ChevronRight,
  Info,
  Mail,
  Phone,
  Target,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Country } from "country-state-city";
import { SearchableSelect } from "@/components/ui/input";
import { broadcastAdminEvent, cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

interface InviteDetails {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  role: string;
  managerScope?: string | null;
}

function getRoleLabel(role?: string, managerScope?: string | null) {
  if (!role) return "Invitation";
  if (role === "CLUB_ADMIN") {
    if (managerScope === "FULL") return "Admin Manager";
    if (managerScope === "TOURNAMENTS") return "Tournament Manager";
    if (managerScope === "FINANCE") return "Finance Manager";
    return "Organizer Admin";
  }
  if (role === "MARKER") return "Marker";
  if (role === "SUPER_ADMIN") return "Super Admin";
  if (role === "PLAYER") return "Player";
  return role.replace(/_/g, " ");
}

const schema = z
  .object({
    firstName: z.string().min(1, { message: "First name is required." }),
    middleName: z.string().optional(),
    lastName: z.string().min(1, { message: "Last name is required." }),
    email: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE"]).optional(),
    handicap: z.union([z.number(), z.nan()]).optional(),
    password: z.string().min(8, { message: "Password must be at least 8 characters long." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;
type PageState = "idle" | "loading" | "success" | "error";

export default function AcceptInvitePage() {
  return (
    <React.Suspense fallback={null}>
      <AcceptInvitePageInner />
    </React.Suspense>
  );
}

function Field({
  label,
  required,
  children,
  error,
  helperText,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
  helperText?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-medium text-gray-700 flex items-center">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {helperText && !error && (
        <p className="text-[11px] text-gray-400 mt-1">{helperText}</p>
      )}
      {error && <p className="text-[11px] text-red-500 font-normal mt-1">{error}</p>}
    </div>
  );
}

function AcceptInvitePageInner() {
  const [pageState, setPageState] = React.useState<PageState>("idle");
  const [loadingInvite, setLoadingInvite] = React.useState(true);
  const [currentStep, setCurrentStep] = React.useState(1);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [inviteDetails, setInviteDetails] = React.useState<InviteDetails | null>(null);
  const [selectedCountry, setSelectedCountry] = React.useState("NG");

  const countryOptions = React.useMemo(() => {
    return Country.getAllCountries().map((c) => ({
      value: c.isoCode,
      label: `${c.name} (+${c.phonecode.replace(/^\+/, "")})`,
      phonecode: c.phonecode.replace(/^\+/, ""),
      name: c.name,
    }));
  }, []);

  const currentCountryCode = React.useMemo(() => {
    const found = Country.getCountryByCode(selectedCountry);
    return found ? found.phonecode.replace(/^\+/, "") : "234";
  }, [selectedCountry]);

  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      country: "NG",
      phone: "",
      gender: "MALE",
      handicap: 0,
      password: "",
      confirmPassword: "",
    },
  });

  const isPlayer = inviteDetails?.role === "PLAYER";
  const stepsList = isPlayer
    ? [
        { id: 1, name: "Basic Details", desc: "Your personal information" },
        { id: 2, name: "Golf Profile", desc: "Handicap & divisions" },
        { id: 3, name: "Security", desc: "Password & credentials" },
      ]
    : [
        { id: 1, name: "Basic Details", desc: "Your personal information" },
        { id: 2, name: "Security", desc: "Password & credentials" },
      ];

  const totalSteps = stepsList.length;

  React.useEffect(() => {
    if (!token) {
      setPageState("error");
      setLoadingInvite(false);
      toast.error("Invalid or missing invitation token.");
      return;
    }

    async function fetchInvite() {
      try {
        setLoadingInvite(true);
        const res = await fetch(`${API_BASE}/auth/invite/${token}`);
        if (!res.ok) {
          throw new Error("Invalid or expired invitation token.");
        }
        const data = (await res.json()) as InviteDetails;
        setInviteDetails(data);

        const lastParts = (data.lastName || "").split(/\s+/).filter(Boolean);
        const firstParts = (data.firstName || "").split(/\s+/).filter(Boolean);

        let first = firstParts[0] || "";
        let middle = "";
        let last = "";

        if (lastParts.length > 1) {
          middle = lastParts.slice(0, lastParts.length - 1).join(" ");
          last = lastParts[lastParts.length - 1] || "";
        } else if (firstParts.length > 1) {
          first = firstParts[0] || "";
          middle = firstParts.slice(1).join(" ");
          last = lastParts[0] || "";
        } else {
          first = firstParts[0] || "";
          last = lastParts[0] || "";
        }

        let initialPhone = data.phone || "";
        if (initialPhone.startsWith("+")) {
          const digits = initialPhone.replace(/^\+/, "");
          const matchCountry = Country.getAllCountries().find(c => digits.startsWith(c.phonecode.replace(/^\+/, "")));
          if (matchCountry) {
            setSelectedCountry(matchCountry.isoCode);
            initialPhone = digits.substring(matchCountry.phonecode.replace(/^\+/, "").length);
          }
        }

        form.reset({
          firstName: first,
          middleName: middle,
          lastName: last,
          email: data.email || "",
          country: selectedCountry,
          phone: initialPhone,
          gender: "MALE",
          handicap: 0,
          password: "",
          confirmPassword: "",
        });
      } catch (err: unknown) {
        setPageState("error");
        toast.error(err instanceof Error ? err.message : "Failed to load invitation.");
      } finally {
        setLoadingInvite(false);
      }
    }

    void fetchInvite();
  }, [token, form]);

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof FormValues)[] = [];
    if (currentStep === 1) {
      fieldsToValidate = isPlayer
        ? ["firstName", "lastName", "phone"]
        : ["firstName", "lastName"];
    } else if (currentStep === 2) {
      fieldsToValidate = isPlayer ? ["gender", "handicap"] : ["password", "confirmPassword"];
    } else if (currentStep === 3) {
      fieldsToValidate = ["password", "confirmPassword"];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleStepClick = async (targetStep: number) => {
    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
      return;
    }

    if (currentStep === 1) {
      const fields: (keyof FormValues)[] = isPlayer
        ? ["firstName", "lastName", "phone"]
        : ["firstName", "lastName"];
      const valid = await form.trigger(fields);
      if (!valid) return;
    } else if (currentStep === 2 && isPlayer && targetStep === 3) {
      const valid = await form.trigger(["gender", "handicap"]);
      if (!valid) return;
    }

    setCurrentStep(targetStep);
  };

  const onInvalid = (errors: any) => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const firstError =
        errors[errorKeys[0]]?.message || "Please check the required fields.";
      toast.error(firstError);
    }
  };

  async function onSubmit(data: FormValues) {
    if (!token) return;
    setPageState("loading");
    try {
      let rawPhone = (data.phone || "").trim().replace(/[\s\-\(\)]/g, "");
      let fullPhone = rawPhone;
      if (rawPhone) {
        if (rawPhone.startsWith(`+${currentCountryCode}`)) {
          fullPhone = rawPhone;
        } else if (rawPhone.startsWith(currentCountryCode)) {
          fullPhone = `+${rawPhone}`;
        } else {
          if (rawPhone.startsWith("0")) {
            rawPhone = rawPhone.substring(1);
          }
          fullPhone = `+${currentCountryCode}${rawPhone}`;
        }
      }

      const res = await fetch(`${API_BASE}/auth/accept-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName || undefined,
          phone: fullPhone || undefined,
          gender: data.gender,
          handicap: typeof data.handicap === "number" && !isNaN(data.handicap) ? data.handicap : undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.message || "Failed to accept invitation.");
      }

      const result = await res.json();

      if (result.accessToken) {
        localStorage.setItem("accessToken", result.accessToken);
      }
      if (result.refreshToken) {
        localStorage.setItem("refreshToken", result.refreshToken);
      }
      if (result.user) {
        localStorage.setItem("user", JSON.stringify(result.user));
      }

      setPageState("success");
      toast.success("Account activated! Redirecting...");

      try {
        broadcastAdminEvent("users-changed");
        broadcastAdminEvent("members-changed");
        broadcastAdminEvent("registrations-changed");
        broadcastAdminEvent("tournaments-changed");
        broadcastAdminEvent("clubs-changed");
      } catch {}

      const redirectUrl =
        searchParams.get("from") ||
        (result.user?.role === "PLAYER"
          ? "/tournaments"
          : result.user?.role === "SUPER_ADMIN"
          ? "/super-admin/dashboard"
          : "/organizer-admin/dashboard");
      setTimeout(() => {
        router.push(redirectUrl);
      }, 1500);
    } catch (err: unknown) {
      setPageState("idle");
      toast.error(err instanceof Error ? err.message : "Failed to set password.");
    }
  }

  const defaultRedirect =
    inviteDetails?.role === "PLAYER"
      ? "/tournaments"
      : inviteDetails?.role === "SUPER_ADMIN"
      ? "/super-admin/dashboard"
      : "/organizer-admin/dashboard";

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-zinc-900 py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="w-full max-w-[1020px] mx-auto space-y-6">
        {pageState === "success" ? (
          <div className="bg-white rounded-2xl border border-[#e1efe5] p-8 md:p-12 shadow-[0px_0px_4px_0px_rgba(0,0,0,0.08)] flex flex-col items-center text-center max-w-[560px] mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center mb-6 text-[#15803D] animate-in zoom-in-50 duration-300">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h2 className="text-[22px] font-semibold tracking-tight text-gray-900 mb-2">
              Account Activated!
            </h2>
            <p className="text-gray-500 text-[14px] mb-8 leading-relaxed">
              Your profile has been created and your password has been securely saved. You can now access your account.
            </p>

            <Link href={searchParams.get("from") || defaultRedirect} className="w-full no-underline">
              <button className="w-full bg-[#15803D] hover:bg-[#166534] text-white rounded-xl py-3 px-6 flex items-center justify-center font-medium text-sm transition-all shadow-sm">
                {inviteDetails?.role === "PLAYER" ? "Proceed to Tournaments" : "Go to Dashboard"}
              </button>
            </Link>
          </div>
        ) : pageState === "error" ? (
          <div className="bg-white rounded-2xl border border-red-100 p-8 md:p-12 shadow-[0px_0px_4px_0px_rgba(0,0,0,0.08)] flex flex-col items-center text-center max-w-[560px] mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200/60 flex items-center justify-center mb-6 text-red-500">
              <AlertCircle className="h-8 w-8" />
            </div>

            <h2 className="text-[22px] font-semibold tracking-tight text-gray-900 mb-2">
              Invalid or Expired Invitation
            </h2>
            <p className="text-gray-500 text-[14px] mb-8 leading-relaxed">
              This invitation token is invalid, expired, or has already been used. Please contact your tournament organizer for a new invitation.
            </p>

            <Link href="/login" className="no-underline">
              <button className="h-10 border border-[#e1efe5] hover:bg-gray-100/80 bg-white text-gray-700 rounded-xl px-6 text-[13px] font-medium transition-all">
                Back to Sign In
              </button>
            </Link>
          </div>
        ) : loadingInvite || !inviteDetails ? (
          <div className="space-y-6 animate-pulse">
            <div className="bg-white border border-[#e1efe5] rounded-2xl p-5 shadow-[0px_0px_4px_0px_rgba(0,0,0,0.08)] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100" />
                <div className="space-y-2">
                  <div className="h-4 w-44 bg-gray-200 rounded" />
                  <div className="h-3 w-56 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="h-6 w-24 bg-gray-100 rounded-full" />
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              <div className="w-full lg:w-[280px] bg-white border border-[#e1efe5] rounded-2xl p-4 space-y-3 h-48" />
              <div className="flex-1 bg-white border border-[#e1efe5] rounded-2xl p-8 space-y-6 h-96" />
            </div>
          </div>
        ) : (
          <>
            {/* Top Header Card - only shown while filling the active form */}
            <div className="flex items-center justify-between bg-white border border-[#e1efe5] rounded-2xl p-5 shadow-[0px_0px_4px_0px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#15803D] shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-[16px] font-medium text-gray-900">
                    {inviteDetails.role === "PLAYER"
                      ? "Accept Player Invitation"
                      : `Accept ${getRoleLabel(inviteDetails.role, inviteDetails.managerScope)} Invitation`}
                  </h1>
                  <p className="text-[13px] text-gray-500 mt-0.5">
                    {inviteDetails.email ? (
                      <>
                        Invitation for <span className="font-medium text-gray-800">{inviteDetails.email}</span>
                      </>
                    ) : (
                      "Complete your account profile and set your credentials"
                    )}
                  </p>
                </div>
              </div>
              {inviteDetails.role && (
                <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#15803D] border border-emerald-200/60">
                  {getRoleLabel(inviteDetails.role, inviteDetails.managerScope)}
                </span>
              )}
            </div>

            {/* Main Stepper & Form Layout */}
            <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column - Step Navigation */}
            <div className="w-full lg:w-[280px] shrink-0">
              <div className="bg-white border border-[#e1efe5] rounded-2xl p-3 shadow-[0px_0px_4px_0px_rgba(0,0,0,0.08)] space-y-2 sticky top-6">
                {stepsList.map((item, idx) => {
                  const stepNum = idx + 1;
                  const active = currentStep === stepNum;
                  const past = currentStep > stepNum;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleStepClick(stepNum)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3.5 border rounded-xl transition-all duration-200 text-left",
                        active
                          ? "bg-[#f4fdf8] border-[#15803D] text-[#15803D]"
                          : "bg-white border-[#e1efe5] text-[#64748b] hover:border-gray-300 hover:bg-gray-50/50"
                      )}
                    >
                      <div className="flex items-center gap-3.5 whitespace-nowrap overflow-hidden">
                        <div
                          className={cn(
                            "w-[22px] h-[22px] shrink-0 rounded-full flex items-center justify-center text-[11px] font-medium transition-all duration-300",
                            active
                              ? "bg-[#15803D] text-white"
                              : past
                              ? "bg-emerald-100 text-openclub-800 border border-emerald-200"
                              : "bg-gray-100 text-gray-400 border border-[#e1efe5]"
                          )}
                        >
                          {past ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : stepNum}
                        </div>
                        <div>
                          <span className="text-[13px] font-medium leading-tight block text-gray-800">
                            {item.name}
                          </span>
                          <span className="text-[11px] text-gray-400 block leading-tight">
                            {item.desc}
                          </span>
                        </div>
                      </div>
                      {active && <ChevronRight className="w-4 h-4 shrink-0 text-[#15803D]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column - Step Form Content */}
            <div className="flex-1 min-w-0 bg-white rounded-2xl border border-[#e1efe5] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col">
              <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="flex flex-col flex-1">
                {/* STEP 1: Personal Details */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="px-6 py-4 border-b border-[#e1efe5] bg-gray-50/50 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-openclub-800 shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-medium text-gray-900">Basic Details</h4>
                        <p className="text-[12px] text-gray-500">
                          Confirm and complete your personal contact information
                        </p>
                      </div>
                    </div>

                    <div className="p-6 space-y-5">
                      <Field
                        label="First Name"
                        required
                        error={form.formState.errors.firstName?.message}
                      >
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="e.g. John"
                            className="flex h-11 w-full rounded-xl border border-[#e1efe5] shadow-sm bg-[#f5faf6] pl-11 pr-4 py-2 text-sm font-normal text-zinc-900 placeholder:text-zinc-400 focus:border-[#15803D] focus:outline-none focus:ring-1 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={pageState === "loading"}
                            {...form.register("firstName")}
                          />
                        </div>
                      </Field>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field
                          label="Middle Name"
                          error={form.formState.errors.middleName?.message}
                        >
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="e.g. Robert"
                              className="flex h-11 w-full rounded-xl border border-[#e1efe5] shadow-sm bg-[#f5faf6] pl-11 pr-4 py-2 text-sm font-normal text-zinc-900 placeholder:text-zinc-400 focus:border-[#15803D] focus:outline-none focus:ring-1 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={pageState === "loading"}
                              {...form.register("middleName")}
                            />
                          </div>
                        </Field>

                        <Field
                          label="Last Name"
                          required
                          error={form.formState.errors.lastName?.message}
                        >
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="e.g. Doe"
                              className="flex h-11 w-full rounded-xl border border-[#e1efe5] shadow-sm bg-[#f5faf6] pl-11 pr-4 py-2 text-sm font-normal text-zinc-900 placeholder:text-zinc-400 focus:border-[#15803D] focus:outline-none focus:ring-1 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={pageState === "loading"}
                              {...form.register("lastName")}
                            />
                          </div>
                        </Field>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Email Address">
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                              type="email"
                              value={inviteDetails?.email || form.getValues("email")}
                              readOnly
                              disabled
                              className="flex h-11 w-full rounded-xl border border-[#e1efe5] shadow-sm bg-gray-100/80 pl-11 pr-4 py-2 text-sm font-normal text-zinc-600 cursor-not-allowed select-none"
                            />
                          </div>
                          <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
                            <Check className="w-3 h-3" /> Verified invitation email
                          </p>
                        </Field>

                        <Field label="Country" required>
                          <SearchableSelect
                            value={selectedCountry}
                            onValueChange={(val) => {
                              setSelectedCountry(val);
                            }}
                            options={countryOptions}
                            placeholder="Select Country"
                            triggerClassName="h-11 rounded-xl border-[#e1efe5] bg-[#f5faf6]"
                          />
                        </Field>
                      </div>

                      {isPlayer && (
                        <Field
                          label="WhatsApp Phone Number"
                          required
                          error={form.formState.errors.phone?.message}
                          helperText="For tee times, pairings and tournament broadcasts."
                        >
                          <div className="flex h-11 w-full rounded-xl border border-[#e1efe5] bg-[#f5faf6] overflow-hidden focus-within:border-[#15803D] focus-within:ring-1 focus-within:ring-emerald-500/20 shadow-sm transition-all">
                            <div className="h-full px-4 bg-gray-100/80 border-r border-[#e1efe5] flex items-center justify-center text-sm font-medium text-zinc-700 shrink-0 select-none tracking-wide">
                              +{currentCountryCode}
                            </div>
                            <div className="relative flex-1 flex items-center">
                              <Phone className="absolute left-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                              <input
                                type="tel"
                                placeholder="Phone number"
                                className="flex h-full w-full border-none bg-transparent pl-10 pr-4 py-2 text-sm font-normal text-zinc-900 placeholder:text-zinc-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={pageState === "loading"}
                                {...form.register("phone")}
                              />
                            </div>
                          </div>
                        </Field>
                      )}

                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 flex items-center gap-3">
                        <Info className="w-4 h-4 text-openclub-700 shrink-0" />
                        <p className="text-[12px] font-normal text-emerald-700">
                          Note: Please ensure your contact details match your official union registration for tournament verification.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Golf Profile (Player Only) */}
                {currentStep === 2 && isPlayer && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="px-6 py-4 border-b border-[#e1efe5] bg-gray-50/50 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-openclub-800 shrink-0">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-medium text-gray-900">Golf Profile</h4>
                        <p className="text-[12px] text-gray-500">
                          Set your tournament division and playing handicap
                        </p>
                      </div>
                    </div>

                    <div className="p-6 space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field
                          label="Gender"
                          required
                          error={form.formState.errors.gender?.message}
                          helperText="Used for tee assignment and division classification."
                        >
                          <div className="relative">
                            <select
                              className="flex h-11 w-full rounded-xl border border-[#e1efe5] shadow-sm bg-[#f5faf6] px-4 py-2 text-sm font-normal text-zinc-900 focus:border-[#15803D] focus:outline-none focus:ring-1 focus:ring-emerald-500/20 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={pageState === "loading"}
                              {...form.register("gender")}
                            >
                              <option value="MALE">Male</option>
                              <option value="FEMALE">Female</option>
                            </select>
                          </div>
                        </Field>

                        <Field
                          label="Handicap Index"
                          required
                          error={form.formState.errors.handicap?.message}
                          helperText="Official handicap index between -10.0 and 54.0."
                        >
                          <div className="relative">
                            <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                              type="number"
                              step="0.1"
                              placeholder="e.g. 12.4"
                              className="flex h-11 w-full rounded-xl border border-[#e1efe5] shadow-sm bg-[#f5faf6] pl-11 pr-4 py-2 text-sm font-normal text-zinc-900 placeholder:text-zinc-400 focus:border-[#15803D] focus:outline-none focus:ring-1 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={pageState === "loading"}
                              {...form.register("handicap", { valueAsNumber: true })}
                            />
                          </div>
                        </Field>
                      </div>

                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 flex items-center gap-3">
                        <Info className="w-4 h-4 text-openclub-700 shrink-0" />
                        <p className="text-[12px] font-normal text-emerald-700">
                          Note: You can update your handicap or link your official golf union ID later in your account settings.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* FINAL STEP: Security & Password */}
                {((currentStep === 3 && isPlayer) || (currentStep === 2 && !isPlayer)) && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="px-6 py-4 border-b border-[#e1efe5] bg-gray-50/50 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-openclub-800 shrink-0">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-medium text-gray-900">Security Credentials</h4>
                        <p className="text-[12px] text-gray-500">
                          Create a secure password to protect your Openclub account
                        </p>
                      </div>
                    </div>

                    <div className="p-6 space-y-5">
                      <Field
                        label="Create Password"
                        required
                        error={form.formState.errors.password?.message}
                        helperText="Must be at least 8 characters long."
                      >
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="flex h-11 w-full rounded-xl border border-[#e1efe5] shadow-sm bg-[#f5faf6] pl-11 pr-11 py-2 text-sm font-normal text-zinc-900 placeholder:text-zinc-400 focus:border-[#15803D] focus:outline-none focus:ring-1 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={pageState === "loading"}
                            {...form.register("password")}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </Field>

                      <Field
                        label="Confirm Password"
                        required
                        error={form.formState.errors.confirmPassword?.message}
                        helperText="Re-enter your password to ensure they match."
                      >
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="flex h-11 w-full rounded-xl border border-[#e1efe5] shadow-sm bg-[#f5faf6] pl-11 pr-11 py-2 text-sm font-normal text-zinc-900 placeholder:text-zinc-400 focus:border-[#15803D] focus:outline-none focus:ring-1 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={pageState === "loading"}
                            {...form.register("confirmPassword")}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </Field>

                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 flex items-center gap-3">
                        <Info className="w-4 h-4 text-openclub-700 shrink-0" />
                        <p className="text-[12px] font-normal text-emerald-700">
                          Note: You will use your email ({inviteDetails?.email || "address"}) and this password to sign in across all Openclub devices.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Actions Footer */}
                <div className="mt-auto border-t border-[#e1efe5] bg-gray-50/50 p-5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={currentStep === 1 || pageState === "loading"}
                    className="h-10 border border-[#e1efe5] hover:bg-gray-100/80 bg-white text-gray-700 rounded-xl px-5 text-[13px] font-normal transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => router.push("/login")}
                      disabled={pageState === "loading"}
                      className="h-10 border border-[#e1efe5] hover:bg-gray-100/80 bg-white text-gray-700 rounded-xl px-5 text-[13px] font-normal transition-all disabled:opacity-40"
                    >
                      Cancel
                    </button>

                    {currentStep < totalSteps ? (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="h-10 bg-[#15803D] hover:bg-[#166534] text-white rounded-xl px-6 text-[13px] font-normal flex items-center gap-2 transition-all shadow-sm"
                      >
                        <span>Next Step</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={pageState === "loading"}
                        className="h-10 bg-[#15803D] hover:bg-[#166534] text-white rounded-xl px-6 text-[13px] font-normal flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                      >
                        {pageState === "loading" ? (
                          <>
                            <Icons.spinner className="w-4 h-4 animate-spin text-white" />
                            <span>Activating...</span>
                          </>
                        ) : (
                          <>
                            <span>Activate Account</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  </div>
  );
}
