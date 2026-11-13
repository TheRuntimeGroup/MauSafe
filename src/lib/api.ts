import type { GuestJourney, JourneyKind, OwnerJourney, Preset, SharedLocation } from "./types";
import { ensureOwnerSecret } from "./storage";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, options);
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const body = (data ?? {}) as Record<string, unknown>;
    const code = typeof body.statusMessage === "string" ? body.statusMessage : "error";
    const message = typeof body.message === "string" ? body.message : "Request failed";
    throw new ApiError(res.status, code, message);
  }

  return data as T;
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${ensureOwnerSecret()}`,
    "Content-Type": "application/json",
  };
}

export interface CreateJourneyInput {
  preset: Preset;
  label: string;
  durationMinutes: number;
  senderName: string;
  contact: string;
  isDemo: boolean;
  journeyKind?: JourneyKind;
  locationEnabled?: boolean;
}

export interface CreateJourneyResponse {
  journey: OwnerJourney;
  ownerSecret: string | null;
  sharePath: string;
}

export function createJourney(input: CreateJourneyInput): Promise<CreateJourneyResponse> {
  return request("/api/journeys", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
}

export function listJourneys(): Promise<{ journeys: OwnerJourney[] }> {
  return request("/api/journeys", { headers: authHeaders() });
}

export function getJourney(id: string): Promise<{ journey: OwnerJourney }> {
  return request(`/api/journeys/${id}`, { headers: authHeaders() });
}

export function journeyAction(
  id: string,
  action: "arrive" | "cancel" | "revoke",
): Promise<{ journey: OwnerJourney }> {
  return request(`/api/journeys/${id}/${action}`, {
    method: "POST",
    headers: authHeaders(),
  });
}

export function extendJourney(
  id: string,
  additionalMinutes: number,
): Promise<{ journey: OwnerJourney }> {
  return request(`/api/journeys/${id}/extend`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ additionalMinutes }),
  });
}

export function getGuestJourney(token: string): Promise<{ journey: GuestJourney }> {
  return request(`/api/guest/${token}`);
}

export function updateJourneyLocation(
  id: string,
  location: Omit<SharedLocation, "updatedAt">,
): Promise<{ journey: OwnerJourney }> {
  return request(`/api/journeys/${id}/location`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(location),
  });
}

export function disableJourneyLocation(id: string): Promise<{ journey: OwnerJourney }> {
  return request(`/api/journeys/${id}/location`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}
