import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";
import Providers from "./providers";

const apercu = localFont({
  src: [
    {
      path: "../public/apercu_regular_pro.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/apercu_medium_pro.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/apercu_bold_pro.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-apercu",
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
      className={`h-full antialiased ${apercu.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Toaster 
          richColors 
          position="top-center" 
          toastOptions={{
            className: `${apercu.className} text-[15px] font-semibold leading-snug`,
          }}
        />
      </body>
    </html>
  );
}
