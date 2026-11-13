import { supabase } from "@/integrations/supabase/client";
import type { Lang } from "@/i18n/translations";
import { cacheAudio, getCachedAudio } from "@/lib/speechCache";

const inFlight = new Map<string, Promise<Blob>>();
let providerUnavailable = false;

async function requestSpeech(text: string, language: Lang): Promise<Blob> {
  const { data, error } = await supabase.functions.invoke("speak-text", {
    body: { text, language },
  });

  if (error || data?.error || typeof data?.audioBase64 !== "string") {
    throw new Error(data?.error ?? "SPEECH_UNAVAILABLE");
  }

  const binary = atob(data.audioBase64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: data.contentType ?? "audio/mpeg" });
}

export async function getSpeechAudio(value: string, language: Lang): Promise<Blob> {
  const text = value.replace(/\s+/g, " ").trim().slice(0, 800);
  if (!text) throw new Error("INVALID_TEXT");

  const key = `${language}:${text}`;
  const cached = await getCachedAudio(key);
  if (cached) return cached;

  const pending = inFlight.get(key);
  if (pending) return pending;
  if (providerUnavailable) throw new Error("SPEECH_NOT_CONFIGURED");

  const request = (async () => {
    try {
      const blob = await requestSpeech(text, language);
      await cacheAudio(key, blob);
      return blob;
    } catch (error) {
      if (error instanceof Error && error.message === "SPEECH_NOT_CONFIGURED") {
        providerUnavailable = true;
      }
      throw error;
    }
  })();

  inFlight.set(key, request);
  try {
    return await request;
  } finally {
    inFlight.delete(key);
  }
}

export async function preloadSpeech(texts: string[], language: Lang): Promise<void> {
  const uniqueTexts = Array.from(
    new Set(texts.map((text) => text.replace(/\s+/g, " ").trim()).filter(Boolean)),
  );

  for (const text of uniqueTexts) {
    try {
      await getSpeechAudio(text, language);
    } catch {
      // One unavailable section should not cause a burst of further paid requests.
      break;
    }
  }
}
