import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Heart,
  LifeBuoy,
  Link2,
  ListChecks,
  LockKeyhole,
  Phone,
  PhoneCall,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Siren,
  WifiOff,
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

  const trustItems = [
    { icon: ShieldCheck, label: t("home.trustBadge1") },
    { icon: WifiOff, label: t("home.trustBadge2") },
    { icon: Link2, label: t("home.trustBadge3") },
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
    <div className="space-y-14">
      {/* Hero */}
      <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6 animate-fade-in-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-sm font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            {t("app.badge")}
          </span>

          <h1 className="font-display text-[2.5rem] font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem]">
            {t("app.heroTitle")}
          </h1>
          <div className="h-1.5 w-24 rounded-full bg-primary/80" aria-hidden="true" />

          <p className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("app.heroSubtitle")}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link to="/start" className={appButtonVariants({ variant: "primary", size: "lg" })}>
              {t("app.ctaStart")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link to="/emergency" className={appButtonVariants({ variant: "outline", size: "lg" })}>
              <Siren className="h-4 w-4 text-danger" aria-hidden="true" />
              {t("nav.emergency")}
            </Link>
          </div>

          <ul className="flex flex-wrap gap-2">
            {trustItems.map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"
              >
                <item.icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        <HeroIllustration className="animate-fade-in drop-shadow-sm" />
      </section>

      {/* Active check-in */}
      {!loading && active ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold text-foreground">
              {t("home.activeTitle")}
            </h2>
            <Link to={`/journey/${active.id}`} className="text-sm font-semibold text-primary">
              {t("action.open")}
            </Link>
          </div>
          <Link to={`/journey/${active.id}`} className="block">
            <JourneyStatusCard
              journey={active.recipientSees}
              className="transition-shadow hover:shadow-premium"
            />
          </Link>
        </section>
      ) : !loading ? (
        <section className="rounded-3xl border border-dashed border-primary/25 bg-primary/5 p-7 text-center">
          <p className="font-display text-base font-extrabold text-foreground">{t("home.noActive")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("home.noActiveHint")}</p>
          <Link to="/start" className={appButtonVariants({ variant: "primary", size: "md", className: "mt-4" })}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("app.ctaStart")}
          </Link>
        </section>
      ) : null}

      {/* Quick actions */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-extrabold text-foreground">
          {t("home.quickTitle")}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Link
            to="/start"
            className="col-span-2 flex items-center justify-between gap-3 rounded-2xl bg-primary p-5 text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-premium sm:col-span-1 sm:flex-col sm:items-start"
          >
            <span>
              <span className="block font-display text-base font-extrabold">{t("app.ctaStart")}</span>
              <span className="mt-1 block text-sm text-white/80">{t("form.subtitle")}</span>
            </span>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <Plus className="h-5 w-5" aria-hidden="true" />
            </span>
          </Link>

          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className={
                action.tone === "danger"
                  ? "group flex flex-col items-start gap-3 rounded-2xl border border-danger/20 bg-danger/5 p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-danger/10 hover:shadow-premium"
                  : "group flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-premium"
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
        <h2 className="font-display text-xl font-extrabold text-foreground">
          {t("home.featureTitle")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {features.map((feature) => (
            <Link
              key={feature.title}
              to={feature.to}
              className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-premium"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <feature.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-display text-base font-extrabold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                {t("action.open")}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust band */}
      <section className="relative overflow-hidden rounded-3xl bg-foreground p-7 sm:p-9">
        <div className="pointer-events-none absolute inset-0 bg-dots opacity-20 [mask-image:linear-gradient(to_bottom_right,black,transparent)]" />
        <div className="relative flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <LockKeyhole className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-xl font-extrabold text-white">{t("home.trustTitle")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">{t("home.trustBody")}</p>
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
