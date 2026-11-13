// Test helper: one simulated worker pass in its own process. argv: dbPath workerId startAtMs
import { createDb } from "../db.js";
import { runSimulationOnce } from "../worker.js";

const [dbPath, workerId, startAtMs] = process.argv.slice(2);
if (!dbPath || !workerId || !startAtMs) {
  console.error("usage: worker-runner <dbPath> <workerId> <startAtMs>");
  process.exit(2);
}
const db = createDb(dbPath);
while (Date.now() < Number(startAtMs)) {
  // busy-wait for a synchronized start
}
const outcomes = await runSimulationOnce(db, workerId);
console.log(JSON.stringify(outcomes.map((o) => ({ invoiceId: o.invoiceId, claimed: o.claimed, status: o.status }))));
db.close();
