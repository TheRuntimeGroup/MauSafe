import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, ShieldOff } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { extendJourney, getJourney, journeyAction } from "@/lib/api";
import { JourneyStatusCard } from "@/components/JourneyStatusCard";
import { SharePanel } from "@/components/SharePanel";
import { AppButton } from "@/components/ui/app-button";
import { showError } from "@/utils/toast";
import type { OwnerJourney } from "@/lib/types";

const JourneyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const [journey, setJourney] = useState<OwnerJourney | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getJourney(id)
      .then(({ journey }) => {
        if (!cancelled) setJourney(journey);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function runAction(action: "arrive" | "cancel" | "revoke") {
    if (!id || busy) return;
    setBusy(true);
    try {
      const { journey: updated } = await journeyAction(id, action);
      setJourney(updated);
    } catch {
      showError(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  async function runExtend(minutes: number) {
    if (!id || busy) return;
    setBusy(true);
    try {
      const { journey: updated } = await extendJourney(id, minutes);
      setJourney(updated);
    } catch {
      showError(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }

  if (error || !journey) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
        <p className="font-display text-base font-bold text-foreground">{t("common.error")}</p>
        <Link to="/check-ins" className="mt-4 inline-flex text-sm font-semibold text-primary">
          {t("common.back")}
        </Link>
      </div>
    );
  }

  const isActive = journey.status === "on_the_way" || journey.status === "overdue";

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link
        to="/check-ins"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t("common.back")}
      </Link>

      <JourneyStatusCard journey={journey.recipientSees} />

      {/* Actions */}
      {isActive && (
        <section className="space-y-3">
          <AppButton
            variant="success"
            size="xl"
            onClick={() => runAction("arrive")}
            disabled={busy}
          >
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            {t("action.safe")}
          </AppButton>

          <div className="grid grid-cols-2 gap-3">
            <AppButton variant="outline" size="lg" onClick={() => runExtend(15)} disabled={busy}>
              {t("action.extend15")}
            </AppButton>
            <AppButton variant="outline" size="lg" onClick={() => runExtend(30)} disabled={busy}>
              {t("action.extend30")}
            </AppButton>
          </div>

          <AppButton variant="ghost" size="lg" onClick={() => runAction("cancel")} disabled={busy}>
            {t("action.cancel")}
          </AppButton>
        </section>
      )}

      {journey.status === "arrived" && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
          <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600" aria-hidden="true" />
          <p className="mt-2 font-display text-base font-bold text-emerald-800">
            {t("action.safeDone")}
          </p>
        </section>
      )}

      {journey.status === "cancelled" && (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
          <p className="font-display text-base font-bold text-foreground">
            {t("status.cancelled")}
          </p>
        </section>
      )}

      {/* Share */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <SharePanel journey={journey} />
      </section>

      {/* Revoke */}
      {!journey.guestRevokedAt && (
        <AppButton
          variant="ghost"
          size="lg"
          className="text-destructive"
          onClick={() => runAction("revoke")}
          disabled={busy}
        >
          <ShieldOff className="h-4 w-4" aria-hidden="true" />
          {t("action.revoke")}
        </AppButton>
      )}
    </div>
  );
};

export default JourneyDetail;
