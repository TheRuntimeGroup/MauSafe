import { useMemo, useState } from "react";
import { ExternalLink, MapPin, Phone, PhoneOff, Search, ShieldAlert, WifiOff } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
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

  const divisions = useMemo(() => helpDivisions(), []);
  const results = useMemo(() => searchHelp(query, category, division), [query, category, division]);

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
        {HELP_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
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
      {results.length > 0 ? (
        <ul className="space-y-3">
          {results.map((entry) => (
            <li key={entry.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-base font-bold text-foreground">
                    {entry.serviceName}
                  </h2>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {entry.locality}
                    {entry.division && (
                      <span className="text-muted-foreground/80">· {entry.division}</span>
                    )}
                  </p>
                </div>
                {entry.action === "url" && entry.url ? (
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold text-primary hover:bg-muted"
                  >
                    {t("action.open")}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                ) : entry.phoneVerified && entry.phone ? (
                  <a
                    href={`tel:${entry.phone}`}
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground"
                  >
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    {entry.phone}
                  </a>
                ) : (
                  <span className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-muted px-3 text-sm font-semibold text-muted-foreground">
                    <PhoneOff className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("help.phoneUnverified")}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <section className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <p className="font-display text-base font-bold text-foreground">{t("help.noResults")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("help.noResultsHint")}</p>
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
