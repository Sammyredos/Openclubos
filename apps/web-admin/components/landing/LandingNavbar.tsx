import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-transparent">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-landing text-landing-foreground">
            <Icons.logo className="w-5 h-5" />
          </div>
          <span className="font-normal text-[14px] tracking-tight text-foreground">
            OpenClub<span className="text-landing">OS</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 font-normal text-[12px] text-foreground/80">
          <Link href="#features" className="hover:text-landing transition-colors">Features</Link>
          <Link href="#tournaments" className="hover:text-landing transition-colors">Tournaments</Link>
          <Link href="#clubs" className="hover:text-landing transition-colors">Clubs</Link>
          <Link href="#admin" className="hover:text-landing transition-colors">Admin</Link>
          <Link href="#pricing" className="hover:text-landing transition-colors">Pricing</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-[12px] font-normal hover:text-landing transition-colors">
            Sign in
          </Link>
          <Button asChild className="rounded-full px-6 font-normal bg-landing text-landing-foreground hover:bg-landing/90 border-transparent">
            <Link href="/signup-organisation">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
