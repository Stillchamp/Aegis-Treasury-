import crypto from "node:crypto";
import type { AddressInfo } from "node:net";
import type http from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { hashToken } from "./cfo-auth.js";
import { createDb } from "./db.js";
import { seedDefaults } from "./seed.js";

const rand = () => crypto.randomBytes(16).toString("hex");
const token = rand();
const agentToken = rand();
const servers: http.Server[] = [];

async function start(cfoHash: string | undefined, agentHash: string | undefined): Promise<string> {
  const db = createDb(":memory:");
  seedDefaults(db);
  const server = createApp(db, cfoHash, agentHash).listen(0, "127.0.0.1");
  servers.push(server);
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

const call = (base: string, method: string, path: string, body?: unknown, headers: Record<string, string> = {}) =>
  fetch(base + path, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const CFO = () => ({ "x-cfo-token": token });
const AGENT = () => ({ "x-agent-token": agentToken });
const pay = (base: string, body: unknown, headers: Record<string, string> = AGENT()) =>
  call(base, "POST", "/payments", body, headers);

let base: string;
let noTokenBase: string;

beforeAll(async () => {
  base = await start(hashToken(token), hashToken(agentToken));
  noTokenBase = await start(undefined, undefined);
});

afterAll(async () => {
  await Promise.all(servers.map((s) => new Promise((r) => s.close(r))));
});

describe("HTTP API", () => {
  it("GET /health is public", async () => {
    const res = await call(base, "GET", "/health");
    expect(await res.json()).toEqual({ status: "ok", service: "aegis-treasury-backend" });
  });

  it("GET /policy is public and returns seeded limits", async () => {
    const body = await (await call(base, "GET", "/policy")).json();
    expect(body).toMatchObject({ maxPerPaymentXrp: "20", maxPerDayXrp: "50" });
  });

  it("PUT /policy without header -> 401, wrong token -> 403, bad amount -> 400", async () => {
    const body = { maxPerPaymentXrp: "40", maxPerDayXrp: "50" };
    expect((await call(base, "PUT", "/policy", body)).status).toBe(401);
    expect((await call(base, "PUT", "/policy", body, { "x-cfo-token": rand() })).status).toBe(403);
    const bad = await call(base, "PUT", "/policy", { maxPerPaymentXrp: "abc", maxPerDayXrp: "50" }, CFO());
    expect(bad.status).toBe(400);
  });

  it("policy change and payments flow", async () => {
    const vendor = "apex-auto-parts";
    // Before the change a 35 XRP payment is over the per-payment limit of 20.
    const before = await pay(base, { invoiceId: "INV-0", vendorId: vendor, amountXrp: "35" });
    expect((await before.json()).reason).toBe("exceeds_per_payment_limit");

    const put = await call(base, "PUT", "/policy", { maxPerPaymentXrp: "40", maxPerDayXrp: "50" }, CFO());
    expect(put.status).toBe(200);
    expect((await put.json()).maxPerPaymentXrp).toBe("40");
    expect((await (await call(base, "GET", "/policy")).json()).maxPerPaymentXrp).toBe("40");

    const big = await pay(base, { invoiceId: "INV-1", vendorId: vendor, amountXrp: "35" });
    expect(big.status).toBe(200);
    expect((await big.json()).status).toBe("approved");

    // 35 + 12 = 47 <= 50 daily limit.
    const p2 = { invoiceId: "INV-2", vendorId: vendor, amountXrp: "12" };
    expect((await (await pay(base, p2)).json()).idempotent).toBe(false);
    expect(await (await pay(base, p2)).json()).toMatchObject({ status: "approved", idempotent: true });
    expect((await pay(base, { ...p2, amountXrp: "13" })).status).toBe(409);

    const bad = await pay(base, { invoiceId: "INV-3", vendorId: vendor, amountXrp: "-1" });
    expect(bad.status).toBe(200);
    expect(await bad.json()).toMatchObject({ status: "rejected", reason: "invalid_amount" });

    const row = await (await call(base, "GET", "/payments/INV-1", undefined, AGENT())).json();
    expect(row).toMatchObject({ status: "approved", executionMode: "none", txRef: null });
    expect((await call(base, "GET", "/payments/NOPE", undefined, AGENT())).status).toBe(404);

    const audit = (await (await call(base, "GET", "/audit", undefined, CFO())).json()) as { event_type: string }[];
    expect(audit.filter((e) => e.event_type === "payment.decision").length).toBe(4); // the INV-2 replay added none
    expect(audit.some((e) => e.event_type === "policy.updated")).toBe(true);
  });

  it("invalid POST /payments body -> 400", async () => {
    expect((await pay(base, { invoiceId: "", vendorId: "x", amountXrp: "1" })).status).toBe(400);
  });
});

describe("route protection", () => {
  const body = { invoiceId: "P-1", vendorId: "apex-auto-parts", amountXrp: "1" };

  it("POST /payments: 401 missing, 403 wrong, 403 with the CFO token, 503 unconfigured", async () => {
    expect((await pay(base, body, {})).status).toBe(401);
    expect((await pay(base, body, { "x-agent-token": rand() })).status).toBe(403);
    expect((await pay(base, body, CFO())).status).toBe(401); // CFO token is not an agent token
    const res = await pay(noTokenBase, body, AGENT());
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "agent_token_not_configured" });
  });

  it("GET /payments/:id: 401 missing, 403 wrong, 200/404 with agent or CFO token, 503 unconfigured", async () => {
    expect((await call(base, "GET", "/payments/X")).status).toBe(401);
    expect((await call(base, "GET", "/payments/X", undefined, { "x-agent-token": rand() })).status).toBe(403);
    expect((await call(base, "GET", "/payments/X", undefined, { "x-cfo-token": rand() })).status).toBe(403);
    expect((await call(base, "GET", "/payments/X", undefined, AGENT())).status).toBe(404);
    expect((await call(base, "GET", "/payments/X", undefined, CFO())).status).toBe(404);
    expect((await call(noTokenBase, "GET", "/payments/X", undefined, AGENT())).status).toBe(503);
  });

  it("GET /audit: CFO token only", async () => {
    expect((await call(base, "GET", "/audit")).status).toBe(401);
    expect((await call(base, "GET", "/audit", undefined, { "x-cfo-token": rand() })).status).toBe(403);
    expect((await call(base, "GET", "/audit", undefined, AGENT())).status).toBe(401);
    expect((await call(base, "GET", "/audit", undefined, CFO())).status).toBe(200);
    expect((await call(noTokenBase, "GET", "/audit", undefined, CFO())).status).toBe(503);
  });

  it("PUT /policy with no configured token -> 503", async () => {
    const res = await call(noTokenBase, "PUT", "/policy", { maxPerPaymentXrp: "40", maxPerDayXrp: "50" }, { "x-cfo-token": rand() });
    expect(res.status).toBe(503);
  });

  it("never echoes a token in responses", async () => {
    const res = await call(base, "GET", "/audit", undefined, { "x-cfo-token": agentToken });
    const text = await res.text();
    expect(text.includes(agentToken) || text.includes(token)).toBe(false);
  });
});
