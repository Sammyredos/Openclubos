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
  Phone,
  Globe,
  Shield,
  Trophy,
  FileText,
  FileSpreadsheet,
  TrendingUp,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Course, CourseStats, getAdminCourses, deleteCourse, updateCourse } from "@/lib/api/courses";
import { Country } from "country-state-city";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { FloatingMenu } from "@/components/ui/floating-menu";
import { exportToCsv, exportToPdf } from "@/lib/export";

function StatusPill({ status }: { status: Course["status"] }) {
  const isActive = status === "ACTIVE";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-normal uppercase whitespace-nowrap",
        isActive
          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
          : "bg-red-50 text-red-700 border-red-100"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-openclub-700" : "bg-red-500")} />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

export default function SuperAdminGolfCoursesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<CourseStats | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("All Countries");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [typeFilter, setTypeFilter] = useState("All Types");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [statusAction, setStatusAction] = useState<"activate" | "deactivate">("activate");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [mutating, setMutating] = useState(false);

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownAnchorEl, setDropdownAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [dropdownCourse, setDropdownCourse] = useState<Course | null>(null);
  const [exportAnchorEl, setExportAnchorEl] = useState<HTMLElement | null>(null);
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

  const [totalCourses, setTotalCourses] = useState(0);

  const filteredCourses = allCourses;

  const totalPages = Math.max(1, Math.ceil(totalCourses / itemsPerPage));
  const pageSafe = Math.min(currentPage, totalPages);
  const paginatedCourses = filteredCourses;

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await getAdminCourses({
        skip: (currentPage - 1) * itemsPerPage,
        take: itemsPerPage,
        search: searchQuery || undefined,
        country: countryFilter !== "All Countries" ? countryFilter : undefined,
        status: statusFilter !== "All Status" ? statusFilter : undefined,
        type: typeFilter !== "All Types" ? typeFilter : undefined,
      });
      setAllCourses(res.items);
      setTotalCourses(res.total || res.items.length);
      if (res.stats) setStats(res.stats);
    } catch (e: any) {
      toast.error(e.message || "Failed to load golf courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [currentPage, itemsPerPage, searchQuery, countryFilter, statusFilter, typeFilter]);

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


      {loading ? (
        <div className="w-full bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-x-auto">
          <div className="flex items-center justify-between p-8 min-w-max gap-12 font-sans">
            <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
              <div className="flex justify-start items-center gap-3.5">
                <Skeleton className="h-[22px] w-24" />
              </div>
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>

            <div className="w-px h-16 bg-slate-200" />

            <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
              <div className="flex justify-start items-center gap-3.5">
                <Skeleton className="h-[22px] w-24" />
                <Skeleton className="h-6 w-16 rounded-lg" />
              </div>
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-5 w-32" />
            </div>

            <div className="w-px h-16 bg-slate-200" />

            <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
              <div className="flex justify-start items-center gap-3.5">
                <Skeleton className="h-[22px] w-28" />
                <Skeleton className="h-6 w-16 rounded-lg" />
              </div>
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>

            <div className="w-px h-16 bg-slate-200" />

            <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
              <div className="flex justify-start items-center gap-3.5">
                <Skeleton className="h-[22px] w-28" />
              </div>
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>

            <div className="w-px h-16 bg-slate-200" />

            <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
              <div className="flex justify-start items-center gap-3.5">
                <Skeleton className="h-[22px] w-28" />
              </div>
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-x-auto">
          <div className="flex items-center justify-between p-8 min-w-max gap-12 font-sans">
            
            {/* Stat 1: Total Courses */}
            <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
              <div className="flex justify-start items-center gap-3.5">
                <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Total Courses</div>
              </div>
              <div className="text-[#15803D] text-3xl font-bold">{stats?.totalCourses ?? 0}</div>
              <div className="text-zinc-500 text-sm font-normal">All Time</div>
            </div>

            <div className="w-px h-16 bg-slate-200" />

            {/* Stat 2: Active Courses */}
            <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
              <div className="flex justify-start items-center gap-3.5">
                <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Active Courses</div>
                <div className="px-2 py-1 bg-emerald-50 rounded-lg flex justify-center items-center gap-1 shrink-0 whitespace-nowrap">
                  <TrendingUp className="w-3.5 h-3.5 text-[#15803D]" />
                  <div className="text-[#15803D] text-xs font-medium">{stats && stats.totalCourses > 0 ? Math.round((stats.activeCourses / stats.totalCourses) * 100) : 0}% of total</div>
                </div>
              </div>
              <div className="text-[#15803D] text-3xl font-bold">{stats?.activeCourses ?? 0}</div>
              <div className="text-zinc-500 text-sm font-normal">Active</div>
            </div>

            <div className="w-px h-16 bg-slate-200" />

            {/* Stat 3: Inactive Courses */}
            <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
              <div className="flex justify-start items-center gap-3.5">
                <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Inactive Courses</div>
                <div className="px-2 py-1 bg-red-50 rounded-lg flex justify-center items-center gap-1 shrink-0 whitespace-nowrap">
                  <div className="text-red-600 text-xs font-medium">{stats && stats.totalCourses > 0 ? Math.round((stats.inactiveCourses / stats.totalCourses) * 100) : 0}% of total</div>
                </div>
              </div>
              <div className="text-[#15803D] text-3xl font-bold">{stats?.inactiveCourses ?? 0}</div>
              <div className="text-zinc-500 text-sm font-normal">Alerts</div>
            </div>

            <div className="w-px h-16 bg-slate-200" />

            {/* Stat 4: Countries */}
            <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
              <div className="flex justify-start items-center gap-3.5">
                <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Countries</div>
              </div>
              <div className="text-[#15803D] text-3xl font-bold">{stats?.countries ?? 0}</div>
              <div className="text-zinc-500 text-sm font-normal">Active Locations</div>
            </div>

            <div className="w-px h-16 bg-slate-200" />

            {/* Stat 5: LGAs / Cities */}
            <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
              <div className="flex justify-start items-center gap-3.5">
                <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">LGAs</div>
              </div>
              <div className="text-[#15803D] text-3xl font-bold">{stats?.cities ?? 0}</div>
              <div className="text-zinc-500 text-sm font-normal">Across Regions</div>
            </div>

          </div>
        </div>
      )}

      <Card className="border-none shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
          <CardTitle className="text-zinc-700 text-xl font-medium whitespace-nowrap">All Courses</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              variant="outline" 
              onClick={(e) => setExportAnchorEl(e.currentTarget)}
              className="h-10 border-[#e1efe5] text-gray-600 gap-2 rounded-lg px-4 text-[14px] font-normal"
            >
              <Download className="w-4 h-4" /> Export
            </Button>
            <FloatingMenu
              open={exportAnchorEl != null}
              anchorEl={exportAnchorEl}
              onClose={() => setExportAnchorEl(null)}
              placement="bottom-end"
              className="w-48 bg-white rounded-xl shadow-xl border border-[#efefef] py-2"
            >
              <button
                onClick={() => {
                  setExportAnchorEl(null);
                  exportToCsv(
                    filteredCourses,
                    [
                      { header: "Name", key: "name" },
                      { header: "Organizer", key: "club.name" },
                      { header: "Country", key: "country" },
                      { header: "State", key: "state" },
                      { header: "City", key: "city" },
                      { header: "Holes", key: "holes" },
                      { header: "Par", key: "par" },
                      { header: "Type", key: "type" },
                      { header: "Status", key: "status" },
                    ],
                    "courses-export.csv"
                  );
                }}
                className="w-full text-left px-4 py-2 text-[12px] font-normal text-gray-700 hover:bg-background flex items-center gap-3"
              >
                <FileSpreadsheet className="w-4 h-4 text-openclub-800" />
                Export CSV
              </button>
              <button
                onClick={() => {
                  setExportAnchorEl(null);
                  exportToPdf(
                    filteredCourses,
                    [
                      { header: "Name", key: "name" },
                      { header: "Location", key: "city" },
                      { header: "Country", key: "country" },
                      { header: "Holes", key: "holes" },
                      { header: "Status", key: "status" },
                    ],
                    "courses-export.pdf",
                    "Golf Courses Export"
                  );
                }}
                className="w-full text-left px-4 py-2 text-[12px] font-normal text-gray-700 hover:bg-background flex items-center gap-3"
              >
                <FileText className="w-4 h-4 text-rose-600" />
                Export PDF
              </button>
            </FloatingMenu>
            <Button
              onClick={() => router.push("/super-admin/golf-courses/create")}
              className="h-10 bg-[#15803D] hover:bg-[#166534] border border-openclub-800/30 text-white gap-2 rounded-lg px-4 text-[14px] font-normal"
            >
              <Plus className="w-4 h-4" /> Add Golf Course
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-6 pb-6 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search courses by name, LGA, or country..."
                className="pl-10 h-11 rounded-lg text-[14px] border-[#e1efe5]"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <SearchableSelect
              value={countryFilter}
              onValueChange={setCountryFilter}
              options={countries}
              className="min-w-[160px]"
              triggerClassName="h-11 bg-[#f5faf6] border-[#e1efe5] text-[#15803D] font-medium"
              placeholder="All Countries"
            />
            <SearchableSelect
              value={typeFilter}
              onValueChange={setTypeFilter}
              options={courseTypes}
              className="min-w-[160px]"
              triggerClassName="h-11 bg-[#f5faf6] border-[#e1efe5] text-[#15803D] font-medium"
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
              triggerClassName="h-11 bg-[#f5faf6] border-[#e1efe5] text-[#15803D] font-medium"
              placeholder="All Status"
            />

          </div>

          <div className="overflow-x-auto relative">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f5faf6] border-b border-[#e1efe5] text-[11px] font-semibold text-[#15803D] uppercase tracking-wider">
                  <th className="px-6 py-4">Course Info</th>
                  <th className="px-6 py-4">Location & Country</th>
                  <th className="px-6 py-4 text-center">Holes & Par</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e1efe5]">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`sk-${i}`} className="hover:bg-background/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                          <div className="flex flex-col gap-1.5">
                            <Skeleton className="h-4 w-32 rounded-md" />
                            <Skeleton className="h-3 w-24 rounded-md" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <Skeleton className="w-3.5 h-3.5 rounded-full flex-shrink-0" />
                          <div className="flex flex-col gap-1.5">
                            <Skeleton className="h-4 w-28 rounded-md" />
                            <Skeleton className="h-3 w-20 rounded-md" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col items-center gap-1.5">
                          <Skeleton className="h-4 w-12 rounded-md mx-auto" />
                          <Skeleton className="h-3.5 w-10 rounded-md mx-auto" />
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <Skeleton className="h-5.5 w-16 rounded-full" />
                      </td>
                      <td className="px-6 py-5">
                        <Skeleton className="h-5.5 w-16 rounded-full" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <Skeleton className="h-9 w-9 rounded-lg" />
                          <Skeleton className="h-9 w-9 rounded-lg" />
                          <Skeleton className="h-9 w-9 rounded-lg" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : paginatedCourses.length > 0 ? (
                  paginatedCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-background/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3 min-w-[220px]">
                          <div className="w-12 h-12 rounded-full overflow-hidden border border-[#efefef] bg-background flex-shrink-0 group-hover:scale-105 transition-transform">
                            {course.coverImage ? (
                              <img src={course.coverImage} alt={course.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <Mountain className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[14px] font-normal text-gray-900 truncate" title={course.name}>{course.name.toLowerCase()}</span>
                            <span className="text-[12px] text-gray-400 font-normal truncate mt-0.5">{(course.club?.name || "Independent").toLowerCase()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 min-w-[180px]">
                          <MapPin className="w-3.5 h-3.5 text-openclub-700 flex-shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-[13px] font-normal text-gray-700 truncate">{course.city?.toLowerCase()}, {course.state?.toLowerCase()}</span>
                            <div className="flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
                              <div className="w-4 h-3 relative overflow-hidden rounded-[2px] bg-gray-100 flex-shrink-0 shadow-sm">
                                <img 
                                  src={`https://flagcdn.com/w40/${course.country.toLowerCase()}.png`} 
                                  alt={course.country}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="text-[11px] text-gray-400 font-normal truncate">
                                {(Country.getCountryByCode(course.country)?.name || course.country).toLowerCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col items-center">
                          <span className="text-[14px] text-gray-900 font-normal leading-tight">{course.holes} Holes</span>
                          <span className="text-[11px] text-gray-400 font-normal mt-0.5">Par {course.par}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-normal text-blue-600 bg-blue-50/70 px-2 py-0.5 rounded-lg whitespace-nowrap uppercase">
                          <Mountain className="w-3 h-3 text-blue-400" />
                          {course.type.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <StatusPill status={course.status} />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => router.push(`/super-admin/golf-courses/${course.id}`)}
                            className="h-7 px-2.5 inline-flex items-center justify-center gap-1.5 rounded-md bg-[#f5faf6] text-[#15803D] hover:bg-[#e1efe5] transition-colors border border-[#e1efe5]"
                            title="View Course"
                          >
                            <Eye className="w-3 h-3" />
                            <span className="text-[11px] font-medium leading-none">View</span>
                          </button>
                          <button
                            onClick={() => router.push(`/super-admin/golf-courses/${course.id}/edit`)}
                            className="h-7 px-2.5 inline-flex items-center justify-center gap-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-100"
                            title="Edit Course"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span className="text-[11px] font-medium leading-none">Edit</span>
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
                              className="h-7 px-2 inline-flex items-center justify-center rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
                              title="More Actions"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <EmptyState
                        icon={Mountain}
                        title="No golf courses found"
                        description="Try adjusting your filters or search query to find what you're looking for."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between">
            <p className="text-[13px] text-gray-500">
              Showing <strong>{paginatedCourses.length}</strong> of <strong>{totalCourses}</strong> courses
            </p>
            <Pagination
              currentPage={pageSafe}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </CardContent>
      </Card>


      <Modal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
        title=""
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-gray-400 font-normal italic">
              Course ID: {selectedCourse?.id || "—"}
            </span>
            <Button
              variant="outline"
              onClick={() => setIsViewModalOpen(false)}
              className="rounded-lg font-normal border-[#e1efe5]"
            >
              Close Details
            </Button>
          </div>
        }
      >
        {selectedCourse ? (
          <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 pb-8 border-b border-gray-50">
              <div className="relative">
                <div className="h-24 w-24 rounded-full border-2 border-white shadow-md bg-background overflow-hidden flex items-center justify-center">
                  {selectedCourse.coverImage ? (
                    <img src={selectedCourse.coverImage} alt={selectedCourse.name} className="w-full h-full object-cover" />
                  ) : (
                    <Mountain className="h-10 w-10 text-gray-300" />
                  )}
                </div>
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white shadow-sm",
                  selectedCourse.status === "ACTIVE" ? "bg-openclub-700" : "bg-red-500"
                )} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h4 className="text-[16px] font-normal text-gray-900 truncate">{selectedCourse.name}</h4>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-lg text-[10px] font-normal uppercase tracking-wider shadow-sm border",
                    selectedCourse.status === "ACTIVE" 
                      ? "bg-emerald-50 text-openclub-800 border-emerald-100" 
                      : "bg-red-50 text-red-600 border-red-100"
                  )}>
                    {selectedCourse.status}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                  <div className="flex items-center gap-2 text-[13px] text-gray-500 font-normal">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {selectedCourse.city}, {selectedCourse.state}
                  </div>
                  <div className="w-1 h-1 rounded-full bg-gray-300 hidden sm:block" />
                  <div className="flex items-center gap-2 text-[13px] text-gray-500 font-normal">
                    <Globe className="w-4 h-4 text-gray-400" />
                    {Country.getCountryByCode(selectedCourse.country)?.name || selectedCourse.country}
                  </div>
                </div>
              </div>
            </div>

            {/* Course Metrics Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50 shadow-sm">
                <p className="text-[10px] font-normal text-blue-600 uppercase tracking-widest mb-2">Course Type</p>
                <div className="flex items-end justify-between">
                  <p className="text-[14px] font-normal text-blue-900">{selectedCourse.type}</p>
                  <Trophy className="w-5 h-5 text-blue-300" />
                </div>
              </div>
              <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100/50 shadow-sm">
                <p className="text-[10px] font-normal text-openclub-800 uppercase tracking-widest mb-2">Total Holes</p>
                <div className="flex items-end justify-between">
                  <p className="text-[14px] font-normal text-emerald-900">{selectedCourse.holes} Holes</p>
                  <Flag className="w-5 h-5 text-emerald-300" />
                </div>
              </div>
              <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-100/50 shadow-sm">
                <p className="text-[10px] font-normal text-purple-600 uppercase tracking-widest mb-2">Course Par</p>
                <div className="flex items-end justify-between">
                  <p className="text-[14px] font-normal text-purple-900">Par {selectedCourse.par}</p>
                  <Trophy className="w-5 h-5 text-purple-300" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Location Card */}
              <div className="bg-white rounded-xl border border-[#efefef] overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-50 bg-background/30">
                  <h5 className="text-[12px] font-normal text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    Full Address
                  </h5>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-gray-400 font-normal uppercase tracking-wider">Street Address</span>
                    <span className="text-[14px] text-gray-900 font-normal">{selectedCourse.address}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-gray-400 font-normal uppercase tracking-wider">{selectedCourse.country === "NG" ? "LGA" : "City"} & State</span>
                    <span className="text-[14px] text-gray-900 font-normal">{selectedCourse.city}, {selectedCourse.state}</span>
                  </div>
                </div>
              </div>

              {/* Contact Card */}
              <div className="bg-white rounded-xl border border-[#efefef] overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-50 bg-background/30">
                  <h5 className="text-[12px] font-normal text-gray-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    Contact Details
                  </h5>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                    <span className="text-[13px] text-gray-500 font-normal">Email</span>
                    <span className="text-[13px] text-gray-900 font-normal">{selectedCourse.email || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                    <span className="text-[13px] text-gray-500 font-normal">Phone</span>
                    <span className="text-[13px] text-gray-900 font-normal">{selectedCourse.phone || "—"}</span>
                  </div>
                  {selectedCourse.website && (
                    <div className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                      <span className="text-[13px] text-gray-500 font-normal">Website</span>
                      <a href={selectedCourse.website} target="_blank" rel="noreferrer" className="text-[13px] text-blue-600 font-normal hover:underline">Visit Site</a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Amenities Section */}
            {selectedCourse.amenities && selectedCourse.amenities.length > 0 && (
              <div className="bg-white rounded-xl border border-[#efefef] p-6 shadow-sm">
                <h5 className="text-[12px] font-normal text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-400" />
                  Available Amenities
                </h5>
                <div className="flex flex-wrap gap-2.5">
                  {selectedCourse.amenities.map(a => (
                    <span key={a} className="px-4 py-2 bg-background border border-[#efefef] rounded-xl text-[12px] font-normal text-gray-700 shadow-sm flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center mx-auto mb-4">
              <Mountain className="w-8 h-8 text-gray-200" />
            </div>
            <p className="text-[15px] font-normal text-gray-900">No course selected</p>
            <p className="text-[13px] text-gray-400 mt-1">Please select a golf course to view its details.</p>
          </div>
        )}
      </Modal>

      {dropdownAnchorEl && dropdownCourse && (
        <FloatingMenu
          open={Boolean(dropdownAnchorEl)}
          anchorEl={dropdownAnchorEl}
          onClose={closeDropdown}
          className="w-60 bg-white border border-[#efefef] shadow-xl rounded-xl py-2"
        >
          <button
            onClick={() => openStatusModal(dropdownCourse)}
            className={cn(
              "w-full text-left px-4 py-2 text-[12px] font-normal rounded-lg flex items-center gap-3 text-gray-700",
              dropdownCourse.status === "INACTIVE" 
                ? "hover:bg-emerald-50" 
                : "hover:bg-red-50"
            )}
          >
            {dropdownCourse.status === "INACTIVE" ? (
              <CheckCircle2 className="w-4 h-4 text-openclub-800" />
            ) : (
              <Ban className="w-4 h-4 text-red-600" />
            )}
            {dropdownCourse.status === "INACTIVE" ? "Activate Course" : "Deactivate Course"}
          </button>
          <div className="h-px bg-background my-1 mx-2" />
          <button
            onClick={() => {
              closeDropdown();
              router.push(`/super-admin/golf-courses/${dropdownCourse.id}/edit`);
            }}
            className="w-full text-left px-4 py-2 text-[12px] font-normal text-gray-700 hover:bg-background flex items-center gap-3"
          >
            <Edit2 className="w-4 h-4 text-gray-400" /> Edit Course
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
            className="w-full text-left px-4 py-2 text-[12px] font-normal text-gray-700 hover:bg-background flex items-center gap-3"
          >
            <Download className="w-4 h-4 text-gray-400" /> Export Data
          </button>
          <div className="h-px bg-background my-1 mx-2" />
          <button
            onClick={() => openDeleteModal(dropdownCourse)}
            className="w-full text-left px-4 py-2 text-[12px] font-normal text-gray-700 hover:bg-red-50 flex items-center gap-3"
          >
            <Trash2 className="w-4 h-4 text-red-500" /> Delete Course
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

          <div className="rounded-xl border border-[#efefef] bg-background/50 px-4 py-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden border border-[#efefef] bg-white flex-shrink-0 flex items-center justify-center">
              {selectedCourse?.coverImage ? (
                <img src={selectedCourse.coverImage} alt={selectedCourse.name} className="w-full h-full object-cover" />
              ) : (
                <Mountain className="w-5 h-5 text-gray-300" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-normal text-gray-900 truncate">
                {selectedCourse?.name || "Unknown Course"}
              </p>
              <p className="text-[12px] text-gray-400 font-normal truncate">
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
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="rounded-lg font-normal">
              Cancel
            </Button>
            <Button
              disabled={deleteConfirmText.trim().toUpperCase() !== "DELETE" || mutating}
              className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 border border-red-600/30 text-white rounded-lg font-normal px-8"
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
            <h4 className="text-[14px] font-normal text-gray-900 mb-2">Delete Course Permanently?</h4>
            <p className="text-gray-500 max-w-sm">Deleting this golf course will permanently remove its hole data, tees, ratings, and course details. Past tournaments played here may lose course reference data. This action cannot be undone.</p>
          </div>
          <div className="space-y-3">
            <Label className="font-medium text-gray-700">
              Type <span className="text-red-600">&quot;DELETE&quot;</span> to confirm:
            </Label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="rounded-xl border-[#e1efe5] focus:border-red-500"
            />
          </div>
        </div>
      </Modal>

    </div>
  );
}

