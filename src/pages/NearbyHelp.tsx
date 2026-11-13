import { useMemo, useState } from "react";
import {
  Building2,
  ExternalLink,
  Flame,
  Hospital,
  Info,
  List,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Navigation,
  PhoneCall,
  Shield,
  TentTree,
} from "lucide-react";
import { LeafletMap, type LeafletMarker, type MapTone } from "@/components/map/LeafletMap";
import {
  directoryEntries,
  directoryKindMeta,
  haversineKm,
  mapsDirectionsUrl,
  type DirectoryKind,
} from "@/lib/directory";
import { cn } from "@/lib/utils";

const kindIcons: Record<DirectoryKind, typeof Hospital> = {
  hospital: Hospital,
  police: Shield,
  fire: Flame,
  shelter: TentTree,
};

const kindTones: Record<DirectoryKind, MapTone> = {
  hospital: "red",
  police: "teal",
  fire: "amber",
  shelter: "blue",
};

const filters: { value: DirectoryKind | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "hospital", label: "Hospitals" },
  { value: "police", label: "Police" },
  { value: "fire", label: "Fire" },
  { value: "shelter", label: "Cyclone shelters" },
];

export default function NearbyHelp() {
  const [activeKind, setActiveKind] = useState<DirectoryKind | "all">("all");
  const [view, setView] = useState<"map" | "list">("map");
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const entries = useMemo(() => {
    const filtered = directoryEntries.filter((entry) => activeKind === "all" || entry.kind === activeKind);
    if (!userLocation) return filtered;
    return [...filtered].sort(
      (a, b) =>
        haversineKm(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude) -
        haversineKm(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude),
    );
  }, [activeKind, userLocation]);

  const markers: LeafletMarker[] = useMemo(
    () =>
      entries.map((entry) => ({
        id: entry.id,
        latitude: entry.latitude,
        longitude: entry.longitude,
        label: entry.name,
        description: `${directoryKindMeta[entry.kind].label} · ${entry.area}${entry.phone ? ` · ${entry.phone}` : ""}`,
        tone: kindTones[entry.kind],
      })),
    [entries],
  );

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationError("Location is not available on this device or browser.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocationError("We could not access your location. Check your permission settings.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 },
    );
  }

  return (
    <div>
      <section className="border-b border-[#DDE5DC]">
        <div className="mx-auto max-w-[980px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#CADBCB] bg-[#EAF2E8] px-3.5 py-2 text-xs font-extrabold text-[#315E54]">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Directory · coordinates approximate
          </div>
          <h1 className="mt-6 font-display text-[2.4rem] font-extrabold leading-[1.04] tracking-[-0.05em] text-[#17332F] sm:text-5xl">
            Find help near you.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-[#5B6D67]">
            Hospitals, police stations, fire &amp; rescue and cyclone shelters. Call an emergency number first in a life-threatening situation.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[980px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveKind(filter.value)}
                aria-pressed={activeKind === filter.value}
                className={cn(
                  "min-h-11 rounded-full border px-4 text-sm font-bold transition",
                  activeKind === filter.value
                    ? "border-[#0D5C56] bg-[#0D5C56] text-white"
                    : "border-[#D5E0D6] bg-white text-[#5B6D67] hover:border-[#9DB5A6] hover:text-[#17332F]",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-[#D5E0D6] bg-white p-1" role="group" aria-label="View">
              <button
                type="button"
                onClick={() => setView("map")}
                aria-pressed={view === "map"}
                className={cn(
                  "flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition",
                  view === "map" ? "bg-[#E4F0E9] text-[#0D5C56]" : "text-[#687A72] hover:text-[#17332F]",
                )}
              >
                <MapIcon className="h-4 w-4" aria-hidden="true" /> Map
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
                className={cn(
                  "flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition",
                  view === "list" ? "bg-[#E4F0E9] text-[#0D5C56]" : "text-[#687A72] hover:text-[#17332F]",
                )}
              >
                <List className="h-4 w-4" aria-hidden="true" /> List
              </button>
            </div>

            <button
              type="button"
              onClick={requestLocation}
              disabled={locating}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition disabled:opacity-60",
                userLocation
                  ? "border-[#0D5C56] bg-[#0D5C56] text-white"
                  : "border-[#D5E0D6] bg-white text-[#315E54] hover:border-[#0D5C56]",
              )}
            >
              <LocateFixed className={cn("h-4 w-4", locating && "animate-spin")} aria-hidden="true" />
              {userLocation ? "Sorted by distance" : "Use my location"}
            </button>
          </div>
        </div>

        {locationError && (
          <div role="alert" className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#EAB6AB] bg-[#FFF0ED] p-3.5 text-sm leading-6 text-[#873B30]">
            <Info className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" /> {locationError}
          </div>
        )}

        <div className="mt-6">
          {view === "map" ? (
            <LeafletMap markers={markers} className="h-[420px] sm:h-[520px]" />
          ) : (
            <div className="grid gap-3">
              {entries.map((entry) => {
                const KindIcon = kindIcons[entry.kind];
                const distance = userLocation
                  ? haversineKm(userLocation.latitude, userLocation.longitude, entry.latitude, entry.longitude)
                  : null;
                return (
                  <article key={entry.id} className="rounded-[1.5rem] border border-[#DCE4DD] bg-white p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", {
                        hospital: "bg-[#FBE4DE] text-[#A33D30]",
                        police: "bg-[#E4F0E9] text-[#0D5C56]",
                        fire: "bg-[#F8EBD7] text-[#9A5B0C]",
                        shelter: "bg-[#E7EEF8] text-[#2563EB]",
                      }[entry.kind])}>
                        <KindIcon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-base font-bold text-[#17332F]">{entry.name}</h3>
                          {distance !== null && (
                            <span className="rounded-full bg-[#EFF4EF] px-2.5 py-1 text-[11px] font-extrabold text-[#315E54]">
                              {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-[#5B6D67]">{entry.address} · {entry.area}</p>
                        {entry.note && <p className="mt-1 text-xs leading-5 text-[#9A6815]">{entry.note}</p>}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {entry.phone && (
                        <a
                          href={`tel:${entry.phone.replace(/[^0-9+]/g, "")}`}
                          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#DCE4DD] px-3 text-xs font-bold text-[#315E54] transition hover:border-[#0D5C56]"
                        >
                          <PhoneCall className="h-4 w-4" aria-hidden="true" /> {entry.phone}
                        </a>
                      )}
                      <a
                        href={mapsDirectionsUrl(entry)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#DCE4DD] px-3 text-xs font-bold text-[#315E54] transition hover:border-[#0D5C56]"
                      >
                        <Navigation className="h-4 w-4" aria-hidden="true" /> Directions
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#EACD8D] bg-[#FFF6E2] p-4">
          <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-[#9A6815]" aria-hidden="true" />
          <p className="text-sm leading-6 text-[#6D5224]">
            Coordinates and phone numbers are provided for orientation and may not reflect the latest opening hours or services. Verify before travelling, and do not rely on this directory during a live emergency.
          </p>
        </div>
      </section>
    </div>
  );
}
