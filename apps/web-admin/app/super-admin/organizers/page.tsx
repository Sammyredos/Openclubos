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
  BarChart3,
  KeyRound,
  Ban,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Trash2,
  Mail,
  Clipboard,
  Check,
  Trophy,
  CreditCard,
  MapPin,
  Globe,
  Phone,
  ArrowUpRight,
  Calendar,
  User,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, SearchableSelect } from "@/components/ui/input";
import { broadcastAdminEvent, cn, subscribeAdminEvents } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { FloatingMenu } from "@/components/ui/floating-menu";
import Link from "next/link";
import { toast } from "sonner";
import {
  activateOrganizer,
  deleteOrganizer,
  forceLogoutOrganizer,
  getOrganizers,
  suspendOrganizer,
  updateOrganizer,
  getOrganizer,
  getOrganizerStats,
} from "@/lib/api/organizers";
import { getTournaments } from "@/lib/api/tournaments";
import { getRegistrations } from "@/lib/api/registrations";
import { forgotPasswordRequest, getAuthToken } from "@/lib/api/auth";
import { updateMember, getMember } from "@/lib/api/members";


type ApiOrganizer = {
  id: string;
  name: string;
  address: string | null;
  logo?: string | null;
  status?: "ACTIVE" | "SUSPENDED" | "EXPIRED";
  plan?: "PRO" | "BASIC";
  createdAt: string;
  type?: string | null;
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  country?: string | null;
  _count?: { tournaments: number; courses: number };
  users?: Array<{ id: string; email: string; firstName: string | null; lastName: string | null; profilePhoto?: string | null; phone?: string | null }>;
};

type OrganizerRow = {
  id: string;
  name: string;
  location: string;
  admin: { id: string | null; name: string; email: string; avatar: string };
  plan: string;
  status: "Active" | "Suspended" | "Expired";
  joinedDate: string;
  createdAtISO: string;
  logo: string;
  type: string;
  website: string;
  facebook: string;
  instagram: string;
  country: string;
  tournamentsCount: number;
  coursesCount: number;
};

type ApiTournament = {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  status: "DRAFT" | "REGISTRATION_OPEN" | "ONGOING" | "COMPLETED" | "CANCELLED";
  entryFee: number | null;
  maxPlayers: number | null;
  _count?: { registrations: number };
};

type ApiRegistration = {
  id: string;
  registeredAt: string;
  status: string;
  paymentStatus: "UNPAID" | "PAID" | "REFUNDED";
  paymentReference: string | null;
  user: { id: string; email: string; firstName: string | null; lastName: string | null };
  tournament: { id: string; name: string; entryFee: number | null; startDate: string };
};

type OrganizerStats = {
  totalMembers: number;
  membersThisMonth: number;
  totalTournaments: number;
  activeTournaments: number;
  ongoingTournaments: number;
  paidRegistrations: number;
  unpaidRegistrations: number;
  totalRevenue: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  unpaidAmount: number;
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

function toOrganizerRow(o: ApiOrganizer): OrganizerRow {
  const adminUser = o.users?.[0] || null;
  const adminName = adminUser ? fullName(adminUser.firstName, adminUser.lastName) : "—";
  const adminEmail = adminUser?.email || "—";
  const plan = o.plan === "PRO" ? "Pro" : o.plan === "BASIC" ? "Basic" : "—";
  const status = o.status === "SUSPENDED" ? "Suspended" : o.status === "EXPIRED" ? "Expired" : "Active";
  return {
    id: o.id,
    name: o.name,
    location: o.address || "—",
    admin: {
      id: adminUser?.id ?? null,
      name: adminName,
      email: adminEmail,
      avatar: adminUser?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(adminEmail || o.id)}`,
    },
    plan,
    status,
    joinedDate: formatJoinedDate(o.createdAt),
    createdAtISO: o.createdAt,
    logo: o.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(o.name)}&background=10b981&color=fff&bold=true`,
    type: o.type || "Golf Club",
    website: o.website || "—",
    facebook: o.facebook || "",
    instagram: o.instagram || "",
    country: o.country || "NG",
    tournamentsCount: o._count?.tournaments ?? 0,
    coursesCount: o._count?.courses ?? 0,
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

function formatCompactCurrency(value: number) {
  if (value >= 100) {
    return (Math.floor(value / 10) / 100).toFixed(2) + "k";
  }
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function OrganizersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizersData, setOrganizersData] = useState<OrganizerRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [planFilter, setPlanFilter] = useState("All Plans");
  const [locationFilter, setLocationFilter] = useState("All Locations");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isForceLogoutModalOpen, setIsForceLogoutModalOpen] = useState(false);
  const [selectedOrganizer, setSelectedOrganizer] = useState<OrganizerRow | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetTab, setResetTab] = useState<"link" | "generate">("link");
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownAnchorEl, setDropdownAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [dropdownOrganizer, setDropdownOrganizer] = useState<OrganizerRow | null>(null);
  const [mutating, setMutating] = useState(false);
  const [statusAction, setStatusAction] = useState<"suspend" | "activate">("suspend");

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewTab, setViewTab] = useState<"overview" | "tournaments" | "payments">("overview");
  const [viewLoading, setViewLoading] = useState(false);
  const [viewTournaments, setViewTournaments] = useState<ApiTournament[]>([]);
  const [viewRegistrations, setViewRegistrations] = useState<ApiRegistration[]>([]);
  const [viewStats, setViewStats] = useState<OrganizerStats | null>(null);

  const [tournamentPage, setTournamentPage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const [tournamentSearch, setTournamentSearch] = useState("");
  const [paymentSearch, setPaymentSearch] = useState("");
  const modalItemsPerPage = 5;

  const closeTimeoutRef = useRef<number | null>(null);
  const closeDropdown = () => {
    setActiveDropdown(null);
    if (closeTimeoutRef.current != null) window.clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = window.setTimeout(() => {
      setDropdownAnchorEl(null);
      setDropdownOrganizer(null);
      closeTimeoutRef.current = null;
    }, 160);
  };

  async function reloadOrganizers() {
    setLoading(true);
    setError(null);
    try {
      const data = (await getOrganizers()) as ApiOrganizer[];
      const rows = Array.isArray(data) ? data.map(toOrganizerRow) : [];
      setOrganizersData(rows);
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Failed to fetch organizers");
      setOrganizersData([]);
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
          setOrganizersData([]);
          setLoading(false);
          return;
        }
        setLoading(true);
        setError(null);
        const data = (await getOrganizers()) as ApiOrganizer[];
        if (cancelled) return;
        const rows = Array.isArray(data) ? data.map(toOrganizerRow) : [];
        setOrganizersData(rows);
      } catch (e: unknown) {
        if (cancelled) return;
        setError(getErrorMessage(e) || "Failed to fetch organizers");
        setOrganizersData([]);
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

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = subscribeAdminEvents((evt) => {
      if (evt.type !== "organizers-changed") return;
      if (cancelled) return;
      reloadOrganizers();
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const filteredOrganizers = organizersData.filter((organizer) => {
    const q = searchQuery.trim().toLowerCase();
    const tokens = q.split(/[\s-]+/).filter(Boolean);

    const searchableFields = [
      organizer.name,
      organizer.location,
      organizer.admin.name,
      organizer.admin.email,
      `${organizer.admin.name} ${organizer.admin.email}`,
    ];

    const matchesSearch = tokens.length === 0 || tokens.every(token => 
      searchableFields.some(field => field?.toLowerCase().includes(token))
    );

    const matchesStatus = statusFilter === "All Status" || organizer.status === statusFilter;
    const matchesPlan = planFilter === "All Plans" || organizer.plan === planFilter;
    const matchesLocation = locationFilter === "All Locations" || organizer.location.includes(locationFilter);

    return matchesSearch && matchesStatus && matchesPlan && matchesLocation;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrganizers.length / itemsPerPage));
  const paginatedOrganizers = filteredOrganizers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const uniqueLocations = Array.from(new Set(organizersData.map((o) => o.location))).filter((v) => v !== "—");

  const totalOrganizers = organizersData.length;
  const activeOrganizers = organizersData.filter((o) => o.status === "Active").length;
  const suspendedOrganizers = organizersData.filter((o) => o.status === "Suspended").length;
  const expiredOrganizers = organizersData.filter((o) => o.status === "Expired").length;
  const now = new Date();
  const newThisMonth = organizersData.filter((o) => {
    const d = new Date(o.createdAtISO);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  const handleEdit = (organizer: OrganizerRow) => {
    closeDropdown();
    router.push(`/super-admin/organizers/${organizer.id}/edit`);
  };

  const openViewModal = async (organizer: OrganizerRow) => {
    setSelectedOrganizer(organizer);
    setViewTab("overview");
    setTournamentPage(1);
    setPaymentPage(1);
    setTournamentSearch("");
    setPaymentSearch("");
    setIsViewModalOpen(true);
    setViewLoading(true);
    closeDropdown();

    try {
      const [tournamentsRes, registrationsRes, statsRes] = await Promise.all([
        getTournaments({ organizerId: organizer.id }),
        getRegistrations({ organizerId: organizer.id, take: 500 }),
        getOrganizerStats(organizer.id),
      ]);

      setViewTournaments((Array.isArray(tournamentsRes) ? tournamentsRes : []) as ApiTournament[]);
      setViewRegistrations((registrationsRes?.items ?? []) as ApiRegistration[]);
      setViewStats((statsRes ?? null) as OrganizerStats | null);
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || "Failed to load organizer details");
    } finally {
      setViewLoading(false);
    }
  };

  const handleDelete = (organizer: OrganizerRow) => {
    setSelectedOrganizer(organizer);
    setDeleteConfirmText("");
    setIsDeleteModalOpen(true);
    closeDropdown();
  };

  const handleStatusChange = (organizer: OrganizerRow) => {
    setSelectedOrganizer(organizer);
    setStatusAction(organizer.status === "Suspended" ? "activate" : "suspend");
    setIsStatusModalOpen(true);
    closeDropdown();
  };

  const openForceLogoutModal = (organizer: OrganizerRow) => {
    setSelectedOrganizer(organizer);
    setIsForceLogoutModalOpen(true);
    closeDropdown();
  };

  const openResetPasswordModal = (organizer: OrganizerRow) => {
    setSelectedOrganizer(organizer);
    setResetTab("link");
    setGeneratedPassword(null);
    setCopiedPassword(false);
    setIsResetPasswordModalOpen(true);
    closeDropdown();
  };

  const sendResetLink = async () => {
    const email = selectedOrganizer?.admin?.email;
    if (!email || email === "—") {
      toast.error("No admin email found for this organizer");
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
    const adminId = selectedOrganizer?.admin?.id;
    if (!adminId) {
      toast.error("No admin user found for this organizer");
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

  const handleMoreAction = (action: string, organizer: OrganizerRow) => {
    closeDropdown();
    if (action === "view-analytics") {
      openViewModal(organizer);
      return;
    }
    if (action === "edit") {
      handleEdit(organizer);
      return;
    }
    if (action === "reset-password") {
      openResetPasswordModal(organizer);
      return;
    }
    if (action === "audit-logs") {
      toast.success("Opening audit logs");
      return;
    }
    if (action === "export") {
      const blob = new Blob([JSON.stringify(organizer, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(organizer?.name || "organizer").toString().replaceAll(" ", "-").toLowerCase()}-export.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Organizer data exported");
    }
  };

  const confirmDelete = () => {
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE" || !selectedOrganizer?.id) return;
    if (selectedOrganizer.tournamentsCount > 0) {
      toast.error(`Cannot delete organizer: "${selectedOrganizer.name}" has hosted tournaments before. Please suspend them instead.`);
      setIsDeleteModalOpen(false);
      setStatusAction("suspend");
      setIsStatusModalOpen(true);
      return;
    }
    setMutating(true);
    deleteOrganizer(selectedOrganizer.id)
      .then(() => {
        toast.success(`${selectedOrganizer?.name} has been deleted`);
        setIsDeleteModalOpen(false);
        broadcastAdminEvent("organizers-changed");
        return reloadOrganizers();
      })
      .catch((e: unknown) => toast.error(getErrorMessage(e) || "Failed to delete organizer"))
      .finally(() => setMutating(false));
  };

  const confirmStatusChange = () => {
    if (!selectedOrganizer?.id) return;
    setMutating(true);
    const op = statusAction === "activate" ? activateOrganizer : suspendOrganizer;
    op(selectedOrganizer.id)
      .then(() => {
        toast.success(
          statusAction === "activate"
            ? `${selectedOrganizer?.name} has been activated`
            : `${selectedOrganizer?.name} has been suspended`,
        );
        setIsStatusModalOpen(false);
        broadcastAdminEvent("organizers-changed");
        return reloadOrganizers();
      })
      .catch((e: unknown) =>
        toast.error(
          getErrorMessage(e) ||
            (statusAction === "activate" ? "Failed to activate organizer" : "Failed to suspend organizer"),
        ),
      )
      .finally(() => setMutating(false));
  };

  const confirmForceLogout = () => {
    if (!selectedOrganizer?.id) return;
    setMutating(true);
    forceLogoutOrganizer(selectedOrganizer.id)
      .then(() => {
        toast.success("Organizer users have been logged out");
        setIsForceLogoutModalOpen(false);
        broadcastAdminEvent("organizers-changed");
        return reloadOrganizers();
      })
      .catch((e: unknown) => toast.error(getErrorMessage(e) || "Failed to force logout organizer"))
      .finally(() => setMutating(false));
  };

  const skeletonRows = Array.from({ length: itemsPerPage }, (_, idx) => idx);

  return (
    <div className="space-y-8 w-full max-w-full px-2 pb-10 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard
          title="Total Organizers"
          value={String(totalOrganizers)}
          icon={Building2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          loading={loading}
        />
        <StatCard
          title="Active Organizers"
          value={String(activeOrganizers)}
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          loading={loading}
        />
        <StatCard
          title="Suspended Organizers"
          value={String(suspendedOrganizers)}
          icon={ShieldAlert}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          loading={loading}
        />
        <StatCard
          title="Expired Organizers"
          value={String(expiredOrganizers)}
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
          <CardTitle className="text-xl font-bold">All Organizers</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="h-10 border-gray-200 text-gray-600 gap-2 rounded-lg px-4 text-[14px] font-bold">
              <Download className="w-4 h-4" /> Export
            </Button>
            <Button onClick={() => router.push("/super-admin/organizers/create")} className="h-10 bg-[#10b981] hover:bg-[#0da673] border border-emerald-600/30 text-white gap-2 rounded-lg px-4 text-[14px] font-bold">
              <Plus className="w-4 h-4" /> Add Organizer
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-6 pb-6 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search organizer name, location or admin..."
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

          </div>

          <div className="overflow-x-auto relative">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-4">Organizer Name</th>
                  <th className="px-4 py-4">Location & Contact</th>
                  <th className="px-4 py-4">Admin Details</th>
                  <th className="px-4 py-4">Plan & Joined</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {error ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-red-500 font-medium">
                      {error}
                    </td>
                  </tr>
                ) : loading ? (
                  skeletonRows.map((i) => (
                    <tr key={`sk-${i}`} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                          <div className="flex flex-col gap-1.5">
                            <Skeleton className="h-4 w-32 rounded-md" />
                            <Skeleton className="h-3 w-16 rounded-md" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1.5">
                          <Skeleton className="h-4 w-28 rounded-md" />
                          <Skeleton className="h-3.5 w-24 rounded-md" />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                          <div className="flex flex-col gap-1.5">
                            <Skeleton className="h-3.5 w-24 rounded-md" />
                            <Skeleton className="h-3 w-28 rounded-md" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1.5">
                          <Skeleton className="h-4.5 w-12 rounded-md" />
                          <Skeleton className="h-3.5 w-20 rounded-md" />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-5 w-16 rounded-lg" />
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
                ) : paginatedOrganizers.length > 0 ? (
                  paginatedOrganizers.map((organizer) => {
                    return (
                      <tr key={organizer.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3 max-w-[200px]">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                              <img src={organizer.logo} alt={organizer.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[14px] font-bold text-gray-800 leading-tight truncate" title={organizer.name}>
                                {organizer.name.toLowerCase()}
                              </span>
                              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded mt-1 self-start whitespace-nowrap">
                                {organizer.type.toLowerCase()}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1 text-[13px] text-gray-500 font-medium truncate max-w-[180px]" title={organizer.location}>
                              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span>{organizer.location.toLowerCase()}</span>
                            </div>
                            {organizer.website && organizer.website !== "—" && (
                              <a
                                href={organizer.website.startsWith("http") ? organizer.website : `https://${organizer.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[12px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 mt-1 normal-case hover:underline self-start"
                              >
                                <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate max-w-[150px]">{organizer.website.toLowerCase()}</span>
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <img
                              src={organizer.admin.avatar}
                              alt={organizer.admin.name}
                              className="w-8 h-8 rounded-full border border-gray-100 flex-shrink-0"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-[14px] font-bold text-gray-800 leading-tight truncate">{organizer.admin.name.toLowerCase()}</span>
                              <span className="text-[12px] text-gray-400 font-medium truncate normal-case">{organizer.admin.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap",
                                organizer.plan === "Pro" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-blue-50 text-blue-600 border border-blue-100",
                              )}
                            >
                              {organizer.plan}
                            </span>
                            <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">
                              {organizer.joinedDate}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap",
                              organizer.status === "Active"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                : organizer.status === "Suspended"
                                  ? "bg-amber-50 text-amber-600 border border-amber-100"
                                  : "bg-red-50 text-red-600 border border-red-100",
                            )}
                          >
                            {organizer.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openViewModal(organizer)}
                              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-[#10b981]/10 hover:text-[#10b981] transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4.5 h-4.5" />
                            </button>
                            <button
                              onClick={() => handleEdit(organizer)}
                              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              title="Edit Organizer"
                            >
                              <Edit2 className="w-4.5 h-4.5" />
                            </button>
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  if (activeDropdown === organizer.id) {
                                    closeDropdown();
                                  } else {
                                    if (closeTimeoutRef.current != null) {
                                      window.clearTimeout(closeTimeoutRef.current);
                                      closeTimeoutRef.current = null;
                                    }
                                    setActiveDropdown(organizer.id);
                                    setDropdownAnchorEl(e.currentTarget);
                                    setDropdownOrganizer(organizer);
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
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <EmptyState
                        icon={Building2}
                        title="No organizers found"
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
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredOrganizers.length)} of {filteredOrganizers.length} organizers
            </p>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </CardContent>
      </Card>

      <FloatingMenu
        open={activeDropdown != null}
        anchorEl={dropdownAnchorEl}
        onClose={closeDropdown}
        placement="top-end"
        className="w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-2"
      >
        {dropdownOrganizer ? (
          <>
            <button
              disabled={dropdownOrganizer.status === "Expired"}
              onClick={() => handleStatusChange(dropdownOrganizer)}
              className={cn(
                "w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 flex items-center gap-3",
                dropdownOrganizer.status === "Expired" 
                  ? "text-gray-300 cursor-not-allowed" 
                  : dropdownOrganizer.status === "Suspended" 
                    ? "text-gray-700 hover:bg-emerald-50" 
                    : "text-gray-700 hover:bg-red-50",
              )}
            >
              {dropdownOrganizer.status === "Suspended" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Ban className="w-4 h-4 text-red-600" />
              )}
              {dropdownOrganizer.status === "Suspended" ? "Activate Organizer" : "Suspend Organizer"}
            </button>
            <div className="h-px bg-gray-50 my-1" />
            <button
              onClick={() => handleEdit(dropdownOrganizer)}
              className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <Edit2 className="w-4 h-4 text-gray-400" />
              Edit Organizer
            </button>
            <button
              onClick={() => handleMoreAction("view-analytics", dropdownOrganizer)}
              className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <BarChart3 className="w-4 h-4 text-gray-400" />
              View Analytics
            </button>
            <button
              disabled={mutating}
              onClick={() => openForceLogoutModal(dropdownOrganizer)}
              className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <LogOut className="w-4 h-4 text-gray-400" />
              Force Logout
            </button>
            <button
              onClick={() => handleMoreAction("reset-password", dropdownOrganizer)}
              className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <KeyRound className="w-4 h-4 text-gray-400" />
              Reset Admin Password
            </button>
            <button
              onClick={() => handleMoreAction("audit-logs", dropdownOrganizer)}
              className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <Clock className="w-4 h-4 text-gray-400" />
              Audit Logs
            </button>
            <button
              onClick={() => handleMoreAction("export", dropdownOrganizer)}
              className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <Download className="w-4 h-4 text-gray-400" />
              Export Organizer Data
            </button>
            <div className="h-px bg-gray-50 my-1" />
            <button
              onClick={() => handleDelete(dropdownOrganizer)}
              className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 flex items-center gap-3"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
              Delete Organizer
            </button>
          </>
        ) : null}
      </FloatingMenu>

      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={statusAction === "activate" ? "Activate Organizer?" : "Suspend Organizer?"}
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
            {statusAction === "activate" ? (
              <CheckCircle2 className="h-10 w-10" />
            ) : (
              <AlertTriangle className="h-10 w-10" />
            )}
          </div>
          <h4 className="text-xl font-bold text-gray-900 mb-2">{statusAction === "activate" ? "Activate Organizer?" : "Suspend Organizer?"}</h4>
          <p className="text-gray-500 max-w-sm mt-1">
            {statusAction === "activate"
              ? `Are you sure you want to activate ${selectedOrganizer?.name}?`
              : `Are you sure you want to suspend ${selectedOrganizer?.name}?`}
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={isForceLogoutModalOpen}
        onClose={() => setIsForceLogoutModalOpen(false)}
        title="Force Logout Organizer?"
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
          <h4 className="text-xl font-bold text-gray-900 mb-2">Force logout this organizer user?</h4>
          <p className="text-gray-500 max-w-sm mt-1">
            This will immediately log out this user <br />
            <span className="font-bold text-gray-800">{selectedOrganizer?.name ?? "this organizer"}</span>.
          </p>
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
                <span className="font-bold text-gray-800">{selectedOrganizer?.admin?.email || "—"}</span>
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
                <p className="text-gray-500 max-w-sm">This will immediately set a new password for the organizer admin.</p>
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
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Organizer Permanently?"
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
              Delete Organizer
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center py-2">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-red-50 text-red-500">
              <Trash2 className="h-10 w-10" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Delete Organizer Permanently?</h4>
            <p className="text-gray-500 max-w-sm">
              This action cannot be undone.
              <br />
              All organizer data will be permanently deleted.
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

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Organizer Details"
        size="lg"
      >
        {(() => {
          const filteredTournaments = viewTournaments.filter((t) =>
            t.name.toLowerCase().includes(tournamentSearch.toLowerCase()),
          );
          const totalTournamentPages = Math.ceil(filteredTournaments.length / modalItemsPerPage);
          const paginatedTournaments = filteredTournaments.slice(
            (tournamentPage - 1) * modalItemsPerPage,
            tournamentPage * modalItemsPerPage,
          );

          const filteredPayments = viewRegistrations.filter((r) => {
            const playerMatch = fullName(r.user.firstName, r.user.lastName)
              .toLowerCase()
              .includes(paymentSearch.toLowerCase());
            const tournamentMatch = r.tournament.name.toLowerCase().includes(paymentSearch.toLowerCase());
            const emailMatch = r.user.email.toLowerCase().includes(paymentSearch.toLowerCase());
            return playerMatch || tournamentMatch || emailMatch;
          });
          const totalPaymentPages = Math.ceil(filteredPayments.length / modalItemsPerPage);
          const paginatedPayments = filteredPayments.slice(
            (paymentPage - 1) * modalItemsPerPage,
            paymentPage * modalItemsPerPage,
          );

          return (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Profile Card Header */}
              <div className="rounded-2xl border border-gray-100 bg-emerald-50/20 p-5 flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white border border-emerald-100/50 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                  {selectedOrganizer?.logo ? (
                    <img
                      src={selectedOrganizer.logo}
                      alt={selectedOrganizer.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Building2 className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xl text-gray-900 truncate">{selectedOrganizer?.name}</p>
                    {selectedOrganizer ? (
                      <span
                        className={cn(
                          "text-[10px] px-2.5 py-1 rounded-full border flex items-center gap-1.5",
                          selectedOrganizer.status === "Active"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : selectedOrganizer.status === "Suspended"
                              ? "bg-amber-50 text-amber-600 border-amber-100"
                              : "bg-red-50 text-red-600 border-red-100",
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full",
                          selectedOrganizer.status === "Active" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                        )} />
                        {selectedOrganizer.status}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[12px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500/80" />
                      {selectedOrganizer?.location || "No Location"}
                    </span>
                    <span className="h-3 w-px bg-gray-200" />
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-500/80" />
                      Plan: <span className="text-emerald-600">{selectedOrganizer?.plan || "Standard"}</span>
                    </span>
                    <span className="h-3 w-px bg-gray-200" />
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500/80" />
                      Joined: {selectedOrganizer?.joinedDate || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 p-1 bg-gray-50 rounded-xl border border-gray-100/50">
                {[
                  { id: "overview", label: "Overview", icon: BarChart3 },
                  { id: "tournaments", label: "Tournaments", icon: Trophy },
                  { id: "payments", label: "Payments", icon: CreditCard },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setViewTab(tab.id as any)}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-lg text-[13px] flex items-center justify-center gap-2 transition-all duration-200 whitespace-nowrap",
                      viewTab === tab.id
                        ? "bg-white text-emerald-600 shadow-sm border border-gray-100"
                        : "text-gray-500 hover:text-emerald-600 hover:bg-gray-100/50",
                    )}
                  >
                    <tab.icon className="h-4 w-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="min-h-[400px]">
                {viewLoading ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-24 w-full rounded-2xl animate-pulse" />
                      <Skeleton className="h-24 w-full rounded-2xl animate-pulse" />
                    </div>
                    <Skeleton className="h-40 w-full rounded-2xl animate-pulse" />
                  </div>
                ) : (
                  <>
                    {viewTab === "overview" && (
                      <div className="space-y-6 animate-in fade-in duration-300">
                        {/* KPI Cards Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50 flex flex-col justify-between h-24">
                            <span className="text-[11px] text-emerald-600 uppercase tracking-wider">Revenue</span>
                            <span className="text-xl text-emerald-700 mt-1">
                              ₦{viewStats ? formatCompactCurrency(viewStats.totalRevenue / 100) : "0.00"}
                            </span>
                          </div>
                          <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex flex-col justify-between h-24">
                            <span className="text-[11px] text-gray-500 uppercase tracking-wider">Tournaments</span>
                            <span className="text-xl text-gray-800 mt-1">{viewStats?.totalTournaments ?? 0}</span>
                          </div>
                          <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex flex-col justify-between h-24">
                            <span className="text-[11px] text-gray-500 uppercase tracking-wider">Members</span>
                            <span className="text-xl text-gray-800 mt-1">{viewStats?.totalMembers ?? 0}</span>
                          </div>
                          <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex flex-col justify-between h-24">
                            <span className="text-[11px] text-gray-500 uppercase tracking-wider">Unpaid</span>
                            <span className="text-xl text-gray-800 mt-1">
                              ₦{viewStats ? formatCompactCurrency(viewStats.unpaidAmount / 100) : "0.00"}
                            </span>
                          </div>
                        </div>

                        {/* Admin Information & Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="rounded-2xl border border-gray-100 p-5 space-y-4 bg-white shadow-sm">
                            <h5 className="text-[14px] text-gray-900 border-b border-gray-50 pb-2">Admin Profile</h5>
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                  <User className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Full Name</p>
                                  <p className="text-[13px] text-gray-700 truncate">{selectedOrganizer?.admin.name}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                  <Mail className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Email Address</p>
                                  <p className="text-[13px] text-gray-700 truncate normal-case">{selectedOrganizer?.admin.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                  <Calendar className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Registration Date</p>
                                  <p className="text-[13px] text-gray-700 truncate">{selectedOrganizer?.joinedDate}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Recent Activity Timeline */}
                          <div className="rounded-2xl border border-gray-100 p-5 space-y-4 bg-white shadow-sm">
                            <h5 className="text-[14px] text-gray-900 border-b border-gray-50 pb-2">Recent Tournaments</h5>
                            {viewTournaments.length > 0 ? (
                              <div className="space-y-4 relative pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-px before:bg-gray-100">
                                {viewTournaments.slice(0, 3).map((t) => (
                                  <div key={t.id} className="relative flex items-center justify-between gap-4">
                                    <div className="absolute -left-[14.5px] top-1.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white ring-4 ring-emerald-50" />
                                    <div className="min-w-0">
                                      <p className="text-[13px] text-gray-800 truncate">{t.name}</p>
                                      <p className="text-[11px] text-gray-400">{formatJoinedDate(t.startDate)}</p>
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 shrink-0 border border-emerald-100/50">
                                      {t.status.replaceAll("_", " ").toLowerCase()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="h-32 flex flex-col items-center justify-center text-center">
                                <Trophy className="w-8 h-8 text-gray-200 mb-2" />
                                <p className="text-[12px] text-gray-400">No tournaments registered yet</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {viewTab === "tournaments" && (
                      <div className="space-y-4 animate-in fade-in duration-300">
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
                            <thead className="bg-gray-50 text-[11px] text-gray-400 uppercase tracking-wider border-b border-gray-100">
                              <tr>
                                <th className="px-5 py-3 font-normal">Tournament</th>
                                <th className="px-5 py-3 font-normal">Date</th>
                                <th className="px-5 py-3 font-normal">Status</th>
                                <th className="px-5 py-3 font-normal text-right">Players</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {paginatedTournaments.length > 0 ? (
                                paginatedTournaments.map((t) => (
                                  <tr key={t.id} className="hover:bg-gray-50/30 transition-colors">
                                    <td className="px-5 py-4">
                                      <p className="text-[13px] text-gray-800">{t.name}</p>
                                    </td>
                                    <td className="px-5 py-4 text-[13px] text-gray-500">
                                      {formatJoinedDate(t.startDate)}
                                    </td>
                                    <td className="px-5 py-4">
                                      <span
                                        className={cn(
                                          "text-[10px] px-2 py-0.5 rounded",
                                          t.status === "ONGOING"
                                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100/50"
                                            : t.status === "REGISTRATION_OPEN"
                                              ? "bg-emerald-50/80 text-emerald-700 border border-emerald-100/50"
                                              : "bg-gray-50 text-gray-400 border border-gray-100",
                                        )}
                                      >
                                        {t.status.replaceAll("_", " ").toLowerCase()}
                                      </span>
                                    </td>
                                    <td className="px-5 py-4 text-right text-[13px] text-gray-800">
                                      {t._count?.registrations ?? 0} / {t.maxPlayers ?? "∞"}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                                    No tournaments found
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        {totalTournamentPages > 1 && (
                          <div className="flex justify-end pt-2">
                            <Pagination
                              currentPage={tournamentPage}
                              totalPages={totalTournamentPages}
                              onPageChange={setTournamentPage}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {viewTab === "payments" && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search player, email or tournament..."
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
                            <thead className="bg-gray-50 text-[11px] text-gray-400 uppercase tracking-wider border-b border-gray-100">
                              <tr>
                                <th className="px-5 py-3 font-normal">Player</th>
                                <th className="px-5 py-3 font-normal">Tournament</th>
                                <th className="px-5 py-3 font-normal">Amount</th>
                                <th className="px-5 py-3 font-normal text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {paginatedPayments.length > 0 ? (
                                paginatedPayments.map((r) => (
                                  <tr key={r.id} className="hover:bg-gray-50/30 transition-colors">
                                    <td className="px-5 py-4">
                                      <p className="text-[13px] text-gray-800">
                                        {fullName(r.user.firstName, r.user.lastName)}
                                      </p>
                                      <p className="text-[11px] text-gray-400 normal-case">{r.user.email}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                      <p className="text-[13px] text-gray-600">{r.tournament.name}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                      <p className="text-[13px] text-gray-800">
                                        ₦{formatCompactCurrency(r.tournament.entryFee ?? 0)}
                                      </p>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                      <span
                                        className={cn(
                                          "text-[10px] px-2 py-0.5 rounded",
                                          r.paymentStatus === "PAID"
                                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100/50"
                                            : r.paymentStatus === "UNPAID"
                                              ? "bg-amber-50/50 text-amber-700 border border-amber-100/30"
                                              : "bg-red-50/50 text-red-700 border border-red-100/30",
                                        )}
                                      >
                                        {r.paymentStatus.toLowerCase()}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                                    No payments found
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        {totalPaymentPages > 1 && (
                          <div className="flex justify-end pt-2">
                            <Pagination
                              currentPage={paymentPage}
                              totalPages={totalPaymentPages}
                              onPageChange={setPaymentPage}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
    })()}
      </Modal>


    </div>
  );
}
