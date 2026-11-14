import { useCallback, useEffect, useState } from "react";
import { Coins, LoaderCircle, Medal, RefreshCw, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import {
  loadGameLeaderboard,
  type CompetitiveGameId,
  type CompetitiveMode,
  type GameLeaderboardData,
  type GameLevel,
} from "@/lib/kidProgress";
import { cn } from "@/lib/utils";

export function GameLeaderboard({
  gameId,
  mode,
  level,
  refreshKey = 0,
  dark = false,
  compact = false,
}: {
  gameId: CompetitiveGameId;
  mode: CompetitiveMode;
  level: GameLevel;
  refreshKey?: number;
  dark?: boolean;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [data, setData] = useState<GameLeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(false);
    try {
      setData(await loadGameLeaderboard(gameId, mode, level, user.id));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [gameId, mode, level, user]);

  useEffect(() => { void load(); }, [load, refreshKey]);

  const entries = data?.entries.slice(0, compact ? 3 : 5) ?? [];
  const ownInTop = data !== null && entries.some((entry) => entry.player_number === data.ownPlayerNumber);
  return (
    <section className={cn("rounded-2xl border p-4", dark ? "border-white/15 bg-[#123B3C] text-white" : "border-[#DDE5E1] bg-[#F7FAF8] text-foreground")} aria-label={t("leaderboard.title")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", dark ? "bg-[#F9C74F] text-[#3D2D06]" : "bg-amber-100 text-amber-700")}><Trophy className="h-4 w-4" /></span>
          <div>
            <h3 className="font-display text-sm font-extrabold">{t("leaderboard.title")}</h3>
            <p className={cn("mt-0.5 text-[10px] font-semibold", dark ? "text-[#B8D4CC]" : "text-muted-foreground")}>{t(`level.${level}.title`)} · {t("leaderboard.bestScore")}</p>
          </div>
        </div>
        <button type="button" onClick={() => void load()} className={cn("flex h-9 w-9 items-center justify-center rounded-xl", dark ? "text-white hover:bg-white/10" : "text-emerald-800 hover:bg-emerald-100")} aria-label={t("leaderboard.refresh")}><RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /></button>
      </div>

      {loading && !data ? (
        <p className={cn("flex items-center justify-center gap-2 py-5 text-xs font-bold", dark ? "text-[#C5DDD8]" : "text-muted-foreground")} role="status"><LoaderCircle className="h-4 w-4 animate-spin" />{t("common.loading")}</p>
      ) : error ? (
        <div className="mt-3 text-center"><p className={cn("text-xs font-bold", dark ? "text-[#FFD3DB]" : "text-rose-800")}>{t("leaderboard.error")}</p><button type="button" onClick={() => void load()} className={cn("mt-2 min-h-9 rounded-lg px-3 text-xs font-bold underline", dark ? "text-white" : "text-rose-900")}>{t("common.retry")}</button></div>
      ) : entries.length === 0 ? (
        <div className={cn("mt-3 rounded-xl border border-dashed p-4 text-center", dark ? "border-white/15 bg-[#0D3035]" : "border-[#CADAD3] bg-white")}>
          <p className="text-xs font-extrabold">{t("leaderboard.firstTitle")}</p>
          <p className={cn("mt-1 text-[11px] leading-relaxed", dark ? "text-[#B8D4CC]" : "text-muted-foreground")}>{t("leaderboard.firstHint")}</p>
        </div>
      ) : (
        <ol className="mt-3 space-y-1.5">
          {entries.map((entry, index) => {
            const mine = entry.player_number === data?.ownPlayerNumber;
            return (
              <li key={entry.player_number} className={cn("flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs", mine ? (dark ? "bg-[#315143] text-[#FFEBA7]" : "bg-[#E0F2E8] text-emerald-950") : (dark ? "bg-[#0E3035]" : "bg-white"))}>
                <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black", index === 0 ? "bg-amber-300 text-amber-950" : dark ? "bg-white/10 text-white" : "bg-[#E5EDEA] text-[#4B675D]")}>{index === 0 ? <Medal className="h-3.5 w-3.5" /> : index + 1}</span>
                <span className="min-w-0 flex-1 truncate font-bold">{mine ? t("leaderboard.you") : t("leaderboard.learner", { number: entry.player_number })}</span>
                <span className="font-display text-sm font-black tabular-nums">{entry.best_score}</span>
              </li>
            );
          })}
        </ol>
      )}

      {!error && data && !ownInTop && data.ownBest !== null && (
        <div className={cn("mt-2 flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold", dark ? "bg-[#315143] text-[#FFEBA7]" : "bg-[#E0F2E8] text-emerald-950")}><span>{t("leaderboard.yourRank", { rank: data.rank ?? 0 })}</span><span className="font-display font-black tabular-nums">{data.ownBest}</span></div>
      )}
      {data && <p className={cn("mt-2.5 flex items-center justify-between gap-2 text-[10px] font-semibold", dark ? "text-[#A8C7BD]" : "text-muted-foreground")}><span>{t("leaderboard.yourBest", { score: data.ownBest ?? 0 })}</span><span>{t("leaderboard.plays", { count: data.ownPlays })}</span></p>}
    </section>
  );
}

export function CoinReward({ earned, total, dark = false }: { earned: number; total: number; dark?: boolean }) {
  const { t } = useI18n();
  return (
    <div className={cn("mt-3 flex items-center justify-between gap-3 rounded-xl border p-3 text-xs font-bold", dark ? "border-[#F9C74F]/25 bg-[#35421E] text-[#FDE68A]" : "border-amber-200 bg-amber-50 text-amber-900")} role="status">
      <span className="flex items-center gap-2"><Coins className="h-4 w-4" />{t("coins.earned", { count: earned })}</span>
      <span>{t("coins.wallet", { count: total })}</span>
    </div>
  );
}
