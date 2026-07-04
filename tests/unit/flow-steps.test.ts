import { describe, it, expect } from "vitest";
import { parseSteps } from "@/lib/flow-steps";

describe("parseSteps", () => {
  it("trims whitespace from each line", () => {
    expect(parseSteps("  go to /login  \n  click submit  ")).toEqual([
      "go to /login",
      "click submit",
    ]);
  });

  it("drops empty and whitespace-only lines", () => {
    expect(parseSteps("step one\n\n   \nstep two\n")).toEqual(["step one", "step two"]);
  });

  it("preserves order", () => {
    expect(parseSteps("a\nb\nc")).toEqual(["a", "b", "c"]);
  });

  it("returns an empty array for blank input", () => {
    expect(parseSteps("   \n  \n")).toEqual([]);
  });

  it("parses a raw textarea with a trailing blank line as equal to the saved steps array", () => {
    const saved = ["go to /login", "click submit"];
    const rawTextWithTrailingBlankLine = "go to /login\nclick submit\n";
    expect(parseSteps(rawTextWithTrailingBlankLine)).toEqual(saved);
  });
});
