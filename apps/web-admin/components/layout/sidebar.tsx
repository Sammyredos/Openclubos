"use client";

import { useState, useEffect, useRef } from "react";
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
import { getClub } from "@/lib/api/clubs";
import { Icons } from "@/components/ui/icons";
import { Layers } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

type SidebarItem = {
  name: string;
  href: string;
  icon: any;
  subItems?: { name: string; href: string }[];
};

type SidebarGroup = {
  items: SidebarItem[];
};

function SubItemsAccordion({ subItems, isExpanded, pathname }: { subItems: { name: string; href: string }[]; isExpanded: boolean; pathname: string }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [subItems]);

  return (
    <div
      style={{
        maxHeight: isExpanded ? `${height}px` : "0px",
        opacity: isExpanded ? 1 : 0,
      }}
      className="overflow-hidden transition-all duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
    >
      <div ref={contentRef} className="flex flex-col mt-1 ml-[44px] gap-1 relative pb-1">
        <div className="absolute left-[7px] top-0 bottom-1 w-px bg-slate-200" />
        {subItems.map((subItem) => {
          const isSubActive = pathname === subItem.href || pathname.startsWith(`${subItem.href}/`);
          return (
            <Link
              key={subItem.name}
              href={subItem.href}
              className={cn(
                "flex items-center h-[34px] px-3 ml-[22px] text-[13px] rounded-lg transition-colors duration-200 w-[140px] relative z-10 no-underline hover:no-underline",
                isSubActive
                  ? "bg-[#e0fbea] text-[#15803D] font-medium"
                  : "text-zinc-600 hover:bg-background hover:text-zinc-900"
              )}
            >
              {subItem.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

const SUPER_ADMIN_GROUPS: SidebarGroup[] = [
  {
    items: [
      { name: "Overview", href: "/super-admin/dashboard", icon: Home },
      {
        name: "Users",
        href: "/super-admin/users",
        icon: User,
        subItems: [
          { name: "Players", href: "/super-admin/users/players" },
          { name: "Organizers", href: "/super-admin/users/organizers" }
        ]
      },
      { name: "Golf Courses", href: "/super-admin/golf-courses", icon: Flag },
      {
        name: "Subscriptions",
        href: "/super-admin/subscriptions",
        icon: CreditCard,
        subItems: [
          { name: "Plans", href: "/super-admin/subscriptions/plans" },
          { name: "Organizers", href: "/super-admin/subscriptions/organizers" },
          { name: "Players", href: "/super-admin/subscriptions/players" }
        ]
      },
    ],
  },
  {
    items: [
      { name: "Tournaments", href: "/super-admin/tournaments", icon: Trophy },
      { name: "Leaderboard", href: "/super-admin/leaderboard", icon: BarChart3 },
      {
        name: "Payments",
        href: "/super-admin/payments",
        icon: CreditCard,
        subItems: [
          { name: "Withdrawals", href: "/super-admin/payments/withdrawals" },
          { name: "All Transactions", href: "/super-admin/payments/transactions" }
        ]
      },
    ],
  },
  {
    items: [
      { name: "Analytics", href: "/super-admin/analytics", icon: PieChart },
      { name: "Notifications", href: "/super-admin/notifications", icon: Bell },
    ],
  },
  {
    items: [
      { name: "System", href: "/super-admin/system", icon: SystemIcon },
      { name: "Settings", href: "/super-admin/settings", icon: Settings },
    ],
  },
];

const CLUB_ADMIN_GROUPS: SidebarGroup[] = [
  {
    items: [
      { name: "Dashboard", href: "/organizer-admin/dashboard", icon: Home },
      { name: "Users", href: "/organizer-admin/users", icon: User },
    ],
  },
  {
    items: [
      { name: "Tournaments", href: "/organizer-admin/tournaments", icon: Trophy },
      { name: "Leaderboard", href: "/organizer-admin/leaderboard", icon: BarChart3 },
    ],
  },
  {
    items: [
      {
        name: "Payments",
        href: "/organizer-admin/payments",
        icon: CreditCard,
        subItems: [
          { name: "All Transactions", href: "/organizer-admin/payments/transactions" },
          { name: "Withdrawals", href: "/organizer-admin/payments/withdrawals" }
        ]
      },
      { name: "Reports", href: "/organizer-admin/reports", icon: FileText },
    ],
  },
  {
    items: [
      { name: "Handicaps", href: "/organizer-admin/handicaps", icon: ShieldCheck },
      { name: "Notifications", href: "/organizer-admin/notifications", icon: Bell },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user, isLoading } = useAuth();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [fetchedClub, setFetchedClub] = useState<{name: string, logo?: string} | null>(null);
  const [isFetchingClub, setIsFetchingClub] = useState(false);

  useEffect(() => {
    if (user?.role === 'CLUB_ADMIN' && user?.clubId) {
      setIsFetchingClub(true);
      getClub(user.clubId).then(data => {
        setFetchedClub({ name: data.name, logo: data.logo });
      }).catch(() => {}).finally(() => setIsFetchingClub(false));
    }
  }, [user?.role, user?.clubId]);

  useEffect(() => {
    const newExpanded: Record<string, boolean> = {};
    const groups = user?.role === 'SUPER_ADMIN' ? SUPER_ADMIN_GROUPS : CLUB_ADMIN_GROUPS;
    groups.forEach(group => {
      group.items.forEach(item => {
        if (item.subItems && pathname.startsWith(item.href)) {
          newExpanded[item.name] = true;
        }
      });
    });
    setExpandedGroups(newExpanded);
  }, [pathname, user?.role]);

  const toggleGroup = (name: string) => {
    setExpandedGroups(prev => {
      if (prev[name]) {
        return {};
      }
      return { [name]: true };
    });
  };

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

  const sidebarGroups = user.role === 'SUPER_ADMIN' 
    ? SUPER_ADMIN_GROUPS 
    : CLUB_ADMIN_GROUPS.map(group => ({
        ...group,
        items: group.items.filter(item => {
          if (user.managerScope === 'TOURNAMENTS') {
            const allowed = ["Dashboard", "Tournaments", "Leaderboard", "Reports", "Handicaps", "Notifications", "Settings"];
            return allowed.includes(item.name);
          }
          if (user.managerScope === 'FINANCE') {
            const allowed = ["Dashboard", "Payments", "Reports", "Notifications"];
            return allowed.includes(item.name);
          }
          // Default for FULL manager scope or regular Organizer Admin
          if (user.managerScope && item.name === 'Users') return false;
          return true;
        })
      })).filter(group => group.items.length > 0);

  return (
    <div className="flex flex-col h-full bg-white w-[218px] flex-shrink-0 border-r border-[#e1efe5] relative">
      <div className="p-8 flex flex-col gap-4">
        {user?.role === 'CLUB_ADMIN' ? (
          <div className="flex flex-col items-center justify-center gap-3 group cursor-pointer w-full mt-2 mb-2">
            {isFetchingClub && !fetchedClub ? (
              <>
                <Skeleton className="w-[60px] h-[60px] rounded-full shrink-0" />
                <Skeleton className="h-[20px] w-28 shrink-0 mt-1" />
              </>
            ) : (
              <>
                {fetchedClub?.logo || user?.profilePhoto ? (
                  <div className="w-[60px] h-[60px] rounded-full shadow-lg shadow-openclub-700/20 overflow-hidden flex-shrink-0 border-2 border-white">
                    <img src={fetchedClub?.logo || user?.profilePhoto} alt="Club Logo" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="bg-[#15803D] p-3 rounded-full shadow-lg shadow-openclub-700/20">
                    <Layers className="h-8 w-8 text-white" />
                  </div>
                )}
                <div className="flex items-center justify-center w-full px-2">
                  <span className="text-base font-medium text-gray-900 tracking-tight truncate text-center max-w-full">
                    {fetchedClub?.name || user?.club?.name || "Organizer"}
                  </span>
                </div>
              </>
            )}
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

      <nav className="flex-1 py-4 overflow-y-auto scrollbar-hide relative flex flex-col">
        {sidebarGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="flex flex-col">
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const isExpanded = !!expandedGroups[item.name];
                return (
                  <div key={item.name} className="flex flex-col">
                    <div className="relative flex items-center h-[40px] w-[206px]">
                      {isActive && !item.subItems && (
                        <div className="w-1.5 h-10 left-0 absolute bg-[#15803D] rounded-tr-[20px] rounded-br-[20px]" />
                      )}
                      {item.subItems ? (
                        <button
                          onClick={() => toggleGroup(item.name)}
                          className={cn(
                            "flex items-center justify-between h-[40px] ml-[21px] px-3 flex-1 rounded-lg text-sm font-normal transition-colors duration-200 group",
                            isActive && !item.subItems
                              ? "bg-[#e0fbea] text-[#15803D]"
                              : "text-zinc-700 hover:bg-background hover:text-zinc-900"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <item.icon className={cn(
                              "h-4 w-4 transition-colors",
                              isActive && !item.subItems ? "text-[#15803D]" : "text-zinc-700 group-hover:text-zinc-900"
                            )} />
                            {item.name}
                          </div>
                          <ChevronDown className={cn("h-4 w-4 transition-transform duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]", isExpanded ? "rotate-180 text-[#15803D]" : "text-zinc-400")} />
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center justify-between h-[40px] ml-[21px] px-3 flex-1 rounded-lg text-sm font-normal transition-colors duration-200 group no-underline hover:no-underline",
                            isActive && !item.subItems
                              ? "bg-[#e0fbea] text-[#15803D]"
                              : "text-zinc-700 hover:bg-background hover:text-zinc-900"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <item.icon className={cn(
                              "h-4 w-4 transition-colors",
                              isActive && !item.subItems ? "text-[#15803D]" : "text-zinc-700 group-hover:text-zinc-900"
                            )} />
                            {item.name}
                          </div>
                        </Link>
                      )}
                    </div>
                    {item.subItems && (
                      <SubItemsAccordion subItems={item.subItems} isExpanded={isExpanded} pathname={pathname} />
                    )}
                  </div>
                );
              })}
            </div>
            {groupIndex < sidebarGroups.length - 1 && (
              <div className="mx-5 my-4 border-t border-[#e1efe5]" />
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
