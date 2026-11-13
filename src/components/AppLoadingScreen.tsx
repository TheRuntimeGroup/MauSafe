import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/i18n/I18nContext";
import "./AppLoadingScreen.css";

export function AppLoadingScreen({ onComplete }: { onComplete: () => void }) {
  const { t } = useI18n();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let active = true;
    let exitTimer = 0;
    let displayTimer = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const minimumDisplay = new Promise<void>((resolve) => {
      displayTimer = window.setTimeout(resolve, reducedMotion ? 700 : 2500);
    });
    const fontsReady = document.fonts?.ready ?? Promise.resolve();

    Promise.all([minimumDisplay, fontsReady]).then(() => {
      if (!active) return;
      setLeaving(true);
      exitTimer = window.setTimeout(onComplete, reducedMotion ? 120 : 620);
    });

    return () => {
      active = false;
      window.clearTimeout(displayTimer);
      window.clearTimeout(exitTimer);
    };
  }, [onComplete]);

  return (
    <div
      className="launch-screen fixed inset-0 z-[100] isolate flex min-h-screen flex-col overflow-hidden bg-[#071A2E] px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] text-white"
      data-leaving={leaving}
      role="status"
      aria-live="polite"
      aria-label={t("app.loading")}
      aria-busy="true"
    >
      <div className="launch-aurora launch-aurora-one" aria-hidden="true" />
      <div className="launch-aurora launch-aurora-two" aria-hidden="true" />
      <div className="launch-aurora launch-aurora-three" aria-hidden="true" />
      <div className="launch-vignette" aria-hidden="true" />

      <main className="launch-scene relative z-10 flex flex-1 flex-col items-center justify-center py-10 text-center">
        <div className="launch-emblem relative">
          <div className="launch-logo-surface rounded-[1.35rem] bg-[#FCFBF8] px-8 py-8 sm:px-10">
            <Logo variant="full" className="h-16 w-52 sm:h-[4.5rem] sm:w-60" />
          </div>
        </div>

        <div className="mt-8 overflow-hidden px-5 pb-2">
          <p className="launch-copy max-w-sm text-[15px] font-medium leading-relaxed tracking-[0.005em] text-slate-300">
            {t("app.tagline")}
          </p>
        </div>
        <span className="launch-copy-rule mt-5 block h-px w-8 bg-emerald-300/70" aria-hidden="true" />
      </main>

      <footer className="launch-chrome relative z-10 mx-auto flex items-center justify-center gap-2.5">
        <p className="text-xs font-medium tracking-[0.01em] text-slate-300">{t("app.loading")}</p>
        <span className="launch-loading-dots flex items-center gap-1" aria-hidden="true">
          <span className="h-1 w-1 rounded-full bg-sky-300" />
          <span className="h-1 w-1 rounded-full bg-sky-300 [animation-delay:160ms]" />
          <span className="h-1 w-1 rounded-full bg-emerald-300 [animation-delay:320ms]" />
        </span>
      </footer>
    </div>
  );
}
