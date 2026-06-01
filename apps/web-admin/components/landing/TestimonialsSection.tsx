import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "OpenClubOS transformed how we run our monthly member tournaments. The live scoring is a game changer for engagement.",
    author: "David Miller",
    title: "Manager, Pine Valley Golf Club",
    initials: "DM"
  },
  {
    quote: "The analytics tools helped us increase our tournament revenue by 40% in just one season. Highly recommended!",
    author: "Sarah Jenkins",
    title: "Tournament Director, Oak Hills",
    initials: "SJ"
  },
  {
    quote: "Setup was incredibly easy. Our players love the mobile interface and the professional look of our club profile.",
    author: "Robert Chen",
    title: "Head Pro, Summit Links",
    initials: "RC"
  }
];

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-slate-900 text-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">
            Trusted by the Best
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, idx) => (
            <div key={idx} className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-landing text-landing" />
                ))}
              </div>
              <p className="text-slate-300 text-lg leading-relaxed mb-8 italic">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="font-bold text-slate-100">{testimonial.author}</p>
                  <p className="text-sm text-slate-400">{testimonial.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
