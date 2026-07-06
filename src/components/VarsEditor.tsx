"use client";

import { useEffect, useState } from "react";

type VarRow = {
  key: string;
  value: string;
};

type ApiVar = { id: number; key: string; value: string };

export default function VarsEditor({ projectId }: { projectId: number }) {
  const [rows, setRows] = useState<VarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/vars`)
      .then((r) => r.json())
      .then((data: ApiVar[]) => {
        setRows(data.map((v) => ({ key: v.key, value: v.value })));
      })
      .catch(() => setError("Failed to load variables"))
      .finally(() => setLoading(false));
  }, [projectId]);

  function updateRow(i: number, patch: Partial<VarRow>) {
    setSaved(false);
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function removeRow(i: number) {
    setSaved(false);
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addRow() {
    setSaved(false);
    setRows((prev) => [...prev, { key: "", value: "" }]);
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const vars = rows
        .filter((r) => r.key.trim().length > 0)
        .map((r) => ({ key: r.key.trim(), value: r.value }));
      const res = await fetch(`/api/projects/${projectId}/vars`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ vars }),
      });
      if (!res.ok) throw new Error("Save failed");
      setRows(vars);
      setSaved(true);
    } catch {
      setError("Failed to save variables");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-500">Loading variables…</div>;
  }

  return (
    <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900">Variables</h2>
        <button
          type="button"
          onClick={addRow}
          className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
        >
          + Add variable
        </button>
      </div>

      {rows.length > 0 && (
        <p className="text-xs text-neutral-400">
          Note: variable values are stored as plain text and appear verbatim in run screenshots, findings,
          and logs. Don&apos;t put anything sensitive here.
        </p>
      )}

      {rows.length === 0 ? (
        <p className="py-2 text-sm text-neutral-500">
          No variables yet. Use <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">{"{{key}}"}</code> in
          flow steps to reference them.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={row.key}
                onChange={(e) => updateRow(i, { key: e.target.value })}
                placeholder="key"
                className="w-40 rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm font-mono outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
              />
              <input
                value={row.value}
                onChange={(e) => updateRow(i, { value: e.target.value })}
                placeholder="value"
                className="flex-1 rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                aria-label={`Remove ${row.key || "variable"}`}
                className="shrink-0 rounded-md px-2 py-1 text-sm text-neutral-400 hover:bg-red-50 hover:text-red-600"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save variables"}
        </button>
        {saved && <span className="text-sm text-emerald-600">Saved</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}
