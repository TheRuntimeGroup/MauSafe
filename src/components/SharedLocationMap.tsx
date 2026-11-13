import { ExternalLink, MapPin } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { formatDateTime } from "@/lib/format";
import type { SharedLocation } from "@/lib/types";

export function SharedLocationMap({ location }: { location: SharedLocation }) {
  const { t, locale } = useI18n();
  const latitude = location.latitude.toFixed(6);
  const longitude = location.longitude.toFixed(6);
  const lat = location.latitude;
  const lon = location.longitude;
  const bbox = [lon - 0.008, lat - 0.008, lon + 0.008, lat + 0.008].join("%2C");
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  const mapUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-2 p-4">
        <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
        <h2 className="font-display text-base font-bold text-foreground">{t("location.liveMap")}</h2>
      </div>
      <iframe
        title={t("location.liveMap")}
        src={embedUrl}
        className="h-72 w-full border-0"
        loading="lazy"
      />
      <div className="space-y-2 p-4 text-xs text-muted-foreground">
        {location.accuracy !== null && (
          <p className="font-semibold text-foreground">
            {t("location.accuracy", { value: Math.round(location.accuracy) })}
          </p>
        )}
        {location.updatedAt && <p>{formatDateTime(location.updatedAt, locale)}</p>}
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-bold text-primary"
        >
          {t("location.openMap")}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
