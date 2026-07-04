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
