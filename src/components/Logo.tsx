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
      viewBox={variant === "full" ? "110 190 1245 390" : "105 185 450 420"}
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
