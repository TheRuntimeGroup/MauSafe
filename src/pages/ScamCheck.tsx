import { useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { analyzeScam, type ScamResult } from "@/lib/scamCheck";
import { AppButton } from "@/components/ui/app-button";
import { cn } from "@/lib/utils";

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
      <mark
        key={i}
        className="rounded bg-amber-100 px-0.5 font-semibold text-amber-900"
      >
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    );
  });
}

const ScamCheck = () => {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [result, setResult] = useState<ScamResult | null>(null);

  function run(textToAnalyze: string) {
    if (!textToAnalyze.trim()) return;
    setResult(analyzeScam(textToAnalyze));
  }

  function useExample() {
    const example = t("scam.exampleText");
    setText(example);
    run(example);
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

      <section className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setResult(null);
          }}
          rows={6}
          placeholder={t("scam.placeholder")}
          className="w-full resize-y rounded-2xl border border-input bg-card p-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex flex-wrap gap-2">
          <AppButton variant="primary" size="lg" onClick={() => run(text)} disabled={!text.trim()}>
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            {t("scam.analyze")}
          </AppButton>
          <AppButton variant="outline" size="lg" onClick={useExample}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {t("scam.example")}
          </AppButton>
        </div>
      </section>

      {result && (
        <section className="space-y-4 animate-fade-in-up">
          {/* Verdict */}
          <div
            className={cn(
              "rounded-2xl border p-5",
              result.label === "warning"
                ? "border-amber-200 bg-amber-50"
                : "border-emerald-200 bg-emerald-50",
            )}
          >
            <div className="flex items-center gap-2">
              {result.label === "warning" ? (
                <AlertTriangle className="h-5 w-5 text-amber-700" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-700" aria-hidden="true" />
              )}
              <h2
                className={cn(
                  "font-display text-lg font-bold",
                  result.label === "warning" ? "text-amber-800" : "text-emerald-800",
                )}
              >
                {result.label === "warning" ? t("scam.warningFound") : t("scam.noWarning")}
              </h2>
            </div>

            {result.label === "warning" && result.findings.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-sm text-amber-900">
                {result.findings.map((f) => (
                  <li key={f.ruleId} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    {t(`scam.reasons.${f.ruleId}`)}
                  </li>
                ))}
              </ul>
            )}

            {result.label === "clean" && (
              <p className="mt-2 text-sm text-emerald-900">{t("scam.noWarningHint")}</p>
            )}
          </div>

          {/* Highlighted text */}
          {text.trim() && result.matchedTerms.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">{t("scam.matched")}</p>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                {highlightTerms(text, result.matchedTerms)}
              </p>
            </div>
          )}

          {/* Links (plain, unclickable) */}
          {result.links.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                {t("scam.reasons.link")}
              </p>
              <ul className="space-y-1">
                {result.links.map((link) => (
                  <li
                    key={link}
                    className="break-all rounded-lg bg-muted px-3 py-1.5 font-mono text-xs text-foreground"
                  >
                    {link}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next steps */}
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

          {/* Guides */}
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

      <p className="flex items-center justify-center gap-2 rounded-2xl bg-secondary/60 p-4 text-center text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        {t("scam.disclaimer")}
      </p>
    </div>
  );
};

export default ScamCheck;
