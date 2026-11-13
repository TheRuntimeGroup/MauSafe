import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Baby,
  BookOpen,
  CloudSun,
  FileWarning,
  Heart,
  IdCard,
  LifeBuoy,
  ListChecks,
  LockKeyhole,
  Navigation,
  ShieldAlert,
  Siren,
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

  const tools = [
    { icon: ShieldAlert, label: t("nav.scam"), to: "/scam-check" },
    { icon: LifeBuoy, label: t("nav.gethelp"), to: "/get-help" },
    { icon: Baby, label: t("nav.child"), to: "/child-safety" },
    { icon: CloudSun, label: t("nav.disaster"), to: "/disaster-safety" },
  ];

  const moreTools = [
    { icon: ListChecks, label: t("nav.checkins"), body: t("home.feature1Body"), to: "/check-ins" },
    { icon: FileWarning, label: t("incident.title"), body: t("incident.subtitle"), to: "/incident-report" },
    { icon: Siren, label: t("alarm.title"), body: t("alarm.subtitle"), to: "/safety-alarm" },
    { icon: IdCard, label: t("profile.title"), body: t("profile.subtitle"), to: "/emergency-id" },
    { icon: Heart, label: t("nav.contacts"), body: t("contacts.subtitle"), to: "/contacts" },
    { icon: BookOpen, label: t("nav.tips"), body: t("tips.subtitle"), to: "/safety-tips" },
  ];

  return (
    <div className="space-y-7">
      <header className="px-1 pt-1">
        <p className="text-xs font-semibold text-muted-foreground">{t("app.tagline")}</p>
        <h1 className="mt-2 font-display text-[2rem] font-extrabold leading-tight tracking-[-0.04em] text-foreground sm:text-4xl">
          {t("home.dashboardTitle")}
        </h1>
      </header>

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

      <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#071B33] p-6 text-white shadow-premium sm:p-7">
        <svg
          className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 text-sky-400/20"
          viewBox="0 0 240 240"
          fill="none"
          aria-hidden="true"
        >
          <path d="M-20 174C48 151 50 89 112 103C174 117 174 50 260 45" stroke="currentColor" strokeWidth="2" />
          <path d="M-10 208C62 185 76 126 133 140C190 154 201 86 252 81" stroke="currentColor" strokeWidth="2" />
          <circle cx="112" cy="103" r="6" fill="currentColor" />
          <circle cx="174" cy="50" r="6" fill="currentColor" />
        </svg>

        <div className="relative">
          <div className="flex items-center gap-2.5 text-sky-300">
            <Navigation className="h-4 w-4" aria-hidden="true" />
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]">{t("form.title")}</p>
          </div>
          <h2 className="mt-6 max-w-md font-display text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
            {t("form.subtitle")}
          </h2>
          <Link
            to="/start"
            className="group mt-7 inline-flex min-h-12 items-center gap-3 rounded-xl bg-white px-5 text-sm font-extrabold text-[#071B33] transition-transform hover:-translate-y-0.5 focus-visible:ring-white"
          >
            {t("app.ctaStart")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>

          {!loading && !active && (
            <div className="mt-7 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-white/55">
              <span className="h-1.5 w-1.5 rounded-full bg-white/45" aria-hidden="true" />
              {t("home.noActive")}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4 pt-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
            {t("home.quickTitle")}
          </h2>
          <span className="font-mono text-[10px] font-bold text-muted-foreground">04</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {tools.map((tool) => (
            <Link
              key={tool.to}
              to={tool.to}
              className="glass-card group flex min-h-36 flex-col justify-between rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-premium"
            >
              <div className="flex items-start justify-between">
                <tool.icon className="h-6 w-6 text-primary" strokeWidth={1.8} aria-hidden="true" />
                <ArrowUpRight
                  className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden="true"
                />
              </div>
              <span className="mt-6 font-display text-sm font-extrabold leading-tight text-foreground sm:text-base">
                {tool.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3 pt-1">
        <h2 className="px-1 font-display text-lg font-extrabold tracking-tight text-foreground">
          {t("home.moreTools")}
        </h2>
        <div className="glass-panel overflow-hidden rounded-2xl px-5">
          {moreTools.map((tool) => (
            <Link
              key={tool.to}
              to={tool.to}
              className="group flex items-center gap-4 border-b border-foreground/[0.07] py-5 last:border-b-0"
            >
              <tool.icon className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.8} aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-foreground">{tool.label}</span>
                <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">{tool.body}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <div className="flex items-start gap-2.5 px-1 pb-2 text-xs leading-relaxed text-muted-foreground">
        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <p>{t("home.trustBody")}</p>
      </div>
    </div>
  );
};

export default Index;
