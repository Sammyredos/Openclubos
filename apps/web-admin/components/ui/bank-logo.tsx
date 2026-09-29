"use client";

import React, { useState } from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBankLogoUrl, getBankLogoFallbackUrl } from "@/lib/bank-logos";

interface BankLogoProps {
  bankName?: string | null;
  bankCode?: string | null;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
}

export function BankLogo({
  bankName,
  bankCode,
  className,
  size = "md",
}: BankLogoProps) {
  const primaryUrl = getBankLogoUrl(bankCode || bankName);
  const fallbackUrl = getBankLogoFallbackUrl(bankCode || bankName);

  const [currentSrc, setCurrentSrc] = useState<string | undefined>(primaryUrl);
  const [triedFallback, setTriedFallback] = useState(false);
  const [hasError, setHasError] = useState(false);

  React.useEffect(() => {
    const nextPrimary = getBankLogoUrl(bankCode || bankName);
    setCurrentSrc(nextPrimary);
    setTriedFallback(false);
    setHasError(false);
  }, [bankName, bankCode]);

  const handleImageError = () => {
    if (!triedFallback && fallbackUrl && fallbackUrl !== currentSrc) {
      setTriedFallback(true);
      setCurrentSrc(fallbackUrl);
    } else {
      setHasError(true);
    }
  };

  const sizeClasses = {
    xs: "w-6 h-6 rounded-lg",
    sm: "w-8 h-8 rounded-lg",
    md: "w-11 h-11 rounded-xl",
    lg: "w-14 h-14 rounded-2xl",
  };

  const iconSizes = {
    xs: "w-3.5 h-3.5",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  if (!currentSrc || hasError) {
    return (
      <div
        className={cn(
          "bg-emerald-50/90 border border-emerald-200/70 text-[#15803D] flex items-center justify-center shrink-0 shadow-xs ring-1 ring-emerald-500/10",
          sizeClasses[size],
          className
        )}
      >
        <Building2 className={iconSizes[size]} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-white border border-gray-200/90 flex items-center justify-center shrink-0 shadow-xs ring-1 ring-black/[0.04] overflow-hidden p-1 transition-all",
        sizeClasses[size],
        className
      )}
    >
      <img
        src={currentSrc}
        alt={bankName || "Bank Logo"}
        onError={handleImageError}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        className="w-full h-full object-contain filter drop-shadow-2xs transition-transform duration-200"
        loading="lazy"
      />
    </div>
  );
}
