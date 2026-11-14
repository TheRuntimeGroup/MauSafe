import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Baby, CheckCircle2, Loader2, Mail, MapPin, ShieldCheck, Smartphone, UserRound } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { createJourney } from "@/lib/api";
import { AppButton } from "@/components/ui/app-button";
import { showError } from "@/utils/toast";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ChildSafety() {
  const { t } = useI18n();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [childName, setChildName] = useState("");
  const [description, setDescription] = useState("");
  const [guardianEmail, setGuardianEmail] = useState(() => user?.email ?? "");
  const [durationMinutes, setDurationMinutes] = useState(240);
  const [ownChild, setOwnChild] = useState(false);
  const [ownPhone, setOwnPhone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardianName = profile?.full_name
    || user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || "";
  const readyToSubmit = ownChild && ownPhone && childName.trim().length > 0 && description.trim().length > 0 && EMAIL_PATTERN.test(guardianEmail) && !submitting;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!readyToSubmit) {
      setError(t("child.completeSetup"));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { journey } = await createJourney({
        preset: "going_home",
        label: description.trim(),
        durationMinutes,
        senderName: childName.trim(),
        contact: guardianEmail.trim().toLowerCase(),
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

      <section className="rounded-2xl border border-[#DDE6ED] bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-extrabold text-foreground">{t("child.guardianGuideTitle")}</h2>
            <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-muted-foreground">
              <li>{t("child.guideDetails")}</li>
              <li>{t("child.guideConsent")}</li>
              <li>{t("child.guidePhone")}</li>
              <li>{t("child.guideControl")}</li>
            </ol>
          </div>
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-2xl border border-primary/15 bg-secondary/50 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-secondary-foreground">{t("child.privacy")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-[1.75rem] border border-[#DDE6ED] bg-card p-5 shadow-premium sm:p-6">
        <div className="space-y-2">
          <label htmlFor="child-name" className="text-sm font-semibold text-foreground">{t("child.nameLabel")}</label>
          <input
            id="child-name"
            value={childName}
            onChange={(event) => setChildName(event.target.value)}
            maxLength={60}
            required
            placeholder={t("child.namePlaceholder")}
            className="h-12 w-full rounded-xl border border-input bg-white px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="child-description" className="text-sm font-semibold text-foreground">{t("child.descriptionLabel")}</label>
          <textarea
            id="child-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={200}
            rows={3}
            required
            placeholder={t("child.descriptionPlaceholder")}
            className="w-full resize-y rounded-xl border border-input bg-white p-4 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-[11px] text-muted-foreground">{t("child.descriptionHint")}</p>
        </div>

        <section className="space-y-3 rounded-2xl border border-[#DDE6ED] bg-[#F4F8FB] p-4" aria-labelledby="guardian-details-title">
          <div className="flex items-center gap-2.5">
            <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 id="guardian-details-title" className="text-sm font-extrabold text-foreground">{t("child.guardianDetails")}</h2>
          </div>
          {guardianName && <p className="text-sm font-semibold text-foreground">{guardianName}</p>}
          <div className="space-y-2">
            <label htmlFor="guardian-email" className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Mail className="h-4 w-4" aria-hidden="true" />
              {t("child.guardianEmail")}
            </label>
            <input
              id="guardian-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              readOnly
              value={guardianEmail}
              onChange={(event) => setGuardianEmail(event.target.value)}
              className="h-12 w-full rounded-xl border border-input bg-white px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-[11px] leading-relaxed text-muted-foreground">{t("child.emailHint")}</p>
          </div>
        </section>

        <div className="space-y-2">
          <label htmlFor="child-duration" className="text-sm font-semibold text-foreground">{t("child.durationLabel")}</label>
          <select
            id="child-duration"
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(Number(event.target.value))}
            className="h-12 w-full rounded-xl border border-input bg-white px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value={60}>1 {t("child.hour")}</option>
            <option value={240}>4 {t("child.hours")}</option>
            <option value={480}>8 {t("child.hours")}</option>
            <option value={720}>12 {t("child.hours")}</option>
          </select>
        </div>

        <div className="flex items-start gap-3 rounded-xl bg-secondary/50 p-4">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-secondary-foreground">{t("location.consent")}</p>
        </div>

        <fieldset className="space-y-3 rounded-2xl border border-primary/15 bg-white p-4">
          <legend className="px-1 text-sm font-extrabold text-foreground">{t("child.requiredDeclarations")}</legend>
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-foreground">
            <input
              type="checkbox"
              checked={ownChild}
              onChange={(event) => setOwnChild(event.target.checked)}
              required
              className="mt-1 h-5 w-5 shrink-0 accent-[hsl(var(--primary))]"
            />
            <span>{t("child.ownChildConsent", { name: childName.trim() || t("child.genericChild") })}</span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-foreground">
            <input
              type="checkbox"
              checked={ownPhone}
              onChange={(event) => setOwnPhone(event.target.checked)}
              required
              className="mt-1 h-5 w-5 shrink-0 accent-[hsl(var(--primary))]"
            />
            <span className="flex items-start gap-2.5">
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              {t("child.ownPhoneConsent")}
            </span>
          </label>
          {ownChild && ownPhone && (
            <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800" role="status">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {t("child.declarationsAccepted")}
            </p>
          )}
        </fieldset>

        {error && <p role="alert" className="rounded-xl bg-danger/[0.06] px-4 py-3 text-sm font-semibold text-danger">{error}</p>}

        <AppButton type="submit" size="xl" disabled={!readyToSubmit}>
          {submitting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
          {t("child.start")}
        </AppButton>
      </form>
    </div>
  );
}
