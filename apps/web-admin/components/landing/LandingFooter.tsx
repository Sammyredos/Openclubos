"use client";

import Link from "next/link";
import { ShieldCheck, Lock } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";

export function LandingFooter() {
  return (
    <>
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
            Join hundreds of premier golf clubs who manage their events, players, and leaderboards with OpenclubOS.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/signup-organisation"
              className="w-full sm:w-auto bg-white text-[#009A60] px-12 py-6 rounded-2xl font-black text-xl hover:bg-[#F5FAF6] transition-all shadow-2xl shadow-black/10 no-underline block text-center"
            >
              Start Free Trial
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
          <div className="grid grid-cols-2 md:grid-cols-6 gap-12 mb-20">
            {/* Brand Column */}
            <div className="col-span-2">
              <Link href="/" className="inline-block mb-6 no-underline group">
                <BrandLogo size="md" variant="full" className="group-hover:scale-105 transition-transform" />
              </Link>
              <p className="text-[#5B6B7F] text-sm font-medium leading-relaxed mb-8 max-w-xs">
                The industry-grade tournament management and club operations operating system for elite golf venues.
              </p>
              <div className="flex gap-4">
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#F5FAF6] flex items-center justify-center text-[#009A60] hover:bg-[#009A60] hover:text-white transition-all no-underline"
                  aria-label="X Twitter"
                >
                  <span className="font-black text-sm">𝕏</span>
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#F5FAF6] flex items-center justify-center text-[#009A60] hover:bg-[#009A60] hover:text-white transition-all no-underline"
                  aria-label="LinkedIn"
                >
                  <span className="font-black text-xs">in</span>
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#F5FAF6] flex items-center justify-center text-[#009A60] hover:bg-[#009A60] hover:text-white transition-all no-underline"
                  aria-label="Instagram"
                >
                  <span className="font-black text-xs">ig</span>
                </a>
              </div>
            </div>

            {/* Column 1: Features */}
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

            {/* Column 2: Solutions */}
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

            {/* Column 3: Resources */}
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

            {/* Column 4: Company */}
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

          {/* Bottom Compliance Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-12 border-t border-gray-100">
            <p className="text-[#5B6B7F] text-xs font-bold uppercase tracking-widest">
              © 2024 Openclub OS. All rights reserved.
            </p>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-[#009A60] w-4 h-4" />
                <span className="text-[10px] font-black text-[#5B6B7F] uppercase tracking-widest">
                  SOC2 TYPE II COMPLIANT
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="text-[#009A60] w-4 h-4" />
                <span className="text-[10px] font-black text-[#5B6B7F] uppercase tracking-widest">
                  GDPR READY
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
