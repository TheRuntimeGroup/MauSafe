import type { LucideIcon } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { cn } from "@/lib/utils";

export type FeatureSection = {
  id: string;
  labelKey: string;
  icon: LucideIcon;
};

export function FeatureSections({
  sections,
  activeId,
  onSelect,
}: {
  sections: FeatureSection[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const { t } = useI18n();

  return (
    <nav
      className="grid gap-1 rounded-2xl border border-border bg-muted/60 p-1"
      style={{ gridTemplateColumns: `repeat(${sections.length}, minmax(0, 1fr))` }}
      aria-label={t("features.sections")}
    >
      {sections.map((section) => {
        const selected = section.id === activeId;
        const Icon = section.icon;
        return (
          <button
            key={section.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(section.id)}
            className={cn(
              "flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 text-center text-xs font-extrabold transition-colors sm:text-sm",
              selected
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:bg-white/60 hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="leading-tight">{t(section.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}
