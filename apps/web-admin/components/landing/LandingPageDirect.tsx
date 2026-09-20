"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Lightbulb,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Play,
  Menu,
  User,
  Shield,
  Crown,
  Trophy,
  Landmark,
  Sparkles,
  Smartphone,
  Tv,
  Calendar,
  Wallet,
  UserCheck,
  Compass,
  CalendarCheck,
  FileCheck,
  Check,
  CheckCircle2,
  ShieldCheck,
  ListOrdered,
} from "lucide-react";

export function LandingPageDirect() {
  const [activePhase, setActivePhase] = useState<number>(1);

  const phaseData: Record<
    number,
    {
      title: string;
      subtitle: string;
      icon: string;
      image: string;
      points: string[];
    }
  > = {
    1: {
      title: "Plan & Configure",
      subtitle: "Setting the foundation for a flawless event.",
      icon: "fa-map-location-dot",
      image: "/images/landing/phase_1.png",
      points: [
        "Set up course pars, slope ratings, and complex entry fees in our 10-step wizard.",
        "Define registration deadlines and waitlist logic automatically.",
        "AI-Powered assistance generates tournament copy and local rules in seconds.",
      ],
    },
    2: {
      title: "Auto-Flight & Tee Off",
      subtitle: "Automating the chaos of the first tee.",
      icon: "fa-calendar-check",
      image: "/images/landing/phase_2.png",
      points: [
        "Algorithmic pairing engine based on GHIN handicap index or custom flights.",
        "Automated SMS notifications sent to players with their tee times and starting holes.",
        "Real-time check-in dashboard for tournament staff at the starter's hut.",
      ],
    },
    3: {
      title: "Score & Verify",
      subtitle: "Integrity-first digital scorekeeping.",
      icon: "fa-signature",
      image: "/images/landing/phase_3.png",
      points: [
        "Peer-attested scoring: players enter scores for their group and verify at the end.",
        "Automatic USGA Rule 3.3b compliance checks on every digital scorecard.",
        "Live handicap updates as players move through the course (Net/Gross).",
      ],
    },
    4: {
      title: "Broadcast & Payout",
      subtitle: "The final whistle and beyond.",
      icon: "fa-trophy",
      image: "/images/landing/phase_4.png",
      points: [
        "Instant final leaderboard broadcast to clubhouse TVs and mobile devices.",
        "Automated digital purse distribution to player wallets (integrated Stripe payouts).",
        "Permanent tournament archives and historical performance analytics for every player.",
      ],
    },
  };

  const current = phaseData[activePhase];

  return (
    <div className="bg-white text-[#111827] font-sans selection:bg-[#009A60]/20 selection:text-[#008754]">
      {/* 1. Sticky Navigation Bar */}
      <nav className="sticky top-0 z-50 glass border-b border-[#E1EFE5]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 no-underline">
              <div className="w-10 h-10 bg-[#009A60] rounded-xl flex items-center justify-center shadow-lg shadow-[#009A60]/20">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tighter text-[#0F172A]">
                Openclub<span className="text-[#009A60]">OS</span>
              </span>
            </Link>

            {/* Nav Links */}
            <div className="hidden lg:flex items-center gap-8">
              <div className="group relative">
                <Link
                  href="#features"
                  className="text-sm font-semibold text-[#5B6B7F] hover:text-[#009A60] transition-colors flex items-center gap-1 no-underline"
                >
                  Features <ChevronDown className="w-3 h-3 transition-transform group-hover:translate-y-0.5" />
                </Link>
              </div>
              <div className="group relative">
                <Link
                  href="#how-it-works"
                  className="text-sm font-semibold text-[#5B6B7F] hover:text-[#009A60] transition-colors flex items-center gap-1 no-underline"
                >
                  Solutions <ChevronDown className="w-3 h-3 transition-transform group-hover:translate-y-0.5" />
                </Link>
              </div>
              <Link
                href="#pricing"
                className="text-sm font-semibold text-[#5B6B7F] hover:text-[#009A60] transition-colors no-underline"
              >
                Pricing
              </Link>
              <Link
                href="#features"
                className="text-sm font-semibold text-[#5B6B7F] hover:text-[#009A60] transition-colors no-underline"
              >
                Changelog
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm font-bold text-[#0F172A] hover:text-[#009A60] transition-colors no-underline"
            >
              Sign In
            </Link>
            <Link
              href="/signup-organisation"
              className="bg-[#009A60] hover:bg-[#008754] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-[#009A60]/10 no-underline"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Subtle Texture/Bg */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,#F5FAF6_0%,#FFFFFF_100%)] pointer-events-none"></div>
        <div className="absolute inset-0 -z-10 pattern-grid opacity-30 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-64 -z-10 pattern-dots opacity-20 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 text-center">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 bg-[#F5FAF6] border border-[#E1EFE5] px-4 py-2 rounded-full mb-8 shadow-xs">
            <span className="flex h-2 w-2 rounded-full bg-[#009A60]"></span>
            <span className="text-xs font-extrabold text-[#009A60] tracking-wider uppercase">
              Introducing Openclub OS 2.0
            </span>
            <span className="text-[#5B6B7F] mx-2">•</span>
            <span className="text-xs font-bold text-[#5B6B7F] uppercase tracking-wider">
              The Championship Platform
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-[#0F172A] leading-[1.1] mb-6 tracking-tight max-w-5xl mx-auto">
            The Modern Operating System for{" "}
            <span className="text-[#009A60] italic">Golf Tournaments</span> & Clubs
          </h1>

          <p className="text-lg md:text-xl text-[#5B6B7F] max-w-3xl mx-auto mb-12 font-medium leading-relaxed">
            Effortlessly create tournaments, automate tee sheets, broadcast real-time leaderboards,
            and collect player entry fees—from the first tee to the clubhouse TV.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link
              href="/signup-organisation"
              className="w-full sm:w-auto bg-[#009A60] hover:bg-[#008754] text-white px-10 py-5 rounded-2xl font-extrabold text-lg transition-all shadow-2xl shadow-[#009A60]/20 flex items-center justify-center gap-2 group no-underline"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/mobile-preview"
              className="w-full sm:w-auto bg-white border border-[#E1EFE5] px-10 py-5 rounded-2xl font-extrabold text-lg hover:bg-[#F5FAF6] transition-all flex items-center justify-center gap-2 text-[#0F172A] no-underline"
            >
              <Play className="w-4 h-4 text-[#009A60] fill-[#009A60]" />
              <span>Explore Live Demo</span>
            </Link>
          </div>

          {/* Hero Visual Showcase */}
          <div className="relative max-w-6xl mx-auto mt-20">
            {/* Centerpiece: Organizer Web Dashboard */}
            <div className="relative z-20 rounded-3xl overflow-hidden border border-[#E1EFE5] shadow-[0_32px_64px_-16px_rgba(0,154,96,0.15)] bg-white p-4">
              <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden aspect-[16/9] flex items-center justify-center relative">
                {/* UI Skeleton Representation */}
                <div className="w-full h-full flex bg-white">
                  <aside className="w-64 border-r border-gray-100 p-6 flex flex-col gap-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-[#009A60] rounded-lg"></div>
                      <div className="h-3 w-20 bg-gray-100 rounded"></div>
                    </div>
                    <div className="space-y-4">
                      <div className="h-4 w-full bg-[#009A60]/5 rounded-md"></div>
                      <div className="h-4 w-5/6 bg-gray-50 rounded-md"></div>
                      <div className="h-4 w-full bg-gray-50 rounded-md"></div>
                      <div className="h-4 w-4/6 bg-gray-50 rounded-md"></div>
                    </div>
                  </aside>
                  <main className="flex-1 p-8 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                      <div className="space-y-2 text-left">
                        <div className="h-6 w-48 bg-[#0F172A]/5 rounded-lg"></div>
                        <div className="h-3 w-32 bg-gray-100 rounded-md"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-10 w-10 bg-[#009A60]/10 rounded-xl"></div>
                        <div className="h-10 w-32 bg-[#009A60] rounded-xl"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-6 mb-8">
                      <div className="h-28 bg-[#F5FAF6] border border-[#E1EFE5] rounded-2xl p-4 flex flex-col justify-between">
                        <div className="h-2 w-12 bg-[#009A60]/20 rounded"></div>
                        <div className="h-6 w-16 bg-[#009A60]/10 rounded"></div>
                      </div>
                      <div className="h-28 bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col justify-between">
                        <div className="h-2 w-12 bg-gray-200 rounded"></div>
                        <div className="h-6 w-16 bg-gray-100 rounded"></div>
                      </div>
                      <div className="h-28 bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col justify-between">
                        <div className="h-2 w-12 bg-gray-200 rounded"></div>
                        <div className="h-6 w-16 bg-gray-100 rounded"></div>
                      </div>
                    </div>
                    <div className="flex-grow rounded-2xl border border-gray-100 overflow-hidden relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className="w-full h-full object-cover opacity-80"
                        src="/images/landing/lakowe_course.png"
                        alt="aerial view of Lakowe Lakes Golf and Country Estate, Lagos, premium golf course with lush fairways a"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent"></div>
                      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                        <div className="h-4 w-32 bg-[#0F172A]/10 rounded"></div>
                        <div className="flex -space-x-2">
                          <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200"></div>
                          <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300"></div>
                          <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-400"></div>
                        </div>
                      </div>
                    </div>
                  </main>
                </div>
              </div>
            </div>

            {/* Left Floating: Mobile Player App */}
            <div className="absolute -left-12 bottom-12 z-30 w-56 hidden lg:block transform -rotate-6">
              <div className="bg-[#F5FAF6] border-4 border-white rounded-[32px] p-2 shadow-2xl overflow-hidden text-left">
                <div className="bg-white rounded-[24px] overflow-hidden border border-[#E1EFE5] flex flex-col h-[320px]">
                  <div className="h-14 bg-[#009A60] p-4 flex justify-between items-center">
                    <Menu className="w-4 h-4 text-white/70" />
                    <div className="w-8 h-8 rounded-full border border-white/20 bg-white/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-white/70" />
                    </div>
                  </div>
                  <div className="p-4 flex-grow flex flex-col gap-3">
                    <div className="h-3 w-1/2 bg-gray-100 rounded"></div>
                    <div className="flex-grow bg-gray-50 border border-gray-100 rounded-xl overflow-hidden relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className="w-full h-full object-cover"
                        src="/images/landing/ikoyi_player.png"
                        alt="golfer at Ikoyi Club 1938 golf course in Lagos, tropical greenery, colonial style clubhouse in backg"
                      />
                    </div>
                    <div className="h-2 w-full bg-gray-50 rounded"></div>
                    <div className="h-2 w-3/4 bg-gray-50 rounded"></div>
                    <Link
                      href="/mobile-preview"
                      className="h-10 w-full bg-[#009A60] rounded-xl flex items-center justify-center text-[10px] font-black text-white uppercase tracking-widest no-underline"
                    >
                      Enter Score
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Floating: Clubhouse TV Card */}
            <div className="absolute -right-8 top-1/4 z-30 w-72 hidden lg:block transform rotate-3">
              <Link
                href="/tv"
                className="block bg-[#0F172A] rounded-2xl p-5 shadow-2xl border border-white/10 glass text-left no-underline"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black text-[#009A60] uppercase tracking-widest">
                    Live Leaderboard
                  </span>
                  <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/landing/avatar_1.jpg"
                        className="w-8 h-8 rounded-full border border-[#009A60]"
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
                        className="w-8 h-8 rounded-full border border-white/10"
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

      {/* 3. Social Proof & Trust Bar */}
      <section className="py-12 border-y border-[#E1EFE5] bg-[#F5FAF6]/30">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-[10px] font-black text-[#5B6B7F] uppercase tracking-[0.3em] mb-10">
            Trusted by Premier Clubs & Regional Tours
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-[#009A60]" />
              <span className="font-black text-xl tracking-tighter text-[#0F172A]">OAKWOOD CC</span>
            </div>
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-[#009A60]" />
              <span className="font-black text-xl tracking-tighter text-[#0F172A]">PGA REGIONAL</span>
            </div>
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-[#009A60]" />
              <span className="font-black text-xl tracking-tighter text-[#0F172A]">MASTERS SERIES</span>
            </div>
            <div className="flex items-center gap-3">
              <Landmark className="w-6 h-6 text-[#009A60]" />
              <span className="font-black text-xl tracking-tighter text-[#0F172A]">STATE ASSOC.</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Metrics & Impact Stats */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center p-8 bg-[#F5FAF6] rounded-3xl border border-[#E1EFE5] group hover:bg-[#E8F5ED] transition-colors">
              <h3 className="text-4xl font-black text-[#009A60] mb-2">90%</h3>
              <p className="text-xs font-bold text-[#5B6B7F] uppercase tracking-wider leading-relaxed">
                Less time spent on manual pairings & data entry
              </p>
            </div>
            <div className="text-center p-8 bg-[#F5FAF6] rounded-3xl border border-[#E1EFE5] group hover:bg-[#E8F5ED] transition-colors">
              <h3 className="text-4xl font-black text-[#009A60] mb-2">&lt; 1 sec</h3>
              <p className="text-xs font-bold text-[#5B6B7F] uppercase tracking-wider leading-relaxed">
                Live score broadcast latency to clubhouse TVs
              </p>
            </div>
            <div className="text-center p-8 bg-[#F5FAF6] rounded-3xl border border-[#E1EFE5] group hover:bg-[#E8F5ED] transition-colors">
              <h3 className="text-4xl font-black text-[#009A60] mb-2">100%</h3>
              <p className="text-xs font-bold text-[#5B6B7F] uppercase tracking-wider leading-relaxed">
                Tamper-evident verification on all scorecards
              </p>
            </div>
            <div className="text-center p-8 bg-[#F5FAF6] rounded-3xl border border-[#E1EFE5] group hover:bg-[#E8F5ED] transition-colors">
              <h3 className="text-4xl font-black text-[#009A60] mb-2">$0</h3>
              <p className="text-xs font-bold text-[#5B6B7F] uppercase tracking-wider leading-relaxed">
                Revenue leakage with automated fee tracking
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Bento Grid: Core Product Capabilities */}
      <section className="py-24 bg-[#F5FAF6]/20 relative overflow-hidden" id="features">
        <div className="absolute right-0 top-0 w-1/2 h-full pattern-grid opacity-20 -z-10 transform rotate-12"></div>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-[#0F172A] mb-4 tracking-tight">
              One Platform, Endless Precision
            </h2>
            <p className="text-[#5B6B7F] font-medium max-w-2xl mx-auto">
              The unified ecosystem that replaces your fragmented spreadsheets and outdated
              software.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 grid-rows-2 gap-6 h-auto md:h-[800px]">
            {/* Pillar 1: Tournament Builder */}
            <div className="md:col-span-8 bg-white rounded-[32px] border border-[#E1EFE5] p-10 bento-card relative overflow-hidden text-left">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-[#009A60]/10 text-[#009A60] rounded-xl flex items-center justify-center mb-6">
                  <Sparkles className="w-6 h-6 text-[#009A60]" />
                </div>
                <h3 className="text-2xl font-black text-[#0F172A] mb-4">
                  10-Step Tournament Builder
                </h3>
                <p className="text-[#5B6B7F] font-medium max-w-md mb-8">
                  Visual workflow configuring dates, stroke/match play, cut rules, waitlists, and
                  divisions in minutes.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <span className="block text-[10px] font-black text-[#009A60] uppercase mb-1">
                      Configurability
                    </span>
                    <p className="text-xs text-[#0F172A] font-bold">
                      Stableford, Scramble, Best Ball, Match Play
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <span className="block text-[10px] font-black text-[#009A60] uppercase mb-1">
                      Flights & Cuts
                    </span>
                    <p className="text-xs text-[#0F172A] font-bold">
                      Strict handicap maximums and gender restrictions
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 w-1/3 h-full bg-[#009A60]/5 flex items-end justify-end pointer-events-none p-6">
                <ListOrdered className="w-48 h-48 text-[#009A60]/10 -mb-8 -mr-8" />
              </div>
            </div>

            {/* Pillar 2: Live Scoring */}
            <Link
              href="/mobile-preview"
              className="md:col-span-4 bg-[#009A60] text-white rounded-[32px] p-10 bento-card relative overflow-hidden text-left no-underline block"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 text-white rounded-xl flex items-center justify-center mb-6">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-black mb-4 leading-tight">
                  Real-Time Digital Scorecard
                </h3>
                <p className="text-white/80 font-medium mb-8 text-sm">
                  Peer-attested mobile scoring with auto-calculated net/gross Stableford differentials.
                </p>
                <div className="flex items-center gap-3 py-3 px-4 bg-white/10 rounded-2xl border border-white/10">
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Cryptographic Attestation
                  </span>
                </div>
              </div>
            </Link>

            {/* Pillar 3: TV Broadcast */}
            <Link
              href="/tv"
              className="md:col-span-4 bg-[#0F172A] text-white rounded-[32px] p-10 bento-card relative overflow-hidden text-left no-underline block"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 text-white rounded-xl flex items-center justify-center mb-6">
                  <Tv className="w-6 h-6 text-[#009A60]" />
                </div>
                <h3 className="text-2xl font-black mb-4 leading-tight">
                  Clubhouse TV Broadcast Mode
                </h3>
                <p className="text-white/60 font-medium mb-8 text-sm">
                  Full-screen, spectator-ready broadcast feed for clubhouse screens with WebSocket
                  live sync.
                </p>
              </div>
            </Link>

            {/* Pillar 4, 5, 6: Tee Sheet, Wallet, Mobile */}
            <div className="md:col-span-8 bg-white rounded-[32px] border border-[#E1EFE5] p-10 bento-card">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full text-left">
                <div className="flex flex-col h-full">
                  <Calendar className="w-7 h-7 text-[#009A60] mb-6" />
                  <h4 className="font-black text-[#0F172A] mb-2">Smart Tee Sheet</h4>
                  <p className="text-xs text-[#5B6B7F] font-medium leading-relaxed">
                    Algorithmic pairings by handicap index or shotgun starts.
                  </p>
                </div>
                <div className="flex flex-col h-full">
                  <Wallet className="w-7 h-7 text-[#009A60] mb-6" />
                  <h4 className="font-black text-[#0F172A] mb-2">Integrated Wallet</h4>
                  <p className="text-xs text-[#5B6B7F] font-medium leading-relaxed">
                    Automated fee collection, refunds, and bank withdrawals.
                  </p>
                </div>
                <div className="flex flex-col h-full">
                  <UserCheck className="w-7 h-7 text-[#009A60] mb-6" />
                  <h4 className="font-black text-[#0F172A] mb-2">Player Experience</h4>
                  <p className="text-xs text-[#5B6B7F] font-medium leading-relaxed">
                    Seamless registration, classification, and flight rankings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Interactive "How It Works" */}
      <section className="py-24 bg-white" id="how-it-works">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-start gap-20">
            <div className="lg:w-1/3 text-left">
              <h2 className="text-4xl font-black text-[#0F172A] mb-6 tracking-tight">
                Precision in Motion
              </h2>
              <p className="text-[#5B6B7F] font-medium mb-12">
                See how Openclub OS automates the high-stakes lifecycle of a championship event.
              </p>

              <div className="space-y-4" id="phase-triggers">
                {[
                  { id: 1, label: "Phase 01", title: "Plan & Configure" },
                  { id: 2, label: "Phase 02", title: "Auto-Flight & Tee Off" },
                  { id: 3, label: "Phase 03", title: "Score & Verify" },
                  { id: 4, label: "Phase 04", title: "Broadcast & Payout" },
                ].map((tab) => {
                  const isActive = activePhase === tab.id;
                  return (
                    <div
                      key={tab.id}
                      onClick={() => setActivePhase(tab.id)}
                      className={`phase-tab p-6 border rounded-xl flex items-center justify-between group cursor-pointer transition-all ${
                        isActive
                          ? "bg-[#F5FAF6] border-[#009A60] border-l-4"
                          : "bg-white border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      <div>
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${
                            isActive ? "text-[#009A60]" : "text-[#5B6B7F]"
                          }`}
                        >
                          {tab.label}
                        </span>
                        <h4 className="font-extrabold text-[#0F172A]">{tab.title}</h4>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 text-[#009A60] transition-opacity ${
                          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:w-2/3 w-full">
              <div
                id="phase-content-container"
                className="bg-[#F5FAF6] rounded-[40px] p-12 border border-[#E1EFE5] h-full flex flex-col justify-center min-h-[600px] transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-6 mb-10">
                  <div className="w-20 h-20 bg-[#009A60] rounded-3xl flex items-center justify-center text-white shadow-xl shadow-[#009A60]/20 flex-shrink-0">
                    {activePhase === 1 && <Compass className="w-10 h-10 text-white" />}
                    {activePhase === 2 && <CalendarCheck className="w-10 h-10 text-white" />}
                    {activePhase === 3 && <FileCheck className="w-10 h-10 text-white" />}
                    {activePhase === 4 && <Trophy className="w-10 h-10 text-white" />}
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-[#0F172A] mb-2">
                      Phase {activePhase}: {current.title}
                    </h3>
                    <p className="text-[#5B6B7F] font-medium">{current.subtitle}</p>
                  </div>
                </div>
                <ul className="space-y-6 flex-grow">
                  {current.points.map((p, idx) => (
                    <li key={idx} className="flex items-start gap-4">
                      <div className="w-6 h-6 bg-[#009A60]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Check className="w-3.5 h-3.5 text-[#009A60]" />
                      </div>
                      <p className="text-[#5B6B7F] font-medium">{p}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-12 overflow-hidden rounded-3xl shadow-2xl h-[300px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={current.image}
                    alt={current.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Pricing Section */}
      <section className="py-24 bg-[#0F172A] relative overflow-hidden" id="pricing">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#009A60]/5 transform skew-x-12"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <span className="text-[#009A60] font-black uppercase tracking-[0.4em] text-[10px]">
              Tiered Subscription Plans
            </span>
            <h2 className="text-4xl font-black text-white mt-4 tracking-tight">
              Transparent Pricing for Every Club
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {/* Club Basic */}
            <div className="bg-white/5 border border-white/10 rounded-[32px] p-10 flex flex-col hover:bg-white/[0.08] transition-all">
              <h3 className="text-xl font-extrabold text-white mb-2">Club Basic</h3>
              <p className="text-white/60 text-sm font-medium mb-8">
                For single-course clubs running monthly member medals.
              </p>
              <div className="flex items-baseline gap-1 mb-10">
                <span className="text-4xl font-black text-white">$249</span>
                <span className="text-white/40 font-bold">/mo</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-center gap-3 text-sm text-white/80 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#009A60] flex-shrink-0" />
                  Essential tournament creation
                </li>
                <li className="flex items-center gap-3 text-sm text-white/80 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#009A60] flex-shrink-0" />
                  Mobile scorecards
                </li>
                <li className="flex items-center gap-3 text-sm text-white/80 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#009A60] flex-shrink-0" />
                  Member lists & DB
                </li>
              </ul>
              <Link
                href="/signup-organisation"
                className="w-full py-4 rounded-xl border border-white/20 text-white font-bold hover:bg-white hover:text-[#0F172A] transition-all text-center no-underline block"
              >
                Get Started
              </Link>
            </div>

            {/* Championship Pro */}
            <div className="bg-white rounded-[32px] border-4 border-[#009A60] p-10 flex flex-col relative transform scale-105 shadow-2xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#009A60] text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full">
                Most Popular
              </div>
              <h3 className="text-xl font-extrabold text-[#0F172A] mb-2">Championship Pro</h3>
              <p className="text-[#5B6B7F] text-sm font-medium mb-8">
                Unlimited tournaments and professional broadcast features.
              </p>
              <div className="flex items-baseline gap-1 mb-10">
                <span className="text-4xl font-black text-[#0F172A]">$599</span>
                <span className="text-[#5B6B7F] font-bold">/mo</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-center gap-3 text-sm text-[#0F172A] font-bold">
                  <CheckCircle2 className="w-4 h-4 text-[#009A60] flex-shrink-0" />
                  Everything in Basic
                </li>
                <li className="flex items-center gap-3 text-sm text-[#0F172A] font-bold">
                  <CheckCircle2 className="w-4 h-4 text-[#009A60] flex-shrink-0" />
                  Clubhouse TV broadcast mode
                </li>
                <li className="flex items-center gap-3 text-sm text-[#0F172A] font-bold">
                  <CheckCircle2 className="w-4 h-4 text-[#009A60] flex-shrink-0" />
                  Automated multi-division flighting
                </li>
                <li className="flex items-center gap-3 text-sm text-[#0F172A] font-bold">
                  <CheckCircle2 className="w-4 h-4 text-[#009A60] flex-shrink-0" />
                  Automated wallet payouts
                </li>
              </ul>
              <Link
                href="/signup-organisation"
                className="w-full py-4 rounded-xl bg-[#009A60] text-white font-black shadow-lg shadow-[#009A60]/20 hover:bg-[#008754] transition-all text-center no-underline block"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-white/5 border border-white/10 rounded-[32px] p-10 flex flex-col hover:bg-white/[0.08] transition-all">
              <h3 className="text-xl font-extrabold text-white mb-2">Enterprise</h3>
              <p className="text-white/60 text-sm font-medium mb-8">
                For multi-course federations and tour associations.
              </p>
              <div className="flex items-baseline gap-1 mb-10">
                <span className="text-4xl font-black text-white">Custom</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-center gap-3 text-sm text-white/80 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#009A60] flex-shrink-0" />
                  Multi-course federation mgmt
                </li>
                <li className="flex items-center gap-3 text-sm text-white/80 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#009A60] flex-shrink-0" />
                  White-label branding & domains
                </li>
                <li className="flex items-center gap-3 text-sm text-white/80 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#009A60] flex-shrink-0" />
                  Dedicated success manager
                </li>
                <li className="flex items-center gap-3 text-sm text-white/80 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#009A60] flex-shrink-0" />
                  Custom API integrations
                </li>
              </ul>
              <Link
                href="mailto:sales@openclubos.com"
                className="w-full py-4 rounded-xl border border-white/20 text-white font-bold hover:bg-white hover:text-[#0F172A] transition-all text-center no-underline block"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 12. Bottom Conversion Hero */}
      <section className="py-32 bg-[#009A60] relative overflow-hidden">
        <div className="absolute inset-0 pattern-grid opacity-10 pointer-events-none"></div>
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: "url('/images/landing/carbon-fibre.png')" }}
        ></div>
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight leading-tight">
            Ready to Run Your Best Tournament Ever?
          </h2>
          <p className="text-[#F5FAF6] text-xl font-medium mb-12 opacity-90 max-w-2xl mx-auto">
            Join the premier clubs modernizing their operations with Openclub OS.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup-organisation"
              className="w-full sm:w-auto bg-white text-[#009A60] px-12 py-6 rounded-2xl font-black text-xl shadow-2xl hover:bg-[#F5FAF6] transition-all active:scale-95 no-underline block text-center"
            >
              Start Your 14-Day Free Trial
            </Link>
            <Link
              href="/mobile-preview"
              className="w-full sm:w-auto bg-[#008754] text-white px-12 py-6 rounded-2xl font-black text-xl hover:bg-[#008754]/80 transition-all no-underline block text-center"
            >
              Book a Live Demo
            </Link>
          </div>
          <p className="mt-8 text-white/60 text-sm font-bold uppercase tracking-widest">
            No credit card required • Instant setup
          </p>
        </div>
      </section>

      {/* 13. Comprehensive Footer */}
      <footer className="bg-white pt-24 pb-12 border-t border-[#E1EFE5]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-12 mb-20 text-left">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#009A60] rounded-xl flex items-center justify-center shadow-lg shadow-[#009A60]/20">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-extrabold tracking-tighter text-[#0F172A]">
                  Openclub<span className="text-[#009A60]">OS</span>
                </span>
              </div>
              <p className="text-[#5B6B7F] text-sm font-medium leading-relaxed mb-8 max-w-xs">
                The industry-grade tournament management and club operations operating system for
                elite golf venues.
              </p>
              <div className="flex gap-4">
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#F5FAF6] flex items-center justify-center text-[#009A60] hover:bg-[#009A60] hover:text-white transition-all no-underline"
                  aria-label="Twitter"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#F5FAF6] flex items-center justify-center text-[#009A60] hover:bg-[#009A60] hover:text-white transition-all no-underline"
                  aria-label="LinkedIn"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                  </svg>
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#F5FAF6] flex items-center justify-center text-[#009A60] hover:bg-[#009A60] hover:text-white transition-all no-underline"
                  aria-label="Instagram"
                >
                  <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h5 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-6">
                Features
              </h5>
              <ul className="space-y-4">
                <li>
                  <Link
                    href="#features"
                    className="text-[#5B6B7F] text-sm font-medium hover:text-[#009A60] transition-colors no-underline"
                  >
                    Tournament Engine
                  </Link>
                </li>
                <li>
                  <Link
                    href="/mobile-preview"
                    className="text-[#5B6B7F] text-sm font-medium hover:text-[#009A60] transition-colors no-underline"
                  >
                    Live Scoring
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tv"
                    className="text-[#5B6B7F] text-sm font-medium hover:text-[#009A60] transition-colors no-underline"
                  >
                    Clubhouse TV
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-[#5B6B7F] text-sm font-medium hover:text-[#009A60] transition-colors no-underline"
                  >
                    Club Wallet
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-6">
                Solutions
              </h5>
              <ul className="space-y-4">
                <li>
                  <Link
                    href="#how-it-works"
                    className="text-[#5B6B7F] text-sm font-medium hover:text-[#009A60] transition-colors no-underline"
                  >
                    Private Clubs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/signup-organisation"
                    className="text-[#5B6B7F] text-sm font-medium hover:text-[#009A60] transition-colors no-underline"
                  >
                    Organizers
                  </Link>
                </li>
                <li>
                  <Link
                    href="mailto:sales@openclubos.com"
                    className="text-[#5B6B7F] text-sm font-medium hover:text-[#009A60] transition-colors no-underline"
                  >
                    State Associations
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-6">
                Resources
              </h5>
              <ul className="space-y-4">
                <li>
                  <Link
                    href="/login"
                    className="text-[#5B6B7F] text-sm font-medium hover:text-[#009A60] transition-colors no-underline"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-[#5B6B7F] text-sm font-medium hover:text-[#009A60] transition-colors no-underline"
                  >
                    API Docs
                  </Link>
                </li>
                <li>
                  <Link
                    href="#features"
                    className="text-[#5B6B7F] text-sm font-medium hover:text-[#009A60] transition-colors no-underline"
                  >
                    Changelog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/mobile-preview"
                    className="text-[#5B6B7F] text-sm font-medium hover:text-[#009A60] transition-colors no-underline"
                  >
                    Community
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-6">
                Company
              </h5>
              <ul className="space-y-4">
                <li>
                  <Link
                    href="#how-it-works"
                    className="text-[#5B6B7F] text-sm font-medium hover:text-[#009A60] transition-colors no-underline"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-[#5B6B7F] text-sm font-medium hover:text-[#009A60] transition-colors no-underline"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-[#5B6B7F] text-sm font-medium hover:text-[#009A60] transition-colors no-underline"
                  >
                    Terms
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-[#5B6B7F] text-sm font-medium hover:text-[#009A60] transition-colors no-underline"
                  >
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-12 border-t border-gray-100">
            <p className="text-[#5B6B7F] text-xs font-bold uppercase tracking-widest">
              © 2024 Openclub OS. All rights reserved.
            </p>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-shield-halved text-[#009A60] text-sm"></i>
                <span className="text-[10px] font-black text-[#5B6B7F] uppercase tracking-widest">
                  SOC2 TYPE II COMPLIANT
                </span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-lock text-[#009A60] text-sm"></i>
                <span className="text-[10px] font-black text-[#5B6B7F] uppercase tracking-widest">
                  GDPR READY
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
