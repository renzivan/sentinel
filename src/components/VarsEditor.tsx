"use client";

import { useEffect, useState } from "react";
import { buildVarsPayload } from "@/lib/vars-payload";

type VarRow = {
  key: string;
  value: string;
  isSecret: boolean;
  /** true if this row STARTED OUT as a stored secret; never cleared for the life of the row */
  wasSecret: boolean;
};

type ApiVar = { id: number; key: string; isSecret: boolean; value: string };

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
        setRows(
          data.map((v) => ({
            key: v.key,
            isSecret: v.isSecret,
            wasSecret: v.isSecret,
            value: v.isSecret ? "" : v.value,
          }))
        );
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
    setRows((prev) => [
      ...prev,
      { key: "", value: "", isSecret: false, wasSecret: false },
    ]);
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const trimmed = rows
        .filter((r) => r.key.trim().length > 0)
        .map((r) => ({ ...r, key: r.key.trim() }));
      const vars = buildVarsPayload(trimmed);
      const res = await fetch(`/api/projects/${projectId}/vars`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ vars }),
      });
      if (!res.ok) throw new Error("Save failed");
      // Reconcile local rows from what was actually sent, not from the pre-save
      // checkbox state: a row that stayed a preserved secret (blank + wasSecret)
      // is still a stored secret after this save even if "Secret" was unchecked,
      // so reflect that back rather than showing a state that doesn't match the server.
      setRows(
        trimmed.map((_row, idx) => {
          const sent = vars[idx];
          return {
            key: sent.key,
            value: sent.isSecret ? "" : sent.value,
            isSecret: sent.isSecret,
            wasSecret: sent.isSecret,
          };
        })
      );
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

      {rows.length === 0 ? (
        <p className="py-2 text-sm text-neutral-500">
          No variables yet. Use <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">{"{{key}}"}</code> in
          flow steps to reference them.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => {
            // A row that started out as a stored secret and is still blank keeps
            // its existing ciphertext no matter what the checkbox says (see
            // buildVarsPayload) -- so the UI must not imply unchecking or leaving
            // it blank will change or clear anything.
            const isUnchangedStoredSecret = row.wasSecret && row.value === "";
            return (
              <div key={i} className="space-y-1">
                <div className="flex items-center gap-2">
                  <input
                    value={row.key}
                    onChange={(e) => updateRow(i, { key: e.target.value })}
                    placeholder="key"
                    className="w-40 rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm font-mono outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                  />
                  <input
                    value={row.value}
                    onChange={(e) => updateRow(i, { value: e.target.value })}
                    type={row.isSecret ? "password" : "text"}
                    placeholder={isUnchangedStoredSecret ? "•••••• (enter a value to change)" : "value"}
                    className="flex-1 rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
                  />
                  <label className="flex shrink-0 items-center gap-1.5 text-xs text-neutral-600">
                    <input
                      type="checkbox"
                      checked={row.isSecret}
                      onChange={(e) => updateRow(i, { isSecret: e.target.checked })}
                      className="rounded border-neutral-300"
                    />
                    Secret
                  </label>
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    aria-label={`Remove ${row.key || "variable"}`}
                    className="shrink-0 rounded-md px-2 py-1 text-sm text-neutral-400 hover:bg-red-50 hover:text-red-600"
                  >
                    &times;
                  </button>
                </div>
                {isUnchangedStoredSecret && (
                  <p className="pl-[168px] text-xs text-neutral-400">
                    Stored secret unchanged &mdash; enter a value to change it.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save variables"}
        </button>
        {saved && <span className="text-sm text-emerald-600">Saved</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}
