import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bus, Home, Loader2, MapPin, Users } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { createJourney } from "@/lib/api";
import { getOwnerContact, getOwnerName, setOwnerContact, setOwnerName } from "@/lib/storage";
import { AppButton } from "@/components/ui/app-button";
import { Switch } from "@/components/ui/switch";
import { showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import type { Preset } from "@/lib/types";

const PRESETS: { id: Preset; icon: typeof Home }[] = [
  { id: "going_home", icon: Home },
  { id: "taking_the_bus", icon: Bus },
  { id: "meeting_someone", icon: Users },
];

const QUICK_MINUTES = [15, 30, 45, 60, 90, 120];

const StartCheckIn = () => {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [preset, setPreset] = useState<Preset>("going_home");
  const [label, setLabel] = useState("");
  const [duration, setDuration] = useState(30);
  const [customMode, setCustomMode] = useState(false);
  const [name, setName] = useState(() => getOwnerName());
  const [contact, setContact] = useState(() => getOwnerContact());
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const { journey } = await createJourney({
        preset,
        label: label.trim(),
        durationMinutes: Math.max(1, Math.round(duration)),
        senderName: name.trim() || "Someone",
        contact: contact.trim(),
        isDemo: false,
        locationEnabled,
      });
      setOwnerName(name.trim());
      setOwnerContact(contact.trim());
      navigate(`/journey/${journey.id}`);
    } catch (err) {
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
        {/* Preset */}
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-foreground">
            {t("form.presetLabel")}
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-colors",
                  preset === p.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:bg-muted",
                )}
              >
                <p.icon className="h-6 w-6" aria-hidden="true" />
                <span className="text-xs font-semibold">{t(`preset.${p.id}`)}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Label */}
        <div className="space-y-2">
          <label htmlFor="label" className="text-sm font-semibold text-foreground">
            {t("form.labelLabel")}
          </label>
          <input
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={100}
            placeholder={t("form.labelPlaceholder")}
            className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* Duration */}
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-foreground">
            {t("form.durationLabel")}
          </legend>
          <div className="flex flex-wrap gap-2">
            {QUICK_MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setCustomMode(false);
                  setDuration(m);
                }}
                className={cn(
                  "h-11 rounded-2xl border px-4 text-sm font-semibold transition-colors",
                  !customMode && duration === m
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-muted",
                )}
              >
                {m} {t("form.minutes")}
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
              onChange={(e) => setDuration(Number(e.target.value))}
              className="mt-2 h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          )}
        </fieldset>

        {/* Name + contact */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-semibold text-foreground">
              {t("form.nameLabel")}
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder={t("form.namePlaceholder")}
              className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="contact" className="text-sm font-semibold text-foreground">
              {t("form.contactLabel")}
            </label>
            <input
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              maxLength={100}
              placeholder={t("form.contactPlaceholder")}
              className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        {/* Optional live location */}
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-foreground">{t("form.locationLabel")}</p>
              <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
                {locationEnabled ? t("form.locationConsent") : t("form.locationOff")}
              </p>
            </div>
          </div>
          <Switch
            checked={locationEnabled}
            onCheckedChange={setLocationEnabled}
            aria-label={t("form.locationLabel")}
          />
        </div>

        <AppButton type="submit" variant="primary" size="xl" disabled={submitting}>
          {submitting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
          {t("form.submit")}
        </AppButton>
      </form>
    </div>
  );
};

export default StartCheckIn;
