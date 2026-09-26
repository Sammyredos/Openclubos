"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Flag,
  Search,
  RefreshCcw,
  Download,
  AlertTriangle,
  Ban,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Clock,
  Shield,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { cn, formatNumber } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { FloatingMenu } from "@/components/ui/floating-menu";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getAuthToken } from "@/lib/api/auth";
import { exportToCsv, exportToPdf } from "@/lib/export";

function fullName(firstName: string | null, lastName: string | null) {
  const name = `${firstName || ""} ${lastName || ""}`.trim();
  return name || "—";
}

function formatReportDate(iso: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return fmt.format(d);
}

function PlayerReportsContent() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportStatusFilter, setReportStatusFilter] = useState<string>("ALL");
  const [reportSearchQuery, setReportSearchQuery] = useState("");
  const debouncedReportSearch = useDebounce(reportSearchQuery, 300);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const skeletonRows = [1, 2, 3, 4, 5];

  const [actionModal, setActionModal] = useState<{
    report: any;
    action: "SUSPEND" | "WARN" | "DISMISS";
  } | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const [exportAnchorEl, setExportAnchorEl] = useState<HTMLElement | null>(null);

  const fetchReports = async () => {
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const endpoints = [
        "http://127.0.0.1:3001/api/reports/user",
        "http://localhost:3001/api/reports/user",
        "/api/reports/user",
      ];

      let data: any = null;
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, { headers });
          if (res.ok) {
            data = await res.json();
            break;
          }
        } catch {}
      }

      if (Array.isArray(data)) {
        // Exclude legacy dummy test reports
        const realReports = data.filter((r) => !r.reportedName?.includes("Marcus Aurelius"));
        setReports(realReports);
        try {
          localStorage.setItem("openclub_user_reports", JSON.stringify(realReports));
        } catch {}
        setLoading(false);
        return;
      }
      setReports([]);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("openclub_user_reports");
      if (stored && stored.includes("Marcus Aurelius")) {
        localStorage.removeItem("openclub_user_reports");
      }
    } catch {}
    fetchReports();

    // Auto-refresh reports periodically and on window focus
    const interval = setInterval(() => {
      fetchReports();
    }, 4000);
    const handleFocus = () => fetchReports();
    window.addEventListener("focus", handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const handleExecuteAction = async () => {
    if (!actionModal) return;
    setIsSubmittingAction(true);
    const { report, action } = actionModal;
    try {
      const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const token = getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`${backendBase}/reports/user/${report.id}/action`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ action, notes: actionNotes }),
      }).catch(() => null);

      try {
        const local = JSON.parse(localStorage.getItem("openclub_user_reports") || "[]");
        const updated = local.map((r: any) =>
          r.id === report.id
            ? {
                ...r,
                status: action === "DISMISS" ? "DISMISSED" : "RESOLVED",
                actionTaken: action,
                actionNotes,
                resolvedAt: new Date().toISOString(),
              }
            : r
        );
        localStorage.setItem("openclub_user_reports", JSON.stringify(updated));
      } catch {}

      toast.success(
        action === "SUSPEND"
          ? `Player ${report.reportedName} has been suspended.`
          : action === "WARN"
          ? `Conduct warning sent to ${report.reportedName}.`
          : "Report dismissed."
      );
      setActionModal(null);
      setActionNotes("");
      fetchReports();
    } catch (err: any) {
      toast.error("Failed to execute moderation action", { description: err?.message });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (reportStatusFilter !== "ALL" && r.status !== reportStatusFilter) {
        return false;
      }
      if (debouncedReportSearch.trim()) {
        const q = debouncedReportSearch.trim().toLowerCase();
        const repName = (r.reportedName || "").toLowerCase();
        const reporter = (r.reporterName || "").toLowerCase();
        const reporterEmail = (r.reporterEmail || "").toLowerCase();
        const reason = (r.reason || "").toLowerCase();
        const details = (r.details || r.comment || r.description || "").toLowerCase();
        const club = (r.reportedClub || "").toLowerCase();
        return (
          repName.includes(q) ||
          reporter.includes(q) ||
          reporterEmail.includes(q) ||
          reason.includes(q) ||
          details.includes(q) ||
          club.includes(q)
        );
      }
      return true;
    });
  }, [reports, reportStatusFilter, debouncedReportSearch]);

  // Pagination calculation
  const totalReportsCount = filteredReports.length;
  const totalPages = Math.max(1, Math.ceil(totalReportsCount / itemsPerPage));
  const pageSafe = Math.min(currentPage, totalPages);
  const paginatedReports = useMemo(() => {
    const start = (pageSafe - 1) * itemsPerPage;
    return filteredReports.slice(start, start + itemsPerPage);
  }, [filteredReports, pageSafe, itemsPerPage]);

  // Statistics calculation
  const totalReports = reports.length;
  const pendingReports = reports.filter((r) => r.status === "PENDING").length;
  const resolvedReports = reports.filter((r) => r.status === "RESOLVED").length;
  const dismissedReports = reports.filter((r) => r.status === "DISMISSED").length;

  return (
    <div className="space-y-6">
      {/* --- TOP REPORT STATS CARDS --- */}
      {loading ? (
        <div className="w-full bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-x-auto">
          <div className="flex items-center justify-between p-8 min-w-max gap-12 font-sans">
            {[1, 2, 3, 4].map((i, idx) => (
              <div key={i} className="flex items-center gap-12 flex-1">
                <div className="flex flex-col justify-start items-start gap-3.5 w-full">
                  <div className="flex justify-start items-center gap-3.5">
                    <Skeleton className="h-[22px] w-32" />
                    <Skeleton className="h-6 w-16 rounded-lg" />
                  </div>
                  <Skeleton className="h-9 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
                {idx < 3 && <div className="w-px h-16 bg-slate-200 shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-6 bg-white rounded-xl shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex flex-col justify-start items-start gap-4">
          <div className="flex flex-col sm:flex-row justify-start items-start sm:items-center gap-6 w-full">
            {/* Stat 1: Total Reports */}
            <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
              <div className="flex justify-start items-center gap-3.5">
                <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Total Reports</div>
                <div className="px-2 py-1 bg-emerald-50 rounded-lg flex justify-center items-center gap-1 shrink-0 whitespace-nowrap">
                  <div className="text-[#15803D] text-xs font-medium">All Time</div>
                </div>
              </div>
              <div className="text-[#15803D] text-3xl font-bold">{formatNumber(totalReports)}</div>
              <div className="text-zinc-500 text-sm font-normal">Filed by players</div>
            </div>

            <div className="w-px h-16 bg-slate-200 hidden sm:block" />

            {/* Stat 2: Pending Review */}
            <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
              <div className="flex justify-start items-center gap-3.5">
                <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Pending Review</div>
                <div className="px-2 py-1 bg-amber-50 rounded-lg flex justify-center items-center gap-1 shrink-0 whitespace-nowrap">
                  <div className="text-amber-700 text-xs font-medium">
                    {totalReports ? `${Math.round((pendingReports / totalReports) * 100)}%` : "0%"}
                  </div>
                </div>
              </div>
              <div className="text-[#15803D] text-3xl font-bold">{formatNumber(pendingReports)}</div>
              <div className="text-zinc-500 text-sm font-normal">Awaiting moderation</div>
            </div>

            <div className="w-px h-16 bg-slate-200 hidden sm:block" />

            {/* Stat 3: Resolved */}
            <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
              <div className="flex justify-start items-center gap-3.5">
                <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Resolved</div>
                <div className="px-2 py-1 bg-emerald-50 rounded-lg flex justify-center items-center gap-1 shrink-0 whitespace-nowrap">
                  <div className="text-[#15803D] text-xs font-medium">
                    {totalReports ? `${Math.round((resolvedReports / totalReports) * 100)}%` : "0%"}
                  </div>
                </div>
              </div>
              <div className="text-[#15803D] text-3xl font-bold">{formatNumber(resolvedReports)}</div>
              <div className="text-zinc-500 text-sm font-normal">Action taken</div>
            </div>

            <div className="w-px h-16 bg-slate-200 hidden sm:block" />

            {/* Stat 4: Dismissed */}
            <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
              <div className="flex justify-start items-center gap-3.5">
                <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Dismissed</div>
                <div className="px-2 py-1 bg-slate-100 rounded-lg flex justify-center items-center gap-1 shrink-0 whitespace-nowrap">
                  <div className="text-slate-700 text-xs font-medium">
                    {totalReports ? `${Math.round((dismissedReports / totalReports) * 100)}%` : "0%"}
                  </div>
                </div>
              </div>
              <div className="text-[#15803D] text-3xl font-bold">{formatNumber(dismissedReports)}</div>
              <div className="text-zinc-500 text-sm font-normal">Closed with no action</div>
            </div>
          </div>
        </div>
      )}

      {/* --- REPORTS TABLE CARD --- */}
      <Card className="border-none shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
          <CardTitle className="text-zinc-700 text-xl font-medium whitespace-nowrap">
            Player Reports & Moderation
          </CardTitle>
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
                    filteredReports,
                    [
                      { header: "Reported Golfer", key: "reportedName" },
                      { header: "Infraction Reason", key: "reason" },
                      { header: "Details", key: "details" },
                      { header: "Reporter Name", key: "reporterName" },
                      { header: "Reporter Email", key: "reporterEmail" },
                      { header: "Status", key: "status" },
                      { header: "Action Taken", key: "actionTaken" },
                      { header: "Date Filed", key: "createdAt" },
                    ],
                    "player_reports.csv"
                  );
                }}
                className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Export as CSV
              </button>
              <button
                onClick={() => {
                  setExportAnchorEl(null);
                  exportToPdf(
                    filteredReports,
                    [
                      { header: "Reported Golfer", key: "reportedName" },
                      { header: "Infraction Reason", key: "reason" },
                      { header: "Reporter", key: "reporterName" },
                      { header: "Status", key: "status" },
                      { header: "Date", key: "createdAt" },
                    ],
                    "player_reports.pdf",
                    "Player Reports & Moderation"
                  );
                }}
                className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <FileText className="w-4 h-4 text-red-600" />
                Export as PDF
              </button>
            </FloatingMenu>

            <Button
              variant="outline"
              onClick={fetchReports}
              className="h-10 border-[#e1efe5] text-gray-600 hover:text-gray-900 gap-2 rounded-lg px-4 text-[14px] font-normal cursor-pointer"
            >
              <RefreshCcw className="w-4 h-4" /> Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="px-6 pb-6">
            <div className="bg-background rounded-xl border border-[#e1efe5] overflow-hidden">
              {/* Filter Toolbar */}
              <div className="p-5 border-b border-[#e1efe5]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search reports by golfer, reporter, reason, or details..."
                      className="pl-10 h-11 rounded-lg text-[14px] border-[#e1efe5] bg-white text-gray-800 focus:bg-white placeholder:text-gray-400"
                      value={reportSearchQuery}
                      onChange={(e) => {
                        setReportSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                  <SearchableSelect
                    value={reportStatusFilter}
                    onValueChange={(v) => {
                      setReportStatusFilter(v);
                      setCurrentPage(1);
                    }}
                    options={[
                      { value: "ALL", label: "All Statuses" },
                      { value: "PENDING", label: "Pending Review" },
                      { value: "RESOLVED", label: "Resolved" },
                      { value: "DISMISSED", label: "Dismissed" },
                    ]}
                    className="min-w-[170px]"
                    triggerClassName="h-11 bg-white border-[#e1efe5] text-gray-700 font-normal"
                    placeholder="All Statuses"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f5faf6] border-b border-[#e1efe5] text-[10px] font-normal text-[#15803D] uppercase tracking-wider">
                      <th className="px-6 py-4">Reported Golfer</th>
                      <th className="px-6 py-4">Infraction Reason</th>
                      <th className="px-6 py-4">Report Details</th>
                      <th className="px-6 py-4">Reporter</th>
                      <th className="px-6 py-4">Filed Date</th>
                      <th className="px-6 py-4">Status & Action</th>
                      <th className="px-6 py-4 text-center">Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e1efe5]">
                    {loading ? (
                      skeletonRows.map((i) => (
                        <tr key={`sk-${i}`} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                              <div className="flex flex-col gap-1.5">
                                <Skeleton className="h-4 w-32 rounded-md" />
                                <Skeleton className="h-3 w-24 rounded-md" />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Skeleton className="h-4 w-28 rounded-md" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <Skeleton className="h-3.5 w-44 rounded-md" />
                              <Skeleton className="h-3 w-28 rounded-md" />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <Skeleton className="h-3.5 w-24 rounded-md" />
                              <Skeleton className="h-3 w-32 rounded-md" />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Skeleton className="h-3.5 w-28 rounded-md" />
                          </td>
                          <td className="px-6 py-4">
                            <Skeleton className="h-5.5 w-20 rounded-full" />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Skeleton className="h-7 w-20 rounded-md" />
                              <Skeleton className="h-7 w-16 rounded-md" />
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : paginatedReports.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12">
                          <EmptyState
                            icon={Flag}
                            title="No player reports found"
                            description="No infraction reports match your current filter or search criteria."
                          />
                        </td>
                      </tr>
                    ) : (
                      paginatedReports.map((rep) => (
                        <tr key={rep.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#EAF7EE] text-[#009A60] font-bold flex items-center justify-center border border-[#C6F0DB]">
                                {rep.reportedPhoto ? (
                                  <img
                                    src={rep.reportedPhoto}
                                    alt=""
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  fullName(
                                    rep.reportedName?.split(" ")[0],
                                    rep.reportedName?.split(" ")[1]
                                  )
                                    .slice(0, 2)
                                    .toUpperCase()
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">{rep.reportedName}</p>
                                <p className="text-xs text-gray-500">
                                  {rep.reportedClub || "Golfer"} • HCP {rep.reportedHcp || "0.0"}
                                </p>
                                {rep.reportedUserStatus === "SUSPENDED" && (
                                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-700">
                                    ACCOUNT SUSPENDED
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                              {rep.reason}
                            </span>
                          </td>
                          <td className="px-6 py-4 max-w-xs">
                            <p className="text-xs text-gray-700 line-clamp-2">
                              {rep.details || rep.comment || rep.description || "No additional description provided."}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-semibold text-gray-800">{rep.reporterName}</p>
                            <p className="text-[11px] text-gray-500">{rep.reporterEmail}</p>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                            {formatReportDate(rep.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                "px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap",
                                rep.status === "PENDING"
                                  ? "bg-amber-100 text-amber-800"
                                  : rep.status === "RESOLVED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-gray-100 text-gray-700"
                              )}
                            >
                              {rep.status} {rep.actionTaken && rep.actionTaken !== "NONE" ? `(${rep.actionTaken})` : ""}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setActionModal({ report: rep, action: "SUSPEND" })}
                                className="h-8 px-2.5 text-xs text-red-700 border-red-200 hover:bg-red-50 font-bold"
                                title="Suspend Golfer"
                              >
                                Suspend
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setActionModal({ report: rep, action: "WARN" })}
                                className="h-8 px-2.5 text-xs text-amber-700 border-amber-200 hover:bg-amber-50 font-bold"
                                title="Send Formal Conduct Warning"
                              >
                                Warn
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setActionModal({ report: rep, action: "DISMISS" })}
                                className="h-8 px-2.5 text-xs text-gray-500 hover:bg-gray-100"
                                title="Dismiss Report"
                              >
                                Dismiss
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-[#e1efe5] flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Showing {(pageSafe - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(pageSafe * itemsPerPage, totalReportsCount)} of {totalReportsCount} reports
                  </p>
                  <Pagination
                    currentPage={pageSafe}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- MODERATION ACTION CONFIRMATION MODAL --- */}
      {actionModal && (
        <Modal
          isOpen={true}
          onClose={() => setActionModal(null)}
          title={
            actionModal.action === "SUSPEND"
              ? "Suspend Player Account"
              : actionModal.action === "WARN"
              ? "Send Conduct Warning"
              : "Dismiss Player Report"
          }
          className="max-w-md"
        >
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <p>
                <strong className="text-gray-700">Reported Golfer:</strong> {actionModal.report.reportedName}
              </p>
              <p>
                <strong className="text-gray-700">Infraction Reason:</strong> {actionModal.report.reason}
              </p>
              {actionModal.report.details && (
                <p>
                  <strong className="text-gray-700">Details:</strong> {actionModal.report.details}
                </p>
              )}
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700 block mb-1.5">
                Moderation Notes / Message to Player
              </Label>
              <textarea
                rows={3}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder={
                  actionModal.action === "SUSPEND"
                    ? "Enter reason for suspension (will be visible in their notification)..."
                    : actionModal.action === "WARN"
                    ? "Enter specific conduct warning message..."
                    : "Enter notes explaining dismissal (internal)..."
                }
                className="w-full bg-[#f5faf6] border border-[#e1efe5] rounded-xl p-3 text-xs text-[#0F172A] placeholder:text-[#8CA0BA] focus:border-[#009A60] focus:ring-2 focus:ring-[#009A60]/20 focus:outline-hidden resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setActionModal(null)}
                disabled={isSubmittingAction}
                className="h-10 text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExecuteAction}
                disabled={isSubmittingAction}
                className={cn(
                  "h-10 text-xs font-bold text-white",
                  actionModal.action === "SUSPEND"
                    ? "bg-red-600 hover:bg-red-700"
                    : actionModal.action === "WARN"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-gray-800 hover:bg-gray-900"
                )}
              >
                {isSubmittingAction
                  ? "Processing..."
                  : actionModal.action === "SUSPEND"
                  ? "Confirm Suspension"
                  : actionModal.action === "WARN"
                  ? "Send Warning"
                  : "Confirm Dismissal"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function PlayerReportsPage() {
  return (
    <Suspense fallback={null}>
      <PlayerReportsContent />
    </Suspense>
  );
}
