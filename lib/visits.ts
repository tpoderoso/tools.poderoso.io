import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = process.env.VISITS_DB_PATH ?? "./data/visits.db";
// Mesmo visitante só conta de novo depois de 30 min sem visitar (igual a view de post: refresh não infla).
const DEDUPE_WINDOW_MS = 30 * 60 * 1000;

mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.exec(`
  DROP TABLE IF EXISTS visits;
  CREATE TABLE IF NOT EXISTS views (visitor TEXT PRIMARY KEY, last_seen INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY CHECK (id = 1), total INTEGER NOT NULL DEFAULT 0);
  INSERT OR IGNORE INTO counter (id, total) VALUES (1, 0);
`);

const pruneViews = db.prepare<[number]>("DELETE FROM views WHERE last_seen < ?");
const insertView = db.prepare<[string, number]>("INSERT OR IGNORE INTO views (visitor, last_seen) VALUES (?, ?)");
const touchView = db.prepare<[number, string]>("UPDATE views SET last_seen = ? WHERE visitor = ?");
const incrementTotal = db.prepare("UPDATE counter SET total = total + 1 WHERE id = 1");
const selectTotal = db.prepare<[], { total: number }>("SELECT total FROM counter WHERE id = 1");

// visitor = id anônimo do cookie, não IP: várias pessoas atrás do mesmo NAT de empresa contam separado.
export const recordVisit = db.transaction((visitor: string, now: number = Date.now()): number => {
  pruneViews.run(now - DEDUPE_WINDOW_MS);
  if (insertView.run(visitor, now).changes) incrementTotal.run();
  else touchView.run(now, visitor);
  return selectTotal.get()!.total;
});
