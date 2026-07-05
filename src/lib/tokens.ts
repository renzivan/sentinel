// Compact token count for UI badges: 812 → "812", 12_400 → "12.4K",
// 1_240_000 → "1.24M". Null/zero render as "—" so untracked (pre-feature)
// runs read as "no data" rather than a misleading 0.
const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

export function formatTokens(tokens: number | null | undefined): string {
  if (tokens == null || tokens === 0) return "—";
  return compact.format(tokens);
}

// Sum of step tokens for a run; null when no step reported any (untracked run).
export function sumTokens(steps: { tokens?: number | null }[]): number | null {
  let total = 0;
  let any = false;
  for (const s of steps) {
    if (s.tokens != null) {
      total += s.tokens;
      any = true;
    }
  }
  return any ? total : null;
}
