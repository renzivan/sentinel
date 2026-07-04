import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { getDb } from "./client.js";

export function runMigrations() {
  migrate(getDb(), { migrationsFolder: "drizzle" });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
  console.log("migrations applied");
}
