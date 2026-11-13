import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { Logo } from "@/components/Logo";

const NotFound = () => {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <Logo className="h-12 w-12" />
      <h1 className="mt-4 font-display text-5xl font-bold text-foreground">404</h1>
      <p className="mt-2 text-base text-muted-foreground">{t("guest.notFoundTitle")}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t("guest.notFoundBody")}</p>
      <Link
        to="/"
        className="mt-6 inline-flex h-12 items-center gap-2 rounded-2xl bg-primary px-5 text-base font-semibold text-primary-foreground"
      >
        <Home className="h-4 w-4" aria-hidden="true" />
        {t("nav.home")}
      </Link>
    </div>
  );
};

export default NotFound;
