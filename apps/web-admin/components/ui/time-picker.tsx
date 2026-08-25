"use client"

import React from "react"
import { Clock, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { FloatingMenu } from "./floating-menu"

type TimePickerProps = {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  buttonClassName?: string
  disabled?: boolean
}

const TIME_OPTIONS = Array.from({ length: 24 * 4 }).map((_, i) => {
  const h = Math.floor(i / 4)
  const m = (i % 4) * 15
  const hStr = h.toString().padStart(2, "0")
  const mStr = m.toString().padStart(2, "0")
  const ampm = h >= 12 ? "PM" : "AM"
  const h12 = h % 12 || 12
  return { value: `${hStr}:${mStr}`, label: `${h12}:${mStr.padStart(2, "0")} ${ampm}` }
})

export function TimePicker({
  value,
  onValueChange,
  placeholder = "Select time...",
  className,
  buttonClassName,
  disabled,
}: TimePickerProps) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = React.useState(false)
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)

  React.useEffect(() => {
    if (ref.current) setAnchorEl(ref.current)
  }, [])

  const normalizedValue = React.useMemo(() => {
    if (!value) return '';
    const trimmed = value.trim();
    // If format is HH:mm:ss, take HH:mm
    if (/^\d{1,2}:\d{2}:\d{2}/.test(trimmed)) {
      const parts = trimmed.split(':');
      return `${parts[0].padStart(2, '0')}:${parts[1]}`;
    }
    // If format is H:mm, pad to HH:mm
    if (/^\d{1}:\d{2}$/.test(trimmed)) {
      return `0${trimmed}`;
    }
    return trimmed;
  }, [value]);

  const selected = TIME_OPTIONS.find((o) => o.value === normalizedValue || o.label.toLowerCase() === value?.toLowerCase()) || null

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-[#e1efe5] bg-white px-4 text-left text-[12px] font-normal text-gray-700 transition-colors focus:border-openclub-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          buttonClassName
        )}
      >
        <span className={cn(!value ? "text-gray-400" : undefined, "truncate")}>
          {selected ? selected.label : placeholder}
        </span>
        <Clock className="h-4 w-4 text-gray-400" />
      </button>

      <FloatingMenu
        open={open}
        anchorEl={anchorEl}
        onClose={() => setOpen(false)}
        placement="bottom-end"
        align="start"
        className="w-full sm:w-[280px]"
      >
        <div className="w-full overflow-hidden rounded-2xl border border-[#e1efe5] bg-white shadow-xl">
          <div className="max-h-[280px] overflow-auto py-1 custom-scrollbar">
            {TIME_OPTIONS.map((opt) => {
              const isSelected = value === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onValueChange(opt.value)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-2.5 text-[12px] transition-colors hover:bg-background",
                    isSelected ? "text-emerald-700 font-normal bg-emerald-50/50" : "text-gray-700 font-normal"
                  )}
                >
                  {opt.label}
                  {isSelected && <Check className="w-4 h-4 text-openclub-800" />}
                </button>
              )
            })}
          </div>
        </div>
      </FloatingMenu>
    </div>
  )
}
