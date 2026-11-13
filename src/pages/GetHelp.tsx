import { useMemo, useState } from "react";
import { ExternalLink, Mail, MapPin, Navigation, Phone, PhoneOff, Search, ShieldAlert, Star, WifiOff } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { PhoneCallMenu } from "@/components/PhoneCallMenu";
import { ServiceDetailsDialog } from "@/components/ServiceDetailsDialog";
import { getSavedServiceIds, setSavedServiceIds } from "@/lib/savedServices";
import {
  HELP_CATEGORIES,
  helpDivisions,
  searchHelp,
  type HelpCategory,
} from "@/data/helpDirectory";
import { cn } from "@/lib/utils";

const GetHelp = () => {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<HelpCategory | "all">("all");
  const [division, setDivision] = useState("all");
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set(getSavedServiceIds()));
  const [savedOnly, setSavedOnly] = useState(false);

  const divisions = useMemo(() => helpDivisions(), []);
  const results = useMemo(() => {
    const matches = searchHelp(query, category, division);
    return savedOnly ? matches.filter((entry) => savedIds.has(entry.id)) : matches;
  }, [query, category, division, savedOnly, savedIds]);

  function toggleSaved(id: string) {
    setSavedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSavedServiceIds(Array.from(next));
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold text-foreground">{t("help.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("help.subtitle")}</p>
      </header>

      {/* National emergency contacts */}
      <section className="rounded-2xl border border-danger/15 bg-card p-4">
        <h2 className="mb-3 font-display text-base font-bold text-foreground">{t("emergency.otherTitle")}</h2>
        <div className="grid grid-cols-3 gap-2">
          <a href="tel:999" className="flex min-h-20 flex-col items-center justify-center rounded-xl bg-danger px-2 text-center text-white">
            <Phone className="h-4 w-4" aria-hidden="true" />
            <span className="mt-1 text-xs font-bold">{t("nav.emergency")}</span>
            <span className="font-display text-lg font-extrabold">999</span>
          </a>
          <a href="tel:114" className="flex min-h-20 flex-col items-center justify-center rounded-xl border border-border px-2 text-center text-foreground hover:bg-muted">
            <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="mt-1 text-xs font-bold">{t("emergency.ambulance")}</span>
            <span className="font-display text-lg font-extrabold">114</span>
          </a>
          <a href="tel:115" className="flex min-h-20 flex-col items-center justify-center rounded-xl border border-border px-2 text-center text-foreground hover:bg-muted">
            <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="mt-1 text-xs font-bold">{t("emergency.fire")}</span>
            <span className="font-display text-lg font-extrabold">115</span>
          </a>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">{t("emergency.verifyNote")}</p>
        <a
          href="https://maucors.govmu.org/maucors/?page_id=9"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-primary"
        >
          <ShieldAlert className="h-4 w-4" aria-hidden="true" />
          {t("help.reportFraud")}
        </a>
      </section>

      {/* Search */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("help.searchPlaceholder")}
          className="h-12 w-full rounded-2xl border border-input bg-card pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSavedOnly((current) => !current)}
          aria-pressed={savedOnly}
          className={cn(
            "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors",
            savedOnly ? "border-amber-300 bg-amber-100 text-amber-900" : "border-border bg-card text-foreground hover:bg-muted",
          )}
        >
          <Star className={cn("h-3.5 w-3.5", savedOnly && "fill-current")} aria-hidden="true" />
          {t("help.savedOnly")} · {savedIds.size}
        </button>
        {HELP_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setCategory(c.id);
              setSavedOnly(false);
            }}
            className={cn(
              "h-10 rounded-full border px-4 text-sm font-semibold transition-colors",
              category === c.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            {t(c.labelKey)}
          </button>
        ))}
      </div>

      {/* Division filter */}
      <select
        value={division}
        onChange={(e) => setDivision(e.target.value)}
        aria-label={t("help.division")}
        className="h-11 w-full cursor-pointer rounded-2xl border border-input bg-card px-4 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="all">{t("help.category.all")}</option>
        {divisions.map((d) => (
          <option key={d} value={d}>
            {d === "unknown" ? t("help.unknown") : d}
          </option>
        ))}
      </select>

      {/* Results */}
      <div className="flex items-center justify-between px-1 text-xs font-semibold text-muted-foreground">
        <span>{t("help.results", { count: results.length })}</span>
        {savedOnly && <span className="flex items-center gap-1 text-amber-700"><Star className="h-3 w-3 fill-current" />{t("help.savedOnly")}</span>}
      </div>
      {results.length > 0 ? (
        <ul className="space-y-3">
          {results.map((entry) => (
            <li key={entry.id} className="glass-card rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <ServiceDetailsDialog
                    entry={entry}
                    saved={savedIds.has(entry.id)}
                    onToggleSaved={() => toggleSaved(entry.id)}
                  >
                    <button type="button" className="text-left font-display text-base font-bold text-foreground transition-colors hover:text-primary">
                      {entry.serviceName}
                    </button>
                  </ServiceDetailsDialog>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {entry.locality}
                    {entry.division && <span className="text-muted-foreground/80">· {entry.division}</span>}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSaved(entry.id)}
                    aria-label={savedIds.has(entry.id) ? t("help.removeSaved") : t("help.save")}
                    aria-pressed={savedIds.has(entry.id)}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white/70 transition-colors hover:bg-white",
                      savedIds.has(entry.id) ? "text-amber-500" : "text-muted-foreground",
                    )}
                  >
                    <Star className={cn("h-4 w-4", savedIds.has(entry.id) && "fill-current")} aria-hidden="true" />
                  </button>
                  {entry.action === "url" && entry.url ? (
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-white/70 px-3 text-sm font-semibold text-primary hover:bg-white"
                    >
                      {t("action.open")}
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  ) : entry.phoneVerified && entry.phone ? (
                    <PhoneCallMenu
                      serviceName={entry.serviceName}
                      phones={entry.phoneOptions ?? [entry.phone]}
                    />
                  ) : (
                    <span className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-muted px-3 text-sm font-semibold text-muted-foreground">
                      <PhoneOff className="h-3.5 w-3.5" aria-hidden="true" />
                      {t("help.phoneUnverified")}
                    </span>
                  )}
                  {entry.directionsQuery && (
                    <a
                      href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(entry.directionsQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${t("help.directions")} — ${entry.serviceName}`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white/70 text-primary hover:bg-white"
                    >
                      <Navigation className="h-4 w-4" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>

              {entry.address && <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{entry.address}</p>}
              {entry.alternatePhone && (
                <p className="mt-2 text-xs font-semibold text-foreground">
                  {t("help.alternatePhone")}: {entry.alternatePhone}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
                {entry.email && (
                  <a href={`mailto:${entry.email}`} className="inline-flex items-center gap-1.5 break-all font-semibold text-primary">
                    <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {entry.email}
                  </a>
                )}
                {(entry.sourceLabel || entry.sourceUrl) &&
                  (entry.sourceUrl ? (
                    <a href={entry.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                      {t("help.source")}: {entry.sourceLabel ?? entry.sourceUrl}
                    </a>
                  ) : (
                    <span>{t("help.source")}: {entry.sourceLabel}</span>
                  ))}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <section className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <p className="font-display text-base font-bold text-foreground">
            {savedOnly ? t("help.noSaved") : t("help.noResults")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {savedOnly ? t("help.noSavedHint") : t("help.noResultsHint")}
          </p>
        </section>
      )}

      {/* Coverage + offline */}
      <section className="space-y-3">
        <div className="rounded-2xl border border-border bg-secondary/60 p-5">
          <h2 className="font-display text-base font-bold text-foreground">
            {t("help.coverageTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("help.coverageBody")}</p>
        </div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <WifiOff className="h-4 w-4" aria-hidden="true" />
          {t("help.offline")}
        </p>
      </section>
    </div>
  );
};

export default GetHelp;
