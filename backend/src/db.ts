import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

let db: Database.Database | undefined;

export function getDb(): Database.Database {
  if (db) return db;
  const dbPath = path.resolve(process.env.AEGIS_DB_PATH ?? "./data/aegis.db");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new Database(dbPath);
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
  `);
  return db;
}
