"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { getGroupings, getTournament } from "@/lib/api/tournaments";
import { Loader2, Flag } from "lucide-react";
import { cn, getGolfCategory } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Types derived from backend data
type Tournament = any;
type GroupingData = any;

export default function TVDisplayPage() {
  const params = useParams();
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [groupingsData, setGroupingsData] = useState<GroupingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination for TV Carousel
  const [currentPage, setCurrentPage] = useState(0);
  const groupsPerPage = 2; // Number of flights to show per screen

  // 1. Initial Load & Auto-Refresh Data (every 30 seconds)
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [tData, gData] = await Promise.all([
          getTournament(tournamentId),
          getGroupings(tournamentId, 1), // Assuming Day 1 for now, could be dynamic
        ]);

        if (isMounted) {
          setTournament(tData);
          setGroupingsData(gData);
          setError(null);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("TV Display fetch error:", err);
          setError("Failed to load tournament data. Retrying...");
          // Keep loading false so we can show the error, but the interval will retry
          setLoading(false); 
        }
      }
    };

    // Fetch immediately
    fetchData();

    // Re-fetch every 60 seconds to get live updates
    const refreshInterval = setInterval(fetchData, 60000);

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, [tournamentId]);

  // 2. Auto-Pagination (every 10 seconds)
  const totalPages = useMemo(() => {
    if (!groupingsData?.groups) return 0;
    return Math.ceil(groupingsData.groups.length / groupsPerPage);
  }, [groupingsData]);

  useEffect(() => {
    if (totalPages <= 1) return;

    const pageInterval = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, 10000);

    return () => clearInterval(pageInterval);
  }, [totalPages]);

  // Show Loading state initially
  if (loading && !tournament) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <header className="bg-white shadow-sm border-b border-gray-200 px-10 py-6 flex justify-between items-center z-10 relative">
          <div>
            <Skeleton className="h-10 w-96 mb-2 rounded-lg" />
            <Skeleton className="h-6 w-48 rounded-md" />
          </div>
          <div className="bg-gray-100 rounded-full px-6 py-3 flex items-center gap-2">
            <Skeleton className="h-6 w-24 rounded-md" />
          </div>
        </header>

        <main className="flex-1 p-10 overflow-hidden flex flex-col">
          <div className="grid grid-cols-2 gap-8 flex-1 content-start">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-full">
                <div className="bg-openclub-700 px-8 py-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-xl bg-white/20" />
                    <div>
                      <Skeleton className="h-8 w-48 bg-white/30 mb-2 rounded-md" />
                      <Skeleton className="h-5 w-24 bg-white/30 rounded-md" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-8 w-16 bg-white/30 mb-1 rounded-md ml-auto" />
                    <Skeleton className="h-4 w-20 bg-white/30 rounded-md" />
                  </div>
                </div>

                <div className="p-0 flex-1 bg-white">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex items-center justify-between px-8 py-5 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-4">
                        <Skeleton className="w-14 h-14 rounded-full" />
                        <Skeleton className="h-8 w-64 rounded-md" />
                      </div>
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-md" />
                        <Skeleton className="w-20 h-8 rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
        
        <footer className="bg-gray-900 text-gray-400 py-3 px-10 flex justify-between text-sm">
          <Skeleton className="h-4 w-48 bg-gray-700 rounded" />
          <Skeleton className="h-4 w-24 bg-gray-700 rounded" />
        </footer>
      </div>
    );
  }

  // Show Error state if we never got data
  if (error && !tournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-red-50 text-red-600 p-8 rounded-2xl max-w-xl text-center shadow-sm">
          <h2 className="text-3xl font-semibold mb-2">Connection Error</h2>
          <p className="text-xl opacity-90">{error}</p>
        </div>
      </div>
    );
  }

  const currentGroups = groupingsData?.groups?.slice(
    currentPage * groupsPerPage,
    (currentPage + 1) * groupsPerPage
  ) || [];

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white px-10 py-6 border-b border-gray-200 shadow-sm flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            {tournament?.name || "Tournament Pairings"}
          </h1>
          <p className="text-xl text-gray-500 mt-2">
            Round 1 Tee Times &bull; {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        {/* Pagination Indicator (if multiple pages) */}
        {totalPages > 1 && (
          <div className="bg-gray-100 rounded-full px-6 py-3 flex items-center gap-2">
            <span className="text-gray-500 text-lg font-medium">Page</span>
            <span className="text-gray-900 text-2xl font-bold">{currentPage + 1}</span>
            <span className="text-gray-400 text-xl mx-1">/</span>
            <span className="text-gray-600 text-xl font-medium">{totalPages}</span>
          </div>
        )}
      </header>

      {/* Main Content Area - Auto scales to fit */}
      <main className="flex-1 p-10 overflow-hidden flex flex-col">
        {groupingsData?.groups?.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center max-w-2xl">
              <Flag className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h2 className="text-4xl font-semibold text-gray-800 mb-4">No Pairings Available</h2>
              <p className="text-xl text-gray-500">Tee times have not been generated for this tournament yet. Please check back later.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-8 flex-1 content-start">
            {currentGroups.map((group: any, idx: number) => {
              const playerCount = group.registrations?.length || 0;
              const maxPlayers = tournament?.maxPlayersPerGroup || 4;
              const isFull = playerCount >= maxPlayers;

              return (
                <div key={group.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">
                  {/* Flight Header (Green) */}
                  <div className="bg-openclub-700 px-8 py-6 flex items-center justify-between text-white">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Flag className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold">{group.name || `Flight ${currentPage * groupsPerPage + idx + 1}`}</h3>
                        <div className="flex items-center gap-2 text-openclub-100 mt-1 text-2xl">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          <span>{group.startTime || "TBD"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{playerCount}/{maxPlayers}</div>
                      <div className="text-sm text-openclub-100 uppercase tracking-wider font-medium">Players</div>
                    </div>
                  </div>

                  {/* Flight Players List */}
                  <div className="p-0 flex-1 bg-white">
                    {group.registrations?.map((reg: any, i: number) => {
                      const user = reg.user;
                      const gender = user?.gender || "MALE";

                      const hcp = Math.round(user?.handicap || 0);

                      return (
                        <div key={reg.id} className="flex items-center justify-between px-8 py-5 border-b border-gray-100 last:border-0">
                          <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                              <img 
                                src={user?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || reg.id)}`} 
                                alt="" 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                            <span className="text-3xl font-medium text-gray-900">
                              {user?.firstName} {user?.lastName}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Gender Badge */}
                            <div className={cn(
                              "px-4 h-10 rounded-md flex items-center justify-center text-lg font-bold uppercase",
                              gender.toUpperCase() === "MALE" ? "bg-blue-50 text-blue-500" : "bg-pink-50 text-pink-500"
                            )}>
                              {gender}
                            </div>
                            
                            {/* Category Badge */}
                            <div className="px-4 h-10 bg-purple-50 text-purple-600 rounded-md flex items-center justify-center text-lg font-bold uppercase">
                              {getGolfCategory(hcp)}
                            </div>
                            
                            {/* HCP Badge */}
                            <div className="px-4 h-10 bg-emerald-50 text-emerald-600 rounded-md flex items-center justify-center text-lg font-bold">
                              HCP {hcp}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Empty Slots */}
                    {Array.from({ length: Math.max(0, maxPlayers - playerCount) }).map((_, i) => (
                      <div key={`empty-${i}`} className="flex items-center justify-between px-8 py-5 border-b border-gray-100 last:border-0 opacity-40">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-gray-50 border border-dashed border-gray-300 shrink-0"></div>
                          <span className="text-2xl text-gray-400 italic">Available Slot</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      
      {/* Footer ticker/branding */}
      <footer className="bg-gray-900 text-gray-400 py-3 px-10 flex justify-between text-sm">
        <div>Live Pairings via Openclub OS</div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Auto-updating
        </div>
      </footer>
    </div>
  );
}
