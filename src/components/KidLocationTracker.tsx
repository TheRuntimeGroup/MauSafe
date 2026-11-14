import { useEffect, useRef, useState } from "react";
import { LoaderCircle, MapPin, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { cn } from "@/lib/utils";

type Status = "waiting" | "active" | "permission" | "unsupported" | "error";

export function KidLocationTracker() {
  const { t, locale } = useI18n();
  const { user, profile } = useAuth();
  const [status, setStatus] = useState<Status>("waiting");
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const lastSaveRef = useRef(0);

  const persist = async (lat: number, lng: number, acc: number | null) => {
    if (!user) return;
    const now = Date.now();
    if (now - lastSaveRef.current < 10_000) return;
    lastSaveRef.current = now;
    const { error } = await supabase
      .from("child_locations")
      .upsert(
        { child_id: user.id, latitude: lat, longitude: lng, accuracy: acc, updated_at: new Date().toISOString() },
        { onConflict: "child_id" },
      );
    if (!error) {
      setUpdatedAt(now);
      setAccuracy(acc);
    }
  };

  useEffect(() => {
    if (profile?.account_type !== "child" || !user) return;
    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }

    let active = true;
    setStatus("waiting");

    const onSuccess = (pos: GeolocationPosition) => {
      if (!active) return;
      setStatus("active");
      void persist(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy ?? null);
    };
    const onError = (error: GeolocationPositionError) => {
      if (!active) return;
      setStatus(error.code === error.PERMISSION_DENIED ? "permission" : "error");
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 12_000,
      maximumAge: 30_000,
    });

    const watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 30_000,
    });

    return () => {
      active = false;
      navigator.geolocation.clearWatch(watchId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.account_type, user?.id]);

  const retry = () => {
    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setStatus("waiting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStatus("active");
        void persist(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy ?? null);
      },
      (error) => setStatus(error.code === error.PERMISSION_DENIED ? "permission" : "error"),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 },
    );
  };

  const message =
    status === "unsupported" ? t("kids.location.unsupported")
    : status === "permission" ? t("kids.location.permissionError")
    : status === "error" ? t("kids.location.positionError")
    : status === "active" ? t("kids.location.active")
    : t("kids.location.waiting");

  return (
    <section className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50/70 p-5 shadow-premium sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
          <MapPin className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-extrabold text-emerald-950">{t("kids.location.title")}</h2>
          <p className="mt-1 text-xs leading-relaxed text-emerald-800">{t("kids.location.autoOn")}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-white px-4 py-3">
        <span className="relative flex h-3 w-3 shrink-0">
          {status === "active" && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
          <span className={cn("relative inline-flex h-3 w-3 rounded-full", status === "active" ? "bg-emerald-500" : status === "waiting" ? "bg-amber-400" : "bg-rose-400")} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-extrabold text-emerald-950">
            <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            {message}
          </p>
          {status === "active" && updatedAt && (
            <p className="mt-0.5 text-xs text-emerald-800">
              {t("kids.location.updated", { time: new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", second: "2-digit" }).format(updatedAt) })}
              {accuracy !== null && ` · ${t("kids.location.accuracy", { value: Math.round(accuracy) })}`}
            </p>
          )}
        </div>
        {status === "waiting" && <LoaderCircle className="h-5 w-5 animate-spin text-emerald-600" aria-hidden="true" />}
      </div>

      {(status === "permission" || status === "error" || status === "unsupported") && (
        <button
          type="button"
          onClick={retry}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white transition-colors hover:bg-emerald-700"
        >
          <MapPin className="h-4 w-4" aria-hidden="true" />
          {t("common.retry")}
        </button>
      )}
    </section>
  );
}
