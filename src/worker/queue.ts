import { eq, asc, and } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { runs, type Run } from "../db/schema.js";

export function claimNextRun(): Run | null {
  const db = getDb();
  const candidate = db.select().from(runs)
    .where(eq(runs.status, "queued"))
    .orderBy(asc(runs.id)).limit(1).all()[0];
  if (!candidate) return null;
  // Atomic guard: only claim if still queued.
  const updated = db.update(runs)
    .set({ status: "running", startedAt: new Date() })
    .where(and(eq(runs.id, candidate.id), eq(runs.status, "queued")))
    .returning().all();
  return updated[0] ?? null;
}

const TERMINAL = new Set(["passed", "failed", "error"]);

export function setRunStatus(runId: number, status: string, error?: string): void {
  const db = getDb();
  db.update(runs).set({
    status,
    error: error ?? null,
    ...(TERMINAL.has(status) ? { finishedAt: new Date() } : {}),
  }).where(eq(runs.id, runId)).run();
}
