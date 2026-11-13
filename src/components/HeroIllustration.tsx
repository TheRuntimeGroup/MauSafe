import { Check, MapPin, Phone, ShieldCheck, UserRound } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { cn } from "@/lib/utils";

export function HeroIllustration({ className }: { className?: string }) {
  const { t } = useI18n();

  return (
    <div className={cn("relative mx-auto w-full max-w-[420px] py-5", className)}>
      <div className="relative">
        <div className="absolute -right-3 top-2 h-24 w-24 rounded-full bg-amber-300" />
        <div className="absolute -left-5 bottom-20 h-16 w-16 rounded-2xl border-2 border-dashed border-white/30" />

        <div className="relative aspect-[1/1.04] overflow-hidden rounded-[2rem] border border-white/30 bg-[#EDE9FE] shadow-2xl">
          <svg
            className="absolute inset-0 h-full w-full text-violet-300/70"
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M-30 115C75 55 127 168 215 119C301 71 328 116 438 52" stroke="currentColor" strokeWidth="18" opacity="0.45" />
            <path d="M37 436C49 317 123 329 151 252C182 167 228 188 262 112C282 67 342 55 397 74" stroke="currentColor" strokeWidth="10" opacity="0.5" />
            <path d="M-24 304C81 264 155 345 236 296C316 248 342 284 425 262" stroke="currentColor" strokeWidth="8" opacity="0.5" />
            <path d="M55 95L335 337M-10 202L250 17M161 415L391 173" stroke="white" strokeWidth="3" opacity="0.8" />
          </svg>

          <div className="absolute left-1/2 top-1/2 flex w-[78%] -translate-x-1/2 -translate-y-1/2 flex-col rounded-[1.65rem] border border-violet-100 bg-white p-5 text-foreground shadow-[0_24px_60px_-20px_rgba(46,16,101,0.4)]">
            <div className="flex items-center justify-between gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-[11px] font-bold text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                {t("status.on_the_way")}
              </span>
            </div>

            <p className="mt-5 font-display text-xl font-extrabold tracking-tight">
              {t("preset.going_home")}
            </p>

            <div className="mt-5 flex items-center gap-3">
              <div className="flex flex-col items-center">
                <span className="h-3 w-3 rounded-full border-[3px] border-primary bg-white" />
                <span className="h-8 w-0.5 bg-violet-200" />
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 space-y-3">
                <span className="block h-2 w-20 rounded-full bg-slate-200" />
                <span className="block h-2 w-28 rounded-full bg-violet-100" />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-primary">
                  <UserRound className="h-3.5 w-3.5" />
                </span>
                {t("form.contactLabel")}
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Check className="h-4 w-4" strokeWidth={3} />
              </span>
            </div>
          </div>
        </div>

        <div className="absolute -left-2 bottom-0 flex items-center gap-3 rounded-2xl bg-white p-3 pr-5 text-foreground shadow-xl sm:-left-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Check className="h-5 w-5" strokeWidth={3} />
          </span>
          <span className="max-w-[150px] font-display text-xs font-extrabold leading-tight">
            {t("home.how3Title")}
          </span>
        </div>

        <a
          href="tel:999"
          className="absolute -right-1 top-14 flex items-center gap-2 rounded-2xl bg-danger px-4 py-3 text-sm font-extrabold text-white shadow-xl transition-transform hover:scale-105 focus-visible:ring-white sm:-right-4"
          aria-label={t("help.call999")}
        >
          <Phone className="h-4 w-4" />
          999
        </a>
      </div>
    </div>
  );
}
