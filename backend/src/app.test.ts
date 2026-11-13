import crypto from "node:crypto";
import type { AddressInfo } from "node:net";
import type http from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { hashToken } from "./cfo-auth.js";
import { createDb } from "./db.js";
import { seedDefaults } from "./seed.js";

const token = crypto.randomBytes(16).toString("hex");
const servers: http.Server[] = [];

async function start(cfoHash: string | undefined): Promise<string> {
  const db = createDb(":memory:");
  seedDefaults(db);
  const server = createApp(db, cfoHash).listen(0, "127.0.0.1");
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

let base: string;
let noTokenBase: string;

beforeAll(async () => {
  base = await start(hashToken(token));
  noTokenBase = await start(undefined);
});

afterAll(async () => {
  await Promise.all(servers.map((s) => new Promise((r) => s.close(r))));
});

describe("HTTP API", () => {
  it("GET /health", async () => {
    const res = await call(base, "GET", "/health");
    expect(await res.json()).toEqual({ status: "ok", service: "aegis-treasury-backend" });
  });

  it("GET /policy returns seeded limits", async () => {
    const body = await (await call(base, "GET", "/policy")).json();
    expect(body).toMatchObject({ maxPerPaymentXrp: "20", maxPerDayXrp: "50" });
  });

  it("PUT /policy without header -> 401", async () => {
    const res = await call(base, "PUT", "/policy", { maxPerPaymentXrp: "40", maxPerDayXrp: "50" });
    expect(res.status).toBe(401);
  });

  it("PUT /policy with wrong token -> 403", async () => {
    const wrong = crypto.randomBytes(16).toString("hex");
    const res = await call(base, "PUT", "/policy", { maxPerPaymentXrp: "40", maxPerDayXrp: "50" }, { "x-cfo-token": wrong });
    expect(res.status).toBe(403);
  });

  it("PUT /policy with invalid amount -> 400", async () => {
    const res = await call(base, "PUT", "/policy", { maxPerPaymentXrp: "abc", maxPerDayXrp: "50" }, { "x-cfo-token": token });
    expect(res.status).toBe(400);
  });

  it("policy change and payments flow", async () => {
    // Before the change a 35 XRP payment is over the per-payment limit of 20.
    const before = await call(base, "POST", "/payments", { invoiceId: "INV-0", vendorId: "apex-auto-parts", amountXrp: "35" });
    expect((await before.json()).reason).toBe("exceeds_per_payment_limit");

    const put = await call(base, "PUT", "/policy", { maxPerPaymentXrp: "40", maxPerDayXrp: "50" }, { "x-cfo-token": token });
    expect(put.status).toBe(200);
    expect((await put.json()).maxPerPaymentXrp).toBe("40");
    expect((await (await call(base, "GET", "/policy")).json()).maxPerPaymentXrp).toBe("40");

    const big = await call(base, "POST", "/payments", { invoiceId: "INV-1", vendorId: "apex-auto-parts", amountXrp: "35" });
    expect(big.status).toBe(200);
    expect((await big.json()).status).toBe("approved");

    // 35 + 12 = 47 <= 50 daily limit.
    const pay = { invoiceId: "INV-2", vendorId: "apex-auto-parts", amountXrp: "12" };
    expect((await (await call(base, "POST", "/payments", pay)).json()).idempotent).toBe(false);
    const again = await (await call(base, "POST", "/payments", pay)).json();
    expect(again).toMatchObject({ status: "approved", idempotent: true });

    const conflict = await call(base, "POST", "/payments", { ...pay, amountXrp: "13" });
    expect(conflict.status).toBe(409);

    const bad = await call(base, "POST", "/payments", { invoiceId: "INV-3", vendorId: "apex-auto-parts", amountXrp: "-1" });
    expect(bad.status).toBe(200);
    expect(await bad.json()).toMatchObject({ status: "rejected", reason: "invalid_amount" });

    const row = await call(base, "GET", "/payments/INV-1");
    expect((await row.json()).status).toBe("approved");
    expect((await call(base, "GET", "/payments/NOPE")).status).toBe(404);

    const approvals = ((await (await call(base, "GET", "/audit")).json()) as { event_type: string }[]).filter(
      (e) => e.event_type === "payment.decision",
    );
    expect(approvals.length).toBe(4); // INV-0, INV-1, INV-2, INV-3; the repeat of INV-2 added none
  });

  it("GET /audit contains policy.updated", async () => {
    const rows = (await (await call(base, "GET", "/audit")).json()) as { event_type: string; actor: string }[];
    expect(rows.some((r) => r.event_type === "policy.updated" && r.actor === "cfo")).toBe(true);
  });

  it("rejects invalid POST /payments body with 400", async () => {
    const res = await call(base, "POST", "/payments", { invoiceId: "", vendorId: "x", amountXrp: "1" });
    expect(res.status).toBe(400);
  });

  it("PUT /policy with no configured token -> 503", async () => {
    const any = crypto.randomBytes(16).toString("hex");
    const res = await call(noTokenBase, "PUT", "/policy", { maxPerPaymentXrp: "40", maxPerDayXrp: "50" }, { "x-cfo-token": any });
    expect(res.status).toBe(503);
  });
});
