"use client";

import { useState } from "react";
import { MapPin, CalendarCheck, PenTool, Trophy, Check, ChevronRight } from "lucide-react";

interface PhaseData {
  title: string;
  subtitle: string;
  icon: any;
  image: string;
  points: string[];
}

export function StepsSection() {
  const [activePhase, setActivePhase] = useState<number>(1);

  const phaseData: Record<number, PhaseData> = {
    1: {
      title: "Plan & Configure",
      subtitle: "Setting the foundation for a flawless event.",
      icon: MapPin,
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
      icon: CalendarCheck,
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
      icon: PenTool,
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
      icon: Trophy,
      image: "/images/landing/phase_4.png",
      points: [
        "Instant final leaderboard broadcast to clubhouse TVs and mobile devices.",
        "Automated digital purse distribution to player wallets (integrated Stripe payouts).",
        "Permanent tournament archives and historical performance analytics for every player.",
      ],
    },
  };

  const data = phaseData[activePhase];
  const Icon = data.icon;

  return (
    <section className="py-24 bg-white" id="how-it-works">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-start gap-20">
          {/* Left Column */}
          <div className="lg:w-1/3 w-full">
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
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActivePhase(tab.id)}
                    className={`phase-tab w-full p-6 border rounded-xl flex items-center justify-between group cursor-pointer transition-all text-left ${
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
                      <h4
                        className={`font-extrabold ${
                          isActive ? "text-[#0F172A]" : "text-[#0F172A]"
                        }`}
                      >
                        {tab.title}
                      </h4>
                    </div>
                    <ChevronRight
                      className={`text-[#009A60] w-4 h-4 transition-opacity ${
                        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:w-2/3 w-full">
            <div
              id="phase-content-container"
              className="bg-[#F5FAF6] rounded-[40px] p-12 border border-[#E1EFE5] h-full flex flex-col justify-center min-h-[600px] transition-all duration-300"
            >
              <div className="flex items-center gap-6 mb-10">
                <div className="w-20 h-20 bg-[#009A60] rounded-3xl flex items-center justify-center text-white text-3xl shadow-xl shadow-[#009A60]/20 shrink-0">
                  <Icon className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-[#0F172A] mb-2">
                    Phase {activePhase}: {data.title}
                  </h3>
                  <p className="text-[#5B6B7F] font-medium">{data.subtitle}</p>
                </div>
              </div>

              <ul className="space-y-6 flex-grow mb-12">
                {data.points.map((p, pIdx) => (
                  <li key={pIdx} className="flex items-start gap-4">
                    <div className="w-6 h-6 bg-[#009A60]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Check className="w-3.5 h-3.5 text-[#009A60]" />
                    </div>
                    <p className="text-[#5B6B7F] font-medium leading-relaxed">{p}</p>
                  </li>
                ))}
              </ul>

              <div className="overflow-hidden rounded-3xl shadow-2xl h-[300px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.image}
                  alt={data.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
