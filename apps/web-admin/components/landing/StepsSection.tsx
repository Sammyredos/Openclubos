"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export function StepsSection() {
  const steps = [
    {
      number: "01",
      title: "Set Up Your Club",
      description: "Input your course details, add members and your club profile will be up and running fast."
    },
    {
      number: "02",
      title: "Create Tournaments",
      description: "Define format, dates, and pricing. Open registrations and watch your roster fill up."
    },
    {
      number: "03",
      title: "Manage Live Scoring",
      description: "Players enter scores directly from the field. Live leaderboards update instantly for all."
    }
  ];

  return (
    <section className="py-32 bg-black text-white relative border-y border-white/10 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6"
          >
            Get Started in 3 Simple Steps
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-lg text-zinc-400 max-w-2xl mx-auto"
          >
            We've made the onboarding process as frictionless as possible. You can go from sign up to your first live tournament in minutes.
          </motion.p>
        </div>

        <div className="max-w-5xl mx-auto relative">
          {/* Horizontal line for desktop connecting the steps */}
          <div className="hidden md:block absolute top-12 left-32 right-32 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          <div className="grid md:grid-cols-3 gap-12 relative z-10">
            {steps.map((step, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.2 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center group"
              >
                <div className="relative w-24 h-24 flex items-center justify-center mb-8">
                  {/* Glowing ring effect */}
                  <div className="absolute inset-0 rounded-full bg-white/5 border border-white/20 group-hover:scale-110 group-hover:border-white/40 transition-all duration-500" />
                  <div className="absolute inset-2 rounded-full bg-white/10 border border-white/10 group-hover:scale-105 transition-all duration-500 delay-75" />
                  <span className="text-2xl font-bold text-white relative z-10">{step.number}</span>
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2 justify-center">
                  {step.title}
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </h3>
                <p className="text-zinc-400 leading-relaxed max-w-sm">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
