"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { 
  Upload, Shield, Check, X, Trophy, Calendar, ChevronDown, ChevronRight, Phone, MapPin, Mail, User, ShieldCheck, AlertCircle, Building2, CheckCircle2, Settings, Target, Info, Eye, ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { createMember, updateMember, getMember } from "@/lib/api/members";
import { getClubs, Club, getClub } from "@/lib/api/clubs";
import { DatePicker } from "@/components/ui/date-picker";
import { Country, State, City } from "country-state-city";
import { getNigerianStates, getNigerianLGAs } from "@/lib/nigerian-states-lgas";

interface WizardProps {
  isOpen?: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingUser?: any;
  organizerId?: string | null;
  isPageMode?: boolean;
}

const STEPS = ["Contact Person Information", "Organization", "Review & Confirm"];

const AVAILABLE_ROLES = [
  { id: "PLAYER",     label: "Player",        desc: "Register for tournaments, view leaderboards.",          icon: User,      color: "text-emerald-600", bg: "bg-emerald-50" },
  { id: "CLUB_ADMIN", label: "Organizer Admin", desc: "Manage tournaments, registrations and event settings.", icon: Building2, color: "text-blue-600",    bg: "bg-blue-50" },
  { id: "MARKER",     label: "Marker",         desc: "Enter scores, manage results and scorecards.",           icon: Trophy,    color: "text-amber-600",   bg: "bg-amber-50" },
  { id: "VIEWER",     label: "Viewer",         desc: "Read-only access to tournaments and reports.",           icon: Eye,       color: "text-indigo-600",  bg: "bg-indigo-50" },
  { id: "SUPER_ADMIN",label: "Super Admin",    desc: "Unrestricted platform access and all admin rights.",    icon: Shield,    color: "text-rose-600",    bg: "bg-rose-50" },
];

// Permission matrix per role: [view, create, edit, delete, export]
const ROLE_PERMISSIONS: Record<string, Record<string, boolean[]>> = {
  PLAYER: {
    "User Management":       [false,false,false,false,false],
    "Tournament Management": [true, false,false,false,false],
    "Registration Mgmt":     [true, true, false,false,false],
    "Scoring & Boards":      [true, false,false,false,false],
    "Payments & Payouts":    [false,false,false,false,false],
    "Reports & Analytics":   [false,false,false,false,false],
    "Golf Courses":          [true, false,false,false,false],
    "Platform Settings":     [false,false,false,false,false],
  },
  MARKER: {
    "User Management":       [false,false,false,false,false],
    "Tournament Management": [true, false,false,false,false],
    "Registration Mgmt":     [true, false,false,false,false],
    "Scoring & Boards":      [true, true, true, false,true ],
    "Payments & Payouts":    [false,false,false,false,false],
    "Reports & Analytics":   [true, false,false,false,true ],
    "Golf Courses":          [true, false,false,false,false],
    "Platform Settings":     [false,false,false,false,false],
  },
  VIEWER: {
    "User Management":       [true, false,false,false,false],
    "Tournament Management": [true, false,false,false,false],
    "Registration Mgmt":     [true, false,false,false,false],
    "Scoring & Boards":      [true, false,false,false,false],
    "Payments & Payouts":    [true, false,false,false,false],
    "Reports & Analytics":   [true, false,false,false,true ],
    "Golf Courses":          [true, false,false,false,false],
    "Platform Settings":     [true, false,false,false,false],
  },
  CLUB_ADMIN: {
    "User Management":       [true, true, true, false,false],
    "Tournament Management": [true, true, true, true, true ],
    "Registration Mgmt":     [true, true, true, true, true ],
    "Scoring & Boards":      [true, true, true, false,true ],
    "Payments & Payouts":    [true, true, true, false,true ],
    "Reports & Analytics":   [true, false,false,false,true ],
    "Golf Courses":          [true, true, true, true, false],
    "Platform Settings":     [false,false,false,false,false],
  },
  SUPER_ADMIN: {
    "User Management":       [true, true, true, true, true ],
    "Tournament Management": [true, true, true, true, true ],
    "Registration Mgmt":     [true, true, true, true, true ],
    "Scoring & Boards":      [true, true, true, true, true ],
    "Payments & Payouts":    [true, true, true, true, true ],
    "Reports & Analytics":   [true, true, true, true, true ],
    "Golf Courses":          [true, true, true, true, true ],
    "Platform Settings":     [true, true, true, true, true ],
  },
};

const PERMISSIONS_LIST = [
  { id: "User Management",    label: "User Management",    desc: "Manage users, roles and access control.",       icon: User },
  { id: "Tournament Management", label: "Tournament Mgmt", desc: "Create and manage tournaments and events.",      icon: Trophy },
  { id: "Registration Mgmt",  label: "Registration Mgmt", desc: "Manage registrations and participants.",         icon: Calendar },
  { id: "Scoring & Boards",   label: "Scoring & Boards",  desc: "Enter scores and manage leaderboards.",         icon: Target },
  { id: "Payments & Payouts", label: "Payments & Payouts",desc: "Manage payments, payouts and refunds.",          icon: Building2 },
  { id: "Reports & Analytics",label: "Reports & Analytics",desc: "View and export platform reports.",             icon: AlertCircle },
  { id: "Golf Courses",       label: "Golf Courses",       desc: "Manage golf courses and tee boxes.",            icon: MapPin },
  { id: "Platform Settings",  label: "Platform Settings",  desc: "Configure platform settings and preferences.", icon: Settings },
];

const PERMISSION_ACTIONS = ["View", "Create", "Edit", "Delete", "Export"];

// Merge permissions from all active roles
function mergeRolePermissions(roles: string[]): Record<string, Record<string, boolean>> {
  const merged: Record<string, Record<string, boolean>> = {};
  PERMISSIONS_LIST.forEach(perm => {
    const actionMap: Record<string, boolean> = {};
    PERMISSION_ACTIONS.forEach((action, idx) => {
      // Grant if ANY selected role grants this permission
      actionMap[action.toLowerCase()] = roles.some(role => ROLE_PERMISSIONS[role]?.[perm.id]?.[idx] === true);
    });
    merged[perm.id] = actionMap;
  });
  return merged;
}

const DEFAULT_FORM = {
  firstName: "",
  middleName: "",
  surname: "",
  email: "",
  phone: "",
  dob: "",
  gender: "",
  country: "NG",
  state: "",
  city: "",
  address: "",
  roles: ["PLAYER"] as string[],
  permissions: mergeRolePermissions(["PLAYER"]),
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
    <Label className="text-[13px] font-semibold text-gray-600">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {optional && <span className="text-gray-400 font-medium ml-1">(Optional)</span>}
    </Label>
    {children}
    {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
  </div>
);

export function CreateOrganiserWizard({ isOpen, onClose, onSuccess, editingUser: propEditingUser, organizerId, isPageMode }: WizardProps) {
  const [step, setStep] = useState(1);
  const [editingUser, setEditingUser] = useState<any>(propEditingUser || null);
  const [fetching, setFetching] = useState(false);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [orgProfile, setOrgProfile] = useState({
    name: "",
    type: "Golf Club",
    customType: "",
    website: "",
    phone: "",
    countryCode: "234",
    logo: "",
    address: "",
    contactName: "",
    contactEmail: "",
    about: "",
    facebook: "",
    instagram: "",
    country: "NG",
    state: "",
    city: "",
    plan: "PRO",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const orgLogoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (propEditingUser) {
      setEditingUser(propEditingUser);
    }
  }, [propEditingUser]);

  useEffect(() => {
    if (organizerId && (isOpen || isPageMode)) {
      const loadOrganizer = async () => {
        setFetching(true);
        try {
          const club = await getClub(organizerId);
          const adminUserId = club.users?.[0]?.id;
          if (adminUserId) {
            const user = await getMember(adminUserId);
            setEditingUser({
              ...user,
              club: club
            });
          } else {
            toast.error("No primary admin user found for this organizer");
          }
        } catch (err: any) {
          toast.error(err.message || "Failed to load organizer details");
        } finally {
          setFetching(false);
        }
      };
      loadOrganizer();
    } else if (!organizerId) {
      setEditingUser(propEditingUser || null);
    }
  }, [organizerId, isOpen, isPageMode, propEditingUser]);

  useEffect(() => {
    if (isOpen || isPageMode) {
      setStep(1);
      setShowValidation(false);
      if (editingUser) {
        let phoneStr = editingUser.phone || "";
        if (phoneStr.startsWith("+234")) {
          phoneStr = phoneStr.slice(4);
        } else if (phoneStr.startsWith("+")) {
          phoneStr = phoneStr.replace(/^\+\d+/, "");
        }

        const names = (editingUser.lastName || "").split(/\s+/).filter(Boolean);
        const first = editingUser.firstName || "";
        const sur = names[names.length - 1] || "";
        const mid = names.slice(0, names.length - 1).join(" ");

        setFormData({
          firstName: first,
          middleName: mid,
          surname: sur,
          email: editingUser.email || "",
          phone: phoneStr,
          dob: editingUser.dob || "",
          gender: editingUser.gender || "Male",
          country: editingUser.country || "NG",
          state: editingUser.state || "",
          city: editingUser.city || "",
          address: editingUser.address || "",
          roles: [editingUser.role],
          permissions: editingUser.permissions || mergeRolePermissions([editingUser.role]),
          clubId: editingUser.clubId || "",
          handicap: editingUser.handicap !== undefined && editingUser.handicap !== null ? String(editingUser.handicap) : "20",
          profileImage: editingUser.profilePhoto && !editingUser.profilePhoto.includes("ui-avatars.com") ? editingUser.profilePhoto : "",
          status: editingUser.status || "ACTIVE",
        });

        setOrgProfile({
          name: editingUser.club?.name || "",
          type: editingUser.club?.type || "Golf Club",
          customType: editingUser.club?.type === "Other" ? editingUser.club?.type : "",
          plan: editingUser.club?.plan || "PRO",
          website: editingUser.club?.website || "",
          phone: editingUser.club?.phone || "",
          countryCode: "234",
          logo: editingUser.club?.logo || "",
          address: editingUser.club?.address || "",
          contactName: `${first} ${mid} ${sur}`.replace(/\s+/g, ' ').trim(),
          contactEmail: editingUser.email || "",
          about: editingUser.club?.about || "",
          facebook: editingUser.club?.facebook || "",
          instagram: editingUser.club?.instagram || "",
          country: editingUser.club?.country || "NG",
          state: editingUser.club?.state || "",
          city: editingUser.club?.city || "",
        });
      } else {
        setFormData(DEFAULT_FORM);
        setOrgProfile({
          name: "",
          type: "Golf Club",
          customType: "",
          plan: "PRO",
          website: "",
          phone: "",
          countryCode: "234",
          logo: "",
          address: "",
          contactName: "",
          contactEmail: "",
          about: "",
          facebook: "",
          instagram: "",
          country: "NG",
          state: "",
          city: "",
        });
      }
    }
  }, [isOpen, isPageMode, editingUser]);

  const countryOptions = useMemo(() => Country.getAllCountries().map(c => ({ value: c.isoCode, label: c.name })), []);
  const stateOptions = useMemo(() => {
    if (!formData.country) return [];
    if (formData.country === "NG") {
      return getNigerianStates();
    }
    return State.getStatesOfCountry(formData.country).map(s => ({ value: s.isoCode, label: s.name }));
  }, [formData.country]);
  
  const cityOptions = useMemo(() => {
    if (!formData.country || !formData.state) return [];
    if (formData.country === "NG") {
      return getNigerianLGAs(formData.state);
    }
    return City.getCitiesOfState(formData.country, formData.state).map(c => ({ value: c.name, label: c.name }));
  }, [formData.country, formData.state]);

  const orgStateOptions = useMemo(() => {
    if (!orgProfile.country) return [];
    if (orgProfile.country === "NG") {
      return getNigerianStates();
    }
    return State.getStatesOfCountry(orgProfile.country).map(s => ({ value: s.isoCode, label: s.name }));
  }, [orgProfile.country]);
  
  const orgCityOptions = useMemo(() => {
    if (!orgProfile.country || !orgProfile.state) return [];
    if (orgProfile.country === "NG") {
      return getNigerianLGAs(orgProfile.state);
    }
    return City.getCitiesOfState(orgProfile.country, orgProfile.state).map(c => ({ value: c.name, label: c.name }));
  }, [orgProfile.country, orgProfile.state]);

  const countryCode = useMemo(() => {
    const c = Country.getCountryByCode(formData.country || "NG");
    return (c?.phonecode || "234").replace(/^\+/, "");
  }, [formData.country]);

  const maxDobDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 13);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (!formData.firstName.trim()) return "First name is required";
      if (!editingUser && !formData.middleName.trim()) return "Middle name is required";
      if (!formData.surname.trim()) return "Surname is required";
      if (!formData.email.trim()) return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return "Invalid email address";
      if (!formData.phone.trim()) return "Phone number is required";
      if (!editingUser) {
        if (!formData.dob) {
          return "Date of birth is required";
        } else {
          const birthDate = new Date(formData.dob);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          if (age < 13) {
            return "Minimum age for registration is 13 years.";
          }
        }
        if (!formData.gender) return "Gender is required";
        if (!formData.state) return "State/Province is required";
        if (!formData.city.trim()) return "City is required";
        if (!formData.address.trim()) return "Address is required";
        if (!formData.profileImage) return "Profile image is required";
      }
      if (!formData.status) return "Account status is required";
      if (formData.roles.includes("PLAYER")) {
        if (!formData.handicap) return "Playing handicap is required";
        const h = parseFloat(formData.handicap);
        if (h > 36) return "Handicap cannot exceed the maximum limit (36.0)";
      }
    }
    if (s === 2) {
      if (!orgProfile.name.trim()) return "Organization Name is required";
      if (!orgProfile.type.trim()) return "Organization Type is required";
      if (orgProfile.type === "Other" && !orgProfile.customType?.trim()) return "Custom organization type is required";
      if (!editingUser && !orgProfile.logo.trim()) return "Organization Logo is required";
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

    if (nextStep <= STEPS.length) {
      setStep(nextStep);
      setShowValidation(false);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    let prevStep = step - 1;
    if (prevStep >= 1) setStep(prevStep);
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep < step) {
      setStep(targetStep);
      setShowValidation(false);
      return;
    }
    
    for (let s = 1; s < targetStep; s++) {
      const err = validateStep(s);
      if (err) {
        setShowValidation(true);
        toast.error(`Please complete Step ${s} before proceeding.`);
        setStep(s);
        return;
      }
    }
    setStep(targetStep);
    setShowValidation(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const toastId = toast.loading(editingUser ? "Saving changes..." : "Creating organizer...");
    try {
      const generatedPassword = Math.random().toString(36).slice(-8) + "A1!";
      let isJunior = false;
      if (formData.dob) {
        const birthDate = new Date(formData.dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        isJunior = age < 18;
      }

      
      const payload: any = {
        firstName: formData.firstName.trim(),
        lastName: `${formData.middleName.trim()} ${formData.surname.trim()}`.replace(/\s+/g, ' ').trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone ? `+${countryCode}${formData.phone.replace(/\D/g, "")}` : undefined,
        role: "CLUB_ADMIN", // Force role
        status: formData.status,
        profilePhoto: formData.profileImage && !formData.profileImage.includes("ui-avatars.com") ? formData.profileImage : null,
        dob: formData.dob || undefined,
        gender: formData.gender || undefined,
        state: formData.state || undefined,
        city: formData.city || undefined,
        address: formData.address || undefined,
        clubName: orgProfile.name.trim(),
        clubAddress: formData.address || undefined, // Inherit from contact person
        orgState: formData.state || undefined, // Inherit from contact person
        orgCity: formData.city || undefined, // Inherit from contact person
        clubLogo: orgProfile.logo || undefined,
        clubPlan: orgProfile.plan || "PRO",
        clubType: orgProfile.type || "Golf Club",
        clubWebsite: orgProfile.website || undefined,
        clubAbout: orgProfile.about || undefined,
        clubFacebook: orgProfile.facebook || undefined,
        clubInstagram: orgProfile.instagram || undefined,
        clubCountry: orgProfile.country || "NG",
      };

      if (editingUser) {
        await updateMember(editingUser.id, payload);
        toast.success("Organizer updated successfully", { id: toastId });
      } else {
        payload.password = generatedPassword;
        await createMember(payload);
        toast.success("Organizer created successfully", { id: toastId });
      }
      
      if (isPageMode) {
        setIsRedirecting(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 150);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit organizer details", { id: toastId });
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

  const handleOrgLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setOrgProfile(prev => ({ ...prev, logo: compressed }));
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
            <div className="rounded-2xl border border-[#e7e7e7] bg-white shadow-sm">
              <div className="px-5 py-4 border-b border-[#e7e7e7] bg-gray-50/50 rounded-t-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-gray-900">Basic Details</h4>
                  <p className="text-[12px] text-gray-500">Essential information about the primary contact for this organization.</p>
                </div>
              </div>

              <div className="p-5 space-y-5">
                <Field label="Profile Photo" required>
                  <div className="relative">
                    {formData.profileImage ? (
                      <div className="relative rounded-full overflow-hidden border border-[#e7e7e7] bg-gray-50 h-32 w-32 mx-auto">
                        <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                        <button onClick={() => setFormData({...formData, profileImage: ""})}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div onClick={() => fileInputRef.current?.click()}
                        className={cn("h-32 w-32 mx-auto border-2 border-dashed rounded-full flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group", showValidation && !formData.profileImage ? "!border-red-500" : "border-[#e7e7e7]")}>
                        <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                          <Upload className="w-5 h-5 text-gray-400 group-hover:text-emerald-500" />
                        </div>
                        <div className="text-center">
                          <p className="text-[11px] font-medium text-gray-600 group-hover:text-emerald-600">Upload Image</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">JPG, PNG or WebP</p>
                        </div>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                      onChange={handleImageChange} />
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="First Name" required>
                    <Input 
                      placeholder="Enter first name"
                      value={formData.firstName} 
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                      className={cn(showValidation && !formData.firstName && "!border-red-500")}
                    />
                  </Field>
                  <Field label="Middle Name" required>
                    <Input 
                      placeholder="Enter middle name"
                      value={formData.middleName} 
                      onChange={(e) => setFormData({...formData, middleName: e.target.value})} 
                      className={cn(showValidation && !formData.middleName && "!border-red-500")}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Surname" required>
                    <Input 
                      placeholder="Enter surname"
                      value={formData.surname} 
                      onChange={(e) => setFormData({...formData, surname: e.target.value})} 
                      className={cn(showValidation && !formData.surname && "!border-red-500")}
                    />
                  </Field>
                  <Field label="Date of Birth" required>
                    <DatePicker 
                      value={formData.dob} 
                      onValueChange={(v) => setFormData({...formData, dob: v})} 
                      buttonClassName={cn(showValidation && !formData.dob && "!border-red-500")}
                      maxDate={maxDobDate}
                    />
                    <p className="text-[10px] text-gray-500 mt-1 leading-snug">
                      Minimum age: 13. Accounts under 18 require parental/guardian consent.
                    </p>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Gender" required>
                    <SearchableSelect 
                      value={formData.gender}
                      onValueChange={v => setFormData({...formData, gender: v})}
                      options={[
                        { value: "Male", label: "Male" },
                        { value: "Female", label: "Female" },
                        { value: "Other", label: "Other" },
                      ]}
                      triggerClassName={cn(showValidation && !formData.gender && "!border-red-500")}
                      placeholder="Select gender"
                    />
                  </Field>
                  <Field label="Email Address" required>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        placeholder="Enter email address"
                        value={formData.email} 
                        onChange={(e) => setFormData({...formData, email: e.target.value})} 
                        className={cn("pl-10", showValidation && !formData.email && "!border-red-500")}
                      />
                    </div>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Country" required>
                    <SearchableSelect 
                      value={formData.country}
                      onValueChange={v => setFormData({...formData, country: v, state: "", city: ""})}
                      options={countryOptions}
                      triggerClassName={cn(showValidation && !formData.country && "!border-red-500")}
                      placeholder="Select country"
                    />
                  </Field>
                  <Field label="State / Province" required>
                    <SearchableSelect 
                      value={formData.state}
                      onValueChange={v => setFormData({...formData, state: v, city: ""})}
                      options={stateOptions}
                      disabled={!formData.country}
                      triggerClassName={cn(showValidation && !formData.state && "!border-red-500")}
                      placeholder="Select state / province"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="LGA / City" required>
                    {cityOptions.length > 0 ? (
                      <SearchableSelect 
                        value={formData.city}
                        onValueChange={v => setFormData({...formData, city: v})}
                        options={cityOptions}
                        disabled={!formData.state}
                        triggerClassName={cn(showValidation && !formData.city && "!border-red-500")}
                        placeholder="Select LGA / City"
                      />
                    ) : (
                      <Input 
                        placeholder="Enter LGA / city"
                        value={formData.city} 
                        onChange={(e) => setFormData({...formData, city: e.target.value})} 
                        className={cn(showValidation && !formData.city && "!border-red-500")}
                        disabled={!formData.state}
                      />
                    )}
                  </Field>
                  <Field label="Phone Number" required>
                    <div className="flex gap-2">
                      <div className="h-10 px-3 bg-gray-50 border border-[#e7e7e7] rounded-lg flex items-center justify-center text-[13px] font-medium text-gray-500 shrink-0 min-w-[60px]">
                        +{countryCode}
                      </div>
                      <div className="relative flex-1">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input 
                          placeholder="Enter phone number"
                          value={formData.phone} 
                          onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, "")})} 
                          className={cn("pl-10", showValidation && !formData.phone && "!border-red-500")}
                        />
                      </div>
                    </div>
                  </Field>
                </div>

                <Field label="Address" required>
                  <textarea 
                    value={formData.address} 
                    onChange={(e) => setFormData({...formData, address: e.target.value})} 
                    placeholder="Enter full address"
                    className={cn("flex h-24 w-full rounded-xl border border-[#e7e7e7] bg-white px-3 py-2 text-[12px] transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none", showValidation && !formData.address.trim() && "!border-red-500")}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4 items-start">
                  <div />
                  
                  <Field label="Account Status" required>
                    <SearchableSelect 
                      value={formData.status}
                      onValueChange={v => setFormData({...formData, status: v as any})}
                      options={[
                        { value: "ACTIVE", label: "Active" },
                        { value: "SUSPENDED", label: "Suspended" },
                      ]}
                      triggerClassName="bg-white"
                    />
                  </Field>
                </div>

              </div>
            </div>
          </div>
        );
      case 2: {
        const fullNameStr = `${formData.firstName} ${formData.middleName} ${formData.surname}`.replace(/\s+/g, ' ').trim();
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Premium Replica of Organizer Profile from screenshot */}
            <div className="rounded-2xl border border-[#e7e7e7] bg-white p-5 space-y-4 shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#e7e7e7] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-[14px] font-bold text-gray-900">Organizer Profile</h4>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-[#8b5cf6]/10 text-[#8b5cf6] rounded-full uppercase tracking-wider">Selected</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">Details about the organizer or organization.</p>
                  </div>
                </div>

                {/* Name, Type & Plan */}
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Organization Name" required>
                    <Input 
                      value={orgProfile.name} 
                      onChange={(e) => setOrgProfile({...orgProfile, name: e.target.value})}
                      placeholder="e.g. Lakowe Golf Club"
                      className={cn("bg-white", showValidation && !orgProfile.name.trim() && "!border-red-500")}
                    />
                  </Field>
                  <Field label="Organization Type" required>
                    <SearchableSelect 
                      value={orgProfile.type}
                      onValueChange={(v) => setOrgProfile({...orgProfile, type: v})}
                      options={[
                        { value: "Golf Club", label: "Golf Club" },
                        { value: "Tournament Organizer", label: "Tournament Organizer" },
                        { value: "Sports Association", label: "Sports Association" },
                        { value: "Other", label: "Other" }
                      ]}
                      triggerClassName={cn("bg-white", showValidation && !orgProfile.type.trim() && "!border-red-500")}
                    />
                  </Field>
                  <Field label="Subscription Plan" required>
                    <SearchableSelect 
                      value={orgProfile.plan}
                      onValueChange={(v) => setOrgProfile({...orgProfile, plan: v})}
                      options={[
                        { value: "PRO", label: "Pro Plan" },
                        { value: "BASIC", label: "Basic Plan" }
                      ]}
                      triggerClassName="bg-white"
                    />
                  </Field>
                </div>

                {orgProfile.type === "Other" && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <Field label="Specify Organization Type" required>
                      <Input 
                        value={orgProfile.customType} 
                        onChange={(e) => setOrgProfile({...orgProfile, customType: e.target.value})}
                        placeholder="Enter organization type"
                        className={cn("bg-white", showValidation && !orgProfile.customType.trim() && "!border-red-500")}
                      />
                    </Field>
                  </div>
                )}

                {/* Logo & Website */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Organization Logo" required>
                    <div className="relative h-[100px]">
                      {orgProfile.logo ? (
                        <div className="relative rounded-xl overflow-hidden border border-[#e7e7e7] bg-gray-50 h-[100px] w-[100px] mx-auto">
                          <img src={orgProfile.logo} alt="Logo" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setOrgProfile({...orgProfile, logo: ""})}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div onClick={() => orgLogoInputRef.current?.click()}
                          className={cn("h-[100px] w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group", showValidation && !orgProfile.logo ? "!border-red-500" : "border-[#e7e7e7]")}>
                          <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                            <Upload className="w-4 h-4 text-gray-400 group-hover:text-emerald-500" />
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-gray-600 group-hover:text-emerald-600">Upload Logo</p>
                            <p className="text-[8px] text-gray-400 mt-0.5">JPG, PNG or WebP</p>
                          </div>
                        </div>
                      )}
                      <input ref={orgLogoInputRef} type="file" accept="image/*" className="hidden"
                        onChange={handleOrgLogoChange} />
                    </div>
                  </Field>
                  <Field label="Website" optional>
                    <div className="relative flex flex-col gap-1">
                      <Input 
                        value={orgProfile.website} 
                        onChange={(e) => setOrgProfile({...orgProfile, website: e.target.value})}
                        placeholder="e.g. https://lakowegolfclub.com"
                        className="bg-white"
                      />
                      <p className="text-[9px] text-gray-400">Optional website or social link</p>
                    </div>
                  </Field>
                </div>

                {/* About the Organization */}
                <Field label="About the Organization" optional>
                  <div className="relative">
                    <textarea 
                      value={orgProfile.about} 
                      onChange={(e) => setOrgProfile({...orgProfile, about: e.target.value.slice(0, 500)})}
                      placeholder="Lakowe Golf Club is a premier golf destination offering world-class facilities..."
                      className="w-full h-20 rounded-xl border border-[#e7e7e7] bg-white px-3 py-2 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 resize-none pr-12 text-gray-700"
                    />
                    <span className="absolute bottom-2 right-2 text-[9px] text-gray-400 font-bold">
                      {orgProfile.about.length}/500
                    </span>
                  </div>
                </Field>

                {/* Social Media Links */}
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">Social Media (Optional)</span>
                  <div className="flex gap-3 items-center">
                    <div className="flex-1 flex gap-2.5 items-center border border-[#e7e7e7] rounded-xl px-3 py-2 bg-gray-50/30">
                      <span className="text-gray-400 text-[11px] font-bold w-4 text-center">f</span>
                      <input 
                        value={orgProfile.facebook} 
                        onChange={(e) => setOrgProfile({...orgProfile, facebook: e.target.value})}
                        placeholder="facebook.com/handle" 
                        className="bg-transparent border-none text-[13px] focus:ring-0 w-full focus:outline-none text-gray-700 p-0"
                      />
                    </div>
                    <div className="flex-1 flex gap-2.5 items-center border border-[#e7e7e7] rounded-xl px-3 py-2 bg-gray-50/30">
                      <span className="text-gray-400 text-[11px] font-bold w-4 text-center">in</span>
                      <input 
                        value={orgProfile.instagram} 
                        onChange={(e) => setOrgProfile({...orgProfile, instagram: e.target.value})}
                        placeholder="instagram.com/handle" 
                        className="bg-transparent border-none text-[13px] focus:ring-0 w-full focus:outline-none text-gray-700 p-0"
                      />
                    </div>
                    <Button type="button" variant="outline" className="rounded-xl border-[#e7e7e7] text-gray-600 text-[11px] py-2 h-9 px-4 shrink-0 hover:bg-gray-50 font-bold">
                      + Add more
                    </Button>
                  </div>
                </div>

            </div>
          </div>
        );
      }
      case 3: {
        const birthDate = formData.dob ? new Date(formData.dob) : null;
        let isJunior = false;
        let ageText = "";
        if (birthDate) {
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          isJunior = age < 18;
          ageText = `(${age} years old)`;
        }

        const countryObj = Country.getCountryByCode(formData.country);
        const countryLabel = countryObj?.name || formData.country;
        const stateObj = State.getStateByCodeAndCountry(formData.state, formData.country);
        const stateLabel = stateObj?.name || formData.state;
        const cityLabel = formData.city;

        // Get modules with at least one custom permission enabled
        const activeModules = PERMISSIONS_LIST.filter(perm => {
          const acts = formData.permissions[perm.id] || {};
          return Object.values(acts).some(v => v === true);
        });

        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Friendly Hero Card */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/20 p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                {formData.profileImage ? (
                  <img src={formData.profileImage} className="w-full h-full object-cover" />
                ) : (
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(formData.email || formData.firstName || "user")}`} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-full">New User Account</span>
                <h4 className="text-[16px] font-bold text-gray-900 flex items-center gap-2 mt-0.5 leading-tight">
                  {formData.firstName} {formData.middleName} {formData.surname}
                </h4>
                <p className="text-[12px] text-gray-500 truncate leading-tight">{formData.email}</p>
              </div>
              <div className="flex flex-col gap-1 items-end shrink-0">
                <div className="flex gap-1 flex-wrap justify-end">
                  {formData.roles.map(r => (
                    <span key={r} className={cn(
                      "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border",
                      r === "SUPER_ADMIN" ? "bg-rose-50 text-rose-600 border-rose-100" :
                      r === "CLUB_ADMIN" ? "bg-blue-50 text-blue-600 border-blue-100" :
                      "bg-emerald-50 text-emerald-600 border-emerald-100"
                    )}>
                      {r.replace("_", " ")}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-0.5">
                  <span className={cn("w-2 h-2 rounded-full", formData.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-500")} />
                  <span>{formData.status} Status</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Left Column — Personal details */}
              <div className="rounded-2xl border border-[#e7e7e7] bg-white p-4 space-y-3.5 shadow-sm">
                <div className="flex items-center gap-2 border-b border-[#e7e7e7] pb-2">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <h5 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Personal & Contact Info</h5>
                </div>
                
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Gender</span>
                    <span className="text-[12px] text-gray-700 font-semibold">{formData.gender}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Date of Birth</span>
                    <span className="text-[12px] text-gray-700 font-semibold">{formData.dob ? `${formData.dob} ${ageText}` : "—"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Phone Number</span>
                    <span className="text-[12px] text-gray-700 font-semibold">{formData.phone ? `+${countryCode} ${formData.phone}` : "—"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Email Address</span>
                    <span className="text-[12px] text-gray-700 font-semibold truncate block">{formData.email}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase block">Address Details</span>
                  <span className="text-[12px] text-gray-700 font-semibold block leading-tight">{formData.address}</span>
                  <span className="text-[11px] text-gray-400 block mt-1 leading-snug">{cityLabel}, {stateLabel}, {countryLabel}</span>
                </div>
              </div>

              {/* Right Column — Role, Organization and Permissions */}
              <div className="rounded-2xl border border-[#e7e7e7] bg-white p-4 space-y-3.5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 border-b border-[#e7e7e7] pb-2 mb-3">
                    <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                    <h5 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Organization Details</h5>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <span className="text-[8px] font-bold text-gray-400 uppercase block">Name</span>
                        <span className="text-[12px] text-gray-700 font-semibold truncate block">{orgProfile.name || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-gray-400 uppercase block">Type</span>
                        <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 inline-block mt-0.5">{orgProfile.type || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-gray-400 uppercase block">Subscription</span>
                        <span className="text-[11px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-100 inline-block mt-0.5">{orgProfile.plan}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-gray-400 uppercase block">Address (Inherited)</span>
                      <span className="text-[11px] text-gray-600 font-medium block leading-tight mt-0.5">{formData.address || "—"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  if (isPageMode) {
    return (
      <div className={cn("space-y-6 transition-all duration-150", isRedirecting ? "opacity-0 blur-sm pointer-events-none" : "opacity-100")}>
        {/* Page Header */}
        <div className="flex items-center justify-between bg-white border border-[#e7e7e7] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="w-10 h-10 border border-[#e7e7e7] hover:border-emerald-500 hover:bg-emerald-50/20 text-gray-500 hover:text-emerald-600 rounded-xl flex items-center justify-center transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-[14px] font-bold text-gray-900">{editingUser ? "Edit Organizer" : "Add Organizer"}</h1>
              <p className="text-[13px] text-gray-500 mt-0.5">
                {editingUser ? "Update and configure the organizer details step by step" : "Setup and configure a new platform organizer step by step"}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Steps Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-[#fafafa] border border-[#e7e7e7] rounded-xl p-3 shadow-sm space-y-2 sticky top-6">
              {STEPS.map((name, i) => {
                const active = step === i + 1;
                const past = step > i + 1;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (!loading) handleStepClick(i + 1);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3.5 border rounded-xl transition-all duration-200",
                      active
                        ? "bg-[#f4fdf8] border-[#10b981] text-[#10b981]"
                        : "bg-white border-[#e7e7e7] text-[#64748b] hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center gap-3.5 whitespace-nowrap overflow-hidden">
                      <div
                        className={cn(
                          "w-[22px] h-[22px] shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300",
                          active
                            ? "bg-[#10b981] text-white"
                            : past
                            ? "bg-emerald-100 text-emerald-600 border border-emerald-200"
                            : "bg-gray-100 text-gray-400 border border-[#e7e7e7]"
                        )}
                      >
                        {past ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : i + 1}
                      </div>
                      <span className="text-[13px] font-normal leading-tight">{name}</span>
                    </div>
                    {active && <ChevronRight className="w-4 h-4 shrink-0 text-[#10b981]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column - Active Step Content */}
          <div className="lg:col-span-4 space-y-6">
            <div className="min-h-[400px]">
              {fetching ? (
                <div className="space-y-6 bg-white border border-[#e7e7e7] rounded-2xl p-6 animate-pulse">
                  <div className="h-5 w-32 bg-gray-100 rounded-lg" />
                  <div className="h-12 w-full bg-gray-50 rounded-xl" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-12 w-full bg-gray-50 rounded-xl" />
                    <div className="h-12 w-full bg-gray-50 rounded-xl" />
                  </div>
                  <div className="h-32 w-full bg-gray-50 rounded-xl" />
                </div>
              ) : (
                renderStep()
              )}
            </div>

            {/* Form Actions Footer */}
            <div className="bg-white border border-[#e7e7e7] rounded-2xl p-5 shadow-sm flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 1 || loading}
                className="h-10 rounded-xl px-5 text-[13px] font-bold"
              >
                ← Back
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                  className="h-10 rounded-xl px-5 text-[13px] font-bold"
                >
                  Cancel
                </Button>
                {step < STEPS.length ? (
                  <Button
                    onClick={handleNext}
                    className="h-10 bg-[#10b981] hover:bg-[#0da673] text-white rounded-xl px-6 text-[13px] font-bold"
                  >
                    Next Step →
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="h-10 bg-[#10b981] hover:bg-[#0da673] text-white rounded-xl px-6 text-[13px] font-bold"
                  >
                    {loading ? (editingUser ? "Saving Changes..." : "Creating Organizer...") : (editingUser ? "Save Changes" : "Save Organizer")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Modal
      isOpen={!!isOpen}
      onClose={onClose}
      title={editingUser ? "Edit Organiser Details" : "Add New Organiser"}
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
                {loading ? (editingUser ? "Saving Changes..." : "Creating User...") : (editingUser ? "Save Changes" : "Save User")}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-8 h-full flex flex-col">
        {/* Step Indicators - Consistent Multistep UI Style */}
        <div className="flex gap-1 border-b border-[#e7e7e7] pb-4 shrink-0 overflow-x-auto no-scrollbar">
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
        <div className="w-full flex-1 min-h-0">
          {renderStep()}
        </div>
      </div>
    </Modal>
  );
}
