import { useMemo, useState } from "react";
import { MapPin, Navigation, Phone, Search } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { HELP_ENTRIES, type HelpEntry } from "@/data/helpDirectory";
import { cn } from "@/lib/utils";

type DirectoryFilter = "all" | "police" | "hospital";

function isSafePlace(entry: HelpEntry): boolean {
  return entry.category === "police_station" || entry.category === "hospital";
}

function isHospital(entry: HelpEntry): boolean {
  return entry.category === "hospital";
}

function directionsUrl(entry: HelpEntry): string {
  const query = entry.directionsQuery ?? `${entry.serviceName}, ${entry.locality}, Mauritius`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function locationLabel(entry: HelpEntry): string {
  if (isHospital(entry)) {
    // For hospitals, `locality` is the district and `division` repeats it.
    return entry.locality;
  }
  return [entry.locality, entry.division].filter(Boolean).join(" · ");
}

function telHref(phone: string): string {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

export function SafePlacesDirectory() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DirectoryFilter>("all");

  const safePlaces = useMemo(() => HELP_ENTRIES.filter(isSafePlace), []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return safePlaces.filter((entry) => {
      if (filter !== "all") {
        const kind = entry.category === "police_station" ? "police" : "hospital";
        if (kind !== filter) return false;
      }
      if (!q) return true;
      const haystack = [entry.serviceName, entry.locality, entry.division ?? "", entry.address ?? ""]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [safePlaces, query, filter]);

  const filters: DirectoryFilter[] = ["all", "police", "hospital"];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-extrabold text-foreground">{t("places.directoryTitle")}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("places.directorySubtitle")}</p>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("places.directorySearch")}
          className="h-12 w-full rounded-2xl border border-input bg-card pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

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
            {item === "all" ? t("places.filter.all") : item === "police" ? t("places.filter.police") : t("places.filter.hospitals")}
          </button>
        ))}
      </div>

      <p className="px-1 text-xs font-semibold text-muted-foreground">{t("places.directoryResults", { count: results.length })}</p>

      {results.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">{t("places.directoryEmpty")}</p>
      ) : (
        <ul className="space-y-3">
          {results.map((entry) => (
            <li key={entry.id} className="glass-card rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary">
                    {isHospital(entry) ? t("places.kind.hospital") : t("places.kind.police")}
                  </p>
                  <h3 className="mt-1 font-display text-base font-extrabold text-foreground">{entry.serviceName}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {locationLabel(entry)}
                  </p>
                </div>
                <a
                  href={directionsUrl(entry)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-white"
                >
                  <Navigation className="h-4 w-4" aria-hidden="true" />
                  {t("places.directions")}
                </a>
              </div>
              {isHospital(entry) && entry.address && (
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{entry.address}</p>
              )}
              {entry.phone && (
                <a href={telHref(entry.phone)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  {entry.phone}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">{t("places.directorySource")}</p>
    </section>
  );
}
