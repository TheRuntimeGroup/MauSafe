import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  Heart,
  Home,
  LifeBuoy,
  ListChecks,
  Moon,
  Phone,
  ShieldAlert,
  Siren,
  Sun,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { Logo } from "@/components/Logo";
import { AmbientBackground } from "@/components/AmbientBackground";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", labelKey: "nav.home", shortLabelKey: "nav.homeShort", icon: Home, end: true },
  { to: "/check-ins", labelKey: "nav.checkins", shortLabelKey: "nav.checkinsShort", icon: ListChecks, end: false },
  { to: "/scam-check", labelKey: "nav.scam", shortLabelKey: "nav.scamShort", icon: ShieldAlert, end: false },
  { to: "/get-help", labelKey: "nav.gethelp", shortLabelKey: "nav.gethelpShort", icon: LifeBuoy, end: false },
];

const MOBILE_ITEMS = NAV_ITEMS;
type Theme = "light" | "dark";

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem("mausafe.theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Use system preference when storage is unavailable.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function AppShell() {
  const { t } = useI18n();
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("mausafe.theme", theme);
    } catch {
      // The visual theme still works when persistence is unavailable.
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#101728" : "#0A4C8C");
  }, [theme]);

  const themeToggle = (
    <button
      type="button"
      onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
      aria-label={theme === "dark" ? t("theme.light") : t("theme.dark")}
      title={theme === "dark" ? t("theme.light") : t("theme.dark")}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-foreground/[0.08] bg-card text-foreground shadow-sm transition-colors hover:text-primary"
    >
      {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );

  const mobileTab = (item: (typeof MOBILE_ITEMS)[number]) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "relative flex min-h-[4.25rem] flex-col items-center justify-center gap-1.5 px-1 text-[10px] font-semibold transition-colors",
          isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute top-2 h-1 w-1 rounded-full bg-primary" aria-hidden="true" />}
          <item.icon className="h-[21px] w-[21px]" strokeWidth={isActive ? 2.35 : 1.8} aria-hidden="true" />
          <span className="max-w-full truncate leading-tight">{t(item.shortLabelKey)}</span>
        </>
      )}
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-background lg:flex">
      <AmbientBackground />

      <aside className="sticky top-0 z-10 hidden h-screen w-72 shrink-0 flex-col border-r border-border bg-card/75 backdrop-blur-2xl lg:flex">
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
            <Heart className="h-4 w-4" aria-hidden="true" />
            {t("nav.contacts")}
          </NavLink>
          <div className="flex items-center justify-between gap-2">
            <LanguageSwitcher />
            {themeToggle}
          </div>
          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
            {t("footer.tagline")}
          </p>
        </div>
      </aside>

      <header className="glass-panel sticky top-0 z-40 border-x-0 border-t-0 pt-[env(safe-area-inset-top)] lg:hidden">
        <div className="mx-auto flex h-[4.5rem] max-w-3xl items-center justify-between gap-3 px-5">
          <NavLink to="/" className="flex min-w-0 items-center gap-2.5" aria-label={t("nav.home")}>
            <Logo className="h-9 w-9 shrink-0" />
            <span className="hidden font-display text-xl font-extrabold tracking-[-0.045em] text-foreground min-[360px]:inline">
              {t("app.name")}
            </span>
          </NavLink>
          <div className="flex shrink-0 items-center gap-2">
            <NavLink
              to="/contacts"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/[0.08] bg-card text-foreground shadow-sm transition-colors hover:text-primary"
              aria-label={t("nav.contacts")}
            >
              <Heart className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden="true" />
            </NavLink>
            <LanguageSwitcher compact />
            {themeToggle}
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
        <div className="grid grid-cols-[1fr_1fr_4.5rem_1fr_1fr] items-stretch">
          {MOBILE_ITEMS.slice(0, 2).map(mobileTab)}
          <NavLink
            to="/emergency"
            className="group relative flex min-h-[4.25rem] -translate-y-3 flex-col items-center justify-start gap-1.5"
            aria-label={t("nav.emergency")}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger text-white shadow-[0_10px_25px_-8px_rgba(220,38,38,0.65)] ring-4 ring-background transition-transform group-active:scale-95">
              <Siren className="h-6 w-6" strokeWidth={2.2} aria-hidden="true" />
            </span>
            <span className="text-[9px] font-extrabold tracking-[0.12em] text-danger">SOS</span>
          </NavLink>
          {MOBILE_ITEMS.slice(2).map(mobileTab)}
        </div>
      </nav>
    </div>
  );
}
