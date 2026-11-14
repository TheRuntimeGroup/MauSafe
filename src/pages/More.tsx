import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Baby,
  BookOpen,
  CloudSun,
  FileWarning,
  Heart,
  IdCard,
  LifeBuoy,
  ListChecks,
  Settings,
  ShieldAlert,
  Siren,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

type ToolLink = { to: string; labelKey: string; icon: LucideIcon };

export default function More() {
  const { t } = useI18n();

  const groups: { titleKey: string; tools: ToolLink[] }[] = [
    {
      titleKey: "more.safety",
      tools: [
        { to: "/scam-check", labelKey: "nav.scam", icon: ShieldAlert },
        { to: "/safety-alarm", labelKey: "alarm.title", icon: Siren },
        { to: "/incident-report", labelKey: "incident.title", icon: FileWarning },
      ],
    },
    {
      titleKey: "more.family",
      tools: [
        { to: "/check-ins", labelKey: "nav.checkins", icon: ListChecks },
        { to: "/contacts", labelKey: "nav.contacts", icon: Heart },
        { to: "/child-safety", labelKey: "nav.child", icon: Baby },
        { to: "/disaster-safety", labelKey: "nav.disaster", icon: CloudSun },
        { to: "/emergency-id", labelKey: "profile.title", icon: IdCard },
      ],
    },
    {
      titleKey: "more.resources",
      tools: [
        { to: "/get-help", labelKey: "nav.gethelp", icon: LifeBuoy },
        { to: "/safety-tips", labelKey: "nav.tips", icon: BookOpen },
        { to: "/settings", labelKey: "settings.title", icon: Settings },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="px-1">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">{t("more.title")}</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{t("more.subtitle")}</p>
      </header>

      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.titleKey} className="space-y-3">
            <h2 className="px-1 text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
              {t(group.titleKey)}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {group.tools.map((tool) => (
                <Link
                  key={tool.to}
                  to={tool.to}
                  className="group flex min-h-32 flex-col justify-between rounded-2xl border border-[#DDE6ED] bg-white p-4 shadow-[0_10px_28px_-24px_rgba(13,43,69,0.55)] transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-premium focus-visible:outline-primary sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EDF4FB] text-primary">
                      <tool.icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
                  </div>
                  <span className="mt-5 text-sm font-extrabold leading-snug text-foreground">{t(tool.labelKey)}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
