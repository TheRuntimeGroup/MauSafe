import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  CircleHelp,
  Clock3,
  KeyRound,
  Link2,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  ShieldQuestion,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { recordKidGameActivity, type ActivityInput, type KidActivity } from "@/lib/kidProgress";
import { cn } from "@/lib/utils";

type LessonId = "urgency" | "links" | "codes" | "help";
const LESSONS: { id: LessonId; icon: LucideIcon; correctAnswer: 0 | 1 }[] = [
  { id: "urgency", icon: Clock3, correctAnswer: 0 },
  { id: "links", icon: Link2, correctAnswer: 1 },
  { id: "codes", icon: KeyRound, correctAnswer: 0 },
  { id: "help", icon: UserRoundCheck, correctAnswer: 1 },
];

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function LearningHub({
  activities,
  onBack,
  onRecorded,
}: {
  activities: KidActivity[];
  onBack: () => void;
  onRecorded: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [selectedLesson, setSelectedLesson] = useState<LessonId | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [localCompleted, setLocalCompleted] = useState<Set<string>>(new Set());
  const startedAtRef = useRef(0);
  const resultRef = useRef<ActivityInput | null>(null);
  const completedLessons = useMemo(() => {
    const completed = new Set(localCompleted);
    for (const activity of activities) {
      if (activity.game_id.startsWith("lesson_")) completed.add(activity.game_id.replace("lesson_", ""));
    }
    return completed;
  }, [activities, localCompleted]);

  function selectLesson(id: LessonId) {
    setSelectedLesson(id);
    setSelectedAnswer(null);
    setSaveStatus("idle");
    setNewAchievements([]);
    resultRef.current = null;
    startedAtRef.current = Date.now();
  }

  async function completeLesson() {
    if (!selectedLesson) return;
    const result: ActivityInput = resultRef.current ?? {
      activityId: crypto.randomUUID(),
      gameId: `lesson_${selectedLesson}`,
      mode: "lesson",
      level: "beginner",
      score: 10,
      durationSeconds: Math.round((Date.now() - startedAtRef.current) / 1000),
    };
    resultRef.current = result;
    setSaveStatus("saving");
    try {
      const saved = await recordKidGameActivity(result);
      if (resultRef.current?.activityId !== result.activityId) return;
      setLocalCompleted((current) => new Set(current).add(selectedLesson));
      setNewAchievements(saved.newAchievements);
      setSaveStatus("saved");
      await onRecorded();
    } catch {
      if (resultRef.current?.activityId === result.activityId) setSaveStatus("error");
    }
  }

  if (selectedLesson) {
    const lesson = LESSONS.find((item) => item.id === selectedLesson) as (typeof LESSONS)[number];
    const Icon = lesson.icon;
    const completed = completedLessons.has(selectedLesson);
    const answerCorrect = selectedAnswer === lesson.correctAnswer;
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <button type="button" onClick={() => { setSelectedLesson(null); setSaveStatus("idle"); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-bold text-[#45655A] hover:text-emerald-800"><ArrowLeft className="h-4 w-4" />{t("learning.allLessons")}</button>
        <article className="overflow-hidden rounded-[2rem] border border-[#D9E8E3] bg-white shadow-premium">
          <header className="relative isolate overflow-hidden bg-[#10383D] p-6 text-white sm:p-8">
            <div className="absolute -right-14 -top-16 -z-10 h-52 w-52 rounded-full border-[28px] border-[#1A4846]" aria-hidden="true" />
            <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-[#F9C74F] p-3.5 text-[#3D2D06]"><Icon className="h-7 w-7" /></span>
            <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#7CE8C1]">{t("learning.guidedLesson")} · 10 {t("kids.points")}</p>
            <h1 className="mt-2 font-display text-3xl font-black text-[#FFFCED]">{t(`lesson.${selectedLesson}.title`)}</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#C5DDD8]">{t(`lesson.${selectedLesson}.intro`)}</p>
          </header>
          <div className="p-5 sm:p-7">
            <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-foreground"><BookOpenCheck className="h-5 w-5 text-emerald-700" />{t("learning.rememberTitle")}</h2>
            <ul className="mt-4 space-y-3">
              {[1, 2, 3].map((point) => (
                <li key={point} className="flex items-start gap-3 rounded-2xl bg-[#F1F7F4] p-4 text-sm leading-relaxed text-[#294B41]"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D6F1E5] text-xs font-extrabold text-emerald-800">{point}</span>{t(`lesson.${selectedLesson}.point${point}`)}</li>
              ))}
            </ul>
            <section className="mt-6 rounded-2xl border border-[#D5E4DE] bg-[#FBFDFC] p-5">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-700">{t("learning.tryIt")}</p>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-foreground">{t(`lesson.${selectedLesson}.scenario`)}</p>
              <h3 className="mt-4 font-display text-base font-extrabold text-foreground">{t(`lesson.${selectedLesson}.question`)}</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[0, 1].map((answer) => (
                  <button
                    key={answer}
                    type="button"
                    disabled={selectedAnswer !== null || completed}
                    onClick={() => setSelectedAnswer(answer)}
                    className={cn("min-h-16 rounded-2xl border p-4 text-sm font-bold leading-relaxed transition-colors", selectedAnswer === answer ? (answer === lesson.correctAnswer ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-amber-400 bg-amber-50 text-amber-900") : "border-[#CEDED7] bg-white hover:border-emerald-600 disabled:text-muted-foreground")}
                  >{t(`lesson.${selectedLesson}.answer${answer + 1}`)}</button>
                ))}
              </div>
              {(selectedAnswer !== null || completed) && (
                <div className={cn("mt-4 flex items-start gap-3 rounded-2xl p-4", selectedAnswer !== null && !answerCorrect ? "bg-amber-50" : "bg-emerald-50")} role="status">
                  {completed ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /> : <CircleHelp className={cn("mt-0.5 h-5 w-5 shrink-0", answerCorrect ? "text-emerald-700" : "text-amber-700")} />}
                  <div><p className="text-sm font-extrabold text-foreground">{completed ? t("learning.completed") : answerCorrect ? t("learning.goodThinking") : t("learning.keepLearning")}</p><p className="mt-1.5 text-sm leading-relaxed text-[#35594B]">{t(`lesson.${selectedLesson}.explanation`)}</p></div>
                </div>
              )}
            </section>
            {completed ? (
              <div className="mt-6">
                <p className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-extrabold text-emerald-900"><CheckCircle2 className="h-5 w-5" />{t("learning.completedPoints")}</p>
                <button type="button" onClick={() => setSelectedLesson(null)} className="mt-4 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#0E7A63] px-5 text-sm font-extrabold text-white">{t("learning.nextLesson")}<ArrowRight className="h-4 w-4" /></button>
              </div>
            ) : (
              <>
                {saveStatus === "error" && <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-900" role="alert">{t("progress.error")}<button type="button" className="ml-2 underline" onClick={() => void completeLesson()}>{t("common.retry")}</button></div>}
                <button type="button" disabled={selectedAnswer === null || saveStatus === "saving"} onClick={() => void completeLesson()} className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#0E7A63] px-5 text-sm font-extrabold text-white shadow-[0_4px_0_#07503F] hover:bg-[#09604E] disabled:cursor-not-allowed disabled:opacity-50">
                  {saveStatus === "saving" ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}{t("learning.completeLesson")}
                </button>
                {selectedAnswer === null && <p className="mt-2 text-center text-[11px] text-muted-foreground">{t("learning.answerFirst")}</p>}
              </>
            )}
            {saveStatus === "saved" && newAchievements.length > 0 && <p className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-amber-50 p-3 text-xs font-extrabold text-amber-900"><Sparkles className="h-4 w-4" />{t("achievement.unlockedMessage", { name: t(`achievement.${newAchievements[0]}.title`) })}</p>}
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-bold text-[#45655A] hover:text-emerald-800"><ArrowLeft className="h-4 w-4" />{t("arcade.backToArcade")}</button>
        <span className="rounded-full bg-[#E0F1EA] px-3 py-1.5 text-xs font-extrabold text-emerald-800">{completedLessons.size}/4 {t("learning.completedShort")}</span>
      </div>
      <header className="rounded-[2rem] border border-[#BFDCD1] bg-[#E8F5EF] p-6 sm:p-7">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0E7A63] text-white"><BookOpenCheck className="h-6 w-6" /></span>
        <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-700">{t("learning.eyebrow")}</p>
        <h1 className="mt-2 font-display text-3xl font-black text-[#113D32]">{t("learning.title")}</h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#42685C]">{t("learning.intro")}</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {LESSONS.map((lesson, index) => {
          const Icon = lesson.icon;
          const completed = completedLessons.has(lesson.id);
          return (
            <button key={lesson.id} type="button" onClick={() => selectLesson(lesson.id)} className="group rounded-[1.5rem] border border-[#D5E6DF] bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-600 hover:shadow-premium">
              <div className="flex items-start justify-between gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E5F4ED] text-emerald-700"><Icon className="h-6 w-6" /></span>{completed ? <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-extrabold text-emerald-800"><Check className="h-3 w-3" />{t("learning.done")}</span> : <span className="font-display text-xl font-black text-[#B5CCC3]">0{index + 1}</span>}</div>
              <h2 className="mt-4 font-display text-lg font-extrabold text-foreground">{t(`lesson.${lesson.id}.title`)}</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t(`lesson.${lesson.id}.summary`)}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700">{completed ? t("learning.review") : t("learning.startLesson")}<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
            </button>
          );
        })}
      </div>
      <p className="flex items-start gap-2.5 rounded-2xl bg-[#F1F5F3] p-4 text-xs leading-relaxed text-[#52685F]"><ShieldQuestion className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />{t("learning.note")}</p>
    </div>
  );
}
