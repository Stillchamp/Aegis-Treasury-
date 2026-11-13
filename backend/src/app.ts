import express from "express";
import { z } from "zod";
import { InvalidAmountError, parseXrpToDrops } from "./amounts.js";
import { requireCfo } from "./cfo-auth.js";
import type { Db } from "./db.js";
import { submitPaymentRequest } from "./payments.js";

const amountField = z.string().refine(
  (v) => {
    try {
      parseXrpToDrops(v);
      return true;
    } catch (e) {
      if (e instanceof InvalidAmountError) return false;
      throw e;
    }
  },
  { message: "invalid_amount" },
);

const policyBody = z.object({ maxPerPaymentXrp: amountField, maxPerDayXrp: amountField });

const paymentBody = z.object({
  invoiceId: z.string().min(1).max(100),
  vendorId: z.string().min(1).max(100),
  amountXrp: z.string().min(0).max(100),
});

interface PolicyRow {
  max_per_payment_xrp: string;
  max_per_day_xrp: string;
  updated_at: string;
}

export function createApp(db: Db, cfoTokenHash?: string): express.Express {
  const app = express();
  app.use(express.json());

  const readPolicy = () => {
    const row = db
      .prepare("SELECT max_per_payment_xrp, max_per_day_xrp, updated_at FROM spending_policy WHERE id = 1")
      .get() as PolicyRow | undefined;
    if (!row) return undefined;
    return {
      maxPerPaymentXrp: row.max_per_payment_xrp,
      maxPerDayXrp: row.max_per_day_xrp,
      updatedAt: row.updated_at,
    };
  };

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "aegis-treasury-backend" });
  });

  app.get("/policy", (_req, res) => {
    const policy = readPolicy();
    if (!policy) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json(policy);
  });

  app.put("/policy", requireCfo(cfoTokenHash), (req, res) => {
    const parsed = policyBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "invalid_request", issues: parsed.error.issues.map((i) => i.path.join(".")) });
      return;
    }
    const { maxPerPaymentXrp, maxPerDayXrp } = parsed.data;
    const updated = db.transaction(() => {
      const old = readPolicy();
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO spending_policy (id, max_per_payment_xrp, max_per_day_xrp, updated_at)
         VALUES (1, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           max_per_payment_xrp = excluded.max_per_payment_xrp,
           max_per_day_xrp = excluded.max_per_day_xrp,
           updated_at = excluded.updated_at`,
      ).run(maxPerPaymentXrp, maxPerDayXrp, now);
      db.prepare("INSERT INTO audit_log (event_type, actor, payload, created_at) VALUES (?, 'cfo', ?, ?)").run(
        "policy.updated",
        JSON.stringify({ old: old ?? null, new: { maxPerPaymentXrp, maxPerDayXrp } }),
        now,
      );
      return readPolicy();
    })();
    res.json(updated);
  });

  app.post("/payments", (req, res) => {
    const parsed = paymentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "invalid_request", issues: parsed.error.issues.map((i) => i.path.join(".")) });
      return;
    }
    const result = submitPaymentRequest(db, parsed.data);
    res.status(result.status === "conflict" ? 409 : 200).json(result);
  });

  app.get("/payments/:invoiceId", (req, res) => {
    const row = db.prepare("SELECT * FROM payment_requests WHERE invoice_id = ?").get(req.params.invoiceId);
    if (!row) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json(row);
  });

  app.get("/audit", (_req, res) => {
    res.json(db.prepare("SELECT * FROM audit_log ORDER BY id DESC LIMIT 50").all());
  });

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = (err as { status?: number })?.status;
    if (status === 400) {
      res.status(400).json({ error: "invalid_json" });
      return;
    }
    console.error("internal error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ error: "internal_error" });
  });

  return app;
}
