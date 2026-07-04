"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewFlowForm({ projectId }: { projectId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [steps, setSteps] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const stepList = steps
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (stepList.length === 0) {
      setError("Add at least one step");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/flows", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, name, steps: stepList }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to create flow");
      }
      const flow = await res.json();
      router.push(`/flows/${flow.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-neutral-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-neutral-700"
      >
        New flow
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4">
      <div className="space-y-1.5">
        <label htmlFor="flow-name" className="block text-sm font-medium text-neutral-700">
          Flow name
        </label>
        <input
          id="flow-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Sign up flow"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="flow-steps" className="block text-sm font-medium text-neutral-700">
          Steps <span className="font-normal text-neutral-400">(one per line)</span>
        </label>
        <textarea
          id="flow-steps"
          required
          rows={6}
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          placeholder={"Go to /signup\nFill in the email field with test@example.com\nClick the Sign up button"}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-neutral-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create flow"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md px-3.5 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
