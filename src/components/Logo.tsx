import { cn } from "@/lib/utils";

function ShieldMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="MauSafe"
    >
      <path
        d="M24 3.5 41 9.6v12.2c0 11.3-7.6 20.4-17 23.2-9.4-2.8-17-11.9-17-23.2V9.6L24 3.5Z"
        fill="#0D2B45"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M16.6 24.2l4.7 4.7 10.3-11.3"
        stroke="#FFFFFF"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  variant = "mark",
}: {
  className?: string;
  variant?: "mark" | "full";
}) {
  if (variant === "full") {
    return (
      <span
        className={cn("inline-flex items-center justify-center gap-3 text-[#0D2B45]", className)}
        role="img"
        aria-label="MauSafe"
      >
        <ShieldMark className="h-16 w-16 shrink-0" />
        <span className="font-display text-[2.6rem] font-extrabold leading-none tracking-tight">
          MauSafe
        </span>
      </span>
    );
  }

  return <ShieldMark className={cn("h-8 w-8", className)} />;
}
