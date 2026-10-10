import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Mobile App Preview",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070B12]" />}>
      {children}
    </Suspense>
  );
}
