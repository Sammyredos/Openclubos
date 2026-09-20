"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X, Sparkles, Smartphone, Tv, CalendarDays } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 glass border-b border-[#E1EFE5] transition-all">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-12">
          {/* Logo */}
          <Link href="/" className="no-underline group">
            <BrandLogo size="md" variant="full" className="group-hover:scale-105 transition-transform" />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8">
            {/* Features Dropdown */}
            <div
              className="relative group"
              onMouseEnter={() => setFeaturesOpen(true)}
              onMouseLeave={() => setFeaturesOpen(false)}
            >
              <button
                type="button"
                className="text-sm font-semibold text-[#5B6B7F] hover:text-[#009A60] transition-colors flex items-center gap-1.5 cursor-pointer py-2"
              >
                <span>Features</span>
                <ChevronDown className="w-3 h-3 transition-transform group-hover:rotate-180" />
              </button>

              {featuresOpen && (
                <div className="absolute top-full left-0 w-64 bg-white rounded-2xl shadow-xl border border-[#E1EFE5] p-3 space-y-1 animate-in fade-in-50 slide-in-from-top-2 duration-150">
                  <Link
                    href="#features"
                    onClick={() => setFeaturesOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F5FAF6] text-xs font-bold text-[#0F172A] hover:text-[#009A60] no-underline transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-[#009A60]" />
                    <span>Tournament Builder</span>
                  </Link>
                  <Link
                    href="/mobile-preview"
                    onClick={() => setFeaturesOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F5FAF6] text-xs font-bold text-[#0F172A] hover:text-[#009A60] no-underline transition-colors"
                  >
                    <Smartphone className="w-4 h-4 text-[#009A60]" />
                    <span>Mobile Scorecard</span>
                  </Link>
                  <Link
                    href="/tv"
                    onClick={() => setFeaturesOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F5FAF6] text-xs font-bold text-[#0F172A] hover:text-[#009A60] no-underline transition-colors"
                  >
                    <Tv className="w-4 h-4 text-[#009A60]" />
                    <span>Clubhouse TV Broadcast</span>
                  </Link>
                  <Link
                    href="#features"
                    onClick={() => setFeaturesOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F5FAF6] text-xs font-bold text-[#0F172A] hover:text-[#009A60] no-underline transition-colors"
                  >
                    <CalendarDays className="w-4 h-4 text-[#009A60]" />
                    <span>Smart Tee Sheet</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Solutions Dropdown */}
            <div
              className="relative group"
              onMouseEnter={() => setSolutionsOpen(true)}
              onMouseLeave={() => setSolutionsOpen(false)}
            >
              <button
                type="button"
                className="text-sm font-semibold text-[#5B6B7F] hover:text-[#009A60] transition-colors flex items-center gap-1.5 cursor-pointer py-2"
              >
                <span>Solutions</span>
                <ChevronDown className="w-3 h-3 transition-transform group-hover:rotate-180" />
              </button>

              {solutionsOpen && (
                <div className="absolute top-full left-0 w-64 bg-white rounded-2xl shadow-xl border border-[#E1EFE5] p-3 space-y-1 animate-in fade-in-50 slide-in-from-top-2 duration-150">
                  <Link
                    href="#how-it-works"
                    onClick={() => setSolutionsOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F5FAF6] text-xs font-bold text-[#0F172A] hover:text-[#009A60] no-underline transition-colors"
                  >
                    <span>Private Golf Clubs</span>
                  </Link>
                  <Link
                    href="/signup-organisation"
                    onClick={() => setSolutionsOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F5FAF6] text-xs font-bold text-[#0F172A] hover:text-[#009A60] no-underline transition-colors"
                  >
                    <span>Tournament Organizers</span>
                  </Link>
                  <Link
                    href="mailto:sales@openclubos.com"
                    onClick={() => setSolutionsOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F5FAF6] text-xs font-bold text-[#0F172A] hover:text-[#009A60] no-underline transition-colors"
                  >
                    <span>State Associations</span>
                  </Link>
                  <Link
                    href="#pricing"
                    onClick={() => setSolutionsOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F5FAF6] text-xs font-bold text-[#0F172A] hover:text-[#009A60] no-underline transition-colors"
                  >
                    <span>Resort Facilities</span>
                  </Link>
                </div>
              )}
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

        {/* Right CTA Area */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/login"
            className="text-sm font-bold text-[#0F172A] hover:text-[#009A60] transition-colors no-underline"
          >
            Sign In
          </Link>
          <Link
            href="/signup-organisation"
            className="bg-[#009A60] hover:bg-[#008754] text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-[#009A60]/10 no-underline active:scale-95"
          >
            Get Started Free
          </Link>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-[#0F172A] hover:bg-[#F5FAF6] transition-colors"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-xl border-b border-[#E1EFE5] px-6 py-6 space-y-4">
          <div className="flex flex-col space-y-3 font-semibold text-[#5B6B7F]">
            <Link
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#009A60] no-underline transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#009A60] no-underline transition-colors"
            >
              Solutions
            </Link>
            <Link
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#009A60] no-underline transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/tv"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#009A60] no-underline transition-colors flex items-center gap-2"
            >
              <Tv className="w-4 h-4 text-[#009A60]" />
              Clubhouse TV
            </Link>
            <Link
              href="/mobile-preview"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#009A60] no-underline transition-colors flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4 text-[#009A60]" />
              Mobile App
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
