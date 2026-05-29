"use client";

import { Bell, Menu, Search, ChevronDown, Clock, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { getAvatarUrl } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

const DEFAULT_PAGES = [
  { title: "Overview Dashboard", path: "/super-admin/dashboard", role: "SUPER_ADMIN", type: "page" },
  { title: "Tournaments Management", path: "/super-admin/tournaments", role: "SUPER_ADMIN", type: "page" },
  { title: "Organizers Management", path: "/super-admin/organizers", role: "SUPER_ADMIN", type: "page" },
  { title: "Users & Members", path: "/super-admin/users", role: "SUPER_ADMIN", type: "page" },
  { title: "Golf Courses Management", path: "/super-admin/golf-courses", role: "SUPER_ADMIN", type: "page" },
  { title: "Organizer Overview", path: "/organizer-admin/dashboard", role: "CLUB_ADMIN", type: "page" },
  { title: "Settings & Configurations", path: "/super-admin/settings", role: "SUPER_ADMIN", type: "page" },
  { title: "Financials & Payments", path: "/super-admin/financials", role: "SUPER_ADMIN", type: "page" },
  { title: "Reports & Analytics", path: "/super-admin/reports", role: "SUPER_ADMIN", type: "page" },
];

export function TopNav() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<any>>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  const isOrganizerAdmin = user?.role === 'CLUB_ADMIN';

  // Handle clicking outside of search dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Track visited pages in localStorage memory
  useEffect(() => {
    if (!pathname) return;
    try {
      const stored = localStorage.getItem("openclub_search_memory");
      let memory: Array<{ title: string; path: string; type: string; lastVisited: number }> = stored ? JSON.parse(stored) : [];
      
      const isDefault = DEFAULT_PAGES.some(p => p.path === pathname);
      if (!isDefault && pathname.length > 1) {
        const parts = pathname.split("/").filter(Boolean);
        const lastPart = parts[parts.length - 1];
        const readable = lastPart.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        const title = `${parts.length > 1 ? parts[0].replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase()) + " • " : ""}${readable}`;
        
        const existingIdx = memory.findIndex(m => m.path === pathname);
        if (existingIdx >= 0) {
          memory[existingIdx].lastVisited = Date.now();
        } else {
          memory.unshift({ title, path: pathname, type: "page", lastVisited: Date.now() });
        }
        memory = memory.slice(0, 20);
        localStorage.setItem("openclub_search_memory", JSON.stringify(memory));
      }
    } catch (e) {
      console.error(e);
    }
  }, [pathname]);

  // Generate suggestions based on query and memory
  useEffect(() => {
    if (!isOpen) return;
    try {
      const stored = localStorage.getItem("openclub_search_memory");
      const memory = stored ? JSON.parse(stored) : [];
      
      const role = isOrganizerAdmin ? "CLUB_ADMIN" : "SUPER_ADMIN";
      const allowedDefaults = DEFAULT_PAGES.filter(p => !p.role || p.role === role);
      
      const mergedMap = new Map();
      allowedDefaults.forEach(p => mergedMap.set(p.path, { ...p, lastVisited: 0 }));
      memory.forEach((m: any) => {
        if (mergedMap.has(m.path)) {
          mergedMap.set(m.path, { ...mergedMap.get(m.path), lastVisited: Math.max(mergedMap.get(m.path).lastVisited, m.lastVisited) });
        } else {
          mergedMap.set(m.path, m);
        }
      });
      
      const allItems = Array.from(mergedMap.values()).sort((a, b) => b.lastVisited - a.lastVisited);
      
      const q = searchQuery.trim().toLowerCase();
      if (!q) {
        setSuggestions(allItems.slice(0, 4));
      } else {
        const filtered = allItems.filter(item => 
          item.title.toLowerCase().includes(q) || item.path.toLowerCase().includes(q)
        );
        const result = filtered.slice(0, 4);
        if (result.length < 4 && q.length > 1 && !result.some(r => r.title.toLowerCase() === q)) {
          result.push({
            title: `Search "${searchQuery}" in Tournaments`,
            path: `/super-admin/tournaments?search=${encodeURIComponent(searchQuery)}`,
            type: "search",
            lastVisited: Date.now(),
          });
        }
        setSuggestions(result.slice(0, 4));
      }
    } catch (e) {
      console.error(e);
    }
  }, [searchQuery, isOpen, isOrganizerAdmin]);

  const handleSelect = (item: any) => {
    try {
      const stored = localStorage.getItem("openclub_search_memory");
      let memory = stored ? JSON.parse(stored) : [];
      const existingIdx = memory.findIndex((m: any) => m.path === item.path);
      if (existingIdx >= 0) {
        memory[existingIdx].lastVisited = Date.now();
      } else {
        memory.unshift({ ...item, lastVisited: Date.now() });
      }
      memory = memory.slice(0, 20);
      localStorage.setItem("openclub_search_memory", JSON.stringify(memory));
    } catch (e) {
      console.error(e);
    }
    setIsOpen(false);
    setSearchQuery("");
    router.push(item.path);
  };

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

  const pageTitle = (() => {
    if (isOrganizerAdmin) {
      if (pathname === "/organizer-admin/dashboard") return "";
      return "";
    }
    if (pathname === "/" || pathname === "/super-admin/dashboard") return "";
    if (pathname === "/super-admin/users") return "Users";
    if (pathname === "/super-admin/organizers") return "Organizers";
    if (pathname.startsWith("/super-admin/organizers/")) return "Organizer Details";
    if (pathname === "/super-admin/tournaments") return "Tournaments";
    return "";
  })();

  return (
    <header className="h-20 border-b bg-white flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <button className="p-2 hover:bg-gray-100 rounded-lg lg:hidden">
          <Menu className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 hidden md:block tracking-tight">
          {pageTitle}
        </h1>
        <div ref={searchRef} className="relative max-w-md w-full ml-12 hidden sm:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && suggestions.length > 0) {
                handleSelect(suggestions[0]);
              }
            }}
            placeholder={isOrganizerAdmin ? "Search app, navigation, payments..." : "Search across entire app (type for suggestions)..."}
            className="pl-12 h-12 bg-gray-50/50 border-gray-100 focus:bg-white transition-all rounded-xl text-[15px]"
          />
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-gray-100 z-50 overflow-hidden py-1.5">
              <div className="px-3 py-1.5 text-[11px] text-gray-400 uppercase tracking-wider flex items-center justify-between font-normal">
                <span>Quick Navigation</span>
                <span className="flex items-center gap-1 font-normal text-emerald-600"><Sparkles className="w-3 h-3" /> App Memory</span>
              </div>
              {suggestions.length > 0 ? (
                suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(item)}
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-center justify-between gap-3 transition-colors text-[14px] text-gray-700 font-normal border-t border-gray-50"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 font-normal">
                      <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 text-gray-500 font-normal">
                        {item.type === "search" ? <Search className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-gray-500" />}
                      </div>
                      <span className="truncate font-normal">{item.title}</span>
                    </div>
                    <span className="text-[11px] text-gray-400 bg-gray-100/80 px-2 py-0.5 rounded-md flex-shrink-0 font-normal">
                      {item.type === "search" ? "Search" : "Jump"}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-[13px] text-gray-400 text-center font-normal">No suggestions found</div>
              )}
            </div>
          )}
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
          <div className="h-10 w-10 rounded-full border border-emerald-100 flex-shrink-0 overflow-hidden bg-emerald-50 flex items-center justify-center">
            <img src={getAvatarUrl(user || undefined)} alt={user?.name || "User Avatar"} className="h-full w-full object-cover" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-[15px] font-bold text-gray-800 leading-none">{user?.name || "Samuel Obadina"}</p>
            <p className="text-[12px] text-gray-400 font-medium mt-1.5">{isOrganizerAdmin ? "Organizer Admin" : "Super Admin"}</p>
          </div>
          <ChevronDown className="h-4.5 w-4.5 text-gray-400 ml-1" />
        </div>
      </div>
    </header>
  );
}
