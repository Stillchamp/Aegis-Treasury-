import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { pathToFileURL } from "node:url";
import { z } from "zod";

export const TOOL_NAMES = [
  "get_treasury_status",
  "get_spending_limits",
  "request_supplier_payment",
  "get_payment_status",
] as const;

export interface McpConfig {
  baseUrl: string;
  agentToken: string | undefined;
  fetchImpl?: typeof fetch;
}

type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

const text = (value: unknown, isError = false): ToolResult => ({
  content: [{ type: "text", text: JSON.stringify(value) }],
  ...(isError ? { isError: true } : {}),
});

export function createMcpServer(config: McpConfig): McpServer {
  const doFetch = config.fetchImpl ?? fetch;
  const server = new McpServer({ name: "aegis-treasury", version: "0.1.0" });

  async function api(method: string, path: string, body?: unknown): Promise<{ status: number; json: unknown }> {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (config.agentToken) headers["x-agent-token"] = config.agentToken;
    const res = await doFetch(config.baseUrl + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, json: await res.json().catch(() => null) };
  }

  server.registerTool(
    "get_treasury_status",
    { description: "Current spending limits and execution mode. Payments are SIMULATED (testnet demo)." },
    async () => {
      const r = await api("GET", "/policy");
      if (r.status !== 200) return text({ error: "policy_unavailable", httpStatus: r.status }, true);
      return text({ policy: r.json, executionMode: "simulated" });
    },
  );

  server.registerTool(
    "get_spending_limits",
    { description: "Read the CFO-set spending limits (max per payment and per day, in XRP)." },
    async () => {
      const r = await api("GET", "/policy");
      return r.status === 200 ? text(r.json) : text({ error: "policy_unavailable", httpStatus: r.status }, true);
    },
  );

  server.registerTool(
    "request_supplier_payment",
    {
      description:
        "Request a payment to an approved supplier. The backend policy engine decides; the result is SIMULATED, not a ledger transaction.",
      inputSchema: {
        invoiceId: z.string().min(1).max(100),
        vendorId: z.string().min(1).max(100),
        amountXrp: z.string().max(100),
      },
    },
    async ({ invoiceId, vendorId, amountXrp }) => {
      const r = await api("POST", "/payments", { invoiceId, vendorId, amountXrp });
      return text({ httpStatus: r.status, result: r.json }, r.status !== 200 && r.status !== 409);
    },
  );

  server.registerTool(
    "get_payment_status",
    {
      description: "Status of a payment request by invoice id.",
      inputSchema: { invoiceId: z.string().min(1).max(100) },
    },
    async ({ invoiceId }) => {
      const r = await api("GET", `/payments/${encodeURIComponent(invoiceId)}`);
      return text({ httpStatus: r.status, result: r.json }, r.status !== 200 && r.status !== 404);
    },
  );

  return server;
}

async function main(): Promise<void> {
  const server = createMcpServer({
    baseUrl: process.env.AEGIS_API_URL ?? "http://127.0.0.1:4000",
    agentToken: process.env.AGENT_TOKEN,
  });
  await server.connect(new StdioServerTransport());
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : "mcp server failed");
    process.exit(1);
  });
}
