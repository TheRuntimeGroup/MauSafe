import { useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2, ShieldAlert, Siren, Square, Vibrate, Volume2 } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { AppButton } from "@/components/ui/app-button";
import { cn } from "@/lib/utils";

type AlarmAudio = {
  context: AudioContext;
  oscillator: OscillatorNode;
  lfo: OscillatorNode;
};

const SafetyAlarm = () => {
  const { t } = useI18n();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [strobeEnabled, setStrobeEnabled] = useState(false);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(false);
  const audioRef = useRef<AlarmAudio | null>(null);
  const vibrationTimer = useRef<number | null>(null);
  const stopButtonRef = useRef<HTMLButtonElement>(null);

  function disposeAlarm() {
    if (vibrationTimer.current !== null) {
      window.clearInterval(vibrationTimer.current);
      vibrationTimer.current = null;
    }
    if ("vibrate" in navigator) navigator.vibrate(0);
    const audio = audioRef.current;
    if (audio) {
      try {
        audio.oscillator.stop();
        audio.lfo.stop();
      } catch {
        // Oscillators may already be stopped.
      }
      void audio.context.close();
      audioRef.current = null;
    }
  }

  useEffect(() => {
    if (active) stopButtonRef.current?.focus();
  }, [active]);

  useEffect(() => disposeAlarm, []);

  async function startAlarm() {
    setStarting(true);
    setError(false);
    disposeAlarm();
    try {
      if (soundEnabled) {
        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const lfo = context.createOscillator();
        const lfoGain = context.createGain();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = 760;
        lfo.type = "sine";
        lfo.frequency.value = 1.1;
        lfoGain.gain.value = 230;
        gain.gain.setValueAtTime(0, context.currentTime);
        gain.gain.linearRampToValueAtTime(0.14, context.currentTime + 0.08);
        lfo.connect(lfoGain);
        lfoGain.connect(oscillator.frequency);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        lfo.start();
        await context.resume();
        audioRef.current = { context, oscillator, lfo };
      }

      if (vibrationEnabled && "vibrate" in navigator) {
        navigator.vibrate([300, 120, 300]);
        vibrationTimer.current = window.setInterval(() => navigator.vibrate([300, 120, 300]), 1600);
      }
      setActive(true);
    } catch {
      setError(true);
    } finally {
      setStarting(false);
    }
  }

  function stopAlarm() {
    disposeAlarm();
    setActive(false);
  }

  function quickExit() {
    window.location.replace("https://metservice.intnet.mu/");
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-foreground">{t("alarm.title")}</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("alarm.subtitle")}</p>
      </header>

      <section className="glass-panel rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Siren className="mt-0.5 h-6 w-6 text-danger" aria-hidden="true" />
          <div>
            <h2 className="font-display text-base font-bold text-foreground">{t("alarm.soundTitle")}</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("alarm.soundBody")}</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-white/60 p-3 text-sm font-semibold">
            <input type="checkbox" checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} className="h-5 w-5 accent-[hsl(var(--primary))]" />
            <Volume2 className="h-4 w-4 text-primary" aria-hidden="true" />
            {t("alarm.soundLabel")}
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-white/60 p-3 text-sm font-semibold">
            <input type="checkbox" checked={vibrationEnabled} onChange={(e) => setVibrationEnabled(e.target.checked)} className="h-5 w-5 accent-[hsl(var(--primary))]" />
            <Vibrate className="h-4 w-4 text-primary" aria-hidden="true" />
            {t("alarm.vibrateLabel")}
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-white/60 p-3 text-sm font-semibold">
            <input type="checkbox" checked={strobeEnabled} onChange={(e) => setStrobeEnabled(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[hsl(var(--primary))]" />
            <span>
              {t("alarm.strobeLabel")}
              <span className="mt-1 block text-xs font-normal leading-relaxed text-muted-foreground">{t("alarm.strobeWarning")}</span>
            </span>
          </label>
        </div>

        <AppButton
          variant="danger"
          size="xl"
          className="mt-5"
          onClick={() => void startAlarm()}
          disabled={starting || (!soundEnabled && !vibrationEnabled && !strobeEnabled)}
        >
          {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Siren className="h-5 w-5" />}
          {t("alarm.start")}
        </AppButton>
        {error && <p className="mt-3 text-sm text-danger" role="alert">{t("alarm.error")}</p>}
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t("alarm.privacy")}</p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <ExternalLink className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 className="font-display text-base font-bold text-foreground">{t("alarm.quickExitTitle")}</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("alarm.quickExitBody")}</p>
          </div>
        </div>
        <AppButton variant="outline" size="lg" className="mt-4 w-full" onClick={quickExit}>
          {t("alarm.quickExit")}
        </AppButton>
      </section>

      {active && (
        <div
          className={cn(
            "fixed inset-0 z-[100] flex min-h-screen flex-col items-center justify-center bg-danger p-6 text-center text-white",
            strobeEnabled && "motion-safe:animate-alarm-flash",
          )}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="alarm-active-title"
        >
          <ShieldAlert className="h-20 w-20" aria-hidden="true" />
          <h2 id="alarm-active-title" className="mt-6 font-display text-4xl font-extrabold">{t("alarm.activeTitle")}</h2>
          <p className="mt-3 max-w-sm text-white/80">{t("alarm.activeBody")}</p>
          <button
            ref={stopButtonRef}
            type="button"
            onClick={stopAlarm}
            className="mt-10 flex min-h-16 w-full max-w-sm items-center justify-center gap-3 rounded-2xl bg-white px-8 text-lg font-extrabold text-danger shadow-2xl focus-visible:ring-white"
          >
            <Square className="h-5 w-5 fill-current" aria-hidden="true" />
            {t("alarm.stop")}
          </button>
        </div>
      )}
    </div>
  );
};

export default SafetyAlarm;
