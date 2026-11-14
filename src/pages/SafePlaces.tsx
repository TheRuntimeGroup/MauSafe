import { useEffect, useState } from "react";
import { Clock3, ExternalLink, Loader2, MapPin, Navigation, Phone, ShieldCheck } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { SafePlacesMap } from "@/components/SafePlacesMap";
import { AppButton } from "@/components/ui/app-button";
import type { SafePlace } from "@/lib/safePlaces";
import { cn } from "@/lib/utils";

type Position = { latitude: number; longitude: number; accuracy: number | null };
type Filter = "all" | "police" | "medical" | "transport" | "government" | "emergency";

const SafePlaces = () => {
  const { t } = useI18n();
  const [position, setPosition] = useState<Position | null>(null);
  const [places, setPlaces] = useState<SafePlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  async function findPlaces() {
    if (!("geolocation" in navigator)) {
      setErrorKey("places.unsupported");
      return;
    }
    setLoading(true);
    setErrorKey(null);
    setPosition(null);
    setPlaces([]);
    try {
      const current = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15_000,
          maximumAge: 30_000,
        });
      });
      const next = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        accuracy: Number.isFinite(current.coords.accuracy) ? current.coords.accuracy : null,
      };
      setPosition(next);
      const response = await fetch(
        `/api/safe-places?lat=${encodeURIComponent(next.latitude)}&lon=${encodeURIComponent(next.longitude)}`,
      );
      if (response.status === 400) {
        setPosition(null);
        setErrorKey("places.outsideMauritius");
        return;
      }
      if (!response.ok) throw new Error("Safe places unavailable");
      const data = (await response.json()) as { places: SafePlace[] };
      setPlaces(data.places);
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && (error as GeolocationPositionError).code === 1) {
        setErrorKey("places.permissionError");
      } else {
        setErrorKey("places.error");
      }
    } finally {
      setLoading(false);
    }
  }

  const filteredPlaces = places.filter((place) => {
    if (filter === "all") return true;
    if (filter === "medical") return ["hospital", "clinic", "doctors", "pharmacy", "medical"].includes(place.kind);
    return place.kind === filter;
  });
  const filters: Filter[] = ["all", "medical", "police", "transport", "government", "emergency"];

  useEffect(() => {
    void findPlaces();
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-foreground">{t("places.title")}</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("places.subtitle")}</p>
      </header>

      <div className="flex items-start gap-3 rounded-xl border border-primary/15 bg-secondary/50 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-secondary-foreground">{t("places.privacy")}</p>
      </div>

      <AppButton size="xl" onClick={() => void findPlaces()} disabled={loading}>
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
        {loading ? t("places.searching") : position ? t("places.refresh") : t("places.find")}
      </AppButton>

      {position?.accuracy !== null && position && (
        <p className="text-xs text-muted-foreground">{t("location.accuracy", { value: Math.round(position.accuracy!) })}</p>
      )}
      {errorKey && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="alert">{t(errorKey)}</p>}

      {position && !loading && (
        <>
          <SafePlacesMap center={position} places={places} />
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={cn(
                  "h-10 rounded-full border px-4 text-xs font-bold transition-colors",
                  filter === item ? "border-primary bg-primary text-white" : "border-border bg-card text-foreground",
                )}
              >
                {t(`places.filter.${item}`)}
              </button>
            ))}
          </div>

          {filteredPlaces.length === 0 ? (
            <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">{t("places.empty")}</p>
          ) : (
            <ul className="space-y-3">
              {filteredPlaces.map((place) => (
                <li key={place.id} className="glass-card rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary">
                        {t(`places.kind.${place.kind}`)}
                      </p>
                      <h2 className="mt-1 font-display text-base font-extrabold text-foreground">{place.name}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">{place.distanceKm.toFixed(1)} km</p>
                    </div>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-white"
                    >
                      <Navigation className="h-4 w-4" aria-hidden="true" />
                      {t("places.directions")}
                    </a>
                  </div>
                  {place.address && <p className="mt-3 text-xs text-muted-foreground">{place.address}</p>}
                  {place.openingHours && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" /> {place.openingHours}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-4 text-xs font-bold">
                    {place.phone && <a href={`tel:${place.phone}`} className="inline-flex items-center gap-1.5 text-primary"><Phone className="h-3.5 w-3.5" />{place.phone}</a>}
                    <a href={place.openStreetMapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-muted-foreground">
                      OpenStreetMap <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs leading-relaxed text-muted-foreground">{t("places.source")}</p>
        </>
      )}

      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
        {t("places.caution")}
      </p>
    </div>
  );
};

export default SafePlaces;
