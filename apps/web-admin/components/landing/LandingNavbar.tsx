import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-black/50 backdrop-blur-xl border-b border-white/10">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
            <Icons.logo className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">
            OpenClub<span className="text-emerald-400">OS</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-zinc-400">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#tournaments" className="hover:text-white transition-colors">Tournaments</Link>
          <Link href="#clubs" className="hover:text-white transition-colors">Clubs</Link>
          <Link href="#admin" className="hover:text-white transition-colors">Admin</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
            Sign in
          </Link>
          <Button asChild className="rounded-full px-6 bg-white text-black hover:bg-zinc-200 font-semibold shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            <Link href="/signup-organisation">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
