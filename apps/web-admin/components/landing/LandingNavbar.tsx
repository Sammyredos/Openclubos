import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";

export function LandingNavbar() {
  return (
    <header className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-zinc-200">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-200 group-hover:bg-zinc-100 transition-colors">
            <Icons.logo className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="font-bold text-xl tracking-tight text-zinc-900">
            OpenClub<span className="text-emerald-600">OS</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-zinc-500">
          <Link href="#features" className="hover:text-zinc-900 transition-colors">Features</Link>
          <Link href="#tournaments" className="hover:text-zinc-900 transition-colors">Tournaments</Link>
          <Link href="#clubs" className="hover:text-zinc-900 transition-colors">Clubs</Link>
          <Link href="#admin" className="hover:text-zinc-900 transition-colors">Admin</Link>
          <Link href="#pricing" className="hover:text-zinc-900 transition-colors">Pricing</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
            Sign in
          </Link>
          <Button asChild className="rounded-full px-6 bg-zinc-900 text-white hover:bg-zinc-800 font-semibold shadow-md">
            <Link href="/signup-organisation">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
