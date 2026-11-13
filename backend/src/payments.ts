import { formatDropsToXrp, InvalidAmountError, parseXrpToDrops } from "./amounts.js";
import type { Db } from "./db.js";
import { evaluatePayment, type PaymentInput } from "./policy.js";

export type PaymentResult =
  | {
      invoiceId: string;
      status: "approved" | "rejected";
      reason: string;
      amountXrp: string;
      idempotent: boolean;
    }
  | {
      invoiceId: string;
      status: "conflict";
      reason: "invoice_exists_with_different_details";
      amountXrp: string;
      idempotent: false;
    };

interface StoredRequest {
  id: string;
  invoice_id: string;
  vendor_id: string;
  amount_xrp: string;
  status: string;
  reason: string | null;
}

function sameAmount(a: string, b: string): boolean {
  try {
    return parseXrpToDrops(a) === parseXrpToDrops(b);
  } catch (e) {
    if (e instanceof InvalidAmountError) return a === b;
    throw e;
  }
}

function canonicalAmount(raw: string): string {
  try {
    return formatDropsToXrp(parseXrpToDrops(raw));
  } catch (e) {
    if (e instanceof InvalidAmountError) return raw;
    throw e;
  }
}

export function submitPaymentRequest(db: Db, input: PaymentInput, now: Date = new Date()): PaymentResult {
  return db.transaction((): PaymentResult => {
    const nowIso = now.toISOString();
    const audit = (eventType: string, payload: object): void => {
      db.prepare(
        "INSERT INTO audit_log (event_type, actor, payload, created_at) VALUES (?, 'agent', ?, ?)",
      ).run(eventType, JSON.stringify(payload), nowIso);
    };

    const existing = db
      .prepare("SELECT id, invoice_id, vendor_id, amount_xrp, status, reason FROM payment_requests WHERE invoice_id = ?")
      .get(input.invoiceId) as StoredRequest | undefined;

    if (existing) {
      if (existing.vendor_id === input.vendorId && sameAmount(existing.amount_xrp, input.amountXrp)) {
        return {
          invoiceId: existing.invoice_id,
          status: existing.status as "approved" | "rejected",
          reason: existing.reason ?? "",
          amountXrp: existing.amount_xrp,
          idempotent: true,
        };
      }
      audit("payment.conflict", {
        invoice: input.invoiceId,
        existing: { vendor: existing.vendor_id, amount: existing.amount_xrp },
        attempted: { vendor: input.vendorId, amount: input.amountXrp },
      });
      return {
        invoiceId: input.invoiceId,
        status: "conflict",
        reason: "invoice_exists_with_different_details",
        amountXrp: existing.amount_xrp,
        idempotent: false,
      };
    }

    const policyRow = db
      .prepare("SELECT max_per_payment_xrp, max_per_day_xrp FROM spending_policy WHERE id = 1")
      .get() as { max_per_payment_xrp: string; max_per_day_xrp: string } | undefined;
    if (!policyRow) throw new Error("spending_policy row (id = 1) is missing");

    const vendorRow = db
      .prepare("SELECT vendor_id, active FROM approved_vendors WHERE vendor_id = ?")
      .get(input.vendorId) as { vendor_id: string; active: number } | undefined;

    const today = nowIso.slice(0, 10);
    const approvedRows = db
      .prepare("SELECT amount_xrp FROM payment_requests WHERE status = 'approved' AND created_at LIKE ?")
      .all(`${today}%`) as { amount_xrp: string }[];
    let approvedTodayDrops = 0n;
    for (const r of approvedRows) approvedTodayDrops += parseXrpToDrops(r.amount_xrp);

    const result = evaluatePayment(input, {
      policy: { maxPerPaymentXrp: policyRow.max_per_payment_xrp, maxPerDayXrp: policyRow.max_per_day_xrp },
      vendor: vendorRow ? { vendorId: vendorRow.vendor_id, active: vendorRow.active === 1 } : undefined,
      approvedTodayDrops,
      now,
    });

    const amountXrp = canonicalAmount(input.amountXrp);

    // payment_requests.vendor_id has a foreign key to approved_vendors, so a request
    // for an unknown vendor cannot be stored; the rejection is recorded in audit_log only.
    if (vendorRow) {
      db.prepare(
        `INSERT INTO payment_requests
           (id, invoice_id, vendor_id, amount_xrp, status, reason, tx_hash, execution_mode, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?)`,
      ).run(crypto.randomUUID(), input.invoiceId, input.vendorId, amountXrp, result.decision, result.reason, nowIso);
    }

    audit("payment.decision", {
      invoice: input.invoiceId,
      vendor: input.vendorId,
      amount: input.amountXrp,
      decision: result.decision,
      reason: result.reason,
    });

    return {
      invoiceId: input.invoiceId,
      status: result.decision,
      reason: result.reason,
      amountXrp,
      idempotent: false,
    };
  }).immediate();
}
