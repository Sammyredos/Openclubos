import Link from "next/link";
import { Icons } from "@/components/ui/icons";

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
);

export function LandingFooter() {
  return (
    <footer className="bg-black pt-20 pb-10 border-t border-white/10 text-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10">
                <Icons.logo className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                OpenClub<span className="text-emerald-400">OS</span>
              </span>
            </div>
            <p className="text-zinc-400 max-w-sm leading-relaxed text-sm">
              Building the future of golf tournament management, one club at a time.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-6">Product</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="#" className="text-zinc-400 hover:text-white transition-colors">Features</Link></li>
              <li><Link href="#" className="text-zinc-400 hover:text-white transition-colors">Solutions</Link></li>
              <li><Link href="#" className="text-zinc-400 hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="#" className="text-zinc-400 hover:text-white transition-colors">Mobile App</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-6">Company</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="#" className="text-zinc-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="#" className="text-zinc-400 hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="#" className="text-zinc-400 hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="#" className="text-zinc-400 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-6">Support</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="#" className="text-zinc-400 hover:text-white transition-colors">Documentation</Link></li>
              <li><Link href="#" className="text-zinc-400 hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="#" className="text-zinc-400 hover:text-white transition-colors">API Status</Link></li>
              <li><Link href="#" className="text-zinc-400 hover:text-white transition-colors">Security</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex gap-4">
            <Link href="#" className="text-zinc-500 hover:text-white transition-colors">
              <TwitterIcon className="w-5 h-5" />
            </Link>
            <Link href="#" className="text-zinc-500 hover:text-white transition-colors">
              <FacebookIcon className="w-5 h-5" />
            </Link>
            <Link href="#" className="text-zinc-500 hover:text-white transition-colors">
              <InstagramIcon className="w-5 h-5" />
            </Link>
            <Link href="#" className="text-zinc-500 hover:text-white transition-colors">
              <LinkedinIcon className="w-5 h-5" />
            </Link>
          </div>
          <p className="text-zinc-500 text-sm">
            © {new Date().getFullYear()} OpenClubOS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
