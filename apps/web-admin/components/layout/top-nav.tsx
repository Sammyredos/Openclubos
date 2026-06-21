"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

export function TopNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const isOrganizerAdmin = user?.role === 'CLUB_ADMIN';

  const pageTitle = (() => {
    if (isOrganizerAdmin) {
      if (pathname === "/organizer-admin/dashboard") return "Dashboard";
      return "Dashboard";
    }
    if (pathname === "/" || pathname === "/super-admin/dashboard") return "Dashboard";
    if (pathname === "/super-admin/users") return "Users";
    if (pathname === "/super-admin/organizers") return "Organizers";
    if (pathname.startsWith("/super-admin/organizers/")) return "Organizer Details";
    if (pathname === "/super-admin/tournaments") return "Tournaments";
    if (pathname.startsWith("/super-admin/tournaments/")) return "Tournament Details";
    if (pathname === "/super-admin/subscriptions") return "Subscriptions";
    if (pathname === "/super-admin/golf-courses") return "Golf Courses";
    if (pathname.startsWith("/super-admin/golf-courses/")) return "Course Details";
    if (pathname === "/super-admin/settings") return "Settings";
    return "Dashboard";
  })();

  const isDashboard = pathname === "/super-admin/dashboard" || pathname === "/organizer-admin/dashboard" || pathname === "/";

  return (
    <div className="flex items-center gap-24 px-8 pt-8 pb-4 w-full bg-transparent">
      <div className="justify-start text-openclub-700 text-2xl font-semibold">
        {pageTitle}
      </div>
      {isDashboard && (
        <div className="w-[330px] h-11 relative bg-white rounded-[30px] border border-[#e1efe5] overflow-hidden flex items-center px-4">
          <Input
            placeholder="Search anything here..."
            className="border-none bg-transparent shadow-none px-0 h-full text-zinc-500 text-sm font-normal focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 placeholder:text-zinc-500"
          />
          <Search className="h-4 w-4 text-zinc-500 shrink-0" />
        </div>
      )}
    </div>
  );
}
