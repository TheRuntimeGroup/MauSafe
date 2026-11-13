import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Check,
  Heart,
  LifeBuoy,
  ListChecks,
  LockKeyhole,
  Phone,
  PhoneCall,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Siren,
} from "lucide-react";
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

  const trustBadges = [
    t("home.trustBadge1"),
    t("home.trustBadge2"),
    t("home.trustBadge3"),
  ];

  const features = [
    { icon: ShieldCheck, title: t("home.feature1Title"), body: t("home.feature1Body"), to: "/start" },
    { icon: LifeBuoy, title: t("home.feature2Title"), body: t("home.feature2Body"), to: "/get-help" },
    { icon: ShieldAlert, title: t("home.feature3Title"), body: t("home.feature3Body"), to: "/scam-check" },
  ];

  const quickActions = [
    { icon: Siren, label: t("nav.emergency"), to: "/emergency", tone: "danger" as const },
    { icon: ListChecks, label: t("nav.checkins"), to: "/check-ins", tone: "outline" as const },
    { icon: PhoneCall, label: t("nav.callcheck"), to: "/call-checker", tone: "outline" as const },
    { icon: ShieldAlert, label: t("nav.scam"), to: "/scam-check", tone: "outline" as const },
    { icon: LifeBuoy, label: t("nav.gethelp"), to: "/get-help", tone: "outline" as const },
    { icon: Heart, label: t("nav.contacts"), to: "/contacts", tone: "outline" as const },
    { icon: BookOpen, label: t("nav.tips"), to: "/safety-tips", tone: "outline" as const },
  ];

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative grid items-center gap-10 lg:grid-cols-2">
        <div className="space-y-6 animate-fade-in-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            {t("app.tagline")}
          </span>
          <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
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
            <Link to="/emergency" className={appButtonVariants({ variant: "danger", size: "lg" })}>
              <Siren className="h-4 w-4" aria-hidden="true" />
              {t("nav.emergency")}
            </Link>
          </div>

          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {trustBadges.map((badge) => (
              <li key={badge} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                {badge}
              </li>
            ))}
          </ul>
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
            <JourneyStatusCard
              journey={active.recipientSees}
              className="transition-shadow hover:shadow-md"
            />
          </Link>
        </section>
      ) : !loading ? (
        <section className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
          <p className="font-display text-base font-bold text-foreground">{t("home.noActive")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("home.noActiveHint")}</p>
        </section>
      ) : null}

      {/* Quick actions */}
      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t("home.quickTitle")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Link
            to="/start"
            className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-primary p-4 text-base font-bold text-primary-foreground shadow-sm hover:bg-primary/90 sm:col-span-1"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            {t("app.ctaStart")}
          </Link>
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className={
                action.tone === "danger"
                  ? "flex flex-col items-start gap-3 rounded-2xl border border-danger/20 bg-danger/5 p-4 text-left hover:bg-danger/10"
                  : "flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left hover:bg-muted"
              }
            >
              <span
                className={
                  action.tone === "danger"
                    ? "flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 text-danger"
                    : "flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"
                }
              >
                <action.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold text-foreground">{action.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-foreground">{t("home.featureTitle")}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {features.map((feature) => (
            <Link
              key={feature.title}
              to={feature.to}
              className="group rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <feature.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-3 font-display text-base font-bold text-foreground">{feature.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{feature.body}</p>
            </Link>
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
          <Phone className="h-5 w-5" aria-hidden="true" />
          {t("help.call999")}
        </a>
      </section>
    </div>
  );
};

export default Index;
