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
        d="M32 6.5 52 14v17c0 12.5-8.5 21-20 26.5C20.5 52 12 43.5 12 31V14L32 6.5Z"
        fill="#F5F3FF"
        stroke="#7C3AED"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M24 32.5 29.5 38 41 27"
        stroke="#7C3AED"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
