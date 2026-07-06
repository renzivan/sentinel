// Loads .env for the standalone worker process.
// Next.js loads .env automatically for the web side, but this process is launched
// directly via tsx and would otherwise start with no MAX_CONCURRENT_RUNS / etc.
// Imported first (before any module that reads process.env at load time) so the side effect
// runs before the importing module's body evaluates.
import { existsSync } from "node:fs";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}
