import { eq, desc, inArray, sql } from "drizzle-orm";
import { getDb } from "./client.js";
import { runs, stepResults, findings, artifacts, projects, flows } from "./schema.js";

// Total step tokens per run, for a set of run ids. Runs with no tracked step
// tokens are absent from the map (render as "—" rather than 0).
export function getRunTokenTotals(runIds: number[]): Map<number, number> {
  const totals = new Map<number, number>();
  if (runIds.length === 0) return totals;
  const rows = getDb()
    .select({ runId: stepResults.runId, total: sql<number>`sum(${stepResults.tokens})` })
    .from(stepResults)
    .where(inArray(stepResults.runId, runIds))
    .groupBy(stepResults.runId)
    .all();
  for (const r of rows) {
    if (r.total != null) totals.set(r.runId, Number(r.total));
  }
  return totals;
}

export type SidebarFlow = { id: number; name: string };
export type SidebarProject = { id: number; name: string; flows: SidebarFlow[] };

export function getProjectsWithFlows(): SidebarProject[] {
  const db = getDb();
  const projectRows = db.select().from(projects).orderBy(desc(projects.id)).all();
  const flowRows = db
    .select({ id: flows.id, name: flows.name, projectId: flows.projectId })
    .from(flows)
    .orderBy(desc(flows.id))
    .all();

  const byProject = new Map<number, SidebarFlow[]>();
  for (const f of flowRows) {
    const list = byProject.get(f.projectId) ?? [];
    list.push({ id: f.id, name: f.name });
    byProject.set(f.projectId, list);
  }

  return projectRows.map((p) => ({
    id: p.id,
    name: p.name,
    flows: byProject.get(p.id) ?? [],
  }));
}

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
