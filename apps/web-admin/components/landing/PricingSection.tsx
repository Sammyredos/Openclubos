"use client";

import React, { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Make a public fetch since getPlans uses a token that might not exist for visitors
const fetchPublicPlans = async () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const res = await fetch(`${API_URL}/subscriptions/plans`);
  if (!res.ok) throw new Error("Failed to fetch plans");
  return res.json();
};

export function PricingSection() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [audience, setAudience] = useState<"PLAYER" | "ORGANIZER">("ORGANIZER");

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await fetchPublicPlans();
        setPlans(data.filter((p: any) => p.isActive));
      } catch (e) {
        console.error("Error loading plans", e);
      } finally {
        setLoading(false);
      }
    };
    loadPlans();
  }, []);

  // Filter plans based on audience selection
  const filteredPlans = plans.filter((p) => p.targetAudience === audience);
  
  // We want to group by base name (e.g. "Professional Organizer") and show Monthly/Annual toggles, 
  // but the user's specific request has Monthly and Annual as separate distinct plans in the DB.
  // Actually, to make the UI simpler, let's just group them by base name!
  // Since names are like "Professional Organizer (Monthly)" and "Professional Organizer (Annual)"
  
  const getBaseName = (name: string) => name.replace(" (Monthly)", "").replace(" (Annual)", "");
  const baseNames = Array.from(new Set(filteredPlans.map(p => getBaseName(p.name))));
  
  const groupedPlans = baseNames.map(base => {
    const group = filteredPlans.filter(p => getBaseName(p.name) === base);
    const monthly = group.find(p => p.billingCycle === "MONTHLY") || group[0];
    const annual = group.find(p => p.billingCycle === "ANNUAL") || group[0];
    
    // Check if it's the recommended or launch offer
    const isRecommended = base.includes("Professional");
    const isLaunchOffer = base.includes("Founding");
    
    return {
      baseName: base,
      monthly,
      annual,
      isRecommended,
      isLaunchOffer
    };
  });

  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="container mx-auto px-6 max-w-[1200px]">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-[#15803D] text-sm font-semibold tracking-wider uppercase">Pricing</h2>
          <h3 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
            Simple, transparent pricing
          </h3>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Whether you're a casual player or a full-scale federation, we have a plan that perfectly fits your needs.
          </p>
        </div>

        {/* Toggle Controls */}
        <div className="flex flex-col items-center justify-center gap-6 mb-12">
          {/* Audience Toggle */}
          <div className="bg-slate-100 p-1.5 rounded-full inline-flex">
            <button
              onClick={() => setAudience("PLAYER")}
              className={cn(
                "px-8 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                audience === "PLAYER" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              For Players
            </button>
            <button
              onClick={() => setAudience("ORGANIZER")}
              className={cn(
                "px-8 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                audience === "ORGANIZER" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              For Organizers
            </button>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center gap-3">
            <span className={cn("text-sm font-medium", billingCycle === "MONTHLY" ? "text-slate-900" : "text-slate-500")}>Monthly</span>
            <button 
              onClick={() => setBillingCycle(b => b === "MONTHLY" ? "ANNUAL" : "MONTHLY")}
              className="relative w-12 h-6 rounded-full bg-[#15803D] transition-colors focus:outline-none"
            >
              <div className={cn("absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300", billingCycle === "ANNUAL" ? "translate-x-6" : "")} />
            </button>
            <span className={cn("text-sm font-medium", billingCycle === "ANNUAL" ? "text-slate-900" : "text-slate-500")}>
              Annually <span className="ml-1 text-[#15803D] text-xs bg-green-50 px-2 py-0.5 rounded-full font-bold">Save 20%</span>
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#15803D]/30 border-t-[#15803D] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-start max-w-5xl mx-auto">
            {groupedPlans.map((group) => {
              const activePlan = billingCycle === "MONTHLY" ? group.monthly : group.annual;
              const isCustomPricing = activePlan.amount === 0;

              return (
                <div 
                  key={group.baseName} 
                  className={cn(
                    "relative bg-white rounded-3xl p-8 border transition-all duration-300",
                    group.isRecommended || group.isLaunchOffer 
                      ? "border-[#15803D] shadow-[0_8px_30px_rgb(21,128,61,0.12)] scale-105 z-10" 
                      : "border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md"
                  )}
                >
                  {(group.isRecommended || group.isLaunchOffer) && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center">
                      <span className="bg-[#15803D] text-white text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full">
                        {group.isLaunchOffer ? "Launch Offer" : "Recommended"}
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">{group.baseName}</h4>
                    <p className="text-slate-500 text-sm h-10">{activePlan.description}</p>
                  </div>

                  <div className="mb-6">
                    {isCustomPricing ? (
                      <div className="text-4xl font-bold text-slate-900">Custom</div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-slate-500 font-medium">{activePlan.currency}</span>
                        <span className="text-4xl font-bold text-slate-900">{activePlan.amount.toLocaleString()}</span>
                        <span className="text-slate-500 font-medium">/{activePlan.billingCycle === "ANNUAL" ? "yr" : "mo"}</span>
                      </div>
                    )}
                  </div>

                  <button 
                    className={cn(
                      "w-full py-3 px-6 rounded-xl font-medium transition-all duration-300 mb-8",
                      group.isRecommended || group.isLaunchOffer
                        ? "bg-[#15803D] text-white hover:bg-[#166534] shadow-md hover:shadow-lg"
                        : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                    )}
                  >
                    {isCustomPricing ? "Contact Sales" : "Get Started"}
                  </button>

                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-slate-900 capitalize tracking-wider">Includes:</p>
                    <ul className="space-y-3">
                      {activePlan.features.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3 text-slate-600 text-sm">
                          <Check className="w-5 h-5 text-[#15803D] shrink-0" />
                          <span className="leading-snug">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
