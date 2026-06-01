import { Trophy, Activity, Map, Users, BarChart3, Smartphone } from "lucide-react";

const features = [
  {
    title: "Tournament Management",
    description: "Create, schedule, and manage tournaments with ease. Integrated leaderboards and automated payments.",
    icon: Trophy,
  },
  {
    title: "Live Scoring",
    description: "Real-time score tracking with group-based inputs, instant leaderboards for fans and participants.",
    icon: Activity,
  },
  {
    title: "Course Management",
    description: "Manage golf courses, tees, and pars. Support for multiple courses and custom course ratings.",
    icon: Map,
  },
  {
    title: "Player Registration",
    description: "Streamlined registration with capacity management, waitlists, and automated email notifications.",
    icon: Users,
  },
  {
    title: "Powerful Analytics",
    description: "Revenue trends, club growth, and performance insights. Export detailed reports instantly.",
    icon: BarChart3,
  },
  {
    title: "Mobile App",
    description: "A comprehensive mobile experience for players and markers to enter scores direct from the green.",
    icon: Smartphone,
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Professional Tools for Modern Clubs
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to manage your golf club, tournaments, and members in one unified, easy-to-use platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-background rounded-2xl p-8 border border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-landing/10 flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-landing" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
