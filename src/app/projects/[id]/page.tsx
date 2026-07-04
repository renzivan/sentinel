import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { projects, flows } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import VarsEditor from "@/components/VarsEditor";
import NewFlowForm from "@/components/NewFlowForm";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectId = Number(id);
  const db = getDb();

  const project = db.select().from(projects).where(eq(projects.id, projectId)).all()[0];
  if (!project) notFound();

  const projectFlows = db
    .select()
    .from(flows)
    .where(eq(flows.projectId, projectId))
    .orderBy(desc(flows.id))
    .all();

  return (
    <div className="space-y-8">
      <div>
        <a href="/" className="text-sm text-neutral-500 hover:underline">
          &larr; Projects
        </a>
        <div className="mt-1 flex items-baseline justify-between">
          <h1 className="text-xl font-semibold tracking-tight">{project.name}</h1>
        </div>
        <p className="text-sm text-neutral-500">{project.baseUrl}</p>
      </div>

      <VarsEditor projectId={projectId} />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">Flows</h2>
        </div>

        {projectFlows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center">
            <p className="text-sm text-neutral-500">No flows yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
            {projectFlows.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
                <div className="min-w-0">
                  <a href={`/flows/${f.id}`} className="font-medium text-neutral-900 hover:underline">
                    {f.name}
                  </a>
                  <p className="text-sm text-neutral-500">
                    {f.steps.length} step{f.steps.length === 1 ? "" : "s"}
                  </p>
                </div>
                <a
                  href={`/flows/${f.id}`}
                  className="shrink-0 rounded-md border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Open
                </a>
              </li>
            ))}
          </ul>
        )}

        <NewFlowForm projectId={projectId} />
      </div>
    </div>
  );
}
