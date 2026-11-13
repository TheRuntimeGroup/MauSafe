import { ArrowDown, LockKeyhole, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { InfoSections } from "@/components/scam/InfoSections";
import { ScamChecker } from "@/components/scam/ScamChecker";

const Index = () => {
  return (
    <div className="min-h-screen bg-[#F5F7F2] text-[#17332F]">
      <header className="border-b border-[#DDE5DC] bg-[#F5F7F2]/95">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-5 px-4 py-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-3 rounded-xl" aria-label="AnouSecure Moris home">
            <Logo className="h-10 w-10 sm:h-11 sm:w-11" />
            <span>
              <span className="block font-display text-[17px] font-extrabold leading-none tracking-[-0.04em] text-[#17332F]">AnouSecure</span>
              <span className="mt-1 block font-mono text-[9px] font-bold uppercase tracking-[0.27em] text-[#527269]">Moris</span>
            </span>
          </a>
          <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
            <a href="#checker" className="rounded-md text-sm font-bold text-[#0D5C56] hover:underline">Scam check</a>
            <a href="#how-it-works" className="rounded-md text-sm font-semibold text-[#5B6D67] transition hover:text-[#0D5C56]">How it works</a>
            <a href="#after-click" className="rounded-md text-sm font-semibold text-[#5B6D67] transition hover:text-[#0D5C56]">After a click</a>
          </nav>
          <div className="flex items-center gap-2 rounded-full border border-[#D5E0D6] bg-white px-3 py-2 text-xs font-bold text-[#315E54] sm:px-4">
            <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Privacy-first</span>
            <span className="sm:hidden">Private</span>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="mx-auto grid max-w-[1180px] items-center gap-10 px-4 pb-12 pt-12 sm:px-6 sm:pb-16 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-20 lg:pt-20">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#CADBCB] bg-[#EAF2E8] px-3.5 py-2 text-xs font-extrabold text-[#315E54]">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Built for Mauritius · Useful anywhere
            </div>
            <h1 className="mt-6 max-w-xl font-display text-[2.75rem] font-extrabold leading-[1.02] tracking-[-0.055em] text-[#17332F] sm:text-6xl lg:text-[4.25rem]">
              A second opinion <span className="font-serif font-medium italic tracking-[-0.035em] text-[#0D5C56]">before you click.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[#5B6D67] sm:text-lg sm:leading-8">
              Paste a suspicious message or link. We’ll highlight the red flags, inspect the destination and show the evidence in plain language.
            </p>
            <a href="#checker" className="group mt-8 inline-flex min-h-[52px] items-center gap-3 rounded-2xl bg-[#0D5C56] px-6 font-display text-sm font-extrabold text-white shadow-[0_12px_24px_-14px_rgba(13,92,86,0.9)] transition hover:bg-[#084B46]">
              Check something now
              <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
            </a>
            <p className="mt-4 text-xs font-semibold text-[#71827A]">No sign-up. No scare tactics. Just evidence.</p>
          </div>
          <div className="relative mx-auto w-full max-w-[520px] animate-fade-in-up lg:mx-0">
            <img
              src="/scam-check-illustration.svg"
              alt="A security shield inspecting a suspicious message and link"
              className="h-auto w-full rounded-[2.25rem]"
              width="520"
              height="340"
            />
            <div className="absolute -bottom-4 left-4 right-4 flex items-center justify-between gap-3 rounded-2xl border border-[#D5E0D6] bg-white px-4 py-3 shadow-[0_18px_35px_-25px_rgba(23,51,47,0.65)] sm:left-8 sm:right-8 sm:px-5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#315E54]"><span className="h-2 w-2 rounded-full bg-[#4C8A62]" aria-hidden="true" /> Message signals</div>
              <div className="h-4 w-px bg-[#DCE4DD]" aria-hidden="true" />
              <div className="flex items-center gap-2 text-xs font-bold text-[#315E54]"><span className="h-2 w-2 rounded-full bg-[#4C8A62]" aria-hidden="true" /> Live link checks</div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[920px] px-4 sm:px-6 lg:px-8">
          <ScamChecker />
        </div>

        <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
          <InfoSections />
        </div>
      </main>

      <footer className="border-t border-[#DDE5DC] bg-[#EDF2EB]">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <Logo className="h-9 w-9" />
            <div>
              <p className="font-display text-sm font-extrabold text-[#17332F]">AnouSecure Moris</p>
              <p className="mt-0.5 text-xs text-[#71827A]">A clearer next step when something feels off.</p>
            </div>
          </div>
          <p className="max-w-lg text-xs leading-5 text-[#687A72] md:text-right">
            Automated checks support your judgement; they do not replace official verification or guarantee that a sender, business or website is genuine.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
