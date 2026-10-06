"use client";

import Link from "next/link";
import {
  Sparkles,
  Smartphone,
  Tv,
  CalendarDays,
  Wallet,
  UserCheck,
  ShieldCheck,
  ListChecks,
} from "lucide-react";

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-[#F5FAF6]/20 relative overflow-hidden">
      <div className="absolute right-0 top-0 w-1/2 h-full pattern-grid opacity-20 -z-10 transform rotate-12 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#0F172A] mb-4 tracking-tight">
            One Platform, Endless Precision
          </h2>
          <p className="text-[#5B6B7F] font-medium max-w-2xl mx-auto">
            The unified ecosystem that replaces your fragmented spreadsheets and outdated software.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 grid-rows-2 gap-6 h-auto md:h-[800px]">
          {/* Pillar 1: Tournament Builder */}
          <Link
            href="/signup-organisation"
            className="md:col-span-8 bg-white rounded-[32px] border border-[#E1EFE5] p-10 bento-card relative overflow-hidden no-underline block text-left group"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 bg-[#009A60]/10 text-[#009A60] rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-[#009A60]" />
              </div>
              <h3 className="text-2xl font-bold text-[#0F172A] mb-4 group-hover:text-[#009A60] transition-colors">
                10-Step Tournament Builder
              </h3>
              <p className="text-[#5B6B7F] font-medium max-w-md mb-8">
                Visual workflow configuring dates, stroke/match play, cut rules, waitlists, and divisions in minutes.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <span className="block text-[10px] font-bold text-[#009A60] uppercase mb-1">
                    Configurability
                  </span>
                  <p className="text-xs text-[#0F172A] font-bold">
                    Stableford, Scramble, Best Ball, Match Play
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <span className="block text-[10px] font-bold text-[#009A60] uppercase mb-1">
                    Flights & Cuts
                  </span>
                  <p className="text-xs text-[#0F172A] font-bold">
                    Strict handicap maximums and gender restrictions
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute right-0 bottom-0 w-1/3 h-full bg-[#009A60]/5 flex items-end justify-end pointer-events-none">
              <ListChecks className="w-48 h-48 text-[#009A60]/10 -mb-10 -mr-10" />
            </div>
          </Link>

          {/* Pillar 2: Live Scoring */}
          <Link
            href="/mobile-preview"
            className="md:col-span-4 bg-[#009A60] text-white rounded-[32px] p-10 bento-card relative overflow-hidden no-underline block text-left group"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/10 text-white rounded-xl flex items-center justify-center mb-6">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 leading-tight">
                Real-Time Digital Scorecard
              </h3>
              <p className="text-white/80 font-medium mb-8 text-sm">
                Peer-attested mobile scoring with auto-calculated net/gross Stableford differentials.
              </p>
              <div className="flex items-center gap-3 py-3 px-4 bg-white/10 rounded-2xl border border-white/10">
                <ShieldCheck className="w-4 h-4 text-white" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Cryptographic Attestation
                </span>
              </div>
            </div>
          </Link>

          {/* Pillar 3: TV Broadcast */}
          <Link
            href="/tv"
            className="md:col-span-4 bg-[#0F172A] text-white rounded-[32px] p-10 bento-card relative overflow-hidden no-underline block text-left group"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/10 text-white rounded-xl flex items-center justify-center mb-6">
                <Tv className="w-6 h-6 text-[#009A60]" />
              </div>
              <h3 className="text-2xl font-bold mb-4 leading-tight">
                Clubhouse TV Broadcast Mode
              </h3>
              <p className="text-white/60 font-medium mb-8 text-sm">
                Full-screen, spectator-ready broadcast feed for clubhouse screens with WebSocket live sync.
              </p>
            </div>
          </Link>

          {/* Pillar 4, 5, 6: Tee Sheet, Wallet, Mobile */}
          <div className="md:col-span-8 bg-white rounded-[32px] border border-[#E1EFE5] p-10 bento-card">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full">
              <Link href="/login" className="flex flex-col h-full no-underline group text-left">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-6">
                  <CalendarDays className="w-7 h-7 text-[#009A60]" />
                </div>
                <h4 className="font-bold text-[#0F172A] mb-2 group-hover:text-[#009A60] transition-colors">
                  Smart Tee Sheet
                </h4>
                <p className="text-xs text-[#5B6B7F] font-medium leading-relaxed">
                  Algorithmic pairings by handicap index or shotgun starts.
                </p>
              </Link>

              <Link href="/login" className="flex flex-col h-full no-underline group text-left">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-6">
                  <Wallet className="w-7 h-7 text-[#009A60]" />
                </div>
                <h4 className="font-bold text-[#0F172A] mb-2 group-hover:text-[#009A60] transition-colors">
                  Integrated Wallet
                </h4>
                <p className="text-xs text-[#5B6B7F] font-medium leading-relaxed">
                  Automated fee collection, refunds, and bank withdrawals.
                </p>
              </Link>

              <Link href="/mobile-preview" className="flex flex-col h-full no-underline group text-left">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-6">
                  <UserCheck className="w-7 h-7 text-[#009A60]" />
                </div>
                <h4 className="font-bold text-[#0F172A] mb-2 group-hover:text-[#009A60] transition-colors">
                  Player Experience
                </h4>
                <p className="text-xs text-[#5B6B7F] font-medium leading-relaxed">
                  Seamless registration, classification, and flight rankings.
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
