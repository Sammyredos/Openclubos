import React from "react";
import { LucideIcon, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  variant?: "default" | "minimal";
}

export function EmptyState({
  icon: Icon = Search,
  title,
  description,
  action,
  className,
  variant = "default",
}: EmptyStateProps) {
  if (variant === "minimal") {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 px-6 text-center", className)}>
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6 border border-emerald-100/50 shadow-sm">
          <Icon className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-[16px] font-bold text-gray-950 mb-2">{title}</h3>
        {description && <p className="text-[13px] text-gray-500 max-w-[280px] leading-relaxed">{description}</p>}
        {action && <div className="mt-6">{action}</div>}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center bg-white rounded-3xl border border-[#e7e7e7] shadow-sm",
        className
      )}
    >
      <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6 ring-8 ring-emerald-50/50">
        <Icon className="w-10 h-10 text-emerald-500" />
      </div>
      <h3 className="text-[14px] font-bold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-[15px] text-gray-500 max-w-[320px] leading-relaxed mb-8">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
