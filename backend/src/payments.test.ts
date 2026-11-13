import { beforeEach, describe, expect, it } from "vitest";
import { createDb, type Db } from "./db.js";
import { submitPaymentRequest } from "./payments.js";
import { seedDefaults } from "./seed.js";

const V = "apex-auto-parts";
let db: Db;
const submit = (invoiceId: string, amountXrp: string, vendorId = V) =>
  submitPaymentRequest(db, { invoiceId, vendorId, amountXrp });
const decisionCount = () =>
  (db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE event_type = 'payment.decision'").get() as { n: number }).n;

beforeEach(() => {
  db = createDb(":memory:");
  seedDefaults(db);
});

describe("submitPaymentRequest", () => {
  it("approves 12 XRP", () => {
    expect(submit("INV-1", "12")).toMatchObject({ status: "approved", reason: "within_limits", idempotent: false });
  });

  it("rejects 35 XRP over the per-payment limit", () => {
    expect(submit("INV-1", "35")).toMatchObject({ status: "rejected", reason: "exceeds_per_payment_limit" });
  });

  it.each(["0", "-1", "1e3", "1.1234567", "abc", ""])("rejects invalid amount %j", (a) => {
    expect(submit("INV-X", a)).toMatchObject({ status: "rejected", reason: "invalid_amount" });
  });

  it("is idempotent for the same invoice", () => {
    const first = submit("INV-1", "12");
    const before = decisionCount();
    const second = submit("INV-1", "12");
    expect(second).toMatchObject({ status: first.status, idempotent: true });
    expect(decisionCount()).toBe(before);
    expect((db.prepare("SELECT COUNT(*) AS n FROM payment_requests").get() as { n: number }).n).toBe(1);
  });

  it("returns conflict for the same invoice with a different amount", () => {
    submit("INV-1", "12");
    expect(submit("INV-1", "13")).toMatchObject({ status: "conflict" });
    expect(
      (db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE event_type = 'payment.conflict'").get() as { n: number }).n,
    ).toBe(1);
  });

  it("enforces the daily limit", () => {
    // Per-payment limit is 20 and daily limit is 50.
    // Four payments of 12 XRP = 48 XRP, all within 50. The fifth would make 60 > 50.
    for (let i = 1; i <= 4; i++) {
      expect(submit(`INV-${i}`, "12").status).toBe("approved");
    }
    expect(submit("INV-5", "12")).toMatchObject({ status: "rejected", reason: "exceeds_daily_limit" });
  });

  it("never approves more than the daily limit across many requests", () => {
    // Six distinct invoices of 12 XRP: 4 x 12 = 48 <= 50 approved, the last 2 would exceed 50.
    const results = [];
    for (let i = 1; i <= 6; i++) results.push(submit(`INV-C${i}`, "12"));
    const approved = results.filter((r) => r.status === "approved");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(approved.length).toBe(4);
    expect(rejected.length).toBe(2);
    expect(rejected.every((r) => r.reason === "exceeds_daily_limit")).toBe(true);
    expect(approved.length * 12).toBeLessThanOrEqual(50);
  });

  it("rejects an unknown vendor", () => {
    expect(submit("INV-1", "12", "nobody")).toMatchObject({ status: "rejected", reason: "unknown_or_inactive_vendor" });
  });

  it("stores an unknown-vendor refusal and replays it idempotently", () => {
    const first = submit("INV-G", "12", "ghost-supplier");
    const decisions = decisionCount();
    const second = submit("INV-G", "12", "ghost-supplier");
    expect(first).toMatchObject({ status: "rejected", reason: "unknown_or_inactive_vendor", idempotent: false });
    expect(second).toMatchObject({ status: "rejected", reason: "unknown_or_inactive_vendor", idempotent: true });
    expect(decisionCount()).toBe(decisions);
    expect((db.prepare("SELECT COUNT(*) AS n FROM rejected_requests").get() as { n: number }).n).toBe(1);
    expect(submit("INV-G", "13", "ghost-supplier").status).toBe("conflict");
  });

  it("keeps uncertain/executing amounts reserved and excludes failed", () => {
    expect(submit("R1", "20").status).toBe("approved");
    expect(submit("R2", "20").status).toBe("approved");
    db.prepare("UPDATE payment_requests SET status = 'uncertain' WHERE invoice_id = 'R2'").run();
    expect(submit("R3", "20")).toMatchObject({ status: "rejected", reason: "exceeds_daily_limit" }); // 40 + 20 > 50
    db.prepare("UPDATE payment_requests SET status = 'failed' WHERE invoice_id = 'R2'").run();
    expect(submit("R4", "20").status).toBe("approved"); // 20 + 20 = 40 <= 50
  });

  it("uses the policy row to decide", () => {
    expect(submit("INV-1", "35").status).toBe("rejected");
    db.prepare("UPDATE spending_policy SET max_per_payment_xrp = '40' WHERE id = 1").run();
    expect(submit("INV-2", "35")).toMatchObject({ status: "approved" });
  });
});
