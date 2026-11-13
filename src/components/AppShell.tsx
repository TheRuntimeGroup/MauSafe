import { NavLink, Outlet } from "react-router-dom";
import { Home, LifeBuoy, ListChecks, Phone, PhoneCall, ShieldAlert } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", labelKey: "nav.home", shortLabelKey: "nav.homeShort", icon: Home, end: true },
  { to: "/check-ins", labelKey: "nav.checkins", shortLabelKey: "nav.checkinsShort", icon: ListChecks, end: false },
  { to: "/call-checker", labelKey: "nav.callcheck", shortLabelKey: "nav.callcheckShort", icon: PhoneCall, end: false },
  { to: "/scam-check", labelKey: "nav.scam", shortLabelKey: "nav.scamShort", icon: ShieldAlert, end: false },
  { to: "/get-help", labelKey: "nav.gethelp", shortLabelKey: "nav.gethelpShort", icon: LifeBuoy, end: false },
];

export function AppShell() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-border bg-white lg:flex">
        <NavLink to="/" className="flex items-center gap-3 border-b border-border px-6 py-6">
          <Logo className="h-9 w-9 shrink-0" />
          <div className="min-w-0">
            <p className="font-display text-xl font-extrabold leading-tight tracking-tight text-foreground">
              {t("app.name")}
            </p>
            <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">
              {t("app.tagline")}
            </p>
          </div>
        </NavLink>

        <p className="px-6 pb-2 pt-7 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {t("nav.menu")}
        </p>

        <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-sm font-semibold transition-colors",
                  isActive
                    ? "border-primary/10 bg-secondary text-primary"
                    : "text-foreground hover:bg-muted",
                )
              }
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-4 border-t border-border p-5">
          <a
            href="tel:999"
            className="group flex items-center gap-3 rounded-xl border border-danger/20 bg-danger/5 p-4 text-danger transition-colors hover:bg-danger hover:text-white"
          >
            <Phone className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 text-left">
              <span className="block text-sm font-extrabold leading-tight">{t("help.call999")}</span>
              <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground group-hover:text-white/75">
                {t("home.quickHelp")}
              </span>
            </span>
          </a>
          <div className="flex justify-center">
            <LanguageSwitcher />
          </div>
          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
            {t("footer.tagline")}
          </p>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <NavLink to="/" className="flex min-w-0 items-center gap-2.5">
            <Logo className="h-8 w-8 shrink-0" />
            <span className="min-w-0">
              <span className="block truncate font-display text-lg font-extrabold leading-none tracking-tight text-foreground">
                {t("app.name")}
              </span>
              <span className="mt-1 block truncate text-[10px] font-medium text-muted-foreground">
                {t("app.tagline")}
              </span>
            </span>
          </NavLink>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href="tel:999"
              className="flex h-10 items-center gap-1.5 rounded-xl bg-danger px-3 text-sm font-bold text-white"
              aria-label={t("help.call999")}
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              999
            </a>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-5 sm:px-6 lg:max-w-4xl lg:px-8 lg:pb-16 lg:pt-10">
          <Outlet />
          <footer className="mt-14 border-t border-border pt-6 text-center">
            <p className="text-xs text-muted-foreground">{t("footer.tagline")}</p>
            <p className="mx-auto mt-1 max-w-md text-[11px] leading-relaxed text-muted-foreground/80">
              {t("footer.dataNote")}
            </p>
          </footer>
        </div>
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(25,21,46,0.08)] lg:hidden"
        aria-label={t("nav.menu")}
      >
        <div className="grid grid-cols-5 px-1 pt-1.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex min-h-[3.75rem] flex-col items-center justify-center gap-1 px-0.5 text-[10px] font-semibold transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                      isActive ? "bg-primary text-white" : "text-muted-foreground",
                    )}
                  >
                    <item.icon className="h-[19px] w-[19px]" strokeWidth={isActive ? 2.4 : 2} aria-hidden="true" />
                  </span>
                  <span className={cn("max-w-full truncate text-center leading-tight", isActive && "font-bold")}>
                    {t(item.shortLabelKey)}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
