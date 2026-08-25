"use client";

import * as React from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { FloatingMenu } from "./floating-menu";

type DatePickerProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  minDate?: string;
  maxDate?: string;
  disablePast?: boolean;
  disableToday?: boolean;
  disableFuture?: boolean;
  isDateDisabled?: (ymd: string) => boolean;
  onInvalidSelect?: (args: { ymd: string; reason: "minDate" | "maxDate" | "past" | "future" | "custom" | "today" }) => void;
  className?: string;
  buttonClassName?: string;
  rangeStart?: string;
  rangeEnd?: string;
  defaultMonth?: string;
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
  disableToday,
  disableFuture,
  isDateDisabled,
  onInvalidSelect,
  className,
  buttonClassName,
  rangeStart,
  rangeEnd,
  defaultMonth,
}: DatePickerProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = React.useState(false);
  const [openUpwards, setOpenUpwards] = React.useState(false);

  const selectedDate = React.useMemo(() => (value ? parseYMD(value) : null), [value]);
  const [viewMonth, setViewMonth] = React.useState<Date>(() => {
    if (selectedDate) return selectedDate;
    if (defaultMonth) {
      const parsedDef = parseYMD(defaultMonth);
      if (parsedDef) return parsedDef;
    }
    if (minDate) {
      const parsedMin = parseYMD(minDate);
      if (parsedMin) return parsedMin;
    }
    return new Date();
  });

  React.useEffect(() => {
    if (!open) return;

    if (selectedDate) {
      setViewMonth(selectedDate);
    } else if (defaultMonth) {
      const parsedDef = parseYMD(defaultMonth);
      if (parsedDef) setViewMonth(parsedDef);
    } else if (minDate) {
      const parsedMin = parseYMD(minDate);
      if (parsedMin) setViewMonth(parsedMin);
    }
  }, [open, selectedDate, defaultMonth, minDate]);

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
    if (disableToday && ymd === todayYMD) return "today" as const;
    if (disableFuture && ymd > todayYMD) return "future" as const;
    if (isDateDisabled && isDateDisabled(ymd)) return "custom" as const;
    return null;
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!open && selectedDate) setViewMonth(selectedDate);
          setOpen((v) => !v);
        }}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-[#e1efe5] bg-white px-4 text-left text-[12px] font-normal text-gray-700 transition-colors focus:border-openclub-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          buttonClassName,
        )}
      >
        <span className={cn(!displayValue ? "text-gray-400" : undefined)}>
          {displayValue || placeholder}
        </span>
        <CalendarDays className="h-4.5 w-4.5 text-gray-400" />
      </button>

      <FloatingMenu
        open={open}
        anchorEl={ref.current}
        onClose={() => setOpen(false)}
        placement="bottom-end"
        align="start"
        className="w-[280px] overflow-hidden rounded-2xl border border-[#e1efe5] bg-white shadow-xl mt-2"
      >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#e1efe5]">
            <button
              type="button"
              className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-[#e1efe5] bg-white text-gray-500 hover:bg-background transition-colors"
              onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            
            <div className="flex gap-1">
              <select 
                className="bg-transparent border-none text-[13px] font-normal text-gray-800 focus:ring-0 cursor-pointer hover:text-openclub-800 transition-colors"
                value={viewMonth.getMonth()}
                onChange={(e) => setViewMonth(new Date(viewMonth.getFullYear(), parseInt(e.target.value), 1))}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {new Date(0, i).toLocaleString('en-US', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select 
                className="bg-transparent border-none text-[13px] font-normal text-gray-800 focus:ring-0 cursor-pointer hover:text-openclub-800 transition-colors"
                value={viewMonth.getFullYear()}
                onChange={(e) => setViewMonth(new Date(parseInt(e.target.value), viewMonth.getMonth(), 1))}
              >
                {Array.from({ length: 100 }, (_, i) => {
                  const y = new Date().getFullYear() - i;
                  return <option key={y} value={y}>{y}</option>;
                })}
              </select>
            </div>

            <button
              type="button"
              className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-[#e1efe5] bg-white text-gray-500 hover:bg-background transition-colors"
              onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="p-3">
            <div className="grid grid-cols-7 gap-0.5 mb-1.5">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-[10px] font-normal text-gray-400">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((cell, idx) => {
                if (!cell) return <div key={`e-${idx}`} className="h-8" />;
                const isSelected = cell.ymd === value;
                const isToday = cell.ymd === todayYMD;
                const inRange = rangeStart && rangeEnd && cell.ymd >= rangeStart && cell.ymd <= rangeEnd && !isSelected;
                const disabledReason = getDisabledReason(cell.ymd);
                const isDisabled = disabledReason != null;
                return (
                  <button
                    key={cell.ymd}
                    type="button"
                    disabled={isDisabled}
                    className={cn(
                      "h-8 rounded-lg text-[12px] font-normal transition-colors relative",
                      isDisabled
                        ? "text-gray-300 cursor-not-allowed opacity-40"
                        : isSelected
                          ? "bg-[#15803D] text-white ring-2 ring-emerald-400 ring-offset-1 z-10"
                          : inRange
                            ? "bg-emerald-50 text-emerald-700 rounded-none first-of-type:rounded-l-lg last-of-type:rounded-r-lg"
                            : isToday
                              ? "text-openclub-800 ring-2 ring-emerald-300 ring-offset-1 hover:bg-emerald-50"
                              : "text-gray-700 hover:bg-emerald-50",
                    )}
                    onClick={() => {
                      onValueChange(cell.ymd);
                      setOpen(false);
                    }}
                  >
                    {cell.day}
                    {isToday && !isSelected && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {allowClear && (
              <div className="pt-3 mt-3 border-t border-[#e1efe5] flex justify-end">
                <button
                  type="button"
                  className="h-10 px-4 rounded-xl border border-[#e1efe5] bg-white text-gray-600 text-[13px] font-normal hover:bg-background transition-colors"
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
      </FloatingMenu>
    </div>
  );
}
