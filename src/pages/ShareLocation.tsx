import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Clock3, LoaderCircle, MapPin, ShieldOff } from "lucide-react";
import { Logo } from "@/components/Logo";
import { SharedLocationMap } from "@/components/SharedLocationMap";
import { useI18n } from "@/i18n/I18nContext";
import { getGuestJourney } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { GuestJourney } from "@/lib/types";

function remainingMinutes(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 60000);
}

export default function ShareLocation() {
  const { t, locale } = useI18n();
  const { token } = useParams<{ token: string }>();
  const [journey, setJourney] = useState<GuestJourney | null>(null);
  const [loading, setLoading] = useState(() => !!token);
  const [expired, setExpired] = useState(false);
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    async function load() {
      try {
        const { journey: nextJourney } = await getGuestJourney(token!);
        if (!active) return;
        if (nextJourney.status === "expired" || nextJourney.revoked) {
          setExpired(true);
          return;
        }
        setJourney(nextJourney);
        setExpired(false);
        setMinutesLeft(remainingMinutes(nextJourney.expiresAt));
      } catch {
        if (active) setExpired(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 15000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [token]);

  useEffect(() => {
    if (!journey) return;
    const update = () => setMinutesLeft(remainingMinutes(journey.expiresAt));
    update();
    const interval = window.setInterval(update, 60000);
    return () => window.clearInterval(interval);
  }, [journey]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-primary" aria-hidden="true" /></div>;
  }
  if (expired || !journey) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5 py-8">
        <section className="w-full max-w-md rounded-[1.75rem] border border-[#DDE6ED] bg-card p-7 text-center shadow-premium">
          <ShieldOff className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
          <h1 className="mt-4 font-display text-2xl font-extrabold text-foreground">{t("quickShare.expiredTitle")}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("quickShare.expiredBody")}</p>
          <Link to="/" className="mt-5 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">{t("app.ctaStart")}</Link>
        </section>
      </main>
    );
  }

  const authorizedLocation = journey.location;
  return (
    <div className="relative min-h-screen bg-background px-5 py-6">
      <header className="mx-auto flex max-w-2xl justify-center pb-6"><Logo variant="full" className="h-10 w-32" /></header>
      <main className="mx-auto max-w-2xl space-y-5">
        <section className="rounded-[1.75rem] border border-[#DDE6ED] bg-card p-5 shadow-premium sm:p-7">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-primary"><MapPin className="h-5 w-5" aria-hidden="true" /></span>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-foreground">{t("quickShare.mapTitle", { name: journey.senderName })}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("quickShare.mapSubtitle")}</p>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
            <Clock3 className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t("quickShare.remaining", { minutes: minutesLeft ?? 0 })}
          </div>
          {authorizedLocation && authorizedLocation.accuracy !== null && (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {t("location.accuracy", { value: Math.round(authorizedLocation?.accuracy ?? 0) })} · {t("location.approximate")}
            </p>
          )}
          {authorizedLocation?.updatedAt && (
            <p className="mt-1 text-xs text-muted-foreground">{t("location.updated", { time: formatDateTime(journey.location.updatedAt, locale) })}</p>
          )}
        </section>
        {journey.location && <SharedLocationMap location={journey.location} />}
      </main>
    </div>
  );
}
