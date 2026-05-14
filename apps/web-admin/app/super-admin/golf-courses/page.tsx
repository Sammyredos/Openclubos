"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
  Flag,
  MapPin,
  Mountain,
  CheckCircle2,
  AlertCircle,
  Ban,
  Search,
  Plus,
  Download,
  Eye,
  Edit2,
  Trash2,
  MoreHorizontal,
  ChevronRight,
  Filter,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Course, CourseStats, getAdminCourses, deleteCourse, updateCourse } from "@/lib/api/courses";
import { CreateCourseWizard } from "@/components/courses/CreateCourseWizard";
import { Country } from "country-state-city";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { FloatingMenu } from "@/components/ui/floating-menu";

function StatusPill({ status }: { status: Course["status"] }) {
  const isActive = status === "ACTIVE";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold",
        isActive
          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
          : "bg-red-50 text-red-700 border-red-100"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-emerald-500" : "bg-red-500")} />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

export default function SuperAdminGolfCoursesPage() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [total, setTotal] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("All Countries");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [typeFilter, setTypeFilter] = useState("All Types");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [statusAction, setStatusAction] = useState<"activate" | "deactivate">("activate");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [mutating, setMutating] = useState(false);

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownAnchorEl, setDropdownAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [dropdownCourse, setDropdownCourse] = useState<Course | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  const closeDropdown = () => {
    setActiveDropdown(null);
    if (closeTimeoutRef.current != null) window.clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = window.setTimeout(() => {
      setDropdownAnchorEl(null);
      setDropdownCourse(null);
      closeTimeoutRef.current = null;
    }, 160);
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await getAdminCourses({
        skip: (currentPage - 1) * itemsPerPage,
        take: itemsPerPage,
        search: searchQuery || undefined,
        country: countryFilter === "All Countries" ? undefined : countryFilter,
        status: statusFilter === "All Status" ? undefined : statusFilter,
        type: typeFilter === "All Types" ? undefined : typeFilter,
      });
      setCourses(res.items);
      setTotal(res.total);
      if (res.stats) setStats(res.stats);
    } catch (e: any) {
      toast.error(e.message || "Failed to load golf courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [currentPage, countryFilter, statusFilter, typeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCourses();
  };

  const openStatusModal = (c: Course) => {
    setSelectedCourse(c);
    setStatusAction(c.status === "ACTIVE" ? "deactivate" : "activate");
    setIsStatusModalOpen(true);
    closeDropdown();
  };

  const confirmStatusChange = async () => {
    if (!selectedCourse?.id) return;
    setMutating(true);
    try {
      const nextStatus = statusAction === "activate" ? "ACTIVE" : "INACTIVE";
      await updateCourse(selectedCourse.id, { status: nextStatus });
      toast.success(statusAction === "activate" ? "Course activated" : "Course deactivated");
      setIsStatusModalOpen(false);
      fetchCourses();
    } catch (e: any) {
      toast.error(e.message || "Failed to update course status");
    } finally {
      setMutating(false);
    }
  };

  const openDeleteModal = (c: Course) => {
    setSelectedCourse(c);
    setDeleteConfirmText("");
    setIsDeleteModalOpen(true);
    closeDropdown();
  };

  const confirmDelete = async () => {
    if (!selectedCourse?.id) return;
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") return;
    setMutating(true);
    try {
      await deleteCourse(selectedCourse.id);
      toast.success("Course deleted successfully");
      setIsDeleteModalOpen(false);
      fetchCourses();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete course");
    } finally {
      setMutating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      await deleteCourse(id);
      toast.success("Course deleted successfully");
      fetchCourses();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete course");
    }
  };

  const countries = useMemo(() => {
    const list = Country.getAllCountries().map((c) => ({ value: c.isoCode, label: c.name }));
    return [{ value: "All Countries", label: "All Countries" }, ...list];
  }, []);

  const courseTypes = [
    { value: "All Types", label: "All Types" },
    { value: "Parkland", label: "Parkland" },
    { value: "Links", label: "Links" },
    { value: "Desert", label: "Desert" },
    { value: "Heathland", label: "Heathland" },
  ];

  return (
    <div className="space-y-8 w-full max-w-full px-2 pb-10 font-sans">


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard
          title="Total Courses"
          value={String(stats?.totalCourses ?? 142)}
          icon={Mountain}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          loading={loading}
          subValue="Across Africa"
        />
        <StatCard
          title="Countries"
          value={String(stats?.countries ?? 18)}
          icon={Flag}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          loading={loading}
          subValue="Active"
        />
        <StatCard
          title="Cities"
          value={String(stats?.cities ?? 57)}
          icon={MapPin}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          loading={loading}
          subValue="Across Africa"
        />
        <StatCard
          title="Active Courses"
          value={String(stats?.activeCourses ?? 128)}
          icon={CheckCircle2}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          loading={loading}
          subValue={stats ? `${Math.round((stats.activeCourses / stats.totalCourses) * 100)}% of total` : "90.1% of total"}
        />
        <StatCard
          title="Inactive Courses"
          value={String(stats?.inactiveCourses ?? 14)}
          icon={AlertCircle}
          iconBg="bg-red-50"
          iconColor="text-red-600"
          loading={loading}
          subValue={stats ? `${Math.round((stats.inactiveCourses / stats.totalCourses) * 100)}% of total` : "9.9% of total"}
        />
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
          <CardTitle className="text-xl font-bold">Manage Courses</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="h-10 border-gray-200 text-gray-600 gap-2 rounded-lg px-4 text-[14px] font-bold">
              <Download className="w-4 h-4" /> Export
            </Button>
            <Button
              onClick={() => {
                setSelectedCourse(null);
                setIsModalOpen(true);
              }}
              className="h-10 bg-[#10b981] hover:bg-[#0da673] border border-emerald-600/30 text-white gap-2 rounded-lg px-4 text-[14px] font-bold"
            >
              <Plus className="w-4 h-4" /> Add Golf Course
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-6 pb-6 flex flex-wrap items-center gap-4">
            <form onSubmit={handleSearch} className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search courses by name, city, or country..."
                className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white rounded-lg text-[14px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <SearchableSelect
              value={countryFilter}
              onValueChange={setCountryFilter}
              options={countries}
              className="min-w-[160px]"
              triggerClassName="h-11 bg-white font-medium"
              placeholder="All Countries"
            />
            <SearchableSelect
              value={typeFilter}
              onValueChange={setTypeFilter}
              options={courseTypes}
              className="min-w-[160px]"
              triggerClassName="h-11 bg-white font-medium"
              placeholder="All Types"
            />
            <SearchableSelect
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={[
                { value: "All Status", label: "All Status" },
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
              ]}
              className="min-w-[160px]"
              triggerClassName="h-11 bg-white font-medium"
              placeholder="All Status"
            />

          </div>

          <div className="overflow-x-auto relative">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-[12px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Holes</th>
                  <th className="px-6 py-4">Par</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Country</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`sk-${i}`} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 min-w-[240px]">
                          <Skeleton className="w-12 h-10 rounded-lg" />
                          <div className="flex flex-col gap-2">
                            <Skeleton className="h-4 w-32 rounded-md" />
                            <Skeleton className="h-3 w-24 rounded-md" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Skeleton className="w-3.5 h-3.5 rounded-full" />
                          <div className="flex flex-col gap-2">
                            <Skeleton className="h-4 w-28 rounded-md" />
                            <Skeleton className="h-3 w-20 rounded-md" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-6 rounded-md" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-6 rounded-md" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Skeleton className="w-3.5 h-3.5 rounded-full" />
                          <Skeleton className="h-4 w-16 rounded-md" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Skeleton className="w-5 h-3.5 rounded-sm" />
                          <Skeleton className="h-4 w-20 rounded-md" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Skeleton className="h-9 w-9 rounded-lg" />
                          <Skeleton className="h-9 w-9 rounded-lg" />
                          <Skeleton className="h-9 w-9 rounded-lg" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : courses.length > 0 ? (
                  courses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 min-w-[240px]">
                          <div className="w-12 h-10 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0">
                            {course.coverImage ? (
                              <img src={course.coverImage} alt={course.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <Mountain className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[14px] font-bold text-gray-900 truncate">{course.name}</span>
                            <span className="text-[12px] text-gray-400 font-medium truncate">{course.club?.name || "Independent"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                          <div className="flex flex-col">
                            <span className="text-[13px] font-medium text-gray-700">{course.city}, {course.state}</span>
                            <span className="text-[11px] text-gray-400">{Country.getCountryByCode(course.country)?.name || course.country}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[14px] text-gray-600 font-medium">{course.holes}</td>
                      <td className="px-6 py-4 text-[14px] text-gray-600 font-medium">{course.par}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-600">
                          <Mountain className="w-3.5 h-3.5 text-blue-400" />
                          {course.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-3.5 relative overflow-hidden rounded-[2px] bg-gray-100 flex-shrink-0 shadow-sm">
                            <img 
                              src={`https://flagcdn.com/w40/${course.country.toLowerCase()}.png`} 
                              alt={course.country}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-[13px] font-medium text-gray-700">
                            {Country.getCountryByCode(course.country)?.name || course.country}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill status={course.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-[#10b981]/10 hover:text-[#10b981] transition-colors"
                            onClick={() => {
                              setSelectedCourse(course);
                              setIsViewModalOpen(true);
                            }}
                            title="View Course"
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </button>
                          <button
                            className={cn(
                              "h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white transition-colors",
                              course.status === "INACTIVE"
                                ? "text-emerald-600 hover:bg-emerald-50"
                                : "text-red-600 hover:bg-red-50"
                            )}
                            onClick={() => openStatusModal(course)}
                            title={course.status === "INACTIVE" ? "Activate Course" : "Deactivate Course"}
                          >
                            {course.status === "INACTIVE" ? (
                              <CheckCircle2 className="w-4.5 h-4.5" />
                            ) : (
                              <Ban className="w-4.5 h-4.5" />
                            )}
                          </button>
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                if (activeDropdown === course.id) {
                                  closeDropdown();
                                } else {
                                  if (closeTimeoutRef.current != null) {
                                    window.clearTimeout(closeTimeoutRef.current);
                                    closeTimeoutRef.current = null;
                                  }
                                  setActiveDropdown(course.id);
                                  setDropdownAnchorEl(e.currentTarget);
                                  setDropdownCourse(course);
                                }
                              }}
                              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors"
                              title="More Actions"
                            >
                              <MoreHorizontal className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                          <Mountain className="w-8 h-8 text-gray-200" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[15px] font-bold text-gray-900">No golf courses found</p>
                          <p className="text-[13px] text-gray-400">Try adjusting your filters or search query.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between">
            <p className="text-[13px] text-gray-500">
              Showing <strong>{courses.length}</strong> of <strong>{total}</strong> courses
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(total / itemsPerPage)}
              onPageChange={setCurrentPage}
            />
          </div>
        </CardContent>
      </Card>

      <CreateCourseWizard
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCourses}
        courseId={selectedCourse?.id}
      />

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="View Course Details">
        {selectedCourse ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
              <div className="w-16 h-16 rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center">
                {selectedCourse.coverImage ? (
                  <img src={selectedCourse.coverImage} alt={selectedCourse.name} className="w-full h-full object-cover" />
                ) : (
                  <Mountain className="w-8 h-8 text-gray-300" />
                )}
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900">{selectedCourse.name}</h4>
                <p className="text-sm text-gray-500">{selectedCourse.type} Course • {selectedCourse.holes} Holes • Par {selectedCourse.par}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Location</p>
                <p className="text-[13px] font-medium text-gray-900 leading-relaxed">
                  {selectedCourse.address}<br />
                  {selectedCourse.city}, {selectedCourse.state}<br />
                  {Country.getCountryByCode(selectedCourse.country)?.name || selectedCourse.country}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Contact Details</p>
                <div className="text-[13px] font-medium text-gray-900 flex flex-col gap-1.5 mt-1">
                  {selectedCourse.phone ? <span>{selectedCourse.phone}</span> : <span className="text-gray-400 italic">No phone</span>}
                  {selectedCourse.email ? <span>{selectedCourse.email}</span> : <span className="text-gray-400 italic">No email</span>}
                  {selectedCourse.website ? <a href={selectedCourse.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Website Link</a> : null}
                </div>
              </div>
            </div>

            {selectedCourse.amenities && selectedCourse.amenities.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCourse.amenities.map(a => (
                    <span key={a} className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium text-gray-700">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end pt-4 border-t border-gray-50">
               <Button onClick={() => setIsViewModalOpen(false)} variant="outline">Close</Button>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-gray-500 font-medium">No course selected</div>
        )}
      </Modal>

      {dropdownAnchorEl && dropdownCourse && (
        <FloatingMenu
          open={Boolean(dropdownAnchorEl)}
          anchorEl={dropdownAnchorEl}
          onClose={closeDropdown}
          className="w-48 p-1.5 bg-white border border-gray-100 shadow-xl rounded-2xl"
        >
          <button
            onClick={() => {
              setSelectedCourse(dropdownCourse);
              setIsModalOpen(true);
              closeDropdown();
            }}
            className="w-full text-left px-3 py-2 text-[13px] font-bold text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" /> Edit Course
          </button>
          <button
            onClick={() => {
              closeDropdown();
              const blob = new Blob([JSON.stringify(dropdownCourse, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${(dropdownCourse.name || "course").toString().replaceAll(" ", "-").toLowerCase()}-export.json`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
              toast.success("Course exported");
            }}
            className="w-full text-left px-3 py-2 text-[13px] font-bold text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export Data
          </button>
          <div className="h-px bg-gray-100 my-1 mx-2" />
          <button
            onClick={() => openDeleteModal(dropdownCourse)}
            className="w-full text-left px-3 py-2 text-[13px] font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete Course
          </button>
        </FloatingMenu>
      )}

      {/* Status Confirm Modal */}
      <Modal 
        isOpen={isStatusModalOpen} 
        onClose={() => setIsStatusModalOpen(false)} 
        title=""
        footer={
          <>
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)} className="rounded-lg font-bold">
              Cancel
            </Button>
            <Button
              className={cn(
                "text-white rounded-lg font-bold px-8",
                statusAction === "activate"
                  ? "bg-[#10b981] hover:bg-[#0da673] border-emerald-600/30"
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
                statusAction === "activate" ? "bg-emerald-50 text-[#10b981]" : "bg-red-50 text-red-500",
              )}
            >
              {statusAction === "activate" ? (
                <CheckCircle2 className="h-10 w-10" />
              ) : (
                <AlertCircle className="h-10 w-10" />
              )}
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">
              {statusAction === "activate" ? "Activate Course?" : "Deactivate Course?"}
            </h4>
            <p className="text-gray-500 max-w-sm">
              {statusAction === "activate"
                ? "This golf course will become visible and active on the platform."
                : "This golf course will be hidden from users until reactivated."}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl overflow-hidden border border-gray-100 bg-white flex-shrink-0 flex items-center justify-center">
              {selectedCourse?.coverImage ? (
                <img src={selectedCourse.coverImage} alt={selectedCourse.name} className="w-full h-full object-cover" />
              ) : (
                <Mountain className="w-5 h-5 text-gray-300" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-gray-900 truncate">
                {selectedCourse?.name || "Unknown Course"}
              </p>
              <p className="text-[12px] text-gray-400 font-medium truncate">
                {selectedCourse?.city && selectedCourse?.state ? `${selectedCourse.city}, ${selectedCourse.state}` : selectedCourse?.country || "—"}
              </p>
            </div>
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
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="rounded-lg font-bold">
              Cancel
            </Button>
            <Button
              disabled={deleteConfirmText.trim().toUpperCase() !== "DELETE" || mutating}
              className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 border border-red-600/30 text-white rounded-lg font-bold px-8"
              onClick={confirmDelete}
            >
              Delete Course
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center py-2">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-red-50 text-red-500">
              <Trash2 className="h-10 w-10" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Delete Course Permanently?</h4>
            <p className="text-gray-500 max-w-sm">This action cannot be undone and will permanently remove this golf course.</p>
          </div>
          <div className="space-y-3">
            <Label className="font-bold text-gray-700">
              Type <span className="text-red-600">&quot;DELETE&quot;</span> to confirm:
            </Label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="rounded-xl border-gray-200 focus:border-red-500"
            />
          </div>
        </div>
      </Modal>

    </div>
  );
}
