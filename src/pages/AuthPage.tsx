import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LoaderCircle, ShieldCheck } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { supabase } from "@/integrations/supabase/client";
import { AppButton } from "@/components/ui/app-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "sign_in" | "sign_up";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AuthPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const redirectTo = new URL("/auth/callback", window.location.origin).href;
  const resetUrl = new URL("/reset-password", window.location.origin).href;

  function toMessage(message: string): string {
    if (/invalid login credentials/i.test(message)) return t("auth.invalidCredentials");
    if (/already registered/i.test(message)) return t("auth.alreadyRegistered");
    if (/password should be at least/i.test(message)) return t("auth.passwordTooShort");
    return t("auth.genericError");
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
    setConfirmation("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(t("auth.emailRequired"));
      return;
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError(t("auth.emailInvalid"));
      return;
    }
    if (!password) {
      setError(t("auth.passwordRequired"));
      return;
    }
    if (mode === "sign_up" && password.length < 8) {
      setError(t("auth.passwordTooShort"));
      return;
    }
    if (mode === "sign_up" && password !== confirmation) {
      setError(t("auth.passwordMismatch"));
      return;
    }

    setLoading(true);

    if (mode === "sign_in") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (signInError) {
        setError(toMessage(signInError.message));
        setLoading(false);
        return;
      }
      navigate("/", { replace: true });
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: { emailRedirectTo: redirectTo },
    });
    setLoading(false);

    if (signUpError) {
      setError(toMessage(signUpError.message));
      return;
    }

    if (data.session) {
      navigate("/", { replace: true });
      return;
    }

    setNotice(t("auth.checkEmail"));
    setMode("sign_in");
    setPassword("");
    setConfirmation("");
  }

  async function handleForgot() {
    const trimmedEmail = email.trim();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError(t("auth.emailInvalid"));
      return;
    }

    setError(null);
    setNotice(null);
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: resetUrl,
    });
    setLoading(false);

    if (resetError) {
      setError(toMessage(resetError.message));
      return;
    }

    setNotice(t("auth.checkEmail"));
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="overflow-hidden rounded-[1.75rem] border border-[#DDE6ED] bg-white shadow-premium">
        <div className="flex items-center gap-3 border-b border-foreground/[0.07] bg-[#F6F9FC] px-6 py-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0D2B45] text-white">
            <ShieldCheck className="h-6 w-6" strokeWidth={1.9} aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-display text-xl font-extrabold tracking-tight text-foreground">
              {t("auth.title")}
            </h1>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t("auth.subtitle")}</p>
          </div>
        </div>

        <div className="px-6 py-7 sm:px-8 sm:py-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold text-foreground">
                {t("auth.emailLabel")}
              </Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 rounded-[14px] border-[#DDE6ED] bg-white text-foreground focus-visible:border-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="password" className="font-semibold text-foreground">
                  {t("auth.passwordLabel")}
                </Label>
                {mode === "sign_in" && (
                  <button
                    type="button"
                    onClick={handleForgot}
                    disabled={loading}
                    className="text-xs font-bold text-primary transition-colors hover:underline disabled:opacity-50"
                  >
                    {t("auth.forgotPassword")}
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "sign_in" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 rounded-[14px] border-[#DDE6ED] bg-white text-foreground focus-visible:border-primary"
                required
              />
            </div>

            {mode === "sign_up" && (
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
            )}

            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            {notice && (
              <p className="rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground">
                {notice}
              </p>
            )}

            <AppButton type="submit" size="xl" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                  {t("common.loading")}
                </>
              ) : mode === "sign_in" ? (
                t("auth.signIn")
              ) : (
                t("auth.signUp")
              )}
            </AppButton>
          </form>

          <div className="mt-6 text-center">
            {mode === "sign_in" ? (
              <button
                type="button"
                onClick={() => switchMode("sign_up")}
                className="text-sm font-bold text-primary transition-colors hover:underline"
              >
                {t("auth.noAccount")}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => switchMode("sign_in")}
                className="text-sm font-bold text-primary transition-colors hover:underline"
              >
                {t("auth.haveAccount")}
              </button>
            )}
          </div>
        </div>
      </div>

      <Link
        to="/"
        className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t("auth.back")}
      </Link>
    </div>
  );
};

export default AuthPage;
