import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import Providers from "./providers";

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Toaster 
          richColors 
          position="top-right" 
          closeButton
          toastOptions={{
            className: `font-sans text-[15px] font-medium leading-snug shadow-lg rounded-2xl border border-gray-100`,
            duration: 4000,
          }}
        />
      </body>
    </html>
  );
}
