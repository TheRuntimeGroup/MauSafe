import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Navigation, Square } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { disableJourneyLocation, updateJourneyLocation } from "@/lib/api";
import { formatClock } from "@/lib/format";
import { AppButton } from "@/components/ui/app-button";
import type { OwnerJourney } from "@/lib/types";

export function LocationSharingCard({
  journey,
  onUpdate,
}: {
  journey: OwnerJourney;
  onUpdate: (journey: OwnerJourney) => void;
}) {
  const { t, locale } = useI18n();
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stopping, setStopping] = useState(false);
  const updateRef = useRef(onUpdate);
  updateRef.current = onUpdate;

  useEffect(() => {
    if (!sharing) return;
    if (!("geolocation" in navigator)) {
      setError(t("location.unsupported"));
      setSharing(false);
      return;
    }

    let lastSentAt = 0;
    let sending = false;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (sending || now - lastSentAt < 12_000) return;
        sending = true;
        lastSentAt = now;
        setError(null);
        void updateJourneyLocation(journey.id, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
        })
          .then(({ journey: updated }) => updateRef.current(updated))
          .catch(() => setError(t("location.updateError")))
          .finally(() => {
            sending = false;
          });
      },
      (geoError) => {
        setError(
          geoError.code === geoError.PERMISSION_DENIED
            ? t("location.permissionError")
            : t("location.positionError"),
        );
        setSharing(false);
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 5_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [journey.id, sharing, t]);

  async function stopSharing() {
    setSharing(false);
    setStopping(true);
    try {
      const { journey: updated } = await disableJourneyLocation(journey.id);
      updateRef.current(updated);
    } catch {
      setError(t("location.stopError"));
    } finally {
      setStopping(false);
    }
  }

  const location = journey.location;

  return (
    <section className="rounded-2xl border border-primary/15 bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
          <MapPin className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-base font-bold text-foreground">{t("location.sharingTitle")}</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("location.consent")}</p>
        </div>
      </div>

      {location && (
        <div className="mt-4 rounded-xl bg-secondary/60 p-3 text-xs text-secondary-foreground">
          <p className="font-bold">
            {location.accuracy !== null
              ? t("location.accuracy", { value: Math.round(location.accuracy) })
              : t("location.waiting")}
          </p>
          {location.updatedAt && (
            <p className="mt-1">{t("location.updated", { time: formatClock(location.updatedAt, locale) })}</p>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-danger" role="alert">{error}</p>}

      <div className="mt-4">
        {sharing ? (
          <AppButton variant="danger" size="xl" onClick={stopSharing} disabled={stopping}>
            {stopping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
            {t("location.stop")}
          </AppButton>
        ) : journey.locationEnabled ? (
          <AppButton variant="primary" size="xl" onClick={() => setSharing(true)}>
            <Navigation className="h-4 w-4" aria-hidden="true" />
            {location ? t("location.resume") : t("location.start")}
          </AppButton>
        ) : (
          <p className="text-sm font-semibold text-muted-foreground">{t("location.stopped")}</p>
        )}
      </div>
    </section>
  );
}
