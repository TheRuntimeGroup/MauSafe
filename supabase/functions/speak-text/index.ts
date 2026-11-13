import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Cache-Control": "no-store",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY") ?? "";
const ELEVENLABS_VOICE_EN = Deno.env.get("ELEVENLABS_VOICE_EN") ?? "EXAVITQu4vr4xnSDxMaL";
const ELEVENLABS_VOICE_FR = Deno.env.get("ELEVENLABS_VOICE_FR") ?? "";
const MAX_CHARACTERS = 800;
const MAX_REQUESTS_PER_HOUR = 30;

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function encodeAudio(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 8192;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

type SharedVoice = {
  voice_id: string;
  name?: string;
  gender?: string;
  language?: string;
  accent?: string;
  category?: string;
  description?: string;
  descriptive?: string;
  use_case?: string;
};

let cachedFrenchVoiceId: string | undefined;

async function getFrenchFemaleVoiceId(): Promise<string> {
  if (ELEVENLABS_VOICE_FR) return ELEVENLABS_VOICE_FR;
  if (cachedFrenchVoiceId) return cachedFrenchVoiceId;

  const url = new URL("https://api.elevenlabs.io/v1/shared-voices");
  url.searchParams.set("language", "fr");
  url.searchParams.set("gender", "female");
  url.searchParams.set("sort", "usage");
  url.searchParams.set("page_size", "25");

  const response = await fetch(url, {
    headers: { "xi-api-key": ELEVENLABS_API_KEY },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error("[speak-text] failed to find a native French female voice", response.status, detail);
    throw new Error("FRENCH_VOICE_LOOKUP_FAILED");
  }

  const payload = await response.json();
  const voices = Array.isArray(payload?.voices) ? payload.voices as SharedVoice[] : [];
  const frenchVoices = voices.filter((voice) =>
    voice.gender?.toLowerCase() === "female"
    && /^fr(?:-|$)/i.test(voice.language ?? ""));
  const professionalVoices = frenchVoices.filter((voice) =>
    /professional|high_quality/.test(voice.category?.toLowerCase() ?? ""));
  const candidates = professionalVoices.length > 0 ? professionalVoices : frenchVoices;

  function naturalVoiceScore(candidate: SharedVoice): number {
    const metadata = `${candidate.language ?? ""} ${candidate.accent ?? ""} ${candidate.category ?? ""} ${candidate.description ?? ""} ${candidate.descriptive ?? ""} ${candidate.use_case ?? ""}`.toLowerCase();
    let score = 0;
    if (/fr-fr|france|paris/.test(metadata)) score += 60;
    if (/professional/.test(metadata)) score += 100;
    if (/high_quality/.test(metadata)) score += 80;
    if (/natural|conversational|narration|documentary|audiobook|podcast|warm|calm/.test(metadata)) score += 35;
    if (/generated|robot|anime|cartoon|character|video game|whisper|seductive|dramatic|child/.test(metadata)) score -= 90;
    return score;
  }

  const voice = candidates.sort((a, b) => naturalVoiceScore(b) - naturalVoiceScore(a))[0];

  if (!voice?.voice_id) {
    throw new Error("No French female voice with a French locale was returned");
  }

  cachedFrenchVoiceId = voice.voice_id;
  console.log("[speak-text] selected French female voice", {
    name: voice.name,
    language: voice.language,
    accent: voice.accent,
  });
  return cachedFrenchVoiceId;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  }

  try {
    const body = await req.json();
    const text = String(body?.text ?? "").replace(/\s+/g, " ").trim();
    const language = body?.language === "fr" ? "fr" : "en";

    if (!text || text.length > MAX_CHARACTERS) {
      return json({ error: "INVALID_TEXT" });
    }
    if (!ELEVENLABS_API_KEY) {
      console.error("[speak-text] ElevenLabs API key is not configured");
      return json({ error: "SPEECH_NOT_CONFIGURED" });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const requestIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "unknown";
    const requestIpHash = await sha256Hex(`speech-request:${SUPABASE_SERVICE_ROLE_KEY}:${requestIp}`);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count, error: limitError } = await supabase
      .from("speech_requests")
      .select("id", { count: "exact", head: true })
      .eq("request_ip_hash", requestIpHash)
      .gte("created_at", oneHourAgo);

    if (limitError) {
      console.error("[speak-text] failed to check request limits", limitError);
      return json({ error: "SPEECH_UNAVAILABLE" });
    }
    if ((count ?? 0) >= MAX_REQUESTS_PER_HOUR) {
      return json({ error: "RATE_LIMITED" });
    }

    const { data: requestRecord, error: insertError } = await supabase
      .from("speech_requests")
      .insert({ request_ip_hash: requestIpHash, character_count: text.length })
      .select("id")
      .single();

    if (insertError) {
      console.error("[speak-text] failed to record speech request", insertError);
      return json({ error: "SPEECH_UNAVAILABLE" });
    }

    let voiceId: string;
    try {
      voiceId = language === "fr" ? await getFrenchFemaleVoiceId() : ELEVENLABS_VOICE_EN;
    } catch (error) {
      await supabase.from("speech_requests").delete().eq("id", requestRecord.id);
      console.error("[speak-text] French voice selection failed", error);
      return json({ error: "SPEECH_UNAVAILABLE" });
    }

    let response: Response;
    try {
      response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
        method: "POST",
        signal: AbortSignal.timeout(20000),
        headers: {
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: language === "fr" ? "eleven_v3" : "eleven_multilingual_v2",
          language_code: language,
          voice_settings: language === "fr"
            ? { stability: 0.5, similarity_boost: 0.8 }
            : {
                stability: 0.52,
                similarity_boost: 0.82,
                style: 0.12,
                use_speaker_boost: true,
              },
        }),
      });
    } catch (error) {
      await supabase.from("speech_requests").delete().eq("id", requestRecord.id);
      console.error("[speak-text] ElevenLabs request could not be completed", error);
      return json({ error: "SPEECH_UNAVAILABLE" });
    }

    if (!response.ok) {
      const detail = await response.text();
      await supabase.from("speech_requests").delete().eq("id", requestRecord.id);
      console.error("[speak-text] ElevenLabs request failed", response.status, detail);
      return json({ error: "SPEECH_UNAVAILABLE" });
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    return json({ ok: true, audioBase64: encodeAudio(bytes), contentType: "audio/mpeg" });
  } catch (error) {
    console.error("[speak-text] unexpected error", error);
    return json({ error: "SPEECH_UNAVAILABLE" });
  }
});
