import { defineHandler } from "nitro";
import { createError, getQuery } from "nitro/h3";

const REGIONS = {
  "port-louis": { name: "Port Louis", latitude: -20.1619, longitude: 57.4989 },
  curepipe: { name: "Curepipe", latitude: -20.3163, longitude: 57.5266 },
  "grand-baie": { name: "Grand Baie", latitude: -20.0182, longitude: 57.5803 },
  rodrigues: { name: "Rodrigues", latitude: -19.7245, longitude: 63.4272 },
} as const;

type Region = keyof typeof REGIONS;

export default defineHandler(async (event) => {
  const query = getQuery(event);
  const requested = typeof query.region === "string" ? query.region : "port-louis";
  const region = REGIONS[requested as Region] ?? REGIONS["port-louis"];
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(region.latitude));
  url.searchParams.set("longitude", String(region.longitude));
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m",
  );
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
  );
  url.searchParams.set("timezone", "Indian/Mauritius");
  url.searchParams.set("forecast_days", "3");

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error("Weather provider failed");
    const data = await response.json();
    return { region: region.name, source: "Open-Meteo", weather: data };
  } catch {
    throw createError({ statusCode: 503, statusMessage: "weather_unavailable" });
  }
});
