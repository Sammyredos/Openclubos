"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { Country, State } from "country-state-city";
import { getNigerianStates } from "@/lib/nigerian-states-lgas";
import { Label } from "@/components/ui/label";
import { createTournament, getTournament, getTournaments, updateTournament, UpdateTournamentPayload } from "@/lib/api/tournaments";
import { getOrganizers } from "@/lib/api/organizers";
import { getCourses, Course } from "@/lib/api/courses";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Upload, X, ImageIcon, MapPin, Building2, Trophy, Info, Users, Shield, CalendarDays, ListOrdered, CreditCard, LayoutGrid, Activity, Clock, Eye, Send, AlertTriangle } from "lucide-react";

type WizardProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tournamentId?: string | null;
};

const STEPS = ["Basic Details", "Schedule", "Format & Divisions", "Eligibility", "Payments", "Grouping", "Scoring", "Publish"];

async function compressImage(file: File, targetKB = 50): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      const MAX_DIM = 800;
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

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  if (e && typeof e === "object" && "message" in e && typeof (e as { message?: unknown }).message === "string") {
    return (e as { message: string }).message;
  }
  return null;
}

const DEFAULT_FORM = {
  name: "", clubId: "", courseId: "",
  bannerUrl: "", bannerPreview: "",
  description: "", venue: "NG", location: "",
  startDate: "", endDate: "", registrationOpenAt: "", registrationCloseAt: "",
  format: "STROKE_PLAY" as const, scoringType: "GROSS" as const, holes: 18, divisions: [] as string[],
  allowRegisteredPlayers: true, allowGuests: false, allowExternalPlayers: false,
  hasHandicapRestriction: false, minHandicap: "", maxHandicap: "",
  maxPlayers: "", maxPlayersPerGroup: 4, enableWaitlist: false,
  requiresPayment: false, entryFee: "", currency: "NGN", paymentDeadline: "", isRefundable: false,
  autoGrouping: true, teeStartTime: "", teeIntervalMinutes: 10,
  enableLiveScoring: false, requireMarkerVerification: false, enableHoleScoring: true,
  publishImmediately: false, visibility: "PUBLIC" as const,
};

type FormData = typeof DEFAULT_FORM;

function validateStep(step: number, f: FormData, isMultiDay = false): string | null {
  if (step === 1) {
    if (!f.name.trim()) return "Tournament name is required.";
    if (!f.venue) return "Please select a country.";
    if (!f.clubId) return "Please select an organizer.";
    if (!f.courseId) return "Please select a golf course.";
    if (!f.bannerUrl) return "Tournament banner is required.";
    if (!f.description.trim()) return "Description is required.";
  }
  if (step === 2) {
    if (!f.startDate) return "Start date is required.";
    if (isMultiDay) {
      if (!f.endDate) return "End date is required for a multi-day tournament.";
      if (f.endDate <= f.startDate) return "End date must be at least one day after the start date.";
    }
    if (!f.registrationOpenAt) return "Registration open date is required.";
    if (!f.registrationCloseAt) return "Registration close date is required.";
    if (f.registrationCloseAt < f.registrationOpenAt)
      return "Registration close date must be after the open date.";
    if (f.registrationCloseAt >= f.startDate)
      return "Registration must close before the tournament start date.";
  }
  if (step === 3) {
    if (!f.format) return "Tournament format is required.";
    if (!f.scoringType) return "Scoring type is required.";
    if (!f.holes || f.holes < 1) return "Number of holes is required and must be at least 1.";
    if (f.divisions.length === 0) return "At least one division is required.";
  }
  if (step === 4) {
    if (f.maxPlayers && Number(f.maxPlayers) <= 0) return "Max total players must be greater than zero.";
    if (!f.maxPlayersPerGroup || Number(f.maxPlayersPerGroup) <= 0) return "Players per group is required.";
    if (f.hasHandicapRestriction) {
      if (f.minHandicap === "") return "Minimum handicap is required when restriction is enabled.";
      if (f.maxHandicap === "") return "Maximum handicap is required when restriction is enabled.";
      if (Number(f.minHandicap) > Number(f.maxHandicap))
        return "Minimum handicap cannot exceed maximum handicap.";
    }
  }
  if (step === 5) {
    if (f.requiresPayment && !f.entryFee) return "Entry fee is required when payment is enabled.";
    if (f.requiresPayment && Number(f.entryFee) <= 0) return "Entry fee must be greater than zero.";
  }
  if (step === 6) {
    if (f.autoGrouping) {
      if (!f.teeStartTime) return "Tee off start time is required.";
      if (!f.teeIntervalMinutes || Number(f.teeIntervalMinutes) <= 0) return "Tee interval must be greater than zero.";
    }
  }
  return null;
}

const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center gap-3 cursor-pointer select-none group">
    <div
      onClick={() => onChange(!checked)}
      className={cn("relative w-10 h-6 rounded-full transition-colors flex-shrink-0", checked ? "bg-emerald-500" : "bg-gray-200")}
    >
      <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all", checked ? "left-5" : "left-1")} />
    </div>
    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
  </label>
);

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-[13px] font-semibold text-gray-600">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
    {children}
  </div>
);

export function CreateTournamentWizard({ isOpen, onClose, onSuccess, tournamentId }: WizardProps) {
  const [step, setStep] = useState(1);
  const [showValidation, setShowValidation] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [nameCheckLoading, setNameCheckLoading] = useState(false);
  const [organizers, setOrganizers] = useState<{ id: string; name: string }[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [formData, setFormData] = useState<FormData>({ ...DEFAULT_FORM });
  const [originalStatus, setOriginalStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const countryOptions = useMemo(() => Country.getAllCountries().map(c => ({ value: c.isoCode, label: c.name })), []);
  const stateOptions = useMemo(() => {
    if (!formData.venue) return [];
    if (formData.venue === "NG") {
      return getNigerianStates();
    }
    return State.getStatesOfCountry(formData.venue).map(s => ({ value: s.isoCode, label: s.name }));
  }, [formData.venue]);

  // Filter courses by selected country
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      return !formData.venue || c.country?.toLowerCase() === formData.venue?.toLowerCase();
    });
  }, [courses, formData.venue]);

  const req = (val: any) => (showValidation && !val ? "border-red-400 bg-red-50/30" : "");

  // Date arithmetic helpers
  function shiftDate(ymd: string, days: number): string {
    if (!ymd) return "";
    const [y, m, d] = ymd.split("-").map(Number);
    const dt = new Date(y, m - 1, d + days);
    const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  }

  const formatFriendlyDate = (dateStr: string) => {
    if (!dateStr) return "Tournament Start Date";
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();

    const getOrdinal = (n: number) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    return `${getOrdinal(day)} of ${month}, ${year}`;
  };

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setShowValidation(false);
      setIsMultiDay(false);
      setFormData({ ...DEFAULT_FORM });
      getOrganizers()
        .then((d: any[]) => {
          if (Array.isArray(d)) setOrganizers(d.map((o) => ({ id: o.id, name: o.name })));
        })
        .catch(() => { });

      getCourses().then((d: any) => {
        setCourses(Array.isArray(d) ? d : d.items || []);
      }).catch(() => { });

      if (tournamentId) {
        setLoading(true);
        getTournament(tournamentId)
          .then((t) => {
            setOriginalStatus(t.status);

            const loadedVenue = t.venue || "NG";
            let loadedLocation = t.location || "";
            if (loadedVenue === "NG" && loadedLocation) {
              const matchedState = getNigerianStates().find(
                s => s.value.toLowerCase() === loadedLocation.toLowerCase()
              );
              if (matchedState) {
                loadedLocation = matchedState.value;
              }
            } else if (loadedVenue && loadedLocation) {
              const matchedState = State.getStatesOfCountry(loadedVenue).find(
                s => s.isoCode.toLowerCase() === loadedLocation.toLowerCase() || s.name.toLowerCase() === loadedLocation.toLowerCase()
              );
              if (matchedState) {
                loadedLocation = matchedState.isoCode;
              }
            }

            setFormData({
              name: t.name || "",
              clubId: t.clubId || "",
              courseId: t.courseId || "",
              bannerUrl: t.bannerUrl || "",
              bannerPreview: t.bannerUrl || "",
              description: t.description || "",
              venue: loadedVenue,
              location: loadedLocation,
              startDate: t.startDate ? t.startDate.slice(0, 10) : "",
              endDate: t.endDate ? t.endDate.slice(0, 10) : "",
              registrationOpenAt: t.registrationOpenAt ? t.registrationOpenAt.slice(0, 10) : "",
              registrationCloseAt: t.registrationCloseAt ? t.registrationCloseAt.slice(0, 10) : "",
              format: t.format || "STROKE_PLAY",
              scoringType: t.scoringType || "GROSS",
              holes: t.holes || 18,
              divisions: t.divisions || [],
              allowRegisteredPlayers: t.allowRegisteredPlayers ?? true,
              allowGuests: t.allowGuests ?? false,
              allowExternalPlayers: t.allowExternalPlayers ?? false,
              hasHandicapRestriction: t.hasHandicapRestriction ?? false,
              minHandicap: t.minHandicap != null ? String(t.minHandicap) : "",
              maxHandicap: t.maxHandicap != null ? String(t.maxHandicap) : "",
              maxPlayers: t.maxPlayers != null ? String(t.maxPlayers) : "",
              maxPlayersPerGroup: t.maxPlayersPerGroup || 4,
              enableWaitlist: t.enableWaitlist ?? false,
              requiresPayment: t.requiresPayment ?? false,
              entryFee: t.entryFee != null ? String(t.entryFee) : "",
              currency: t.currency || "NGN",
              paymentDeadline: t.paymentDeadline ? t.paymentDeadline.slice(0, 10) : "",
              isRefundable: t.isRefundable ?? false,
              autoGrouping: t.autoGrouping ?? false,
              teeStartTime: t.teeStartTime || "",
              teeIntervalMinutes: t.teeIntervalMinutes || 10,
              enableLiveScoring: t.enableLiveScoring ?? false,
              requireMarkerVerification: t.requireMarkerVerification ?? false,
              enableHoleScoring: t.enableHoleScoring ?? true,
              publishImmediately: t.status !== "DRAFT",
              visibility: t.visibility || "PUBLIC",
            });
            // Auto-enable multi-day if the tournament already has an end date
            setIsMultiDay(!!t.endDate);
          })
          .catch((e) => {
            toast.error(getErrorMessage(e) || "Failed to load tournament data");
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [isOpen, tournamentId]);

  const set = (field: string, value: any) => setFormData((p) => ({ ...p, [field]: value }));

  const handleClubChange = (id: string) => {
    set("clubId", id);
    // Find first course of this club to prefill
    const firstCourse = courses.find(c => c.clubId === id);
    if (firstCourse) {
      setFormData(prev => ({
        ...prev,
        courseId: firstCourse.id,
        venue: firstCourse.country || prev.venue,
        location: firstCourse.state || prev.location
      }));
    }
  };

  const handleCourseChange = (id: string) => {
    const course = courses.find(c => c.id === id);
    if (course) {
      setFormData(prev => ({
        ...prev,
        courseId: id,
        venue: course.country || prev.venue,
        location: course.state || prev.location
      }));
    } else {
      set("courseId", id);
    }
  };

  const handleBannerUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file."); return; }
    setCompressing(true);
    try {
      const compressed = await compressImage(file, 50);
      set("bannerPreview", compressed);
      set("bannerUrl", compressed);
      const kb = Math.round((compressed.length * 3) / 4 / 1024);
      toast.success(`Banner compressed to ~${kb}KB`);
    } catch {
      toast.error("Failed to process image.");
    } finally {
      setCompressing(false);
    }
  };

  const handleNext = async () => {
    const err = validateStep(step, formData, isMultiDay);
    if (err) { setShowValidation(true); toast.error(err); return; }

    // Async name uniqueness check on Step 1
    if (step === 1) {
      setNameCheckLoading(true);
      try {
        const all = await getTournaments() as Array<{ id: string; name: string }>;
        const trimmed = formData.name.trim().toLowerCase();
        const duplicate = Array.isArray(all)
          ? all.find(
            (t) =>
              t.name.trim().toLowerCase() === trimmed &&
              t.id !== tournamentId, // allow same name when editing self
          )
          : null;
        if (duplicate) {
          setShowValidation(true);
          toast.error(`A tournament named "${duplicate.name}" already exists. Include the year or a unique identifier to differentiate it.`);
          return;
        }
      } catch {
        // If the check fails, allow proceeding — server will catch duplicates
      } finally {
        setNameCheckLoading(false);
      }
    }

    setShowValidation(false);
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const handleSubmitClick = () => {
    for (let s = 1; s <= STEPS.length; s++) {
      const err = validateStep(s, formData, isMultiDay);
      if (err) { setShowValidation(true); toast.error(`Step ${s}: ${err}`); setStep(s); return; }
    }
    const isPublishing = formData.publishImmediately && (!tournamentId || originalStatus === "DRAFT");
    if (isPublishing) {
      setShowPublishConfirm(true);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const f = formData;
      const payload: UpdateTournamentPayload = {
        name: f.name,
        clubId: f.clubId,
        courseId: f.courseId,
        description: f.description || null,
        bannerUrl: f.bannerUrl || null,
        venue: f.venue || null,
        location: f.location || null,
        startDate: new Date(f.startDate).toISOString(),
        endDate: f.endDate ? new Date(f.endDate).toISOString() : null,
        registrationOpenAt: f.registrationOpenAt ? new Date(f.registrationOpenAt).toISOString() : null,
        registrationCloseAt: f.registrationCloseAt ? new Date(f.registrationCloseAt).toISOString() : null,
        format: f.format,
        scoringType: f.scoringType,
        holes: Number(f.holes),
        divisions: f.divisions,
        allowRegisteredPlayers: f.allowRegisteredPlayers,
        allowGuests: f.allowGuests,
        allowExternalPlayers: f.allowExternalPlayers,
        hasHandicapRestriction: f.hasHandicapRestriction,
        minHandicap: f.hasHandicapRestriction && f.minHandicap !== "" ? Number(f.minHandicap) : null,
        maxHandicap: f.hasHandicapRestriction && f.maxHandicap !== "" ? Number(f.maxHandicap) : null,
        maxPlayers: f.maxPlayers !== "" ? Number(f.maxPlayers) : null,
        maxPlayersPerGroup: Number(f.maxPlayersPerGroup),
        enableWaitlist: f.enableWaitlist,
        requiresPayment: f.requiresPayment,
        entryFee: f.requiresPayment && f.entryFee !== "" ? Number(f.entryFee) : null,
        currency: f.requiresPayment ? f.currency : "NGN",
        paymentDeadline: f.requiresPayment && f.paymentDeadline ? new Date(f.paymentDeadline).toISOString() : null,
        isRefundable: f.requiresPayment ? f.isRefundable : false,
        autoGrouping: f.autoGrouping,
        teeStartTime: f.autoGrouping && f.teeStartTime ? f.teeStartTime : null,
        teeIntervalMinutes: f.autoGrouping ? Number(f.teeIntervalMinutes) : 10,
        enableLiveScoring: f.enableLiveScoring,
        requireMarkerVerification: f.requireMarkerVerification,
        enableHoleScoring: f.enableHoleScoring,
        publishImmediately: f.publishImmediately,
        visibility: f.visibility,
        status: tournamentId
          ? (f.publishImmediately
            ? (originalStatus === "DRAFT" ? "REGISTRATION_OPEN" : undefined)
            : "DRAFT")
          : (f.publishImmediately ? "REGISTRATION_OPEN" : "DRAFT"),
      };

      if (tournamentId) {
        await updateTournament(tournamentId, payload);
        toast.success("Tournament updated!");
      } else {
        await createTournament(payload);
        toast.success("Tournament created!");
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.message || `Failed to ${tournamentId ? "update" : "create"} tournament`);
    } finally {
      setLoading(false);
    }
  };

  const stepContent = () => {
    switch (step) {
      case 1: return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-gray-900">Basic Details</h4>
                <p className="text-[12px] text-gray-500">Essential information about the tournament</p>
              </div>
            </div>

            <div className="p-5 space-y-5">
              <Field label="Tournament Name" required>
                <div className="relative">
                  <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input value={formData.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Sunshine Tour 2026" className={cn("pl-11", req(formData.name))} />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Include the year so recurring tournaments stay unique — e.g. <span className="font-semibold text-gray-500">Lagos Open 2026</span>, <span className="font-semibold text-gray-500">Sunshine Tour 2026</span>.
                </p>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Country" required>
                  <SearchableSelect value={formData.venue} onValueChange={(v) => { set("venue", v); set("courseId", ""); set("location", ""); }}
                    options={countryOptions} placeholder="Select country..." triggerClassName={req(formData.venue)} />
                </Field>
                <Field label="Golf Course" required>
                  <SearchableSelect
                    value={formData.courseId}
                    onValueChange={handleCourseChange}
                    options={filteredCourses.map((c) => ({
                      value: c.id,
                      label: c.name,
                      image: c.coverImage || undefined
                    }))}
                    placeholder="Select course..."
                    disabled={!formData.venue}
                    triggerClassName={req(formData.courseId)}
                  />
                </Field>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex items-center gap-3">
                <Info className="w-4 h-4 text-emerald-500 shrink-0" />
                <p className="text-[12px] font-medium text-emerald-700">
                  Note: You will only see golf courses available in <strong>{countryOptions.find(c => c.value === formData.venue)?.label || "the selected country"}</strong>.
                </p>
              </div>

              <div className="pt-1">
                <Field label="Organizer" required>
                  <SearchableSelect value={formData.clubId} onValueChange={handleClubChange}
                    options={organizers.map((o) => ({ value: o.id, label: o.name }))} placeholder="Select organizer..." triggerClassName={req(formData.clubId)} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Tournament Banner" required>
                  <div className="relative">
                    {formData.bannerPreview ? (
                      <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 h-40">
                        <img src={formData.bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                        <button onClick={() => { set("bannerPreview", ""); set("bannerUrl", ""); }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
                          Compressed to ≤50KB
                        </div>
                      </div>
                    ) : (
                      <div onClick={() => fileInputRef.current?.click()}
                        className={cn("h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group", req(formData.bannerUrl) || "border-gray-200")}>
                        {compressing ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-[12px] text-gray-400">Compressing image...</span>
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                              <ImageIcon className="w-5 h-5 text-gray-400 group-hover:text-emerald-500" />
                            </div>
                            <div className="text-center">
                              <p className="text-[13px] font-medium text-gray-600 group-hover:text-emerald-600">Click to upload banner</p>
                              <p className="text-[11px] text-gray-400">JPG, PNG, WebP</p>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBannerUpload(f); e.target.value = ""; }} />
                  </div>
                </Field>

                <Field label="Description" required>
                  <textarea value={formData.description} onChange={(e) => set("description", e.target.value)}
                    placeholder="Brief description of the tournament..."
                    className={cn("flex h-40 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm transition-all placeholder:text-gray-400 focus:bg-white focus:border-emerald-500 focus-visible:outline-none resize-none", req(formData.description))} />
                </Field>
              </div>
            </div>
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-gray-900">Tournament Schedule</h4>
                <p className="text-[12px] text-gray-500">Define the dates and registration window</p>
              </div>
            </div>

            <div className="p-5 space-y-6">

              {/* Radio toggle — One Day vs Multi-Day */}
              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold text-gray-600">Tournament Duration</Label>
                <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => { setIsMultiDay(false); set("endDate", ""); }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-bold transition-all",
                      !isMultiDay
                        ? "bg-[#10b981] text-white"
                        : "bg-white text-gray-500 hover:bg-gray-50",
                    )}
                  >
                    <span className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                      !isMultiDay ? "border-white bg-white" : "border-gray-300",
                    )}>
                      {!isMultiDay && <span className="w-2 h-2 rounded-full bg-[#10b981]" />}
                    </span>
                    One Day
                  </button>
                  <div className="w-px bg-gray-200" />
                  <button
                    type="button"
                    onClick={() => setIsMultiDay(true)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-bold transition-all",
                      isMultiDay
                        ? "bg-[#10b981] text-white"
                        : "bg-white text-gray-500 hover:bg-gray-50",
                    )}
                  >
                    <span className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                      isMultiDay ? "border-white bg-white" : "border-gray-300",
                    )}>
                      {isMultiDay && <span className="w-2 h-2 rounded-full bg-[#10b981]" />}
                    </span>
                    Multi-Day
                  </button>
                </div>
              </div>

              {/* Date fields — 1 or 2 columns based on duration type */}
              <div className={cn("grid gap-4", isMultiDay ? "grid-cols-2" : "grid-cols-1")}>
                <Field label={isMultiDay ? "Tournament Start Date" : "Tournament Date"} required>
                  <DatePicker
                    value={formData.startDate}
                    onValueChange={(v) => {
                      set("startDate", v);
                      // Clear end date if it's no longer strictly after the new start
                      if (formData.endDate && formData.endDate <= v) set("endDate", "");
                      // Clear registration dates that fall on or after the new start date
                      if (formData.registrationOpenAt && formData.registrationOpenAt >= v) set("registrationOpenAt", "");
                      if (formData.registrationCloseAt && formData.registrationCloseAt >= v) set("registrationCloseAt", "");
                    }}
                    buttonClassName={req(formData.startDate)}
                    disablePast
                    disableToday
                  />
                </Field>
                {isMultiDay && (
                  <Field label="Tournament End Date" required>
                    <DatePicker
                      value={formData.endDate}
                      onValueChange={(v) => set("endDate", v)}
                      minDate={formData.startDate ? shiftDate(formData.startDate, 1) : undefined}
                      buttonClassName={req(formData.endDate)}
                      disabled={!formData.startDate}
                    />
                  </Field>
                )}
              </div>

              {/* Registration dates */}
              <div className="space-y-1.5">

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Registration Opens" required>
                    <DatePicker
                      value={formData.registrationOpenAt}
                      onValueChange={(v) => {
                        set("registrationOpenAt", v);
                        // Clear close date if it's now before the new open date + 1 day
                        const minCloseDate = v ? shiftDate(v, 1) : "";
                        if (formData.registrationCloseAt && (!minCloseDate || formData.registrationCloseAt < minCloseDate)) {
                          set("registrationCloseAt", "");
                        }
                      }}
                      disablePast
                      maxDate={formData.startDate ? shiftDate(formData.startDate, -1) : undefined}
                      buttonClassName={req(formData.registrationOpenAt)}
                      disabled={!formData.startDate}
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      The date players can start signing up.
                    </p>
                  </Field>
                  <Field label="Registration Closes" required>
                    <DatePicker
                      value={formData.registrationCloseAt}
                      onValueChange={(v) => set("registrationCloseAt", v)}
                      minDate={formData.registrationOpenAt ? shiftDate(formData.registrationOpenAt, 1) : undefined}
                      maxDate={formData.startDate ? shiftDate(formData.startDate, -1) : undefined}
                      buttonClassName={req(formData.registrationCloseAt)}
                      disabled={!formData.registrationOpenAt}
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Deadline for players to register — must be before the tournament starts.
                    </p>
                  </Field>
                </div>
              </div>

            </div>
          </div>
        </div>
      );
      case 3: return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <ListOrdered className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-gray-900">Format & Rules</h4>
                <p className="text-[12px] text-gray-500">Configure how the tournament will be played and scored</p>
              </div>
            </div>

            <div className="p-5 space-y-6">

              {/* ── Tournament Format ── */}
              <div className="space-y-2">
                <p className="text-[13px] font-semibold text-gray-600">Tournament Format <span className="text-red-500">*</span></p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    {
                      value: "STROKE_PLAY",
                      label: "Stroke Play",
                      icon: "🏌️",
                      desc: "Each player counts every stroke over the full round. Lowest total wins. The standard format used in most professional and amateur tournaments.",
                    },
                    {
                      value: "STABLEFORD",
                      label: "Stableford",
                      icon: "⭐",
                      desc: "Players earn points based on their score relative to par on each hole (e.g. 2pts for par, 3pts for birdie). Highest total points wins. Encourages risk-taking.",
                    },
                    {
                      value: "MATCH_PLAY",
                      label: "Match Play",
                      icon: "⚔️",
                      desc: "Two players (or teams) compete hole-by-hole. Whoever wins the most holes wins the match. Score on previous holes doesn't carry forward.",
                    },
                    {
                      value: "SCRAMBLE",
                      label: "Scramble",
                      icon: "🤝",
                      desc: "All team members tee off, the best shot is selected, and everyone plays their next shot from that spot. Continues until holed. Great for team events and charity days.",
                    },
                    {
                      value: "BEST_BALL",
                      label: "Best Ball",
                      icon: "🥇",
                      desc: "Each player plays their own ball throughout. The team's score for each hole is the lowest (best) individual score recorded. Also called Four-Ball in match play.",
                    },
                  ].map(({ value, label, icon, desc }) => {
                    const active = formData.format === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => set("format", value)}
                        className={cn(
                          "w-full text-left rounded-xl border-2 px-4 py-3 flex items-start gap-3 transition-all",
                          active
                            ? "border-emerald-500 bg-emerald-50/60"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                          active ? "border-emerald-500 bg-emerald-500" : "border-gray-300"
                        )}>
                          {active && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-base leading-none">{icon}</span>
                            <span className={cn("text-[14px] font-bold", active ? "text-emerald-700" : "text-gray-800")}>{label}</span>
                          </div>
                          <p className="text-[12px] text-gray-500 mt-1 leading-snug">{desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* ── Scoring Type ── */}
                <div className="space-y-2">
                  <p className="text-[13px] font-semibold text-gray-600">Scoring Type <span className="text-red-500">*</span></p>
                  <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                    {[
                      { value: "GROSS", label: "Gross", desc: "Actual strokes" },
                      { value: "NET", label: "Net", desc: "After handicap" },
                    ].map(({ value, label, desc }) => {
                      const active = formData.scoringType === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => set("scoringType", value)}
                          className={cn(
                            "flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-[13px] font-bold transition-all",
                            active ? "bg-[#10b981] text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                          )}
                        >
                          {label}
                          <span className={cn("text-[10px] font-normal", active ? "text-emerald-100" : "text-gray-400")}>{desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Number of Holes ── */}
                <div>
                  <Field label="Holes Per Round (Daily)" required>
                    <Input type="number" value={formData.holes} min={1} max={18} onChange={(e) => set("holes", Number(e.target.value))} />
                  </Field>
                  <p className="text-[11px] text-gray-400 mt-1.5 leading-tight">
                    For multi-day events, this is the number of holes played <span className="font-medium text-gray-600">per day</span>.
                  </p>
                </div>
              </div>

              {/* ── Divisions ── */}
              <div className="space-y-2">
                <p className="text-[13px] font-semibold text-gray-600">Divisions <span className="text-red-500">*</span></p>
                <p className="text-[11px] text-gray-400">Select common divisions or type a custom one and press Enter.</p>
                {/* Preset chip buttons */}
                <div className="flex flex-wrap gap-2">
                  {["Men", "Ladies", "Juniors", "Seniors", "Professionals", "Amateurs", "Mixed"].map((preset) => {
                    const selected = formData.divisions.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          if (selected) {
                            set("divisions", formData.divisions.filter((d) => d !== preset));
                          } else {
                            set("divisions", [...formData.divisions, preset]);
                          }
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-[12px] font-bold border-2 transition-all",
                          selected
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-200"
                            : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-600"
                        )}
                      >
                        {selected ? "✓ " : ""}{preset}
                      </button>
                    );
                  })}
                </div>
                {/* Custom division input */}
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Add custom division..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val && !formData.divisions.includes(val)) {
                          set("divisions", [...formData.divisions, val]);
                        }
                        (e.target as HTMLInputElement).value = "";
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="px-4 h-10 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[13px] font-bold rounded-xl transition-colors whitespace-nowrap"
                    onClick={(e) => {
                      const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                      const val = input.value.trim();
                      if (val && !formData.divisions.includes(val)) {
                        set("divisions", [...formData.divisions, val]);
                        input.value = "";
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
                {/* Selected divisions as removable chips */}
                {formData.divisions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {formData.divisions.map((d) => (
                      <span
                        key={d}
                        className="flex items-center gap-1.5 text-[12px] font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200"
                      >
                        {d}
                        <button
                          type="button"
                          onClick={() => set("divisions", formData.divisions.filter((x) => x !== d))}
                          className="w-3.5 h-3.5 rounded-full bg-emerald-200 hover:bg-emerald-300 flex items-center justify-center text-emerald-700 transition-colors leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );

      case 4: return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">

          {/* ── Player Limits ── */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-gray-900">Player Capacity</h4>
                <p className="text-[12px] text-gray-500">Set limits on how many people can join</p>
              </div>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Field label="Max Total Players">
                    <Input type="number" value={formData.maxPlayers} placeholder="e.g. 144" onChange={(e) => set("maxPlayers", e.target.value)} />
                  </Field>
                  <p className="text-[11px] text-gray-400 mt-1.5 leading-tight">Leave empty for unlimited players.</p>
                </div>
                <Field label="Players Per Group" required>
                  <Input type="number" value={formData.maxPlayersPerGroup} min={1} onChange={(e) => set("maxPlayersPerGroup", Number(e.target.value))} />
                </Field>
              </div>

              <div className={cn("rounded-xl border-2 p-3.5 cursor-pointer transition-all", formData.enableWaitlist ? "border-emerald-400 bg-emerald-50/50" : "border-gray-200 bg-gray-50/50 hover:bg-gray-100/50")}
                onClick={() => set("enableWaitlist", !formData.enableWaitlist)}>
                <div className="flex items-center gap-3">
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors", formData.enableWaitlist ? "border-emerald-500 bg-emerald-500" : "border-gray-300 bg-white")}>
                    {formData.enableWaitlist && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-gray-900">Enable Waitlist</p>
                    <p className="text-[11px] text-gray-500 leading-snug mt-0.5">Allow players to join a queue if the tournament reaches max capacity.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Handicap Restrictions ── */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex items-center justify-between cursor-pointer"
              onClick={() => set("hasHandicapRestriction", !formData.hasHandicapRestriction)}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-gray-900">Handicap Restrictions</h4>
                  <p className="text-[12px] text-gray-500">Restrict entry based on player skill level</p>
                </div>
              </div>
              <div className={cn("relative w-11 h-6 rounded-full transition-colors flex-shrink-0", formData.hasHandicapRestriction ? "bg-emerald-500" : "bg-gray-200")}>
                <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all", formData.hasHandicapRestriction ? "left-6" : "left-1")} />
              </div>
            </div>

            {formData.hasHandicapRestriction && (
              <div className="p-5 bg-emerald-50/30 border-t-2 border-emerald-100 animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Minimum Handicap" required>
                    <Input type="number" value={formData.minHandicap} onChange={(e) => set("minHandicap", e.target.value)} placeholder="0" className="bg-white" />
                  </Field>
                  <Field label="Maximum Handicap" required>
                    <Input type="number" value={formData.maxHandicap} onChange={(e) => set("maxHandicap", e.target.value)} placeholder="54" className="bg-white" />
                  </Field>
                </div>
                <p className="text-[11px] text-emerald-600 font-medium mt-3 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  Only players with a handicap within this range will be allowed to register.
                </p>
              </div>
            )}
          </div>

        </div>
      );
      case 5: return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-gray-900">Registration Fees</h4>
                <p className="text-[12px] text-gray-500">Configure entry fees</p>
              </div>
            </div>

            <div className="p-5 space-y-6">
              <Toggle label="Requires Payment?" checked={formData.requiresPayment} onChange={(v) => set("requiresPayment", v)} />
              {formData.requiresPayment && (
                <div className="space-y-4 pl-4 border-l-2 border-emerald-200 animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Entry Fee" required>
                      <Input
                        type="text"
                        value={formData.entryFee ? Number(formData.entryFee).toLocaleString("en-US") : ""}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/\D/g, "");
                          set("entryFee", rawValue);
                        }}
                        placeholder="5,000"
                        className={req(formData.entryFee)}
                      />
                    </Field>
                    <Field label="Currency" required>
                      <Input value={formData.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} placeholder="NGN" />
                    </Field>
                  </div>
                  <Toggle label="Refundable Entry Fee?" checked={formData.isRefundable} onChange={(v) => set("isRefundable", v)} />
                  <p className="text-[11px] text-emerald-600 font-medium mt-3 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Players must complete payment during registration to secure their spot.
                  </p>
                </div>
              )}
              {!formData.requiresPayment && (
                <div className="py-8 text-center bg-gray-50 rounded-xl border border-gray-100 animate-in fade-in">
                  <p className="text-[13px] font-medium text-gray-500">This tournament will be free to enter.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
      case 6: return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 bg-emerald-50/50 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-gray-900">Tee Off Date on {formatFriendlyDate(formData.startDate)}</h4>
                  <p className="text-[12px] text-gray-500">Automatically group players into sequential tee times</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">Required</span>
                <div className={cn("relative w-11 h-6 rounded-full transition-colors flex-shrink-0 bg-emerald-500")}>
                  <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all left-6")} />
                </div>
              </div>
            </div>

            <div className="p-5 bg-emerald-50/30 border-t-2 border-emerald-100 animate-in slide-in-from-top-2 fade-in duration-200">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Tee Off Start Time" required>
                  <TimePicker
                    value={formData.teeStartTime}
                    onValueChange={(v) => set("teeStartTime", v)}
                    placeholder="--:--  "
                  />
                </Field>
                <Field label="Tee Interval (min)" required>
                  <Input type="number" value={formData.teeIntervalMinutes} min={1} onChange={(e) => set("teeIntervalMinutes", Number(e.target.value))} className="bg-white" />
                </Field>
              </div>
              <p className="text-[11px] text-emerald-600 font-medium mt-3 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Players will be assigned sequential tee times based on these settings.
              </p>
            </div>
          </div>
        </div>
      );
      case 7: return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-gray-900">Scoring Rules</h4>
                <p className="text-[12px] text-gray-500">Configure how scores are recorded and verified</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <Toggle label="Enable Live Scoring" checked={formData.enableLiveScoring} onChange={(v) => set("enableLiveScoring", v)} />
              <div className="pl-12">
                <p className="text-[12px] text-gray-500 -mt-2 mb-2">Players can input scores directly via the app during the round.</p>
              </div>

              <Toggle label="Require Marker Verification" checked={formData.requireMarkerVerification} onChange={(v) => set("requireMarkerVerification", v)} />
              <div className="pl-12">
                <p className="text-[12px] text-gray-500 -mt-2 mb-2">Another player in the group must verify and sign the scorecard.</p>
              </div>

              <Toggle label="Enable Hole-by-Hole Scoring" checked={formData.enableHoleScoring} onChange={(v) => set("enableHoleScoring", v)} />
              <div className="pl-12">
                <p className="text-[12px] text-gray-500 -mt-2">Record scores for every single hole rather than just the final total.</p>
              </div>
            </div>
          </div>
        </div>
      );
      case 8: return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* ── Visibility Settings ── */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-gray-900">Visibility Status</h4>
                <p className="text-[12px] text-gray-500">Control who can see and discover this tournament</p>
              </div>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 gap-3">
                {[
                  { value: "PUBLIC", label: "Public", desc: "Visible to everyone on the platform. Anyone can search for and view this tournament." },
                  { value: "PRIVATE", label: "Private", desc: "Hidden from search results and public listings. Only accessible via a direct link." },
                  { value: "INVITE_ONLY", label: "Invite Only/Closed Tournament", desc: "Strictly restricted. Only specifically invited players can view and register." }
                ].map(({ value, label, desc }) => {
                  const active = formData.visibility === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set("visibility", value)}
                      className={cn(
                        "w-full text-left rounded-xl border-2 px-4 py-3 flex items-start gap-3 transition-all",
                        active ? "border-emerald-500 bg-emerald-50/60" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                      )}
                    >
                      <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5", active ? "border-emerald-500 bg-emerald-500" : "border-gray-300")}>
                        {active && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={cn("text-[14px] font-bold", active ? "text-emerald-700" : "text-gray-800")}>{label}</span>
                        <p className="text-[12px] text-gray-500 mt-0.5 leading-snug">{desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Publishing ── */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className={cn("px-5 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex items-center justify-between", (originalStatus !== "DRAFT" && originalStatus !== undefined) ? "opacity-75 cursor-not-allowed" : "cursor-pointer")}
              onClick={() => {
                if (originalStatus !== "DRAFT" && originalStatus !== undefined) return;
                set("publishImmediately", !formData.publishImmediately);
              }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-gray-900">Publish Immediately</h4>
                  <p className="text-[12px] text-gray-500">Make the tournament active and open for registration</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(originalStatus !== "DRAFT" && originalStatus !== undefined) && (
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase">Published</span>
                )}
                <div className={cn("relative w-11 h-6 rounded-full transition-colors flex-shrink-0", formData.publishImmediately ? "bg-emerald-500" : "bg-gray-200")}>
                  <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all", formData.publishImmediately ? "left-6" : "left-1")} />
                </div>
              </div>
            </div>

            {!formData.publishImmediately && (
              <div className="p-4 bg-emerald-50/40 border-t-2 border-emerald-100/50">
                <p className="text-[11px] text-emerald-700 font-medium text-center leading-relaxed">
                  This tournament will be saved as an unpublished <strong>DRAFT</strong>.<br className="hidden sm:block" /> Players cannot see or register for it until you manually publish it.
                </p>
              </div>
            )}
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tournamentId ? "Edit Tournament" : "Create Tournament"}
      className="max-w-4xl"
      footer={
        <div className="flex justify-between w-full">
          <Button variant="outline" onClick={handleBack} disabled={step === 1 || loading}>Back</Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading || nameCheckLoading}>Cancel</Button>
            {step < STEPS.length
              ? <Button onClick={handleNext} disabled={nameCheckLoading} className="bg-[#10b981] hover:bg-[#0da673] text-white px-6">
                {nameCheckLoading ? "Checking..." : "Next →"}
              </Button>
              : <Button onClick={handleSubmitClick} disabled={loading} className="bg-[#10b981] hover:bg-[#0da673] text-white px-6">
                {loading ? (tournamentId ? "Updating..." : "Creating...") : (tournamentId ? "Update Tournament" : "Create Tournament")}
              </Button>
            }
          </div>
        </div>
      }>
      <div className="flex gap-1 border-b border-gray-100 pb-4 mb-6 overflow-x-auto no-scrollbar">
        {STEPS.map((name, i) => {
          const active = step === i + 1, past = step > i + 1;
          return (
            <div key={i} className="flex flex-col items-center flex-1 gap-1 min-w-[60px]">
              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300",
                active ? "bg-[#10b981] text-white shadow-sm ring-4 ring-emerald-50" : past ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400")}>
                {past ? "✓" : i + 1}
              </div>
              <span className={cn("text-[9px] font-bold uppercase tracking-wide text-center leading-tight transition-colors",
                active ? "text-gray-900" : "text-gray-400")}>{name}</span>
            </div>
          );
        })}
      </div>

      <div className="min-h-[350px]">
        {loading ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-6">
              <div className="space-y-2">
                <div className="h-4.5 w-32 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-12 w-full bg-gray-50/50 rounded-xl border border-gray-100 animate-pulse" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-4.5 w-24 bg-gray-100 rounded-lg animate-pulse" />
                  <div className="h-12 w-full bg-gray-50/50 rounded-xl border border-gray-100 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-4.5 w-24 bg-gray-100 rounded-lg animate-pulse" />
                  <div className="h-12 w-full bg-gray-50/50 rounded-xl border border-gray-100 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4.5 w-28 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-32 w-full bg-gray-50/50 rounded-xl border border-gray-100 animate-pulse" />
              </div>
            </div>
          </div>
        ) : stepContent()}
      </div>

      {showPublishConfirm && (
        <Modal isOpen={showPublishConfirm} onClose={() => setShowPublishConfirm(false)} title="Confirm Publishing" className="max-w-md z-[100]">
          <div className="space-y-4 py-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-[#10b981] mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h4 className="text-lg font-bold text-gray-900">Publish Tournament?</h4>
              <p className="text-sm text-gray-500">
                Once a tournament is published, it becomes visible to players and the action is <strong className="text-gray-900">irreversible</strong>. Are you sure you want to proceed?
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowPublishConfirm(false)} disabled={loading}>Cancel</Button>
              <Button className="flex-1 bg-[#10b981] hover:bg-[#0da673] text-white" onClick={() => { setShowPublishConfirm(false); handleSubmit(); }} disabled={loading}>
                {loading ? "Publishing..." : "Yes, Publish"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
}
