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
      displayTimer = window.setTimeout(resolve, reducedMotion ? 700 : 2400);
    });
    const fontsReady = document.fonts?.ready ?? Promise.resolve();

    Promise.all([minimumDisplay, fontsReady]).then(() => {
      if (!active) return;
      setLeaving(true);
      exitTimer = window.setTimeout(onComplete, reducedMotion ? 120 : 560);
    });

    return () => {
      active = false;
      window.clearTimeout(displayTimer);
      window.clearTimeout(exitTimer);
    };
  }, [onComplete]);

  return (
    <div
      className="launch-screen fixed inset-0 z-[100] isolate flex min-h-screen flex-col overflow-hidden bg-[#F7F5EF] px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-[max(1.75rem,env(safe-area-inset-top))] text-[#0D2B45]"
      data-leaving={leaving}
      role="status"
      aria-live="polite"
      aria-label={t("app.loading")}
      aria-busy="true"
    >
      <div className="launch-ambient launch-ambient-one" aria-hidden="true" />
      <div className="launch-ambient launch-ambient-two" aria-hidden="true" />

      <header className="launch-chrome relative z-10 flex items-center justify-center gap-2.5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#0D2B45]/65">
        <span className="h-1.5 w-1.5 rounded-full bg-[#0E7A4D]" aria-hidden="true" />
        <span>{t("app.badge")}</span>
      </header>

      <main className="launch-scene relative z-10 flex flex-1 flex-col items-center justify-center py-10 text-center">
        <div className="relative flex h-72 w-72 items-center justify-center sm:h-80 sm:w-80">
          <div className="launch-ring-reveal absolute inset-0" aria-hidden="true">
            <svg className="launch-orbit-svg h-full w-full" viewBox="0 0 320 320" fill="none">
              <circle cx="160" cy="160" r="140" stroke="#0D2B45" strokeOpacity="0.07" />
              <circle
                cx="160"
                cy="160"
                r="112"
                stroke="#0D2B45"
                strokeOpacity="0.08"
                strokeDasharray="2 9"
                strokeLinecap="round"
              />
              <path
                d="M160 20A140 140 0 0 1 298 145"
                stroke="#0D2B45"
                strokeOpacity="0.28"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle cx="160" cy="20" r="4" fill="#0E7A4D" stroke="#F7F5EF" strokeWidth="3" />
            </svg>
          </div>

          <div className="launch-emblem relative rounded-[1.75rem] border border-[#0D2B45]/[0.07] bg-white px-6 py-7 shadow-[0_28px_80px_-38px_rgba(13,43,69,0.38)] sm:px-8 sm:py-8">
            <Logo variant="full" className="h-14 w-44 sm:h-16 sm:w-52" />
          </div>
        </div>

        <div className="mt-5 overflow-hidden px-4">
          <p className="launch-copy max-w-sm text-sm font-medium leading-relaxed text-[#0D2B45]/65 sm:text-[15px]">
            {t("app.tagline")}
          </p>
        </div>
      </main>

      <footer className="launch-chrome relative z-10 mx-auto flex w-full max-w-60 flex-col items-center">
        <p className="text-xs font-semibold text-[#0D2B45]/65">{t("app.loading")}</p>
        <div className="mt-4 h-[3px] w-full overflow-hidden rounded-full bg-[#0D2B45]/[0.08]" aria-hidden="true">
          <span className="launch-progress-fill block h-full w-[42%] rounded-full bg-[#0D2B45]" />
        </div>
      </footer>
    </div>
  );
}
