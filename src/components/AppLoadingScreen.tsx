import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/i18n/I18nContext";
import { cn } from "@/lib/utils";

export function AppLoadingScreen({ onComplete }: { onComplete: () => void }) {
  const { t } = useI18n();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let active = true;
    let exitTimer = 0;
    let displayTimer = 0;
    const minimumDisplay = new Promise<void>((resolve) => {
      displayTimer = window.setTimeout(resolve, 1200);
    });
    const fontsReady = document.fonts?.ready ?? Promise.resolve();

    Promise.all([minimumDisplay, fontsReady]).then(() => {
      if (!active) return;
      setLeaving(true);
      exitTimer = window.setTimeout(onComplete, 350);
    });

    return () => {
      active = false;
      window.clearTimeout(displayTimer);
      window.clearTimeout(exitTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex min-h-screen flex-col bg-[#151321] px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] text-white transition-all duration-300",
        leaving && "pointer-events-none opacity-0",
      )}
      role="status"
      aria-live="polite"
      aria-label={t("app.loading")}
    >
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
        <span>{t("app.name")}</span>
        <span>MU</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <Logo className="h-20 w-20 shadow-2xl" />
        <p className="mt-8 font-display text-[2.75rem] font-extrabold leading-none tracking-[-0.055em] text-white">
          {t("app.name")}
        </p>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">{t("app.tagline")}</p>
      </div>

      <div className="mx-auto w-full max-w-xs">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-xs font-medium text-white/60">{t("app.loading")}</p>
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 motion-safe:animate-pulse" aria-hidden="true" />
        </div>
        <div className="h-0.5 w-full overflow-hidden bg-white/10" aria-hidden="true">
          <div className="h-full w-1/3 bg-violet-400 motion-safe:animate-app-loading" />
        </div>
        <p className="mt-5 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">
          {t("app.badge")}
        </p>
      </div>
    </div>
  );
}
