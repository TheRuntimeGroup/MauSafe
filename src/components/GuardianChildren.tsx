import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, ChevronRight, LoaderCircle, MapPin, RefreshCw, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import type { OwnerJourney } from "@/lib/types";
import { SharedLocationMap } from "@/components/SharedLocationMap";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type ChildRecord = { id: string; name: string; email: string; linkedAt: string };

export function GuardianChildren() {
  const { t, locale } = useI18n();
  const { profile } = useAuth();
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [journey, setJourney] = useState<OwnerJourney | null>(null);
  const [loading, setLoading] = useState(true);
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadChildren() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("unauthorized");
        const response = await fetch("/api/guardian/children", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!response.ok) throw new Error("unavailable");
        const data = await response.json() as { children: ChildRecord[] };
        if (!active) return;
        setChildren(data.children);
        setSelectedId(data.children[0]?.id ?? null);
      } catch {
        if (active) setError(t("guardian.authError"));
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadChildren();
    return () => { active = false; };
  }, [t]);

  const loadJourney = useCallback(async (childId: string, showLoading = true) => {
    if (showLoading) setJourneyLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("unauthorized");
      const response = await fetch(`/api/guardian/children/${encodeURIComponent(childId)}/journey`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error("unavailable");
      const data = await response.json() as { journey: OwnerJourney | null };
      setJourney(data.journey);
      setError(null);
    } catch {
      setError(t("guardian.authError"));
    } finally {
      if (showLoading) setJourneyLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!selectedId) return;
    void loadJourney(selectedId);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadJourney(selectedId, false);
    }, 15_000);
    return () => window.clearInterval(interval);
  }, [selectedId, loadJourney]);

  const selectedChild = useMemo(() => children.find((child) => child.id === selectedId) ?? null, [children, selectedId]);
  if (profile?.account_type === "child") return null;

  return (
    <section className="space-y-5 rounded-[1.75rem] border border-[#DDE6ED] bg-card p-5 shadow-premium sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
          <Users className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-xl font-extrabold text-foreground">{t("guardian.childrenTitle")}</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("guardian.childrenSubtitle")}</p>
        </div>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 rounded-xl p-3 text-sm text-muted-foreground" role="status">
          <LoaderCircle className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />{t("common.loading")}
        </p>
      ) : error && children.length === 0 ? (
        <p role="alert" className="rounded-xl bg-danger/[0.06] px-4 py-3 text-sm text-danger">{error}</p>
      ) : children.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-background p-5 text-center">
          <p className="font-display text-sm font-extrabold text-foreground">{t("guardian.noChildren")}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("guardian.noChildrenHint")}</p>
          <Link to="/settings" className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-primary hover:underline">
            {t("guardian.setupChild")}<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-2" role="list" aria-label={t("guardian.childrenTitle")}>
            {children.map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => setSelectedId(child.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
                  selectedId === child.id ? "border-primary/30 bg-secondary" : "border-border bg-white hover:bg-muted",
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-extrabold text-primary">
                  {child.name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold text-foreground">{child.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{t("guardian.linked")}</span>
                </span>
                {selectedId === child.id && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
              </button>
            ))}
          </div>

          {selectedChild && (
            <div className="rounded-2xl border border-primary/15 bg-[#F4F8FB] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-base font-extrabold text-foreground">{t("guardian.childLocation", { name: selectedChild.name })}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{journey ? t(`status.${journey.status}`) : t("guardian.noJourney")}</p>
                </div>
                <button type="button" onClick={() => void loadJourney(selectedChild.id)} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-primary hover:bg-white" aria-label={t("common.retry")}>
                  <RefreshCw className={cn("h-3.5 w-3.5", journeyLoading && "animate-spin")} aria-hidden="true" />
                  {t("common.retry")}
                </button>
              </div>

              {journeyLoading && <LoaderCircle className="my-4 h-5 w-5 animate-spin text-primary" aria-hidden="true" />}
              {error && <p role="alert" className="mt-3 rounded-lg bg-danger/[0.06] px-3 py-2 text-xs text-danger">{error}</p>}
              {!journeyLoading && journey && (
                <>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t("guardian.lastSync", { time: new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(new Date(journey.updatedAt)) })}
                  </p>
                  {journey.location ? (
                    <>
                      <div className="mt-3 overflow-hidden rounded-xl bg-white">
                        <SharedLocationMap location={journey.location} />
                      </div>
                      <div className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                        <span>{t("location.approximate")}</span>
                      </div>
                      {journey.location.updatedAt && (
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          {t("location.updated", { time: new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(journey.location.updatedAt)) })}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t("location.waiting")}</p>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
