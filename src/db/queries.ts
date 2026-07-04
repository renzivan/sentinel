import { eq, desc } from "drizzle-orm";
import { getDb } from "./client.js";
import { runs, stepResults, findings, artifacts } from "./schema.js";

export function getRunBundle(runId: number) {
  const db = getDb();
  const run = db.select().from(runs).where(eq(runs.id, runId)).all()[0];
  if (!run) return null;
  return {
    run,
    steps: db.select().from(stepResults).where(eq(stepResults.runId, runId)).orderBy(stepResults.stepIndex).all(),
    findings: db.select().from(findings).where(eq(findings.runId, runId)).all(),
    artifacts: db.select().from(artifacts).where(eq(artifacts.runId, runId)).all(),
  };
}
