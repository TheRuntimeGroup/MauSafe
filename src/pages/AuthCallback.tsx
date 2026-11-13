import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { useI18n } from "@/i18n/I18nContext";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const { t } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const tokenHash = params.get("token_hash");
    const type = params.get("type");

    async function finish() {
      if (type === "recovery") {
        navigate(`/reset-password${window.location.search}`, { replace: true });
        return;
      }

      try {
        if (tokenHash && type) {
          await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as EmailOtpType });
        } else if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }
      } catch {
        // The session listener will still resolve the sign-in where possible.
      } finally {
        if (active) navigate("/", { replace: true });
      }
    }

    finish();
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
      <LoaderCircle className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      <p className="text-sm font-semibold text-muted-foreground">{t("auth.checking")}</p>
    </div>
  );
};

export default AuthCallback;
