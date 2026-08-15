"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getTournament } from "@/lib/api/tournaments";
import { getTournamentScores } from "@/lib/api/scores";
import { getRegistrations } from "@/lib/api/registrations";
import { Trophy, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TVLeaderboardPage() {
  const params = useParams();
  const tournamentId = params.id as string;

  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<any>(null);

  // Auto-scrolling state
  useEffect(() => {
    let scrollInterval: NodeJS.Timeout;
    
    // Start scrolling after a short delay to let data load
    const startScroll = () => {
      let scrollAmount = 0;
      scrollInterval = setInterval(() => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        
        if (maxScroll <= 0) return; // No need to scroll

        scrollAmount += 2; // Scroll speed (pixels per interval)
        
        if (scrollAmount >= maxScroll + 200) { // Wait a bit at the bottom
          scrollAmount = -200; // Reset with delay at top
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (scrollAmount > 0) {
          window.scrollTo(0, scrollAmount);
        }
      }, 50);
    };

    setTimeout(startScroll, 3000);

    return () => clearInterval(scrollInterval);
  }, [leaderboardData]);

  const loadData = async () => {
    if (!tournamentId) return;
    try {
      const [tData, scores] = await Promise.all([
        getTournament(tournamentId),
        getTournamentScores(tournamentId)
      ]);
      setTournament(tData);

      const [approvedRes, dqRes] = await Promise.all([
        getRegistrations({ tournamentId, status: "APPROVED", paymentStatus: "PAID", take: 100 }),
        getRegistrations({ tournamentId, status: "DISQUALIFIED", take: 100 })
      ]);

      const allRegs = [...(approvedRes.items || []), ...(dqRes.items || [])];
      const playersMap: Record<string, any> = {};

      allRegs.forEach((reg: any) => {
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
          };
        }
      });

      scores.forEach((s: any) => {
        const uid = s.userId;
        if (!playersMap[uid]) return;
        const p = playersMap[uid];

        p.grossStrokes += s.strokes || 0;
        p.toPar += (s.strokes - (s.hole?.par || 4));
        p.points += s.points || 0;
        p.holesCompleted.add(`${s.holeId}`);
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
            toPar: tData.scoringType === "NET" ? netToPar : grossToPar,
            holesCount: holesPlayed,
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

          if (tData.scoringType === "NET") {
            return a.netStrokes - b.netStrokes || a.grossStrokes - b.grossStrokes;
          } else {
            return a.toPar - b.toPar || a.grossStrokes - b.grossStrokes || a.netStrokes - b.netStrokes;
          }
        });

      setLeaderboardData(leaderboard);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0B1120] text-white flex flex-col items-center justify-center z-50">
        <Loader2 className="w-16 h-16 animate-spin text-emerald-500 mb-6" />
        <h2 className="text-3xl font-bold tracking-wider text-slate-200">LOADING LEADERBOARD...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200 font-sans absolute inset-0 z-50 overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0B1120]/95 backdrop-blur-md border-b border-white/10 px-12 py-8 flex items-center justify-between shadow-2xl">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-white uppercase drop-shadow-lg">
            {tournament?.name}
          </h1>
          <p className="text-2xl text-emerald-400 font-semibold mt-3 flex items-center gap-3">
            <Trophy className="w-7 h-7" />
            LIVE LEADERBOARD {tournament?.scoringType === 'NET' ? '(NET)' : '(GROSS)'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-6xl font-black text-white/90">
            {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="px-12 mt-8 mb-4 flex text-2xl font-bold text-slate-400 uppercase tracking-widest px-8">
        <div className="w-32 text-center">POS</div>
        <div className="flex-1">PLAYER</div>
        <div className="w-48 text-center">THRU</div>
        <div className="w-48 text-center">TOTAL</div>
        <div className="w-48 text-center">SCORE</div>
      </div>

      {/* Leaderboard Rows */}
      <div className="px-12 pb-24 space-y-4">
        {leaderboardData.map((player, index) => {
          let posDisplay: string | number = index + 1;
          
          // Handle ties logically
          if (index > 0) {
            const prev = leaderboardData[index - 1];
            if (player.toPar === prev.toPar && player.grossStrokes === prev.grossStrokes) {
              posDisplay = "-";
            }
          }

          if (player.status === "DISQUALIFIED") posDisplay = "DQ";
          else if (player.madeCut === false) posDisplay = "MC";
          else if (player.grossStrokes === 0) posDisplay = "-";

          const formatToPar = (val: number) => {
            if (val === 0) return "E";
            if (val > 0) return `+${val}`;
            return val;
          };

          const toParVal = player.toPar;
          const isUnderPar = toParVal < 0;
          const isOverPar = toParVal > 0;
          const toParStr = formatToPar(toParVal);

          return (
            <div 
              key={player.user.id}
              className={cn(
                "flex items-center px-8 py-6 rounded-2xl border bg-[#111827]/80 backdrop-blur-sm transition-colors",
                posDisplay === 1 ? "border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)] bg-emerald-950/20" : "border-white/5",
                player.status === "DISQUALIFIED" || player.madeCut === false ? "opacity-50" : ""
              )}
            >
              <div className="w-32 text-center text-4xl font-black text-white/60">
                {posDisplay}
              </div>
              <div className="flex-1 flex items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-slate-800 overflow-hidden border-2 border-white/10 shrink-0 flex items-center justify-center">
                  <img src={player.user?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.user?.email)}`} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-4xl font-bold text-white tracking-wide uppercase">
                    {player.user.firstName} {player.user.lastName}
                  </div>
                </div>
              </div>
              <div className="w-48 text-center text-4xl font-bold text-slate-300">
                {player.holesCount > 0 ? (player.holesCount === 18 ? "F" : player.holesCount) : "-"}
              </div>
              <div className="w-48 text-center text-4xl font-bold text-slate-300">
                {player.grossStrokes > 0 ? (tournament?.scoringType === 'NET' ? player.netStrokes : player.grossStrokes) : "-"}
              </div>
              <div className={cn(
                "w-48 text-center text-4xl font-black flex items-center justify-center gap-2",
                isUnderPar ? "text-rose-500" : isOverPar ? "text-emerald-500" : "text-white"
              )}>
                {player.grossStrokes > 0 ? toParStr : "-"}
              </div>
            </div>
          );
        })}

        {leaderboardData.length === 0 && (
          <div className="text-center py-20 text-3xl text-slate-500 uppercase tracking-widest font-bold">
            No active players found
          </div>
        )}
      </div>
    </div>
  );
}
