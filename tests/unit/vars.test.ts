import { describe, it, expect } from "vitest";
import { substituteVars, snapshotVars, type Var } from "@/lib/vars";

const vars: Var[] = [
  { key: "email", value: "test@x.com" },
  { key: "password", value: "hunter2" },
];

describe("substituteVars", () => {
  it("replaces known vars", () => {
    expect(substituteVars("login as {{email}} / {{password}}", vars))
      .toBe("login as test@x.com / hunter2");
  });
  it("leaves unknown vars untouched", () => {
    expect(substituteVars("go to {{unknown}}", vars)).toBe("go to {{unknown}}");
  });
});

describe("snapshotVars", () => {
  it("copies keys and values", () => {
    expect(snapshotVars(vars)).toEqual([
      { key: "email", value: "test@x.com" },
      { key: "password", value: "hunter2" },
    ]);
  });
  it("does not mutate the input", () => {
    const input: Var[] = [{ key: "password", value: "hunter2" }];
    const out = snapshotVars(input);
    out[0].value = "changed";
    expect(input[0].value).toBe("hunter2");
  });
});
