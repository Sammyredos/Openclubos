"use client";

import Link from "next/link";
import { ArrowRight, Play, User, Menu } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";

export function HeroSection() {
  return (
    <section className="relative pt-20 pb-32 overflow-hidden">
      {/* Subtle Texture/Bg */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,#F5FAF6_0%,#FFFFFF_100%)] pointer-events-none" />
      <div className="absolute inset-0 -z-10 pattern-grid opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-64 -z-10 pattern-dots opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 text-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 bg-[#F5FAF6] border border-[#E1EFE5] px-4 py-2 rounded-full mb-8 shadow-xs">
          <span className="flex h-2 w-2 rounded-full bg-[#009A60]" />
          <span className="text-xs font-extrabold text-[#009A60] tracking-wider uppercase">
            Introducing Openclub OS 2.0
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-[#0F172A] leading-[1.05] max-w-5xl mx-auto mb-8">
          The Operating System for <span className="text-[#009A60] italic">Elite</span> Golf Venues.
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl md:text-2xl text-[#5B6B7F] max-w-3xl mx-auto mb-12 font-medium leading-relaxed">
          Automate registrations, generate live pairings, broadcast TV leaderboards, and process club payments. Built specifically for PGA professionals and tournament directors.
        </p>

        {/* CTA Button Group */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <Link
            href="/signup-organisation"
            className="w-full sm:w-auto bg-[#009A60] hover:bg-[#008754] text-white px-8 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-[#009A60]/20 transition-all hover:scale-105 active:scale-95 no-underline group"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/mobile-preview"
            className="w-full sm:w-auto bg-white border border-[#E1EFE5] hover:border-[#009A60] text-[#0F172A] hover:text-[#009A60] px-8 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all hover:bg-[#F5FAF6] active:scale-95 no-underline"
          >
            <Play className="w-4 h-4 fill-current text-[#009A60]" />
            <span>Interactive Demo</span>
          </Link>
        </div>

        {/* App Showcase Preview Frame */}
        <div className="relative max-w-6xl mx-auto">
          {/* Subtle Ambient Glow */}
          <div className="absolute -inset-4 bg-gradient-to-b from-[#009A60]/20 to-transparent rounded-[32px] blur-2xl -z-10 opacity-70" />

          {/* Interactive Card Container */}
          <Link
            href="/login"
            className="block text-left no-underline relative z-20 rounded-3xl overflow-hidden border border-[#E1EFE5] shadow-[0_32px_64px_-16px_rgba(0,154,96,0.15)] bg-white p-4 group"
          >
            <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden aspect-[16/9] flex items-center justify-center relative">
              {/* UI Skeleton Representation */}
              <div className="w-full h-full flex bg-white">
                {/* Aside Sidebar */}
                <aside className="w-64 border-r border-gray-100 p-6 flex flex-col gap-6 hidden sm:flex">
                  <div className="flex items-center gap-3 mb-4">
                    <BrandLogo size="xs" variant="icon" />
                    <div className="h-3 w-20 bg-gray-100 rounded" />
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 w-full bg-[#009A60]/10 rounded-md" />
                    <div className="h-4 w-5/6 bg-gray-50 rounded-md" />
                    <div className="h-4 w-full bg-gray-50 rounded-md" />
                    <div className="h-4 w-4/6 bg-gray-50 rounded-md" />
                  </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 p-6 sm:p-8 flex flex-col">
                  <div className="flex justify-between items-center mb-6 sm:mb-8">
                    <div className="space-y-2">
                      <div className="h-6 w-48 bg-[#0F172A]/10 rounded-lg flex items-center px-3">
                        <span className="text-[11px] font-black text-[#0F172A] uppercase tracking-wider">
                          Tournament Hub
                        </span>
                      </div>
                      <div className="h-3 w-32 bg-gray-100 rounded-md" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-10 w-10 bg-[#009A60]/10 rounded-xl" />
                      <div className="h-10 px-4 bg-[#009A60] text-white rounded-xl flex items-center justify-center text-xs font-bold">
                        Create Event
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="h-28 bg-[#F5FAF6] border border-[#E1EFE5] rounded-2xl p-4 flex flex-col justify-between">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#009A60]">
                          Active Events
                        </span>
                        <div className="h-2 w-2 rounded-full bg-[#009A60]" />
                      </div>
                      <div className="text-2xl font-black text-[#0F172A]">12</div>
                    </div>
                    <div className="h-28 bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5B6B7F]">
                        Purse Balance
                      </span>
                      <div className="text-2xl font-black text-[#0F172A]">$45,000</div>
                    </div>
                    <div className="h-28 bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5B6B7F]">
                        Live Scoring
                      </span>
                      <div className="text-2xl font-black text-[#009A60]">Active</div>
                    </div>
                  </div>

                  {/* Course Aerial Banner */}
                  <div className="flex-grow rounded-2xl border border-gray-100 overflow-hidden relative min-h-[140px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="w-full h-full object-cover opacity-90"
                      src="/images/landing/lakowe_course.png"
                      alt="aerial view of Lakowe Lakes Golf and Country Estate, Lagos, premium golf course with lush fairways"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                      <div className="text-xs font-bold tracking-tight">
                        Lakowe Lakes Championship • Round 2 Live
                      </div>
                      <div className="flex -space-x-2">
                        <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 text-[#0F172A] text-[10px] font-black flex items-center justify-center">
                          AW
                        </div>
                        <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-300 text-[#0F172A] text-[10px] font-black flex items-center justify-center">
                          JP
                        </div>
                        <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-400 text-[#0F172A] text-[10px] font-black flex items-center justify-center">
                          CS
                        </div>
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </Link>

          {/* Left Floating: Mobile Player App */}
          <div className="absolute -left-12 bottom-12 z-30 w-56 hidden lg:block transform -rotate-6 hover:rotate-0 hover:scale-105 transition-all duration-300">
            <div className="bg-[#F5FAF6] border-4 border-white rounded-[32px] p-2 shadow-2xl overflow-hidden">
              <div className="bg-white rounded-[24px] overflow-hidden border border-[#E1EFE5] flex flex-col h-[320px] text-left">
                <div className="h-14 bg-[#009A60] p-4 flex justify-between items-center">
                  <Menu className="text-white/70 w-4 h-4" />
                  <div className="w-8 h-8 rounded-full border border-white/20 bg-white/10 flex items-center justify-center">
                    <User className="text-white/70 w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="p-4 flex-grow flex flex-col gap-3">
                  <div className="text-[12px] font-bold text-[#0F172A]">Ikoyi Club 1938</div>
                  <div className="flex-grow bg-gray-50 border border-gray-100 rounded-xl overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="w-full h-full object-cover"
                      src="/images/landing/ikoyi_player.png"
                      alt="golfer at Ikoyi Club 1938 golf course in Lagos"
                    />
                  </div>
                  <div className="h-2 w-full bg-gray-50 rounded" />
                  <div className="h-2 w-3/4 bg-gray-50 rounded" />
                  <Link
                    href="/mobile-preview"
                    className="h-10 w-full bg-[#009A60] hover:bg-[#008754] rounded-xl flex items-center justify-center text-[10px] font-black text-white uppercase tracking-widest no-underline transition-colors shadow-xs"
                  >
                    Enter Score
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right Floating: Clubhouse TV Card */}
          <div className="absolute -right-8 top-1/4 z-30 w-72 hidden lg:block transform rotate-3 hover:rotate-0 hover:scale-105 transition-all duration-300">
            <Link
              href="/tv"
              className="block bg-[#0F172A] rounded-2xl p-5 shadow-2xl border border-white/10 glass text-left no-underline group"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-[#009A60] uppercase tracking-widest">
                  Live Leaderboard
                </span>
                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/landing/avatar_1.jpg"
                      className="w-8 h-8 rounded-full border border-[#009A60] object-cover"
                      alt="A. Wright"
                    />
                    <span className="text-xs font-bold text-white">A. Wright</span>
                  </div>
                  <span className="text-xs font-black text-[#009A60]">-4</span>
                </div>
                <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/landing/avatar_2.jpg"
                      className="w-8 h-8 rounded-full border border-white/10 object-cover"
                      alt="J. Palmer"
                    />
                    <span className="text-xs font-bold text-white">J. Palmer</span>
                  </div>
                  <span className="text-xs font-black text-white">-2</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
