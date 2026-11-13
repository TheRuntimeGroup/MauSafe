import { Link } from "react-router-dom";
import {
  Ambulance,
  ArrowRight,
  FileWarning,
  Flame,
  Footprints,
  HeartHandshake,
  MapPin,
  PhoneCall,
  Radar,
  ShieldAlert,
  ShieldCheck,
  Siren,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

const features = [
  {
    to: "/scam-check",
    icon: ShieldCheck,
    title: "Scam Check",
    description: "Check suspicious messages and links with explainable warning signals.",
    accent: "bg-[#E4F0E9] text-[#0D5C56]",
  },
  {
    to: "/sos",
    icon: Siren,
    title: "SOS Emergency",
    description: "One tap to the right emergency number for police, ambulance and fire.",
    accent: "bg-[#FBE4DE] text-[#A33D30]",
  },
  {
    to: "/nearby-help",
    icon: MapPin,
    title: "Nearby Help",
    description: "Find hospitals, police, fire stations and cyclone shelters near you.",
    accent: "bg-[#E7EEF8] text-[#2563EB]",
  },
  {
    to: "/safe-haven",
    icon: HeartHandshake,
    title: "Safe Haven",
    description: "A map of places that display a Safe Haven sticker for people in need.",
    accent: "bg-[#F4ECD9] text-[#9A6815]",
  },
  {
    to: "/walk-mate",
    icon: Footprints,
    title: "Walk Mate",
    description: "Share your live location with a trusted contact until you arrive safely.",
    accent: "bg-[#E3F0EC] text-[#176B62]",
  },
  {
    to: "/scam-watch",
    icon: Radar,
    title: "Scam Watch",
    description: "See community-reported scams and add your own so others stay aware.",
    accent: "bg-[#EEE7F6] text-[#6D28D9]",
  },
  {
    to: "/report",
    icon: FileWarning,
    title: "Anonymous Report",
    description: "Report an issue anonymously and track it with a private code.",
    accent: "bg-[#E9EDEA] text-[#42524B]",
  },
];

const emergencyButtons = [
  { label: "Police", number: "999 / 112", tel: "tel:999", icon: ShieldAlert, tone: "bg-[#0D5C56] text-white" },
  { label: "Ambulance", number: "114", tel: "tel:114", icon: Ambulance, tone: "bg-[#A33D30] text-white" },
  { label: "Fire", number: "115", tel: "tel:115", icon: Flame, tone: "bg-[#D97706] text-white" },
];

const Index = () => {
  return (
    <div>
      <section className="border-b border-[#DDE5DC]">
        <div className="mx-auto grid max-w-[1180px] items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#CADBCB] bg-[#EAF2E8] px-3.5 py-2 text-xs font-extrabold text-[#315E54]">
              <Logo className="h-4 w-4" />
              Built for Mauritius · Privacy-first
            </div>
            <h1 className="mt-6 max-w-xl font-display text-[2.6rem] font-extrabold leading-[1.04] tracking-[-0.05em] text-[#17332F] sm:text-5xl lg:text-[3.6rem]">
              Stay safer, <span className="font-serif font-medium italic tracking-[-0.035em] text-[#0D5C56]">together.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#5B6D67] sm:text-lg sm:leading-8">
              Check scams, reach the right help fast, find safe places, and let trusted people know you arrived safely.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/scam-check"
                className="group inline-flex min-h-[52px] items-center gap-3 rounded-2xl bg-[#0D5C56] px-6 font-display text-sm font-extrabold text-white shadow-[0_12px_24px_-14px_rgba(13,92,86,0.9)] transition hover:bg-[#084B46]"
              >
                Check something now
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <Link
                to="/sos"
                className="inline-flex min-h-[52px] items-center gap-3 rounded-2xl border border-[#E0B9B0] bg-[#FFF0ED] px-6 font-display text-sm font-extrabold text-[#A33D30] transition hover:bg-[#FBE4DE]"
              >
                <Siren className="h-4 w-4" aria-hidden="true" />
                Emergency help
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#D6E0D7] bg-white p-5 shadow-[0_28px_70px_-42px_rgba(23,51,47,0.45)] sm:p-6">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#71827A]">
              <PhoneCall className="h-4 w-4" aria-hidden="true" />
              In an emergency
            </div>
            <p className="mt-2 text-sm leading-6 text-[#5B6D67]">
              Tap to open your phone dialer. This app does not call emergency services for you.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {emergencyButtons.map((button) => (
                <a
                  key={button.label}
                  href={button.tel}
                  className={cn(
                    "flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl p-4 text-center transition active:scale-[0.98]",
                    button.tone,
                  )}
                >
                  <button.icon className="h-7 w-7" strokeWidth={1.8} aria-hidden="true" />
                  <span className="font-display text-base font-extrabold">{button.label}</span>
                  <span className="font-mono text-xs font-bold opacity-90">{button.number}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8" aria-labelledby="features-title">
        <div className="max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#0D5C56]">Seven tools, one app</p>
          <h2 id="features-title" className="mt-3 font-display text-3xl font-bold tracking-[-0.04em] text-[#17332F] sm:text-4xl">
            What do you need right now?
          </h2>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Link
              key={feature.to}
              to={feature.to}
              className={cn(
                "group flex min-h-[220px] flex-col justify-between rounded-[1.75rem] border border-[#DCE4DD] bg-white p-6 shadow-[0_12px_35px_-28px_rgba(23,51,47,0.5)] transition hover:-translate-y-0.5 hover:border-[#BFD0C4]",
                index === 0 && "sm:col-span-2 lg:col-span-1",
              )}
            >
              <div>
                <span className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", feature.accent)}>
                  <feature.icon className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-xl font-bold tracking-tight text-[#17332F]">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5B6D67]">{feature.description}</p>
              </div>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#0D5C56]">
                Open
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-[#DDE5DC] bg-[#EDF2EB]">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <Logo className="h-9 w-9" />
            <div>
              <p className="font-display text-sm font-extrabold text-[#17332F]">AnouSecure Moris</p>
              <p className="mt-0.5 text-xs text-[#71827A]">A clearer next step when something feels off.</p>
            </div>
          </div>
          <p className="max-w-lg text-xs leading-5 text-[#687A72] md:text-right">
            Tools support your judgement; they do not replace official verification or emergency services. Location is only used with your consent.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Index;
