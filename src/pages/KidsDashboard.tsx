import { useCallback, useEffect, useState } from "react";
import {
  Award,
  Baby,
  Check,
  ChevronRight,
  Crown,
  Lightbulb,
  Link2,
  LoaderCircle,
  MessageSquareWarning,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { Link } from "react-router-dom";
import { AppButton } from "@/components/ui/app-button";
import { cn } from "@/lib/utils";
import { KidLocationTracker } from "@/components/KidLocationTracker";
import { SliceTheScamGame } from "@/components/SliceTheScamGame";
import "./KidsDashboard.css";

function KidsMascot() {
  return (
    <div className="kids-mascot-wrap" aria-hidden="true">
      <svg className="kids-mascot" viewBox="0 0 200 128" fill="none">
        <path d="M27 17L33 29L45 31L36 40L38 53L27 47L16 53L18 40L9 31L21 29L27 17Z" fill="#F7C600" />
        <circle cx="164" cy="24" r="8" fill="#7DD3FC" />
        <circle cx="69" cy="49" r="19" fill="#F5B942" />
        <circle cx="131" cy="49" r="19" fill="#F5B942" />
        <rect x="55" y="36" width="90" height="76" rx="29" fill="#FFBF47" />
        <rect x="61" y="43" width="78" height="57" rx="26" fill="#FFD98A" />
        <circle cx="87" cy="67" r="5" fill="#152A3C" />
        <circle cx="113" cy="67" r="5" fill="#152A3C" />
        <circle cx="85" cy="65" r="1.5" fill="white" />
        <circle cx="111" cy="65" r="1.5" fill="white" />
        <ellipse cx="100" cy="80" rx="9" ry="6" fill="#FFFDF7" />
        <path d="M91 87Q100 98 109 87" stroke="#152A3C" strokeWidth="3" strokeLinecap="round" />
        <circle cx="78" cy="80" r="6" fill="#F8988F" />
        <circle cx="122" cy="80" r="6" fill="#F8988F" />
        <path d="M100 46L109 57H124V70C124 81 114 91 100 97C86 91 76 81 76 70V57H91L100 46Z" fill="#0E7A4D" />
        <path d="M100 58L104 65L112 67L106 73L107 81L100 78L93 81L94 73L88 67L96 65L100 58Z" fill="white" />
        <path d="M47 108L39 117M153 108L161 117" stroke="#0D2B45" strokeWidth="5" strokeLinecap="round" />
        <path d="M170 77L175 87L186 89L178 97L180 109L170 103L160 109L162 97L154 89L165 87L170 77Z" fill="#F7C600" />
      </svg>
    </div>
  );
}

type GameId = "message" | "link" | "guardian";
type Answer = { text: string; correct: boolean; explanation: string };
type Scenario = {
  id: GameId;
  titleKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  promptKey: string;
  answers: Answer[];
};
type Result = { user_id: string; player_number: number; score: number; games_played: number };

const SCENARIOS: Scenario[] = [
  {
    id: "message",
    titleKey: "kids.game.message.title",
    descriptionKey: "kids.game.message.description",
    icon: MessageSquareWarning,
    promptKey: "kids.game.message.prompt",
    answers: [
      { text: "kids.answer.scam", correct: true, explanation: "kids.game.message.explanation" },
      { text: "kids.answer.safe", correct: false, explanation: "kids.game.message.explanation" },
    ],
  },
  {
    id: "link",
    titleKey: "kids.game.link.title",
    descriptionKey: "kids.game.link.description",
    icon: Link2,
    promptKey: "kids.game.link.prompt",
    answers: [
      { text: "https://accounts.example.com.unlock-prize.example.net", correct: true, explanation: "kids.game.link.explanation" },
      { text: "https://accounts.example.com/login", correct: false, explanation: "kids.game.link.explanation" },
    ],
  },
  {
    id: "guardian",
    titleKey: "kids.game.guardian.title",
    descriptionKey: "kids.game.guardian.description",
    icon: UserRound,
    promptKey: "kids.game.guardian.prompt",
    answers: [
      { text: "kids.answer.tellGuardian", correct: true, explanation: "kids.game.guardian.explanation" },
      { text: "kids.answer.shareCode", correct: false, explanation: "kids.game.guardian.explanation" },
    ],
  },
];

const KEY_PREFIX = "mausafe.kids.completed";

export default function KidsDashboard() {
  const { t } = useI18n();
  const { user, profile } = useAuth();
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [report, setReport] = useState<{ correct: boolean; added: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [myRecord, setMyRecord] = useState<Result | null>(null);
  const [completed, setCompleted] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`${KEY_PREFIX}.${user?.id}`) ?? "[]");
    } catch {
      return [];
    }
  });
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const isChild = profile?.account_type === "child";

  const loadLeaderboard = useCallback(async () => {
    if (!isChild || !user) return;
    const [leaderboard, own] = await Promise.all([
      supabase
        .from("kid_game_results")
        .select("user_id,player_number,score,games_played")
        .order("score", { ascending: false })
        .order("games_played", { ascending: true })
        .limit(6),
      supabase.from("kid_game_results").select("user_id,player_number,score,games_played").eq("user_id", user.id).maybeSingle(),
    ]);
    setResults((leaderboard.data ?? []) as Result[]);
    setMyRecord((own.data ?? null) as Result | null);
    setUpdatedAt(new Date());
  }, [isChild, user]);

  useEffect(() => { void loadLeaderboard(); }, [loadLeaderboard]);

  function chooseGame(id: GameId) {
    setActiveGame(id);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setReport(null);
  }

  function chooseAnswer(index: number) {
    if (showExplanation) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
  }

  async function finish(scenario: Scenario) {
    if (selectedAnswer === null || !user) return;
    const correct = scenario.answers[selectedAnswer].correct;
    const alreadyCompleted = completed.includes(scenario.id);
    const points = !alreadyCompleted && (correct ? 10 : 0);

    setSubmitting(true);
    try {
      const { error } = await supabase.from("kid_game_results").upsert({
        user_id: user.id,
        score: (myRecord?.score ?? 0) + points,
        games_played: (myRecord?.games_played ?? 0) + 1,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id", ignoreDuplicates: false });
      if (error) throw error;

      const next = alreadyCompleted ? completed : [...completed, scenario.id];
      setCompleted(next);
      localStorage.setItem(`${KEY_PREFIX}.${user.id}`, JSON.stringify(next));
      setReport({ correct, added: !alreadyCompleted });
      await loadLeaderboard();
    } catch {
      setReport({ correct, added: false });
    } finally {
      setSubmitting(false);
    }
  }

  if (!isChild) {
    return (
      <section className="mx-auto max-w-xl rounded-[1.75rem] border border-[#DDE6ED] bg-card p-7 text-center shadow-premium">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
          <Baby className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold text-foreground">{t("kids.childOnlyTitle")}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{t("kids.childOnlyBody")}</p>
        <Link to="/settings" className="mt-6 inline-flex">
          <AppButton size="lg">{t("kids.openSettings")}<ChevronRight className="h-4 w-4" aria-hidden="true" /></AppButton>
        </Link>
      </section>
    );
  }

  const scenario = activeGame ? SCENARIOS.find((item) => item.id === activeGame) : null;
  const myScore = myRecord?.score ?? 0;
  const level = myScore >= 20 ? "kids.levelHero" : myScore >= 10 ? "kids.levelHelper" : "kids.levelExplorer";

  return (
    <div className="kids-page mx-auto max-w-2xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">{/* Fun, responsive child dashboard */}
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {t("kids.mode")}
          </p>
          <h1 className="mt-3 font-display text-2xl font-extrabold text-foreground">{t("kids.title")}</h1>
          <p className="mt-1 max-w-lg text-sm leading-relaxed text-muted-foreground">{t("kids.subtitle")}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-right">
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-amber-800">{t("kids.stars")}</span>
          <p className="font-display text-2xl font-extrabold text-amber-950">{myScore}</p>
        </div>
      </header>
      <KidsMascot />

      <KidLocationTracker />

      <SliceTheScamGame />

      {scenario ? (
        <section className="space-y-5 rounded-[1.75rem] border border-[#DDE6ED] bg-card p-5 shadow-premium sm:p-7">
          <button type="button" onClick={() => setActiveGame(null)} className="text-xs font-bold text-primary hover:underline">{t("kids.backGames")}</button>
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><scenario.icon className="h-5 w-5" aria-hidden="true" /></span>
            <div>
              <h2 className="font-display text-xl font-extrabold text-foreground">{t(scenario.titleKey)}</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(scenario.descriptionKey)}</p>
            </div>
          </div>
          <p className="rounded-2xl bg-[#F4F8FB] p-4 text-base font-bold leading-relaxed text-foreground">{t(scenario.promptKey)}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            {scenario.answers.map((answer, index) => {
              const selected = selectedAnswer === index;
              return (
                <button
                  key={answer.text}
                  type="button"
                  disabled={showExplanation}
                  onClick={() => chooseAnswer(index)}
                  className={cn(
                    "flex min-h-16 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-center text-sm font-extrabold transition-all",
                    selected
                      ? answer.correct
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                        : "border-rose-500 bg-rose-50 text-rose-900"
                      : "border-input bg-white text-foreground hover:border-primary/40 hover:bg-secondary",
                  )}
                >
                  {selected && <Check className="h-4 w-4" aria-hidden="true" />}
                  <span className="break-all">{["scam", "safe"].includes(answer.text) ? t(answer.text) : answer.text}</span>
                </button>
              );
            })}
          </div>

          {showExplanation && selectedAnswer !== null && (
            <div className={cn("flex items-start gap-3 rounded-2xl border p-4 text-sm leading-relaxed", scenario.answers[selectedAnswer].correct ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900")}>
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-extrabold">{scenario.answers[selectedAnswer].correct ? t("kids.correct") : t("kids.notQuite")}</p>
                <p className="mt-1">{t(scenario.answers[selectedAnswer].explanation)}</p>
              </div>
            </div>
          )}

          {report && (
            <p role="status" className="rounded-xl bg-secondary px-4 py-3 text-sm font-bold text-primary">
              {report.added ? t("kids.pointsEarned") : t("kids.completedBefore")}
            </p>
          )}

          {!report ? (
            <AppButton size="xl" disabled={!showExplanation || submitting} onClick={() => finish(scenario)}>
              {submitting && <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />}
              {submitting ? t("kids.saving") : t("kids.finish")}
            </AppButton>
          ) : (
            <AppButton size="xl" variant="outline" onClick={() => setActiveGame(null)}>{t("kids.backGames")}</AppButton>
          )}
        </section>
      ) : (
        <section className="space-y-3">
          {SCENARIOS.map((game) => {
            const played = completed.includes(game.id);
            return (
              <button
                key={game.id}
                type="button"
                onClick={() => chooseGame(game.id)}
                className="group flex w-full items-start gap-4 rounded-2xl border border-[#DDE6ED] bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-premium"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary"><game.icon className="h-6 w-6" aria-hidden="true" /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <strong className="font-display text-base font-extrabold text-foreground">{t(game.titleKey)}</strong>
                    {played && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">{t("kids.completed")}</span>}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{t(game.descriptionKey)}</span>
                </span>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            );
          })}
        </section>
      )}

      <section className="rounded-[1.75rem] border border-[#DDE6ED] bg-card p-5 shadow-premium sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-foreground">
            <Crown className="h-5 w-5 text-amber-600" aria-hidden="true" />
            {t("kids.leaderboard")}
          </h2>
          <button type="button" onClick={() => void loadLeaderboard()} className="rounded-lg px-2 text-xs font-bold text-primary hover:underline">{t("kids.refreshLeaderboard")}</button>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("kids.privacyLeaderboard")}</p>
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-secondary/70 p-4">
          <Award className="h-7 w-7 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm font-extrabold text-foreground">{t(level)}</p>
            <p className="text-xs text-muted-foreground">{t("kids.levelHint")}</p>
          </div>
        </div>
        <ol className="mt-4 space-y-2">
          {results.length === 0 && <li className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">{t("kids.noRanks")}</li>}
          {results.map((entry, index) => {
            const mine = entry.user_id === user?.id;
            return (
              <li key={entry.user_id} className={cn("flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5", mine ? "border-primary/30 bg-secondary text-primary" : "border-border bg-white")}>
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-extrabold">{index + 1}</span>
                  {mine ? t("kids.you") : t("kids.learner", { number: entry.player_number })}
                </span>
                <span className="text-xs font-extrabold">{entry.score} {t("kids.points")}</span>
              </li>
            );
          })}
        </ol>
        {updatedAt && <p className="mt-3 text-right text-[11px] text-muted-foreground">{t("kids.updatedTime")}</p>}
      </section>

      <div role="note" className="flex items-start gap-2.5 rounded-2xl border border-[#DCE7ED] bg-[#F4F8FB] p-4 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span>{t("kids.trainingNote")}</span>
      </div>
    </div>
  );
}
