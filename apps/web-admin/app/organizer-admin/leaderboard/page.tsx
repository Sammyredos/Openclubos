"use client";

import React, { useState, useEffect, useSyncExternalStore, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Search,
  Eye,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, SearchableSelect } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatWithCommas } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { getTournaments } from "@/lib/api/tournaments";
import { useAuth } from "@/lib/auth/AuthContext";

type TournamentStatus = "DRAFT" | "REGISTRATION_OPEN" | "ONGOING" | "COMPLETED" | "CANCELLED";

type ApiTournament = {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  status: TournamentStatus;
  entryFee: number | null;
  requiresPayment: boolean;
  maxPlayers: number | null;
  registrationDeadline?: string | null;
  playerTypes: string[];
  club: { id: string; name: string; logo?: string | null } | null;
  course?: { id: string; name: string } | null;
  visibility: "PUBLIC" | "PRIVATE" | "INVITE_ONLY";
  enableWaitlist?: boolean;
  createdAt: string;
  updatedAt?: string;
  scoringType?: string;
  format?: string;
  holes?: number;
  description?: string;
  lockedGroupingsDays?: number[];
  _count?: { registrations: number };
};

type TournamentRow = {
  id: string;
  name: string;
  clubName: string;
  clubLogo: string | null;
  courseName: string;
  dates: string;
  status: string;
  badge: string;
  statusKey: TournamentStatus;
  format?: string;
  rounds?: string;
  lastUpdated: string;
};

const STATUS_META: Record<TournamentStatus, { label: string; color: string; badge: string }> = {
  DRAFT: { label: "Draft", color: "#94a3b8", badge: "bg-slate-50 text-gray-600" },
  REGISTRATION_OPEN: { label: "Upcoming", color: "#15803D", badge: "bg-emerald-50 text-openclub-800" },
  ONGOING: { label: "Ongoing", color: "#3b82f6", badge: "bg-blue-50 text-blue-600" },
  COMPLETED: { label: "Completed", color: "#8b5cf6", badge: "bg-violet-50 text-violet-600" },
  CANCELLED: { label: "Cancelled", color: "#f43f5e", badge: "bg-rose-50 text-rose-600" },
};

function formatDateRange(startISO: string, endISO: string | null) {
  const start = new Date(startISO);
  const end = endISO ? new Date(endISO) : null;
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (!end) return fmt.format(start);
  return `${fmt.format(start)} - ${fmt.format(end)}`;
}

function getCurrentRound(startDateISO: string, endDateISO: string | null): string {
  const start = new Date(startDateISO);
  start.setHours(0, 0, 0, 0);
  
  let totalRounds = 1;
  if (endDateISO) {
    const end = new Date(endDateISO);
    end.setHours(0, 0, 0, 0);
    const totalDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (totalDiff >= 0) {
      totalRounds = totalDiff + 1;
    }
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  let currentRound = 1;
  if (diffDays >= 0) {
    currentRound = diffDays + 1;
  }
  
  if (currentRound > totalRounds) {
    currentRound = totalRounds;
  }
  
  return `${currentRound}/${totalRounds}`;
}

function isWithinMonth(dateISO: string, year: number, monthIndex: number) {
  const d = new Date(dateISO);
  return d.getFullYear() === year && d.getMonth() === monthIndex;
}

export default function LeaderboardDirectoryPage() {
  const router = useRouter();
  const { user } = useAuth();

  const isMounted = useSyncExternalStore(
    () => () => { },
    () => true,
    () => false,
  );
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [monthFilter, setMonthFilter] = useState("All Months");
  const [yearFilter, setYearFilter] = useState("All Years");
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tournaments, setTournaments] = useState<ApiTournament[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!user?.clubId) return;
    setLoading(true);
    getTournaments({ clubId: user.clubId })
      .then((data) => {
        setTournaments(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load tournaments");
      })
      .finally(() => setLoading(false));
  }, [user?.clubId]);

  const uniqueStatuses = useMemo(() => {
    const s = new Set(tournaments.map(t => STATUS_META[t.status].label));
    return Array.from(s).sort();
  }, [tournaments]);

  const uniqueYears = useMemo(() => {
    const y = new Set(tournaments.map(t => new Date(t.startDate).getFullYear()));
    return Array.from(y).sort((a, b) => b - a).map(String);
  }, [tournaments]);

  const uniqueMonths = useMemo(() => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const m = new Set(tournaments.map(t => months[new Date(t.startDate).getMonth()]));
    return Array.from(m).sort((a, b) => months.indexOf(a) - months.indexOf(b));
  }, [tournaments]);

  const filteredTournaments: TournamentRow[] = useMemo(() => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return tournaments
      .filter((t) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!t.name.toLowerCase().includes(q) && !t.club?.name.toLowerCase().includes(q)) return false;
        }
        if (statusFilter !== "All Status" && STATUS_META[t.status].label !== statusFilter) return false;
        
        const d = new Date(t.startDate);
        if (yearFilter !== "All Years" && d.getFullYear().toString() !== yearFilter) return false;
        if (monthFilter !== "All Months" && !isWithinMonth(t.startDate, d.getFullYear(), months.indexOf(monthFilter))) return false;
        
        return true;
      })
      .map((t) => ({
        id: t.id,
        name: t.name,
        clubName: t.club?.name || "Unknown Club",
        clubLogo: t.club?.logo || null,
        courseName: t.course?.name || "TBA",
        dates: formatDateRange(t.startDate, t.endDate),
        status: STATUS_META[t.status].label,
        badge: STATUS_META[t.status].badge,
        statusKey: t.status,
        format: t.format || "Stroke Play",
        rounds: getCurrentRound(t.startDate, t.endDate),
        lastUpdated: t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : new Date(t.createdAt).toLocaleDateString()
      }));
  }, [tournaments, searchQuery, statusFilter, yearFilter, monthFilter]);

  const totalPages = Math.ceil(filteredTournaments.length / itemsPerPage);

  const openView = (t: TournamentRow) => {
    router.push(`/organizer-admin/leaderboard/${t.id}`);
  };

  return (
    <div className="space-y-8 w-full max-w-full px-2 pb-10 font-sans mt-4">
      <div className="w-full">
        <Card className="border-0 rounded-xl shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex flex-col w-full bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-4 px-6 pt-6">
            <CardTitle className="text-zinc-700 text-xl font-medium">Tournament Leaderboards</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Filters */}
            <div className="px-6 pb-6 flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#15803D]" />
                <Input
                  placeholder="Search tournament name..."
                  className="pl-10 h-11 rounded-lg text-[14px] border-[#e1efe5] bg-[#f5faf6] text-[#15803D] focus:bg-[#e1efe5] placeholder:text-[#15803D]/60"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <SearchableSelect
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v)}
                options={["All Status", ...uniqueStatuses].map((v) => ({ value: v, label: v }))}
                className="min-w-[160px]"
                triggerClassName="h-11 bg-[#f5faf6] border-[#e1efe5] text-[#15803D] font-medium"
                placeholder="All Status"
              />
              <SearchableSelect
                value={monthFilter}
                onValueChange={(v) => setMonthFilter(v)}
                options={["All Months", ...uniqueMonths].map((v) => ({ value: v, label: v }))}
                className="min-w-[160px]"
                triggerClassName="h-11 bg-[#f5faf6] border-[#e1efe5] text-[#15803D] font-medium"
                placeholder="All Months"
              />
              <SearchableSelect
                value={yearFilter}
                onValueChange={(v) => setYearFilter(v)}
                options={["All Years", ...uniqueYears].map((v) => ({ value: v, label: v }))}
                className="min-w-[160px]"
                triggerClassName="h-11 bg-[#f5faf6] border-[#e1efe5] text-[#15803D] font-medium"
                placeholder="All Years"
              />
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto min-h-[400px]">
              <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-[#f5faf6] border-b border-[#e1efe5] text-[12px] font-semibold text-[#15803D] uppercase tracking-wider">
                    <th className="px-6 py-4 text-[12px] font-semibold text-[#15803D] uppercase tracking-wider">TOURNAMENT</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-[#15803D] uppercase tracking-wider">GOLF COURSE</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-[#15803D] uppercase tracking-wider">DATES</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-[#15803D] uppercase tracking-wider">FORMAT</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-[#15803D] uppercase tracking-wider">ROUNDS</th>
                    <th className="px-6 py-4 text-[12px] font-semibold text-[#15803D] uppercase tracking-wider">STATUS</th>
                    <th className="px-6 py-4 text-center text-[12px] font-semibold text-[#15803D] uppercase tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e1efe5]">
                  {error ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-red-500 font-normal text-[13px]">
                        {error}
                      </td>
                    </tr>
                  ) : loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="hover:bg-background/50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                            <div className="flex flex-col gap-1.5">
                              <Skeleton className="h-4 w-32 rounded-md" />
                              <Skeleton className="h-3 w-24 rounded-md" />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                            <div className="flex flex-col gap-1.5">
                              <Skeleton className="h-4 w-28 rounded-md" />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5"><Skeleton className="h-4 w-24 rounded-md" /></td>
                        <td className="px-6 py-5"><Skeleton className="h-4 w-20 rounded-md" /></td>
                        <td className="px-6 py-5"><Skeleton className="h-4 w-12 rounded-md" /></td>
                        <td className="px-6 py-5"><Skeleton className="h-5.5 w-16 rounded-full" /></td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-2">
                            <Skeleton className="h-7 w-32 rounded-md" />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : filteredTournaments.length > 0 ? (
                    filteredTournaments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((t) => (
                      <tr key={t.id} className="hover:bg-background/50 transition-colors group cursor-pointer" onClick={() => openView(t)}>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3 min-w-[220px]">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-openclub-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform border border-[#e1efe5]">
                              <Trophy className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col min-w-0 gap-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-900 text-[14px] font-medium truncate leading-tight" title={t.name}>{t.name}</span>
                                {t.statusKey === "ONGOING" && (
                                  <span className="inline-flex items-center bg-[#22c55e] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-sm tracking-wide">Live</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            {t.clubLogo ? (
                              <img src={t.clubLogo} alt={t.courseName} className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#e1efe5]" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#f5faf6] text-[#15803D] flex items-center justify-center text-xs font-semibold border border-[#e1efe5] flex-shrink-0 uppercase">
                                {t.clubName.substring(0, 2)}
                              </div>
                            )}
                            <div className="flex flex-col min-w-0 gap-1.5">
                              <span className="text-[13px] text-gray-600 font-medium truncate leading-tight">{t.courseName}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col min-w-0">
                            <span className="text-[13px] text-gray-600 font-medium truncate leading-tight">{t.dates}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col min-w-0">
                            <span className="text-[13px] text-gray-600 font-medium truncate leading-tight">{t.format}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="text-slate-900 text-[13px] font-medium leading-tight">{t.rounds}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap uppercase border", t.badge)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full",
                              t.statusKey === "ONGOING" ? "bg-[#15803D]" :
                                t.statusKey === "REGISTRATION_OPEN" ? "bg-[#15803D]" :
                                  t.statusKey === "COMPLETED" ? "bg-blue-500" :
                                    t.statusKey === "CANCELLED" ? "bg-red-500" :
                                      "bg-gray-400")} />
                            {t.status}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openView(t);
                              }}
                              className="h-8 px-4 inline-flex items-center justify-center gap-1.5 rounded-md bg-[#15803D] text-white hover:bg-openclub-800 transition-colors border border-[#15803D] shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="text-[12px] font-medium leading-none">View Leaderboard</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <EmptyState
                          icon={Trophy}
                          title="No leaderboards found"
                          description="Try adjusting your filters or search query to find what you're looking for."
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-6 border-t border-gray-50 flex items-center justify-between">
              <p className="text-[13px] text-gray-500">
                Showing {filteredTournaments.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredTournaments.length)} of {filteredTournaments.length} tournaments
              </p>
              <Pagination
                currentPage={currentPage}
                totalPages={Math.max(1, totalPages)}
                onPageChange={setCurrentPage}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
