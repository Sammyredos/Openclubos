"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { Country, State } from "country-state-city";
import { Label } from "@/components/ui/label";
import { createTournament, getTournament, updateTournament, UpdateTournamentPayload } from "@/lib/api/tournaments";
import { getOrganizers } from "@/lib/api/organizers";
import { getCourses } from "@/lib/api/courses";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Upload, X, ImageIcon } from "lucide-react";

type WizardProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tournamentId?: string | null;
};

const STEPS = ["Basic Details", "Schedule", "Format & Divisions", "Eligibility", "Payments", "Grouping", "Scoring", "Publish"];

// Compress image to target size (default 50KB) using canvas
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

      // Binary search for quality that fits under targetKB
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
  autoGrouping: false, teeStartTime: "", teeIntervalMinutes: 10,
  enableLiveScoring: false, requireMarkerVerification: false, enableHoleScoring: true,
  publishImmediately: false, visibility: "PUBLIC" as const,
};

type FormData = typeof DEFAULT_FORM;

function validateStep(step: number, f: FormData): string | null {
  if (step === 1) {
    if (!f.name.trim()) return "Tournament name is required.";
    if (!f.venue) return "Please select a country.";
    if (!f.location) return "Please select a state.";
    if (!f.clubId) return "Please select an organizer.";
    if (!f.courseId) return "Please select a golf course.";
    if (!f.bannerUrl) return "Tournament banner is required.";
    if (!f.description.trim()) return "Description is required.";
  }
  if (step === 2) {
    if (!f.startDate) return "Start date is required.";
    if (f.endDate && f.endDate < f.startDate) return "End date cannot be before start date.";
    if (f.registrationOpenAt && f.registrationCloseAt && f.registrationCloseAt < f.registrationOpenAt)
      return "Registration close date must be after open date.";
    if (f.registrationCloseAt && f.registrationCloseAt > f.startDate)
      return "Registration must close before the tournament starts.";
  }
  if (step === 4) {
    if (!f.allowRegisteredPlayers && !f.allowGuests && !f.allowExternalPlayers)
      return "At least one player type must be allowed.";
    if (f.hasHandicapRestriction) {
      if (f.minHandicap !== "" && f.maxHandicap !== "" && Number(f.minHandicap) > Number(f.maxHandicap))
        return "Minimum handicap cannot exceed maximum handicap.";
    }
  }
  if (step === 5) {
    if (f.requiresPayment && !f.entryFee) return "Entry fee is required when payment is enabled.";
    if (f.requiresPayment && Number(f.entryFee) <= 0) return "Entry fee must be greater than zero.";
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
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [organizers, setOrganizers] = useState<{ id: string; name: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState<FormData>({ ...DEFAULT_FORM });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const countryOptions = useMemo(() => Country.getAllCountries().map(c => ({ value: c.isoCode, label: c.name })), []);
  const stateOptions = useMemo(() => formData.venue ? State.getStatesOfCountry(formData.venue).map(s => ({ value: s.name, label: s.name })) : [], [formData.venue]);

  const req = (val: any) => (showValidation && !val ? "border-red-400 bg-red-50/30" : "");

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setShowValidation(false);
      setFormData({ ...DEFAULT_FORM });
      getOrganizers()
        .then((d: any[]) => {
          if (Array.isArray(d)) setOrganizers(d.map((o) => ({ id: o.id, name: o.name })));
        })
        .catch(() => {});

      if (tournamentId) {
        setLoading(true);
        getTournament(tournamentId)
          .then((t) => {
            setFormData({
              name: t.name || "",
              clubId: t.clubId || "",
              courseId: t.courseId || "",
              bannerUrl: t.bannerUrl || "",
              bannerPreview: t.bannerUrl || "",
              description: t.description || "",
              venue: t.venue || "NG",
              location: t.location || "",
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
              publishImmediately: t.status === "REGISTRATION_OPEN",
              visibility: t.visibility || "PUBLIC",
            });
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

  useEffect(() => {
    if (formData.clubId) {
      getCourses(formData.clubId).then((d: any) => {
        const list = Array.isArray(d) ? d : d.items || [];
        setCourses(list.map((c: any) => ({ id: c.id, name: c.name })));
      }).catch(() => {});
    } else {
      setCourses([]);
      setFormData((p) => ({ ...p, courseId: "" }));
    }
  }, [formData.clubId]);

  const set = (field: string, value: any) => setFormData((p) => ({ ...p, [field]: value }));

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

  const handleNext = () => {
    const err = validateStep(step, formData);
    if (err) { setShowValidation(true); toast.error(err); return; }
    setShowValidation(false);
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    for (let s = 1; s <= STEPS.length; s++) {
      const err = validateStep(s, formData);
      if (err) { setShowValidation(true); toast.error(`Step ${s}: ${err}`); setStep(s); return; }
    }
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
        status: (tournamentId ? undefined : (f.publishImmediately ? "REGISTRATION_OPEN" : "DRAFT")),
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
        <div className="space-y-4">
          <Field label="Tournament Name" required>
            <Input value={formData.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Summer Classic 2026" className={req(formData.name)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Country" required>
              <SearchableSelect value={formData.venue} onValueChange={(v) => { set("venue", v); set("location", ""); }}
                options={countryOptions} placeholder="Select country..." triggerClassName={req(formData.venue)} />
            </Field>
            <Field label="State" required>
              <SearchableSelect value={formData.location} onValueChange={(v) => set("location", v)}
                options={stateOptions} placeholder="Select state..." disabled={!formData.venue} triggerClassName={req(formData.location)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Organizer" required>
              <SearchableSelect value={formData.clubId} onValueChange={(v) => set("clubId", v)}
                options={organizers.map((o) => ({ value: o.id, label: o.name }))} placeholder="Select organizer..." triggerClassName={req(formData.clubId)} />
            </Field>
            <Field label="Golf Course" required>
              <SearchableSelect value={formData.courseId} onValueChange={(v) => set("courseId", v)}
                options={courses.map((c) => ({ value: c.id, label: c.name }))} placeholder="Select course..." disabled={!formData.clubId} triggerClassName={req(formData.courseId)} />
            </Field>
          </div>
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
              className={cn("flex min-h-[80px] w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm transition-all placeholder:text-gray-400 focus:bg-white focus:border-emerald-500 focus-visible:outline-none resize-none", req(formData.description))} />
          </Field>
        </div>
      );
      case 2: return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date" required>
              <DatePicker value={formData.startDate} onValueChange={(v) => set("startDate", v)} buttonClassName={req(formData.startDate)} />
            </Field>
            <Field label="End Date">
              <DatePicker value={formData.endDate} onValueChange={(v) => set("endDate", v)} minDate={formData.startDate} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Registration Opens">
              <DatePicker value={formData.registrationOpenAt} onValueChange={(v) => set("registrationOpenAt", v)} />
            </Field>
            <Field label="Registration Closes">
              <DatePicker value={formData.registrationCloseAt} onValueChange={(v) => set("registrationCloseAt", v)} />
            </Field>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-[12px] text-blue-700">
            <strong>Note:</strong> Registration must close before the tournament start date.
          </div>
        </div>
      );
      case 3: return (
        <div className="space-y-4">
          <Field label="Tournament Format">
            <SearchableSelect value={formData.format} onValueChange={(v) => set("format", v)}
              options={[
                { value: "STROKE_PLAY", label: "Stroke Play" }, { value: "MATCH_PLAY", label: "Match Play" },
                { value: "STABLEFORD", label: "Stableford" }, { value: "SCRAMBLE", label: "Scramble" },
                { value: "BEST_BALL", label: "Best Ball" },
              ]} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Scoring Type">
              <SearchableSelect value={formData.scoringType} onValueChange={(v) => set("scoringType", v)}
                options={[{ value: "GROSS", label: "Gross" }, { value: "NET", label: "Net" }]} />
            </Field>
            <Field label="Number of Holes">
              <Input type="number" value={formData.holes} min={1} max={18} onChange={(e) => set("holes", Number(e.target.value))} />
            </Field>
          </div>
          <Field label="Divisions (comma separated)">
            <Input value={formData.divisions.join(", ")}
              onChange={(e) => set("divisions", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
              placeholder="Men, Ladies, Juniors, Seniors, Professionals" />
            {formData.divisions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.divisions.map((d) => (
                  <span key={d} className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100">{d}</span>
                ))}
              </div>
            )}
          </Field>
        </div>
      );
      case 4: return (
        <div className="space-y-5">
          <div>
            <p className="text-[13px] font-semibold text-gray-600 mb-3">Allowed Player Types <span className="text-red-500">*</span></p>
            <div className="space-y-3">
              <Toggle label="Registered Club Members" checked={formData.allowRegisteredPlayers} onChange={(v) => set("allowRegisteredPlayers", v)} />
              <Toggle label="Guest Players" checked={formData.allowGuests} onChange={(v) => set("allowGuests", v)} />
              <Toggle label="External Players" checked={formData.allowExternalPlayers} onChange={(v) => set("allowExternalPlayers", v)} />
            </div>
          </div>
          <hr />
          <Toggle label="Require Handicap Restriction?" checked={formData.hasHandicapRestriction} onChange={(v) => set("hasHandicapRestriction", v)} />
          {formData.hasHandicapRestriction && (
            <div className="grid grid-cols-2 gap-4 pl-2 border-l-2 border-emerald-200">
              <Field label="Min Handicap">
                <Input type="number" value={formData.minHandicap} onChange={(e) => set("minHandicap", e.target.value)} placeholder="0" />
              </Field>
              <Field label="Max Handicap">
                <Input type="number" value={formData.maxHandicap} onChange={(e) => set("maxHandicap", e.target.value)} placeholder="54" />
              </Field>
            </div>
          )}
          <hr />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Max Players">
              <Input type="number" value={formData.maxPlayers} placeholder="Unlimited" onChange={(e) => set("maxPlayers", e.target.value)} />
            </Field>
            <Field label="Max Per Group">
              <Input type="number" value={formData.maxPlayersPerGroup} min={1} onChange={(e) => set("maxPlayersPerGroup", Number(e.target.value))} />
            </Field>
          </div>
          <Toggle label="Enable Waitlist" checked={formData.enableWaitlist} onChange={(v) => set("enableWaitlist", v)} />
        </div>
      );
      case 5: return (
        <div className="space-y-5">
          <Toggle label="Requires Payment?" checked={formData.requiresPayment} onChange={(v) => set("requiresPayment", v)} />
          {formData.requiresPayment && (
            <div className="space-y-4 pl-2 border-l-2 border-emerald-200">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Entry Fee" required>
                  <Input type="number" value={formData.entryFee} onChange={(e) => set("entryFee", e.target.value)} placeholder="5000" className={req(formData.entryFee)} />
                </Field>
                <Field label="Currency">
                  <Input value={formData.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} placeholder="NGN" />
                </Field>
              </div>
              <Field label="Payment Deadline">
                <DatePicker value={formData.paymentDeadline} onValueChange={(v) => set("paymentDeadline", v)} />
              </Field>
              <Toggle label="Refundable Entry Fee?" checked={formData.isRefundable} onChange={(v) => set("isRefundable", v)} />
            </div>
          )}
          {!formData.requiresPayment && (
            <div className="py-8 text-center text-gray-400">
              <p className="text-sm">This tournament will be free to enter.</p>
            </div>
          )}
        </div>
      );
      case 6: return (
        <div className="space-y-5">
          <Toggle label="Auto-Generate Groups?" checked={formData.autoGrouping} onChange={(v) => set("autoGrouping", v)} />
          {formData.autoGrouping && (
            <div className="grid grid-cols-2 gap-4 pl-2 border-l-2 border-emerald-200">
              <Field label="Tee Start Time">
                <Input type="time" value={formData.teeStartTime} onChange={(e) => set("teeStartTime", e.target.value)} />
              </Field>
              <Field label="Tee Interval (min)">
                <Input type="number" value={formData.teeIntervalMinutes} min={1} onChange={(e) => set("teeIntervalMinutes", Number(e.target.value))} />
              </Field>
            </div>
          )}
        </div>
      );
      case 7: return (
        <div className="space-y-4">
          <Toggle label="Enable Live Scoring" checked={formData.enableLiveScoring} onChange={(v) => set("enableLiveScoring", v)} />
          <Toggle label="Require Marker Verification" checked={formData.requireMarkerVerification} onChange={(v) => set("requireMarkerVerification", v)} />
          <Toggle label="Enable Hole-by-Hole Scoring" checked={formData.enableHoleScoring} onChange={(v) => set("enableHoleScoring", v)} />
        </div>
      );
      case 8: return (
        <div className="space-y-5">
          <Field label="Visibility">
            <SearchableSelect value={formData.visibility} onValueChange={(v) => set("visibility", v)}
              options={[{ value: "PUBLIC", label: "Public" }, { value: "PRIVATE", label: "Private" }, { value: "INVITE_ONLY", label: "Invite Only" }]} />
          </Field>
          <div className={cn("rounded-xl border-2 p-4 cursor-pointer transition-all", formData.publishImmediately ? "border-emerald-400 bg-emerald-50" : "border-gray-200 bg-gray-50/50")}
            onClick={() => set("publishImmediately", !formData.publishImmediately)}>
            <div className="flex items-center gap-3">
              <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0", formData.publishImmediately ? "border-emerald-500 bg-emerald-500" : "border-gray-300")}>
                {formData.publishImmediately && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <div>
                <p className="text-[14px] font-bold text-gray-900">Publish Immediately</p>
                <p className="text-[12px] text-gray-500">Status will be set to Registration Open. Players can register right away.</p>
              </div>
            </div>
          </div>
          {!formData.publishImmediately && (
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
              <p className="text-[13px] text-gray-500 text-center">Tournament will be saved as <strong>Draft</strong> and can be published later.</p>
            </div>
          )}
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
            <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            {step < STEPS.length
              ? <Button onClick={handleNext} className="bg-[#10b981] hover:bg-[#0da673] text-white px-6">Next →</Button>
              : <Button onClick={handleSubmit} disabled={loading} className="bg-[#10b981] hover:bg-[#0da673] text-white px-6">
                {loading ? (tournamentId ? "Updating..." : "Creating...") : (tournamentId ? "Update Tournament" : "Create Tournament")}
              </Button>
            }
          </div>
        </div>
      }>
      {/* Step indicators */}
      <div className="flex gap-1 border-b border-gray-100 pb-4 mb-6 overflow-x-auto">
        {STEPS.map((name, i) => {
          const active = step === i + 1, past = step > i + 1;
          return (
            <div key={i} className="flex flex-col items-center flex-1 gap-1 min-w-[60px]">
              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors",
                active ? "bg-[#10b981] text-white" : past ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400")}>
                {past ? "✓" : i + 1}
              </div>
              <span className={cn("text-[9px] font-semibold uppercase tracking-wide text-center leading-tight",
                active ? "text-gray-900" : "text-gray-400")}>{name}</span>
            </div>
          );
        })}
      </div>

      <div className="min-h-[280px]">
        <h3 className="text-base font-bold text-gray-900 mb-4">{STEPS[step - 1]}</h3>
        {stepContent()}
      </div>
    </Modal>
  );
}
