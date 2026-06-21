import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface FilterSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: LucideIcon;
  label: string;
  options: { value: string; label: string }[];
  activeColorValue?: string; // If value !== activeColorValue, or whatever logic to make text green
}

export function FilterSelect({
  icon: Icon,
  label,
  options,
  activeColorValue,
  className,
  ...props
}: FilterSelectProps) {
  // Determine if the current value should be highlighted in green
  const isHighlighted = activeColorValue !== undefined && props.value !== activeColorValue;

  return (
    <div className={cn("flex items-center bg-white border border-[#e1efe5] rounded-none focus-within:ring-2 focus-within:ring-openclub-700/20 focus-within:border-openclub-700 transition-all overflow-hidden", className)}>
      <div className="flex items-center gap-1.5 pl-3 pr-2 py-2 bg-[#fbfbfb] border-r border-[#e1efe5] h-10">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-500" />}
        <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <select
        className={cn(
          "h-10 pl-3 pr-8 text-[13px] font-normal bg-transparent border-none focus:ring-0 cursor-pointer appearance-none outline-none",
          isHighlighted ? "text-openclub-800" : "text-gray-900"
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23${isHighlighted ? '10b981' : '9CA3AF'}%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.75rem top 50%',
          backgroundSize: '0.65rem auto'
        }}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
