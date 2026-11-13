import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import type http from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { hashToken } from "./cfo-auth.js";
import { createDb, type Db } from "./db.js";
import { submitPaymentRequest } from "./payments.js";
import { seedDefaults } from "./seed.js";
import { SimulatedSigner } from "./signer.simulated.js";
import { runSimulationOnce } from "./worker.js";

const V = "apex-auto-parts";
const agentToken = crypto.randomBytes(16).toString("hex");
const testDir = path.resolve("data", "tests");
const dbFiles: string[] = [];
const servers: http.Server[] = [];

beforeAll(() => fs.mkdirSync(testDir, { recursive: true }));
afterAll(async () => {
  for (const f of dbFiles) for (const s of ["", "-wal", "-shm"]) fs.rmSync(f + s, { force: true });
  await Promise.all(servers.map((s) => new Promise((r) => s.close(r))));
});

function freshDb(): Db {
  const db = createDb(":memory:");
  seedDefaults(db);
  return db;
}
const approve = (db: Db, id: string, amt = "12", vendor = V) =>
  submitPaymentRequest(db, { invoiceId: id, vendorId: vendor, amountXrp: amt });

async function getPayment(db: Db, id: string) {
  const server = createApp(db, undefined, hashToken(agentToken)).listen(0, "127.0.0.1");
  servers.push(server);
  await new Promise<void>((r) => server.once("listening", () => r()));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const res = await fetch(`${base}/payments/${id}`, { headers: { "x-agent-token": agentToken } });
  return { status: res.status, body: (await res.json()) as Record<string, unknown>, base };
}

describe("simulated worker", () => {
  it("executes an approved invoice: executed, SIM- reference, simulated mode, no txHash field", async () => {
    const db = freshDb();
    approve(db, "W1");
    await runSimulationOnce(db, "w");
    const { body } = await getPayment(db, "W1");
    expect(body).toMatchObject({ status: "executed", executionMode: "simulated" });
    expect((body.txRef as string).startsWith("SIM-")).toBe(true);
    expect(JSON.stringify(body)).not.toMatch(/txHash|tx_hash/);
  });

  it("running twice keeps the signer submit count at 1", async () => {
    const db = freshDb();
    approve(db, "W2");
    const signer = new SimulatedSigner();
    await runSimulationOnce(db, "w", { signer });
    await runSimulationOnce(db, "w", { signer });
    expect(signer.submitCalls).toBe(1);
    expect((db.prepare("SELECT COUNT(*) AS n FROM payment_attempts").get() as { n: number }).n).toBe(1);
  });

  it("never claims rejected or unknown-vendor invoices", async () => {
    const db = freshDb();
    approve(db, "R1", "35"); // over the per-payment limit
    approve(db, "R2", "12", "ghost-supplier");
    const signer = new SimulatedSigner();
    const out = await runSimulationOnce(db, "w", { signer });
    expect(out).toEqual([]);
    expect(signer.submitCalls).toBe(0);
    expect((db.prepare("SELECT COUNT(*) AS n FROM payment_attempts").get() as { n: number }).n).toBe(0);
    const { body } = await getPayment(db, "R1");
    expect(body).toMatchObject({ status: "rejected", executionMode: "none", txRef: null });
  });

  it("leaves uncertain invoices alone", async () => {
    const db = freshDb();
    approve(db, "U1");
    db.prepare("UPDATE payment_requests SET status = 'uncertain' WHERE invoice_id = 'U1'").run();
    const signer = new SimulatedSigner();
    expect(await runSimulationOnce(db, "w", { signer })).toEqual([]);
    expect(signer.submitCalls).toBe(0);
  });

  it("no HTTP route can trigger execution", async () => {
    const db = freshDb();
    approve(db, "H1");
    const { base } = await getPayment(db, "H1");
    for (const p of ["/payments/H1/execute", "/execute"]) {
      const res = await fetch(base + p, { method: "POST", headers: { "x-agent-token": agentToken } });
      expect(res.status).toBe(404);
    }
    expect((db.prepare("SELECT status FROM payment_requests WHERE invoice_id = 'H1'").get() as { status: string }).status).toBe("approved");
  });
});

function run(args: string[], env: NodeJS.ProcessEnv): Promise<{ code: number | null; out: string; err: string }> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["--import", "tsx", ...args], { cwd: path.resolve("."), env, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => resolve({ code, out, err }));
  });
}

describe("worker processes", () => {
  it("two processes, same approved invoice: exactly one attempt row", async () => {
    const file = path.join(testDir, `${crypto.randomBytes(6).toString("hex")}.db`);
    dbFiles.push(file);
    const db = createDb(file);
    seedDefaults(db);
    approve(db, "M1");
    db.close();

    const startAt = Date.now() + 1500;
    const results = await Promise.all(
      ["wa", "wb"].map((id) => run(["src/test-support/worker-runner.ts", file, id, String(startAt)], process.env)),
    );
    expect(results.map((r) => r.code)).toEqual([0, 0]);

    const check = createDb(file);
    const attempts = check.prepare("SELECT COUNT(*) AS n FROM payment_attempts WHERE invoice_id = 'M1'").get() as { n: number };
    const status = check.prepare("SELECT status FROM payment_requests WHERE invoice_id = 'M1'").get() as { status: string };
    check.close();
    expect(attempts.n).toBe(1);
    expect(status.status).toBe("executed");
  }, 60_000);

  it("CLI exits non-zero when AEGIS_EXECUTION_MODE is unset", async () => {
    const env = { ...process.env, AEGIS_DB_PATH: path.join(testDir, "cli-unused.db") };
    delete env.AEGIS_EXECUTION_MODE;
    const r = await run(["src/worker.ts", "--once"], env);
    expect(r.code).not.toBe(0);
    expect(r.err).toContain("Real execution is not implemented. Set AEGIS_EXECUTION_MODE=simulation.");
    expect(fs.existsSync(path.join(testDir, "cli-unused.db"))).toBe(false);
  }, 60_000);
});
