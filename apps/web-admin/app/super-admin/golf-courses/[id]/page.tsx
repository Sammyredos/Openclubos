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
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getCourse, Course } from "@/lib/api/courses";
import { Country } from "country-state-city";
import { cn } from "@/lib/utils";

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
        <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
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
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-12 w-full bg-gray-50 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm min-h-[400px] space-y-6">
              <div className="h-5 w-32 bg-gray-100 rounded-lg" />
              <div className="h-64 w-full bg-gray-50 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] p-6 text-center">
        <h3 className="text-xl font-bold text-gray-900">Golf Course Not Found</h3>
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

  const formattedAddress = [course.address, course.city, course.state, Country.getCountryByCode(course.country)?.name || course.country]
    .filter(Boolean)
    .join(", ");

  const getAmenityIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('range')) return <Flag className="w-4 h-4 text-emerald-600" />;
    if (n.includes('shop')) return <ShoppingCart className="w-4 h-4 text-emerald-600" />;
    if (n.includes('clubhouse')) return <Building2 className="w-4 h-4 text-emerald-600" />;
    if (n.includes('restaurant') || n.includes('food')) return <Utensils className="w-4 h-4 text-emerald-600" />;
    if (n.includes('locker')) return <Key className="w-4 h-4 text-emerald-600" />;
    if (n.includes('cart')) return <Car className="w-4 h-4 text-emerald-600" />;
    if (n.includes('practice') || n.includes('green')) return <Flag className="w-4 h-4 text-emerald-600" />;
    if (n.includes('parking')) return <ParkingCircle className="w-4 h-4 text-emerald-600" />;
    return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
  };

  return (
    <div className="space-y-6 transition-all duration-150">
      {/* Page Header */}
      <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/super-admin/golf-courses")}
            className="w-10 h-10 border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/20 text-gray-500 hover:text-emerald-600 rounded-xl flex items-center justify-center transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{course.name}</h1>
              <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
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
            className="h-10 px-4 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm flex items-center gap-2"
            onClick={() => router.push(`/super-admin/golf-courses/${course.id}/edit`)}
          >
            <Edit2 className="w-4 h-4" />
            Edit Course
          </Button>
          <Button 
            variant="outline" 
            className="h-10 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-medium text-sm flex items-center gap-2"
          >
            <Power className="w-4 h-4" />
            {course.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </Button>
          <Button 
            variant="outline" 
            className="h-10 w-10 p-0 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-1.5 sticky top-6">
            {tabs.map((tab, i) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "w-full text-left flex items-center gap-3.5 px-4 py-3 rounded-xl border transition-all duration-200",
                    isActive
                      ? "bg-emerald-50/60 border-emerald-100 text-emerald-700 font-bold shadow-sm shadow-emerald-50"
                      : "bg-white border-transparent text-gray-500 hover:bg-gray-50/50 hover:text-gray-900"
                  )}
                >
                  <div
                    className={cn(
                      "w-6.5 h-6.5 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300",
                      isActive
                        ? "bg-[#10b981] text-white shadow-sm shadow-emerald-100"
                        : "bg-gray-100 text-gray-400 border border-gray-200"
                    )}
                  >
                    {i + 1}
                  </div>
                  <span className="text-[13px] font-semibold uppercase tracking-wider leading-tight">{tab}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column - Active Tab Content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden min-h-[600px]">
            <div className="p-4 sm:p-8">
              {activeTab === "Overview" && (
                <div className="space-y-8">
                  {/* Cover Image */}
                  <div className="relative w-full h-[320px] rounded-2xl overflow-hidden border border-gray-100 bg-gray-100">
                    {course.coverImage ? (
                      <img src={course.coverImage} alt={course.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-200" />
                    )}
                    <div className="absolute top-4 right-4">
                      <Button className="bg-white/95 hover:bg-white text-gray-700 h-9 px-3 rounded-lg text-sm font-semibold shadow-sm border border-gray-100 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        View Gallery <span className="text-gray-400 bg-gray-100 px-1.5 rounded">{course.galleryImages?.length || 0}</span>
                      </Button>
                    </div>
                  </div>

                  {/* Course Information & Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Course Information */}
                    <div className="p-6 rounded-2xl border border-gray-100 bg-gray-50/50">
                      <h2 className="text-[16px] font-bold text-gray-900 mb-5">Course Information</h2>
                      <div className="space-y-4">
                        <div className="flex">
                          <span className="w-1/3 text-sm text-gray-500 font-medium">Location</span>
                          <span className="w-2/3 text-sm text-gray-900 font-medium">{formattedAddress}</span>
                        </div>
                        <div className="flex">
                          <span className="w-1/3 text-sm text-gray-500 font-medium">Owner</span>
                          <span className="w-2/3 text-sm text-gray-900 font-medium">{course.club?.name || "—"}</span>
                        </div>
                        <div className="flex">
                          <span className="w-1/3 text-sm text-gray-500 font-medium">Phone</span>
                          <span className="w-2/3 text-sm text-gray-900 font-medium">{course.phone || "—"}</span>
                        </div>
                        <div className="flex">
                          <span className="w-1/3 text-sm text-gray-500 font-medium">Email</span>
                          <span className="w-2/3 text-sm text-emerald-600 font-medium hover:underline cursor-pointer break-all">{course.email || "—"}</span>
                        </div>
                        <div className="flex">
                          <span className="w-1/3 text-sm text-gray-500 font-medium">Website</span>
                          <span className="w-2/3 text-sm text-emerald-600 font-medium hover:underline cursor-pointer break-all">{course.website || "—"}</span>
                        </div>
                        <div className="flex">
                          <span className="w-1/3 text-sm text-gray-500 font-medium">Created On</span>
                          <span className="w-2/3 text-sm text-gray-900 font-medium">
                            {course.createdAt ? formatDate(course.createdAt) : "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Course Statistics */}
                    <div className="p-6 rounded-2xl border border-gray-100 bg-gray-50/50">
                      <h2 className="text-[16px] font-bold text-gray-900 mb-5">Course Statistics</h2>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1 p-3 bg-white rounded-xl border border-gray-100">
                          <div className="flex items-center gap-2">
                            <Flag className="w-4 h-4 text-emerald-500" />
                            <span className="text-[11px] text-gray-500 font-medium">Total Holes</span>
                          </div>
                          <div className="text-[18px] font-bold text-gray-900">{course.holes}</div>
                        </div>
                        <div className="flex flex-col gap-1 p-3 bg-white rounded-xl border border-gray-100">
                          <div className="flex items-center gap-2">
                            <Route className="w-4 h-4 text-emerald-500" />
                            <span className="text-[11px] text-gray-500 font-medium">Total Yards</span>
                          </div>
                          <div className="text-[18px] font-bold text-gray-900">{maxYards > 0 ? maxYards.toLocaleString() : "—"}</div>
                        </div>
                        <div className="flex flex-col gap-1 p-3 bg-white rounded-xl border border-gray-100">
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-blue-500" />
                            <span className="text-[11px] text-gray-500 font-medium">Course Rating</span>
                          </div>
                          <div className="text-[18px] font-bold text-gray-900">{course.courseRating || "—"}</div>
                        </div>
                        <div className="flex flex-col gap-1 p-3 bg-white rounded-xl border border-gray-100">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-orange-500" />
                            <span className="text-[11px] text-gray-500 font-medium">Slope Rating</span>
                          </div>
                          <div className="text-[18px] font-bold text-gray-900">{course.slopeRating || "—"}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <h2 className="text-[16px] font-bold text-gray-900 mb-5">Amenities</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2">
                      {course.amenities && course.amenities.length > 0 ? (
                        course.amenities.map(amenity => (
                          <div key={amenity} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                              {getAmenityIcon(amenity)}
                            </div>
                            <span className="text-[13px] font-medium text-gray-800">{amenity}</span>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 text-sm text-gray-500">No amenities listed</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "Holes" && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                  <Flag className="w-12 h-12 mb-4 text-gray-300" />
                  <p>Hole details will be displayed here.</p>
                </div>
              )}
              {activeTab === "Tee Boxes" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900">Tee Boxes</h2>
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                          <th className="py-3 px-4 text-[12px] font-semibold text-gray-900">Tee Name</th>
                          <th className="py-3 px-4 text-[12px] font-semibold text-gray-900">Type</th>
                          <th className="py-3 px-4 text-[12px] font-semibold text-gray-900">Par</th>
                          <th className="py-3 px-4 text-[12px] font-semibold text-gray-900">Yards</th>
                          <th className="py-3 px-4 text-[12px] font-semibold text-gray-900">Rating</th>
                          <th className="py-3 px-4 text-[12px] font-semibold text-gray-900">Slope</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {course.teeBoxes && course.teeBoxes.length > 0 ? (
                          course.teeBoxes.map((tb, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-3 h-3 rounded-full border border-gray-200"
                                    style={{ backgroundColor: tb.color.toLowerCase() === "white" ? "#fff" : tb.color.toLowerCase() === "black" ? "#000" : tb.color.toLowerCase() === "blue" ? "#3b82f6" : tb.color.toLowerCase() === "red" ? "#ef4444" : tb.color.toLowerCase() === "yellow" ? "#eab308" : tb.color.toLowerCase() === "gold" ? "#d97706" : tb.color }}
                                  />
                                  <span className="text-sm font-semibold text-gray-900 capitalize">{tb.name}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-600">{tb.name.toLowerCase().includes('champ') ? 'Championship' : tb.name.toLowerCase().includes('tour') ? 'Tournament' : 'Regular'}</td>
                              <td className="py-4 px-4 text-sm text-gray-600">{course.par}</td>
                              <td className="py-4 px-4 text-sm text-gray-600">{tb.yardage.toLocaleString()}</td>
                              <td className="py-4 px-4 text-sm text-gray-600">{tb.rating || "—"}</td>
                              <td className="py-4 px-4 text-sm text-gray-600">{tb.slope || "—"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-6 px-4 text-center text-sm text-gray-500">No tee boxes found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {activeTab === "Amenities" && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                  <Activity className="w-12 h-12 mb-4 text-gray-300" />
                  <p>Amenities details are available in the Overview tab.</p>
                </div>
              )}
              {activeTab === "Tournaments" && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                  <Trophy className="w-12 h-12 mb-4 text-gray-300" />
                  <p>Tournaments held at this course will be displayed here.</p>
                </div>
              )}
              {activeTab === "Course Settings" && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                  <Building2 className="w-12 h-12 mb-4 text-gray-300" />
                  <p>Settings for this course will be displayed here.</p>
                </div>
              )}
              {activeTab === "Activity Logs" && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                  <Activity className="w-12 h-12 mb-4 text-gray-300" />
                  <p>Recent activities for this course will be displayed here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
