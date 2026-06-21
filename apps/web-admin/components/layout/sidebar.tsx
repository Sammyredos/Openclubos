"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn, getAvatarUrl } from "@/lib/utils";
import {
  HomeIcon as Home,
  UserIcon as User,
  CreditCardIcon as CreditCard,
  TrophyIcon as Trophy,
  ChartPieIcon as PieChart,
  Cog8ToothIcon as Settings,
  ServerStackIcon as SystemIcon,
  BuildingOfficeIcon as Building2,
  MapIcon as Flag,
  ClipboardDocumentCheckIcon as CheckSquare,
  ChartBarIcon as BarChart3,
  DocumentTextIcon as FileText,
  ClipboardDocumentListIcon as Activity,
  ShieldCheckIcon as ShieldCheck,
  BellIcon as Bell,
  ChevronDownIcon as ChevronDown
} from "@heroicons/react/24/solid";
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
      { name: "System", href: "/super-admin/system", icon: SystemIcon },
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
      <div className="flex flex-col h-full bg-white w-[218px] flex-shrink-0 border-r border-[#e1efe5] relative">
        <div className="p-8 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-[52px] w-[52px] rounded-full shrink-0" />
            <Skeleton className="h-5 w-24 shrink-0" />
          </div>
        </div>
        <div className="flex-1 py-4 flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <div className="space-y-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="relative flex items-center h-[40px] w-[206px]">
                  <div className="flex items-center gap-2.5 h-[40px] ml-[21px] px-3 flex-1 rounded-lg">
                    <Skeleton className="h-4 w-4 shrink-0" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mx-5 border-t border-[#e1efe5]" />
          </div>
          <div className="flex flex-col gap-4">
            <div className="space-y-1">
              {[1, 2].map((i) => (
                <div key={i} className="relative flex items-center h-[40px] w-[206px]">
                  <div className="flex items-center gap-2.5 h-[40px] ml-[21px] px-3 flex-1 rounded-lg">
                    <Skeleton className="h-4 w-4 shrink-0" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="pb-6 pt-4 flex flex-col items-center justify-center border-t border-[#e1efe5] bg-white">
          <Skeleton className="w-[178px] h-[55px] rounded-lg" />
        </div>
      </div>
    );
  }

  const sidebarGroups = user.role === 'SUPER_ADMIN' ? SUPER_ADMIN_GROUPS : CLUB_ADMIN_GROUPS;

  return (
    <div className="flex flex-col h-full bg-white w-[218px] flex-shrink-0 border-r border-[#e1efe5] relative">
      <div className="p-8 flex flex-col gap-4">
        {user?.role === 'CLUB_ADMIN' ? (
          <div className="flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="bg-[#15803D] p-2.5 rounded-full shadow-lg shadow-openclub-700/20">
                <Icons.logo className="h-7 w-7 text-white" />
              </div>
              <span className="text-[16px] font-medium text-gray-900 tracking-tight truncate max-w-[160px]">
                {user?.clubId ? "Oakwood Organizer" : "Select Organizer"}
              </span>
            </div>
            <ChevronDown className="h-4.5 w-4.5 text-gray-400 group-hover:text-gray-900 transition-colors" />
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="bg-[#15803D] p-2.5 rounded-full shadow-lg shadow-openclub-700/20">
              <Icons.logo className="h-8 w-8 text-white" />
            </div>
            <span className="text-[16px] font-medium tracking-tight text-gray-900">OpenClub</span>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 overflow-y-auto scrollbar-hide relative flex flex-col gap-4">
        {sidebarGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="flex flex-col gap-4">
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <div key={item.name} className="relative flex items-center h-[40px] w-[206px]">
                    {isActive && (
                      <div className="w-1.5 h-10 left-0 absolute bg-[#15803D] rounded-tr-[20px] rounded-br-[20px]" />
                    )}
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2.5 h-[40px] ml-[21px] px-3 flex-1 rounded-lg text-sm font-normal transition-colors duration-200 group",
                          isActive
                            ? "bg-[#e0fbea] text-[#15803D]"
                            : "text-zinc-700 hover:bg-background hover:text-zinc-900"
                        )}
                      >
                      <item.icon className={cn(
                        "h-4 w-4 transition-colors",
                        isActive ? "text-[#15803D]" : "text-zinc-700 group-hover:text-zinc-900"
                      )} />
                      {item.name}
                    </Link>
                  </div>
                );
              })}
            </div>
            {groupIndex < sidebarGroups.length - 1 && (
              <div className="mx-5 border-t border-[#e1efe5]" />
            )}
          </div>
        ))}
      </nav>

      <div className="pb-6 pt-4 flex flex-col items-center justify-center border-t border-[#e1efe5] bg-white">
        <div className="w-[178px] h-[55px] bg-[#15803D] rounded-lg overflow-hidden flex items-center justify-between px-[10px] relative group cursor-pointer" onClick={logout} title="Click to Logout">
          <div className="flex items-center gap-2.5">
            <img 
              className="w-7 h-7 rounded-full object-cover bg-white" 
              src={getAvatarUrl(user || undefined)} 
              alt={user?.name || "User Avatar"} 
            />
            <div className="flex flex-col justify-start items-start gap-px overflow-hidden w-[100px]">
              <div className="text-white text-xs font-medium truncate w-full">{user?.name || "Admin User"}</div>
              <div className="text-white text-[10px] font-medium truncate w-full">{user?.email || "admin@openclub.os"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
