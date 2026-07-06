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

const TERMINAL = new Set(["passed", "failed", "error", "cancelled"]);

export function setRunStatus(runId: number, status: string, error?: string): void {
  const db = getDb();
  db.update(runs).set({
    status,
    error: error ?? null,
    ...(TERMINAL.has(status) ? { finishedAt: new Date() } : {}),
  }).where(eq(runs.id, runId)).run();
}

export type CancelResult = "cancelled" | "cancelling" | "already_terminal" | "not_found";

// Requesting a stop from the web process. A run that hasn't been claimed yet is
// cancelled outright (the worker only claims `queued` runs, so this one can
// never start). A running run can only be stopped cooperatively: flip the flag
// and let the worker — which owns the browser and agent subprocess — abort it
// and record the terminal status.
export function requestCancel(runId: number): CancelResult {
  const db = getDb();
  const run = db.select().from(runs).where(eq(runs.id, runId)).all()[0];
  if (!run) return "not_found";
  if (TERMINAL.has(run.status)) return "already_terminal";

  const cancelledQueued = db.update(runs)
    .set({ status: "cancelled", finishedAt: new Date() })
    .where(and(eq(runs.id, runId), eq(runs.status, "queued")))
    .returning().all();
  if (cancelledQueued.length) return "cancelled";

  // Not queued — it's running (or was claimed between the read and here).
  db.update(runs).set({ cancelRequested: true })
    .where(and(eq(runs.id, runId), eq(runs.status, "running")))
    .run();
  return "cancelling";
}

export function isCancelRequested(runId: number): boolean {
  const db = getDb();
  const row = db.select({ c: runs.cancelRequested }).from(runs).where(eq(runs.id, runId)).all()[0];
  return Boolean(row?.c);
}
