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
      <path
        d="M32 5.5 51 13v16.6C51 42.4 42.6 51.6 32 57 21.4 51.6 13 42.4 13 29.6V13L32 5.5Z"
        fill="#7C3AED"
        stroke="#6D28D9"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M24.5 32.5 29.6 37.6 40.2 27"
        stroke="#FFFFFF"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="48" cy="16" r="4" fill="#F59E0B" />
    </svg>
  );
}
