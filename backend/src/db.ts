import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export type Db = Database.Database;

let singleton: Db | undefined;

export function createDb(dbPath: string): Db {
  let target = dbPath;
  if (dbPath !== ":memory:") {
    target = path.resolve(dbPath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
  }
  const db = new Database(target);
  db.pragma("busy_timeout = 5000");
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS spending_policy (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      max_per_payment_xrp TEXT NOT NULL,
      max_per_day_xrp TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS approved_vendors (
      vendor_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      xrpl_address TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS payment_requests (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL UNIQUE,
      vendor_id TEXT NOT NULL REFERENCES approved_vendors(vendor_id),
      amount_xrp TEXT NOT NULL,
      status TEXT NOT NULL,
      reason TEXT,
      tx_hash TEXT,
      execution_mode TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      actor TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS payment_attempts (
      attempt_id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      worker_id TEXT NOT NULL,
      fencing_token INTEGER NOT NULL,
      state TEXT NOT NULL, -- claimed, submitted, validated, failed_confirmed, uncertain
      execution_mode TEXT NOT NULL,
      tx_ref TEXT,
      lease_expires_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (invoice_id, fencing_token)
    );
    CREATE TABLE IF NOT EXISTS rejected_requests (
      invoice_id TEXT PRIMARY KEY,
      vendor_id TEXT NOT NULL,
      amount_xrp TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  return db;
}

export function getDb(): Db {
  if (!singleton) singleton = createDb(process.env.AEGIS_DB_PATH ?? "./data/aegis.db");
  return singleton;
}
