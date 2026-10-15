"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { validateResetTokenRequest } from "@/lib/api/auth";

export default function AppRedirectPage() {
  return (
    <React.Suspense fallback={<RedirectSkeleton />}>
      <AppRedirectContent />
    </React.Suspense>
  );
}

function RedirectSkeleton() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 font-sans text-zinc-900">
      <div className="w-full max-w-[1440px] mx-auto flex justify-center relative">
        <div className="w-full flex flex-col items-center justify-center p-2 md:p-8 lg:p-16 relative">
          <div className="w-full max-w-[480px] md:max-w-[420px] lg:max-w-[730px] flex flex-col justify-center bg-white rounded-3xl p-6 md:p-10 lg:p-16 border border-zinc-100 shadow-xs relative z-10">
            {/* Header skeleton */}
            <div className="text-center w-full mb-8 flex flex-col items-center">
              <div className="h-8 w-48 bg-zinc-200/80 rounded-lg animate-pulse mb-3" />
              <div className="h-4 w-60 bg-zinc-100 rounded-md animate-pulse" />
            </div>

            {/* Form Fields skeleton */}
            <div className="space-y-6 w-full">
              <div>
                <div className="h-4 w-28 bg-zinc-200/80 rounded animate-pulse mb-2.5" />
                <div className="h-12 w-full bg-[#f5faf6] border border-[#e1efe5] rounded-xl animate-pulse" />
              </div>
              <div>
                <div className="h-4 w-32 bg-zinc-200/80 rounded animate-pulse mb-2.5" />
                <div className="h-12 w-full bg-[#f5faf6] border border-[#e1efe5] rounded-xl animate-pulse" />
              </div>
              <div className="h-12 w-full bg-emerald-600/30 rounded-xl animate-pulse mt-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppRedirectContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const action = searchParams.get("action") || "reset-password";

  const [isTokenInvalid, setIsTokenInvalid] = React.useState(false);
  const [invalidMsg, setInvalidMsg] = React.useState("");

  React.useEffect(() => {
    if (!token) {
      setIsTokenInvalid(true);
      setInvalidMsg("Missing password reset token. Please request a new link.");
      return;
    }

    const isMobileDevice = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const deepLink = `openclub://${action}?token=${encodeURIComponent(token)}`;
    const fallbackSimulatorUrl = `/mobile-preview?screen=reset-password&token=${encodeURIComponent(token)}`;

    // If on mobile device, immediately launch deep link
    if (isMobileDevice) {
      window.location.replace(deepLink);
    }

    let isMounted = true;
    validateResetTokenRequest(token)
      .then((res) => {
        if (!isMounted) return;
        if (!res.valid) {
          setIsTokenInvalid(true);
          setInvalidMsg(res.message || "Invalid or expired reset link. Please request a new one.");
          return;
        }

        if (res.isOrganizer) {
          // Organizer accounts must use the web admin portal
          window.location.replace(`/reset-password?token=${encodeURIComponent(token)}`);
          return;
        }

        // Player accounts: auto-redirect immediately to mobile app (or simulator if in desktop browser)
        if (isMobileDevice) {
          window.location.replace(deepLink);
        } else {
          window.location.replace(fallbackSimulatorUrl);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        if (isMobileDevice) {
          window.location.replace(deepLink);
        } else {
          window.location.replace(fallbackSimulatorUrl);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [action, token]);

  if (isTokenInvalid) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 p-4 font-sans text-zinc-900">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-zinc-200 shadow-xs p-8 text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5 text-red-500 shadow-xs">
            <AlertCircle className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h1 className="text-[20px] font-bold text-zinc-900 tracking-tight mb-2">Invalid or Expired Link</h1>
          <p className="text-[13px] text-zinc-500 leading-relaxed mb-6 font-normal">
            {invalidMsg || "The password reset link is invalid or has expired."}
          </p>
          <Link
            href="/forgot-password"
            className="w-full h-11 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 text-[13px] font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer no-underline capitalize"
          >
            <span>Request a New Link</span>
          </Link>
        </div>
      </div>
    );
  }

  // Render skeleton loader while auto-redirecting immediately — NO intermediate card interface
  return <RedirectSkeleton />;
}
