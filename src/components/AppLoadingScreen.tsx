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
      className="launch-screen fixed inset-0 z-[100] isolate flex min-h-screen flex-col overflow-hidden bg-[#071A2E] px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-[max(1.75rem,env(safe-area-inset-top))] text-white"
      data-leaving={leaving}
      role="status"
      aria-live="polite"
      aria-label={t("app.loading")}
      aria-busy="true"
    >
      <div className="launch-aurora launch-aurora-one" aria-hidden="true" />
      <div className="launch-aurora launch-aurora-two" aria-hidden="true" />
      <div className="launch-architecture" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <main className="launch-scene relative z-10 flex flex-1 flex-col items-center justify-center py-8 text-center">
        <div className="launch-stage relative flex w-[min(24rem,calc(100vw-2rem))] items-center justify-center px-7 py-14">
          <svg className="launch-frame absolute inset-0 h-full w-full" viewBox="0 0 400 260" fill="none" aria-hidden="true">
            <path
              pathLength="1"
              className="launch-frame-line"
              d="M18 66V30C18 23.373 23.373 18 30 18H66M334 18H370C376.627 18 382 23.373 382 30V66M382 194V230C382 236.627 376.627 242 370 242H334M66 242H30C23.373 242 18 236.627 18 230V194"
              stroke="#A7D8F5"
              strokeOpacity="0.48"
              strokeWidth="1.25"
              strokeLinecap="round"
            />
            <path
              pathLength="1"
              className="launch-frame-line launch-frame-line-delayed"
              d="M196 18H204M196 242H204"
              stroke="#A7F3D0"
              strokeOpacity="0.8"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle className="launch-frame-spark" cx="382" cy="75" r="3" fill="#A7F3D0" />
          </svg>

          <div className="launch-emblem relative">
            <div className="launch-logo-surface relative overflow-hidden rounded-[1.5rem] border border-white/90 bg-white px-7 py-7 shadow-[0_30px_90px_-30px_rgba(0,0,0,0.55)] sm:px-9">
              <Logo variant="full" className="h-14 w-44 sm:h-16 sm:w-52" />
              <span className="launch-shine" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden px-5 pb-2">
          <p className="launch-copy max-w-sm text-sm font-medium leading-relaxed text-slate-300 sm:text-[15px]">
            {t("app.tagline")}
          </p>
        </div>
        <span className="launch-copy-rule mt-4 block h-px w-9 bg-emerald-300/70" aria-hidden="true" />
      </main>

      <footer className="launch-chrome relative z-10 mx-auto w-full max-w-72">
        <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3.5 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.6)] backdrop-blur-md">
          <div className="flex items-center justify-center gap-3">
            <span className="launch-equalizer flex h-4 items-center gap-[3px]" aria-hidden="true">
              <span className="h-[5px] w-[2px] rounded-full bg-sky-300" />
              <span className="h-[9px] w-[2px] rounded-full bg-sky-300 [animation-delay:120ms]" />
              <span className="h-[13px] w-[2px] rounded-full bg-emerald-300 [animation-delay:240ms]" />
              <span className="h-[7px] w-[2px] rounded-full bg-sky-300 [animation-delay:360ms]" />
            </span>
            <p className="text-xs font-semibold tracking-[0.01em] text-slate-200">{t("app.loading")}</p>
          </div>
          <div className="launch-progress mt-3.5 h-[3px] w-full overflow-hidden rounded-full bg-white/10" aria-hidden="true">
            <span className="launch-progress-fill relative block h-full w-1/3 rounded-full bg-sky-300 shadow-[0_0_12px_rgba(125,211,252,0.55)]" />
          </div>
        </div>
      </footer>
    </div>
  );
}
