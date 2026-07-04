"use client";

import { useState } from "react";
import SeverityBadge from "@/components/SeverityBadge";
import { SEVERITY_ORDER } from "@/lib/severity";
import { runStatusClasses, runStatusDotClasses } from "@/lib/status";
import type { Severity } from "@/lib/types";

export type RunJson = {
  id: number;
  flowId: number;
  status: string;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
};

export type StepResultJson = {
  id: number;
  runId: number;
  stepIndex: number;
  stepText: string;
  status: string;
  aiSummary: string | null;
};

export type FindingJson = {
  id: number;
  runId: number;
  stepResultId: number | null;
  category: string;
  severity: Severity;
  title: string;
  detail: string | null;
  repro: string | null;
};

export type ArtifactJson = {
  id: number;
  runId: number;
  stepResultId: number | null;
  type: string;
  path: string;
};

export type RunBundle = {
  run: RunJson;
  steps: StepResultJson[];
  findings: FindingJson[];
  artifacts: ArtifactJson[];
};

function artifactUrl(path: string): string {
  return `/api/artifact?path=${encodeURIComponent(path)}`;
}

function formatDuration(startedAt: string | null, finishedAt: string | null): string {
  if (!startedAt) return "—";
  const start = new Date(startedAt).getTime();
  const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
  const ms = end - start;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function RunReport({ bundle }: { bundle: RunBundle }) {
  const { run, steps, findings, artifacts } = bundle;
  const [lightbox, setLightbox] = useState<string | null>(null);

  const severityCounts = SEVERITY_ORDER.map((sev) => ({
    severity: sev,
    count: findings.filter((f) => f.severity === sev).length,
  })).filter((s) => s.count > 0);

  const artifactsByStep = new Map<number, ArtifactJson[]>();
  for (const a of artifacts) {
    if (a.stepResultId == null) continue;
    const list = artifactsByStep.get(a.stepResultId) ?? [];
    list.push(a);
    artifactsByStep.set(a.stepResultId, list);
  }

  const findingsBySeverity = new Map<Severity, FindingJson[]>();
  for (const f of findings) {
    const list = findingsBySeverity.get(f.severity) ?? [];
    list.push(f);
    findingsBySeverity.set(f.severity, list);
  }

  const stepIndexByResultId = new Map<number, number>();
  for (const s of steps) stepIndexByResultId.set(s.id, s.stepIndex);

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium capitalize ${runStatusClasses(run.status)}`}
            >
              <span className={`h-2 w-2 rounded-full ${runStatusDotClasses(run.status)}`} />
              {run.status}
            </span>
            <span className="text-sm text-neutral-500">Run #{run.id}</span>
            <span className="text-sm text-neutral-500">{formatDuration(run.startedAt, run.finishedAt)}</span>
          </div>
          {severityCounts.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {severityCounts.map(({ severity, count }) => (
                <span key={severity} className="inline-flex items-center gap-1">
                  <SeverityBadge severity={severity} />
                  <span className="text-xs font-medium text-neutral-500">&times;{count}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        {run.error && (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {run.error}
          </p>
        )}
      </div>

      {/* Steps timeline */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900">Steps</h2>
        {steps.length === 0 ? (
          <p className="text-sm text-neutral-500">No step results yet.</p>
        ) : (
          <ol className="space-y-2">
            {[...steps]
              .sort((a, b) => a.stepIndex - b.stepIndex)
              .map((step) => {
                const shots = (artifactsByStep.get(step.id) ?? []).filter((a) => a.type === "screenshot");
                return (
                  <li key={step.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-neutral-400">#{step.stepIndex + 1}</span>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                              step.status === "passed"
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                : "border-red-300 bg-red-50 text-red-700"
                            }`}
                          >
                            {step.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-neutral-900">{step.stepText}</p>
                        {step.aiSummary && <p className="mt-1 text-sm text-neutral-500">{step.aiSummary}</p>}
                      </div>
                      {shots.length > 0 && (
                        <div className="flex shrink-0 gap-2">
                          {shots.map((shot) => (
                            <button
                              key={shot.id}
                              type="button"
                              onClick={() => setLightbox(artifactUrl(shot.path))}
                              className="overflow-hidden rounded-md border border-neutral-200 hover:border-neutral-400"
                              aria-label={`Enlarge screenshot for step ${step.stepIndex + 1}`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={artifactUrl(shot.path)} alt="" className="h-16 w-24 object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
          </ol>
        )}
      </div>

      {/* Findings */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900">Findings</h2>
        {findings.length === 0 ? (
          <p className="text-sm text-neutral-500">No findings — looks clean.</p>
        ) : (
          <div className="space-y-4">
            {SEVERITY_ORDER.filter((sev) => findingsBySeverity.has(sev)).map((sev) => (
              <div key={sev} className="space-y-2">
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={sev} />
                  <span className="text-xs text-neutral-400">
                    {findingsBySeverity.get(sev)!.length} finding
                    {findingsBySeverity.get(sev)!.length === 1 ? "" : "s"}
                  </span>
                </div>
                <ul className="space-y-2">
                  {findingsBySeverity.get(sev)!.map((f) => (
                    <li key={f.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-neutral-900">{f.title}</span>
                        <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500">
                          {f.category}
                        </span>
                        {f.stepResultId != null && stepIndexByResultId.has(f.stepResultId) && (
                          <span className="text-xs text-neutral-400">
                            step #{stepIndexByResultId.get(f.stepResultId)! + 1}
                          </span>
                        )}
                      </div>
                      {f.detail && <p className="mt-1.5 text-sm text-neutral-600">{f.detail}</p>}
                      {f.repro && (
                        <pre className="mt-1.5 overflow-x-auto rounded-md bg-neutral-50 p-2 text-xs text-neutral-600">
                          {f.repro}
                        </pre>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  );
}
