import "dotenv/config";
import express from "express";
import cors from "cors";
import { initDb, repo, driverActif } from "./db/index.js";
import produitsRouter from "./routes/produits.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true, db: driverActif }));

app.get("/api/stats", async (_req, res) => {
  try {
    res.json(await repo.stats());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.use("/api/produits", produitsRouter);

const PORT = process.env.PORT || 4000;

async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`🚀 API PIMP : http://localhost:${PORT}`);
  });
}

start();
