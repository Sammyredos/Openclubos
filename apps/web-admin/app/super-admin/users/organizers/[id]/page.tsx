"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useRouter, useParams } from "next/navigation";
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
  FileText,
  FileSpreadsheet,
  ArrowLeft,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { broadcastAdminEvent, cn, formatCurrency, formatNumber } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { FloatingMenu } from "@/components/ui/floating-menu";
import { toast } from "sonner";
import { deleteMember, forceLogoutUser, getAdminUsers, updateMember, inviteManager, type AdminUser } from "@/lib/api/members";
import { getOrganizer } from "@/lib/api/organizers";
import { forgotPasswordRequest } from "@/lib/api/auth";
import { exportToCsv, exportToPdf } from "@/lib/export";
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

function RoleBadge({ role, managerScope }: { role: AdminUser["role"]; managerScope?: string | null }) {
  const meta = (() => {
    switch (role) {
      case "SUPER_ADMIN":
        return { label: "super admin", className: "bg-purple-50 text-purple-700 border-purple-100", dot: "bg-purple-500" };
      case "CLUB_ADMIN": {
        // Scope-based titles for invited managers
        if (managerScope === "FULL") return { label: "admin manager", className: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500" };
        if (managerScope === "TOURNAMENTS") return { label: "tournament manager", className: "bg-teal-50 text-teal-700 border-teal-100", dot: "bg-teal-500" };
        if (managerScope === "FINANCE") return { label: "finance manager", className: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500" };
        return { label: "organiser admin", className: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500" };
      }
      case "MARKER":
        return { label: "marker", className: "bg-indigo-50 text-indigo-700 border-indigo-100", dot: "bg-indigo-500" };
      default:
        return { label: "player", className: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-openclub-700" };
    }
  })();

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-medium uppercase whitespace-nowrap", meta.className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

function StatusPill({ status }: { status: AdminUser["status"] | "PENDING" }) {
  const meta = (() => {
    switch (status as any) {
      case "SUSPENDED":
        return { label: "Suspended", className: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500" };
      case "EXPIRED":
        return { label: "Expired", className: "bg-red-50 text-red-700 border-red-100", dot: "bg-red-500" };
      case "PENDING":
      case "INVITED":
        return { label: "Pending", className: "bg-orange-50 text-orange-700 border-orange-100", dot: "bg-orange-500" };
      default:
        return { label: "Active", className: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-openclub-700" };
    }
  })();
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase whitespace-nowrap", meta.className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}


export default function SuperAdminTeamPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clubName, setClubName] = useState<string | null>(null);

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
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
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
  const [isMakeAdminModalOpen, setIsMakeAdminModalOpen] = useState(false);
  const [isRemoveAdminModalOpen, setIsRemoveAdminModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isForceLogoutModalOpen, setIsForceLogoutModalOpen] = useState(false);
  const [isCreateWizardOpen, setIsCreateWizardOpen] = useState(false);
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);
  const [newManagerScope, setNewManagerScope] = useState<"FULL" | "TOURNAMENTS" | "FINANCE">("FULL");
  const [resetTab, setResetTab] = useState<"link" | "generate">("link");
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Invite Manager State
  const [isInviteManagerModalOpen, setIsInviteManagerModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteMiddleName, setInviteMiddleName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviteScope, setInviteScope] = useState<"FULL" | "TOURNAMENTS" | "FINANCE">("FULL");

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
  const debouncedActivitySearch = useDebounce(activitySearch, 300);
  const [paymentSearch, setPaymentSearch] = useState("");
  const debouncedPaymentSearch = useDebounce(paymentSearch, 300);
  const [tournamentSearch, setTournamentSearch] = useState("");
  const debouncedTournamentSearch = useDebounce(tournamentSearch, 300);
  const [activityPage, setActivityPage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const [tournamentPage, setTournamentPage] = useState(1);
  const modalItemsPerPage = 5;

  const [exportAnchorEl, setExportAnchorEl] = useState<HTMLElement | null>(null);
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
    return allUsers; // The backend now handles filtering
  }, [allUsers]);

  const total = stats?.totalUsers || 0;
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
  const pageSafe = Math.min(currentPage, totalPages);
  const paginatedUsers = allUsers;

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      if (!id || id === "undefined") {
        throw new Error("Missing club ID in URL.");
      }
      const data = await getAdminUsers({
        skip: (currentPage - 1) * itemsPerPage,
        take: itemsPerPage,
        search: debouncedSearchQuery || undefined,
        role: roleFilter !== "All Roles" ? roleFilter : "CLUB_ADMIN",
        status: statusFilter !== "All Status" ? statusFilter : undefined,
        handicap: handicapFilter !== "All Handicaps" ? handicapFilter : undefined,
        clubId: id,
      });
      setAllUsers(Array.isArray(data.items) ? (data.items as unknown as AdminUser[]) : []);
      const fetchedStats = data.stats || { totalUsers: data.total, activeUsers: data.total, suspendedUsers: 0, newThisMonth: 0, superAdmins: 0, roles: {} };
      setStats(fetchedStats as any);
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
  }, [debouncedSearchQuery, roleFilter, statusFilter, handicapFilter, currentPage, id]);

  useEffect(() => {
    if (id && id !== "undefined") {
      getOrganizer(id)
        .then((org) => setClubName(org.name))
        .catch(() => setClubName("Unknown Organizer"));
    }
  }, [id]);

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
      ["All Roles", "MANAGER", "PLAYER", "MARKER"].map((v: any) => ({
        value: v,
        label: v === "All Roles" ? "All Roles" :
          v === "CLUB_ADMIN" ? "Organiser Admin" :
            v.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
      })),
    [],
  );

  const statusSelectOptions = useMemo(
    () =>
      ["All Status", "ACTIVE", "SUSPENDED", "EXPIRED"].map((v: any) => ({
        value: v,
        label: v === "All Status" ? "All Status" : v[0] + v.slice(1).toLowerCase(),
      })),
    [],
  );

  const skeletonRows = Array.from({ length: itemsPerPage }, (_, idx) => idx);

  const rolesOverview = useMemo(() => {
    const map = stats?.roles ?? {};
    const rows = [
      { key: "ORGANISER", label: "Organiser Admin", color: "bg-blue-500", value: map.CLUB_ADMIN ?? 0 },
      { key: "ADMIN_MGR", label: "Admin Managers", color: "bg-blue-400", value: 0 },
      { key: "TOURNAMENT_MGR", label: "Tournament Managers", color: "bg-teal-500", value: 0 },
      { key: "FINANCE_MGR", label: "Finance Managers", color: "bg-amber-500", value: 0 },
    ];
    // Count scoped managers from allUsers
    for (const u of allUsers) {
      if (u.role === "CLUB_ADMIN" && (u as any).managerScope) {
        if ((u as any).managerScope === "FULL") rows[1].value++;
        if ((u as any).managerScope === "TOURNAMENTS") rows[2].value++;
        if ((u as any).managerScope === "FINANCE") rows[3].value++;
        // Subtract scoped managers from the generic organiser count
        rows[0].value = Math.max(0, rows[0].value - 1);
      }
    }
    const superAdmins = map.SUPER_ADMIN ?? 0;
    return { rows, superAdmins };
  }, [stats, allUsers]);

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

  const canManageUser = (u: AdminUser) => {
    if (u.role === "SUPER_ADMIN") return false;
    if (u.role === "CLUB_ADMIN" && !(u as any).managerScope) {
      return rolesOverview.rows[0].value > 1;
    }
    return true;
  };

  const handleChangeRole = async () => {
    if (!selectedUser?.id || !newManagerScope) return;
    setMutating(true);
    try {
      await updateMember(selectedUser.id, { managerScope: newManagerScope });
      toast.success("Manager role updated successfully");
      setIsChangeRoleModalOpen(false);
      reload();
    } catch (e: any) {
      toast.error(e.message || "Failed to change manager role");
    } finally {
      setMutating(false);
    }
  };

  const handleMakeAdmin = async () => {
    if (!selectedUser?.id) return;
    setMutating(true);
    try {
      await updateMember(selectedUser.id, { role: "CLUB_ADMIN", managerScope: "" });
      toast.success("User is now an Organizer Admin");
      setIsMakeAdminModalOpen(false);
      reload();
    } catch (e: any) {
      toast.error(e.message || "Failed to make user Organizer Admin");
    } finally {
      setMutating(false);
    }
  };

  const handleRemoveAdmin = async () => {
    if (!selectedUser?.id) return;
    setMutating(true);
    try {
      await updateMember(selectedUser.id, { role: "PLAYER" });
      toast.success("Organizer Admin role removed");
      setIsRemoveAdminModalOpen(false);
      reload();
    } catch (e: any) {
      toast.error(e.message || "Failed to remove Organizer Admin role");
    } finally {
      setMutating(false);
    }
  };

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
      const res = await getRegistrations({ userId: u.id, take: 100 });
      setViewRegistrations(res.items || []);
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || "Failed to load user activity");
    } finally {
      setViewLoading(false);
    }
  };

  const openEditModal = (u: AdminUser) => {
    closeDropdown();
    router.push(`/organizer-admin/users/${u.id}/edit`);
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
      exportToCsv([u], [
        { header: "Name", key: "firstName" },
        { header: "Email", key: "email" },
        { header: "Role", key: "role" },
        { header: "Status", key: "status" },
        { header: "Joined Date", key: "createdAt" },
      ], `${(u.email || "user").toString().replaceAll(" ", "-").toLowerCase()}-export.csv`);
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
      <div className="flex items-center">
        <button 
          onClick={() => router.push('/super-admin/users/organizers')} 
          className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-[#15803D] text-white hover:bg-[#15803D]/90 transition-colors text-[13px] font-medium shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
          Back to Organizers
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-normal text-red-700">
          {error}
        </div>
      )}



      <Card className="border-none shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
          <CardTitle className="text-zinc-700 text-xl font-normal whitespace-nowrap">User for {clubName}</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={(e: any) => setExportAnchorEl(e.currentTarget)}
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
                    filteredUsers,
                    [
                      { header: "First Name", key: "firstName" },
                      { header: "Last Name", key: "lastName" },
                      { header: "Email", key: "email" },
                      { header: "Phone", key: "phone" },
                      { header: "Role", key: "role" },
                      { header: "Status", key: "status" },
                      { header: "Handicap", key: "handicap" },
                      { header: "Joined Date", key: "createdAt" },
                    ],
                    "users-export.csv"
                  );
                }}
                className="w-full text-left px-4 py-2 text-[12px] font-normal text-gray-700 hover:bg-background flex items-center gap-3"
              >
                <FileSpreadsheet className="w-4 h-4 text-openclub-800" />
                Export CSV
              </button>
              <button
                onClick={() => {
                  setExportAnchorEl(null);
                  exportToPdf(
                    filteredUsers,
                    [
                      { header: "Name", key: "firstName" },
                      { header: "Email", key: "email" },
                      { header: "Role", key: "role" },
                      { header: "Status", key: "status" },
                    ],
                    "users-export.pdf",
                    "Users Export"
                  );
                }}
                className="w-full text-left px-4 py-2 text-[12px] font-normal text-gray-700 hover:bg-background flex items-center gap-3"
              >
                <FileText className="w-4 h-4 text-rose-600" />
                Export PDF
              </button>
            </FloatingMenu>
            <Button
              onClick={() => setIsInviteManagerModalOpen(true)}
              className="h-10 bg-[#15803D] hover:bg-[#166534] border border-openclub-800/30 text-white gap-2 rounded-lg px-4 text-[14px] font-normal"
            >
              <UserPlus className="w-4 h-4" /> Invite Manager
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Main Container */}
          <div className="px-6 pb-6">
            <div className="bg-background rounded-xl border border-[#e1efe5] overflow-hidden">
              <div className="p-5 border-b border-[#e1efe5]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by name or email..."
                className="pl-10 h-11 rounded-lg text-[14px] border-[#e1efe5] bg-white text-[#15803D] focus:bg-white placeholder:text-[#15803D]/60"
                value={searchQuery}
                onChange={(e: any) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <SearchableSelect
              value={roleFilter}
              onValueChange={(v: any) => {
                setRoleFilter(v);
                setCurrentPage(1);
              }}
              options={roleSelectOptions}
              className="min-w-[160px]"
              triggerClassName="h-11 bg-[#f5faf6] border-[#e1efe5] text-[#15803D] font-medium"
              placeholder="All Roles"
            />
            <SearchableSelect
              value={statusFilter}
              onValueChange={(v: any) => {
                setStatusFilter(v);
                setCurrentPage(1);
              }}
              options={statusSelectOptions}
              className="min-w-[160px]"
              triggerClassName="h-11 bg-[#f5faf6] border-[#e1efe5] text-[#15803D] font-medium"
              placeholder="All Status"
            />
            <SearchableSelect
              value={handicapFilter}
              onValueChange={(v: any) => {
                setHandicapFilter(v);
                setCurrentPage(1);
              }}
              options={["All Handicaps", "0 - 9.9", "10 - 19.9", "20 - 29.9", "30+"].map((v: any) => ({
                value: v,
                label: v,
              }))}
              className="min-w-[160px]"
              triggerClassName="h-11 bg-[#f5faf6] border-[#e1efe5] text-[#15803D] font-medium"
              placeholder="All Handicaps"
            />
          </div>
              </div>

          <div className="overflow-x-auto relative">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f5faf6] border-b border-[#e1efe5] text-[11px] font-semibold text-[#15803D] uppercase tracking-wider">
                  <th className="px-6 py-4">User Profile</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined Date</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e1efe5]">
                {loading ? (
                  skeletonRows.map((i) => (
                    <tr key={`sk-${i}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                          <div className="flex flex-col gap-1.5">
                            <Skeleton className="h-4 w-32 rounded-md" />
                            <Skeleton className="h-3 w-28 rounded-md" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <Skeleton className="h-5.5 w-16 rounded-full" />
                      </td>
                      <td className="px-6 py-5">
                        <Skeleton className="h-5 w-16 rounded-lg" />
                      </td>
                      <td className="px-6 py-5">
                        <Skeleton className="h-3.5 w-20 rounded-md" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <Skeleton className="h-7 w-16 rounded-md" />
                          <Skeleton className="h-7 w-16 rounded-md" />
                          <Skeleton className="h-7 w-8 rounded-md" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : paginatedUsers.length > 0 ? (
                  paginatedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="inline-flex justify-start items-center gap-3 min-w-[240px]">
                          <img
                            src={u.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.email || u.id)}`}
                            alt={u.email}
                            className="size-10 rounded-full object-cover bg-gray-100 border border-[#efefef] flex-shrink-0"
                          />
                          <div className="inline-flex flex-col justify-start items-start pr-4 min-w-0">
                            <div className="text-slate-900 text-sm font-medium leading-tight whitespace-normal break-words">
                              {fullName(u.firstName, u.lastName)}
                            </div>
                            <div className="text-gray-600 text-xs font-normal mt-0.5 whitespace-normal break-words">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <RoleBadge role={u.role} managerScope={(u as any).managerScope} />
                      </td>
                      <td className="px-6 py-5">
                        <StatusPill status={u.status} />
                      </td>
                      <td className="px-6 py-5 text-[13px] text-gray-600 font-normal whitespace-nowrap">
                        {formatJoinedDate(u.createdAt)}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <div className="relative">
                            <button
                              onClick={(e: any) => {
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
                              className="h-7 px-2 inline-flex items-center justify-center rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
                              title="More Actions"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
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
            <p className="text-[13px] text-gray-500 font-normal">
              Showing {total === 0 ? 0 : (pageSafe - 1) * itemsPerPage + 1} to {Math.min(pageSafe * itemsPerPage, total)} of {total} users
            </p>
            <Pagination currentPage={pageSafe} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
          </div>
          </div>
        </CardContent>
      </Card>



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
                "w-full text-left px-4 py-2 text-[12px] font-normal hover:bg-background flex items-center gap-3",
                !canManageUser(dropdownUser)
                  ? "text-gray-300 cursor-not-allowed"
                  : dropdownUser.status === "SUSPENDED"
                    ? "text-gray-700 hover:bg-emerald-50"
                    : "text-gray-700 hover:bg-red-50",
              )}
            >
              {dropdownUser.status === "SUSPENDED" ? (
                <CheckCircle2 className="w-4 h-4 text-openclub-800" />
              ) : (
                <Ban className="w-4 h-4 text-red-600" />
              )}
              {dropdownUser.status === "SUSPENDED" ? "Activate User" : "Suspend User"}
            </button>
            <div className="h-px bg-background my-1" />
            {dropdownUser.managerScope || dropdownUser.role === "CLUB_ADMIN" ? (
              <button
                disabled={!canManageUser(dropdownUser)}
                onClick={() => {
                  setSelectedUser(dropdownUser);
                  setNewManagerScope((dropdownUser.managerScope as any) || "FULL");
                  setIsChangeRoleModalOpen(true);
                  closeDropdown();
                }}
                className={cn(
                  "w-full text-left px-4 py-2 text-[12px] font-normal hover:bg-background flex items-center gap-3",
                  !canManageUser(dropdownUser) ? "text-gray-300 cursor-not-allowed" : "text-gray-700",
                )}
              >
                <Shield className="w-4 h-4 text-gray-400" />
                {dropdownUser.role === "CLUB_ADMIN" && !dropdownUser.managerScope ? "Switch to Manager" : "Change Manager Role"}
              </button>
            ) : null}
            {dropdownUser.role !== "SUPER_ADMIN" && (dropdownUser.role !== "CLUB_ADMIN" || dropdownUser.managerScope) ? (
              <button
                disabled={!canManageUser(dropdownUser)}
                onClick={() => {
                  setSelectedUser(dropdownUser);
                  setIsMakeAdminModalOpen(true);
                  closeDropdown();
                }}
                className={cn(
                  "w-full text-left px-4 py-2 text-[12px] font-normal hover:bg-background flex items-center gap-3",
                  !canManageUser(dropdownUser) ? "text-gray-300 cursor-not-allowed" : "text-gray-700",
                )}
              >
                <Crown className="w-4 h-4 text-openclub-800" />
                Make Organizer Admin
              </button>
            ) : null}
            {dropdownUser.role === "CLUB_ADMIN" && !dropdownUser.managerScope ? (
              <button
                onClick={() => {
                  if (rolesOverview.rows[0].value <= 1) {
                    toast.error("Cannot remove the only Organizer Admin.");
                    return;
                  }
                  setSelectedUser(dropdownUser);
                  setIsRemoveAdminModalOpen(true);
                  closeDropdown();
                }}
                className="w-full text-left px-4 py-2 text-[12px] font-normal hover:bg-red-50 flex items-center gap-3 text-gray-700"
              >
                <Ban className="w-4 h-4 text-red-500" />
                Remove Organizer Admin
              </button>
            ) : null}
            <div className="h-px bg-background my-1" />
            <button
              disabled={!canManageUser(dropdownUser)}
              onClick={() => handleMoreAction("delete", dropdownUser)}
              className={cn(
                "w-full text-left px-4 py-2 text-[12px] font-normal hover:bg-red-50 flex items-center gap-3",
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
            <Button variant="outline" onClick={() => setIsForceLogoutModalOpen(false)} className="rounded-lg font-normal">
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 border border-red-600/30 text-white rounded-lg font-normal px-8"
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
          <h4 className="text-[14px] font-normal text-gray-900 mb-2">Force logout this user?</h4>
          <p className="text-gray-500 max-w-sm mt-1">
            This will immediately log out <span className="font-normal text-gray-800">{selectedUser?.email ?? "this user"}</span>.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={statusAction === "activate" ? "Activate User?" : "Suspend User?"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)} className="rounded-lg font-normal">
              Cancel
            </Button>
            <Button
              className={cn(
                "rounded-lg font-normal px-8 text-white border",
                statusAction === "activate"
                  ? "bg-[#15803D] hover:bg-[#166534] border-openclub-800/30"
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
                statusAction === "activate" ? "bg-emerald-50 text-[#15803D]" : "bg-red-50 text-red-500",
              )}
            >
              {statusAction === "activate" ? (
                <CheckCircle2 className="h-10 w-10" />
              ) : (
                <AlertTriangle className="h-10 w-10" />
              )}
            </div>
            <h4 className="text-[14px] font-normal text-gray-900 mb-2">
              {statusAction === "activate" ? "Activate User?" : "Suspend User?"}
            </h4>
            <p className="text-gray-500 max-w-sm">
              {statusAction === "activate"
                ? "This user will regain access to the platform."
                : "This user will be unable to access the platform until reactivated."}
            </p>
          </div>

          <div className="rounded-xl border border-[#efefef] bg-background/50 px-4 py-4 flex items-center gap-3">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedUser?.email || selectedUser?.id || "user")}`}
              alt={selectedUser?.email || "User"}
              className="h-11 w-11 rounded-full border border-[#efefef] bg-white"
            />
            <div className="min-w-0">
              <p className="text-[14px] font-normal text-gray-900 truncate">
                {fullName(selectedUser?.firstName ?? null, selectedUser?.lastName ?? null)}
              </p>
              <p className="text-[12px] text-gray-400 font-normal truncate">{selectedUser?.email || "—"}</p>
            </div>
          </div>

          {statusAction === "suspend" && (
            <div className="space-y-2">
              <Label className="font-medium text-gray-700">Reason (optional)</Label>
              <Input
                value={suspendReason}
                onChange={(e: any) => setSuspendReason(e.target.value)}
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
        title={selectedUser?.role === "CLUB_ADMIN" && (selectedUser as any)?.club ? "Cannot Delete Organizer Administrator" : "Delete User Permanently?"}
        footer={
          selectedUser?.role === "CLUB_ADMIN" && (selectedUser as any)?.club ? null : (
            <>
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="rounded-lg font-normal">
                Cancel
              </Button>
              <Button
                disabled={deleteConfirmText.trim().toUpperCase() !== "DELETE" || mutating}
                className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 border border-red-600/30 text-white rounded-lg font-normal px-8"
                onClick={confirmDelete}
              >
                Delete User
              </Button>
            </>
          )
        }
      >
        {selectedUser?.role === "CLUB_ADMIN" && (selectedUser as any)?.club ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center py-2">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-amber-50 text-amber-500">
                <AlertTriangle className="h-10 w-10" />
              </div>
              <h4 className="text-[14px] font-normal text-gray-900 mb-2">Cannot Delete Administrator</h4>
              <p className="text-gray-500 max-w-sm">
                This user is currently the primary administrator for organizer <span className="font-normal text-gray-800">&quot;{(selectedUser as any).club.name}&quot;</span>. Never leave an organizer blank without an administrator.
              </p>
              <p className="text-gray-500 max-w-sm mt-3 text-[12px]">
                Please edit and update the organizer account with a new administrator under <strong>Super Admin &gt; Organizers</strong> before deleting this user.
              </p>
            </div>
            <div className="flex justify-center pt-2">
              <Button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  router.push("/super-admin/organizers");
                }}
                className="bg-[#15803D] hover:bg-[#166534] text-white rounded-lg font-normal px-8 h-11"
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
              <h4 className="text-[14px] font-normal text-gray-900 mb-2">Delete User Permanently?</h4>
              <p className="text-gray-500 max-w-sm">Deleting this user will permanently remove their profile, authentication records, and all associated platform data. This action cannot be undone.</p>
            </div>
            <div className="space-y-3">
              <Label className="font-medium text-gray-700">
                Type <span className="text-red-600">&quot;DELETE&quot;</span> to confirm:
              </Label>
              <Input
                value={deleteConfirmText}
                onChange={(e: any) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="rounded-xl border-[#e1efe5] focus:border-red-500"
              />
            </div>
          </div>
        )}
      </Modal>



      <Modal
        isOpen={isMakeAdminModalOpen}
        onClose={() => setIsMakeAdminModalOpen(false)}
        title="Make Organizer Admin?"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsMakeAdminModalOpen(false)} className="rounded-lg font-normal">
              Cancel
            </Button>
            <Button
              className="bg-[#15803D] hover:bg-[#166534] border border-openclub-800/30 text-white rounded-lg font-normal px-8"
              onClick={handleMakeAdmin}
              disabled={mutating}
            >
              Confirm
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-[#f5faf6] text-openclub-800">
            <Crown className="h-10 w-10" />
          </div>
          <h4 className="text-[14px] font-normal text-gray-900 mb-2">Promote to Organizer Admin?</h4>
          <p className="text-gray-500 max-w-sm mt-1">
            This will give <span className="font-normal text-gray-800">{selectedUser?.email ?? "this user"}</span> full access to manage the organization, its users, and tournaments.
            Assigning this role will transfer your Organizer Admin status to the new user, and you will automatically be changed to an Admin Manager with Full Access.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={isRemoveAdminModalOpen}
        onClose={() => setIsRemoveAdminModalOpen(false)}
        title="Remove Organizer Admin?"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsRemoveAdminModalOpen(false)} className="rounded-lg font-normal">
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 border border-red-600/30 text-white rounded-lg font-normal px-8"
              onClick={handleRemoveAdmin}
              disabled={mutating}
            >
              Confirm
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-red-50 text-red-500">
            <Ban className="h-10 w-10" />
          </div>
          <h4 className="text-[14px] font-normal text-gray-900 mb-2">Revoke Admin Privileges?</h4>
          <p className="text-gray-500 max-w-sm mt-1">
            This will remove Organizer Admin rights from <span className="font-normal text-gray-800">{selectedUser?.email ?? "this user"}</span>. They will still be a player.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={isChangeRoleModalOpen}
        onClose={() => setIsChangeRoleModalOpen(false)}
        title={selectedUser?.role === "CLUB_ADMIN" && !(selectedUser as any)?.managerScope ? "Switch to Manager" : "Change Manager Role"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsChangeRoleModalOpen(false)} className="rounded-lg font-normal">
              Cancel
            </Button>
            <Button
              disabled={mutating}
              className="bg-[#15803D] hover:bg-[#166534] text-white rounded-lg font-normal px-8"
              onClick={handleChangeRole}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="font-medium text-gray-700">Select Manager Role</Label>
            <select
              value={newManagerScope}
              onChange={(e: any) => setNewManagerScope(e.target.value as any)}
              className="w-full rounded-xl border border-[#e1efe5] bg-[#f5faf6] h-12 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#15803D]"
            >
              <option value="FULL">Admin Manager (Full Access)</option>
              <option value="TOURNAMENTS">Tournament Manager</option>
              <option value="FINANCE">Finance Manager</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        title="Reset Password"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsResetPasswordModalOpen(false)} className="rounded-lg font-normal">
              Cancel
            </Button>
            {resetTab === "link" ? (
              <Button
                onClick={sendResetLink}
                disabled={mutating}
                className="bg-[#15803D] hover:bg-[#166534] border border-openclub-800/30 text-white rounded-lg font-normal px-8"
              >
                Send Reset Link
              </Button>
            ) : (
              <Button
                onClick={generateAndSetPassword}
                disabled={mutating}
                className="bg-[#15803D] hover:bg-[#166534] border border-openclub-800/30 text-white rounded-lg font-normal px-8"
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
                "h-10 px-4 rounded-xl text-[13px] font-normal border transition-colors",
                resetTab === "link"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-white text-gray-500 border-[#e1efe5] hover:bg-background",
              )}
            >
              Send Reset Link
            </button>
            <button
              type="button"
              onClick={() => setResetTab("generate")}
              className={cn(
                "h-10 px-4 rounded-xl text-[13px] font-normal border transition-colors",
                resetTab === "generate"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-white text-gray-500 border-[#e1efe5] hover:bg-background",
              )}
            >
              Generate Password
            </button>
          </div>

          {resetTab === "link" ? (
            <div className="flex flex-col items-center text-center py-2">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-emerald-50 text-[#15803D]">
                <Mail className="h-10 w-10" />
              </div>
              <h4 className="text-[14px] font-normal text-gray-900 mb-2">Send password reset link to</h4>
              <p className="text-gray-500 max-w-sm">
                <span className="font-normal text-gray-800">{selectedUser?.email || "—"}</span>
              </p>
              <p className="text-gray-500 max-w-sm mt-2">
                User will receive an email with instructions to reset their password.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col items-center text-center py-2">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-emerald-50 text-[#15803D]">
                  <KeyRound className="h-10 w-10" />
                </div>
                <h4 className="text-[14px] font-normal text-gray-900 mb-2">Generate a new password</h4>
                <p className="text-gray-500 max-w-sm">
                  Generates a secure password and updates it for <span className="font-normal text-gray-800">{selectedUser?.email || "—"}</span>.
                </p>
              </div>

              {generatedPassword && (
                <div className="rounded-xl border border-[#efefef] bg-background/60 px-4 py-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12px] font-normal text-gray-400 capitalize tracking-wider">Generated Password</p>
                    <p className="text-[15px] font-normal text-gray-900 break-all">{generatedPassword}</p>
                  </div>
                  <button
                    type="button"
                    onClick={copyGeneratedPassword}
                    className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-[#e1efe5] bg-white text-gray-500 hover:bg-background transition-colors"
                    title="Copy password"
                  >
                    {copiedPassword ? <Check className="h-5 w-5 text-[#15803D]" /> : <Clipboard className="h-5 w-5" />}
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
            <span className="text-[11px] text-gray-400 font-normal italic">
              User UUID: {selectedUser?.id || "—"}
            </span>
            <Button
              variant="outline"
              onClick={() => setIsViewModalOpen(false)}
              className="rounded-lg font-normal border-[#e1efe5]"
            >
              Close Profile
            </Button>
          </div>
        }
      >
        {(() => {
          const filteredActivity = viewRegistrations.filter((r) =>
            r.tournament.name.toLowerCase().includes(debouncedActivitySearch.toLowerCase()),
          );
          const paginatedActivity = filteredActivity.slice(
            (activityPage - 1) * modalItemsPerPage,
            activityPage * modalItemsPerPage,
          );
          const totalActivityPages = Math.ceil(filteredActivity.length / modalItemsPerPage);

          const filteredPayments = viewRegistrations.filter((r) =>
            r.tournament.name.toLowerCase().includes(debouncedPaymentSearch.toLowerCase()) ||
            (r.paymentReference || "").toLowerCase().includes(debouncedPaymentSearch.toLowerCase())
          );
          const paginatedPayments = filteredPayments.slice(
            (paymentPage - 1) * modalItemsPerPage,
            paymentPage * modalItemsPerPage,
          );
          const totalPaymentPages = Math.ceil(filteredPayments.length / modalItemsPerPage);

          const filteredTournaments = viewRegistrations.filter((r) =>
            r.tournament.name.toLowerCase().includes(debouncedTournamentSearch.toLowerCase()),
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
                    className="h-24 w-24 rounded-full border-2 border-white shadow-md bg-background object-cover"
                  />
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white shadow-sm",
                    selectedUser?.status === "ACTIVE" ? "bg-openclub-700" : "bg-red-500"
                  )} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h4 className="text-[16px] font-normal text-gray-900 truncate">
                      {fullName(selectedUser?.firstName ?? null, selectedUser?.lastName ?? null)}
                    </h4>
                    {selectedUser && <StatusPill status={selectedUser.status} />}
                  </div>

                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                    <div className="flex items-center gap-2 text-[13px] text-gray-500 font-normal">
                      <Globe className="w-4 h-4 text-gray-400" />
                      {selectedUser?.email || "No email provided"}
                    </div>
                    <div className="w-1 h-1 rounded-full bg-gray-300 hidden sm:block" />
                    <div className="flex items-center gap-2 text-[13px] text-gray-500 font-normal">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className="font-normal text-blue-600">
                        {selectedUser?.role === "CLUB_ADMIN" ? "ORGANISER ADMIN" : (selectedUser?.role?.replaceAll("_", " ") ?? "USER")}
                      </span>
                    </div>
                  </div>

                  <p className="text-[12px] text-gray-400 mt-2 font-normal flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Joined {formatJoinedDate(selectedUser?.createdAt || "")}
                  </p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 p-1.5 bg-background rounded-xl border border-[#efefef] overflow-x-auto scrollbar-hide">
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
                      "flex-1 min-w-fit px-4 py-2.5 rounded-xl text-[13px] font-normal flex items-center justify-center gap-2.5 transition-all whitespace-nowrap",
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
                          <p className="text-[10px] font-normal text-openclub-800 capitalize tracking-widest mb-2">Handicap</p>
                          <div className="flex items-end justify-between">
                            <p className="text-[16px] font-normal text-emerald-900">{selectedUser?.handicap?.toFixed(1) || "0.0"}</p>
                            <Shield className="w-5 h-5 text-emerald-300" />
                          </div>
                        </div>
                        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50 shadow-sm">
                          <p className="text-[10px] font-normal text-blue-600 uppercase tracking-widest mb-2">Tournaments</p>
                          <div className="flex items-end justify-between">
                            <p className="text-[16px] font-normal text-blue-900">{viewRegistrations.length}</p>
                            <Trophy className="w-5 h-5 text-blue-300" />
                          </div>
                        </div>
                        <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-100/50 shadow-sm">
                          <p className="text-[10px] font-normal text-purple-600 uppercase tracking-widest mb-2">Wins</p>
                          <div className="flex items-end justify-between">
                            <p className="text-[16px] font-normal text-purple-900">0</p>
                            <Trophy className="w-5 h-5 text-purple-300" />
                          </div>
                        </div>
                        <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100/50 shadow-sm">
                          <p className="text-[10px] font-normal text-amber-600 uppercase tracking-widest mb-2">Rank</p>
                          <div className="flex items-end justify-between">
                            <p className="text-[16px] font-normal text-amber-900">—</p>
                            <Users className="w-5 h-5 text-amber-300" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Personal Info */}
                      <div className="bg-white rounded-xl border border-[#efefef] overflow-hidden shadow-sm">
                        <div className="px-5 py-4 border-b border-gray-50 bg-background/30">
                          <h5 className="text-[12px] font-normal text-gray-900 flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            Personal Information
                          </h5>
                        </div>
                        <div className="p-5 space-y-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] text-gray-400 font-normal uppercase tracking-wider">Full Name</span>
                            <span className="text-[14px] text-gray-900 font-normal">{fullName(selectedUser?.firstName ?? null, selectedUser?.lastName ?? null)}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] text-gray-400 font-normal uppercase tracking-wider">Email Address</span>
                            <span className="text-[14px] text-gray-900 font-normal break-all">{selectedUser?.email || "—"}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] text-gray-400 font-normal uppercase tracking-wider">Phone Number</span>
                            <span className="text-[14px] text-gray-900 font-normal">{selectedUser?.phone || "—"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Account Details */}
                      <div className="bg-white rounded-xl border border-[#efefef] overflow-hidden shadow-sm">
                        <div className="px-5 py-4 border-b border-gray-50 bg-background/30">
                          <h5 className="text-[12px] font-normal text-gray-900 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-gray-400" />
                            Account Details
                          </h5>
                        </div>
                        <div className="p-5 space-y-4">
                          <div className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                            <span className="text-[13px] text-gray-500 font-normal">System Role</span>
                            <RoleBadge role={selectedUser?.role || "PLAYER"} managerScope={(selectedUser as any)?.managerScope} />
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                            <span className="text-[13px] text-gray-500 font-normal">Account Status</span>
                            <StatusPill status={selectedUser?.status || "ACTIVE"} />
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                            <span className="text-[13px] text-gray-500 font-normal">Organizer</span>
                            <span className="text-[13px] text-gray-900 font-normal">{selectedUser?.club?.name || "None"}</span>
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
                        className="pl-9 h-10 bg-background/50 border-[#e1efe5] rounded-xl text-[12px]"
                        value={activitySearch}
                        onChange={(e: any) => {
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
                                <p className="text-[14px] font-normal text-gray-900">Registered for {r.tournament.name}</p>
                                <p className="text-[12px] text-gray-400 font-normal">{formatJoinedDate(r.registeredAt)}</p>
                              </div>
                            </div>
                            <StatusPill status={r.status === "APPROVED" ? "ACTIVE" : r.status === "REJECTED" ? "SUSPENDED" : "ACTIVE"} />
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-[12px] text-gray-400 font-normal">No activity found</p>
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
                        className="pl-9 h-10 bg-background/50 border-[#e1efe5] rounded-xl text-[12px]"
                        value={paymentSearch}
                        onChange={(e: any) => {
                          setPaymentSearch(e.target.value);
                          setPaymentPage(1);
                        }}
                      />
                    </div>
                    <div className="overflow-hidden rounded-xl border border-[#efefef]">
                      <table className="w-full text-left">
                        <thead className="bg-background text-[11px] font-normal text-[#15803D] uppercase tracking-wider">
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
                              <tr key={r.id} className="hover:bg-background/50 transition-colors">
                                <td className="px-5 py-4 font-normal text-gray-900">{r.tournament.name}</td>
                                <td className="px-5 py-4 font-normal text-gray-700">{r.tournament.entryFee && r.tournament.entryFee > 0 ? formatCurrency(r.tournament.entryFee) : "Free"}</td>
                                <td className="px-5 py-4 font-normal text-gray-500">{r.paymentReference || "—"}</td>
                                <td className="px-5 py-4">
                                  <span className={cn(
                                    "inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-normal",
                                    r.paymentStatus === "PAID" ? "bg-emerald-50 text-openclub-800" : "bg-amber-50 text-amber-600"
                                  )}>
                                    {r.paymentStatus}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400 font-normal">No payments found</td></tr>
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
                        className="pl-9 h-10 bg-background/50 border-[#e1efe5] rounded-xl text-[12px]"
                        value={tournamentSearch}
                        onChange={(e: any) => {
                          setTournamentSearch(e.target.value);
                          setTournamentPage(1);
                        }}
                      />
                    </div>
                    <div className="overflow-hidden rounded-xl border border-[#efefef]">
                      <table className="w-full text-left">
                        <thead className="bg-background text-[11px] font-normal text-[#15803D] uppercase tracking-wider">
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
                              <tr key={r.id} className="hover:bg-background/50 transition-colors">
                                <td className="px-5 py-4 font-normal text-gray-900">{r.tournament.name}</td>
                                <td className="px-5 py-4 text-gray-500">{formatJoinedDate(r.tournament.startDate)}</td>
                                <td className="px-5 py-4">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-normal bg-blue-50 text-blue-600">
                                    {r.status}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-right font-normal text-gray-700">{r.tournament.entryFee && r.tournament.entryFee > 0 ? formatCurrency(r.tournament.entryFee) : "Free"}</td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400 font-normal">No tournaments found</td></tr>
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
                    <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center mb-4">
                      <Clock className="h-8 w-8 text-gray-300" />
                    </div>
                    <h5 className="text-[14px] font-normal text-gray-900">Coming Soon</h5>
                    <p className="text-[12px] text-gray-500 max-w-xs mt-1">
                      This section is currently under development and will be available in a future update.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Invite Manager Modal */}
      <Modal
        isOpen={isInviteManagerModalOpen}
        onClose={() => setIsInviteManagerModalOpen(false)}
        title="Invite Manager"
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsInviteManagerModalOpen(false)}>Cancel</Button>
            <Button
              className="bg-[#15803D] hover:bg-[#15803D]/90 text-white"
              disabled={!inviteEmail || !inviteFirstName || !inviteMiddleName || !inviteLastName || mutating}
              onClick={async () => {
                setMutating(true);
                try {
                  // Call the real invite API
                  await inviteManager({
                    email: inviteEmail,
                    firstName: inviteFirstName,
                    middleName: inviteMiddleName,
                    lastName: inviteLastName,
                    scope: inviteScope,
                  });
                  toast.success("Invitation sent to " + inviteEmail);
                  // Refresh the team list
                  setCurrentPage(1);
                  await reload();
                  setIsInviteManagerModalOpen(false);
                  setInviteEmail("");
                  setInviteFirstName("");
                  setInviteMiddleName("");
                  setInviteLastName("");
                } catch (e: any) {
                  toast.error(e.message || "Failed to invite manager");
                } finally {
                  setMutating(false);
                }
              }}
            >
              {mutating ? "Sending Invite..." : "Send Invite"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Personal Information */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Email Address <span className="text-red-500">*</span></Label>
              <Input
                type="email"
                placeholder="manager@example.com"
                value={inviteEmail}
                onChange={(e: any) => setInviteEmail(e.target.value)}
                className="mt-1 h-11 border-gray-200"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">First Name <span className="text-red-500">*</span></Label>
              <Input
                placeholder="John"
                value={inviteFirstName}
                onChange={(e: any) => setInviteFirstName(e.target.value)}
                className="mt-1 h-11 border-gray-200"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Middle Name <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Middle name"
                value={inviteMiddleName}
                onChange={(e: any) => setInviteMiddleName(e.target.value)}
                className="mt-1 h-11 border-gray-200"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Surname (Last Name) <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Doe"
                value={inviteLastName}
                onChange={(e: any) => setInviteLastName(e.target.value)}
                className="mt-1 h-11 border-gray-200"
              />
            </div>
          </div>

          {/* Right Column: Access Scope */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">Access Scope</Label>
            <div className="space-y-3">
              {/* Full Access Card */}
              <div
                onClick={() => setInviteScope("FULL")}
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${inviteScope === "FULL" ? "border-[#15803D] bg-[#f5faf6]" : "border-[#e1efe5] bg-white hover:bg-[#f5faf6]"}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-2 rounded-lg ${inviteScope === "FULL" ? "bg-[#15803D] text-white" : "bg-[#f5faf6] text-zinc-500 border border-[#e1efe5]"}`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-medium ${inviteScope === "FULL" ? "text-zinc-900" : "text-zinc-700"}`}>Full Access</h4>
                    <p className="text-[12px] text-zinc-500 mt-1 leading-relaxed pr-6">
                      Complete control over all operations including team, tournaments, financials, and settings.
                    </p>
                  </div>
                </div>
                {inviteScope === "FULL" && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle2 className="w-5 h-5 text-[#15803D]" />
                  </div>
                )}
              </div>

              {/* Tournaments Card */}
              <div
                onClick={() => setInviteScope("TOURNAMENTS")}
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${inviteScope === "TOURNAMENTS" ? "border-[#15803D] bg-[#f5faf6]" : "border-[#e1efe5] bg-white hover:bg-[#f5faf6]"}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-2 rounded-lg ${inviteScope === "TOURNAMENTS" ? "bg-[#15803D] text-white" : "bg-[#f5faf6] text-zinc-500 border border-[#e1efe5]"}`}>
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-medium ${inviteScope === "TOURNAMENTS" ? "text-zinc-900" : "text-zinc-700"}`}>Tournaments Only</h4>
                    <p className="text-[12px] text-zinc-500 mt-1 leading-relaxed pr-6">
                      Manage events, leaderboards, and scores. Cannot view financials or team details.
                    </p>
                  </div>
                </div>
                {inviteScope === "TOURNAMENTS" && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle2 className="w-5 h-5 text-[#15803D]" />
                  </div>
                )}
              </div>

              {/* Finance Card */}
              <div
                onClick={() => setInviteScope("FINANCE")}
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${inviteScope === "FINANCE" ? "border-[#15803D] bg-[#f5faf6]" : "border-[#e1efe5] bg-white hover:bg-[#f5faf6]"}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-2 rounded-lg ${inviteScope === "FINANCE" ? "bg-[#15803D] text-white" : "bg-[#f5faf6] text-zinc-500 border border-[#e1efe5]"}`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-medium ${inviteScope === "FINANCE" ? "text-zinc-900" : "text-zinc-700"}`}>Finance Only</h4>
                    <p className="text-[12px] text-zinc-500 mt-1 leading-relaxed pr-6">
                      Manage payments, subscriptions, and financial reports. No access to events or team management.
                    </p>
                  </div>
                </div>
                {inviteScope === "FINANCE" && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle2 className="w-5 h-5 text-[#15803D]" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
