"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Ban,
  Crown,
  KeyRound,
  CreditCard,
  Trophy,
  Globe,
  Shield,
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
  MapPin,
  BarChart3,
  Activity,
  Target,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
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
import dynamic from "next/dynamic";
import { WizardSkeleton } from "@/components/ui/wizard-skeleton";



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
        return { label: "super admin", className: "bg-purple-50 text-purple-700 border-purple-100" };
      case "CLUB_ADMIN":
        return { label: "organiser admin", className: "bg-blue-50 text-blue-700 border-blue-100" };
      case "MARKER":
        return { label: "marker", className: "bg-indigo-50 text-indigo-700 border-indigo-100" };
      default:
        return { label: "player", className: "bg-emerald-50 text-emerald-700 border-emerald-100" };
    }
  })();

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-bold capitalize", meta.className)}>
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
  const router = useRouter();
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
  const [isCreateWizardOpen, setIsCreateWizardOpen] = useState(false);
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
    const tokens = q.split(/[\s-]+/).filter(Boolean);

    return allUsers.filter((u) => {
      const searchableFields = [
        u.firstName,
        u.lastName,
        u.email,
        `${u.firstName} ${u.lastName}`,
        `${u.lastName} ${u.firstName}`
      ];

      const matchesSearch = tokens.length === 0 || tokens.every(token => 
        searchableFields.some(field => field?.toLowerCase().includes(token))
      );

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
              ? "ORGANISER ADMIN"
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
      { key: "CLUB_ADMIN", label: "Organiser Admins", color: "bg-blue-500", value: map.CLUB_ADMIN ?? 0 },
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
    closeDropdown();
    router.push(`/super-admin/users/${u.id}/edit`);
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
    if (action === "view-analytics") {
      openViewModal(u);
      return;
    }
    if (action === "force-logout") {
      if (!canManageUser(u)) {
        toast.error("You can't force logout this account");
        return;
      }
      setSelectedUser(u);
      setIsForceLogoutModalOpen(true);
      return;
    }
    if (action === "reset-password") {
      openResetPasswordModal(u);
      return;
    }
    if (action === "audit-logs") {
      toast.success("Opening audit logs");
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
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
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

      <Card className="border border-[#e7e7e7] shadow-sm overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
          <CardTitle className="text-xl font-bold">All Users</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="h-10 border-gray-200 text-gray-600 gap-2 rounded-lg px-4 text-[14px] font-bold">
              <Download className="w-4 h-4" /> Export
            </Button>
            <Button 
              onClick={() => router.push("/super-admin/users/create")}
              className="h-10 bg-[#10b981] hover:bg-[#0da673] border border-emerald-600/30 text-white gap-2 rounded-lg px-4 text-[14px] font-bold"
            >
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
                <tr className="bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-4">User Profile</th>
                  <th className="px-4 py-4">Role</th>
                  <th className="px-4 py-4 text-center">Handicap</th>
                  <th className="px-4 py-4">Contact & Location</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Joined Date</th>
                  <th className="px-4 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  skeletonRows.map((i) => (
                    <tr key={`sk-${i}`} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                          <div className="flex flex-col gap-1.5">
                            <Skeleton className="h-4 w-32 rounded-md" />
                            <Skeleton className="h-3 w-28 rounded-md" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-5.5 w-16 rounded-full" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-8 rounded-md mx-auto" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1.5">
                          <Skeleton className="h-3.5 w-24 rounded-md" />
                          <Skeleton className="h-3 w-16 rounded-md" />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-5 w-16 rounded-lg" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-3.5 w-20 rounded-md" />
                      </td>
                      <td className="px-4 py-4">
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
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3 min-w-[240px]">
                          <img
                            src={u.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.email || u.id)}`}
                            alt={u.email}
                            className="w-10 h-10 rounded-full border border-[#efefef] bg-gray-50 flex-shrink-0 object-cover"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-[14px] font-bold text-gray-900 truncate leading-tight">{fullName(u.firstName, u.lastName).toLowerCase()}</span>
                            <span className="text-[12px] text-gray-400 font-medium truncate normal-case">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-[14px] text-gray-900 font-bold">
                          {u.role === "PLAYER"
                            ? typeof u.handicap === "number"
                              ? u.handicap.toFixed(1)
                              : "—"
                            : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col min-w-0">
                          {u.phone ? (
                            <span className="text-[13px] text-gray-700 font-medium truncate">{u.phone}</span>
                          ) : (
                            <span className="text-[13px] text-gray-400 font-medium">—</span>
                          )}
                          {u.state ? (
                            <span className="text-[11px] text-gray-400 font-medium truncate leading-tight flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-gray-300 flex-shrink-0" />
                              <span>{u.state.toLowerCase()}</span>
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <StatusPill status={u.status} />
                      </td>
                      <td className="px-4 py-4 text-[13px] text-gray-500 font-medium whitespace-nowrap">
                        {formatJoinedDate(u.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-[#10b981]/10 hover:text-[#10b981] transition-colors"
                            title="View User"
                            onClick={() => openViewModal(u)}
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </button>
                          <button
                            className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title="Edit User"
                            onClick={() => openEditModal(u)}
                          >
                            <Edit2 className="w-4.5 h-4.5" />
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
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <EmptyState
                        icon={Users}
                        title="No users found"
                        description="Try adjusting your filters or search query to find what you're looking for."
                      />
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
        <Card className="border border-[#e7e7e7] shadow-sm lg:col-span-1">
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
        <Card className="border border-[#e7e7e7] shadow-sm lg:col-span-2">
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
                      src={u.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.email || u.id)}`}
                      alt={u.email}
                      className="h-10 w-10 rounded-xl border border-[#efefef] bg-gray-50 object-cover"
                    />
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-gray-900 truncate">{fullName(u.firstName, u.lastName)}</p>
                      <p className="text-[12px] text-gray-400 font-medium truncate capitalize">
                        {(u.role === "CLUB_ADMIN" ? "organiser admin" : u.role).replaceAll("_", " ")}
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
        className="w-60 bg-white rounded-xl shadow-xl border border-[#efefef] py-2"
      >
        {dropdownUser ? (
          <>
            <button
              disabled={!canManageUser(dropdownUser)}
              onClick={() => openStatusModal(dropdownUser)}
              className={cn(
                "w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 flex items-center gap-3",
                !canManageUser(dropdownUser) 
                  ? "text-gray-300 cursor-not-allowed" 
                  : dropdownUser.status === "SUSPENDED" 
                    ? "text-gray-700 hover:bg-emerald-50" 
                    : "text-gray-700 hover:bg-red-50",
              )}
            >
              {dropdownUser.status === "SUSPENDED" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Ban className="w-4 h-4 text-red-600" />
              )}
              {dropdownUser.status === "SUSPENDED" ? "Activate User" : "Suspend User"}
            </button>
            <div className="h-px bg-gray-50 my-1" />
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
              onClick={() => handleMoreAction("view-analytics", dropdownUser)}
              className={cn(
                "w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 flex items-center gap-3",
                !canManageUser(dropdownUser) ? "text-gray-300 cursor-not-allowed" : "text-gray-700",
              )}
            >
              <BarChart3 className="w-4 h-4 text-gray-400" />
              View Analytics
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
              disabled={!canManageUser(dropdownUser)}
              onClick={() => handleMoreAction("reset-password", dropdownUser)}
              className={cn(
                "w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 flex items-center gap-3",
                !canManageUser(dropdownUser) ? "text-gray-300 cursor-not-allowed" : "text-gray-700",
              )}
            >
              <KeyRound className="w-4 h-4 text-gray-400" />
              Reset Password
            </button>
            <button
              disabled={!canManageUser(dropdownUser)}
              onClick={() => handleMoreAction("audit-logs", dropdownUser)}
              className={cn(
                "w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 flex items-center gap-3",
                !canManageUser(dropdownUser) ? "text-gray-300 cursor-not-allowed" : "text-gray-700",
              )}
            >
              <Clock className="w-4 h-4 text-gray-400" />
              Audit Logs
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
                !canManageUser(dropdownUser) ? "text-gray-300 cursor-not-allowed" : "text-gray-700",
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

          <div className="rounded-xl border border-[#efefef] bg-gray-50/50 px-4 py-4 flex items-center gap-3">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedUser?.email || selectedUser?.id || "user")}`}
              alt={selectedUser?.email || "User"}
              className="h-11 w-11 rounded-xl border border-[#efefef] bg-white"
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
        title={selectedUser?.role === "CLUB_ADMIN" && selectedUser?.club ? "Cannot Delete Organizer Administrator" : "Delete User Permanently?"}
        footer={
          selectedUser?.role === "CLUB_ADMIN" && selectedUser?.club ? null : (
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
          )
        }
      >
        {selectedUser?.role === "CLUB_ADMIN" && selectedUser?.club ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center py-2">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-amber-50 text-amber-500">
                <AlertTriangle className="h-10 w-10" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Cannot Delete Administrator</h4>
              <p className="text-gray-500 max-w-sm">
                This user is currently the primary administrator for organizer <span className="font-bold text-gray-800">&quot;{selectedUser.club.name}&quot;</span>. Never leave an organizer blank without an administrator.
              </p>
              <p className="text-gray-500 max-w-sm mt-3 text-sm">
                Please edit and update the organizer account with a new administrator under <strong>Super Admin &gt; Organizers</strong> before deleting this user.
              </p>
            </div>
            <div className="flex justify-center pt-2">
              <Button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  router.push("/super-admin/organizers");
                }}
                className="bg-[#10b981] hover:bg-[#0da673] text-white rounded-lg font-bold px-8 h-11"
              >
                Go to Organizers
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center py-2">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-red-50 text-red-500">
                <Trash2 className="h-10 w-10" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Delete User Permanently?</h4>
              <p className="text-gray-500 max-w-sm">Deleting this user will permanently remove their profile, authentication records, and all associated platform data. This action cannot be undone.</p>
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
        )}
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
                <div className="rounded-xl border border-[#efefef] bg-gray-50/60 px-4 py-4 flex items-center justify-between gap-3">
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
        title=""
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-gray-400 font-medium italic">
              User UUID: {selectedUser?.id || "—"}
            </span>
            <Button
              variant="outline"
              onClick={() => setIsViewModalOpen(false)}
              className="rounded-lg font-bold border-gray-200"
            >
              Close Profile
            </Button>
          </div>
        }
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
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 pb-8 border-b border-gray-50">
            <div className="relative">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedUser?.email || selectedUser?.id || "user")}`}
                alt={selectedUser?.email || "User"}
                className="h-24 w-24 rounded-xl border-2 border-white shadow-md bg-gray-50 object-cover"
              />
              <div className={cn(
                "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white shadow-sm",
                selectedUser?.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-500"
              )} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h4 className="text-2xl font-bold text-gray-900 truncate">
                  {fullName(selectedUser?.firstName ?? null, selectedUser?.lastName ?? null)}
                </h4>
                {selectedUser && <StatusPill status={selectedUser.status} />}
              </div>
              
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                <div className="flex items-center gap-2 text-[13px] text-gray-500 font-medium">
                  <Globe className="w-4 h-4 text-gray-400" />
                  {selectedUser?.email || "No email provided"}
                </div>
                <div className="w-1 h-1 rounded-full bg-gray-300 hidden sm:block" />
                <div className="flex items-center gap-2 text-[13px] text-gray-500 font-medium">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span className="font-bold text-blue-600">
                    {selectedUser?.role === "CLUB_ADMIN" ? "ORGANISER ADMIN" : (selectedUser?.role?.replaceAll("_", " ") ?? "USER")}
                  </span>
                </div>
              </div>
              
              <p className="text-[12px] text-gray-400 mt-2 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Joined {formatJoinedDate(selectedUser?.createdAt || "")}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-xl border border-[#efefef] overflow-x-auto scrollbar-hide">
            {[
              { id: "overview", label: "Overview", icon: Users },
              { id: "activity", label: "History", icon: Clock },
              { id: "payments", label: "Payments", icon: CreditCard },
              { id: "tournaments", label: "Tournaments", icon: Trophy },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setViewTab(tab.id as any)}
                className={cn(
                  "flex-1 min-w-fit px-4 py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2.5 transition-all whitespace-nowrap",
                  viewTab === tab.id
                    ? "bg-white text-blue-600 shadow-sm border border-blue-50"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
                )}
              >
                <tab.icon className={cn("h-4 w-4 shrink-0", viewTab === tab.id ? "text-blue-500" : "text-gray-400")} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="min-h-[300px]">
            {viewLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-40 w-full rounded-xl" />
              </div>
            ) : viewTab === "overview" ? (
              <div className="space-y-6">
                {/* Player Stats Cards (If Player) */}
                {selectedUser?.role === "PLAYER" && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100/50 shadow-sm">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Handicap</p>
                      <div className="flex items-end justify-between">
                        <p className="text-2xl font-bold text-emerald-900">{selectedUser?.handicap?.toFixed(1) || "0.0"}</p>
                        <Shield className="w-5 h-5 text-emerald-300" />
                      </div>
                    </div>
                    <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50 shadow-sm">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Tournaments</p>
                      <div className="flex items-end justify-between">
                        <p className="text-2xl font-bold text-blue-900">{viewRegistrations.length}</p>
                        <Trophy className="w-5 h-5 text-blue-300" />
                      </div>
                    </div>
                    <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-100/50 shadow-sm">
                      <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-2">Wins</p>
                      <div className="flex items-end justify-between">
                        <p className="text-2xl font-bold text-purple-900">0</p>
                        <Trophy className="w-5 h-5 text-purple-300" />
                      </div>
                    </div>
                    <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100/50 shadow-sm">
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2">Rank</p>
                      <div className="flex items-end justify-between">
                        <p className="text-2xl font-bold text-amber-900">—</p>
                        <Users className="w-5 h-5 text-amber-300" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Info */}
                  <div className="bg-white rounded-xl border border-[#efefef] overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/30">
                      <h5 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        Personal Information
                      </h5>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Full Name</span>
                        <span className="text-[14px] text-gray-900 font-bold">{fullName(selectedUser?.firstName ?? null, selectedUser?.lastName ?? null)}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Email Address</span>
                        <span className="text-[14px] text-gray-900 font-bold break-all">{selectedUser?.email || "—"}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Phone Number</span>
                        <span className="text-[14px] text-gray-900 font-bold">{selectedUser?.phone || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Account Details */}
                  <div className="bg-white rounded-xl border border-[#efefef] overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/30">
                      <h5 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-400" />
                        Account Details
                      </h5>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                        <span className="text-[13px] text-gray-500 font-medium">System Role</span>
                        <RoleBadge role={selectedUser?.role || "PLAYER"} />
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                        <span className="text-[13px] text-gray-500 font-medium">Account Status</span>
                        <StatusPill status={selectedUser?.status || "ACTIVE"} />
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                        <span className="text-[13px] text-gray-500 font-medium">Organizer</span>
                        <span className="text-[13px] text-gray-900 font-bold">{selectedUser?.club?.name || "None"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : viewTab === "activity" ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search activity..."
                    className="pl-9 h-10 bg-gray-50/50 border-[#efefef] rounded-xl text-sm"
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
                      <div key={r.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-50 bg-white hover:border-blue-100 transition-colors">
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
                    className="pl-9 h-10 bg-gray-50/50 border-[#efefef] rounded-xl text-sm"
                    value={paymentSearch}
                    onChange={(e) => {
                      setPaymentSearch(e.target.value);
                      setPaymentPage(1);
                    }}
                  />
                </div>
                <div className="overflow-hidden rounded-xl border border-[#efefef]">
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
                    className="pl-9 h-10 bg-gray-50/50 border-[#efefef] rounded-xl text-sm"
                    value={tournamentSearch}
                    onChange={(e) => {
                      setTournamentSearch(e.target.value);
                      setTournamentPage(1);
                    }}
                  />
                </div>
                <div className="overflow-hidden rounded-xl border border-[#efefef]">
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

