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
  Ban,
  CheckCircle2,
  Trash2,
  KeyRound,
  BarChart3,
  Download,
  LogIn,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { cn, formatWithCommas, formatNumber } from "@/lib/utils";
import { activateClub, deleteClub, getClub, suspendClub, updateClub } from "@/lib/api/clubs";
import { getMembers } from "@/lib/api/members";
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "members", label: "Members" },
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
  _count?: { users: number; tournaments: number; courses: number };
  users?: Array<{ id: string; email: string; firstName: string | null; lastName: string | null }>;
};

type ApiMember = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  handicap: number;
  createdAt: string;
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

function formatJoinedDate(iso: string) {
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
  return fmt.format(new Date(iso));
}

function fullName(firstName: string | null, lastName: string | null) {
  const name = `${firstName || ""} ${lastName || ""}`.trim();
  return name || "—";
}

function toClubViewModel(c: ApiClub) {
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
    members: c._count?.users ?? 0,
    tournaments: c._count?.tournaments ?? 0,
    email: adminEmail,
    phone: "—",
    website: "—",
    admin: adminName,
    createdAtISO: c.createdAt,
    courses: c._count?.courses ?? 0,
  };
}

export default function ClubDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const [club, setClub] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [members, setMembers] = React.useState<ApiMember[]>([]);
  const [membersTotal, setMembersTotal] = React.useState(0);
  const [membersLoading, setMembersLoading] = React.useState(true);

  const [tournaments, setTournaments] = React.useState<ApiTournament[]>([]);
  const [tournamentsLoading, setTournamentsLoading] = React.useState(true);

  const [registrations, setRegistrations] = React.useState<ApiRegistration[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = React.useState(true);

  const PAGE_SIZE = 10;
  const [membersPage, setMembersPage] = React.useState(1);
  const [tournamentsPage, setTournamentsPage] = React.useState(1);
  const [paymentsPage, setPaymentsPage] = React.useState(1);

  const [topRange, setTopRange] = useState("This Year");
  const [revenueRange, setRevenueRange] = useState("This Year");
  const [activeDropdown, setActiveDropdown] = useState(false);
  const [mutating, setMutating] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<"suspend" | "activate">("suspend");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [editPlan, setEditPlan] = useState("Pro");
  const [editStatus, setEditStatus] = useState<"Active" | "Suspended" | "Expired">("Active");
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
  }

  React.useEffect(() => {
    async function fetchClubData() {
      try {
        setLoading(true);
        if (!clubId) throw new Error("Club not found");
        const data = (await getClub(clubId)) as ApiClub;
        const vm = toClubViewModel(data);
        setClub(vm);

        setMembersLoading(true);
        setTournamentsLoading(true);
        setRegistrationsLoading(true);

        const [membersRes, tournamentsRes, registrationsRes] = await Promise.all([
          getMembers({ clubId, take: 500 }),
          getTournaments({ clubId }),
          getRegistrations({ clubId, take: 500 }),
        ]);

        setMembers((membersRes?.items ?? []) as ApiMember[]);
        setMembersTotal(membersRes?.total ?? 0);
        setTournaments((Array.isArray(tournamentsRes) ? tournamentsRes : []) as ApiTournament[]);
        setRegistrations((Array.isArray(registrationsRes) ? registrationsRes : []) as ApiRegistration[]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
        setMembersLoading(false);
        setTournamentsLoading(false);
        setRegistrationsLoading(false);
      }
    }
    fetchClubData();
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

  const activeTournaments = tournaments.filter((t) =>
    t.status === "ONGOING" || t.status === "REGISTRATION_OPEN"
  ).length;

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const monthlyRevenue = registrations.reduce((sum, r) => {
    if (r.paymentStatus !== "PAID") return sum;
    const d = new Date(r.registeredAt);
    if (d.getFullYear() !== year || d.getMonth() !== month) return sum;
    return sum + (r.tournament.entryFee || 0);
  }, 0);

  const totalPaidPayments = registrations.filter((r) => r.paymentStatus === "PAID").length;
  const totalRevenueAllTime = registrations.reduce((sum, r) => {
    if (r.paymentStatus !== "PAID") return sum;
    return sum + (r.tournament.entryFee || 0);
  }, 0);

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
    const items: Array<{ key: string; title: string; subtitle: string; time: string; kind: "member" | "payment" | "tournament" }> = [];
    for (const m of members
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)) {
      items.push({
        key: `m-${m.id}`,
        title: "New member registered",
        subtitle: `${m.firstName} ${m.lastName}`.trim() || m.email,
        time: m.createdAt,
        kind: "member",
      });
    }
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
    const ts = new Date(iso).getTime();
    if (Number.isNaN(ts)) return "—";
    const diffMinutes = Math.floor((Date.now() - ts) / 60000);
    if (diffMinutes < 0) return "just now";
    if (diffMinutes < 1) return "just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  const openEdit = () => {
    setEditPlan(club.plan || "Pro");
    setEditStatus((club.status as any) || "Active");
    setEditName(club.name || "");
    setEditLocation(club.location || "");
    setEditAdminName(club.admin || "");
    setEditAdminEmail(club.email || "");
    setIsEditModalOpen(true);
  };

  const confirmStatusChange = () => {
    if (!clubId) return;
    setMutating(true);
    const op = statusAction === "activate" ? activateClub : suspendClub;
    op(clubId)
      .then(() => {
        toast.success(statusAction === "activate" ? "Club activated" : "Club suspended");
        setIsStatusModalOpen(false);
        return reloadClubData();
      })
      .catch((e: any) => toast.error(e?.message || "Failed to update club status"))
      .finally(() => setMutating(false));
  };

  const confirmDelete = () => {
    if (!clubId) return;
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") return;
    setMutating(true);
    deleteClub(clubId)
      .then(() => {
        toast.success("Club deleted");
        setIsDeleteModalOpen(false);
        router.push("/super-admin/clubs");
      })
      .catch((e: any) => toast.error(e?.message || "Failed to delete club"))
      .finally(() => setMutating(false));
  };

  const saveEdit = () => {
    if (!clubId) return;
    const plan = editPlan === "Pro" ? "PRO" : editPlan === "Basic" ? "BASIC" : undefined;
    const status = editStatus.toUpperCase() as "ACTIVE" | "SUSPENDED" | "EXPIRED";
    setMutating(true);
    updateClub(clubId, {
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
        return reloadClubData();
      })
      .catch((e: any) => toast.error(e?.message || "Failed to update club"))
      .finally(() => setMutating(false));
  };

  const membersTotalPages = Math.max(1, Math.ceil(members.length / PAGE_SIZE));
  const tournamentsTotalPages = Math.max(1, Math.ceil(tournaments.length / PAGE_SIZE));
  const paymentsTotalPages = Math.max(1, Math.ceil(registrations.length / PAGE_SIZE));

  const membersPageSafe = Math.min(membersPage, membersTotalPages);
  const tournamentsPageSafe = Math.min(tournamentsPage, tournamentsTotalPages);
  const paymentsPageSafe = Math.min(paymentsPage, paymentsTotalPages);

  const membersPageItems = members.slice((membersPageSafe - 1) * PAGE_SIZE, membersPageSafe * PAGE_SIZE);
  const tournamentsPageItems = tournaments.slice(
    (tournamentsPageSafe - 1) * PAGE_SIZE,
    tournamentsPageSafe * PAGE_SIZE
  );
  const paymentsPageItems = registrations.slice((paymentsPageSafe - 1) * PAGE_SIZE, paymentsPageSafe * PAGE_SIZE);

  const membersThisMonth = members.filter((m) => {
    const d = new Date(m.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const ongoingCount = tournaments.filter((t) => t.status === "ONGOING").length;
  const pendingAmount = registrations.reduce((sum, r) => {
    if (r.paymentStatus !== "UNPAID") return sum;
    return sum + (r.tournament.entryFee || 0);
  }, 0);
  const lastMonthRevenue = registrations.reduce((sum, r) => {
    if (r.paymentStatus !== "PAID") return sum;
    const d = new Date(r.registeredAt);
    const lastMonth = (month + 11) % 12;
    const lastYear = month === 0 ? year - 1 : year;
    if (d.getFullYear() !== lastYear || d.getMonth() !== lastMonth) return sum;
    return sum + (r.tournament.entryFee || 0);
  }, 0);
  const revenueGrowthPct =
    lastMonthRevenue > 0 ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : null;

  const memberYear = topRange === "This Year" ? year : year - 1;
  const revenueYear = revenueRange === "This Year" ? year : year - 1;
  const memberGrowthData = (() => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const counts = months.map((m) => ({ month: m, value: 0 }));
    for (const m of members) {
      const d = new Date(m.createdAt);
      if (d.getFullYear() !== memberYear) continue;
      counts[d.getMonth()].value += 1;
    }
    let running = 0;
    return counts.map((c) => {
      running += c.value;
      return { month: c.month, value: running };
    });
  })();

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
              disabled={mutating}
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
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label className="font-bold text-gray-700">Status</Label>
              <SearchableSelect
                value={editStatus}
                onValueChange={(v) => setEditStatus(v as any)}
                options={["Active", "Suspended", "Expired"].map((v) => ({ value: v, label: v }))}
                triggerClassName="h-12 bg-white font-medium rounded-xl"
                placeholder="Select status..."
              />
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
        </div>
      </Modal>

      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={statusAction === "activate" ? "Activate Club" : "Suspend Club"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)} className="rounded-lg font-bold">
              Cancel
            </Button>
            <Button
              onClick={confirmStatusChange}
              disabled={mutating}
              className={cn(
                "rounded-lg font-bold px-8 text-white",
                statusAction === "activate"
                  ? "bg-[#10b981] hover:bg-[#0da673] border border-emerald-600/30"
                  : "bg-red-600 hover:bg-red-700 border border-red-600/30",
              )}
            >
              {statusAction === "activate" ? "Activate Club" : "Suspend Club"}
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-[14px] text-gray-600 font-medium">
          {statusAction === "activate"
            ? "This will restore access for the club and its members."
            : "This will disable access for the club and may suspend associated users."}
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
            onClick={() => toast.success("Logging in as club admin")}
            className="h-10 bg-[#10b981] hover:bg-[#0da673] border border-emerald-600/30 text-white gap-2 rounded-lg px-4 text-[14px] font-bold"
          >
            <LogIn className="w-4 h-4" />
            Login as Club Admin
          </Button>
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
              onClick={() => setActiveDropdown((v) => !v)}
              className="h-10 border-gray-200 text-gray-700 gap-2 rounded-lg px-4 text-[14px] font-bold"
            >
              More Actions <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </Button>
            {activeDropdown && (
              <div className="absolute right-0 top-12 w-60 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden z-40">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setActiveDropdown(false);
                    toast.success("Opening analytics");
                  }}
                >
                  <BarChart3 className="w-4 h-4 text-gray-500" />
                  View Analytics
                </button>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setActiveDropdown(false);
                    const email = club?.email;
                    if (!email || email === "—") {
                      toast.error("No admin email found for this club");
                      return;
                    }
                    forgotPasswordRequest(email)
                      .then((r) => toast.success(r?.message || "Reset link sent"))
                      .catch((e: any) => toast.error(e?.message || "Failed to send reset email"));
                  }}
                >
                  <KeyRound className="w-4 h-4 text-gray-500" />
                  Reset Admin Password
                </button>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setActiveDropdown(false);
                    const action = club.status === "Suspended" ? "activate" : "suspend";
                    setStatusAction(action);
                    setIsStatusModalOpen(true);
                  }}
                >
                  {club.status === "Suspended" ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Activate Club
                    </>
                  ) : (
                    <>
                      <Ban className="w-4 h-4 text-red-600" />
                      Suspend Club
                    </>
                  )}
                </button>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setActiveDropdown(false);
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
                    setActiveDropdown(false);
                    setDeleteConfirmText("");
                    setIsDeleteModalOpen(true);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                  Delete Club
                </button>
              </div>
            )}
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
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600">
                          Active
                        </span>
                      </div>
                      <p className="text-[13px] text-gray-400 font-medium mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        Lagos, Nigeria
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
                          <span className="text-gray-700 font-bold">+234 801 234 5678</span>
                        </div>
                        <div className="text-gray-400 font-medium flex items-center gap-2 col-span-2">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="text-gray-700 font-bold">info@ikoyigc.com</span>
                        </div>
                        <div className="text-gray-400 font-medium flex items-center gap-2 col-span-2">
                          <Globe className="w-3.5 h-3.5" />
                          <span className="text-gray-700 font-bold">www.ikoyigc.com</span>
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
                      <p className="text-[15px] font-bold text-gray-900">John Adeniyi</p>
                      <p className="text-[13px] text-gray-400 font-medium mt-0.5">admin@ikoyigc.com</p>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-[13px] text-gray-400 font-medium">
                      <Phone className="w-3.5 h-3.5" />
                      <span className="text-gray-700 font-bold">+234 803 111 2233</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="mt-4 text-[13px] text-gray-400 font-medium">Total Members</p>
                  <p className="text-2xl font-bold text-gray-900 leading-none mt-1">320</p>
                  <p className="text-[11px] text-emerald-600 font-bold mt-4 flex items-center gap-1">
                    + 12 this month
                  </p>
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
                  <p className="text-2xl font-bold text-gray-900 leading-none mt-1">8</p>
                  <p className="text-[11px] text-gray-400 font-medium mt-4">2 ongoing</p>
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
                  <p className="text-2xl font-bold text-gray-900 leading-none mt-1">{formatNumber(4250000)}</p>
                  <p className="text-[11px] text-emerald-600 font-bold mt-4 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    15.6% this month
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
                  <p className="text-2xl font-bold text-gray-900 leading-none mt-1">156</p>
                  <p className="text-[11px] text-red-600 font-bold mt-4">₦620,000 pending</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-2">
                  <CardTitle className="text-[16px] font-bold">Member Growth</CardTitle>
                  <SearchableSelect
                    value={topRange}
                    onValueChange={setTopRange}
                    options={["This Year", "Last Year"].map((v) => ({ value: v, label: v }))}
                    triggerClassName="h-9 bg-white text-[13px]"
                  />
                </CardHeader>
                <CardContent className="p-6 pt-2">
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={memberGrowthData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} />
                        <Tooltip
                          contentStyle={{ borderRadius: "12px", border: "1px solid #f0f0f0", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}
                        />
                        <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

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
                          formatter={(value: any) => [`₦${Number(value).toLocaleString()}`, "Revenue"]}
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

        {activeTab === "members" && (
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-bold">Members</CardTitle>
              <Button className="h-10 bg-[#10b981] hover:bg-[#0da673] border border-emerald-600/30 text-white rounded-lg px-4 font-bold">
                Add Member
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {membersLoading ? (
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
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Payment</th>
                          <th className="px-6 py-4">Handicap</th>
                          <th className="px-6 py-4">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {members.length > 0 ? (
                            membersPageItems.map((m) => {
                              const memberRegs = registrations.filter(r => r.user.email === m.email);
                              const isPaid = memberRegs.some(r => r.paymentStatus === "PAID");
                              
                              return (
                                <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="px-6 py-4 text-[14px] font-bold text-gray-800">
                                    {m.firstName} {m.lastName}
                                  </td>
                                  <td className="px-6 py-4 text-[14px] text-gray-500">{m.email}</td>
                                  <td className="px-6 py-4">
                                    <span className={cn(
                                      "text-[11px] font-bold px-2.5 py-1 rounded-lg",
                                      m.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600" :
                                      m.status === "SUSPENDED" ? "bg-amber-50 text-amber-600" :
                                      "bg-red-50 text-red-600"
                                    )}>
                                      {m.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={cn(
                                      "text-[10px] font-bold px-2 py-0.5 rounded-lg",
                                      isPaid ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                    )}>
                                      {isPaid ? "PAID" : "UNPAID"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-[14px] text-gray-500">{m.handicap}</td>
                                  <td className="px-6 py-4 text-[14px] text-gray-500 whitespace-nowrap">{formatJoinedDate(m.createdAt)}</td>
                                </tr>
                              );
                            })
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">
                              No members found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {members.length > 0 && membersTotalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 bg-white">
                      <Pagination
                        currentPage={membersPageSafe}
                        totalPages={membersTotalPages}
                        onPageChange={setMembersPage}
                        className="justify-center"
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
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
