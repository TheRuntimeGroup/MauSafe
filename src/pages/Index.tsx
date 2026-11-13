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
import { HeroIllustration } from "@/components/HeroIllustration";
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
    { icon: ListChecks, label: t("nav.checkins"), to: "/check-ins", style: "bg-white" },
    { icon: PhoneCall, label: t("nav.callcheck"), to: "/call-checker", style: "bg-emerald-50" },
    { icon: ShieldAlert, label: t("nav.scam"), to: "/scam-check", style: "bg-amber-50" },
    { icon: LifeBuoy, label: t("nav.gethelp"), to: "/get-help", style: "bg-violet-50" },
    { icon: Heart, label: t("nav.contacts"), to: "/contacts", style: "bg-white" },
    { icon: BookOpen, label: t("nav.tips"), to: "/safety-tips", style: "bg-white" },
  ];

  const steps = [
    { icon: MapPin, title: t("home.how1Title"), body: t("home.how1Body") },
    { icon: Link2, title: t("home.how2Title"), body: t("home.how2Body") },
    { icon: CheckCircle2, title: t("home.how3Title"), body: t("home.how3Body") },
  ];

  return (
    <div className="space-y-12 lg:space-y-16">
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#19152E] text-white shadow-premium">
        <div className="pointer-events-none absolute inset-0 bg-dots opacity-20 [mask-image:linear-gradient(to_bottom_right,black,transparent_70%)]" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/35" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full border-[44px] border-white/[0.035]" />

        <div className="relative grid items-center gap-6 px-6 pb-8 pt-9 sm:px-9 lg:grid-cols-[1.08fr_0.92fr] lg:px-12 lg:pb-10 lg:pt-12">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-bold text-violet-100">
              <ShieldCheck className="h-4 w-4 text-violet-300" aria-hidden="true" />
              {t("app.badge")}
            </span>

            <h1 className="mt-7 max-w-xl font-display text-[2.75rem] font-extrabold leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl lg:text-[4rem]">
              {t("app.heroTitle")}
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">
              {t("app.heroSubtitle")}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/start"
                className="group inline-flex h-14 min-h-14 items-center justify-center gap-3 rounded-2xl bg-white px-6 text-base font-extrabold text-[#19152E] shadow-lg transition-all hover:-translate-y-0.5 hover:bg-violet-50 focus-visible:ring-white"
              >
                {t("app.ctaStart")}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <a
                href="tel:999"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-6 text-base font-bold text-white transition-colors hover:bg-white/10 focus-visible:ring-white"
              >
                <Phone className="h-5 w-5 text-red-300" aria-hidden="true" />
                {t("help.call999")}
              </a>
            </div>
          </div>

          <HeroIllustration className="animate-fade-in lg:translate-x-3" />
        </div>

        <ul className="relative grid gap-4 border-t border-white/10 px-6 py-5 sm:grid-cols-3 sm:px-9 lg:px-12">
          {trustItems.map((item) => (
            <li key={item.label} className="flex items-center gap-2.5 text-xs font-semibold text-white/70">
              <item.icon className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
              {item.label}
            </li>
          ))}
        </ul>
      </section>

      {!loading && active ? (
        <section className="space-y-4 animate-fade-in-up">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-40" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
              </span>
              <h2 className="font-display text-xl font-extrabold text-foreground">
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
            <JourneyStatusCard
              journey={active.recipientSees}
              className="transition-all hover:-translate-y-0.5 hover:shadow-premium"
            />
          </Link>
        </section>
      ) : !loading ? (
        <section className="flex flex-col items-start gap-5 rounded-[1.75rem] border border-primary/15 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
              <MapPin className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-base font-extrabold text-foreground">{t("home.noActive")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("home.noActiveHint")}</p>
            </div>
          </div>
          <Link
            to="/start"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-secondary px-4 text-sm font-extrabold text-primary transition-colors hover:bg-primary hover:text-white"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("app.ctaStart")}
          </Link>
        </section>
      ) : null}

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
              {t("home.quickTitle")}
            </p>
            <h2 className="mt-2 max-w-lg font-display text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl">
              {t("home.featureTitle")}
            </h2>
          </div>
          <span className="hidden font-display text-5xl font-extrabold text-primary/10 sm:block" aria-hidden="true">
            01
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Link
            to="/start"
            className="group relative col-span-2 row-span-2 flex min-h-64 flex-col overflow-hidden rounded-[1.75rem] bg-primary p-6 text-white shadow-premium transition-transform hover:-translate-y-1 sm:p-7"
          >
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full border-[28px] border-white/10" aria-hidden="true" />
            <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary shadow-lg">
              <Plus className="h-7 w-7" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <div className="relative mt-auto pt-14">
              <p className="max-w-xs font-display text-2xl font-extrabold leading-tight sm:text-3xl">
                {t("app.ctaStart")}
              </p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/75">{t("form.subtitle")}</p>
              <span className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-white">
                {t("action.open")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </div>
          </Link>

          <a
            href="tel:999"
            className="group relative col-span-2 flex min-h-36 items-center justify-between gap-5 overflow-hidden rounded-[1.75rem] bg-danger p-6 text-white shadow-sm transition-transform hover:-translate-y-1"
          >
            <div className="absolute -bottom-10 -right-4 font-display text-[8rem] font-extrabold leading-none text-white/10" aria-hidden="true">
              999
            </div>
            <div className="relative">
              <p className="font-display text-xl font-extrabold">{t("nav.emergency")}</p>
              <p className="mt-2 max-w-xs text-sm text-white/80">{t("home.quickHelp")}</p>
            </div>
            <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-danger shadow-lg">
              <Siren className="h-6 w-6" aria-hidden="true" />
            </span>
          </a>

          {tools.map((tool) => (
            <Link
              key={tool.to}
              to={tool.to}
              className={`group relative flex min-h-36 flex-col justify-between rounded-[1.5rem] border border-foreground/[0.06] p-5 text-foreground shadow-sm transition-all hover:-translate-y-1 hover:border-primary/20 hover:shadow-premium ${tool.style}`}
            >
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-sm ring-1 ring-foreground/[0.04]">
                  <tool.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <ArrowUpRight
                  className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden="true"
                />
              </div>
              <span className="mt-5 font-display text-sm font-extrabold leading-tight sm:text-base">{tool.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-border bg-white">
        <div className="flex items-end justify-between gap-5 px-6 pb-6 pt-7 sm:px-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">01 — 02 — 03</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold text-foreground sm:text-3xl">
              {t("home.howTitle")}
            </h2>
          </div>
          <ShieldCheck className="hidden h-10 w-10 text-primary/20 sm:block" aria-hidden="true" />
        </div>
        <div className="grid border-t border-border md:grid-cols-3 md:divide-x md:divide-border">
          {steps.map((step, index) => (
            <div key={step.title} className="relative border-b border-border p-6 last:border-b-0 sm:p-7 md:border-b-0">
              <span className="absolute right-5 top-4 font-display text-5xl font-extrabold text-primary/[0.07]" aria-hidden="true">
                0{index + 1}
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-primary">
                <step.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-6 font-display text-lg font-extrabold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2rem] bg-secondary p-7 sm:p-9">
        <div className="pointer-events-none absolute -bottom-20 -right-12 h-56 w-56 rounded-full border-[36px] border-primary/[0.06]" />
        <div className="relative grid gap-7 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.4rem] bg-primary text-white shadow-premium">
              <LockKeyhole className="h-7 w-7" aria-hidden="true" />
            </span>
            <h2 className="font-display text-2xl font-extrabold leading-tight text-foreground">
              {t("home.trustTitle")}
            </h2>
          </div>
          <div>
            <p className="max-w-2xl text-sm leading-relaxed text-secondary-foreground sm:text-base">
              {t("home.trustBody")}
            </p>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
              {trustItems.map((item) => (
                <li key={item.label} className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
