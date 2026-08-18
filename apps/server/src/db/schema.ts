import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "trailwrapped.db");

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

export const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sport TEXT NOT NULL DEFAULT 'unknown',
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration_seconds REAL NOT NULL,
    distance_meters REAL NOT NULL DEFAULT 0,
    elevation_gain_meters REAL NOT NULL DEFAULT 0,
    elevation_loss_meters REAL NOT NULL DEFAULT 0,
    avg_pace_seconds_per_km REAL,
    max_pace_seconds_per_km REAL,
    source_type TEXT NOT NULL,
    source_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS strava_tokens (
    athlete_id INTEGER PRIMARY KEY,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );
`);
