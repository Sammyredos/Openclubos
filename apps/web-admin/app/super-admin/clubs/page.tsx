"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  Search,
  Plus,
  Download,
  Filter,
  Eye,
  Edit2,
  MoreHorizontal,
  Clock,
  ShieldAlert,
  Target,
  AlertTriangle,
  BarChart3,
  KeyRound,
  Ban,
  CheckCircle2,
  Trash2,
  Mail,
  Clipboard,
  Check,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { broadcastAdminEvent, cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { FloatingMenu } from "@/components/ui/floating-menu";
import Link from "next/link";
import { toast } from "sonner";
import { activateClub, deleteClub, getClubs, suspendClub, updateClub } from "@/lib/api/clubs";
import { forgotPasswordRequest, getAuthToken } from "@/lib/api/auth";
import { updateMember } from "@/lib/api/members";

type ApiClub = {
  id: string;
  name: string;
  address: string | null;
  status?: "ACTIVE" | "SUSPENDED" | "EXPIRED";
  plan?: "PRO" | "BASIC";
  createdAt: string;
  _count?: { users: number; tournaments: number; courses: number };
  users?: Array<{ id: string; email: string; firstName: string | null; lastName: string | null }>;
};

type ClubRow = {
  id: string;
  name: string;
  location: string;
  members: number;
  admin: { id: string | null; name: string; email: string; avatar: string };
  plan: string;
  status: "Active" | "Suspended" | "Expired";
  joinedDate: string;
  createdAtISO: string;
  logo: string;
};

function formatJoinedDate(iso: string) {
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return fmt.format(d);
}

function fullName(firstName: string | null, lastName: string | null) {
  const name = `${firstName || ""} ${lastName || ""}`.trim();
  return name || "—";
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

function toClubRow(c: ApiClub): ClubRow {
  const adminUser = c.users?.[0] || null;
  const adminName = adminUser ? fullName(adminUser.firstName, adminUser.lastName) : "—";
  const adminEmail = adminUser?.email || "—";
  const plan = c.plan === "PRO" ? "Pro" : c.plan === "BASIC" ? "Basic" : "—";
  const status =
    c.status === "SUSPENDED" ? "Suspended" : c.status === "EXPIRED" ? "Expired" : "Active";
  return {
    id: c.id,
    name: c.name,
    location: c.address || "—",
    members: c._count?.users ?? 0,
    admin: {
      id: adminUser?.id ?? null,
      name: adminName,
      email: adminEmail,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(adminEmail || c.id)}`,
    },
    plan,
    status,
    joinedDate: formatJoinedDate(c.createdAt),
    createdAtISO: c.createdAt,
    logo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.name)}`,
  };
}

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  if (e && typeof e === "object" && "message" in e && typeof (e as { message?: unknown }).message === "string") {
    return (e as { message: string }).message;
  }
  return null;
}

export default function ClubsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clubsData, setClubsData] = useState<ClubRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [planFilter, setPlanFilter] = useState("All Plans");
  const [locationFilter, setLocationFilter] = useState("All Locations");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<ClubRow | null>(null);
  const [editPlan, setEditPlan] = useState("Pro");
  const [editStatus, setEditStatus] = useState<ClubRow["status"]>("Active");
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editAdminName, setEditAdminName] = useState("");
  const [editAdminEmail, setEditAdminEmail] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetTab, setResetTab] = useState<"link" | "generate">("link");
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownAnchorEl, setDropdownAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [dropdownClub, setDropdownClub] = useState<ClubRow | null>(null);
  const [mutating, setMutating] = useState(false);
  const [statusAction, setStatusAction] = useState<"suspend" | "activate">("suspend");

  const closeTimeoutRef = useRef<number | null>(null);
  const closeDropdown = () => {
    setActiveDropdown(null);
    if (closeTimeoutRef.current != null) window.clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = window.setTimeout(() => {
      setDropdownAnchorEl(null);
      setDropdownClub(null);
      closeTimeoutRef.current = null;
    }, 160);
  };


  async function reloadClubs() {
    setLoading(true);
    setError(null);
    try {
      const data = (await getClubs()) as ApiClub[];
      const rows = Array.isArray(data) ? data.map(toClubRow) : [];
      setClubsData(rows);
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Failed to fetch clubs");
      setClubsData([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const token = getAuthToken();
        if (!token) {
          setError("Not authenticated. Please login again.");
          setClubsData([]);
          setLoading(false);
          return;
        }
        setLoading(true);
        setError(null);
        const data = (await getClubs()) as ApiClub[];
        if (cancelled) return;
        const rows = Array.isArray(data) ? data.map(toClubRow) : [];
        setClubsData(rows);
      } catch (e: unknown) {
        if (cancelled) return;
        setError(getErrorMessage(e) || "Failed to fetch clubs");
        setClubsData([]);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredClubs = clubsData.filter((club) => {
    const matchesSearch = 
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      club.admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.admin.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "All Status" || club.status === statusFilter;
    const matchesPlan = planFilter === "All Plans" || club.plan === planFilter;
    const matchesLocation = locationFilter === "All Locations" || club.location.includes(locationFilter);

    return matchesSearch && matchesStatus && matchesPlan && matchesLocation;
  });

  // Paginated data
  const totalPages = Math.max(1, Math.ceil(filteredClubs.length / itemsPerPage));
  const paginatedClubs = filteredClubs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const uniqueLocations = Array.from(new Set(clubsData.map((c) => c.location))).filter((v) => v !== "—");

  const totalClubs = clubsData.length;
  const activeClubs = clubsData.filter((c) => c.status === "Active").length;
  const suspendedClubs = clubsData.filter((c) => c.status === "Suspended").length;
  const expiredClubs = clubsData.filter((c) => c.status === "Expired").length;
  const now = new Date();
  const newThisMonth = clubsData.filter((c) => {
    const d = new Date(c.createdAtISO);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  // Handlers
  const handleEdit = (club: ClubRow) => {
    setSelectedClub(club);
    setEditPlan(club.plan || "Pro");
    setEditStatus(club.status || "Active");
    setEditName(club.name || "");
    setEditLocation(club.location || "");
    setEditAdminName(club.admin?.name || "");
    setEditAdminEmail(club.admin?.email || "");
    setIsEditModalOpen(true);
    closeDropdown();
  };

  const handleDelete = (club: ClubRow) => {
    setSelectedClub(club);
    setDeleteConfirmText("");
    setIsDeleteModalOpen(true);
    closeDropdown();
  };

  const handleStatusChange = (club: ClubRow) => {
    setSelectedClub(club);
    setStatusAction(club.status === "Suspended" ? "activate" : "suspend");
    setIsStatusModalOpen(true);
    closeDropdown();
  };

  const openResetPasswordModal = (club: ClubRow) => {
    setSelectedClub(club);
    setResetTab("link");
    setGeneratedPassword(null);
    setCopiedPassword(false);
    setIsResetPasswordModalOpen(true);
    closeDropdown();
  };

  const sendResetLink = async () => {
    const email = selectedClub?.admin?.email;
    if (!email || email === "—") {
      toast.error("No admin email found for this club");
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
    const adminId = selectedClub?.admin?.id;
    if (!adminId) {
      toast.error("No admin user found for this club");
      return;
    }
    const pw = generatePassword(12);
    setMutating(true);
    try {
      await updateMember(adminId, { password: pw });
      setGeneratedPassword(pw);
      setCopiedPassword(false);
      toast.success("Password generated");
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

  const handleMoreAction = (action: string, club: ClubRow) => {
    closeDropdown();
    if (action === "view-analytics") {
      router.push(`/super-admin/clubs/${club.id}`);
      return;
    }
    if (action === "reset-password") {
      openResetPasswordModal(club);
      return;
    }
    if (action === "audit-logs") {
      toast.success("Opening audit logs");
      return;
    }
    if (action === "export") {
      const blob = new Blob([JSON.stringify(club, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(club?.name || "club").toString().replaceAll(" ", "-").toLowerCase()}-export.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Club data exported");
    }
  };

  const confirmDelete = () => {
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE" || !selectedClub?.id) return;
    setMutating(true);
    deleteClub(selectedClub.id)
      .then(() => {
        toast.success(`${selectedClub?.name} has been deleted`);
        setIsDeleteModalOpen(false);
        broadcastAdminEvent("clubs-changed");
        return reloadClubs();
      })
      .catch((e: unknown) => toast.error(getErrorMessage(e) || "Failed to delete club"))
      .finally(() => setMutating(false));
  };

  const confirmStatusChange = () => {
    if (!selectedClub?.id) return;
    setMutating(true);
    const op = statusAction === "activate" ? activateClub : suspendClub;
    op(selectedClub.id)
      .then(() => {
        toast.success(
          statusAction === "activate"
            ? `${selectedClub?.name} has been activated`
            : `${selectedClub?.name} has been suspended`,
        );
        setIsStatusModalOpen(false);
        broadcastAdminEvent("clubs-changed");
        return reloadClubs();
      })
      .catch((e: unknown) =>
        toast.error(
          getErrorMessage(e) || (statusAction === "activate" ? "Failed to activate club" : "Failed to suspend club"),
        ),
      )
      .finally(() => setMutating(false));
  };

  const saveEdit = () => {
    if (!selectedClub?.id) return;
    const plan = editPlan === "Pro" ? "PRO" : editPlan === "Basic" ? "BASIC" : undefined;
    const status = editStatus.toUpperCase() as "ACTIVE" | "SUSPENDED" | "EXPIRED";
    setMutating(true);
    updateClub(selectedClub.id, {
      name: editName.trim() || undefined,
      address: editLocation.trim() || undefined,
      plan,
      status,
      adminName: editAdminName.trim() || undefined,
      adminEmail: editAdminEmail.trim() || undefined,
    })
      .then(() => {
        toast.success("Club updated");
        setIsEditModalOpen(false);
        broadcastAdminEvent("clubs-changed");
        return reloadClubs();
      })
      .catch((e: unknown) => toast.error(getErrorMessage(e) || "Failed to update club"))
      .finally(() => setMutating(false));
  };

  const skeletonRows = Array.from({ length: itemsPerPage }, (_, idx) => idx);

  return (
    <div className="space-y-8 w-full max-w-full px-2 pb-10 font-sans">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard
          title="Total Clubs"
          value={String(totalClubs)}
          icon={Building2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          loading={loading}
        />
        <StatCard
          title="Active Clubs"
          value={String(activeClubs)}
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          loading={loading}
        />
        <StatCard
          title="Suspended Clubs"
          value={String(suspendedClubs)}
          icon={ShieldAlert}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          loading={loading}
        />
        <StatCard
          title="Expired Clubs"
          value={String(expiredClubs)}
          icon={Clock}
          iconBg="bg-red-50"
          iconColor="text-red-600"
          loading={loading}
        />
        <StatCard
          title="New This Month"
          value={String(newThisMonth)}
          icon={Target}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          loading={loading}
        />
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
          <CardTitle className="text-xl font-bold">All Clubs</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="h-10 border-gray-200 text-gray-600 gap-2 rounded-lg px-4 text-[14px] font-bold">
              <Download className="w-4 h-4" /> Export
            </Button>
            <Button className="h-10 bg-[#10b981] hover:bg-[#0da673] border border-emerald-600/30 text-white gap-2 rounded-lg px-4 text-[14px] font-bold">
              <Plus className="w-4 h-4" /> Add Club
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Filters */}
          <div className="px-6 pb-6 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search club name, location or admin..." 
                className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white rounded-lg text-[14px]"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <SearchableSelect
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setCurrentPage(1);
              }}
              options={["All Status", "Active", "Suspended", "Expired"].map((v) => ({ value: v, label: v }))}
              className="min-w-[160px]"
              triggerClassName="h-11 bg-white font-medium"
              placeholder="All Status"
            />
            <SearchableSelect
              value={planFilter}
              onValueChange={(v) => {
                setPlanFilter(v);
                setCurrentPage(1);
              }}
              options={["All Plans", "Pro", "Basic"].map((v) => ({ value: v, label: v }))}
              className="min-w-[160px]"
              triggerClassName="h-11 bg-white font-medium"
              placeholder="All Plans"
            />
            <SearchableSelect
              value={locationFilter}
              onValueChange={(v) => {
                setLocationFilter(v);
                setCurrentPage(1);
              }}
              options={["All Locations", ...uniqueLocations].map((v) => ({ value: v, label: v }))}
              className="min-w-[180px]"
              triggerClassName="h-11 bg-white font-medium"
              placeholder="All Locations"
            />
            <Button variant="outline" className="h-11 border-gray-100 text-gray-500 gap-2 rounded-lg px-4 text-[14px] font-bold">
              <Filter className="w-4 h-4" /> More Filters
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto relative">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-[12px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Club Name</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Members</th>
                  <th className="px-6 py-4">Admin</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined Date</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {error ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-red-500 font-medium">
                      {error}
                    </td>
                  </tr>
                ) : loading ? (
                  skeletonRows.map((i) => (
                    <tr key={`sk-${i}`} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-10 h-10 rounded-xl" />
                          <Skeleton className="h-4 w-40 rounded-md" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-32 rounded-md" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-12 rounded-md" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-8 h-8 rounded-full" />
                          <div className="flex flex-col gap-2">
                            <Skeleton className="h-3 w-28 rounded-md" />
                            <Skeleton className="h-3 w-36 rounded-md" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-5 w-14 rounded-lg" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-5 w-20 rounded-lg" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-24 rounded-md" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Skeleton className="h-9 w-9 rounded-lg" />
                          <Skeleton className="h-9 w-9 rounded-lg" />
                          <Skeleton className="h-9 w-9 rounded-lg" />
                          <Skeleton className="h-9 w-9 rounded-lg" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : paginatedClubs.length > 0 ? (
                  paginatedClubs.map((club) => {
                    const canToggleStatus = club.status !== "Expired";
                    const isSuspended = club.status === "Suspended";
                    const statusTitle = !canToggleStatus
                      ? "Club Expired"
                      : isSuspended
                        ? "Activate Club"
                        : "Suspend Club";
                    const statusClassName = cn(
                      "h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white transition-colors",
                      !canToggleStatus
                        ? "text-gray-300 cursor-not-allowed"
                        : isSuspended
                          ? "text-[#10b981] hover:bg-[#10b981]/10"
                          : "text-red-600 hover:bg-red-50",
                    );
                    const StatusIcon = isSuspended ? CheckCircle2 : Ban;

                    return (
                    <tr key={club.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                            <img src={club.logo} alt={club.name} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[15px] font-bold text-gray-800">{club.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[14px] text-gray-500 font-medium">{club.location}</td>
                      <td className="px-6 py-4 text-[14px] text-gray-500 font-bold">{club.members}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={club.admin.avatar} alt={club.admin.name} className="w-8 h-8 rounded-full border border-gray-100" />
                          <div className="flex flex-col">
                            <span className="text-[14px] font-bold text-gray-800 leading-tight">{club.admin.name}</span>
                            <span className="text-[12px] text-gray-400 font-medium">{club.admin.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[11px] font-bold px-2.5 py-1 rounded-lg",
                          club.plan === 'Pro' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                        )}>
                          {club.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[11px] font-bold px-2.5 py-1 rounded-lg",
                          club.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 
                          club.status === 'Suspended' ? 'bg-amber-50 text-amber-600' : 
                          'bg-red-50 text-red-600'
                        )}>
                          {club.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[14px] text-gray-500 font-medium">{club.joinedDate}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link 
                            href={`/super-admin/clubs/${club.id}`}
                            className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-[#10b981]/10 hover:text-[#10b981] transition-colors"
                            title="View Club Details"
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </Link>
                          <button 
                            onClick={() => handleEdit(club)}
                            className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit Club"
                          >
                            <Edit2 className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(club)}
                            className={statusClassName}
                            title={statusTitle}
                            disabled={!canToggleStatus}
                          >
                            <StatusIcon className="w-4.5 h-4.5" />
                          </button>
                          <div className="relative">
                            <button 
                              onClick={(e) => {
                                if (activeDropdown === club.id) {
                                  closeDropdown();
                                } else {
                                  if (closeTimeoutRef.current != null) {
                                    window.clearTimeout(closeTimeoutRef.current);
                                    closeTimeoutRef.current = null;
                                  }
                                  setActiveDropdown(club.id);
                                  setDropdownAnchorEl(e.currentTarget);
                                  setDropdownClub(club);
                                }
                              }}
                              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors"
                            >
                              <MoreHorizontal className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                      );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400 font-medium">
                      No clubs found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-6 border-t border-gray-50 flex items-center justify-between">
            <p className="text-[13px] text-gray-500 font-medium">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredClubs.length)} of {filteredClubs.length} clubs
            </p>
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </CardContent>
      </Card>

      <FloatingMenu open={activeDropdown != null} anchorEl={dropdownAnchorEl} onClose={closeDropdown} placement="top-end" className="w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-2">
        {dropdownClub ? (
          <>
            <button
              onClick={() => handleMoreAction("view-analytics", dropdownClub)}
              className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <BarChart3 className="w-4 h-4 text-gray-400" />
              View Analytics
            </button>
            <button
              onClick={() => handleMoreAction("reset-password", dropdownClub)}
              className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <KeyRound className="w-4 h-4 text-gray-400" />
              Reset Admin Password
            </button>
            <button
              onClick={() => handleMoreAction("audit-logs", dropdownClub)}
              className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <Clock className="w-4 h-4 text-gray-400" />
              Audit Logs
            </button>
            <button
              onClick={() => handleMoreAction("export", dropdownClub)}
              className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <Download className="w-4 h-4 text-gray-400" />
              Export Club Data
            </button>
            <div className="h-px bg-gray-50 my-1" />
            <button
              onClick={() => handleDelete(dropdownClub)}
              className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
              Delete Club
            </button>
          </>
        ) : null}
      </FloatingMenu>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Club"
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold text-gray-700">Club Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded-xl h-12" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-gray-700">Location</Label>
              <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="rounded-xl h-12" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold text-gray-700">Admin Name</Label>
              <Input value={editAdminName} onChange={(e) => setEditAdminName(e.target.value)} className="rounded-xl h-12" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-gray-700">Admin Email</Label>
              <Input value={editAdminEmail} onChange={(e) => setEditAdminEmail(e.target.value)} className="rounded-xl h-12" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold text-gray-700">Subscription Plan</Label>
              <SearchableSelect
                value={editPlan}
                onValueChange={setEditPlan}
                options={[
                  { value: "Pro", label: "Pro Plan" },
                  { value: "Basic", label: "Basic Plan" },
                ]}
                triggerClassName="h-12 bg-white font-medium rounded-xl"
                placeholder="Select a plan..."
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-gray-700">Status</Label>
              <SearchableSelect
                value={editStatus}
                onValueChange={(v) => setEditStatus(v as ClubRow["status"])}
                options={["Active", "Suspended", "Expired"].map((v) => ({ value: v, label: v }))}
                triggerClassName="h-12 bg-white font-medium rounded-xl"
                placeholder="Active"
              />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        title="Reset Password"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsResetPasswordModalOpen(false)}
              className="rounded-lg font-bold"
            >
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
                <span className="font-bold text-gray-800">{selectedClub?.admin?.email || "—"}</span>
              </p>
              <p className="text-gray-500 max-w-sm mt-2">
                Admin will receive an email with instructions to reset their password.
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
                  This will immediately set a new password for the club admin.
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
                    {copiedPassword ? (
                      <Check className="h-5 w-5 text-[#10b981]" />
                    ) : (
                      <Clipboard className="h-5 w-5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={statusAction === "activate" ? "Activate Club?" : "Suspend Club?"}
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
        <div className="flex flex-col items-center text-center py-4">
          <div
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center mb-6",
              statusAction === "activate" ? "bg-emerald-50 text-[#10b981]" : "bg-amber-50 text-amber-500",
            )}
          >
            {statusAction === "activate" ? <CheckCircle2 className="h-10 w-10" /> : <AlertTriangle className="h-10 w-10" />}
          </div>
          <h4 className="text-xl font-bold text-gray-900 mb-2">
            {statusAction === "activate" ? "Activate Club?" : "Suspend Club?"}
          </h4>
          <p className="text-gray-500 max-w-sm">
            This will:
          </p>
          <div className="mt-5 w-full max-w-sm text-left text-[14px] text-gray-600 space-y-2">
            <div className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-300" />
              <span>
                {statusAction === "activate"
                  ? "Re-enable login for all club users"
                  : "Disable login for all club users"}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-300" />
              <span>
                {statusAction === "activate"
                  ? "Restore access to club features"
                  : "Stop all ongoing tournaments"}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-300" />
              <span>
                {statusAction === "activate"
                  ? "Unsuspend previously suspended users"
                  : "Restrict access to club data"}
              </span>
            </div>
          </div>
          <p className="text-gray-500 max-w-sm mt-6">
            {statusAction === "activate"
              ? `Are you sure you want to activate ${selectedClub?.name}?`
              : `Are you sure you want to suspend ${selectedClub?.name}?`}
          </p>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Club Permanently?"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="rounded-lg font-bold">
              Cancel
            </Button>
            <Button 
              disabled={deleteConfirmText.trim().toUpperCase() !== "DELETE"}
              className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 border border-red-600/30 text-white rounded-lg font-bold px-8"
              onClick={confirmDelete}
            >
              Delete Club
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center py-2">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-red-50 text-red-500">
              <Trash2 className="h-10 w-10" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Delete Club Permanently?</h4>
            <p className="text-gray-500 max-w-sm">
              This action cannot be undone.
              <br />
              All club data will be permanently deleted.
            </p>
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
    </div>
  );
}
