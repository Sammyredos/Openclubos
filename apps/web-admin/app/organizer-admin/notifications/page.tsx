"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  Clock,
  Ban,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Search,
  CheckCheck,
  RefreshCw,
  Loader2,
  Layers,
  ChevronDown,
  Building2,
  ExternalLink,
  Download,
  FileSpreadsheet,
  FileText,
  Activity,
  Check,
  Eye,
} from "lucide-react";
import {
  AppNotification,
  NotificationType,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/api/notifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { FloatingMenu } from "@/components/ui/floating-menu";
import { exportToCsv, exportToPdf } from "@/lib/export";
import { cn, formatNumber } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";

const TYPE_META: Record<
  NotificationType,
  { label: string; badge: string; icon: React.ComponentType<{ className?: string }> }
> = {
  WITHDRAWAL_REQUESTED: {
    label: "Payout Request",
    badge: "bg-emerald-50 text-openclub-800 border-[#e1efe5]",
    icon: ArrowUpRight,
  },
  WITHDRAWAL_APPROVED: {
    label: "Disbursed",
    badge: "bg-emerald-50 text-openclub-800 border-[#e1efe5]",
    icon: ShieldCheck,
  },
  WITHDRAWAL_REJECTED: {
    label: "Declined",
    badge: "bg-rose-50 text-rose-600 border-rose-100",
    icon: AlertTriangle,
  },
  TOURNAMENT_UPDATE: {
    label: "Tournament",
    badge: "bg-blue-50 text-blue-600 border-blue-100",
    icon: Layers,
  },
  PAYMENT_RECEIVED: {
    label: "Payment",
    badge: "bg-emerald-50 text-openclub-800 border-[#e1efe5]",
    icon: CheckCircle2,
  },
  SYSTEM: {
    label: "System",
    badge: "bg-slate-50 text-gray-600 border-slate-200",
    icon: Bell,
  },
};

export default function OrganizerNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [typeFilter, setTypeFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Export
  const [exportAnchorEl, setExportAnchorEl] = useState<HTMLElement | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const listRes = await getNotifications({ take: 200 });
      setNotifications(listRes.items);
      setUnreadCount(listRes.unreadCount);
    } catch {
      setError("Failed to load notifications. Please try again.");
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark notifications as read");
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleMarkRead = async (notif: AppNotification) => {
    if (notif.isRead) return;
    try {
      await markNotificationAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignore
    }
  };

  const handleActionClick = (notif: AppNotification) => {
    handleMarkRead(notif);

    if (
      notif.type === "WITHDRAWAL_REQUESTED" ||
      notif.type === "WITHDRAWAL_APPROVED" ||
      notif.type === "WITHDRAWAL_REJECTED"
    ) {
      router.push("/organizer-admin/payments/withdrawals");
    } else if (notif.type === "TOURNAMENT_UPDATE") {
      router.push("/organizer-admin/tournaments");
    }
  };

  // Filtered dataset
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      // Category / Type filter
      if (typeFilter !== "All Categories") {
        if (typeFilter === "Payout Requests" && notif.type !== "WITHDRAWAL_REQUESTED") return false;
        if (typeFilter === "Disbursements" && notif.type !== "WITHDRAWAL_APPROVED") return false;
        if (typeFilter === "Declined Payouts" && notif.type !== "WITHDRAWAL_REJECTED") return false;
        if (typeFilter === "Tournaments" && notif.type !== "TOURNAMENT_UPDATE") return false;
        if (typeFilter === "Payments" && notif.type !== "PAYMENT_RECEIVED") return false;
        if (typeFilter === "System" && notif.type !== "SYSTEM") return false;
      }

      // Status dropdown filter
      if (statusFilter === "Unread" && notif.isRead) return false;
      if (statusFilter === "Read" && !notif.isRead) return false;

      // Search query
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const matchesTitle = notif.title.toLowerCase().includes(q);
        const matchesBody = notif.body.toLowerCase().includes(q);
        if (!matchesTitle && !matchesBody) return false;
      }

      return true;
    });
  }, [notifications, typeFilter, statusFilter, debouncedSearch]);

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage) || 1;
  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredNotifications.slice(start, start + itemsPerPage);
  }, [filteredNotifications, currentPage]);

  return (
    <div className="space-y-6 w-full max-w-full px-2 pb-10 font-sans">
      {/* Main Content - Table Area */}
      <div className="w-full space-y-6">
        <Card className="border-none shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
            <CardTitle className="text-zinc-700 text-xl font-medium whitespace-nowrap">
              All Notifications
            </CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={(e) => setExportAnchorEl(e.currentTarget)}
                className="h-10 border-[#e1efe5] text-gray-600 gap-2 rounded-lg px-4 text-[14px] font-normal cursor-pointer"
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
                      filteredNotifications,
                      [
                        { header: "Title", key: "title" },
                        { header: "Message", key: "body" },
                        { header: "Type", key: "type" },
                        { header: "Read", key: "isRead" },
                        { header: "Date", key: "createdAt" },
                      ],
                      "notifications-export.csv"
                    );
                    toast.success("Notifications exported to CSV");
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] hover:text-gray-900 transition-colors text-gray-700 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-openclub-800" />
                  Export CSV
                </button>
                <button
                  onClick={() => {
                    setExportAnchorEl(null);
                    exportToPdf(
                      filteredNotifications,
                      [
                        { header: "Title", key: "title" },
                        { header: "Type", key: "type" },
                        { header: "Date", key: "createdAt" },
                      ],
                      "notifications-export.pdf",
                      "Notifications Export"
                    );
                    toast.success("Notifications exported to PDF");
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] hover:text-gray-900 transition-colors text-gray-700 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-rose-600" />
                  Export PDF
                </button>
              </FloatingMenu>

              {unreadCount > 0 && (
                <Button
                  onClick={handleMarkAllRead}
                  disabled={isMarkingAll}
                  className="h-10 bg-[#15803D] hover:bg-[#166534] border border-openclub-800/30 text-white gap-2 rounded-lg px-4 text-[14px] font-medium cursor-pointer"
                >
                  {isMarkingAll ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCheck className="w-4 h-4" />
                  )}
                  Mark All as Read
                </Button>
              )}

              <Button
                variant="outline"
                onClick={fetchList}
                disabled={loading}
                className="h-10 border-[#e1efe5] text-gray-600 gap-2 rounded-lg px-3 text-[14px] font-normal cursor-pointer"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Main Container */}
            <div className="px-6 pb-6">
              <div className="bg-background rounded-xl border border-[#e1efe5] overflow-hidden">
                {/* Search & Filter Bar */}
                <div className="p-5 border-b border-[#e1efe5]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#15803D]" />
                      <Input
                        placeholder="Search notification title, message details..."
                        className="pl-10 h-11 rounded-lg text-[14px] border-[#e1efe5] bg-white text-[#15803D] focus:bg-white placeholder:text-[#15803D]/60"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-4 ml-auto">
                      <SearchableSelect
                        value={typeFilter}
                        onValueChange={(v) => {
                          setTypeFilter(v);
                          setCurrentPage(1);
                        }}
                        options={[
                          { value: "All Categories", label: "All Categories" },
                          { value: "Payout Requests", label: "Payout Requests" },
                          { value: "Disbursements", label: "Disbursements" },
                          { value: "Declined Payouts", label: "Declined Payouts" },
                          { value: "Tournaments", label: "Tournaments" },
                          { value: "Payments", label: "Payments" },
                          { value: "System", label: "System Alerts" },
                        ]}
                        className="min-w-[160px]"
                        triggerClassName="h-11 bg-white border-[#e1efe5] text-[#15803D] font-medium"
                        placeholder="All Categories"
                      />
                      <SearchableSelect
                        value={statusFilter}
                        onValueChange={(v) => {
                          setStatusFilter(v);
                          setCurrentPage(1);
                        }}
                        options={[
                          { value: "All Status", label: "All Status" },
                          { value: "Unread", label: "Unread" },
                          { value: "Read", label: "Read" },
                        ]}
                        className="min-w-[160px]"
                        triggerClassName="h-11 bg-white border-[#e1efe5] text-[#15803D] font-medium"
                        placeholder="All Status"
                      />
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="w-full overflow-x-auto min-h-[400px]">
                  <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                    <thead>
                      <tr className="bg-[#f5faf6] border-b border-[#e1efe5] text-[10px] font-normal text-[#15803D] uppercase tracking-wider">
                        <th className="px-6 py-4">NOTIFICATION</th>
                        <th className="px-6 py-4">CATEGORY & TYPE</th>
                        <th className="px-6 py-4">DATE & TIME</th>
                        <th className="px-6 py-4">STATUS</th>
                        <th className="px-6 py-4 text-center">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e1efe5]">
                      {error ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-red-500 font-normal text-[13px]">
                            {error}
                          </td>
                        </tr>
                      ) : loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className="hover:bg-background/50 transition-colors">
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                                <div className="flex flex-col gap-1.5">
                                  <Skeleton className="h-4 w-48 rounded-md" />
                                  <Skeleton className="h-3 w-64 rounded-md" />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <Skeleton className="h-5.5 w-24 rounded-md" />
                            </td>
                            <td className="px-6 py-5">
                              <Skeleton className="h-4 w-28 rounded-md" />
                            </td>
                            <td className="px-6 py-5">
                              <Skeleton className="h-5.5 w-16 rounded-full" />
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center justify-center gap-2">
                                <Skeleton className="h-8 w-20 rounded-md" />
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : paginatedNotifications.length > 0 ? (
                        paginatedNotifications.map((notif) => {
                          const meta = TYPE_META[notif.type] || TYPE_META.SYSTEM;
                          const Icon = meta.icon;
                          return (
                            <tr
                              key={notif.id}
                              className={cn(
                                "hover:bg-background/50 transition-colors group cursor-pointer",
                                !notif.isRead && "bg-[#15803D]/[0.02]"
                              )}
                              onClick={() => handleActionClick(notif)}
                            >
                              {/* Notification Title & Body */}
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3 min-w-[280px]">
                                  <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-[#f5faf6] text-[#15803D] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-[#e1efe5]">
                                      <Icon className="w-4 h-4 text-[#15803D]" />
                                    </div>
                                    {!notif.isRead && (
                                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#15803D] ring-2 ring-white" />
                                    )}
                                  </div>
                                  <div className="flex flex-col min-w-0 gap-0.5">
                                    <span
                                      className={cn(
                                        "text-[14px] truncate leading-tight",
                                        !notif.isRead
                                          ? "text-slate-900 font-semibold"
                                          : "text-slate-700 font-medium"
                                      )}
                                      title={notif.title}
                                    >
                                      {notif.title}
                                    </span>
                                    <span
                                      className="text-gray-500 text-[12px] font-normal truncate mt-0.5 max-w-md"
                                      title={notif.body}
                                    >
                                      {notif.body}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Category & Type Badge */}
                              <td className="px-6 py-5">
                                <div
                                  className={cn(
                                    "inline-flex items-center w-fit px-2.5 py-1 rounded border gap-1.5 text-[11px] font-medium uppercase",
                                    meta.badge
                                  )}
                                >
                                  <Icon className="w-3 h-3 shrink-0" />
                                  <span>{meta.label}</span>
                                </div>
                              </td>

                              {/* Date & Time */}
                              <td className="px-6 py-5">
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[13px] text-gray-600 font-medium truncate leading-tight">
                                    {new Date(notif.createdAt).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </span>
                                  <span className="text-gray-500 text-[11px] font-normal mt-0.5">
                                    {new Date(notif.createdAt).toLocaleTimeString(undefined, {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </td>

                              {/* Status Badge */}
                              <td className="px-6 py-5">
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap uppercase border",
                                    notif.isRead
                                      ? "bg-slate-50 text-gray-600 border-slate-200"
                                      : "bg-emerald-50 text-openclub-800 border-[#e1efe5]"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "w-1.5 h-1.5 rounded-full",
                                      notif.isRead ? "bg-gray-400" : "bg-[#15803D]"
                                    )}
                                  />
                                  {notif.isRead ? "Read" : "Unread"}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-center gap-2">
                                  {(notif.type === "WITHDRAWAL_REQUESTED" ||
                                    notif.type === "WITHDRAWAL_APPROVED" ||
                                    notif.type === "WITHDRAWAL_REJECTED" ||
                                    notif.type === "TOURNAMENT_UPDATE") && (
                                    <button
                                      onClick={() => handleActionClick(notif)}
                                      className="h-8 px-3 inline-flex items-center justify-center gap-1.5 rounded-md bg-[#15803D] text-white hover:bg-[#166534] transition-colors text-[12px] font-medium cursor-pointer shadow-xs"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      View
                                    </button>
                                  )}

                                  {!notif.isRead && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleMarkRead(notif)}
                                      className="h-8 px-2.5 border-[#e1efe5] text-gray-600 hover:text-[#15803D] hover:bg-emerald-50 text-[12px] font-normal rounded-md cursor-pointer"
                                    >
                                      <Check className="w-3 h-3 mr-1" />
                                      Mark Read
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-16 text-center text-zinc-400">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <div className="w-12 h-12 rounded-full bg-[#f5faf6] text-[#15803D] flex items-center justify-center border border-[#e1efe5]">
                                <Bell className="w-6 h-6" />
                              </div>
                              <p className="text-sm font-semibold text-zinc-900 mt-1">
                                No notifications found
                              </p>
                              <p className="text-xs text-zinc-400">
                                {searchQuery
                                  ? "No notifications match your search criteria."
                                  : "You're all caught up! Real-time alerts and payout activities will appear here."}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer with Pagination */}
                {filteredNotifications.length > 0 && (
                  <div className="p-5 border-t border-[#e1efe5] flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
                    <div className="text-[13px] text-gray-500 font-normal">
                      Showing{" "}
                      <span className="font-semibold text-slate-900">
                        {(currentPage - 1) * itemsPerPage + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-semibold text-slate-900">
                        {Math.min(currentPage * itemsPerPage, filteredNotifications.length)}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-slate-900">
                        {formatNumber(filteredNotifications.length)}
                      </span>{" "}
                      notifications
                    </div>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
