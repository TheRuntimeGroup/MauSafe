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
      viewBox={variant === "full" ? "100 125 1265 455" : "100 125 440 455"}
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8", className)}
      role="img"
      aria-label="MauSafe"
    >
      <image
        href="/images/mausafe-logo.png"
        x="0"
        y="0"
        width="1365"
        height="768"
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  );
}
