// Choisit le dépôt de données selon DB_DRIVER, avec repli automatique
// sur la mémoire si SQL Server est demandé mais injoignable.

import { memoryRepo } from "./memory.js";
import { sqlServerRepo } from "./sqlserver.js";

export let repo = memoryRepo;
export let driverActif = "memory";

export async function initDb() {
  const driver = (process.env.DB_DRIVER || "memory").toLowerCase();

  if (driver === "sqlserver") {
    try {
      await sqlServerRepo.init();
      repo = sqlServerRepo;
      driverActif = "sqlserver";
      console.log("🗄️  Base : SQL Server connecté.");
      return;
    } catch (e) {
      console.warn(
        "⚠️  SQL Server injoignable, repli sur le mode mémoire.\n   →",
        e.message
      );
    }
  }

  await memoryRepo.init();
  repo = memoryRepo;
  driverActif = "memory";
  console.log("🧠  Base : mode mémoire (données non persistées).");
}
