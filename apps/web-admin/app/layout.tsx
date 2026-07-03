import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import Providers from "./providers";
import localFont from 'next/font/local';

const nowFont = localFont({
  src: [
    {
      path: './fonts/Now-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/Now-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: './fonts/Now-Bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-now',
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
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
      </head>
      <body className={`min-h-full flex flex-col font-sans ${nowFont.variable}`} suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Toaster 
          richColors 
          position="top-right" 
          closeButton
          toastOptions={{
            className: `font-sans text-[15px] font-normal leading-snug shadow-lg rounded-2xl border border-gray-100`,
            duration: 4000,
          }}
        />
      </body>
    </html>
  );
}
