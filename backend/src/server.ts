import express from "express";
import { getDb } from "./db.js";

getDb();

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "aegis-treasury-backend" });
});

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "127.0.0.1";
app.listen(port, host, () => {
  console.log(`aegis-treasury-backend listening on http://${host}:${port}`);
});
