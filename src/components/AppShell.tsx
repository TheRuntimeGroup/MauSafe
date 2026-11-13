import { NavLink, Outlet } from "react-router-dom";
import {
  ChevronRight,
  Home,
  LifeBuoy,
  ListChecks,
  Phone,
  PhoneCall,
  ShieldAlert,
} from "lucide-react";
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
        <div className="flex items-center gap-3 px-5 pb-5 pt-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
            <Logo className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-extrabold leading-tight text-foreground">
              {t("app.name")}
            </p>
            <p className="truncate text-[11px] font-medium text-muted-foreground">
              {t("app.tagline")}
            </p>
          </div>
        </div>

        <div className="mx-5 mb-5 flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
          <span className="truncate text-xs font-semibold text-primary">{t("app.badge")}</span>
        </div>

        <p className="px-6 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
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
                  "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground hover:bg-muted",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                      isActive ? "bg-white/20" : "bg-muted group-hover:bg-background",
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  {t(item.labelKey)}
                  {isActive && (
                    <ChevronRight className="ml-auto h-4 w-4 opacity-80" aria-hidden="true" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-3 border-t border-border p-4">
          <a
            href="tel:999"
            className="group flex items-center gap-3 rounded-2xl bg-danger p-3.5 text-white transition-transform hover:scale-[1.01]"
          >
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <Phone className="h-5 w-5" aria-hidden="true" />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-white ring-2 ring-danger" />
            </span>
            <span className="min-w-0 text-left">
              <span className="block text-sm font-bold leading-tight">{t("help.call999")}</span>
              <span className="block text-[11px] text-white/75">{t("home.quickHelp")}</span>
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

      {/* Mobile header */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <NavLink to="/" className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
              <Logo className="h-6 w-6" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-base font-extrabold leading-none text-foreground">
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
              className="flex h-10 items-center gap-1.5 rounded-xl bg-danger px-3 text-sm font-bold text-white shadow-sm"
              aria-label={t("help.call999")}
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              999
            </a>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-dots opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
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
