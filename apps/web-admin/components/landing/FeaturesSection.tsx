"use client";

import { motion } from "framer-motion";
import { Trophy, Activity, Map, Users, BarChart3, Smartphone } from "lucide-react";

const features = [
  {
    title: "Tournament Management",
    description: "Create, schedule, and manage tournaments with ease. Integrated leaderboards and automated payments.",
    icon: Trophy,
    color: "from-blue-50 to-indigo-50",
    hoverColor: "group-hover:from-blue-100/50 group-hover:to-indigo-100/50",
    iconColor: "text-blue-600 bg-blue-100",
    colSpan: "md:col-span-2 md:row-span-2",
  },
  {
    title: "Live Scoring",
    description: "Real-time score tracking with group-based inputs, instant leaderboards for fans and participants.",
    icon: Activity,
    color: "from-purple-50 to-pink-50",
    hoverColor: "group-hover:from-purple-100/50 group-hover:to-pink-100/50",
    iconColor: "text-purple-600 bg-purple-100",
    colSpan: "md:col-span-1",
  },
  {
    title: "Course Management",
    description: "Manage golf courses, tees, and pars. Support for multiple courses and custom course ratings.",
    icon: Map,
    color: "from-emerald-50 to-teal-50",
    hoverColor: "group-hover:from-emerald-100/50 group-hover:to-teal-100/50",
    iconColor: "text-emerald-600 bg-emerald-100",
    colSpan: "md:col-span-1",
  },
  {
    title: "Player Registration",
    description: "Streamlined registration with capacity management, waitlists, and automated email notifications.",
    icon: Users,
    color: "from-orange-50 to-red-50",
    hoverColor: "group-hover:from-orange-100/50 group-hover:to-red-100/50",
    iconColor: "text-orange-600 bg-orange-100",
    colSpan: "md:col-span-1",
  },
  {
    title: "Powerful Analytics",
    description: "Revenue trends, club growth, and performance insights. Export detailed reports instantly.",
    icon: BarChart3,
    color: "from-blue-50 to-cyan-50",
    hoverColor: "group-hover:from-blue-100/50 group-hover:to-cyan-100/50",
    iconColor: "text-cyan-600 bg-cyan-100",
    colSpan: "md:col-span-2",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-32 bg-[#fafafa] text-zinc-900 relative border-t border-zinc-200">
      {/* Background Glow */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-white to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-zinc-200 text-sm font-medium text-emerald-600 mb-6 shadow-sm"
          >
            Powerful Features
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-tight text-zinc-900"
          >
            Professional Tools for <br className="hidden sm:block" /> Modern Clubs
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="text-lg text-zinc-500 max-w-2xl"
          >
            Everything you need to manage your golf club, tournaments, and members in one unified, seamlessly integrated platform.
          </motion.p>
        </div>

        {/* 21st.dev inspired Bento Grid (Light Mode) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-[280px]">
          {features.map((feature, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true, margin: "-50px" }}
              className={`group relative rounded-3xl overflow-hidden border border-zinc-200 bg-white p-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 cursor-default ${feature.colSpan}`}
            >
              {/* Subtle Gradient Background that intensifies on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} ${feature.hoverColor} opacity-50 transition-colors duration-500`} />
              
              <div className="relative z-10 h-full flex flex-col">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-auto group-hover:scale-110 transition-all duration-500 shadow-sm ${feature.iconColor}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                
                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-zinc-900 mb-2">{feature.title}</h3>
                  <p className="text-zinc-500 leading-relaxed text-sm">
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
