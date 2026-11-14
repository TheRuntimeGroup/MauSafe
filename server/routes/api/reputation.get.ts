import { defineHandler } from "nitro";
import { createError, getQuery } from "nitro/h3";

type SignalLevel = "info" | "warning" | "danger";
type SourceStatus = "ok" | "empty" | "unavailable";

interface ReputationSignal {
  id: string;
  level: SignalLevel;
  detail: string | null;
}

interface ReputationSource {
  id: "trustpilot" | "urlhaus" | "rdap" | "dns";
  status: SourceStatus;
  url: string | null;
  rating: number | null;
  reviewCount: number | null;
  reportCount: number | null;
}

const SUSPICIOUS_TLDS = new Set([
  "tk", "ml", "ga", "cf", "gq", "xyz", "top", "icu", "buzz", "club", "online",
  "site", "click", "link", "work", "loan", "win", "men", "stream", "rest",
]);

const SHORTENER_DOMAINS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "cutt.ly", "ow.ly",
  "rb.gy", "shorturl.at", "rebrand.ly", "tiny.one", "cutt.us",
]);

const MULTI_TLD = new Set([
  "co.uk", "org.uk", "ac.uk", "gov.uk", "co.mu", "org.mu", "net.mu", "ac.mu",
  "gov.mu", "com.au", "net.au", "org.au", "co.za", "com.mx", "com.br",
]);

function normalizeInput(raw: string): URL | null {
  const value = raw.trim();
  if (!value || /\s/.test(value)) return null;
  let withScheme = value;
  if (!/^https?:\/\//i.test(withScheme)) withScheme = `https://${withScheme}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname || url.hostname.length < 4) return null;
    return url;
  } catch {
    return null;
  }
}

function isIpHost(hostname: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":");
}

function registrableDomain(hostname: string): string {
  const lower = hostname.toLowerCase();
  const labels = lower.split(".").filter(Boolean);
  if (labels.length <= 2) return lower;
  const lastTwo = labels.slice(-2).join(".");
  if (MULTI_TLD.has(lastTwo) && labels.length >= 3) {
    return labels.slice(-3).join(".");
  }
  return lastTwo;
}

function domainCandidates(hostname: string): string[] {
  const labels = hostname.split(".").filter(Boolean);
  const candidates: string[] = [];
  for (let i = 0; i < labels.length - 1 && candidates.length < 3; i++) {
    candidates.push(labels.slice(i).join(".").toLowerCase());
  }
  return candidates;
}

type RdapResult = "not_found" | { created: string | null };

async function rdapLookup(domain: string): Promise<RdapResult> {
  const response = await fetch(`https://rdap.org/domain/${domain}`, {
    signal: AbortSignal.timeout(6000),
    headers: { Accept: "application/rdap+json, application/json" },
  });
  if (response.status === 404) return "not_found";
  if (!response.ok) throw new Error("rdap failed");
  const data = (await response.json()) as { events?: { eventAction?: string; eventDate?: string }[] };
  const created = data.events?.find((e) => e.eventAction === "registration")?.eventDate ?? null;
  return { created };
}

async function dnsResolves(hostname: string): Promise<boolean> {
  const url = new URL("https://cloudflare-dns.com/dns-query");
  url.searchParams.set("name", hostname);
  url.searchParams.set("type", "A");
  const response = await fetch(url, {
    signal: AbortSignal.timeout(6000),
    headers: { Accept: "application/dns-json" },
  });
  if (!response.ok) throw new Error("dns failed");
  const data = (await response.json()) as { Status?: number };
  return data.Status === 0;
}

async function urlhausLookup(hostname: string): Promise<number> {
  const response = await fetch("https://urlhaus-api.abuse.ch/v1/host/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ host: hostname }),
    signal: AbortSignal.timeout(9000),
  });
  if (!response.ok) throw new Error("urlhaus failed");
  const data = (await response.json()) as { query_status?: string; url_count?: number };
  if (data.query_status === "ok" && typeof data.url_count === "number") return data.url_count;
  return 0;
}

async function trustpilotLookup(domain: string): Promise<{ rating: number | null; reviewCount: number | null }> {
  const response = await fetch(`https://www.trustpilot.com/review/${encodeURIComponent(domain)}`, {
    signal: AbortSignal.timeout(9000),
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "MauSafe/1.0 (link reputation check)",
    },
  });
  if (!response.ok) throw new Error("trustpilot unavailable");
  const html = await response.text();
  const scripts = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const script of scripts) {
    const jsonText = script.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "").trim();
    if (!jsonText) continue;
    try {
      const parsed = JSON.parse(jsonText) as { aggregateRating?: { ratingValue?: unknown; reviewCount?: unknown } };
      const aggregate = parsed.aggregateRating;
      if (aggregate && (aggregate.ratingValue != null || aggregate.reviewCount != null)) {
        const rating = Number(aggregate.ratingValue);
        const reviewCount = Number(aggregate.reviewCount);
        return {
          rating: Number.isFinite(rating) ? rating : null,
          reviewCount: Number.isFinite(reviewCount) ? reviewCount : null,
        };
      }
    } catch {
      // ignore malformed JSON-LD blocks
    }
  }
  return { rating: null, reviewCount: null };
}

const cache = new Map<string, { expiresAt: number; payload: unknown }>();

export default defineHandler(async (event) => {
  const query = getQuery(event);
  const raw = typeof query.url === "string" ? query.url : "";
  const url = normalizeInput(raw);
  if (!url) {
    throw createError({ statusCode: 400, statusMessage: "invalid_url" });
  }

  const hostname = url.hostname.toLowerCase();
  const domain = isIpHost(hostname) ? hostname : registrableDomain(hostname);
  const cacheKey = `${domain}|${hostname}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return { domain, url: url.toString(), ...(cached.payload as object) };
  }

  const signals: ReputationSignal[] = [];
  const sources: ReputationSource[] = [];

  // Heuristic signals that don't need a network round-trip.
  if (isIpHost(hostname)) {
    signals.push({ id: "ip_literal", level: "info", detail: hostname });
  }
  if (hostname.startsWith("xn--")) {
    signals.push({ id: "idn", level: "info", detail: hostname });
  }
  const tld = hostname.split(".").pop()?.toLowerCase() ?? "";
  if (SUSPICIOUS_TLDS.has(tld)) {
    signals.push({ id: "suspicious_tld", level: "info", detail: `.${tld}` });
  }
  if (SHORTENER_DOMAINS.has(domain)) {
    signals.push({ id: "shortener", level: "info", detail: hostname });
  }

  // Domain registry (RDAP) — registration age.
  let rdapStatus: SourceStatus = "unavailable";
  let rdapDomain = domain;
  if (!isIpHost(hostname)) {
    for (const candidate of domainCandidates(hostname)) {
      try {
        const result = await rdapLookup(candidate);
        if (result === "not_found") continue;
        rdapDomain = candidate;
        if (result.created) {
          const createdMs = Date.parse(result.created);
          if (Number.isFinite(createdMs)) {
            const days = Math.max(0, Math.round((Date.now() - createdMs) / 86_400_000));
            signals.push({
              id: "domain_age",
              level: days < 30 ? "info" : days < 365 ? "warning" : "info",
              detail: String(days),
            });
          } else {
            signals.push({ id: "domain_age", level: "info", detail: null });
          }
        } else {
          signals.push({ id: "domain_age", level: "info", detail: null });
        }
        rdapStatus = "ok";
        break;
      } catch {
        break;
      }
    }
    if (rdapStatus === "unavailable") {
      // No registry record found for any candidate — a strong sign for a fake or brand-new domain.
      signals.push({ id: "domain_age", level: "danger", detail: null });
      rdapStatus = "empty";
    }
  } else {
    rdapStatus = "empty";
  }
  sources.push({
    id: "rdap",
    status: rdapStatus,
    url: `https://rdap.org/domain/${rdapDomain}`,
    rating: null,
    reviewCount: null,
    reportCount: null,
  });

  // DNS reachability via DNS-over-HTTPS.
  let dnsStatus: SourceStatus = "unavailable";
  try {
    const resolves = await dnsResolves(hostname);
    signals.push({ id: "dns", level: resolves ? "info" : "danger", detail: null });
    dnsStatus = "ok";
  } catch {
    dnsStatus = "unavailable";
  }
  sources.push({ id: "dns", status: dnsStatus, url: null, rating: null, reviewCount: null, reportCount: null });

  // URLhaus — known malware/phishing reports for the host.
  let urlhausStatus: SourceStatus = "unavailable";
  let reportCount: number | null = null;
  try {
    const count = await urlhausLookup(hostname);
    reportCount = count;
    signals.push({ id: "urlhaus", level: count > 0 ? "danger" : "info", detail: String(count) });
    urlhausStatus = "ok";
  } catch {
    urlhausStatus = "unavailable";
  }
  sources.push({
    id: "urlhaus",
    status: urlhausStatus,
    url: `https://urlhaus.abuse.ch/host/${hostname}/`,
    rating: null,
    reviewCount: null,
    reportCount,
  });

  // Trustpilot — public review page rating.
  let trustpilotStatus: SourceStatus = "unavailable";
  let rating: number | null = null;
  let reviewCount: number | null = null;
  try {
    const trustpilot = await trustpilotLookup(domain);
    rating = trustpilot.rating;
    reviewCount = trustpilot.reviewCount;
    if (rating != null) {
      signals.push({
        id: "trustpilot",
        level: rating >= 4 ? "info" : rating >= 3 ? "warning" : "danger",
        detail: String(rating),
      });
    } else {
      signals.push({ id: "trustpilot", level: "info", detail: null });
    }
    trustpilotStatus = "ok";
  } catch {
    trustpilotStatus = "unavailable";
  }
  sources.push({
    id: "trustpilot",
    status: trustpilotStatus,
    url: `https://www.trustpilot.com/review/${encodeURIComponent(domain)}`,
    rating,
    reviewCount,
    reportCount: null,
  });

  const weights: Record<SignalLevel, number> = { danger: 30, warning: 10, info: 0 };
  const score = Math.min(100, signals.reduce((total, signal) => total + weights[signal.level], 0));
  const risk = score >= 55 ? "high" : score >= 25 ? "medium" : "low";

  const payload = {
    url: url.toString(),
    risk,
    score,
    signals,
    sources,
  };

  cache.set(cacheKey, { expiresAt: Date.now() + 10 * 60_000, payload });
  return { domain, ...payload };
});
