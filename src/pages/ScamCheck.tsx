import { useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Globe,
  Info,
  Link2,
  Loader2,
  MessageSquareText,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { analyzeScam, type ScamResult } from "@/lib/scamCheck";
import { getAiAssessment, type AiAssessment } from "@/lib/aiScam";
import {
  checkLinkReputation,
  type ReputationResult,
  type ReputationSignal,
  type SignalLevel,
} from "@/lib/reputation";
import { AppButton } from "@/components/ui/app-button";
import { cn } from "@/lib/utils";

type Tab = "message" | "link";
type RiskTier = "low" | "medium" | "high";

const RISK_TONES: Record<
  RiskTier,
  { card: string; text: string; bar: string; icon: string; badge: string }
> = {
  low: {
    card: "border-emerald-200 bg-emerald-50",
    text: "text-emerald-900",
    bar: "bg-emerald-500",
    icon: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-800",
  },
  medium: {
    card: "border-amber-200 bg-amber-50",
    text: "text-amber-900",
    bar: "bg-amber-500",
    icon: "text-amber-700",
    badge: "bg-amber-100 text-amber-800",
  },
  high: {
    card: "border-rose-200 bg-rose-50",
    text: "text-rose-900",
    bar: "bg-rose-500",
    icon: "text-rose-700",
    badge: "bg-rose-100 text-rose-800",
  },
};

const SIGNAL_TONES: Record<SignalLevel, { card: string; icon: string; dot: string }> = {
  danger: { card: "border-rose-200 bg-rose-50", icon: "text-rose-700", dot: "bg-rose-500" },
  warning: { card: "border-amber-200 bg-amber-50", icon: "text-amber-700", dot: "bg-amber-500" },
  info: { card: "border-sky-200 bg-sky-50", icon: "text-sky-700", dot: "bg-sky-500" },
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightTerms(text: string, terms: string[]): ReactNode {
  const unique = Array.from(new Set(terms))
    .filter((term) => term && text.toLowerCase().includes(term.toLowerCase()))
    .sort((a, b) => b.length - a.length);

  if (unique.length === 0) return text;

  const regex = new RegExp(`(${unique.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) => {
    const isMatch = unique.some((term) => term.toLowerCase() === part.toLowerCase());
    return isMatch ? (
      <mark key={i} className="rounded bg-amber-100 px-0.5 font-semibold text-amber-900">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    );
  });
}

function ScoreMeter({ score, risk }: { score: number; risk: RiskTier }) {
  const { t } = useI18n();
  const tone = RISK_TONES[risk];
  return (
    <div>
      <div className="flex items-end justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("scam.scoreLabel")}
        </span>
        <span className="flex items-baseline gap-1">
          <span className={cn("font-display text-3xl font-extrabold leading-none", tone.text)}>
            {score}
          </span>
          <span className={cn("text-sm font-semibold", tone.text)}>/ 100</span>
        </span>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-700", tone.bar)}
          style={{ width: `${Math.max(3, score)}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className={cn("text-xs font-bold uppercase tracking-wide", tone.text)}>
          {t(`scam.risk.${risk}`)}
        </span>
        <span className="text-xs text-muted-foreground">
          {t("scam.scoreHint")}
        </span>
      </div>
    </div>
  );
}

function SignalCard({ signal }: { signal: ReputationSignal }) {
  const { t } = useI18n();
  const tone = SIGNAL_TONES[signal.level];
  const Icon = signal.level === "info" ? Info : AlertTriangle;
  return (
    <div className={cn("flex items-start gap-3 rounded-2xl border p-4", tone.card)}>
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", tone.icon)} aria-hidden="true" />
      <div className="min-w-0">
        <p className={cn("text-sm font-semibold", tone.icon)}>{t(`reputation.signal.${signal.id}`)}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{signalDetail(signal, t)}</p>
      </div>
    </div>
  );
}

function signalDetail(
  signal: ReputationSignal,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  const detail = signal.detail;
  switch (signal.id) {
    case "domain_age": {
      const days = Number(detail);
      if (!Number.isFinite(days)) return t("reputation.detail.unknown");
      if (days < 30) return t("reputation.detail.newDomain", { n: days });
      return t("reputation.detail.daysOld", { n: days });
    }
    case "dns":
      return signal.level === "danger"
        ? t("reputation.detail.notReachable")
        : t("reputation.detail.reachable");
    case "urlhaus": {
      const count = Number(detail);
      return count > 0 ? t("reputation.detail.reports", { n: count }) : t("reputation.detail.noReports");
    }
    case "trustpilot": {
      const rating = Number(detail);
      return Number.isFinite(rating) && rating > 0
        ? t("reputation.detail.rating", { value: rating.toFixed(1) })
        : t("reputation.detail.notListed");
    }
    default:
      return detail ?? "";
  }
}

function SourceCard({ source }: { source: ReputationResult["sources"][number] }) {
  const { t } = useI18n();
  const statusTone =
    source.status === "ok"
      ? "bg-emerald-100 text-emerald-800"
      : source.status === "empty"
        ? "bg-amber-100 text-amber-800"
        : "bg-muted text-muted-foreground";

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">
            {t(`reputation.source.${source.id}`)}
          </span>
        </div>
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", statusTone)}>
          {t(`reputation.source.${source.status}`)}
        </span>
      </div>

      {(source.rating != null || source.reviewCount != null || source.reportCount != null) && (
        <p className="mt-2 text-xs text-muted-foreground">
          {source.rating != null &&
            `${t("reputation.detail.rating", { value: source.rating.toFixed(1) })}`}
          {source.rating != null && source.reviewCount != null && " · "}
          {source.reviewCount != null && t("reputation.reviews", { n: source.reviewCount })}
          {source.reportCount != null && t("reputation.detail.reports", { n: source.reportCount })}
        </p>
      )}

      {source.url && (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          {t("reputation.viewSource")}
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}

function AiPanel({
  assessment,
  loading,
  unavailable,
}: {
  assessment: AiAssessment | null;
  loading: boolean;
  unavailable: boolean;
}) {
  const { t } = useI18n();

  if (loading) {
    return (
      <div role="status" className="flex items-center gap-3 rounded-2xl border border-[#DDE6ED] bg-[#F4F8FB] p-4 text-sm font-semibold text-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
        {t("scam.ai.loading")}
      </div>
    );
  }
  if (unavailable) {
    return (
      <p role="status" className="rounded-2xl border border-border bg-secondary/50 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        {t("scam.ai.unavailable")}
      </p>
    );
  }
  if (!assessment) return null;

  return (
    <article className="rounded-2xl border border-[#DDE6ED] bg-[#F4F8FB] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-base font-extrabold text-foreground">{t("scam.ai.title")}</h2>
            <p className="mt-0.5 text-xs font-semibold text-muted-foreground">DeepSeek</p>
          </div>
        </div>
        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-primary shadow-sm">
          {t(`scam.ai.verdict.${assessment.verdict}`)}
        </span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-foreground">{assessment.summary}</p>

      {assessment.reasons.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{t("scam.ai.reasoning")}</h3>
          <ul className="mt-2 space-y-2">
            {assessment.reasons.map((reason, index) => (
              <li key={`${index}-${reason}`} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {assessment.actions.length > 0 && (
        <div className="mt-4 rounded-xl border border-primary/10 bg-white p-3.5">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-primary">{t("scam.ai.actions")}</h3>
          <ul className="mt-2 space-y-2">
            {assessment.actions.map((action, index) => (
              <li key={`${index}-${action}`} className="flex items-start gap-2 text-sm leading-relaxed text-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        {assessment.confidence !== null && `${t("scam.ai.confidence", { value: assessment.confidence })} · `}
        {t("scam.ai.note")}
      </p>
    </article>
  );
}

const ScamCheck = () => {
  const { t, lang } = useI18n();
  const aiRequestRef = useRef(0);
  const [tab, setTab] = useState<Tab>("message");

  // Message tab state
  const [text, setText] = useState("");
  const [result, setResult] = useState<ScamResult | null>(null);
  const [messageAi, setMessageAi] = useState<AiAssessment | null>(null);
  const [messageAiLoading, setMessageAiLoading] = useState(false);
  const [messageAiError, setMessageAiError] = useState(false);

  // Link tab state
  const [url, setUrl] = useState("");
  const [linkResult, setLinkResult] = useState<ReputationResult | null>(null);
  const [linkAi, setLinkAi] = useState<AiAssessment | null>(null);
  const [linkAiLoading, setLinkAiLoading] = useState(false);
  const [linkAiError, setLinkAiError] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<"invalid_url" | "network" | null>(null);

  function runMessage(textToAnalyze: string) {
    if (!textToAnalyze.trim()) return;
    const localResult = analyzeScam(textToAnalyze);
    const requestId = ++aiRequestRef.current;
    setResult(localResult);
    setMessageAi(null);
    setMessageAiError(false);
    setMessageAiLoading(true);

    getAiAssessment({
      text: textToAnalyze,
      language: lang,
      type: "message",
      technical: {
        score: localResult.score,
        risk: localResult.risk,
        findings: localResult.findings,
      },
    })
      .then((assessment) => {
        if (requestId === aiRequestRef.current) setMessageAi(assessment);
      })
      .catch(() => {
        if (requestId === aiRequestRef.current) setMessageAiError(true);
      })
      .finally(() => {
        if (requestId === aiRequestRef.current) setMessageAiLoading(false);
      });
  }

  function useMessageExample() {
    const example = t("scam.exampleText");
    setText(example);
    runMessage(example);
  }

  function useLinkExample() {
    const example = t("reputation.exampleLinkText");
    setUrl(example);
    void runLink(example);
  }

  async function runLink(raw: string) {
    if (!raw.trim()) return;
    const requestId = ++aiRequestRef.current;
    setLinkLoading(true);
    setLinkError(null);
    setLinkResult(null);
    setLinkAi(null);
    setLinkAiError(false);
    setLinkAiLoading(false);

    try {
      const data = await checkLinkReputation(raw);
      if (requestId !== aiRequestRef.current) return;
      setLinkResult(data);
      setLinkAiLoading(true);

      getAiAssessment({
        text: data.url,
        language: lang,
        type: "link",
        technical: data,
      })
        .then((assessment) => {
          if (requestId === aiRequestRef.current) setLinkAi(assessment);
        })
        .catch(() => {
          if (requestId === aiRequestRef.current) setLinkAiError(true);
        })
        .finally(() => {
          if (requestId === aiRequestRef.current) setLinkAiLoading(false);
        });
    } catch (err) {
      if (requestId !== aiRequestRef.current) return;
      setLinkError(err instanceof Error && err.message === "invalid_url" ? "invalid_url" : "network");
    } finally {
      if (requestId === aiRequestRef.current) setLinkLoading(false);
    }
  }

  function checkDetectedLink(link: string) {
    setUrl(link);
    setTab("link");
    void runLink(link);
  }

  const guides = [
    { title: t("scam.guide.clickedTitle"), body: t("scam.guide.clickedBody") },
    { title: t("scam.guide.sharedTitle"), body: t("scam.guide.sharedBody") },
    { title: t("scam.guide.paidTitle"), body: t("scam.guide.paidBody") },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold text-foreground">{t("scam.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("scam.subtitle")}</p>
      </header>

      {/* Tab switcher */}
      <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-muted/60 p-1">
        <button
          type="button"
          onClick={() => setTab("message")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
            tab === "message"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <MessageSquareText className="h-4 w-4" aria-hidden="true" />
          {t("reputation.tab.message")}
        </button>
        <button
          type="button"
          onClick={() => setTab("link")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
            tab === "link"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Link2 className="h-4 w-4" aria-hidden="true" />
          {t("reputation.tab.link")}
        </button>
      </div>

      {tab === "message" ? (
        <section className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setResult(null);
              setMessageAi(null);
              setMessageAiLoading(false);
              setMessageAiError(false);
              aiRequestRef.current += 1;
            }}
            rows={6}
            placeholder={t("scam.placeholder")}
            className="w-full resize-y rounded-2xl border border-input bg-card p-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex flex-wrap gap-2">
            <AppButton variant="primary" size="lg" onClick={() => runMessage(text)} disabled={!text.trim()}>
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              {t("scam.analyze")}
            </AppButton>
            <AppButton variant="outline" size="lg" onClick={useMessageExample}>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {t("scam.example")}
            </AppButton>
          </div>
        </section>
      ) : (
        <section className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setLinkResult(null);
                setLinkError(null);
                setLinkAi(null);
                setLinkAiLoading(false);
                setLinkAiError(false);
                aiRequestRef.current += 1;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") void runLink(url);
              }}
              type="text"
              inputMode="url"
              placeholder={t("reputation.urlPlaceholder")}
              className="h-12 w-full rounded-2xl border border-input bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <AppButton
              variant="primary"
              size="lg"
              onClick={() => runLink(url)}
              disabled={!url.trim() || linkLoading}
            >
              {linkLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              )}
              {linkLoading ? t("reputation.checking") : t("reputation.checkLink")}
            </AppButton>
            <AppButton variant="outline" size="lg" onClick={useLinkExample} disabled={linkLoading}>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {t("reputation.exampleLink")}
            </AppButton>
          </div>
        </section>
      )}

      {/* Message result */}
      {tab === "message" && result && (
        <section className="space-y-4 animate-fade-in-up">
          <div
            className={cn(
              "rounded-2xl border p-5",
              RISK_TONES[result.risk].card,
            )}
          >
            <div className="flex items-center gap-2">
              {result.label === "warning" ? (
                <AlertTriangle className={cn("h-5 w-5", RISK_TONES[result.risk].icon)} aria-hidden="true" />
              ) : (
                <CheckCircle2 className={cn("h-5 w-5", RISK_TONES[result.risk].icon)} aria-hidden="true" />
              )}
              <h2 className={cn("font-display text-lg font-bold", RISK_TONES[result.risk].text)}>
                {result.label === "warning" ? t("scam.warningFound") : t("scam.noWarning")}
              </h2>
            </div>

            <div className="mt-4">
              <ScoreMeter score={result.score} risk={result.risk} />
            </div>

            {result.label === "warning" && result.findings.length > 0 && (
              <ul className="mt-4 space-y-2 border-t border-black/5 pt-4 text-sm">
                {result.findings.map((f) => (
                  <li key={f.ruleId} className="flex items-start gap-2 text-foreground">
                    <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", RISK_TONES[result.risk].bar)} />
                    {t(`scam.reasons.${f.ruleId}`)}
                  </li>
                ))}
              </ul>
            )}

            {result.label === "clean" && (
              <p className="mt-3 border-t border-black/5 pt-3 text-sm text-muted-foreground">
                {t("scam.noWarningHint")}
              </p>
            )}
          </div>

          <AiPanel assessment={messageAi} loading={messageAiLoading} unavailable={messageAiError} />

          {text.trim() && result.matchedTerms.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">{t("scam.matched")}</p>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                {highlightTerms(text, result.matchedTerms)}
              </p>
            </div>
          )}

          {result.links.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">{t("scam.reasons.link")}</p>
              <ul className="space-y-2">
                {result.links.map((link) => (
                  <li key={link} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="break-all rounded-lg bg-muted px-3 py-1.5 font-mono text-xs text-foreground">
                      {link}
                    </span>
                    <button
                      type="button"
                      onClick={() => checkDetectedLink(link)}
                      className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <Search className="h-3.5 w-3.5" aria-hidden="true" />
                      {t("scam.checkLink")}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-base font-bold text-foreground">{t("scam.nextSteps")}</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {t("scam.verify")}
              </li>
              <li className="flex items-start gap-2">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                {t("scam.dontClick")}
              </li>
            </ul>
            <a
              href="https://maucors.govmu.org/maucors/?page_id=9"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"
            >
              {t("scam.report")}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {guides.map((g) => (
              <div key={g.title} className="rounded-2xl border border-border bg-card p-4">
                <h3 className="font-display text-sm font-bold text-foreground">{g.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{g.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Link result */}
      {tab === "link" && linkLoading && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
          {t("reputation.checkingLong")}
        </div>
      )}

      {tab === "link" && linkError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-5 w-5 text-rose-700" aria-hidden="true" />
            {linkError === "invalid_url" ? t("reputation.invalidUrl") : t("reputation.error")}
          </div>
          <p className="mt-1 text-muted-foreground">
            {linkError === "invalid_url" ? t("reputation.invalidUrlHint") : t("reputation.errorHint")}
          </p>
        </div>
      )}

      {tab === "link" && linkResult && (
        <section className="space-y-4 animate-fade-in-up">
          <div className={cn("rounded-2xl border p-5", RISK_TONES[linkResult.risk].card)}>
            <div className="flex items-center gap-2">
              <AlertTriangle className={cn("h-5 w-5", RISK_TONES[linkResult.risk].icon)} aria-hidden="true" />
              <h2 className={cn("font-display text-lg font-bold", RISK_TONES[linkResult.risk].text)}>
                {t(`reputation.verdict.${linkResult.risk}`)}
              </h2>
            </div>

            <div className="mt-4">
              <ScoreMeter score={linkResult.score} risk={linkResult.risk} />
            </div>

            <p className="mt-3 break-all border-t border-black/5 pt-3 font-mono text-xs text-muted-foreground">
              {t("reputation.domainLabel")}: {linkResult.domain}
            </p>
          </div>

          <AiPanel assessment={linkAi} loading={linkAiLoading} unavailable={linkAiError} />

          {linkResult.signals.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("reputation.signalsTitle")}
              </h3>
              {linkResult.signals.map((signal, i) => (
                <SignalCard key={`${signal.id}-${i}`} signal={signal} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              {t("reputation.noSignals")}
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("reputation.sourcesTitle")}
            </h3>
            {linkResult.sources.map((source) => (
              <SourceCard key={source.id} source={source} />
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-base font-bold text-foreground">{t("scam.nextSteps")}</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {t("scam.verify")}
              </li>
              <li className="flex items-start gap-2">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                {t("scam.dontClick")}
              </li>
            </ul>
            <a
              href="https://maucors.govmu.org/maucors/?page_id=9"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"
            >
              {t("scam.report")}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </section>
      )}

      <p className="flex items-center justify-center gap-2 rounded-2xl bg-secondary/60 p-4 text-center text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        {tab === "message" ? t("scam.disclaimer") : t("reputation.disclaimer")}
      </p>
    </div>
  );
};

export default ScamCheck;
