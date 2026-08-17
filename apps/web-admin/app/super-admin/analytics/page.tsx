"use client";

import { useMemo, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Download,
  Search,
  Users,
  Database,
  Trophy,
  CreditCard,
  Building2,
  Clock,
  ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { formatNumber } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";

function formatDate(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

function StatusBadge({ status }: { status: string }) {
  if (status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-medium uppercase whitespace-nowrap bg-emerald-50 text-emerald-700 border-emerald-100">
        <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-medium uppercase whitespace-nowrap bg-gray-50 text-gray-700 border-gray-200">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
      Inactive
    </span>
  );
}

const mockOrganizers = [
  { id: "ORG-001", name: "Lagos Golf Club", plan: "PRO", tournaments: 12, storageMB: 450.5, joinDate: "2024-01-15T10:00:00Z", status: "ACTIVE" },
  { id: "ORG-002", name: "Abuja Country Club", plan: "PREMIUM", tournaments: 34, storageMB: 1200.2, joinDate: "2023-11-02T14:30:00Z", status: "ACTIVE" },
  { id: "ORG-003", name: "Ikoyi Golfers", plan: "STARTER", tournaments: 3, storageMB: 50.1, joinDate: "2024-05-20T09:15:00Z", status: "INACTIVE" },
  { id: "ORG-004", name: "Port Harcourt Links", plan: "PRO", tournaments: 8, storageMB: 310.8, joinDate: "2024-02-10T16:45:00Z", status: "ACTIVE" },
  { id: "ORG-005", name: "Ibadan Greens", plan: "STARTER", tournaments: 1, storageMB: 12.0, joinDate: "2024-07-01T11:20:00Z", status: "ACTIVE" },
];

export default function AnalyticsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filteredData = useMemo(() => {
    return mockOrganizers.filter(org => {
      const matchesSearch = org.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        org.id.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || org.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [debouncedSearch, statusFilter]);

  const totalOrganizers = 156;
  const storageUsedGB = 24.5;
  const activeTournaments = 42;
  const platformRevenue = 12500000; // 12.5M

  return (
    <div className="space-y-8 w-full max-w-full px-2 pb-10 font-sans">
      <div className="w-full bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-x-auto">
        <div className="flex items-center justify-between p-8 min-w-max gap-12 font-sans">

          <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
            <div className="flex justify-start items-center gap-3.5">
              <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Total Organizers</div>
              <div className="px-2 py-1 bg-green-50 rounded-lg flex justify-center items-center gap-1.5">
                <ArrowUpRight className="w-3 h-3 text-[#15803D]" />
                <div className="text-[#15803D] text-xs font-medium">12.5%</div>
              </div>
            </div>
            <div className="text-[#15803D] text-3xl font-semibold">{formatNumber(totalOrganizers)}</div>
            <div className="text-zinc-500 text-sm font-normal">Registered clubs</div>
          </div>

          <div className="w-px h-16 bg-slate-200" />

          <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
            <div className="flex justify-start items-center gap-3.5">
              <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Platform Storage</div>
              <div className="px-2 py-1 bg-orange-50 rounded-lg flex justify-center items-center gap-1.5">
                <ArrowUpRight className="w-3 h-3 text-orange-600" />
                <div className="text-orange-600 text-xs font-medium">5.2%</div>
              </div>
            </div>
            <div className="text-[#15803D] text-3xl font-semibold">{storageUsedGB} GB</div>
            <div className="text-zinc-500 text-sm font-normal">Total files & reports</div>
          </div>

          <div className="w-px h-16 bg-slate-200" />

          <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
            <div className="flex justify-start items-center gap-3.5">
              <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Active Tournaments</div>
            </div>
            <div className="text-[#15803D] text-3xl font-semibold">{formatNumber(activeTournaments)}</div>
            <div className="text-zinc-500 text-sm font-normal">Currently running</div>
          </div>

          <div className="w-px h-16 bg-slate-200" />

          <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
            <div className="flex justify-start items-center gap-3.5">
              <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Platform Revenue</div>
            </div>
            <div className="text-[#15803D] text-3xl font-semibold">₦{formatNumber(platformRevenue)}</div>
            <div className="text-zinc-500 text-sm font-normal">All time earnings</div>
          </div>

        </div>
      </div>

      <div className="w-full space-y-6">
        <Card className="border-none shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
            <CardTitle className="text-zinc-700 text-xl font-medium whitespace-nowrap">Organizer Statistics</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                className="h-10 bg-white border border-gray-200 text-gray-700 gap-2 rounded-lg px-4 text-[14px] font-medium hover:bg-gray-50"
              >
                <Download className="w-4 h-4" /> Export Data
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="px-6 pb-6">
              <div className="bg-background rounded-xl border border-[#e1efe5] overflow-hidden">
                <div className="p-5 border-b border-[#e1efe5]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#15803D]" />
                      <Input
                        placeholder="Search organizers by name or ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-11 rounded-lg text-[14px] border-[#e1efe5] bg-white text-[#15803D] focus:bg-gray-50 placeholder:text-[#15803D]/60"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <SearchableSelect
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                        options={[
                          { value: "ALL", label: "All Statuses" },
                          { value: "ACTIVE", label: "Active" },
                          { value: "INACTIVE", label: "Inactive" },
                        ]}
                        className="min-w-[160px]"
                        triggerClassName="h-11 bg-white border-[#e1efe5] text-[#15803D] font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#f5faf6] border-y border-[#e1efe5]">
                      <tr>
                        <th className="px-6 py-3 text-gray-600 font-normal">Organizer Name</th>
                        <th className="px-6 py-3 text-gray-600 font-normal">Plan</th>
                        <th className="px-6 py-3 text-gray-600 font-normal">Tournaments</th>
                        <th className="px-6 py-3 text-gray-600 font-normal">Storage</th>
                        <th className="px-6 py-3 text-gray-600 font-normal">Joined</th>
                        <th className="px-6 py-3 text-gray-600 font-normal">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e1efe5] bg-white">
                      {filteredData.length > 0 ? (
                        filteredData.slice((page - 1) * perPage, page * perPage).map((org) => (
                          <tr key={org.id} className="hover:bg-gray-50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-[14px] font-medium text-gray-900 group-hover:text-[#15803D] transition-colors">{org.name}</span>
                                <span className="text-[12px] text-gray-500">{org.id}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <span className="text-[13px] text-gray-700 font-medium">{org.plan}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[13px] text-gray-600">{org.tournaments} Hosted</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[13px] text-gray-600">{org.storageMB.toFixed(1)} MB</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center text-[13px] text-gray-600">
                                <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                                {formatDate(org.joinDate)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={org.status} />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-500">
                              <Users className="w-12 h-12 mb-4 text-gray-300" />
                              <p className="text-base font-medium text-gray-900">No organizers found</p>
                              <p className="text-sm mt-1">Try adjusting your search filters</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {filteredData.length > 0 && (
                  <div className="px-6 py-4 border-t border-[#e1efe5] bg-gray-50 flex items-center justify-between">
                    <span className="text-[13px] text-gray-500 font-medium">
                      Showing {Math.min((page - 1) * perPage + 1, filteredData.length)} to {Math.min(page * perPage, filteredData.length)} of {filteredData.length} entries
                    </span>
                    <Pagination
                      currentPage={page}
                      totalPages={Math.ceil(filteredData.length / perPage)}
                      onPageChange={setPage}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
