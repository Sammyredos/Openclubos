"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { Country, State } from "country-state-city";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ImageIcon, X, Plus, Trash2, Check, Globe, Phone, Mail, Link as LinkIcon, Info, Map as MapIcon, Navigation, Target, Mountain, Flag, Trophy } from "lucide-react";
import { createCourse, updateCourse, getCourse, TeeBox } from "@/lib/api/courses";
import { getNigerianStates, getNigerianLGAs } from "@/lib/nigerian-states-lgas";

interface HoleDetail {
  number: number;
  par: number;
  index: number;
  distance: number;
}

interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courseId?: string | null;
}

const STEPS = ["General", "Specifications", "Amenities", "Tee Boxes", "Hole Details", "Branding & Status"];

const COURSE_TYPES = [
  { value: "Parkland", label: "Parkland", desc: "Inland courses with lots of trees and lush fairways." },
  { value: "Links", label: "Links", desc: "Coastal courses with sandy soil, rolling dunes, and few trees." },
  { value: "Desert", label: "Desert", desc: "Courses built in arid regions with natural sand and manicured grass." },
  { value: "Heathland", label: "Heathland", desc: "Inland courses featuring heather, gorse, and sandy soil." },
  { value: "Sandbelt", label: "Sandbelt", desc: "Courses with sandy subsoil and distinctive, deep bunkering." },
];

const AMENITIES = [
  "Driving Range", "Practice Green", "Club House", "Pro Shop", 
  "Restaurant / Bar", "Changing Room", "Caddies Available", "Golf Cart", "Other"
];

const DEFAULT_FORM = {
  name: "",
  alsoKnownAs: "",
  clubId: "",
  type: "Parkland",
  country: "NG",
  state: "",
  city: "",
  address: "",
  latitude: "",
  longitude: "",
  holes: 18,
  par: 72,
  yearEstablished: "",
  courseRating: "",
  slopeRating: "",
  phone: "",
  email: "",
  website: "",
  bookingUrl: "",
  amenities: [] as string[],
  coverImage: "",
  galleryImages: [] as string[],
  status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  isFeatured: false,
  teeBoxes: [] as TeeBox[],
  holeDetails: [] as HoleDetail[],
};

type FormData = typeof DEFAULT_FORM;

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

const Field = ({ label, required, children, error }: { label: string; required?: boolean; children: React.ReactNode; error?: string }) => (
  <div className="space-y-1.5">
    <Label className="text-[13px] font-semibold text-gray-600">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
    {children}
    {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
  </div>
);

export function CreateCourseWizard({ isOpen, onClose, onSuccess, courseId }: WizardProps) {
  const [step, setStep] = useState(1);
  const [showValidation, setShowValidation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const countryOptions = useMemo(() => Country.getAllCountries().map(c => ({ value: c.isoCode, label: c.name })), []);
  const stateOptions = useMemo(() => {
    if (!formData.country) return [];
    if (formData.country === "NG") {
      return getNigerianStates();
    }
    return State.getStatesOfCountry(formData.country).map(s => ({ value: s.isoCode, label: s.name }));
  }, [formData.country]);
  const lgaOptions = useMemo(() => {
    if (!formData.country || !formData.state) return [];
    if (formData.country === "NG") {
      return getNigerianLGAs(formData.state);
    }
    return [];
  }, [formData.country, formData.state]);

  const req = (val: any) => (showValidation && !val ? "border-red-400 bg-red-50/30" : "");

  // Auto-calculate Par
  const calculatedPar = useMemo(() => {
    if (!formData.holeDetails.length) return 0;
    return formData.holeDetails.reduce((sum, hole) => sum + (hole.par || 0), 0);
  }, [formData.holeDetails]);

  const countryCode = useMemo(() => {
    const c = Country.getCountryByCode(formData.country);
    return (c?.phonecode || "234").replace(/^\+/, "");
  }, [formData.country]);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setShowValidation(false);
      if (courseId) {
        loadCourse(courseId);
      } else {
        setFormData(DEFAULT_FORM);
      }
    }
  }, [isOpen, courseId]);

  // Sync holeDetails when holes count changes
  useEffect(() => {
    const count = formData.holes || 18;
    if (formData.holeDetails.length !== count) {
      const newHoles: HoleDetail[] = Array.from({ length: count }, (_, i) => {
        const existing = formData.holeDetails.find(h => h.number === i + 1);
        return existing || { number: i + 1, par: 4, index: i + 1, distance: 0 };
      });
      setFormData(prev => ({ ...prev, holeDetails: newHoles }));
    }
  }, [formData.holes, formData.holeDetails.length]);

  const loadCourse = async (id: string) => {
    setFetching(true);
    try {
      const c = await getCourse(id);
      setFormData({
        name: c.name || "",
        alsoKnownAs: c.alsoKnownAs || "",
        clubId: c.clubId || "",
        type: c.type || "Parkland",
        country: c.country || "NG",
        state: c.state || "",
        city: c.city || "",
        address: c.address || "",
        latitude: c.latitude?.toString() || "",
        longitude: c.longitude?.toString() || "",
        holes: c.holes || 18,
        par: c.par || 72,
        yearEstablished: c.yearEstablished?.toString() || "",
        courseRating: c.courseRating?.toString() || "",
        slopeRating: c.slopeRating?.toString() || "",
        phone: c.phone || "",
        email: c.email || "",
        website: c.website || "",
        bookingUrl: c.bookingUrl || "",
        amenities: c.amenities || [],
        coverImage: c.coverImage || "",
        galleryImages: c.galleryImages || [],
        status: c.status || "ACTIVE",
        isFeatured: c.isFeatured || false,
        teeBoxes: c.teeBoxes || [],
        holeDetails: (c as any).holeDetails || [],
      });

      // Strip country code from phone if it exists
      if (c.phone) {
        const phoneStr = c.phone;
        const code = Country.getCountryByCode(c.country || "NG")?.phonecode;
        if (code && phoneStr.startsWith(`+${code}`)) {
          setFormData(prev => ({ ...prev, phone: phoneStr.replace(`+${code}`, "") }));
        }
      }
    } catch (e) {
      toast.error("Failed to load course details");
      onClose();
    } finally {
      setFetching(false);
    }
  };

  const set = (field: keyof FormData, value: any) => setFormData((p) => ({ ...p, [field]: value }));

  const validateStep = (s: number) => {
    if (s === 1) {
      if (!formData.name.trim()) return "Course name is required";
      if (!formData.country) return "Country is required";
      if (!formData.state) return "State is required";
      if (!formData.city.trim()) return formData.country === "NG" ? "LGA is required" : "City is required";
      if (!formData.address.trim()) return "Full address is required";
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email) return "Email is required";
      if (!emailRegex.test(formData.email)) return "Please enter a valid email address";
      
      const phoneRegex = /^\+?[\d\s-]{8,}$/;
      if (!formData.phone) return "Phone number is required";
      if (!phoneRegex.test(formData.phone)) return "Please enter a valid phone number";
    }
    if (s === 2) {
      if (!formData.courseRating) return "Course rating is required";
      if (!formData.slopeRating) return "Slope rating is required";
      if (!formData.latitude) return "Latitude is required";
      if (!formData.longitude) return "Longitude is required";
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
    setStep((p) => Math.min(p + 1, STEPS.length));
  };

  const handleBack = () => {
    setStep((p) => Math.max(p - 1, 1));
  };

  const handleSubmit = async () => {
    const err = validateStep(step);
    if (err) {
      setShowValidation(true);
      toast.error(err);
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        phone: formData.phone ? `+${countryCode}${formData.phone.replace(/^\+/, "")}` : "",
        par: calculatedPar,
        clubId: formData.clubId || null,
        yearEstablished: formData.yearEstablished ? parseInt(formData.yearEstablished) : null,
        courseRating: formData.courseRating ? parseFloat(formData.courseRating) : null,
        slopeRating: formData.slopeRating ? parseInt(formData.slopeRating) : null,
      };

      if (courseId) {
        await updateCourse(courseId, payload);
        toast.success("Course updated successfully");
      } else {
        await createCourse(payload);
        toast.success("Course created successfully");
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to save course");
    } finally {
      setLoading(false);
    }
  };

  const addTeeBox = () => {
    set("teeBoxes", [...formData.teeBoxes, { name: "", color: "White", yardage: 0, rating: 72, slope: 113 }]);
  };

  const updateTeeBox = (index: number, field: keyof TeeBox, value: any) => {
    const newTees = [...formData.teeBoxes];
    newTees[index] = { ...newTees[index], [field]: value };
    set("teeBoxes", newTees);
  };

  const removeTeeBox = (index: number) => {
    set("teeBoxes", formData.teeBoxes.filter((_, i) => i !== index));
  };

  const updateHoleDetail = (index: number, field: keyof HoleDetail, value: any) => {
    const newHoles = [...formData.holeDetails];
    newHoles[index] = { ...newHoles[index], [field]: value };
    set("holeDetails", newHoles);
  };

  const toggleAmenity = (amenity: string) => {
    const current = formData.amenities;
    if (current.includes(amenity)) {
      set("amenities", current.filter((a) => a !== amenity));
    } else {
      set("amenities", [...current, amenity]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: "coverImage" | "galleryImages") => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (field === "coverImage") {
        set(field, reader.result as string);
      } else {
        set(field, [...formData.galleryImages, reader.result as string]);
      }
    };
    reader.readAsDataURL(file);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-gray-900">General Information</h4>
                  <p className="text-[12px] text-gray-500">Basic location and contact details</p>
                </div>
              </div>
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Course Name" required>
                    <Input value={formData.name} onChange={(e) => set("name", e.target.value)} placeholder="Enter course name" className={req(formData.name)} />
                  </Field>
                  <Field label="Also Known As">
                    <Input value={formData.alsoKnownAs} onChange={(e) => set("alsoKnownAs", e.target.value)} placeholder="e.g. Ikoyi Club 1938" />
                  </Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Course Type" required>
                    <SearchableSelect value={formData.type} onValueChange={(v) => set("type", v)} options={COURSE_TYPES} />
                    <p className="text-[12px] font-medium text-emerald-700 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50 flex items-center gap-2 mt-2">
                      <Info className="w-4 h-4 text-emerald-500 shrink-0" />
                      {COURSE_TYPES.find(t => t.value === formData.type)?.desc}
                    </p>
                  </Field>
                  <div className="grid grid-cols-2 gap-5">
                    <Field label="Country" required>
                      <SearchableSelect 
                        value={formData.country} 
                        onValueChange={(v) => { set("country", v); set("state", ""); set("city", ""); }} 
                        options={countryOptions} 
                        className={req(formData.country)}
                      />
                    </Field>
                    <Field label="State / Province" required>
                      <SearchableSelect 
                        value={formData.state} 
                        onValueChange={(v) => { set("state", v); set("city", ""); }} 
                        options={stateOptions} 
                        disabled={!formData.country} 
                        className={req(formData.state)}
                      />
                    </Field>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label={formData.country === "NG" ? "LGA" : "City"} required>
                    {formData.country === "NG" ? (
                      <SearchableSelect
                        value={formData.city}
                        onValueChange={(v) => set("city", v)}
                        options={lgaOptions}
                        disabled={!formData.state}
                        placeholder="Select LGA"
                        className={req(formData.city)}
                      />
                    ) : (
                      <Input value={formData.city} onChange={(e) => set("city", e.target.value)} placeholder="Enter city" className={req(formData.city)} />
                    )}
                  </Field>
                  <Field label="Full Address" required>
                    <Input value={formData.address} onChange={(e) => set("address", e.target.value)} placeholder="Enter full address" className={req(formData.address)} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <Field label="Phone Number" required>
                    <div className="flex gap-2">
                      <div className="h-11 px-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center text-[13px] font-bold text-gray-500 shrink-0 min-w-[60px]">
                        +{countryCode}
                      </div>
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input 
                          className={cn("pl-10 h-11", req(!formData.phone))} 
                          value={formData.phone} 
                          onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))} 
                          placeholder="812 345 6789" 
                        />
                      </div>
                    </div>
                  </Field>
                  <Field label="Email" required>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input className={cn("pl-10 h-11", req(!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)))} value={formData.email} onChange={(e) => set("email", e.target.value)} placeholder="info@club.com" />
                    </div>
                  </Field>
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-gray-900">Course Specifications</h4>
                  <p className="text-[12px] text-gray-500">Technical ratings and geographic location</p>
                </div>
              </div>
              <div className="p-5 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-5">
                    <p className="text-[13px] font-semibold text-gray-600">Technical Specs</p>
                    <div className="grid grid-cols-2 gap-5">
                      <Field label="Course Rating" required>
                        <Input value={formData.courseRating} onChange={(e) => set("courseRating", e.target.value)} placeholder="72.4" className={req(formData.courseRating)} />
                      </Field>
                      <Field label="Slope Rating" required>
                        <Input value={formData.slopeRating} onChange={(e) => set("slopeRating", e.target.value)} placeholder="128" className={req(formData.slopeRating)} />
                      </Field>
                    </div>
                    <Field label="Year Established">
                      <Input type="number" value={formData.yearEstablished} onChange={(e) => set("yearEstablished", e.target.value)} placeholder="e.g. 1938" />
                    </Field>
                    <div className="grid grid-cols-2 gap-5">
                      <Field label="Latitude" required>
                        <div className="relative">
                          <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input className={cn("pl-10", req(formData.latitude))} value={formData.latitude} onChange={(e) => set("latitude", e.target.value)} placeholder="e.g. 7.397° N" />
                        </div>
                      </Field>
                      <Field label="Longitude" required>
                        <div className="relative">
                          <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input className={cn("pl-10", req(formData.longitude))} value={formData.longitude} onChange={(e) => set("longitude", e.target.value)} placeholder="e.g. 3.873° E" />
                        </div>
                      </Field>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[13px] font-semibold text-gray-600">Location Preview</p>
                    <div className="aspect-[4/3] bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden relative group shadow-sm">
                      <div className="absolute inset-0 bg-[#f8fafc] flex items-center justify-center">
                        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-[80%] h-[80%] border border-emerald-100/50 rounded-full animate-pulse flex items-center justify-center">
                            <div className="w-[60%] h-[60%] border border-emerald-100/30 rounded-full flex items-center justify-center">
                              <div className="w-[40%] h-[40%] border border-emerald-100/20 rounded-full" />
                            </div>
                          </div>
                        </div>
                        
                        {formData.latitude && formData.longitude ? (
                          <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-500">
                            <div className="bg-white/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-emerald-100 flex flex-col items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                <Target className="w-6 h-6" />
                              </div>
                              <div className="text-center">
                                <p className="text-[13px] font-bold text-gray-900 leading-tight">{formData.name || "Course Location"}</p>
                                <div className="flex items-center justify-center gap-2 mt-1">
                                  <span className="text-[10px] font-bold text-emerald-600 px-1.5 py-0.5 bg-emerald-50 rounded-md">LAT: {formData.latitude}</span>
                                  <span className="text-[10px] font-bold text-blue-600 px-1.5 py-0.5 bg-blue-50 rounded-md">LNG: {formData.longitude}</span>
                                </div>
                              </div>
                            </div>
                            <div className="w-4 h-4 bg-white/90 rotate-45 -mt-2 shadow-lg border-b border-r border-emerald-100" />
                            
                            <div className="mt-8 flex items-center gap-3">
                              <div className="flex -space-x-2">
                                {[1,2,3].map(i => (
                                  <div key={i} className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center">
                                    <Mountain className="w-3 h-3 text-emerald-600" />
                                  </div>
                                ))}
                              </div>
                              <span className="text-[11px] font-semibold text-gray-400">Position Verified</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-3 text-gray-400 animate-pulse">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-200">
                              <MapIcon className="w-8 h-8 opacity-20" />
                            </div>
                            <span className="text-[12px] font-medium">Waiting for coordinates...</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-white/80 backdrop-blur px-3 py-2 rounded-xl border border-white/50 shadow-sm flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Live System</span>
                           </div>
                           <Globe className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500 text-center flex items-center justify-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-gray-400" />
                      Satellite confirmation pending coordinate validation.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <Field label="Website">
                    <Input value={formData.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." />
                  </Field>
                  <Field label="Booking / Reservations URL">
                    <Input value={formData.bookingUrl} onChange={(e) => set("bookingUrl", e.target.value)} placeholder="https://..." />
                  </Field>
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Mountain className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-gray-900">Facilities & Amenities</h4>
                  <p className="text-[12px] text-gray-500">What services are available at the course</p>
                </div>
              </div>
              <div className="p-5">
                <p className="text-[13px] font-semibold text-gray-600 mb-4">Select Available Amenities</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {AMENITIES.map((a) => (
                    <div 
                      key={a}
                      onClick={() => toggleAmenity(a)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                        formData.amenities.includes(a) 
                          ? "border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm" 
                          : "border-gray-200 hover:border-gray-300 text-gray-600 bg-gray-50/50"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors",
                        formData.amenities.includes(a) ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-300 bg-white"
                      )}>
                        {formData.amenities.includes(a) && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-[13px] font-medium">{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Flag className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-gray-900">Tee Boxes</h4>
                  <p className="text-[12px] text-gray-500">Configure different tee color levels</p>
                </div>
              </div>
              <div className="p-5 space-y-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[13px] font-semibold text-gray-600">Course Tee Boxes</p>
                  <Button type="button" variant="outline" size="sm" onClick={addTeeBox} className="h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50 px-3">
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Tee
                  </Button>
                </div>
                
                {formData.teeBoxes.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-400 text-[13px]">No tee boxes added yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.teeBoxes.map((tb, i) => (
                      <div key={i} className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm space-y-4 relative">
                        <button onClick={() => removeTeeBox(i)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pr-8">
                          <Field label="Tee Name">
                            <Input className="h-9" value={tb.name} onChange={(e) => updateTeeBox(i, "name", e.target.value)} placeholder="e.g. Pro" />
                          </Field>
                          <Field label="Color">
                            <SearchableSelect value={tb.color} onValueChange={(v) => updateTeeBox(i, "color", v)} options={[
                              {value: "Black", label: "Black"}, {value: "Blue", label: "Blue"}, {value: "White", label: "White"},
                              {value: "Red", label: "Red"}, {value: "Yellow", label: "Yellow"}, {value: "Gold", label: "Gold"},
                            ]} />
                          </Field>
                          <Field label="Yardage">
                            <Input type="number" className="h-9" value={tb.yardage} onChange={(e) => updateTeeBox(i, "yardage", parseInt(e.target.value))} />
                          </Field>
                          <Field label="Rating">
                            <Input type="number" className="h-9" value={tb.rating} onChange={(e) => updateTeeBox(i, "rating", parseFloat(e.target.value))} />
                          </Field>
                          <Field label="Slope">
                            <Input type="number" className="h-9" value={tb.slope} onChange={(e) => updateTeeBox(i, "slope", parseInt(e.target.value))} />
                          </Field>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-gray-900">Hole-by-Hole Details</h4>
                  <p className="text-[12px] text-gray-500">Configure par and handicap index for each hole</p>
                </div>
              </div>
              <div className="p-5 space-y-6">
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                  <p className="text-[14px] font-bold text-gray-900 text-center">How many holes does this course have?</p>
                  <div className="flex justify-center gap-3">
                    {[9, 18, 27, 36].map((count) => (
                      <button
                        key={count}
                        onClick={() => set("holes", count)}
                        className={cn(
                          "px-6 py-3 rounded-xl border-2 font-bold transition-all",
                          formData.holes === count 
                            ? "border-emerald-500 bg-white text-emerald-600 shadow-md scale-105" 
                            : "border-gray-200 bg-white text-gray-400 hover:border-gray-300"
                        )}
                      >
                        {count} Holes
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <p className="text-[13px] font-semibold text-gray-600">Per-Hole Configuration</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                      <Target className="w-3 h-3" />
                      {formData.holes} Holes
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                      <Info className="w-3 h-3" />
                      Total Par: {calculatedPar}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {formData.holeDetails.map((h, i) => (
                    <div key={i} className="p-3 rounded-xl border border-gray-100 bg-white shadow-sm space-y-3 relative group hover:border-emerald-200 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold text-gray-900 bg-gray-50 w-6 h-6 rounded-lg flex items-center justify-center border border-gray-100">
                          {h.number}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Par</label>
                          <Input 
                            type="number" 
                            className="h-8 text-[12px] px-2" 
                            value={h.par} 
                            min={3} max={5}
                            onChange={(e) => updateHoleDetail(i, "par", parseInt(e.target.value))} 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Index</label>
                          <Input 
                            type="number" 
                            className="h-8 text-[12px] px-2" 
                            value={h.index} 
                            onChange={(e) => updateHoleDetail(i, "index", parseInt(e.target.value))} 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Dist (m)</label>
                          <Input 
                            type="number" 
                            className="h-8 text-[12px] px-2" 
                            value={h.distance} 
                            onChange={(e) => updateHoleDetail(i, "distance", parseInt(e.target.value))} 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-gray-900">Branding & Status</h4>
                  <p className="text-[12px] text-gray-500">Upload images and set course visibility</p>
                </div>
              </div>
              <div className="p-5 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <p className="text-[13px] font-semibold text-gray-600">Course Branding</p>
                    <Field label="Club Logo" required>
                      <div 
                        className={cn(
                          "aspect-square w-40 mx-auto border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-emerald-50/30 overflow-hidden relative group",
                          formData.coverImage ? "border-emerald-200" : "border-gray-200 hover:border-emerald-400"
                        )}
                      >
                        {formData.coverImage ? (
                          <>
                            <img src={formData.coverImage} className="w-full h-full object-contain p-4" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                               <button onClick={() => coverInputRef.current?.click()} className="p-2 bg-white rounded-full text-emerald-600 shadow-lg hover:scale-110 transition-transform">
                                  <ImageIcon className="w-5 h-5" />
                               </button>
                               <button onClick={() => set("coverImage", "")} className="p-2 bg-white rounded-full text-red-500 shadow-lg hover:scale-110 transition-transform">
                                  <Trash2 className="w-5 h-5" />
                               </button>
                            </div>
                          </>
                        ) : (
                          <div onClick={() => coverInputRef.current?.click()} className="flex flex-col items-center gap-2 w-full h-full justify-center">
                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                              <ImageIcon className="w-6 h-6 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                            </div>
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">Upload Logo</span>
                          </div>
                        )}
                        <input ref={coverInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, "coverImage")} />
                      </div>
                    </Field>

                    <div className="space-y-2">
                      <Label className="text-[13px] font-semibold text-gray-600">Gallery (Max 4)</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {formData.galleryImages.map((img, i) => (
                          <div key={i} className="aspect-square rounded-lg overflow-hidden relative group border border-gray-100">
                            <img src={img} className="w-full h-full object-cover" />
                            <button 
                              onClick={() => set("galleryImages", formData.galleryImages.filter((_, idx) => idx !== i))}
                              className="absolute top-1 right-1 p-1 bg-white/90 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {formData.galleryImages.length < 4 && (
                          <div 
                            onClick={() => galleryInputRef.current?.click()}
                            className="aspect-square border border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <Plus className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <input ref={galleryInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, "galleryImages")} />
                    </div>
                  </div>

                  <div className="space-y-5">
                    <p className="text-[13px] font-semibold text-gray-600">Course Status</p>
                    <div className="space-y-4 pt-2">
                      <Toggle label="Course is Active" checked={formData.status === "ACTIVE"} onChange={(v) => set("status", v ? "ACTIVE" : "INACTIVE")} />
                      <Toggle label="Feature this Course" checked={formData.isFeatured} onChange={(v) => set("isFeatured", v)} />
                    </div>
                    <div className="mt-8 p-4 rounded-xl bg-blue-50 border border-blue-100 text-[12px] text-blue-700">
                      <strong>Status Info:</strong> Inactive courses will not be available for new tournaments but existing tournaments will be preserved.
                    </div>
                  </div>
                </div>
              </div>
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
      title={courseId ? "Edit Golf Course" : "Add Golf Course"}
      className="max-w-4xl"
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
                {loading ? (courseId ? "Updating..." : "Creating...") : (courseId ? "Update Course" : "Save Golf Course")}
              </Button>
            )}
          </div>
        </div>
      }
    >
      {/* Step indicators */}
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
                {past ? "✓" : i + 1}
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

      <div className="min-h-[400px]">
        {fetching ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : renderStep()}
      </div>
    </Modal>
  );
}
