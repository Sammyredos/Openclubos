import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";
import Providers from "./providers";

const nexa = localFont({
  src: [{ path: "../public/nexa-Regular.ttf", weight: "400", style: "normal" }],
  variable: "--font-nexa",
});

const nexaLight = localFont({
  src: [{ path: "../public/Nexa-Light.otf", weight: "400", style: "normal" }],
  variable: "--font-nexa-light",
});

const nexaBold = localFont({
  src: [{ path: "../public/Nexa-Bold.otf", weight: "400", style: "normal" }],
  variable: "--font-nexa-bold",
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
      className={`h-full antialiased ${nexa.variable} ${nexaLight.variable} ${nexaBold.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Toaster 
          richColors 
          position="top-center" 
          toastOptions={{
            className: `${nexa.className} text-[15px] font-medium leading-snug`,
          }}
        />
      </body>
    </html>
  );
}
