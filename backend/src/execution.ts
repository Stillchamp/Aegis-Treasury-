import type { Db } from "./db.js";
import type { Signer } from "./signer.js";

export const EXECUTION_MODE = "simulated" as const;
export const SIM_PREFIX = "SIM-";

export class StaleFencingError extends Error {
  constructor(attemptId: string) {
    super(`stale fencing token for attempt ${attemptId}`);
    this.name = "StaleFencingError";
  }
}

export class ResubmitRefusedError extends Error {
  constructor(invoiceId: string, status: string | undefined) {
    super(`invoice ${invoiceId} cannot be resubmitted: status is ${status ?? "unknown"}, not approved`);
    this.name = "ResubmitRefusedError";
  }
}

export interface Attempt {
  attemptId: string;
  invoiceId: string;
  workerId: string;
  fencingToken: number;
  state: string;
  executionMode: typeof EXECUTION_MODE;
  txRef: string | null;
  leaseExpiresAt: string | null;
}

interface AttemptRow {
  attempt_id: string;
  invoice_id: string;
  worker_id: string;
  fencing_token: number;
  state: string;
  execution_mode: string;
  tx_ref: string | null;
  lease_expires_at: string | null;
}

const toAttempt = (r: AttemptRow): Attempt => ({
  attemptId: r.attempt_id,
  invoiceId: r.invoice_id,
  workerId: r.worker_id,
  fencingToken: r.fencing_token,
  state: r.state,
  executionMode: EXECUTION_MODE,
  txRef: r.tx_ref,
  leaseExpiresAt: r.lease_expires_at,
});

function audit(db: Db, eventType: string, payload: object, now: Date): void {
  db.prepare("INSERT INTO audit_log (event_type, actor, payload, created_at) VALUES (?, 'executor', ?, ?)").run(
    eventType,
    JSON.stringify(payload),
    now.toISOString(),
  );
}

/** Atomically move an 'approved' invoice to 'executing' and open a new attempt. null = claim lost. */
export function claimApproved(db: Db, invoiceId: string, workerId: string, leaseMs: number, now: Date): Attempt | null {
  return db
    .transaction((): Attempt | null => {
      const upd = db
        .prepare(
          "UPDATE payment_requests SET status = 'executing', execution_mode = ? WHERE invoice_id = ? AND status = 'approved'",
        )
        .run(EXECUTION_MODE, invoiceId);
      if (upd.changes === 0) return null;
      const max = db.prepare("SELECT MAX(fencing_token) AS m FROM payment_attempts WHERE invoice_id = ?").get(invoiceId) as {
        m: number | null;
      };
      const attemptId = crypto.randomUUID();
      const iso = now.toISOString();
      const row: AttemptRow = {
        attempt_id: attemptId,
        invoice_id: invoiceId,
        worker_id: workerId,
        fencing_token: (max.m ?? 0) + 1,
        state: "claimed",
        execution_mode: EXECUTION_MODE,
        tx_ref: null,
        lease_expires_at: new Date(now.getTime() + leaseMs).toISOString(),
      };
      db.prepare(
        `INSERT INTO payment_attempts
           (attempt_id, invoice_id, worker_id, fencing_token, state, execution_mode, tx_ref, lease_expires_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        row.attempt_id, row.invoice_id, row.worker_id, row.fencing_token, row.state,
        row.execution_mode, row.tx_ref, row.lease_expires_at, iso, iso,
      );
      audit(db, "payment.claimed", { invoice: invoiceId, worker: workerId, fencing: row.fencing_token, mode: EXECUTION_MODE }, now);
      return toAttempt(row);
    })
    .immediate();
}

/** Runs inside a transaction: verifies the token is the newest one for the invoice. */
function requireCurrent(db: Db, attemptId: string, fencing: number): AttemptRow {
  const row = db.prepare("SELECT * FROM payment_attempts WHERE attempt_id = ?").get(attemptId) as AttemptRow | undefined;
  if (!row || row.fencing_token !== fencing) throw new StaleFencingError(attemptId);
  const max = db.prepare("SELECT MAX(fencing_token) AS m FROM payment_attempts WHERE invoice_id = ?").get(row.invoice_id) as {
    m: number;
  };
  if (max.m !== fencing) throw new StaleFencingError(attemptId);
  return row;
}

function transition(
  db: Db,
  attemptId: string,
  fencing: number,
  attemptState: string,
  requestStatus: string,
  txRef: string | null,
  auditEvent: string,
  detail: object,
  now: Date,
): void {
  db.transaction(() => {
    const row = requireCurrent(db, attemptId, fencing);
    const iso = now.toISOString();
    db.prepare("UPDATE payment_attempts SET state = ?, tx_ref = COALESCE(?, tx_ref), updated_at = ? WHERE attempt_id = ?").run(
      attemptState, txRef, iso, attemptId,
    );
    db.prepare("UPDATE payment_requests SET status = ?, tx_hash = COALESCE(?, tx_hash), execution_mode = ? WHERE invoice_id = ?").run(
      requestStatus, txRef, EXECUTION_MODE, row.invoice_id,
    );
    audit(db, auditEvent, { invoice: row.invoice_id, fencing, mode: EXECUTION_MODE, ...detail }, now);
  }).immediate();
}

export function markSubmitted(db: Db, attemptId: string, fencing: number, txRef: string, now = new Date()): void {
  transition(db, attemptId, fencing, "submitted", "submitted", txRef, "payment.submitted", { txRef }, now);
}

export function markValidated(db: Db, attemptId: string, fencing: number, txRef: string, now = new Date()): void {
  transition(db, attemptId, fencing, "validated", "executed", txRef, "payment.executed", { txRef }, now);
}

/** The only path that releases budget: the daily total ignores 'failed'. */
export function markFailedConfirmed(db: Db, attemptId: string, fencing: number, code: string, now = new Date()): void {
  transition(db, attemptId, fencing, "failed_confirmed", "failed", null, "payment.failed", { code }, now);
}

/** Timeouts and ambiguous answers. Budget stays reserved; nothing retries automatically. */
export function markUncertain(db: Db, attemptId: string, fencing: number, reason: string, now = new Date()): void {
  transition(db, attemptId, fencing, "uncertain", "uncertain", null, "payment.uncertain", { reason }, now);
}

/**
 * Lease expiry turns claimed/submitted attempts into 'uncertain'. It never returns the invoice
 * to 'approved' and never authorises a new claim: a lapsed lease is not proof nothing was signed.
 */
export function expireLeases(db: Db, now: Date): number {
  return db
    .transaction((): number => {
      const iso = now.toISOString();
      const rows = db
        .prepare("SELECT attempt_id, invoice_id FROM payment_attempts WHERE state IN ('claimed','submitted') AND lease_expires_at < ?")
        .all(iso) as { attempt_id: string; invoice_id: string }[];
      for (const r of rows) {
        db.prepare("UPDATE payment_attempts SET state = 'uncertain', updated_at = ? WHERE attempt_id = ?").run(iso, r.attempt_id);
        db.prepare("UPDATE payment_requests SET status = 'uncertain' WHERE invoice_id = ? AND status IN ('executing','submitted')").run(
          r.invoice_id,
        );
        audit(db, "payment.uncertain", { invoice: r.invoice_id, reason: "lease_expired", mode: EXECUTION_MODE }, now);
      }
      return rows.length;
    })
    .immediate();
}

export interface Reconciliation {
  invoiceId: string;
  status: string | undefined;
  executionMode: typeof EXECUTION_MODE;
  attempts: Attempt[];
}

/** Read-only report. Never signs, never changes state. */
export function reconcile(db: Db, invoiceId: string): Reconciliation {
  const req = db.prepare("SELECT status FROM payment_requests WHERE invoice_id = ?").get(invoiceId) as
    | { status: string }
    | undefined;
  const attempts = db
    .prepare("SELECT * FROM payment_attempts WHERE invoice_id = ? ORDER BY fencing_token")
    .all(invoiceId) as AttemptRow[];
  return { invoiceId, status: req?.status, executionMode: EXECUTION_MODE, attempts: attempts.map(toAttempt) };
}

/** Explicit re-submission entry point. Refuses unless the invoice is still 'approved'. */
export function explicitResubmit(db: Db, invoiceId: string, workerId: string, leaseMs: number, now: Date): Attempt {
  const req = db.prepare("SELECT status FROM payment_requests WHERE invoice_id = ?").get(invoiceId) as
    | { status: string }
    | undefined;
  if (req?.status !== "approved") throw new ResubmitRefusedError(invoiceId, req?.status);
  const attempt = claimApproved(db, invoiceId, workerId, leaseMs, now);
  if (!attempt) throw new ResubmitRefusedError(invoiceId, "claimed_by_another_worker");
  return attempt;
}

export interface RunOutcome {
  invoiceId: string;
  claimed: boolean;
  status: string | undefined;
  executionMode: typeof EXECUTION_MODE;
  txRef?: string;
}

/**
 * claim -> signer.submit -> map the answer. signer.submit is only called when the claim was won.
 * timeout/ambiguous (and any signer error) become 'uncertain'; nothing is retried automatically.
 */
export async function runPayment(
  db: Db,
  signer: Signer,
  invoiceId: string,
  workerId: string,
  leaseMs: number,
  now: () => Date = () => new Date(),
): Promise<RunOutcome> {
  const attempt = claimApproved(db, invoiceId, workerId, leaseMs, now());
  if (!attempt) {
    return { invoiceId, claimed: false, status: reconcile(db, invoiceId).status, executionMode: EXECUTION_MODE };
  }
  const req = db.prepare("SELECT vendor_id, amount_xrp FROM payment_requests WHERE invoice_id = ?").get(invoiceId) as {
    vendor_id: string;
    amount_xrp: string;
  };

  let result;
  try {
    result = await signer.submit({
      invoiceId,
      vendorId: req.vendor_id,
      amountXrp: req.amount_xrp,
      attemptId: attempt.attemptId,
      fencingToken: attempt.fencingToken,
    });
  } catch {
    markUncertain(db, attempt.attemptId, attempt.fencingToken, "signer_error", now());
    return { invoiceId, claimed: true, status: "uncertain", executionMode: EXECUTION_MODE };
  }

  switch (result.kind) {
    case "validated": {
      if (!result.txRef.startsWith(SIM_PREFIX)) {
        markUncertain(db, attempt.attemptId, attempt.fencingToken, "non_simulated_tx_ref", now());
        return { invoiceId, claimed: true, status: "uncertain", executionMode: EXECUTION_MODE };
      }
      markSubmitted(db, attempt.attemptId, attempt.fencingToken, result.txRef, now());
      markValidated(db, attempt.attemptId, attempt.fencingToken, result.txRef, now());
      return { invoiceId, claimed: true, status: "executed", executionMode: EXECUTION_MODE, txRef: result.txRef };
    }
    case "failed_confirmed":
      markFailedConfirmed(db, attempt.attemptId, attempt.fencingToken, result.code, now());
      return { invoiceId, claimed: true, status: "failed", executionMode: EXECUTION_MODE };
    default:
      markUncertain(db, attempt.attemptId, attempt.fencingToken, result.kind, now());
      return { invoiceId, claimed: true, status: "uncertain", executionMode: EXECUTION_MODE };
  }
}
