"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Flag,
  MapPin,
  Mountain,
  CheckCircle2,
  AlertCircle,
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
import { Course, CourseStats, getAdminCourses, deleteCourse } from "@/lib/api/courses";
import { CourseModal } from "@/components/courses/CourseModal";
import { Country } from "country-state-city";

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

            <Button
              variant="ghost"
              className="h-11 text-gray-400 hover:text-gray-600"
              onClick={() => {
                setSearchQuery("");
                setCountryFilter("All Countries");
                setStatusFilter("All Status");
                setTypeFilter("All Types");
              }}
            >
              Clear
            </Button>
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
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : courses.length > 0 ? (
                  courses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 min-w-[240px]">
                          <div className="w-12 h-10 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0">
                            {course.bannerUrl ? (
                              <img src={course.bannerUrl} alt={course.name} className="w-full h-full object-cover" />
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
                            <span className="text-[11px] text-gray-400">{course.country}</span>
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
                          <span className="text-lg">
                            {course.country === 'NG' ? '🇳🇬' : 
                             course.country === 'ZW' ? '🇿🇼' : 
                             course.country === 'ZA' ? '🇿🇦' : 
                             course.country === 'KE' ? '🇰🇪' : 
                             course.country === 'TZ' ? '🇹🇿' : '🏳️'}
                          </span>
                          <span className="text-[13px] font-medium text-gray-700">
                            {course.country === 'NG' ? 'Nigeria' : 
                             course.country === 'ZW' ? 'Zimbabwe' : 
                             course.country === 'ZA' ? 'South Africa' : 
                             course.country === 'KE' ? 'Kenya' : 
                             course.country === 'TZ' ? 'Tanzania' : course.country}
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
                              setIsModalOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                            onClick={() => {
                              setSelectedCourse(course);
                              setIsModalOpen(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
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

      <CourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCourses}
        course={selectedCourse}
      />
    </div>
  );
}
