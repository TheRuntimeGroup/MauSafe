import { supabase } from "@/integrations/supabase/client";

export type AccessibilityNeed = "visual" | "motor" | "none";

export interface Profile {
  id: string;
  role: string;
  full_name: string | null;
  phone: string | null;
  accessibility_needs: AccessibilityNeed[];
  voice_guide: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface OnboardingInput {
  fullName: string;
  phone: string;
  accessibilityNeeds: AccessibilityNeed[];
  voiceGuide: boolean;
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) return null;
  return data as Profile;
}

export async function saveOnboardingProfile(
  userId: string,
  input: OnboardingInput,
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      full_name: input.fullName.trim(),
      phone: input.phone.trim(),
      accessibility_needs: input.accessibilityNeeds,
      voice_guide: input.voiceGuide,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Profile;
}
