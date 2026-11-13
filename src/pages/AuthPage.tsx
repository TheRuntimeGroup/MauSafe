import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { AppButton } from "@/components/ui/app-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Mode = "sign_in" | "sign_up";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AuthPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
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
    setShowPassword(false);
    setShowConfirmation(false);
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
    setPassword("");
    setConfirmation("");
    setShowPassword(false);
    setShowConfirmation(false);
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

  const toggleClass = (active: boolean) =>
    cn(
      "rounded-xl px-4 py-2.5 text-sm font-bold transition-all",
      active
        ? "bg-white text-foreground shadow-sm"
        : "text-muted-foreground hover:text-foreground",
    );

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-dots opacity-30" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-4xl space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-[#DDE6ED] bg-white shadow-premium motion-safe:animate-fade-in-up">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
          <aside className="relative isolate hidden overflow-hidden bg-[#0D2B45] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <svg
              className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 text-sky-300/10"
              viewBox="0 0 220 220"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="110" cy="110" r="82" stroke="currentColor" />
              <circle cx="110" cy="110" r="54" stroke="currentColor" />
              <path d="M16 150C60 130 76 76 126 86C168 94 178 48 222 42" stroke="currentColor" />
            </svg>

            <div className="relative flex items-center gap-3">
              <Logo className="h-11 w-11" />
              <div>
                <p className="font-display text-xl font-extrabold tracking-tight">{t("app.name")}</p>
                <p className="text-[11px] font-medium text-sky-200">{t("app.badge")}</p>
              </div>
            </div>

            <div className="relative">
              <h2 className="max-w-sm font-display text-[2rem] font-extrabold leading-[1.12] tracking-[-0.04em]">
                {t("app.heroTitle")}
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300">{t("app.heroSubtitle")}</p>
            </div>

            <div className="relative flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3.5 backdrop-blur-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden="true" />
              </span>
              <p className="text-xs leading-relaxed text-slate-200">{t("home.trustBody")}</p>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="flex items-center gap-3 bg-[#0D2B45] px-6 py-5 text-white lg:hidden">
              <Logo className="h-9 w-9" />
              <div>
                <p className="font-display text-lg font-extrabold tracking-tight">{t("app.name")}</p>
                <p className="text-[11px] font-medium text-sky-200">{t("app.tagline")}</p>
              </div>
            </div>

            <div className="px-6 py-7 sm:px-9 sm:py-9">
              <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1.5">
                <button
                  type="button"
                  onClick={() => switchMode("sign_in")}
                  className={toggleClass(mode === "sign_in")}
                  aria-pressed={mode === "sign_in"}
                >
                  {t("auth.signIn")}
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("sign_up")}
                  className={toggleClass(mode === "sign_up")}
                  aria-pressed={mode === "sign_up"}
                >
                  {t("auth.signUp")}
                </button>
              </div>

              <div className="mb-6 mt-7">
                <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
                  {mode === "sign_in" ? t("auth.title") : t("auth.signUp")}
                </h1>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t("auth.subtitle")}</p>
              </div>

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
                    autoFocus
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
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
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={mode === "sign_in" ? "current-password" : "new-password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      className="h-12 rounded-[14px] border-[#DDE6ED] bg-white pr-12 text-foreground focus-visible:border-primary"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary"
                      aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                    >
                      {showPassword ? (
                        <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden="true" />
                      ) : (
                        <Eye className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {mode === "sign_up" && (
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="font-semibold text-foreground">
                      {t("auth.confirmPassword")}
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmation ? "text" : "password"}
                        autoComplete="new-password"
                        value={confirmation}
                        onChange={(event) => setConfirmation(event.target.value)}
                        className="h-12 rounded-[14px] border-[#DDE6ED] bg-white pr-12 text-foreground focus-visible:border-primary"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmation((value) => !value)}
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary"
                        aria-label={showConfirmation ? t("auth.hidePassword") : t("auth.showPassword")}
                      >
                        {showConfirmation ? (
                          <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden="true" />
                        ) : (
                          <Eye className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger/[0.06] px-4 py-3 text-sm font-medium text-danger"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{error}</span>
                  </div>
                )}
                {notice && (
                  <div
                    role="status"
                    className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                    <span>{notice}</span>
                  </div>
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
            </div>
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
    </div>
  );
};

export default AuthPage;
