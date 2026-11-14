import { Link } from "react-router-dom";
import { HeartHandshake, LifeBuoy, Phone, ShieldAlert } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { EmergencyShareCard } from "@/components/EmergencyShareCard";
import { appButtonVariants } from "@/components/ui/app-button";

const Emergency = () => {
  const { t } = useI18n();

  const steps = [t("emergency.step1"), t("emergency.step2"), t("emergency.step3")];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="text-center">
        <h1 className="font-display text-3xl font-bold text-foreground">{t("emergency.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("emergency.subtitle")}</p>
      </header>

      {/* Primary emergency call */}
      <section className="rounded-3xl border border-danger/20 bg-danger/5 p-6 text-center">
        <h2 className="font-display text-lg font-bold text-foreground">{t("emergency.callTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("emergency.callBody")}</p>
        <a
          href="tel:999"
          className="mt-5 inline-flex h-20 w-full items-center justify-center gap-3 rounded-3xl bg-danger text-2xl font-bold text-danger-foreground shadow-lg shadow-danger/20 active:scale-[0.99]"
        >
          <Phone className="h-7 w-7" aria-hidden="true" />
          999
        </a>
      </section>

      <EmergencyShareCard />

      {/* Secondary numbers */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-base font-bold text-foreground">
          {t("emergency.otherTitle")}
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <a
            href="tel:114"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 text-base font-bold text-foreground hover:bg-muted"
          >
            <Phone className="h-5 w-5 text-primary" aria-hidden="true" />
            {t("emergency.ambulance")} · 114
          </a>
          <a
            href="tel:115"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 text-base font-bold text-foreground hover:bg-muted"
          >
            <Phone className="h-5 w-5 text-primary" aria-hidden="true" />
            {t("emergency.fire")} · 115
          </a>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{t("emergency.verifyNote")}</p>
      </section>

      {/* Steps */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-base font-bold text-foreground">
          {t("emergency.stepsTitle")}
        </h2>
        <ol className="mt-3 space-y-3">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              <span className="pt-1 text-sm text-foreground">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Reassurance */}
      <section className="rounded-2xl border border-border bg-secondary/60 p-6 text-center">
        <HeartHandshake className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
        <h2 className="mt-2 font-display text-lg font-bold text-foreground">
          {t("emergency.reassureTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("emergency.reassureBody")}</p>
      </section>

      {/* Non-emergency support */}
      <section className="space-y-3">
        <h2 className="font-display text-base font-bold text-foreground">
          {t("emergency.supportTitle")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link to="/get-help" className={appButtonVariants({ variant: "outline", size: "lg" })}>
            <LifeBuoy className="h-4 w-4" aria-hidden="true" />
            {t("emergency.supportContacts")}
          </Link>
          <a
            href="https://maucors.govmu.org/maucors/?page_id=9"
            target="_blank"
            rel="noopener noreferrer"
            className={appButtonVariants({ variant: "outline", size: "lg" })}
          >
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            {t("scam.maucors")}
          </a>
        </div>
      </section>
    </div>
  );
};

export default Emergency;
