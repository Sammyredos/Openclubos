"use client";

import React, { useEffect, useState, useMemo } from "react";
import { getPublicLeaderboardData } from "@/lib/api/scores";
import { Trophy, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";

const ITEMS_PER_PAGE = 10;

interface PublicLeaderboardProps {
  tournamentId: string;
  tournamentStartDate: string;
}

export default function PublicLeaderboard({ tournamentId, tournamentStartDate }: PublicLeaderboardProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const leaderboardSortBy: string = "GROSS";

  // Determine whether to show player names
  const isTournamentDay = useMemo(() => {
    if (!tournamentStartDate) return false;
    const now = new Date();
    const start = new Date(tournamentStartDate);
    // Show names only on or after the start date (comparing dates, not times)
    const todayStr = now.toISOString().slice(0, 10);
    const startStr = start.toISOString().slice(0, 10);
    return todayStr >= startStr;
  }, [tournamentStartDate]);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const { registrations, scores } = await getPublicLeaderboardData(tournamentId);

        const playersMap: Record<string, any> = {};

        registrations.forEach((reg: any) => {
          if (reg.user) {
            playersMap[reg.user.id] = {
              user: reg.user,
              status: reg.status,
              grossStrokes: 0,
              toPar: 0,
              holesCompleted: new Set(),
              points: 0,
              extraStrokes: reg.extraStrokes || 0,
              madeCut: reg.madeCut,
              registrationId: reg.id,
              rounds: {},
              holeCounts: {},
            };
          }
        });

        scores.forEach((s: any) => {
          const uid = s.userId;
          if (!playersMap[uid]) return;

          const p = playersMap[uid];
          const holeKey = s.holeId;

          p.holeCounts[holeKey] = (p.holeCounts[holeKey] || 0) + 1;
          const roundNum = p.holeCounts[holeKey];

          p.grossStrokes += s.strokes || 0;
          p.toPar += (s.strokes - (s.hole?.par || 4));
          p.points += s.points || 0;
          p.holesCompleted.add(`${roundNum}-${s.holeId}`);
          p.rounds[roundNum] = (p.rounds[roundNum] || 0) + (s.strokes || 0);
        });

        const leaderboard = Object.values(playersMap)
          .map((p: any) => {
            const rawGross = p.grossStrokes;
            const handicapIndex = p.user?.handicap || 0;
            const extra = p.extraStrokes || 0;
            const holesPlayed = p.holesCompleted.size;

            const playingHandicap = Math.round(handicapIndex);
            const totalHandicap = Math.round(playingHandicap * (holesPlayed / 18));

            const gross = rawGross > 0 ? (rawGross + extra) : 0;
            const grossToPar = rawGross > 0 ? (p.toPar + extra) : 0;
            const net = gross > 0 ? (gross - totalHandicap) : 0;
            const netToPar = gross > 0 ? (grossToPar - totalHandicap) : 0;

            return {
              ...p,
              grossStrokes: gross,
              toPar: leaderboardSortBy === "NET" ? netToPar : grossToPar,
              holesCount: p.holesCompleted.size,
              netStrokes: net,
            };
          })
          .sort((a, b) => {
            if (a.status === "DISQUALIFIED" && b.status !== "DISQUALIFIED") return 1;
            if (b.status === "DISQUALIFIED" && a.status !== "DISQUALIFIED") return -1;

            if (a.madeCut === false && b.madeCut !== false) return 1;
            if (b.madeCut === false && a.madeCut !== false) return -1;

            if (a.grossStrokes === 0 && b.grossStrokes > 0) return 1;
            if (b.grossStrokes === 0 && a.grossStrokes > 0) return -1;
            if (a.grossStrokes === 0 && b.grossStrokes === 0) return 0;

            if (leaderboardSortBy === "NET") {
              return a.netStrokes - b.netStrokes || a.grossStrokes - b.grossStrokes;
            } else {
              return a.toPar - b.toPar || a.grossStrokes - b.grossStrokes || a.netStrokes - b.netStrokes;
            }
          });

        setData(leaderboard);
      } catch (err) {
        console.error("Failed to load leaderboard data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLeaderboard();
  }, [tournamentId]);

  const filteredData = useMemo(() => {
    if (!debouncedSearch) return data;
    const q = debouncedSearch.toLowerCase();
    return data.filter((entry) => {
      const name = `${entry.user.firstName || ""} ${entry.user.lastName || ""}`.toLowerCase();
      return name.includes(q) || entry.user.email?.toLowerCase().includes(q);
    });
  }, [data, debouncedSearch]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Helper: mask a player name
  const getDisplayName = (user: any) => {
    if (isTournamentDay) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    // Before tournament day, mask the name
    const first = user.firstName || "";
    const last = user.lastName || "";
    if (!first && !last) return "Player";
    const maskedFirst = first ? first[0] + "•".repeat(Math.max(first.length - 1, 2)) : "";
    const maskedLast = last ? last[0] + "•".repeat(Math.max(last.length - 1, 2)) : "";
    return `${maskedFirst} ${maskedLast}`.trim();
  };

  const getInitials = (user: any) => {
    if (isTournamentDay) {
      return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`;
    }
    return "?";
  };

  if (isLoading) {
    return (
      <div className="mt-4">
        <div className="bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-hidden">
          <div className="px-6 pt-6 pb-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center border-b border-gray-100">
            <h2 className="text-[17px] font-medium text-gray-900 flex items-center gap-2.5">
              <Trophy className="w-5 h-5 text-openclub-600" />
              Tournament Leaderboard
            </h2>
            <div className="relative w-full md:w-80 opacity-60 pointer-events-none">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search players..."
                className="pl-10 h-11 text-[14px] rounded-lg bg-gray-50 text-gray-400"
                disabled
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#f5faf6] border-b border-[#e1efe5] text-[12px] font-semibold text-[#15803D] uppercase tracking-wider">
                  <th className="px-6 py-4 text-center w-16">POS</th>
                  <th className="px-6 py-4">PLAYER</th>
                  <th className="px-6 py-4 text-center">HOLES</th>
                  <th className="px-6 py-4 text-center">GROSS</th>
                  <th className="px-6 py-4 text-center">HCP</th>
                  <th className="px-6 py-4 text-center">NET</th>
                  <th className="px-6 py-4 text-center">TO PAR</th>
                  <th className="px-6 py-4 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-4 mx-auto" /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-6 mx-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-8 mx-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-8 mx-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-8 mx-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-10 mx-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full mx-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination Skeleton */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
            <Skeleton className="h-4 w-40" />
            <div className="flex items-center gap-2">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <Skeleton className="w-9 h-9 rounded-lg" />
              <Skeleton className="w-9 h-9 rounded-lg" />
              <Skeleton className="w-9 h-9 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center border-b border-gray-100">
          <h2 className="text-[17px] font-medium text-gray-900 flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-openclub-600" />
            Tournament Leaderboard
          </h2>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search players..."
              className="pl-10 h-11 text-[14px] rounded-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filteredData.length === 0 ? (
          <div className="text-center py-16 px-6">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-[15px] font-medium text-gray-900">No Leaderboard Data</h3>
            <p className="text-[14px] text-gray-500 mt-1">No scores have been recorded or found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[#f5faf6] border-b border-[#e1efe5] text-[12px] font-semibold text-[#15803D] uppercase tracking-wider">
                    <th className="px-6 py-4 text-center w-16">POS</th>
                    <th className="px-6 py-4">PLAYER</th>
                    <th className="px-6 py-4 text-center">HOLES</th>
                    <th className="px-6 py-4 text-center">GROSS</th>
                    <th className="px-6 py-4 text-center">HCP</th>
                    <th className="px-6 py-4 text-center">NET</th>
                    <th className="px-6 py-4 text-center">TO PAR</th>
                    <th className="px-6 py-4 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-[13px]">
                  {paginatedData.map((entry, index) => {
                    const globalRank = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                    return (
                      <tr key={entry.user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-center font-medium text-gray-900">
                          {entry.status === "DISQUALIFIED" ? "DQ" : globalRank}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {isTournamentDay && entry.user.profilePhoto ? (
                              <img src={entry.user.profilePhoto} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-gray-100" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-openclub-100 flex items-center justify-center text-openclub-700 font-medium text-[12px]">
                                {getInitials(entry.user)}
                              </div>
                            )}
                            <span className="font-medium text-gray-900">
                              {getDisplayName(entry.user)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-medium text-gray-900">{entry.holesCount || 0}</span>
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-gray-900">{entry.grossStrokes || 0}</td>
                        <td className="px-6 py-4 text-center text-gray-500">{Math.round(entry.user.handicap || 0)}</td>
                        <td className="px-6 py-4 text-center font-medium text-openclub-700">{entry.netStrokes || 0}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-[12px] font-medium ${
                            entry.toPar < 0 ? 'bg-red-50 text-red-700' :
                            entry.toPar > 0 ? 'bg-blue-50 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {entry.toPar === 0 ? "E" : entry.toPar > 0 ? `+${entry.toPar}` : entry.toPar}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {entry.status === "DISQUALIFIED" ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium bg-red-50 text-red-700 uppercase tracking-wider">
                              Disqualified
                            </span>
                          ) : entry.madeCut === false ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium bg-gray-100 text-gray-600 uppercase tracking-wider">
                              Missed Cut
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium bg-green-50 text-green-700 uppercase tracking-wider">
                              Active
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-[13px] text-gray-500">
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} of {filteredData.length} players
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="w-9 h-9 rounded-lg border border-[#e1efe5] bg-background text-gray-500 hover:bg-gray-100 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-9 h-9 rounded-lg text-[13px] font-normal flex items-center justify-center transition-colors border ${
                        currentPage === page
                          ? "bg-[#15803D] text-white border-[#15803D]"
                          : "bg-white text-gray-500 border-transparent hover:bg-background hover:border-[#e1efe5]"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="w-9 h-9 rounded-lg border border-[#e1efe5] bg-background text-gray-500 hover:bg-gray-100 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
