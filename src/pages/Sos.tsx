import { Link } from "react-router-dom";
import {
  Ambulance,
  ArrowRight,
  Baby,
  Flame,
  Footprints,
  HeartPulse,
  Info,
  MapPin,
  PhoneCall,
  ShieldAlert,
  Siren,
} from "lucide-react";
import { cn } from "@/lib/utils";

const emergency = [
  {
    label: "Police",
    detail: "Immediate danger, crime in progress, or reporting a serious incident.",
    numbers: ["999", "112"],
    icon: ShieldAlert,
    tone: "bg-[#0D5C56]",
    soft: "bg-[#E4F0E9] text-[#0D5C56]",
  },
  {
    label: "Ambulance (SAMU)",
    detail: "Medical emergencies needing an ambulance right away.",
    numbers: ["114"],
    icon: Ambulance,
    tone: "bg-[#A33D30]",
    soft: "bg-[#FBE4DE] text-[#A33D30]",
  },
  {
    label: "Fire & Rescue",
    detail: "Fire, rescue, or a trapped-person emergency.",
    numbers: ["115"],
    icon: Flame,
    tone: "bg-[#D97706]",
    soft: "bg-[#F8EBD7] text-[#9A5B0C]",
  },
];

const helplines = [
  { label: "Gender-based violence / Family Protection", number: "139", icon: HeartPulse },
  { label: "Child protection helpline", number: "113", icon: Baby },
];

const steps = [
  "Stay calm and give the operator your exact location first.",
  "State the emergency clearly: what happened, who is involved, and whether anyone is hurt.",
  "Follow the operator's instructions and do not hang up until they tell you to.",
  "If it is safe, ask a nearby person to help or guide emergency services to you.",
];

const Sos = () => {
  return (
    <div>
      <section className="border-b border-[#DDE5DC] bg-[#17332F] text-[#F8FAF3]">
        <div className="mx-auto max-w-[980px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#DDF566]/30 bg-[#DDF566]/10 px-3.5 py-2 text-xs font-extrabold text-[#DDF566]">
              <Siren className="h-4 w-4" aria-hidden="true" />
              Emergency numbers for Mauritius
            </div>
            <h1 className="mt-6 max-w-2xl font-display text-[2.4rem] font-extrabold leading-[1.04] tracking-[-0.05em] sm:text-5xl">
              Help is one tap away.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#C4D1CC]">
              Tapping a number opens your phone dialer. This app does not call or message emergency services on your behalf.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[980px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8" aria-label="Emergency numbers">
        <div className="grid gap-4 md:grid-cols-3">
          {emergency.map((item) => (
            <article key={item.label} className="overflow-hidden rounded-[1.75rem] border border-[#DCE4DD] bg-white shadow-[0_12px_35px_-28px_rgba(23,51,47,0.5)]">
              <div className={cn("p-5 text-white", item.tone)}>
                <item.icon className="h-8 w-8" strokeWidth={1.7} aria-hidden="true" />
                <h2 className="mt-4 font-display text-xl font-extrabold">{item.label}</h2>
              </div>
              <div className="p-5">
                <p className="text-sm leading-6 text-[#5B6D67]">{item.detail}</p>
                <div className="mt-4 grid gap-2">
                  {item.numbers.map((number) => (
                    <a
                      key={number}
                      href={`tel:${number}`}
                      className="flex min-h-14 items-center justify-between rounded-2xl border border-[#DCE4DD] px-4 font-mono text-xl font-bold text-[#17332F] transition hover:border-[#0D5C56] hover:bg-[#F3F7F2]"
                    >
                      {number}
                      <PhoneCall className="h-5 w-5 text-[#0D5C56]" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-[1.75rem] border border-[#EACD8D] bg-[#FFF6E2] p-5">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#9A6815]" aria-hidden="true" />
            <p className="text-sm leading-6 text-[#6D5224]">
              Emergency numbers can change. For the most up-to-date official numbers, check the Mauritius Police Force, Ministry of Health and the National Disaster Risk Reduction and Management Centre (NDRRMC).
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[980px] px-4 pb-6 sm:px-6 lg:px-8" aria-labelledby="helplines-title">
        <h2 id="helplines-title" className="font-display text-2xl font-bold tracking-[-0.03em] text-[#17332F]">Support helplines</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {helplines.map((helpline) => (
            <a
              key={helpline.number}
              href={`tel:${helpline.number}`}
              className="flex items-center gap-4 rounded-2xl border border-[#DCE4DD] bg-white p-5 transition hover:border-[#0D5C56]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E7F0E8] text-[#0D5C56]">
                <helpline.icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-[#17332F]">{helpline.label}</span>
                <span className="mt-0.5 block font-mono text-sm font-bold text-[#315E54]">{helpline.number}</span>
              </span>
              <PhoneCall className="h-5 w-5 shrink-0 text-[#71827A]" aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[980px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[1.75rem] bg-[#17332F] p-6 text-[#F8FAF3] sm:p-8" aria-labelledby="call-title">
            <h2 id="call-title" className="font-display text-2xl font-bold tracking-[-0.03em]">When you call</h2>
            <ol className="mt-6 space-y-5">
              {steps.map((step, index) => (
                <li key={step} className="flex items-start gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#DDF566]/40 font-mono text-xs font-bold text-[#DDF566]">
                    {index + 1}
                  </span>
                  <p className="pt-0.5 text-sm leading-6 text-[#E0E8E3]">{step}</p>
                </li>
              ))}
            </ol>
          </article>

          <article className="rounded-[1.75rem] border border-[#DCE4DD] bg-white p-6 sm:p-8" aria-labelledby="related-title">
            <h2 id="related-title" className="font-display text-2xl font-bold tracking-[-0.03em] text-[#17332F]">Related tools</h2>
            <div className="mt-6 space-y-3">
              <Link to="/walk-mate" className="group flex items-center gap-4 rounded-2xl border border-[#E1E8E1] p-4 transition hover:border-[#0D5C56]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E3F0EC] text-[#176B62]">
                  <Footprints className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-[#17332F]">Share your live location</span>
                  <span className="mt-0.5 block text-xs leading-5 text-[#687A72]">Let a trusted contact follow your journey until you arrive safely.</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#71827A] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <Link to="/nearby-help" className="group flex items-center gap-4 rounded-2xl border border-[#E1E8E1] p-4 transition hover:border-[#0D5C56]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E7EEF8] text-[#2563EB]">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-[#17332F]">Find the nearest help</span>
                  <span className="mt-0.5 block text-xs leading-5 text-[#687A72]">Hospitals, police, fire stations and cyclone shelters.</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#71827A] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
};

export default Sos;
