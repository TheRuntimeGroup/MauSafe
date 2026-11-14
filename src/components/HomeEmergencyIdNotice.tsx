import { IdCard } from "lucide-react";
import { Link } from "react-router-dom";
import { AppButton } from "@/components/ui/app-button";
import { useI18n } from "@/i18n/I18nContext";

export function HomeEmergencyIdNotice() {
  const { t } = useI18n();

  return (
    <aside className="flex flex-col gap-4 rounded-2xl border border-[#D7E4EF] bg-[#F2F6FB] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <IdCard className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-sm font-extrabold text-foreground">{t("emergencyId.noticeTitle")}</h2>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">{t("emergencyId.noticeBody")}</p>
        </div>
      </div>
      <Link to="/emergency-id" className="shrink-0">
        <AppButton variant="outline" size="md" className="w-full bg-white sm:w-auto">
          <IdCard className="h-4 w-4" aria-hidden="true" />
          {t("emergencyId.manage")}
        </AppButton>
      </Link>
    </aside>
  );
}
