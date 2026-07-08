"use client";

import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

function AnimatedCounter({ value, duration = 2 }: { value: number, duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());

  useEffect(() => {
    if (inView) {
      spring.set(value);
    }
  }, [inView, spring, value]);

  return <motion.span ref={ref}>{display}</motion.span>;
}

export function StatsSection() {
  const stats = [
    { label: "Organizers", value: 2000, suffix: "+" },
    { label: "Tournaments", value: 10000, suffix: "+" },
    { label: "Players", value: 50000, suffix: "+" },
    { label: "Golf Clubs", value: 500, suffix: "+" }
  ];

  return (
    <section className="py-24 bg-white text-zinc-900 relative overflow-hidden border-t border-zinc-200">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-zinc-100 via-white to-white pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y divide-zinc-100 md:divide-y-0 md:divide-x md:divide-zinc-200">
          {stats.map((stat, idx) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true, margin: "-50px" }}
              className="flex flex-col items-center justify-center p-6 md:p-4"
            >
              <h3 className="text-4xl md:text-5xl font-bold text-zinc-900 mb-2 tracking-tight flex items-center">
                <AnimatedCounter value={stat.value} />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 ml-1">
                  {stat.suffix}
                </span>
              </h3>
              <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest mt-2">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
