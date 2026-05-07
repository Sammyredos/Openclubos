"use client";

import { Bell, Menu, Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

export function TopNav() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <header className="h-20 border-b bg-white flex items-center justify-between px-8 sticky top-0 z-10">
        <div className="flex items-center gap-4 flex-1">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <div className="ml-12 flex-1 max-w-md hidden sm:block">
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex items-center gap-3 pl-4 border-l h-8 ml-2">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-2 hidden sm:block">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2 w-16" />
            </div>
          </div>
        </div>
      </header>
    );
  }

  const isClubAdmin = user?.role === 'CLUB_ADMIN';

  return (
    <header className="h-20 border-b bg-white flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <button className="p-2 hover:bg-gray-100 rounded-lg lg:hidden">
          <Menu className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 hidden md:block tracking-tight">
          {isClubAdmin ? "Club Dashboard" : "Super Admin Dashboard"}
        </h1>
        <div className="relative max-w-md w-full ml-12 hidden sm:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
          <Input
            placeholder={isClubAdmin ? "Search members, tournaments, payments..." : "Search clubs, users, tournaments..."}
            className="pl-12 h-12 bg-gray-50/50 border-gray-100 focus:bg-white transition-all rounded-xl text-[15px]"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="h-6 w-6 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 h-4.5 w-4.5 bg-red-500 text-white text-[11px] flex items-center justify-center rounded-full border-2 border-white font-bold shadow-sm">
            5
          </span>
        </button>
        <div className="flex items-center gap-3 pl-4 border-l h-8 ml-2">
          <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt="User"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-[15px] font-bold text-gray-800 leading-none">{user?.name || "John Admin"}</p>
            <p className="text-[12px] text-gray-400 font-medium mt-1.5">{isClubAdmin ? "Club Admin" : "Super Admin"}</p>
          </div>
          <ChevronDown className="h-4.5 w-4.5 text-gray-400 ml-1" />
        </div>
      </div>
    </header>
  );
}
