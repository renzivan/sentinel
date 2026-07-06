export type Var = { key: string; value: string };

export function substituteVars(text: string, vars: Var[]): string {
  return text.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (m, k) => {
    const v = vars.find((x) => x.key === k);
    return v ? v.value : m;
  });
}

// Produce a storable copy of the resolved vars for a run's provenance record,
// so a later edit to the flow or project vars can't rewrite what a past run used.
export function snapshotVars(vars: Var[]): Var[] {
  return vars.map((v) => ({ key: v.key, value: v.value }));
}
