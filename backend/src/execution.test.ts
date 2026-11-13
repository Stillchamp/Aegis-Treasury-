import { beforeEach, describe, expect, it } from "vitest";
import { createDb, type Db } from "./db.js";
import {
  claimApproved,
  expireLeases,
  explicitResubmit,
  markValidated,
  markUncertain,
  reconcile,
  ResubmitRefusedError,
  runPayment,
  StaleFencingError,
} from "./execution.js";
import { submitPaymentRequest } from "./payments.js";
import { seedDefaults } from "./seed.js";
import { FakeSigner } from "./signer.fake.js";

const V = "apex-auto-parts";
const NOW = new Date("2026-03-01T10:00:00Z");
let db: Db;
const approve = (id: string, amt = "20") => submitPaymentRequest(db, { invoiceId: id, vendorId: V, amountXrp: amt }, NOW);
const status = (id: string) =>
  (db.prepare("SELECT status FROM payment_requests WHERE invoice_id = ?").get(id) as { status: string }).status;

beforeEach(() => {
  db = createDb(":memory:");
  seedDefaults(db);
});

describe("execution lifecycle (simulated)", () => {
  it("two claims on the same approved invoice: exactly one wins", () => {
    approve("E1");
    const a = claimApproved(db, "E1", "w1", 60_000, NOW);
    const b = claimApproved(db, "E1", "w2", 60_000, NOW);
    expect(a).not.toBeNull();
    expect(b).toBeNull();
    expect(a?.fencingToken).toBe(1);
    expect(a?.executionMode).toBe("simulated");
    expect(status("E1")).toBe("executing");
  });

  it("stale worker: claim refused after markUncertain, old fencing token cannot mark validated", () => {
    approve("E2");
    const a = claimApproved(db, "E2", "w1", 60_000, NOW)!;
    markUncertain(db, a.attemptId, a.fencingToken, "timeout", NOW);
    expect(claimApproved(db, "E2", "w2", 60_000, NOW)).toBeNull();

    // Simulate a newer attempt existing for the invoice (fencing token 2).
    db.prepare(
      `INSERT INTO payment_attempts (attempt_id, invoice_id, worker_id, fencing_token, state, execution_mode, created_at, updated_at)
       VALUES ('newer', 'E2', 'w9', 2, 'claimed', 'simulated', ?, ?)`,
    ).run(NOW.toISOString(), NOW.toISOString());

    expect(() => markValidated(db, a.attemptId, a.fencingToken, "SIM-old", NOW)).toThrow(StaleFencingError);
    expect(status("E2")).toBe("uncertain");
  });

  it("timeout: uncertain, budget still counted, submit called exactly once", async () => {
    approve("T1");
    approve("T2");
    const signer = new FakeSigner();
    signer.setNext({ kind: "timeout" });
    const out = await runPayment(db, signer, "T1", "w1", 60_000, () => NOW);
    expect(out).toMatchObject({ claimed: true, status: "uncertain", executionMode: "simulated" });
    expect(signer.submitCalls).toBe(1);
    // 20 (uncertain) + 20 (approved) = 40 reserved; another 20 would make 60 > 50.
    expect(approve("T3")).toMatchObject({ status: "rejected", reason: "exceeds_daily_limit" });
  });

  it("ambiguous answer, then a second runPayment: no second submit, claim refused", async () => {
    approve("A1");
    const signer = new FakeSigner();
    signer.setNext({ kind: "ambiguous" });
    await runPayment(db, signer, "A1", "w1", 60_000, () => NOW);
    const second = await runPayment(db, signer, "A1", "w2", 60_000, () => NOW);
    expect(signer.submitCalls).toBe(1);
    expect(second).toMatchObject({ claimed: false, status: "uncertain" });
    expect(() => explicitResubmit(db, "A1", "w3", 60_000, NOW)).toThrow(ResubmitRefusedError);
  });

  it("failed_confirmed: status failed, budget released, a new invoice can use the amount", async () => {
    approve("F1");
    approve("F2");
    expect(approve("F3").status).toBe("rejected"); // 40 + 20 > 50 while both are reserved
    const signer = new FakeSigner();
    signer.setNext({ kind: "failed_confirmed", code: "tecUNFUNDED_SIM" });
    const out = await runPayment(db, signer, "F2", "w1", 60_000, () => NOW);
    expect(out.status).toBe("failed");
    expect(approve("F4")).toMatchObject({ status: "approved" }); // 20 + 20 = 40 <= 50
  });

  it("validated: executed with a SIM- reference, never a ledger hash", async () => {
    approve("V1");
    const signer = new FakeSigner();
    const out = await runPayment(db, signer, "V1", "w1", 60_000, () => NOW);
    expect(out.status).toBe("executed");
    expect(out.txRef?.startsWith("SIM-")).toBe(true);
    expect(reconcile(db, "V1").attempts[0]).toMatchObject({ state: "validated", executionMode: "simulated" });
  });

  it("non-SIM tx reference from a signer is treated as uncertain", async () => {
    approve("N1");
    const signer = new FakeSigner();
    signer.setNext({ kind: "validated", txRef: "ABCDEF" });
    const out = await runPayment(db, signer, "N1", "w1", 60_000, () => NOW);
    expect(out.status).toBe("uncertain");
  });

  it("lease expiry on 'claimed' goes to uncertain, not approved, and blocks new claims", () => {
    approve("L1");
    const a = claimApproved(db, "L1", "w1", 1_000, NOW)!;
    expect(expireLeases(db, new Date(NOW.getTime() + 500))).toBe(0);
    expect(expireLeases(db, new Date(NOW.getTime() + 5_000))).toBe(1);
    expect(status("L1")).toBe("uncertain");
    expect(reconcile(db, "L1").attempts[0]?.state).toBe("uncertain");
    expect(claimApproved(db, "L1", "w2", 60_000, NOW)).toBeNull();
    expect(a.attemptId).toBeTruthy();
  });
});
