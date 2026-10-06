"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export function PricingSection() {
  return (
    <section className="py-24 bg-[#0F172A] relative overflow-hidden" id="pricing">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-[#009A60]/5 transform skew-x-12 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <span className="text-[#009A60] font-bold uppercase tracking-[0.4em] text-[10px]">
            Tiered Subscription Plans
          </span>
          <h2 className="text-4xl font-bold text-white mt-4 tracking-tight">
            Transparent Pricing for Every Club
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Club Basic */}
          <div className="bg-white/5 border border-white/10 rounded-[32px] p-10 flex flex-col hover:bg-white/[0.08] transition-all">
            <h3 className="text-xl font-bold text-white mb-2">Club Basic</h3>
            <p className="text-white/60 text-sm font-medium mb-8">
              For single-course clubs running monthly member medals.
            </p>
            <div className="flex items-baseline gap-1 mb-10">
              <span className="text-4xl font-bold text-white">$249</span>
              <span className="text-white/40 font-bold">/mo</span>
            </div>
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-3 text-sm text-white/80 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#009A60] shrink-0" />
                <span>Essential tournament creation</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/80 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#009A60] shrink-0" />
                <span>Mobile scorecards</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/80 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#009A60] shrink-0" />
                <span>Member lists & DB</span>
              </li>
            </ul>
            <Link
              href="/signup-organisation"
              className="w-full py-4 rounded-xl border border-white/20 text-white font-bold hover:bg-white hover:text-[#0F172A] transition-all text-center no-underline text-sm block"
            >
              Get Started
            </Link>
          </div>

          {/* Championship Pro */}
          <div className="bg-white rounded-[32px] border-4 border-[#009A60] p-10 flex flex-col relative transform scale-105 shadow-2xl">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#009A60] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full">
              Most Popular
            </div>
            <h3 className="text-xl font-bold text-[#0F172A] mb-2">Championship Pro</h3>
            <p className="text-[#5B6B7F] text-sm font-medium mb-8">
              Unlimited tournaments and professional broadcast features.
            </p>
            <div className="flex items-baseline gap-1 mb-10">
              <span className="text-4xl font-bold text-[#0F172A]">$599</span>
              <span className="text-[#5B6B7F] font-bold">/mo</span>
            </div>
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-3 text-sm text-[#0F172A] font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#009A60] shrink-0" />
                <span>Everything in Basic</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-[#0F172A] font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#009A60] shrink-0" />
                <span>Clubhouse TV broadcast mode</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-[#0F172A] font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#009A60] shrink-0" />
                <span>Automated multi-division flighting</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-[#0F172A] font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#009A60] shrink-0" />
                <span>Automated wallet payouts</span>
              </li>
            </ul>
            <Link
              href="/signup-organisation"
              className="w-full py-4 rounded-xl bg-[#009A60] text-white font-bold shadow-lg shadow-[#009A60]/20 hover:bg-[#008754] transition-all text-center no-underline text-sm block"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Enterprise */}
          <div className="bg-white/5 border border-white/10 rounded-[32px] p-10 flex flex-col hover:bg-white/[0.08] transition-all">
            <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
            <p className="text-white/60 text-sm font-medium mb-8">
              For multi-course federations and tour associations.
            </p>
            <div className="flex items-baseline gap-1 mb-10">
              <span className="text-4xl font-bold text-white">Custom</span>
            </div>
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-3 text-sm text-white/80 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#009A60] shrink-0" />
                <span>Multi-course federation mgmt</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/80 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#009A60] shrink-0" />
                <span>White-label branding & domains</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/80 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#009A60] shrink-0" />
                <span>Dedicated success manager</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/80 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#009A60] shrink-0" />
                <span>Custom API integrations</span>
              </li>
            </ul>
            <Link
              href="mailto:sales@openclubos.com"
              className="w-full py-4 rounded-xl border border-white/20 text-white font-bold hover:bg-white hover:text-[#0F172A] transition-all text-center no-underline text-sm block"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
