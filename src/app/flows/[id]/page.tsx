import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { flows, projects, runs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import FlowEditor from "@/components/FlowEditor";
import { runStatusClasses, runStatusDotClasses } from "@/lib/status";

export const dynamic = "force-dynamic";

function formatDuration(startedAt: Date | null, finishedAt: Date | null): string {
  if (!startedAt || !finishedAt) return "—";
  const ms = finishedAt.getTime() - startedAt.getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default async function FlowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const flowId = Number(id);
  const db = getDb();

  const flow = db.select().from(flows).where(eq(flows.id, flowId)).all()[0];
  if (!flow) notFound();

  const project = db.select().from(projects).where(eq(projects.id, flow.projectId)).all()[0];
  const pastRuns = db.select().from(runs).where(eq(runs.flowId, flowId)).orderBy(desc(runs.id)).all();

  return (
    <div className="space-y-8">
      <div>
        {project && (
          <a href={`/projects/${project.id}`} className="text-sm text-neutral-500 hover:underline">
            &larr; {project.name}
          </a>
        )}
        <h1 className="mt-1 text-xl font-semibold tracking-tight">{flow.name}</h1>
      </div>

      <FlowEditor flow={{ id: flow.id, name: flow.name, steps: flow.steps }} />

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900">Runs</h2>

        {pastRuns.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center">
            <p className="text-sm text-neutral-500">No runs yet. Click Run above to start one.</p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
            {pastRuns.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${runStatusClasses(r.status)}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${runStatusDotClasses(r.status)}`} />
                    {r.status}
                  </span>
                  <div className="text-sm text-neutral-500">
                    Run #{r.id}
                    {r.startedAt && (
                      <span className="ml-2">
                        {new Date(r.startedAt).toLocaleString()} · {formatDuration(r.startedAt, r.finishedAt)}
                      </span>
                    )}
                  </div>
                </div>
                <a
                  href={`/runs/${r.id}`}
                  className="shrink-0 rounded-md border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  View report
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
