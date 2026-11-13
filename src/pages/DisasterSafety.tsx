import { useCallback, useEffect, useState } from "react";
import {
  Cloud,
  CloudLightning,
  CloudRain,
  Droplets,
  ExternalLink,
  Globe2,
  Loader2,
  RefreshCw,
  Sun,
  TriangleAlert,
  Wind,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { AppButton } from "@/components/ui/app-button";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type WeatherData = {
  region: string;
  weather: {
    current: {
      time: string;
      temperature_2m: number;
      apparent_temperature: number;
      relative_humidity_2m: number;
      weather_code: number;
      wind_speed_10m: number;
    };
    daily: {
      time: string[];
      weather_code: number[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_probability_max: number[];
    };
  };
};

type GdacsAlert = {
  id: string;
  title: string;
  description: string;
  link: string;
  publishedAt: string | null;
  eventType: string;
  alertLevel: "GREEN" | "ORANGE" | "RED" | "UNKNOWN";
};

const REGIONS = [
  { id: "port-louis", name: "Port Louis" },
  { id: "curepipe", name: "Curepipe" },
  { id: "grand-baie", name: "Grand Baie" },
  { id: "rodrigues", name: "Rodrigues" },
];

function WeatherIcon({ code, className }: { code: number; className?: string }) {
  const props = { className, "aria-hidden": true as const };
  if (code === 0 || code === 1) return <Sun {...props} />;
  if (code >= 95) return <CloudLightning {...props} />;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return <CloudRain {...props} />;
  return <Cloud {...props} />;
}

const DisasterSafety = () => {
  const { t, locale } = useI18n();
  const [region, setRegion] = useState("port-louis");
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [alerts, setAlerts] = useState<GdacsAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState(false);

  const loadWeather = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(`/api/weather?region=${encodeURIComponent(region)}`);
      if (!response.ok) throw new Error("Weather unavailable");
      setData((await response.json()) as WeatherData);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [region]);

  useEffect(() => {
    void loadWeather();
  }, [loadWeather]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/disaster-alerts")
      .then((response) => {
        if (!response.ok) throw new Error("Alerts unavailable");
        return response.json() as Promise<{ alerts: GdacsAlert[] }>;
      })
      .then((result) => {
        if (!cancelled) setAlerts(result.alerts);
      })
      .catch(() => {
        if (!cancelled) setAlertsError(true);
      })
      .finally(() => {
        if (!cancelled) setAlertsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const current = data?.weather.current;
  const daily = data?.weather.daily;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-foreground">{t("weather.title")}</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("weather.subtitle")}</p>
      </header>

      <div className="space-y-2">
        <label htmlFor="weather-region" className="text-sm font-semibold text-foreground">
          {t("weather.region")}
        </label>
        <select
          id="weather-region"
          value={region}
          onChange={(event) => setRegion(event.target.value)}
          className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {REGIONS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center rounded-2xl border border-border bg-card py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label={t("weather.title")} />
        </div>
      ) : error || !current || !daily ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <TriangleAlert className="mx-auto h-7 w-7 text-amber-700" aria-hidden="true" />
          <p className="mt-3 text-sm text-amber-900">{t("weather.error")}</p>
          <AppButton variant="outline" className="mt-4" onClick={() => void loadWeather()}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t("weather.retry")}
          </AppButton>
        </section>
      ) : (
        <>
          <section className="rounded-2xl bg-[#071B33] p-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-white/60">{data.region} · {t("weather.now")}</p>
                <p className="mt-3 font-display text-5xl font-extrabold tracking-tight">
                  {Math.round(current.temperature_2m)}°C
                </p>
                <p className="mt-2 text-xs text-white/60">
                  {t("weather.feels", { value: Math.round(current.apparent_temperature) })}
                </p>
              </div>
              <WeatherIcon code={current.weather_code} className="h-14 w-14 text-sky-300" />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 text-sm">
              <p className="flex items-center gap-2 text-white/75">
                <Wind className="h-4 w-4 text-sky-300" aria-hidden="true" />
                {Math.round(current.wind_speed_10m)} km/h
              </p>
              <p className="flex items-center gap-2 text-white/75">
                <Droplets className="h-4 w-4 text-sky-300" aria-hidden="true" />
                {current.relative_humidity_2m}% {t("weather.humidity")}
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-bold text-foreground">{t("weather.forecast")}</h2>
            <div className="grid grid-cols-3 gap-2">
              {daily.time.map((date, index) => (
                <div key={date} className="rounded-xl border border-border bg-card p-3 text-center">
                  <p className="text-xs font-bold text-muted-foreground">
                    {new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "Indian/Mauritius" }).format(new Date(`${date}T12:00:00`))}
                  </p>
                  <WeatherIcon code={daily.weather_code[index]} className="mx-auto mt-3 h-6 w-6 text-primary" />
                  <p className="mt-3 text-sm font-extrabold text-foreground">
                    {Math.round(daily.temperature_2m_max[index])}°
                    <span className="ml-1 font-medium text-muted-foreground">{Math.round(daily.temperature_2m_min[index])}°</span>
                  </p>
                  <p className="mt-1 text-[11px] text-primary">
                    {daily.precipitation_probability_max[index] ?? 0}% {t("weather.rain")}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">{t("weather.source")}</p>
          </section>
        </>
      )}

      <section className="space-y-3">
        <div className="flex items-start gap-3 px-1">
          <Globe2 className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">{t("alerts.title")}</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("alerts.subtitle")}</p>
          </div>
        </div>

        {alertsLoading ? (
          <div className="flex justify-center rounded-2xl border border-border bg-card py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" aria-label={t("alerts.title")} />
          </div>
        ) : alertsError ? (
          <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            {t("alerts.unavailable")}
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card px-5">
            {alerts.map((alert) => (
              <a
                key={alert.id}
                href={alert.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group block border-b border-border py-4 last:border-b-0"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                      alert.alertLevel === "RED"
                        ? "bg-danger"
                        : alert.alertLevel === "ORANGE"
                          ? "bg-amber-500"
                          : alert.alertLevel === "GREEN"
                            ? "bg-emerald-500"
                            : "bg-muted-foreground",
                    )}
                    aria-label={alert.alertLevel}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-bold leading-snug text-foreground">{alert.title}</h3>
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
                    </div>
                    <p className="mt-1.5 text-[11px] font-semibold text-muted-foreground">
                      GDACS · {alert.eventType}
                      {alert.publishedAt ? ` · ${formatDateTime(alert.publishedAt, locale)}` : ""}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div>
            <h2 className={cn("font-display text-base font-bold text-amber-900")}>{t("weather.officialTitle")}</h2>
            <p className="mt-1 text-sm leading-relaxed text-amber-900/90">{t("weather.officialBody")}</p>
            <a
              href="https://metservice.intnet.mu/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-amber-900 underline underline-offset-4"
            >
              {t("weather.officialCta")}
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-base font-bold text-foreground">{t("weather.checklistTitle")}</h2>
        <ul className="mt-4 space-y-3">
          {["weather.item1", "weather.item2", "weather.item3", "weather.item4"].map((key, index) => (
            <li key={key} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
              <span className="font-mono text-xs font-bold text-primary">0{index + 1}</span>
              {t(key)}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default DisasterSafety;
