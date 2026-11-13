import { useState } from "react";
import { IdCard, LockKeyhole, Printer, Share2 } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import {
  EMPTY_EMERGENCY_PROFILE,
  loadEmergencyProfile,
  saveEmergencyProfile,
  type EmergencyProfile,
} from "@/lib/emergencyProfile";
import { AppButton } from "@/components/ui/app-button";

const BLOOD_TYPES = ["unknown", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const OPTIONAL_FIELDS = ["allergies", "conditions", "medications", "notes"] as const;

const EmergencyId = () => {
  const { t } = useI18n();
  const [profile, setProfile] = useState<EmergencyProfile>(() => loadEmergencyProfile());
  const [feedback, setFeedback] = useState<string | null>(null);

  function update(key: keyof EmergencyProfile, value: string) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    try {
      saveEmergencyProfile(profile);
      setFeedback("profile.saved");
    } catch {
      setFeedback("profile.error");
    }
  }

  function profileText() {
    const lines = [t("profile.cardTitle")];
    if (profile.fullName) lines.push(`${t("profile.fullName")}: ${profile.fullName}`);
    if (profile.bloodType !== "unknown") lines.push(`${t("profile.bloodType")}: ${profile.bloodType}`);
    for (const key of OPTIONAL_FIELDS) {
      if (profile[key]) lines.push(`${t(`profile.${key}`)}: ${profile[key]}`);
    }
    if (profile.contactName || profile.contactPhone) {
      lines.push(`${t("profile.contactName")}: ${profile.contactName} ${profile.contactPhone}`.trim());
    }
    return lines.join("\n");
  }

  async function share() {
    try {
      if (navigator.share) {
        try {
          await navigator.share({ title: t("profile.cardTitle"), text: profileText() });
          setFeedback("profile.opened");
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
          throw error;
        }
      } else {
        await navigator.clipboard.writeText(profileText());
        setFeedback("profile.copied");
      }
    } catch {
      setFeedback("profile.error");
    }
  }

  function printCard() {
    const printWindow = window.open("", "_blank", "width=640,height=760");
    if (!printWindow) {
      setFeedback("profile.error");
      return;
    }
    const style = printWindow.document.createElement("style");
    style.textContent = "body{font-family:Arial,sans-serif;padding:40px;color:#181624;max-width:600px;margin:auto}h1{font-size:28px}p{font-size:16px;line-height:1.6;border-bottom:1px solid #ddd;padding:12px 0}strong{display:block;font-size:12px;text-transform:uppercase;color:#6d28d9}";
    printWindow.document.head.appendChild(style);
    const title = printWindow.document.createElement("h1");
    title.textContent = t("profile.cardTitle");
    printWindow.document.body.appendChild(title);
    const entries = profileText().split("\n").slice(1);
    for (const entry of entries) {
      const [label, ...rest] = entry.split(": ");
      const row = printWindow.document.createElement("p");
      const strong = printWindow.document.createElement("strong");
      strong.textContent = label;
      row.appendChild(strong);
      row.appendChild(printWindow.document.createTextNode(rest.join(": ")));
      printWindow.document.body.appendChild(row);
    }
    printWindow.document.title = t("profile.cardTitle");
    printWindow.focus();
    printWindow.print();
  }

  const hasProfile = profile.fullName || profile.bloodType !== "unknown" || OPTIONAL_FIELDS.some((key) => profile[key]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-foreground">{t("profile.title")}</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("profile.subtitle")}</p>
      </header>

      <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-muted-foreground">{t("profile.privacy")}</p>
      </div>

      <form onSubmit={save} className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="profile-name" className="text-sm font-semibold">{t("profile.fullName")}</label>
          <input id="profile-name" value={profile.fullName} maxLength={100} onChange={(e) => update("fullName", e.target.value)} className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm" />
        </div>
        <div className="space-y-2">
          <label htmlFor="profile-blood" className="text-sm font-semibold">{t("profile.bloodType")}</label>
          <select id="profile-blood" value={profile.bloodType} onChange={(e) => update("bloodType", e.target.value)} className="h-12 w-full rounded-xl border border-input bg-card px-3 text-sm">
            {BLOOD_TYPES.map((type) => <option key={type} value={type}>{type === "unknown" ? t("profile.unknown") : type}</option>)}
          </select>
        </div>
        {OPTIONAL_FIELDS.slice(0, 2).map((key) => (
          <div key={key} className="space-y-2 sm:col-span-2">
            <label htmlFor={`profile-${key}`} className="text-sm font-semibold">{t(`profile.${key}`)}</label>
            <input id={`profile-${key}`} value={profile[key]} maxLength={300} onChange={(e) => update(key, e.target.value)} className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm" />
          </div>
        ))}
        {OPTIONAL_FIELDS.slice(2).map((key) => (
          <div key={key} className="space-y-2 sm:col-span-2">
            <label htmlFor={`profile-${key}`} className="text-sm font-semibold">{t(`profile.${key}`)}</label>
            <textarea id={`profile-${key}`} value={profile[key]} maxLength={500} rows={2} onChange={(e) => update(key, e.target.value)} className="w-full resize-y rounded-xl border border-input bg-card p-3 text-sm" />
          </div>
        ))}
        <div className="space-y-2">
          <label htmlFor="profile-contact-name" className="text-sm font-semibold">{t("profile.contactName")}</label>
          <input id="profile-contact-name" value={profile.contactName} maxLength={100} onChange={(e) => update("contactName", e.target.value)} className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm" />
        </div>
        <div className="space-y-2">
          <label htmlFor="profile-contact-phone" className="text-sm font-semibold">{t("profile.contactPhone")}</label>
          <input id="profile-contact-phone" type="tel" value={profile.contactPhone} maxLength={40} onChange={(e) => update("contactPhone", e.target.value)} className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm" />
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground sm:col-span-2">{t("profile.medicalNote")}</p>
        <AppButton type="submit" size="xl" className="sm:col-span-2">{t("profile.save")}</AppButton>
      </form>

      {feedback && <p className="rounded-xl bg-secondary/60 p-3 text-sm text-secondary-foreground" role="status">{t(feedback)}</p>}

      <section className="glass-panel rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <IdCard className="h-6 w-6 text-primary" aria-hidden="true" />
          <h2 className="font-display text-lg font-bold text-foreground">{t("profile.cardTitle")}</h2>
        </div>
        {hasProfile ? (
          <div className="mt-4 space-y-3 text-sm">
            {profile.fullName && <p className="font-display text-xl font-extrabold">{profile.fullName}</p>}
            {profile.bloodType !== "unknown" && <p><strong>{t("profile.bloodType")}:</strong> {profile.bloodType}</p>}
            {OPTIONAL_FIELDS.map((key) => profile[key] ? <p key={key}><strong>{t(`profile.${key}`)}:</strong> {profile[key]}</p> : null)}
            {(profile.contactName || profile.contactPhone) && <p><strong>{t("profile.contactName")}:</strong> {profile.contactName} {profile.contactPhone}</p>}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">{t("profile.empty")}</p>
        )}
        {hasProfile && (
          <div className="mt-5 grid grid-cols-2 gap-2">
            <AppButton variant="outline" size="sm" onClick={() => void share()}><Share2 className="h-4 w-4" />{t("profile.share")}</AppButton>
            <AppButton variant="outline" size="sm" onClick={printCard}><Printer className="h-4 w-4" />{t("profile.print")}</AppButton>
          </div>
        )}
      </section>
    </div>
  );
};

export default EmergencyId;
