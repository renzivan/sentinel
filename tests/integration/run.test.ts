import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startFixture } from "../../fixtures/broken-app/server.mjs";
import { getDb } from "@/db/client";
import { runMigrations } from "@/db/migrate";
import { projects, flows, runs, findings } from "@/db/schema";
import { executeRun } from "@/worker/runner";
import { eq } from "drizzle-orm";

let fixture: { port: number; close: () => void };

beforeAll(async () => {
  process.env.DATABASE_PATH = "data/test-e2e.db";
  process.env.ENCRYPTION_KEY = "11".repeat(32);
  process.env.ARTIFACTS_DIR = "data/test-artifacts";
  delete process.env.ANTHROPIC_API_KEY;
  runMigrations();
  fixture = await startFixture(4599);
});
afterAll(() => fixture?.close());

describe("full run pipeline", () => {
  it("finds the broken data load", async () => {
    const db = getDb();
    const [p] = db.insert(projects).values({ name: "fixture", baseUrl: `http://localhost:${fixture.port}` }).returning().all();
    const [f] = db.insert(flows).values({
      projectId: p.id, name: "load data",
      steps: ["Verify the page shows the heading Welcome", "Click the 'Load data' button and check the data loads successfully"],
    }).returning().all();
    const [r] = db.insert(runs).values({ flowId: f.id }).returning().all();

    await executeRun(r.id);

    const run = db.select().from(runs).where(eq(runs.id, r.id)).all()[0];
    const found = db.select().from(findings).where(eq(findings.runId, r.id)).all();

    expect(run.status).toBe("failed");
    // A network 500 finding must be captured deterministically
    expect(found.some((x) => x.category === "network" && x.title.includes("500"))).toBe(true);
  }, 180000);
});
