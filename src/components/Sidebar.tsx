"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { SidebarProject } from "@/db/queries";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform ${open ? "rotate-90" : ""}`}
      aria-hidden="true"
    >
      <path d="M7.5 5l5 5-5 5" />
    </svg>
  );
}

export default function Sidebar({ projects }: { projects: SidebarProject[] }) {
  const pathname = usePathname();

  const activeProjectId = (() => {
    const m = pathname.match(/^\/projects\/(\d+)/);
    if (m) return Number(m[1]);
    const fm = pathname.match(/^\/flows\/(\d+)/);
    if (fm) {
      const flowId = Number(fm[1]);
      const parent = projects.find((p) => p.flows.some((f) => f.id === flowId));
      return parent?.id ?? null;
    }
    return null;
  })();

  const activeFlowId = (() => {
    const m = pathname.match(/^\/flows\/(\d+)/);
    return m ? Number(m[1]) : null;
  })();

  const [expanded, setExpanded] = useState<Set<number>>(
    () => new Set(projects.map((p) => p.id)),
  );

  function toggle(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <aside className="hidden w-60 shrink-0 border-r border-neutral-200 bg-white lg:block">
      <div className="sticky top-14 flex h-[calc(100vh-3.5rem)] flex-col overflow-y-auto px-3 py-4">
        <div className="flex items-center justify-between px-2 pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Projects
          </span>
          <Link
            href="/projects/new"
            className="rounded-md px-1.5 py-0.5 text-sm font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            title="New project"
          >
            + New
          </Link>
        </div>

        {projects.length === 0 ? (
          <p className="px-2 py-3 text-sm text-neutral-400">No projects yet.</p>
        ) : (
          <nav className="space-y-0.5">
            {projects.map((p) => {
              const isOpen = expanded.has(p.id);
              const isActiveProject = p.id === activeProjectId;
              return (
                <div key={p.id}>
                  <div
                    className={`group flex items-center gap-1 rounded-md pr-1 ${
                      isActiveProject ? "bg-neutral-100" : "hover:bg-neutral-50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(p.id)}
                      className="flex items-center justify-center py-1.5 pl-1.5 pr-0.5"
                      aria-expanded={isOpen}
                      aria-label={isOpen ? `Collapse ${p.name}` : `Expand ${p.name}`}
                    >
                      <ChevronIcon open={isOpen} />
                    </button>
                    <Link
                      href={`/projects/${p.id}`}
                      className={`min-w-0 flex-1 truncate py-1.5 text-sm font-medium ${
                        isActiveProject ? "text-neutral-900" : "text-neutral-700"
                      }`}
                    >
                      {p.name}
                    </Link>
                    <Link
                      href={`/projects/${p.id}`}
                      className="rounded px-1.5 py-0.5 text-xs font-medium text-neutral-400 opacity-0 hover:bg-neutral-200 hover:text-neutral-700 focus:opacity-100 group-hover:opacity-100"
                      title={`New flow in ${p.name}`}
                    >
                      + flow
                    </Link>
                  </div>

                  {isOpen && (
                    <div className="mt-0.5 space-y-0.5 pb-1 pl-6">
                      {p.flows.length === 0 ? (
                        <p className="px-2 py-1 text-xs text-neutral-400">No flows yet.</p>
                      ) : (
                        p.flows.map((f) => {
                          const isActiveFlow = f.id === activeFlowId;
                          return (
                            <Link
                              key={f.id}
                              href={`/flows/${f.id}`}
                              className={`block truncate rounded-md px-2 py-1.5 text-sm ${
                                isActiveFlow
                                  ? "bg-brand-50 font-medium text-brand-700"
                                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                              }`}
                            >
                              {f.name}
                            </Link>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        )}
      </div>
    </aside>
  );
}
