"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import Image from "next/image";

interface Testimonial {
  quote: string;
  author: string;
  title?: string;
  initials: string;
  role?: string;
  avatar?: string | null;
}

const testimonials: Testimonial[] = [
  {
    quote: "OpenClubOS transformed how we run our monthly member tournaments. The live scoring is a game changer for engagement.",
    author: "David Miller",
    title: "Manager, Pine Valley Golf Club",
    initials: "DM",
  },
  {
    quote: "The analytics tools helped us increase our tournament revenue by 40% in just one season. Highly recommended!",
    author: "Sarah Jenkins",
    title: "Tournament Director, Oak Hills",
    initials: "SJ",
  },
  {
    quote: "Setup was incredibly easy. Our players love the mobile interface and the professional look of our club profile.",
    author: "Robert Chen",
    title: "Head Pro, Summit Links",
    initials: "RC",
  },
  {
    quote: "I can't imagine going back to paper scorecards. The digital transition was seamless with this platform.",
    author: "Jessica Alba",
    title: "Event Coordinator, Pebble Beach",
    initials: "JA",
  },
  {
    quote: "The best club management software we've used in the past 10 years. Simple, elegant, and incredibly powerful.",
    author: "Michael Chang",
    title: "President, City Golf Assoc.",
    initials: "MC",
    role: "President, City Golf Assoc.",
    avatar: null,
  }
];

export function TestimonialsSection() {
  return (
    <section className="py-32 bg-[#fafafa] overflow-hidden relative">
      <div className="container mx-auto px-4 relative z-10 mb-16">
        <div className="text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6"
          >
            Loved by Tournament Directors
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-lg text-zinc-500 max-w-2xl mx-auto"
          >
            Don't just take our word for it. Here's what golf professionals are saying about Openclub OS.
          </motion.p>
        </div>
      </div>

      {/* Marquee Container */}
      <div className="relative flex flex-col gap-8 w-[200%] md:w-[150%] -left-[50%] md:-left-[25%] rotate-[-2deg]">
        <div className="flex animate-marquee gap-8">
          {[...testimonials, ...testimonials].map((t, i) => (
            <div 
              key={i}
              className="w-[400px] flex-shrink-0 bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                ))}
              </div>
              <p className="text-zinc-700 text-lg mb-6 leading-relaxed">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-500 overflow-hidden relative border border-zinc-200">
                  {t.avatar ? (
                    <Image src={t.avatar} alt={t.author} fill className="object-cover" />
                  ) : (
                    t.author.charAt(0)
                  )}
                </div>
                <div>
                  <div className="font-semibold text-zinc-900">{t.author}</div>
                  <div className="text-sm text-zinc-500">{t.role || t.title}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edge Gradients for Marquee (Light Mode) */}
      <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-[#fafafa] to-transparent z-10" />
      <div className="absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-[#fafafa] to-transparent z-10" />
    </section>
  );
}
