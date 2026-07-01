"use client";

import { motion } from "framer-motion";

export function StatsSection() {
  const stats = [
    { label: "Organizers", value: "2,000+" },
    { label: "Tournaments", value: "10,000+" },
    { label: "Players", value: "50,000+" },
    { label: "Golf Clubs", value: "500+" }
  ];

  return (
    <section className="py-24 bg-black text-white relative overflow-hidden border-y border-white/10">
      <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/dzl9yxixg/image/upload/v1714558603/grid_1_uzvj2k.svg')] opacity-[0.05] pointer-events-none" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center md:divide-x divide-white/10">
          {stats.map((stat, idx) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
              className="flex flex-col items-center justify-center p-4"
            >
              <h3 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-zinc-500 mb-3">
                {stat.value}
              </h3>
              <p className="text-sm font-medium text-zinc-400 uppercase tracking-[0.2em]">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
