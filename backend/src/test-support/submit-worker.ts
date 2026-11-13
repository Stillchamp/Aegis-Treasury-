// Test helper: runs one submitPaymentRequest in its own process against a shared database file.
// argv: dbPath invoiceId vendorId amountXrp startAtMs
import { createDb } from "../db.js";
import { LockBusyError, submitPaymentRequest } from "../payments.js";

const [dbPath, invoiceId, vendorId, amountXrp, startAtMs] = process.argv.slice(2);
if (!dbPath || !invoiceId || !vendorId || !amountXrp || !startAtMs) {
  console.error("usage: submit-worker <dbPath> <invoiceId> <vendorId> <amountXrp> <startAtMs>");
  process.exit(2);
}

const db = createDb(dbPath);
while (Date.now() < Number(startAtMs)) {
  // busy-wait so all workers hit the database at the same moment
}

try {
  const result = submitPaymentRequest(db, { invoiceId, vendorId, amountXrp });
  console.log(JSON.stringify(result));
} catch (e) {
  if (e instanceof LockBusyError) {
    console.log(JSON.stringify({ status: "lock_busy", invoiceId }));
  } else {
    console.error(e instanceof Error ? e.message : "unknown error");
    db.close();
    process.exit(1);
  }
}
db.close();
