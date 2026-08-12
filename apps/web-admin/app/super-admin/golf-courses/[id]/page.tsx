"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin,
  Edit2,
  Power,
  MoreHorizontal,
  Image as ImageIcon,
  Flag,
  Route,
  Award,
  Activity,
  Users,
  Building2,
  ShoppingCart,
  Utensils,
  Key,
  Car,
  CheckCircle2,
  ParkingCircle,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Trophy,
  AlertCircle,
  Trash2,
  Download,
  Ban,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getCourse, updateCourse, deleteCourse, Course } from "@/lib/api/courses";
import { Country } from "country-state-city";
import { cn, formatAddress } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { FloatingMenu } from "@/components/ui/floating-menu";
import { Input } from "@/components/ui/input";

export default function GolfCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const formatDate = (dateString: string, addDays: number = 0) => {
    const date = new Date(dateString);
    if (addDays > 0) {
      date.setDate(date.getDate() + addDays);
    }
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
  };

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState("Overview");

  // State for modals & action dropdown
  const [statusAction, setStatusAction] = useState<"activate" | "deactivate">("activate");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [mutating, setMutating] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(false);
  const [dropdownAnchorEl, setDropdownAnchorEl] = useState<HTMLButtonElement | null>(null);

  const openStatusModal = () => {
    if (!course) return;
    setStatusAction(course.status === "ACTIVE" ? "deactivate" : "activate");
    setIsStatusModalOpen(true);
    setActiveDropdown(false);
  };

  const confirmStatusChange = async () => {
    if (!course?.id) return;
    setMutating(true);
    try {
      const nextStatus = statusAction === "activate" ? "ACTIVE" : "INACTIVE";
      const updated = await updateCourse(course.id, { status: nextStatus });
      setCourse(updated);
      toast.success(statusAction === "activate" ? "Course activated" : "Course deactivated");
      setIsStatusModalOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to update course status");
    } finally {
      setMutating(false);
    }
  };

  const openDeleteModal = () => {
    setDeleteConfirmText("");
    setIsDeleteModalOpen(true);
    setActiveDropdown(false);
  };

  const confirmDelete = async () => {
    if (!course?.id) return;
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") return;
    setMutating(true);
    try {
      await deleteCourse(course.id);
      toast.success("Course deleted successfully");
      setIsDeleteModalOpen(false);
      router.push("/super-admin/golf-courses");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete course");
    } finally {
      setMutating(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getCourse(courseId);
        setCourse(data);
      } catch (e: any) {
        toast.error(e.message || "Failed to load golf course details");
        router.push("/super-admin/golf-courses");
      } finally {
        setLoading(false);
      }
    }
    if (courseId) {
      loadData();
    }
  }, [courseId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between bg-white border border-[#efefef] rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-100 rounded-xl" />
            <div className="space-y-2">
              <div className="h-5 w-48 bg-gray-100 rounded-lg" />
              <div className="h-3 w-32 bg-gray-100 rounded-lg" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-28 bg-gray-100 rounded-xl" />
            <div className="h-10 w-28 bg-gray-100 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white border border-[#efefef] rounded-xl p-4 shadow-sm space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-12 w-full bg-background rounded-xl" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="bg-white border border-[#efefef] rounded-xl p-6 shadow-sm min-h-[400px] space-y-6">
              <div className="h-5 w-32 bg-gray-100 rounded-lg" />
              <div className="h-64 w-full bg-background rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] p-6 text-center">
        <h3 className="text-[14px] font-normal text-gray-900">Golf Course Not Found</h3>
        <Button onClick={() => router.push("/super-admin/golf-courses")} className="mt-4">
          Back to Golf Courses
        </Button>
      </div>
    );
  }

  const tabs = ["Overview", "Holes", "Tee Boxes", "Amenities", "Tournaments", "Course Settings", "Activity Logs"];

  // Calculate max yards
  const maxYards = course.teeBoxes && course.teeBoxes.length > 0 
    ? Math.max(...course.teeBoxes.map(t => t.yardage)) 
    : 0;

  const formattedAddress = formatAddress(course.address, course.city, course.state, course.country);

  const getAmenityIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('range')) return <Flag className="w-4 h-4 text-openclub-800" />;
    if (n.includes('shop')) return <ShoppingCart className="w-4 h-4 text-openclub-800" />;
    if (n.includes('clubhouse')) return <Building2 className="w-4 h-4 text-openclub-800" />;
    if (n.includes('restaurant') || n.includes('food')) return <Utensils className="w-4 h-4 text-openclub-800" />;
    if (n.includes('locker')) return <Key className="w-4 h-4 text-openclub-800" />;
    if (n.includes('cart')) return <Car className="w-4 h-4 text-openclub-800" />;
    if (n.includes('practice') || n.includes('green')) return <Flag className="w-4 h-4 text-openclub-800" />;
    if (n.includes('parking')) return <ParkingCircle className="w-4 h-4 text-openclub-800" />;
    return <CheckCircle2 className="w-4 h-4 text-openclub-800" />;
  };

  return (
    <div className="space-y-6 transition-all duration-150">
      {/* Page Header */}
      <div className="flex items-center justify-between bg-white border border-[#efefef] rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/super-admin/golf-courses")}
            className="w-10 h-10 border border-gray-200 hover:border-openclub-700 hover:bg-emerald-50/20 text-gray-500 hover:text-openclub-800 rounded-xl flex items-center justify-center transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[14px] font-normal text-gray-900">{course.name}</h1>
              <span className="bg-emerald-50 text-openclub-800 border border-emerald-100 text-[11px] font-normal px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                {course.status}
              </span>
            </div>
            <p className="text-[13px] text-gray-500 mt-0.5">
              {formattedAddress}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="h-10 px-4 rounded-xl border border-gray-200 text-gray-700 hover:bg-background font-normal text-[12px] flex items-center gap-2"
            onClick={() => router.push(`/super-admin/golf-courses/${course.id}/edit`)}
          >
            <Edit2 className="w-4 h-4" />
            Edit Course
          </Button>
          <Button 
            variant="outline" 
            className={cn(
              "h-10 px-4 rounded-xl font-normal text-[12px] flex items-center gap-2 transition-all",
              course.status === 'ACTIVE' 
                ? "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" 
                : "border-emerald-200 text-openclub-800 hover:bg-emerald-50 hover:text-emerald-700"
            )}
            onClick={openStatusModal}
          >
            <Power className="w-4 h-4" />
            {course.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </Button>
          <div className="relative">
            <Button 
              variant="outline" 
              className="h-10 w-10 p-0 rounded-xl border border-gray-200 text-gray-700 hover:bg-background flex items-center justify-center"
              onClick={(e) => {
                setActiveDropdown(!activeDropdown);
                setDropdownAnchorEl(e.currentTarget);
              }}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
            {activeDropdown && (
              <FloatingMenu
                anchorEl={dropdownAnchorEl}
                open={activeDropdown}
                onClose={() => setActiveDropdown(false)}
                placement="bottom-end"
                className="w-48"
              >
                <button
                  onClick={openStatusModal}
                  className={cn(
                    "w-full text-left px-4 py-2 text-[12px] font-medium rounded-lg flex items-center gap-3 text-gray-700",
                    course.status === "INACTIVE" 
                      ? "hover:bg-emerald-50" 
                      : "hover:bg-red-50"
                  )}
                >
                  {course.status === "INACTIVE" ? (
                    <CheckCircle2 className="w-4 h-4 text-openclub-800" />
                  ) : (
                    <Ban className="w-4 h-4 text-red-600" />
                  )}
                  {course.status === "INACTIVE" ? "Activate Course" : "Deactivate Course"}
                </button>
                <div className="h-px bg-background my-1 mx-2" />
                <button
                  onClick={() => {
                    setActiveDropdown(false);
                    router.push(`/super-admin/golf-courses/${course.id}/edit`);
                  }}
                  className="w-full text-left px-4 py-2 text-[12px] font-normal text-gray-700 hover:bg-background flex items-center gap-3"
                >
                  <Edit2 className="w-4 h-4 text-gray-400" /> Edit Course
                </button>
                <button
                  onClick={() => {
                    setActiveDropdown(false);
                    const blob = new Blob([JSON.stringify(course, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${(course.name || "course").toString().replaceAll(" ", "-").toLowerCase()}-export.json`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                    toast.success("Course exported");
                  }}
                  className="w-full text-left px-4 py-2 text-[12px] font-normal text-gray-700 hover:bg-background flex items-center gap-3"
                >
                  <Download className="w-4 h-4 text-gray-400" /> Export Data
                </button>
                <div className="h-px bg-background my-1 mx-2" />
                <button
                  onClick={openDeleteModal}
                  className="w-full text-left px-4 py-2 text-[12px] font-normal text-gray-700 hover:bg-red-50 flex items-center gap-3"
                >
                  <Trash2 className="w-4 h-4 text-red-500" /> Delete Course
                </button>
              </FloatingMenu>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-[#efefef] rounded-xl p-4 shadow-sm space-y-1.5 sticky top-6">
            {tabs.map((tab, i) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "w-full text-left flex items-center gap-3.5 px-4 py-3 rounded-xl border transition-all duration-200",
                    isActive
                      ? "bg-emerald-50/60 border-emerald-100 text-emerald-700 font-normal shadow-sm shadow-emerald-50"
                      : "bg-white border-transparent text-gray-500 hover:bg-background/50 hover:text-gray-900"
                  )}
                >
                  <div
                    className={cn(
                      "w-6.5 h-6.5 rounded-full flex items-center justify-center text-[11px] font-normal transition-all duration-300",
                      isActive
                        ? "bg-[#15803D] text-white shadow-sm shadow-emerald-100"
                        : "bg-gray-100 text-gray-400 border border-gray-200"
                    )}
                  >
                    {i + 1}
                  </div>
                  <span className="text-[13px] font-normal capitalize tracking-wider leading-tight">{tab}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column - Active Tab Content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden min-h-[600px]">
            <div className="p-4 sm:p-8">
              {activeTab === "Overview" && (
                <div className="space-y-8">
                  {/* Cover Image */}
                  <div className="relative w-full h-[320px] rounded-xl overflow-hidden border border-[#efefef] bg-gray-100">
                    {course.coverImage ? (
                      <img src={course.coverImage} alt={course.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-200" />
                    )}
                    <div className="absolute top-4 right-4">
                      <Button className="bg-white/95 hover:bg-white text-gray-700 h-9 px-3 rounded-lg text-[12px] font-normal shadow-sm border border-[#efefef] flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        View Gallery <span className="text-gray-400 bg-gray-100 px-1.5 rounded">{course.galleryImages?.length || 0}</span>
                      </Button>
                    </div>
                  </div>

                  {/* Course Information & Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Course Information */}
                    <div className="p-6 rounded-xl border border-[#efefef] bg-background/50">
                      <h2 className="text-[16px] font-normal text-gray-900 mb-5">Course Information</h2>
                      <div className="space-y-4">
                        <div className="flex">
                          <span className="w-1/3 text-[12px] text-gray-500 font-normal">Location</span>
                          <span className="w-2/3 text-[12px] text-gray-900 font-normal">{formattedAddress}</span>
                        </div>
                        <div className="flex">
                          <span className="w-1/3 text-[12px] text-gray-500 font-normal">Owner</span>
                          <span className="w-2/3 text-[12px] text-gray-900 font-normal">{course.club?.name || "—"}</span>
                        </div>
                        <div className="flex">
                          <span className="w-1/3 text-[12px] text-gray-500 font-normal">Phone</span>
                          <span className="w-2/3 text-[12px] text-gray-900 font-normal">{course.phone || "—"}</span>
                        </div>
                        <div className="flex">
                          <span className="w-1/3 text-[12px] text-gray-500 font-normal">Email</span>
                          <span className="w-2/3 text-[12px] text-openclub-800 font-normal hover:underline cursor-pointer break-all">{course.email || "—"}</span>
                        </div>
                        <div className="flex">
                          <span className="w-1/3 text-[12px] text-gray-500 font-normal">Website</span>
                          <span className="w-2/3 text-[12px] text-openclub-800 font-normal hover:underline cursor-pointer break-all">{course.website || "—"}</span>
                        </div>
                        <div className="flex">
                          <span className="w-1/3 text-[12px] text-gray-500 font-normal">Created On</span>
                          <span className="w-2/3 text-[12px] text-gray-900 font-normal">
                            {course.createdAt ? formatDate(course.createdAt) : "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Course Statistics */}
                    <div className="p-6 rounded-xl border border-[#efefef] bg-background/50">
                      <h2 className="text-[16px] font-normal text-gray-900 mb-5">Course Statistics</h2>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1 p-3 bg-white rounded-xl border border-[#efefef]">
                          <div className="flex items-center gap-2">
                            <Flag className="w-4 h-4 text-openclub-700" />
                            <span className="text-[11px] text-gray-500 font-normal">Total Holes</span>
                          </div>
                          <div className="text-[18px] font-normal text-gray-900">{course.holes}</div>
                        </div>
                        <div className="flex flex-col gap-1 p-3 bg-white rounded-xl border border-[#efefef]">
                          <div className="flex items-center gap-2">
                            <Route className="w-4 h-4 text-openclub-700" />
                            <span className="text-[11px] text-gray-500 font-normal">Total Yards</span>
                          </div>
                          <div className="text-[18px] font-normal text-gray-900">{maxYards > 0 ? maxYards.toLocaleString() : "—"}</div>
                        </div>
                        <div className="flex flex-col gap-1 p-3 bg-white rounded-xl border border-[#efefef]">
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-blue-500" />
                            <span className="text-[11px] text-gray-500 font-normal">Course Rating</span>
                          </div>
                          <div className="text-[18px] font-normal text-gray-900">{course.courseRating || "—"}</div>
                        </div>
                        <div className="flex flex-col gap-1 p-3 bg-white rounded-xl border border-[#efefef]">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-orange-500" />
                            <span className="text-[11px] text-gray-500 font-normal">Slope Rating</span>
                          </div>
                          <div className="text-[18px] font-normal text-gray-900">{course.slopeRating || "—"}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="p-6 rounded-xl border border-[#efefef] bg-white shadow-sm">
                    <h2 className="text-[16px] font-normal text-gray-900 mb-5">Amenities</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2">
                      {course.amenities && course.amenities.length > 0 ? (
                        course.amenities.map(amenity => (
                          <div key={amenity} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                              {getAmenityIcon(amenity)}
                            </div>
                            <span className="text-[13px] font-normal text-gray-800">{amenity}</span>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 text-[12px] text-gray-500">No amenities listed</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "Holes" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-[#efefef] pb-4">
                    <div>
                      <h2 className="text-[14px] font-normal text-gray-900">Hole-by-Hole Details</h2>
                      <p className="text-[12px] text-gray-500 mt-1">Hole specification, par configuration and handicap index.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-[12px] font-normal text-openclub-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                        <Flag className="w-3.5 h-3.5" />
                        {course.holes} Holes
                      </div>
                      <div className="flex items-center gap-2 text-[12px] font-normal text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                        <Target className="w-3.5 h-3.5" />
                        Total Par: {course.par}
                      </div>
                    </div>
                  </div>

                  {course.holeDetails && course.holeDetails.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {[...course.holeDetails].sort((a, b) => a.number - b.number).map((hole) => (
                        <div 
                          key={hole.number} 
                          className="p-4 rounded-xl border border-[#efefef] bg-white shadow-sm space-y-3 hover:border-emerald-200 transition-colors"
                        >
                          <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                            <span className="text-[12px] font-normal text-gray-400 capitalize">Hole</span>
                            <span className="text-[14px] font-normal text-openclub-800 bg-emerald-50 w-7 h-7 rounded-lg flex items-center justify-center border border-emerald-100">
                              {hole.number}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="p-1.5 bg-background rounded-lg">
                              <span className="text-[9px] font-normal text-gray-400 uppercase block">Par</span>
                              <span className="text-[13px] font-normal text-gray-700">{hole.par}</span>
                            </div>
                            <div className="p-1.5 bg-background rounded-lg">
                              <span className="text-[9px] font-normal text-gray-400 uppercase block">Index</span>
                              <span className="text-[13px] font-normal text-gray-700">{hole.index || "—"}</span>
                            </div>
                          </div>
                          <div className="pt-1.5 border-t border-gray-50 text-center">
                            <span className="text-[9px] font-normal text-gray-400 uppercase block">Distance</span>
                            <span className="text-[12px] font-normal text-gray-800">{hole.distance ? `${hole.distance}m` : "—"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500 border border-dashed border-gray-200 rounded-xl p-6 bg-background/50">
                      <Flag className="w-12 h-12 mb-4 text-gray-300 animate-pulse" />
                      <p className="font-normal text-gray-700">No hole configuration details available</p>
                      <p className="text-[12px] mt-1">Configure the per-hole details by editing the course.</p>
                      <Button 
                        variant="outline" 
                        className="mt-4 rounded-xl font-normal border-gray-200"
                        onClick={() => router.push(`/super-admin/golf-courses/${course.id}/edit`)}
                      >
                        Configure Holes
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {activeTab === "Tee Boxes" && (
                <div className="space-y-6">
                  <h2 className="text-[14px] font-normal text-gray-900">Tee Boxes</h2>
                  <div className="overflow-x-auto rounded-xl border border-[#efefef]">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-background/50 border-b border-[#efefef] text-[#15803D]">
                          <th className="py-3 px-4 text-[12px] font-normal text-[#15803D]">Tee Name</th>
                          <th className="py-3 px-4 text-[12px] font-normal text-[#15803D]">Type</th>
                          <th className="py-3 px-4 text-[12px] font-normal text-[#15803D]">Par</th>
                          <th className="py-3 px-4 text-[12px] font-normal text-[#15803D]">Yards</th>
                          <th className="py-3 px-4 text-[12px] font-normal text-[#15803D]">Rating</th>
                          <th className="py-3 px-4 text-[12px] font-normal text-[#15803D]">Slope</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {course.teeBoxes && course.teeBoxes.length > 0 ? (
                          course.teeBoxes.map((tb, idx) => (
                            <tr key={idx} className="hover:bg-background/50 transition-colors">
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-3 h-3 rounded-full border border-gray-200"
                                    style={{ backgroundColor: tb.color.toLowerCase() === "white" ? "#fff" : tb.color.toLowerCase() === "black" ? "#000" : tb.color.toLowerCase() === "blue" ? "#3b82f6" : tb.color.toLowerCase() === "red" ? "#ef4444" : tb.color.toLowerCase() === "yellow" ? "#eab308" : tb.color.toLowerCase() === "gold" ? "#d97706" : tb.color }}
                                  />
                                  <span className="text-[12px] font-normal text-gray-900 capitalize">{tb.name}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-[12px] text-gray-600">{tb.name.toLowerCase().includes('champ') ? 'Championship' : tb.name.toLowerCase().includes('tour') ? 'Tournament' : 'Regular'}</td>
                              <td className="py-4 px-4 text-[12px] text-gray-600">{course.par}</td>
                              <td className="py-4 px-4 text-[12px] text-gray-600">{tb.yardage.toLocaleString()}</td>
                              <td className="py-4 px-4 text-[12px] text-gray-600">{tb.rating || "—"}</td>
                              <td className="py-4 px-4 text-[12px] text-gray-600">{tb.slope || "—"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-6 px-4 text-center text-[12px] text-gray-500">No tee boxes found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {activeTab === "Amenities" && (
                <div className="space-y-6">
                  <div className="border-b border-[#efefef] pb-4">
                    <h2 className="text-[14px] font-normal text-gray-900">Amenities</h2>
                    <p className="text-[12px] text-gray-500 mt-1">Available facilities and services at {course.name}.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {course.amenities && course.amenities.length > 0 ? (
                      course.amenities.map(amenity => (
                        <div key={amenity} className="flex items-center gap-4 p-4 rounded-xl border border-[#efefef] bg-white hover:shadow-sm transition-all hover:border-emerald-100">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-openclub-800 shrink-0">
                            {getAmenityIcon(amenity)}
                          </div>
                          <div>
                            <span className="text-[12px] font-normal text-gray-800">{amenity}</span>
                            <span className="text-[10px] text-openclub-800 bg-emerald-50/50 px-1.5 py-0.5 rounded font-normal block w-fit mt-1">Available</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-12 border border-dashed border-gray-200 rounded-xl p-6 bg-background/50 text-gray-500">
                        No amenities listed for this course.
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeTab === "Tournaments" && (
                <div className="space-y-6">
                  <div className="border-b border-[#efefef] pb-4">
                    <h2 className="text-[14px] font-normal text-gray-900">Tournaments</h2>
                    <p className="text-[12px] text-gray-500 mt-1">Tournaments hosted at {course.name}.</p>
                  </div>
                  <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500 border border-dashed border-gray-200 rounded-xl p-6 bg-background/50">
                    <Trophy className="w-12 h-12 mb-4 text-gray-300" />
                    <p className="font-normal text-gray-700">No Tournaments Scheduled</p>
                    <p className="text-[12px] mt-1">There are currently no active or past tournaments recorded for this golf course.</p>
                  </div>
                </div>
              )}
              {activeTab === "Course Settings" && (
                <div className="space-y-6">
                  <div className="border-b border-[#efefef] pb-4">
                    <h2 className="text-[14px] font-normal text-gray-900">Course Settings</h2>
                    <p className="text-[12px] text-gray-500 mt-1">Configure regional and booking settings for this course.</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-50">
                      <div>
                        <p className="text-[12px] font-normal text-gray-800">Featured Course</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Showcase this course on the homepage dashboard</p>
                      </div>
                      <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-normal border", course.isFeatured ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-background text-gray-600 border-[#efefef]")}>
                        {course.isFeatured ? "Featured" : "Regular"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-50">
                      <div>
                        <p className="text-[12px] font-normal text-gray-800">Booking URL</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Redirect URL for booking tee times</p>
                      </div>
                      <span className="text-[11px] text-gray-600 truncate max-w-[200px]">{course.bookingUrl || "None configured"}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-50">
                      <div>
                        <p className="text-[12px] font-normal text-gray-800">Coordinates</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Latitude and longitude coordinates for map pinning</p>
                      </div>
                      <span className="text-[11px] text-gray-600">
                        {course.latitude && course.longitude ? `${course.latitude}, ${course.longitude}` : "Not configured"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "Activity Logs" && (
                <div className="space-y-6">
                  <div className="border-b border-[#efefef] pb-4">
                    <h2 className="text-[14px] font-normal text-gray-900">Activity Logs</h2>
                    <p className="text-[12px] text-gray-500 mt-1">Audit trail of modifications made to this course.</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-openclub-800 shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[12px] font-normal text-gray-800">Course Created</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{course.createdAt ? formatDate(course.createdAt) : "—"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Confirm Modal */}
      <Modal 
        isOpen={isStatusModalOpen} 
        onClose={() => setIsStatusModalOpen(false)} 
        title=""
        footer={
          <>
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)} className="rounded-lg font-normal">
              Cancel
            </Button>
            <Button
              className={cn(
                "text-white rounded-lg font-normal px-8",
                statusAction === "activate"
                  ? "bg-[#15803D] hover:bg-[#166534] border-openclub-800/30"
                  : "bg-red-500 hover:bg-red-600 border-red-600/30",
              )}
              onClick={confirmStatusChange}
              disabled={mutating}
            >
              {statusAction === "activate" ? "Yes, Activate" : "Yes, Deactivate"}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center pt-2">
            <div
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mb-6",
                statusAction === "activate" ? "bg-emerald-50 text-[#15803D]" : "bg-red-50 text-red-500",
              )}
            >
              {statusAction === "activate" ? (
                <CheckCircle2 className="h-10 w-10" />
              ) : (
                <AlertCircle className="h-10 w-10" />
              )}
            </div>
            <h4 className="text-[14px] font-normal text-gray-900 mb-2">
              {statusAction === "activate" ? "Activate Course?" : "Deactivate Course?"}
            </h4>
            <p className="text-gray-500 max-w-sm">
              {statusAction === "activate"
                ? "This golf course will become visible and active on the platform."
                : "This golf course will be hidden from users until reactivated."}
            </p>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title=""
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="rounded-lg font-normal">
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="text-white rounded-lg font-normal px-8 bg-red-600 hover:bg-red-700"
              onClick={confirmDelete}
              disabled={mutating || deleteConfirmText.trim().toUpperCase() !== "DELETE"}
            >
              Delete Permanently
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center pt-2">
            <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-6">
              <Trash2 className="h-10 w-10" />
            </div>
            <h4 className="text-[14px] font-normal text-gray-900 mb-2">Delete Golf Course?</h4>
            <p className="text-gray-500 max-w-sm mb-4">
              This action is permanent and cannot be undone. All data related to this course will be deleted.
            </p>
            <div className="w-full text-left space-y-2 mt-4">
              <label className="text-[12px] font-normal text-gray-500 capitalize">Type "DELETE" to confirm</label>
              <Input 
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full border-red-200 focus-visible:ring-red-500"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
