import crypto from "node:crypto";
import type express from "express";
import { hashToken } from "./cfo-auth.js";

/** Reads AGENT_TOKEN from the environment and returns its sha256 hash, or undefined if unset/empty. */
export function loadAgentTokenHash(): string | undefined {
  const token = process.env.AGENT_TOKEN;
  if (!token) return undefined;
  return hashToken(token);
}

function matches(header: string, expectedHash: string): boolean {
  const given = Buffer.from(hashToken(header), "utf8");
  const expected = Buffer.from(expectedHash, "utf8");
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

/** Requires header x-agent-token. 503 if unconfigured, 401 if missing, 403 if wrong. */
export function requireAgent(expectedHash: string | undefined): express.RequestHandler {
  return (req, res, next) => {
    if (expectedHash === undefined) {
      res.status(503).json({ error: "agent_token_not_configured" });
      return;
    }
    const header = req.header("x-agent-token");
    if (!header) {
      res.status(401).json({ error: "missing_agent_token" });
      return;
    }
    if (!matches(header, expectedHash)) {
      res.status(403).json({ error: "invalid_agent_token" });
      return;
    }
    next();
  };
}

/** Accepts a valid x-agent-token or a valid x-cfo-token. Refuses by default. */
export function requireAgentOrCfo(agentHash: string | undefined, cfoHash: string | undefined): express.RequestHandler {
  return (req, res, next) => {
    if (agentHash === undefined && cfoHash === undefined) {
      res.status(503).json({ error: "agent_token_not_configured" });
      return;
    }
    const agent = req.header("x-agent-token");
    const cfo = req.header("x-cfo-token");
    if (!agent && !cfo) {
      res.status(401).json({ error: "missing_token" });
      return;
    }
    if ((agent && agentHash !== undefined && matches(agent, agentHash)) || (cfo && cfoHash !== undefined && matches(cfo, cfoHash))) {
      next();
      return;
    }
    res.status(403).json({ error: "invalid_token" });
  };
}
