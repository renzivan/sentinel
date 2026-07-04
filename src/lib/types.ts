export type Category = "functional" | "console" | "network" | "visual";
export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type FindingInput = {
  category: Category;
  severity: Severity;
  title: string;
  detail?: string;
  repro?: string;
};

export type StepOutcome = {
  status: "passed" | "failed";
  summary: string;
  findings: FindingInput[];
};
