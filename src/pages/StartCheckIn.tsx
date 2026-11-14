import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bus, Home, Loader2, Mail, MapPin, MessageSquareText, Users } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { createJourney, emailJourney } from "@/lib/api";
import { listContacts } from "@/lib/contacts";
import { getOwnerContact, getOwnerName, setOwnerContact } from "@/lib/storage";
import { AppButton } from "@/components/ui/app-button";
import { Switch } from "@/components/ui/switch";
import { showError, showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";
import type { Preset } from "@/lib/types";

const PRESETS: { id: Preset; icon: typeof Home }[] = [
  { id: "going_home", icon: Home },
  { id: "taking_the_bus", icon: Bus },
  { id: "meeting_someone", icon: Users },
];

const QUICK_MINUTES = [15, 30, 45, 60, 90, 120];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function StartCheckIn() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [contacts] = useState(() => listContacts());
  const [preset, setPreset] = useState<Preset>("going_home");
  const [label, setLabel] = useState("");
  const [duration, setDuration] = useState(30);
  const [customMode, setCustomMode] = useState(false);
  const [recipientId, setRecipientId] = useState(() => {
    const previous = getOwnerContact();
    return listContacts().find((contact) => contact.contact === previous)?.id ?? "";
  });
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const registeredName = (profile?.full_name
    ?? user?.user_metadata?.full_name
    ?? user?.user_metadata?.name
    ?? getOwnerName()).trim() || "Someone";
  const recipient = contacts.find((contact) => contact.id === recipientId);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const { journey } = await createJourney({
        preset,
        label: label.trim(),
        durationMinutes: Math.max(1, Math.round(duration)),
        senderName: registeredName,
        contact: recipient?.contact ?? "",
        isDemo: false,
        locationEnabled,
      });
      setOwnerContact(recipient?.contact ?? "");

      if (recipient && EMAIL_PATTERN.test(recipient.contact)) {
        try {
          await emailJourney(journey.id);
          showSuccess(t("notify.sent", { name: recipient.name }));
        } catch {
          showError(t("notify.failed"));
        }
      }

      navigate(`/journey/${journey.id}`);
    } catch {
      showError(t("common.error"));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-foreground">{t("form.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("form.subtitle")}</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-foreground">{t("form.presetLabel")}</legend>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPreset(item.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-colors",
                  preset === item.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:bg-muted",
                )}
              >
                <item.icon className="h-6 w-6" aria-hidden="true" />
                <span className="text-xs font-semibold">{t(`preset.${item.id}`)}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <label htmlFor="label" className="text-sm font-semibold text-foreground">{t("form.labelLabel")}</label>
          <input
            id="label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            maxLength={100}
            placeholder={t("form.labelPlaceholder")}
            className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-foreground">{t("form.durationLabel")}</legend>
          <div className="flex flex-wrap gap-2">
            {QUICK_MINUTES.map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => {
                  setCustomMode(false);
                  setDuration(minutes);
                }}
                className={cn(
                  "h-11 rounded-2xl border px-4 text-sm font-semibold transition-colors",
                  !customMode && duration === minutes
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-muted",
                )}
              >
                {minutes} {t("form.minutes")}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCustomMode(true)}
              className={cn(
                "h-11 rounded-2xl border px-4 text-sm font-semibold transition-colors",
                customMode
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted",
              )}
            >
              {t("form.customMinutes")}
            </button>
          </div>
          {customMode && (
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={10080}
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value))}
              className="mt-2 h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          )}
        </fieldset>

        <section className="rounded-2xl border border-[#DDE6ED] bg-[#F4F8FB] p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Mail className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-base font-extrabold text-foreground">{t("notify.title")}</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t("notify.subtitle", { name: registeredName })}
              </p>
            </div>
          </div>

          {contacts.length > 0 ? (
            <div className="mt-5 space-y-2">
              <label htmlFor="recipient" className="text-sm font-semibold text-foreground">{t("contacts.sendTo")}</label>
              <select
                id="recipient"
                value={recipientId}
                onChange={(event) => setRecipientId(event.target.value)}
                className="h-12 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">{t("notify.optional")}</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>{contact.name} · {contact.contact}</option>
                ))}
              </select>
              {recipient && (
                <div className="flex items-start gap-2 rounded-xl border border-primary/10 bg-white px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                  {EMAIL_PATTERN.test(recipient.contact) ? (
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  ) : (
                    <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  )}
                  {EMAIL_PATTERN.test(recipient.contact) ? t("notify.emailAutomatic") : t("notify.smsComposer")}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-input bg-white p-4 text-sm text-muted-foreground">
              <p>{t("notify.empty")}</p>
              <Link to="/contacts" className="mt-2 inline-flex text-xs font-extrabold text-primary hover:underline">
                {t("notify.addContact")}
              </Link>
            </div>
          )}
        </section>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-foreground">{t("form.locationLabel")}</p>
              <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
                {locationEnabled ? t("form.locationConsent") : t("form.locationOff")}
              </p>
            </div>
          </div>
          <Switch checked={locationEnabled} onCheckedChange={setLocationEnabled} aria-label={t("form.locationLabel")} />
        </div>

        <AppButton type="submit" variant="primary" size="xl" disabled={submitting}>
          {submitting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
          {submitting ? t("notify.starting") : t("form.submit")}
        </AppButton>
      </form>
    </div>
  );
}
