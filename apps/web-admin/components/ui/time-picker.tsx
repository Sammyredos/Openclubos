"use client"

import React from "react"
import { Clock, Check } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const [openUpwards, setOpenUpwards] = React.useState(false)

  React.useEffect(() => {
    if (!open) return

    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      if (spaceBelow < 300 && rect.top > 300) {
        setOpenUpwards(true)
      } else {
        setOpenUpwards(false)
      }
    }

    function onMouseDown(e: MouseEvent) {
      if (!ref.current) return
      if (e.target instanceof Node && !ref.current.contains(e.target)) setOpen(false)
    }
    window.addEventListener("mousedown", onMouseDown)
    return () => window.removeEventListener("mousedown", onMouseDown)
  }, [open])

  const selected = TIME_OPTIONS.find((o) => o.value === value) || null

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-[#e7e7e7] bg-gray-50/50 px-4 text-left text-sm font-medium text-gray-700 transition-colors focus:bg-white focus:border-emerald-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          buttonClassName
        )}
      >
        <span className={cn(!value ? "text-gray-400" : undefined, "truncate")}>
          {selected ? selected.label : placeholder}
        </span>
        <Clock className="h-4 w-4 text-gray-400" />
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 w-full overflow-hidden rounded-2xl border border-[#e7e7e7] bg-white shadow-xl animate-in fade-in zoom-in-95 duration-100",
            openUpwards ? "bottom-full mb-2" : "top-full mt-2"
          )}
        >
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
                    "flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-gray-50",
                    isSelected ? "text-emerald-700 font-bold bg-emerald-50/50" : "text-gray-700 font-medium"
                  )}
                >
                  {opt.label}
                  {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
