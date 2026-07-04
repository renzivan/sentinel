import type { Severity } from "@/lib/types";

const STYLES: Record<Severity, string> = {
  critical: "border-red-300 bg-red-100 text-red-800",
  high: "border-orange-300 bg-orange-100 text-orange-800",
  medium: "border-amber-300 bg-amber-100 text-amber-800",
  low: "border-slate-300 bg-slate-100 text-slate-700",
  info: "border-neutral-300 bg-neutral-100 text-neutral-600",
};

export default function SeverityBadge({ severity }: { severity: Severity }) {
  const classes = STYLES[severity] ?? STYLES.info;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${classes}`}>
      {severity}
    </span>
  );
}
