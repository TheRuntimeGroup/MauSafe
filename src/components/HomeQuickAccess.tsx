import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Baby,
  FileWarning,
  Heart,
  IdCard,
  LifeBuoy,
  ListChecks,
  Plus,
  Settings2,
  ShieldAlert,
  Siren,
  X,
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
  { id: "scam", to: "/scam-check", labelKey: "quick.scam", icon: ShieldAlert },
  { id: "help", to: "/get-help", labelKey: "quick.help", icon: LifeBuoy },
  { id: "child", to: "/child-safety", labelKey: "quick.child", icon: Baby },
  { id: "alarm", to: "/safety-alarm", labelKey: "quick.alarm", icon: Siren },
  { id: "incident", to: "/incident-report", labelKey: "quick.incident", icon: FileWarning },
  { id: "identity", to: "/emergency-id", labelKey: "quick.identity", icon: IdCard },
  { id: "contacts", to: "/contacts", labelKey: "quick.contacts", icon: Heart },
  { id: "journeys", to: "/check-ins", labelKey: "quick.journeys", icon: ListChecks },
];

const STORAGE_KEY = "mausafe.quickAccess";
const DEFAULT_IDS = TOOLS.map((tool) => tool.id);

function loadSelection() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (Array.isArray(parsed)) {
      const valid = parsed.filter((id): id is string => typeof id === "string" && TOOLS.some((tool) => tool.id === id));
      if (valid.length > 0) return Array.from(new Set(valid));
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
      return current.includes(id) ? current : [...current, id];
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
        <div>
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{t("app.name")}</p>
          <h2 className="mt-1 font-display text-xl font-extrabold tracking-tight text-foreground">
            {t("home.quickTitle")}
          </h2>
        </div>
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (next) setDraftIds(selectedIds);
          }}
        >
          <DialogTrigger asChild>
            <button type="button" className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#DDE6ED] bg-white px-3 text-xs font-bold text-primary shadow-sm transition-all hover:border-primary/20 hover:bg-secondary">
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
              {TOOLS.map((tool) => {
                const selected = draftIds.includes(tool.id);
                const index = draftIds.indexOf(tool.id);
                const addDisabled = !selected && draftIds.length >= TOOLS.length;
                return (
                  <li key={tool.id} className={cn("flex items-center gap-2 rounded-xl border p-2.5", selected ? "border-primary/25 bg-secondary" : "border-border bg-white")}>
                    <button
                      type="button"
                      disabled={addDisabled}
                      onClick={() => toggleDraft(tool.id)}
                      aria-pressed={selected}
                      aria-label={selected
                        ? t("home.removeTool", { tool: t(tool.labelKey) })
                        : t("home.addTool", { tool: t(tool.labelKey) })}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:opacity-45"
                    >
                      <tool.icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                      <span className="truncate text-sm font-bold text-foreground">{t(tool.labelKey)}</span>
                      <span className={cn("ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full", selected ? "bg-white text-danger" : "bg-secondary text-primary")} aria-hidden="true">
                        {selected ? <X className="h-3.5 w-3.5" strokeWidth={2.2} /> : <Plus className="h-3.5 w-3.5" strokeWidth={2.2} />}
                      </span>
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

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {selectedTools.map((tool) => (
          <Link
            key={tool.id}
            to={tool.to}
            className="group relative flex min-h-40 flex-col justify-between overflow-hidden rounded-[1.35rem] border border-[#DDE6ED] bg-white p-5 shadow-[0_12px_32px_-26px_rgba(13,43,69,0.6)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-premium md:min-h-36"
          >
            <div className="relative flex items-start justify-between gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF5FA] text-primary ring-1 ring-primary/10 transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                <tool.icon className="h-[22px] w-[22px]" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border/80 text-muted-foreground transition-all duration-300 group-hover:border-primary/20 group-hover:bg-secondary group-hover:text-primary">
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </div>
            <div className="relative mt-7 flex items-end justify-between gap-2">
              <span className="font-display text-[15px] font-extrabold leading-snug tracking-tight text-foreground sm:text-base">
                {t(tool.labelKey)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
