"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { 
  UserPlus, 
  ArrowRight, 
  ArrowLeft,
  Upload, 
  Shield, 
  Check, 
  X, 
  Globe, 
  Clock, 
  Trophy,
  Calendar,
  ChevronDown,
  Phone,
  MapPin,
  Mail,
  User,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
  Settings,
  Target
} from "lucide-react";
import { toast } from "sonner";
import { createMember } from "@/lib/api/members";
import { getClubs, Club } from "@/lib/api/clubs";
import { DatePicker } from "@/components/ui/date-picker";

interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STEPS = ["Basic Information", "Role & Permissions", "Organization", "Review & Confirm"];

const DEFAULT_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  role: "PLAYER" as "SUPER_ADMIN" | "CLUB_ADMIN" | "PLAYER" | "MARKER",
  clubId: "",
  handicap: "20",
  profileImage: "",
  status: "ACTIVE" as "ACTIVE" | "SUSPENDED" | "EXPIRED",
};

type FormData = typeof DEFAULT_FORM;

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

const Field = ({ label, required, children, error, optional }: { label: string; required?: boolean; children: React.ReactNode; error?: string; optional?: boolean }) => (
  <div className="space-y-1.5">
    <Label className="text-[13px] font-bold text-gray-700">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {optional && <span className="text-gray-400 font-medium ml-1">(Optional)</span>}
    </Label>
    {children}
    {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
  </div>
);

export function CreateUserWizard({ isOpen, onClose, onSuccess }: WizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [clubs, setClubs] = useState<any[]>([]);
  const [showValidation, setShowValidation] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData(DEFAULT_FORM);
      setShowValidation(false);
      fetchClubs();
    }
  }, [isOpen]);

  const fetchClubs = async () => {
    try {
      const data = await getClubs();
      setClubs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch clubs", err);
    }
  };

  const countryCode = "234"; // Defaulting to 234 as country fields were removed

  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (!formData.firstName.trim()) return "First name is required";
      if (!formData.lastName.trim()) return "Last name is required";
      if (!formData.email.trim()) return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return "Invalid email address";
      if (!formData.password) return "Password is required";
      if (formData.password.length < 8) return "Password must be at least 8 characters";
      if (!formData.phone.trim()) return "Phone number is required";
      if (formData.role === "PLAYER") {
        if (!formData.handicap) return "Playing handicap is required";
        const h = parseFloat(formData.handicap);
        if (h > 36) return "Handicap cannot exceed the maximum limit (36.0)";
      }
    }
    if (s === 2) {
      if (!formData.role) return "Please select a role";
      if (!formData.status) return "Please select account status";
    }
    if (s === 3) {
      if (formData.role === "CLUB_ADMIN" && !formData.clubId) return "Please select an organization";
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep(step);
    if (err) {
      setShowValidation(true);
      toast.error(err);
      return;
    }
    
    let nextStep = step + 1;
    const skipRoles = ["PLAYER", "MARKER", "SUPER_ADMIN"];
    
    if (step === 2 && skipRoles.includes(formData.role)) {
      nextStep = 4; // Jump to Review & Confirm
    }

    if (nextStep <= STEPS.length) {
      setStep(nextStep);
      setShowValidation(false);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    let prevStep = step - 1;
    const skipRoles = ["PLAYER", "MARKER", "SUPER_ADMIN"];
    
    if (step === 4 && skipRoles.includes(formData.role)) {
      prevStep = 2;
    }

    if (prevStep >= 1) setStep(prevStep);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone ? `+${countryCode}${formData.phone.replace(/\D/g, "")}` : null,
        role: formData.role,
        status: formData.status,
        profilePhoto: formData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.firstName)}+${encodeURIComponent(formData.lastName)}&background=10b981&color=fff&bold=true`,
        handicap: formData.role === "PLAYER" ? parseFloat(formData.handicap) : null,
        clubId: (formData.role === "CLUB_ADMIN" || formData.role === "MARKER") ? formData.clubId : null,
      };

      await createMember(payload);
      toast.success("User created successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setFormData(prev => ({ ...prev, profileImage: compressed }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to process image";
      toast.error(msg);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Profile Photo at Top */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col items-center">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative w-28 h-28 rounded-full border-4 border-dashed transition-all cursor-pointer group flex items-center justify-center overflow-hidden",
                  formData.profileImage ? "border-emerald-500 border-solid" : "border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/30"
                )}
              >
                {formData.profileImage ? (
                  <>
                    <img src={formData.profileImage} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="w-5 h-5 text-gray-400 group-hover:text-emerald-500" />
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Photo</span>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="First Name" required>
                  <Input 
                    placeholder="Enter first name"
                    value={formData.firstName} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, firstName: e.target.value})} 
                    className={cn("h-12 rounded-xl", showValidation && !formData.firstName && "border-red-500 bg-red-50/50")}
                  />
                </Field>
                <Field label="Last Name" required>
                  <Input 
                    placeholder="Enter last name"
                    value={formData.lastName} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, lastName: e.target.value})} 
                    className={cn("h-12 rounded-xl", showValidation && !formData.lastName && "border-red-500 bg-red-50/50")}
                  />
                </Field>

                <Field label="Email Address" required>
                  <Input 
                    placeholder="Enter email address"
                    value={formData.email} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, email: e.target.value})} 
                    className={cn("h-12 rounded-xl", showValidation && !formData.email && "border-red-500 bg-red-50/50")}
                  />
                </Field>

                <Field label="Password" required>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      value={formData.password} 
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, password: e.target.value})} 
                      className={cn("pl-11 pr-12 h-12 rounded-xl", showValidation && (!formData.password || formData.password.length < 8) && "border-red-500 bg-red-50/50")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Field>

                <Field label="Phone Number" required>
                  <div className="flex gap-2">
                    <div className="h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-[14px] font-bold text-gray-500 shrink-0 min-w-[70px]">
                      +{countryCode}
                    </div>
                    <div className="relative flex-1">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        placeholder="Enter phone number"
                        value={formData.phone} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, phone: e.target.value.replace(/\D/g, "")})} 
                        className={cn("pl-11 h-12 rounded-xl", showValidation && !formData.phone && "border-red-500 bg-red-50/50")}
                      />
                    </div>
                  </div>
                </Field>

                {formData.role === "PLAYER" && (
                  <Field label="Playing Handicap" required>
                    <div className="relative">
                      <Input 
                        type="number"
                        step="0.1"
                        placeholder="e.g. 15.4"
                        value={formData.handicap} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, handicap: e.target.value})} 
                        className={cn("h-12 rounded-xl pr-16 font-bold text-emerald-600", showValidation && !formData.handicap && "border-red-500 bg-red-50/50")}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded">MAX 36</span>
                    </div>
                  </Field>
                )}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="grid grid-cols-1 gap-4">
              <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Select Role</Label>
              {[
                { id: "PLAYER", label: "Player", desc: "Regular user who participates in tournaments.", icon: Trophy, color: "text-emerald-600", bg: "bg-emerald-50" },
                { id: "CLUB_ADMIN", label: "Organizer Admin", desc: "Can manage club details, courses and tournaments.", icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
                { id: "MARKER", label: "Tournament Marker", desc: "Responsible for verifying player scores.", icon: ShieldCheck, color: "text-purple-600", bg: "bg-purple-50" },
                { id: "SUPER_ADMIN", label: "Super Admin", desc: "Full access to manage the entire platform.", icon: Shield, color: "text-rose-600", bg: "bg-rose-50" },
              ].map((role) => (
                <div 
                  key={role.id}
                  onClick={() => setFormData({...formData, role: role.id as FormData["role"]})}
                  className={cn(
                    "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer group",
                    formData.role === role.id 
                      ? "border-emerald-500 bg-emerald-50/30 shadow-md scale-[1.01]" 
                      : "border-gray-100 hover:border-gray-200 bg-white"
                  )}
                >
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-colors", role.bg, role.color)}>
                    <role.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[15px] font-bold text-gray-900">{role.label}</h4>
                    <p className="text-[12px] text-gray-500 mt-0.5">{role.desc}</p>
                  </div>
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                    formData.role === role.id ? "border-emerald-500 bg-emerald-500 text-white" : "border-gray-200 bg-white"
                  )}>
                    {formData.role === role.id && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                  </div>
                </div>
              ))}
            </div>

            <Field label="Account Status" required>
              <SearchableSelect 
                value={formData.status}
                onValueChange={v => setFormData({...formData, status: v as any})}
                options={[
                  { value: "ACTIVE", label: "Active" },
                  { value: "SUSPENDED", label: "Suspended" },
                ]}
                triggerClassName="h-12 bg-white rounded-xl"
              />
            </Field>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-gray-900">Link Organization</h4>
                <p className="text-[12px] text-blue-700/70">Assign this user to an organizer/club.</p>
              </div>
            </div>
            <Field label="Select Organization" required>
              <SearchableSelect 
                value={formData.clubId}
                onValueChange={(v: string) => setFormData({...formData, clubId: v})}
                options={clubs.map(c => ({ value: c.id, label: c.name }))}
                triggerClassName={cn("h-12 bg-white rounded-xl", showValidation && !formData.clubId && "border-red-500 bg-red-50/50")}
                placeholder="Search organizations..."
              />
            </Field>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-6 flex items-center gap-4 bg-white border-b border-gray-100">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                  {formData.profileImage ? (
                    <img src={formData.profileImage} className="w-full h-full object-cover" />
                  ) : (
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(formData.firstName)}+${encodeURIComponent(formData.lastName)}&background=10b981&color=fff&bold=true`} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900">{formData.firstName} {formData.lastName}</h4>
                  <p className="text-[13px] text-gray-500">{formData.email}</p>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border",
                  formData.role === "SUPER_ADMIN" ? "bg-rose-50 text-rose-600 border-rose-100" :
                  formData.role === "CLUB_ADMIN" ? "bg-blue-50 text-blue-600 border-blue-100" :
                  "bg-emerald-50 text-emerald-600 border-emerald-100"
                )}>
                  {formData.role.replace("_", " ")}
                </div>
              </div>
              <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-12">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-gray-400 uppercase">Phone Number</p>
                  <p className="text-[14px] font-bold text-gray-800">{formData.phone ? `+${countryCode} ${formData.phone}` : "—"}</p>
                </div>
                {formData.role === "PLAYER" && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-gray-400 uppercase">Playing Handicap</p>
                    <p className="text-[14px] font-bold text-emerald-600">{formData.handicap}</p>
                  </div>
                )}
                {(formData.role === "CLUB_ADMIN" || formData.role === "MARKER") && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-gray-400 uppercase">Organization</p>
                    <p className="text-[14px] font-bold text-blue-600">
                      {clubs.find(c => c.id === formData.clubId)?.name || "Not selected"}
                    </p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-gray-400 uppercase">Account Status</p>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", formData.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-500")} />
                    <p className="text-[14px] font-bold text-gray-800">{formData.status}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-[12px] text-amber-700 leading-relaxed font-medium">
                Review all details carefully. Once confirmed, the user will be created and can log in with the provided credentials.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New User"
      size="xl"
      footer={
        <div className="flex justify-between w-full">
          <Button variant="outline" onClick={handleBack} disabled={step === 1 || loading}>Back</Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            {step < STEPS.length ? (
              <Button onClick={handleNext} className="bg-[#10b981] hover:bg-[#0da673] text-white px-6">
                Next Step →
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading} className="bg-[#10b981] hover:bg-[#0da673] text-white px-6">
                {loading ? "Creating User..." : "Save User"}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Step Indicators - Consistent Multistep UI Style */}
        <div className="flex gap-1 border-b border-gray-100 pb-4 mb-6 overflow-x-auto no-scrollbar">
          {STEPS.map((name, i) => {
            const active = step === i + 1;
            const past = step > i + 1;
            return (
              <div key={i} className="flex flex-col items-center flex-1 gap-1 min-w-[70px]">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300",
                  active ? "bg-[#10b981] text-white shadow-sm ring-4 ring-emerald-50" : 
                  past ? "bg-emerald-100 text-emerald-600" : 
                  "bg-gray-100 text-gray-400"
                )}>
                  {past ? <Check className="w-4 h-4 stroke-[3px]" /> : i + 1}
                </div>
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-wider text-center leading-tight transition-colors",
                  active ? "text-gray-900" : "text-gray-400"
                )}>
                  {name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="w-full min-h-[400px]">
          {renderStep()}
        </div>
      </div>
    </Modal>
  );
}
