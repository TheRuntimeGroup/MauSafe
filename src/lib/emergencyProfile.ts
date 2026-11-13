export interface EmergencyProfile {
  fullName: string;
  bloodType: string;
  allergies: string;
  conditions: string;
  medications: string;
  notes: string;
  contactName: string;
  contactPhone: string;
}

const STORAGE_KEY = "mausafe.emergencyProfile";

export const EMPTY_EMERGENCY_PROFILE: EmergencyProfile = {
  fullName: "",
  bloodType: "unknown",
  allergies: "",
  conditions: "",
  medications: "",
  notes: "",
  contactName: "",
  contactPhone: "",
};

export function loadEmergencyProfile(): EmergencyProfile {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Record<string, unknown> | null;
    if (!parsed) return EMPTY_EMERGENCY_PROFILE;
    return Object.fromEntries(
      Object.keys(EMPTY_EMERGENCY_PROFILE).map((key) => [
        key,
        typeof parsed[key] === "string" ? parsed[key] : EMPTY_EMERGENCY_PROFILE[key as keyof EmergencyProfile],
      ]),
    ) as unknown as EmergencyProfile;
  } catch {
    return EMPTY_EMERGENCY_PROFILE;
  }
}

export function saveEmergencyProfile(profile: EmergencyProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}
