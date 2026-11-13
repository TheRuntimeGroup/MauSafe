import { supabase } from "@/integrations/supabase/client";

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

export type NameCheckResult = {
  allowed: boolean;
  name: string;
  reason: "invalid" | "inappropriate" | null;
};

export async function checkPersonName(value: string): Promise<NameCheckResult> {
  const name = value.trim().replace(/\s+/g, " ");
  const searchable = name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

  if (name.length < 2 || name.length > 60 || !NAME_PATTERN.test(name)) {
    return { allowed: false, name, reason: "invalid" };
  }

  const words = searchable.split(/[^a-z]+/).filter(Boolean);
  if (words.some((word) => BLOCKED_WORDS.has(word))) {
    return { allowed: false, name, reason: "inappropriate" };
  }

  try {
    const { data, error } = await supabase.functions.invoke("validate-name", {
      body: { name },
    });
    if (error || data?.error || typeof data?.allowed !== "boolean") {
      return { allowed: true, name, reason: null };
    }
    return {
      allowed: data.allowed,
      name,
      reason: data.allowed ? null : "inappropriate",
    };
  } catch {
    // Local name checks still apply when remote moderation is unavailable.
    return { allowed: true, name, reason: null };
  }
}
