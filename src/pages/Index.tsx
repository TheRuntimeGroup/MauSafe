import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Heart,
  LifeBuoy,
  Link2,
  ListChecks,
  LockKeyhole,
  MapPin,
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
import { JourneyStatusCard } from "@/components/JourneyStatusCard";
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

  const tools = [
    {
      icon: ListChecks,
      label: t("nav.checkins"),
      body: t("home.feature1Body"),
      to: "/check-ins",
    },
    {
      icon: PhoneCall,
      label: t("nav.callcheck"),
      body: t("callcheck.subtitle"),
      to: "/call-checker",
    },
    {
      icon: ShieldAlert,
      label: t("nav.scam"),
      body: t("home.feature3Body"),
      to: "/scam-check",
    },
    {
      icon: LifeBuoy,
      label: t("nav.gethelp"),
      body: t("home.feature2Body"),
      to: "/get-help",
    },
    {
      icon: Heart,
      label: t("nav.contacts"),
      body: t("contacts.subtitle"),
      to: "/contacts",
    },
    {
      icon: BookOpen,
      label: t("nav.tips"),
      body: t("tips.subtitle"),
      to: "/safety-tips",
    },
  ];

  const steps = [
    { icon: MapPin, title: t("home.how1Title"), body: t("home.how1Body") },
    { icon: Link2, title: t("home.how2Title"), body: t("home.how2Body") },
    { icon: CheckCircle2, title: t("home.how3Title"), body: t("home.how3Body") },
  ];

  return (
    <div className="space-y-14 lg:space-y-20">
      <section className="overflow-hidden border border-foreground/10 bg-white sm:rounded-2xl">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-center px-6 py-9 sm:px-10 sm:py-12 lg:px-12 lg:py-16">
            <p className="border-l-2 border-primary pl-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              {t("app.badge")}
            </p>
            <h1 className="mt-7 max-w-xl font-display text-[2.65rem] font-extrabold leading-[1.04] tracking-[-0.045em] text-foreground sm:text-6xl">
              {t("app.heroTitle")}
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
              {t("app.heroSubtitle")}
            </p>
            <div className="mt-8 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-7">
              <Link
                to="/start"
                className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-primary px-5 text-sm font-extrabold text-white transition-colors hover:bg-primary/90"
              >
                {t("app.ctaStart")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <a
                href="tel:999"
                className="inline-flex min-h-11 items-center gap-2 border-b border-danger/30 text-sm font-extrabold text-danger transition-colors hover:border-danger"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                {t("help.call999")}
              </a>
            </div>
          </div>

          <div className="relative order-first min-h-64 overflow-hidden bg-secondary sm:min-h-80 lg:order-last lg:min-h-[500px]">
            <img
              src="https://images.unsplash.com/photo-1540202404-a2f29016b523?auto=format&fit=crop&w=1400&q=85"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
              fetchPriority="high"
            />
            <p className="absolute bottom-0 left-0 bg-white px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-foreground">
              Mauritius · 20.3484° S, 57.5522° E
            </p>
          </div>
        </div>

        <ul className="grid gap-4 border-t border-foreground/10 px-6 py-5 sm:grid-cols-3 sm:px-10 lg:px-12">
          {trustItems.map((item) => (
            <li key={item.label} className="flex items-center gap-2.5 text-xs font-semibold text-muted-foreground">
              <item.icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              {item.label}
            </li>
          ))}
        </ul>
      </section>

      {!loading && active ? (
        <section className="space-y-4 animate-fade-in-up">
          <div className="flex items-center justify-between gap-4 border-b border-foreground/10 pb-3">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
              <h2 className="font-display text-lg font-extrabold text-foreground">
                {t("home.activeTitle")}
              </h2>
            </div>
            <Link
              to={`/journey/${active.id}`}
              className="inline-flex items-center gap-1 text-sm font-bold text-primary"
            >
              {t("action.open")}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <Link to={`/journey/${active.id}`} className="block">
            <JourneyStatusCard journey={active.recipientSees} className="transition-shadow hover:shadow-premium" />
          </Link>
        </section>
      ) : !loading ? (
        <section className="flex flex-col items-start gap-4 border-l-4 border-primary bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="font-display text-base font-extrabold text-foreground">{t("home.noActive")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("home.noActiveHint")}</p>
          </div>
          <Link
            to="/start"
            className="inline-flex min-h-10 shrink-0 items-center gap-2 border-b border-primary/30 text-sm font-extrabold text-primary hover:border-primary"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("app.ctaStart")}
          </Link>
        </section>
      ) : null}

      <section className="grid gap-7 lg:grid-cols-[210px_1fr] lg:gap-12">
        <header>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            {t("home.quickTitle")}
          </p>
          <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl">
            {t("home.featureTitle")}
          </h2>
        </header>

        <div>
          <a
            href="tel:999"
            className="group mb-5 flex items-center gap-4 border border-danger/20 border-l-4 border-l-danger bg-white p-5 transition-colors hover:bg-danger/5"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-danger text-white">
              <Siren className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-base font-extrabold text-danger">{t("nav.emergency")}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{t("home.quickHelp")}</span>
            </span>
            <span className="font-display text-2xl font-extrabold tracking-tight text-danger">999</span>
          </a>

          <div className="border-t border-foreground/15">
            {tools.map((tool) => (
              <Link
                key={tool.to}
                to={tool.to}
                className="group flex items-start gap-4 border-b border-foreground/15 py-5 transition-colors hover:bg-white sm:items-center sm:px-3"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                  <tool.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-base font-extrabold text-foreground">{tool.label}</span>
                  <span className="mt-1 block max-w-xl text-sm leading-relaxed text-muted-foreground">{tool.body}</span>
                </span>
                <ArrowUpRight
                  className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary sm:mt-0"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-foreground/15 pt-8">
        <div className="grid gap-8 lg:grid-cols-[210px_1fr] lg:gap-12">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-primary">01 — 02 — 03</p>
            <h2 className="mt-3 font-display text-2xl font-extrabold text-foreground">{t("home.howTitle")}</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3 sm:gap-6">
            {steps.map((step, index) => (
              <div key={step.title} className="border-t-2 border-primary/20 pt-5">
                <div className="flex items-center justify-between">
                  <step.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="font-mono text-xs font-bold text-muted-foreground">0{index + 1}</span>
                </div>
                <h3 className="mt-5 font-display text-base font-extrabold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-start gap-4 border-t border-foreground/15 pt-8">
        <LockKeyhole className="mt-1 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <h2 className="font-display text-lg font-extrabold text-foreground">{t("home.trustTitle")}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t("home.trustBody")}</p>
        </div>
      </section>
    </div>
  );
};

export default Index;
