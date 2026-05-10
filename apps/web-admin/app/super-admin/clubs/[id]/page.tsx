"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Users, 
  Trophy, 
  CreditCard,
  MapPin, 
  Globe, 
  Mail, 
  Phone,
  TrendingUp,
  ArrowUpRight,
  MoreHorizontal,
  Edit2,
  CheckCircle2,
  Trash2,
  KeyRound,
  BarChart3,
  Download,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  DollarSign,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FloatingMenu } from "@/components/ui/floating-menu";
import { Pagination } from "@/components/ui/pagination";
import { broadcastAdminEvent, cn, formatWithCommas, formatNumber, subscribeAdminEvents } from "@/lib/utils";
import { deleteClub, forceLogoutClub, getClub, getClubStats, updateClub } from "@/lib/api/clubs";
import { getTournaments } from "@/lib/api/tournaments";
import { getRegistrations } from "@/lib/api/registrations";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Input, SearchableSelect } from "@/components/ui/input";
import { toast } from "sonner";
import { forgotPasswordRequest } from "@/lib/api/auth";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "tournaments", label: "Tournaments" },
  { id: "payments", label: "Payments" },
  { id: "subscription", label: "Subscription" },
  { id: "settings", label: "Settings" },
  { id: "audit-logs", label: "Audit Logs" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type ApiClub = {
  id: string;
  name: string;
  address: string | null;
  status?: "ACTIVE" | "SUSPENDED" | "EXPIRED";
  plan?: "PRO" | "BASIC";
  createdAt: string;
  _count?: { tournaments: number; courses: number };
  users?: Array<{ id: string; email: string; firstName: string | null; lastName: string | null }>;
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
  tournament: { id: string; name: string; entryFee: number | null; startDate: string; club: { id: string; name: string } };
};

type ClubViewModel = {
  id: string;
  name: string;
  location: string;
  joinedDate: string;
  logo: string;
  status: "Active" | "Suspended" | "Expired";
  plan: "Pro" | "Basic" | "—";
  tournaments: number;
  email: string;
  phone: string;
  website: string;
  admin: string;
  createdAtISO: string;
  courses: number;
};

type ClubStats = {
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
  return fmt.format(new Date(iso));
}

function fullName(firstName: string | null, lastName: string | null) {
  const name = `${firstName || ""} ${lastName || ""}`.trim();
  return name || "—";
}

function toClubViewModel(c: ApiClub): ClubViewModel {
  const adminUser = c.users?.[0] || null;
  const adminName = adminUser ? fullName(adminUser.firstName, adminUser.lastName) : "—";
  const adminEmail = adminUser?.email || "—";
  const status = c.status === "SUSPENDED" ? "Suspended" : c.status === "EXPIRED" ? "Expired" : "Active";
  const plan = c.plan === "PRO" ? "Pro" : c.plan === "BASIC" ? "Basic" : "—";
  return {
    id: c.id,
    name: c.name,
    location: c.address || "—",
    joinedDate: formatJoinedDate(c.createdAt),
    logo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.name)}`,
    status,
    plan,
    tournaments: c._count?.tournaments ?? 0,
    email: adminEmail,
    phone: "—",
    website: "—",
    admin: adminName,
    createdAtISO: c.createdAt,
    courses: c._count?.courses ?? 0,
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

export default function ClubDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const [club, setClub] = React.useState<ClubViewModel | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [tournaments, setTournaments] = React.useState<ApiTournament[]>([]);
  const [tournamentsLoading, setTournamentsLoading] = React.useState(true);

  const [registrations, setRegistrations] = React.useState<ApiRegistration[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = React.useState(true);
  const [clubStats, setClubStats] = React.useState<ClubStats | null>(null);
  const [clubStatsLoading, setClubStatsLoading] = React.useState(true);

  const PAGE_SIZE = 10;
  const [tournamentsPage, setTournamentsPage] = React.useState(1);
  const [paymentsPage, setPaymentsPage] = React.useState(1);

  const [revenueRange, setRevenueRange] = useState("This Year");
  const [activeDropdown, setActiveDropdown] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState<HTMLButtonElement | null>(null);
  const closeTimeoutRef = React.useRef<number | null>(null);
  const closeMoreMenu = () => {
    setActiveDropdown(false);
    if (closeTimeoutRef.current != null) window.clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = window.setTimeout(() => {
      setMoreMenuAnchorEl(null);
      closeTimeoutRef.current = null;
    }, 160);
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isForceLogoutModalOpen, setIsForceLogoutModalOpen] = useState(false);

  const [editPlan, setEditPlan] = useState("Pro");
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editAdminName, setEditAdminName] = useState("");
  const [editAdminEmail, setEditAdminEmail] = useState("");

  const clubId =
    typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";

  async function reloadClubData() {
    if (!clubId) return;
    const data = (await getClub(clubId)) as ApiClub;
    const vm = toClubViewModel(data);
    setClub(vm);
    try {
      setClubStatsLoading(true);
      const s = (await getClubStats(clubId)) as ClubStats;
      setClubStats(s);
    } finally {
      setClubStatsLoading(false);
    }
  }

  React.useEffect(() => {
    async function fetchClubData() {
      try {
        setLoading(true);
        if (!clubId) throw new Error("Club not found");
        const data = (await getClub(clubId)) as ApiClub;
        const vm = toClubViewModel(data);
        setClub(vm);
        setTournamentsLoading(true);
        setRegistrationsLoading(true);
        setClubStatsLoading(true);

        const [tournamentsRes, registrationsRes, statsRes] = await Promise.all([
          getTournaments({ clubId }),
          getRegistrations({ clubId, take: 500 }),
          getClubStats(clubId),
        ]);

        setTournaments((Array.isArray(tournamentsRes) ? tournamentsRes : []) as ApiTournament[]);
        setRegistrations((registrationsRes?.items ?? []) as ApiRegistration[]);
        setClubStats((statsRes ?? null) as ClubStats | null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load club");
      } finally {
        setLoading(false);
        setTournamentsLoading(false);
        setRegistrationsLoading(false);
        setClubStatsLoading(false);
      }
    }
    fetchClubData();
  }, [clubId]);

  React.useEffect(() => {
    let cancelled = false;
    const unsubscribe = subscribeAdminEvents((evt) => {
      if (evt.type !== "clubs-changed") return;
      if (cancelled) return;
      reloadClubData();
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [clubId]);

  if (loading) {
    return (
      <div className="space-y-8 w-full max-w-full px-2 pb-10 font-sans">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-5 w-36 rounded-md" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Skeleton className="h-20 w-20 rounded-3xl" />
              <div className="space-y-3">
                <Skeleton className="h-8 w-72 rounded-lg" />
                <Skeleton className="h-4 w-80 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-40 rounded-xl" />
              <Skeleton className="h-11 w-28 rounded-xl" />
            </div>
          </div>
        </div>

        <Skeleton className="h-12 w-[520px] rounded-2xl" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <CardContent className="p-6">
                <Skeleton className="h-6 w-40 rounded-md" />
                <Skeleton className="h-10 w-28 rounded-lg mt-3" />
                <Skeleton className="h-4 w-32 rounded-md mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!club) return <div className="p-8 text-center">Club not found</div>;

  const activeStatusBadge = club.status === "Active" ? "bg-emerald-50 text-emerald-600" :
    club.status === "Suspended" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600";

  const subscriptionMonthlyFee =
    club.plan === "Pro" ? 150000 : club.plan === "Basic" ? 50000 : 0;
  const nextBillingDate = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
  })();

  const upcomingTournaments = (() => {
    const list = tournaments
      .slice()
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .slice(0, 5)
      .map((t, i) => {
        const start = formatJoinedDate(t.startDate);
        const end = t.endDate ? formatJoinedDate(t.endDate) : "";
        const date = end ? `${start} - ${end}` : start;
        const statusLabel =
          t.status === "ONGOING" ? "Ongoing" : t.status === "REGISTRATION_OPEN" ? "Upcoming" : t.status === "COMPLETED" ? "Completed" : t.status;
        const statusClass =
          t.status === "ONGOING"
            ? "bg-emerald-50 text-emerald-600"
            : t.status === "REGISTRATION_OPEN"
            ? "bg-blue-50 text-blue-600"
            : t.status === "COMPLETED"
            ? "bg-gray-50 text-gray-500"
            : "bg-gray-100 text-gray-400";
        
        // Icon logic to match image
        const Icon = i === 0 ? Users : i === 4 ? CheckCircle2 : Trophy;
        const iconBg = t.status === "ONGOING" ? "bg-emerald-50 text-emerald-600" : t.status === "REGISTRATION_OPEN" ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-400";

        return { id: t.id, name: t.name, date, statusLabel, statusClass, Icon, iconBg };
      });
    return list;
  })();

  const recentPayments = (() => {
    return registrations
      .slice()
      .filter((r) => r.paymentStatus === "PAID")
      .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
      .slice(0, 5);
  })();

  const activityFeed = (() => {
    const items: Array<{
      key: string;
      title: string;
      subtitle: string;
      time: string;
      kind: 'payment' | 'tournament';
    }> = [];
    for (const r of recentPayments) {
      items.push({
        key: `p-${r.id}`,
        title: "Payment received",
        subtitle: `${r.tournament.name} - Registration`,
        time: r.registeredAt,
        kind: "payment",
      });
    }
    for (const t of tournaments
      .slice()
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .slice(0, 5)) {
      items.push({
        key: `t-${t.id}`,
        title: "Tournament created",
        subtitle: t.name,
        time: t.startDate,
        kind: "tournament",
      });
    }
    return items
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);
  })();

  function timeAgoShort(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
  }

  const openEdit = () => {
    if (!club) return;
    setEditPlan(club.plan || "Pro");
    setEditName(club.name || "");
    setEditLocation(club.location || "");
    setEditAdminName(club.admin || "");
    setEditAdminEmail(club.email || "");
    setIsEditModalOpen(true);
  };

  const confirmDelete = () => {
    if (!clubId) return;
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") return;
    setMutating(true);
    deleteClub(clubId)
      .then(() => {
        toast.success("Club deleted");
        setIsDeleteModalOpen(false);
        broadcastAdminEvent("clubs-changed");
        router.push("/super-admin/clubs");
      })
      .catch((e: unknown) => toast.error(getErrorMessage(e) || "Failed to delete club"))
      .finally(() => setMutating(false));
  };

  const confirmForceLogout = () => {
    if (!clubId) return;
    setMutating(true);
    forceLogoutClub(clubId)
      .then(() => {
        toast.success("Club users have been logged out");
        setIsForceLogoutModalOpen(false);
        broadcastAdminEvent("clubs-changed");
        return reloadClubData();
      })
      .catch((e: unknown) => toast.error(getErrorMessage(e) || "Failed to force logout club"))
      .finally(() => setMutating(false));
  };

  const saveEdit = () => {
    if (!clubId) return;
    const plan = editPlan === "Pro" ? "PRO" : editPlan === "Basic" ? "BASIC" : undefined;
    const name = editName.trim();
    const address = editLocation.trim();
    const adminName = editAdminName.trim();
    const adminEmail = editAdminEmail.trim();
    const adminPairValid =
      (adminName.length === 0 && adminEmail.length === 0) ||
      (adminName.length > 0 && adminEmail.length > 0);

    if (name.length === 0) {
      toast.error("Club name is required");
      return;
    }
    if (address.length === 0) {
      toast.error("Address is required");
      return;
    }
    if (!adminPairValid) {
      toast.error("Please enter both Admin Name and Admin Email");
      return;
    }

    setMutating(true);
    updateClub(clubId, {
      name: name || undefined,
      address: address || undefined,
      plan,
      adminName: adminName || undefined,
      adminEmail: adminEmail || undefined,
    })
      .then(() => {
        toast.success("Club updated");
        setIsEditModalOpen(false);
        broadcastAdminEvent("clubs-changed");
        return reloadClubData();
      })
      .catch((e: unknown) => toast.error(getErrorMessage(e) || "Failed to update club"))
      .finally(() => setMutating(false));
  };

  const tournamentsTotalPages = Math.max(1, Math.ceil(tournaments.length / PAGE_SIZE));
  const paymentsTotalPages = Math.max(1, Math.ceil(registrations.length / PAGE_SIZE));

  const tournamentsPageSafe = Math.min(tournamentsPage, tournamentsTotalPages);
  const paymentsPageSafe = Math.min(paymentsPage, paymentsTotalPages);

  const tournamentsPageItems = tournaments.slice(
    (tournamentsPageSafe - 1) * PAGE_SIZE,
    tournamentsPageSafe * PAGE_SIZE
  );
  const paymentsPageItems = registrations.slice((paymentsPageSafe - 1) * PAGE_SIZE, paymentsPageSafe * PAGE_SIZE);

  const revenueGrowthPct =
    clubStats && clubStats.revenueLastMonth > 0
      ? ((clubStats.revenueThisMonth - clubStats.revenueLastMonth) / clubStats.revenueLastMonth) * 100
      : null;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const revenueYear = revenueRange === "This Year" ? year : year - 1;

  const revenueOverviewData = (() => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const base = months.map((m) => ({ month: m, amount: 0 }));
    for (const r of registrations) {
      if (r.paymentStatus !== "PAID") continue;
      const d = new Date(r.registeredAt);
      if (d.getFullYear() !== revenueYear) continue;
      base[d.getMonth()].amount += r.tournament.entryFee || 0;
    }
    return base;
  })();

  return (
    <div className="w-full max-w-full px-2 pb-10 font-sans">
      {/* Header Section with Back Navigation */}
      <div className="mb-6 px-4">
        <button 
          onClick={() => router.push("/super-admin/clubs")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors font-bold text-[14px]"
        >
          <ArrowLeft className="w-5 h-5" />
          Go Back
        </button>
      </div>

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
              disabled={
                mutating ||
                editName.trim().length === 0 ||
                editLocation.trim().length === 0 ||
                !(
                  (editAdminName.trim().length === 0 && editAdminEmail.trim().length === 0) ||
                  (editAdminName.trim().length > 0 && editAdminEmail.trim().length > 0)
                )
              }
              className="bg-[#10b981] hover:bg-[#0da673] border border-emerald-600/30 text-white rounded-lg font-bold px-8"
            >
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="font-bold text-gray-700">Club Name</Label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded-xl h-12" />
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-gray-700">Address</Label>
            <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="rounded-xl h-12" />
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-gray-700">Subscription Plan</Label>
            <SearchableSelect
              value={editPlan}
              onValueChange={setEditPlan}
              options={["Pro", "Basic"].map((v) => ({ value: v, label: v }))}
              triggerClassName="h-12 bg-white font-medium rounded-xl"
              placeholder="Select plan..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold text-gray-700">Admin Name</Label>
              <Input value={editAdminName} onChange={(e) => setEditAdminName(e.target.value)} className="rounded-xl h-12" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-gray-700">Admin Email</Label>
              <Input type="email" value={editAdminEmail} onChange={(e) => setEditAdminEmail(e.target.value)} className="rounded-xl h-12" />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isForceLogoutModalOpen}
        onClose={() => setIsForceLogoutModalOpen(false)}
        title="Force Logout Club?"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsForceLogoutModalOpen(false)} className="rounded-lg font-bold">
              Cancel
            </Button>
            <Button
              onClick={confirmForceLogout}
              disabled={mutating}
              className="bg-red-600 hover:bg-red-700 border border-red-600/30 text-white rounded-lg font-bold px-8"
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
          <h4 className="text-xl font-bold text-gray-900 mb-2">Force logout this club user?</h4>
          <p className="text-gray-500 max-w-sm mt-1">
            This will immediately log out this user <br></br><span className="font-bold text-gray-800">{club?.name ?? "this club"}</span>.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Club Permanently"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="rounded-lg font-bold">
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={mutating || deleteConfirmText.trim().toUpperCase() !== "DELETE"}
              className="bg-red-600 hover:bg-red-700 border border-red-600/30 text-white rounded-lg font-bold px-8 disabled:opacity-50"
            >
              Delete Club
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-[14px] text-gray-600 font-medium">
            Type <span className="font-bold text-gray-900">DELETE</span> to confirm this action.
          </p>
          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Type DELETE"
            className="rounded-xl h-12"
          />
        </div>
      </Modal>

      <div className="flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-7 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "py-4 text-[14px] font-bold whitespace-nowrap border-b-2 transition-colors",
                activeTab === t.id ? "border-[#10b981] text-[#10b981]" : "border-transparent text-gray-500 hover:text-gray-700",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 py-3">
          <Button
            onClick={openEdit}
            variant="outline"
            className="h-10 border-gray-200 text-gray-700 gap-2 rounded-lg px-4 text-[14px] font-bold"
          >
            <Edit2 className="w-4 h-4 text-gray-400" />
            Edit Club
          </Button>
          <div className="relative">
            <Button
              variant="outline"
              onClick={(e) => {
                if (activeDropdown) {
                  closeMoreMenu();
                } else {
                  if (closeTimeoutRef.current != null) {
                    window.clearTimeout(closeTimeoutRef.current);
                    closeTimeoutRef.current = null;
                  }
                  setActiveDropdown(true);
                  setMoreMenuAnchorEl(e.currentTarget);
                }
              }}
              className="h-10 border-gray-200 text-gray-700 gap-2 rounded-lg px-4 text-[14px] font-bold"
            >
              More Actions <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </Button>
            <FloatingMenu
              open={activeDropdown}
              anchorEl={moreMenuAnchorEl}
              onClose={closeMoreMenu}
              placement="bottom-end"
              className="w-60 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden"
            >
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    closeMoreMenu();
                    toast.success("Opening analytics");
                  }}
                >
                  <BarChart3 className="w-4 h-4 text-gray-500" />
                  View Analytics
                </button>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    closeMoreMenu();
                    const email = club?.email;
                    if (!email || email === "—") {
                      toast.error("No admin email found for this club");
                      return;
                    }
                    forgotPasswordRequest(email)
                      .then((r) => toast.success(r?.message || "Reset link sent"))
                      .catch((e: unknown) => toast.error(getErrorMessage(e) || "Failed to send reset email"));
                  }}
                >
                  <KeyRound className="w-4 h-4 text-gray-500" />
                  Reset Admin Password
                </button>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    closeMoreMenu();
                    setIsForceLogoutModalOpen(true);
                  }}
                >
                  <LogOut className="w-4 h-4 text-gray-500" />
                  Force Logout
                </button>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    closeMoreMenu();
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
                  }}
                >
                  <Download className="w-4 h-4 text-gray-500" />
                  Export Club Data
                </button>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-red-600 hover:bg-red-50"
                  onClick={() => {
                    closeMoreMenu();
                    setDeleteConfirmText("");
                    setIsDeleteModalOpen(true);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                  Delete Club
                </button>
            </FloatingMenu>
          </div>
        </div>
      </div>

      <div className="pt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-8 gap-6">
              <Card className="xl:col-span-3 border-none shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-start gap-5">
                    <div className="w-[75px] h-[75px] rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img src={club.logo} alt={club.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xl font-bold text-gray-900 truncate">{club.name}</p>
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-lg", activeStatusBadge)}>
                          {club.status}
                        </span>
                      </div>
                      <p className="text-[13px] text-gray-400 font-medium mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {club.location}
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
                        <div className="text-gray-400 font-medium">
                          Subscription: <span className="text-emerald-600 font-bold">{club.plan === "—" ? "—" : `${club.plan} Plan`}</span>
                        </div>
                        <div className="text-gray-400 font-medium">
                          Fee: <span className="text-gray-700 font-bold">{subscriptionMonthlyFee ? `₦${formatWithCommas(subscriptionMonthlyFee)}/mo` : "—"}</span>
                        </div>
                        <div className="text-gray-400 font-medium flex items-center gap-2 col-span-2">
                          <Phone className="w-3.5 h-3.5" />
                          <span className="text-gray-700 font-bold">{club.phone}</span>
                        </div>
                        <div className="text-gray-400 font-medium flex items-center gap-2 col-span-2">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="text-gray-700 font-bold">{club.email}</span>
                        </div>
                        <div className="text-gray-400 font-medium flex items-center gap-2 col-span-2">
                          <Globe className="w-3.5 h-3.5" />
                          <span className="text-gray-700 font-bold">{club.website}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="xl:col-span-1 border-none shadow-sm">
                <CardContent className="p-3">
                  <p className="text-xl font-bold text-gray-800">Club Admin</p>
                  <div className="mt-6 flex flex-col items-start text-left">
                    <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(club.email || club.id)}`}
                        alt={club.admin}
                        className="w-full h-full"
                      />
                    </div>
                    <div className="mt-3">
                      <p className="text-[15px] font-bold text-gray-900">{club.admin}</p>
                      <p className="text-[13px] text-gray-400 font-medium mt-0.5">{club.email}</p>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-[13px] text-gray-400 font-medium">
                      <Phone className="w-3.5 h-3.5" />
                      <span className="text-gray-700 font-bold">{club.phone}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center">
                      <Trophy className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="mt-4 text-[13px] text-gray-400 font-medium">Active Tournaments</p>
                  <p className="text-2xl font-bold text-gray-900 leading-none mt-1">
                    {clubStatsLoading ? "…" : String(clubStats?.activeTournaments ?? 0)}
                  </p>
                  <p className="text-[11px] text-gray-400 font-medium mt-4">
                    {clubStatsLoading ? "…" : String(clubStats?.ongoingTournaments ?? 0)} ongoing
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="mt-4 text-[13px] text-gray-400 font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 leading-none mt-1">
                    {clubStatsLoading ? "…" : formatNumber(`₦${clubStats?.totalRevenue ?? 0}`)}
                  </p>
                  <p
                    className={cn(
                      "text-[11px] font-bold mt-4 flex items-center gap-1",
                      revenueGrowthPct == null ? "text-gray-400" : revenueGrowthPct >= 0 ? "text-emerald-600" : "text-red-600",
                    )}
                  >
                    <ArrowUpRight className="w-3 h-3" />
                    {revenueGrowthPct == null
                      ? `₦${formatWithCommas(clubStats?.revenueThisMonth ?? 0)} this month`
                      : `${Math.abs(revenueGrowthPct).toFixed(1).replace(/\\.0$/, "")}% this month`}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="mt-4 text-[13px] text-gray-400 font-medium">Total Payments</p>
                  <p className="text-2xl font-bold text-gray-900 leading-none mt-1">
                    {clubStatsLoading ? "…" : String(clubStats?.paidRegistrations ?? 0)}
                  </p>
                  <p className="text-[11px] text-red-600 font-bold mt-4">
                    ₦{formatWithCommas(clubStats?.unpaidAmount ?? 0)} pending
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-2">
                  <CardTitle className="text-[16px] font-bold">Revenue Overview</CardTitle>
                  <SearchableSelect
                    value={revenueRange}
                    onValueChange={setRevenueRange}
                    options={["This Year", "Last Year"].map((v) => ({ value: v, label: v }))}
                    triggerClassName="h-9 bg-white text-[13px]"
                  />
                </CardHeader>
                <CardContent className="p-6 pt-2">
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueOverviewData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: "#9ca3af" }}
                          tickFormatter={(v) => `${Math.round(v / 1_000_000)}M`}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: "12px", border: "1px solid #f0f0f0", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}
                          formatter={(value: number | string | readonly (string | number)[] | undefined) => {
                            const raw = Array.isArray(value) ? value[0] : value;
                            return [`₦${Number(raw ?? 0).toLocaleString()}`, "Revenue"];
                          }}
                        />
                        <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} barSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader className="px-6 pt-6 pb-2">
                  <CardTitle className="text-[16px] font-bold">Subscription Details</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-2 space-y-3">
                  <div className="flex items-center justify-between text-[13px] font-medium text-gray-600">
                    <span>Plan</span>
                    <span className="font-bold text-gray-900">{club.plan === "—" ? "—" : `${club.plan} Plan`}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px] font-medium text-gray-600">
                    <span>Status</span>
                    <span className={cn("font-bold", club.status === "Active" ? "text-emerald-600" : club.status === "Suspended" ? "text-amber-600" : "text-red-600")}>
                      {club.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[13px] font-medium text-gray-600">
                    <span>Yearly Fee</span>
                    <span className="font-bold text-gray-900">{subscriptionMonthlyFee ? `₦${formatWithCommas(subscriptionMonthlyFee * 12)}` : "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px] font-medium text-gray-600">
                    <span>Billing Cycle</span>
                    <span className="font-bold text-gray-900">Yearly</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px] font-medium text-gray-600">
                    <span>Next Billing Date</span>
                    <span className="font-bold text-gray-900">{nextBillingDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px] font-medium text-gray-600">
                    <span>Payment Method</span>
                    <span className="font-bold text-gray-900">•••• 4242</span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActiveTab("subscription");
                      toast.success("Opening subscription");
                    }}
                    className="w-full mt-4 h-10 rounded-lg border-gray-200 font-bold text-[13px]"
                  >
                    Manage Subscription
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-2">
                  <CardTitle className="text-[16px] font-bold">Recent Tournaments</CardTitle>
                  <Button
                    variant="link"
                    onClick={() => setActiveTab("tournaments")}
                    className="text-blue-600 p-0 h-auto font-bold text-[13px] flex items-center gap-2 no-underline hover:no-underline"
                  >
                    View All
                  </Button>
                </CardHeader>
                <CardContent className="p-3 pt-2 space-y-4">
                  {upcomingTournaments.length ? (
                    upcomingTournaments.map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", t.iconBg)}>
                            <t.Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-gray-900 truncate">{t.name}</p>
                            <p className="text-[12px] text-gray-500 font-medium">{t.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn("text-[11px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap", t.statusClass)}>
                            {t.statusLabel}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[13px] text-gray-400 font-medium">No tournaments</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-2">
                  <CardTitle className="text-[16px] font-bold">Recent Payments</CardTitle>
                  <Button
                    variant="link"
                    onClick={() => setActiveTab("payments")}
                    className="text-blue-600 p-0 h-auto font-bold text-[13px] flex items-center gap-2 no-underline hover:no-underline"
                  >
                    View All
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Description</th>
                          <th className="px-6 py-3 text-right">Amount</th>
                          <th className="px-6 py-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {recentPayments.length ? (
                          recentPayments.map((r) => (
                            <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-3 text-[12px] text-gray-500 font-medium whitespace-nowrap">
                                {formatJoinedDate(r.registeredAt)}
                              </td>
                              <td className="px-6 py-3 text-[12px] text-gray-700 font-bold">{r.tournament.name}</td>
                              <td className="px-6 py-3 text-[12px] text-gray-900 font-bold text-right whitespace-nowrap">
                                {r.tournament.entryFee != null ? `₦${formatWithCommas(Math.round(r.tournament.entryFee))}` : "—"}
                              </td>
                              <td className="px-6 py-3 text-right">
                                <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-emerald-50 text-emerald-600">
                                  Paid
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-10 text-center text-gray-400 font-medium text-[13px]">
                              No payments
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-2">
                  <CardTitle className="text-[16px] font-bold">Club Activity</CardTitle>
                  <Button
                    variant="link"
                    onClick={() => toast.success("Showing activity")}
                    className="text-blue-600 p-0 h-auto font-bold text-[13px] flex items-center gap-2 no-underline hover:no-underline"
                  >
                    View All
                  </Button>
                </CardHeader>
                <CardContent className="p-3 pt-2 space-y-4">
                  {activityFeed.length ? (
                    activityFeed.map((a) => (
                      <div key={a.key} className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={cn(
                              "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                              a.kind === "payment" ? "bg-emerald-50 text-emerald-600" : a.kind === "tournament" ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600",
                            )}
                          >
                            {a.kind === "payment" ? <CreditCard className="w-4 h-4" /> : a.kind === "tournament" ? <Trophy className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-gray-900 truncate">{a.title}</p>
                            <p className="text-[12px] text-gray-400 font-medium truncate">{a.subtitle}</p>
                          </div>
                        </div>
                        <p className="text-[12px] text-gray-400 font-medium whitespace-nowrap">{timeAgoShort(a.time)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[13px] text-gray-400 font-medium">No activity</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "tournaments" && (
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-bold">Tournaments</CardTitle>
              <Button className="h-10 bg-[#10b981] hover:bg-[#0da673] border border-emerald-600/30 text-white rounded-lg px-4 font-bold">
                Add Tournament
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {tournamentsLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50 text-[12px] font-bold text-gray-400 uppercase tracking-wider">
                          <th className="px-6 py-4">Tournament</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Dates</th>
                          <th className="px-6 py-4">Players</th>
                          <th className="px-6 py-4 text-right">Entry Fee</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {tournaments.length > 0 ? (
                          tournamentsPageItems.map((t) => (
                            <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4 text-[14px] font-bold text-gray-800">{t.name}</td>
                              <td className="px-6 py-4">
                                <span className={cn(
                                  "text-[11px] font-bold px-2.5 py-1 rounded-lg",
                                  t.status === "ONGOING" ? "bg-emerald-50 text-emerald-600" :
                                  t.status === "REGISTRATION_OPEN" ? "bg-blue-50 text-blue-600" :
                                  t.status === "COMPLETED" ? "bg-violet-50 text-violet-600" :
                                  t.status === "DRAFT" ? "bg-amber-50 text-amber-600" :
                                  "bg-gray-100 text-gray-500"
                                )}>
                                  {t.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-[14px] text-gray-500 whitespace-nowrap">
                                {formatJoinedDate(t.startDate)}{t.endDate ? ` - ${formatJoinedDate(t.endDate)}` : ""}
                              </td>
                              <td className="px-6 py-4 text-[14px] text-gray-500">
                                {formatWithCommas(t._count?.registrations ?? 0)}
                                {t.maxPlayers ? ` / ${formatWithCommas(t.maxPlayers)}` : ""}
                              </td>
                              <td className="px-6 py-4 text-[14px] font-bold text-gray-900 text-right">
                                {t.entryFee != null ? `₦${formatWithCommas(Math.round(t.entryFee))}` : "—"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">
                              No tournaments found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {tournaments.length > 0 && tournamentsTotalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 bg-white">
                      <Pagination
                        currentPage={tournamentsPageSafe}
                        totalPages={tournamentsTotalPages}
                        onPageChange={setTournamentsPage}
                        className="justify-center"
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "payments" && (
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-bold">Payments</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {registrationsLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50 text-[12px] font-bold text-gray-400 uppercase tracking-wider">
                          <th className="px-6 py-4">Member</th>
                          <th className="px-6 py-4">Tournament</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {registrations.length > 0 ? (
                          paymentsPageItems.map((r) => (
                            <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4 text-[14px] font-bold text-gray-800">
                                {fullName(r.user.firstName, r.user.lastName)}
                              </td>
                              <td className="px-6 py-4 text-[14px] text-gray-500">{r.tournament.name}</td>
                              <td className="px-6 py-4">
                                <span className={cn(
                                  "text-[11px] font-bold px-2.5 py-1 rounded-lg",
                                  r.paymentStatus === "PAID" ? "bg-emerald-50 text-emerald-600" :
                                  r.paymentStatus === "UNPAID" ? "bg-amber-50 text-amber-600" :
                                  "bg-gray-100 text-gray-500"
                                )}>
                                  {r.paymentStatus}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-[14px] text-gray-500 whitespace-nowrap">{formatJoinedDate(r.registeredAt)}</td>
                              <td className="px-6 py-4 text-[14px] font-bold text-gray-900 text-right">
                                {r.tournament.entryFee != null
                                  ? `₦${formatWithCommas(Math.round(r.tournament.entryFee))}`
                                  : "—"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">
                              No payments found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {registrations.length > 0 && paymentsTotalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 bg-white">
                      <Pagination
                        currentPage={paymentsPageSafe}
                        totalPages={paymentsTotalPages}
                        onPageChange={setPaymentsPage}
                        className="justify-center"
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Club Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">Club Name</p>
                    <p className="text-[14px] font-bold text-gray-900 mt-1">{club.name}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">Plan</p>
                    <p className="text-[14px] font-bold text-emerald-600 mt-1">{club.plan} Plan</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">Address</p>
                    <p className="text-[14px] font-bold text-gray-900 mt-1">{club.location}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">Courses</p>
                    <p className="text-[14px] font-bold text-gray-900 mt-1">{club.courses}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Primary Admin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">Name</p>
                  <p className="text-[14px] font-bold text-gray-900 mt-1">{club.admin}</p>
                </div>
                <div>
                  <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">Email</p>
                  <p className="text-[14px] font-bold text-gray-900 mt-1">{club.email}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "subscription" && (
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-bold">Subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[14px] font-medium text-gray-600">
                <div className="flex items-center justify-between border border-gray-100 rounded-xl p-4 bg-white">
                  <span>Plan</span>
                  <span className="font-bold text-gray-900">{club.plan === "—" ? "—" : `${club.plan} Plan`}</span>
                </div>
                <div className="flex items-center justify-between border border-gray-100 rounded-xl p-4 bg-white">
                  <span>Status</span>
                  <span className={cn("font-bold", club.status === "Active" ? "text-emerald-600" : club.status === "Suspended" ? "text-amber-600" : "text-red-600")}>
                    {club.status}
                  </span>
                </div>
                <div className="flex items-center justify-between border border-gray-100 rounded-xl p-4 bg-white">
                  <span>Monthly Fee</span>
                  <span className="font-bold text-gray-900">{subscriptionMonthlyFee ? `₦${formatWithCommas(subscriptionMonthlyFee)}` : "—"}</span>
                </div>
                <div className="flex items-center justify-between border border-gray-100 rounded-xl p-4 bg-white">
                  <span>Next Billing Date</span>
                  <span className="font-bold text-gray-900">{nextBillingDate}</span>
                </div>
              </div>
              <Button variant="outline" className="h-11 rounded-lg border-gray-200 font-bold text-[14px] w-fit">
                Manage Subscription
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === "audit-logs" && (
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-bold">Audit Logs</CardTitle>
            </CardHeader>
            <CardContent className="text-[14px] text-gray-500 font-medium">
              No audit logs available.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
