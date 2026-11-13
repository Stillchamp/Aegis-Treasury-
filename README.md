# Aegis Treasury

**The CFO control layer for autonomous money.**

Let AI agents execute payments. Never let them set their own spending limits.

Aegis Treasury is a prototype for controlled autonomous supplier payments. Businesses can let AI agents request routine payments while finance teams retain control of spending limits, approved vendors and emergency pauses.

## MVP workflow

Our illustrative demo customer is Apex Auto Parts Ltd.

1. CFO sets a 20 XRP per-payment limit and 50 XRP daily limit.
2. AI agent requests a 12 XRP supplier payment. Aegis checks the policy and authorises permitted payments through a separate server-side signer.
3. Agent requests 35 XRP. Aegis rejects it because it exceeds the per-payment limit.
4. CFO changes spending policies through the dashboard. The AI agent cannot change its own limits.

**Security principle:** The AI agent must never receive the XRPL wallet's private key.

## Current project status

The repository currently contains the frontend dashboard generated with Google AI Studio.

**Technology stack:**
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS 4
- Motion
- Lucide React

The dashboard currently uses client-side state and seeded demo data in `components/treasury-context.tsx` and `lib/treasury-data.ts`.

**Note:** The backend, persistent database, MCP server and live XRPL payment integration are not yet implemented in this repository. Existing dashboard interactions are prototype behaviour, not confirmed blockchain transactions.

## Prerequisites

- Node.js 20.9+
- npm
- Git

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Stillchamp/Aegis-Treasury-.git
cd Aegis-Treasury-
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

macOS/Linux:

```bash
cp .env.example .env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Configure `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key
APP_URL=http://localhost:3000
```

Obtain your own Gemini API key from Google AI Studio. Never commit API keys or wallet secrets.

### 4. Run the application

```bash
npm run dev
```

Open http://localhost:3000.

## Available commands

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Project structure

```text
app/
  layout.tsx
  page.tsx
  globals.css

components/
  app-shell.tsx
  treasury-context.tsx
  screens/

hooks/

lib/
  treasury-data.ts
  utils.ts

public/
```

## Backend integration

Planned backend: Node.js, TypeScript, Express and SQLite.

XRPL integration: `xrpl.js` on XRP Ledger Testnet.

Planned MCP tools:

- `get_treasury_status`
- `get_spending_limits`
- `request_supplier_payment`
- `get_payment_status`

The AI agent must not have an `update_spending_limits` tool.

### Payment workflow

```text
AI Agent
   |
   v
Aegis API
   |
   v
Independent Policy Engine
   |
   +-- Check payment limit
   +-- Check daily limit
   +-- Check approved vendor
   +-- Check duplicate invoice
   |
   v
Server-side Signer
   |
   v
XRP Ledger Testnet
   |
   v
Audit Trail
```

### Security requirements

- Never expose wallet private keys to the frontend or AI agent.
- Enforce spending policies on the backend.
- Reject invalid requests before signing or submitting transactions.
- Prevent duplicate invoice payments.
- Record payment requests, policy decisions, transaction hashes and ledger statuses.
- Use Testnet only for the hackathon demo.

## Demo and submission checklist

- [ ] Execute an approved 12 XRP payment.
- [ ] Reject a 35 XRP payment.
- [ ] Demonstrate CFO-controlled spending limit changes.
- [ ] Show the transaction audit trail.
- [ ] Record and submit the required video demonstration.

## Team responsibilities

**Frontend:** Dashboard, UI components and API integration.

**Backend:** Express API, SQLite, policy engine, MCP tools, XRPL integration and server-side signing.

Agree on API request/response formats before integrating both sides.

---

*Hackathon prototype. Not a production treasury or custody service.*
