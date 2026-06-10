"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn, getAvatarUrl } from "@/lib/utils";
import {
  Home,
  User,
  Flag,
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
      { name: "Overview", href: "/super-admin/dashboard", icon: Home },
      { name: "Organizers", href: "/super-admin/organizers", icon: Building2 },
      { name: "Subscriptions", href: "/super-admin/subscriptions", icon: CreditCard },
      { name: "Users", href: "/super-admin/users", icon: User },
      { name: "Golf Courses", href: "/super-admin/golf-courses", icon: Flag },
    ],
  },
  {
    items: [
      { name: "Tournaments", href: "/super-admin/tournaments", icon: Trophy },
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
      { name: "System", href: "/super-admin/system", icon: Settings },
      { name: "Settings", href: "/super-admin/settings", icon: Settings },
    ],
  },
];

const CLUB_ADMIN_GROUPS = [
  {
    items: [
      { name: "Dashboard", href: "/organizer-admin/dashboard", icon: Home },
      { name: "Users", href: "/organizer-admin/members", icon: User },
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
      <div className="flex flex-col h-full bg-white text-gray-900 w-72 flex-shrink-0 border-r border-[#e7e7e7]">
        <div className="p-8 h-24 flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full bg-gray-100" />
          <Skeleton className="h-6 w-32 bg-gray-100" />
        </div>
        <div className="flex-1 px-6 py-4 space-y-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-5 w-5 bg-gray-100" />
              <Skeleton className="h-4 w-24 bg-gray-100" />
            </div>
          ))}
        </div>
        <div className="px-4 py-6 border-t border-[#e7e7e7] bg-white space-y-4">
          <div className="flex items-center gap-4 px-4">
            <Skeleton className="h-11 w-11 rounded-full bg-gray-100" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 bg-gray-100" />
              <Skeleton className="h-3 w-32 bg-gray-100" />
            </div>
          </div>
          <div className="px-4 pt-4 border-t border-[#e7e7e7]">
            <Skeleton className="h-12 w-full rounded-xl bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  const sidebarGroups = user.role === 'SUPER_ADMIN' ? SUPER_ADMIN_GROUPS : CLUB_ADMIN_GROUPS;

  return (
    <div className="flex flex-col h-full bg-white text-gray-900 w-72 flex-shrink-0 border-r border-[#e7e7e7]">
      <div className="p-8 flex flex-col gap-4">
        {user?.role === 'CLUB_ADMIN' ? (
          <div className="flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="bg-[#10b981] p-2.5 rounded-full shadow-lg shadow-emerald-500/20">
                <Icons.logo className="h-7 w-7 text-white" />
              </div>
              <span className="text-[16px] font-bold text-gray-900 tracking-tight truncate max-w-[160px]">
                {user?.clubId ? "Oakwood Organizer" : "Select Organizer"}
              </span>
            </div>
            <ChevronDown className="h-4.5 w-4.5 text-gray-400 group-hover:text-gray-900 transition-colors" />
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="bg-[#10b981] p-2.5 rounded-full shadow-lg shadow-emerald-500/20">
              <Icons.logo className="h-8 w-8 text-white" />
            </div>
            <span className="text-[16px] font-bold tracking-tight text-gray-900">OpenClub</span>
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
                    "flex items-center gap-4 px-4 py-2.5 rounded-lg text-[14px] font-medium transition-colors duration-200 group border",
                    isActive
                      ? "bg-[#f4fdf8] text-[#0da673] border-[#10b981] shadow-sm"
                      : "text-gray-500 border-transparent hover:text-gray-900 hover:bg-gray-50 hover:border-[#e7e7e7]"
                  )}
                >
                  <item.icon className={cn(
                    "h-4.5 w-4.5 transition-colors",
                    isActive ? "text-[#0da673]" : "text-gray-400 group-hover:text-gray-900"
                  )} />
                  {item.name}
                </Link>
              );
            })}
            {groupIndex < sidebarGroups.length - 1 && (
              <div className="mx-4 mt-4 border-t border-[#e7e7e7]" />
            )}
          </div>
        ))}
      </nav>

      <div className="px-4 py-6 border-t border-[#e7e7e7] bg-gray-50/50">
        <div className="flex items-center gap-4 px-4 py-3 mb-4">
          <div className="h-12 w-12 rounded-full border-2 border-[#e7e7e7] p-0.5 flex-shrink-0 flex items-center justify-center overflow-hidden">
            <div className="h-full w-full rounded-full bg-gray-100 overflow-hidden">
              <img src={getAvatarUrl(user || undefined)} alt={user?.name || "User Avatar"} className="h-full w-full object-cover" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-bold text-gray-900 truncate">{user?.name || "Admin User"}</p>
            <p className="text-[13px] text-gray-500 truncate">{user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Organizer Admin'}</p>
          </div>
        </div>
        <div className="px-4 border-t border-[#e7e7e7] pt-4">
          <button 
            onClick={logout}
            className="flex items-center gap-4 w-full px-4 py-3 text-[16px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-all group border border-red-100"
          >
            <LogOut className="h-5.5 w-5.5 text-red-500 group-hover:text-red-600" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
