import "./load-env.js";
import { runMigrations } from "../db/migrate.js";
import { claimNextRun } from "./queue.js";
import { executeRun } from "./runner.js";

const MAX = Number(process.env.MAX_CONCURRENT_RUNS ?? "1");
const POLL_MS = 2000;
const inflight = new Set<Promise<void>>();
let stopping = false;

async function tick() {
  while (!stopping && inflight.size < MAX) {
    const run = claimNextRun();
    if (!run) break;
    console.log(`[worker] claimed run ${run.id}`);
    const p = executeRun(run.id)
      .then(() => console.log(`[worker] finished run ${run.id}`))
      .catch((e) => console.error(`[worker] run ${run.id} crashed`, e))
      .finally(() => inflight.delete(p));
    inflight.add(p);
  }
}

async function main() {
  if (process.env.ANTHROPIC_API_KEY) {
    console.warn("[worker] WARNING: ANTHROPIC_API_KEY is set — runs will bill API credits, not subscription. Unset it to use the CLI subscription.");
    delete process.env.ANTHROPIC_API_KEY;
  }
  runMigrations();
  console.log(`[worker] started, MAX_CONCURRENT_RUNS=${MAX}`);
  process.on("SIGINT", () => { stopping = true; console.log("[worker] draining…"); });
  while (!stopping) {
    await tick();
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  await Promise.all([...inflight]);
  process.exit(0);
}

main();
