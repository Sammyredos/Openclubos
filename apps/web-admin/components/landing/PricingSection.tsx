"use client";

import React, { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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

  const filteredPlans = plans.filter((p) => p.targetAudience === audience);
  
  const getBaseName = (name: string) => name.replace(" (Monthly)", "").replace(" (Annual)", "");
  const baseNames = Array.from(new Set(filteredPlans.map(p => getBaseName(p.name))));
  
  const groupedPlans = baseNames.map(base => {
    const group = filteredPlans.filter(p => getBaseName(p.name) === base);
    const monthly = group.find(p => p.billingCycle === "MONTHLY") || group[0];
    const annual = group.find(p => p.billingCycle === "ANNUAL") || group[0];
    
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
    <section id="pricing" className="py-32 bg-[#fafafa] text-zinc-900 relative">
      <div className="container mx-auto px-6 max-w-[1200px] relative z-10">
        <div className="text-center mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-200 border border-zinc-300 text-sm font-medium text-emerald-700 mb-2"
          >
            Pricing
          </motion.div>
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-zinc-900 tracking-tight leading-tight"
          >
            Simple, transparent pricing
          </motion.h3>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="text-zinc-400 text-lg max-w-2xl mx-auto"
          >
            Whether you're a casual player or a full-scale federation, we have a plan that perfectly fits your needs.
          </motion.p>
        </div>

        {/* Toggle Controls */}
        <div className="flex flex-col items-center justify-center gap-8 mb-16">
          {/* Audience Toggle */}
          <div className="bg-zinc-100 border border-zinc-200 p-1.5 rounded-full inline-flex">
            <button
              onClick={() => setAudience("PLAYER")}
              className={cn(
                "px-8 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                audience === "PLAYER" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              For Players
            </button>
            <button
              onClick={() => setAudience("ORGANIZER")}
              className={cn(
                "px-8 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                audience === "ORGANIZER" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              For Organizers
            </button>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center gap-4">
            <span className={cn("text-sm font-medium transition-colors", billingCycle === "MONTHLY" ? "text-zinc-900" : "text-zinc-500")}>Monthly</span>
            <button 
              onClick={() => setBillingCycle(b => b === "MONTHLY" ? "ANNUAL" : "MONTHLY")}
              className="relative w-14 h-7 rounded-full bg-zinc-200 border border-zinc-300 transition-colors focus:outline-none hover:bg-zinc-300"
            >
              <div className={cn("absolute top-[2px] left-[3px] bg-white w-[20px] h-[20px] rounded-full transition-transform duration-300 shadow-sm", billingCycle === "ANNUAL" ? "translate-x-7" : "")} />
            </button>
            <span className={cn("text-sm font-medium transition-colors flex items-center gap-2", billingCycle === "ANNUAL" ? "text-zinc-900" : "text-zinc-500")}>
              Annually 
              <span className="text-emerald-700 text-xs bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">Save 20%</span>
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-start max-w-5xl mx-auto">
            {groupedPlans.map((group, idx) => {
              const activePlan = billingCycle === "MONTHLY" ? group.monthly : group.annual;
              const isCustomPricing = activePlan.amount === 0;

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  viewport={{ once: true, margin: "-50px" }}
                  key={group.baseName} 
                  className={cn(
                    "relative rounded-3xl p-8 transition-all duration-500 bg-white",
                    group.isRecommended || group.isLaunchOffer 
                      ? "border-2 border-emerald-500 shadow-[0_8px_30px_rgb(16,185,129,0.12)] scale-105 z-10" 
                      : "border border-zinc-200 hover:border-zinc-300 shadow-sm"
                  )}
                >
                  {(group.isRecommended || group.isLaunchOffer) && (
                     <div className="absolute -top-4 left-0 right-0 flex justify-center">
                       <span className="bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-md">
                         {group.isLaunchOffer ? "Launch Offer" : "Recommended"}
                       </span>
                     </div>
                  )}

                  <div className="mb-6">
                    <h4 className="text-xl font-bold text-zinc-900 mb-2">{group.baseName}</h4>
                    <p className="text-zinc-500 text-sm h-10">{activePlan.description}</p>
                  </div>

                  <div className="mb-6">
                    {isCustomPricing ? (
                      <div className="text-4xl font-bold text-zinc-900">Custom</div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-zinc-500 font-medium">{activePlan.currency}</span>
                        <span className="text-4xl font-bold text-zinc-900 tracking-tight">{activePlan.amount.toLocaleString()}</span>
                        <span className="text-zinc-500 font-medium">/{activePlan.billingCycle === "ANNUAL" ? "yr" : "mo"}</span>
                      </div>
                    )}
                  </div>

                  <button 
                    className={cn(
                      "w-full py-3 px-6 rounded-xl font-medium transition-all duration-300 mb-8 flex items-center justify-center active:scale-95",
                      group.isRecommended || group.isLaunchOffer
                        ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md"
                        : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                    )}
                  >
                    {isCustomPricing ? "Contact Sales" : "Get Started"}
                  </button>

                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-zinc-900 capitalize tracking-wider">Includes:</p>
                    <ul className="space-y-3">
                      {activePlan.features.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3 text-zinc-600 text-sm">
                          <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                          <span className="leading-snug">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
