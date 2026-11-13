import { loadAgentTokenHash } from "./agent-auth.js";
import { createApp } from "./app.js";
import { loadCfoTokenHash } from "./cfo-auth.js";
import { getDb } from "./db.js";
import { seedDefaults } from "./seed.js";

const db = getDb();
seedDefaults(db);

const cfoTokenHash = loadCfoTokenHash();
if (!cfoTokenHash) {
  console.warn("CFO_TOKEN not set: policy changes are disabled.");
}

const agentTokenHash = loadAgentTokenHash();
if (!agentTokenHash) {
  console.warn("AGENT_TOKEN not set: payment requests are disabled.");
}

const app = createApp(db, cfoTokenHash, agentTokenHash);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, "127.0.0.1", () => {
  console.log(`aegis-treasury-backend listening on http://127.0.0.1:${port}`);
});
