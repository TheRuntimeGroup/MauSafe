import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Accessibility,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Captions,
  Check,
  Ear,
  Eye,
  EyeOff,
  Heart,
  LoaderCircle,
  LogIn,
  Mail,
  PartyPopper,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { supabase } from "@/integrations/supabase/client";
import { saveOnboardingProfile, type AccessibilityNeed } from "@/lib/profile";
import { sendOtp, verifySignup } from "@/lib/otp";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AccessibilityQuickSettings } from "@/components/AccessibilityQuickSettings";
import { OtpVerificationPanel } from "@/components/OtpVerificationPanel";
import { AppButton } from "@/components/ui/app-button";
import { cn } from "@/lib/utils";

const RESEND_SECONDS = 30;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DRAFT_KEY = "mausafe.onboarding.draft";

type StepId =
  | "welcome"
  | "name"
  | "email"
  | "phone"
  | "accessibility"
  | "voice"
  | "password"
  | "review";

interface Draft {
  name: string;
  email: string;
  phone: string;
  needs: AccessibilityNeed[];
  voiceGuide: boolean;
}

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      name: typeof parsed.name === "string" ? parsed.name : "",
      email: typeof parsed.email === "string" ? parsed.email : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
      needs: Array.isArray(parsed.needs) ? parsed.needs : [],
      voiceGuide: Boolean(parsed.voiceGuide),
    };
  } catch {
    return null;
  }
}

function saveDraft(draft: Draft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // ignore storage errors
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore storage errors
  }
}

const Onboarding = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, profile, loading, profileLoading, refreshProfile } = useAuth();

  const [draft] = useState<Draft | null>(() => (user ? loadDraft() : null));
  const [hydrated, setHydrated] = useState(() => !draft);

  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState(() => draft?.name ?? profile?.full_name ?? "");
  const [email, setEmail] = useState(() => draft?.email ?? user?.email ?? "");
  const [phone, setPhone] = useState(() => draft?.phone ?? profile?.phone ?? "");
  const [needs, setNeeds] = useState<AccessibilityNeed[]>(
    () => draft?.needs ?? profile?.accessibility_needs ?? [],
  );
  const [voiceGuide, setVoiceGuide] = useState(
    () => draft?.voiceGuide ?? profile?.voice_guide ?? false,
  );
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [finish, setFinish] = useState<"none" | "verifyOtp" | "done">("none");

  const redirectedRef = useRef(false);

  const steps = useMemo<StepId[]>(() => {
    const list: StepId[] = [];
    if (!user) list.push("welcome");
    list.push("name");
    if (!user) list.push("email");
    list.push("phone");
    list.push("accessibility");
    if (needs.includes("visual")) list.push("voice");
    if (!user) list.push("password");
    list.push("review");
    return list;
  }, [user, needs]);

  // Jump straight to the review step when returning after email confirmation.
  useEffect(() => {
    if (!hydrated && steps.length) {
      setStepIndex(steps.length - 1);
      setHydrated(true);
    }
  }, [hydrated, steps.length]);

  // Keep the index in range if a step is removed (e.g. unselecting "visual").
  useEffect(() => {
    if (stepIndex >= steps.length) {
      setStepIndex(Math.max(0, steps.length - 1));
    }
  }, [stepIndex, steps.length]);

  // Already onboarded users shouldn't stay on this page.
  useEffect(() => {
    if (redirectedRef.current) return;
    if (loading || profileLoading) return;
    if (user && profile?.onboarding_completed) {
      redirectedRef.current = true;
      navigate("/", { replace: true });
    }
  }, [user, profile, loading, profileLoading, navigate]);

  // Countdown for the resend button.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const currentStep: StepId = steps[stepIndex] ?? steps[steps.length - 1];
  const isProfileMode = Boolean(user);

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

  function toggleNeed(id: AccessibilityNeed) {
    setError(null);
    setNeeds((current) => {
      if (id === "none") return current.includes("none") ? [] : ["none"];
      const next = current.filter((item) => item !== "none");
      return next.includes(id) ? next.filter((item) => item !== id) : [...next, id];
    });
  }

  function phoneDigits(): string {
    return phone.replace(/\D/g, "");
  }

  function validateStep(step: StepId): string | null {
    if (step === "name" && !name.trim()) return t("onboarding.nameRequired");
    if (step === "email" && !EMAIL_PATTERN.test(email.trim())) return t("auth.emailInvalid");
    if (step === "phone" && phoneDigits().length < 7) return t("onboarding.phone.invalid");
    if (step === "accessibility" && needs.length === 0) return t("onboarding.accessibilityRequired");
    return null;
  }

  function goNext() {
    const stepError = validateStep(currentStep);
    if (stepError) {
      setError(stepError);
      return;
    }
    setError(null);
    if (stepIndex < steps.length - 1) setStepIndex((index) => index + 1);
  }

  function goBack() {
    setError(null);
    if (stepIndex > 0) setStepIndex((index) => index - 1);
  }

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setError(null);

    const stepError = validateStep(currentStep);
    if (currentStep !== "review" && stepError) {
      setError(stepError);
      return;
    }

    setSubmitting(true);

    const input = {
      fullName: name.trim(),
      phone: phone.trim(),
      accessibilityNeeds: needs,
      voiceGuide,
    };

    try {
      if (isProfileMode) {
        if (!user) return;
        await saveOnboardingProfile(user.id, input);
        clearDraft();
        await refreshProfile();
        setFinish("done");
        return;
      }

      if (!EMAIL_PATTERN.test(email.trim())) {
        setError(t("auth.emailInvalid"));
        return;
      }
      if (password.length < 8) {
        setError(t("auth.passwordTooShort"));
        return;
      }
      if (password !== confirmation) {
        setError(t("auth.passwordMismatch"));
        return;
      }

      saveDraft({ name: name.trim(), email: email.trim(), phone: phone.trim(), needs, voiceGuide });
      await sendOtp(email.trim());
      setOtpCode("");
      setCooldown(RESEND_SECONDS);
      setFinish("verifyOtp");
    } catch (error) {
      setError(error instanceof Error ? toOtpError(error.message) : t("auth.genericError"));
    } finally {
      setSubmitting(false);
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

      await saveOnboardingProfile(signInData.user.id, {
        fullName: name.trim(),
        phone: phone.trim(),
        accessibilityNeeds: needs,
        voiceGuide,
      });
      clearDraft();
      await refreshProfile();
      setFinish("done");
    } catch (error) {
      setError(error instanceof Error ? toOtpError(error.message) : t("auth.genericError"));
    } finally {
      setVerifying(false);
    }
  }

  const accessOptions: {
    id: AccessibilityNeed;
    icon: LucideIcon;
    tone: string;
    title: string;
    body: string;
  }[] = [
    {
      id: "visual",
      icon: Eye,
      tone: "bg-sky-100 text-sky-700",
      title: t("onboarding.accessibility.visual.title"),
      body: t("onboarding.accessibility.visual.body"),
    },
    {
      id: "hearing",
      icon: Ear,
      tone: "bg-violet-100 text-violet-700",
      title: t("onboarding.accessibility.hearing.title"),
      body: t("onboarding.accessibility.hearing.body"),
    },
    {
      id: "motor",
      icon: Accessibility,
      tone: "bg-amber-100 text-amber-700",
      title: t("onboarding.accessibility.motor.title"),
      body: t("onboarding.accessibility.motor.body"),
    },
    {
      id: "none",
      icon: Sparkles,
      tone: "bg-emerald-100 text-emerald-700",
      title: t("onboarding.accessibility.none.title"),
      body: t("onboarding.accessibility.none.body"),
    },
  ];

  const needsLabel = (id: AccessibilityNeed) =>
    accessOptions.find((option) => option.id === id)?.title ?? id;

  if (loading || profileLoading || !hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
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
                  {finish === "none" && (
                    <div className="mb-7">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={goBack}
                          disabled={stepIndex === 0}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-foreground/[0.08] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                          aria-label={t("onboarding.back")}
                        >
                          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                          {stepIndex + 1} / {steps.length}
                        </span>
                      </div>
                      <div className="mt-4 flex gap-1.5" aria-hidden="true">
                        {steps.map((step, index) => (
                          <span
                            key={`${step}-${index}`}
                            className={cn(
                              "h-1.5 flex-1 rounded-full transition-colors duration-500",
                              index <= stepIndex ? "bg-primary" : "bg-muted",
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div key={`${currentStep}-${finish}`} className="motion-safe:animate-fade-in-up">
                    {finish === "verifyOtp" && (
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
                          setFinish("none");
                          setError(null);
                          setOtpCode("");
                          const emailIndex = steps.indexOf("email");
                          if (emailIndex >= 0) setStepIndex(emailIndex);
                        }}
                        backLabel={t("onboarding.back")}
                        onBack={() => {
                          setFinish("none");
                          setError(null);
                          setOtpCode("");
                        }}
                      />
                    )}

                    {finish === "done" && (
                      <FinishScreen
                        icon={<PartyPopper className="h-9 w-9" strokeWidth={1.8} aria-hidden="true" />}
                        title={t("onboarding.success.title")}
                        body={t("onboarding.success.body")}
                        hint={t("onboarding.success.hint")}
                        ctaLabel={t("onboarding.success.cta")}
                        ctaTo="/"
                      />
                    )}

                    {finish === "none" && currentStep === "welcome" && (
                      <WelcomeStep
                        onStart={goNext}
                        startLabel={t("onboarding.welcome.start")}
                        haveAccount={t("onboarding.haveAccount")}
                        signInLabel={t("onboarding.signIn")}
                        title={t("onboarding.welcome.title")}
                        body={t("onboarding.welcome.body")}
                      />
                    )}

                    {finish === "none" && currentStep === "name" && (
                      <TextStep
                        eyebrow={t("onboarding.name.eyebrow")}
                        title={t("onboarding.name.title")}
                        subtitle={t("onboarding.name.subtitle")}
                        value={name}
                        onChange={(value) => {
                          setName(value);
                          setError(null);
                        }}
                        placeholder={t("onboarding.name.placeholder")}
                        icon={<User className="h-5 w-5" aria-hidden="true" />}
                        onContinue={goNext}
                        continueLabel={t("onboarding.continue")}
                        autoFocus
                      />
                    )}

                    {finish === "none" && currentStep === "email" && (
                      <TextStep
                        eyebrow={t("onboarding.email.eyebrow")}
                        title={t("onboarding.email.title")}
                        subtitle={t("onboarding.email.subtitle")}
                        value={email}
                        onChange={(value) => {
                          setEmail(value);
                          setError(null);
                        }}
                        placeholder={t("onboarding.email.placeholder")}
                        icon={<Mail className="h-5 w-5" aria-hidden="true" />}
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        onContinue={goNext}
                        continueLabel={t("onboarding.continue")}
                        autoFocus
                      />
                    )}

                    {finish === "none" && currentStep === "phone" && (
                      <TextStep
                        eyebrow={t("onboarding.phone.eyebrow")}
                        title={t("onboarding.phone.title")}
                        subtitle={t("onboarding.phone.subtitle")}
                        value={phone}
                        onChange={(value) => {
                          setPhone(value);
                          setError(null);
                        }}
                        placeholder={t("onboarding.phone.placeholder")}
                        icon={<Phone className="h-5 w-5" aria-hidden="true" />}
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        onContinue={goNext}
                        continueLabel={t("onboarding.continue")}
                        autoFocus
                      />
                    )}

                    {finish === "none" && currentStep === "accessibility" && (
                      <AccessibilityStep
                        eyebrow={t("onboarding.accessibility.eyebrow")}
                        title={t("onboarding.accessibility.title")}
                        subtitle={t("onboarding.accessibility.subtitle")}
                        options={accessOptions}
                        selected={needs}
                        onToggle={toggleNeed}
                        onContinue={goNext}
                        continueLabel={t("onboarding.continue")}
                        motorNote={t("onboarding.motor.help")}
                        hearingNote={t("onboarding.hearing.help")}
                      />
                    )}

                    {finish === "none" && currentStep === "voice" && (
                      <VoiceStep
                        eyebrow={t("onboarding.voice.eyebrow")}
                        title={t("onboarding.voice.title")}
                        subtitle={t("onboarding.voice.subtitle")}
                        value={voiceGuide}
                        onChange={(value) => setVoiceGuide(value)}
                        yesTitle={t("onboarding.voice.yes.title")}
                        yesBody={t("onboarding.voice.yes.body")}
                        noTitle={t("onboarding.voice.no.title")}
                        noBody={t("onboarding.voice.no.body")}
                        comingSoon={t("onboarding.voice.coming")}
                      />
                    )}

                    {finish === "none" && currentStep === "password" && (
                      <PasswordStep
                        eyebrow={t("onboarding.password.eyebrow")}
                        title={t("onboarding.password.title")}
                        subtitle={t("onboarding.password.subtitle")}
                        password={password}
                        setPassword={setPassword}
                        confirmation={confirmation}
                        setConfirmation={setConfirmation}
                        showPassword={showPassword}
                        setShowPassword={setShowPassword}
                        onContinue={goNext}
                        continueLabel={t("onboarding.continue")}
                        placeholder={t("onboarding.password.placeholder")}
                        confirmPlaceholder={t("onboarding.password.confirm")}
                        showLabel={t("auth.showPassword")}
                        hideLabel={t("auth.hidePassword")}
                      />
                    )}

                    {finish === "none" && currentStep === "review" && (
                      <ReviewStep
                        eyebrow={t("onboarding.review.eyebrow")}
                        title={t("onboarding.review.title")}
                        subtitle={isProfileMode ? t("onboarding.signInToContinue") : t("onboarding.review.subtitle")}
                        name={name}
                        email={email}
                        phone={phone}
                        needs={needs}
                        voiceGuide={voiceGuide}
                        labels={{
                          name: t("onboarding.review.name"),
                          email: t("onboarding.review.email"),
                          phone: t("onboarding.review.phone"),
                          needs: t("onboarding.review.needs"),
                          voice: t("onboarding.review.voice"),
                          voiceOn: t("onboarding.review.voiceOn"),
                          voiceOff: t("onboarding.review.voiceOff"),
                          edit: t("onboarding.review.edit"),
                        }}
                        needsLabel={needsLabel}
                        onSubmit={handleSubmit}
                        submitting={submitting}
                        submitLabel={t("onboarding.submit")}
                        loadingLabel={t("onboarding.creating")}
                        onEdit={goBack}
                      />
                    )}
                  </div>

                  {finish === "none" && error && (
                    <div
                      role="alert"
                      className="mt-5 flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger/[0.06] px-4 py-3 text-sm font-medium text-danger"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <p className="mx-auto mt-5 flex max-w-md items-start gap-2.5 px-2 text-left text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
            <span>{t("onboarding.privacy")}</span>
          </p>
        </div>
      </main>
    </div>
  );
};

function WelcomeStep({
  onStart,
  startLabel,
  haveAccount,
  signInLabel,
  title,
  body,
}: {
  onStart: () => void;
  startLabel: string;
  haveAccount: string;
  signInLabel: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <h1 className="font-display text-[1.9rem] font-extrabold leading-[1.1] tracking-[-0.04em] text-foreground sm:text-[2.35rem]">
        {title}
      </h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">{body}</p>
      <AppButton size="xl" onClick={onStart} className="mt-8">
        {startLabel}
        <ArrowRight className="h-5 w-5" aria-hidden="true" />
      </AppButton>
      <div className="mt-6 border-t border-foreground/[0.08] pt-6">
        <p className="text-center text-sm font-medium text-muted-foreground">{haveAccount}</p>
        <Link to="/auth" className="mt-3 block">
          <AppButton size="lg" variant="outline" className="w-full">
            <LogIn className="h-4 w-4" aria-hidden="true" />
            {signInLabel}
          </AppButton>
        </Link>
      </div>
    </div>
  );
}

function TextStep({
  eyebrow,
  title,
  subtitle,
  value,
  onChange,
  placeholder,
  icon,
  onContinue,
  continueLabel,
  type = "text",
  inputMode,
  autoComplete,
  autoFocus,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: ReactNode;
  onContinue: () => void;
  continueLabel: string;
  type?: string;
  inputMode?: "text" | "email" | "tel" | "numeric";
  autoComplete?: string;
  autoFocus?: boolean;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onContinue();
      }}
    >
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-[-0.03em] text-foreground sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>

      <div className="mt-7">
        <div className="flex items-center gap-3 rounded-2xl border border-input bg-white px-4 shadow-sm transition-shadow focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
          <span className="shrink-0 text-muted-foreground">{icon}</span>
          <input
            autoFocus={autoFocus}
            type={type}
            inputMode={inputMode}
            autoComplete={autoComplete}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="h-14 min-w-0 flex-1 bg-transparent text-base font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground/70"
          />
        </div>
      </div>

      <AppButton type="submit" size="xl" className="mt-6">
        {continueLabel}
        <ArrowRight className="h-5 w-5" aria-hidden="true" />
      </AppButton>
    </form>
  );
}

function AccessibilityStep({
  eyebrow,
  title,
  subtitle,
  options,
  selected,
  onToggle,
  onContinue,
  continueLabel,
  motorNote,
  hearingNote,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  options: {
    id: AccessibilityNeed;
    icon: LucideIcon;
    tone: string;
    title: string;
    body: string;
  }[];
  selected: AccessibilityNeed[];
  onToggle: (id: AccessibilityNeed) => void;
  onContinue: () => void;
  continueLabel: string;
  motorNote: string;
  hearingNote: string;
}) {
  return (
    <div>
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-[-0.03em] text-foreground sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>

      <div className="mt-6 space-y-3">
        {options.map((option) => {
          const isSelected = selected.includes(option.id);
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onToggle(option.id)}
              aria-pressed={isSelected}
              className={cn(
                "flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/[0.04] ring-2 ring-primary/15"
                  : "border-input bg-white hover:border-primary/40 hover:bg-muted/50",
              )}
            >
              <span
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
                  isSelected ? "bg-primary text-primary-foreground" : option.tone,
                )}
                aria-hidden="true"
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-foreground">{option.title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{option.body}</span>
              </span>
              <span
                className={cn(
                  "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                  isSelected ? "border-primary bg-primary text-white" : "border-border bg-white text-transparent",
                )}
                aria-hidden="true"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>

      {selected.includes("motor") && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-relaxed text-emerald-900">
          <Heart className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{motorNote}</span>
        </div>
      )}
      {selected.includes("hearing") && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs leading-relaxed text-sky-900">
          <Eye className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{hearingNote}</span>
        </div>
      )}

      <AppButton size="xl" onClick={onContinue} disabled={selected.length === 0} className="mt-6">
        {continueLabel}
        <ArrowRight className="h-5 w-5" aria-hidden="true" />
      </AppButton>
    </div>
  );
}

function VoiceStep({
  eyebrow,
  title,
  subtitle,
  value,
  onChange,
  yesTitle,
  yesBody,
  noTitle,
  noBody,
  comingSoon,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (value: boolean) => void;
  yesTitle: string;
  yesBody: string;
  noTitle: string;
  noBody: string;
  comingSoon: string;
}) {
  const choices: { value: boolean; icon: LucideIcon; title: string; body: string }[] = [
    { value: true, icon: Volume2, title: yesTitle, body: yesBody },
    { value: false, icon: Captions, title: noTitle, body: noBody },
  ];

  return (
    <div>
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-[-0.03em] text-foreground sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>

      <div className="mt-6 space-y-3">
        {choices.map((choice) => {
          const isSelected = value === choice.value;
          const Icon = choice.icon;
          return (
            <button
              key={String(choice.value)}
              type="button"
              onClick={() => onChange(choice.value)}
              aria-pressed={isSelected}
              className={cn(
                "flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/[0.04] ring-2 ring-primary/15"
                  : "border-input bg-white hover:border-primary/40 hover:bg-muted/50",
              )}
            >
              <span
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
                )}
                aria-hidden="true"
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-foreground">{choice.title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{choice.body}</span>
              </span>
              <span
                className={cn(
                  "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                  isSelected ? "border-primary bg-primary text-white" : "border-border bg-white text-transparent",
                )}
                aria-hidden="true"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{comingSoon}</span>
      </div>
    </div>
  );
}

function PasswordStep({
  eyebrow,
  title,
  subtitle,
  password,
  setPassword,
  confirmation,
  setConfirmation,
  showPassword,
  setShowPassword,
  onContinue,
  continueLabel,
  placeholder,
  confirmPlaceholder,
  showLabel,
  hideLabel,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  password: string;
  setPassword: (value: string) => void;
  confirmation: string;
  setConfirmation: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  onContinue: () => void;
  continueLabel: string;
  placeholder: string;
  confirmPlaceholder: string;
  showLabel: string;
  hideLabel: string;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onContinue();
      }}
    >
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-[-0.03em] text-foreground sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>

      <div className="mt-6 space-y-3">
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={placeholder}
            className="h-14 w-full rounded-2xl border border-input bg-white px-4 pr-12 text-base font-semibold text-foreground shadow-sm outline-none transition-colors placeholder:font-normal placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary"
            aria-label={showPassword ? hideLabel : showLabel}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
        <input
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          placeholder={confirmPlaceholder}
          className="h-14 w-full rounded-2xl border border-input bg-white px-4 text-base font-semibold text-foreground shadow-sm outline-none transition-colors placeholder:font-normal placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>

      <AppButton type="submit" size="xl" className="mt-6">
        {continueLabel}
        <ArrowRight className="h-5 w-5" aria-hidden="true" />
      </AppButton>
    </form>
  );
}

function ReviewStep({
  eyebrow,
  title,
  subtitle,
  name,
  email,
  phone,
  needs,
  voiceGuide,
  labels,
  needsLabel,
  onSubmit,
  submitting,
  submitLabel,
  loadingLabel,
  onEdit,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  name: string;
  email: string;
  phone: string;
  needs: AccessibilityNeed[];
  voiceGuide: boolean;
  labels: {
    name: string;
    email: string;
    phone: string;
    needs: string;
    voice: string;
    voiceOn: string;
    voiceOff: string;
    edit: string;
  };
  needsLabel: (id: AccessibilityNeed) => string;
  onSubmit: (event?: FormEvent<HTMLFormElement>) => void;
  submitting: boolean;
  submitLabel: string;
  loadingLabel: string;
  onEdit: () => void;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(event);
      }}
    >
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-[-0.03em] text-foreground sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>

      <dl className="mt-6 divide-y divide-foreground/[0.07] overflow-hidden rounded-2xl border border-input bg-white">
        <ReviewRow label={labels.name} value={name} onEdit={onEdit} editLabel={labels.edit} />
        {email && <ReviewRow label={labels.email} value={email} />}
        <ReviewRow label={labels.phone} value={phone} />
        <div className="flex items-start justify-between gap-4 px-4 py-3.5">
          <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{labels.needs}</dt>
          <dd className="flex flex-wrap justify-end gap-1.5">
            {needs.length === 0 ? (
              <span className="text-sm font-semibold text-muted-foreground">—</span>
            ) : (
              needs.map((need) => (
                <span
                  key={need}
                  className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground"
                >
                  {needsLabel(need)}
                </span>
              ))
            )}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4 px-4 py-3.5">
          <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{labels.voice}</dt>
          <dd className="text-sm font-semibold text-foreground">
            {voiceGuide ? labels.voiceOn : labels.voiceOff}
          </dd>
        </div>
      </dl>

      <AppButton type="submit" size="xl" disabled={submitting} className="mt-6">
        {submitting ? (
          <>
            <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
            {loadingLabel}
          </>
        ) : (
          <>
            <BadgeCheck className="h-5 w-5" aria-hidden="true" />
            {submitLabel}
          </>
        )}
      </AppButton>
    </form>
  );
}

function ReviewRow({
  label,
  value,
  onEdit,
  editLabel,
}: {
  label: string;
  value: string;
  onEdit?: () => void;
  editLabel?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3.5">
      <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">{value || "—"}</span>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="text-xs font-bold text-primary hover:underline"
          >
            {editLabel}
          </button>
        )}
      </dd>
    </div>
  );
}

function FinishScreen({
  icon,
  title,
  body,
  hint,
  ctaLabel,
  ctaTo,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  hint: string;
  ctaLabel: string;
  ctaTo: string;
}) {
  return (
    <div className="py-4 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-success/10 text-success">
        {icon}
      </div>
      <h1 className="mt-6 font-display text-2xl font-extrabold leading-tight tracking-[-0.03em] text-foreground sm:text-3xl">
        {title}
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{body}</p>
      <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">{hint}</p>
      <Link to={ctaTo}>
        <AppButton size="xl" className="mt-8">
          {ctaLabel}
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </AppButton>
      </Link>
    </div>
  );
}

export default Onboarding;
