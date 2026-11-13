import { useState } from "react";
import { Baby, Loader2, MapPin, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/i18n/I18nContext";
import { createJourney } from "@/lib/api";
import { AppButton } from "@/components/ui/app-button";
import { showError } from "@/utils/toast";

const ChildSafety = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [childName, setChildName] = useState("");
  const [note, setNote] = useState("");
  const [contact, setContact] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(240);
  const [consented, setConsented] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!consented || !childName.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { journey } = await createJourney({
        preset: "going_home",
        label: note.trim(),
        durationMinutes,
        senderName: childName.trim(),
        contact: contact.trim(),
        isDemo: false,
        journeyKind: "child",
        locationEnabled: true,
      });
      navigate(`/journey/${journey.id}`);
    } catch {
      showError(t("common.error"));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
          <Baby className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">{t("child.title")}</h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("child.subtitle")}</p>
        </div>
      </header>

      <div className="flex items-start gap-3 rounded-2xl border border-primary/15 bg-secondary/50 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-secondary-foreground">{t("child.privacy")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-5">
        <div className="space-y-2">
          <label htmlFor="child-name" className="text-sm font-semibold text-foreground">
            {t("child.nameLabel")}
          </label>
          <input
            id="child-name"
            value={childName}
            onChange={(event) => setChildName(event.target.value)}
            maxLength={60}
            required
            placeholder={t("child.namePlaceholder")}
            className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="child-note" className="text-sm font-semibold text-foreground">
            {t("form.labelLabel")}
          </label>
          <input
            id="child-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={100}
            placeholder={t("child.notePlaceholder")}
            className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="child-duration" className="text-sm font-semibold text-foreground">
            {t("child.durationLabel")}
          </label>
          <select
            id="child-duration"
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(Number(event.target.value))}
            className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value={60}>1 {t("child.hour")}</option>
            <option value={240}>4 {t("child.hours")}</option>
            <option value={480}>8 {t("child.hours")}</option>
            <option value={720}>12 {t("child.hours")}</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="child-contact" className="text-sm font-semibold text-foreground">
            {t("form.contactLabel")}
          </label>
          <input
            id="child-contact"
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            maxLength={100}
            placeholder={t("form.contactPlaceholder")}
            className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex items-start gap-3 rounded-xl bg-secondary/50 p-4">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-secondary-foreground">{t("location.consent")}</p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-foreground">
          <input
            type="checkbox"
            checked={consented}
            onChange={(event) => setConsented(event.target.checked)}
            className="mt-0.5 h-5 w-5 accent-[hsl(var(--primary))]"
            required
          />
          {t("child.consent")}
        </label>

        <AppButton type="submit" size="xl" disabled={!consented || !childName.trim() || submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {t("child.start")}
        </AppButton>
      </form>
    </div>
  );
};

export default ChildSafety;
