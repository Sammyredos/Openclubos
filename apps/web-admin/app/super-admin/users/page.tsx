"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Ban,
  Crown,
  KeyRound,
  CreditCard,
  Trophy,
  Clock,
  Settings,
  Mail,
  Clipboard,
  Check,
  LogOut,
  Search,
  Download,
  Eye,
  Edit2,
  MoreHorizontal,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { broadcastAdminEvent, cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { FloatingMenu } from "@/components/ui/floating-menu";
import { toast } from "sonner";
import { deleteMember, forceLogoutUser, getAdminUsers, updateMember, type AdminUser } from "@/lib/api/members";
import { forgotPasswordRequest, getAuthToken } from "@/lib/api/auth";

function fullName(firstName: string | null, lastName: string | null) {
  const name = `${firstName || ""} ${lastName || ""}`.trim();
  return name || "—";
}

function formatJoinedDate(iso: string) {
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return fmt.format(d);
}

function generatePassword(length = 12) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  const bytes = new Uint32Array(length);
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i += 1) bytes[i] = Math.floor(Math.random() * 2 ** 32);
  }
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  if (e && typeof e === "object" && "message" in e && typeof (e as { message?: unknown }).message === "string") {
    return (e as { message: string }).message;
  }
  return null;
}

function formatCompactCurrency(value: number) {
  if (value >= 100) {
    return (Math.floor(value / 10) / 100).toFixed(2) + "k";
  }
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function RoleBadge({ role }: { role: AdminUser["role"] }) {
  const meta = (() => {
    switch (role) {
      case "SUPER_ADMIN":
        return { label: "SUPER_ADMIN", className: "bg-purple-50 text-purple-700 border-purple-100" };
      case "CLUB_ADMIN":
        return { label: "CLUB_ADMIN", className: "bg-blue-50 text-blue-700 border-blue-100" };
      case "MARKER":
        return { label: "MARKER", className: "bg-indigo-50 text-indigo-700 border-indigo-100" };
      default:
        return { label: "PLAYER", className: "bg-emerald-50 text-emerald-700 border-emerald-100" };
    }
  })();

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-bold", meta.className)}>
      {meta.label}
    </span>
  );
}

function StatusPill({ status }: { status: AdminUser["status"] }) {
  const meta = (() => {
    switch (status) {
      case "SUSPENDED":
        return { label: "Suspended", className: "bg-amber-50 text-amber-700 border-amber-100" };
      case "EXPIRED":
        return { label: "Expired", className: "bg-red-50 text-red-700 border-red-100" };
      default:
        return { label: "Active", className: "bg-emerald-50 text-emerald-700 border-emerald-100" };
    }
  })();
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold", meta.className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", status === "ACTIVE" ? "bg-emerald-500" : status === "SUSPENDED" ? "bg-amber-500" : "bg-red-500")} />
      {meta.label}
    </span>
  );
}

export default function SuperAdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<{
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    newThisMonth: number;
    superAdmins: number;
    roles: Record<string, number>;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [handicapFilter, setHandicapFilter] = useState("All Handicaps");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownAnchorEl, setDropdownAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [dropdownUser, setDropdownUser] = useState<AdminUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [statusAction, setStatusAction] = useState<"suspend" | "activate">("suspend");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isForceLogoutModalOpen, setIsForceLogoutModalOpen] = useState(false);
  const [resetTab, setResetTab] = useState<"link" | "generate">("link");
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<AdminUser["role"]>("PLAYER");
  const [editStatus, setEditStatus] = useState<AdminUser["status"]>("ACTIVE");
  const [editHandicap, setEditHandicap] = useState("");

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewTab, setViewTab] = useState<"overview" | "permissions" | "activity" | "payments" | "tournaments" | "settings">(
    "overview",
  );
  const [viewLoading, setViewLoading] = useState(false);
  const [viewRegistrations, setViewRegistrations] = useState<any[]>([]);
  const [activitySearch, setActivitySearch] = useState("");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [tournamentSearch, setTournamentSearch] = useState("");
  const [activityPage, setActivityPage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const [tournamentPage, setTournamentPage] = useState(1);
  const modalItemsPerPage = 5;

  const closeTimeoutRef = useRef<number | null>(null);
  const closeDropdown = () => {
    setActiveDropdown(null);
    if (closeTimeoutRef.current != null) window.clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = window.setTimeout(() => {
      setDropdownAnchorEl(null);
      setDropdownUser(null);
      closeTimeoutRef.current = null;
    }, 160);
  };


  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allUsers.filter((u) => {
      const name = fullName(u.firstName, u.lastName).toLowerCase();
      const email = (u.email || "").toLowerCase();
      const matchesSearch = q.length === 0 || name.includes(q) || email.includes(q);
      const matchesRole = roleFilter === "All Roles" || u.role === roleFilter;
      const matchesStatus = statusFilter === "All Status" || u.status === statusFilter;
      const matchesHandicap = (() => {
        if (handicapFilter === "All Handicaps") return true;
        if (u.role !== "PLAYER") return false;
        const h = typeof u.handicap === "number" ? u.handicap : null;
        if (h == null) return false;
        if (handicapFilter === "0 - 9.9") return h >= 0 && h < 10;
        if (handicapFilter === "10 - 19.9") return h >= 10 && h < 20;
        if (handicapFilter === "20 - 29.9") return h >= 20 && h < 30;
        if (handicapFilter === "30+") return h >= 30;
        return true;
      })();
      return matchesSearch && matchesRole && matchesStatus && matchesHandicap;
    });
  }, [allUsers, handicapFilter, searchQuery, roleFilter, statusFilter]);

  const total = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
  const pageSafe = Math.min(currentPage, totalPages);
  const paginatedUsers = useMemo(
    () => filteredUsers.slice((pageSafe - 1) * itemsPerPage, pageSafe * itemsPerPage),
    [filteredUsers, pageSafe, itemsPerPage],
  );

  async function reload() {
    const token = getAuthToken();
    if (!token) {
      setError("Not authenticated. Please login again.");
      setAllUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getAdminUsers({
        skip: 0,
        take: 10000,
      });
      setAllUsers(Array.isArray(data.items) ? data.items : []);
      setStats(data.stats ?? null);
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Failed to load users");
      setAllUsers([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await reload();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isViewModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsViewModalOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isViewModalOpen]);

  const roleSelectOptions = useMemo(
    () =>
      ["All Roles", "SUPER_ADMIN", "CLUB_ADMIN", "PLAYER", "MARKER"].map((v) => ({
        value: v,
        label:
          v === "All Roles"
            ? "All Roles"
            : v === "CLUB_ADMIN"
              ? "ORGANIZER ADMIN"
              : v.replaceAll("_", " "),
      })),
    [],
  );

  const statusSelectOptions = useMemo(
    () =>
      ["All Status", "ACTIVE", "SUSPENDED", "EXPIRED"].map((v) => ({
        value: v,
        label: v === "All Status" ? "All Status" : v[0] + v.slice(1).toLowerCase(),
      })),
    [],
  );

  const skeletonRows = Array.from({ length: itemsPerPage }, (_, idx) => idx);

  const rolesOverview = useMemo(() => {
    const map = stats?.roles ?? {};
    const rows = [
      { key: "CLUB_ADMIN", label: "Organizer Admins", color: "bg-blue-500", value: map.CLUB_ADMIN ?? 0 },
      { key: "PLAYER", label: "Players", color: "bg-emerald-500", value: map.PLAYER ?? 0 },
      { key: "MARKER", label: "Markers", color: "bg-indigo-500", value: map.MARKER ?? 0 },
    ];
    const superAdmins = map.SUPER_ADMIN ?? 0;
    return { rows, superAdmins };
  }, [stats]);

  const openStatusModal = (u: AdminUser) => {
    if (u.role === "SUPER_ADMIN") {
      toast.error("Super admin accounts cannot be suspended here");
      return;
    }
    setSelectedUser(u);
    setStatusAction(u.status === "SUSPENDED" ? "activate" : "suspend");
    setSuspendReason("");
    setIsStatusModalOpen(true);
    closeDropdown();
  };

  const openDeleteModal = (u: AdminUser) => {
    if (u.role === "SUPER_ADMIN") {
      toast.error("Super admin accounts cannot be deleted here");
      return;
    }
    setSelectedUser(u);
    setDeleteConfirmText("");
    setIsDeleteModalOpen(true);
    closeDropdown();
  };

  const canManageUser = (u: AdminUser) => u.role !== "SUPER_ADMIN";

  const openViewModal = async (u: AdminUser) => {
    setSelectedUser(u);
    setViewTab("overview");
    setActivitySearch("");
    setPaymentSearch("");
    setTournamentSearch("");
    setActivityPage(1);
    setPaymentPage(1);
    setTournamentPage(1);
    setIsViewModalOpen(true);
    setViewLoading(true);
    closeDropdown();

    try {
      const { getRegistrations } = await import("@/lib/api/registrations");
      const res = await getRegistrations({ userId: u.id, take: 500 });
      setViewRegistrations(res.items || []);
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || "Failed to load user activity");
    } finally {
      setViewLoading(false);
    }
  };

  const openEditModal = (u: AdminUser) => {
    setSelectedUser(u);
    setEditFullName(fullName(u.firstName, u.lastName));
    setEditEmail(u.email || "");
    setEditPhone(u.phone || "");
    setEditRole(u.role);
    setEditStatus(u.status);
    setEditHandicap(u.role === "PLAYER" && typeof u.handicap === "number" ? String(u.handicap) : "");
    setIsEditModalOpen(true);
    closeDropdown();
  };

  const openResetPasswordModal = (u: AdminUser) => {
    setSelectedUser(u);
    setResetTab("link");
    setGeneratedPassword(null);
    setCopiedPassword(false);
    setIsResetPasswordModalOpen(true);
    closeDropdown();
  };

  const handleMoreAction = (action: string, u: AdminUser) => {
    closeDropdown();
    if (action === "force-logout") {
      if (!canManageUser(u)) {
        toast.error("You can't force logout this account");
        return;
      }
      setSelectedUser(u);
      setIsForceLogoutModalOpen(true);
      return;
    }
    if (action === "export") {
      const blob = new Blob([JSON.stringify(u, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(u.email || "user").toString().replaceAll(" ", "-").toLowerCase()}-export.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("User data exported");
      return;
    }
    if (action === "reset-password") {
      openResetPasswordModal(u);
      return;
    }
    if (action === "delete") {
      openDeleteModal(u);
      return;
    }
  };

  const saveEdit = async () => {
    if (!selectedUser?.id) return;
    const nameParts = editFullName.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || null;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;
    const payload: Record<string, unknown> = {
      email: editEmail.trim(),
      firstName,
      lastName,
      phone: editPhone.trim(),
      role: editRole,
    };
    if (editRole === "PLAYER") {
      const raw = editHandicap.trim();
      if (raw.length === 0) {
        toast.error("Playing handicap is required for players");
        return;
      }
      const nextHandicap = Number(raw);
      if (!Number.isFinite(nextHandicap)) {
        toast.error("Handicap must be a valid number");
        return;
      }
      payload.handicap = nextHandicap;
    }
    setMutating(true);
    try {
      await updateMember(selectedUser.id, payload);
      toast.success("User updated");
      setIsEditModalOpen(false);
      await reload();
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || "Failed to update user");
    } finally {
      setMutating(false);
    }
  };

  const confirmStatusChange = async () => {
    if (!selectedUser?.id) return;
    setMutating(true);
    try {
      const nextStatus = statusAction === "activate" ? "ACTIVE" : "SUSPENDED";
      await updateMember(selectedUser.id, { status: nextStatus });
      toast.success(statusAction === "activate" ? "User activated" : "User suspended");
      setIsStatusModalOpen(false);
      await reload();
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || "Failed to update user status");
    } finally {
      setMutating(false);
    }
  };

  const confirmForceLogout = async () => {
    if (!selectedUser?.id) return;
    setMutating(true);
    try {
      await forceLogoutUser(selectedUser.id);
      toast.success("User has been logged out");
      setIsForceLogoutModalOpen(false);
      await reload();
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || "Failed to force logout user");
    } finally {
      setMutating(false);
    }
  };

  const sendResetLink = async () => {
    const email = selectedUser?.email;
    if (!email) {
      toast.error("No email found for this user");
      return;
    }
    setMutating(true);
    try {
      const r = await forgotPasswordRequest(email);
      toast.success(r?.message || "Reset link sent");
      setIsResetPasswordModalOpen(false);
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || "Failed to send reset email");
    } finally {
      setMutating(false);
    }
  };

  const generateAndSetPassword = async () => {
    if (!selectedUser?.id) return;
    const pw = generatePassword(12);
    setMutating(true);
    try {
      await updateMember(selectedUser.id, { password: pw });
      setGeneratedPassword(pw);
      setCopiedPassword(false);
      toast.success("Password generated");
      await reload();
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || "Failed to update password");
    } finally {
      setMutating(false);
    }
  };

  const copyGeneratedPassword = async () => {
    if (!generatedPassword) return;
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopiedPassword(true);
      window.setTimeout(() => setCopiedPassword(false), 1200);
    } catch {
      toast.error("Failed to copy password");
    }
  };

  const confirmDelete = async () => {
    if (!selectedUser?.id) return;
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") return;
    setMutating(true);
    try {
      await deleteMember(selectedUser.id);
      toast.success("User deleted");
      setIsDeleteModalOpen(false);
      broadcastAdminEvent("users-changed");
      broadcastAdminEvent("clubs-changed");
      await reload();
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || "Failed to delete user");
    } finally {
      setMutating(false);
    }
  };

  return (
    <div className="space-y-8 w-full max-w-full px-2 pb-10 font-sans">

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard
          title="Total Users"
          value={String(stats?.totalUsers ?? 0)}
          icon={Users}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          loading={loading}
        />
        <StatCard
          title="Active Users"
          value={String(stats?.activeUsers ?? 0)}
          subValue={stats?.totalUsers ? `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}% of total` : "0% of total"}
          icon={ShieldCheck}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          loading={loading}
        />
        <StatCard
          title="Suspended Users"
          value={String(stats?.suspendedUsers ?? 0)}
          subValue={stats?.totalUsers ? `${Math.round((stats.suspendedUsers / stats.totalUsers) * 100)}% of total` : "0% of total"}
          icon={Ban}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          loading={loading}
        />
        <StatCard
          title="New This Month"
          value={String(stats?.newThisMonth ?? 0)}
          icon={CheckCircle2}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          loading={loading}
        />
        <StatCard
          title="Super Admins"
          value={String(stats?.superAdmins ?? 0)}
          icon={Crown}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
          loading={loading}
        />
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
          <CardTitle className="text-xl font-bold">All Users</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="h-10 border-gray-200 text-gray-600 gap-2 rounded-lg px-4 text-[14px] font-bold">
              <Download className="w-4 h-4" /> Export
            </Button>
            <Button className="h-10 bg-[#10b981] hover:bg-[#0da673] border border-emerald-600/30 text-white gap-2 rounded-lg px-4 text-[14px] font-bold">
              <UserPlus className="w-4 h-4" /> Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-6 pb-6 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by name or email..."
                className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white rounded-lg text-[14px]"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <SearchableSelect
              value={roleFilter}
              onValueChange={(v) => {
                setRoleFilter(v);
                setCurrentPage(1);
              }}
              options={roleSelectOptions}
              className="min-w-[160px]"
              triggerClassName="h-11 bg-white font-medium"
              placeholder="All Roles"
            />
            <SearchableSelect
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setCurrentPage(1);
              }}
              options={statusSelectOptions}
              className="min-w-[160px]"
              triggerClassName="h-11 bg-white font-medium"
              placeholder="All Status"
            />
            <SearchableSelect
              value={handicapFilter}
              onValueChange={(v) => {
                setHandicapFilter(v);
                setCurrentPage(1);
              }}
              options={["All Handicaps", "0 - 9.9", "10 - 19.9", "20 - 29.9", "30+"].map((v) => ({
                value: v,
                label: v,
              }))}
              className="min-w-[160px]"
              triggerClassName="h-11 bg-white font-medium"
              placeholder="All Handicaps"
            />
          </div>

          <div className="overflow-x-auto relative">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-[12px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Handicap</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined Date</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  skeletonRows.map((i) => (
                    <tr key={`sk-${i}`} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="flex flex-col gap-2">
                            <Skeleton className="h-4 w-40 rounded-md" />
                            <Skeleton className="h-3 w-56 rounded-md" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-5 w-20 rounded-lg" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-14 rounded-md" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-5 w-24 rounded-lg" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-28 rounded-md" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Skeleton className="h-9 w-9 rounded-lg" />
                          <Skeleton className="h-9 w-9 rounded-lg" />
                          <Skeleton className="h-9 w-9 rounded-lg" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : paginatedUsers.length > 0 ? (
                  paginatedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 min-w-[260px]">
                          <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.email || u.id)}`}
                            alt={u.email}
                            className="w-10 h-10 rounded-full border border-gray-100 bg-gray-50"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-[14px] font-bold text-gray-900 truncate">{fullName(u.firstName, u.lastName)}</span>
                            <span className="text-[12px] text-gray-400 font-medium truncate">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-6 py-4 text-[14px] text-gray-500 font-medium">
                        {u.role === "PLAYER"
                          ? typeof u.handicap === "number"
                            ? u.handicap.toFixed(1)
                            : "—"
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill status={u.status} />
                      </td>
                      <td className="px-6 py-4 text-[14px] text-gray-500 font-medium whitespace-nowrap">
                        {formatJoinedDate(u.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-[#10b981]/10 hover:text-[#10b981] transition-colors"
                            title="View User"
                            onClick={() => openViewModal(u)}
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </button>
                          <button
                            disabled={!canManageUser(u)}
                            className={cn(
                              "h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white transition-colors",
                              !canManageUser(u)
                                ? "text-gray-300 cursor-not-allowed"
                                : u.status === "SUSPENDED"
                                  ? "text-emerald-600 hover:bg-emerald-50"
                                  : "text-red-600 hover:bg-red-50",
                            )}
                            title={u.status === "SUSPENDED" ? "Activate User" : "Suspend User"}
                            onClick={() => openStatusModal(u)}
                          >
                            {u.status === "SUSPENDED" ? (
                              <CheckCircle2 className="w-4.5 h-4.5" />
                            ) : (
                              <Ban className="w-4.5 h-4.5" />
                            )}
                          </button>
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                if (activeDropdown === u.id) {
                                  closeDropdown();
                                } else {
                                  if (closeTimeoutRef.current != null) {
                                    window.clearTimeout(closeTimeoutRef.current);
                                    closeTimeoutRef.current = null;
                                  }
                                  setActiveDropdown(u.id);
                                  setDropdownAnchorEl(e.currentTarget);
                                  setDropdownUser(u);
                                }
                              }}
                              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors"
                              title="More Actions"
                            >
                              <MoreHorizontal className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                          <Users className="w-8 h-8 text-gray-200" />
                        </div>
                        <div className="space-y-1 text-center">
                          <p className="text-[15px] font-bold text-gray-900">No users found</p>
                          <p className="text-[13px] text-gray-400">Try adjusting your filters or search query.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-6 border-t border-gray-50 flex items-center justify-between">
            <p className="text-[13px] text-gray-500 font-medium">
              Showing {total === 0 ? 0 : (pageSafe - 1) * itemsPerPage + 1} to {Math.min(pageSafe * itemsPerPage, total)} of {total} users
            </p>
            <Pagination currentPage={pageSafe} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Roles Overview</CardTitle>
            <span className="text-[12px] font-bold text-gray-400">Total: {stats?.totalUsers ?? 0}</span>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-[13px] font-bold text-gray-700">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                Super Admins
              </span>
              <span>{rolesOverview.superAdmins}</span>
            </div>
            {rolesOverview.rows.map((r) => (
              <div key={r.key} className="flex items-center justify-between text-[13px] font-bold text-gray-700">
                <span className="flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", r.color)} />
                  {r.label}
                </span>
                <span>{r.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Recent User Registrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : allUsers.length > 0 ? (
              allUsers.slice(0, 5).map((u) => (
                <div key={`recent-${u.id}`} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.email || u.id)}`}
                      alt={u.email}
                      className="h-10 w-10 rounded-xl border border-gray-100 bg-gray-50"
                    />
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-gray-900 truncate">{fullName(u.firstName, u.lastName)}</p>
                      <p className="text-[12px] text-gray-400 font-medium truncate">
                        {u.role.replaceAll("_", " ")}
                      </p>
                    </div>
                  </div>
                  <p className="text-[12px] text-gray-400 font-medium whitespace-nowrap">{formatJoinedDate(u.createdAt)}</p>
                </div>
              ))
            ) : (
              <p className="text-[13px] text-gray-400 font-medium">No users</p>
            )}
          </CardContent>
        </Card>
      </div>

      <FloatingMenu
        open={activeDropdown != null}
        anchorEl={dropdownAnchorEl}
        onClose={closeDropdown}
        placement="top-end"
        className="w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-2"
      >
        {dropdownUser ? (
          <>
            <button
              disabled={!canManageUser(dropdownUser)}
              onClick={() => openEditModal(dropdownUser)}
              className={cn(
                "w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 flex items-center gap-3",
                !canManageUser(dropdownUser) ? "text-gray-300 cursor-not-allowed" : "text-gray-700",
              )}
            >
              <Edit2 className="w-4 h-4 text-gray-400" />
              Edit User
            </button>
            <button
              disabled={!canManageUser(dropdownUser)}
              onClick={() => openResetPasswordModal(dropdownUser)}
              className={cn(
                "w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 flex items-center gap-3",
                !canManageUser(dropdownUser) ? "text-gray-300 cursor-not-allowed" : "text-gray-700",
              )}
            >
              <KeyRound className="w-4 h-4 text-gray-400" />
              Reset Password
            </button>
            <button
              disabled={!canManageUser(dropdownUser) || mutating}
              onClick={() => handleMoreAction("force-logout", dropdownUser)}
              className={cn(
                "w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 flex items-center gap-3",
                !canManageUser(dropdownUser) ? "text-gray-300 cursor-not-allowed" : "text-gray-700",
              )}
            >
              <LogOut className="w-4 h-4 text-gray-400" />
              Force Logout
            </button>
            <button
              onClick={() => handleMoreAction("export", dropdownUser)}
              className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <Download className="w-4 h-4 text-gray-400" />
              Export User
            </button>
            <div className="h-px bg-gray-50 my-1" />
            <button
              disabled={!canManageUser(dropdownUser)}
              onClick={() => handleMoreAction("delete", dropdownUser)}
              className={cn(
                "w-full text-left px-4 py-2 text-sm font-medium hover:bg-red-50 flex items-center gap-3",
                !canManageUser(dropdownUser) ? "text-gray-300 cursor-not-allowed" : "text-red-600",
              )}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
              Delete User
            </button>
          </>
        ) : null}
      </FloatingMenu>

      <Modal
        isOpen={isForceLogoutModalOpen}
        onClose={() => setIsForceLogoutModalOpen(false)}
        title="Force Logout User?"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsForceLogoutModalOpen(false)} className="rounded-lg font-bold">
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 border border-red-600/30 text-white rounded-lg font-bold px-8"
              onClick={confirmForceLogout}
              disabled={mutating}
            >
              Force Logout
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-red-50 text-red-500">
            <LogOut className="h-10 w-10" />
          </div>
          <h4 className="text-xl font-bold text-gray-900 mb-2">Force logout this user?</h4>
          <p className="text-gray-500 max-w-sm mt-1">
            This will immediately log out <span className="font-bold text-gray-800">{selectedUser?.email ?? "this user"}</span>.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={statusAction === "activate" ? "Activate User?" : "Suspend User?"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)} className="rounded-lg font-bold">
              Cancel
            </Button>
            <Button
              className={cn(
                "rounded-lg font-bold px-8 text-white border",
                statusAction === "activate"
                  ? "bg-[#10b981] hover:bg-[#0da673] border-emerald-600/30"
                  : "bg-red-500 hover:bg-red-600 border-red-600/30",
              )}
              onClick={confirmStatusChange}
              disabled={mutating}
            >
              {statusAction === "activate" ? "Yes, Activate" : "Yes, Suspend"}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center pt-2">
            <div
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mb-6",
                statusAction === "activate" ? "bg-emerald-50 text-[#10b981]" : "bg-red-50 text-red-500",
              )}
            >
              {statusAction === "activate" ? (
                <CheckCircle2 className="h-10 w-10" />
              ) : (
                <AlertTriangle className="h-10 w-10" />
              )}
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">
              {statusAction === "activate" ? "Activate User?" : "Suspend User?"}
            </h4>
            <p className="text-gray-500 max-w-sm">
              {statusAction === "activate"
                ? "This user will regain access to the platform."
                : "This user will be unable to access the platform until reactivated."}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-4 flex items-center gap-3">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedUser?.email || selectedUser?.id || "user")}`}
              alt={selectedUser?.email || "User"}
              className="h-11 w-11 rounded-2xl border border-gray-100 bg-white"
            />
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-gray-900 truncate">
                {fullName(selectedUser?.firstName ?? null, selectedUser?.lastName ?? null)}
              </p>
              <p className="text-[12px] text-gray-400 font-medium truncate">{selectedUser?.email || "—"}</p>
            </div>
          </div>

          {statusAction === "suspend" && (
            <div className="space-y-2">
              <Label className="font-bold text-gray-700">Reason (optional)</Label>
              <Input
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Enter reason for suspension..."
                className="rounded-xl h-12"
              />
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete User Permanently?"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="rounded-lg font-bold">
              Cancel
            </Button>
            <Button
              disabled={deleteConfirmText.trim().toUpperCase() !== "DELETE" || mutating}
              className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 border border-red-600/30 text-white rounded-lg font-bold px-8"
              onClick={confirmDelete}
            >
              Delete User
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center py-2">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-red-50 text-red-500">
              <Trash2 className="h-10 w-10" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Delete User Permanently?</h4>
            <p className="text-gray-500 max-w-sm">This action cannot be undone.</p>
          </div>
          <div className="space-y-3">
            <Label className="font-bold text-gray-700">
              Type <span className="text-red-600">&quot;DELETE&quot;</span> to confirm:
            </Label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="rounded-xl border-gray-200 focus:border-red-500"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="rounded-lg font-bold">
              Cancel
            </Button>
            <Button
              onClick={saveEdit}
              disabled={mutating}
              className="bg-[#10b981] hover:bg-[#0da673] border border-emerald-600/30 text-white rounded-lg font-bold px-8"
            >
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="font-bold text-gray-700">Full Name</Label>
            <Input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} className="rounded-xl h-12" />
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-gray-700">Email Address</Label>
            <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="rounded-xl h-12" />
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-gray-700">Phone Number</Label>
            <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="rounded-xl h-12" />
          </div>
          {editRole === "PLAYER" ? (
            <div className="space-y-2">
              <Label className="font-bold text-gray-700">Playing Handicap</Label>
              <Input
                type="number"
                step="0.1"
                value={editHandicap}
                onChange={(e) => setEditHandicap(e.target.value)}
                className="rounded-xl h-12"
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label className="font-bold text-gray-700">Role</Label>
            <SearchableSelect
              value={editRole}
              onValueChange={(v) => setEditRole(v as AdminUser["role"])}
              options={["SUPER_ADMIN", "CLUB_ADMIN", "PLAYER", "MARKER"].map((v) => ({
                value: v,
                label: v === "CLUB_ADMIN" ? "ORGANIZER ADMIN" : v.replaceAll("_", " "),
              }))}
              triggerClassName="h-12 bg-white font-medium rounded-xl"
              placeholder="Select role..."
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        title="Reset Password"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsResetPasswordModalOpen(false)} className="rounded-lg font-bold">
              Cancel
            </Button>
            {resetTab === "link" ? (
              <Button
                onClick={sendResetLink}
                disabled={mutating}
                className="bg-[#10b981] hover:bg-[#0da673] border border-emerald-600/30 text-white rounded-lg font-bold px-8"
              >
                Send Reset Link
              </Button>
            ) : (
              <Button
                onClick={generateAndSetPassword}
                disabled={mutating}
                className="bg-[#10b981] hover:bg-[#0da673] border border-emerald-600/30 text-white rounded-lg font-bold px-8"
              >
                Generate Password
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setResetTab("link")}
              className={cn(
                "h-10 px-4 rounded-xl text-[13px] font-bold border transition-colors",
                resetTab === "link"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50",
              )}
            >
              Send Reset Link
            </button>
            <button
              type="button"
              onClick={() => setResetTab("generate")}
              className={cn(
                "h-10 px-4 rounded-xl text-[13px] font-bold border transition-colors",
                resetTab === "generate"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50",
              )}
            >
              Generate Password
            </button>
          </div>

          {resetTab === "link" ? (
            <div className="flex flex-col items-center text-center py-2">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-emerald-50 text-[#10b981]">
                <Mail className="h-10 w-10" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Send password reset link to</h4>
              <p className="text-gray-500 max-w-sm">
                <span className="font-bold text-gray-800">{selectedUser?.email || "—"}</span>
              </p>
              <p className="text-gray-500 max-w-sm mt-2">
                User will receive an email with instructions to reset their password.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col items-center text-center py-2">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-emerald-50 text-[#10b981]">
                  <KeyRound className="h-10 w-10" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Generate a new password</h4>
                <p className="text-gray-500 max-w-sm">
                  Generates a secure password and updates it for <span className="font-bold text-gray-800">{selectedUser?.email || "—"}</span>.
                </p>
              </div>

              {generatedPassword && (
                <div className="rounded-2xl border border-gray-100 bg-gray-50/60 px-4 py-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">Generated Password</p>
                    <p className="text-[15px] font-bold text-gray-900 break-all">{generatedPassword}</p>
                  </div>
                  <button
                    type="button"
                    onClick={copyGeneratedPassword}
                    className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors"
                    title="Copy password"
                  >
                    {copiedPassword ? <Check className="h-5 w-5 text-[#10b981]" /> : <Clipboard className="h-5 w-5" />}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="View User Details"
        size="lg"
      >
        {(() => {
          const filteredActivity = viewRegistrations.filter((r) =>
            r.tournament.name.toLowerCase().includes(activitySearch.toLowerCase()),
          );
          const paginatedActivity = filteredActivity.slice(
            (activityPage - 1) * modalItemsPerPage,
            activityPage * modalItemsPerPage,
          );
          const totalActivityPages = Math.ceil(filteredActivity.length / modalItemsPerPage);

          const filteredPayments = viewRegistrations.filter((r) =>
            r.tournament.name.toLowerCase().includes(paymentSearch.toLowerCase()) ||
            (r.paymentReference || "").toLowerCase().includes(paymentSearch.toLowerCase())
          );
          const paginatedPayments = filteredPayments.slice(
            (paymentPage - 1) * modalItemsPerPage,
            paymentPage * modalItemsPerPage,
          );
          const totalPaymentPages = Math.ceil(filteredPayments.length / modalItemsPerPage);

          const filteredTournaments = viewRegistrations.filter((r) =>
            r.tournament.name.toLowerCase().includes(tournamentSearch.toLowerCase()),
          );
          const paginatedTournaments = filteredTournaments.slice(
            (tournamentPage - 1) * modalItemsPerPage,
            tournamentPage * modalItemsPerPage,
          );
          const totalTournamentPages = Math.ceil(filteredTournaments.length / modalItemsPerPage);

          return (
        <div className="space-y-6">
          <div className="flex items-start gap-4 pb-6 border-b border-gray-50">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedUser?.email || selectedUser?.id || "user")}`}
              alt={selectedUser?.email || "User"}
              className="h-16 w-16 rounded-2xl border border-gray-100 bg-gray-50"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xl font-bold text-gray-900 truncate">
                  {fullName(selectedUser?.firstName ?? null, selectedUser?.lastName ?? null)}
                </p>
                {selectedUser ? <StatusPill status={selectedUser.status} /> : null}
              </div>
              <p className="text-sm text-gray-400 font-medium truncate mt-1">{selectedUser?.email || "—"}</p>
              <p className="text-sm text-gray-500 font-medium truncate mt-1">
                {selectedUser?.role?.replaceAll("_", " ") ?? "—"} • {selectedUser?.club?.name ? `Organizer: ${selectedUser.club.name}` : "No Organizer Assigned"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1 bg-gray-50 rounded-2xl overflow-x-auto scrollbar-hide">
            {[
              { id: "overview", label: "Overview", icon: Users },
              { id: "activity", label: "Activity", icon: Clock },
              { id: "payments", label: "Payments", icon: CreditCard },
              { id: "tournaments", label: "Tournaments", icon: Trophy },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setViewTab(tab.id as any)}
                className={cn(
                  "flex-1 min-w-fit px-4 py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap",
                  viewTab === tab.id
                    ? "bg-white text-blue-600 shadow-sm border border-blue-50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
                )}
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="min-h-[300px]">
            {viewLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-40 w-full rounded-2xl" />
              </div>
            ) : viewTab === "overview" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-gray-100 p-5 space-y-4">
                  <h5 className="text-sm font-bold text-gray-900">Personal Information</h5>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-gray-500 font-medium">Full Name</span>
                      <span className="text-[13px] text-gray-900 font-bold">{fullName(selectedUser?.firstName ?? null, selectedUser?.lastName ?? null)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-gray-500 font-medium">Email</span>
                      <span className="text-[13px] text-gray-900 font-bold">{selectedUser?.email || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-gray-500 font-medium">Phone</span>
                      <span className="text-[13px] text-gray-900 font-bold">{selectedUser?.phone || "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 p-5 space-y-4">
                  <h5 className="text-sm font-bold text-gray-900">Account Details</h5>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-gray-500 font-medium">Role</span>
                      <RoleBadge role={selectedUser?.role || "PLAYER"} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-gray-500 font-medium">Status</span>
                      <StatusPill status={selectedUser?.status || "ACTIVE"} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-gray-500 font-medium">Joined Date</span>
                      <span className="text-[13px] text-gray-900 font-bold">{formatJoinedDate(selectedUser?.createdAt || "")}</span>
                    </div>
                  </div>
                </div>

                {selectedUser?.role === "PLAYER" && (
                  <div className="rounded-2xl border border-gray-100 p-5 col-span-full">
                    <h5 className="text-sm font-bold text-gray-900 mb-4">Player Statistics</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                        <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Handicap</p>
                        <p className="text-lg font-bold text-emerald-700">{selectedUser?.handicap?.toFixed(1) || "0.0"}</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Tournaments</p>
                        <p className="text-lg font-bold text-blue-700">{viewRegistrations.length}</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                        <p className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Wins</p>
                        <p className="text-lg font-bold text-purple-700">0</p>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                        <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Rank</p>
                        <p className="text-lg font-bold text-amber-700">—</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : viewTab === "activity" ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search activity..."
                    className="pl-9 h-10 bg-gray-50/50 border-gray-100 rounded-xl text-sm"
                    value={activitySearch}
                    onChange={(e) => {
                      setActivitySearch(e.target.value);
                      setActivityPage(1);
                    }}
                  />
                </div>
                <div className="space-y-3">
                  {paginatedActivity.length > 0 ? (
                    paginatedActivity.map((r) => (
                      <div key={r.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 bg-white hover:border-blue-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Trophy className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-gray-900">Registered for {r.tournament.name}</p>
                            <p className="text-[12px] text-gray-400 font-medium">{formatJoinedDate(r.registeredAt)}</p>
                          </div>
                        </div>
                        <StatusPill status={r.status === "APPROVED" ? "ACTIVE" : r.status === "REJECTED" ? "SUSPENDED" : "ACTIVE"} />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-400 font-medium">No activity found</p>
                    </div>
                  )}
                </div>
                {totalActivityPages > 1 && (
                  <div className="flex justify-end pt-2">
                    <Pagination currentPage={activityPage} totalPages={totalActivityPages} onPageChange={setActivityPage} />
                  </div>
                )}
              </div>
            ) : viewTab === "payments" ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search payments..."
                    className="pl-9 h-10 bg-gray-50/50 border-gray-100 rounded-xl text-sm"
                    value={paymentSearch}
                    onChange={(e) => {
                      setPaymentSearch(e.target.value);
                      setPaymentPage(1);
                    }}
                  />
                </div>
                <div className="overflow-hidden rounded-2xl border border-gray-100">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3">Tournament</th>
                        <th className="px-5 py-3">Amount</th>
                        <th className="px-5 py-3">Reference</th>
                        <th className="px-5 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-[13px]">
                      {paginatedPayments.length > 0 ? (
                        paginatedPayments.map((r) => (
                          <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-5 py-4 font-bold text-gray-900">{r.tournament.name}</td>
                            <td className="px-5 py-4 font-bold text-gray-700">₦{formatCompactCurrency(r.tournament.entryFee ?? 0)}</td>
                            <td className="px-5 py-4 font-medium text-gray-500">{r.paymentReference || "—"}</td>
                            <td className="px-5 py-4">
                              <span className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold",
                                r.paymentStatus === "PAID" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                              )}>
                                {r.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400 font-medium">No payments found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {totalPaymentPages > 1 && (
                  <div className="flex justify-end pt-2">
                    <Pagination currentPage={paymentPage} totalPages={totalPaymentPages} onPageChange={setPaymentPage} />
                  </div>
                )}
              </div>
            ) : viewTab === "tournaments" ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tournaments..."
                    className="pl-9 h-10 bg-gray-50/50 border-gray-100 rounded-xl text-sm"
                    value={tournamentSearch}
                    onChange={(e) => {
                      setTournamentSearch(e.target.value);
                      setTournamentPage(1);
                    }}
                  />
                </div>
                <div className="overflow-hidden rounded-2xl border border-gray-100">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3">Tournament</th>
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Fee</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-[13px]">
                      {paginatedTournaments.length > 0 ? (
                        paginatedTournaments.map((r) => (
                          <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-5 py-4 font-bold text-gray-900">{r.tournament.name}</td>
                            <td className="px-5 py-4 text-gray-500">{formatJoinedDate(r.tournament.startDate)}</td>
                            <td className="px-5 py-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-600">
                                {r.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right font-bold text-gray-700">₦{formatCompactCurrency(r.tournament.entryFee ?? 0)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400 font-medium">No tournaments found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {totalTournamentPages > 1 && (
                  <div className="flex justify-end pt-2">
                    <Pagination currentPage={tournamentPage} totalPages={totalTournamentPages} onPageChange={setTournamentPage} />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-gray-300" />
                </div>
                <h5 className="text-lg font-bold text-gray-900">Coming Soon</h5>
                <p className="text-sm text-gray-500 max-w-xs mt-1">
                  This section is currently under development and will be available in a future update.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    })()}
  </Modal>
</div>
  );
}
