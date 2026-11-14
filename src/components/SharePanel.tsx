import { useState } from "react";
import { Check, Copy, LoaderCircle, Mail, MessageCircle, Share2, Smartphone } from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { JourneyStatusCard } from "@/components/JourneyStatusCard";
import { useI18n } from "@/i18n/I18nContext";
import { formatDateTime } from "@/lib/format";
import { listContacts } from "@/lib/contacts";
import { emailJourney } from "@/lib/api";
import { showError, showSuccess } from "@/utils/toast";
import type { OwnerJourney } from "@/lib/types";

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function phoneDigits(value: string): string {
  return value.replace(/[^\d]/g, "");
}

export function SharePanel({ journey }: { journey: OwnerJourney }) {
  const { t, locale } = useI18n();
  const [copied, setCopied] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentId, setSentId] = useState<string | null>(null);

  const fullUrl =
    typeof window !== "undefined" ? `${window.location.origin}${journey.sharePath}` : journey.sharePath;
  const canShare = typeof navigator !== "undefined" && !!navigator.share;
  const contacts = listContacts();

  const message = `${journey.senderName} — ${t(`preset.${journey.preset}`)}. ${fullUrl}`;
  const encoded = encodeURIComponent(message);

  async function copy() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({
        title: t("share.title"),
        text: `${journey.senderName} — ${t(`preset.${journey.preset}`)}`,
        url: fullUrl,
      });
    } catch {
      // user cancelled or share unavailable
    }
  }

  async function sendEmail(contactId: string, email: string) {
    if (sendingId) return;
    setSendingId(contactId);
    try {
      await emailJourney(journey.id, {
        recipientEmail: email,
        mode:
          journey.location && (journey.status === "on_the_way" || journey.status === "overdue")
            ? "location"
            : undefined,
      });
      setSentId(contactId);
      showSuccess(t("contacts.sent"));
    } catch {
      showError(t("notify.failed"));
    } finally {
      setSendingId(null);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <AppButton variant="primary" size="lg" onClick={canShare ? nativeShare : copy}>
          <Share2 className="h-4 w-4" aria-hidden="true" />
          {canShare ? t("action.share") : t("action.copy")}
        </AppButton>
        <AppButton variant="outline" size="lg" onClick={copy}>
          {copied ? (
            <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4" aria-hidden="true" />
          )}
          {copied ? t("action.copied") : t("action.copy")}
        </AppButton>
      </div>

      {/* Send to a trusted contact */}
      {contacts.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">{t("contacts.sendTo")}</p>
          <ul className="space-y-2">
            {contacts.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background p-2"
              >
                <span className="min-w-0 flex-1 truncate px-2 text-sm font-semibold text-foreground">
                  {c.name}
                </span>
                {isEmail(c.contact) ? (
                  <button
                    type="button"
                    onClick={() => void sendEmail(c.id, c.contact)}
                    disabled={sendingId === c.id}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-opacity disabled:opacity-60"
                  >
                    {sendingId === c.id ? (
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {sentId === c.id ? t("contacts.sent") : t("contacts.email")}
                  </button>
                ) : (
                  <>
                    <a
                      href={`https://wa.me/${phoneDigits(c.contact)}?text=${encoded}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white"
                    >
                      <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      {t("contacts.whatsapp")}
                    </a>
                    <a
                      href={`sms:${c.contact}?body=${encoded}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground"
                    >
                      <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
                      {t("contacts.sms")}
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t("share.privateNote")}</p>

      <div>
        <p className="mb-2 text-sm font-semibold text-foreground">{t("share.preview")}</p>
        <JourneyStatusCard journey={journey.recipientSees} />
      </div>

      <p className="text-xs text-muted-foreground">
        {t("share.expires")} {formatDateTime(journey.guestExpiresAt, locale)}
      </p>
      <p className="text-xs text-muted-foreground">{t("share.revokeHint")}</p>
    </section>
  );
}
