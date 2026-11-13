// SIMULATED execution worker. It never touches XRPL; results are not XRPL transactions.
import { pathToFileURL } from "node:url";
import type { Db } from "./db.js";
import { expireLeases, runPayment, type RunOutcome } from "./execution.js";
import type { Signer } from "./signer.js";
import { SimulatedSigner } from "./signer.simulated.js";

export const SIM_LABEL = "[SIMULATED - not an XRPL transaction]";

export interface WorkerOptions {
  signer?: Signer;
  leaseMs?: number;
  now?: () => Date;
}

/**
 * Expire stale leases, then run every 'approved' invoice (oldest first) through the simulated signer.
 * Rejected, uncertain, submitted and executing invoices are never touched.
 */
export async function runSimulationOnce(db: Db, workerId: string, opts: WorkerOptions = {}): Promise<RunOutcome[]> {
  const signer = opts.signer ?? new SimulatedSigner();
  const now = opts.now ?? (() => new Date());
  const leaseMs = opts.leaseMs ?? 60_000;

  expireLeases(db, now());
  const invoices = db
    .prepare("SELECT invoice_id FROM payment_requests WHERE status = 'approved' ORDER BY created_at, rowid")
    .all() as { invoice_id: string }[];

  const outcomes: RunOutcome[] = [];
  for (const { invoice_id } of invoices) {
    outcomes.push(await runPayment(db, signer, invoice_id, workerId, leaseMs, now));
  }
  return outcomes;
}

async function main(): Promise<void> {
  if (process.env.AEGIS_EXECUTION_MODE !== "simulation") {
    console.error("Real execution is not implemented. Set AEGIS_EXECUTION_MODE=simulation.");
    process.exitCode = 1;
    return;
  }
  if (!process.argv.includes("--once")) {
    console.error("Usage: worker --once");
    process.exitCode = 2;
    return;
  }
  const { getDb } = await import("./db.js");
  const outcomes = await runSimulationOnce(getDb(), `worker-${process.pid}`);
  if (outcomes.length === 0) console.log(`${SIM_LABEL} nothing approved to execute`);
  for (const o of outcomes) {
    console.log(
      `${SIM_LABEL} invoice=${o.invoiceId} claimed=${o.claimed} status=${o.status} executionMode=${o.executionMode}${
        o.txRef ? ` txRef=${o.txRef}` : ""
      }`,
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : "worker failed");
    process.exitCode = 1;
  });
}
