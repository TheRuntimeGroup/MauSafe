import { useEffect, useState } from "react";
import { AlertTriangle, Info, Siren } from "lucide-react";
import { listPublishedAnnouncements, type Announcement, type AnnouncementSeverity } from "@/lib/announcements";
import { cn } from "@/lib/utils";

const SEVERITY_TONES: Record<
  AnnouncementSeverity,
  { card: string; icon: string; title: string; iconWrap: string }
> = {
  info: {
    card: "border-sky-200 bg-sky-50",
    icon: "text-sky-700",
    title: "text-sky-950",
    iconWrap: "bg-sky-100 text-sky-700",
  },
  warning: {
    card: "border-amber-200 bg-amber-50",
    icon: "text-amber-700",
    title: "text-amber-950",
    iconWrap: "bg-amber-100 text-amber-700",
  },
  emergency: {
    card: "border-rose-200 bg-rose-50",
    icon: "text-rose-700",
    title: "text-rose-950",
    iconWrap: "bg-rose-100 text-rose-700",
  },
};

function severityIcon(severity: AnnouncementSeverity) {
  if (severity === "emergency") return Siren;
  if (severity === "warning") return AlertTriangle;
  return Info;
}

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    let active = true;
    listPublishedAnnouncements()
      .then((items) => {
        if (active) setAnnouncements(items.slice(0, 3));
      })
      .catch(() => {
        if (active) setAnnouncements([]);
      });
    return () => {
      active = false;
    };
  }, []);

  if (announcements.length === 0) return null;

  return (
    <div className="space-y-3 motion-safe:animate-fade-in-up">
      {announcements.map((item) => {
        const tone = SEVERITY_TONES[item.severity];
        const Icon = severityIcon(item.severity);
        return (
          <article
            key={item.id}
            className={cn("flex items-start gap-3 rounded-2xl border px-4 py-3.5", tone.card)}
          >
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                tone.iconWrap,
              )}
              aria-hidden="true"
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2.1} />
            </span>
            <div className="min-w-0">
              <p className={cn("text-sm font-extrabold leading-snug", tone.title)}>{item.title}</p>
              {item.body && (
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                  {item.body}
                </p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
