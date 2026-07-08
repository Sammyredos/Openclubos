"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, ChevronRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#fafafa] text-zinc-900 pt-20">
      {/* 21st.dev inspired Animated Background / Glows - Light Mode Edition */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[60%] h-[40%] rounded-full bg-blue-300/30 blur-[120px] mix-blend-multiply" />
        <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-300/30 blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[10%] w-[50%] h-[50%] rounded-full bg-teal-300/30 blur-[150px] mix-blend-multiply" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6 flex flex-col items-center text-center">
        {/* 21st.dev style Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 flex items-center justify-center"
        >
          <Link href="/changelog" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-zinc-200/60 backdrop-blur-md text-sm font-medium text-zinc-600 hover:bg-white/80 hover:border-zinc-300 transition-all cursor-pointer group shadow-sm">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100">
              <Sparkles className="w-3 h-3 text-blue-600" />
            </span>
            <span className="ml-1">Introducing Openclub OS 2.0</span>
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 leading-[1.1]"
        >
          Manage your club with <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-emerald-600 to-teal-500">
            Effortless Precision
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mx-auto text-lg md:text-xl text-zinc-500 mb-10 leading-relaxed"
        >
          A premium, all-in-one software ecosystem designed for modern golf clubs, tournament directors, and professional memberships.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
        >
          <Link
            href="/signup-organisation"
            className="group relative flex h-12 items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 text-sm font-semibold text-white transition-all hover:scale-[0.98] active:scale-95 shadow-[0_4px_14px_0_rgb(16,185,129,0.39)] hover:bg-emerald-700 hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)]"
          >
            Start for free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="#features"
            className="flex h-12 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-8 text-sm font-medium text-zinc-700 transition-all hover:bg-zinc-50 hover:border-zinc-300 active:scale-95 shadow-sm"
          >
            Book a demo
          </Link>
        </motion.div>

        {/* 21st.dev style Dashboard Preview (Light Mode) */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-5xl mx-auto"
        >
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-black/5 to-transparent blur-xl opacity-50" />
          <div className="relative rounded-2xl border border-zinc-200/50 bg-white/70 backdrop-blur-xl p-2 md:p-4 ring-1 ring-zinc-900/5 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent opacity-50" />
            {/* Fake UI Header */}
            <div className="flex items-center gap-2 px-3 pb-3 border-b border-zinc-200/50 mb-4">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
            </div>
            {/* Mock Dashboard Content */}
            <div className="aspect-[16/9] bg-zinc-50/80 rounded-xl border border-zinc-200/50 flex items-center justify-center relative overflow-hidden shadow-inner">
               <div className="absolute inset-0 flex items-center justify-center text-zinc-400 font-medium">
                  [Dashboard Preview Graphic / Dashboard Component]
               </div>
               {/* Decorative grid inside preview */}
               <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:16px_16px]" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
