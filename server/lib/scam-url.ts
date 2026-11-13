import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { DnsCheck, UrlSignal, WebsiteCheck } from "../../src/lib/scamCheck";

const SHORTENERS = [
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "is.gd",
  "cutt.ly",
  "ow.ly",
  "rb.gy",
  "shorturl.at",
  "rebrand.ly",
  "tiny.one",
  "cutt.us",
  "lnk.to",
];

const BRANDS = [
  { needle: "paypal", name: "PayPal", domains: ["paypal.com", "paypal.me"] },
  { needle: "netflix", name: "Netflix", domains: ["netflix.com"] },
  { needle: "whatsapp", name: "WhatsApp", domains: ["whatsapp.com", "wa.me"] },
  { needle: "facebook", name: "Facebook", domains: ["facebook.com", "fb.com", "fb.me"] },
  { needle: "instagram", name: "Instagram", domains: ["instagram.com", "instagr.am"] },
  { needle: "microsoft", name: "Microsoft", domains: ["microsoft.com", "live.com", "office.com"] },
  { needle: "apple", name: "Apple", domains: ["apple.com", "icloud.com"] },
  { needle: "mcb", name: "MCB", domains: ["mcb.mu"] },
  { needle: "absa", name: "Absa", domains: ["absa.africa", "absabank.mu"] },
  { needle: "juice", name: "Juice", domains: ["mcb.mu"] },
];

function isDomainOrSubdomain(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function parseWebUrl(input: string): URL {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 2048 || /\s/.test(trimmed)) {
    throw new Error("invalid_url");
  }

  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new Error("invalid_url");
  }

  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) {
    throw new Error("invalid_url");
  }
  const hostnameAddress = url.hostname.replace(/^\[|\]$/g, "");
  if (url.hostname.includes("%") || (!url.hostname.includes(".") && isIP(hostnameAddress) === 0)) {
    throw new Error("invalid_url");
  }
  return url;
}

export function analyseUrlStructure(input: string): {
  url: URL;
  score: number;
  signals: UrlSignal[];
} {
  const url = parseWebUrl(input);
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  const signals: UrlSignal[] = [];

  if (url.username || url.password) {
    signals.push({
      id: "embedded_credentials",
      title: "The address hides information before the @ sign",
      explanation: "The real destination comes after the @ sign. This format is often used to disguise where a link goes.",
      weight: 28,
    });
  }
  if (url.protocol === "http:") {
    signals.push({
      id: "insecure_protocol",
      title: "Does not use HTTPS",
      explanation: "Information sent over HTTP is not encrypted in transit. HTTPS alone would not prove a site is genuine.",
      weight: 14,
    });
  }
  if (isIP(hostname.replace(/^\[|\]$/g, "")) !== 0) {
    signals.push({
      id: "raw_ip",
      title: "Uses an IP address instead of a domain",
      explanation: "Most established organisations use a recognisable domain rather than a numeric network address.",
      weight: 24,
    });
  }
  if (hostname.includes("xn--")) {
    signals.push({
      id: "internationalised_domain",
      title: "Uses an internationalised domain encoding",
      explanation: "Punycode can be legitimate, but it can also make one domain look deceptively similar to another.",
      weight: 18,
    });
  }
  if (SHORTENERS.some((domain) => isDomainOrSubdomain(hostname, domain))) {
    signals.push({
      id: "shortened_link",
      title: "Uses a link-shortening service",
      explanation: "The destination is hidden until the short link is opened. Review the redirect result before proceeding.",
      weight: 18,
    });
  }
  if (hostname.split(".").length > 4) {
    signals.push({
      id: "deep_subdomains",
      title: "Contains an unusual number of subdomains",
      explanation: "Only the registered domain identifies the site owner; a familiar name placed at the start is not proof.",
      weight: 10,
    });
  }
  if (url.port && !["80", "443"].includes(url.port)) {
    signals.push({
      id: "unusual_port",
      title: "Uses a non-standard network port",
      explanation: "An unexpected port can indicate a service that is not a normal public website.",
      weight: 12,
    });
  }
  if (hostname.length > 48) {
    signals.push({
      id: "long_domain",
      title: "Uses an unusually long domain",
      explanation: "Long domains are sometimes assembled to imitate a company name or conceal the actual destination.",
      weight: 8,
    });
  }
  if (/\.(?:zip|mov|click|gq|tk|top)$/i.test(hostname)) {
    signals.push({
      id: "review_tld",
      title: "Deserves extra domain scrutiny",
      explanation: "This domain ending is inexpensive or easy to misuse. It is not malicious by itself, so check the full domain carefully.",
      weight: 8,
    });
  }

  for (const brand of BRANDS) {
    const mentionsBrand = hostname.includes(brand.needle);
    const isOfficial = brand.domains.some((domain) => isDomainOrSubdomain(hostname, domain));
    if (mentionsBrand && !isOfficial) {
      signals.push({
        id: `brand_mismatch_${brand.needle}`,
        title: `${brand.name}'s name appears in an unrelated domain`,
        explanation: `The domain is not one of the known official ${brand.name} domains checked by this rule. Verify it independently before signing in.`,
        weight: 28,
      });
      break;
    }
  }

  return {
    url,
    signals,
    score: Math.min(100, signals.reduce((total, signal) => total + signal.weight, 0)),
  };
}

function isPrivateIPv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  const [a, b, c] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function isPrivateAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return isPrivateIPv4(address);
  if (version !== 6) return true;

  const normalised = address.toLowerCase();
  if (normalised.startsWith("::ffff:")) {
    const mapped = normalised.slice(7);
    return isIP(mapped) === 4 ? isPrivateIPv4(mapped) : true;
  }
  return (
    normalised === "::" ||
    normalised === "::1" ||
    normalised.startsWith("fc") ||
    normalised.startsWith("fd") ||
    /^fe[89ab]/.test(normalised) ||
    normalised.startsWith("ff") ||
    normalised.startsWith("2001:db8:") ||
    normalised.startsWith("64:ff9b:")
  );
}

export async function resolvePublicHostname(hostname: string): Promise<DnsCheck> {
  if (hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    return { status: "blocked", message: "Local or private network addresses are never opened." };
  }

  const literalAddress = hostname.replace(/^\[|\]$/g, "");
  if (isIP(literalAddress) !== 0) {
    return isPrivateAddress(literalAddress)
      ? { status: "blocked", message: "Local or private network addresses are never opened." }
      : { status: "resolved", message: "The public IP address is syntactically valid.", addressCount: 1 };
  }

  try {
    const addresses = await lookup(hostname, { all: true, verbatim: true });
    if (addresses.length === 0) {
      return { status: "failed", message: "The domain did not return a DNS address." };
    }
    if (addresses.some(({ address }) => isPrivateAddress(address))) {
      return { status: "blocked", message: "The domain resolves to a local or private network and was not opened." };
    }
    return {
      status: "resolved",
      message: `DNS resolved to ${addresses.length} public ${addresses.length === 1 ? "address" : "addresses"}.`,
      addressCount: addresses.length,
    };
  } catch {
    return { status: "failed", message: "The domain could not be resolved through DNS." };
  }
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

async function readPageTitle(response: Response): Promise<string | undefined> {
  if (!response.headers.get("content-type")?.includes("text/html") || !response.body) {
    return undefined;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let html = "";
  try {
    while (html.length < 65536) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      if (/<\/title\s*>/i.test(html)) break;
    }
  } catch {
    return undefined;
  } finally {
    await reader.cancel().catch(() => undefined);
  }

  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title\s*>/i);
  if (!match) return undefined;
  const title = decodeEntities(match[1].replace(/\s+/g, " ").trim());
  return title ? title.slice(0, 180) : undefined;
}

export async function inspectLiveWebsite(initialUrl: URL): Promise<WebsiteCheck> {
  let currentUrl = initialUrl;

  for (let redirectCount = 0; redirectCount <= 4; redirectCount += 1) {
    if (currentUrl.username || currentUrl.password) {
      return { status: "blocked", message: "Addresses with embedded credentials are not opened." };
    }

    const dns = await resolvePublicHostname(currentUrl.hostname.toLowerCase());
    if (dns.status === "blocked") {
      return { status: "blocked", message: dns.message, redirectCount };
    }
    if (dns.status === "failed") {
      return { status: "unreachable", message: "The website could not be reached because DNS lookup failed.", redirectCount };
    }

    let response: Response;
    try {
      response = await fetch(currentUrl, {
        redirect: "manual",
        signal: AbortSignal.timeout(7000),
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "AnouSecureMoris-LinkInspector/1.0",
        },
      });
    } catch {
      return {
        status: "unreachable",
        message: "No website response was received before the timeout. This does not prove the domain is safe or unsafe.",
        redirectCount,
      };
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      await response.body?.cancel().catch(() => undefined);
      if (!location) {
        return {
          status: "reachable",
          message: "The server returned a redirect without a destination.",
          statusCode: response.status,
          redirectCount,
        };
      }
      if (redirectCount === 4) {
        return { status: "unreachable", message: "The website exceeded four redirects.", redirectCount };
      }
      try {
        currentUrl = new URL(location, currentUrl);
      } catch {
        return { status: "unreachable", message: "The website returned an invalid redirect.", redirectCount };
      }
      if (!["http:", "https:"].includes(currentUrl.protocol)) {
        return { status: "blocked", message: "A redirect attempted to leave HTTP/HTTPS and was not followed.", redirectCount };
      }
      continue;
    }

    const pageTitle = await readPageTitle(response);
    return {
      status: "reachable",
      message: `The server responded with HTTP ${response.status}. A response does not establish who owns the site.`,
      statusCode: response.status,
      finalUrl: currentUrl.href,
      redirectCount,
      pageTitle,
    };
  }

  return { status: "unreachable", message: "The website redirect chain could not be completed." };
}
