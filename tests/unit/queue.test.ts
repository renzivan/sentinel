import { describe, it, expect, beforeEach } from "vitest";
import { getDb } from "@/db/client";
import { runMigrations } from "@/db/migrate";
import { projects, flows, runs } from "@/db/schema";
import { claimNextRun, setRunStatus } from "@/worker/queue";
import { eq } from "drizzle-orm";

beforeEach(() => {
  process.env.DATABASE_PATH = ":memory:";
  process.env.ENCRYPTION_KEY = "11".repeat(32);
  runMigrations();
});

async function seedRun() {
  const db = getDb();
  const [p] = await db.insert(projects).values({ name: "p", baseUrl: "http://x" }).returning();
  const [f] = await db.insert(flows).values({ projectId: p.id, name: "f", steps: ["a"] }).returning();
  const [r] = await db.insert(runs).values({ flowId: f.id }).returning();
  return r;
}

describe("queue", () => {
  it("claims a queued run once, then returns null", async () => {
    await seedRun();
    const first = claimNextRun();
    expect(first?.status).toBe("running");
    expect(first?.startedAt).toBeTruthy();
    expect(claimNextRun()).toBeNull();
  });
  it("sets terminal status with finishedAt", async () => {
    const r = await seedRun();
    claimNextRun();
    setRunStatus(r.id, "passed");
    const db = getDb();
    const [row] = await db.select().from(runs).where(eq(runs.id, r.id));
    expect(row.status).toBe("passed");
    expect(row.finishedAt).toBeTruthy();
  });
});
