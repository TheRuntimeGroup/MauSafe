import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, LifeBuoy, LockKeyhole, Share2, ShieldCheck } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { listJourneys } from "@/lib/api";
import { HeroIllustration } from "@/components/HeroIllustration";
import { JourneyStatusCard } from "@/components/JourneyStatusCard";
import { appButtonVariants } from "@/components/ui/app-button";
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

  const howSteps = [
    { icon: ShieldCheck, title: t("home.how1Title"), body: t("home.how1Body") },
    { icon: Share2, title: t("home.how2Title"), body: t("home.how2Body") },
    { icon: LockKeyhole, title: t("home.how3Title"), body: t("home.how3Body") },
  ];

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="grid items-center gap-8 lg:grid-cols-2">
        <div className="space-y-5 animate-fade-in-up">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            {t("app.tagline")}
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl">
            {t("app.heroTitle")}
          </h1>
          <p className="max-w-md text-base text-muted-foreground sm:text-lg">
            {t("app.heroSubtitle")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/start" className={appButtonVariants({ variant: "primary", size: "lg" })}>
              {t("app.ctaStart")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link to="/get-help" className={appButtonVariants({ variant: "outline", size: "lg" })}>
              <LifeBuoy className="h-4 w-4" aria-hidden="true" />
              {t("app.ctaHelp")}
            </Link>
          </div>
        </div>
        <HeroIllustration className="animate-fade-in" />
      </section>

      {/* Active check-in */}
      {!loading && active ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-foreground">
              {t("home.activeTitle")}
            </h2>
            <Link to={`/journey/${active.id}`} className="text-sm font-semibold text-primary">
              {t("action.open")}
            </Link>
          </div>
          <Link to={`/journey/${active.id}`} className="block">
            <JourneyStatusCard journey={active.recipientSees} className="transition-shadow hover:shadow-md" />
          </Link>
        </section>
      ) : !loading ? (
        <section className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
          <p className="font-display text-base font-bold text-foreground">{t("home.noActive")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("home.noActiveHint")}</p>
        </section>
      ) : null}

      {/* How it works */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-foreground">{t("home.howTitle")}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {howSteps.map((step, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <step.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-3 font-display text-base font-bold text-foreground">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="rounded-2xl border border-border bg-secondary/60 p-6">
        <div className="flex items-start gap-4">
          <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 className="font-display text-base font-bold text-foreground">{t("home.trustTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("home.trustBody")}</p>
          </div>
        </div>
      </section>

      {/* Quick help */}
      <section className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">{t("home.quickHelp")}</p>
        <a href="tel:999" className={appButtonVariants({ variant: "danger", size: "xl" })}>
          <LifeBuoy className="h-5 w-5" aria-hidden="true" />
          {t("help.call999")}
        </a>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link to="/scam-check" className={appButtonVariants({ variant: "subtle", size: "lg" })}>
            {t("nav.scam")}
          </Link>
          <Link to="/get-help" className={appButtonVariants({ variant: "subtle", size: "lg" })}>
            {t("nav.gethelp")}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
