import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Phone, ShieldCheck } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { getGuestJourney, ApiError } from "@/lib/api";
import { formatClock, formatDateTime } from "@/lib/format";
import { Logo } from "@/components/Logo";
import { SharedLocationMap } from "@/components/SharedLocationMap";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { StatusPill } from "@/components/StatusPill";
import { useNow } from "@/hooks/useNow";
import { cn } from "@/lib/utils";
import type { GuestJourney } from "@/lib/types";

type GuestError = "not_found" | "expired" | "revoked" | "error";

const GuestView = () => {
  const { token } = useParams<{ token: string }>();
  const { t, locale } = useI18n();
  const [journey, setJourney] = useState<GuestJourney | null>(null);
  const [error, setError] = useState<GuestError | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function refresh() {
      try {
        const { journey } = await getGuestJourney(token!);
        if (!cancelled) {
          setJourney(journey);
          setError(null);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        if (err instanceof ApiError) {
          if (err.code === "link_not_found") setError("not_found");
          else if (err.code === "link_expired") setError("expired");
          else if (err.code === "link_revoked") setError("revoked");
          else setError("error");
        } else {
          setError("error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void refresh();
    const interval = window.setInterval(() => void refresh(), 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <Logo className="h-8 w-8" />
          <span className="font-display text-base font-bold text-foreground">{t("app.name")}</span>
        </div>
        <LanguageSwitcher />
      </header>

      <main className="mx-auto w-full max-w-xl px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
          </div>
        ) : error ? (
          <GuestErrorState error={error} />
        ) : journey ? (
          <GuestJourneyCard journey={journey} />
        ) : null}
      </main>
    </div>
  );
};

function GuestErrorState({ error }: { error: GuestError }) {
  const { t } = useI18n();
  const map: Record<GuestError, { title: string; body: string }> = {
    not_found: { title: t("guest.notFoundTitle"), body: t("guest.notFoundBody") },
    expired: { title: t("guest.expiredTitle"), body: t("guest.expiredBody") },
    revoked: { title: t("guest.revokedTitle"), body: t("guest.revokedBody") },
    error: { title: t("common.error"), body: "" },
  };
  const content = map[error];
  return (
    <section className="rounded-2xl border border-border bg-card p-8 text-center">
      <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
      <h1 className="mt-4 font-display text-xl font-bold text-foreground">{content.title}</h1>
      {content.body && <p className="mt-2 text-sm text-muted-foreground">{content.body}</p>}
    </section>
  );
}

function GuestJourneyCard({ journey }: { journey: GuestJourney }) {
  const { t, locale } = useI18n();
  useNow(1000);

  const name = journey.senderName;
  const statusLabel = t(`status.${journey.status}`);

  return (
    <div className="space-y-5">
      <header className="text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">
          {t("guest.title", { name })}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("guest.subtitle", { name })}</p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <StatusPill status={journey.status} label={statusLabel} />
          {journey.isDemo && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              {t("guest.demoBadge")}
            </span>
          )}
        </div>

        <div className="mt-5 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">{t("guest.expected")}</span>
            <span className="font-semibold text-foreground">
              {formatClock(journey.expectedArrivalAt, locale)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">{t("guest.lastUpdate")}</span>
            <span className="font-semibold text-foreground">
              {formatDateTime(journey.lastStatusAt, locale)}
            </span>
          </div>
        </div>

        {journey.status === "overdue" && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="font-display text-base font-bold text-amber-800">
              {t("guest.overdueTitle", { name })}
            </h2>
            <p className="mt-1 text-sm text-amber-800/90">{t("guest.overdueBody", { name })}</p>
            <a
              href="tel:999"
              className="mt-3 inline-flex h-11 items-center gap-2 rounded-2xl bg-danger px-4 text-sm font-semibold text-danger-foreground"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              {t("guest.call999")}
            </a>
          </div>
        )}

        {journey.status === "arrived" && (
          <div
            className={cn(
              "mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center",
            )}
          >
            <p className="font-display text-base font-bold text-emerald-800">
              {t("guest.arrivedTitle", { name })}
            </p>
          </div>
        )}

        {journey.status === "cancelled" && (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="font-display text-base font-bold text-foreground">
              {t("guest.cancelledTitle")}
            </p>
          </div>
        )}
      </section>

      {journey.location && <SharedLocationMap location={journey.location} />}

      <section className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs text-muted-foreground">{t("guest.noAlerts")}</p>
        <p className="mt-2 text-xs text-muted-foreground">{t("guest.viewOnly")}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("guest.expires")} {formatDateTime(journey.expiresAt, locale)}
        </p>
      </section>
    </div>
  );
}

export default GuestView;
