import type { Category, Severity } from "./types.js";

const ALL: Severity[] = ["critical", "high", "medium", "low", "info"];

export function normalizeSeverity(raw: string): Severity {
  const s = String(raw).toLowerCase().trim() as Severity;
  return ALL.includes(s) ? s : "info";
}

export function defaultSeverityFor(category: Category): Severity {
  switch (category) {
    case "functional": return "high";
    case "network": return "medium";
    case "console": return "medium";
    case "visual": return "low";
  }
}
