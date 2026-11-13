// Local SIMULATION scenario. No XRPL, no network beyond 127.0.0.1. Run from backend/.
import crypto from "node:crypto";
import fs from "node:fs";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { createApp } from "../app.js";
import { hashToken } from "../cfo-auth.js";
import { createDb } from "../db.js";
import { seedDefaults } from "../seed.js";
import { runSimulationOnce, SIM_LABEL } from "../worker.js";

try {
  process.loadEnvFile(".env");
} catch {
  // no .env: fall back to ephemeral tokens below
}
const cfoToken = process.env.CFO_TOKEN || crypto.randomBytes(16).toString("hex");
const agentToken = process.env.AGENT_TOKEN || crypto.randomBytes(16).toString("hex");

const dbFile = path.resolve("data", "demo.db");
for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(dbFile + suffix, { force: true });
const db = createDb(dbFile);
seedDefaults(db);

const server = createApp(db, hashToken(cfoToken), hashToken(agentToken)).listen(0, "127.0.0.1");
await new Promise<void>((r) => server.once("listening", () => r()));
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

async function call(method: string, p: string, body?: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(base + p, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, json: (await res.json().catch(() => null)) as Record<string, unknown> | null };
}
const agent = { "x-agent-token": agentToken };
const cfo = { "x-cfo-token": cfoToken };
const pay = (invoiceId: string, vendorId: string, amountXrp: string) =>
  call("POST", "/payments", { invoiceId, vendorId, amountXrp }, agent);
const setPolicy = (maxPerPaymentXrp: string, headers: Record<string, string>) =>
  call("PUT", "/policy", { maxPerPaymentXrp, maxPerDayXrp: "50" }, headers);

async function runAndShow(label: string): Promise<number> {
  const out = await runSimulationOnce(db, "demo-worker");
  const names = out.map((o) => ` [${o.invoiceId} -> ${o.status}]`).join("");
  console.log(`   ${SIM_LABEL} ${label}: ${out.length} invoice(s) executed${names}`);
  return out.length;
}

async function showPayment(id: string): Promise<Record<string, unknown> | null> {
  const r = await call("GET", `/payments/${id}`, undefined, agent);
  console.log(
    `   ${SIM_LABEL} GET /payments/${id}: HTTP ${r.status} status=${r.json?.status} executionMode=${r.json?.executionMode} txRef=${r.json?.txRef}`,
  );
  return r.json;
}

const attemptCount = (id: string): number =>
  (db.prepare("SELECT COUNT(*) AS n FROM payment_attempts WHERE invoice_id = ?").get(id) as { n: number }).n;

let failures = 0;
function step(n: number | string,label: string, ok: boolean, detail: string): void {
  if (!ok) failures += 1;
  console.log(`${n}. ${label} -> ${detail} ${ok ? "[OK]" : "[UNEXPECTED]"}`);
}

console.log("Aegis Treasury demo: SIMULATION ONLY. No XRPL call, no real funds, no signing.");
console.log(`Tokens: CFO from ${process.env.CFO_TOKEN ? ".env" : "ephemeral"}, agent from ${process.env.AGENT_TOKEN ? ".env" : "ephemeral"} (values never printed).`);

const V = "apex-auto-parts";
let r = await pay("DEMO-1", V, "12");
step(1, "[SIMULATED] 12 XRP to apex-auto-parts", r.status === 200 && r.json?.status === "approved", `HTTP ${r.status} ${r.json?.status} (${r.json?.reason})`);

r = await pay("DEMO-2", V, "35");
step(2, "[SIMULATED] 35 XRP to apex-auto-parts", r.json?.status === "rejected" && r.json?.reason === "exceeds_per_payment_limit", `HTTP ${r.status} ${r.json?.status} (${r.json?.reason})`);

const executedFirst = await runAndShow("worker pass after step 1");
const p1 = await showPayment("DEMO-1");
step(
  "1b",
  "[SIMULATED] worker executes the approved payment",
  executedFirst === 1 && p1?.status === "executed" && p1?.executionMode === "simulated" && String(p1?.txRef).startsWith("SIM-"),
  `status=${p1?.status} executionMode=${p1?.executionMode} txRef=${p1?.txRef}`,
);

const decisionsBefore = (db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE event_type = 'payment.decision'").get() as { n: number }).n;
r = await pay("DEMO-1", V, "12");
const decisionsAfter = (db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE event_type = 'payment.decision'").get() as { n: number }).n;
step(3, "[SIMULATED] same invoice as step 1 again", r.json?.idempotent === true && decisionsAfter === decisionsBefore, `HTTP ${r.status} idempotent=${r.json?.idempotent}, new decisions=${decisionsAfter - decisionsBefore}`);

const executedAgain = await runAndShow("worker pass after the 35 XRP rejection and the replay");
step(
  "3b",
  "[SIMULATED] nothing new executes",
  executedAgain === 0 && attemptCount("DEMO-1") === 1 && attemptCount("DEMO-2") === 0,
  `invoices executed=${executedAgain}, attempts DEMO-1=${attemptCount("DEMO-1")}, DEMO-2=${attemptCount("DEMO-2")}`,
);

const g1 = await pay("DEMO-GHOST", "ghost-supplier", "5");
const g2 = await pay("DEMO-GHOST", "ghost-supplier", "5");
step(
  4,
  "[SIMULATED] unknown vendor ghost-supplier, same invoice twice",
  g1.json?.status === "rejected" && g2.json?.status === "rejected" && g1.json?.reason === g2.json?.reason && g2.json?.idempotent === true,
  `1st: ${g1.json?.status} (${g1.json?.reason}) idempotent=${g1.json?.idempotent}; 2nd: ${g2.json?.status} (${g2.json?.reason}) idempotent=${g2.json?.idempotent}`,
);

const noTok = await setPolicy("40", {});
const wrongTok = await setPolicy("40", { "x-cfo-token": crypto.randomBytes(16).toString("hex") });
step(5, "PUT /policy without CFO token, then with a wrong one", noTok.status === 401 && wrongTok.status === 403, `HTTP ${noTok.status} and HTTP ${wrongTok.status}`);

const up = await setPolicy("40", cfo);
r = await pay("DEMO-3", V, "35");
const reset = await setPolicy("20", cfo);
step(
  6,
  "[SIMULATED] CFO raises limit to 40, pays 35 XRP, resets limit to 20",
  up.status === 200 && r.json?.status === "approved" && reset.status === 200 && reset.json?.maxPerPaymentXrp === "20",
  `PUT ${up.status}, payment ${r.json?.status} (${r.json?.reason}), reset PUT ${reset.status} limit=${reset.json?.maxPerPaymentXrp}`,
);

await new Promise((res) => server.close(res));
db.close();
console.log(failures === 0 ? "All steps behaved as expected (simulation)." : `${failures} step(s) UNEXPECTED.`);
process.exitCode = failures === 0 ? 0 : 1;
