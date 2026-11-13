import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Baby,
  BookOpen,
  CloudSun,
  FileWarning,
  Heart,
  IdCard,
  LifeBuoy,
  ListChecks,
  MapPinned,
  Settings2,
  ShieldAlert,
  Siren,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AppButton } from "@/components/ui/app-button";
import { cn } from "@/lib/utils";

type QuickTool = { id: string; to: string; labelKey: string; icon: LucideIcon };

const TOOLS: QuickTool[] = [
  { id: "scam", to: "/scam-check", labelKey: "nav.scam", icon: ShieldAlert },
  { id: "help", to: "/get-help", labelKey: "nav.gethelp", icon: LifeBuoy },
  { id: "places", to: "/safe-places", labelKey: "places.title", icon: MapPinned },
  { id: "child", to: "/child-safety", labelKey: "nav.child", icon: Baby },
  { id: "weather", to: "/disaster-safety", labelKey: "nav.disaster", icon: CloudSun },
  { id: "alarm", to: "/safety-alarm", labelKey: "alarm.title", icon: Siren },
  { id: "incident", to: "/incident-report", labelKey: "incident.title", icon: FileWarning },
  { id: "identity", to: "/emergency-id", labelKey: "profile.title", icon: IdCard },
  { id: "contacts", to: "/contacts", labelKey: "nav.contacts", icon: Heart },
  { id: "journeys", to: "/check-ins", labelKey: "nav.checkins", icon: ListChecks },
  { id: "tips", to: "/safety-tips", labelKey: "nav.tips", icon: BookOpen },
];

const STORAGE_KEY = "mausafe.quickAccess";
const DEFAULT_IDS = ["scam", "help", "places", "alarm"];

function loadSelection() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (Array.isArray(parsed)) {
      const valid = parsed.filter((id): id is string => typeof id === "string" && TOOLS.some((tool) => tool.id === id));
      if (valid.length > 0) return Array.from(new Set(valid)).slice(0, 4);
    }
  } catch {
    // Use the default layout.
  }
  return DEFAULT_IDS;
}

export function HomeQuickAccess() {
  const { t } = useI18n();
  const [selectedIds, setSelectedIds] = useState<string[]>(loadSelection);
  const [draftIds, setDraftIds] = useState<string[]>(selectedIds);
  const [open, setOpen] = useState(false);
  const selectedTools = selectedIds.map((id) => TOOLS.find((tool) => tool.id === id)).filter(
    (tool): tool is QuickTool => !!tool,
  );

  function toggleDraft(id: string) {
    setDraftIds((current) => {
      if (current.includes(id)) return current.length === 1 ? current : current.filter((item) => item !== id);
      return current.length < 4 ? [...current, id] : current;
    });
  }

  function move(id: string, direction: -1 | 1) {
    setDraftIds((current) => {
      const index = current.indexOf(id);
      const destination = index + direction;
      if (index < 0 || destination < 0 || destination >= current.length) return current;
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  }

  function saveLayout() {
    setSelectedIds(draftIds);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draftIds));
    } catch {
      // The layout remains applied for this session.
    }
    setOpen(false);
  }

  return (
    <section className="space-y-4 pt-1">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">
          {t("home.quickTitle")}
        </h2>
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (next) setDraftIds(selectedIds);
          }}
        >
          <DialogTrigger asChild>
            <button type="button" className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-primary hover:bg-secondary">
              <Settings2 className="h-4 w-4" aria-hidden="true" />
              {t("home.customise")}
            </button>
          </DialogTrigger>
          <DialogContent className="max-h-[88vh] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-3xl border-white/80 bg-white/95 backdrop-blur-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-extrabold">{t("home.customiseTitle")}</DialogTitle>
              <DialogDescription className="leading-relaxed">{t("home.customiseHint")}</DialogDescription>
            </DialogHeader>
            <p className="text-xs font-bold text-primary">{t("home.quickLimit", { count: draftIds.length })}</p>
            <ul className="space-y-2">
              {TOOLS.filter((tool) => draftIds.includes(tool.id) || draftIds.length < 4).map((tool) => {
                const selected = draftIds.includes(tool.id);
                const index = draftIds.indexOf(tool.id);
                return (
                  <li key={tool.id} className={cn("flex items-center gap-2 rounded-xl border p-2.5", selected ? "border-primary/25 bg-secondary" : "border-border bg-white")}>
                    <button
                      type="button"
                      onClick={() => toggleDraft(tool.id)}
                      aria-pressed={selected}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <tool.icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                      <span className="truncate text-sm font-bold text-foreground">{t(tool.labelKey)}</span>
                    </button>
                    {selected && (
                      <span className="flex shrink-0 gap-1">
                        <button type="button" onClick={() => move(tool.id, -1)} disabled={index === 0} aria-label={t("home.moveUp")} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-foreground disabled:opacity-30">
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => move(tool.id, 1)} disabled={index === draftIds.length - 1} aria-label={t("home.moveDown")} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-foreground disabled:opacity-30">
                          <ArrowDown className="h-4 w-4" />
                        </button>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            <AppButton size="xl" onClick={saveLayout}>{t("home.saveLayout")}</AppButton>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {selectedTools.map((tool) => (
          <Link
            key={tool.id}
            to={tool.to}
            className="glass-card group flex min-h-36 flex-col justify-between rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-premium"
          >
            <div className="flex items-start justify-between">
              <tool.icon className="h-6 w-6 text-primary" strokeWidth={1.8} aria-hidden="true" />
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
            </div>
            <span className="mt-6 font-display text-sm font-extrabold leading-tight text-foreground sm:text-base">
              {t(tool.labelKey)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
