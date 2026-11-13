import { Languages } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { LANGUAGES, type Lang } from "@/i18n/translations";

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <label className="relative inline-flex items-center">
      <Languages className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <select
        aria-label="Language"
        value={lang}
        onChange={(event) => setLang(event.target.value as Lang)}
        className="h-10 cursor-pointer rounded-xl border border-input bg-card pl-9 pr-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.native}
          </option>
        ))}
      </select>
    </label>
  );
}
