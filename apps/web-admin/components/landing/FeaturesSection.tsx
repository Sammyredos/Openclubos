"use client";

import { motion } from "framer-motion";
import { Trophy, Activity, Map, Users, BarChart3, Smartphone } from "lucide-react";

const features = [
  {
    title: "Tournament Management",
    description: "Create, schedule, and manage tournaments with ease. Integrated leaderboards and automated payments.",
    icon: Trophy,
    color: "from-blue-500/20 to-indigo-500/20",
    colSpan: "md:col-span-2",
  },
  {
    title: "Live Scoring",
    description: "Real-time score tracking with group-based inputs, instant leaderboards for fans and participants.",
    icon: Activity,
    color: "from-purple-500/20 to-pink-500/20",
    colSpan: "md:col-span-1",
  },
  {
    title: "Course Management",
    description: "Manage golf courses, tees, and pars. Support for multiple courses and custom course ratings.",
    icon: Map,
    color: "from-emerald-500/20 to-teal-500/20",
    colSpan: "md:col-span-1",
  },
  {
    title: "Player Registration",
    description: "Streamlined registration with capacity management, waitlists, and automated email notifications.",
    icon: Users,
    color: "from-orange-500/20 to-red-500/20",
    colSpan: "md:col-span-2",
  },
  {
    title: "Powerful Analytics",
    description: "Revenue trends, club growth, and performance insights. Export detailed reports instantly.",
    icon: BarChart3,
    color: "from-blue-500/20 to-cyan-500/20",
    colSpan: "md:col-span-1.5",
  },
  {
    title: "Mobile App",
    description: "A comprehensive mobile experience for players and markers to enter scores direct from the green.",
    icon: Smartphone,
    color: "from-violet-500/20 to-purple-500/20",
    colSpan: "md:col-span-1.5",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-32 bg-black text-white relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-zinc-300 mb-6"
          >
            Powerful Features
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
          >
            Professional Tools for Modern Clubs
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-lg text-zinc-400"
          >
            Everything you need to manage your golf club, tournaments, and members in one unified, easy-to-use platform.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
          {features.map((feature, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true, margin: "-50px" }}
              className={`group relative rounded-3xl overflow-hidden border border-white/10 bg-zinc-900/50 p-8 hover:bg-zinc-900 transition-colors ${feature.colSpan}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10 h-full flex flex-col">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-auto group-hover:scale-110 transition-transform duration-500">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-zinc-400 leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
