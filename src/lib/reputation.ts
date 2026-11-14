export type SignalLevel = "info" | "warning" | "danger";
export type SourceStatus = "ok" | "empty" | "unavailable";
export type RiskTier = "low" | "medium" | "high";

export interface ReputationSignal {
  id:
    | "ip_literal"
    | "idn"
    | "suspicious_tld"
    | "shortener"
    | "domain_age"
    | "urlhaus"
    | "trustpilot";
  level: SignalLevel;
  detail: string | null;
}

export interface ReputationSource {
  id: "trustpilot" | "urlhaus" | "rdap";
  status: SourceStatus;
  url: string | null;
  rating: number | null;
  reviewCount: number | null;
  reportCount: number | null;
}

export interface ReputationResult {
  domain: string;
  url: string;
  risk: RiskTier;
  score: number;
  signals: ReputationSignal[];
  sources: ReputationSource[];
}

export type ReputationError = "invalid_url" | "network";

export async function checkLinkReputation(raw: string): Promise<ReputationResult> {
  const value = raw.trim();
  if (!value) throw new Error("invalid_url");

  const url = new URL(`/api/reputation`, window.location.origin);
  url.searchParams.set("url", value);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(25_000),
    });
  } catch {
    throw new Error("network");
  }

  if (!response.ok) {
    if (response.status === 400) throw new Error("invalid_url");
    throw new Error("network");
  }

  const data = (await response.json()) as ReputationResult;
  return data;
}
