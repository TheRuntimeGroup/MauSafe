import { supabase } from "@/integrations/supabase/client";
import type { Lang } from "@/i18n/translations";

export type AiVerdict = "likely_scam" | "suspicious" | "uncertain" | "no_obvious_scam";
export type AiRisk = "low" | "medium" | "high";

export interface AiAssessment {
  verdict: AiVerdict;
  confidence: number | null;
  score: number;
  risk: AiRisk;
  summary: string;
  reasons: string[];
  actions: string[];
  model: string;
}

interface AiAssessmentInput {
  text: string;
  language: Lang;
  type: "message" | "link";
  technical: unknown;
}

export async function getAiAssessment(input: AiAssessmentInput): Promise<AiAssessment> {
  const { data, error } = await supabase.functions.invoke("ai-scam-check", {
    body: input,
  });

  if (error || data?.error || !data?.assessment) {
    throw new Error(data?.error ?? "AI_UNAVAILABLE");
  }

  return data.assessment as AiAssessment;
}
