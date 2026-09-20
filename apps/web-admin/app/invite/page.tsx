"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InviteDefaultPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/mobile-preview?screen=register");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#052417] flex items-center justify-center p-4">
      <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
