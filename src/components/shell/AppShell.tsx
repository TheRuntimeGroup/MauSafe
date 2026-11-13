import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  FileWarning,
  Footprints,
  HeartHandshake,
  House,
  MapPin,
  Menu,
  Radar,
  ShieldCheck,
  Siren,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: typeof House;
  end?: boolean;
}

const primaryNav: NavItem[] = [
  { to: "/", label: "Home", icon: House, end: true },
  { to: "/scam-check", label: "Scam Check", icon: ShieldCheck },
  { to: "/sos", label: "SOS", icon: Siren },
  { to: "/nearby-help", label: "Nearby Help", icon: MapPin },
];

const moreNav: NavItem[] = [
  { to: "/safe-haven", label: "Safe Haven", icon: HeartHandshake },
  { to: "/walk-mate", label: "Walk Mate", icon: Footprints },
  { to: "/scam-watch", label: "Scam Watch", icon: Radar },
  { to: "/report", label: "Anonymous Report", icon: FileWarning },
];

function NavEntry({ item, onNavigate, compact }: { item: NavItem; onNavigate?: () => void; compact?: boolean }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-2xl font-bold transition",
          compact
            ? "min-h-12 px-3 text-sm"
            : "min-h-14 flex-col justify-center gap-1 px-2 py-2 text-[11px]",
          isActive
            ? "bg-[#E4F0E9] text-[#0D5C56]"
            : "text-[#5B6D67] hover:bg-[#EFF4EF] hover:text-[#17332F]",
        )
      }
    >
      <item.icon className={cn("shrink-0", compact ? "h-5 w-5" : "h-6 w-6")} strokeWidth={2} aria-hidden="true" />
      <span className={cn(compact && "text-left")}>{item.label}</span>
    </NavLink>
  );
}

export function AppShell() {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  const isActive = (path: string, end?: boolean) =>
    end ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-[#F5F7F2] text-[#17332F]">
      <header className="sticky top-0 z-40 border-b border-[#DDE5DC] bg-[#F5F7F2]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <NavLink to="/" className="flex items-center gap-3 rounded-xl" aria-label="AnouSecure Moris home">
            <Logo className="h-9 w-9 sm:h-10 sm:w-10" />
            <span>
              <span className="block font-display text-[16px] font-extrabold leading-none tracking-[-0.04em] text-[#17332F]">AnouSecure</span>
              <span className="mt-1 block font-mono text-[9px] font-bold uppercase tracking-[0.27em] text-[#527269]">Moris</span>
            </span>
          </NavLink>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {primaryNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={cn(
                  "rounded-xl px-3.5 py-2 text-sm font-bold transition",
                  isActive(item.to, item.end)
                    ? "bg-[#E4F0E9] text-[#0D5C56]"
                    : "text-[#5B6D67] hover:bg-[#EFF4EF] hover:text-[#17332F]",
                )}
              >
                {item.label}
              </NavLink>
            ))}
            {moreNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-xl px-3.5 py-2 text-sm font-bold transition",
                  isActive(item.to)
                    ? "bg-[#E4F0E9] text-[#0D5C56]"
                    : "text-[#5B6D67] hover:bg-[#EFF4EF] hover:text-[#17332F]",
                )}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#D5E0D6] bg-white px-3.5 text-sm font-bold text-[#315E54] transition hover:bg-[#F3F7F2] md:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
            More
          </button>
        </div>
      </header>

      <main className="pb-24 md:pb-12">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#DDE5DC] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        aria-label="Main navigation"
      >
        <div className="mx-auto grid max-w-[640px] grid-cols-5 gap-1 px-2 py-1.5">
          {primaryNav.map((item) => (
            <NavEntry key={item.to} item={item} />
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-bold transition",
              moreNav.some((item) => isActive(item.to))
                ? "bg-[#E4F0E9] text-[#0D5C56]"
                : "text-[#5B6D67] hover:bg-[#EFF4EF] hover:text-[#17332F]",
            )}
          >
            <Menu className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
            More
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-[1.75rem] px-5 pb-8 pt-6 sm:max-w-none">
          <SheetHeader className="text-left">
            <SheetTitle className="font-display text-xl font-extrabold text-[#17332F]">More safety tools</SheetTitle>
            <SheetDescription className="text-sm text-[#687A72]">Everything AnouSecure Moris offers, in one place.</SheetDescription>
          </SheetHeader>
          <div className="mt-5 grid grid-cols-1 gap-2">
            {primaryNav.map((item) => (
              <NavEntry key={item.to} item={item} compact onNavigate={() => setMoreOpen(false)} />
            ))}
            {moreNav.map((item) => (
              <NavEntry key={item.to} item={item} compact onNavigate={() => setMoreOpen(false)} />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
