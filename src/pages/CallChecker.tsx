import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Flag,
  Info,
  PhoneCall,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import {
  analyzeNumber,
  deleteReport,
  findReport,
  formatMauritiusNumber,
  listReports,
  reportNumber,
  type NumberAnalysis,
  type NumberReport,
  type ReportTag,
} from "@/lib/numberCheck";
import { AppButton } from "@/components/ui/app-button";
import { cn } from "@/lib/utils";

const REPORT_TAGS: { id: ReportTag; labelKey: string }[] = [
  { id: "scam", labelKey: "callcheck.tag.scam" },
  { id: "spam", labelKey: "callcheck.tag.spam" },
  { id: "harassment", labelKey: "callcheck.tag.harassment" },
  { id: "other", labelKey: "callcheck.tag.other" },
];

function typeKey(type: NumberAnalysis["type"]): string {
  if (type === "mobile") return "callcheck.type.mobile";
  if (type === "landline") return "callcheck.type.landline";
  return "callcheck.type.other";
}

const CallChecker = () => {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState("");
  const [analysis, setAnalysis] = useState<NumberAnalysis | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<ReportTag>>(new Set());
  const [note, setNote] = useState("");
  const [reports, setReports] = useState<NumberReport[]>(() => listReports());

  function handleCheck() {
    const result = analyzeNumber(query);
    setAnalysis(result);
    setSelectedTags(new Set());
    setNote("");
  }

  function toggleTag(tag: ReportTag) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  function handleSaveReport() {
    if (!analysis?.normalized || selectedTags.size === 0) return;
    const next = reportNumber({
      number: analysis.normalized,
      tags: Array.from(selectedTags),
      note,
    });
    setReports(next);
    setAnalysis({ ...analysis, report: findReport(analysis.normalized) });
    setSelectedTags(new Set());
    setNote("");
  }

  function handleRemoveReport(id: string) {
    setReports(deleteReport(id));
    if (analysis?.normalized) {
      setAnalysis({ ...analysis, report: findReport(analysis.normalized) });
    }
  }

  function formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold text-foreground">{t("callcheck.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("callcheck.subtitle")}</p>
      </header>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleCheck();
        }}
        className="space-y-3"
      >
        <label htmlFor="number-check-input" className="text-sm font-semibold text-foreground">
          {t("callcheck.inputLabel")}
        </label>
        <div className="relative">
          <PhoneCall
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="number-check-input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setAnalysis(null);
            }}
            placeholder={t("callcheck.inputPlaceholder")}
            className="h-14 w-full rounded-2xl border border-input bg-card pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <AppButton type="submit" variant="primary" size="lg" disabled={!query.trim()}>
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          {t("callcheck.check")}
        </AppButton>
      </form>

      {analysis && (
        <section className="space-y-4 animate-fade-in-up">
          {!analysis.valid ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-700" aria-hidden="true" />
                <h2 className="font-display text-lg font-bold text-amber-800">
                  {t("callcheck.invalidTitle")}
                </h2>
              </div>
              {analysis.reasonKey && (
                <p className="mt-2 text-sm text-amber-900">{t(analysis.reasonKey)}</p>
              )}
            </div>
          ) : (
            <>
              {/* Verdict */}
              {analysis.report ? (
                <div className="rounded-2xl border border-danger/20 bg-danger/5 p-5">
                  <div className="flex items-center gap-2">
                    <Flag className="h-5 w-5 text-danger" aria-hidden="true" />
                    <h2 className="font-display text-lg font-bold text-foreground">
                      {t("callcheck.reportedTitle")}
                    </h2>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("callcheck.reportedAs")}:
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {analysis.report.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-danger px-3 py-1 text-xs font-semibold text-danger-foreground"
                      >
                        {t(`callcheck.tag.${tag}`)}
                      </span>
                    ))}
                  </div>
                  {analysis.report.note && (
                    <p className="mt-3 rounded-xl bg-card px-3 py-2 text-sm text-foreground">
                      {analysis.report.note}
                    </p>
                  )}
                  <AppButton
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => handleRemoveReport(analysis.report!.id)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    {t("callcheck.removeReport")}
                  </AppButton>
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                    <h2 className="font-display text-lg font-bold text-emerald-800">
                      {t("callcheck.validTitle")}
                    </h2>
                  </div>
                  <p className="mt-2 text-sm text-emerald-900">{t("callcheck.validHint")}</p>
                </div>
              )}

              {/* Details */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">
                      {t("callcheck.field.number")}
                    </dt>
                    <dd className="mt-1 font-mono text-base text-foreground">
                      {formatMauritiusNumber(analysis.normalized!)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">
                      {t("callcheck.field.country")}
                    </dt>
                    <dd className="mt-1 text-base text-foreground">
                      {t("callcheck.countryName")} · +230
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">
                      {t("callcheck.field.type")}
                    </dt>
                    <dd className="mt-1 text-base text-foreground">{t(typeKey(analysis.type))}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">
                      {t("callcheck.field.operator")}
                    </dt>
                    <dd className="mt-1 text-base text-foreground">
                      {analysis.operator ?? t("callcheck.unknown")}
                    </dd>
                  </div>
                </dl>
                <p className="mt-4 flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {t("callcheck.indicative")}
                </p>
              </div>

              {/* Report form */}
              {!analysis.report && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h2 className="font-display text-base font-bold text-foreground">
                    {t("callcheck.reportTitle")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("callcheck.reportHint")}</p>

                  <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t("callcheck.reportTitle")}>
                    {REPORT_TAGS.map((tag) => {
                      const active = selectedTags.has(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          aria-pressed={active}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            active
                              ? "border-danger bg-danger text-danger-foreground"
                              : "border-input bg-card text-foreground hover:bg-muted",
                          )}
                        >
                          {t(tag.labelKey)}
                        </button>
                      );
                    })}
                  </div>

                  <label
                    htmlFor="report-note"
                    className="mt-4 block text-sm font-semibold text-foreground"
                  >
                    {t("callcheck.noteLabel")}
                  </label>
                  <textarea
                    id="report-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder={t("callcheck.notePlaceholder")}
                    className="mt-2 w-full resize-y rounded-2xl border border-input bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />

                  <AppButton
                    variant="warning"
                    size="md"
                    className="mt-4"
                    onClick={handleSaveReport}
                    disabled={selectedTags.size === 0}
                  >
                    <Flag className="h-4 w-4" aria-hidden="true" />
                    {t("callcheck.saveReport")}
                  </AppButton>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Reported numbers */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold text-foreground">
          {t("callcheck.reportsTitle")}
        </h2>
        {reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
            <p className="font-display text-sm font-bold text-foreground">
              {t("callcheck.reportsEmpty")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{t("callcheck.reportsEmptyHint")}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {reports.map((report) => (
              <li
                key={report.id}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold text-foreground">
                      {formatMauritiusNumber(report.number)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {report.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-semibold text-danger"
                        >
                          {t(`callcheck.tag.${tag}`)}
                        </span>
                      ))}
                    </div>
                    {report.note && (
                      <p className="mt-2 text-sm text-muted-foreground">{report.note}</p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("callcheck.reportedOn")} {formatDate(report.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveReport(report.id)}
                    aria-label={t("callcheck.removeReport")}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="flex items-start justify-center gap-2 rounded-2xl bg-secondary/60 p-4 text-center text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        {t("callcheck.disclaimer")}
      </p>
    </div>
  );
};

export default CallChecker;
