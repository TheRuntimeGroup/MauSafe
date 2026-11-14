import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

export interface JourneyRow {
  id: string;
  owner_secret_hash: string;
  owner_name: string;
  preset: string;
  label: string;
  expected_arrival_at: number;
  created_at: number;
  updated_at: number;
  arrived_at: number | null;
  cancelled_at: number | null;
  last_status_at: number;
  extended_count: number;
  is_demo: number;
  guest_token: string;
  guest_expires_at: number;
  guest_revoked_at: number | null;
  contact_info: string;
  journey_kind: "standard" | "child";
  child_auth_id: string | null;
  location_enabled: number;
  location_consent_at: number | null;
  latitude: number | null;
  longitude: number | null;
  location_accuracy: number | null;
  location_updated_at: number | null;
}

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dataDir = join(process.cwd(), ".data");
  mkdirSync(dataDir, { recursive: true });

  db = new Database(join(dataDir, "anou.db"));
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS journeys (
      id TEXT PRIMARY KEY,
      owner_secret_hash TEXT NOT NULL,
      owner_name TEXT NOT NULL DEFAULT '',
      preset TEXT NOT NULL,
      label TEXT NOT NULL DEFAULT '',
      expected_arrival_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      arrived_at INTEGER,
      cancelled_at INTEGER,
      last_status_at INTEGER NOT NULL,
      extended_count INTEGER NOT NULL DEFAULT 0,
      is_demo INTEGER NOT NULL DEFAULT 0,
      guest_token TEXT NOT NULL UNIQUE,
      guest_expires_at INTEGER NOT NULL,
      guest_revoked_at INTEGER,
      contact_info TEXT NOT NULL DEFAULT '',
      journey_kind TEXT NOT NULL DEFAULT 'standard',
      location_enabled INTEGER NOT NULL DEFAULT 0,
      location_consent_at INTEGER,
      latitude REAL,
      longitude REAL,
      location_accuracy REAL,
      location_updated_at INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_journeys_owner ON journeys (owner_secret_hash);
    CREATE INDEX IF NOT EXISTS idx_journeys_guest ON journeys (guest_token);
  `);

  const columns = db.prepare("PRAGMA table_info(journeys)").all() as { name: string }[];
  const additions: Record<string, string> = {
    journey_kind: "TEXT NOT NULL DEFAULT 'standard'",
    child_auth_id: "TEXT",
    location_enabled: "INTEGER NOT NULL DEFAULT 0",
    location_consent_at: "INTEGER",
    latitude: "REAL",
    longitude: "REAL",
    location_accuracy: "REAL",
    location_updated_at: "INTEGER",
  };
  for (const [name, definition] of Object.entries(additions)) {
    if (!columns.some((column) => column.name === name)) {
      db.exec(`ALTER TABLE journeys ADD COLUMN ${name} ${definition}`);
    }
  }

  return db;
}
