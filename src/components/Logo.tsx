import { cn } from "@/lib/utils";

export function Logo({
  className,
  variant = "mark",
}: {
  className?: string;
  variant?: "mark" | "full";
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("h-10 w-10", className)}
      role="img"
      aria-label="AnouSecure Moris"
      data-variant={variant}
    >
      <rect width="48" height="48" rx="15" fill="#0D5C56" />
      <path
        d="M24 10.5 36 15v8.7c0 7.4-4.8 11.6-12 14-7.2-2.4-12-6.6-12-14V15l12-4.5Z"
        fill="#DDF566"
      />
      <path
        d="m18.5 24 3.6 3.6 7.8-8"
        fill="none"
        stroke="#0D5C56"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
