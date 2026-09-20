import * as React from "react";
import { cn } from "@/lib/utils";

interface BrandLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "icon" | "full";
  badgeClassName?: string;
  textClassName?: string;
  theme?: "light" | "dark";
}

const sizeConfig = {
  xs: {
    container: "w-6 h-6 rounded-[7px]",
    svg: 24,
    textSize: "text-sm",
    gap: "gap-2",
  },
  sm: {
    container: "w-8 h-8 rounded-[10px]",
    svg: 32,
    textSize: "text-base",
    gap: "gap-2.5",
  },
  md: {
    container: "w-10 h-10 rounded-[12px]",
    svg: 40,
    textSize: "text-lg",
    gap: "gap-3",
  },
  lg: {
    container: "w-12 h-12 rounded-[15px]",
    svg: 48,
    textSize: "text-xl",
    gap: "gap-3.5",
  },
  xl: {
    container: "w-16 h-16 rounded-[20px]",
    svg: 64,
    textSize: "text-2xl",
    gap: "gap-4",
  },
};

export function BrandLogoIcon({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-label="OpenclubOS Logo"
    >
      <rect width="64" height="64" rx="18" fill="#009A60" />
      <g stroke="#FFFFFF" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M38.5 33.5c.7-1.7 2.1-3 3.5-4.4 1.5-1.4 2.5-3.3 2.5-5.6a12.5 12.5 0 1 0-25 0c0 2.3 1 4.2 2.5 5.6 1.4 1.4 2.8 2.7 3.5 4.4" />
        <path d="M25.5 38.5h13" />
        <path d="M28 43.5h8" />
      </g>
    </svg>
  );
}

export function BrandLogo({
  size = "md",
  variant = "full",
  badgeClassName,
  textClassName,
  theme = "light",
  className,
  ...props
}: BrandLogoProps) {
  const config = sizeConfig[size] || sizeConfig.md;

  return (
    <div className={cn("inline-flex items-center select-none", config.gap, className)} {...props}>
      <div
        className={cn(
          "bg-[#009A60] flex items-center justify-center shrink-0 shadow-sm transition-transform",
          config.container,
          badgeClassName
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 64 64"
          className="w-[62%] h-[62%]"
          fill="none"
        >
          <g stroke="#FFFFFF" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M38.5 33.5c.7-1.7 2.1-3 3.5-4.4 1.5-1.4 2.5-3.3 2.5-5.6a12.5 12.5 0 1 0-25 0c0 2.3 1 4.2 2.5 5.6 1.4 1.4 2.8 2.7 3.5 4.4" />
            <path d="M25.5 38.5h13" />
            <path d="M28 43.5h8" />
          </g>
        </svg>
      </div>

      {variant === "full" && (
        <span
          className={cn(
            "font-extrabold tracking-tight leading-none",
            theme === "dark" ? "text-white" : "text-[#0F172A]",
            config.textSize,
            textClassName
          )}
        >
          Openclub<span className="text-[#009A60]">OS</span>
        </span>
      )}
    </div>
  );
}
