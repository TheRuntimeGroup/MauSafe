import { randomUUID } from "node:crypto";
import { getDb, type JourneyRow } from "./db";

export const GUEST_LINK_TTL_MS = 48 * 60 * 60 * 1000;
export const PRESETS = ["going_home", "taking_the_bus", "meeting_someone"] as const;
export type Preset = (typeof PRESETS)[number];
export type JourneyKind = "standard" | "child";
export type JourneyStatus = "on_the_way" | "arrived" | "overdue" | "cancelled";

export interface CreateJourneyInput {
  ownerSecretHash: string;
  ownerName: string;
  preset: Preset;
  label: string;
  expectedArrivalAt: number;
  isDemo: boolean;
  guestToken: string;
  guestExpiresAt: number;
  contact: string;
  journeyKind: JourneyKind;
  childAuthId?: string | null;
  locationEnabled: boolean;
}

export function computeStatus(row: JourneyRow, now = Date.now()): JourneyStatus {
  if (row.cancelled_at) return "cancelled";
  if (row.arrived_at) return "arrived";
  if (now > row.expected_arrival_at) return "overdue";
  return "on_the_way";
}

export function toGuestView(row: JourneyRow) {
  const hasLocation =
    row.location_enabled === 1 && row.latitude !== null && row.longitude !== null;
  return {
    status: computeStatus(row),
    senderName: row.owner_name,
    preset: row.preset,
    label: row.label,
    expectedArrivalAt: new Date(row.expected_arrival_at).toISOString(),
    createdAt: new Date(row.created_at).toISOString(),
    lastStatusAt: new Date(row.last_status_at).toISOString(),
    isDemo: !!row.is_demo,
    expiresAt: new Date(row.guest_expires_at).toISOString(),
    revoked: !!row.guest_revoked_at,
    journeyKind: row.journey_kind,
    locationEnabled: row.location_enabled === 1,
    location: hasLocation
      ? {
          latitude: row.latitude!,
          longitude: row.longitude!,
          accuracy: row.location_accuracy,
          updatedAt: row.location_updated_at
            ? new Date(row.location_updated_at).toISOString()
            : null,
        }
      : null,
  };
}

export function toOwnerView(row: JourneyRow) {
  return {
    ...toGuestView(row),
    id: row.id,
    contact: row.contact_info,
    extendedCount: row.extended_count,
    arrivedAt: row.arrived_at ? new Date(row.arrived_at).toISOString() : null,
    cancelledAt: row.cancelled_at ? new Date(row.cancelled_at).toISOString() : null,
    updatedAt: new Date(row.updated_at).toISOString(),
    guestToken: row.guest_token,
    guestExpiresAt: new Date(row.guest_expires_at).toISOString(),
    guestRevokedAt: row.guest_revoked_at ? new Date(row.guest_revoked_at).toISOString() : null,
    sharePath: `/j/${row.guest_token}`,
    recipientSees: toGuestView(row),
  };
}

export function createJourney(input: CreateJourneyInput): JourneyRow {
  const now = Date.now();
  const id = randomUUID();
  const db = getDb();

  db.prepare(
    `INSERT INTO journeys (
      id, owner_secret_hash, owner_name, preset, label,
      expected_arrival_at, created_at, updated_at, last_status_at,
      extended_count, is_demo, guest_token, guest_expires_at, contact_info,
      journey_kind, location_enabled, location_consent_at, child_auth_id
    ) VALUES (
      @id, @ownerSecretHash, @ownerName, @preset, @label,
      @expectedArrivalAt, @createdAt, @updatedAt, @lastStatusAt,
      0, @isDemo, @guestToken, @guestExpiresAt, @contact,
      @journeyKind, @locationEnabled, @locationConsentAt, @childAuthId
    )`,
  ).run({
    id,
    ownerSecretHash: input.ownerSecretHash,
    ownerName: input.ownerName,
    preset: input.preset,
    label: input.label,
    expectedArrivalAt: input.expectedArrivalAt,
    createdAt: now,
    updatedAt: now,
    lastStatusAt: now,
    isDemo: input.isDemo ? 1 : 0,
    guestToken: input.guestToken,
    guestExpiresAt: input.guestExpiresAt,
    contact: input.contact,
    journeyKind: input.journeyKind,
    locationEnabled: input.locationEnabled ? 1 : 0,
    locationConsentAt: input.locationEnabled ? now : null,
    childAuthId: input.childAuthId ?? null,
  });

  return getJourneyById(id)!;
}

export function getJourneyById(id: string): JourneyRow | null {
  return (getDb().prepare("SELECT * FROM journeys WHERE id = ?").get(id) as JourneyRow) || null;
}

export function getJourneyByToken(token: string): JourneyRow | null {
  return (
    (getDb().prepare("SELECT * FROM journeys WHERE guest_token = ?").get(token) as JourneyRow) || null
  );
}

export function listJourneysByOwner(ownerSecretHash: string): JourneyRow[] {
  return getDb()
    .prepare("SELECT * FROM journeys WHERE owner_secret_hash = ? ORDER BY created_at DESC")
    .all(ownerSecretHash) as JourneyRow[];
}

export function updateJourneyLocation(
  id: string,
  latitude: number,
  longitude: number,
  accuracy: number | null,
): JourneyRow | null {
  const now = Date.now();
  getDb()
    .prepare(
      "UPDATE journeys SET latitude = ?, longitude = ?, location_accuracy = ?, location_updated_at = ?, updated_at = ? WHERE id = ?",
    )
    .run(latitude, longitude, accuracy, now, now, id);
  return getJourneyById(id);
}

export function disableJourneyLocation(id: string): JourneyRow | null {
  const now = Date.now();
  getDb()
    .prepare(
      "UPDATE journeys SET location_enabled = 0, latitude = NULL, longitude = NULL, location_accuracy = NULL, location_updated_at = NULL, updated_at = ? WHERE id = ?",
    )
    .run(now, id);
  return getJourneyById(id);
}

export function markArrived(id: string): JourneyRow | null {
  disableJourneyLocation(id);
  const now = Date.now();
  getDb()
    .prepare(
      "UPDATE journeys SET arrived_at = COALESCE(arrived_at, ?), cancelled_at = NULL, updated_at = ?, last_status_at = ? WHERE id = ?",
    )
    .run(now, now, now, id);
  return getJourneyById(id);
}

export function extendJourney(id: string, additionalMinutes: number): JourneyRow | null {
  const row = getJourneyById(id);
  if (!row) return null;
  const newExpected = Math.max(Date.now(), row.expected_arrival_at) + additionalMinutes * 60_000;
  const now = Date.now();
  getDb()
    .prepare(
      "UPDATE journeys SET expected_arrival_at = ?, extended_count = extended_count + 1, updated_at = ?, last_status_at = ? WHERE id = ?",
    )
    .run(newExpected, now, now, id);
  return getJourneyById(id);
}

export function cancelJourney(id: string): JourneyRow | null {
  disableJourneyLocation(id);
  const now = Date.now();
  getDb()
    .prepare(
      "UPDATE journeys SET cancelled_at = COALESCE(cancelled_at, ?), updated_at = ?, last_status_at = ? WHERE id = ?",
    )
    .run(now, now, now, id);
  return getJourneyById(id);
}

export function revokeJourney(id: string): JourneyRow | null {
  disableJourneyLocation(id);
  const now = Date.now();
  getDb()
    .prepare(
      "UPDATE journeys SET guest_revoked_at = COALESCE(guest_revoked_at, ?), updated_at = ? WHERE id = ?",
    )
    .run(now, now, id);
  return getJourneyById(id);
}
