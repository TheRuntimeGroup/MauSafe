import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { FormEvent } from "react";
import { ArrowLeft, KeyRound, LoaderCircle, ShieldCheck } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { supabase } from "@/integrations/supabase/client";
import { AppButton } from "@/components/ui/app-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ResetPassword = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [verifying, setVerifying] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get("token_hash");
    const type = params.get("type");

    async function verify() {
      if (type !== "recovery" || !tokenHash) {
        setVerifying(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery",
      });
      if (!active) return;
      if (verifyError) {
        setError(verifyError.message);
        setReady(false);
      } else {
        setReady(true);
      }
      setVerifying(false);
    }

    verify();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t("auth.passwordTooShort"));
      return;
    }
    if (password !== confirmation) {
      setError(t("auth.passwordMismatch"));
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    navigate("/", { replace: true });
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="overflow-hidden rounded-[1.75rem] border border-[#DDE6ED] bg-white shadow-premium">
        <div className="flex items-center gap-3 border-b border-foreground/[0.07] bg-[#F6F9FC] px-6 py-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0D2B45] text-white">
            <KeyRound className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-display text-xl font-extrabold tracking-tight text-foreground">
              {t("auth.resetTitle")}
            </h1>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t("auth.resetSubtitle")}</p>
          </div>
        </div>

        <div className="px-6 py-7 sm:px-8 sm:py-8">
          {verifying ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <LoaderCircle className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
              <p className="text-sm font-semibold text-muted-foreground">{t("auth.checking")}</p>
            </div>
          ) : !ready ? (
            <div className="text-center">
              <p className="text-sm leading-relaxed text-muted-foreground">{error ?? t("auth.resetInvalid")}</p>
              <Link to="/auth" className="mt-4 inline-flex font-semibold text-primary hover:underline">
                {t("auth.backToSignIn")}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="font-semibold text-foreground">
                  {t("auth.newPassword")}
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 rounded-[14px] border-[#DDE6ED] bg-white text-foreground focus-visible:border-primary"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="font-semibold text-foreground">
                  {t("auth.confirmPassword")}
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  className="h-12 rounded-[14px] border-[#DDE6ED] bg-white text-foreground focus-visible:border-primary"
                  required
                />
              </div>

              {error && <p className="text-sm font-medium text-danger">{error}</p>}

              <AppButton type="submit" size="xl" disabled={submitting} className="w-full">
                {submitting ? t("auth.saving") : t("auth.resetSubmit")}
              </AppButton>
            </form>
          )}
        </div>
      </div>

      <Link
        to="/auth"
        className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t("auth.backToSignIn")}
      </Link>
    </div>
  );
};

export default ResetPassword;
