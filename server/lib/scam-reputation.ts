import type {
  SafeBrowsingCheck,
  TrustpilotCheck,
  VirusTotalCheck,
} from "../../src/lib/scamCheck";

const NOT_REQUESTED = "This optional check was turned off.";

export function trustpilotNotRequested(hostname: string): TrustpilotCheck {
  return {
    status: "not_requested",
    message: NOT_REQUESTED,
    profileUrl: trustpilotSearchUrl(hostname),
  };
}

export function safeBrowsingNotRequested(): SafeBrowsingCheck {
  return { status: "not_requested", message: NOT_REQUESTED, threats: [] };
}

export function virusTotalNotRequested(): VirusTotalCheck {
  return { status: "not_requested", message: NOT_REQUESTED, malicious: 0, suspicious: 0 };
}

function cleanHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
}

function trustpilotSearchUrl(hostname: string): string {
  return `https://www.trustpilot.com/search?query=${encodeURIComponent(cleanHostname(hostname))}`;
}

async function readLimitedText(response: Response, maximumLength = 500_000): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  try {
    while (text.length < maximumLength) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return text.slice(0, maximumLength);
}

function extractMetric(html: string, metric: "ratingValue" | "reviewCount"): number | undefined {
  const expression = new RegExp(
    `(?:"|&quot;)${metric}(?:"|&quot;)\\s*:\\s*(?:"|&quot;)?([\\d,.]+)`,
    "i",
  );
  const match = html.match(expression);
  if (!match) return undefined;
  const value = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(value) ? value : undefined;
}

async function checkPublicTrustpilot(hostname: string): Promise<TrustpilotCheck> {
  const domain = cleanHostname(hostname);
  const exactProfileUrl = `https://www.trustpilot.com/review/${encodeURIComponent(domain)}`;
  try {
    const response = await fetch(exactProfileUrl, {
      signal: AbortSignal.timeout(7000),
      headers: {
        Accept: "text/html",
        "User-Agent": "Mozilla/5.0 (compatible; AnouSecureMoris/1.0; +https://anousecure.local)",
      },
    });

    if (response.status === 404) {
      await response.body?.cancel().catch(() => undefined);
      return {
        status: "not_found",
        message: "Trustpilot did not have a public profile for this exact domain. Search for alternative business names.",
        profileUrl: trustpilotSearchUrl(domain),
      };
    }
    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      return {
        status: "unavailable",
        message: "Trustpilot did not allow an automated lookup. You can still search its public site manually.",
        profileUrl: trustpilotSearchUrl(domain),
      };
    }

    const html = await readLimitedText(response);
    const rating = extractMetric(html, "ratingValue");
    const reviewCount = extractMetric(html, "reviewCount");
    return {
      status: "found",
      message:
        rating === undefined
          ? "An exact-domain public Trustpilot profile was found. Open it to review current customer feedback."
          : "An exact-domain public Trustpilot profile was found. Reviews are context, not proof that a website is safe.",
      profileUrl: exactProfileUrl,
      rating,
      reviewCount,
      source: "public_profile",
    };
  } catch {
    return {
      status: "unavailable",
      message: "Trustpilot could not be reached. You can still search its public site manually.",
      profileUrl: trustpilotSearchUrl(domain),
    };
  }
}

export async function checkTrustpilot(hostname: string, apiKey?: string): Promise<TrustpilotCheck> {
  const domain = cleanHostname(hostname);
  if (!apiKey) return checkPublicTrustpilot(domain);

  try {
    const response = await fetch(
      `https://api.trustpilot.com/v1/business-units/find?name=${encodeURIComponent(domain)}&apikey=${encodeURIComponent(apiKey)}`,
      { signal: AbortSignal.timeout(7000), headers: { Accept: "application/json" } },
    );
    if (response.status === 404) {
      await response.body?.cancel().catch(() => undefined);
      return {
        status: "not_found",
        message: "Trustpilot's Business API found no profile for this exact domain.",
        profileUrl: trustpilotSearchUrl(domain),
      };
    }
    if (!response.ok) throw new Error("provider_error");

    const data = (await response.json()) as {
      displayName?: string;
      score?: { stars?: number; trustScore?: number };
      numberOfReviews?: { total?: number };
    };
    const rating = data.score?.stars ?? data.score?.trustScore;
    return {
      status: "found",
      message: "Trustpilot's Business API found an exact-domain profile. Reviews are context, not proof of safety.",
      profileUrl: `https://www.trustpilot.com/review/${encodeURIComponent(domain)}`,
      rating,
      reviewCount: data.numberOfReviews?.total,
      businessName: data.displayName,
      source: "api",
    };
  } catch {
    return checkPublicTrustpilot(domain);
  }
}

export async function checkSafeBrowsing(url: string, apiKey?: string): Promise<SafeBrowsingCheck> {
  if (!apiKey) {
    return {
      status: "unavailable",
      message: "Google Safe Browsing is not configured on this deployment. No threat-database verdict was returned.",
      threats: [],
    };
  }

  try {
    const response = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        signal: AbortSignal.timeout(7000),
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          client: { clientId: "anousecure-moris", clientVersion: "1.0" },
          threatInfo: {
            threatTypes: [
              "MALWARE",
              "SOCIAL_ENGINEERING",
              "UNWANTED_SOFTWARE",
              "POTENTIALLY_HARMFUL_APPLICATION",
            ],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }],
          },
        }),
      },
    );
    if (!response.ok) throw new Error("provider_error");
    const data = (await response.json()) as { matches?: { threatType?: string }[] };
    const threats = [...new Set((data.matches ?? []).map((match) => match.threatType ?? "KNOWN_THREAT"))];
    return threats.length > 0
      ? {
          status: "threat_detected",
          message: "Google Safe Browsing matched this URL against a known threat entry.",
          threats,
        }
      : {
          status: "clear",
          message: "Google Safe Browsing returned no match for this URL. A new or unreported scam can still be dangerous.",
          threats: [],
        };
  } catch {
    return {
      status: "unavailable",
      message: "Google Safe Browsing did not return a usable response. No threat-database verdict is available.",
      threats: [],
    };
  }
}

export async function checkVirusTotal(hostname: string, apiKey?: string): Promise<VirusTotalCheck> {
  if (!apiKey) {
    return {
      status: "unavailable",
      message: "VirusTotal is not configured on this deployment. No security-engine report was returned.",
      malicious: 0,
      suspicious: 0,
    };
  }

  try {
    const response = await fetch(
      `https://www.virustotal.com/api/v3/domains/${encodeURIComponent(cleanHostname(hostname))}`,
      {
        signal: AbortSignal.timeout(7000),
        headers: { Accept: "application/json", "x-apikey": apiKey },
      },
    );
    if (response.status === 404) {
      await response.body?.cancel().catch(() => undefined);
      return {
        status: "not_found",
        message: "VirusTotal has no domain report for this exact hostname. That is not a clean verdict.",
        malicious: 0,
        suspicious: 0,
      };
    }
    if (!response.ok) throw new Error("provider_error");

    const payload = (await response.json()) as {
      data?: { attributes?: { last_analysis_stats?: Record<string, number> } };
    };
    const stats = payload.data?.attributes?.last_analysis_stats;
    if (!stats) throw new Error("provider_error");
    const malicious = stats.malicious ?? 0;
    const suspicious = stats.suspicious ?? 0;
    const enginesAnalysed = Object.values(stats).reduce((total, value) => total + value, 0);
    return malicious + suspicious > 0
      ? {
          status: "flagged",
          message: "One or more VirusTotal security engines flagged this domain.",
          malicious,
          suspicious,
          enginesAnalysed,
        }
      : {
          status: "clear",
          message: "No security engine flagged this domain in the latest VirusTotal report. This is not a guarantee of safety.",
          malicious,
          suspicious,
          enginesAnalysed,
        };
  } catch {
    return {
      status: "unavailable",
      message: "VirusTotal did not return a usable domain report. No security-engine verdict is available.",
      malicious: 0,
      suspicious: 0,
    };
  }
}
