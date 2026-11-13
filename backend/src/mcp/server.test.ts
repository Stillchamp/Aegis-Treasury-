import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { createMcpServer, TOOL_NAMES } from "./server.js";

async function connect(fetchImpl: typeof fetch, agentToken = "test-agent-token-xyz") {
  const server = createMcpServer({ baseUrl: "http://stub", agentToken, fetchImpl });
  const client = new Client({ name: "test", version: "0.0.0" });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(a), client.connect(b)]);
  return client;
}

const stub = (calls: { url: string; headers: Record<string, string>; method: string }[] = []): typeof fetch =>
  (async (url: string, init?: RequestInit) => {
    calls.push({ url, method: init?.method ?? "GET", headers: init?.headers as Record<string, string> });
    return new Response(JSON.stringify({ status: "approved", maxPerPaymentXrp: "20" }), { status: 200 });
  }) as unknown as typeof fetch;

describe("MCP server", () => {
  it("exposes exactly the four tools and no write tool for limits", async () => {
    const client = await connect(stub());
    const names = (await client.listTools()).tools.map((t) => t.name).sort();
    expect(names).toEqual([...TOOL_NAMES].sort());
    expect(names.some((n) => /^(update|set|put|change)_/.test(n))).toBe(false);
    expect(names.some((n) => n.includes("limit") && n !== "get_spending_limits")).toBe(false);
  });

  it("request_supplier_payment sends the agent token to the API and does not leak it in the result", async () => {
    const calls: { url: string; headers: Record<string, string>; method: string }[] = [];
    const client = await connect(stub(calls));
    const res = await client.callTool({
      name: "request_supplier_payment",
      arguments: { invoiceId: "I-1", vendorId: "apex-auto-parts", amountXrp: "12" },
    });
    expect(calls[0]).toMatchObject({ url: "http://stub/payments", method: "POST" });
    expect(calls[0]?.headers["x-agent-token"]).toBe("test-agent-token-xyz");
    expect(JSON.stringify(res)).not.toContain("test-agent-token-xyz");
  });

  it("get_treasury_status and get_spending_limits read /policy only", async () => {
    const calls: { url: string; headers: Record<string, string>; method: string }[] = [];
    const client = await connect(stub(calls));
    await client.callTool({ name: "get_treasury_status", arguments: {} });
    await client.callTool({ name: "get_spending_limits", arguments: {} });
    expect(calls.map((c) => c.url)).toEqual(["http://stub/policy", "http://stub/policy"]);
  });
});
