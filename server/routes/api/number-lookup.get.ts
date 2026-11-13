import { defineHandler } from "nitro";
import { useRuntimeConfig } from "nitro/runtime-config";
import { createError, getQuery, setResponseHeader } from "nitro/h3";

type NumverifyResponse = {
  valid?: boolean;
  international_format?: string;
  country_name?: string;
  location?: string;
  carrier?: string;
  line_type?: string;
  success?: boolean;
  error?: { info?: string };
};

function normalizeMauritiusNumber(value: string): string | null {
  let input = value.trim().replace(/[\s()\-.]/g, "");
  if (input.startsWith("00")) input = `+${input.slice(2)}`;
  if (input.startsWith("0")) input = input.slice(1);
  const digits = input.replace(/^\+?230/, "");
  return /^\d{8}$/.test(digits) ? `+230${digits}` : null;
}

export default defineHandler(async (event) => {
  const query = getQuery(event);
  const number = normalizeMauritiusNumber(
    typeof query.number === "string" ? query.number : "",
  );
  if (!number) {
    throw createError({ statusCode: 400, statusMessage: "A valid Mauritius number is required" });
  }

  setResponseHeader(event, "Cache-Control", "no-store");
  const config = useRuntimeConfig() as Record<string, unknown>;
  const apiKey = typeof config.numverifyApiKey === "string" ? config.numverifyApiKey : "";

  if (!apiKey) {
    return { available: false as const, reason: "not_configured" as const };
  }

  const baseUrl =
    typeof config.numverifyBaseUrl === "string" && config.numverifyBaseUrl
      ? config.numverifyBaseUrl
      : "https://apilayer.net/api/validate";
  const url = new URL(baseUrl);
  url.searchParams.set("access_key", apiKey);
  url.searchParams.set("number", number);
  url.searchParams.set("format", "1");

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!response.ok) {
      throw createError({ statusCode: 502, statusMessage: "Carrier lookup unavailable" });
    }
    const data = (await response.json()) as NumverifyResponse;
    if (data.success === false || data.error || data.valid !== true) {
      return { available: false as const, reason: "provider_error" as const };
    }

    return {
      available: true as const,
      source: "numverify" as const,
      carrier: data.carrier?.trim() || null,
      lineType: data.line_type?.trim().toLowerCase() || null,
      location: data.location?.trim() || null,
      countryName: data.country_name?.trim() || null,
      internationalFormat: data.international_format?.trim() || null,
    };
  } catch {
    return { available: false as const, reason: "network_error" as const };
  }
});
