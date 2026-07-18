import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = process.env.VISITS_DB_PATH ?? "./data/visits.db";
const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;

mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS visits (ip TEXT PRIMARY KEY, last_seen INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY CHECK (id = 1), total INTEGER NOT NULL DEFAULT 0);
  INSERT OR IGNORE INTO counter (id, total) VALUES (1, 0);
`);

const selectVisit = db.prepare<[string]>("SELECT last_seen FROM visits WHERE ip = ?");
const upsertVisit = db.prepare<[string, number]>(
  "INSERT INTO visits (ip, last_seen) VALUES (?, ?) ON CONFLICT(ip) DO UPDATE SET last_seen = excluded.last_seen"
);
const incrementTotal = db.prepare("UPDATE counter SET total = total + 1 WHERE id = 1");
const selectTotal = db.prepare<[], { total: number }>("SELECT total FROM counter WHERE id = 1");

export function recordVisit(ip: string, now = Date.now()): number {
  const row = selectVisit.get(ip) as { last_seen: number } | undefined;
  if (!row || now - row.last_seen > DEDUPE_WINDOW_MS) {
    upsertVisit.run(ip, now);
    incrementTotal.run();
  }
  return selectTotal.get()!.total;
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip")?.trim() ?? "unknown";
}
