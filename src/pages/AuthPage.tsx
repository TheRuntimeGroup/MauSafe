import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Check,
  KeyRound,
  LoaderCircle,
  LogIn,
  Mail,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { supabase } from "@/integrations/supabase/client";
import { sendLoginOtp, verifyLoginOtp } from "@/lib/otp";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AccessibilityQuickSettings } from "@/components/AccessibilityQuickSettings";
import { AppButton } from "@/components/ui/app-button";
import { EmailOtpInput } from "@/components/EmailOtpInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AuthPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  function toAuthError(code: string): string {
    switch (code) {
      case "ACCOUNT_NOT_FOUND":
        return t("auth.otpAccountNotFound");
      case "EXPIRED_CODE":
        return t("otp.expired");
      case "INVALID_CODE":
        return t("auth.otpInvalid");
      case "RATE_LIMITED":
        return t("otp.rateLimited");
      case "EMAIL_NOT_CONFIGURED":
        return t("auth.otpSendFailed");
      default:
        return t("auth.genericError");
    }
  }

  async function requestOtp() {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError(t("auth.emailRequired"));
      return;
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError(t("auth.emailInvalid"));
      return;
    }

    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      await sendLoginOtp(trimmedEmail);
      setCodeSent(true);
      setOtpCode("");
      setCooldown(60);
      setNotice(t("auth.otpSent", { email: trimmedEmail }));
    } catch (error) {
      setError(error instanceof Error ? toAuthError(error.message) : t("auth.genericError"));
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtpCode(submittedCode = otpCode) {
    if (submittedCode.length !== 6) {
      setError(t("auth.otpRequired"));
      return;
    }
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      const { email: verifiedEmail, tempPassword } = await verifyLoginOtp({
        email: email.trim().toLowerCase(),
        code: submittedCode,
      });

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: verifiedEmail,
        password: tempPassword,
      });

      if (signInError) {
        setError(t("auth.genericError"));
        return;
      }

      navigate("/", { replace: true });
    } catch (error) {
      setError(error instanceof Error ? toAuthError(error.message) : t("auth.genericError"));
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    if (codeSent) {
      void verifyOtpCode();
    } else {
      void requestOtp();
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-dots opacity-40" />
      </div>

      <header className="relative z-10 flex items-center justify-between gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
        <Link to="/" aria-label={t("auth.back")} className="inline-flex shrink-0 items-center rounded-xl">
          <Logo variant="full" className="h-10 w-32" />
        </Link>
        <div className="flex items-center gap-2">
          <AccessibilityQuickSettings />
          <LanguageSwitcher compact />
        </div>
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
                          readOnly={codeSent}
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder="you@example.com"
                          className="h-12 rounded-[14px] border-[#DDE6ED] bg-white pl-11 text-foreground focus-visible:border-primary"
                          required
                        />
                      </div>
                    </div>

                    {Boolean(codeSent) && (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-foreground">{t("auth.otpLabel")}</p>
                        <EmailOtpInput value={otpCode} onChange={setOtpCode} onComplete={(code) => {
                          setOtpCode(code);
                          void verifyOtpCode(code);
                        }} disabled={loading} hasError={Boolean(error)} />
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

                    <AppButton type="submit" size="xl" disabled={loading || (codeSent && otpCode.length !== 6)} className="w-full">
                      {loading ? (
                        <>
                          <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                          {t("common.loading")}
                        </>
                      ) : (
                        <>
                          {codeSent ? t("auth.verifyCode") : t("auth.sendCode")}
                          <ArrowRight className="h-5 w-5" aria-hidden="true" />
                        </>
                      )}
                    </AppButton>
                  </form>

                  {codeSent && (
                    <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
                      <button
                        type="button"
                        onClick={requestOtp}
                        disabled={loading || cooldown > 0}
                        className="rounded-lg px-2 py-1.5 font-bold text-primary transition-colors hover:underline disabled:text-muted-foreground disabled:no-underline"
                      >
                        {cooldown > 0 ? t("otp.resendIn", { seconds: cooldown }) : t("otp.resend")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCodeSent(false);
                          setOtpCode("");
                          setCooldown(0);
                          setNotice(null);
                          setError(null);
                        }}
                        className="rounded-lg px-2 py-1.5 font-semibold text-muted-foreground transition-colors hover:text-primary"
                      >
                        {t("otp.changeEmail")}
                      </button>
                    </div>
                  )}

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

          <div className="mx-auto mt-5 flex max-w-md items-start gap-3 rounded-2xl border border-[#DDE6ED] bg-white/70 px-4 py-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E9F6EF] text-[#0E7A4D]">
              <ShieldCheck className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
            </span>
            <p className="flex-1 text-left text-xs leading-relaxed text-muted-foreground">{t("auth.privacyNote")}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
