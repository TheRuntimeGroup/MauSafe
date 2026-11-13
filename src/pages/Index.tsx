import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { listJourneys } from "@/lib/api";
import { getOwnerName } from "@/lib/storage";
import { loadEmergencyProfile } from "@/lib/emergencyProfile";
import { useNow } from "@/hooks/useNow";
import { JourneyStatusCard } from "@/components/JourneyStatusCard";
import { HomeQuickAccess } from "@/components/HomeQuickAccess";
import { HomeTrustedContacts } from "@/components/HomeTrustedContacts";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { cn } from "@/lib/utils";
import type { OwnerJourney } from "@/lib/types";

function greetingKey(hour: number): string {
  if (hour < 12) return "home.greeting.morning";
  if (hour < 18) return "home.greeting.afternoon";
  return "home.greeting.evening";
}

const Index = () => {
  const { t, locale } = useI18n();
  const [active, setActive] = useState<OwnerJourney | null>(null);
  const [loading, setLoading] = useState(true);
  const now = useNow(60_000);

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

  const displayName = useMemo(() => {
    const owner = getOwnerName().trim();
    if (owner) return owner.split(/\s+/)[0];
    const profile = loadEmergencyProfile().fullName.trim();
    return profile ? profile.split(/\s+/)[0] : "";
  }, []);

  const greeting = `${t(greetingKey(new Date(now).getHours()))}${displayName ? `, ${displayName}` : ""}`;
  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(now));

  const statusKind: "ready" | "active" | "overdue" = !active
    ? "ready"
    : active.status === "overdue"
      ? "overdue"
      : "active";

  const status = {
    ready: {
      dot: "bg-emerald-300",
      title: t("home.status.readyTitle"),
      body: t("home.status.readyBody"),
    },
    active: {
      dot: "bg-sky-300",
      title: t("home.status.activeTitle"),
      body: t("home.status.activeBody"),
    },
    overdue: {
      dot: "bg-amber-300",
      title: t("home.status.overdueTitle"),
      body: t("home.status.overdueBody"),
    },
  }[statusKind];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <AnnouncementBanner />

      <header className="relative isolate overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0D2B45] px-6 py-7 text-white shadow-[0_24px_60px_-30px_rgba(13,43,69,0.7)] motion-safe:animate-fade-in-up sm:px-8 sm:py-8">
        <svg
          className="pointer-events-none absolute -right-8 -top-12 h-56 w-56 text-sky-300/10"
          viewBox="0 0 220 220"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="110" cy="110" r="82" stroke="currentColor" />
          <circle cx="110" cy="110" r="54" stroke="currentColor" />
          <path d="M16 150C60 130 76 76 126 86C168 94 178 48 222 42" stroke="currentColor" />
        </svg>

        <div className="relative">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-sky-200">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden="true" />
              </span>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]">{t("app.name")}</p>
            </div>
            <time className="hidden text-xs font-medium text-slate-300 sm:block">{dateLabel}</time>
          </div>

          <h1 className="mt-6 font-display text-[2rem] font-extrabold leading-[1.12] tracking-[-0.045em] text-white sm:text-4xl">
            {greeting}
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">{t("home.dashboardTitle")}</p>

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3.5 backdrop-blur-sm sm:max-w-md">
            <span className="relative mt-1 flex h-3 w-3 shrink-0" aria-hidden="true">
              <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", status.dot)} />
              <span className={cn("relative inline-flex h-3 w-3 rounded-full", status.dot)} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-white">{status.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-300">{status.body}</p>
            </div>
          </div>
        </div>
      </header>

      <HomeQuickAccess />

      <HomeTrustedContacts />

      {!loading && active && (
        <section className="space-y-3 motion-safe:animate-fade-in-up">
          <div className="flex items-center justify-between px-1">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
              <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
              {t("home.activeTitle")}
            </h2>
            <Link
              to={`/journey/${active.id}`}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2 text-xs font-bold text-primary transition-colors hover:bg-secondary"
            >
              {t("action.open")}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          <Link to={`/journey/${active.id}`} className="block rounded-2xl focus-visible:outline-primary">
            <JourneyStatusCard journey={active.recipientSees} className="shadow-premium transition-transform hover:-translate-y-0.5" />
          </Link>
        </section>
      )}
    </div>
  );
};

export default Index;
