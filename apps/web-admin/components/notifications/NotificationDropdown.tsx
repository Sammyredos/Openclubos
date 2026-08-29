"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  CreditCard,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  ExternalLink,
  X,
  Banknote,
  Clock,
} from "lucide-react";
import {
  AppNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/api/notifications";
import {
  getAllWithdrawals,
  getAdminWithdrawalStats,
  getMyWithdrawals,
  type WithdrawalRequestItem,
  type AdminWithdrawalStats,
} from "@/lib/api/withdrawals";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export function NotificationDropdown() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isOrganizerAdmin = user?.role === "CLUB_ADMIN";

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<WithdrawalRequestItem[]>([]);
  const [pendingWithdrawalCount, setPendingWithdrawalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [bannerDismissedId, setBannerDismissedId] = useState<string | null>(null);
  const prevPendingCountRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const notificationsUrl = isSuperAdmin
    ? "/super-admin/notifications"
    : "/organizer-admin/notifications";

  const payoutManagementUrl = isSuperAdmin
    ? "/super-admin/payments/withdrawals"
    : "/organizer-admin/payments/withdrawals";

  const fetchAllData = useCallback(async (isInitial = false) => {
    if (!user) return;
    try {
      // 1. Fetch unread notifications only
      const notifPromise = getNotifications({ take: 20, unreadOnly: true }).catch(() => ({
        items: [],
        unreadCount: 0,
        total: 0,
      }));

      // 2. Fetch pending withdrawals directly from DB for immediate reactivity
      let withdrawalsPromise: Promise<{ items: WithdrawalRequestItem[]; total: number }> =
        Promise.resolve({ items: [], total: 0 });

      if (isSuperAdmin) {
        withdrawalsPromise = getAllWithdrawals({ status: "PENDING" as any, take: 5 }).catch(
          () => ({ items: [], total: 0 })
        );
      } else if (isOrganizerAdmin) {
        withdrawalsPromise = getMyWithdrawals({ status: "PENDING" as any, take: 5 }).catch(
          () => ({ items: [], total: 0 })
        );
      }

      const [notifRes, withdrawRes] = await Promise.all([notifPromise, withdrawalsPromise]);

      const unreadItems = (notifRes.items || []).filter((n) => !n.isRead);
      setNotifications(unreadItems);
      setUnreadCount(notifRes.unreadCount || unreadItems.length);
      setPendingWithdrawals(withdrawRes.items || []);
      setPendingWithdrawalCount(withdrawRes.total || (withdrawRes.items ? withdrawRes.items.length : 0));

      // Trigger pop-up alert for newly detected pending withdrawal payout request
      const currentPendingCount = withdrawRes.total || (withdrawRes.items ? withdrawRes.items.length : 0);
      if (isSuperAdmin && currentPendingCount > 0) {
        if (
          !isInitial &&
          prevPendingCountRef.current !== null &&
          currentPendingCount > prevPendingCountRef.current
        ) {
          const newest = withdrawRes.items[0];
          toast.warning("New Payout Request Received", {
            description: `${formatCurrency(newest?.amount || 0)} from ${
              newest?.club?.name || "Club Organizer"
            }. Action required.`,
            action: {
              label: "Take Action",
              onClick: () => router.push(payoutManagementUrl),
            },
            duration: 8000,
          });
        }
      }
      prevPendingCountRef.current = currentPendingCount;
    } catch {
      // Ignore background errors
    } finally {
      setIsLoading(false);
    }
  }, [user, isSuperAdmin, isOrganizerAdmin, router, payoutManagementUrl]);

  // Periodic real-time background sync every 8 seconds
  useEffect(() => {
    if (!user) return;
    fetchAllData(true);
    const interval = setInterval(() => fetchAllData(false), 8000);
    return () => clearInterval(interval);
  }, [user, fetchAllData, pathname]);

  // Refresh when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetchAllData(false);
    }
  }, [isOpen, fetchAllData]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      // Remove all seen/read notifications from dropdown
      setNotifications([]);
      setUnreadCount(0);
      setBannerDismissedId("all");
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error(err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    // Mark as read and immediately remove from dropdown
    markNotificationAsRead(notif.id).catch(() => {});
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    setUnreadCount((prev) => Math.max(0, prev - 1));

    setIsOpen(false);

    if (
      notif.type === "WITHDRAWAL_REQUESTED" ||
      notif.type === "WITHDRAWAL_APPROVED" ||
      notif.type === "WITHDRAWAL_REJECTED"
    ) {
      router.push(payoutManagementUrl);
    } else if (notif.type === "TOURNAMENT_UPDATE") {
      const targetUrl = isSuperAdmin ? "/super-admin/tournaments" : "/organizer-admin/tournaments";
      router.push(targetUrl);
    } else {
      router.push(notificationsUrl);
    }
  };

  const handleTakePayoutAction = () => {
    setIsOpen(false);
    router.push(payoutManagementUrl);
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "WITHDRAWAL_REQUESTED":
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#15803D] shrink-0">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        );
      case "WITHDRAWAL_APPROVED":
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#15803D] shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
        );
      case "WITHDRAWAL_REJECTED":
        return (
          <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <Bell className="w-4 h-4" />
          </div>
        );
    }
  };

  const latestPendingWithdrawal = pendingWithdrawals[0];
  const totalCombinedBadge = unreadCount + (isSuperAdmin ? pendingWithdrawalCount : 0);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open notifications"
        className={cn(
          "relative w-10 h-10 rounded-xl border bg-white hover:bg-slate-50 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-2xs",
          pendingWithdrawalCount > 0 && isSuperAdmin
            ? "border-amber-400 text-amber-700 bg-amber-50/40"
            : "border-[#e1efe5] text-zinc-700"
        )}
      >
        <Bell className={cn("w-5 h-5", pendingWithdrawalCount > 0 && isSuperAdmin ? "text-amber-700" : "text-zinc-600")} />
        {totalCombinedBadge > 0 && (
          <span
            className={cn(
              "absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[11px] font-bold text-white shadow-xs animate-in zoom-in-50",
              pendingWithdrawalCount > 0 && isSuperAdmin ? "bg-amber-600" : "bg-[#15803D]"
            )}
          >
            {totalCombinedBadge > 99 ? "99+" : totalCombinedBadge}
          </span>
        )}
      </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-[#e1efe5] bg-white shadow-xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e1efe5] bg-[#f5faf6]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-900">Notifications</h3>
                {totalCombinedBadge > 0 && (
                  <span
                    className={cn(
                      "px-2 py-0.5 text-[11px] font-semibold rounded-full",
                      pendingWithdrawalCount > 0 && isSuperAdmin
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-[#15803D]"
                    )}
                  >
                    {totalCombinedBadge} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={isMarkingAll}
                  className="text-xs text-[#15803D] hover:text-[#116731] font-medium transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isMarkingAll ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCheck className="w-3.5 h-3.5" />
                  )}
                  Mark all read
                </button>
              )}
            </div>

            {/* Pinned Pending Payout Alert in Dropdown for Super Admin */}
            {isSuperAdmin && pendingWithdrawals.length > 0 && (
              <div className="p-3.5 bg-amber-50/90 border-b border-amber-200">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-amber-600" />
                    <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                      Pending Payouts Awaiting Action
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded">
                    {pendingWithdrawals.length} Action(s)
                  </span>
                </div>
                <div className="space-y-1.5 mb-2.5">
                  {pendingWithdrawals.slice(0, 2).map((w) => (
                    <div
                      key={w.id}
                      className="text-xs text-amber-900 flex items-center justify-between bg-white/80 px-2.5 py-1.5 rounded-lg border border-amber-200"
                    >
                      <span className="font-semibold">{formatCurrency(w.amount)}</span>
                      <span className="text-amber-800 text-[11px] truncate max-w-[140px]">
                        {w.club?.name || "Organizer"}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleTakePayoutAction}
                  className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  Review & Process Payouts →
                </button>
              </div>
            )}

            {/* Notifications List Content */}
            <div className="max-h-[340px] overflow-y-auto divide-y divide-gray-100">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[#15803D]" />
                  <span className="text-xs">Loading notifications...</span>
                </div>
              ) : notifications.length === 0 && pendingWithdrawals.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                    <Bell className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-zinc-800">No notifications</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    You're all caught up! Real-time alerts will appear here.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      "p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-slate-50/80 text-left",
                      !notif.isRead && "bg-emerald-50/30"
                    )}
                  >
                    {getNotificationIcon(notif.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p
                          className={cn(
                            "text-xs leading-snug truncate",
                            !notif.isRead ? "font-semibold text-zinc-900" : "font-medium text-zinc-800"
                          )}
                        >
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-zinc-400 whitespace-nowrap shrink-0">
                          {formatTimestamp(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-600 leading-normal line-clamp-2">
                        {notif.body}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#15803D] shrink-0 mt-1.5" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer View All Link with signature off-green styling */}
            <div className="border-t border-[#e1efe5] bg-[#f5faf6] p-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push(notificationsUrl);
                }}
                className="w-full py-2 text-xs font-semibold text-[#15803D] hover:text-[#166534] hover:bg-[#eaf4ed] rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                View all notifications
                <ExternalLink className="w-3.5 h-3.5 text-[#15803D]" />
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
