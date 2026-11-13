import { useEffect, useState } from "react";
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
import { sendOtp, verifySignup } from "@/lib/otp";
import { Logo } from "@/components/Logo";
import { OtpVerificationPanel } from "@/components/OtpVerificationPanel";
import { AppButton } from "@/components/ui/app-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Mode = "sign_in" | "sign_up";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_SECONDS = 30;

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
  const [finish, setFinish] = useState<"form" | "verifyOtp">("form");
  const [otpCode, setOtpCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const resetUrl = new URL("/reset-password", window.location.origin).href;

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  function toMessage(message: string): string {
    if (/invalid login credentials/i.test(message)) return t("auth.invalidCredentials");
    if (/already registered/i.test(message)) return t("auth.alreadyRegistered");
    if (/password should be at least/i.test(message)) return t("auth.passwordTooShort");
    return t("auth.genericError");
  }

  function toOtpError(code: string): string {
    switch (code) {
      case "EMAIL_TAKEN":
        return t("auth.alreadyRegistered");
      case "EXPIRED_CODE":
        return t("otp.expired");
      case "INVALID_CODE":
        return t("otp.wrong");
      case "PASSWORD_TOO_SHORT":
        return t("auth.passwordTooShort");
      case "INVALID_EMAIL":
        return t("auth.emailInvalid");
      case "EMAIL_NOT_CONFIGURED":
        return t("otp.notConfigured");
      default:
        return t("auth.genericError");
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
    setConfirmation("");
    setShowPassword(false);
    setShowConfirmation(false);
    setFinish("form");
    setOtpCode("");
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

    if (mode === "sign_in") {
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
      return;
    }

    setLoading(true);
    try {
      await sendOtp(trimmedEmail);
      setOtpCode("");
      setCooldown(RESEND_SECONDS);
      setFinish("verifyOtp");
    } catch (error) {
      setError(error instanceof Error ? toOtpError(error.message) : t("auth.genericError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setError(null);
    setSendingOtp(true);
    try {
      await sendOtp(email.trim());
      setOtpCode("");
      setCooldown(RESEND_SECONDS);
    } catch (error) {
      setError(error instanceof Error ? toOtpError(error.message) : t("auth.genericError"));
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    if (otpCode.length !== 6) {
      setError(t("otp.wrong"));
      return;
    }

    setError(null);
    setVerifying(true);

    try {
      await verifySignup({ email: email.trim(), code: otpCode, password });

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError || !signInData.user) {
        setError(t("auth.genericError"));
        return;
      }

      navigate("/", { replace: true });
    } catch (error) {
      setError(error instanceof Error ? toOtpError(error.message) : t("auth.genericError"));
    } finally {
      setVerifying(false);
    }
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
      "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold transition-all",
      active
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-muted-foreground hover:text-foreground",
    );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
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
              {finish === "verifyOtp" ? (
                <OtpVerificationPanel
                  eyebrow={t("otp.eyebrow")}
                  title={t("otp.title")}
                  subtitle={t("otp.subtitle", { email: email.trim() })}
                  code={otpCode}
                  onCodeChange={(value) => {
                    setOtpCode(value);
                    setError(null);
                  }}
                  onSubmit={handleVerifyOtp}
                  submitting={verifying}
                  error={error}
                  verifyLabel={t("otp.verify")}
                  resendLabel={cooldown > 0 ? t("otp.resendIn", { seconds: cooldown }) : t("otp.resend")}
                  resendDisabled={cooldown > 0 || sendingOtp}
                  onResend={handleResendOtp}
                  changeEmailLabel={t("otp.changeEmail")}
                  onChangeEmail={() => {
                    setFinish("form");
                    setError(null);
                    setOtpCode("");
                  }}
                  backLabel={t("common.back")}
                  onBack={() => {
                    setFinish("form");
                    setError(null);
                    setOtpCode("");
                  }}
                />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-[#E8E4DA] bg-muted p-1.5">
                    <button
                      type="button"
                      onClick={() => switchMode("sign_in")}
                      className={toggleClass(mode === "sign_in")}
                      aria-pressed={mode === "sign_in"}
                    >
                      <LogIn className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                      {t("auth.signIn")}
                    </button>
                    <button
                      type="button"
                      onClick={() => switchMode("sign_up")}
                      className={toggleClass(mode === "sign_up")}
                      aria-pressed={mode === "sign_up"}
                    >
                      <UserPlus className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                      {t("auth.signUp")}
                    </button>
                  </div>

                  <div className="mb-7 mt-8">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0D2B45] text-white shadow-premium">
                      {mode === "sign_in" ? (
                        <LogIn className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                      ) : (
                        <UserPlus className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                      )}
                    </span>
                    <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-[1.7rem]">
                      {mode === "sign_in" ? t("auth.title") : t("auth.signUp")}
                    </h1>
                    <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                      {mode === "sign_in" ? t("auth.subtitle") : t("auth.signUpSubtitle")}
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
                        <Lock
                          className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete={mode === "sign_in" ? "current-password" : "new-password"}
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

                    {mode === "sign_up" && (
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="font-semibold text-foreground">
                          {t("auth.confirmPassword")}
                        </Label>
                        <div className="relative">
                          <Lock
                            className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <Input
                            id="confirm-password"
                            type={showConfirmation ? "text" : "password"}
                            autoComplete="new-password"
                            value={confirmation}
                            onChange={(event) => setConfirmation(event.target.value)}
                            className="h-12 rounded-[14px] border-[#DDE6ED] bg-white pl-11 pr-12 text-foreground focus-visible:border-primary"
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
                      ) : (
                        <>
                          {mode === "sign_in" ? t("auth.signIn") : t("auth.signUp")}
                          <ArrowRight className="h-5 w-5" aria-hidden="true" />
                        </>
                      )}
                    </AppButton>
                  </form>

                  <p className="mt-6 text-center text-sm font-medium text-muted-foreground">
                    {mode === "sign_in" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
                    <button
                      type="button"
                      onClick={() => switchMode(mode === "sign_in" ? "sign_up" : "sign_in")}
                      className="font-extrabold text-primary transition-colors hover:underline"
                    >
                      {mode === "sign_in" ? t("auth.signUp") : t("auth.signIn")}
                    </button>
                  </p>

                  <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs leading-relaxed text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                    {t("auth.privacyNote")}
                  </p>
                </>
              )}
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
  );
};

export default AuthPage;
