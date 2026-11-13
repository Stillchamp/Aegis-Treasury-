import crypto from "node:crypto";
import type express from "express";

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Reads CFO_TOKEN from the environment and returns its sha256 hash, or undefined if unset/empty. */
export function loadCfoTokenHash(): string | undefined {
  const token = process.env.CFO_TOKEN;
  if (!token) return undefined;
  return hashToken(token);
}

export function requireCfo(expectedHash: string | undefined): express.RequestHandler {
  return (req, res, next) => {
    if (expectedHash === undefined) {
      res.status(503).json({ error: "cfo_token_not_configured" });
      return;
    }
    const header = req.header("x-cfo-token");
    if (!header) {
      res.status(401).json({ error: "missing_cfo_token" });
      return;
    }
    const given = Buffer.from(hashToken(header), "utf8");
    const expected = Buffer.from(expectedHash, "utf8");
    if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
      res.status(403).json({ error: "invalid_cfo_token" });
      return;
    }
    next();
  };
}
