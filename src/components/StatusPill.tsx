import { CheckCircle2, CircleX, Clock3, Navigation, ShieldOff, TimerOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JourneyStatus } from "@/lib/types";

const CONFIG: Record<
  JourneyStatus | "revoked" | "expired",
  { className: string; Icon: typeof Navigation }
> = {
  on_the_way: { className: "bg-primary/10 text-primary", Icon: Navigation },
  arrived: { className: "bg-emerald-100 text-emerald-700", Icon: CheckCircle2 },
  overdue: { className: "bg-amber-100 text-amber-700", Icon: Clock3 },
  cancelled: { className: "bg-slate-100 text-slate-600", Icon: CircleX },
  revoked: { className: "bg-slate-100 text-slate-600", Icon: ShieldOff },
  expired: { className: "bg-slate-100 text-slate-600", Icon: TimerOff },
};

export function StatusPill({
  status,
  label,
  className,
}: {
  status: JourneyStatus | "revoked" | "expired";
  label: string;
  className?: string;
}) {
  const config = CONFIG[status] ?? CONFIG.cancelled;
  const Icon = config.Icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
        config.className,
        className,
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </span>
  );
}
