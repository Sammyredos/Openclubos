import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import Providers from "./providers";
import localFont from 'next/font/local';

const zxgamutFont = localFont({
  src: [
    {
      path: './fonts/ZxGamut-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: './fonts/ZxGamut-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/ZxGamut-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: './fonts/ZxGamut-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-zxgamut',
});

export const metadata: Metadata = {
  title: {
    template: "%s | Openclub Admin",
    default: "Openclub Admin",
  },
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
      <body className={`min-h-full flex flex-col font-sans ${zxgamutFont.variable}`} suppressHydrationWarning>
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
