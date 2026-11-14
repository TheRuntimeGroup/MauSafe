import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, LayoutDashboard, LoaderCircle, RefreshCw, Settings2 } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { FeatureSections } from "@/components/FeatureSections";
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

export default function Index() {
  const { t, locale } = useI18n();
  const { user, profile } = useAuth();
  const [active, setActive] = useState<OwnerJourney | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [homeView, setHomeView] = useState<"overview" | "tools">("overview");
  const now = useNow(60_000);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);

    listJourneys()
      .then(({ journeys }) => {
        if (cancelled) return;
        const real = journeys.find(
          (journey) => !journey.isDemo && (journey.status === "on_the_way" || journey.status === "overdue"),
        );
        setActive(real ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setActive(null);
          setLoadError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const displayName = useMemo(() => {
    const registeredName = profile?.full_name ?? user?.user_metadata?.full_name ?? user?.user_metadata?.name;
    const owner = (typeof registeredName === "string" ? registeredName : "").trim()
      || getOwnerName().trim()
      || loadEmergencyProfile().fullName.trim();
  const firstName = owner ? owner.split(/\s+/)[0] : "";
    return firstName.charAt(0).toLocaleUpperCase(locale) + firstName.slice(1);
  }, [profile, user, locale]);

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

  const status = loading
    ? { dot: "bg-slate-300", title: t("common.loading"), body: t("home.status.activeBody") }
    : loadError
      ? { dot: "bg-amber-300", title: t("common.error"), body: t("home.journeyLoadError") }
      : {
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
    <div className="mx-auto max-w-3xl space-y-7">
      <FeatureSections
        sections={[
          { id: "overview", labelKey: "home.overview", icon: LayoutDashboard },
          { id: "tools", labelKey: "home.quickTitle", icon: Settings2 },
        ]}
        activeId={homeView}
        onSelect={(id) => setHomeView(id as "overview" | "tools")}
      />

      <header className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0D2B45] px-6 py-7 text-white shadow-[0_24px_60px_-30px_rgba(13,43,69,0.7)] motion-safe:animate-fade-in-up sm:px-8 sm:py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-sky-200">{t("app.name")}</p>
            <h1 className="mt-4 font-display text-[2rem] font-extrabold leading-[1.12] tracking-[-0.045em] text-white sm:text-4xl">
              {greeting}
            </h1>
          </div>
          <time className="shrink-0 pt-1 text-right text-[11px] font-medium leading-relaxed text-slate-300 sm:text-xs">
            {dateLabel}
          </time>
        </div>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">{t("home.dashboardTitle")}</p>

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3.5 sm:max-w-md">
          <span className="relative mt-1 flex h-3 w-3 shrink-0" aria-hidden="true">
            {!loading && !loadError && (
              <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-50 motion-safe:animate-ping", status.dot)} />
            )}
            <span className={cn("relative inline-flex h-3 w-3 rounded-full", status.dot)} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-white">{status.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-300">{status.body}</p>
          </div>
        </div>
        <AnnouncementBanner variant="dashboard" />
      </header>

      {loadError && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5 text-sm font-semibold text-amber-950">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t("home.journeyLoadError")}</span>
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
            className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-xl border border-amber-300 bg-white px-3 text-xs font-extrabold text-amber-950 transition-colors hover:bg-amber-100"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            {t("common.retry")}
          </button>
        </div>
      )}

      {homeView === "overview" && (loading ? (
        <div className="flex min-h-28 items-center justify-center rounded-2xl border border-foreground/[0.07] bg-white/60" role="status">
          <LoaderCircle className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
          <span className="ml-2 text-sm font-semibold text-muted-foreground">{t("common.loading")}</span>
        </div>
      ) : active ? (
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
      ) : null}

      {homeView === "overview" ? <HomeTrustedContacts /> : <HomeQuickAccess />}
    </div>
  );
}
