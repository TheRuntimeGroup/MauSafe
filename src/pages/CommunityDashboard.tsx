import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Camera,
  Filter,
  Image as ImageIcon,
  LoaderCircle,
  MapPin,
  Plus,
  RefreshCw,
  ShieldAlert,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import {
  COMMUNITY_CATEGORIES,
  DISTRICTS,
  isTrustedCommunityMediaUrl,
  uploadCommunityMedia,
  type CommunityCategory,
  type CommunityMedia,
} from "@/lib/community";
import { AppButton } from "@/components/ui/app-button";
import { cn } from "@/lib/utils";

type CommunityReport = {
  id: string;
  user_id: string;
  author_name: string;
  category: CommunityCategory;
  district: string;
  details: string;
  media: unknown;
  created_at: string;
};

type Filters = { category: "all" | CommunityCategory; district: "all" | string };
const FILTERS_KEY = "mausafe.community.filters";

function savedFilters(): Filters {
  try {
    const parsed = JSON.parse(localStorage.getItem(FILTERS_KEY) ?? "{}");
    return {
      category: COMMUNITY_CATEGORIES.some((item) => item.id === parsed.category) ? parsed.category : "all",
      district: parsed.district === "all" || DISTRICTS.includes(parsed.district) ? parsed.district : "all",
    };
  } catch {
    return { category: "all", district: "all" };
  }
}

function mediaFrom(value: unknown): CommunityMedia[] {
  if (!Array.isArray(value)) return [];
  const clean: CommunityMedia[] = [];
  for (const item of value) {
    if (!item || typeof item.url !== "string" || !isTrustedCommunityMediaUrl(item.url)) continue;
    if (item.type !== "image" && item.type !== "video") continue;
    clean.push({ url: item.url, type: item.type, name: String(item.name ?? "attachment").slice(0, 160) });
  }
  return clean;
}

export default function CommunityDashboard() {
  const { t, locale } = useI18n();
  const { user, profile } = useAuth();
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filters, setFilters] = useState<Filters>(savedFilters);
  const [formOpen, setFormOpen] = useState(false);
  const [category, setCategory] = useState<CommunityCategory>("safety");
  const [district, setDistrict] = useState("Port Louis");
  const [details, setDetails] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadReports = useCallback(async () => {
    setRefreshing(true);
    setLoadError(false);
    let query = supabase
      .from("community_reports")
      .select("id,user_id,author_name,category,district,details,media,created_at")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(40);
    if (filters.category !== "all") query = query.eq("category", filters.category);
    if (filters.district !== "all") query = query.eq("district", filters.district);
    const { data, error } = await query;
    if (error) {
      setLoadError(true);
    } else {
      setReports((data ?? []) as CommunityReport[]);
      setLastUpdated(new Date());
    }
    setRefreshing(false);
  }, [filters]);

  useEffect(() => {
    try { localStorage.setItem(FILTERS_KEY, JSON.stringify(filters)); } catch {
      // Filters remain applied for this session.
    }
    void loadReports();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadReports();
    }, 45_000);
    return () => window.clearInterval(interval);
  }, [loadReports]);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || profile?.full_name || "Community member";

  function changeFiles(next: FileList | null) {
    if (!next) return;
    const candidates = Array.from(next);
    const valid: File[] = [];
    for (const file of candidates) {
      if (files.length + valid.length >= 4) {
        setFormError(t("community.tooManyFiles"));
        continue;
      }
      const isImage = ["image/png", "image/jpeg"].includes(file.type);
      const isVideo = file.type === "video/mp4";
      if ((!isImage && !isVideo) || !/\.(png|jpe?g|mp4)$/i.test(file.name)) {
        setFormError(t("community.unsupportedFile"));
        continue;
      }
      if (isImage && file.size > 8 * 1024 * 1024) {
        setFormError(t("community.imageTooLarge"));
        continue;
      }
      if (isVideo && file.size > 40 * 1024 * 1024) {
        setFormError(t("community.videoTooLarge"));
        continue;
      }
      valid.push(file);
    }
    setFiles((current) => [...current, ...valid]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function publishReport(event: React.FormEvent) {
    event.preventDefault();
    if (!user || submitting) return;
    setFormError(null);
    setNotice(null);
    const text = details.trim();
    if (!text) {
      setFormError(t("community.detailsRequired"));
      return;
    }
    if (text.length > 2000 || !user.id) return;

    setSubmitting(true);
    try {
      const media = await Promise.all(files.map(uploadCommunityMedia));
      const { error } = await supabase.from("community_reports").insert({
        user_id: user.id,
        author_name: displayName,
        category,
        district,
        details: text,
        media,
      });
      if (error) throw error;
      setDetails("");
      setFiles([]);
      setFormOpen(false);
      setNotice(t("community.published"));
      setFilters({ category: "all", district: "all" });
      await loadReports();
    } catch {
      setFormError(t("community.publishError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteReport(report: CommunityReport) {
    if (!user) return;
    const media = mediaFrom(report.media).map((item) => item.url.split("/community-media/")[1]);
    const { error } = await supabase.from("community_reports").delete().eq("id", report.id).eq("user_id", user.id);
    if (error) {
      setLoadError(true);
      return;
    }
    if (media.length > 0) await supabase.storage.from("community-media").remove(media);
    setReports((current) => current.filter((item) => item.id !== report.id));
    setNotice(t("community.deleted"));
  }

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }), [locale]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">{t("community.title")}</h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">{t("community.subtitle")}</p>
        </div>
        <AppButton type="button" size="md" onClick={() => setFormOpen((open) => !open)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{formOpen ? t("common.cancel") : t("community.report")}</span>
        </AppButton>
      </header>

      <div role="note" className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-950">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{t("community.verificationNotice")}</span>
      </div>

      {formOpen && (
        <form onSubmit={publishReport} className="space-y-5 rounded-[1.75rem] border border-[#DDE6ED] bg-card p-5 shadow-premium sm:p-7 motion-safe:animate-fade-in-up">
          <div>
            <h2 className="font-display text-lg font-extrabold text-foreground">{t("community.newReport")}</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t("community.approximateHint")}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-foreground">
              {t("community.categoryLabel")}
              <select value={category} onChange={(event) => setCategory(event.target.value as CommunityCategory)} className="h-12 w-full rounded-xl border border-input bg-white px-3 text-sm font-normal text-foreground">
                {COMMUNITY_CATEGORIES.map((item) => <option key={item.id} value={item.id}>{t(item.labelKey)}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm font-semibold text-foreground">
              {t("community.districtLabel")}
              <select value={district} onChange={(event) => setDistrict(event.target.value)} className="h-12 w-full rounded-xl border border-input bg-white px-3 text-sm font-normal text-foreground">
                {DISTRICTS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          </div>

          <label className="block space-y-2 text-sm font-semibold text-foreground">
            {t("community.detailsLabel")}
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              maxLength={2000}
              rows={5}
              required
              placeholder={t("community.detailsPlaceholder")}
              className="w-full resize-y rounded-xl border border-input bg-white p-4 text-sm font-normal leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <span className="block text-right text-[11px] font-normal text-muted-foreground">{details.length} / 2000</span>
          </label>

          <div className="space-y-3">
            <label htmlFor="community-files" className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-primary/30 bg-secondary/60 px-4 text-sm font-bold text-primary transition-colors hover:bg-secondary">
              <Camera className="h-4 w-4" aria-hidden="true" />
              {t("community.attach")}
            </label>
            <input ref={fileInputRef} id="community-files" type="file" multiple className="sr-only" accept=".png,.jpg,.jpeg,.mp4,image/png,image/jpeg,video/mp4" onChange={(event) => changeFiles(event.target.files)} />
            <p className="text-xs leading-relaxed text-muted-foreground">{t("community.fileHint")}</p>
            {files.length > 0 && (
              <ul className="grid gap-2 sm:grid-cols-2">
                {files.map((file, index) => (
                  <li key={`${file.name}-${file.lastModified}-${index}`} className="flex min-w-0 items-center gap-2.5 rounded-xl border border-border bg-white p-2">
                    {file.type.startsWith("image/") ? (
                      <img src={previewUrls[index]} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                        <Video className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">{file.name}</span>
                    <button type="button" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-danger" aria-label={t("community.removeFile", { name: file.name })} onClick={() => setFiles((current) => current.filter((_, position) => position !== index))}>
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {formError && <p role="alert" className="rounded-xl bg-danger/[0.06] px-4 py-3 text-sm font-semibold text-danger">{formError}</p>}
          <AppButton type="submit" size="xl" disabled={submitting}>
            {submitting && <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />}
            {submitting ? t("community.publishing") : t("community.submit")}
          </AppButton>
        </form>
      )}

      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</p>}

      <section className="space-y-4 rounded-[1.75rem] border border-[#DDE6ED] bg-card p-5 shadow-premium sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary">
            <Filter className="h-4 w-4" aria-hidden="true" />
            {t("community.feed")}
          </div>
          <button type="button" onClick={() => void loadReports()} disabled={refreshing} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-primary hover:bg-secondary disabled:opacity-50">
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} aria-hidden="true" />
            {t("common.retry")}
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <select aria-label={t("community.filterCategory")} value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value as Filters["category"] }))} className="h-11 rounded-xl border border-input bg-white px-3 text-sm text-foreground">
            <option value="all">{t("community.allCategories")}</option>
            {COMMUNITY_CATEGORIES.map((item) => <option key={item.id} value={item.id}>{t(item.labelKey)}</option>)}
          </select>
          <select aria-label={t("community.filterDistrict")} value={filters.district} onChange={(event) => setFilters((current) => ({ ...current, district: event.target.value }))} className="h-11 rounded-xl border border-input bg-white px-3 text-sm text-foreground">
            <option value="all">{t("community.allDistricts")}</option>
            {DISTRICTS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{t("community.reportCount", { count: reports.length })}</span>
          {lastUpdated && <span>{t("community.updated", { time: dateFormatter.format(lastUpdated) })}</span>}
        </div>

        {loadError && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {t("community.feedError")}
          </div>
        )}

        {refreshing && reports.length === 0 ? (
          <div className="flex justify-center py-12" role="status"><LoaderCircle className="h-7 w-7 animate-spin text-primary" aria-label={t("common.loading")} /></div>
        ) : reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-background p-8 text-center">
            <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 font-display text-sm font-extrabold text-foreground">{t("community.empty")}</p>
            <p className="mt-1.5 text-xs text-muted-foreground">{t("community.emptyHint")}</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {reports.map((report) => {
              const categoryMeta = COMMUNITY_CATEGORIES.find((item) => item.id === report.category);
              const attachments = mediaFrom(report.media);
              const own = report.user_id === user?.id;
              return (
                <li key={report.id} className="overflow-hidden rounded-2xl border border-[#DDE6ED] bg-white">
                  <article className="space-y-4 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="break-words font-display text-base font-extrabold text-foreground">{report.author_name}</h2>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{report.district}</span>
                          <span aria-hidden="true">·</span>
                          <time dateTime={report.created_at}>{dateFormatter.format(new Date(report.created_at))}</time>
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-extrabold text-primary">
                        {categoryMeta ? t(categoryMeta.labelKey) : t("community.category.incident")}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">{report.details}</p>
                    {attachments.length > 0 && (
                      <div className={cn("grid gap-3", attachments.length > 1 ? "sm:grid-cols-2" : "")}>
                        {attachments.map((attachment) => attachment.type === "image" ? (
                          <a key={attachment.url} href={attachment.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-border bg-muted">
                            <img src={attachment.url} alt={attachment.name} loading="lazy" className="max-h-96 w-full object-cover" />
                          </a>
                        ) : (
                          <video key={attachment.url} src={attachment.url} controls playsInline preload="metadata" className="max-h-96 w-full rounded-xl bg-slate-950" />
                        ))}
                      </div>
                    )}
                    {own && (
                      <button type="button" onClick={() => void deleteReport(report)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-danger hover:bg-danger/[0.07]">
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {t("community.delete")}
                      </button>
                    )}
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
