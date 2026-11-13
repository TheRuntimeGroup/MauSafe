import { supabase } from "@/integrations/supabase/client";
import type { Lang } from "@/i18n/translations";

export async function synthesizeSpeech(text: string, language: Lang): Promise<Blob> {
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
