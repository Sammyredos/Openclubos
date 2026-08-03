"use client";

import { useMemo, useState } from "react";
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
  Settings2
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { cn, formatNumber } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";

// Mock Data
const MOCK_REPORTS = [
  { id: "RPT-4029", name: "Summer Classic 2026 Results", type: "Tournament Results", format: "PDF", size: "2.4 MB", generatedAt: "2026-08-01T15:30:00Z", status: "READY" },
  { id: "RPT-4028", name: "July Revenue Summary", type: "Financial", format: "CSV", size: "145 KB", generatedAt: "2026-08-01T09:00:00Z", status: "READY" },
  { id: "RPT-4027", name: "Player Roster - Members Inv.", type: "Player List", format: "CSV", size: "56 KB", generatedAt: "2026-07-28T14:20:00Z", status: "READY" },
  { id: "RPT-4026", name: "Members Invitational Scorecards", type: "Tournament Results", format: "PDF", size: "4.1 MB", generatedAt: "2026-07-25T18:45:00Z", status: "READY" },
  { id: "RPT-4025", name: "Annual Handicap Review", type: "Analysis", format: "PDF", size: "1.2 MB", generatedAt: "2026-07-20T10:15:00Z", status: "READY" },
  { id: "RPT-4024", name: "June Revenue Summary", type: "Financial", format: "CSV", size: "132 KB", generatedAt: "2026-07-01T09:00:00Z", status: "READY" },
  { id: "RPT-4023", name: "Spring Open 2026 Results", type: "Tournament Results", format: "PDF", size: "3.5 MB", generatedAt: "2026-06-15T16:30:00Z", status: "FAILED" },
];

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
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "READY") {
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
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const perPage = 10;

  const filteredData = useMemo(() => {
    return MOCK_REPORTS.filter(rpt => {
      if (typeFilter !== "ALL" && rpt.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!rpt.name.toLowerCase().includes(q) && !rpt.id.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [search, typeFilter]);

  const totalReports = MOCK_REPORTS.length;
  const recentReports = MOCK_REPORTS.filter(r => new Date(r.generatedAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000).length;

  return (
    <div className="space-y-8 w-full max-w-full px-2 pb-10 font-sans">
      <div className="w-full bg-white rounded-lg shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-x-auto">
        <div className="flex items-center justify-between p-8 min-w-max gap-12 font-sans">
          
          <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
            <div className="flex justify-start items-center gap-3.5">
              <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Total Reports</div>
            </div>
            <div className="text-[#15803D] text-3xl font-bold">{formatNumber(totalReports)}</div>
            <div className="text-zinc-500 text-sm font-normal">All Time</div>
          </div>

          <div className="w-px h-16 bg-slate-200" />

          <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
            <div className="flex justify-start items-center gap-3.5">
              <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Storage Used</div>
            </div>
            <div className="text-[#15803D] text-3xl font-bold">11.6 MB</div>
            <div className="text-zinc-500 text-sm font-normal">Available capacity: 1.2 GB</div>
          </div>

          <div className="w-px h-16 bg-slate-200" />

          <div className="flex flex-col justify-start items-start gap-3.5 flex-1">
            <div className="flex justify-start items-center gap-3.5">
              <div className="text-zinc-700 text-[15px] font-medium whitespace-nowrap">Scheduled Reports</div>
            </div>
            <div className="text-[#15803D] text-3xl font-bold">2</div>
            <div className="text-zinc-500 text-sm font-normal">Next run tomorrow 9:00 AM</div>
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
              <div className="relative flex-1 min-w-[240px]">
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
              <thead className="bg-[#f5faf6] border-b border-[#e1efe5]">
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
                {filteredData.slice((page - 1) * perPage, page * perPage).map((rpt) => (
                  <tr key={rpt.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                          {rpt.format === "PDF" ? <FileText className="h-4 w-4 text-rose-500" /> : <FileSpreadsheet className="h-4 w-4 text-emerald-600" />}
                        </div>
                        <div>
                          <div className="text-[14px] font-medium text-gray-900 leading-tight">{rpt.name}</div>
                          <div className="text-[12px] text-gray-500 mt-0.5">{rpt.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ReportTypeIcon type={rpt.type} />
                        <span className="text-[13px] text-gray-700">{rpt.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] font-medium text-gray-700">{rpt.format}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] text-gray-600">{rpt.size}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] text-gray-600">{formatDate(rpt.generatedAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={rpt.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-[#15803D] hover:bg-[#e1efe5]">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <FileText className="w-12 h-12 mb-4 text-gray-300" />
                        <p className="text-base font-medium text-gray-900">No reports found</p>
                        <p className="text-sm mt-1">Generate a new report or adjust your filters</p>
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

      <Modal isOpen={showGenerateModal} onClose={() => setShowGenerateModal(false)} title="Generate Report" size="md">
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <Label>Report Type</Label>
            <SearchableSelect
              value="Tournament Results"
              onValueChange={() => {}}
              options={[
                { value: "Tournament Results", label: "Tournament Results" },
                { value: "Financial", label: "Financial Summary" },
                { value: "Player List", label: "Player List" },
              ]}
              className="w-full"
              triggerClassName="h-11 bg-white border-gray-200"
            />
          </div>
          <div className="space-y-2">
            <Label>Tournament</Label>
            <SearchableSelect
              value="Summer Classic 2026"
              onValueChange={() => {}}
              options={[
                { value: "Summer Classic 2026", label: "Summer Classic 2026" },
                { value: "Members Invitational", label: "Members Invitational" },
              ]}
              className="w-full"
              triggerClassName="h-11 bg-white border-gray-200"
            />
          </div>
          <div className="space-y-2">
            <Label>Export Format</Label>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-11 border-openclub-600 bg-openclub-50 text-openclub-800 font-medium">PDF Document</Button>
              <Button variant="outline" className="flex-1 h-11 border-gray-200 text-gray-600">CSV Excel</Button>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-[#e1efe5] bg-gray-50 flex justify-end gap-3 rounded-b-xl">
          <Button variant="outline" onClick={() => setShowGenerateModal(false)}>Cancel</Button>
          <Button className="bg-[#15803D] hover:bg-[#166534] text-white">Generate Now</Button>
        </div>
      </Modal>
    </div>
  );
}
