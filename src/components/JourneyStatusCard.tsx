import { Clock3 } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { useNow } from "@/hooks/useNow";
import { formatClock, formatCountdown, formatTimeAgo, timeUntil } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";
import { cn } from "@/lib/utils";
import type { GuestJourney } from "@/lib/types";

export function JourneyStatusCard({
  journey,
  className,
}: {
  journey: GuestJourney;
  className?: string;
}) {
  const { t, locale } = useI18n();
  useNow(1000);

  const remaining = timeUntil(journey.expectedArrivalAt);
  const statusLabel = t(`status.${journey.status}`);
  const presetLabel = t(`preset.${journey.preset}`);

  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-sm", className)}>
      <div className="flex items-center justify-between gap-3">
        <StatusPill status={journey.status} label={statusLabel} />
        {journey.isDemo && (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
            {t("common.demo")}
          </span>
        )}
      </div>

      <h3 className="mt-4 font-display text-xl font-bold text-foreground">{presetLabel}</h3>
      {journey.label ? (
        <p className="mt-1 text-sm text-muted-foreground">{journey.label}</p>
      ) : null}

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-muted-foreground">{t("guest.expected")}</span>
          <span className="font-semibold text-foreground">
            {formatClock(journey.expectedArrivalAt, locale)}
          </span>
        </div>

        {(journey.status === "on_the_way" || journey.status === "overdue") && (
          <p
            className={cn(
              "font-semibold",
              journey.status === "overdue" ? "text-amber-700" : "text-primary",
            )}
          >
            {journey.status === "overdue"
              ? t("common.overdueBy", { t: formatCountdown(remaining) })
              : t("common.timeLeft", { t: formatCountdown(remaining) })}
          </p>
        )}

        {journey.status === "arrived" && (
          <p className="font-semibold text-emerald-700">{t("status.arrived")}</p>
        )}

        <p className="text-xs text-muted-foreground">
          {t("guest.lastUpdate")}: {formatTimeAgo(journey.lastStatusAt, locale)}
        </p>
      </div>
    </div>
  );
}
