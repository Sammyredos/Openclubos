"use client";

import * as React from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  minDate?: string;
  maxDate?: string;
  disablePast?: boolean;
  disableFuture?: boolean;
  isDateDisabled?: (ymd: string) => boolean;
  onInvalidSelect?: (args: { ymd: string; reason: "minDate" | "maxDate" | "past" | "future" | "custom" }) => void;
  className?: string;
  buttonClassName?: string;
};

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function toYMD(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseYMD(value: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const year = Number(m[1]);
  const monthIndex = Number(m[2]) - 1;
  const day = Number(m[3]);
  const d = new Date(year, monthIndex, day);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getFullYear() !== year || d.getMonth() !== monthIndex || d.getDate() !== day) return null;
  return d;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DatePicker({
  value,
  onValueChange,
  placeholder = "Select date...",
  disabled,
  allowClear,
  minDate,
  maxDate,
  disablePast,
  disableFuture,
  isDateDisabled,
  className,
  buttonClassName,
}: DatePickerProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = React.useState(false);

  const selectedDate = React.useMemo(() => (value ? parseYMD(value) : null), [value]);
  const [viewMonth, setViewMonth] = React.useState<Date>(() => selectedDate ?? new Date());

  React.useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (!ref.current) return;
      if (e.target instanceof Node && !ref.current.contains(e.target)) setOpen(false);
    }
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    if (selectedDate) setViewMonth(selectedDate);
  }, [open, selectedDate]);

  const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const monthEnd = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
  const daysInMonth = monthEnd.getDate();
  const startWeekday = monthStart.getDay();

  const titleFmt = React.useMemo(
    () => new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }),
    [],
  );
  const displayFmt = React.useMemo(
    () => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }),
    [],
  );

  const displayValue = selectedDate ? displayFmt.format(selectedDate) : "";
  const todayYMD = toYMD(new Date());

  const cells: Array<{ day: number; ymd: string } | null> = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    cells.push({ day, ymd: toYMD(d) });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  function getDisabledReason(ymd: string) {
    if (minDate && ymd < minDate) return "minDate" as const;
    if (maxDate && ymd > maxDate) return "maxDate" as const;
    if (disablePast && ymd < todayYMD) return "past" as const;
    if (disableFuture && ymd > todayYMD) return "future" as const;
    if (isDateDisabled && isDateDisabled(ymd)) return "custom" as const;
    return null;
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/50 px-4 text-left text-sm font-medium text-gray-700 transition-colors focus:bg-white focus:border-emerald-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          buttonClassName,
        )}
      >
        <span className={cn(!displayValue ? "text-gray-400" : undefined)}>
          {displayValue || placeholder}
        </span>
        <CalendarDays className="h-4.5 w-4.5 text-gray-400" />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <button
              type="button"
              className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors"
              onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <div className="text-[13px] font-bold text-gray-800">{titleFmt.format(monthStart)}</div>
            <button
              type="button"
              className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors"
              onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-[11px] font-bold text-gray-400">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, idx) => {
                if (!cell) return <div key={`e-${idx}`} className="h-10" />;
                const isSelected = cell.ymd === value;
                const disabledReason = getDisabledReason(cell.ymd);
                const isDisabled = disabledReason != null;
                return (
                  <button
                    key={cell.ymd}
                    type="button"
                    aria-disabled={isDisabled}
                    className={cn(
                      "h-10 rounded-xl text-[13px] font-bold transition-colors",
                      isDisabled ? "text-gray-300 cursor-not-allowed hover:bg-transparent opacity-60" : undefined,
                      isSelected
                        ? "bg-[#10b981] text-white"
                        : "text-gray-700 hover:bg-emerald-50",
                    )}
                    onClick={() => {
                      if (isDisabled) {
                        onInvalidSelect?.({ ymd: cell.ymd, reason: disabledReason! });
                        return;
                      }
                      onValueChange(cell.ymd);
                      setOpen(false);
                    }}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            {allowClear && (
              <div className="pt-3 mt-3 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-gray-600 text-[13px] font-bold hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    onValueChange("");
                    setOpen(false);
                  }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
