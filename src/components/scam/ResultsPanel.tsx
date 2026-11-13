import { type ReactNode, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clipboard,
  CloudOff,
  Download,
  ExternalLink,
  FileWarning,
  Globe2,
  Link2,
  LoaderCircle,
  MessageSquareText,
  RotateCcw,
  ScanSearch,
  Server,
  ShieldAlert,
  ShieldCheck,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import type {
  RiskLevel,
  ScamCheckResult,
  UrlInspection,
} from "@/lib/scamCheck";
import { cn } from "@/lib/utils";

const riskPresentation: Record<
  RiskLevel,
  {
    label: string;
    title: string;
    description: string;
    icon: typeof ShieldCheck;
    panel: string;
    badge: string;
    iconColor: string;
    ring: string;
  }
> = {
  low: {
    label: "No strong signals",
    title: "Nothing obvious stood out.",
    description: "No strong warning signals matched this check. That does not confirm the message or website is legitimate.",
    icon: ShieldCheck,
    panel: "border-[#BFDCC8] bg-[#EDF6EE]",
    badge: "bg-[#D6EBDA] text-[#235D3D]",
    iconColor: "text-[#2C754D]",
    ring: "#2C754D",
  },
  medium: {
    label: "Proceed with caution",
    title: "Some details need a second look.",
    description: "Warning signals were found. Pause and verify the request independently before you click, reply or pay.",
    icon: AlertTriangle,
    panel: "border-[#EACD8D] bg-[#FFF6E2]",
    badge: "bg-[#F5E1AD] text-[#78500F]",
    iconColor: "text-[#9A6815]",
    ring: "#B27A19",
  },
  high: {
    label: "High-risk signals",
    title: "Stop and verify before acting.",
    description: "Strong scam signals or a known external threat were detected. Do not share money, codes or login details.",
    icon: ShieldAlert,
    panel: "border-[#EAB6AB] bg-[#FFF0ED]",
    badge: "bg-[#F4D2CA] text-[#8B3327]",
    iconColor: "text-[#A33D30]",
    ring: "#A33D30",
  },
};

function sourceTone(status: string): string {
  if (["threat_detected", "flagged", "blocked"].includes(status)) return "bg-[#F8DCD6] text-[#8B3327]";
  if (["clear", "resolved", "reachable", "found"].includes(status)) return "bg-[#DFEEE3] text-[#285D3F]";
  if (["failed"].includes(status)) return "bg-[#F7E8C8] text-[#78500F]";
  return "bg-[#E9EEEA] text-[#56665F]";
}

function sourceLabel(status: string): string {
  const labels: Record<string, string> = {
    resolved: "Resolved",
    failed: "No DNS result",
    blocked: "Blocked safely",
    reachable: "Responded",
    unreachable: "No response",
    found: "Profile found",
    not_found: "No exact report",
    unavailable: "Unavailable",
    not_requested: "Turned off",
    clear: "No match",
    threat_detected: "Threat matched",
    flagged: "Engine flags",
  };
  return labels[status] ?? status.replace(/_/g, " ");
}

function SourceRow({
  icon: Icon,
  name,
  status,
  children,
  action,
}: {
  icon: typeof Globe2;
  name: string;
  status: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#E1E7E1] bg-[#FBFCFA] p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#315E54] shadow-sm">
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
        </span>
        <h4 className="min-w-0 flex-1 font-display text-sm font-bold text-[#17332F]">{name}</h4>
        <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-extrabold capitalize", sourceTone(status))}>
          {sourceLabel(status)}
        </span>
      </div>
      <div className="mt-3 text-sm leading-6 text-[#5B6D67]">{children}</div>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

function UrlInspectionCard({ link, index }: { link: UrlInspection; index: number }) {
  const trustpilotAction = (
    <a
      href={link.trustpilot.profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-extrabold text-[#0D5C56] hover:bg-[#E7F0E8] hover:underline"
    >
      {link.trustpilot.status === "found" ? "Open Trustpilot profile" : "Search Trustpilot manually"}
      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-[#DCE4DD] bg-white">
      <header className="border-b border-[#E4EAE4] bg-[#F7F9F6] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#E2EDE5] text-[#0D5C56]">
            <Link2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#71827A]">Link {index + 1} inspection</p>
            <h3 className="mt-1 break-all font-display text-lg font-bold tracking-tight text-[#17332F]">{link.hostname}</h3>
          </div>
          <span className="shrink-0 rounded-full border border-[#D5DED6] bg-white px-3 py-1.5 font-mono text-xs font-bold text-[#315E54]">
            +{link.score}
          </span>
        </div>
        <code className="mt-4 block break-all rounded-xl border border-[#DFE6DF] bg-white px-3 py-2.5 font-mono text-xs leading-5 text-[#52645D]">
          {link.normalizedUrl}
        </code>
      </header>

      <div className="space-y-6 p-5 sm:p-6">
        <section aria-labelledby={`structure-${index}`}>
          <h4 id={`structure-${index}`} className="font-display text-base font-bold text-[#17332F]">Address structure</h4>
          {link.signals.length === 0 ? (
            <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-[#5B6D67]">
              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#2C754D]" aria-hidden="true" />
              None of the deceptive URL patterns in this checker matched. Domain ownership is still unverified.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {link.signals.map((signal) => (
                <li key={signal.id} className="rounded-2xl bg-[#FFF5E6] p-4">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#9A6815]" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-bold text-[#654918]">{signal.title}</p>
                      <p className="mt-1 text-sm leading-6 text-[#756143]">{signal.explanation}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby={`technical-${index}`}>
          <h4 id={`technical-${index}`} className="mb-3 font-display text-base font-bold text-[#17332F]">Technical inspection</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <SourceRow icon={Server} name="DNS resolution" status={link.dns.status}>
              <p>{link.dns.message}</p>
            </SourceRow>
            <SourceRow icon={Globe2} name="Live website" status={link.website.status}>
              <p>{link.website.message}</p>
              {link.website.pageTitle && <p className="mt-2 break-words text-xs"><strong className="text-[#315E54]">Page title:</strong> {link.website.pageTitle}</p>}
              {link.website.redirectCount !== undefined && link.website.redirectCount > 0 && (
                <p className="mt-2 text-xs"><strong className="text-[#315E54]">Redirects followed:</strong> {link.website.redirectCount}</p>
              )}
              {link.website.finalUrl && link.website.finalUrl !== link.normalizedUrl && (
                <code className="mt-2 block break-all rounded-lg bg-white p-2 font-mono text-[11px] text-[#52645D]">{link.website.finalUrl}</code>
              )}
            </SourceRow>
          </div>
        </section>

        <section aria-labelledby={`reputation-${index}`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 id={`reputation-${index}`} className="font-display text-base font-bold text-[#17332F]">Independent reputation</h4>
            <span className="hidden text-xs text-[#71827A] sm:block">Provider results are not combined into a guarantee</span>
          </div>
          <div className="space-y-3">
            <SourceRow
              icon={Star}
              name="Trustpilot"
              status={link.trustpilot.status}
              action={trustpilotAction}
            >
              <p>{link.trustpilot.message}</p>
              {link.trustpilot.rating !== undefined && (
                <p className="mt-2 font-bold text-[#315E54]">
                  {link.trustpilot.rating.toFixed(1)} / 5
                  {link.trustpilot.reviewCount !== undefined && (
                    <span className="font-normal text-[#5B6D67]"> · {link.trustpilot.reviewCount.toLocaleString("en-GB")} reviews</span>
                  )}
                </p>
              )}
            </SourceRow>
            <div className="grid gap-3 sm:grid-cols-2">
              <SourceRow icon={ShieldCheck} name="Google Safe Browsing" status={link.safeBrowsing.status}>
                <p>{link.safeBrowsing.message}</p>
                {link.safeBrowsing.threats.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {link.safeBrowsing.threats.map((threat) => (
                      <span key={threat} className="rounded-md bg-[#F8DCD6] px-2 py-1 font-mono text-[10px] font-bold text-[#8B3327]">{threat.replace(/_/g, " ")}</span>
                    ))}
                  </div>
                )}
              </SourceRow>
              <SourceRow icon={ScanSearch} name="VirusTotal" status={link.virusTotal.status}>
                <p>{link.virusTotal.message}</p>
                {link.virusTotal.enginesAnalysed !== undefined && (
                  <p className="mt-2 text-xs font-bold text-[#315E54]">
                    {link.virusTotal.malicious} malicious · {link.virusTotal.suspicious} suspicious · {link.virusTotal.enginesAnalysed} engines
                  </p>
                )}
              </SourceRow>
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}

function buildTextReport(result: ScamCheckResult): string {
  const lines = [
    "AnouSecure Moris — Scam check report",
    `Checked: ${new Date(result.checkedAt).toLocaleString("en-GB")}`,
    `Result: ${riskPresentation[result.risk].label}`,
    `Warning-signal score: ${result.score}/100 (not a probability or guarantee)`,
    "",
    `Message signals: ${result.findings.length}`,
    ...result.findings.flatMap((finding) => [
      `- ${finding.title}: ${finding.explanation}`,
      `  Matched: ${finding.matches.join(" | ")}`,
    ]),
    "",
  ];

  result.links.forEach((link, index) => {
    lines.push(
      `Link ${index + 1}: ${link.normalizedUrl}`,
      `URL signals: ${link.signals.map((signal) => signal.title).join(", ") || "None matched"}`,
      `DNS: ${sourceLabel(link.dns.status)} — ${link.dns.message}`,
      `Website: ${sourceLabel(link.website.status)} — ${link.website.message}`,
      `Trustpilot: ${sourceLabel(link.trustpilot.status)} — ${link.trustpilot.message}`,
      `Safe Browsing: ${sourceLabel(link.safeBrowsing.status)} — ${link.safeBrowsing.message}`,
      `VirusTotal: ${sourceLabel(link.virusTotal.status)} — ${link.virusTotal.message}`,
      "",
    );
  });

  lines.push("Recommended next steps:", ...result.steps.map((step, index) => `${index + 1}. ${step}`));
  lines.push("", "This automated check cannot prove that any message, business or website is genuine.");
  return lines.join("\n");
}

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("copy_failed");
}

export function ResultsPanel({
  result,
  isDemo,
  onReset,
}: {
  result: ScamCheckResult;
  isDemo: boolean;
  onReset: () => void;
}) {
  const [copying, setCopying] = useState(false);
  const presentation = riskPresentation[result.risk];
  const RiskIcon = presentation.icon;

  async function handleCopy() {
    setCopying(true);
    try {
      await copyText(buildTextReport(result));
      toast.success("Report copied", { description: "You can now paste it into a message or note." });
    } catch {
      toast.error("Could not copy automatically", { description: "Use Download report instead." });
    } finally {
      setCopying(false);
    }
  }

  function handleDownload() {
    const blob = new Blob(
      [JSON.stringify({ ...result, note: "Warning-signal score only; not a probability or proof of legitimacy." }, null, 2)],
      { type: "application/json" },
    );
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `anousecure-check-${result.checkedAt.replace(/:/g, "-").slice(0, 19)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);
    toast.success("Report downloaded", { description: "The detailed evidence was saved as JSON." });
  }

  return (
    <section className="mt-8 space-y-5 animate-fade-in-up" aria-labelledby="result-title" aria-live="polite">
      <div className={cn("rounded-[2rem] border p-6 sm:p-8", presentation.panel)}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <RiskIcon className={cn("mt-1 h-9 w-9 shrink-0", presentation.iconColor)} strokeWidth={1.7} aria-hidden="true" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("rounded-full px-3 py-1 text-xs font-extrabold", presentation.badge)}>{presentation.label}</span>
                {isDemo && <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-extrabold text-[#52645D]">Demo message</span>}
              </div>
              <h2 id="result-title" tabIndex={-1} className="mt-3 font-display text-2xl font-bold tracking-[-0.035em] text-[#17332F] outline-none sm:text-3xl">{presentation.title}</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#4E6159]">{presentation.description}</p>
            </div>
          </div>
          <div className="relative mx-auto h-28 w-28 shrink-0 sm:mx-0">
            <svg viewBox="0 0 112 112" className="h-full w-full -rotate-90" aria-hidden="true">
              <circle cx="56" cy="56" r="47" fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="9" />
              <circle
                cx="56"
                cy="56"
                r="47"
                fill="none"
                stroke={presentation.ring}
                strokeWidth="9"
                strokeLinecap="round"
                pathLength="100"
                strokeDasharray="100"
                strokeDashoffset={100 - result.score}
                className="transition-[stroke-dashoffset] duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-3xl font-extrabold text-[#17332F]">{result.score}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64756E]">of 100</span>
            </div>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-3 divide-x divide-[#17332F]/10 rounded-2xl border border-[#17332F]/10 bg-white/55 py-4">
          <div className="px-2 text-center sm:px-4">
            <p className="font-display text-xl font-extrabold text-[#17332F] sm:text-2xl">{result.findings.length}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#64756E] sm:text-xs">Message signals</p>
          </div>
          <div className="px-2 text-center sm:px-4">
            <p className="font-display text-xl font-extrabold text-[#17332F] sm:text-2xl">{result.links.length}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#64756E] sm:text-xs">Links checked</p>
          </div>
          <div className="px-2 text-center sm:px-4">
            <p className="font-display text-xl font-extrabold text-[#17332F] sm:text-2xl">{result.externalFlagCount}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#64756E] sm:text-xs">Provider flags</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button type="button" onClick={handleCopy} disabled={copying} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#17332F] px-4 text-sm font-bold text-white transition hover:bg-[#274A43] disabled:opacity-60">
            {copying ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Clipboard className="h-4 w-4" aria-hidden="true" />}
            Copy report
          </button>
          <button type="button" onClick={handleDownload} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#17332F]/15 bg-white px-4 text-sm font-bold text-[#17332F] transition hover:bg-white/70">
            <Download className="h-4 w-4" aria-hidden="true" /> Download report
          </button>
          <button type="button" onClick={onReset} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-[#315E54] transition hover:bg-white/60">
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Check another
          </button>
        </div>
      </div>

      {result.mode === "message" && (
        <article className="rounded-[1.75rem] border border-[#DCE4DD] bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E7F0E8] text-[#0D5C56]"><MessageSquareText className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <h3 className="font-display text-lg font-bold text-[#17332F]">Message evidence</h3>
                <p className="text-xs text-[#71827A]">Matched language patterns, not sender verification</p>
              </div>
            </div>
            <span className="rounded-full bg-[#F0F4F0] px-3 py-1.5 font-mono text-xs font-bold text-[#315E54]">+{result.messageScore}</span>
          </div>
          {result.findings.length === 0 ? (
            <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#F1F6F0] p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#2C754D]" aria-hidden="true" />
              <p className="text-sm leading-6 text-[#4E6159]">No known scam phrases or pressure patterns matched. This rule-based check cannot understand every context or prove who sent the message.</p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {result.findings.map((finding) => (
                <div key={finding.id} className="rounded-2xl border border-[#E5E9E3] bg-[#FBFCFA] p-4">
                  <div className="flex items-start gap-3">
                    {finding.severity === "critical" ? <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-[#A33D30]" aria-hidden="true" /> : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#9A6815]" aria-hidden="true" />}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-[#17332F]">{finding.title}</h4>
                      <p className="mt-1 text-sm leading-6 text-[#5B6D67]">{finding.explanation}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {finding.matches.map((match) => (
                          <span key={match} className="max-w-full break-words rounded-lg bg-[#F4E9D5] px-2.5 py-1 text-xs font-semibold text-[#745323]">“{match}”</span>
                        ))}
                      </div>
                    </div>
                    <span className="hidden shrink-0 font-mono text-xs font-bold text-[#81918A] sm:block">+{finding.weight}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      )}

      {result.omittedLinkCount > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#EACD8D] bg-[#FFF6E2] p-4 text-sm leading-6 text-[#6D5224]">
          <CloudOff className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>{result.omittedLinkCount} additional {result.omittedLinkCount === 1 ? "link was" : "links were"} not inspected because each message check is limited to five links. Check them separately for a complete review.</p>
        </div>
      )}

      {result.links.map((link, index) => <UrlInspectionCard key={`${link.normalizedUrl}-${index}`} link={link} index={index} />)}

      <section className="rounded-[1.75rem] bg-[#17332F] p-6 text-white sm:p-8" aria-labelledby="steps-title">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#DDF566] text-[#17332F]"><Check className="h-5 w-5" aria-hidden="true" /></span>
          <h3 id="steps-title" className="font-display text-xl font-bold">What to do now</h3>
        </div>
        <ol className="mt-6 space-y-5">
          {result.steps.map((step, index) => (
            <li key={step} className="flex items-start gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#DDF566]/40 font-mono text-xs font-bold text-[#DDF566]">{index + 1}</span>
              <p className="pt-0.5 text-sm leading-6 text-[#E0E8E3]">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <p className="px-2 text-center text-xs leading-5 text-[#71827A]">
        Checked {new Date(result.checkedAt).toLocaleString("en-GB")}. This automated assessment cannot certify a sender, business or website as legitimate.
      </p>
    </section>
  );
}
