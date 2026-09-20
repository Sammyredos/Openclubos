"use client";

import { Shield, Crown, Trophy, Landmark } from "lucide-react";

export function StatsSection() {
  return (
    <>
      {/* 3. Social Proof & Trust Bar */}
      <section className="py-12 border-y border-[#E1EFE5] bg-[#F5FAF6]/30">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-[10px] font-black text-[#5B6B7F] uppercase tracking-[0.3em] mb-10">
            Trusted by Premier Clubs & Regional Tours
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-50 grayscale hover:grayscale-0 transition-all">
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
    </>
  );
}
