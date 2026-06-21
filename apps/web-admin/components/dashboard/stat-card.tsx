import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "increase" | "decrease" | "neutral";
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  subValue?: string;
  subIcon?: LucideIcon;
  loading?: boolean;
}

function inferChangeType(change?: string): "increase" | "decrease" | "neutral" {
  if (!change) return "neutral";
  const t = change.trim();
  if (t.startsWith("-")) return "decrease";
  if (t.startsWith("+")) return "increase";
  return "neutral";
}

function formatChangeDisplay(change: string) {
  const t = change.trim();
  const sign = t.startsWith("-") ? "-" : t.startsWith("+") ? "+" : "";
  const body = sign ? t.slice(1).trim() : t;
  if (body.includes("%")) return `${sign}${body}`;

  const num = parseFloat(body.replace(/[^0-9.]+/g, ""));
  if (Number.isNaN(num)) return change;

  const isNaira = body.includes("₦");
  const formatted = isNaira ? formatNumber(`₦${num}`) : formatNumber(num);
  if (sign === "-") return `-${formatted.replace(/^-/, "")}`;
  if (sign === "+") return `+${formatted.replace(/^[+-]/, "")}`;
  return formatted;
}

export function StatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  iconBg,
  iconColor,
  subValue,
  subIcon: SubIcon,
  loading = false,
}: StatCardProps) {
  const resolvedChangeType = changeType ?? inferChangeType(change);
  return (
    <div className="bg-white rounded-lg p-6 shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] flex flex-col justify-between font-sans h-36 border-none transition-all duration-300 hover:shadow-md">
      <div className="flex justify-between items-start w-full">
        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0", iconBg)}>
          <Icon className={cn("w-6 h-6", iconColor)} />
        </div>
        
        {/* Right Corner Metric */}
        {(!loading && change) && (
          <div className="flex items-center gap-1 shrink-0 bg-gray-50 px-2 py-1 rounded-full">
            {resolvedChangeType !== "decrease" ? (
              <TrendingUp className="h-3.5 w-3.5 text-[#15803D]" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            )}
            <span
              className={cn(
                "text-[12px] font-medium",
                resolvedChangeType !== "decrease" ? "text-[#15803D]" : "text-red-500"
              )}
            >
              {formatChangeDisplay(change)}
            </span>
          </div>
        )}
        
        {(!loading && !change && subValue) && (
          <div className="flex items-center gap-1 shrink-0 bg-gray-50 px-2 py-1 rounded-full">
            {SubIcon && <SubIcon className="h-3.5 w-3.5 text-blue-500" />}
            <span className="text-[12px] text-gray-500 font-medium">
              {subValue}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col mt-auto gap-1">
        {loading ? (
          <>
            <Skeleton className="h-8 w-28 rounded-lg mt-2" />
            <Skeleton className="h-4 w-20 rounded-lg" />
          </>
        ) : (
          <>
            <div className="text-zinc-800 text-[28px] font-medium leading-none truncate" title={value}>
              {formatNumber(value)}
            </div>
            <div className="text-zinc-500 text-[13px] font-medium truncate">
              {title}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
