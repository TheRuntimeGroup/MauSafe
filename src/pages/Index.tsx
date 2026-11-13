import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { listJourneys } from "@/lib/api";
import { JourneyStatusCard } from "@/components/JourneyStatusCard";
import { HomeQuickAccess } from "@/components/HomeQuickAccess";
import type { OwnerJourney } from "@/lib/types";

const Index = () => {
  const { t } = useI18n();
  const [active, setActive] = useState<OwnerJourney | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listJourneys()
      .then(({ journeys }) => {
        if (cancelled) return;
        const real = journeys.find(
          (j) => !j.isDemo && (j.status === "on_the_way" || j.status === "overdue"),
        );
        setActive(real ?? null);
      })
      .catch(() => {
        if (!cancelled) setActive(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="px-1 pt-1">
        <p className="text-xs font-semibold text-muted-foreground">{t("app.tagline")}</p>
        <h1 className="mt-2 font-display text-[2rem] font-extrabold leading-tight tracking-[-0.04em] text-foreground sm:text-4xl">
          {t("home.dashboardTitle")}
        </h1>
      </header>

      <HomeQuickAccess />

      {!loading && active && (
        <section className="space-y-3 animate-fade-in-up">
          <div className="flex items-center justify-between px-1">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
              <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
              {t("home.activeTitle")}
            </h2>
            <Link to={`/journey/${active.id}`} className="text-xs font-bold text-primary">
              {t("action.open")}
            </Link>
          </div>
          <Link to={`/journey/${active.id}`} className="block">
            <JourneyStatusCard journey={active.recipientSees} />
          </Link>
        </section>
      )}

      <div className="flex items-start gap-2.5 rounded-2xl border border-white/80 bg-white/60 p-4 text-xs leading-relaxed text-muted-foreground">
        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <p>{t("home.trustBody")}</p>
      </div>
    </div>
  );
};

export default Index;
