"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseSteps } from "@/lib/flow-steps";

type Flow = { id: number; name: string; steps: string[] };

function stepsEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export default function FlowEditor({ flow }: { flow: Flow }) {
  const router = useRouter();
  const [name, setName] = useState(flow.name);
  const [stepsText, setStepsText] = useState(flow.steps.join("\n"));
  const [savedName, setSavedName] = useState(flow.name);
  const [savedSteps, setSavedSteps] = useState(flow.steps);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const parsedSteps = parseSteps(stepsText);
  const stepsDirty = !stepsEqual(parsedSteps, savedSteps);
  const dirty = name !== savedName || stepsDirty;
  // Running always executes the currently-saved steps, so Run only needs the
  // saved steps to match what's parsed from the textarea right now (and at
  // least one step to exist) -- an unsaved name-only edit shouldn't block it.
  const canRun = parsedSteps.length > 0 && !stepsDirty;

  async function save() {
    const stepList = parsedSteps;
    if (stepList.length === 0) {
      setError("Add at least one step");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/flows/${flow.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, steps: stepList }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSavedName(name);
      setSavedSteps(stepList);
      setSaved(true);
      router.refresh();
    } catch {
      setError("Failed to save flow");
    } finally {
      setSaving(false);
    }
  }

  async function run() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(`/api/flows/${flow.id}/run`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to start run");
      const { runId } = await res.json();
      router.push(`/runs/${runId}`);
    } catch {
      setError("Failed to start run");
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4">
      <div className="space-y-1.5">
        <label htmlFor="flow-name" className="block text-sm font-medium text-neutral-700">
          Name
        </label>
        <input
          id="flow-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="flow-steps" className="block text-sm font-medium text-neutral-700">
          Steps <span className="font-normal text-neutral-400">(one per line)</span>
        </label>
        <textarea
          id="flow-steps"
          rows={10}
          value={stepsText}
          onChange={(e) => {
            setStepsText(e.target.value);
            setSaved(false);
          }}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty}
          className="rounded-md bg-brand px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={run}
          disabled={running || !canRun}
          title={!canRun ? "Save your changes before running" : undefined}
          className="rounded-md bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? "Starting…" : "Run"}
        </button>
        {saved && !dirty && <span className="text-sm text-emerald-600">Saved</span>}
        {dirty && <span className="text-sm text-neutral-400">Unsaved changes</span>}
      </div>
    </div>
  );
}
