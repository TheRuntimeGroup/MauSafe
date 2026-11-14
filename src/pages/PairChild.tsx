import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Baby, Check, LoaderCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import type { ChildPairSetup } from "@/components/ChildAccountSetup";
import { Logo } from "@/components/Logo";

export default function PairChild() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshProfile } = useAuth();
  const [setup] = useState<ChildPairSetup | null>(() => {
    const stateSetup = location.state as ChildPairSetup | null;
    if (stateSetup) return stateSetup;
    try {
      return JSON.parse(localStorage.getItem("mausafe.childPairSetup") ?? "null") as ChildPairSetup | null;
    } catch {
      return null;
    }
  });
  const [email, setEmail] = useState(setup?.childEmail ?? "");
  const [code, setCode] = useState("");
  const [approved, setApproved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pair(event: React.FormEvent) {
    event.preventDefault();
    if (!setup || !approved || busy) return;
    setBusy(true);
    setError(null);

    const { error: linkError } = await supabase.auth.verifyOtp({
      token_hash: setup.hashedToken,
      type: "magiclink",
    });
    if (linkError) {
      setBusy(false);
      setError(t("child.invalidMagicLink"));
      return;
    }

    const { data, error } = await supabase.functions.invoke("complete-child-pair", {
      body: { childName: setup.childName, pairCode: code.replace(/\D/g, ""), hashedToken: setup.hashedToken },
    });
    setBusy(false);
    if (error || data?.error) {
      setError(data?.error === "INVALID_CODE" || data?.error === "EXPIRED_CODE" || data?.error === "INVALID_PAIR_DETAILS" ? t("child.invalidPairCode") : t("child.setupError"));
      return;
    }

    try { localStorage.removeItem("mausafe.childPairSetup"); } catch {
      // Local cleanup is best-effort.
    }
    await refreshProfile();
    navigate("/kids", { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-5 py-6">
      <header className="flex justify-center pb-7">
        <Logo variant="full" className="h-10 w-32" />
      </header>
      <main className="mx-auto w-full max-w-md flex-1">
        <section className="rounded-[2rem] border border-[#DDE6ED] bg-card p-6 shadow-premium sm:p-8">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
            <Baby className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-extrabold text-foreground">{t("child.pairTitle")}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("child.pairSubtitle")}</p>

          {setup ? (
            <form onSubmit={pair} className="mt-6 space-y-5">
              <div className="space-y-2.5 rounded-2xl border border-[#DDE6ED] bg-[#F4F8FB] p-4 text-sm">
                <p className="flex items-center gap-2 font-extrabold text-foreground"><ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />{t("child.reviewGuardian")}</p>
                <dl className="space-y-1.5 text-xs">
                  <div className="flex justify-between gap-3"><dt className="font-bold text-muted-foreground">{t("child.guardianDetails")}</dt><dd className="text-right font-semibold text-foreground">{setup.guardianName}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="font-bold text-muted-foreground">{t("child.guardianEmail")}</dt><dd className="break-all text-right font-semibold text-foreground">{setup.guardianEmail}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="font-bold text-muted-foreground">{t("child.nameLabel")}</dt><dd className="text-right font-semibold text-foreground">{setup.childName}</dd></div>
                </dl>
              </div>

              <label className="block space-y-2 text-sm font-semibold text-foreground">
                {t("child.accountEmail")}
                <input required readOnly type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full rounded-xl border border-input bg-muted/50 px-4 text-sm font-normal text-foreground" />
              </label>

              <label className="block space-y-2 text-sm font-semibold text-foreground">
                {t("child.otp")}
                <input
                  required
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  className="h-14 w-full rounded-xl border border-input bg-white px-4 text-center font-mono text-2xl font-extrabold tracking-[0.4em] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-primary/15 bg-secondary/45 p-3 text-xs leading-relaxed text-foreground">
                <input type="checkbox" required checked={approved} onChange={(event) => setApproved(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]" />
                {t("child.approveGuardian", { name: setup.guardianName })}
              </label>

              {error && <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger/[0.06] px-3 py-2.5 text-sm font-semibold text-danger"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{error}</p>}

              <button
                type="submit"
                disabled={busy || !approved || code.length !== 6}
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-base font-extrabold uppercase tracking-[0.08em] text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {busy && <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />}
                {busy ? t("child.pairing") : t("child.pairButton")}
              </button>

              <button type="button" onClick={() => navigate("/auth")} className="w-full rounded-xl py-2 text-center text-xs font-semibold text-muted-foreground hover:text-primary">
                {t("auth.haveAccount")}
              </button>
            </form>
          ) : (
            <div className="mt-6 space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">{t("child.setupRequired")}</p>
              <Link to="/settings" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">
                {t("kids.openSettings")}<Check className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
