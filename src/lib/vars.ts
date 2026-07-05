export type Var = { key: string; value: string; isSecret: boolean };

export function substituteVars(text: string, vars: Var[]): string {
  return text.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (m, k) => {
    const v = vars.find((x) => x.key === k);
    return v ? v.value : m;
  });
}

export function maskSecrets(text: string, vars: Var[]): string {
  let out = text;
  for (const v of vars) {
    if (v.isSecret && v.value) out = out.split(v.value).join("***");
  }
  return out;
}

// Produce a storable copy of the resolved vars for a run's provenance record.
// Secret values are masked so plaintext secrets never land in the DB, matching
// the masking policy used for step text and findings.
export function snapshotVars(vars: Var[]): Var[] {
  return vars.map((v) => ({
    key: v.key,
    isSecret: v.isSecret,
    value: v.isSecret ? "***" : v.value,
  }));
}
