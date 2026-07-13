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
        <div className="w-16 h-16 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,#F0FDF4_0%,transparent_100%)] flex items-center justify-center mb-6">
          <Icon className="w-6 h-6 text-[#15803D]" />
        </div>
        <h3 className="text-[15px] font-normal text-slate-900 mb-2 capitalize">{title}</h3>
        {description && <p className="text-[14px] text-gray-500 max-w-[280px] leading-relaxed capitalize">{description}</p>}
        {action && <div className="mt-6">{action}</div>}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      <div className="w-24 h-24 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,#F0FDF4_0%,transparent_100%)] flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-[#15803D]" />
      </div>
      <h3 className="text-[15px] font-normal text-slate-900 mb-2 capitalize">{title}</h3>
      {description && (
        <p className="text-[14px] text-gray-500 max-w-[400px] leading-relaxed mb-8 capitalize">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
