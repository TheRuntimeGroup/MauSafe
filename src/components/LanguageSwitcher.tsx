import { ChevronDown, Languages } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { LANGUAGES, type Lang } from "@/i18n/translations";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useI18n();

  return (
    <label className="relative inline-flex items-center">
      {!compact && (
        <Languages className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
      )}
      <select
        aria-label="Language"
        value={lang}
        onChange={(event) => setLang(event.target.value as Lang)}
        className={cn(
          "cursor-pointer border text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          compact
            ? "h-10 w-[4.25rem] appearance-none rounded-full border-foreground/[0.08] bg-white pl-3.5 pr-6 text-xs font-extrabold uppercase shadow-sm"
            : "h-10 rounded-xl border-input bg-card pl-9 pr-3 text-sm font-medium",
        )}
      >
        {LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {compact ? language.code.toUpperCase() : language.native}
          </option>
        ))}
      </select>
      {compact && (
        <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
      )}
    </label>
  );
}
