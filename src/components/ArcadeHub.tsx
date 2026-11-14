import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  ChevronRight,
  Crown,
  Gamepad2,
  GraduationCap,
  KeyRound,
  Link2,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Timer,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { FruitSliceArcade } from "@/components/FruitSliceArcade";
import { ScamDetectiveGame } from "@/components/ScamDetectiveGame";
import { WhackGame } from "@/components/WhackGame";
import { HamsterIcon, ScammerIcon } from "@/components/WhackCharacters";
import { LearningHub } from "@/components/LearningHub";
import { loadKidProgress, type KidProgress } from "@/lib/kidProgress";

type View = "hub" | "whack" | "detective" | "learning";

export function ArcadeHub() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [view, setView] = useState<View>("hub");
  const [progress, setProgress] = useState<KidProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setError(false);
    try {
      const saved = await loadKidProgress(user.id);
      setProgress(saved);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void refresh(); }, [refresh]);

  if (view === "whack") {
    return <WhackGame onBack={() => { setView("hub"); void refresh(); }} onProgressChange={() => void refresh()} />;
  }
  if (view === "detective") {
    return <ScamDetectiveGame onBack={() => { setView("hub"); void refresh(); }} />;
  }
  if (view === "learning" && progress) {
    return <LearningHub activities={progress.activities} onBack={() => setView("hub")} onRecorded={refresh} />;
  }

  const lessonsCompleted = progress?.activities.filter((item) => item.game_id.startsWith("lesson_")).length ?? 0;
  const totalScore = progress?.score?.score ?? 0;
  const completedActivities = progress?.score?.games_played ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="relative isolate overflow-hidden rounded-[2rem] border border-[#28594E] bg-[#10383D] p-6 text-white shadow-[0_22px_60px_-28px_rgba(9,46,54,0.8)] sm:p-7">
        <div className="absolute -right-20 -top-20 -z-10 h-64 w-64 rounded-full border-[35px] border-[#1B4C47]" aria-hidden="true" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#7CE8C1]"><Gamepad2 className="h-4 w-4" />{t("arcade.hubEyebrow")}</p>
            <h1 className="mt-3 font-display text-3xl font-black tracking-[-0.04em] text-[#FFFCED] sm:text-4xl">{t("arcade.hubTitle")}</h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#C5DDD8]">{t("arcade.hubSubtitle")}</p>
          </div>
          <span className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-[1.4rem] border border-[#F9C74F]/35 bg-[#244B42] text-[#F9C74F] sm:flex"><ShieldCheck className="h-8 w-8" /></span>
        </div>
        {!loading && !error && (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#173F40] p-3.5"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F9C74F] text-[#3D2D06]"><Crown className="h-5 w-5" /></span><div><p className="text-[9px] font-extrabold uppercase tracking-wider text-[#BCE0D4]">{t("kids.allTimeScore")}</p><p className="font-display text-xl font-black tabular-nums">{totalScore} <span className="text-xs text-[#C5DDD8]">{t("kids.points")}</span></p></div></div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#173F40] p-3.5"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#CBEEE0] text-emerald-800"><Check className="h-5 w-5" /></span><div><p className="text-[9px] font-extrabold uppercase tracking-wider text-[#BCE0D4]">{t("arcade.completedLabel")}</p><p className="font-display text-xl font-black tabular-nums">{completedActivities}</p></div></div>
          </div>
        )}
        {loading && <p className="mt-5 flex items-center gap-2 text-xs font-bold text-[#C5DDD8]" role="status"><LoaderCircle className="h-4 w-4 animate-spin" />{t("common.loading")}</p>}
        {error && <div className="mt-5 flex items-center gap-2 rounded-xl bg-[#522D32] px-3 py-2 text-xs font-bold text-rose-100"><span>{t("progress.error")}</span><button type="button" onClick={() => { setLoading(true); void refresh(); }} className="ml-auto underline">{t("common.retry")}</button></div>}
      </header>

      <section className="relative overflow-hidden rounded-[1.75rem] border border-[#BFDCCF] bg-[#E8F5EE] p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4"><span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#0E7A63] p-3.5 text-white"><GraduationCap className="h-6 w-6" /></span><div><p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-emerald-700">{t("learning.eyebrow")}</p><h2 className="mt-1 font-display text-xl font-extrabold text-[#163E33]">{t("learning.title")}</h2><p className="mt-1 max-w-md text-xs leading-relaxed text-[#416558]">{t("learning.hubDescription")}</p></div></div>
          <button type="button" onClick={() => setView("learning")} disabled={loading || !!error} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#0E7A63] px-5 text-sm font-extrabold text-white hover:bg-[#09604E] disabled:opacity-50">{t("learning.startLesson")}<ArrowRight className="h-4 w-4" /></button>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#C6DED3] pt-4"><span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-extrabold text-emerald-800"><Timer className="h-3 w-3" />{t("learning.shortLessons")}</span><span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-extrabold text-emerald-800"><Trophy className="h-3 w-3" />{t("learning.pointsEach")}</span><span className="ml-auto text-xs font-extrabold text-emerald-800">{t("learning.progressCount", { completed: lessonsCompleted, total: 4 })}</span></div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-3 px-1"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-700">{t("arcade.playAndLearn")}</p><h2 className="mt-1 font-display text-2xl font-black text-foreground">{t("arcade.chooseGame")}</h2></div><span className="hidden items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-[10px] font-extrabold text-amber-800 sm:flex"><Star className="h-3.5 w-3.5" />{t("arcade.levelsIncluded")}</span></div>
        <div className="mt-4 space-y-5">
          <FruitSliceArcade onProgressChange={() => void refresh()} />
          <button type="button" onClick={() => setView("whack")} className="group relative isolate w-full overflow-hidden rounded-[2rem] border border-[#D8C5E1] bg-[#F2EAF6] p-6 text-left shadow-[0_18px_45px_-28px_rgba(69,39,87,0.65)] transition-all hover:-translate-y-1 hover:border-[#A985BC] hover:shadow-premium sm:p-7">
            <div className="absolute -right-12 -top-16 -z-10 h-52 w-52 rounded-full border-[26px] border-[#E6D9ED]" aria-hidden="true" />
            <div className="flex items-start gap-4">
              <div className="hidden w-36 shrink-0 sm:block"><ScammerIcon className="h-24 w-24" /><HamsterIcon className="-mt-9 ml-10 h-24 w-24" /></div>
              <div className="min-w-0 flex-1"><p className="text-[10px] font-extrabold uppercase tracking:[0.17em] text-[#805595]">{t("whack.eyebrow")}</p><h3 className="mt-1 font-display text-2xl font-black text-[#30253D]">{t("kids.game.whack")}</h3><p className="mt-2 max-w-md text-sm leading-relaxed text-[#685775]">{t("whack.cardDescription")}</p><div className="mt-4 flex flex-wrap gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-bold text-[#624571]"><Timer className="h-3 w-3" />{t("whack.threeRounds")}</span><span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-bold text-[#624571]"><Sparkles className="h-3 w-3" />{t("whack.speedIncreases")}</span></div></div>
            </div>
            <span className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#6F458C] px-5 text-sm font-extrabold text-white transition-colors group-hover:bg-[#583171]">{t("whack.playNow")}<ChevronRight className="h-4 w-4" /></span>
          </button>
          <button type="button" onClick={() => setView("detective")} className="group relative isolate w-full overflow-hidden rounded-[2rem] border border-[#B9CDE2] bg-[#EAF4FF] p-6 text-left shadow-[0_18px_45px_-28px_rgba(30,78,99,0.65)] transition-all hover:-translate-y-1 hover:border-[#7FAAC6] hover:shadow-premium sm:p-7">
            <div className="absolute -right-12 -top-16 -z-10 h-52 w-52 rounded-full border-[26px] border-[#D7E8F5]" aria-hidden="true" />
            <div className="flex items-start gap-4 sm:gap-5"><span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.4rem] bg-[#24617F] text-white shadow-sm"><Target className="h-8 w-8" /></span><div className="min-w-0 flex-1"><p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#326C89]">{t("detective.eyebrow")}</p><h3 className="mt-1 font-display text-2xl font-black text-[#12394F]">{t("kids.game.detective")}</h3><p className="mt-2 max-w-md text-sm leading-relaxed text-[#45667A]">{t("detective.cardDescription")}</p><div className="mt-4 flex flex-wrap gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-bold text-[#346178]"><ShieldCheck className="h-3 w-3" />{t("detective.explanationsIncluded")}</span><span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-bold text-[#346178]"><Sparkles className="h-3 w-3" />{t("arcade.threeLevels")}</span></div></div></div>
            <span className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#24617F] px-5 text-sm font-extrabold text-white transition-colors group-hover:bg-[#194D67]">{t("arcade.playDetective")}<ChevronRight className="h-4 w-4" /></span>
          </button>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[#DCE7E2] bg-white p-5">
        <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-foreground"><ShieldCheck className="h-5 w-5 text-emerald-700" />{t("arcade.safetyPromise")}</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t("arcade.safetyPromiseBody")}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold text-[#43675B]"><span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF5F2] px-3 py-1.5"><Link2 className="h-3 w-3" />{t("learning.topicLinks")}</span><span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF5F2] px-3 py-1.5"><KeyRound className="h-3 w-3" />{t("learning.topicCodes")}</span><span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF5F2] px-3 py-1.5"><BookOpenCheck className="h-3 w-3" />{t("learning.topicHelp")}</span></div>
      </section>
    </div>
  );
}
