import { useState } from "react";
import { MapPinned, Siren } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import Emergency from "@/pages/Emergency";
import SafePlaces from "@/pages/SafePlaces";
import { cn } from "@/lib/utils";

export default function SosMap() {
  const { t } = useI18n();
  const [view, setView] = useState<"sos" | "map">("sos");

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-muted/70 p-1" aria-label={t("nav.sosMap")}>
        <button
          type="button"
          aria-pressed={view === "sos"}
          onClick={() => setView("sos")}
          className={cn(
            "flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-extrabold transition-colors",
            view === "sos"
              ? "bg-white text-danger shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Siren className="h-4 w-4" aria-hidden="true" />
          {t("sosMap.sos")}
        </button>
        <button
          type="button"
          aria-pressed={view === "map"}
          onClick={() => setView("map")}
          className={cn(
            "flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-extrabold transition-colors",
            view === "map"
              ? "bg-white text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <MapPinned className="h-4 w-4" aria-hidden="true" />
          {t("sosMap.places")}
        </button>
      </div>

      {view === "sos" ? <Emergency /> : <SafePlaces />}
    </div>
  );
}
