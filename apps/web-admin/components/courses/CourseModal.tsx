"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { Country, State } from "country-state-city";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ImageIcon, X } from "lucide-react";
import { Course, createCourse, updateCourse } from "@/lib/api/courses";

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  course?: Course | null;
}

const COURSE_TYPES = [
  { value: "Parkland", label: "Parkland" },
  { value: "Links", label: "Links" },
  { value: "Desert", label: "Desert" },
  { value: "Heathland", label: "Heathland" },
  { value: "Sandbelt", label: "Sandbelt" },
];

const DEFAULT_FORM = {
  name: "",
  location: "",
  city: "",
  state: "",
  country: "NG",
  holes: 18,
  par: 72,
  type: "Parkland",
  status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  bannerUrl: "",
};

export function CourseModal({ isOpen, onClose, onSuccess, course }: CourseModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ ...DEFAULT_FORM });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (course) {
        setFormData({
          name: course.name,
          location: course.location,
          city: course.city,
          state: course.state,
          country: course.country || "NG",
          holes: course.holes,
          par: course.par,
          type: course.type,
          status: course.status,
          bannerUrl: course.bannerUrl || "",
        });
      } else {
        setFormData({ ...DEFAULT_FORM });
      }
    }
  }, [isOpen, course]);

  const set = (field: string, value: any) => setFormData((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Course name is required");
      return;
    }
    setLoading(true);
    try {
      if (course) {
        await updateCourse(course.id, formData);
        toast.success("Course updated successfully");
      } else {
        await createCourse(formData);
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

  const countryOptions = Country.getAllCountries().map((c) => ({ value: c.isoCode, label: c.name }));
  const stateOptions = formData.country
    ? State.getStatesOfCountry(formData.country).map((s) => ({ value: s.isoCode, label: s.name }))
    : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={course ? "Edit Golf Course" : "Add Golf Course"}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Course Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Ikoyi Club 1938"
              />
            </div>

            <div className="space-y-2">
              <Label>Country</Label>
              <SearchableSelect
                value={formData.country}
                onValueChange={(v) => {
                  set("country", v);
                  set("state", "");
                }}
                options={countryOptions}
                placeholder="Select country"
              />
            </div>

            <div className="space-y-2">
              <Label>State / Province</Label>
              <SearchableSelect
                value={formData.state}
                onValueChange={(v) => set("state", v)}
                options={stateOptions}
                placeholder="Select state"
                disabled={!formData.country}
              />
            </div>

            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="e.g. Lagos"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Holes</Label>
                <Input
                  type="number"
                  value={formData.holes}
                  onChange={(e) => set("holes", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Par</Label>
                <Input
                  type="number"
                  value={formData.par}
                  onChange={(e) => set("par", Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Course Type</Label>
              <SearchableSelect
                value={formData.type}
                onValueChange={(v) => set("type", v)}
                options={COURSE_TYPES}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <SearchableSelect
                value={formData.status}
                onValueChange={(v) => set("status", v)}
                options={[
                  { value: "ACTIVE", label: "Active" },
                  { value: "INACTIVE", label: "Inactive" },
                ]}
              />
            </div>

            <div className="space-y-2">
              <Label>Course Image</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group"
              >
                {formData.bannerUrl ? (
                  <div className="relative w-full h-full p-2">
                    <img
                      src={formData.bannerUrl}
                      alt="Course"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        set("bannerUrl", "");
                      }}
                      className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-sm hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                    <span className="text-sm text-gray-500 group-hover:text-emerald-600 transition-colors">
                      Click to upload
                    </span>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // In a real app, upload to S3/Cloudinary and get URL
                    // For now, use base64 for demo
                    const reader = new FileReader();
                    reader.onloadend = () => set("bannerUrl", reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-[#10b981] hover:bg-[#0da673] text-white px-8"
            disabled={loading}
          >
            {loading ? "Saving..." : course ? "Update Course" : "Add Course"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
