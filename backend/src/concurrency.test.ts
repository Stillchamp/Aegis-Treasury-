import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { parseXrpToDrops } from "./amounts.js";
import { createDb } from "./db.js";
import { seedDefaults } from "./seed.js";

const testDir = path.resolve("data", "tests");
const dbFiles: string[] = [];

interface WorkerOutput {
  code: number | null;
  json: { status: string; reason?: string; idempotent?: boolean; amountXrp?: string } | undefined;
  stderr: string;
}

function newDb(): string {
  const file = path.join(testDir, `${crypto.randomBytes(6).toString("hex")}.db`);
  dbFiles.push(file);
  const db = createDb(file);
  seedDefaults(db);
  db.close();
  return file;
}

function runWorker(dbPath: string, invoiceId: string, amountXrp: string, startAtMs: number): Promise<WorkerOutput> {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      ["--import", "tsx", "src/test-support/submit-worker.ts", dbPath, invoiceId, "apex-auto-parts", amountXrp, String(startAtMs)],
      { cwd: path.resolve("."), stdio: ["ignore", "pipe", "pipe"] },
    );
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => {
      const line = out.trim().split("\n").filter(Boolean).pop();
      resolve({ code, json: line ? JSON.parse(line) : undefined, stderr: err });
    });
  });
}

beforeAll(() => fs.mkdirSync(testDir, { recursive: true }));
afterAll(() => {
  for (const f of dbFiles) for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(f + suffix, { force: true });
});

describe("multi-process payments", () => {
  it("A: three workers, distinct invoices, 20 XRP each -> 2 approved, 1 daily-limit rejection", async () => {
    const file = newDb();
    const startAt = Date.now() + 1500;
    const results = await Promise.all(["P-A1", "P-A2", "P-A3"].map((id) => runWorker(file, id, "20", startAt)));
    console.log("Test A workers:", results.map((r) => ({ status: r.json?.status, reason: r.json?.reason, idempotent: r.json?.idempotent })));
    expect(results.map((r) => r.code)).toEqual([0, 0, 0]);
    const approved = results.filter((r) => r.json?.status === "approved");
    const rejected = results.filter((r) => r.json?.status === "rejected");
    expect(approved.length).toBe(2);
    expect(rejected.length).toBe(1);
    expect(rejected[0]?.json?.reason).toBe("exceeds_daily_limit");
    const total = approved.reduce((s, r) => s + parseXrpToDrops(r.json!.amountXrp!), 0n);
    expect(total <= 50_000_000n).toBe(true);
  }, 60_000);

  it("B: three workers, same invoice and amount -> one row, no duplicate approval", async () => {
    const file = newDb();
    const startAt = Date.now() + 1500;
    const results = await Promise.all([0, 1, 2].map(() => runWorker(file, "P-B1", "12", startAt)));
    console.log("Test B workers:", results.map((r) => ({ status: r.json?.status, reason: r.json?.reason, idempotent: r.json?.idempotent })));
    expect(results.map((r) => r.code)).toEqual([0, 0, 0]);
    for (const r of results) {
      const ok = r.json?.status === "lock_busy" || (r.json?.status === "approved" && (r.json.idempotent === true || r.json.idempotent === false));
      expect(ok).toBe(true);
    }
    const fresh = results.filter((r) => r.json?.status === "approved" && r.json.idempotent === false);
    expect(fresh.length).toBeLessThanOrEqual(1);
    const db = createDb(file);
    const rows = db.prepare("SELECT COUNT(*) AS n FROM payment_requests WHERE invoice_id = 'P-B1'").get() as { n: number };
    const decisions = db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE event_type = 'payment.decision'").get() as { n: number };
    db.close();
    expect(rows.n).toBe(1);
    expect(decisions.n).toBe(1);
  }, 60_000);
});
