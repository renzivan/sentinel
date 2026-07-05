import { getDb } from "@/db/client";
import { projects } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default function Home() {
  const rows = getDb().select().from(projects).orderBy(desc(projects.id)).all();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
        <a
          href="/projects/new"
          className="rounded-md bg-brand px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          New project
        </a>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-10 text-center">
          <p className="text-sm text-neutral-500">No projects yet.</p>
          <a href="/projects/new" className="mt-2 inline-block text-sm font-medium text-neutral-900 hover:underline">
            Create your first project &rarr;
          </a>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
          {rows.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
              <div className="min-w-0">
                <a href={`/projects/${p.id}`} className="font-medium text-neutral-900 hover:underline">
                  {p.name}
                </a>
                <p className="truncate text-sm text-neutral-500">{p.baseUrl}</p>
              </div>
              <a
                href={`/projects/${p.id}`}
                className="shrink-0 rounded-md border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Open
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
