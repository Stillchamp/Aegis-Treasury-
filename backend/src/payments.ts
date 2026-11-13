import { formatDropsToXrp, InvalidAmountError, parseXrpToDrops } from "./amounts.js";
import type { Db } from "./db.js";
import { evaluatePayment, type PaymentInput } from "./policy.js";

export type PaymentResult =
  | {
      invoiceId: string;
      status: string; // "approved" | "rejected", or a later lifecycle status on an idempotent replay
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

/** SQLite stayed locked past busy_timeout. This is NOT a business rejection and nothing was written. */
export class LockBusyError extends Error {
  readonly code = "lock_busy";
  constructor() {
    super("database is locked");
    this.name = "LockBusyError";
  }
}

/**
 * Statuses that reserve daily budget. Rejected rows are excluded. Only 'failed'
 * (a confirmed failure) releases budget; 'uncertain' keeps it reserved.
 */
export const BUDGET_STATUSES = ["approved", "executing", "submitted", "uncertain", "executed"] as const;

interface StoredRequest {
  invoice_id: string;
  vendor_id: string;
  amount_xrp: string;
  status: string;
  reason: string | null;
}

interface StoredRejection {
  invoice_id: string;
  vendor_id: string;
  amount_xrp: string;
  reason: string;
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

function isBusy(e: unknown): boolean {
  const code = (e as { code?: unknown })?.code;
  return typeof code === "string" && code.startsWith("SQLITE_BUSY");
}

/**
 * Decide a payment request and record the decision, all inside one .immediate() transaction
 * (write lock taken at BEGIN: policy read, budget computation and insert cannot interleave
 * with another process).
 *
 * Refused invoices are final: a refused invoiceId is never silently reopened. A new
 * attempt requires a new invoiceId. Replaying the same invoice returns the stored refusal.
 */
export function submitPaymentRequest(db: Db, input: PaymentInput, now: Date = new Date()): PaymentResult {
  try {
    return db.transaction((): PaymentResult => {
      const nowIso = now.toISOString();
      const audit = (eventType: string, payload: object): void => {
        db.prepare(
          "INSERT INTO audit_log (event_type, actor, payload, created_at) VALUES (?, 'agent', ?, ?)",
        ).run(eventType, JSON.stringify(payload), nowIso);
      };

      const existing = db
        .prepare("SELECT invoice_id, vendor_id, amount_xrp, status, reason FROM payment_requests WHERE invoice_id = ?")
        .get(input.invoiceId) as StoredRequest | undefined;
      const refused = existing
        ? undefined
        : (db
            .prepare("SELECT invoice_id, vendor_id, amount_xrp, reason FROM rejected_requests WHERE invoice_id = ?")
            .get(input.invoiceId) as StoredRejection | undefined);

      const stored = existing
        ? { vendor: existing.vendor_id, amount: existing.amount_xrp, status: existing.status, reason: existing.reason ?? "" }
        : refused
          ? { vendor: refused.vendor_id, amount: refused.amount_xrp, status: "rejected", reason: refused.reason }
          : undefined;

      if (stored) {
        if (stored.vendor === input.vendorId && sameAmount(stored.amount, input.amountXrp)) {
          return {
            invoiceId: input.invoiceId,
            status: stored.status,
            reason: stored.reason,
            amountXrp: stored.amount,
            idempotent: true,
          };
        }
        audit("payment.conflict", {
          invoice: input.invoiceId,
          existing: { vendor: stored.vendor, amount: stored.amount },
          attempted: { vendor: input.vendorId, amount: input.amountXrp },
        });
        return {
          invoiceId: input.invoiceId,
          status: "conflict",
          reason: "invoice_exists_with_different_details",
          amountXrp: stored.amount,
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
      const placeholders = BUDGET_STATUSES.map(() => "?").join(",");
      const reservedRows = db
        .prepare(`SELECT amount_xrp FROM payment_requests WHERE status IN (${placeholders}) AND created_at LIKE ?`)
        .all(...BUDGET_STATUSES, `${today}%`) as { amount_xrp: string }[];
      let approvedTodayDrops = 0n;
      for (const r of reservedRows) approvedTodayDrops += parseXrpToDrops(r.amount_xrp);

      const result = evaluatePayment(input, {
        policy: { maxPerPaymentXrp: policyRow.max_per_payment_xrp, maxPerDayXrp: policyRow.max_per_day_xrp },
        vendor: vendorRow ? { vendorId: vendorRow.vendor_id, active: vendorRow.active === 1 } : undefined,
        approvedTodayDrops,
        now,
      });

      const amountXrp = canonicalAmount(input.amountXrp);
      const vendorUsable = vendorRow !== undefined && vendorRow.active === 1;

      if (vendorUsable) {
        db.prepare(
          `INSERT INTO payment_requests
             (id, invoice_id, vendor_id, amount_xrp, status, reason, tx_hash, execution_mode, created_at)
           VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?)`,
        ).run(crypto.randomUUID(), input.invoiceId, input.vendorId, amountXrp, result.decision, result.reason, nowIso);
      } else {
        // Unknown or inactive vendor: payment_requests has a foreign key on vendor_id,
        // so the refusal is stored in rejected_requests (no foreign key).
        db.prepare(
          "INSERT INTO rejected_requests (invoice_id, vendor_id, amount_xrp, reason, created_at) VALUES (?, ?, ?, ?, ?)",
        ).run(input.invoiceId, input.vendorId, amountXrp, result.reason, nowIso);
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
  } catch (e) {
    if (isBusy(e)) throw new LockBusyError();
    throw e;
  }
}
