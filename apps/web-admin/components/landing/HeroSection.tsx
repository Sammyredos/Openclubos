import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative pt-20 pb-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[800px] bg-landing/5 rounded-full blur-3xl -z-10" />

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column Content */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-landing/10 text-landing text-[12px] font-normal mb-6">
              <span className="flex h-2 w-2 rounded-full bg-landing"></span>
              New: Live Scoring V2.0
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight text-foreground leading-[1.1] mb-6">
              The All-in-One Platform <br />
              <span className="text-landing">Golf Tournaments</span>
            </h1>
            
            <p className="text-[14px] md:text-[14px] text-muted-foreground mb-8 max-w-lg leading-relaxed">
              Manage tournaments, players, courses and scores — all in one seamless platform. Trusted by 2,000+ organizers worldwide.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button size="lg" asChild className="w-full sm:w-auto rounded-full px-8 text-[13px] h-12 bg-landing text-landing-foreground hover:bg-landing/90 border-transparent">
                <Link href="/signup-organisation">Start Free Trial</Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full px-8 text-[13px] h-12 gap-2 bg-background hover:border-landing hover:text-landing transition-colors">
                <PlayCircle className="w-5 h-5" />
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Right Column Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl shadow-landing/10 bg-background/50 backdrop-blur-sm p-2">
              <Image
                src="/dashboard-mockup.png"
                alt="OpenClubOS Dashboard Preview"
                width={1200}
                height={800}
                className="w-full h-auto rounded-xl"
                priority
              />
            </div>
            {/* Decorative element behind image */}
            <div className="absolute -bottom-6 -right-6 w-64 h-64 bg-landing rounded-3xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
