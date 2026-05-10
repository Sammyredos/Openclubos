import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import Providers from "./providers";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dmsans",
});

export const metadata: Metadata = {
  title: "Openclub Admin",
  description: "Openclub Golf Tournament Administration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${dmSans.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Toaster 
          richColors 
          position="top-center" 
          toastOptions={{
            className: `${dmSans.className} text-[15px] font-medium leading-snug`,
          }}
        />
      </body>
    </html>
  );
}
