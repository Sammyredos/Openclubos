import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2 text-base transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-gray-400 focus:bg-white focus:border-emerald-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

type SearchableSelectOption = {
  value: string
  label: string
  disabled?: boolean
}

type SearchableSelectProps = {
  value: string
  onValueChange: (value: string) => void
  options: SearchableSelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
  searchPlaceholder?: string
}

function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  disabled,
  className,
  triggerClassName,
  searchPlaceholder = "Search...",
}: SearchableSelectProps) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  React.useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (!ref.current) return
      if (e.target instanceof Node && !ref.current.contains(e.target)) setOpen(false)
    }
    window.addEventListener("mousedown", onMouseDown)
    return () => window.removeEventListener("mousedown", onMouseDown)
  }, [open])

  const selected = options.find((o) => o.value === value) || null
  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50/50 px-4 text-left text-sm font-medium text-gray-700 transition-colors focus:bg-white focus:border-emerald-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          triggerClassName
        )}
      >
        <span className={cn(!value ? "text-gray-400" : undefined)}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-gray-400"
        >
          <path
            d="M6 9L12 15L18 9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false)
              }}
              placeholder={searchPlaceholder}
              className="h-[35px] w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:bg-white focus:border-emerald-500"
            />
          </div>
          <div className="max-h-60 overflow-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-400">No results</div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  disabled={o.disabled}
                  onClick={() => {
                    onValueChange(o.value)
                    setOpen(false)
                    setQuery("")
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors",
                    o.disabled ? "cursor-not-allowed opacity-50" : "hover:bg-gray-50",
                    o.value === value ? "bg-gray-50 font-bold text-gray-900" : "text-gray-700"
                  )}
                >
                  <span>{o.label}</span>
                  {o.value === value && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-emerald-600"
                    >
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export { Input, SearchableSelect }
