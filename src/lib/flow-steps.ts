/**
 * Single source of truth for turning flow-editor textarea text into a steps array:
 * split on newlines, trim each line, drop empty/whitespace-only lines.
 *
 * Used both when building the PATCH payload on save and when computing the
 * editor's "dirty" state, so a round-tripped save (which normalizes the text
 * the same way) never leaves dirty stuck true.
 */
export function parseSteps(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
