import { useState, type ReactNode } from "react";
import { ExternalLink, Mail, MapPin, Navigation, Phone, Share2, Star } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import type { HelpEntry } from "@/data/helpDirectory";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AppButton } from "@/components/ui/app-button";
import { cn } from "@/lib/utils";

export function ServiceDetailsDialog({
  entry,
  saved,
  onToggleSaved,
  children,
}: {
  entry: HelpEntry;
  saved: boolean;
  onToggleSaved: () => void;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const [feedback, setFeedback] = useState<string | null>(null);
  const phones = Array.from(new Set(entry.phoneOptions ?? (entry.phone ? [entry.phone] : [])));

  async function shareService() {
    const text = [
      entry.serviceName,
      [entry.locality, entry.division].filter(Boolean).join(" · "),
      ...phones,
      entry.address,
      entry.email,
      entry.directionsQuery
        ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(entry.directionsQuery)}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      if (navigator.share) {
        try {
          await navigator.share({ title: entry.serviceName, text });
          setFeedback("help.opened");
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
          throw error;
        }
      } else {
        await navigator.clipboard.writeText(text);
        setFeedback("help.copied");
      }
    } catch {
      setFeedback("help.shareError");
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[88vh] max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-[1.75rem] border-white/80 bg-white/90 p-0 shadow-2xl backdrop-blur-2xl sm:max-w-lg">
        <div className="border-b border-border px-6 pb-5 pt-6">
          <DialogHeader>
            <DialogTitle className="pr-8 font-display text-2xl font-extrabold leading-tight text-foreground">
              {entry.serviceName}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {[entry.locality, entry.division].filter(Boolean).join(" · ")}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-wrap gap-2">
            <AppButton variant={saved ? "subtle" : "outline"} size="sm" onClick={onToggleSaved}>
              <Star className={cn("h-4 w-4", saved && "fill-current text-amber-500")} aria-hidden="true" />
              {saved ? t("help.saved") : t("help.save")}
            </AppButton>
            <AppButton variant="outline" size="sm" onClick={() => void shareService()}>
              <Share2 className="h-4 w-4" aria-hidden="true" />
              {t("help.share")}
            </AppButton>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">{t("help.saveHint")}</p>
        </div>

        <div className="space-y-5 px-6 py-5">
          {phones.length > 0 && (
            <section>
              <h3 className="text-xs font-extrabold uppercase tracking-[0.12em] text-primary">
                {t("help.contactOptions")}
              </h3>
              <div className="mt-3 grid gap-2">
                {phones.map((phone) => (
                  <a
                    key={phone}
                    href={`tel:${phone}`}
                    className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 font-mono text-sm font-extrabold text-foreground transition-colors hover:border-primary/30 hover:bg-secondary"
                  >
                    {phone}
                    <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </section>
          )}

          {entry.address && (
            <section>
              <h3 className="text-xs font-extrabold uppercase tracking-[0.12em] text-primary">
                {t("help.address")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{entry.address}</p>
            </section>
          )}

          {entry.alternatePhone && (
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{t("help.alternatePhone")}:</strong> {entry.alternatePhone}
            </p>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            {entry.directionsQuery && (
              <a
                href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(entry.directionsQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white"
              >
                <Navigation className="h-4 w-4" aria-hidden="true" />
                {t("help.directions")}
              </a>
            )}
            {entry.email && (
              <a
                href={`mailto:${entry.email}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-bold text-foreground"
              >
                <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
                {t("help.email")}
              </a>
            )}
          </div>

          {(entry.sourceLabel || entry.sourceUrl) && (
            <div className="rounded-xl bg-secondary/50 p-3 text-xs leading-relaxed text-muted-foreground">
              {t("help.source")}: {entry.sourceUrl ? (
                <a href={entry.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-primary">
                  {entry.sourceLabel ?? entry.sourceUrl}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              ) : entry.sourceLabel}
            </div>
          )}
          {feedback && <p className="text-xs text-muted-foreground" role="status">{t(feedback)}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
