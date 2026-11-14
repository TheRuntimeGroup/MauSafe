import { supabase } from "@/integrations/supabase/client";

export type GameLevel = "beginner" | "skilled" | "expert";
export type ActivityGameId = "fruit" | "whack" | "detective" | "lesson_urgency" | "lesson_links" | "lesson_codes" | "lesson_help";
export type CompetitiveGameId = "fruit" | "whack" | "detective";
export type CompetitiveMode = "classic" | "zen" | "patrol" | "whack" | "challenge";

export interface KidScore {
  user_id: string;
  player_number: number;
  score: number;
  coins: number;
  games_played: number;
  updated_at: string;
}

export interface KidActivity {
  id: string;
  activity_id: string;
  user_id: string;
  game_id: ActivityGameId;
  mode: string;
  level: GameLevel;
  score: number;
  duration_seconds: number;
  created_at: string;
}

export interface KidAchievement {
  user_id: string;
  achievement_id: AchievementId;
  unlocked_at: string;
}

export type AchievementId =
  | "first_activity"
  | "fruit_fan"
  | "fraud_buster"
  | "scam_spotter"
  | "quick_learner"
  | "wise_detective"
  | "knowledge_champion"
  | "expert_ready"
  | "practice_progress";

export const ACHIEVEMENT_IDS: AchievementId[] = [
  "first_activity",
  "fruit_fan",
  "fraud_buster",
  "scam_spotter",
  "quick_learner",
  "wise_detective",
  "knowledge_champion",
  "expert_ready",
  "practice_progress",
];

const ACHIEVEMENT_TARGETS: Record<AchievementId, number> = {
  first_activity: 1,
  fruit_fan: 3,
  fraud_buster: 3,
  scam_spotter: 15,
  quick_learner: 2,
  wise_detective: 3,
  knowledge_champion: 4,
  expert_ready: 1,
  practice_progress: 5,
};

export function achievementProgress(id: AchievementId, activities: KidActivity[]) {
  const current = id === "fruit_fan" ? activities.filter((item) => item.game_id === "fruit").length
    : id === "fraud_buster" ? activities.filter((item) => item.game_id === "whack").length
    : id === "scam_spotter" ? activities.filter((item) => item.game_id === "fruit" && item.mode === "patrol").reduce((sum, item) => sum + item.score, 0)
    : id === "quick_learner" || id === "knowledge_champion" ? activities.filter((item) => item.game_id.startsWith("lesson_")).length
    : id === "wise_detective" ? activities.filter((item) => item.game_id === "detective").length
    : id === "expert_ready" ? activities.filter((item) => item.level === "expert").length
    : activities.length;
  return { current: Math.min(current, ACHIEVEMENT_TARGETS[id]), target: ACHIEVEMENT_TARGETS[id] };
}

export interface ActivityInput {
  activityId: string;
  gameId: ActivityGameId;
  mode: "classic" | "zen" | "patrol" | "challenge" | "whack" | "lesson";
  level: GameLevel;
  score: number;
  durationSeconds: number;
}

export interface RecordResult {
  score: number;
  coins: number;
  gamesPlayed: number;
  pointsAdded: number;
  coinsEarned: number;
  newAchievements: AchievementId[];
}

export async function recordKidGameActivity(input: ActivityInput): Promise<RecordResult> {
  const { data, error } = await supabase.rpc("record_kid_game_activity", {
    p_activity_id: input.activityId,
    p_game_id: input.gameId,
    p_mode: input.mode,
    p_level: input.level,
    p_score: Math.max(0, Math.min(500, Math.round(input.score))),
    p_duration_seconds: Math.max(0, Math.min(3600, Math.round(input.durationSeconds))),
  });
  if (error || !data || typeof data.score !== "number") throw new Error("progress_unavailable");
  return {
    score: data.score,
    coins: typeof data.coins === "number" ? data.coins : 0,
    gamesPlayed: typeof data.gamesPlayed === "number" ? data.gamesPlayed : 0,
    pointsAdded: typeof data.pointsAdded === "number" ? data.pointsAdded : 0,
    coinsEarned: typeof data.coinsEarned === "number" ? data.coinsEarned : 0,
    newAchievements: Array.isArray(data.newAchievements) ? data.newAchievements as AchievementId[] : [],
  };
}

export interface KidProgress {
  score: KidScore | null;
  activities: KidActivity[];
  achievements: KidAchievement[];
  rank: number;
}

export async function loadKidProgress(userId: string): Promise<KidProgress> {
  const [scoreResult, activityResult, achievementResult] = await Promise.all([
    supabase.from("kid_game_results").select("user_id,player_number,score,coins,games_played,updated_at").eq("user_id", userId).maybeSingle(),
    supabase.from("kid_game_sessions").select("id,activity_id,user_id,game_id,mode,level,score,duration_seconds,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
    supabase.from("kid_achievements").select("user_id,achievement_id,unlocked_at").eq("user_id", userId),
  ]);
  if (scoreResult.error) throw scoreResult.error;
  if (activityResult.error) throw activityResult.error;
  if (achievementResult.error) throw achievementResult.error;
  const score = scoreResult.data as KidScore | null;
  const rankResult = await supabase.from("kid_game_results").select("user_id", { count: "exact", head: true }).gt("score", score?.score ?? 0);
  if (rankResult.error) throw rankResult.error;
  return {
    score,
    activities: (activityResult.data ?? []) as KidActivity[],
    achievements: (achievementResult.data ?? []) as KidAchievement[],
    rank: (rankResult.count ?? 0) + 1,
  };
}

export interface LeaderboardEntry {
  player_number: number;
  best_score: number;
  plays: number;
  updated_at: string;
}

export interface GameLeaderboardData {
  entries: LeaderboardEntry[];
  rank: number | null;
  ownBest: number | null;
  ownPlays: number;
  ownPlayerNumber: number | null;
}

export async function loadGameLeaderboard(
  gameId: CompetitiveGameId,
  mode: CompetitiveMode,
  level: GameLevel,
  userId: string,
): Promise<GameLeaderboardData> {
  const [leaders, own] = await Promise.all([
    supabase.from("kid_game_leaderboard")
      .select("player_number,best_score,plays,updated_at")
      .eq("game_id", gameId).eq("mode", mode).eq("level", level)
      .order("best_score", { ascending: false }).order("updated_at", { ascending: true }).limit(5),
    supabase.from("kid_game_leaderboard")
      .select("player_number,best_score,plays,updated_at")
      .eq("user_id", userId).eq("game_id", gameId).eq("mode", mode).eq("level", level).maybeSingle(),
  ]);
  if (leaders.error) throw leaders.error;
  if (own.error) throw own.error;
  const ownEntry = own.data as LeaderboardEntry | null;
  let rank: number | null = null;
  if (ownEntry) {
    const rankedAbove = await supabase.from("kid_game_leaderboard")
      .select("user_id", { count: "exact", head: true })
      .eq("game_id", gameId).eq("mode", mode).eq("level", level).gt("best_score", ownEntry.best_score);
    if (rankedAbove.error) throw rankedAbove.error;
    rank = (rankedAbove.count ?? 0) + 1;
  }
  return {
    entries: (leaders.data ?? []) as LeaderboardEntry[],
    rank,
    ownBest: ownEntry?.best_score ?? null,
    ownPlays: ownEntry?.plays ?? 0,
    ownPlayerNumber: ownEntry?.player_number ?? null,
  };
}

export interface GlobalLeaderboardData {
  entries: KidScore[];
  own: KidScore | null;
  rank: number | null;
}

export async function loadGlobalLeaderboard(userId: string): Promise<GlobalLeaderboardData> {
  const columns = "user_id,player_number,score,coins,games_played,updated_at";
  const [leaders, own] = await Promise.all([
    supabase.from("kid_game_results").select(columns).order("score", { ascending: false }).order("updated_at", { ascending: true }).limit(10),
    supabase.from("kid_game_results").select(columns).eq("user_id", userId).maybeSingle(),
  ]);
  if (leaders.error) throw leaders.error;
  if (own.error) throw own.error;
  const ownScore = own.data as KidScore | null;
  let rank: number | null = null;
  if (ownScore && ownScore.games_played > 0) {
    const above = await supabase.from("kid_game_results").select("user_id", { count: "exact", head: true }).gt("score", ownScore.score);
    if (above.error) throw above.error;
    rank = (above.count ?? 0) + 1;
  }
  return {
    entries: (leaders.data ?? []) as KidScore[],
    own: ownScore,
    rank,
  };
}
