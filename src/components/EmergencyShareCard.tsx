import { useState } from "react";
import { Loader2, MapPin, Share2 } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { AppButton } from "@/components/ui/app-button";

export function EmergencyShareCard() {
  const { t } = useI18n();
  const [message, setMessage] = useState(() => t("sos.defaultMessage"));
  const [includeLocation, setIncludeLocation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusKey, setStatusKey] = useState<string | null>(null);
  const [locationWarning, setLocationWarning] = useState(false);

  async function shareMessage() {
    if (!message.trim() || busy) return;
    setBusy(true);
    setStatusKey(null);
    setLocationWarning(false);
    let text = message.trim();

    if (includeLocation) {
      if ("geolocation" in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 12_000,
              maximumAge: 30_000,
            });
          });
          const latitude = position.coords.latitude.toFixed(6);
          const longitude = position.coords.longitude.toFixed(6);
          const url = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
          text += `\n\n${t("location.sharingTitle")}: ${url}`;
        } catch {
          setLocationWarning(true);
        }
      } else {
        setLocationWarning(true);
      }
    }

    try {
      if (navigator.share) {
        try {
          await navigator.share({ title: `${t("app.name")} · ${t("sos.shareTitle")}`, text });
          setStatusKey("sos.opened");
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
          throw error;
        }
      } else {
        await navigator.clipboard.writeText(text);
        setStatusKey("sos.copied");
      }
    } catch {
      setStatusKey("sos.error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <Share2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <h2 className="font-display text-base font-bold text-foreground">{t("sos.shareTitle")}</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("sos.shareBody")}</p>
        </div>
      </div>

      <label htmlFor="emergency-message" className="mt-4 block text-sm font-semibold text-foreground">
        {t("sos.messageLabel")}
      </label>
      <textarea
        id="emergency-message"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        maxLength={500}
        rows={3}
        className="mt-2 w-full resize-y rounded-xl border border-input bg-card p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      <label className="mt-3 flex cursor-pointer items-center gap-3 text-sm text-foreground">
        <input
          type="checkbox"
          checked={includeLocation}
          onChange={(event) => setIncludeLocation(event.target.checked)}
          className="h-5 w-5 accent-[hsl(var(--primary))]"
        />
        <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
        {t("sos.includeLocation")}
      </label>

      <AppButton variant="primary" size="xl" className="mt-4" onClick={shareMessage} disabled={busy || !message.trim()}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
        {busy ? t("sos.preparing") : t("sos.share")}
      </AppButton>

      {locationWarning && <p className="mt-3 text-xs text-amber-700" role="status">{t("sos.locationError")}</p>}
      {statusKey && <p className="mt-3 text-xs text-muted-foreground" role="status">{t(statusKey)}</p>}
    </section>
  );
}
