"use client";

import React, { useEffect, useState } from "react";
import { getTournamentScores } from "@/lib/api/scores";
import { Trophy, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function PublicLeaderboard({ tournamentId }: { tournamentId: string }) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadScores() {
      try {
        const scores = await getTournamentScores(tournamentId);
        setData(scores || []);
      } catch (err) {
        console.error("Failed to load scores:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadScores();
  }, [tournamentId]);

  const filteredData = data.filter((entry) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = `${entry.user.firstName || ""} ${entry.user.lastName || ""}`.toLowerCase();
    return name.includes(q) || entry.user.email?.toLowerCase().includes(q);
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-8 shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-openclub-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="bg-white rounded-lg p-4 shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex flex-col md:flex-row gap-4 justify-between items-center">
        <h2 className="text-[16px] font-semibold text-gray-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-openclub-600" />
          Tournament Leaderboard
        </h2>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search players..."
            className="pl-9 h-9 text-[13px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="bg-white rounded-lg p-16 shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] text-center">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-[14px] font-medium text-gray-900">No Leaderboard Data</h3>
          <p className="text-[13px] text-gray-500 mt-1">No scores have been recorded or found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-hidden">
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
                {filteredData.map((entry, index) => {
                  const rank = index + 1;
                  return (
                    <tr key={entry.user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-center font-medium text-gray-900">
                        {entry.status === "DISQUALIFIED" ? "DQ" : rank}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {entry.user.profilePicture ? (
                            <img src={entry.user.profilePicture} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-gray-100" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-openclub-100 flex items-center justify-center text-openclub-700 font-medium">
                              {entry.user.firstName?.[0] || ""}{entry.user.lastName?.[0] || ""}
                            </div>
                          )}
                          <span className="font-medium text-gray-900">
                            {entry.user.firstName} {entry.user.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">{entry.holesPlayed || 0}</td>
                      <td className="px-6 py-4 text-center font-medium text-gray-900">{entry.totalGross || 0}</td>
                      <td className="px-6 py-4 text-center text-gray-500">{entry.user.handicap || 0}</td>
                      <td className="px-6 py-4 text-center font-semibold text-openclub-700">{entry.totalNet || 0}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-md text-[12px] font-medium ${
                          (entry.totalToPar || 0) < 0 ? "bg-red-50 text-red-600" :
                          (entry.totalToPar || 0) > 0 ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-600"
                        }`}>
                          {(entry.totalToPar || 0) > 0 ? `+${entry.totalToPar}` : (entry.totalToPar || "E")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-[11px] font-medium tracking-wide ${
                          entry.status === "DISQUALIFIED" ? "bg-red-50 text-red-600 border border-red-100" :
                          entry.status === "WITHDRAWN" ? "bg-orange-50 text-orange-600 border border-orange-100" :
                          "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        }`}>
                          {entry.status || "ACTIVE"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
