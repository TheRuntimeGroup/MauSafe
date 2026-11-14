import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  Coins,
  Crown,
  Gamepad2,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  MapPin,
  Medal,
  RefreshCw,
  ShieldCheck,
  Trophy,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { loadGlobalLeaderboard, type GlobalLeaderboardData } from "@/lib/kidProgress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function ChildHeaderActions() {
  const { t } = useI18n();
  const { user, profile, signOut } = useAuth();
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [data, setData] = useState<GlobalLeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(false);
    try {
      setData(await loadGlobalLeaderboard(user.id));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (leaderboardOpen) void load();
  }, [leaderboardOpen, load]);

  const ownListed = data?.own && data.entries.some((entry) => entry.user_id === data.own?.user_id);

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Dialog open={leaderboardOpen} onOpenChange={setLeaderboardOpen}>
        <DialogTrigger asChild>
          <button type="button" className="flex h-11 items-center gap-2 rounded-2xl border border-[#CDEBDD] bg-[#EDF8F1] px-2.5 text-[#125E4C] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#D8F0E4]" aria-label={t("childHeader.leaderboard")}>
            <Trophy className="h-5 w-5 text-amber-600" aria-hidden="true" />
            <span className="hidden text-xs font-extrabold min-[420px]:inline">{t("childHeader.leaderboard")}</span>
          </button>
        </DialogTrigger>
        <DialogContent className="max-h-[88dvh] gap-0 overflow-hidden rounded-[1.75rem] border-[#C6DDD3] p-0 sm:max-w-md">
          <header className="bg-[#10383D] p-5 pr-12 text-white sm:p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F9C74F] text-[#3D2D06]"><Crown className="h-5 w-5" /></span>
            <DialogHeader className="mt-3 text-left">
              <DialogTitle className="font-display text-2xl font-black text-[#FFFCED]">{t("childHeader.leaderboardTitle")}</DialogTitle>
              <DialogDescription className="text-xs leading-relaxed text-[#C5DDD8]">{t("childHeader.leaderboardSubtitle")}</DialogDescription>
            </DialogHeader>
          </header>
          <div className="max-h-[55dvh] overflow-y-auto p-4 sm:p-5">
            {data?.own && (
              <div className="mb-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-[#EEF6F2] p-2.5"><p className="text-[9px] font-extrabold uppercase tracking-wider text-[#58786C]">{t("childHeader.rank")}</p><p className="font-display text-lg font-black text-[#15483A]">{data.rank ? `#${data.rank}` : "—"}</p></div>
                <div className="rounded-xl bg-[#EEF6F2] p-2.5"><p className="text-[9px] font-extrabold uppercase tracking-wider text-[#58786C]">{t("childHeader.points")}</p><p className="font-display text-lg font-black text-[#15483A]">{data.own.score}</p></div>
                <div className="rounded-xl bg-amber-50 p-2.5"><p className="flex items-center justify-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-amber-800"><Coins className="h-3 w-3" />{t("childHeader.coins")}</p><p className="font-display text-lg font-black text-amber-800">{data.own.coins}</p></div>
              </div>
            )}
            {error && <div className="mb-3 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-900" role="alert"><span>{t("childHeader.loadError")}</span><button type="button" onClick={() => void load()} className="ml-auto font-extrabold underline">{t("common.retry")}</button></div>}
            {loading && !data ? (
              <p className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-muted-foreground" role="status"><LoaderCircle className="h-5 w-5 animate-spin text-emerald-700" />{t("common.loading")}</p>
            ) : data && data.entries.length > 0 ? (
              <ol className="space-y-2">
                {data.entries.map((entry, index) => {
                  const mine = entry.user_id === user?.id;
                  return (
                    <li key={entry.user_id} className={cn("flex items-center gap-3 rounded-2xl border px-3 py-3", mine ? "border-[#F1D47C] bg-[#FFF8E4]" : "border-[#E0E8E4] bg-[#FAFBFA]")}>
                      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black", index === 0 ? "bg-[#F9C74F] text-[#3D2D06]" : index === 1 ? "bg-[#DEE7E6] text-[#4D6762]" : index === 2 ? "bg-[#E5C4A1] text-[#714C2C]" : "bg-[#EDF1EF] text-[#5A7167]")}>{index < 3 ? <Medal className="h-4 w-4" /> : index + 1}</span>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-[#203D33]">{mine ? t("childHeader.you") : t("childHeader.learner", { number: entry.player_number })}</p><p className="mt-0.5 text-[10px] font-semibold text-[#6E847A]">{t("childHeader.activities", { count: entry.games_played })}</p></div>
                      <div className="text-right"><p className="font-display text-lg font-black tabular-nums text-[#155741]">{entry.score}</p><p className="text-[9px] font-bold uppercase text-[#6E847A]">{t("childHeader.points")}</p></div>
                    </li>
                  );
                })}
              </ol>
            ) : !loading && !error ? (
              <div className="rounded-2xl border border-dashed border-[#CADBD3] bg-[#F3F8F6] p-6 text-center"><Gamepad2 className="mx-auto h-7 w-7 text-emerald-700" /><p className="mt-3 text-sm font-extrabold text-foreground">{t("childHeader.emptyTitle")}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("childHeader.emptyHint")}</p><Link to="/arcade" onClick={() => setLeaderboardOpen(false)} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0E7A63] px-4 text-xs font-extrabold text-white">{t("childHeader.goArcade")}<ChevronRight className="h-4 w-4" /></Link></div>
            ) : null}
            {data?.own && !ownListed && data.rank && (
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[#F1D47C] bg-[#FFF8E4] px-3 py-3"><span className="font-display text-sm font-black text-amber-800">#{data.rank}</span><span className="flex-1 text-sm font-extrabold text-[#203D33]">{t("childHeader.you")}</span><span className="font-display text-lg font-black tabular-nums text-[#155741]">{data.own.score}</span></div>
            )}
          </div>
          <footer className="flex items-center justify-between gap-3 border-t border-[#DDE7E2] bg-[#F4F7F5] px-5 py-3.5">
            <p className="text-[10px] font-semibold text-[#657B71]">{t("childHeader.privacy")}</p>
            <button type="button" onClick={() => void load()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#D6E2DD] bg-white text-emerald-800" aria-label={t("childHeader.refresh")}><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /></button>
          </footer>
        </DialogContent>
      </Dialog>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogTrigger asChild>
          <button type="button" className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#1D6558] bg-[#0E7A63] text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#09604E]" aria-label={t("childHeader.profile")}>
            <UserRound className="h-5 w-5" aria-hidden="true" />
          </button>
        </DialogTrigger>
        <DialogContent className="gap-0 overflow-hidden rounded-[1.75rem] border-[#D9E6E1] p-0 sm:max-w-sm">
          <div className="bg-[#F0F8F4] p-6 text-center">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-[#0E7A63] text-white shadow-[0_10px_24px_-12px_#07503F]"><UserRound className="h-10 w-10" /></span>
            <DialogHeader className="mt-4 text-center">
              <DialogTitle className="font-display text-2xl font-black text-[#173E32]">{profile?.full_name || t("childHeader.defaultName")}</DialogTitle>
              <DialogDescription className="text-xs font-semibold text-[#5E786D]">{t("childHeader.childAccount")}</DialogDescription>
            </DialogHeader>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#C5DED1] bg-white px-3 py-1.5 text-[10px] font-extrabold text-emerald-800"><LockKeyhole className="h-3.5 w-3.5" />{t("childHeader.readOnly")}</span>
          </div>
          <div className="space-y-3 p-5">
            <div className="rounded-2xl bg-[#F5F7F6] p-3.5"><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B8277]">{t("childHeader.email")}</p><p className="mt-1 break-all text-sm font-bold text-foreground">{user?.email || "—"}</p></div>
            <div className="flex items-start gap-3 rounded-2xl border border-[#D9E6E1] p-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /><p className="text-xs leading-relaxed text-[#526C60]">{t("childHeader.guardianManaged")}</p></div>
            <Link to="/settings" onClick={() => setProfileOpen(false)} className="flex min-h-12 items-center gap-3 rounded-2xl border border-[#D9E6E1] bg-white px-4 text-sm font-bold text-[#244D40] hover:bg-[#F3F8F6]"><MapPin className="h-4 w-4 text-emerald-700" /><span className="flex-1">{t("childHeader.locationStatus")}</span><ChevronRight className="h-4 w-4" /></Link>
            <button type="button" disabled={signingOut} onClick={() => { setSigningOut(true); void signOut().finally(() => setSigningOut(false)); }} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#D4DEDD] bg-white text-sm font-extrabold text-[#456159] hover:bg-[#F3F5F4] disabled:opacity-50">{signingOut ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}{t("auth.signOut")}</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
