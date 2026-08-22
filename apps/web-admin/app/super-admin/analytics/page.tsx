"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  Users,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Star,
  Trophy,
  Filter,
  CreditCard,
  Banknote,
  RotateCcw,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatCurrency, cn, subscribeAdminEvents } from "@/lib/utils";
import { getSuperAdminAnalytics, type AnalyticsOverviewResponse } from "@/lib/api/analytics";
import { toast } from "sonner";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsOverviewResponse | null>(null);

  // Filters State
  const [dateRange, setDateRange] = useState("May 21 - Jun 20, 2025");
  const [registrationFrequency, setRegistrationFrequency] = useState<"Daily" | "Weekly" | "Monthly">("Daily");
  const [sourceTournamentFilter, setSourceTournamentFilter] = useState("ALL");
  const [demographicsTournamentFilter, setDemographicsTournamentFilter] = useState("ALL");
  const [tournamentPerformanceMetric, setTournamentPerformanceMetric] = useState<"REGISTRATIONS" | "REVENUE">("REGISTRATIONS");
  const [revenueTimeframe, setRevenueTimeframe] = useState<"Monthly" | "Quarterly" | "Annually">("Monthly");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedClubFilter, setSelectedClubFilter] = useState("ALL");
  const [selectedFormatFilter, setSelectedFormatFilter] = useState("ALL");

  // Fetch real analytics from backend
  const fetchAnalytics = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await getSuperAdminAnalytics({
        dateRange,
        clubId: selectedClubFilter !== "ALL" ? selectedClubFilter : undefined,
        format: selectedFormatFilter !== "ALL" ? selectedFormatFilter : undefined,
        frequency: registrationFrequency,
      });
      setAnalyticsData(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load analytics data";
      setError(msg);
      toast.error(msg);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [dateRange, selectedClubFilter, selectedFormatFilter, registrationFrequency]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Real-time subscription to events
  useEffect(() => {
    const unsubscribe = subscribeAdminEvents((event) => {
      if (event.type === "tournaments-changed" || event.type === "users-changed" || event.type === "scores-changed") {
        fetchAnalytics(true);
      }
    });
    return () => unsubscribe();
  }, [fetchAnalytics]);

  const handleExportReport = () => {
    if (!analyticsData) return;
    const csvRows = [
      ["Metric", "Value", "Growth"],
      ["Total Tournaments", analyticsData.kpis.totalTournaments, analyticsData.kpis.tournamentsGrowth],
      ["Total Players", analyticsData.kpis.totalPlayers, analyticsData.kpis.playersGrowth],
      ["Total Registrations", analyticsData.kpis.totalRegistrations, analyticsData.kpis.registrationsGrowth],
      ["Total Revenue", `₦${formatNumber(analyticsData.kpis.totalRevenue)}`, analyticsData.kpis.revenueGrowth],
      ["Avg. Registrations / Tournament", analyticsData.engagement.avgRegistrationsPerTournament, ""],
      ["Player Retention Rate", `${analyticsData.engagement.playerRetentionRate}%`, ""],
      ["Repeat Players", analyticsData.engagement.repeatPlayers, ""],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `openclub_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Analytics report exported successfully (CSV format)");
  };

  // Tournament options for filter dropdowns
  const tournamentFilterOptions = useMemo(() => {
    const defaultOpt = [{ value: "ALL", label: "All Tournaments" }];
    if (!analyticsData?.filterOptions?.tournaments) return defaultOpt;
    return [
      ...defaultOpt,
      ...analyticsData.filterOptions.tournaments.map((t) => ({
        value: t.id,
        label: t.name,
      })),
    ];
  }, [analyticsData]);

  // Club options for filter dropdown
  const clubFilterOptions = useMemo(() => {
    const defaultOpt = [{ value: "ALL", label: "All Golf Clubs" }];
    if (!analyticsData?.filterOptions?.clubs) return defaultOpt;
    return [
      ...defaultOpt,
      ...analyticsData.filterOptions.clubs.map((c) => ({
        value: c.id,
        label: c.name,
      })),
    ];
  }, [analyticsData]);

  if (loading && !analyticsData) {
    return <AnalyticsSkeleton />;
  }

  const kpis = analyticsData?.kpis;
  const regOverTime = analyticsData?.registrationsOverTime || [];
  const bySource = analyticsData?.registrationsBySource?.sources || [];
  const genderDemographics = analyticsData?.demographics?.gender || [];
  const ageDemographics = analyticsData?.demographics?.ageGroups || [];
  const topTournaments = analyticsData?.topTournaments || [];
  const revenueData = analyticsData?.revenueOverview?.monthly || [];
  const engagement = analyticsData?.engagement;

  return (
    <div className="space-y-8 w-full max-w-full px-2 pb-10 font-sans">
      {/* Primary KPI Stat Banner (Dashboard-style unified card with dividers) */}
      <div className="w-full bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-x-auto overflow-y-hidden -mt-2">
        <div className="flex items-center justify-between px-12 py-8 min-w-[1000px]">
          {/* Stat 1: Total Tournaments */}
          <div className="flex flex-col gap-3.5 flex-1">
            <div className="flex items-center gap-3.5">
              <div className="text-zinc-700 text-base font-medium">Total Tournaments</div>
              <div className="px-2 py-1 bg-green-50 rounded-lg flex justify-center items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-openclub-700">
                  <path d="M0 6.94583L1.17875 8.125L5.00167 4.23375L8.82125 8.125L10 6.94583L5.00167 1.875L0 6.94583Z" fill="currentColor" />
                </svg>
                <div className="text-openclub-700 text-xs font-medium">{kpis?.tournamentsGrowth || "0%"}</div>
              </div>
            </div>
            <div className="text-openclub-700 text-3xl font-semibold">{formatNumber(kpis?.totalTournaments ?? 0)}</div>
            <div className="text-zinc-500 text-sm font-normal">Active & Scheduled</div>
          </div>

          <div className="w-px h-28 bg-[oklch(0.94_0.02_154.09)]" />

          {/* Stat 2: Total Players */}
          <div className="flex flex-col gap-3.5 flex-1 pl-8">
            <div className="flex items-center gap-3.5">
              <div className="text-zinc-700 text-base font-medium">Total Players</div>
              <div className="px-2 py-1 bg-green-50 rounded-lg flex justify-center items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-openclub-700">
                  <path d="M0 6.94583L1.17875 8.125L5.00167 4.23375L8.82125 8.125L10 6.94583L5.00167 1.875L0 6.94583Z" fill="currentColor" />
                </svg>
                <div className="text-openclub-700 text-xs font-medium">{kpis?.playersGrowth || "0%"}</div>
              </div>
            </div>
            <div className="text-openclub-700 text-3xl font-semibold">{formatNumber(kpis?.totalPlayers ?? 0)}</div>
            <div className="text-zinc-500 text-sm font-normal">Registered Golfers</div>
          </div>

          <div className="w-px h-28 bg-slate-200" />

          {/* Stat 3: Total Registrations */}
          <div className="flex flex-col gap-3.5 flex-1 pl-8">
            <div className="flex items-center gap-3.5">
              <div className="text-zinc-700 text-base font-medium">Total Registrations</div>
              <div className="px-2 py-1 bg-green-50 rounded-lg flex justify-center items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-openclub-700">
                  <path d="M0 6.94583L1.17875 8.125L5.00167 4.23375L8.82125 8.125L10 6.94583L5.00167 1.875L0 6.94583Z" fill="currentColor" />
                </svg>
                <div className="text-openclub-700 text-xs font-medium">{kpis?.registrationsGrowth || "0%"}</div>
              </div>
            </div>
            <div className="text-openclub-700 text-3xl font-semibold">{formatNumber(kpis?.totalRegistrations ?? 0)}</div>
            <div className="text-zinc-500 text-sm font-normal">Tournament Entries</div>
          </div>

          <div className="w-px h-28 bg-slate-200" />

          {/* Stat 4: Total Revenue */}
          <div className="flex flex-col gap-3.5 flex-1 pl-8">
            <div className="flex items-center gap-3.5">
              <div className="text-zinc-700 text-base font-medium">Total Revenue</div>
              <div className="px-2 py-1 bg-green-50 rounded-lg flex justify-center items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-openclub-700">
                  <path d="M0 6.94583L1.17875 8.125L5.00167 4.23375L8.82125 8.125L10 6.94583L5.00167 1.875L0 6.94583Z" fill="currentColor" />
                </svg>
                <div className="text-openclub-700 text-xs font-medium">{kpis?.revenueGrowth || "0%"}</div>
              </div>
            </div>
            <div className="text-openclub-700 text-3xl font-semibold">₦{formatNumber(kpis?.totalRevenue ?? 0)}</div>
            <div className="text-zinc-500 text-sm font-normal">Paid Entry Fees</div>
          </div>
        </div>
      </div>

      {/* Action Toolbar (Under Stats Card) */}
      <div className="flex items-center justify-end">
        <div className="flex flex-wrap items-center gap-2.5 bg-[#fafafa] p-3 rounded-xl border-none shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)]">
          {/* Date Range Selector */}
          <SearchableSelect
            value={dateRange}
            onValueChange={setDateRange}
            options={[
              { value: "May 21 - Jun 20, 2025", label: "May 21 – Jun 20, 2025" },
              { value: "Last 30 Days", label: "Last 30 Days" },
              { value: "This Month", label: "This Month" },
              { value: "Last 3 Months", label: "Last 3 Months" },
              { value: "This Year", label: "This Year" },
              { value: "All Time", label: "All Time" },
            ]}
            className="w-[220px]"
            triggerClassName="h-10 bg-white border border-[#e1efe5] text-zinc-700 text-sm font-medium rounded-lg shadow-sm"
          />

          {/* Filter Button */}
          <Button
            variant="outline"
            onClick={() => setIsFilterModalOpen(true)}
            className="h-10 bg-white border border-[#e1efe5] text-zinc-700 gap-2 rounded-lg px-4 text-sm font-medium hover:bg-gray-50 shadow-sm"
          >
            <Filter className="w-4 h-4 text-zinc-500" /> Filter
            {(selectedClubFilter !== "ALL" || selectedFormatFilter !== "ALL") && (
              <span className="w-2 h-2 rounded-full bg-[#15803D]" />
            )}
          </Button>

          {/* Export Report Button */}
          <Button
            onClick={handleExportReport}
            variant="outline"
            className="h-10 bg-white border border-[#15803D]/40 text-[#15803D] gap-2 rounded-lg px-4 text-sm font-medium hover:bg-emerald-50 hover:border-[#15803D] shadow-sm"
          >
            <Download className="w-4 h-4 text-[#15803D]" /> Export Report
          </Button>
        </div>
      </div>

      {/* Middle Section: Registrations Over Time & Registrations by Source */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
        {/* Registrations Over Time (xl:col-span-7) */}
        <div className="p-7 bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex flex-col gap-2.5 overflow-x-auto w-full xl:col-span-7">
          <div className="min-w-[500px] relative font-sans w-full flex flex-col h-full">
            <div className="w-full flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="text-zinc-700 text-xl font-medium">Registrations Over Time</div>
                <div className="relative group flex items-center justify-center">
                  <div className="w-4 h-4 bg-zinc-400 rounded-full text-white text-[10px] font-bold flex items-center justify-center cursor-help">?</div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[220px] p-2.5 bg-[#0a2316] text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg text-center leading-relaxed">
                    Total player tournament registrations tracked over selected intervals from the database.
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#0a2316]"></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-[#f5faf6] border border-[#e1efe5] rounded-lg p-1">
                {(["Daily", "Weekly", "Monthly"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setRegistrationFrequency(range)}
                    className={cn(
                      "px-3 py-1 text-sm transition-all rounded-md",
                      registrationFrequency === range
                        ? "bg-white text-openclub-700 font-medium shadow-sm border border-[#e1efe5]"
                        : "text-zinc-500 font-normal hover:text-zinc-700 hover:bg-slate-100/50"
                    )}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 w-full min-h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={regOverTime} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="regOverTimeFunnel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#15803D" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#15803D" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1efe5" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#a1a1aa" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={45}
                    tick={{ fontSize: 12, fill: "#a1a1aa" }}
                  />
                  <Tooltip
                    cursor={{ stroke: '#15803D', strokeWidth: 1, strokeDasharray: '3 3' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#15803D] text-white text-xs font-medium px-2.5 py-1.5 rounded shadow-[0px_4px_8px_0px_rgba(0,0,0,0.10)] relative -mt-6">
                            {label}: {payload[0].value} registrations
                            <div className="absolute w-2 h-2 bg-[#15803D] rotate-45 -bottom-1 left-1/2 -translate-x-1/2" />
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#15803D"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#regOverTimeFunnel)"
                    dot={{ fill: "#15803D", r: 4, stroke: "#ffffff", strokeWidth: 2 }}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: '#15803D', fill: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Registrations by Source (xl:col-span-5) */}
        <div className="p-7 bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex flex-col justify-between w-full xl:col-span-5 font-sans">
          <div className="w-full flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="text-zinc-700 text-xl font-medium">Registrations by Source</div>
              <div className="relative group flex items-center justify-center">
                <div className="w-4 h-4 bg-zinc-400 rounded-full text-white text-[10px] font-bold flex items-center justify-center cursor-help">?</div>
                <div className="absolute top-full right-0 translate-x-1/4 mt-2 w-[220px] p-2.5 bg-[#0a2316] text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg text-center leading-relaxed">
                  Breakdown of player acquisition channels and registration categories.
                  <div className="absolute bottom-full right-4 border-4 border-transparent border-b-[#0a2316]"></div>
                </div>
              </div>
            </div>
            <SearchableSelect
              value={sourceTournamentFilter}
              onValueChange={setSourceTournamentFilter}
              options={tournamentFilterOptions}
              className="w-[160px]"
              triggerClassName="h-8 bg-white border border-[#e1efe5] text-xs font-medium text-zinc-700 rounded-lg"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-2">
            {/* Donut Chart with Center Text */}
            <div className="relative w-[180px] h-[180px] flex items-center justify-center shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bySource.length > 0 ? bySource : [{ name: "Registrations", value: 1, color: "#15803D" }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {bySource.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value} entries`, name]}
                    contentStyle={{ borderRadius: "8px", backgroundColor: "#0B1120", border: "none", color: "#fff", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl text-zinc-800 font-semibold leading-tight">
                  {formatNumber(analyticsData?.registrationsBySource?.total ?? 0)}
                </span>
                <span className="text-xs text-zinc-500 font-normal">Total</span>
              </div>
            </div>

            {/* Source Legend List */}
            <div className="flex-1 space-y-2.5 text-xs w-full">
              {bySource.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-zinc-700 font-medium truncate">{item.name}</span>
                  </div>
                  <div className="text-zinc-500 font-normal shrink-0">
                    <span className="text-zinc-900 font-medium">{item.percentage}%</span> ({formatNumber(item.value)})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lower Section Grid (3 Columns: Player Demographics | Top Performing Tournaments | Revenue Overview) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
        {/* Card 1: Player Demographics (xl:col-span-4) */}
        <div className="p-7 bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex flex-col justify-between w-full xl:col-span-4 font-sans">
          <div className="flex justify-between items-center w-full mb-6">
            <div className="flex items-center gap-2">
              <div className="text-zinc-700 text-xl font-medium">Player Demographics</div>
              <div className="relative group flex items-center justify-center">
                <div className="w-4 h-4 bg-zinc-400 rounded-full text-white text-[10px] font-bold flex items-center justify-center cursor-help">?</div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[220px] p-2.5 bg-[#0a2316] text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg text-center leading-relaxed">
                  Real database gender distribution and age profile of registered players.
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#0a2316]"></div>
                </div>
              </div>
            </div>
            <SearchableSelect
              value={demographicsTournamentFilter}
              onValueChange={setDemographicsTournamentFilter}
              options={tournamentFilterOptions}
              className="w-[160px]"
              triggerClassName="h-8 bg-white border border-[#e1efe5] text-xs font-medium text-zinc-700 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Gender Sub-chart */}
            <div className="flex flex-col items-center">
              <div className="text-xs text-zinc-500 font-medium self-start mb-2">Gender</div>
              <div className="relative w-28 h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderDemographics.length > 0 ? genderDemographics : [{ name: "Male", value: 1, color: "#15803D" }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={34}
                      outerRadius={48}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {genderDemographics.map((entry, index) => (
                        <Cell key={`gcell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1.5 w-full text-[11px]">
                {genderDemographics.map((g) => (
                  <div key={g.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                      <span className="text-zinc-700 font-medium">{g.name}</span>
                    </div>
                    <span className="text-zinc-500 font-normal">{g.percentage}% ({formatNumber(g.value)})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Age Groups Horizontal Progress Bars */}
            <div className="space-y-2.5">
              <div className="text-xs text-zinc-500 font-medium mb-2">Age Groups</div>
              {ageDemographics.map((ag) => (
                <div key={ag.range} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-zinc-700 font-normal">
                    <span>{ag.range}</span>
                    <span className="text-zinc-500 font-normal">{ag.percentage}% ({formatNumber(ag.count)})</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", ag.barColor)}
                      style={{ width: `${Math.min(100, ag.percentage * 2.5)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Top Performing Tournaments (xl:col-span-4) */}
        <div className="p-7 bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex flex-col justify-between w-full xl:col-span-4 font-sans">
          <div className="flex justify-between items-center w-full mb-6">
            <div className="flex items-center gap-2">
              <div className="text-zinc-700 text-xl font-medium">Top Performing Tournaments</div>
              <div className="relative group flex items-center justify-center">
                <div className="w-4 h-4 bg-zinc-400 rounded-full text-white text-[10px] font-bold flex items-center justify-center cursor-help">?</div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[220px] p-2.5 bg-[#0a2316] text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg text-center leading-relaxed">
                  Top performing tournaments ranked by registration numbers and revenue.
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#0a2316]"></div>
                </div>
              </div>
            </div>
            <SearchableSelect
              value={tournamentPerformanceMetric}
              onValueChange={(v) => setTournamentPerformanceMetric(v as "REGISTRATIONS" | "REVENUE")}
              options={[
                { value: "REGISTRATIONS", label: "By Registrations" },
                { value: "REVENUE", label: "By Revenue" },
              ]}
              className="w-[140px]"
              triggerClassName="h-8 bg-white border border-[#e1efe5] text-xs font-medium text-zinc-700 rounded-lg"
            />
          </div>

          <div className="divide-y divide-[#e1efe5] pt-1">
            {topTournaments.length > 0 ? (
              topTournaments.map((t) => (
                <div key={t.id || t.rank} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-zinc-400 font-normal w-3 text-center">{t.rank}</span>
                    <img
                      src={t.image}
                      alt={t.name}
                      className="size-10 rounded-full object-cover bg-gray-100 border border-[#efefef] shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-slate-900 text-sm font-medium truncate">{t.name}</div>
                      <div className="text-gray-500 text-xs font-normal truncate mt-0.5">{t.dates}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-zinc-700 text-[14px] font-bold">
                      {tournamentPerformanceMetric === "REGISTRATIONS"
                        ? formatNumber(t.registrations)
                        : `₦${formatNumber(t.revenue)}`}
                    </div>
                    <div className={cn(
                      "text-[11px] font-medium flex items-center justify-end gap-0.5 mt-0.5",
                      t.isPositive ? "text-openclub-700" : "text-red-500"
                    )}>
                      <span>{t.growth}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-gray-500">
                No tournament records found
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Revenue Overview (xl:col-span-4) */}
        <div className="p-7 bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex flex-col justify-between w-full xl:col-span-4 font-sans">
          <div className="flex justify-between items-center w-full mb-4">
            <div className="flex items-center gap-2">
              <div className="text-zinc-700 text-xl font-medium">Revenue Overview</div>
              <div className="relative group flex items-center justify-center">
                <div className="w-4 h-4 bg-zinc-400 rounded-full text-white text-[10px] font-bold flex items-center justify-center cursor-help">?</div>
                <div className="absolute top-full right-0 translate-x-1/4 mt-2 w-[220px] p-2.5 bg-[#0a2316] text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg text-center leading-relaxed">
                  Periodic gross tournament revenue receipts across the platform.
                  <div className="absolute bottom-full right-4 border-4 border-transparent border-b-[#0a2316]"></div>
                </div>
              </div>
            </div>
            <SearchableSelect
              value={revenueTimeframe}
              onValueChange={(v) => setRevenueTimeframe(v as "Monthly" | "Quarterly" | "Annually")}
              options={[
                { value: "Monthly", label: "Monthly" },
                { value: "Quarterly", label: "Quarterly" },
                { value: "Annually", label: "Annually" },
              ]}
              className="w-[110px]"
              triggerClassName="h-8 bg-white border border-[#e1efe5] text-xs font-medium text-zinc-700 rounded-lg"
            />
          </div>

          <div className="pt-1">
            <div className="text-openclub-700 text-2xl font-semibold">
              ₦{formatNumber(analyticsData?.revenueOverview?.totalRevenue ?? 0)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-openclub-700 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{analyticsData?.revenueOverview?.growth || "0%"} vs previous period</span>
            </div>
          </div>

          <div className="h-[185px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1efe5" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#a1a1aa" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#a1a1aa" }}
                  tickFormatter={(val) => {
                    if (val === 0) return "N0";
                    return `N${val >= 1000000 ? (val / 1000000).toFixed(1) + 'M' : (val / 1000).toFixed(0) + 'k'}`;
                  }}
                />
                <Tooltip
                  formatter={(val: any) => [`₦${formatNumber(val)}`, "Revenue"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e1efe5", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}
                />
                <Bar
                  dataKey="amount"
                  fill="#15803D"
                  radius={[4, 4, 0, 0]}
                  barSize={22}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Consolidated Strip: Key Engagement Metrics */}
      <div className="w-full bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] px-7 py-5 overflow-x-auto overflow-y-hidden font-sans">
        <div className="flex items-center justify-between min-w-[950px] gap-6 divide-x divide-[#e1efe5]">
          {/* Label Title */}
          <div className="flex items-center gap-2 pr-6 shrink-0">
            <div className="text-zinc-700 text-base font-medium whitespace-nowrap">Key Engagement<br />Metrics</div>
            <div className="relative group flex items-center justify-center">
              <div className="w-4 h-4 bg-zinc-400 rounded-full text-white text-[10px] font-bold flex items-center justify-center cursor-help">?</div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[220px] p-2.5 bg-[#0a2316] text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg text-center leading-relaxed">
                Platform retention, participation rate and satisfaction benchmarks.
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0a2316]"></div>
              </div>
            </div>
          </div>

          {/* Metric 1 */}
          <div className="pl-6 flex-1">
            <div className="text-xs text-zinc-500 font-normal">Avg. Registrations<br />Per Tournament</div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-xl text-zinc-800 font-semibold">{formatNumber(engagement?.avgRegistrationsPerTournament ?? 0)}</span>
              <span className="text-xs text-openclub-700 font-medium flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> + 19%
              </span>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="pl-6 flex-1">
            <div className="text-xs text-zinc-500 font-normal">Player Retention Rate</div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-xl text-zinc-800 font-semibold">{engagement?.playerRetentionRate ?? 0}%</span>
              <span className="text-xs text-openclub-700 font-medium flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> + 12%
              </span>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="pl-6 flex-1">
            <div className="text-xs text-zinc-500 font-normal">Repeat Players</div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-xl text-zinc-800 font-semibold">{formatNumber(engagement?.repeatPlayers ?? 0)}</span>
              <span className="text-xs text-openclub-700 font-medium flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> + 15%
              </span>
            </div>
          </div>

          {/* Metric 4 */}
          <div className="pl-6 flex-1">
            <div className="text-xs text-zinc-500 font-normal">Avg. Rating</div>
            <div className="flex items-baseline gap-2 mt-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-xl text-zinc-800 font-semibold">{engagement?.avgRating || "4.6/5"}</span>
              </div>
              <span className="text-xs text-openclub-700 font-medium flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> + 0.3
              </span>
            </div>
          </div>

          {/* Metric 5 */}
          <div className="pl-6 flex-1">
            <div className="text-xs text-zinc-500 font-normal">Support Tickets</div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-xl text-zinc-800 font-semibold">{engagement?.supportTickets ?? 0}</span>
              <span className="text-xs text-red-500 font-medium flex items-center gap-0.5">
                + 8%
              </span>
            </div>
          </div>

          {/* Metric 6 */}
          <div className="pl-6 flex-1">
            <div className="text-xs text-zinc-500 font-normal">Email Open Rate</div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-xl text-zinc-800 font-semibold">{engagement?.emailOpenRate ?? 56}%</span>
              <span className="text-xs text-openclub-700 font-medium flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> + 6%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filter Analytics Data"
        size="md"
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Filter by Club / Organizer</label>
            <SearchableSelect
              value={selectedClubFilter}
              onValueChange={setSelectedClubFilter}
              options={clubFilterOptions}
              className="w-full"
              triggerClassName="h-10 border-gray-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tournament Format</label>
            <SearchableSelect
              value={selectedFormatFilter}
              onValueChange={setSelectedFormatFilter}
              options={[
                { value: "ALL", label: "All Formats" },
                { value: "STROKE_PLAY", label: "Stroke Play" },
                { value: "STABLEFORD", label: "Stableford" },
                { value: "MATCH_PLAY", label: "Match Play" },
                { value: "SCRAMBLE", label: "Scramble" },
                { value: "BEST_BALL", label: "Best Ball" },
              ]}
              className="w-full"
              triggerClassName="h-10 border-gray-200"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedClubFilter("ALL");
                setSelectedFormatFilter("ALL");
                setIsFilterModalOpen(false);
                toast.info("Filters reset to default");
              }}
              className="font-semibold text-xs"
            >
              Reset
            </Button>
            <Button
              onClick={() => {
                setIsFilterModalOpen(false);
                toast.success("Analytics filters applied");
              }}
              className="bg-[#15803D] hover:bg-[#15803D]/90 text-white font-semibold text-xs"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-8 w-full max-w-full px-2 pb-10 font-sans">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-44 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      <div className="w-full bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] p-8">
        <div className="grid grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7 bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] p-7 h-[340px]">
          <Skeleton className="h-5 w-48 mb-6" />
          <Skeleton className="h-56 w-full rounded-lg" />
        </div>
        <div className="col-span-5 bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] p-7 h-[340px]">
          <Skeleton className="h-5 w-48 mb-6" />
          <Skeleton className="h-56 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
