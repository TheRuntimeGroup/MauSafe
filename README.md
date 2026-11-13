# AnouSecure Moris — Scam Check

AnouSecure Moris is now a single-purpose, privacy-conscious scam-check application. The earlier SOS, journey, contacts, map, alert, emergency ID and incident-report features and their backend routes have been removed.

## What the user can do

- Paste an SMS, WhatsApp, email or social-media message for explainable warning-signal analysis.
- Paste a URL or domain directly, or let a message check extract up to five URLs automatically.
- Toggle live website inspection, Trustpilot, Google Safe Browsing and VirusTotal independently.
- See the overall warning-signal score alongside the exact message phrases, URL patterns and provider responses behind it.
- Distinguish a clean provider response from a provider that was unavailable, turned off or not configured.
- Copy a readable report, download the full JSON evidence, or reset the form for another check.
- Read practical steps for payments, exposed passwords, shared one-time codes and installed files.

The app does **not** label anything “100% legit” or “safe.” The score is a warning-signal score, not an AI confidence value, probability or guarantee.

## Verification layers

| Layer | Implementation | What the result means |
| --- | --- | --- |
| Message language | Server-side pattern rules for English, French and Mauritian Creole | Detects requests for secrets, payments, urgency, threats, prizes, secrecy and organisation claims |
| URL structure | Standard `URL` parsing plus explicit rules | Detects embedded credentials, HTTP, raw IPs, Punycode, shorteners, deep subdomains, unusual ports, long domains and selected brand/domain mismatches |
| DNS | Node DNS lookup with public-address validation | Reports resolution, failure or a blocked private/local destination |
| Live website | Timeout-limited HTTP/HTTPS request with manual redirect handling | Reports the actual HTTP response, final destination, redirect count and page title when readable |
| Trustpilot | Exact-domain public profile lookup, or Business API when configured | Reports the profile, rating and review count only when returned by Trustpilot; manual search remains available |
| Google Safe Browsing | Threat Matches API when configured | Reports only a real threat match, a real no-match response, or unavailable |
| VirusTotal | Domain report API when configured | Reports actual malicious/suspicious engine counts, no report, or unavailable |

Trustpilot reviews are contextual reputation evidence. A business profile or strong rating does not prove that a particular message came from that business. DNS success, HTTPS, an HTTP response, no Safe Browsing match and no VirusTotal flags likewise do not prove legitimacy.

## Request flow

1. `src/components/scam/ScamChecker.tsx` validates the selected mode and sends the request through `checkScam()` in `src/lib/scamCheck.ts`.
2. `POST /api/scam-check` rate-limits requests, validates the JSON body with Zod and applies input limits: 12,000 characters for messages and 2,048 for links.
3. Message analysis and up to five link inspections run on the Nitro server. Selected external checks run in parallel with bounded timeouts.
4. The endpoint returns one typed `ScamCheckResult` containing findings, source-specific states and recommended next steps.
5. `ResultsPanel.tsx` renders the evidence and exports the same returned data. There is no fabricated loading progress or provider response.

Example request body:

```json
{
  "mode": "link",
  "input": "https://example.com/login",
  "options": {
    "liveWebsite": true,
    "trustpilot": true,
    "safeBrowsing": true,
    "virusTotal": true
  }
}
```

Only `/api/scam-check` remains as an application API. The old feature endpoints have been deleted rather than hidden.

## Scoring overview

Message rule weights are added and capped at 100:

- Credential or one-time-code request: 42
- Payment or financial-detail request: 28
- Secrecy instruction: 25
- Unexpected reward: 24
- Account, legal or delivery threat: 20
- Urgency: 18
- Organisation claim without verification: 8

For messages, a capped contribution from the highest-scoring inspected link is added to the message score. For direct link checks, the link score is used. A Google Safe Browsing threat match sets that link to 100; VirusTotal flags also raise the result to high risk.

- **0–14:** no strong signals
- **15–54:** proceed with caution
- **55–100:** high-risk signals
- **Any external threat/provider flag:** high risk regardless of the numerical base score

Unavailable or disabled providers neither add points nor count as clean evidence.

## Optional provider configuration

Set these as server-side environment variables only. Never expose them through `VITE_` variables or import provider credentials into `src/`.

| Environment variable | Behaviour |
| --- | --- |
| `NITRO_TRUSTPILOT_API_KEY` | Uses Trustpilot’s Business Units API; without it, the app attempts an exact-domain public profile lookup |
| `NITRO_GOOGLE_SAFE_BROWSING_API_KEY` | Enables Google Safe Browsing threat lookups; without it, the result explicitly says not configured |
| `NITRO_VIRUSTOTAL_API_KEY` | Enables VirusTotal domain reports; without it, the result explicitly says not configured |

No API keys, user accounts or database are required for the built-in message rules, URL structure rules or DNS checks. Some public websites, including Trustpilot, may rate-limit or block automated requests; those cases appear as unavailable with a working manual-search link rather than simulated data.

## Privacy and network safeguards

- The client sends pasted content to the same-origin Nitro endpoint for the current check only; the app does not persist checks or report history.
- Message text is never forwarded to Trustpilot, Google or VirusTotal. Enabled providers receive only the URL or domain their API requires.
- Live website requests accept only HTTP/HTTPS and reject localhost, private, link-local, documentation and other non-public address ranges.
- Every redirect is revalidated. Non-web redirects and URLs with embedded credentials are not opened by the live inspector.
- External calls have seven-second timeouts; page-title extraction is size-limited.
- Responses are marked `Cache-Control: no-store`; requests are limited to 20 per client IP per ten minutes by the single-instance rate limiter.

For a multi-instance production deployment, replace the in-memory rate limiter with a shared rate-limit store. Automated checking remains heuristic and should support—not replace—independent verification through official channels.

## Main files

- `src/pages/Index.tsx` — page composition and product shell
- `src/components/scam/ScamChecker.tsx` — inputs, options and request state
- `src/components/scam/ResultsPanel.tsx` — verdict, evidence, next steps and exports
- `src/components/scam/InfoSections.tsx` — methodology and recovery guidance
- `src/lib/scamCheck.ts` — shared result contracts and browser API client
- `server/routes/api/scam-check.post.ts` — validation, orchestration, scoring and limits
- `server/lib/scam-message.ts` — multilingual message rules
- `server/lib/scam-url.ts` — URL, DNS, network safety and live response checks
- `server/lib/scam-reputation.ts` — Trustpilot, Safe Browsing and VirusTotal clients
