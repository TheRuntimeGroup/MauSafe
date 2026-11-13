import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const NAME_PATTERN = /^[\p{L}\p{M}]+(?:[ .'’\-][\p{L}\p{M}]+)*$/u;
const BLOCKED_WORDS = new Set([
  "admin",
  "administrator",
  "anonymous",
  "mausafe",
  "official",
  "support",
  "test",
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "cunt",
  "putain",
  "connard",
  "salope",
]);

function json(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function hasLocalIssue(name: string): boolean {
  const searchable = name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
  const words = searchable.split(/[^a-z]+/).filter(Boolean);
  return name.length < 2
    || name.length > 60
    || !NAME_PATTERN.test(name)
    || words.some((word) => BLOCKED_WORDS.has(word));
}

async function moderateWithAi(name: string): Promise<boolean | null> {
  if (!OPENAI_API_KEY) return null;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(8000),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 30,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You moderate personal names during account onboarding. Return JSON {\"allowed\":boolean}. Allow genuine and unusual international names, initials, apostrophes, and hyphens. Reject emails, phone numbers, URLs, sentences, advertisements, role/account labels, impersonation, random keyboard strings, profanity, slurs, sexual content, hateful content, and abusive text. Do not reject a name merely because it is unfamiliar.",
        },
        { role: "user", content: JSON.stringify({ candidateName: name }) },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("[validate-name] AI moderation request failed", response.status, detail);
    return null;
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") return null;
  const verdict = JSON.parse(content);
  return typeof verdict.allowed === "boolean" ? verdict.allowed : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const name = String(body?.name ?? "").trim().replace(/\s+/g, " ");

    if (hasLocalIssue(name)) {
      return json({ ok: true, allowed: false, source: "rules" });
    }

    try {
      const aiVerdict = await moderateWithAi(name);
      if (aiVerdict !== null) {
        return json({ ok: true, allowed: aiVerdict, source: "ai" });
      }
    } catch (error) {
      console.error("[validate-name] AI moderation unavailable; using local rules", error);
    }

    return json({ ok: true, allowed: true, source: "rules" });
  } catch (error) {
    console.error("[validate-name] invalid request", error);
    return json({ error: "INVALID_REQUEST" });
  }
});
