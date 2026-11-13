import type { Db } from "./db.js";

export function seedDefaults(db: Db): void {
  const count = (table: string): number =>
    (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

  db.transaction(() => {
    if (count("spending_policy") === 0) {
      db.prepare(
        "INSERT INTO spending_policy (id, max_per_payment_xrp, max_per_day_xrp, updated_at) VALUES (1, ?, ?, ?)",
      ).run("20", "50", new Date().toISOString());
    }
    if (count("approved_vendors") === 0) {
      db.prepare(
        "INSERT INTO approved_vendors (vendor_id, name, xrpl_address, active) VALUES (?, ?, ?, 1)",
      ).run("apex-auto-parts", "Apex Auto Parts Ltd", "PLACEHOLDER_SET_LATER");
    }
  })();
}
