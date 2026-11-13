import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { JourneyStatusCard } from "@/components/JourneyStatusCard";
import { useI18n } from "@/i18n/I18nContext";
import { formatDateTime } from "@/lib/format";
import type { OwnerJourney } from "@/lib/types";

export function SharePanel({ journey }: { journey: OwnerJourney }) {
  const { t, locale } = useI18n();
  const [copied, setCopied] = useState(false);

  const fullUrl =
    typeof window !== "undefined" ? `${window.location.origin}${journey.sharePath}` : journey.sharePath;
  const canShare = typeof navigator !== "undefined" && !!navigator.share;

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

  return (
    <section className="space-y-4">
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
