"use client";

import { useEffect, useState } from "react";
import { getAuthToken } from "@/lib/api/auth";
import { usePathname } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export function LiveTickerStrip() {
  const [ongoing, setOngoing] = useState(0);
  const [scores, setScores] = useState(1284);
  const [spectators, setSpectators] = useState(3910);
  const [liveNames, setLiveNames] = useState("No active tournaments");
  const pathname = usePathname();

  const isDashboard = pathname === "/super-admin/dashboard" || pathname === "/organizer-admin/dashboard" || pathname === "/";

  useEffect(() => {
    // Fetch real stats to get active tournaments count, names, scores, and spectators
    const fetchStats = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;
        const res = await fetch(`${API_BASE}/super-admin/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.activeTournaments !== undefined) {
            setOngoing(data.activeTournaments);
          }
          if (data.scoresLastHour !== undefined) {
            setScores(data.scoresLastHour);
          }
          if (data.spectatorsWatching !== undefined) {
            setSpectators(data.spectatorsWatching);
          }

          if (data.activeTournamentNames && Array.isArray(data.activeTournamentNames) && data.activeTournamentNames.length > 0) {
            const names = data.activeTournamentNames;
            if (data.activeTournaments > 2 && names.length >= 2) {
              setLiveNames(`${names[0]} · ${names[1]} · +${data.activeTournaments - 2} live`);
            } else if (names.length >= 2) {
              setLiveNames(`${names[0]} · ${names[1]}`);
            } else {
              setLiveNames(names[0]);
            }
          } else if (data.activeTournaments > 0) {
            setLiveNames(`${data.activeTournaments} active tournaments`);
          } else {
            setLiveNames("No active tournaments");
          }
        }
      } catch (e) {
        // Fallback
      }
    };
    
    fetchStats();
    
    // Poll the backend every 30 seconds to keep the numbers live
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (!isDashboard) return null;

  return (
    <div className="w-full bg-[#0a2316] h-14 flex items-center px-8 justify-between text-sm border-b border-[#0f3422] shrink-0">
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
          <span className="text-white font-semibold tracking-wide uppercase text-xs">Live now</span>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 text-emerald-200/80">
            <span className="text-white font-bold text-[15px]">{ongoing}</span> 
            <span>tournaments ongoing</span>
          </div>
          
          <div className="flex items-center gap-2 text-emerald-200/80">
            <span className="text-white font-bold text-[15px]">{scores.toLocaleString()}</span> 
            <span>scores last hour</span>
          </div>
          
          <div className="flex items-center gap-2 text-emerald-200/80">
            <span className="text-white font-bold text-[15px]">{spectators.toLocaleString()}</span> 
            <span>spectators watching</span>
          </div>
        </div>
      </div>
      
      <div className="text-emerald-200/80 font-medium max-w-lg truncate" title={liveNames}>
        {liveNames}
      </div>
    </div>
  );
}
