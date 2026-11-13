export type CheckMode = "message" | "link";
export type RiskLevel = "low" | "medium" | "high";

export interface CheckOptions {
  liveWebsite: boolean;
  trustpilot: boolean;
  safeBrowsing: boolean;
  virusTotal: boolean;
}

export interface MessageFinding {
  id: string;
  title: string;
  explanation: string;
  severity: "warning" | "critical";
  matches: string[];
  weight: number;
}

export interface UrlSignal {
  id: string;
  title: string;
  explanation: string;
  weight: number;
}

export interface DnsCheck {
  status: "resolved" | "failed" | "blocked";
  message: string;
  addressCount?: number;
}

export interface WebsiteCheck {
  status: "reachable" | "unreachable" | "blocked" | "not_requested";
  message: string;
  statusCode?: number;
  finalUrl?: string;
  redirectCount?: number;
  pageTitle?: string;
}

export interface TrustpilotCheck {
  status: "found" | "not_found" | "unavailable" | "not_requested";
  message: string;
  profileUrl: string;
  rating?: number;
  reviewCount?: number;
  businessName?: string;
  source?: "api" | "public_profile";
}

export interface SafeBrowsingCheck {
  status: "clear" | "threat_detected" | "unavailable" | "not_requested";
  message: string;
  threats: string[];
}

export interface VirusTotalCheck {
  status: "clear" | "flagged" | "not_found" | "unavailable" | "not_requested";
  message: string;
  malicious: number;
  suspicious: number;
  enginesAnalysed?: number;
}

export interface UrlInspection {
  input: string;
  normalizedUrl: string;
  hostname: string;
  score: number;
  signals: UrlSignal[];
  dns: DnsCheck;
  website: WebsiteCheck;
  trustpilot: TrustpilotCheck;
  safeBrowsing: SafeBrowsingCheck;
  virusTotal: VirusTotalCheck;
}

export interface ScamCheckResult {
  mode: CheckMode;
  checkedAt: string;
  risk: RiskLevel;
  score: number;
  messageScore: number;
  findings: MessageFinding[];
  links: UrlInspection[];
  omittedLinkCount: number;
  externalFlagCount: number;
  steps: string[];
}

export interface ScamCheckRequest {
  mode: CheckMode;
  input: string;
  options: CheckOptions;
}

export class ScamCheckError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ScamCheckError";
    this.status = status;
  }
}

export async function checkScam(request: ScamCheckRequest): Promise<ScamCheckResult> {
  let response: Response;

  try {
    response = await fetch("/api/scam-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    throw new ScamCheckError(
      "We could not reach the checker. Check your connection and try again.",
      0,
    );
  }

  const body = (await response.json().catch(() => null)) as
    | { statusMessage?: string; message?: string }
    | ScamCheckResult
    | null;

  if (!response.ok) {
    const errorBody = body as { statusMessage?: string; message?: string } | null;
    const apiMessage = errorBody?.message;
    const fallback = errorBody?.statusMessage;
    const message =
      apiMessage && !apiMessage.includes("<")
        ? apiMessage
        : fallback === "invalid_input"
          ? "Enter a valid message or link and try again."
          : fallback === "rate_limited"
            ? "Too many checks in a short period. Please wait a few minutes."
            : "The check could not be completed. Please try again.";
    throw new ScamCheckError(message, response.status);
  }

  return body as ScamCheckResult;
}
