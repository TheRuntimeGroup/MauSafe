// Shared client types and API helpers for the community safety features.
// These mirror the Nitro route responses under server/routes/api.

export type SafeHavenCategory = "business" | "home" | "community_centre" | "place_of_worship" | "other";
export type SafeHavenStatus = "pending" | "approved" | "rejected";

export interface SafeHaven {
  id: string;
  name: string;
  category: SafeHavenCategory;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  status: SafeHavenStatus;
  createdAt: string;
}

export interface SafeHavenTracking {
  id: string;
  token: string;
  name: string;
  category: SafeHavenCategory;
  address: string;
  status: SafeHavenStatus;
  createdAt: string;
}

export type ScamWatchCategory = "sms" | "whatsapp" | "call" | "email" | "social" | "website" | "other";
export type ScamWatchStatus = "unverified" | "verified" | "resolved";

export interface ScamWatchReport {
  id: string;
  title: string;
  description: string;
  category: ScamWatchCategory;
  district: string;
  platform: string;
  status: ScamWatchStatus;
  createdAt: string;
}

export type ReportCategory =
  | "scam"
  | "fraud"
  | "cybercrime"
  | "harassment"
  | "domestic_violence"
  | "corruption"
  | "other";

export type ReportStatus = "submitted" | "in_progress" | "resolved";

export interface AnonymousReport {
  id: string;
  token: string;
  category: ReportCategory;
  title: string;
  description: string;
  district: string;
  status: ReportStatus;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface ResolvedReport {
  id: string;
  category: ReportCategory;
  title: string;
  description: string;
  district: string;
  resolution: string;
  resolvedAt: string;
}

export type WalkMateStatus = "active" | "arrived" | "cancelled";
export type WalkMateRole = "owner" | "guest";

export interface WalkMateParticipant {
  id: string;
  name: string;
  role: WalkMateRole;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  updatedAt: string | null;
}

export interface WalkMateJourney {
  token: string;
  ownerName: string;
  status: WalkMateStatus;
  createdAt: string;
  updatedAt: string;
  participants: WalkMateParticipant[];
}

export interface WalkMateSession {
  token: string;
  ownerToken?: string;
  participantToken: string;
  participantId: string;
  role: WalkMateRole;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new Error("We could not reach the server. Check your connection and try again.");
  }

  const body = (await response.json().catch(() => null)) as
    | (T & { message?: string; statusMessage?: string })
    | null;

  if (!response.ok) {
    throw new Error(body?.message || "Something went wrong. Please try again.");
  }
  return body as T;
}

function postJson<T>(url: string, payload: unknown): Promise<T> {
  return requestJson<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// Safe havens
export function listSafeHavens(): Promise<SafeHaven[]> {
  return requestJson<SafeHaven[]>("/api/safe-havens");
}

export function submitSafeHaven(input: {
  name: string;
  category: SafeHavenCategory;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  contactName: string;
  consent: boolean;
}): Promise<{ id: string; token: string; status: string; message: string }> {
  return postJson("/api/safe-havens", input);
}

export function trackSafeHaven(token: string): Promise<SafeHavenTracking> {
  return requestJson<SafeHavenTracking>(`/api/safe-havens/${encodeURIComponent(token)}`);
}

// Scam watch
export function listScamWatchReports(): Promise<ScamWatchReport[]> {
  return requestJson<ScamWatchReport[]>("/api/scam-watch");
}

export function submitScamWatchReport(input: {
  title: string;
  description: string;
  category: ScamWatchCategory;
  district: string;
  platform: string;
}): Promise<ScamWatchReport> {
  return postJson("/api/scam-watch", input);
}

// Anonymous reports
export function listResolvedReports(): Promise<ResolvedReport[]> {
  return requestJson<ResolvedReport[]>("/api/reports");
}

export function submitAnonymousReport(input: {
  category: ReportCategory;
  title: string;
  description: string;
  district: string;
  consent: boolean;
}): Promise<{ id: string; token: string; status: string; createdAt: string; message: string }> {
  return postJson("/api/reports", input);
}

export function trackAnonymousReport(token: string): Promise<AnonymousReport> {
  return requestJson<AnonymousReport>(`/api/reports/${encodeURIComponent(token)}`);
}

export function updateAnonymousReport(
  token: string,
  input: { note: string; resolved?: boolean },
): Promise<AnonymousReport> {
  return postJson(`/api/reports/${encodeURIComponent(token)}/update`, input);
}

// Walk mate
export function createWalkMate(ownerName: string): Promise<WalkMateSession & { status: string }> {
  return postJson("/api/walk-mate", { ownerName });
}

export function joinWalkMate(token: string, name: string): Promise<WalkMateSession & { status: string }> {
  return postJson(`/api/walk-mate/${encodeURIComponent(token)}/join`, { name });
}

export function getWalkMate(token: string): Promise<WalkMateJourney> {
  return requestJson<WalkMateJourney>(`/api/walk-mate/${encodeURIComponent(token)}`);
}

export function updateWalkMateLocation(
  token: string,
  input: { participantToken: string; latitude: number; longitude: number; accuracy: number | null },
): Promise<{ id: string; latitude: number | null; longitude: number | null; updatedAt: string | null }> {
  return postJson(`/api/walk-mate/${encodeURIComponent(token)}/location`, input);
}

export function endWalkMate(
  token: string,
  input: { ownerToken: string; status: "arrived" | "cancelled" },
): Promise<{ token: string; status: WalkMateStatus; updatedAt: string }> {
  return postJson(`/api/walk-mate/${encodeURIComponent(token)}/status`, input);
}
