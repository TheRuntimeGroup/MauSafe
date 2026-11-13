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
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="flex items-center gap-3 px-6 py-6">
          <Logo className="h-10 w-10" />
          <div>
            <p className="font-display text-lg font-bold leading-tight text-foreground">
              {t("app.name")}
            </p>
            <p className="text-xs text-muted-foreground">{t("app.tagline")}</p>
          </div>
        </div>

        <div className="mx-6 mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
          Powered to Protect · Mauritius
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground hover:bg-muted",
                )
              }
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-3 border-t border-border p-4">
          <a
            href="tel:999"
            className="flex items-center justify-center gap-2 rounded-2xl bg-danger px-4 py-3 text-sm font-semibold text-danger-foreground shadow-sm hover:bg-danger/90"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            {t("help.call999")}
          </a>
          <div className="flex justify-center">
            <LanguageSwitcher />
          </div>
          <p className="text-center text-xs text-muted-foreground">{t("footer.tagline")}</p>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <NavLink to="/" className="flex items-center gap-2.5">
          <Logo className="h-8 w-8" />
          <span className="font-display text-base font-bold text-foreground">{t("app.name")}</span>
        </NavLink>
        <div className="flex items-center gap-2">
          <a
            href="tel:999"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-danger px-3 text-sm font-semibold text-danger-foreground"
            aria-label={t("help.call999")}
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            999
          </a>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main content */}
      <main className="relative flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-dots opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="relative mx-auto w-full max-w-3xl px-4 pb-28 pt-5 lg:max-w-4xl lg:px-8 lg:pb-16 lg:pt-10">
          <Outlet />
          <footer className="mt-12 border-t border-border pt-6 text-center">
            <p className="text-xs text-muted-foreground">{t("footer.tagline")}</p>
            <p className="mx-auto mt-1 max-w-md text-[11px] leading-relaxed text-muted-foreground/80">
              {t("footer.dataNote")}
            </p>
          </footer>
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        aria-label="Primary"
      >
        <div className="grid grid-cols-5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                      isActive && "bg-primary/10",
                    )}
                  >
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="max-w-full truncate px-0.5 text-center leading-tight">
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
