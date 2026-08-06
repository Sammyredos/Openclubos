"use client";

import { useMemo, useState, useEffect } from "react";
import {
  FileText,
  Download,
  Search,
  CheckCircle2,
  Clock,
  Ban,
  FileSpreadsheet,
  BarChart3,
  CalendarDays,
  FileArchive,
  Database,
  Trash2,
  Settings2,
  ArrowUpRight
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { cn, formatNumber } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

import { getReports, generateReport, deleteReport, Report } from "@/lib/api/reports";
import { getTournaments, Tournament } from "@/lib/api/tournaments";
import { useAuth } from "@/lib/auth/AuthContext";
import { toast } from "sonner";

function formatDate(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
}

function ReportTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "Tournament Results": return <TrophyIcon className="h-4 w-4 text-amber-500" />;
    case "Financial": return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />;
    case "Analysis": return <BarChart3 className="h-4 w-4 text-purple-500" />;
    default: return <FileText className="h-4 w-4 text-blue-500" />;
  }
}

// Inline Trophy Icon since lucide trophy wasn't imported in this specific subset
function TrophyIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "GENERATED" || status === "READY") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-medium uppercase whitespace-nowrap bg-emerald-50 text-emerald-700 border-emerald-100">
        <span className="w-1.5 h-1.5 rounded-full bg-openclub-700" />
        Ready
      </span>
    );
  }
  if (status === "FAILED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-medium uppercase whitespace-nowrap bg-red-50 text-red-700 border-red-100">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-medium uppercase whitespace-nowrap bg-orange-50 text-orange-700 border-orange-100">
      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
      Generating
    </span>
  );
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [reportFormat, setReportFormat] = useState("CSV");
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const perPage = 10;

  // Modal form state
  const [reportName, setReportName] = useState("");
  const [reportType, setReportType] = useState("Tournament Results");

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const [reportsData, tournamentsData] = await Promise.all([
          getReports(user.clubId),
          getTournaments({ clubId: user.clubId })
        ]);
        setReports(reportsData);
        setTournaments(tournamentsData as Tournament[]);
      } catch (err: any) {
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const activeClubId = user?.clubId;
      if (!activeClubId) throw new Error("No active club selected");
      const newReport = await generateReport({
        name: reportName,
        type: reportType,
        clubId: activeClubId,
        format: reportFormat
      });
      setReports([newReport, ...reports]);
      toast.success("Report generation started");
      setShowGenerateModal(false);
      setReportName("");
      setReportType("Tournament Results");
      setReportFormat("CSV");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate report");
    }
  };

  const confirmDelete = async () => {
    if (!deleteReportId) return;
    try {
      await deleteReport(deleteReportId);
      setReports(reports.filter(r => r.id !== deleteReportId));
      toast.success("Report deleted");
      setDeleteReportId(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete report");
    }
  };

  const filteredData = useMemo(() => {
    return reports.filter(rpt => {
      const matchesSearch = rpt.name.toLowerCase().includes(search.toLowerCase()) ||
        rpt.id.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "ALL" || rpt.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [search, typeFilter, reports]);

  const totalReports = reports.length;
  const totalSizeBytes = reports.reduce((acc, rpt) => acc + (rpt.sizeBytes || 0), 0);
  const storageUsedMB = (totalSizeBytes / (1024 * 1024)).toFixed(1);
  const tournamentReports = reports.filter(r => r.type === "Tournament Results").length;
  const financialReports = reports.filter(r => r.type === "Financial").length;

  return (
    <div className="space-y-8 w-full max-w-full px-2 pb-10 font-sans">
      <div className="w-full bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-x-auto">
        <div className="flex items-center justify-between p-8 min-w-max gap-12 font-sans">

          <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
            <div className="flex justify-start items-center gap-3.5">
              <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Total Reports</div>
              <div className="px-2 py-1 bg-green-50 rounded-lg flex justify-center items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#15803D]">
                  <path d="M0 6.94583L1.17875 8.125L5.00167 4.23375L8.82125 8.125L10 6.94583L5.00167 1.875L0 6.94583Z" fill="currentColor" />
                </svg>
                <div className="text-[#15803D] text-xs font-medium">0.0%</div>
              </div>
            </div>
            <div className="text-[#15803D] text-3xl font-semibold">{formatNumber(totalReports)}</div>
            <div className="text-zinc-500 text-sm font-normal">All Time</div>
          </div>

          <div className="w-px h-16 bg-slate-200" />

          <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
            <div className="flex justify-start items-center gap-3.5">
              <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Storage Used</div>
              <div className="px-2 py-1 bg-green-50 rounded-lg flex justify-center items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#15803D]">
                  <path d="M0 6.94583L1.17875 8.125L5.00167 4.23375L8.82125 8.125L10 6.94583L5.00167 1.875L0 6.94583Z" fill="currentColor" />
                </svg>
                <div className="text-[#15803D] text-xs font-medium">0.0%</div>
              </div>
            </div>
            <div className="text-[#15803D] text-3xl font-semibold">{storageUsedMB} MB</div>
            <div className="text-zinc-500 text-sm font-normal">Available capacity: 1.2 GB</div>
          </div>

          <div className="w-px h-16 bg-slate-200" />

          <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
            <div className="flex justify-start items-center gap-3.5">
              <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Tournament Reports</div>
            </div>
            <div className="text-[#15803D] text-3xl font-semibold">{formatNumber(tournamentReports)}</div>
            <div className="text-zinc-500 text-sm font-normal">All Time</div>
          </div>

          <div className="w-px h-16 bg-slate-200" />

          <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
            <div className="flex justify-start items-center gap-3.5">
              <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Financial Reports</div>
            </div>
            <div className="text-[#15803D] text-3xl font-semibold">{formatNumber(financialReports)}</div>
            <div className="text-zinc-500 text-sm font-normal">All Time</div>
          </div>

          <div className="w-px h-16 bg-slate-200" />

          <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
            <div className="flex justify-start items-center gap-3.5">
              <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Scheduled Reports</div>
            </div>
            <div className="text-[#15803D] text-3xl font-bold">0</div>
            <div className="text-zinc-500 text-sm font-normal">Coming soon</div>
          </div>

        </div>
      </div>

      <div className="w-full space-y-6">
        <Card className="border-none shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
            <CardTitle className="text-zinc-700 text-xl font-medium whitespace-nowrap">All Reports</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => setShowGenerateModal(true)}
                className="h-10 bg-[#15803D] hover:bg-[#166534] border border-openclub-800/30 text-white gap-2 rounded-lg px-4 text-[14px] font-medium"
              >
                <Settings2 className="w-4 h-4" /> Generate Report
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="px-6 pb-6 flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[240px] max-w-[500px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#15803D]" />
                <Input
                  placeholder="Search reports..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-11 rounded-lg text-[14px] border-[#e1efe5] bg-[#f5faf6] text-[#15803D] focus:bg-[#e1efe5] placeholder:text-[#15803D]/60"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <SearchableSelect
                  value={typeFilter}
                  onValueChange={setTypeFilter}
                  options={[
                    { value: "ALL", label: "All Types" },
                    { value: "Tournament Results", label: "Tournament Results" },
                    { value: "Financial", label: "Financial" },
                    { value: "Player List", label: "Player List" },
                    { value: "Analysis", label: "Analysis" },
                  ]}
                  className="min-w-[160px]"
                  triggerClassName="h-11 bg-[#f5faf6] border-[#e1efe5] text-[#15803D] font-medium"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f5faf6] border-y border-[#e1efe5]">
                  <tr>
                    <th className="px-6 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Report Name</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Format</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Generated</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e1efe5] bg-white">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={`sk-${i}`} className="border-b border-[#e1efe5]">
                        <td className="px-6 py-4"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-16 mt-2" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                        <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-24 ml-auto" /></td>
                      </tr>
                    ))
                  ) : filteredData.slice((page - 1) * perPage, page * perPage).map((rpt) => (
                    <tr key={rpt.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[14px] font-medium text-gray-900 group-hover:text-[#15803D] transition-colors">{rpt.name}</span>
                          <span className="text-[12px] text-gray-500">{rpt.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <ReportTypeIcon type={rpt.type} />
                          <span className="text-[13px] text-gray-700">{rpt.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[13px] text-gray-600 uppercase font-medium">{rpt.url ? (rpt.url.endsWith('pdf') ? 'PDF' : 'CSV') : 'PDF'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[13px] text-gray-600">{(rpt.sizeBytes / 1024).toFixed(1)} KB</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-[13px] text-gray-600">
                          <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                          {formatDate(rpt.generatedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={rpt.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              if (rpt.url) {
                                if (rpt.url.startsWith('data:')) {
                                  const a = document.createElement('a');
                                  a.href = rpt.url;
                                  a.download = `${rpt.name}.csv`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                } else {
                                  window.open(rpt.url, '_blank');
                                }
                              } else {
                                toast.error("Report URL not available yet");
                              }
                            }}
                            disabled={!rpt.url}
                            className="h-8 bg-[#15803D] hover:bg-[#166534] border border-openclub-800/30 text-white gap-1.5 rounded-lg px-3 text-[13px] font-medium"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteReportId(rpt.id)} className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!isLoading && filteredData.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <FileArchive className="w-12 h-12 mb-4 text-gray-300" />
                          <p className="text-base font-medium text-gray-900">No reports found</p>
                          <p className="text-sm mt-1">Try adjusting your search or generate a new report</p>
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
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Generate Report"
        size="md"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setShowGenerateModal(false)} className="rounded-lg font-normal">
              Cancel
            </Button>
            <Button type="submit" form="generate-form" className="bg-[#15803D] hover:bg-[#166534] text-white rounded-lg font-normal px-8">
              Generate Now
            </Button>
          </>
        }
      >
        <form id="generate-form" onSubmit={handleGenerate}>
          <div className="flex flex-col space-y-5 py-2">
            <div className="space-y-2">
              <Label>Report Name</Label>
              <SearchableSelect
                value={reportName}
                onValueChange={setReportName}
                options={tournaments.map(t => ({
                  value: `${t.name} Results`,
                  label: `${t.name} Results`
                }))}
                className="w-full"
                triggerClassName="h-11 bg-white border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label>Report Type</Label>
              <SearchableSelect
                value={reportType}
                onValueChange={setReportType}
                options={[
                  { value: "Tournament Results", label: "Tournament Results" },
                  { value: "Financial", label: "Financial Summary" },
                  { value: "Player List", label: "Player List" },
                  { value: "Analysis", label: "Analysis" },
                ]}
                className="w-full"
                triggerClassName="h-11 bg-white border-gray-200"
              />
            </div>
            <div className="space-y-1.5 pt-2">
              <Label className="text-[15px] font-medium text-gray-900">File Format</Label>
              <p className="text-[13px] text-gray-500 mb-3">Select the format you want your report to be generated in.</p>
              <div className="flex w-full bg-white border border-gray-200 rounded-lg overflow-hidden h-10">
                <button
                  type="button"
                  onClick={() => setReportFormat("CSV")}
                  className={`flex-1 text-sm transition-colors ${reportFormat === "CSV" ? "bg-[#15803D] text-white" : "bg-transparent text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  CSV (Spreadsheet)
                </button>
                <button
                  type="button"
                  onClick={() => setReportFormat("PDF")}
                  className={`flex-1 text-sm transition-colors border-l border-gray-200 ${reportFormat === "PDF" ? "bg-[#15803D] text-white border-transparent" : "bg-transparent text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  PDF Document
                </button>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteReportId}
        onClose={() => setDeleteReportId(null)}
        title="Delete Report"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteReportId(null)} className="rounded-lg font-normal">
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 border border-red-600/30 text-white rounded-lg font-normal px-8"
              onClick={confirmDelete}
            >
              Delete Report
            </Button>
          </>
        }
      >
        <div className="flex flex-col py-2">
          <p className="text-gray-500 max-w-sm">
            Are you sure you want to delete this report? This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
}
