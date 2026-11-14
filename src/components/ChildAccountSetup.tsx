import { useState } from "react";
import { Link } from "react-router-dom";
import { Baby, Check, ChevronRight, Copy, LoaderCircle, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n/I18nContext";
import { AppButton } from "@/components/ui/app-button";

export type ChildPairSetup = {
  pairCode: string;
  hashedToken: string;
  childName: string;
  childEmail: string;
  guardianName: string;
  guardianEmail: string;
  expiresAt: string;
  emailSent: boolean;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ChildAccountSetup() {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setup, setSetup] = useState<ChildPairSetup | null>(null);
  const [copied, setCopied] = useState(false);

  async function createSetup(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !EMAIL_PATTERN.test(email)) {
      setError(t("child.invalidChildEmail"));
      return;
    }
    setBusy(true);
    setError(null);

    const { data, error } = await supabase.functions.invoke("guardian-create-child", {
      body: { childName: name.trim(), childEmail: email.trim().toLowerCase() },
    });
    setBusy(false);
    if (error || data?.error) {
      const code = data?.error ?? error?.message ?? "SETUP_FAILED";
      setError(code === "GUARDIAN_REQUIRED" ? t("child.guardianRequired") : code === "EMAIL_TAKEN" ? t("child.emailTaken") : t("child.setupError"));
      return;
    }

    const result = data as ChildPairSetup;
    setSetup(result);
    localStorage.setItem("mausafe.childPairSetup", JSON.stringify(result));
  }

  async function copyCode() {
    if (!setup) return;
    await navigator.clipboard.writeText(setup.pairCode);
    setCopied(true);
  }

  return (
    <section className="rounded-[1.75rem] border border-[#DDE6ED] bg-card p-5 shadow-premium sm:p-7">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
          <Baby className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-xl font-extrabold text-foreground">{t("child.createTitle")}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("child.createSubtitle")}</p>
        </div>
      </div>

      {!setup ? (
        <form onSubmit={createSetup} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-foreground">
              {t("child.nameLabel")}
              <input required value={name} onChange={(event) => setName(event.target.value)} maxLength={60} className="h-12 w-full rounded-xl border border-input bg-white px-4 text-sm font-normal text-foreground" />
            </label>
            <label className="space-y-2 text-sm font-semibold text-foreground">
              {t("child.accountEmail")}
              <input required type="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="child@example.com" className="h-12 w-full rounded-xl border border-input bg-white px-4 text-sm font-normal text-foreground placeholder:text-muted-foreground" />
            </label>
          </div>
          {error && <p role="alert" className="rounded-xl bg-danger/[0.06] px-3 py-2.5 text-sm font-semibold text-danger">{error}</p>}
          <AppButton type="submit" size="lg" disabled={busy}>
            {busy && <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />}
            {busy ? t("child.creating") : t("child.createButton")}
          </AppButton>
        </form>
      ) : (
        <div className="mt-5 space-y-4 rounded-2xl border border-primary/15 bg-secondary/55 p-4">
          <p className="flex items-center gap-2 text-sm font-extrabold text-primary">
            <MailCheck className="h-5 w-5" aria-hidden="true" />
            {setup.emailSent ? t("child.otpSent") : t("child.otpReady")}
          </p>
          <div className="rounded-2xl bg-white p-4 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{t("child.otp")}</p>
            <p className="mt-1 font-mono text-3xl font-extrabold tracking-[0.24em] text-primary">{setup.pairCode}</p>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{t("child.otpExpires", { time: new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(setup.expiresAt)) })}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{t("child.childDeviceGuide")}</p>
          <div className="flex flex-wrap gap-2">
            <AppButton size="md" variant="outline" onClick={copyCode} className="bg-white">
              {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              {copied ? t("child.copied") : t("child.copyCode")}
            </AppButton>
            <Link to="/pair-child" state={setup}>
              <AppButton size="md">{t("child.openPairing")}<ChevronRight className="h-4 w-4" aria-hidden="true" /></AppButton>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
