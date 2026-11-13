import { defineHandler } from "nitro";
import { useRuntimeConfig } from "nitro/runtime-config";
import { createError, readBody, setResponseHeader } from "nitro/h3";
import { z } from "zod";
import type { ScamCheckResult, UrlInspection } from "../../../src/lib/scamCheck";
import { analyseMessage, extractUrls } from "../../lib/scam-message";
import {
  analyseUrlStructure,
  inspectLiveWebsite,
  parseWebUrl,
  resolvePublicHostname,
} from "../../lib/scam-url";
import {
  checkSafeBrowsing,
  checkTrustpilot,
  checkVirusTotal,
  safeBrowsingNotRequested,
  trustpilotNotRequested,
  virusTotalNotRequested,
} from "../../lib/scam-reputation";
import { getClientIp, isRateLimited } from "../../lib/security";

const requestSchema = z.object({
  mode: z.enum(["message", "link"]),
  input: z.string().trim().min(1).max(12_000),
  options: z.object({
    liveWebsite: z.boolean(),
    trustpilot: z.boolean(),
    safeBrowsing: z.boolean(),
    virusTotal: z.boolean(),
  }),
});

const MAX_LINKS_PER_MESSAGE = 5;

function buildNextSteps(result: Pick<ScamCheckResult, "risk" | "findings" | "links">): string[] {
  if (result.risk === "high") {
    const steps = [
      "Stop: do not click, reply, pay or share a password, PIN or one-time code.",
      "Contact the organisation through its official app or a phone number you find independently—not one in the message.",
    ];
    if (result.findings.some((finding) => finding.id === "secret_request" || finding.id === "payment_request")) {
      steps.push("If you already paid or shared financial details, contact your bank or service provider immediately through an official channel.");
    } else {
      steps.push("If you already interacted, ask someone you trust to help you secure the affected account from a known official app or website.");
    }
    return steps;
  }

  if (result.risk === "medium") {
    return [
      "Pause before acting, especially if the message sets a deadline or asks for information.",
      "Verify the request through a separately sourced official app, website or phone number—not the contact details supplied here.",
      "Ask a trusted person for a second opinion before paying, signing in or sharing information.",
    ];
  }

  const steps = [
    "No strong signal is not proof of legitimacy. Stay cautious with unexpected requests and new domains.",
    "Confirm important requests through the organisation's official app or an independently sourced contact channel.",
  ];
  if (result.links.some((link) => link.dns.status === "failed")) {
    steps.push("The domain did not resolve during this check. Treat it as unverified, not as safe or definitely malicious.");
  } else {
    steps.push("Never share one-time codes, passwords or card security codes in response to an unsolicited request.");
  }
  return steps;
}

export default defineHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  if (isRateLimited(`scam-check:${getClientIp(event)}`, 20, 10 * 60 * 1000)) {
    throw createError({
      statusCode: 429,
      statusMessage: "rate_limited",
      message: "Too many checks in a short period. Please wait a few minutes and try again.",
    });
  }

  let rawBody: unknown;
  try {
    rawBody = await readBody(event);
  } catch {
    throw createError({ statusCode: 400, statusMessage: "invalid_input", message: "The request body is not valid JSON." });
  }
  const parsed = requestSchema.safeParse(rawBody);
  if (!parsed.success || (parsed.data.mode === "link" && parsed.data.input.length > 2048)) {
    throw createError({
      statusCode: 400,
      statusMessage: "invalid_input",
      message: "Enter a message of up to 12,000 characters or a link of up to 2,048 characters.",
    });
  }

  const { mode, input, options } = parsed.data;
  if (mode === "link") {
    try {
      parseWebUrl(input);
    } catch {
      throw createError({
        statusCode: 400,
        statusMessage: "invalid_input",
        message: "Enter a complete web address, such as example.com or https://example.com/page.",
      });
    }
  }

  const config = useRuntimeConfig();
  const messageAnalysis = mode === "message"
    ? analyseMessage(input)
    : { findings: [], score: 0 };
  const rawUrls = mode === "link" ? [input] : extractUrls(input);
  const selectedUrls = rawUrls.slice(0, MAX_LINKS_PER_MESSAGE);

  const links = await Promise.all(
    selectedUrls.map(async (rawUrl): Promise<UrlInspection> => {
      let structure: ReturnType<typeof analyseUrlStructure>;
      try {
        structure = analyseUrlStructure(rawUrl);
      } catch {
        throw createError({
          statusCode: 400,
          statusMessage: "invalid_input",
          message: `One of the extracted links is not a valid web address: ${rawUrl.slice(0, 120)}`,
        });
      }

      const hostname = structure.url.hostname.toLowerCase().replace(/\.$/, "");
      const [dns, website, trustpilot, safeBrowsing, virusTotal] = await Promise.all([
        resolvePublicHostname(hostname),
        options.liveWebsite
          ? inspectLiveWebsite(structure.url)
          : Promise.resolve({
              status: "not_requested" as const,
              message: "The optional live website request was turned off.",
            }),
        options.trustpilot
          ? checkTrustpilot(hostname, config.trustpilotApiKey)
          : Promise.resolve(trustpilotNotRequested(hostname)),
        options.safeBrowsing
          ? checkSafeBrowsing(structure.url.href, config.googleSafeBrowsingApiKey)
          : Promise.resolve(safeBrowsingNotRequested()),
        options.virusTotal
          ? checkVirusTotal(hostname, config.virusTotalApiKey)
          : Promise.resolve(virusTotalNotRequested()),
      ]);

      const googleFlag = safeBrowsing.status === "threat_detected";
      const virusTotalFlag = virusTotal.status === "flagged";
      const score = googleFlag
        ? 100
        : Math.min(100, structure.score + (virusTotalFlag ? 70 : 0));

      return {
        input: rawUrl,
        normalizedUrl: structure.url.href,
        hostname,
        score,
        signals: structure.signals,
        dns,
        website,
        trustpilot,
        safeBrowsing,
        virusTotal,
      };
    }),
  );

  const maximumLinkScore = links.reduce((maximum, link) => Math.max(maximum, link.score), 0);
  const externalFlagCount = links.reduce(
    (total, link) =>
      total +
      Number(link.safeBrowsing.status === "threat_detected") +
      Number(link.virusTotal.status === "flagged"),
    0,
  );
  const score = mode === "message"
    ? Math.min(100, Math.round(messageAnalysis.score + Math.min(35, maximumLinkScore / 2)))
    : maximumLinkScore;
  const risk = externalFlagCount > 0 || score >= 55 ? "high" : score >= 15 ? "medium" : "low";
  const partial = { risk, findings: messageAnalysis.findings, links } as const;

  return {
    mode,
    checkedAt: new Date().toISOString(),
    risk,
    score,
    messageScore: messageAnalysis.score,
    findings: messageAnalysis.findings,
    links,
    omittedLinkCount: Math.max(0, rawUrls.length - selectedUrls.length),
    externalFlagCount,
    steps: buildNextSteps(partial),
  } satisfies ScamCheckResult;
});
