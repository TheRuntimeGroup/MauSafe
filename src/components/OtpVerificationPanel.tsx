import { AlertCircle, ArrowLeft, Clock3, LoaderCircle, Mail, RefreshCw } from "lucide-react";
import { EmailOtpInput } from "@/components/EmailOtpInput";
import { AppButton } from "@/components/ui/app-button";

interface OtpVerificationPanelProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  code: string;
  onCodeChange: (code: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
  expiresLabel: string;
  expired: boolean;
  verifyLabel: string;
  resendLabel: string;
  resendDisabled: boolean;
  onResend: () => void;
  changeEmailLabel: string;
  onChangeEmail: () => void;
  backLabel: string;
  onBack: () => void;
}

export function OtpVerificationPanel({
  eyebrow,
  title,
  subtitle,
  code,
  onCodeChange,
  onSubmit,
  submitting,
  error,
  expiresLabel,
  expired,
  verifyLabel,
  resendLabel,
  resendDisabled,
  onResend,
  changeEmailLabel,
  onChangeEmail,
  backLabel,
  onBack,
}: OtpVerificationPanelProps) {
  return (
    <div className="mx-auto max-w-md text-center">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {backLabel}
      </button>

      <span className="mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0D2B45] text-white shadow-premium">
        <Mail className="h-6 w-6" strokeWidth={1.9} aria-hidden="true" />
      </span>

      <p className="mt-6 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-[-0.03em] text-foreground sm:text-3xl">
        {title}
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
      <p
        role="timer"
        className={`mx-auto mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold ${
          expired ? "bg-danger/[0.08] text-danger" : "bg-secondary text-primary"
        }`}
      >
        <Clock3 className="h-4 w-4" aria-hidden="true" />
        {expiresLabel}
      </p>

      <div className="mt-7">
        <EmailOtpInput
          value={code}
          onChange={onCodeChange}
          onComplete={onSubmit}
          disabled={submitting}
          hasError={Boolean(error)}
        />
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger/[0.06] px-4 py-3 text-left text-sm font-medium text-danger"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <AppButton
        size="xl"
        onClick={onSubmit}
        disabled={code.length !== 6 || submitting}
        className="mt-6"
      >
        {submitting ? (
          <>
            <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
            {verifyLabel}
          </>
        ) : (
          verifyLabel
        )}
      </AppButton>

      <div className="mt-5 flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={onResend}
          disabled={resendDisabled}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/[0.06] disabled:pointer-events-none disabled:text-muted-foreground"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {resendLabel}
        </button>
        <button
          type="button"
          onClick={onChangeEmail}
          className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          {changeEmailLabel}
        </button>
      </div>
    </div>
  );
}
