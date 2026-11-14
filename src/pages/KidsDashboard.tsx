import { useCallback, useEffect, useState } from "react";
import {
  Baby,
  BookOpenCheck,
  Check,
  ChevronRight,
  Clock3,
  Crown,
  Coins,
  Gamepad2,
  GraduationCap,
  LoaderCircle,
  LockKeyhole,
  Medal,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Swords,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { AppButton } from "@/components/ui/app-button";
import {
  ACHIEVEMENT_IDS,
  achievementProgress,
  loadKidProgress,
  type AchievementId,
  type KidProgress,
} from "@/lib/kidProgress";
import { cn } from "@/lib/utils";
import "./KidsDashboard.css";

const ACHIEVEMENT_ICONS: Record<AchievementId, LucideIcon> = {
  first_activity: Sparkles,
  fruit_fan: Zap,
  fraud_buster: ShieldCheck,
  scam_spotter: ShieldCheck,
  quick_learner: BookOpenCheck,
  wise_detective: Target,
  knowledge_champion: GraduationCap,
  expert_ready: Swords,
  practice_progress: Star,
};

function KidsMascot() {
  return (
    <svg viewBox="0 0 140 126" className="h-auto w-28 sm:w-32" aria-hidden="true">
      <circle cx="109" cy="23" r="6" fill="#FDE68A" />
      <path d="M24 18L28 26L37 28L30 34L32 43L24 39L16 43L18 34L11 28L20 26Z" fill="#F9C74F" />
      <rect x="36" y="25" width="68" height="77" rx="27" fill="#F9C74F" />
      <rect x="42" y="31" width="56" height="58" rx="23" fill="#FFE3A0" />
      <circle cx="59" cy="55" r="4.5" fill="#14333D" />
      <circle cx="81" cy="55" r="4.5" fill="#14333D" />
      <circle cx="57.5" cy="53.5" r="1.4" fill="white" />
      <circle cx="79.5" cy="53.5" r="1.4" fill="white" />
      <path d="M61 71Q70 79 79 71" stroke="#14333D" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="52" cy="66" r="5" fill="#F8988F" />
      <circle cx="88" cy="66" r="5" fill="#F8988F" />
      <path d="M70 38L77 48H87V59C87 69 80 78 70 82C60 78 53 69 53 59V48H63L70 38Z" fill="#0E7A63" />
      <path d="M70 49L73 55L79 56L75 61L76 67L70 64L64 67L65 61L61 56L67 55Z" fill="white" />
      <path d="M43 101L36 111M97 101L104 111" stroke="#F9C74F" strokeWidth="7" strokeLinecap="round" />
      <path d="M109 67L113 76L123 77L115 84L118 94L109 88L100 94L103 84L95 77L105 76Z" fill="#7CE8C1" />
    </svg>
  );
}

export default function KidsDashboard() {
  const { t, locale } = useI18n();
  const { user, profile } = useAuth();
  const [progress, setProgress] = useState<KidProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const isChild = profile?.account_type === "child";

  const loadProgress = useCallback(async () => {
    if (!user || !isChild) return;
    setLoading(true);
    setError(false);
    try {
      setProgress(await loadKidProgress(user.id));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user, isChild]);

  useEffect(() => { void loadProgress(); }, [loadProgress]);

  if (!isChild) {
    return (
      <section className="mx-auto max-w-xl rounded-[1.75rem] border border-[#DDE6ED] bg-card p-7 text-center shadow-premium">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary"><Baby className="h-7 w-7" /></span>
        <h1 className="mt-4 font-display text-2xl font-extrabold text-foreground">{t("kids.childOnlyTitle")}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{t("kids.childOnlyBody")}</p>
        <Link to="/settings" className="mt-6 inline-flex"><AppButton size="lg">{t("kids.openSettings")}<ChevronRight className="h-4 w-4" /></AppButton></Link>
      </section>
    );
  }

  if (loading) {
    return <div className="flex min-h-80 items-center justify-center" role="status"><LoaderCircle className="h-8 w-8 animate-spin text-emerald-600" /><span className="sr-only">{t("common.loading")}</span></div>;
  }
  if (error || !progress) {
    return (
      <section className="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-7 text-center">
        <p className="text-sm font-bold text-rose-900">{t("kids.progressError")}</p>
        <button type="button" onClick={() => void loadProgress()} className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl bg-rose-700 px-5 text-sm font-bold text-white"><RefreshCw className="h-4 w-4" />{t("common.retry")}</button>
      </section>
    );
  }

  const score = progress.score?.score ?? 0;
  const activities = progress.score?.games_played ?? 0;
  const unlocked = new Set(progress.achievements.map((item) => item.achievement_id));
  const unlockedCount = unlocked.size;
  const latest = progress.activities[0];
  const latestTitle = latest?.game_id === "whack" ? t("kids.game.whack") : latest?.game_id === "fruit" ? t("kids.game.fruit") : latest?.game_id === "detective" ? t("kids.game.detective") : latest ? t(`lesson.${latest.game_id.replace("lesson_", "")}.title`) : "";
  const LatestIcon = latest?.game_id === "whack" ? ShieldCheck : latest?.game_id === "fruit" ? Gamepad2 : latest?.game_id === "detective" ? Target : GraduationCap;
  const rankLabel = activities > 0 ? t("kids.rankNumber", { rank: progress.rank }) : t("kids.notRanked");

  return (
    <div className="kids-page mx-auto max-w-3xl space-y-6">
      <header className="relative isolate overflow-hidden rounded-[2rem] border border-[#1F4B48] bg-[#092E36] p-5 text-white shadow-[0_24px_60px_-26px_rgba(9,46,54,0.8)] sm:p-7">
        <div className="absolute -right-16 -top-20 -z-10 h-64 w-64 rounded-full border-[35px] border-[#17463F]" aria-hidden="true" />
        <div className="absolute bottom-8 left-1/2 -z-10 h-32 w-32 rounded-full border-[22px] border-[#143F47]" aria-hidden="true" />
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#3E6A60] bg-[#16463F] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#A7F3D0]"><Sparkles className="h-3.5 w-3.5" />{t("kids.homeEyebrow")}</p>
            <h1 className="mt-4 max-w-xs font-display text-2xl font-black leading-tight tracking-[-0.04em] text-[#FFFCED] sm:text-3xl">{t("kids.homeTitle")}</h1>
          </div>
          <div className="shrink-0 sm:-mr-2"><KidsMascot /></div>
        </div>
        <div className="mt-6 grid grid-cols-[1.15fr_0.85fr] gap-3">
          <div className="rounded-2xl border border-[#F9C74F]/25 bg-[#173E3C] p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#BCE0D4]">{t("kids.allTimeScore")}</p>
            <p className="mt-1 font-display text-4xl font-black tabular-nums text-[#F9C74F] sm:text-5xl">{score}</p>
            <p className="mt-1 text-[11px] font-bold text-[#C5DDD8]">{t("kids.learningPoints")}</p>
          </div>
          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#10383D] p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F9C74F] text-[#3D2D06]"><Crown className="h-5 w-5" /></span>
            <div className="mt-3"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#BCE0D4]">{t("kids.globalRank")}</p><p className="mt-1 font-display text-xl font-black text-white">{rankLabel}</p></div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2.5 rounded-2xl border border-[#F9C74F]/25 bg-[#2F432B] px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F9C74F] text-[#3D2D06]"><Coins className="h-5 w-5" /></span>
          <span className="text-xs font-bold text-[#FDE6AB]">{t("coins.safetyCoins")}</span>
          <strong className="ml-auto font-display text-xl font-black tabular-nums text-[#F9C74F]">{progress.score?.coins ?? 0}</strong>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-[#08282E] px-3.5 py-2.5 text-[11px] font-semibold text-[#C5DDD8]">
          <span>{t("kids.activitiesCount", { count: activities })}</span>
          <span className="inline-flex items-center gap-1.5"><Medal className="h-3.5 w-3.5 text-[#F9C74F]" />{t("kids.badgesCount", { count: unlockedCount, total: ACHIEVEMENT_IDS.length })}</span>
        </div>
      </header>

      <section className="relative overflow-hidden rounded-[1.75rem] border border-[#D7E6E1] bg-white p-5 shadow-premium sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-extrabold text-foreground">{t("kids.latestPlayed")}</h2>
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E8F7F1] text-emerald-700"><Clock3 className="h-5 w-5" /></span>
        </div>
        {latest ? (
          <div className="mt-4 flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#10383D] text-[#F9C74F]"><LatestIcon className="h-7 w-7" /></span>
            <div className="min-w-0 flex-1"><h3 className="font-display text-base font-extrabold text-foreground">{latestTitle}</h3><p className="mt-1 text-xs font-semibold text-muted-foreground">{t(`level.${latest.level}.title`)} · {t("kids.pointsWon", { points: latest.score })}</p><p className="mt-1 text-[11px] text-muted-foreground">{new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(latest.created_at))}</p></div>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl bg-[#F2F8F6] p-5"><p className="text-sm font-extrabold text-foreground">{t("kids.noActivityTitle")}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("kids.noActivityBody")}</p></div>
        )}
        <Link to="/arcade" className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0E7A63] px-5 text-sm font-extrabold text-white transition-colors hover:bg-[#09604E]"><Gamepad2 className="h-5 w-5" />{t("kids.continueLearning")}<ChevronRight className="h-4 w-4" /></Link>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3 px-1">
          <div><h2 className="font-display text-xl font-extrabold text-foreground">{t("kids.achievements")}</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("kids.achievementsHint")}</p></div>
          <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-extrabold text-amber-800">{unlockedCount}/{ACHIEVEMENT_IDS.length}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {ACHIEVEMENT_IDS.map((id) => {
            const earned = unlocked.has(id);
            const badgeProgress = achievementProgress(id, progress.activities);
            const BadgeIcon = ACHIEVEMENT_ICONS[id];
            return (
              <article key={id} className={cn("relative overflow-hidden rounded-2xl border p-4 transition-colors", earned ? "border-[#E5C659] bg-[#FFFAE9]" : "border-[#DCE7E3] bg-white")}>
                <div className="flex items-start gap-3">
                  <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", earned ? "bg-[#F9C74F] text-[#3D2D06]" : "bg-[#EEF3F1] text-[#6B7D77]")}><BadgeIcon className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1"><h3 className="text-sm font-extrabold text-foreground">{t(`achievement.${id}.title`)}</h3><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{t(`achievement.${id}.body`)}</p></div>
                  {earned ? <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white" title={t("kids.unlocked")}><Check className="h-3.5 w-3.5" /></span> : <LockKeyhole className="h-4 w-4 shrink-0 text-[#8A9A94]" />}
                </div>
                <div className="mt-3 flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#DCE7E3]"><div className={cn("h-full rounded-full", earned ? "bg-emerald-600" : "bg-[#85A69A]")} style={{ width: `${badgeProgress.current / badgeProgress.target * 100}%` }} /></div><span className="text-[10px] font-extrabold tabular-nums text-muted-foreground">{badgeProgress.current}/{badgeProgress.target}</span></div>
              </article>
            );
          })}
        </div>
      </section>

      <div role="note" className="flex items-start gap-3 rounded-2xl border border-[#DCE7E3] bg-[#F1F7F4] p-4 text-xs leading-relaxed text-[#526860]"><Trophy className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /><span>{t("kids.rankPrivacy")}</span></div>
    </div>
  );
}
