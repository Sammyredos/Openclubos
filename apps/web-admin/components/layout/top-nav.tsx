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
    if (pathname.startsWith("/organizer-admin")) {
      if (pathname === "/organizer-admin/dashboard") return "Dashboard";
      if (pathname === "/organizer-admin/users") return "Users";
      if (pathname.startsWith("/organizer-admin/users/")) return "User Details";
      if (pathname === "/organizer-admin/tournaments") return "Tournaments";
      if (pathname.startsWith("/organizer-admin/tournaments/")) return "Tournament Details";
      if (pathname === "/organizer-admin/leaderboard") return "Leaderboard";
      if (pathname.startsWith("/organizer-admin/leaderboard/")) return "Tournament Leaderboard";
      if (pathname === "/organizer-admin/payments" || pathname.startsWith("/organizer-admin/payments/")) return "Payments";
      if (pathname === "/organizer-admin/reports") return "Reports";
      if (pathname === "/organizer-admin/handicaps") return "Handicaps";
      if (pathname === "/organizer-admin/notifications") return "Notifications";
      if (pathname === "/organizer-admin/settings") return "Settings";
      return "Dashboard";
    }
    if (pathname === "/" || pathname === "/super-admin/dashboard") return "Dashboard";
    if (pathname === "/super-admin/users") return "Users";
    if (pathname === "/super-admin/users/players") return "Players";
    if (pathname === "/super-admin/users/organizers") return "Organizers";
    if (pathname.startsWith("/super-admin/users/")) return "User Details";
    if (pathname === "/super-admin/tournaments") return "Tournaments";
    if (pathname === "/super-admin/leaderboard") return "Leaderboard";
    if (pathname.startsWith("/super-admin/leaderboard/")) return "Tournament Leaderboard";
    if (pathname.startsWith("/super-admin/tournaments/")) return "Tournament Details";
    if (pathname === "/super-admin/subscriptions/organizers") return "Subscribed Organizers";
    if (pathname === "/super-admin/subscriptions/players") return "Subscribed Players";
    if (pathname === "/super-admin/subscriptions/plans") return "Subscription Plans";
    if (pathname === "/super-admin/subscriptions") return "Subscriptions";
    if (pathname === "/super-admin/payments" || pathname.startsWith("/super-admin/payments/")) return "Payments";
    if (pathname === "/super-admin/analytics") return "Analytics";
    if (pathname === "/super-admin/golf-courses") return "Golf Courses";
    if (pathname.startsWith("/super-admin/golf-courses/")) return "Course Details";
    if (pathname === "/super-admin/settings") return "Settings";
    return "Dashboard";
  })();

  const isMajorPage = pathname === "/super-admin/dashboard"
    || pathname === "/organizer-admin/dashboard"
    || pathname === "/"
    || pathname === "/super-admin/analytics"
    || pathname === "/super-admin/users"
    || pathname === "/super-admin/users/players"
    || pathname === "/super-admin/users/organizers"
    || pathname === "/super-admin/tournaments"
    || pathname === "/super-admin/leaderboard"
    || pathname === "/super-admin/payments"
    || pathname === "/super-admin/payments/withdrawals"
    || pathname === "/super-admin/payments/transactions"
    || pathname === "/super-admin/subscriptions"
    || pathname === "/super-admin/golf-courses"
    || pathname === "/super-admin/settings"
    || pathname === "/organizer-admin/users"
    || pathname === "/organizer-admin/tournaments"
    || pathname === "/organizer-admin/leaderboard"
    || pathname === "/organizer-admin/payments"
    || pathname === "/organizer-admin/payments/transactions"
    || pathname === "/organizer-admin/payments/withdrawals"
    || pathname === "/organizer-admin/reports"
    || pathname === "/organizer-admin/handicaps"
    || pathname === "/organizer-admin/notifications"
    || pathname === "/organizer-admin/settings";

  const pageDescription = (() => {
    if (pathname.startsWith("/organizer-admin")) {
      if (pathname === "/organizer-admin/dashboard") return "Overview of your Tournament's key metrics and recent activities.";
      if (pathname === "/organizer-admin/users") return "Manage and view all registered users of your club.";
      if (pathname.startsWith("/organizer-admin/users/")) return "Detailed view and settings for the selected user.";
      if (pathname === "/organizer-admin/tournaments") return "Track and manage all golf tournaments for your club.";
      if (pathname.startsWith("/organizer-admin/tournaments/")) return "Detailed view and settings for the selected tournament.";
      if (pathname === "/organizer-admin/leaderboard") return "View tournament leaderboards and standings.";
      if (pathname.startsWith("/organizer-admin/leaderboard/")) return "Detailed leaderboard view for the selected tournament.";
      if (pathname === "/organizer-admin/payments" || pathname === "/organizer-admin/payments/transactions") return "Track tournament entry fees, payments, and receipts.";
      if (pathname === "/organizer-admin/payments/withdrawals") return "Track club payout requests, bank accounts, and settlement statuses.";
      if (pathname === "/organizer-admin/reports") return "Generate and view club and tournament reports.";
      if (pathname === "/organizer-admin/handicaps") return "Manage and update player handicaps.";
      if (pathname === "/organizer-admin/notifications") return "Send and manage notifications to members.";
      if (pathname === "/organizer-admin/settings") return "Configure your club's preferences and settings.";
      return "";
    }
    if (pathname === "/" || pathname === "/super-admin/dashboard") return "Overview of platform key metrics and recent activities.";
    if (pathname === "/super-admin/analytics") return "Track performance, engagement and growth across your tournaments.";
    if (pathname === "/super-admin/users") return "View and manage all registered users on the platform.";
    if (pathname === "/super-admin/users/players") return "View and manage all registered players and markers on the platform.";
    if (pathname === "/super-admin/users/organizers") return "View and manage all club management staff and administrators.";
    if (pathname.startsWith("/super-admin/users/")) return "Detailed view and settings for the selected user.";
    if (pathname === "/super-admin/tournaments") return "Track and manage all golf tournaments across Organizers.";
    if (pathname === "/super-admin/leaderboard") return "View tournament leaderboards and standings across Organizers.";
    if (pathname.startsWith("/super-admin/leaderboard/")) return "Detailed leaderboard view for the selected tournament.";
    if (pathname.startsWith("/super-admin/tournaments/")) return "Detailed view and settings for the selected tournament.";
    if (pathname === "/super-admin/subscriptions/organizers") return "Monitor billing, plans, and organizer subscription statuses.";
    if (pathname === "/super-admin/subscriptions/players") return "Monitor billing, plans, and player subscription statuses.";
    if (pathname === "/super-admin/subscriptions/plans") return "Create and manage subscription plans and pricing.";
    if (pathname === "/super-admin/subscriptions") return "Monitor billing, plans, and subscription statuses.";
    if (pathname === "/super-admin/payments" || pathname === "/super-admin/payments/transactions") return "Track all platform transactions, entry fees, and receipts across clubs.";
    if (pathname === "/super-admin/payments/withdrawals") return "Review, process, and disburse club organizer withdrawal requests.";
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
