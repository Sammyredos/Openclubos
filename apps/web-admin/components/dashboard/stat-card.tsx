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
    <Card className="border-[#efefef] bg-white rounded-xl hover:border-emerald-200 shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-xl flex-shrink-0 shadow-sm", iconBg)}>
            <Icon className={cn("h-6 w-6 shadow-emerald-500/10", iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-medium text-gray-500 truncate">{title}</p>
            {loading ? (
              <div className="mt-2">
                <Skeleton className="h-8 w-28 rounded-lg" />
              </div>
            ) : (
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 truncate" title={value}>
                {formatNumber(value)}
              </h3>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1">
          {!loading && change && (
            <div className="flex items-center gap-1.5 shrink-0">
              {resolvedChangeType !== "decrease" ? (
                <TrendingUp className="h-4.5 w-4.5 text-[#10b981]" />
              ) : (
                <TrendingDown className="h-4.5 w-4.5 text-red-500" />
              )}
              <span
                className={cn(
                  "text-[14px] font-bold",
                  resolvedChangeType !== "decrease" ? "text-[#10b981]" : "text-red-500"
                )}
              >
                {formatChangeDisplay(change)}
              </span>
              <span className="text-[13px] text-gray-400">this month</span>
            </div>
          )}
          {loading ? (
            <Skeleton className="h-4 w-32 rounded-md" />
          ) : subValue ? (
            <div className="flex items-center gap-1 shrink-0">
              {SubIcon && <SubIcon className="h-4 w-4 text-blue-500" />}
              <span className="text-[13px] text-gray-400 font-medium">{subValue}</span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
