import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useI18n } from "@/i18n/I18nContext";
import { supabase } from "@/integrations/supabase/client";

const appearance = {
  theme: ThemeSupa,
  variables: {
    default: {
      colors: {
        brand: "#1E4E8C",
        brandAccent: "#0D2B45",
        brandButtonText: "#FFFFFF",
        defaultButtonBackground: "#1E4E8C",
        defaultButtonBackgroundHover: "#0D2B45",
        defaultButtonBorder: "#1E4E8C",
        defaultButtonText: "#FFFFFF",
        inputBackground: "#FFFFFF",
        inputBorder: "#DDE6ED",
        inputBorderHover: "#AFC3D4",
        inputBorderFocus: "#1E4E8C",
        inputText: "#1F2430",
        inputPlaceholder: "#93A3B4",
        anchorTextColor: "#1E4E8C",
        dividerBackground: "#DDE6ED",
        messageText: "#5B6774",
        messageTextDanger: "#DC2626",
      },
      fonts: {
        bodyFontFamily: `Manrope, system-ui, -apple-system, "Segoe UI", sans-serif`,
        buttonFontFamily: `Manrope, system-ui, -apple-system, "Segoe UI", sans-serif`,
        inputFontFamily: `Manrope, system-ui, -apple-system, "Segoe UI", sans-serif`,
        labelFontFamily: `Manrope, system-ui, -apple-system, "Segoe UI", sans-serif`,
      },
      radii: {
        borderRadiusButton: "14px",
        buttonBorderRadius: "14px",
        inputBorderRadius: "14px",
      },
      borderWidths: {
        buttonBorderWidth: "1px",
        inputBorderWidth: "1px",
      },
      space: {
        buttonPadding: "12px 18px",
        inputPadding: "12px 14px",
      },
      fontSizes: {
        baseBodySize: "14px",
        baseInputSize: "15px",
        baseLabelSize: "13px",
        baseButtonSize: "15px",
      },
    },
  },
  className: {
    container: "w-full font-sans",
    button: "w-full font-semibold transition-all hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
    input: "w-full transition-colors",
    label: "font-semibold text-foreground",
    anchor: "font-semibold",
    message: "text-sm leading-relaxed",
    divider: "my-5",
  },
};

const AuthPage = () => {
  const { t } = useI18n();
  const redirectTo = new URL("/auth/callback", window.location.origin).href;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="overflow-hidden rounded-[1.75rem] border border-[#DDE6ED] bg-white shadow-premium">
        <div className="flex items-center gap-3 border-b border-foreground/[0.07] bg-[#F6F9FC] px-6 py-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0D2B45] text-white">
            <ShieldCheck className="h-6 w-6" strokeWidth={1.9} aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-display text-xl font-extrabold tracking-tight text-foreground">
              {t("auth.title")}
            </h1>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t("auth.subtitle")}</p>
          </div>
        </div>

        <div className="px-6 py-7 sm:px-8 sm:py-8">
          <Auth
            supabaseClient={supabase}
            view="sign_in"
            redirectTo={redirectTo}
            providers={[]}
            appearance={appearance}
            theme="light"
          />
        </div>
      </div>

      <Link
        to="/"
        className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t("auth.back")}
      </Link>
    </div>
  );
};

export default AuthPage;
