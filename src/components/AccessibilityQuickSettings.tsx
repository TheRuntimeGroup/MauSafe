import { useCallback, useEffect, useRef, useState } from "react";
import { Accessibility, Check, Ear, Eye, Hand, Volume2 } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { getSpeechAudio, preloadSpeech } from "@/lib/speech";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

const MONOCHROME_KEY = "mausafe.accessibility.monochrome";
const HEARING_KEY = "mausafe.accessibility.hearing";
const HOLD_DELAY = 450;
const MOVE_TOLERANCE = 12;
const SPEAKABLE_SECTIONS = [
  "main h1",
  "main h2",
  "main h3",
  "main h4",
  "main p",
  "main li",
  "main dt",
  "main dd",
  "main label",
  "main button",
  "main [role='alert']",
].join(",");

function readStoredBoolean(key: string): boolean {
  try {
    return localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

export function AccessibilityQuickSettings() {
  const { t, lang } = useI18n();
  const [monochrome, setMonochrome] = useState(() => readStoredBoolean(MONOCHROME_KEY));
  const [readAloud, setReadAloud] = useState(() => readStoredBoolean(HEARING_KEY));
  const [speaking, setSpeaking] = useState(false);
  const [loadingSpeech, setLoadingSpeech] = useState(false);
  const [speechError, setSpeechError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const speechRequestRef = useRef(0);

  useEffect(() => {
    document.documentElement.classList.toggle("accessibility-monochrome", monochrome);
    try {
      localStorage.setItem(MONOCHROME_KEY, String(monochrome));
    } catch {
      // The display preference still works when storage is unavailable.
    }
  }, [monochrome]);

  useEffect(() => {
    try {
      localStorage.setItem(HEARING_KEY, String(readAloud));
    } catch {
      // Read-aloud still works when storage is unavailable.
    }
  }, [readAloud]);

  const releaseAudio = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    speechRequestRef.current += 1;
    releaseAudio();
    setLoadingSpeech(false);
    setSpeaking(false);
  }, [releaseAudio]);

  useEffect(() => {
    return () => stopSpeaking();
  }, [stopSpeaking]);

  const speakWithDeviceVoice = useCallback(
    (text: string, requestId: number): boolean => {
      if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
        return false;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      const language = lang === "fr" ? "fr" : "en";
      const voices = window.speechSynthesis.getVoices();
      const matchingVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith(language));
      const voice = matchingVoices.find((item) => /natural|enhanced|premium|siri|google/i.test(item.name))
        ?? matchingVoices[0];
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang ?? (lang === "fr" ? "fr-FR" : "en-GB");
      utterance.rate = 0.9;
      utterance.onend = () => {
        if (requestId === speechRequestRef.current) setSpeaking(false);
      };
      utterance.onerror = () => {
        if (requestId !== speechRequestRef.current) return;
        setSpeaking(false);
        setSpeechError(true);
      };

      try {
        setLoadingSpeech(false);
        setSpeaking(true);
        window.speechSynthesis.speak(utterance);
        return true;
      } catch {
        return false;
      }
    },
    [lang],
  );

  const speakSection = useCallback(
    async (text: string) => {
      stopSpeaking();
      const requestId = ++speechRequestRef.current;
      setSpeechError(false);
      setLoadingSpeech(true);

      try {
        const audioBlob = await getSpeechAudio(text, lang);
        if (requestId !== speechRequestRef.current) return;

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioUrlRef.current = audioUrl;
        audioRef.current = audio;
        audio.onended = () => {
          if (requestId !== speechRequestRef.current) return;
          releaseAudio();
          setSpeaking(false);
        };
        audio.onerror = () => {
          if (requestId !== speechRequestRef.current) return;
          releaseAudio();
          setSpeaking(false);
          setSpeechError(true);
        };

        setLoadingSpeech(false);
        setSpeaking(true);
        await audio.play();
      } catch {
        if (requestId !== speechRequestRef.current) return;
        releaseAudio();
        if (speakWithDeviceVoice(text, requestId)) return;
        setLoadingSpeech(false);
        setSpeaking(false);
        setSpeechError(true);
      }
    },
    [lang, releaseAudio, speakWithDeviceVoice, stopSpeaking],
  );

  useEffect(() => {
    if (!readAloud) return;
    const root = document.querySelector("main");
    if (!root) return;

    let preloadTimer: number | undefined;
    const collectSections = () => {
      const texts = Array.from(root.querySelectorAll<HTMLElement>(SPEAKABLE_SECTIONS))
        .filter((element) => {
          const visible = element.offsetWidth > 0 || element.offsetHeight > 0;
          return visible && !element.closest("[aria-hidden='true'], [role='timer'], [role='alert']");
        })
        .map((element) => element.textContent?.replace(/\s+/g, " ").trim() ?? "")
        .filter(Boolean);
      void preloadSpeech(texts, lang);
    };
    const schedulePreload = () => {
      if (preloadTimer !== undefined) window.clearTimeout(preloadTimer);
      preloadTimer = window.setTimeout(collectSections, 400);
    };

    schedulePreload();
    const observer = new MutationObserver(schedulePreload);
    observer.observe(root, { childList: true, subtree: true });

    return () => {
      if (preloadTimer !== undefined) window.clearTimeout(preloadTimer);
      observer.disconnect();
    };
  }, [lang, readAloud]);

  useEffect(() => {
    if (!readAloud) return;

    let holdTimer: number | undefined;
    let clickResetTimer: number | undefined;
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let readingTarget: HTMLElement | null = null;
    let didHold = false;

    const clearHoldTimer = () => {
      if (holdTimer !== undefined) window.clearTimeout(holdTimer);
      holdTimer = undefined;
    };

    const clearClickResetTimer = () => {
      if (clickResetTimer !== undefined) window.clearTimeout(clickResetTimer);
      clickResetTimer = undefined;
    };

    const finishInteraction = () => {
      clearHoldTimer();
      pointerId = null;

      if (readingTarget) {
        readingTarget.classList.remove("accessibility-speaking-section");
        readingTarget = null;
        stopSpeaking();
      }

      clearClickResetTimer();
      clickResetTimer = window.setTimeout(() => {
        didHold = false;
      }, 0);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || pointerId !== null || !(event.target instanceof Element)) return;

      const target = event.target.closest<HTMLElement>(SPEAKABLE_SECTIONS);
      if (!target || target.closest("[aria-hidden='true']")) return;

      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      didHold = false;

      holdTimer = window.setTimeout(() => {
        const text = target.textContent?.replace(/\s+/g, " ").trim();
        if (!text) return;

        didHold = true;
        readingTarget = target;
        readingTarget.classList.add("accessibility-speaking-section");
        void speakSection(text);
      }, HOLD_DELAY);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      const distance = Math.hypot(event.clientX - startX, event.clientY - startY);
      if (distance > MOVE_TOLERANCE) finishInteraction();
    };

    const onPointerEnd = (event: PointerEvent) => {
      if (event.pointerId === pointerId) finishInteraction();
    };

    const onClick = (event: MouseEvent) => {
      if (!didHold) return;
      event.preventDefault();
      event.stopPropagation();
      didHold = false;
      clearClickResetTimer();
    };

    const onContextMenu = (event: MouseEvent) => {
      if (didHold || readingTarget) event.preventDefault();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") finishInteraction();
    };

    const onScroll = () => {
      if (pointerId !== null) finishInteraction();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerEnd);
    document.addEventListener("pointercancel", onPointerEnd);
    document.addEventListener("click", onClick, true);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("scroll", onScroll, true);

    return () => {
      clearHoldTimer();
      clearClickResetTimer();
      if (readingTarget) readingTarget.classList.remove("accessibility-speaking-section");
      stopSpeaking();
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerEnd);
      document.removeEventListener("pointercancel", onPointerEnd);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [readAloud, speakSection, stopSpeaking]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`inline-flex h-10 items-center gap-2 rounded-full border px-3 text-xs font-extrabold shadow-sm transition-colors hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            readAloud || monochrome
              ? "border-primary/40 bg-secondary text-primary"
              : "border-foreground/[0.08] bg-white text-foreground"
          }`}
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

          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-foreground/[0.08] bg-white p-3">
            <label htmlFor="hearing-read-aloud" className="cursor-pointer text-sm font-extrabold text-foreground">
              {t("accessibility.hearingMode")}
            </label>
            <Switch
              id="hearing-read-aloud"
              checked={readAloud}
              onCheckedChange={(checked) => {
                if (!checked) stopSpeaking();
                setReadAloud(checked);
              }}
              className="data-[state=checked]:bg-[#0D2B45] data-[state=unchecked]:bg-slate-300"
            />
          </div>

          {readAloud && (
            <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-primary/15 bg-white px-3 py-2.5 text-xs font-semibold leading-relaxed text-foreground">
              <Hand className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{t("accessibility.holdInstruction")}</span>
            </div>
          )}

          <p className="mt-3 flex items-start gap-2 text-[11px] font-semibold leading-relaxed text-muted-foreground">
            <Volume2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t("accessibility.naturalVoice")}
          </p>
          <p className="mt-2 min-h-4 text-center text-[11px] font-semibold text-muted-foreground" aria-live="polite">
            {speechError
              ? t("accessibility.speechUnsupported")
              : loadingSpeech
                ? t("accessibility.preparingVoice")
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
