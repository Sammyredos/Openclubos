"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "OpenClubOS transformed how we run our monthly member tournaments. The live scoring is a game changer for engagement.",
    author: "David Miller",
    title: "Manager, Pine Valley Golf Club",
    initials: "DM",
    bg: "from-blue-900/40 to-black"
  },
  {
    quote: "The analytics tools helped us increase our tournament revenue by 40% in just one season. Highly recommended!",
    author: "Sarah Jenkins",
    title: "Tournament Director, Oak Hills",
    initials: "SJ",
    bg: "from-purple-900/40 to-black"
  },
  {
    quote: "Setup was incredibly easy. Our players love the mobile interface and the professional look of our club profile.",
    author: "Robert Chen",
    title: "Head Pro, Summit Links",
    initials: "RC",
    bg: "from-emerald-900/40 to-black"
  },
  {
    quote: "I can't imagine going back to paper scorecards. The digital transition was seamless with this platform.",
    author: "Jessica Alba",
    title: "Event Coordinator, Pebble Beach",
    initials: "JA",
    bg: "from-orange-900/40 to-black"
  },
  {
    quote: "The best club management software we've used in the past 10 years. Simple, elegant, and incredibly powerful.",
    author: "Michael Chang",
    title: "President, City Golf Assoc.",
    initials: "MC",
    bg: "from-rose-900/40 to-black"
  }
];

export function TestimonialsSection() {
  return (
    <section className="py-32 bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900/20 to-black pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10 mb-16">
        <div className="text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-white"
          >
            Trusted by the Best
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-zinc-400 max-w-2xl mx-auto text-lg"
          >
            Join hundreds of clubs worldwide who have upgraded their management stack.
          </motion.p>
        </div>
      </div>

      {/* Infinite Scrolling Marquee */}
      <div className="relative flex overflow-x-hidden w-full group">
        <div className="absolute top-0 bottom-0 left-0 w-32 z-10 bg-gradient-to-r from-black to-transparent" />
        <div className="absolute top-0 bottom-0 right-0 w-32 z-10 bg-gradient-to-l from-black to-transparent" />
        
        <div className="py-12 animate-marquee whitespace-nowrap flex gap-8 px-4 group-hover:[animation-play-state:paused]">
          {[...testimonials, ...testimonials].map((testimonial, idx) => (
            <div 
              key={idx} 
              className={`inline-flex flex-col whitespace-normal min-w-[350px] md:min-w-[400px] bg-gradient-to-br ${testimonial.bg} rounded-3xl p-8 border border-white/10 backdrop-blur-sm`}
            >
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                ))}
              </div>
              <p className="text-zinc-300 text-lg leading-relaxed mb-8 italic">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-4 mt-auto">
                <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-white shadow-inner">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="font-semibold text-white">{testimonial.author}</p>
                  <p className="text-sm text-zinc-500">{testimonial.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
