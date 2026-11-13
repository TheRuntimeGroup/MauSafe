import { ArrowDown, FileSearch, Link2, MessagesSquare, ShieldCheck } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: MessagesSquare,
    title: "Read the language",
    text: "We look for pressure, secrecy, payment demands, credential requests and other explainable warning signs in English, French and Mauritian Creole.",
  },
  {
    number: "02",
    icon: Link2,
    title: "Inspect the destination",
    text: "Links are parsed without opening them in your browser. We check their structure, DNS and—if enabled—the server response and redirect chain.",
  },
  {
    number: "03",
    icon: ShieldCheck,
    title: "Cross-check reputation",
    text: "Trustpilot, Google Safe Browsing and VirusTotal results stay separate, so you can see exactly which provider responded and what it actually said.",
  },
];

export function InfoSections() {
  return (
    <>
      <section id="how-it-works" className="scroll-mt-24 py-16 sm:py-24" aria-labelledby="how-title">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#0D5C56]">Evidence, not guesswork</p>
          <h2 id="how-title" className="mt-3 font-display text-3xl font-bold tracking-[-0.04em] text-[#17332F] sm:text-4xl">
            Three layers. One clear answer.
          </h2>
          <p className="mt-4 text-base leading-7 text-[#5B6D67]">
            Each layer looks at different evidence. No single green tick is treated as proof that a message or website is genuine.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <article key={step.number} className="rounded-[1.75rem] border border-[#DCE4DD] bg-white p-6 shadow-[0_12px_35px_-28px_rgba(23,51,47,0.5)] sm:p-7">
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E7F0E8] text-[#0D5C56]">
                  <step.icon className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className="font-mono text-xs font-bold tracking-widest text-[#81918A]">{step.number}</span>
              </div>
              <h3 className="mt-6 font-display text-xl font-bold tracking-tight text-[#17332F]">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#5B6D67]">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] bg-[#17332F] text-[#F8FAF3]" aria-labelledby="verdict-title">
        <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
          <div className="border-b border-white/10 p-7 sm:p-10 lg:border-b-0 lg:border-r">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DDF566] text-[#17332F]">
              <FileSearch className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 id="verdict-title" className="mt-7 font-display text-3xl font-bold tracking-[-0.04em]">A score you can understand.</h2>
            <p className="mt-4 text-sm leading-7 text-[#C4D1CC]">
              The number is a warning-signal score, not the probability that something is a scam. Unavailable checks never count as clean results.
            </p>
            <a href="#checker" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#DDF566] hover:underline">
              Run a check <ArrowDown className="h-4 w-4 -rotate-90" aria-hidden="true" />
            </a>
          </div>
          <div className="divide-y divide-white/10 p-7 sm:p-10">
            {[
              ["0–14", "No strong signals", "Nothing obvious matched, but legitimacy is still unproven."],
              ["15–54", "Proceed with caution", "One or more details deserve independent verification."],
              ["55–100", "High-risk signals", "Stop and verify. Known provider threats also place a result here."],
            ].map(([range, title, copy]) => (
              <div key={range} className="grid gap-2 py-5 first:pt-0 last:pb-0 sm:grid-cols-[80px_1fr] sm:gap-5">
                <span className="font-mono text-sm font-bold text-[#DDF566]">{range}</span>
                <div>
                  <h3 className="font-display font-bold">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#C4D1CC]">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="after-click" className="scroll-mt-24 py-16 sm:py-24" aria-labelledby="after-click-title">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#0D5C56]">Already interacted?</p>
            <h2 id="after-click-title" className="mt-3 font-display text-3xl font-bold tracking-[-0.04em] text-[#17332F] sm:text-4xl">
              Act quickly. Don’t act alone.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#5B6D67]">
              You do not need to feel embarrassed. Scams are designed to pressure anyone. These steps can help limit the damage.
            </p>
          </div>
          <div className="space-y-3">
            {[
              ["If you paid or shared card details", "Contact your bank immediately using the number in its official app, on your card or on an official statement. Ask about blocking the card and disputing the transaction."],
              ["If you entered a password", "Change it from the official app or a manually entered official website. Change it anywhere else you reused it, turn on multi-factor authentication and review active sessions."],
              ["If you shared a one-time code", "Contact the affected service or bank now and explain what happened. A one-time code can allow someone to approve a payment or take over an account."],
              ["If you installed an app or file", "Disconnect the device from the internet, do not enter more credentials, and seek qualified technical support. Avoid deleting evidence before getting advice."],
            ].map(([title, copy], index) => (
              <details key={title} className="group rounded-2xl border border-[#DCE4DD] bg-white px-5 open:shadow-sm" open={index === 0}>
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 font-display text-sm font-bold text-[#17332F] marker:hidden">
                  {title}
                  <span className="relative h-5 w-5 shrink-0 rounded-full bg-[#E7F0E8] before:absolute before:left-1.5 before:top-[9px] before:h-0.5 before:w-2 before:bg-[#0D5C56] after:absolute after:left-[9px] after:top-1.5 after:h-2 after:w-0.5 after:bg-[#0D5C56] group-open:after:hidden" aria-hidden="true" />
                </summary>
                <p className="pb-5 pr-6 text-sm leading-6 text-[#5B6D67]">{copy}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
