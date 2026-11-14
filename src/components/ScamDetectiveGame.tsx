import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  ChevronRight,
  CircleAlert,
  Link2,
  LoaderCircle,
  MessageSquareText,
  PhoneCall,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  ThumbsUp,
  Trophy,
  X,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { LevelPicker } from "@/components/LevelPicker";
import { recordKidGameActivity, type ActivityInput, type GameLevel } from "@/lib/kidProgress";
import { cn } from "@/lib/utils";

type Scenario = {
  id: number;
  icon: "message" | "link" | "phone";
  answers: [boolean, boolean];
};

const SCENARIOS: Scenario[] = [
  { id: 1, icon: "message", answers: [true, false] },
  { id: 2, icon: "phone", answers: [true, false] },
  { id: 3, icon: "message", answers: [false, true] },
  { id: 4, icon: "message", answers: [false, true] },
  { id: 5, icon: "message", answers: [true, false] },
  { id: 6, icon: "link", answers: [true, false] },
  { id: 7, icon: "message", answers: [false, true] },
  { id: 8, icon: "phone", answers: [true, false] },
];

const LEVEL_QUESTIONS: Record<GameLevel, number> = { beginner: 2, skilled: 4, expert: 6 };
const LEVEL_POINTS: Record<GameLevel, number> = { beginner: 10, skilled: 15, expert: 20 };
type SaveStatus = "idle" | "saving" | "saved" | "error";

export function ScamDetectiveGame({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const [level, setLevel] = useState<GameLevel>("beginner");
  const [questions, setQuestions] = useState<Scenario[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [totalPoints, setTotalPoints] = useState(0);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const startedAtRef = useRef(0);
  const activityIdRef = useRef<string | null>(null);
  const resultRef = useRef<ActivityInput | null>(null);

  function startGame() {
    const shuffled = [...SCENARIOS];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
    }
    setQuestions(shuffled.slice(0, LEVEL_QUESTIONS[level]));
    setQuestionIndex(0);
    setSelected(null);
    setCorrectCount(0);
    setCompleted(false);
    setSaveStatus("idle");
    setTotalPoints(0);
    setNewAchievements([]);
    startedAtRef.current = Date.now();
    activityIdRef.current = null;
    resultRef.current = null;
  }

  async function saveResult() {
    const result = resultRef.current;
    if (!result) return;
    setSaveStatus("saving");
    try {
      const saved = await recordKidGameActivity(result);
      if (resultRef.current?.activityId !== result.activityId) return;
      setTotalPoints(saved.score);
      setNewAchievements(saved.newAchievements);
      setSaveStatus("saved");
    } catch {
      if (resultRef.current?.activityId === result.activityId) setSaveStatus("error");
    }
  }

  function nextQuestion() {
    if (selected === null) return;
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((index) => index + 1);
      setSelected(null);
      return;
    }
    const score = correctCount * LEVEL_POINTS[level];
    const activityId = crypto.randomUUID();
    activityIdRef.current = activityId;
    resultRef.current = {
      activityId,
      gameId: "detective",
      mode: "challenge",
      level,
      score,
      durationSeconds: Math.round((Date.now() - startedAtRef.current) / 1000),
    };
    setCompleted(true);
    void saveResult();
  }

  const scenario = questions[questionIndex];
  const playing = questions.length > 0 && !completed;
  const ScenarioIcon = scenario?.icon === "link" ? Link2 : scenario?.icon === "phone" ? PhoneCall : MessageSquareText;
  const correct = selected !== null && scenario?.answers[selected as 0 | 1];
  const roundScore = correctCount * LEVEL_POINTS[level];

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-[#D9E8E3] bg-white shadow-premium">
      <div className="flex items-center justify-between gap-3 bg-[#0D343C] p-5 text-white sm:px-6">
        <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-xs font-bold text-[#C5DDD8] hover:text-white"><ArrowLeft className="h-4 w-4" />{t("arcade.backToArcade")}</button>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#DDF8EB] text-emerald-800"><Target className="h-5 w-5" /></span>
      </div>
      <div className="p-5 sm:p-7">
        {playing ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-700"><Target className="h-4 w-4" />{t("detective.questionProgress", { current: questionIndex + 1, total: questions.length })}</div>
              <p className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-extrabold text-amber-800">{t("kids.pointsWon", { points: roundScore })}</p>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#E5EFEB]"><div className="h-full rounded-full bg-emerald-600 transition-[width]" style={{ width: `${(questionIndex + 1) / questions.length * 100}%` }} /></div>
            <div className="mt-6 flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E6F5F0] text-emerald-700"><ScenarioIcon className="h-5 w-5" /></span>
              <div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-700">{t(`detective.type.${scenario.icon}`)}</p><h2 className="mt-1 font-display text-lg font-extrabold leading-snug text-foreground">{t("detective.chooseSafest")}</h2></div>
            </div>
            <p className="mt-4 rounded-2xl border border-[#DBE6E2] bg-[#F5F8F7] p-4 text-sm font-semibold leading-relaxed text-foreground">{t(`detective.q${scenario.id}.prompt`)}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[0, 1].map((index) => {
                const isChosen = selected === index;
                return (
                  <button
                    key={index}
                    type="button"
                    disabled={selected !== null}
                    onClick={() => {
                      if (selected !== null) return;
                      setSelected(index);
                      if (scenario.answers[index]) setCorrectCount((count) => count + 1);
                    }}
                    className={cn(
                      "flex min-h-20 items-center justify-center gap-2 rounded-2xl border p-4 text-center text-sm font-bold leading-relaxed transition-colors",
                      isChosen ? (scenario.answers[index] ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-rose-500 bg-rose-50 text-rose-900") : "border-[#CFDFD9] bg-white hover:border-emerald-500 hover:bg-[#F0F8F5] disabled:text-muted-foreground",
                    )}
                  >
                    {isChosen && (scenario.answers[index] ? <Check className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" />)}
                    <span>{t(`detective.q${scenario.id}.answer${index + 1}`)}</span>
                  </button>
                );
              })}
            </div>
            {selected !== null && (
              <div className={cn("mt-5 rounded-2xl border p-4", correct ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50")} role="status">
                <p className={cn("flex items-center gap-2 text-sm font-extrabold", correct ? "text-emerald-900" : "text-amber-900")}>{correct ? <ThumbsUp className="h-5 w-5" /> : <BookOpenCheck className="h-5 w-5" />}{correct ? t("detective.correct") : t("detective.keepLearning")}</p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">{t(`detective.q${scenario.id}.explanation`)}</p>
                <p className="mt-3 flex items-start gap-2 rounded-xl bg-white/70 p-3 text-xs font-semibold leading-relaxed text-[#285B4C]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />{t(`detective.q${scenario.id}.tip`)}</p>
                <button type="button" onClick={nextQuestion} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0E7A63] px-5 text-sm font-extrabold text-white hover:bg-[#09604E]">{questionIndex === questions.length - 1 ? t("detective.seeResults") : t("detective.nextQuestion")}<ArrowRight className="h-4 w-4" /></button>
              </div>
            )}
          </>
        ) : completed ? (
          <div className="text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF2BE] text-amber-700"><Trophy className="h-8 w-8" /></span>
            <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-700">{t("detective.caseClosed")}</p>
            <h2 className="mt-2 font-display text-2xl font-black text-foreground">{t("detective.resultTitle")}</h2>
            <p className="mt-3 text-sm font-semibold text-muted-foreground">{t("detective.resultCorrect", { correct: correctCount, total: questions.length })}</p>
            <p className="mt-4 font-display text-6xl font-black tabular-nums text-emerald-700">{roundScore}</p>
            <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">{t("kids.learningPoints")}</p>
            {saveStatus === "saving" && <p className="mt-5 flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground" role="status"><LoaderCircle className="h-4 w-4 animate-spin text-emerald-700" />{t("progress.saving")}</p>}
            {saveStatus === "saved" && <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900" role="status"><p className="flex items-center justify-center gap-2"><Check className="h-4 w-4" />{t("progress.saved")}</p><p className="mt-1 text-xs font-semibold text-emerald-800">{t("kids.allTimeTotal", { score: totalPoints })}</p></div>}
            {saveStatus === "error" && <div className="mt-5 rounded-2xl bg-rose-50 p-4" role="alert"><p className="text-sm font-bold text-rose-900">{t("progress.error")}</p><button type="button" onClick={() => void saveResult()} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-700 px-4 text-xs font-bold text-white"><RefreshCw className="h-4 w-4" />{t("common.retry")}</button></div>}
            {newAchievements.length > 0 && <p className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-amber-50 p-3 text-xs font-extrabold text-amber-900"><Sparkles className="h-4 w-4" />{t("achievement.unlockedMessage", { name: t(`achievement.${newAchievements[0]}.title`) })}</p>}
            <div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={startGame} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0E7A63] px-4 text-sm font-extrabold text-white"><RefreshCw className="h-4 w-4" />{t("detective.playAgain")}</button><button type="button" onClick={onBack} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#C5DAD3] px-4 text-sm font-extrabold text-foreground">{t("arcade.backToArcade")}<ChevronRight className="h-4 w-4" /></button></div>
          </div>
        ) : (
          <>
            <div className="text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E3F4EE] text-emerald-700"><Target className="h-7 w-7" /></span><p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-700">{t("detective.eyebrow")}</p><h2 className="mt-2 font-display text-3xl font-black text-foreground">{t("kids.game.detective")}</h2><p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{t("detective.intro")}</p></div>
            <div className="mt-6 rounded-2xl bg-[#0D343C] p-4"><LevelPicker value={level} onChange={setLevel} /></div>
            <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#F0F7F4] p-4"><BookOpenCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /><p className="text-xs leading-relaxed text-[#355E51]">{t("detective.levelExplanation", { count: LEVEL_QUESTIONS[level], points: LEVEL_POINTS[level] })}</p></div>
            <button type="button" onClick={startGame} className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#0E7A63] px-5 font-display text-base font-extrabold text-white shadow-[0_4px_0_#07503F] hover:bg-[#09604E]"><ShieldCheck className="h-5 w-5" />{t("detective.start")}<ArrowRight className="h-5 w-5" /></button>
            <p className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] leading-relaxed text-muted-foreground"><CircleAlert className="h-3.5 w-3.5 shrink-0" />{t("detective.trainingNote")}</p>
          </>
        )}
      </div>
    </section>
  );
}
