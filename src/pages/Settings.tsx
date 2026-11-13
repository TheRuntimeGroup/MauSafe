import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, Check, KeyRound, LoaderCircle, MapPin, ShieldCheck, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { checkPersonName } from "@/lib/nameValidation";
import { AppButton } from "@/components/ui/app-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOCATION_KEY = "mausafe.permissions.location";
type LocationPermission = "granted" | "denied" | "prompt" | "unavailable";

function SettingsFeedback({ error, notice }: { error: string | null; notice: string | null }) {
  if (error) {
    return (
      <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-danger/[0.06] px-3 py-2.5 text-sm font-semibold text-danger">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        {error}
      </p>
    );
  }
  if (notice) {
    return (
      <p role="status" className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-800">
        <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        {notice}
      </p>
    );
  }
  return null;
}

export default function SettingsPage() {
  const { t } = useI18n();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [personalSaving, setPersonalSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [personalError, setPersonalError] = useState<string | null>(null);
  const [personalNotice, setPersonalNotice] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationPermission, setLocationPermission] = useState<LocationPermission>("prompt");
  const [locationChecking, setLocationChecking] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  useEffect(() => {
    setName(profile?.full_name ?? user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? "");
    setEmail(user?.email ?? "");
  }, [profile, user]);

  useEffect(() => {
    try {
      setLocationEnabled(localStorage.getItem(LOCATION_KEY) === "true");
    } catch {
      setLocationEnabled(false);
    }

    if (!("permissions" in navigator)) return;
    navigator.permissions.query({ name: "geolocation" }).then((status) => {
      setLocationPermission(status.state as LocationPermission);
      status.onchange = () => setLocationPermission(status.state as LocationPermission);
    }).catch(() => setLocationPermission("prompt"));
  }, []);

  if (loading || !user) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }

  async function savePersonal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPersonalError(null);
    setPersonalNotice(null);

    const nextName = name.trim();
    const nextEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(nextEmail)) {
      setPersonalError(t("auth.emailInvalid"));
      return;
    }

    setPersonalSaving(true);
    try {
      if (nextName !== (profile?.full_name ?? "")) {
        const checkedName = await checkPersonName(nextName);
        if (!checkedName.allowed) {
          setPersonalError(t(checkedName.reason === "invalid" ? "onboarding.name.invalid" : "onboarding.name.inappropriate"));
          return;
        }
        const { error } = await supabase
          .from("profiles")
          .update({ full_name: checkedName.name, updated_at: new Date().toISOString() })
          .eq("id", user.id);
        if (error) throw error;
      }

      const emailChanged = nextEmail !== (user.email ?? "").toLowerCase();
      if (emailChanged) {
        const { error } = await supabase.auth.updateUser(
          { email: nextEmail },
          { emailRedirectTo: new URL("/auth/callback", window.location.origin).href },
        );
        if (error) throw error;
      }

      await refreshProfile();
      setPersonalNotice(emailChanged ? t("settings.emailConfirmation") : t("settings.saved"));
    } catch {
      setPersonalError(t("settings.saveError"));
    } finally {
      setPersonalSaving(false);
    }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordNotice(null);
    if (password.length < 8) {
      setPasswordError(t("auth.passwordTooShort"));
      return;
    }
    if (password !== confirmation) {
      setPasswordError(t("auth.passwordMismatch"));
      return;
    }

    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setPasswordSaving(false);
    if (error) {
      setPasswordError(t("settings.saveError"));
      return;
    }
    setPassword("");
    setConfirmation("");
    setPasswordNotice(t("settings.password.updated"));
  }

  function setLocationPreference(enabled: boolean) {
    setLocationEnabled(enabled);
    try {
      localStorage.setItem(LOCATION_KEY, String(enabled));
    } catch {
      // Browser permission can still be used when storage is unavailable.
    }
  }

  function requestLocation() {
    setLocationNotice(null);
    if (!("geolocation" in navigator)) {
      setLocationPermission("unavailable");
      setLocationNotice(t("settings.location.unsupported"));
      return;
    }

    setLocationChecking(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationChecking(false);
        setLocationPermission("granted");
        setLocationPreference(true);
        setLocationNotice(t("settings.location.granted"));
      },
      (error) => {
        setLocationChecking(false);
        setLocationPreference(false);
        setLocationPermission(error.code === error.PERMISSION_DENIED ? "denied" : "prompt");
        setLocationNotice(t("settings.location.error"));
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  }

  const locationLabel = locationEnabled
    ? t("settings.location.enabled")
    : locationPermission === "denied"
      ? t("settings.location.denied")
      : t("settings.location.disabled");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/" className="mb-5 inline-flex items-center gap-2 rounded-xl px-1 text-sm font-bold text-muted-foreground transition-colors hover:text-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("settings.back")}
        </Link>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">{t("settings.title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      <section className="rounded-[1.75rem] border border-foreground/[0.07] bg-card p-5 shadow-premium sm:p-7">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
            <UserRound className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-xl font-extrabold text-foreground">{t("settings.personal.title")}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("settings.personal.subtitle")}</p>
          </div>
        </div>
        <form onSubmit={savePersonal} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="settings-name">{t("onboarding.review.name")}</Label>
            <Input id="settings-name" autoComplete="name" maxLength={60} value={name} onChange={(event) => setName(event.target.value)} className="h-12 rounded-xl bg-white" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-email">{t("auth.emailLabel")}</Label>
            <Input id="settings-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 rounded-xl bg-white" required />
          </div>
          <AppButton type="submit" size="lg" disabled={personalSaving} className="w-full sm:w-auto">
            {personalSaving && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {personalSaving ? t("settings.saving") : t("settings.save")}
          </AppButton>
        </form>
        <SettingsFeedback error={personalError} notice={personalNotice} />
      </section>

      <section className="rounded-[1.75rem] border border-foreground/[0.07] bg-card p-5 shadow-premium sm:p-7">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-xl font-extrabold text-foreground">{t("settings.password.title")}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("settings.password.subtitle")}</p>
          </div>
        </div>
        <form onSubmit={savePassword} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="settings-password">{t("auth.newPassword")}</Label>
            <Input id="settings-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 rounded-xl bg-white" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-confirm-password">{t("auth.confirmPassword")}</Label>
            <Input id="settings-confirm-password" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="h-12 rounded-xl bg-white" required />
          </div>
          <AppButton type="submit" size="lg" variant="outline" disabled={passwordSaving} className="w-full sm:w-auto">
            {passwordSaving && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {passwordSaving ? t("settings.saving") : t("settings.password.update")}
          </AppButton>
        </form>
        <SettingsFeedback error={passwordError} notice={passwordNotice} />
      </section>

      <section className="rounded-[1.75rem] border border-foreground/[0.07] bg-card p-5 shadow-premium sm:p-7">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-xl font-extrabold text-foreground">{t("settings.location.title")}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("settings.location.subtitle")}</p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-foreground/[0.07] bg-background px-4 py-4">
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-foreground">{locationLabel}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("settings.location.hint")}</p>
          </div>
          <Switch
            aria-label={t("settings.location.title")}
            checked={locationEnabled}
            disabled={locationChecking || locationPermission === "unavailable"}
            onCheckedChange={(checked) => {
              if (checked) requestLocation();
              else {
                setLocationPreference(false);
                setLocationNotice(t("settings.location.disabled"));
              }
            }}
            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-slate-300"
          />
        </div>
        <AppButton size="md" variant="ghost" onClick={requestLocation} disabled={locationChecking} className="mt-3 px-2">
          {locationChecking ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
          {locationChecking ? t("settings.location.checking") : t("settings.location.check")}
        </AppButton>
        {locationNotice && <p role="status" className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">{locationNotice}</p>}
      </section>
    </div>
  );
}
