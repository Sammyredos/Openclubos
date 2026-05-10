"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Trophy,
  PieChart,
  Settings,
  LogOut,
  Building2,
  CalendarDays,
  ShieldCheck,
  MonitorDot,
  CheckSquare,
  BarChart3,
  FileText,
  Activity,
  Bell,
  ChevronDown,
} from "lucide-react";
import { Icons } from "@/components/ui/icons";

import { Skeleton } from "@/components/ui/skeleton";

const SUPER_ADMIN_GROUPS = [
  {
    items: [
      { name: "Dashboard", href: "/super-admin/dashboard", icon: LayoutDashboard },
      { name: "Organizers", href: "/super-admin/organizers", icon: Building2 },
      { name: "Subscriptions", href: "/super-admin/subscriptions", icon: ShieldCheck },
      { name: "Users", href: "/super-admin/users", icon: Users },
    ],
  },
  {
    items: [
      { name: "Tournaments", href: "/super-admin/tournaments", icon: CalendarDays },
      { name: "Payments", href: "/super-admin/payments", icon: CreditCard },
    ],
  },
  {
    items: [
      { name: "Analytics", href: "/super-admin/analytics", icon: PieChart },
    ],
  },
  {
    items: [
      { name: "System", href: "/super-admin/system", icon: MonitorDot },
      { name: "Settings", href: "/super-admin/settings", icon: Settings },
    ],
  },
];

const CLUB_ADMIN_GROUPS = [
  {
    items: [
      { name: "Dashboard", href: "/organizer-admin/dashboard", icon: LayoutDashboard },
      { name: "Members", href: "/organizer-admin/members", icon: Users },
    ],
  },
  {
    items: [
      { name: "Tournaments", href: "/organizer-admin/tournaments", icon: Trophy },
      { name: "Registrations", href: "/organizer-admin/registrations", icon: CheckSquare },
      { name: "Scoring", href: "/organizer-admin/scoring", icon: Activity },
    ],
  },
  {
    items: [
      { name: "Leaderboard", href: "/organizer-admin/leaderboard", icon: BarChart3 },
      { name: "Payments", href: "/organizer-admin/payments", icon: CreditCard },
      { name: "Reports", href: "/organizer-admin/reports", icon: FileText },
    ],
  },
  {
    items: [
      { name: "Handicaps", href: "/organizer-admin/handicaps", icon: ShieldCheck },
      { name: "Notifications", href: "/organizer-admin/notifications", icon: Bell },
      { name: "Settings", href: "/organizer-admin/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user, isLoading } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="flex flex-col h-full bg-[#1a2332] text-white w-72 flex-shrink-0 border-r border-white/5">
        <div className="p-8 h-24 flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
          <Skeleton className="h-6 w-32 bg-white/10" />
        </div>
        <div className="flex-1 px-6 py-4 space-y-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-5 w-5 bg-white/10" />
              <Skeleton className="h-4 w-24 bg-white/10" />
            </div>
          ))}
        </div>
        <div className="px-4 py-6 border-t border-white/10 bg-[#161e2b] space-y-4">
          <div className="flex items-center gap-4 px-4">
            <Skeleton className="h-11 w-11 rounded-full bg-white/10" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 bg-white/10" />
              <Skeleton className="h-3 w-32 bg-white/10" />
            </div>
          </div>
          <div className="px-4 pt-4 border-t border-white/5">
            <Skeleton className="h-12 w-full rounded-xl bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  const sidebarGroups = user.role === 'SUPER_ADMIN' ? SUPER_ADMIN_GROUPS : CLUB_ADMIN_GROUPS;

  return (
    <div className="flex flex-col h-full bg-[#1a2332] text-white w-72 flex-shrink-0 border-r border-white/5">
      <div className="p-8 flex flex-col gap-4">
        {user?.role === 'CLUB_ADMIN' ? (
          <div className="flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="bg-[#10b981] p-2.5 rounded-full shadow-lg shadow-emerald-500/20">
                <Icons.logo className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight truncate max-w-[160px]">
                {user?.clubId ? "Oakwood Organizer" : "Select Organizer"}
              </span>
            </div>
            <ChevronDown className="h-4.5 w-4.5 text-gray-400 group-hover:text-white transition-colors" />
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="bg-[#10b981] p-2.5 rounded-full shadow-lg shadow-emerald-500/20">
              <Icons.logo className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-bold tracking-tight text-white">OpenClub</span>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 py-2 space-y-4 overflow-y-auto scrollbar-hide">
        {sidebarGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-0.5">
            {group.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 px-5 py-3 rounded-lg text-[16px] font-medium transition-colors duration-200 group border",
                    isActive
                      ? "bg-[#10b981] text-white border-emerald-400/30"
                      : "text-gray-400 border-transparent hover:text-white hover:bg-white/5 hover:border-white/10"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                  )} />
                  {item.name}
                </Link>
              );
            })}
            {groupIndex < sidebarGroups.length - 1 && (
              <div className="mx-4 mt-4 border-t border-white/5" />
            )}
          </div>
        ))}
      </nav>

      <div className="px-4 py-6 border-t border-white/10 bg-[#161e2b]">
        <div className="flex items-center gap-4 px-4 py-3 mb-4">
          <div className="h-12 w-12 rounded-full border-2 border-emerald-500/30 p-0.5 flex-shrink-0 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt="User"
              className="h-full w-full rounded-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-bold text-white truncate">{user?.name || "Admin User"}</p>
            <p className="text-[13px] text-gray-500 truncate">{user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Organizer Admin'}</p>
          </div>
        </div>
        <div className="px-4 border-t border-white/5 pt-4">
          <button 
            onClick={logout}
            className="flex items-center gap-4 w-full px-4 py-3 text-[16px] font-bold text-red-400 hover:text-red-500 bg-red-500/5 hover:bg-red-500/10 rounded-xl transition-all group border border-red-500/10"
          >
            <LogOut className="h-5.5 w-5.5 text-red-400 group-hover:text-red-500" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
