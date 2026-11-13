# Aegis Treasury backend

**All payment execution in this backend is SIMULATED. The only signer is `SimulatedSigner`, and every transaction reference it returns starts with `SIM-`. There is no XRPL connection, no wallet, no faucet and no ledger transaction. An "executed" payment here is a database state, not an XRPL payment.**

Express + TypeScript API on SQLite, with a policy engine, a simulated execution worker and a local MCP server.

## Implemented

- **Policy engine.** Per-payment limit (default 20 XRP), daily limit (default 50 XRP), approved-vendor check, duplicate-invoice handling and strict amount validation (positive decimal, up to 6 places, stored as text and computed in drops, never floats). The CFO changes the limits through the API; the decision reads the stored policy row every time.
- **Durable refusals.** Refusals for unknown or inactive vendors are stored in `rejected_requests`, so replaying the same invoice returns the same refusal.
- **Payment lifecycle states.** `approved`, `executing`, `submitted`, `uncertain`, `executed`, `failed` (plus `rejected` for refusals). Only a confirmed failure (`failed`) releases daily budget; `uncertain` keeps it reserved. Claims use fencing tokens, and an expired lease becomes `uncertain`, never `approved`.
- **Atomic decisions.** Policy read, budget computation and insert run in one `BEGIN IMMEDIATE` transaction. If SQLite stays locked, the API answers 503 `lock_busy`, not a rejection.
- **CFO-protected `PUT /policy`** (header `x-cfo-token`).
- **Agent-protected `POST /payments`** (header `x-agent-token`).
- **MCP server with exactly four tools:** `get_treasury_status`, `get_spending_limits`, `request_supplier_payment`, `get_payment_status`. There is no tool that changes limits.
- **Simulated worker** that moves approved payments to `executed` with a `SIM-` reference. Execution is not reachable over HTTP.

## Not implemented

- Real XRPL Testnet execution
- Key isolation / real signer
- User login
- Dashboard authentication (the Next.js frontend does not call this backend yet)

## Known limits

- The CFO and agent tokens are shared secrets stored in environment files.
- The MCP host reads `AGENT_TOKEN` from its own environment, so whoever runs that host can read it. This is an open decision.
- Loopback binding plus the same OS user is a demo separation, not a security boundary.
- An invalid amount sent for an unknown vendor is stored with reason `invalid_amount`, not `unknown_or_inactive_vendor`.
- `executionMode` is `"none"` until the simulated worker has run for an invoice; only then does it read `"simulated"`.
- A refused invoice is final. A new attempt needs a new `invoiceId`.
- The concurrency tests spawn real processes and depend on timing (synchronized start); they are not a proof of correctness under all interleavings.
- `get_treasury_status` returns policy and execution mode only, because `GET /audit` needs the CFO token, which the MCP process does not hold.

## Run

```bash
cd backend
npm install
cp .env.example .env     # on Windows: copy .env.example .env
```

Edit `backend/.env` yourself. Set your own long random `CFO_TOKEN` and `AGENT_TOKEN`, and set `AEGIS_EXECUTION_MODE=simulation`. Never commit `.env`.

```bash
npm run dev                # API on 127.0.0.1:4000 (PORT overrides)
npm run worker:simulation  # one simulated execution pass; needs AEGIS_EXECUTION_MODE=simulation
npm run demo:simulation    # scripted scenario on backend/data/demo.db
npm run demo:video         # alias of demo:simulation (deletes only data/demo.db, never aegis.db)
npm test                   # unit, API, MCP and multi-process tests
```

The MCP server has no npm script. Run it over stdio with `node --import tsx src/mcp/server.ts`. It needs the API running, and reads `AGENT_TOKEN` and optionally `AEGIS_API_URL` (default `http://127.0.0.1:4000`) from its environment.

## API

| Route | Auth | Notes |
|---|---|---|
| `GET /health` | none | `{ status: "ok" }` |
| `GET /policy` | none | Current limits |
| `PUT /policy` | `x-cfo-token` | Body: `maxPerPaymentXrp`, `maxPerDayXrp`. 400 on invalid amounts |
| `POST /payments` | `x-agent-token` | Body: `invoiceId`, `vendorId`, `amountXrp`. 200 for approved or rejected (a business refusal is not an error), 409 for the same invoice with different details, 400 for a malformed body |
| `GET /payments/:invoiceId` | `x-agent-token` or `x-cfo-token` | 404 if unknown. Returns `executionMode` (`simulated` or `none`) and `txRef` |
| `GET /audit` | `x-cfo-token` | Last 50 audit rows |

Common auth responses: **401** header missing, **403** wrong token, **503** the token is not configured on the server (`agent_token_not_configured`, `cfo_token_not_configured`). **503 `lock_busy`** means the database lock timed out; nothing was written.

## Frontend notes

- `GET /payments/:invoiceId` returns `executionMode` (`"none"` until executed, then `"simulated"`) and `txRef` (always `SIM-` prefixed, never a ledger hash).
- `GET /audit` needs the CFO token (`x-cfo-token`).
- `POST /payments` needs `x-agent-token`.
- `PUT /policy` needs `x-cfo-token`.
- The CFO token must never go in `NEXT_PUBLIC_*` variables, URLs, logs or persistent storage. For the local demo, the human CFO may type it in manually and the page keeps it in memory only.
