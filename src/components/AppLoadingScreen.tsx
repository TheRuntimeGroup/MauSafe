import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/i18n/I18nContext";
import { cn } from "@/lib/utils";

export function AppLoadingScreen({ onComplete }: { onComplete: () => void }) {
  const { t } = useI18n();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let active = true;
    let exitTimer = 0;
    const minimumDisplay = new Promise<void>((resolve) => {
      window.setTimeout(resolve, 1000);
    });
    const fontsReady = document.fonts?.ready ?? Promise.resolve();

    Promise.all([minimumDisplay, fontsReady]).then(() => {
      if (!active) return;
      setLeaving(true);
      exitTimer = window.setTimeout(onComplete, 300);
    });

    return () => {
      active = false;
      window.clearTimeout(exitTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex min-h-screen flex-col items-center justify-between bg-primary px-6 py-[max(2rem,env(safe-area-inset-top))] text-white transition-opacity duration-300",
        leaving && "pointer-events-none opacity-0",
      )}
      role="status"
      aria-live="polite"
      aria-label={t("app.loading")}
    >
      <div />

      <div className="flex flex-col items-center text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-white shadow-2xl">
          <Logo className="h-16 w-16" />
        </div>
        <p className="mt-7 font-display text-4xl font-extrabold tracking-[-0.04em]">
          {t("app.name")}
        </p>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/75">{t("app.tagline")}</p>

        <div className="mt-9 h-1 w-32 overflow-hidden rounded-full bg-white/20" aria-hidden="true">
          <div className="h-full w-1/3 rounded-full bg-white motion-safe:animate-app-loading" />
        </div>
        <p className="mt-4 text-xs font-medium text-white/70">{t("app.loading")}</p>
      </div>

      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        {t("app.badge")}
      </div>
    </div>
  );
}
