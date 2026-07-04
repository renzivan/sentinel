export type RunStatus = "queued" | "running" | "passed" | "failed" | "error";

export const TERMINAL_RUN_STATUSES: RunStatus[] = ["passed", "failed", "error"];

export function isTerminalRunStatus(status: string): boolean {
  return (TERMINAL_RUN_STATUSES as string[]).includes(status);
}

export function runStatusClasses(status: string): string {
  switch (status) {
    case "passed":
      return "border-emerald-300 bg-emerald-50 text-emerald-700";
    case "failed":
    case "error":
      return "border-red-300 bg-red-50 text-red-700";
    case "running":
      return "border-blue-300 bg-blue-50 text-blue-700";
    case "queued":
    default:
      return "border-neutral-300 bg-neutral-50 text-neutral-600";
  }
}

export function runStatusDotClasses(status: string): string {
  switch (status) {
    case "passed":
      return "bg-emerald-500";
    case "failed":
    case "error":
      return "bg-red-500";
    case "running":
      return "bg-blue-500 animate-pulse";
    case "queued":
    default:
      return "bg-neutral-400";
  }
}
