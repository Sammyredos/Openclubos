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
    if (isOrganizerAdmin && pathname.startsWith("/organizer-admin")) {
      if (pathname === "/organizer-admin/dashboard") return "Dashboard";
      return "Dashboard";
    }
    if (pathname === "/" || pathname === "/super-admin/dashboard") return "Dashboard";
    if (pathname === "/super-admin/organizers") return "Organizers";
    if (pathname.startsWith("/super-admin/organizers/")) return "Organizer Details";
    if (pathname === "/super-admin/users") return "Users";
    if (pathname.startsWith("/super-admin/users/")) return "User Details";
    if (pathname === "/super-admin/tournaments") return "Tournaments";
    if (pathname.startsWith("/super-admin/tournaments/")) return "Tournament Details";
    if (pathname === "/super-admin/subscriptions/organizers") return "Subscribed Organizers";
    if (pathname === "/super-admin/subscriptions/players") return "Subscribed Players";
    if (pathname === "/super-admin/subscriptions/plans") return "Subscription Plans";
    if (pathname === "/super-admin/subscriptions") return "Subscriptions";
    if (pathname === "/super-admin/golf-courses") return "Golf Courses";
    if (pathname.startsWith("/super-admin/golf-courses/")) return "Course Details";
    if (pathname === "/super-admin/settings") return "Settings";
    return "Dashboard";
  })();

  const isMajorPage = pathname === "/super-admin/dashboard" 
    || pathname === "/organizer-admin/dashboard" 
    || pathname === "/"
    || pathname === "/super-admin/users"
    || pathname === "/super-admin/organizers"
    || pathname === "/super-admin/tournaments"
    || pathname === "/super-admin/subscriptions"
    || pathname === "/super-admin/golf-courses"
    || pathname === "/super-admin/settings";

  const pageDescription = (() => {
    if (isOrganizerAdmin && pathname.startsWith("/organizer-admin")) {
      if (pathname === "/organizer-admin/dashboard") return "Overview of your club's key metrics and recent activities.";
      return "";
    }
    if (pathname === "/" || pathname === "/super-admin/dashboard") return "Overview of platform key metrics and recent activities.";
    if (pathname === "/super-admin/organizers") return "Manage and monitor all club organizers on the platform.";
    if (pathname.startsWith("/super-admin/organizers/")) return "Detailed view and settings for the selected organizer.";
    if (pathname === "/super-admin/users") return "View and manage all registered users on the platform.";
    if (pathname.startsWith("/super-admin/users/")) return "Detailed view and settings for the selected user.";
    if (pathname === "/super-admin/tournaments") return "Track and manage all golf tournaments across clubs.";
    if (pathname.startsWith("/super-admin/tournaments/")) return "Detailed view and settings for the selected tournament.";
    if (pathname === "/super-admin/subscriptions/organizers") return "Monitor billing, plans, and organizer subscription statuses.";
    if (pathname === "/super-admin/subscriptions/players") return "Monitor billing, plans, and player subscription statuses.";
    if (pathname === "/super-admin/subscriptions/plans") return "Create and manage subscription plans and pricing.";
    if (pathname === "/super-admin/subscriptions") return "Monitor billing, plans, and subscription statuses.";
    if (pathname === "/super-admin/golf-courses") return "Manage the database of available golf courses.";
    if (pathname.startsWith("/super-admin/golf-courses/")) return "Detailed view and settings for the selected course.";
    if (pathname === "/super-admin/settings") return "Configure global platform preferences and settings.";
    return "";
  })();

  return (
    <div className="flex items-center justify-between gap-24 px-8 pt-8 pb-4 w-full bg-transparent">
      <div className="flex flex-col">
        <div className="justify-start text-openclub-700 text-2xl font-semibold">
          {pageTitle}
        </div>
        {pageDescription && (
          <div className="text-gray-500 text-[13px] font-normal mt-1">
            {pageDescription}
          </div>
        )}
      </div>
      {isMajorPage && (
        <div className="w-[330px] h-11 relative bg-white rounded-[30px] border border-[#e1efe5] overflow-hidden flex items-center px-4 shadow-sm">
          <Input
            placeholder="Search anything here..."
            className="border-none bg-transparent shadow-none px-0 h-full text-zinc-500 text-[14px] font-normal focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 placeholder:text-zinc-400"
          />
          <Search className="h-4 w-4 text-zinc-400 shrink-0" />
        </div>
      )}
    </div>
  );
}
