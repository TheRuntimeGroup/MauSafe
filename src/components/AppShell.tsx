import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Baby,
  HeartHandshake,
  Home,
  LifeBuoy,
  ListChecks,
  MapPinned,
  Megaphone,
  Phone,
  ShieldAlert,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { AccountMenu } from "@/components/AccountMenu";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", labelKey: "nav.home", shortLabelKey: "nav.homeShort", icon: Home, end: true },
  { to: "/check-ins", labelKey: "nav.checkins", shortLabelKey: "nav.checkinsShort", icon: ListChecks, end: false },
  { to: "/scam-check", labelKey: "nav.scam", shortLabelKey: "nav.scamShort", icon: ShieldAlert, end: false },
  { to: "/community", labelKey: "nav.community", shortLabelKey: "nav.community", icon: HeartHandshake, end: false },
];

const MOBILE_ITEMS = [
  { to: "/", labelKey: "nav.home", shortLabelKey: "nav.homeShort", icon: Home, end: true },
  { to: "/sos-map", labelKey: "nav.sosMap", shortLabelKey: "nav.sosMap", icon: MapPinned, end: false },
  { to: "/community", labelKey: "nav.community", shortLabelKey: "nav.community", icon: HeartHandshake, end: false },
  { to: "/child-safety", labelKey: "nav.kidZone", shortLabelKey: "nav.kidZone", icon: Baby, end: false },
];

export function AppShell() {
  const { t } = useI18n();
  const { isAdmin } = useIsAdmin();
  const { profile } = useAuth();
  const { pathname } = useLocation();
  const isChild = profile?.account_type === "child";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const mobileTab = (item: (typeof MOBILE_ITEMS)[number]) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "relative flex min-h-[4.5rem] flex-col items-center justify-center gap-1 px-0.5 text-[10px] font-semibold transition-colors",
          isActive ? "text-danger" : "text-muted-foreground hover:text-foreground",
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className={cn(
            "flex h-8 w-8 items-center justify-center rounded-xl",
            isActive && "bg-danger text-white shadow-sm",
          )}>
            <item.icon className="h-[19px] w-[19px]" strokeWidth={isActive ? 2.35 : 1.8} aria-hidden="true" />
          </span>
          <span className="max-w-full text-center leading-tight">{t(item.shortLabelKey)}</span>
        </>
      )}
    </NavLink>
  );

  if (isChild) {
    return (
      <div className="min-h-screen bg-background">
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -left-28 top-20 h-80 w-80 rounded-full bg-sky-300/25 blur-[100px]" />
          <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-emerald-200/25 blur-[110px]" />
          <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-amber-100/45 blur-[90px]" />
        </div>

        <header className="glass-panel sticky top-0 z-40 border-x-0 border-t-0 pt-[env(safe-area-inset-top)]">
          <div className="mx-auto flex h-[4.5rem] max-w-3xl items-center justify-between gap-3 px-5">
            <NavLink to="/kids" className="flex min-w-0 items-center gap-2.5" aria-label={t("nav.home")}>
              <Logo className="h-9 w-9 shrink-0" />
              <span className="font-display text-xl font-extrabold tracking-[-0.045em] text-foreground">
                {t("app.name")}
              </span>
            </NavLink>
            <AccountMenu variant="header" />
          </div>
        </header>

        <main className="relative z-10">
          <div className="mx-auto w-full max-w-3xl px-5 pb-24 pt-6 sm:px-6 lg:max-w-4xl lg:px-8 lg:pb-16 lg:pt-10">
            <Outlet />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:flex">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-28 top-20 h-80 w-80 rounded-full bg-sky-300/25 blur-[100px]" />
        <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-emerald-200/25 blur-[110px]" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-amber-100/45 blur-[90px]" />
      </div>

      <aside className="sticky top-0 z-10 hidden h-screen w-72 shrink-0 flex-col border-r border-white/70 bg-white/75 backdrop-blur-2xl lg:flex">
        <NavLink to="/" className="flex items-center gap-3 border-b border-foreground/[0.07] px-6 py-6">
          <Logo className="h-10 w-10 shrink-0" />
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
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                  isActive ? "bg-secondary text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.9} aria-hidden="true" />
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-4 border-t border-foreground/[0.07] p-5">
          <NavLink
            to="/emergency"
            className="flex items-center justify-between gap-3 rounded-xl bg-danger px-4 py-3.5 text-white shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <span className="flex items-center gap-2.5 text-sm font-extrabold">
              <Phone className="h-4 w-4" aria-hidden="true" />
              {t("nav.emergency")}
            </span>
            <span className="font-display text-lg font-extrabold">999</span>
          </NavLink>
          <NavLink
            to="/contacts"
            className="flex items-center gap-2.5 px-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
          >
            <HeartHandshake className="h-4 w-4" aria-hidden="true" />
            {t("nav.contacts")}
          </NavLink>
          {isAdmin && (
            <NavLink
              to="/admin/announcements"
              className="flex items-center gap-2.5 px-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
              <Megaphone className="h-4 w-4" aria-hidden="true" />
              {t("nav.admin")}
            </NavLink>
          )}
          <AccountMenu variant="sidebar" />
          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
            {t("footer.tagline")}
          </p>
        </div>
      </aside>

      <header className="glass-panel sticky top-0 z-40 border-x-0 border-t-0 pt-[env(safe-area-inset-top)] lg:hidden">
        <div className="mx-auto flex h-[4.5rem] max-w-3xl items-center justify-between gap-3 px-5">
          <NavLink to="/" className="flex min-w-0 items-center gap-2.5" aria-label={t("nav.home")}>
            <Logo className="h-9 w-9 shrink-0" />
            <span className="font-display text-xl font-extrabold tracking-[-0.045em] text-foreground">
              {t("app.name")}
            </span>
          </NavLink>
          <div className="flex shrink-0 items-center gap-2">
            <NavLink
              to="/contacts"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/[0.08] bg-white text-foreground shadow-sm transition-colors hover:text-primary"
              aria-label={t("nav.contacts")}
            >
              <HeartHandshake className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden="true" />
            </NavLink>
            <AccountMenu variant="header" />
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        <div className="mx-auto w-full max-w-3xl px-5 pb-40 pt-6 sm:px-6 lg:max-w-4xl lg:px-8 lg:pb-16 lg:pt-10">
          <Outlet />
          <footer className="mt-14 border-t border-foreground/[0.07] pt-6 text-center">
            <p className="text-xs text-muted-foreground">{t("footer.tagline")}</p>
            <p className="mx-auto mt-1 max-w-md text-[11px] leading-relaxed text-muted-foreground/80">
              {t("footer.dataNote")}
            </p>
          </footer>
        </div>
      </main>

      <nav
        className="glass-panel fixed inset-x-3 z-50 rounded-[1.5rem] px-2 shadow-[0_18px_50px_-12px_rgba(21,19,33,0.3)] lg:hidden"
        style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        aria-label={t("nav.menu")}
      >
        <div className="grid grid-cols-4 items-stretch">
          {MOBILE_ITEMS.map(mobileTab)}
        </div>
      </nav>
    </div>
  );
}
