import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ClipboardPaste,
  Eraser,
  Globe2,
  Link2,
  LoaderCircle,
  LockKeyhole,
  MessageSquareText,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  checkScam,
  type CheckMode,
  type CheckOptions,
  type ScamCheckResult,
} from "@/lib/scamCheck";
import { cn } from "@/lib/utils";
import { ResultsPanel } from "./ResultsPanel";

const DEMO_MESSAGE =
  "MCB ALERT: Your account has been suspended. Act now within 30 minutes to avoid permanent closure. Share the OTP sent to your phone so our agent can verify your identity. Keep this confidential.";

const DEFAULT_OPTIONS: CheckOptions = {
  liveWebsite: true,
  trustpilot: true,
  safeBrowsing: true,
  virusTotal: true,
};

const optionDetails = [
  {
    key: "liveWebsite" as const,
    icon: Globe2,
    title: "Live website response",
    text: "Resolve DNS and safely follow up to four HTTP/HTTPS redirects.",
  },
  {
    key: "trustpilot" as const,
    icon: Star,
    title: "Trustpilot profile",
    text: "Look for an exact-domain public profile, or use the Business API when configured.",
  },
  {
    key: "safeBrowsing" as const,
    icon: ShieldCheck,
    title: "Google Safe Browsing",
    text: "Check known phishing and malware threats when server API access is configured.",
  },
  {
    key: "virusTotal" as const,
    icon: ScanLine,
    title: "VirusTotal domain report",
    text: "Read security-engine verdicts when server API access is configured.",
  },
];

export function ScamChecker() {
  const [mode, setMode] = useState<CheckMode>("message");
  const [messageInput, setMessageInput] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [options, setOptions] = useState<CheckOptions>(DEFAULT_OPTIONS);
  const [showOptions, setShowOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScamCheckResult | null>(null);
  const [checkedDemo, setCheckedDemo] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);

  const input = mode === "message" ? messageInput : linkInput;

  useEffect(() => {
    if (!result) return;
    const frame = requestAnimationFrame(() => {
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      document.getElementById("result-title")?.scrollIntoView({ behavior, block: "start" });
      document.getElementById("result-title")?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [result]);

  function updateInput(value: string) {
    if (mode === "message") setMessageInput(value);
    else setLinkInput(value);
    setResult(null);
    setError(null);
  }

  function selectMode(nextMode: CheckMode) {
    if (loading) return;
    setMode(nextMode);
    setShowOptions(nextMode === "link");
    setResult(null);
    setError(null);
  }

  async function runCheck(checkMode: CheckMode, value: string) {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await checkScam({ mode: checkMode, input: trimmed, options });
      setResult(response);
      setCheckedDemo(checkMode === "message" && trimmed === DEMO_MESSAGE);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The check could not be completed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void runCheck(mode, input);
  }

  async function pasteFromClipboard() {
    setError(null);
    try {
      if (!navigator.clipboard?.readText) throw new Error("clipboard_unavailable");
      const value = await navigator.clipboard.readText();
      if (!value.trim()) {
        setError("Your clipboard is empty. Copy a message or link first.");
        return;
      }
      updateInput(value.slice(0, mode === "message" ? 12_000 : 2048));
    } catch {
      setError("Clipboard access is unavailable. Paste directly into the field using Ctrl+V or your device's paste menu.");
    }
  }

  function clearCheck() {
    updateInput("");
    setCheckedDemo(false);
    inputRef.current?.focus();
  }

  function useDemo() {
    if (mode !== "message") selectMode("message");
    setMessageInput(DEMO_MESSAGE);
    setCheckedDemo(true);
    void runCheck("message", DEMO_MESSAGE);
  }

  function resetForAnother() {
    updateInput("");
    setCheckedDemo(false);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("checker")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <section id="checker" className="scroll-mt-24" aria-labelledby="checker-title">
      <div className="overflow-hidden rounded-[2rem] border border-[#D6E0D7] bg-white shadow-[0_28px_70px_-42px_rgba(23,51,47,0.45)]">
        <div className="p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-[#EFF3EE] p-1.5" role="tablist" aria-label="What do you want to check?">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "message"}
              aria-controls="check-input-panel"
              disabled={loading}
              onClick={() => selectMode("message")}
              className={cn(
                "flex min-h-14 items-center justify-center gap-2 rounded-xl px-3 text-sm font-extrabold transition-all disabled:cursor-not-allowed",
                mode === "message" ? "bg-white text-[#0D5C56] shadow-[0_3px_12px_rgba(23,51,47,0.08)]" : "text-[#687A72] hover:text-[#17332F]",
              )}
            >
              <MessageSquareText className="h-[18px] w-[18px]" aria-hidden="true" /> Message
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "link"}
              aria-controls="check-input-panel"
              disabled={loading}
              onClick={() => selectMode("link")}
              className={cn(
                "flex min-h-14 items-center justify-center gap-2 rounded-xl px-3 text-sm font-extrabold transition-all disabled:cursor-not-allowed",
                mode === "link" ? "bg-white text-[#0D5C56] shadow-[0_3px_12px_rgba(23,51,47,0.08)]" : "text-[#687A72] hover:text-[#17332F]",
              )}
            >
              <Link2 className="h-[18px] w-[18px]" aria-hidden="true" /> Link or domain
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-6 pt-3 sm:px-8 sm:pb-8 sm:pt-4" id="check-input-panel" role="tabpanel">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <label htmlFor="scam-input" className="font-display text-lg font-bold tracking-tight text-[#17332F]" id="checker-title">
              {mode === "message" ? "What did you receive?" : "Which link should we inspect?"}
            </label>
            <span className="font-mono text-[11px] text-[#81918A]">{input.length.toLocaleString("en-GB")} / {(mode === "message" ? 12_000 : 2048).toLocaleString("en-GB")}</span>
          </div>
          <p id="input-help" className="mt-1.5 text-sm leading-6 text-[#687A72]">
            {mode === "message"
              ? "Paste the full SMS, WhatsApp, email or social media message. Up to five included links can also be checked."
              : "Paste a full URL or domain. The suspicious site will not open in your browser."}
          </p>

          <div className={cn("mt-4 overflow-hidden rounded-2xl border bg-[#FAFCF9] transition focus-within:border-[#0D5C56] focus-within:ring-4 focus-within:ring-[#0D5C56]/10", error ? "border-[#C76B5E]" : "border-[#CBD8CE]")}>
            {mode === "message" ? (
              <textarea
                ref={(element) => { inputRef.current = element; }}
                id="scam-input"
                value={messageInput}
                onChange={(event) => updateInput(event.target.value)}
                maxLength={12_000}
                rows={7}
                disabled={loading}
                aria-describedby="input-help"
                placeholder="Paste the suspicious message here…"
                className="min-h-44 w-full resize-y bg-transparent p-4 font-sans text-[15px] leading-7 text-[#17332F] outline-none placeholder:text-[#87968F] disabled:opacity-70 sm:p-5"
              />
            ) : (
              <input
                ref={(element) => { inputRef.current = element; }}
                id="scam-input"
                type="text"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={linkInput}
                onChange={(event) => updateInput(event.target.value)}
                maxLength={2048}
                disabled={loading}
                aria-describedby="input-help"
                placeholder="example.com or https://example.com/login"
                className="min-h-20 w-full bg-transparent px-4 py-5 font-mono text-sm leading-6 text-[#17332F] outline-none placeholder:font-sans placeholder:text-[#87968F] disabled:opacity-70 sm:px-5"
              />
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E1E8E1] px-3 py-2.5">
              <div className="flex items-center gap-1">
                <button type="button" onClick={pasteFromClipboard} disabled={loading} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-[#315E54] transition hover:bg-[#E7F0E8] disabled:opacity-50">
                  <ClipboardPaste className="h-4 w-4" aria-hidden="true" /> Paste
                </button>
                {input && (
                  <button type="button" onClick={clearCheck} disabled={loading} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-[#687A72] transition hover:bg-[#EEF2ED] disabled:opacity-50">
                    <Eraser className="h-4 w-4" aria-hidden="true" /> Clear
                  </button>
                )}
              </div>
              <button type="button" onClick={useDemo} disabled={loading} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-[#315E54] transition hover:bg-[#E7F0E8] disabled:opacity-50">
                <Sparkles className="h-4 w-4" aria-hidden="true" /> Try demo message
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#EAB6AB] bg-[#FFF0ED] p-3.5 text-sm leading-6 text-[#873B30]">
              <AlertCircle className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" /> {error}
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-[#E1E8E1]">
            <button
              type="button"
              onClick={() => setShowOptions((visible) => !visible)}
              aria-expanded={showOptions}
              aria-controls="advanced-options"
              className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl px-4 text-left transition hover:bg-[#F7F9F6]"
            >
              <span className="flex items-center gap-2.5">
                <ScanLine className="h-5 w-5 text-[#0D5C56]" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-extrabold text-[#17332F]">More verification options</span>
                  <span className="mt-0.5 block text-xs text-[#71827A]">{Object.values(options).filter(Boolean).length} of 4 optional checks enabled</span>
                </span>
              </span>
              <ChevronDown className={cn("h-5 w-5 shrink-0 text-[#71827A] transition-transform", showOptions && "rotate-180")} aria-hidden="true" />
            </button>
            {showOptions && (
              <div id="advanced-options" className="border-t border-[#E1E8E1] px-4 py-2">
                {optionDetails.map((option) => (
                  <div key={option.key} className="flex items-start gap-3 border-b border-[#E8EDE7] py-4 last:border-b-0">
                    <option.icon className="mt-0.5 h-5 w-5 shrink-0 text-[#527269]" strokeWidth={1.8} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <label htmlFor={`option-${option.key}`} className="cursor-pointer text-sm font-bold text-[#17332F]">{option.title}</label>
                      <p className="mt-1 text-xs leading-5 text-[#687A72]">{option.text}</p>
                    </div>
                    <Switch
                      id={`option-${option.key}`}
                      checked={options[option.key]}
                      onCheckedChange={(checked) => setOptions((current) => ({ ...current, [option.key]: checked }))}
                      disabled={loading}
                      aria-label={option.title}
                      className="mt-0.5 h-6 w-11 border-[#C7D3C8] data-[state=checked]:bg-[#0D5C56] data-[state=unchecked]:bg-[#C8D2C9] [&>span]:bg-white"
                    />
                  </div>
                ))}
                <p className="pb-3 pt-1 text-[11px] leading-5 text-[#71827A]">
                  External checks share only the URL or domain required for that lookup. Message text is never sent to Trustpilot, Google or VirusTotal.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="group mt-6 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#0D5C56] px-6 font-display text-base font-extrabold text-white shadow-[0_12px_24px_-14px_rgba(13,92,86,0.9)] transition hover:bg-[#084B46] disabled:cursor-not-allowed disabled:bg-[#A5B7AD] disabled:shadow-none"
          >
            {loading ? (
              <><LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> Checking the evidence…</>
            ) : (
              <>{mode === "message" ? "Check this message" : "Check this link"}<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" /></>
            )}
          </button>
          <p className="mt-4 flex items-start justify-center gap-2 text-center text-xs leading-5 text-[#71827A]">
            <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#527269]" aria-hidden="true" />
            No account or report history. Checks are not saved by this app.
          </p>
        </form>
      </div>

      {loading && (
        <div className="mt-6 flex items-center gap-4 rounded-2xl border border-[#D6E0D7] bg-white p-5" role="status">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E7F0E8]"><LoaderCircle className="h-5 w-5 animate-spin text-[#0D5C56]" aria-hidden="true" /></span>
          <div>
            <p className="font-display text-sm font-bold text-[#17332F]">Running your selected checks</p>
            <p className="mt-1 text-xs leading-5 text-[#687A72]">External sources can take several seconds. We will only report responses that actually arrive.</p>
          </div>
        </div>
      )}

      {result && <ResultsPanel result={result} isDemo={checkedDemo} onReset={resetForAnother} />}
    </section>
  );
}
