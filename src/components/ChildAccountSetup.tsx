import { useEffect, useState } from "react";
import { Baby, Check, LoaderCircle, MailCheck, Pencil, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n/I18nContext";
import { AppButton } from "@/components/ui/app-button";
import { EmailOtpInput } from "@/components/EmailOtpInput";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = "form" | "otp" | "success";

export function ChildAccountSetup() {
  const { t } = useI18n();
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  function toError(code: string): string {
    switch (code) {
      case "GUARDIAN_REQUIRED":
        return t("child.guardianRequired");
      case "EMAIL_TAKEN":
        return t("child.emailTaken");
      case "ALREADY_LINKED":
        return t("child.alreadyLinked");
      case "INVALID_CHILD_DETAILS":
        return t("child.invalidChildEmail");
      case "RATE_LIMITED":
        return t("otp.rateLimited");
      case "EMAIL_NOT_CONFIGURED":
        return t("child.emailNotConfigured");
      case "INVALID_CODE":
        return t("otp.wrong");
      case "EXPIRED_CODE":
        return t("otp.expired");
      default:
        return t("child.setupError");
    }
  }

  function validateForm(): boolean {
    if (!name.trim() || !EMAIL_PATTERN.test(email.trim())) {
      setError(t("child.invalidChildEmail"));
      return false;
    }
    return true;
  }

  async function requestOtp() {
    if (!validateForm()) return;
    setBusy(true);
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.functions.invoke("create-child-account", {
      body: { childName: name.trim(), childEmail: trimmedEmail },
    });
    setBusy(false);

    if (error || data?.error) {
      setError(toError(data?.error ?? error?.message ?? "UNKNOWN"));
      return;
    }

    setSentEmail(trimmedEmail);
    setOtp("");
    setCooldown(30);
    setStep("otp");
  }

  async function verifyOtp(submittedCode = otp) {
    if (submittedCode.length !== 6) {
      setError(t("auth.otpRequired"));
      return;
    }
    setBusy(true);
    setError(null);

    const { data, error } = await supabase.functions.invoke("verify-child-account", {
      body: { childName: name.trim(), childEmail: sentEmail, code: submittedCode },
    });
    setBusy(false);

    if (error || data?.error) {
      setError(toError(data?.error ?? error?.message ?? "UNKNOWN"));
      return;
    }

    setStep("success");
  }

  function reset() {
    setStep("form");
    setError(null);
    setOtp("");
    setCooldown(0);
  }

  return (
    <section className="rounded-[1.75rem] border border-[#DDE6ED] bg-card p-5 shadow-premium sm:p-7">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
          <Baby className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-xl font-extrabold text-foreground">
            {step === "otp" ? t("child.verifyTitle") : step === "success" ? t("child.successTitle") : t("child.createTitle")}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {step === "otp" ? t("child.verifySubtitle") : t("child.createSubtitle")}
          </p>
        </div>
      </div>

      {step === "form" && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void requestOtp();
          }}
          className="mt-5 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-foreground">
              {t("child.nameLabel")}
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={60}
                className="h-12 w-full rounded-xl border border-input bg-white px-4 text-sm font-normal text-foreground"
              />
            </label>
            <label className="space-y-2 text-sm font-semibold text-foreground">
              {t("child.accountEmail")}
              <input
                required
                type="email"
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="child@example.com"
                className="h-12 w-full rounded-xl border border-input bg-white px-4 text-sm font-normal text-foreground placeholder:text-muted-foreground"
              />
            </label>
          </div>
          {error && (
            <p role="alert" className="rounded-xl bg-danger/[0.06] px-3 py-2.5 text-sm font-semibold text-danger">
              {error}
            </p>
          )}
          <AppButton type="submit" size="lg" disabled={busy}>
            {busy && <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />}
            {busy ? t("child.creating") : t("child.createButton")}
          </AppButton>
        </form>
      )}

      {step === "otp" && (
        <div className="mt-5 space-y-4">
          <p className="flex items-center gap-2 text-sm font-extrabold text-primary">
            <MailCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
            {t("child.otpSent", { email: sentEmail })}
          </p>

          <div className="rounded-2xl border border-primary/15 bg-secondary/55 p-4">
            <EmailOtpInput
              value={otp}
              onChange={setOtp}
              onComplete={(code) => {
                setOtp(code);
                void verifyOtp(code);
              }}
              disabled={busy}
              hasError={Boolean(error)}
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-danger/[0.06] px-3 py-2.5 text-sm font-semibold text-danger">
              {error}
            </p>
          )}

          <AppButton size="lg" disabled={busy || otp.length !== 6} onClick={() => void verifyOtp()}>
            {busy && <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />}
            {busy ? t("child.verifying") : t("child.verifyButton")}
          </AppButton>

          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
            <button
              type="button"
              onClick={() => void requestOtp()}
              disabled={busy || cooldown > 0}
              className="rounded-lg px-2 py-1.5 font-bold text-primary transition-colors hover:underline disabled:text-muted-foreground disabled:no-underline"
            >
              {cooldown > 0 ? t("otp.resendIn", { seconds: cooldown }) : t("otp.resend")}
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              {t("otp.changeEmail")}
            </button>
          </div>
        </div>
      )}

      {step === "success" && (
        <div className="mt-5 space-y-4">
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold leading-relaxed text-emerald-900">
              {t("child.successBody", { name: name.trim() })}
            </p>
          </div>

          <div className="rounded-2xl border border-[#DDE6ED] bg-[#F4F8FB] p-4">
            <p className="flex items-center gap-2 text-sm font-extrabold text-foreground">
              <Smartphone className="h-4 w-4 text-primary" aria-hidden="true" />
              {t("child.successPhoneTitle")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("child.successPhoneBody", { email: sentEmail })}
            </p>
          </div>

          <AppButton size="lg" onClick={reset}>
            {t("child.finish")}
          </AppButton>
        </div>
      )}
    </section>
  );
}
