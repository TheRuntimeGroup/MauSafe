import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8", className)}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="58" height="58" rx="18" fill="#6D28D9" />
      <path
        d="M17 42V22L32 36L47 22V42"
        stroke="#FFFFFF"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="48" cy="16" r="4" fill="#FBBF24" />
    </svg>
  );
}
