import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AppButton } from "@/components/ui/app-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AuthPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const resetUrl = new URL("/reset-password", window.location.origin).href;

  function toMessage(message: string): string {
    if (/invalid login credentials/i.test(message)) return t("auth.invalidCredentials");
    if (/already registered/i.test(message)) return t("auth.alreadyRegistered");
    if (/password should be at least/i.test(message)) return t("auth.passwordTooShort");
    return t("auth.genericError");
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

    setLoading(true);
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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-dots opacity-40" />
      </div>

      <header className="relative z-10 flex items-center justify-between gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("auth.back")}
        </Link>
        <LanguageSwitcher compact />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-5xl">
          <div className="overflow-hidden rounded-[2rem] border border-[#E8E4DA] bg-card shadow-premium motion-safe:animate-fade-in-up">
            <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
              <aside className="relative isolate hidden overflow-hidden bg-[#0D2B45] p-10 text-white lg:flex lg:flex-col lg:justify-between">
                <svg
                  className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 text-sky-300/10"
                  viewBox="0 0 220 220"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle cx="110" cy="110" r="82" stroke="currentColor" />
                  <circle cx="110" cy="110" r="54" stroke="currentColor" />
                  <path d="M16 150C60 130 76 76 126 86C168 94 178 48 222 42" stroke="currentColor" />
                </svg>
                <svg
                  className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 text-emerald-300/[0.07]"
                  viewBox="0 0 220 220"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle cx="110" cy="110" r="82" stroke="currentColor" />
                  <circle cx="110" cy="110" r="54" stroke="currentColor" />
                </svg>

                <div className="relative flex items-center gap-3">
                  <Logo className="h-11 w-11" />
                  <div>
                    <p className="font-display text-xl font-extrabold tracking-tight">{t("app.name")}</p>
                    <p className="text-[11px] font-medium text-sky-200">{t("app.badge")}</p>
                  </div>
                </div>

                <div className="relative">
                  <div className="mb-5 flex h-1 w-16 overflow-hidden rounded-full" aria-hidden="true">
                    <span className="flex-1 bg-[#EA3B3B]" />
                    <span className="flex-1 bg-[#1D3B8C]" />
                    <span className="flex-1 bg-[#F7C600]" />
                    <span className="flex-1 bg-[#0E7A4D]" />
                  </div>
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

                <div className="px-6 py-7 sm:px-10 sm:py-9">
                  <div className="mb-7">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0D2B45] text-white shadow-premium">
                      <LogIn className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                    </span>
                    <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-[1.7rem]">
                      {t("auth.title")}
                    </h1>
                    <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                      {t("auth.subtitle")}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-semibold text-foreground">
                        {t("auth.emailLabel")}
                      </Label>
                      <div className="relative">
                        <Mail
                          className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <Input
                          id="email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          autoFocus
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder="you@example.com"
                          className="h-12 rounded-[14px] border-[#DDE6ED] bg-white pl-11 text-foreground focus-visible:border-primary"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="password" className="font-semibold text-foreground">
                          {t("auth.passwordLabel")}
                        </Label>
                        <button
                          type="button"
                          onClick={handleForgot}
                          disabled={loading}
                          className="text-xs font-bold text-primary transition-colors hover:underline disabled:opacity-50"
                        >
                          {t("auth.forgotPassword")}
                        </button>
                      </div>
                      <div className="relative">
                        <Lock
                          className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          placeholder="••••••••"
                          className="h-12 rounded-[14px] border-[#DDE6ED] bg-white pl-11 pr-12 text-foreground focus-visible:border-primary"
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
                      ) : (
                        <>
                          {t("auth.signIn")}
                          <ArrowRight className="h-5 w-5" aria-hidden="true" />
                        </>
                      )}
                    </AppButton>
                  </form>

                  <p className="mt-6 text-center text-sm font-medium text-muted-foreground">
                    {t("auth.noAccount")}{" "}
                    <Link
                      to="/welcome"
                      className="inline-flex items-center gap-1.5 font-extrabold text-primary transition-colors hover:underline"
                    >
                      <UserPlus className="h-4 w-4" aria-hidden="true" />
                      {t("auth.signUp")}
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
            {t("auth.privacyNote")}
          </p>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
