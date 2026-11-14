import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, Check, LoaderCircle, Mail, MailWarning, MapPin, MessageSquareText, ShieldCheck, X } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import type { TrustedContact } from "@/lib/contacts";
import { createJourney, emailJourney } from "@/lib/api";
import { AppButton } from "@/components/ui/app-button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function QuickShareDialog({
  recipient,
  onClose,
}: {
  recipient: TrustedContact;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [method, setMethod] = useState<"email" | "sms">("email");
  const [consented, setConsented] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const isEmailRecipient = EMAIL_PATTERN.test(recipient.contact);
  const phoneNumber = recipient.contact.replace(/[^\d+]/g, "");
  const canShare = method === "email" ? isEmailRecipient : phoneNumber.length >= 7;

  async function share() {
    if (!canShare || !consented || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Unauthorized");

      if (!("geolocation" in navigator)) {
        setError(t("location.unsupported"));
        return;
      }
      await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15_000,
          maximumAge: 0,
        });
      });
      const { journey: createdJourney } = await createJourney({
        preset: "going_home",
        label: t("quickShare.liveLabel"),
        durationMinutes: 60,
        senderName: profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "MauSafe user",
        contact: recipient.contact,
        isDemo: false,
        locationEnabled: true,
        quickShare: true,
      });
      const liveShareUrl = new URL(createdJourney.sharePath, window.location.origin).href;

      if (method === "email") {
        await emailJourney(createdJourney.id, { mode: "location", recipientEmail: recipient.contact });
      } else {
        const separator = /iPhone|iPad|iPod/.test(navigator.userAgent) ? "&" : "?";
        setShareUrl(`sms:${phoneNumber}${separator}body=${encodeURIComponent(t("quickShare.liveMessage", { name: recipient.name, url: liveShareUrl }))}`);
      }
      setSent(true);
      if (method === "email") navigate(createdJourney.sharePath, { replace: true });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error) {
        const geoError = error as GeolocationPositionError;
        setError(geoError.code === geoError.PERMISSION_DENIED ? t("location.permissionError") : t("location.positionError"));
      } else {
        setError(t("quickShare.error"));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#071B33]/45 p-3 sm:items-center" role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="quick-share-title" className="w-full max-w-md rounded-[1.75rem] border border-[#DDE6ED] bg-white p-5 shadow-[0_24px_70px_-24px_rgba(13,43,69,0.5)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">{t("quickShare.title")}</p>
            <h2 id="quick-share-title" className="mt-1 font-display text-xl font-extrabold text-foreground">{t("quickShare.shareWith", { name: recipient.name })}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={t("common.cancel")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <>
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-primary/15 bg-secondary/45 p-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 p-0.5 text-primary" aria-hidden="true" />
              <p className="text-xs leading-relaxed text-foreground">{t("quickShare.consentHint", { method: method === "email" ? "email" : "SMS" })}</p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/60 p-1">
              <button type="button" onClick={() => setMethod("email")} aria-pressed={method === "email"} className={cn("flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-bold transition-colors", method === "email" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                <Mail className="h-4 w-4" aria-hidden="true" />
                {t("contacts.channelEmail")}
              </button>
              <button type="button" onClick={() => setMethod("sms")} aria-pressed={method === "sms"} className={cn("flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-bold transition-colors", method === "sms" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                {t("contacts.sms")}
              </button>
            </div>

            <p className="mt-3 break-all text-xs font-semibold text-muted-foreground">{recipient.contact}</p>

            {method === "email" && !isEmailRecipient ? (
              <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
                <MailWarning className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {t("quickShare.emailRequired")}
              </p>
            ) : (
              <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-foreground">
                <input type="checkbox" checked={consented} onChange={(event) => setConsented(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]" />
                {t("quickShare.confirmConsent", { name: recipient.name })}
              </label>
            )}
        {error && <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-danger/[0.06] p-3 text-xs font-semibold text-danger"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{error}</p>}

        {sent && (
          <p role="status" className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
            <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {method === "email" ? t("quickShare.sent", { name: recipient.name }) : t("quickShare.smsReady")}
          </p>
        )}

        {!sent ? (
          <AppButton size="xl" className="mt-5" onClick={share} disabled={busy || !canShare || !consented}>
            {busy ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : <MapPin className="h-5 w-5" aria-hidden="true" />}
            {busy ? t("quickShare.sharing") : method === "email" ? t("quickShare.sendEmail") : t("quickShare.sendSms")}
          </AppButton>
        ) : (
          <div className="mt-5 flex flex-wrap gap-2">
            {method === "sms" && <a href={shareUrl} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">{t("quickShare.openMessages")}</a>}
            <AppButton size="lg" variant="outline" onClick={onClose} className="mt-0">{t("common.back")}</AppButton>
          </div>
        )}

        <div className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span>{t("quickShare.privacy")}</span>
        </div>
        </>
      </div>
    </div>
  );
}
