import { LockKeyhole, ShieldCheck } from "lucide-react";
import { InfoSections } from "@/components/scam/InfoSections";
import { ScamChecker } from "@/components/scam/ScamChecker";

const ScamCheck = () => {
  return (
    <div>
      <section className="border-b border-[#DDE5DC]">
        <div className="mx-auto max-w-[920px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#CADBCB] bg-[#EAF2E8] px-3.5 py-2 text-xs font-extrabold text-[#315E54]">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Explainable warning signals · English, French &amp; Creole
            </div>
            <h1 className="mt-6 max-w-2xl font-display text-[2.4rem] font-extrabold leading-[1.04] tracking-[-0.05em] text-[#17332F] sm:text-5xl">
              A second opinion <span className="font-serif font-medium italic tracking-[-0.035em] text-[#0D5C56]">before you click.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#5B6D67] sm:text-lg sm:leading-8">
              Paste a suspicious message or link. We highlight the red flags, inspect the destination and show the evidence in plain language.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[920px] px-4 pt-10 sm:px-6 lg:px-8">
        <ScamChecker />
      </div>

      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <InfoSections />
      </div>

      <div className="mx-auto max-w-[920px] px-4 pb-12 sm:px-6 lg:px-8">
        <p className="flex items-start justify-center gap-2 text-center text-xs leading-5 text-[#71827A]">
          <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#527269]" aria-hidden="true" />
          Message text is never sent to Trustpilot, Google or VirusTotal. Only the URL or domain needed for each lookup is shared.
        </p>
      </div>
    </div>
  );
};

export default ScamCheck;
