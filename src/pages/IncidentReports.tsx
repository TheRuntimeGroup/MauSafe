import { useState } from "react";
import { Download, FileWarning, Loader2, LockKeyhole, Share2, Trash2 } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import {
  createIncidentReport,
  deleteIncidentReport,
  listIncidentReports,
  markIncidentExported,
  type IncidentCategory,
  type IncidentReport,
} from "@/lib/incidentReports";
import { formatDateTime } from "@/lib/format";
import { AppButton } from "@/components/ui/app-button";

const CATEGORIES: IncidentCategory[] = ["theft", "assault", "harassment", "fraud", "road_hazard", "other"];

function localDateTimeValue() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

const IncidentReports = () => {
  const { t, locale } = useI18n();
  const [reports, setReports] = useState<IncidentReport[]>(() => listIncidentReports());
  const [category, setCategory] = useState<IncidentCategory>("theft");
  const [occurredAt, setOccurredAt] = useState(localDateTimeValue);
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  function saveReport(event: React.FormEvent) {
    event.preventDefault();
    if (!area.trim() || !description.trim() || saving) return;
    setSaving(true);
    try {
      setReports(
        createIncidentReport({
          category,
          occurredAt: new Date(occurredAt).toISOString(),
          area,
          description,
        }),
      );
      setArea("");
      setDescription("");
      setOccurredAt(localDateTimeValue());
      setFeedback("incident.saved");
    } catch {
      setFeedback("incident.error");
    } finally {
      setSaving(false);
    }
  }

  function reportText(report: IncidentReport) {
    return [
      t("incident.title"),
      `${t("incident.reference")}: ${report.reference}`,
      `${t("incident.categoryLabel")}: ${t(`incident.category.${report.category}`)}`,
      `${t("incident.occurredLabel")}: ${formatDateTime(report.occurredAt, locale)}`,
      `${t("incident.areaLabel")}: ${report.area}`,
      "",
      report.description,
      "",
      t("incident.privacy"),
    ].join("\n");
  }

  async function shareReport(report: IncidentReport) {
    const text = reportText(report);
    try {
      if (navigator.share) {
        try {
          await navigator.share({ title: `${t("incident.title")} · ${report.reference}`, text });
          setFeedback("incident.opened");
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
          throw error;
        }
      } else {
        await navigator.clipboard.writeText(text);
        setFeedback("incident.copied");
      }
      setReports(markIncidentExported(report.id));
    } catch {
      setFeedback("incident.error");
    }
  }

  function downloadReport(report: IncidentReport) {
    const blob = new Blob([reportText(report)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${report.reference}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    setReports(markIncidentExported(report.id));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
          <FileWarning className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">{t("incident.title")}</h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("incident.subtitle")}</p>
        </div>
      </header>

      <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-muted-foreground">{t("incident.privacy")}</p>
      </div>

      <form onSubmit={saveReport} className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="incident-category" className="text-sm font-semibold text-foreground">
              {t("incident.categoryLabel")}
            </label>
            <select
              id="incident-category"
              value={category}
              onChange={(event) => setCategory(event.target.value as IncidentCategory)}
              className="h-12 w-full rounded-xl border border-input bg-card px-3 text-sm"
            >
              {CATEGORIES.map((item) => <option key={item} value={item}>{t(`incident.category.${item}`)}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="incident-time" className="text-sm font-semibold text-foreground">
              {t("incident.occurredLabel")}
            </label>
            <input
              id="incident-time"
              type="datetime-local"
              required
              max={localDateTimeValue()}
              value={occurredAt}
              onChange={(event) => setOccurredAt(event.target.value)}
              className="h-12 w-full rounded-xl border border-input bg-card px-3 text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="incident-area" className="text-sm font-semibold text-foreground">
            {t("incident.areaLabel")}
          </label>
          <input
            id="incident-area"
            required
            maxLength={120}
            value={area}
            onChange={(event) => setArea(event.target.value)}
            placeholder={t("incident.areaPlaceholder")}
            className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="incident-description" className="text-sm font-semibold text-foreground">
            {t("incident.descriptionLabel")}
          </label>
          <textarea
            id="incident-description"
            required
            maxLength={3000}
            rows={5}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t("incident.descriptionPlaceholder")}
            className="w-full resize-y rounded-xl border border-input bg-card p-4 text-sm"
          />
        </div>

        <AppButton type="submit" size="xl" disabled={saving || !area.trim() || !description.trim()}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {t("incident.save")}
        </AppButton>
      </form>

      {feedback && <p className="rounded-xl bg-secondary/60 p-3 text-sm text-secondary-foreground" role="status">{t(feedback)}</p>}

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold text-foreground">{t("incident.historyTitle")}</h2>
        {reports.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            {t("incident.empty")}
          </p>
        ) : (
          <ul className="space-y-3">
            {reports.map((report) => (
              <li key={report.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-sm font-extrabold text-foreground">
                      {t(`incident.category.${report.category}`)}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">{report.reference}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReports(deleteIncidentReport(report.id))}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-danger/10 hover:text-danger"
                    aria-label={t("incident.delete")}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {formatDateTime(report.occurredAt, locale)} · {report.area}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{report.description}</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <AppButton variant="outline" size="sm" onClick={() => void shareReport(report)}>
                    <Share2 className="h-4 w-4" aria-hidden="true" />
                    {t("incident.share")}
                  </AppButton>
                  <AppButton variant="outline" size="sm" onClick={() => downloadReport(report)}>
                    <Download className="h-4 w-4" aria-hidden="true" />
                    {t("incident.download")}
                  </AppButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default IncidentReports;
