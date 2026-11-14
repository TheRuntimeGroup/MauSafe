import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Bomb,
  Check,
  ChevronRight,
  Heart,
  Leaf,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Timer,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import {
  createFruitGame,
  drawAttractMode,
  drawFruitGame,
  MODE_DURATION,
  sliceFruitGame,
  stepFruitGame,
  type ArcadeCopy,
  type FruitGame,
  type GameMode,
} from "./fruitArcadeEngine";
import { cn } from "@/lib/utils";
import "./FruitSliceArcade.css";

type Phase = "idle" | "playing" | "paused" | "over";
type BestScores = Record<GameMode, number>;
type Hud = { score: number; lives: number; timeLeft: number; combo: number; countdown: number };
type ModeCard = { id: GameMode; icon: LucideIcon; title: string; description: string; meta: string };

const BEST_STORAGE_KEY = "mausafe.fruitArcade.best.v1";
const EMPTY_BEST: BestScores = { classic: 0, zen: 0, patrol: 0 };

function readBestScores(): BestScores {
  try {
    const saved = JSON.parse(localStorage.getItem(BEST_STORAGE_KEY) ?? "{}") as Partial<Record<GameMode, unknown>>;
    return {
      classic: typeof saved.classic === "number" && Number.isFinite(saved.classic) ? Math.max(0, Math.floor(saved.classic)) : 0,
      zen: typeof saved.zen === "number" && Number.isFinite(saved.zen) ? Math.max(0, Math.floor(saved.zen)) : 0,
      patrol: typeof saved.patrol === "number" && Number.isFinite(saved.patrol) ? Math.max(0, Math.floor(saved.patrol)) : 0,
    };
  } catch {
    return { ...EMPTY_BEST };
  }
}

function FruitPreviewArt() {
  return (
    <svg viewBox="0 0 260 230" className="h-auto w-full overflow-visible" aria-hidden="true">
      <circle cx="130" cy="115" r="92" fill="#10383D" />
      <circle cx="130" cy="115" r="75" fill="none" stroke="#2D5A56" strokeWidth="1" />
      <g transform="rotate(-18 84 106)">
        <circle cx="84" cy="106" r="51" fill="#166534" />
        <circle cx="84" cy="106" r="44" fill="#BBF7D0" />
        <circle cx="84" cy="106" r="39" fill="#F43F5E" />
        {[[-15, -13], [12, -17], [-6, 12], [19, 13], [5, 28]].map(([x, y], index) => (
          <ellipse key={index} cx={84 + x} cy={106 + y} rx="2.7" ry="5" fill="#3F2D20" transform={`rotate(${index * 42} ${84 + x} ${106 + y})`} />
        ))}
        <ellipse cx="65" cy="82" rx="12" ry="5" fill="rgba(255,255,255,0.3)" transform="rotate(-35 65 82)" />
      </g>
      <g transform="rotate(16 174 100)">
        <path d="M177 53Q179 35 193 37Q191 49 177 53" fill="#65A30D" />
        <circle cx="174" cy="100" r="43" fill="#EA580C" />
        <circle cx="174" cy="100" r="36" fill="#FED7AA" />
        <circle cx="174" cy="100" r="33" fill="#FB923C" />
        {Array.from({ length: 8 }).map((_, index) => (
          <line key={index} x1="174" y1="100" x2={174 + Math.cos(index * Math.PI / 4) * 33} y2={100 + Math.sin(index * Math.PI / 4) * 33} stroke="#FFEDD5" strokeWidth="2" />
        ))}
        <circle cx="174" cy="100" r="4" fill="#FFEDD5" />
      </g>
      <g transform="rotate(-12 139 173)">
        <circle cx="139" cy="173" r="31" fill="#854D0E" />
        <circle cx="139" cy="173" r="26" fill="#84CC16" />
        <circle cx="139" cy="173" r="8" fill="#F7FEE7" />
        {Array.from({ length: 10 }).map((_, index) => (
          <ellipse key={index} cx={139 + Math.cos(index * Math.PI / 5) * 16} cy={173 + Math.sin(index * Math.PI / 5) * 16} rx="1.6" ry="2.8" fill="#27331A" transform={`rotate(${index * 36} ${139 + Math.cos(index * Math.PI / 5) * 16} ${173 + Math.sin(index * Math.PI / 5) * 16})`} />
        ))}
      </g>
      <path d="M44 150L133 42" stroke="rgba(255,255,255,0.15)" strokeWidth="14" strokeLinecap="round" />
      <path d="M44 150L133 42" stroke="#ECFEFF" strokeWidth="3" strokeLinecap="round" />
      <path d="M207 163L211 173L222 175L213 182L216 193L207 187L198 193L200 182L192 175L203 173Z" fill="#FDE047" />
      <circle cx="55" cy="48" r="4" fill="#5EEAD4" />
      <circle cx="215" cy="58" r="3" fill="#FDE047" />
    </svg>
  );
}

export function FruitSliceArcade() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<GameMode>("classic");
  const [phase, setPhase] = useState<Phase>("idle");
  const [best, setBest] = useState<BestScores>(readBestScores);
  const [hud, setHud] = useState<Hud>({ score: 0, lives: 3, timeLeft: MODE_DURATION.classic, combo: 0, countdown: 3 });
  const [finalScore, setFinalScore] = useState(0);
  const [finalBest, setFinalBest] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const shellRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scaleRef = useRef(1);
  const gameRef = useRef<FruitGame | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const phaseRef = useRef(phase);
  const soundRef = useRef(soundOn);
  const bestRef = useRef(best);
  const copyRef = useRef<ArcadeCopy | null>(null);
  const tickRef = useRef<(now: number) => void>(() => undefined);
  phaseRef.current = phase;
  soundRef.current = soundOn;
  bestRef.current = best;
  copyRef.current = {
    scamTexts: [1, 2, 3, 4, 5, 6].map((index) => t(`slice.scam.${index}`)),
    realTexts: [1, 2, 3, 4, 5].map((index) => t(`slice.real.${index}`)),
    unknown: t("arcade.unknown"),
    trusted: t("arcade.trusted"),
    bomb: t("arcade.bomb"),
    missed: t("arcade.missed"),
    safeMessage: t("arcade.safeMessage"),
    scamSliced: t("arcade.scamSliced"),
    golden: t("arcade.golden"),
  };

  const modeCards: ModeCard[] = [
    { id: "classic", icon: Zap, title: t("arcade.classic"), description: t("arcade.classicDesc"), meta: t("arcade.classicMeta") },
    { id: "zen", icon: Leaf, title: t("arcade.zen"), description: t("arcade.zenDesc"), meta: t("arcade.zenMeta") },
    { id: "patrol", icon: ShieldCheck, title: t("arcade.patrol"), description: t("arcade.patrolDesc"), meta: t("arcade.patrolMeta") },
  ];

  const playCue = useCallback((cue: "slice" | "bad" | "bonus" | "start") => {
    if (!soundRef.current || !window.AudioContext) return;
    try {
      const audio = audioRef.current ?? new window.AudioContext();
      audioRef.current = audio;
      if (audio.state === "suspended") void audio.resume().catch(() => undefined);
      const now = audio.currentTime;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const frequency = cue === "bad" ? 110 : cue === "bonus" ? 880 : cue === "start" ? 660 : 430 + Math.random() * 150;
      oscillator.type = cue === "bad" ? "sawtooth" : "sine";
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(cue === "bad" ? 65 : frequency * 1.45, now + 0.12);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(cue === "bad" ? 0.14 : 0.09, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (cue === "bad" ? 0.25 : 0.16));
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.28);
    } catch {
      // Sound is optional; gameplay continues when audio is unavailable.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(BEST_STORAGE_KEY, JSON.stringify(best));
    } catch {
      // Personal bests remain available for this session when storage is blocked.
    }
  }, [best]);

  useEffect(() => () => {
    if (audioRef.current) void audioRef.current.close().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (phaseRef.current === "playing") setPhase("paused");
        else setOpen(false);
      }
      if (event.key.toLowerCase() === "p") {
        setPhase((current) => current === "playing" ? "paused" : current === "paused" ? "playing" : current);
      }
    };
    const onVisibility = () => {
      if (document.visibilityState !== "visible" && phaseRef.current === "playing") setPhase("paused");
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    const arena = canvas?.parentElement;
    if (!canvas || !arena) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const resize = () => {
      const bounds = arena.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      scaleRef.current = dpr;
      canvas.width = Math.max(1, Math.round(bounds.width * dpr));
      canvas.height = Math.max(1, Math.round(bounds.height * dpr));
      canvas.style.width = `${bounds.width}px`;
      canvas.style.height = `${bounds.height}px`;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(arena);
    return () => observer.disconnect();
  }, [open]);

  const syncHud = useCallback((game: FruitGame) => {
    const next = {
      score: game.score,
      lives: Math.max(0, game.lives),
      timeLeft: Math.ceil(game.timeLeft),
      combo: game.combo,
      countdown: Math.ceil(game.countdown),
    };
    setHud((current) => Object.keys(next).every((key) => current[key as keyof Hud] === next[key as keyof Hud]) ? current : next);
  }, []);

  const finishGame = useCallback(() => {
    const game = gameRef.current;
    if (!game || phaseRef.current !== "playing") return;
    const gameMode = game.mode;
    const score = game.score;
    const previousBest = bestRef.current[gameMode];
    const nextBest = Math.max(previousBest, score);
    bestRef.current = { ...bestRef.current, [gameMode]: nextBest };
    setBest(bestRef.current);
    setFinalScore(score);
    setFinalBest(nextBest);
    setNewBest(score > previousBest);
    setPhase("over");
  }, []);

  useEffect(() => {
    if (!open) return;
    let frame = 0;
    let lastTime = performance.now();
    let lastHudTime = 0;
    tickRef.current = (now) => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) return;
      const width = canvas.width / scaleRef.current;
      const height = canvas.height / scaleRef.current;
      const dt = Math.min(0.04, Math.max(0, (now - lastTime) / 1000));
      lastTime = now;
      context.setTransform(scaleRef.current, 0, 0, scaleRef.current, 0, 0);
      const game = gameRef.current;
      if (!game) {
        drawAttractMode(context, width, height, now);
        return;
      }
      if (phaseRef.current === "playing" && !game.over) {
        stepFruitGame(game, dt, context, width, height, copyRef.current as ArcadeCopy);
      }
      if (game.cue) {
        playCue(game.cue);
        game.cue = null;
      }
      if (game.over && phaseRef.current === "playing") finishGame();
      drawFruitGame(context, game, width, height, copyRef.current as ArcadeCopy);
      if (now - lastHudTime > 90) {
        syncHud(game);
        lastHudTime = now;
      }
    };
    const loop = (now: number) => {
      tickRef.current(now);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [open, finishGame, playCue, syncHud]);

  function startGame() {
    const game = createFruitGame(mode);
    gameRef.current = game;
    setFinalScore(0);
    setNewBest(false);
    setHud({ score: 0, lives: game.lives, timeLeft: MODE_DURATION[mode], combo: 0, countdown: 3 });
    setPhase("playing");
    playCue("start");
  }

  function pauseGame() {
    const game = gameRef.current;
    if (game) {
      game.pointerActive = false;
      game.lastPoint = null;
      game.shake = 0;
    }
    setPhase("paused");
  }

  function returnToModes() {
    gameRef.current = null;
    setPhase("idle");
    setNewBest(false);
  }

  function closeArcade() {
    if (phase === "playing") {
      pauseGame();
      return;
    }
    if (document.fullscreenElement === shellRef.current) void document.exitFullscreen().catch(() => undefined);
    setOpen(false);
    gameRef.current = null;
    setPhase("idle");
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await shellRef.current?.requestFullscreen();
    } catch {
      // The viewport-filling layout remains available without native fullscreen.
    }
  }

  function pointerCoordinates(event: ReactPointerEvent<HTMLCanvasElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }

  function onPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    const game = gameRef.current;
    if (phase !== "playing" || !game || game.over) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointerCoordinates(event);
    game.pointerActive = true;
    game.lastPoint = point;
    game.trail.push({ ...point, time: performance.now() });
    sliceFruitGame(game, point.x, point.y, point.x, point.y, copyRef.current as ArcadeCopy);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const game = gameRef.current;
    if (phase !== "playing" || !game?.pointerActive || !game.lastPoint || game.over) return;
    event.preventDefault();
    const point = pointerCoordinates(event);
    game.trail.push({ ...point, time: performance.now() });
    sliceFruitGame(game, game.lastPoint.x, game.lastPoint.y, point.x, point.y, copyRef.current as ArcadeCopy);
    game.lastPoint = point;
  }

  function onPointerEnd(event: ReactPointerEvent<HTMLCanvasElement>) {
    const game = gameRef.current;
    if (game) {
      game.pointerActive = false;
      game.lastPoint = null;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  const preview = (
    <section className="relative isolate overflow-hidden rounded-[2rem] border border-[#24514E] bg-[#08252D] p-6 text-white shadow-[0_24px_60px_-30px_rgba(3,29,35,0.9)] sm:p-8">
      <div className="absolute -right-20 -top-28 -z-10 h-80 w-80 rounded-full border-[45px] border-[#123B3F]" aria-hidden="true" />
      <div className="grid items-center gap-6 sm:grid-cols-[1fr_180px]">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#7CE8C1]">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {t("arcade.teaserEyebrow")}
          </p>
          <h2 className="mt-3 font-display text-3xl font-black tracking-[-0.04em] text-[#FFFCED] sm:text-4xl">{t("arcade.title")}</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[#C5DDD8]">{t("arcade.teaserDescription")}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-extrabold uppercase tracking-wider text-[#DEF8EF]">
            <span className="rounded-full border border-[#37675E] bg-[#10383D] px-3 py-1.5">{t("arcade.threeModes")}</span>
            <span className="rounded-full border border-[#37675E] bg-[#10383D] px-3 py-1.5">{t("arcade.touchMouse")}</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-6 inline-flex min-h-13 items-center gap-3 rounded-2xl bg-[#F9C74F] px-6 py-3.5 text-sm font-black text-[#302203] shadow-[0_5px_0_#B77B14] transition-all hover:-translate-y-0.5 hover:bg-[#FFDA70] active:translate-y-1 active:shadow-none"
          >
            <Play className="h-5 w-5 fill-current" aria-hidden="true" />
            {t("arcade.playNow")}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="fruit-arcade-float mx-auto hidden w-44 sm:block"><FruitPreviewArt /></div>
      </div>
    </section>
  );

  if (!open) return preview;

  const selectedMode = modeCards.find((item) => item.id === mode) ?? modeCards[0];
  const overlay = (
    <div ref={shellRef} className="fixed inset-0 z-[120] h-[100dvh] w-screen overflow-hidden bg-[#071E26] text-white" role="dialog" aria-modal="true" aria-label={t("arcade.title")}>
      <div className="relative h-full w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          className={cn("absolute inset-0 block h-full w-full", phase === "playing" ? "cursor-crosshair touch-none select-none" : "pointer-events-none")}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          aria-label={t("arcade.arenaLabel")}
        />

        {phase === "playing" && (
          <>
            <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-3 sm:p-5" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
              <div className="rounded-2xl border border-white/15 bg-[#071E26]/90 px-4 py-2.5 shadow-lg backdrop-blur-md sm:px-5">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#7CE8C1]">{t("arcade.score")}</p>
                <p className="font-display text-2xl font-black tabular-nums text-white sm:text-3xl">{hud.score}</p>
              </div>
              <div className="min-w-0 flex-1 pt-1 text-center">
                <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#B9D6CE]">{selectedMode.title}</p>
                <div className="mx-auto mt-1 flex items-center justify-center gap-1.5">
                  <Timer className="h-5 w-5 text-[#F9C74F]" aria-hidden="true" />
                  <span className={cn("font-display text-2xl font-black tabular-nums sm:text-3xl", hud.timeLeft <= 10 && hud.countdown === 0 && "text-[#FDA4AF]")}>{hud.timeLeft}</span>
                  <span className="self-end pb-1 text-[10px] font-bold text-[#B9D6CE]">s</span>
                </div>
                <div className="mx-auto mt-1 h-1 w-20 overflow-hidden rounded-full bg-white/15 sm:w-32">
                  <div className="h-full rounded-full bg-[#F9C74F] transition-[width] duration-150" style={{ width: `${Math.max(0, Math.min(100, hud.timeLeft / MODE_DURATION[mode] * 100))}%` }} />
                </div>
              </div>
              <div className="pointer-events-auto flex items-center gap-1.5">
                {mode !== "zen" && (
                  <div className="mr-1 hidden rounded-2xl border border-white/15 bg-[#071E26]/90 px-3 py-2 sm:flex" aria-label={t("arcade.lives")}>
                    {[0, 1, 2].map((life) => <Heart key={life} className={cn("h-5 w-5", life < hud.lives ? "fill-[#FB7185] text-[#FB7185]" : "text-white/20")} aria-hidden="true" />)}
                  </div>
                )}
                <button type="button" onClick={() => setSoundOn((value) => !value)} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-[#071E26]/90 text-white hover:bg-[#123E43]" aria-label={soundOn ? t("arcade.soundOff") : t("arcade.soundOn")}>
                  {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </button>
                <button type="button" onClick={pauseGame} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-[#071E26]/90 text-white hover:bg-[#123E43]" aria-label={t("arcade.pause")}>
                  <Pause className="h-5 w-5 fill-current" />
                </button>
              </div>
            </header>
            {mode !== "zen" && (
              <div className="pointer-events-none absolute left-4 top-24 z-10 flex gap-1 sm:hidden" aria-label={t("arcade.lives")}>
                {[0, 1, 2].map((life) => <Heart key={life} className={cn("h-5 w-5", life < hud.lives ? "fill-[#FB7185] text-[#FB7185]" : "text-white/20")} aria-hidden="true" />)}
              </div>
            )}
            {hud.combo >= 2 && hud.countdown === 0 && (
              <div className="pointer-events-none absolute bottom-24 left-1/2 z-10 -translate-x-1/2 rounded-full border border-[#F9C74F]/50 bg-[#26350B]/90 px-5 py-2 font-display text-xl font-black text-[#FDE68A] shadow-lg">
                {t("arcade.combo", { n: Math.min(4, 1 + Math.floor((hud.combo - 1) / 4)) })} <span className="ml-1 text-xs text-white">×{hud.combo}</span>
              </div>
            )}
            <p className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-2 p-4 text-center text-xs font-bold text-[#C5DDD8]" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
              {mode === "classic" ? <Bomb className="h-4 w-4 shrink-0 text-[#FDA4AF]" /> : mode === "patrol" ? <ShieldCheck className="h-4 w-4 shrink-0 text-[#7CE8C1]" /> : <Leaf className="h-4 w-4 shrink-0 text-[#7CE8C1]" />}
              {t(`arcade.${mode}Hint`)}
            </p>
            {hud.countdown > 0 && (
              <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-[#071E26]/35">
                <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-[#F9C74F] bg-[#092C33]/95 font-display text-7xl font-black text-[#FFFCED] shadow-[0_0_60px_rgba(249,199,79,0.2)]">{hud.countdown}</div>
              </div>
            )}
          </>
        )}

        {phase === "idle" && (
          <div className="absolute inset-0 z-20 overflow-y-auto bg-[#061920]/65 backdrop-blur-[2px]">
            <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-4 px-4 py-4 sm:px-7" style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F9C74F] text-[#302203]"><Sparkles className="h-5 w-5" /></span>
                <div><p className="font-display text-sm font-black tracking-wide">{t("arcade.brand")}</p><p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#7CE8C1]">{t("arcade.teaserEyebrow")}</p></div>
              </div>
              <button type="button" onClick={closeArcade} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-[#0C3035]/90 text-white hover:bg-[#16484A]" aria-label={t("arcade.exit")}><X className="h-5 w-5" /></button>
            </header>
            <div className="fruit-arcade-enter mx-auto grid min-h-full w-full max-w-7xl items-center gap-8 px-5 pb-10 pt-28 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:pt-24">
              <div className="relative mx-auto w-full max-w-lg text-center lg:text-left">
                <div className="fruit-arcade-float mx-auto mb-3 w-44 sm:w-52 lg:absolute lg:-left-14 lg:-top-32 lg:mb-0 lg:w-64 lg:opacity-90"><FruitPreviewArt /></div>
                <p className="mt-2 text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#7CE8C1] lg:mt-32">{t("arcade.welcome")}</p>
                <h1 className="mt-3 font-display text-5xl font-black leading-[0.95] tracking-[-0.055em] text-[#FFFCED] sm:text-7xl">{t("arcade.title")}</h1>
                <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-[#C5DDD8] sm:text-base lg:mx-0">{t("arcade.subtitle")}</p>
                <div className="mt-7 flex items-center justify-center gap-6 text-left lg:justify-start">
                  <div className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#173C3B] text-[#F9C74F]"><Trophy className="h-4 w-4" /></span><div><p className="text-[9px] font-bold uppercase tracking-wider text-[#AFCBC5]">{t("arcade.best")}</p><p className="font-display text-lg font-black tabular-nums">{best[mode]}</p></div></div>
                  <div className="h-9 w-px bg-white/15" />
                  <div className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#173C3B] text-[#7CE8C1]"><Timer className="h-4 w-4" /></span><div><p className="text-[9px] font-bold uppercase tracking-wider text-[#AFCBC5]">{t("arcade.time")}</p><p className="font-display text-lg font-black">{MODE_DURATION[mode]}s</p></div></div>
                </div>
              </div>
              <div className="w-full max-w-xl justify-self-center rounded-[2rem] border border-white/15 bg-[#09272E]/95 p-4 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.7)] sm:p-6">
                <p className="px-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#7CE8C1]">{t("arcade.chooseMode")}</p>
                <div className="mt-3 space-y-3">
                  {modeCards.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setMode(card.id)}
                      aria-pressed={mode === card.id}
                      className={cn(
                        "flex min-h-24 w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors",
                        mode === card.id ? "border-[#F9C74F] bg-[#143D3C] shadow-[inset_4px_0_0_#F9C74F]" : "border-white/10 bg-[#0D3036] hover:border-white/30 hover:bg-[#12383D]",
                      )}
                    >
                      <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", card.id === "classic" ? "bg-[#F9C74F] text-[#302203]" : card.id === "zen" ? "bg-[#A7F3D0] text-[#065F46]" : "bg-[#BAE6FD] text-[#075985]")}><card.icon className="h-6 w-6" /></span>
                      <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-3"><strong className="font-display text-base font-extrabold text-white">{card.title}</strong>{mode === card.id && <Check className="h-4 w-4 shrink-0 text-[#F9C74F]" />}</span><span className="mt-1 block text-xs leading-relaxed text-[#C5DDD8]">{card.description}</span><span className="mt-2 block text-[10px] font-extrabold uppercase tracking-wider text-[#F9C74F]">{card.meta}</span></span>
                    </button>
                  ))}
                </div>
                <button type="button" onClick={startGame} className="mt-5 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#F9C74F] px-5 py-4 font-display text-base font-black text-[#302203] shadow-[0_5px_0_#A9690B] transition-all hover:-translate-y-0.5 hover:bg-[#FFDA70] active:translate-y-1 active:shadow-none"><Play className="h-5 w-5 fill-current" />{t("arcade.startMode", { mode: selectedMode.title })}</button>
                <div className="mt-5 flex items-center justify-between gap-3 px-1">
                  <p className="text-[10px] font-semibold text-[#AFCBC5]">{t("arcade.mouseTouch")}</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setSoundOn((value) => !value)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 text-white hover:bg-white/10" aria-label={soundOn ? t("arcade.soundOff") : t("arcade.soundOn")}>{soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}</button>
                    <button type="button" onClick={() => void toggleFullscreen()} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 text-white hover:bg-white/10" aria-label={t("arcade.fullscreen")}><Maximize2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {phase === "paused" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-[#04171E]/80 p-5 backdrop-blur-md">
            <div className="fruit-arcade-enter my-auto w-full max-w-sm rounded-[2rem] border border-white/15 bg-[#0B2C33] p-7 text-center shadow-2xl">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#173F40] text-[#F9C74F]"><Pause className="h-7 w-7 fill-current" /></span>
              <h2 className="mt-5 font-display text-3xl font-black text-[#FFFCED]">{t("arcade.pausedTitle")}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#C5DDD8]">{t("arcade.pausedBody")}</p>
              <button type="button" onClick={() => setPhase("playing")} className="mt-6 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#F9C74F] px-5 py-3.5 font-black text-[#302203] shadow-[0_4px_0_#A9690B] hover:bg-[#FFDA70]"><Play className="h-5 w-5 fill-current" />{t("arcade.resume")}</button>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button type="button" onClick={startGame} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 text-sm font-bold text-white hover:bg-white/10"><RotateCcw className="h-4 w-4" />{t("arcade.restart")}</button>
                <button type="button" onClick={returnToModes} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 text-sm font-bold text-white hover:bg-white/10"><ArrowLeft className="h-4 w-4" />{t("arcade.modes")}</button>
              </div>
              <button type="button" onClick={closeArcade} className="mt-5 min-h-11 px-4 text-xs font-bold text-[#C5DDD8] underline decoration-white/30 underline-offset-4 hover:text-white">{t("arcade.exit")}</button>
            </div>
          </div>
        )}

        {phase === "over" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-[#04171E]/75 p-5 backdrop-blur-md">
            <div className="fruit-arcade-enter my-auto w-full max-w-md rounded-[2rem] border border-[#F9C74F]/35 bg-[#0B2C33] p-6 text-center shadow-[0_30px_90px_rgba(0,0,0,0.5)] sm:p-8" role="status">
              <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#F9C74F] bg-[#2D431C] text-[#FDE68A]"><Trophy className="h-9 w-9" /></span>
              <p className="mt-5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#7CE8C1]">{selectedMode.title}</p>
              <h2 className="mt-2 font-display text-3xl font-black text-[#FFFCED]">{t("arcade.gameOver")}</h2>
              {newBest && <p className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full bg-[#3A4712] px-4 py-2 text-xs font-extrabold text-[#FDE68A]"><Sparkles className="h-4 w-4" />{t("arcade.newBest")}</p>}
              <p className="mt-5 font-display text-7xl font-black tabular-nums tracking-[-0.06em] text-[#F9C74F]">{finalScore}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-[#C5DDD8]">{t("arcade.points")}</p>
              <div className="mt-5 flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#123B3C] px-4 py-3"><Trophy className="h-4 w-4 text-[#F9C74F]" /><span className="text-sm font-bold text-[#C5DDD8]">{t("arcade.best")}</span><strong className="font-display text-lg font-black tabular-nums text-white">{finalBest}</strong></div>
              <button type="button" onClick={startGame} className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#F9C74F] px-5 py-4 font-black text-[#302203] shadow-[0_5px_0_#A9690B] hover:bg-[#FFDA70]"><RotateCcw className="h-5 w-5" />{t("arcade.playAgain")}</button>
              <button type="button" onClick={returnToModes} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/15 text-sm font-bold text-white hover:bg-white/10"><ArrowLeft className="h-4 w-4" />{t("arcade.modes")}</button>
              <button type="button" onClick={closeArcade} className="mt-4 min-h-10 text-xs font-bold text-[#C5DDD8] underline decoration-white/30 underline-offset-4 hover:text-white">{t("arcade.exit")}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return <>{preview}{createPortal(overlay, document.body)}</>;
}
