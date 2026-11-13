import { Bus, MessageCircle, ShieldCheck, Users } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

const SafetyTips = () => {
  const { t } = useI18n();

  const tips = [
    {
      icon: ShieldCheck,
      title: t("tips.journeyTitle"),
      body: t("tips.journeyBody"),
    },
    {
      icon: Bus,
      title: t("tips.transitTitle"),
      body: t("tips.transitBody"),
    },
    {
      icon: Users,
      title: t("tips.meetTitle"),
      body: t("tips.meetBody"),
    },
    {
      icon: MessageCircle,
      title: t("tips.onlineTitle"),
      body: t("tips.onlineBody"),
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-foreground">{t("tips.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("tips.subtitle")}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {tips.map((tip) => (
          <section key={tip.title} className="rounded-2xl border border-border bg-card p-5">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <tip.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-3 font-display text-base font-bold text-foreground">{tip.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{tip.body}</p>
          </section>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-secondary/60 p-5 text-center">
        <p className="text-sm text-muted-foreground">{t("home.quickHelp")}</p>
      </section>
    </div>
  );
};

export default SafetyTips;
