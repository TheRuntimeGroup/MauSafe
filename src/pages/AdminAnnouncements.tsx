import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Info,
  LoaderCircle,
  Pencil,
  ShieldAlert,
  Siren,
  Trash2,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  updateAnnouncement,
  type Announcement,
  type AnnouncementSeverity,
} from "@/lib/announcements";
import { AppButton } from "@/components/ui/app-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const SEVERITIES: AnnouncementSeverity[] = ["info", "warning", "emergency"];

const SEVERITY_TONES: Record<
  AnnouncementSeverity,
  { selected: string; badge: string; icon: string }
> = {
  info: {
    selected: "border-sky-300 bg-sky-50 text-sky-900",
    badge: "bg-sky-100 text-sky-800",
    icon: "text-sky-700",
  },
  warning: {
    selected: "border-amber-300 bg-amber-50 text-amber-900",
    badge: "bg-amber-100 text-amber-800",
    icon: "text-amber-700",
  },
  emergency: {
    selected: "border-rose-300 bg-rose-50 text-rose-900",
    badge: "bg-rose-100 text-rose-800",
    icon: "text-rose-700",
  },
};

function severityIcon(severity: AnnouncementSeverity) {
  if (severity === "emergency") return Siren;
  if (severity === "warning") return AlertTriangle;
  return Info;
}

const AdminAnnouncements = () => {
  const { t, locale } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  const [items, setItems] = useState<Announcement[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [severity, setSeverity] = useState<AnnouncementSeverity>("info");
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    setListLoading(true);
    setListError(null);
    try {
      setItems(await listAnnouncements());
    } catch {
      setListError(t("announcement.error"));
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setBody("");
    setSeverity("info");
    setPublished(false);
    setNotice(null);
    setFormError(null);
  }

  function startEdit(item: Announcement) {
    setEditingId(item.id);
    setTitle(item.title);
    setBody(item.body);
    setSeverity(item.severity);
    setPublished(item.published);
    setNotice(null);
    setFormError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setFormError(null);

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle || !trimmedBody) {
      setFormError(t("announcement.required"));
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateAnnouncement(editingId, {
          title: trimmedTitle,
          body: trimmedBody,
          severity,
          published,
        });
      } else {
        await createAnnouncement({
          title: trimmedTitle,
          body: trimmedBody,
          severity,
          published,
        });
      }
      setNotice(t("announcement.saved"));
      resetForm();
      await load();
    } catch {
      setFormError(t("announcement.error"));
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(item: Announcement) {
    try {
      await updateAnnouncement(item.id, { published: !item.published });
      await load();
    } catch {
      setListError(t("announcement.error"));
    }
  }

  async function handleDelete(item: Announcement) {
    if (!window.confirm(t("announcement.deleteConfirm"))) return;
    try {
      await deleteAnnouncement(item.id);
      if (editingId === item.id) resetForm();
      await load();
    } catch {
      setListError(t("announcement.error"));
    }
  }

  if (authLoading || adminLoading) {
    return (
      <div className="flex justify-center py-24 text-muted-foreground">
        <LoaderCircle className="h-6 w-6 animate-spin" aria-hidden="true" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-amber-600" aria-hidden="true" />
        <h1 className="mt-3 font-display text-xl font-bold text-foreground">{t("announcement.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("announcement.signInHint")}</p>
        <Link
          to="/auth"
          className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-base font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]"
        >
          {t("auth.signIn")}
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-rose-600" aria-hidden="true" />
        <h1 className="mt-3 font-display text-xl font-bold text-foreground">{t("announcement.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("announcement.notAdmin")}</p>
        <Link
          to="/"
          className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("common.back")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-foreground">{t("announcement.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("announcement.subtitle")}</p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-border bg-card p-5 motion-safe:animate-fade-in-up"
      >
        <h2 className="font-display text-base font-bold text-foreground">
          {editingId ? t("announcement.editTitle") : t("announcement.newTitle")}
        </h2>

        <div className="space-y-2">
          <Label htmlFor="announcement-title" className="font-semibold text-foreground">
            {t("announcement.titleLabel")}
          </Label>
          <Input
            id="announcement-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t("announcement.titlePlaceholder")}
            className="h-11 rounded-xl border-input bg-background text-foreground focus-visible:border-primary"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="announcement-body" className="font-semibold text-foreground">
            {t("announcement.bodyLabel")}
          </Label>
          <Textarea
            id="announcement-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={4}
            placeholder={t("announcement.bodyPlaceholder")}
            className="resize-y rounded-xl border-input bg-background text-foreground focus-visible:border-primary"
          />
        </div>

        <div className="space-y-2">
          <Label className="font-semibold text-foreground">{t("announcement.severityLabel")}</Label>
          <div className="grid grid-cols-3 gap-2">
            {SEVERITIES.map((value) => {
              const Icon = severityIcon(value);
              const tone = SEVERITY_TONES[value];
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSeverity(value)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors",
                    severity === value
                      ? tone.selected
                      : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {t(`announcement.severity.${value}`)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/40 px-4 py-3">
          <div>
            <Label htmlFor="announcement-published" className="font-semibold text-foreground">
              {t("announcement.publishedLabel")}
            </Label>
            <p className="text-xs text-muted-foreground">{t("announcement.publishedHint")}</p>
          </div>
          <Switch
            id="announcement-published"
            checked={published}
            onCheckedChange={setPublished}
          />
        </div>

        {formError && (
          <p className="rounded-xl border border-danger/20 bg-danger/[0.06] px-4 py-3 text-sm font-medium text-danger">
            {formError}
          </p>
        )}
        {notice && (
          <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {notice}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <AppButton type="submit" variant="primary" size="lg" disabled={saving}>
            {saving ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                {t("announcement.saving")}
              </>
            ) : (
              t(editingId ? "announcement.saveChanges" : "announcement.save")
            )}
          </AppButton>
          {editingId && (
            <AppButton type="button" variant="outline" size="lg" onClick={resetForm}>
              {t("common.cancel")}
            </AppButton>
          )}
        </div>
      </form>

      <section className="space-y-3">
        <h2 className="px-1 text-sm font-extrabold text-foreground">{t("announcement.listTitle")}</h2>

        {listLoading ? (
          <div className="flex justify-center py-10 text-muted-foreground">
            <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
          </div>
        ) : listError ? (
          <div className="rounded-2xl border border-danger/20 bg-danger/[0.06] p-4 text-sm text-danger">
            {listError}
            <button type="button" onClick={() => void load()} className="ml-2 font-bold underline">
              {t("common.retry")}
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            {t("announcement.empty")}
          </div>
        ) : (
          items.map((item) => {
            const tone = SEVERITY_TONES[item.severity];
            const Icon = severityIcon(item.severity);
            return (
              <article key={item.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", tone.icon)} aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", tone.badge)}>
                          {t(`announcement.severity.${item.severity}`)}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-bold",
                            item.published
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {item.published ? t("announcement.liveNow") : t("announcement.draft")}
                        </span>
                      </div>
                      {item.body && (
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                          {item.body}
                        </p>
                      )}
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {new Date(item.created_at).toLocaleString(locale, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  <button
                    type="button"
                    onClick={() => togglePublished(item)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-secondary"
                  >
                    {item.published ? t("announcement.unpublish") : t("announcement.publish")}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-secondary"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("announcement.edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-danger/10 px-3 py-1.5 text-xs font-bold text-danger transition-colors hover:bg-danger/15"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("announcement.delete")}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};

export default AdminAnnouncements;
