import * as React from "react"
import { cn } from "@/lib/utils"
import { Building2 } from "lucide-react"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border border-[#e1efe5] shadow-sm bg-[#f5faf6] px-[15px] py-2 text-sm font-normal transition-all file:border-0 file:bg-transparent file:text-sm file:font-normal file:text-foreground placeholder:text-zinc-500 text-zinc-700 focus:border-openclub-700 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
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
  image?: string
  icon?: React.ElementType
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

  const selected = options.find((o) => o.value?.toLowerCase() === value?.toLowerCase()) || null
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
          "flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-[#e1efe5] shadow-sm bg-[#f5faf6] px-4 text-left text-sm font-normal text-zinc-700 transition-colors focus:border-openclub-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2.5 flex-1 overflow-hidden pr-2">
          {selected?.image ? (
            <img src={selected.image} className="w-5 h-5 rounded-full object-cover shrink-0 border border-[#e1efe5]" alt="" />
          ) : selected?.icon ? (
            <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
              <selected.icon className="w-3 h-3 text-openclub-800" />
            </div>
          ) : null}
          <span className={cn(!value ? "text-gray-400" : undefined, "truncate text-left")}>
            {selected ? selected.label : placeholder}
          </span>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-gray-400 shrink-0"
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
        <div className={cn(
          "absolute z-[9999] w-full overflow-hidden rounded-lg border border-[#e1efe5] bg-white shadow-xl animate-in fade-in zoom-in-95 duration-100",
          openUpwards ? "bottom-full mb-2" : "top-full mt-2"
        )}>
          <div className="border-b border-[#e1efe5] p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false)
              }}
              placeholder={searchPlaceholder}
              className="h-11 w-full rounded-lg border border-[#e1efe5] shadow-sm bg-[#f5faf6] px-3 text-sm font-normal text-zinc-700 outline-none transition-colors placeholder:text-zinc-500 focus:border-openclub-700"
            />
          </div>
          <div className="max-h-60 overflow-auto py-1 custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-[12px] text-gray-400 text-center">No results found</div>
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
                    "flex w-full items-center gap-3 px-3 py-2 text-left text-[12px] transition-colors",
                    o.disabled ? "cursor-not-allowed opacity-50" : "hover:bg-emerald-50/50",
                    o.value === value ? "bg-emerald-50/80 font-normal text-emerald-900" : "text-gray-700"
                  )}
                >
                  <div className="flex items-center justify-between w-full gap-2 overflow-hidden">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {o.image ? (
                        <img src={o.image} className="w-6 h-6 rounded-full object-cover shrink-0 border border-[#e1efe5]" alt="" />
                      ) : o.icon ? (
                        <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                          <o.icon className="w-3.5 h-3.5 text-openclub-800" />
                        </div>
                      ) : null}
                      <span className="truncate text-left">{o.label}</span>
                    </div>
                    {o.value === value && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-openclub-800 shrink-0 ml-1"
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
                  </div>
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
