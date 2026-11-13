import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock3, ListChecks, Plus, Timer } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { createJourney, listJourneys } from "@/lib/api";
import { getOwnerName } from "@/lib/storage";
import { formatClock } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";
import { AppButton } from "@/components/ui/app-button";
import { showError } from "@/utils/toast";
import type { OwnerJourney } from "@/lib/types";

const CheckIns = () => {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [journeys, setJourneys] = useState<OwnerJourney[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingDemo, setStartingDemo] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listJourneys()
      .then(({ journeys }) => {
        if (!cancelled) setJourneys(journeys);
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

  async function startDemo() {
    if (startingDemo) return;
    setStartingDemo(true);
    try {
      const { journey } = await createJourney({
        preset: "going_home",
        label: "",
        durationMinutes: 1,
        senderName: getOwnerName() || "Someone",
        contact: "",
        isDemo: true,
      });
      navigate(`/journey/${journey.id}`);
    } catch {
      showError(t("common.error"));
      setStartingDemo(false);
    }
  }

  const active = journeys.filter((j) => j.status === "on_the_way" || j.status === "overdue");
  const past = journeys.filter((j) => j.status === "arrived" || j.status === "cancelled");
  const demos = journeys.filter((j) => j.isDemo);

  function statusLabel(status: OwnerJourney["status"]) {
    return t(`status.${status}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{t("list.title")}</h1>
        </div>
        <Link
          to="/start"
          className="inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t("form.submit")}</span>
          <span className="sm:hidden">{t("nav.checkins")}</span>
        </Link>
      </header>

      {!loading && journeys.length === 0 && (
        <section className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <ListChecks className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 font-display text-base font-bold text-foreground">{t("list.empty")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("list.emptyHint")}</p>
          <Link to="/start" className="mt-4 inline-flex text-sm font-semibold text-primary">
            {t("app.ctaStart")}
          </Link>
        </section>
      )}

      {/* Demo banner */}
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <Timer className="mt-0.5 h-5 w-5 text-amber-600" aria-hidden="true" />
          <div className="flex-1">
            <h2 className="font-display text-base font-bold text-foreground">{t("list.demoTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("list.demoBody")}</p>
            <AppButton
              variant="warning"
              size="md"
              className="mt-3"
              onClick={startDemo}
              disabled={startingDemo}
            >
              {t("list.demoButton")}
            </AppButton>
          </div>
        </div>
      </section>

      {/* Active */}
      {active.length > 0 && (
        <JourneyGroup
          title={t("list.active")}
          journeys={active}
          statusLabel={statusLabel}
          locale={locale}
          t={t}
        />
      )}

      {/* Past */}
      {past.length > 0 && (
        <JourneyGroup
          title={t("list.past")}
          journeys={past}
          statusLabel={statusLabel}
          locale={locale}
          t={t}
        />
      )}

      {/* Demos (separated) */}
      {demos.length > 0 && (
        <JourneyGroup
          title={t("common.demo")}
          journeys={demos}
          statusLabel={statusLabel}
          locale={locale}
          t={t}
        />
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
      <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
      <div className="space-y-3">
        {journeys.map((j) => (
          <Link
            key={j.id}
            to={`/journey/${j.id}`}
            className="block rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-3">
              <StatusPill status={j.status} label={statusLabel(j.status)} />
              {j.isDemo && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                  {t("common.demo")}
                </span>
              )}
            </div>
            <h3 className="mt-3 font-display text-base font-bold text-foreground">
              {t(`preset.${j.preset}`)}
            </h3>
            {j.label && <p className="mt-1 text-sm text-muted-foreground">{j.label}</p>}
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              {t("guest.expected")} {formatClock(j.expectedArrivalAt, locale)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default CheckIns;
