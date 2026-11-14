import { Crown, ShieldCheck, Sprout } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import type { GameLevel } from "@/lib/kidProgress";
import { cn } from "@/lib/utils";

const LEVELS = [
  { id: "beginner" as const, icon: Sprout },
  { id: "skilled" as const, icon: ShieldCheck },
  { id: "expert" as const, icon: Crown },
];

export function LevelPicker({ value, onChange }: { value: GameLevel; onChange: (level: GameLevel) => void }) {
  const { t } = useI18n();
  return (
    <fieldset>
      <legend className="px-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#7CE8C1]">{t("arcade.chooseLevel")}</legend>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {LEVELS.map((level) => (
          <button
            key={level.id}
            type="button"
            onClick={() => onChange(level.id)}
            aria-pressed={value === level.id}
            className={cn(
              "rounded-2xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9C74F] sm:p-3.5",
              value === level.id ? "border-[#F9C74F] bg-[#254334] text-white" : "border-[#CADFD9] bg-white text-foreground hover:border-emerald-500",
            )}
          >
            <level.icon className={cn("h-4 w-4", value === level.id ? "text-[#F9C74F]" : "text-emerald-700")} aria-hidden="true" />
            <span className="mt-2 block font-display text-xs font-extrabold sm:text-sm">{t(`level.${level.id}.title`)}</span>
            <span className={cn("mt-1 block text-[10px] leading-snug", value === level.id ? "text-[#D9EEE1]" : "text-muted-foreground")}>{t(`level.${level.id}.body`)}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
