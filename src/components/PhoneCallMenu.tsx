import { Phone } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function PhoneCallMenu({ serviceName, phones }: { serviceName: string; phones: string[] }) {
  const { t } = useI18n();
  const options = Array.from(new Set(phones));

  if (options.length === 0) return null;
  if (options.length === 1) {
    return (
      <a
        href={`tel:${options[0]}`}
        className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground"
      >
        <Phone className="h-3.5 w-3.5" aria-hidden="true" />
        {options[0]}
      </a>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground"
          aria-label={`${t("help.chooseNumber")} — ${serviceName}`}
        >
          <Phone className="h-3.5 w-3.5" aria-hidden="true" />
          {t("help.chooseLine")} · {options.length}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-2rem)] rounded-3xl border-white/80 bg-white/90 p-6 shadow-2xl backdrop-blur-2xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-extrabold text-foreground">
            {t("help.chooseNumber")}
          </DialogTitle>
          <DialogDescription className="leading-relaxed text-muted-foreground">
            {t("help.chooseNumberBody", { service: serviceName, count: options.length })}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {options.map((phone) => (
            <a
              key={phone}
              href={`tel:${phone}`}
              className="flex min-h-14 items-center justify-between gap-4 rounded-xl border border-border bg-white px-4 py-3 text-base font-extrabold text-foreground transition-colors hover:border-primary/30 hover:bg-secondary"
            >
              {phone}
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
                <Phone className="h-4 w-4" aria-hidden="true" />
              </span>
            </a>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
