import { useEffect, useState } from "react";
import { Accessibility, Check, Ear, Eye, Square, Volume2 } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

const MONOCHROME_KEY = "mausafe.accessibility.monochrome";

function initialMonochrome(): boolean {
  try {
    return localStorage.getItem(MONOCHROME_KEY) === "true";
  } catch {
    return false;
  }
}

export function AccessibilityQuickSettings() {
  const { t, locale } = useI18n();
  const [monochrome, setMonochrome] = useState(initialMonochrome);
  const [speaking, setSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("accessibility-monochrome", monochrome);
    try {
      localStorage.setItem(MONOCHROME_KEY, String(monochrome));
    } catch {
      // The display preference still works when storage is unavailable.
    }
  }, [monochrome]);

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  function stopReading() {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  function readPage() {
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      setSpeechError(true);
      return;
    }

    if (speaking) {
      stopReading();
      return;
    }

    const pageText = document.querySelector("main")?.textContent?.replace(/\s+/g, " ").trim();
    if (!pageText) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(pageText);
    utterance.lang = locale;
    utterance.rate = 0.92;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeechError(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-foreground/[0.08] bg-white px-3 text-xs font-extrabold text-foreground shadow-sm transition-colors hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t("accessibility.menu")}
        >
          <Accessibility className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="hidden sm:inline">{t("accessibility.menu")}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[min(24rem,calc(100vw-2rem))] rounded-3xl border-foreground/[0.08] bg-white p-4 shadow-premium"
      >
        <div className="px-1 pb-3">
          <p className="font-display text-lg font-extrabold tracking-tight text-foreground">
            {t("accessibility.title")}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {t("accessibility.subtitle")}
          </p>
        </div>

        <section className="rounded-2xl border border-[#DCE7ED] bg-[#F4F8FB] p-4" aria-labelledby="hearing-options">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0D2B45] text-white">
              <Ear className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="hearing-options" className="text-sm font-extrabold text-foreground">
                {t("accessibility.hearingTitle")}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t("accessibility.hearingBody")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={readPage}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0D2B45] px-4 text-sm font-extrabold text-white transition-colors hover:bg-[#123B5D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {speaking ? (
              <Square className="h-4 w-4 fill-current" aria-hidden="true" />
            ) : (
              <Volume2 className="h-4 w-4" aria-hidden="true" />
            )}
            {speaking ? t("accessibility.stopReading") : t("accessibility.readPage")}
          </button>
          <p className="mt-2 min-h-4 text-center text-[11px] font-semibold text-muted-foreground" aria-live="polite">
            {speechError
              ? t("accessibility.speechUnsupported")
              : speaking
                ? t("accessibility.speaking")
                : ""}
          </p>
        </section>

        <section className="mt-3 rounded-2xl border border-foreground/[0.08] bg-white p-4" aria-labelledby="visual-options">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
              <Eye className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="visual-options" className="text-sm font-extrabold text-foreground">
                {t("accessibility.visualTitle")}
              </h2>
              <label
                htmlFor="monochrome-display"
                className="mt-2 flex cursor-pointer items-center justify-between gap-3 text-sm font-bold text-foreground"
              >
                {t("accessibility.monochrome")}
                <Switch
                  id="monochrome-display"
                  checked={monochrome}
                  onCheckedChange={setMonochrome}
                  className="data-[state=checked]:bg-[#0D2B45] data-[state=unchecked]:bg-slate-300"
                />
              </label>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {t("accessibility.monochromeBody")}
              </p>
              {monochrome && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-extrabold text-primary" role="status">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("accessibility.monochromeActive")}
                </p>
              )}
            </div>
          </div>
        </section>
      </PopoverContent>
    </Popover>
  );
}
