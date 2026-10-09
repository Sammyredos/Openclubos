"use client";

import React, { use } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";
import {
  Trophy,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Smartphone,
  ChevronRight,
  ArrowRight,
  UserCheck,
} from "lucide-react";

interface InvitePageProps {
  params: Promise<{
    slug: string;
  }>;
}

function formatSlugToName(slug: string): string {
  if (!slug) return "A Fellow Golfer";
  const clean = slug.split("-")[0];
  if (!clean) return "A Fellow Golfer";
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function MemberInvitePage({ params }: InvitePageProps) {
  const { slug } = use(params);
  const [liveGolfer, setLiveGolfer] = React.useState<{ name: string; club: string; hcp: string; avatar?: string } | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    const fetchMember = async () => {
      try {
        const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const cleanNamePart = slug.split("-")[0];
        const res = await fetch(`${backendBase}/members?search=${encodeURIComponent(cleanNamePart || slug)}`).catch(() => null);
        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          const membersList = Array.isArray(data) ? data : data?.items || [];
          if (membersList.length > 0 && isMounted) {
            const m = membersList[0];
            setLiveGolfer({
              name: m.name || m.fullName || formatSlugToName(slug),
              club: m.club || m.golfClub || "Openclub Golf Community",
              hcp: String(m.handicap ?? m.hcp ?? "0.0"),
              avatar: m.avatar || m.profilePhoto,
            });
          }
        }
      } catch {}
    };
    fetchMember();
    return () => { isMounted = false; };
  }, [slug]);

  const matchedProfile = liveGolfer || {
    name: formatSlugToName(slug),
    club: "Openclub Golf Community",
    hcp: "0.0",
  };

  const registerHref = `/mobile-preview?screen=register&ref=${encodeURIComponent(slug)}`;
  const loginHref = `/mobile-preview?screen=login&ref=${encodeURIComponent(slug)}`;
  const deepLinkHref = `openclub://invite/${encodeURIComponent(slug)}`;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#052417] via-[#083020] to-[#03170e] text-white flex flex-col items-center justify-between p-4 sm:p-6 md:p-10 selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      {/* Background Subtle Topographic Radial Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-emerald-500/15 via-emerald-600/5 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -bottom-24 right-0 w-[400px] h-[400px] bg-emerald-700/10 blur-3xl pointer-events-none rounded-full" />

      {/* Top Navbar: Brand Identity */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between z-10 pt-2 pb-6">
        <BrandLogo size="sm" variant="full" theme="dark" />

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-xs">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          Member Invitation
        </span>
      </header>

      {/* Main Centered Invitation Card (Container conforms to mobile max-w-sm standard) */}
      <div className="w-full max-w-sm mx-auto my-auto z-10">
        <div className="w-full bg-white rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-900 border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
          {/* Subtle Top Green Accent Bar */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-600 via-emerald-400 to-[#009A60]" />

          {/* Inviter Avatar Squircle Badge */}
          <div className="relative mt-2 mb-4">
            <div className="w-20 h-20 rounded-[24px] bg-[#EAF7EE] border-2 border-[#C6F0DB] flex items-center justify-center text-[#009A60] font-bold text-2xl shadow-xs">
              {getInitials(matchedProfile.name)}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#009A60] border-2 border-white flex items-center justify-center text-white shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Headline & Inviter Info */}
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight leading-snug">
            {matchedProfile.name} invited you to connect
          </h1>

          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-700">
            <span>{matchedProfile.club}</span>
            <span className="text-slate-300 font-normal">|</span>
            <span className="text-[#009A60]">{matchedProfile.hcp} HCP</span>
          </div>

          <p className="text-xs sm:text-[13px] font-normal text-slate-500 leading-relaxed mt-3.5 max-w-[280px]">
            Join OpenclubOS to play rounds together, view real-time tournament leaderboards, submit attested scorecards, and track your official handicap.
          </p>

          {/* Feature Highlights Grid */}
          <div className="w-full grid grid-cols-3 gap-2 my-5 pt-4 border-t border-slate-100">
            <div className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50 border border-slate-100">
              <Trophy className="w-4 h-4 text-[#009A60] mb-1 stroke-[2.2]" />
              <span className="text-[10.5px] font-bold text-slate-800 leading-tight">Live Scores</span>
            </div>
            <div className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50 border border-slate-100">
              <ShieldCheck className="w-4 h-4 text-[#009A60] mb-1 stroke-[2.2]" />
              <span className="text-[10.5px] font-bold text-slate-800 leading-tight">WHS Index</span>
            </div>
            <div className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50 border border-slate-100">
              <UserCheck className="w-4 h-4 text-[#009A60] mb-1 stroke-[2.2]" />
              <span className="text-[10.5px] font-bold text-slate-800 leading-tight">Club Friends</span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="w-full space-y-2.5">
            <Link
              href={registerHref}
              className="w-full h-12 rounded-xl bg-[#009A60] hover:bg-[#008251] active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-900/15 flex items-center justify-center gap-2 transition-all no-underline capitalize"
            >
              <span>Accept invite & create account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href={loginHref}
              className="w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center transition-all no-underline capitalize"
            >
              Already a member? Sign in
            </Link>

            <a
              href={deepLinkHref}
              className="inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#009A60] hover:text-[#008251] pt-1 transition-colors no-underline"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Open in Openclub app</span>
            </a>
          </div>
        </div>
      </div>

      {/* Pinned Bottom Footer */}
      <footer className="w-full max-w-sm mx-auto text-center z-10 pt-6 pb-2 space-y-2">
        <p className="text-[11px] font-medium text-emerald-200/60 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>SOC2 Type II Certified & WHS Compliant Golf Network</span>
        </p>
        <p className="text-[10px] text-emerald-300/40">
          © {new Date().getFullYear()} OpenclubOS. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
