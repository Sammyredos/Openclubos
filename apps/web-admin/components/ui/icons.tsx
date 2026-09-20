import {
  Loader2,
  LucideProps,
  Moon,
  SunMedium,
  type Icon as LucideIcon,
} from "lucide-react"

export type Icon = typeof LucideIcon

export const Icons = {
  sun: SunMedium,
  moon: Moon,
  spinner: Loader2,
  logo: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 13.5c.3-.8 1-1.6 1.8-2.3 1-.9 1.7-2.1 1.7-3.7a6.5 6.5 0 1 0-13 0c0 1.6.7 2.8 1.7 3.7.8.7 1.5 1.5 1.8 2.3" />
      <path d="M9.5 17.5h5" />
      <path d="M10.5 20.5h3" />
    </svg>
  ),
}
