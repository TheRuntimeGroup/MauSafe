import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  Clock3,
  Heart,
  LoaderCircle,
  MousePointerClick,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Zap,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { HamsterIcon, ScammerIcon } from "@/components/WhackCharacters";
import { LevelPicker } from "@/components/LevelPicker";
import { CoinReward, GameLeaderboard } from "@/components/GameLeaderboard";
import { recordKidGameActivity, type ActivityInput, type GameLevel } from "@/lib/kidProgress";
import { cn } from "@/lib/utils";
import "./WhackGame.css";

type Phase = "menu" | "playing" | "between" | "results";
type Mole = { id: number; kind: "scammer" | "hamster"; label: number };
type SaveStatus = "idle" | "saving" | "saved" | "error";

const ROUND_SECONDS = [20, 18, 16];
const ROUND_SPAWN_MS = [950, 720, 520];
const ROUND_VISIBLE_MS = [1450, 1100, 820];
const LEVEL_SPEED = { beginner: 1.20, skilled: 1, expert: 0.80 };
const LEVEL_POINTS = { beginner: 10, skilled: 15, expert: 20 };

export function WhackGame({ onBack, onProgressChange }: { onBack: () => void; onProgressChange?: () => void }) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>("menu");
  const [level, setLevel] = useState<GameLevel>("beginner");
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS[0]);
  const [moles, setMoles] = useState<(Mole | null)[]>(Array(9).fill(null));
  const [scammersCaught, setScammersCaught] = useState(0);
  const [hamstersProtected, setHamstersProtected] = useState(0);
  const [hamstersHit, setHamstersHit] = useState(0);
  const [shake, setShake] = useState(0);
  const [feedback, setFeedback] = useState<{ id: number; text: string; good: boolean } | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [totalPoints, setTotalPoints] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const molesRef = useRef<(Mole | null)[]>(Array(9).fill(null));
  const phaseRef = useRef<Phase>(phase);
  const scoreRef = useRef(0);
  const nextIdRef = useRef(1);
  const timersRef = useRef<Set<number>>(new Set());
  const startedAtRef = useRef(0);
  const resultRef = useRef<ActivityInput | null>(null);
  phaseRef.current = phase;

  const clearTimers = useCallback(() => {
    for (const timer of timersRef.current) window.clearTimeout(timer);
    timersRef.current.clear();
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const schedule = useCallback((callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timersRef.current.delete(timer);
      callback();
    }, delay);
    timersRef.current.add(timer);
    return timer;
  }, []);

  const spawnMole = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    const available = molesRef.current.map((mole, index) => mole === null ? index : -1).filter((index) => index >= 0);
    if (available.length === 0) return;
    const index = available[Math.floor(Math.random() * available.length)];
    const mole: Mole = {
      id: nextIdRef.current++,
      kind: Math.random() < 0.68 ? "scammer" : "hamster",
      label: Math.floor(Math.random() * 4),
    };
    const next = [...molesRef.current];
    next[index] = mole;
    molesRef.current = next;
    setMoles(next);
    schedule(() => {
      if (phaseRef.current !== "playing") return;
      const updated = [...molesRef.current];
      if (updated[index]?.id !== mole.id) return;
      updated[index] = null;
      molesRef.current = updated;
      setMoles(updated);
      if (mole.kind === "hamster") setHamstersProtected((count) => count + 1);
    }, ROUND_VISIBLE_MS[round - 1] * LEVEL_SPEED[level]);
  }, [round, level, schedule]);

  useEffect(() => {
    if (phase !== "playing") return;
    spawnMole();
    const spawnNext = () => {
      spawnMole();
      schedule(spawnNext, ROUND_SPAWN_MS[round - 1] * LEVEL_SPEED[level]);
    };
    schedule(spawnNext, ROUND_SPAWN_MS[round - 1] * LEVEL_SPEED[level]);
    return clearTimers;
  }, [phase, round, level, spawnMole, schedule, clearTimers]);

  const saveResult = useCallback(async () => {
    const result = resultRef.current;
    if (!result) return;
    setSaveStatus("saving");
    try {
      const saved = await recordKidGameActivity(result);
      if (resultRef.current?.activityId !== result.activityId) return;
      setTotalPoints(saved.score);
      setTotalCoins(saved.coins);
      setCoinsEarned(saved.coinsEarned);
      setNewAchievements(saved.newAchievements);
      setSaveStatus("saved");
      onProgressChange?.();
    } catch {
      if (resultRef.current?.activityId === result.activityId) setSaveStatus("error");
    }
  }, [onProgressChange]);

  const finishRound = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    clearTimers();
    molesRef.current = Array(9).fill(null);
    setMoles(molesRef.current);
    setCombo(0);
    if (round < 3) {
      setPhase("between");
      return;
    }
    resultRef.current = {
      activityId: crypto.randomUUID(),
      gameId: "whack",
      mode: "whack",
      level,
      score: scoreRef.current,
      durationSeconds: Math.round((Date.now() - startedAtRef.current) / 1000),
    };
    setPhase("results");
    void saveResult();
  }, [round, level, clearTimers, saveResult]);

  useEffect(() => {
    if (phase !== "playing") return;
    const endAt = Date.now() + timeLeft * 1000;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        window.clearInterval(timer);
        finishRound();
      }
    }, 150);
    return () => window.clearInterval(timer);
    // timeLeft is the fixed remaining time captured when a round begins.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round, finishRound]);

  function beginRound(nextRound: number) {
    clearTimers();
    setRound(nextRound);
    setTimeLeft(ROUND_SECONDS[nextRound - 1]);
    setFeedback(null);
    molesRef.current = Array(9).fill(null);
    setMoles(molesRef.current);
    setPhase("playing");
  }

  function startGame() {
    scoreRef.current = 0;
    nextIdRef.current = 1;
    resultRef.current = null;
    setScore(0);
    setCombo(0);
    setScammersCaught(0);
    setHamstersProtected(0);
    setHamstersHit(0);
    setSaveStatus("idle");
    setNewAchievements([]);
    startedAtRef.current = Date.now();
    beginRound(1);
  }

  function hitMole(index: number) {
    if (phaseRef.current !== "playing") return;
    const mole = molesRef.current[index];
    if (!mole) return;
    const next = [...molesRef.current];
    next[index] = null;
    molesRef.current = next;
    setMoles(next);
    setShake((value) => value + 1);
    if (mole.kind === "scammer") {
      const points = LEVEL_POINTS[level] + Math.min(combo, 5) * 2;
      scoreRef.current += points;
      setScore(scoreRef.current);
      setCombo((value) => value + 1);
      setScammersCaught((value) => value + 1);
      setFeedback({ id: mole.id, text: t("whack.caughtFeedback", { points }), good: true });
    } else {
      scoreRef.current = Math.max(0, scoreRef.current - 5);
      setScore(scoreRef.current);
      setCombo(0);
      setHamstersHit((value) => value + 1);
      setFeedback({ id: mole.id, text: t("whack.genuineFeedback"), good: false });
    }
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-[#D7D2C7] bg-[#F9F4E8] shadow-premium">
      <header className="flex min-h-16 items-center justify-between gap-3 bg-[#30253D] px-4 py-3 text-white sm:px-6">
        <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-xs font-bold text-[#DED1E8] hover:text-white"><ArrowLeft className="h-4 w-4" />{t("arcade.backToArcade")}</button>
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#FDE68A]">{t("whack.miniTitle")}</span>
      </header>

      {phase === "playing" && (
        <div className="p-3 sm:p-6">
          <div key={shake} className={shake ? "whack-screen-shake" : undefined}>
            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#3F314C] p-3 text-white sm:gap-4 sm:px-5">
              <div><p className="text-[9px] font-extrabold uppercase tracking-widest text-[#D7C6E2]">{t("arcade.score")}</p><p className="mt-0.5 font-display text-2xl font-black tabular-nums text-[#FDE68A]">{score}</p></div>
              <div className="text-center"><p className="text-[9px] font-extrabold uppercase tracking-widest text-[#D7C6E2]">{t("whack.roundProgress", { round })}</p><p className="mt-0.5 flex items-center justify-center gap-1 font-display text-2xl font-black tabular-nums"><Clock3 className="h-4 w-4 text-[#A7F3D0]" />{timeLeft}</p></div>
              <div className="text-right"><p className="text-[9px] font-extrabold uppercase tracking-widest text-[#D7C6E2]">{t("whack.combo")}</p><p className="mt-0.5 font-display text-2xl font-black tabular-nums text-[#A7F3D0]">×{combo}</p></div>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#DED3C2]"><div className="h-full rounded-full bg-[#8A5EAD] transition-[width] duration-150" style={{ width: `${timeLeft / ROUND_SECONDS[round - 1] * 100}%` }} /></div>
            <div className="min-h-7 pt-2 text-center" aria-live="polite">
              {feedback && <p key={feedback.id} className={cn("whack-hit-feedback inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold", feedback.good ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900")}>{feedback.good ? <ShieldCheck className="h-3.5 w-3.5" /> : <Heart className="h-3.5 w-3.5" />}{feedback.text}</p>}
            </div>
            <div className="mt-1 grid grid-cols-3 gap-x-1.5 gap-y-2 rounded-[1.5rem] border border-[#D7C4A5] bg-[#EBD9B8] p-2.5 sm:gap-x-4 sm:gap-y-3 sm:p-5">
              {moles.map((mole, index) => (
                <div key={index} className="relative flex h-[6.8rem] items-end justify-center overflow-hidden rounded-2xl bg-[#E3CFA7] sm:h-40">
                  <div className="absolute inset-x-2 bottom-2 top-2 overflow-hidden">
                    {mole && (
                      <button
                        type="button"
                        onClick={() => hitMole(index)}
                        className={cn("whack-character absolute inset-x-0 bottom-0 flex min-h-20 flex-col items-center justify-end rounded-xl pb-0.5 outline-none focus-visible:ring-4 focus-visible:ring-[#F9C74F]", mole.kind === "scammer" ? "bg-[#F4DDEA]" : "bg-[#E2F4DD]")}
                        aria-label={mole.kind === "scammer" ? t("whack.hitScammer") : t("whack.protectHamster")}
                      >
                        {mole.kind === "scammer" ? <ScammerIcon className="h-[4.8rem] w-[4.8rem] sm:h-28 sm:w-28" /> : <HamsterIcon className="h-[4.8rem] w-[4.8rem] sm:h-28 sm:w-28" />}
                        <span className={cn("block w-full truncate px-1 text-center text-[7px] font-extrabold uppercase tracking-wide sm:text-[9px]", mole.kind === "scammer" ? "bg-[#FFE0E8] text-[#9F1239]" : "bg-[#E2F4DD] text-[#226744]")}>{mole.kind === "scammer" ? t(`whack.fake.${mole.label}`) : t(`whack.real.${mole.label}`)}</span>
                      </button>
                    )}
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 rounded-[50%] border-[5px] border-[#69482C] bg-[#33261D] shadow-[inset_0_6px_8px_rgba(0,0,0,0.55)] sm:h-8" aria-hidden="true" />
                  <div className="pointer-events-none absolute inset-x-1 bottom-0 z-20 h-2.5 rounded-[50%] bg-[#946A3A] sm:h-3" aria-hidden="true" />
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-[11px] font-semibold leading-relaxed text-[#615546]">{t("whack.playHint")}</p>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-center text-[10px] font-bold text-[#8A4870]"><Zap className="h-3 w-3" />{t(`whack.roundSpeed.${round}`)}</p>
          </div>
        </div>
      )}

      {phase === "between" && (
        <div className="p-6 text-center sm:p-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#DDF4E8] text-emerald-700"><Check className="h-8 w-8" /></span>
          <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#8A5EAD]">{t("whack.roundComplete", { round })}</p>
          <h2 className="mt-2 font-display text-3xl font-black text-[#30253D]">{t("whack.nextFaster")}</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[#6F6376]">{t("whack.nextRoundBody")}</p>
          <div className="mx-auto mt-5 flex max-w-xs items-center justify-between rounded-2xl bg-[#EEE5F3] p-4 text-left"><div><p className="text-[10px] font-bold uppercase tracking-wider text-[#7E698C]">{t("arcade.score")}</p><p className="font-display text-3xl font-black text-[#30253D]">{score}</p></div><Timer className="h-9 w-9 text-[#8A5EAD]" /></div>
          <button type="button" onClick={() => beginRound(round + 1)} className="mt-6 inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#6F458C] px-7 text-sm font-extrabold text-white shadow-[0_4px_0_#432653] hover:bg-[#5C3776]">{t("whack.beginRound", { round: round + 1 })}<ArrowRight className="h-5 w-5" /></button>
          <p className="mt-4 text-xs font-semibold text-[#7C6C83]">{t("whack.scamCaught", { count: scammersCaught })} · {t("whack.hamstersProtected", { count: hamstersProtected })}</p>
        </div>
      )}

      {phase === "results" && (
        <div className="p-6 text-center sm:p-9">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-[#FFF0B9] text-[#936B08]"><Trophy className="h-9 w-9" /></span>
          <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#8A5EAD]">{t("whack.allRoundsDone")}</p>
          <h2 className="mt-2 font-display text-3xl font-black text-[#30253D]">{t("whack.resultTitle")}</h2>
          <p className="mt-5 font-display text-6xl font-black tabular-nums text-[#6F458C]">{score}</p>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[#7C6C83]">{t("kids.learningPoints")}</p>
          <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-[#E8F5EE] p-3"><ShieldCheck className="mx-auto h-5 w-5 text-emerald-700" /><p className="mt-1 font-display text-xl font-black text-emerald-900">{scammersCaught}</p><p className="text-[10px] font-bold text-emerald-800">{t("whack.caughtStat")}</p></div><div className="rounded-2xl bg-[#F2E9F7] p-3"><Heart className="mx-auto h-5 w-5 text-[#8A5EAD]" /><p className="mt-1 font-display text-xl font-black text-[#533763]">{hamstersProtected}</p><p className="text-[10px] font-bold text-[#6D517C]">{t("whack.protectedStat")}</p></div></div>
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-[#F0E9E0] p-4 text-left"><BookOpenIcon /><p className="text-xs leading-relaxed text-[#65564D]">{t("whack.resultLesson")}</p></div>
          {hamstersHit > 0 && <p className="mt-3 text-xs font-semibold text-[#826B3D]">{t("whack.forgiveHamsters", { count: hamstersHit })}</p>}
          {saveStatus === "saving" && <p className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-[#76667F]" role="status"><LoaderCircle className="h-4 w-4 animate-spin" />{t("progress.saving")}</p>}
          {saveStatus === "saved" && <div className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-extrabold text-emerald-900" role="status"><p className="flex items-center justify-center gap-2"><Check className="h-4 w-4" />{t("progress.saved")}</p><p className="mt-1 text-xs font-semibold">{t("kids.allTimeTotal", { score: totalPoints })}</p></div>}
          {saveStatus === "saved" && <CoinReward earned={coinsEarned} total={totalCoins} />}
          {saveStatus === "error" && <div className="mt-4 rounded-2xl bg-rose-50 p-3" role="alert"><p className="text-sm font-bold text-rose-900">{t("progress.error")}</p><button type="button" onClick={() => void saveResult()} className="mt-2 rounded-lg bg-rose-700 px-4 py-2 text-xs font-bold text-white">{t("common.retry")}</button></div>}
          {newAchievements.length > 0 && <p className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-amber-50 p-3 text-xs font-extrabold text-amber-900"><Sparkles className="h-4 w-4" />{t("achievement.unlockedMessage", { name: t(`achievement.${newAchievements[0]}.title`) })}</p>}
          <div className="mt-4 text-left"><GameLeaderboard gameId="whack" mode="whack" level={level} refreshKey={totalCoins} compact /></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={startGame} className="flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-[#6F458C] px-4 text-sm font-extrabold text-white"><RefreshCw className="h-4 w-4" />{t("whack.playAgain")}</button><button type="button" onClick={onBack} className="flex min-h-13 items-center justify-center gap-2 rounded-2xl border border-[#CFC1D8] px-4 text-sm font-extrabold text-[#533763]">{t("arcade.backToArcade")}<ArrowRight className="h-4 w-4" /></button></div>
        </div>
      )}

      {phase === "menu" && (
        <div className="p-5 sm:p-8">
          <div className="text-center"><p className="text-[10px] font-extrabold uppercase tracking-[0.19em] text-[#8A5EAD]">{t("whack.eyebrow")}</p><h2 className="mt-2 font-display text-3xl font-black text-[#30253D] sm:text-4xl">{t("kids.game.whack")}</h2><p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#6F6376]">{t("whack.intro")}</p></div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[#F0C9D8] bg-[#FCEBF1] p-3 text-center"><ScammerIcon className="mx-auto h-24 w-24 sm:h-28 sm:w-28" /><p className="text-xs font-extrabold text-[#A3244E]">{t("whack.hitScammer")}</p><p className="mt-1 text-[10px] leading-relaxed text-[#8A5267]">{t("whack.scammerLesson")}</p></div>
            <div className="rounded-2xl border border-[#C8E6D5] bg-[#EDF8F0] p-3 text-center"><HamsterIcon className="mx-auto h-24 w-24 sm:h-28 sm:w-28" /><p className="text-xs font-extrabold text-[#24734B]">{t("whack.protectHamster")}</p><p className="mt-1 text-[10px] leading-relaxed text-[#567562]">{t("whack.hamsterLesson")}</p></div>
          </div>
          <div className="mt-5 rounded-2xl bg-[#30253D] p-4"><LevelPicker value={level} onChange={setLevel} /></div>
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-[#EEE7F4] p-4"><CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-[#8A5EAD]" /><p className="text-xs leading-relaxed text-[#675571]">{t("whack.rules")}</p></div>
          <button type="button" onClick={startGame} className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#6F458C] px-5 font-display text-base font-extrabold text-white shadow-[0_5px_0_#432653] hover:bg-[#5C3776]"><MousePointerClick className="h-5 w-5" />{t("whack.start")}<ArrowRight className="h-5 w-5" /></button>
          <p className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] font-semibold text-[#786A80]"><Target className="h-3.5 w-3.5" />{t("whack.levelPoints", { points: LEVEL_POINTS[level] })}</p>
          <div className="mt-5"><GameLeaderboard gameId="whack" mode="whack" level={level} refreshKey={totalCoins} compact /></div>
        </div>
      )}
    </section>
  );
}

function BookOpenIcon() {
  return <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#E4D4F0] text-[#70458A]"><CircleHelp className="h-4 w-4" /></span>;
}
