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
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background lg:flex-row">
      {/* Brand panel (desktop) */}
      <aside className="relative isolate hidden w-[46%] max-w-2xl shrink-0 flex-col justify-between overflow-hidden bg-[#0D2B45] p-12 text-white lg:flex xl:p-16">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full text-white/[0.05]"
          aria-hidden="true"
        >
          <defs>
            <pattern id="auth-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" stroke="currentColor" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-grid)" />
        </svg>
        <svg
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 text-sky-300/10"
          viewBox="0 0 220 220"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="110" cy="110" r="82" stroke="currentColor" />
          <circle cx="110" cy="110" r="54" stroke="currentColor" />
          <path d="M16 150C60 130 76 76 126 86C168 94 178 48 222 42" stroke="currentColor" />
        </svg>
        <svg
          className="pointer-events-none absolute -bottom-28 -left-28 h-80 w-80 text-emerald-300/[0.08]"
          viewBox="0 0 220 220"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="110" cy="110" r="82" stroke="currentColor" />
          <circle cx="110" cy="110" r="54" stroke="currentColor" />
        </svg>

        <Link to="/" className="relative z-10 flex w-fit items-center gap-4">
          <Logo variant="inverse" className="h-14 w-14" />
          <div>
            <p className="font-display text-3xl font-extrabold leading-none tracking-tight">
              {t("app.name")}
            </p>
            <p className="mt-1.5 text-xs font-medium text-sky-200">{t("app.badge")}</p>
          </div>
        </Link>

        <div className="relative z-10">
          <div className="mb-6 flex h-1.5 w-20 overflow-hidden rounded-full" aria-hidden="true">
            <span className="flex-1 bg-[#EA3B3B]" />
            <span className="flex-1 bg-[#1D3B8C]" />
            <span className="flex-1 bg-[#F7C600]" />
            <span className="flex-1 bg-[#0E7A4D]" />
          </div>
          <h2 className="max-w-md font-display text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] xl:text-5xl">
            {t("app.heroTitle")}
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-slate-300">
            {t("app.heroSubtitle")}
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3.5 backdrop-blur-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
              <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden="true" />
            </span>
            <p className="text-xs leading-relaxed text-slate-200">{t("home.trustBody")}</p>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300/70">
              {t("app.name")}
            </span>
            <LanguageSwitcher compact />
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <div className="relative flex min-h-screen flex-1 flex-col">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 bg-dots opacity-30" />
        </div>

        <header className="relative z-10 flex items-center justify-between gap-3 bg-[#0D2B45] px-5 py-4 text-white lg:hidden">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo variant="inverse" className="h-10 w-10" />
            <div>
              <p className="font-display text-lg font-extrabold leading-none tracking-tight">
                {t("app.name")}
              </p>
              <p className="mt-0.5 text-[10px] font-medium text-sky-200">{t("app.badge")}</p>
            </div>
          </Link>
          <LanguageSwitcher compact />
        </header>

        <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-10 sm:px-10 sm:py-12">
          <div className="w-full max-w-lg">
            <Link
              to="/"
              className="mb-7 inline-flex h-11 w-11 items-center justify-center rounded-full border border-foreground/10 bg-white text-muted-foreground shadow-sm transition-colors hover:border-primary/30 hover:text-primary"
              aria-label={t("auth.back")}
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Link>

            <div className="motion-safe:animate-fade-in-up">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                {`${t("app.name")} · ${new Date().getFullYear()}`}
              </p>
              <h1 className="mt-3 font-display text-[1.9rem] font-extrabold leading-[1.1] tracking-[-0.04em] text-foreground sm:text-[2.35rem]">
                {mode === "sign_in" ? t("auth.title") : t("auth.signUp")}
              </h1>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                {t("auth.subtitle")}
              </p>

              <div className="mt-7 grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1.5">
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

              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
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
                    className="h-14 rounded-2xl border-input bg-white text-foreground shadow-sm focus-visible:border-primary"
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
                      className="h-14 rounded-2xl border-input bg-white pr-12 text-foreground shadow-sm focus-visible:border-primary"
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
                        placeholder="••••••••"
                        className="h-14 rounded-2xl border-input bg-white pr-12 text-foreground shadow-sm focus-visible:border-primary"
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

              <p className="mt-6 text-center text-sm font-medium text-muted-foreground">
                {mode === "sign_in" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
                <button
                  type="button"
                  onClick={() => switchMode(mode === "sign_in" ? "sign_up" : "sign_in")}
                  className="font-bold text-primary hover:underline"
                >
                  {mode === "sign_in" ? t("auth.signUp") : t("auth.signIn")}
                </button>
              </p>

              <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs leading-relaxed text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                {t("onboarding.privacy")}
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuthPage;
