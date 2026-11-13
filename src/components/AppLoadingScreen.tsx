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
        "fixed inset-0 z-[100] isolate flex min-h-screen flex-col overflow-hidden bg-[#071B33] px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] text-white transition-all duration-300",
        leaving && "pointer-events-none opacity-0 motion-safe:-translate-y-2",
      )}
      role="status"
      aria-live="polite"
      aria-label={t("app.loading")}
    >
      <div className="pointer-events-none absolute -right-32 -top-28 -z-10 h-96 w-96 rounded-full bg-sky-500/15 blur-[90px] motion-safe:animate-ambient-drift" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-36 -left-28 -z-10 h-[26rem] w-[26rem] rounded-full bg-emerald-500/10 blur-[100px] motion-safe:animate-ambient-drift [animation-direction:alternate-reverse]" aria-hidden="true" />

      <div className="flex animate-fade-in items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
        <span>{t("app.name")}</span>
        <span>MU</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative motion-safe:animate-logo-enter">
          <div
            className="pointer-events-none absolute -inset-3 rounded-[2.6rem] border border-sky-300/25 motion-safe:animate-logo-halo"
            aria-hidden="true"
          />
          <div className="relative rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_28px_80px_-24px_rgba(56,189,248,0.35)]">
            <Logo variant="full" className="h-24 w-56 sm:w-72" />
          </div>
        </div>
        <p className="mt-6 max-w-xs animate-fade-in-up text-sm leading-relaxed text-white/60 [animation-delay:180ms]">
          {t("app.tagline")}
        </p>
      </div>

      <div className="mx-auto w-full max-w-xs animate-fade-in-up [animation-delay:260ms]">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-xs font-medium text-white/60">{t("app.loading")}</p>
          <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
            <span className="absolute inset-0 rounded-full bg-sky-400/40 motion-safe:animate-ping" />
            <span className="absolute inset-[3px] rounded-full bg-sky-400" />
          </span>
        </div>
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/10" aria-hidden="true">
          <div className="h-full w-1/4 rounded-full bg-sky-400 shadow-[0_0_16px_rgba(56,189,248,0.65)] motion-safe:animate-app-loading" />
        </div>
        <p className="mt-5 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">
          {t("app.badge")}
        </p>
      </div>
    </div>
  );
}
