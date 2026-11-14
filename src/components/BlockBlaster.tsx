import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  Grid3X3,
  Lightbulb,
  LoaderCircle,
  LockKeyhole,
  MailWarning,
  Medal,
  Play,
  RefreshCw,
  ShieldCheck,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { CoinReward } from "@/components/GameLeaderboard";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  addSpam,
  BLOCK_LEVELS,
  createLevelBoard,
  isAdjacent,
  performMove,
  SPAM,
  starsForMoves,
  tileKind,
  type BlockLevelConfig,
} from "./blockBlasterEngine";
import "./BlockBlaster.css";

type Phase = "map" | "playing" | "won" | "lost";
type LevelRecord = { level_number: number; best_score: number; best_stars: number; plays: number };
type LeaderRow = { player_number: number; best_score: number; plays: number };
type SaveResult = { score: number; coins: number; coinsEarned: number; newAchievements: string[] };

const TILE_COLORS = ["#FF6B6B", "#32BFA0", "#FFC84A", "#7C82F6", "#E970B7", "#58AEE8"];
const TILE_SHAPES = ["50%", "24%", "50% 50% 18% 18%", "18%", "46% 46% 28% 28%", "50% 24% 50% 24%"];

function levelAndTileIndexes(board: number[]) {
  return Array.from({ length: board.length }, (_, index) => index);
}

export function BlockBlaster({ onBack, onProgressChange }: { onBack: () => void; onProgressChange?: () => void }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("map");
  const [records, setRecords] = useState<LevelRecord[]>([]);
  const [progressLoading, setProgressLoading] = useState(true);
  const [progressError, setProgressError] = useState(false);
  const [level, setLevel] = useState<BlockLevelConfig>(BLOCK_LEVELS[0]);
  const [board, setBoard] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragPoint, setDragPoint] = useState<{ x: number; y: number } | null>(null);
  const [moves, setMoves] = useState(level.moves);
  const [score, setScore] = useState(0);
  const [spamCleared, setSpamCleared] = useState(0);
  const [combo, setCombo] = useState(0);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [hint, setHint] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [result, setResult] = useState<SaveResult | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const [leaderLoading, setLeaderLoading] = useState(false);
  const [leaderError, setLeaderError] = useState(false);
  const [leaderVersion, setLeaderVersion] = useState(0);
  const [stars, setStars] = useState(0);
  const [lastAction, setLastAction] = useState("");
  const [shake, setShake] = useState(0);
  const hitRef = useRef<HTMLDivElement>(null);
  const startedAtRef = useRef(0);
  const activityRef = useRef<string | null>(null);
  const tutorialLoadedRef = useRef(false);

  const loadProgress = useCallback(async () => {
    if (!user) return;
    setProgressLoading(true);
    setProgressError(false);
    try {
      const [levelResult, seen] = await Promise.all([
        supabase.from("kid_block_levels").select("level_number,best_score,best_stars,plays").eq("user_id", user.id),
        supabase.from("kid_tutorials").select("tutorial_id").eq("user_id", user.id).eq("tutorial_id", "block-blast").maybeSingle(),
      ]);
      if (levelResult.error) throw levelResult.error;
      if (seen.error) throw seen.error;
      setRecords((levelResult.data ?? []) as LevelRecord[]);
      tutorialLoadedRef.current = Boolean(seen.data);
      setTutorialOpen(!seen.data);
    } catch {
      setProgressError(true);
    } finally {
      setProgressLoading(false);
    }
  }, [user]);

  useEffect(() => { void loadProgress(); }, [loadProgress]);

  const maxUnlocked = Math.min(30, Math.max(1, ...records.map((record) => record.level_number + 1)));
  const starsTotal = records.reduce((sum, record) => sum + record.best_stars, 0);

  function startLevel(config: BlockLevelConfig) {
    if (progressError) {
      setLastAction(t("block.progressRequired"));
      return;
    }
    if (config.number > maxUnlocked) return;
    setLevel(config);
    setBoard(createLevelBoard(config));
    setMoves(config.moves);
    setScore(0);
    setSpamCleared(0);
    setCombo(0);
    setSelected(null);
    setHint([]);
    setStars(0);
    setResult(null);
    setSaveStatus("idle");
    setLastAction("");
    startedAtRef.current = Date.now();
    activityRef.current = crypto.randomUUID();
    setPhase("playing");
    if (!tutorialLoadedRef.current) setTutorialOpen(true);
    supabase.from("kid_tutorials").upsert({ user_id: user?.id, tutorial_id: "block-blast", seen_at: new Date().toISOString() }, { onConflict: "user_id,tutorial_id", ignoreDuplicates: true }).then(() => { tutorialLoadedRef.current = true; }).catch(() => undefined);
  }

  function closeTutorial() {
    tutorialLoadedRef.current = true;
    setTutorialOpen(false);
    if (user) void supabase.from("kid_tutorials").upsert({ user_id: user.id, tutorial_id: "block-blast", seen_at: new Date().toISOString() }, { onConflict: "user_id,tutorial_id", ignoreDuplicates: true }).catch(() => undefined);
  }

  function finishWin() {
    const earned = starsForMoves(moves, level.moves);
    setStars(earned);
    setPhase("won");
    setBusy(false);
    if (!activityRef.current) return;
    setSaveStatus("saving");
    void supabase.rpc("record_block_level", {
      p_activity_id: activityRef.current,
      p_level_number: level.number,
      p_score: Math.min(500, score),
      p_stars: earned,
      p_duration_seconds: Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000)),
    }).then(({ data, error }) => {
      if (error || !data) throw new Error("save");
      setResult(data as SaveResult);
      setRecords((current) => {
        const previous = current.find((record) => record.level_number === level.number);
        const updated = {
          level_number: level.number,
          best_score: Math.max(previous?.best_score ?? 0, Math.min(500, score)),
          best_stars: Math.max(previous?.best_stars ?? 0, earned),
          plays: (previous?.plays ?? 0) + 1,
        };
        return [...current.filter((record) => record.level_number !== level.number), updated];
      });
      setSaveStatus("saved");
      setLeaderVersion((value) => value + 1);
      onProgressChange?.();
    }).catch(() => setSaveStatus("error"));
  }

  const loadLeaderboard = useCallback(async () => {
    setLeaderLoading(true);
    setLeaderError(false);
    const { data, error } = await supabase.from("kid_block_levels")
      .select("player_number,best_score,plays")
      .eq("level_number", level.number)
      .order("best_score", { ascending: false })
      .order("updated_at", { ascending: true })
      .limit(5);
    setLeaderLoading(false);
    if (error) {
      setLeaderError(true);
      return;
    }
    setLeaderboard(data ?? []);
  }, [level.number]);

  useEffect(() => {
    if (phase !== "map" || !user) return;
    void loadLeaderboard();
  }, [phase, user, loadLeaderboard, leaderVersion]);

  const hintPair = useCallback(() => {
    for (let index = 0; index < board.length; index += 1) {
      for (const target of [index + 1, index + level.cols]) {
        if (target >= board.length || !isAdjacent(index, target, level.cols)) continue;
        if (performMove(board, level, index, target).valid) {
          setHint([index, target]);
          return;
        }
      }
    }
    setHint([]);
  }, [board, level]);

  function settle(earned: number, cleared: number, nextMoves: number, spamBoard: number[], action: string) {
    const newScore = Math.min(500, score + earned);
    const newCleared = spamCleared + cleared;
    setScore(newScore);
    setSpamCleared(newCleared);
    setBoard(spamBoard);
    setLastAction(action);
    if (newScore >= level.targetScore && newCleared >= level.targetSpam) {
      setMoves(nextMoves);
      finishWin();
    }
  }

  function swap(first: number, second: number) {
    if (phase !== "playing" || busy) return;
    if (!isAdjacent(first, second, level.cols)) return;
    const move = performMove(board, level, first, second);
    setSelected(null);
    setHint([]);
    setDragStart(null);
    setDragPoint(null);
    if (!move.valid) {
      setLastAction(t("block.noMatch"));
      setHint([first, second]);
      return;
    }
    const remaining = moves - 1;
    setBusy(true);
    const nextBoard = [...move.board];
    setBoard(nextBoard);
    setCombo(move.cascades);
    setShake((value) => value + 1);
    window.setTimeout(() => {
      const nextSpam = [...nextBoard];
      const willWave = remaining > 0 && remaining % level.waveEvery === 0;
      const newSpam = willWave ? addSpam(nextSpam, level.spamPerWave) : 0;
      const waveScore = newSpam * 12;
      const waveBlocked = willWave && newSpam === 0 && move.cascades > 1;
      if (newSpam) setShake((value) => value + 1);
      const action = newSpam > 0 ? t("block.waveBlocked", { count: move.spamRemoved, spam: newSpam, cascades: move.cascades }) : waveBlocked ? t("block.waveStopped") : t("block.moved", { count: move.cascades, points: move.points });
      if (remaining <= 0) {
        const newScore = Math.min(500, score + move.points + waveScore);
        const newCleared = spamCleared + move.spamRemoved;
        setScore(newScore);
        setSpamCleared(newCleared);
        setMoves(0);
        setBoard(nextSpam);
        if (newScore >= level.targetScore && newCleared >= level.targetSpam) {
          finishWin();
        } else {
          addSpam(nextSpam, Math.min(6, level.cols));
          setLastAction(t("block.tryAgain"));
          setPhase("lost");
        }
      } else {
        settle(move.points + waveScore, move.spamRemoved, remaining, nextSpam, action);
      }
      setBusy(false);
    }, 330);
  }

  function tileClick(index: number) {
    if (busy || board[index] === SPAM) return;
    if (selected === null) {
      setSelected(index);
      setHint([]);
      return;
    }
    if (index === selected) {
      setSelected(null);
      return;
    }
    if (isAdjacent(selected, index, level.cols)) {
      swap(selected, index);
    } else {
      setSelected(index);
    }
  }

  function onTileDown(index: number, event: React.PointerEvent<HTMLButtonElement>) {
    if (phase !== "playing" || busy || board[index] === SPAM) return;
    event.preventDefault();
    (event.currentTarget as HTMLButtonElement).setPointerCapture(event.pointerId);
    setDragStart(index);
    setDragPoint({ x: event.clientX, y: event.clientY });
  }

  function onTileMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (dragStart === null || !dragPoint || busy) return;
    const rect = hitRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = event.clientX - dragPoint.x;
    const dy = event.clientY - dragPoint.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
    const direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : -1) : (dy > 0 ? level.cols : -level.cols);
    const target = dragStart + direction;
    const nextX = event.clientX;
    const nextY = event.clientY;
    setDragPoint({ x: nextX, y: nextY });
    if (target >= 0 && target < board.length && isAdjacent(dragStart, target, level.cols)) {
      const from = dragStart;
      setDragStart(null);
      setDragPoint(null);
      swap(from, target);
    }
  }

  function onTileUp() {
    setDragStart(null);
    setDragPoint(null);
  }

  const indexStyle = (row: number, col: number) => ({
    gridColumn: `${col + 1} / ${col + 2}`,
    gridRow: `${row + 1} / ${row + 2}`,
  });

  return (
    <section className="overflow-hidden rounded-[2rem] border border-[#CBDDD3] bg-[#F5FBF6] shadow-premium">
      <header className="flex items-center justify-between gap-3 bg-[#113A37] p-4 text-white sm:px-6">
        <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-xs font-bold text-[#CDE1D6] hover:text-white"><ArrowLeft className="h-4 w-4" />{t("arcade.backToArcade")}</button>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#FDE68A]"><Grid3X3 className="h-3.5 w-3.5" />{t("block.eyebrow")}</span>
      </header>

      {phase === "map" ? (
        <div className="p-5 sm:p-7">
          <div className="flex flex-col gap-4 rounded-2xl border border-[#DCE9DE] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#17856E]">{t("block.chooseLevel")}</p>
              <h2 className="mt-1 font-display text-3xl font-black text-[#123E37]">{t("block.title")}</h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#56766B]">{t("block.intro")}</p>
            </div>
            <div className="flex gap-3 sm:flex-col">
              <div className="rounded-2xl bg-[#E8F6ED] px-4 py-3 text-center"><p className="text-[10px] font-bold text-[#4F7C65]">{t("block.starsEarned")}</p><p className="mt-1 font-display text-2xl font-black text-[#19744F]">{starsTotal}</p></div>
              <div className="rounded-2xl bg-[#FFF4D7] px-4 py-3 text-center"><p className="text-[10px] font-bold text-[#8C6B22]">{t("block.unlocked")}</p><p className="mt-1 font-display text-2xl font-black text-[#986A13]">{maxUnlocked}/30</p></div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-6">
            {BLOCK_LEVELS.map((config) => {
              const record = records.find((item) => item.level_number === config.number);
              const locked = config.number > maxUnlocked;
              return (
                <button key={config.number} type="button" disabled={locked} onClick={() => { setLevel(config); if (config.number <= maxUnlocked) startLevel(config); }} className={cn("block-level-button relative min-h-16 rounded-xl border p-2 text-left transition-all", locked ? "border-[#E0E8E3] bg-[#EDF2EE] text-[#8CA69A]" : "border-[#B5D9C6] bg-[#EAF7ED] hover:-translate-y-1 hover:border-[#35A77E] hover:shadow-md")} aria-label={locked ? t("block.lockedLevel", { level: config.number }) : t("block.playLevel", { level: config.number })}>
                  <span className="text-sm font-black">{config.number}</span>
                  {locked ? <LockKeyhole className="absolute right-1.5 top-1.5 h-3.5 w-3.5" /> : record && <span className="absolute right-1 bottom-1 flex gap-0.5">{Array.from({ length: record.best_stars }).map((_, index) => <Star key={index} className="h-2.5 w-2.5 fill-[#F4BB26] text-[#F4BB26]" />)}</span>}
                  {record && <span className="mt-1 block text-[9px] font-bold text-[#4B7C62]">{record.best_score}</span>}
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#4E7565]"><CircleHelp className="h-5 w-5 text-[#218C70]" />{t("block.mapHint")}</div>
            <button type="button" onClick={() => startLevel(BLOCK_LEVELS[0])} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#1AA47C] px-5 text-sm font-extrabold text-white shadow-[0_4px_0_#0F6E4B] hover:bg-[#14885F]"><Play className="h-4 w-4" />{t("block.quickStart")}</button>
          </div>
          <div className="mt-6 rounded-2xl border border-[#D9E9E0] bg-white p-4">
            <div className="flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 font-display text-base font-extrabold text-[#133C33]"><Trophy className="h-5 w-5 text-[#E0A51C]" />{t("block.levelBoard", { level: level.number })}</h3><button type="button" onClick={() => void loadLeaderboard()} className="text-xs font-bold text-[#198567] hover:underline">{t("common.retry")}</button></div>
            {leaderLoading ? <p className="py-5 text-center text-sm text-muted-foreground">{t("common.loading")}</p> : leaderError ? <p className="py-4 text-center text-sm text-rose-700">{t("leaderboard.error")}</p> : leaderboard.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">{t("leaderboard.firstHint")}</p> : (
              <ol className="mt-3 space-y-1">
                {leaderboard.map((entry, index) => <li key={entry.player_number} className="flex items-center justify-between rounded-lg bg-[#F4F9F5] px-3 py-2 text-xs"><span className="flex items-center gap-2 font-semibold text-[#3F6550]">{index === 0 ? <Medal className="h-4 w-4 text-[#E6B529]" /> : <span className="w-4 text-center">{index + 1}</span>}{t("childHeader.learner", { number: entry.player_number })}</span><strong className="text-[#19744F]">{entry.best_score}</strong></li>)}
              </ol>
            )}
          </div>
        </div>
      ) : phase === "playing" ? (
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            <div className="rounded-2xl bg-[#E4F4EA] p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-[#4F7C65]">{t("block.level")}</p><p className="font-display text-xl font-black text-[#19744F]">{level.number}</p></div>
            <div className="rounded-2xl bg-[#E4F4EA] p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-[#4F7C65]">{t("block.movesLeft")}</p><p className="font-display text-xl font-black text-[#19744F]">{moves}</p></div>
            <div className="rounded-2xl bg-[#E4F4EA] p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-[#4F7C65]">{t("block.score")}</p><p className="font-display text-xl font-black text-[#19744F]">{score}</p></div>
            <div className="rounded-2xl bg-[#FFF0C9] p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-[#8C6B22]">{t("block.goals")}</p><p className="font-display text-sm font-black text-[#986A13]">{score >= level.targetScore && spamCleared >= level.targetSpam ? t("block.complete") : `${level.targetScore} + ${level.targetSpam}`}</p></div>
          </div>
          <div className="mt-4 rounded-2xl border border-[#DFE8E3] bg-white p-3 text-sm sm:flex sm:items-center sm:justify-between sm:gap-3">
            <div className="flex items-center gap-2 font-semibold text-[#3D6550]"><ShieldCheck className="h-5 w-5 text-[#1AA47C]" /><span>{t("block.goalLine", { score: level.targetScore, spam: level.targetSpam })}</span></div>
            <span className="mt-2 block text-xs font-bold text-[#875D8A] sm:mt-0">{t("block.nextWave", { moves: level.waveEvery ? (moves % level.waveEvery || level.waveEvery) : 1 })}</span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-[#D59D16]" />{combo > 1 ? t("block.cascade", { count: combo }) : t("block.matchHint")}</span>
            <button type="button" onClick={() => { hintPair(); setTipOpen((value) => !value); }} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-bold text-[#218C70] hover:bg-[#E5F4EA]"><Lightbulb className="h-4 w-4" />{t("block.hint")}</button>
          </div>
          {tipOpen && <div className="mt-2 rounded-xl border border-[#D7E9DC] bg-[#F0FAF1] p-3 text-xs leading-relaxed text-[#37694F]">{t("block.tipText")}</div>}
          <div ref={hitRef} className={cn("block-board mt-3 rounded-[1.5rem] border-4 border-[#795D8A] bg-[#CDB9D5] p-2 sm:p-3", (shake % 2 === 1 || (spamCleared > 0 && shake % 2 === 0)) && "block-board-shake")}>
            <div className="grid gap-1.5 sm:gap-2" style={{ gridTemplateColumns: `repeat(${level.cols}, minmax(0, 1fr))` }}>
              {levelAndTileIndexes(board).map((index) => {
                const value = board[index] ?? SPAM;
                const isSpam = value === SPAM;
                const kind = tileKind(value);
                const special = value >= 10;
                const selectedState = selected === index || hint.includes(index);
                return (
                  <button
                    key={`${index}-${value}`}
                    type="button"
                    disabled={isSpam || busy}
                    onClick={() => tileClick(index)}
                    onPointerDown={(event) => onTileDown(index, event)}
                    onPointerMove={onTileMove}
                    onPointerUp={onTileUp}
                    onPointerCancel={onTileUp}
                    className={cn("block-tile relative flex aspect-square items-center justify-center rounded-lg border-2 text-2xl transition-transform sm:text-3xl", selectedState && "block-tile-selected", isSpam ? "border-[#754756] bg-[#3D2837] text-[#F6B0CD]" : special ? "border-[#FFF2A7] bg-[#FFF8DF]" : "border-white/70 bg-white/95")}
                    aria-label={isSpam ? t("block.spamTile") : special ? t("block.specialTile") : t("block.tile")}
                  >
                    {isSpam ? <MailWarning className="h-6 w-6 sm:h-8 sm:w-8" /> : (
                      <span className="block-tile-shape flex h-[70%] w-[70%] items-center justify-center" style={{ backgroundColor: TILE_COLORS[kind % TILE_COLORS.length], borderRadius: special ? "18%" : TILE_SHAPES[kind % TILE_SHAPES.length] }}>
                        {special && <span className="text-lg text-[#503F30] sm:text-xl">{value >= 30 ? "✦" : value >= 20 ? "↕" : "↔"}</span>}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold text-[#476B58]" aria-live="polite">{lastAction || t("block.selectSwap")}</p>
            <button type="button" onClick={() => { setPhase("map"); setBoard([]); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#C9DCD2] bg-white px-4 text-xs font-extrabold text-[#25634B]"><ArrowLeft className="h-4 w-4" />{t("block.changeLevel")}</button>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center sm:p-9">
          <span className={cn("mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem]", phase === "won" ? "bg-[#FFF0B9] text-[#936B08]" : "bg-[#FFE4E9] text-[#B43C61]")}><Trophy className="h-10 w-10" /></span>
          <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#218C70]">{phase === "won" ? t("block.waveCleared") : t("block.boardFull")}</p>
          <h2 className="mt-2 font-display text-3xl font-black text-[#123E37]">{phase === "won" ? t("block.victoryTitle") : t("block.tryAgain")}</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[#5B7765]">{phase === "won" ? t("block.victoryBody") : t("block.defeatBody")}</p>
          <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#E4F4EA] p-4"><Star className="mx-auto h-5 w-5 text-[#E4B321]" /><p className="mt-1 font-display text-3xl font-black text-[#19744F]">{score}</p><p className="text-[10px] font-bold text-[#4F7C65]">{t("block.score")}</p></div>
            <div className="rounded-2xl bg-[#FFF0C9] p-4"><Zap className="mx-auto h-5 w-5 text-[#986A13]" /><p className="mt-1 font-display text-3xl font-black text-[#986A13]">{phase === "won" ? stars : 0}/3</p><p className="text-[10px] font-bold text-[#8C6B22]">{t("block.starsEarned")}</p></div>
          </div>
          {saveStatus === "saving" && <p className="mt-5 flex items-center justify-center gap-2 text-sm font-bold text-[#397453]"><LoaderCircle className="h-4 w-4 animate-spin" />{t("progress.saving")}</p>}
          {saveStatus === "saved" && result && <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-900"><p className="flex items-center justify-center gap-2"><Check className="h-4 w-4" />{t("progress.saved")}</p><CoinReward earned={result.coinsEarned} total={result.coins} /></div>}
          {saveStatus === "error" && <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-800"><p>{t("progress.error")}</p><button type="button" onClick={finishWin} className="mt-2 rounded-lg bg-rose-700 px-4 py-2 text-xs font-bold text-white">{t("common.retry")}</button></div>}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button type="button" onClick={() => { setBoard(createLevelBoard(level)); setMoves(level.moves); setScore(0); setSpamCleared(0); setCombo(0); setStars(0); setResult(null); setSaveStatus("idle"); setLastAction(""); startedAtRef.current = Date.now(); activityRef.current = crypto.randomUUID(); setPhase("playing"); }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#1AA47C] px-5 text-sm font-extrabold text-white"><RefreshCw className="h-4 w-4" />{t("block.playAgain")}</button>
            <button type="button" onClick={() => { setPhase("map"); void loadProgress(); }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#C9DCD2] bg-white px-5 text-sm font-extrabold text-[#25634B]">{t("block.levelMap")}<ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {tutorialOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#061920]/80 p-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F6ED] text-[#19744F]"><Grid3X3 className="h-7 w-7" /></span>
            <h2 className="mt-4 font-display text-2xl font-black text-[#123E37]">{t("block.howToPlay")}</h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#496C55]">
              <p className="flex gap-3"><span className="font-black text-[#1AA47C]">1.</span>{t("block.tutorial1")}</p>
              <p className="flex gap-3"><span className="font-black text-[#1AA47C]">2.</span>{t("block.tutorial2")}</p>
              <p className="flex gap-3"><span className="font-black text-[#1AA47C]">3.</span>{t("block.tutorial3")}</p>
              <p className="flex gap-3"><span className="font-black text-[#1AA47C]">4.</span>{t("block.tutorial4")}</p>
            </div>
            <button type="button" onClick={closeTutorial} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1AA47C] px-5 text-sm font-extrabold text-white">{t("block.gotIt")}<Check className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </section>
  );
}
