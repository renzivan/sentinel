import { describe, it, expect } from "vitest";
import { normalizeSeverity, defaultSeverityFor } from "@/lib/severity";

describe("normalizeSeverity", () => {
  it("normalizes case", () => { expect(normalizeSeverity("HIGH")).toBe("high"); });
  it("falls back to info", () => { expect(normalizeSeverity("bogus")).toBe("info"); });
});
describe("defaultSeverityFor", () => {
  it("functional is high", () => { expect(defaultSeverityFor("functional")).toBe("high"); });
  it("visual is low", () => { expect(defaultSeverityFor("visual")).toBe("low"); });
});
