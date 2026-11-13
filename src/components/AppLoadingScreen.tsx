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
      displayTimer = window.setTimeout(resolve, 2000);
    });
    const fontsReady = document.fonts?.ready ?? Promise.resolve();

    Promise.all([minimumDisplay, fontsReady]).then(() => {
      if (!active) return;
      setLeaving(true);
      exitTimer = window.setTimeout(onComplete, 320);
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
        "fixed inset-0 z-[100] isolate flex min-h-screen flex-col overflow-hidden bg-[#071B33] px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] text-white transition-opacity duration-300",
        leaving && "pointer-events-none opacity-0",
      )}
      role="status"
      aria-live="polite"
      aria-label={t("app.loading")}
    >
      <svg
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
        viewBox="0 0 400 800"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <pattern id="launch-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" stroke="white" strokeOpacity="0.035" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="400" height="800" fill="url(#launch-grid)" />
        <path
          d="M-30 168C58 151 102 229 164 283C221 333 254 332 286 393"
          pathLength="1"
          className="animate-route-draw stroke-sky-400/25"
          strokeWidth="1.3"
        />
        <path
          d="M432 114C335 148 354 242 286 294C235 332 220 362 200 400"
          pathLength="1"
          className="animate-route-draw stroke-emerald-400/20 [animation-delay:180ms]"
          strokeWidth="1.2"
        />
        <path
          d="M-25 648C74 607 75 536 143 489C184 461 191 429 200 400"
          pathLength="1"
          className="animate-route-draw stroke-amber-300/20 [animation-delay:340ms]"
          strokeWidth="1.2"
        />
        <path
          d="M425 677C335 629 328 541 270 491C230 456 216 429 200 400"
          pathLength="1"
          className="animate-route-draw stroke-sky-300/20 [animation-delay:460ms]"
          strokeWidth="1.2"
        />
        {[
          [164, 283],
          [286, 294],
          [143, 489],
          [270, 491],
        ].map(([cx, cy]) => (
          <g key={`${cx}-${cy}`} className="animate-fade-in [animation-delay:900ms]">
            <circle cx={cx} cy={cy} r="5" fill="#071B33" stroke="#7DD3FC" strokeOpacity="0.4" />
            <circle cx={cx} cy={cy} r="1.5" fill="#7DD3FC" fillOpacity="0.8" />
          </g>
        ))}
      </svg>

      <div className="relative z-10 flex animate-fade-in items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
        <span>{t("app.name")}</span>
        <span>MU</span>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_30px_90px_-28px_rgba(56,189,248,0.45)] motion-safe:animate-logo-shutter">
          <Logo variant="full" className="h-24 w-56 sm:w-72" />
          <div className="absolute inset-x-6 bottom-3 flex h-[3px] overflow-hidden rounded-full" aria-hidden="true">
            {[
              ["bg-red-500", "0ms"],
              ["bg-blue-700", "120ms"],
              ["bg-yellow-400", "240ms"],
              ["bg-emerald-600", "360ms"],
            ].map(([color, delay]) => (
              <span
                key={color}
                className={`h-full flex-1 origin-left motion-safe:animate-flag-reveal ${color}`}
                style={{ animationDelay: delay }}
              />
            ))}
          </div>
        </div>
        <p className="mt-6 max-w-xs animate-fade-in-up text-sm leading-relaxed text-white/60 [animation-delay:720ms]">
          {t("app.tagline")}
        </p>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-xs animate-fade-in [animation-delay:700ms]">
        <div className="mb-1 flex items-center justify-between gap-4">
          <p className="text-xs font-medium text-white/60">{t("app.loading")}</p>
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-sky-300/70">MauSafe</span>
        </div>
        <svg viewBox="0 0 260 26" className="h-7 w-full" fill="none" aria-hidden="true">
          <path
            id="loading-route"
            d="M2 17C37 2 66 29 103 14C141-2 172 27 205 14C225 6 242 8 258 14"
            stroke="white"
            strokeOpacity="0.12"
            strokeWidth="2"
          />
          <path
            d="M2 17C37 2 66 29 103 14C141-2 172 27 205 14C225 6 242 8 258 14"
            pathLength="100"
            className="animate-route-signal stroke-sky-400"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle r="3" fill="#A7F3D0" className="motion-reduce:hidden">
            <animateMotion dur="2.1s" repeatCount="indefinite">
              <mpath href="#loading-route" />
            </animateMotion>
          </circle>
        </svg>
        <p className="mt-2 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">
          {t("app.badge")}
        </p>
      </div>
    </div>
  );
}
