import Database from "better-sqlite3";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

type SqliteDatabase = Database.Database;

const TOKEN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createCode(length = 6): string {
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += TOKEN_ALPHABET[bytes[i] % TOKEN_ALPHABET.length];
  }
  return code;
}

export function createId(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

export function createSecretToken(): string {
  return randomBytes(24).toString("hex");
}

function openDatabase(): SqliteDatabase {
  const dataDir = process.env.ANOUSECURE_DATA_DIR || path.join(process.cwd(), ".data");
  fs.mkdirSync(dataDir, { recursive: true });
  const database = new Database(path.join(dataDir, "anousecure.db"));
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.exec(`
    CREATE TABLE IF NOT EXISTS safe_havens (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      address TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      contact_name TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      token TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scam_watch_reports (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      district TEXT NOT NULL,
      platform TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'unverified',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS anonymous_reports (
      id TEXT PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      district TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'submitted',
      resolution TEXT,
      resolved_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS walk_mates (
      token TEXT PRIMARY KEY,
      owner_token TEXT NOT NULL UNIQUE,
      owner_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS walk_mate_participants (
      id TEXT PRIMARY KEY,
      journey_token TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      participant_token TEXT NOT NULL UNIQUE,
      latitude REAL,
      longitude REAL,
      accuracy REAL,
      updated_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_walk_mate_participants_journey
      ON walk_mate_participants (journey_token);
  `);
  return database;
}

const globalForDatabase = globalThis as unknown as { anousecureDb?: SqliteDatabase };
const database = globalForDatabase.anousecureDb ?? openDatabase();
if (process.env.NODE_ENV !== "production") {
  globalForDatabase.anousecureDb = database;
}

// ---------- Safe havens ----------

export interface SafeHavenRow {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  contact_name: string | null;
  status: string;
  token: string;
  created_at: string;
}

export function listApprovedSafeHavens(): SafeHavenRow[] {
  return database
    .prepare("SELECT * FROM safe_havens WHERE status = 'approved' ORDER BY created_at DESC")
    .all() as SafeHavenRow[];
}

export function createSafeHaven(input: {
  id: string;
  token: string;
  name: string;
  category: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  contactName: string;
}): SafeHavenRow {
  const now = new Date().toISOString();
  database
    .prepare(
      `INSERT INTO safe_havens
        (id, name, category, description, address, latitude, longitude, contact_name, status, token, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    )
    .run(
      input.id,
      input.name,
      input.category,
      input.description,
      input.address,
      input.latitude,
      input.longitude,
      input.contactName,
      input.token,
      now,
    );
  return getSafeHavenByToken(input.token) as SafeHavenRow;
}

export function getSafeHavenByToken(token: string): SafeHavenRow | undefined {
  return database.prepare("SELECT * FROM safe_havens WHERE token = ?").get(token) as SafeHavenRow | undefined;
}

// ---------- Scam watch ----------

export interface ScamWatchRow {
  id: string;
  title: string;
  description: string;
  category: string;
  district: string;
  platform: string;
  status: string;
  created_at: string;
}

export function listScamWatchReports(): ScamWatchRow[] {
  return database
    .prepare("SELECT * FROM scam_watch_reports ORDER BY created_at DESC LIMIT 100")
    .all() as ScamWatchRow[];
}

export function createScamWatchReport(input: {
  id: string;
  title: string;
  description: string;
  category: string;
  district: string;
  platform: string;
}): ScamWatchRow {
  const now = new Date().toISOString();
  database
    .prepare(
      `INSERT INTO scam_watch_reports (id, title, description, category, district, platform, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'unverified', ?)`,
    )
    .run(input.id, input.title, input.description, input.category, input.district, input.platform, now);
  return {
    id: input.id,
    title: input.title,
    description: input.description,
    category: input.category,
    district: input.district,
    platform: input.platform,
    status: "unverified",
    created_at: now,
  };
}

// ---------- Anonymous reports ----------

export interface AnonymousReportRow {
  id: string;
  token: string;
  category: string;
  title: string;
  description: string;
  district: string;
  status: string;
  resolution: string | null;
  resolved_at: string | null;
  created_at: string;
}

export function listResolvedReports(): AnonymousReportRow[] {
  return database
    .prepare(
      "SELECT * FROM anonymous_reports WHERE status = 'resolved' AND resolution IS NOT NULL ORDER BY resolved_at DESC LIMIT 100",
    )
    .all() as AnonymousReportRow[];
}

export function createAnonymousReport(input: {
  id: string;
  token: string;
  category: string;
  title: string;
  description: string;
  district: string;
}): AnonymousReportRow {
  const now = new Date().toISOString();
  database
    .prepare(
      `INSERT INTO anonymous_reports (id, token, category, title, description, district, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'submitted', ?)`,
    )
    .run(input.id, input.token, input.category, input.title, input.description, input.district, now);
  return getAnonymousReportByToken(input.token) as AnonymousReportRow;
}

export function getAnonymousReportByToken(token: string): AnonymousReportRow | undefined {
  return database.prepare("SELECT * FROM anonymous_reports WHERE token = ?").get(token) as
    | AnonymousReportRow
    | undefined;
}

export function updateAnonymousReport(
  token: string,
  update: { status?: string; resolution?: string | null },
): AnonymousReportRow | undefined {
  const existing = getAnonymousReportByToken(token);
  if (!existing) return undefined;

  const status = update.status ?? existing.status;
  const resolution = update.resolution === undefined ? existing.resolution : update.resolution;
  const resolvedAt = status === "resolved" ? existing.resolved_at ?? new Date().toISOString() : existing.resolved_at;

  database
    .prepare("UPDATE anonymous_reports SET status = ?, resolution = ?, resolved_at = ? WHERE token = ?")
    .run(status, resolution, resolvedAt, token);
  return getAnonymousReportByToken(token);
}

// ---------- Walk mate ----------

export interface WalkMateParticipantRow {
  id: string;
  journey_token: string;
  name: string;
  role: string;
  participant_token: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  updated_at: string | null;
  created_at: string;
}

export interface WalkMateRow {
  token: string;
  owner_token: string;
  owner_name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function createWalkMate(input: {
  token: string;
  ownerToken: string;
  ownerName: string;
  ownerId: string;
  ownerParticipantToken: string;
}): { journey: WalkMateRow; owner: WalkMateParticipantRow } {
  const now = new Date().toISOString();
  const journey = database
    .prepare(
      "INSERT INTO walk_mates (token, owner_token, owner_name, status, created_at, updated_at) VALUES (?, ?, ?, 'active', ?, ?)",
    )
    .run(input.token, input.ownerToken, input.ownerName, now, now);
  void journey;
  database
    .prepare(
      `INSERT INTO walk_mate_participants
        (id, journey_token, name, role, participant_token, created_at)
       VALUES (?, ?, ?, 'owner', ?, ?)`,
    )
    .run(input.ownerId, input.token, input.ownerName, input.ownerParticipantToken, now);
  return {
    journey: getWalkMateByToken(input.token) as WalkMateRow,
    owner: getParticipantByToken(input.ownerParticipantToken) as WalkMateParticipantRow,
  };
}

export function getWalkMateByToken(token: string): WalkMateRow | undefined {
  return database.prepare("SELECT * FROM walk_mates WHERE token = ?").get(token) as WalkMateRow | undefined;
}

export function getWalkMateByOwnerToken(ownerToken: string): WalkMateRow | undefined {
  return database.prepare("SELECT * FROM walk_mates WHERE owner_token = ?").get(ownerToken) as WalkMateRow | undefined;
}

export function listParticipants(journeyToken: string): WalkMateParticipantRow[] {
  return database
    .prepare("SELECT * FROM walk_mate_participants WHERE journey_token = ? ORDER BY created_at ASC")
    .all(journeyToken) as WalkMateParticipantRow[];
}

export function getParticipantByToken(participantToken: string): WalkMateParticipantRow | undefined {
  return database
    .prepare("SELECT * FROM walk_mate_participants WHERE participant_token = ?")
    .get(participantToken) as WalkMateParticipantRow | undefined;
}

export function addWalkMateParticipant(input: {
  id: string;
  journeyToken: string;
  name: string;
  participantToken: string;
}): WalkMateParticipantRow {
  const now = new Date().toISOString();
  database
    .prepare(
      `INSERT INTO walk_mate_participants (id, journey_token, name, role, participant_token, created_at)
       VALUES (?, ?, ?, 'guest', ?, ?)`,
    )
    .run(input.id, input.journeyToken, input.name, input.participantToken, now);
  database
    .prepare("UPDATE walk_mates SET updated_at = ? WHERE token = ?")
    .run(new Date().toISOString(), input.journeyToken);
  return getParticipantByToken(input.participantToken) as WalkMateParticipantRow;
}

export function updateParticipantLocation(
  participantToken: string,
  latitude: number,
  longitude: number,
  accuracy: number | null,
): WalkMateParticipantRow | undefined {
  const participant = getParticipantByToken(participantToken);
  if (!participant) return undefined;
  const now = new Date().toISOString();
  database
    .prepare(
      "UPDATE walk_mate_participants SET latitude = ?, longitude = ?, accuracy = ?, updated_at = ? WHERE participant_token = ?",
    )
    .run(latitude, longitude, accuracy, now, participantToken);
  database
    .prepare("UPDATE walk_mates SET updated_at = ? WHERE token = ?")
    .run(now, participant.journey_token);
  return getParticipantByToken(participantToken);
}

export function setWalkMateStatus(token: string, status: "arrived" | "cancelled"): WalkMateRow | undefined {
  const now = new Date().toISOString();
  database
    .prepare("UPDATE walk_mates SET status = ?, updated_at = ? WHERE token = ?")
    .run(status, now, token);
  return getWalkMateByToken(token);
}

export function expireStaleWalkMates(): void {
  const staleBefore = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  database
    .prepare("UPDATE walk_mates SET status = 'cancelled' WHERE status = 'active' AND updated_at < ?")
    .run(staleBefore);
}
