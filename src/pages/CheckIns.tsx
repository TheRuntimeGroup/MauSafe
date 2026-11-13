import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Clock3, ListChecks, Plus } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { listJourneys } from "@/lib/api";
import { formatClock } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";
import type { OwnerJourney } from "@/lib/types";

const CheckIns = () => {
  const { t, locale } = useI18n();
  const [journeys, setJourneys] = useState<OwnerJourney[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listJourneys()
      .then(({ journeys }) => {
        if (!cancelled) setJourneys(journeys.filter((journey) => !journey.isDemo));
      })
      .catch(() => {
        if (!cancelled) setJourneys([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const active = journeys.filter((j) => j.status === "on_the_way" || j.status === "overdue");
  const past = journeys.filter((j) => j.status === "arrived" || j.status === "cancelled");

  function statusLabel(status: OwnerJourney["status"]) {
    return t(`status.${status}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-7">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">{t("app.name")}</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-foreground">{t("list.title")}</h1>
        </div>
        <Link
          to="/start"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">{t("app.ctaStart")}</span>
        </Link>
      </header>

      {!loading && journeys.length === 0 && (
        <section className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
            <ListChecks className="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-display text-lg font-bold text-foreground">{t("list.empty")}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{t("list.emptyHint")}</p>
          <Link
            to="/start"
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("app.ctaStart")}
          </Link>
        </section>
      )}

      {active.length > 0 && (
        <JourneyGroup title={t("list.active")} journeys={active} statusLabel={statusLabel} locale={locale} t={t} />
      )}

      {past.length > 0 && (
        <JourneyGroup title={t("list.past")} journeys={past} statusLabel={statusLabel} locale={locale} t={t} />
      )}
    </div>
  );
};

function JourneyGroup({
  title,
  journeys,
  statusLabel,
  locale,
  t,
}: {
  title: string;
  journeys: OwnerJourney[];
  statusLabel: (s: OwnerJourney["status"]) => string;
  locale: string;
  t: (key: string) => string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-lg font-extrabold text-foreground">{title}</h2>
        <span className="font-mono text-[11px] font-bold text-muted-foreground">
          {journeys.length.toString().padStart(2, "0")}
        </span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card px-5">
        {journeys.map((journey) => (
          <Link
            key={journey.id}
            to={`/journey/${journey.id}`}
            className="group block border-b border-border py-5 last:border-b-0"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display text-base font-bold text-foreground">{t(`preset.${journey.preset}`)}</h3>
                {journey.label && <p className="mt-1 text-sm text-muted-foreground">{journey.label}</p>}
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <StatusPill status={journey.status} label={statusLabel(journey.status)} />
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                {t("guest.expected")} {formatClock(journey.expectedArrivalAt, locale)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default CheckIns;
