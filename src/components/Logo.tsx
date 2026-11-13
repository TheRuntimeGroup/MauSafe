import { cn } from "@/lib/utils";

const Mark = ({
  className,
  inverse = false,
}: {
  className?: string;
  inverse?: boolean;
}) => (
  <svg
    viewBox="0 0 48 48"
    className={cn("h-8 w-8", className)}
    fill="none"
    role="img"
    aria-label="MauSafe"
  >
    <path
      d="M24 4.5 38 10v12c0 8.6-5.8 14.9-14 19.5C15.8 36.9 10 30.6 10 22V10L24 4.5Z"
      fill={inverse ? "#FFFFFF" : "#0D2B45"}
      stroke={inverse ? "#0D2B45" : "#FFFFFF"}
      strokeWidth="2"
    />
    <path
      d="M17.3 23.6 21.8 28.3 30.9 18.6"
      stroke={inverse ? "#0D2B45" : "#34D399"}
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function Logo({
  className,
  variant = "mark",
}: {
  className?: string;
  variant?: "mark" | "full" | "inverse";
}) {
  if (variant === "full") {
    return (
      <svg
        viewBox="0 0 320 96"
        className={cn("h-12 w-auto", className)}
        fill="none"
        role="img"
        aria-label="MauSafe"
      >
        <path
          d="M55 20 84 29.5V56C84 73 74.5 83.5 55 90.5 35.5 83.5 26 73 26 56V29.5L55 20Z"
          fill="#0D2B45"
        />
        <path
          d="M44 52.5 52.5 61 69 43.5"
          stroke="#34D399"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text
          x="102"
          y="63"
          fontFamily="Manrope, system-ui, -apple-system, 'Segoe UI', sans-serif"
          fontSize="37"
          fontWeight="800"
          fill="#0D2B45"
        >
          MauSafe
        </text>
      </svg>
    );
  }

  return <Mark className={className} inverse={variant === "inverse"} />;
}
